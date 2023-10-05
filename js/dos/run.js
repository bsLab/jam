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
 **    $CREATED:     23/05/16 by sbosse.
 **    $VERSION:     1.3.1
 **
 **    $INFO:
 **
 **  JAMDOS: Run Server Client API
 **
 **
 **    $ENDOFINFO
 */

var log = 0;
var util = Require('util');
var Io = Require('com/io');
var trace = Io.tracing;
var current=none;
var Aios = none;


var Net = Require('dos/network');
var Rpc = Require('dos/rpc');
var Router = Require('dos/router');
var Compat = Require('com/compat');
var Perv = Compat.pervasives;
var String = Compat.string;
var Array = Compat.array;
var assert = Compat.assert;
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var DnsCom = Require('dos/dns_srv_common');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Json = Require('jam/jsonfn');
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;

var isNodeJS = Compat.isNodeJS();

var runint = function (rpc) {
  this.rpc=rpc;
}

/** Send agent code for execution (code.next points to next activity to be executed)
 *
 * @param {capability} cap
 * @param {string} code JSON+ format
 * @param {function((Status.STD_OK|*))} callback
 */
runint.prototype.ps_exec = function (cap,code,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.PS_EXEC;
    Buf.buf_init(rpcio);
    Buf.buf_put_string(rpcio,code);

    Io.log((log<1)||('ps_exec: '+Rpc.Print.rpcio(rpcio)));
    B([
        function () { self.rpc.trans(rpcio)},
        function () {
            rpcio.pos=0;
            Io.log((log<10)||('ps_exec returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status||stat;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
            }
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

/** Send agent code for migration (code.next points to current activity and must be computed on dest.).
 *
 * @param {capability} cap
 * @param {string} code JSON+ format
 * @param {function((Status.STD_OK|*))} callback
 */
runint.prototype.ps_migrate = function (cap,code,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.PS_MIGRATE;
    Buf.buf_init(rpcio);
    Buf.buf_put_string(rpcio,code);

    Io.log((log<1)||('ps_migrate: '+Rpc.Print.rpcio(rpcio)));
    B([
        function () { self.rpc.trans(rpcio)},
        function () {
            rpcio.pos=0;
            Io.log((log<10)||('ps_migrate returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status||stat;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
            }
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

/** Receive a code template.
 *
 * @param {capability} cap
 * @param {string} name Agent Class
 * @param {function((Status.STD_OK|*),string|undefined)} callback data:JSON+ format
 */
runint.prototype.ps_read = function (cap,name,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.PS_READ;
    Buf.buf_init(rpcio);
    Buf.buf_put_string(rpcio,name);

    Io.log((log<10)||('ps_write: '+Rpc.Print.rpcio(rpcio)));
    B([
        function () { self.rpc.trans(rpcio)},
        function () {
            rpcio.pos=0;
            Io.log((log<10)||('ps_read returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            var data;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status||stat;
            if (stat == Status.STD_OK) data=Buf.buf_get_string(rpcio);
            self.rpc.router.pkt_discard(rpcio);
            callback(stat,data);
            }
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

/** Send agent signal.
 *
 * @param {capability} cap
 * @param {string} signal JSON+ format
 * @param {function((Status.STD_OK|*))} callback
 */
runint.prototype.ps_signal = function (cap,code,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.PS_SIGNAL;
    Buf.buf_init(rpcio);
    Buf.buf_put_string(rpcio,code);

    Io.log((log<1)||('ps_signal: '+Rpc.Print.rpcio(rpcio)));
    B([
        function () { self.rpc.trans(rpcio)},
        function () {
            rpcio.pos=0;
            Io.log((log<10)||('ps_signal returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status||stat;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
            }
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
}

runint.prototype.ps_stun = function (cap,id,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.PS_STUN;
    Buf.buf_init(rpcio);
    Buf.buf_put_string(rpcio,id);

    Io.log((log<1)||('ps_stun: '+Rpc.Print.rpcio(rpcio)));
    B([
        function () { self.rpc.trans(rpcio)},
        function () {
            rpcio.pos=0;
            Io.log((log<10)||('ps_stun returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status||stat;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
            }
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
}

/** Send a code template.
 *
 * @param {capability} cap
 * @param {string} code JSON+ format
 * @param {function((Status.STD_OK|*))} callback
 */
runint.prototype.ps_write = function (cap,code,callback) {
    var self=this;
    var rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.PS_WRITE;
    Buf.buf_init(rpcio);
    Buf.buf_put_string(rpcio,code);

    Io.log((log<10)||('ps_write: '+Rpc.Print.rpcio(rpcio)));
    B([
        function () {self.rpc.trans(rpcio)},
        function () {
            rpcio.pos=0;
            Io.log((log<10)||('ps_write returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status||stat;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
            }
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });
};

module.exports = {
  /**
   *
   * @param {rpcint} rpc
   * @returns {stdint}
   */
  RunInt : function(rpc) {
      var obj = new runint(rpc);
      Object.preventExtensions(obj);
      return obj;
  },
  current:function (module) { current=module.current; Aios=module; }
}

