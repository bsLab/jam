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
 **    $VERSION:     1.3.4
 **
 **    $INFO:
 **
 * ===========================================
 * DOS: Broker communication module 
 * Client side, Synchronous HTTP connection (blocking)
 * Data transfer: XML + EABC (compacted ASCII)
 * ===========================================
 *
 * Notes:
 * Superfluous? All http function callback computations are wrapped by scheduler callbacks to avoid main thread preemption!
 * Is event queuing always guaranteed in JS?
 * 
 * HTTP PATH/BODY <-> JSON Message Formats
 *
 *  status:'EOK'|'ENOENTR'|'EWOULDBLOCK'
 *  EABC: ASCII Hexadecimal Code
 *  XX: Hexadecimal Number Code
 *  SS: String Code
 *
 * TRANSREQ (send RPC message to broker)
 * --------
 *
 * { rpc:'trans',hostport:XX,tid:NN,
 *   data: {
 *     header:EABC
 *     data:EABC
 *   }
 * }
 *
 * =>
 *
 * /?rpc=trans&hostport=XX:XX:XX:XX:XX:XX&tid=NNN
 * <xml>
 *    <header>EABC</header>
 *    <data>EABC</data>
 * </xml>
 *
 *
 * REPLY:
 *
 * STATUS |
 *
 * <xml>
 *    <header>EABC</header>
 *    <data>EABC</data>
 * </xml>
 *
 * {status} |
 * { status,
 *   data: { header:EABC, data:EABC}
 * }
 *
 * REQUEST (get RPC messages from broker)
 * -------
 *    
 * {rpc:'request',hostport:'..'}
 *
 * =>
 *
 * /?rpc=request&hostport=XX:XX:XX:XX:XX:XX
 *
 * REPLY:
 * 
 *  <xml>
 *    <rpc hostport, sendport, operation, tid>
 *      <header>EABC</header>
 *      <data>EABC</data>
 *    </rpc>
 *    <rpc>
 *      ..
 *    </rpc>
 *    ..
 * </xml>
 * 
 * =>
 *
 * { status,
 *   data: [
 *     { hostport: XX,
 *       sendport: XX,
 *       operation : Rpc.Operation,
 *       tid: NN,
 *       header:EABC, data:EABC}
 *     ..
 *   ]}
 *
 *
 * REPLY
 * -----
 * {rpc:'reply',hostport:XX,sendport:XX,
 *  tid:NN, 
 *  data:{header:EABC,data:EABC}
 * } 
 * 
 * =>
 * /?rpc=reply&hostport=XX:XX:XX:XX:XX:XX&sendport=XX:XX:XX:XX:XX:XX&tid=NN
 * <xml>
 *    <header>EABC</header>
 *    <data>EABC</data>
 * </xml>
 *
 *
 *
 * IAMHERE
 * ------- 
 * {type:'iamhere',hostport:XX,srvport:XX}  
 * =>
 * /?rpc=iamhere&host=XX:XX:XX:XX:XX:XX&port==XX:XX:XX:XX:XX:XX
 *
 * ALIVE
 * -----
 * =>      
 * /?alive&host=XX:XX:XX:XX:XX:XX&url=SS&port=XX:XX:XX:XX:XX:XX
 *
 *
 * ASK
 * ---
 * {type:'ask',hostport:XX,xname:SS}  
 * =>
 * /&ask&host=XX:XX:XX:XX:XX:XX&xname=SS
 *
 * REPLY:
 * 
 *
 * NOTIFY
 * ---
 * {type:'notify',hostport:XX,xname:SS,xvalue:SS}  
 * =>
 * /&notify&host=XX:XX:XX:XX:XX:XX&xname=SS&xval=SS
 *
 * REPLY:
 * 
 **    $ENDOFINFO
 */
"use strict";
var log = 0;

var Io = Require('com/io');
var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Conn = Require('dos/connutils');
var util = Require('util');
var http = Require('http');
var xmldoc = Require('dos/ext/xmldoc');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var Hashtbl = Comp.hashtbl;
var String = Comp.string;
var Rand = Comp.random;
var Array = Comp.array;
var Obj = Comp.obj;
var trace = Io.tracing;
var div = Perv.div;
var Status = Net.Status;

/** Client-side Appl. only.
**  Unidirectional HTTP client-only (Browser app.) Interface with pseudo-bidirectional communication to a broker server.
 *
 *
 * @param hostport
 * @param srv_url
 * @param srv_ipport
 * @param [my_url]
 * @param [my_ipport]
 * @constructor
 */

// typeof options : {hostport,srv_ip,srv_ipport,my_ip?,my_ipport?,router,verbose?}
var httpConnection = function(options) {
    /*
    ** Broker
     */
    var self=this;
    this.srv_ip=options.srv_ip;                 // URL
    this.srv_ipport=options.srv_ipport;         // URL:port
    this.srv_port=undefined;            // Broker host server port (== host node port), returned by ALIVE request
    this.hostport=options.hostport;             // Public communication Net.Port == Host port
    this._status = Net.Status.STD_UNKNOWN;
    this.my_ip=options.my_ip||(options.srv_ip=='127.0.0.1'?options.srv_ip:'localhost');
    this.my_ipport=options.my_ipport;
    this.conn_port=Net.uniqport();
    this.verbose=options.verbose||0;
    this.keepalive=(options.keepalive==undefined?true:options.keepalive);
    this.interval=options.interval||100;  // service loop interval
    /*
     ** Pending broker request?
     */
    this.pending=0;
    this.waiting=false;
    this.rpccon=Rpc.RpcConn(
        self.conn_port,
        /*
        ** send: RPCIO message send operation called from router
        */
        function (rpcio,callback) {          
          // Messages are forwarded to broker server
          self.send(self.format(rpcio),function () {
            if (callback) callback(Net.Status.STD_OK,rpcio);
          });
        },
        /*
         ** alive: Connection status
         */
        function() {
          return self._status==Net.Status.STD_OK;
        }
    );
    this.rpccon.multiport=true;
    this.mode=Conn.Mode.ONECHAN;  // only client can initiate a message transfer
    this.router=options.router;    
    this.stats = this.rpccon.stats;
};




/** Send the broker server an ALIVE message and wait for response
 ** to check the connection status.
 *
 * @param callback
 */
httpConnection.prototype.alive = function (callback) {
    var self=this,
        msg;
    Io.log(((log+this.verbose)<2)||('[BHPC] ALIVE: current status: '+this._status));
    this.stats.op_alive++;
    msg={type:'alive',hostport:this.hostport,ip:this.my_ip,ipport:this.my_ipport};
    this.send(msg, function(reply) {
        Io.log(((log+self.verbose)<2)||('[BHPC] ALIVE status: ' + reply.status));
        Io.log(((log+self.verbose)<2)||('[BHPC] ALIVE data: ' + reply.data));
        if (reply.status=='EOK') {
            /*
            ** Reply must contain the broker host server port.
             */
            if (String.length(reply.data)==(Net.PORT_SIZE*2)) {
                var buf=Buf.Buffer(reply.data);
                self.srv_port=Buf.buf_get_port(buf);
                if (self.verbose>0 && (self._status!=Net.Status.STD_OK || self.waiting))
                    Io.out('[BHPC] ALIVE! ['+
                            Net.Print.port(self.hostport)+
                            '] is connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                            Net.Print.port(self.srv_port)+ ']');
                self._status=Net.Status.STD_OK;
                self.waiting=false;
            } else {
                if (self.verbose>0 && (self._status==Net.Status.STD_OK||self._status==Net.Status.STD_UNKNOWN)) 
                  Io.out('[BHPC] ALIVE! Not connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                            Net.Print.port(self.srv_port)+ ']');                
                Io.log(((log+self.verbose)<1)||('[BHPC] Error: ALIVE returned invalid data: '+data+', '+self.srv_ip+':'+self.srv_ipport));
                self._status=Net.Status.STD_IOERR;
            }
        } else if (reply.status!='EOK') {
          if (self.verbose>=0 && (self._status==Net.Status.STD_OK||self._status==Net.Status.STD_UNKNOWN))
            Io.out('[BHPC] ALIVE! Not connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                   Net.Print.port(self.srv_port)+ ']');                
          self._status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<2)||('[BHPC] Error: ALIVE ['+self.srv_ip+':'+self.srv_ipport+path+']: ' + reply.status));
        };
        if (callback) callback(self._status);
    });
};

/** Ask the broker server for a value (e.g., a capability)..
 *
 * @param {string} xname
 * @param {function(string)} callback
 */
httpConnection.prototype.ask = function (xname,callback) {
    var self=this,
        msg;
    Io.log(((log+this.verbose)<2)||('[BHPC] ASK: ' + xname));
    this.stats.op_ask++;
    msg={type:'ask',hostport:this.hostport,xname:xname};
    this.send(msg, function(reply) {
        Io.log(((log+self.verbose)<2)||('[BHPC] ASK status: '+path+' STATUS: ' + reply.status));

        if (reply.status=='EOK') {
            var buf=Buf.Buffer();
            Io.log(((log+self.verbose)<2)||('[BHPC] ASK data: ' + reply.data));
            Buf.buf_of_hex(buf,reply.data);
            if (callback) callback(Buf.buf_get_string(buf));
        } else if (reply.status!='EOK') {
          self._status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<2)||('[BHPC] Error: ASK ['+self.srv_ip+':'+self.srv_ipport+path+']: ' + reply.status));
        }  
    });
};

/** Create a request message from rpcio object 
 *
 */
httpConnection.prototype.format = function (rpcio) {
  var msg,data,buf,
      self=this;
  switch (rpcio.operation) {
    case Rpc.Operation.TRANSREQ:
      data = rpcio.to_json('simple');
      msg={rpc:'trans',hostport:rpcio.hostport,sendport:rpcio.sendport,
           hop:rpcio.hop,tid:rpcio.tid,data:data};
      break;
    case Rpc.Operation.TRANSREP:
      data = rpcio.to_json('simple');
      msg={rpc:'reply',hostport:self.router.hostport,sendport:rpcio.sendport,
           hop:rpcio.hop,tid:rpcio.tid,data:data};
      break;
    case Rpc.Operation.LOOKUP:
      msg={rpc:'lookup',hostport:self.router.hostport,srvport:rpcio.header.h_port,
           hop:rpcio.hop};
      break;
    case Rpc.Operation.IAMHERE:
      msg={rpc:'iamhere',hostport:rpcio.hostport,sendport:rpcio.sendport,
           srvport:rpcio.header.h_port,hop:rpcio.hop};
      break;
  }
  return msg;
}

/** HTTP GET request to send a messageto the server broker returning data on reply.
 *
 * @param path
 * @param callback
 */
httpConnection.prototype.get = function (path,callback) {
    var body;
    var self=this;
    Io.log(((log+this.verbose)<2)||('[BHPC] GET: ' + path));
    Io.trace(trace||('[BHPC] GET: ' + path));
    this.stats.op_get++;
    var req;
    if (!http.xhr) {
      req = http.request({
        host: self.srv_ip,
        port: self.srv_ipport,
        path: path,
        method: 'GET',
        keepAlive: this.keepalive,
        headers: {
        }
      } , function(res) {
        Io.log(((log+self.verbose)<2)||('[BHPC] GET REPLY: '+path+' returned STATUS: ' + res.statusCode));
        Io.log(((log+self.verbose)<10)||('[BHPC] GET HEADERS: ' + JSON.stringify(res.headers)));
        if (res.setEncoding != null) res.setEncoding('utf8');
        body = '';
        res.on('data', function (chunk) {
            body = body + chunk;
        });
        res.once('end', function () {
            self._status=Net.Status.STD_OK;
            Io.log(((log+self.verbose)<2)||('[BHPC] GET REPLY DATA: '+(body.length<100?body:'..')+' [' + body.length+']'));
            Io.log(((log+self.verbose)<10)||('[BHPC] GET REPLY DATA: '+body));
            if (callback) callback(body);
        });
      });
    req.once('error', function(e) {
        self._status=Net.Status.STD_IOERR;
        self.stats.op_error++;
        Io.log(((log+self.verbose)<1)||('[BHPC] Error: GET  ['+self.srv_ip+':'+self.srv_ipport+path+']: ' + e.message));
    });
    req.end();
  } else {
      // XHR Browser
      http.request({
        port: self.srv_ipport,
        host: self.srv_ip,
        path:path,
        proto:'http',
        method: 'GET',
        keepAlive: this.keepalive,
        headers: {
        }
      } , function(err,xhr,body) {
        if (err) {
          self._status=Net.Status.STD_IOERR;
          self.stats.op_error++;
          Io.log(((log+self.verbose)<1)||('[BHPC] Error: GET ['+self.srv_ip+':'+self.srv_ipport+path+']: ' + err));
          return;
        } 
        self._status=Net.Status.STD_OK;
        Io.log(((log+self.verbose)<2)||('[BHPC] GET REPLY DATA: '+(body.length<100?body:'..')+' [' + body.length+']'));
        Io.log(((log+self.verbose)<10)||('[BHPC] GET REPLY DATA: '+body));
        if (callback) callback(body);
      });    
  }
};


/** Initialize communication module
 *
 */
httpConnection.prototype.init = function (callback) {
  var self=this;
  if (!this.interval) this.interval=100;
  this.waiting=true;
  if (callback) callback();
};

httpConnection.prototype.debug = function (v) {log=v};


/** Notify the broker server about a value (e.g., a capability)..
 *
 * @param {string} xname
 * @param {string} xval
 * @param {function(string)} callback
 */
httpConnection.prototype.notify = function (xname,xval,callback) {
    var self=this,
        msg;
    this.stats.op_notify++;
    Io.log(((log+this.verbose)<2)||('[BHPC] NOTIFY: ' + xname+'='+xval));
    msg={type:'notify',hostport:this.hostport,xname:xname,xvalue:xval};
    this.send(msg, function(reply) {
        Io.log(((log+self.verbose)<2)||('[BHPC] NOTIFY status: '+path+' STATUS: ' + reply.status));
        if (reply.status=='EOK' && callback) callback();
        else if (reply.status!='EOK') {
          self._status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<1)||('[BHPC] Error: NOTIFY ['+self.srv_ip+':'+self.srv_ipport+' '+xname+'='+xval+']: ' + reply.status));
        }
    });
};

/** Parse reply message (repsonse to collect request) and convert to rpcio object
 *
 */
 
httpConnection.prototype.parse = function (reply) {
  var i,rpc,rpcio,res,mysrv,
      routed=0,
      self=this;
// console.log(reply)
  if (reply.data==undefined) return 0;
  if (!Obj.isArray(reply.data)) reply.data=[reply.data];
  
  for (i in reply.data) {
    rpc = reply.data[i];
    if (!rpc.operation) switch (rpc.rpc) {
      case ('lookup') : rpc.operation='LOOKUP'; break;
    }

    rpcio = self.router.pkt_get();
    res=rpcio.of_json(rpc);
//console.log(rpc)
    if (res==0) {
      self.router.pkt_discard(rpcio);
      rpcio=undefined;
    }
    else {
      rpcio.connport=self.conn_port;
      if (rpcio.operation == Rpc.Operation.TRANSREQ) {
        if (rpcio.sendport==undefined) rpcio.sendport = self.hostport; // Nothing to-do?
      }
     
      Io.log(((log+self.verbose)<2)||('[BHPC] received ' + Rpc.Print.rpcio(rpcio)));
      Io.trace(trace||('[BHPC] received ' + Rpc.Print.rpcio(rpcio)));
      routed++; self.router.route(rpcio);
    }
  }
  return routed;
}


httpConnection.prototype.parseQueryString = function(url) {
    var queryString = url.substring( url.indexOf('?') + 1 );
    if (queryString == url) return [];
    var params = {}, queries, temp, i, l;

    // Split into key/value pairs
    queries = queryString.split("&");

    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        if (temp[1]==undefined) temp[1]='true';
        params[temp[0]] = temp[1];
    }

    return params;
};

/** HTTP PUT request to send a message and data to the broker server.
 *
 * @param path
 * @param data
 * @param callback
 */
httpConnection.prototype.put = function (path,data,callback) {
    var self=this,
        req;
    Io.log(((log+this.verbose)<2)||('[BHPC] PUT: ' + path+ ' ['+data.length+']'));
    Io.trace(trace||('[BHPC] PUT: ' + path));
    this.stats.op_put++;

    if (!http.xhr) {
      req = http.request({
        host: self.srv_ip,     // hostname not avail. in http-browserify
        port: self.srv_ipport,
        path: path,
        method: 'POST',
        keepAlive: this.keepalive,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
      } , function(res) {
        Io.log(((log+self.verbose)<2)||('[BHPC] PUT REPLY: '+path+' returned STATUS: ' + res.statusCode));
        Io.log(((log+self.verbose)<10)||('[BHPC] PUT REPLY HEADERS: ' + JSON.stringify(res.headers)));
        if (res.setEncoding != null) res.setEncoding('utf8');
        // TODO body=+chunk, res.on('end') ..??
        res.once('data', function (chunk) {
            self._status=Net.Status.STD_OK;
            Io.log(((log+self.verbose)<2)||('[BHPC] PUT REPLY DATA: '+(chunk.length<100?chunk:'..')+' [' + chunk.length+']'));
            Io.log(((log+self.verbose)<10)||('[BHPC] PUT REPLY DATA: ' + chunk));
            if (callback) callback(chunk);
        });
      });
      req.once('error', function(e) {
        self._status=Net.Status.STD_IOERR;
        self.rpccon.stats.op_error++;
        Io.log(((log+self.verbose)<1)||('[BHPC] Error: PUT ['+self.srv_ip+':'+self.srv_ipport+path+']: ' + e.message));
      });

      // write data to request body
      req.write(data);
      req.end();
    } else {
      // XHR Browser
      http.request({
        host: self.srv_ip,     // hostname not avail. in http-browserify
        port: self.srv_ipport,
        path: path,
        method: 'POST',
        body:data,
        keepAlive: this.keepalive,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
      } , function(err,xhr,body) {
        if (err) {
          self._status=Net.Status.STD_IOERR;
          self.rpccon.stats.op_error++;
          Io.log(((log+self.verbose)<1)||('[BHPC] Error: PUT ['+self.srv_ip+':'+self.srv_ipport+path+']: '+err));
          return;
        }
        self._status=Net.Status.STD_OK;
        Io.log(((log+self.verbose)<2)||('[BHPC] PUT REPLY DATA: '+(body.length<100?chunk:'..')+' [' + body.length+']'));
        Io.log(((log+self.verbose)<10)||('[BHPC] PUT REPLY DATA: ' + body));
        if (callback)  callback(body);
      })
    }
};

/** Main entry for broker requests with JSON interface. Multiplexer for HTTP GET/PUT.
 *  Called by router.
 *
 *  msg: JSON 
 *  callback : function (reply:JSON)
 */
httpConnection.prototype.send = function (msg,callback) {
  var path='/?',
      body;
  if (msg.rpc) path += 'rpc='+msg.rpc;
  else if (msg.type) path += msg.type;
  if (msg.hostport) path += '&hostport='+Net.port_to_str(msg.hostport);
  if (msg.srvport) path += '&srvport='+Net.port_to_str(msg.srvport);
  if (msg.sendport) path += '&sendport='+Net.port_to_str(msg.sendport);
  if (msg.tid!=undefined) path += '&tid='+msg.tid;  
  if (msg.timeout!=undefined) path += '&timeout='+msg.timeout;
  if (msg.xname!=undefined) path += '&xname='+msg.xname;
  if (msg.xvalue!=undefined) path += '&xvalue='+msg.xvalue;
  if (msg.ip!=undefined) path += '&ip='+msg.ip;

  if (msg.data!=undefined) {
    body='<xml>';
    if (msg.data.header) body += '<header>' + msg.data.header + '</header>';
    if (msg.data.data) body += '<data>' + msg.data.data + '</data>';
    body += '</xml>';
    this.put(path,body,function (body) {
      if (callback) {
        if (Conn.is_error(body) || Conn.is_status(body)) callback({status:body});
        else callback({status:'EINVALID'});
        // TODO: reply? Currently not accepted by router
      }
    }); 
  }
  else 
    this.get(path,function (body) {
      var xml,rpcs,rpc,i,
          reply={},
          elem={};
      if (Conn.is_error(body) || Conn.is_status(body)) {
        if (callback) callback({status:body});
      } 
      else if (msg.type=='alive' || msg.type=='ask') callback({status:'EOK',data:body});
      else if (msg.rpc != undefined) {
        /*
        ** We can get more than one message contained in the reply: <xml><rpc>..</rpc><rpc>..</rpc>..</xml>
        ** including LOOKUP/WHEREIS messages
        */
// console.log(body)
        xml = new xmldoc.XmlDocument(body);
        if (xml.name == undefined) {
          // Not a XML reply, communication error or wrong server.
          if (callback) callback({status:'EINVALID'}); 
          return;
        };
        reply.status='EOK';
        rpcs = xml.childrenNamed('rpc');
        if (!rpcs) {
          /*
          ** Plain RPCIO <xml><header/><data/>
          */
          elem.header = Conn.getData(xml.childNamed('header'));
          elem.data = Conn.getData(xml.childNamed('data'));
          reply.data=[elem];
        } else {
          reply.data=[];
          for (i in rpcs) {
            rpc = rpcs[i];
            elem={};         
            if (String.equal(rpc.name,'rpc')) {
                /*
                ** Wrapped RPCIO <rpc><header/><data/>
                 */
                elem.tid = rpc.attr.tid;
                elem.hostport = Net.port_of_param(rpc.attr.hostport);
                elem.sendport = Net.port_of_param(rpc.attr.sendport);
                elem.operation = rpc.attr.operation;
                elem.header = Conn.getData(rpc.childNamed('header'));  
                
                if (elem.operation=='LOOKUP' || elem.operation=='IAMHERE')
                  elem.data = Conn.getData(rpc);
                else
                  elem.data = Conn.getData(rpc.childNamed('data'));
            } 
            reply.data.push(elem);
          }
        }
        if (callback) callback(reply);
      }
  }); 
}

/** Service handler loop collecting messages from broker.
 *
 */
// function (options:{hostport,timeout},callback:function(reply))
httpConnection.prototype.service = function (interval) {
  var reply,msg,
      self=this,
      timeout=interval*10,
      step=interval/20;

  Sch.AddTimer(interval, 'BHPC Service', function (context) {
    Io.log(((log+self.verbose) < 4)||('[BHPC] Service run '+Status.print(self._status)+ ' '+ self.pending));
    /*
     ** Check for available TRANS messages for THIS application identified by the app. port (name..) ...
     ** The broker request is blocked until RPC transactions are available or a timeout occurred.
     */
    if (self._status==Net.Status.STD_OK && self.pending<=0) {
      self.pending=timeout;
      msg = {rpc:'request',hostport:self.hostport, timeout:timeout};
      Io.log(((log+self.verbose) < 2) || ('[BHPC] Service: '+util.inspect(msg)));
      self.send(msg,function (reply) {
        self.pending=0;
        self.stats.op_brokerrep++;
        if (reply.status=='EINVALID') {
          // Not a valid reply, communication error or wrong server.
          self.stats.op_error++;
          Io.out('[BHPC] Received invalid HTTP message w/o data');                          
        } else if (reply.status!='ENOENTR') {
            /*
             ** We can get more than one message contained in the reply: <xml><rpc>..</rpc><rpc>..</rpc>..</xml>
             ** including LOOKUP/WHEREIS messages
             */  
            self.parse(reply);
            // Force new execution of this handler immediately
            Sch.Wakeup(context);
            context.timer=Sch.time;
            Sch.ScheduleNext();
        } else {
            self.stats.op_noentr++;
            // callback('ENOENTR');
            // Force new execution of this handler immediately
            Sch.Wakeup(context);
            context.timer=Sch.time;
            Sch.ScheduleNext();
        }
      });
    } else if (self._status!=Net.Status.STD_OK)  self.pending=0;
      else if (self.pending>0) self.pending=self.pending-step;
  });
}



httpConnection.prototype.start = function (callback) {
  // Watchdog and service collector loop
  this.watchdog(1000);
  this.service(this.interval);
  if (callback) callback();
}

httpConnection.prototype.status = function () {
  return this._status;
}

httpConnection.prototype.stop = function (callback) {
  // Stop watchdog & service loop
  Sch.RemoveTimer('BHPC Watchdog');
  Sch.RemoveTimer('BHPC Service');
  if (callback) callback();
};

httpConnection.prototype.watchdog = function (interval) {
  var self=this;
  // Watchdog
  Sch.AddTimer(interval,'BHPC Watchdog',function () {
    self.alive();
  });
};

module.exports = {
    /**
     *
     * @param hostport
     * @param srv_ip
     * @param srv_ipport
     * @param [my_ip]
     * @param [my_ipport]
     * @returns {httpConnection}
     * @constructor
     */
    /**
     *  type options = {hostport,srv_ip,srv_ipport,my_ip?,my_ipport?,verbose?} 
     */
    Connection: function(options) {
        var obj = new httpConnection(options);
        Object.preventExtensions(obj);
        return obj;
    }
};
