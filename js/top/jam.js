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
 **    $CREATED:     10-3-16 by sbosse.
 **    $VERSION:     1.3.4
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
  amp:false,
  aport:6000,
  connect:[],
  debug:false,
  verbose:0
};

global.config={simulation:false};

var Io = Require('com/io');
var Comp = Require('com/compat');
var Db = Require('db/db');
var Aios = Require('jam/aios');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Esprima = Require('parser/esprima');
var Json = Require('jam/jsonfn');
var Db = Require('db/db');

var out = function (msg) { Io.out('[JAM] '+msg)};

var jam = function (options) {
  var self=this;
  this.options = options||{};
  this.verbose = options.verbose||0;
  if (!this.options.id) this.options.id=Aios.aidgen();
  this.world = Aios.World.World([],{id:this.options.id,classes:options.classes||[]});
  this.node = Aios.Node.Node({id:this.options.id,position:{x:0,y:0}},true);
  this.world.addNode(this.node);
  this.run=false;
  this.loopnext=none;
  this.looprun=false;
  this.loop = function () {
    var loop = function () {  
      self.looprun=true;
      var nexttime=Aios.scheduler();
      self.looprun=false;
      var curtime=Aios.time();
      if (self.options.verbose>1) self.out('loop: nexttime='+nexttime+
                                           ' ('+(nexttime>0?nexttime-curtime:0)+')');
      if (nexttime>0) self.looprun=setTimeout(loop,nexttime-curtime);
      else if (nexttime<0) self.looprun=setImmediate(loop);
      else self.looprun=setTimeout(loop,1000);
    };
    self.loopnext = setTimeout(loop,1);
  };
  
  this.out=function (msg) { 
    Io.out('[JAM '+self.options.id+'] '+msg)
  };
  this.err=function (msg,err) {
    self.out('Error: '+msg);
    throw (err||'Error');
  }
  this.warn=function (msg) {
    self.out('Warning: '+msg);
  }
  
  this.amp=options.amp;
  this.aport=options.aport||6000;
}

// Import analyzer class...
var JamAnal = Require('jam/analyzer');
JamAnal.current(Aios);
jam.prototype.analyze=JamAnal.jamc.prototype.analyze;
jam.prototype.syntax=JamAnal.jamc.prototype.syntax;

/** Add agent class to the JAM world and create sandboxed constructors.
 *  type constructor = function|string
 */
jam.prototype.addClass = function (name,constructor,env) {
  this.world.addClass(name,constructor,env);
  if (this.verbose) this.out('Agent class '+name+' added to world library.');
};

/** Create and start an agent from class ac with arguments. 
 *  Ac is either already loaded (i.e., ac specifies the class name) or 
 *  AC is supplied as a constructor function (ac), a class name, or a sandboxed constructor
 *  {fun:function,mask:{}} object for a specific level.
 *
 *  type of ac = string|object|function
 *  type of args = * []
 *  level = {0,1,2,3}
 *
 */
jam.prototype.create = function (ac,args,level) {
  var node=this.node,
      process=none,sac;
  if (level==undefined) level=1;
  if (Comp.obj.isFunction(ac) || Comp.obj.isObject(ac)) {
    // Create a sandboxed constructor function and agent process
    process = Aios.Code.createOn(node,ac,args,level);
    if (process) return process.agent.id;   
  } else {
    // Use an already sandboxed constructor
    if (this.world.classes[ac])
      process = Aios.Code.createOn(node,this.world.classes[ac][level],args);
    else this.out('create: Cannot find agent class '+ac);
    if (process) {
      process.agent.ac=ac;
      return process.agent.id; 
    } else
      this.out('create: Cannot find agent class '+ac+' for level '+level);       
    return none;
  }
}

/** Read and compile agent class templates from file
 *
 */
jam.prototype.readClass = function (file) {
  var ac,
      text,
      modu={},
      m,p,
      env,
      interface,
      regex1,
      ast=null,
      all=null,
      off=null;
  if (this.options.verbose>0) this.out('Looking up agent class template(s) from '+file);
  modu=Require(file);
  if (Comp.obj.isEmpty(modu)) {
    if (this.options.verbose>0) this.out('Importing agent class template(s) from file '+file);
    if (Comp.string.get(file,0)!='/') file = './'+file;
    all=Io.read_file(file);
    ast=Esprima.parse(all, { tolerant: true, loc:true });
    modu=require(file);
  }
  if (!modu) this.out('Importing of agent class template(s) from '+file+' failed (empty).');
  for (m in modu) {
    ac=modu[m];
    env={};
    if (all) off=this.syntax.find(ast,'VariableDeclarator',m);
    if (off && off.loc) this.syntax.offset=off.loc.start.line-1;
    content = 'var ac = '+ac;
    syntax = Esprima.parse(content, {tolerant: true, loc:true });
    interface = this.analyze(syntax,{classname:m,level:2,verbose:this.options.verbose||0});
    for (var p in interface.activities) env[p]=p;
    with (env) { eval(content) };

    if (options.verbose>0) this.out('Adding agent class constructor '+m+' ('+(typeof ac)+').');
    this.addClass(m,ac,env);
    this.syntax.offset=0;
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

/** Start AMP service port
 */
jam.prototype.startAmp = function () {
  var self=this;
  var ip = 'localhost';
  this.out('Starting AMP server on port '+this.aport);
  this.amp = Aios.Chan.Amp({rcv:ip+':'+this.aport,snd_ip:ip,verbose:this.options.verbose});
  this.amp.receiver(function (handler) {
      var code,agentid,stat;
      if (!handler) return;
      if (self.options.verbose>0) { self.out('AMP: got request:'); console.log(handler) };
      switch (handler.cmd) {
        case Net.Command.PS_EXEC:
          code = Buf.buf_get_string(handler.buf);
          // console.log(code);
          // console.log(myJam.amp.url(handler.remote))
          self.node.receive(code);
          break;
        case Net.Command.PS_STUN:
          agentid = Buf.buf_get_string(handler.buf);
          stat=Aios.kill(agentid);
          if (stat) self.out('Agent '+agentid+' terminated.');
          break;
      }
    });
}

/** Stop the JAM scheduler
 * 
 */
jam.prototype.stop=function () {
  this.run=false;
  this.out('Stopping ..');
  if (this.loopnext)
    clearTimeout(this.loopnext);
}


var Jam = function(options) {
  var obj = new jam(options);
  return obj;
};

function usage(error) {
  var msg='Agent JavaScript Machine'+NL;
  msg += 'usage: jam [options]'+NL;
  msg += ' -c <agentclass>.js : Load an agent class template from file'+NL;
  msg += ' -r <agentclass> [<arg>,<arg>,..] : Create an agent from a class template'+NL;
  msg += ' -A <port>          : Start AMP service on specified port'+NL;
  msg += ' -L <dir> <from> <to>  : Connect this node (from) to another (to) using AMP (url/port)'+NL;
  msg += ' -s                 : Start scheduler loop'+NL;
  msg += ' -v                 : Increase verbosity level'+NL;
  msg += ' -h -help --help    : Print this help'+NL;
  msg += ' <dir>              : N,S,W,E,NW,NE,SW,SE,UP,DOWN'+NL;
  out(msg);  
  if (error) out(error);
  onexit=true;
}

Comp.args.parse(Io.getargs(),[
  [['-h','-help','--help'],0,function () {usage()}],
  ['-v',0,function () {options.verbose++; out('Setting verbosity level to '+options.verbose); config.verbose=true;}],
  ['-s',0,function () {start=true;}],
  ['-d',0,function () {options.debug=true;}]
]);

var myJam = Jam(options);

Comp.args.parse(Io.getargs(),[
  ['-c',1,function (file) {
    if (options.debug)
     myJam.readClass(file);
    else try {
      myJam.readClass(file)
    } catch (e) {
      myJam.out('Compilation failed: '+e+'.');
      Io.exit();
    }
  }],
  ['-A',1,function (port) {
    myJam.amp=true;
    myJam.aport=port;
    myJam.startAmp();
  }],
  ['-L',3,function (dir,port1,port2) {
    var _options;
    switch (dir) {
      case 'N': dir=Aios.DIR.NORTH;break;
      case 'S': dir=Aios.DIR.SOUTH; break;
      case 'W': dir=Aios.DIR.WEST; break;
      case 'E': dir=Aios.DIR.EAST; break;
      default:
        usage('Invalid first argment of -L');
    }
    _options={rcv:port1,snd:port2,amp:true,verbose:options.verbose};
    myJam.world.connectPhy(dir,myJam.node,_options);
  }],
  ['-r',2,function (ac,args) {
    try {
      if (args.length < 2) args='[]';
      var _args = Comp.array.map(Comp.string.split(',',Comp.string.trim(args,1,1)),function (arg) {
        try {var num=Number(arg); if (isNaN(num)) return arg; else return num;}
        catch (e) {return arg }
      });
      myJam.create(ac,_args)
    } catch (e) {
      myJam.out('Failed to start agent '+ac+' '+args+': '+e);
    }
  }],
  ['-db',2,function (path,chan) {
    var res;
    myJam.db=Db.Sqlc(path,chan);
    myJam.db.init(function (res){
      console.log('init: '+res);
      myJam.db.exec('help',function (repl) {
        console.log(repl);
      });
    } );
  }]
]);
if (!onexit && start) myJam.start();
