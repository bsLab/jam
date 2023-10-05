/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2015-2016 BSSLAB
 **    $CREATED:     8/7/15
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 **  Generic Network Node
 **
 **    $ENDOFINFO
 */
"use strict";
var log = 0;

var Io = Require('com/io');
//Io.trace_open('/tmp/shell.trace');

var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Sch = Require('dos/scheduler');
var Conn = Require('dos/connection');
var Rpc = Require('dos/rpc');
var Std = Require('dos/std');
var Router = Require('dos/router');
var util = require('util');
var Comp = Require('com/compat');
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
var Host = Require('dos/host');

var trace = Io.tracing;

var privhostport = Net.uniqport();
var pubhostport = Net.prv2pub(privhostport);

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
var dports = [];
var dip = 'localhost';
var links = [];
var bport = 3001;
var bip = 'localhost';

var argv = Io.getargs();
var verbose=0;
var monitor=0;
var report=0;
var help=false;
var todos = [];

var scheduler = Sch.TaskScheduler();
scheduler.Init();
var router = Router.RpcRouter(pubhostport);
var rpc = Rpc.RpcInt(router);
var std = Std.StdInt(rpc);

Args.parse(argv, [
    [['-help','-h'],0,function() {help=true;}],
    ['-bport',1,function(val) {bport=Perv.int_of_string(val);}],
    ['-bip',1,function(val) {bip=val;}],
    ['+dport',1,function(val){dports.push(Perv.int_of_string(val))}],
    ['-dip',1,function(val){dip=val}],
    ['-info',1,function(val){todos.push([
        function () {
            var port = Net.Parse.port(val);
            var cap = Net.Capability(port.port,Net.Private());
            std.std_info(cap,function (stat,msg){
                Io.out(Status.print(stat)+': '+msg);
            })
        }
    ])}],
    ['+link',2,function(val1,val2){links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])}],
    [['-v','-verbose'],0,function(val){verbose++;}],
    ['-monitor',0,function(val){monitor++;}],
    ['-report',0,function(val){report++;}]
]);

if (help) {
    Io.out('usage: '+argv[0]+' '+argv[1]);
    Io.out('         [-help -monitor -report]');
    Io.out('         [-bport <HTTP Broker server port>]     (Default : '+bport+')');
    Io.out('         [-bip <HTTP Broker URI>]               (Default : '+bip+')');
    Io.out('         [+dport <VLC UDP server port>]         ');
    Io.out('         [-dip <VLC UDP server URI>]            (Default : '+dip+')');
    Io.out('         [+link <VLC src port>] <VLC dst [URI]:port]');
    Io.exit();
}

for (var i in dports) {
    var dport = dports[i];
    var create = function (dport) {
        var vlc = Conn.UdpConnection(Net.uniqport(), dip, dport, undefined, undefined, router);
        vlc.init();
        vlc.start(function (stat) {
            if(stat==Status.STD_OK) {
                // Something to connect to ?
                var connectit = Array.find(links,function (link) {return link[0]==dport;});
                if (connectit != undefined) {
                    vlc.link(connectit[1],connectit[2]);
                    vlc.watchdog(true);
                }
            }
        });
        vlc.verbose=verbose;
        return vlc;
    };
    create(dport);
}

if (Array.empty(dports)) {
    var conn = Conn.HttpConnection(Net.uniqport(), bip, bport);
    conn.init();
    router.connection_broker(conn);
}
router.monitor=monitor;
router.init();
var hostsrv=Host.HostServer(scheduler,rpc,pubhostport,privhostport);
router.start(100);

if (report) Sch.AddTimer(10000,'Router Status',function(){
    Io.out(router.status())
});

if (!Array.empty(todos)) {
    Sch.ScheduleBlock(Array.flatten(todos));
}
