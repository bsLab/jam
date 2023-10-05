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
 **    $CREATED:     28-3-15 by sbosse.
 **    $VERSION:     1.1.16
 **
 **    $INFO:
 **
 **  ==============================================
 **  DOS: Broker Connection Module 
 **  Server Side, Synchronous HTTP connection (blocking client side)
 **  Data transfer: XML + EABC (compacted ASCII)
 **  ==============================================
 *
 * Notes:
 * Superfluous? All http function callback computations are wrapped by scheduler callbacks 
 * to avoid main thread preemption!
 * Is event queuing always guaranteed in JS?
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
var http = require('http');
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


/**************************
 ** HTTP Broker SERVER
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
  this.env=options.env||{};
  this.srv_url=options.srv_url;               // URL
  this.srv_ipport=options.srv_ipport;         // URL:port
  this.hostport=options.hostport;               // Public communication Net.Port == Host port
  this.status = Net.Status.STD_OK;
  this.router=options.router;
  this.app=undefined;
  this.https=undefined;
  this.client_queue=[];
  this.lock=false;
  this.rpccon=Rpc.RpcConn(
      Net.uniqport(),
      /*
      ** Connection Forward and Deliver Operation
       */
      undefined,
      // Passive client connections: Notheing to do here, already handled by the router
      function(rpcio) {
          return true;
      }
  )
  this.verbose=options.verbose||0;
  this.mode=Conn.Mode.ONECHAN; // Always two-way one channel mode
};

/** Client-App request (send pending and queued TRANSREQ/TRANSREP/LOOKUP messages)
 *
 */
Server.prototype.collect = function (self, params, response) {   // HTTP Callback handler
  var hostport, res, client,
      timeout = (params.timeout != undefined) ? (Perv.int_of_string(params.timeout)) : 0;
  self.rpccon.stats.op_forward++;
  hostport = Net.port_of_param(params.hostport);
  /*
   ** 1. Collect TRANS message requests if there are pending requests for the host port.
   ** 2. Collect TRANS message reqeplies if there are pending replies for the host port.
   ** 3. Collect LOOKUP messages (broadcast)
   *
   ** If there are actually no messages, add this request to the request queue (if timeout <>0).
   */
  /*
  ** Forward all pending transaction requests and replies...
   */
  Io.log((self.router.monitor < 2) || ('[BHPS] collect for host ' + Net.Print.port(hostport)+
      ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+Array.length(self.router.lookup_queue)));
  
  client = {timeout: timeout, hostport: hostport, response: response};
  res = self.schedule_client(client,true);
  if (res && timeout) {
    self.client_queue.push(client);
  }
};

/** Service HTTP GET
 *
 */
Server.prototype.get = function (self, request, response) {
  var i,str,
      hostport, srvport, buf, hdr,
      params = Conn.parseQueryString(request.url);
  self.rpccon.stats.op_get++;
  Io.log(((log+self.verbose) < 2) || ('[BHPS] server get request: ' + request.url));
  Io.log(((log+self.verbose) < 10) || ('[BHPS] server get request: ' + util.inspect(params)));
  Io.trace(trace || ('[BHPS] server get request: ' + request.url));
  response.origin=request.headers.origin;

  
  if (params.rpc != undefined &&
      params.rpc == 'request' &&
      params.hostport != undefined)
  {
      /**************************************************
       ** RPC forward request (HTTP Client- /Browser App. collector request)
       *************************************************/
      Sch.ScheduleCallback([Sch.Bind(self,self.collect),self, params,response]);

  } else if (params.rpc != undefined &&
      params.rpc == 'iamhere' &&
      params.hostport != undefined &&
      params.srvport != undefined)
  {
      /********************************
       ** short IAMHERE rpc message
       ********************************/
      hostport = Net.port_of_param(params.hostport);
      srvport = Net.port_of_param(params.srvport);
      {
          if (self.verbose && self.router.lookup_host(hostport)==undefined) 
            Io.out('[BHPS] IAMHERE! Adding remote host ' + 
               Net.Print.port(hostport) + ' ip=' + request.connection.remoteAddress + 
              ((params.port && params.port!='undefined')?(' ipport=' + params.port):''));
          self.router.add_host(hostport, self.rpccon.port);
          var rpcio=self.router.pkt_get();
          rpcio.operation=Rpc.Operation.IAMHERE;
          rpcio.connport=self.rpccon.port;
          rpcio.hostport=hostport;
          rpcio.sendport=self.router.hostport;
          rpcio.header.h_port=srvport;
          self.router.route(rpcio);

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
      self.send(response, 'EOK');
  } else if (params.alive != undefined &&
             params.hostport != undefined)
  {
      /***************************
       ** ALIVE message request
       ***************************/
      self.rpccon.stats.op_alive++;

      buf=Buf.Buffer();
      hostport = Net.port_of_param(params.hostport);

      if (self.verbose && self.router.lookup_host(hostport)==undefined) 
        Io.out('[BHPS] ALIVE! Adding remote host ' + 
               Net.Print.port(hostport) + ' ip=' + params.ip + (params.ipport!='undefined'?(' ipport=' + params.ipport):''));

      // TODO this.router.add_host(hostport, [params.url, params.port]);
      self.router.add_host(hostport,self.rpccon.port);
      //res.
      Buf.buf_put_port(buf,self.hostport);
      self.send(response, Buf.buf_to_hex(buf));
  } else if (params.ask != undefined &&
             params.xname != undefined)
  {
      /***************************
       ** ASK message request
       ***************************/
      self.rpccon.stats.op_ask++;
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
      else Buf.buf_put_string(buf,self.env[params.xname]||'undefined');
      self.send(response, Buf.buf_to_hex(buf));
  } else if (params.notify != undefined &&
             params.xname != undefined &&
             params.xvalue !=undefined)
  {
      /***************************
       ** NOTIFY message request
       ***************************/
      self.rpccon.stats.op_notify++;
      self.env[params.xname]=params.xvalue;
      // console.log(self.env[params.xname]);
      self.send(response, 'EOK');
  }    // res.
  else
      self.send(response, 'EINVALID');
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
              self.get(self,request,response);
          }],
          ['POST',function() {
              self.put(self,request,response);
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

/** Service HHTP PT/POST
 *
 */
Server.prototype.put = function (self, request, response) {
  var params = Conn.parseQueryString(request.url);
  self.rpccon.stats.op_put++;

  Io.log(((log+self.verbose) < 2) || ('[BHPS] server put request: ' + request.url));
  Io.log(((log+self.verbose) < 10) || ('[BHPS] server put request: ' + util.inspect(params)));
  Io.log((log<10)||('[BHPS] server put: STATUS=' + request.statusCode));
  Io.log((log<10)||('[BHPS] server put: HEADERS=' + JSON.stringify(request.headers)));
  Io.trace(trace||('[BHPS] server put request: ' + request.url));

  response.origin=request.headers.origin;

  if (params.rpc != undefined &&
      params.rpc == 'trans' &&
      params.hostport != undefined &&
      params.tid != undefined) {
      Sch.ScheduleCallback([Sch.Bind(self,self.trans),self,params,request,response]);
   } else if (params.rpc != undefined &&
      params.rpc == 'reply' &&
      params.hostport != undefined &&
      params.tid != undefined) {
      Sch.ScheduleCallback([Sch.Bind(self,self.reply),self,params,request,response]);
  } else
      //res.
      self.send(response,'EINVALID');
};


/** Process a reply
 *
 */
Server.prototype.reply = function (self, params, request, response) {    // HTTP Callback handler
  /*************************
   * Transaction Reply
   ************************/
  var body;
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
      Io.log(((log+self.verbose) < 10)||('BODY: ' + body));
      // New transaction request from client app., add it to the transaction queue.
      var xml = new xmldoc.XmlDocument(body);
      var header = xml.childNamed('header');
      var data = xml.childNamed('data');
      var hostport = Net.port_of_param(params.hostport);
      var sendport = Net.port_of_param(params.sendport);
      var buf = Buf.Buffer(Conn.getData(header));
      var rpcio = self.router.pkt_get();
      Buf.buf_get_hdr(buf,rpcio.header);
      rpcio.init(Rpc.Operation.TRANSREP, rpcio.header, Conn.getData(data));
      rpcio.context=undefined;    // rpc not from here!
      var tid = Perv.int_of_string(params.tid);
      rpcio.tid = tid;
      rpcio.hostport = hostport;
      rpcio.sendport = sendport;

      Io.log(((log+self.verbose) < 2)||('[BHPS] post: got reply, hostport=' +
              Net.Print.port(hostport) + ' tid=' + tid + ' srvport=' + Net.Print.port(rpcio.header.h_port)));
      self.router.route(rpcio);
      //res.
      self.send(response,'EOK');
  });
};


/** Schedule pending transaction replies for a client 
 *
 */
Server.prototype.schedule_client = function (client, discard) {
  var self = this,
      msgn = 0, i,
      buf, hdr, trans, cache, lookup, body ='',
      hostport = client.hostport;
   Io.log(((log+self.verbose) < 3) || ('[BHPS] schedule_client for host ' + Net.Print.port(hostport)));
   do {
       trans = self.router.lookup_trans_for_host(hostport);
       Io.log(((log+self.verbose) < 10) || ('[BHPS] schedule: lookup_trans_for_host=' + util.inspect(trans)));
       if (trans != undefined) {
           hdr = trans.header;

           Io.log(((log+self.verbose) < 2) || ('[BHPS] schedule: found trans=' + Rpc.Print.rpcio(trans)));
           Io.trace(trace || ('[BHPS] schedule: found trans=' + Rpc.Print.rpcio(trans)));

           if (trans.operation == Rpc.Operation.TRANSREQ) {
               // Forward transtion request
               body = body + trans.to_xml('rpc');
               msgn++;
               self.router.pkt_discard(trans);
           } else if (trans.operation == Rpc.Operation.TRANSREP) {
               // Transaction reply!
               body = body + trans.to_xml('rpc');
               msgn++;
               self.router.pkt_discard(trans);
           }
       }
   } while (trans != undefined);
   // console.log(body)
   /*
   ** Add all pending server port LOOKUP requests...
   ** Forward a LOOKUP of a server port search only once to a client host!
   */
   for (i in self.router.lookup_queue) {
       lookup = self.router.lookup_queue[i];
       cache = self.router.lookup_cache[i];
       Io.log((self.router.monitor < 2) || ('[BHPS] schedule: lookup '+Rpc.Print.rpcio(lookup)));
       if (cache[hostport]==undefined) {
           cache[hostport]=1;
           buf = Buf.Buffer();
           Buf.buf_put_port(buf, lookup.header.h_port);
           body = body + '<rpc operation="LOOKUP" hostport="' + Net.port_to_str(self.hostport) + '">' +
           Buf.buf_to_hex(buf) + '</rpc>';
           msgn++;
       }
   }
   if (msgn > 0) {
       self.rpccon.stats.op_messages=self.rpccon.stats.op_messages+msgn;
       body = '<xml>' + body + '</xml>';
       self.send(client.response, body);
       return false;
   } else if (client.timeout <= 0) {
       body = 'ENOENTR';
       self.send(client.response, body);
       return false;
   } else return true;
}
/*
**  Schedule all pending client-side requests if there is matching input.
**  Called from router function. Lock required!
*/

Server.prototype.schedule = function () {
  var self = this,
      i;
  if (self.lock) return;
  this.rpccon.stats.op_schedule++;
  Io.log(((log+self.verbose)<2) || ('[BHPS] server schedule ['+this.client_queue.length+'] .. '));
  Io.trace(trace || ('[BHPS] server schedule ['+this.client_queue.length+'] .. '));

  self.lock = true;
  self.client_queue = Array.filter(self.client_queue, function (client) {
      /*
       * Forward all matching pending transaction requests and replies...
       */
      Io.log((self.router.monitor < 2) || ('[BHPS] schedule for client host ' + Net.Print.port(client.hostport)+
          ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+Array.length(self.router.lookup_queue)));
      return self.schedule_client(client,true);
  });
  self.lock = false;
};

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
  Sch.AddTimer(interval, 'Broker Client Service and Garbage Collector', function (context) {
      Io.log(((log+self.verbose)<3)||('[BHPS] Client Service and Garbage Collector ['+self.client_queue.length+']'));
      if (!self.lock) {
          self.lock = true;
          self.client_queue = Array.filter(self.client_queue, function (client) {
              var res = self.schedule_client(client,false /*?*/);
              client.timeout -= interval;
              return res;
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


/** Process a transaction request
 *
 */
Server.prototype.trans = function (self, params, request, response) {    // HTTP Callback handler
  var body;
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
      var xml = new xmldoc.XmlDocument(body);
      var header = xml.childNamed('header');
      var data = xml.childNamed('data');
      var rpcio = self.router.pkt_get();
      var hostport = Net.port_of_param(params.hostport);
      var buf = Buf.Buffer(Conn.getData(header));
      Buf.buf_get_hdr(buf, rpcio.header);
      Io.log((log < 2) || (('[BHPS] post: ' + Net.Print.header(rpcio.header))));
      rpcio.init(Rpc.Operation.TRANSREQ, rpcio.header, Conn.getData(data));
      rpcio.context=undefined;  // rpc not from here!
      rpcio.tid = Perv.int_of_string(params.tid);
      rpcio.hostport = hostport;
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
