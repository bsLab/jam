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
 **    $INITIAL:     (C) 2006-2018 bLAB
 **    $CREATED:     09-11-16 by sbosse.
 **    $VERSION:     1.1.5
 **
 **    $INFO:
 **
 **  Standalone JAM with app.js for WEB Browser (w/o DOS) using jamlib
 **
 **    $ENDOFINFO
 */

global.config={
  simulation:false,
  dos:false
};

var Io = Require('com/io');
var Comp = Require('com/compat');
var satelize = Require('dos/ext/satelize');
//var FileReader = Require('os/FileReader');
//var FileSaver = Require('os/FileSaver');

var JamLib = Require('top/jamlib');

var nameopts = {length:8, memorable:true, lowercase:true};
var Nameopts = {length:8, memorable:true, uppercase:true};

function setup (options,callback) {
  var jam=JamLib.Jam({
    print:options.print,
    print2:options.print2,
    nameopts:nameopts,
    Nameopts:Nameopts,
    verbose:options.verbose,
  });
  jam.init(function () {
    options.nodename  = jam.getNodeName();
    options.worldname = jam.getWorldName();
    if (callback) callback(jam);
  });
  return jam;
}

module.exports={
  Aios: JamLib.Aios,
  Name: JamLib.Aios.Name,
  JamLib: JamLib,
  setup:setup,
};
