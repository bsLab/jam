var Jam = process.version?require('./jamlib.debug'):require('jamlib');
var util = require('util');

var ac = function () {
  this.x=0;
  this.act = {
    init: function () {
      log('Starting ...');
    },
    fail: function () {
      log('Failing ...');

      f(1)
    },
    end: function () {
      kill();
    }
  };
  
  this.trans = {
    init: function () {f(); return fail},
    fail: function () {return end}
  }
  this.on = {
    error: function (e,more,loc) { log('Got error: '+e+' in '+loc) }
  }
  this.next = 'init';
}
var myJam = Jam.Jam({
  print:console.log,
  verbose:1,
});
myJam.init();
myJam.start();

var a1 = myJam.createAgent(ac,[],1,'fail');
