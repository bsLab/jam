// A simple network connecting nodes with IP links
// perfromed by a system level agent. Additionaly, the system agent starts a user
// agent that migrates to the remote node if a link is established.
//
// Usage:
// 1. jx jamlibConnEx1.js [from:url] [n:#] [range:'<port0>-<port1>']
// 2. jx jamlibConnEx1.js to:'<dir>->[<ip>:]<ipport>|<port0>-<port1>' 
// <dir>='north',..,'ip',..
//

var Jam = require('./jamlib.debug');
var util = require('util');
var range;
if (Jam.environment.range) {
  var tokens= Jam.environment.range.split('-');
  if (tokens.length==2) {
    range=[Number(tokens[0]),Number(tokens[1])];
  }
}
// Create the JAM and JAM world consisting of one logical node
var JAM = Jam.Jam({
  connections:{
    ip:{from:Jam.environment.from||'*', proto:'udp',num:Jam.environment.n||1,range:range},
    north:{from:'*',proto:'udp',to:Jam.environment.north},
    south:{from:'*',proto:'udp',to:Jam.environment.south}
  },
  log:{class:true},
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg)},
  verbose:Jam.environment.verbose||1,
});

JAM.init(function () {
  console.log('JAM initialized');
});

JAM.start(function () {
  console.log('JAM started')
  if (Jam.environment.to) 
    JAM.createAgent('system',{
      to:Jam.environment.to
    },3);
});

function system(options) {
  this.dir=options.dir;
  this.to=options.to;
  this.randomWalk=false;
  this.act = {
    init: function () {log('Starting '+this.to)},
    connect: function () {
      var parts=this.to.split("->");
      this.dir=DIR.from(parts[0]);  // from this port
      this.dir.ip=parts[1];         // to remote endpoint
      log('Connecting '+DIR.print(this.dir));
      connectTo(this.dir);
      this.randomWalk=parts[1].indexOf('-') != -1;
      if (this.randomWalk)
        create('user',{dir:DIR.IP('*'),randomWalk:true},1);
      else
        create('user',{dir:this.dir},1);      
    },
    wait:function () {
      log('Sleeping ..');
      sleep(10000)
    }
  }
  this.trans = {
    init:connect,
    connect:wait,
  }
  this.next=init;
}

function user(options) {
  this.dir=options.dir;
  this.life=options.life||10;
  this.randomWalk=options.randomWalk;
  this.act = {
    init: function () {
      log('Starting '+DIR.print(this.dir));
    },
    check: function () {
      var links=link(this.dir);
      if (links && links.length) log(links),this.dir=DIR.IP(random(links));
      sleep(100);
    },
    migrate: function () {
      log('Migrating to '+DIR.print(this.dir)+' ('+link(this.dir)+')');
      moveto(this.dir);
    },
    wait:function () {
      log('Sleeping ..');
      sleep(300)
    },
    terminate: function () { 
      log('Terminate.');
      kill()
    }
  }
  this.trans = {
    init:check,
    check: function () {return link(this.dir)==true?migrate:check },
    migrate:wait,
    wait:function () { this.life--; return this.life>0?wait:terminate }
  }
  this.next=init;
}

JAM.compileClass('system',system,1);
JAM.compileClass('user',user,1);

