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
 **    $CREATED:     21-5-15 by sbosse.
 **    $VERSION:     1.2.5
 **
 **    $INFO:
 **
 **  DOS: AFS Top-level module
 **
 **    $ENDOFINFO
 */

"use strict";

var Io = Require('com/io');
//Io.trace_open('/tmp/afs.trace');

var Net = Require('dos/network');
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;
var Sch = Require('dos/scheduler');
var Conn = Require('dos/connection');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Std = Require('dos/std');
var Afs = Require('dos/afs');
var AfsSrv = Require('dos/afs_srv');
var Router = Require('dos/router');
var util = Require('util');
var Comp = Require('com/compat');
var assert = Comp.assert;
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var div = Comp.div;
var Fs = Require('fs');
var HostSrv = Require('dos/hostsrv');
var Args = Comp.args;

var trace = Io.tracing;

var options = {
  create:false,
  blocksize:512,
  bip:'localhost',
  bport:3001,
  broker: true,
  dip:'localhost',
  dir:'/tmp',
  dports:[],
  env:{},
  fcapf:'afs.cap',
  hostname:Io.hostname(),
  hostport:undefined,
  hostsrv:false,
  http:false,
  keepalive:true,
  links:[],
  monitor:0,
  myip:'localhost',
  nblocks:65536,
  ninodes:1024,
  overwrite:false,
  partA:'afs.inode',
  partB:'afs.data',
  setdefault:false,
  shunk:10000,
  tcpnet:1,
  verbose:0,
};

var help=false;
var todo = [];


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
var argv = Io.getargs();
Args.parse(argv, [
    [['-h','-help'],0,function() {help=true}],
    [['-v','-verbose'],0,function() {options.verbose++;}],
    ['-monitor',0,function(val){options.monitor++;}],
    ['-hostsrv',0,function(val){options.hostsrv=true;}],
    ['-broker',1,function(val){
      var tokens = Comp.string.split(':',val);
      if (tokens.length==1)
        options.bip=val;
      else {
        options.bip=tokens[0];      
        options.bport=Perv.int_of_string(tokens[1])
      }
    }],
    [['-default','-d'],0,function() {options.setdefault=true;}],
    ['-dip',1,function(val){options.dip=val}],
    ['-overwrite',0,function() {options.overwrite=true;}],
    ['-create',0,function() {options.create=true;}],
    ['-nblocks',1,function(val) {options.nblocks=Perv.int_of_string(val);}],
    ['-ninodes',1,function(val) {options.ninodes=Perv.int_of_string(val);}],
    ['-blocksize',1,function(val) {options.blocksize=Perv.int_of_string(val);}],
    ['-dir',1,function(val){options.dir=val}],
    ['-partA',1,function(val) {options.partA=val;}],
    ['-partB',1,function(val) {options.partB=val;}],
    ['-fcap',1,function(val) {options.fcapf=val;}],
    ['-nokeepalive',0,function(val){options.keepalive=false;}],
    ['-D',1,function(val){options.dports.push(Perv.int_of_string(val))}],
    ['-L',2,function(val1,val2){options.links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])}],
    ['-T',0,function(val){options.tcpnet=1;}],
    ['-T2',0,function(val){options.tcpnet=2;}],
    ['-H',0,function(val){options.http=true;}]
]);


options.partA = options.dir+'/'+options.partA;
options.partB = options.dir+'/'+options.partB;
options.fcapf = options.dir+'/'+options.fcapf;

if (help) {
    Io.out('usage: ' + process.argv[0] + ' ' + process.argv[1]);
    Io.out('  [-H -T -T2]  Enable connection service');
    Io.out('    T: TCPIP, 1-ch H:HTTP T2: TCPIP, 2-ch');
    Io.out('    H: bport, T: bport+100');
    Io.out('    (Default: -T)');
    Io.out('  [-D <port>] UDP Server Port');
    Io.out('  [-L <src port> <UDP dst [address:]port] UDP P2P Connection');
    Io.out('  [-nokeepalive] Establish a new conncetion for each message.');
    Io.out('  [-broker <ip[:ipport]>]  Broker URL (Default: '+options.bip+': HTTP '+options.bport+' TCPNET '+(options.bport+100)+')');
    Io.out('  [-dip <UDP server URI>] (Default: '+options.dip+')');
    Io.out('  [-default -d]  Set this server as default and notify broker server (Default: false).');
    Io.out('  [-hostsrv] Start host server (Default: false).');
    Io.out('  [-dir <path>] Local storage directory (Default: '+options.dir+')');
    Io.out('  [-help -h -v -verbose -monitor]');
    Io.out('  [-create -overwrite]');
    Io.out('  [-nblocks ' + options.nblocks + ' -ninodes ' + options.ninodes + ' -blocksize ' + options.blocksize + ']');
    Io.out('  [-partA ' + options.partA + 
           ' -partB ' + options.partB + 
           ' -fcap ' + options.fcapf + ']');
    return;
}


options.privhostport = Net.uniqport();
options.pubhostport = Net.prv2pub(options.privhostport);

var scheduler = Sch.TaskScheduler();
scheduler.Init();


// Set-up the network environment ..
// typeof options : {http,tcpnet,dports,bip,bport,myip,verbose}
var network = Conn.setup(options);

/**
 * @type afs_server
 */
var server = AfsSrv.Server(network.rpc,options);
var stat;
if (options.create)
  stat=server.create_fs('myfiles',options.ninodes,options.blocksize,options.nblocks,options.partA,options.partB,true);

  
stat=server.open_fs(options.partA,options.partB,
                    AfsSrv.Afs_cache_parameter(2*div(options.ninodes*AfsSrv.DEF_INODE_SIZE,AfsSrv.DEF_BLOCK_SIZE),1,100,30));

if (stat!=Status.STD_OK) {
    Io.out('[AFS] Fatal. Cannot open filesystem, exit.');
    process.exit(2);
}

options.env.afs_def=Net.Capability(server.afs_super.afs_putport,
                                   Net.prv_encode(0,Rights.PRV_ALL_RIGHTS,server.afs_super.afs_checkfield));
if (options.setdefault) 
  network.notify('AFS',Net.Print.capability(options.env.afs_def));

Io.out('[AFS] Publishing AFS Super Capability in file '+options.fcapf);
Net.cap_to_file(Net.Capability(server.afs_super.afs_putport,
                Net.prv_encode(0,Net.Rights.PRV_ALL_RIGHTS,server.afs_super.afs_checkfield)),options.fcapf);

var hostsrv;
if (options.hostsrv) 
  hostsrv = HostSrv.HostServer(scheduler,
                               network.rpc,
                               options,
                               'AFS.'+options.hostname,
                               options.env);

todo=Array.flatten(todo);
Sch.ScheduleBlock(todo, function (e) {
  Io.out('[AFS] Caught error: '+e+'. Exiting.');
  Io.exit();
});

// Start up the network ..
network.init(network.start);

scheduler.Run();

//Io.out(server.afs_stat());
for(var i=0;i<4;i++) {
    server.afs_start_server(i,scheduler);
}
Io.out('[AFS] Super Capability '+options.env.afs_def);
process.on('SIGINT', function () {
    Io.out('Got SIGINT ..');
    server.afs_exit();
    process.exit(2);
});


