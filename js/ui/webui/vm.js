/*
KISS: Generic worker-based VM w/o SharedMemory for isolated JAM instances:


Low level API:
--------------

  var vm = VM({
    VM:JS.VM
  })
  var p1 = await vm.worker({
    print:print,
    error:error
  }), p2 = await vm.worker({
    print:print,
    error:error
  });
  await p1.init()
  await p1.ready()
  await p1.run('sema1=Semaphore('+sema1.index+'); print("CP1.1"); ')
  print('p1 ready')
  await p2.init()
  await p2.ready()
  await p2.run('sema1=Semaphore('+sema1.index+'); print("CP2.1"); ')
  print('p2 ready')
  await p1.run('async function foo() { print(await sema1.level()); print("CP1.2");} foo()')
  await p1.run('async function foo() { print(await sema1.down()); print("CP1.3"); } foo()')
  // sema1.up();
  await p2.run('async function foo() { print(await sema1.up()); print("CP2.3"); } foo()')

*/

var version = '1.1.1';
console.log('vm',version);

// Default JS multi.worker VM module

JS = {
  run : function (command,env) {
    with (env) {
      return eval(command)
    }
  }
}

// A generic JS VM passed to VM workers
JS.VM = function VM (options) {
  if (!(this instanceof VM)) return new VM(options);
  this.env={};
  if (options.print) this.env.print=options.print;
  if (options.printError) this.env.printError=this.env.error=options.printError;
  if (options.error) this.env.printError=this.env.error=options.error;
}

JS.VM.prototype.init = function () {
}
JS.VM.prototype.kill = function () {
}
JS.VM.prototype.run = function (code,print,printError) {
  if (print) this.env.print=print;
  if (printError) this.env.printError=this.env.error=printError;
  try {
    with (this.env) {
      return eval(code)
    }
  } catch (e) { this.env.printError(e) }
}
JS.VM.prototype.status = function (code,print,printError) {
}
JS.VM.prototype.get = function (key) {
  return this[key];
}
JS.VM.prototype.set = function (key,val) {
  this[key]=val;
}


var VMs=[];
var VMindex=0;

// Unique VM Identifier UVI: web:vm#
//    Environment,
//    Init
//    Rpc
//    store:number,
//    nmp,
//    VM
//    ports

function VM(options) {
  if (!(this instanceof VM)) return new VM(options);
  var self=this, index = VMindex++;
  options=options||{};
  this.options=options;
  this.workerIndex=0;
  this.workers=[];
  this.handlers=[];
  this.verbose=options.verbose||0;

  this.index=index;
  this.id='web:'+index;
  if (options.Environment) this.Environment=options.Environment;
  if (VM.Environment) this.Environment=VM.Environment;
  if (options.Init) this.Init=options.Init;
  if (VM.Init) this.Init=VM.Init;
  if (options.Rpc) this.Rpc=options.Rpc;
  if (VM.Rpc) this.Rpc=VM.Rpc;
  
  // The real VM constructor used for creating the real VM inside worker
  // Methods: init, run, kill, status
  if (options.VM) this.VM=options.VM;  
  else this.virtual=true;
  
  if (options.error) this.error=options.error;
  if (options.print) this.print=options.print;
  VMs.push(this);
}
VM.prototype.debug = function (f) {
  return function () {
    try {
      f.apply(null,arguments);
    } catch (e) { console.log(e) }
  }
}
VM.prototype.init = function (wid,options) {
  // Create and initialize the real VM inside worker
  if (this.workers[wid]) return;
  var worker = this.workers[wid];
}
VM.prototype.load = function (wid,code) {
  if (this.workers[wid]) return;
  var worker = this.workers[wid];
}
VM.prototype.kill = function (wid) {
  if (this.workers[wid]) return;
  var worker = this.workers[wid];
}

VM.prototype.reset = function (options) {
  for (var wird in this.workers) {
    var worker = this.workers[wid];
    if (worker) worker.kill();
  }
}
VM.prototype.run = function (wid,code) {
  if (this.workers[wid]) return;
  var worker = this.workers[wid];
  return worker.run(code);
}
VM.prototype.get = function (wid,key) {
  if (this.workers[wid]) return;
  var worker = this.workers[wid];
}
VM.prototype.set = function (wid,key,val) {
  if (this.workers[wid]) return;
  var worker = this.workers[wid];
}
// Send a network message to worker
VM.prototype.message = function (wid,message) {
  if (this.workers[wid]) return;
  var worker = this.workers[wid];
}
VM.prototype.on = function(ev, handler) {
  if (this.handlers[ev]) {
    var prev = this.handlers[ev];
    this.handlers[ev]=function (arg) {
      handler(arg);
      prev(arg);
    }
  } else this.handlers[ev]=handler;
}
VM.prototype.emit = function (ev,arg) {
  if (this.handlers[ev]) this.handlers[ev](arg);
}

// Start a VM inside a Web Worker
/* 
  typoef @options = {
    verbose,
    print,
    printError,
    log,
    Rpc,
    Environment,
    Init,

    
  }
*/
VM.prototype.worker = function (options) {
  if (this.virtual) throw "ENOTSUPPORTED";
  var print   = console.log,
      log     = console.log,
      error   = console.error,
      self    = this,
      verbose = options.verbose==undefined?this.verbose:options.verbose,
      id      = this.workerIndex++,
      nid     = this.id+':'+id;
  if (verbose>1) console.log('CP: VM.worker');
  if (this.print) print=this.print;
  if (this.error) error=this.error;
  if (options.print) print=options.print;
  if (options.error) error=options.error;
  else if (options.printError) error=options.printError;
  else if (options.print) error=options.print;
  if (options.log) log=options.log;
  var environment = {
//    Http              : Http,
//    Code              : Code,
    BufferInit        : BufferInit,
    /* Real VM, not meta VM!! */
    VM        : this.VM,
    VMproto   : this.VM && this.VM.prototype,
    Channel   : {
      channelID:0,
      channels:[],
      create : function () {
        var id = Channel.channelID++;
        var chan = {
          waiters   : [],
          handlers  : {},
          queue     : [],
          idn       : id,
          id        : 'channel'+id,
          cancel : function () {
            this.waiters.forEach(function (waiter) {
              waiter(null);
            })
            this.waiters=[];
            this.queue=[];
          },
          destroy : function () {
            chan.cancel();
            delete Channels[id];
          },
          // enqueue received data
          enqueue: function (data) {
            if (this.queue.length==0 && this.waiters.length) {
              var wakeup = this.waiters.shift();
              wakeup(data);
            } else if (this.handlers.receive) {
              this.handlers.receive(data);
            } else this.queue.push(data);
          },
          on : function (ev,handler) { this.handlers[ev]=handler },
          off : function (ev) { delete this.handlers[ev] },
          // client API
          send: function (data) {
            if (this.forward) {
              this.forward(data);
            } else if (this.queue.length==0 && this.waiters.length) {
              var wakeup = this.waiters.shift();
              wakeup(data);
            } else this.queue.push(data);
          },
          receive : async function (cb) {
            var self=this;
            if (cb) {
              if (this.queue.length) return cb(this.queue.shift());
              else return this.waiters.push(cb);
            }
            if (this.queue.length) return this.queue.shift();
            // needs await prefix before receive in async function (Code.run)
            return new Promise(function (resolve,reject) {         
              self.waiters.push(function (_data) {
                if (_data===undefined) reject(); // interrupted
                else resolve(_data);
              });
            })
          },
          receiver : function (cb) {
            this.handlers.receive=cb;
          }
        }
        Channel.channels[id]=chan;
        return chan;
      }
    },
    InspectInit : InspectInit,
    Utils       : Utils,
    on        : function (ev,handler) { __handlers[ev]=handler },
    once      : function (ev,handler) { __handlers1[ev]=handler },
    __handlers :[],
    __handlers1 :[],
    __toinit  : {
      Buffer  : function () {
        BufferInit();
      },
      // Http    : function () { Http(self) },
      Inspect : function () { inspect = InspectInit() },
      VM      : function () { if (options.verbose) print('VM setup'); if (VM) VM.prototype=VMproto; },
    },   
    __init    : function () {
      try {
        if (typeof Polyfill != 'undefined') Polyfill()
        _=undefined;
        for (var p in __toinit) {
          __toinit[p](self)
        }
      } catch (e) { console.log('__init failed',e); }
    },
    options : {
      verbose:verbose
    }
  }
  
  if (options.Environment) {
    for(var p in options.Environment) environment[p]=options.Environment[p];
  } 
  if (options.Init) {
    for(var p in options.Init) environment.__toinit[p]=options.Init[p];
  } 
  if (this.Environment) {
    for(var p in this.Environment) environment[p]=this.Environment[p];
  } 
  if (this.Init) {
    for(var p in this.Init) environment.__toinit[p]=this.Init[p];
  } 
  function workerFunction(id,verbose) {
    (function() { 
      var oldLog = console.log;
      console.log = function() { 
          oldLog.call(console, Array.prototype.slice.call(arguments).join(" , "));
      }
    })();
    var Env = {
      emit : function (ev,arg) {
        self.postMessage({command:'emit',event:ev,argument:toString(arg)})         
      },
      error: function (a) {
        self.postMessage({command:'error',arguments:toString(Array.prototype.slice.call(arguments))}) 
      },
      fork : function (_options) {
        /* fork a new worker thread, wait for initialisation */
        return new Promise(function (resolve,rejeect) {
          once('fork',resolve);
          self.postMessage({command:'fork',options:toString(Array.prototype.slice.call(_options))}) 
        })
      },
      log : function () { 
        self.postMessage({command:'log',arguments:toString(Array.prototype.slice.call(arguments))}) 
      },
      print: function () { 
        self.postMessage({command:'print',arguments:toString(Array.prototype.slice.call(arguments))}) 
      },
      time : function () { return Date.now() },
      _rpcID  : 0,
      _rpcCallbacks:[],
      rpc: function (op,request,callback,event) {
        var id = Env._rpcID++;
        // console.log('Env.rpc',op,request,id,event);
        Env._rpcCallbacks[id]=callback;
        // if event == undefined  then the reply is returned immediately (once)
        // if event != undefined then the reply is returned if the event occurs (one ore more times)
        // if event === true then reply is return delayed asynchronously (one time event)
        if (typeof event == 'string') self.postMessage({command:'rpc',call:op,request:toString(request),id:id,event:event});
        else if (event === true) self.postMessage({command:'rpc',call:op,request:toString(request),id:id,asyn:true});
        else self.postMessage({command:'rpc',call:op,request:toString(request),id:id});
      },
      toString:toString,
      workerId:id,
    }
    function isArray(o) {
      if (o==undefined || o ==null) return false;
      else return typeof o == "array" || (typeof o == "object" && o.constructor === Array);
    }
    function isObject(o) {
      return typeof o == "object";
    }
    function isTypedArray(o) {
      return isObject(o) && o.buffer instanceof ArrayBuffer
    }

    function TypedArrayToName(ftyp) {
      if (ftyp==Int8Array   || ftyp instanceof Int8Array) return 'Int8Array';
      if (ftyp==Uint8Array  || ftyp instanceof Uint8Array) return 'Uint8Array';
      if (ftyp==Int16Array  || ftyp instanceof Int16Array) return 'Int16Array';
      if (ftyp==Uint16Array || ftyp instanceof Uint16Array) return 'Uint16Array';
      if (ftyp==Int32Array  || ftyp instanceof Int32Array) return 'Int32Array';
      if (ftyp==Uint32Array || ftyp instanceof Uint32Array) return 'Uint32Array';
      if (ftyp==Float32Array || ftyp instanceof Float32Array) return 'Float32Array';
      if (ftyp==Float64Array || ftyp instanceof Float64Array) return 'Float64Array';
      return ftyp.toString()
    }
    
    function ofString(source,mask) {
      var code;
      mask=mask||{}
      try {
        // execute script in private context
        with (mask) {
          eval('"use strict"; code = '+source);
        }
      } catch (e) { console.log(e,source) };
      return code; 
    }
    function toString(o) {
      var usebuffer=false;
      var p,i,keys,s='',sep,tokens;
      if (o===null) return 'null';
      else if (isArray(o)) {
        s='[';sep='';
        for(p in o) {
          s=s+sep+toString(o[p]);
          sep=',';
        }
        s+=']';
      } else if (typeof Buffer != 'undefined' && o instanceof Buffer) {    
        s='Buffer([';sep='';
        for(i=0;i<o.length;i++) {
          s=s+sep+toString(o[i]);
          sep=',';
        }
        s+='])';  
      } else if (o instanceof Error) {    
        s='(new Error("'+o.toString()+'"))';
      } else if (o instanceof SyntaxError) {    
        s='(new SyntaxError("'+o.toString()+'"))';
      } else if (isTypedArray(o)) {    
        s='(new '+TypedArrayToName(o)+'([';sep='';
        var b=Array.prototype.slice.call(o);
        for(i=0;i<b.length;i++) {
          s=s+sep+String(b[i]);
          sep=',';
        }
        s+=']))';  
      } else if (typeof o == 'object') {
        s='{';sep='';keys=Object.keys(o);
        for(i in keys) {
          p=keys[i];
          if (o[p]==undefined) continue;
          s=s+sep+"'"+p+"'"+':'+toString(o[p]);
          sep=',';
        }
        s+='}';
        if (o.__constructor__) s = '(function () { var o='+s+'; o.__proto__='+o.__constructor__+'.prototype; return o})()';
      } else if (typeof o == 'string') {
        s=JSON.stringify(o)
      } else if (typeof o == 'function') {
        s=o.toString(true);   // try minification (true) if supported by platform
        if (tokens=s.match(/function[ ]+([a-zA-Z0-9]+)[ ]*\(\)[ ]*{[^\[]*\[native code\][^}]*}/)) {
          return tokens[1];
        } else return s;
      } else if (o != undefined)
        s=o.toString();
      else s='undefined';
      return s;
    }  
    function compile(code,context,data) {
      // contruct functional scope
      var pars = Object.keys(context),
          args = pars.map(function (key) { return context[key] });
      pars.unshift('__dummy');
      if (data!==undefined) { pars.push('__data'); args.push(data) };
      pars.push(code);
      var foo = new (Function.prototype.bind.apply(Function,pars));
      return foo.apply(self,args);
    }
    function evalf (code,data,assign,_id) {
      // execute function with arguments (data,ports), optional assignment of result, and send result to parent process via evals message
      // support shareable data
      var result,isasync=/^[ ]*async[ ]+function/.test(code);
      if (data==undefined) data=null;
      result = compile ('try { var __result=true; '+
                       (assign?
                         (isasync? '(async function () { '+
                                   assign+' = await '
                         : assign+' = ')
                       : (isasync? '(async function () { '
                          : '__result=')
                       )+
                       '('+
                       code+
                       ')(__data)'+
                       (isasync && !assign?'} catch (e) {error(e.toString(),e.stack)};if (__result===undefined) __result=null;self.postMessage({command:"evals",status:toString(__result),id:'+_id+'});'
                        :'')+
                       (isasync? '})()'
                        : '')+
                       '} catch (e) { console.log(e); error(e.toString(),e.stack) }; return __result',Env,data);
      return result;      
    }
    if (verbose) Env.print('VM Worker #'+id+' ready.');
    Env.emit('ready');
    // Proecss messages from master
    self.onmessage = function(e) {
      var o,data,key,reply;
      try {
        var message = e.data;
        switch (message.command) {
          case 'create':
            data = ofString(message.data,Env);
            data.print=Env.print;
            data.printError=Env.error;
            data.rpc=Env.rpc;
            with (Env) { self.vm = new VM(data); if(typeof vm == 'object') if(verbose) print('VM (worker #'+id+') created.'); emit('create') }
            break;
          case 'evalf':
            var result = evalf(message.code,message.data, message.assign,message.id);
            if (!/^[ ]*async[ ]+function/.test(message.code)) {
              if (result===undefined) result=null;            
              self.postMessage({command:'evals',status:toString(result),id:message.id});
            }
            break;
          case 'environment':
            data = ofString(message.data,Env);
            for(key in data) {
              Env[key]=data[key];
            }
            if (typeof Env.__init == 'function') {
              with (Env) { eval ('__init()') }
            }
            if (verbose) Env.print('VM Worker #'+id+': got environment');
            break;
          case 'event':
            data = ofString(message.data);
            if (Env.__handlers[message.event]) Env.__handlers[message.event](data); 
            if (Env.__handlers1[message.event]) { Env.__handlers1[message.event](data); delete Env.__handlers1[message.event] };          
            break;
          case 'init':
            with (Env) { if (self.vm) self.vm.init(); emit('init') }
            break;
          case 'run':
            with (Env) { try { var result = self.vm.run(message.code); emit('run',result) } catch (e) { console.log(e); error(e) } }
            break;
          case 'rpc':
            // reply for an rcp request
            data = ofString(message.reply);
            if (Env._rpcCallbacks[message.id]) {
              var handler = Env._rpcCallbacks[message.id];
              if (!message.event && !message.more) delete Env._rpcCallbacks[message.id];
              handler(data)
            }
            break;
          case 'share':
            if (message.eval) {
              try { 
                evalf(message.eval,message.data,message.key,message.id);; 
              } catch (e) { console.log(e) }
            } else {
            }
        }
      } catch (e) {
        Env.error(e.toString(),e.stack.toString());            
      }
    }
  }
  var handlers=[], handlers1=[];
  function emit(ev,arg) {
    if (handlers1[ev]) {
      handlers1[ev](arg);
      delete handlers[ev];
    } else if (handlers[ev]) handlers[ev](arg);
    else self.emit(ev,arg);
  }
  // worker private event handlers
  function on(ev,handler) {
    if (ev=='stdout') print=function () { emit('stdout',arguments) };
    if (ev=='stderr') error=function () { emit('stderr',arguments) };
    if (handlers[ev]) {
      var prev = handlers[ev];
      handlers[ev]=function (arg) {
        handler(arg);
        prev(arg);
      }
    } else handlers[ev]=handler;
  }
  function once(ev,handler) {
    handlers1[ev]=handler;
  }
  var _ready=false;
  handlers1.ready= function () { _ready=true }
    
  var dataObj = '(' + workerFunction.toString() + ')('+id+','+verbose+');'; // here is the trick to convert the above fucntion to string
  var blob;
  if (verbose>1) console.log('CP: VM.worker -> new Blob');
  try {
      blob = new Blob([dataObj.replace('"use strict";', '')], {type: 'application/javascript'});
  } catch (e) { 
      // Backwards-compatibility
      window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
      blob = new BlobBuilder();
      blob.append(dataObj.replace('"use strict";', ''));
      blob = blob.getBlob();
  }
  var blobURL = (window.URL ? URL : webkitURL).createObjectURL(blob, {
      type: 'application/javascript; charset=utf-8'
  });
  // if (verbose>1) 
  console.log('CP: VM.worker -> new Worker '+id);
  var worker = new Worker(blobURL); // spawn new worker
  if (verbose) print('VM Worker #'+id+' started.');
  // Process messages from worker
  worker.onmessage = function(e) {
    var message = e.data;
    switch (message.command) {
      case 'error':
        // console.log(Utils.ofString(message.arguments))
        error.apply(null,Utils.ofString(message.arguments));
        break;
      case 'emit':
        emit(message.event,Utils.ofString(message.argument));
        break;
      case 'evals':
        /* reply for a rpc */
        emit('evals'+message.id,Utils.ofString(message.status));
        break;
      case 'fork':
        handler.fork(Utils.ofString(message.options), function (_handler) {
          worker.postMessage({command:'event',event:'fork.ready',data:{id:_handler.id}});
        });
        break;
      case 'log':
        log.apply(null,Utils.ofString(message.arguments));
        break;
      case 'print':
        print.apply(null,Utils.ofString(message.arguments));
        break;
      case 'rpc':
        if (!self.Rpc) worker.postMessage({command:'rpc',reply:Utils.toString({error:"ENORPC"})});
        var request = Utils.ofString(message.request);
        // console.log('RPC',message)
        if (!self.Rpc[message.call]) worker.postMessage({command:'rpc',reply:Utils.toString({error:"ENOTEXIST"}),id:message.id});
        try {
          if (message.asyn) {
            self.Rpc[message.call](request, function (reply) {
              worker.postMessage({command:'rpc',reply:Utils.toString(reply),id:message.id})
            });
          } else if (!message.event) {
            // synchronous request with immediate reply
            var reply = self.Rpc[message.call](request);
            worker.postMessage({command:'rpc',reply:Utils.toString(reply),id:message.id})
          } else {
            // install asynchronous background event emitter
            self.Rpc[message.call](request,message.event,function (reply,more) {
              worker.postMessage({command:'rpc',reply:Utils.toString(reply),id:message.id,event:message.event,more:more})
            });
          }
        } catch (e) {
          worker.postMessage({command:'rpc',reply:Utils.toString({error:e.toString()}),id:message.id})
        }
        break;
    } 
  }
  if (verbose>1) console.log('CP: VM.worker -> post environment');
  worker.postMessage({command:'environment',data:Utils.toString(environment)}); // Send data to our worker. 
  function create () {
    return new Promise(function (resolve) {
      once('create',resolve);
      delete options.error;       
      delete options.print; 
      delete options.printError;
      worker.postMessage({command:'create',data:Utils.toString(options)}); // Send data to our worker.     
      if (options.share) {
        // any other sharable objects (IPC, data, ..)
        for(var p in options.share) {
          share(p,options.share[p]);
        }
      }      
    });
  }
  function evalf (f,data) {
    return new Promise(function (resolve) {
      var _id=handler.tid++;
      once('evals'+_id,resolve);
      if (options.verbose>1) console.log('CP: VM.evalf '+f.toString());
      worker.postMessage({command:'evalf',code:f.toString(),data:data,id:_id}); // Send data to our worker.
    })  
  }
  function event (ev,data) {
    worker.postMessage({command:'event',event:ev,data:data});
  }
  // Fork a new worker from this worker configuration
  function fork (_options,callback) {
    self.worker(Object.assign(Object.assign({},_options),options)).then(function (handler) {
      handler.init().then(function() {
        if (callback) callback(handler);
      })
    })
  }
  function init () {
    return new Promise(function (resolve) {
      once('init',function () {
        resolve();
      });
      worker.postMessage({command:'init'}); // Send data to our worker.
    })
  }
  function kill (sig) {
    console.log('vm.worker '+id+': Termination.');
    if (verbose) print('vm.worker '+id+': Termination.');
    worker.terminate();
    emit('kill');
    self.emit('kill'+id);
  }
  function ready () {
    return new Promise(function (resolve) {
      if (_ready) resolve();
      once('ready',resolve);
    })  
  }
  function run (code,data,ev) {
    return new Promise(function (resolve) {
      once('run',resolve);
      if (typeof code == 'function') code='('+code.toString()+')('+JSON.stringify(data)+')';
      if (ev) {
        if (/\([ ]*async/.test(code)) code += ('.then(function () { emit("'+ev+'",'+id+')}).catch(function (e) { error(e); emit("'+ev+'",'+id+') })');
        else code += (';emit("'+ev+'",'+id+')');
      }
      if (verbose>1) console.log('CP: VM.run '+code);
      worker.postMessage({command:'run',code:code}); // Send data to our worker.
    })  
  }
  function share (key,data,eval) {try {
    if (!eval && typeof data == 'object' && typeof data.__share == 'function') {
      var share = data.__share();  // remote: key=eval(data)
      data=share.data;
      eval=share.eval;
    }
    if (!eval && Utils.isArray(data) && typeof data[0] == 'object' && typeof data[0].__share == 'function') {
      var n = data.length;
      worker.postMessage({command:'run',code:key+'=[];'});
      for(var i=0;i<n;i++) {
        var share = data[i].__share();  // remote: key=eval(data)
        worker.postMessage({command:'share',key:key+'['+i+']',data:share.data,eval:share.eval.toString()});
      }
      return;
    }
    if (!eval) eval=function(data) { return data };
    worker.postMessage({command:'share',key:key,data:data,eval:eval?eval.toString():undefined});
    return;
    } catch (e) { console.log(e) }
  }

  function send (message) {
    worker.postMessage(message); // Send data to our worker.
  }
  var handler = {
        id    : id,
        nid   : nid,
        tid   : 0, // incremental transaction id's
        error : function (f) { error=f },
        eval  : evalf,
        event : event,
        fork  : fork,
        init  : init,
        kill  : kill,
        on    : on,
        once  : once,
        print : function (f) { print=f },
        ready : ready,
        run   : run,
        share : share,
        send  : send,
        children : [],
        worker : worker,
      }
  this.workers[id]=handler;
  return new Promise(function (resolve) {
    create().then(function () {
      resolve(handler)
    })
  })
}

// Universial Channel IPC Object (superclass, only two end-points)
// Requires message wrapping for webworker/remote sharing 
// blocking code operations using async/await
Channel = {
  channelID:0,
  channels:[],
  create : function () {
    var id = Channel.channelID++;
    var chan = {
      waiters   : [],
      handlers  : {},
      queue     : [],
      idn       : id,
      id        : 'channel'+id,
      cancel : function () {
        this.waiters.forEach(function (waiter) {
          waiter(null);
        })
        this.waiters=[];
        this.queue=[];
      },
      destroy : function () {
        chan.cancel();
        delete Channels[id];
      },
      // enqueue received data
      enqueue: function (data) {
        if (this.queue.length==0 && this.waiters.length) {
          var wakeup = this.waiters.shift();
          wakeup(data);
        } else if (this.handlers.receive) {
          this.handlers.receive(data);
        } else this.queue.push(data);
      },
      on : function (ev,handler) { this.handlers[ev]=handler },
      off : function (ev) { delete this.handlers[ev] },
      // client API
      send: function (data) {
        if (this.forward) {
          this.forward(data);
        } else if (this.queue.length==0 && this.waiters.length) {
          var wakeup = this.waiters.shift();
          wakeup(data);
        } else this.queue.push(data);
      },
      receive : async function (cb) {
        var self=this;
        if (cb) {
          if (this.queue.length) return cb(this.queue.shift());
          else return this.waiters.push(cb);
        }
        if (this.queue.length) return this.queue.shift();
        // needs await prefix before receive in async function (Code.run)
        return new Promise(function (resolve,reject) {         
          self.waiters.push(function (_data) {
            if (_data===undefined) reject(); // interrupted
            else resolve(_data);
          });
        })
      },
      receiver : function (cb) {
        this.handlers.receive=cb;
      }
    }
    Channel.channels[id]=chan;
    return chan;
  }
}

VM.version=version;
if (typeof window == 'object') window.VM=VM;
if (typeof global == 'object') global.VM=VM;
if (typeof module != 'undefined') module.exports = VM


