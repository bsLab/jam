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
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     4-1-16 by sbosse.
 **    $VERSION:     1.8.1
 **
 **    $INFO:
 **
 **  JAM Agent Compiler
 **
 **    $ENDOFINFO
 */
var onexit=false;
var start=false;

global.config={simulation:false};

Require('os/polyfill')

var Io = Require('com/io');
var Comp = Require('com/compat');
var Db = Require('db/db');
var Aios = Require('jam/aios');
var Esprima = Require('parser/estprima');
var Escodegen = Require('printer/estcodegen');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Run = Require('dos/run');
var Rpc = Require('dos/rpc');
var Std = Require('dos/std');
var Router = Require('dos/router');
var Sch = Require('dos/scheduler');
var Conn = Require('dos/connection');
var Json = Require('jam/jsonfn');
var Dios = Require('dos/dios');
var Status = Net.Status;
var Command = Net.Command;
var util = Require('util');
var path = Require('path');

Run.current(Aios);

var env = {};

function className(filename) { return path.basename(filename, path.extname(filename)) }

var options = {
  amp:false,
  aip:'localhost',
  aport:10002,
  bip:'localhost',
  bport:3001,
  broker:false,
  debug:false,
  default:true,
  dip : 'localhost',
  dports : [],
  env:{},
  geo:undefined,
  hostport:undefined,
  http:false,
  keepalive:true,
  myip:'localhost',
  monitor:0,
  output:undefined,
  print:false,
  repeat:0,
  tcpnet:0,
  verbose:0
};

var out = function (msg) { Io.out('[JAC] '+msg)};

var jamc = function(options) {
  var self=this;
  this.options=checkOption(options,{});
  this.env=checkOption(options.env,{});
  this.classes={};
  this.out=out;
  this.err=function (msg,err) {
    out('Error: '+msg);
    throw (err||'Error');
  }
  this.warn=function (msg) {
    out('Warning: '+msg);
  }
  this.pending=false;

  this.bport=checkOption(options.bport,3001);
  this.bip=options.bip;
  this.amp=options.amp;
  this.aport=options.aport;
  this.hostname=Io.hostname();
  this.nodename=options.nodename;
  
  
  this.options.privhostport=Net.uniqport();
  this.options.pubhostport = Net.prv2pub(this.options.privhostport);

  this.scheduler=Sch.TaskScheduler();
  this.todo=[];
  this.verbose=checkOption(options.verbose,0);
};

// Import analyzer class...
var JamAnal = Require('jam/analyzer');
JamAnal.current(Aios);
jamc.prototype.analyzeSyntax=JamAnal.jamc.prototype.analyze;
jamc.prototype.syntax=JamAnal.jamc.prototype.syntax;


/** Add an agent class template {<ac name>:<ac constructor fun>} to the JAM world
 *
 */
jamc.prototype.addClass = function (name,ac) {
  if (this.verbose) this.out('Added agent class '+name);
  this.classes[name]=ac;
};

jamc.prototype.compile = function (filename, options) {
  var res = this.open(filename,options);
  if (res) for(var p in res) {
    this.compileClass(p,res[p],{verbose:this.verbose});
  }
}
 
/** Compile (analyze) an agent class constructor function and add it to the world class library.
 ** Can be used after an open statement.
 ** Usage: compileClass(name,constructor,options?)
 **        compileClass(constructor,options?)
 **
 **  typeof @name=string|undefined
 **  typeof @constructor=function|string
 **  typeof @options={verbose:number|boolean)|number|undefined
*/ 
jamc.prototype.compileClass = function (name,constructor,options) {
  var ac,p,verbose,content,syntax,report,text,env={ac:undefined},self=this,ac;

  if (typeof name == 'function') constructor=name,name=undefined,options=constructor;
  if (typeof options == 'object') verbose=options.verbose; 
  else if (options!=undefined) verbose=options; else verbose=this.verbose;
  // if (typeof constructor != 'function') throw 'compileClass: second constructor argument not a function';

  if (typeof constructor == 'function') text = constructor.toString();
  else text = constructor;
  
  if (!name) {
    // try to find name in function definition
    name=text.match(/[\s]*function[\s]*([A-Za-z0-9_]+)[\s]*\(/);
    if (!name) throw ('compileClass: No class name provided and no name found in constructor '+
                      text.substring(0,80));
    name=name[1];
    
  }
  content = 'var ac = '+text;
  try { syntax = Esprima.parse(content, { tolerant: true, loc:true }) }
  catch (e) { throw 'compileClass('+name+'): Parsing failed with '+e }
  report = this.analyzeSyntax(syntax,
    {
      classname:name,
      level:2,
      verbose:verbose||0,
      err:  function (msg){self.err(msg)},
      out:  function (msg){self.out(msg)},
      warn: function (msg){self.warn(msg)}
    });
  if (report.errors.length) { throw 'compileClass('+name+'): failed with '+report.errors.join('; ')};
  for (p in report.activities) env[p]=p;
  with (env) { eval(content) };
  ac=env.ac; env.ac=undefined;
  this.addClass(name,ac,env);
  return name;
}


/** Create and return JSON+ agent from class ac with arguments.
 *
 */
jamc.prototype.generate = function (ac,args) {
  var node=this.node;
  var code=none;
  if (this.options.verbose>0) this.out('Compiling agent from class '+ac+' ['+args+'] ..');
  if (this.classes[ac])
    code = Aios.Code.createAndReturn(this.classes[ac],ac,args);
  else this.out('generate: Cannot find agent class '+ac+'.');
  return code;
};

/** Get an agent class template {<ac name>:<ac constructor fun>} from the JAM world
 *
 */
jamc.prototype.getclass = function (name) {
  var ac={};
  ac[name]=this.classes[name];
  if (ac[name]) return ac; else return undefined;
};



/** Initialize broker or amp connections ...
 *
 */
jamc.prototype.init=function () {
  var self=this;
  this.scheduler.Init();
  
  if (this.options.broker||this.options.dports.length>0) {
    this.network = Conn.setup(this.options,1);
    this.router = this.network.router;
    this.rpc = this.network.rpc;
    this.std = Std.StdInt(this.rpc);
    this.dns = Dns.DnsInt(this.rpc);
    this.cs =  Cs.CsInt(this.rpc);
    this.run = Run.RunInt(this.rpc);
    this.dios = Dios.Dios(this.rpc,this.env);
  }

  if (this.amp) {
    this.startamp();    
  }
}

/** Read and parse one agent class from file. Can contain nested open statements.
 *  File/source text format: function [ac] (p1,p2,..) { this.x; .. ; this.act = {..}; ..}
 *  open(file:string,options?:{verbose?:number|boolean,classname?:string}) -> function | object
 *  
 *  Output can be processed by method compileClass
 */
jamc.prototype.open = function (filename,options) {
  var self=this,
      res,
      text,
      name,
      ast=null;
  options=checkOptions(options,{});
  name=checkOption(options.classname,className(filename));
  if (this.verbose>0) this.out('Opening file '+filename);
  
  function parseModel (text) {
    var modu={},more,module={exports:{}},name=text.match(/[\s]*function[\s]*([a-z0-9]+)[\s]*\(/);
    if (name) name=name[1];
    function open(filename) {
      var text;
      try {
        if (self.verbose>0) self.out('Opening file '+filename);
        text=Io.read_file(filename);
        if (self.verbose) self.out('%% '+text.length+' bytes');
        return parseModel(text);
      } catch (e) {
        self.err('Opening of '+file+' failed: '+e); 
      }
    }
    try {
      with (module) {eval('res = '+text)};
      if (name) { modu[name]=res; return modu} 
      else if (module.exports) return module.exports; 
      else return res;
    } catch (e) {
      try {
        ast = Esprima.parse(text, { tolerant: true, loc:true });
        if (ast.errors && ast.errors.length>0) more = ', '+ast.errors[0];
      } catch (e) {
        if (e.lineNumber) more = ', in line '+e.lineNumber; 
      } 
      self.out(e.name+(e.message?': '+e.message:'')+(more?more:''));
    }
  }
  try {
    text=Io.read_file(filename);
    if (this.verbose) this.out('%% '+text.length+' bytes');
    return parseModel(text);
  } catch (e) {
    this.err('Opening of '+file+' failed: '+e); 
  }  
};

/** ESTPRIMA/ESTCODEGEN Test
 */
jamc.prototype.print = function (file,depth) {
  var code,
      text,
      ast;
  if (Io.exists(file)) {
    if (this.options.verbose>=0) this.out('Parsing Javascript from file '+file+' ..');
    text=Io.read_file(file);
  } else {
    if (this.options.verbose>=0) this.out('Parsing Javascript from string "'+file+'" ..');
    text=file; // Is it text string?
  }
  try {
    ast=Esprima.parse(text, { tolerant: true, loc:true });
    console.log(util.inspect(ast.body,{depth:depth}));
    code=Escodegen.generate(ast);
    console.log(code);
  } catch (e) {
    console.log(e);
  }
};


/** Send request to a JAM node
** function (data:string,dst:string,cmd:Net.Command*)
*/
jamc.prototype.send = function (data,dst,cmd) {
  var self=this,
      cap,stat;
  if (Comp.string.isNumeric(dst)) dst='localhost:'+dst;

  if (this.options.amp)
    myJamc.todo.push([
      function () {
        var addr = self.amp.url2addr(dst),
            buf=Buf.Buffer(),
            context=Sch.Suspend();
          Buf.buf_put_string(buf,data);

        self.amp.request(cmd,buf,function (res) {
          Sch.Wakeup(context);
        },addr.address,addr.port);
      }
    ])
  else if (this.options.broker) {
    myJamc.todo.push([
      function () {
        self.dios.resolve(dst,function (_cap,_stat) {
          cap=_cap;
          stat=_stat;
        });
      },
      function () {
        if (stat==Status.STD_OK) 
          switch (cmd) {
              case Command.PS_WRITE: 
                self.run.ps_write(cap,data,function (_stat) {
                  self.out('Finished request '+Net.Print.command(cmd)+' to '+dst+' with '+Net.Print.status(_stat));
                });
                break;
              case Command.PS_EXEC: 
                self.run.ps_exec(cap,data,function (_stat) {
                  self.out('Finished request '+Net.Print.command(cmd)+' to '+dst+' with '+Net.Print.status(_stat));
                });
                break;
              case Command.PS_STUN: 
                self.run.ps_stun(cap,data,function (_stat) {
                  self.out('Finished request '+Net.Print.command(cmd)+' to '+dst+' with '+Net.Print.status(_stat));
                });
                break;
          }
        else self.out('Send: Invalid destination '+dst+': '+Net.Print.status(stat));
      }
    ])
  
  } else self.out('Send: No route to destination '+dst);
  self.pending=true;
}

jamc.prototype.setenv=function (name,value) {
  var self=this;
  switch (name) {
    case 'DNS':
      self.env.dns_def=value; 
      self.env.rootdir=self.env.workdir=self.cs.cs_singleton(value);
      break;
    case 'AFS':
      self.env.afs_def=value; 
      break;
  }
}

/** Start the router and scheduler
 *
 */
jamc.prototype.start=function () {
  this.running=true;
  this.todo.push([
    function () {Io.out('[JAMC] Finished. Exit.'); Io.exit()}
  ]);
  this.todo=Comp.array.flatten(this.todo);
  B(this.todo);

  // Start up the network ..
  if (this.network) B([this.network.init,this.network.start]);

  // this.out('Starting ..');
  Sch.ScheduleNext();
  Sch.ScheduleNext();
}


/** Start an AMP service port TODO
 */
jamc.prototype.startamp = function () {
  var self=this;
  var ip = 'localhost';
  this.out('Starting AMP server on port '+this.aport);
  this.amp = Aios.Chan.Amp({rcv:ip+':'+this.aport,snd_ip:ip,verbose:this.options.verbose});
  this.amp.receiver(function (handler) {
      if (handler) {
        if (self.options.verbose>1) { self.out('AMP: got request:'); console.log(handler) };
      }      
    });
}



var Jamc = function(options) {
  var obj = new jamc(options);
  return obj;
}


function usage(exit) {
  var msg='AgentJS Compiler and Agent Management Program'+NL;
  msg += 'usage: jamc [options]'+NL;
  msg += 'compile -c <template>.js\n  : Load and compile an agent class template file'+NL;
  msg += 'send to -s <nodeid>\n  : Send last compiled agent class template or snapshot to a JAM node'+NL;
  msg += 'use -a <agentclass>\n  : Use agent class template'+NL;
  msg += 'create -r [<arg>,<arg>,..]|{}\n  : Create an agent snapshot from a class template'+NL;
  msg += 'print\n  : Print the snapshot.'+NL;
  msg += 'stun -u  <agentid> <nodeid>\n  : Stun (terminate) an agent with specified identification.'+NL;
  msg += 'repeat -n <n>\n  : repeat operation <n> times'+NL;
  msg += 'output -o <file>\n  : output file'+NL;
  msg += '-v \n  : Increase verbosity level'+NL;
  msg += '-debug \n  : Setting debug mode'+NL;
  msg += 'amp -A <port>\n  : Start AMP service on specified port (Default port='+options.aport+')'+NL;
  msg += 'link -L <port>\n  : AMP link with specified destination'+NL;
  msg += '  [-H -T -T2] Use HTTP or TCPIP port insted UDP (default)'+NL;
  msg += '    T: TCPIP, 1-ch H:HTTP T2: TCPIP, 2-ch'+NL;
  msg += '  [-broker <ip[:ipport]>]  Broker URL (Default: '+options.bip+': HTTP '+options.bport+')'+NL;
  msg += '-h -help --help\n  : Print this help'+NL;
  msg += '-P <file>|"<string> [-depth #n]"\n  : Print ECMA Parser tree'+NL;
  msg += 'nodeid: [<AMP host|ip>:]<AMP port>'+NL;
  msg += 'nodeid: <DNS path>'+NL;
  msg += 'nodeid: <Host capability>'+NL;
  msg += 'agentid: CCCCCCCC with C: a-z0-9'+NL+NL;
  msg += 'Example 1: jamc -c ac.js create {x=1} to 192.68.0.1:10001'+NL;
  out(msg);  
  if (!exit) onexit=true; else process.exit(-1);
}

if (Io.getargs().length==2) usage();

Comp.args.parse(Io.getargs(),[
  [['-h','-help','--help'],0,function () {usage()}],
  ['-v',0,function () {options.verbose++; out('Setting verbosity to level '+options.verbose); config.verbose=true;}],
  ['-monitor',0,function () {options.monitor++; out('Setting monitor to level '+options.monitor); }],
  ['-debug',0,function () {options.debug=true; out('Setting debug mode.'); config.debug=true;}],
  ['-dip',1,function(val){options.dip=val}],
  ['-D',1,function(val){try{options.dports.push(Perv.int_of_string(val))} catch (e) {usage(true)}}],
  ['-L',2,function(val1,val2){try{options.links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])} catch (e) {usage(true)}}],
  ['-nokeepalive',0,function(val){options.keepalive=false;}],
  ['-T',0,function(val){options.tcpnet=1;options.http=false;}],
  ['-T2',0,function(val){options.tcpnet=2;options.http=false;}],
  ['-H',0,function(val){options.http=true;options.tcpnet=0;}],
  ['-S',2,function (classname,nodeid) {
    if (!isNaN(Number(nodeid))) options.amp=true;
  }],
  ['-C',2,function (file,nodeid) {
    if (!isNaN(Number(nodeid))) options.amp=true;
  }],
  ['-s',2,function (agentid,nodeid) {
    if (!isNaN(Number(nodeid))) options.amp=true;
  }],
  ['-x',3,function (ac,args,nodeid) {
    if (!isNaN(Number(nodeid))) options.amp=true;
  }],
  ['-A',1,function (port) {
    try {options.aport=Comp.pervasives.int_of_string(port)} catch (e) {usage(true)};
    options.amp=true;
  }],
  ['-broker',1,function(val){
    var tokens = Comp.string.split(':',val);
    if (tokens.length==1)
      options.bip=val;
    else {
      options.bip=tokens[0];      
      options.bport=Comp.pervasives.int_of_string(tokens[1])
    }
    options.broker=true;
  }],
  ['-n',1,function (num) {
    options.repeat=num;
  }],
  ['-o',1,function (file) {
    options.output=file;
  }],
  ['-P',1,function(val){options.print=true}],
]);

if (options.http || options.tcpnet) options.broker=true;

var myJamc = Jamc(options);
// console.log(Io.getargs())

process.on('SIGINT', function () {
  myJamc.out('Got SIGINT ..');
  process.exit(2);
});



Comp.args.parse(Io.getargs(),[
  ['-c',1,function (file) {
    var ac,data;
    if (global.DEBUG||options.debug)
      ac=myJamc.compile(file)    
    else try {
      ac=myJamc.compile(file)
    } catch (e) {
      myJamc.out('Compilation failed: '+e+'.');
      Io.exit();
    }
    if (options.output) {
      data=Json.stringify(ac);
      myJamc.out('Writing agent class template (JSON+) to file '+options.output+'..');
      Io.write_file(options.output,data);
    }
  }],
  ['-C',2,function (file,nodeid) {
    var code='{}',ac,classes='',p ;
    if (global.DEBUG||options.debug)
      ac=myJamc.compile(file)    
    else try {
      ac=myJamc.compile(file)
    } catch (e) {
      myJamc.out('Compilation failed: '+e+'.');
      Io.exit();
    }
    for (p in ac) classes=classes+(classes==''?'':',')+p;

    code=Json.stringify(ac);
    myJamc.out('Sending agent class template(s) '+classes+' to '+nodeid+' ..');

    myJamc.send(code,nodeid,Command.PS_WRITE);

    if (options.output) {
      myJamc.out('Writing agent class template (JSON+) to file '+options.output+'..');
      Io.write_file(options.output,data);
    }
    
  }],
  ['-S',2,function (classname,nodeid) {
    var code='{}',ac;
    ac=myJamc.getclass(classname);
    if (!ac) 
      myJamc.out('Unknown agent class '+classname);
    code=Json.stringify(ac);
    myJamc.out('Sending agent class template '+classname+' to '+nodeid+' ..');
    myJamc.send(code,nodeid,Command.PS_WRITE);
    
  }],
  ['-r',2,function (ac,args) {
    try {
      var _args = Comp.array.map(Comp.string.split(',',Comp.string.trim(args,1,1)),function (arg) {
        try {var num=Number(arg); if (isNaN(num)) return arg; else return num;}
        catch (e) {return arg }
      });
      var cp = myJamc.generate(ac,_args);
      var filename = ac+'.'+cp.process.agent.id+'.json'; 
      /* Compact the code, remove newlines, comments, white spaces */
      var regex1= /\\n/g;
      var regex2= /\/\*([\S\s]*?)\*\//gm;
      var regex4= /\/\/[^\n]+/g; 
      var regex5= /\\n/g;
      var regex6= /\s[\s]+/g;
      var code = cp.code.replace(regex1,'\n')
                        .replace(regex4,"")
                        .replace(regex5,"")
                        .replace(regex6,' ');

      myJamc.out('Writing compiled agent '+cp.process.agent.id+' to file '+filename+' ['+cp.code.length+']');
      Io.write_file(filename,code);
    } catch (e) {
      myJamc.out('Failed to generate agent '+ac+' '+args);
    }
  }],
  ['-p',2,function (ac,args) {
    try {
      var _args = Comp.array.map(Comp.string.split(',',Comp.string.trim(args,1,1)),function (arg) {
        try {var num=Number(arg); if (isNaN(num)) return arg; else return num;}
        catch (e) {return arg }
      });
      var cp = myJamc.generate(ac,_args);
      var filename = ac+'.'+cp.process.agent.id+'.json'; 
      /* Compact the code, remove newlines, comments, white spaces */
      var regex1= /\\n/g;
      var regex2= /\/\*([\S\s]*?)\*\//gm;
      var regex4= /\/\/[^\n]+/g; 
      var regex5= /\\n/g;
      var regex6= /\s[\s]+/g;
      var code = cp.code.replace(regex1,'\n')
                        .replace(regex2,"")
                        .replace(regex4,"")
                        .replace(regex5,"")
                        .replace(regex6,' ');

      myJamc.out('Agent '+cp.process.agent.id+':\n'+code);
    } catch (e) {
      myJamc.out('Failed to generate agent '+ac+' '+args);
    }
  }],
  ['-x',3,function (ac,args,nodeid) {
    try {      
      var _args = Comp.array.map(Comp.string.split(',',Comp.string.trim(args,1,1)),function (arg) {
        try {var num=Number(arg); if (isNaN(num)) return arg; else return num;}
        catch (e) {return arg }
      });
      if (!isNaN(Number(nodeid))) options.amp=true;
      function newagent(num) {
        var cp = myJamc.generate(ac,_args),
            filename = ac+'.'+cp.process.agent.id+'.json',
            regex1= /\\n/g,
            code = cp.code; // .replace(regex1,'\n');
        //console.log(data)

        myJamc.out('Sending agent '+cp.process.agent.id+' from class '+ac+' to '+nodeid+' ..');
        myJamc.send(code,nodeid,Command.PS_EXEC);

        if (num>1) newagent(num-1);
      }
      newagent(myJamc.repeat||1);
      myJamc.pending=true;
    } catch (e) {
      myJamc.out('Failed to generate or send agent(s) of class '+ac+' '+args+' to node '+nodeid+': '+e);
    }
  }],
  ['-s',2,function (agentid,nodeid) {
    myJamc.out('Terminating agent '+agentid+' on node '+nodeid);
    myJamc.send(agentid,nodeid,Command.PS_STUN);
    myJamc.pending=true;
  }],
  ['-P',1,function (file) {
    myJamc.print(file,options.depth);
  }],
  ['-depth',1,function (depth) {
    options.depth=depth;
  }]
]);

if (myJamc.pending) {
  myJamc.init();
  myJamc.start();
}
