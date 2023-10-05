// Process cluster network
//
var util = require('util');
var fork = require('child_process').fork;
var Jam = require('./jamlib.debug');

var JAM = Jam.Jam({
  fork:fork,
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg);},
  network: {
    cluster:true, // create physical processes
    rows:2,
    columns:2
  },
  log:{host:true,class:true,node:true},
  verbose:Jam.environment.verbose||1,
});
JAM.init();

function simpleAgent(options) {
  this.dir=undefined;
  this.dirs=options.dirs;
  this.life=options.life||10;
  this.act = {
    init: function () {
      this.dir=random(this.dirs);
      log('Starting '+DIR.print(this.dir));
      sleep(500);
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
    goback: function () {
      log('Going back to '+DIR.opposite(this.dir));
      moveto(DIR.opposite(this.dir));
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
    goback:terminate,
    wait:function () { this.life--; return this.life>0?wait:goback }
  }
  this.next=init;
}
// Analyze and compiler the agent class constructor function (for AIOS level 1)
if (JAM.master /** root node **/) 
  JAM.compileClass('simpleAgent',simpleAgent,true);

JAM.start();
// Start agents
var a1 = JAM.createAgentOn({x:0,y:0},'simpleAgent',{
  dirs:[JAM.DIR.EAST,JAM.DIR.SE,JAM.DIR.SOUTH]
},1);
