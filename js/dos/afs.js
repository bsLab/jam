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
 **    $CREATED:     4/24/15 by sbosse.
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 **  DOS: AFS Client Interface
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
var Comp = Require('com/compat');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Rand = Comp.random;
var div = Comp.div;
var Status = Net.Status;
var Rights = Net.Rights;

/*
 ** AFS Commit flags
 */

var AFS_UNCOMMIT        = 0x0;
var AFS_COMMIT          = 0x1;
var AFS_SAFETY          = 0x2;

var AFS_DEFAULT_RIGHTS = [
    Rights.AFS_RGT_ADMIN|Rights.AFS_RGT_CREATE|Rights.AFS_RGT_DESTROY|Rights.AFS_RGT_MODIFY|Rights.AFS_RGT_READ,
    Rights.AFS_RGT_READ,
    Rights.AFS_RGT_READ
    ];

/**
 *
 * @param rpc
 * @constructor
 * @typedef {{rpc,std}} afsint~obj
 * @see afsint~obj
 * @see afsint~meth
 */
var afsint = function(rpc) {
    this.rpc=rpc;
    this.std=Std.StdInt(rpc);
};

/**
 * @typedef {{
 * afs_size:afsint.afs_size,
 * afs_delete:afsint.afs_delete,
 * afs_create:afsint.afs_create,
 * afs_read:afsint.afs_read,
 * afs_modify:afsint.afs_modify,
 * afs_insert:afsint.afs_insert,
 * afs_destroy:afsint.afs_destroy,
 * afs_sync:afsint.afs_sync,
 * afs_fsck:afsint.afs_fsck,
 * afs_disk_compact:afsint.afs_disk_compact
 * }} afsint~meth
 */
/** afs_size
 **      AFS server client stub: gets the size of a file.
 **
 ** Argument:
 **      cap:    capability of the file.
 **
 ** Return (by callback):
 **      stat:    gives the status of the operation
 **      size:    the size of the file.
 *
 *
 * @param cap
 * @param {function((Status.STD_OK|*),number)} callback
 */
afsint.prototype.afs_size = function (cap,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Net.Command.AFS_SIZE;
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<1)||('afs_size returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            var size=-1;
            if (stat == Net.Status.STD_OK) stat=rpcio.header.h_status||stat;
            if (stat==Net.Status.STD_OK) size=Buf.buf_get_int32(rpcio);

            self.rpc.router.pkt_discard(rpcio);
            callback(stat,size);
        }]
    ]);

};

/** afs_delete
 **      The AFS server "delete" client stub.
 **      Has a problem because size may not fit into the hdr.h_size field.
 **      For now we put the size in the buffer but in AMOEBA4 it can go in
 **      the header.
 ** Arguments:
 **  cap:        capability for the bullet file to modify
 **  offset:     where to make the change
 **  size:       num bytes to delete
 **  commit:     the commit and safety flags
 **
 ** Return:
 **  status
 **  newfile: capability for created file
 **
 *
 * @param cap
 * @param offset
 * @param size
 * @param commit
 * @param {function((Status.STD_OK|*),(capability|undefined))} callback
 */
afsint.prototype.afs_delete = function (cap,offset,size,commit,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Net.Command.AFS_DELETE;
    Buf.buf_put_int32(rpcio,offset);
    Buf.buf_put_int32(rpcio,size);
    Buf.buf_put_int16(rpcio,commit);

    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<1)||('afs_size returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            var newcap=undefined;

            if (stat == Net.Status.STD_OK) stat=rpcio.header.h_status||stat;
            if (stat==Net.Status.STD_OK) {
                newcap=Net.Capability(rpcio.header.h_port,Net.Copy.private(rpcio.header.h_priv));
            }

            self.rpc.router.pkt_discard(rpcio);
            callback(stat,newcap);
        }]
    ]);

};

/** afs_create
 **
 **      The AFS server "create file" client stub.
 **      It begins with a create transaction.  If the data in buf didn't
 **      fit in one transaction then we have do MODIFY transactions after
 **      that.
 **      We must not send "commit" until the last transaction.
 **
 **  Args:
 **      cap:        capability of the AFS server or a valid
 **                  file capability
 **      buf :       initial data for the file
 **      size:       num bytes data in buf
 **      commit:     the commit and safety flags
 **
 **  Return:
 **      err   :     status of the request
 **      newcap:     capability for the created file
 *
 *
 * @param cap
 * @param buf
 * @param size
 * @param commit
 * @param {function((Status.STD_OK|*),(capability|undefined))} callback
 */
afsint.prototype.afs_create = function (cap,buf,size,commit,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    var fsize;
    var stat=Net.Status.STD_OK;
    var n=0;
    var newcap=Net.nilcap;
    var frags = div(size,Net.AFS_REQBUFSZ);
    var boff = 0;
    Sch.ScheduleLoop(
        function () {
            return stat==Net.Status.STD_OK && n<=frags
        },
        [
            function () {
                rpcio.init();
                if (n == 0) {
                    rpcio.header.h_port = cap.cap_port;
                    rpcio.header.h_priv = Net.Copy.private(cap.cap_priv);
                    rpcio.header.h_command = Net.Command.AFS_CREATE;
                } else {
                    rpcio.header.h_port = cap.cap_port;
                    rpcio.header.h_priv = Net.Copy.private(newcap.cap_priv);
                    rpcio.header.h_command = Net.Command.AFS_MODIFY;
                }
                if (frags == 0) fsize = size;
                else if (n < frags) fsize = Net.AFS_REQBUFSZ;
                else fsize = size - boff;
                /*
                 *  +---
                 *  | off(int32)
                 *  | size(int32)
                 *  | flag(int16)
                 *  | data
                 *  |===
                 *  +---
                 */
                Buf.buf_put_int32(rpcio, boff);
                Buf.buf_put_int32(rpcio, fsize);
                Buf.buf_put_int16(rpcio, n == frags ? commit : 0);
                if (fsize > 0) Buf.buf_put_buf(rpcio, buf, boff, fsize);
            },
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        function () {
            if (rpcio.status == Net.Status.STD_OK) stat = rpcio.header.h_status || rpcio.status; else stat = rpcio.status;
            boff = boff + fsize;
            if (stat == Net.Status.STD_OK && n == 0) {
                newcap=Net.Capability(Net.Copy.port(rpcio.header.h_port), Net.Copy.private(rpcio.header.h_priv));
            }
            n++;
        }
    ],[
        [function() { self.rpc.router.pkt_discard(rpcio); callback(stat,newcap);}]
    ]);
};

/** afs_read
 **      The AFS server reader client stub.
 **
 ** Arguments:
 **  cap:        capability of file to be read
 **  buf:        the buffer where data is read into
 **  offset:     first byte to read from file
 **  size:       number of bytes requested to be read
 **
 ** Return:
 **  stat:        status of the request operation
 **  num:        number of actually read bytes
 *
 *
 * @param cap
 * @param buf
 * @param offset
 * @param size
 * @param {function((Status.STD_OK|*),number)} callback
 */
afsint.prototype.afs_read = function (cap,buf,offset,size,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    var fsize;
    var stat=Net.Status.STD_OK;
    var n=0;
    var num=0;
    var frags = div(size,Net.AFS_REQBUFSZ);
    var boff = 0;
    Sch.ScheduleLoop(function () {return stat==Net.Status.STD_OK && n<=frags}, [
        function () {
            /*
             ** +---
             *  | off(int32)
             *  | size(int32)
             *  |===
             *  | size(int32)
             *  | data
             *  +---
             */
            rpcio.init();
            rpcio.header.h_port=cap.cap_port;
            rpcio.header.h_priv=Net.Copy.private(cap.cap_priv);

            rpcio.header.h_command=Net.Command.AFS_READ;
            if (frags==0) fsize=size;
            else if (n<frags) fsize=Net.AFS_REQBUFSZ;
            else fsize=size-boff;
            Buf.buf_put_int32(rpcio,boff);
            Buf.buf_put_int32(rpcio,fsize);
        },
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        function () {
            if (rpcio.status==Net.Status.STD_OK) stat=rpcio.header.h_status||rpcio.status; else stat=rpcio.status;
            if (stat==Net.Status.STD_OK) {
                var rsize = Buf.buf_get_int32(rpcio);
                Io.log((log<1)||('afs_read: buffer boff='+boff+' rsize='+rsize));
                Buf.buf_get_buf(rpcio,buf,boff,rsize);
                boff=boff+rsize;
                num=num+rsize;
                n++;
            }
        }
    ],[
        function() {
            self.rpc.router.pkt_discard(rpcio);
            callback(stat,num);
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Afs.afs_read'); }
        if (typeof e == 'number') callback(e,0); else callback(Status.STD_SYSERR,0);
    });

};

/** afs_modify
 **      The AFS server "modify file" client stub.
 **      If the data in buf won't fit in one transaction then we have
 **      do several modify commands.
 **      We must not send "commit" until the last transaction.
 **
 **  Args:
 **      cap:        capability for the file to be modified
 **      buf :       initial data for the file
 **      offset:     where to make the change
 **      size:       num bytes data in buf
 **      commit:     the commit and safety flags
 **
 **  Return:
 **      err   :     status of the request
 **      newcap:     capability for the modified file
 **
 *
 *
 * @param cap
 * @param buf
 * @param size
 * @param offset
 * @param commit
 * @param {function((Status.STD_OK|*),(capability|undefined))} callback
 */
afsint.prototype.afs_modify = function (cap,buf,size,offset,commit,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    var fsize;
    var stat=Net.Status.STD_OK;
    var n=0;
    var newcap=Net.nilcap;
    var frags = div(size,Net.AFS_REQBUFSZ);
    var boff = 0;
    Sch.ScheduleLoop(function () {return stat==Net.Status.STD_OK && n<=frags}, [
        [ function () {
            rpcio.init();
            if(n==0) {
                rpcio.header.h_port=cap.cap_port;
                rpcio.header.h_priv=Net.Copy.private(cap.cap_priv);
            } else {
                rpcio.header.h_port=newcap.cap_port;
                rpcio.header.h_priv=Net.Copy.private(newcap.cap_priv);
            }
            rpcio.header.h_command=Net.Command.AFS_MODIFY;
            if (frags==0) fsize=size;
            else if (n<frags) fsize=Net.AFS_REQBUFSZ;
            else fsize=size-boff;
            /*
             *  +---
             *  | off(int32)
             *  | size(int32)
             *  | flag(int16)
             *  | data
             *  |===
             *  +---
             */
            Buf.buf_put_int32(rpcio,offset+boff);
            Buf.buf_put_int32(rpcio,fsize);
            Buf.buf_put_int16(rpcio,n==frags?commit:0);
            if (fsize>0) Buf.buf_put_buf(rpcio,buf,boff,fsize);
        }],
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            if (rpcio.status==Net.Status.STD_OK) stat=rpcio.header.h_status||rpcio.status; else stat=rpcio.status;
            boff=boff+fsize;
            n++;
            if (stat==Net.Status.STD_OK && n==0) {
                newcap=Net.Capability(Net.Copy.port(rpcio.header.h_port),Net.Copy.private(rpcio.header.h_priv));
            }
        }]
    ],[
        [function() { self.rpc.router.pkt_discard(rpcio); callback(stat,newcap);}]
    ]);
};

/** afs_insert
 **      The AFS server "insert file" client stub.
 **      If the data in buf won't fit in one transaction then we have
 **      do several modify commands.
 **      We must not send "commit" until the last transaction.
 **
 **  Args:
 **      cap:       capability for the file to be modified
 **      buf :       initial data for the file
 **      offset:     where to make the change
 **      size:       num bytes data in buf
 **      commit:     the commit and safety flags
 **
 **  Return:
 **      err   :     status of the request
 **      newcap:     capability for the modified file
 **
 *
 *
 * @param cap
 * @param buf
 * @param size
 * @param offset
 * @param commit
 * @param {function((Status.STD_OK|*),(capability|undefined))} callback
 */
afsint.prototype.afs_insert = function (cap,buf,size,offset,commit,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    var fsize;
    var stat=Net.Status.STD_OK;
    var n=0;
    var newcap=Net.nilcap;
    var frags = div(size,Net.AFS_REQBUFSZ);
    var boff = 0;
    Sch.ScheduleLoop(function () {return stat==Net.Status.STD_OK && n<=frags}, [
        [ function () {
            rpcio.init();
            if(n==0) {
                /*
                 ** Initial cap.  May be changed by AFS.
                 */
                rpcio.header.h_port=cap.cap_port;
                rpcio.header.h_priv=Net.Copy.private(cap.cap_priv);
            } else {
                rpcio.header.h_port=newcap.cap_port;
                rpcio.header.h_priv=Net.Copy.private(newcap.cap_priv);
            }
            rpcio.header.h_command=Net.Command.AFS_INSERT;
            if (frags==0) fsize=size;
            else if (n<frags) fsize=Net.AFS_REQBUFSZ;
            else fsize=size-boff;
            Buf.buf_put_int32(rpcio,offset+boff);
            Buf.buf_put_int32(rpcio,fsize);
            Buf.buf_put_int16(rpcio,n==frags?commit:0);
            Buf.buf_put_buf(rpcio,buf,boff,fsize);
        }],
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            if (rpcio.status==Net.Status.STD_OK) stat=rpcio.header.h_status||rpcio.status; else stat=rpcio.status;
            boff=boff+fsize;
            if (stat==Net.Status.STD_OK && n==0) {
                newcap=Net.Capability(Net.Copy.port(rpcio.header.h_port),Net.Copy.private(rpcio.header.h_priv));
            }
        }]
    ],[
        [function() { self.rpc.router.pkt_discard(rpcio); callback(stat,newcap);}]
    ]);
};

/** afs_destroy
 **      AFS server client stub: destroy a file.
 **
 ** Argument:
 **      cap:    capability of the file.
 **
 ** Return:
 **      err:    gives the status of the operation
 *
 *
 * @param cap
 * @param {function((Status.STD_OK|*))} callback
 */
afsint.prototype.afs_destroy = function (cap,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Net.Command.AFS_DESTROY;
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<1)||('afs_destroy returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat==Net.Status.STD_OK) stat=rpcio.header.h_status||stat;

            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
        }]
    ]);

};

/** afs_sync
 **      AFS server client stub: flushes committed files to disk
 **      The return value is the error status.
 *
 *
 * @param server
 * @param {function((Status.STD_OK|*))} callback
 */
afsint.prototype.afs_sync = function (server,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    rpcio.header.h_port=server.cap_port;
    rpcio.header.h_priv=server.cap_priv;
    rpcio.header.h_command=Net.Command.AFS_SYNC;
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<1)||('afs_sync returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat==Net.Status.STD_OK) stat=rpcio.header.h_status||stat;

            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
        }]
    ]);

};

/** afs_fsck
 **      AFS Server administrator stub routine for file system check.
 *
 *
 * @param server
 * @param {function((Status.STD_OK|*))} callback
 */
afsint.prototype.afs_fsck = function (server,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    rpcio.header.h_port=server.cap_port;
    rpcio.header.h_priv=server.cap_priv;
    rpcio.header.h_command=Net.Command.AFS_FSCK;
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<1)||('afs_fsck returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat==Net.Status.STD_OK) stat=rpcio.header.h_status||stat;

            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
        }]
    ]);

};

/** afs_disk_compact
 **      AFS server client stub: requests that the disk fragmentation
 **      be eliminated.
 **      The return value is the error status.
 *
 *
 * @param server
 * @param {function((Status.STD_OK|*))} callback
 */
afsint.prototype.afs_disk_compact = function (server,callback) {
    var self=this;
    var rpcio = this.rpc.router.pkt_get();
    rpcio.header.h_port=server.cap_port;
    rpcio.header.h_priv=server.cap_priv;
    rpcio.header.h_command=Net.Command.AFS_DISK_COMPACT;
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<1)||('afs_disk_compact returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat==Net.Status.STD_OK) stat=rpcio.header.h_status||stat;

            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
        }]
    ]);

};

/**
 *
 * @type {{AFS_UNCOMMIT: number, AFS_COMMIT: number, AFS_SAFETY: number, AFS_DEFAULT_RIGHTS: *[], AfsInt: Function}}
 */
module.exports = {
    AFS_UNCOMMIT:AFS_UNCOMMIT,
    AFS_COMMIT:AFS_COMMIT,
    AFS_SAFETY:AFS_SAFETY,
    AFS_DEFAULT_RIGHTS:AFS_DEFAULT_RIGHTS,
    /**
     *
     * @param {rpcint} rpc
     * @returns {afsint}
     */
    AfsInt: function(rpc) {
        var obj = new afsint(rpc);
        Object.preventExtensions(obj);
        return obj;
    }};
