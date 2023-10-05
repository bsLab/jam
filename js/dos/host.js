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
 **    $CREATED:      5/25/15 by sbosse.
 **    $VERSION:     1.2.6
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
var util = require('util');
var Io = Require('com/io');
var trace = Io.tracing;


var Net = Require('dos/network');
var Rpc = Require('dos/rpc');
var Router = Require('dos/router');
var Compat = Require('com/compat');
var Perv = Compat.pervasives;
var String = Compat.string;
var Array = Compat.array;
var assert = Compat.assert;
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var DnsCom = Require('dos/dns_srv_common');
var DnsEMB = Require('dos/dns_srv_emb');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;

var isNodeJS = Compat.isNodeJS();



/** Create a HOST server with embedded DNS
 *
 * @param {rpcint} rpc
 * @param {port} pubport
 * @param {port} privport
 * @param {string} [name]
 * @param {object} [env]
 * @constructor
 * @typedef {{CsInt:csint,random:port,dns:dns_server,hostcap:capability,hostsdir:dns_dir,
 *            domains:dns_dir,dnsdir:dns_dir,thread}} hostserver~obj
 * @see hostserver~obj
 */
var hostserver = function (rpc,pubport,privport,name,env) {
    var self = this;
    this.env=env||{};
    var router = rpc.router;
    this.CsInt = Cs.CsInt(rpc);
    this.name=name||('HOST Server '+(router.brokerserver == undefined ? ' (Broker) ' : '')+Net.Print.port(pubport));
    /*
    ** Simple DNS (only one root directory) table
     */
    this.random=Net.uniqport();
    this.dns = DnsEMB.Server(rpc);
    this.dns.create_dns(pubport,privport,this.random,false,Dns.DNS_DEFAULT_COLS);
    Io.out('[HOST] My host port is '+Net.Print.port(router.hostport));
    Io.out('[HOST] My host name is '+this.name);
    Io.out('[HOST] DNS Root is '+Net.Print.capability(this.CsInt.cs_to_cap(this.dns.rootcs)));
    this.hostcap = Net.Capability(pubport,Net.Private(0,Rights.PRV_ALL_RIGHTS,this.random));
    
    if (env) env.rootdir=this.dns.rootcs;
    
    // Server
    var main = this;

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
    main.hostsdir=main.dns.create_dir(Dns.DNS_DEFAULT_COLS);
    main.domainsdir=main.dns.create_dir(Dns.DNS_DEFAULT_COLS);
    main.dnsdir=main.dns.create_dir(Dns.DNS_DEFAULT_COLS);
    main.afsdir=main.dns.create_dir(Dns.DNS_DEFAULT_COLS);

    main.dns.append_row(main.hostsdir,
                        DnsCom.Dns_row(main.name,main.dns.time(),this.host_rights,
                                       main.CsInt.cs_singleton(main.hostcap)));

    main.dns.append_row(main.dns.rootdir,DnsCom.Dns_row('hosts',main.dns.time(),this.dns_rights,
                                                        main.dns.capset_of_dir(main.hostsdir)));
    main.dns.append_row(main.dns.rootdir,DnsCom.Dns_row('domains',main.dns.time(),this.dns_rights,
                                                        main.dns.capset_of_dir(main.domainsdir)));
    main.dns.append_row(main.dns.rootdir,DnsCom.Dns_row('dns',main.dns.time(),this.dns_rights,
        main.dns.capset_of_dir(main.dnsdir)));
    main.dns.append_row(main.dns.rootdir,DnsCom.Dns_row('afs',main.dns.time(),this.dns_rights,
        main.dns.capset_of_dir(main.afsdir)));
    main.dns.release_dir(main.hostsdir);
    main.dns.release_dir(main.domainsdir);
    main.dns.release_dir(main.dnsdir);
    main.dns.release_dir(main.afsdir);

    self.geo={};

    this.thread = function (arg) {
        var thr = this;
        var dying=false;

        var rpcio = router.pkt_get();

        this.init = function () {
            Io.out('[HOST'+arg+'] Starting host server with public port ' + Net.Print.port(pubport));
            router.add_port(privport);
        };

        this.request = function () {
            Io.log((log < 1) || ('[HOST'+arg+'] waiting for a request'));
            rpcio.init();
            rpcio.operation = Rpc.Operation.GETREQ;
            rpcio.header.h_port = privport;
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
                    if (obj == 0) Buf.buf_put_string(rpcio, self.name);
                    else {
                        // It is a directory object. TODO
                        str = '/';
                        main.dns.dns_info(rpcio.header.h_priv, function (_stat, _str) {
                            Buf.buf_put_string(rpcio, _str);
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
                    Buf.buf_init(rpcio);
                    str = 'Statistics\n==========\n';
                    if (process != undefined) {
                        mem = process.memoryUsage();
                        str = str + 'MEMORY: RSS=' + Perv.div(mem.rss, 1024) + ' HEAP=' + Perv.div(mem.heapTotal, 1024) +
                        ' USED=' + Perv.div(mem.heapUsed, 1024) + ' kB\n';
                    }
                    str = str + router.status()+'\n';
                    Buf.buf_put_string(rpcio, str);
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
                            main.dns.dns_append(rpcio.header.h_priv, name, cols, cs, function (_stat) {
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
                            main.dns.dns_lookup(rpcio.header.h_priv, path, function (_stat, _cs, _path) {
                                Io.log((log < 1) || ('hostsrv.DNS_LOOKUP returns: ' + Net.Status.print(_stat)));
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
                            main.dns.dns_rename(rpcio.header.h_priv, name, newname, function (_stat) {
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
                            main.dns.dns_delete(rpcio.header.h_priv, name, function (_stat) {
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
                            main.dns.dns_create(rpcio.header.h_priv, colnames, function (_stat, _cs) {
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
                            main.dns.dns_list(rpcio.header.h_priv, off, 1000,
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
                            main.dns.dns_setlookup(rpcio.header.h_priv, dirs, function (_stat, _rows) {
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

                    Io.log((log < 1) || ('hostsrv.DNS_GETROOT: ' + Cs.Print.capset(main.dns.rootcs)));
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            /*
                             ** Return a read-only restricted capability set.
                             */
                            main.dns.restrict(main.dns.rootcs, Rights.DNS_RGT_OTHERS + Rights.DNS_RGT_READ,
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
                    loop: for(i in self.services) {
                      service=self.services[i];
                      if (service(rpcio)) break loop;
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
        this.context = Sch.TaskContext(main.name+' #'+arg, thr);
    };
};

/**
 *
 * @param {string} dirname
 * @param {string} rowname
 * @param {capset} rowcs
 */
hostserver.prototype.append = function (dirname,rowname,rowcs) {
    var main=this;
    var stat = Status.STD_NOTFOUND;
    String.match(dirname,[
        ['dns',function () {
            if (main.dns.search_row(main.dnsdir,rowname) != undefined) {
                stat= Status.STD_EXISTS;
            } else {
                main.dns.append_row(main.dnsdir, DnsCom.Dns_row(rowname, main.dns.time(), main.dns_rights, rowcs));
                stat = Status.STD_OK;
            }
        }],
        ['afs',function () {
            if (main.dns.search_row(main.afsdir,rowname) != undefined) {
                stat = Status.STD_EXISTS;
            } else {
                main.dns.append_row(main.afsdir, DnsCom.Dns_row(rowname, main.dns.time(), main.afs_rights, rowcs));
                stat =  Status.STD_OK;
            }
        }]
    ]);
    return stat;
};
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
     * @param {port} pubport
     * @param {port} privport
     * @param {string} [name]
     * @param {{}} env
     * @returns {hostserver}
     */
    HostServer: function(scheduler,rpc,pubport,privport,name,env) {
        var srv = new hostserver(rpc,pubport,privport,name,env);
        for(var i=0;i<4;i++) {
            var proc = new srv.thread(i);
            scheduler.Add(proc.context);
        }
        return srv;
    }
};

