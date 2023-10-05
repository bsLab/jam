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
 **    $INITIAL:     (C) 2015-2017 bLAB
 **    $CREATED:     26-5-15.
 **    $VERSION:     1.2.17
 **
 **    $INFO:
 **
 **  DOS: DOS Terminal Shell
 **
 **    $ENDOFINFO
 */
"use strict";
var log = 0;
var version = "1.2"
var Io = Require('com/io');
//Io.trace_open('/tmp/shell.trace');

var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Sch = Require('dos/scheduler');
var Conn = Require('dos/connection');
var Rpc = Require('dos/rpc');
var Std = Require('dos/std');
var Router = Require('dos/router');
var util = Require('util');
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
var Fs = Require('fs');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Getenv = Require('com/getenv');
var Ash = Require('dos/ash');
var HostSrv = Require('dos/hostsrv');

var trace = Io.tracing;

var options = {
  bip:'localhost',
  bport:3001,
  broker: true,
  default:false,
  dip : 'localhost',
  dports : [],
  env:{},
  hostport:undefined,
  hostsrv:false,
  http:false,
  keepalive:true,
  links:[],
  myip:'localhost',
  monitor:false,
  servmode:false,
  tcpnet:1,
  verbose:0
};

options.privhostport = Net.uniqport();
options.pubhostport = Net.prv2pub(options.privhostport);

var env = Ash.Env();
var help=false;
var argv = Io.getargs();

options.env = env;

var readline = Require('dos/ext/readline');

Args.parse(argv, [
    [['-help','-h'],0,function() {help=true;}],
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
    ['-T',0,function(val){options.tcpnet=1;options.http=false;}],
    ['-T2',0,function(val){options.tcpnet=2;options.http=false;}],
    ['-H',0,function(val){options.http=true;options.tcpnet=0;}],
    ['-server',0,function(val){options.servmode=true;}],
    [['-default','-d'],0,function(val){options.default=true;}],
    ['-monitor',0,function () {options.monitor++; out('Setting monitor to level '+options.monitor); }],
    [['-v','-verbose'],0,function(val){options.verbose++; out('Setting verbosity to level '+options.verbose);}]
]);

if (help) {
    Io.out('usage: '+argv[0]+' '+argv[1]);
    Io.out('  [-H -T -T2]  Enable connection service');
    Io.out('    T: TCPIP, 1-ch H:HTTP T2: TCPIP, 2-ch');
    Io.out('    H: bport, T: bport+100');
    Io.out('    (Default: -T)');
    Io.out('  [-D <port>] UDP Server Port');
    Io.out('  [-L <src port> <UDP dst [address:]port] UDP P2P Connection');
    Io.out('  [-nokeepalive] Establish a new conncetion for each message.');
    Io.out('  [-broker <ip[:ipport]>]  Broker URL (Default: '+options.bip+': HTTP '+options.bport+' TCPNET '+(options.bport+100)+')');
    Io.out('  [-dip <VLC UDP server IP>] (Default: '+options.dip+')');
    Io.out('  [-host <port>] Set Host Port');
    Io.out('  [-root <cap|capfile>] Set Root Cap.');
    Io.out('  [+root <cap|capfile>] Appennd Root Cap.');
    Io.out('  [-default, -d] Ask broker server for default DNS => DNS root => Shell root!');
    Io.out('  [-help -h -v -verbose -monitor]');
    Io.out('  [-e <script>] Execute a script');
    return;
}
function fail(msg) {
    Io.stderr('[JASH]: Fatal error: '+msg+'\n');
    Io.exit(0);
}
function out(msg) {
    Io.stdout('[JASH]: '+msg+'\n');
}
function warn(msg) {
    Io.stderr('[JASH]: Warning: '+msg+'\n');
}
var scheduler = Sch.TaskScheduler();
scheduler.Init();

// Set-up the network environment ..
// typeof options : {http,tcpnet,dports,bip,bport,myip,verbose}
var network = Conn.setup(options);


var todo=[];

var router = network.router;
var rpc = network.rpc;



var StdInt = Std.StdInt(rpc);
var DnsInt = Dns.DnsInt(rpc);
var CsInt = Cs.CsInt(rpc);
var ash = Ash.Ash(rpc,scheduler,env);

if (!Comp.isNodeJS()) {
    fail('Shell can only be executed on the node.js platform.');
}


var cap;
if (Obj.isString(env.rootdir)) {
    cap=Net.Parse.capability(env.rootdir,0);
    if(cap!=undefined) {
        env.rootdir=CsInt.cs_singleton(cap.cap);
        DnsInt.set_rootdir(env.rootdir);
    }
} else env.rootdir=undefined;
if (Obj.isString(env.workdir)) {
    cap=Net.Parse.capability(env.workdir,0);
    if(cap!=undefined) {
        env.workdir=CsInt.cs_singleton(cap.cap);
    }
} else env.workdir=undefined;


var stat=Status.STD_OK;
Args.parse(argv, [
    [['-root','-r'],1,function(val) {
        cap = Net.Parse.capability(val, 0);
        if (cap != undefined) {
            env.rootdir = CsInt.cs_singleton(cap.cap);
            if (env.workdir == undefined) env.workdir = env.rootdir;
        } else {
            /*
            ** Capabiliy file path?
             */
            cap = Net.cap_of_file(val);
            env.rootdir = CsInt.cs_singleton(cap);
            if (env.workdir == undefined) env.workdir = env.rootdir;
        }
    }],
    [['+root','+r'],1,function(val) {
        var dnscap,dnscs;
        dnscap = Net.Parse.capability(val, 0);
        if (dnscap == undefined) {
            /*
             ** Capabiliy file path?
             */
            dnscap = Net.cap_of_file(val);
        } else dnscap=dnscap.cap;
        if (dnscap != undefined) {            
            todo.push([
                function () {
                    var name = Net.Print.port(dnscap.cap_port);
                    dnscs = CsInt.cs_singleton(dnscap);
                    out('Append DNS ROOT: ' + Net.Print.capability(dnscap));
                    hostsrv.append('dns/'+name, dnscs, function (_stat) {stat=_stat});
                    if (stat != Status.STD_OK) out('Cannot append ' + name + ': ' + Status.print(stat));
                    stat = hostsrv.append('dns/default', dnscs);
                },
                function () {
                    if (dnscs != undefined && env.defafs==undefined) {
                        DnsInt.dns_getdefafs(dnscs,function(_stat,_cap) {
                            out('Default AFS: '+Status.print(_stat)+' is '+ Net.Print.capability(_cap));
                            if (_stat==Status.STD_OK) {
                                env.defafs=_cap;
                                var name=Net.Print.port(_cap.cap_port);
                                var afscs = CsInt.cs_singleton(_cap);
                                out('Append AFS: ' + Net.Print.capability(_cap));
                                hostsrv.append('afs/'+name,afscs, function (_stat) {stat=_stat});
                                if (stat!=Status.STD_OK) out('Cannot append '+name+': '+Status.print(stat));
                            }
                        })
                    }
                }

            ])
        } else {
            out('DNS_ROOT: invalid capability (or file) ' + val);
        }
    }],
    [['-host','-h'],1,function(val) {
        var port = Net.Parse.port(val, 0);
        if (port != undefined) {
            options.hostport = port.port;
            todo.push([
                function () {
                    DnsInt.dns_getrootcap(options.hostport, function (_stat, _cap) {
                            stat = _stat;
                            if (stat==Status.STD_OK) {
                                env.rootdir = CsInt.cs_singleton(_cap);
                            }
                    })
                },
                function () {
                    if (stat != Status.STD_OK) {
                        Io.out('DNS_ROOT: DNS_GETROOT failed for host ' +
                            Net.Print.port(options.hostport) + ': ' +
                            Status.print(stat));
                        rl.setPrompt(env.prompt());
                        rl.prompt();
                    } else {
                        Io.out('DNS ROOT: '+Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                        if (env.workdir == undefined) env.workdir = env.rootdir;
                    }
                }
            ]);
        }

    }],
    [['-exec','-e'],1,function(val) {
        if (!Io.exists(val)) {
            fail('file not found: '+val);
        } else {
            var file=Io.read_file(val);
            if (file==undefined) fail('can\'t read file '+val);
            var lines=String.split('\n',file);
            Array.concat(env.script,lines);
        }
    }]
]);

var action=false;
/**
 *
 * @type {undefined|hostserver}
 */
var hostsrv=undefined;
if (options.hostport==undefined) 
  hostsrv=HostSrv.HostServer(scheduler,rpc,options);

todo.push([
    function () {
        /*
         ** Was the root DNS root already set?
         */
        if (env.rootdir==undefined && hostsrv!=undefined) {
            action=true;
            /*
             ** Get the DNS root from our embedded host server...
             */
            Io.out('Using local host server DNS ..');
            env.rootdir = Cs.Copy.capset(hostsrv.rootcs);
            env.hostname = Net.Print.port(options.pubhostport);
            stat=Status.STD_OK;
        }
    },
    function () {
        if (action) {
            action=false;
            if (stat != Status.STD_OK) {
                Io.out('DNS_ROOT: failed for host ' +
                Net.Print.port(options.pubhostport) + ': ' +
                Status.print(stat));
            } else {
                if (env.workdir == undefined) env.workdir = env.rootdir;
            }
        }
        out('DNS ROOT: ' + Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
    },
    function () {
        if (env.rootdir != undefined) {
            DnsInt.dns_getdefafs(env.rootdir,function(_stat,_cap) {
                out('Default AFS: '+Status.print(_stat)+' is '+ Net.Print.capability(_cap));
                if (_stat==Status.STD_OK) {
                    env.defafs=_cap;
                }
            })
        }
    },
    function () {
        ash.dns.env.rootdir=env.rootdir;
        ash.dns.env.workdir=env.workdir;
    }
]);


var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer : function (cmdline) {
        var args = Array.filter(String.split(' ', cmdline), function (str) {
            return str != '';
        });
        var completed=cmdline;
        var choices=[];
        var argi = 0;
        if (args.length>0) {
            if (String.equal(args[0],'cd') ||
                String.equal(args[0],'dir') ||
                String.equal(args[0],'del')) {
                choices=env.workrows;
                Array.iter(args,function (arg,index) {
                    if (String.get(arg,0)!='-') argi=index;
                });
                if (args.length==1 || argi==0) {
                    choices=env.workrows;
                    if (choices.length==1) completed='';
                } else {
                    var matches=Array.filter(choices,function (choice) {
                        return (choice.indexOf(args[argi])!=-1);
                    });
                    completed = args[argi];
                    choices = matches;
                }
            }
        }
        return [choices,completed];
    }
});

if (Array.empty(env.script))
    Io.stdout(
    ' +------------------------------------------------+\n' +
    ' | JASH ' + Printf.sprintf2(['v. ',['%7s',version],['%32s','']]) + '|\n'+
    ' | JS Distributed Amoeba Virtual Machine Shell    |\n' +
    ' +------------------------------------------------+\n\n');



stat=Status.STD_OK;
var cmdline='';
var line;
/*
** Main interpreter loop
 */
Sch.ScheduleBlock([],function (e) {
    Io.out('[SHELL] uncaught exception:');
    if (typeof e != 'number') Io.printstack(e,'Shell.top');
    else Io.out(Status.print(e));
    process.exit(0);
});

if (!options.servmode) {
    var context = Sch.GetCurrent();
    rl.on('line', function (line) {
        Sch.Wakeup(context);
        cmdline = line;
    });

    rl.on('close', function () {
        Sch.Wakeup(context);
        stat = Status.STD_INTR;
    });
    Sch.ScheduleLoop(function () {
        return (stat == Status.STD_OK);
    }, [
        function () {
            if (!Array.empty(env.script)) {
                env.in_script = true;
                cmdline = Array.head(env.script);
                env.script = Array.tail(env.script);
            } else {
                Sch.Suspend();
                cmdline = '';
                rl.setPrompt(env.prompt());
                rl.prompt();
            }
        },
        function () {
            var path;
            if (stat != Status.STD_OK) throw stat;
            ash.exec(cmdline);
        }
    ], [
        function () {
            if (!env.in_script) Io.out('\nHave a great day!');
            process.exit(0);
        }
    ], function (e) {
        if (typeof e != 'number') {
            Io.out('[SHELL] uncaught exception:');
            Io.printstack(e);
        }
        else if (e != Status.STD_INTR) {
            Io.out('[SHELL] uncaught error:');
            Io.out(Status.print(e));
        }
        if (!env.in_script) Io.out('\nHave a great day!');
        process.exit(0);
    });
}

ash.register_action('import',function (args) {
    var path;
    args=Array.tail(args);
    var len=args.length;
    Sch.ScheduleLoop(function(index) {
        path=args[index];
        return index<len;
        }, [
        function() {
            var file = Filename.basename(path);
            var data = Io.read_file(path);
            if (data!=undefined) {
                var size = data.length;
                var buf = Buf.Buffer();
                Buf.buf_of_str(buf, data);
                Io.out('Importing file ' + file + ' [' + size + '] ... ');
                ash.writefile(file, buf, function (stat, cap) {
                    Io.out(Status.print(stat));
                });
            } else {
                Io.out(Status.print(Status.STD_IOERR));
            }
        }]);
});

ash.register_action('export',function (args) {
    var file;
    var stat;
    var data,buf;
    args=Array.tail(args);
    var len=args.length;
    Sch.ScheduleLoop(function(index) {
        file=args[index];
        return index<len;
    }, [
        function() {
            Io.out('Exporting file ' + file + ' ... ');
            ash.readfile(file, function (_stat, _buf) {
                stat=_stat;
                buf=_buf;
                Io.out(Status.print(stat)+' '+buf.data.length);
                if (stat==Status.STD_OK)
                    data = Buf.buf_to_str(buf);
            });
        },
        function () {
            if (stat==Status.STD_OK) {
                stat = Io.write_file(file,data);
                if (stat<=0) Io.out(Status.print(Status.STD_IOERR));
            }

        }
    ]);
});

Sch.ScheduleBlock(Array.flatten(todo));

// Start up the network ..
network.init(network.start);

scheduler.Run();
