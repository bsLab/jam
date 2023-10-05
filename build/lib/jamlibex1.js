// A simple two-agent system playing ping-pong
// and communicating by exchanging tuples

var Jam = require('./jamlib.debug');
var util = require('util');

// Create the JAM and JAM world consisting of one logical node
var JAM = Jam.Jam({
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg);},
  verbose:0,
});
JAM.init();
JAM.start();

// The agent class template (constructor function)
var PingPongClass = function (pingMe) {
  /* Body variables */
  this.pingMe=pingMe; // What to do next
  /* Activities */
  this.act = {
    init: function () { 
      /* Initilization */ 
      log('init '+(this.pingMe?'ping':'pong'));
    },
    ping: function () {
      // Send request
      log('ping');
      out(['PING',me()]);
      // sleep random time (blocks this activity)
      sleep(random(50,500));
    },
    pong: function () {
      // Send reply
      log('pong');
      out(['PONG',me()]);
      // sleep random time (blocks this activity)
      sleep(random(50,500));
    },
    wait: function () {
      if (this.pingMe)
        // Wait for reply
        inp(['PONG',_],function (t) {this.pingMe=false});
      else
        // Wait for request
        inp(['PING',_],function (t) {this.pingMe=true});      
    }
  };
  this.trans = {
    init: function () {return this.pingMe?ping:wait},
    ping: 'wait',
    pong: function () {return this.pingMe?ping:wait},
    wait: function () {return this.pingMe?pong:wait},
  };
  this.on = {
    error: function (e,error) {log('Exception '+e+': '+error)}
  }
  this.next='init';
}

// Analyze agent class template
print(JAM.analyze(PingPongClass,{level:2,classname:'PingPongClass',verbose:1}).report);

// Start agents
var a1 = JAM.createAgent(PingPongClass,[true],1);
var a2 = JAM.createAgent(PingPongClass,[false],1);

setInterval(function () {
  console.log(JAM.stats('node'));
},1000);
