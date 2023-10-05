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
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     16/6/15 by sbosse.
 **    $VERSION:     1.1.6
 **
 **    $INFO:
 **
 **  DOS: JS Amoeba Shell Interface and Interpreter (WEB)
 **
 **
 **    $ENDOFINFO
 */

"use strict";
var log = 0;
var monitor=1;
var version = '1.0';
var Io = Require('com/io');
//Io.trace_open('/tmp/shell.trace');
if (typeof window == 'object' && typeof Shell != 'object') Shell=window.Shell;
 
if (typeof Shell != 'object') {
  if (!global || !global.MODE || global.MODE!='compile') Io.fail('No Shell object found. Abort.');
  else Io.out('Creating Shell compatibility object for compile process. Target is '+global.TARGET+'.');
  var Shell = {
            shell:undefined,
            stdout:console.log,
            args:['-compile'],
            env:undefined,
            connect: function(uri) {},
            interpreter:function(){},
            prompt:function () {},
            set:function (xname,xvalue) {},
            status: function (xname,set) {},
            update: function(xname,xvalue) {},
            download: function(filename,size,data) {},
            upload: function (callback) {}
    };
}

Io.set_args(Shell.args);
Io.set_stdout(Shell.stdout);
var argv = Io.getargs();

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
var Args = Comp.args;
var Printf = Comp.printf;
var Filename = Comp.filename;
var Status = Net.Status;
var Command = Net.Command;
var Fs = require('fs');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Getenv = Require('com/getenv');
var Ash = Require('dos/ash');
var HostSrv = Require('dos/hostsrv');

var options = {
  bip:'localhost',
  bport:3001,
  broker: true,
  default:false,
  env:{},
  hostport:undefined,
  http:true,
  monitor:0,
  myip:'localhost',
  test:0,
  verbose:0
};

var trace = Io.tracing;
options.privhostport = Net.uniqport();
options.pubhostport = Net.prv2pub(options.privhostport);
var hport=options.privhostport;

var env = Ash.Env(options.privhostport);
options.env=env;

Shell.prompt=function () {return env.prompt();};

function fail(msg) {
    Io.stderr('[BASH]: Fatal error: '+msg+'\n');
    Io.exit(0);
}
function out(msg) {
    Io.stdout('[BASH]: '+msg+'\n');
}
function warn(msg) {
    Io.stderr('[BASH]: Warning: '+msg+'\n');
}
Args.parse(argv, [
    ['-bport',1,function(val){bport=Perv.int_of_string(val)}],
    ['-bip',1,function(val){bip=val}]
    ]);

var scheduler = Sch.TaskScheduler();
scheduler.Init();


// Set-up the network environment ..
// typeof options : {http,tcpnet,dports,bip,bport,myip,verbose}
var network = Conn.setup(options);

var rpc = network.rpc;

var StdInt = Std.StdInt(rpc);
var DnsInt = Dns.DnsInt(rpc);
var CsInt = Cs.CsInt(rpc);
var ash = Ash.Ash(rpc,scheduler,env);
var todo = [];
var stat,action;
var lastdnscap=undefined;

var hostsrv = HostSrv.HostServer(scheduler,rpc,options);

Args.parse(argv, [
    [['-root','-r'],1,function(val) {
        var cap = Net.Parse.capability(val, 0);
        if (cap != undefined) {
            env.rootdir = CsInt.cs_singleton(cap.cap);
            if (env.workdir == undefined) env.workdir = env.rootdir;
        }
    }],
    [['-host','-h'],1,function(val) {
        var stat,hostport;
        var port = Net.Parse.port(val, 0);
        if (port != undefined) {
            hostport = port.port;
            todo.push([
                function () {
                    Shell.set('hostport',Net.Print.port(hostport));
                    DnsInt.dns_getrootcap(hostport, function (_stat, _cap) {
                        stat = _stat;
                        if (stat==Status.STD_OK) {
                            env.rootdir = CsInt.cs_singleton(_cap);
                        }
                    })
                },
                function () {
                    if (stat != Status.STD_OK) {
                        Shell.status('hoststatus',false);
                        Shell.status('rootstatus',false);
                        out('DNS_ROOT: DNS_GETROOT failed for host ' +
                                Net.Print.port(hostport) + ': ' +
                                Status.print(stat));
                    } else {
                        Shell.status('hoststatus',true);
                        Shell.status('rootstatus',true);
                        out('DNS ROOT: '+Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                        Shell.set('rootcap',Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                        if (env.workdir == undefined) env.workdir = env.rootdir;
                    }
                }
            ]);
        }

    }]
 ]);
todo.push([
    function () {
        /*
        ** Was the root DNS root already set?
         */
        if (env.rootdir==undefined) {
            action=true;
            /*
            ** Get the DNS root from our embedded host server...
             */
            out('Using local host server DNS...');
            Shell.set('hostport',Net.Print.port(pubhostport));
            env.rootdir = Cs.Copy.capset(hostsrv.dns.rootcs);
            stat=Status.STD_OK;
        } else action=false;
    },
    function () {
        if (action) {
            action=false;
            if (stat != Status.STD_OK) {
                Shell.status('hoststatus',false);
                Shell.status('rootstatus',false);
                out('DNS_ROOT: failed for host ' +
                Net.Print.port(pubhostport) + ': ' +
                Status.print(stat));
            } else {
                Shell.status('hoststatus',true);
                Shell.status('rootstatus',true);
                out('DNS ROOT: ' + Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                Shell.set('rootcap',Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                if (env.workdir == undefined) env.workdir = env.rootdir;
            }
        }
    },
    function () {
        if (env.rootdir != undefined) {
            DnsInt.dns_getdefafs(env.rootdir,function(_stat,_cap) {
                out('Default AFS: '+Status.print(_stat)+' is '+ Net.Print.capability(_cap));
            })
        }
    },
    function () {
        ash.dns.env.rootdir=env.rootdir;
        ash.dns.env.workdir=env.workdir;
    }
]);

Shell.update=function(xname,xvalue){
    String.match(xname,[
        ['hostport',function(){
            var hostport;
            hostport=Net.Parse.port(xvalue).port;
            Sch.ScheduleBlock([
                function () {
                    //Shell.set('hostport',Net.Print.port(hostport));
                    DnsInt.dns_getrootcap(hostport, function (_stat, _cap) {
                        stat = _stat;
                        if (stat==Status.STD_OK) {
                            env.rootdir = CsInt.cs_singleton(_cap);
                            ash.dns.dns_rootdir=env.rootdir;
                        }
                    })
                },
                function () {
                    if (stat != Status.STD_OK) {
                        Shell.status('hoststatus',false);
                        Shell.status('rootstatus',false);
                        out('DNS_ROOT: DNS_GETROOT failed for host ' +
                        Net.Print.port(hostport) + ': ' +
                        Status.print(stat));
                    } else {
                        Shell.status('hoststatus',true);
                        Shell.status('rootstatus',true);
                        out('DNS ROOT: '+Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                        Shell.set('rootcap',Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                        env.workdir = env.rootdir;
                        ash.dns.env.rootdir=env.rootdir;
                        ash.dns.env.workdir=env.rootdir;
                        env.workpath='/';
                        env.hostname=Net.Print.port(hostport);
                    }
                }
            ],function(e){
                Io.out(e);
            });
            Sch.ScheduleNext();
        }],
        ['rootcap',function() {
            var cap = Net.Parse.capability(xvalue, 0);
            if (cap != undefined) {
                env.rootdir = CsInt.cs_singleton(cap.cap);
                out('DNS ROOT: '+Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                env.workdir = env.rootdir;
                env.workpath='/';
                ash.dns.env.rootdir=env.rootdir;
                ash.dns.env.workdir=env.rootdir;
                //env.hostname=Net.Print.port(cap.cap.cap_port);
            } else {
                out('DNS_ROOT: invalid capability ' + xvalue);
            }
            Sch.ScheduleBlock([
                function () {
                    if (env.rootdir != undefined) {
                        DnsInt.dns_getdefafs(env.rootdir,function(_stat,_cap) {
                            out('Default AFS: '+Status.print(_stat)+' is '+ Net.Print.capability(_cap));
                            if (_stat==Status.STD_OK) {
                                env.defafs=_cap;
                                Shell.set('afscap',Net.Print.capability(_cap));
                            }
                        })
                    }
                }
            ],function(e){
                Io.out(e);
            });
        }],
        ['rootcap+',function() {
            var dnscap = Net.Parse.capability(xvalue, 0);
            var stat;
            var dnscs;
            if (dnscap != undefined) {
                lastdnscap=dnscap.cap;
                var name=Net.Print.port(dnscap.cap.cap_port);
                dnscs = CsInt.cs_singleton(dnscap.cap);
                out('Append DNS ROOT: '+Net.Print.capability(dnscap.cap));
                stat=hostsrv.append('dns',name,dnscs);
                if (stat!=Status.STD_OK) out('Cannot append '+name+': '+Status.print(stat));
                stat=hostsrv.append('dns','default',dnscs);
            } else {
                out('DNS_ROOT: invalid capability ' + xvalue);
            }
            Sch.ScheduleBlock([
                function () {
                    if (dnscs != undefined && env.defafs==undefined) {
                        DnsInt.dns_getdefafs(dnscs,function(_stat,_cap) {
                            out('Default AFS: '+Status.print(_stat)+' is '+ Net.Print.capability(_cap));
                            if (_stat==Status.STD_OK) {
                                env.defafs=_cap;
                                var name=Net.Print.port(_cap.cap_port);
                                var afscs = CsInt.cs_singleton(_cap);
                                out('Append AFS: ' + Net.Print.capability(_cap));
                                stat=hostsrv.append('afs',name,afscs);
                                if (stat!=Status.STD_OK) out('Cannot append '+name+': '+Status.print(stat));
                                Shell.set('afscap',Net.Print.capability(_cap));
                            }
                        })
                    }
                }
            ],function(e){
                Io.out(e);
            });

         }],
        ['afscap+',function() {
            var afscap = Net.Parse.capability(xvalue, 0);
            var stat;
            var afscs;
            if (afscap != undefined) {
                var name=Net.Print.port(dnscap.cap.cap_port);
                afscs = CsInt.cs_singleton(afscap.cap);
                out('Append AFS: '+Net.Print.capability(afscap.cap));
                stat=hostsrv.append('afs',name,afscs);
                if (stat!=Status.STD_OK) out('Cannot append '+name+': '+Status.print(stat));
            } else {
                out('AFS: invalid capability ' + xvalue);
            }
         }]



    ])
};



Shell.env=env;


env.rootdir=DnsInt.get_rootdir();
if(env.workdir==undefined) env.workdir=env.rootdir;

Shell.interpreter=function (cmd,args,callback) {
    var cmdline = cmd;
    Array.iter(args,function(arg){
        cmdline=cmdline+' '+arg;
    });
    callback('');
    ash.exec(cmdline,function(){Io.out('OK.')});
};


ash.register_action('import',function (args) {
    Shell.upload(function (file,size,data) {
        var buf=Buf.Buffer();
        out('Importing file '+file+' ['+size+'] ... ');
        Buf.buf_put_bytes(buf,data);
        ash.writefile(file,buf,function (stat,cap) {
            Io.out(Status.print(stat));
        });
    });
});
ash.register_action('export',function (args) {
    var file;
    var stat;
    var data,size,buf;
    args=Array.tail(args);
    var len=args.length;
    Sch.ScheduleLoop(function(index) {
        file=args[index];
        return index<len;
    }, [
        function() {
            Io.out('Exporting file ' + file + ' ...');
            ash.readfile(file, function (_stat, _buf) {
                stat=_stat;
                buf=_buf;
                Io.out(Status.print(stat));
                if (stat==Status.STD_OK) {
                    data = Buf.buf_get_bytes(buf);
                    size = data.length;
                }
            });
        },
        function () {
            if (stat==Status.STD_OK) Shell.download(file,size,data);
        }
    ]);

});


// Start up the network ..
Sch.ScheduleBlock([network.init]);

if (Shell.args[0]=='-compile') return;
console.log('run');


scheduler.Run();
if (monitor) Sch.AddTimer(300,'BASH Status Monitor',function () {
    var stat;
    if (conn.status==Status.STD_OK)
        Shell.status('brokerstatus',true);
    else
        Shell.status('brokerstatus',false);
    Sch.ScheduleBlock([
        function () {
            stat=Status.STD_UNKNOWN;
            if (env.defafs!=undefined) ash.std.std_info(env.defafs,function (_stat,_info){
                if (_stat==Status.STD_OK) {
                    Shell.status('afsstatus',true);
                } else {
                    Shell.status('afsstatus',false);
                }
            })
        },
        function () {
            stat=Status.STD_UNKNOWN;
            if (lastdnscap != undefined)
                ash.std.std_info(lastdnscap,function (_stat,_info){
                    if (_stat==Status.STD_OK) {
                        Shell.status('rootstatus',true);
                    } else {
                        Shell.status('rootstatus',false);
                    }});

            else if (env.rootdir!=undefined)
                ash.std.std_info(CsInt.cs_to_cap(env.rootdir),function (_stat,_info){
                if (_stat==Status.STD_OK) {
                    Shell.status('rootstatus',true);
                } else {
                    Shell.status('rootstatus',false);
                }
            })

        }
    ],function(e){
        Io.out(e);
    });
    //Sch.ScheduleNext();
});

Array.iter(todo,function (block) {
    Sch.ScheduleBlock(block);
});

