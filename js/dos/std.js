/**
 **      ==============================
 **       OOOO        O      O   OOOO
 **       O   O       O     O O  O   O
 **       O   O       O     O O  O   O
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
 **    $INITIAL:     (C) 2015-2016 BSSLAB
 **    $CREATED:     4/16/15 by sbosse
 **    $VERSION:     1.2.5
 **
 **    $INFO:
 **
 **  DOS: Standard Command Request Interface
 **
 **    $ENDINFO
 */

var log = 0;

var util = Require('util');
var Io = Require('com/io');
var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;

/**
 * Standard Request RPC Interface
 *
 * @param {rpcint} rpc
 * @constructor
 * @typedef {{rpc:rpcint}} stdint~obj
 * @see stdint~obj
 * @see stdint~meth
 */
var stdint = function (rpc) {
    this.rpc=rpc;
};
/**
 * @typedef {{std_info:stdint.std_info,std_age:stdint.std_age,std_destroy:stdint.std_destroy,
 *            std_restrict:stdint.std_restrict,std_status:stdint.std_status}} stdint~meth
 */

/**
 *
 * @param {capability} cap
 * @param {function((Status.STD_OK|*))} callback
 */

stdint.prototype.std_age = function (cap,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.STD_AGE;
    Io.log((log<10)||('std_age: '+Rpc.Print.rpcio(rpcio)));
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<10)||('std_age returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
        }]
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Std.std_age');
            callback(Status.STD_SYSERR);
        }
    });
};

/**
 *
 * @param {capability} cap
 * @param {function((Status.STD_OK|*))} callback
 */
stdint.prototype.std_destroy = function (cap,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.STD_DESTROY;
    Io.log((log<10)||('std_destroy: '+Rpc.Print.rpcio(rpcio)));
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<10)||('std_destroy returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
        }, function (e) {
            self.rpc.router.pkt_discard(rpcio);
            if (typeof e == 'number') callback(e); else {
                Io.printstack(e,'Std.std_destroy');
                callback(Status.STD_SYSERR);
            }
        }]
    ])
};


/**
 *
 * @param {capability} cap
 * @param {function((Status.STD_OK|*),string|undefined)} callback
 */
stdint.prototype.std_info = function (cap,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.STD_INFO;
    Io.log((log<10)||('std_info: '+Rpc.Print.rpcio(rpcio)));
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            rpcio.pos=0;
            Io.log((log<10)||('std_info returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            var data;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status||stat;
            if (stat == Status.STD_OK) data=Buf.buf_get_string(rpcio);
            self.rpc.router.pkt_discard(rpcio);
            callback(stat,data);
            }]
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        Io.printstack(e,'Std.std_info');
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,e);
    });
};

/**
 *
 * @param {capability} cap
 * @param {number} mask
 * @param {function((Status.STD_OK|*),capability|undefined)} callback
 */
stdint.prototype.std_restrict = function (cap,mask,callback) {
    var self=this;
    if (mask == Rights.PRV_ALL_RIGHTS) {
        callback(Status.STD_OK,cap);
    } else {
        var rpcio = self.rpc.router.pkt_get();
        rpcio.header.h_port = cap.cap_port;
        rpcio.header.h_priv = cap.cap_priv;
        rpcio.header.h_command = Command.STD_RESTRICT;
        Buf.buf_init(rpcio);
        /*
        *  ----------
        *  mask (int16)
        *  ----------
        *  priv (privat)
        *  ----------
        */
        Buf.buf_put_int16(rpcio,mask);
        Io.log((log < 1) || ('std.std_restrict: ' + Rpc.Print.rpcio(rpcio)));
        Sch.ScheduleBlock([
            [Sch.Bind(self.rpc, self.rpc.trans), rpcio],
            [function () {
                rpcio.pos=0;
                Io.log((log < 1) || ('std.std_restrict returned ' + Rpc.Print.rpcio(rpcio)));
                var stat = rpcio.status;
                var priv = undefined;
                var capr = undefined;
                if (stat == Status.STD_OK) stat = rpcio.header.h_status;
                // TODO: buf.size>0 else rpcio.header.hdr_priv...
                if (stat == Status.STD_OK) {
                    priv = Buf.buf_get_priv(rpcio);
                    capr = Net.Capability(cap.cap_port,priv);
                }
                self.rpc.router.pkt_discard(rpcio);
                callback(stat, capr);
            }]
        ],function (e) {
            self.rpc.router.pkt_discard(rpcio);
            if (typeof e != 'number') Io.inspect(e);
            if (typeof e == 'number') callback(e,undefined); else {
                Io.printstack(e,'Std.std_restrict');
                callback(Status.STD_SYSERR,undefined);
            }
        })
    }
};

/**
 *
 * @param {capability} cap
 * @param {function((Status.STD_OK|*),string|undefined)} callback
 */
stdint.prototype.std_status = function (cap,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Net.Command.STD_STATUS;
    Io.log((log<10)||('std_status: '+Rpc.Print.rpcio(rpcio)));
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            rpcio.pos=0;
            Io.log((log<10)||('std_status returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            var data;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status;
            if (stat == Status.STD_OK) data=Buf.buf_get_string(rpcio);
            self.rpc.router.pkt_discard(rpcio);
            callback(stat,data);
        }]
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e,undefined); else {
            Io.printstack(e,'Std.std_status');
            callback(Status.STD_SYSERR,e);
        }
    });
};

/**
 *
 * @param {capability} cap
 * @param {* []} params name:string*value:string []
 * @param {function((Status.STD_OK|*))} callback
 */
stdint.prototype.std_setparams = function (cap,params,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Net.Command.STD_SETPARAMS;
    if (Array.length(params)==0) {
        callback(Status.STD_ARGBAD);
        return;
    }
    Buf.buf_put_int16(rpcio,Array.length(params));
    for (var i in params) {
        var pv = params[i];
        if (Array.length(pv)!=2) {
            callback(Status.STD_ARGBAD);
            return;
        }
        Buf.buf_put_string(rpcio,pv[0]);
        Buf.buf_put_string(rpcio,pv[1]);
    }
    Io.log((log<10)||('std_setparams: '+Rpc.Print.rpcio(rpcio)));
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            rpcio.pos=0;
            Io.log((log<10)||('std_setparams returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            var data;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
        }]
    ],function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Std.std_setparams');
            callback(Status.STD_SYSERR);
        }
    });
};

/**
 *
 * @param {capability} cap
 * @param {function((Status.STD_OK|*))} callback
 */

stdint.prototype.std_touch = function (cap,callback) {
    var self=this,
        rpcio = self.rpc.router.pkt_get();
    rpcio.header.h_port=cap.cap_port;
    rpcio.header.h_priv=cap.cap_priv;
    rpcio.header.h_command=Command.STD_TOUCH;
    Io.log((log<10)||('std_age: '+Rpc.Print.rpcio(rpcio)));
    Sch.ScheduleBlock([
        [Sch.Bind(self.rpc,self.rpc.trans),rpcio],
        [function () {
            Io.log((log<10)||('std_touch returned '+Rpc.Print.rpcio(rpcio)));
            var stat=rpcio.status;
            if (stat == Status.STD_OK) stat=rpcio.header.h_status;
            self.rpc.router.pkt_discard(rpcio);
            callback(stat);
        }]
    ], function (e) {
        self.rpc.router.pkt_discard(rpcio);
        if (typeof e == 'number') callback(e); else {
            Io.printstack(e,'Std.std_touch');
            callback(Status.STD_SYSERR);
        }
    });
};



module.exports = {
    /**
     *
     * @param {rpcint} rpc
     * @returns {stdint}
     */
    StdInt : function(rpc) {
        var obj = new stdint(rpc);
        Object.preventExtensions(obj);
        return obj;
    }
};
