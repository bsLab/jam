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
 **    $CREATED:     2-6-15 by sbosse.
 **    $VERSION:     1.3.1
 **
 **    $INFO:
 **
 **  DOS: DNS Server, Embedded version
 *
 * Simplified embeddable DNS server without external persistent storage, used,
 * for example, by the host server publishing servers. The DNS service can be
 * restricted to handle only one root directory (restricted root mode).
 **
 **    $ENDOFINFO
 */
"use strict";

var log=0;

var util = Require('util');
var Io = Require('com/io');
var trace = Io.tracing;

var Net = Require('dos/network');
var Std = Require('dos/std');
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Dns = Require('dos/dns_srv_common');
var Cs = Require('dos/capset');
var Comp = Require('com/compat');
var Cache = Require('dos/cache');
var Filename = Comp.filename;
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var assert = Comp.assert;
var div = Perv.div;
var Rand = Comp.random;
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;
var Printf = Comp.printf;


/**
 * DNS Embedded Server Class
 * @param {rpcint} rpc
 * @constructor
 * @typedef {{rpc,std,cs,pubport,privport,random,rootmode,rootcs:capset,rootdir:dns_dir,ncols,cols,dirs,dirs_free,dirs_top,stats}} dns_server_emb~obj
 * @see dns_server_emb~obj
 * @see dns_server_emb~meth
 */
var dns_server_emb = function (rpc) {
    this.rpc=rpc;
    /** @type {std} std */
    this.std=Std.StdInt(rpc);
    this.cs=Cs.CsInt(rpc);
    this.pubport=undefined;
    this.privport=undefined;
    this.random=undefined;
    // one root directory only?
    this.rootmode=false;
    // root capability set
    this.rootcs=undefined;
    // root directory object
    this.rootdir=undefined;
    this.ncols=0;
    this.cols=[];
    this.lock=Sch.Lock();

    /** Capability cache to speed-up row
     *  capability restriction using a column mask.
     *  Key: cap-key+mask
     *  Value: Restricted cap
     *
     */
    this.cache_cap = Cache.Cache(100);

    /*
    ** Directory partition: associative array
     */
    this.dirs=[];
    this.dirs_free=[];
    this.dirs_top=0;
    this.stats = {
        op_read:0,
        op_modify:0,
        op_create:0,
        op_destroy:0
    }
};

/** Initialite and start up services
 *
 */

dns_server_emb.prototype.init = function () {
  var self=this;
  Sch.AddTimer(1000,'DNS Server Garbage Collector',function () {
    self.cache_cap.refresh(function (key,data) {
      if (data.tmo) { data.tmo--; return data.tmo>0}
      else return true;      
    });
  });
}

dns_server_emb.prototype.lock = function () {
    this.lock.acquire();
};

dns_server_emb.prototype.try_lock = function () {
    return this.lock.try_acquire();
};
dns_server_emb.prototype.unlock = function () {
    return this.lock.release();
};

/**
 * @typedef {{
 * create_dns:dns_server.create_dns,
 * lookup_dir:dns_server.lookup_dir,
 * check_dir:dns_server.check_dir,
 * create_dir:dns_server.create_dir,
 * acquire_dir:dns_server.acquire_dir,
 * release_dir:dns_server.release_dir,
 * request_dir:dns_server.request_dir,
 * restrict:dns_server.restrict,
 * capset_of_dir:dns_server.capset_of_dir,
 * dir_of_capset:dns_server.dir_of_capset,
 * search_row:dns_server.search_row,
 * append_row:dns_server.append_row,
 * rename_row:dns_server.rename_row,
 * time:dns_server.time,
 * }} dns_server_emb~meth
 */

/**
 *
 * @param {port} pubport
 * @param {port} privport
 * @param {port} random
 * @param {boolean} rootmode
 * @param {string []} cols
 */
dns_server_emb.prototype.create_dns = function (pubport,privport,random,rootmode,cols) {
    this.pubport=pubport;
    this.privport=privport;
    this.random=random;
    this.ncols=cols.length;
    this.cols=cols;
    this.rootmode=rootmode;
    this.dirs=[];
    this.dirs_free=[];
    this.dirs_top=1;    // The next not allocated entry
    /*
    ** Create the root directory (object number 1)
     */
    this.rootdir=this.create_dir(cols);
    this.rootdir.dd_random=random;
    this.rootcs=this.capset_of_dir(this.rootdir,Rights.PRV_ALL_RIGHTS);
    this.release_dir(this.rootdir);
};



/** Lookup a directory object (priv.prv_obj) and check the required rights.
 *  The directory is returned unlocked!
 *
 * @param {privat} priv
 * @param {number} req
 * @returns {dns_dir|undefined}
 */
dns_server_emb.prototype.lookup_dir = function(priv,req) {
    var self = this;
    var obj = Net.prv_number(priv);

    if (obj < 1 || obj >= this.dirs_top) return undefined;
    var dir = self.dirs[obj];
    var rights = Net.prv_rights(priv);
    /*
     ** When checking the presence of column rights, only take the
     ** *actual*
     ** columns present into account (i.e., do not use DNS_COLMASK here)
     */
    var colmask = Dns.dns_col_bits[dir.dd_ncols] - 1;

    Io.log((log<1)||('Dns_server.lookup_dir: '+Net.Print.private(priv))+' req='+req+' colmask='+colmask+' rights='+rights);

    if (!Net.prv_decode(priv, dir.dd_random)) {
        return undefined;
    }
    if ((rights & colmask) == 0 ||
        (rights & req) != req) {
        return undefined;
    }
    return dir;
};

/**
 ** With a given directory capability set check if this directory belongs
 ** to this server.
 *
 *
 * @param {capset} dir
 * @returns {private|undefined}
 */
dns_server_emb.prototype.check_dir = function(dir) {
    var self=this;
    Io.log((log<1)||('Dns_server.check_dir: '+Cs.Print.capset(dir)));
    if (dir==undefined) return undefined;
    for (var i = 0; i<dir.cs_final;i++) {
        var s = dir.cs_suite[i];
        if (s.s_current == true) {
            var cap = s.s_object;
            if (Net.Equal.port(cap.cap_port, self.pubport) == true &&
                Net.prv_number(cap.cap_priv) != 0) {
                /*
                 ** A capability for me. Check it.
                 */
                return cap.cap_priv;
            }
        }
    }
    Io.log((log<1)||'Dns_server.check_dir: not for me');
    return undefined;
};

/**
 ** Create a new directory. Return the directory structure and
 ** the status returned by the server create function. The super structure
 ** is already modified by this function. The new directory remains
 ** locked.
 *
 *
 * @param {string []} colnames
 * @returns {dns_dir|undefined}
 */
dns_server_emb.prototype.create_dir = function(colnames) {
    var ncols=colnames.length;
    /**
     *
     * @type {dns_dir|undefined}
     */
    var dir=undefined;
    if (!Array.empty(this.dirs_free)) {
        /*
        ** There is an already unused existing directory, claim it.
         */
        var next = Array.pop(this.dirs_free);
        dir=this.dirs[next];
        assert((dir!=undefined && dir.dd_objnum==next)||'Dns_server.create_dir: invalid directory found');
        dir.init(colnames,Dns.Dns_dir_state.DD_unlocked,this.time(),Dns.DNS_MAX_LIVE);
        dir.lock();  // non-blocking, we are the first one accessing the directory
    } else {
        dir=Dns.Dns_dir(this.dirs_top,ncols,0,colnames,Net.uniqport(),
                                 [],Dns.Dns_dir_state.DD_unlocked,this.time(),Dns.DNS_MAX_LIVE);
        this.dirs[this.dirs_top]=dir;
        this.dirs_top++;
        dir.lock();  // non-blocking, we are the first one accessing the directory
    }
    return dir;
};

/** Create a new directory. Return the directory structure and
 ** the status returned by the server create function. The super structure
 ** is already modified by this function. The new directory remains
 ** locked.
 *
 * @param colnames
 * @param {function ((Status.STD_OK|*),(dns_dir|undefined))} callback
 */
dns_server_emb.prototype.alloc_dir = function (colnames,callback) {
    var self=this;
    assert(self.try_lock());
    var dir = self.create_dir(colnames);
    self.unlock();
    if (dir!=undefined) callback(Status.STD_OK,dir);
    else callback(Status.STD_NOSPACE,undefined);
};

/** Acquire and lock a directory with object number 'obj'. A
 ** release_dir call must follow this operation. [BLOCKING]
 *
 * @param {number} obj
 * @param {function((Status.STD_OK|*),dns_dir|undefined)} callback
 */

dns_server_emb.prototype.acquire_dir = function(obj,callback) {
    if (obj < 1 || obj >= this.dirs_top) callback(Status.STD_OBJBAD,undefined);
    else {
        var dir = this.dirs[obj];
        if (dir == undefined) callback(Status.STD_NOTFOUND,undefined); else
        Sch.ScheduleBlock([
            function () {dir.lock();},
            function () {callback(Status.STD_OK,dir)}
        ]);
    }
};



/** Release an acquired directory
 * @param {dns_dir} dir
 * @param callback
 */
dns_server_emb.prototype.release_dir = function(dir,callback) {
    if (dir.dd_state == Dns.Dns_dir_state.DD_unlocked ||
        dir.dd_state == Dns.Dns_dir_state.DD_modified) {
        // Nothing to do here!
        dir.dd_state=Dns.Dns_dir_state.DD_locked;
    }
    dir.unlock();
    if (callback!=undefined) callback(Status.STD_OK);
};

/** Release an unmodified directory [NON BLOCKING].
 *
 * @param dir
 */
dns_server_emb.prototype.release_unmodified_dir = function(dir) {
    this.release_dir(dir);
};

/**
 ** A client request arrived.  Enter the critical section.  Check the capability.
 ** If correct, check whether the required rights are present or not.
 ** Return the directory structure, but only if the required rights are present.
 *
 * @param {private} priv
 * @param req
 * @param {function((Status.STD_OK|*),dns_dir|undefined)} callback
 */
dns_server_emb.prototype.request_dir = function(priv,req,callback) {
    var self=this;
    var obj = Net.prv_number(priv);
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;

    Sch.ScheduleBlock([
        function () {
            Io.log((log<1)||('Dns_server.request_dir: acquire_dir('+obj+')'));
            self.acquire_dir(obj,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat!=Status.STD_OK) throw stat;
            var rights = Net.prv_rights(priv);

            /*
             ** When checking the presence of column rights, only take the
             ** *actual*
             ** columns present into account (i.e., do not use DNS_COLMASK here)
             */
            var colmask = Dns.dns_col_bits[dir.dd_ncols]-1;

            Io.log((log<1)||('Dns_server.request_dir: '+Net.Print.private(priv))+' req='+req+' colmask='+colmask+' rights='+rights);

            if (!Net.prv_decode(priv,dir.dd_random)) {

                throw Status.STD_DENIED;
            }
            if ((rights & colmask) ==0 ||
                (rights & req) != req) {
                throw Status.STD_DENIED;
            }
            callback(Status.STD_OK,dir);
        }
    ],function (e) {
        if (dir!=undefined) self.release_unmodified_dir(dir);
        if (typeof e != 'number') {Io.printstack(e,'Dns_server.request_dir');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};


/** Restrict a directory capability set.
 *  The directoty structure from capability set 'dir' must be unlocked to avoid.
 *
 * @param {capset} cs
 * @param mask
 * @param {function((Status.STD_OK|*),capset|undefined)} callback
 */
dns_server_emb.prototype.restrict = function(cs,mask,callback) {
    var self=this,
        cs=Cs.Copy.capset(cs),
        stat=Status.STD_CAPBAD,
        index=0;
    Sch.ScheduleLoop(function() {
        return (stat!=Status.STD_OK && index<cs.cs_final);
    },[
        function () {
            var s = cs.cs_suite[index],
                cap,key,cache;
            index++;
            if (s.s_current == true) {
                cap = s.s_object;
                if (Net.Equal.port(cap.cap_port, self.pubport) == true &&
                    Net.prv_number(cap.cap_priv) != 0) {
                    /*
                     ** A capability for me. Restrict it.
                     */
                    var dir = self.lookup_dir(cap.cap_priv,0);  // dir is unlocked, no release!
                    cap.cap_priv=Net.prv_encode(cap.cap_priv.prv_obj,
                        cap.cap_priv.prv_rights & mask,
                        dir.dd_random);
                    stat=Status.STD_OK;
                } else {
                    Io.log((log<1)||('Dns_server.restrict: doing std_restrict for '+Net.Print.capability(cap)+' with mask='+mask));
                    // Try to use capability cache - but can be outdated
                    key=Net.key(cap);
                    cache=self.cache_cap.lookup(key);
                    if (cache && cache.restrict && cache.restrict[mask]) {
                      Net.Copy.private(cache.restrict[mask].cap_priv,cap.cap_priv);
                      stat=cache.stat;
                    } else self.std.std_restrict(cap,mask,function (_stat,_cap) {
                        Io.log((log<1)||('Dns_server.restrict: std_restrict returned: '+Status.print(_stat)));
                        stat=_stat;
                        if (stat==Status.STD_OK) {
                          if (cache && cache.restrict) {cache.stat=stat; cache.restrict[mask]=_cap; cache.tmo=10;} else
                            self.cache_cap.add(key,{restrict:self.cache_cap.map(mask,_cap),tmo:10,stat:stat});
                          Net.Copy.private(_cap.cap_priv,cap.cap_priv);
                        } else {
                          if (cache && cache.restrict) {
                            cache.stat=stat; 
                            cache.restrict[mask]=Net.nilcap, 
                            cache.cap=cap
                          } else 
                            self.cache_cap.add(key,{restrict:self.cache_cap.map(mask,Net.nilcap),
                                                    tmo:10,stat:stat,cap:cap});
                        }
                    });
                }
            }
        }
    ],[
        function () {
            callback(stat,cs);
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server.restrict');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

/** Convert a directory structure into a capability set with optional
 ** restricted rights.
 *
 * @param {dns_dir} dir
 * @param {number} [rights]
 * @returns {capset}
 */
dns_server_emb.prototype.capset_of_dir = function(dir,rights) {
    var cap = Net.Capability(
        this.pubport,
        Net.prv_encode(dir.dd_objnum, rights||Rights.PRV_ALL_RIGHTS, dir.dd_random)
    );

    return this.cs.cs_singleton(cap);
};

/** Get a directory from a capability set - non-blocking version.
 ** Fail if the directory is already locked. Internal use only.
 ** The directoty will not be locked (acquired)!
 *
 * @param {capset} cs
 * @return {dns_dir|undefined}
 */
dns_server_emb.prototype.dir_of_capset = function(cs) {
    var dir = undefined;
    var priv = this.check_dir(cs);
    if (priv == undefined) return undefined;
    var obj = Net.prv_number(priv);
    if (obj < 1 || obj >= this.dirs_top) return undefined;
    else {
        dir = this.dirs[obj];
        if (dir.dd_lock.is_locked()) return undefined;
        return dir;
    }
};


/** Search a row in the directory with give name.
 *
 * @param {dns_dir} dir
 * @param {string} name
 * @returns {dns_row|undefined}
 */
dns_server_emb.prototype.search_row = function(dir,name) {
    return Array.find(dir.dd_rows,function (row) {
        return String.equal(row.dr_name,name);
    })
};

/** Append a row to a directory.
 *
 * @param {dns_dir}  dir
 * @param {dns_row} row
 */
dns_server_emb.prototype.append_row = function(dir,row) {
    dir.dd_rows.push(row);
    dir.dd_nrows++;
    dir.dd_state=Dns.Dns_dir_state.DD_modified;
};

/** Rename a row. Return status.
 *
 * @param {dns_dir} dir
 * @param oldname
 * @param newname
 * @returns {(Status.STD_OK|*)}
 */
dns_server_emb.prototype.rename_row = function(dir,oldname,newname) {
    var row=Array.find(dir.dd_rows,function(row) {
        return (String.equal(row.dr_name,oldname));
    });
    if (row!=undefined) {
        /*
         ** Check that the new entry name doesn't exist already
         */
        var exist = Array.check(dir.dd_rows,function(row) {
                return (String.equal(row.dr_name,newname));
            });
        if (exist) return Status.STD_EXISTS;
        row.dr_name=newname;
        dir.dd_state=Dns.Dns_dir_state.DD_modified;
        return Status.STD_OK;
    } else return Status.STD_NOTFOUND;
};

/** Search a row in the directory with give name.
 *
 * @param {dns_dir} dir
 * @param {string} name
 */
dns_server_emb.prototype.delete_row = function(dir,name) {
    var found;
    dir.dd_rows =  Array.filter(dir.dd_rows,function (row) {
        var eq=String.equal(row.dr_name,name);
        if (eq) found=true;
        return !eq;
    });
    dir.dd_nrows=Array.length(dir.dd_rows);
    if (found) return Status.STD_OK;
    else return Status.STD_NOTFOUND;
};

dns_server_emb.prototype.stat = function () {
  var str='Statistics\n==========\n';
  str=str+Printf.sprintf2([['%20s','#DIRS'],':',['%8d',this.dirs.length],'  ',
                           ['%20s','#FREE'],':',['%8d',this.dirs_free.length]])+'\n';
  str=str+Printf.sprintf2([['%20s','READ'],':',['%8d',this.stats.op_read],'  ',
                           ['%20s','MODIFY'],':',['%8d',this.stats.op_modify]])+'\n';
  str=str+Printf.sprintf2([['%20s','CREATE'],':',['%8d',this.stats.op_create],'  ',
                           ['%20s','DESTROY'],':',['%8d',this.stats.op_destroy]])+'\n';
  return str;
}
/**
 ** Get the current system time in 10s units
 *
 * @returns {number}
 */
dns_server_emb.prototype.time =function () {
    var self=this;
    return div(Perv.time(),10);
};

/*
 ** ================
 ** PUBLIC INTERFACE
 ** ================
 */

var DnsRpc = Require('dos/dns_srv_rpc');
//dns_server.prototype=new DnsRpc.dns_server_rpc();
dns_server_emb.prototype.dns_lookup=DnsRpc.dns_server_rpc.prototype.dns_lookup;
dns_server_emb.prototype.dns_create=DnsRpc.dns_server_rpc.prototype.dns_create;
dns_server_emb.prototype.dns_append=DnsRpc.dns_server_rpc.prototype.dns_append;
dns_server_emb.prototype.dns_rename=DnsRpc.dns_server_rpc.prototype.dns_rename;
dns_server_emb.prototype.dns_delete=DnsRpc.dns_server_rpc.prototype.dns_delete;
dns_server_emb.prototype.dns_info=DnsRpc.dns_server_rpc.prototype.dns_info;
dns_server_emb.prototype.dns_stat=DnsRpc.dns_server_rpc.prototype.dns_stat;
dns_server_emb.prototype.dns_list=DnsRpc.dns_server_rpc.prototype.dns_list;
dns_server_emb.prototype.dns_setlookup=DnsRpc.dns_server_rpc.prototype.dns_setlookup;


module.exports = {
    /**
     *
     * @param {rpcint} rpc
     * @returns {dns_server_emb}
     */
    Server: function(rpc) {
        var obj = new dns_server_emb(rpc);
        Object.preventExtensions(obj);
        return obj;
    }
};
