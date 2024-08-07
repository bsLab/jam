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
 **    $CREATED:     31-3-16 by sbosse.
 **    $VERSION:     1.3.2
 **
 **    $INFO:
 **
 **  SEJAM: JavaScript AIOS JAM Agent Simluator Top-level
 **
 **    $ENDOFINFO
 */
global.config={simulation:'simu/simu'};
global.TARGET='node';
var Io = Require('com/io');
var Aios = Require('jam/aios');
var Comp = Require('com/compat');
var Esprima = Require('parser/esprima');

// Import analyzer class...
/** Read and compile (check) agent class templates from file
 *
 */

var out = function (msg) { Io.out('[SEJAM] '+msg)};

var top='';

var options={
  debug:false,
  id:'My Agent World',
  x:8, y:8,
  showfun:true,   // show functions in tree viewer
  classes:{},
  markings:{},
  connections:{
      random:1.0,  // Monte-Carlo Simualtion of node placement: Prob. for a link
      compress:true
  },
  verbose:0
}

function usage(err) {
  var msg='AgentJS JAM Simulation Program'+NL;
  if (err) msg += 'Error: '+err+NL+NL;
  msg += 'usage: sejam [options] <top>.js'+NL;
  msg += ' -c <template>.js\n : Load and compile an agent class template file'+NL;
  msg += ' -x <num> -y <num>\n : Number of nodes in x/y direction [default: x='+options.x+', y='+options.y+']'+NL;
  msg += ' -db <path> <channel>\n : Connect to SQL database server '+NL+
         '   [proprietary, path w/o channel, e.g., /tmp/sqld]'+NL;
  msg += ' -v \n : Increase verbosity level'+NL;
  msg += ' -h -help --help\n : Print this help'+NL+NL;
  msg += ' Top-level simulation file: Defines agent classes and simulation options.'+NL;
  msg += ' module.exports.options={'+NL;
  msg += '   classes:{ac1:ac1,ac2:ac2,..},'+NL;
  msg += '   markings?:{ac1:[n:number,color:string,charid:string],..},'+NL;
  msg += "   connections?:{random:0.1..1.0,compress?:boolean,"+NL+
         "    link?:[{from:{url:string,x:number,y:number},"+NL+
         "            to:{url:string,x:number,y:number}},..],"+NL;
  msg += '   db?:{path:string,channel:number},'+NL;
  msg += '   ..}'+NL;
  out(msg);  
  Io.exit();
}
var args = Io.getargs();
Comp.args.parse(args,[
  [['-h','-help','--help'],0,function () {usage()}],
  ['-v',0,function () {options.verbose++; out('Setting verbosity to level '+options.verbose); config.verbose=true;}],
  ['-x',1,function (x) {options.x=x;}],
  [['-d','-debug'],1,function () {options.debug=true;}],
  ['-y',1,function (y) {options.y=y;}],
  ['-db',2,function (path,chan) {
    options.db={
      path:path,
      channel:chan
    }}]
],1);

if (args.length<=2) usage(); 
top=Comp.array.last(args);
if (!Io.file_exists(top)) usage('Top-level file '+top+' does not exist.');
var sim,
    all;

try {
  sim=Require(top);
  all=Io.read_file(top);
  options.ast=Esprima.parse(all, { tolerant: true, loc:true });
} catch (e) {
  usage('Reading of simulation top-level file '+top+' failed: '+e);
}

if (!sim) usage('Reading of simulation top-level file '+top+' failed.');

//console.log(sim)
if (!sim.options) usage('Invalid simulation top-level file '+top+', expected options object.');
var classes;
for (var p in sim.options) {
  options[p]=sim.options[p];
  if(p=='classes') classes=sim.options[p];
}
//return;

if (!options.debug) try {
  var Simu = Aios.Simu.Simu(options);
  Simu.start();
} catch (e) {
  Io.out('Caught exception: '+e);
} else {
  var Simu = Aios.Simu.Simu(options);
  Simu.start();
}

