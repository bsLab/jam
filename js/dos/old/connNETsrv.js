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
 **    $INITIAL:     (C) 2006-2016 bLAB
 **    $CREATED:     26-06-16 by sbosse.
 **    $VERSION:     1.1.27
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
 * Notes:
 * Superfluous? All network function callback computations are wrapped by scheduler callbacks 
 * to avoid main thread preemption!
 * Is event queuing always guaranteed in JS?
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
var util = require('util');
var net = require('net');
var xmldoc = Require('dos/ext/xmldoc');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var String = Comp.string;
var Array = Comp.array;
var Filename = Comp.filename;
var trace = Io.tracing;
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
  this.env=options.env||{};
  this.srv_url=options.srv_url;               // URL
  this.srv_ipport=options.srv_ipport;         // URL:port
  this.hostport=options.hostport;               // Public communication Net.Port == Host port
  this.status = Net.Status.STD_OK;
  this.router=options.router;
  this.app=undefined;
  this.server=undefined;
  this.client_queue=[];
  // Client request and reply channel cache
  this.hosts={};
  this.lock=false;
  this.mode=Mode.AUTO;  // automatic ONECHAN | TWOCHAN based on client reqeuest
  this.keepalive=(options.keepalive==undefined?true:options.keepalive);
  this.conn_port = Net.uniqport();
  this.rpccon=Rpc.RpcConn(
      self.conn_port,
      /*
      ** Connection Forward and Deliver Operation
      ** ONECHAN client connectivity: collect
      ** TWOCHAN client connectivity: forward
      */
      function(rpcio,callback) {
        // TODO        
      },
      // We're handling multiple client connections - we're alive
      function() {
          return true;
      }
  )
  this.verbose=options.verbose||0;
  this.warned=0;
  this.last=undefined;
  
  // Transfer of multi-part messages?
  this.multipart=true;
};

/** Client-App broadcasting 
 *  Used only in TWOCHAN mode!! Called from router.
 */

Server.prototype.broadcast = function (msg) {   // HTTP Callback handler
  var res=0,
      self=this,
      host,p;
  
  /*
   ** 1. Forward TRANS message request if there are pending requests for the host port.
   ** 2. Forward TRANS message reply if there are pending replies for the host port.
   ** 3. Forward LOOKUP messages (broadcast)
   */
  /*
  ** Forward all pending transaction requests and replies...
   */
  Io.log(((log+self.verbose) < 2) || (
      '[BTPS] broadcast from host ' + Net.Print.port(msg.hostport)
      ));

  if (msg.status==undefined) msg.status='EOK';

  // console.log(msg)
  for (p in this.hosts) {
    if (this.hosts[p]==undefined) continue;
    host=this.hosts[p];
    res++;
    self.send(self.reply(host,msg));
  }

  if (res) this.rpccon.stats.op_forward++;

  return res;
};

/** Client-App request (collecting pending and queued TRANSREQ/TRANSREP/LOOKUP messages)
 *  Used only in ONECHAN mode!! 
 */

Server.prototype.collect = function (self, msg) {   // HTTP Callback handler
  var res,
      timeout=(msg.timeout != undefined) ? (Perv.int_of_string(msg.timeout)) : 0;
  if (timeout) msg.timeout=timeout;
  
  this.rpccon.stats.op_forward++;
  /*
   ** 1. Forward TRANS message requests if there are pending requests for the host port.
   ** 2. Forward TRANS message replies if there are pending replies for the host port.
   ** 3. Forward LOOKUP messages (broadcast)
   ** If there are actually no messages, add this request to the request queue (if timeout <>0).
   */
  /*
  ** Forward all pending transaction requests and replies...
   */
  Io.log(((log+self.verbose) < 2) || ('[BTPS] collect for host ' + Net.Print.port(msg.hostport)+
      ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+Array.length(self.router.lookup_queue)));
  res=this.schedule_client(msg,true);

  if (res && msg.timeout)
    self.client_queue.push(msg);
};

/** Client-App forwarding (send pending and queued TRANSREQ/TRANSREP/LOOKUP messages)
 *  Used only in TWOCHAN mode!! Called from router.
 */

Server.prototype.forward = function (msg) {   // HTTP Callback handler
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
  Io.log(((log+self.verbose) < 2) || (
      '[BTPS] forward for host ' + Net.Print.port(msg.hostport)+
      ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+
      Array.length(self.router.lookup_queue)+
      ' hosts[msg.sendport]? '+(this.hosts[msg.sendport]!=undefined)));

  if (msg.status==undefined) msg.status='EOK';

  // console.log(msg)
  if (this.hosts[msg.sendport]) {
    res++;
    self.send(self.reply(this.hosts[msg.sendport],msg));
  }

  if (res) this.rpccon.stats.op_forward++;

  return res;
};

/** Initialize this server
 *
 */
Server.prototype.init = function () {
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
          //if (self.mode==Mode.ONECHAN) req.socket=socket;
          if (!req.ipport) req.socket=socket; // client is in ONECHAN mode
          else if (!self.keepalive || req.nokeepalive) socket.end('');  // client is in TWOCHAN mode TODO keepalive?
          self.request(self,req);
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
  this.router.add_conn(self.rpccon);
};

Server.prototype.log = function (v) {log=v};


/** Create a reply message from a request message and a reply object.
 *
 */
Server.prototype.reply = function (msg,obj) {
  var reply={},
      //tid,
      //rid,
      p;
  //if (this.mode==Mode.TWOCHAN) {
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
  //if (obj.tid - int(obj.tid)) {
  //  tid=int(obj.tid);
  //  rid=int((obj.tid-tid)*100000);
  //  reply.tid=tid;
  //}
  if (msg.tid != undefined) reply.tid=msg.tid;
  // if (msg.rid != undefined) reply.rid=msg.rid;
  // if (rid) reply.rid=rid;
  return reply;
}

/** Main request entry point.
 *
 */
Server.prototype.request = function (self, msg) {
  
  var i,str,
       buf, rpcio, hdr;
  this.rpccon.stats.op_get++;
  Io.log(((log+self.verbose) < 2) || ('[BTPS] server request: ' + (msg.rpc||msg.type)+' from '+msg.ip+':'+msg.ipport));
  Io.log(((log+self.verbose) < 3) || ('[BTPS] server request: ' + util.inspect(msg)));
  // Io.trace(trace || ('[BTPS] server request: ' + req.url));

  if (this.multipart) Conn.decode(msg);

  if (msg.rpc != undefined &&
      msg.rpc == 'request' &&
      msg.hostport != undefined)
  {
      /**************************************************
       ** RPC forward request (Client- /Browser App. collector request)
       *************************************************/
      // Used only in ONECHAN mode!
      // if (this.mode!=Mode.ONECHAN) 
      if (msg.ipport)  // client in TWOCHAN mode 
        this.send(self.reply(msg,{status:'EINVALID'}));
      else 
        Sch.ScheduleCallback([Sch.Bind(self,self.collect),self, msg]);
      
  } else if (msg.rpc != undefined &&
      msg.rpc == 'iamhere' &&
      msg.hostport != undefined &&
      msg.srvport != undefined)
  {
      /********************************
       ** short IAMHERE rpc message
       ********************************/
      {
          if (self.verbose && self.router.lookup_host(msg.hostport)==undefined) 
            Io.out('[BTPS] IAMHERE! Adding remote host ' + 
               Net.Print.port(msg.hostport) + ' ip=' + req.connection.remoteAddress + 
              ((msg.port && msg.port!='undefined')?(' ipport=' + msg.port):''));
          self.router.add_host(msg.hostport, self.rpccon.port);
          var rpcio=self.router.pkt_get();
          rpcio.operation=Rpc.Operation.IAMHERE;
          rpcio.connport=self.rpccon.port;
          rpcio.hostport=msg.hostport;
          rpcio.sendport=self.router.hostport;
          rpcio.header.h_port=msg.srvport;
          self.router.route(rpcio);

      }
      /*
      {
          self.router.add_port(srvport, hostport);
          self.router.add_host(hostport, self.rpccon.port);
          Io.log((log < 1) || ('[BTPS] server get IAMHERE: adding server port ' +
              Net.Print.port(srvport) + ' located on host ' + Net.Print.port(hostport)));
          self.router.remove_lookup(srvport);
          // TBD: search for stalled transactions that must be send to another server capable host!
          // Broker connected client apps. will collect the appropriate transaction on the next request round.
          //res.
      }
      */
      
      self.send(self.reply(msg,{status:'EOK'}));
  } else if (msg.rpc != undefined &&
             msg.rpc == 'trans' &&
             msg.hostport != undefined &&
             msg.tid != undefined)
  {  
      /**************************************************
       ** RPC TRANS message (Client- /Browser App. transaction request)
       *************************************************/
      
      rpcio = self.router.pkt_get();
      buf = Buf.Buffer(msg.data.header);
      Buf.buf_get_hdr(buf, rpcio.header); 
      Io.log((log < 2) || (('[BTPS] trans header: ' + Net.Print.header(rpcio.header))));
      rpcio.init(Rpc.Operation.TRANSREQ, rpcio.header, msg.data.data);
      rpcio.context=undefined;  // rpc not from here!
      rpcio.tid = msg.tid; // +(msg.rid?msg.rid/100000:0); // Hack: store rid after decimal point

      rpcio.hostport = msg.hostport;
        
      // if (self.mode==Mode.TWOCHAN) 
      if (msg.ipport) {
        // client in TWOCHAN mode
        self.hosts[msg.hostport]={ip:msg.ip,ipport:msg.ipport,nokeepalive:msg.nokeepalive,
                                  // rid:msg.rid,    // race condition: more than one request from host
                                  hostport:msg.hostport,timeout:5000};
      //if (self.mode==Mode.ONECHAN) 
      } else
        // client in ONECHAN mode
        self.send(self.reply(msg,{status:'EWOULDBLOCK'})); 
      
      // if (local request) service ..
      self.router.add_host(rpcio.hostport,self.rpccon.port);
      self.router.route(rpcio);
      // TBD: Check for local waiting servers in routing_db...
      //res.
  
  } else if (msg.rpc != undefined &&
             msg.rpc == 'reply' &&
             msg.hostport != undefined &&
             msg.tid != undefined) {
      /*************************
       * RPC Transaction Reply
       ************************/
  
      /*
      ** Reply for a transaction must be forwarded to the transaction origin collected by the source host application and
      ** the next http get/?rpc=request request.
      */
      // New transaction request from client app., add it to the transaction queue.
      buf = Buf.Buffer(msg.data.header);
      rpcio = self.router.pkt_get();
      Buf.buf_get_hdr(buf,rpcio.header);
      rpcio.init(Rpc.Operation.TRANSREP, rpcio.header, msg.data.data);
      rpcio.context=undefined;    // rpc not from here!

      rpcio.tid = msg.tid;
      rpcio.hostport = msg.hostport;
      rpcio.sendport = msg.sendport;

      Io.log(((log+self.verbose) < 2)||('[BTPS] post: got reply, hostport=' +
              Net.Print.port(msg.hostport) + ' tid=' + msg.tid + ' srvport=' + Net.Print.port(rpcio.header.h_port)));
      self.router.route(rpcio);
      //res.
      // ONECHAN mode only?
      self.send(self.reply(msg,{status:'EOK'}));
  
  } else if (msg.type != undefined &&
             msg.type == 'alive' &&
             msg.hostport != undefined)
  {
      /***************************
       ** ALIVE message request
       ***************************/
      this.rpccon.stats.op_alive++;

      buf=Buf.Buffer();

      if (self.verbose && self.router.lookup_host(msg.hostport)==undefined) 
        Io.out('[BTPS] ALIVE! Adding remote host ' + 
               Net.Print.port(msg.hostport) + ' ip=' + msg.ip + (msg.ipport!='undefined'?(' ipport=' + msg.ipport):''));
      // TODO this.router.add_host(hostport, [msg.url, msg.port]);
      self.router.add_host(msg.hostport,self.rpccon.port);
      // if (self.mode==Mode.TWOCHAN) 
      if (msg.ipport)
        // client in TWOCHAN mode, save connection record   
        self.hosts[msg.hostport]={ip:msg.ip,ipport:msg.ipport,nokeepalive:msg.nokeepalive,
                                  hostport:msg.hostport,timeout:5000};
      //res.
      
      Buf.buf_put_port(buf,self.hostport);
      self.send(self.reply(msg,{status:'EOK',data:Buf.buf_to_hex(buf)}));
  } else if (msg.type != undefined &&
             msg.type == 'ask' &&
             msg.xname != undefined)
  {
      /***************************
       ** ASK message request
       ***************************/
      this.rpccon.stats.op_ask++;
      buf=Buf.Buffer();
      //console.log(self.env[msg.xname]);
      Buf.buf_put_string(buf,self.env[msg.xname]||'undefined');
      self.send(self.reply(msg,{status:'EOK', data:Buf.buf_to_hex(buf)}));
  } else if (msg.type != undefined &&
             msg.type == 'notify' &&
             msg.xname != undefined &&
             msg.xvalue !=undefined)
  {
      /***************************
       ** NOTIFY message request
       ***************************/
      this.rpccon.stats.op_notify++;
      self.env[msg.xname]=msg.xvalue;
      //console.log(self.env[msg.xname]);
      self.send(self.reply(msg,{status:'EOK'}));
  }    // res.
  else
      self.send(self.reply(msg,{status:'EINVALID'}));
};



/** Schedule pending transaction replies for a client (message)
 *
 */
Server.prototype.schedule_client = function (client /* msg */, discard) {
  var msgn = 0,
      self = this,
      data = [],
      buf, trans, cache, lookup;


  Io.log((self.router.monitor < 1) || ('[BTPS] schedule_client for host ' + Net.Print.port(client.hostport)+
      ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+Array.length(self.router.lookup_queue)));
  do {
      trans = self.router.lookup_trans_for_host(client.hostport);
      Io.log(((log+self.verbose)<10)||('[BTPS] schedule_client: lookup_trans_for_host=' + util.inspect(trans)));
      if (trans != undefined) {
          Io.log(((log+self.verbose)<2)||('[BTPS] schedule_client: found trans=' + Rpc.Print.rpcio(trans)));

          if (trans.operation == Rpc.Operation.TRANSREQ) {
              data.push(trans.to_json('extended'));
              msgn++;
              if (discard) self.router.pkt_discard(trans);
          } else if (trans.operation == Rpc.Operation.TRANSREP) {
              // Transaction reply!
              data.push(trans.to_json('extended'));
              msgn++;
              if (discard) self.router.pkt_discard(trans);
          }
      }
  } while (trans != undefined);
  /*
  ** Add all pending server port LOOKUP requests...
  ** Forward a LOOKUP of a server port search only once to a client host!
  */
  for (var i in self.router.lookup_queue) {
      lookup = self.router.lookup_queue[i];
      // TODO: should we retransmit lookup requests here?
      cache = self.router.lookup_cache[i];
      if (cache[client.hostport]==undefined) {
          cache[client.hostport] = 1;
          buf = Buf.Buffer();
          Buf.buf_put_port(buf, lookup.header.h_port);
          data.push({
            rpc:'lookup',
            hostport:self.hostport,
            data:Buf.buf_to_hex(buf)
          });
          msgn++;
      }
  }
  if (msgn>0) {
      self.send(self.reply(client,{status:'EOK',data:data}));
      return false;
  } else if (client.timeout<=0) {
      self.send(self.reply(client,{status:'ENOENTR'}));
      return false;
  } else return true;
}

/*
**  Schedule all pending client-side requests if there is matching input.
**  Called from router function. Lock required!
*/

Server.prototype.schedule = function () {
  var self = this;
  
  if (self.lock) return;
  this.rpccon.stats.op_schedule++;
  Io.log(((log+self.verbose)<2) || ('[BTPS] server schedule ['+this.client_queue.length+'] .. '));
  Io.trace(trace || ('[BTPS] server schedule ['+this.client_queue.length+'] .. '));
  self.lock = true;
  self.client_queue = Array.filter(self.client_queue, function (client) {
      /*
       * Forward all matching pending transaction requests and replies...
       */
      Io.log(((log+self.verbose) < 2) || ('[BTPS] schedule for client host ' + Net.Print.port(client.hostport)+
              ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+Array.length(self.router.lookup_queue)));
      return self.schedule_client(client,true);
  });
  self.lock = false;
};

/** Send a message to a destination
 *
 */
// function send(repsonse:socket,data:string)
Server.prototype.send = function (msg) {
  var client, 
      self=this,
      socket,
      data;
  //response.writeHead(200, {'Content-Type': 'text/plain; charset=utf8'});
  //response.writeHead(200);
  this.rpccon.stats.op_send++;
  // if (this.mode==Mode.ONECHAN) 
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
    if (msg.sendport && self.hosts[msg.sendport] && self.hosts[msg.sendport].socket) {
      // use cached socket
      // console.log('using socket');
      client=self.hosts[msg.sendport].socket;
      if (self.multipart) client.write(data+Conn.EOM);
      else client.write(data);
      self.hosts[msg.sendport].timeout=5000;
    } else {
      client = net.connect(msg.ipport,msg.ip, function() {
        // console.log('connected to client');
        self.warned=0;
        client.setNoDelay(true);
        if (self.multipart) client.write(data+Conn.EOM);
        else client.write(data);
        if (!self.keepalive || msg.nokeepalive) client.end();
        else if (msg.sendport && self.hosts[msg.sendport]) {
          self.hosts[msg.sendport].socket=client;
          self.hosts[msg.sendport].timeout=5000;
        } else if (msg.sendport) 
          self.hosts[msg.sendport]={ip:msg.ip,ipport:msg.ipport,
                                    hostport:msg.sendport,socket:client,timeout:5000};
      });
      client.on('error', function (e) {
        if (self.warned<2) {
          console.log('[BTPS] Communication error to ' +msg.ip+':'+msg.ipport+(self.warned==1?' (more)':'')+' : '+e);
          self.warned++;
        }    
      });
    }
  };
};





/**
 *
 * @param {number} [interval]
 */
Server.prototype.start = function (interval) {
  var self = this;
  if (!interval) interval=1000;
  /*
  ** Start a client service and garbage collector for blocked client-side transactions (self.client_queue)
   */
  Sch.AddTimer(interval, 'Broker Client Service and Garbage Collector', function (context) {
      var p;
      Io.log(((log+self.verbose)<4)||('[BTPS] Client Service and Garbage Collector'));
      if (!self.lock) {
          self.lock = true;

          // if (self.mode==Mode.ONECHAN)
            self.client_queue = Array.filter(self.client_queue, function (client /* msg */) {
              client.timeout=client.timeout-interval;              
              return self.schedule_client(client,true);
            });
          // else {
            for (p in self.hosts) {
              // console.log(self.hosts[p])
              if (self.hosts[p]) {
                self.hosts[p].timeout = self.hosts[p].timeout - interval;
                if (self.hosts[p].timeout <= 0) {
                  Io.log(((log+self.verbose)<1)||('[BTPS] Host cache: Removing host '+
                          self.hosts[p].ip+':'+self.hosts[p].ipport+' hostport='+Net.Print.port(self.hosts[p].hostport)));
                  self.hosts[p]=undefined;
                }
              }
            }
          // } 
            
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
