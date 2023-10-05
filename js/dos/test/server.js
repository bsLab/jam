
"use strict";

var util = require('util');
var Io = require('../io');
var Net = require('../network');
var Sch = require('../scheduler');
var Conn = require('../connection');
var Buf = require('../buf');
var Rpc = require('../rpc');
var Router = require('../router');
var assert = require('../compat').assert;
var Status = Net.Status;

var privhostport = Net.port_name('server');
var pubhostport = Net.prv2pub(privhostport);


var scheduler = new Sch.Scheduler();
var conn = Conn.Connection(Net.uniqport(),'localhost',3000);
conn.init();
var router = Router.Router(pubhostport);
router.connection_broker(conn);
var rpc = Rpc.Rpc(router);
router.init();

var privportA = Net.port_name('myserverA');
var pubportA = Net.prv2pub(privportA);
var privportB = Net.port_name('remoteB');
var pubportB = Net.prv2pub(privportB);


var server = function (port) {
    // Server
    var self = this;
    var rpcio = router.pkt_get();

    this.init = function () {
        Io.out('[SERV] init');
        router.add_port(pubportB);
    };

    this.request = function () {
        Io.out('[SERV] request');
        rpcio.init();
        rpcio.operation = Rpc.Operation.GETREQ;
        rpcio.header.h_port = port;
        rpcio.header.h_status=undefined;
        rpcio.header.h_command=undefined;
        rpcio.header.h_priv=undefined;
        // Io.out(util.inspect(rpcio));
        rpc.getreq(rpcio);
        assert(rpcio.index!=-1,'RPCIO invalid');
    };

    this.service = function () {
        Io.out('[SERV] service');
        assert(rpcio.index!=-1,'RPCIO invalid');
        Io.out(Net.Print.header(rpcio.header));
        Io.out(Buf.buf_print(rpcio));
    };

    this.reply = function () {
        rpcio.header.h_status=Status.STD_OK;
        Buf.buf_put_string(rpcio,'<status>OK</status>');
        Io.out('[SERV] reply '+Net.Print.header(rpcio.header));
        rpc.putrep(rpcio);
        assert(rpcio.index!=-1,'RPCIO invalid');
    };

    this.transitions = function () {
        var trans;
        trans =
            [
                [undefined, this.init, function (self) {return true}],
                [this.init, this.request, function (self) {return true}],
                [this.request, this.service, function (self) {return !self.context.blocked}],
                [this.service, this.reply, function (self) {return true}],
                [this.reply, this.request, function (self) {return true}]
            ];
        return trans;
    };
    this.context = Sch.Context('server'+Net.Print.port(port), self);
};


var proc1 = new server(privportB);
scheduler.Add(proc1.context);
scheduler.Init();
scheduler.Run();

router.start(100);
