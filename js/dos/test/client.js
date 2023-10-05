
"use strict";

var Io = require('../io');
var Net = require('../network');
var Sch = require('../scheduler');
var Conn = require('../connection');
var Buf = require('../buf');
var Rpc = require('../rpc');
var Std = require('../std');
var Router = require('../router');
var util = require('util');
var assert = require('../compat').assert;
var Command = Net.Command;

var privhostport = Net.port_name('client');
var pubhostport = Net.prv2pub(privhostport);

var scheduler = Sch.Scheduler();
var conn = Conn.Connection(Net.uniqport(),'localhost',3000);
conn.init();
var router = Router.Router(pubhostport);
router.connection_broker(conn);
var rpc = Rpc.Rpc(router);
router.init();

var std = Std.Std(rpc);

var privportA = Net.port_name('localA');
var pubportA = Net.prv2pub(privportA);
var privportB = Net.port_name('remoteB');
var pubportB = Net.prv2pub(privportB);

var client = function (port) {
    // Client
    var self = this;
    var rpcio = router.pkt_get();
    var counter=0;

    this.init = function () { Io.out('[CLIE] init '+Net.Print.port(port));};
    this.delay = function () {
        Io.out('[CLIE] delay '+Net.Print.port(port));
        counter++;
        if (counter==1) {
            Sch.Delay(1000);
        } else {
            Sch.Suspend();
        }
    };
    this.transaction = function () {
        var i=0;
        Io.out('[CLIE] transaction '+Net.Print.port(port));
        Sch.ScheduleLoop(
            function() {
               return (i<2);
            },
            [
                [function () {
                    Io.out('[CLIE] trans '+i+': Init rpcio...');
                    rpcio.init();
                    rpcio.operation = Rpc.Operation.TRANS;
                    rpcio.header.h_port = port;
                    rpcio.header.h_priv.prv_obj = 45;
                    rpcio.header.h_priv.prv_rights = 0x80;
                    rpcio.header.h_priv.prv_rand = Net.uniqport();
                    rpcio.header.h_command = Command.STD_INFO;
                    Buf.buf_put_string(rpcio,'<text>hello world</text>');
                    Io.out(Net.Print.header(rpcio.header));
                }],
                [Sch.Bind(rpc,rpc.trans),rpcio],
                [function () {
                    Io.out('[CLIE] trans: got reply '+Net.Print.port(port));
                    Io.out(Net.Print.header(rpcio.header));
                    Io.out(Buf.buf_print(rpcio));
                }],
                [function () {
                    i++;
                }]

            ]);

    };

    this.info = function () {
        var cap,mystat,mydata;
        Io.out('[CLIE] info: transaction replied '+Net.Status.print(rpcio.header.h_status));
        cap=Net.Capability(port,Net.Private(12,1,Net.uniqport()));
        Io.out('[CLIE] info: cap is '+Net.Print.capability(cap));
        Sch.ScheduleBlock([
            [Sch.Bind(std,std.std_info),cap,function(stat,data) {
                mystat=stat;
                mydata=data;
            }],
            [function () {
                Io.out('[CLIE] info: returned '+Net.Status.print(mystat));
            }]
        ])
    };

    this.finalize = function () {
        Io.out('[CLIE] finalize: '+Net.Status.print(rpcio.header.h_status));
    };

    this.transitions = function () {
        var trans;
        trans =
            [
                [undefined, this.init,  function (self) {return true}],
                [this.init, this.delay, function (self) {return true}],
                [this.delay,this.transaction, function (self) {return !self.context.blocked}],
                [this.transaction, this.info, function (self) {return !self.context.blocked}],
                [this.info, this.finalize, function (self) {return !self.context.blocked}],
                [this.finalize, this.delay, function (self) {return true}]
            ];
        return trans;
    };
    this.context = Sch.Context('client'+Net.Print.port(port),self);
};

var server = function (port) {
    // Server
    var self = this;
    var rpcio = router.pkt_get();

    this.init = function () {
        Io.out('[SERV] init '+Net.Print.port(port));
    };
    this.request = function () {
        Io.out('[SERV] request '+Net.Print.port(port));
        rpcio.init();
        rpcio.operation = Rpc.Operation.GETREQ;
        rpcio.header.h_port = port;
        // Io.out(util.inspect(rpcio));
        Io.out(Net.Print.header(rpcio.header));
        rpc.getreq(rpcio);
        assert(rpcio.index!=-1,'RPCIO invalid');
    };
    this.service = function () {
        Io.out('[SERV] service '+Net.Print.port(port));
        assert(rpcio.index!=-1,'RPCIO invalid');
        Io.out(Buf.buf_print(rpcio));
    };
    this.reply = function () {
        Io.out('[SERV] reply '+Net.Print.port(port));
        rpcio.header.h_status='OK';
        Buf.buf_put_string(rpcio,'<xml><status>EOK</status></xml>');
        Io.out(Net.Print.header(rpcio.header));
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

router.add_port(pubportA);
var proc1 = new client(pubportA);
var proc2 = new server(privportA);
var proc3 = new client(pubportB);
//scheduler.Add(proc1.context);
//scheduler.Add(proc2.context);
scheduler.Add(proc3.context);
scheduler.Init();
scheduler.Run();

router.start(100);
