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
 **    $CREATED:     30-01-18 by sbosse.
 **    $RCS:         $Id: ampMAN.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.14.9
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) - General Management Operations
 **
 **
 **  New:
 **   - Single message transfers (HEADER+DATA)
 **
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Sec = Require('jam/security');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');

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
    addrempty=COM.addrempty,
    getNetworkIP=COM.getNetworkIP;

// Get data from message
function msgData(msg) {
  // typeof msg.data = Array | Buffer | { type: 'Buffer', data: Array }
  return msg.data && msg.data.data?msg.data.data:msg.data;
}

module.exports.current=function (module) { current=module.current; Aios=module; };


amp.man = function (options) {

}

// Message logger
amp.man.prototype.LOG = function (op,msg) {
  if (!this.logging) return;
  switch (op) {
    case 'print':
      for(var i in this.logs) {
        Aios.log(this.logs[i].op,this.logs[i].time,this.logs[i].msg,AMState.print(this.logs[i].state));
      }
      this.logs=[];
      break;
    case 'enable':
      this.logging=true;
      break;
    case 'disable':
      this.logging=false;
      break;
    default:
      var date = new Date();
      var time = Math.floor(date.getTime());
      this.logs.push({op:op,time:time,msg:msg,state:(this.url && this.links[this.url].state)});
  }
} 



/** Transation cache for receiving data fragments that can be out of order.
 *  typeof @data = [handler:{tid,remote,cmd,size,frags,buf},data:[],timeout:number]
 *
 */
amp.man.prototype.addTransaction = function (remote,tid,data) {
  if (this.mode & AMMode.AMO_MULTICAST)
    this.transactions[remote.address+remote.port+tid]=data; 
  else
    this.transactions[tid]=data; 
}
amp.man.prototype.deleteTransaction = function (remote,tid) {
  if (this.mode & AMMode.AMO_MULTICAST)
    delete this.transactions[remote.address+remote.port+tid];
  else 
    delete this.transactions[tid];
}
amp.man.prototype.findTransaction = function (remote,tid) {
  if (this.mode & AMMode.AMO_MULTICAST)
    return this.transactions[remote.address+remote.port+tid];
  else
    return this.transactions[tid];
}

/** Check the state of a link
  *
  */
amp.man.prototype.checkState = function (state,addr) {
  switch (state) {
    case AMState.AMS_CONNECTED:
      if (this.mode & AMMode.AMO_ONEWAY) return true;
      if (this.mode & AMMode.AMO_MULTICAST) return this.links[addr2url(addr,true)];
      if (this.url && this.links[this.url].state == AMState.AMS_CONNECTED) return true;
      break;
  }
  return false;
}

/** Update AMP object configuration
 *
 */
amp.man.prototype.config = function(options) { 
  for(var p in options) this[p]=options[p];
}
/** Handle events
 *
 */
amp.man.prototype.emit = function(event,arg,aux,aux2) { 
  if (this.events[event]) this.events[event](arg,aux,aux2);
}

/** Handler for incoming messages (proecssed by receiver)
 *
 */
amp.man.prototype.handle = function (msg,remote,response) {
  var handler,thisnum,ipport,cmsg,url,ack,info;
  if (this.verbose > 1) this.out('handle '+AMMessageType.print(msg.type)+' from '+addr2url(remote),true);
  switch (msg.type) {
    case AMMessageType.AMMRPCHEAD:
    case AMMessageType.AMMRPCHEADDATA:
      if (!this.checkState(AMState.AMS_CONNECTED,remote)) return;

      handler={};
      handler.tid=msg.tid; 
      // handler.remote=remote.address+':'+Buf.buf_get_int16(buf);
      handler.remote=remote;
      handler.cmd=msg.cmd;
      handler.size=msg.size;
      handler.frags=msg.frags;
      if (msg.size<0) this.err('Got invalid message (size<0) from '+addr2url(remote)); // in16 limit
      // console.log(handler)
      if (handler.size>0 && handler.frags>0) {
        // AMMRPCDATA messages are following (used by UDP)
        handler.buf=Buf.Buffer();
        dlist = Comp.array.range(0, handler.frags - 1);
        // Add transaction to cache for pending data
        this.addTransaction(remote, handler.tid, [handler,dlist,1000]);
      } else if (handler.size>0) {
        // Single message transfer; message contains all data (msg.data: Buf.buffer!, used by TCP)
        handler.buf=msg.data;
        this.callback(handler);        
      } else {
        // No data; control message
        handler.buf=Buf.Buffer();
        this.callback(handler);
      }
      break;

    case AMMessageType.AMMRPCDATA:
      if (!this.checkState(AMState.AMS_CONNECTED,remote)) return;
      thisnum = msg.off/this.dlimit;
      transaction = this.findTransaction(remote,msg.tid);
      if (transaction!=undefined) {
        handler=transaction[0];
        if (this.verbose>1)
          this.out('receiver: adding data num='+
                   thisnum+' off='+msg.off+' size='+msg.size+' dlist='+transaction[1],true);

        Buf.buf_get_buf(msg.data,handler.buf,msg.off,msg.size);
        transaction[1]=Comp.array.filter(transaction[1],function(num) {return (num!=thisnum)});
        if (Comp.array.empty(transaction[1])) {
            if (this.verbose>2) this.out('[AMP] receiver: finalize '+addr2url(remote),true);
            // Io.out(handler.data.toString());
            // Deliver
            this.callback(handler);
            this.deleteTransaction(remote,msg.tid);
        }
      }
      break;

    case AMMessageType.AMMRPC:
      // Single data transfer - used by HTTP/Browser
      if (!this.checkState(AMState.AMS_CONNECTED,remote)) return;
      // Complete RPC message
      handler={};
      handler.tid=msg.tid; 
      // handler.remote=remote.address+':'+Buf.buf_get_int16(buf);
      handler.remote=remote;
      handler.cmd=msg.cmd;
      handler.size=msg.size;
      handler.frags=msg.frags;
      handler.buf=Buf.Buffer(msgData(msg));
      this.callback(handler);
      if (this.ack && response) this.ack(response);
      break;
      
    case AMMessageType.AMMPING:
        url=addr2url(remote,true);
        ipport=remote.port;
        if (this.mode&AMMode.AMO_MULTICAST) {
          if (!this.links[url] || this.links[url].state!=AMState.AMS_CONNECTED) return;
        } else if (this.url) {
          if (this.links[this.url].state!=AMState.AMS_CONNECTED) return;
        }
        // Send back a PONG message only if we're connected
        this.pong({address:remote.address,port:ipport},response);
        break;

    case AMMessageType.AMMPONG:
        ipport=remote.port;
        if (this.mode&AMMode.AMO_MULTICAST) {
          url=addr2url(remote,true);
          if (this.links[url] && this.links[url].state==AMState.AMS_CONNECTED) {
            this.links[url].live = options.AMC_MAXLIVE;
          }
        } else if (this.url && this.links[this.url].state==AMState.AMS_CONNECTED) {
          this.links[this.url].live = options.AMC_MAXLIVE;
        }
        if (this.ack && response) this.ack(response);
        break;

    case AMMessageType.AMMACK:
        // TODO: check pending waiters (scan mode)
        if (msg.status=="ELINKED") {    
          if (this.mode&AMMode.AMO_MULTICAST) {
            // Multicast mode
            url=addr2url(remote,true);
            if (!this.links[url] || this.links[url].state==AMState.AMS_NOTCONNECTED) {
                // Ad-hoc remote connect
                if (!this.links[url]) this.links[url]={};
                this.links[url].snd=remote;
                this.links[url].live=options.AMC_MAXLIVE; 
                this.links[url].port=msg.port;
                this.links[url].ipport=remote.port; 
                this.links[url].state=AMState.AMS_CONNECTED;
                this.links[url].node=msg.node;
                this.emit('route+',url,msg.node);
                this.watchdog(true);
                if (this.verbose) 
                  this.out('Linked with ad-hoc '+this.proto+' '+url+', AMP '+
                            Net.Print.port(msg.port)+', Node '+msg.node,true);
            }           
          }
        }
        break;
        
    case AMMessageType.AMMLINK:
        ipport=remote.port;
        url=addr2url(remote,true);
        if (this.secure && (!msg.secure || !Sec.Port.equal(this.secure,msg.secure))) return; 
        if (this.mode&AMMode.AMO_MULTICAST) {
          // Multicast mode
          if (!this.links[url] || this.links[url].state==AMState.AMS_NOTCONNECTED) {
              // Ad-hoc remote connect
              if (!this.links[url]) this.links[url]={};
              this.links[url].snd=remote;
              this.links[url].live=options.AMC_MAXLIVE; 
              this.links[url].port=msg.port;
              this.links[url].ipport=remote.port; 
              // back link acknowledge
              this.link(this.links[url].snd,false,none,response);
              // no ack="EOK" -- ack send by link response!;
              this.links[url].state=AMState.AMS_CONNECTED;
              this.links[url].node=msg.node;
              // if (this.mode&AMMode.AMO_UNICAST) this.snd=remote,this.url=url;
              this.emit('route+',url,msg.node,msg.remote);
              this.watchdog(true);
              if (this.verbose) 
                this.out('Linked with ad-hoc '+this.proto+' '+url+', AMP '+
                          Net.Print.port(msg.port)+', Node '+msg.node,true);
          } else if (this.links[url].state==AMState.AMS_CONNECTED) {
            // Already linked! Just acknowledge
            ack="ELINKED";
          }
        } else {

          // Unicast mode; only one connection
          if (this.links[url] && !addrempty(this.links[url].snd) &&
              this.links[url].state==AMState.AMS_NOTCONNECTED &&
              ipequal(this.links[url].snd.address,remote.address) &&
              this.links[url].snd.port==ipport)    // ipport or remote.port??
          {
              // Preferred / expected remote connect
              this.links[url].snd=remote;
              this.links[url].port=msg.port;
              this.links[url].ipport=remote.port; 
              this.links[url].node=msg.node;
              this.links[url].live=options.AMC_MAXLIVE; 

              // back link acknowledge
              this.link(this.links[url].snd);

              this.links[url].state=AMState.AMS_CONNECTED;
              // Inform router
              this.emit('route+',url,msg.node,msg.remote);
              this.watchdog(true);
              if (this.verbose) 
                this.out('Linked with preferred '+this.proto+' '+ url +', '+
                         Net.Print.port(msg.port),true); 
          } else if ((!this.links[url] && !this.url) || 
                     (this.links[url] && this.links[url].state==AMState.AMS_NOTCONNECTED) ||
                     (this.broker && this.url && this.links[this.url].state==AMState.AMS_NOTCONNECTED)) {
              if (!this.links[url]) this.links[url]={};
              this.links[url].snd=remote;
              this.links[url].live=options.AMC_MAXLIVE; 
              this.links[url].port=msg.port;
              this.links[url].ipport=remote.port; 
              this.links[url].node=msg.node;

              // back link acknowledge
              this.link(this.links[url].snd,false,none,response);
              // no ack="EOK"; - ack was send with link message!

              this.links[url].state=AMState.AMS_CONNECTED;
              this.url=url;  // remember this link

              // Inform router
              this.emit('route+',url,msg.node);
              this.watchdog(true);
          
              if (this.verbose) 
                this.out('Linked with ad-hoc ' + this.proto +' '+ url +', '+
                          Net.Print.port(msg.port),true);
          } 
        }
        if (ack && this.ack && response) this.ack(response,ack);
        break;

    case AMMessageType.AMMUNLINK:
        ipport=remote.port;
        if (this.mode&AMMode.AMO_MULTICAST) {
          // Multicast mode
          url=addr2url(remote,true); // ipport or remote.port??
          if (this.links[url] && !addrempty(this.links[url].snd) && ipequal(this.links[url].snd.address,remote.address) &&
              this.links[url].snd.port==ipport && this.links[url].state==AMState.AMS_CONNECTED) {
              this.links[url].state=AMState.AMS_NOTCONNECTED;
              // Not negotiated. Just close the link!
              if (this.verbose) 
                this.out('Unlinked ' +url+', '+
                         Net.Print.port(msg.port),true);
              // Inform router
              this.emit('route-',url);
              if (!this.links[url].snd.connect) this.links[url].snd={};
              if (this.cleanup) this.cleanup(url);
          }
        } else {
          // Unicast mode
          if (this.url && !addrempty(this.links[this.url].snd) &&
              ipequal(this.links[this.url].snd.address,remote.address) &&
              this.links[this.url].snd.port==ipport &&
              this.links[this.url].state==AMState.AMS_CONNECTED) 
          {
              this.links[this.url].state=AMState.AMS_NOTCONNECTED;
              addr=this.links[this.url].snd;
              // Not negotiated. Just close the link!
              if (this.verbose) 
                this.out('Unlinked ' + this.url +', '+
                         Net.Print.port(msg.port),true);

              // Inform router
              this.emit('route-',addr2url(addr));
              if (!this.links[this.url].snd.connect) this.links[this.url].snd=null;
              if (this.cleanup) this.cleanup(url);
          }
        }
        if (this.ack && response) this.ack(response);
        break;

    // optional rendezvous brokerage ; remote is broker IP!!!
    case AMMessageType.AMMCONTROL:
        cmsg = JSON.parse(msgData(msg));
        if (this.verbose>1) this.out('# got message '+msgData(msg),true);
        this.LOG('rcv',cmsg);
        // All brokerage and pairing is handled by the root path '*'!
        if (this.control && this.links['*'])
          this.control(this.links['*'],cmsg,remote);    
        break;
        
    case AMMessageType.AMMSCAN:
        url=addr2url(remote,true);
        ipport=remote.port;
        info={
          world:(current.world&&current.world.id),
          stats:(current.world&&current.world.info()),
        };
        this.scan({address:remote.address,port:ipport,info:info},response);
        break;

    default:
      this.out('handle: Unknown message type '+msg.type,true);
  }
}

/** Install event handler
 *
 */
amp.man.prototype.on = function(event,handler) { 
  this.events[event]=handler;
}

// Status of link, optionally checking destination
amp.man.prototype.status = function (ip,ipport) {
  var p,url,sl=[];
  if (ip=='%') {
    // return all connected nodes
    for(p in this.links) if (this.links[p] && this.links[p].state==AMState.AMS_CONNECTED) 
      sl.push(this.links[p].node);
    return sl;
  }
  if (this.mode&AMMode.AMO_MULTICAST) {
    if (!ip) {
      for(p in this.links) if (this.links[p] && this.links[p].state==AMState.AMS_CONNECTED) return true;
      return false;
    } else {
      url=addr2url({address:ip,port:ipport});
      if (!this.links[url]) return false;
      return this.links[url].state==AMState.AMS_CONNECTED;
    }
  }
  if (!ip && this.url) return this.links[this.url].state==AMState.AMS_CONNECTED || 
                              (this.mode&AMMode.AMO_ONEWAY)==AMMode.AMO_ONEWAY;
 
  return (this.url && ipequal(this.links[this.url].snd.address,ip) && this.links[this.url].snd.port==ipport);
}
