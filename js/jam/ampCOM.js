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
 **    $INITIAL:     (C) 2006-2022 bLAB
 **    $CREATED:     09-02-16 by sbosse.
 **    $RCS:         $Id: ampCOM.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.16.1
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) - Common Types and Utils
 **
 **
 **
 **    $ENDOFINFO
 */
 
var options = {
  debug:{},
  magic: 0x6dab,              // start of an AMP message (16bit)
  peekIP: '134.102.22.124',   // used by getnetworkip, must be an HTTP server
  localhost : 'localhost',    // default name for localhost
}

var Comp = Require('com/compat');
var Dns = Require('dns');

// Channel mode flags
var AMMode = {
    AMO_UNICAST: 1,       // P2P
    AMO_MULTICAST: 2,     // P2N
    AMO_STATIC: 4,        // 
    AMO_BUFFER: 8,        // Transfer buffer data
    AMO_OBJECT: 16,       // Transfer objects instead of buffer data
    AMO_COMPRESS: 32,     // Compress data
    AMO_SERVER: 64,       // This is HTTP server mode
    AMO_CLIENT: 128,      // This is HTTP client mode
    AMO_ONEWAY:256,       // Other side can be reache dw/o link negotiation
    print: function (m) {
      var s='',sep='';
      if (m & AMMode.AMO_UNICAST) s += (sep+'UNI'),sep='|';
      if (m & AMMode.AMO_MULTICAST) s += (sep+'MUL'),sep='|';
      if (m & AMMode.AMO_STATIC) s += (sep+'STA'),sep='|';
      if (m & AMMode.AMO_BUFFER) s += (sep+'BUF'),sep='|';
      if (m & AMMode.AMO_OBJECT) s += (sep+'OBJ'),sep='|';
      if (m & AMMode.AMO_COMPRESS) s += (sep+'ZIP'),sep='|';
      if (m & AMMode.AMO_CLIENT) s += (sep+'CLI'),sep='|';
      if (m & AMMode.AMO_SERVER) s += (sep+'SRV'),sep='|';
      if (m & AMMode.AMO_ONEWAY) s += (sep+'ONE'),sep='|';
      return s;
    }
}

// Message type
var AMMessageType = {
      AMMACK:0,
      AMMPING:1,
      AMMPONG:2,
      AMMLINK:3,
      AMMUNLINK:4,
      AMMRPCHEAD:6, // Header followed by multiple data requests
      AMMRPCDATA:7,
      // Broker Rendezvous support
      AMMCONTROL:8,
      AMMRPC:9,   // Header + data in one message
      AMMCOLLECT:10,   // Collect messages
      AMMRPCHEADDATA:11, // Header with embedded data
 
      // Port Scan for external Run Server - returns AMP info
      AMMSCAN : 12,
      AMMINFO : 13,

      print:function(op) {
          switch (op) {
              case AMMessageType.AMMACK: return "AMMACK";
              case AMMessageType.AMMPING: return "AMMPING";
              case AMMessageType.AMMPONG: return "AMMPONG";
              case AMMessageType.AMMLINK: return "AMMLINK";
              case AMMessageType.AMMUNLINK: return "AMMUNLINK";
              case AMMessageType.AMMRPCHEAD: return "AMMRPCHEAD";
              case AMMessageType.AMMRPCHEADDATA: return "AMMRPCHEADDATA";
              case AMMessageType.AMMRPCDATA: return "AMMRPCDATA";
              case AMMessageType.AMMRPC: return "AMMRPC";
              case AMMessageType.AMMCOLLECT: return "AMMCOLLECT";
              // Rendezvous Broker Message
              case AMMessageType.AMMCONTROL: return "AMMCONTROL";
              case AMMessageType.AMMSCAN: return "AMMSCAN";
              case AMMessageType.AMMINFO: return "AMMINFO";
              default: return "Chan.AMMessageType?";
          }
      }

};

// Channel state
var AMState = {
      AMS_NOTINIT:1,          // AMP Not initialized conenction
      AMS_INIT:2,             // AMP Server started, but not confirmed
      AMS_READY:3,            // AMP Server initialized and confirmed (other end point not connected)
      AMS_NEGOTIATE:4,        // AMP Server intiialized, in negotiation state (other end point not connected)
      AMS_CONNECTED:5,        // AMP Other side connected
      AMS_AWAIT:6,            // AMP waits for event (pairing)
      AMS_NOTCONNECTED:10,    // AMP Other side not connected
      // Optional IP broker service
      AMS_RENDEZVOUS:7,       // Broker IP P2P rendezvous; starting
      AMS_REGISTERED:8,       // Broker IP P2P rendezvous; registered; expecting pairing
      AMS_PAIRING:9,          // Broker IP P2P rendezvous; now pairing; send punches until paired
      AMS_PAIRED:10,          // Broker IP P2P rendezvous; acknowldeged and paired -> NOTCONNECTED
      print:function(op) {
          switch (op) {
              case AMState.AMS_NOTINIT: return "AMS_NOTINIT";
              case AMState.AMS_INIT: return "AMS_INIT";
              case AMState.AMS_READY: return "AMS_READY";
              case AMState.AMS_NEGOTIATE: return "AMS_NEGOTIATE";
              case AMState.AMS_CONNECTED: return "AMS_CONNECTED";
              case AMState.AMS_AWAIT: return "AMS_AWAIT";
              case AMState.AMS_NOTCONNECTED: return "AMS_NOTCONNECTED";
              case AMState.AMS_RENDEZVOUS: return "AMS_RENDEZVOUS";
              case AMState.AMS_REGISTERED: return "AMS_REGISTERED";
              case AMState.AMS_PAIRING: return "AMS_PAIRING";
              case AMState.AMS_PAIRED: return "AMS_PAIRED";
              default: return "Chan.AMState?";
          }
      }
  };

/** Used by AMP messages (msg.cmd,msg.status)
 *
 */

// Standard Object Service
var STD_FIRST_COM = 1000;
var STD_LAST_COM = 1999;
var STD_FIRST_ERR = (-STD_FIRST_COM);
var STD_LAST_ERR = (-STD_LAST_COM);

// System Process Server (incl. Agent Platform Manager)
var PS_FIRST_COM = 2200;
var PS_LAST_COM = 2299;
var PS_FIRST_ERR = (-PS_FIRST_COM);
var PS_LAST_ERR = (-PS_LAST_COM);

var Command = {
    /*
    ** Standard Commands
     */
    STD_MONITOR     : STD_FIRST_COM,
    STD_AGE         : (STD_FIRST_COM+1),
    STD_COPY        : (STD_FIRST_COM + 2),
    STD_DESTROY     : (STD_FIRST_COM + 3),
    // Get agent or node info
    STD_INFO        : (STD_FIRST_COM + 4),
    STD_RESTRICT    : (STD_FIRST_COM + 5),
    // Get agent or node status
    STD_STATUS      : (STD_FIRST_COM + 6),
    STD_TOUCH       : (STD_FIRST_COM + 7),
    STD_GETPARAMS   : (STD_FIRST_COM + 8),
    STD_SETPARAMS   : (STD_FIRST_COM + 9),
    STD_NTOUCH      : (STD_FIRST_COM + 10),
    STD_EXIT        : (STD_FIRST_COM + 11),
    STD_RIGHTS      : (STD_FIRST_COM + 12),
    STD_EXEC        : (STD_FIRST_COM + 13),
    STD_LOCATION    : (STD_FIRST_COM + 20),
    STD_LABEL       : (STD_FIRST_COM + 21),

    /*
    ** Agent Process Control
    */
    PS_STUN         : (PS_FIRST_COM),     // Kill a process/ create a snapshot
    PS_MIGRATE      : (PS_FIRST_COM+1),   // Execute a process from a snapshot after migration (->next+)
    PS_EXEC         : (PS_FIRST_COM+2),   // Execute a process from a snapshot (->next)
    PS_WRITE        : (PS_FIRST_COM+4),   // Store a process class template
    PS_READ         : (PS_FIRST_COM+5),   // Get a process class template
    PS_CREATE       : (PS_FIRST_COM+6),   // Create a process from a template and execute
    PS_FORK         : (PS_FIRST_COM+7),   // Fork a process from a running process
    PS_SIGNAL       : (PS_FIRST_COM+8),   // Send a signal to a process

};

var Status = {
    STD_OK:0,
    STD_CAPBAD      :   STD_FIRST_ERR,
    STD_COMBAD      :  (STD_FIRST_ERR-1),
    STD_ARGBAD      :  (STD_FIRST_ERR-2),
    STD_NOTNOW      :  (STD_FIRST_ERR-3),
    STD_NOSPACE     :  (STD_FIRST_ERR-4),
    STD_DENIED      :  (STD_FIRST_ERR-5),
    STD_NOMEM       :  (STD_FIRST_ERR-6),
    STD_EXISTS      :  (STD_FIRST_ERR-7),
    STD_NOTFOUND    :  (STD_FIRST_ERR-8),
    STD_SYSERR      :  (STD_FIRST_ERR-9),
    STD_INTR        :  (STD_FIRST_ERR-10),
    STD_OVERFLOW    :  (STD_FIRST_ERR-11),
    STD_WRITEPROT   :  (STD_FIRST_ERR-12),
    STD_NOMEDIUM    :  (STD_FIRST_ERR-13),
    STD_IOERR       :  (STD_FIRST_ERR-14),
    STD_WRONGSRV    :  (STD_FIRST_ERR-15),
    STD_OBJBAD      :  (STD_FIRST_ERR-16),
    STD_UNKNOWN     :  (STD_FIRST_ERR-17),
    RPC_FAILURE     : -1,
    BUF_OVERFLOW    : -2,
}

var amp={
  AMMessageType:AMMessageType,
  AMState:AMState
};

/** Search a channel that is connected to node 'destnode'
 *
 */
function lookupNode(node,destnode) {
  var chan,url;
  if (node.connections.ip && node.connections.ip.lookup) {
    url=node.connections.ip.lookup(destnode);
    if (url) return {
      chan:node.connections.ip,
      url:url,
      link:node.connections.ip.routingTable[url]
    };
  }
}


/*************************
** IP UTILS
*************************/
function isLocal(addr) {
  return addr=='localhost'||
         addr=='127.0.0.1'
}
function isIpAddr(addr) {
  return (/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/.test(addr))
}
/*  typeof @url = "<proto>://<domain>:<ipport>" | "<domain>:<ipport>" | 
*                 "<name>:<ipport>" | "<ip>:<ipport>" | "<ip>:<portname>" | "<ipport>"
 *  and @ipport = (1-65535) | "*" 
 *  and @port = string 
 */
function parseUrl(url) {
  if (!isNaN(Number(url)) || url=='*') return {
    proto:  undefined,
    address:   undefined,
    port:   url,
    param:  undefined,
    value:  undefined    
  }
  var tokens = url.match(/((http|https|udp|tcp):\/\/)?([a-zA-Z0-9_\.\-]+):(\[?[a-zA-Z0-9]+\]?|\*)(\?([a-zA-z0-9]+)=([a-zA-Z0-9:]+))?/)
  if (!tokens)
    tokens   = url.match(/((http|https|udp|tcp):\/\/)?([a-zA-Z0-9_\.\-]+)/);
  return  {
    proto:  tokens[2],
    address:   tokens[3],
    port:   tokens[4],
    param:  tokens[6],
    value:  tokens[7]
  }
}

function url2addr(url,defaultIP,callback) {
  var addr={address:defaultIP||options.localhost,port:undefined},
      parts = parseUrl(url);
  if (parts.proto)   addr.proto=parts.proto;
  if (parts.address) addr.address=parts.address;
  if (parts.port && parts.port!='*')
    addr.port=!isNaN(Number(parts.port))?Number(parts.port):parts.port;
  if (parts.param) { 
    addr.parameter={};
    addr.parameter[parts.param]=parts.value;
  }

  if (!isLocal(parts.address) && !isIpAddr(parts.address)) {
    // <domain>:<ipport>
    // needs dns lookup with callback (async)
    if (Dns) 
      Dns.lookup(parts.address, function (err,_addr) {
        if (!err) addr.address=_addr;
        if (callback) callback(addr);
      }); 
    else if (callback) callback(addr);
    return addr;
  }
  if (callback) callback(addr);
  else return addr;
};

function params(po) {
  var s='?',sep='';
  for(var p in po) {
    s += (sep+p+'='+po[p]);
    sep='&';
  }
  return s;
}
function addr2url(addr,noproto) {
  return (!noproto && addr.proto?(addr.proto+'://'):'')+
         (isLocal(addr.address)?options.localhost:addr.address)+':'+
         (addr.port?addr.port:'*')+
         (!noproto && addr.parameter?params(addr.parameter):'')
};

function obj2url(obj) {
  if (!obj) return '*';
  if (obj.name && !obj.address) return obj.name+':*';
  if (!obj.address) return '*';
  return (isLocal(obj.address)?options.localhost:obj.address)+':'+(obj.port?obj.port:'*')
};

function addrequal(addr1,addr2) {
  return ipequal(addr1.address,addr2.address) && addr1.port==addr2.port;
}

function addrempty(addr) {
  return !(addr && addr.address && addr.port);
}

function resolve (url) {return addr2url(url2addr(url)) }

function ipequal(ip1,ip2) {
  if (ip1==undefined || ip2==undefined) return false;
  else if ((Comp.string.equal(ip1,'localhost') || Comp.string.equal(ip1,'127.0.0.1')) &&
           (Comp.string.equal(ip2,'localhost') || Comp.string.equal(ip2,'127.0.0.1'))) return true;
  else return ip1==ip2;
}

// Use remote TCP connection to get this host IP (private address if behind NAT) 
var ipnet = Require('net');
var myip;
function getNetworkInterfaces() {
  var results = null;
  try { 
    var networkInterfaces  = require('os').networkInterfaces;
    var nets = networkInterfaces();
    for (var name of Object.keys(nets)) {
        for (var net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                results=results||{};
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
  } catch (e) {};
  return results
}
function getNetworkIP(server,callback) {
  var socket;
  // 0. Use user defined environment variable
  try {
    if (typeof process != 'undefined' &&
        process.env &&
        process.env['HOSTIP'])
        return callback(undefined,process.env['HOSTIP']);
  } catch (e) {
  
  }
  // 1. Try to connect external HTTP server to get our public IP
  if (!ipnet) return callback('Not supported','error');
  if (myip) return callback(undefined,myip);
  if (!server) server={address:options.peekIP,port:80};
  socket = ipnet.createConnection(server.port, server.address);
  socket.on('connect', function() {
    myip=socket.address().address;
    callback(undefined, socket.address().address);
      socket.end();
  });
  socket.on('error', function(e) {
    // Try to get our (local) IP from network interface information
    var results = getNetworkInterfaces();
    if (!results)
      return callback(e, 'error');
    else {
      for(var i in results) return callback(undefined,results[i]);
    }
  });
}


function doUntilAck(interval, fn, ack, arg) {
  if (ack()) return;
  fn(arg);
  return setTimeout(function() {
    doUntilAck(interval, fn, ack, arg);
  }, interval);  
}


module.exports = {
  AMMode:AMMode,
  AMMessageType:AMMessageType,
  AMState:AMState,
  doUntilAck:doUntilAck,
  getNetworkIP:getNetworkIP,
  amp:amp,
  options:options,
  addrempty:addrempty,
  addrequal:addrequal,
  addr2url:addr2url,
  ipequal:ipequal,
  isLocal:isLocal,
  lookupNode:lookupNode,
  obj2url:obj2url,
  resolve:resolve,
  url2addr:url2addr,
  Command:Command,
  Status:Status,
}
