// A simple network connecting two nodes with HTTP IP links. 
// Here with multicast link (P2N) and separate link negotiation for each connection.
//
// Usage:
// 1. jx jamlibConnEx3.js from:10001 to:10002
// 2. jx jamlibConnEx3.js from:10002 to:10001

var Jam = require('./jamlib.debug');
var util = require('util');

// Create the JAM and JAM world consisting of one logical node
var JAM = Jam.Jam({
  connections:{
    ip:{
      from:Jam.environment.from, 
      to:Jam.environment.to, 
      proto:'http', 
      multicast:true  // always true
    },
  },
  log:{class:true,node:false},
  logJam:{pid:true,time:true},
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:console.log,
  verbose:Jam.environment.verbose||1,
});
JAM.init(function () {
  console.log('JAM initialized!');
});

JAM.start(function () {
  console.log('JAM started!')
  JAM.compileClass('user',user,0);
  if (Jam.environment.to) JAM.createAgent('user',
    {
      to:Jam.environment.to,
      delay:Jam.environment.delay?Number(Jam.environment.delay):0
    },2);
});


function user(options) {
  this.dir=options.dir;
  this.backdir=none;
  this.to=options.to;
  this.life=options.life||50;
  this.here=true;
  this.delay=options.delay||0;
  this.act = {
    init: function () {
      this.dir=DIR.IP(this.to);  // from this port
      log('Starting '+DIR.print(this.dir));
      sleep(2000);
    },
    check: function () {
      log('Checking '+DIR.print(this.dir)+' ('+link(this.dir)+')');
      sleep(100);
    },
    migrate: function () {
      log('Migrating to '+DIR.print(this.dir)+' ('+link(this.dir)+')');
      moveto(this.dir);
    },
    work: function () {
      this.backdir=opposite(DIR.IP());
      log('Working ..  my back dir: '+DIR.print(this.backdir));
      this.here = !this.here;
      if (this.delay) sleep(this.delay);
    },
    goback: function () {
      log('Migrating to '+DIR.print(this.backdir)+' ('+link(this.backdir)+')');
      moveto(this.backdir);
    },
    wait:function () {
      log('Sleeping ..  ');
      sleep(1000)
    },
    terminate: function () { 
      log('Terminate.');
      kill()
    }
  }
  this.trans = {
    init:check,
    check: function () {return link(this.dir)?migrate:check },
    migrate:work,
    goback:work,
    work:function () {  
      this.life--; 
      if (this.life) return this.here?migrate:goback;
      else return wait;
    },
    wait:function () { return terminate }
  }
  this.next=init;
}

