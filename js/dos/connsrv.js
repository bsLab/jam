/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     3/28/15 by sbosse.
 **    $VERSION:     1.1.6
 **
 **    $INFO:
 **
 **  DOS: Broker Server Connection Module (HTTP connection).
 **
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
var Conn = Require('dos/connection');

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
var Server = function(hostport,srv_url,srv_ipport,router,verbose,env) {
  this.env=env||{};
  this.srv_url=srv_url;               // URL
  this.srv_ipport=srv_ipport;         // URL:port
  this.hostport=hostport;               // Public communication Net.Port == Host port
  this.status = Net.Status.STD_OK;
  this.router=router;
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
      // Passive client conenctions: Notheing to do here, already handled by the router
      function(rpcio) {
          return true;
      }
  )
  this.verbose=verbose||0;
  this.env={};
};

/*
**  Schedule all pending client-side requests if there is matching input.
**  Called from router function. Lock required!
*/

Server.prototype.schedule = function () {
  var self = this;
  var i;
  if (self.lock) return;
  this.rpccon.stats.op_schedule++;
  Io.trace(trace || ('[BTTP] server schedule: '));
  self.lock = true;
  self.client_queue = Array.filter(self.client_queue, function (client) {
      var msgn = 0;
      var body = '';
      var trans, hdr, buf;
      /*
       * Forward all matching pending transaction requests and replies...
       */
      Io.log((self.router.monitor < 2) || ('[BTTP] schedule for client host ' + Net.Print.port(client.hostport)+
          ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+Array.length(self.router.lookup_queue)));
      do {
          trans = self.router.lookup_trans_for_host(client.hostport);
          Io.log(((log+self.verbose) < 10) || ('[BTTP] schedule: lookup_trans_for_host=' + util.inspect(trans)));
          if (trans != undefined) {
              hdr = trans.header;

              Io.log(((log+self.verbose) < 2) || ('[BTTP] schedule: found trans=' + Rpc.Print.rpcio(trans)));
              Io.trace(trace || ('[BTTP] schedule: found trans=' + Rpc.Print.rpcio(trans)));

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
      /*
      ** Add all pending server port LOOKUP requests...
      ** Forward a LOOKUP of a server port search only once to a client host!
      */
      for (i in self.router.lookup_queue) {
          var lookup = self.router.lookup_queue[i];
          var cache = self.router.lookup_cache[i];
          Io.log((self.router.monitor < 2) || ('[BTTP] schedule: lookup '+Rpc.Print.rpcio(lookup)));
          if (cache[client.hostport]==undefined) {
              cache[client.hostport]=1;
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
          self.send(client.respond, body);
          return false;
      } else if (client.timeout <= 0) {
          body = 'ENOENTR';
          self.send(client.respond, body);
          return false;
      } else return true;
  });
  self.lock = false;
};

Server.prototype.send = function (response, data) {
  //response.writeHead(200, {'Content-Type': 'text/plain; charset=utf8'});
  //response.writeHead(200);
  this.rpccon.stats.op_send++;
  Io.log(((log+this.verbose)<10)||('[BHTP] send ['+data.length+']'));
  if (response.origin!=undefined)
      response.writeHead(200,{'Access-Control-Allow-Origin': response.origin,
                              'Access-Control-Allow-Credentials': 'true',
                              'Content-Type': 'text/plain'});
  else
      response.writeHead(200,{'Content-Type': 'text/plain'});
  response.write(data);
  response.end();
};

Server.prototype.forward = function (self, params, res) {   // HTTP Callback handler
  var hostport, hdr, buf,i;
  this.rpccon.stats.op_forward++;
  hostport = Net.port_of_param(params.hostport);
  /*
   ** 1. Forward TRANS message requests if there are pending requests for the host port.
   ** 2. Forward LOOKUP messages (broadcast)
   ** If there are actually no messages, add this request to the request queue (if timeout <>0).
   */
  var msgn = 0;
  var body = '';
  var timeout = (params.timeout != undefined) ? (Perv.int_of_string(params.timeout)) : 0;
  /*
  ** Forward all pending transaction requests and replies...
   */
  Io.log((self.router.monitor < 2) || ('[BTTP] forward for host ' + Net.Print.port(hostport)+
      ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+Array.length(self.router.lookup_queue)));
  do {
      var trans = self.router.lookup_trans_for_host(hostport);
      Io.log(((log+this.verbose) < 10) || ('[BTTP] server get: lookup_trans_for_host=' + util.inspect(trans)));
      if (trans != undefined) {
          hdr = trans.header;

          Io.log(((log+self.verbose) < 2) || ('[BTTP] server get: found trans=' + Rpc.Print.rpcio(trans)));

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
  /*
  ** Add all pending server port LOOKUP requests...
  ** Forward a LOOKUP of a server port search only once to a client host!
  */
  for (i in self.router.lookup_queue) {
      var lookup = self.router.lookup_queue[i];
      var cache = self.router.lookup_cache[i];
      Io.log((self.router.monitor < 2 ) || ('[BTTP] forward: +lookup '+util.inspect(lookup)+' cache '+util.inspect(cache)));
      if (cache[hostport]==undefined) {
          cache[hostport] = 1;
          buf = Buf.Buffer();
          Buf.buf_put_port(buf, lookup.header.h_port);
          body = body + '<rpc operation="LOOKUP" hostport="' + Net.port_to_str(self.hostport) + '">' +
          Buf.buf_to_hex(buf) + '</rpc>';
          msgn++;
      }
  }
  if (msgn == 0) {
      if (timeout > 0) {
          self.client_queue.push({timeout: timeout, hostport: hostport, respond: res});
      } else {
          // short reply
          body = 'ENOENTR';
          //res.
          self.send(res, body);
      }
  } else {
      body = '<xml>' + body + '</xml>';
      //res.
      self.send(res, body);
  }
};

Server.prototype.get = function (self, req, res) {
  var i,str,
      hostport, srvport, buf, hdr,
      params = Conn.parseQueryString(req.url);
  this.rpccon.stats.op_get++;
  Io.log(((log+self.verbose) < 2) || ('[BTTP] server get: ' + req.url));
  Io.log(((log+self.verbose) < 10) || ('[BTTP] server get: ' + util.inspect(params)));
  Io.trace(trace || ('[BTTP] server get: ' + req.url));
  res.origin=req.headers.origin;

  if (params.rpc != undefined &&
      params.rpc == 'request' &&
      params.hostport != undefined)
  {
      /**************************************************
       ** RPC request (HTTP Client- /Browser App. collector request)
       *************************************************/
      Sch.ScheduleCallback([Sch.Bind(self,self.forward),self, params,res]);

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
            Io.out('[BTTP] IAMHERE! Adding remote host ' + 
               Net.Print.port(hostport) + ' ip=' + req.connection.remoteAddress + 
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
          Io.log((log < 1) || ('[BTTP] server get IAMHERE: adding server port ' +
              Net.Print.port(srvport) + ' located on host ' + Net.Print.port(hostport)));
          self.router.remove_lookup(srvport);
          // TBD: search for stalled transactions that must be send to another server capable host!
          // Broker connected client apps. will collect the appropriate transaction on the next request round.
          //res.
      }
      */
      self.send(res, 'STD_OK');
  } else if (params.alive != undefined &&
             params.hostport != undefined)
  {
      /***************************
       ** ALIVE message request
       ***************************/
      this.rpccon.stats.op_alive++;

      buf=Buf.Buffer();
      hostport = Net.port_of_param(params.hostport);

      if (self.verbose && self.router.lookup_host(hostport)==undefined) 
        Io.out('[BTTP] ALIVE! Adding remote host ' + 
               Net.Print.port(hostport) + ' ip=' + params.url + (params.port!='undefined'?(' ipport=' + params.port):''));
      // TODO this.router.add_host(hostport, [params.url, params.port]);
      self.router.add_host(hostport,self.rpccon.port);
      //res.
      Buf.buf_put_port(buf,self.hostport);
      self.send(res, Buf.buf_to_hex(buf));
  } else if (params.ask != undefined &&
             params.xname != undefined)
  {
      /***************************
       ** ASK message request
       ***************************/
      this.rpccon.stats.op_ask++;
      buf=Buf.Buffer();
      //console.log(self.env[params.xname]);
      Buf.buf_put_string(buf,self.env[params.xname]||'undefined');
      self.send(res, Buf.buf_to_hex(buf));
  } else if (params.notify != undefined &&
             params.xname != undefined &&
             params.xvalue !=undefined)
  {
      /***************************
       ** NOTIFY message request
       ***************************/
      this.rpccon.stats.op_notify++;
      self.env[params.xname]=params.xvalue;
      //console.log(self.env[params.xname]);
      self.send(res, '');
  }    // res.
  else
      self.send(res, 'EINVALID');
};

Server.prototype.trans = function (self, params, req, res) {    // HTTP Callback handler
  var body;
  /***************************
   ** Incoming TRANS message
   **************************/
  req.setEncoding('utf8');
  body = '';
  req.on('data', function (chunk) {
      body = body + chunk;
  });
  req.on('end', function () {
      Io.log(((log+self.verbose) < 10) || ('BODY: ' + body));
      // New transaction request from client app., add it to the transaction queue.
      var xml = new xmldoc.XmlDocument(body);
      var header = xml.childNamed('header');
      var data = xml.childNamed('data');
      var rpcio = self.router.pkt_get();
      var hostport = Net.port_of_param(params.hostport);
      var buf = Buf.Buffer(Conn.getData(header));
      Buf.buf_get_hdr(buf, rpcio.header);
      Io.log((log < 2) || (('[BTTP] post: ' + Net.Print.header(rpcio.header))));
      rpcio.init(Rpc.Operation.TRANSREQ, rpcio.header, Conn.getData(data));
      rpcio.context=undefined;  // rpc not from here!
      rpcio.tid = Perv.int_of_string(params.tid);
      rpcio.hostport = hostport;
      // if (local request) service ..
      self.router.add_host(rpcio.hostport,self.rpccon.port);
      self.router.route(rpcio);
      // TBD: Check for local waiting servers in routing_db...
      //res.
      self.send(res, 'EWOULDBLOCK');
  });
};

Server.prototype.reply = function (self, params, req, res) {    // HTTP Callback handler
  /*************************
   * Transaction Reply
   ************************/
  var body;
  /*
   ** Reply for a transaction must be forwarded to the transaction origin collected by the source host application and
   ** the next http get/?rpc=request request.
   */
  req.setEncoding('utf8');
  body='';

  req.on('data', function (chunk) {
      body=body+chunk;
  });

  req.on('end', function () {
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

      Io.log(((log+self.verbose) < 2)||('[BTTP] post: got reply, hostport=' +
              Net.Print.port(hostport) + ' tid=' + tid + ' srvport=' + Net.Print.port(rpcio.header.h_port)));
      self.router.route(rpcio);
      //res.
      self.send(res,'STD_OK');
  });
};

Server.prototype.put = function (self, req, res) {
  var params = Conn.parseQueryString(req.url);
  this.rpccon.stats.op_put++;

  Io.log(((log+self.verbose)<10)||('[BTTP] post: ' + util.inspect(params)));
  Io.log((log<10)||('[BTTP] post: STATUS=' + req.statusCode));
  Io.log((log<10)||('[BTTP] post: HEADERS=' + JSON.stringify(req.headers)));
  Io.trace(trace||('[BTTP] server put: ' + req.url));

  res.origin=req.headers.origin;

  if (params.rpc != undefined &&
      params.rpc == 'trans' &&
      params.hostport != undefined &&
      params.tid != undefined) {
      Sch.ScheduleCallback([Sch.Bind(self,self.trans),self,params,req,res]);
   } else if (params.rpc != undefined &&
      params.rpc == 'reply' &&
      params.hostport != undefined &&
      params.tid != undefined) {
      Sch.ScheduleCallback([Sch.Bind(self,self.reply),self,params,req,res]);
  } else
      //res.
      self.send(res,'EINVALID');
};


Server.prototype.init = function () {
  var self = this;
  this.https = http.createServer(function(request, response) {
      //Io.inspect(request);
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
    Io.out('[BTTP] listen: listening on * ' + self.srv_ipport+' failed: '+er);
  });
  this.router.add_conn(self.rpccon);
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
      Io.log(((log+self.verbose)<4)||('[BTTP] Client Service and Garbage Collector'));
      if (!self.lock) {
          self.lock = true;

          self.client_queue = Array.filter(self.client_queue, function (client) {
              var msgn=0;
              var body='';
              var trans,hdr,buf;
              client.timeout=client.timeout-interval;
              Io.log((self.router.monitor < 2) || ('[BTTP] GC for host ' + Net.Print.port(client.hostport)+
                  ' #trans='+ Array.length(self.router.trans_queue)+' #lookup='+Array.length(self.router.lookup_queue)));
              do {
                  trans = self.router.lookup_trans_for_host(client.hostport);
                  Io.log(((log+self.verbose)<10)||('[BTTP] GC: lookup_trans_for_host=' + util.inspect(trans)));
                  if (trans != undefined) {
                      Io.log(((log+self.verbose)<1)||('[BTTP] GC: found trans=' + Rpc.Print.rpcio(trans)));

                      if (trans.operation == Rpc.Operation.TRANSREQ) {
                          body = body + trans.to_xml('rpc');
                          msgn++;

                      } else if (trans.operation == Rpc.Operation.TRANSREP) {
                          // Transaction reply!
                          body = body + trans.to_xml('rpc');
                          msgn++;
                      }
                  }
              } while (trans != undefined);
              // Add all pending server port LOOKUP requests...
              for (var i in self.router.lookup_queue) {
                  var lookup = self.router.lookup_queue[i];
                  // TODO: should we retransmit lookup requests here?
                  var cache = self.router.lookup_cache[i];
                  if (cache[client.hostport]==undefined) {
                      cache[client.hostport] = 1;
                      buf = Buf.Buffer();
                      Buf.buf_put_port(buf, lookup.header.h_port);
                      body = body + '<rpc operation="LOOKUP" hostport="' + Net.port_to_str(self.hostport) + '">' +
                      Buf.buf_to_hex(buf) + '</rpc>';
                      msgn++;
                  }
              }
              if (msgn>0) {
                  body = '<xml>' + body + '</xml>';
                  self.send(client.respond,body);
                  return false;
              } else if (client.timeout<=0) {
                  body = 'ENOENTR';
                  self.send(client.respond,body);
                  return false;
              } else return true;
          });

          self.lock = false;
      } else {
          context.blocked=false;
          context.timer=Sch.time;
          Sch.ScheduleNext();
      }
  });

  this.https.listen(this.srv_ipport, function () {
        Io.out('[BTTP] listen: listening on *:' + self.srv_ipport);
    });
};
module.exports = {
  /** RCP Broker Server for client-capable-only applications
   *
   */
  // type options = {hostport:port,srv_ip,srv_ipport,router,verbose?,env?:{}}
  Server: function(options) {
      var obj = new Server(options.hostport,options.srv_ip,options.srv_ipport,
                           options.router,options.verbose,options.env);
      Object.preventExtensions(obj);
      return obj;
  }
};
