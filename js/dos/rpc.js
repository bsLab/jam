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
 **    $CREATED:     31-3-15 by sbosse.
 **    $VERSION:     1.4.4
 **
 **    $INFO:
 **
 **  DOS: Remote Procedure Call Interface
 **
 **    $ENDOFINFO
 */
"use strict";

var log = 0;

var util = Require('util');
var Io = Require('com/io');
var Comp = Require('com/compat');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Sch = Require('dos/scheduler');
var Status = Net.Status;

// Transaction identifier number tracking. Must be shared by all Rpc_int instances!
var _transaction_id = 0;
function transaction_id() {
  var tid=_transaction_id;
  _transaction_id=(_transaction_id+1)%65536;
  return tid;
}

/** RPC Operation Type
 *
 * @enum {number}
 */
var Operation = {
    SEND:1,
    RECV:2,
    TRANSREQ:3,
    TRANSREP:4,
    TRANSAWAIT:5,
    TRANS:6,
    GETREQ:7,
    PUTREP:8,
    LOOKUP:9,       // Search the host port that has a RPC server
    IAMHERE:10,
    IAMNOTHERE:11,
    WHOIS:12,
    WHEREIS:13,     // Search a connection to a host
    HEREIS:14,      // Reply of host
    print:function(op) {
        switch (op) {
            case Operation.SEND: return "SEND";
            case Operation.RECV: return "RECV";
            case Operation.TRANSREQ: return "TRANSREQ";
            case Operation.TRANSREP: return "TRANSREP";
            case Operation.TRANSAWAIT: return "TRANSAWAIT";
            case Operation.TRANS: return "TRANS";
            case Operation.GETREQ: return "GETREQ";
            case Operation.PUTREP: return "PUTREP";
            case Operation.IAMHERE: return "IAMHERE";
            case Operation.IAMNOTHERE: return "IAMNOTHERE";
            case Operation.WHOIS: return "WHOIS";
            case Operation.WHEREIS: return "WHEREIS";
            case Operation.HEREIS: return "HEREIS";
            case Operation.LOOKUP: return "LOOKUP";
            default: return "Rpc.Operation?";
        }
    }

};

function getData(data) {
  if (!String.equal(data.val,'')) return data.val;
  else return data.children.toString();
}

/** RPCIO Packet Object (message context handle)
 ** Each transaction, each request and reply get an RPCIO handle.
 ** Additionally, server localization uses RPCIO packets.
 **
 *
 * @param {(Operation.SEND|*)} [operation]
 * @param {header} [hdr]
 * @param {Buffer|string} [data]
 * @param {taskcontext} [context]
 * @param {function} [callback]
 * @constructor
 * @typedef {{operation,pubport,header,data,pos,context:context,callback,host,hop,hop_max,tid,timeout,status,index,
 *          }} rpcio~obj
 * @see rpcio~obj
 * @see rpcio~meth
 */
var rpcio = function(operation,hdr,data,context,callback) {
    if (operation==undefined) {
        // Create empty rpcio with headers
        this.operation=undefined;
        /*
         ** Public server port (GETREQ only)
         */
        this.pubport=undefined;
        /*
        ** Connection Link Port Identifier
         */
        this.connport=undefined;
        this.header=Net.Header();
        this.data=undefined;
        this.pos=0;
        this.context=Sch.GetCurrent(); // TODO Should be undefined?
        this.callback=undefined;

        /*
        ** Source host port (initiator)
         */
        this.hostport=undefined;
        /*
        ** Destination host port (executor). 
        */
        this.sendport=undefined;
        
        this.hop=0;
        this.hop_max=Net.DEF_RPC_MAX_HOP;
        this.tid=0;
        this.timeout=-1;
        this.status=undefined;
        this.index=-1;
        this.cache=[];

    } else {
        this.operation = operation;
        /*
        ** Public server port (GETREQ only)
         */
        this.pubport=Net.Port();
        /*
         ** Connection Link Port Identifier
         */
        this.connport=undefined;
        this.header = hdr;
        this.data = Buf.Buffer(data).data;
        this.pos=0;
        this.context = context;
        this.callback = callback;
        /*
         ** Source host port (initiator)
         */
        this.hostport=undefined;
        /*
         ** Destination host port (executor)
         */
        this.sendport=undefined;

        this.hop=0;
        this.hop_max=Net.DEF_RPC_MAX_HOP;
        this.tid=0;
        this.timeout=-1;
        this.status=undefined;
        this.index=-1;
        this.cache=[];
    }
};

/**
 *
 * @param [operation]
 * @param {header} [hdr]
 * @param {Buffer|string} [data]
 * @param {taskcontext} [context]
 * @returns {rpcio}
 */
function Rpcio(operation,hdr,data,context) {
    var obj = new rpcio(operation,hdr,data,context);
    Object.preventExtensions(obj);
    return obj;
}

/** 1. Return a (weak) copy of this rpcio packet
 ** 2. Copy source content to this rpcio (weak, only first level copy)
 *
 */
rpcio.prototype.copy = function (src,callback) {
  if (src) {
    this.operation=src.operation;
    this.pubport=src.pubport;
    this.connport=src.connport;
    this.header=src.header;
    this.pos=src.pos;
    this.data=src.data;
    this.hostport=src.hostport;
    this.sendport=src.sendport;
    this.tid=src.tid;
    //this.timeout=src.timeout;
    this.timeout=-1;
    this.hop=src.hop;
    this.hop_max=src.hop_max;
    this.status=src.status;
    this.cache=[];    
    this.context=undefined;
    this.callback=callback;        
  }
}

/**
 ** Initialize a rpcio object
 *
 * @param {(Operation.SEND|*)} [operation]
 * @param {header} [hdr]
 * @param {Buffer|string} [data]
 * @param [context]
 * @param {function} [callback]
 */
rpcio.prototype.init = function(operation,hdr,data,context,callback) {
    // Create empty rpcio with headers
    this.operation=operation;
    this.pubport=undefined;
    this.connport=undefined;
//    if (hdr!=undefined && !(hdr==this.header))
        // Net.Copy.header(hdr,this.header); 
    if (hdr!=undefined)
        this.header=Net.Header(hdr.h_port,hdr.h_priv,hdr.h_command,hdr.h_status);
    else if (hdr == undefined) {
        this.header=Net.Header(); // start with a clean unreferenced header structure - may be relinked
//        this.header.h_status=undefined;
//        this.header.h_command=undefined;
//        this.header.h_port=Net.Port();
//        this.header.h_priv.prv_obj=0;
//        this.header.h_priv.prv_rights=0;
//        this.header.h_priv.prv_rand=Net.Port();
    }
    if (data) this.data=Buf.Buffer(data).data; else this.data=new Buffer('');
    //if (context) this.context=context;
    //if (callback) this.callback=undefined;
    this.pos=0;
    this.hostport=undefined;
    this.sendport=undefined;
    this.tid=-1;
    this.timeout=-1;
    this.hop=0;
    this.hop_max=Net.DEF_RPC_MAX_HOP;
    this.status=undefined;
    this.cache=[];
    
    this.context=context;
    this.callback=callback;
};

// TODO? HOP/HOPMAX fields?????

/** Encode RPCIO packet to XML
 *
 * @param {string} wrap xml/rpc
 * @returns {string}
 */
rpcio.prototype.to_xml=function(wrap) {
    var self=this,
        body,buf;
    buf = Buf.Buffer();
    Buf.buf_put_hdr(buf, this.header);
    String.match(wrap,[
        ['xml',function() {
            body = '<xml><header>' + Buf.buf_to_hex(buf) + '</header>';
            body = body + '<data>' + Buf.buf_to_hex(self) + '</data></xml>';
        }],
        ['rpc',function(){
            body = '<rpc operation="'+Operation.print(self.operation)+
                '" hostport="' + Net.port_to_str(self.hostport) +
                '" sendport="' + Net.port_to_str(self.sendport) +
                '" tid="' + self.tid + '">';
            body = body + '<header>' + Buf.buf_to_hex(buf) + '</header>';
            body = body + '<data>' + Buf.buf_to_hex(self) + '</data></rpc>';
        }]
    ]);
    return body;
};

/** Decode XML to RPCIO
 *
 * .. xml = new xmldoc.XmlDocument(body) ..
 */
rpcio.prototype.of_xml=function(xml) {
    var self=this,
        header,data,buf,
        hdr = Net.Header(),
        rpc,tid,hostport,sendport,operation;
    if (String.equal(xml.name,'rpc')) {
        /*
        ** Wrapped RPCIO <rpc><header/></data>
         */
        rpc = xml;
        tid = rpc.attr.tid;
        hostport = rpc.attr.hostport;
        sendport = rpc.attr.sendport;
        operation = rpc.attr.operation;
        header = rpc.childNamed('header');
        data = rpc.childNamed('data');
    } else if (String.equal(xml.name,'xml')) {
        /*
        ** Plain RPCIO <xml><header/><data/>
         */
        header = xml.childNamed('header');
        data = xml.childNamed('data');
    }
    if (header != undefined) {
        buf = Buf.Buffer();
        Buf.buf_of_hex(buf, getData(header));
        Buf.buf_get_hdr(buf, hdr);
    }
    switch (operation) {
      case 'TRANSREQ':
        self.init(Operation.TRANSREQ, hdr, getData(data));
        self.tid = Perv.int_of_string(tid);
        self.hostport = Net.port_of_param(hostport);
        self.sendport = Net.port_of_param(sendport);
        return 1;
        break;
      case 'TRANSREP':
        // TRANSREP for a client on this host
        self.init(Operation.TRANSREP, hdr, getData(data));
        self.hostport = Net.port_of_param(hostport);
        self.sendport = Net.port_of_param(sendport);
        self.tid = Perv.int_of_string(tid);
        return 1;
        break;
      case 'LOOKUP':
        buf = Buf.Buffer(getData(xml));
        hdr.h_port = Buf.buf_get_port(buf);
        self.init(Operation.LOOKUP, hdr);
        return 1;
        break;
      case 'IAMHERE':
        buf = Buf.Buffer(getData(xml));
        hdr.h_port = Buf.buf_get_port(buf);
        self.init(Operation.IAMHERE, hdr);
        self.hostport = Net.port_of_param(hostport);
        self.sendport = Net.port_of_param(sendport);
        return 1;
        break;
      case 'WHEREIS':
      case 'HEREIS':
        self.init(Operation.IAMHERE, hdr);
        self.hostport = Net.port_of_param(hostport);
        self.sendport = Net.port_of_param(sendport);
        return 1;
        break;
      default:
        return 0;
        
    }
};

/** Encode RPCIO packet to JSON object
 *
 * @param {string} format simple/extended
 * @returns {string}
 */
rpcio.prototype.to_json=function(format) {
    var self=this;
    
    var obj={},buf;
    buf = Buf.Buffer();
    Buf.buf_put_hdr(buf, this.header);
    String.match(format,[
        ['simple',function() {
            obj = {header:Buf.buf_to_hex(buf),data:Buf.buf_to_hex(self)};
        }],
        ['extended',function(){
            obj = { 
              operation: Operation.print(self.operation),
              hostport: self.hostport,
              sendport: self.sendport,
              tid: self.tid,
              header: Buf.buf_to_hex(buf),
              data: Buf.buf_to_hex(self)
            }
        }]
    ]);
    return obj;
};

/** Decode JSON object to RPCIO
 *
 */
rpcio.prototype.of_json=function(obj,format) {
    var self=this,
        header=obj.header,
        data=obj.data,
        buf,
        hostport = obj.hostport,
        sendport = obj.sendport,
        operation = obj.operation||'',
        tid = obj.tid,
        hdr = Net.Header();
// console.log(obj)
    if (header != undefined) {
        buf = Buf.Buffer();
        Buf.buf_of_hex(buf, header);
        Buf.buf_get_hdr(buf, hdr);
    }
    switch (operation) {
      case 'TRANSREQ':
        self.init(Operation.TRANSREQ, hdr, data);
        self.tid = Perv.int_of_string(tid);
        self.hostport = hostport;
        self.sendport = sendport;
        return 1;
        break;
      case 'TRANSREP':
        // TRANSREP for a client on this host
        self.init(Operation.TRANSREP, hdr, data);
        self.hostport = hostport;
        self.sendport = sendport;
        self.tid = Perv.int_of_string(tid);
        return 1;
        break;
      case 'LOOKUP':
        buf = Buf.Buffer(data);
        hdr.h_port = Buf.buf_get_port(buf);
        self.init(Operation.LOOKUP, hdr);
        self.hostport = hostport;
        return 1;
        break;
      case 'IAMHERE':
        buf = Buf.Buffer(data);
        hdr.h_port = Buf.buf_get_port(buf);
        self.init(Operation.IAMHERE, hdr);
        self.hostport = hostport;
        self.sendport = sendport;
        return 1;
        break;
      case 'WHEREIS':
      case 'HEREIS':
        self.init(Operation.IAMHERE, hdr);
        self.hostport = hostport;
        self.sendport = sendport;
        return 1;
        break;
      default:
        return 0;
    }
};

/** A RPC connection. Used by the router only.
 *
 * @param {port} port
 * @param {function(rpcio)|undefined} [send]
 * @param {function()} [alive]
 * @constructor
 */
var rpcconn = function (port,send,alive) {
    this.port=port;
    // function(rpcio,callback?)
    // type callback is function (stat,rpcio)
    this.send=send;
    this.alive=alive||function() {return false;};
    this.multiport=false;
    this.stats = {
        op_ask:0,
        op_brokerrep:0,
        op_brokerreq:0,
        op_get:0,
        op_messages:0,
        op_notify:0,
        op_put:0,
        
        op_broadcast:0,
        op_forward:0,
        op_schedule:0,

        op_alive:0,
        op_send:0,

        op_link:0,
        op_unlink:0,
        op_receive:0,

        op_ping:0,
        op_pong:0,

        op_error:0,
        op_noentr:0

    }
};

/**
** RPC Transaction Object
 *
 *
 * @param {rpcrouter} router
 * @constructor
 * @typedef {{router:rpcrouter}} rpcint~obj
 * @see rpcint~obj
 * @see rpcint~meth
 */
 
// function (router:rpcrouter) -> rpcint template
var rpcint = function (router) {
    // RPC message router
    this.router=router;
};


/**
 * @typedef {{trans:rpcint.trans,getreq:rpcint.getreq,putrep:rpcint.putrep}} rpcint~meth
 */
/**
** Client Interface
** Optional callback: function(rpcio)
 *
 * @param {rpcio} rpcio
 * @param {function} [callback]
 */
rpcint.prototype.trans = function(rpcio,callback) {
    var rpcio=rpcio;
    var hdr=rpcio.header;
    Sch.Suspend();
    rpcio.operation=Operation.TRANSREQ;
    rpcio.context=Sch.GetCurrent();
    rpcio.callback=callback;
    rpcio.tid=transaction_id();
    rpcio.hostport=this.router.hostport;
    this.router.route(rpcio);
};

/**
** Server interface
 *
 *
 * @param {rpcio} rpcio
 */
rpcint.prototype.getreq = function (rpcio) {
    rpcio.pubport=Net.prv2pub(rpcio.header.h_port);
    rpcio.operation=Operation.GETREQ;
    Sch.Suspend();
    rpcio.context=Sch.GetCurrent();
    this.router.route(rpcio)
};
/**
 *
 * @param {rpcio} rpcio
 */
rpcint.prototype.putrep = function (rpcio) {
    rpcio.operation=Operation.PUTREP;
    this.router.route(rpcio);
};

module.exports = {
    Rpcio: Rpcio,
    /**
     *
     * @param {rpcrouter} router
     * @returns {rpcint}
     */
    RpcInt: function(router) {
        var obj = new rpcint(router);
        Object.preventExtensions(obj);
        return obj;
    },
    /**
     * @param {port} port
     * @param {function(rpcio)} [send]
     * @param {function()} [alive]
     * @returns {rpcconn}
     */
    RpcConn: function(port,send,alive) {
        var obj = new rpcconn(port,send,alive);
        Object.preventExtensions(obj);
        return obj;
    },
    Print: {
        rpcio: function(rpcio) {
            if (rpcio) {
                var str = '{';
                str = str + 'header: ' + Net.Print.header(rpcio.header) + ', ';
                if (rpcio.data!=undefined) str = str + 'data[' + rpcio.data.length + '], ';
                str = str + 'hostport: ' + Net.Print.port(rpcio.hostport);
                str = str + ' connport: ' + Net.Print.port(rpcio.connport);
                str = str + ' sendport: ' + Net.Print.port(rpcio.sendport);
                if (rpcio.tid>=0) str = str + ', tid: ' + rpcio.tid;
                if (rpcio.operation!=undefined) str = str + ', operation: ' + Operation.print(rpcio.operation);
                if (rpcio.timeout>0) str=str + ', timeout: '+rpcio.timeout;
                if (rpcio.status!=undefined) str=str + ', status: '+Net.Status.print(rpcio.status);
                if (rpcio.index>=0) str=str + ', index: '+rpcio.index;
                if (rpcio.context!=undefined) str=str + ', context: '+rpcio.context.id;
                str = str + ' hop='+rpcio.hop+' hopmax='+rpcio.hop_max;
                str = str +(rpcio.callback!=undefined?' CB':'')+(rpcio.context!=undefined?' CT':'')+'}';
                return str;
            } else return "undefined";
        }
    },
    Operation:Operation,
    transaction_id:transaction_id
};
