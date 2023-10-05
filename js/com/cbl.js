/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     27-11-17 by sbosse.
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 **  JavaScript Callback List
 **
 **  Assume there is a set of non-blocking IO operations with callbacks io1,io2,.., and there is a final
 **  callback function that should be called after all io operations have finished.
 **
 **    $ENDOFINFO
 */

function CBL(callback) {
  if (!(this instanceof CBL)) return new CBL(callback);
  this.schedules=[];
  this.callback=callback;
}

// Next schedule
CBL.prototype.next = function (status) {
  var f=this.schedules.shift();
  // if (f) console.log('next '+f.toString())
  if (f) {
    f(this.next.bind(this),status);
  } else if (this.callback) this.callback(status);
}

// Add next IO callback at the end of the list
CBL.prototype.push = function (f) {
  this.schedules.push(f);
}

// Execute CBL
CBL.prototype.start = function () {
  this.next();
}

// Add next IO callback at the top of the list
CBL.prototype.top = function (f) {
  this.schedules.unshift(f);
}

module.exports=CBL;
