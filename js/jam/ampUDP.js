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
 **    $INITIAL:     (C) 2006-2020 bLAB
 **    $CREATED:     09-02-16 by sbosse.
 **    $RCS:         $Id: ampUDP.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.17.6
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) over UDP
 **
 **  Supports:
 **
 **   - Unicast link
 **   - Multicast link
 **   - Oneway link
 **   - Broker service with UDP punch holing and pairing, lookup of registered nodes
 **
 **
 **  Events out: 'error','route+','route-'
 **
 **  TODO: Garbage collection
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Sec = Require('jam/security');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');

var COM = Require('jam/ampCOM'),
    AMMode=COM.AMMode,
    AMMessageType=COM.AMMessageType,
    AMState=COM.AMState,
    amp=COM.amp,
    options=COM.options,
    url2addr=COM.url2addr,
    addr2url=COM.addr2url,
    obj2url=COM.obj2url,
    addrequal=COM.addrequal,
    resolve=COM.resolve,
    ipequal=COM.ipequal,
    doUntilAck=COM.doUntilAck,
    getNetworkIP=COM.getNetworkIP,
    magic=COM.options.magic;

module.exports.current=function (module) { current=module.current; Aios=module; };

var dgram = Require('dgram');



/** AMP port using UDP
 *  ==================
 *
 * type url = string
 * type amp.udp = function (options:{rcv:address,snd?:address,verbose?,logging?,out?:function,log?:number,broker?:address})
 * type address = {address:string,port:number}
 */
amp.udp = function (options) {
  var self=this;
  options=checkOptions(options,{});
  this.proto = 'udp';
  // Some sanity checks
  this.options=options;
  if (options.oneway && options.multicast) this.err('Invalid: Both ONEWAY and MULTICAST modes enabled!');
  this.verbose=checkOption(options.verbose,0);
  if (!options.rcv) options.rcv=url2addr('localhost:*');

  this.dir    = options.dir;                        // attached to JAM port
  this.rcv    = options.rcv;                        // IP (this side) address
  this.broker = options.broker;                     // IP (rendezvous broker) address
  this.node   = options.node;                       // Attached to this node
 
  this.port = options.port||Net.uniqport();               // This AMP Port
  this.secure = this.options.secure;
 
  if (this.broker && !this.broker.port) 
    Io.err('['+Io.Time()+' AMP] No broker port specified!');

  this.out = function (msg) {
    Aios.print('[AMP '+Net.Print.port(self.port)+
              (self.dir?(' '+Aios.DIR.print(self.dir)):'')+'] '+msg);
  }
  this.err = function (msg) {
    Aios.print('[AMP '+Net.Print.port(self.port)+
              (self.dir?(' '+Aios.DIR.print(self.dir)):'')+'] Error: '+msg);
    throw 'AMP';
  }
  

  // Virtual link table
  // MULTICAST (P2N) mode: link cache [{addr,live,state}] of all connected links
  // UNICAST (P2P): One link only, remebered by this.url!
  this.links={};
  
  if (options.snd) {
    url=addr2url(options.snd,true);
    this.links[url]={
        snd:options.snd,
        tries:0,
        state:this.broker?AMState.AMS_AWAIT:AMState.AMS_NOTCONNECTED,
        live:COM.AMC_MAXLIVE
      };
    if (this.verbose>0) this.out('Added destiantion route '+url+', '+Io.inspect(this.links[url]));
    if (!options.multicast) this.url=url;  // Remember this link
  } 
  if (this.broker) {
    // Create a root path that handles all brokerag and pairing
    url='*';
    this.links[url]={
        tries:0,
        state:AMState.AMS_RENDEZVOUS,
        live:COM.options.AMC_MAXLIVE,
        queue:{pairing:[],lookup:[]}
      };
    if (this.verbose>0) this.out('Added default registration route '+url);    
  }                                     
  this.rcv.name=options.name;                             // Optional name of this port



  this.mode = options.multicast?AMMode.AMO_MULTICAST:AMMode.AMO_UNICAST;
  if (options.oneway) this.mode |= AMMode.AMO_ONEWAY;       // Oneway: No link negotation; no ack.

  this.sock = dgram.createSocket("udp4");                   // Receiver and sender socket

  this.dlimit = options.dlimit||512;

  this.count={rcv:0,snd:0,lnk:0,png:0};

  this.timer=undefined;
  this.inwatchdog=false;

  this.events = [];
  this.transactions = Comp.hashtbl.create();
  
  this.logs=[];
  this.logging=options.logging||false;
  if (this.logging) {
    setInterval(function () { self.LOG('print') },5000);
  }
};

amp.udp.prototype.LOG = amp.man.prototype.LOG;  
amp.udp.prototype.addTransaction = amp.man.prototype.addTransaction;
amp.udp.prototype.checkState = amp.man.prototype.checkState;
amp.udp.prototype.deleteTransaction = amp.man.prototype.deleteTransaction;
amp.udp.prototype.emit = amp.man.prototype.emit;
amp.udp.prototype.findTransaction = amp.man.prototype.findTransaction;
amp.udp.prototype.handle = amp.man.prototype.handle;
amp.udp.prototype.on = amp.man.prototype.on;
amp.udp.prototype.status = amp.man.prototype.status;


/** Handle AMP control messages (used by ampbroker and UDP hole punching sub-system) 
 *  for P2P network pairing before linking is performed (NAT traversal)!
 *
 */
amp.udp.prototype.control = function(link, msg, remote) { 
  var self=this;
  
  switch (msg.type) {
    case 'lookup':
      // Lookup reply
      if (link.queue.lookup[msg.path]) {
        link.queue.lookup[msg.path](msg.data);
        delete link.queue.lookup[msg.path];
      }
      break;
      
    case 'registered':
      if (link.state==AMState.AMS_RENDEZVOUS) {
        link.state=AMState.AMS_REGISTERED;
        if (this.verbose) self.out('Registered on broker with name '+this.rcv.name);
      }
      break;

    case 'pairing':
      if (link.state == AMState.AMS_REGISTERED) {
        // pairing of remote endpoint sent by broker; punch now
        var punch = { type: 'punch', from: this.rcv.name, to: msg.client.name},
            counter = options.TRIES;
        link.state=AMState.AMS_PAIRING; // stops sending pair requests
        for (var con in msg.client.connections) {
          doUntilAck(options.TIMER, 
            // DO
            function(i) {
              counter--;
              self.send(punch, msg.client.connections[i]);
            },
            // UNTIL ACK = true
            function () {
              return counter==0 || link.state!=AMState.AMS_PAIRING;
            },
            con);
        } 
      }
      break; 

    case 'ack':
      if (link.state == AMState.AMS_PAIRING) {
        if (this.verbose) self.out('Paired with '+msg.from+'('+addr2url(remote)+')');
        // Find waiting virtual link ...
        self.links.forEach(function (link2,url) {
          if (url=='*') return;
          if (link2 && link2.state==AMState.AMS_AWAIT && link2.snd.name==link.snd.name) {
            var newurl=addr2url(remote,true);
            // Move link to new url
            self.links[url]=undefined;
            self.links[newurl]=link2;
            link2.state=AMState.AMS_NOTCONNECTED;
            link2.snd.address=remote.address;
            link2.snd.port=remote.port;      // Correct address/port???
            if (self.mode&AMMode.AMO_UNICAST) self.url=newurl,self;
            // console.log('wakeup ',link);
          }
        });
        
          // this.watchdog(true,true);
          // This is the root link '*' performed the pairing on this destination side. 
          // Wait for next pairing...
        link.state=AMState.AMS_RENDEZVOUS;
        if (link.queue.pairing.length)
          link.snd = {name:link.queue.pairing.shift().snd.name};
        else
          link.snd = undefined;
        self.watchdog(true);
      }
      break;

    case 'punch':
      if (msg.to == this.rcv.name) {
        // send ACK
        this.send({type:'ack',from:this.rcv.name},remote);
      }
      break;
  }

}

/** Initialize AMP
 *
 */
amp.udp.prototype.init = function(callback) { 
  if (callback) callback();
};

/** Negotiate (create) a virtual communication link (peer-to-peer).
 *
 *  The link operation can be called externally establishing a connection or internally.
 *
 *  In oneway mode only a destination endpoint is set and it is assumed the endpoint can receive messages a-priori!
 *
 * typeof @snd = address
 * typeof @callback = function
 * typeof @connect = boolean is indicating an initial connect request and not an acknowledge
 * typeof @key = string
 * +------------+
 * VCMessageType (int16)
 * Connection Port (port)
 * Node ID (string)
 * //Receiver IP Port (int32)
 * +------------+
 *
 */
 
amp.udp.prototype.link=function(snd,connect,key) {
    var self = this,
        url, 
        buf = Buf.Buffer(),
        sock = this.sock; // snd_sock;

    if (this.verbose>1) this.out('amp.link: to '+(snd && snd.address) + ':' + ((snd && snd.port) || '*'));
    snd=this.updateLinkTable(snd||(this.url && this.links[this.url].snd) ,connect,key);

    if (snd && snd.parameter && snd.parameter.secure) key=snd.parameter.secure;

    if (!snd) return this.watchdog(true);

    Buf.buf_put_int16(buf, magic);
    Buf.buf_put_int16(buf, AMMessageType.AMMLINK);
    Buf.buf_put_port(buf,this.port);          // This AMP id
    Buf.buf_put_string(buf,this.node?this.node.id:'*');
    Buf.buf_put_string(buf,key?key:'');
    
    // Buf.buf_put_int32(buf, this.rcv.port);
    this.count.snd += Buf.length(buf);
    this.count.lnk++;

    sock.send(buf.data,0,Buf.length(buf),snd.port,snd.address,function (err) {
        if (err) {
            sock.close();
            self.emit('error',err);
        } 
    });
};

// Ask broker for registered hosts/nodes
amp.udp.prototype.lookup = function(path,callback) {
  var link=this.links['*'];
  if (!link && callback) return callback([]);
  if (callback) link.queue.lookup[path]=callback;
  this.send(
    {type:'lookup',name: this.rcv.name, linfo: this.rcv, data:path },
    this.broker,
    function () {}
  );

}

// Return link for destination
amp.udp.prototype.lookupLinkTable=function(snd) {
  if (this.url) return this.links[this.url]; // Unicast mode
  if (!snd) return;
  var url = obj2url(snd);
  return this.links[url];
}


// Initiate a pairing of two nodes via broker handled by the '*' root link
amp.udp.prototype.pairing = function(link) {
  if (!this.links['*'].snd) {
    // Root link will perform pairing ...
    this.links['*'].snd={name:link.snd.name};
    this.watchdog(true);
  } else {
    this.links['*'].queue.pairing.push(link);
  }
}

/**
 *
 * typeof @snd = address
 * typeof @callback = function
 *
 * +------------+
 * AMMessageType (int16)
 * Connection Port (port)
 * Receiver IP Port (int32)
 * +------------+
 */
amp.udp.prototype.ping=function(snd) {
    var self = this,
        buf = Buf.Buffer(),
        sock = this.sock; // snd_sock;

    Buf.buf_put_int16(buf, magic);
    Buf.buf_put_int16(buf, AMMessageType.AMMPING);
    Buf.buf_put_port(buf,this.port);

    if (this.mode&AMMode.AMO_UNICAST) {
      if (snd==undefined || snd.address==undefined) snd={},snd.address=this.links[this.url].snd.address;
      if (snd.port==undefined) snd.port=this.links[this.url].snd.port;
    } 
    if (snd == undefined) this.err('amp.udp.ping: no destinataion set (snd==null)');
    
    // Buf.buf_put_int32(buf, self.rcv.port);

    if (this.verbose>1) this.out('amp.ping: to '+addr2url(snd));
    this.count.snd += Buf.length(buf);
    this.count.png++;
    
    sock.send(buf.data,0,Buf.length(buf),snd.port,snd.address,function (err) {
        if (err) {
            sock.close();
            self.emit('error',err);
        } 
    });
};

/**
 *
 * typeof @snd = address
 * typeof @callback = function
 * +------------+
 * AMMessageType (int16)
 * Connection Port (port)
 * Receiver IP Port (int32)
 * +------------+
 */
amp.udp.prototype.pong=function(snd) {
    var self = this,
        buf = Buf.Buffer(),
        sock = this.sock; // snd_sock;

    Buf.buf_put_int16(buf, magic);
    Buf.buf_put_int16(buf, AMMessageType.AMMPONG);
    Buf.buf_put_port(buf,this.port);

    if (this.mode&AMMode.AMO_UNICAST) {
      if (snd==undefined || snd.address==undefined) snd={},snd.address=this.links[this.url].snd.address;
      if (snd.port==undefined) snd.port=this.links[this.url].snd.port;
    } 
    if (snd == undefined) this.err('amp.udp.pong: no destinataion set (snd==null)');

    // Buf.buf_put_int32(buf, this.rcv.port);

    if (this.verbose>1) this.out('amp.pong: to '+addr2url(snd));
    this.count.snd += Buf.length(buf);
    this.count.png++;

    sock.send(buf.data,0,Buf.length(buf),snd.port,snd.address,function (err) {
        if (err) {
            sock.close();
            self.emit('error',err);
        } 
    });
};


/*
** Set-up a message receiver.
**
** Message structure
**
**  msgtyp            msgtyp            2
**  =AMMRPCHEAD       =AMMRPCDATA
**  tid               tid               2
**  remoteport                          2
**  cmd                                 2
**  size                                2
**  frags                               2
**                    off               4
**                    size              2
**                    more              2
**                    buf               *
**  
**  
*/
/** Message receiver and handler.
 *  typeof @rcv=address|undefined
 */
amp.udp.prototype.receiver = function (callback,rcv) {
  var self = this;

  if (rcv == undefined || rcv.address==undefined) rcv={},rcv.address=this.rcv.address;
  if (rcv.port==undefined) rcv.port=this.rcv.port;
  if (callback) this.callback=callback;

  var buf = Buf.Buffer();
  var sock = this.sock; // rcv_sock;

  sock.on('listening', function () {
    var address = sock.address();
    if (!rcv.port) self.rcv.port=rcv.port=address.port;
    if (self.verbose>1) self.out('UDP receiver listening on ' + addr2url(rcv));
    if (self.dir.ip=='*') self.dir=Aios.DIR.IP(self.rcv.port); 
    // Try to get network IP address of this host 
    getNetworkIP(undefined,function (err,ip) {
      if (!err) self.rcv.address=ip;
      if (self.verbose) self.out('IP port '+addr2url(self.rcv)+ ' (proto '+self.options.proto+')');
      if (err) return self.out("! Unable to obtain network connection information: "+err);
    });
  });
  sock.on('error', function (err) {
    Io.out('[AMP] UDP error: '+err);
    self.sock.close();
  });    
  sock.on('message', function (message, remote) {
    var handler,dfrags,dlist,msgtyp,tid,ipport,discard,off,size,thisnum,transaction,more,port,addr,url,data,msg;
    remote.address=remote.address.replace(/^::ffff:/,'')
    Buf.buf_init(buf);
    Buf.buf_of_str(buf,message);
    self.count.rcv += message.length;
    msg={};
    
    if (message.length >= 10) {
      msg.magic=Buf.buf_get_int16(buf);
      // consistency check
      if (msg.magic!=magic) return;

      msg.type=Buf.buf_get_int16(buf);
      

      discard=false;
      if (self.verbose>1) {
        url=addr2url(remote,true);
        self.out('receiver: Receiving Message from '+ url + ' [' + message.length+'] '+
                 AMMessageType.print(msg.type)+' in state '+
                 (self.mode&AMMode.AMO_MULTICAST?(self.links[url] && AMState.print(self.links[url].state)):
                                                 (self.links[self.url] && AMState.print(self.links[self.url].state))));
      }
      switch (msg.type) {

        case AMMessageType.AMMRPCHEAD:
          if (!self.checkState(AMState.AMS_CONNECTED,remote)) return;
          msg.tid = Buf.buf_get_int16(buf);
          msg.port = Buf.buf_get_port(buf);
          msg.cmd=Buf.buf_get_int16(buf);
          msg.size=Buf.buf_get_int32(buf);    // total data size
          msg.frags=Buf.buf_get_int16(buf);
          msg.data=Buf.Buffer();
          self.handle(msg,remote);
          break;

        case AMMessageType.AMMRPCDATA:
          if (!self.checkState(AMState.AMS_CONNECTED,remote)) return;
          msg.tid = Buf.buf_get_int16(buf);
          msg.port = Buf.buf_get_port(buf);
          msg.off = Buf.buf_get_int32(buf);
          msg.size = Buf.buf_get_int16(buf);    // fragment size
          msg.more = Buf.buf_get_int16(buf);
          msg.data = buf;
          self.handle(msg,remote);
          break;

        case AMMessageType.AMMPING:
          msg.port = Buf.buf_get_port(buf);
          self.handle(msg,remote);
          break;

        case AMMessageType.AMMPONG:
          msg.port = Buf.buf_get_port(buf);
          self.handle(msg,remote);
          break;

        case AMMessageType.AMMLINK:
          msg.port = Buf.buf_get_port(buf);
          msg.node = Buf.buf_get_string(buf);
          msg.secure  = Buf.buf_get_string(buf);
          if (msg.secure!='') msg.secure=Sec.Port.ofString(msg.secure); 
          self.handle(msg,remote);
          break;

        case AMMessageType.AMMUNLINK:
          msg.port = Buf.buf_get_port(buf);
          self.handle(msg,remote);
          break;

        // optional rendezvous brokerage 
        case AMMessageType.AMMCONTROL:
          // Control message; 
          msg.port = Buf.buf_get_port(buf);
          msg.data = Buf.buf_get_string(buf);
          self.handle(msg,remote);
          break;
      }
    }
  });
};



/** Send a request message to a remote node endpoint
 *
 * function (cmd:integer,msg:Buffer,snd?:address)
 */

amp.udp.prototype.request = function (cmd,msg,snd) {
  var self=this,
      buf = Buf.Buffer(),
      sock = this.sock, // snd_sock;
      size = msg.data.length,
      frags = div((size+self.dlimit-1),self.dlimit),
      tid = msg.tid||Comp.random.int(65536/2);

  if (this.mode&AMMode.AMO_UNICAST) {
    if (snd==undefined || snd.address==undefined) snd={},snd.address=this.links[this.url].snd.address;
    if (snd.port==undefined) snd.port=this.links[this.url].snd.port;
  } 
  if (snd == undefined) this.err('amp.udp.request: no destinataion set(snd==null)');

  Buf.buf_put_int16(buf,magic);
  Buf.buf_put_int16(buf,AMMessageType.AMMRPCHEAD);
  Buf.buf_put_int16(buf,tid);                   // Transaction Message ID
  Buf.buf_put_port(buf,this.port);
  // Buf.buf_put_int16(buf,self.rcv.port);         // For reply
  Buf.buf_put_int16(buf,cmd);
  Buf.buf_put_int32(buf,size);
  Buf.buf_put_int16(buf,frags);

  if (self.verbose>1) self.out('Send AMMRPCHEAD tid='+tid+' @'+Comp.pervasives.mtime());
  this.count.snd += Buf.length(buf);
  
  sock.send(buf.data,0,Buf.length(buf),snd.port,snd.address,function (err) {
    if (self.verbose>1) self.out('Send AMMRPCHEAD tid='+tid+'. Done @'+Comp.pervasives.mtime());
    if (err) {
      if (self.verbose>1) self.out('AMMRPCHEAD Error: '+err);
      sock.close();
      if (callback) callback(Status.STD_IOERR,err);
    } else {
      if (size >0) {
          var dsend = function (n, off) {
              var fsize,more;
              if (frags == 1) fsize = size;
              else if (n < frags) fsize = self.dlimit;
              else fsize = size - off;
              if (n==frags) more=0; else more=1;
              Buf.buf_init(buf);
              Buf.buf_put_int16(buf, magic);
              Buf.buf_put_int16(buf, AMMessageType.AMMRPCDATA);
              Buf.buf_put_int16(buf, tid);      // Transaction Message number
              Buf.buf_put_port(buf,self.port);
              Buf.buf_put_int32(buf, off);      // Data fragment offset
              Buf.buf_put_int16(buf, fsize);    // Data fragment size
              Buf.buf_put_int16(buf, more);     // More data?
              Buf.buf_put_buf(buf, msg, off, fsize);
              if (self.verbose>1) self.out('Send AMMRPCDATA tid='+tid+'. Start #'+n+'/'+frags+'  @'+Comp.pervasives.mtime());
              self.count.snd += Buf.length(buf);

              sock.send(buf.data, 0, Buf.length(buf), snd.port, snd.address, function (err) {
                  if (self.verbose>1) self.out('Send AMMRPCDATA tid='+tid+'. Done #'+n+'/'+frags+' @'+Comp.pervasives.mtime());
                  if (err) {
                    if (self.verbose>1) self.out('AMMRPCDATA Error: '+err);
                    sock.close();
                    self.emit('error',err);
                  }
                  else if (n < frags) dsend(n + 1, off + fsize);
               });
          };
          dsend(1,0);
      } 
    }
  });    
};

/** Reply to a request (msg.tid contains request tid)
 */
amp.udp.prototype.reply = function (cmd,msg,snd) {
  this.request(cmd,msg,snd);
}

// typeof @snd : {address,port}
amp.udp.prototype.scan=function(snd,response,callback) {
    var self = this,msg={magic:magic};

    msg.type=response?AMMessageType.AMMACK:AMMessageType.AMMSCAN;
    
    if (this.verbose>1) this.out('amp.scan: to '+addr2url(snd));
    // TODO: callback!? Must be handled by the receiver/pkt. manager
       
    // TODO ??
    // this.send(msg,snd);
}

// Send a short control message
// typeof @msg : {type:string,..}
// typeof @snd : {address,port}
amp.udp.prototype.send = function (msg, snd) {
  var buf = Buf.Buffer(),
      sock = this.sock, // snd_sock;
      data = JSON.stringify(msg);
  this.LOG('snd',msg);
  if (this.mode&AMMode.AMO_UNICAST) {
    if (snd==undefined || snd.address==undefined) snd={},snd.address=this.links[this.url].snd.address;
    if (snd.port==undefined) snd.port=this.links[this.url].snd.port;
  } 
  if (snd == undefined) this.err('amp.udp.send: no destinataion set (snd==null)');
  
  if (this.verbose>1) this.out('amp.send: to '+addr2url(snd)+': '+data);
  Buf.buf_put_int16(buf,magic);
  Buf.buf_put_int16(buf,AMMessageType.AMMCONTROL);
  Buf.buf_put_port(buf,this.port);
  Buf.buf_put_string(buf,data);
  this.count.snd += Buf.length(buf);

  sock.send(buf.data,0,Buf.length(buf),snd.port,snd.address,function (err) {
    if (err) self.emit('error',err);
  });
};



// Start AMP watchdog and receiver
amp.udp.prototype.start = function(callback) {
  var self=this,link,startwatch=false
       s=this.secure?' (security port '+Sec.Port.toString(this.secure)+')':'';
       
  if (this.verbose>0) this.out('Starting ' + (this.rcv.name?(this.rcv.name+' '):'')+ addr2url(this.rcv)+
                               (this.mode&AMMode.AMO_UNICAST && this.url?(' -> '+this.url):'')+
                               ' ['+AMMode.print(this.mode)+'] (proto '+this.proto+')'+s);
  if (this.mode&AMMode.AMO_UNICAST) {
    if (this.url) {
      link=this.links[this.url];
      link.state = this.broker?AMState.AMS_AWAIT:AMState.AMS_NOTCONNECTED;
      if (link.snd && !(this.mode&AMMode.AMO_ONEWAY))
        startwatch=true;
      if (link.snd && (this.mode&AMMode.AMO_ONEWAY)) 
        this.emit('route+',addr2url(link.snd,true));
      if (this.broker) this.pairing(link);
    }
  }
  
  if (this.broker) {
    startwatch=true;
    // TODO init link['*'].snd / state ..
  }
  if (startwatch) this.watchdog(true);
    
  if (!this.sock) {
    // after stop?
    this.sock=dgram.createSocket("udp4");
    // restart listener
    this.receiver();
  } 
  this.sock/*rcv_sock*/.bind(this.rcv.port, undefined /*this.rcv.address*/, function (arg) {
    if (callback) callback();
  });    
}

// Stop AMP
amp.udp.prototype.stop = function(callback) {
  if (this.mode&AMMode.AMO_MULTICAST) 
    for(var p in this.links) {
      if (this.links[p]) {
        // Try to unlink remote endpoint
        this.unlink(this.links[p].snd);
        this.links[p].state=AMState.AMS_NOTCONNECTED;
      }
    }
  else
    this.links.state = AMState.AMS_NOTCONNECTED;
  if (this.timer) clearTimeout(this.timer),this.timer=undefined;
  if (this.sock) this.sock.close(),this.sock=undefined;
  if (callback) callback();
}



// Unlink remote endpoint
amp.udp.prototype.unlink=function(snd) {
  var self = this,
      buf = Buf.Buffer(),
      url = snd?addr2url(snd,true):null,
      sock = this.sock; //snd_sock;

  if (!this.links[url||this.url] || this.links[url||this.url].state!=AMState.AMS_CONNECTED) return;
  this.emit('route-',addr2url(snd,true));
  if (this.mode&AMMode.AMO_ONEWAY) return;

  Buf.buf_put_int16(buf, magic);
  Buf.buf_put_int16(buf, AMMessageType.AMMUNLINK);
  Buf.buf_put_port(buf,this.port);

  if (this.mode&AMMode.AMO_UNICAST) {
    if (snd==undefined || snd.address==undefined) snd={},snd.address=this.links[this.url].snd.address;
    if (snd.port==undefined) snd.port=this.links[this.url].snd.port;
    url=this.url;
  } 
  if (snd == undefined) this.err('amp.udp.unlink: no destination (snd==null)');

  // Buf.buf_put_int32(buf, this.rcv.port);

  if (this.verbose>1) this.out('amp.unlink: to '+addr2url(snd));
  this.count.snd += Buf.length(buf);

  sock.send(buf.data,0,Buf.length(buf),snd.port,snd.address,function (err) {
      if (err) {
          sock.close();
          self.emit('error',err)
      } 
  });
  this.links[url].state=AMState.AMS_NOTCONNECTED;
  if (!this.links[url].snd.connect) this.links[url].snd={};   // Invalidate link - or remove it from table?
  if (this.broker) {
    // Special case: brokerage! Remove link entry entirely!?
    this.links[url]=undefined;
    if (this.url) this.url=undefined;
  }
  if (this.verbose) this.out('Unlinked ' + addr2url(snd));
};


// Update link table, add new entry, and return snd address (or none if the watchdog should handle the messaging)
amp.udp.prototype.updateLinkTable=function(snd,connect) {
  var link;
  if (!snd) this.err('amp.udp.link: no destinataion set (snd==null)'); 
  url=addr2url(snd,true);

  // Add new link to link table if not already existing
  if (this.broker && !snd.port && !this.links[url]) {
    // Initial broker rendezvous delivering endpoint ip address and port
    link=this.links[url]={
      state:AMState.AMS_AWAIT,
      tries:0,
      connect:connect,
      live:options.AMC_MAXLIVE,
      snd:{name:snd.address}      // Watchdog will send link messages initially to broker if address is resolved
    };
    if (connect) link.snd.connect=true;
    if (this.mode&AMMode.AMO_UNICAST) this.url=url;   // Remember this link
    
    this.pairing(link);
    
    // Let watchdog handle rendezvous and connect request messages
    return;
  } else if (this.mode&AMMode.AMO_UNICAST) {
    // UNICAST mode
    if (!this.links[url]) link=this.links[url]={state:AMState.AMS_NOTCONNECTED};
    else link=this.links[url];
    
    if (snd != undefined && snd.address!=undefined && snd.port!=undefined && !link.snd)
      link.snd=snd;

    if (snd != undefined && snd.address!=undefined && snd.port!=undefined && snd.port!='*' && link.snd.address==undefined) 
      link.snd.address=snd.address;
      
    if (snd != undefined && snd.port!=undefined && link.snd.port==undefined) 
      link.snd.port=snd.port;

    if (connect) link.snd.connect=true;  

    // Nothing to do or let watchdog handle link messages?
    if ((link.state && link.state!=AMState.AMS_NOTCONNECTED && link.state!=AMState.AMS_PAIRED) || 
         this.mode&AMMode.AMO_ONEWAY) return;

    // Random port range p0-p1? Let watchdog do the work
    if (typeof link.snd.port == 'string') return;

    // Send link message
    if (snd==undefined || snd.address==undefined) snd={},snd.address=link.snd.address;
    if (snd.port==undefined) snd.port=link.snd.port;
    
    this.url=url;   // Remember this link
  } else {
    // MULTICAST mode
    if (!this.links[url] || !this.links[url].snd.address) 
      link=this.links[url]={
        snd:snd,
        state:AMState.AMS_NOTCONNECTED,
        tries:0,
        connect:connect,
        live:options.AMC_MAXLIVE
      };
    // Let watchdog handle connect request link messages
    if (!this.inwatchdog && connect) {
      this.watchdog(true);
      return;
    }
    // if (this.verbose>1) this.out('send link '+Io.inspect(snd));
  }
  return snd;
}



/** Install a watchdog timer.
 *
 * 1. If link state is AMS_NOTCONNECTED, retry link request if this.links[].snd is set.
 * 2. If link state is AMS_CONNECTED, check link end point.
 * 3, If link state is AMS_RENDEZVOUS, get remote endpoint connectivity via broker
 *
 * @param run
 */
amp.udp.prototype.watchdog = function(run,immed) {
    var self=this;
    if (this.timer) clearTimeout(self.timer),this.timer=undefined;
    if (run) this.timer=setTimeout(function () {
        var con,to,tokens;
        if (!self.timer || !self.sock || self.inwatchdog) return; // stopped or busy?
        self.timer = undefined;
        self.inwatchdog=true;

        function handle(obj,url) {
          if (self.verbose>1) self.out('Watchdog: handle link '+
                                        url+(obj.snd?('('+obj2url(obj.snd)+')'):'')+' in state '+AMState.print(obj.state)+
                                        '['+obj.live+'] '+
                                        (obj.tries!=undefined?('[#'+obj.tries+']'):''));
          switch (obj.state) {

            case AMState.AMS_CONNECTED:
                if (obj.live == 0) {
                    // No PING received, disconnect...
                    if (self.verbose>0) 
                      self.out('Endpoint ' + addr2url(obj.snd) +
                               ' not responding, propably dead. Unlinking...');
                    // self.emit('route-',addr2url(obj.snd)) .. done in unlink
                    if (self.mode&AMMode.AMO_MULTICAST) self.unlink(obj.snd); 
                    else self.unlink();
                    obj.state = AMState.AMS_NOTCONNECTED;
                    if (!obj.snd.connect) obj.snd={};
                    if (self.broker)  {
                      // Re-register on broker for rendezvous ...
                      self.watchdog(true); 
                      if (self.links['*']) {
                        self.links['*'].state=AMState.AMS_RENDEZVOUS;
                      }
                    }
                } else {
                    obj.tries=0;
                    obj.live--;
                    self.watchdog(true);
                    if (self.mode&AMMode.AMO_MULTICAST) self.ping(obj.snd);
                    else self.ping();
                }
                break;
                
            case AMState.AMS_NOTCONNECTED:
                if (!obj.snd) return;
                if (obj.snd.port && typeof obj.snd.port == 'string') {
                  // Random port connection from a port range p0-p1; save it and start with first
                  // random selection
                  tokens=obj.snd.port.split('-');
                  if (tokens.length==2) obj.range=[Number(tokens[0]),Number(tokens[1])];
                } 
                if (obj.range) {
                  // Get a random port from range
                  obj.snd.port=Comp.random.interval(obj.range[0],obj.range[1]);
                  if (self.verbose>0) 
                    self.out('Trying link to ' + addr2url(obj.snd));
                  if (self.mode&AMMode.AMO_MULTICAST) self.link(obj.snd); 
                  else self.link();
                  obj.tries++;
                  if (obj.tries < options.TRIES) self.watchdog(true);
                  else {
                    obj.snd={},obj.tries=0,obj.range=undefined;   
                  }                 
                } else if (obj.snd.port && typeof obj.snd.port == 'number') {
                  // Try link to specified remote endpoint obj.snd
                  if (self.verbose>0 && obj.tries==0) 
                    self.out('Trying link to ' + addr2url(obj.snd));
                  if (self.mode&AMMode.AMO_MULTICAST) self.link(obj.snd); 
                  else self.link();
                  obj.tries++;
                  if (obj.tries < options.TRIES) self.watchdog(true);
                  else {
                    self.out('Giving up to link '+addr2url(obj.snd));
                    self.emit('error','link',addr2url(obj.snd,true));
                    obj.snd={},obj.tries=0;
                  }
                }
                break;
                
            // AMP Broker P2P Control and Management
            case AMState.AMS_RENDEZVOUS:
                obj.next=Aios.time()+options.REGTMO;
                obj.interval=options.REGTMO;
                self.send(
                  {type:'register',name: self.rcv.name, linfo: self.rcv},
                  self.broker,
                  function () {}
                );
                self.watchdog(true);
                break;
                
            case AMState.AMS_REGISTERED:
                if (obj.snd && obj.snd.name && obj.tries < options.TRIES) {
                  obj.tries++;
                  self.send(
                    {type:'pair', from:self.rcv.name, to: obj.snd.name},
                    self.broker,
                    function () {}
                  );
                  // self.watchdog(true);
                } else if (options.REGTMO && Aios.time() > obj.next) {
                  // Update registration periodically; messages can be lost
                  obj.interval *= 2;
                  obj.interval = Math.min(obj.interval,options.REGTMO*8);
                  obj.next=Aios.time()+obj.interval;
                  self.send(
                    {type:'register',name: self.rcv.name, linfo: self.rcv},
                    self.broker,
                    function () {}
                  );
                }
                self.watchdog(true);
                break;
          }          
        }
        for(var p in self.links) if (self.links[p]) handle(self.links[p],p);
        self.inwatchdog=false;
    },immed?0:options.TIMER);
};
