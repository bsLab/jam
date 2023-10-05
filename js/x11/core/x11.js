// Was index.js

var core = Require('x11/core/xcore');
var em = Require('x11/core/eventmask').eventMask;
var et = Require('x11/core/eventmask').eventType;
var server = Require('x11/core/xserver');
var pixmap = Require('x11/core/pixmap');

module.exports.createClient = core.createClient;
module.exports.createServer = server.createServer;
module.exports.eventMask = em;
module.exports.eventNumber = et;
module.exports.eventType = et;
module.exports.pixmap = pixmap;

Object.defineProperty(module.exports, 'keySyms', {
  enumerable: true,
  get: function() { return Require('x11/core/keysyms'); }
});

Object.defineProperty(module.exports, 'gcFunction', {
  enumerable: true,
  get: function() { return Require('x11/core/gcfunction'); }
});

//TODO:
// keepe everything in namespace for consistensy (eventMask, keySyms, class, destination ...
// or put most used constants to top namespace? (currently class and destination in top) 

// basic constants

// class
module.exports.CopyFromParent = 0;
module.exports.InputOutput = 1;
module.exports.InputOnly = 2;

// destination 
module.exports.PointerWindow = 0;
module.exports.InputFocus = 1;


// TODO
module.exports.bitGravity = {
};

module.exports.winGravity = {
};

// Execute a sequential block using a next function
// block([function () {todo; next(args)}, function () {todo(function () {next(args)}}])

module.exports.block = function (block) {
  var i=0,len=block.length;
  function next(arg1,arg2,arg3,arg4,arg5,arg6) {
    i++;
    if (i<len) block[i](next,arg1,arg2,arg3,arg4,arg5,arg6);
  }
  block[0](next);
}
