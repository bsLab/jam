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
 **    $CREATED:     6-7-15.
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 *  AFS Server and RPC Interface
 *  
 **    $ENDOFINFO
 */
/*
 *********************
 ** PUBLIC INTERFACE
 *********************
 */

"use strict";

var log = 0;

var util = Require('util');
var Io = Require('com/io');
var Net = Require('dos/network');
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;
var Std = Require('dos/std');
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Fcache = Require('dos/fcache');
var Flist = Require('dos/freelist');
var Fs = Require('fs');
var Comp = Require('com/compat');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Hashtbl = Comp.hashtbl;
var assert = Comp.assert;
var div = Comp.div;
var Afs = Require('dos/afs_srv_common');
var Afs_file_state = Afs.Afs_file_state;
var Afs_commit_flag= Afs.Afs_commit_flag;
/**
 * @augments afs_server
 * @augments afs_server_emb
 * @see afs_server
 * @see afs_server_emb
 * @see afs_server_rpc~meth
 * @constructor
 */
var afs_server_rpc = function() {
};

/**
 * @typedef {{
 * afs_create_file:afs_server_rpc.afs_create_file,
 * afs_modify_file:afs_server_rpc.afs_modify_file,
 * afs_read_file:afs_server_rpc.afs_read_file,
 * afs_file_size:afs_server_rpc.afs_file_size,
 * afs_touch_file:afs_server_rpc.afs_touch_file,
 * afs_age:afs_server_rpc.afs_age,
 * afs_insert_data:afs_server_rpc.afs_insert_data,
 * afs_delete_data:afs_server_rpc.afs_delete_data,
 * afs_destroy_file:afs_server_rpc.afs_destroy_file,
 * afs_info:afs_server_rpc.afs_info,
 * afs_exit:afs_server_rpc.afs_exit,
 * afs_stat:afs_server_rpc.afs_stat,
 * afs_start_server:afs_server_rpc.afs_start_server
 * }} afs_server_rpc~meth
 */

/** AFS server create request.
 ** Create a new file.
 **
 ** Args:
 **  priv:   the request private field
 **  buf:    the write buffer
 **  size:   the initial  file size [bytes] (can be 0: only object creation)
 **  commit: the commit flag
 **
 ** Return:
 **  status
 **  newcap
 **
 *
 * @param {privat} priv
 * @param {buffer|rpcio} buf
 * @param {number} size
 * @param {Afs_commit_flag} commit
 * @param {function((Status.STD_OK|*),capability|undefined)} callback
 */
afs_server_rpc.prototype.afs_create_file =function (priv,buf,size,commit,callback) {

    var self=this;
    var stat=Status.STD_UNKNOWN;
    var file;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    Sch.ScheduleBlock([
        function () {
            if (obj > 0) {
                /*
                 ** It's a file, used only for authorization.
                 */
                self.acquire_file(obj, function (_stat, _file) {
                    stat = _stat;
                    file = _file;
                });
            } else {
                file=undefined;
                if (Net.prv_decode(priv, self.afs_super.afs_checkfield) == false ||
                    Net.rights_req(rights, [Rights.AFS_RGT_CREATE]) == false)
                    stat = Status.STD_DENIED;
                else stat = Status.STD_OK;
            }
        },
        function () {
            if (stat != Status.STD_OK)
                throw stat;
            if (file!=undefined) {
                if (Net.prv_decode(priv, file.ff_random) == false ||
                    Net.rights_req(rights, [Rights.AFS_RGT_CREATE]) == false) {
                    self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
                    throw Status.STD_DENIED;
                }
                self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
            }
            /*
             ** First get a new i-node==object number
             */
            var objnew = self.get_freeobjnum();
            file = Afs.Afs_file(objnew,Net.uniqport(),size, // initial size
                self.time(),Afs.AFS_MAXLIVE,
                Afs_file_state.FF_unlocked);
            file.lock();
            var final = commit > 0;
            stat = self.create_file_inode(file,final);
            if (stat != Status.STD_OK) {
                file.unlock();
                throw stat;
            }
            var cap =
                Net.Capability(self.afs_super.afs_putport,
                    Net.prv_encode(objnew,Rights.PRV_ALL_RIGHTS,file.ff_random));
            self.touch(file);
            if (size>0) {
                stat=self.modify_file(file,0,size,buf);
            }
            if (stat != Status.STD_OK) {
                file.unlock();
                throw stat;
            }
            stat = self.release_file(file,commit);
            //Io.out(file.print());
            if (stat != Status.STD_OK) {
                file.unlock();
                throw stat;
            }
            callback(stat,cap);

        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_create_file');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

/** AFS server modify request.
 ** Morify an existing file.
 **
 ** Args:
 **  priv:   the request private field
 **  buf:    the write buffer
 **  size:   the initial  file size [bytes] (can be 0: only object creation)
 **  commit: the commit flag
 **
 ** Return:
 **  status
 **  newcap
 **
 *
 * @param {privat} priv
 * @param {buffer|rpcio} buf
 * @param {number} off
 * @param {number} size
 * @param {(Afs_commit_flag.AFS_UNCOMMIT|*)} commit
 * @param {function((Status.STD_OK|*),capability|undefined)} callback
 */

afs_server_rpc.prototype.afs_modify_file =function (priv,buf,off,size,commit,callback) {
    var self=this;
    var stat=Status.STD_UNKNOWN;
    var file=undefined;
    var file2=undefined;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);


    Io.log((log<1)||('afs_server_rpc.afs_modify_file: obj='+obj+' off='+off+' size='+size+' commit='+Afs.Afs_commit_flag.print(commit)));

    if (off<0 || size<0) callback(Status.STD_ARGBAD,undefined);
    else Sch.ScheduleBlock([
        function () {
            if (obj > 0) {
                /*
                 */
                self.acquire_file(obj, function (_stat, _file) {
                    stat = _stat;
                    file = _file;
                });
            } else {
                stat = Status.STD_CAPBAD;
            }
        },
        function () {
            if (stat != Status.STD_OK)
                throw stat;
            if (Net.prv_decode(priv, file.ff_random) == false ||
                    Net.rights_req(rights, [Rights.AFS_RGT_MODIFY]) == false) {
                    throw Status.STD_DENIED;
            }
            var cap =
                Net.Capability(self.afs_super.afs_putport,
                    Net.prv_encode(obj,Rights.PRV_ALL_RIGHTS,file.ff_random));
            if (size==0 && file.ff_state == Afs.Afs_file_state.FF_unlocked) {
                /*
                 ** Only commit the file.
                 */
                stat = self.release_file(file, commit);
                file=undefined;
            } else if (size==0 && (file.ff_state == Afs.Afs_file_state.FF_locked||
                                   file.ff_state == Afs.Afs_file_state.FF_commit)) {
                /*
                 ** Only unlocked files can be committed!
                 ** Or must we create a copy here?
                 */
                throw Status.STD_ARGBAD;
            } else {
                /*
                 ** The file exists, the request is authorized, modify content.
                 */
                if (file.ff_state == Afs.Afs_file_state.FF_unlocked) {
                    /*
                     ** New data beyond the current file size ?
                     */
                    if (file.ff_size < (off+size)) {
                        stat=self.modify_size(file,(off+size));
                        if (stat!=Status.STD_OK) throw stat;
                    }
                    stat=self.modify_file(file,off,size,buf);
                    if (stat!=Status.STD_OK) throw stat;
                    stat = self.release_file(file, commit);
                    if (stat!=Status.STD_OK) throw stat;
                    file=undefined;

                } else {
                    /*
                     ** Create a new file. Copy the content of the
                     ** original one. Modify the new one.
                     */
                    /*
                     ** First get a new i-node==object number
                     */
                    var objnew = self.get_freeobjnum();
                    var size2;
                    if (file.ff_size < off+size) size2=off+size; else size2=file.ff_size;
                    file2 = Afs.Afs_file(objnew,Net.uniqport(),size2, // initial size
                                        self.time(),Afs.AFS_MAXLIVE,
                                        Afs_file_state.FF_unlocked);
                    file2.lock();
                    if (stat != Status.STD_OK) {
                        file.unlock();
                        throw stat;
                    }
                    cap =
                        Net.Capability(self.afs_super.afs_putport,
                            Net.prv_encode(objnew,Rights.PRV_ALL_RIGHTS,file2.ff_random));
                    var buf2=Buf.Buffer();
                    var cs = Perv.min(file.ff_size,1000);
                    var co = 0;
                    while (cs>0) {
                        stat=self.read_file(file,co,cs,buf2);
                        if (stat!=Status.STD_OK) {
                            file.unlock();
                            throw stat;
                        }
                        stat=self.modify_file(file2,co,cs,buf2);
                        if (stat!=Status.STD_OK) {
                            file.unlock();
                            throw stat;
                        }
                        co=Perv.min(co+cs,file.ff_size);
                        cs=Perv.min(file.ff_size-co,1000);
                    }
                    stat=self.modify_file(file2,off,size,buf);
                    if (stat!=Status.STD_OK) {
                        file2.unlock();
                        throw stat;
                    }
                    stat = self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
                    file=undefined;
                    stat = self.release_file(file2,commit);
                    if (stat!=Status.STD_OK) {
                        file2.unlock();
                        throw stat;
                    }
                }
            }
            if (stat != Status.STD_OK) {
                throw stat;
            }
            callback(stat,cap);

        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_modify_file');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

/**
 *
 * @param {privat} priv
 * @param {buffer|rpcio} buf
 * @param off
 * @param size
 * @param {function((Status.STD_OK|*),number)} callback return status,size
 */
afs_server_rpc.prototype.afs_read_file =function (priv,buf,off,size,callback) {
    var self = this;
    var stat = Status.STD_UNKNOWN;
    var file = undefined;
    var size=size;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    Sch.ScheduleBlock([
        function () {
            if (obj > 0) {
                /*
                 ** It's a file
                 */
                self.acquire_file(obj, function (_stat, _file) {
                    stat = _stat;
                    file = _file;
                });
            } else
                stat=Status.STD_CAPBAD;
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            if ((Net.prv_decode(priv, file.ff_random) == false) ||
                (Net.rights_req(rights,[Rights.AFS_RGT_READ])== false)) {
                throw Status.STD_DENIED;
            }
            Io.log((log<1)||('afs_read_file off='+off+' ff_size='+file.ff_size));
            if (off > file.ff_size) {
                throw Status.STD_ARGBAD;
            }
            if ((size+off) > file.ff_size) size=file.ff_size-off;
            stat=self.read_file(file,off,size,buf);
            self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
            file=undefined;
            callback(stat,size);
        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_read_file');}
        if (typeof e == 'number') callback(e,0); else callback(Status.STD_SYSERR,0);
    });
};

/**
 ** AFS server size request.
 **
 **
 *
 * @param {private} priv
 * @param {function((Status.STD_OK|*),number)} callback return status,size
 */
afs_server_rpc.prototype.afs_file_size =function (priv,callback) {
    var self = this;
    var stat = Status.STD_UNKNOWN;
    var file = undefined;
    var size=0;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    Sch.ScheduleBlock([
        function () {
            if (obj > 0) {
                /*
                 ** It's a file
                 */
                self.acquire_file(obj, function (_stat, _file) {
                    stat = _stat;
                    file = _file;
                });
            } else
                stat=Status.STD_CAPBAD;
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            if ((Net.prv_decode(priv, file.ff_random) == false)) {
                throw Status.STD_DENIED;
            }
            size=file.ff_size;
            stat=Status.STD_OK;
            self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
            file=undefined;
            callback(stat,size);
        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_file_size');}
        if (typeof e == 'number') callback(e,0); else callback(Status.STD_SYSERR,0);
    });
};
/**
 ** Touch file (update live time)
 *
 * @param {private} priv
 * @param {function((Status.STD_OK|*))} callback return status
 */
afs_server_rpc.prototype.afs_touch_file =function (priv,callback) {
    var self = this;
    var stat = Status.STD_UNKNOWN;
    var file = undefined;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    Sch.ScheduleBlock([
        function () {
            self.acquire_file(obj,function (_stat,_file) {
                stat=_stat;
                file=_file;
            });
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            if (Net.prv_decode(priv, file.ff_random) == false) {
                throw Status.STD_DENIED;
            }
            self.touch(file);
            stat=Status.STD_OK;
            self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
            file=undefined;
            callback(stat);
        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_touch_file');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    });

};

/**
 ** Age a file (decrement live time)
 *
 * @param {private} priv
 * @param {function((Status.STD_OK|*))} callback return status
 */
afs_server_rpc.prototype.afs_age_file =function (priv,callback) {
    var self = this,
        stat = Status.STD_UNKNOWN,
        file = undefined,
        obj = Net.prv_number(priv),
        rights = Net.prv_rights(priv);

    Sch.ScheduleBlock([
        function () {
            self.acquire_file(obj,function (_stat,_file) {
                stat=_stat;
                file=_file;
            });
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            if (Net.prv_decode(priv, file.ff_random) == false) {
                throw Status.STD_DENIED;
            }
            self.age_file(file);
            stat=Status.STD_OK;
            self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
            file=undefined;
            callback(stat);
        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_age_file');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    });
};

/**
 ** Age all files (decrement live time)
 *
 * @param {function((Status.STD_OK|*))} callback return status
 */
afs_server_rpc.prototype.afs_age =function (priv,callback) {
    var self = this,
        stat = Status.STD_UNKNOWN,
        obj = Net.prv_number(priv),
        rights = Net.prv_rights(priv);


    if (obj!=0 || !Net.prv_rights_check(priv, self.afs_super.afs_checkfield, Rights.AFS_RGT_MODIFY)) 
      callback(Status.STD_DENIED);
    else self.age(callback);
};


/**
 ** Restrict file capability
 *
 * @param {private} priv
 * @param {number} mask
 * @param {function((Status.STD_OK|*),(privat|undefined))} callback return status
 */
afs_server_rpc.prototype.afs_restrict =function (priv,mask,callback) {
    var self = this;
    var privres=undefined;
    var stat = Status.STD_UNKNOWN;
    var file = undefined;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    if (obj==0) {
        if (Net.prv_decode(priv, self.afs_super.afs_checkfield) == false) {
            stat= Status.STD_DENIED;
        } else {
            stat=Status.STD_OK;
            privres=Net.prv_encode(obj,mask,self.afs_super.afs_checkfield);
        }
        callback(stat,privres);
    }
    else Sch.ScheduleBlock([
        function () {
            self.acquire_file(obj,function (_stat,_file) {
                stat=_stat;
                file=_file;
            });
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            if (Net.prv_decode(priv, file.ff_random) == false) {
                throw Status.STD_DENIED;
            }
            stat=Status.STD_OK;
            privres=Net.prv_encode(obj,mask,file.ff_random);
            self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
            file=undefined;
            callback(stat,privres);
        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_restrict');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });

};
/** AFS server Insert request.
 **
 ** Args:
 **  server: the server structure
 **  priv:   the request private field
 **  buf:    the write buffer
 **  size:   the requested size (<= file size)   [bytes]
 **  off:    the file offset (<= file size)  [bytes]
 **  commit: the commit flag
 **
 ** Return:
 **  status
 **  newcap      (FF_unlocked -> oldcap)
 *
 * @param {privat} priv
 * @param {buffer|rpcio} buf
 * @param off
 * @param size
 * @param commit
 * @param {function((Status.STD_OK|*),capability|undefined)} callback
 */

afs_server_rpc.prototype.afs_insert_data =function (priv,buf,off,size,commit,callback) {
    var self = this;
    var stat = Status.STD_UNKNOWN;
    var cap=undefined;
    var file;
    var size2,buf2,off2,obj2,file2;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    Sch.ScheduleBlock([
        function () {
            if (obj > 0) {
                self.acquire_file(obj,function (_stat,_file) {
                    stat = _stat;
                    file = _file;
                });
            } else stat=Status.STD_CAPBAD;
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }

            if ((Net.prv_decode(priv, file.ff_random) == false) ||
                (Net.rights_req(rights, [Rights.AFS_RGT_MODIFY]) == false)) {
                throw Status.STD_DENIED;
            }

            if (size == 0 && file.ff_state == Afs_file_state.FF_unlocked) {
                /*
                 ** Only commit the file.
                 */
                stat = self.release_file(file, commit);
                if (stat != Status.STD_OK) {
                    throw stat;
                }
                cap =
                    Net.Capability(self.afs_super.afs_putport,
                        Net.prv_encode(obj, Rights.PRV_ALL_RIGHTS, file.ff_random));
                stat = Status.STD_OK;
            } else if (size == 0 && (file.ff_state == Afs_file_state.FF_locked ||
                file.ff_state == Afs_file_state.FF_commit)) {
                /*
                 ** Only unlocked files can be committed!
                 ** Or must we create a copy here?
                 */
                self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
                stat=Status.STD_ARGBAD;
            } else {
                /*
                 ** The file exists, and the request is authorized.
                 */
                if (file.ff_state == Afs_file_state.FF_unlocked) {
                    /*
                     ** Modify existing file.
                     */
                    /*
                     ** New data beyond the current file size ?
                     */

                    if (file.ff_size < (off+size))
                        stat=self.modify_size(file,off+size);
                    else stat=Status.STD_OK;
                    if (stat != Status.STD_OK) {
                        self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
                        throw stat;
                    }
                    cap =
                        Net.Capability(self.afs_super.afs_putport,
                            Net.prv_encode(obj, Rights.PRV_ALL_RIGHTS, file.ff_random));
                    if ((off+size) < file.ff_size) {
                        /*
                         ** The data should be inserted in the middle
                         ** or at the beginning of the file. Therefore, we must
                         ** shift the data between this offset (off) and
                         ** (off+size) to create the needed space.
                         */
                        buf2 = Buf.Buffer(self.afs_super.afs_block_size);
                        size2 = Perv.min(self.afs_super.afs_block_size,size);
                        off2  = (file.ff_size - size2);

                        /*
                         ** Start at the current end of the file position and
                         ** work down to the specified insert offset (off).
                         */

                        while ( off2 >= (off+size)) {
                            /*
                             ** First the chunk to read
                             */
                            stat = self.read_file(file, off2, size2, buf2);

                            if (stat != Status.STD_OK) {
                                self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
                                throw stat;
                            }
                            /*
                             ** Now write the buffer to the shifted
                             ** position.
                             */

                            stat = self.modify_file(file, (off2 + size), size2, buf2);

                            if (stat != Status.STD_OK) {
                                self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
                                throw stat;
                            }

                            size2 = Perv.min((off2 - off), self.afs_super.afs_block_size);
                            off2 = Perv.max((off2 - size2), off);
                        }
                    }
                    /*
                     ** Now write the data to be inserted.
                     */
                    stat=self.modify_file(file,off,size,buf);
                    if (stat != Status.STD_OK) {
                        throw stat;
                    }
                    stat=self.release_file(file,commit);
                    file=undefined;
                    if (stat != Status.STD_OK) {
                        throw stat;
                    }

                } else {
                    /*
                     ** Create a new file, copy the content of the
                     ** original one, but shift the part from (off)
                     ** to (off+size).
                     */
                    obj2 = self.get_freeobjnum();
                    size2 = file.ff_size< (off+size)?(off+size):file.ff_size;
                    file2 = Afs.Afs_file(obj2,Net.uniqport(),size2,self.time(),Afs.AFS_MAXLIVE,
                        Afs_file_state.FF_unlocked,Afs.Disk(),true);
                    // Non-blocking, we're the first one accessng this file
                    file2.lock();
                    stat= self.create_file_inode(file2,false);
                    if (stat != Status.STD_OK) {
                        file2.unlock();
                        throw stat;
                    }
                    cap =
                        Net.Capability(self.afs_super.afs_putport,
                            Net.prv_encode(obj2, Rights.PRV_ALL_RIGHTS, file2.ff_random));
                    /*
                     ** Copy the original data
                     */
                    buf2 = Buf.Buffer(self.afs_super.afs_block_size);


                    var co  = 0;
                    var cs  = Perv.min(off,self.afs_super.afs_block_size);
                    /*
                     ** First the part up to the off position.
                     ** (Not shifted).
                     */
                    while (cs>0) {
                        /*
                         ** First the chunk to read
                         */

                        stat =self.read_file(file,co,cs,buf2);

                        if (stat != Status.STD_OK) {
                            file2.unlock();
                            throw stat;
                        }
                        /*
                         ** Now write the buffer
                         */

                        stat = self.modify_file(file2,co,cs,buf2);
                        if (stat != Status.STD_OK) {
                            file2.unlock();
                            throw stat;
                        }


                        co = co + cs;
                        cs = Perv.min((off - co),self.afs_super.afs_block_size);
                    }
                    /*
                     ** Now the shifted part up to the end of the file.
                     */
                    cs = Perv.min((file.ff_size - co), self.afs_super.afs_block_size);

                    while (cs > 0) {

                        /*
                         ** First the chunk to read
                         */

                        stat = self.read_file(file, co, cs, buf2);

                        if (stat != Status.STD_OK) {
                            file2.unlock();
                            throw stat;
                        }
                        /*
                         ** Now write the buffer to the shifted position.
                         */

                        stat = self.modify_file(file2, (co + off + size), cs, buf2);

                        if (stat != Status.STD_OK) {
                            file2.unlock();
                            throw stat;
                        }

                        co = co + cs;
                        cs = Perv.min((file.ff_size - co), self.afs_super.afs_block_size);
                    }
                    /*
                     ** Now write the data to be inserted.
                     */
                    stat = self.modify_file(file2,off,size,buf);
                    if (stat != Status.STD_OK) {
                        file2.unlock();
                        throw stat;
                    }

                    stat = self.release_file(file2,commit);
                    if (stat != Status.STD_OK) {
                        throw stat;
                    }
                    self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
                    file=undefined;
                }
            }
            callback(stat, cap);

        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_insert_data');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

/** AFS server Delete (part of the file data) request.
 *
 * Args:
 *  server: the server structure
 *  priv:   the request private field
 *  size:   the requested size (<= file size)   [bytes]
 *  off:    the file offset (<= file size)  [bytes]
 *  commit: the commit flag
 *
 * Return:
 *  status
 *  newcap      (FF_unlocked -> oldcap)
 *
 * @param {privat} priv
 * @param off
 * @param size
 * @param commit
 * @param {function((Status.STD_OK|*),capability|undefined)} callback
 */
afs_server_rpc.prototype.afs_delete_data =function (priv,off,size,commit,callback) {
    var self = this;
    var stat = Status.STD_UNKNOWN;
    var file=undefined;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    var cap;
    var off2,size2,buf2,obj2,file2;
    Sch.ScheduleBlock([
        function () {
            if (obj > 0) {
                self.acquire_file(obj,function (_stat,_file) {
                    stat = _stat;
                    file = _file;
                });
            } else
                stat=Status.STD_CAPBAD;
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            if ((Net.prv_decode(priv, file.ff_random) == false) ||
                (Net.rights_req(rights,[Rights.AFS_RGT_MODIFY])== false)) {
                throw Status.STD_DENIED;
            }
            if (file.ff_state == Afs_file_state.FF_unlocked) {
                cap=
                    Net.Capability(self.afs_super.afs_putport,
                        Net.prv_encode(obj,Rights.PRV_ALL_RIGHTS,file.ff_random));
                buf2=Buf.Buffer(self.afs_super.afs_block_size);
                size2 = Perv.min(file.ff_size - off + size, self.afs_super.afs_block_size);
                off2  = (off+size);

                while (off2 < file.ff_size) {
                    /*
                     ** First the chunk to read
                     */
                    stat = self.read_file(file, off2, size2, buf2);

                    if (stat != Status.STD_OK) {
                        throw stat;
                    }
                    /*
                     ** Now write the buffer to the shifted
                     ** position.
                     */

                    stat = self.modify_file(file, (off2 - size), size2, buf2);

                    if (stat != Status.STD_OK) {
                        throw stat;
                    }
                    off2 = off2 + size2;
                    size2 = Perv.min(file.ff_size - off2, self.afs_super.afs_block_size);
                }
                /*
                 ** Adjust the new size.
                 */

                self.modify_size(file,(file.ff_size - size));
                stat = self.release_file(file,commit);
                file=undefined;
                if (stat != Status.STD_OK) {
                    throw stat;
                }
            } else {
                /*
                 ** Create a new file, copy the content of the
                 ** original one, but shift the part from (off+size)
                 ** to (off).
                 */
                /*
                 ** First get a new i-node==object number
                 */
                obj2=self.get_freeobjnum();
                size2 = file.ff_size - size;
                file2 = Afs.Afs_file(obj2,Net.uniqport(),size2,self.time(),Afs.AFS_MAXLIVE,
                    Afs_file_state.FF_unlocked,Afs.Disk(),true);
                file2.lock();
                stat = self.create_file_inode(file2,false);
                if (stat != Status.STD_OK) {
                    file2.unlock();
                    throw stat;
                }
                cap=
                    Net.Capability(self.afs_super.afs_putport,
                        Net.prv_encode(obj2,Rights.PRV_ALL_RIGHTS,file2.ff_random));
                /*
                 ** Copy the original data
                 */
                buf2 = Buf.Buffer(self.afs_super.afs_block_size);

                var co  = 0;
                var cs  = Perv.min(off,self.afs_super.afs_block_size);
                /*
                 ** First the part up to the off position.
                 ** (Not shifted).
                 */
                while (cs>0) {
                    /*
                     ** First the chunk to read
                     */

                    stat = self.read_file(file,co,cs,buf2);

                    if (stat != Status.STD_OK) {
                        file2.unlock();
                        throw stat;
                    }
                    /*
                     ** Now write the buffer
                     */

                    stat = self.modify_file(file2,co,cs,buf2);
                    if (stat != Status.STD_OK) {
                        file2.unlock();
                        throw stat;
                    }
                    co = co + cs;
                    cs = Perv.min((off - co),self.afs_super.afs_block_size);
                }
                /*
                 ** Now the shifted part up to the end of the file.
                 */
                cs = Perv.min((file2.ff_size - co), self.afs_super.afs_block_size);

                while (co < file2.ff_size) {
                    /*
                     ** First the chunk to read
                     */

                    stat = self.read_file(file, (co + size), cs, buf2);
                    if (stat != Status.STD_OK) {
                        file2.unlock();
                        throw stat;
                    }
                    /*
                     ** Now write the buffer to the shifted position.
                     */

                    stat = self.modify_file(file2, co, cs, buf2);

                    if (stat != Status.STD_OK) {
                        file2.unlock();
                        throw stat;
                    }
                    co = co + cs;
                    cs = Perv.min((file2.ff_size - co), self.afs_super.afs_block_size);
                }
                stat = self.release_file(file2, commit);
                if (stat != Status.STD_OK) {
                    throw stat;
                }
                self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
                file=undefined;
            }
            stat=Status.STD_OK;
            callback(stat,cap);
        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_delete_data');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

/** Destroy a file object.
 *
 * @param {privat} priv
 * @param {function((Status.STD_OK|*))} callback return status
 */
afs_server_rpc.prototype.afs_destroy_file =function (priv,callback) {
    var self = this;
    var stat = Status.STD_UNKNOWN;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    var file;
    Sch.ScheduleBlock([
        function () {
            if (obj > 0) {
                self.acquire_file(obj,function (_stat,_file) {
                    stat = _stat;
                    file = _file;
                });
            } else
                stat=Status.STD_CAPBAD;
        },
        function () {
            if ((Net.prv_decode(priv, file.ff_random) == false) ||
                (Net.rights_req(rights,[Rights.AFS_RGT_DESTROY])== false)) {
                throw Status.STD_DENIED;
            }
            if (file.ff_state == Afs_file_state.FF_unlocked) {

                stat = self.delete_file_inode(file);
                if (stat != Status.STD_OK) {
                    throw stat;
                }
                stat = Status.STD_OK;
            } else {
                stat = self.delete_file_inode(file);
                if (stat != Status.STD_OK) {
                    throw stat;
                }
                self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
                file=undefined;
                stat = Status.STD_OK;
            }
            callback(stat);
        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_destroy_file');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    });
};

/** AFS Info Request
 *
 * @param {privat} priv
 * @param {function((Status.STD_OK|*),string)} callback return status,info
 */
afs_server_rpc.prototype.afs_info =function (priv,callback) {
    var self=this;
    var stat;
    var file;
    var info='';
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    Sch.ScheduleBlock([
        function () {
            if (obj > 0) {
                self.acquire_file(obj,function (_stat,_file) {
                    stat = _stat;
                    file = _file;
                });
            } else {
                file=undefined;
                stat=Status.STD_OK;
            }
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            if (file!=undefined) {
                if ((Net.prv_decode(priv, file.ff_random) == false)) {
                    throw Status.STD_DENIED;
                }
                info = '- '+file.ff_size+' bytes';
                self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
                file=undefined;
                stat = Status.STD_OK;
            } else {
                /*
                 ** Super capability
                 */
                if ((Net.prv_decode(priv, self.afs_super.afs_checkfield) == false)) {
                    throw Status.STD_DENIED;
                }
                info='Atomic Filesystem Server';
                stat=Status.STD_OK;
            }
            callback(stat,info)
        }
    ],function (e) {
        if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
        if (typeof e != 'number') {Io.printstack(e,'Afs_server_rpc.afs_info');}
        if (typeof e == 'number') callback(e,''); else callback(Status.STD_SYSERR,'');
    });
};

/** AFS Exit Request
 * @param {privat} [priv]
 *
 * @returns {(Status.STD_OK|*)}
 */
afs_server_rpc.prototype.afs_exit =function (priv) {
    var self=this;
    var stat=Status.STD_OK;
    if (priv!=undefined) {
        var obj = Net.prv_number(priv);
        var rights = Net.prv_rights(priv);
        if (obj!=0 || !Net.prv_decode(priv,self.afs_super.afs_checkfield)) return Status.STD_DENIED;
    }
    Io.out('[AFS] Writing live table...');
    stat=self.live_write();
    return stat;
};

/** AFS Synchronize Request
 *
 * @returns {Status.STD_OK|*}
 */
afs_server_rpc.prototype.afs_sync =function () {
    var self=this;
    var stat,stat1,stat2;
    Io.out('[AFS] Syncing discs...');
    self.afs_super.lock();
    self.inode_cache_entry.fse_state = Afs_file_state.FF_locked;
    stat1=self.cache_inode.cache_sync();
    stat2=self.cache_data.cache_sync();
    self.inode_cache_entry.fse_state = Afs_file_state.FF_unlocked;
    Io.out('[AFS] Compacting freelist...');
    self.freeblocks.free_compact();
    /*
     ** Synchronize disk
     */
    self.disk_sync();
    self.afs_super.unlock();
    if (stat1 != Status.STD_OK) return stat1; else return stat2;

};


/** AFS Status Request
 *
 * @param {privat} [priv]
 * @param {function((Status.STD_OK|*),string)} [callback] return status,info
 * @returns {string}
 */
afs_server_rpc.prototype.afs_stat = function (priv,callback) {
    var self=this;
    var stat;

    function printstat() {
        var block_size = self.afs_super.afs_block_size;
        var str = '';
        var res = self.freeblocks.free_info();
        var holes = res[0];
        var freespace = res[1];
        var holestat = res[2];
        var usedspace = self.afs_super.afs_nblocks - freespace;
        var uncomm = 0;
        var unlock = 0;
        Hashtbl.iter(self.cache_data.fsc_table, function (addr, fse) {
            if (fse.fse_state == Afs_file_state.FF_unlocked) unlock++;
            if (fse.fse_state == Afs_file_state.FF_commit) uncomm++;
        });
        str = str + 'Cache statistics: Inode Cache\n' + self.cache_inode.cache_stat() + '\n';
        str = str + 'Cache statistics: Data Cache\n' + self.cache_data.cache_stat() + '\n';
        str = str + 'File system statistics\n';
        str = str + '  Free:       ' + (freespace * block_size) + ' bytes\n';
        str = str + '  Used:       ' + (usedspace * block_size) + ' bytes\n';
        str = str + '  Files:      ' + (self.afs_super.afs_nused) + '\n';
        str = str + '  Uncommited: ' + (uncomm) + '\n';
        str = str + '  Unlocked:   ' + (unlock) + '\n';
        str = str + 'Server statistics\n';
        str = str + '  Read:       ' + (self.stats.op_read) + '\n';
        str = str + '  Modify:     ' + (self.stats.op_modify) + '\n';
        str = str + '  Create:     ' + (self.stats.op_create) + '\n';
        str = str + '  Touch:      ' + (self.stats.op_touch) + '\n';
        str = str + '  Age:        ' + (self.stats.op_age) + '\n';
        str = str + '  Destroy:    ' + (self.stats.op_destroy) + '\n';
        str = str + 'Free list statistics\n';
        str = str + '  Comp. Thr.: ' + (self.freeblocks.fbs_compacthres) + '\n';
        str = str + '  Holes:      ' + (holes) + '\n';
        for (var i = 0; i < holestat.length; i++) {
            var hole = holestat[i];
            var low, high, count;
            low = hole[0];
            high = hole[1];
            count = hole[2];
            str = str + '  Free holes from ' + (low * block_size) + ' to ' + (high * block_size) + ' bytes: ' + count + '\n';
        }
        self.afs_super.unlock();
        return str;
    }
    if (!self.afs_super.try_lock()) {
        if (callback) {
            callback(Status.STD_NOTNOW,'');
            return '';
        }
        else return '';
    }
    if (priv!=undefined) {
        var obj = Net.prv_number(priv);
        var rights = Net.prv_rights(priv);
        var file;
        Sch.ScheduleBlock([
            function () {
                if (obj > 0) {
                    self.acquire_file(obj,function (_stat,_file) {
                        stat = _stat;
                        file = _file;
                    });
                } else {
                    file=undefined;
                    stat=Status.STD_OK;
                }
            },
            function () {
                if (stat != Status.STD_OK) {
                    throw stat;
                }
                if (file!=undefined) {
                    if ((Net.prv_decode(priv, file.ff_random) == false)) {
                        self.release_file(file, Afs_commit_flag.AFS_UNCOMMIT);
                        throw Status.STD_DENIED;
                    }
                    self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
                    file=undefined;
                } else {
                    if ((Net.prv_decode(priv, self.afs_super.afs_checkfield) == false)) {
                        throw Status.STD_DENIED;
                    }
                }
                callback(stat,printstat());
            }
        ],function (e) {
            if (file!=undefined) self.release_file(file,Afs_commit_flag.AFS_UNCOMMIT);
            if (typeof e == 'number') callback(e,''); else {
                Io.printstack(e,'afs_srv_rpc.afs_stat');
                callback(Status.STD_SYSERR,'');
            }
        });
        return '';
    } else {
        return printstat();
    }
};


/** AFS Start the RPC server
 *
 * @param {number} index
 * @param {taskscheduler} scheduler
 */
afs_server_rpc.prototype.afs_start_server = function (index,scheduler) {
    var afs = this;
    var server = function () {
        // Server
        var self = this;
        var rpc = afs.rpc;
        var port = afs.afs_super.afs_getport;
        var router = rpc.router;
        var rpcio = router.pkt_get();
        var dying=false;

        this.init = function () {
            Io.out('[AFS'+index+'] Starting RPC Server with public port '+Net.Print.port(afs.afs_super.afs_putport));
            router.add_port(port);
        };

        this.request = function () {
            Io.log((log<10)||('[AFS'+index+'] request'));
            rpcio.init();
            rpcio.operation = Rpc.Operation.GETREQ;
            rpcio.header.h_port = port;
            rpcio.header.h_status=undefined;
            rpcio.header.h_command=undefined;
            rpcio.header.h_priv=undefined;
            rpc.getreq(rpcio);
        };

        this.service = function () {
            var ss,sc,stat,info,size,flag,off,buf;
            buf=Buf.Buffer();
            Io.log((log<1)||('[AFS'+index+'] service: '+Net.Print.header(rpcio.header)));
            assert((rpcio.index!=-1) ||'RPCIO invalid');
            switch (rpcio.header.h_command) {
                case Command.AFS_SIZE:
                    /*
                     ** +---
                     *  |===
                     *  | size(int32)
                     *  +---
                     */
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_file_size(rpcio.header.h_priv,function (_stat,_size) {
                                rpcio.header.h_status=_stat;
                                Buf.buf_init(rpcio);
                                Buf.buf_put_int32(rpcio,_size);
                            });
                        }
                    ]);
                    break;
                case Command.AFS_CREATE:
                    /*
                     *  +---
                     *  | off(int32)
                     *  | size(int32)
                     *  | flag(int16)
                     *  | data
                     *  |===
                     *  +---
                     */
                    rpcio.pos=0;
                    off = Buf.buf_get_int32(rpcio);
                    size = Buf.buf_get_int32(rpcio);
                    flag = Buf.buf_get_int16(rpcio);
                    Buf.buf_init(buf);
                    Buf.buf_get_buf(rpcio,buf,0,size);
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_create_file(rpcio.header.h_priv, buf, size, flag, function (_stat, _cap) {
                                if (_stat == Status.STD_OK) Net.Copy.private(_cap.cap_priv, rpcio.header.h_priv);
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;
                case Command.AFS_MODIFY:
                    /*
                     *  +---
                     *  | off(int32)
                     *  | size(int32)
                     *  | flag(int16)
                     *  | data
                     *  |===
                     *  +---
                     */
                    rpcio.pos=0;
                    off = Buf.buf_get_int32(rpcio);
                    size = Buf.buf_get_int32(rpcio);
                    flag = Buf.buf_get_int16(rpcio);
                    Buf.buf_init(buf);
                    Buf.buf_get_buf(rpcio,buf,0,size);
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_modify_file(rpcio.header.h_priv, buf, off, size, flag, function (_stat, _cap) {
                                if (_stat == Status.STD_OK) Net.Copy.private(_cap.cap_priv, rpcio.header.h_priv);
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;
                case Command.AFS_READ:
                    /*
                     ** +---
                     *  | off(int32)
                     *  | size(int32)
                     *  |===
                     *  | size(int32)
                     *  | data
                     *  +---
                     */
                    rpcio.pos=0;
                    off = Buf.buf_get_int32(rpcio);
                    size = Buf.buf_get_int32(rpcio);
                    Io.log((log<1)||('AFS_READ: off='+off+' size='+size));
                    Buf.buf_init(rpcio);
                    Buf.buf_init(buf);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_read_file(rpcio.header.h_priv,buf,off,size,function (_stat,_size) {
                                Buf.buf_put_int32(rpcio,_size);
                                Buf.buf_put_buf(rpcio,buf);
                                rpcio.header.h_status=_stat;
                            });
                        }]);
                    break;
                case Command.AFS_INSERT:
                    /*
                     ** +---
                     *  | off(int32)
                     *  | size(int32)
                     *  | flag(int16)
                     *  | data
                     *  |===
                     *  +---
                     */
                    rpcio.pos=0;
                    off = Buf.buf_get_int32(rpcio);
                    size = Buf.buf_get_int32(rpcio);
                    flag = Buf.buf_get_int16(rpcio);
                    Buf.buf_init(buf);
                    Buf.buf_get_buf(rpcio,buf,0,size);
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_insert_data(rpcio.header.h_priv, buf, off, size, flag, function (_stat, _cap) {
                                if (_stat == Status.STD_OK) Net.Copy.private(_cap.cap_priv, rpcio.header.h_priv);
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;
                case Command.AFS_DELETE:
                    /*
                     ** +---
                     *  | off(int32)
                     *  | size(int32)
                     *  | flag(int16)
                     *  |===
                     *  +---
                     */
                    rpcio.pos=0;
                    off = Buf.buf_get_int32(rpcio);
                    size = Buf.buf_get_int32(rpcio);
                    flag = Buf.buf_get_int16(rpcio);
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_delete_data(rpcio.header.h_priv,off,size,flag,function(_stat,_cap) {
                                if (_stat==Status.STD_OK) Net.Copy.private(_cap.cap_priv,rpcio.header.h_priv);
                                rpcio.header.h_status=sc.stat;
                            });
                        }]);
                    break;
                case Command.AFS_SYNC:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    stat = afs.afs_sync();
                    rpcio.header.h_status=stat;
                    break;
                case Command.STD_DESTROY:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_destroy_file(rpcio.header.h_priv, function (_stat) {
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;
                case Command.STD_INFO:
                    /*
                     ** +---
                     *  |===
                     *  | info(string)
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_info(rpcio.header.h_priv, function (_stat, _info) {
                                rpcio.header.h_status = _stat;
                                if (_stat == Status.STD_OK) Buf.buf_put_string(rpcio, _info);
                            });
                        }]);
                    break;
                case Command.STD_STATUS:
                    /*
                     ** +---
                     *  |===
                     *  | info(string)
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_stat(rpcio.header.h_priv, function (_stat, _info) {
                                rpcio.header.h_status = _stat;
                                if (_stat == Status.STD_OK) Buf.buf_put_string(rpcio, _info);
                            });
                        }]);
                    break;
                case Command.STD_RESTRICT:
                    /*
                     *  ----------
                     *  mask (int16)
                     *  ----------
                     *  priv (privat)
                     *  ----------
                     */
                    var mask = Buf.buf_get_int16(rpcio);
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_restrict(rpcio.header.h_priv, mask, function (_stat, _priv) {
                                rpcio.header.h_status = _stat;
                                if (_stat == Status.STD_OK) Buf.buf_put_priv(rpcio, _priv);
                            });
                         }]);
                    break;

                case Command.STD_TOUCH:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_touch_file(rpcio.header.h_priv, function (_stat) {
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.STD_AGE:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            afs.afs_age(rpcio.header.h_priv, function (_stat) {
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;
                case Command.STD_EXIT:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    stat=afs.afs_exit(rpcio.header.h_priv);
                    rpcio.header.h_status=stat;
                    if (stat==Status.STD_OK) dying=true;
                    break;
                default:
                    rpcio.header.h_status=Status.STD_COMBAD;
                    Buf.buf_init(rpcio);
            }

        };

        this.reply = function () {
            Io.log((log<1)||('[AFS'+index+'] reply: '+Net.Print.header(rpcio.header)));
            rpc.putrep(rpcio);
            assert((rpcio.index!=-1) ||'RPCIO invalid');
        };

        this.onexit = function () {
            // TODO exit context?
        };

        this.transitions = function () {
            var trans;
            trans =
                [
                    [undefined, this.init],
                    [this.init, this.request],
                    [this.request, this.service],
                    [this.service, this.reply],
                    [this.reply, this.request, function (self) {return !dying}],
                    [this.reply, this.onexit, function (self) {return dying}]
                ];
            return trans;
        };
        this.context = Sch.TaskContext('AFS'+index+' '+Net.Print.port(port), self);
    };
    var proc1 = new server();
    scheduler.Add(proc1.context);
};

module.exports = {
    afs_server_rpc:afs_server_rpc
};
