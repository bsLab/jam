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
 **    $VERSION:     1.27.1
 **
 **    $INFO:
 **
 **  JAM Shell Interpreter (Back end) for WEB Browser
 **
 **  Highly customizable command shell interpreter for JAMLIB
 **
 **
 ** typeof @options= {
 **    echo?: boolean,
 **    nameopts? : {length:8, memorable:true, lowercase:true},
 **    Nameopts? : {length:8, memorable:true, uppercase:true},
 **    output? : function,        // AIOS output (for all, except if defined ..)
 **    outputAgent? : function,   // Agent output
 **    outputPrint? : function,   // jamsh print output
 **    outputAsync? : function,   // AIOS/generic async output
 **    renderer? : renderer,
 **    server? : boolean,
 **  }
 **
 **    $ENDOFINFO
 */
 
var JamLib  = Require('top/jamlib');
var util = Require('util');
var Comp = Require('com/compat');
var Io = Require('com/io');
var Sat = Require('dos/ext/satelize');

/**
 **    modules? : {
 **      csp? :     Require('csp/csp'),
 **      csv? :     Reuiqre('parser/papaparse'),
 **      marked? :     Require('doc/marked'),
 **      ml?:       Require('ml/ml'),
 **      nn?:       Require('nn/nn'),
 **      http? :    Require('http'),
 **      sat?:    Require('sat/sat'),
 **      sip? :     Require('top/rendezvous'),
 **    },
 */
var modules = {
  csp : Require('csp/csp'),
  csv : Require('parser/papaparse'),
  ml : Require('ml/ml'),
  nn : Require('nn/nn'),
  sat : Require('logic/sat'),
  marked : Require('doc/marked')
}

var options = {
  verbose : JamLib.environment.verbose||1,
  version : '1.27.2',
}

// Utils
if (typeof print == 'undefined') print=console.log;
DIR = JamLib.Aios.DIR;
function addr2url(addr) {
  return addr.address+':'+(addr.port?addr.port:'*')
};
function url2addr(url,defaultIP) {
  var addr={address:defaultIP||'localhost',proto:'UDP',port:undefined},
      parts = url.toString().split(':');
  if (parts.length==1) {
    if (Comp.string.isNumeric(parts[0]))  addr.port=Number(parts[0]); // port number
    else if (parts[0].indexOf('-') != -1) addr.port=parts[0]; // port range p0-p1
    else if (parts[0]=='*')               addr.port=undefined; // any port
    else                                  addr.address=parts[0];  // ip/url
  } else return {address:parts[0],port:parts[1]=='*'?undefined:Number(parts[1])||parts[1]};
  return addr;
};
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
  this.options = Comp.obj.extend(options,_options);
  this.modules = Comp.obj.extend(modules,_options.modules);
  this.events  = {};
  this.env     = {};
  
  this.modules.forEach(function (mod,name) {
    console.log('Adding module '+name);
    switch (name) {
      case 'ml': 
      case 'nn': 
      case 'csp': 
      case 'sat': 
        mod.current(JamLib.Aios);
        JamLib.Aios[name]=mod.agent;
        JamLib.Aios.aios1[name]=mod.agent;
        JamLib.Aios.aios2[name]=mod.agent;
        JamLib.Aios.aios3[name]=mod.agent;
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
Shell.doc = {
  aios     : FileEmbedded('../../doc/new/aios.api.md','utf8'),
  javascript : FileEmbedded('../../doc/new/javascript.md','utf8'),
  shell    : FileEmbedded('../../doc/new/jamsh.browser.md','utf8'),
}

Shell.prototype.cmd = function () { return this.env }


Shell.prototype.emit = function (ev,arg1,arg2,arg3,arg4) {
  if (this.events[ev]) this.events[ev](arg1,arg2,arg3,arg4);
}


Shell.prototype.help = [
'# Shell Commands',
'The following shell commands are avaiable:',
'',
'add({x,y})\n: Add a new logical (virtual) node',
'agent(id,proc?:boolean)\n: Returns the agent object (or process)',
'agents\n: Get all agents (id list) of current node',
'array(n,init)\n: Creates initialised array',
'assign(src,dst)\n: Copy elements of objects',
'Capability\n: Create a security capability object',
'clock(ms)\n: Returns system time (ms or hh:mm:ss format)',
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
'disconnect({x,y},{x,y})\n: Disconnect two logical nodes',
'disconnect({to:dir)\n: Diconnect remote physical node',
'empty(a)->boolean\n: Test empty string, array, or object',
'exec(cmd:string)\n: Execute a jam shell command',
'extend(level:number|number[],name:string,function,argn?:number|number[])\n: Extend AIOS',
'filter(a,f)->b\n: Filter array or object',
'http.get(ip:string,path:string,callback?:function)\n: Serve HTTP get request',
'http.put(ip:string,path:string,data,callback?:function)\n: Serve HTTP put request',
'http.GET(url:string,params:{},callback?:function)\n: Serve HTTP JSON get request',
'http.PUT(url:string,params:{},data,data,callback?:function)\n: Serve HTTP JSON put request',
'info(kind:"node"|"version"|"host",id?:string)->info {}\n: Return information (node)', 
'inp(pattern:[],all:boolean)\n: Read and remove (a) tuple(s) from the tuple space', 
'kill(id:string|number)\n: Kill an agent (id="*": kill all) or task (started by later)',
'last(object|array)\n: Return last element of array, string, or object',
'later(ms:number,callback:function(counter)->booleabn)\n: Execute a function later. If fucntion returns true, next cycle is started.',
'load(path:string)\n: Load a JSON or CSV file( autodetect). Works only with file in or below current HTML directory!',
'lookup(pattern:string,callback:function (string [])\n: Ask broker for registered nodes',
'locate(callback?:function)\n: Try to estimate node location (geo,IP,..)',
'log(msg)\n: Agent logger function',
'mark(tuple:[],millisec)\n: Store a tuple with timeout in the tuple space', 
'ml\n: Machine Learning framework object',
'name("node"|"world")\n: Return name of current node or wolrd',
'neg(v)->v\n: Negate number, array or object of numebrs',
'nn?\n: Neural Network framework module',
'node\n: Get or set current vJAM node (default: root) either by index or id name',
'nodes\n: Get all vJAM nodes',
'on(event:string,handler:function)\n: Install an event handler. Events: "agent+","agent-","signal+","signal","link+","link-"',
'out(tuple:[])\n: Store a tuple in the tuple space', 
'pluck(table,column)\n:Extracts a column of a table (array array or object array)',
'port(dir,options,node)\n: Create a new physical communication port',
'Port\n: Create a security port',
'Private\n: Create a security private object',
'provider(function)\n: Register a tuple provider function',
'random(a,b)\n: Returns random number or element of array/object', 
'rd(pattern:[],all:boolean)\n: Read (a) tuple(s) from the tuple space', 
'reverse(a)->b\n: Reverse array or string',
'rm(pattern:[],all:boolean)\n: Remove (a) tuple(s) from the tuple space', 
'script(text:string)\n: Load and execute a jam shell script',
'setlog(<flag>,<on>)\n: Enable/disable logging attributes',
'signal(to:aid,sig:string|number,arg?:*)\n: Send a signal to specifid agent',
'start()\n: start JAM',
'stats(kind:"process"|"node"|"vm"|"conn")\n: Return statistics',
'stop()\n: stop JAM',
'test(pattern:[]) -> boolean\n: Test exsistence of a tuple in the tuple space', 
'ts(pattern:[],callback:function(tuple)->tuple)\n: Update a tuple in the space (atomic action) - non-blocking', 
'time()\n: print AIOS time',
'UI?\n: User Interface Toolkit',
'verbose(level:number)\n: Set verbosity level',
'versions()\n: Return JAM shell and library version',
'without(a,b)\n: Returns "a" without "b"',
].join('\n');


/* Set-up the Interpreter
*
*/

Shell.prototype.init = function(callback) {
  var self=this;

  
  this.jam=JamLib.Jam({
      print:      this.output.bind(this),
      printAgent: this.outputAgent.bind(this),
      printAsync: this.outputAsync.bind(this),
      nameopts:   this.options.nameopts,
      Nameopts:   this.options.Nameopts,
      verbose:    this.options.verbose,
      type:       'shell'
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
    array : JamLib.Aios.aios0.array,
    assign:  JamLib.Aios.aios0.assign,
    Capability:     JamLib.Aios.Sec.Capability,
    clock: this.jam.clock.bind(this.jam),
    compile: function (constr,name,options) {
      try {
        if (typeof name == 'object')
          return self.jam.compileClass(undefined,constr,name)
        else
          return self.jam.compileClass(name,constr,options||{verbose:1})
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
      console.log(n1)
      if (n1 && n2)
        return self.jam.connectNodes([n1,n2]) 
      else
        return self.jam.connectTo(n1)
    },
    concat: JamLib.Aios.aios0.concat,
    connected:   this.jam.connected.bind(this.jam),
    contains: JamLib.Aios.aios0.contains,
    copy:     JamLib.Aios.aios0.copy,
    create: this.jam.createAgent.bind(this.jam),
    csp:     JamLib.Aios.csp,
    get current () { return JamLib.Aios.current },
    delta:  JamLib.Aios.aios0.delta,
    disconnect:  function (n1,n2) { 
      if (n1 && n2) {}
         // TODO  
      else
        return self.jam.disconnect(n1)
    },
    distance : JamLib.Aios.aios0.distance,
    empty: JamLib.Aios.aios0.empty,
    exec: this.process.bind(this),
    extend: this.jam.extend.bind(this.jam),
    get help () {  return self.options.renderer(self.help) },
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
    load:   function (file,callback) {
      // works only with files in or below current directory or file dialog appears!
      var obj,text;
      function filedia() {
          var obj;
          if (!callback) return;
          if (typeof webix != 'undefined') webix.confirm({
            title:"Load File "+file,
            ok:"Continue", 
            cancel:"Cancel",
            text:"File either does no exist or must be loaded via browser file dialog!",
            callback:function (reply)  {
              if (!reply) return;
              loadFile(function (text) {
                if (!text) return;
                if (text.match(/^\s*{/)||text.match(/^\s*\[\s*{/)) {
                  obj=self.env.ofJSON(text);
                } else if (self.env.csv && self.env.csv.detect(text)) {
                  obj=self.env.csv.read(text,false,true);
                } 
                callback(obj);
              })
            }
          });      
      }
      try {
        var rawFile = new XMLHttpRequest();
        rawFile.open("GET", file, false);
        rawFile.send(null);
        text=rawFile.response;
        if (!text || (text.indexOf('<html>')!=-1)) return filedia();
        if (text.match(/^\s*{/)||text.match(/^\s*\[\s*{/)) {
          obj=self.env.ofJSON(text);
        } else if (self.env.csv && self.env.csv.detect(text)) {
          obj=self.env.csv.read(text,false,true);
        } if (callback) callback(obj);
        return obj;
      } catch (e) {
        if (e.toString().indexOf('denied')!=-1 && callback) {
           return filedia();
        }
        return e;
      }
    },
    locate : this.jam.locate.bind(this.jam),
    lookup:   this.jam.lookup.bind(this.jam),
    log:    this.jam.log.bind(this.jam),
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
    marked: this.marked.bind(this),
    ml:     JamLib.Aios.ml,
    name:   function (of,arg) {
      switch (of) {
        case 'node': return self.jam.getNodeName(arg);
        case 'world': return self.jam.world.id;
      }
    },
    neg: JamLib.Aios.aios0.neg,
    nn:     JamLib.Aios.nn,
    get node ()   { return self.jam.getCurrentNode(true) },
    set node (n)  { return self.jam.setCurrentNode(n) },
    get nodes ()  { return self.jam.world.nodes.map(function (node) { return node.id }) },
    object: JamLib.Aios.aios0.object,
    ofJSON:  function (s) {
      return self.jam.Aios.Code.Jsonf.parse(s,{})
    },
    on:     this.jam.on.bind(this),
    open : function (url,verbose) {
      // TODO: read and compile agent file via XHTTP request
    },
    out:    this.jam.out.bind(this.jam),
    pluck: function (table,column) {
      var res=[];
      for(var i in table) {
        res.push(table[i][column]);
      }
      return res;
    },
    port:   function (dir,options,node) {
      options=options||{};
      if (options.verbose==undefined) options.verbose=self.options.verbose;
      if (options.multicast == undefined) options.multicast=!options.broker;
      var port = self.jam.createPort(dir,options,node);
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
      self.jam.world.nodes[self.jam.node].ts.register(provider)
    },
    random: JamLib.Aios.aios.random,
    rd:     this.jam.rd.bind(this.jam),
    reduce: JamLib.Aios.aios0.reduce,
    reverse: JamLib.Aios.aios0.reverse,
    rm:     this.jam.rm.bind(this.jam),
    sat:     JamLib.Aios.sat,
    save : function (file,o,csv) {
      if (csv && self.env.csv) {
        self.env.csv.write(file,o[0],o.slice(1));
      } else {
        var text=self.env.toJSON(o)
        //var rawFile = new XMLHttpRequest();
        //rawFile.open("POST", file, false);
        // rawFile.setRequestHeader('Access-Control-Allow-Headers', 'file:///tmp');
        //rawFile.setRequestHeader('Content-type', 'text/plain');
        //rawFile.send(text);
        saveFile(text,file,    'text/plain'); 
      }
    },
    schedule : this.jam.schedule.bind(this.jam),
    script: function (text) {
      if (typeof text != 'string') text=text.toString();
      else {
        // file path or JS code text?
        if (text.indexOf('.js')!=-1 && text.indexOf('\n')==-1) {
          var file=text;
          // probably a file path of a text file
          var rawFile = new XMLHttpRequest();
          rawFile.open("GET", file, false);
          rawFile.send(null);
          text=rawFile.response;
          if (!text || (text.indexOf('<html>')!=-1)) return;
        }    
      }
      console.log(text)
      self.process(text);
    },
    setlog: function (attr,on) { self.jam.Aios.config(on?{'log+':attr}:{'log-':attr}) },
    signal: this.jam.signal.bind(this.jam),
    start:  this.jam.start.bind(this.jam),
    stats:  this.jam.stats.bind(this.jam),
    stop:   this.jam.stop.bind(this.jam),
    test:   this.jam.test.bind(this.jam),
    time:   this.jam.time.bind(this.jam),
    Time:   Io.Time,
    toJSON:  function (o) {
      return self.jam.Aios.Code.Jsonf.stringify(o)
    },
    ts:     this.jam.ts.bind(this.jam),
    UI:   self.modules.UI,
    verbose: function (l) { self.jam.Aios.config({verbose:l})},
    versions: function () { return {shell:options.version,lib:JamLib.options.version, aios:JamLib.Aios.options.version} },
    without: JamLib.Aios.aios0.without,
    get world ()  { return self.jam.world },
 }

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
        req = (proto=='http'?self.modules.http.request:self.modules.https.request)({
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
        req = self.modules.http.request({
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
  
  if (modules.marked) {
    this._marked = modules.marked();
    this._renderer = new this._marked.Renderer();
    this._renderer._state = { sub:false };
    this._renderer.text = function (text) {
      if (text.indexOf('~')==0) self._renderer._state.sub = !self._renderer._state.sub;
      return text.replace(/\^([^\^]+)\^/g,'<sup>$1</sup>').
                  replace(/\~/g,self._renderer._state.sub?'<sub>':'</sub>'); // ~ is parsed by marked !?
    }
    this._marked.setOptions({
      renderer: this._renderer,
//      highlight: function(code) {
//        return require('highlight.js').highlightAuto(code).value;
//      },
      pedantic: false,
      gfm: true,
      tables: true,
      breaks: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      xhtml: false
    });  
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
          if (isString) text=file;
          else {
            var rawFile = new XMLHttpRequest();
            rawFile.open("GET", file, false);
            rawFile.send(null);
            text=rawFile.response;
            if (!text) return;
          }
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
        var d1=false,fd,i,convert=!Comp.obj.isArray(data[0])&&Comp.obj.isObj(data[0]),
            text='';
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
          text = text + header.join(sep) + '\n';
          if (!d1) 
            for(i in data) {
              if (!convert)
                text = text + data[i].join(sep) + '\n';
              else
                text = text + header.map(function (col) { return data[i][col]}).join(sep) + '\n' ;
            }
          else
            for(i in data) {
              if (!convert)
                text = text + data[i] + '\n';
              else
                text = text + data[i][header[0]] + '\n';
            };
          // TODO: write text to file ...
          saveFile(text,file,'text/plain'); 

          return data.length
        } catch (e) {
          return e;
        }
      }
    }
  }

  if (this.options.script)  this.env.script(this.options.script);
  if (this.options.exec)    this.process(this.options.exec);
  
  
  return this;
}

Shell.prototype.marked = function (md) {
  return this._marked(md);
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
      self.output(e.toString()); 
    }
  }
}


Shell.Io = Io;
Shell.marked = modules.marked;
Shell.JamLib=JamLib;
module.exports = Shell;

