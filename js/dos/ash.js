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
 **    $CREATED:     13-6-15 by sbosse.
 **    $VERSION:     1.1.6
 **
 **    $INFO:
 **
 **  DOS: Amoeba Shell Interpreter Module
 **
 * TODO: merge rootdir/workdir variables in env/dns objects
 **
 **    $ENDOFINFO
 */
"use strict";
var Io = Require('com/io');
//Io.trace_open('/tmp/shell.trace');

var Net = Require('dos/network');
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
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
var Status = Net.Status;
var Command = Net.Command;
var Fs = Require('fs');
var Dns = Require('dos/dns');
var Afs = Require('dos/afs');
var Cs = Require('dos/capset');

/**
 * @param privhostport
 * @param pubhostport
 * @param hostname
 * @param workdir
 * @param rootdir
 * @param workpath
 * @param echo
 * @constructor
 *
 */
var env = function (privhostport,pubhostport,hostname,workdir,rootdir,workpath,echo) {
    var workenv = Io.getenv('WORKCAP','');
    var rootenv = Io.getenv('ROOTCAP','');
    /*
     ** This host!
     */
    this.privhostport = privhostport||Net.uniqport();
    this.pubhostport = pubhostport||Net.prv2pub(this.privhostport);
    this.hostname = hostname||Net.Print.port(this.pubhostport);
    /*
     ** Working environment. If not defined, working dir = resolved root directory.
     *  Note: workdir must be kept in sync with dns.env.workdir!
     */
    if (workdir) this.workdir = workdir;
    else if (!String.empty(workenv)) this.workdir=workenv;
    else this.workdir=undefined;

    /*
     ** 1. A DNS directory capability (textual representation)
     ** 2. A Host Server port (rootdir is resolved by a DNS_GETROOTCAP request)
     *  Note: rootdir must be kept in sync with dns.env.rootdir!
     */
    if (rootdir) this.rootdir = rootdir;
    else if (!String.empty(rootenv)) this.rootdir=rootenv;
    else this.rootdir=undefined;

    this.defafs=undefined;

    this.afs_colmask = Afs.AFS_DEFAULT_RIGHTS;
    this.dns_colmask = Dns.DNS_DEFAULT_RIGHTS;

    this.workpath = workpath||'/';
    this.echo=echo||false;
    this.parentdir=[];

    this.script=[];
    this.in_script=false;

    this.prompt = function () {
        return this.hostname+this.workpath+' > ';
    };

    /*
    ** Current working directory row names
     */
    this.workrows=[];
};


function fail(msg) {
    Io.stderr('[JASH]: Fatal error: '+msg+'\n');
    process.exit(0);
}
function out(msg) {
    Io.stdout('[JASH]: '+msg+'\n');
}
function warn(msg) {
    Io.stderr('[JASH]: Warning: '+msg+'\n');
}

/**
 *
 * @param {rpcint} rpc
 * @param {scheduler} scheduler
 * @param {env} env
 * @constructor
 * @typedef {{rpc,env,scheduler,std,dns,afs,cs}} ash~obj
 * @see ash~obj
 */
var ash = function(rpc,scheduler,env) {
    this.rpc=rpc;
    this.env=env;
    this.scheduler=scheduler;
    this.std = Std.StdInt(rpc);
    this.dns = Dns.DnsInt(rpc);
    this.afs = Afs.AfsInt(rpc);
    this.cs = Cs.CsInt(rpc);
    /*
    ** Externally supplied action handlers
     */
    this.actions = [];

    this.dns.env.workdir = env.workdir;
};

/** Execute a shell command. Installs a scheduler block only!
 *
 * @param {string} cmdline
 * @param {function} [refresh] shell update callback (only called if there was no output)
 */
ash.prototype.exec = function(cmdline,refresh) {
    var self=this;
    var env=this.env;
    var scheduler=this.scheduler;
    var StdInt = this.std;
    var CsInt = this.cs;
    var DnsInt = this.dns;
    var stat=Status.STD_OK;


    Sch.ScheduleBlock([
         function () {
             var path;
             var line;

             if (env.echo) Io.out(cmdline);
             var args1 = Array.filter(String.split(' ', cmdline), function (str) {
                 return str != '';
             });
             /*
              ** Glue strings again...
              */
             var args = [];
             var curarg = '';
             var instr = false;
             Array.iter(args1, function (arg) {
                 if (!instr && String.get(arg, 0) == '"') {
                     instr = true;
                     curarg = String.trim(arg, 1, 0);
                 } else if (instr) {
                     if (String.get(arg,arg.length-1)=='"') {
                         instr=false;
                         curarg = curarg + ' ' +String.trim(arg,0,1);
                         args.push(curarg);
                     }
                     else curarg = curarg + ' ' + arg;
                 } else args.push(arg);
             });

             if (!Array.empty(args)) String.match(args[0], [
                 /*
                  ** CD
                  */
                 ['cd', function () {
                     var cs;
                     var stat;
                     var dir;
                     var rownum;
                     var row;
                     var help;
                     var info;

                     Array.iter(args, function (arg, index) {
                         if (index > 0) {
                             String.match(arg, [
                                 ['-h', function () {
                                     help = true;
                                 }]
                             ])
                         }
                     });
                     if (args.length == 1) help = true;
                     if (help) {
                         Io.out('usage:\n  cd <relative path>|<absolute path>| #<current working dir. row number>');
                     }
                     else if (args.length == 2) {
                         path = args[1];
                         env.workrows=[];
                         if (Filename.is_relative(path) && env.workdir != undefined) {
                             if (String.get(path, 0) == '#') {
                                 rownum = Perv.int_of_string(String.trim(path, 1, 0));
                                 if (isNaN(rownum)) throw Status.STD_ARGBAD;
                                 /*
                                  ** Select the n-th row of the current working directory.
                                  */
                                 Sch.ScheduleBlock([
                                     function () {
                                         DnsInt.dns_list(env.workdir, function (_stat, _dir) {
                                             dir = _dir;
                                             stat = _stat;
                                         });
                                     },
                                     function () {
                                         if (stat != Status.STD_OK) throw stat;
                                         if (rownum >= dir.di_rows.length) throw Status.STD_NOTFOUND;
                                         row = dir.di_rows[rownum];
                                         DnsInt.dns_lookup(env.workdir, row.de_name, function (_stat, _cs) {
                                             stat = _stat;
                                             cs = _cs;
                                         })
                                     },
                                     function () {
                                         if (stat != Status.STD_OK) throw stat;
                                         StdInt.std_info(CsInt.cs_to_cap(cs),function (_stat,_info) {
                                             stat = _stat;
                                             info = _info;
                                         });
                                     },
                                     function () {
                                         if (stat != Status.STD_OK) throw stat;
                                         if (String.empty(info) || String.get(info,0)!='/') throw Status.STD_DENIED;
                                         env.workpath = Filename.path_normalize(env.workpath + '/' + row.de_name);
                                         Array.push(env.parentdir, env.workdir);
                                         env.workdir = cs;
                                         self.dns.env.workdir = env.workdir;
                                         if (refresh) refresh();
                                     }
                                 ], function (e) {
                                     if (typeof e != 'number') Io.inspect(e);
                                     else Io.out(Status.print(e));
                                 })
                             } else if (String.equal(path, '..')) {
                                 if (Array.empty(env.parentdir)) {
                                     Io.out('No parent directory defined.');
                                 } else {
                                     env.workpath = Filename.path_normalize(env.workpath + '/..');
                                     env.workdir = Array.pop(env.parentdir);
                                     self.dns.env.workdir = env.workdir;
                                     if (refresh) refresh();
                                 }
                             } else {
                                 var pathelem = String.split('/', path);
                                 if (pathelem.length == 1) {
                                     Sch.ScheduleBlock([
                                         function () {
                                             DnsInt.dns_lookup(env.workdir, pathelem[0], function (_stat, _cs) {
                                                 stat = _stat;
                                                 cs = _cs;
                                             })
                                         },
                                         function () {
                                             if (stat != Status.STD_OK) throw stat;
                                             StdInt.std_info(CsInt.cs_to_cap(cs),function (_stat,_info) {
                                                 stat = _stat;
                                                 info = _info;
                                             });
                                         },
                                         function () {
                                             if (stat != Status.STD_OK) throw stat;
                                             if (String.empty(info) || String.get(info,0)!='/') throw Status.STD_DENIED;

                                             env.workpath = Filename.path_normalize(env.workpath + '/' + pathelem[0]);
                                             Array.push(env.parentdir, env.workdir);
                                             env.workdir = cs;
                                             self.dns.env.workdir = env.workdir;
                                             if (refresh) refresh();

                                         }
                                     ], function (e) {
                                         if (typeof e != 'number') Io.inspect(e);
                                         else Io.out(Status.print(e));
                                     })
                                 }
                             }
                         } else if (!Filename.is_relative(path)) {
                             Io.out('Not implemented.');
                         } else {
                             Io.out('No working directory defined.');
                         }
                     }
                 }],
                 /*
                  ** DEL
                  */
                 ['del', function () {
                     var cs;
                     var stat;
                     var dir;
                     var rownum;
                     var row;
                     var help;
                     var destroy;
                     var rowcs;
                     var i;

                     if (args.length == 1) help = true;

                     args = Array.filter(args, function (arg, index) {
                         if (index > 0) {
                             var use=false;
                             String.match(arg, [
                                 ['-h', function () {
                                     help = true;
                                     use = false;
                                 }],
                                 ['-d', function () {
                                     destroy = true;
                                     use = false;
                                 }],
                                 function () {
                                     use = true;
                                 }
                             ]);
                             return use;
                         } else return false;
                     });
                     if (help) {
                         Io.out('usage:\n  del [-d] <relative path>|<absolute path>');
                     }
                     else {
                         if (args.length == 1) {
                             var path = args[0];
                             if (Filename.is_relative(path) && env.workdir != undefined) {
                                 var pathelem = String.split('/', path);
                                 if (pathelem.length == 1) {
                                     Sch.ScheduleBlock([
                                         function () {
                                             DnsInt.dns_lookup(env.workdir, pathelem[0], function (_stat,_cs) {
                                                 stat=_stat;
                                                 rowcs=_cs;
                                             })
                                         },
                                         function () {
                                             if (stat==Status.STD_OK) DnsInt.dns_delete(env.workdir, pathelem[0],
                                                 function (_stat) {
                                                     stat = _stat;
                                                 })
                                         },
                                         function () {
                                             if (stat==Status.STD_OK && destroy) {
                                                 Sch.ScheduleLoop(function (index) {
                                                     i=index;
                                                     return index < rowcs.cs_final;
                                                 }, [
                                                     function () {
                                                         StdInt.std_destroy(rowcs.cs_suite[i].s_object,function (_stat) {
                                                             Io.out('Destroyed '+Net.Print.capability(rowcs.cs_suite[i].s_object)+ ': '+
                                                                 Status.print(_stat));
                                                         })
                                                     }
                                                 ])
                                             }
                                         },
                                         function () {
                                             if (stat != Status.STD_OK) Io.out(Status.print(stat));
                                             else {
                                                 env.workrows=[];
                                                 if (refresh) refresh();
                                             }

                                         }
                                     ])
                                 }
                             }
                         }
                     }
                 }],
                 /*
                  ** DIR
                  */
                 ['dir', function () {
                     var long = false;
                     var info = false;
                     var help = false;
                     var pcap = false;
                     var paths = [];
                     var stat;
                     var dir;
                     var len;

                     function print_dir(dir) {
                         env.workrows=[];
                         DnsInt.dns_list(dir, function (_stat, _dir) {
                             if (_stat == Status.STD_OK) {
                                 if (long && !info) {
                                     line = Printf.sprintf2([
                                         ['%35s', 'Name'],
                                         ' ',
                                         ['%12s', '        Time'],
                                         '  ',
                                         ['%10s', 'Rights'],
                                         '  ',
                                         ['%3s', 'Row']
                                     ]);
                                     Io.out(line);
                                     Io.out('------------------------------------------------------------------');
                                     Array.iter(_dir.di_rows, function (row, index) {
                                         var cols = '';
                                         Array.iter(row.de_columns, function (col, index) {
                                             if (index > 0) cols = cols + '-';
                                             cols = cols + String.format_hex(col, 2);
                                         });
                                         env.workrows.push(row.de_name);
                                         line = Printf.sprintf2([
                                             ['%35s', row.de_name],
                                             ' ',
                                             ['%12d', row.de_time],
                                             '  ',
                                             ['%10s', cols],
                                             '  ',
                                             ['%3d', index]
                                         ]);
                                         Io.out(line);
                                     });
                                 } else if (info || pcap) {
                                     var rowlen = _dir.di_rows.length;
                                     var row;
                                     var index = 0;
                                     var cs = undefined;
                                     if (info)
                                         line = Printf.sprintf2([
                                             ['%35s', 'Name'],
                                             ' ',
                                             ['%30s', 'Info']]);
                                     else
                                         line = Printf.sprintf2([
                                             ['%35s', 'Name'],
                                             ' ',
                                             ['%30s', 'Capability']]);


                                     Io.out(line);
                                     Io.out('------------------------------------------------------------------');

                                     Sch.ScheduleLoop(function () {
                                         return index < rowlen;
                                     }, [
                                         function () {
                                             row = _dir.di_rows[index];
                                             DnsInt.dns_lookup(_dir.di_capset, row.de_name, function (_stat, _cs) {
                                                 stat = _stat;
                                                 cs = _cs;
                                             })
                                         },
                                         function () {
                                             index++;
                                             if (stat != Status.STD_OK) {
                                                 line = Printf.sprintf2([
                                                     ['%35s', row.de_name],
                                                     ' ',
                                                     ['%30s', Status.print(stat)]
                                                 ]);
                                                 Io.out(line);
                                             } else Sch.ScheduleBlock([
                                                 function () {
                                                     if (info)
                                                         StdInt.std_info(CsInt.cs_to_cap(cs), function (_stat, _infoline) {
                                                             env.workrows.push(row.de_name);

                                                             line = Printf.sprintf2([
                                                                 ['%35s', row.de_name],
                                                                 ' ',
                                                                 ['%30s', (_stat == Status.STD_OK ? _infoline : Status.print(_stat))]
                                                             ]);
                                                             Io.out(line);
                                                         });
                                                     else {
                                                         env.workrows.push(row.de_name);

                                                         line = Printf.sprintf2([
                                                             ['%35s', row.de_name],
                                                             ' ',
                                                             ['%30s', (Net.Print.capability(CsInt.cs_to_cap(cs)))]
                                                         ]);
                                                         Io.out(line);
                                                     }
                                                 }
                                             ])

                                         }
                                     ])
                                 } else {
                                     line = '';
                                     Array.iter(_dir.di_rows, function (row, index) {
                                         env.workrows.push(row.de_name);
                                         if (index > 0) line = line + ' ';
                                         line = line + row.de_name;
                                     });
                                     if (String.empty(line)) line='(Empty)';
                                     Io.out(line);
                                 }
                             } else {
                                 Io.out(Status.print(_stat));
                             }
                         })
                     }

                     Array.iter(args, function (arg, index) {
                         if (index > 0) {
                             String.match(arg, [
                                 ['-l', function () {
                                     long = true;
                                 }],
                                 ['-i', function () {
                                     info = true;
                                 }],
                                 ['-c', function () {
                                     pcap = true;
                                 }],
                                 ['-h', function () {
                                     help = true;
                                 }],
                                 function () {
                                     if (arg != '') paths.push(arg);
                                 }
                             ])
                         }
                     });
                     if (help) {
                         Io.out('usage:\n'+
                                '  dir [-l (long) -i (info) -h (help) -c (print capability)]\n' +
                                '      [<path1>] [<path2>  ..]');
                     }
                     else {
                         if (Array.empty(paths) && env.workdir != undefined) {
                             print_dir(env.workdir);
                         } else if (!Array.empty(paths)) {
                             len = paths.length;
                             Sch.ScheduleLoop(function (index) {
                                 path = paths[index];
                                 return index < len;
                             }, [
                                 function () {
                                     DnsInt.dns_lookup(env.rootdir, path, function (_stat, _cs, rest) {
                                         stat = _stat;
                                         dir = _cs;
                                     })
                                 },
                                 function () {
                                     if (stat == Status.STD_OK) {
                                         print_dir(dir);
                                     } else {
                                         Io.out(Status.print(stat));
                                     }
                                 }
                             ])
                         } else {
                             Io.out(Status.print(Status.STD_NOTNOW));
                         }
                     }
                 }],
                 /*
                ** MKDIR
                */
                 ['mkdir', function () {
                     var cs;
                     var stat;
                     var dir;
                     var rownum;
                     var row;
                     var help;

                     Array.iter(args, function (arg, index) {
                         if (index > 0) {
                             String.match(arg, [
                                 ['-h', function () {
                                     help = true;
                                 }]
                             ])
                         }
                     });
                     if (args.length == 1) help = true;
                     if (help) {
                         Io.out('usage:\n  mkdir <relative path>|<absolute path>');
                     }
                     else {
                         if (args.length == 2) {
                             var path = args[1];
                             if (Filename.is_relative(path) && env.workdir != undefined) {
                                 var pathelem = String.split('/', path);
                                 if (pathelem.length == 1) {
                                     Sch.ScheduleBlock([
                                         function () {
                                             DnsInt.dns_create(env.workdir, Dns.DNS_DEFAULT_COLS, function (_stat, _cs) {
                                                 stat = _stat;
                                                 cs = _cs;
                                             })
                                         },
                                         function () {
                                             if (stat != Status.STD_OK) Io.out(Status.print(stat));
                                             else DnsInt.dns_append(env.workdir, pathelem[0], cs, Dns.DNS_DEFAULT_RIGHTS,
                                                 function (_stat) {
                                                     stat = _stat;
                                                 })
                                         },
                                         function () {
                                             if (stat != Status.STD_OK) Io.out(Status.print(stat));
                                             else if (refresh) refresh();

                                         }
                                     ])
                                 }
                             }
                         }
                     }
                 }],
                 ['exit', function () {
                     throw Status.STD_INTR;
                 }],
                 ['$ROOT', function () {
                     Io.out(Net.Print.capability(CsInt.cs_to_cap(env.rootdir)));
                 }],
                 function (val) {
                     var action = Array.find(self.actions,function (action) {
                        return (String.equal(action[0],val));
                     });
                     if (action!=undefined) {
                         var fun=action[1];
                         fun(args);
                     }
                     else Io.out('Unknown command '+val);
                 }
             ]);
         }
    ],function (e) {
        if (typeof e != 'number') {
            Io.out('[SHELL] uncaught exception:');
            Io.printstack(e,'Ash.exec');
        }
        else if (e != Status.STD_INTR) {
            Io.out('[SHELL] uncaught error:');
            Io.out(Status.print(e));
        }
        if (!env.in_script) Io.out('\nHave a great day!');
        Io.exit(0);
    });
};


ash.prototype.register_action = function (name,fun) {
    this.actions.push([name,fun])
};

/**
 *
 * @param {string} file
 * @param {function((Status.STD_OK|*),(buffer|undefined))} callback
 */
ash.prototype.readfile = function(file,callback){
    var cap,stat;
    var afs = this.afs;
    var dns = this.dns;
    var cs = this.cs;
    var fcs,size;
    var env = this.env;
    var buf=Buf.Buffer();

    Sch.ScheduleBlock([
        function () {
            dns.dns_lookup(env.workdir,file,function (_stat,_cs) {
                stat=_stat;
                fcs=_cs;
            });
        },
        function () {
            if (stat!=Status.STD_OK) throw stat;
            /*
             ** Create file
             */
            cap=cs.cs_to_cap(fcs);
            afs.afs_size(cap,function (_stat,_size){
                stat=_stat;
                size=_size;
            })
        },
        function () {
            if (stat!=Status.STD_OK) throw stat;
            /*
             ** Create file
             */
            afs.afs_read(cap,buf,0,size,function (_stat,_n){
                stat=_stat;
            })
        },
        function () {
            if (stat!=Status.STD_OK) throw stat;
            callback(stat,buf);
        }
    ], function(e) {
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'ash.readfile');
            callback(Status.STD_SYSERR,undefined);
        }
    })
};

/** Store a file in the default AFS and append capability to current working directory.
 *
 * @param {string} file
 * @param {buffer} buf
 * @param {function((Status.STD_OK|*),(capability|undefined))} callback
 */
ash.prototype.writefile = function(file,buf,callback){
    var size = buf.data.length;
    var afs = this.afs;
    var dns = this.dns;
    var std = this.std;
    var cs = this.cs;
    var self = this;
    var env = this.env;
    var cap,stat;

    if (size == 0) callback(Status.STD_ARGBAD,undefined);
    else if (env.defafs==undefined) callback(Status.STD_NOTNOW,undefined);
    else Sch.ScheduleBlock([
            function () {
                /*
                ** Create file
                 */
                afs.afs_create(env.defafs,buf,size,Afs.AFS_SAFETY,function (_stat,_cap){
                    stat=_stat;
                    cap=_cap;
                })
            },
            function () {
                if (stat!=Status.STD_OK) throw stat;
                /*
                ** Append file to current working directory
                 */
                dns.dns_append(dns.env.workdir,file,cs.cs_singleton(cap),env.afs_colmask,function(_stat) {
                    stat=_stat;
                })
            },
            function () {
                if (stat!=Status.STD_OK) {
                    std.std_destroy(cap,function (_stat) {
                        Io.out('Destroyed: '+Net.Print.capability(cap)+ ' '+Status.print(_stat));
                    })
                }
            },
            function () {
                callback(stat,cap);
            }
        ], function(e) {
            if (typeof e == 'number') callback(e,undefined); else {
                Io.printstack(e,'ash.writefile');
                callback(Status.STD_SYSERR,undefined);
            }
        })
};

module.exports = {
    /**
     *
     * @param [privhostport]
     * @param [pubhostport]
     * @param [hostname]
     * @param [workdir]
     * @param [rootdir]
     * @param [workpath]
     * @param [echo]
     * @returns {env}
     */
    Env: function(privhostport,pubhostport,hostname,workdir,rootdir,workpath,echo) {
        var obj = new env(privhostport,pubhostport,hostname,workdir,rootdir,workpath,echo);
        Object.preventExtensions(obj);
        return obj;
    },
    /**
     *
     * @param rpc
     * @param scheduler
     * @param env
     * @returns {ash}
     */
    Ash: function (rpc,scheduler,env) {
        var obj = new ash(rpc,scheduler,env);
        Object.preventExtensions(obj);
        return obj;
    }
};
