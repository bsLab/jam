// A simple two-agent system playing ping-pong
// and communicating by exchanging signals.
// Each agent is processed on a different logical node.

var Jam = require('./jamlib.debug');
var util = require('util');

// Create the JAM and JAM world consisting initially of one logical node
// at position {x=0,y=0} with number 0
var JAM = Jam.Jam({
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg);},
  verbose:1,
});
// Event Notification //
JAM.on('node+',function (node) {
  // Notification about nodes
  console.log('node+: Node '+node.id +' created!');
});
JAM.on('agent+',function (pro) {
  // Notification about agent process creation
  console.log('agent+: Agent '+pro.agent.id+' on node '+pro.node.id +' created!');
});
JAM.on('agent-',function (pro) {
  // Notification about agent process destruction
  console.log('agent-: Agent '+pro.agent.id+' on node '+pro.node.id +' destroyed!');
});
JAM.on('signal+',function (pro,node,sig,arg,from) {
  // Notification about signal handling
  console.log('signal: Signal '+ sig +' from agent '+from);
});

JAM.init();

// Add another node at position {x=1,y=0} with number 1
JAM.addNodes([{x:1,y:0}]);
JAM.connectNodes([{x1:0,y1:0,x2:1,y2:0}]);

console.log('My nodes are (by number): ['+JAM.getNodeName(0)+','+JAM.getNodeName(1)+']');
console.log('My nodes are (by position): ['+JAM.getNodeName({x:0,y:0})+','+JAM.getNodeName({x:1,y:0})+']');
JAM.readClass('jamlibex3ac.js',{verbose:1});

JAM.start();

// Read agent class template from file

// Start agents
var a1 = JAM.createAgent('PingPongClass',[true],1);

