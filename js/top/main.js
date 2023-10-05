/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     10/3/16 by sbosse.
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 **  JAM Standalone Node VM
 **
 **    $ENDOFINFO
 */
var onexit=false;
var start=false;
var options = {
  verbose:0
};

global.config={simulation:false};

var Io = Require('com/io');
var Comp = Require('com/compat');
var Db = Require('db/db');
var Aios = Require('jam/aios');

var out = function (msg) { Io.out('[JAM] '+msg)};

var jam = function (options) {
  var self=this;
  this.options = options||{};
  if (!this.options.id) this.options.id=Aios.aidgen();
  this.world = Aios.World.World([],{id:this.options.id,classes:options.classes||[]});
  this.node = Aios.Node.Node({id:this.options.id,position:{x:0,y:0}});
  this.world.add(this.node);
  this.run=false;
  this.looprun=none;
  this.loop = function () {
    var loop = function () {
      var nexttime=Aios.scheduler();
      if (self.options.verbose>1) self.out('loop: nexttime='+nexttime);
      if (nexttime>0) self.looprun=setTimeout(loop,nexttime);
      else if (nexttime<0) self.looprun=setTimeout(loop,0);
      else self.looprun=setTimeout(loop,1000);
    };
    self.looprun = setTimeout(loop,1);
  };
  out=function (msg) { Io.out('[JAM '+self.options.id+'] '+msg)};
  this.out=out;
}

/** Add an agent class template {<ac name>:<ac constructor fun>} to the JAM world
 *
 */
jam.prototype.addclass = function (ac) {
  for (var p in ac) {
    this.world.classes[p]=ac[p];
  }
};

/** Create and start an agent from class ac with arguments.
 *
 */
jam.prototype.create = function (ac,args) {
  var node=this.node;
  var agent=none;
  if (this.world.classes[ac])
    agent = Aios.Code.createOn(node,this.world.classes[ac],args);
  else this.out('create: Cannot find agent class '+ac);
  if (agent) {
    agent.agent.ac=ac;
    return agent.agent.id; 
  } else return none;
}

/** Read agent class templates from file
 *
 */
jam.prototype.readclass = function (file) {
  var ac;
  if (this.options.verbose>0) this.out('Looking up agent class template(s) from '+file);
  var modu=Require(file);
  if (Comp.obj.isEmpty(modu)) {
    if (this.options.verbose>0) this.out('Reading agent class template(s) from file '+file);
    if (Comp.string.get(file,0)!='/') file = './'+file;
    modu=require(file);
  }
  for (var p in modu) {
    ac={};
    ac[p]=modu[p];
    if (this.options.verbose>0) this.out('Adding agent class template '+p);
    this.addclass(ac);    
  }
};

/** Start the JAM scheduler
 *
 */
jam.prototype.start=function () {
  this.run=true;
  this.out('Starting ..');
  this.loop();
}

/** Stop the JAM scheduler
 * 
 */
jam.prototype.stop=function () {
  this.run=false;
  this.out('Stopping ..');
  if (this.looprun)
    clearTimeout(this.looprun);
}


var Jam = function(options) {
  var obj = new jam(options);
  return obj;
};

function usage() {
  var msg='';
  msg += ' jam [options]'+NL;
  msg += ' -c <agentclass>.js : Load an agent class template from file'+NL;
  msg += ' -r <agentclass> [<arg>,<arg>,..] : Create an agent from a class template'+NL;
  msg += ' -s                 : Start scheduler loop'+NL;
  msg += ' -v                 : Increase verbosity level'+NL;
  msg += ' -h -help --help    : Print this help'+NL;
  Io.out('[JAM] Usage: '+msg);  
  onexit=true;
}

Comp.args.parse(Io.getargs(),[
  [['-h','-help','--help'],0,function () {usage()}],
  ['-v',0,function () {options.verbose++; out('Setting verbosity to level '+options.verbose); config.verbose=true;}],
  ['-s',0,function () {start=true;}]
]);

var myJam = Jam(options);

Comp.args.parse(Io.getargs(),[
  ['-c',1,function (file) {myJam.readclass(file)}],
  ['-r',2,function (ac,args) {
    try {
      if (args.length < 2) args='[]';
      var _args = Comp.array.map(Comp.string.split(',',Comp.string.trim(args,1,1)),function (arg) {
        try {var num=Number(arg); if (isNaN(num)) return arg; else return num;}
        catch (e) {return arg }
      });
      myJam.create(ac,_args)
    } catch (e) {
      myJam.out('Failed to start agent '+ac+' '+args);
    }
  }]
]);
if (!onexit && start) myJam.start();
