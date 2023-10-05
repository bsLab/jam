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
 **    $CREATED:     24-4-15 by sbosse.
 **    $VERSION:     1.2.3
 **
 **    $INFO:
 **
 **  DOS: The main module of the Atomic Filesystem Server
 **
 ** Host File System version (i-node and data partition stored in generic files).
 **
 ** Disk layout
 **
 **  I-node table Partition:
 **
 **  -------------------------
 **  512 bytes:
 **      32 bytes    : magic header
 **      480 bytes   : super structure
 **  -------------------------
 **  I-node Table
 **
 **  -------------------------
 **  Live time table
 **  -------------------------
 **
 **    $ENDOFINFO
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


/** AFS SERVER Object
 *
 * @param {rpcint} rpc
 * @constructor
 * @typedef {{
 * rpc:rpcint,
 * afs_super:afs_super,
 * stats,
 * readonly:bool,
 * part_fd_A,
 * part_fd_B,
 * cache_inode,
 * cache_data,
 * inode_cache_entry,
 * block:function,
 * to_block:function,
 * of_block:function,
 * freeblocks,
 * live_set:function,
 * live_get:function,
 * live_read:function,
 * live_write:function,
 * disk_sync:function,
 * read_inode:function,
 * write_inode:function,
 * read_data:function,
 * write_data:function,
 * sync_write_mode:bool,
 * iocache_bypass:bool
 * cache_bypass:bool,
 * }} afs_server~obj
 * @see afs_server~obj
 * @see afs_server~meth
 * @see afs_server_rpc~meth
 */
var afs_server = function (rpc,options) {
    this.rpc=rpc;
    this.verbose=options.verbose||0;
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
    /*
    ** Either the filesystem is read only or we have an
    ** inconsistent filesystem. In that case, only read
    ** request are allowed.
    */
    this.readonly=false;

    this.part_fd_A=undefined;
    this.part_fd_B=undefined;

    this.cache_inode = undefined;
    this.cache_data = undefined;
    this.inode_cache_entry = undefined;

    this.block=undefined;
    this.to_block=undefined;
    this.of_block=undefined;
    this.freeblocks=undefined;
    this.obj_of_daddr=[];

    /*
    ** Exported Live table operations
     */
    this.live_set=function(){};
    this.live_get=function(){};
    this.live_read=function(){};
    this.live_write=function(){};

    this.disk_sync=function(){};

    this.read_inode=function (){};
    this.write_inode=function (){};
    this.sync_inode=function (){};
    this.read_data=function (){};
    this.write_data=function (){};
    this.sync_data=function (){};

    /*
    ** IO settings
     */
    this.sync_write_mode=false;
    this.iocache_bypass=false;
    /*
    ** Cache Module Settings
     */
    this.cache_bypass=false;
};

var AfsRpc = Require('dos/afs_srv_rpc');
//afs_server.prototype=new AfsRpc.afs_server_rpc();
afs_server.prototype.afs_create_file=AfsRpc.afs_server_rpc.prototype.afs_create_file;
afs_server.prototype.afs_modify_file=AfsRpc.afs_server_rpc.prototype.afs_modify_file;
afs_server.prototype.afs_read_file=AfsRpc.afs_server_rpc.prototype.afs_read_file;
afs_server.prototype.afs_file_size=AfsRpc.afs_server_rpc.prototype.afs_file_size;
afs_server.prototype.afs_touch_file=AfsRpc.afs_server_rpc.prototype.afs_touch_file;
afs_server.prototype.afs_age=AfsRpc.afs_server_rpc.prototype.afs_age;
afs_server.prototype.afs_restrict=AfsRpc.afs_server_rpc.prototype.afs_restrict;
afs_server.prototype.afs_insert_data=AfsRpc.afs_server_rpc.prototype.afs_insert_data;
afs_server.prototype.afs_delete_data=AfsRpc.afs_server_rpc.prototype.afs_delete_data;
afs_server.prototype.afs_destroy_file=AfsRpc.afs_server_rpc.prototype.afs_destroy_file;
afs_server.prototype.afs_info=AfsRpc.afs_server_rpc.prototype.afs_info;
afs_server.prototype.afs_exit=AfsRpc.afs_server_rpc.prototype.afs_exit;
afs_server.prototype.afs_stat=AfsRpc.afs_server_rpc.prototype.afs_stat;
afs_server.prototype.afs_start_server=AfsRpc.afs_server_rpc.prototype.afs_start_server;

/**
 * @typedef {{
 * read_file:afs_server.read_file,
 * modify_file:afs_server.modify_file,
 * modify_size:afs_server.modify_size,
 * commit_file:afs_server.commit_file,
 * read_file_inode:afs_server.read_file_inode,
 * create_file_inode:afs_server.create_file_inode,
 * delete_file_inode:afs_server.delete_file_inode,
 * modify_file_inode:afs_server.modify_file_inode,
 * read_super:afs_server.read_super,
 * age:afs_server.age,
 * touch:afs_server.touch,
 * time:afs_server.time,
 * acquire_file:afs_server.acquire_file,
 * release_file:afs_server.release_file,
 * get_freeobjnum:afs_server.get_freeobjnum,
 * create_fs:afs_server.create_fs,
 * open_fs:afs_server.open_fs
 * }} afs_server~meth
 */


/*
 ** The create, read, modify and utility functions needed
 ** for the Afs_server module.
 **
 ** Types:
 **     file: afs_file  handle
 ** Units:
 **
 **      off:  bytes
 **      size: bytes
 **
 **
 ** Remember that the cache objects
 ** (i-nodes and data) are associated with the physical disk address
 ** and belongs to ONE cache object (i-node_fse)!
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
afs_server.prototype.read_file =function (file,off,size,buf) {
    var self = this;
    self.stats.op_read++;
    var disk = file.ff_disk;
    var res = self.cache_data.cache_lookup(file.ff_objnum, disk.disk_addr, file.ff_size, file.ff_state);
    var fse = res.fse;
    /*
     ** Now read the data through the cache
     */
    var stat = self.cache_data.cache_read(fse,buf,off,size);
    self.cache_data.cache_release(fse);
    return stat;
};

/** Modify data of a file. In the case, the (offset+size)
 ** fragment exceeds the current file size, the file size
 ** must be increased with afs_modify_size first.
 **
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
afs_server.prototype.modify_file =function (file,off,size,buf) {
    var self = this;
    self.stats.op_modify++;
    var disk = file.ff_disk;
    var res = self.cache_data.cache_lookup(file.ff_objnum, disk.disk_addr, file.ff_size, file.ff_state);
    var found = res.stat == Status.STD_OK;
    var fse = res.fse;
    if (found) {
        /*
         ** Now modify the data through the cache
         */
        var stat = self.cache_data.cache_write(fse,buf,off,size);
        self.cache_data.cache_release(fse);
        return stat;
    } else return Status.STD_NOTFOUND;
};

/** Modify size of file.
 * @param {afs_file} file
 * @param {number} newsize in bytes
 * @returns {(Status.STD_OK|*)}
 */
afs_server.prototype.modify_size = function (file,newsize) {
    var self = this;
    var stat;
    self.stats.op_modify++;
    var disk = file.ff_disk;
    /*
     ** We always try to reserve at least DEF_RES_SIZE bytes
     ** disk space. If new size < reserved size, only return
     ** new size. In the other case, we must reserve another
     ** cluster of size DEF_RES_SIZE.
     **
     **
     ** First look in the free cluster list for a cluster
     ** starting with address (file.ff_disk.disk_addr+
     **                        file.ff_disk.disk_res)
     **
     ** If there is no such cluster or the cluster has insufficient
     ** size with respect to new size, we must allocate a new
     ** cluster and copy the old file to the new position. Worst
     ** case. This must be done in the Afs_server module.
     */
    /*
     ** Keep the cache object consistent.
     */
    var res = self.cache_data.cache_lookup(file.ff_objnum, disk.disk_addr, file.ff_size, file.ff_state);
    var found = res.stat == Status.STD_OK;
    var fse = res.fse;
    if (found && disk.disk_res >= newsize) {
        /*
         ** Nothing to do.
         */

        file.ff_size = newsize;
        fse.fse_disk_size = newsize;
        file.ff_modified = true;
        self.cache_data.cache_release(fse);
        return Status.STD_OK;
    } else if (found) {
        assert(self.afs_super.try_lock());
        /*
         ** Try to get a new contiguous cluster of size, at least new size, better
         ** DEF_RES_SIZE if greater.
         */
        // TODO Proof extended size computation

        var newsizex = Perv.max(newsize-disk.disk_res,Afs.DEF_RES_SIZE);
        var fdaddr = disk.disk_addr + self.to_block(disk.disk_res);
        var fdsize = self.to_block (newsizex);
        var fb = self.freeblocks.free_append(fdaddr,fdsize);
        if (fb != undefined) {
            /*
             ** Simple. We got a new contiguous chunk of blocks.
             */

            file.ff_size = newsize;
            disk.disk_res = disk.disk_res + newsizex;
            fse.fse_disk_size = newsize;
            file.ff_modified = true;

            self.cache_data.cache_release(fse);
            self.afs_super.unlock();
            return Status.STD_OK;
        } else {
            /*
             ** We can't reserve enough space.
             ** Try it again with the desired size.
             */
            fdsize = self.to_block (self.block (newsize - file.ff_size));
            stat=Status.STD_NOSPACE;
            loop: for(var trial=1;trial<=2;trial++)
            {
                fb = self.freeblocks.free_append(fdaddr, fdsize);
                if (fb != undefined) {
                    /*
                     ** We have got finally a new contiguous chunk of blocks.
                     */
                    file.ff_size = newsize;
                    disk.disk_res = disk.disk_res + self.of_block(fdsize);
                    fse.fse_disk_size = newsize;
                    file.ff_modified = true;

                    self.cache_data.cache_release(fse);
                    self.afs_super.unlock();
                    stat=Status.STD_OK;
                    break loop;
                } else if (trial == 1) {
                    /*
                    ** Try to compact the free cluster list
                     */
                    self.freeblocks.free_compact();
                } else if (trial == 2) {
                    /*
                     ** No way to get the desired free space.
                     */
                    self.cache_data.cache_release(fse);
                    self.afs_super.unlock();
                    Io.warn('[AFC] not enough space, cannot modify size of file #'+file.ff_objnum+
                            ' (new size '+newsize+', current size '+file.ff_size+', reserved disk size '+
                            file.ff_disk.disk_res+')');
                    Io.out(self.freeblocks.print());
                    stat=Status.STD_NOSPACE;
                }
            }
            return stat;
        }
    } else {
        return Status.STD_NOTFOUND;
    }
};

/** Commit a file to the disk.
 ** The flag argument specifies the way: immediately
 ** (AFS_SAFETY) or later (AFS_COMMIT) by the cache module if any.
 *
 * @param {afs_file} file
 * @param {(Afs_commit_flag.AFS_UNCOMMIT|*)} flag
 * @returns {number}
 */
afs_server.prototype.commit_file =function (file,flag) {
    var self = this;
    self.stats.op_commit++;
    var disk = file.ff_disk;
    self.obj_of_daddr = Array.filter(self.obj_of_daddr,function (d_o) {
        return !(d_o[0] == disk.disk_addr);
    });
    /*
     ** First fix the reserved disk cluster and return the
     ** remaining space to the free cluster list.
     */
    assert(self.afs_super.try_lock());
    var dsize = self.to_block(disk.disk_res) -
        self.to_block(self.block(file.ff_size));
    var daddr = disk.disk_addr +
        self.to_block (self.block(file.ff_size));

    disk.disk_res = file.ff_size;

    if (dsize > 0)
        self.freeblocks.free_merge(Flist.Free_block(daddr,dsize,Flist.Cluster_flag.Cluster_FREE));
    self.afs_super.unlock();
    var res = self.cache_data.cache_lookup(file.ff_objnum,disk.disk_addr,disk.disk_res,file.ff_state);
    var found = res.stat == Status.STD_OK;
    var fse = res.fse;
    var stat;
    if (found) {
        /*
         ** Flush the cache only with the AFS_SAFETY flag set.
         */
        if((flag & Afs_commit_flag.AFS_SAFETY) == Afs_commit_flag.AFS_SAFETY) {
            stat=self.cache_data.cache_commit(fse);
        } else stat=Status.STD_OK;
        fse.fse_state = file.ff_state;
        self.cache_data.cache_release(fse);
        return stat;
    }  else
        return Status.STD_NOTFOUND; // Cache timeout!
};

/** Read an i-node
 *
 * @param {number} obj  - i-node number
 * @returns {{stat:(Status.STD_OK|*),file:afs_file}}
 */

afs_server.prototype.read_file_inode =function (obj) {
    var self=this;
    assert(self.inode_cache_entry.try_lock());
    var inodeb = Buf.Buffer();
    var stat = self.cache_inode.cache_read(self.inode_cache_entry,inodeb,Afs.off_of_inode(obj),Afs.DEF_INODE_SIZE);
    if (stat != Status.STD_OK) {
        self.inode_cache_entry.unlock();
        return {stat:stat,file:undefined}
    } else {
        self.inode_cache_entry.unlock();
        var file = Afs.buf_get_ff_inode(inodeb);
        file.ff_disk.disk_ioff=Afs.off_of_inode(obj);
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

    }
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
afs_server.prototype.create_file_inode =function (file,final) {
    var self=this;
    var stat;
    self.stats.op_create++;
    assert(self.afs_super.try_lock());
    assert(self.inode_cache_entry.try_lock());
    /*
    ** Be aware: initial file size can be zero!
    */
    var fbsize = file.ff_size==0?self.afs_super.afs_block_size:self.block(file.ff_size);
    /*
     ** First get a reasonable data cluster with the
     ** initial size of the file.
     */
    var fb;
    loop: for(var trial=1;trial<=2;trial++) {
        if (!final) fb = self.freeblocks.free_new(self.to_block(fbsize));
        else fb = self.freeblocks.free_match(self.to_block(fbsize));
        if (fb==undefined && trial==1) {
            /*
            ** Try a free cluster compaction...
             */
            self.freeblocks.free_compact();
        } else if (fb != undefined) break loop;
    }
    if (fb!=undefined) {
        var faddr = fb.fb_addr;
        self.obj_of_daddr.push([faddr,file.ff_objnum]);
        file.ff_disk.disk_addr=faddr;
        file.ff_disk.disk_ioff=Afs.off_of_inode(file.ff_objnum);
        file.ff_disk.disk_res=fbsize;
        /*
         ** First make sure we have the i-node in the cache (and
         ** all other i-nodes in the cached cluster).
         */
        var inodeb = Buf.Buffer();
        stat=self.cache_inode.cache_read(self.inode_cache_entry,inodeb,Afs.off_of_inode(file.ff_objnum),Afs.DEF_INODE_SIZE);
        if (stat != Status.STD_OK) {
            self.inode_cache_entry.unlock();
            self.afs_super.unlock();
            throw Status.STD_IOERR;
        }
        /*
         ** Overwrite the old content.
         */
        Afs.buf_put_ff_inode(inodeb,file);
        stat = self.cache_inode.cache_write(self.inode_cache_entry,inodeb,file.ff_disk.disk_ioff,Afs.DEF_INODE_SIZE);
        self.live_set(file.ff_objnum,Afs.AFS_MAXLIVE,1);
        self.inode_cache_entry.unlock();
        self.afs_super.unlock();
        /*
         ** Create a cache object for the new file.
         ** Simply done with cache_lookup and an immediately
         ** cache_release.
         */
        var sf = self.cache_data.cache_lookup(file.ff_objnum,file.ff_disk.disk_addr,
                                              file.ff_disk.disk_res,file.ff_state);
        self.cache_data.cache_release(sf.fse);
        return stat;
    } else {
        self.inode_cache_entry.unlock();
        self.afs_super.unlock();
        Io.warn('[AFC] not enough space, cannot create file #'+file.ff_objnum+
                ' (size '+file.ff_size+')');
        Io.out(self.freeblocks.print());
        return Status.STD_NOSPACE;
    }

};

/**
 ** Delete an i-node (file); free used disk space, if any.
 *
 * @param {afs_file} file
 * @returns {Status.STD_OK|*}
 */
afs_server.prototype.delete_file_inode =function (file) {
    var self=this,
        stat;
    assert((file.ff_disk.disk_ioff>0)||('delete_file_inode, invalid disk structure found: '+util.inspect(file)));

    self.stats.op_destroy++;
    self.live_set(file.ff_objnum,0,0);
    var disk = file.ff_disk;

    /*
     ** First transfer the allocated disk space from this file to
     ** the free-cluster list.
     */
    var sf = self.cache_data.cache_lookup(file.ff_objnum,disk.disk_addr,disk.disk_res,file.ff_state);
    assert(self.afs_super.try_lock());
    self.afs_super.afs_nused--;
    var daddr = file.ff_disk.disk_addr;
    var dsize = self.to_block(self.block(file.ff_disk.disk_res));
    self.freeblocks.free_merge(Flist.Free_block(daddr,dsize,Flist.Cluster_flag.Cluster_FREE));
    self.afs_super.unlock();
    self.cache_data.cache_release(sf.fse);
    self.cache_data.cache_delete(sf.fse);
    assert(self.inode_cache_entry.try_lock());
    var inodeb=Buf.Buffer();
    Afs.buf_put_inode(inodeb,Afs.Afs_inode(file.ff_objnum,0,0,0,Afs.Afs_file_state.FF_invalid,0,Net.nilport));
    stat = self.cache_inode.cache_write(self.inode_cache_entry,inodeb,file.ff_disk.disk_ioff,Afs.DEF_INODE_SIZE);
    /*
     ** I-nodes are written always through the cache!
     */
    self.inode_cache_entry.unlock();
    return stat;
 };

/**
 ** Modify an i-node, for example the ff_live field was changed.
 *
 * @param file
 * @returns {Status.STD_OK|*}
 */
afs_server.prototype.modify_file_inode =function (file) {
    var self=this;
    var stat;
    assert((file.ff_disk.disk_ioff>0)||('modify_file_inode, invalid disk structure found: '+util.inspect(file)));
    assert(self.inode_cache_entry.try_lock());
    var inodeb = Buf.Buffer();
    Afs.buf_put_ff_inode(inodeb,file);
    stat = self.cache_inode.cache_write(self.inode_cache_entry,inodeb,file.ff_disk.disk_ioff,Afs.DEF_INODE_SIZE);
    /*
     ** I-nodes are written always through the cache only if the
     ** the file is locked!
     */
    if (stat == Status.STD_OK && (file.ff_state==Afs_file_state.FF_locked ||
                                  file.ff_state==Afs_file_state.FF_commit)) {
        stat=self.cache_inode.cache_commit(self.inode_cache_entry);
        self.inode_cache_entry.unlock();
        return stat;
    } else {
        self.inode_cache_entry.unlock();
        return stat;
    }
};

/**
 *
 * @returns {{stat: number, super: afs_super}}
 */
afs_server.prototype.read_super =function () {
    var self=this;
    return {stat:Status.STD_OK,super:self.afs_super};
};



/**
 ** Age a file. Return true if i-node is in use, and the new live time.
 *
 * @param {number} obj
 * @returns {*[]}   -- [flag,cur]
 */
afs_server.prototype.age_file =function (obj) {
    var self=this,
        cur,flag,
        lf;
    assert(self.afs_super.try_lock());
    lf = self.live_get(obj);
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

/**
 ** Age all files. 
 *
 */
afs_server.prototype.age =function (callback) {
    var self=this,
        sup = this.afs_super,
        file,
        gone=0,
        aged=0,
        i=1,
        lt,
        scavenge=[],
        stat=Status.STD_OK;
    
    if (self.verbose) Io.out('[AFS] Aging ..');
    this.stats.op_age++;
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
          self.acquire_file(scavenge[i],function (_stat,_file) {
              stat=_stat;
              file=_file;
          });
        },
        function () {
          if (stat==Status.STD_OK) {
              gone++;
              stat=self.delete_file_inode(file);
          }
        },
        function () {
          i++;
          if (file!=undefined) 
            self.release_file(file,Afs_commit_flag.AFS_COMMIT);
        }
    ],[
        function () {
            // sup.unlock();
            if (self.verbose) Io.out('[AFS] '+aged+' aged, '+gone+' file(s) deleted.');
            else if (gone) Io.out('[AFS] '+gone+' file(s) deleted.');
            callback(Status.STD_OK);
        }
    ],function(e) {
        // sup.unlock();
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Afs_server.age');
            callback(Status.STD_SYSERR);
        }
    });
  else callback(stat);
};


afs_server.prototype.touch =function (file) {
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
afs_server.prototype.time =function () {
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
afs_server.prototype.acquire_file = function (obj,callback) {
    var self = this;
    var file = undefined;
    var stat = Status.STD_OK;
    /*
     ** Though we have a callback, this function may not be scheduled.
     */
    assert(self.afs_super.try_lock());
    if (obj > self.afs_super.afs_nfiles) {
        stat= Status.STD_ARGBAD;
    } else {
        var sf = self.read_file_inode(obj);
        stat = sf.stat;
        if (sf.stat == Status.STD_OK && sf.file.ff_state != Afs_file_state.FF_invalid) {
            file = sf.file;
            assert(file.try_lock());
        } else stat = Status.STD_NOTFOUND;
    }
    self.afs_super.unlock();
    callback(stat, file);
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
afs_server.prototype.release_file =function (file,flag) {
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
        if (file.ff_modified) stat=self.modify_file_inode(file);
        file.unlock();
        return stat;
    } catch(e) {
        if (typeof e == 'number') return e; else {
            Io.printstack(e,'Afs_srv.release_file');
            return Status.STD_SYSERR;
        }
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
afs_server.prototype.get_freeobjnum = function () {
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

/** Create a new file system
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

afs_server.prototype.create_fs = function (label,ninodes,blocksize,nblocks,part_inode,part_data,overwrite) {
    var self=this;
    function create() {
        var i, n;
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

        var magic1 = Buf.Buffer();
        var magic2 = Buf.Buffer();
        var super1 = Buf.Buffer();
        var empty1 = Buf.Buffer();
        Buf.buf_put_string(magic1, Afs.magic_str1);
        Buf.buf_put_string(magic2, Afs.magic_str2);
        Buf.buf_pad(magic1, Afs.DEF_MAGIC_SIZE, 0xaa);
        Buf.buf_pad(magic2, Afs.DEF_MAGIC_SIZE, 0xaa);

        Buf.buf_put_string(super1, label);
        Buf.buf_pad(super1, 256, 0xaa);
        Buf.buf_put_int32(super1, ninodes);
        Buf.buf_put_int32(super1, blocksize);
        Buf.buf_put_int32(super1, nblocks);
        Buf.buf_put_port(super1, priv_port);
        Buf.buf_put_port(super1, pub_port);
        Buf.buf_put_port(super1, checkfield);


        if (!Io.exists(part_inode)) {
            Io.out('[AFS] Creating inode partition ' + part_inode);
        } else if (overwrite) {
            Io.out('[AFS] Overwriting existing inode partition ' + part_inode);
        } else {
            Io.err('[AFS] Found existing inode partition ' + part_inode);
        }
        var part_fd_A = Io.open(part_inode, (overwrite ? 'w+' : 'r+'));
        if (!Io.exists(part_data)) {
            Io.out('[AFS] Creating data partition ' + part_data);
        } else if (overwrite) {
            Io.out('[AFS] Overwriting existing data partition ' + part_data);
        } else {
            Io.err('[AFS] Found existing data partition ' + part_data);
        }
        var part_fd_B = Io.open(part_data, (overwrite ? 'w+' : 'r+'));
        Io.out('[AFS] Writing partition magic headers... ');

        n = Buf.buf_write(part_fd_A, magic1);
        if (n != Afs.DEF_MAGIC_SIZE) throw Status.STD_IOERR;
        n = Buf.buf_write(part_fd_B, magic2);
        if (n != Afs.DEF_MAGIC_SIZE) throw Status.STD_IOERR;

        Io.out('[AFS] Done. ');
        Io.out('[AFS] Writing super structure... ');

        Buf.buf_pad(super1, Afs.DEF_BLOCK_SIZE - Afs.DEF_MAGIC_SIZE, 0xaa);
        Buf.buf_pad(empty1, Afs.DEF_BLOCK_SIZE - Afs.DEF_MAGIC_SIZE, 0xaa);
        n = Buf.buf_write(part_fd_A, super1);
        if (n != (Afs.DEF_BLOCK_SIZE - Afs.DEF_MAGIC_SIZE)) throw Status.STD_IOERR;
        n = Buf.buf_write(part_fd_B, empty1);
        if (n != (Afs.DEF_BLOCK_SIZE - Afs.DEF_MAGIC_SIZE)) throw Status.STD_IOERR;
        Io.out('[AFS] Done. ');

        /*
         ** Fill up the partitions to their final sizes.
         */
        Io.out('[AFS] Resizing data partition... ');

        var size_B = (Afs.DEF_BLOCK_SIZE + nblocks * blocksize);
        n = Io.write(part_fd_B, ' ', size_B - 1);
        if (n != 1) throw Status.STD_IOERR;

        Io.out('[AFS] Done. ');
        Io.out('[AFS] Writing inodes... ');

        var buf = Buf.Buffer();
        var inode = Afs.Afs_inode(0, 0, 0, 0, Afs_file_state.FF_invalid, 0, Net.nilport);

        for (i = 0; i < ninodes; i++) {
            inode.i_file_num = i;
            Buf.buf_init(buf);
            Afs.buf_put_inode(buf, inode);
            Buf.buf_pad(buf, Afs.DEF_INODE_SIZE);
            n = Buf.buf_write(part_fd_A, buf);
            if (n != Afs.DEF_INODE_SIZE) throw Status.STD_IOERR;
        }

        Io.out('[AFS] Done. ');
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
        var live_size = ninodes + 1;
        var live_table = Buf.Buffer();
        var live_off = Afs.DEF_BLOCK_SIZE + (ninodes * Afs.DEF_INODE_SIZE);

        function live_set(obj, time, flag) {
            Buf.buf_set(live_table, obj, ((time & 0x7f) | ((flag << 7) & 0x80)));
        }

        function live_write() {
            /*
             ** Unlock the live table
             */
            live_set(0, 0, 1);
            n = Buf.buf_write(part_fd_A, live_table, live_off);
            if (n != live_size) throw Status.STD_IOERR;
        }

        for (i = 0; i <= ninodes; i++) {
            live_set(i, Afs.AFS_MAXLIVE, 0);
        }
        Buf.buf_pad(live_table, live_size);
        live_write();

        self.afs_super = Afs.Afs_super(label, ninodes, 0, [], 0, priv_port, pub_port, checkfield, blocksize, nblocks);
        Io.close(part_fd_A);
        Io.close(part_fd_B);
        return Status.STD_OK;
    }
    try {
        return create();
    } catch (e) {
        if (typeof e == 'number') return e; else {
            Io.printstack(e,'Afs_srv.create_fs');
            return Status.STD_SYSERR;
        }
    }
};

/** Open the file system (two partitions, UNIX files)
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

afs_server.prototype.open_fs = function (part_inode,part_data,cache_params) {
    var self=this;
    function open() {
        var n, stat, i, j, pos;

        self.afs_super.afs_freeobjnums = [];

        Io.out('[AFS] Opening Atomic filesystem...');
        if (Io.exists(part_inode)) {
            Io.out('[AFS] Using inode partition ' + part_inode);
        } else {
            Io.out('[AFS] No existing inode partition ' + part_inode);
            throw Status.STD_IOERR;
        }
        self.part_fd_A = Io.open(part_inode, (self.iocache_bypass ? 'rs+' : 'r+'));
        if (Io.exists(part_data)) {
            Io.out('[AFS] Using data partition ' + part_data);
        } else {
            Io.out('[AFS] No existing data partition ' + part_data);
            throw Status.STD_IOERR;
        }
        self.part_fd_B = Io.open(part_data, (self.iocache_bypass ? 'rs+' : 'r+'));

        self.disk_sync = function () {
            Io.sync(self.part_fd_A);
            Io.sync(self.part_fd_B);
        };

        Io.out('[AFS] Reading the super block...');
        var superbuf = Buf.Buffer();
        n = Buf.buf_read(self.part_fd_A, superbuf, 0, Afs.DEF_BLOCK_SIZE);
        if (n != Afs.DEF_BLOCK_SIZE) {
            Io.out('[AFS] Cannot read super block.');
            Io.close(self.part_fd_A);
            Io.close(self.part_fd_B);
            throw Status.STD_IOERR;
        }

        var magic1 = Buf.buf_get_string(superbuf);
        if (!String.equal(magic1, Afs.magic_str1)) {
            Io.out('[AFS] Invalid inode partition magic found, got ' + magic1 + ', but exptected ' + Afs.magic_str1);
            throw Status.STD_IOERR;
        } else {
            Io.out('[AFS] Found inode partition magic  ' + magic1);
        }
        Buf.buf_set_pos(superbuf, Afs.DEF_MAGIC_SIZE);
        self.afs_super.afs_name = Buf.buf_get_string(superbuf);
        Buf.buf_set_pos(superbuf, 256 + Afs.DEF_MAGIC_SIZE);
        self.afs_super.afs_nfiles = Buf.buf_get_int32(superbuf);
        self.afs_super.afs_block_size = Buf.buf_get_int32(superbuf);
        self.afs_super.afs_nblocks = Buf.buf_get_int32(superbuf);
        self.afs_super.afs_getport = Buf.buf_get_port(superbuf);
        self.afs_super.afs_putport = Buf.buf_get_port(superbuf);
        self.afs_super.afs_checkfield = Buf.buf_get_port(superbuf);
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
            var n = Buf.buf_read(self.part_fd_A, live_table, live_off, live_size);
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
                n = Buf.buf_write(self.part_fd_A, live_table, live_off, 1);
                if (n != 1) return Status.STD_IOERR;
                else return Status.STD_OK;
            } else return Status.STD_ARGBAD;
        }

        function live_write() {
            /*
             ** Unlock the live table
             */
            live_set(0, 0, 1);
            n = Buf.buf_write(self.part_fd_A, live_table, live_off);
            if (n != live_size) return Status.STD_IOERR;
            if (self.sync_write_mode) Io.sync(self.part_fd_A);
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


        /**
         ** Raw disk Read and Write functions for the cache module.
         **
         ** Units:
         **  addr: blocks
         **  size: bytes
         **
         */

        self.read_inode = function (obj, addr, data, size) {
            var off = addr * self.afs_super.afs_block_size;
            Io.log((log < 10) || ('read_inode obj=' + obj + ' addr=' + addr + ' size=' + size));
            var n = Buf.buf_read(self.part_fd_A, data, off, size);
            if (n == size)
                return Status.STD_OK;
            else
                return Status.STD_SYSERR;

        };

        self.write_inode = function (obj, addr, data, size) {
            var off = addr * self.afs_super.afs_block_size;
            Io.log((log < 10) || ('write_inode obj=' + obj + ' addr=' + addr + ' size=' + size));
            var n = Buf.buf_write(self.part_fd_A, data, off, size);
            if (self.sync_write_mode) Io.sync(self.part_fd_A);
            if (n == size)
                return Status.STD_OK;
            else
                return Status.STD_SYSERR;
        };

        self.sync_inode = function (obj) {
        };

        self.read_data = function (obj, addr, data, size) {
            var off = addr * self.afs_super.afs_block_size;
            Io.log((log < 10) || ('read_data obj=' + obj + ' addr=' + addr + ' size=' + size));
            var n = Buf.buf_read(self.part_fd_B, data, off, size);
            if (n == size)
                return Status.STD_OK;
            else
                return Status.STD_SYSERR;
        };

        self.write_data = function (obj, addr, data, size) {
            var off = addr * self.afs_super.afs_block_size;
            Io.log((log < 10) || ('write_data obj=' + obj + ' addr=' + addr + ' size=' + size));
            var n = Buf.buf_write(self.part_fd_B, data, off, size);
            if (self.sync_write_mode) Io.sync(self.part_fd_B);
            if (n == size)
                return Status.STD_OK;
            else
                return Status.STD_SYSERR;
        };


        Io.out('[AFS] Creating inode and data caches ' + cache_params.c_inode_size + '[' + cache_params.c_inode_buffers + '] ' +
            cache_params.c_data_size + '[' + cache_params.c_data_buffers + '] ... ');

        /*
         ** First we need two caches; one for the i-nodes,
         ** and the second for the file data.
         **
         ** Note: I-nodes are handled only on buffer block level
         ** #i-node=cache_params.c_inode_size/DEF_INODE_SIZE
         */
        var cache_inode =
            Fcache.Fcache(
                'AFS Inode',
                cache_params.c_inode_buffers,
                Afs.DEF_BLOCK_SIZE,
                cache_params.c_inode_size,
                self.read_inode,
                self.write_inode,
                self.sync_inode,
                Fcache.Fs_cache_mode.Cache_R);
        self.cache_inode = cache_inode;

        if (cache_inode == undefined) {
            Io.out('[AFS] IO Error.');
            Io.close(self.part_fd_A);
            Io.close(self.part_fd_B);
            throw Status.STD_IOERR;
        }
        /*
         ** The i-node cache object. One object for all i-nodes!
         ** Disk address = obj = 1 [blocks]
         */
        var res = cache_inode.cache_lookup(1, 1, Afs.off_of_inode(self.afs_super.afs_nfiles), Afs_file_state.FF_unlocked);
        var inode_fse = res.fse;
        self.inode_cache_entry = inode_fse;

        /*
         ** File data was synced to disk. Update the i-node state if necessary.
         */

        function sync_data(obj) {
            inode_fse.try_lock();
            var inodeb = Buf.Buffer();
            stat = cache_inode.cache_read(inode_fse, inodeb, Afs.off_of_inode(obj), Afs.DEF_INODE_SIZE);
            if (stat == Status.STD_OK) {
                var inode = Afs.buf_get_inode(inodeb);
                var tmpstat = inode_fse.fse_state;
                inode_fse.fse_state = Afs_file_state.FF_unlocked;
                inode.i_state = Afs_file_state.FF_locked;
                inodeb.pos = 0;
                Afs.buf_put_inode(inodeb, inode);
                stat = cache_inode.cache_write(inode_fse, inodeb, Afs.off_of_inode(obj), Afs.DEF_INODE_SIZE);
                inode_fse.fse_state = tmpstat;
                if (stat != Status.STD_OK) {
                    Io.out('[AFS] sync_data: inode [' + inode.i_file_num + '] update failed: ' + Status.print(stat));
                }
            }
            inode_fse.unlock();

        }

        var cache_data =
            Fcache.Fcache(
                'AFS Data',
                cache_params.c_data_buffers,
                self.afs_super.afs_block_size,
                cache_params.c_data_size,
                self.read_data,
                self.write_data,
                self.sync_data,
                Fcache.Fs_cache_mode.Cache_RW);
        self.cache_data = cache_data;

        if (cache_data == undefined) {
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


        /*
         ** Now build up the core tables:
         **
         ** 1. List of all free clusters (compounds of blocks)
         ** 2. List of all used clusters (compounds of blocks)
         ** 3. List of all free i-nodes and the next free (the one
         **    after the last used)
         **
         */


        /*
         ** Read the i-node table.
         ** Build a list with free i-nodes below the
         ** next-free boundary (above next-free there are all
         ** free i-nodes, if any).
         */
        Io.out('[AFS] Reading the Inode Table...');
        var usedclu = [];
        var freeino = [];

        var firstfree = (-1);
        var nextfree = (-1);
        var nused = 0;

        var inodeb = Buf.Buffer();

        for (i = 1; i < self.afs_super.afs_nfiles; i++) {
            stat = cache_inode.cache_read(inode_fse, inodeb, Afs.off_of_inode(i), Afs.DEF_INODE_SIZE);
            if (stat != Status.STD_OK) {
                Io.out('[AFS] failed to read i-node ' + i + ': ' + Status.print(stat));
                throw stat;
            }
            inodeb.pos = 0;
            var inode = Afs.buf_get_inode(inodeb);
            //if (inode.i_state == Afs_file_state.FF_locked) Io.out(inode.print());
            /*
             ** Some sanity checks first
             */

            if (inode.i_file_num != i) {
                Fs.closeSync(self.part_fd_A);
                Fs.closeSync(self.part_fd_B);
                Io.out('[AFS] got invalid i-node ' + i + ': ' + util.inspect(inode));
                Io.out('[AFS] Abort.');
                throw Status.STD_SYSERR;
            }

            if (inode.i_state != Afs_file_state.FF_locked) {

                live_set(i, 0, 0);

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
                if (inode.i_state == Afs_file_state.FF_unlocked ||
                    inode.i_state == Afs_file_state.FF_commit) {

                    Io.out('[AFS] Unlocked/uncommitted file found. Destroy it: ' + inode.print());


                    inode.i_state = Afs_file_state.FF_invalid;
                    inode.i_disk_addr = 0;
                    inode.i_disk_size = 0;
                    inodeb.pos = 0;
                    Afs.buf_put_inode(inodeb, inode);
                    stat = cache_inode.cache_write(inode_fse, inodeb, Afs.off_of_inode(i), Afs.DEF_INODE_SIZE);


                    if (stat != Status.STD_OK)
                        throw stat;
                }

            } else {
                var tf = live_get(i);
                live_set(i, tf.time, 1);
                nused++;
                usedclu.push([inode.i_disk_addr,
                    to_block(block(inode.i_disk_size))]);
            }
        }

        Io.out('[AFS] Ok.');

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


        self.afs_super.afs_nused = nused;
        self.afs_super.afs_freeobjnums = freeino;
        self.afs_super.afs_nextfree = nextfree;

        Io.out('[AFS] Found ' + self.afs_super.afs_nused + ' used Inode(s)');

        /*
         ** Sort the used cluster list with increasing address.
         */

        var usedcluster = Array.sort(usedclu, function (e1, e2) {
            var d1 = e1[0];
            var d2 = e2[0];
            return (d1 > d2) ? 1 : -1;
        });

        var usedn = usedcluster.length;
        Io.out('[AFS] Found ' + usedn + ' valid file(s)');

        var freeblocks = Flist.Free_blocks();
        freeblocks.free_create(6, self.afs_super.afs_nblocks);
        self.freeblocks = freeblocks;

        /*
         ** Build the free cluster list from the used cluster
         ** list (= holes list) and calculate the total free space.
         */

        var biggesthole = 0;
        var last = [0, 0];

        function f_iter(ul) {
            Array.match(ul, function (hd, tl) {
                var cd, cs;
                cd = hd[0];
                cs = hd[1];
                var ld, ls;
                ld = last[0];
                ls = last[1];

                if ((ld + ls) == 0 && cd > 0) {

                    /*
                     ** Free cluster before first used cluster.
                     */
                    if (cd > biggesthole)
                        biggesthole = cd;

                    freeblocks.free_insert(
                        Flist.Free_block(ld,
                            cd,
                            Flist.Cluster_flag.Cluster_FREE));
                } else if ((ld + ls) != 0 && (ld + ls) < cd) {

                    var size = cd - ld - ls;
                    if (size > biggesthole)
                        biggesthole = size;
                    freeblocks.free_insert(
                        Flist.Free_block(ld + ls,
                            size,
                            Flist.Cluster_flag.Cluster_FREE));

                }
                last = [cd, cs];
                f_iter(tl);
            }, function () {
                var ld, ls;
                ld = last[0];
                ls = last[1];
                var endd = self.afs_super.afs_nblocks;

                if (ld + ls < endd) {
                    var size = endd - ld - ls;
                    if (size > biggesthole)
                        biggesthole = size;

                    freeblocks.free_insert(
                        Flist.Free_block(ld + ls,
                            size,
                            Flist.Cluster_flag.Cluster_FREE));
                }
            })
        }

        f_iter(usedcluster);
        var freeholes, freespace;
        res = freeblocks.free_info();
        freeholes = res[0];
        freespace = res[1];

        Io.out('[AFS] Found ' + freeholes + ' free hole(s)');
        Io.out('[AFS] Biggest hole: ' + (biggesthole * self.afs_super.afs_block_size) +
            ' bytes (' + div(div(biggesthole * self.afs_super.afs_block_size, 1024), 1024) + ' MB)');


        if (freespace > self.afs_super.afs_nblocks) {

            Io.out('[AFS] Warning: inconsistent file system!');
            Io.out('[AFS] Switching to Read-only mode.');
            self.readonly = true;
        }

        Io.out('[AFS] Total free space: ' + (freespace * self.afs_super.afs_block_size) +
            ' bytes (' + div(div(freespace * self.afs_super.afs_block_size, 1024), 1024) + ' MB)');

        inode_fse.unlock();
        Io.log((log < 0) || (self.afs_super.print()));
        return Status.STD_OK;
    }
    try {
        return open();
    } catch (e) {
        if (typeof e == 'number') return e; else {
            Io.printstack(e,'Afs_srv.open_fs');
            return Status.STD_SYSERR;
        }
    }
};


module.exports = {
    Afs_commit_flag:Afs.Afs_commit_flag,
    AFS_MAXLIVE:Afs.AFS_MAXLIVE,
    Afs_file:Afs.Afs_file,
    Afs_inode:Afs.Afs_inode,
    Afs_super:Afs.Afs_super,
    Afs_cache_parameter:Afs.Afs_cache_parameter,
    /**
     *
     * @param {rpcint} rpc
     * @returns {afs_server}
     */
    Server: function(rpc,options) {
        var obj = new afs_server(rpc,options);
        Object.preventExtensions(obj);
        return obj;
    },
    DEF_INODE_SIZE:Afs.DEF_INODE_SIZE,
    DEF_BLOCK_SIZE:Afs.DEF_BLOCK_SIZE
};


