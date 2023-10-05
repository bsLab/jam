/**
 * Created by sbosse on 3/4/15.
 */
var Types = require('./afvm_types');
var Io = require('./io');
var Code = require('./afvm_code');
var Stack = require('./afvm_stack');
var Proc = require('./afvm_processor');
var Man = require('./afvm_manager');
var Dict = require('./afvm_dictionary');
var Que = require('./afvm_queue');
var Net = require('./network');
var Buf = require('./buf');
var Sch = require('./scheduler');
var Conn = require('./connection');
var Rpc = require('./rpc');
var Vm = require('./afvm_vm');
var Seg = require('./afvm_seg');
var Fs = require('fs');
var util = require('util');
var Router = require('./router');
var assert = require('./compat').assert;
var Status = Net.Status;

var privhostport = Net.port_name('server');
var pubhostport = Net.prv2pub(privhostport);

const VM_MAX=4;
const CF_MAX=32;
const CF_SIZE=4096;
const LUT_ROW_SIZE=4;
const WORD_SIZE=16;
const MAX_PROC=32;
const STACK_SIZE=128;

function start(arg) {
    var scheduler = new Sch.Scheduler();
    var ccs = Seg.Segment(CF_SIZE*32);
    var coding = new Code.Coding(16,false);
    var manager = new Man.Manager(MAX_PROC,VM_MAX,CF_MAX);
    var dictionary = new Dict.Dictionary();
    var vm = new Vm.VM(arg,STACK_SIZE,CF_SIZE,WORD_SIZE,LUT_ROW_SIZE,ccs,manager);
    manager.Add(vm);
    var processor = vm.processor;
    var filename='/tmp/test.hex';
    var buf=Fs.readFileSync(filename,'utf8');

    var off = processor.Code_read(0,0,buf);
    console.log(arg+':'+off);
    console.log(arg+':'+processor.Code_print(0,0));

    console.log(arg+':'+vm.stack.Print());
    var pi = manager.NewProc(vm.id,Man.Random(1,65536),0,0,0);
    var pro = manager.GetProc(pi);
    Io.out(vm.processor.Code_print(manager.GetProc(pi).pro_cfroot));
    var t = new Types.Token(pi,Types.Token_colour.TK_PRO,"agent","");
    scheduler.Add(vm.context);
    scheduler.Add(manager.context);
    scheduler.Init();
    scheduler.Schedule();
    scheduler.Schedule();
    scheduler.Schedule();
    manager.tq.Outq(t);
    for(var i=0;i<12;i++) console.log(scheduler.Schedule());
    Io.out(vm.stack.Print());
/*
    vm.processor.Enter(t);
    vm.Execute();
    vm.Execute();
    vm.Execute();
    vm.Execute();
    vm.processor.Leave(t);
    console.log(arg+':'+vm.processor.Info(t.tk_pi));
    console.log(arg+':'+vm.stack.Print());
 */
}
//start(0);
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
