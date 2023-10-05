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
 **    $INITIAL:     (C) 2015 - 2017 bLAB
 **    $CREATED:     1-5-15
 **    $VERSION:     1.6.3
 **
 **    $INFO:
 **
 **  Client Request and Message Broker Server Application (HTTP connection)
 **
 **    $ENDOFINFO
 */

"use strict";
var log = 0;
var test_trans=false;


var util = Require('util');
var Io = Require('com/io');
//Io.trace_open('/tmp/broker.trace');

var Net = Require('dos/network');
var Rpc = Require('dos/rpc');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Dns_srv = Require('dos/dns_srv');
var ConnHTTPSrv = Require('dos/connHTTPsrv');
var ConnNETSrv = Require('dos/connNETsrv');
var ConnUDP = Require('dos/connUDP');
var ConnFIFOSrv = Require('dos/connFIFOsrv');
var ConnFIFOSrvN = Require('dos/connFIFOsrvN');
var FileSrv = Require('dos/filesrv');
var Conn = Require('dos/connutils');
var Router = Require('dos/router');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var Args = Comp.args;
var String = Comp.string;
var Array = Comp.array;
var assert = Comp.assert;
var Sch = Require('dos/scheduler');
var Fs = Require('fs');
var satelize = Require('dos/ext/satelize');
var getenv = Require('com/getenv');
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;
var HostSrv = Require('dos/hostsrv');
var GeoIP = Require('geoip/geoip');

var trace = Io.tracing;


var options = {
  bip:'localhost',
  bport:3001,
  connections:[], // UDP P2P
  db:undefined, // GEOIP data base root directory + enable GEOIP service
  dip:'localhost',
  dports:[],
  env: {
  },
  fdir:'',
  findex:'',
  fifo:false,
  fifodir:'/tmp/broker',
  fifonum:2,
  fport:3000,   // HTTP Fileserver port
  geo:{},       // My GEO location
  geoip:undefined,  // GEOIP service
  hostname:Io.hostname(),
  hport:undefined,    // RPC port
  http:true,
  keepalive:true,
  links:[],     // UDP P2P
  myip:'localhost',
  monitor:0,
  tcpnet:1,
  verbose:0
}

var help=false;
var shift='';
var argv = Io.getargs();

function getip(str) {
    var tokens = String.split(':',str);
    if (tokens.length==2) return tokens[0];
    else if (tokens.length==1) return 'localhost';
    else return '';

}

function getipport(str) {
    var tokens = String.split(':', str);
    if (tokens.length == 2) return Perv.int_of_string(tokens[1]);
    else if (tokens.length == 1) return Perv.int_of_string(tokens[0]);
    else return '';

}
Args.parse(argv, [
    [['-h','-help'],0, function() {help=true;}],
    [['-v','-verbose'],0, function() {options.verbose++;}],
    ['-db',1,function(val) {options.db=val;}],
    ['-file',1,function(val) {options.fdir=val;}],
    ['-fifo',1,function(val) {options.fifodir=val;}],
    ['-fifonum',1,function(val) {options.fifonum=Perv.int_of_string(val);}],
    ['-index',1,function(val) {options.findex=val;}],
    [['-bport','-bp'],1,function(val) {options.bport=Perv.int_of_string(val);}],
    ['-fport',1,function(val) {options.fsport=Perv.int_of_string(val);}],
    ['-hport',1,function(val) {options.hport=Perv.int_of_string(val);}],
    ['-D',1,function(val){options.dports.push(Perv.int_of_string(val))}],
    ['-L',2,function(val1,val2){options.links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])}],
    ['-monitor',0,function(val){options.monitor++;}],
    ['-nokeepalive',0,function(val){options.keepalive=false;}],
    ['--T',0,function(val){options.tcpnet=0;}],
    ['-T',0,function(val){options.tcpnet=1;}],
    ['-T2',0,function(val){options.tcpnet=2;}],
    ['--H',0,function(val){options.http=false;}],
    ['-H',0,function(val){options.http=true;}],
    ['-F',0,function(val){options.fifo=true}]
]);

options.privhostport = Net.port_name('broker'+options.hostname+options.bport);
options.pubhostport = Net.prv2pub(options.privhostport);
options.hport=options.hport||options.privhostport;

if (help) {
    Io.out('usage: '+process.argv[0]+' '+process.argv[1]);
    Io.out('  [-h -help -v -verbose -monitor]');
    Io.out('  [--H --T -H -F]  Disable/Enable connection service');
    Io.out('    T: TCPIP, auto mode (1-chan, 2-chan, keepalive)');
    Io.out('    H: bport, T: bport+100');
    Io.out('    F: FS FIFO');
    Io.out('    (Default: -T, -H)');
    Io.out('  [-D <port>] UDP Server Port');
    Io.out('  [-L <src port> <dst [address:]port] UDP P2P Connection');
    Io.out('  [-db  <Data base directory>]  Enable GEOIP service (Default: disabled)');
    Io.out('  [-file  <HTTP File server directory>]  (Default: disabled)');
    Io.out('  [-index  <HTTP File server default index file>]  (Default: '+(options.findex==''?'index.html':options.findex)+')');
    Io.out('  [-bport | -bp <HTTP/TCPNET+100 Broker server port>] (Default: HTTP '+options.bport+' TCPNET '+(options.bport+100)+')');
    Io.out('  [-fport <HTTP Fileserver port>]  (Default : '+options.fport+')');
    Io.out('  [-hport <Private RPC host server port>] (Default: '+Net.Print.port(options.hport)+')');
    Io.out('  [-fifo <FIFO path and basename>] (Default: '+options.fifodir+')');
    Io.out('  [-fifonum <Number of FIFO channels>] (Default: '+options.fifonum+')');
    return;
}

satelize.satelize({}, function(err, geoData) {
    // process err
    if (err != undefined) {
        Io.out('[BRO] GEO Location failed: '+err)
    } else if (geoData) {
      try {
        var obj = JSON.parse(geoData);
        Io.out('[BRO] GEO Location (lati=' + obj.lat + ', long=' + obj.lon + ')');
        options.geo=obj;
        if (hostsrv) hostsrv.set_geo(obj);
      } catch (e) {
        if (options.verbose>1) Io.out('GEO Location failed: '+e+',\n'+geoData);
        else Io.out('[BRO] GEO Location not available: '+e);
      }
    }
});


var scheduler = Sch.TaskScheduler();
var router = Router.RpcRouter(options.pubhostport,options);
router.monitor=options.monitor;
//router.verbose=options.verbose;
var rpc = Rpc.RpcInt(router);
scheduler.Init();
scheduler.Run();
router.init();
router.start(100);

for (var i in options.dports) {
    var dport = options.dports[i];
    var create = function (dport) {
        var vlc = ConnUDP.Connection({
          conn_port:Net.uniqport(),
          rcv_ip:options.dip,
          rcv_ipport:dport,
          snd_ip:undefined,
          snd_ipport:undefined,
          router:router,
          verbose:options.verbose
        });
        vlc.init();
        vlc.start(function (stat) {
            if(stat==Status.STD_OK) {
                // Something to connect to ?
                var connectit = Array.find(options.links,function (link) {return link[0]==dport;});
                if (connectit != undefined) {
                    vlc.link(connectit[1],connectit[2]);
                    vlc.watchdog(true);
                }
            }
        });
        return vlc;
    };
    options.connections.push(create(dport));
}


var hostsrv = HostSrv.HostServer(
  scheduler,rpc,
  options,
  'BROKER.'+options.hostname,
  options.env);

var dns = Dns.DnsInt(rpc);
var cs = Cs.CsInt(rpc);
scheduler.Init();
scheduler.Run();


/*
** Publish local servers...
 */
var stat=Status.STD_UNKNOWN;
var rootcs = hostsrv.dns.rootdir;


/*
**
** Standalone HTTP Brokerage Server
** with capability based DNS service
**  /hosts/vm1 vm2 ...
**  /domains/dom1/vm1 vm2 ...
**  /agents/a1 a2 ..
*/


if (options.verbose) Io.out('[BRO] Host port: '+Net.Print.port(options.pubhostport));

var connectionserver1,connectionserver2,connectionserver3;
if (options.http) connectionserver1 = ConnHTTPSrv.Server({hostport:options.pubhostport,srv_ip:options.myip,srv_ipport:options.bport,
                                                          router:router,verbose:options.verbose,env:options.env});
if (options.tcpnet) connectionserver2 = ConnNETSrv.Server({hostport:options.pubhostport,srv_ip:options.myip,srv_ipport:(options.bport+100),
                                                           router:router,verbose:options.verbose,env:options.env,
                                                           mode:(options.tcpnet==1?Conn.Mode.ONECHAN:Conn.Mode.TWOCHAN),
                                                           keepalive:options.keepalive});                          

if (options.fifo && options.fifonum <=2) connectionserver3 = ConnFIFOSrv.Server({hostport:options.pubhostport,router:router,
                                                          path:options.fifodir,
                                                          channels:options.fifonum,
                                                          verbose:options.verbose,env:options.env});
if (options.fifo && options.fifonum >2) connectionserver3 = ConnFIFOSrvN.Server({hostport:options.pubhostport,router:router,
                                                          path:options.fifodir,
                                                          channels:options.fifonum,
                                                          verbose:options.verbose,env:options.env});

if (connectionserver1) {
  router.add_event(Sch.Bind(connectionserver1,connectionserver1.schedule));
  router.add_conn(connectionserver1.rpccon);
  connectionserver1.init();
  connectionserver1.start();
}
if (connectionserver2) {
  router.add_event(Sch.Bind(connectionserver2,connectionserver2.schedule));
  router.add_conn(connectionserver2.rpccon);
  connectionserver2.init();
  connectionserver2.start();
}
if (connectionserver3) {
  router.add_event(Sch.Bind(connectionserver3,connectionserver3.schedule));
  router.add_conn(connectionserver3.rpccon);
  connectionserver3.init();
  connectionserver3.start();
}

if (!String.empty(options.fdir)) {
    var fileserver = FileSrv.File({
      srv_ip:options.myip,
      srv_ipport:options.fport,
      dir:options.fdir,
      verbose:options.verbose,
      index:options.findex
    });
    fileserver.init();
    fileserver.start();
}

if (options.db) {
  GeoIP.dir=options.db;
  options.geoip=GeoIP.load(function () {
    if (options.geo.query) {
      options.myip=options.geo.query;
      Io.out('[GEOIP] Validating my location '+options.myip+' ..');
      var loc = GeoIP.lookup(options.myip);
      if (loc) {
        options.geo = loc;        
        Io.out('[GEOIP] Found: '+JSON.stringify(loc));
        if (hostsrv) hostsrv.set_geo(loc);
      }
      var mem = Io.mem();
      Io.out('[BRO] Allocated memory is '+((mem.data/1024)|0)+' MB');  
    }
  });  
}

function stop() {
  if (connectionserver3) connectionserver3.stop();
  process.exit(2);
}

process.on('SIGINT',stop);

module.exports = {
  stop: stop
}

