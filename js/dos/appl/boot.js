/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 bLAB
 **    $CREATED:     sbosse on 23-5-16.
 **    $VERSION:     1.3.5
 **
 **    $INFO:
 *
 *    Boot Service that is a monolithic application embeddeding all serviced programs.
 *
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var Sch = Require('dos/scheduler');
var Net = Require('dos/network');
var Conn = Require('dos/connection');

var My = {domain:'default',host:'none'};

var Operation = {
  CLEAR:'clear',
  DISABLE:'disable',
  ENABLE:'enable',
  EXECUTE:'exec',
  INFO:'info',
  INIT:'init',
  MAKEAPP:'makeapp',
  REFRESH:'refresh',
  START:'start',
  STOP:'stop'
}

var State = {
  OFFLINE:'offline',
  ONLINE:'online',
  UNINITIALIZED:'uninitialized',
  MAINTENANCE:'maintenance',
  DISABLED:'disabled',
  TEST:'test',
  WAIT:'wait'
}

var options = {
  app : '*',
  args : [],
  bip:'localhost',
  boot_ops : [],
  bootst : 'boot.state',
  bootsf : 'boot.conf',
  bport:3001,
  broker: true,
  dip : 'localhost',
  http:false,
  keepalive:true,
  monitor:0,
  prog : process.argv[1]||'?',
  tcpnet:1,
  verbose:0,
  vm : process.argv[0]||'node'
}

Comp.args.parse(process.argv,[
  [[
    Operation.CLEAR,
    Operation.DISABLE,
    Operation.ENABLE,
    Operation.INIT,
    Operation.INFO,
    Operation.MAKEAPP,
    Operation.REFRESH,
    Operation.START,
    Operation.STOP   
   ],
    0,function (val) {
      options.boot_ops.push(val)
    }],
  [Operation.EXECUTE,'*',function (vals) {
    options.boot_ops.push(Operation.EXECUTE); 
    options.app=Comp.array.head(vals);
    options.args=Comp.array.tail(vals);
  }],
  ['-conf',1,function (val) {options.bootsf=val}],
  ['-state',1,function (val) {options.bootst=val}],
  ['-broker',1,function(val){
    var tokens = Comp.string.split(':',val);
    if (tokens.length==1)
      options.bip=val;
    else {
      options.bip=tokens[0];      
      options.bport=Perv.int_of_string(tokens[1])
    }
  }],
  ['-dip',1,function(val){options.dip=val}],
  ['-D',1,function(val){options.dports.push(Perv.int_of_string(val))}],
  ['-L',2,function(val1,val2){options.links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])}],
  ['-nokeepalive',0,function(val){options.keepalive=false;}],
  ['-monitor',0,function() {options.monitor++;}],
  [['-v','-verbose'],0,function() {options.verbose++;}],
  ['-T',0,function(val){options.tcpnet=1;options.http=false;}],
  ['-T2',0,function(val){options.tcpnet=2;options.http=false;}],
  ['-H',0,function(val){options.http=true;options.tcpnet=0;}],
  function (val) {
    options.app=val;
  }
],2);

var verbose = !Comp.array.contains(options.boot_ops,Operation.EXECUTE);
var makeapp = Comp.array.contains(options.boot_ops,Operation.MAKEAPP);
var refresh = Comp.array.contains(options.boot_ops,Operation.REFRESH);
var start = Comp.array.contains(options.boot_ops,Operation.START);
options.privhostport = Net.uniqport();
options.pubhostport = Net.prv2pub(options.privhostport);

// console.log(process.argv)

if (Comp.array.empty(options.boot_ops)) {
    Io.out('usage: boot [-verbose -v -monitor -H -T -T2 -nokeepalive] ');
    Io.out('            [clear disable enable init makeapp refresh(reconf) start stop]');
    Io.out('            [-conf  <pathtoconffile>]  (default '+options.bootsf+')');
    Io.out('            [-state <pathtostatefile>] (default '+options.bootst+')');
    Io.out('            [<service>]');
    Io.out('            [exec <app> args...]');
    process.exit(-1);
} else if (Comp.array.contains(options.boot_ops,Operation.EXECUTE)) {
    Io.out('[BOOT] Executing '+options.app+' '+Comp.printf.list(options.args,_,' ')+' ..');
    process.argv=Comp.array.concat(['node',options.app],options.args);
    Require(options.app)
    return;
}

/** Main watchdog service loop. 
 *  1. Poll servers and records status
 *  2. Stops or restarts services
 *
 */
var watchdog = function (serv) {
  var self=this;
  
  this.serv = serv;  
  this.cap = null;
  this.down = false;
  this.dying = false;
  this.delay = serv.polltime||1000;   // Poll delay
  this.maxtimeout = 15000;  // Maximal time between a successfull repsonse and failures
  this.maxfailed = 5;       // Maximal number of failures before state is changed to maintenance
  this.maxrestart = 3;      // Maximal number of failed restarts
  
  this.init = function () {
    Io.out('[BOOT] Polling service '+serv.app+' with PID='+serv.process.pid+' with '+serv.pollcap);
    serv.status = Net.Status.STD_UNKNOWN;
    serv.timestamp = Io.time();
    serv.restart = 0;
    serv.failed = 0;
    if (Io.exists(serv.pollcap)) {
      this.cap = Net.cap_of_file(serv.pollcap);
      if (this.cap) {
        Io.out('[BOOT] Using poll capability '+Net.Print.capability(this.cap)+' for '+serv.app);
        serv.status = Net.Status.STD_OK;        
      } else Io.out('[BOOT] Invalid capability in '+serv.pollcap);
    } else Io.out('[BOOT] Not found: '+serv.pollcap);
  };
  
  this.poll = function () {
    var thr=this;
    if (!this.cap) return;
    switch (serv.state) {
      case State.ONLINE:
      case State.MAINTENANCE:
        //print('pollcap: '+Net.Print.capability(this.cap));
        Services.network.std.std_info(this.cap, function (stat) {
          //print('... pollcap: '+Net.Print.capability(self.cap));
          serv.status=stat;
          if (serv.status==Net.Status.STD_OK) serv.timestamp=Io.time();
          else {    
            serv.failed++;
            Io.out('[BOOT] Polling failed for '+serv.app+': '+Net.Print.status(serv.status));
          }
        });
        break;
    }
  };
  
  this.service = function () {
    var state=serv.state,t;
    switch (serv.state) {
      case State.ONLINE:
        if ((Io.time()-serv.timestamp) > this.maxtimeout || serv.failed > this.maxfailed) {
          serv.state=State.MAINTENANCE;
          Io.out('[BOOT] '+serv.app+': '+state+' -> '+serv.state);
        }
        break;
      case State.MAINTENANCE:
        Io.out('[BOOT] Stopping '+serv.app);
        serv.stop();
        serv.state=State.OFFLINE;
        this.cap=undefined;
        break;        
      case State.OFFLINE:
        if (serv.restart<this.maxrestart && serv.check()) {
          Io.out('[BOOT] Starting '+serv.app);
          serv.restart++;
          serv.start();
          Io.out('[BOOT] '+serv.app+': '+state+' -> '+serv.state);
          serv.timestamp = Io.time();
          serv.failed = 0;
        } else if (serv.restart>=this.maxrestart) {
          serv.state=State.DISABLED;
          Io.out('[BOOT] '+serv.app+' too often failed: '+state+' -> '+serv.state);          
        }
        break;        
    }    
    serv.status = Net.Status.STD_UNKNOWN;
  };
  
  this.sleep = function () {
    Delay(this.delay);
    if (!this.cap && serv.state==State.ONLINE && Io.exists(serv.pollcap)) {
      this.cap = Net.cap_of_file(serv.pollcap);
      if (this.cap) {
        Io.out('[BOOT] Using poll capability '+Net.Print.capability(this.cap)+' for '+serv.app);
        serv.status = Net.Status.STD_OK;        
      } else Io.out('[BOOT] Invalid capability in '+serv.pollcap);
    };    
  };
  this.terminate = function () {};
  
  this.transitions = [
      [undefined,this.init,function () {return serv.state==State.ONLINE}],
      [this.init,this.sleep],
      [this.poll,this.service, function (thr) {
        return serv.status == Net.Status.RPC_FAILURE }],
      [this.poll,this.sleep,  function (thr) {
        return serv.status != Net.Status.RPC_FAILURE }],
      [this.service,this.sleep],
      [this.sleep,this.poll, function () {
        return !this.dying && serv.state!=State.OFFLINE}],
      [this.sleep,this.service, function () {
        return !this.dying && serv.state==State.OFFLINE}],
      [this.sleep,this.terminate, function () {return this.dying}]
    ];
  this.on = {
  
  };
}

// console.log(boot_ops)

/***************
** SERVICES 
***************/

var services = function (options) {
  this.options=options;
  this.services=[];
};

services.prototype.add = function (options) {
  if (!options.trans || !options.app)
    Io.fail('[BOOT] Invalid service object '+Io.inspect(options));
  var serv=Service(options);
  this.services.push(serv);
  serv.services=this;
  Io.out('[BOOT] Adding service '+serv.info());
}


services.prototype.exec = function (op) {  
  Comp.array.iter(this.services,function (s) {
    var state=s.state,t,ready;
    if ((Comp.string.contains(s.app,options.app) || options.app=='*')) {
      switch (op) {
        case Operation.INFO:
          Io.out('[BOOT] '+s.app+' State='+s.state);        
          break;
        case Operation.MAKEAPP:
          s.state=State.TEST;
          Io.out('[BOOT] '+s.app+' doing '+op);
          t=s.start();
          if (t && t.wait) Io.sleep(t.wait);
          s.state=State.UNINITIALIZED;
          break;
        case Operation.INIT:
        case Operation.START:
          if (s.state==State.ONLINE) return;
          if (op==Operation.START && s.state==State.MAINTENANCE) return;
          if (op==Operation.INIT && s.state!=State.UNINITIALIZED) return;
          // if (s.state==State.DISABLED) state=s.state=State.OFFLINE;
          ready=s.check();
          if (ready) {
            Io.out('[BOOT] '+s.app+' doing '+op);
            s.start();            
          } else {
            Io.out('[BOOT] Warning: '+s.app+' has missing dependencie(s), cannot start!');
            s.state==State.OFFLINE;
          }
          break;
        case Operation.STOP:
        case Operation.DISABLE:
          if (s.state==State.ONLINE) {
            Io.out('[BOOT] Stopping '+s.app);
            s.stop();
          }
          if (op==Operation.DISABLE) {
            s.state=State.DISABLED;
            Io.out('[BOOT] '+s.app+' State '+state+' -> '+s.state);
          }
          break;
        case Operation.ENABLE:
          s.state=State.OFFLINE;
          Io.out('[BOOT] '+s.app+' State '+state+' -> '+s.state);
          break;
        case Operation.CLEAR:
          if (s.state==State.ONLINE) s.state=State.OFFLINE;
          if (s.state==State.OFFLINE) s.state=State.UNINITIALIZED;
          Io.out('[BOOT] '+s.app+' State '+state+' -> '+s.state);
          break;
      }
    }
  });
}

services.prototype.find = function (app) {
  return Comp.array.find(this.services, function (s) {
    return s.app==app;
  });        
}

services.prototype.read = function (file) {
  try {
    Io.out('[BOOT] Reading service file '+file+' ..');
    var text=Io.read_file(file);
    if (text==undefined) throw 'No such file';
    services=eval(text);
    if (Comp.obj.isArray(services))
      Comp.array.iter(services,this.add.bind(this));
  } catch (e) {
    Io.out('[BOOT] Reading or compiling of configuration file '+file+' failed: '+e);
    return;
  }
};

/***************
** SERVICE 
***************/
var service = function (options) {
  this.state=options.state||State.UNINITIALIZED;
  this.trans=options.trans;
  this.app=options.app;
  this.depends=options.depends;
  this.poll=options.poll||true;
  this.pollcap=options.pollcap;
  this.polltime=options.polltime;
}


var Service = function (options) {
  return new service(options);
}

/** Check dependencies. Return true if service is ready to be scheduled.
 *
 */
service.prototype.check = function () {
  var self=this,state=this.state,ready=true,S=this.services;

  if (!this.depends) return true;
  Comp.array.iter(this.depends,function (dep) {
    var serv=S.find(dep);
    if (serv) {
      ready=ready && (serv.state==State.ONLINE);
    } else {
      Io.out('[BOOT] Warning: Service '+self.app+' has unknwon dependency: '+dep);      
      ready=false;
    }
  });
  return ready;
}

service.prototype.info = function () {
  return this.app+': '+this.state;
}

/** Start a service. Searches a matching transition based on current state.
 */
service.prototype.start = function () {
  var self=this,_args=process.argv,trans;
  Comp.array.iter_break(this.trans, function (t) {
    var exit=false;
    if (Comp.array.contains(t.states,self.state)) {
      exit=true;
      trans=t;
    }
    return exit;
  });        
  if (!trans) return;
  if (Comp.array.contains(options.boot_ops,Operation.MAKEAPP)) {
    Io.out('[BOOT] Compiling '+this.app+' '+Comp.printf.list(trans.args,_,' ')+' ..');
    process.argv=Comp.array.concat(['node',this.app],trans.args);
    this.process=Require(this.app);
    process.argv=_args;
  } else {
    this.process=Io.fork(options.prog,Comp.array.concat(['exec',this.app],trans.args));
    Io.out('[BOOT] '+this.process.pid+': Started '+this.app+' '+Comp.printf.list(trans.args,_,' ')+' ..');
    switch (this.state) {
      case State.OFFLINE: 
      case State.UNINITIALIZED: 
        if (trans.wait) Io.sleep(trans.wait);
        this.state=State.ONLINE; break;
    }
  }
}

service.prototype.stop = function () {
  if (this.process) {
    Io.out('[BOOT] '+this.process.pid+': Stopping '+this.app+' ..');
    this.process.kill();
  }
  this.process=null;
  this.state=State.OFFLINE;
}

services.prototype.watchdog = function () {  
  this.network = Conn.setup(options);
  this.network.init(this.network.start.bind(this));
  Comp.array.iter(this.services,function (s) {
    if (s.state != State.TEST && s.pollcap) {
      Io.out('[BOOT] Adding watchdog service for '+s.app);
      Sch.NewTask('WATCHDDOG '+s.app,watchdog,s);
    }      
  });
}

services.prototype.write = function (file) {
  var services=[],
      text;
  Io.out('[BOOT] Writing service file '+file+' ..');
  Comp.array.iter(this.services,function (s) {
    var sc={app:s.app,trans:s.trans,state:s.state};
    if (s.poll) sc.poll=s.poll;
    if (s.pollcap) sc.pollcap=s.pollcap;
    if (s.polltime) sc.pollcap=s.polltime;
    if (s.depends) sc.depends=s.depends;
    services.push(sc);
  });
  text=JSON.stringify(services);
  Io.write_file(file,text);
}

My.host=Io.hostname();

var Services = new services({});
var scheduler = Sch.TaskScheduler();
scheduler.Init();

if (makeapp || refresh || !Io.exists(options.bootst))
  Services.read(options.bootsf);
else 
  Services.read(options.bootst);


process.on('SIGINT', function () {
  Io.out('Got SIGINT ..');
  Io.out('[BOOT] Stopping all services ..');
  Services.exec(Operation.STOP);
  Services.write(options.bootst);
  process.exit(2);
});

for (var cmd in options.boot_ops) {
  Services.exec(options.boot_ops[cmd]);
}

Services.write(options.bootst);

if (start) {
  Services.watchdog(); 
  scheduler.Run();
} else if (!makeapp) {
  Io.out('Exiting ..');
  process.exit(0);
} else Io.out('Waiting ..');
