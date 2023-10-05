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
 **    $INITIAL:     (C) 2015-2017 bLAB
 **    $CREATED:     23-4-15 by sbosse.
 **    $VERSION:     1.3.8
 **
 **    $INFO:
 **      DNS Server with local file system storage and row capability cache.
 *
 *     $ENDINFO
 */
"use strict";

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
var Array = Comp.array;
var Perv = Comp.pervasives;
var Printf = Comp.printf;
var div = Perv.div;
var assert = Comp.assert;
var Rand = Comp.random;
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;
var AfsInt = Require('dos/afs');
var Afs = Require('dos/afs_srv_common');
var Dns = Require('dos/dns_srv_common');
var DnsInt = Require('dos/dns');
var Fs = Require('fs');
var Fcache = Require('dos/fcache');
var Cache = Require('dos/cache');
var Afs_file_state = Afs.Afs_file_state;

var log = 0;
var CACHETMO = 30;    // seconds

/** DNS Dns_server
 *
 * @param {rpcint} rpc
 * @constructor
 * @typedef {{rpc,afs,std,cs,dns_super:dns_super,dns_part:string,dns_part_fd,cache_inode,cache_data,inode_cache_entry,
 *            rootdir:dns_dir,fs_default,
 *            block,to_block,of_block,
 *            live_set,live_get,live_read,live_write,
 *            read_inode,write_inode,sync_inode,
 *            inode_of_obj,cap_of_obj,update_inode,
 *            iocachebypass,sync_write_mode,
 *            stats}} dns_server~obj
 * @see dns_server~obj
 * @see dns_server~meth
 */
var dns_server = function (rpc,options) {
    this.verbose=options.verbose||0;
    this.rpc=rpc;
    this.afs=AfsInt.AfsInt(rpc);
    this.std=Std.StdInt(rpc);
    this.cs=Cs.CsInt(rpc);
    /**
     *
     * @type {dns_super|undefined}
     */
    this.dns_super=undefined;
    this.dns_part=''; // DNS inode partition file path
    this.dns_part_fd=undefined;

    /**
     *
     * @type {fsc_cache|undefined}
     */
    this.cache_inode = undefined;
    /**
     *
     * @type {cache|undefined}
     */
    this.cache_data = undefined;
    this.inode_cache_entry=undefined;


    /** Capability cache to speed-up row
     *  capability restriction using a column mask.
     *  Key: cap-key+mask
     *  Value: Restricted cap
     *
     */
    this.cache_cap = Cache.Cache(1000);
    
    
    this.rootdir=undefined;
    this.fs_default=0;

    this.block=function() {};
    this.to_block=function() {};
    this.of_block=function() {};

    /**
     *
     * @param {number} obj
     * @param {number} time
     * @param {number} flag
     */
    this.live_set=function (obj,time,flag) {};
    /**
     *
     * @param {number} obj
     * @returns {{time: number, flag: number}}
     */
    this.live_get=function (obj) {return {time:0,flag:0}};
    /**
     *
     * @returns {(Status.STD_OK|*)}
     */
    this.live_read=function () {return 0;};
    /**
     *
     * @returns {(Status.STD_OK|*)}
     */
    this.live_write=function () {return 0;};

    /**
     *
     * @param obj
     * @param addr
     * @param data
     * @param size
     * @returns {number}
     */
    this.read_inode=function(obj,addr,data,size) {return 0};
    /**
     *
     * @param obj
     * @param addr
     * @param data
     * @param size
     * @returns {number}
     */
    this.write_inode=function(obj,addr,data,size) {return 0};
    this.sync_inode=function() {};

    /**
     *
     * @param {number} obj
     * @returns {{stat:(Status.STD_OK|*),inode:(dns_inode|undefined)}}
     */
    this.inode_of_obj=function(obj){return {stat:0,inode:undefined}};
    /**
     *
     * @param {number} obj
     * @returns {{stat:(Status.STD_OK|*),cap:(capability|undefined),inode:(dns_inode|undefined)}}
     */
    this.cap_of_obj=function(obj){return {stat:0,cap:undefined,inode:undefined}};
    this.update_inode=function(){};

    this.iocache_bypass=false;
    this.sync_write_mode=false;

    this.stats = {
        op_read:0,
        op_modify:0,
        op_create:0,
        op_destroy:0,
        op_touch:0,
        op_age:0
    }
};

/** Initialite and start up services
 *
 */

dns_server.prototype.init = function () {
  var self=this;
  Sch.AddTimer(1000,'DNS Server Garbage Collector',function () {
    self.cache_cap.refresh(function (key,data) {
      if (data.tmo) { data.tmo--; return data.tmo>0}
      else return true;      
    });
  });
}

/** Get the current system time in 10s units
 *
 * @returns {number}
 */
dns_server.prototype.time =function () {
    var self=this;
    return div(Perv.time(),10);
};


/** Acquire and lock a directory [BLOCKING]
 *
 * @param {number} obj
 * @param {function((Status.STD_OK|*),(dns_dir|undefined))} callback
 */
dns_server.prototype.acquire_dir = function (obj,callback) {
    var self=this;
    var dir=undefined;
    var stat;
    Sch.ScheduleBlock([
        function () {self.dns_super.lock();},
        function () {
            var res;
            res=self.read_dir(obj,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            });
            if (stat==Status.STD_OK) {
                dir.lock();
            }
        },
        function () {
            self.dns_super.unlock();
            Io.log((log < 1) || ('Dns_srv.acquire_dir: done ' + obj));
            callback(stat,dir);
        }
    ],function (e) {
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Dns_server.acquire_dir');
            callback(Status.STD_SYSERR,undefined);
        }
    });
};

/** Release an acquired directory. Flush all pending writes - the
 ** super structure and the i-node table, and the directory itself
 ** if modified. Return the status of the operation. [BLOCKING]
 *
 *
 * @param {dns_dir} dir
 * @param {function(Status.STD_OK|*)} callback
 */
dns_server.prototype.release_dir = function (dir,callback) {
    var stat=Status.STD_OK;
    Io.log((log < 1) || ('dns_srv.release_dir: ' + util.inspect(dir)));
    if (dir != undefined) {
        if ((dir.dd_state == Dns.Dns_dir_state.DD_unlocked ||
             dir.dd_state == Dns.Dns_dir_state.DD_modified)) {
            this.modify_dir(dir, function (_stat) {
                callback(_stat);
            });
        }
        else {
            stat = Status.STD_OK;
            dir.unlock();
            if (callback) callback(stat);
        }
    } else {
        stat=Status.STD_ARGBAD;
        if (callback!=undefined) callback(stat);
    }
};
/** Release an acquired but unmodified directory. Flush all pending writes - the
 ** super structure and the i-node table.
 ** Return the status of the operation.
 *
 *
 * @param {dns_dir} dir
 * @returns {(Status.STD_OK|*)}
 *
 * @param dir
 */
dns_server.prototype.release_unmodified_dir = function (dir) {
    var stat=Status.STD_OK;
    Io.log((log < 1) || ('dns_srv.release_unmodified_dir: ' + util.inspect(dir)));
    if (dir != undefined) {
        if ((dir.dd_state == Dns.Dns_dir_state.DD_unlocked ||
            dir.dd_state == Dns.Dns_dir_state.DD_modified)) {
            Io.out('Dns_srv.release_unmodified_dir: Directory '+dir.dd_objnum+' was modified!');
            return Status.STD_SYSERR;
        }
        else {
            stat = Status.STD_OK;
            dir.unlock();
            return stat;
        }
    } else {
        return Status.STD_ARGBAD;
    }
};


/** Lookup a directory object (priv.prv_obj) and check the required rights.
 *  The directory is returned unlocked!
 *
 * @param {privat} priv
 * @param {number} req
 * @param {function((Status.STD_OK|*),(dns_dir|undefined))} callback
 */
dns_server.prototype.lookup_dir = function(priv,req,callback) {
    var self = this;
    var obj = Net.prv_number(priv);
    var stat;
    var dir;

    if (obj < 1 || obj >= this.dirs_top) {
        callback(Status.STD_ARGBAD,undefined);
    } else Sch.ScheduleBlock([
        function () {
            Io.log((log<1)||('Dns_server.lookup_dir: read_dir('+obj+')'));
            self.read_dir(obj,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat!=Status.STD_OK) throw stat;
            if (!Net.prv_decode(priv, dir.dd_random)) {
                throw Status.STD_DENIED;
            }
            /*
             ** When checking the presence of column rights, only take the
             ** *actual*
             ** columns present into acount (i.e., do not use dns_COLMASK here)
             */
            var ncols=dir.dd_ncols;
            var rights = Net.prv_rights(priv);
            var colbits = Dns.dns_col_bits[ncols];
            var colmask = colbits-1;

            Io.log((log<1)||('Dns_server.lookup_dir: '+Net.Print.private(priv))+' req='+req+' colmask='+colmask+' rights='+rights);

            if ((rights & colmask) == 0 ||
                (rights & req) != req) {
                throw Status.STD_DENIED;
            }
            callback(Status.STD_OK,dir);
        }
    ],function (e) {
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Dns_server.lookup_dir');
            callback(Status.STD_SYSERR,undefined);
        }
    });

};

/** A client request arrived.  Enter the critical section. Check the capability.
 ** If it is correct, check whether the required rights are present or not.
 ** Return the directory structure, but only if the required rights are present.
 *
 * @param priv
 * @param req
 * @param callback
 */
dns_server.prototype.request_dir = function(priv,req,callback) {
    var self = this;
    var obj = Net.prv_number(priv);
    var stat;
    var dir;

    if (obj < 1 || obj >= this.dirs_top) {
        callback(Status.STD_ARGBAD,undefined);
    } else Sch.ScheduleBlock([
        function () {
            Io.log((log<1)||('Dns_server.request_dir: acquire_dir('+obj+')'));
            self.acquire_dir(obj,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat!=Status.STD_OK) throw stat;
            if (!Net.prv_decode(priv, dir.dd_random)) {
                self.release_unmodified_dir(dir);
                throw Status.STD_DENIED;
            }
            /*
             ** When checking the presence of column rights, only take the
             ** *actual*
             ** columns present into acount (i.e., do not use dns_COLMASK here)
             */
            var ncols=dir.dd_ncols;
            var rights = Net.prv_rights(priv);
            var colbits = Dns.dns_col_bits[ncols];
            var colmask = colbits-1;

            Io.log((log<1)||('Dns_server.request_dir: '+Net.Print.private(priv))+' req='+req+' colmask='+colmask+' rights='+rights);

            if ((rights & colmask) == 0 ||
                (rights & req) != req) {
                self.release_unmodified_dir(dir);
                throw Status.STD_DENIED;
            }
            callback(Status.STD_OK,dir);
        }
    ],function (e) {
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Dns_server.request_dir');
            callback(Status.STD_SYSERR,undefined);
        }
    });
};

/**
 ** With a given directory capability set check if this directory belongs
 ** to this server.
 *
 *
 * @param {capset} dir
 * @returns {private|undefined}
 */
dns_server.prototype.check_dir = function(dir) {
    var self=this;
    Io.log((log<1)||('Dns_server.check_dir: '+Cs.Print.capset(dir)));
    if (dir==undefined) return undefined;
    for (var i = 0; i<dir.cs_final;i++) {
        var s = dir.cs_suite[i];
        if (s.s_current == true) {
            var cap = s.s_object;
            if (Net.Equal.port(cap.cap_port, self.dns_super.dns_putport) == true &&
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


/** Calculate the size of a directory structure.
 *
 * @param {dns_dir} dir
 * @returns {number}
 */
dns_server.prototype.dir_size = function (dir) {
    return dir.size();
};

/** Return a free objnum in the directory table (index).
 ** Note: protect this function with the server lock untill
 ** the directory creation is finished.
 *
 * @returns {number}
 */
dns_server.prototype.get_freeobjnum = function () {
    var self=this;
    var sup=this.dns_super;
    var obj=-1;
    Array.match(sup.dns_freeobjnums,
        function(hd,tl){
            sup.dns_freeobjnums=tl;
            obj=hd;
        },
        function () {
            obj=sup.dns_nextfree;
            if((obj+1)==sup.dns_ndirs) {
                Io.out('[DNS] Out of directory slots.');
                throw Status.STD_NOSPACE;
            }
            sup.dns_nextfree=obj+1;
        });
    return obj;
};

/** Convert a directory structure into a capset with maybe
 ** restricted rights.
 *
 * @param {dns_dir} dir
 * @returns {capset}
 */
dns_server.prototype.capset_of_dir = function(dir,rights) {
    var self=this;
    var sup=this.dns_super;
    var cs;
    var cap = Net.Capability(
        sup.dns_putport,
        Net.prv_encode(dir.dd_objnum,rights,dir.dd_random)
    );
    cs=this.cs.cs_singleton(cap);
    return cs;
};

/** Restrict a directory capability set.
 *  The directoty structure from capability set 'dir' must be unlocked to avoid.
 *
 * @param {capset} cs
 * @param mask
 * @param {function((Status.STD_OK|*),capset|undefined)} callback
 */
dns_server.prototype.restrict = function(cs,mask,callback) {
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
                
                if (Net.Equal.port(cap.cap_port, self.dns_super.dns_putport) == true &&
                    Net.prv_number(cap.cap_priv) != 0) {
                    /*
                     ** A capability for me. Restrict it.
                     */
                    self.lookup_dir(cap.cap_priv,0,function (_stat,_dir) {
                        if (_stat==Status.STD_OK) {
                            cap.cap_priv=Net.prv_encode(cap.cap_priv.prv_obj,
                                cap.cap_priv.prv_rights & mask,
                                _dir.dd_random);
                        }
                        stat=_stat;
                    });  // dir is unlocked, no release!
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
                          if (cache && cache.restrict) {
                            cache.stat=stat; 
                            cache.restrict[mask]=_cap;
                            cache.tmo=CACHETMO;
                          } else
                            self.cache_cap.add(key,{restrict:self.cache_cap.map(mask,_cap),
                                                    tmo:CACHETMO,stat:stat});
                          Net.Copy.private(_cap.cap_priv,cap.cap_priv);
                        } else {
                          if (cache && cache.restrict) {
                            cache.stat=stat; 
                            cache.restrict[mask]=Net.nilcap; 
                            cache.cap=cap
                          } else 
                            self.cache_cap.add(key,{restrict:self.cache_cap.map(mask,Net.nilcap),
                                                    tmo:CACHETMO,stat:stat,cap:cap});
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
/** Get defualt file server.
 *
 *
 *
 * @param {function((Status.STD_OK|*),(Dns_mode.DNSMODE_ONECOPY|*))} callback
 */
dns_server.prototype.get_def_fs = function (callback) {
    var self=this;
    var sup = this.dns_super;
    var fs = sup.dns_fs;
    var cap = undefined;
    var stat;
    var goods = 0;
    var goodcap = undefined;
    var mode;

    var index = 0;
    Sch.ScheduleLoop(
        function() {
            return index<2;
        }, [
            function () {
                cap = fs.fs_cap[index];
                if (cap != undefined) {
                    self.std.std_info(cap,function (_stat,_info) {
                        stat=_stat;
                    })
                } else stat=Status.STD_CAPBAD;
            },
            function () {
                if (cap!=undefined) {
                    if (stat == Status.STD_OK) {
                        fs.fs_state[index] = Dns.Fs_state.FS_up;
                        goods++;
                        if (goodcap==undefined) {
                            goodcap=cap;
                            fs.fs_default=index;
                        }
                    }
                    else
                        fs.fs_state[index] = Dns.Fs_state.FS_down;
                }
            }
        ],[
            function () {
                if (goodcap==undefined) stat=Status.STD_NOTFOUND;
                if (goods==1) mode = Dns.Dns_mode.DNSMODE_ONECOPY;
                if (goods==2) mode = Dns.Dns_mode.DNSMODE_TWOCOPY;
                callback(stat,mode);
            }
        ],
        function (e) {
            if (typeof e == 'number') callback(e,undefined); else {
                Io.printstack(e,'Dns_server.get_def_fs');
                callback(Status.STD_SYSERR,undefined);
            }

    })
};


/**
 ** The create, read, modify and utility functions needed
 ** for the Dns_server module.
 **
 ** Note:
 ** After a directory is locked, any modification of this
 ** directory leads to a new AFS file object and a new
 ** directory capability!
 ** In one copy mode, the old cap will be destroyed, after
 ** the new one is committed and the i-node mapping was
 ** updated.
 */


/** Read the directory content from an AFS file. [BLOCKING]
*
 */
dns_server.prototype.read_dir_file = function (inode,callback) {
    var self=this;
    var stat,dir;
    var fs_default = self.dns_super.dns_fs.fs_default;
    var buf = Buf.Buffer();

    Sch.ScheduleBlock([
        function () {
            assert((inode.i_size>0)||('Dns_srv.read_dir_file: inode.i_size is zero'));
            Io.log((log<1)||('Dns_server.read_dir_file cap='+Net.Print.capability(inode.i_caps[fs_default])+' '+util.inspect(inode)));
            self.afs.afs_read(inode.i_caps[fs_default],buf,0,inode.i_size, function (_stat) {
                stat=_stat;
                if (stat==Status.STD_OK) dir=Dns.buf_get_dir(buf); else dir=undefined;
            })
        },
        function () {
            callback(stat,dir);
        }
    ],function (e) {
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Dns_server.read_dir_file');
            callback(Status.STD_SYSERR,undefined);
        }
    });

};

/** Read a directory specified with his object number (index) number.
 * Either the directory is currently cached, or the directory is read from an AFS file.
 *
 * @param {number} obj
 * @param {function((Status.STD_OK|*), dns_dir)} callback
 */
dns_server.prototype.read_dir = function (obj,callback) {
    var self=this;
    var stat,dir,inode;
    this.stats.op_read++;
    var si=this.inode_of_obj(obj);
    stat=si.stat;inode=si.inode;
    Io.log((log<1)||('Dns_server.read_dir obj='+obj));
    if (stat!=Status.STD_OK) callback(stat,undefined);
    else Sch.ScheduleBlock([
        function () {
            dir=self.cache_data.lookup(inode.i_objnum);
            if(dir==undefined) stat=Status.STD_NOTFOUND; else stat=Status.STD_OK;
        },
        function () {
            if (stat==Status.STD_NOTFOUND) self.read_dir_file(inode,function (_stat,_dir) {
              stat = _stat;
              dir = _dir;
            })
        },
        function () {
            if (stat==Status.STD_OK) {
                var tf=self.live_get(dir.dd_objnum);
                dir.dd_live=tf.time;
            }
            callback(stat,dir);
        }
    ],function (e) {
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Dns_server.read_dir');
            callback(Status.STD_SYSERR,undefined);
        }
    });

};

/**
 * Write an existing directory (only if modified).
 *
 * @param {dns_dir} dir
 * @param {function(Status.STD_OK|*)} callback
 */
dns_server.prototype.modify_dir = function (dir,callback) {
    var i;
    var stat;
    var self = this;
    var oldcaps;
    var cap = undefined;
    var obj = dir.dd_objnum;
    var inode,inode2,dirsize;
    var fs = this.dns_super.dns_fs;
    var fs_default=fs.fs_default;
    var buf = Buf.Buffer();
    var si=this.inode_of_obj(obj);
    stat=si.stat;inode=si.inode;
    Io.log((log<1)||('Dns_server.modify_dir dir='+util.inspect(dir)));
    this.stats.op_modify++;
    /*
     ** Distinguish these two cases:
     **  dd_state = DD_modified -> a new AFS object must be created
     **  dd_state = DD_unlocked -> commit the AFS object
     */
    if (stat!=Status.STD_OK) callback(stat);
    else
    {
        if (dir.dd_state==Dns.Dns_dir_state.DD_modified)
            Sch.ScheduleBlock([
                /*
                 ** Create a new AFS object. If in two copy mode,
                 ** the copy will be duplicated later.
                 ** Destroy the old capabilities after this oepration
                 ** succeeded.
                 */
                function () {
                    oldcaps = Array.map(inode.i_caps,function (cap) {return Net.Copy.capability(cap)});
                    dirsize=dir.size();
                    Dns.buf_put_dir(buf,dir);
                    self.afs.afs_create(fs.fs_cap[fs_default],buf,dirsize,Afs.Afs_commit_flag.AFS_SAFETY,function (_stat,_cap) {
                        stat=_stat;
                        cap=_cap;
                    })
                },
                function () {
                    if (stat!=Status.STD_OK) throw stat;
                    dir.dd_state=Dns.Dns_dir_state.DD_locked;
                    var caps=[Net.nilcap,Net.nilcap];
                    caps[fs_default]=cap;
                    inode2=Dns.Dns_inode(obj,caps,dirsize,Afs.Afs_file_state.FF_locked);
                    Buf.buf_init(buf);
                    Dns.buf_put_inode(buf,inode2);
                    /*
                     ** Write the inode data through the cache to disk ...
                     */
                    stat=self.cache_inode.cache_write(self.inode_cache_entry,buf,Dns.off_of_inode(obj),Dns.DNS_INODE_SIZE);
                    if (stat!=Status.STD_OK) throw stat;
                    i=0;
                    Sch.ScheduleLoop(function(index) {
                        i=index;
                        return index<2;
                    },[
                        /*
                         ** Destroy the old caps.
                         */
                        function () {
                            if(!Net.Equal.capability(oldcaps[i],Net.nilcap)) {
                                self.std.std_destroy(oldcaps[i],function (_stat) {
                                    stat=_stat;
                                })
                            }
                        }
                    ],[
                        function () {
                            stat=Status.STD_OK;
                        }
                    ])
                },
                function () {
                    callback(stat)
                }
            ],function (e) {
                if (typeof e == 'number') callback(e); else {
                    Io.printstack(e,'Dns_server.modify_dir');
                    callback(Status.STD_SYSERR);
                }
            });
        else // dir.dd_state = DD_unlocked
            Sch.ScheduleBlock([
                function () {
                    dirsize=self.dir_size(dir);
                    Dns.buf_put_dir(buf,dir);
                    self.afs.afs_modify(inode.i_caps[fs_default],buf,dirsize,0,Afs.Afs_commit_flag.AFS_SAFETY,function (_stat,_cap) {
                        stat=_stat;
                        cap=_cap;
                    })
                },
                function () {
                    if (stat!=Status.STD_OK) throw stat;
                    dir.dd_state=Dns.Dns_dir_state.DD_locked;
                    inode.i_size=dirsize;
                    inode.i_state=Afs.Afs_file_state.FF_locked;
                    Buf.buf_init(buf);
                    Dns.buf_put_inode(buf,inode);
                    stat=self.cache_inode.cache_write(self.inode_cache_entry,buf,Dns.off_of_inode(obj),Dns.DNS_INODE_SIZE);
                },
                function () {
                    callback(stat)
                }
            ],function (e) {
                if (typeof e == 'number') callback(e); else {
                    Io.printstack(e,'Dns_server.modify_dir');
                    callback(Status.STD_SYSERR);
                }
            });
    }
};

/** Insert a new created directory into the DNS table.
 *
 * @param {dns_dir} dir
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server.prototype.create_dir = function (dir,callback) {
    var stat;
    var self = this;
    var cap = undefined;
    var obj = dir.dd_objnum;
    var fs = this.dns_super.dns_fs;
    var fs_default=fs.fs_default;
    var buf = Buf.Buffer();

    this.stats.op_create++;
    Sch.ScheduleBlock([
        function () {
            /*
             ** Create a new AFS object. If in two copy mode,
             ** the copy will be duplicated later.
             */
            self.afs.afs_create(fs.fs_cap[fs_default],buf,0,Afs.Afs_commit_flag.AFS_UNCOMMIT,function (_stat,_cap) {
                stat=_stat;
                cap=_cap;
            })
        },
        function () {
            if (stat!=Status.STD_OK) throw stat;
            dir.dd_state=Dns.Dns_dir_state.DD_unlocked;
            self.live_set(obj,Dns.DNS_MAX_LIVE,1);
            /*
             ** First read the inode from disk to update
             ** the inode cache (reads/writes always full blocks!).
             */
            stat=self.cache_inode.cache_read(self.inode_cache_entry,buf,Dns.off_of_inode(obj),Dns.DEF_INODE_SIZE);

            if (stat!=Status.STD_OK) throw stat;

            var fs_caps = [Net.nilcap,Net.nilcap];
            fs_caps[fs_default]=cap;
            var inode = Dns.Dns_inode(obj,fs_caps,0,Afs.Afs_file_state.FF_unlocked);
            Buf.buf_init(buf);
            Dns.buf_put_inode(buf,inode);
            stat=self.cache_inode.cache_write(self.inode_cache_entry,buf,Dns.off_of_inode(obj),Dns.DEF_INODE_SIZE);
            self.cache_data.add(obj,dir);

            callback(stat);
        }
    ],function (e) {
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns_server.create_dir');
            callback(Status.STD_SYSERR);
        }
    })
};

/** Create a new directory. Return the directory structure and
 ** the status returned by the server create function. The super structure
 ** is already modified by this function. The new directory remains
 ** locked.
 *
 * @param colnames
 * @param {function ((Status.STD_OK|*),(dns_dir|undefined))} callback
 */
dns_server.prototype.alloc_dir = function (colnames,callback) {
    var self=this;
    var sup=this.dns_super;
    Sch.ScheduleBlock([
        function () {
            sup.lock();
        },
        function () {
            var obj=self.get_freeobjnum();
            var dir = Dns.Dns_dir(obj,colnames.length,0,colnames,Net.uniqport(),[],
                Dns.Dns_dir_state.DD_unlocked,self.time(),Dns.DNS_MAX_LIVE);
            assert(dir.try_lock());
            sup.unlock();
            self.create_dir(dir,function (_stat) {
                if (_stat==Status.STD_OK) callback(_stat,dir);
                else callback(_stat,undefined);
            })
        }
    ]);
};


/** Delete a directory. Destroy associated AFS objects.
 *
 * @param {dns_dir} dir
 * @param {function(Status.STD_OK|*)} callback
 */
dns_server.prototype.delete_dir = function (dir,callback) {
    var stat;
    var i;
    var self = this;
    var cap = undefined;
    var obj = dir.dd_objnum;
    var fs = this.dns_super.dns_fs;
    var fs_default=fs.fs_default;
    var buf = Buf.Buffer();
    var oldcaps;
    /*
     ** Get the i-node mapping
     */
    var inode;
    this.stats.op_destroy++;
    var si=this.inode_of_obj(obj);
    stat=si.stat;inode=si.inode;
    if (stat!=Status.STD_OK) callback(stat);
    else {
        self.live_set(obj,0,0);
        oldcaps = Array.map(inode.i_caps,function (cap) {return Net.Copy.capability(cap)});
        /*
         ** Destroy first the old caps
         */
        i=0;
        Sch.ScheduleLoop(function(index) {
            i=index;
            return index<2;
        },[
            /*
             ** Destroy the old caps.
             */
            function () {
                if(!Net.Equal.capability(oldcaps[i],Net.nilcap)) {
                    self.std.std_destroy(oldcaps[i],function (_stat) {
                        stat=_stat;
                    })
                }
            }
        ],[
            function () {
                stat=Status.STD_OK;
                /*
                ** Now destroy ourself!
                ** Write the i-node data through the cache to disk ...
                */
                inode.i_state=Afs_file_state.FF_invalid;
                inode.i_size=0;
                inode.i_caps=[Net.nilcap,Net.nilcap];
                Dns.buf_put_inode(buf,inode);
                stat=self.cache_inode.cache_write(self.inode_cache_entry,buf,Dns.off_of_inode(obj),Dns.DNS_INODE_SIZE);
                /*
                 ** Invalidate cache entry.
                 */
                self.cache_data.invalidate(inode.i_objnum);
                callback(stat);
            }
        ], function(e) {
            if (typeof e == 'number') callback(e); else {
                Io.printstack(e,'Dns_server.delete_dir');
                callback(Status.STD_SYSERR);
            }

        })
    }
};
dns_server.prototype.dir_modified = function (dir) {
    if (dir.dd_state == Dns.Dns_dir_state.DD_locked)
        dir.dd_state = Dns.Dns_dir_state.DD_modified;
};

/**
 * Delete an i-node without destroying AFS objects.
 *
 * @param {number} obj
 * @param {function(Status.STD_OK|*)} callback
 */
dns_server.prototype.delete_inode = function (obj,callback) {
    var stat;
    var self = this;
    var buf = Buf.Buffer();
    /*
     ** Get the inode mapping
     */
    var inode;
    this.stats.op_destroy++;
    var si=this.inode_of_obj(obj);
    stat=si.stat;inode=si.inode;
    if (stat!=Status.STD_OK) callback(stat);
    else {
        /*
         ** Destroy ourself without destroying AFS objects!
         ** Write the i-node data through the cache to disk ...
         */
        inode.i_state=Afs_file_state.FF_invalid;
        inode.i_size=0;
        inode.i_caps=[Net.nilcap,Net.nilcap];
        Dns.buf_put_inode(buf,inode);
        stat=self.cache_inode.cache_write(self.inode_cache_entry,buf,Dns.off_of_inode(obj),Dns.DNS_INODE_SIZE);
        /*
         ** Invalidate cache entry.
         */
        self.cache_data.invalidate(inode.i_objnum);
        callback(stat);
    }
};

/**
 * Create generic server statistics informations.
 *
 * @returns {string}
 */
dns_server.prototype.stat = function () {
    var self=this;
    var stats,res;
    stats=self.stats;
    res = 'DNS server status\n';
    res = res + 'Inode cache statistics:\n' +
            (self.cache_inode.cache_stat()) +
    '\nServer statistics\n\n'+
        'Read:   '+Printf.sprintf2([['%8d',stats.op_read]])+
        ' Modify: '+Printf.sprintf2([['%8d',stats.op_modify]])+
        ' Create: '+Printf.sprintf2([['%8d',stats.op_create]])+'\n'+
        'Touch:  '+Printf.sprintf2([['%8d',stats.op_touch]])+
        ' Age:    '+Printf.sprintf2([['%8d',stats.op_age]])+
        ' Destroy:'+Printf.sprintf2([['%8d',stats.op_destroy]])+'\n';
     return res;
};

/**
 * Touch directory and AFS content table objects
 *
 * @param {dns_dir} dir
 * @param {function(Status.STD_OK|*)} callback
 */
dns_server.prototype.touch = function (dir,callback) {
    var self=this,
        stat,
        cap,inode,
        i;
    this.stats.op_touch++;
    /*
     ** Keep object internally alive.
     */
    dir.dd_live=Dns.DNS_MAX_LIVE;
    self.live_set(dir.dd_objnum,Dns.DNS_MAX_LIVE,1);
    /*
     ** Keep object(s) externally alive.
     */
    var sci = self.cap_of_obj(dir.dd_objnum);
    stat=sci.stat;inode=sci.inode;
    i=0;
    if (stat!=Status.STD_OK) callback(stat);
    else Sch.ScheduleLoop(function(index) {
        i=index;
        return index < 2;
    },[
        function () {
            cap=inode.i_caps[i];
            if (!Net.Equal.capability(cap,Net.nilcap)) {
                self.std.std_touch(cap,function (_stat) {
                    stat=_stat;
                })
            }
        }
    ],[
        function () {
            callback(Status.STD_OK);
        }
    ],function(e) {
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns_server.touch');
            callback(Status.STD_SYSERR);
        }
    });
};

/** Age all objects (used and unused inodes). Destroy directories
 ** with live time equal zero (only valid files). Remember that
 ** the root dirctory (obj=1) can't be aged or deleted.
 *
 * @param  {function(Status.STD_OK|*)} callback
 */
dns_server.prototype.age = function (callback) {
    var self=this,
        sup = this.dns_super,
        stat=Status.STD_OK,
        i=2,
        lt,
        dir,
        gone=0,
        aged=0,
        scavenge=[];
    this.stats.op_age++;
    if (self.verbose) Io.out('[DNS] Aging ..');
    for(i=2;i<sup.dns_ndirs;i++) {
      lt = self.live_get(i);
      if (lt.flag == 1 && lt.time > 1 ) {                    
          self.live_set(i,lt.time-1,lt.flag);
          aged++;
      } else {
          self.live_set(i,0,lt.flag);
      }
      if (lt.flag==1 && lt.time==0) scavenge.push(i);
    }
    if (scavenge.length) Sch.ScheduleLoop(function() {
        return i < scavenge.length;
    },[
        function () {
          dir=undefined;
           self.acquire_dir(scavenge[i],function (_stat,_dir) {
                  stat=_stat;
                  dir=_dir;
           });
        },
        function () {
          if (stat==Status.STD_OK) {
            self.delete_dir(dir,function (_stat) {
                stat=_stat;
                gone++;
            })
          } else if (stat!=Status.STD_NOTNOW) {
            /*
             ** Maybe already deleted AFS object.
             */
            self.delete_inode(scavenge[i],function (_stat) {
                stat=_stat;
                gone++;
            })
          }
        },
        function () {
          i++;
          if (dir!=undefined) self.release_dir(dir,function (_stat) {
              stat=_stat;
          });
        }
    ],[
        function () {
            // sup.unlock();
            if (self.verbose) Io.out('[DNS] '+aged+' aged, '+gone+' directories(s) deleted.');
            else if (gone) Io.out('[DNS] '+gone+' directories(s) deleted.');
            callback(Status.STD_OK);
        }
    ],function(e) {
        // sup.unlock();
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns_server.age');
            callback(Status.STD_SYSERR);
        }
    });
  else callback(stat);
};

/** Append a row to a directory.
 *
 * @param {dns_dir} dir
 * @param {dns_row} row
 */
dns_server.prototype.append_row = function (dir,row) {
    var self=this;
    dir.dd_rows.push(row);
    dir.dd_nrows++;
    this.dir_modified(dir);
};

/** Append a row to a directory.
 *
 * @param {dns_dir} dir
 * @param {string} oldname
 * @param {string} newname
 * @returns {(Status.STD_OK|*)}
 */
dns_server.prototype.rename_row = function (dir,oldname,newname) {
    var self=this;
    var row = Array.find(dir.dd_rows,function(_row) {
       return String.equal(_row.dr_name,oldname);
    });
    if (row!=undefined) {
        row.dr_name=newname;
        self.dir_modified(dir);
        return Status.STD_OK;
    } else return Status.STD_NOTFOUND;
};

/** Delete a row of a directory.
 *
 * @param {dns_dir} dir
 * @param {string} name
 */
dns_server.prototype.delete_row = function (dir,name) {
    var self=this;
    dir.dd_rows=Array.filter(dir.dd_rows,function (_row) {
        return !(String.equal(_row.dr_name,name));
    });
    dir.dd_nrows=Array.length(dir.dd_rows);
    this.dir_modified(dir);
};

/** Replace a row in a directory.
 *
 * @param {dns_dir} dir
 * @param {string} name
 * @param {capset} newcs
 * @returns {(Status.STD_OK|*)}
 */
dns_server.prototype.replace_row = function (dir,name,newcs) {
    var self=this;
    var row = Array.find(dir.dd_rows,function(_row) {
        return String.equal(_row.dr_name,oldname);
    });
    if (row!=undefined) {
        row.dr_capset=newcs;
        this.dir_modified(dir);
    } else return Status.STD_NOTFOUND;
};


/** Search a row in a directory.
 *
 * @param {dns_dir} dir
 * @param {string} name
 * @returns {(dns_row|undefined)}
 */
dns_server.prototype.search_row = function (dir,name) {
    var self=this;
    var row = Array.find(dir.dd_rows,function(_row) {
        return String.equal(_row.dr_name,name);
    });
    return row;
};
/**
 * @returns {dns_super}
 */
dns_server.prototype.read_super = function () {
    return this.dns_super;
};


/** Returns (used,lifetime) tuple. This functions first probes for an
 ** used i-node, and in the case of a used i-node was found, it ages the live time.
 ** If the lifetime reaches zero, the object must be destroyed.
 ** (by this module).
 *
 *
 * @param {number} obj
 * @param {function(number,number)} callback  function(used,live)
 * @returns {{used: boolean, live: number}}
 */
dns_server.prototype.age_obj = function (obj,callback) {
    var used,live,dir;
    this.stats.op_age++;
    Sch.ScheduleBlock([
        function () {
            self.dns_super.lock();
        },
        function () {
            var tf = self.live_get(obj);
            if (tf.flag == 1 && tf.time>1) {
                self.live_set(obj,tf.time-1,1);
                used=true;live=tf.time-1;
            } else if (tf.flag==1) {
                self.live_set(obj,0,1);
                used=true;live=0;
            } else {
                used=false;live=0;
            }
            self.dns_super.unlock();
            callback (used,live);
        }
    ]);
};

/**
 * Flush the caches (if any).
 *
 * @returns {(Status.STD_OK|*)}
 */
dns_server.prototype.sync = function () {
    var stat;
    // TODO
    return stat;
};

/**
 * Exit the server.
 *
 * @returns {(Status.STD_OK|*)}
 */
dns_server.prototype.exit = function () {
    Io.out('[DNS] Exit. Writing live table...');
    return this.live_write();
};




/** Create the directory filesystem (one partition = UNIX file). [BLOCKING]
 **
 ** Args:
 **  label:      the filesystem label string [max 256 chars]
 **  ninodes:    number of i-nodes ( = maximal number of directories)
 **  cols:       Column name array (dns_colnames)
 **  colmasks:   Column mask array (dns_generic_colmask)
 **  part_inode:   Partition path and name
 **  fs_caps:  AFS server(s). All directories are saved there. Up to
 **              two file servers can be specified. The first is the default.
 **
 ** Return:
 **  status
 **  dns_super
 *
 *
 * @param {string} label
 * @param {number} ninodes
 * @param {number} blocksize
 * @param {string []} cols
 * @param {number []} colmasks
 * @param {string} part_inode
 * @param {capability []} fs_caps
 * @param {boolean} overwrite
 * @param {function(Status.STD_OK|*)} callback
 */
dns_server.prototype.create_fs = function (label,ninodes,blocksize,cols,colmasks,part_inode,fs_caps,overwrite,callback) {
    var self = this;
    function create (callback) {
        var i, n;

        var stat = Status.STD_OK;
        if (fs_caps==undefined || Array.empty(fs_caps) || Net.Equal.capability(fs_caps[0],Net.nilcap)) {
            Io.out('[DNS] Cannot create DNS file system. No file server capability provided. Fatal.');
            throw Status.STD_ARGBAD;
        }
        Io.out('[DNS] Creating DNS tree...');
        Io.out('[DNS] Blocksize: ' + blocksize + ' [bytes]');
        Io.out('[DNS] Number of total inodes (dirs): ' + ninodes);

        /*
         ** First create a server port and derive the public port.
         */
        var privport = Net.uniqport();
        var pubport = Net.prv2pub(privport);
        var checkfield = Net.uniqport();
        var ncols = cols.length;


        Io.out('[DNS] Private Port: ' + Net.Print.port(privport));
        Io.out('[DNS] Public Port: ' + Net.Print.port(pubport));
        Io.out('[DNS] Checkfield: ' + Net.Print.port(checkfield));

        Io.out('[DNS] AFS server [1]: '+Net.Print.capability(fs_caps[0]) + ' (default)');
        Io.out('[DNS] AFS server [2]: '+Net.Print.capability(fs_caps[1]));
        self.fs_default=0;

        if (!Io.exists(part_inode)) {
            Io.out('[DNS] Creating directory partition ' + part_inode);
        } else if (overwrite) {
            Io.out('[DNS] Overwriting existing directory partition ' + part_inode);
        } else {
            Io.err('[DNS] Found existing directory partition ' + part_inode);
        }
        var part_fd = Io.open(part_inode, (overwrite ? 'w+' : 'r+'));
        self.dns_part = part_inode;
        self.dns_part_fd = part_fd;

        /*
         ** The partition magic headers. After the magic string,
         ** the value 0xaa is written.
         */
        var magic1 = Buf.Buffer();
        Buf.buf_put_string(magic1, Dns.MAGIC_STR);
        Buf.buf_pad(magic1, Dns.DEF_MAGIC_SIZE, 0xaa);

        Io.out('[DNS] Writing partition magic header... ');
        n = Buf.buf_write(part_fd, magic1);
        if (n != Dns.DEF_MAGIC_SIZE) throw Status.STD_IOERR;

        /*
         ** The disk super structure.
         */

        var super1 = Buf.Buffer();
        Buf.buf_put_string(super1, label);
        Buf.buf_pad(super1, 256, 0xaa);
        Buf.buf_put_int32(super1, ninodes);
        Buf.buf_put_int32(super1, blocksize);
        Buf.buf_put_port(super1, privport);
        Buf.buf_put_port(super1, pubport);
        Buf.buf_put_port(super1, checkfield);
        Buf.buf_put_int32(super1, ncols);

        for (i = 0; i < ncols; i++) {
            Buf.buf_put_string(super1, cols[i]);
        }
        for (i = 0; i < ncols; i++) {
            DnsInt.buf_put_rights(super1, colmasks[i]);
        }
        for (i=0;i<2;i++) {
            Buf.buf_put_cap(super1,fs_caps[i]);
        }

        Io.out('[DNS] Done. ');
        Io.out('[DNS] Writing super block ... ');
        Buf.buf_pad(super1, Dns.DEF_BLOCK_SIZE - Dns.DEF_MAGIC_SIZE, 0xaa);
        n = Buf.buf_write(part_fd, super1);
        if (n != (Dns.DEF_BLOCK_SIZE - Dns.DEF_MAGIC_SIZE)) throw Status.STD_IOERR;
        Io.out('[DNS] Done. ');


        Io.out('[DNS] Writing i-nodes... ');

        var buf = Buf.Buffer();
        var inode = Dns.Dns_inode(0, [Net.nilcap, Net.nilcap], 0, Afs.Afs_file_state.FF_invalid);

        for (i = 0; i < ninodes; i++) {
            inode.i_objnum = i;
            Buf.buf_init(buf);
            Dns.buf_put_inode(buf, inode);
            Buf.buf_pad(buf, Dns.DNS_INODE_SIZE);
            n = Buf.buf_write(part_fd, buf);
            if (n != Dns.DNS_INODE_SIZE) throw Status.STD_IOERR;
        }
        self.dns_super = Dns.Dns_super(label, blocksize, privport, pubport, checkfield, ncols, cols, colmasks,
                            Dns.Fs_server(fs_caps, [Dns.Fs_state.FS_unknown, Dns.Fs_state.FS_unknown],
                                          0, Dns.Dns_mode.DNSMODE_ONECOPY));
        Io.out('[DNS] Done. ');
        /*
         ** The live time table. It's a fixed size bitfield table build with
         ** a string of sufficient size.
         **
         ** Assumption: Maximale Live time value < 128, therefore
         **             7 bit are used for each object. The MSB is
         **             the used flag (=1 -> inode used).
         **
         ** The first entry (obj=0) is used for the lock status
         ** of the live table.
         **
         */
        Io.out('[DNS] Writing live table... ');

        var live_size = ninodes + 1;
        var live_table = Buf.Buffer();
        var live_off = Dns.DEF_BLOCK_SIZE + (ninodes * Dns.DNS_INODE_SIZE);

        function live_set(obj, time, flag) {
            Buf.buf_set(live_table, obj, ((time & 0x7f) | ((flag << 7) & 0x80)));
        }

        function live_write() {
            /*
             ** Unlock the live table
             */
            live_set(0, 0, 1);
            n = Buf.buf_write(part_fd, live_table, live_off);
            if (n != live_size) throw Status.STD_IOERR;
        }

        for (i = 0; i <= ninodes; i++) {
            live_set(i, Dns.DNS_MAX_LIVE, 0);
        }
        Buf.buf_pad(live_table, live_size);
        live_write();

        Io.out('[DNS] Done. ');

        // w/o cache version, used ony to create the root directory...
        function write_inode(obj, data, size) {
            /*
             ** Read and write full blocks!
             */
            var buf = Buf.Buffer();
            var off = 512 + Dns.off_of_inode(obj);
            var fileoff = div(off,blocksize)*blocksize;
            var blockoff = off % blocksize;
            var n = Buf.buf_read(self.dns_part_fd, buf, fileoff,blocksize);
            if (n != blocksize)
                return Status.STD_IOERR;
            Buf.buf_blit(buf,blockoff,data,0,size);
            n = Buf.buf_write(self.dns_part_fd, buf, fileoff, blocksize);
            if (self.sync_write_mode) Io.sync(self.dns_part_fd);
            if (n == blocksize)
                return Status.STD_OK;
            else
                return Status.STD_IOERR;
        }

        var rootinode;
        var rootcap;

        function create_dir(dir,callback) {
            var stat;
            var cap = undefined;
            var obj = dir.dd_objnum;
            var fs = self.dns_super.dns_fs;
            var fs_default=fs.fs_default;
            var buf = Buf.Buffer();

            self.stats.op_create++;
            Sch.ScheduleBlock([
                function () {
                    self.afs.afs_create(fs.fs_cap[fs_default],buf,0,Afs.Afs_commit_flag.AFS_UNCOMMIT,function (_stat,_cap) {
                        stat=_stat;
                        cap=_cap;
                    })
                },
                function () {
                    if (stat!=Status.STD_OK) throw stat;
                    dir.dd_state=Dns.Dns_dir_state.DD_unlocked;
                    var fs_caps = [Net.nilcap,Net.nilcap];
                    fs_caps[fs_default]=cap;
                    rootinode = Dns.Dns_inode(obj,fs_caps,0,Afs.Afs_file_state.FF_unlocked);
                    Buf.buf_init(buf);
                    Dns.buf_put_inode(buf,rootinode);
                    stat=write_inode(obj,buf,Dns.DNS_INODE_SIZE);
                    callback(stat);
                }
            ],function (e) {
                if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
            })
        }

        function modify_dir(dir,callback) {
            var stat;
            var cap = undefined;
            var obj = dir.dd_objnum;
            var fs = self.dns_super.dns_fs;
            var fs_default=fs.fs_default;
            var dirsize = dir.size();
            var buf = Buf.Buffer();
            Dns.buf_put_dir(buf,dir);
            self.stats.op_create++;
            Sch.ScheduleBlock([
                function () {
                    self.afs.afs_modify(rootinode.i_caps[fs_default],buf,dirsize,0,Afs.Afs_commit_flag.AFS_SAFETY,function (_stat,_cap) {
                        stat=_stat;
                        cap=_cap;
                    })
                },
                function () {
                    if (stat!=Status.STD_OK) throw stat;
                    dir.dd_state=Dns.Dns_dir_state.DD_locked;
                    rootinode.i_size=dirsize;
                    rootinode.i_state=Afs.Afs_file_state.FF_locked;
                    rootcap=Net.Capability(self.dns_super.dns_putport,
                                           Net.prv_encode(rootinode.i_objnum,Rights.PRV_ALL_RIGHTS,dir.dd_random));
                    Buf.buf_init(buf);
                    Dns.buf_put_inode(buf,rootinode);
                    stat=write_inode(obj,buf,Dns.DNS_INODE_SIZE);
                    callback(stat);
                }
            ],function (e) {
                if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
            })
        }

        /** Create the root directory (Object number 1) and return it and the status
         ** of the server create function. All pending writes are already done here.
         **
         ** Note: the root directory can't be deleted. Therefore, it's not
         ** garbage collected.
         *
         */
        function create_root(callback) {
            var stat;
            var sup=self.dns_super;
            self.stats.op_create++;
            assert(sup.try_lock());
            if (sup.dns_nextfree!=1) {
                sup.unlock();
                callback(Status.STD_EXISTS);
                return;
            }
            sup.dns_nextfree++;
            var rootdir = Dns.Dns_dir(1,sup.dns_ncols,0,sup.dns_colnames,Net.uniqport(),[],
                                      Dns.Dns_dir_state.DD_unlocked,self.time(),Dns.DNS_MAX_LIVE);
            rootdir.dd_lock.acquire(); // Non-blocking, we're the first one
            sup.unlock();
            Sch.ScheduleBlock([
                function () {
                    create_dir(rootdir,function (_stat) {stat=_stat});
                },
                function () {
                    if (stat!=Status.STD_OK) {
                        throw stat;
                    }
                    modify_dir(rootdir,function (_stat) {
                        stat=_stat;
                    });
                }, function () {
                    rootdir.dd_lock.release();
                    callback(stat,rootdir);
                }
            ], function (e) {
                if (rootdir!=undefined) rootdir.dd_lock.release();
                if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
            });
        }


        var dir = undefined;
        Sch.ScheduleBlock([
            function () {
                Io.out('[DNS] Creating the root directory ... ');
                create_root(function (_stat,_dir) {
                    stat = _stat;
                    dir = _dir;
                })
            },
            function () {
                if (stat == Status.STD_OK) {
                    Io.out('[DNS] Done.');
                    self.rootdir = dir;
                }
                else Io.out('[DNS] Creation of root directory failed: ' + Status.print(stat));
                Io.close(part_fd);
                self.dns_part_fd=undefined;
                Io.out('[DNS] Finished.');
                callback(stat);
            }
        ])
    }
    try {
        create (callback);
    } catch (e) {
        if (self.dns_part_fd) Io.close(self.dns_part_fd);
        self.dns_part_fd=undefined;
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns_server.create_fs');
            callback(Status.STD_IOERR);
        }
        throw Error(e);
    }
};

/** Open the DNS system (one inode partition, UNIX file) [BLOCKING]
 **
 **  part_inode:     Directory Mapping Partition File
 **  cache:      Cache parameters
 *
 *
 * @param {string} part_inode
 * @param {dns_cache_parameter} cache_params
 * @param {function(Status.STD_OK|*)} callback
 */
dns_server.prototype.open_fs = function (part_inode,cache_params,callback) {
    /**
     *
     * @type {dns_server}
     */
    var self = this;
    self.dns_super=Dns.Dns_super();
    var sup;

    function open(callback) {
        var n, i,j;
        self.dns_super=Dns.Dns_super();
        sup = self.dns_super;

        var stat = Status.STD_OK;
        Io.out('[DNS] Opening DNS ...');
        if (Io.exists(part_inode)) {
            Io.out('[DNS] Using directory i-node partition ' + part_inode);
        } else {
            Io.out('[DNS] No existing directory i-node partition ' + part_inode);
            throw Status.STD_IOERR;
        }
        self.dns_part = part_inode;
        self.dns_part_fd = Io.open(part_inode, (self.iocache_bypass ? 'rs+' : 'r+'));
        /*
         ** Either the filesystem is read only or we have an
         ** inconsistent filesystem. In that case, only read
         ** request are allowed.
         */
        var readonly = false;
        Io.out('[DNS] Reading the super block...');
        var superbuf = Buf.Buffer();
        n = Buf.buf_read(self.dns_part_fd, superbuf, 0, Dns.DEF_BLOCK_SIZE);
        if (n != Dns.DEF_BLOCK_SIZE) {
            Io.out('[DNS] Cannot read super block.');
            Io.close(self.dns_part_fd);
            throw Status.STD_IOERR;
        }
        var magic1 = Buf.buf_get_string(superbuf);
        if (!String.equal(magic1, Dns.MAGIC_STR)) {
            Io.out('[DNS] Invalid i-node partition magic found, got ' + magic1 + ', but exptected ' + Dns.MAGIC_STR);
            throw Status.STD_IOERR;
        } else {
            Io.out('[DNS] Found i-node partition magic  ' + magic1);
        }
        Buf.buf_set_pos(superbuf, Dns.DEF_MAGIC_SIZE);
        sup.dns_name = Buf.buf_get_string(superbuf);
        Buf.buf_set_pos(superbuf, 256 + Dns.DEF_MAGIC_SIZE);
        sup.dns_ndirs = Buf.buf_get_int32(superbuf);
        sup.dns_block_size = Buf.buf_get_int32(superbuf);
        sup.dns_getport = Buf.buf_get_port(superbuf);
        sup.dns_putport = Buf.buf_get_port(superbuf);
        sup.dns_checkfield = Buf.buf_get_port(superbuf);
        sup.dns_ncols = Buf.buf_get_int32(superbuf);
        var cols=[];
        var colmasks=[];

        for(i=0;i<sup.dns_ncols;i++) {
            cols.push(Buf.buf_get_string(superbuf));
        }
        for(i=0;i<sup.dns_ncols;i++) {
            colmasks.push(DnsInt.buf_get_rights(superbuf));
        }
        var fs_caps=[];
        for(i=0;i<2;i++) {
            var cap=Buf.buf_get_cap(superbuf);
            if (!Net.Equal.capability(cap,Net.nilcap)) Io.out('[DNS] Using AFS  ' + Net.Print.capability(cap));
            fs_caps.push(cap);
        }

        sup.dns_colnames=cols;
        sup.dns_generic_colmask=colmasks;
        sup.dns_fs=Dns.Fs_server(fs_caps, [Dns.Fs_state.FS_unknown, Dns.Fs_state.FS_unknown],
            0, Dns.Dns_mode.DNSMODE_ONECOPY);
        /*
         ** Defaulf file server and supported mode must be located later (get_def_fs)
         */
        Io.out('  DNS: Label: '+sup.dns_name);
        Io.out('  DNS: Maximal number of directories: '+sup.dns_ndirs);
        Io.out('  DNS: Blocksize: '+sup.dns_block_size);
        /*
         ** The livtime table. It's a fixed size bitfield table build with
         ** a string of sufficient size.
         **
         ** Assumption: Maximale Live time value < 128, therefore
         **             7 bit are used for each object. The MSB is
         **             the used flag (=1 -> inode used).
         **
         ** The first entry (obj=0) is used for the lock status
         ** of the live table.
         */
        var live_size = sup.dns_ndirs+1;
        var live_table = Buf.Buffer();
        var live_off = 512 + (sup.dns_ndirs*Dns.DNS_INODE_SIZE)
        /**
         *
         * @param {number} obj
         * @param {number} time
         * @param {number} flag
         */
        function live_set(obj, time, flag) {
            Buf.buf_set(live_table, obj, ((time & 0x7f) | ((flag << 7) & 0x80)));
        }

        /**
         *
         * @param {number} obj
         * @returns {{time: number, flag: number}}
         */
        function live_get(obj) {
            var v = Buf.buf_get(live_table, obj);
            return {time: (v & 0x7f), flag: ((v & 0x80) >> 7)}
        }

        /**
         *
         * @returns {number}
         */
        function live_read() {
            var n = Buf.buf_read(self.dns_part_fd, live_table, live_off, live_size);
            if (n != live_size) {
                return Status.STD_IOERR;
            }
            var live = live_get(0);
            if (live.time == 0 && live.flag == 1) {
                /*
                 ** Now lock the live table. After a server crash,
                 ** the restarted server will found the lock and must
                 ** discard the live table. All server objects got
                 ** the maximal live time!
                 */
                live_set(0, 1, 1);
                n = Buf.buf_write(self.dns_part_fd, live_table, live_off, 1);
                if (n != 1) return Status.STD_IOERR;
                else return Status.STD_OK;
            } else return Status.STD_ARGBAD;
        }

        /**
         *
         * @returns {number}
         */
        function live_write() {
            /*
             ** Unlock the live table
             */
            live_set(0, 0, 1);
            n = Buf.buf_write(self.dns_part_fd, live_table, live_off);
            if (n != live_size) return Status.STD_IOERR;
            if (self.sync_write_mode) Io.sync(self.dns_part_fd);
            return Status.STD_OK;
        }

        self.live_set = live_set;
        self.live_get = live_get;
        self.live_read = live_read;
        self.live_write = live_write;

        /*
         ** Read the live table
         */
        Io.out('[DNS] Reading the live time table...');
        stat = live_read();
        if (stat == Status.STD_ARGBAD) {
            Io.out('[DNS] Found locked live table: Reinitialize...');
            for (i = 0; i < sup.dns_ndirs - 1; i++) {
                live_set(i, Dns.DNS_MAX_LIVE, 0);
            }
        } else if (stat == Status.STD_IOERR) {
            Io.out('[DNS] IO Error.');
            Io.close(self.dns_part_fd);
            throw Status.STD_IOERR;
        }
        Io.out('[DNS] Ok.');
        stat=Status.STD_OK;

        /**
         ** Raw disk Read and Write functions for the cache module.
         **
         ** Units:
         **  addr: blocks
         **  size: bytes
         **
         */
        /**
         *
         * @param obj
         * @param addr
         * @param data
         * @param size
         * @returns {number}
         */
        self.read_inode = function (obj, addr, data, size) {
            var off = addr * sup.dns_block_size;
            Io.log((log < 10) || ('read_inode obj=' + obj + ' addr=' + addr + ' size=' + size));
            var n = Buf.buf_read(self.dns_part_fd, data, off, size);
            if (n == size)
                return Status.STD_OK;
            else
                return Status.STD_SYSERR;

        };

        /**
         *
         * @param obj
         * @param addr
         * @param data
         * @param size
         * @returns {number}
         */
        self.write_inode = function (obj, addr, data, size) {
            var off = addr * sup.dns_block_size;
            Io.log((log < 10) || ('write_inode obj=' + obj + ' addr=' + addr + ' size=' + size));
            var n = Buf.buf_write(self.dns_part_fd, data, off, size);
            if (self.sync_write_mode) Io.sync(self.dns_part_fd);
            if (n == size)
                return Status.STD_OK;
            else
                return Status.STD_SYSERR;
        };

        self.sync_inode = function (obj) {
        };

        Io.out('[DNS] Creating inode cache ' + cache_params.c_inode_size + '[' + cache_params.c_inode_buffers + '] ... ');

        /*
         ** Note: I-nodes are handled only on buffer block level
         ** #i-node=cache_params.c_inode_size/DEF_INODE_SIZE
         */
        var cache_inode =
            Fcache.Fcache(
                'DNS Inode',
                cache_params.c_inode_buffers,
                Dns.DEF_BLOCK_SIZE,
                cache_params.c_inode_size,
                self.read_inode,
                self.write_inode,
                self.sync_inode,
                Fcache.Fs_cache_mode.Cache_R);
        self.cache_inode = cache_inode;
        if (self.cache_inode == undefined) {
            Io.out('[DNS] IO Error.');
            Io.close(self.dns_part_fd);
            throw Status.STD_IOERR;
        }
        /*
         ** The i-node cache object. One object for all i-nodes!
         ** Disk address = obj = 1 [blocks]
         */
        var res = cache_inode.cache_lookup(1, 1, Dns.off_of_inode(sup.dns_ndirs), Afs.Afs_file_state.FF_unlocked);
        var inode_fse = res.fse;
        self.inode_cache_entry = inode_fse;

        /*
         ** Some i-node utils
         */
        self.inode_of_obj = function(obj) {
            try {
                var inode = undefined;
                var buf = Buf.Buffer();
                var stat = cache_inode.cache_read(inode_fse, buf, Dns.off_of_inode(obj), Dns.DNS_INODE_SIZE);
                if (stat != Status.STD_OK) return {stat: stat, inode: undefined};
                inode = Dns.buf_get_inode(buf);
                return {stat: stat, inode: inode};
            } catch (e) {
                return {stat: Status.STD_SYSERR, inode: undefined};
            }
        };

        /**
         *
         * @param {number} obj
         * @returns {{stat:(Status.STD_OK|*),cap:(capability|undefined),inode:(dns_inode|undefined)}}
         */
         self.cap_of_obj = function(obj) {
            var stat;
            var si = self.inode_of_obj(obj);
            if (si.stat != Status.STD_OK) return {stat:stat,cap:undefined,inode:undefined};
            var cap = si.inode.i_caps[self.fs_default];
            if (si.inode.i_state == Afs.Afs_file_state.FF_locked ||
                si.inode.i_state == Afs.Afs_file_state.FF_unlocked) stat=Status.STD_OK;
            else stat=Status.STD_SYSERR;
            return {stat:stat,cap:cap,inode:si.inode};
        };

        /**
         *
         * @param {dns_inode} inode
         * @returns {Status.STD_OK|*}
         */
         self.update_inode = function(inode) {
            try {
                var buf = Buf.Buffer();
                Dns.buf_put_inode(buf, inode);
                var stat = cache_inode.cache_write(inode_fse, buf, Dns.off_of_inode(inode.i_objnum),Dns.DEF_INODE_SIZE);
                return stat;
            } catch (e) {
                return Status.STD_SYSERR;
            }
        };

        var cache_data = Cache.Cache(cache_params.c_dir_buffers);

        self.cache_data = cache_data;

        if (cache_data == undefined) {
            Io.out('[DNS] IO Error.');
            Io.close(self.dns_part_fd);
            throw Status.STD_IOERR;
        }

        /*
         ** Round up the value x to block_size
         */

        function block(x) {
            return Dns.ceil_block_bytes(x, sup.dns_block_size);
        }

        function to_block(x) {
            return div(x, sup.dns_block_size);
        }

        function of_block(x) {
            return (x * sup.dns_block_size);
        }

        self.block = block;
        self.to_block = to_block;
        self.of_block = of_block;
        /*
         ** Read the i-node table.
         ** Build a list with free i-node object numbers below the
         ** nextfree boundary (above nextfree there are all
         ** free i-nodes, if any).
         */
        Io.out('[DNS] reading the i-node table ...');
        var freeino=[];
        var firstfree=-1;
        var nextfree=-1;
        var nused=0;
        var inodeb = Buf.Buffer();
        for(i=1;i<sup.dns_ndirs;i++) {
            stat = cache_inode.cache_read(inode_fse, inodeb, Dns.off_of_inode(i), Dns.DEF_INODE_SIZE);
            if (stat != Status.STD_OK) {
                Io.out('[DNS] Failed to read i-node ' + i + ': ' + Status.print(stat));
                throw stat;
            }
            inodeb.pos = 0;
            var inode = Dns.buf_get_inode(inodeb);
            /*
             ** Some sanity checks first
             */

            if (inode.i_objnum != i) {
                Fs.closeSync(self.dns_part_fd);
                Io.out('[DNS] got invalid i-node ' + i + ': ' + util.inspect(inode));
                Io.out('[DNS] Abort.');
                throw Status.STD_SYSERR;
            }
            if (inode.i_state == Afs_file_state.FF_invalid ||
                inode.i_state == Afs_file_state.FF_unlocked) {

                live_set(i, 0, 0);

                if (nextfree != -1 && nextfree != (i - 1)) {

                    for (j = firstfree; j <= nextfree; j++) {
                        freeino.push(j);
                    }
                    firstfree = i;
                    nextfree = i;
                } else {
                    nextfree = i;
                    if (firstfree == -1)
                        firstfree = i;
                }

                if (inode.i_state == Afs_file_state.FF_unlocked) {
                    Io.out('[DNS] Unlocked/uncommitted directory found. Destroy it: ' + inode.print());
                    inode.i_state = Afs_file_state.FF_invalid;
                    inodeb.pos = 0;
                    Dns.buf_put_inode(inodeb, inode);
                    stat = cache_inode.cache_write(inode_fse, inodeb, Dns.off_of_inode(i), Dns.DEF_INODE_SIZE);

                    if (stat != Status.STD_OK)
                        throw stat;

                }
            } else {
                var tf = live_get(i);
                live_set(i, tf.time, 1);
                nused++;
            }
        }
        Io.out('[DNS] Ok.');

        if (nextfree != -1 && nextfree < (sup.dns_ndirs - 1)) {

            /*
             ** There are only used i-nodes at the end of the i-node table.
             */
            for (j = firstfree; j <= nextfree; j++) {
                freeino.push(j);
            }
            nextfree = -1;
        } else if (firstfree == 0 && nextfree == (sup.dns_ndirs - 1)) {

            /*
             ** Empty filesystem.
             */
            nextfree = 1;
        } else if (firstfree > 0) {

            /*
             ** There are free i-nodes at the end of the i-node table.
             */
            nextfree = firstfree;
        }


        sup.dns_nused = nused;
        sup.dns_freeobjnums = freeino;
        sup.dns_nextfree = nextfree;

        Io.out('[DNS] Found ' + sup.dns_nused + ' used Inode(s)');

        Io.log((log < 0) || (self.dns_super.print()));
        /*
        ** Read the root directory...
         */
        self.acquire_dir(1,function (_stat,_dir) {
            stat=_stat;
            self.rootdir=_dir;
            callback(stat);
        });

    }
    try {
        open(callback);
    } catch (e) {
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Dns_server.open_fs');
            callback(Status.STD_IOERR);
        }
        // throw Error(e);
    }
};


/*
 ** ================
 ** PUBLIC INTERFACE
 ** ================
 */

var DnsRpc = Require('dos/dns_srv_rpc');
//afs_server.prototype=new AfsRpc.afs_server_rpc();
dns_server.prototype.dns_lookup=DnsRpc.dns_server_rpc.prototype.dns_lookup;
dns_server.prototype.dns_create=DnsRpc.dns_server_rpc.prototype.dns_create;
dns_server.prototype.dns_delete=DnsRpc.dns_server_rpc.prototype.dns_delete;
dns_server.prototype.dns_delete_dir=DnsRpc.dns_server_rpc.prototype.dns_delete_dir;
dns_server.prototype.dns_append=DnsRpc.dns_server_rpc.prototype.dns_append;
dns_server.prototype.dns_rename=DnsRpc.dns_server_rpc.prototype.dns_rename;
dns_server.prototype.dns_replace=DnsRpc.dns_server_rpc.prototype.dns_replace;
dns_server.prototype.dns_info=DnsRpc.dns_server_rpc.prototype.dns_info;
dns_server.prototype.dns_stat=DnsRpc.dns_server_rpc.prototype.dns_stat;
dns_server.prototype.dns_touch=DnsRpc.dns_server_rpc.prototype.dns_touch;
dns_server.prototype.dns_age=DnsRpc.dns_server_rpc.prototype.dns_age;
dns_server.prototype.dns_restrict=DnsRpc.dns_server_rpc.prototype.dns_restrict;
dns_server.prototype.dns_exit=DnsRpc.dns_server_rpc.prototype.dns_exit;
dns_server.prototype.dns_list=DnsRpc.dns_server_rpc.prototype.dns_list;
dns_server.prototype.dns_setlookup=DnsRpc.dns_server_rpc.prototype.dns_setlookup;
dns_server.prototype.dns_start_server=DnsRpc.dns_server_rpc.prototype.dns_start_server;

module.exports = {
    /**
     *
     * @param rpc
     * @returns {dns_server}
     */
    Server: function(rpc,options) {
        var obj = new dns_server(rpc,options);
        Object.preventExtensions(obj);
        return obj;
    }
};
