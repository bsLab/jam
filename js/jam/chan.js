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
 **    $CREATED:     09-02-16 by sbosse.
 **    $RCS:         $Id: chan.js,v 1.4 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.16.1
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Node Communication Module offering P2P communication with another nodes
 **
 **  1. Virtual Link: Connecting virtual (logical) nodes using buffers
 **
 **  2. Physical Link: Connecting physical nodes (on the same physical host or remote hosts) 
 **  using AMP protocol and IP communication (including endpoint pairing across NAT routers
 **  using a rendezvous broker service)
 **    
 **  3. Physical Link: Connecting node processes (in a cluster on the same physical host) using process streams 
 **
 **   For IP-based communication ports an internal IP router is provided offering operation 
 **   of multiple ports and connections.
 **
 **   Communciation link object provided by 1.-3.:
 **
 **     type link = {
 **       on: method (@event,@handler) with @event={'agent'|'signal'|'class'},
 **       send: method (@msg) with @msg:{agent:string|object,to:dir}|{signal:string|object},to:dir},
 **       status: method (dir) -> boolean,
 **       count: method () -> number is returning number of received (phy only) and sent bytes,
 **       connect?:method (@to),
 **       disconnect?:method (@to),
 **       start?:method,
 **       stop?:method
 **     } 
 **
 **
 ** Events, emitter: link+  link-  error(err="link"|string,arg?)
 **
 **
 ** TODO:
 **   - Phy capability protected communication and operations
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');
var Amp = Require('jam/amp');
var Sec = Require('jam/security');

var options = {
  debug:{},
  verbose:1,
  version:'1.15.6'
}
module.exports.options=options;

var SLINK = {
  INIT:'INIT',
  INITED:'INITED',
  RUNNING:'RUNNING'
}

/******************** 
 *  Virtual Circuit
 ********************
 */
 
var virtual= function (node1,node2,dir,options) {
  var self=this;
  this.node1=node1;
  this.node2=node2;
  this.dir=dir; // node1 -> node2
  this.buffer1=[];
  this.buffer2=[];
  this.count1={rcv:0,snd:0};
  this.count2={rcv:0,snd:0};
  this.compress=options.compress;

  /* NEWCOMM */
  this.handler1=[];
  this.handler2=[];
  
  // External API
  this.link1 = {
    control : function (msg,to,callback) {
      // TODO
    },
    on: function (event,callback) {
      var data;
      self.handler1[event]=callback;
      if (event=='agent' && self.buffer2.length>0) {
          // Agent receiver
          data=Comp.array.pop(self.buffer2);        
          if (self.compress) data=Lz.decompress(data);
          callback(data);
      }
    },

    send: function (msg) {
      var data;
      if (msg.agent) {
        // Agent migration
        data=msg.agent;
        if (self.compress) data=Lz.compress(data);
        if (self.handler2.agent) self.handler2.agent(self.compress?Lz.decompress(data):data);
        else self.buffer1.push(data);
        if (data.length) self.count1.snd += data.length; else self.count1.snd++;
      } else if (msg.signal) {
        // Signal propagation - signals are not queued
        data=msg.signal;
        if (data.length) self.count1.snd += data.length; else self.count1.snd++;
        if (self.handler2.signal) self.handler2.signal(data);
      }
    },
    count: function () {return self.count1.snd},
    status: function () {return true},      // Linked?
    virtual:true

  }

  this.link2 = {
    control : function (msg,to,callback) {
      // TODO
    },
    on: function (event,callback) {
      var data;
      self.handler2[event]=callback;
      if (event=='agent' && self.buffer1.length>0) {
          // Agent receiver
          data=Comp.array.pop(self.buffer1);        
          if (self.compress) data=Lz.decompress(data);
          callback(data);
      }
    },

    send: function (msg) {
      var data;
      if (msg.agent) {
        // Agent migration
        data=msg.agent;
        if (self.compress) data=Lz.compress(data);
        if (self.handler1.agent) self.handler1.agent(self.compress?Lz.decompress(data):data);
        else self.buffer2.push(data);
        if (data.length) self.count2.snd += data.length; else self.count2.snd++;
      } else if (msg.signal) {
        // Signal propagation - signals are not queued
        data=msg.signal;
        if (data.length) self.count2.snd += data.length; else self.count2.snd++;
        if (self.handler1.signal) self.handler1.signal(data);
      }
    },
    count: function () {return self.count2.snd},
    status: function () {return true},      // Linked?
    virtual:true

  }
};

virtual.prototype.init  = function () {};
virtual.prototype.start = function () {};
virtual.prototype.stop  = function () {};

var Virtual = function (node1,node2,dir,options) {
  var obj=new virtual(node1,node2,dir,options);
  return obj;
}

module.exports.Virtual=Virtual;
module.exports.current=function (module) { current=module.current; Aios=module; Amp.current(module); };




if (global.config.nonetwork) return;
/******************************* PHYSICAL *************************************/


/********************* 
 ** Physical Circuit
 *********************
 *  
 * Using AMP or process stream connections (TODO)
 * typeof options={
 *   broker?:url is UDP hole punching rendezvous broker 
 *   compress?:boolean,
 *   device?:string,
 *   name?:string is optional name of the comm. port e.g. the JAM node name,
 *   on?: { } is event handler object,
 *   oneway?:boolean,
 *   out?:function,
 *   proto?:'udp'|'tcp'|'http'|'hardware',
 *   rcv:url is this endpoint address,
 *   secure?:port string,
 *   snd?:url is remote endpoint address,
 *   stream?:boolean,
 *   verbose?
 *   ..
 *  }
 *  with type url = "<name>:<ipport>" | "<ip>:<ipport>" | "<ipport>"
 *  and type ipport = (1-65535) | "*"
 */
var physical= function (node,dir,options) {
  var self=this;
  options=checkOptions(options,{});
  this.options=options;
  
  this.ip=none;
  if (options.rcv) this.ip=url2addr(options.rcv);
  else this.ip={address:Amp.options.localhost,port:undefined};
  if (options.proto && this.ip) this.ip.proto=options.proto;
  
  this.node=node;
  this.dir=dir; // outgoing port (node -> dst), e.g., IP
  this.count=0;
  this.broker=options.broker;
  
  this.mode=this.options.compress?Amp.AMMode.AMO_COMPRESS:0;

  this.state = SLINK.INIT;
  this.linked = 0;
  
  this.events = [];
  this.callbacks = [];

  this.out=function (msg,async) { async?Aios.logAsync(msg):Aios.log(msg) };
  
  if (this.ip.parameter && this.ip.parameter.secure) {
    this.options.secure=Sec.Port.ofString(this.ip.parameter.secure);
    delete this.ip.parameter;
    this.dir.ip=addr2url(this.ip);
  }
  
  this.amp= Amp.Amp({
      broker:options.broker?url2addr(options.broker,this.ip.address):undefined,
      dir:this.dir,
      keepAlive : options.keepAlive,
      mode:this.options.mode,
      multicast:this.options.multicast,
      name:this.options.name,
      node:node,
      nodeid:this.options.nodeid,
      oneway:this.options.oneway,
      proto:this.options.proto,  
      pem:this.options.pem,
      rcv:this.ip,
      secure:this.options.secure,
      snd:options.snd?url2addr(options.snd):undefined,
      sharedSocket:options.sharedSocket,
      sock:options.sock,
      verbose:options.verbose,
    });

  // External API
  this.link = {
    // Control RPC
    // STD_STATUS/PS_STUN/...
    control : function (msg,to,callback) {
      var buf,data,addr=to?url2addr(to):{};
      buf=Buf.Buffer();
      msg.tid=Comp.random.int(65536/2);
      self.callbacks[msg.tid]=callback;
      Buf.buf_put_int16(buf,msg.tid);
      Buf.buf_put_string(buf,JSON.stringify(msg.args||{}));
      self.amp.request(msg.cmd,
                       buf, 
                       self.amp.mode & Amp.AMMode.AMO_MULTICAST? addr:undefined);        
      
    }, 
    on: function (event,callback) {
      self.events[event]=callback;
    },
    send: function (msg,to) {
      var buf,data,addr=to?url2addr(to):{};
      if (msg.agent) {
        data=msg.agent; // string of JSON+
        buf=Buf.Buffer();
        if (self.mode & Amp.AMMode.AMO_COMPRESS) data=Lz.compress(data);
        Buf.buf_put_string(buf,data); 
        // function request(cmd:integer,msg:Buffer,snd?:address)
        self.amp.request(Command.PS_MIGRATE, 
                         buf, 
                         self.amp.mode & Amp.AMMode.AMO_MULTICAST? addr:undefined);        
      } else if (msg.signal) {
        data=msg.signal;  // string of JSON
        // Signal propagation  
        buf=Buf.Buffer();
        if (self.mode & Amp.AMMode.AMO_COMPRESS) data=Lz.compress(data);
        Buf.buf_put_string(buf,data);   
        // function request(cmd:integer,msg:Buffer,snd?:address)
        self.amp.request(Command.PS_SIGNAL, 
                         buf, 
                         self.amp.mode & Amp.AMMode.AMO_MULTICAST? addr:undefined);        
      }
    },
    count: function () {return self.amp.count.rcv+self.amp.count.snd},
    status : function (to) {
      if (self.amp) {
        switch (to) {
          case '%':
            // P2P link?; return remote node/ip/link id
            return self.amp.status(to);
            break;
          default:
            if (to) to=url2addr(to);
            return to?self.amp.status(to.address,to.port):self.amp.status();
        }
      }
    },  // Linked?
    stats : function () {
      return {
        transferred:(self.amp.count.rcv+self.amp.count.snd),
        linked:self.linked
      }
    },
    ip:this.ip,
    mode:this.amp.mode
  }
  
  /** Connect to remote endpoint with optional capability key protection
   *  typeof @to = "<url>" | "<path>" | "<ip>:<ipport>" | "<ipport>"
   *  typeof @key = string "[<port>](<rights>)[<protport>]"
   */
  this.link.connect=function (to,key) {
    // allow url2addr DNS lookup
    url2addr(to,self.ip.address,function (addr) {
      self.amp.link(addr,true,key);
    })
  };

  // Disconnect remote endpoint
  this.link.disconnect=function (to) {
    var tokens;
    if (!to){
      if (self.amp.snd && self.amp.snd.address && self.amp.snd.port)
        self.amp.unlink(self.amp.snd);
    } else {
      var addr=url2addr(to,self.ip.address);
      self.amp.unlink(addr);
    }
  };
  this.link.init=function (cb) {
    if (self.state!=SLINK.INIT) return cb?cb():null;
    self.state=SLINK.INITED;
    return self.amp.init(cb);
  }
  this.link.start=function (cb) {
    if (self.state!=SLINK.INITED) return cb?cb():null;
    self.state=SLINK.RUNNING;
    return self.amp.start(cb);
  }
  this.link.stop=function (cb) {
    if (self.state!=SLINK.RUNNING) return cb?cb():null;
    self.state=SLINK.INITED;
    return self.amp.stop(cb); 
  }
  
  if (this.broker) this.link.lookup = function (path,callback) {
    if (self.amp.lookup) self.amp.lookup(path,callback);
    else if (callback) callback([]);
  }
  // Install route notification propagation to router (if installed)
  this.amp.on('route+',function (url,node,remote) {
    if (remote) self.ip.public=remote;
    if (self.router) self.router.add(url,self.link,node);
    self.emit('link+',url,node);
    Aios.emit('link+',url,node);
    self.linked++;
  });
  this.amp.on('route-',function (url) {
    if (self.router) self.router.delete(url,self.link);
    self.emit('link-',url);
    Aios.emit('link-',url);
    self.linked--;
  });
  this.amp.on('error',function (err,arg) {
    self.emit('error',err,arg);
  });
  if (options.on) {
    for(var p in options.on) this.on(p,options.on[p]);
  }
  // Register message receiver handler with STD/PS RPC 
  this.amp.receiver(function (handler) {
    var code,name,env,agentid,stat,obj,buf,status,tid;
    if (!handler) return;
    if (self.options.verbose>2) { 
      self.out('AMP: got request: '+ Io.inspect(handler),true);
    };
    switch (handler.cmd) {
      case Command.PS_MIGRATE:
        code = Buf.buf_get_string(handler.buf);
        // console.log(code);
        // console.log(myJam.amp.url(handler.remote))
        if (self.mode & Amp.AMMode.AMO_COMPRESS) code=Lz.decompress(code);
        if (self.events.agent) self.events.agent(code,false,handler.remote);
        break;
      case Command.PS_CREATE:
        code = Buf.buf_get_string(handler.buf);
        // console.log(code);
        // console.log(myJam.amp.url(handler.remote))
        if (self.mode & Amp.AMMode.AMO_COMPRESS) code=Lz.decompress(code);
        if (self.events.agent) self.events.agent(code,true);
        break;
      case Command.PS_WRITE:
        name = Buf.buf_get_string(handler.buf);
        code = Buf.buf_get_string(handler.buf);
        env = Buf.buf_get_string(handler.buf);
        // console.log(code);
        // console.log(myJam.amp.url(handler.remote))
        if (self.mode & Amp.AMMode.AMO_COMPRESS) code=Lz.decompress(code);
        obj={};
        try {eval("env = "+env)} catch (e) {};
        obj[name]={
          fun:code,
          env:env
        }
        if (self.events['class']) self.events['class'](obj);
        break;
      case Command.PS_SIGNAL:
        // TODO
        code = Buf.buf_get_string(handler.buf);
        // console.log(code);
        if (self.mode & Amp.AMMode.AMO_COMPRESS) code=Lz.decompress(code);
        if (self.events.signal) self.events.signal(code,handler.remote);
        break;
      case Command.PS_STUN:
        // Kill an agent (or all)
        code = Buf.buf_get_string(handler.buf);
        break;
        
      // Control Mesages
      case Command.STD_STATUS:
        // Send status of requested object (node: process table..)
        tid  = Buf.buf_get_int16(handler.buf);
        code = Buf.buf_get_string(handler.buf);
        code = JSON.parse(code);
        status = {}; 
        if (typeof code == 'string') {
          switch (code) {
            case 'node': 
            case 'links':
            case 'ports':
            case 'agents': 
              status=self.node.std_status(code); break;
          }
        }
        buf=Buf.Buffer();
        Buf.buf_put_int16(buf,tid);
        Buf.buf_put_string(buf,JSON.stringify(status));           
        self.amp.reply(Command.STD_MONITOR,  // Hack: Reply to STD_STATUS request
                       buf, 
                       self.amp.mode & Amp.AMMode.AMO_MULTICAST? handler.remote:undefined);        
        break;
      case Command.STD_INFO:
        // Send info about .. (agent ..)   
        tid  = Buf.buf_get_int16(handler.buf);
        code = JSON.parse(Buf.buf_get_string(handler.buf));
        status = {};
        if (typeof code == 'string') {
          switch (code) {
            case 'node' : status=self.node.std_info(); break;
          }
        } else if (typeof code == 'object') {
          if (code.node) {
            // get info of a specific node; probably not this but maybe attached?
            if (code.node==self.node.id) status=self.node.std_info();
            else {
              // one hop is possible if destination node is connected to this node, too
              var to = COM.lookupNode(self.node,code.node);
              console.log(to);
              // to.link.control({
              // cmd:COM.Command.STD_INFO,
              //   args:code,
              // },to.url, function (reply) {
              //    self.amp.reply(Command.STD_MONITOR()...
              // })
            }
          } 
          if (code.agent) {
            status=self.node.std_info(code); 
          }
        }
        buf=Buf.Buffer();
        Buf.buf_put_int16(buf,tid);
        Buf.buf_put_string(buf,JSON.stringify(status));

        self.amp.reply(Command.STD_MONITOR,  // Hack: Reply to STD_INFO request
                       buf, 
                       self.amp.mode & Amp.AMMode.AMO_MULTICAST? handler.remote:undefined);        
        break;
      case Command.STD_MONITOR:
        // Hack: Reply to STD_STATUS/INFO request
        tid  = Buf.buf_get_int16(handler.buf);
        code = Buf.buf_get_string(handler.buf);
        code = JSON.parse(code);
        if (self.callbacks[tid]) {
          self.callbacks[tid](code);
          delete self.callbacks[tid];
        }
        break;
    }

  });
};

physical.prototype.emit = function (event,arg,aux1,aux2) { if (this.events[event]) this.events[event](arg,aux1,aux2)};
physical.prototype.on = function (event,handler) {this.events[event]=handler};
physical.prototype.init = function (callback) { return this.link.init(callback)};
physical.prototype.start = function (callback) {return this.link.start(callback)};
physical.prototype.stop = function () {return this.link.stop()};

var Physical = function (node,dir,options) {
  var obj=new physical(node,dir,options);
  return obj;
}

module.exports.Physical=Physical;

/*************************
** IP UTILS
*************************/
var url2addr=Amp.url2addr;
var addr2url=Amp.addr2url;
var resolve=Amp.resolve;

/*  url = "<name>:<ipport>" | "<ip>:<ipport>" | "<ipport>"
 *  and ipport = (1-65535) | "*"
function url2addr(url,defaultIP) {
  var addr={address:defaultIP||'localhost',proto:'IP',port:undefined},
      parts = url.toString().split(':');
  if (parts.length==1) {
    if (Comp.string.isNumeric(parts[0])) addr.port=Number(parts[0]); // port number
    else if (parts[0].indexOf('-') != -1) addr.port=parts[0]; // port range p0-p1
    else if (parts[0]=='*') addr.port=undefined; // any port
    else addr.address=parts[0];  // ip/url
  } else return {address:parts[0],port:parts[1]=='*'?undefined:Number(parts[1])||parts[1]};
  return addr;
};

function addr2url(addr) {
  return (addr.proto?(addr.proto+'://'):'')+addr.address+':'+(addr.port?addr.port:'*')
};
function resolve (url,defaultIP) {
  var addr=url2addr(url,defaultIP);
  return addr2url(addr) 
}
 */

function addrequal(addr1,addr2) {
  return ipequal(addr1.address,addr2.address) && addr1.port==addr2.port;
}


function ipequal(ip1,ip2) {
  if (ip1==undefined || ip2==undefined) return false;
  else if ((Comp.string.equal(ip1,'localhost') || Comp.string.equal(ip1,'127.0.0.1')) &&
           (Comp.string.equal(ip2,'localhost') || Comp.string.equal(ip2,'127.0.0.1'))) return true;
  else return ip1==ip2;
}


/***********************************************
 * IP Router using AMP/UDP/TCP/HTTP links
 * Entry point for move and send operations DIR.IP
 ***********************************************
 */

function iprouter() {
  this.routingTable={};
  this.nodeTable={};
  this.links=[];
}
// Add route and link to be used for the route (and optional remote node id)
iprouter.prototype.add = function (to,link,node) {
  to=resolve(to);
  if (options.verbose) Aios.logAsync('[IP] iprouter: add route '+addr2url(link.ip)+' -> '+to+(node?'#'+node:''));
  this.routingTable[to]=link;
  this.nodeTable[to]=node;
}

// Add link device
iprouter.prototype.addLink = function (link) {
  if (!link.ip) link.ip='*';
  if (options.verbose) Aios.logAsync('[IP] iprouter: add link '+addr2url(link.ip));
  this.links.push(link);
}

// Connect to a remote endpoint
iprouter.prototype.connect = function (to,key) {
  var link,p,addr;
  to=resolve(to);
  addr=url2addr(to);
  // Search for an unconnected port!?
  for(p in this.links) {
    if (this.links[p].status(to)) return;
    if (!(this.links[p].mode&Amp.AMMode.AMO_MULTICAST) && this.links[p].status()) continue;
    if (addr.proto && this.links[p].ip && this.links[p].ip.proto != addr.proto) continue;
    link=this.links[p]; 
    break;
  }
  if (link && link.connect) {
    link.connect(to,key);
  }
}

//
iprouter.prototype.count = function (dest) {
  var res=0;
  for(var i in this.links) {
    res += this.links[i].count();
  }
  return res;
}

// Remove route
iprouter.prototype.delete = function (to) {
  to=resolve(to);
  if (this.routingTable[to]) {
    if (options.verbose) Aios.logAsync('[IP] iprouter: remove route '+addr2url(this.routingTable[to].ip)+ ' -> ' + to);
    delete this.routingTable[to];
    delete this.nodeTable[to];
  }
}

// Disconnect a remote endpoint
iprouter.prototype.disconnect = function (to) {
  // Search for a connected port!
  to=resolve(to);
  if (this.routingTable[to] && this.routingTable[to].status(to)) {
    this.routingTable[to].disconnect(to);
  }
}

/** Lookup a IP:PORT address pair of a nodeid OR contact a broker to get reachable 
 *  nodeid-IP address pairs 
 *
 */
iprouter.prototype.lookup = function (nodeid,callback) {
  var p,result=[],n=0;
  // Broker lookup with a pattern like /domain/*  (DIR.PATH)
  if (nodeid.indexOf('*')!=-1) {
    // TODO
    for (p in this.links) {
      if (this.links[p].lookup) {
        n++;
        this.links[p].lookup(nodeid,function (_result) {
          if (_result && _result.length) result=result.concat(_result);
          n--;
          if (n==0) callback(result);
        });
      }
    }
  } else for(p in this.nodeTable) { 
    if (this.nodeTable[p] == nodeid && this.routingTable[p]) return p; 
  }
} 


/** Try to find our local IP address. 
 *
 */
iprouter.prototype.ip = function () {
  for(var i in this.links) {
    if (this.links[i].ip) return this.links[i].ip;
  }
} 

/** Reverse lookup: Get the nodeid from an IP:PORT address
*   typeof @ip = string <ip:ipport>
*/
iprouter.prototype.reverse = function (ip) {
  return this.nodeTable[ip];
}



/** Send a message
*
*/

iprouter.prototype.send = function (msg) {
  msg.to=resolve(msg.to);
  if (this.routingTable[msg.to]) {
    this.routingTable[msg.to].send(msg,msg.to);
  } else {
    
  }
}

/** Start all attached devices
*
*/
iprouter.prototype.start = function (callback) {
  var cbl=CBL(callback||function(){});
  this.links.forEach(function (link) {
    cbl.push(function (next) {link.start(next)});
  });
  cbl.start();
}

iprouter.prototype.stats = function () {
  return {
    links:Object.keys(this.routingTable).length
  }
}

// Check status of link in given direction  (or any direction dest==undefined)
// OR return all current registered routes string []  (dest=='*')!
// OR return all current connected nodes   string []  (dest=='%')!
// OR return all current registered links (ip) string [] (dest=='$')!
iprouter.prototype.status = function (dest) {
  var res,p;
  if (dest==undefined) {
    // Any registered routes?
    for(p in this.routingTable) { if (this.routingTable[p]) return true }
  } else if (dest=='*') {
    res=[];
    for(p in this.routingTable) { if (this.routingTable[p]) res.push(p) }
    return res;
  } else if (dest=='%') {
    res=[];
    for(p in this.nodeTable) { 
      if (this.nodeTable[p] && this.routingTable[p]) res.push(this.nodeTable[p]); 
    }
    return res;
  } else {
    dest=resolve(dest);
    if (this.routingTable[dest])
      return this.routingTable[dest].status(dest);
    else
      return false;
  }
  return false;
}

// Stop all attached devices
iprouter.prototype.stop = function (callback) {
  var cbl=CBL(callback||function(){});
  this.links.forEach(function (link) {
    cbl.push(function (next) {link.stop(next)});
  });
  cbl.start();
}


module.exports.iprouter=iprouter;

module.exports.Command=Command
module.exports.Status=Status

module.exports.url2addr=url2addr;
module.exports.addr2url=addr2url;
