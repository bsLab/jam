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
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: world.js,v 1.3 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.11.3
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent World Module
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;

var options = {
  debug:{},
  version:'1.11.3',
  verbose:0,
}

/** Word object
 *
 * typeof options = {
 *    classes?,
 *    id?:string,
 *    scheduler?,
 *    verbose?
 * }
 */
var world= function (nodes,options) {
  var main=this;
  options=checkOptions(options,{});
  this.options=options;
  
  this.nodes=nodes||[];
  this.verbose=checkOption(this.options.verbose,0);
  this.hash={};
  this.id=checkOption(this.options.id,Aios.aidgen().toUpperCase());
  this.classes=checkOption(this.options.classes,[]);
  // A time lag (offset), required for simulation
  this.lag=0;
  this.scheduler = this.options.scheduler;
  this.log = Aios.log;
  this.out = function (msg) { main.log('[JAW '+this.id+'] '+msg)};

  /* Create a task context for the scheduler
  */
  
  this.thread = function (arg) {
    var thr = this;
    var dying=false;
    this.nexttime=0;
    this.number=arg;
    this.curtime=0;
    
    this.init = function () {
      main.out('JAM World is starting ..');
    };
    this.run = function () {
      thr.nexttime=Aios.scheduler();
      thr.curtime=Aios.time();
      if (main.verbose>3) main.out(' .. nexttime = '+thr.nexttime+
                                   ' ('+(thr.nexttime>0?thr.nexttime-thr.curtime:0)+')');
    };
    this.sleep = function () {
      var delta;
      thr.curtime=Aios.time();
      delta=thr.nexttime>0?thr.nexttime-thr.curtime:1000;
      if (main.verbose>3) main.out(' .. sleeping for '+delta+' ms');
      main.scheduler.Delay(delta);
    };
    
    this.transitions = function () {
        var trans;
        trans =
            [
                [undefined, this.init, function (thr) {                    
                    return true
                }],
                [this.init, this.run, function (thr) {
                    return true
                }],
                [this.run, this.run, function (thr) {
                    return thr.nexttime<0;
                }],
                [this.run, this.sleep, function (thr) {
                    return !dying;
                }],
                [this.run, this.terminate, function (thr) {
                    return dying
                }],
                [this.sleep, this.run, function (thr) {
                    return true;
                }]
            ];
        return trans;
    };
    this.context = main.scheduler.TaskContext('JAM World'+main.id, thr);
    
  }

};

// Add an agent class constructor (@env can contain resolved constructor function variables). 
// typepf constructor = function|string

world.prototype.addClass = function (name,constructor,env) {
  this.classes[name]=[
    Aios.Code.makeSandbox(constructor,0,env),
    Aios.Code.makeSandbox(constructor,1,env),
    Aios.Code.makeSandbox(constructor,2,env),
    Aios.Code.makeSandbox(constructor,3,env)     
  ];
}

/** Add a node to the world. 
 *
 */
world.prototype.addNode = function (node) {
  this.nodes.push(node);
  if (node.id) this.hash[node.id]=node;
  if (options.verbose) Io.out('World.addNode <'+node.id+'>');
};

/** Connect two nodes in directions dir:node1->node2 and dir':node2->node1
 *  with two virtual channel links that are created here.
 *
 */
world.prototype.connect = function (dir,node1,node2,options) {
  if (!options) options={};
  var chan=Aios.Chan.Virtual(node1,node2,dir,options); 
  switch (dir) {
    case Aios.DIR.NORTH: 
      node1.connections.north=chan.link1;
      node2.connections.south=chan.link2;
      break;
    case Aios.DIR.SOUTH: 
      node1.connections.south=chan.link1; 
      node2.connections.north=chan.link2; 
      break;
    case Aios.DIR.WEST:  
      node1.connections.west=chan.link1; 
      node2.connections.east=chan.link2; 
      break;
    case Aios.DIR.EAST:
      node1.connections.east=chan.link1; 
      node2.connections.west=chan.link2; 
      break;
    case Aios.DIR.NE:
      node1.connections.ne=chan.link1; 
      node2.connections.sw=chan.link2; 
      break;
    case Aios.DIR.NW:
      node1.connections.nw=chan.link1; 
      node2.connections.se=chan.link2; 
      break;
    case Aios.DIR.SE:
      node1.connections.se=chan.link1; 
      node2.connections.nw=chan.link2; 
      break;
    case Aios.DIR.SW:
      node1.connections.sw=chan.link1; 
      node2.connections.ne=chan.link2; 
      break;
    case Aios.DIR.UP:
      node1.connections.up=chan.link1; 
      node2.connections.down=chan.link2; 
      break;
    case Aios.DIR.DOWN:
      node1.connections.down=chan.link1; 
      node2.connections.up=chan.link2; 
      break;
    default: 
      if (current) current.error='EINVALID';
      throw 'CONNECT';
  } 
  chan.link2.on('agent',node1.receive.bind(node2));
  chan.link1.on('agent',node2.receive.bind(node1));
  chan.link2.on('signal',node1.handle.bind(node2));
  chan.link1.on('signal',node2.handle.bind(node1));
  chan.link1.end=node2.id;
  chan.link2.end=node1.id;
  return chan;
};

/** Connect node via a port in direction dir:node->*. The endpoint node * will be
 *  connected if the @snd parameter is specified. Otherwise only an unconnected port is created.
 *  An endpoint can be later connected using the world.connectTo method (if provided by the interface).
 *
 *  One uni- or bidirectional physical link is created and attached to the given node.
 *
 *  typeof options={
 *    compress?:boolean,
 *    oneway?:boolean,
 *    proto:'udp'|'tcp'|'http'|'device',
 *    device?:string,
 *    rcv:url is node endpoint,
 *    snd?:url is remote endpoint
 *    secure?:string,
 *    pem?:{cert:string,key:string},
 *  }
 *  with type url = "<name>:<ipport>" | "<ip>:<ipport>" | "<ipport>"
 *  and ipport = (1-65535) | "*"
 */
world.prototype.connectPhy = function (dir,node,options) {
  var self=this,chan,name=Aios.DIR.to(dir);
  if (!options) options={};
  chan=Aios.Chan.Physical(node,dir,options); 
  switch (dir.tag||dir) {
    case 'DIR.IP':
      // Update routing table of router!
      if (!node.connections.ip) node.connections.ip=new Aios.Chan.iprouter();
      node.connections.ip.addLink(chan.link);
      chan.router=node.connections.ip;
      break;
    default: 
      if (!name) {
        if (current) current.error='ENOCHANNEL';
        throw 'CONNECT';
      }
      node.connections[name]=chan.link;
  } 
  chan.link.on('agent',node.receive.bind(node));
  chan.link.on('signal',node.handle.bind(node));
  chan.link.on('class',function (obj){ for(var p in obj) self.addClass(p,obj[p].fun,obj[p].env)});
  return chan;
};

/** Connect a physical link of node @node to a remote endpoint (if curerently not connected) specified by the @dir parameter.
 *  typeof @dir = {tag,ip?,device?} with tag='DIR.IP'|'DIR.NORTH',..
 *
 */
world.prototype.connectTo = function (dir,node,options) {
  var chan,tokens,to=dir.ip,name=Aios.DIR.to(dir);
  if (!node) node=current.node;
  chan=node.connections[name];
  if (chan && (chan.status(to) || !chan.connect)) chan=undefined;
  if (chan) chan.connect(to,options);
}

/** Check connectivity to a specific node or a set of nodes
 *
 */
world.prototype.connected = function (dir,node) {
  var name=Aios.DIR.to(dir),list;
  chan=node.connections[name];
  switch (dir.tag||dir) {
    case Aios.DIR.tag.PATH:
      return chan && chan.status(dir.path);
      break;
    case Aios.DIR.tag.IP:
      // DIR.IP('*') returns all linked IP routes
      // DIR.IP('%') returns all linked nodes (names)
      return chan && chan.status(dir.ip); 
      break;
    case Aios.DIR.tag.NODE:
      // DIR.NODE('*') returns all linked nodes on all connections!
      if (dir.node=='*') {
        // Check all conenctions for remote node information
        list=[];
        if (node.connections.ip) list=list.concat(node.connections.ip.status('%'));
        return list; 
      } else if (typeof dir.node == 'string') {
        // Return link (IP)
        if (node.connections.ip && node.connections.ip.lookup) { 
          found=node.connections.ip.lookup(dir.node);
          return found?Aios.DIR.IP(found):none;
        }
      }
      break;
    case Aios.DIR.tag.DELTA:
      // a rough guess (no nw/sw/se/ne)
      if (dir.delta[0]==1) chan=node.connections.east;
      else if (dir.delta[0]==-1) chan=node.connections.west;
      else if (dir.delta[1]==1) chan=node.connections.north;
      else if (dir.delta[1]==-1) chan=node.connections.south;
      else if (dir.delta[2]==1) chan=node.connections.up;
      else if (dir.delta[2]==-1) chan=node.connections.down;
      return chan && chan.status(); 
      break;
    default:
      return (chan && chan.status(dir.ip||dir.node||dir.path))||false;    
  }  
}

/** Disconnect a physical link of node @node to a remote endpoint (if curerently connected) specified by the @dir parameter.
 *
 */
world.prototype.disconnect = function (dir,node) {
  var chan;
  switch (dir.tag||dir) {
    case 'DIR.IP':
      if (node.connections.ip && 
          node.connections.ip.status(dir.ip) && 
          node.connections.ip.disconnect) 
        node.connections.ip.disconnect(dir.ip); 
      break;
  }  
}


/** Find an agent in the world by it's id  and class (option), 
 *  or agents matching a regular expression by their id. 
 *
 */
world.prototype.getAgent = function (id,ac) {
  var res = this.getAgentProcess(id,ac);
  if (res && Comp.obj.isArray(res)) return res.map(function (ap) { return ap.agent });
  if (res) return res.agent;
  return;
};

world.prototype.getAgentProcess = function (id,ac) {
  var matches=Comp.obj.isRegex(id)?[]:undefined;
  for(var n in this.nodes) {
    var table=this.nodes[n].processes.table;
    for(var p in table) {
      if (!table[p]) continue;
      if (!matches && table[p].agent.id==id && (!ac || table[p].agent.ac==ac)) 
        return table[p];
      if (matches && id.test(table[p].agent.id) && (!ac || table[p].agent.ac==ac)) 
        matches.push(table[p]);
    }
  }
  return matches;
};


/** Find a node in the world by it's id or nodes matching a regular expression. 
 *
 */
world.prototype.getNode = function (nodeid) {
  if (Comp.obj.isRegex(nodeid)) {
    var res=[];
    for(var n in this.nodes) {
      if (nodeid.test(this.nodes[n].id)) res.push(this.nodes[n]);
    }
    return res;
  } else {
    if (!this.hash[nodeid] && options.verbose) Io.out('World.getNode: not found <'+nodeid+'>');
    return this.hash[nodeid];
  }
};

world.prototype.info = function () {
  var obj={},stat;
  obj.agents=0;
  obj.transferred=0;
  obj.links=0;
  obj.ports=0;
  for(var n in this.nodes) {
    obj.agents += this.nodes[n].processes.used;
    for (var l in this.nodes[n].connections) {
      if (this.nodes[n].connections[l]) {
        obj.ports++;
        obj.transferred += this.nodes[n].connections[l].count();
        if (this.nodes[n].connections[l].stats) {
          stat = this.nodes[n].connections[l].stats();
          obj.links += (stat.links||0);
        }
      }
    }
  }  
  return obj;
}


world.prototype.init = function () {
}

/** Lookup nodes (using patterns and providing broker support)
 *
 */
world.prototype.lookup = function (dir,callback,node) {
  switch (dir.tag||dir) {
    case Aios.DIR.tag.PATH:
      if (node.connections.ip && node.connections.ip.lookup) return node.connections.ip.lookup(dir.path,callback);
      break;
    default:
      if (callback) callback();
  }
}

world.prototype.print = function (summary) {
  var str='**** WORLD '+this.id+' ****'+NL;
  var res = Io.mem();
  str += 'DATA='+int(res.data/1024)+' MB HEAP='+int(res.heap/1024)+' MB'+NL;
  for(var n in this.nodes) {
    str += this.nodes[n].print(summary);
  }
  return str;
}

/** Disconnect and remove a node from the world. 
 *  The node must be destroyed explicitly.
 *
 */
world.prototype.removeNode = function (nodeid) {
  var c,c2,conn,thenode,chan,node2;
  this.nodes=Comp.array.filter(this.nodes,function (node) {
    if (node.id==nodeid) thenode=node;
    return node.id!=nodeid;
  });
  this.hash[nodeid]=undefined;
  if (thenode) for(c in thenode.connections) {
    conn=thenode.connections[c];
    if (conn && conn.end) {
      node2=this.getNode(conn.end);
      if (node2) for (c2 in node2.connections) {
        // Unlink?
        if (node2.connections[c2] && node2.connections[c2].end==nodeid)
          node2.connections[c2]=undefined;
      }
    }
  }
  if (options.verbose) Io.out('World.removeNode <'+nodeid+'>');

};

world.prototype.start = function () {
  var self=this;
  if (this.scheduler) {
    proc = new this.thread(0);
    this.context=proc.context;
    this.scheduler.Add(proc.context);
  }
  this.gc = setInterval(function () {
    var node,n,p;
    if (self.verbose>3) self.out('GC');
    for(n in self.nodes) {
      node=self.nodes[n];
      for(p in node.processes.gone) {
        if (node.processes.gone[p]) {
          node.processes.gone[p].tmo -= 500;
          if (node.processes.gone[p].tmo<=0) node.processes.gone[p]=undefined;
        }
      }
    }
  },500);
}

world.prototype.stop = function () {
}

var World = function (nodes,options) {
  var obj=new world(nodes,options);
  current.world=obj;
  return obj;
}

module.exports = {
  options:options,
  World:World,
  current:function (module) { current=module.current; Aios=module}
}
