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
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     31-3-15 by sbosse.
 **    $VERSION:     1.1.8
 **
 **    $INFO:
 **
 **  DOS: DNS Client Interface
 **
 **    $ENDOFINFO
 */
"use strict";
var log = 0;

var util = Require('util');
var Io = Require('com/io');
var Net = Require('dos/network');
var Std = Require('dos/std');
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Cs = Require('dos/capset');
var Comp = Require('com/compat');
var String = Comp.string;
var Filename = Comp.filename;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Rand = Comp.random;
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;


/*
** Use the default DNS server
*/
var DNS_DEFAULT      = undefined;
var DNS_MAXPATH      = 255;
var DNS_DEFAULT_COLS = ['owner','group','others'];
var DNS_DEFAULT_RIGHTS = [
    Rights.DNS_RGT_OWNER|Rights.DNS_RGT_GROUP|Rights.DNS_RGT_OTHERS|
    Rights.DNS_RGT_READ|Rights.DNS_RGT_MODIFY|Rights.DNS_RGT_DELETE|Rights.DNS_RGT_CREATE,
    Rights.DNS_RGT_GROUP|Rights.DNS_RGT_OTHERS|
    Rights.DNS_RGT_READ,
    Rights.DNS_RGT_OTHERS|
    Rights.DNS_RGT_READ
];
var DNS_NTRY         = 3;
var DNS_NOMOREROWS   = -1;
var DNS_MAXCOLUMNS   = Net.DNS_MAXCOLUMNS;

/** {@link dir_entry~obj}
 * Directory Entry Class - one row
 *
 * @param {string} de_name
 * @param {string} de_time
 * @param {number []} de_columns
 * @constructor
 * @typedef {{de_name,de_time,de_columns}} dir_entry~obj
 */
var dir_entry = function (de_name,de_time,de_columns) {
    this.de_name      = de_name;      // string;
    this.de_time      = de_time;      // number;
    this.de_columns   = de_columns;   // rights_bits array;
};

/** {@link dir~obj}
** Directory Class - One directory
 *
 *
 * @param {capset} [di_capset]
 * @param {number} [di_ncols]
 * @param {number} [di_nrows]
 * @param {string []} [di_colnames]
 * @param {dir_entry []} [di_rows]
 * @param {number} [di_curpos]
 * @constructor
 * @typedef {{di_capset,di_ncols,di_nrows,di_colnames,di_rows,di_curpos}} dir~obj
 */
var dir = function (di_capset,di_ncols,di_nrows,di_colnames,di_rows,di_curpos) {
    this.di_capset   = di_capset;       // capset
    this.di_ncols    = di_ncols||0;     // int
    this.di_nrows    = di_nrows||0;     // int
    this.di_colnames = di_colnames||[]; // string array
    this.di_rows     = di_rows||[];     // dns_dir_entry array
    this.di_curpos   = di_curpos||0;    // int
};

/** Directory Entry Object
 *
 * @param de_name
 * @param de_time
 * @param de_columns
 * @returns {dir_entry}
 * @constructor
 */
function Dir_entry (de_name,de_time,de_columns) {
    var obj = new dir_entry(de_name,de_time,de_columns);
    Object.preventExtensions(obj);
    return obj;
}
/**
 ** One directory
 *
 *
 * @param {capset} [di_capset]
 * @param {number} [di_ncols]
 * @param {number} [di_nrows]
 * @param {string []} [di_colnames]
 * @param {dir_entry []} [di_rows]
 * @param {number} [di_curpos]
 * @returns {dir}
 */
function Dir (di_capset,di_ncols,di_nrows,di_colnames,di_rows,di_curpos) {
    var obj = new dir(di_capset,di_ncols,di_nrows,di_colnames,di_rows,di_curpos);
    Object.preventExtensions(obj);
    return obj;
}


/*
** BUFFER operations
 */
function buf_put_rights (buf,rights) {
    Buf.buf_put_int32(buf,rights);
}

function buf_get_rights (buf) {
    var rights=0;
    rights=Buf.buf_get_int32(buf);
    return rights;
}


/*
** ==========
** DNS CLIENT
 * ==========
*/
/** {@link dns~obj}
 *  DNS Client Programming Interface
 * @param {rpcint} rpc
 * @constructor
 */
var dnsint = function(rpc,env) {
    this.rpc=rpc;
    this.std=Std.StdInt(rpc);
    this.cs=Cs.CsInt(rpc);
    this.env=env||{};
    if (!this.env.rootdir) this.env.rootdir=Cs.nilcapset;
    if (!this.env.rootdir) this.env.workdir=Cs.nilcapset;
};

/**
 *
 * @returns {[]}
 */
dnsint.prototype.default_colmask = function () {
    var nmasks = Net.DNS_MAXCOLUMNS;
    var def_mask = Io.getenv('DNSMASK','');
    var mask_array=[];
    if (String.equal(def_mask,'')) {
        mask_array=Array.create(nmasks,0xff)
    } else {
        var def_mask_list = def_mask.split(':');
        var def_mask_len = def_mask_list.length;
        if (def_mask_len > nmasks) Io.err('default_colmask: invalid dns mask from environment');
        for (var i=0;i<def_mask_len;i++) {
            mask_array.push(Perv.int_of_string(def_mask_list[i]));
        }
    }
    return mask_array;
};

/**
 *
 * @returns {capset|undefined}
 */
dnsint.prototype.get_workdir = function () {
    return this.env.workdir;
};

/**
 *
 * @returns {capset|undefined}
 */
dnsint.prototype.get_rootdir = function () {
    return this.env.rootdir;
};

/**
 *
 * @param cap
 */
dnsint.prototype.set_workdir = function (cap) {
    this.env.workdir=this.cs.cs_singleton(cap);
};

/**
 *
 * @param cap
 */
dnsint.prototype.set_rootdir = function (cap) {
    this.env.rootdir=this.cs.cs_singleton(cap);
};

/**
 ** Perform a request to the DNS server. This function tries
 ** to find out a valid capability from the capability set 'cs'.
 *
 *
 * @param ntries
 * @param {rpcio} rpcio
 * @param {capset} cs
 */
dnsint.prototype.mktrans = function (ntries,rpcio,cs) {
    var cs=cs,
        buf,
        self=this,
        err = Status.STD_UNKNOWN,
        failed = Status.STD_UNKNOWN,
        tries = 1,
        i=0,
        s;

    if (ntries>1) {
        buf=Buf.Buffer(); // we must save the rpcio data, it may be overridden by a previous transaction!
        Buf.buf_copy(buf,rpcio);
    }
    Io.log((log<1)||('Dns.mktrans max('+ntries+') '+Cs.Print.capset(cs)));
    Sch.ScheduleLoop(function () {
        return (tries <= ntries && err != Net.Status.STD_OK);
    },[
        function () {
            s = cs.cs_suite[i];
            i++;
            if (i==cs.cs_final) {
                i=0; tries++;
            }
            if (s.s_current == true) {
                rpcio.header.h_port = s.s_object.cap_port;
                Net.Copy.private(s.s_object.cap_priv,rpcio.header.h_priv);
                if (ntries>1) Buf.buf_copy(rpcio,buf);

                Io.log((log<1)||('Dns.mktrans ('+(tries-1)+') '+Rpc.Print.rpcio(rpcio)));
                Sch.ScheduleBlock([
                    /*
                     ** Do the real transaction
                     */
                    [Sch.Bind(self.rpc, self.rpc.trans), rpcio],
                    [function () {
                        Io.log((log<10)||('mktrans returned ' + Rpc.Print.rpcio(rpcio)));
                        err = rpcio.status||rpcio.header.h_status;
                        if (err==Status.RPC_FAILURE && ntries > 1) {
                            /*
                             ** Retry idempotent operation, but return RPC_FAILURE
                             ** in case we don't succeed in a following iteration.
                             */
                            failed=Status.RPC_FAILURE;
                        }
                    }]
                ]);
            }
        }
    ],[
        function () {if (failed!=Status.STD_UNKNOWN) rpcio.status=failed;}
    ], function(e) {
        if (typeof e == 'number') rpcio.status=e; else {
            Io.printstack(e,'Dns.mktrans');
            rpcio.status=Status.STD_SYSERR;
        }
    })
};

/**
 ** lookup  returns  the capability-set stored under the name
 ** 'path' relative to the directory 'root'.  The root directory
 ** can be any directory in the directory tree. The path rest
 ** that can not be eresolved will be returned, too.
 *
 *
 * @param {capset} rootcs
 * @param {string} path
 * @param {function(status:(Status.STD_OK|*),cs:(capset|undefined),string)} callback
 */
dnsint.prototype.dns_lookup = function (rootcs,path,callback) {
    var self=this,
        err,cs,res,
        rpcio,depth,pos,path_len,cs_parent,finished,max_steps;
    Io.log((log<1)||('Dns.dns_lookup ('+path+') root='+(rootcs?Cs.Print.capset(rootcs):'[]')));
    try {
        if (String.equal(path, '/')) {
          rootcs=rootcs||this.get_rootdir();
          if (rootcs) callback(Status.STD_OK, rootcs, '');
          else throw Status.STD_NOTNOW;
        } else {
            path = Filename.path_normalize(path);
            if (path.length==0) throw Status.STD_ARGBAD;
            max_steps=10;
            if (rootcs==DNS_DEFAULT) {
                if (String.get(path,0)=='/') cs=self.get_rootdir();
                else cs=self.get_workdir();
                if (cs==undefined) res=[Status.STD_STD_NOTNOW];
                else res=[Status.STD_OK,cs];
            } else res=[Status.STD_OK,self.cs.cs_copy(rootcs)];
            err=res[0];
            cs=res[1];
            if (err != Status.STD_OK) throw (err==undefined?Status.STD_SYSERR:err);
            /*
             ** Loop over the path components step by step and resolve the path.
             ** Each run, the next path component is the new parent directory
             ** for the next lookup.
             */
            rpcio=self.rpc.router.pkt_get();
            depth= 1;
            pos;
            path_len=path.length;
            cs_parent=cs;
            finished=false;
            if (path_len>0 && String.get(path,0)=='/') {
                // remove a leading slash from path
                path=String.trim(path,1,0);
            }
            Sch.ScheduleLoop(function () {
                return (finished==false && err==Status.STD_OK);
            },[
                function () {
                    if (depth>max_steps) {finished=true; cs=undefined; err=Status.STD_OVERFLOW;}
                    path_len=path.length;
                    if (String.equal(path,'.') || path_len==0) {
                        finished=true;
                        cs=cs_parent;
                    }
                },
                function () {
                    if (!finished && err==Status.STD_OK) {
                        rpcio.header.h_command=Command.DNS_LOOKUP;
                        rpcio.header.h_status=Status.STD_UNKNOWN;
                        rpcio.pos=0;
                        Buf.buf_put_string(rpcio,path);
                        /*
                         *  ------------
                         *  name(string)
                         *  ------------
                         *  path(string)
                         *  cs(capset)
                         *  ------------
                         */
                        self.mktrans(DNS_NTRY,rpcio,cs_parent);
                    }
                },
                function () {
                    if (!finished && err==Status.STD_OK) {
                        err=rpcio.status||rpcio.header.h_status;
                        if (err==Status.STD_OK) {
                            // Get path
                            rpcio.pos=0;
                            path=Buf.buf_get_string(rpcio);
                            // Get capset
                            cs=Cs.buf_get_capset(rpcio);
                            cs_parent=cs;
                            // Remove a leading slash from path
                            if (path.length>0 && path[0]=='/') path=String.trim(path,1,0);
                            depth++;
                        } else {
                            finished=true;
                            cs=undefined;
                        }
                    }
                }
            ],[
                // Finalize block
                function () {
                    callback(err,cs,path);
                    self.rpc.router.pkt_discard(rpcio);
                }
            ],  // Exception handler function
                function(e) {
                    if (typeof e == 'number') callback(e, undefined, '');
                    else {
                        Io.printstack(e,'Dns.dns_lookup');
                        callback(Status.STD_SYSERR, undefined, '');
                    }
                    self.rpc.router.pkt_discard(rpcio);
                }
            );
        }
    } catch (e) {
        if (typeof e == 'number') callback(e, undefined, ''); else {
            Io.printstack(e,'Dns.dns_lookup');
            callback(Status.STD_SYSERR, undefined, '');
        }
    }
};

/**
 ** Lookup a set of directory capabilities specified by a (directory capability set - row name) list.
 ** The (status, row capset) tuple list is returned.
 *
 * @param {capset} server root directory
 * @param {* []} dirs (dir:capset * rowname:string) []
 * @param {function((Status.STD_OK|*),* [])} callback (Status*capset) []
 */
dnsint.prototype.dns_setlookup = function (server,dirs,callback) {
    var rpcio=self.rpc.router.pkt_get();
    var ndirs = dirs.length;
    var stat;
    Sch.ScheduleBlock([
        function () {
            /*
             *  ------------
             *  nrows(int16)
             *  [
             *    dir(capset)
             *    rowname(string)
             *  ] #nrows
             *  ------------
             *  [
             *    status(int16)
             *    cs(capset)
             *  ] #nrows
             *  ------------
             */
            rpcio.header.h_command=Command.DNS_SETLOOKUP;
            rpcio.header.h_status=Status.STD_UNKNOWN;
            rpcio.pos=0;
            Buf.buf_put_int16(dirs.length);
            Array.iter (dirs,function(dir) {
                Cs.buf_put_capset(rpcio,dir[0]);    // directory capability set
                Buf.buf_put_string(rpcio,dir[1]);   // row name
            });
            self.mktrans(DNS_NTRY,rpcio,server);
        },
        function(){
            var i;
            var res;
            if (rpcio.status==Status.STD_OK) stat=rpcio.header.h_status;
            if (stat != Status.STD_OK) throw(stat);
            rpcio.pos=0;
            for(i=0;i<ndirs;i++) {
                var statn=Buf.buf_get_int16(rpcio);
                var cs=Cs.buf_get_capset(rpcio);
                res.push([stat,cs]);
            }
            callback(stat,res);
            self.rpc.router.pkt_discard(rpcio);
        }
    ],function(e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e, []); else {
            Io.printstack(e,'Dns.dns_setlookup');
            callback(Status.STD_SYSERR,[]);
        }
    });
};

/**
 ** dns_list: return the row list of the directory specified by
 **          'dir'
 *
 *
 * @param {capset} dircs
 * @param {function((Status.STD_OK|*),dir|undefined)} callback
 */
dnsint.prototype.dns_list = function (dircs,callback) {
    var self=this,
        stat=Status.STD_OK,
        dir=Dir(dircs),
        next_row=0,
        ncols=0,
        nrows=0,
        rowoff=0,
        rpcio=this.rpc.router.pkt_get();

    function addtodir(firstrow,numrows,buf) {
        var i,j;

        for (i = firstrow; i < numrows; i++) {
            var name = Buf.buf_get_string(buf);
            var time = Buf.buf_get_int32(buf);
            var rbits = [];
            for (j = 0; j < dir.di_ncols; j++) {
                rbits[j] = buf_get_rights(buf);
            }
            dir.di_rows.push(Dir_entry(name, time, rbits));
        }
    }
    Io.log((log<1)||('Dns.dns_list dircs='+Cs.Print.capset(dircs)));
    Sch.ScheduleLoop(
        function (index) {
            return (stat==Status.STD_OK && next_row != DNS_NOMOREROWS);
        },[
            function () {
                rpcio.header.h_command = Command.DNS_LIST;
                rpcio.header.h_status = Status.STD_UNKNOWN;
                rpcio.pos = 0;
                Buf.buf_put_int16(rpcio,rowoff);
                /*
                 *  --------------
                 *  rowoff(int16)
                 * ---------------
                 *  next_row(int16)
                 *  ncols(int16)
                 *  nrows(int16)
                 *  cols: [name(string)]   #ncols
                 *  rows: [
                 *    name(string)
                 *    time(int32)
                 *    [rights(int16)] #ncols
                 *  ] #nrows
                 *  --------------
                 */
                self.mktrans(DNS_NTRY, rpcio, dircs);
            },
            function () {
                var i,rowoff,nrowschunk,numrows;
                rpcio.pos=0;

                if (rpcio.status==Status.STD_OK) stat=rpcio.header.h_status;
                else stat=rpcio.status;
                if (stat==Status.STD_OK) {
                    if (next_row==0) {
                        /*
                        ** Initial request...
                         */
                        next_row = Buf.buf_get_int16(rpcio);
                        ncols = Buf.buf_get_int16(rpcio);
                        nrows = Buf.buf_get_int16(rpcio);
                        dir.di_ncols=ncols;
                        dir.di_nrows=nrows;
                        for (i=0;i<ncols;i++) {
                            dir.di_colnames.push(Buf.buf_get_string(rpcio));
                        }
                        if (nrows>0) {
                            if (next_row != DNS_NOMOREROWS) numrows = next_row;
                            else numrows=nrows;
                            addtodir(0,numrows,rpcio);
                        }
                     } else {
                        /*
                        ** following requests
                        */
                        next_row = Buf.buf_get_int16(rpcio);
                        ncols = Buf.buf_get_int16(rpcio);
                        nrowschunk = Buf.buf_get_int16(rpcio);
                        for (i=0;i<ncols;i++) {
                            Buf.buf_get_string(rpcio);
                        }
                        /*
                         ** append the current chunk of rows to dirs
                         */
                        if (next_row > 0) numrows = next_row-rowoff;
                        else numrows=nrowschunk-rowoff;
                        addtodir(rowoff,numrows,rpcio);
                    }
                }
            }
         ],[
            function () {
                callback(stat,dir);
                self.rpc.router.pkt_discard(rpcio);
            }
        ],
        function (e) {
            self.rpc.router.pkt_discard(rpcio);
            if (typeof e == 'number') callback(e, undefined); else {
                Io.printstack(e,'Dns.dns_list');
                callback(Status.STD_SYSERR,undefined);
            }
        }
    );
};

/**
 ** Append new 'obj' capability to directory specified with capset 'dir'
 ** with row 'name' and the new column rights 'cols'. 'name' may not
 ** a path! Use dns_lookup to resolve directory capability instead!
 *
 *
 * @param {capset} dir
 * @param {string} name
 * @param {capset} obj
 * @param {number []} cols
 * @param {function(stat:(Status.STD_OK|*))} callback
 */
dnsint.prototype.dns_append = function (dir,name,obj,cols,callback) {
    var self=this;
    var ncols=cols.length;
    var rpcio=self.rpc.router.pkt_get();
    var stat=Status.STD_UNKNOWN;
    Sch.ScheduleBlock([
        function() {
            rpcio.header.h_command=Command.DNS_APPEND;
            rpcio.header.h_status=Status.STD_UNKNOWN;
            rpcio.pos=0;
            /*
            *  -----
            *  name:string
            *  obj:capset
            *  ncols:number
            *  -----
            *  -----
             */
            Buf.buf_put_string(rpcio,name);
            Cs.buf_put_capset(rpcio,obj);
            Buf.buf_put_int16(rpcio,ncols);
            for (var n = 0; n < ncols; n++) {
                buf_put_rights(rpcio, cols[n]);
            }
            self.mktrans(1,rpcio,dir);
        },
        function() {
            if (rpcio.stat && rpcio.stat != Status.STD_OK) stat=rpcio.stat;
            else stat=rpcio.header.h_status;
            callback(stat);
            self.rpc.router.pkt_discard(rpcio);
        }
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns.dns_append');
            callback(Status.STD_SYSERR);
        }
    });
};

/**
 *
 * @param {capset} dir
 * @param {string} oldname
 * @param {string} newname
 * @param {function((Status.STD_OK|*))} callback
 */
dnsint.prototype.dns_rename = function (dir,oldname,newname,callback) {
    var self=this;
    var stat;
    var rpcio=self.rpc.router.pkt_get();
    Sch.ScheduleBlock([
        function() {
            rpcio.header.h_command=Command.DNS_RENAME;
            rpcio.header.h_status=Status.STD_UNKNOWN;
            rpcio.pos=0;
            /*
             *  -----
             *  oldname:string
             *  newname:string
             *  -----
             *  -----
             */
            Buf.buf_put_string(rpcio,oldname);
            Buf.buf_put_string(rpcio,newname);
            self.mktrans(DNS_NTRY,rpcio,dir);
        },
        function() {
            if (rpcio.stat && rpcio.stat != Status.STD_OK) stat=rpcio.stat;
            else stat=rpcio.header.h_status;
            callback(stat);
            self.rpc.router.pkt_discard(rpcio);
        }
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns.dns_rename');
            callback(Status.STD_SYSERR);
        }
    });

};

/**
 ** dns_delete deletes the directory entry (which may itself be a
 ** directory capability)  specified  by  'name' in directory
 ** specified with capset 'dir'.
 *
 * @param {capset} dir
 * @param {string} name
 * @param {function((Status.STD_OK|*))} callback
 */
dnsint.prototype.dns_delete = function (dir,name,callback) {
    var self=this;
    var stat;
    var rpcio=self.rpc.router.pkt_get();
    Sch.ScheduleBlock([
        function() {
            rpcio.header.h_command=Command.DNS_DELETE;
            rpcio.header.h_status=Status.STD_UNKNOWN;
            rpcio.pos=0;
            /*
             *  -----
             *  rowname:string
             *  -----
             *  -----
             */
            Buf.buf_put_string(rpcio,name);
            self.mktrans(1,rpcio,dir);
        },
        function() {
            if (rpcio.stat && rpcio.stat != Status.STD_OK) stat=rpcio.stat;
            else stat=rpcio.header.h_status;
            callback(stat);
            self.rpc.router.pkt_discard(rpcio);
        }
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns.dns_delete');
            callback(Status.STD_SYSERR);
        }
    });

};
/**
 *
 * @param {capset} rootdir
 * @param {number []} colnames
 * @param {function((Status.STD_OK|*),capset|undefined)} callback
 */
dnsint.prototype.dns_create = function (rootdir,colnames,callback) {
    var cs=undefined;
    var self=this;
    var stat;
    var ncols=colnames.length;
    var rpcio=self.rpc.router.pkt_get();
    Sch.ScheduleBlock([
        function() {
            rpcio.header.h_command=Command.DNS_CREATE;
            rpcio.header.h_status=Status.STD_UNKNOWN;
            rpcio.pos=0;
            /*
             *  -----
             *  ncols(int16)
             *  [colname(string)] #ncols
             *  -----
             *  cs(capset)
             *  -----
             */
            Buf.buf_put_int16(rpcio,ncols);
            for(var i=0;i<ncols;i++) {
                Buf.buf_put_string(rpcio,colnames[i]);
            }
            self.mktrans(1,rpcio,rootdir);
        },
        function() {
            rpcio.pos=0;
            if (rpcio.stat && rpcio.stat != Status.STD_OK) stat=rpcio.stat;
            else stat=rpcio.header.h_status;
            if (stat==Status.STD_OK) {
                var cs=Cs.buf_get_capset(rpcio);
                callback(stat,cs);
            } else
                callback(stat,undefined);
            self.rpc.router.pkt_discard(rpcio);
        }
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Dns.dns_create');
            callback(Status.STD_SYSERR,undefined);
        }
    });
};

/**
 ** dns_destroy deletes the entire directory
 ** specified with capset 'dir'.
 *
 * @param {capset} dir
 * @param {string} name
 * @param {function((Status.STD_OK|*))} callback
 */
dnsint.prototype.dns_destroy = function (dir,name,callback) {
    var self=this;
    var stat;
    var rpcio=self.rpc.router.pkt_get();
    Sch.ScheduleBlock([
        function() {
            rpcio.header.h_command=Command.STD_DESTROY;
            rpcio.header.h_status=Status.STD_UNKNOWN;
            rpcio.pos=0;
            /*
             *  -----
             *  -----
             *  -----
             */
            self.mktrans(1,rpcio,dir);
        },
        function() {
            if (rpcio.stat && rpcio.stat != Status.STD_OK) stat=rpcio.stat;
            else stat=rpcio.header.h_status;
            callback(stat);
            self.rpc.router.pkt_discard(rpcio);
        }
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns.dns_destroy');
            callback(Status.STD_SYSERR);
        }
    });

};

/** Try to get the server root capability set (e.g., from host server),
 *  Only the host server port is required without any authorization fields.
 *  Therefore, the request can be rejected by a server.
 *
 * @param {port} server
 * @param {function((Status.STD_OK|*),capability|undefined)} callback
 */
dnsint.prototype.dns_getrootcap = function (server,callback) {
    var cs=undefined;
    var self=this;
    var stat;
    var rpcio=self.rpc.router.pkt_get();
    Sch.ScheduleBlock([
        function() {
            rpcio.header.h_port=server;
            rpcio.header.h_priv=Net.Private();
            rpcio.header.h_command=Command.DNS_GETROOT;
            rpcio.header.h_status=Status.STD_UNKNOWN;
            rpcio.pos=0;
            /*
             *  -----
             *  -----
             *  cap(capability)
             *  -----
             */
            /*
             ** Do the real transaction
             */
            self.rpc.trans(rpcio);
        },
        function() {
            rpcio.pos=0;
            if (rpcio.stat && rpcio.stat != Status.STD_OK) stat=rpcio.stat;
            else stat=rpcio.header.h_status;
            if (stat==Status.STD_OK) {
                var cap=Buf.buf_get_cap(rpcio);
                callback(stat,cap);
            } else
                callback(stat,undefined);
            self.rpc.router.pkt_discard(rpcio);
        }
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Dns.dns_getrootcap');
            callback(Status.STD_SYSERR,undefined);
        }
    });
};

/** Try to get the default AFS server capability set (e.g., from DNS server),
 *
 * @param {capset} rootdir
 * @param {function((Status.STD_OK|*),capability|undefined)} callback
 */
dnsint.prototype.dns_getdefafs = function (rootdir,callback) {
    var cs=undefined;
    var self=this;
    var stat;
    var rpcio=self.rpc.router.pkt_get();
    Sch.ScheduleBlock([
        function() {
            rpcio.header.h_command=Command.DNS_GETDEFAFS;
            rpcio.header.h_status=Status.STD_UNKNOWN;
            rpcio.pos=0;
            /*
             *  -----
             *  -----
             *  cap(capability)
             *  -----
             */
            self.mktrans(1,rpcio,rootdir);
        },
        function() {
            rpcio.pos=0;
            if (rpcio.stat && rpcio.stat != Status.STD_OK) stat=rpcio.stat;
            else stat=rpcio.header.h_status;
            if (stat==Status.STD_OK) {
                var cap=Buf.buf_get_cap(rpcio);
                callback(stat,cap);
            } else
                callback(stat,undefined);
            self.rpc.router.pkt_discard(rpcio);
        }
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Dns.dns_getdefafs');
            callback(Status.STD_SYSERR,undefined);
        }
    });
};

/** DNS Client Interface
 *
 *
 */
module.exports = {
    DNS_MAXPATH:DNS_MAXPATH,
    DNS_DEFAULT_COLS:DNS_DEFAULT_COLS,
    DNS_DEFAULT_RIGHTS:DNS_DEFAULT_RIGHTS,
    DNS_MAXCOLUMNS:DNS_MAXCOLUMNS,
    DNS_NOMOREROWS:DNS_NOMOREROWS,
    buf_put_rights:buf_put_rights,
    buf_get_rights:buf_get_rights,
    RIGHTS_SIZE:4,
    Dir_entry:Dir_entry,
    Dir:Dir,
    /**
     *
     * @param {rpcint} rpc
     * @returns {dnsint}
     */
    DnsInt: function(rpc,env) {
        var obj = new dnsint(rpc,env);
        Object.preventExtensions(obj);
        return obj;
    }
};
