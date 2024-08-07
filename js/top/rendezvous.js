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
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.io
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2018 bLAB
 **    $CREATED:     30-11-17 by sbosse.
 **    $RCS:         $Id: rendezvous.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 **  
 **   Simple public P2P rendezvous (pairing) server with associative naming service.
 **   Primary use: Enabling JAM2JAM connections with JAMs behind NATs 
 **   (hosts in different private networks).  
 **   Uses hole-punching technique to overcome router limitations occuring with NAT traversal of
 **   UDP streams.
 **
 **
 **   A host stores tokens in a cache, One token is removed on each pairing request or if the lifetime
 **   of the token has expired. There is an upper limit of tokens that are cached.
 **
 **   $ENDOFINFO
 */
global.config={simulation:false,nonetwork:false};
var Comp = Require('com/compat');
var Io = Require('com/io');
var Chan = Require('jam/chan');
var Amp = Require('jam/amp');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var sprintf = Comp.printf.sprintf;
var ipnet = Require('net');
var dgram = Require('dgram');
var sprintf = Comp.printf.sprintf;

var onexit=false;
var start=false;

var options = {
  connport:Net.uniqport(),
  http: {address:'134.102.50.219',port:80},
  ip :  {address:'0.0.0.0',port:10001},
  verbose:1,
  CACHETMO:60000,
  MAXTOKENS: 4,  // maximal cached register tokens from each host 
  TIMER:200,
  TRIES:3,
  version:'1.2.2'
}



var usage = function (exit) {
  out('Usage: rendezvous [-h] [verbose:#] [port:#]');
  if (exit) onexit=true,start=false;
}

if (process.argv[1].indexOf('ampbroker')!=-1 || process.argv[1].indexOf('rendezvous')!=-1) 
  start=true,process.argv.forEach(function (arg) {
  var tokens=arg.split(':');
  if (arg=='-h' || arg=='-help') usage(true);
  if (tokens.length!=2) return;
  switch (tokens[0]) {
    case 'verbose':  options.verbose=Number(tokens[1]); break;
    case 'port': options.ip.port=Number(tokens[1]); break;
  }
});

// Use remote TCP connection to get this host IP (private address if behind NAT) 
function getNetworkIP(callback) {
  var socket = ipnet.createConnection(options.http.port, options.http.address);
  socket.on('connect', function() {
    callback(undefined, socket.address().address);
      socket.end();
  });
  socket.on('error', function(e) {
    callback(e, 'error');
  });
}

function timestamp() {
  return Date.now();
}

// typeof @ip = { address:string, port:number }
function Broker (_options) {
  var self=this;
  if (!(this instanceof Broker)) return new Broker(_options);

  this.options=options;
  for (var p in _options) if (_options[p]!=undefined) options[p]=_options[p];

  this.out = function (msg) {console.log('[RED '+Chan.addr2url(options.ip)+' '+Io.Time()+'] '+msg)};
  
  this.udp = dgram.createSocket('udp4');

  // The rendezvous cache (register tokens)
  this.clients = {};

  function doUntil(interval, fn, cond, arg) {
    if (cond()) return;
    fn(arg);
    return setTimeout(function() {
      doUntil(interval, fn, cond, arg);
    }, interval);  
  }
  
  // Compare two client db entries
  function eq(client1,client2) {
    var p;
    if (!client1 || !client2 ||
        client1.name != client2.name) return false;
    for(p in client1.connections) {
      if (client1.connections[p].address != client2.connections[p].address ||
          client1.connections[p].port != client2.connections[p].port) return false;       
    } 
    return true;
  }

  // Store and lookup
  function store(name,client) {
    client.time=timestamp()
    // Note: Old obsolete tokens of a client (changed IP/PORT) must be flushed!
    if (!self.clients[name] || !eq(client,self.clients[name][0])) self.clients[name]=[client];
    else if (self.clients[name].length<options.MAXTOKENS) {
      self.clients[name].push(client);
      self.clients[name].forEach(function (client) { client.time=timestamp() });
    }
  }

  // TODO don't return self entry (from:public address)
  function lookup(pat,from,all) {
    var isRegex=pat.indexOf('*')!=-1;
    if (!isRegex) {
      if (!self.clients[pat]) return all?[]:undefined;
      return all?self.clients[pat]:self.clients[pat].pop();
    } else {
      // TODO pattern search
    }
  }
  
  function search(pat) {
    var isRegex=pat.indexOf('*')!=-1,regex,result=[];
    if (!isRegex) {
      return self.clients[pat] && self.clients[pat].length?[self.clients[pat][0]]:[];
    } else {
      regex=RegExp(pat.replace(/\//g,'\\/').replace(/\*/g,'.+'));
      for(var p in self.clients) {
        if (self.clients[p] && self.clients[p].length && regex.test(p)) result.push(p);
      }
      return result;
    }  
  }
  
  function send(host, port, msg, cb) {
    var buf = Buf.Buffer();
    var data = JSON.stringify(msg);
    Buf.buf_put_int16(buf,Amp.AMMessageType.AMMCONTROL);
    Buf.buf_put_port(buf,options.connport);
    Buf.buf_put_string(buf,data);

    self.udp.send(buf.data, 0, Buf.length(buf), port, host, function(err, bytes) {
      if (err) {
        udp.close();
        self.out(sprintf('# stopped due to error: %s', err));
        process.exit(-1);
      } else {
        if (options.verbose>1) self.out('# sent '+msg.type+' to '+host+':'+port);
        if (cb) cb();
      }
    });
  }

  this.udp.on('listening', function() {
    var address = self.udp.address();
    if (options.verbose) self.out(sprintf ('# listening [%s:%s]', address.address, address.port));
  });

  this.udp.on('message', function(message, rinfo) {
    var buf = Buf.Buffer(),reply,
        port,data,msg,obj,i,j,newreg=false;

    Buf.buf_init(buf);
    Buf.buf_of_str(buf,message);
    msgtyp=Buf.buf_get_int16(buf);

    if (msgtyp != Amp.AMMessageType.AMMCONTROL) {
      if (options.verbose)
        self.out(sprintf('# Invalid message from %s:%s', 
                    rinfo.address, rinfo.port));
      return;
    }
    port = Buf.buf_get_port(buf);
    data = Buf.buf_get_string(buf);

    try {
      msg = JSON.parse(data);
    } catch (e) {
      self.out(sprintf('! Couldn\'t parse data (%s):\n%s', e, data));
      return;
    }
    
    switch (msg.type) {
      case 'lookup':
        reply=search(msg.data);
        console.log(msg.data,reply)
        send(rinfo.address,rinfo.port,{type:'lookup',from:'BROKER', data:reply, path:msg.data});        
        break;
        
      case 'register':
        obj={
            name: msg.name,
            connections: {
              local: msg.linfo, 
              public: rinfo
            },
        };
        // copy optional attributes
        for(p in msg) {
          switch (p) {
            case 'name':
            case 'linfo':
            case 'type':
              continue;
            default:
              obj[p]=msg[p];
          }
        }
        store(msg.name,obj);
        if (self.clients[msg.name].length==1) newreg=1; 
        if (options.verbose && newreg)
          self.out(sprintf('# Client registered: P %s@[%s:%s | L %s:%s]', msg.name,
                       rinfo.address, rinfo.port, msg.linfo.address, msg.linfo.port));
        send(rinfo.address,rinfo.port,{type:'registered',from:'BROKER'});
        break;

      case 'pair':
        // Pair request from one client
        var couple = [lookup(msg.from,rinfo), lookup(msg.to,rinfo) ], counter=options.TRIES;
        if (options.verbose>1)
          self.out(sprintf('# Pair request:  %s@[%s:%s] to %s [%b,%b]', msg.from,
                       rinfo.address, rinfo.port, msg.to, couple[0]!=undefined,couple[1]!=undefined));
        else if (options.verbose && couple[0]!=undefined && couple[1]!=undefined)
          self.out(sprintf('# Pairing %s@[%s:%d] and %s@[%s:%d]', 
                       msg.from,couple[0].connections.public.address, couple[0].connections.public.port,
                       msg.to,couple[1].connections.public.address, couple[1].connections.public.port));

        for (i=0; i<couple.length; i++) {
          if (!couple[i]) {
            // restore not consumed client conenction
            for(j = 0; j<couple.length; j++) {
              if (couple[j]) store(couple[j].name,couple[j]);
            }
            return self.out('Client '+(i+1)+' unknown! '+(i==0?msg.from:msg.to));
          }
        }
        // Start pairing with punch messages on both clients
        // Echo pairing to minimize deadlock possibility if pairing messages are lost
        doUntil(options.TIMER,function () {
          for (var i=0; i<couple.length; i++) {
            send(couple[i].connections.public.address, couple[i].connections.public.port, {
              type: 'pairing',
              client: couple[(i+1)%couple.length],
            });
          }
          counter--;
        },function () { return counter==0}); 
        // Only one pairing can be peformed; next time a new registering is required
        break;
    };
  });

  
}
Broker.prototype.init = function () {
  var self=this;
  // Start GC
  this.gc = setInterval(function () {
    var time=timestamp();
    for (var p in self.clients) {
      if (self.clients[p]) self.clients[p]=self.clients[p].filter(function (conn) {
        // console.log(p,time,conn.time)
        return time>conn.time+self.options.CACHETMO;
      });
    }
  },this.options.CACHETMO);
}

Broker.prototype.start = function () {
  var self=this;
  getNetworkIP(function (err,addr) {
    if (!err) {
      self.options.ip.address=addr;
      self.out('# got IP '+addr);
    }
  });
  this.udp.bind(options.ip.port,options.ip.address);  
}

Broker.prototype.stop = function () {
  if (this.gc) clearInterval(this.gc),this.gc=undefined;
}

if (start) {
  var bs = new Broker(options);
  bs.start()
}

module.exports = { Broker:Broker };
