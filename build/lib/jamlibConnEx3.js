// A simple network connecting two nodes with IP links. 
// Here with oneway links and w/o link negotiation.
//
// Usage:
// 1. jx jamlibConnEx3.js from:10001 to:10002
// 2. jx jamlibConnEx3.js from:10002 to:10001

var Jam = process.release?require('./jamlib.debug'):require('jamlib');
var util = require('util');

// Create the JAM and JAM world consisting of one logical node
var JAM = Jam.Jam({
  connections:{
    ip:{
      from:Jam.environment.from||'*', 
      to:Jam.environment.to, 
      proto:'udp', 
      oneway:true
    },
  },
  log:{class:true,node:false},
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg)},
  verbose:Jam.environment.verbose||1,
});
JAM.init(function () {
  console.log('JAM initialized');
});

JAM.start(function () {
  console.log('JAM started')
  if (Jam.environment.to) JAM.createAgent('user',{to:Jam.environment.to},2);
});


function user(options) {
  this.dir=options.dir;
  this.to=options.to;
  this.life=options.life||10;
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
    wait:function () {
      log('Sleeping ..');
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
    migrate:wait,
    wait:function () { this.life--; return this.life>0?wait:terminate }
  }
  this.next=init;
}

JAM.compileClass('user',user,0);

