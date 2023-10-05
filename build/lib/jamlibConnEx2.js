// A simple network connecting nodes with IP links.
// Linking is performed by a system-level agent using a broker.
//
// Usage:
// 0. jx rendezvous
// 1. jx jamlibConnEx2.js broker:'<ip>:<port>' name:'A'
// 2. jx jamlibConnEx2.js broker:'<ip>:<port>' name:'B' connect:'ip->A'

var Jam = process.release?require('./jamlib.debug'):require('jamlib');
var util = require('util');

// Create the JAM and JAM world consisting of one logical node
var JAM = Jam.Jam({
  connections:{
    ip:Jam.environment.broker?{
      from:'*',
      broker:Jam.environment.broker, 
      proto:'udp',
      num:1,
      name:Jam.environment.name
    }:undefined,
  },
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg)},
  verbose:Jam.environment.verbose||1,
});
JAM.init(function () {
  console.log('JAM initialized');
});

JAM.start(function () {
  console.log('JAM started')
  if (Jam.environment.connect) JAM.createAgent('system',{to:Jam.environment.connect},3);
});

function system(options) {
  this.dir=options.dir;
  this.to=options.to;
  this.act = {
    init: function () {log('Starting '+this.to)},
    connect: function () {
      var parts=this.to.split("->");
      this.dir=DIR.from(parts[0]);  // from this port
      this.dir.ip=parts[1];         // to remote endpoint
      log('Connecting '+DIR.print(this.dir));
      connectTo(this.dir);
    },
    wait:function () {sleep(10000)}
  }
  this.trans = {
    init:connect,
    connect:wait
  }
  this.next=init;
}

JAM.compileClass('system',system,0);

