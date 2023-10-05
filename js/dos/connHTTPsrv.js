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
 **    $CREATED:     28-3-15 by sbosse.
 **    $VERSION:     1.2.7
 **
 **    $INFO:
 **
 **  ==============================================
 **  DOS: Broker Connection Module 
 **  Server Side, Synchronous HTTP connection (blocking client side)
 **  Data transfer: XML + EABC (compacted ASCII)
 **  ==============================================
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
var http = Require('http');
var xmldoc = Require('dos/ext/xmldoc');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var String = Comp.string;
var Array = Comp.array;
var Filename = Comp.filename;
var div = Perv.div;
var Conn = Require('dos/connutils');

var isNode = Comp.isNodeJS();


/**************************
 ** HTTP Broker Communciation SERVER
 **************************/
/**
 *
 * @param {port} hostport
 * @param {string} srv_url
 * @param {string} srv_ipport
 * @param {rpcrouter} router
 * @constructor
 */
// typeof options : {hostport,srv_url,srv_ipport,router,verbose,env}
var Server = function(options) {
  var self=this;
  this.env=options.env||{};
  this.srv_url=options.srv_url;               // URL
  this.srv_ipport=options.srv_ipport;         // URL:port
  this.hostport=options.hostport;             // Public communication Net.Port == Host port
  this.status = Net.Status.STD_OK;
  this.router=options.router;
  this.app=undefined;
  this.https=undefined;
  // Pending collect requests of clients
  this.client_queue=[];
  // Message queue for client collect requests
  this.rpcio_queue=[];
  
  this.lock=false;
  this.timeout=100;   // Queue timeout
  this.conn_port=Net.uniqport();
  this.rpccon=Rpc.RpcConn(
      self.conn_port,
      /*
      ** send: Connection Forward and Deliver Operation
       */
      function (rpcio,callback) {
        // We must store and handle these messages for client collection requests!!
        // console.log(rpcio)
        rpcio.timeout=Sch.GetTime()+self.timeout;
        self.rpcio_queue.push(rpcio);
        // Trigger schedule
        if (callback && rpcio.callback==undefined) rpcio.callback=callback;
        else if (rpcio.callback!=undefined) Io.out('[BHPS] Warning: RPCIO has a callback: '+util.inspect(rpcio));
        self.schedule();
        // console.log(rpcio.callback)
      },
      // alive: We're handling multiple client connections - we're alive
      function() {
          return true;
      }
  );
  this.rpccon.multiport=true;
  this.verbose=options.verbose||0;
  this.mode=Conn.Mode.ONECHAN; // Always bidirectional one channel mode initiated by client only
  this.stats=this.rpccon.stats;
};

/** Client-App collect request (send pending and queued TRANSREQ/TRANSREP/LOOKUP messages)
 *
 */
Server.prototype.collect = function (params, response) {   // HTTP Callback handler
  var hostport, res, client,
      self=this,
      timeout = (params.timeout != undefined) ? (Perv.int_of_string(params.timeout)) : 0;
  self.stats.op_forward++;
  hostport = Net.port_of_param(params.hostport);
  /*
   ** 1. Collect TRANS message requests if there are pending requests for the host port.
   ** 2. Collect TRANS message reqeplies if there are pending replies for the host port.
   ** 3. Collect LOOKUP messages (broadcast)
   ** 4. Collect IAMHERE messages
   *
   ** If there are actually no messages, add this request to the request queue (if timeout <>0).
   */
  /*
  ** Forward all pending transaction and auxiliary requests and replies...
   */
  Io.log((self.router.monitor < 2) || ('[BHPS] collect for client host ' + Net.Print.port(hostport)+
      ' #rpcio='+ Array.length(this.rpcio_queue)));
  
  client = {timeout: timeout, hostport: hostport, response: response};
  res = self.schedule_client(client,true);
  if (res && timeout) {
    // Hold connection until timeout occurs or messages are available
    self.client_queue.push(client);
  }
};

/** Create a reply message from a rpcio object 
 *
 */
Server.prototype.format = function (rpcio) {
  var msg,data,buf;
  switch (rpcio.operation) {
    case Rpc.Operation.TRANSREQ:
      data = rpcio.to_json('simple');
      msg={rpc:'trans',hostport:rpcio.hostport,sendport:rpcio.sendport,
           hop:rpcio.hop,tid:rpcio.tid,data:data};
      break;
    case Rpc.Operation.TRANSREP:
      data = rpcio.to_json('simple');
      msg={rpc:'reply',hostport:rpcio.hostport,sendport:rpcio.sendport,
           hop:rpcio.hop,tid:rpcio.tid,data:data};
      break;
    case Rpc.Operation.LOOKUP:
      msg={rpc:'lookup',hostport:rpcio.hostport,srvport:rpcio.header.h_port,
           hop:rpcio.hop};
      break;
    case Rpc.Operation.IAMHERE:
      msg={rpc:'iamhere',hostport:rpcio.hostport,sendport:rpcio.sendport,
           srvport:rpcio.header.h_port,hop:rpcio.hop};
      break;
  }  
  return msg;
}

/** Service HTTP GET reqest (short messages w/o data)
 *
 */
Server.prototype.get = function (request, response) {
  var i,str,
      self=this,
      hostport, srvport, sendport, buf, hdr, rpcio,
      params = Conn.parseQueryString(request.url);
  self.stats.op_get++;
  Io.log(((log+self.verbose) < 2) || ('[BHPS] GET: ' + request.url));
  Io.log(((log+self.verbose) < 10) || ('[BHPS] GET: ' + util.inspect(params)));
  response.origin=request.headers.origin;

  
  if (params.rpc != undefined &&
      params.rpc == 'request' &&
      params.hostport != undefined)
  {
      /**************************************************
       ** RPC forward request (HTTP Client- /Browser App. collector request)
       *************************************************/
      self.collect(params,response);
  } else if (params.rpc != undefined &&
      params.rpc == 'iamhere' &&
      params.hostport != undefined &&
      params.srvport != undefined &&
      params.sendport != undefined)
  {
      /********************************
       ** IAMHERE rpc message
       ********************************/
      hostport = Net.port_of_param(params.hostport);
      srvport = Net.port_of_param(params.srvport);
      sendport = Net.port_of_param(params.sendport);
      {
          if (self.verbose && this.router.lookup_host(hostport)==undefined) 
            Io.out('[BHPS] IAMHERE! Adding remote host ' + 
               Net.Print.port(hostport) + ' ip=' + request.connection.remoteAddress + 
              ((params.port && params.port!='undefined')?(' ipport=' + params.port):''));
          this.router.add_host(hostport, this.rpccon.port);
          rpcio=this.router.pkt_get();
          rpcio.operation=Rpc.Operation.IAMHERE;
          rpcio.connport=self.rpccon.port;
          rpcio.hostport=hostport;
          rpcio.sendport=sendport;
          rpcio.header.h_port=srvport;
          this.router.route(rpcio);
      }
      /*
      {
          self.router.add_port(srvport, hostport);
          self.router.add_host(hostport, self.rpccon.port);
          Io.log((log < 1) || ('[BHPS] server get IAMHERE: adding server port ' +
              Net.Print.port(srvport) + ' located on host ' + Net.Print.port(hostport)));
          self.router.remove_lookup(srvport);
          // TBD: search for stalled transactions that must be send to another server capable host!
          // Broker connected client apps. will collect the appropriate transaction on the next request round.
          //res.
      }
      */
      this.send(response, 'EOK');
  } else if (params.rpc != undefined &&
      params.rpc == 'lookup' &&
      params.hostport != undefined &&
      params.srvport != undefined)
  {
      /********************************
       ** LOOKUP rpc message
       ********************************/
      hostport = Net.port_of_param(params.hostport);
      srvport = Net.port_of_param(params.srvport);
      {
          if (self.verbose && this.router.lookup_host(hostport)==undefined) 
            Io.out('[BHPS] LOOKUP! Searching server port ' + Net.Print.port(srvport));
          rpcio=self.router.pkt_get();
          rpcio.operation=Rpc.Operation.LOOKUP;
          rpcio.connport=this.rpccon.port;
          rpcio.hostport=hostport;
          //rpcio.sendport=self.router.hostport;
          rpcio.header.h_port=srvport;
          this.router.route(rpcio);
      }
      /*
      {
          self.router.add_port(srvport, hostport);
          self.router.add_host(hostport, self.rpccon.port);
          Io.log((log < 1) || ('[BHPS] server get IAMHERE: adding server port ' +
              Net.Print.port(srvport) + ' located on host ' + Net.Print.port(hostport)));
          self.router.remove_lookup(srvport);
          // TBD: search for stalled transactions that must be send to another server capable host!
          // Broker connected client apps. will collect the appropriate transaction on the next request round.
          //res.
      }
      */
      this.send(response, 'EOK');
  } else if (params.alive != undefined &&
             params.hostport != undefined)
  {
      /***************************
       ** ALIVE message request
       ***************************/
      this.stats.op_alive++;

      buf=Buf.Buffer();
      hostport = Net.port_of_param(params.hostport);

      if (self.verbose && self.router.lookup_host(hostport)==undefined) 
        Io.out('[BHPS] ALIVE! Adding remote host ' + 
               Net.Print.port(hostport) + ' ip=' + params.ip + (params.ipport!='undefined'?(' ipport=' + params.ipport):''));

      this.router.add_host(hostport,this.rpccon.port);
      //res.
      Buf.buf_put_port(buf,this.hostport);
      this.send(response, Buf.buf_to_hex(buf));
  } else if (params.ask != undefined &&
             params.xname != undefined)
  {
      /***************************
       ** ASK message request
       ***************************/
      this.stats.op_ask++;
      buf=Buf.Buffer();
      //console.log(self.env[params.xname]);
      if (params.xname=='geo') {
        if (options.geoip) {
          var ip = '127.0.0.1'; // TODO src IP
          var loc = options.geoip.lookup(ip);
          if (loc)
            Buf.buf_put_string(buf,JSON.stringify(loc));
          else
            Buf.buf_put_string(buf,'undefined');
        } else Buf.buf_put_string(buf,'undefined');
      }
      else Buf.buf_put_string(buf,this.env[params.xname]||'undefined');
      this.send(response, Buf.buf_to_hex(buf));
  } else if (params.notify != undefined &&
             params.xname != undefined &&
             params.xvalue !=undefined)
  {
      /***************************
       ** NOTIFY message request
       ***************************/
      this.rpccon.stats.op_notify++;
      this.env[params.xname]=params.xvalue;
      // console.log(self.env[params.xname]);
      this.send(response, 'EOK');
  }    // res.
  else
      this.send(response, 'EINVALID');
};


/** Initialize this connection server
 *
 */
Server.prototype.init = function () {
  var self = this;
  this.https = http.createServer(function(request, response) {
      //console.log(response);
      String.match(request.method,[
          ['GET',function() {
              self.get(request,response);
          }],
          ['POST',function() {
              self.put(request,response);
          }]
      ])
  });
  this.https.on("connection", function (socket) {
      socket.setNoDelay(true);
  });
  this.https.on("error", function (er) {
    Io.out('[BHPS] listen: listening on * ' + self.srv_ipport+' failed: '+er);
  });
  this.router.add_conn(self.rpccon);
};

Server.prototype.log = function (v) {log=v};

/** Service HHTP PUT/POST request (long messages with data)
 *
 */
Server.prototype.put = function (request, response) {
  var params = Conn.parseQueryString(request.url),
      self=this;
  self.stats.op_put++;
  
  Io.log(((log+self.verbose) < 2) || ('[BHPS] PUT: ' + request.url));
  Io.log(((log+self.verbose) < 10) || ('[BHPS] PUT: ' + util.inspect(params)));
  Io.log((log<10)||('[BHPS] PUT: STATUS=' + request.statusCode));
  Io.log((log<10)||('[BHPS] PUT: HEADERS=' + JSON.stringify(request.headers)));

  response.origin=request.headers.origin;

  if (params.rpc != undefined &&
      params.rpc == 'trans' &&
      params.hostport != undefined &&
      params.sendport != undefined &&
      params.tid != undefined) {
      self.trans(params,request,response);
   } else if (params.rpc != undefined &&
      params.rpc == 'reply' &&
      params.hostport != undefined &&
      params.sendport != undefined &&
      params.tid != undefined) {
      self.reply(params,request,response);
  } else
      //res.
      self.send(response,'EINVALID');
};


/** Process a reply
 *
 */
Server.prototype.reply = function (params, request, response) {    // HTTP Callback handler
  /*************************
   * Transaction Reply
   ************************/
  var body,
      self=this;
  /*
   ** Reply for a transaction must be forwarded to the transaction origin collected by the source host application and
   ** the next http get/?rpc=request request.
   */
  request.setEncoding('utf8');
  body='';

  request.on('data', function (chunk) {
      body=body+chunk;
  });

  request.on('end', function () {
      Io.log(((log+self.verbose) < 10)||('[BHPS] BODY: ' + body));
      // New transaction request from client app., add it to the transaction queue.
      var xml = new xmldoc.XmlDocument(body),
          header = xml.childNamed('header'),
          data = xml.childNamed('data'),
          hostport = Net.port_of_param(params.hostport),
          sendport = Net.port_of_param(params.sendport),
          buf = Buf.Buffer(Conn.getData(header)),
          rpcio = self.router.pkt_get(),
          tid;
      Buf.buf_get_hdr(buf,rpcio.header);
      rpcio.init(Rpc.Operation.TRANSREP, rpcio.header, Conn.getData(data));
      rpcio.context=undefined;    // rpc not from here!
      tid = Perv.int_of_string(params.tid);
      rpcio.tid = tid;
      rpcio.hostport = hostport;
      rpcio.sendport = sendport;
      rpcio.connport = self.rpccon.port;

      Io.log(((log+self.verbose) < 2)||('[BHPS] PUT: got reply, hostport=' +
              Net.Print.port(hostport) + ' tid=' + tid + ' srvport=' + Net.Print.port(rpcio.header.h_port)));
      self.router.route(rpcio);
      //res.
      self.send(response,'EOK');
  });
};

/*
**  Schedule all pending client-side requests if there is matching input.
**  Called from router function. Lock required!
*/

Server.prototype.schedule = function () {
  var self = this,
      i;
  if (self.lock) return;
  this.rpccon.stats.op_schedule++;
  Io.log(((log+self.verbose)<2) || ('[BHPS] schedule #clients='+this.client_queue.length+' .. '));

  this.lock = true;
  this.client_queue = Array.filter(this.client_queue, function (client) {
      /*
       * Forward all matching pending transaction requests and replies...
       */
      Io.log(((log+self.verbose) < 2) || ('[BHPS] schedule for client host ' + Net.Print.port(client.hostport)+
          ' #rpcio='+ Array.length(self.rpcio_queue)));
      return self.schedule_client(client,true);
  });
  this.lock = false;
};

/** Schedule pending transaction replies for a client 
 *
 */
Server.prototype.schedule_client = function (client, discard) {
  var self = this,
      msgn = 0, i,
      buf, hdr, trans, cache, lookup, body ='',
      hostport = client.hostport,
      len=this.rpcio_queue.length;
  this.rpcio_queue = Array.filter(this.rpcio_queue, function (rpcio) {
    var hostport2;
    switch (rpcio.operation) {
      case Rpc.Operation.TRANSREQ:
      case Rpc.Operation.TRANSREP:
        hostport2 = self.router.lookup_port(rpcio.header.h_port);
        if ((hostport2 && rpcio.operation==Rpc.Operation.TRANSREQ && Net.port_cmp(hostport,hostport2)) ||
            (rpcio.sendport && rpcio.operation==Rpc.Operation.TRANSREP && Net.port_cmp(hostport,rpcio.sendport)) ||
            (rpcio.sendport && rpcio.operation==Rpc.Operation.TRANSREQ && Net.port_cmp(hostport,rpcio.sendport))) {
          body = body + rpcio.to_xml('rpc');
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
          Io.log((self.router.monitor < 2) || ('[BHPS] schedule: lookup '+Rpc.Print.rpcio(rpcio)));
          rpcio.cache[hostport]=1;
          buf = Buf.Buffer();
          Buf.buf_put_port(buf, rpcio.header.h_port);
          body = body + '<rpc operation="LOOKUP" hostport="' + Net.port_to_str(rpcio.hostport) + '">' +
          Buf.buf_to_hex(buf) + '</rpc>';
          // Broadcast message! rpcio.callback handled in garbage collector
          msgn++;
         }
        return true;
        break;
        
      case Rpc.Operation.IAMHERE:
        if (Net.port_cmp(hostport,rpcio.sendport)) {
          buf = Buf.Buffer();
          Buf.buf_put_port(buf, rpcio.header.h_port);
          body = body + '<rpc operation="IAMHERE" hostport="'+ Net.port_to_str(rpcio.hostport)+'" sendport="' + Net.port_to_str(rpcio.sendport) + '">' +
          Buf.buf_to_hex(buf) + '</rpc>';
          msgn++;
          if (rpcio.callback) {rpcio.callback(Net.Status.STD_OK,rpcio); rpcio.callback=undefined;}
          return false;
        } else return true;
        break;
    }
    return true;
  });
  Io.log(((log+self.verbose) < 2) || ('[BHPS] schedule_client for host ' + Net.Print.port(hostport)+ ' ['+len+'] '+body));

   // console.log(body)
   if (msgn > 0) {
       this.stats.op_messages=this.stats.op_messages+msgn;
       body = '<xml>' + body + '</xml>';
       this.send(client.response, body);
       return false;
   } else if (client.timeout <= 0) {
       body = 'ENOENTR';
       this.send(client.response, body);
       return false;
   } else return true;
}

Server.prototype.send = function (response, data) {
  //console.log(response.connection);

  if (response.connection==null) {
    if (this.verbose>0) Io.out('[BHPS] Cannot send reply ['+(data.length<100?data:data.length)+']. Connection closed.');
    return; // TODO ??
  }
  //response.writeHead(200, {'Content-Type': 'text/plain; charset=utf8'});
  //response.writeHead(200);
  this.rpccon.stats.op_send++;
  Io.log(((log+this.verbose)<3)||('[BHPS] send ['+(data.length<100?data:data.length)+'] to '+
          (response.origin!=undefined?response.origin:'?')));
  if (response.origin!=undefined)
      response.writeHead(200,{'Access-Control-Allow-Origin': response.origin,
                              'Access-Control-Allow-Credentials': 'true',
                              'Content-Type': 'text/plain'});
  else
      response.writeHead(200,{'Content-Type': 'text/plain'});
  response.write(data);
  response.end();
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
  Sch.AddTimer(interval, 'BHPS Garbage Collector', function (context) {
      var time;
      Io.log(((log+self.verbose)<3)||('[BHPS] Garbage Collector ['+self.client_queue.length+']'));
      if (!self.lock) {
          self.lock = true;
          self.client_queue = Array.filter(self.client_queue, function (client) {
            var res = self.schedule_client(client,false /*?*/);
            client.timeout -= interval;
            return res;
          });
          time=Sch.GetTime();
          self.rpcio_queue = Array.filter(self.rpcio_queue, function (rpcio) {
            if (rpcio.timeout > 0 && rpcio.timeout <= time) {
             if (rpcio.callback) {rpcio.callback(
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

  this.https.listen(this.srv_ipport, function () {
        Io.out('[BHPS] Listening on *:' + self.srv_ipport+' HTTP');
    });
};

Server.prototype.stop = function () {
  Sch.RemoveTimer('BHPS Garbage Collector');
};

/** Process a transaction request
 *
 */
Server.prototype.trans = function (params, request, response) {    // HTTP Callback handler
  var body,
      self=this;
  /***************************
   ** Incoming TRANS message
   **************************/
  request.setEncoding('utf8');
  body = '';
  request.on('data', function (chunk) {
      body = body + chunk;
  });
  request.on('end', function () {
      Io.log(((log+self.verbose) < 10) || ('BODY: ' + body));
      // New transaction request from client app., add it to the transaction queue.
      var xml = new xmldoc.XmlDocument(body),
          header = xml.childNamed('header'),
          data = xml.childNamed('data'),
          rpcio = self.router.pkt_get(),
          hostport = Net.port_of_param(params.hostport),
          sendport = Net.port_of_param(params.sendport),
          buf = Buf.Buffer(Conn.getData(header));
      Buf.buf_get_hdr(buf, rpcio.header);
      Io.log((log < 2) || (('[BHPS] post: ' + Net.Print.header(rpcio.header))));
      rpcio.init(Rpc.Operation.TRANSREQ, rpcio.header, Conn.getData(data));
      rpcio.context=undefined;  // rpc not from here!
      rpcio.tid = Perv.int_of_string(params.tid);
      rpcio.hostport = hostport;
      rpcio.sendport = sendport;
      // if (local request) service ..
      self.router.add_host(rpcio.hostport,self.rpccon.port);
      self.router.route(rpcio);
      // TBD: Check for local waiting servers in routing_db...
      //res.
      self.send(response, 'EWOULDBLOCK');
  });
};





module.exports = {
  /** RCP Broker Server for client-capable-only applications
   *
   */
  // type options = {hostport:port,srv_ip,srv_ipport,router,verbose?,env?:{}}
  Server: function(options) {
      var obj = new Server(options);
      Object.preventExtensions(obj);
      return obj;
  }
};
