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
 * Notes:
 * Superfluous? All response callback computations wrapped by scheduler callbacks to avoid main thread preemption!
 * Is event queuing always guaranteed in JS?
 **
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
 * { rpc:'trans',hostport:BB,tid:NN, ipport:NN,
 *   data: {
 *     header:EABC
 *     data:EABC
 *   }
 * }
 *
 * REPLY:
 * 
 * {status} |
 * { status,
 *   data: { header:EABC, data:EABC}
 * }
 *
 * REQUEST (get RPC messages from broker)
 * -------
 *    
 * {rpc:'request',hostport:BB,ipport:NN}
 *
 * REPLY:
 *
 * { status,
 *   data: [
 *     { hostport: BB,
 *       sendport: BB,
 *       operation : Rpc.Operation,
 *       tid: NN,
 *       header:EABC, data:EABC},
 *     ..
 *   ]}
 *
 * REPLY
 * -----
 * {rpc:'reply',hostport:BB,sendport:BB,
 *  tid:NN, ipport:NN,
 *  data:{header:EABC,data:EABC}
 * }
 *
 * IAMHERE
 * ------- 
 * {type:'iamhere',hostport:BB,srvport:BB}  
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
 * {status, xname:SS, xvalue:SS}
 *
 * NOTIFY
 * ---
 * {type:'notify',hostport:BB,xname:SS,xvalue:SS}  
 * =>
 *
 * REPLY:
 * 
 * {status}
 *
 **    $ENDOFINFO
 */
"use strict";
var log = 0;


var util = require('util');
var net = require('net');

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

// tyoeof options = {hostport,srv_ip,srv_ipport,my_ip?,my_ipport?,router,mode?,verbose?}
var netConnection = function(options) {
    /*
    ** Broker
     */
    var self=this;
    this.srv_ip=options.srv_ip;                 // URL IP
    this.srv_ipport=options.srv_ipport;         // URL:port IP
    this.srv_port=undefined;            // Broker host server RPC port (== host node port), returned by ALIVE request
    this.hostport=options.hostport;             // Public communication Net.Port == Host port
    this.status = Net.Status.STD_UNKNOWN;
    this.my_ip=options.my_ip||(options.srv_ip=='127.0.0.1'?options.srv_ip:'localhost');
    this.my_ipport=options.my_ipport||0;
    this.verbose=options.verbose||0;
    this.mode=options.mode||Mode.ONECHAN;
    this.keepalive=(options.keepalive==undefined?true:options.keepalive);
    
    /*
     ** Pending broker request?
     */
    this.pending=0;
    this.waiting=false;
    this.rpccon=Rpc.RpcConn(
        self.conn_port,
        undefined,
        /*
         ** Rpcio Deliver Operation
         */
        function() {
            return self.status==Net.Status.STD_OK;
        }
    );
    this.requests=[];
    this.last=undefined;
    
    // Service replies from broker
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
            
            // if (reply.rid!=undefined && self.requests[reply.rid]) {
            if ((!reply.rpc || reply.rpc=='reply') && reply.tid!=undefined && self.requests[reply.tid]) {
              // reply scheduling
              // Io.log(((log+self.verbose)<3)||('[BTPC] Servicing rid ' + reply.rid));
              Io.log(((log+self.verbose)<3)||('[BTPC] Servicing tid ' + reply.tid));
              // callback=self.requests[reply.rid];
              callback=self.requests[reply.tid];
              if (callback) {
                //self.requests[reply.rid]=undefined;
                self.requests[reply.tid]=undefined;
                callback(reply);
              }
            } else if (reply.type && reply.type=='broadcast') {
              // Something for the router, e.g., LOOKUP
              self.router.parse(reply); 
              // console.log(reply)
            }
          }
        });
      });

    if (this.mode==Mode.ONECHAN) {
      this.service = function (options,callback) {
        var msg;
        /*
         ** Check for available TRANS messages for THIS application identified by the app. port (name..) ...
         ** The broker request is blocked until RPC transactions are available or a timeout occurred.
         */
        msg = {rpc:'request',
               hostport:self.multipart?Net.port_to_str(options.hostport):options.hostport, 
               timeout:options.timeout};
        Io.log(((log+self.verbose) < 3) || ('[BTPC] Service: '+util.inspect(msg)));
        self.send(msg,callback);
      }  
    }
    this.socket=undefined;
    this.warned=0;
    this.ready=false;
    this.router=options.router;
    // Transfer of multi-part messages?
    this.multipart=true;
    // this.rid=0;
    this.request_id=Rpc.transaction_id;
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
    Io.log(((log+this.verbose)<2)||('[BTPC] ALIVE, current status: '+this.status));

    this.rpccon.stats.op_alive++;

    this.request(self.srv_ip,self.srv_ipport,msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BTPC] ALIVE status: STATUS: ' + reply.status));
        Io.log(((log+self.verbose)<2)||('[BTPC] ALIVE data: ' + reply.data));
        if (reply.status!='EOK')  {
          if (self.verbose>=0 && (self.status==Net.Status.STD_OK||self.status==Net.Status.STD_UNKNOWN))
            Io.out('[BTPC] ALIVE! Not connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                 Net.Print.port(self.srv_port)+ ']');                
          self.status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<2)||('[BTPC] ALIVE problem with request ['+
                self.srv_ip+':'+self.srv_ipport+']: ' + e.message));
        }
        /*
        ** Reply must contain the broker host server port.
        */
        if (reply.data && String.length(reply.data)==(Net.PORT_SIZE*2)) {
          var buf=Buf.Buffer(reply.data);
          self.srv_port=Buf.buf_get_port(buf);
          if (self.verbose>0 && (self.status!=Net.Status.STD_OK || self.waiting))
            Io.out('[BTPC] ALIVE! Connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                            Net.Print.port(self.srv_port)+ '] in mode '+
                            self.mode+
                            (self.keepalive?' KEEPALIVE':''));
          self.status=Net.Status.STD_OK;
          self.waiting=false;
        }
        else {
            if (self.verbose>0 && (self.status==Net.Status.STD_OK||self.status==Net.Status.STD_UNKNOWN)) 
                Io.out('[BTPC] ALIVE! Not connected to broker '+self.srv_ip+':'+self.srv_ipport+' ['+
                            Net.Print.port(self.srv_port)+ ']');                
            Io.log(((log+self.verbose)<1)||('[BTPC] ALIVE returned invalid data: '+reply.data+', '+self.srv_ip+':'+self.srv_ipport));
            self.status=Net.Status.STD_IOERR;
       }
       if (callback) {
          Sch.ScheduleCallback([callback,self.status]);
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
    this.rpccon.stats.op_ask++;

    this.request(self.srv_ip,self.srv_ipport,msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BTPC] ASK status: '+xname+' STATUS: ' + reply.status));
        if (reply.status!='EOK') {
          self.status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<2)||('[BTPC] ASK problem with request ['+
                  self.srv_ip+':'+self.srv_ipport+']: ' + e.status));   
        } else {   
          var buf=Buf.Buffer();
          Io.log(((log+self.verbose)<2)||('[BTPC] ASK data: ' + reply.data));
          Buf.buf_of_hex(buf,reply.data);
          Sch.ScheduleCallback([callback,Buf.buf_get_string(buf)]);
        }
    });
};


/** Initialize connection module
 *
 */
netConnection.prototype.init = function (callback) {
    var self=this;
    if (this.mode==Mode.TWOCHAN) {
      this.server.listen(0, function() {
        // Get random listener port
        console.log('[BTPC] Listening on port ' + self.server.address().port+' in mode '+self.mode+
                    (self.keepalive?' KEEPALIVE':''));
        self.my_ipport=self.server.address().port;
        if (callback) callback();
        self.ready=true;
      });
      this.server.on('error',function (e) {
        console.log('[BTPC] Server error on port ' + self.server.address().port+': '+e);  
      });
    } else {
      if (callback) callback();    
    }
    this.waiting=true;
    Sch.AddTimer(1000,'Broker Connection Monitor',function () {
      self.alive();
    });
};

netConnection.prototype.log = function (v) {log=v};

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
    Io.log(((log+this.verbose)<2)||('[BTPC] NOTIFY: ' + path));
    this.rpccon.stats.op_ask++;

    this.request(self.srv_ip,self.srv_ipport,msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BTPC] NOTIFY status: '+path+' STATUS: ' + reply.status));
        if (callback && reply.status=='EOK') Sch.ScheduleCallback([callback]);
        else {
          self.status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<1)||('[BTPC] NOTIFY problem with request ['+
                  self.srv_ip+':'+self.srv_ipport+']: '+reply.status));    
        }
    });
};


/*
** CLIENT
 */
/** Send a request to the broker
*/

netConnection.prototype.request = function(ip,ipport,msg,callback) {
  var data, socket,
      reuse=true,
      self=this;

  //if (msg.rid==undefined) msg.rid=this.request_id();
  if (msg.tid==undefined) msg.tid=this.request_id();
  if (this.mode!=Mode.ONECHANN) {
    if (msg.ipport==undefined) msg.ipport=this.my_ipport;
    if (msg.ip==undefined) msg.ip=this.my_ip;
  }
  if (this.multipart) Conn.encode(msg);
  if (!this.keepalive) msg.nokeepalive=true;
  
  Io.log(((log+self.verbose)<2)||('[BTPC] Request: '+util.inspect(msg)));
  // Register callback
  // self.requests[msg.rid]=callback;
  self.requests[msg.tid]=callback;
//console.log('REG '+  msg.rid); console.log(msg);
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
      }
    });
    this.socket=socket;
    socket.on('data', function(data) {
      var callback,reply,parts,part;
      // ONECHAN mode only !!!
      // Check EWOULDBLOCK, queue callback
      if (data=='') return; 
      Io.log(((log+self.verbose)<2)||('[BTPC] Reply: '+data));
      if (self.multipart) parts=Conn.splitData(data);
      else parts=[data];

      if (self.last) parts[0]=self.last+parts[0];
      if (Array.last(parts) != '') self.last=Array.last(parts); else self.last=undefined;
      for (part in parts) {
        if (parts[part]=='') continue;
        reply = JSON.parse(parts[part]);
//console.log(reply)
        if (self.multipart) Conn.decode(reply);
        self.warned=0;
        // if (reply.status!='EWOULDBLOCK' && reply.rid!=undefined) { 
        if (reply.status!='EWOULDBLOCK' && reply.tid!=undefined) { 
          // Callback already registered
//console.log('CALL '+  reply.rid);
          // callback=self.requests[reply.rid];
          callback=self.requests[reply.tid];
          if (callback) {
            //self.requests[reply.rid]=undefined;
            self.requests[reply.tid]=undefined;
            callback(reply);          
          }
        //} else if (reply.rid) self.requests[reply.rid]=undefined;
        } else if (reply.tid) self.requests[reply.tid]=undefined;
      }
    });
    socket.on('error', function(e) {
      // console.log('Connection closed');
      if (self.warned<2) {
        console.log('[BTPC] Communication error to ' +ip+':'+ipport+(self.warned==1?' (more)':'')+' : '+e);
        self.warned++;
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
};


/** Main entry for broker requests with JSON interface. Called by router. 
 *  msg: JSON 
 *  callback : function (reply:JSON)
 */
netConnection.prototype.send = function (msg,callback) {
  var self=this;
  // console.log(msg)  
  this.request(this.srv_ip,this.srv_ipport,msg,
    function(reply) {
//console.log('EXEC '+reply.rid); 
      // console.log(reply)
      if (reply.status!='EOK') callback({status:reply.status})
      else if (reply.data) {
        // console.log(reply)
        if (self.mode==Mode.ONECHANN)
          callback(reply);
        else {
          self.router.parse(reply); 
          if (callback) callback({status:reply.status})
        }
      }
      else if (callback) callback(reply);        
    });
}

netConnection.prototype.stop = function () {
  Sch.RemoveTimer('Broker Connection Monitor');  
}


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
