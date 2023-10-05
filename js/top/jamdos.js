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
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     29-3-16 by sbosse.
 **    $VERSION:     1.4.24
 **
 **    $INFO:
 **
 **  JAM Standalone Node VM with DOS networking
 **
 **    $ENDOFINFO
 */

global.config={simulation:false,dos:true};

var Io = Require('com/io');
var Comp = Require('com/compat');
var Name = Require('com/pwgen');

var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Sch = Require('dos/scheduler');
var Conn = Require('dos/connection');
var Rpc = Require('dos/rpc');
var Std = Require('dos/std');
var Router = Require('dos/router');
var util =  require('util');
var assert = Comp.assert;
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Printf = Comp.printf;
var Filename = Comp.filename;
var Obj = Comp.obj;
var Args = Comp.args;
var Status = Net.Status;
var Command = Net.Command;
var Fs = require('fs');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Getenv = Require('com/getenv');
var HostSrv = Require('dos/hostsrv');
var Run = Require('dos/run');
var RunSrv = Require('dos/runsrv');
var Esprima = Require('parser/esprima');
var Json = Require('jam/jsonfn');
var satelize = Require('dos/ext/satelize');

var Db = Require('db/db');
var Aios = Require('jam/aios');
var Dios = Require('dos/dios');

Run.current(Aios);

var nameopts = {length:8, memorable:true, lowercase:true};

var options = {
  amp:false,
  aport:6000,
  bip:'localhost',
  bport:3001,
  broker:false,
  default:true,
  dip : 'localhost',
  domain: 'default',
  dports : [],
  env:{},
  geo:undefined,
  hostname:Io.hostname(),
  hostport:undefined,
  http:false,
  keepalive:true,
  links:[],
  myip:'localhost',
  monitor:0,
  nodename:Name.generate(nameopts),   // pre-guess
  onexit:false,
  scheduler:none,
  start:false,
  tcpnet:1,
  verbose:0,
  world:none
};

var out = function (msg) { Io.out('[JAM] '+msg)};

var BROKER=Io.getenv('BROKER','');
if (BROKER!='') {
  var tokens=String.split(':',BROKER);
  options.broker=true;
  options.http=true;
  options.bip=tokens[0];

  if (tokens.length==2) {
    options.bport=Perv.int_of_string(tokens[1]);
  }
}

var jam = function (options) {
  var main=this;
  this.options = options||{};
  this.env=this.options.env;
  this.verbose=options.verbose||0;

  // Name of host platform (computer), e.g., DNS IP name or IP address
  this.hostname=options.hostname;
  // Name of the JAM node
  this.nodename=options.nodename;
  this.domain=options.domain;

  this.out=function (msg) { Io.out('[JAM '+main.nodename+'] '+msg)};
  
  this.world = options.world||Aios.World.World([],{
    id:this.hostname,
    classes:options.classes||[],
    verbose:options.verbose
  });
  this.node = Aios.Node.Node({
    id:this.nodename,
    out:this.out,
    position:{x:0,y:0},
    verbose:options.verbose
  },true);
  this.world.addNode(this.node);
  this.run=false;
  this.looprun=none;


  this.broker=options.http||options.tcpnet;
  this.bport=options.bport||3001;
  this.bip=options.bip;
  
  this.options.privhostport=Net.uniqport();
  this.options.pubhostport = Net.prv2pub(this.options.privhostport);
  
  this.scheduler = options.scheduler||Sch.TaskScheduler;
  this.network = options.network||Conn.setup(options,1);
  this.router = this.network.router;
  // this.router.log(2);
  // network.XX uses global scheduler
  this.rpc = this.network.rpc;
  this.std = this.network.std;
  this.dns = this.network.dns;
  this.cs = this.network.cs;
  this.dios = Dios.Dios(this.network.rpc,this.network.env);
  Aios.current.network=this.network;

  // Aios.options.verbose=1;

  // Register a DOS link-connection for agent and signal migration 
  this.network.register(this.node);
  /*
  this.node.connections.dos = {
    // OLDCOMM send: function (text,dest,context) {
    send: function (msg) { // NEWCOMM
      var text=msg.agent||msg.signal;
      main.node.connections.dos.count += text.length;
      if (Obj.isObject(msg.to)) // cap
      {
        var stat;
        // This schedule block must by passed to the global (DOS) scheduler!!
        Sch.B([
          function () {
            main.network.run.ps_migrate(msg.to,text,function (_stat) {              
              stat=_stat;
            });
          },
          function () {          
            if (stat!=Net.Status.STD_OK) {
              // context???
              msg.context.error='Migration to server '+Net.Print.capability(msg.to)+' failed: '+Net.Print.status(stat);
              // We're still in the agent process context! Throw an error for this agent ..
              throw 'MOVE';              
            };
            
            // kill ghost agent
            msg.context.process.finalize();
          }  
        ]);      
      } else if (Obj.isString(msg.to)) { // path
      
      }
    },
    status: function () {
      // TODO
      return main.network.status()==Net.Status.STD_OK;
    },
    count:0
  }
  */
  this.hostsrv=none; // requires router init., created on initialization

  this.todo=[];

  this.exit = [];
  
  this.amp=options.amp;
  this.aport=options.aport||6000;

  /* Install HOST/DNS tuple provider
  ** Expected patterns: 
  **  DNS,path,?
  **  DOMAIN,?
  **  HOSTNAME,?
  */
  
  this.node.ts.register(function (pat) {
    var stat,tuple;
    // Caching?
    if (pat.length<2) return none;
    switch (pat[0]) {
      case 'DNS':
        if (pat.length<3) return none; else Sch.B([
          function () {
            main.dios.dir(pat[1],function (rows,_stat) {
              stat=_stat;
              if (stat==Status.STD_OK) tuple=[pat[0],pat[1],Comp.array.filtermap(rows,function (row) {
                if (row.stat==Status.STD_OK) return {name:row.name,cap:Net.Print.capability(row.cap)};
                else return none;
              })];
            })
          },
          function () {
            // console.log('>> '+Status.print(stat));
            if (stat==Status.STD_OK)
              main.node.ts.checkwaiter(tuple);
          } 
        ]);
        break;
      case 'HOSTNAME': return ['HOSTNAME',main.hostname];
      case 'NODENAME': return ['NODENAME',main.nodename];
      case 'DOMAIN': return ['DOMAIN','default'];
    }
    // console.log(Sch.GetCurrent())
    return none;
  });  
}

// Import analyzer class...
var JamAnal = Require('jam/analyzer');
JamAnal.current(Aios);
jam.prototype.analyze=JamAnal.jamc.prototype.analyze;
jam.prototype.syntax=JamAnal.jamc.prototype.syntax;

// Run server extension
RunSrv.current(Aios);
jam.prototype.request=RunSrv.run.prototype.request;

/** Add an agent class template {<ac name>:<ac constructor fun>} to the JAM world
 *
 */
jam.prototype.addClass = function (templates) {
  for (var p in templates) {
    if (this.options.verbose>0) this.out((this.world.classes[p]?'Updating':'Adding')+' agent class template '+p+'.');
    this.world.classes[p]=[
      Aios.Code.makeSandbox(templates[p],0),
      Aios.Code.makeSandbox(templates[p],1),
      Aios.Code.makeSandbox(templates[p],2),
      Aios.Code.makeSandbox(templates[p],3)      
    ]
  }
};


/** Create and start an agent from class ac with arguments.
 *
 */
jam.prototype.create = function (ac,args) {
  var node=this.node;
  var agent=none;
  if (this.world.classes[ac])
    agent = Aios.Code.createOn(node,this.world.classes[ac],args);
  else this.out('create: Cannot find agent class '+ac);
  if (agent) {
    if (this.options.verbose>0) this.out('Created agent '+agent.agent.id+' from class template(s) '+ac);
    agent.agent.ac=ac;
    return agent.agent.id; 
  } else return none;
}


/** Initialize JAMDOS and create/start host server
 *
 */
jam.prototype.init=function () {
  var self=this,
      stat,
      cs,
      csrow,
      csdir,
      i,
      names=[];


  satelize.satelize({}, function(err, geoData) {
    // process err
    if (err != undefined) {
        self.out('GEO Location failed: '+err)
    } else if (geoData) {
      try {
        var obj = JSON.parse(geoData);
        self.out('GEO Location (lati=' + obj.lat + ', long=' + obj.lon + ')');
        options.geo=obj;
      } catch (e) {
        if (options.verbose>1) self.out('GEO Location failed: '+e+',\n'+geoData);
        else self.out('GEO Location not available: '+e);
      }
    }
  });

  for(i=0;i<10;i++) names.push(Name.generate(nameopts));
  
  this.todo.push([
    function () {
      // Append default DNS and root directory
      var dnscs;
      if (self.env.rootdir) {
        dnscs = self.env.rootdir;
        self.hostsrv.append('/dns/default', dnscs, function (_stat) {stat=_stat});
        if (stat != Status.STD_OK) self.out('Cannot append ' + 'dns/default' + ': ' + Status.print(stat));
        self.hostsrv.append('/root', dnscs, function (_stat) {stat=_stat});
        if (stat != Status.STD_OK) self.out('Cannot append ' + 'root' + ': ' + Status.print(stat));
      }
    },
    function () {
      // Check for default domain ...
      self.hostsrv.lookup('/root/domains/'+self.domain, function (_stat,_cs) {
        if (self.options.verbose>0) self.out('lookup /root/domains/'+self.domain+': '+Status.print(_stat))
        stat=_stat;
        csdir=_cs;
      });  
    },
    function () {
      if (stat==Status.STD_OK) Sch.ScheduleLoop(
        function () {
          return names.length>0;
        },
        [
          function () {
            // Check for node in default domain ...
            self.hostsrv.lookup('/root/domains/'+self.domain+'/'+self.nodename, function (_stat,_cs) {
              if (self.options.verbose>0) self.out('lookup /root/domains/'+self.domain+'/'+self.nodename+': '+Status.print(_stat))
              stat=_stat;
              cs=_cs;
            });  
          },
          function () {
            // Try to remove remains of node in default domain (2)
            if (stat==Status.RPC_FAILURE) {
              self.hostsrv.delete('/root/domains/'+self.domain+'/'+self.nodename,
                function (_stat) {
                  if (self.options.verbose>0)  self.out('delete /root/domains/'+self.domain+'/'+self.nodename+': '+Status.print(_stat))
                  stat=_stat;
                }
              ); 
            }
          },
          function () {
            // Try to register node in default domain (3)
            
            if (stat==Status.STD_NOTFOUND || stat==Status.STD_OK) {
              self.hostsrv.append('/root/domains/'+self.domain+'/'+self.nodename, self.hostsrv.hostcap,
                function (_stat) {
                  self.out('Published /domains/'+self.domain+'/'+self.nodename+': '+Status.print(_stat))
                  stat=_stat;
                }
              ); 
            } 
          },
          function () {
            if (stat==Status.STD_OK) names=[];  // Done
            else {
              self.nodename=Array.head(names);
              names=Array.tail(names);
            }
          }
        ], 
        [
          function () {
          self.out('My final domain name is '+self.hostname+'.'+self.nodename);
          }
        ]
      );
    }
  ]);
  B(Comp.array.flatten(this.todo));
//  if (0) 
  this.exit.push([
    function () {
      self.hostsrv.delete('/root/domains/'+self.domain+'/'+self.nodename,
         function (_stat) {
           self.out('Unpublished /root/domains/'+self.domain+'/'+self.nodename+': '+Status.print(_stat))
           stat=_stat;
         }
       );     
    }
  ]);
  this.hostsrv=HostSrv.HostServer(this.scheduler,
                               this.rpc,
                               this.options,
                               'JAM.'+this.hostname+'.'+this.nodename,
                               this.env);
    // Register our request handler and make a link back to our class handler
  this.hostsrv.register(this.request);
  this.hostsrv.addClass=function (ac) {
      self.addClass(ac);
    };
  this.hostsrv.getclass=function (classname) {
      return self.world.classes[classname];
    };
  this.hostsrv.receive=function (code,start) {
      self.node.receive(code,start);
    };
  if (options.geo) myJam.hostsrv.set_geo(options.geo);
  if (this.amp) {
    this.startamp();    
  }  
}

/** Read and compile agent class templates from file
 *
 */
jam.prototype.readclass = function (file) {
  var ac,
      text,
      modu,
      p,
      regex1,
      ast=null,
      all=null,
      off=null;

  if (this.options.verbose>0) this.out('Looking up agent class template(s) from '+file);
  modu=Require(file);
  if (Comp.obj.isEmpty(modu)) {
    if (this.options.verbose>0) this.out('Reading agent class template(s) from file '+file);
    if (Comp.string.get(file,0)!='/') file = './'+file;
    modu=require(file);
    all=Io.read_file(file);
    ast=Esprima.parse(all, { tolerant: true, loc:true });
  }
  for (p in modu) {
    ac={};
    ac[p]=modu[p];
    if (all) off=this.syntax.find(ast,'VariableDeclarator',p);
    if (off && off.loc) this.syntax.offset=off.loc.start.line-1;
    content = 'var ac = '+modu[p];
    syntax = Esprima.parse(content, { tolerant: true, loc:true });
    this.analyze(syntax,{classname:p,level:2});
    text=Json.stringify(ac);
    regex1= /this\.next=([a-zA-Z0-9_]+)/;
    text=text.replace(regex1,"this.next='$1'");
    // console.log(text);
    ac=Json.parse(text,{});    
    this.addClass(ac);
    this.syntax.offset=0;
  }
};


/** Start the JAM scheduler
 *
 */
jam.prototype.start=function () {
  var proc,self=this;
  this.run=true;
  // Start up the network ..
  this.network.init(function (stat) {self.network.start()});
}


/** Start AMP service port
 */
jam.prototype.startamp = function () {
  var self=this;
  var ip = 'localhost';
  this.out('Starting AMP server on port '+this.aport);
  this.amp = Aios.Chan.Amp({rcv:ip+':'+this.aport,snd_ip:ip,verbose:this.options.verbose});
  this.amp.receiver(function (handler) {
      var code,agentid,stat,text;
      if (!handler) return;
      if (self.options.verbose>0) { self.out('AMP: got request:'); console.log(handler) };
      switch (handler.cmd) {
        case Net.Command.PS_EXEC:
          code = Buf.buf_get_string(handler.buf);
          // console.log(code);
          // console.log(myJam.amp.url(handler.remote))
          self.node.receive(code,true);
          break;
        case Net.Command.PS_MIGRATE:
          code = Buf.buf_get_string(handler.buf);
          // console.log(code);
          // console.log(myJam.amp.url(handler.remote))
          self.node.receive(code,false);
          break;
        case Net.Command.PS_STUN:
          agentid = Buf.buf_get_string(handler.buf);
          stat=Aios.kill(agentid);
          if (stat) self.out('Agent '+agentid+' terminated.');
          break;
        case Net.Command.PS_WRITE:
          text = Buf.buf_get_string(handler.buf);
          ac=Json.parse(text,{}); 
          // console.log(ac)   
          self.addClass(ac);
          break;
      }
    });
}

/** Stop the JAM scheduler
 * 
 */
jam.prototype.stop=function () {
  this.run=false;
  this.out('Stopping ..');
  if (this.looprun)
    clearTimeout(this.looprun);
}


var Jam = function(options) {
  var obj = new jam(options);
  return obj;
};

// --------------------------------- //

function usage() {
  var msg='';
  msg += ' jam [options]'+NL;
  msg += ' -c <agentclass>.js : Load an agent class template from file'+NL;
  msg += ' -r <agentclass> [<arg>,<arg>,..] : Create an agent from a class template'+NL;
  msg += ' -s                 : Start scheduler loop'+NL;
  msg += ' -d -default        : Ask broker for default DNS'+NL;
  msg += ' -broker <ip[:port]>: Broker HTTP IP Address and optional Port (default: 3001)'+NL;
  msg += ' -A <port>          : Start AMP service on specified port'+NL;
  msg += '  [-H -T -T2]  Enable HTTP or TCPNET Broker connection'+NL;
  msg += '    T: TCPIP, 1-ch H:HTTP T2: TCPIP, 2-ch'+NL;
  msg += '    H: bport, T: bport+100'+NL;
  msg += '   (Default: -T)'+NL;
  msg += '  [-broker <ip[:ipport]>]  Broker URL (Default: '+options.bip+': HTTP '+options.bport+' TCPNET '+(options.bport+100)+')'+NL;
  msg += '  [-D <port>] UDP Server port'+NL;
  msg += '  [-L <src port> <UDP dst [address:]port] UDP P2P Connection'+NL;
  msg += '  [-dip <UDP server IP>] (Default: '+options.dip+')'+NL;
  msg += '  [-host <port>] Set Host Port'+NL;
  msg += '  [-root <cap|capfile>] Set Root Cap.'+NL;
  msg += '  [+root <cap|capfile>] Appennd Root Cap.'+NL;
  msg += ' -v                 : Increase verbosity level'+NL;
  msg += ' -monitor           : Increase RPC router monitoring level'+NL;
  msg += ' -h -help --help    : Print this help'+NL;
  msg += ' Environment Variable(s): BROKER=ip[:ipport]'+NL;
  Io.out('[JAM] Usage: '+msg);  
  options.onexit=true;
}

Comp.args.parse(Io.getargs(),[
  [['-h','-help','--help'],0,function () {usage()}],
  ['-v',0,function () {options.verbose++; out('Setting verbosity to level '+options.verbose); config.verbose=true;}],
  ['-monitor',0,function () {options.monitor++; out('Setting monitor to level '+options.monitor); }],
  ['-s',0,function () {options.start=true;}],
  [['-default','-d'],0,function(val){options.default=true;}],
  ['-A',1,function (port) {
    options.amp=true;
    options.aport=port;
  }],
  ['-broker',1,function(val){
    var tokens = Comp.string.split(':',val);
    if (tokens.length==1)
      options.bip=val;
    else {
      options.bip=tokens[0];      
      options.bport=Perv.int_of_string(tokens[1])
    }
    this.broker=true;
  }],
  ['-dip',1,function(val){options.dip=val}],
  ['-D',1,function(val){options.dports.push(Perv.int_of_string(val))}],
  ['-L',2,function(val1,val2){options.links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])}],
  ['-nokeepalive',0,function(val){options.keepalive=false;}],
  ['-T',0,function(val){options.tcpnet=1;options.http=false;}],
  ['-T2',0,function(val){options.tcpnet=2;options.http=false;}],
  ['-H',0,function(val){options.http=true;options.tcpnet=0;}]
]);

// >>
var scheduler = Sch.TaskScheduler();
options.scheduler = scheduler;
var myJamWorld = Aios.World.World([],{
    classes:options.classes||[],
    id:options.hostname,
    scheduler:scheduler,
    verbose:options.verbose
  });
options.world=myJamWorld;
var myJam = Jam(options);
Aios.current.scheduler=scheduler;
// <<

Comp.args.parse(Io.getargs(),[
  ['-c',1,function (file) {
    if (global.DEBUG)
     myJam.readclass(file);
    else try {
      myJam.readclass(file)
    } catch (e) {
      myJam.out('Compilation failed: '+e+'.');
      Io.printstack(e)
      Io.exit();
    }
  }],
  ['-r',2,function (ac,args) {
    try {
      if (args.length < 2) args='[]';
      var _args = Comp.array.map(Comp.string.split(',',Comp.string.trim(args,1,1)),function (arg) {
        try {var num=Number(arg); if (isNaN(num)) return arg; else return num;}
        catch (e) {return arg }
      });
      myJam.create(ac,_args)
    } catch (e) {
      myJam.out('Failed to start agent '+ac+' '+args);
    }
  }],
  [['-root'],1,function(val) {
        cap = Net.Parse.capability(val, 0);
        if (cap != undefined) {
            myJam.env.rootdir = this.cs.cs_singleton(cap.cap);
            if (myJam.env.workdir == undefined) myJam.env.workdir = myJam.env.rootdir;
        } else {
            /*
            ** Capabiliy file path?
             */
            cap = Net.cap_of_file(val);
            myJam.env.rootdir = myJam.cs.cs_singleton(cap);
            if (myJam.env.workdir == undefined) myJam.env.workdir = myJam.env.rootdir;
            if (cap) myJam.out ('Got root capability from file '+val);
        }
    }],
  [['+root'],1,function(val) {
        var dnscap,dnscs;
        dnscap = Net.Parse.capability(val, 0);
        if (dnscap == undefined) {
            /*
             ** Capabiliy file path?
             */
            dnscap = Net.cap_of_file(val);
            if (dnscap) myJam.out ('Got root capability from file '+val);
        } else dnscap=dnscap.cap;
        if (dnscap != undefined) {            
            myJam.todo.push([
                function () {
                  var name = Net.Print.port(dnscap.cap_port);
                  dnscs = myJam.cs.cs_singleton(dnscap);
                  myJam.out('Append DNS ROOT: ' + Net.Print.capability(dnscap));
                  myJam.hostsrv.append('dns/'+name, dnscs, function (_stat){stat=_stat});
                  if (stat != Status.STD_OK) myJam.out('Cannot append dns/' + name + ': ' + Status.print(stat));
                  hostsrv.append('dns/default', dnscs, function (_stat){stat=_stat});
                  if (stat != Status.STD_OK) myJam.out('Cannot append dns/default: ' + Status.print(stat));
                },
                function () {
                   if (dnscs != undefined && myJam.env.afs_def==undefined) {
                        myJam.dns.dns_getdefafs(dnscs,function(_stat,_cap) {
                            maJam.out('Default AFS: '+Status.print(_stat)+' is '+ Net.Print.capability(_cap));
                            if (_stat==Status.STD_OK) {
                                options.env.afs_def=_cap;
                                var name=Net.Print.port(_cap.cap_port);
                                var afscs = myJam.cs.cs_singleton(_cap);
                                myJam.out('Append AFS: ' + Net.Print.capability(_cap));
                                myJam.hostsrv.append('afs/'+name,afscs,function (stat) {
                                  if (stat!=Status.STD_OK) myJam.out('Cannot append afs/'+name+': '+Status.print(stat));
                                });
                            }
                        })
                    }
                }

            ])
        } else {
            myJam.out('DNS_ROOT: invalid capability (or file) ' + val);
        }
    }],
  [['-host'],1,function(val) {
        var port = Net.Parse.port(val, 0);
        if (port != undefined) {
            options.hostport = port.port;
            myJam.todo.push([
                function () {
                    myJam.dns.dns_getrootcap(options.hostport, function (_stat, _cap) {
                            stat = _stat;
                            if (stat==Status.STD_OK) {
                                myJam.env.rootdir = myJam.cs.cs_singleton(_cap);
                            }
                    })
                },
                function () {
                    if (stat != Status.STD_OK) {
                        maJam.out('DNS_ROOT: DNS_GETROOT failed for host ' +
                            Net.Print.port(options.hostport) + ': ' +
                            Status.print(stat));
                    } else {
                        myJam.out('DNS ROOT: '+Net.Print.capability(myJam.cs.cs_to_cap(myJam.env.rootdir)));
                        if (env.workdir == undefined) myJam.env.workdir = myJam.env.rootdir;
                    }
                }
            ]);
        }

    }]
]);


var interrupt=0;

//if (0) 
process.on('SIGINT', function () {
  myJam.out('Got SIGINT ..');
  interrupt++;
  if (interrupt>2) process.exit(2);
  myJam.exit.push([
    function () {process.exit(2);}
  ]);
  B(Comp.array.flatten(myJam.exit));
});

if (!options.onexit && options.start) {
  scheduler.Init();
  scheduler.Run();
  myJamWorld.init();
  myJamWorld.start();
  myJam.init();
  myJam.start();
}
