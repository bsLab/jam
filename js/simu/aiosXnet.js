// Simulation extension for phyiscal (behaviorual) agents
var RTree   = Require('rtree/rtree');
var RBush   = Require('rtree/rbush');
var RBushKnn = Require('rtree/rbush-knn');
var Comp = Require('com/compat');

var current=none;
var Aios = none;

// patchgrid agent instance counter
var instances = 0;

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

/* 
** Generic simulation object iterator (NetLogo comp.)
** 1. Agents
** ask('agent','*',cb)  // all
** ask('agent',null,cb) // here
** ask('agent',dir,cb)
** ask('agent',bbox,cb)
** ask('agents-class','*',cb)
** ask('agent',id:string,cb)
** ask('agent',[id1:string,id2,..],cb)  
** ask('agent',5,cb) == in-radius 5
** ask('agent',[x,y],cb) == @(x,y)
** ask('agent',{x,y,w,h},cb?) == within[x,y,x+w,y+h]
** ask('agent',{x0,y0,x1,y1},cb?) == within[x,y,x+w,y+h]
** ask('agent',{dx,dy,w,h},cb?) == within[dx+x0,dy+y0,x0+dx+w,y0+dy+h]
** ask('agent',{x,y,w,h},cb?) == within[x,y-x+w,y+h]
** => returns only physical agents!
**
** 2. Resources
** ask('resource',..)
** ask('resources-class',..)
** 
** 3. Patches
** ask('patch',..)
** ask('patches',..)
**
** Groups:
** ask('children')
** ask('parent')
**
** ask('distance',dir|number|bbox)
**
** Note: callback is executed in CURRENT agent context unless remote flag is set True:
** typeof callback = function (agent object,node object) 
**
** TODO: check for consitency when using arrow callback functions (no this rebind possible)
*/
function aiosXnet(aiosXsimu,module) {
  var self=this;
  
  Aios=module;current=Aios.current;
  
  function ask(what,who,callback,remote) {
    var type = self.gui.classObject(what)||what,
               node = current.node,nodeId,
               pos = node.position, bbox, jump,
               desc,id,pro,set=[],set2=[],set3=[],multiple=true,
               i,j,r,row,col,p,q,agent,agents,nodes,pro,
               name=what.match(/[a-z]+-(.+)/,'');
    if (!self.options.patch) return;
    if (name) name=name[1];
    if (what.indexOf(type+'s')==0) type += 's';
    switch (type) {

      case 'agent':
        multiple=false;
      case 'agents':
        if (typeof who == 'string') {
          // entire world has to be searched for agent
          if (who=='*') who=/.+/;
          else if (self.cache.agent2node[who]) {
              agent=self.cache.agent2node[who].getAgentProcess(0);
              set=[{
                agent:agent.agent.id,
                class:agent.agent.ac,
                pos:agent.node.position,
                distance:distance(pos,agent.node.position),
                obj:agent.agent
               }]
              set2=[agent.node]
          }
          if (set.length==0) {
            agents=self.world.getAgentProcess(who,name);
            if (agents) {
              if (Comp.obj.isArray(agents)) {
                set=agents.map(function (ap)  { 
                  return {
                    agent:ap.agent.id,
                    class:ap.agent.ac,
                    pos:ap.node.position,
                    distance:distance(pos,ap.node.position),
                    obj:ap.agent
                  }
                });
                set2=agents.map(function (ap) { return ap.node });                
              } else {
                agent=agents;
                self.cache.agent2node[agent.agent.id]=agent.node;
                node = agent.node;
                set.push({
                  agent:agent.agent.id,
                  class:agent.agent.ac,
                  pos:agent.node.position,
                  distance:distance(pos,agent.node.position),
                  obj:agent.agent
                });
                set2.push(node);
                if (remote) set3.push(agent);
              } 
            }
          }
        } else if ((Comp.obj.isArray(who) && who.length==2)  || who==null) {
          if (!who) who=[pos.x,pos.y];
          if (self.agentMap) {
            if (!self.checkBounds(who[0],who[1])) return [];
            row=self.agentMap[who[1]];
            col=row[who[0]];
            for(p in col) {
              agent=self.getAgentProcess(col[p],p);
              if (agent && (!name || agent.agent.ac==name)) {
                set.push({
                  agent:agent.agent.id,
                  class:agent.agent.ac,
                  pos:agent.node.position,
                  distance:distance(pos,agent.node.position),
                  obj:agent.agent
                });
                set2.push(agent.node);
                if (remote) set3.push(agent);
              }
            }
          }            
        } else if (typeof who == 'number' || Comp.obj.isObj(who)) {
          // Bounding box {}? 
          bbox=bbox2pp(makeBbox(pos,who));
          // find agents on nodes in the neighbourhood
          if (self.agentMap) {
            for(i=bbox.x0;i<=bbox.x1;i++)
              for(j=bbox.y0;j<=bbox.y1;j++) {
                if (!self.checkBounds(i,j)) continue;
                row=self.agentMap[j];
                col=row[i];
                for(p in col) {
                  agent=self.getAgentProcess(col[p],p);
                  if (agent && (!name || agent.agent.ac==name)) {
                    set.push({
                      agent:agent.agent.id,
                      class:agent.agent.ac,
                      pos:agent.node.position,
                      distance:distance(pos,agent.node.position),
                      obj:agent.agent
                    });
                    set2.push(agent.node);
                    if (remote) set3.push(agent);
                  }
                }
              }
          } else {
            if (!name) return;
            self.world.nodes.forEach(function (_node) {
              if (wihtin(_node.position,node.position,who)) {
                agents=_node.getAgentProcess(/[a-zA-Z]+/);
                for(p in agents) {
                  if (agents[p].agent.ac==name) {
                    set.push({
                      agent:agents[p].agent.id,
                      class:agents[p].agent.ac,
                      pos:_node.position,
                      distance:distance(pos,_node.position),
                      obj:agents[p].agent
                   });
                    set2.push(_node);
                  }
                }
              }
            })
          }
        }
        break;

      case 'resource':
        multiple=false;
      case 'resources':
        var px = pos.x * self.options.patch.width,
            py = pos.y * self.options.patch.height;

        if (typeof who == 'string' && who.indexOf('DIR.')<0 && who != '*') {
            var obj = self.gui.objects['resource['+who+']'];
            if (obj) set = {resource:who,
                    class:obj.class,
                    data:obj.data,
                    distance:distance2Rect({x:px,y:py},
                                           obj.visual,
                                           {x:self.options.patch.width,
                                            y:self.options.patch.height}),
                    x:int(obj.visual.x/self.options.patch.width),
                    y:int(obj.visual.y/self.options.patch.height),
                    w:int(obj.visual.w/self.options.patch.width),
                    h:int(obj.visual.h/self.options.patch.height)
            }
        } else if (typeof who == 'number' || Comp.obj.isObj(who) || who=='*' ||
              (Comp.obj.isArray(who) && who.length==2) || who==null) {
          if (!who) who=[pos.x,pos.y];
          if (Comp.obj.isArray(who)) bbox={x:who[0],y:who[1],w:1,h:1};  // or w/h=0
          else if (who=='*') bbox={x:0,y:0,w:self.options.x,h:self.options.y};
          else bbox=makeBbox(pos,who);
          set=self.rtree.search(bbox).map(function (rid) {
            var obj = self.gui.objects[rid];
            if (name && obj.class != name) return;
            return {resource:rid.replace(/resource\[([^\]]+)\]/,'$1'),
                    class:obj.class,
                    data:obj.data,
                    distance:distance2Rect({x:px,y:py},
                                           obj.visual,
                                           {x:self.options.patch.width,
                                            y:self.options.patch.height}),
                    x:int(obj.visual.x/self.options.patch.width),
                    y:int(obj.visual.y/self.options.patch.height),
                    w:int(obj.visual.w/self.options.patch.width),
                    h:int(obj.visual.h/self.options.patch.height)
            }
          }).filter (function (o) {return o});
        } 
        break;

      case 'patch':
        multiple=false;
      case 'patches':
        if ((Comp.obj.isArray(who) && who.length==2) || who==null) {
          if (!who) who=[pos.x,pos.y];
          if (!self.checkBounds(who[0],who[1])) return [];
          set=self.patches[who[1]][who[0]];
        } else if (who=='*') {
           set=self.patches;
        } else if (typeof who == 'number' || Comp.obj.isObj(who)) {
          // Bounding box? 
          bbox=bbox2pp(makeBbox(pos,who));
          // find patches in the neighbourhood
          if (name == 'array') {
            for(j=bbox.y0;j<=bbox.y1;j++) {
              for(i=bbox.x0;i<=bbox.x1;i++) {
                if (!self.checkBounds(i,j)) continue;
                set.push(self.patches[j][i])
              }
            }
          } else for(j=bbox.y0;j<=bbox.y1;j++) {
            row=[]
            for(i=bbox.x0;i<=bbox.x1;i++) {
              if (!self.checkBounds(i,j)) continue;
              row.push(self.patches[j][i])
            }
            if (row.length==1) set.push(row[0])
            else set.push(row)
          }
        }
        break;

      // groups
      case 'parent':
        if (node.parent) {
          agents = node.parent.getAgent(/.+/);
          set=agents && agents[0]?agents[0].id:undefined;
        }
        break;
      case 'children':
        multiple=true;
        if (node.children) {
          agents=[]
          node.children.forEach(function (child) {
            agents = agents.concat(child.getAgent(/.+/));
          })
          set=agents;
        }
        break;

      case 'distance':
        function lookup(x,y) {
          var row,col,p,a=[];
          if (jump && jump.x == x && jump.y == y) return; 
          row=self.agentMap[y];
          if (!row) return;
          col=row[x];
          if (!col) return;
          for(p in col) {
            a.push(self.getNode(col[p]));
          }
          return a.length?a:null;
        }
        name=name||'';
        if ((typeof who == 'string' && who.indexOf('DIR.')==0) ||
            typeof who == 'number' || Comp.obj.isObj(who)) {
          bbox={x:pos.x,y:pos.y}
          if (typeof who == 'number') bbox.distance=who;
          if (typeof who == 'string') bbox.dir=who;
          if (typeof who == 'object') bbox.dir=who.dir,bbox.distance=who.distance;
          agents=null;
          switch (bbox.dir) {
            case Aios.DIR.NORTH: 
              bbox={y1:bbox.y-1,y0:bbox.distance?(bbox.y-bbox.distance):0,
                    x0:pos.x,x1:pos.x,dir:bbox.dir}; break;
            case Aios.DIR.SOUTH: 
              bbox={y0:bbox.y+1,y1:bbox.distance?(bbox.y+bbox.distance):self.options.y-1,
                    x0:pos.x,x1:pos.x,dir:bbox.dir}; break;
            case Aios.DIR.WEST:  
              bbox={x1:bbox.x-1,x0:bbox.distance?(bbox.x+bbox.distance):0,
                    y0:pos.y,y1:pos.y,dir:bbox.dir}; break;
            case Aios.DIR.EAST:  
              bbox={x0:bbox.x+1,x1:bbox.distance?(bbox.x+bbox.distance):self.options.x-1,
                    y0:pos.y,y1:pos.y,dir:bbox.dir}; break;
          }
          if (name.indexOf('resource')<0) {
            // 1. Agents
            // Jump over attached group children            
            if (node.children) {
              jump=node.children[0].position;
            }
            switch (bbox.dir) {
              case Aios.DIR.NORTH: for(i=bbox.y1;i>=bbox.y0 && !nodes;i--) nodes=lookup(pos.x,i); break;
              case Aios.DIR.SOUTH: for(i=bbox.y0;i<=bbox.y1 && !nodes;i++) nodes=lookup(pos.x,i); break;
              case Aios.DIR.WEST:  for(i=bbox.x1;i>=bbox.x0 && !nodes;i--) nodes=lookup(i,pos.y); break;
              case Aios.DIR.EAST:  for(i=bbox.x0;i<=bbox.x1 && !nodes;i++) nodes=lookup(i,pos.y); break;
              default:
                // radius or full bbox search?
                for(r=1;r<=bbox.distance;r++) {
                  // TODO 
                } 
                break;
            }
            if (nodes) nodes = {
              distance:distance(pos,nodes[0].position),
              objects:nodes.map(function (node) { 
               var a = node.getAgent(0); 
               return a?{agent:a.id,class:a.ac,pos:node.position}:undefined 
              })
            }
           }
          if (name.indexOf('agent')<0) {
            if (name.indexOf('resource')==0) name=null; 
            // 2. Resources
            bbox=pp2bbox(bbox)
            self.rtree.search(bbox).forEach(function (rid) {
              var obj = self.gui.objects[rid];
              var px = pos.x * self.options.patch.width,
                  py = pos.y * self.options.patch.height;
              if (name && obj.class != name) return;
              // only resources with distance < nodes.distance are considered
              var d = distance2Rect({x:px,y:py},
                                     obj.visual,
                                     {x:self.options.patch.width,
                                     y:self.options.patch.height})
              rid=rid.replace(/resource\[([^\]]+)\]/,'$1');
              if (nodes && nodes.distance==d) nodes.objects.push({
                    resource:rid,
                    class:obj.class,
                    data:obj.data,
                    distance:d,
                    x:int(obj.visual.x/self.options.patch.width),
                    y:int(obj.visual.x/self.options.patch.height),
                    w:int(obj.visual.w/self.options.patch.width),
                    h:int(obj.visual.h/self.options.patch.height)                
              }); else if (!nodes || d < nodes.distance) nodes = {
                distance:d,
                objects:[{
                    resource:rid,
                    class:obj.class,
                    data:obj.data,
                    distance:d,
                    x:int(obj.visual.x/self.options.patch.width),
                    y:int(obj.visual.x/self.options.patch.height),
                    w:int(obj.visual.w/self.options.patch.width),
                    h:int(obj.visual.h/self.options.patch.height)
                }]
              }  
            })
          }
          return nodes;
       } else if (typeof who == 'string') {
          // specific object id
          // 1. Agent?
          if (self.cache.agent2node[who]) {
            return distance(pos,self.cache.agent2node[who].position)
          }  
        }
        break;
      default:
        remote=false;
        break;
    }
    if (set && callback) {
      if (Comp.obj.isMatrix(set))
        for(p in set) {
          for (q in set[p]) {
            if (set2.length)
              callback.call(current.process.agent,set[p][q],set2[p][q],current.process.agent);
            else 
              callback.call(current.process.agent,set[p][q],q,p,current.process.agent);
          }
        } 
      else if (Comp.obj.isArray(set))
        for(p in set) {
          if (remote && set3.length) {
            pro=set3[p];
            Aios.CB(pro,callback,[pro.agent])
          } else
            callback.call(current.process.agent,set[p],set2[p],current.process.agent);
        }
      else {
          if (remote && set3) {
            pro=set3;
            Aios.CB(pro,callback,[pro.agent])
          } else
            callback.call(current.process.agent,set,set2,current.process.agent);
      }
    }
    if (!multiple && set) return set.length==0?null:(set.length==1?set[0]:set);   
    else return set;
  }
  /*
  ** Generic create operation (NetLogo comp., physical agents)
  **
  ** Note: callback is executed in that agent context!
  */
  function create(what,num,callback) {
    var type = whatType(what),
               node = current.node,nodeId,
               desc,id,pro,
               set=[],
               name=whatName(what);
    if (!self.options.patch) return;
    for(var i=0;i<num;i++) switch (type) {
      case 'agent':
      case 'agents':
        // 1. Get the agent descriptor
        if (!name) self.err('create: agent class is missing')
        desc=self.model.agents[name];
        if (!desc) self.err('create: agent class '+name+' is unknown')
        if (desc.type == 'physical') {
          // Physical agent: Create a  <node,agent> tuple; create agent on this node
          nodeId = aiosXsimu.createNode(
                    name,
                    node.position.x,  // use current position
                    node.position.y,
                    name+'-'+instances);
          if (!nodeId) self.err('create: node class '+name+' cannot be created')
          id=aiosXsimu.createOn(nodeId,name,{},3);
          if (self.options.patch)
            self.agentMap[node.position.y][node.position.x][id]=nodeId;
          pro=self.getProcess(nodeId,id);
          // the callback must be executed before 
          // agent starts execution! Prevent transition after CB
          pro.notransition=true;            
          self.cache.agent2node[id]=pro.node;
          pro.type=pro.node.type='physical';
          // cover arrow functions too, no this rebind possible! first argument is self, too!
          if (callback) Aios.CB(pro,callback,[pro.agent,i]);
          set.push(id);
          instances++;
        } else {
          // Create a new computational agent on this node
          nodeId=node.id; 
          id=aiosXsimu.createOn(nodeId,name,{},3);
          pro=self.getProcess(nodeId,id);
          pro.notransition=true;            
          if (callback) Aios.CB(pro,callback,[pro.agent,i])
        }
        break;
    }
    return set.length==1? set[0]:set
  }

  function die (who) {
    var node=current.node,
        agent=current.process.agent;

    if (!who) {
      delete self.cache.agent2node[agent.id];
      Aios.kill();
      if (self.world.getNode(node.id)) aiosXsimu.deleteNode(node.id);
    } else {
      // TODO
    }
  }

  function forward(delta) {
    var i,x,y,
        node=current.node,
        _node,_agent,
        agent=current.process.agent,
        desc=self.model.agents[agent.ac],id,
        agents=[current.process],
        Delta=[0,0];
    if (!self.options.patch || desc.type != 'physical') return;
    id='node['+node.id+']';
    var visual=aiosXsimu.getVisual(id);
    if (!visual.heading) visual.heading=0;
    if (visual.heading<90) Delta[1] -= delta;   
    else if (visual.heading<180) Delta[0] += delta;   
    else if (visual.heading<270) Delta[1] += delta;   
    else if (visual.heading<360) Delta[0] -= delta;

    if (node.children) {
      node.children.forEach(function (child) {
        agents.push(child.getAgentProcess(0));
      })
    }
    // check spatial bounds of all agents to be moved
    for(i in agents) {
      _agent=agents[i];
      _node=_agent.node;
      x=_node.position.x+Delta[0];
      y=_node.position.y+Delta[1];
      if (!self.checkBounds(x,y)) return;
    }
    // passed - now move all agents
    for(i in agents) {
      _agent=agents[i];
      _node=_agent.node;
      x=_node.position.x+Delta[0];
      y=_node.position.y+Delta[1];
      aiosXnet.setxy(x,y,'agent',_agent)
    }

  }

  function globals() {
    return self.model.parameter
  }

  function get(p) {
    var agent=current.process.agent,
        node=current.node,id,
        desc=self.model.agents[agent.ac],
        visual;
    if (!self.options.patch) return;
    switch (p) {
      case 'color':
        id='node['+node.id+']';
        visual=aiosXsimu.getVisual(id);
        return visual.fill.color;
        break;   
      case 'heading':
        id='node['+node.id+']';
        visual=aiosXsimu.getVisual(id);
        return visual.heading;
        break;   
      case 'shape':
        id='node['+node.id+']';
        visual=aiosXsimu.getVisual(id);
        return visual.shape;
        break;   
    }
  }

  group = {
    add: function (parent,children,align) {
      var agent,desc,node,pos
      agent=self.world.getAgentProcess(parent);
      // if (!self.options.patch) return;
      if (agent) {
        node = agent.node;
        pos = Comp.obj.copy(node.position);
        switch (align) {
          case Aios.DIR.NORTH: pos.y--; break;
          case Aios.DIR.SOUTH: pos.y++; break;
          case Aios.DIR.WEST : pos.x--; break;
          case Aios.DIR.EAST : pos.x++; break;
        }
        if (!self.checkBounds(pos.x,pos.y)) return;
        desc=self.model.agents[agent.agent.ac];
        if (desc.type != 'physical') return;
        if (!node.children) node.children=[];
        children.forEach(function (child) {
          var agent2 = self.world.getAgentProcess(child);
          if (agent2) {
            var desc2=self.model.agents[agent2.agent.ac];
            var node2 = agent2.node;
            if (desc2.type != 'physical') return;
            var pos2 = Comp.obj.copy(pos);
            node.children.push(node2);
            node2.parent = node;
            // move node container to group position
            delete self.agentMap[node2.position.y][node2.position.x][agent2.agent.id];
            node2.position = pos2;
            self.agentMap[pos2.y][pos2.x][agent2.agent.id]=node2.id;
            self.moveObjectTo('node['+node2.id+']',
                               self.world2draw(pos2).x,self.world2draw(pos2).y);
          }
         })
      }
    },
    rem: function (parent, children) {
      var agent,desc,node,pos
      agent=self.world.getAgentProcess(parent);
      if (agent) {
        node = agent.node;
        if (!node.children) return;
        children.forEach(function (child) {
          var agent2 = self.world.getAgentProcess(child);
          if (agent2) {
            var desc2=self.model.agents[agent2.agent.ac];
            var node2 = agent2.node;
            if (desc2.type != 'physical') return;
            var pos2 = Comp.obj.copy(pos);
            node.children=node.children.filter(function (_node) { return _node.id!=node2.id });
            node2.parent = null;
          }
         })
      }
    },
  }

  function set(p,v) {
    var node=current.node,
        agent=current.process.agent,
        desc=self.model.agents[agent.ac],
        obj;
    if (!self.options.patch) return;
    switch (p) {
      case 'color':
        if  (desc.type == 'physical') {
          // Change color of node and agent
          id='node['+node.id+']';
          aiosXsimu.changeVisual(id,{fill:{color:v}});
          id='agent['+agent.ac+':'+agent.id+':'+node.id+']';
          aiosXsimu.changeVisual(id,{fill:{color:v}});
        } else {
          // Change color of agent
        }
        break;
      case 'shape':
        if  (desc.type == 'physical') {
          // Change shape of node
          id='node['+node.id+']';
          aiosXsimu.changeVisual(id,{shape:v,align:v=='circle'?'center':undefined});
        } else {
          // Change color of agent
        }
        break;
    }
  }

  // TODO resources, ..
  function setxy(x,y,what,who) {
    var type=what||'agent',
        desc,
        pos,
        node=current.node,
        agent=current.process.agent;
    // only discrete coordinates allowed (due to pos-map tables)
    x=x|0; y=y|0;
    if (!self.options.patch) return;
    // self.log([x,y,type,agent.ac])
    switch (type) {
      case 'agent':
      case 'agents':
        if (typeof who == 'string') {
          agent=aiosXnet.ask('agent',who);
          if (!agent) return;
        } else if (typeof who == 'object') {
          agent=who.agent;  // agent process!
          node=who.node;
        } 
        desc=self.model.agents[agent.ac];
        if (!desc) return;
        if (desc.type == 'physical') {
          // move agent and its node!
          if (!self.checkBounds(x,y)) return;
          pos={x:x,y:y};
          // checkBounds(x,y)
          if (node.position) {
            // Invalidate old worldmap entry
            delete self.agentMap[node.position.y][node.position.x][agent.id];
          }
          self.agentMap[y][x][agent.id]=node.id;
          self.moveObjectTo('node['+node.id+']',
                             self.world2draw(pos).x,self.world2draw(pos).y);
          node.position=pos;

          // Move child nodes, too (but not parent vice versa)!
          if (node.children) {
            node.children.forEach(function (node2) {
              node2.processes.table.forEach(function (agent2) {
                if (!agent2) return;
                if (self.model.agents[agent2.agent.ac] && 
                    self.model.agents[agent2.agent.ac].type != 'physical') return;
                if (node2.position) {
                  // Invalidate old worldmap entry
                  delete self.agentMap[node2.position.y][node2.position.x][agent2.agent.id];
                }
                self.agentMap[y][x][agent2.agent.id]=node2.id;
              })
              self.moveObjectTo('node['+node2.id+']',
                                 self.world2draw(pos).x,self.world2draw(pos).y);
              node2.position=pos;
            })
          }
        } else {
          // not supported!
        }
        break;
    }
  }
  // Turn agent or group of agents ...
  function turn(angle) {
    var node=current.node,_node,_pos,visual,agents,
        agent=current.process.agent, relative,
        desc=self.model.agents[agent.ac],id,
        pos=node.position,delta=0,Delta=[0,0];
    switch (angle) {
      case Aios.DIR.NORTH: angle=0;    break;
      case Aios.DIR.SOUTH: angle=180;  break;
      case Aios.DIR.WEST:  angle=270;  break;
      case Aios.DIR.EAST:  angle=90;   break;
      default:
        if (typeof angle == 'number') relative=true;
    }
    if (!self.options.patch || desc.type != 'physical') return;
    id='node['+node.id+']';
    visual = aiosXsimu.getVisual(id)
    if (!visual.heading) visual.heading=0;
    if (relative) angle=(visual.heading+angle) % 360;
    delta=angle-visual.heading;
    // translate group children?
    if (node.children && node.children.length) {
      _pos=node.children[0].position;
      // All children are overlayed !?
      Delta=[_pos.x-pos.x,_pos.y-pos.y]
      self.log({from:Delta, to:rotate(Delta,delta)})
      Delta=rotate(Delta,delta);
      node.children.forEach(function (child) {
        var x=pos.x+Delta[0],y=pos.y+Delta[1];
        if (!self.checkBounds(x,y)) return;       
        var _agent = child.getAgentProcess(0);
        aiosXnet.setxy(x,y,'agent',_agent)
      });
    }
    // update visual heading parameter  
    visual.heading = angle;
  }
  function within(x,y,bbox) {
    return  x >= bbox.x && 
            y >= bbox.y && 
            x < (bbox.x+bbox.w) &&
            y < (bbox.y+bbox.h)
  }
  return {
    ask:ask,
    create:create,
    die:die,
    forward:forward,
    globals:globals,
    get:get,
    group:group,
    set:set,
    setxy:setxy,
    turn:turn,
    within:within
  }

}

module.exports = aiosXnet
