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
 **    $VERSION:     1.4.3
 **
 **    $INFO:
 **
 * ====================================================================
 * DOS: Broker connection module 
 * Client, TCP connection
 *
 * Data transfer: JSON
 * ====================================================================
 *
 *  Uni- or bidirectional TCP client-only (Browser app.) Interface with 
 *  non-blocking / blocking communication to a broker server.
 *
 *  Unidrirectional mode: Two non-persistent TCP connections (non-blocking connection)
 *  Bidirectional mode: One persistent TCP connection (blocking connection)
 *
 *  Unidirectional: Requires a local TCP server port for asynchronously receiving replies 
 *  from the broker server.
 *
 * Default: Mode=ONECHAN, KEEPALIVE=true
 *
 **
 ** Message format:
 *
 *  status:'EOK'|'ENOENTR'|'EWOULDBLOCK'|'STD_OK'
 *  EABC: ASCII Hexadecimal Code
 *  XX: Hexadecimal Number Code
 *  BB: Binary String Code
 *  SS: String Code
 *
 * TRANSREQ (send RPC message to broker)
 * --------
 *
 * { rpc:'trans',hostport:BB,tid:NN, hop:NN, ipport:NN,
 *   header:EABC, data:EABC
 * }
 *
 * REPLY:
 * none |
 * {status} |
 * { status,
 *   header:EABC, data:EABC
 * }
 *
 * REQUEST (get RPC messages from broker)
 * -------
 *    
 * {type:'request',hostport:BB,ipport:NN}
 *
 * REPLY:
 *
 * { type:'request-reply',
 *   status,
 *   data: [
 *     { hostport: BB,
 *       sendport: BB,
 *       operation : Rpc.Operation,
 *       tid: NN,
 *       header:EABC, data:EABC},
 *     ..
 *   ]}
 *
 * TRANSREP
 * -----
 * {rpc:'reply',hostport:BB,sendport:BB,
 *  tid:NN, hop:NN, [ipport:NN,]
 *  header:EABC,data:EABC
 * }
 *
 * LOOKUP
 * ------- 
 * {type:'lookup',hostport:BB,header:EABC}
 *
 * IAMHERE
 * ------- 
 * {type:'iamhere',hostport:BB,sendport:BB,hop:NN,header:EABC}  
 *
 * ALIVE
 * -----
 * {type:'alive',hostport:BB,srvport:BB}  
 *
 * ASK
 * ---
 * {type:'ask',hostport:BB,xname:SS}  
 *
 * REPLY:
 * 
 * {type:'ask-reply', status, xname:SS, xvalue:SS}
 *
 * NOTIFY
 * ---
 * {type:'notify',hostport:BB,xname:SS,xvalue:SS}  
 * =>
 *
 * REPLY:
 * 
 * {type:'notify-reply',status}
 *
 **    $ENDOFINFO
 */
"use strict";
var log = 0;


var util = Require('util');
var net = Require('net');

var Io = Require('com/io');
var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Conn = Require('dos/connutils');
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

var Mode = Conn.Mode;

/** Client-side Appl. Connection object.
 *
 *
 * @param hostport
 * @param srv_url
 * @param srv_ipport
 * @param [my_url]
 * @param [my_ipport]
 * @constructor
 */

// tyoeof options = {hostport,srv_ip,srv_ipport,my_ip?,my_ipport?,router,mode?,log?, verbose?}
var netConnection = function(options) {
    /*
    ** Broker
     */
    var self=this;
    this.srv_ip=options.srv_ip;                 // URL IP
    this.srv_ipport=options.srv_ipport;         // URL:port IP
    this.srv_port=undefined;            // Broker host server RPC port (== host node port), returned by ALIVE request
    this.hostport=options.hostport;             // Public communication Net.Port == Host port
    this._status = Net.Status.STD_UNKNOWN;
    this.my_ip=options.my_ip||(options.srv_ip=='127.0.0.1'?options.srv_ip:'localhost');
    this.my_ipport=options.my_ipport||0;
    this.verbose=options.verbose||0;
    this.mode=options.mode||Mode.ONECHAN;
    this.keepalive=(options.keepalive==undefined?true:options.keepalive);
    this.interval=options.interval||100;  // service loop interval
    this.log = options.log || Io.out;
    
    /*
     ** Pending broker request?
     */
    this.pending=0;
    this.waiting=false;
    this.conn_port = Net.uniqport();
    this.rpccon=Rpc.RpcConn(
      self.conn_port,
      /*
      ** send: Connection Forward and Deliver Operation
      */
      function(rpcio,callback) {
        // Messages are forwarded directly to the broker server
        if (self._status!=Net.Status.STD_OK) {
          if (callback) callback(self._status,rpcio);          
        } else {
          self.send(self.format(rpcio), function () {
            if (callback) callback(Net.Status.STD_OK,rpcio);
          });
        }
      },
      /*
       ** alive: Connection status
       */
      function() {
        return self._status==Net.Status.STD_OK;
      }
    );

    this.requests=[];
    this.last=undefined;
    this.server=undefined;

    this.socket=undefined;
    this.warned=0;
    this.ready=false;
    this.router=options.router;
    // Transfer of multi-part messages?
    this.multipart=true;
    // this.rid=0;
    this.request_id=Rpc.transaction_id;
    this.stats=this.rpccon.stats;
    
    this.events=[];
};



/** Send the broker server an ALIVE message and wait for response
 ** to check the connection status.
 *
 * @param callback
 */
netConnection.prototype.alive = function (callback) {
    var self=this;
    var msg= {
      type:'alive',
      hostport:this.hostport,
      ip:this.my_ip,
      ipport:this.my_ipport
    };
    Io.log(((log+this.verbose)<2)||('[BTPC] ALIVE, current status: '+this._status));

    this.stats.op_alive++;

    this.request(self.srv_ip,self.srv_ipport,msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BTPC] ALIVE status: STATUS: ' + reply.status));
        Io.log(((log+self.verbose)<2)||('[BTPC] ALIVE data: ' + reply.data));
        if (reply.status!='EOK')  {
          if (self.verbose>=0 && (self._status==Net.Status.STD_OK||self._status==Net.Status.STD_UNKNOWN))
            self.log('[BTPC] ALIVE! Not connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                 Net.Print.port(self.srv_port)+ ']');                
          self._status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<2)||('[BTPC] ALIVE problem with request ['+
                   self.srv_ip+':'+self.srv_ipport+']: ' + e.message));
        }
        /*
        ** Reply must contain the broker host server port.
        */
        if (reply.data && String.length(reply.data)==(Net.PORT_SIZE*2)) {
          var buf=Buf.Buffer(reply.data);
          self.srv_port=Buf.buf_get_port(buf);
          if (self.verbose>0 && (self._status!=Net.Status.STD_OK || self.waiting))
            self.log('[BTPC] ALIVE! Connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                            Net.Print.port(self.srv_port)+ '] in mode '+
                            self.mode+
                            (self.keepalive?' KEEPALIVE':''));
          self._status=Net.Status.STD_OK;
          self.waiting=false;
        }
        else {
            if (self.verbose>0 && (self._status==Net.Status.STD_OK||self._status==Net.Status.STD_UNKNOWN)) 
                self.log('[BTPC] ALIVE! Not connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                            Net.Print.port(self.srv_port)+ ']');                
            Io.log(((log+self.verbose)<1)||('[BTPC] ALIVE returned invalid data: '+reply.data+', '+self.srv_ip+':'+self.srv_ipport));
            self._status=Net.Status.STD_IOERR;
       }
       if (callback) {
          callback(self._status);
       }
    });    
};

/** Ask the broker server for a value (e.g., a capability)..
 *
 * @param {string} xname
 * @param {function(string)} callback
 */
netConnection.prototype.ask = function (xname,callback) {
    var self=this;
    var msg= {
      type:'ask',
      hostport:this.hostport,
      ip:this.my_ip,
      port:this.my_ipport,
      xname:xname
    };
    Io.log(((log+this.verbose)<2)||('[BTPC] ASK: ' + xname));
    this.stats.op_ask++;

    this.request(self.srv_ip,self.srv_ipport,msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BTPC] ASK status: '+xname+' STATUS: ' + reply.status));
        if (reply.status!='EOK') {
          self._status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<2)||('[BTPC] ASK problem with request ['+
                  self.srv_ip+':'+self.srv_ipport+']: ' + reply.status));   
        } else {   
          var buf=Buf.Buffer();
          Io.log(((log+self.verbose)<2)||('[BTPC] ASK data: ' + reply.data));
          Buf.buf_of_hex(buf,reply.data);
          if (callback) callback(Buf.buf_get_string(buf));
        }
    });
};

netConnection.prototype.emit=function (event,args) {
    var e;
    for (e in this.events) {
      var ev=this.events[e];
      if (ev[0]==event) ev[1](args);
    }
  };

/** Create a request message from rpcio object 
 *
 */
netConnection.prototype.format = function (rpcio) {
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

/** Initialize connection module
 *
 */
netConnection.prototype.init = function (callback) {
  var self=this;
  Io.log(((log+self.verbose)<2)||('[BTPC] Initializing.'));
  if (this.mode==Mode.TWOCHAN) 
    this.server = net.createServer(function (socket){
      // console.log(socket);
      // console.log('Connection ..');
      socket.setNoDelay(true);
      socket.on('data', function(data) {
        var callback,reply,parts,part;
        Io.log(((log+self.verbose)<2)||('[BTPC] Received: ' + data));

        if (self.multipart) parts = Conn.splitData(data);            
        else parts=[data];
        if (self.last) parts[0]=self.last+parts[0];
        if (Array.last(parts) != '') self.last=Array.last(parts); else self.last=undefined;

        for (part in parts) {
          if (parts[part]=='') continue;
          Io.log(((log+self.verbose)<3)||('[BTPC] Servicing part ' + parts[part]));
          reply = JSON.parse(parts[part]);
          if (self.multipart) Conn.decode(reply);
          self.stats.op_receive++;
          if (!reply.rpc & reply.tid!=undefined && self.requests[reply.tid]!=undefined) {
            Io.log(((log+self.verbose)<3)||('[BTPC] Servicing tid ' + reply.tid));
            // callback=self.requests[reply.rid];
            callback=self.requests[reply.tid];
            self.requests[reply.tid]=undefined;
            callback(reply);
          } else {
            // Pass message to router
            self.parse1(reply);
          }
        }
      });
    });
  if (callback) callback();
  this.waiting=true;
};

netConnection.prototype.debug = function (v) {log=v};

netConnection.prototype.on=function (event,callback) {
    this.events.push([event,callback]);
};

/** Notify the broker server about a value (e.g., a capability)..
 *
 * @param {string} xname
 * @param {string} xval
 * @param {function(string)} callback
 */
netConnection.prototype.notify = function (xname,xval,callback) {
    var self=this;
    var msg= {
      type:'notify',
      hostport:this.hostport,
      ip:this.my_ip,
      port:this.my_ipport,
      xname:xname,
      xvalue:xval
    };
    Io.log(((log+this.verbose)<2)||('[BTPC] NOTIFY: ' + xname + '='+xval));
    this.stats.op_notify++;

    this.request(self.srv_ip,self.srv_ipport,msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BTPC] NOTIFY status=' + reply.status));
        if (callback && reply.status=='EOK') callback();
        else if (reply.status!='EOK') {
          self._status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<1)||('[BTPC] NOTIFY problem with request ['+
                  self.srv_ip+':'+self.srv_ipport+']: '+reply.status));    
        }
    });
};

/** Parse compound reply message (repsonse to collect request) 
 *  and convert to rpcio object, finally passed to the router.
 *
 */
 
netConnection.prototype.parse = function (reply) {
  var i,rpc,rpcio,res,mysrv,
      routed=0,
      self=this;
//console.log(reply)
  if (!reply.data && !reply.rpc && reply.status=='EOK') return 0;
  if (reply.data==undefined) {
    reply.data=[reply];
  }
  else if (!Obj.isArray(reply.data)) reply.data=[reply.data];
  
  for (i in reply.data) {
    rpc = reply.data[i];
    routed+=this.parse1(rpc);
  }
  return routed;
}

/** Parse rpc message and convert to rpcio object, finally passed to the router.
 *
 */

netConnection.prototype.parse1 = function (rpc) {
  var i,rpcio,res,
      routed=0,
      self=this;
  
  if (!rpc.operation) switch (rpc.rpc) {
    case ('lookup') : rpc.operation='LOOKUP'; break;
    case ('iamhere') : rpc.operation='IAMHERE'; break;
    case ('whereis') : rpc.operation='WHEREIS'; break;
    case ('hereis') : rpc.operation='HEREIS'; break;
    case ('trans') : rpc.operation='TRANSREQ'; break;
    case ('reply') : rpc.operation='TRANSREP'; break;
  }
  rpcio = this.router.pkt_get();
  res=rpcio.of_json(rpc);
  if (res==0) {
    self.router.pkt_discard(rpcio);
    rpcio=undefined;
    Io.warn('[BTPC] Parser: Invalid message: '+util.inspect(rpc));
  }
  else {
    rpcio.connport=this.conn_port;
    Io.log(((log+this.verbose)<2)||('[BTPC] received ' + Rpc.Print.rpcio(rpcio)));
    Io.trace(trace||('[BTPC] received ' + Rpc.Print.rpcio(rpcio)));
    routed++; this.router.route(rpcio);
  }
  return routed;
}

 
/** Send a request to the broker and register optional callback handler.
 *  callback: reply callback!
 */

netConnection.prototype.request = function(ip,ipport,msg,callback) {
  var data, socket,
      reuse=true,
      registered=false,
      self=this;

  //if (msg.rid==undefined) msg.rid=this.request_id();
  
  if (this.mode!=Mode.ONECHANN) {
    if (msg.ipport==undefined) msg.ipport=this.my_ipport;
    if (msg.ip==undefined) msg.ip=this.my_ip;
  }
  if (this.multipart) Conn.encode(msg);
  if (!this.keepalive) msg.nokeepalive=true;
  
  // Register callback

  // !!!!!!!!!!!!!!!!!!!!!!!!!
  // Only local requests with tid generated here may be used to register callbacks!
  // !!!!!!!!!!!!!!!!!!!!!!!!!
  switch (msg.type) {
    case 'alive': 
    case 'ask':
    case 'notify':
    case 'request':
      if (msg.tid==undefined) msg.tid=this.request_id();
      self.requests[msg.tid]=callback;
      registered=true;
      break;
  }
  
  Io.log(((log+self.verbose)<2)||('[BTPC] Request: '+util.inspect(msg)));
  
  if (this.socket==undefined || !this.keepalive) {
    reuse=false;
    socket = net.connect(ipport,ip, function() {
      var data = JSON.stringify(msg);
      // console.log('Connected');
      socket.setNoDelay(true);
      if (self.multipart) socket.write(data+Conn.EOM);
      else socket.write(data);
      if (this.mode==Mode.TWOCHANN && !self.keepalive) {
        // console.log('destroy');
        socket.destroy(); // kill client after server's response - or end?
        // socket.end();
      }
    });
    this.socket=socket;
    socket.on('data', function(data) {
      var callback,reply,parts,part;
      // ONECHAN mode only !!!
      // Check EWOULDBLOCK, queue callback
      // print('<'+data.toString()+'>')  
      if (!data || data.length==0) return; 
      
      Io.log(((log+self.verbose)<2)||('[BTPC] Reply: '+data));
      
      if (self.multipart) parts=Conn.splitData(data);
      else parts=[data];

      if (self.last) parts[0]=self.last+parts[0];
      if (Array.last(parts) != '') {
        self.last=Array.last(parts); 
        return;
      }
      else self.last=undefined;
      
      for (part in parts) {
        if (parts[part]=='') continue;
        try {reply = JSON.parse(parts[part])} catch (e) {self.log('[BTPC] Reply parsing error: '+e); continue};
//print(reply)
        if (self.multipart) Conn.decode(reply);
        self.warned=0;
        if (reply.status=='EWOULDBLOCK') continue;
        switch (reply.type) {
          case 'alive-reply': 
          case 'ask-reply':
          case 'notify-reply':  
          case 'request-reply':  
            if (reply.tid!=undefined) { 
              callback=self.requests[reply.tid];
              if (callback) {
                //self.requests[reply.rid]=undefined;
                self.requests[reply.tid]=undefined;
                callback(reply);
              }            
            }
            break;        
        }
      }
    });
    socket.on('error', function(e) {
      // console.log('Connection closed');
      if (self.warned<2) {
        self.log('[BTPC] Communication error to ' +ip+':'+ipport+(self.warned==1?' (more)':'')+' : '+e);
        self.warned++;
        self.emit('error');
      }
    });
    socket.on('close', function() {
        // console.log('Connection closed');
        self.socket=undefined;
    });
  } else reuse=true;
  
  
  if (reuse) {
      data = JSON.stringify(msg);
      if (this.multipart) this.socket.write(data+Conn.EOM);
      else this.socket.write(data);
  }
  if (callback && !registered) callback({status:'EOK'});
};


/** Main entry for broker requests with JSON interface. Called by router. 
 *  msg: JSON 
 *  callback : function (reply:JSON)  // reply callback handler!
 */
netConnection.prototype.send = function (msg,callback) {
  var self=this;
  // console.log(msg)  
  this.stats.op_send++;
  this.request(this.srv_ip,this.srv_ipport,msg,
    function(reply) {
      // console.log(reply)
      if (reply.status!='EOK') callback({status:reply.status})
      else if (reply.data) {
        // console.log(reply)
        if (self.mode==Mode.ONECHANN)
          callback(reply);
        else {
          self.parse(reply); 
          if (callback) callback({status:reply.status})
        }
      }
      else if (callback) callback(reply);        
    });
}

/** Service handler loop collecting messages from broker.
 *  ONECHANN mode only!
 */
// function (options:{hostport,timeout},callback:function(reply))
netConnection.prototype.service = function (interval) {
  var reply,msg,
      self=this,
      timeout=interval*10,
      step=interval/20;

  Sch.AddTimer(interval, 'BTPC Service', function (context) {
    Io.log(((log+self.verbose) < 4)||('[BTPC] Service run '+Status.print(self._status)+ ' '+ self.pending));
    /*
     ** Check for available TRANS messages for THIS application identified by the app. port (name..) ...
     ** The broker request is blocked until RPC transactions are available or a timeout occurred.
     */
    if (self._status==Net.Status.STD_OK && self.pending<=0) {
      self.pending=timeout;
      msg = {type:'request',
             hostport:self.multipart?Net.port_to_str(self.hostport):self.hostport, 
             timeout:timeout};
      Io.log(((log+self.verbose) < 2) || ('[BTPC] Service: '+util.inspect(msg)));
      self.stats.op_brokerreq++;
      self.send(msg,function (reply) {
        self.pending=0;
        self.stats.op_brokerrep++;
        if (reply.status=='EINVALID') {
          // Not a valid reply, communication error or wrong server.
          self.stats.op_error++;
          self.log('[BHPC] Error: invalid');                          
        } else if (reply.status!='ENOENTR') {
            /*
             ** We can get more than one message contained in the reply,
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


netConnection.prototype.start = function (callback) {
  var self=this;
  Io.log(((log+self.verbose)<2)||('[BTPC] Starting.'));
  if (this.mode==Mode.TWOCHAN) {
    this.server.listen(0, function() {
      // Get random listener port
      self.log('[BTPC] Listening on port ' + self.server.address().port+' in mode '+self.mode+
             (self.keepalive?' KEEPALIVE':''));
      self.my_ipport=self.server.address().port;
      if (callback) callback();
      self.ready=true;
    });
    this.server.on('error',function (e) {
      self.log('[BTPC] Server error on port ' + self.server.address().port+': '+e);  
    });
  } 
  // Receive message replies from broker in TWOCHAN mode
  this.watchdog(1000);
  if (this.mode==Mode.ONECHAN) {
    this.service(this.interval);
    if (callback) callback();
  }
}

netConnection.prototype.status = function () {
  return this._status;
}

netConnection.prototype.stop = function (callback) {
  Io.log(((log+this.verbose)<2)||('[BTPC] Stopping.'));
  Sch.RemoveTimer('BTPC Watchdog');
  Sch.RemoveTimer('BTPC Service');
  this._status = Net.Status.STD_UNKNOWN;
  if (callback) callback();
}

netConnection.prototype.watchdog = function (interval) {
  var self=this;
  // Watchdog
  Sch.AddTimer(interval,'BTPC Watchdog',function () {
    self.alive();
  });
};

module.exports = {
    Mode:Mode,
    /**
     *
     * @param hostport
     * @param srv_ip
     * @param srv_ipport
     * @param [my_ip]
     * @param [my_ipport]
     * @returns {netConnection}
     * @constructor
     */
    /**
     *  typeof options = {hostport,srv_ip,srv_ipport,my_ip?,my_ipport?,mode?,verbose?} 
     */
    Connection: function(options) {
        var obj = new netConnection(options);
        Object.preventExtensions(obj);
        return obj;
    }
};
