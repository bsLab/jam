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
 **    $CREATED:     01-02-17 by sbosse.
 **    $VERSION:     1.18.18
 **
 **    $INFO:
 **
 **  SEJAM: JAM Agent Simluator
 **         + WEB/nw.js webix+ Anychart graphics.js GUI
 **         + Chat Dialog API (botui)
 **
 **    $ENDOFINFO
 */


var Comp = Require('com/compat');
var Io = Require('com/io');
var current=none;
var Aios = none;

var Papa    = Require('parser/papaparse.js');
var Esprima = Require('parser/esprima');
var Name    = Require('com/pwgen');
var Json    = Require('jam/jsonfn');
var util    = Require('util');
var JamAnal = Require('jam/analyzer');
var Db      = Require('db/dbS');
var DbQ     = Require('db/dbQ');
var SQLJSON = Require('db/sqljson');
var RTree   = Require('rtree/rtree');
var AiosXnet = Require('simu/aiosXnet');

var ml      = Require('ml/ml')
var nn      = Require('nn/nn')
var csp     = Require('csp/csp')
var sat     = Require('logic/sat')
var numerics = Require('numerics/numerics');

var nameopts = {
  world:{length:8, memorable:true, uppercase:true},
  node: {length:8, memorable:true, lowercase:true}
}

// Geometric Utiliy Functions
function sind(x) { return Math.sin(x/360*(2*Math.PI)) }
function cosd(x) { return Math.cos(x/360*(2*Math.PI)) }
function rotate(d,a) {
  return [
    int(d[0]*cosd(a)-d[1]*sind(a)),
    int(d[1]*sind(a)+d[0]*sind(a))
  ]
}
function distance2Rect (pos,bbox,scale) {
  if (!scale) scale={x:1,y:1};
  var px = pos.x,
      py = pos.y,
      x0 = bbox.x+bbox.w/2,
      y0 = bbox.y+bbox.h/2,
      dx = (Math.max(Math.abs(px - x0) - bbox.w / 2, 0))/scale.x,
      dy = (Math.max(Math.abs(py - y0) - bbox.h / 2, 0))/scale.y;

  return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2))
}
function distance (pos1,pos2,scale) {
  if (!scale) scale={x:1,y:1};
  var 
      dx = Math.abs(pos1.x - pos2.x) / scale.x,
      dy = Math.abs(pos1.y - pos2.y) / scale.y;

  return Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2))
}

var hrtime;

if (global.TARGET != "browser") hrtime = process.hrtime;
else {
  // polyfil for window.performance.now
  var performance = global.performance || {}
  var performanceNow =
    performance.now        ||
    performance.mozNow     ||
    performance.msNow      ||
    performance.oNow       ||
    performance.webkitNow  ||
    function(){ return (new Date()).getTime() }

  // generate timestamp or delta
  // see http://nodejs.org/api/process.html#process_process_hrtime
  hrtime = function (previousTimestamp){
    var clocktime = performanceNow.call(performance)*1e-3
    var seconds = Math.floor(clocktime)
    var nanoseconds = Math.floor((clocktime%1)*1e9)
    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0]
      nanoseconds = nanoseconds - previousTimestamp[1]
      if (nanoseconds<0) {
        seconds--
        nanoseconds += 1e9
      }
    }
    return [seconds,nanoseconds]
  }
}

/* construct bbox {x,y,w,h} from geometric data 
  {x,y,x0,y0,x1,y1,dx,dy,w,h,dir} relative
  to current position {x,y}
  optional bounds {x0,y0,x1,y1}
 
  +----->  x
  |      N            x,y--+
  |    W X E          |    |
  v      S            +--w,h
  
  y
 
*/

function makeBbox (pos,geo,bounds) {
  bbox={x:pos.x,y:pos.y,w:0,h:0} // {x,y,w,h}
  if (typeof geo == 'number') // radius around center pos
    return {x:pos.x-geo,y:pos.y-geo,w:2*geo+1,h:2*geo+1};
 
  if (geo.x)  bbox.x=geo.x;
  if (geo.y)  bbox.y=geo.y;
  if (geo.x0) bbox.x=geo.x0;
  if (geo.y0) bbox.x=geo.y0;
  if (geo.dx) bbox.x=pos.x+geo.dx;
  if (geo.dy) bbox.y=pos.y+geo.dy;
  if (geo.w)  bbox.w=geo.w;
  if (geo.h)  bbox.w=geo.h;
  if (geo.x1) bbox.w=geo.x1-bbox.x+1;
  if (geo.y1) bbox.h=geo.y1-bbox.y+1;
  if (geo.r) return {x:bbox.x-geo.r,y:bbox.y-geo.r,w:2*geo.r+1,h:2*geo.r+1};  
  if (geo.dir) switch (geo.dir) {
    // including current position X
    // Ex. WEST:
    // ****
    // ***X
    // ****
    case Aios.DIR.NORTH: 
      if (geo.distance) bbox.w=geo.spread||1,bbox.h=geo.distance+1;
      bbox.x -= int(bbox.w/2); bbox.y -= (bbox.h-1);  
      break;
    case Aios.DIR.SOUTH:
      if (geo.distance) bbox.w=geo.spread||1,bbox.h=geo.distance+1;
      bbox.x -= int(bbox.w/2);
      break;
    case Aios.DIR.WEST: 
      if (geo.distance) bbox.h=geo.spread||1,bbox.w=geo.distance+1;
      bbox.y -= int(bbox.h/2); bbox.x -= (bbox.w-1);  
      break;
    case Aios.DIR.EAST:
      if (geo.distance) bbox.h=geo.spread||1,bbox.w=geo.distance+1;
      bbox.y -= int(bbox.h/2);  
      break;
  }
  return bbox;
}

function bbox2pp(bbox) {
  return {x0:bbox.x,y0:bbox.y,x1:bbox.x+bbox.w-1,y1:bbox.y+bbox.h-1,
          dir:bbox.dir,distance:bbox.distance}
}
function pp2bbox(pp) {
  return {x:pp.x0,y:pp.y0,w:pp.x1-pp.x0+1,h:pp.y1-pp.y0+1}
}
/** Create a simulation world with visualization
 *
 * options: {config:object,id:string?,
 *           nolimits:boolean is a disable flag for agent check poininting,
 *           connection:{random:number?},markings?,
 *           fastcopy?,
 *           gui,
 *           log:function,
 *           msg:function,
 *           units? : {},
 *           format? : {node,agent,class,...} is logging format setting,
 *           classes:{node:{..},ac1:{..},..}}
 * with config: <geometrical world configuration>
 *
 */
var simu = function (options) {
  var self=this;
  var node1,node2,row,row1,row2,i,j,p;
  
  this.options=options||{};
  
  if (this.options.id==_) this.options.id=Name.generate(nameopts.world);
  if (this.options.connections==_) this.options.connections={};
  if (this.options.markings) this.options.nodebar=true;
  if (this.options.nolimits) Aios.config({nolimits:true});
  
  this.classes=this.options.classes||{};
  delete this.options.classes; 
  this.run=false;       // Simulator running
  this.stopped=false;   // Forced stop
  this.step=0;          // Step counter
  this.stepped=0;       // Remaining steps before stopping
  this.loop=none;
  this.time=0;          // Current simulation time
  this.time0=0;
  this.lag=0;           // Time lag between simulation runs
  this.events=[];
  this.parameter=options.parameter||{};
  this.verbose = options.verbose||0;
  Aios.config({verbose:this.verbose});
  
  this.cleanWorld=false;
  
  this.log=options.log; // Simulation messaging
  this.msg=options.msg; // Agent messaging
  Aios.config({print:options.log});
  // Aios.World.options.verbose=1;
  
  this.UI       = options.gui.UI;
  this.webix    = options.gui.webix;
  this.gui      = options.gui;
  this.simuPhy  = options.simuPhy;
  this.CANNON   = options.CANNON;
  
  this.stats = {
    agents:{},
    custom:{},
    cpu:0
  };
  
  // Caches
  this.cache = {
    agent2node:{}
  }
  
  // Region tree for resources
  this.rtree = RTree(10);
  
  this.err=function (msg,err) {
    self.log('Error: '+msg);
    throw (err||'[SIM] Error');
  }
  
  this.warn=function (msg) {
    self.log('Warning: '+msg);
  }
  
  this.out=function (msg) {
    self.log(msg);    
  }

  
  if (options.time!='real') 
    Aios.config({time:function () {
      return self.step;
    }}),this.log('Setting simulation clock to step time!') ;
  if (!options.format) this.options.format={}; // Agent logging format
  this.options.format.forEach(function (v,a) { Aios.config(v?{'log+':a}:{'log-':a})});
  this.out('[SIM] Logging flags: '+util.inspect(this.options.format));
  
  Aios.off('agent+');
  Aios.on('agent+',function (desc) {
    var aid,nid='node['+desc.node.id+']',
        visual,xn,yn,level=desc.node.position.z||0;
    if (desc.agent.ac && self.world.classes[desc.agent.ac]) {
      if (!self.stats.agents[desc.agent.ac]) self.stats.agents[desc.agent.ac]=0;
      self.stats.agents[desc.agent.ac]++; 
      aid='agent['+desc.agent.ac+':'+desc.agent.id+':'+desc.node.id+']';
      visual=self.world.classes[desc.agent.ac].visual;
      //self.out('Event register '+desc.agent.id+' of class '+desc.agent.ac+' on node '+desc.node.id+
      //         '('+self.gui.objects[nid].visual.x+','+self.gui.objects[nid].visual.y+')');
      if (visual) {
        xn=self.gui.objects[nid].visual.x+self.gui.objects[nid].visual.w/2;
        yn=self.gui.objects[nid].visual.y+self.gui.objects[nid].visual.h/2;
        if (visual.x!=undefined && visual.y!=undefined) {
          xn=xn+visual.x;
          yn=yn+visual.y;
        }
        if (visual.center && visual.center.x!=undefined && visual.center.y!=undefined) {
          xn=xn+visual.center.x;
          yn=yn+visual.center.y;
        }
        self.gui.objects[aid] = { 
          visual:{
            x:xn,
            y:yn,
            shape:visual.shape||'circle',
            w:visual.width,
            h:visual.height,
            fill:visual.fill,
            line:visual.line,
            level:level
          },
          obj:desc.agent,
          id:aid      
        };
        self.gui.drawObject(aid);        
      }
    } else {
    }
  });

  Aios.off('agent-');
  Aios.on('agent-',function (desc) {
    var aid='agent['+desc.agent.ac+':'+desc.agent.id+':'+desc.node.id+']';
    //self.out('Event unregister '+proc.agent.id+' on node '+node.id);
    self.gui.destroyObject(aid);
    if (self.cache.agent2node[desc.agent.id]) delete self.cache.agent2node[desc.agent.id];
    if (desc.proc.type=='physical' && desc.node.type=='physical' && self.world.getNode(desc.node.id)) {
      self.deleteNode(desc.node.id);
    }
  });

  Aios.off('signal+');
  Aios.on('signal+',function (proc,node,sig,arg,from) {
    var aid='agent['+proc.agent.ac+':'+proc.agent.id+':'+node.id+']',
        sid='signal['+proc.agent.ac+':'+proc.agent.id+':'+node.id+']',
        nid='node['+node.id+']',
        visual,level=node.position.z||0;
    // self.log(aid);
    if (self.model.classes[proc.agent.ac] && self.model.classes[proc.agent.ac].on) 
      visual=self.model.classes[proc.agent.ac].on[sig];
    if (visual) {
      xn=self.gui.objects[nid].visual.x+self.gui.objects[nid].visual.w/2;
      yn=self.gui.objects[nid].visual.y+self.gui.objects[nid].visual.h/2;
      if (visual.x && visual.y) {
        xn=xn+visual.x;
        yn=yn+visual.y;
      }
      self.gui.objects[sid] = { 
        visual:{
          x:xn,
          y:yn,
          shape:visual.shape||'circle',
          w:visual.width,
          h:visual.height,
          fill:visual.fill,
          line:visual.line,
          level:level,
          timeout:visual.time
        },
        obj:{sig:sig,arg:arg,from:from},
        id:sid      
      };
      self.gui.drawObject(sid);
      self.cleanWorld=true;
    }
    
  });
 
  // PRINT: Smart print function
  var print = function (msg,header,depth,nolog) {
    var lines=[];
    var line='';
    if (depth==_) depth=1;
    if (msg==undefined) msg='undefined';
    if (msg==null) msg='null';
    function isvec(obj) {return(Comp.obj.isArray(obj) && (obj.length == 0 || !Comp.obj.isArray(obj[0])))}
    function ismat(obj) {return(Comp.obj.isArray(obj) && obj.length > 0 && Comp.obj.isArray(obj[0]))}
    function mat(o,depth) {
        // matrix
        var lines=[];
        var line = '';
        if (header) {line=header; header=_};
        for (var j in o) {
          var row=o[j];
          line += Comp.printf.list(row,function (v) {
            return (Comp.obj.isArray(v)?(depth>0?'['+vec(v,depth-1)+']':'[..]'):
                                         Comp.obj.isObj(v)?(depth>0?obj(v,depth-1):'{..}'):v);
          });
          lines.push(line);
          line='';
        }    
        return lines;
    }
    function vec(v,depth) {
        // vector
        var lines=[];
        var line = '';
        if (header) {line=header; header=_};
        if (v.length==0) return(line+'[]');
        else {
          // can still contain matrix elements that must bes separated
          var sep='',sepi='';
          for (var p in v) {
            if (ismat(v[p])) {              
              //self.log.log(line); line='  ';
              if (depth>0) {
                lines = mat(v[p],depth-1);
                line += sep+'['; sepi='';
                Comp.array.iter(lines,function (line2) {
                  line += sepi+'['+line2+']';
                  sepi=',';
                });
                line += ']';
                sep=',';
              } else {
                line += sep+'[[..]]';
                sep=',';
              }
            }
            else if (isvec(v[p])) {
              //self.log.log(line); line='  ';
              line += sep+vec(v[p],depth-1);
              sep=',';
            }
            else {
              line += sep+(Comp.obj.isArray(v[p])?(depth>0?vec(v[p],depth-1):'[..]'):
                                                  Comp.obj.isObj(v[p])?(depth>0?obj(v[p],depth-1):'{..}'):v[p]);
              sep=',';
            }
          }
          if (line!='') return line;
        }
    }
    function obj(o,depth) {
      var line='';
      var sep='';
      if (header) {line=header; header=_};
      line += '{';
      for (var p in o) {
        if (!Comp.obj.isFunction(o[p])) {
          line += sep + p+':'+
            (Comp.obj.isArray(o[p])?(depth>0?vec(o[p],depth-1):'[..]'):
                                    Comp.obj.isObj(o[p])?(depth>0?obj(o[p],depth-1):'{..}'):o[p]);
          sep=',';
        } else {
          line += sep + p+':'+'function()';
          sep=',';
        }
      }      
      return line+'}';
    }
    
    function str(s) {
      var line='';
      var lines=[];
      var lines2 = Comp.string.split('\n',msg);
      if (header) {line=header; header=_};
      if (lines2.length==1)
        lines.push(line+msg);
      else {
        Comp.array.iter(lines2,function (line2,i) {
          if (i==0) lines.push(line+line2);
          else lines.push(line2);
        });
      } 
      return lines;
    }
    
    if (Comp.obj.isError(msg)) {
      if (header) {line=header; header=_};
      line += (/Error/.test(msg.toString())?msg.toString():'Error: '+msg.toString());
      lines.push(line);      
    } else if (ismat(msg)) lines = Comp.array.concat(lines,
                                              Comp.array.map(mat(msg,depth-1),function (line){
                                                  return '    '+line}));
    else if (Comp.obj.isString(msg)) lines = Comp.array.concat(lines,str(msg));
    else if (isvec(msg)) lines.push(vec(msg,depth-1));
    else if (Comp.obj.isObj(msg)) lines.push(obj(msg,depth-1));
    else {
      if (header) {line=header; header=_};
      line += msg;
      lines.push(line);      
    }
 
    if (nolog) return lines; else Comp.array.iter(lines,function (line) {self.msg(line)});    
  };
  
  var msg = function(){
    var header='';
    if (!current.node || !current.process) {
      print('[SIM] '+arguments[0]);
    }
    else if (arguments.length==1) {
      header='[';
      if (self.options.format.time) header += (Aios.time()+':');
      if (self.options.format.node) header += (current.node.id+':');
      header += (current.process.agent.id+':');
      if (self.options.format.pid) header += (current.process.pid+':');
      if (self.options.format.class) header += (current.process.agent.ac+'');
      header += '] ';
      print(arguments[0],header);
    } else {
      header='[';
      if (self.options.format.time) header += (Aios.time()+':');
      if (self.options.format.node) header += (current.node.id+':');
      header += (current.process.agent.id+':');
      if (self.options.format.pid) header += (current.process.pid+':');
      if (self.options.format.class) header += (current.process.agent.ac+'');
      header += '] ';
      for (var i in arguments) {
        if (i==0) 
          print(arguments[i],'['+current.node.id+':'+current.process.agent.id+':'+current.process.pid+':'+current.process.agent.ac+'] ');
        else
          print(arguments[i],_,2);
      }
    }
  };
  
  // Module extensions
  Aios.ml = ml.agent;
  Aios.aios1.ml = ml.agent;
  Aios.aios2.ml = ml.agent;
  Aios.aios3.ml = ml.agent;
  Aios.nn = nn.agent;
  Aios.aios1.nn = nn.agent;
  Aios.aios2.nn = nn.agent;
  Aios.aios3.nn = nn.agent;
  Aios.sat = sat.agent;
  Aios.aios1.sat = sat.agent;
  Aios.aios2.sat = sat.agent;
  Aios.aios3.sat = sat.agent;
  Aios.csp = csp.agent;
  Aios.aios1.csp = csp.agent;
  Aios.aios2.csp = csp.agent;
  Aios.aios3.csp = csp.agent;
  Aios.numerics = numerics.agent;
  Aios.aios1.numerics = numerics.agent;
  Aios.aios2.numerics = numerics.agent;
  Aios.aios3.numerics = numerics.agent;
  
  // Extended sandbox environment available for all agents
  Aios.aios0.log=msg;
  Aios.aios1.log=msg;
  Aios.aios2.log=msg;
  Aios.aios3.log=msg;

  Aios.err=function(_msg) {msg('[AIOS] Error: '+_msg)};
  Aios.aios0.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios1.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios2.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios3.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios0.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  Aios.aios1.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  Aios.aios2.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  Aios.aios3.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  //Aios.aios0.inspect=function(msg,depth) {return util.inspect(msg)};
  //Aios.aios1.inspect=function(msg,depth) {return util.inspect(msg)};
  //Aios.aios2.inspect=function(msg,depth) {return util.inspect(msg)};
  //Aios.aios3.inspect=function(msg,depth) {return util.inspect(msg)};
  Aios.aios3.sensors=function () {
    return Aios.aios0.copy(current.node.sensors);
  };
  Aios.aios0.Vec3=function(x,y,z) {return new self.CANNON.Vec3(x,y,z)};
  Aios.aios1.Vec3=function(x,y,z) {return new self.CANNON.Vec3(x,y,z)};
  Aios.aios2.Vec3=function(x,y,z) {return new self.CANNON.Vec3(x,y,z)};
  Aios.aios3.Vec3=function(x,y,z) {return new self.CANNON.Vec3(x,y,z)};
  
  Aios.config({iterations:1,fastcopy:options.fastcopy||false});
  
  if (!this.options.nolimits) Aios.config({TIMESCHED:1000});

  // Create the simulation world
  this.world = Aios.World.World([],{id:this.options.id,classes:this.classes});
  
  /* optional geographical (gps) or geometric (geo) mapping functions ({x,y,z}) -> {latitude,longitude,height}
  ** { gps2px, px2gps, geo2px, px2geo, gps2dist }
  ** Can be used for absolute or relative coordinate transformations ({delta:true}).
  */
  this.world.units = options.units||{gps2dist:function () {}};

  // old channel-based SQL DB connection
  this.db = {
    init: function (path,channel,callback) {
      var proc=current.process,stat;
      if (!self.Db) self.Db={};
      if (!self.Db[path]) {
        if (channel==undefined) {
          // embedded SQL
          self.Db[path]=DbQ.Sql(path);
          stat=self.Db[path].open();
          if (callback) proc.callback(callback,[stat]);
        } else {
          // remote SQL
          self.Db[path]=Db.Sqlc(path,channel);
          self.Db[path].setLog(function (msg) {self.log(msg)});
          self.Db[path].init(function (stat,err) {
            self.log('[DB] '+path+' Initialized: '+stat);            
            if (callback) proc.callback(callback,[stat,err]);
          });
        }
      } 
    },
    // function (path:string,matname:string,header:[$var:$type]|[$type], callback?)
    createMatrix: function (path,matname,header,callback) {
      var proc=current.process;
      if (callback) self.Db[path].createMatrix(matname,header,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);       
      }); else return self.Db[path].createMatrix(matname,header);
    },
    // function (path:string,matname:string,header:{$var:$type}, callback?)
    createTable: function (path,tblname,header,callback) {
      var proc=current.process;
      if (callback) self.Db[path].createTable(tblname,header,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);       
      }); else return self.Db[path].createTable(tblname,header);
    },
    drop: function (path,tbl,callback) {
      var proc=current.process;
      self.Db[path].drop(tbl,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);
      });
    },
    error: function (path) {
      return self.Db[path].error
    },
    exec: function (path,cmd,callback) {
      var proc=current.process;
      if (callback) self.Db[path].exec(cmd,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);
      }); else return self.Db[path].exec(cmd);
    },
    get: function (path,callback) {
      var proc=current.process;
      self.Db[path].get(undefined,function (row,err) {
        if (callback) proc.callback(callback,[row,err]);
      });
    },
    insert: function (path,tbl,row,callback) {
      var proc=current.process;
      self.Db[path].insert(tbl,row,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);
      });
    },
    insertMatrix: function (path,matname,row,callback) {
      var proc=current.process;
      if (callback) self.Db[path].insertMatrix(matname,row,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);
      }); else return self.Db[path].insertMatrix(matname,row);
    },
    insertTable: function (path,tblname,row,callback) {
      var proc=current.process;
      if (callback) self.Db[path].insertTable(tblname,row,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);
      }); else return self.Db[path].insertTable(tblname,row);
    },
    readMatrix: function (path,matname,callback) {
      var proc=current.process;
      if (callback) self.Db[path].readMatrix(matname,function (mat,err) {
        if (callback) proc.callback(callback,[mat,err]);
      }); else return self.Db[path].readMatrix(matname);
    },
    readTable: function (path,tblname,callback) {
      var proc=current.process;
      if (callback) self.Db[path].readTable(tblname,function (tbl,err) {
        if (callback) proc.callback(callback,[tbl,err]);
      }); else return self.Db[path].readTable(tblname);
    },
    select: function (path,tbl,vars,cond,callback) {
      var proc=current.process;
      if (!callback && Comp.obj.isFunction(cond)) callback=cond,cond=undefined;
      self.Db[path].select(tbl,vars,cond,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);
      });
    },
    writeMatrix: function (path,matname,matrix,callback) {
      var proc=current.process;
      if (callback) self.Db[path].writeMatrix(matname,matrix,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);
       }); else return self.Db[path].writeMatrix(matname,matrix);
    },
    writeTable: function (path,tblname,table,callback) {
      var proc=current.process;
      if (callback) self.Db[path].writeTable(tblname,table,function (stat,err) {
        if (callback) proc.callback(callback,[stat,err]);
       }); else return self.Db[path].writeTable(tblname,table);
    },
  }
  // New SQLJSOn RPC API
  this.sql = {
    init : function (url) {
      return SQLJSON.sql(url)
    },
  }
  
  // CSV file import/export
  this.csv = {
    read: function (file,callback,verbose) {
      var text,data,header,convert,proc=current.process;
      if (callback == true) convert=true,callback=null;
      if (verbose) self.log('CSV: Reading from '+file);
      try {
        text=Io.read_file(file);
        if (!text) throw 'CSV File read error: '+file;          
        if (verbose) self.log('CSV: Parsing '+file);
        Papa.parse(text,{
          skipEmptyLines: true,
          dynamicTyping: true,          
          complete: function(results) {
            if (verbose) self.log('CSV parsed with DEL="'+results.meta.delimiter+'" TRUNC='+results.meta.truncated+
                                  ' ABORT='+results.meta.aborted);
            if (callback) proc.callback(callback,[results.data]);
            data=results.data;
          }
        });
        if (convert) { // first line must be header
          header=data.shift();
          data=data.map(function (row) {
            var r={};
            header.forEach(function (col,i) { r[col]=row[i] });
            return r; 
          }) 
        }
        return data;
      } catch (e) {
        if (callback) callback(e);
        return e;
      }
    },
    write: function (file,header,data,callback,verbose) {
      if (file[0]!='/') file=self.gui.workdir+'/'+file;
      var d1=false,fd,i,convert=!Comp.obj.isArray(data[0])&&Comp.obj.isObj(data[0]),
          sep=',',proc=current.process;
      if (typeof callback == 'string') sep=callback,callback=null;
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
        if (verbose) self.log('CSV: Writing to '+file);
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
        if (callback) proc.callback(callback,[data.length]);
        return data.length
      } catch (e) {
        if (callback) proc.callback(callback,[e]); 
        return e;
      }      
    }
  };



  /* utils */
  function within(p1,p2,r) {
    return (p1.x>= p2.x-r && p1.x <= p2.x+2) &&
           (p1.y>= p2.y-r && p1.y <= p2.y+2)
  } 
  function whatType(what) {
    // agent-twin => agent
    var tokens = what.match(/([a-z]+)(-.+)/)
    return tokens?tokens[1]:what;
  }  
  function whatName(what) {
    // agent-twin => twin
    var tokens = what.match(/[a-z]+-(.+)/)
    return tokens?tokens[1]:null;
  }
  // Generic simulator interface
  var aiosXsimu = {
    changeVisual: function (id,visual) {
      self.gui.changeObject(id,visual);
    },
    
    chat : {
      agent : self.gui.chatAgent,
      message: self.gui.chatMessage,
      question : function (id, question, action, timeout, callback) {
        var process = Aios.current.process;
        self.gui.chatQuestion (id, question, action, function (res) {
          process.callback(callback,res?[res.value]:null);
          process.wakeup();
        },timeout);
        process.suspend(Aios.timeout(timeout));
      },
      script: self.gui.chatScript,
    },
    
    clear: function (msg,log) {
      if (msg) {
        self.gui.clear('msgWin');
        self.gui.messages=[];
      }
      if (log) self.gui.clear('logWin');
    },
    
    /*
    ** typeof arguments = {nodeclass:string|function,arg1,arg2,...}
    ** arguments arg1,.. are node constructor function arguments
    ** if nodeclass is a string then a function of model.nodes.<nodeclass>(arg1,arg2,..) or
    ** model.world.nodes is used
    ** returns node identifier
    */
    createNode: function () {
      var nodes = (self.model.world && self.model.world.nodes) ||
                   self.model.nodes,res,
                   cls=typeof arguments[0] == 'string'?arguments[0]:'function';
      function shift(args) {
        var i=0,p;
        for(p in args) {
          if (p=='0') continue;
          args[i]=args[p];
          i++;
        }
        return args;
      }
      if (nodes) {
        var constrFun;
        if (Comp.obj.isFunction(arguments[0])) constrFun=arguments[0];
        else constrFun=nodes[arguments[0]];
        if (constrFun && Comp.obj.isFunction(constrFun)) {
          var desc=constrFun.apply(null,shift(arguments));
          if (desc) {
            if (res=self.checkVisual(desc.visual)) throw 'Invalid node ('+cls+') visual: '+res;
            return self.createNode(desc,true);
          }
        } else self.log('createNode: unknown node class '+arguments[0])
      } else self.log('createNode: no node constructors defined (expected model.world.nodes or model.nodes')
    },
    
    /*
    ** Create an agent on specified node
    */
    createOn:function (nid,ac,args,level) {      
      var node=self.world.getNode(nid),      
          proc=none;
      if (!node) return none;
      if (level==undefined) level=1;
      if (args==undefined) args=[{}];
      if (self.world.classes[ac])
        agent = Aios.Code.createOn(node,self.world.classes[ac][level],args,level,ac);
      else 
        self.err('createOn: no such class '+ac);
      if (agent) 
        return agent.agent.id; 
      else return none;
    },
    
    deleteNode: function (nodeid) {
      self.deleteNode(nodeid);
    },
    
    event: {
      add: function (ev) {
        self.events.push({step:self.step,node:current.node.id,event:ev});
      },
      get: function () {
        var evl = self.events;
        self.events=[];
        return evl;
      }
    },
    
    get : function (p) {
      switch (p) {
        case 'delay': return self.delay;
      }
    },
    
    // Return node object (if id is a regular expression, an array of matching nodes)
    getNode:function (id) {
      return self.world.getNode(id);
    },
    
    getVisual: function (id) {
      return self.gui.getObject(id).visual;
    },
    
    getStats: function (target,arg) {
      var i,j,proc,node,p,
          stats;
      switch (target) {
        case 'node':
          node=self.world.getNode(arg);
          if (node) stats=node.stats;
          break;
        default:
          stats={steps:self.step,time:Aios.time(),agents:{},agentsN:self.stats.agents,total:0,nodes:0,
                 create:0,migrate:0,fork:0,fastcopy:0,signal:0,
                 send:0,
                 cpu:self.stats.cpu,
                 custom:{}}
          for(p in self.stats.custom) stats.custom[p]=self.stats.custom[p];
          if (!self.world || !self.world.nodes) return {};
          for (i in self.world.nodes) {        
            node=self.world.nodes[i];  
            if (!node) continue;
            stats.nodes++;
            for (p in node.stats) stats[p] += node.stats[p];
            for(j in node.processes.table) {
              proc=node.processes.table[j];
              if (proc && proc.agent.ac) {
                if (stats.agents[proc.agent.ac]==undefined) stats.agents[proc.agent.ac]=0;
                stats.agents[proc.agent.ac]++;
                stats.total++;
              }
            }
            for(p in node.connections) {
              if (node.connections[p] && node.connections[p].count)
                stats.send += node.connections[p].count();
            }
          }
          break;
      }
      return stats;
    },
    
    getSteps:function () {return self.step},
    
    // Load JSON object from file
    load : function (file) {
      var json;
      if (global.config.os=='win32' && global.config.win) {
        json = Io.read_file('Z:'+self.gui.lastdir+'\\'+file);
        self.gui.log('Z:'+self.gui.lastdir+'\\'+file) 
      } else if (global.config.os=='win32') {
        json = Io.read_file(self.gui.lastdir+'\\'+file);
        self.gui.log(self.gui.lastdir+'\\'+file) 
      } else if (global.TARGET != 'browser') {
        json = Io.read_file(self.gui.lastdir+'/'+file);
        self.gui.log(self.gui.lastdir+'/'+file) 
      } else {
        json = loadFile(file);
        self.gui.log(file)       
      }
      if (json) return aiosXsimu.ofJSON(json);      
    },
    
    log: function (msg) {
      self.gui.log(msg);
    },
    
    inspect : util.inspect,
    
    model : function (name) {
      return self.model;
    }, 
    message:this.gui.message,
    // relative move dx,dy,dz with|w/o units m | \B0 ..
    
    move: self.moveObject.bind(this),
    // absolute move to x,y,z with|w/o units m | \B0 ..
    
    moveTo: self.moveObjectTo.bind(this),
   
    network: {
      x:this.options.x,
      y:this.options.y,
      z:this.options.z
    },
    
    ofJSON: function (s) {
      return Aios.Code.Jsonf.parse(s,{})
    },
    
    options:this.options,
    
    parameter: function (name) {
      return name?self.parameter[name]:self.parameter;
    }, 
    
    position: function () { return current.node.position },
    
    print:print,
    
    // Save object to  JSON file
    save : function (file,o) {
      var json = aiosXsimu.toJSON(o),res;
      if (global.config.os=='win32' && global.config.win) 
        res = Io.write_file('Z:'+self.gui.lastdir+'\\'+file,json);
      else if (global.config.os=='win32')
        res = Io.write_file(self.gui.lastdir+'\\'+file,json);      
      else
        res = Io.write_file(self.gui.lastdir+'/'+file,json);

      return res
    },
    
    // Set simulation control parameter and GUI control
    set : function (p,v) {
      var old;
      switch (p) {
        case 'delay': old=self.delay; self.delay=v; break;
        case 'window':
          if (Comp.obj.isObj(v)) for(var o in v) {
            console.log(o,v[o])
            switch (o) {
              case 'layout':
                if (v[o]=='auto') {
                  var _locked=self.gui.toolbar.locked;            
                  self.gui.toolbar.locked=false;
                  self.gui.autoLayout();
                  self.gui.toolbar.locked=_locked;
                }
                break;
              case 'Inspector': 
              case 'inspector': 
                if (self.gui.inspectorWin[v[o]]) self.gui.inspectorWin[v[o]]();
                break;
              case 'Chat': 
              case 'chat': 
                if (self.gui.chatWin[v[o]]) self.gui.chatWin[v[o]]();
                if (v[o]=='show') self.gui.chatInit();
                break;
              case 'World':
              case 'world':
                if (self.gui.worldWin.container) self.gui.worldWin.container.resume()
                if (v[o]['zoom'] && v[o]['zoom']=='fit') self.gui.worldWin.zoomFit();
                break;
            }
          } 
          break;
      }
      return old;
    },
    
    start: function (steps) { self.start(steps,true)},
    
    stat: function (p,v) {
      self.stats.custom[p]=v;
    },
    
    stop: function () { return self.stop(true) },
    // Use simulation time (steps) instead of system time
    
    toJSON: function (o) {
      return Aios.Code.Jsonf.stringify(o)
    },
    
    time : function () {return self.step},
    
    utime: function () { 
      hr=hrtime(); return hr[0]*1E9+hr[1] 
    },
  };

  aiosXsimu.csv = this.csv;
  aiosXsimu.db = this.db;
  aiosXsimu.sql = this.sql;
  aiosXsimu.units = this.world.units;
  
  // Simulation extension for phyiscal (behaviorual) agents
  var aiosXnet = AiosXnet.call(self,aiosXsimu,Aios);
  
  // if (this.simuPhy) ..
  // always set-up API for optional physical simulation
  //  -> simuPhy will be usually created AFTER simuWeb!
  aiosXsimu.simuPhy = aiosXsimu.phy = {
      changeScene: function (scene,options) {
        if (!self.simuPhy) return;
        self.simuPhy.changeScene(scene,options);        
      },
      get : function (id) {
        var tokens,
            obj;
        if (!self.simuPhy) return;
        tokens =  (id||Aios.current.node.id).split(',');
        obj = self.simuPhy.get(tokens.map(function (s) {return Number(s)}));
        return obj;
      },
      refresh: function () {
        if (!self.simuPhy) return;
        self.simuPhy.refresh();        
      },
      step: function (n,callback) {
        if (!self.simuPhy) return;
        return self.simuPhy.step(n,callback);
      },
      stepPhyOnly: function (n,callback) {
        if (!self.simuPhy) return;
        self.simuPhy.stepPhyOnly(n,callback);
      }
    };
    
  // Extend corefuncs in JAM analyzer ...
  // MUST BE COMPLETE - else analyzer fails!
  JamAnal.extend({
    // keep consistent with aiosXnet.js API
    net : {
      obj : {
        ask:{argn:[2,3]},    
        create:{argn:[2,3]},
        die:{argn:[0,1]},
        forward:{ argn:[0,1]},
        get:{argn:1},
        globals:{argn:0},
        group : { obj : {
          add: {argn:[2,3] },
          rm: {argn:2 }
        }},
        set:{argn:2},
        setxy:{argn:2},
        turn:{ argn:1},
        within:{ argn:2},
      }
    },
    simu:{
      obj:{
        chat : {
          obj : {
            agent:{argn:1},
            message:{argn:2},
            question:{argn:5},
            script:{obj:{
              init:{argn:2},
              next:{argn:0},
              cancel:{argn:0},
              reset:{argn:0}
            }}
          }
        },
        changeVisual:{argn:2},
        clear:{argn:[0,1,2]},
        createNode:{argn:[1,2,3,4,5,6,7,8,9]},
        createOn:{argn:[2,3,4]},
        csv:{ obj:{
          read:{argn:[1,2,3]},
          write:{argn:[2,3,4]},
        }},
        db: { obj :{
          error:{argn:1},
          init:{argn:3},
          createMatrix:{argn:[2,3]},
          createTable:{argn:[2,3]},
          drop:{argn:[2,3]},
         insert:{argn:[3,4]},
        }},
        deleteNode:{argn:1},
        event:{obj:{add:{argn:1},get:{argn:0}}},
        get:{argn:1},
        getNode:{argn:1},
        getStats:{argn:0},
        getSteps:{argn:0},
        inspect:{argn:[1,2,3,4,5,6,7,8,9]},
        load:{argn:1},
        log:{argn:1},
        message:{argn:1},
        model:{argn:0},
        ofJSON: {argn:1},
        parameter:{argn:0},
        position : {argn:0},
        phy : {
          obj : {
            changeScene:{argn:2},
            get:{argn:1},
            refresh:{argn:0},
            step:{argn:[1,2]},
            stepPhyOnly:{argn:[1,2]},
          }
        },
        save:{argn:2},
        set: {argn:2},
        simuPhy : {
          obj : {
            changeScene:{argn:2},
            get:{argn:1},
            refresh:{argn:0},
            step:{argn:[1,2]},
            stepPhyOnly:{argn:[1,2]},
          }
        },
        sql : {
          init : {argn:1},
        },
        start: {argn:1},
        stat: {argn:2},
        stop: {argn:0},
        toJSON: {argn:1},
        time: {argn:0},
        units: {obj:{gps2dist:{argn:2}}},
        utime:{argn:0},
      }
    }
  });
  
  // Extended sandbox environment available for all agents in simulation
  this.aiosX = aiosXsimu;
  // Aios.aios0.simu=this.aiosX;
  // Aios.aios1.simu=this.aiosX;
  Aios.aios2.simu=this.aiosX;
  Aios.aios3.simu=this.aiosX;
  // only immobile level-3 phyiscal agents (on mobile nodes) can use the net API
  Aios.aios3.net=aiosXnet;

  if (options.aios) {
    // Extend AIOS environment(s)
    for (p in options.aios) {
      if (!Aios.aios0[p]) Aios.aios0[p]=options.aios[p];
      if (!Aios.aios1[p]) Aios.aios1[p]=options.aios[p];
      if (!Aios.aios2[p]) Aios.aios2[p]=options.aios[p];
      if (!Aios.aios3[p]) Aios.aios3[p]=options.aios[p];
    }
  }
  if (options.aios0) {
    // Extend AIOS environment(s)
    for (p in options.aios0) {
      if (!Aios.aios0[p]) Aios.aios0[p]=options.aios[p];
    }
  }
  if (options.aios1) {
    // Extend AIOS environment(s)
    for (p in options.aios1) {
      if (!Aios.aios1[p]) Aios.aios1[p]=options.aios[p];
    }
  }
  if (options.aios2) {
    // Extend AIOS environment(s)
    for (p in options.aios2) {
      if (!Aios.aios2[p]) Aios.aios2[p]=options.aios[p];
    }
  }
  if (options.aios3) {
    // Extend AIOS environment(s)
    for (p in options.aios3) {
      if (!Aios.aios3[p]) Aios.aios3[p]=options.aios[p];
    }
  }
  this.delay=0;
   
  this.out('[SIM] Simulation created.');
}


simu.prototype.analyze=JamAnal.jamc.prototype.analyze;
simu.prototype.syntax=JamAnal.jamc.prototype.syntax;

/** Add an agent template class
 *
 */
simu.prototype.addClass = function (constructor,name,visual) {
  var self=this,
      modu, 
      content,
      off,
      syntax,
      regex1,
      env={},
      interface,
      p,      
      text;
        
  try {
    content = 'var ac = '+constructor;
    this.out('Parsing agent class template "'+name+'" ...');
    syntax = Esprima.parse(content, { tolerant: true, loc:true });
    if (syntax.errors && syntax.errors.length>0) {
      throw syntax.errors[0];
    }
    interface=this.analyze(syntax,{classname:name,level:3,verbose:1,err:function (msg) { self.out(msg); throw msg}});
    this.out('Agent class template "'+name+'" analyzed successfully.');
    text=Json.stringify(constructor);
    // regex1= /this\.next=([a-zA-Z0-9_]+)/;
    // text=text.replace(regex1,"this.next='$1'");
    // console.log(text);
    for (p in interface.activities) env[p]=p;
    with (env) { eval('constructor='+text) };
    this.out('Agent class template "'+name+'" compiled successfully.');
    this.out('Adding agent class constructor "'+name+'" ...');
    this.world.classes[name]=[
      Aios.Code.makeSandbox(constructor,0,env),
      Aios.Code.makeSandbox(constructor,1,env),
      Aios.Code.makeSandbox(constructor,2,env),
      Aios.Code.makeSandbox(constructor,3,env)
    ];
    this.world.classes[name].visual=visual;
  } catch (e) {  
     this.out('Agent class template "'+name+'" not compiled successfully: '+e);
     this.gui.message(e);
     if (this.verbose>1) this.out(Io.sprintstack(e));
  }
  
};

/** Check coordinates in boundaries of the current world
 *
 */
simu.prototype.checkBounds = function (x,y,z) {
  if (x < 0 || y  < 0) return false;
  if (this.options.x && x >= this.options.x) return false;
  if (this.options.y && y >= this.options.y) return false;
  return true;
}

simu.prototype.checkVisual =  function (v) {
  if (!v) return 'missing visual';
  if (['circle','rect','icon'].indexOf(v.shape)<0) return 'invalid shape';
}

/** Convert coordinates from one unit system to another
 *
 */
simu.prototype.convertUnit = function (p,from,to) {
  if (Comp.obj.isString(p)) {
    // Convert to px (delta only)
    if (Comp.string.endsWith(p,'m')) 
      return this.world.units.geo2px({delta:true,X:Comp.string.prefix(p,'m')}).x;
    else if (Comp.string.endsWith(p,'\B0')) 
      return this.world.units.gps2px({delta:true,longitude:Comp.string.prefix(p,'\B0')}).x
    else if (Comp.string.endsWith(p,'px')) 
      return Number(Comp.string.prefix(p,'px'));
    else Number(p);
  } else switch (from) {
    case 'px':
      switch (to) {
        case 'px':
          return p;
        case 'm':
          if (this.world.units.px2geo) return this.world.units.px2geo(p);
          break;
        case '\B0':
          if (this.world.units.px2gps) return this.world.units.px2gps(p);
          break;
      }
      break;
    case 'm':
      switch (to) {
        case 'px':
          if (this.world.units.geo2px) return this.world.units.geo2px(p);
          break;
        case 'm':
          return p;
        case '\B0':
          if (this.world.units.geo2gps) return this.world.units.geo2gps(p);
          break;
      }
      break;
    case '\B0':
      switch (to) {
        case 'px':
          if (this.world.units.gps2px) return this.world.units.gps2px(p);
          break;
        case 'm':
          if (this.world.units.gps2geo) return this.world.units.gps2geo(p);
          break;
        case '\B0':
          return p;
      }
      break;
  }
}

/** Create a regular (or irregular) 2d mesh grid of nodes and connections.
 *  type of options = {width: number as node width in pixel,
                       height: number as node heigth in pixel,
                       rows:number,cols:number,level?:number,
                       node : { visual },
                       port?, link?,
                       map?,
                       connections?}
 */
simu.prototype.createMeshNetwork = function (model) {
  var self=this,
      options=model.world.meshgrid;
  if (!options.node) return this.out('Incomplete meshgrid model!');
  var margin_x = options.node.visual.width/2,
      margin_y = options.node.visual.height/2,
      space_x = options.node.visual.width/2,
      space_y = options.node.visual.height/2,      
      off_x = options.off_x||5,
      off_y = options.off_y||5,
      xn,yn,x,y,w,h,p,obj,obj2,link,
      node,world,node1,node2,place,port,ports={},
      id,i,j,k,level=0,dim=2,
      xMoff=0,yMoff=0;

  if (options.levels) dim=3;
  if (!options.matrix) this.gui.level=this.gui.level.map(function (x,i) {
    return i==0?1:0;
  }); else this.gui.level=this.gui.level.map(function (x,i) {
    return 1;
  }); 
  this.gui.level[-1]=1;
  
  this.out('Creating meshgrid network with '+options.rows+
           ' rows and '+options.cols+
           ' columns on '+(options.levels?options.levels:1)+
           ' levels.'); 

  this.options.x=options.cols;
  this.options.y=options.rows||0;
  this.options.z=options.levels||0;

  function makeRef(o) {return o};
  function vec2str(vec) { 
    if (self.options.z) return vec.join(',');
    else if (self.options.y) return vec.slice(0,2).join(',');
    else return vec[0] }
  
  for(level=0;level<(options.levels?options.levels:1);level++) {
    if (options.matrix && options.matrix[level]) {
      xMoff=options.matrix[level][0];
      yMoff=options.matrix[level][1];
    }           
    // 1. Nodes     
    for(j=0;j<options.rows;j++) {
      for(i=0;i<options.cols;i++) {
        if (options.node.filter && !options.node.filter([i,j,level])) continue; 
        id=vec2str([i,j,level]);
        node=Aios.Node.Node({id:id,
                             position:{x:i,y:j,z:(dim==3?level:undefined)},
                             TMO:self.options.TMO||1000000
                            });
        id='node['+id+']';
        this.world.addNode(node);
        if (this.verbose>1) this.log('[SIM] Created node '+node.id);
        xn=off_x+margin_x+i*(options.node.visual.width+space_x)+xMoff;
        yn=off_y+margin_y+j*(options.node.visual.height+space_y)+yMoff;
        this.gui.objects[id] = { visual:{
            x:xn,
            y:yn,
            shape:options.node.visual.shape||'rect',
            w:options.node.visual.width,
            h:options.node.visual.height,
            fill:options.node.visual.fill,
            line:options.node.visual.line,
            level:level    
          },
          obj:makeRef(node),
          id:id
        }
      }
    }
    
    // 2. Link ports of nodes
    if (options.port && options.port.place) {
      for(i in this.world.nodes) {
        node=this.world.nodes[i];
        id='node['+node.id+']';
        obj=this.gui.objects[id];
        place=options.port.place(node);
        if (place && obj) {
            for(j in place) {
              xn=obj.visual.x+place[j].x-options.port.visual.width/2+obj.visual.w/2;
              yn=obj.visual.y+place[j].y-options.port.visual.height/2+obj.visual.h/2;
              id='port['+node.id+':'+place[j].id+']';
              if (!ports[node.id]) ports[node.id]={};
              obj2={node:makeRef(node)};
              ports[node.id]['DIR.'+place[j].id]=obj2;
              this.gui.objects[id] = { visual:{
                  x:xn,
                  y:yn,
                  shape:options.port.visual.shape||'rect',
                  w:options.port.visual.width,
                  h:options.port.visual.height,
                  fill:options.port.visual.fill,
                  line:options.port.visual.line,
                  level:obj.visual.level
                },
                obj:obj2,
                id:id
              }
            }

        }
      }
    }
    // 3. Links between nodes
    // Only nodes having ports can be connected by links!
    if (options.link) {
      function port(i,j,k,dir) {
        var p=ports[vec2str([i,j,k])];
        if (!p) return false;
        return p[dir];
      }
      function setPort(i,j,k,dir,link) {
        var p=ports[vec2str([i,j,k])];
        if (!p) return ;
        p[dir].link=link;
      }
      for(k=0;k<(options.levels?options.levels:1);k++) {           
        if (options.matrix && options.matrix[k]) {
          xMoff=options.matrix[k][0];
          yMoff=options.matrix[k][1];
        }           
        for(j=0;j<options.rows;j++) {
          for(i=0;i<options.cols;i++) {      
            if (options.node.filter && !options.node.filter([i,j,k])) continue; 
            xn=off_x+xMoff+margin_x+i*(options.node.visual.width+space_x);
            yn=off_y+yMoff+margin_y+j*(options.node.visual.height+space_y);
            if ((i+1)<options.cols) {
              if (!options.link.connect || 
                   options.link.connect([i,j,k],[i+1,j,k])) {
                node1=self.world.getNode(vec2str([i,j,k]));
                node2=self.world.getNode(vec2str([i+1,j,k]));
                if (port(i,j,k,Aios.DIR.EAST) && port(i+1,j,k,Aios.DIR.WEST) && node2) {
                  link=this.world.connect(Aios.DIR.EAST,node1,node2);
                  setPort(i,j,k,Aios.DIR.EAST,link);
                  setPort(i+1,j,k,Aios.DIR.WEST,link);
                  id='link['+vec2str([i,j,k])+','+vec2str([i+1,j,k])+']';
                  w=margin_x;
                  h=options.link.visual.width||2;   
                  x=xn+options.node.visual.width;
                  y=yn+space_y-h/2;
                  this.gui.objects[id] = {visual:{
                    x:x,
                    y:y,
                    shape:options.link.visual.shape||'rect',
                    w:w,
                    h:h,
                    fill:options.link.visual.fill,
                    line:options.link.visual.line,
                    level:k    
                  },obj:{node1:node1,node2:node2},id:id}
                }
              }
            } 
            if ((j+1)<options.rows) {
              if (!options.link.connect || 
                   options.link.connect([i,j,k],[i,j+1,k])) {
                node1=self.world.getNode(vec2str([i,j,k]));
                node2=self.world.getNode(vec2str([i,j+1,k]));
                if (port(i,j,k,Aios.DIR.SOUTH) && port(i,j+1,k,Aios.DIR.NORTH) && node2) {
                  link=this.world.connect(Aios.DIR.SOUTH,node1,node2);
                  setPort(i,j,k,Aios.DIR.SOUTH,link);
                  setPort(i,j+1,k,Aios.DIR.NORTH,link);
                  id='link['+vec2str([i,j,k])+','+vec2str([i,j+1,k])+']';
                  w=options.link.visual.width||2;          
                  h=margin_x;
                  x=xn+space_x-w/2;
                  y=yn+options.node.visual.height;
                  this.gui.objects[id] = {visual:{
                    x:x,
                    y:y,
                    shape:options.link.visual.shape,
                    w:w,
                    h:h,
                    fill:options.link.visual.fill,
                    line:options.link.visual.line,
                    level:k    
                  },obj:{node1:node1,node2:node2},id:id}
                }
              }
            } 
          }
        }
      }
      for(k=0;k<(options.levels?options.levels-1:0);k++) {           
        for(j=0;j<options.rows;j++) {
          for(i=0;i<options.cols;i++) {      
            if (options.node.filter && !options.node.filter([i,j,k])) continue; 
            xn=off_x+margin_x+i*(options.node.visual.width+space_x);
            yn=off_y+margin_y+j*(options.node.visual.height+space_y);
            if (!options.link.connect || 
                 options.link.connect([i,j,k],[i,j,k+1])) {
                if (!port(i,j,k,Aios.DIR.UP) || !port(i,j,k+1,Aios.DIR.DOWN)) continue;
                node1=self.world.getNode(vec2str([i,j,k]));
                node2=self.world.getNode(vec2str([i,j,k+1]));
                if (!node2) continue;
                link=this.world.connect(Aios.DIR.UP,node1,node2);
            }
          }
        }
      }
    }
  }
  // 4. World
  if (!model.world.map && !model.world.nodes) {
    id='world';
    node=Aios.Node.Node({id:id,
                         position:{},
                         TMO:self.options.TMO||1000000
                        });
    this.world.addNode(node);
    if (this.verbose>1) this.log('[SIM] Created node '+node.id);
    id='node['+id+']';
    this.gui.objects[id] = {visual:{
              x:margin_x+off_x+xn+space_x*1.5-4,
              y:margin_y+off_y+yn+space_y*1.5-4,
              shape:'rect',
              w:margin_x,
              h:margin_y,
              fill:(options.world&&options.world.visual&&options.world.visual.fill)||{color:'black'},
              line:(options.world&&options.world.visual&&options.world.visual.line)||{width:2}
            },obj:this.world,id:id};
    id='world-anchor';
    this.gui.objects[id] = {visual:{
              x:off_x+1,
              y:off_y+1,
              shape:'rect',
              w:margin_x+xn+space_x*1.5,
              h:margin_y+yn+space_y*1.5,
              line:(options.world&&options.world.visual&&options.world.visual.line)||{width:1,color:'#BBB'}
            },obj:this.world,id:id};
  }
}

/** Create a node in the simulation world
 *
 */
simu.prototype.createNode = function (desc,drawnow) {
  var self=this,id,index,
      node,nodeid,port,pos,drawpos,xn,yn,x,y,p,options,chan,addr;
  
  desc.id=desc.id.replace(/\$WORLD/,this.world.id);
  
  function makeRef(x) {return x};
  if (desc.id == undefined) 
    throw 'createNpde: Invalid node descriptor, missing id attribute';
  if (desc.gps) {
    pos=self.world.units.gps2px(desc.gps);
    desc.x=pos.x; desc.y=pos.y; desc.z=pos.z;
  } else if (desc.geo) {
    pos=self.world.units.m2px(desc.geo);
    desc.x=pos.x; desc.y=pos.y; desc.z=pos.z;
  }
  if (desc.x == undefined || desc.y == undefined) 
    throw 'createNode: Invalid node descriptor, missing coordinates';
  
  id = 'node['+desc.id+']';
  if (this.gui.objects[id]) 
    throw 'createNode: Node '+desc.id+' exists already!';
  pos = {x:desc.x,y:desc.y};
  // Patch world model?
  if (desc.gps) pos.gps=desc.gps;
  if (desc.geo) pos.geo=desc.geo;

  node=Aios.Node.Node({id:desc.id,position:pos});
  nodeid=node.id;
  if (desc.location) node.location=desc.location;
  this.world.addNode(node);
  if (this.verbose>1) this.log('[SIM] Created node '+node.id);
  xn=this.world2draw(desc).x+checkOption(desc.visual.center && desc.visual.center.x,0);
  yn=this.world2draw(desc).y+checkOption(desc.visual.center && desc.visual.center.y,0);
  
  if (Comp.obj.isString(desc.visual.width)) desc.visual.width=this.convertUnit(desc.visual.width);
  if (Comp.obj.isString(desc.visual.height)) desc.visual.height=this.convertUnit(desc.visual.height);
  if (Comp.obj.isString(desc.visual.radius)) desc.visual.width=desc.visual.height=this.convertUnit(desc.visual.radius)*2;
  this.gui.objects[id] = { 
    visual:{
      x:xn,
      y:yn,
      shape:desc.visual.shape||'rect',
      icon:desc.visual.icon,
      w:desc.visual.width,
      h:desc.visual.height,
      fill:desc.visual.fill,
      line:desc.visual.line,
      align:desc.visual.shape=='circle'?'center':desc.visual.align,
    },
    obj:makeRef(node),
    id:id  
  };
  
  if (desc.visual.label) {
    self.gui.objects['label['+desc.id+']'] = {
      visual:{
        x:xn,
        y:yn-5-(desc.visual.label.fontSize||24),
        shape:'text',
        fontSize:desc.visual.label.fontSize||24,
        color:desc.visual.label.color,
        text:desc.visual.label.text||desc.visual.label,
      },id:'label['+desc.id+']'
    }
    if (drawnow) this.gui.drawObject('label['+desc.id+']');
  }
  if (drawnow) this.gui.drawObject(id);
  
  
  // Node virtual and physical communication ports
  if (desc.port) {
    // backward compatibility
    if (Comp.obj.isArray(desc.port))
      desc.ports = desc.port; 
    else 
      desc.ports = [desc.port];  
  }
  if (desc.ports) for (index in desc.ports) {  
    port=desc.ports[index];
    if (!port) continue;
    // Create a virtual link port object
    switch (port.type) {
      case 'multicast':
        chan = (function (port) {
          var chan = {
            _connected:[],
            _count:0,
            _state:true,
            
            count:function () {return chan._count},
            /** Send agent snapshot to destination node.
             *  'dest' must be a node identifier!
             */
            /* OLDCOMM send: function (data,dest,current) { */
            /* NEWCOMM */
            send: function (msg) {
              var node;
              if (!chan.status()) return;
              if (Comp.array.contains(chan._connected,msg.to /*dest*/)) {
                node=self.world.getNode(msg.to /*dest*/);
                if (!node) return;
                if (msg.agent)
                  node.receive(msg.agent /*data*/);
                else if (msg.signal)
                  node.handler(msg.signal);
                chan._count += ((msg.agent||msg.signal).length||1);
                if (msg.context) msg.context.kill=true;                
              } else {
                // Throw exception??
                if (msg.context) msg.context.kill=true;  
              }
            },
            // Enable or disable communication port (default: on)
            getState: function () { return chan._state },
            label:desc.id+(port.id?(':'+port.id):''),
            setState: function (on) { chan._state=on },
            /** Check connection status and/or return available connected or reachable nodes (links).
             *
             */
            status: function (path) {
              // self.log('status state='+chan._state);
              if (!chan._state) {
                chan._connected=[];
                return none;
              }
              // Find all overlapping connections
              var port1='port['+node.id+']',objs;
              // self.log(port1);
              if (port1) {  
                objs=self.gui.overlapObjects(port1);
              }
              // self.log(objs);
              if (port.status) objs=port.status(objs);
              if (objs && objs.length>0) {
                // Return all connected nodes/links
                chan._connected=Comp.array.map(objs,function (o) {
                  return o.replace(/port\[([^\]]+)\]/,'$1');
                });
                return chan._connected;
              } else {
                chan._connected=[];
                return none;
              }
            },
            virtual:true
          }; return chan})(port);
        // TODO multiple ports
        node.connections.path=chan;
        x=xn; y=yn;
        id='port['+chan.label+']';
        if (!port.visual) port.visual={
          w:desc.visual.width*2,
          h:desc.visual.height*2              
        };
        if (port.visual.line && !port.visual.line.width)
          port.visual.line.width=2;
        port.visual.x=x+desc.visual.width/2;
        port.visual.y=y+desc.visual.height/2;
        if (Comp.obj.isString(port.visual.width)) 
          port.visual.width=self.convertUnit(port.visual.width);
        if (Comp.obj.isString(port.visual.height)) 
          port.visual.height=self.convertUnit(port.visual.height);
        if (Comp.obj.isString(port.visual.radius)) 
          port.visual.width=
          port.visual.height=self.convertUnit(port.visual.radius)*2;
        if (Comp.obj.isNumber(port.visual.radius)) 
          port.visual.width=
          port.visual.height=port.visual.radius*2;
        self.gui.objects[id] = {visual:{
            x:port.visual.x,
            y:port.visual.y,
            shape:port.visual.shape||'circle',
            w:port.visual.width,
            h:port.visual.height,
            fill:port.visual.fill,
            line:port.visual.line
          },obj:chan,id:id}
        if (drawnow) this.gui.drawObject(id);
        break;
        
      case 'physical':
        // Physical communication ports
        options={verbose:1,proto:'http',multicast:true};
        if (port.verbose!=undefined) options.verbose=port.verbose;
        if (port.proto != undefined) options.proto=port.proto;
        if (port.multicast != undefined) options.multicast=port.multicast;
        if (port.broker) options.broker=port.broker;
        if (options.broker) options.multicast=false;

        if (port.port) addr=port.ip+':'+port.port; else addr=port.ip;
        options.from=addr;
        this.log('[SIM] Creating physical port IP('+addr+') '+Io.inspect(options)+' on node '+node.id);
        chan=this.world.connectPhy(
                Aios.DIR.IP(addr),
                node,
                {
                  broker:options.broker,
                  multicast:options.multicast,
                  name:options.name,
                  on:options.on,
                  oneway:options.oneway,
                  proto:options.proto,
                  rcv:options.from,
                  snd:options.to,
                  verbose:options.verbose
                });
        chan.init();
        chan.start();
        node.connections.ip.chan=chan;
        if (port.to) this.world.connectTo(Aios.DIR.IP(port.to),node);
        break;
    }
    
  }
  if (this.verbose>1) this.log('[SIM] Created node '+node.id);
  return nodeid; 
}
/** Create a regular (or irregular) 2d patch grid of nodes and connections.
 *  type of options = {
                       width: number as node width in pixel,
                       height: number as node heigth in pixel,
                       visual?,  // if not set, model.patches.default is required
                       rows:number,cols:number,
                       floating?:boolean,  // if false/undef. grid consists of logical nodes, else resources
                       }
 */
simu.prototype.createPatchWorld = function (model,resources) {
  var self=this,
      i,j,row,
      options=model.world.patchgrid,
      patch = options.visual || (model.patches && model.patches.default && model.patches.default.visual);
  if (!model.nodes || !model.nodes.world)
    this.err('Incomplete patchgrid model (requires model.nodes.world); no world node found'); 
 
  if (patch) options.visual = patch;
   
  var width     = (options.visual&&options.visual.width)||options.width||10,
      height    = (options.visual&&options.visual.height)||options.height||10,
      margin_x  = 0,
      margin_y  = 0,
      off_x     = 0,
      off_y     = 0,
      xn,yn,x,y,w,h,p,obj,obj2,link,
      node,world,node1,node2,place,port,ports={},
      id,i,j,k,level=0,dim=2,
      xMoff=0,yMoff=0;

  function makeRef(o) {return o};
  function vec2str(vec) { return vec.join(',') }
  
  this.out('Creating patchgrid network with '+options.rows+
           ' rows and '+options.cols+
           ' columns');

  this.options.x=options.cols;
  this.options.y=options.rows;
  
  // A world map for fast search of physical agents(nodes)
  this.agentMap = [];
  // A world map for fast search of physical resources 
  this.resourceMap = [];
  
  for (j=0;j<options.rows*2;j++) {
    row=[];
    for(i=0;i<options.cols*2;i++)
      row.push({})
    this.agentMap.push(row);
  }  
  for (j=0;j<options.rows*2;j++) {
    row=[];
    for(i=0;i<options.cols*2;i++)
      row.push({})
    this.resourceMap.push(row);
  }  
  // Patches parameter variables
  this.patches = [];
  for (j=0;j<options.rows;j++) {
    row=[];
    for(i=0;i<options.cols;i++)
      row.push({x:i,y:j})
    this.patches.push(row);
  }  
  // Draw resources before any other objects
  // Resources have currently patch grid coordinates needing transformation!
  resources.forEach(function (r) {
      if (r.visual.shape == 'circle') r.visual.x += r.visual.width/2, r.visual.y += r.visual.height/2
      r.visual.x *= width;  r.visual.y *= height; 
      if (r.visual.width)   r.visual.width *= width;
      if (r.visual.height)  r.visual.height *= height;
  })
  this.options.patch = {rows:options.rows, cols:options.cols, width:width, height:height}

  // 1. Patches   
  if (patch) {
    this.createResources(resources);
    
    for(j=0;j<options.rows;j++) {
      for(i=0;i<options.cols;i++) {
        id=vec2str([i,j]);
        if (!options.floating) {
          // patch == node
          node=Aios.Node.Node({id:id,
                               position:{x:i,y:j},
                               TMO:self.options.TMO||1000000
                              });
          if (this.verbose>1) this.log('[SIM] Created node '+node.id);
          this.world.addNode(node);
        }  // else patch == resource
        if (options.floating) id = 'patch['+id+']'; else id='node['+id+']';
        xn=off_x+margin_x+i*width+xMoff;
        yn=off_y+margin_y+j*height+yMoff;
        this.gui.objects[id] = { visual:{
            x:xn,
            y:yn,
            shape:options.visual.shape||'rect',
            w:width,
            h:height,
            fill:options.visual.fill,
            line:options.visual.line,
          },
          obj:{parameter:{}},
          id:id
        }
      }
    }
  } else {
    // Default patchgrid visual: frame boundary + grid pattern
    xn=off_x+margin_x+xMoff;
    yn=off_y+margin_y+yMoff;
    id='patch[world]';
    this.gui.objects[id] = { visual:{
        x:xn,
        y:yn,
        shape:'rect',
        pattern:{
          shape:'rect',
          w:options.width,
          h:options.width,
          color:"1 #ddd 0.9"
        },
        w:width*options.cols,
        h:height*options.rows,
        fill:null,
        line:{color:'#888'},
      },
      obj:{parameter:{},patches:self.patches},
      id:id
    }
    // Draw resources before any other objects
    this.createResources(resources);
    
  }

}


/** Create a physical communication port
 *
 */
simu.prototype.createPort = function (dir,options,nodeid) {
  if (!options) options={};
  var multicast=options.multicast||true;
  if (dir.tag != Aios.DIR.tag.IP)  {}
  if (options.from==undefined && dir.ip) options.from=dir.ip.toString();
  var  chan=this.world.connectPhy(
            dir,
            this.getNode(nodeid),
            {
              broker:options.broker,
              multicast:multicast,
              name:options.name,
              on:options.on,
              oneway:options.oneway,
              proto:options.proto||'udp',
              rcv:options.from,
              snd:options.to,
              verbose:options.verbose||this.verbose
            });
  chan.init();
  chan.start();
  return chan;
}

/** Create unit conversion functions from a map object
 *
 */
simu.prototype.createUnits = function (map) {
  /*
  **  0---x   latitude           Y
  **  | PX    |  GPS             | GEO
  **  | GUI   |                  | 
  **  y       +----- longitude   0-----X 
  */
  // Geographic units using map parameters {offset,scale}
  this.world.units.gps2px = function (gps) {
    if (!gps.delta) {
      if (!map.area) area={x:0,y:0};
      else if (!map.area.selector) area={x:map.area.x||0,y:map.area.y||0};
      else area=map.area[map.area.selector(gps)];
      return {
          x:area.x+((gps.longitude-map.longitude.offset)*map.longitude.scale)|0,
          y:area.y-((gps.latitude-map.latitude.offset)*map.latitude.scale)|0, 
          z:gps.height*(map.height?map.height.scale:1)
      };
    } else
      // delta coord.
      return {
       x:(gps.longitude*map.longitude.scale)|0,
       y:-(gps.latitude*map.latitude.scale)|0,
       z:gps.height*(map.height?map.height.scale:1)
      };
  };
  this.world.units.px2gps = function (px) {
    if (!px.delta) {
      if (!map.area) area={x:0,y:0};
      else if (!map.area.selector) area={x:map.area.x||0,y:map.area.y||0};
      else area=map.area[map.area.selector(px)];
      return {
        latitude:  -(px.y-area.y)/map.longitude.scale+map.longitude.offset,
        longitude: (px.x-area.x)/map.latitude.scale+map.latitude.offset            
      }
    } else
      // delta;
      return {
        latitude: -px.y/map.longitude.scale,
        longitude: px.x/map.latitude.scale
      }
  };
  this.world.units.gps2geo = function (gps) {
    // Only for delta vectors
    if (gps.delta) return {
      X:gps.longitude*111320,
      Y:gps.latitude*111320,
      Z:gps.height
    }
  },
  this.world.units.geo2gps = function (geo) {
    // Only for delta vectors
    if (geo.delta) return {
      latitude: geo.Y/113200,
      longitude: geo.X/113200,
      height: geo.Z
    }
  };

  // Geometric units using map parameters {offset,scale}
  this.world.units.geo2px = function (geo) {
    if (geo.delta) return {
      x:(geo.X)*(map.X.scale||1),
      y:(geo.Y)*(map.Y.scale||1),
      z:(geo.Z)*(map.Z.scale||1)
    }; else return {
      x:(geo.X-map.X.offset||0)*(map.X.scale||1),
      y:(geo.Y-map.Y.offset||0)*(map.Y.scale||1),
      z:(geo.Z-map.Z.offset||0)*(map.Z.scale||1)
    } 
  };
  this.world.units.px2geo = function (px) {
    if (px.delta) return {
      X:px.x/(map.X.scale||1),
      Y:px.y/(map.Y.scale||1),
      Z:px.z/(map.Z.scale||1)
    }; else return {
      X:px.x/(map.X.scale||1)+(map.X.offset||0),
      Y:px.y/(map.Y.scale||1)+(map.Y.offset||0),
      Z:px.z/(map.Z.scale||1)+(map.Z.offset||0)
    }
  };
  function rad2deg (rad) { return rad/Math.PI*180.0 };
  function deg2rad (deg) { return deg/180.0*Math.PI };
  
  // Computer distance and angle direction between two GPS locations
  this.world.units.gps2dist = function (gps1,gps2) {
    var dy=(gps2.latitude-gps1.latitude)*111320,
        dx=(gps2.longitude-gps1.longitude)*111320,
        dz=(gps2.height-gps1.height),
        angle = rad2deg(Math.atan2(dy, dx));
    // Convert to 0\B0: N, 90\B0 : E, 180\B0 : S, 270\B0 : W 
    if (angle >=0 && angle <= 180) angle=270-angle;
    else if(angle > -90) angle=-angle+270;
    else angle=-angle-90;
     
    return {dx:dx,dy:dy,dz:dz,angle:angle}
  }
  
  this.world.units.rad2deg = rad2deg;
  this.world.units.deg2rad = deg2rad;
  this.aiosX.units=this.world.units;
}

// Draw resources
simu.prototype.createResources = function (resources) {
  var self=this,xi,yi,wi,hi;
  if (resources.length) this.log('Creating '+resources.length+' resource(s)..');
  Comp.array.iter(resources,function (r) {      
    if (r.id != undefined && r.visual) {
      id='resource['+r.id+']';
      self.gui.objects[id] = {
        visual:{
          x:r.visual.x,
          y:r.visual.y,
          shape:r.visual.shape||'circle',
          w:r.visual.width,
          h:r.visual.height,
          fill:r.visual.fill,
          line:r.visual.line
        },obj:r.data,id:id
      }
      if (r.data) self.gui.objects[id].data=r.data;
      if (r.class) self.gui.objects[id].class=r.class;
      if (self.options.patch) {
        xi=int(r.visual.x/self.options.patch.width);
        yi=int(r.visual.y/self.options.patch.height);
        wi=int(r.visual.width/self.options.patch.width);
        hi=int(r.visual.height/self.options.patch.height);
        if (yi>self.options.patch.rows || xi>self.options.patch.cols) 
          throw Error('createResources: invalid visual patch coordinates ('+xi+','+yi+')');
        self.resourceMap[yi][xi][id]=self.gui.objects[id];
        self.rtree.insert({x:xi, y:yi, w:wi, h:hi},id);
      }
      id='label['+r.id+']';
      if (r.visual.label) self.gui.objects[id] = {
        visual:{
          x:r.visual.x+10,
          y:r.visual.y+10,
          shape:'text',
          fontSize:r.visual.label.fontSize||24,
          color:r.visual.label.color,
          text:r.visual.label.text||r.visual.label,
        },id:id
      }
    }      
  });    
}


/** Create the simulation world
 *
 * type of model = { name, classes, resources?, world}
 * type of world = { init?, map?, nodes?, meshgrid?, patchgrid?, resources?, units? }
 * type of units = { map?, gps2px?, px2gps?, geo2px?, px2gep? }
 *
 *
 *
 */
simu.prototype.createWorld = function (model) {
  var margin_x = 5,
      margin_y = 5,
      off_x = 5,
      off_y = 5,      
      node,
      self=this,
      id,i,j,p,res,pos,
      map,area;
  self.model=model;
  try {
    // Check model ..
    if (model.agents) {
      for (p in model.agents) {
        if (!model.agents[p].visual) throw "Invalid model.agents."+p+": missing visual";
        if (res=this.checkVisual(model.agents[p].visual)) throw "Invalid model.agents."+p+".visual: "+res+")";
      }
    } 
    
    
    
    if (model.world.units) this.world.units=model.world.units;
    if (model.world.units && model.world.units.map) this.createUnits(model.world.units.map);

    // Draw resources before any other objects (lowest z level)
    // model.world.resources returns array of simulation object descriptors
    var resources = model.world.resources?model.world.resources(model):[];

    if (!Comp.obj.isArray(resources))   
      throw ('odel.world.resources returned '+(typeof resources)+', expected array');
    
    if (!model.world.patchgrid) this.createResources(resources);
    if (model.world.meshgrid)   this.createMeshNetwork(model);
    if (model.world.patchgrid)  this.createPatchWorld(model,resources);
    if (model.world.nodes && typeof model.world.nodes == "function") 
      model.world.map=model.world.nodes; // synonym
    if (model.world.map) {
      // use a mapping function and node descriptors {id,x,y,link,visual}
      Comp.array.iter(model.world.map(model), function (desc,i) {
          self.createNode(desc);
      });
    }
  } catch (e) {
    this.log('Failure in createWorld: '+e);
    if (this.gui.options.verbose) this.log(e.stack);
  }
}

// Delete a JAM node and visuals
simu.prototype.deleteNode = function (nodeid) {
  var objid = 'node['+nodeid+']',
      node = this.world.getNode(nodeid),
      objs,p,port;

  this.gui.destroyObject(objid);
  // Remove ports of deleted node
  if (node) {
    for(p in {NORTH:1,SOUTH:1,WEST:1,EAST:1,UP:1,DOWN:1}) {
      if (node.connections[p.toLowerCase()])
        this.gui.destroyObject('port['+nodeid+':'+p+']');
    }
    if (node.connections.path) {
      this.gui.destroyObject('port['+node.connections.path.label+']');
    }  
    if (node.connections.ip) {
      // Stop physical link
      node.connections.ip.chann.stop();
    } 
    this.world.removeNode(nodeid);
    node.destroy();
  } else if (this.gui.options.verbose) this.log('deleteNode: No node found for id '+nodeid);
  
  // Remove links to deleted node
  objs=this.gui.findObjects('link',nodeid);
  for(p in objs) {
    this.gui.destroyObject(p);
  }
  // Cleanup links of ports currently linked with other nodes
  objs=this.gui.findObjects('port','.+');
  for(p in objs) {
    port=objs[p].obj;
    if (port.link && 
        ((port.link.node1 && port.link.node1.id==nodeid)||
         (port.link.node2 && port.link.node2.id==nodeid))) port.link=undefined;
  }
  if (this.verbose>1) this.log('[SIM] Deleted node '+nodeid);
}

/** Destroy the simulation world: Destroy agents, AIOS nodes, and AIOS world.
 *
 */
simu.prototype.destroy = function () {
  var n,p;
  for(n in this.world.nodes) {
    if (!this.world.nodes[n]) continue; // ??
    this.gui.objects[this.world.nodes[n].id]=undefined;
    if (this.world.nodes[n].connections.ip) this.world.nodes[n].connections.ip.chan.stop(); 
    this.world.nodes[n].destroy();
  }
  if (this.model.world && this.model.world.init && this.model.world.init.physics) {
    if (this.simuPhy) 
      this.gui.destroySimuPhy();
    this.simuPhy=none;
  }
  this.world.nodes=none;
  this.world=none;
  this.model=none;
  if (this.Db) for(p in this.Db) this.Db[p].close();
  this.Db=none;
  this.log('[SIM] Simulation world destroyed');  
}
/** Return agent object (or array if ais is a regex) referenced by logical node number, position, or name,
 ** and agent identifier.
 *  If @id is undefined return current node object.
 */
simu.prototype.getAgent = function (id,aid) {
  var node = this.getNode(id);
  if (node) return node.getAgent(aid);
}
simu.prototype.getAgentProcess = function (id,aid) {
  var node = this.getNode(id);
  if (node) return node.getAgentProcess(aid);
}


/** Return node object referenced by logical node number, position, or name
 *  If @id is undefined return current node object.
 */
simu.prototype.getNode = function (id) {
  var node;
  if (id==undefined) return this.world.nodes[0];
  if (typeof id == 'number') 
    node=this.world.nodes[id];
  else if (typeof id == 'string') {
    // Search node identifier;
    node = this.world.getNode(id);
  } else if (id.x != undefined && 
             id.y != undefined) {
    // Search node position;
    loop: for(var i in this.world.nodes) {
      if (this.world.nodes[i] && Comp.obj.equal(this.world.nodes[i].position,id)) {
        node = this.world.nodes[i];
        break loop;
      } 
    }
  }
  
  return node;
} 

/** Return process object referenced by logical node number, position, or name,
 ** and agent identifier.
 *  If @id is undefined return current node object.
 */
simu.prototype.getProcess = function (id,aid) {
  var node = this.getNode(id);
  if (node) return node.getAgentProcess(aid);
}

/** Return statistics
 *  type stats = {steps,time,agents:{},agentsN:{},all;number}
 */
 
simu.prototype.getStats = function () {
  return this.aiosX.getStats();
}
/** Initialize and create simulation world
 *
 */
simu.prototype.init = function (model) {  
  var a,n,c,params,proc,count;
 try {  
  this.out('Initializing ...');
  
  if (model.parameter) this.parameter=model.parameter;
  // 1. AC COMPILING
  if (model.agents) model.classes = model.agents; // synonym for classes
  else if (model.classes) model.agents = model.classes;
  if (model.classes) 
    for(c in model.classes) {
      if (!model.classes[c].behaviour) 
        this.out('Error: Agent class "'+c+'" has no behaviour!');
      else {
        this.out('Compiling agent class template "'+c+'"...');
        this.addClass(model.classes[c].behaviour,c,model.classes[c].visual);
      }
    }
  // 2. CREATE World
  
  this.createWorld(model);
  
  // 3. START AGENTS
  if (model.world && model.world.init && model.world.init.agents) {
    for (a in model.world.init.agents) {
      if (!Comp.obj.isFunction(model.world.init.agents[a]))
        this.out('Error: Init: "'+a+'" is not a function!');
      else if (!this.world.classes[a])
        this.out('Error: Init: Agent class "'+a+'" is not registered!');      
      else {
        this.out('Creating agents of class "'+a+'" ..');
        count=0;
        for(n in this.world.nodes) {
          params=model.world.init.agents[a](this.world.nodes[n].id,this.world.nodes[n].position);
          if (params) {
            if (params.level == undefined) params.level=1;
            else if (params.level<0 || params.level>3)
              this.out('Error: Init: Invalid agent level '+params.level+' for agent class "'+a+'".');
            else {
              proc=Aios.Code.createOn(this.world.nodes[n],
                                      this.world.classes[a][params.level],
                                      params.args,params.level,a);
              count++;
            }
          }
        }        
        this.out('Created '+count+' '+a+' agents.');
      }
    }
  }

  // 4. CREATE PHYSICAL WOLRD - IF ANY  
  if (model.world.init && model.world.init.physics) {
    if (!this.simuPhy) 
      this.simuPhy=this.gui.createSimuPhy();
    model.world.init.physics(this.simuPhy);
  }
  this.out('Ready.');
 } catch (e) {
    this.out('Error: '+e);
    if (this.verbose) this.out(Io.sprintstack(e));  
 }
}

/** Move an object (node or resource) relative to its current position.
 *  type of dx,dy,dz = number is normalized pixel units | string (number + 'm' | '\B0')
 *
 *
 */
simu.prototype.moveObject = function(objid,dx,dy,dz) {
  var id,obj,_dx,_dy,_dz,isnode=false;
  if (dx && Comp.obj.isString(dx)) {
    if (Comp.string.endsWith(dx,'\B0') && this.world.units.gps2px)
      _dx=this.world.units.gps2px({delta:true,longitude:Number(Comp.string.prefix(dx,'\B0'))}).x;
    else if (Comp.string.endsWith(dx,'m') && this.world.units.geo2px)  
      _dx=this.world.units.geo2px({delta:true,X:Number(Comp.string.prefix(dx,'m'))}).x;
    else 
      _dx=Number(dx);
  } else _dx=dx;
  if (dy && Comp.obj.isString(dy)) {
    if (Comp.string.endsWith(dy,'\B0') && this.world.units.gps2px) 
      _dy=this.world.units.gps2px({delta:true,latitude:Number(Comp.string.prefix(dy,'\B0'))}).y;
    else if (Comp.string.endsWith(dy,'m') && this.world.units.geo2px) 
      _dy=this.world.units.geo2px({delta:true,Y:Number(Comp.string.prefix(dx,'m'))}).y;
    else 
      _dy=Number(dy);  
  } else _dy=dy;
  if (dz && Comp.obj.isString(dz)) {
    if (Comp.string.endsWith(dz,'m') && this.world.units.geo2px) 
      _dz=this.world.units.geo2px({delta:true,Z:Number(Comp.string.prefix(dz,'m'))}).z;
    else 
      _dz=Number(dz);  
  } else _dz=dz;
  
  if (Comp.string.startsWith(objid,'node')) {
    id=objid.replace(/node\[([^\]]+)\]/,'$1');
    obj=this.world.getNode(id);
    isnode=true;
  } else if (Comp.string.startsWith(objid,'resource')) {
    // TODO, use .data
  }
  if (!obj) return;
  
  if (obj && obj.position) {    
    // Assumption: x/y/z are normalized pixel and linear coordinates!
    if (obj.position.x != undefined && _dx) obj.position.x += _dx;
    if (obj.position.y != undefined && _dy) obj.position.y += _dy;
    if (obj.position.z != undefined && _dz) obj.position.z += _dz;
    if (obj.position.gps && this.world.units.px2gps) {
      if (_dx) obj.position.gps.latitude += this.world.units.px2gps({delta:true,y:_dy}).latitude;
      if (_dy) obj.position.gps.longitude += this.world.units.px2gps({delta:true,x:_dx}).longitude;
      if (_dz) obj.position.gps.height += this.world.units.px2gps({delta:true,z:_dz}).height;
    }
  } 
  if (isnode) this.gui.moveObject(objid,_dx,_dy,'agent','port');
  else this.gui.moveObject(objid,_dx,_dy);
}

/** Move an object (node or resource) to new absolute position.
 *  type of x,y,z = number is normalized pixel unit | string (number + 'm' | '\B0')
 *
 *
 */
simu.prototype.moveObjectTo = function(objid,x,y,z) {
  var id,obj,_px,_gps,isnode=false;
  if (Comp.obj.isString(x) &&  Comp.obj.isString(y)) {
    if (Comp.string.endsWith(x,'\B0') && Comp.string.endsWith(x,'\B0') && this.world.units.gps2px) {
      _gps={latitude:Number(Comp.string.prefix(x,'\B0')),longitude:Number(Comp.string.prefix(y,'\B0')),height:Number(z)};
      _px=this.world.units.gps2px(_gps);      
    } else if (Comp.string.endsWith(x,'m') && Comp.string.endsWith(y,'m') && this.world.units.geo2px)
      _px=this.world.units.geo2px({X:Number(Comp.string.prefix(x,'m')),Y:Number(Comp.string.prefix(y,'m')),Z:Number(z)});
    else 
      _px={x:Number(x),y:Number(y),z:Number(z)};
  } else _px={x:x,y:y,z:z};
  
  if (Comp.string.startsWith(objid,'node')) {
    id=objid.replace(/node\[([^\]]+)\]/,'$1');
    obj=this.world.getNode(id);
    isnode=true;
  } else if (Comp.string.startsWith(objid,'resource')) {
    // TODO, use .data
  }
  if (!obj) return;
  
  if (obj && obj.position && !this.options.patch) {
    if (obj.position.x != undefined) obj.position.x = _px.x;
    if (obj.position.y != undefined) obj.position.y = _px.y;
    if (obj.position.z != undefined) obj.position.z = _px.z;
    if (obj.position.gps && _gps) {
      obj.position.gps.latitude = _gps.latitude;
      obj.position.gps.longitude = _gps.longitude;
      obj.position.gps.height = _gps.height;
    }
  } 
  if (isnode) this.gui.moveObjectTo(objid,_px.x,_px.y,'agent','port');
  else this.gui.moveObjectTo(objid,_px.x,_px.y);
}

// Set simulation delay between two steps
simu.prototype.setDelay = function (ms) {
  this.delay=ms;
}

/** Set simulation parameter (accessible by agents using simu.paramater(name))
 *
 */
simu.prototype.setParameter = function (name,value) {
  this.parameter[name]=value;
}

/** Run or step simulation
 */
simu.prototype.simulate = function (steps,callback) {
  var self=this,
      realtime=this.options.time=='real',
      milliTime=function () {return Math.ceil(Date.now())},
      start,stop,timeReal,
      lazy=this.gui.options.display.lazy,suspend=false,
      curtime=realtime?milliTime():Aios.time();
  var lasttime=curtime;
  this.stepped=steps;
  
  start=curtime;
  if (realtime && this.time>0) current.world.lag=current.world.lag+(start-this.time);
  else if (this.time>0) this.lag=this.lag+(start-this.time);
  this.time0=start;
  this.time=start;
  this.run=true;
  if (this.verbose) this.log('[SIM] Stepping simulation ('+steps+') at '+this.step+ ' .. (t '+(start-current.world.lag-this.lag)+' ms)');
  function starting () {
    if (self.model && self.model.world && self.model.world.start) try { self.model.world.start({
      log:self.log.bind(self),
      time:Date.now(),
      step:self.step,
      simtime:curtime,
      model:self.model,
      cpu:self.stats.cpu,
    }) }  catch (e) { self.gui.log('model.world.start: '+e.toString())};
  }
  function stopping () {
    if (self.gui.worldWin.container && suspend) { // enable world win updates
        suspend=false; self.gui.worldWin.container.resume() };
    self.gui.updateGui(true);
    if (self.model && self.model.world && self.model.world.stop) try { self.model.world.stop({
      log:self.log.bind(self),
      time:Date.now(),
      step:self.step,
      simtime:curtime,
      model:self.model,
      cpu:self.stats.cpu,
    }) }  catch (e) { self.gui.log('model.world.stop:'+e.toString())};
  }
  // self.but2.setStyle({bg:'red'});
  Aios.config({iterations:1});
  var loop = function () {
        if (self.gui.worldWin.container && !suspend) { // disable world win updates
          suspend=true; self.gui.worldWin.container.suspend() };
          
        // Execute JAM scheduler
        timeReal=Date.now();

        var nexttime=Aios.scheduler();

        self.stats.cpu += (Date.now()-timeReal);
        
        if (self.gui.worldWin.container && !lazy && suspend) { // enable world win updates
          suspend=false; self.gui.worldWin.container.resume() };
          
        if (self.gui.logging) self.gui.logTable[self.step]=self.getStats();
        if (self.cleanWorld) self.cleanWorld=self.gui.cleanWorld()>0;
        self.step++;
        if (self.stepped>0) self.stepped--;
        
        self.time=curtime=Aios.time();
        if (!self.run) {
          stop=realtime?milliTime():Aios.time();
          //self.log(stop+','+current.world.lag+','+self.lag+','+curtime+','+milliTime());
          if (self.verbose) self.log('[SIM] Stopping simulation at '+self.step+ ' .. (d '+(stop-self.time0)+' ms / t '+(stop-current.world.lag-self.lag)+' ms): Stopped.');
          self.time=curtime;
          if (callback) callback();
          stopping();
          return;
        }
        if (self.stepped==0) {
          stop=realtime?milliTime():Aios.time();
          self.run=false;
          //self.but2.setStyle({bg:'blue'});
          if (self.verbose) self.log('[SIM] Stopping simulation at '+self.step+ ' .. (d '+(stop-self.time0)+' ms / t '+(stop-current.world.lag-self.lag)+' ms): No more steps.');
          self.time=stop;
          if (callback) callback();
          stopping();
          return;      
        }
        if (nexttime>0) self.loop=setTimeout(loop,(self.options.time=='real'?nexttime:self.delay));   // TODO: resonable timeout if nexttime is in steps!!!
        else if (nexttime<0 && !self.delay) self.loop=setImmediate(loop);
        else if (nexttime<0) self.loop=setTimeout(loop,self.delay);
        else {
          // self.but2.setStyle({bg:'blue'});
          stop=realtime?milliTime():Aios.time();
          self.run=false;
          if (self.verbose) self.log('[SIM] Stopping simulation at '+self.step+ ' .. (d '+(stop-self.time0)+' ms / t '+(stop-current.world.lag-self.lag)+' ms): Nothing to run.');
          self.time=curtime;
          if (callback) callback();
          stopping();
          return;
        }
        
        if ((curtime-lasttime)>100) {
          if (self.gui.worldWin.container && lazy && suspend) { // enable world win updates
              suspend=false; self.gui.worldWin.container.resume() };
          self.gui.updateGui(true);
          lasttime=curtime;
        } else 
          self.gui.updateGui(false);
  }
  starting();
  this.loop = setTimeout(loop,0);
}

/** Start simulation 
 *  steps: number of simulation steps
 *  temp: temporary step
 *
 */
simu.prototype.start = function (steps,temp) {
  var self=this;
  if (steps<=0 || (temp && this.stopped)) return;
  if (!temp) {
    this.stopped=false;
    this.gui.UI('simulationWinButStep').disable();
    this.gui.UI('simulationWinButPlay').disable();
    this.gui.UI('simulationWinButStop').enable();
  } 
  setImmediate(function () {
    self.simulate(self.stepped|steps,function () {
      if (self.stepped==0) {
        this.stopped=true;
        self.gui.UI('simulationWinButStep').enable();
        self.gui.UI('simulationWinButPlay').enable();
        self.gui.UI('simulationWinButStop').disable(); 
      } 
    });
  });
}

/** Stop simulation, return remaining steps (only in temporary mode)
 *
 */
simu.prototype.stop = function (temp) {
  this.run=false;
  if (this.loop) clearTimeout(this.loop);
  this.loop=null;
  if (this.gui.worldWin.container) this.gui.worldWin.container.resume()
  if (temp && !this.stopped)
    return this.stepped-1;
  else {
    this.stepped=0;
    this.stopped=true;
    return 0;
  }
}

/** convert simulation world to graphics coordinates 
 */
simu.prototype.world2draw =  function (p) {
  if (this.options.patch) return {x:p.x*this.options.patch.width,
                                  y:p.y*this.options.patch.height};
  else return p;
}

var Simu = function(options) {
  var obj=none;
  obj = new simu(options);
  return obj;
}

module.exports = {
  simu:simu,
  Simu:Simu,
  current:function (module) { current=module.current; Aios=module; JamAnal.current(module)}
}
