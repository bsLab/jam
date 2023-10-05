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
 **    $CREATED:     5/27/15 by sbosse.
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 **  DOS: DNS Server Interface Commmon
 **
 **    $ENDOFINFO
 */
"use strict";
var Sch = Require('dos/scheduler');
var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Dns = Require('dos/dns');
var Io = Require('com/io');
var Cs = Require('dos/capset');
var Comp = Require('com/compat');
var Array = Comp.array;
var assert = Comp.assert;
var div = Comp.div;

/****************************
 DNS Host File System + AFS
***************************/

/*
 ** Cache parameters
 */
var DEF_INODE_ENTRIES = 500;
var DEF_DIR_ENTRIES = 200;
/**
 ** Age periodically the data cache and remove timed out
 ** cache objects [sec].
 */
var CACHE_GC_TIME = 10;

/**
 ** Directory has a lifetime between MAXLIVE and 0.
 ** Zero lifetime means: destroy the directory after an age request.
 */
var DNS_MAX_LIVE =  8;

var DEF_BLOCK_SIZE  = 512;
var DEF_MAGIC_SIZE  = 32;

/*
 ** The right bit for each column. In dead, only the first
 ** DNS_MAXCOLUMNS array elements are used.
 */
var dns_col_bits =  [0x1,0x2,0x4,0x8,0x10,0x20,0x40,0x80];

/**
 *
 * @type {{DNSMODE_ONECOPY: number, DNSMODE_TWOCOPY: number}}
 */
var Dns_mode = {
    DNSMODE_ONECOPY: 1,       // Default file server number = 0
    DNSMODE_TWOCOPY: 2        // Duplicated file server mode
};

/**
 *
 * @param c_inode_buffers Number of i-node cache buffers
 * @param c_inode_size Size of one i-node cache buffer [blocks]
 * @param c_dir_buffers Number of directory cache buffers
 * @param c_dir_size Size of one directory buffer [blocks]
 * @constructor
 */
var dns_cache_parameter = function (c_inode_buffers,c_inode_size,c_dir_buffers,c_dir_size) {
    this.c_inode_buffers=c_inode_buffers;
    this.c_inode_size=c_inode_size;
    this.c_dir_buffers=c_dir_buffers;
    this.c_dir_size=c_dir_size;
};

/**
 *
 * @param c_inode_buffers Number of i-node cache buffers
 * @param c_inode_size Size of one i-node cache buffer [blocks]
 * @param c_dir_buffers Number of directory cache buffers
 * @param c_dir_size Size of one directory buffer [blocks]
 * @returns {dns_cache_parameter}
 */
var Dns_cache_parameter = function (c_inode_buffers,c_inode_size,c_dir_buffers,c_dir_size) {
    var obj = new dns_cache_parameter(c_inode_buffers,c_inode_size,c_dir_buffers,c_dir_size);
    Object.preventExtensions(obj);
    return obj;
};

/*
 ** Disk Magic Label
 */

var MAGIC_STR = "AMOEBA::DNS::INODE::032";

/*
 ** SERVER
 *  ======
 ** Disk layout
 **
 **  Directory Table Partition:
 **
 **  -------------------------
 **  512 bytes:
 **      32 bytes    : magic header
 **      480 bytes   : super structure
 **  -------------------------
 **  Directory (inode) table
 **
 **
 **  -------------------------
 **  Live  table
 **  -------------------------
 **
 **
 ** The directory table contains the capability set of a directory (aka.
 ** directory object number to capability set mapping).
 */

/**
 *
 * @param i_objnum
 * @param {capability []} i_caps
 * @param i_size
 * @param {(Afs_file_state.FF_invalid|*)} i_state
 */
var dns_inode = function (i_objnum, i_caps, i_size, i_state) {
    this.i_objnum = i_objnum; // int:  Directory object number
    this.i_caps = i_caps;     // capability array: referenced objects
    this.i_size = i_size;     // int: size of referenced object if any
    this.i_state = i_state;   // int: used or not
};

var DNS_INODE_SIZE = 2*4+2+2*Net.CAP_SIZE;
var DEF_INODE_SIZE = DNS_INODE_SIZE;
/*
 ** The filesystem server informations we need to store the directory files
 ** and to tell clients about the default fileserver. We can use up
 ** to two file servers.
 */

/**
 *
 * @type {{FS_down: number, FS_up: number, FS_unknown: number}}
 */
var Fs_state = {
    FS_down:0,
    FS_up:1,
    FS_unknown:2
};


/**
 *
 * @param {capability []} fs_cap
 * @param {fs_state []} fs_state
 * @param {number} fs_default
 * @param {(Dns_mode.DNSMODE_ONECOPY|*)} fs_mode
 * @constructor
 */
var fs_server = function (fs_cap,fs_state,fs_default,fs_mode) {
    this.fs_cap=fs_cap;         // capability array;     (* FS server ports *)
    this.fs_state=fs_state;     // fs_state array;       (* FS server state *)
    this.fs_default=fs_default; // int;                  (* Cuurent default *)
    this.fs_mode=fs_mode;       // dns_mode;
};

/**
 *
 * @param {capability []} fs_cap
 * @param {fs_state []} fs_state
 * @param {number} fs_default
 * @param {(Dns_mode.DNSMODE_ONECOPY|*)} fs_mode
 * @returns {fs_server}
 *
 */
function Fs_server(fs_cap,fs_state,fs_default,fs_mode) {
    var obj = new fs_server(fs_cap,fs_state,fs_default,fs_mode);
    Object.preventExtensions(obj);
    return obj;
}

/*
 ** The main DNS structure: the all known super structure with basic
 ** information about the directory system.
 */


/**
 *
 * @param {string} dns_name
 * @param {number} dns_block_size
 * @param {port} dns_getport
 * @param {port} dns_putport
 * @param {port} dns_checkfield
 * @param {number} dns_ncols
 * @param {string []} dns_colnames
 * @param {number []} dns_generic_colmask
 * @param {fs_server} dns_fs
 * @constructor
 * @typedef {{dns_name,dns_blocksize,dns_ndirs,dns_nused,dns_freeobjnumds,dns_nextfree,dns_getport,dns_putport,dns_checkfield,
 *            dns_ncols,dns_colnames:string [],dns_generic_colmask: number [],dns_fs:fs_server,dns_lock:lock}} dns_super~obj
 * @see dns_super~obj
 */
var dns_super = function (dns_name, dns_block_size, dns_getport, dns_putport, dns_checkfield, dns_ncols, dns_colnames, dns_generic_colmask, dns_fs) {
    this.dns_name = dns_name||'';       // string: The server name
    this.dns_ndirs = 0;              // int: Number of total table entries
    this.dns_nused = 0;              // int: Number of used table entries
    this.dns_freeobjnums = [];       // int array: Free slots list
    this.dns_nextfree = 1;           // int: Next free slot

    this.dns_block_size = dns_block_size||0;

    this.dns_getport = dns_getport;       // port: Private getport
    this.dns_putport = dns_putport;      // port: Public putport
    this.dns_checkfield = dns_checkfield; // port: Private checkfield

    this.dns_ncols = dns_ncols||0;           // int: Number of columns
    this.dns_colnames = dns_colnames||[];     // string array: Column names
    this.dns_generic_colmask = dns_generic_colmask||[];   // rights_bits array: Column mask


    this.dns_fs = dns_fs;             // AFS file server capability [2]; all directories are saved there
    this.dns_lock = Sch.Lock();

};

/**
 * @typedef {{lock,unlock,try_lock,print}} afs_super~meth
 */

/** Lock super structure [BLOCKING]
 *
 */
dns_super.prototype.lock = function () {
    // assert((!this.dns_lock.is_locked())||('dns_super is already locked!'));
    this.dns_lock.acquire();
};
/**
 *
 */
dns_super.prototype.try_lock = function () {
    return this.dns_lock.try_acquire();
};

/**
 *
 */
dns_super.prototype.try_lock = function () {
    return this.dns_lock.try_acquire();
};

/**
 *
 */
dns_super.prototype.unlock = function () {
    this.dns_lock.release();
};
dns_super.prototype.print = function () {
    var str='';
    str='SUPER BLOCK:\n';
    str=str+'  LABEL    = '+this.dns_name+'\n';
    str=str+'  BLSIZE   = '+this.dns_block_size+'\n';
    str=str+'  DIRS     = '+this.dns_ndirs+'\n';
    str=str+'  USED     = '+this.dns_nused+'\n';
    str=str+'  FREE     = '+this.dns_freeobjnums.length+'\n';
    str=str+'  NEXTFREE = '+this.dns_nextfree+'\n';
    str=str+'  GETPORT  = '+Net.Print.port(this.dns_getport)+'\n';
    str=str+'  PUTPORT  = '+Net.Print.port(this.dns_putport)+'\n';
    str=str+'  CHECKFI  = '+Net.Print.port(this.dns_checkfield)+'\n';
    return str;

};

/**
 *
 * @param i_objnum
 * @param {capability []} i_caps
 * @param i_size
 * @param {(Afs_file_state.FF_invalid|*)} i_state
 * @returns {dns_inode}
 */
function Dns_inode(i_objnum,i_caps,i_size,i_state) {
    var obj = new dns_inode(i_objnum,i_caps,i_size,i_state);
    Object.preventExtensions(obj);
    return obj;
}


/**
 *
 * @param dns_name
 * @param {number} dns_blocksize
 * @param dns_getport
 * @param dns_putport
 * @param dns_checkfield
 * @param dns_ncols
 * @param dns_colnames
 * @param dns_generic_colmask
 * @param dns_file
 * @returns {dns_super}
 */
function Dns_super(dns_name,dns_block_size,dns_getport,dns_putport,dns_checkfield,dns_ncols,dns_colnames,dns_generic_colmask,dns_file) {
    var obj = new dns_super(dns_name,dns_block_size,dns_getport,dns_putport,dns_checkfield,dns_ncols,dns_colnames,dns_generic_colmask,dns_file);
    Object.preventExtensions(obj);
    return obj;
}

/**
 *
 * @param buf
 * @param ncols
 * @param row
 */
function buf_put_row(buf,ncols,row) {
    Buf.buf_put_string(buf,row.dr_name);
    Buf.buf_put_int32(buf,row.dr_time);
    for(var i=0;i<ncols;i++) {
        Dns.buf_put_rights(buf,row.dr_columns[i]);
    }
    Cs.buf_put_capset(buf,row.dr_capset);
}

/**
 *
 * @param buf
 * @param ncols
 * @param [row]
 * @returns {dns_row}
 */
function buf_get_row(buf,ncols,row) {
    if (row==undefined) row=Dns_row();
    // buf==rpcio || buffer
    row.dr_name=Buf.buf_get_string(buf);
    row.dr_time=Buf.buf_get_int32(buf);
    if (ncols > Net.DNS_MAXCOLUMNS) {
        Io.warn ('DNS: Warning: ncols='+ncols+' rowname='+row.dr_name);
    }
    var rights = [];
    for (var i=0; i< ncols; i++) {
        var rg = Dns.buf_get_rights(buf);
        rights.push(rg);
    }
    row.dr_columns=rights;
    row.dr_capset = Cs.buf_get_capset(buf);
    return row;
}

function buf_put_dir(buf,dir) {
    var i;
    Buf.buf_put_int32(buf,dir.dd_objnum);
    Buf.buf_put_int32(buf,dir.dd_ncols);
    Buf.buf_put_int32(buf,dir.dd_nrows);
    for (i in dir.dd_colnames) {
        var colname=dir.dd_colnames[i];
        Buf.buf_put_string(buf,colname);
    }
    Buf.buf_put_port(buf,dir.dd_random);
    for (i in dir.dd_rows) {
        var row=dir.dd_rows[i];
        buf_put_row(buf,dir.dd_ncols,row);
    }
    Buf.buf_put_int32(buf,dir.dd_time);
}

function buf_get_dir(buf,dir) {
    var i;
    if (dir==undefined) dir=Dns_dir();
    dir.dd_objnum=Buf.buf_get_int32(buf);
    dir.dd_ncols=Buf.buf_get_int32(buf);
    dir.dd_nrows=Buf.buf_get_int32(buf);
    var colnames=[];
    for(i=0;i<dir.dd_ncols;i++) {
        var colname=Buf.buf_get_string(buf);
        colnames.push(colname);
    }
    dir.dd_colnames=colnames;
    dir.dd_random=Buf.buf_get_port(buf);
    var rows=[];
    for(i=0;i<dir.dd_nrows;i++) {
        var row=buf_get_row(buf,dir.dd_ncols);
        rows.push(row);
    }
    dir.dd_rows=rows;
    dir.dd_time=Buf.buf_get_int32(buf);
    dir.dd_state=Dns_dir_state.DD_locked;
    dir.dd_live=0;
    return dir;
}

function buf_put_inode(buf,inode) {
    Buf.buf_put_int32(buf,inode.i_objnum);
    Buf.buf_put_cap(buf,inode.i_caps[0]);
    Buf.buf_put_cap(buf,inode.i_caps[1]);
    Buf.buf_put_int32(buf,inode.i_size);
    Buf.buf_put_int16(buf,inode.i_state);
}

function buf_get_inode(buf,inode) {
    if (inode==undefined) inode=Dns_inode(0,[Net.nilcap,Net.nilcap],0,0);
    inode.i_objnum=Buf.buf_get_int32(buf);
    inode.i_caps[0]=Buf.buf_get_cap(buf);
    inode.i_caps[1]=Buf.buf_get_cap(buf);
    inode.i_size=Buf.buf_get_int32(buf);
    inode.i_state=Buf.buf_get_int16(buf);
    return inode;
}

/*
 ** Calculate the logical partition offset for an inode
 */

function off_of_inode(objnum) {
    return (objnum * DNS_INODE_SIZE);
}

/**
 * @readonly
 * @enum
 * @type {{DD_invalid: number, DD_unlocked: number, DD_modified: number, DD_locked: number}}
 */
var Dns_dir_state = {
    /*
     ** Not used
     */
    DD_invalid: 1,        // not used
    /*
     ** new directory; not written to disk - can be modified
     */

    DD_unlocked: 2,
    /*
     ** Special case:
     ** Previously locked directory - now modified
     **  -> a new directory AFS object must be created!
     */

    DD_modified: 3,
    /*
     ** Read only directory (standard case)
     */
    DD_locked: 4
};

/*****************
 DNS Server Common
********************/

/**
 *
 * @param {string} dr_name
 * @param {number} dr_time
 * @param {number []} dr_columns
 * @param {capset} dr_capset
 * @constructor
 * @typedef {{dr_name:string, dr_time:number, dr_columns:number [], dr_capset:capset}} dns_row~obj
 * @see dns_row~obj
 */
var dns_row = function (dr_name, dr_time, dr_columns, dr_capset) {
    this.dr_name = dr_name;           // string: The row name
    this.dr_time = dr_time;           // integer: Time stamp
    this.dr_columns = dr_columns;     // rights_bits array: The rights mask
    this.dr_capset = dr_capset;       // capset: Row capability set
};

/**
 *
 * @param {string} dr_name
 * @param {number} dr_time
 * @param {* []} dr_columns
 * @param {capset} dr_capset
 * @returns {dns_row}
 */
function Dns_row(dr_name, dr_time, dr_columns, dr_capset) {
    var obj = new dns_row(dr_name, dr_time, dr_columns, dr_capset);
    Object.preventExtensions(obj);
    return obj;
}

/**
 *
 * @param {number} dd_objnum
 * @param {number} dd_ncols
 * @param {number} dd_nrows
 * @param {string []} dd_colnames
 * @param {port} dd_random
 * @param {dns_row []} dd_rows
 * @param {(Dns_dir_state.DD_invalid|*)} dd_state
 * @param {number} dd_time
 * @param {number} dd_live
 * @constructor
 * @typedef {{dd_objnum, dd_ncols, dd_nrows, dd_colnames: string [], dd_random: port, dd_rows:dns_Row [],
 *            dd_state:(Dns_dir_state.DD_invalid|*), dd_time, dd_live, dd_lock: lock}} dns_dir~obj
 * @see dns_dir~obj
 * @see dns_dir~meth
 */

var dns_dir = function (dd_objnum, dd_ncols, dd_nrows, dd_colnames, dd_random, dd_rows, dd_state, dd_time, dd_live) {
    this.dd_objnum = dd_objnum;                 // int: The directory index number
    this.dd_ncols = dd_ncols;                   // int: Number of columns
    this.dd_nrows = dd_nrows;                   // int: Number of rows in this dir
    this.dd_colnames = dd_colnames;             // string array: The column names
    this.dd_random = dd_random;                 // port: Random check number
    this.dd_rows = dd_rows||[];                 // dns_row array: All the rows
    this.dd_state = dd_state||Dns_dir_state.DD_invalid;         // dns_dir_state: Status of the directory
    this.dd_time = dd_time||0;                  // int: Time stamp
    this.dd_live = dd_live||0;                  // int; Live time [0..MAXLIVE]
    this.dd_lock = Sch.Lock();
};
/**
 *
 * @param {number} dd_objnum
 * @param {number} dd_ncols
 * @param {number} dd_nrows
 * @param {string []} dd_colnames
 * @param {port} dd_random
 * @param {dns_row []} dd_rows
 * @param {(Dns_dir_state.DD_invalid|*)} dd_state
 * @param {number} dd_time
 * @param {number} dd_live
 * @returns {dns_dir}
 */
function Dns_dir(dd_objnum, dd_ncols, dd_nrows, dd_colnames, dd_random, dd_rows, dd_state, dd_time, dd_live) {
    var obj = new dns_dir(dd_objnum, dd_ncols, dd_nrows, dd_colnames, dd_random, dd_rows, dd_state, dd_time, dd_live);
    Object.preventExtensions(obj);
    return obj;
}

/**
 * @typedef {{
 * lock:dns_dir.lock,
 * unlock:dns_dir.unlock
 * }} dns_dir~meth
 */
/** Lock directory - can block
 *
 */
dns_dir.prototype.lock = function () {
    this.dd_lock.acquire();
};


dns_dir.prototype.try_lock = function () {
    return this.dd_lock.try_acquire();
};

/** Unlock directory
 *
 */
dns_dir.prototype.unlock = function () {
    this.dd_lock.release();
};

dns_dir.prototype.init = function (dd_colnames,dd_state,dd_time,dd_live) {
    this.dd_colnames=dd_colnames;
    this.dd_ncols=dd_colnames.length;
    this.dd_rows=[];
    this.dd_random = Net.uniqport();
    this.dd_state=dd_state||Dns_dir_state.DD_invalid;
    this.dd_time=dd_time||0;
    this.dd_live=dd_live||0;
    this.dd_lock.init();
};

/** Calculate the size of a directory structure.
 *
 * @returns {number}
 */
dns_dir.prototype.size = function () {
    var self=this;
    var size=0;
    size=4*Buf.SIZEOF_INT32; // dd_objnum,dd_ncols,dd_nrows,dd_time
    Array.iter(self.dd_colnames,function (col) {
        size=size+col.length+1;
    });
    size=size+Buf.PORT_SIZE;
    Array.iter(self.dd_rows, function (row) {
        size=size+Buf.SIZEOF_INT32+row.dr_name.length+1+Cs.CAPSET_SIZE+Array.length(row.dr_columns)*Dns.RIGHTS_SIZE;
    });
    return size;
};


/** DNS Server Common
 *
 * @type {{CACHE_GC_TIME: number, DEF_BLOCK_SIZE: number, DEF_INODE_ENTRIES: number, DEF_INODE_SIZE: number, DEF_DIR_ENTRIES: number, DEF_DIR_BUFSIZE: number, DEF_MAGIC_SIZE: number, DNS_MAX_LIVE: number, DNS_INODE_SIZE: number, MAGIC_STR: string, Dns_dir_state: {DD_invalid: number, DD_unlocked: number, DD_modified: number, DD_locked: number}, Dns_mode: {DNSMODE_ONECOPY: number, DNSMODE_TWOCOPY: number}, Dns_row: Dns_row, Dns_dir: Dns_dir, Dns_cache_parameter: Function, Dns_inode: Dns_inode, Dns_super: Dns_super, Fs_server: Fs_server, Fs_state: {FS_down: number, FS_up: number, FS_unknown: number}, buf_put_row: buf_put_row, buf_get_row: buf_get_row, buf_put_dir: buf_put_dir, buf_get_dir: buf_get_dir, buf_put_inode: buf_put_inode, buf_get_inode: buf_get_inode, off_of_inode: off_of_inode}}
 */
module.exports = {
    CACHE_GC_TIME : CACHE_GC_TIME,
    DEF_BLOCK_SIZE : DEF_BLOCK_SIZE,
    DEF_INODE_ENTRIES : DEF_INODE_ENTRIES,
    DEF_INODE_SIZE : DEF_INODE_SIZE,
    DEF_DIR_ENTRIES :DEF_DIR_ENTRIES,
    DEF_MAGIC_SIZE: DEF_MAGIC_SIZE,
    DNS_MAX_LIVE : DNS_MAX_LIVE,
    DNS_INODE_SIZE : DNS_INODE_SIZE,
    MAGIC_STR : MAGIC_STR,

    dns_col_bits:dns_col_bits,

    Dns_dir_state:Dns_dir_state,
    Dns_mode: Dns_mode,

    Dns_row: Dns_row,
    Dns_dir: Dns_dir,

    Dns_cache_parameter : Dns_cache_parameter,
    Dns_inode : Dns_inode,
    Dns_super : Dns_super,
    Fs_server : Fs_server,
    Fs_state : Fs_state,
    buf_put_row : buf_put_row,
    buf_get_row : buf_get_row,
    buf_put_dir : buf_put_dir,
    buf_get_dir : buf_get_dir,
    buf_put_inode : buf_put_inode,
    buf_get_inode : buf_get_inode,
    off_of_inode : off_of_inode
};
