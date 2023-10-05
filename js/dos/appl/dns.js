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
 **    $CREATED:     8-7-15 by sbosse.
 **    $VERSION:     1.2.5
 **
 **    $INFO:
 **
 **  DOS: DNS Top-level
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
var DnsInt = Require('dos/dns');
var Dns = Require('dos/dns_srv_common');
var DnsSrv = Require('dos/dns_srv');
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
  cols : DnsInt.DNS_DEFAULT_COLS,
  colmasks : DnsInt.DNS_DEFAULT_RIGHTS,
  create:false,
  blocksize:512,
  bip:'localhost',
  bport:3001,
  broker: true,
  dcapf:'dns.cap',
  dip:'localhost',
  dir:'/tmp',
  dports:[],
  env:{},
  fcapf:'afs.cap',
  fs_caps:[],
  hostname:Io.hostname(),
  hostport:undefined,
  hostsrv:false,
  http:false,
  keepalive:true,
  links:[],
  monitor:0,
  myip:'localhost',
  ndirs:1024,
  overwrite:false,
  part:'dns.inode',
  setdefault:false,
  shunk:10000,
  tcpnet:1,
  verbose:0
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
    ['-ndirs',1,function(val) {options.ndirs=Perv.int_of_string(val);}],
    ['-blocksize',1,function(val) {options.blocksize=Perv.int_of_string(val);}],
    ['-dir',1,function(val){options.dir=val}],
    ['-part',1,function(val) {options.part=val;}],
    ['-fcap',1,function(val) {
        var cp = Net.Parse.capability(val);
        if (cp!=undefined)
            options.fs_caps.push(cp.cap);
        else {
            /*
            ** Path to capability file?
             */
            var cap = Net.cap_of_file(options.dir+'/'+val);
            if (cap!=undefined) {
                Io.out('[DNS] Got AFS capability from file '+options.dir+'/'+val);
                options.fs_caps.push(cap);
            }
        }}],
    ['-dcap',1,function(val) {options.dcapf=val;}],
    ['-nokeepalive',0,function(val){options.keepalive=false;}],
    ['-D',1,function(val){options.dports.push(Perv.int_of_string(val))}],
    ['-L',2,function(val1,val2){options.links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])}],
    ['-T',0,function(val){options.tcpnet=1;options.http=false;}],
    ['-T2',0,function(val){options.tcpnet=2;options.http=false;}],
    ['-H',0,function(val){options.http=true;options.tcpnet=0;}]
]);

options.part = options.dir+'/'+options.part;
options.dcapf = options.dir+'/'+options.dcapf;
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
    Io.out('  [-dip <VLC UDP server URI>] (Default: '+options.dip+')');
    Io.out('  [-default -d]  Set this server as default and notify broker server (Default: false).');
    Io.out('  [-help -h -v -verbose -monitor]');
    Io.out('  [-create -overwrite]');
    Io.out('  [-ndirs ' + options.ndirs + ' -blocksize ' + options.blocksize + ']');
    Io.out('  [-part ' + options.part + ' -dcap ' + options.dcapf + ']');
    Io.out('  [-fcap <AFS capability|full_path_to_cap_file>' + '] (Default: '+options.fpcaf+')');
    return;
}



if (Array.length(options.fs_caps)==0) {
    /*
    ** Try to get AFS capability from file system...
     */
    var cap = Net.cap_of_file(options.fcapf);
    if (cap!=undefined) {
        options.fs_caps.push(cap);
        Io.out('[DNS] Got AFS capability from file '+options.fcapf);
    }
}
if (Array.length(options.fs_caps)==1) options.fs_caps.push(Net.nilcap);


options.privhostport = Net.uniqport();
options.pubhostport = Net.prv2pub(options.privhostport);
var scheduler = Sch.TaskScheduler();
scheduler.Init();

// Set-up the network environment ..
// typeof options : {http,tcpnet,dports,bip,bport,myip,verbose}
var network = Conn.setup(options);


var server = DnsSrv.Server(network.rpc,options);
var stat=Status.STD_OK;
server.init();

if (options.create)
    todo.push([
        function () {
            server.create_fs('mydirs',options.ndirs,options.blocksize,options.cols,options.colmasks,
                             options.part,options.fs_caps,true, function (_stat) {
                             stat=_stat;
            });
        },
        function () {
            if (stat!=Status.STD_OK)
                Io.err('[DNS] Creation of DNS failed: '+Status.print(stat));
            else
                Io.out('[DNS] Finished.')
        }
        ]);

todo.push([
    function () {
        server.open_fs(options.part,Dns.Dns_cache_parameter(2*div(options.ndirs*Dns.DEF_INODE_SIZE,Dns.DEF_BLOCK_SIZE),1,100,30), function (_stat) {
            stat=_stat;
        });
    },
    function () {
        if (stat!=Status.STD_OK)
            Io.err('[DNS] Opening of DNS failed: '+Status.print(stat));
        else
            Io.out('[DNS] Finished.')
    }
]);
var hostsrv;
if (options.hostsrv) 
  hostsrv = HostSrv.HostServer(
    scheduler,
    rpc,options,
    'DNS.'+options.hostname
  );



//Io.out(server.afs_stat());
todo.push([
    function () {
        for(var i=0;i<4;i++) {
            server.dns_start_server(i,scheduler);
        }
        options.env.dns_def=
          Net.Capability(server.dns_super.dns_putport,
                         Net.prv_encode(server.rootdir.dd_objnum,Rights.PRV_ALL_RIGHTS,server.rootdir.dd_random));
        Io.out('[DNS] Super Capability '+Net.Print.capability(options.env.dns_def));
        Io.out('[DNS] Publishing Super Capability in file '+options.dcapf);
        Net.cap_to_file(options.env.dns_def,options.dcapf);
        if (options.setdefault) 
          network.notify('DNS',Net.Print.capability(options.env.dns_def));

    }]);


todo=Array.flatten(todo);
Sch.ScheduleBlock(todo, function (e) {
  Io.out('[DNS] Caught error: '+e+'. Exiting.');
  Io.exit();
});

process.on('SIGINT', function () {
    Io.out('Got SIGINT ..');
    server.exit();
    process.exit(2);
});

// Start up the network ..
network.init(network.start);
scheduler.Run();
