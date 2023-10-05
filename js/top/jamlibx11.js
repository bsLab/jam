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
 **    $CREATED:     25-12-16 by sbosse.
 **    $RCS:         $Id: jamlibx11.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.3.5
 **
 **    $INFO:
 **
 **  JAM library + X11 API that can be embedded in any host application.
 **
 **  Should a virtual agent process be created for the host application?
 **  This would enable direct access of tuple spaces with callbacks but w/o blocking ...
 **
 **    $ENDOFINFO
 */
var onexit=false;
var start=false;
var options = {
  geo:undefined,
  verbose:0,
  version:'1.3.2'
};

global.config={simulation:false,nonetwork:true};

var Io = Require('com/io');
var Comp = Require('com/compat');
var Db = Require('db/db');
var Aios = Require('jam/aios');
var Esprima = Require('parser/esprima');
var Json = Require('jam/jsonfn');
var fs = Require('fs');
var X11 = Require('x11/core/x11');
var Windows = Require('x11/win/windows');

//if (typeof setImmediate == 'undefined') {
//  function setImmediate(callback) = {return setTimeout(callback,0)};
//}

/**
 *  typeof options = { connections?, 
 *                     print?, 
 *                     provider?, consumer?, 
 *                     classes?, 
 *                     id?,
 *                     nocp:boolean is a disable flag for agent check poininting,
 *                     verbose?, TMO? }
 *  with typeof connections = { 'kind : {send:function, link?:function} , 'kind : .. }
 *  with 'kind = {north,south,west,east,path,..}
 */
 
var jam = function (options) {
  var self=this;
  this.options = options||{};
  if (!this.options.id) this.options.id=Aios.aidgen();
  this.verbose = this.options.verbose || 0;
  this.Aios = Aios;
  this.DIR = Aios.aios.DIR;

  Aios.options.verbose=this.verbose;

  if (this.options.nocp) Aios.watchdog={start:function () {},stop:function () {}};

  // out=function (msg) { Io.print('[JAM '+self.options.id+'] '+msg)};
  this.print=function (msg) { if (self.options.print) self.options.print('[JAM] '+msg)};
  
  this.log=this.print;
  
  this.err=function (msg,err) {
    self.print('Error: '+msg);
    throw (err||'JAMLIB');
  }
  this.warn=function (msg) {
    self.print('Warning: '+msg);
  }
  
  // Create a world
  this.world = Aios.World.World([],{id:this.options.id.toUpperCase(),classes:options.classes||[]});
  if (this.verbose) this.log('Created world '+this.world.id+'.');
  // Create one (root) node
  var node = Aios.Node.Node({id:this.options.id,position:{x:0,y:0},TMO:this.options.TMO},true);
  // Add node to world
  if (this.verbose) this.log('Created root node '+node.id+' (0,0).');

  this.world.addNode(node);
  // Current node == root node
  this.node=0;
  
  this.run=false;
  
  // Service loop executing the AIOS scheduler
  this.looprun=0;
  this.loopnext=none;
  this.loop = function () {
    var loop = function () {
      self.looprun++;
      if (self.options.verbose>1) self.print('loop: Entering scheduler run #'+self.looprun);
      var nexttime=Aios.scheduler();
      var curtime=Aios.time();
      if (self.options.verbose>1) self.print('loop: Scheduler returned nexttime='+nexttime+
                                           ' ('+(nexttime>0?nexttime-curtime:0)+')');
      if (nexttime>0) 
        self.loopnext=setTimeout(loop,nexttime-curtime);
      else if (nexttime==0) 
        self.loopnext=setTimeout(loop,1000);
      else setImmediate(loop);
    };
    self.loopnext = setTimeout(loop,1);
  };

  Aios.config({iterations:100,
               fastcopy:this.options.fastcopy,
               verbose:this.options.verbose});
  
  /* Install host platform tuple provider and consumer
  **
  */
  
  /*
  ** Each time a tuple of a specific dimension is requested by an agent (rd) 
  ** the provider function can return (provide) a mathcing tuple (returning the tuple).
  ** IO gate between agents/JAM and host application.
  */
  if (this.options.provider) this.world.nodes[this.node].ts.register(function (pat) {
    // Caching?
    return self.options.provider(pat);
  });

  /*
  ** Each time a tuple of a specific dimension is stored by an agent (out) 
  ** the consumer function can return consume the tuple (returning true).
  ** IO gate between agents/JAM and host application.
  */
  if (this.options.consumer) this.world.nodes[this.node].ts.register(function (tuple) {
    // Caching?
    return self.options.consumer(tuple);
  },true);

  // Register a connection {send,status] for Aios.Mobi ...
  if (this.options.connections) {
    for (p in this.options.connections) {
      conn=this.options.connections[p];
      function makeconn (p,conn) {
        return { 
          send: function (data,dest,context) {
            var res;
            self.world.nodes[self.node].connections[p].count += data.length;
            res=conn.send(data,dest);
            if (!res) {
              context.error='Migration to destination '+dest+' failed';
              // We're still in the agent process context! Throw an error for this agent ..
              throw 'MOVE';              
            };

            // kill ghost agent
            context.process.finalize();
          },
          status : conn.link?conn.link:(function () {return true}),
          count:0
        }       
      }
      this.world.nodes[this.node].connections[p] = makeconn(p,conn);
    }
  }
  
  this.process = Aios.Proc.Proc();
  this.process.agent={id:'jamlib'};
  
  if (this.verbose) this.Aios.options.log.node=true;
}

// Import analyzer class...
var JamAnal = Require('jam/analyzer');
JamAnal.current(Aios);
jam.prototype.analyzeSyntax=JamAnal.jamc.prototype.analyze;
jam.prototype.syntax=JamAnal.jamc.prototype.syntax;



/** Add agent class templates to the JAM world and create sandboxed constructors.
 *  type templates = {<ac name>:function|{fun:function,mask:{}}},..} 
 */
jam.prototype.addClass = function (templates) {
  for (var p in templates) {
    if (this.verbose) this.log('Added agent class '+p);
    this.world.classes[p]=[
      this.Aios.Code.makeSandbox(templates[p],0),
      this.Aios.Code.makeSandbox(templates[p],1),
      this.Aios.Code.makeSandbox(templates[p],2),
      this.Aios.Code.makeSandbox(templates[p],3)      
    ]
  }
};
/** Add a new node to the world.
 *  Assumption: 2d meshgrid network with (x,y) coordinates.
 *  The root node has position {x=0,y=0}.
 *  type of nodeDescs = {x:number,y:number,id?}
 *
 */
jam.prototype.addNode = function (nodeDesc) {
  var node,x,y;
  x=nodeDesc.x;
  y=nodeDesc.y;
  if (Comp.array.find(this.world.nodes,function (node) {
    return node.position.x==x && node.position.y==y;
  })) {
    this.err('addNodes: Node at positition ('+x+','+y+') exists already.');
    return;
  }
  node=Aios.Node.Node({id:nodeDesc.id||Aios.aidgen(),position:{x:x,y:y}},true);
  if (this.verbose) this.log('Created node '+node.id+' ('+x+','+y+').');
  // Add node to world
  this.world.addNode(node);    
  return node.id;
}

/** Add logical nodes.
 *  The root node has position {x=0,y=0}.
 *  type of nodes = [{x:number,y:number,id?},..]
 */
jam.prototype.addNodes = function (nodes) {  
  var n,node,x,y,nodeids=[];
  for(n in nodes) {
    nodeids.push(this.addNode(nodes[n]));
  }
  return nodeids;
}

/** Analyze agent class template in text or object form
 *  Returns {report:string,interface}
 */
jam.prototype.analyze = function (ac,options) {
  var syntax,content,report,interface;
  if (Comp.obj.is_String) {
  
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

/** Connect logical nodes (virtual link).
 *  The root node has position {x=0,y=0}.
 *  type of links = [{x1:number,y1:number,x2:number,x2:number},..]
 */
jam.prototype.connectNodes = function (connections) {  
  var c,node1,node2,x1,y1,x2,y2,dir;
  for(c in connections) {
    x1=connections[c].x1;
    y1=connections[c].y1;
    x2=connections[c].x2;
    y2=connections[c].y2;
    if (this.verbose) this.log('Connecting ('+x1+','+y1+') -> ('+x2+','+y2+')');
    node1=Comp.array.find(this.world.nodes,function (node) {
      return node.position.x==x1 && node.position.y==y1;
    });
    node2=Comp.array.find(this.world.nodes,function (node) {
      return node.position.x==x2 && node.position.y==y2;
    });
    if (!node1) this.err('connectNodes: Node at positition ('+x1+','+y1+') does not exist.');
    if (!node2) this.err('connectNodes: Node at positition ('+x2+','+y2+') does not exist.');
    if ((x2-x1)==0) {
      if ((y2-y1) > 0) dir=Aios.DIR.SOUTH;
      else dir=Aios.DIR.NORTH;
    } else if ((x2-x1)>0) dir=Aios.DIR.EAST;
    else dir=Aios.DIR.WEST;
    this.world.connect(dir,node1,node2);
    this.world.connect(Aios.DIR.opposite(dir),node2,node1);
  }
}

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
jam.prototype.createAgent = function (ac,args,level,className) {
  var node=this.world.nodes[this.node],
      process=none,sac;
  if (level==undefined) level=1;
  
  if (Comp.obj.isFunction(ac) || Comp.obj.isObject(ac)) {
    // Create an agent process from a constructor function or sandboxed constructor object
    process = Aios.Code.createOn(node,ac,args,level,className);
    if (process) return process.agent.id;   
  } else {
    // It is a class name. Find an already sandboxed constructor from world classes pool
    if (this.world.classes[ac])
      process = Aios.Code.createOn(node,this.world.classes[ac][level],args);
    else this.print('create: Cannot find agent class '+ac);
    if (process) {
      process.agent.ac=ac;
      return process.agent.id; 
    } else return none;
  }
}

/** Execute an agent snapshot delivered in JSON+ text format 
*/
jam.prototype.execute = function (data) {
  return this.world.nodes[this.node].receive(data,true);
}

/** Extend AIOS of pseicifc privilege level. The added functions can be accessed by agents.
 *
 */
jam.prototype.extend = function (level,name,func) {
  var self=this;
  if (Comp.obj.isArray(level)) {
    Comp.array.iter(level,function (l) {self.extend(l,name,func)});
    return;
  }
  switch (level) {
    case 0: 
      if (Aios.aios0[name]) throw Error('JAM: Cannot extend AIOS(0) with'+name+', existst already!');
      Aios.aios0[name]=func; break;
    case 1: 
      if (Aios.aios1[name]) throw Error('JAM: Cannot extend AIOS(1) with'+name+', existst already!');
      Aios.aios1[name]=func; break;
    case 2: 
      if (Aios.aios2[name]) throw Error('JAM: Cannot extend AIOS(2) with'+name+', existst already!');
      Aios.aios2[name]=func; break;
    case 3: 
      if (Aios.aios3[name]) throw Error('JAM: Cannot extend AIOS(3) with'+name+', existst already!');
      Aios.aios3[name]=func; break;
    default:
      throw Error('JAM: Extend: Invalid privilige level argument ([0,1,2,3])');
  }
}
 

/** Tuple space input operation - non blocking, i.e., equiv. to inp(pat,_,0)
 */
jam.prototype.inp = function (pat) {
  return this.world.nodes[this.node].ts.extern.inp(pat);
}


/** Kill agent with specified id
 */
jam.prototype.kill = function (id) {
  return Aios.kill(id);
}

/** Execute an agent snapshot in JSON+ text form after migration
*/
jam.prototype.migrate = function (data) {
  return this.world.nodes[this.node].receive(data,false);
}

/** Read and parse one agent class from file.
 *  Format: function (p1,p2,..) { this.x; .. ; this.act = {..}; ..}
 */
if (fs) jam.prototype.open = function (file,options) {
  var self=this,
      res,
      text,
      name,
      ast=null;
  if (!options) options={};
  name=options.classname||'<anonymous>';
  if (options.verbose>0) this.print('Reading agent class template '+name+' from '+file);
  
  function parseModel (text) {
    function open(filename) {
      var text=Io.read_file(filename);
      if (text==undefined) 
         self.print('Error: Opening of file '+filename+' failed!'); 
      else return parseModel(text);
    }
    try {
      eval('res = '+text);
      return res;
    } catch (e) {
      try {
        ast = Esprima.parse(text, { tolerant: true, loc:true });
        if (ast.errors && ast.errors.length>0) more = ', '+ast.errors[0];
      } catch (e) {
        if (e.lineNumber) more = ', in line '+e.lineNumber; 
      } 
      self.print(e.name+(e.message?': '+e.message:'')+(more?more:''));
    }
  }
  var text=Io.read_file(file);
  if (text==undefined) {
    self.print('Error: Opening of file '+file+' failed!'); 
    return undefined;
  } else return parseModel(text);
};

/** Tuple space output operation 
 */
jam.prototype.out = function (tuple) {
  return this.world.nodes[this.node].ts.extern.out(tuple);
}

/** Tuple space read operation - non blocking, i.e., equiv. to rd(pat,_,0)
 */
jam.prototype.rd = function (pat) {
  return this.world.nodes[this.node].ts.extern.rd(pat);
}

/** Read and compile agent class templates from file
 *  Expected file format: module.exports = { ac1: function (p1,p2,..) {}, ac2:.. }
 *
 */
if (fs) jam.prototype.readClass = function (file,options) {
  var self=this,
      ac,
      text,
      modu,
      p,
      regex1,
      ast=null,
      all=null,
      off=null;
  if (!options) options={};
  if (options.verbose>0) this.print('Looking up agent class template(s) from '+file);
  modu=Require(file);
  if (Comp.obj.isEmpty(modu)) {
    if (options.verbose>0) this.print('Importing agent class template(s) from file '+file);
    if (Comp.string.get(file,0)!='/') file = './'+file;
    modu=require(file);
    all=Io.read_file(file);
    ast=Esprima.parse(all, { tolerant: true, loc:true });
  }
  if (!modu) this.print('Importing of agent class template(s) from '+file+' failed (empty).');

  for (p in modu) {
    ac={};
    ac[p]=modu[p];
    if (all) off=this.syntax.find(ast,'VariableDeclarator',p);
    if (off && off.loc) this.syntax.offset=off.loc.start.line-1;
    content = 'var ac = '+modu[p];
    syntax = Esprima.parse(content, { tolerant: true, loc:true });
    this.analyzeSyntax(syntax,
      {
        classname:p,
        level:2,
        verbose:options.verbose,
        err:function (msg){self.print(msg)},
        out:function (msg){self.print(msg)},
        warn:function (msg){self.print(msg)}
      });
      
    text=Json.stringify(ac);
    regex1= /this\.next=([a-zA-Z0-9_]+)/;
    text=text.replace(regex1,"this.next='$1'");
    // console.log(text);
    ac=Json.parse(text,{});    
    if (options.verbose>0) this.print('Adding agent class constructor '+p+'.');
    this.addClass(ac);
    this.syntax.offset=0;
  }
};

/** Disconnect and remove a virtual node from the world
 *
 */
jam.prototype.removeNode = function (nodeid) {
  this.world.removeNode(nodeid);  
}

/** Tuple space remove operation 
 */
jam.prototype.rm = function (pat) {
  return this.world.nodes[this.node].ts.extern.rm(pat);
}

/** Force a scheduler run immediately normally executed by the
 *  jam service loop. Required if there were externeal agent 
 *  management, e.g., by sending signals.
 */
jam.prototype.schedule = function () {
  if (this.loopnext) clearTimeout(this.loopnext);
  this.loop();
}

/** Set current node
 *
 */
jam.prototype.setCurrentNode=function (n) {
  if (n>=0 && n < this.world.nodes.length) this.node=n;
}

/** Send a signal to a specific agent 'to'.
 *
 */
jam.prototype.signal=function (to,sig,arg,broadcast) {
  var _process=Aios.current.process;
  Aios.current.process=this.process;
  if (!broadcast)
    Aios.aios.send(to,sig,arg);
  else  
    Aios.aios.broadcast(to,sig,arg);    
    
  Aios.current.process=_process;
}

/** Start the JAM scheduler
 *
 */
jam.prototype.start=function () {
  this.run=true;
  this.world.start();
  this.print('Starting ..');
  this.loop();
}

/** Get agent process table info and other statistics
 *
 *  type kind = {'process'}
 */
 
 
jam.prototype.stats = function (kind) {
  var p,n,pro,agent,state,stats,allstats={},node;
  switch (kind) {
    case 'process':      
      for(n in this.world.nodes) {        
        stats={};
        node=this.world.nodes[n];
        for (p in node.processes.table) {
          if (node.processes.table[p]) {
            pro=node.processes.table[p];
            agent=pro.agent;
            if (pro.blocked||pro.suspended) state='BLOCKED';
            else if (pro.dead) state='DEAD';
            else if (pro.kill) state='KILL';
            else if (pro.move) state='MOVE';
            else state='READY';
            stats[agent.id]={
              pid:pro.pid,
              gid:pro.gid,
              state:state,
              next:agent.next
            };
          }
        }
        allstats[node.id]=stats;
      }
    break;
  }
  if (this.world.nodes.length==1) return stats;
  else return allstats;
}

/** Stop the JAM scheduler
 * 
 */
jam.prototype.stop=function () {
  this.run=false;
  this.print('Stopping ..');
  if (this.loopnext)
    clearTimeout(this.loopnext);
}

jam.prototype.version=function () {
  return options.version;
}
var Jam = function(options) {
  var obj = new jam(options);
  return obj;
};

module.exports = {
  Jam:Jam,
  Windows:Windows,
  X11:X11
}
