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
 **    $INITIAL:     (C) 2006-2017 BSSLAB
 **    $CREATED:     20-11-17 by sbosse.
 **    $RCS:         $Id: jamp.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 **
 **  JAM Agent Monitor Port (AMP) interface program
 **
 **
 **    $ENDOFINFO
 */
global.config={simulation:false};

var onexit=false;
var start=false;
var Io = Require('com/io');
var Comp = Require('com/compat');
var Aios = Require('jam/aios');
var Esprima = Require('parser/estprima');
var Escodegen = Require('printer/estcodegen');
var Json = Require('jam/jsonfn');
var util = Require('util');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var CBL = Require('com/cbl');

var options = {
  debug:false,
  // This AMP port
  ip:'localhost',
  ip_port:10001,
  verbose:0,
  version:"1.2.2"
}

var out = console.log;

var jamp = function(options) {
  var self=this;
  this.options=options;
  this.env=options.env||{};
  this.verbose=options.verbose;
  this.ip=Aios.Chan.url2addr(options.ip,options.ip_port);

  this.classes={};
  this.objects=[];
  
  this.schedules=CBL();
  this.commands=[];

  this.events=[];
  
  this.connected=none;
  
  this.out=function (msg) {
    out('[JAMP] '+msg);
  };
  this.err=function (msg,err) {
    out('[JAMP] Error: '+msg);
    throw (err||'Program Error');
  }
  this.warn=function (msg) {
    out('[JAMP] Warning: '+msg);
  }
  
  
}

// Import analyzer class...
var JamAnal = Require('jam/analyzer');
JamAnal.current(Aios);
jamp.prototype.analyzeSyntax=JamAnal.jamc.prototype.analyze;
jamp.prototype.syntax=JamAnal.jamc.prototype.syntax;

/** Add an agent class template {<ac name>:<ac constructor fun>} to the JAM world
 *
 */
jamp.prototype.addClass = function (name,constructor,env) {
  this.classes[name]=constructor;
  if (this.verbose) this.out('Agent class '+name+' added to library.');
  this.objects.push(
    {
      name:name,
      fun:Aios.Code.minimize(Aios.Code.toString(constructor)),
      env:Aios.Code.minimize(Aios.Code.toString(env||{})),
    });
};

/** Analyze agent class template in text or object form
 *  Returns {report:string,interface}
 */
jamp.prototype.analyze = function (ac,options) {
  var syntax,content,report,interface;
  if (Comp.obj.isString(ac)) {
  
  } else if (Comp.obj.isObject(ac)) {
  
  } else if (Comp.obj.isFunction(ac)) {
    content = 'var ac ='+ac;
    syntax = Esprima.parse(content, { tolerant: true, loc:true });
    try {
      interface=this.analyzeSyntax(syntax,{
        classname:options.classname||'anonymous',
        level:options.level==undefined?2:options.level,
        verbose:options.verbose,
        err:function (msg){throw msg},
        out:function (msg){if (!report) report=msg; else report=report+'\n'+msg;},
        warn:function (msg){if (!report) report=msg; else report=report+'\n'+msg;}
      });
      return {report:report||'OK',interface:interface};
    } catch (e) {
      return {report:e,interface:interface};
    }
  }
}

/** Compile (analyze) a class constructor function and add it to the world class library
*/ 
jamp.prototype.compileClass = function (name,constructor,verbose) {
  var p,content,syntax,interface,text,env={},self=this,constr;
  content = 'var ac = '+constructor;
  syntax = Esprima.parse(content, { tolerant: true, loc:true });
  interface = this.analyzeSyntax(syntax,
    {
      classname:name,
      level:2,
      verbose:verbose||0,
      err:  function (msg){self.print(msg)},
      out:  function (msg){self.print(msg)},
      warn: function (msg){self.print(msg)}
    });
  // text=Json.stringify(template);
  for (p in interface.activities) env[p]=p;
  with (env) { eval('constr='+constructor) };

  this.addClass(name,constr,env);
}

// Connect to remote node
jamp.prototype.connect = function (to,callback) {
  var tokens=to.split(':');
  if (!this.amp || this.amp.status(to)) { this.err('connect: Not connected: '+to); if (callback) callback(); return};
  if (this.verbose) this.out('Connecting to '+to);
  if (callback) this.schedules.top(callback);
  if (tokens.length==2) this.amp.link(tokens[0],Number(tokens[1]));
  else this.amp.link(this.options.ip,Number(tokens[0]));
}


// Create agent process snapshot
jamp.prototype.createAgent = function (cls,args) {
  var code,text;
  if (!this.classes[cls]) {this.err('createAgent: No such class '+cls); return};
  try {
    code=Aios.Code.createAndReturn(this.classes[cls],cls,args,2);
    if (this.verbose) this.out('Created agent object '+code.process.agent.id+':'+cls+'('+util.inspect(args)+') ['+code.code.length+' bytes]');
    this.objects.push(code.code);
  } catch (e) {
    this.err('createAgent failed: '+e);
  }
}

// Disconnect remote node endpoint
jamp.prototype.disconnect = function (to,callback) {
  var tokens,self=this;
  if (!this.amp || !this.amp.snd.address) { if (callback) callback(); return};
  if (callback) this.schedules.top(callback);
  if (!to) {
    this.amp.unlink(this.amp.snd.address,this.amp.snd.port,callback?this.schedules.next.bind(this.schedules):undefined);
  } else {
    tokens=to.split(':');
    if (tokens.length==2) this.amp.unlink(tokens[0],Number(tokens[1]),callback?this.schedules.next.bind(this.schedules):undefined);
    else this.amp.unlink(this.options.ip,Number(tokens[0]),callback?this.schedules.next.bind(this.schedules):undefined);
  }
}

// Event handler
jamp.prototype.emit = function (event,arg) {
  // console.log(event)
  if (this.events[event]) this.events[event](arg);
}

jamp.prototype.exit = function (stat) {
  process.exit(stat)
}
// Initialize
jamp.prototype.init = function (callback) {
  var self=this;
  // Create AMP port
  this.amp = Aios.Chan.Amp({
    rcv:this.ip,
    verbose:this.verbose
  });
  this.amp.init();
  this.amp.receiver(this.receiver.bind(this));
  this.amp.start(callback);
  this.amp.on('route+',function (arg) { self.emit('route+',arg)});
  this.on('route+',self.schedules.next.bind(self.schedules));
}

// Event handler
jamp.prototype.on = function (event,handler) {
  this.events[event]=handler;
}

// Parse command line arguments
jamp.prototype.parse = function(argv) {
  var next,self=this,tokens,last,obj;
  argv=argv.slice(2);
  argv.forEach(function (arg) {
    switch (next) {
      case 'compile':
      case 'com':
        self.commands.push({
          compile:arg
        });
        next=undefined;
        break;
      case 'create':
      case 'cre':
        last={
          create:arg,
          args:{}
        };
        self.commands.push(last);
        next='arg';
        break;
      case 'connect':
      case 'con':
        last={
          connect:arg,
        };
        self.commands.push(last);
        next=undefined;
        break;
      case '-ip':
        tokens=arg.split(':');
        if (tokens.length==2) this.ip.address=tokens[0],this.ip.port=Number(tokens[1]);
        else this.ip.port=Number(tokens[0]);
        next=undefined;
        break;
      case 'arg':
        if (arg.charAt(0) == '{' || arg.charAt(0)=='[') {
          try{eval('obj='+arg)} catch (e) {};
          last.args=obj;last=undefined;next=undefined;
          break;
        } else if (arg.indexOf(':')!=-1) {
          tokens=arg.split(':');
          if (last) 
            last.args[tokens[0]]=Comp.string.isNumeric(tokens[1])?
                                 Number(tokens[1]):
                                 Comp.string.isBoolean(tokens[1])?
                                 Boolean(tokens[1]):tokens[1];
          break;
        } else {last=undefined;next=undefined; /*fall through */}
      default:
        switch (arg) {
          case '-v': 
            self.verbose++; if (self.verbose>1) self.out('Increasing verbosity level to '+self.verbose); 
            break;
          case '-h':
          case '-help': 
            self.usage(true);
            break;
          case 'dup':
          case '2dup':
          case 'over':
          case 'swap':
          case 'drop':
            self.commands.push({stack:arg});
            break;
          case 'dump':
            self.commands.push({dump:true});
            break;
          case 'exit':
          case '.':
            self.commands.push({exit:true});
            break;
          case 'disconnect':
          case 'dis':
            self.commands.push({disconnect:true});
            break;
          case '-ip':
          case 'compile':
          case 'com':
          case 'create':
          case 'cre':
          case 'connect':
          case 'con':
            next=arg;
            break;
          case 'execute':
          case 'exe':
            self.commands.push({
              request:'execute'
            });
            break;
          case 'write':
          case 'wri':
            self.commands.push({
              request:'write'
            });
            break;
          case 'read':
          case 'rea':
            self.commands.push({
              request:'read'
            });
            break;
          default:
            self.err('Unknown command '+arg,true);
        }
    }
  });
};


/** Read agent templates from file and compile (analyze) agent class templates.
 *  Expected file format: module.exports = { ac1: function (p1,p2,..) {}, ac2:.. }
 *
 */
jamp.prototype.readClass = function (file,options) {
  var self=this,
      ac,
      env,
      constr,
      interface,
      text,
      modu,
      p,m,
      regex1,
      ast=null,
      fileText=null,
      off=null;
  function errLoc(ast) {
    var err;
    if (ast && ast.errors && ast.errors.length) {
      err=ast.errors[0];
      if (err.lineNumber != undefined) return 'line '+err.lineNumber;
    }
    return 'unknown'
  }
  try {
    if (!options) options={};
    if (this.verbose>0) this.out('Looking up agent class template(s) from '+file);
    //modu=Require(file);
    if (Comp.obj.isEmpty(modu)) {
      if (this.verbose>0) this.out('Importing agent class template(s) from file '+file);
      if (Comp.string.get(file,0)!='/') 
        file = (process.cwd?process.cwd()+'/':'./')+file;
      fileText=Io.read_file(file);
      ast=Esprima.parse(fileText, { tolerant: true, loc:true });
      modu=require(file);
    }
    if (!modu) throw 'Empty module.';
    
    for (m in modu) {
      ac=modu[m];
      env={};

      if (fileText) off=this.syntax.find(fileText,'VariableDeclarator',m);
      if (off && off.loc) this.syntax.offset=off.loc.start.line-1;

      content = 'var ac = '+ac;
      syntax = Esprima.parse(content, { tolerant: true, loc:true });
      interface = this.analyzeSyntax(syntax,
        {
          classname:m,
          level:2,
          verbose:this.verbose||0,
          err:  function (msg){self.err(msg)},
          out:  function (msg){self.out(msg)},
          warn: function (msg){self.warn(msg)}
        });
      // text=Json.stringify(ac);
      for (var p in interface.activities) env[p]=p;
      with (env) { eval('constr='+ac) };

      if (this.verbose>0) this.out('Adding agent class constructor '+m+' ('+(typeof constr)+').');
      this.addClass(m,constr,env);
      this.syntax.offset=0;
    }
  } catch (e) {
    this.out('Reading and parsing file "'+file+'" failed: '+e+', in '+errLoc(ast));
    this.exit();
  }
};

// AMP message receiver handler
jamp.prototype.receiver = function(handler) {
  // console.log(handler);
  switch (handler.cmd) {
  }
}

// Send request (agent,signal,class,info) to remote node endpoint
jamp.prototype.request = function(op) {
  var self=this,
      obj = this.objects.pop(),
      buf=Buf.Buffer();
  if (!this.amp) return;
  
  switch (op) {
    case 'execute':
      if (!Comp.obj.isString(obj)) return;
      Buf.buf_put_string(buf,obj);
      if (this.verbose) this.out('Sending request: '+op+' ['+obj.length+' bytes]');
      this.schedules.push(function (next) {
        self.amp.request(Net.Command.PS_CREATE, buf, next);
      });
      break;
    case 'write':
      if (!obj.name) return;
      Buf.buf_put_string(buf,obj.name);
      Buf.buf_put_string(buf,obj.fun);
      Buf.buf_put_string(buf,obj.env);
      if (this.verbose) this.out('Sending request: '+op+' ['+(obj.name.length+obj.fun.length+obj.env.length)+' bytes]');
      this.schedules.push(function (next) {
        self.amp.request(Net.Command.PS_WRITE, buf, next);
      });      
      break;      
  }
}

// Run the commands ...
jamp.prototype.run = function() {
  var self=this,r,s;
  this.commands.forEach(function (cmd) {
    if (cmd.compile) self.readClass(cmd.compile);
    if (cmd.create) self.createAgent(cmd.create,cmd.args);
    if (cmd.request) self.request(cmd.request);
    if (cmd.disconnect) self.schedules.push(function (next) { self.disconnect(next)});
    if (cmd.connect) self.schedules.push(function (next) { 
      if (!self.status(cmd.connect)) {
        self.disconnect();
        self.connect(cmd.connect/*,next()*/);
      } else next();
    }); 
    if (cmd.stack) { 
      switch (cmd.stack) {
        case 'dup': r=self.objects.pop(); self.objects.push(r); self.objects.push(r); break;
        case '2dup': 
          r=self.objects.pop(); s=self.objects.pop(); 
          self.objects.push(s); self.objects.push(r); 
          self.objects.push(s); self.objects.push(r); 
          break;
        case 'drop': self.objects.pop(); break;
        case 'over': 
          r=self.objects.pop(); s=self.objects.pop();
          self.objects.push(s); self.objects.push(r); self.objects.push(s);
          break;
        case 'swap': 
          r=self.objects.pop(); s=self.objects.pop();
          self.objects.push(r); self.objects.push(s);
          break;
      }
    }
    if (cmd.dump) { console.log(self.objects)}
    if (cmd.exit) { self.schedules.push(function (next) {self.disconnect(undefined,function() {process.exit(0)});})}
  });
  this.schedules.start();
}

// Test connection status
jamp.prototype.status = function(to) {
  to=Aios.Chan.url2addr(to);
  if (!this.amp) return false;
  return this.amp.status(to.address,to.port);
}

// Print usage message
jamp.prototype.usage = function(exit) {
  var msg='JAM Agent Management Port Program, Version '+options.version+NL;
  msg += 'usage: jamp [commands]'+NL;
  msg += ' con[nect] <nodeid>\n  .. connect to node'+NL;
  msg += ' dis[connect]\n  .. disconnect last connected node'+NL;
  msg += ' com[pile] <template>.js\n  .. Load and compile an agent class template file and push class to object stack'+NL;
  msg += ' cre{ate] <agentclass> <arg>:<value> .. | [arg1,arg2,..] | {a:v,..} \n  .. Generate an agent snapshot and push to object stack'+NL;
  msg += ' kill <agentid>\n  .. Terminate an agent with specified identification on connected node'+NL;
  msg += ' save <file>\n  .. save last object to file'+NL;
  msg += ' exe[cute]\n  > execute last agent object on connected node'+NL;
  msg += ' rea[d] <class>\n  .. read object class from connected node and push to object stack'+NL;
  msg += ' wri[te]\n  .. send last object class(es) to connected node'+NL;
  msg += ' sig[nal] <agentid> <signal>\n  .. send a a signal to agent on connected node'+NL;
  msg += ' print <class>\n  .. Print ECMA Parser tree of class'+NL;
  msg += ' dup 2dup swap drop over\n  .. Object stack operations'+NL;
  msg += ' dump\n  .. Dump object stack'+NL;
  msg += ' exit | .\n  .. Exit JAMP'+NL;
  msg += ' -v \n  .. Increase verbosity level'+NL;
  msg += ' -ip [<ip>:]<port> \n  .. Set AMP server IP and port'+NL;
  msg += NL;
  msg += ' .. nodeid: [<AMP host|ip>:]<AMP port>'+NL;
  msg += ' .. template file content:'+NL;
  msg += '    this.ac = function () {this.x; this,act={}; this.trans={}; this,next;}'+NL;
  out(msg);  
  if (!exit) onexit=true; else process.exit(-1);
}


var jamp = new jamp(options);

if (process.argv.length< 3)
  jamp.usage(false)
else {
  try {
    jamp.parse(process.argv);
    jamp.init(function () {
      try {jamp.run()} catch (e) {if (e!='Program Error') console.log(e); process.exit(-1)}
    });
  } catch (e) {
    if (e!='Program Error') console.log(e);
    process.exit(-1)
  }  
}
