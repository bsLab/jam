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
 **    $CREATED:     7-1-15 by sbosse.
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 **
 * Embedded Virtual Atomic Fileysystem Server
 * Files and i-nodes are stored in memory.
 *
 **
 **    $ENDOFINFO
 */

"use strict";

var log = 0;

var util = Require('util');
var Io = Require('com/io');
var Net = Require('./network');
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
 *
 * @param {rpc} rpc
 * @constructor
 * @typedef {{rpc,afs_super,stats,files:afs_file [],live_table,block:function,to_block:function,of_block:function,
 *            live_set:function,live_get:function,live_read:function,live_write:function}} afs_server_emb~obj
 * @see afs_server_emb~obj
 * @see afs_server_emb~meth
 * @see afs_server_rpc~meth
 */
var afs_server_emb = function (rpc) {
    this.rpc=rpc;
    this.afs_super=Afs.Afs_super();
    /**
     * Statistics
     * @type {{op_touch: number, op_age: number, op_destroy: number, op_read: number, op_modify: number, op_create: number, op_sync: number, op_commit: number}}
     */
    this.stats = {
        op_touch:0,
        op_age:0,
        op_destroy:0,
        op_read:0,
        op_modify:0,
        op_create:0,
        op_sync:0,
        op_commit:0
    };
    /**
     *
     * @type {afs_file []}
     */
    this.files=[];

    this.live_table=[];

    this.block=undefined;
    this.to_block=undefined;
    this.of_block=undefined;

    /*
     ** Exported Live table operations
     */
    this.live_set=function(){};
    this.live_get=function(){};
    this.live_read=function(){};
    this.live_write=function(){};


};
var AfsRpc = Require('dos/afs_srv_rpc');
//afs_server.prototype=new AfsRpc.afs_server_rpc();
afs_server_emb.prototype.afs_create_file=AfsRpc.afs_server_rpc.prototype.afs_create_file;
afs_server_emb.prototype.afs_read_file=AfsRpc.afs_server_rpc.prototype.afs_read_file;
afs_server_emb.prototype.afs_file_size=AfsRpc.afs_server_rpc.prototype.afs_file_size;
afs_server_emb.prototype.afs_touch_file=AfsRpc.afs_server_rpc.prototype.afs_touch_file;
afs_server_emb.prototype.afs_age_file=AfsRpc.afs_server_rpc.prototype.afs_age_file;
afs_server_emb.prototype.afs_insert_data=AfsRpc.afs_server_rpc.prototype.afs_insert_data;
afs_server_emb.prototype.afs_delete_data=AfsRpc.afs_server_rpc.prototype.afs_delete_data;
afs_server_emb.prototype.afs_destroy_file=AfsRpc.afs_server_rpc.prototype.afs_destroy_file;
afs_server_emb.prototype.afs_info=AfsRpc.afs_server_rpc.prototype.afs_info;
afs_server_emb.prototype.afs_exit=AfsRpc.afs_server_rpc.prototype.afs_exit;
afs_server_emb.prototype.afs_stat=AfsRpc.afs_server_rpc.prototype.afs_stat;
afs_server_emb.prototype.afs_create_fs=AfsRpc.afs_server_rpc.prototype.afs_create_fs;
afs_server_emb.prototype.afs_open_fs=AfsRpc.afs_server_rpc.prototype.afs_open_fs;
afs_server_emb.prototype.afs_start_server=AfsRpc.afs_server_rpc.prototype.afs_start_server;

/**
 * @typedef {{
 * read_file:afs_server.read_file,
 * modify_file:afs_server.modify_file,
 * modify_size:afs_server.modify_size,
 * commit_file:afs_server.commit_file,
 * read_inode:afs_server.read_inode,
 * create_inode:afs_server.create_inode,
 * delete_inode:afs_server.delete_inode,
 * modify_inode:afs_server.modify_inode,
 * read_super:afs_server.read_super,
 * age:afs_server.age,
 * touch:afs_server.touch,
 * time:afs_server.time,
 * acquire_file:afs_server.acquire_file,
 * release_file:afs_server.release_file,
 * get_freeobjnum:afs_server.get_freeobjnum,
 * create_fs:afs_server.create_fs,
 * open_fs:afs_server.open_fs
 * }} afs_server_emb~meth
 */

/**
 ** Read a file specified by its object number (index) number.
 ** Physical reads only if not cached already.
 **
 **  off: Logical File offset [bytes]
 **  size: [bytes]#
 *
 * @param {afs_file} file
 * @param {number} off
 * @param {number} size
 * @param {buffer} buf
 * @returns {(Status.STD_OK|*)}
 */
afs_server_emb.prototype.read_file =function (file,off,size,buf) {
    var self = this;
    self.stats.op_read++;
    var disk = file.ff_disk;
    if ((off+size)>= file.ff_size) return Status.STD_ARGBAD;
    Buf.buf_blit(buf,off,disk,off,size);
    return Status.STD_OK;
};

/** Modify data of a file. In the case, the (offset+size)
 ** fragment exceeds the current file size, the file size
 ** must be increased with afs_modify_size first.
 **
 **  off: Logical File offset [bytes]
 **  size: [bytes]
 *
 * @param {afs_file} file
 * @param {number} off in bytes
 * @param {number} size in bytes
 * @param {buffer} buf
 * @returns {(Status.STD_OK|*)}
 */
afs_server_emb.prototype.modify_file =function (file,off,size,buf) {
    var self = this;
    self.stats.op_modify++;
    var disk = file.ff_disk;
    if ((off+size)>= file.ff_size) return Status.STD_ARGBAD;
    Buf.buf_blit(disk,off,buf,off,size);
    return Status.STD_OK;
};

/** Modify size of file.
 * @param {afs_file} file
 * @param {number} newsize in bytes
 * @returns {(Status.STD_OK|*)}
 */
afs_server_emb.prototype.modify_size = function (file,newsize) {
    var self = this;
    var stat=Status.STD_OK;
    self.stats.op_modify++;
    var disk = file.ff_disk;
    if (file.ff_size > newsize) {
        file.ff_size=newsize;
        Buf.buf_shrink(disk,newsize);
    } else if (file.ff_size < newsize) {
        file.ff_size=newsize;
        Buf.buf_expand(disk,newsize);
        if (disk.length != newsize) stat=Status.STD_NOSPACE;
    }
    return stat;
};

/** Commit a file to the disk.
 ** The flag argument specifies the way: immediately
 ** (AFS_SAFETY) or later (AFS_COMMIT) by the cache module if any.
 *
 * @param {afs_file} file
 * @param {(Afs_commit_flag.AFS_UNCOMMIT|*)} flag
 * @returns {(Status.STD_OK|*)}
 */
afs_server_emb.prototype.commit_file =function (file,flag) {
    var self = this;
    var stat;
    self.stats.op_commit++;
    /*
    ** Nothing to do here?
     */
    stat=Status.STD_OK;
    file.ff_state=Afs_file_state.FF_locked;
    return stat;
};

/** Read an i-node
 *
 * @param {number} obj  - i-node number
 * @returns {{stat:(Status.STD_OK|*),file:afs_file}}
 */

afs_server_emb.prototype.read_inode =function (obj) {
    var self=this;
    var file = undefined;
    if (obj < 0 || obj > self.afs_super.afs_nused)
        return {stat:Status.STD_ARGBAD,file:undefined};
    file=self.files[obj];
    if (file==undefined)
        return {stat:Status.STD_NOTFOUND,file:undefined};
    if (file.ff_objnum != obj) {
        Io.out('[AFS] invalid inode number (got '+file.ff_objnum+', expected '+obj);
        throw Status.STD_SYSERR;
    }
    if (file.ff_state != Afs_file_state.FF_invalid) {
        var tf = self.live_get(obj);
        file.ff_live=tf.time;
        file.ff_modified=false;
        return {
            stat: Status.STD_OK,
            file: file
        }
    } else
        return {stat:Status.STD_NOTFOUND,file:undefined}
};

/** Create a new i-node with initial afs_file.
 ** A true final flag indicates that the file size
 ** is final and not initial (afs_req_create with
 ** AFS_COMMIT/SAFETY flag set).
 *
 * @param {afs_file} file
 * @param {boolean} final
 * @returns {(Status.STD_OK|*)}
 */
afs_server_emb.prototype.create_inode = function (file,final) {
    var self = this;
    var stat=Status.STD_OK;
    /*
     ** Be aware: initial file size can be zero!
     */
    var fbsize = file.ff_size==0?self.afs_super.afs_block_size:self.block(file.ff_size);
    self.stats.op_create++;
    self.afs_super.lock();
    file.ff_disk=Buf.Buffer(fbsize);
    self.live_set(file.ff_objnum,Afs.AFS_MAXLIVE,1);
    return stat;
};

/**
 ** Delete an i-node (file); free used disk space, if any.
 *
 * @param {afs_file} file
 * @returns {Status.STD_OK|*}
 */
afs_server_emb.prototype.delete_inode =function (file) {
    var self = this;
    var stat = Status.STD_OK;

    self.stats.op_destroy++;
    self.live_set(file.ff_objnum, 0, 0);
    file.ff_disk=undefined;
    self.afs_super.lock();
    self.afs_super.afs_nused--;
    self.afs_super.unlock();
    return stat;
};

/**
 ** Modify an i-node, for example the ff_live field was changed.
 *
 * @param file
 * @returns {Status.STD_OK|*}
 */
afs_server_emb.prototype.modify_inode =function (file) {
    var self = this;
    var stat = status.STD_OK;
    return stat;
};

/**
 *
 * @returns {{stat: number, super: afs_super}}
 */
afs_server_emb.prototype.read_super =function () {
    var self=this;
    return {stat:Status.STD_OK,super:self.afs_super};
};

/**
 ** Age a file. Return true if i-node is in use, and the new live time.
 *
 * @param {number} obj
 * @returns {*[]}   -- [flag,cur]
 */
afs_server_emb.prototype.age =function (obj) {
    var self=this;
    var cur,flag;
    self.afs_super.lock();
    var lf = self.live_get(obj);
    flag=lf.flag;
    cur=lf.time;
    if (flag==1 && cur>1) {
        cur=cur-1;
        self.stats.op_age++;
        self.live_set(obj,cur,flag);
    } else if (flag==1) {
        cur=0;
        self.stats.op_age++;
        self.live_set(obj,cur,flag);
    }
    self.afs_super.unlock();
    return [flag,cur]
};

afs_server_emb.prototype.touch =function (file) {
    var self=this;
    self.stats.op_touch++;
    self.live_set(file.ff_objnum,Afs.AFS_MAXLIVE,1);
    file.ff_live=Afs.AFS_MAXLIVE;
};


/**
 ** Get the current system time in 10s units
 *
 * @returns {number}
 */
afs_server_emb.prototype.time =function () {
    var self=this;
    return div(Perv.time(),10);
};


/**
 ** Acquire and lock a file with object number 'obj'. A
 ** release_file call must follow this operation. [BLOCKING]
 *
 *
 * @param {number} obj
 * @param {function((Status.STD_OK|*),afs_file|undefined)} callback
 */
afs_server_emb.prototype.acquire_file = function (obj,callback) {
    var self=this;
    var file=undefined;
    var stat=Status.STD_OK;
    Sch.ScheduleBlock([
        function () {self.afs_super.lock();},
        function () {
            if (obj>self.afs_super.afs_nfiles) {
                self.afs_super.unlock();
                throw Status.STD_ARGBAD;
            } else {
                var sf = self.read_inode(obj);
                stat=sf.stat;
                if (sf.stat==Status.STD_OK && sf.file.ff_state!=Afs_file_state.FF_invalid) {
                    file=sf.file;
                    file.lock();
                } else stat=Status.STD_NOTFOUND;
            }
        },
        function () {
            self.afs_super.unlock();
            callback(stat,file);
        }
    ],function (e) {
        callback(e,undefined);
    });
};

/**
 ** Release an acquired file.
 ** Commit the file with specified flag argument -
 ** the way to commit the file. A zero value shows no
 ** modifications.
 *
 *
 * @param {afs_file} file
 * @param {(Afs_commit_flag.AFS_UNCOMMIT|*)} flag
 * @returns {(Status.STD_OK|*)}
 */
afs_server_emb.prototype.release_file =function (file,flag) {
    var self=this;
    var stat=Status.STD_OK;
    try {
        if (file==undefined) throw Status.STD_SYSERR;
        if ((flag & (Afs_commit_flag.AFS_COMMIT | Afs_commit_flag.AFS_SAFETY)) != 0) {
            file.ff_state=((flag & Afs_commit_flag.AFS_SAFETY) == Afs_commit_flag.AFS_SAFETY)?
                Afs_file_state.FF_locked:Afs_file_state.FF_commit;
            file.ff_modified=true;
            /*
             ** Commit the file.
             */
            stat=self.commit_file(file,flag);
            if (stat != Status.STD_OK) {
                file.unlock();
                throw stat;
            }
        }
        if (file.ff_modified) stat=self.modify_inode(file);
        file.unlock();
        return stat;
    } catch(e) {
        if (typeof e == 'number') return e;
        throw Error(e);
    }
};

/**
 ** Return a free object number of the AFS table (index).
 ** Note: protect this function with the server lock until
 ** the file creation is finished.
 *
 *
 * @returns {number}
 */
afs_server_emb.prototype.get_freeobjnum = function () {
    var self = this;
    /*
     ** First check the free objnums list. If empty, use nextfree at the
     ** end of the directory table.
     */
    self.afs_super.afs_nused = self.afs_super.afs_nused + 1;
    var next;
    Array.match(self.afs_super.afs_freeobjnums, function (hd, tl) {
        self.afs_super.afs_freeobjnums = tl;
        next = hd;
    }, function () {
        var objnum = self.afs_super.afs_nextfree;

        if (objnum + 1 == self.afs_super.afs_nfiles)
            Perv.failwith('AFS: TODO: out of file table slots');

        self.afs_super.afs_nextfree = objnum + 1;
        next = objnum;
    });
    return next;

};

/**
 * Create a new file system
 *
 * @param {string} label
 * @param {number} ninodes
 * @param {number} blocksize
 * @param {number} nblocks
 * @param {string} part_inode
 * @param {string} part_data
 * @param {boolean} overwrite
 * @returns {(Status.STD_OK|*)}
 */

afs_server_emb.prototype.create_fs = function (label,ninodes,blocksize,nblocks,part_inode,part_data,overwrite) {
    var i, n;
    var stat=Status.STD_OK;
    Io.out('[AFS] Creating Atomic filesystem...');
    Io.out('[AFS] Blocksize: ' + blocksize + ' [bytes]');
    Io.out('[AFS] Number of total blocks: ' + nblocks);
    Io.out('[AFS] Number of total inodes: ' + ninodes);


    /*
     ** First create a server port and derive the public port.
     */
    var priv_port = Net.uniqport();
    var pub_port = Net.prv2pub(priv_port);
    var checkfield = Net.uniqport();
    Io.out('[AFS] Private Port: ' + Net.Print.port(priv_port));
    Io.out('[AFS] Public Port: ' + Net.Print.port(pub_port));
    Io.out('[AFS] Checkfield: ' + Net.Print.port(checkfield));
    Io.out('[AFS] Writing live table... ');

    /*
     ** The lifetime table. It's a fixed size bit-field table build with
     ** a string of sufficient size.
     **
     ** Assumption: Maximal Live time value < 128, therefore
     **             7 bit are used for each object. The MSB is
     **             the used flag (=1 -> inode used).
     **
     ** The first entry (obj=0) is used for the lock status
     ** of the live table.
     */
    var live_size = ninodes+1;
    var live_table = Buf.Buffer();
    var live_off = Afs.DEF_BLOCK_SIZE + (ninodes*Afs.DEF_INODE_SIZE);

    function live_set (obj,time,flag) {
        Buf.buf_set(live_table, obj, ((time & 0x7f) | ((flag << 7) & 0x80)));
    }
    function live_write () {
        /*
         ** Unlock the live table
         */
        live_set(0,0,1);
    }
    for(i=0;i<=ninodes;i++) {
        live_set(i,Afs.AFS_MAXLIVE,0);
    }
    live_write();

    Buf.buf_pad(live_table,live_size);
    this.afs_super=Afs.Afs_super(label,ninodes,0,[],0,priv_port,pub_port,checkfield,blocksize,nblocks);

    return stat;
};

/**
 ** Open the file system (two partitions, UNIX files)
 **
 **  part_inode:     Partition A path and name
 **  part_data:     Partition B path and name
 **  cache:      Cache parameters
 **
 **
 **
 *
 * @param {string} part_inode
 * @param {string}  part_data
 * @param cache_params
 * @returns {(Status.STD_OK|*)}
 */

afs_server_emb.prototype.open_fs = function (part_inode,part_data,cache_params) {
    var self = this;
    var stat = Status.STD_OK;
    var n, i, j, pos;

    self.afs_super.afs_freeobjnums = [];

    Io.out('[AFS] Opening Atomic filesystem...');
    Io.out('  AFS: Label = "' + self.afs_super.afs_name + '"');
    Io.out('  AFS: Maximal number of files (inodes) = ' + self.afs_super.afs_nfiles);
    Io.out('  AFS: Blocksize = ' + self.afs_super.afs_block_size + ' bytes');
    Io.out('  AFS: Total number of blocks = ' + self.afs_super.afs_nblocks);
    Io.out('  AFS: Filesystem size = ' + (self.afs_super.afs_nblocks * self.afs_super.afs_block_size) +
        ' bytes (' + div(div(self.afs_super.afs_nblocks * self.afs_super.afs_block_size, 1024), 1024) + ' MB)');
    /*
     ** The live time table. It's a fixed size bit field table build with
     ** a string of sufficient size.
     **
     ** Assumption: Maximal Live time value < 128, therefore
     **             7 bit are used for each object. The MSB is
     **             the used flag (=1 -> inode used).
     **
     ** The first entry (obj=0) is used for the lock status
     ** of the live table.
     */
    var ninodes = self.afs_super.afs_nfiles;
    var live_size = self.afs_super.afs_nfiles;
    var live_table = Buf.Buffer();
    var live_off = Afs.DEF_BLOCK_SIZE + (ninodes * Afs.DEF_INODE_SIZE);

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

    function live_read() {
        var live = live_get(0);
        if (live.time == 0 && live.flag == 1) {
            /*
             ** Now lock the live table. After a server crash,
             ** the restarted server will found the lock and must
             ** discard the live table. All server objects got
             ** the maximal live time!
             */
            live_set(0, 1, 1);
            return Status.STD_OK;
        } else return Status.STD_ARGBAD;
    }

    function live_write() {
        /*
         ** Unlock the live table
         */
        live_set(0, 0, 1);
        return Status.STD_OK;
    }

    self.live_set = live_set;
    self.live_get = live_get;
    self.live_read = live_read;
    self.live_write = live_write;

    /*
     ** Read the live table
     */
    Io.out('[AFS] Reading the live time table...');
    stat = live_read();
    if (stat == Status.STD_ARGBAD) {
        Io.out('[AFS] found locked live table: Reinitialize...');
        for (i = 0; i < ninodes - 1; i++) {
            live_set(i, Afs.AFS_MAXLIVE, 0);
        }
    } else if (stat == Status.STD_IOERR) {
        Io.out('[AFS] IO Error.');
        Io.close(self.part_fd_A);
        Io.close(self.part_fd_B);
        throw Status.STD_IOERR;
    }
    Io.out('[AFS] Ok.');

    /*
     ** Round up the value x to block_size
     */

    function block(x) {
        return Afs.ceil_block_bytes(x, self.afs_super.afs_block_size);
    }

    function to_block(x) {
        return div(x, self.afs_super.afs_block_size);
    }

    function of_block(x) {
        return (x * self.afs_super.afs_block_size);
    }

    self.block = block;
    self.to_block = to_block;
    self.of_block = of_block;

    var freeino = [];
    var firstfree = (-1);
    var nextfree = (-1);
    var nused = 0;
    var bused = 0;

    for (i = 1; i < self.afs_super.afs_nfiles; i++) {
        var file = self.files[i];
        if (file==undefined) continue;
        if (nextfree != -1 && nextfree != (i - 1)) {
            for (j = firstfree; j <= nextfree; j++) {
                freeino.push(j);
            }
            firstfree = i;
            nextfree = i;
        } else {

            nextfree = i;
            if (firstfree == -1) {
                firstfree = i;
            }
        }
        if (file.ff_state != Afs_file_state.FF_locked) {
            live_set(i, 0, 0);
            if (file.ff_state == Afs_file_state.FF_unlocked ||
                file.ff_state == Afs_file_state.FF_commit) {
                Io.out('[AFS] Unlocked/uncommitted file found. Destroy it: #' + file.ff_objnum+' size='+file.ff_size);
                file.ff_state= Afs_file_state.FF_invalid;
                file.ff_disk=undefined;
                file.ff_size=0;
            }
        } else {
            var tf = live_get(i);
            live_set(i, tf.time, 1);
            nused++;
            bused=bused+self.block(file.ff_size);
        }
    }
    if (nextfree != -1 && nextfree < (self.afs_super.afs_nfiles - 1)) {

        /*
         ** There are only used i-nodes at the end of the i-node table.
         */
        for (j = firstfree; j <= nextfree; j++) {
            freeino.push(j);
        }
        nextfree = -1;
    } else if (firstfree == 0 && nextfree == (self.afs_super.afs_nfiles - 1)) {

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

    Io.out('[AFS] Found ' + usedn + ' valid file(s)');


    self.afs_super.afs_nused = nused;
    self.afs_super.afs_freeobjnums = freeino;
    self.afs_super.afs_nextfree = nextfree;

    Io.out('[AFS] Found ' + self.afs_super.afs_nused + ' used Inode(s)');
    Io.out('[AFS] Total used space: ' + (bused * self.afs_super.afs_block_size) +
            ' bytes (' + div(div(bused * self.afs_super.afs_block_size, 1024), 1024) + ' MB)');

    return stat;
};

module.exports = {

    /**
     *
     * @param {rpcint} rpc
     * @returns {afs_server_emb}
     */
    Server: function(rpc) {
        var obj = new afs_server_emb(rpc);
        Object.preventExtensions(obj);
        return obj;
    }
};
