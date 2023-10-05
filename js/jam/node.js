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
 **    $INITIAL:     (C) 2006-2021 bLAB
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: node.js,v 1.4 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.13.2
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Node Sub-System
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var Security = Require('jam/security');
var current=none;
var Aios = none;

var options = {
  debug:{},
  verbose:0,
  version:'1.13.2'
}

function aid(process) { return process.agent.id+':'+process.pid }
function min0(a,b) { return a==0?b:(b==0?a:Comp.pervasives.min(a,b)) };

/** Create a node.
 *  typeof options = {id,maxpro,maxts,position:{x,y},defaultLevel?,TMO?}
 *
 */
var node= function (options) {
  var self=this;
  options=checkOptions(options,{});
  this.options=options;
  this.id       = checkOption(this.options.id,Aios.aidgen());
  this.position = checkOption(this.options.position,Aios.DIR.ORIGIN);
  this.type     = checkOption(this.options.type,'generic');
  this.verbose  = checkOption(this.options.verbose,0);
  // Default AIOS privilege level for received agent snapshots
  this.defaultLevel=checkOption(this.options.defaultLevel,Aios.options.LEVEL);
  this.processes={
    free:none,
    max:checkOption(this.options.maxpro,100),
    // (proc|undefined) []
    table:[],
    // number|undefined []
    hash:[],
    top:0,
    used:0,
    // a cache of migrated agents [id]={dir,timeout}
    gone:[]
  };
  this.processes.lookup = function (aid) {
    if(self.processes.hash[aid]!=undefined) 
      return self.processes.hash[aid];
    else 
      return none;
  };
  this.processes.process = function (aid) {
    if (self.processes.hash[aid]!=_)
      return self.processes.table[self.processes.hash[aid]];
    else
      return none;
  };
  
  // Signal propagation cache [from]={dir:timeout}
  this.signals=[];
  // [agent,tmo,sig,arg]
  this.timers=[];
  
  /** Connections to other nodes using P2P/IP/DOS links
  *  type link = {recv: function (callback),send:function(data),
  *               status: function() -> bool,count:number}
  */
  this.connections={north:none,south:none,west:none,east:none};
  // tuple spaces
  this.ts = Aios.Ts.create({maxn:checkOption(this.options.maxts,8),
                            id:this.id,node:self});
  
  // Random ports for negotiation and node security
  this.random = {};
  this.port = Security.Port.unique();
  this.random[this.port]=Security.Port.unique();
  
  // Code dictionary shared by agents
  this.library = {};
  
  // Location (geo) and position (virtual) information
  // location : { ip:string, 
  //              gps:{lat:number, lon:number}, 
  //              geo:{city:string,country:string,countryCode:string,region:string,zip:string} }
  
  this.location = null;
  
  
  this.position = options.position;
  
  this.stats = {
    cpu:0,
    create:0,
    fastcopy:0,
    fork:0,
    handled:0,
    migrate:0,
    received:0,
    signal:0,
    error:0,
    tsout:0,
    tsin:0,
    agents:0,
  }
  
  // Agent migration (gone) cache timeout
  this.TMO = checkOption(this.options.TMO,100000);
  // Needs node's service?
  this.timeout = 0;
  
  Aios.emit('node+',self); 

};

/** Clean-up and destroy this node. Terminate all agent processes.
 */
node.prototype.destroy = function () {
  var p,pro,_node=current.node,self=this;
  this.connections={};
  if (this.verbose>2) console.log('node.destroy',this)
  current.node=this;
  for(p in this.processes.table) {
    pro=this.processes.table[p];
    if (!pro) continue;
    pro.kill=true;
    this.unregister(pro);    
  }
  this.processes.gone=[];
  this.ts = none;
  current.node=_node;
  // unlink this node in an optional parent node (simulation)
  if (this.parent) {
    this.parent.children=this.parent.children.filter(function (node) {
      return node!=self
    });
  }
  // unlink this node from optional child nodes (simulation)
  if (this.children) {
    this.children.forEach(function (node) {
      node.parent=null;
    })
  }
  Aios.emit('node-',self); 
}

/** Export of code library
 *
 */
node.prototype.export = function (name,code) {
  // copy and sandbox code
  if (!this.library[name]) 
    this.library[name]=Aios.Code.toString(code);
}

/** Find an agent of the node by it's id and/or class, or agents matching a regular expression. 
 *
 */
node.prototype.getAgent = function (id,ac) {
  var pros=this.getAgentProcess(id,ac);
  if (pros && Comp.obj.isArray(pros)) 
    return Comp.array.map(pros,function (pro) {return pro.agent});
  else if (pros) return pros.agent;
};


node.prototype.getAgentProcess = function (id,ac) {
  var matches=Comp.obj.isRegex(id)?[]:undefined,
      table=this.processes.table,p;
  if (!matches && this.processes.hash[id]!=undefined) {
    p=table[this.processes.hash[id]];
    if (!ac || p.agent.ac==ac) return p;
  }
  if (typeof id == 'number') return table[id];
  for(var p in table) {
    if (!table[p]) continue;
    if (!matches && table[p].agent.id==id && (!ac || table[p].agent.ac==ac)) 
      return table[p];
    if (matches && id.test(table[p].agent.id) && (!ac || table[p].agent.ac==ac)) 
      matches.push(table[p]);
  }
  return matches;
};



/** Receive a signal to be passed to an agent located here or routed to another node.
 *  Message is in JSOB text format or a JS object (fastcopy mode).
 *
 * typeof sigobj = {to,sig,arg,from,back?}
 *
 */
node.prototype.handle = function (msg) {
  var delivered,tmo,curtime=Aios.time()-current.world.lag,
      _node=current.node,self=this,
      sigobj=(typeof msg == 'string')?Aios.Code.ofString(msg,{}):msg;
  if (options.debug.handle) console.log('node.handle',this.id,sigobj); 
  if (!sigobj) return; // Error
  current.node=this;
  delivered=(Aios.Mobi.DIR.isDir(sigobj.to)?Aios.Sig.agent.sendto:Aios.Sig.agent.send)
            (sigobj.to,sigobj.sig,sigobj.arg,sigobj.from,sigobj.hop);
  if (delivered && sigobj.back) {
    // Update signal route cache
    tmo=curtime+this.TMO;
    this.signals[sigobj.from]={dir:sigobj.back,timeout:tmo};
    this.timeout=min0(this.timeout,tmo);
  };
  this.stats.handled++;
  current.node=_node;
  Aios.emit('schedule',self);
  return delivered;
}

/** Import code from library.
 *  Returns a sandboxed code copy.
 *
 */
node.prototype.import = function (name) {
  var code;
  if (this.library[name]) code=Aios.Code.ofString(this.library[name],current.process.mask);
  return code;
}

/** Get node statistics 
 * 
 */
node.prototype.info = function () {
  var self=this,
      p,
      obj = {};
  ovj.stats = this.stats; 
  obj.id = this.id;
  obj.position = this.position;
  obj.agents={};
  var update=function (obj) {   
    var p;
    for (p in obj) {
      if (p != '_update') delete obj[p];
    }
    for (p in self.processes.hash) {
      if (self.processes.hash[p]!=_)
        obj[p]=self.processes.table[self.processes.hash[p]];
    };
  }
  obj.agents._update=update;
  update(obj.agents);
  
  obj.signals=this.signals;
  obj.timers=this.timers;
  obj.ts=this.ts;
  obj.connections=this.connections;
  return obj;
}

/** Print node statistics
 *
 */
node.prototype.print = function (summary) {
  var i,blocked,pending,total,ghost=0;
  var str='==== NODE '+this.id+' ===='+NL;
  str += 'SYSTIME='+Aios.time()+NL;
  str += 'PROCESS TABLE >>'+NL;
  if (summary) {
    blocked=0; pending=0; total=0; ghost=0;
    for (i in this.processes.table) {
      if (this.processes.table[i]!=_) { 
        total++;
        if (this.processes.table[i].blocked) blocked++;
        if (this.processes.table[i].signals.length>0) pending++;
        if (this.processes.table[i].agent.next==undefined) ghost++;
      };
    }
    str += '  TOTAL='+total+' BLOCKED='+blocked+' DYING='+ghost+' SIGPEND='+pending+NL;
  } else {
    for (i in this.processes.table) {
      if (this.processes.table[i]!=_) { 
        str += '  ['+aid(this.processes.table[i])+'] '+
             'NEXT='+this.processes.table[i].agent.next+' '+
             this.processes.table[i].print();
      };
    }
  }
  if (this.timers.length>0) {
    str += 'TIMER TABLE >>'+NL;
    for (i in this.timers) {
      str += '  ['+aid(this.timers[i][0])+'] TMO='+this.timers[i][1]+' SIG='+this.timers[i][2]+NL;
    }
  }
  str += 'TUPLE SPACES >>'+NL;
  if (summary) str += '  '+this.ts.print(summary); else str += this.ts.print(summary);
  return str;
}

/** Receive migrated agent text code and create a process container registered on this node.
 *  If start=false then the next activity is computed here.
 *
 */
node.prototype.receive = function (msg,start,from) {
  // Save context
  var _process=current.process,
      _node=current.node,
      self=this,
      process,agent;

  if (options.debug.receive) console.log ('node.receive (start='+start+',length='+msg.length+'):\n<'+msg+'>');
  if (typeof msg !== 'object') process=Aios.Code.toCode(msg,this.defaultLevel); 
  else process=Aios.Code.ofObject(msg); // Virtual migration, same physical JAM
  
  if (!process) return; // Error
  agent=process.agent;
  agent['self']=agent;
  this.register(process);
  this.stats.received++;
  
  if (process.dir || process.delta) { 
    /* TODO migration if this node is not the destination */
    return;
  };
  if ((!process.back||process.back.tag=='DIR.IP') && from && from.address && from.port) 
    // update or store back path; don't use old IP entry (along extended paths), it is not reachable from here!
    process.back=Aios.DIR.IP(from.address+':'+from.port);   
  if (process.back && process.agent.parent) { // register child-to-parent signal path
    tmo=Aios.time()-current.world.lag+this.TMO;
    this.signals[process.agent.parent]={dir:process.back,timeout:tmo};
    this.timeout=min0(this.timeout,tmo); 
  }
  
  // console.log('node.receive '+this.position.x+','+this.position.y);
  if (process.schedule.length == 0) {
    // Compute next activity on THIS node
    current.node=this;
    current.process=process;
    try {       
      if (!start) 
        agent.next=(typeof agent.trans[agent.next] == 'function')?agent.trans[agent.next].call(agent):
                                                                  agent.trans[agent.next];
      if (process.blocked) throw 'BLOCKING';
      //console.log(agent.next);
    } catch (e) {
      Aios.aios.log ('Node.receive: Agent '+agent.id+' ['+agent.ac+'] in transition '+agent.next+
                    ' failed:\n'+e+(current.error?' / '+current.error:', in: \n'+Aios.Code.print(agent.trans[agent.next]))+
                    '\nat:\n'+Io.sprintstack(e));
      this.unregister(process);
    };
    // Restore context
    current.node=_node;
    current.process=_process;
  }
}

/** Register agent code and assign a process container.
 *
 */
node.prototype.register = function (process) {
  var i,p,
      self=this,
      agent=process.agent;
  if (this.processes.free==none) {
    loop: for (i in this.processes.table) {
      if (this.processes.table[i]==_) { this.processes.free=i; break loop};
    }
  }
  if (this.processes.free!=none) {
    this.processes.table[this.processes.free]=process;
    process.pid=this.processes.free;
    process.agent=agent;
    this.processes.free=none;
  } else {
    this.processes.table[this.processes.top]=process;
    process.agent=agent;
    process.pid=this.processes.top;
    this.processes.top++;
  }
  if (agent.id==undefined) agent.id=Aios.aidgen();
  this.processes.hash[agent.id]=process.pid;
  this.processes.used++;
  this.stats.agents++;
  
  if (this.processes.gone[process.agent.id]) 
    // Agent returned again!
    this.processes.gone[process.agent.id]=undefined;
  process.node=this;
  Aios.emit('agent+',{agent:agent,proc:process,node:self},self); 
  Aios.emit('schedule',self); 
}

/** Node Garbage Collection and Timeout Service
 *
 */
node.prototype.service = function (curtime) {
  var nexttime=0,p,pro,sig;
  
  // TS cleanup management        
  this.ts.service(curtime);

  if (curtime<this.timeout) return;

  for (p in this.processes.gone) {
    pro=this.processes.gone[p];
    
    if (pro==undefined) continue;
    if (pro.timeout < curtime) {
      this.processes.gone[p]=undefined;
    } 
    else
      nexttime=min0(nexttime,pro.timeout);      
  }
  for (p in this.signals) {
    sig=this.signals[p];
    
    if (sig==undefined) continue;
    if (sig.timeout < curtime) {
      this.signals[p]=undefined;
    } 
    else
      nexttime=min0(nexttime,sig.timeout);      
  }
  this.timeout=nexttime;
}

// RPC STD request handlers
node.prototype.std_info = function (what)  {
  if (what==undefined) return {
    defaultLevel:this.defaultLevel,
    id:this.id,
    location:this.location,
    position:this.position,
    type:this.type,
  }
  if (what.agent) {
    
  }
}

node.prototype.std_status = function (what)  {
  var data,self=this;
  if (!what || what=='node') return this.stats;
  if (what == 'agents') return Comp.array.filtermap(this.processes.table,function (pro,index) {
      if (pro) return {
        index:index,
        agent:pro.agent.id,
        blocked:pro.blocked,
        suspended:pro.suspended,
        signals:pro.signals.length,
        next:pro.agent.next,
      }
    })
  if (what == 'links') {
    data={}
    for(var p in this.connections) {
      if (!this.connections[p]) continue;
      if (p=='ip') data.ip=Comp.array.map(this.connections[p].links, function (link) {
        return {
          ip:link.ip,
          stats:link.stats(),
          status:link.status('%'),
        }
      })
    }
    return data;
  }
}

/** Release a proecss container. If the process migrated,
 *  move the process container to a cache (signal and group comm.)
 *
 */
 
node.prototype.unregister = function (process) {
  var i,p,remove,
      self=this,tmo,
      agent=process.agent,
      curtime=Aios.time()-current.world.lag;
  // Check pending timers
  remove=false;
  Comp.array.iter(this.timers,function (timer,i) {
    if (timer && timer[0].pid==process.pid) {
      self.timers[i]=_;
      remove=true;
    }
  });
  if (remove) 
    this.timers = 
      Comp.array.filter(this.timers,function (timer) {
        return timer!=undefined;
      });
  // Unlink process
  this.processes.table[process.pid]=_;
  delete this.processes.hash[agent.id];
  if (this.processes.free==none) this.processes.free=process.pid;
  this.ts.cleanup(process);
  process.pid=none;
  process.signals=[];
  process.dead=true;
  this.processes.used--;
  this.stats.agents--;
  
  if (process.move) {
    // Cache migrated process
    tmo=curtime+this.TMO;
    this.processes.gone[process.agent.id]={dir:process.move,timeout:tmo};
    // Maganged in world GC
    this.timeout=min0(this.timeout,tmo);
  }
  Aios.emit('agent-',{agent:agent,node:self,proc:process},self); 
}

/** Create a new node object.
 *  If setcurrent is set, the new node will be set as the current node.
 */
var Node = function (options,setcurrent) {
  var obj=new node(options);
  if (setcurrent) current.node=obj;
  return obj;
}

module.exports = {
  isNode: function (o) { return o instanceof Node }, 
  Node:Node,
  options:options,
  current:function (module) { current=module.current; Aios=module; }
}
