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
 **    $CREATED:     09-11-16 by sbosse.
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 **  JAM Standalone Node VM with app.js for WEB Browser (with ODS)
 **    $ENDOFINFO
 */

global.config={
  simulation:false,
  dos:true
};

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
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Getenv = Require('com/getenv');
var HostSrv = Require('dos/hostsrv');
var Run = Require('dos/run');
var RunSrv = Require('dos/runsrv');
var Esprima = Require('parser/esprima');
var Json = Require('jam/jsonfn');
var satelize = Require('dos/ext/satelize');
//var FileReader = Require('os/FileReader');
//var FileSaver = Require('os/FileSaver');

var Db = Require('db/db');
var Aios = Require('jam/aios');
var Dios = Require('dos/dios');

var nameopts = {length:8, memorable:true, lowercase:true};
var B = Sch.B;
var L = Sch.L;

var out = function (msg) { Io.out('[JAM] '+msg)};

/* ---------- Network Wrapper ------------- */

var jamnet = function (_options) {
  var self=this;
  this.options = {
    bip:'localhost',
    bport:3001,
    broker:false,
    default:true,
    env:{},
    geo:undefined,
    http:false,
    links:[],
    myip:'localhost',
    monitor:0,
    out:function (msg) {log(msg)},
    err:function (msg) {log(msg)},
    warn:function (msg) {log(msg)},
    verbose:0
  };
  for (p in _options) this.options[p]=_options[p];
  
  this.world = this.options.world||'MyWorld'; // name only!
  this.out=function (msg) { (self.options.out||log)('[NET] '+msg)};
  this.err=function (msg) { (self.options.out||log) ('[NET] Error: '+msg)};
  this.warn=function (msg) { (self.options.out||log)('[NET] Warning: '+msg)};

  this.broker=this.options.http||this.options.tcpnet;
  this.bport=this.options.bport||3001;
  this.bip=this.options.bip;

  if (Io.getenv('WINE','')!='' && this.options.myip=='localhost') this.options.myip='127.0.0.1';
  if (Io.getenv('WINE','')!='') {
    this.options.keepalive=false;
    this.options.http=false;
    this.options.tcpnet=2;
  }
  
  this.scheduler=Sch.TaskScheduler();
  
  this.todo=[];
  this.exit = [];
  
  this.env=this.options.env;

  this.events=[];
  
  satelize.satelize({}, function(err, geoData) {
      // process err
      if (err != undefined) {
          self.out('GEO Location failed: '+err)
      } else if (geoData) {
        try {
          var obj = JSON.parse(geoData);
          self.out('GEO Location (lati=' + obj.lat + ', long=' + obj.lon + ')');
          self.options.geo=obj;
        } catch (e) {
          if (self.options.verbose>1) myJam.out('GEO Location failed: '+e+',\n'+geoData);
          else self.out('GEO Location not available: '+e);
        }
      }
    });
  
  this.out('Network with host port '+Net.Print.port(this.options.pubhostport)+
           ' created for world '+this.world+'.');
  this.run=false;
  
}

jamnet.prototype.emit=function (event,args) {
  var e;
  for (e in this.events) {
    var ev=this.events[e];
    if (ev[0]==event) ev[1](args);
  }
}

jamnet.prototype.init=function () {
  var self=this;    
  this.out('Initializing ..');
  this.scheduler.Init();
  if (this.broker) {
    this.network  = Conn.setup(this.options);
    // Event propagation
    this.network.on('connect',function () {self.emit('connect')});
    this.network.on('disconnect',function () {self.emit('disconnect')});
    this.network.on('error',function () {self.emit('error')});
    this.router   = this.network.router;
    this.rpc      = this.network.rpc;
    this.std      = Std.StdInt(this.rpc,this.env);
    this.dns      = Dns.DnsInt(this.rpc,this.env);
    this.cs       = Cs.CsInt(this.rpc,this.env);
    this.hostsrv  = none; // requires router init., created on initialization
    Aios.current.network = this.network;
  }
}


jamnet.prototype.on=function (event,callback) {
  this.events.push([event,callback]);
}

jamnet.prototype.start=function () {
  this.run=true;
  // Start up the network 
  this.network.init(this.network.start.bind(this));
  // this.out('Starting ..');
  this.scheduler.Run();
}

jamnet.prototype.status=function () {
  return this.router?this.router.status():'Not initialized.';
}

jamnet.prototype.stop=function () {
  this.run=true;
  this.network.stop();
}


var JamNet = function(options) {
  var jamNet;
  jamNet = new jamnet(options);
  return jamNet;
};


/* ---------- JAM Wrapper ------------- */

var jam = function (_options) {
  var main=this,
  options = {
    default:true,
    domain:'default',
    env:{},
    geo:undefined,
    hostname:'localhost',
    hostport:undefined,
    nodename:Name.generate(nameopts),   // pre-guess
    onexit:false,
    out:function (msg) {Io.out(msg)},
    start:false,
    verbose:0
  };
  for (p in _options) options[p]=_options[p];
  
  this.options = options;
  this.env=this.options.env;
  this.verbose=options.verbose||0;

  this.out=function (msg) { (options.out||Io.out)('[JAM '+main.nodename+'] '+msg)};
  this.err=function (msg) { throw ('[JAM '+main.nodename+'] Error: '+msg)};
  this.warn=function (msg) { (options.out||Io.out)('[JAM '+main.nodename+'] Warning: '+msg)};
  
  if (!this.options.id) this.id=Aios.aidgen();
  else this.id=options.id;

  this.world = options.world||Aios.World.World([],{
    id:this.options.id,
    classes:options.classes||[]
  });
  this.node = Aios.Node.Node({
    id:this.options.id,
    out:this.out,
    position:{x:0,y:0}
  });
  this.world.add(this.node);

  this.run=false;
  this.looprun=none;
  
  this.network=options.network;
  if (this.network) this.rpc=this.network.rpc;
  if (this.network) this.dios = Dios.Dios(this.network.rpc,this.network.env);
  if (options.scheduler) this.scheduler=options.scheduler;
  
  
  this.options.privhostport=Net.uniqport();
  this.options.pubhostport = Net.prv2pub(this.options.privhostport);
  
  
  this.todo=[];

  this.exit = [];
  
  this.hostname=options.hostname;
  this.nodename=options.nodename;
  this.domain=options.domain;

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
  
  this.out('JAM created in world '+this.world.id+'.');
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
jam.prototype.addclass = function (ac) {
  for (var p in ac) {
    if (this.options.verbose>=0) this.out((this.world.classes[p]?'Updating':'Adding')+' agent class template '+p+'.');
    this.world.classes[p]=ac[p];
  }
};


/** Compile agent class templates from text. 
 *  Expected text format: var classes = {ac1: function () {}, ac2: function ..}
 *
 */
jam.prototype.compile = function (text,modu) {
  var ac,
      ast,
      p,
      regex1,
      ast=null,
      off=null,
      code,
      content,
      syntax,
      more;

  if (this.options.verbose>0) this.out('Compiling agent class template(s)');

  if (text!=undefined) {
    code=text+' classes';
    try {
      ast=Esprima.parse(code, { tolerant: true, loc:true });
      if (ast.errors && ast.errors.length>0) throw ast.errors[0];
      modu=eval(code);
    } catch (e) {      
      if (e.lineNumber) more = ", in line "+e.lineNumber;
      throw e;
    }
  }

  for (p in modu) {
    ac={};
    ac[p]=modu[p];
    if (ast) off=this.syntax.find(ast,'VariableDeclarator',p);
    if (off && off.loc) this.syntax.offset=off.loc.start.line-1;
    content = 'var ac = '+modu[p];
    try {
      syntax = Esprima.parse(content, { tolerant: true, loc:true })
      if (syntax.errors && syntax.errors.length>0) throw syntax.errors[0];
    } catch (e) {
      if (e.lineNumber) more = ", in line "+e.lineNumber;
      throw e;
    };
    
    this.analyze(syntax,{classname:p,level:2,verbose:1});
    text=Json.stringify(ac);
    regex1= /this\.next=([a-zA-Z0-9_]+)/;
    text=text.replace(regex1,"this.next='$1'");
    // console.log(text);
    ac=Json.parse(text,{});    
    this.addclass(ac);
    this.syntax.offset=0;
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
jam.prototype.init=function (callback) {
  var self=this,
      stat,
      cs,
      csrow,
      csdir,
      i,
      names=[];
      
  this.out('Initializing ..');
  for(i=0;i<10;i++) names.push(Name.generate(nameopts));
  
  this.todo.push([
    // TODO: GEO location from broker using satellize ...
    function () {
    },
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
      if (stat==Status.STD_OK) 
      L(
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
                  self.out('Publish /domains/'+self.domain+'/'+self.nodename+': '+Status.print(_stat))
                  stat=_stat;
                  if (stat==Status.STD_OK) self.network.emit('publish');
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
            self.out('My final host name is '+self.hostname+'.'+self.nodename);
            if (callback) callback(stat,self.nodename);
          }
        ]
      );
    }
  ]);
  B(Comp.array.flatten(this.todo));
  this.exit.push([
    function () {
      self.hostsrv.delete('/root/domains/'+self.domain+'/'+self.nodename,
         function (_stat) {
           self.out('Unpublish /domains/'+self.domain+'/'+self.nodename+': '+Status.print(_stat))
           stat=_stat;
         }
       );     
    }
  ]);
  this.env.rootdir=this.network.env.rootdir;
  this.hostsrv=HostSrv.HostServer(this.scheduler,
                               this.rpc,
                               this.options,
                               'JAM.'+this.hostname+'.'+this.nodename,
                               this.env);
  // Register our request handler and make a link back to our class handler
  this.hostsrv.register(this.request);
  this.hostsrv.addclass=function (ac) {
      self.addclass(ac);
    };
  this.hostsrv.getclass=function (classname) {
      return self.world.classes[classname];
    };
  this.hostsrv.receive=function (code,start) {
      self.node.receive(code,start);
    };
  if (this.options.geo) myJam.hostsrv.set_geo(this.options.geo);
}

/** (Re)publish our nodename in the current domain
 *
 */
jam.prototype.publish = function (callback) {
  var self=this,
      stat,cs;
  B([
    function () {
      self.hostsrv.lookup('/root/domains/'+self.domain+'/'+self.nodename, function (_stat,_cs) {
          if (self.options.verbose>0) self.out('lookup /root/domains/'+self.domain+'/'+self.nodename+': '+Status.print(_stat))
          stat=_stat;
          cs=_cs;
      });      
    },
    function () {
      if (stat==Status.STD_NOTFOUND) {
        self.hostsrv.append('/root/domains/'+self.domain+'/'+self.nodename, self.hostsrv.hostcap,
          function (_stat) {
            self.out('(Re)Publish /domains/'+self.domain+'/'+self.nodename+': '+Status.print(_stat))
            stat=_stat;
            if (stat==Status.STD_OK) self.network.emit('publish');
          }
        );
      }  
    },
    function () {
      if (callback) callback(stat);
    }
  ]);
}

/** Read and compile agent class templates from file
 *  Format: module.exports = {ac1: function, ac2: function , ...]
 *
 */
jam.prototype.readclass = function (file) {
  var text,
      modu;

  if (this.options.verbose>0) this.out('Looking up agent class template(s) from '+file);
  modu=Require(file);
  this.compile(text,modu);
};


/** Start the JAM scheduler
 *
 */
jam.prototype.start=function () {
  this.run=true;
  // this.out('Starting ..');
}



/** Stop the JAM scheduler
 * 
 */
jam.prototype.stop=function () {
  this.run=false;
  this.out('Stopping ..');
  if (this.looprun)
    clearTimeout(this.looprun);
  B(Comp.array.flatten(this.exit));
}


var Jam = function(options) {
  var myJam,
  myJam = new jam(options);
  return myJam;
};

out('Main module compiled.');

module.exports={
  Aios:Aios,
  Comp:Comp,
  Conn:Conn,
  Cs:Cs,
  Dns:Dns,
  Dios:Dios,
//  FileReader:FileReader,
//  FileSaver:FileSaver,
  Jam:Jam,
  Io:Io,
  Name:Name,
  Net:Net,
  JamNet: JamNet,
  Sch: Sch
};
