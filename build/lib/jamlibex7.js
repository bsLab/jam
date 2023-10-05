// A simple agent: Watchdog test and ressource control
// 1. Computation by iteration inside an activity; 
// 2. Computation by iteration of activities

var Jam = require('./jamlib.debug');
var util = require('util');

// Create the JAM and JAM world consisting of one logical node
var JAM = Jam.Jam({
  nolimits:Jam.environment.nolimits,
  print:function (msg) {console.log(msg);},
  verbose:1,
});
JAM.init();
JAM.start();

// The agent class template (constructor function)
var ComputerClass = function (N,M,O) {
  /* Body variables */
  this.N=N; // Number of computation
  this.M=M;
  this.O=O;
  this.counter=0;
  this.start=0;
  this.stop=0;
  this.z='';
  this.i=0;
  
  this.fn = function (i) { return i+1 };
  /* Activities */
  this.act = {
    init: function () { 
      var a = Array(10000);
      /* Initilization */ 
      log('Starting with N='+this.N+' M='+this.M+' O='+this.O);
      dump('res');
      this.start=time();
    },
    compute: function () {
      log('Compute ..');
      dump('res');
      try {
        for (;this.i<this.N;this.i++) {
          this.counter=this.fn(this.i);
        }
      } catch (e) {log(e)};
      this.counter=0;
    },
    report: function () {
      this.stop=time();
      log('Loop done. '+int(((this.stop-this.start)/this.N)*1000000)+' nsec/iteration');
      this.start=time();    
    },
    step: function () {
      if (this.counter==0) log('Step ..');
      this.counter = this.fn(this.counter);
    },
    allocate: function () {
      this.stop=time();
      log('Activity loop done. '+int(((this.stop-this.start)/this.M)*1000)+' usec/iteration');
      log('Allocate ..');
      dump('res');
      this.start=time();
      for(var i=0;i<this.O;i++) this.z = this.z + ' ';
    },
    wait: function () {
      this.stop=time();
      log('Allocate loop done. '+(this.stop-this.start)+' msec');            
      dump('res');
      sleep(10);
    },
    terminate: function () {
      log('Terminate.');
      kill();
    }
  };
  this.trans = {
    init: compute,
    compute: report,
    report: step,
    step: function () { return this.counter<this.M?step:allocate },
    allocate: wait,
    wait:terminate
  };
  this.on = {
    error: function (exc,arg,act) {log('Got exception '+exc+': '+arg+' in '+act)},
    exit: function () { log('End.') }
  }
  this.next='init';
}

// Add agent class template
JAM.compileClass('ComputerClass',ComputerClass,1);

// Start agents
var a1 = JAM.createAgent('ComputerClass',[
  JAM.environment.N||2000000,
  JAM.environment.M||10000,
  JAM.environment.O||20000],1);

