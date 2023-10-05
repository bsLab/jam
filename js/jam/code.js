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
 **    $INITIAL:     (C) 2006-2022 bLAB
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: code.js,v 1.4 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.12.1
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Code Management Sub-System
 **
 **  New: Correct soft code minifier with char state machine (CSM) if there is no builtin minifier
 **  New: Check pointing (CP) can be replaced with JS VM watchdog timer.
 **  New: Fast sandboxed constructor
 **  New: Dual mode JSON+/JSOB (with auto detection in toCode)
 **  New: Dirty fastcopy process copy (JS object copy)
 **  New: Function toString with minification (if supported by platform)
 **
 **  JSOB: Simplified and compact textual representation of JS object including function code
 **        (Aios.options.json==false)
 **
 **    $ENDOFINFO
 */
 
var options = {
  debug:{},
  compactit : false,  // no default compaction, only useful with Aios.options.json==true
  version   : '1.12.1'
}
// Fallback minifier with char state machine
var minify = Require('com/minify');

var Esprima = Require('parser/esprima');

try {
  // Use built-in JS code minimizer if available
  var M = process.binding('minify');
  Function.prototype._toString=Function.prototype.toString;
  Function.prototype.toString = function (compact) {
    return compact?M.minify(this._toString()):this._toString();
  }
  options.minifier=true;
  options.minifyC=true;
  minify=M.minify;
} catch (e) {
  Function.prototype._toString=Function.prototype.toString;
  Function.prototype.toString = function (compact) {
    return compact?minify(this._toString()):this._toString();
  }
  options.minifier=true;
}; 
 
var Io = Require('com/io');
var Json = Require('jam/jsonfn');
var Comp = Require('com/compat');
var sandbox = Require('jam/sandbox')();
var current=none;
var Aios = none;
var util = Require('util');

/* Test if Json.stringify returns compacted code, otherwise text must be compacted here */
function _testac (p1,p2) {
  /* comment */
  this.x = p1;
  this.y = p2;
  this.z = 0;
  this.act = {
    init: function () {
      /* comment */
      this.z=this.x;
      this.x++;
    }
  }
}
var _testobj = new _testac(1,2);
options.compactit=Json.stringify(_testobj).length>93;
var inject = {cp:undefined,rt:undefined};

// options.compactit=false;

/** Construct an agent object with given arguments (array)
 *
 */

function construct(constructor,argArray) {
  var inst = Object.create(constructor.prototype);
  constructor.apply(inst, argArray);
  return inst;  
}

/** Fast dirty copy (fork): Return a fresh copy of the agent object (i.e., process.agent, instead using ofCode/toCode transf.)
 *  attached to a new process object.
 *  All function and AIOS references will be copied as is. The AIOS level cannot be changed. The mask of the 
 *  parent process is now valid for the copied process, too. Any changes in the parent environment effects the child
 *  process, too, and vice versa.
 *
 */
function copyProcess(process) {
  var _process,_agent,agent=process.agent,mask=process.mask;

  process.node.stats.fastcopy++;

  agent.process={};
  
  for (var p in process) {
    switch (p) {
      case 'schedule':
        if (process.schedule.length > 0) 
          agent.process[p]=process.schedule;
        // keep it only if <> []        
        break;
      case 'blocked':
        if (agent.process.suspended==true) 
          agent.process[p]=true;
        // keep it only if it is true   
        break;
      case 'gid':
      case 'pid':
        break; // ?????
      // case 'delta':
      case 'back':
      case 'dir':
        // keep it
         agent.process[p]=process[p];
        break;
    }
  }
  if (Comp.obj.isEmpty(agent.process)) agent['process']=undefined;
  agent['self']=undefined;

  _agent=Comp.obj.copy(agent);
  
  if (!_agent.process) 
    _process=Aios.Proc.Proc({mask:mask,agent:_agent});
  else {
    _process=Aios.Proc.Proc(agent.process);
    _process.init({timeout:0,schedule:[],blocked:false,mask:mask,agent:_agent});
    _agent['process']=undefined;
  }
  agent['self']=agent;
  return _process;
}

/** Return name of a class constructor function
 *
 */
function className (f) {
  var name=f.toString().match(/[\s]*function[\s]*([a-z0-9]+)[\s]*\(/);
  return name?name[1]:"unknown"
}

/** Create a sandboxed agent object process on the current node
 *  using either a sandboxed agent constructor object {fun,mask}
 *  or a generic agent class constructor function that is sandboxed here.
 *
 *  Returns process object.
 *
 * type create = 
 *  function (node:node,
 *            constructor:function|{fun:function,mask:{}},
 *            args:{}|[],level?:number,className?:string) -> process
 */
function create(constructor,args,level,className) {
  return createOn(current.node,constructor,args,level,className);
}

/** Create a sandboxed agent process on a specified node
 *  using either a sandboxed agent constructor object {fun,mask}
 *  or a generic agent class constructor function that is sandboxed here.
 *  
 *
 *  Returns process object.
 *
 * type createOn = 
 *  function (node:node,
 *            constructor:function|{fun:function,mask:{}},
 *            args:{}|*[],level?:number,className?:string) -> process
 */
function createOn(node,constructor,args,level,className) {
  if (!constructor.fun && !Comp.obj.isFunction(constructor)) {
    Aios.err('Code.create: No valid constructor function specified.');
    return;
  }
    
  var code,
      agent0,
      agent,
      process,
      _process;
      
  _process=current.process; 
  current.process={timeout:0};
  if (level==undefined) level=Aios.options.LEVEL;
  
  try {
    if (!constructor.fun) 
      constructor=makeSandbox(constructor,level);
    if (!(args instanceof Array)) args=[args];
    
    agent0= construct(constructor.fun,args);

    if (!agent0) {
      Aios.err('Code.createOn ('+className+'): Agent constructor failed.');
      current.process=_process;  
      return null;
    }

    process=makeProcess(agent0,constructor.mask);
    process.resources.memory=constructor.size||0;
    current.process=_process;  
  
  } catch (e) {
    current.process=_process;  
    Aios.err('Code.createOn ('+className+'): '+e);
    return;
  }
  
  agent=process.agent;
  if (!Comp.obj.isArray(args) && Comp.obj.isObject(args))
    for (var p in args) {
      if (Comp.obj.hasProperty(agent,p)) agent[p]=args[p];
    }
  // Test minimal structure requirements
  if (!agent['next'] || !agent['trans'] || !agent['act']) {    
    Aios.err('Code.createOn: Missing next/trans/act attribute in agent constructor '+className);
    return none;  // must be defined and initialized
  }
  process.level=level;
  agent['self']=agent;
  if (className) agent['ac']=className;
  node.register(process);

  node.stats.create++;
  
  return process;
}

// fork an egent from { x:this.x, .., act : {}|[], trans:{}, on:[}}
function createFromOn(node,_process,subclass,level) {
  var code,process;
  code = forkCode(_process,subclass);
  process = toCode(code,level);
  process.agent.id=Aios.aidgen();
  process.init({gid:_process.pid});
  node.register(process);
  var agent_=process.agent;
  if (!subclass.next) try {
    agent_.next=(typeof agent_.trans[agent_.next] == 'function')?agent_.trans[agent_.next].call(agent_):
                                                                 agent_.trans[agent_.next];
  } catch (e) { /*kill agent?*/ process.kill=true; };
  return process;
}

/** Create a compiled agent process in a sandbox environment from an 
 *  agent class constructor function on the current node.
 *  Returns JSON+/JSOB representation of agent process snapshot and
 *  the newly created process.
 *
 */
function createAndReturn(constructor,ac,args,level) {
  if (!(args instanceof Array)) args=[args];
/*
  var code = ofCode({agent:new constructor(args[0],args[1],args[2],args[3],
                                           args[4],args[5],args[6],args[7],
                                           args[8],args[9])},true);
*/
  var process,agent,
      code = ofCode({agent:construct(constructor,args)},true);
  if (level==undefined) level=Aios.options.LEVEL;
  process = toCode(code,level);
  agent=process.agent;
  agent.id=Aios.aidgen();
  agent.ac=ac;
  return {code:ofCode(process,false),process:process};
}

/** Fork an agent object and return JSON+/JSOB text code.
 *  Note: Forking discards current scheduling blocks (in contrast to migration)!!!
 *
 *  New: subclass: { x:this.x, .., act : {}|[], trans:{}, on:[}}
 *  Used to subclass parent agent
 *
 *  Returns cleaned code (w/o CP and internal AIOS properties).
 *
 */
function forkCode(process,subclass) {
  var code='',p;
  var agent,self;
  var agent;
  if (!subclass) {
    agent = process.agent;
    self = agent.self;
    // Clean up current agent process
    agent['process']=undefined;
    agent['self']=undefined;
  } else if (typeof subclass == 'object') {
    var agent = { act:{}, trans:{}, next:process.agent.next}
    console.log(subclass)
    for (p in subclass) {
      var o = subclass[p];
      switch (p) {
        case 'act':
          if (Comp.obj.isArray(o)) {
            for(var q in o) {
              var v = o[q];
              if (process.agent.act[v]) 
                agent.act[v]=process.agent.act[v];
            }           
          } else if (Comp.obj.isObject(o)) {
            for(var q in o) {
              agent.act[q]=o[q];
            }           
          }
          break;
        case 'trans':
          // only updates here
          if (Comp.obj.isObject(o)) {
            for(var q in o) {
              agent.trans[q]=o[q];
            }           
          }
          break;
        case 'on':
          agent.on={};
          if (Comp.obj.isArray(o)) {
            for(var q in o) {
              var v = o[q];
              if (process.agent.on[v])
                agent.on[v]=process.agent.on[v];
            }           
          } else if (Comp.obj.isObject(o)) {
            for(var q in o) {
              agent.on[q]=o[q];
            }           
          }
          break;
        case 'var':
          if (Comp.obj.isArray(o)) {
            for(var q in o) {
              var v = o[q];
              agent[v]=process.agent[v];
            } 
          }
          break;
        default:
          agent[p]=o;
          break;
      }
    }
    // include all remaining necessary transitions
    for(var p in agent.act) {
      if (!agent.trans[p] && process.agent.trans[p])
        agent.trans[p]=process.agent.trans[p];
    }
  } else throw "forkCode: invalid subclass"
    
  code=Aios.options.json?Json.stringify(agent):toString(agent);
  
  if (!subclass) {
    // Restore current agent process
    agent.process=process;
    agent.self=self;
  }
  
  // Cleanup required?
    
  // CP/RT removal
  if (inject.cp || inject.rt)
    code=removeInjection(code);
  return code;
}

/** Convert agent object code from a process to text JSON+/JSOB.
 *  Returns cleaned code (w/o CP and internal AIOS properties).
 *  @clean: Code is already clean, no further filtering
 *
 */
function ofCode(process,clean) {
  var code='',p;
  var agent=process.agent;
  agent.process={};
  
  for (var p in process) {
    switch (p) {
      case 'schedule':
        if (process.schedule.length > 0) 
          agent.process[p]=process.schedule;
        // keep it only if <> []        
        break;
      case 'blocked':
        if (agent.process.suspended==true) 
          agent.process[p]=true;
        // keep it only if it is true   
        break;
      case 'gid':
      case 'pid':
        break; // ?????
      // case 'delta':
      case 'back':
      case 'dir':
        // keep it
         agent.process[p]=process[p];
        break;
    }
  }
  if (Comp.obj.isEmpty(agent.process)) agent['process']=undefined;
  agent['self']=undefined;

  try {
    code=Aios.options.json?Json.stringify(agent):toString(agent);
  } catch (e) {
    throw 'Code.ofCode: Code-Text serialization failed ('+e.toString()+')';
  }
  if (clean && !options.compactit) return code;
  
  
  /* Compaction should only be done one time  on agent creation with compact=true option. 
  **
  */
    
  if (!clean && (inject.cp||inject.rt)) 
    // CP/RT removal; no or only partial watchdog support by platform
    code=removeInjection(code);

  if (options.compactit) code=minimize(code);

  return code;
}

/** Fast copy agent process creation (virtual, migrate).
 *  All function and AIOS references will remain unchanged. The AIOS level cannot be changed. The mask of the 
 *  original (died) process is now valid for the new process, too.
 */
function ofObject(agent) {
  var process;
  
  if (!agent.process) 
    process=Aios.Proc.Proc({mask:agent.mask,agent:agent});
  else {
    process=Aios.Proc.Proc(agent.process);
    process.init({timeout:0,schedule:[],blocked:false,mask:agent.mask,agent:agent});
    agent['process']=undefined;
  }
  agent['mask']=undefined;

  process.node.stats.fastcopy++;
    
  return process;
}

/** Convert agent text sources to agent code in JSOB format
 *
 */
function _ofString(source,mask) {
  var code;
  try {
    // execute script in private context
    with (mask) {
      eval('"use strict"; code = '+source);
    }
  } catch (e) { console.log(e) };
  return code; 
}
function ofString(source,mask) {
  // arrow functions do not have a this variable
  // they are bound to this in the current context!
  // need a wrapper function and a temporary this object
  var self={},temp;
  function evalCode() {
    var code;
    try {
      // execute script in private context
      with (mask) {
        eval('"use strict"; code = '+source);
      }
    } catch (e) { console.log(e) };
    return code;
  }
  temp = evalCode.call(self);
  // arrow functions are now bound to self, 
  // update self with temp. agent object first-level attributes
  self=Object.assign(self,temp);
  return self; 
}

function parseString (source,mask) {
  // deal with arrow functions correctly
 // arrow functions do not have a this variable
  // they are bound to this in the current context!
  // need a wrapper function and a temporary this object
  var self={},temp;
  function evalCode() {
    var code;
    try {
      code = Json.parse(source,mask);
    } catch (e) { console.log(e) };
    return code;
  }
  temp = evalCode.call(self);
  // arrow functions are now bound to self, 
  // update self with temp. agent object first-level attributes
  self=Object.assign(self,temp);
  return self; 
}
/** Create an agent process from agent object code
 *
 */
function makeProcess (agent,mask) {
  var process;
  // Add all activities to the masked environment:
  if (mask) for(var p in agent.act) {
    mask[p]=p;
  }
  if (!agent.process) 
    process=Aios.Proc.Proc({mask:mask,agent:agent});
  else {
    process=Aios.Proc.Proc(agent.process);
    process.init({timeout:0,schedule:[],blocked:false,mask:mask,agent:agent});
    agent['process']=undefined;
  }
  agent['self']=agent;
  
  return process;
}

/** Create a sandboxed agent class constructor object {fun,mask} from
 *  an agent class template constructor function providing 
 *  a sandboxed agent constructor function and the sandbox 
 *  mask agent environment. 
 *  The optional environment object 'env' can contain additional references, e.g.,
 *  activitiy references.
 *
 * Note: All agents created using the constructor function share the same mask
 *       object!
 *
 * typeof constructor = function|string
 * typeof sac = {fun:function, mask: {}, size:number } 
 */
function makeSandbox (constructor,level,env) {
  var _process,sac,aios;
  switch (level) {
    case 0: aios=Aios.aios0; break;
    case 1: aios=Aios.aios1; break;
    case 2: aios=Aios.aios2; break;
    case 3: aios=Aios.aios3; break;
    default: aios=Aios.aios0; break;
  }
  _process=current.process; 
  current.process={timeout:0};
  sac=sandbox(constructor,aios,inject,env);
  current.process=_process;
  return sac;
}

/** Minimize code text
 *
 */
function minimize (code) { return minify(code) }

/** Print agent code
 */
 
function print(agent,compact) {
  var process = agent.process;
  var self = agent.self;
  agent['process']=undefined;
  agent['self']=undefined;

  var text=Aios.options.json?Json.stringify(agent):toString(agent);

  agent.process=process;
  agent.self=self;

  if (!text) return 'undefined';
  
  var regex4= /\\n/g;

  if (inject.cp || inject.rt)
    // CP/RT removal; i.e., none or only partial watchdog support by platform
    text= removeInjection(text);

  if (compact && options.compactit)
    text=minimize(text);
    
  return text.replace(regex4,'\n');  
}

/** Remove CP/RT injections from code text
 *
 */
function removeInjection(text) {
  // CP removal
  if (inject.cp) {
    var regex1= /CP\(\);/g;
    var regex2= /\(\(([^\)]+)\)\s&&\sCP\(\)\)/g;
    var regex3= /,CP\(\)/g;
    text=text.replace(regex1,"").replace(regex2,"($1)").replace(regex3,"");
  }
  // RT removal
  if (inject.rt) {
    var regex4= /RT\(\);/g;
    text=text.replace(regex4,"");
  }
  return text;
}

/**  Returns size of cleaned code (w/o CP and internal AIOS properties).
 *
 */
function size(agent) {
  var text='',p;
  var process = agent.process;
  var self = agent.self;
  agent['process']=undefined;
  agent['self']=undefined;
  
  text=Aios.options.json?Json.stringify(agent):toString(agent);
  
  agent.process=process;
  agent.self=self;
  
  if (inject.cp || inject.rt) {   
    text=removeInjection(text);
  }

  return text.length;
}

function test (what) {
  switch (what) {
    case 'minify': if (minify.test) minify.test(); break;
  }
}

/** Convert JSON+/or JSOB text to an agent object process encapsulated in a sandbox (aios access only).
 *  Returns process container with CP injected agent code (process.agent).
 *
 *  CP Injection (required on generic JS VM platform w/o watchdog, e.g., node.js, browser):
 *    1. In all loop expressions (for/while)
 *    2. In all function bodies (start)
 *
 *  No watchdog: Aios.watchdog == undefined (nodes.js, browser)
 *  Full watchdog implementation: Aios.watchdog && Aios.watchdog.checkPoint==undefined (jvm)
 *  Partial watchdog implementation with checkPoint function: Aios.watchdog.checkPoint (jxcore)
 * 
 *
 */
function toCode(text,level) {
  var agent,
      process,
      p,
      aios,
      next;
  switch (level) {
    case undefined:
    case 0: aios=Aios.aios0; break;
    case 1: aios=Aios.aios1; break;
    case 2: aios=Aios.aios2; break;
    case 3: aios=Aios.aios3; break;
    default: aios=Aios.aios0; break;
  }
  if (inject.cp) {
    // CP injection; no or only partial watchdog support
    var regex1= /while[\s]*\(([^\'")]+)\)/g;
    var regex2= /for[\s]*\(([^\)'"]+)\)/g;
    var regex3= /function([^\{'"]+)\{/g;
  
    text=text.replace(regex1,"while (($1) && CP())")
             .replace(regex2,"for ($1,CP())")
             .replace(regex3,"function $1{CP();");
  }
  if (inject.rt) {
    // RT injection
    var regex4 = /catch[\s]*\([\s]*([a-zA-Z0-9_]+)[\s]*\)[\s]*\{/g;
    text=text.replace(regex4,'catch ($1) {'+inject.rt+'($1);');    
  }
  
  /* Set up an object to serve as the local context for the code
  ** being evaluated. The entire global scope must be masked out!
  ** Additionally, Json defines a variable current, which must be 
  ** masked, too.
  */  
  var mask = {current:undefined,require:undefined};
  // mask local properties 
  for (p in this)
    mask[p] = undefined;
  // mask global properties 
  for (p in global)
    mask[p] = undefined;
  // add sandbox content
  for (p in aios) {
    mask[p]=aios[p];
  }
  // Auto detect JSON+ / JSOB format
  var isjson=Comp.string.startsWith(text,'{"');
  try {agent=isjson?parseString(text,mask):ofString(text,mask);}
  catch (e) {    
    if (Aios.options.verbose) Aios.log('Aios.code.toCode: '+e+(current.error?(',\nin: '+current.error):''));
    return null;
  }
  if (!agent) {
    var more;
    try {        
      var ast = Esprima.parse('code='+text, { tolerant: true, loc:true });
      if (ast.errors && ast.errors.length>0) console.log(ast.errors[0]);
    } catch (e) {
      console.log(e);
    }
    __LASTCODE=text;
    return  Aios.log('Aios.code.toCode: Invalid agent code received (invalid source text?) See __LASTCODE');
  } 
  // Add all activities to the masked environment:
  for(var p in agent.act) {
    mask[p]=p;
  }
  if (!agent.process) 
    process=Aios.Proc.Proc({mask:mask,agent:agent});
  else {
    process=Aios.Proc.Proc(agent.process);
    process.init({timeout:0,schedule:[],blocked:false,mask:mask,agent:agent});
    agent['process']=undefined;
  }
  process.level=level;
  process.resources.memory=text.length;
  agent['self']=agent;
  
  return process;
}

/** Convert agent object (i.e., process.agent) to a snapshot object.
  * 
  */
function toObject(process) {
  var _process,_agent,agent=process.agent,mask=process.mask; 
   
  agent.process={};
  
  for (var p in process) {
    switch (p) {
      case 'schedule':
        if (process.schedule.length > 0) 
          agent.process[p]=process.schedule;
        // keep it only if <> []        
        break;
      case 'blocked':
        if (agent.process.suspended==true) 
          agent.process[p]=true;
        // keep it only if it is true   
        break;
      case 'gid':
      case 'pid':
        break; // ?????
      // case 'delta':
      case 'back':
      case 'dir':
        // keep it
         agent.process[p]=process[p];
        break;
    }
  }
  if (Comp.obj.isEmpty(agent.process)) agent['process']=undefined;
  agent['self']=undefined;

  _agent=Comp.obj.copy(agent);
  _agent.mask = mask;
  
  agent['self']=agent;
  return _agent;
}

/** Convert agent object to text source in JSOB format
 *
 */
function toString(o) {
  var p,i,s='',sep;
  if (Comp.obj.isArray(o)) {
    s='[';sep='';
    for(p in o) {
      s=s+sep+toString(o[p]);
      sep=',';
    }
    s+=']';
  } else if (o instanceof Buffer) {    
    s='[';sep='';
    for(i=0;i<o.length;i++) {
      s=s+sep+toString(o[i]);
      sep=',';
    }
    s+=']';  
  } else if (typeof o == 'object') {
    s='{';sep='';
    for(p in o) {
      if (o[p]==undefined) continue;
      s=s+sep+"'"+p+"'"+':'+toString(o[p]);
      sep=',';
    }
    s+='}';
  } else if (typeof o == 'string')
    s="'"+o.toString()+"'"; 
  else if (typeof o == 'function') 
    s=o.toString(true);   // try minification (true) if supported by platform
  else if (o != undefined)
    s=o.toString();
  else s='undefined';
  return s;
}


module.exports = {
  className:className,
  copyProcess:copyProcess,
  create:create,
  createAndReturn:createAndReturn,
  createFromOn:createFromOn,
  createOn:createOn,
  forkCode:forkCode,
  ofCode:ofCode,
  ofObject:ofObject,
  ofString:ofString,
  inject:inject,
  Jsonf:Json,
  makeProcess:makeProcess,
  makeSandbox:makeSandbox,
  minimize:minimize,
  print:print,
  size:size,
  test:test,
  toCode:toCode,
  toObject:toObject,
  toString:toString,
  options:options,
  current:function (module) { 
    current=module.current; 
    Aios=module;
    // Set-up inject configuration
    inject.cp=(Aios.watchdog && !Aios.watchdog.checkPoint)?undefined:'CP';
    inject.rt=(Aios.watchdog && Aios.watchdog.protect)?undefined:'RT';
    if (inject.cp||inject.rt) options.inject=inject;
    if (Aios.watchdog && Aios.watchdog.protect) options.watchdog='native';
    else options.watchdog=false;
  }
}
