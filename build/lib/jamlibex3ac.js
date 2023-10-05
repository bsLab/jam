// The agent class template (constructor function)
function PingPongClass(pingMe) {
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
      moveto(DIR.EAST);
    },
    wait: function () {
      // Signal handler wakes me up
      sleep();
    }
  };
  this.trans = {
    init: function () {return this.pingMe?ping:migrate},
    ping: wait,
    pong: function () {return this.pingMe?ping:wait},
    migrate: wait,
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
  this.next=init;
}
module.exports = {
  PingPongClass : PingPongClass
}
