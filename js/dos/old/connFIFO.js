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
 **    $CREATED:     31-10-16 by sbosse.
 **    $VERSION:     1.1.4
 **
 **    $INFO:
 **
 * ====================================================================
 * DOS: Broker connection module 
 * Client, FS FIFO connection
 *
 * Data transfer: JSON
 * ====================================================================
 *
 * Two unidirectional FIFOs are used for bidirectional client-server communication
 * There is one shared public channel request link, and multiple private P2P client-server links (FIFO pair).
 * Clients writing initially to the request channel to get a free private channel from the server.
 * Note: All clients simultaneously requesting a channel will receive multiple replies for different clients!
 * A FIFO channel is shared by all participants!
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
var Fs = require('fs');

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

// tyoeof options = {hostport,path,channel,router,verbose?}
var netConnection = function(options) {
    /*
    ** Broker
     */
    var self=this;
    this.path=options.path;                 // FIFO FS path [optionally including channel number]
    this.channel=options.channel;           // FIFO channel [optional]
    this.srv_port=undefined;            // Broker host server RPC port (== host node port), returned by ALIVE request
    this.hostport=options.hostport;             // Public communication Net.Port == Host port
    this.status = Net.Status.STD_UNKNOWN;
    this.verbose=options.verbose||0;
    this.mode=Mode.TWOCHAN;
    this.keepalive=true;
    this.enabled=false;
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
    this.receiver=undefined;
    this.socket=undefined;
    
    this.warned=0;
    this.ready=false;
    this.router=options.router;
    // Transfer of multi-part messages?
    this.multipart=true;
    this.rid=0;
    this.request_id=function (){var i=this.rid;this.rid=(this.rid+1)%65536;return i};
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
    };
    Io.log(((log+this.verbose)<2)||('[BFIC] ALIVE, current status: '+this.status));
    this.rpccon.stats.op_alive++;

    this.request(msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BFIC] ALIVE status: STATUS: ' + reply.status));
        Io.log(((log+self.verbose)<2)||('[BFIC] ALIVE data: ' + reply.data));
        if (reply.status!='EOK')  {
          if (self.verbose>=0 && (self.status==Net.Status.STD_OK||self.status==Net.Status.STD_UNKNOWN))
            Io.out('[BFIC] ALIVE! Not connected to broker '+self.path+':'+self.channel+' ['+
                 Net.Print.port(self.srv_port)+ ']');                
          self.status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<2)||('[BFIC] ALIVE problem with request ['+
                  self.path+':'+self.channel+']: ' + e.message));
        }
        /*
        ** Reply must contain the broker host server port.
        */
        if (reply.data && String.length(reply.data)==(Net.PORT_SIZE*2)) {
          var buf=Buf.Buffer(reply.data);
          self.srv_port=Buf.buf_get_port(buf);
          if (self.verbose>0 && (self.status!=Net.Status.STD_OK || self.waiting))
            Io.out('[BFIC] ALIVE! Connected to broker '+self.path+':'+self.channel+' ['+
                            Net.Print.port(self.srv_port)+ '] in mode '+
                            self.mode+
                            (self.keepalive?' KEEPALIVE':''));
          self.status=Net.Status.STD_OK;
          self.waiting=false;
        }
        else {
            if (self.verbose>0 && (self.status==Net.Status.STD_OK||self.status==Net.Status.STD_UNKNOWN)) 
                Io.out('[BFIC] ALIVE! Not connected to broker '+self.path+':'+self.channel+' ['+
                            Net.Print.port(self.srv_port)+ ']');                
            Io.log(((log+self.verbose)<1)||('[BFIC] ALIVE returned invalid data: '+reply.data+', '+
                                            self.path+':'+self.channel));
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
      xname:xname
    };
    Io.log(((log+this.verbose)<2)||('[BFIC] ASK: ' + xname));

    this.rpccon.stats.op_ask++;

    this.request(msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BFIC] ASK status: '+xname+' STATUS: ' + reply.status));
        if (reply.status!='EOK') {
          self.status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<2)||('[BFIC] ASK problem with request ['+
                  self.path+':'+self.channel+']: ' + e.status));   
        } else {   
          var buf=Buf.Buffer();
          Io.log(((log+self.verbose)<2)||('[BFIC] ASK data: ' + reply.data));
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
    this.enabled=true;
    function receiver (i) {
      var chI, chO,
          pathI=self.path+i+'O',
          pathO=self.path+i+'I';
      if (!Fs.existsSync(pathI)) {
        Io.out('[BFIC] Cannot open ' + pathO+': not existing!');          
        return;
      }
      if (!Fs.existsSync(pathI)) {
        Io.out('[BFIC] Cannot open ' + pathI+': not existing!');          
        return;
      }
      chO=Fs.createWriteStream(pathO);
      self.socket=chO;
      Io.log(((log+self.verbose)<2)||('[BFIC] Connected on ' + pathO));
//process.exit();
      if (callback) callback();

      function listen () {            
        Io.out('[BFIC] Listening on ' + pathI+' in mode '+self.mode+' '+(self.keepalive?'KEEPALIVE':''));
        chI=Fs.createReadStream(pathI);
        self.receiver=chI;
        chI.on('open',function () {
          Io.log(((log+self.verbose)<2)||('[BFIC] Connected on ' + pathI));
        });
        chI.on('close',function () {
          Io.log(((log+self.verbose)<2)||('[BFIC] Disconnect on ' + pathI));
          self.receiver=undefined;
        });
        chI.on('data',function (chunk) {
          var part,parts,data,callback,reply;
          Io.log(((log+self.verbose)<2)||('[BFIC] Received: ' + chunk.length));
          data=chunk.toString('ascii', 0, chunk.length);

          Io.log(((log+self.verbose)<2)||('[BFIC] Received: ' + data));
          parts=Conn.splitData(data);
          if (self.last) parts[0]=self.last+parts[0];
          if (Array.last(parts) != '') self.last=Array.last(parts); else self.last=undefined;

          // console.log(parts)

          for (part in parts) {
            if (parts[part]=='') continue;
            Io.log(((log+self.verbose)<2)||('[BFIC] Servicing part ' + parts[part]));
            reply = JSON.parse(parts[part]);
            if (self.multipart) Conn.decode(reply);

            if (reply.rid!=undefined && self.requests[reply.rid]) {
              // reply scheduling
              Io.log(((log+self.verbose)<3)||('[BFIC] Servicing rid ' + reply.rid));
              callback=self.requests[reply.rid];
              if (callback) {
                self.requests[reply.rid]=undefined;
                callback(reply);
              }
            }
          }
        });  
      }
      listen();
    }
    try {receiver(this.channel)} catch (e) {Io.out('[BFIC] Error: '+e)};
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
       xname:xname,
      xvalue:xval
    };
    Io.log(((log+this.verbose)<2)||('[BFIC] NOTIFY: ' + path));
    this.rpccon.stats.op_ask++;

    this.request(msg,
      function(reply) {
        Io.log(((log+self.verbose)<2)||('[BFIC] NOTIFY status: '+path+' STATUS: ' + reply.status));
        if (callback && reply.status=='EOK') Sch.ScheduleCallback([callback]);
        else {
          self.status=Net.Status.STD_IOERR;
          Io.log(((log+self.verbose)<1)||('[BFIC] NOTIFY problem with request ['+
                  self.path+':'+self.srv_channel+']: '+reply.status));    
        }
    });
};


/*
** CLIENT
 */
/** Send a request to the broker
*/
netConnection.prototype.request = function(msg,callback) {
  var data, socket,
      reuse=true,
      self=this;
  
  if (msg.rid==undefined) msg.rid=this.request_id();
  if (this.multipart) Conn.encode(msg);
  
  Io.log(((log+self.verbose)<1)||('[BFIC] Request: '+util.inspect(msg)));
  // Register callback
  self.requests[msg.rid]=callback;
//console.log('REG '+  msg.rid); console.log(msg);
  
  data = JSON.stringify(msg);
  if (this.multipart) this.socket.write(data+Conn.EOM);
  else this.socket.write(data);

};


/** Main entry for broker requests with JSON interface. Called by router. 
 *  msg: JSON 
 *  callback : function (reply:JSON)
 */
netConnection.prototype.send = function (msg,callback) {
  var self=this;
  // console.log(msg)  
  this.request(msg,
    function(reply) {
//console.log('EXEC '+reply.rid); //console.log(reply)
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
  if (this.socket) this.socket.end();  
  if (this.receiver) this.receiver.close();  
}


module.exports = {
    Mode:Mode,
    /**
     *
     * @param hostport
     * @returns {netConnection}
     * @constructor
     */
    /**
     ** tyoeof options = {hostport,path,channel,router,verbose?}
     */
    Connection: function(options) {
        var obj = new netConnection(options);
        Object.preventExtensions(obj);
        return obj;
    }
};
