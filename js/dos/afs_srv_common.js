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
 **    $CREATED:     7/1/15 by sbosse.
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 **  DOS: AFS Server Common Interface
 **
 **    $ENDOFINFO
 */

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
var Comp = Require('com/compat');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Hashtbl = Comp.hashtbl;
var assert = Comp.assert;
var Fs = Require('fs');
var div = Comp.div;

/** AFS Commit flags
 *
 * @enum
 * @type {{AFS_UNCOMMIT: number, AFS_COMMIT: number, AFS_SAFETY: number}}
 */
var Afs_commit_flag = {
    AFS_UNCOMMIT: 0x0,
    AFS_COMMIT: 0x1,
    AFS_SAFETY: 0x2,
    print: function(flag) {
        switch (flag) {
            case Afs_commit_flag.AFS_UNCOMMIT: return 'AFS_UNCOMMIT';
            case Afs_commit_flag.AFS_COMMIT: return 'AFS_COMMIT';
            case Afs_commit_flag.AFS_SAFETY: return 'AFS_SAFETY';
            default: return 'Afs_commit_flag?'
        }
    }
};


/*
 ** Default filesystem (data) block size. This should be
 ** the smallest value supported by the underlying OS hardware
 ** layer! This block size is always used for the i-node partition.
 */

var DEF_BLOCK_SIZE  = 512;
var DEF_INODE_SIZE  = 32;
var DEF_MAGIC_SIZE  = 32;

/*
 ** Default Number of cache entries for the inode cache
 */
var DEF_INODE_ENTRIES = 500;

/*
 ** Default Number of cache entries for the data cache
 */
var DEF_DATA_ENTRIES = 200;

/*
 ** Default Data buffer size (multiple of block_size)
 */
var DEF_DATA_BUFSIZE = 8 * DEF_BLOCK_SIZE;

/*
 ** Age periodically the data cache and remove timed out
 ** cache objects [sec].
 */
var CACHE_GC_TIME = 10;

/*
 ** Because on file creation and modification, the total size
 ** of a file is not know in advance, it's necessary to reserve
 ** disk space in multiples of the def_res_SIZE. After
 ** the file was committed, the not used part of the last reserved
 ** disk cluster is returned to the free cluster list. [bytes]
 */
var DEF_RES_SIZE = DEF_BLOCK_SIZE * 100;


var magic_str1 = 'AMOEBA::AFS::INODE::032';
var magic_str2 = 'AMOEBA::AFS::DATAX::032';

/*
 ** Files have live time between MAXLIVE and 0.
 ** Zero live time means: destroy the file after an age request.
 */
var AFS_MAXLIVE=7;


/** AFS File State
 * @enum
 * @type {{FF_invalid: number, FF_unlocked: number, FF_commit: number, FF_locked: number, print: Function}}
 */
var Afs_file_state = {
    FF_invalid:0,               // I-node not used                               *)
    FF_unlocked:0x10,           // New file created                             *)
    FF_commit:0x40,             // File committed, but not synced /AFS_COMMIT/  *)
    FF_locked:0x80,             // File committed, and synced /AFS_SAFETY/      *)
    print: function(state) {
        switch (state) {
            case Afs_file_state.FF_invalid: return 'FF_invalid';
            case Afs_file_state.FF_unlocked: return 'FF_unlocked';
            case Afs_file_state.FF_commit: return 'FF_commit';
            case Afs_file_state.FF_locked: return 'FF_locked';
            default: return 'Afs_file_state?'
        }
    }
};

/** AFS Disk i-node Class
 *
 * @param disk_addr
 * @param disk_ioff
 * @param disk_res
 * @constructor
 * @typedef {{disk_addr:number,disk_ioff:number,disk_res:number}} disk~obj
 * @see disk~obj
 */
var disk = function (disk_addr,disk_ioff,disk_res) {
    this.disk_addr=disk_addr||-1;
    this.disk_ioff=disk_ioff||-1;
    this.disk_res=disk_res||0;
};

/** A Disk I-Node Object
 *
 * @param disk_addr
 * @param disk_ioff
 * @param disk_res
 * @returns {disk}
 */
var Disk = function (disk_addr,disk_ioff,disk_res) {
    var obj = new disk(disk_addr,disk_ioff,disk_res);
    Object.preventExtensions(obj);
    return obj;
};

/** AFS I-node Class
 ** Internal node information (Physical disk offset of file and
 ** the i-node itself, and perhaps reserved space for unlocked
 ** files).
 *
 * @param i_file_num
 * @param i_disk_addr
 * @param i_disk_size   in bytes
 * @param i_disk_res
 * @param {(Afs_file_state.FF_invalid|*)} i_state
 * @param i_time
 * @param {port} i_random
 * @constructor
 * @typedef {{i_file_num:number,i_disk_addr:number,i_disk_size:number,i_disk_res:number,
 *            i_state:Afs_file_state,i_time:number,i_random:port}} afs_inode~obj
 * @see afs_inode~obj
 */
var afs_inode = function (i_file_num,i_disk_addr,i_disk_size,i_disk_res,i_state,i_time,i_random) {
    this.i_file_num=     i_file_num||0;             // all integers
    this.i_disk_addr=    i_disk_addr||0;            //
    this.i_disk_size=    i_disk_size||0;
    this.i_disk_res=     i_disk_res||0;             //
    this.i_state=        i_state;                   // Afs_file_state
    this.i_time=         i_time||0;
    this.i_random=       i_random;                  // port
};

/** AFS Inode Object
 *
 * @param i_file_num
 * @param i_disk_addr
 * @param i_disk_size
 * @param i_disk_res
 * @param {(Afs_file_state.FF_invalid|*)} i_state
 * @param i_time
 * @param {port} i_random
 * @returns {afs_inode}
 */
function Afs_inode(i_file_num,i_disk_addr,i_disk_size,i_disk_res,i_state,i_time,i_random) {
    var obj = new afs_inode(i_file_num,i_disk_addr,i_disk_size,i_disk_res,i_state,i_time,i_random);
    Object.preventExtensions(obj);
    return obj;
}

afs_inode.prototype.print = function () {
    var str='';
    str=str+'#'+this.i_file_num+' ['+Net.Print.port(this.i_random)+'] @'+this.i_time;
    str=str+' daddr='+this.i_disk_addr+' ['+this.i_disk_size+' bytes]';
    str=str+' state='+Afs_file_state.print(this.i_state);
    return str;
};

/**
 ** File handle
 *
 * @param {number} [ff_objnum]
 * @param {port} [ff_random]
 * @param {number} [ff_size]
 * @param {number} [ff_time]
 * @param {number} [ff_live]
 * @param {(Afs_file_state.FF_invalid|*)} [ff_state]
 * @param {(disk|buffer)} [ff_disk]
 * @param {boolean} [ff_modified]
 * @constructor
 * @typedef {{ff_objnum,ff_random,ff_size,ff_time,ff_live,ff_state,ff_disk,ff_modified,ff_lock:Lock}} afs_file~obj
 * @see afs_file~obj
 * @see afs_file~meth
 */
var afs_file = function (ff_objnum,ff_random,ff_size,ff_time,ff_live,ff_state,ff_disk,ff_modified) {
    this.ff_objnum = ff_objnum||0;              // int;             The directory index number
    this.ff_random = ff_random;                 // port;            Random check number
    this.ff_time = ff_time||0;                  // int;             Time stamp in 10s units
    this.ff_live = ff_live||AFS_MAXLIVE;        // int;             Live time [0..MAXLIVE]
    this.ff_state = ff_state||Afs_file_state.FF_unlocked;  // afs_file_state;  The status of a file
    this.ff_size = ff_size||0;                  // int;             Size of the file [bytes]
    this.ff_disk = ff_disk||Disk();             // disk;            Disk I-node or data buffer (emb.)
    this.ff_modified = ff_modified||true;       // bool;            modified afs_file ?
    this.ff_lock = Sch.Lock();                      // Mutex.t;
};

/**
 * @typedef {{lock:afs_file.lock,unlock:afs_file.unlock,print:afs_file.print}} afs_file~meth
 */

/** Lock a file. [BLOCKING]
 *
 */
afs_file.prototype.lock = function () {
    this.ff_lock.acquire();
};

/**
 * @returns {boolean}
 */
afs_file.prototype.try_lock = function () {
    return this.ff_lock.try_acquire();
};
/** Unlock a file.
 *
 */
afs_file.prototype.unlock = function () {
    this.ff_lock.release();
};
/**
 *
 * @returns {string}
 */
afs_file.prototype.print = function () {
    var str='';
    str='#'+this.ff_objnum+' ['+Net.Print.port(this.ff_random)+'] @'+this.ff_time+' '+Afs_file_state.print(this.ff_state);
    str=str+' ('+this.ff_size+' bytes) '+util.inspect(this.ff_disk)+(this.ff_modified?' is modified':'');
    return str;
};

/** AFS File handle
 *
 * @param {number} [ff_objnum]
 * @param {port} [ff_random]
 * @param {number} [ff_size]
 * @param {number} [ff_time]
 * @param {number} [ff_live]
 * @param {(Afs_file_state.FF_invalid|*)} [ff_state]
 * @param {disk} [ff_disk]
 * @param {boolean} [ff_modified]
 * @returns {afs_file}
 */
function Afs_file(ff_objnum,ff_random,ff_size,ff_time,ff_live,ff_state,ff_disk,ff_modified) {
    var obj = new afs_file(ff_objnum,ff_random,ff_size,ff_time,ff_live,ff_state,ff_disk,ff_modified);
    Object.preventExtensions(obj);
    return obj;
}

/**
 *
 * @param {buffer} buf
 * @param {afs_inode} inode
 */
function buf_put_inode(buf,inode) {
    Buf.buf_put_int32(buf,inode.i_file_num);
    Buf.buf_put_int32(buf,inode.i_disk_addr);
    Buf.buf_put_int32(buf,inode.i_disk_size);
    Buf.buf_put_int32(buf,inode.i_disk_res);
    Buf.buf_put_int16(buf,inode.i_state);
    Buf.buf_put_int32(buf,inode.i_time);
    Buf.buf_put_port(buf,inode.i_random);
}

/** Store i-node structure created from afs_file object
 *
 * @param {buffer} buf
 * @param {afs_file} file
 */
function buf_put_ff_inode(buf,file) {
    Buf.buf_put_int32(buf,file.ff_objnum);
    Buf.buf_put_int32(buf,file.ff_disk.disk_addr);
    Buf.buf_put_int32(buf,file.ff_size);
    Buf.buf_put_int32(buf,file.ff_disk.disk_res);
    Buf.buf_put_int16(buf,file.ff_state);
    Buf.buf_put_int32(buf,file.ff_time);
    Buf.buf_put_port(buf,file.ff_random);
}

/**
 *
 * @param {buffer} buf
 * @param {afs_inode} [inode]
 * @returns {*}
 */
function buf_get_inode(buf,inode) {
    if (inode==undefined) inode=Afs_inode();
    inode.i_file_num=Buf.buf_get_int32(buf);
    inode.i_disk_addr=Buf.buf_get_int32(buf);
    inode.i_disk_size=Buf.buf_get_int32(buf);
    inode.i_disk_res=Buf.buf_get_int32(buf);
    inode.i_state=Buf.buf_get_int16(buf);
    inode.i_time=Buf.buf_get_int32(buf);
    inode.i_random=Buf.buf_get_port(buf);
    return inode;
}

/** Get afs_file object from i-node structure
 *
 * @param {buffer} buf
 * @param {afs_file} [file]
 * @returns {afs_file}
 */
function buf_get_ff_inode(buf,file) {
    if (file==undefined) file=Afs_file();
    file.ff_objnum=Buf.buf_get_int32(buf);
    file.ff_disk.disk_addr=Buf.buf_get_int32(buf);
    file.ff_size=Buf.buf_get_int32(buf);
    file.ff_disk.disk_res=Buf.buf_get_int32(buf);
    file.ff_state=Buf.buf_get_int16(buf);
    file.ff_time=Buf.buf_get_int32(buf);
    file.ff_random=Buf.buf_get_port(buf);
    return file;
}

/** AFS Super Class
 ** The main AFS structure: the all known super structure with basic
 ** information about the file system. This structure is generated
 ** by the server with fixed information from the super block
 ** of the filesystem (name, nfiles, ports, size), and dynamically
 ** from the inode table (nfiles, nused, freeobj, nextfree).
 *
 *
 * @param {string} afs_name
 * @param {number} afs_nfiles
 * @param {number} afs_nused
 * @param {number []} afs_freeobjnums
 * @param {number} afs_nextfree
 * @param {port} afs_getport
 * @param {port} afs_putport
 * @param {port} afs_checkfield
 * @param {number} afs_block_size
 * @param {number} afs_nblocks
 * @constructor
 * @typedef {{afs_lock:lock,afs_name:string,afs_nfiles:number,afs_nused:number,afs_freeobjnums:number [],
 *            afs_nextfree:number,afs_getport:port,afs_putport:port,afs_checkfield:port,
 *            afs_block_size:number,afs_nblocks:number}} afs_super~obj
 * @see afs_super~obj
 * @see afs_super~meth
 */
var afs_super = function (afs_name,afs_nfiles,afs_nused,afs_freeobjnums,
                          afs_nextfree,afs_getport,afs_putport,afs_checkfield,afs_block_size,afs_nblocks) {
    this.afs_name = afs_name;               // string:      The server name

    this.afs_nfiles = afs_nfiles;           // int:         Number of total table entries
    this.afs_nused = afs_nused;             // int:         Number of used table entries
    this.afs_freeobjnums = afs_freeobjnums; // int list:    Free slots list
    this.afs_nextfree = afs_nextfree;       // int:         Next free slot


    this.afs_getport = afs_getport;         // port:        Private getport
    this.afs_putport = afs_putport;         // port:        Public putport
    this.afs_checkfield = afs_checkfield;   // port:        Private checkfield

    /*
     ** Not used by this module
     */

    this.afs_block_size = afs_block_size;   // int:         Data Blocksize [bytes]
    this.afs_nblocks = afs_nblocks;         // int:         Number of total data blocks
    this.afs_lock = Sch.Lock();               // Mutex.t:        Super protection lock
};

/**
 * @typedef {{lock,unlock,try_lock,print}} afs_super~meth
 */

/** Lock super structure [Non Blocking with invariant exception]
 *
 */
afs_super.prototype.lock = function () {
    // assert((!this.afs_lock.is_locked())||('afs_super is already locked!'));
    this.afs_lock.acquire();
};

afs_super.prototype.try_lock = function () {
    return this.afs_lock.try_acquire();
};

/**
 *
 */
afs_super.prototype.unlock = function () {
    this.afs_lock.release();
};

/**
 *
 * @returns {string}
 */
afs_super.prototype.print = function () {
    var str='';
    str='SUPER BLOCK:\n';
    str=str+'  LABEL    = '+this.afs_name+'\n';
    str=str+'  BLOCKS   = '+this.afs_nblocks+'\n';
    str=str+'  BLSIZE   = '+this.afs_block_size+'\n';
    str=str+'  FILES    = '+this.afs_nfiles+'\n';
    str=str+'  USED     = '+this.afs_nused+'\n';
    str=str+'  FREE     = '+this.afs_freeobjnums.length+'\n';
    str=str+'  NEXTFREE = '+this.afs_nextfree+'\n';
    str=str+'  GETPORT  = '+Net.Print.port(this.afs_getport)+'\n';
    str=str+'  PUTPORT  = '+Net.Print.port(this.afs_putport)+'\n';
    str=str+'  CHECKFI  = '+Net.Print.port(this.afs_checkfield)+'\n';
    return str;
};


/** AFS Super Object
 *
 * @param {string} afs_name
 * @param {number} afs_nfiles
 * @param {number} afs_nused
 * @param {number []} afs_freeobjnums
 * @param {number} afs_nextfree
 * @param {port} afs_getport
 * @param {port} afs_putport
 * @param {port} afs_checkfield
 * @param {number} afs_block_size
 * @param {number} afs_nblocks
 * @returns {afs_super}
 */

function Afs_super(afs_name,afs_nfiles,afs_nused,afs_freeobjnums,
                   afs_nextfree,afs_getport,afs_putport,afs_checkfield,afs_block_size,afs_nblocks) {
    var obj = new afs_super(afs_name,afs_nfiles,afs_nused,afs_freeobjnums,
                            afs_nextfree,afs_getport,afs_putport,afs_checkfield,afs_block_size,afs_nblocks);
    Object.preventExtensions(obj);
    return obj;
}

/** AFS Cache Parameter Class
 *
 * @param c_inode_buffers Number of inode cache buffers
 * @param c_inode_size Size of one inode cache buffer [blocks]
 * @param c_data_buffers Number of data cache buffers
 * @param c_data_size Size of one data buffer [blocks]
 * @constructor
 */
var afs_cache_parameter = function (c_inode_buffers,c_inode_size,c_data_buffers,c_data_size) {
    this.c_inode_buffers=c_inode_buffers;
    this.c_inode_size=c_inode_size;
    this.c_data_buffers=c_data_buffers;
    this.c_data_size=c_data_size;
};
/** AFS Cache Parameter Object
 *
 * @param c_inode_buffers Number of inode cache buffers
 * @param c_inode_size Size of one inode cache buffer [blocks]
 * @param c_data_buffers Number of data cache buffers
 * @param c_data_size Size of one data buffer [blocks]
 * @returns {afs_cache_parameter}
 */
function Afs_cache_parameter(c_inode_buffers,c_inode_size,c_data_buffers,c_data_size) {
    var obj = new afs_cache_parameter(c_inode_buffers,c_inode_size,c_data_buffers,c_data_size);
    Object.preventExtensions(obj);
    return obj;
}

/*
 ** Calculate the logical partition offset for an inode
 */

function off_of_inode(inode) {
    return (inode * DEF_INODE_SIZE);
}

/*
 ** Convert block to byte units and vice versa
 */
function to_block (x,block_size) {
    return div(x,block_size);
}

function of_block (x,block_size) {
    return x * block_size;
}


/*
 ** Round up the value x to nearest block_size -> block & byte units
 */

function ceil_block (x,block_size) {
    return div((x + block_size - 1),block_size);
}

/*
 ** Round up the value x to block_size
 */

function ceil_block_bytes (x,block_size) {
    return div((x + block_size - 1),block_size) * block_size;
}

/*
 ** Round down the value x to nearest block_size -> block & byte units
 */

function floor_block (x,block_size) {
    return div(x,block_size);
}

function floor_block_bytes (x,block_size) {
    return div(x,block_size) * block_size;
}
/**
 *
 * @type {{magic_str1: string, magic_str2: string, AFS_MAXLIVE: number, DEF_BLOCK_SIZE: number, DEF_INODE_SIZE: number, DEF_MAGIC_SIZE: number, buf_get_inode: buf_get_inode, buf_get_ff_inode: buf_get_ff_inode, buf_put_inode: buf_put_inode, buf_put_ff_inode: buf_put_ff_inode, ceil_block: ceil_block, ceil_block_bytes: ceil_block_bytes, floor_block: floor_block, floor_block_bytes: floor_block_bytes, of_block: of_block, to_block: to_block, off_of_inode: off_of_inode, Afs_commit_flag: {AFS_UNCOMMIT: number, AFS_COMMIT: number, AFS_SAFETY: number}, Afs_file: Afs_file, Afs_file_state: {FF_invalid: number, FF_unlocked: number, FF_commit: number, FF_locked: number, print: Function}, Afs_inode: Afs_inode, Afs_super: Afs_super, Cache_parameter: Cache_parameter, Disk: Function}}
 */
module.exports = {
    magic_str1:magic_str1,
    magic_str2:magic_str2,
    AFS_MAXLIVE:AFS_MAXLIVE,
    DEF_BLOCK_SIZE:DEF_BLOCK_SIZE,
    DEF_INODE_SIZE:DEF_INODE_SIZE,
    DEF_MAGIC_SIZE:DEF_MAGIC_SIZE,
    DEF_INODE_ENTRIES:DEF_INODE_ENTRIES,
    DEF_DATA_ENTRIES:DEF_DATA_ENTRIES,
    DEF_DATA_BUFSIZE:DEF_DATA_BUFSIZE,
    CACHE_GC_TIME:CACHE_GC_TIME,
    DEF_RES_SIZE:DEF_RES_SIZE,

    buf_get_inode:buf_get_inode,
    buf_get_ff_inode:buf_get_ff_inode,
    buf_put_inode:buf_put_inode,
    buf_put_ff_inode:buf_put_ff_inode,

    ceil_block:ceil_block,
    ceil_block_bytes:ceil_block_bytes,
    floor_block:floor_block,
    floor_block_bytes:floor_block_bytes,
    of_block:of_block,
    to_block:to_block,
    off_of_inode:off_of_inode,

    Afs_commit_flag:Afs_commit_flag,
    Afs_file:Afs_file,
    Afs_file_state:Afs_file_state,
    Afs_inode:Afs_inode,
    Afs_super:Afs_super,

    Afs_cache_parameter:Afs_cache_parameter,
    Disk:Disk
};
