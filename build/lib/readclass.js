// Read agent class from file 
var Jam = require('./jamlib.debug');
var util = require('util');

// Create the JAM and JAM world consisting initially of one logical node
// at position {x=0,y=0} with number 0
var JAM = Jam.Jam({
  print:function (msg) {console.log(msg);},
  verbose:1,
});
JAM.init();

JAM.readClass(process.argv[2],{verbose:1});

