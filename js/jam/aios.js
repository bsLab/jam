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
 **    $VERSION:     1.65.1
 **    $RCS:         $Id: aios.js,v 1.6 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $INFO:
 **
 **  JavaScript AIOS: Agent Execution & IO System with Sandbox environment.
 **
 **    $ENDOFINFO
 */
var Io =    Require('com/io');
var Comp =  Require('com/compat');
var Name =  Require('com/pwgen');
var Conf =  Require('jam/conf');
var Code =  Require('jam/code');
var Sig =   Require('jam/sig');
var Node =  Require('jam/node');
var Proc =  Require('jam/proc');
var Sec  =  Require('jam/security');
var Ts =    Require('jam/ts');
var World = Require('jam/world');
var Chan =  Require('jam/chan');
var Mobi =  Require('jam/mobi');
var Simu =  global.config.simulation?Require(global.config.simulation):none;
var Json =  Require('jam/jsonfn');
var watchdog = Require('jam/watchdog');
var util =  Require('util');
var Amp  =  Require('jam/amp')

var aiosExceptions = [
  'CREATE',
  'MOVE',
  'SIGNAL',
  'SCHEDULE',
  'WATCHDOG',
  'KILL'];
var aiosErrors = [
  // error name - violation of
  'SCHEDULE', // TIMESCHED
  'CPU',    // TIMEPOOL
  'EOL',    // LIFETIME
  'EOM',    // MEMPOOL
  'EOT',    // TSPOOL
  'EOA',    // AGENTPOOL
  'EOR',    // AGENTSIZE ..
];

var aiosEvents = ['agent','agent+','agent-','signal','signal+','node+','node-'];

// AIOS OPTIONS //
var options =  {
  version: "1.65.1",
  
  debug:{},
  
  // Fast dirty process forking and migration between logical nodes (virtual)
  // w/o using of/toCode?
  fastcopy:false,
  // Using JSON+ (json compliant) or JSOB (raw object) in to/ofCode?
  json:false,
  // logging parameters
  log : {
    node:false,
    agent:true,
    parent:false,
    pid:false,    // agent process id!
    host:false,   // host id (os pid)
    time:false,   // time in milliseconds
    Time:true,    // time in hour:minute:sec format
    date:false,   // full date of day
    class:false
  },
  // agent ID generator name options
  nameopts : {length:8, memorable:true, lowercase:true},
  // Disable agent checkpointing and resource control
  nolimits:false,
  // No statistics
  nostats:false,
  // Use process memory for resource control? (slows down JAM execution)
  useproc: false,
  // Verbosity level
  verbose:0,
  
  // Default maximal agent life-time on this host (even idle) in ms
  LIFETIME: Infinity,
  // Default maximal agent run-time of an agent process activity in ms
  TIMESCHED:200,
  // Default maximal agent run-time of an agent process in ms
  TIMEPOOL:5000,
  // Default maximal memory of an agent (code+data)
  MEMPOOL:50000,
  // Maximal number of tuple generations on current node per agent
  TSPOOL:1000,
  // Default lifetime of tuples (0: unlimited) => Aios.Ts.options.timeout
  TSTMO : 0,
  // Maximal number of agent generations on current node (by one agent)
  AGENTPOOL:20,
  // Default minimal run-time costs below 1ms resolution (very short activity executions)
  MINCOST:0.1,
  // Default maximal scheduler run-time (ms)
  RUNTIME:1000,
  // Maximal size in bytes of serialized agent (outgoing migration) < MAX
  AGENTSIZE: 60000,
  // Maximal size in bytes of serialized agent (incoming migration)
  AGENTSIZEMAX: 256000,
  
  // Default scheduler idle-time (maximal nexttime interval, ms)
  IDLETIME:0,
  
  // Default AIOS level for received or platform created agents
  LEVEL: 1,
   
  // Random service ports (capability protection)
  // (public service port: private security port) pairs
  security : {
  }
};

var timer,
    ticks=0,  // scheduler execution counter!
    iterations=0,
    events={};

// Current execution environment (scheduler: global scheduler)
var current = {process:none,world:none,node:none,network:none,error:none,scheduler:none};

// System clock in ms (what=true) or hh:mm:ss format (what=undefined) or
// full date+time (what='date')
function clock (what) {
  if (what==undefined) return Io.Time();
  else if (what=='date') return Io.Date();
  else return Io.time();  // ms clock
}

function format(msg,cls) {
  switch (cls) {
    case 'aios':
      return ('['+(options.log.host?('#'+process.pid+'.'):'')+
              (options.log.world&&current.world?(current.world.id+'.'):'')+
              (options.log.node&&current.node?(current.node.id+'.'):'')+
              (options.log.pid&&current.process?('('+current.process.pid+')'):'')+
              (options.log.date?('@'+Io.date()):
              (options.log.time?('@'+Io.time()):
              (options.log.Time?('@'+Io.Time()):'')))+
              '] '+msg);
    case 'agent':
      return ('['+(options.log.host?('#'+process.pid+'.'):'')+
               (options.log.world&&current.world?(current.world.id+'.'):'')+
               (options.log.node&&current.node?(current.node.id+'.'):'')+
               (options.log.class&&current.process?(current.process.agent.ac+'.'):'')+
               (options.log.agent&&current.process?(current.process.agent.id):'')+
               (options.log.parent&&current.process?('<'+current.process.agent.parent):'')+
               (options.log.pid&&current.process?('('+current.process.pid+')'):'')+
               (options.log.date?('@'+Io.date()):
               (options.log.time?('@'+Io.time()):
               (options.log.Time?('@'+Io.Time()):'')))+
               '] '+msg);
    default:
      return ('['+
               (options.log.date?('@'+Io.date()):
               (options.log.time?('@'+Io.time()):
               (options.log.Time?('@'+Io.Time()):'')))+
               '] '+msg)
  }
}
// AIOS smart logging function for Agents
var logAgent = function(){
    var msg='';
    arguments.forEach(function (arg,i) {
      if (typeof arg == 'string' || typeof arg == Number) msg += (i>0?', '+arg:arg);
      else msg += (i>0?' '+Io.inspect(arg):Io.inspect(arg));
    });
    (Aios.printAgent||Aios.print)(format(msg,'agent'))

}
// AIOS smart logging function for AIOS internals (w/o agent messages)
var logAIOS = function(){
    var msg='';
    arguments.forEach(function (arg,i) {
      if (typeof arg == 'string' || typeof arg == Number) msg += (i>0?', '+arg:arg);
      else msg += (i>0?' '+Io.inspect(arg):Io.inspect(arg));
    });
    if (current.process) (Aios.printAgent||Aios.print)(format(msg,'aios'));
    else                 (Aios.printAgent||Aios.print)(format(msg));
}

// AIOS smart logging function for AIOS internals (w/o agent messages) used by async callbacks
var logAIOSasync = function(){
    var msg='';
    arguments.forEach(function (arg,i) {
      if (typeof arg == 'string' || typeof arg == Number) msg += (i>0?', '+arg:arg);
      else msg += (i>0?' '+Io.inspect(arg):Io.inspect(arg));
    });
    if (current.process)  (Aios.printAsync||Aios.print)(Aios.printAgent||Aios.print)(format(msg,'aios'));
    else                  (Aios.printAsync||Aios.print)(format(msg));
}

// Generic messages (used by other modules and drivers)
var log = function () {
    var msg='',pref='';
    arguments.forEach(function (arg,i) {
      if (typeof arg == 'string' || typeof arg == Number) msg += (i>0?', '+arg:arg);
      else msg += (i>0?', '+Io.inspect(arg):Io.inspect(arg));
    });
    if (options.log.host && typeof process != 'undefined') pref='#'+process.pid+': ';
    if (options.log.date) pref=pref+Io.date()+' ';
    else if (options.log.time) pref=pref+Io.time()+' ';
    else if (options.log.Time) pref=pref+Io.Time()+' ';
 
    if (msg[0]=='[')    Aios.print(pref+msg);
    else                Aios.print('[AIOS'+pref+'] '+msg);
}

// Generic async messages (async, from callbacks)
var logAsync = function () {
    var msg='',pref='';
    arguments.forEach(function (arg,i) {
      if (typeof arg == 'string' || typeof arg == Number) msg += (i>0?', '+arg:arg);
      else msg += (i>0?', '+Io.inspect(arg):Io.inspect(arg));
    });
    if (options.log.host && typeof process != 'undefined') pref='#'+process.pid+': ';
    if (options.log.date) pref=pref+Io.date()+' ';
    else if (options.log.time) pref=pref+Io.time()+' ';
    else if (options.log.Time) pref=pref+Io.Time()+' ';
    
    if (msg[0]=='[')  (Aios.printAsync||Aios.print)(pref+msg);
    else              (Aios.printAsync||Aios.print)('[AIOS'+pref+'] '+msg);
}

var eval0=eval;

/** Sandbox module environment for agents (level 0): Untrusted, 
 * minimal set of operations (no move, fork, kill(others),..)
 */
var aios0 = {
  abs:Math.abs,
  add: function (a,b) {
    var res,i;
    if (Comp.obj.isNumber(a) && Comp.obj.isNumber(b)) return a+b;
    if (Comp.obj.isArray(a) && Comp.obj.isArray(b)) {
      if (a.length!=b.length) return none;
      res=Comp.array.copy(a);
      for (i in a) {
        res[i]=aios0.add(a[i],b[i]);
      }
      return res;  
    }
    if (Comp.obj.isArray(a) && Comp.obj.isFunction(b)) {
      res=Comp.array.copy(a);
      for (i in a) {
        res[i]=aios0.add(a[i],b.call(current.process.agent,a[i]));
      }
      return res;  
    }
    if (Comp.obj.isObj(a) && Comp.obj.isObj(b)) {
      res={};
      for (i in a) {
        res[i]=aios0.add(a[i],b[i]);
      }
      return res;     
    }
    return none;
  },
  angle: function (p1,p2) {
    var angle,v1,v2;
    if (Comp.obj.isArray(p1)) v1=p1;
    else if (Comp.obj.isObj(p1)) v1=[p1.x,p1.y];
    if (Comp.obj.isArray(p2)) v2=p2;
    else if (Comp.obj.isObj(p2)) v2=[p2.x,p2.y];
    if (p2==undefined) {v2=v1;v1=[0,0]};
    angle=Math.atan2(v2[1]-v1[1],v2[0]-v1[0]);
    return 180*angle/Math.PI;
  },
  array: function (cols,init) {
    if (init==undefined) init=0;
    var row=[];
    for(var j=0;j<cols;j++) row.push(typeof init == 'function'?init(j):init);
    return row;
  },
  assign : function (src,dst) {
    for(var p in src) dst[p]=src[p]
    return dst;
  },
  Capability: Sec.Capability,
  clock: clock,
  concat: function (a,b,unique) {
    var res,i;
    if (Comp.obj.isArray(a) && Comp.obj.isArray(b)) {
      if (!unique) return a.concat(b);
      res=a.slice();
      for(var i in b) {
        if (res.indexOf(b[i])==-1) res.push(b[i]);
      }
      return res;
    } else if (Comp.obj.isObj(a) && Comp.obj.isObj(b)) {
      res={};
      for (i in a) {
        res[i]=a[i];
      }
      for (i in b) {
        res[i]=b[i];
      }
      return res;     
    } else if (Comp.obj.isString(a) && Comp.obj.isString(b)) {
      return a+b;
    } else
      return undefined;
  },
  contains : function (o,e) {
    // e can be a scalar or array of values
    if (Comp.obj.isArray(o)) 
      return Comp.array.contains(o,e);
    else if (Comp.obj.isObj(o) && (Comp.obj.isString(e) || Comp.obj.isNumber(e))) 
      return o[e] != undefined;
    else if (Comp.obj.isString(o) && Comp.obj.isString(e)) 
      return o.indexOf(e)!=-1
  },
  copy : function (o)  {
    // recursively copy objects
    var _o,p;
    if (Comp.obj.isArray(o)) {
      if (typeof o[0] != 'object') return o.slice();
      else return o.map(function (e) {
            if (typeof e == 'object') return aios0.copy(e);
              else return e;
            });
      
    } else if (Comp.obj.isObject(o)) {
      _o={};
      for(p in o) _o[p]=(typeof o[p]=='object'?aios0.copy(o[p]):o[p]);
      return _o;
    } 
    else if (Comp.obj.isString(o)) 
      return o.slice();
    else return o;
  },
  delta : function (o1,o2) {
    var res;
    if (Comp.obj.isArray(o1) && Comp.obj.isArray(o2)) {
      if (o1.length != o2.length) return;
      res=[];
      for (var i in o1) res[i]=o1[i]-o2[i]; 
    } else if (Comp.obj.isObject(o1) && Comp.obj.isObject(o2)) {
      res={};
      for (var p in o1) res[p]=o1[p]-o2[p];     
    }
    return res; 
  },
  distance: function (p1,p2) {
    var y=0;
    if (p2) for(var p in p1) if (typeof p1[p] == 'number' && 
                                 typeof p2[p] == 'number') y+=Math.pow(p1[p]-p2[p],2);
    else for(var p in p1) if (typeof p1[p] == 'number') y+=Math.pow(p1[p],2);
    return Math.sqrt(y)
  },
  div: div,
  dump: function (x) { 
    if (x=='res') x=Comp.obj.copy(current.process.resources); 
    if (x=='?') x=this; 
    logAgent(util.inspect(x)); },
  empty: function (o) {
    if (Comp.obj.isArray(o) || Comp.obj.isString(o)) return o.length==0;
    else if (Comp.obj.isObj(o)) return Comp.obj.isEmpty(o);
    else return false;
  },
  equal: function (a,b) {
    var i;
    if (Comp.obj.isNumber(a) && Comp.obj.isNumber(b)) return a==b;
    else if (Comp.obj.isArray(a) && Comp.obj.isArray(b)) {
      if (a.length!=b.length) return false;
      for (i in a) {
        if (!aios0.equal(a[i],b[i])) return false;
      }
      return true;     
    }
    else if (Comp.obj.isObj(a) && Comp.obj.isObj(b)) {
      for (i in a) {
        if (!aios0.equal(a[i],b[i])) return false;
      }
      return true;     
    }
    else if (Comp.obj.isString(a) && Comp.obj.isString(b))
      return (a.length==b.length && a==b)
    return false;
  },
  filter:function (a,f) {
    var element,res=[],len,len2,i,j,found;
    if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
        res=[];
        len=a.length;
        for(i=0;i<len;i++) {
            element=a[i];
            if (f.call(current.process.agent,element,i)) res.push(element);
        }
        return res;
    } else if (Comp.obj.isArray(a) && Comp.obj.isArray(f)) {
        res=[];
        len=a.length;
        len2=f.length;
        for(i=0;i<len;i++) {
            element=a[i];
            found=false;
            for (j=0;j<len2;j++) if(element==f[j]){found=true; break;}
            if (!found) res.push(element);
        }
        return res;      
    } else return undefined;   
  },
  flatten : function (a,level) {
    if (Comp.obj.isMatrix(a)) { // [][] -> []
      return a.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) && level>1? aios0.flatten(toFlatten,level-1) : toFlatten);
      }, []);
    } else if (Comp.obj.isObj(a)) { // {{}} {[]} -> {}
      function flo (o) {
        var o2={},o3;
        for(var p in o) {
          if (typeof o[p]=='object') {
            o3=flo(o[p]);
            for(var p2 in o3) {
              o2[p+p2]=o3[p2];
            }
          } else o2[p]=o[p];
        }
        return o2;
      }
      return flo(a);
    }
    return a;
  },
  head:function (a) {
    if (Comp.obj.isArray(a))
      return Comp.array.head(a);
    else return undefined;
  },
  id:aidgen,
  info:function (kind) {
    switch (kind) {
      case 'node':  
        return { 
          id:current.node.id, 
          position: current.node.position, 
          location:current.node.location,
          type:current.node.type, 
        };
      case 'version': 
        return options.version;
      case 'host': 
        return { 
          type:global.TARGET 
        };      
    }
  },
  int: int,
  isin: function (o,v) {
    var p;
    if (Comp.obj.isArray(o)) {
      for(p in o) if (aios0.equal(o[p],v)) return true;
      return false;
    } else if (Comp.obj.isObj(o)) {
      for(p in o) if (aios0.equal(o[p],v)) return true;
      return false;    
    } else if (Comp.obj.isString(o)) {
      return o.indexOf(v)!=-1
    }
  },
  iter:function (obj,fun) {
    var p;
    if (Comp.obj.isArray(obj))
      for(p in obj) fun.call(current.process.agent,obj[p],Number(p));
    else
      for(p in obj) fun.call(current.process.agent,obj[p],p)
  },
  keys: Object.keys,
  kill:function () {kill(current.process.agent.id)},
  last: function (o) {
    if (o==undefined) return;
    else if (Comp.obj.isArray(o) || Comp.obj.isString(o)) 
      return o[o.length-1];
    else if (Comp.obj.isObj(o)) {
      var p,l;
      for(p in o) if (o[p]!=undefined) l=o[p];
      return l; 
    }
  },
  length: function (o) {
    if (o==undefined) return 0;
    else if (Comp.obj.isObj(o)) {
      var p,l=0;
      for(p in o) if (o[p]!=undefined) l++;
      return l; 
    } else return o.length
  },
  log:function () { logAgent.apply(_,arguments) },
  map:function (a,f) {
    var res,i,p;
    if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
      res=[];
      for (i in a) {
        v=f.call(current.process.agent,a[i],i);
        if (v!=undefined) res.push(v);
      }
      return res;
    } else if (Comp.obj.isObject(a) && Comp.obj.isFunction(f)) {
      // Objects can be filtered (on first level), too!
      res={};
      for(p in a) {
        v=f.call(current.process.agent,a[p],p);
        if (v != undefined) res[p]=v;
      }
      return res;
    } else return undefined;   
  },
  matrix: function (x,y,init) {
    var row=[];
    var mat=[];
    for (var j=0;j<y;j++) {
      row=[];
      for(var i=0;i<x;i++) 
        row.push(init||0)
      mat.push(row)
    }
    return mat;
  },
  max: function (a,b) {
    if (Comp.obj.isArray(a)) {
      var f=function (x) {return x},v,vi;
      if (Comp.obj.isFunction(b)) f=b;
      Comp.array.iter(a,function (a0,i) {
        a0=f(a0);
        if (v==undefined || a0>v) {v=a0; vi=i};
      });
      if (vi!=undefined) return a[vi];
    } else return Math.max(a,b);
  },
  me: function () {
    return current.process.agent.id;
  },
  min: function (a,b) {
    if (Comp.obj.isArray(a)) {
      var f=function (x) {return x},v,vi;
      if (Comp.obj.isFunction(b)) f=b;
      Comp.array.iter(a,function (a0,i) {
        a0=f(a0);
        if (v==undefined || a0<v) {v=a0; vi=i};
      });
      if (vi!=undefined) return a[vi];
    } else return Math.min(a,b);
  },
  myClass: function () {
    return current.process.agent.ac;
  },
  myNode: function () {
    return current.node.id;
  },
  myParent: function () {
    return current.process.agent.parent;
  },
  myPosition: function () {
    return current.node.location||current.node.position;
  },
  neg: function (v) {
    var p;
    if (Comp.obj.isNumber(v)) return -v;
    if (Comp.obj.isArray(v)) return v.map(function (e) {return aios0.neg(e)});
    if (Comp.obj.isObj(v)) {
      var o=v,_o={};
      for(p in o) _o[p]=typeof o[p]=='number'?-o[p]:o[p];
      return _o;
    }
  },
  negotiate:function (res,val,cap) { return negotiate(0,res,val,cap) },
  next:function () {},
  object : function (str) {
    var myobj={data:null};
    with ({myobj:myobj, str:str}) { myobj.data=eval0('var _o='+str+';_o') };
    return myobj.data;
  },
  pluck : function (table,column) {
    var res=[];
    for(var i in table) {
      res.push(table[i][column]);
    }
    return res;
  },
  privilege: function () {return 0},
  Port: Sec.Port,
  Private: Sec.Private,
  random: function (a,b,frac) {
    var r,n,p,i,keys,k;
    if (Comp.obj.isArray(a)) {
      n = a.length;
      if (n>0)
        return a[Comp.random.int(n)];  
      else
        return none;
    } else if (Comp.obj.isObj(a)) {
      keys=Object.keys(a);
      n = keys.length;
      if (n>0)
        return a[keys[Comp.random.int(n)]];  
      else
        return none;
    } else if (b==undefined) {b=a;a=0}; 
    if (!frac ||frac==1)
      return Comp.random.interval(a,b);
    else {
      r=Comp.random.range(a,b);
      return ((r/frac)|0)*frac;
    }
  },
  reduce : function (a,f) {
    if (Comp.obj.isArray(a)) {
      return a.reduce(function (a,b) {
        return current.process?f.call(current.process.agent,a,b):f(a,b);
      });
    }
  },
  reverse: function (a) {
    if (Comp.obj.isArray(a)) 
      return a.slice().reverse(); 
    else if (Comp.obj.isString(a)) 
      return a.split("").reverse().join("")
  }, 
  sleep:Sig.agent.sleep,
  sort: function (a,f) {
    if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
      return Comp.array.sort(a,function (x,y) {
        return f.call(current.process.agent,x,y);
      });
    } else return undefined;       
  },
  sum: function (o,f) {
    if (Comp.obj.isArray(o)) return Comp.array.sum(o,f);
    else if (Comp.obj.isObject(o)) {
      var s=0,p;
      if (!f) f=function(x){return x};
      for(p in o) s+=f(o[p]);
      return s;
    }
  },
  string:function (o) {if (Comp.obj.isString(o)) return o; else return o.toString()},
  tail:function (a) {
    if (Comp.obj.isArray(a))
      return Comp.array.tail(a);
    else return undefined;
  },
  time:function () { return time()-current.world.lag},
  // returns a without b
  without : function (a,b) {
    if (Comp.obj.isArray(a) && (Comp.obj.isArray(b)))
      return a.filter(function (v) {
        return !aios0.contains(b,v);
      });
    else if (Comp.obj.isArray(a)) 
      return a.filter(function (v) {
        return !aios0.equal(b,v);
      });    
  },
  zero: function (a) {
    var i;
    if (Comp.obj.isNumber(a)) return a==0;
    if (Comp.obj.isArray(a)) {
      for (i in a) {
        if (!aios0.zero(a[i])) return false;
      }
      return true;     
    }
    if (Comp.obj.isObj(a)) {
      for (i in a) {
        if (!aios0.zero(a[i])) return false;
      }
      return true;     
    }
    return false;    
  },

  Vector: function (x,y,z) {var o={}; if (x!=_) o['x']=x; if (y!=_) o['y']=y; if (z!=_) o['z']=z; return o},

  // Scheduling and checkpointing
  B:B,
  CP:CP,
  I:I,
  L:L,
  RT:RT,
  
  Math:Math
}

// Sandbox module environment for agents (level 1): Trusted, standard operational set
var aios1 = {
  abs:aios0.abs,
  act:Conf.agent.act,
  add:aios0.add,
  angle:aios0.angle,
  alt:Ts.agent.alt,
  array:aios0.array,
  assign:aios0.assign,
  broadcast:Sig.agent.broadcast,
  Capability: Sec.Capability,
  clock: clock,
  collect:Ts.agent.collect,
  concat:aios0.concat,
  contains:aios0.contains,
  copy:aios0.copy,
  copyto:Ts.agent.copyto,
  // type create = function(ac:string|object,args:object|[]) -> agentid:string
  create: function(ac,args,level) {
    if (level==undefined || level>1) level=1;
    if (args==undefined) args={};
    var process=none,code;
    if (!Comp.obj.isArray(args) && !Comp.obj.isObject(args)) {
      current.error='Invalid argument: Agent argument is neither array nor object'; 
      throw 'CREATE';
    };
    current.process.resources.agents++;
    if (typeof ac == 'object') {
      // indeed a forking with modified act/trans/body
      // { x:this.x, .., act : {}|[], trans:{}, on:[}}
      process = Code.createFromOn(current.node,current.process,ac,level);
    } else if (current.world.classes[ac] && current.world.classes[ac][level])
      process = Code.createOn(current.node,current.world.classes[ac][level],args,level,ac);
    else if (current.process.agent.subclass && current.process.agent.subclass[ac]) {
      process = Code.createOn(current.node,current.process.agent.subclass[ac],args,level,ac);    
    } else {
      current.error='Invalid argument: Unknown agent class '+ac; 
      throw 'CREATE';
    }
    if (process) {
      if (current.process!=none && process.gid==none) {
        process.gid=current.process.pid;
        if (!process.agent.parent) 
          process.agent.parent=current.process.agent.id;
      }
      return process.agent.id; 
    } else return none;    
  },
  delta:aios0.delta,
  distance: aios0.distance,
  div: aios0.div,
  dump: aios0.dump,
  empty:aios0.empty,
  evaluate:Ts.agent.evaluate,
  equal:aios0.equal,
  exists:Ts.agent.exists,
  Export:function (name,code) { current.node.export(name,code) },
  filter:aios0.filter,
  flatten:aios0.flatten,
  fork:function (parameter) {var process = current.process.fork(parameter,undefined,options.fastcopy); return process.agent.id},
  head:aios0.head,
  id:aidgen,
  Import:function (name) { return current.node.import(name) },
  info:aios0.info,
  inp:Ts.agent.inp,
  int: aios0.int,
  isin: aios0.isin,
  iter:aios0.iter,
  keys: Object.keys,
  kill:function (aid) {if (aid==undefined) kill(current.process.agent.id); else kill(aid)},
  last: aios0.last,
  length: aios0.length,
  link:function (dir) {return current.world.connected(dir,current.node)},
  listen:Ts.agent.listen,
  log:aios0.log,
  me:aios0.me,
  mark:Ts.agent.mark,
  map:aios0.map,
  max:aios0.max,
  matrix:aios0.matrix,
  moveto:Mobi.agent.move,
  min:aios0.min,
  myClass:aios0.myClass,
  myNode:aios0.myNode,
  myParent:aios0.myParent,
  myPosition:aios0.myPosition,
  neg:aios0.neg,
  negotiate:function (res,val,cap) { return negotiate(1,res,val,cap) },
  object:aios0.object,
  opposite:Mobi.agent.opposite,
  out:Ts.agent.out,
  pluck : aios0.pluck,
  Port: Sec.Port,
  position: function () {return current.node.position},
  Private: Sec.Private,
  privilege: function () {return 1},
  random: aios0.random,
  rd:Ts.agent.rd,
  reduce:aios0.reduce,
  reverse:aios0.reverse,
  rm:Ts.agent.rm,
  security: Sec,
  send:Sig.agent.send,
  sendto:Sig.agent.sendto,
  sleep:Sig.agent.sleep,
  sort:aios0.sort,
  store:Ts.agent.store,
  string:aios0.string,
  sum:aios0.sum,
  tail:aios0.tail,
  test:Ts.agent.exists,
  time:aios0.time,
  timer:Sig.agent.timer,
  trans:Conf.agent.trans,
  try_alt:Ts.agent.try.alt,
  try_inp:Ts.agent.try.inp,
  try_rd:Ts.agent.try.rd,
  ts:Ts.agent.ts,
  wakeup:Sig.agent.wakeup,
  without:aios0.without,
  zero:aios0.zero,
  
  B:B,
  CP:CP,
  I:I,
  L:L,
  RT:RT,
  
  Vector:aios0.Vector,
  DIR:Mobi.agent.DIR,
  Math:Math
};

// Sandbox module environment for agents (level 2): Trusted with extended privileges
var aios2 = {
  abs:aios0.abs,
  add:aios0.add,
  act:Conf.agent.act,
  angle:aios0.angle,
  alt:Ts.agent.alt,
  array:aios0.array,
  assign:aios0.assign,
  broadcast:Sig.agent.broadcast,
  Capability: Sec.Capability,
  clock: clock,
  collect:Ts.agent.collect,
  concat:aios0.concat,
  contains:aios0.contains,
  copy:aios0.copy,
  copyto:Ts.agent.copyto,
  create: function(ac,args,level) {
    var process=none;
    if (level==undefined || level>2) level=2;
    if (args==undefined) args={};
    if (!Comp.obj.isArray(args) && !Comp.obj.isObject(args)) {
      current.error='Invalid argument: Agent arguments is neither array nor object'; 
      throw 'CREATE';
    };
    current.process.resources.agents++;
    if (typeof ac == 'object') {
      // indeed a forking with modified act/trans/body
      // { x:this.x, .., act : {}|[], trans:{}, on:[}}
      process = Code.createFromOn(current.node,current.process,ac,level);
    } else if (current.world.classes[ac] && current.world.classes[ac][level])
      process = Code.createOn(current.node,current.world.classes[ac][level],args,level,ac);
    else if (current.process.agent.subclass && current.process.agent.subclass[ac]) {
      process = Code.createOn(current.node,current.process.agent.subclass[ac],args,level,ac);    
    } else {
      current.error='Invalid argument: Unknown agent class '+ac; 
      throw 'CREATE';
    }
    if (process) {
      process.agent.ac=ac;
      if (current.process!=none && process.gid==none) {
        process.gid=current.process.pid;
        if (process.agent.parent==_ || process.agent.parent==none) 
          process.agent.parent=current.process.agent.id;
      }
      return process.agent.id; 
    } else return none;    
  },
  delta:aios0.delta,
  distance: aios0.distance,
  div: aios0.div,
  dump: aios0.dump,
  empty:aios0.empty,
  evaluate:Ts.agent.evaluate,
  equal:aios0.equal,
  exists:Ts.agent.exists,
  Export:function (name,code) { current.node.export(name,code) },
  filter:aios0.filter,
  flatten:aios0.flatten,
  fork:function (parameter) {var process = current.process.fork(parameter); return process.agent.id},
  head:aios0.head,
  id:aidgen,
  Import:function (name) { return current.node.import(name) },
  info:aios0.info,
  inp:Ts.agent.inp,
  int: aios0.int,
  isin: aios0.isin,
  iter:aios0.iter,
  keys: Object.keys,
  kill:function (aid) {if (aid==undefined) kill(current.process.agent.id); else kill(aid)},
  last: aios0.last,
  length: aios0.length,
  link:function (dir) {return current.world.connected(dir,current.node)},
  listen:Ts.agent.listen,
  log:aios0.log,
  max:aios0.max,
  me:aios0.me,
  min:aios0.min,
  myClass:aios0.myClass,
  myNode:aios0.myNode,
  myParent:aios0.myParent,
  myPosition:aios0.myPosition,
  mark:Ts.agent.mark,
  map:aios0.map,
  matrix:aios0.matrix,
  moveto:Mobi.agent.move,
  neg:aios0.neg,
  negotiate:function (res,val,cap) { return negotiate(2,res,val,cap) },
  object:aios0.object,
  opposite:Mobi.agent.opposite,
  out:Ts.agent.out,
  random: aios0.random,
  reduce:aios0.reduce,
  rd:Ts.agent.rd,
  reverse:aios0.reverse,
  rm:Ts.agent.rm,
  pluck : aios0.pluck,
  Port: Sec.Port,
  position: function () {return current.node.position},
  Private: Sec.Private,
  privilege: function () {return 2},
  security: Sec,
  send:Sig.agent.send,
  sendto:Sig.agent.sendto,
  sleep:Sig.agent.sleep,
  sort:aios0.sort,
  store:Ts.agent.store,
  string:aios0.string,
  sum:aios0.sum,
  tail:aios0.tail,
  test:Ts.agent.exists,
  time:aios0.time,
  timer:Sig.agent.timer,
  trans:Conf.agent.trans,
  try_alt:Ts.agent.try.alt,
  try_inp:Ts.agent.try.inp,
  try_rd:Ts.agent.try.rd,
  ts:Ts.agent.ts,
  wakeup:Sig.agent.wakeup,
  without:aios0.without,
  zero:aios0.zero,
  
  B:B,
  CP:CP,
  I:I,
  L:L,
  RT:RT,
  
  Vector:aios0.Vector,
  DIR:Mobi.agent.DIR,
  
  Math:Math,
};

// Sandbox module environment for agents (level 3): Trusted with extended privileges, system level
// May not migrate!!
var aios3 = {
  abs:aios0.abs,
  act:Conf.agent.act,
  add:aios0.add,
  angle:aios0.angle,
  alt:Ts.agent.alt,
  array:aios0.array,
  assign:aios0.assign,
  broadcast:Sig.agent.broadcast,
  Capability: Sec.Capability,
  clock: clock,
  collect:Ts.agent.collect,
  connectTo:function (dir,options) {
    // Connect this node with another node using a virtual or physical channel link
    var node=current.node, world=current.world;
    if (!dir || !dir.tag) throw('CONNECT');
    world.connectTo(dir,node,options);
  },
  concat:aios0.concat,
  contains:aios0.contains,
  copy:aios0.copy,
  copyto:Ts.agent.copyto,
  create: function(ac,args,level) {
    var process=none;
    if (level==undefined) level=3;
    if (args==undefined) args={};
    if (!Comp.obj.isArray(args) && !Comp.obj.isObject(args)) {
      current.error='Invalid argument: Agent arguments is neither array nor object'; 
      throw 'CREATE';
    };
    current.process.resources.agents++;
    if (typeof ac == 'object') {
      // indeed a forking with modified act/trans/body
      // { x:this.x, .., act : {}|[], trans:{}, on:[}}
      process = Code.createFromOn(current.node,current.process,ac,level);
    } else if (current.world.classes[ac] && current.world.classes[ac][level])
      process = Code.createOn(current.node,current.world.classes[ac][level],args,level,ac);
    else if (current.process.agent.subclass && current.process.agent.subclass[ac]) {
      process = Code.createOn(current.node,current.process.agent.subclass[ac],args,level,ac);    
    } else {
      current.error='Invalid argument: Unknown agent class '+ac; 
      throw 'CREATE';
    }
    if (process) {
      process.agent.ac=ac;
      if (current.process!=none && process.gid==none) {
        process.gid=current.process.pid;
        if (process.agent.parent==_ || process.agent.parent==none) 
          process.agent.parent=current.process.agent.id;
      }
      return process.agent.id; 
    } else return none;    
  },
  delta:aios0.delta,
  distance: aios0.distance,
  div: aios0.div,
  dump: aios0.dump,
  empty:aios0.empty,
  equal:aios0.equal,
  evaluate:Ts.agent.evaluate,
  exists:Ts.agent.exists,
  Export:aios2.Export,
  filter:aios0.filter,
  flatten:aios0.flatten,
  fork:aios2.fork,
  head:aios0.head,
  id:aidgen,
  Import:aios2.Import,
  info:aios0.info,
  inp:Ts.agent.inp,
  int: aios0.int,
  isin: aios0.isin,
  iter:aios0.iter,
  keys: Object.keys,
  kill:aios2.kill,
  last: aios0.last,
  length:aios0.length,
  link:aios2.link,
  listen:Ts.agent.listen,
  log:aios0.log,
  max:aios0.max,
  me:aios0.me,
  min:aios0.min,
  myClass:aios0.myClass,
  myNode:aios0.myNode,
  myParent:aios0.myParent,
  myPosition:aios0.myPosition,
  mark:Ts.agent.mark,
  map:aios0.map,
  matrix:aios0.matrix,
  moveto:function () {/* System level agents may not migrate ! */ current.error='ENOTSUPPORTED';throw 'MOVE';},
  neg:aios0.neg,
  negotiate:function (res,val,cap) { return negotiate(3,res,val,cap) },
  object:aios0.object,
  opposite:Mobi.agent.opposite,
  out:Ts.agent.out,
  pluck : aios0.pluck,
  Port: Sec.Port,
  position: function () {return current.node.position},
  Private: Sec.Private,
  privilege: function () {return 3},
  reduce:aios0.reduce,
  random: aios0.random,
  rd:Ts.agent.rd,
  reverse:aios0.reverse,
  rm:Ts.agent.rm,
  send:Sig.agent.send,
  sendto:Sig.agent.sendto,
  sleep:aios0.sleep,
  sort:aios0.sort,
  store:Ts.agent.store,
  string:aios0.string,
  sum:aios0.sum,
  tail:aios0.tail,
  test:Ts.agent.exists,
  time:aios0.time,
  timer:Sig.agent.timer,
  trans:Conf.agent.trans,
  try_alt:Ts.agent.try.alt,
  try_inp:Ts.agent.try.inp,
  try_rd:Ts.agent.try.rd,
  ts:Ts.agent.ts,
  wakeup:Sig.agent.wakeup,
  without:aios0.without,
  zero:aios0.zero,
  
  B:B,
  CP:CP,
  I:I,
  L:L,
  RT:RT,
  
  Vector:aios0.Vector,
  DIR:Mobi.agent.DIR,
  
  Math:Math,
  
  // Exucute an IO block sequence in an agent process context
  IOB: function (block) {
    var proc=current.process;
    setImmediate(function () {
      var index=0;
      function next (to) {
        var _proc=current.process,_node=current.node;        
        if (to==none) {
          // done or failiure
          proc.mask.next=undefined;
          proc.wakeup();
          return;
        }
        index=index+to;        
        try {
          current.process=proc; current.node=proc.node;
          block[index].call(proc.agent);
        } catch (e) {
          logAgent('Caught IOB error: '+e);
        }
        current.process=_proc; current.node=_node;
      }
      proc.mask.next=next;      
      next(0);
    });
    proc.suspend();
  }
};

var aios = aios1;

/*
** Agent code scheduling blocks can migrate 
** - must be handled different from internal scheduling blocks!
*/
// Schedule linear sequence of functions that may block (suspending execution of current agent process).
function B(block) {
  if (current.process.schedule.length==0) 
    current.process.schedule = block;
  else 
    current.process.schedule = Comp.array.concat(block,current.process.schedule);
}

/** Add pending callback call to process scheduling block
 *
 */
function CB(process,cb,args) {
  if (args)
    Comp.array.push(process.schedule,function () { cb.apply(this,args) });  
  else
    Comp.array.push(process.schedule,cb);
}

/** Agent process activity check pointing (injected in loops/functions)
 *
 */
function CP() {
  if (current.process.runtime && (current.process.runtime+current.world.lag-Date.now())<0) throw "SCHEDULE";
  return true;
}

/** Agent exception checker; agents may not consume scheduler/watchdog exceptions!!
*/

function RT(e) {
  if (['WATCHDOG','SCHEDULE'].indexOf(e.toString())!=-1) throw(e);
}

/** Schedule an object iteration sequence that may block (suspending execution of current agent process).
 *
 */
function I(obj,next,block,finalize) {
  /*
  ** Iterate and schedule a block
   * obj: []
   * next: function(next) {}
  */
  var index=0;
  var length=obj.length;
   
  var iterator = [
      function() {
        next(obj[index]);
        if (index<length) {
          B(block.slice());
          index++;
        }           
      },
      function () {
        if (index<length) B(iterator.slice());
        else if (finalize) finalize.call(this);
      }
   ];
  B(iterator.slice());
}

// Schedule a loop iteration sequence that may block (suspending execution of current agent process).
function L(init,cond,next,block,finalize) {
   /*
   ** Iterate and schedule a block
    * init: function() {}
    * cond: function() { return cond; }
    * next: function() {}
   */
   var loop = [
       function() {
          if (cond.call(this)) B(block.slice());
       },
       next,
       function () {
          if (cond.call(this)) B(loop.slice());           
       }
   ];
  B(loop.slice());
  B([init]);
}


/** Agent Identifier Generator
 *
 */ 
function aidgen(_options) {
  return Name.generate(_options||options.nameopts);
}

/** AIOS configuration 
 *
 */
function config(settings) {
  for (var p in settings) {
    switch (p) {
      case 'iterations': iterations=settings[p]; break;
      case 'fastcopy':  options.fastcopy=settings[p]; break;
      case 'verbose':   options.verbose=settings[p]; break;
      case 'log+':      options.log[settings[p]]=true; break;
      case 'log-':      options.log[settings[p]]=false; break;
      case 'log':
        // log options object override
        for(var l in settings[p]) options.log[l]=settings[p][l];
        break;
      case 'nolimits': 
        if (settings[p]) 
          Aios.watchdog=undefined,
          options.nolimits=true,
          Aios.Code.inject.cp=undefined,
          Aios.Code.inject.rt=undefined; 
        break;
      case 'nowatch': 
        if (settings[p]) 
          Aios.watchdog=undefined,
          Aios.Code.inject.cp=undefined,
          Aios.Code.inject.rt=undefined; 
        break;
      case 'checkpoint': 
        if (settings[p]) 
          Aios.watchdog=undefined,
          Aios.Code.inject.cp='CP',
          Aios.Code.inject.rt='RT';
        break;
      case 'security':
        // Capability port-random pairs
        for (var q in settings[p]) {
          var port=Sec.Port.ofString(q),
              random=Sec.Port.ofString(settings[p][q]);
          options.security[port]=random;
        }
        break;
      case 'print':       Aios.print=settings[p]; break;
      case 'printAgent':  Aios.printAgent=settings[p]; break;
      case 'printAsync':  Aios.printAsync=settings[p]; break;
      case 'LEVEL':       options.LEVEL=settings[p]; break;
      case 'LIFETIME':    options.LIFETIME=settings[p]; break;
      case 'TIMESCHED':   options.TIMESCHED=settings[p]; break;
      case 'TIMEPOOL':    options.TIMEPOOL=settings[p]; break;
      case 'MEMPOOL':     options.MEMPOOL=settings[p]; break;
      case 'TSPOOL':      options.TSPOOL=settings[p]; break;
      case 'AGENTPOOL':   options.AGENTPOOL=settings[p]; break;
      case 'MINCOST':     options.MINCOST=settings[p]; break;
      case 'RUNTIME' :    options.RUNTIME=settings[p]; break;
      case 'IDLETIME' :   options.IDLETIME=settings[p]; break;
      case 'TSTMO':       options.TSTMO=Aios.Ts.options.timeout=settings[p]; break;
      case 'time': 
        time=settings[p]; 
        // Update alle time and CP references
        Aios.time=aios0.time=aios1.time=aios2.time=aios3.time=time;
        Aios.CP=aios0.CP=aios1.CP=aios2.CP=aios3.CP=function () {
          if (current.process.runtime && (current.process.runtime+current.world.lag-time())<0) throw "SCHEDULE";
          return true;
        };
        break;
    }
  }
}

function configGet() {
  return {
    LEVEL     : options.LEVEL,
    LIFETIME  : options.LIFETIME,
    TIMESCHED : options.TIMESCHED,
    TIMEPOOL  : options.TIMEPOOL,
    TSPOOL    : options.TSPOOL,
    AGENTPOOL : options.AGENTPOOL,
    MEMPOOL   : options.MEMPOOL,
    MINCOST   : options.MINCOST,
    RUNTIME   : options.RUNTIME,
    IDLETIME  : options.IDLETIME,
    TSTMO     : Aios.Ts.options.timeout,
    security  : Object.keys(options.security).map(function (port) {
      return { port:Sec.Port.toString(port), random:Sec.Port.toString(options.security[port])}
    }),
    checkpoint: { cp:Aios.Code.inject.cp, rt:Aios.Code.inject.rt, watchdog: Aios.watchdog?true:fals },
    nolimits  : options.nolimits,
    iterations: iterations,
    fastcopy  : options.fastcopy,
    verbose   : options.verbose,
    log       : options.log,
  }
}

function dump(e) {
        var e = e ||(new Error('dummy'));
        var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n');
        log(e);
        log('Stack Trace');
        log('--------------------------------');
        for(var i in stack) {
            if (i>0) {
                var line = stack[i];
                if(line.indexOf('Module.',0)>=0) break;
                log(line);
            }
        }
        log('--------------------------------');
};
/** Emit event
 *  function emit(@event,@arg1,..)
 */
function emit() {
  if (events[arguments[0]]) 
    events[arguments[0]](arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]);
}
/** Try to get the source position of an error raised in an agent activity
 *
 */
function errorLocation(process,err) {
  try {
    var stack = err.stack.split('\n');
    for (var i in stack) {
      var line=stack[i];
      if (line.indexOf('at act.')>=0||line.indexOf('at F.act.')>=0) {        
        return line.replace(/\([^\)]+\)/,'').replace(/\)/,'');
      }
      else if (line.indexOf('at trans.')>=0 || line.indexOf('at F.trans.')>=0) {        
        return line.replace(/\([^\)]+\)/,'').replace(/\)/,'');
      }
    }
    return '';
  } catch (e) {
    return '';
  } 
}

// Execute a block scheduling function
function exec_block_fun(next) {
    var fun = next[0]||next,
        argn = next.length-1;
    switch (argn) {
        case 0:
        case -1:
            fun(); break;
        case 1: fun(next[1]); break;
        case 2: fun(next[1],next[2]); break;
        case 3: fun(next[1],next[2],next[3]); break;
        case 4: fun(next[1],next[2],next[3],next[4]); break;
        case 5: fun(next[1],next[2],next[3],next[4],next[5]); break;
        case 6: fun(next[1],next[2],next[3],next[4],next[5],next[6]); break;
        case 7: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7]); break;
        case 8: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7],next[8]); break;
        case 9: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7],next[8],next[9]); break;
        default:
            // TODO: fun.apply(undefined,next.slice(1))
            Io.err('Aios.exec_block_fun: more than 9 function arguments');
    }
}


/** Fork the current agent with an optional new set of parameters.
 *
 */
function fork(parameters) {
  return current.process.fork(parameters);
}

/** Kill an agent (if agent identifier is undefined the current agent will be killed).
 *
 */
function kill(agent) {
  var process;
  if (!agent) {
    process=current.process;
  } else {
    process=current.node.processes.process(agent);
  }
  if (options.debug.kill) console.log('Aios.kill',agent,process!=null);
  if (process) {
    process.kill=true;
    current.node.unregister(process);
    return true;
  } else if (current.node.processes.gone[agent]) {
    // migrated agent: try to send kill signal!
    Sig.agent.send(agent,'PROC.KILL',9,current.process.agent.id);
  } else return false; 
}

function killOn(agent,node) {
  var process;
  process=node.processes.process(agent); 
  if (process) {
    process.kill=true;
    node.unregister(process);
  };
}

/** Lock the global namespace. Disable inter-agent communication
 *  by using the global namespace => Sandbox (level 2)
 *
 */
function lock() {
  Object.preventExtensions(global);
}

/** Execute agent processes until there are no more schedulable agents.
 *  Loop returns if there are no more runnable agents. If there are waiting
 *  agent processes, the loop will be rescheduled on the earliest time event.
 *
 */
 
function loop(services) {
  var nexttime = scheduler(services);
  if (nexttime>0) {
    // Nothing to do.
    // Sleep until next event and re-enter the scheduling loop.
    if (options.verbose>3) log('[LOOP '+current.node.id+'] next schedule on '+ nexttime);
    timer=setTimeout(function () {loop (services)},nexttime-time());
  }
}

function min0(a,b) { return a==0?b:(b==0?a:Comp.pervasives.min(a,b)) };

/** Call agent exception handler. If exception was handled by agent return true, otherwise false.
 *
 */
function handleException(process,exc,arg1,arg2,arg3,arg4) {
  var agent=process.agent;
  if (Aios.watchdog && Aios.watchdog.protect) {
    try { Aios.watchdog.protect(function () {agent.on[exc].call(agent,arg1,arg2,arg3,arg4)})} catch(e) {
      // If there is no handler managing the error (e.g. SCHEDULE), the agent must be terminated!
      if (options.verbose) logAIOS ('Agent '+agent.id+' ['+agent.ac+'] failed handling '+exc+'('+arg1+')');
      process.kill=true
      return false;
    };
  } else
    try {agent.on[exc].call(agent,arg1,arg2,arg3,arg4)} catch(e) {
      // If there is no handler managing the error (e.g. SCHEDULE), the agent must be terminated!
      if (options.verbose) logAIOS ('Agent '+agent.id+' ['+agent.ac+'] failed handling '+exc+'('+arg1+')');
      process.kill=true
      return false;
    }
  return true;
}

/** Agent resource constraint negotiation
 *
 */
function negotiate (level,resource,value,cap) {
  var obj,security=options.security;
  // Check capability rights
  function checkRights(r) {
    return (level > 1 || 
           (cap && security[cap.cap_port] && Sec.Private.rights_check(cap.cap_priv,security[cap.cap_port],r))) 
  
  }
  switch (resource) {
    case 'LIFE':
    case 'LIFETIME':
      if (!checkRights(Sec.Rights.NEG_LIFE)) return false;
      current.process.resources.LIFE=value; break;
    case 'CPU':
    case 'TIMEPOOL':
      if (!checkRights(Sec.Rights.NEG_CPU)) return false;
      current.process.resources.CPU=value; break;
    case 'SCHED': 
    case 'SCHEDULE': 
    case 'TIMESCHED': 
      if (!checkRights(Sec.Rights.NEG_SCHED)) return false;
      current.process.resources.SCHED=value; break;
    case 'MEM': 
    case 'MEMORY': 
    case 'MEMPOOL': 
      if (!checkRights(Sec.Rights.NEG_RES)) return false;
      current.process.resources.MEM=value; break;
    case 'TS': 
    case 'TSPOOL': 
      if (!checkRights(Sec.Rights.NEG_RES)) return false;
      current.process.resources.TS=value; break;
    case 'AGENT': 
    case 'AGENTPPOL': 
      if (!checkRights(Sec.Rights.NEG_RES)) return false;
      current.process.resources.AGENT=value; break;
    case 'LEVEL': 
      if (!checkRights(Sec.Rights.NEG_LEVEL)) return false;
      // Extend process mask TODO!
      switch (value) {
        case 1:
        case 2:
          current.process.upgrade(value);
          break;
      }
      break;
    case '?':
      obj=Comp.obj.copy(current.process.resources);
      Comp.obj.extend(obj,{
        SCHED:  current.process.resources.SCHED||options.TIMESCHED,
        CPU:    current.process.resources.CPU||options.TIMEPOOL,
        MEM:    current.process.resources.MEM||options.MEMPOOL,
        TS:     current.process.resources.TS||options.TSPOOL,
        AGENT:  current.process.resources.AGENT||options.AGENTPOOL,
      });
      return obj;
      break;
    default: return false;
  }  
  return true;
}



/** Event callback management
 *
 */
function off(event) {
  // TODO: care of function chains??
  events[event]=undefined;
}
function on(event,fun) {
  if (events[event]) {
    // Implement callback function chain
    var funorig=events[event];
    events[event]=function () {
      funorig.apply(this,arguments);
      fun.apply(this,arguments);    
    };
  } else
    events[event]=fun;
}

function out(str) {log(str)};

/** Get current resource allocation of process memory
 *
 */
function resource(r0) {
  var r;
  if (!options.useproc) return 0;
  // Time expensive operation: requires system call and a lot of internal computation
  r=process.memoryUsage();
  // console.log(r)
  if (r0==undefined) 
    return {r:r.rss-r.heapTotal,h:r.heapUsed};
  else return int((Math.max(0,r.rss-r.heapTotal-r0.r)+Math.max(0,r.heapUsed-r0.h))/1024);
}

/** Scheduling function for one agent process.
 *
 *  Scheduling order:
 *    1. Process Blocks (process.block, passed to global DOS scheduler)
 *    2. Signals (process.signals, handled by AIOS scheduler)
 *    3. Transition (process.transition==true, handled by AIOS scheduler)
 *    4. Agent Blocks (process.schedule, handled by AIOS scheduler)
 *    5. Activity (handled by AIOS scheduler)
 *
 */
var SA = {
  NOOP:0,
  BLOCK:1,
  NORES:2,
  SIG:3,
  TRANS:4,
  SCHED:5,
  ACT:6,
  print: function (op) {
    switch (op) {
      case SA.NOOP: return 'NOOP';
      case SA.BLOCK: return 'BLOCK';
      case SA.NORES: return 'NORES';
      case SA.SIG: return 'SIG';
      case SA.TRANS: return 'TRANS';
      case SA.SCHED: return 'SCHED';
      case SA.ACT: return 'ACT';
    }
  }
}

// One scheduler run
function schedule(process) {
  var exec,sig,start,delta,next,
      _current,
      node=current.node,
      agent=process.agent,
      action='',
      op=SA.NOOP,
      handled,
      exception,
      curtime,
      r0;

  ticks++;   // move to scheduler ???
  // console.log(process);
  assert((process.agent!=undefined && process.id=='agent')||('Aios.schedule: not an agent process: '+process.id));

  /* Order of operation selection:
  **
  ** -1: Lifetime check
  ** 0. Process (internal) block scheduling [block]
  ** 1. Resource exception handling
  ** 2. Signal handling [signals]
  **    - Signals only handled if process priority < HIGH 
  **    - Signal handling increase proecss priority to enable act scheduling!
  ** 3. Transition execution
  ** 4. Agent schedule block execution [schedule]
  ** 5. Next activity execution
  */
  curtime = time();
  
  if (!options.nolimits && !process.kill && 
      (process.resources.start+(process.resources.LIFE||options.LIFETIME))<
       (curtime-current.world.lag)) op=SA.NORES; 
  else if (process.blocked ||
      (process.suspended==true && process.block.length==0 && process.signals.length==0) ||
      process.dead==true ||
      (agent.next==none && process.signals.length==0 && process.schedule.length == 0)) op=SA.NOOP;
  // if (process.suspended==true && process.schedule.length==0 && process.signals.length==0) op=SA.NOOP;
  else if (!process.blocked && process.block.length > 0) op=SA.BLOCK;
  else if (!options.nolimits && 
           (process.resources.consumed>(process.resources.CPU||options.TIMEPOOL) || 
            process.resources.memory>(process.resources.MEM||options.MEMPOOL)
           ))  
          op=SA.NORES;
  else if (process.priority<Proc.PRIO.HIGH && process.signals.length>0) op=SA.SIG;
  else if (!process.suspended && process.transition) op=SA.TRANS;
  else if (!process.suspended && process.schedule.length > 0) op=SA.SCHED;
  else if (!process.suspended) op=SA.ACT;

  if (options.verbose>3) print('[SCH] '+time()+' '+process.agent.id+' : '+
                               SA.print(op)+' [susp='+process.suspended+
                               ',trans='+process.transition+',tmo='+process.timeout+']');
  
  if (op==SA.NOOP) return 0;

  start=curtime;
  
  if (Aios.watchdog) Aios.watchdog.start(process.resources.SCHED||options.TIMESCHED);
  else if (!options.nolimits)
    process.runtime=start-current.world.lag+(process.resources.SCHED||options.TIMESCHED); 
  if (!options.nolimits)
    r0=resource(); // Start resource monitor
  
  current.process=process;
  current.error=none;
  if (current.scheduler) _current=current.scheduler.SetCurrent(process);
  try {
    switch (op) {  
      case SA.BLOCK:
        // An internal schedule block [Linear/Loop]
        // Pass to global scheduler
        // console.log(process.block)
        schedule_block(process);  
        break;
      case SA.NORES:
        throw 'EOL';
        break;
      case SA.SIG:
        /* Execute a signal handler 
        ** 1. A signal handler can wakeup a suspended agent process by calling wakeup()
        ** 2. A signal handler can wakeup a suspended agent process by modifying variables and satisfying the current
        **    transition condition resulting in an activity transition!
        */
        if (!process.suspended && !process.transition) process.priority++;   
          // Pending activity execution -> block signal handling temporarily
        action='signal';
        sig=Comp.array.pop(process.signals);
        try {
          // sig=[signal,argument?,from?]
          agent.on[sig[0]].call(agent,sig[1],sig[2]);
          if (process.suspended && process.transition) process.suspended=false; // ==> 2.)
        } catch(e) {
          if (!agent.on[sig[0]]) 
            logAIOS ('Signal handler '+sig[0]+' in agent '+agent.id+' ['+agent.ac+'] not defined, ignoring signal.');
          else 
            logAIOS ('Signal handler '+sig[0]+' in agent '+agent.id+' ['+agent.ac+'] failed: '+e+
                      (current.error?' / '+current.error:'')+', in: \n'+Code.print(agent.on[sig[0]])+
                      +errorLocation(process,e))
          current.error=none;
          process.kill=true; // Always?
        };  
        Aios.emit('signal+',process,node,sig[0],sig[1],sig[2]);
        break;
      case SA.TRANS:
        // Pending next computation: Compute next transition after wakeup or after a signal was handled.
        // If still not successfull, suspend agent process.
        try {
          action='transition';
          if (!agent.trans[agent.next]) throw "NOTDEFINED";
          next=(typeof agent.trans[agent.next] == 'function')?
                agent.trans[agent.next].call(agent):
                agent.trans[agent.next];
          // TODO: check blocking state - transitions may not block!
          if (next) {
            agent.next=next;
            process.suspended=false;
            process.transition=false;
          } else {
            process.suspended=true;      
          }
        } catch (e) {
          if (agent.trans[agent.next]==undefined) 
            logAIOS ('Transition table entry '+agent.next+' not defined in agent '+agent.id+' ['+agent.ac+'].');
          else 
            logAIOS ('Agent '+agent.id+' ['+agent.ac+'] in transition '+agent.next+
                      ' failed:\n'+e+(current.error?' / '+current.error:'')+
                      +errorLocation(process,e));
          process.kill=true;
          current.error=none;      
        }
        break;
      case SA.SCHED:
        // An agent schedule block function [Linear/Loop] executed in agent context
        action='block';
        exec = Comp.array.pop(process.schedule);
        Aios.watchdog&&Aios.watchdog.protect?Aios.watchdog.protect(exec.bind(agent)):exec.call(agent);
        if (!process.kill && !process.suspended && process.schedule.length == 0) {
          if (process.notransition) {
            // prevent transition after this process.schedule was executed.
            process.notransition=false;
          } else {
            // next=agent.trans[agent.next].call(agent);      
            next=(typeof agent.trans[agent.next] == 'function')?agent.trans[agent.next].call(agent):agent.trans[agent.next];
            if (!next) process.suspend(0,true); // no current transition enabled; suspend process
            else agent.next=next;
          } 
        }
        break;
      case SA.ACT:
        // Normal activity execution
        // console.log('[SCH] next:'+agent.next)
        if (process.priority==Proc.PRIO.HIGH) process.priority--;
        action='activity';
        if (agent.next==none) throw 'KILL';
        Aios.watchdog&&Aios.watchdog.protect?
          Aios.watchdog.protect(agent.act[agent.next].bind(agent)):
          agent.act[agent.next].call(agent);
        if (!process.kill && !process.suspended && process.schedule.length == 0) {
          action='transition';
          // next=agent.trans[agent.next].call(agent);
          if (!agent.trans[agent.next]) throw "NOTDEFINED";
          next=(typeof agent.trans[agent.next] == 'function')?
                  agent.trans[agent.next].call(agent):
                  agent.trans[agent.next];
          // TODO: check blocking state - transitions may not block!
          if (!next) process.suspend(0,true); // no current transition enabled; suspend process
          else agent.next=next; 
        } 
        break;
    }   
  } catch (e) {
    if (Aios.watchdog) Aios.watchdog.stop();
    curtime=time()-current.world.lag;
    exception=true;
    switch (e) {
      case 'SCHEDULE':
      case 'WATCHDOG':
        e='SCHEDULE';
        if (Aios.watchdog) Aios.watchdog.start(options.TIMESCHED/10); 
        else process.runtime=curtime+options.TIMESCHED/10;
        handleException(process,'error',e,options.TIMESCHED,agent.next);
        break;
      case 'EOL':
        if (Aios.watchdog) Aios.watchdog.start(options.TIMESCHED/10); else
        process.runtime=curtime+options.TIMESCHED/10;
        // New time or memory contingent must be negotiated based on policy!
        if (process.resources.consumed>=(process.resources.CPU||options.TIMEPOOL)) {
          handleException(process,'error','CPU',e,process.resources.consumed,agent.next);
          if (process.resources.consumed>=(process.resources.CPU||options.TIMEPOOL)) 
            process.kill=true;
        } else if (process.resources.memory>=(process.resources.MEM||options.MEMPOOL)) {
          handleException(process,'error','EOM',process.resources.memory,agent.next);
          if (process.resources.memory>=(process.resources.MEM||options.MEMPOOL))
            process.kill=true;
        } else if (process.resources.tuples>=(process.resources.TS||options.TSPOOL)) {
          handleException(process,'error','EOT',process.resources.memory,agent.next);
          if (process.resources.tuples>=(process.resources.TS||options.TSPOOL))
            process.kill=true;
        } else if ((process.resources.start+(process.resources.LIFE||options.LIFETIME))
                   <curtime) {
          handleException(process,'error','EOL',process.resources.memory,agent.next);
          if ((process.resources.start+(process.resources.LIFE||options.LIFETIME))
              <curtime)
            process.kill=true;
        } else {
          // TODO generic resource overflow?
          handleException(process,'error','EOR',0,agent.next);
          process.kill=true;
        }
        break;
      case 'KILL':
        if (Aios.watchdog) Aios.watchdog.start(options.TIMESCHED/10); 
        else process.runtime=curtime+options.TIMESCHED/10;
        handleException(process,'exit');
        process.kill=true;
        break;
      case 'NOTDEFINED':
        if (agent.act[agent.next]==undefined && options.verbose) 
          logAIOS('Activity '+agent.next+' not defined in agent '+
                   agent.id+' ['+agent.ac+'].');
        else if (agent.trans[agent.next]==undefined && options.verbose) 
          logAIOS('Transition table entry '+agent.next+' not defined in agent '+agent.id+' ['+agent.ac+'].');
        process.kill=true;
        current.error=none;
        break;
      default:
        handled=handleException(process,aiosExceptions.indexOf(e.toString())!=-1?e:'error',e,current.error,agent.next);
        if (!handled && options.verbose) 
          logAIOS ('Agent '+agent.id+' ['+agent.ac+'] in '+(action=='block'?'block in':action)+' '+
                  (action=='signal'?sig[0]:agent.next)+
                  ' failed: Error '+e+(current.error?('; '+current.error):'')+
                  (options.verbose>1?(
                    ', in code: \n'+(
                      action=='activity'?Code.print(agent.act[agent.next]):
                        (action=='transition'?Code.print(agent.trans[agent.next]):
                          (agent.on && sig && agent.on[sig[0]])?Code.print(agent.on[sig[0]]):'none')  
                    )+
                    errorLocation(process,e)
                  ):'')
                  );
        if (options.verbose>2 && ['CREATE','MOVE','SIGNAL'].indexOf(e) == -1) Io.printstack(e);             
        if (!handled) process.kill=true;
        else {
          action='transition';
          // next=agent.trans[agent.next].call(agent);
          if (!agent.trans[agent.next]) throw "NOTDEFINED";
          next=(typeof agent.trans[agent.next] == 'function')?
                  agent.trans[agent.next].call(agent):
                  agent.trans[agent.next];
          // TODO: check blocking state - transitions may not block!
          if (!next) process.suspend(0,true); // no current transition enabled; suspend process
          else agent.next=next;
        }
        current.error=none;
    }
  }
  if (Aios.watchdog) Aios.watchdog.stop();
  else process.runtime=0;
  
  if (!options.nostats) {
    delta=(time()-start)||options.MINCOST;
    process.resources.consumed += delta;
    process.resources.memory += resource(r0);
    current.node.stats.cpu += delta;
  }

  if (options.verbose && exception && process.kill) logAIOS('Killed agent '+agent.id);

  if (current.scheduler) current.scheduler.SetCurrent(_current);

  current.process=none;

  if (options.verbose>3) print(time()+' <- '+process.print());
  
  return 1;
}

/**
 * Internal block scheduling
 */
 

function schedule_block(process) {
    var next;
    /*
     ** Process current function block sequence first!
     ** Format: [[fun,arg1,arg2,...],[block2], [block3], ..]
     ** Simplified: [fun,fun,...]
     */
    if (!process.blocked) {
        next = process.block[0];
        process.block.splice(0,1);
        /*
         ** Do no execute handler blocks maybe at the end of a subsection
         ** of the block list.
         */
        while (!Comp.array.empty(process.block) && next.handler!=undefined) {
            next = process.block[0];
            process.block.splice(0,1);
        }
        if (next.handler==undefined) {
            try {exec_block_fun(next)} catch(e) {
                /*
                 ** Iterate through the block list and try to find a handler entry.
                 */
                while (next.handler==undefined && !Comp.array.empty(process.block)) {
                    next = process.block[0];
                    process.block.splice(0,1);
                }
                if (next.handler!=undefined) {
                    /*
                     ** Call handler ...
                     */
                    // console.log(next.handler.toString())
                    try {exec_block_fun([next.handler,e])} 
                    catch (e) {
                      Io.out('Aios.schedule_block [Internal B], in agent context '+
                             process.agent.id+', got exception in exception handler: '+e);
                      // Io.printstack(e);
                      Io.out(Json.stringify(next).replace(/\\n/g,'\n'));
                    };
                } else {
                    logAIOS ('Agent '+process.agent.id+' ['+process.agent.ac+'] in activity '+
                              process.agent.next+
                              ' failed:\n'+e+(current.error?' / '+current.error:', in: \n'+
                              Code.print(process.agent.act[process.agent.next]))+
                              '');// '\nat:\n'+Io.sprintstack(e)));
                    process.kill=true;
                    current.error=none;
                }
            }
        }
    }
}

var scheduled=0;

/** Main scheduler entry.
 *  Returns the next event time (absolute time!), negative number of scheduled agent processes, or zero
 *  if there is nothing to schedule.
 *  If result is negative, the scheduler should be executed immediately again because there
 *  can be pending agent signals created in the current run.
 */
function scheduler(services) {
  var run=1,nexttime=0,n=0,curtime,process,env,node,pro,
      timeout=time()+options.RUNTIME;
      
  scheduled=0;
  while (run && (iterations==0 || n<iterations) && time()<timeout) {
    run=0; n++;
    if (services) services();
    nexttime=options.IDLETIME?Sig.agent.timeout(options.IDLETIME):0;

    for (env in current.world.nodes) {
      node=current.world.nodes[env];
      if (!node) continue;
      current.node=node;
      curtime=time()-current.world.lag;
      // 1. Timer management
      if (node.timers.length>0) {
        remove=false;
        // 1.1. Check timers and execute runnable signaled agents
        Comp.array.iter(node.timers, function(timer,i) {
            if (timer && timer[1]<=curtime) {
              var process=timer[0],
                  agent=process.agent,
              // Save original process state
                  suspended=process.suspended,
                  timeout=process.timeout;
              
              // process.suspeneded=false;  ?? Signal handler can be executed even with blocked process
              process.signals.push([timer[2],timer[3],agent.id]);
              // TODO: A wakeup call in the signal handler re-enters schedule() !!!
              run += schedule(process);
              curtime=time()-current.world.lag;
              if (timer[4]>0) { 
                // repeat
                timer[1] = curtime + timer[4];
              } else {
                remove=true;        
                node.timers[i]=undefined;
              }
              // Restore original process state
              //process.suspended=suspended; ??
              process.timeout=timeout;
            } else if (timer) nexttime=min0(nexttime,timer[1]);
          });
        // 1.2. Timer destruction
        if (remove) 
          node.timers=
            Comp.array.filter(node.timers,function (timer) {
              return timer!=undefined;
            });
      }
      
      curtime=time()-current.world.lag;
      // Node service management (caches, TS)
      node.service(curtime);
      
      // 3. Agent process management
      for (pro in node.processes.table) {
        if (node.processes.table[pro]) {
          // 2.1 Agent execution
          curtime=time()-current.world.lag;
          process=node.processes.table[pro];
          // Io.out('scheduler: checking '+process.agent.id+': '+process.suspended+' '+process.timeout);
          if (process.suspended && process.timeout && process.timeout<=curtime) {
            // Io.out('scheduler: waking up '+process.agent.id);
            process.wakeup();
          }
          run += schedule(process);
          // 2.2 Agent destruction
          if (node.processes.table[pro] && node.processes.table[pro].kill) 
            node.unregister(node.processes.table[pro]);
          if (node.processes.table[pro] && process.suspended && process.timeout>0) 
            nexttime=min0(nexttime,process.timeout);
        }
      }
    }
    scheduled += run;
  }
  if (scheduled>0) return -scheduled;
  else if (nexttime>0) return nexttime;
  else return 0;
}

/*
** The time function can be changed, e.g., by simulators handling simulation
** steps instead of real time. Can be changed with Aios.config({time:fun}), 
** updating all Aios/aiosX references and CP as well.
*/
var time = function () {return Math.ceil(Date.now())};
  
var Aios = {
  aidgen:aidgen,
  aios:aios1,
  aios0:aios0,
  aios1:aios1,
  aios2:aios2,
  aios3:aios3,
  aiosEvents:aiosEvents,
  Amp:Amp,
  callback:undefined,
  clock:clock,
  collect:Ts.agent.collect,
  // External API: Change AIOS settings only using config!
  config:config,
  configGet:configGet,
  current:current,
  emit:emit,          // Emit event
  err: function (msg) {if (options.verbose) log('Error: '+msg)},
  fork:fork,
  kill:kill,
  killOn:killOn,
  lock:lock,
  loop:loop,
  log:log,            // Generic AIOS logging function
  logAgent:logAgent,  // Agent message logging (with details about current)
  logAIOS:logAIOS,    // AIOS logging function related with agent proecssing (with details about current)  
  logAIOSasync:logAIOSasync,    // AIOS logging function related with agent proecssing (with details about current)  
  logAsync:logAsync,  // AIOS logging function related with agent proecssing (with details about current) async  
  off:off,            // Remove event handler
  on:on,              // Add event handler
  options:options,
  print:Io.out,         // Low-level print IO function for agent messages via Aios.aiosX.log and internal Aios.log; 
                        // OR if printAgent is set only AIOS internal messages; can be modified by host app
  printAgent:undefined, // Low-level print IO function for agent messages only via Aios.aiosX.log; can be modified by host app
  printAsync:undefined, // Low-level print IO function for async callback messages by host app
  schedule:schedule,
  scheduled:scheduled,
  scheduler:scheduler,
  ticks:function (v) { if (v!=undefined) ticks=v; else return ticks},
  time:time,
  timeout:function (tmo) { return tmo>0?Aios.time()-current.world.lag+tmo:0 },  // Compute absolute time from relative timeout
  Chan:Chan,
  Code:Code,
  Json:Json,
  Mobi:Mobi,
  Name:Name,
  Node:Node,
  Proc:Proc,
  Sec:Sec,
  Sig:Sig,
  Simu:Simu,
  Ts:Ts,
  World:World,
  CB:CB,
  CP:CP,
  RT:RT,
  B:B,
  DIR:Mobi.DIR,
  I:I,
  L:L,
  warn: function (msg) {if (options.verbose>1) log('Warning: '+msg)},
  watchdog: undefined
}

// Builtin watchdog support by JS VM platform?
if (watchdog && watchdog.start) Aios.watchdog=watchdog;
if (watchdog && watchdog.init)  watchdog.init('WATCHDOG');
if (watchdog && watchdog.checkPoint) {
  // only partial watchdog support by platform
  aios0.CP=watchdog.checkPoint;
  aios1.CP=watchdog.checkPoint;
  aios2.CP=watchdog.checkPoint;
  aios3.CP=watchdog.checkPoint;
  Aios.CP=watchdog.checkPoint;
}

Conf.current(Aios);
Code.current(Aios);
Sig.current(Aios);
Sec.current(Aios);
Ts.current(Aios);
Proc.current(Aios);
Node.current(Aios);
World.current(Aios);
Mobi.current(Aios);
if (Simu) Simu.current(Aios);
Chan.current(Aios);
Json.current(Aios);

module.exports = Aios;
