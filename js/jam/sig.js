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
 **    $CREATED:     15/1/16 by sbosse.
 **    $RCS:         $Id: sig.js,v 1.4 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.5.3
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Signal Sub-System
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios = none;

var options = {
  debug : {},
  version:'1.5.3'
}

/** Search a channel that is connected to node 'destnode'
 *
 */
function lookup(node,destnode) {
  var chan,url;
  if (node.connections.ip && node.connections.ip.lookup) {
    url=node.connections.ip.lookup(destnode);
    if (url) return {
      chan:node.connections.ip,
      url:url
    };
  }
}

var sig = {
  broadcast: function (ac,range,sig,arg) {
    var delivered=0;
    // Currently only range=0 is supported => local agents
    if (!Comp.obj.isString(ac)) {current.error='broadcast, invalid class '+ac;throw 'SIGNAL'};
    if (!Comp.obj.isString(sig) && !Comp.obj.isNumber(sig)) {current.error='broadcast, invalid signal '+sig;throw 'SIGNAL'};
    if (range!=0) {current.error='broadcast, invalid range '+range;throw 'SIGNAL'};
    for (var p in current.node.processes.table) {
      var proc=current.node.processes.table[p];
      if (proc && proc.agent.ac == ac && proc.agent.on[sig]) {       
        proc.signals.push([sig,arg,current.process.agent.id]);
        delivered++;
      }
    }
    return delivered;
  },
  // 'to' is the destination agent id
  // 'from' indicates source agent id and remote signal propagation (from node.handle)
  send: function (to,sig,arg,from,hop) {
    var p,node,delivered,curtime;
    // Local agent?
    var pid=current.node.processes.lookup(to);
    if (options.debug.send) console.log('sig.send',to,sig,arg,from,hop,pid);
    if (!Comp.obj.isString(sig) && !Comp.obj.isNumber(sig)) {current.error='send, invalid signal';throw 'SIGNAL'};
    current.node.stats.signal++;
    if (pid!=none) {
      // [sig,arg,from]
      // Check AIOS signals:
      switch (sig) {
        case 'PROC.KILL':
          Aios.kill(to);
          return true;
      }
      current.node.processes.table[pid].signals.push([sig,arg,from||current.process.agent.id]);
      // ?? Aios.emit('schedule',current.node);
      return true;
    } else {
      // console.log('send',current.node.id,to,sig,arg,current.node.processes.gone[to])
      // Agent migrated and still cached?
      if (current.node.processes.gone[to]) {
        if (options.debug.send) print('sig.send',to,sig,arg,from,hop,current.node.processes.gone[to].dir);
        curtime=Aios.time()-current.world.lag;
        // path is in use; update timeout significantly to avoid a lost of the signal path
        current.node.processes.gone[to].timeout = curtime + current.node.TMO*10;
        return route(current.node.processes.gone[to].dir,
                     to,sig,arg,from||current.process.agent.id);
      }
      
      // coupled nodes via grouping? (used in virtual world/simulation)
      // Prevent children-parent ping-pong if agent was not found
      if (hop>2) return true;
      if (current.node.parent) {
        return current.node.parent.handle({to:to,sig:sig,arg:arg,from:from,hop:hop?hop+1:1})
      } else if (current.node.children) {
        delivered=false;
        for(p in current.node.children) {
          node=current.node.children[p];
          delivered=node.handle({to:to,sig:sig,arg:arg,from:from,hop:hop?hop+1:1});
          if (delivered) break;
        }
        if (delivered) return true;
      } 
      
      if (current.node.signals[to]) {
        curtime=Aios.time()-current.world.lag;
        // path is in use; update timeout significantly to avoid a lost of the signal path
        current.node.signals[to].timeout = curtime + current.node.TMO*10;
        return route(current.node.signals[to].dir,
                     to,sig,arg,from||current.process.agent.id);
        
      }
    }
    return false;
  },
  // Send a signal to agents on a specific remote destination node, e.g., to=DIR.DELTA([-1,-2])
  sendto: function (to,sig,arg,from) {
    var delivered=0,i;
    if (!Comp.obj.isString(sig) && !Comp.obj.isNumber(sig)) {current.error='sendto, invalid signal '+sig;throw 'SIGNAL'};
    if ((to.tag||to).indexOf('DIR') != 0) {current.error='sendto, invalid destination '+to; throw 'SIGNAL'};
    if (to == Aios.DIR.ORIGIN || (to.delta && Comp.array.zero(to.delta))) {
      if (sig=='TS.SIG') {
        // copy/collect from remote TS
        for(i in arg) {
          Aios.Ts.agent.out(arg[i]);
        }
      } else for (var p in current.node.processes.table) {
        var proc=current.node.processes.table[p];
        if (proc && proc.agent.on && proc.agent.on[sig]) {  
          proc.signals.push([sig,arg,from||current.process.agent.id]);
          delivered++;
        }
      }
      return delivered;
    } else {
        return route(to,
                     none,sig,arg,current.process.agent.id);    
    }
  },
  sleep: function (tmo) {
    current.process.suspend(tmo?Aios.time()-current.world.lag+tmo:0);
  },
  // Returns signal name
  timer: {
    // Add a oneshot or repeating timer raising a signal 'sig' after timeout 'tmo'.
    add : function (tmo,sig,arg,repeat) {
      if (!Comp.obj.isNumber(tmo)) {current.error='timer, invalid timeout '+tmo; throw 'SIGNAL'};
      if (!Comp.obj.isString(sig)) {current.error='timer, invalid signal '+sig; throw 'SIGNAL'};
      current.node.timers.push([current.process,(Aios.time()-current.world.lag+tmo),sig,arg,repeat?tmo:0]);
      return sig;
    },
    delete: function (sig) {
      current.node.timers=current.node.timers.filter(function (t) {
        return t[2]!=sig
      });
    }
  },
  // return process timeout (absolute time)
  timeout: function (tmo) { return Aios.time()-current.world.lag+tmo },
  wakeup: function (process) {
    if (!process) current.process.wakeup();
    else process.wakeup();
  }
}

/** Route signal to next node 
 *
 */
function route(dir,to,sig,arg,from) {
  var node1=current.node,
      chan=none,
      dest,
      stat,
      alive = function () {return 1},
      sigobj = {sig:sig,to:to||dir,from:from,arg:arg,back:Aios.DIR.opposite(dir,true)},
      msg;
      
  switch (dir.tag||dir) {
    case Aios.DIR.NORTH:  chan=node1.connections.north; break;
    case Aios.DIR.SOUTH:  chan=node1.connections.south; break;
    case Aios.DIR.WEST:   chan=node1.connections.west; break;
    case Aios.DIR.EAST:   chan=node1.connections.east; break;
    case Aios.DIR.UP:     chan=node1.connections.up; break;
    case Aios.DIR.DOWN:   chan=node1.connections.down; break;
    case Aios.DIR.NW:     chan=node1.connections.nw; break;
    case Aios.DIR.NE:     chan=node1.connections.ne; break;
    case Aios.DIR.SE:     chan=node1.connections.se; break;
    case Aios.DIR.SW:     chan=node1.connections.sw; break;
    case 'DIR.IP':        chan=node1.connections.ip; dest=dir.ip; break;
    case 'DIR.DELTA':
      // Simple Delta routing: Minimize [x,y,..] -> [0,0,..] with {x,y,..}
      sigobj.to=Comp.obj.copy(sigobj.to);
      if (dir.delta[0]>0 && node1.connections.east && node1.connections.east.status()) 
        sigobj.to.delta[0]--,chan=node1.connections.east;
      else if (dir.delta[0]<0 && node1.connections.west && node1.connections.west.status()) 
        sigobj.to.delta[0]++,chan=node1.connections.west;
      else if (dir.delta[1]>0 && node1.connections.south && node1.connections.south.status()) 
        sigobj.to.delta[1]--,chan=node1.connections.south;
      else if (dir.delta[1]<0 && node1.connections.north && node1.connections.north.status()) 
        sigobj.to.delta[1]++,chan=node1.connections.north;
      else if (dir.delta[2]>0 && node1.connections.up && node1.connections.up.status()) 
        sigobj.to.delta[2]--,chan=node1.connections.up;
      else if (dir.delta[2]<0 && node1.connections.down && node1.connections.down.status()) 
        sigobj.to.delta[2]++,chan=node1.connections.down;
      break;
    case 'DIR.PATH':
      chan=node1.connections.path; dest=dir.path; 
      break;
    case 'DIR.CAP':
      if (!current.network) {current.error='No connection to server '+dir.cap; return false;};
      chan=node1.connections.dos; dest=Net.Parse.capability(dir.cap).cap;
      break;
    case 'DIR.NODE':
      if (node1.connections.range && 
          node1.connections.range[dir.node] && 
          node1.connections.range[dir.node].status()) 
        chan=node1.connections.range[dir.node],dest=dir.node;
      else {
        // Find node name -> channel mapping
        dest=lookup(node1,dir.node); 
        if (dest) chan=dest.chan,dest=dest.url;
      }
      break;
    default: return false;
  }
  switch (dir.tag||dir) {
    // One hop to next neighbour only?
    case Aios.DIR.NORTH:
    case Aios.DIR.SOUTH:
    case Aios.DIR.WEST:
    case Aios.DIR.EAST:
    case Aios.DIR.UP: 
    case Aios.DIR.DOWN:
    case Aios.DIR.NW:
    case Aios.DIR.NE:
    case Aios.DIR.SE:
    case Aios.DIR.SW:
      sigobj.to=Aios.DIR.ORIGIN; // After messaging signal has arrived
      break;
  }
  if (options.debug.route) console.log('sig.route',node1.id,dir,sigobj,chan!=null);
  
  if (chan==none || !chan.status(dest) /* OLDCOMM || !chan.signal*/) {
    current.error='No connection to direction '+dir; 
    return false;
  };
  node1.stats.signal++;

  if (Aios.options.fastcopy && chan.virtual) msg=sigobj;
  else msg=Aios.Code.toString(sigobj);
  /** OLDCOMM
  chan.signal(msg,dest);
  */
  /* NEWCOMM */
  chan.send({signal:msg,to:dest});
  
  return true;
}

module.exports = {
  agent:sig,
  options:options,
  route:route,
  current:function (module) { current=module.current; Aios=module; }
}
