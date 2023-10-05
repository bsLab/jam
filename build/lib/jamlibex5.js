var Jam = require('/opt/JAM/lib/jamlib');
var Win = require('/opt/JAM/lib/libx11').Windows;
var Io = require('/opt/JAM/lib/libio').Io;
var util = require('util');
var io = Io({/*current:Jam.Aios.current*/});

var options = {

}

var JAM = Jam.Jam({
  nolimits:true,  // Disable check-pointing (only useful with known agent behaviour)
  print:function (msg) {console.log(msg);},
  network:{
    rows:25,
    columns:25,
    connect : function (dir) {
      
    }
  },
  verbose:1,
});

