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
 **      BSSLAB, Dr. Stefan Bosse sci@bsslab.de
 **
 **    PROTECTED BY AND DISTRIBUTED UNDER THE TERMS OF:
 **    Free Software Foundation-Europe, GNU GPL License, Version 2
 **
 **    $MODIFIEDBY:  BSSLAB
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2015-2016 BSSLAB
 **    $CREATED:     5/3/15
 **    $MODIFIED:
 **    $VERSION:     1.04
 **
 **    $INFO:
 **
 ** NB: Object = File
 **
 ** This module provides a generic fixed size filesystem cache.
 **
 ** The idea behind this module:
 **
 ** 1. The file cache consists of several fixed size buffers, commonly
 **     a multiple of the disk block size.
 **
 ** 2. Parts of a file (this can be the real file data or an inode block)
 **    or the whole file is cached.
 **
 ** 3. Objects are identified by their unique object number (inode number).
 **
 ** 4. It's assumed that files are stored contingouesly on disk. That
 **    means: logical offset <=> disk address * block_size + offset.
 **
 ** 5. Offsets start with number 0. Physical addresses in blocks.
 **
 ** 6. All buffers from a cache object are stored in a
 **    list sorted with increasing offset.
 **
 ** All the single buffers are allocated on startup with the
 ** cache_create function.
 **
 ** On a request, first the cache must be looked up for
 ** an already cached file object. If there is no such object,
 ** a new cache entry is created. Therefore, the cache_read
 ** and cache_write functions must always provide
 ** the logical disk offset (when file offset = 0), and the
 ** current state of the file.
 **
 ** If a read request (obj,off,size) arrives,
 ** the desired fragment (off,size) is read into the cache, but the size is
 ** enlarged to the cache buffer size and the offset
 ** is adjusted modulo to the buffer size. The requested
 ** fragment is copied in the user target buffer.
 **
 ** If the block file offset and size is already available in the cache,
 ** only copy the desired data to the buffer.
 **
 ** If there are already parts of the request cached, only the
 ** missing parts are read into the cache.
 **
 ** Additionally, there is an inode cache. The same behaviour.
 **
 **
 ** Basic File Parameters and units:
 **
 **      File Sizes:     Logical, in bytes
 **      Disk addresses: Physical, in blocks [super.afs_bock_size]
 **      File offsets:   Logical, in bytes
 **
 **      Free/Used
 **      Clusters:       Physical (both addr and size!), in blocks
 **
 **      A File always occupy full blocks.
 **
 **    $ENDINFO
 **
 */
//"use strict";

var util = Require('util');
var Io = Require('com/io');
var Net = Require('dos/network');
var Status = Net.Status;
var Buf = Require('dos/buf');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var String = Comp.string;
var Hashtbl = Comp.hashtbl;
var Array = Comp.array;
var Perv = Comp.pervasives;
var assert = Comp.assert;
var div = Comp.div;

var CACHE_MAXLIVE = 8;
var log = 0;

/**
 ** The Cache mode.
 **
 ** Write through cache: All cache_write request are written immediately
 **                      to disk (and cached)
 **
 *
 * @type {{Cache_R: number, Cache_RW: number}}
 */
var Fs_cache_mode = {
    Cache_R: 1,           // Write through cache          *)
    Cache_RW: 2          // Lazy Read and Write Caching  *)
};

/** Cache entry state
 *
 * @type {{Cache_Empty: number, Cache_Sync: number, Cache_Modified: number}}
 */
var Fs_cache_state = {
    Cache_Empty: 1,           // Empty cache buffer                       *)
    Cache_Sync: 2,            // The cache buffer is synced with disk     *)
    Cache_Modified: 3,        // The cache buffer must be written to disk *)
    print: function(state) {
        switch (state) {
            case Fs_cache_state.Cache_Empty: return 'Cache_Empty';
            case Fs_cache_state.Cache_Sync: return 'Cache_Sync';
            case Fs_cache_state.Cache_Modified: return 'Cache_Modified';
            default: return 'Fs_cache_state?'
        }
    }

};

// Must be consistent with afs_srv.js!!!

/** File State
 * @type {{FF_invalid: number, FF_unlocked: number, FF_commit: number, FF_locked: number, print: Function}}
 */
var Fs_file_state = {
    FF_invalid:0,               // I-node not used                               *)
    FF_unlocked:0x10,           // New file created                             *)
    FF_commit:0x40,             // File committed, but not synced /afs_COMMIT/  *)
    FF_locked:0x80,             // File committed, and synced /afs_SAFETY/      *)
    print: function(state) {
        switch (state) {
            case Fs_file_state.FF_invalid: return 'FF_invalid';
            case Fs_file_state.FF_unlocked: return 'FF_unlocked';
            case Fs_file_state.FF_commit: return 'FF_commit';
            case Fs_file_state.FF_locked: return 'FF_locked';
            default: return 'Fs_file_state?'
        }
    }
};
/** One buffer.
 *
 * @param {number} fsb_index
 * @param {buffer} fsb_buf
 * @param {number} fsb_off
 * @param {number} fsb_size
 * @param {(Fs_cache_state.Cache_Empty|*)} fsb_state
 */
var fsc_buf = function (fsb_index,fsb_buf,fsb_off,fsb_size,fsb_state) {

    /*
     ** The index of this buffer
     */
    this.fsb_index = fsb_index; //int;
    
    /*
     ** The buffer
     */
    this.fsb_buf = fsb_buf; //buffer;

    /*
     ** Logical file offset [bytes]
     */
    this.fsb_off = fsb_off; //int;

    /*
     ** Amount of cached data in this buffer [bytes]
     */
    this.fsb_size = fsb_size; //int;

    /*
     ** State of the buffer
     */

    this.fsb_state = fsb_state; //Fs_cache_state;

    /*
     ** Buffer lock
     */

    this.fsb_lock = Sch.Lock(); //Mutex.t;
};
/**
 *
 *
 * @param {number} fsb_index
 * @param {buffer} fsb_buf
 * @param {number} fsb_off
 * @param {number} fsb_size
 * @param {(Fs_cache_state.Cache_Empty|*)} fsb_state
 * @returns {fsc_buf}
 * @constructor
 */
function Fsc_buf(fsb_index,fsb_buf,fsb_off,fsb_size,fsb_state) {
    var obj = new fsc_buf(fsb_index,fsb_buf,fsb_off,fsb_size,fsb_state);
    Object.preventExtensions(obj);
    return obj;
}
/** [BLOCKING]
 */
fsc_buf.prototype.lock = function () {
    this.fsb_lock.acquire();
};


/**
 * @returns {bool}
 */
fsc_buf.prototype.try_lock = function () {
    return this.fsb_lock.try_acquire();
};

/**
 *
 */
fsc_buf.prototype.unlock = function () {
    this.fsb_lock.release();
};

/*
 ** One object cached by this module.
 */


/**
 *
 * @param {number} fse_objnum
 * @param {number} fse_disk_addr
 * @param {number} fse_disk_size
 * @param {number []}fse_cached
 * @param {number} fse_lastbuf
 * @param { number [] []} fse_written - [offset,size] []
 * @param {(Fs_file_state.FF_invalid|*)}  fse_state
 * @param {number} fse_live
 */
var fsc_entry = function (fse_objnum,fse_disk_addr,fse_disk_size,fse_cached,fse_lastbuf,fse_written,fse_state,fse_live) {
    /*
     ** Object number. Must be unique!
     */
    this.fse_objnum = fse_objnum; // int;

    /*
     ** Physical disk address of this cached object.
     **
     **  Address: blocks
     **  Size: bytes
     */

    this.fse_disk_addr = fse_disk_addr; // int;
    this.fse_disk_size = fse_disk_size; //  int;


    /*
     ** List of all cached buffers.
     */
    this.fse_cached = fse_cached; // int list;

    /*
     ** The last cached buffer. Speeds up the cache lookup
     ** on sequential reads or writes.
     */

    this.fse_lastbuf = fse_lastbuf; // int;

    /*
     ** List of all  buffers written to disk before the
     ** file was committed. On further modify request, these
     ** blocks must be reread into the cache!
     **
     **  (logical offset * size) list
     */

    this.fse_written = fse_written; // (int * int) list;

    /*
     ** State of the file.
     */
    this.fse_state = fse_state; // afs_file_state;

    /*
     ** Live time
     */

    this.fse_live = fse_live; // int;

    /*
     ** Lock
     */

    this.fse_lock = Sch.Lock(); // Mutex.t;
};

/**
 *
 * @param {number} fse_objnum
 * @param {number} fse_disk_addr
 * @param {number} fse_disk_size
 * @param {number []}fse_cached
 * @param {number} fse_lastbuf
 * @param { number [] []} fse_written - [offset,size] []
 * @param {(Fs_file_state.FF_invalid|*)}  fse_state
 * @param {number} fse_live
 * @returns {fsc_entry}
 * @constructor
 */

function Fsc_entry(fse_objnum,fse_disk_addr,fse_disk_size,fse_cached,fse_lastbuf,fse_written,fse_state,fse_live) {
    var obj = new fsc_entry(fse_objnum,fse_disk_addr,fse_disk_size,fse_cached,fse_lastbuf,fse_written,fse_state,fse_live);
    Object.preventExtensions(obj);
    return obj;
}

/** [BLOCKING!]
 *
 */
fsc_entry.prototype.lock = function () {
    this.fse_lock.acquire();
};
/** [Non Blocking!]
 *
 * @returns {bool}
 */
fsc_entry.prototype.try_lock = function () {
    return this.fse_lock.try_acquire();
};
/**
 *
 */
fsc_entry.prototype.unlock = function () {
    this.fse_lock.release();
};

/** THE Filesystem CACHE Class
 *
 *
 * @param fsc_name
 * @param fsc_size
 * @param fsc_block_size
 * @param fsc_buf_size
 * @param {fsc_buf []} fsc_buffers
 * @param {number []} fsc_free_bufs
 * @param {* [] []} fsc_table (int , fsc_entry) array
 * @param {function} fsc_read
 * @param {function} fsc_write
 * @param {function} fsc_synced
 * @param {(Fs_cache_mode.Cache_R|*)} fsc_mode
 * @constructor
 * @typedef {{fsc_size,fsc_block_size,fsc_buf_size,fsc_buffers:fsc_buf [],fsc_free_bufs:number [],fsc_table,
              fsc_read:function,fsc_write:function,fsc_synced:function,fsc_mode:function,
              fsc_stat,fsc_lock:lock,fsc_verbose:bool}} fsc_cache~obj
 * @see fsc_cache~obj
 * @see fsc_cache~meth
 */
var fsc_cache = function (fsc_name,fsc_size,fsc_block_size,fsc_buf_size,fsc_buffers,fsc_free_bufs,fsc_table,
                          fsc_read,fsc_write,fsc_synced,fsc_mode) {
    this.fsc_name=fsc_name;
    /*
     ** Number of buffers in the cache.
     */

    this.fsc_size = fsc_size; // int;

    /*
     ** Block size in bytes
     */

    this.fsc_block_size = fsc_block_size; // int;

    /*
     ** Size of one buffer in bytes. Fixed! Commonly multiple of the
     ** disk block size.
     */

    this.fsc_buf_size = fsc_buf_size; // int;


    /*
     ** The buffer array
     */
    this.fsc_buffers = fsc_buffers; // fsc_buf array;

    /*
     ** List of all free buffers in the cache.
     */

    this.fsc_free_bufs = fsc_free_bufs; // int list;

    /*
     ** All information of currently cached objects are stored in a
     ** hash table. The key is the physical disk address [blocks]!
     */

    this.fsc_table = fsc_table; // (int , fsc_entry)  Hashtbl.t;

    /*
     ** User supplied disk read function.
     ** Args:
     **  addr: Physical disk address [blocks]
     **  data: The buffer to read from
     **  size: The desired data size to read
     **
     ** Return:
     **  status
     */

    this.fsc_read = fsc_read;          // obj:int ->addr:int ->data: buffer ->size: int ->status;

    /*
     ** User supplied disk write function.
     ** Args:
     **  addr: Physical disk address [blocks]
     **  data: The buffer to write to
     **  size: The data size to write
     **
     ** Return:
     **  status
     */

    this.fsc_write = fsc_write;      // obj:int ->addr:int ->data: buffer ->size: int ->status;


    /*
     ** Notify the server about a synced file.
     */

    this.fsc_synced = fsc_synced; // obj:int -> unit;


    this.fsc_mode = fsc_mode; // Fs_cache_mode;

    this.fsc_stat = {
        cs_cache_read: 0,
        cs_cache_write: 0,
        cs_cache_commit: 0,
        cs_cache_delete: 0,
        cs_cache_compact: 0,
        cs_cache_timeout: 0,
        cs_cache_age: 0,
        cs_disk_read: 0,
        cs_disk_write: 0,
        cs_cache_hit: 0,
        cs_cache_miss: 0,
        cs_cache_sync: 0
    };

    this.fsc_lock = Sch.Lock(); // Mutex.t;

    this.fsc_verbose=false;
};

/**
 * @typedef {{
 * lock:fsc_cache.lock,
 * unlock:fsc_cache.unlock,
 * verbose:fsc_cache.verbose,
 * cache_compact:fsc_cache.cache_compact,
 * get_buf:fsc_cache.get_buf,
 * cache_lookup:fsc_cache.cache_lookup,
 * cache_release:fsc_cache.cache_release,
 * cache_read:fsc_cache.cache_read,
 * cache_write:fsc_cache.cache_write,
 * cache_delete:fsc_cache.cache_delete,
 * cache_commit:fsc_cache.cache_commit,
 * cache_sync:fsc_cache.cache_sync,
 * cache_age:fsc_cache.cache_age,
 * cache_stat:fsc_cache.cache_stat
 * }} fsc_cache~meth
 */

/** [BLOCKING]
 */
fsc_cache.prototype.lock = function () {
    this.fsc_lock.acquire();
};

/**
 * @returns {bool}
 */
fsc_cache.prototype.try_lock = function () {
    return this.fsc_lock.try_acquire();
};
/**
 *
 */
fsc_cache.prototype.unlock = function () {
    this.fsc_lock.release()
};
/**
 *
 * @param v
 */
fsc_cache.prototype.verbose = function (v) {
    this.fsc_verbose=v;
};

/** File Cache Object
*
 *
 * @param {number} nbufs
 * @param {number} blocksize in bytes
 * @param {number} bufsize in blocks
 * @param {function} read
 * @param {function} write
 * @param {function} sync
 * @param mode
 * @returns {fsc_cache}
 */
function Fcache(name,nbufs,blocksize,bufsize,read,write,sync,mode) {
    var buffers=Array.init(nbufs,function (i) {
        return Fsc_buf(i,Buf.Buffer(bufsize*blocksize),-1,-1,Fs_cache_state.Cache_Empty);
    });
    var freelist=Array.init(nbufs,function(i) {return i;});

    var obj = new fsc_cache(name,nbufs,blocksize,bufsize*blocksize,buffers,freelist,Hashtbl.create(20),
                            read,write,sync,mode);
    Object.preventExtensions(obj);
    return obj;
}

/** Dummy File Cache (pass through)
 *
 * @param nbufs
 * @param blocksize
 * @param bufsize
 * @param read
 * @param write
 * @param sync
 * @param mode
 * @constructor
 */
function Fcache0(nbufs,blocksize,bufsize,read,write,sync,mode){

}

/*
 ** Cache compaction
 **
 ** Assumption:
 **  Unlocked files are mainly written sequential to the cache.
 **
 ** Remove objects with livetime = 0 and transfer their buffers to the
 ** freelist.  If there are still not enough free buffers,
 ** decrease the buffer list of the uncommitted (FF_locked) and
 ** committed (FF_unlocked) objects.
 **
 ** The code is slightly blurred with cache entry and buffer locking:
 **
 **  1. Only unlocked cache entries can be removed from the cache.
 **  2. Only unlocked buffers can be transferred to the free list.
 **
 ** Remember I:  the case only one object uses the entire cache!
 ** Remember II: cache_compact must be called with a locked fsc_lock!
 **
 *
 * @returns {(Status.STD_OK|*)}
 */
fsc_cache.prototype.cache_compact = function () {
    var self=this;
    var i,newbuf;

    function clear_buf(buf) {
        buf.fsb_off = -1;
        buf.fsb_size = -1;
        buf.fsb_state = Fs_cache_state.Cache_Empty;
    }
    function to_block (x) {
        return div(x,self.fsc_block_size);
    }
    function  block(x) {
        var block_size = self.fsc_block_size;
        return div((x + block_size - 1),block_size) * block_size;
    }
    try {
        self.fsc_stat.cs_cache_compact++;
        var dying = [];
        var comm = [];
        var notcom1 = [];
        var notcom2 = [];
        /*
         ** Plan A: Remove  objects with live time = 0.
         ** Plan B: Steal committed files some buffers.
         ** Plan C: Write buffers from an uncommitted file to disk.
         */
        Hashtbl.iter(self.fsc_table, function (key, fe) {
            if (fe.fse_live == 0) {
                /*
                 ** Kick out this object from the cache.
                 */
                dying.push(fe);
            }
            else if (fe.fse_state == Fs_file_state.FF_locked) {
                if (!Array.empty(fe.fse_cached))
                    comm.push(fe);
            }
            else if (fe.fse_state == Fs_file_state.FF_unlocked) {
                /*
                 ** A not committed cache entry. Only used,
                 ** if there are no committed cache entries available.
                 */
                if (!Array.empty(fe.fse_cached))
                    notcom2.push(fe);
            }
            else if (fe.fse_state == Fs_file_state.FF_commit) {
                /*
                 ** A not committed but finished cache entry. Only used,
                 ** if there are no committed cache entries available.
                 */
                if (!Array.empty(fe.fse_cached))
                    notcom1.push(fe);
            }
        });
        var notcom = Array.merge(notcom1, notcom2);
        /*
         ** Remove first the dead ones (Live time = 0).
         */
        Array.iter(dying, function (fe) {
            if (fe.try_lock()) {
                /*
                 ** Only remove cache entries for those we get the lock!
                 */
                Array.iter(fe.fse_cached, function (fi) {
                    var fb = self.fsc_buffers[fi];
                    if(fb.try_lock() == true) {
                        clear_buf(fb);
                        fb.unlock();
                    }
                });
                self.fsc_free_bufs=Array.merge(self.fsc_free_bufs, fe.fse_cached);
                fe.unlock();
            }
        });
        var newbufs = self.fsc_free_bufs.length;
        /*
         ** Try to get at least n/4 free buffers from the cache
         */
        var newneeded = div(self.fsc_size,4);
        if (self.fsc_verbose)
            Io.out('[FCACH] Compact: #comm='+comm.length+' #uncomm='+notcom.length+
                   ' file entries, #freebufs='+newbufs+' #neededbufs='+newneeded);

        if (newbufs < newneeded && !Array.empty(notcom)) {
            var notcomli = Array.sort(notcom, function (f1, f2) {
                return (f1.fse_live < f2.fse_live)?1:-1;
            });
            Array.iter(notcomli, function (fe) {
                if (newbufs < newneeded) {
                    var nbf = Perv.min(div(fe.fse_cached.length,2), newneeded - newbufs);
                    /*
                     ** Try to get at least n/2 buffers
                     */
                    newbuf = [];
                    for (i = 0; i <= nbf; i++) {
                        Array.match(fe.fse_cached, function (hd, tl) {
                            var fb = self.fsc_buffers[hd];
                            /*
                             ** Only remove blocks we get the lock for.
                             */
                            if (fb.try_lock() == true) {
                                if (fb.fsb_state == Fs_cache_state.Cache_Modified) {

                                    /*
                                     ** First write the data to disk!
                                     */

                                    self.fsc_stat.cs_disk_write++;
                                    var stat =
                                        self.fsc_write(fe.fse_objnum,
                                            (to_block(fb.fsb_off) + fe.fse_disk_addr),
                                            fb.fsb_buf,
                                            block(fb.fsb_size));
                                    if (stat == Net.Status.STD_OK) {
                                        fe.fse_written.push([fb.fsb_off, block(fb.fsb_size)]);
                                        fe.fse_cached = tl;
                                        clear_buf(fb);
                                        newbufs++;
                                        fb.unlock();
                                        newbuf.push(hd);
                                    }
                                    else {
                                        fb.unlock();
                                    }
                                }
                                else {
                                    fe.fse_cached = tl;
                                    clear_buf(fb);
                                    newbufs++;
                                    fb.unlock();
                                    newbuf.push(hd);
                                }
                            } // else still in use ? *)
                        }, function () {
                            // no cached buffers;
                        });
                    }
                    self.fsc_free_bufs=Array.merge(self.fsc_free_bufs, newbuf);
                }
            });
        }
        if (newbufs < newneeded && !Array.empty(comm)) {
            /*
             ** Plan C:
             ** Iterate the list of committed files and
             ** steal them buffers. Use the oldest ones first!
             */
            var comli = Array.sort(comm, function (f1, f2) {
                return (f1.fse_live < f2.fse_live)?1:-1;
            });
            Array.iter(comli, function (fe) {
                var nbf = Perv.min(div(fe.fse_cached.length,2), (newneeded - newbufs));
                newbuf = [];
                for (i = 0; i <= nbf; i++) {
                    Array.match(fe.fse_cached, function (hd, tl) {
                        var fb = self.fsc_buffers[hd];
                        /*
                         ** Only remove blocks we get the lock for.
                         */
                        if (fb.try_lock() == true) {
                            fe.fse_cached = tl;
                            clear_buf(fb);
                            newbufs++;
                            fb.unlock();
                            newbuf.push(hd);
                        } // else still in use ?

                    }, function () {
                        //no cached buffers
                    });
                }
                self.fsc_free_bufs=Array.merge(self.fsc_free_bufs, newbuf);
            })
        }
        if (self.fsc_verbose)
            Io.out('[FCACH] Compact: new ' + newbufs+' of '+self.fsc_free_bufs.length+' free buffers.');
        return Status.STD_OK;
    } catch(e) {
        if (typeof e != 'number') {Io.printstack(e,'Fcache.cache_compact');}
        if (typeof e == 'number') return e; else return Status.STD_SYSERR;
    }
};

/*
 ** Get a new buffer from the cache. If there are no free buffers,
 ** the cache_compact function must be called.
 **
 *
 * @returns {{stat:(Status.STD_OK|*),buf:buffer}}
 */
fsc_cache.prototype.get_buf = function () {
    var self=this;
    var res;
    assert(self.try_lock());
    Array.match(self.fsc_free_bufs,
        function (hd, tl) {
            self.fsc_free_bufs = tl;
            res={stat:Net.Status.STD_OK,buf:hd};
        },function () {
            /*
             ** We must use already used buffers. A little bit dirty.
             ** Use compact_cache to get free buffers.
             */
            self.cache_compact();
            Array.match(self.fsc_free_bufs,
                    function (hd,tl) {
                        /*
                         ** We have finally luck.
                         */
                        self.fsc_free_bufs = tl;
                        res={stat:Status.STD_OK,buf:hd};
                    },
                    function () {
                        /*
                         ** No free buffers anymore. Fatal.
                         */
                        Io.warn('[FCACH] out of buffers');
                        Io.out(self.cache_stat(true));
                        res = {stat: Status.STD_NOSPACE, buf: undefined};
                    }
            );

        });
    self.unlock();
    return res;
};


/**
 ** Lookup the cache for a file object. If there is no such object
 ** already cached, create a new one, else return the fsc entry.
 ** The object is returned with a locked mutex. Additionally the
 ** success of the Hashtbl lookup is returned.
 **
 **
 *
 * @param {number} obj
 * @param {number} addr
 * @param {number} size
 * @param {(Afs_file_state.FF_invalid|*)} state
 * @returns {{stat: (Status.STD_OK|*), fse: fsc_entry}}
 */

fsc_cache.prototype.cache_lookup = function (obj,addr,size,state) {
    var self=this;
    assert(self.try_lock());
    var stat=Status.STD_OK;
    var fse;
    fse=Hashtbl.find(self.fsc_table,obj);
    Io.log((log<1)||('Fcache.cache_lookup: '+this.fsc_name+' obj='+obj+' addr='+addr+' size='+size+' '+util.inspect(fse)));
    if (fse==undefined) {
        stat=Status.STD_NOTFOUND;
        fse = Fsc_entry(obj,addr,size,[],-1,[],state,CACHE_MAXLIVE);
        Hashtbl.add(self.fsc_table,obj,fse);
    } else assert ((fse.fse_objnum==obj)||('Fcache.cache_lookup: invalid object hash table, got '+fse.fse_objnum+', but expected '+ obj));
    self.unlock();
    return {stat:stat,fse:fse};
};

/**
 ** If the work is done, this function must be called.
 * @param {fsc_entry} fse
 */
fsc_cache.prototype.cache_release = function (fse) {
    fse.unlock();
};

/**
 **
 ** Args:
 **
 **  fse: the fsc entry returned by the lookup function
 **  buf: the client buffer to read in
 **  obj: The object/file number
 **  off: The logical file offset [bytes]
 **  size: The size of the desired fragment or the whole file [bytes]
 **
 **
 *
 * @param {fsc_entry} fse
 * @param {buffer} buf
 * @param {number} off
 * @param {number} size
 * @returns {(Status.STD_OK|*)}
 */
fsc_cache.prototype.cache_read = function (fse,buf,off,size) {
    try {
        var self = this;
        var stat = Status.STD_OK;
        var nc2 = div(self.fsc_size,2);

        function to_block(x) {
            return div(x,self.fsc_block_size);
        }
        var daddr = fse.fse_disk_addr;
        var bufcl = fse.fse_cached;
        var foff = off;        // file offset         *)
        var size = size;       // size to be read      *)
        var doff = 0;          // dst buffer offset    *)

        var dst = buf;          // the destination buf  *)
        var src;
        Io.log((log<1)||('Fcache.cache_read: '+this.fsc_name+' obj='+fse.fse_objnum+' off='+off+' size='+size));

        self.fsc_stat.cs_cache_read++;
        /*
         ** Insert a new created buffers in the fse_cached list
         ** at the right position (before current hd
         ** :: increasing buf offset order).
         ** Return the current hd entry
         ** and the tail list after
         ** the inserted and the current hd entry.
         */
        function insert_cached(fse, ne) {
            var bli = [];
            var nc = self.fsc_buffers[ne];
            var no = nc.fsb_off;
            //var ns = nc.fsb_size;

            function iter(fl) {
                var res;
                Array.match(fl, function (hd, tl) {
                    var fc = self.fsc_buffers[hd];
                    var fo = fc.fsb_off;
                    //var fs = fc.fsb_size;

                    if (no < fo) {
                        var hdtl = Array.merge([hd], tl);
                        bli = Array.merge(bli, [ne], hdtl);
                        res = hdtl;
                    } else {
                        bli.push(hd);
                        res=iter(tl);
                    }

                }, function () {
                    bli.push(ne);
                    res = [];
                });
                return res;
            }

            var tl = iter(fse.fse_cached);
            assert((tl!=undefined)||('chache_read.insert_cached: returned undefined'));
            fse.fse_cached = bli;
            return tl;
        }

        /*
         ** Iterate the list of cached buffers and check the file
         ** offset and the size of each buffer. Missing buffers
         ** must be  inserted at the right position in the buffer list.
         ** But first check the last buffer (fse_lastbuf) to see whether
         ** we have a sequential read operation. This speeds up this
         ** operation significantly.
         */
        function iter(bl) {
            Array.match(bl, function (hd, tl) {
                var src, cboff, cbsiz2, cbsiz;
                var fb = self.fsc_buffers[hd];
                assert(fb.try_lock());
                if (foff >= fb.fsb_off &&
                    foff < (fb.fsb_off + fb.fsb_size)) {
                    self.fsc_stat.cs_cache_hit++;
                    /*
                     ** Some data for us
                     */
                    cboff = foff - fb.fsb_off;
                    cbsiz2 = fb.fsb_size - cboff;
                    cbsiz = (cbsiz2 > size) ? size : cbsiz2;
                    /*
                     ** COPY
                     */
                    src = fb.fsb_buf;
                    Buf.buf_blit(dst, doff, src, cboff, cbsiz);

                    size = size - cbsiz;
                    foff = foff + cbsiz;
                    doff = doff + cbsiz;
                    fb.unlock();

                    if (size > 0) iter(tl);

                } else if (foff < fb.fsb_off) {
                    self.fsc_stat.cs_cache_miss++;
                    /*
                     ** Missing data. Create a new buffer and read
                     ** the file data from disk.
                     */
                    fb.unlock();
                    /*
                     ** Be aware: After a get_buf call, the fse_cached
                     ** list might be modified!
                     */
                    var newbuf = self.get_buf();
                    if (newbuf.stat != Status.STD_OK) {
                        Io.warn('[FCACH] cache_read: failed to get a buffer: ' + Net.Status.print(newbuf.stat));
                        throw Status.STD_SYSERR;
                    }
                    fb = self.fsc_buffers[newbuf.buf];
                    assert(fb.try_lock());
                    var cbl = self.fsc_buf_size;
                    fb.fsb_off = div(foff,cbl) * cbl;
                    fb.fsb_size = (fb.fsb_off + cbl > fse.fse_disk_size) ? fse.fse_disk_size - fb.fsb_off : cbl;
                    /*
                     ** READ
                     */
                    self.fsc_stat.cs_disk_read++;
                    var stat = self.fsc_read(fse.fse_objnum, (daddr + to_block(fb.fsb_off)), fb.fsb_buf, fb.fsb_size);
                    if (stat != Status.STD_OK) {
                        Io.warn('[FCACH] cache_read: disk_read failed: ' + Net.Status.print(stat));
                        fb.unlock();
                        throw Status.STD_SYSERR;
                    }
                    cboff = foff - fb.fsb_off;
                    cbsiz2 = fb.fsb_size - cboff;
                    cbsiz = (cbsiz2 > size) ? size : cbsiz2;
                    src = fb.fsb_buf;
                    Buf.buf_blit(dst, doff, src, cboff, cbsiz);
                    fb.fsb_state = Fs_cache_state.Cache_Sync;

                    var hdtl = insert_cached(fse, newbuf.buf);

                    size = size - cbsiz;
                    foff = foff + cbsiz;
                    doff = doff + cbsiz;

                    fb.unlock();
                    if (size > 0) iter(hdtl);


                } else {
                    fb.unlock();
                    iter(tl);
                }
            }, function () {
                /*
                 ** Missing data at the end. Create a new buffer and read
                 ** the file data from disk. Append the new buffer
                 ** at the end of the buffer list.
                 */
                self.fsc_stat.cs_cache_miss++;
                var newbuf;
                if (fse.fse_cached.length < nc2) {
                    newbuf = self.get_buf();
                } else {
                    /*
                     ** Too much buffers allocated.
                     ** Take the new buffer from the
                     ** head of the cached list.
                     */
                    var hd, tl;
                    Array.match(fse.fse_cached, function (_hd, _tl) {
                        hd = _hd;
                        tl = _tl;
                    }, function () {
                        Io.warn('[FCACH] cache_read: no cached buffers, fatal');
                        throw Status.STD_SYSERR;
                    });
                    fse.fse_cached = tl;
                    var fb = self.fsc_buffers[hd];
                    if (fb.fsb_state == Fs_cache_state.Cache_Modified) {
                        assert(fb.try_lock());
                        /*
                        ** First write the data to disk!
                        */

                        self.fsc_stat.cs_cache_write++;
                        stat = self.fsc_write(fse.fse_objnum, (to_block(fb.fsb_off) + fse.fse_disk_addr), fb.fsb_buf, fb.fsb_size);
                        fb.unlock();
                        if (stat != Status.STD_OK) {
                            Io.warn('[FCACH] cache_read: disk_write failed: ' + Net.Status.print(stat));
                            throw Status.STD_SYSERR;
                        }
                    }
                    newbuf = {stat: Status.STD_OK, buf: hd};
                }
                if (newbuf.stat != Status.STD_OK) {
                    Io.warn('[FCACH] cache_read: failed to get a buffer: ' + Net.Status.print(newbuf.stat));
                    throw newbuf.stat;
                }
                fb = self.fsc_buffers[newbuf.buf];
                assert(fb.try_lock());
                var cbl = self.fsc_buf_size;
                fb.fsb_off = div(foff,cbl) * cbl;
                fb.fsb_size = (fb.fsb_off + cbl > fse.fse_disk_size) ? fse.fse_disk_size - fb.fsb_off : cbl;
                /*
                 ** READ
                 */
                self.fsc_stat.cs_disk_read++;
                stat = self.fsc_read(fse.fse_objnum, (daddr + to_block(fb.fsb_off)), fb.fsb_buf, fb.fsb_size);
                if (stat != Status.STD_OK) {
                    Io.warn('[FCACH] cache_read: disk_read failed: ' + Net.Status.print(stat));
                    fb.unlock();
                    throw Status.STD_SYSERR;
                }
                fb.fsb_state = Fs_cache_state.Cache_Sync;
                fse.fse_cached.push(newbuf.buf);
                fse.fse_lastbuf = newbuf.buf;

                var cboff = foff - fb.fsb_off;
                var cbsiz2 = fb.fsb_size - cboff;
                var cbsiz = (cbsiz2 > size) ? size : cbsiz2;


                /*
                 ** COPY
                 */
                src = fb.fsb_buf;
                Buf.buf_blit(dst, doff, src, cboff, cbsiz);
                fb.fsb_state = Fs_cache_state.Cache_Sync;

                size = size - cbsiz;
                foff = foff + cbsiz;
                doff = doff + cbsiz;
                fb.unlock();
                if (size > 0) iter([]);

            })
        }

        if ((foff + size) > fse.fse_disk_size) {
            Io.warn('[FCACH] cache_read: overflow: offset ' +(foff + size)+ ' > size ' + fse.fse_disk_size);
            throw Status.STD_ARGBAD;
        }
        /*
         ** Check first the last buffer.
         */
        if (fse.fse_lastbuf >= 0) {
            var fb = self.fsc_buffers[fse.fse_lastbuf];
            if (off >= fb.fsb_off) {
                /*
                 ** Sequential read.
                 */
                iter([fse.fse_lastbuf]);
            } else
                iter(bufcl);
        } else iter(bufcl);
        return Status.STD_OK;
    } catch (e) {
        if (typeof e != 'number') {Io.printstack(e,'Fcache.cache_read');}
        if (typeof e == 'number') return e; else return Status.STD_SYSERR
    }
};

/**
 **
 ** Args:
 **
 **  fse: The fsc entry returned by the lookup function
 **  buf: The data to be written
 **  off: The file offset
 **  size: The size of the desired fragment or the whole file
 **
 *
 * @param {fsc_entry} fse
 * @param {buffer} buf
 * @param {number} off
 * @param {number} size
 * @returns {(Status.STD_OK|*)}
 */
fsc_cache.prototype.cache_write = function (fse,buf,off,size) {
    var self = this;
    var block_size = self.fsc_block_size;
    function clear_buf(buf) {
        buf.fsb_off = -1;
        buf.fsb_size = -1;
        buf.fsb_state = Fs_cache_state.Cache_Empty;
    }
    function to_block (x) {
        return div(x,block_size);
    }
    function  block(x) {
        return div((x + block_size - 1),block_size) * block_size;
    }

    try {
        var stat = Status.STD_OK;
        var nc2 = div(self.fsc_size,2);

        var daddr  = fse.fse_disk_addr;

        var bufcl = fse.fse_cached;
        var foff  = off;            // file offset         *)
        var size  = size;           // size to be write     *)
        var soff  = 0;              // src buffer offest    *)

        var src = buf;              // the source buf       *)
        var fb,dst;

        Io.log((log<1)||('Fcache.cache_write: '+this.fsc_name+' obj='+fse.fse_objnum+' off='+off+' size='+size));
        self.fsc_stat.cs_cache_write++;

        /*
         ** Insert a new created buffers in the fse_cached list
         ** at the right position (before current hd
         ** :: increasing buf offset order).
         ** Return the current hd entry
         ** and the tail list after
         ** the inserted and the current hd entry.
         */
        function insert_cached(fse, ne) {
            var bli = [];
            var nc = self.fsc_buffers[ne];
            var no = nc.fsb_off;
            //var ns = nc.fsb_size;

            function iter(fl) {
                var res;
                Array.match(fl, function (hd, tl) {
                    var fc = self.fsc_buffers[hd];
                    var fo = fc.fsb_off;
                    //var fs = fc.fsb_size;

                    if (no < fo) {
                        var hdtl = Array.merge([hd], tl);
                        bli = Array.merge(bli, [ne], hdtl);
                        res = hdtl;
                    } else {

                        bli.push(hd);
                        res=iter(tl);
                    }

                }, function () {
                    bli.push(ne);
                    res = [];
                });
                return res;
            }

            var tl = iter(fse.fse_cached);
            fse.fse_cached = bli;
            return tl;
        }

        /*
         ** Iterate the list of cached buffers and check the file
         ** offset and the size for each buffer. Missing buffers
         ** must be  inserted at the right position in the buffer list.
         ** But first check the last buffer cached. This speeds up
         ** sequential writes.
         */
        function iter(bl) {
            Array.match(bl, function (hd, tl) {
                var dst, cboff, cbsiz2, cbsiz;
                var fb = self.fsc_buffers[hd];
                assert(fb.try_lock());
                /*
                 (*
                 ** If this is the last buffer, we must perhaps fix
                 ** the buffer size due to an increased file size!
                 ** The last buffer is recognized with a smaller
                 ** fsb_size than fsc_buf_size.
                 */
                if (fb.fsb_size < self.fsc_buf_size &&
                    fb.fsb_off + fb.fsb_size < fse.fse_disk_size) {
                    var s = block(fse.fse_disk_size - fb.fsb_off);
                    fb.fsb_size = (s > self.fsc_buf_size) ? self.fsc_buf_size : s;
                }

                if (foff >= fb.fsb_off &&
                    foff < (fb.fsb_off + fb.fsb_size)) {
                    self.fsc_stat.cs_cache_hit++;
                    /*
                     ** Some data for us
                     */
                    cboff = foff - fb.fsb_off;
                    cbsiz2 = fb.fsb_size - cboff;
                    cbsiz = (cbsiz2 > size) ? size : cbsiz2;
                    dst = fb.fsb_buf;
                    Buf.buf_blit(dst, cboff, src, soff, cbsiz);
                    /*
                     ** Cache write through mode ?
                     */
                    if (self.fsc_mode == Fs_cache_mode.Cache_R) {
                        self.fsc_stat.cs_disk_write++;
                        stat = self.fsc_write(fse.fse_objnum, to_block(fb.fsb_off)+ fse.fse_disk_addr,
                                              fb.fsb_buf,block(fb.fsb_size));
                        if (stat == Status.STD_OK)
                            fb.fsb_state = Fs_cache_state.Cache_Sync;
                        else {
                            Io.out('[FCACH] cache_write: disk_write failed: ' + Net.Status.print(stat));
                            fb.unlock();
                            throw stat;
                        }
                    } else {
                        fb.fsb_state = Fs_cache_state.Cache_Modified;
                    }


                    size = size - cbsiz;
                    foff = foff + cbsiz;
                    soff = soff + cbsiz;

                    fb.unlock();
                    if (size > 0) iter(tl);

                } else if (foff < fb.fsb_off) {
                    self.fsc_stat.cs_cache_miss++;
                    /*
                     ** Missing data. Create a new buffer and write
                     ** the file data to this buffer.
                     ** If there is this buffer offset already
                     ** in the written list, it's necessary to read
                     ** the data first from disk!
                     */
                    fb.unlock();
                    /*
                     ** Be aware: After a get_buf call, the fse_cached
                     ** list might be modified!
                     */
                    var newbuf = self.get_buf();
                    if (newbuf.stat != Status.STD_OK) {
                        Io.out('[FCACH] cache_write: failed to get a buffer: ' + Net.Status.print(newbuf.stat));
                        throw Status.STD_SYSERR;
                    }
                    fb = self.fsc_buffers[newbuf.buf];
                    assert(fb.try_lock());
                    var cbl = self.fsc_buf_size;
                    fb.fsb_off = div(foff,cbl) * cbl;
                    fb.fsb_size = (fb.fsb_off + cbl > fse.fse_disk_size) ? fse.fse_disk_size - fb.fsb_off : cbl;
                    /*
                     ** READ the data first from disk ? But only
                     ** 'size' bytes.
                     */
                    var fromdisk = 0;
                    Array.iter (fse.fse_written, function(os) {
                        var off, size;
                        off = os[0];
                        size = os[1];
                        if (off == fb.fsb_off)
                            fromdisk = size;
                    });
                    if (fromdisk != 0) {
                        self.fsc_stat.cs_disk_read++;
                        var stat = self.fsc_read(fse.fse_objnum, (daddr + to_block(fb.fsb_off)), fb.fsb_buf, fromdisk);
                        if (stat != Status.STD_OK) {
                            Io.out('[FCACH] cache_write: disk_read failed: ' + Net.Status.print(stat));
                            fb.unlock();
                            throw Status.STD_SYSERR;
                        }
                    }

                    cboff = foff - fb.fsb_off;
                    cbsiz2 = fb.fsb_size - cboff;
                    cbsiz = (cbsiz2 > size) ? size : cbsiz2;
                    dst = fb.fsb_buf;
                    Buf.buf_blit(dst, cboff, src, soff, cbsiz);
                    /*
                     ** Write through cache ?
                     */
                    if (self.fsc_mode == Fs_cache_mode.Cache_R) {
                        self.fsc_stat.cs_disk_write++;
                        stat = self.fsc_write(fse.fse_objnum, to_block(fb.fsb_off)+ fse.fse_disk_addr,
                                              fb.fsb_buf,block(fb.fsb_size));
                        if (stat == Status.STD_OK)
                            fb.fsb_state = Fs_cache_state.Cache_Sync;
                        else {
                            Io.out('[FCACH] cache_write: disk_write failed: ' + Net.Status.print(stat));
                            fb.unlock();
                            throw stat;
                        }
                    } else {
                        fb.fsb_state = Fs_cache_state.Cache_Modified;
                    }

                    var hdtl = insert_cached(fse, newbuf.buf);
                    size = size - cbsiz;
                    foff = foff + cbsiz;
                    soff = soff + cbsiz;


                    fb.unlock();
                    if (size > 0) iter(hdtl);


                } else {
                    fb.unlock();
                    iter(tl);
                }
            }, function () {
                /*
                 ** Missing data at the end. Create a new buffer and copy
                 ** the file data to the cache buffer. Append the new buffer
                 ** at the end of the buffer list.
                 ** If there is this buffer offset already
                 ** in the written list, it's necessary to read
                 ** the data first from disk!
                 */
                self.fsc_stat.cs_cache_miss++;
                var newbuf;
                if (fse.fse_cached.length < nc2) {
                    newbuf = self.get_buf();
                } else {
                    /*
                     ** Too much buffers allocated.
                     ** Take the new buffer from the
                     ** head of the cached list.
                     */
                    var hd, tl;
                    Array.match(fse.fse_cached, function (_hd, _tl) {
                        hd = _hd;
                        tl = _tl;
                    }, function () {
                        throw Status.STD_SYSERR;
                    });
                    fse.fse_cached = tl;
                    var fb = self.fsc_buffers[hd];
                    if (fb.fsb_state == Fs_cache_state.Cache_Modified) {
                        assert(fb.try_lock());
                        /*
                         ** First write the data to disk!
                         */
                        self.fsc_stat.cs_cache_write++;
                        stat = self.fsc_write(fse.fse_objnum, (to_block(fb.fsb_off) + fse.fse_disk_addr), fb.fsb_buf, fb.fsb_size);
                        if (stat != Status.STD_OK) {
                            fb.unlock();
                            Io.out('[FCACH] cache_write: disk_write failed: ' + Net.Status.print(stat));
                            throw Status.STD_SYSERR;
                        } else {
                            fse.fse_written.push([fb.fsb_off, block(fb.fsb_size)]);
                            clear_buf(fb);
                        }
                        fb.unlock();
                    }
                    newbuf = {stat: Status.STD_OK, buf: hd};
                }
                if (newbuf.stat != Status.STD_OK) {
                    Io.out('[FCACH] cache_write: failed to get a buffer: ' + Net.Status.print(newbuf.stat));
                    throw newbuf.stat;
                }
                fb = self.fsc_buffers[newbuf.buf];
                assert(fb.try_lock());
                var cbl = self.fsc_buf_size;
                fb.fsb_off = div(foff,cbl) * cbl;
                fb.fsb_size = (fb.fsb_off + cbl > fse.fse_disk_size) ? fse.fse_disk_size - fb.fsb_off : cbl;
                /*
                 ** READ the data first from disk ? But only
                 ** 'size' bytes.
                 */
                var fromdisk = 0;
                Array.iter (fse.fse_written, function(os) {
                    var off, size;
                    off = os[0];
                    size = os[1];
                    if (off == fb.fsb_off)
                        fromdisk = size;
                });
                if (fromdisk != 0) {
                    self.fsc_stat.cs_disk_read++;
                    stat = self.fsc_read(fse.fse_objnum, (daddr + to_block(fb.fsb_off)), fb.fsb_buf, fromdisk);
                    if (stat != Status.STD_OK) {
                        Io.out('[FCACH] cache_write: disk_read failed: ' + Net.Status.print(stat));
                        fb.unlock();
                        throw Net.Status.STD_SYSERR;
                    }
                }

                fse.fse_cached.push(newbuf.buf);
                fse.fse_lastbuf = newbuf.buf;

                var cboff = foff - fb.fsb_off;
                var cbsiz2 = fb.fsb_size - cboff;
                var cbsiz = (cbsiz2 > size) ? size : cbsiz2;

                assert((cbsiz>0)||('cache not increasing for chaced file (why?): '+util.inspect(fse)));

                /*
                 ** COPY
                 */
                dst = fb.fsb_buf;
                Buf.buf_blit(dst, cboff, src, soff, cbsiz);
                fb.fsb_state = Fs_cache_state.Cache_Sync;

                size = size - cbsiz;
                foff = foff + cbsiz;
                soff = soff + cbsiz;

                /*
                 ** Write through cache ?
                 */
                if (self.fsc_mode == Fs_cache_mode.Cache_R) {
                    self.fsc_stat.cs_disk_write++;
                    stat = self.fsc_write(fse.fse_objnum, to_block(fb.fsb_off)+ fse.fse_disk_addr,
                                          fb.fsb_buf,block(fb.fsb_size));
                    if (stat == Status.STD_OK)
                        fb.fsb_state = Fs_cache_state.Cache_Sync;
                    else {
                        Io.out('[FCACH] cache_write: disk_write failed: ' + Net.Status.print(stat));
                        fb.unlock();
                        throw stat;
                    }
                } else {
                    fb.fsb_state = Fs_cache_state.Cache_Modified;
                }

                fb.unlock();

                if (size > 0) iter([]);

            })
        }
        /*
         ** Check first the last buffer.
         */
        if (fse.fse_lastbuf >= 0) {

            fb = self.fsc_buffers[fse.fse_lastbuf];
            if (off >= fb.fsb_off) {
                /*
                 ** Sequential write.
                 */
                iter([fse.fse_lastbuf]);
            } else
                iter(bufcl);
        } else
            iter (bufcl);

        return Status.STD_OK;

    } catch(e) {
        if (typeof e != 'number') {Io.printstack(e,'Fcache.cache_write');}
        if (typeof e == 'number') return e; else return Status.STD_SYSERR;
    }
};

/**
 ** Invalidate a cached file. Clean the cache.
 *
 *
 * @param {fsc_entry} fse
 * @returns {(Status.STD_OK|*)}
 */
fsc_cache.prototype.cache_delete = function (fse) {
    var self=this;
    function clear_buf(buf) {
        buf.fsb_off = -1;
        buf.fsb_size = -1;
        buf.fsb_state = Fs_cache_state.Cache_Empty;
    }
    Io.log((log<1)||('Fcache.cache_delete: '+this.fsc_name+' obj='+fse.fse_objnum+' '+util.inspect(fse)));
    /*
      ** Don't forget to move the used buffers to the cache
      ** free list.
      */
    self.fsc_free_bufs=Array.merge(self.fsc_free_bufs,fse.fse_cached);

    Array.iter (fse.fse_cached, function(fb) {
        clear_buf(self.fsc_buffers[fb]);
    });

    Hashtbl.invalidate(self.fsc_table,fse.fse_objnum);
    return Status.STD_OK;

};

/**
 ** (Safety) Commit a cached object, do all outstanding write operations.
 *
 * @param {fsc_entry} fse
 * @returns {(Status.STD_OK|*)}
 */
fsc_cache.prototype.cache_commit = function (fse) {
    var self=this;
    function to_block (x) {
        return div(x,self.fsc_block_size);
    }
    function  block(x) {
        var block_size = self.fsc_block_size;
        return div((x + block_size - 1),block_size) * block_size;
    }
    Io.log((log<1)||('Fcache.cache_commit: '+this.fsc_name+' obj='+fse.fse_objnum+' '+util.inspect(fse)));
    try {
        self.fsc_stat.cs_cache_commit++;
        Array.iter (fse.fse_cached,function(fi){
            var fb = self.fsc_buffers[fi];
            assert(fb.try_lock());
            if (fb.fsb_state == Fs_cache_state.Cache_Modified) {
                self.fsc_stat.cs_disk_write++;

                var stat =
                    self.fsc_write(fse.fse_objnum, to_block(fb.fsb_off) + fse.fse_disk_addr,
                                   fb.fsb_buf, block(fb.fsb_size));

                if (stat != Status.STD_OK) {
                    fb.unlock();
                    throw stat;
                }
                fse.fse_written.push([fb.fsb_off, block(fb.fsb_size)]);

                fb.fsb_state = Fs_cache_state.Cache_Sync;
            }
            fb.unlock();
        });
        /*
         ** Notify server we've synced the disk for this object.
         */
        self.fsc_synced(fse.fse_objnum);
        return Status.STD_OK;
    } catch(e) {
        if (typeof e != 'number') {Io.printstack(e,'Fcache.cache_commit');}
        if (typeof e == 'number') return e; else return Status.STD_SYSERR;
    }
};

/**
 ** Flush the cache.
 * @returns {(Status.STD_OK|*)}
 */
fsc_cache.prototype.cache_sync = function () {
    var self=this;
    try {
        self.fsc_stat.cs_cache_sync++;
        assert(self.try_lock());
        Hashtbl.iter (self.fsc_table, function(obj, fse) {
            if (fse.fse_state == Afs_file_state.FF_commit) {

                assert(fse.try_lock());
                var stat = self.cache_commit(fse);
                if (stat != Status.STD_OK) {
                    fse.unlock();
                    self.unlock();
                    throw stat;
                }
                fse.fse_state = Fs_file_state.FF_locked;
                fse.unlock();
            }
        });
        self.unlock();
        return Status.STD_OK;
    } catch(e) {
        if (typeof e != 'number') {Io.printstack(e,'Fcache.cache_sync');}
        if (typeof e == 'number') return e; else return Status.STD_SYSERR;
    }
};

/*
 ** Decrement (age) the live times of all currently cached objects.
 ** Remove objects with live time = 0. Must be called periodically
 ** to keep only currently used objects in the cache. This
 ** functions returns a [daddr,dsize] array of killed files.
 **
 ** returns: {{stat:(Status.STD_OK|*),killed:number [] []}}
 */
fsc_cache.prototype.cache_age = function () {
    var self=this;
    try {
        self.fsc_stat.cs_cache_age++;
        var dying=[];
        var killed=[];
        assert(self.try_lock());
        Hashtbl.iter (self.fsc_table, function(addr, fse) {
            if (fse.fse_state == Fs_file_state.FF_commit) {

                assert(fse.try_lock());
                fse.fse_live = fse.fse_live - 1;
                if (fse.fse_live == 0) {
                    /*
                     ** Flush the cache.
                     */
                    fse.fse_state = Fs_cache_state.FF_locked;
                    var stat = self.cache_commit(fse);
                    if (stat != Status.STD_OK) {
                        fse.unlock();
                        self.unlock();
                        throw stat;
                    }
                    /*
                     ** Unlocked objects will be destroyed!
                     */
                    self.fsc_stat.cs_cache_timeout++;
                    dying.push(fse);
                }
                fse.unlock();
            }
        });
        if (!Array.empty(dying)) {
            Array.iter(dying, function (fse) {
                assert(fse.try_lock());
                var stat = self.cache_delete(fse);
                if (stat != Status.STD_OK) {

                    fse.unlock();
                    self.unlock();
                    throw stat;
                }
                killed.push([
                    fse.fse_disk_addr,
                    fse.fse_disk_size
                ]);
                fse.unlock();
            })
        }
        self.unlock();
        return {stat:Status.STD_OK,killed:killed};
    } catch(e) {
        if (typeof e != 'number') {Io.printstack(e,'Fcache.cache_age');}
        if (typeof e == 'number') return {stat:e,killed:[]}; else return {stat:Status.STD_SYSERR,killed:[]};
    }
};

/*
 ** Format the statistic fields.
 */
fsc_cache.prototype.cache_stat = function (extended) {
    var self=this;
    var str='';
    str=str+'Read       : '+ self.fsc_stat.cs_cache_read+'\n';
    str=str+'Write      : '+ self.fsc_stat.cs_cache_write+'\n';
    str=str+'Commit     : '+ self.fsc_stat.cs_cache_commit+'\n';
    str=str+'Delete     : '+ self.fsc_stat.cs_cache_delete+'\n';
    str=str+'Compact    : '+ self.fsc_stat.cs_cache_compact+'\n';
    str=str+'Disk Read  : '+ self.fsc_stat.cs_disk_read+'\n';
    str=str+'Disk Write : '+ self.fsc_stat.cs_disk_write+'\n';
    str=str+'Cache hit  : '+ self.fsc_stat.cs_cache_hit+'\n';
    str=str+'Cache miss : '+ self.fsc_stat.cs_cache_miss+'\n';
    str=str+'Timeout    : '+ self.fsc_stat.cs_cache_timeout+'\n';
    str=str+'Age        : '+ self.fsc_stat.cs_cache_age+'\n';
    str=str+'Sync       : '+ self.fsc_stat.cs_cache_sync +'\n';
    str=str+'Buffers    : '+ self.fsc_buffers.length+'\n';
    str=str+'Buffer Size: '+ self.fsc_buf_size+'\n';
    str=str+'Buffer Free: '+ self.fsc_free_bufs.length+'\n';
    if (extended==true) {
        str=str+'Buffers ('+self.fsc_buffers.length+'):\n';
        Array.iter(self.fsc_buffers, function(fb){
            str=str+'  [#'+ fb.fsb_index+' foff='+ fb.fsb_off+' fsize='+ fb.fsb_size+' state='+
                    Fs_cache_state.print(fb.fsb_state)+(fb.fsb_lock?' is locked':'')+']\n';
        });
        str=str+'Files ('+self.fsc_table.length+'):\n';
        Array.iter(self.fsc_table,function (fse) {
            str=str+'  [#'+fse.fse_objnum+' state='+Fs_file_state.print(fse.fse_state)+' live='+fse.fse_live+
                    ' cached '+util.inspect(fse.fse_cached)+(fse.fse_lock?' is locked':'')+']\n';
        })

    }
    return str;
};

module.exports = {
    Fs_cache_mode:Fs_cache_mode,
    Fs_cache_state:Fs_cache_state,
    Fsc_buf : Fsc_buf,
    Fsc_entry : Fsc_entry,
    Fcache : Fcache,
    Fcache0 : Fcache0
};
