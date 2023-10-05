var Io = require('../io');
var Net = require('../network');
var Buf = require('../buf');
var Rpc = require('../rpc');
var util = require('util');
var Rpc = require('../rpc');
var Conn = require('../connection');

var hostport = Net.uniqport();
var conn = Conn.UdpConnection(hostport,'localhost','4000');
conn.receive(function(rpcio) {
});

