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
 **    $INITIAL:     (C) 2006-2020 bLAB
 **    $CREATED:     31-05-20 by sbosse.
 **    $RCS:         $Id: ampHTTPS.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.14.7
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) over HTTPS
 **  Only Mulitcast IP(*) mode is supported!
 **
 **  Events out: 'error','route-'
 **
 **  TODO: Garbage collection
 **
 **  Requires cert.pem and key.pem strings (options.pem.key/cert) and builtin https/crypto!
 **  Letsencrypt files:
 **      SSLCertificateFile        /etc/letsencrypt/live/<domain>/fullchain.pem
 **      SSLCertificateKeyFile     /etc/letsencrypt/live/<domain>/privkey.pem
 **
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');
var Bas64 = Require('os/base64');
var Sec = Require('jam/security')
var JSONfn = Require('jam/jsonfn')

var options = {
  version:"1.14.7",
}

var COM = Require('jam/ampCOM'),
    AMMode=COM.AMMode,
    AMMessageType=COM.AMMessageType,
    AMState=COM.AMState,
    amp=COM.amp,
    options=COM.options,
    url2addr=COM.url2addr,
    addr2url=COM.addr2url,
    addrequal=COM.addrequal,
    resolve=COM.resolve,
    ipequal=COM.ipequal,
    isLocal=COM.isLocal,
    getNetworkIP=COM.getNetworkIP,
    pem=COM.options.pem,
    magic=COM.options.magic;

var debug = false;

module.exports.current=function (module) { current=module.current; Aios=module; };

/*
** Parse query string '?attr=val&attr=val... and return parameter record
*/
function parseQueryString( url ) {
    var queryString = url.substring( url.indexOf('?') + 1 );
    if (queryString == url) return [];
    var params = {}, queries, temp, i, l;

    // Split into key/value pairs
    queries = queryString.split("&");

    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        if (temp[1]==undefined) temp[1]='true';
        params[temp[0]] = temp[1].replace('%20',' ');
    }

    return params;
}
/*
** Format a query string from a parameter record
*/
function formatQueryString (msg) {
  var path= '/?';
  path += "magic="+msg.magic;
  path += "&type="+AMMessageType.print(msg.type);
  if (msg.cmd) path += '&cmd='+msg.cmd;
  if (msg.tid) path += '&tid='+msg.tid;
  if (msg.port) path += '&port='+Net.port_to_str(msg.port);
  if (msg.timeout) path += '&timeout='+msg.timeout;
  if (msg.node) path += '&node='+msg.node.replace(' ','%20');
  if (msg.index) path += '&index='+msg.index;
  if (msg.secure) path += '&secure='+(msg.secure.length==8?Net.port_to_str(msg.secure):msg.secure);
  return path;
}

function msg2JSON(msg) {
  if (msg.port) msg.port=Net.port_to_str(msg.port);
  if (msg.msg && msg.msg.length) Comp.array.iter(msg.msg,function (msg) {
    if (msg.port) msg.port=Net.port_to_str(msg.port);
  });
  return JSONfn.stringify(msg);
}
function JSON2msg(data) {
  var msg=JSONfn.parse(data);
  if (msg.port) msg.port=Net.port_of_str(msg.port);
  if (msg.msg && msg.msg.length) Comp.array.iter(msg.msg,function (msg) {
    if (msg.port) msg.port=Net.port_of_str(msg.port);
  });
  return msg;
}

/** Get XML data
 *
 */
function getData(data) {
  if (data==undefined) return undefined;
  else if (data.val!='') return data.val;
  else return data.children.toString();
}

function is_error(data,err) {
  if (data==undefined) return true;
  if (err==undefined)
    return (data.length > 0 && Comp.string.get(data,0)=='E');
  else
    return (Comp.string.equal(data,err));
};

/** AMP port using HTTP
 *  ===================
 *
 *  No negotiation is performed. Data transfer can be fragmented.
 *  Each time a remote endpoint sends a GET/PUT request, we stall the request until
 *  a timeout occurs or we have to send data to the remote endpoint. A link is established. 
 *  The routing table is refreshed each time the same client send a
 *  GET/PUT request again. If the client do not send requests anymore after a timeout, it is considered to be 
 *  unlinked and the route is removed.
 * 
 * type amp.https = function (options:{pem?:{key,cert}, rcv:address,snd?:address,verbose?,logging?,out?:function,log?})
 */
var https;
var http = Require('http');

amp.https = function (options) {
  var self=this;
  this.proto = 'http';
  this.options = checkOptions(options,{});
  this.verbose = checkOption(this.options.verbose,0);


  if (global.TARGET!= 'browser' && !https) try {
    https=require('https');
  } catch (e) {
    throw 'amp.https: no https/crypto support ('+e+')';
  }
  
  this.dir  = options.dir;                          // attached to JAM port
  this.rcv  = options.rcv;                          // Local  HTTP Server Port; Server Mode 
  this.mode = AMMode.AMO_MULTICAST;                 // We can handle multiple links at once 
  this.node   = options.node;                       // Attached to this node

  if (options.rcv && options.rcv.address!='*' && options.rcv.port) this.mode |= AMMode.AMO_SERVER;
  else this.mode |= AMMode.AMO_CLIENT;

  if (!options.pem) this.options.pem=pem;

  if ((this.mode & AMMode.AMO_CLIENT)==0 && 
      (!this.options.pem || !this.options.pem.key || !this.options.pem.cert)) 
    throw "amp.https: no pem certificate and key provided like pem:{key,cert}";


  this.options.keepalive=checkOption(options.keepAlive,true);
  this.secure = this.options.secure;
  
  this.port = options.port||Net.uniqport();     // Connection Link Port (this side)
  this.id = Net.Print.port(this.port);
  // Stream socket; can be a process object!
  this.out = function (msg,async) {
    (async?Aios.logAsync:Aios.log)
      ('[AMP '+Net.Print.port(self.port)+
       (self.dir?(' '+Aios.DIR.print(self.dir)):'')+'] '+msg);
  }
  this.debug = function (msg) {
    Aios.logAsync
      ('[AMP '+Net.Print.port(self.port)+
       (self.dir?(' '+Aios.DIR.print(self.dir)):'')+'] '+msg);
  }
  this.err = function (msg,async) {
    (async?Aios.logAsync:Aios.log)
      ('[AMP '+Net.Print.port(self.port)+
        (self.dir?(' '+Aios.DIR.print(self.dir)):'')+'] Error: '+msg);
    throw 'AMP';
  }

  this.events = [];
  // typeof linkentry = {snd:address,tries:number,state:amstate,collect?,collecting?,msgqueue?:{} []} 
  this.links = {};
  this.count={rcv:0,snd:0,lnk:0,png:0};
  if (options.snd) {
    url=addr2url(options.snd,true);
    this.links[url]={snd:options.snd,tries:0,state:AMState.AMS_NOTCONNECTED,live:options.AMC_MAXLIVE};
    //this.out(url)
  }
  // Collector thread collecting messages from server (AMO_CLIENT mode)
  this.collector=undefined;
  
  this.logs=[];
  this.logging=options.logging||false;
  if (this.logging) {
    setInterval(function () { self.LOG('print') },5000);
  }
  this.index=0;
};

amp.https.prototype.LOG = amp.man.prototype.LOG;  
amp.https.prototype.checkState = amp.man.prototype.checkState;
amp.https.prototype.config = amp.man.prototype.config;
amp.https.prototype.emit = amp.man.prototype.emit;
amp.https.prototype.on = amp.man.prototype.on;
amp.https.prototype.handle = amp.man.prototype.handle;
amp.https.prototype.status = amp.man.prototype.status;

/** Acknowledge reply
 *
 */
amp.https.prototype.ack=function(snd,status) {
  this.response(snd,{type:AMMessageType.AMMACK,status:status||"EOK",
                  port:this.port,node:this.node?this.node.id:'*'});
}

/** Callback from ampMAN handler to inform about remote unlink event
 *
 */
amp.https.prototype.cleanup=function(url,keep) {
  // Cleanup link
  var obj=this.links[url];
  if (!obj) return;
  obj.state=AMState.AMS_NOTCONNECTED
  if (obj.collect) clearTimeout(obj.collect), obj.collect=undefined;
  if (obj.collecting) this.response(obj.collecting,{status:'ENOENTRY'}),obj.collecting=undefined;
  // Link was initiated on remote side
  // Remove link!
  if (!keep) {
    obj.snd={};
    this.links[url]=undefined;
  }
}

/** Collect request
 *
 */
amp.https.prototype.collect=function(snd) {
  var self=this,
      url=addr2url(snd,true),
      msg={type:AMMessageType.AMMCOLLECT,port:this.port,index:this.index++,magic:magic};
  if (this.links[url] && this.links[url].state==AMState.AMS_CONNECTED) 
    this.send(snd,msg,function (reply) {
      var err=is_error(reply);
      if (err) return; //  self.cleanup(url,true);
      if (reply.msg) Comp.array.iter(reply.msg,function (msg) {
        self.handle(msg,snd);
      });
      if (!self.links[url]) return; // unlinked?
      self.links[url].collect=setTimeout(function () {
        self.collect(snd); 
      },0);
    });
}
/** Service collect request
 *
 */
amp.https.prototype.collecting=function(msg,remote,response) {
  var url;
  if (this.verbose>2) this.debug('handle AMMCOLLECT from '+addr2url(remote));
  url=addr2url(remote,true); // ipport or remote.port??
  if (this.links[url]  && this.links[url].msgqueue && this.links[url].msgqueue.length) {
    this.response(response,{msg:this.links[url].msgqueue});
    this.links[url].msgqueue=[];
  } 
  else if (this.links[url]) this.links[url].collecting=response;
  else this.response(response,{status:'ENOENTRY'});
}

/** HTTP GET request to send a messageto the server broker returning data on reply.
 *
 * @param path
 * @param callback
 */
 
amp.https.prototype.get = function (snd,path,callback) {
    var body,req,
        self=this;
  
    if (this.verbose>2) this.debug('get '+addr2url(snd)+ path); 
    this.count.snd = this.count.snd + path.length;
    if (https) {
      req = https.request({
        host: snd.address,
        port: snd.port,
        path: path,
        method: 'GET',
        keepAlive: this.options.keepalive,
        headers: {
        }
      } , function(res) {
        if (self.verbose>2) self.debug('got '+addr2url(snd)+ path); 
        if (res.setEncoding != null) res.setEncoding('utf8');
        body = '';
        res.on('data', function (chunk) {
          body = body + chunk;
        });
        res.once('end', function () {
          self.count.rcv += body.length;
          if (callback) callback(body);
        });
      });
      req.once('error', function(err) {
        if (self.verbose) self.out('Warning: request to '+addr2url(snd)+' '+path+' failed: '+err,true);
        self.emit('error',err);
        if (callback) callback();
      });
      req.end();
    } else {
      // XHR Browser
      http.request({
        host: snd.address,
        port: snd.port,
        path: path,
        proto:'https',
        method: 'GET',
        headers: {
        }
      } , function(err,xhr,body) {
        if (err) {
          if (self.verbose) self.out('Warning: request to '+addr2url(snd)+' '+path+' failed: '+err,true);
          self.emit('error',err);
          if (callback) callback();
        } else {
          self.count.rcv += body.length;
          if (callback) callback(body);
        }
    });    
  }
};

/** Initialize AMP
 *
 */
amp.https.prototype.init = function(callback) { 
  if (callback) callback();
};

/** Negotiate a virtual communication link (peer-to-peer).
 *  In oneway mode only a destination endpoint is set and it is assumed the endpoint can receive messages a-priori!
 *
 * typeof @snd = address
 * typeof @callback = function
 * typeof @connect = boolean is indicating an initial connect request and not an acknowledge
 * typeof @key = private
 * typeof @response = object
 *
 * +------------+
 * VCMessageType (int16)
 * Connection Port (port)
 * Node ID (string)
 * // Receiver IP Port (int32)
 * +------------+
 *
 */
amp.https.prototype.link=function(snd,connect,key,response) {
    var self = this,
        msg,
        url;
    if (this.verbose>1) this.debug('amp.link: to '+addr2url(snd));
    
    // MULTICAST mode
    // Add new link to cache of links
    if (!snd) this.err('link: no destinataion set in MULTICAST mode');
    if (snd.parameter && snd.parameter.secure) key=snd.parameter.secure;
    url=addr2url(snd,true);
    if (!this.links[url] || !this.links[url].snd.address) {
      if (connect) snd.connect=true;
      this.links[url]={
        snd:snd,
        state:AMState.AMS_NOTCONNECTED,
        tries:0,
        connect:connect,
        live:options.AMC_MAXLIVE};
    }
    // Let watchdog handle connect request link messages
    if (!this.inwatchdog && connect)
        return this.watchdog(true);
    // if (this.verbose>1) this.out('send link '+Io.inspect(snd));
    msg={
      type:AMMessageType.AMMLINK,
      port:this.port,
      node:this.node?this.node.id:'*',
      index:this.index++,
      magic:magic,
      remote:snd.address,
    };
    if (key) msg.secure=key;

    this.count.lnk++;
    
    if (response)
      this.response(response,msg); 
    else this.send(snd,msg,function (reply) {
      if (is_error(reply)) return; // error
      // start message collector thread after first link reply!
      if ((self.mode & AMMode.AMO_CLIENT) && !self.links[url].collect) {
        self.links[url].collect=setTimeout(function () {
          self.collect(snd); 
        },0);
      }
      // handle reply
      self.handle(reply,snd);
    });
};

amp.https.prototype.ping=function(snd,response) {
    var self = this,msg={};

   
    msg.type=AMMessageType.AMMPING;
    msg.port=this.port;
    msg.index=this.index++;
    msg.magic=magic;
     
    if (this.verbose>1) this.debug('amp.ping'+(response?'in response':'')+': to '+addr2url(snd));

    this.count.png++;

    if (response)
      this.response(response,msg); 
    else this.send(snd,msg,function (reply) {
      if (is_error(reply)) return;   // error
      // handle reply
      self.handle(reply,snd);
    });
}

amp.https.prototype.pong=function(snd,response) {
    var self = this,msg={};

    msg.type=AMMessageType.AMMPONG;
    msg.port=this.port;
    msg.index=this.index++;
    msg.magic=magic;

    if (this.verbose>1) this.debug('amp.pong '+(response?'in response':'')+': to '+addr2url(snd));

    this.count.png++;

    if (response)
      this.response(response,msg); 
    else this.send(snd,msg,function (reply) {
        if (is_error(reply)) {
          self.emit('error',reply);
        }
    });
}

/** HTTP PUT request to send a message and data to the AMP HTTP server.
 *
 * @param path
 * @param data
 */
amp.https.prototype.put = function (snd,path,data) {
    var self=this,
        req,body;
    this.count.snd = this.count.snd + path.length + data.length;
    if (https) {
      req = https.request({
        host: snd.address,
        port: snd.port,
        path: path,
        method: 'POST',
        keepAlive: this.options.keepalive,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
      } , function(res) {
        if (res.setEncoding != null) res.setEncoding('utf8');
        // TODO body=+chunk, res.on('end') ..??
        res.once('data', function (chunk) {
          // TODO
        });
      });
      req.once('error', function(err) {
        self.out('Warning: request to '+addr2url(snd)+' failed: '+err,true);
        self.emit('error',err);
      });

      // write data to request body
      req.write(data);
      req.end();
    } else {
      // XHR Browser
      http.request({
        host: snd.address,
        port: snd.port,
        path: path,
        proto: 'https',
        method: 'POST',
        body:data,
        keepAlive: this.options.keepalive,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
      } , function(err,xhr,body) {
        if (err) {
          if (self.verbose) self.out('Warning: request to '+addr2url(snd)+' failed: '+err,true);
          self.emit('error',err);
        }
        // TODO
      })
    }
};

amp.https.prototype.receiver = function (callback,rcv) {
  var self = this;

  if (callback) this.callback=callback;
  
  if (this.mode & AMMode.AMO_SERVER) {
    // Only if this is a public or locally visible network node this node 
    // should provide a server port!
    if (rcv == undefined || rcv.address==undefined) rcv={},rcv.address=this.rcv.address;
    if (rcv.port==undefined) rcv.port=this.rcv.port;
    
    var _options = {
      key : this.options.pem.key,
      cert: this.options.pem.cert,
    };
    this.server=https.createServer(_options, function (request,response) {
      if(parseQueryString(request.url).length==0) return response.end('EINVALID'); // accidental access by WEB browser
      // console.log(request.connection.remoteAddress);
      var i,body,
          msg = parseQueryString(request.url),
          remote = {address:request.connection.remoteAddress.replace(/^::ffff:/,'').replace(/^::1/,'localhost'),
                    port:'['+msg.port.replace(/:/g,'')+']' /* unique remote identifier */};

      if (self.verbose>2) 
        console.log(request.method,request.url,msg,addr2url(remote),url2addr(addr2url(remote)));
        
      // consistency check
      if (msg.magic!=magic) return;
      
      self.count.rcv += msg.length;
      msg.type=AMMessageType[msg.type];

      if (msg.secure) msg.secure=Net.port_of_str(msg.secure);
      
      if (debug) console.log(Io.Time(),msg)

      response.origin=request.headers.origin||request.headers.Origin;
      Comp.string.match(request.method,[
          ['GET',function() {
            if (msg.type==AMMessageType.AMMCOLLECT)
              self.collecting(msg,remote,response);
            else
              self.handle(msg,remote,response);
          }],
          ['POST',function() {
            body = '';
            request.on('data', function (chunk) {
              body = body + chunk;
            });
            request.on('end', function () {
              msg.data=Buffer(body,'hex');
              self.count.rcv += msg.data.length;
              if (msg.cmd) msg.cmd=Number(msg.cmd);
              self.handle(msg,remote,response);
            });
          }]
      ])
    });

    this.server.on("connection", function (socket) {
        socket.setNoDelay(true);
    });

    this.server.on("error", function (err) {
      self.out('Warning: receiver failed: '+err,true);
      if (err) self.err(err);
    });

    this.server.listen(rcv.port,function (err) {
      // Try to get network IP address of this host 
      if (!err) getNetworkIP(undefined,function (err,ip) {
        if (!err) self.rcv.address=isLocal(ip)?options.localhost:ip;
        if (self.verbose) self.out('IP port '+addr2url(self.rcv)+ ' (proto '+self.options.proto+')',true);
        if (err) return self.out("! Unable to obtain network connection information: "+err,true);
      });
      if (callback) callback(err);
    });
  }
  if (this.mode & AMMode.AMO_CLIENT) {

    // If this is a hidden node (e.g., inside a WEB browser), we have to connect to a remote public server
    // by using stalled GET requests.
    if (callback) this.callback=callback;
  }
}

/** Reply to a request (msg.tid contains request tid)
 */
amp.http.prototype.reply = function (cmd,msg,snd) {
  this.request(cmd,msg,snd);
}

/** Send a response reply for a pending HTTP GET/PUT request (AMO_SERVER)
 *
 */ 
amp.https.prototype.response = function (response,msg) {
  var data=msg2JSON(msg), header;

  if (response.origin!=undefined)
      header={'Access-Control-Allow-Origin': response.origin,
              'Access-Control-Allow-Credentials': 'true',
              'Content-Type': 'text/plain'};
  else
      header={'Content-Type': 'text/plain'};
  if (this.options.keepalive) header["Connection"]="keep-alive";
  
  response.writeHead(200,header);
  response.write(data);
  if (debug) console.log(Io.Time(),msg)
  response.end();
}

/** Send a request message to a remote node endpoint
 *
 * function (cmd:integer,msg:Buffer,snd:address)
 */

amp.https.prototype.request = function (cmd,msg,snd) {
  var self=this,req={},
      size = msg.data.length,
      tid = msg.tid||Comp.random.int(65536/2);

  if (snd==undefined) this.err('request: snd=null');

  req.type=AMMessageType.AMMRPC;
  req.tid=tid;                   // Transaction Message ID
  req.port=this.port;            // This AMP id
  req.cmd=cmd;
  req.size=size;
  req.magic=magic;
  req.data=msg.data;
  this.send(snd,req);

}


amp.https.prototype.scan=function(snd,response,callback) {
    var self = this,msg={};
    
    msg.type=response?AMMessageType.AMMACK:AMMessageType.AMMSCAN;
    msg.port=this.port;
    msg.magic=magic;

    if (response) msg.info=snd.info;
   
    if (this.verbose>1 && snd) this.debug('amp.scan: to '+addr2url(snd)+' '+(response?'R':''));

    if (response) 
      this.response(response,msg);
    else
      this.send(snd,msg,function (reply) {
        callback(reply)
      });
}

/** Main entry for requests with JSON interface. Multiplexer for HTTP GET/PUT.
 *
 *  msg: JSON 
 *  callback : function (reply:object)
 */
amp.https.prototype.send = function (snd,msg,callback) {
  var path,
      url,
      body,
      self=this;
  // Create query selector
  path = formatQueryString(msg);
    
  if (typeof snd.port == 'string') {
    url=addr2url(snd,true);
    // If Pending get from client
    
    // Else queue message, client will collect them later (or never)
    if (this.links[url]) {
      if (!this.links[url].msgqueue) this.links[url].msgqueue=[];
      if (this.links[url].collecting) {// pending AMMCOLLECT request
        if (this.verbose>1) this.debug('REPLY msg '+AMMessageType.print(msg.type)+' to '+url);
        this.response(this.links[url].collecting,{msg:[msg]});
        this.links[url].collecting=undefined;
      } else {
        if (this.verbose>1) this.debug('QUEUE msg '+AMMessageType.print(msg.type)+' for '+url);
        this.links[url].msgqueue.push(msg);
      }
    }
  } else if (msg.data!=undefined) { 
    // Convert buffer data to hex formatted string
    body=msg.data.toString('hex');
    
    this.put(snd,path,body,function (body) {
      if (is_error(body)) self.emit('error',body);
      else if (!is_status(body)) self.emit('error','EINVALID');
      // No reply expected!
    }); 
  } else {
    this.get(snd,path,function (body) {
      var xml,i,
          reply;
      if (!body || is_error(body)) {
        self.emit('error','EINVALID');
      } else {
        reply=JSON2msg(body);
        // { status:string,reply:*,msg?:{}[],..} 
      }
      if (callback) callback(reply);
    });
  } 
}


// Start AMP watchdog and receiver
amp.https.prototype.start = function(callback) {
  var self=this,
      s=this.secure?' (security port '+Sec.Port.toString(this.secure)+')':'';
  if (this.verbose>0 && this.mode & AMMode.AMO_SERVER) 
    this.out('Starting ' + addr2url(this.rcv)+' ['+AMMode.print(this.mode)+'] (proto '+this.proto+')'+s);
  if (this.verbose>0 && this.mode & AMMode.AMO_CLIENT) 
    this.out('Starting ['+AMMode.print(this.mode)+'] (proto http)');
  this.watchdog(true);
  if (!this.server && this.mode & AMMode.AMO_SERVER) {
    // After stop? Restart receiver.
    this.receiver();
  } 
  if (callback) callback();
}

// Stop AMP
amp.https.prototype.stop = function(callback) {
  if (this.verbose>0 && this.mode & AMMode.AMO_SERVER) 
    this.out('Stopping ' + addr2url(this.rcv)+' ['+AMMode.print(this.mode)+'] (proto '+this.proto+')'+s);
  if (this.verbose>0 && this.mode & AMMode.AMO_CLIENT) 
    this.out('Stopping ['+AMMode.print(this.mode)+'] (proto http)');
  if (this.links) for(var p in this.links) {
    if (this.links[p]) {
      // Try to unlink remote endpoint
      this.unlink(this.links[p].snd);
      this.links[p].state=AMState.AMS_NOTCONNECTED;
      if (this.links[p].collect) clearTimeout(this.links[p].collect),this.links[p].collect=undefined;
    }
  }
  if (this.timer) clearTimeout(this.timer),this.timer=undefined;
  if (this.server) this.server.close(),this.server=undefined;
  
  if (callback) callback();
}

// Unlink remote endpoint
amp.https.prototype.unlink=function(snd) {
  var self = this,msg,
      url = snd?addr2url(snd,true):null;
  if (this.mode&AMMode.AMO_MULTICAST) {
    if (!this.links[url] || this.links[url].state!=AMState.AMS_CONNECTED) return;
  } else {
    if (this.links.state!=AMState.AMS_CONNECTED) return;
  }
  msg={type:AMMessageType.AMMUNLINK,port:this.port,node:this.node?this.node.id:'*',index:this.index++,magic:magic};
    
  this.send(snd,msg,function (reply) {
    // handle reply
    if (reply) {}
  });
  this.emit('route-',addr2url(snd,true));
  if (this.mode&AMMode.AMO_MULTICAST) {
    this.links[url].state=AMState.AMS_NOTCONNECTED;
    if (!this.links[url].snd.connect) this.links[url].snd={};
  } else {
    this.links.state=AMState.AMS_NOTCONNECTED;
    if (!this.links.snd.connect) this.links.snd={};
  }
  this.cleanup(url);
}


/** Install a watchdog timer.
 *
 * 1. If link state is AMS_NOTCONNECTED, retry link request if this.links[].snd is set.
 * 2. If link state is AMS_CONNECTED, check link end point.
 * 3, If link state is AMS_RENDEZVOUS, get remote endpoint connectivity via broker
 *
 * @param run
 */
amp.https.prototype.watchdog = function(run,immedOrDelay) {
    var self=this;
    if (this.timer) clearTimeout(self.timer),this.timer=undefined;
    if (run) self.timer=setTimeout(function () {
        if (!self.timer ||  self.inwatchdog) return; // stopped or busy?
        self.timer = undefined;
        self.inwatchdog=true;
        
        function handle(obj,url) {
          if (self.verbose>1) self.debug('Watchdog: handle link ('+url+') '+
                                        (obj.snd?addr2url(obj.snd):'')+' in state '+
                                        AMState.print(obj.state)+' live '+obj.live);
          switch (obj.state) {
            case AMState.AMS_CONNECTED:
                if (obj.live == 0) {
                    // No PING received, disconnect...
                    if (self.verbose>0) 
                      self.out('Endpoint ' + addr2url(obj.snd) +
                               ' not responding, propably dead. Unlinking...',true);
                    obj.state = AMState.AMS_NOTCONNECTED;
                    self.emit('route-',addr2url(obj.snd,true));
                    self.cleanup(url,obj.snd.connect);
                    if (obj.snd.connect) self.watchdog(true,2000);
                } else {
                    obj.tries=0;
                    obj.live--;
                    self.watchdog(true);
                    if (self.mode&AMMode.AMO_MULTICAST) self.ping(obj.snd);
                    else self.ping();
                }
                break;
            case AMState.AMS_NOTCONNECTED:
            case AMState.AMS_PAIRED:
                if (obj.snd.port && typeof obj.snd.port == 'number') {
                  // Try link to specified remote endpoint obj.snd
                  if (self.verbose>0 && obj.tries==0) 
                    self.out('Trying link to ' + addr2url(obj.snd),true);
                  self.link(obj.snd); 
                  obj.tries++;
                  if (obj.tries < options.TRIES) self.watchdog(true);
                  else {
                    self.out('Giving up to link '+addr2url(obj.snd),true);
                    self.emit('error','link',addr2url(obj.snd));
                    obj.snd={},obj.tries=0;
                  }
                }
                break;
            // AMP P2P Control
            case AMState.AMS_RENDEZVOUS:
                obj.send(
                  {type:'register',name: self.rcv.name, linfo: self.rcv},
                  self.broker,
                  function () {}
                );
                self.watchdog(true);
                break;
            case AMState.AMS_REGISTERED:
                if (obj.tries < options.TRIES && obj.snd.name) {
                  obj.tries++;
                  self.send(
                    {type:'pair', from:self.rcv.name, to: obj.snd.name},
                    self.broker,
                    function () {
                    }
                  );
                }
                if (obj.tries < options.TRIES) self.watchdog(true);
                break;
          }          
        }
        for(var p in self.links) if (self.links[p]) handle(self.links[p],p);
        self.inwatchdog=false;
    },immedOrDelay==true?0:immedOrDelay||options.TIMER);
};
    
