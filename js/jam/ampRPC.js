var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Command = Net.Command;
var Status = Net.Status;
var COM = Require('jam/ampCOM');

var current=none;
var Aios=none;

// Current node must be set!
// E.g., by using jamlib.setCurrentNode(0)

// typeof @obj = 
// { agent : string } |
// { node  : string } |
// 'processes' |
// 'agents' |
// 'links' |
// 'ports' |
// 'node' |
// 'ts' |
// { prv: .., .. }
//

// Server side implementation is in chan.js

var Std = {

  info : function (node,obj,callback) {
    var node0=current.node;
    var to=COM.lookupNode(node0,node);
    if (to) {
      to.link.control({
        cmd:COM.Command.STD_INFO,
        args:obj,
      },to.url, function (reply) {
        callback(reply)
      })
    }
  },
  
  status : function  (node,obj,callback) {
    var node0=current.node;
    var to=COM.lookupNode(node0,node);
    if (to) {
      to.link.control({
        cmd:COM.Command.STD_STATUS,
        args:obj,
      },to.url, function (reply) {
        callback(reply)
      })
    }
    
  },
}

var Run = {  
  stun : function (node,agent) {
  
  },
}

module.exports = {
  current : function (module) { current=module.current; Aios=module; },
  Run : Run,
  Std : Std
};

