// A simple two-agent system 
// communicating by using eval and listen tuple access

var Jam = require('./jamlib.debug');
var util = require('util');

// Create the JAM and JAM world consisting of one logical node
var JAM = Jam.Jam({
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg);},
  verbose:1,
});
JAM.init();
JAM.start();

// The agent class templates (constructor function)
var Provider = function Provider() {
  /* Body variables */
  this.energy=0;
  /* Activities */
  this.act = {
    init: function () { 
      /* Initilization */ 
      log('Provider init and listening');
      listen(['ENERGY',_],function (t) {
        log(t);
        this.energy=t[1];
        t[1]=random(1,t[1]);
        return t;
      });
    },
    wait: function () {
      log('Provider sleeping with '+this.energy);
      sleep(100);
    }
  };
  this.trans = {
    init: 'wait',
    wait: 'wait'
  };
  this.on = {
    error: function (e,error) {log('Exception '+e+': '+error)}
  }
  this.next='init';
}
var Consumer = function Consumer() {
  /* Body variables */
  this.energy=0;
  /* Activities */
  this.act = {
    init: function () { 
      /* Initilization */ 
      log('Consumer init');
    },
    percept: function () {
      log('Consumer eval');
      evaluate(['ENERGY',100],function (t) {
        log(t);
        this.energy=t[1];
      });
    },
    wait: function () {
      log('Consumer sleeping with '+this.energy);
      sleep(100);
    }
  };
  this.trans = {
    init: 'wait',
    wait: 'percept',
    percept: 'wait'
  };
  this.on = {
    error: function (e,error) {log('Exception '+e+': '+error)}
  }
  this.next='init';
}

// Analyze agent class template
print(JAM.analyze(Provider,{level:2,verbose:1}).report);
print(JAM.analyze(Consumer,{level:2,verbose:1}).report);

// Start agents
var a1 = JAM.createAgent(Provider,{},1);
var a2 = JAM.createAgent(Consumer,{},1);

if (0) setInterval(function () {
  console.log(JAM.stats('node'));
},1000);
