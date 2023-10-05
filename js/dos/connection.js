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
 **    $CREATED:     7-7-16 by sbosse.
 **    $VERSION:     1.5.2
 **
 **    $INFO:
 **
 * ================================
 * DOS: Main Client-side Network Module.
 * ================================
 *
 ** Provides rpc-based inter-node connection and rpc-based services (std,cs,dns,dios)
 *
 **    $ENDOFINFO
 */
"use strict";
var log = 0;

var Io = Require('com/io');
var Buf = Require('dos/buf');
var util = Require('util');
var xmldoc = Require('dos/ext/xmldoc');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var Hashtbl = Comp.hashtbl;
var String = Comp.string;
var Rand = Comp.random;
var Array = Comp.array;
var trace = Io.tracing;
var div = Perv.div;
var Conn = Require('dos/connutils');
var Sch = Require('dos/scheduler');

var ConnHTTP = Require('dos/connHTTP');
var ConnNET;
var ConnUDP;
var ConnFIFO;
var Router = Require('dos/router');
var Rpc = Require('dos/rpc');
var Net = Require('dos/network');
var Cs = Require('dos/capset');
var Std = Require('dos/std');
var Dns = Require('dos/dns');
var Run = Require('dos/run');

var Mode = Conn.Mode;
if (global && global.TARGET=='node') {
 ConnNET = Require('dos/connNET');
 ConnUDP = Require('dos/connUDP');
 ConnFIFO = Require('dos/connFIFO');
}
/**
  * typeof options = {http?,tcpnet?,dports?,links?,pubhostport,bip?,bport?,myip?,
  *                   default?,verbose:number?,monitor:number?,log:function?,debug:number?}
  *                   
  */
function setup (options,verbose) {
  var broker;
  var network = {
    callback:undefined,
    connHTTP:_,
    connTCPNET:_,
    connUDP:{connections:[]},
    context:_,
    events:[],
    initializing:[],   // connect schedules
    notify:function () {},
    schedules:[], // main schedules
    starting:[],   // start schedules
    mode:Mode.ONECHAN
  };
  
  network.router = Router.RpcRouter(options.pubhostport,options);
  if (options.monitor) network.router.monitor=options.monitor;
  if (options.env) network.env=options.env; else network.env=options.env={};
  if (!options.log) options.log=Io.out;
  /*
  ** Look-up environment variables for comm. setup ..
  */
  if (Io.getenv('BROKER','') != '') {
    broker=String.split(':',Io.getenv('BROKER',''));
    options.bip=broker[0];
    if (broker.length>=2 && String.isNumeric(broker[1])) 
      options.bport=Perv.int_of_string(broker[1]);
    if ((broker.length>=2 && broker[1]=='nokeepalive') ||
        (broker.length>2 && broker[2]=='nokeepalive')) 
      options.keepalive=false;
  }
  if (options.bip=='127.0.0.1') options.myip=options.bip;
  /*
  ** RPC-based services
  */
  network.rpc = Rpc.RpcInt(network.router);
  network.std = Std.StdInt(network.rpc);
  network.dns = Dns.DnsInt(network.rpc);
  network.cs  = Cs.CsInt(network.rpc);
  network.run = Run.RunInt(network.rpc);
  network.dos = true;
  
  if (!options.env) options.env.rootdir=options.env.workdir=undefined;

  // Schedule asynchronous function execution by iterating with a next function
  // called in async. cllbacks.
  function schedule(f,list) {
    list.push(f);
  }

  function next() {
    var f=network.schedules[0];
    if (f) {
      network.schedules.shift();
      f();
    } else {
      Sch.Wakeup(network.context); // We're ready.
      if (network.callback) { 
        var f=network.callback; 
        network.callback=undefined; 
        f(network.status())};
      Sch.Schedule();
    }
  }
  
  schedule(function () {network.router.init();next()},network.initializing);
  schedule(function () {network.router.start();next()},network.starting);

  if (ConnUDP && options.dports && options.dports.length>0)
    for (var i in options.dports) {
      var dport = options.dports[i];
      var create = function (dport) {
          var vlc = ConnUDP.Connection({
            conn_port:Net.uniqport(),
            rcv_ip:options.dip,
            rcv_ipport:options.dport,
            snd_ip:undefined,
            snd_ipport:undefined,
            router:network.router,
            verbose:verbose||options.verbose
          });
          vlc.init();
          
          schedule(function(next) {
            vlc.start(function (stat) {
              if(stat==Status.STD_OK) {
                  // Something to connect to ?
                  var connectit = Array.find(options.links,function (link) {return link[0]==dport;});
                  if (connectit != undefined) {
                      vlc.link(connectit[1],connectit[2]);
                      vlc.watchdog(true);
                  }
                  next();
              }
            });
          },network.initializing);
          return vlc;
      };
      network.connUDP.connections.push(create(dport));
    }

  if (options.http) {
    if (verbose||options.verbose) 
      options.log('[NET] Connecting to broker '+options.bip+':'+options.bport+' (HTTP) ..');
    network.connHTTP = ConnHTTP.Connection({
                                    hostport:options.pubhostport,
                                    srv_ip:options.bip,srv_ipport:options.bport,
                                    my_ip:options.myip,
                                    log:options.log,
                                    verbose:verbose||options.verbose,
                                    router:network.router
                       });
    schedule(function() { 
      network.connHTTP.init(function() {
        network.router.add_conn(network.connHTTP.rpccon);
        next();
      })
    },network.initializing);
    
    if (options.debug) network.connHTTP.debug(options.debug);
    
  } else if (ConnNET && options.tcpnet) {
    network.mode=options.tcpnet==1?Mode.ONECHAN:Mode.TWOCHAN;
    if (verbose||options.verbose) 
      options.log('[NET] Connecting to broker '+options.bip+':'+options.bport+' (TCPNET) in mode '+
             network.mode+' '+(options.keepalive?'KEEPALIVE':'')+'..');
    network.connTCPNET = ConnNET.Connection({
                                    hostport:options.pubhostport,
                                    srv_ip:options.bip,srv_ipport:(options.bport+100),
                                    my_ip:options.myip,
                                    verbose:verbose||options.verbose,
                                    mode:network.mode,
                                    keepalive:options.keepalive,
                                    log:options.log,
                                    router:network.router
                         });
    schedule(function() {
      network.connTCPNET.init(function() {
        network.router.add_conn(network.connTCPNET.rpccon);
        next()
      });
    },network.initializing);

    if (options.debug) network.connTCPNET.debug(options.debug);
  }

  if (options.fifo) {
    network.mode=Mode.TWOCHAN;
    if (verbose||options.verbose) 
      options.log('[NET] Connecting to broker '+options.fifodir+':'+options.fifochan+' (FIFO) in mode '+
             network.mode+' '+(options.keepalive?'KEEPALIVE':'')+'..');
  
    network.connFIFO=ConnFIFO.Connection({
                                    hostport:options.pubhostport,
                                    path:options.fifodir,channel:options.fifochan,
                                    log:options.log,
                                    verbose:verbose||options.verbose,
                                    router:network.router
                         });
    schedule(function() {
      network.connFIFO.init(function() {
        network.router.add_conn(network.connFIFO.rpccon);
        next()
      });
    },network.initializing);

    if (options.debug) network.connFIFO.debug(options.debug);

  }
 
  schedule(function () {
    // Start router now ..
    network.router.set_cachetimeout(1000);
    next ();
  },network.initializing);
  
  // Startup actions ...
  if (network.connHTTP!=undefined) {
    network.connHTTP.on('error',function () {network.emit('error')});
    schedule(function () {
        network.connHTTP.start(function () {next()});  
    },network.starting);
    schedule(function () {
      // Connect to broker ..
      network.connHTTP.alive(function (stat) {
        if (stat==Net.Status.STD_OK) network.emit('connect');
        if (stat==Net.Status.STD_IOERR) network.emit('disconnect');
        next();
      });
    },network.starting);
  }
  if (network.connTCPNET!=undefined) {
    network.connTCPNET.on('error',function () {network.emit('error')});
    schedule(function () {
        network.connTCPNET.start(function () {next()});  
    },network.starting);
    schedule(function () {
      // Connect to broker ..
      // print('WAIT');          
      network.connTCPNET.alive(function (stat) {
        // print('GO'); 
        if (stat==Net.Status.STD_OK) network.emit('connect');
        if (stat==Net.Status.STD_IOERR) network.emit('disconnect');
        next();
      });
    },network.starting);
  }
  if (network.connFIFO!=undefined) {
    network.connFIFO.on('error',function () {network.emit('error')});
    schedule(function () {
        network.connFIFO.start(function () {next()});  
    },network.starting);
    schedule(function () {
      // Connect to broker ..
      //console.log('WAIT');          
      network.connFIFO.alive(function (stat) {
        //console.log('GO'); 
        if (stat==Net.Status.STD_OK) network.emit('connect');
        if (stat==Net.Status.STD_IOERR) network.emit('disconnect');
        next();
      });
    },network.starting);
  }

  // Ask broker for default DNS/AFS ..
  if (options.default) {
    schedule(function () {
      // Ask broker for default DNS ..
      var callback= function (data) {
        var cap=Net.Parse.capability(data,0);
        if (cap && cap.cap) {
          options.env.rootdir=options.env.workdir=network.cs.cs_singleton(cap.cap); 
          if (verbose) options.log('[NET] Broker said: Default DNS capability is '+Net.Print.capability(cap.cap));
        } else
          if (verbose) options.log('[NET] No default DNS capability from broker!');
        next ();
      };
      if (network.connHTTP) network.connHTTP.ask('DNS',callback);
      else if (network.connTCPNET) network.connTCPNET.ask('DNS',callback);
      else if (network.connFIFO) network.connFIFO.ask('DNS',callback);
    },network.starting);
  }

 /***************** API **************/

  network.emit=function (event,args) {
    var e;
    for (e in network.events) {
      var ev=network.events[e];
      if (ev[0]==event) ev[1](args);
    }
  };
  
  network.init=function (callback) {
    // if (callback) schedule(callback);    
    Sch.ScheduleBlock([
      function () {
        options.log('[NET] Initializing ..');
        network.callback=callback;
        network.schedules=Array.copy(network.initializing); 
        network.context=Sch.Suspend();
        next();
      }
    ]);
    
  };

  network.notify = function (xparam,xvalue) {
    if (network.connHTTP) network.connHTTP.notify(xparam,xvalue);
    if (network.connTCPNET) network.connTCPNET.notify(xparam,xvalue);
    if (network.connFIFO) network.connFIFO.notify(xparam,xvalue);
  };
    //connHTTP.log(2);

  network.on=function (event,callback) {
    network.events.push([event,callback]);
  };


  // Register a node for RPC communication 
  network.register= function (node) {  
    // Register a DOS link-connection for agent migration  
    node.connections.dos = {
      /* OLDCOMM send: function (text,dest,context) { */
      send: function (msg) { /* NEWCOMM */
        var text=msg.agent||msg.signal;
        node.connections.dos._count += text.length;
        if (Obj.isObject(msg.to /*dest*/)) // cap
        {
          var stat;
          // This schedule block must by passed to the global (DOS) scheduler!!
          Sch.B([
            function () {
              if (msg.agent)
                network.run.ps_migrate(msg.to /*dest*/,text,function (_stat) {              
                  stat=_stat;
                });
              else if (msg.signal)
                network.run.ps_signal(msg.to /*dest*/,text,function (_stat) {              
                  stat=_stat;
                });
            },
            function () {          
              if (stat!=Net.Status.STD_OK) {
                // context???
                msg.context.error='Migration to server '+Net.Print.capability(msg.to/*dest*/)+' failed: '+Net.Print.status(stat);
                // We're still in the agent process context! Throw an error for this agent ..
                throw 'MOVE';              
              };
              // kill ghost agent
              msg.context.process.finalize();
            }  
          ]);      
        } else if (Obj.isString(msg.to /*dest*/)) { // path

        }
      },
      status: function () {
        // TODO
        return network.status()==Net.Status.STD_OK;
      },
      _count:0,
      count: function () {return node.connections.dos._count}
    }
  }

/*
        if (network.connHTTP!=undefined) network.connHTTP.start();
        if (network.connTCPNET!=undefined) network.connTCPNET.start();
        if (network.connFIFO!=undefined) network.connFIFO.start();
        if (network.router) network.router.start();
*/
  network.start=function (callback) {
    Sch.ScheduleBlock([
      function () {
        options.log('[NET] Starting ..');
        network.callback=callback; 
        network.schedules=Array.copy(network.starting);     
        network.context=Sch.Suspend();
        next();
      }
    ]);
  };

  network.status = function () {
    if ((network.connHTTP!=undefined && network.connHTTP.status() == Net.Status.STD_OK) || 
        (network.connTCPNET!=undefined && network.connTCPNET.status() == Net.Status.STD_OK) ||    
        (network.connFIFO!=undefined && network.connFIFO.status() == Net.Status.STD_OK))
      return Net.Status.STD_OK;
    else
      return Net.Status.STD_UNKNOWN;
  };
  
  network.stop=function (callback) {  
    options.log('[NET] Stopping ..');
    if (network.connHTTP!=undefined) network.connHTTP.stop();
    if (network.connTCPNET!=undefined) network.connTCPNET.stop();    
    if (network.connFIFO!=undefined) network.connFIFO.stop();
    if (network.router) network.router.stop();
    if (network.context && network.context.blocked) Sch.Wakeup(network.context);
    if (callback) callback();
  };

  return network;
}

module.exports = {
  Mode:Mode,
  setup: setup
};
