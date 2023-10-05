var jamlib = require('./jamlib.debug');
var util = require('util');
var N = 100;

print('Checkpoint 0: Creating JAM...');

// Create the JAM and JAM world consisting of one logical node
var JAM = jamlib.Jam({
  print:function (msg) {console.log(msg);},
  verbose:1,
});


print('Checkpoint 1: Starting JAM...');
JAM.init();
JAM.start();


print('Checkpoint 2: Creating IP ports ...');
JAM.createPort(JAM.DIR.IP(10001),{proto:'udp',multicast:true});
JAM.createPort(JAM.DIR.IP(10002),{proto:'http'});
