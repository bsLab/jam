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
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     26-06-16 by sbosse.
 **    $VERSION:     1.3.3
 **
 **    $INFO:
 **
 **  ==============================================
 **  DOS: Broker Connection Module 
 **  Server, TCP connection 
 **  Data transfer: JSON
 **  ==============================================
 *
 * Default: Mode=AUTO
 * 
 *
 *  Uni- or bidirectional TCP client-only (Browser app.) Interface with 
 *  non-blocking / blocking communication to a broker server.
 *
 *  Unidrirectional mode: Two non-persistent TCP connections (non-blocking connection)
 *  Bidirectional mode: One persistent TCP connection (blocking connection)
 *  Keepalive: reuse socket connction (default)
 *
 *
 **    $ENDOFINFO
 */
"use strict";
var log = 0;

var Io = Require('com/io');
var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var util = Require('util');
var net = Require('net');
var xmldoc = Require('dos/ext/xmldoc');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var String = Comp.string;
var Array = Comp.array;
var Obj = Comp.object;
var Filename = Comp.filename;
var div = Perv.div;
var Conn = Require('dos/connutils');

var isNode = Comp.isNodeJS();

var Mode = Conn.Mode;


/**************************
 ** TCPIP Broker SERVER Interface
 **************************/
/**
 *
 * @param {port} hostport
 * @param {string} srv_url
 * @param {string} srv_ipport
 * @param {rpcrouter} router
 * @constructor
 */
// tyepof options = {hostport,srv_url,srv_ipport,router,verbose,env,mode} 
// typeof mode = 'unidir'|'bidir'
var Server = function(options) {
  var self=this;
  this.env=options.env||{};
  this.srv_url=options.srv_url;               // URL
  this.srv_ipport=options.srv_ipport;         // URL:port
  this.hostport=options.hostport;               // Public communication Net.Port == Host port
  this.status = Net.Status.STD_OK;
  this.router=options.router;
  this.app=undefined;
  this.server=undefined;
  // Pending collect requests of clients
  this.client_queue=[];
  // Message queue for client collect requests
  this.rpcio_queue=[];
  // Client request and reply channel cache (ip+ipport hash)
  this.hosts={};
  // Client port-host mapping cache (hostport/sendport hash)
  // There can be multiple ports associated with one hosts[ipport] cache entry 
  this.ports={};
  
  this.lock=false;
  this.mode=Mode.AUTO;  // automatic ONECHAN | TWOCHAN based on client reqeuest
  this.keepalive=(options.keepalive==undefined?true:options.keepalive);

  this.timeout=200;   // Queue timeout
  this.conn_port = Net.uniqport();
  this.rpccon=Rpc.RpcConn(
      self.conn_port,
      /*
      ** send: Connection Forward and Deliver Operation
      ** ONECHAN client connectivity: collect
      ** TWOCHAN client connectivity: forward
      */
      function(rpcio,callback) {
        // if (self.forward(msg)==0) queue it;
        // We must store and handle these messages for client collection requests!!
        // console.log(rpcio)
        // console.log(Net.Print.port(rpcio.sendport))
        var msg=self.format(rpcio),res=0,
            broadcast=rpcio.operation==Rpc.Operation.LOOKUP||rpcio.operation==Rpc.Operation.WHEREIS;
        // Try first direct forwarding ...
        if (broadcast) res=self.broadcast(msg);
        else res=self.forward(msg);
        if (!res || broadcast) {
          // Now queue message for collecting clients
          rpcio.timeout=Sch.GetTime()+(broadcast?self.timeout:self.timeout*5);
          self.rpcio_queue.push(rpcio);
          // Trigger schedule
          if (callback && rpcio.callback==undefined) rpcio.callback=callback;
          else if (rpcio.callback!=undefined) Io.out('[BHPS] Warning: RPCIO has a callback: '+util.inspect(rpcio));
          self.schedule();
        } else {
          if (callback) callback(Net.Status.STD_OK,rpcio);
        }
      },
      // alive: We're handling multiple client connections - we're alive
      function() {
          return true;
      }
  );
  this.rpccon.multiport=true;
  this.verbose=options.verbose||0;
  this.warned=0;
  this.last=undefined;
  this.stats=this.rpccon.stats;
  
  // Transfer of multi-part messages?
  this.multipart=true;
};

Server.prototype.add_host = function (msg,port) {
  var ipid=msg.ip+msg.ipport;
  // client in TWOCHAN mode, save connection record 
  if (this.hosts[ipid]) { this.ports[port]=this.hosts[ipid]; this.hosts[ipid].timeout=5000; } 
  else
    this.hosts[ipid]=
    this.ports[port]=
      {ip:msg.ip,ipport:msg.ipport,nokeepalive:msg.nokeepalive,timeout:5000};

}

/** Broadcast a message to all clients
 *
 */
Server.prototype.broadcast = function (msg) {   
  var self=this,
      res=0;
  Io.log(((log+this.verbose) < 2) || ('[BTPS] broadcast message'));

  if (msg.status==undefined) msg.status='EOK';

  for(var i in this.hosts) {
    if (this.hosts[i]!=undefined) {
      res++;
      self.send(self.reply(this.hosts[i],msg));
    }
  }

  if (res) this.stats.op_broadcast++;
  return res;
}

/** Client-App collet request (send pending and queued TRANSREQ/TRANSREP/LOOKUP messages)
 *  Used only in ONECHAN mode!! 
 *
 */

Server.prototype.collect = function (msg) {   // HTTP Callback handler
  var res,
      self=this,
      timeout=(msg.timeout != undefined) ? (Perv.int_of_string(msg.timeout)) : 0;
  if (timeout) msg.timeout=timeout;
  
  this.stats.op_forward++;
  /*
   ** 1. Forward TRANS message requests if there are pending requests for the host port.
   ** 2. Forward TRANS message replies if there are pending replies for the host port.
   ** 3. Forward LOOKUP messages (broadcast)
   ** 4. Forward IAMHERE messages 
   ** If there are actually no messages, add this request to the request queue (if timeout <>0).
   */
  /*
  ** Forward all pending transaction requests and replies...
   */
  Io.log(((log+self.verbose) < 2) || ('[BTPS] collect for client host ' + Net.Print.port(msg.hostport)+
          ' #rpcio='+ Array.length(this.rpcio_queue)));
  res=this.schedule_client(msg,true);

  if (res && msg.timeout)
    this.client_queue.push(msg);
};

/** Create a forward/reply message from a rpcio object 
 *
 */
Server.prototype.format = function (rpcio) {
  var msg,obj,buf;
  switch (rpcio.operation) {
    case Rpc.Operation.TRANSREQ:
      obj = rpcio.to_json('simple');
      msg={rpc:'trans',hostport:rpcio.hostport,sendport:rpcio.sendport,
           tid:rpcio.tid,hop:rpcio.hop,header:obj.header,data:obj.data};
      break;
    case Rpc.Operation.TRANSREP:
      obj = rpcio.to_json('simple');
      msg={rpc:'reply',hostport:rpcio.hostport,sendport:rpcio.sendport,
           tid:rpcio.tid,hop:rpcio.hop,header:obj.header,data:obj.data};
      break;
    case Rpc.Operation.LOOKUP:
      buf = Buf.Buffer();
      Buf.buf_put_port(buf, rpcio.header.h_port);
      msg={rpc:'lookup',hostport:rpcio.hostport,
           hop:rpcio.hop,data:Buf.buf_to_hex(buf)};
      break;
    case Rpc.Operation.IAMHERE:
      buf = Buf.Buffer();
      Buf.buf_put_port(buf, rpcio.header.h_port);
      msg={rpc:'iamhere',hostport:rpcio.hostport,sendport:rpcio.sendport,
           hop:rpcio.hop,data:Buf.buf_to_hex(buf)};
      break;
    case Rpc.Operation.WHEREIS:
      buf = Buf.Buffer();
      msg={rpc:'whereis',hostport:rpcio.hostport,sendport:rpcio.sendport,
           hop:rpcio.hop};
      break;
    case Rpc.Operation.HEREIS:
      buf = Buf.Buffer();
      msg={rpc:'hereis',hostport:rpcio.hostport,sendport:rpcio.sendport,
           hop:rpcio.hop};
      break;
  }  
  if (!msg) console.log(rpcio)
  return msg;
}



/** Client-App forwarding (send pending and queued TRANSREQ/TRANSREP/LOOKUP/IAMHERE messages)
 *  Used only in TWOCHAN mode!! Called from router.
 */

Server.prototype.forward = function (msg) {   
  var res=0,
      self=this;
  
  /*
   ** 1. Forward TRANS message request if there are pending requests for the host port.
   ** 2. Forward TRANS message reply if there are pending replies for the host port.
   ** 3. Forward LOOKUP messages (broadcast)
   */
  /*
  ** Forward all pending transaction requests and replies...
   */
  Io.log(((log+this.verbose) < 2) || (
      '[BTPS] forward to host ' + (msg.sendport?Net.Print.port(msg.sendport)+'? '+(this.ports[msg.sendport]!=undefined):
                                               'broadcast')
      ));

  if (msg.status==undefined) msg.status='EOK';

  // console.log(msg)
  if (msg.sendport && this.ports[msg.sendport]) {
    res++;
    self.send(self.reply(this.ports[msg.sendport],msg));
  } 

  if (res) this.stats.op_forward++;
  return res;
};

/** Initialize this server
 *
 */
Server.prototype.init = function (callback) {
  var self = this;
  this.router.add_conn(self.rpccon);
};

Server.prototype.log = function (v) {log=v};


/** Create a reply message from a request message and a reply object.
 *
 */
Server.prototype.reply = function (msg,obj) {
  var reply={},
      p;
  if (msg.ipport) {
    // Client in TWOCAHN mode with reply channel
    reply.ip=msg.ip;
    reply.ipport=msg.ipport;
    if (msg.nokeepalive) reply.nokeepalive=true;
  } else {
    // client in ONECHAN mode, share request channel
    reply.socket=msg.socket;
  }
  for (p in obj) reply[p]=obj[p];
  if (msg.tid != undefined) reply.tid=msg.tid;
  switch (msg.type) {
    case 'alive': 
    case 'ask':
    case 'notify':
    case 'request': 
      reply.type=msg.type+'-reply'; break;
  }
  return reply;
}

/** Main client request entry point.
 *
 */
Server.prototype.request = function (msg) {
  var i,str,
      self=this,
      buf, rpcio, hdr, id;
  this.rpccon.stats.op_get++;
  Io.log(((log+self.verbose) < 2) || ('[BTPS] client request: ' + (msg.rpc||msg.type)+' from '+msg.ip+':'+msg.ipport));
  Io.log(((log+self.verbose) < 3) || ('[BTPS] client request: ' + util.inspect(msg)));

  if (this.multipart) Conn.decode(msg);

  if (msg.rpc != undefined) {
    switch (msg.rpc) {
      case 'lookup':
        /********************************
         ** LOOKUP rpc message
         ********************************/
        // hostport tid
        buf = Buf.Buffer(msg.data);
        // OK this.router.add_host(msg.hostport, this.rpccon.port);
        rpcio=self.router.pkt_get();
        rpcio.operation=Rpc.Operation.LOOKUP;
        rpcio.connport=this.rpccon.port;
        rpcio.hostport=msg.hostport;
        rpcio.hop=msg.hop;
        //rpcio.sendport=self.router.hostport;
        rpcio.header.h_port=Buf.buf_get_port(buf);;
        this.router.route(rpcio);
        // this.send(this.reply(msg,{status:'EOK'}));
        break;
      case 'iamhere':
        /********************************
         ** IAMHERE rpc message
         ********************************/
        buf = Buf.Buffer(msg.data);
        this.router.add_host(msg.hostport, this.rpccon.port);
        rpcio=this.router.pkt_get();
        rpcio.operation=Rpc.Operation.IAMHERE;
        rpcio.connport=this.rpccon.port;
        rpcio.hostport=msg.hostport;
        rpcio.sendport=msg.sendport;
        rpcio.header.h_port=Buf.buf_get_port(buf);;
        rpcio.hop=msg.hop;
        this.router.route(rpcio);
        // this.send(this.reply(msg,{status:'EOK'}));
        break;
      case 'trans':
        /**************************************************
         ** RPC TRANS message (Client- /Browser App. transaction request)
         *************************************************/

        rpcio = self.router.pkt_get();
        buf = Buf.Buffer(msg.header);
        Buf.buf_get_hdr(buf, rpcio.header); 
        Io.log((log < 2) || (('[BTPS] trans header: ' + Net.Print.header(rpcio.header))));
        rpcio.init(Rpc.Operation.TRANSREQ, rpcio.header, msg.data);
        rpcio.context=undefined;  // rpc not from here!
        rpcio.tid = msg.tid; 
        rpcio.hostport = msg.hostport;
        rpcio.sendport = msg.sendport;
        rpcio.hop=msg.hop;
        rpcio.connport=this.rpccon.port;

        if (msg.ipport) 
          // client in TWOCHAN mode
          this.add_host(msg,msg.hostport); 
//        else
          // client in ONECHAN mode
//          this.send(self.reply(msg,{status:'EWOULDBLOCK'})); 

        this.router.add_host(rpcio.hostport,self.rpccon.port);
        this.router.route(rpcio);
        break;
      case 'reply':
        /*************************
         * RPC Transaction Reply
         ************************/

        /*
        ** Reply for a transaction must be forwarded to the transaction origin collected by the source host application and
        ** the next http get/?rpc=request request.
        */
        // New transaction request from client app., add it to the transaction queue.
        buf = Buf.Buffer(msg.header);
        rpcio = this.router.pkt_get();
        Buf.buf_get_hdr(buf,rpcio.header);
        rpcio.init(Rpc.Operation.TRANSREP, rpcio.header, msg.data);
        rpcio.context=undefined;    // rpc not from here!
        rpcio.tid = msg.tid;
        rpcio.hostport = msg.hostport;
        rpcio.sendport = msg.sendport;
        rpcio.hop=msg.hop;
        rpcio.connport = this.rpccon.port;
        Io.log(((log+this.verbose) < 2)||('[BTPS] reply: hostport=' + Net.Print.port(msg.hostport) + 
                ' sendport='+Net.Print.port(msg.sendport) +
                ' tid=' + msg.tid + ' srvport=' + Net.Print.port(rpcio.header.h_port)));
        // ?? this.router.add_host(msg.hostport, this.rpccon.port);
        this.router.route(rpcio);
        //res.
        // ONECHAN mode only?
        // this.send(this.reply(msg,{status:'EOK'}));
        break; 
      default:
        this.send(self.reply(msg,{status:'EINVALID'}));        
    }
  } else if (msg.type != undefined) {
    switch (msg.type) {
      case 'alive':
        /***************************
         ** ALIVE message request
         ***************************/
        this.rpccon.stats.op_alive++;

        buf=Buf.Buffer();

        if (this.verbose && this.router.lookup_host(msg.hostport)==undefined) 
          Io.out('[BTPS] ALIVE! Adding remote host ' + 
                 Net.Print.port(msg.hostport) + ' ip=' + msg.ip + (msg.ipport!='undefined'?(' ipport=' + msg.ipport):''));
        this.router.add_host(msg.hostport,this.rpccon.port);
        if (msg.ipport) 
          // client in TWOCHAN mode
          this.add_host(msg,msg.hostport);
        //res.

        Buf.buf_put_port(buf,this.hostport);
        this.send(this.reply(msg,{status:'EOK',data:Buf.buf_to_hex(buf)}));
        break;
      case 'ask':
        /***************************
         ** ASK message request
         ***************************/
        this.rpccon.stats.op_ask++;
        buf=Buf.Buffer();
        //console.log(self.env[msg.xname]);
        Buf.buf_put_string(buf,this.env[msg.xname]||'undefined');
        this.send(this.reply(msg,{status:'EOK', data:Buf.buf_to_hex(buf)}));
        break;
      case 'notify':
        /***************************
         ** NOTIFY message request
         ***************************/
        this.rpccon.stats.op_notify++;
        this.env[msg.xname]=msg.xvalue;
        //console.log(self.env[msg.xname]);
        this.send(this.reply(msg,{status:'EOK'}));
        break;
      case 'request':
        /**************************************************
         ** RPC collect request (ONECHAN mode only)
         *************************************************/
        // Used only in ONECHAN mode!
        if (msg.ipport)  // client in TWOCHAN mode 
          this.send(this.reply(msg,{status:'EINVALID'}));
        else 
          this.collect(msg);
        break;
      default:
        this.send(self.reply(msg,{status:'EINVALID'}));        
    }
  } else
    this.send(self.reply(msg,{status:'EINVALID'}));
};


/*
**  Schedule all pending client-side requests if there is matching input.
**  Called from router function. Lock required!
*/

Server.prototype.schedule = function () {
  var self = this;
  
  if (self.lock) return;
  this.rpccon.stats.op_schedule++;
  Io.log(((log+self.verbose)<2) || ('[BTPS] schedule #clients='+this.client_queue.length+' .. '));

  this.lock = true;
  this.client_queue = Array.filter(self.client_queue, function (client) {
      /*
       * Forward all matching pending transaction requests and replies...
       */
      Io.log(((log+self.verbose) < 2) || ('[BTPS] schedule for client host ' + Net.Print.port(client.hostport)+
          ' #rpcio='+ Array.length(self.rpcio_queue)));
      return self.schedule_client(client,true);
  });
  this.lock = false;
};

/** Schedule pending transaction replies for a client (message)
 *
 */

Server.prototype.schedule_client = function (client /* msg */, discard) {
  var msgn = 0,
      self = this,
      data = [],
      hostport = client.hostport,
      len=this.rpcio_queue.length,
      buf;

  this.rpcio_queue = Array.filter(this.rpcio_queue, function (rpcio) {
    var hostport2;
    switch (rpcio.operation) {
      case Rpc.Operation.TRANSREQ:
      case Rpc.Operation.TRANSREP:
        hostport2 = self.router.lookup_port(rpcio.header.h_port);
        if ((hostport2 && rpcio.operation==Rpc.Operation.TRANSREQ && Net.port_cmp(hostport,hostport2)) ||
            (rpcio.sendport && rpcio.operation==Rpc.Operation.TRANSREP && Net.port_cmp(hostport,rpcio.sendport)) ||
            (rpcio.sendport && rpcio.operation==Rpc.Operation.TRANSREQ && Net.port_cmp(hostport,rpcio.sendport))) {
          data.push(rpcio.to_json('extended'));
          msgn++;
          if (rpcio.callback) {rpcio.callback(Net.Status.STD_OK,rpcio); rpcio.callback=undefined;};
          return false;
        } else return true;
        break;        
        
      /*
      ** Add all pending server port LOOKUP requests that are broadcast messages! ...
      ** Forward a LOOKUP of a server port search only once to a client host!
      ** Do not broadcast a LOOKUP to the initiator host (hostport)!
      */
      case Rpc.Operation.LOOKUP:
        if (rpcio.cache[hostport]==undefined && !Net.port_cmp(hostport,rpcio.hostport)) {
          Io.log((self.router.monitor < 2) || ('[BTPS] schedule: lookup '+Rpc.Print.rpcio(rpcio)));
          rpcio.cache[hostport]=1;
          buf = Buf.Buffer();
          Buf.buf_put_port(buf, rpcio.header.h_port);
          data.push({
            rpc:'lookup',
            hostport:rpcio.hostport,
            data:Buf.buf_to_hex(buf)
          });
          // Broadcast message! rpcio.callback handled in garbage collector
          msgn++;
         }
        return true;
        break;
        
      case Rpc.Operation.IAMHERE:
        if (Net.port_cmp(hostport,rpcio.sendport)) {
          buf = Buf.Buffer();
          Buf.buf_put_port(buf, rpcio.header.h_port);
          data.push({
            rpc:'iamhere',
            hostport:rpcio.hostport,
            sendport:rpcio.sendport,
            data:Buf.buf_to_hex(buf)
          });
          msgn++;
          if (rpcio.callback) {rpcio.callback(Net.Status.STD_OK,rpcio); rpcio.callback=undefined;};
          return false;
        } else return true;
        break;
    }
    return true;
  });

  Io.log(((log+self.verbose) < 2) || ('[BTPS] schedule_client for host ' + Net.Print.port(hostport)+ ' ['+len+'] '+util.inspect(data)));

  if (msgn>0) {
      self.send(self.reply(client,{status:'EOK',data:data}));
      return false;
  } else if (client.timeout<=0) {
      self.send(self.reply(client,{status:'ENOENTR'}));
      return false;
  } else {
    return true;
  }
}


/** Send a message to a destination
 *
 */
// function send(repsonse:socket,data:string)
Server.prototype.send = function (msg) {
  var client, 
      self=this,
      socket,
      data,ipid;
  //response.writeHead(200, {'Content-Type': 'text/plain; charset=utf8'});
  //response.writeHead(200);
  this.rpccon.stats.op_send++;
  if (msg.socket)
    // client in ONECHAN mode
    {socket=msg.socket; msg.socket=undefined;};
  if (this.multipart) Conn.encode(msg);
  
  Io.log(((log+this.verbose)<2)||('[BTPS] send ['+util.inspect(msg)+'] -> '+
          (socket?'socket':(msg.ip+':'+msg.ipport))));
  if (socket) {
    // client in ONECHAN mode
    data = JSON.stringify(msg);
    // console.log(data);
    if (this.multipart) socket.write(data+Conn.EOM);
    else socket.write(data); 
    this.warned=0;
  } else if (msg.ip) {
    // client in TWOCHAN mode
    
    data = JSON.stringify(msg);
    ipid=msg.ip+msg.ipport;
    if (self.hosts[ipid] && self.hosts[ipid].socket) {
      // use cached socket
      // console.log('using socket');
      client=self.hosts[ipid].socket;
      if (self.multipart) client.write(data+Conn.EOM);
      else client.write(data);
      self.hosts[ipid].timeout=5000;
    } else {
      client = net.connect(msg.ipport,msg.ip, function() {
        // console.log('connected to client');
        self.warned=0;
        client.setNoDelay(true);
        if (self.multipart) client.write(data+Conn.EOM);
        else client.write(data);
        if (!self.keepalive || msg.nokeepalive) {
          //client.end();
          client.destroy();
          client=undefined;
        }
        if (client && self.hosts[ipid]) {
          self.hosts[ipid].socket=client;
          self.hosts[ipid].timeout=5000;
        } else if (client) self_add_host(msg,msg.sendport);
      });
      client.on('error', function (e) {
        if (self.warned<2) {
          Io.out('[BTPS] Communication error to ' +msg.ip+':'+msg.ipport+(self.warned==1?' (more)':'')+' : '+e);
          self.warned++;
        }    
      });
    }
  } else Io.warn('[BTPS] Cannot send message: Neither return IP nor request socket for: '+util.inspect(msg));
};





/**
 *
 * @param {number} [interval]
 */
Server.prototype.start = function (interval) {
  var self = this;
  // Service client requests
  this.server = net.createServer(function (socket){
      
      // console.log(socket);
      // console.log('Connection ..');
      socket.setNoDelay(true);
      socket.on('data', function(data) {
        var req,part,parts;
        Io.log(((log+self.verbose)<2)||('[BTPS] Received: ' + data));
        if (self.multipart) parts=Conn.splitData(data);
        else parts=[data];
        if (self.last) parts[0]=self.last+parts[0];
        if (Array.last(parts) != '') self.last=Array.last(parts); else self.last=undefined;

          // console.log(parts)
        
        for(part in parts) {
          if (parts[part]=='') continue;
          req = JSON.parse(parts[part]);
          if (self.multipart) Conn.decode(req);
          if (!req.ipport) req.socket=socket; // client is in ONECHAN mode
          else if (!self.keepalive || req.nokeepalive) 
            // socket.end('');  // client is in TWOCHAN mode TODO keepalive?
            socket.destroy();
          self.request(req);
        }
      });
      socket.on("error", function (er) {
        if (er != 'Error: This socket has been ended by the other party')
          Io.out('[BTPS] Communication error on *:' + self.srv_ipport+' : '+er);
      });
      socket.on('close', function(data) {
        // console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
      });
    });
  if (!interval) interval=1000;
  /*
  ** Start a client service and garbage collector for blocked client-side transactions (self.client_queue)
   */
  Sch.AddTimer(interval, 'BTPS Garbage Collector', function (context) {
      var h,p, host, port, time;
      Io.log(((log+self.verbose)<4)||('[BTPS] Garbage Collector'));
      if (!self.lock) {
          self.lock = true;
          self.client_queue = Array.filter(self.client_queue, function (client) {
            var res = self.schedule_client(client,false /*?*/);
            client.timeout -= interval;
            return res;
          });
          for (h in self.hosts) {
              host=self.hosts[h];
              // console.log(self.hosts[p])
              if (self.hosts[h]) {
                              
                host.timeout = host.timeout - interval;
                if (host.timeout <= 0) {
                  Io.log(((log+self.verbose)<2)||('[BTPS] Host cache: Removing host '+
                          host.ip+':'+host.ipport));
                  self.hosts[h]=undefined;
                  for (p in self.ports) {
                    port=self.ports[p];
                    if (port) {
                      if (host.ip==port.ip && host.ipport==port.ipport) {
                        self.ports[p]=undefined;
                          Io.log(((log+self.verbose)<2)||('[BTPS] Host cache: Removing port '+Net.Print.port(p)+' for host '+
                                  host.ip+':'+host.ipport));                      
                      }
                    }
                  }
                }
              }
            }
          time=Sch.GetTime();
          self.rpcio_queue = Array.filter(self.rpcio_queue, function (rpcio) {
            if (rpcio.timeout > 0 && rpcio.timeout <= time) {
              Io.log(((log+self.verbose)<2)||('[BTPS] RPCIO cache: Removing '+
                       Rpc.Print.rpcio(rpcio)));
              
              if (rpcio.callback) { rpcio.callback(
                rpcio.operation==Rpc.Operation.LOOKUP?Net.Status.STD_OK:Net.Status.RPC_FAILURE,
                rpcio); rpcio.callback=undefined;};
              return false;
            }
            else return true;
          });
            
          self.lock = false;
      } else {
          context.blocked=false;
          context.timer=Sch.time;
          Sch.ScheduleNext();
      }
  });
  this.server.listen(this.srv_ipport, function() {
//      console.log('[BTPS] Listening on *:' + self.server.address().port+ ' TCPNET in mode '+self.mode+
//                  (self.keepalive?' KEEPALIVE':''));
      console.log('[BTPS] Listening on *:' + self.server.address().port+ ' TCPNET in mode '+self.mode);
    });
};

Server.prototype.stop = function () {
  Sch.RemoveTimer('BTPS Garbage Collector');
}

module.exports = {
  /** RCP Broker Server for client-capable-only applications
   *
   */
  // typeof options = {hostport:port,srv_ip,srv_ipport,router,verbose?,env?:{}}
  Mode: Mode,
  Server: function(options) {
      var obj = new Server(options);
      Object.preventExtensions(obj);
      return obj;
  }
};
