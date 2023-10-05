// A simple two-agent system playing ping-pong
// and communicating by exchanging signals.
// Each agent is processed on a different logical node.

var Jam = require('./jamlib.debug');
var util = require('util');

// Create the JAM and JAM world consisting initially of one logical node
// at position {x=0,y=0} with number 0
var JAM = Jam.Jam({
  log:{node:true},
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg);},
  network: {
    rows:1,
    columns:2,
    connect: function (link /* {x1,y1,x2,y2}|{from,to} */) { return true } // optional
  },
  verbose:1,
});
JAM.init();
// Add another node at position {x=1,y=0} with number 1
//JAM.addNodes([{x:1,y:0}]);
//JAM.connectNodes([{x1:0,y1:0,x2:1,y2:0}]);

console.log('My nodes are (by number): ['+JAM.getNodeName(0)+','+JAM.getNodeName(1)+']');
console.log('My nodes are (by position): ['+JAM.getNodeName({x:0,y:0})+','+JAM.getNodeName({x:1,y:0})+']');

// The agent class template (constructor function)
var PingPongClass = function (pingMe) {
  /* Body variables */
  this.pingMe=pingMe; // What to do next
  this.worker=undefined;  // Forked worker agent
  /* Activities */
  this.act = {
    init: function () { 
      /* Initilization */ 
      log('init '+(this.pingMe?'ping':'pong'));
      if (this.pingMe) {
        // Fork pong agent
        trans.update(init,init);
        this.worker=fork({pingMe:false});
        // Wait for second agent to finish migration
        trans.update(init,ping);
        sleep(500);
      } else {
        trans.update(init,migrate); 
      }
    },
    ping: function () {
      // Send request
      log('ping');
      if (this.worker) 
        send(this.worker,'PING');
      else
        send(myParent(),'PING');
      // sleep random time (blocks this activity)
      sleep(random(50,500));
    },
    pong: function () {
      // Send reply
      log('pong');
      if (this.worker) 
        send(this.worker,'PONG');
      else
        send(myParent(),'PONG');      
      // sleep random time (blocks this activity)
      sleep(random(50,500));
    },
    migrate: function () {
      log('migrate');
      moveto(DIR.EAST);
    },
    wait: function () {
      // Signal handler wakes me up
      log('wait')
      sleep();
    }
  };
  this.trans = {
    init: function () {return this.pingMe?ping:migrate},
    ping: 'wait',
    pong: function () {return this.pingMe?ping:wait},
    migrate: 'wait',
    wait: function () {return this.pingMe?pong:wait},
  };
  this.on = {
    'PING': function () {
      this.pingMe=true;
      wakeup();
    },
    'PONG': function () {
      this.pingMe=false;
      wakeup();
    },
    error: function (e,error) {log('Exception '+e+': '+error)}
  }
  this.next='init';
}

// Analyze agent class template
print(JAM.analyze(PingPongClass,{level:2,classname:'PingPongClass',verbose:1}).report);
JAM.start();

// Start agents
var a1 = JAM.createAgent(PingPongClass,[true],1);

