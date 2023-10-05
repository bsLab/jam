// A simple network connecting nodes with UDP-AMP links (ip)

var Jam = process.release?require('./jamlib.debug'):require('jamlib');
var util = require('util');

// Create the JAM and JAM world consisting of one logical node
var JAM = Jam.Jam({
  connections:{
    ip:Jam.environment.server?{from:Jam.environment.server}:undefined,
    north:{from:'*',proto:'udp',to:Jam.environment.north},
    south:{from:'*',proto:'udp',to:Jam.environment.south}
  },
  nocp:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg)},
  verbose:Jam.environment.verbose||1,
});
JAM.init(function () {
  console.log('JAM initialized');
});

JAM.start(function () {
  console.log('JAM started')
  if (Jam.environment.connect) { 
    console.log('LINK to '+Jam.environment.connect);
    // Connect dynamically
    JAM.connectTo(Jam.environment.connect);
  }
});

