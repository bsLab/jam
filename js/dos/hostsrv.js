/**
 **      ==============================
 **       OOOO        O      O   OOOO
 **       O   O       O     O O  O   O
 **       O   O       O     O O  O   O
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
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:      5/25/15 by sbosse.
 **    $VERSION:     1.3.11
 **
 **    $INFO:
 **
 **  DOS: Host Server
 **
 * The HOST Server listening on the public host port.
 * Provides a simple plain DNS (one root directory) used for publishing local servers.
 *
 * Basic directory structure:
 *
 * /
 * /hosts
 * /domains
 * /dns
 *
 **
 **    $ENDOFINFO
 */

var log = 0;
var util = Require('util');
var Io = Require('com/io');
var trace = Io.tracing;


var Net = Require('dos/network');
var Rpc = Require('dos/rpc');
var Router = Require('dos/router');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var String = Comp.string;
var Array = Comp.array;
var assert = Comp.assert;
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var DnsCom = Require('dos/dns_srv_common');
var DnsEMB = Require('dos/dns_srv_emb');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;

var isNodeJS = Comp.isNodeJS();



/** Create a HOST server with embedded DNS
 *
 * @param {rpcint} rpc
 * @param {{pubhostport,privhostport,verbose}} options
 * @param {string} [name]
 * @param {object} [env]
 * @constructor
 */
var hostserver = function (rpc,options,name,env) {
    var main = this,
        router = rpc.router

    this.env=env||{};
    this.options=options||{verbose:0};
    
    this.CsInt = Cs.CsInt(rpc);
    this.name=name||Net.Print.port(options.pubhostport);
    this.out=function(msg) {(options.out||Io.out)('[HOST '+main.name+'] '+msg)};
    this.err=function(msg) {(options.out||Io.out)('[HOST '+main.name+'] Error: '+msg)};

    /*
    ** Simple DNS (only one root directory) table
     */
    this.random=Net.uniqport();
    this.dns = Dns.DnsInt(rpc);
    this.dnsSrv = DnsEMB.Server(rpc);
    this.dnsSrv.create_dns(options.pubhostport,options.privhostport,this.random,false,Dns.DNS_DEFAULT_COLS);

    if (this.options.verbose>0) this.out('My host port is '+Net.Print.port(router.hostport));
    if (this.options.verbose>0) this.out('My host name is '+this.name);
    if (this.options.verbose>0) this.out('DNS Root is '+Net.Print.capability(this.CsInt.cs_to_cap(this.dnsSrv.rootcs)));

    this.hostcap = Net.Capability(options.pubhostport,Net.Private(0,Rights.PRV_ALL_RIGHTS,this.random));
    this.info='HOST '+this.name;
    
    if (env && !env.rootdir) env.rootdir=this.dnsSrv.rootcs;
    this.rootcs=this.dnsSrv.rootcs;
    
    // Server

    this.services = [];
    this.dns_rights = [
        Rights.DNS_RGT_OWNER|Rights.DNS_RGT_GROUP|Rights.DNS_RGT_OTHERS|
            Rights.DNS_RGT_READ|Rights.DNS_RGT_MODIFY|Rights.DNS_RGT_DELETE|Rights.DNS_RGT_CREATE,
        Rights.DNS_RGT_GROUP|Rights.DNS_RGT_OTHERS|
            Rights.DNS_RGT_READ,
        Rights.DNS_RGT_OTHERS|
            Rights.DNS_RGT_READ
    ];
    this.host_rights = [
        Rights.HOST_INFO|Rights.HOST_READ|Rights.HOST_WRITE|Rights.HOST_EXEC,
        Rights.HOST_INFO|Rights.HOST_READ|Rights.HOST_WRITE|Rights.HOST_EXEC,
        Rights.HOST_INFO
    ];

    this.afs_rights = [
        Rights.AFS_RGT_ADMIN|Rights.AFS_RGT_CREATE|Rights.AFS_RGT_DESTROY|Rights.AFS_RGT_MODIFY|Rights.AFS_RGT_READ,
        Rights.AFS_RGT_READ,
        Rights.AFS_RGT_READ
    ];

    /*
     ** Create initial directory structure...
     */
    main.hostsdir=main.dnsSrv.create_dir(Dns.DNS_DEFAULT_COLS);
    main.domainsdir=main.dnsSrv.create_dir(Dns.DNS_DEFAULT_COLS);
    main.dnsdir=main.dnsSrv.create_dir(Dns.DNS_DEFAULT_COLS);
    main.afsdir=main.dnsSrv.create_dir(Dns.DNS_DEFAULT_COLS);
    main.rootdir=main.dnsSrv.rootdir;
    
    main.dnsSrv.append_row(main.hostsdir,
                        DnsCom.Dns_row(main.name,main.dnsSrv.time(),this.host_rights,
                                       main.CsInt.cs_singleton(main.hostcap)));

    main.dnsSrv.append_row(main.dnsSrv.rootdir,DnsCom.Dns_row('hosts',main.dnsSrv.time(),this.dns_rights,
                                                        main.dnsSrv.capset_of_dir(main.hostsdir)));
    main.dnsSrv.append_row(main.dnsSrv.rootdir,DnsCom.Dns_row('domains',main.dnsSrv.time(),this.dns_rights,
                                                        main.dnsSrv.capset_of_dir(main.domainsdir)));
    main.dnsSrv.append_row(main.dnsSrv.rootdir,DnsCom.Dns_row('dns',main.dnsSrv.time(),this.dns_rights,
        main.dnsSrv.capset_of_dir(main.dnsdir)));
    main.dnsSrv.append_row(main.dnsSrv.rootdir,DnsCom.Dns_row('afs',main.dnsSrv.time(),this.dns_rights,
        main.dnsSrv.capset_of_dir(main.afsdir)));
    main.dnsSrv.release_dir(main.hostsdir);
    main.dnsSrv.release_dir(main.domainsdir);
    main.dnsSrv.release_dir(main.dnsdir);
    main.dnsSrv.release_dir(main.afsdir);

    main.geo=options.geo||{};

    this.thread = function (arg) {
        var thr = this,
            dying=false,
            rpcio2,
            rpcio; 
            
        this.init = function () {
            rpcio = router.pkt_get();
            if (main.options.verbose>0) main.out('Starting host server with public port ' +
                                                 Net.Print.port(main.options.pubhostport));
            router.add_port(main.options.privhostport);
        };

        this.request = function () {
            Io.log((log < 1) || ('[HOST'+arg+'] waiting for a request'));
            rpcio.init();
            rpcio.operation = Rpc.Operation.GETREQ;
            rpcio.header.h_port = main.options.privhostport;
            rpcio.header.h_status = undefined;
            rpcio.header.h_command = undefined;
            rpcio.header.h_priv = undefined;
            // Io.out(util.inspect(rpcio));
            rpc.getreq(rpcio);
            assert((rpcio.index != -1) || ('RPCIO invalid'));
        };

        this.service = function () {
            var mem, str, used, i, service, name, path, cs, rights, ncols, cols, colnames, 
                found, off, mask, priv, paramn, params, stat, serviced;

            Io.log((log < 1) || ('[HOST'+arg+'] service request'));
            assert(rpcio.index != -1, 'RPCIO invalid');
            Io.log((log < 1) || (Net.Print.header(rpcio.header)));

            rpcio.pos = 0;
            rpcio.header.h_status = Status.STD_OK;
            var obj = Net.prv_number(rpcio.header.h_priv);

            switch (rpcio.header.h_command) {
                /*
                 ** Standard Calls
                 */
                case Command.STD_INFO:
                    Io.log((log < 1) || 'hostsrv.STD_INFO ' + Net.Print.private(rpcio.header.h_priv));
                    Buf.buf_init(rpcio);
                    if (obj == 0) Buf.buf_put_string(rpcio, main.info);
                    else {
                        // It is a directory object.
                        main.dnsSrv.dns_info(rpcio.header.h_priv, function (_stat, _str) {
                            stat=_stat;
                            if (stat==Status.STD_OK) Buf.buf_put_string(rpcio, _str);
                            else rpcio.header.h_status=stat;
                        });
                    }
                    break;

                case Command.STD_AGE:
                    /*
                     ** Force memory garbage collection!
                     */
                    if (isNodeJS && global.gc != undefined) {
                        mem = process.memoryUsage();
                        var mem0 = mem;
                        var progress = 1000;
                        var count = 20;
                        while (count > 0 && progress >= 1000) {
                            global.gc();
                            mem = process.memoryUsage();
                            progress = mem0.rss - mem.rss;
                            if (progress < 0) progress = mem0.heapUsed - mem.heapUsed;
                            mem0 = mem;
                            count--;
                        }
                    }
                    else rpcio.header.h_status = Status.STD_SYSERR;
                    break;

                case Command.STD_STATUS:
                    Io.log((log < 1) || 'hostsrv.STD_STATUS ' + Net.Print.private(rpcio.header.h_priv));
                    Buf.buf_init(rpcio);
                    if (obj == 0) {

                      str = 'Statistics\n==========\n';
                      if (process != undefined) {
                          mem = process.memoryUsage();
                          str = str + 'MEMORY: RSS=' + Perv.div(mem.rss, 1024) + ' HEAP=' + Perv.div(mem.heapTotal, 1024) +
                          ' USED=' + Perv.div(mem.heapUsed, 1024) + ' kB\n';
                      }
                      str = str + router.status()+'\n';
                      Buf.buf_put_string(rpcio, str);
                    } else {
                        // It is a directory object.
                        main.dnsSrv.dns_stat(rpcio.header.h_priv, function (_stat, _str) {
                            stat=_stat;
                            if (stat==Status.STD_OK) Buf.buf_put_string(rpcio, _str);
                            else rpcio.header.h_status=stat;
                        });
                        
                    }
                    break;

                case Command.STD_LOCATION:
                    break;

                case Command.STD_RESTRICT:
                    /*
                     *  ----------
                     *  mask (int16)
                     *  ----------
                     *  priv (privat)
                     *  ----------
                     */
                    Io.log((log < 1) || 'hostsrv.STD_RESTRICT ' + Net.Print.private(rpcio.header.h_priv));
                    mask=Buf.buf_get_int16(rpcio);
                    Buf.buf_init(rpcio);
                    priv=Net.restrict(rpcio.header.h_priv,mask,main.random);
                    if (priv!=undefined) {
                        Buf.buf_put_priv(rpcio,priv);
                        rpcio.header.h_status=Status.STD_OK;
                    } else rpcio.header.h_status=Status.STD_SYSERR;
                    break;

                case Command.STD_SETPARAMS:
                    Io.log((log < 1) || 'hostsrv.STD_SETPARAMS ' + Net.Print.private(rpcio.header.h_priv));
                    paramn=Buf.buf_get_int16(rpcio);
                    params = [];
                    stat=Status.STD_OK;
                    if (paramn > 0 && paramn < 256) {
                        for (i = 0; i < paramn; i++) {
                            var pn = Buf.buf_get_string(rpcio);
                            var pv = Buf.buf_get_string(rpcio);
                            params.push([pn,pv]);
                        }
                    } else stat=Status.STD_ARGBAD;
                    Array.iter (params,function (param) {
                        String.match(param[0], [
                            ['monitor',function () {
                                router.monitor=Perv.int_of_string(param[1]);
                            }]
                        ])
                    });
                    Buf.buf_init(rpcio);
                    rpcio.header.h_status=stat;
                    break;

            /*********************
             ** DNS Calls
             **********************/
                case Command.DNS_APPEND:
                    /*
                     *  ------------
                     *  name:string
                     *  obj:capset
                     *  ncols:number
                     *  ------------
                     *  ------------
                     */
                    Io.log((log < 1) || 'hostsrv.DNS_APPEND ' + Net.Print.private(rpcio.header.h_priv));
                    name = Buf.buf_get_string(rpcio);
                    cs = Cs.buf_get_capset(rpcio);
                    ncols = Buf.buf_get_int16(rpcio);
                    cols = [];
                    for (i = 0; i < ncols; i++) {
                        cols.push(Dns.buf_get_rights(rpcio));
                    }
                    if (log > 1) {
                        Io.inspect(name);
                        Io.inspect(cs);
                        Io.inspect(cols);
                    }
                    Sch.ScheduleBlock([
                        function () {
                            main.dnsSrv.dns_append(rpcio.header.h_priv, name, cols, cs, function (_stat) {
                                rpcio.header.h_status = _stat;
                                Buf.buf_init(rpcio);
                                Io.log((log < 1) || ('hostsrv.DNS_APPEND returns: ' + Net.Status.print(_stat)));
                            });
                        }]);
                    Io.log((log < 1) || ('hostsrv.DNS_APPEND passes through'));
                    break;


                case Command.DNS_LOOKUP:
                    Io.log((log < 1) || 'hostsrv.DNS_LOOKUP ' + Net.Print.private(rpcio.header.h_priv));
                    path = Buf.buf_get_string(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            main.dnsSrv.dns_lookup(rpcio.header.h_priv, path, function (_stat, _cs, _path) {
                                Io.log((log < 1) || ('hostsrv.DNS_LOOKUP returns: ' + Net.Status.print(_stat)+', '+_path));
                                Buf.buf_init(rpcio);
                                if (_stat == Status.STD_OK) {
                                    /*
                                     ** Put the path_rest string and the capability set.
                                     */
                                    Buf.buf_put_string(rpcio, _path);
                                    Cs.buf_put_capset(rpcio, _cs);

                                } else {
                                    rpcio.header.h_status = _stat;
                                }
                            });
                        }]);
                    Io.log((log < 1) || ('hostsrv.DNS_LOOKUP passes through'));
                    break;

                case Command.DNS_RENAME:
                    /*
                     *  ------------
                     *  oldname:string
                     *  newname:string
                     *  ------------
                     *  ------------
                     */
                    Io.log((log < 1) || 'hostsrv.DNS_RENAME ' + Net.Print.private(rpcio.header.h_priv));
                    name = Buf.buf_get_string(rpcio);
                    var newname = Buf.buf_get_string(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            main.dnsSrv.dns_rename(rpcio.header.h_priv, name, newname, function (_stat) {
                                Buf.buf_init(rpcio);
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.DNS_DELETE:
                    /*
                     *  ------------
                     *  rowname:string
                     *  ------------
                     *  ------------
                     */
                    Io.log((log < 1) || ('hostsrv.DNS_DELETE ' + Net.Print.private(rpcio.header.h_priv)));
                    name = Buf.buf_get_string(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            main.dnsSrv.dns_delete(rpcio.header.h_priv, name, function (_stat) {
                                Buf.buf_init(rpcio);
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.DNS_CREATE:
                    /*
                     *  -----
                     *  ncols(int16)
                     *  [colname(string)] #ncols
                     *  -----
                     *  cs(capset)
                     *  -----
                     */
                    Io.log((log < 1) || 'hostsrv.DNS_CREATE ' + Net.Print.private(rpcio.header.h_priv));
                    ncols = Buf.buf_get_int16(rpcio);
                    colnames = [];
                    for (i = 0; i < ncols; i++) {
                        colnames.push(Buf.buf_get_string(rpcio));
                    }
                    Sch.ScheduleBlock([
                        function () {
                            main.dnsSrv.dns_create(rpcio.header.h_priv, colnames, function (_stat, _cs) {
                                Buf.buf_init(rpcio);
                                rpcio.header.h_status = _stat;
                                if (_stat == Status.STD_OK) {
                                    Cs.buf_put_capset(rpcio, _cs);
                                }
                            });
                        }]);
                    break;

                case Command.DNS_LIST:
                    /*
                     *  --------------
                     *  rowoff(int16)
                     * ---------------
                     *  next_row(int16)
                     *  ncols(int16)
                     *  nrows(int16)
                     *  colnames: [name(string)]   #ncols
                     *  rows: [
                     *    name(string)
                     *    time(int32)
                     *    [rights(int16)] #ncols
                     *  ] #nrows
                     *  --------------
                     */
                    Io.log((log < 1) || 'hostsrv.DNS_LIST ' + Net.Print.private(rpcio.header.h_priv));
                    off = Buf.buf_get_int16(rpcio);
                    rpcio.pos = 0;
                    Sch.ScheduleBlock([
                        function () {
                            main.dnsSrv.dns_list(rpcio.header.h_priv, off, 1000,
                                function (_stat, nrows, ncols, colnames, rows) {
                                    rpcio.header.h_status = _stat;
                                    Buf.buf_init(rpcio);
                                    if (_stat == Status.STD_OK) {
                                        Buf.buf_put_int16(rpcio, Dns.DNS_NOMOREROWS);
                                        Buf.buf_put_int16(rpcio, ncols);
                                        Buf.buf_put_int16(rpcio, nrows);
                                        /*
                                         ** Push the column names
                                         */
                                        Array.iter(colnames, function (col) {
                                            Buf.buf_put_string(rpcio, col);
                                        });
                                        /*
                                         ** Assumption: all rows fit in one transaction
                                         */
                                        Array.iter(rows, function (row, index) {
                                            Buf.buf_put_string(rpcio, row[0]);
                                            Buf.buf_put_int32(rpcio, row[1]);
                                            Array.iter(row[2], function (col, index) {
                                                Dns.buf_put_rights(rpcio, col);
                                            });
                                        });
                                    }
                                });
                        }]);
                    break;

                case Command.DNS_SETLOOKUP:
                    /*
                     *  ------------
                     *  nrows(int16)
                     *  [
                     *    dir(capset)
                     *    name(string)
                     *  ] #nrows
                     *  ------------
                     *  [
                     *    status(int16)
                     *    cs(capset)
                     *  ] #nrows
                     *  ------------
                     */
                    Io.log((log < 1) || 'hostsrv.DNS_SETLOOKUP ' + Net.Print.private(rpcio.header.h_priv));
                    var nrows = Buf.buf_get_int16(rpcio);
                    var dirs=[];
                    for(i=0;i<nrows;i++) {
                        cs=Cs.buf_get_capset(rpcio);
                        name=Buf.buf_get_string(rpcio);
                        dirs.push([cs,name]);
                    }
                    Sch.ScheduleBlock([
                        function () {
                            main.dnsSrv.dns_setlookup(rpcio.header.h_priv, dirs, function (_stat, _rows) {
                                rpcio.header.h_status = _stat;
                                Buf.buf_init(rpcio);
                                Array.iter(_rows, function (statcs) {
                                    Buf.buf_put_int16(statcs[0]);
                                    Cs.buf_put_capset(statcs[1]);
                                });
                            })
                        }
                    ]);
                    break;

                case Command.DNS_GETROOT:
                    /*
                     *  -------------
                     *  -------------
                     *  cap(capability)
                     *  -------------
                     */

                    Io.log((log < 1) || ('hostsrv.DNS_GETROOT: ' + Cs.Print.capset(main.dnsSrv.rootcs)));
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            /*
                             ** Return a read-only restricted capability set.
                             */
                            main.dnsSrv.restrict(main.dnsSrv.rootcs, Rights.DNS_RGT_OTHERS + Rights.DNS_RGT_READ,
                                function (_stat, _cs) {
                                    if (_stat == Status.STD_OK) {
                                        Buf.buf_put_cap(rpcio, main.CsInt.cs_to_cap(_cs));
                                    }
                                    rpcio.header.h_status = _stat;
                                });
                        }
                    ]);
                    break;
                    
                default:
                    rpcio.header.h_status=Status.STD_COMBAD;
                    loop: for(i in main.services) {
                      service=main.services[i];
                      if (service.call(main,rpcio)) break loop;
                    }
            }
        };

        this.reply = function () {
            Io.log((log < 1) || ('[HOST'+arg+'] service reply '+Rpc.Print.rpcio(rpcio)));
            assert((rpcio.index != -1) || ('RPCIO invalid'));
            Io.log((log < 1) || ('[HOST'+arg+'] reply ' + Net.Print.header(rpcio.header)));
            rpc.putrep(rpcio);
        };

        this.terminate = function () {
            Io.log((log < 1) || ('[HOST] terminating'));
        };


        this.transitions = function () {
            var trans;
            trans =
                [
                    [undefined, this.init, function (thr) {
                        return true
                    }],
                    [this.init, this.request, function (thr) {
                        return true
                    }],
                    [this.request, this.service, function (thr) {
                        return true
                    }],
                    [this.service, this.reply, function (thr) {
                        return true
                    }],
                    [this.reply, this.request, function (thr) {
                        return !dying
                    }],
                    [this.reply, this.terminate, function (thr) {
                        return dying
                    }]
                ];
            return trans;
        };
        this.context = Sch.TaskContext('HOSTSRV '+main.name+' #'+arg, thr);
    };
};

/** Append a new row to the given directory. 
 *  Note: Access of the embedded DNS is non-blocking!
 *
 * @param {string} path
 * @param {capset|capability} obj
 * @param {function (stat)} cb
 */
hostserver.prototype.append = function (path,obj,cb) {   
    var main=this,
        rowcs,
        cs,
        stat = Status.STD_NOTFOUND,
        dirname = Comp.filename.dirname(path),
        rowname = Comp.filename.basename(path);
    if (obj.cap_port) rowcs=main.CsInt.cs_singleton(obj);
    else if (obj.cs_suite) rowcs=obj;
    else main.err('append: Invalid object (expected capability or cap. set)');
    //console.log(dirname+','+rowname)
    String.match(dirname,[
        [['/dns','dns'],function () {
            // Internal DNS
            if (main.dnsSrv.search_row(main.dnsdir,rowname) != undefined) {
                stat= Status.STD_EXISTS;
            } else {
                main.dnsSrv.append_row(main.dnsdir, DnsCom.Dns_row(rowname, main.dnsSrv.time(), main.dns_rights, rowcs));
                stat = Status.STD_OK;
            }
            if (cb) cb(stat);
        }],
        [['/afs','afs'],function () {
            // Internal DNS
            if (main.dnsSrv.search_row(main.afsdir,rowname) != undefined) {
                stat = Status.STD_EXISTS;
            } else {
                main.dnsSrv.append_row(main.afsdir, DnsCom.Dns_row(rowname, main.dnsSrv.time(), main.afs_rights, rowcs));
                stat =  Status.STD_OK;
            }
            if (cb) cb(stat);
        }],
        ['/',function () {    
            // Internal DNS
            if (main.dnsSrv.search_row(main.rootdir,rowname) != undefined) {
                stat = Status.STD_EXISTS;
            } else {
                main.dnsSrv.append_row(main.rootdir, DnsCom.Dns_row(rowname, main.dnsSrv.time(), main.dns_rights, rowcs));
                stat =  Status.STD_OK;
            }
            if (cb) cb(stat);
        }],
        function () {    
          // External DNS
          // main.dns.dns_append(main.rootcs,path,cb);
          Sch.ScheduleBlock([
            function () {
              main.dns.dns_lookup(main.rootcs, dirname, function (_stat,_cs) {
                stat=_stat;
                cs=_cs;
              });
            },
            function () {
              if (stat==Status.STD_OK) {
                main.dns.dns_append(cs,rowname,rowcs, Dns.DNS_DEFAULT_RIGHTS, function (_stat) {
                  stat=_stat;
                });                
              } 
            },
            function () {
              if (cb) cb(stat);
            }
          ]);
        }
    ]);
};

hostserver.prototype.delete = function (path,cb) {
    var main=this;
    var stat = Status.STD_NOTFOUND;
    var dirname = Comp.filename.dirname(path);
    var rowname = Comp.filename.basename(path);
     String.match(dirname,[
        [['/dns','dns'],function () {
            // Internal DNS
            if (main.dnsSrv.search_row(main.dnsdir,rowname) == undefined) {
                stat= Status.STD_NOTFOUND;
            } else {
                main.dnsSrv.delete_row(main.dnsdir, rowname);
                stat = Status.STD_OK;
            }
            cb(stat);
        }],
        [['/afs','afs'],function () {
            // Internal DNS
            if (main.dnsSrv.search_row(main.afsdir,rowname) == undefined) {
                stat= Status.STD_NOTFOUND;
            } else {
                main.dnsSrv.delete_row(main.afsdir, rowname);
                stat =  Status.STD_OK;
            }
            cb(stat);
        }],
        ['/',function () {    
            // Internal DNS
            if (main.dnsSrv.search_row(main.rootdir,rowname) == undefined) {
                stat= Status.STD_NOTFOUND;
            } else {
                main.dnsSrv.delete_row(main.rootdir, rowname);
                stat =  Status.STD_OK;
            }
            cb(stat);
        }],
        function () {    
          // External DNS
          // main.dns.dns_append(main.rootcs,path,cb);
          Sch.ScheduleBlock([
            function () {
              main.dns.dns_lookup(main.rootcs, dirname, function (_stat,_cs) {
                stat=_stat;
                cs=_cs;
              });
            },
            function () {
              if (stat==Status.STD_OK) {
                main.dns.dns_delete(cs,rowname, function (_stat) {
                  stat=_stat;
                });                
              } 
            },
            function () {
              cb(stat);
            }
          ]);
        }
    ]);
}

/** Lookup a row in the given directory. 
 *
 * @param {string} path
 * @param {function (stat,cs)} cb
 */

hostserver.prototype.lookup = function (path,cb) {
  this.dns.dns_lookup(this.rootcs,path,cb);    
}

hostserver.prototype.mkdir = function (path,cb) {

}

/** Extend the service function and register a new command service handler.
 *
 * @param {function(rpcio):boolean} fun
 * 
 */
hostserver.prototype.register = function (fun) {
  this.services.push(fun);
};

hostserver.prototype.get_geo = function (geo) {
  return this.geo;
}

hostserver.prototype.set_geo = function (geo) {
  this.geo=geo;
}


module.exports = {
    /**
     *
     * @param {taskscheduler} scheduler
     * @param {rpcint} rpc
     * @param {{pubhostport,privhostport,verbose}} options
     * @param {string} [name]
     * @param {{}} env
     * @returns {hostserver}
     */
    HostServer: function(scheduler,rpc,options,name,env) {
        var srv = new hostserver(rpc,options,name,env);
        for(var i=0;i<4;i++) {
            var proc = new srv.thread(i);
            scheduler.Add(proc.context);
        }
        return srv;
    }
};

