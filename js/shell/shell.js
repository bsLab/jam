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
 **    $CREATED:     1-3-18 by sbosse.
 **    $VERSION:     1.36.1
 **
 **    $INFO:
 **
 **  JAM Shell Interpreter (Back end)
 **
 **  Highly customizable command shell interpreter for JAMLIB
 **
 **
 ** typeof @options= {
 **    echo?: boolean,
 **    modules? : {
 **      csp? :     Require('csp/csp'),
 **      csv? :     Require('parser/papaparse')
 **      db?  :
 **      des48? : 
 **      doc? :     Require('doc/doc'),
 **      http? :    Require('http'),
 **      https? :   Require('https'),
 **      httpserv? :   Require('http/https'),
 **      logic?:    Require('logic/prolog'),
 **      ml?:       Require('ml/ml'),
 **      nn?:       Require('nn/nn'),
 **      numerics?:       Require('numerics/numerics'),
 **      sat?:    Require('sat/sat'),
 **      readline? : Require('com/readline'),
 **      readlineSync? : Require('term/readlineSync'),
 **      sip? :     Require('top/rendezvous'),
 **      sql? :     Require('db/db'),
 **    },
 **    nameopts? : {length:8, memorable:true, lowercase:true},
 **    Nameopts? : {length:8, memorable:true, uppercase:true},
 **    output? : function,        // AIOS output (for all, except if defined ..)
 **    outputAgent? : function,   // Agent output
 **    outputAsync? : function,   // AIOS/generic async output
 **    outputPrint? : function,   // jamsh print output
 **    renderer? : renderer,
 **    server? : boolean,
 **  }
 **
 **    $ENDOFINFO
 */

Require('os/polyfill');

var JamLib  = Require('top/jamlib');
var util    = Require('util');
var Comp    = Require('com/compat');
var Io      = Require('com/io');
var Sat     = Require('dos/ext/satelize');
var Cluster = Require('shell/cluster');
var Sec     = Require('jam/security');
var Rpc     = Require('rpc/rpc');
var Esprima = Require("parser/esprima");
var Json    = Require('jam/jsonfn');

var options = {
  verbose : JamLib.environment.verbose||1,
  version : '1.36.1',
}

Cluster.current(JamLib.Aios);

// Utils
if (typeof print == 'undefined') print=console.log;
DIR = JamLib.Aios.DIR;

var NET = Require('jam/ampCOM'),
    url2addr=NET.url2addr,
    addr2url=NET.addr2url;

function format(line) {
  var msg;
  switch (typeof line) {
    case 'boolean':   msg=line.toString(); break;
    case 'string':    msg=line; break;
    case 'number':    msg=line.toString(); break;
    case 'function':  msg=line.toString(); break;
    case 'object':    msg=Io.inspect(line); break;
    default: msg='';
  }
  return msg;
}



/** Shell Interpreter Object
*
*/
function Shell (_options) {
  if (!(this instanceof Shell)) return new Shell(_options);
  this.options=Comp.obj.extend(options,_options);
  this.modules=options.modules||{};
  this.events = {};
  this.env = {};
  this.modules.forEach(function (mod,name) {
    switch (name) {
      case 'des48':
        JamLib.Aios[name]=mod;
        break;
      case 'ml': 
      case 'nn': 
      case 'csp': 
      case 'sat': 
      case 'numerics': 
        mod.current(JamLib.Aios);
        JamLib.Aios[name]=mod.agent;
        JamLib.Aios.aios1[name]=mod.agent;
        JamLib.Aios.aios2[name]=mod.agent;
        JamLib.Aios.aios3[name]=mod.agent;
        break;
      case 'nlp': 
      case 'logic': 
        JamLib.Aios[name]=mod;
        JamLib.Aios.aios1[name]=mod;
        JamLib.Aios.aios2[name]=mod;
        JamLib.Aios.aios3[name]=mod;
        break;      
    }
  })
  if (!this.options.renderer) {
    if (this.modules.doc) this.options.renderer=this.modules.doc.Renderer({lazy:true}); 
    else 
      this.options.renderer = function (text) {
        return text.replace(/\n:/g,'\n  ');
      }
  }
}

Shell.prototype.cmd = function () { return this.env }


Shell.prototype.emit = function (ev,arg1,arg2,arg3,arg4) {
  if (this.events[ev]) this.events[ev](arg1,arg2,arg3,arg4);
}


Shell.prototype.help = function() {
return this.options.renderer([
'# Usage',
' jamsh [-v] [script.js] [-- <script args>]',
'# Shell Commands',
'The following shell commands are avaiable:',
'',
'add({x,y})\n: Add a new logical (virtual) node',
'agent(id,proc?:boolean)\n: Returns the agent object (or process)',
'agents\n: Get all agents (id list) of current node',
'args\n: Script arguments',
'ask(question:string,choices: string [])\n: Ask a question and read answer. Available only in script mode.',
'array(n,init)\n: Creates initialised array',
'assign(src,dst)\n: Copy elements of objects',
'broker(ip)\n: Start a UDP rendezvous broker server',
'Capability\n: Create a security capability object',
'clock(ms)\n: Returns system time (ms or hh:mm:ss format)',
'cluster(desc)\n:Create a worker process cluster',
'config(options)\n: Configure JAM.  Options: _print_, _printAgent_,_TSTMO_',
'configs\n: Get configuration of JAM AIOS',
'connect({x,y},{x,y})\n: Connect two logical nodes (DIR.NORTH...)',
'connect({to:dir)\n: Connect to physical node',
'connected(to:dir)\n: Check connection between two nodes',
'compile(function)\n: Compile an agent class constructor function',
'concat(a,b)->c\n: Concatenate two values',
'contains(a,v)->boolean\n: Check if array or object contains a value or oen in an array of values',
'copy(o)\n: Returns copy of record or array',
'create(ac:string|function,args:*[]|{},level?:number,node?)\n: Create an agent from class @ac with given arguments @args and @level',
'csp?\n: Constraint Solving Programming',
'csv?\n: CSV file reader and writer (read,write)',
'des48?\n: DES48 Encryption',
'disconnect({x,y},{x,y})\n: Disconnect two logical nodes',
'disconnect({to:dir)\n: Diconnect remote endpoint',
'env\n: Shell environment including command line arguments a:v',
'empty(a)->boolean\n: Test empty string, array, or object',
'exec(cnd:string)\n: Execute a jam shell command',
'exit\n: Exit shell',
'extend(level:number|number[],name:string,function,argn?:number|number[])\n: Extend AIOS',
'filter(a,f)->b\n: Filter array or object',
'http.get(url:string,path:string,callback?:function)\n: Serve HTTP get request',
'http.put(url:string,path:string,data,callback?:function)\n: Serve HTTP put request',
'http.GET(url:string,params:{},callback?:function)\n: Serve HTTP JSON get request',
'http.PUT(url:string,params:{},data,data,callback?:function)\n: Serve HTTP JSON put request',
'http.server(ip:string,dir:string,index?:string)\n: Create and start a HTTP file server',
'info(kind:"node"|"version"|"host",id?:string)->info {}\n: Return information (node)', 
'inp(pattern:[],all?:boolean)\n: Read and remove (a) tuple(s) from the tuple space', 
'Json\n:JSON+ serializer',
'kill(id:string|number)\n: Kill an agent (id="*": kill all) or a task (started by later)',
'last(object|array)\n: Return last element of array, string, or object',
'later(ms:number,callback:function(id,counter)->booleabn)\n: Execute a function later. If fucntion returns true, next cycle is started.',
'load(path:string,mimetype?)\n: Load a JSON or CSV file (autodetect) or custom',
'lookup(pattern:string,callback:function (string [])\n: Ask broker for registered nodes',
'locate(callback?:function)\n: Try to estimate node location (geo,IP,..)',
'log(msg)\n: Agent logger function',
'logic??\n: Generic predicate (pro)logic framework module',
'mark(tuple:[],millisec)\n: Store a tuple with timeout in the tuple space', 
'merge\n: Add a column (array) to a matrix (array array)',
'ml?\n: Generic machine Learning framework module',
'name("node"|"world")\n: Return name of current node or wolrd',
'nlp?\n:  Natural language processing framework module',
'node\n: Get or set current vJAM node (default: root) either by index or id name',
'nodes\n: Get all vJAM nodes',
'numerics?\n: Numerics module (fft, vector, matrix, ..)',
'nn?\n: Neural Network framework module',
'neg(v)->v\n: Negate number, array or object of numebrs',
'object(s)\n: Convert string to object',
'ofJSON(s)\n: Convert JSON to object including functions',
'on(event:string,handler:function)\n: Install an event handler. Events: "agent+","agent-","signal+","signal","link+","link-","exit"',
'open(file:string,verbose?:number)\n: Open an agent class file',
'out(tuple:[])\n: Store a tuple in the tuple space', 
'os?\n: OS utils module', 
'pluck(table,column)\n:Extracts a column of a table (array array or object array)',
'port(dir,options:{proto,secure},node)\n: Create a new physical communication port',
'Port\n: Create a security port',
'Private\n: Create a security private object',
'provider(function)\n: Register a tuple provider function',
'random(a,b)\n: Returns random number or element of array/object', 
'rd(pattern:[],all?:boolean)\n: Read (a) tuple(s) from the tuple space', 
'reverse(a)->b\n: Reverse array or string',
'rm(pattern:[],all?:boolean)\n: Remove (a) tuple(s) from the tuple space', 
'sat?\n: Logic (SAT) Solver module',
'save(path:string,data:string,csv?:boolean)\n: Save a JSON or CSV file',
'script(file:string)\n: Load and execute a jam shell script',
'select(arr,a,b)\n: Split matrix (array array) by columns [a,b] or [a]',
'setlog(<flag>,<on>)\n: Enable/disable logging attributes',
'signal(to:aid,sig:string|number,arg?:*)\n: Send a signal to specifid agent',
'sleep(millisec)?\n:Suspend entire shell for seconds',
'start()\n: start JAM',
'stats(kind:"process"|"node"|"vm"|"conn")\n: Return statistics',
'stop()\n: stop JAM',
'sql(filename:string)\n: Open or create an SQL database. A memory DB can be created with _filename_=":memory:". Requires native sqlite3 plug-in.',
'Std.info/status/age/\n: Standard RPC AMP API',
'table?\n: Terminal table formatter',
'test(pattern:[])\n: Test existence of tuple', 
'ts(pattern:[],callback:function(tuple)->tuple)\n: Update a tuple in the space (atomic action) - non-blocking', 
'time()\n: print AIOS time',
'toJSON(o)\n: Convert object including functions to JSON',
'verbose(level:number)\n: Set verbosity level',
'versions()\n: Returns JAM shell and library version',
'uniqid\n: Returns a random name',
'utime()\n: Returns system time in nanoseconds',
'UI?\n: User Interface Toolkit',
'without(a,b)\n: Returns "a" without "b"',
'world\n: Returns world object',
].join('\n'));
}

/* Set-up the Interpreter
*
*/

Shell.prototype.init = function(callback) {
  var self=this;

  if (!this.options.server && this.modules.readline) {
    this.rl = this.modules.readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer : function (cmdline) {
          var args = Array.filter(String.split(' ', cmdline), function (str) {
              return str != '';
          });
          var completed=cmdline;
          var choices=[];
          return [choices,completed];
      }
    });

    this.rl.on('line', function (line) {
      self.cmdline = line;
      self.process(line)
      self.rl.prompt();
    });

    this.rl.on('close', function () {
    });
    if (this.modules.doc)
      this.output(this.modules.doc.Colors.bold('JAM Shell. Version '+this.options.version+' (C) Dr. Stefan Bosse'));
    else
      this.output('JAM Shell. Version '+this.options.version+' (C) Dr. Stefan Bosse');    
    this.rl.setPrompt('> ');
    this.rl.prompt();
  } else if (this.options.verbose) this.output('JAM Shell. Version '+this.options.version+' (c) Dr. Stefan Bosse');
  
  
  this.jam=JamLib.Jam({
      print:      this.output.bind(this),
      printAgent: this.outputAgent.bind(this),
      printAsync: this.outputAsync.bind(this),
      nameopts:   this.options.nameopts,
      Nameopts:   this.options.Nameopts,
      verbose:    this.options.verbose,
      type:       this.options.type||'shell'   // tyoe of root node
  });
  
  this.jam.init();
  
  function error(msg) {
    self.output('Error: '+msg);
  }

  self.log=self.output;

  this.tasks = [];
    
  this.env = {
    Aios:   this.jam.Aios,
    DIR:    this.jam.Aios.DIR,
    add:    this.jam.addNode.bind(this.jam),
    agent: function (id,proc) {
      var node = self.jam.world.nodes[self.jam.getCurrentNode()];
      if (node) {
        return proc?node.getAgentProcess(id):node.getAgent(id);
      }
    },
    get agents () {
      var node = self.jam.world.nodes[self.jam.getCurrentNode()];
      if (node) {
        return node.processes.table.map( function (pro) { return pro.agent.id });
      }
    }, 
    angle:  JamLib.Aios.aios0.angle,
    args:   options.args,
    array : JamLib.Aios.aios0.array,
    assign:  JamLib.Aios.aios0.assign,
    broker: function (ip) {
      if (!self.modules.sip) return;
      if (self.broker) self.broker.stop();
      if (!ip) ip='localhost';
      var ipport=10001,tokens = ip.toString().split(':');
      if (tokens.length==2) ip=tokens[0],ipport=Number(tokens[1]);
      self.broker=sip.Broker({ip:{address:ip,port:ipport},log:self.output.bind(self)});
      self.broker.init();
      self.broker.start();
    },
    Capability:     JamLib.Aios.Sec.Capability,
    clock: this.jam.clock.bind(this.jam),
    cluster : function (options) {
      return new Cluster(options,self.env);
    },
    compile: function (constr,name,options) {
      try {
        if (typeof name == 'object') // options?
          return self.jam.compileClass(undefined,constr,name)
        else
          return self.jam.compileClass(name,constr,options||{verbose:self.options.verbose})
      } catch (e) {
        error(e)
      }
    },
    config: function (options) {
      JamLib.Aios.config(options);
    },
    get configs () {
      return JamLib.Aios.configGet();      
    },
    connect:  function (n1,n2) { 
      if (n1 && n2)
        return self.jam.connectNodes([n1,n2]) 
      else
        return self.jam.connectTo(n1)
    },
    connected:   this.jam.connected.bind(this.jam),
    concat: JamLib.Aios.aios0.concat,
    contains: JamLib.Aios.aios0.contains,
    copy:     JamLib.Aios.aios0.copy,
    create: this.jam.createAgent.bind(this.jam),
    csp:     JamLib.Aios.csp,
    get current () { return JamLib.Aios.current },
    delta:  JamLib.Aios.aios0.delta,
    des48: JamLib.Aios.des48,
    disconnect:  function (n1,n2) { 
      if (n1 && n2) {}
         // TODO  
      else
        return self.jam.disconnect(n1)
    },
    distance : JamLib.Aios.aios0.distance,
    env: this.jam.environment,
    empty: JamLib.Aios.aios0.empty,
    extend: this.jam.extend.bind(this.jam),
    exec: this.process.bind(this),
    get exit () {   process.exit() },
    get help () {  return self.help() },
    filter:function (a,f) {
      var res=[],len,len2,i,j,found;
      if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
          res=[];
          len=a.length;
          for(i=0;i<len;i++) {
              var element=a[i];
              if (f(element,i)) res.push(element);
          }
          return res;
      } else if (Comp.obj.isArray(a) && Comp.obj.isArray(f)) {
          res=[];
          len=a.length;
          len2=f.length;
          for(i=0;i<len;i++) {
              var element=a[i];
              found=false;
              for (j=0;j<len2;j++) if(element==f[j]){found=true; break;}
              if (!found) res.push(element);
          }
          return res;      
      } else return undefined;   
    },
    flatten: JamLib.Aios.aios0.flatten,
    geoip : self.modules.geoip,
    Json:Json,
    ignore: function () { }, 
    info: this.jam.info.bind(this.jam),
    inspect: util.inspect,
    inp:    this.jam.inp.bind(this.jam),
    kill:   function (id) { 
      if (typeof id == 'string') self.jam.kill(id);
      else if (typeof id == 'number' && id >= 0) {
        if (self.tasks[id]) clearInterval(self.tasks[id]);
        self.tasks[id]=null;
      } 
    },
    last : JamLib.Aios.aios0.last,
    later:  function (timeout,callback) {
      var counter=0,id=self.tasks.length;
      var timer=setInterval(function () {
        try {
          var res=callback(id,counter);
        } catch (e) {
          error(e);
          res=0;
        }
        counter++;
        if (!res) {
          clearInterval(timer);
          self.tasks[id]=null;
        }
      },timeout)
      self.tasks[id]=timer;
      return id;
    },
    load:   function (file,mimetype) {
      var obj,text = Io.read_file(file);
      if (!text) return;
      if (!mimetype && file.match(/\.js$/)) mimetype='JS';
      if (!mimetype && file.match(/\.json$/)) mimetype='JSON';
      switch (mimetype && mimetype.replace(/application\//,'')) {
        case 'text': 
          return text;
      };
      var scanner = text.replace(/\/\/[^\n]*/g,'');
      if (scanner.match(/^\s*{/)||scanner.match(/^\s*\[\s*{/)||scanner.match(/^\s*\[\s*\[/)||scanner.match(/^\s*\[\s*\{/)) {
        switch (mimetype && mimetype.replace(/application\//,'')) {
          case 'JS': 
          case 'JSOB': 
            eval('"use strict"; obj = '+text);
            break; 
          case 'JSON':
          default:
            obj=self.env.ofJSON(text);
        };
      } else if (self.env.csv && self.env.csv.detect(text)) 
        obj=self.env.csv.read(text,false,true);
      return obj;
    },
    locate :  this.jam.locate.bind(this.jam),
    lookup:   this.jam.lookup.bind(this.jam),
    log:      this.jam.log.bind(this.jam),
    logic:    JamLib.Aios.logic,
    map : function (a,f) {
      var res,i,p;
      if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
        res=[];
        for (i in a) {
          v=f(a[i],i);
          if (v!=undefined) res.push(v);
        }
        return res;
      } else if (Comp.obj.isObject(a) && Comp.obj.isFunction(f)) {
        // Objects can be filtered (on first level), too!
        res={};
        for(p in a) {
          v=f(a[p],p);
          if (v != undefined) res[p]=v;
        }
        return res;
      } else return undefined;   
    },
    mark:    this.jam.mark.bind(this.jam),
    merge : function (a,b) {
      if (Comp.obj.isMatrix(a) && Comp.obj.isArray(b)) {
        a=a.map(function (row,i) { var _row=row.slice(); _row.push(b[i]); return _row })
      }
      return a
    },
    ml:     JamLib.Aios.ml,
    name:   function (of,arg) {
      switch (of) {
        case 'node': return self.jam.getNodeName(arg);
        case 'world': return self.jam.world.id;
      }
    },
    neg: JamLib.Aios.aios0.neg,
    get node ()   { return self.jam.getCurrentNode(true) },
    set node (n)  { return self.jam.setCurrentNode(n) },
    get nodes ()  { return self.jam.world.nodes.map(function (node) { return node.id }) },
    nlp:     JamLib.Aios.nlp,
    nn:     JamLib.Aios.nn,
    numerics:     JamLib.Aios.numerics,
    object: JamLib.Aios.aios0.object,
    ofJSON:  function (s) {
      return self.jam.Aios.Code.Jsonf.parse(s,{})
    },
    on:     function (ev,handler) {
      switch (ev) {
        case 'exit':
          process.on('exit',handler); process.on('SIGINT',function () { process.exit() });
          break;
        default:
          self.jam.on(ev,handler);
      }
    },
    open:   function (file,verbose) { 
      if (verbose==undefined) verbose=1; 
      return self.jam.readClass(file,{verbose:verbose}) },
    os:     self.modules.os,
    out:    this.jam.out.bind(this.jam),
    pluck: function (table,column) {
      var res=[];
      for(var i in table) {
        res.push(table[i][column]);
      }
      return res;
    },
    port:   function (dir,options,node) {
      if (typeof options == 'string') options={proto:options};
      else options=options||{};
      if (options.verbose==undefined) options.verbose=self.options.verbose;
      if (options.multicast == undefined) options.multicast=!options.broker;
      if (options.secure && options.secure.length!=Sec.PORT_SIZE) options.secure=Sec.Port.ofString(options.secure);
      var port=self.jam.createPort(dir,options,node);
      self.emit('port',dir,options);
      return port;
    },
    Port:     JamLib.Aios.Sec.Port,
    print : function () {
      if (arguments.length>1)
        self.outputPrint(Array.prototype.slice.call(arguments).map(Io.inspect).join(' '));
      else
        self.outputPrint(arguments[0])
    },
    Private:  JamLib.Aios.Sec.Private,
    provider: function (provider) {
      self.jam.world.nodes[0].ts.register(provider)
    },
    random: JamLib.Aios.aios.random,
    rd:     this.jam.rd.bind(this.jam),
    reduce: JamLib.Aios.aios0.reduce,
    reverse: JamLib.Aios.aios0.reverse,
    Rights: JamLib.Aios.Sec.Rights,
    rm:     this.jam.rm.bind(this.jam),
    Rpc:    Rpc,
    sat:     JamLib.Aios.sat,
    save : function (file,o,csv) {
      if (csv && self.env.csv) {
        self.env.csv.write(file,o[0],o.slice(1));
      } else Io.write_file(file,self.env.toJSON(o))
    },
    schedule : this.jam.schedule.bind(this.jam),
    script: function (file) {
      var text=Io.read_file(file);
      if (typeof text != 'string') text=text.toString();
      self.process(text);
    },
    select : function (data,a,b) {
      if (b==undefined) {
        return data.map(function(object) {
          return object[a];
        });
      } else {
        return data.map(function(object) {
          return object.slice(a,b+1);
        });      
      }
    },
    setlog: function (attr,on) { self.jam.Aios.config(on?{'log+':attr}:{'log-':attr}) },
    signal: this.jam.signal.bind(this.jam),
    start:  this.jam.start.bind(this.jam),
    start0:  this.jam.start0.bind(this.jam),
    stats:  this.jam.stats.bind(this.jam),
    Std :   JamLib.Aios.Amp.Rpc.Std,
    step:   this.jam.step.bind(this.jam),
    stop:   this.jam.stop.bind(this.jam),
    time:   this.jam.time.bind(this.jam),
    Time:   Io.Time,
    test:   this.jam.test.bind(this.jam),
    toJSON:  function (o) {
      // return self.jam.Aios.Code.minimize(
      return self.jam.Aios.Code.Jsonf.stringify(o)
    },
    ts:     this.jam.ts.bind(this.jam),
    uniqid: function (options) { return self.jam.Aios.aidgen(options) },
    UI:   self.modules.UI,
    url: {
      toAddr:   self.jam.Aios.Amp.url2addr,
      fromAddr: self.jam.Aios.Amp.addr2url,      
    },
    utime : function () {  hr=process.hrtime(); return hr[0]*1E9+hr[1] },
    verbose: function (l) { self.jam.Aios.config({verbose:l}); self.options.verbose=l; },
    versions: function () { return {shell:options.version,lib:JamLib.options.version, aios:JamLib.Aios.options.version} },
    without: JamLib.Aios.aios0.without,
    get world ()  { return self.jam.world },
  }

  if (this.options.extensions) {
    for(var p in this.options.extensions) this.env[p]=this.options.extensions[p];
  }
  if (this.modules.table) this.env.Table = this.modules.table;
  
  // Module dependent commands
  // HTTP
  if (this.modules.http) this.env.http = {
    get: function (url,path,callback) {
      var snd=url2addr(url),
          proto = snd.proto || 'http';
      if (proto == 'https' && !self.modules.https) throw ('http.get: unsupported HTTPS'); 
      if (!snd.port) snd.port=proto=='http'?80:443;
      if (!path) path='';
      else if (path.charAt(0)!='/') path = '/'+path;
      if (!self.modules.http.xhr) {
        req = (proto=='https'?self.modules.https.request:self.modules.http.request)({
          host: snd.address,
          port: snd.port,
          path: path,
          method: 'GET',
          keepAlive: true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; SunOS i86pc; rv:45.0) Gecko/20100101 Firefox/45.0',
          }
        } , function(res) {
          if (res.setEncoding != null) res.setEncoding('utf8');
          var body = '';
          res.on('data', function (chunk) {
            body = body + chunk;
          });
          res.once('end', function () {
            if (callback) callback(body);
          });
        });
        req.once('error', function(err) {
          print('Warning: request to '+addr2url(snd)+' failed: '+err);
          if (callback) callback(null,err);
        });
        req.end();
      } else {
        // XHR Browser
        self.modules.http.request({
          host: snd.address,
          port: snd.port,
          path:path,
          proto: proto,
          method: 'GET',
          keepAlive: true,
          headers: {
          }
        } , function(err,xhr,body) {
          if (err) {
            print('Warning: request to '+addr2url(snd)+' failed: '+err);
            if (callback) return callback(null,err);
          } 
          if (callback) callback(body);
        });    
      }
    },
    GET : function (url,params,callback) {
      var tokens=url.match(/(http[s]*)?([:\/\/]*)?([^\/]+)\/?(.+)?/);
      if (!tokens) throw "http.GET: Invalid URL";
      var proto = tokens[1]||'http',
          ip = tokens[3],
          path = tokens[4]||'',
          sep='';
      if (params) {
        path += '?';
        Object.keys(params).forEach(function (param) {
          path += (sep+param+'='+escape(params[param]));
          sep = '&';
        });
      }
      return self.env.http.get(proto+'://'+ip,path,function (result,err) {
        if (err || Comp.obj.isError(result)) {
          if (callback) callback(err || result);
          return;
        }
        try {
          result=JSON.parse(result);
          callback(result);
        } catch (e) {
          if (e.toString().indexOf('SyntaxError')!=-1 && callback)
             callback(e.toString()+'\n'+result);
          else callback(e);
        }
      });
    },
    put: function (url,path,data,callback) {
      var snd=url2addr(url),
          proto = snd.proto || 'http';
      if (proto == 'https' && !self.modules.https) throw ('http.put: unsupported HTTPS'); 
      if (!snd.port) snd.port=80;
      if (!path) path='';
      else if (path.charAt(0)!='/') path = '/'+path;
      if (!self.modules.http.xhr) {
        req = (proto=='https'?self.modules.https.request:self.modules.http.request)({
          host: snd.address,
          port: snd.port,
          path: path,
          method: 'POST',
          keepAlive: self.env.http.options.keepalive,
          headers: {
              'User-Agent': 'Mozilla/5.0 (X11; SunOS i86pc; rv:45.0) Gecko/20100101 Firefox/45.0',
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': data.length
          }
        } , function(res) {
          if (res.setEncoding != null) res.setEncoding('utf8');
          var body = '';
          res.on('data', function (chunk) {
            body = body + chunk;
          });
          res.once('end', function () {
            if (callback) callback(body);
          });
        });
        req.once('error', function(err) {
          print('Warning: request to '+addr2url(snd)+' failed: '+err);
          if (callback) callback(err);
        });

        // write data to request body
        req.write(data);
        req.end();
      } else {
        // XHR Browser
        self.modules.http.request({
          host: snd.address,
          port: snd.port,
          path: path,
          method: 'POST',
          body:data,
          keepAlive: self.env.http.options.keepalive,
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': data.length
          }
        } , function(err,xhr,body) {
          if (err) {
            print('Warning: request to '+addr2url(snd)+' failed: '+err);
            if (callback) callback(err);
            return;
          }
          if (callback) callback(body);
        })
      }
    },
    POST : function (url,data,callback,params) {
      var tokens=url.match(/(http[s]*)?([:\/\/]*)?([^\/]+)\/?(.+)?/);
      if (!tokens) throw "http.GET: Invalid URL";
      var proto = tokens[1]||'http',
          ip = tokens[3],
          path = tokens[4]||'',
          sep='';
      if (params) {
        path += '?';
        Object.keys(params).forEach(function (param) {
          path += (sep+param+'='+escape(params[param]));
          sep = '&';
        });
      }
      try {
        data=JSON.stringify(data);
      } catch (e) {
        if (callback) callback(e);
        return;     
      }
      // console.log(ip,path,data)
      return self.env.http.put(proto+'://'+ip,path,data,function (result,err) {
        if (err || Comp.obj.isError(result)) {
          if (callback) callback(err || result);
          return;
        }
        try {
          result=JSON.parse(result);
          if (callback) callback(result);
        } catch (e) {
          if (e.toString().indexOf('SyntaxError')!=-1 && callback)
             callback(e.toString()+'\n'+result);
          else if (callback) callback(e);
        }
      });
    },
    options : {
      keepalive:true,
    }
  }
  if (this.modules.httpserv) {
    if (!this.env.http) this.env.http = {};
    this.env.http.server =  function (ip,dir,index) {
      if (!self.modules.httpserv) return;
      if (!dir) return;
      if (ip==undefined) ip="localhost:8080";
      if (self.httpSrv) self.httpSrv.stop();
      var ipport=8080,tokens = ip.toString().split(':');
      if (tokens.length==2) ip=tokens[0],ipport=Number(tokens[1]);
      else if (typeof ip == 'number') ipport=ip;
      
      self.httpSrv=self.modules.httpserv.HTTPSrv({ip:ip,ipport:ipport,dir:dir,index:index,log:self.output.bind(self)});
      self.httpSrv.init();
      self.httpSrv.start();
    }

    if (self.modules.https) {
      if (!this.env.https) this.env.https = {};
      this.env.https.server =  function (ip,dir,index) {
        if (!self.modules.httpserv) return;
        if (!dir) return;
        if (ip==undefined) ip="localhost:8080";
        if (self.httpSrv) self.httpSrv.stop();
        var ipport=8080,tokens = ip.toString().split(':');
        if (tokens.length==2) ip=tokens[0],ipport=Number(tokens[1]);
        else if (typeof ip == 'number') ipport=ip;
        
        self.httpSrv=self.modules.httpserv.HTTPSrv({ip:ip,ipport:ipport,proto:'https',dir:dir,index:index,log:self.output.bind(self)});
        self.httpSrv.init();
        self.httpSrv.start();
      }
    }
  }
  if (this.modules.nlp)  this.env.nlp = this.modules.nlp;
  if (this.modules.sql)  this.env.sql =  function (filename,options) {
      return self.modules.sql.Sqld(filename,options);
  }
  if (this.modules.csv)  {
    this.env.csv =  {
      detect : function (text) {
        return self.modules.csv.detect(text);
      },
      read: function (file,convert,isString) {
        var data,text;      
        if (self.options.verbose) self.log('CSV: Reading from '+(isString?'string':file));
        try {
          text=isString?file:Io.read_file(file);
          if (!text) throw 'CSV File read error: '+file;          
          if (self.options.verbose) self.log('CSV: Parsing '+(isString?'string':file));
          self.modules.csv.parse(text,{
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: function(results) {
              if (self.options.verbose) 
                self.log('CSV parsed with DEL="'+results.meta.delimiter+
                         '" TRUNC='+results.meta.truncated+
                         ' ABORT='+results.meta.aborted);
              data=results.data;
              if (convert) { // first line must be header
                header=data.shift();
                data=data.map(function (row) {
                  var r={};
                  header.forEach(function (col,i) { r[col]=row[i] });
                  return r; 
                }) 
              }
            }
          });
          if (data && data[0].length==1) data=data.map(function (row) { return row[0] });
          return data;
        } catch (e) {
          return e;
        }
      },
      write: function (file,header,data,sep) {
        var d1=false,fd,i,convert=!Comp.obj.isArray(data[0])&&Comp.obj.isObj(data[0]);
        if (!sep) sep=',';
        d1 = typeof data[0] != 'object';
        if (!header || header.length==0) {
          if (!convert)
            header=d1?['0']:data[0].map(function (x,i) { return String(i) });
          else {
            header=[];
            for (var p in data[0]) {
              header.push(p);
            }
          }
        }
        try {
          if (self.options.verbose) self.log('CSV: Wrting to '+file);
          fd=Io.open(file,'w+');
          Io.write_line(fd,header.join(sep));
          if (!d1) 
            for(i in data) {
              if (!convert)
                Io.write_line(fd,data[i].join(sep));
              else
                Io.write_line(fd,header.map(function (col) { return data[i][col]}).join(sep));
            }
          else
            for(i in data) {
              if (!convert)
                Io.write_line(fd,data[i]);
              else
                Io.write_line(fd,data[i][header[0]]);
            };
            
          Io.close(fd);
          return data.length
        } catch (e) {
          return e;
        }
      }
    }
  }
  if (!this.rl && this.modules.readlineSync) {
    // we can implement ask
    this.env.ask = function (msg,choices) {
      var answer;
      while (choices.indexOf(answer)==-1)
        answer = self.modules.readlineSync.question(msg+'? ['+choices.join(',')+'] ');
      return answer;
    }
  }
  if (this.options.script)  this.env.script(this.options.script);
  if (this.options.exec)    this.process(this.options.exec);
  
  return this;
}


Shell.prototype.on = function (event,handler) {
  var self=this;
  if (this.events[event]) {
    // Implement callback function chain
    var funorig=events[event];
    this.events[event]=function () {
      funorig.apply(this,arguments);
      handler.apply(this,arguments);    
    };
  } else {
    this.events[event]=handler;
    this.jam.Aios.on(event,function (arg1,arg2,arg3,arg4) { self.emit(event,arg1,arg2,arg3,arg4)});
  }
}

// Generic output
Shell.prototype.output = function (line) {
  var msg=format(line);
  if (this.options.output && msg.length) this.options.output(msg);
  if (this.rl && msg.length) this.rl.insertOutput(msg);
  if (msg.length) this.emit('output',msg);
}

// Agent output
Shell.prototype.outputAgent = function (line) {
  var msg=format(line);
  if (this.options.outputAgent && msg.length) this.options.outputAgent(msg);
  else if (this.options.output && msg.length) this.options.output(msg);
  if (this.rl && msg.length) this.rl.insertOutput(msg);
  if (msg.length) this.emit('output',msg);
}

// Shell output
Shell.prototype.outputPrint = function (line) {
  var msg=format(line);
  if (this.options.outputPrint && msg.length) this.options.outputPrint(msg);
  else if (this.options.output && msg.length) this.options.output(msg);
  if (this.rl && msg.length) this.rl.insertOutput(msg);
  if (msg.length) this.emit('output',msg);
}

// Async AIOS/generic output (from callbacks)
Shell.prototype.outputAsync = function (line) {
  var msg=format(line);
  if (this.options.outputAsync && msg.length) this.options.outputAsync(msg);
  else if (this.options.output && msg.length) this.options.output(msg);
  if (this.rl && msg.length) this.rl.insertOutput(msg);
  if (msg.length) this.emit('output',msg);
}

Shell.prototype.process = function (line) {
  var self=this;
  with(this.env) {
    try { 
      if (line.match(/;[ \n]*$/))
        eval(line);
      else
        self.output(eval(line)); 
    } catch (e) {
      var more='';
      if (e.name==="SyntaxError"||e.name==="TypeError") {
        try {
          var ast = Esprima.parse(line, { tolerant: true, loc:true });
          if (ast.errors && ast.errors.length>0) more = ", "+ast.errors[0];
        } catch (_e) {
          e=_e;
        }
        self.output(e.toString()+more)
      } else if (e.stack) {
        var line = e.stack.toString().match(/<anonymous>:([0-9]+):([0-9]+)\)/)
        self.output(e.toString()+(line?', at line '+line[1]:''));
      } else {
        self.output(e.toString())
      }
      if (self.options.verbose>1) self.output(Io.sprintstack(e)); }
  }
}


module.exports = Shell;

