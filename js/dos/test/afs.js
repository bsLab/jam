/**
 * Created by sbosse on 4/27/15.
 */
"use strict";

var Io = require('../io');
var Net = require('../network');
var Sch = require('../scheduler');
var Conn = require('../connection');
var Rpc = require('../rpc');
var Std = require('../std');
var Afs = require('../afs');
var Router = require('../router');
var util = require('util');
var assert = require('../compat').assert;
var Command = Net.Command;

var privhostport = Net.port_name('client');
var pubhostport = Net.prv2pub(privhostport);

var scheduler = new Sch.Scheduler();
var conn = Conn.Connection(Net.uniqport(),'localhost',3000);
conn.init();
var router = Router.Router(pubhostport);
router.connection_broker(conn);
var rpc = Rpc.Rpc(router);
router.init();
var afs = Afs.afs(rpc);


scheduler.Init();
scheduler.Run();

router.start(100);
