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
 **    $INITIAL:     (C) 2015-2016 bLAB
 **    $CREATED:     4-4-15.
 **    $VERSION:     1.3.17
 **
 **    $INFO:
 **
 ** RPCIO Message ROUTER
 *
 * There are:
 *
 * A. Client-app hosts using Broker (Synchronous HTTP broker connection, i.e., Browsers, Asynchronous/Synchronous TCPNET broker connection)
 * B. Client-app hosts P2P (UDP VLC connection)
 * C. Broker Server (servicing client HTTP / TCPNET connctions)
 * D. Mixed app-mode B+C
 *
 *
 * The router passes RPC messages (trans, getreq, putrep, lookup, iamhere,...) between different
 * processes of a host (local routing), manages synchronization with the scheduler, sends messages
 * to a broker server, and collects messages from a broker server (if this is a broker client
 * application). The router manages server port look-ups, generates lookup messages, queues
 * transactions, and is the interface between processes and the network. Finally, the router forwards
 * messages between different nodes using P2P connections.
 **
 **    $ENDOFINFO
 */

"use strict";
var log = 0;
var timestamp=0;

var util = Require('util');
var Io = Require('com/io');
var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Conn = Require('dos/connutils');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var String = Comp.string;
var Obj = Comp.obj;
var Array = Comp.array;
var Printf = Comp.printf;
var xmldoc = Require('dos/ext/xmldoc');
var trace = Io.tracing;
var Status = Net.Status;
var assert = Comp.assert;
var div = Comp.div;

var PORT_CACHE_MAXLIVE = 200;

/*
** Allocate pool table in chunks of size...
 */
var CHUNK_SIZE = 100;

/**
** The router passes RPC IO handlers from clients
** to servers and vice versa. The two different router modes: server (http server capable)
** and application mode (only http client capable) and requiring a broker server for global routing.
**
** There are :
**  1. Local Servers (getreq, putrep)
**  2. Local Clients (trans)
**  3. Remote Servers
**  4. Remote Clients
 *
** There are:
 *  1. Broker Client Apps (Browser-app, node-app)
 *  2. P2P Client Apps (node-app, broker)
 *  3. Server Apps (broker)
 *
** The router must be configured differently for client applications (Browser comp.) and
** the broker server (node.js comp.). Additionally, a client app. can be hosted (node.js comp.),
** embedding the broker server. The broker server includes a in-memory DNS server.
 *
 *
 * @param {port} hostport
 * @constructor
 * @typedef {{hostport:port,broker:httpConnection,connections:rpcconn [],trans_queue:[],req_queue:[],lookup_queue:[],lookup_cache:[],port_mapping:[],
 *            host_mapping:[],rpcio_pool:rpcio [],rpcio_pool_head,rpcio_pool_size,rpcio_pool_next,event:function(),
 *            stats}} rpcrouter~obj
 * @see rpcrouter~obj
 * @see rpcrouter~meth
 */
var rpcrouter = function (hostport,options) {
    this.options=options||{};
    // this public host port
    this.hostport=hostport;
    // Is the router used by a broker server?
    this.broker=undefined;
    
    // Connection to a broker (HTTP client mode, Browser App.) : Connection
    this.brokerconn=undefined;
    this.brokerserver=false;

    // Connections links to other nodes, only in Server-App. mode used (broker server, node) : [rpcconn]
    this.connections=[];

    // Local service: transaction queue (local and remote transactions serviced locally)
    this.trans_queue=[];
    // Local service: local server request queue
    this.req_queue=[];

    // Pending lookup of service ports (rpcio array)
    this.lookup_queue=[];
    // Cache all client hosts checking already for a server port
    this.lookup_cache=[];

    /*
    ** Host/Application port -- Server port mapping
    ** Hash table: key:public app-server port, value: public host port
    ** port_mapping[srvport]==hostport
    */
    this.port_mapping=[];           // server port => host port
    this.port_mapping_live=[];      // Timeout for garbage colletion

    /*
    ** Hostport routing table
     ** Hash table: key:public host port, value: connection port
     ** host_mapping[hostport]==[url,ipport]
    **
    */
    this.host_mapping=[];           // host port => connection link port
    this.host_mapping_live=[];

    /*
    ** Semi-static packet pool (rpcio ~ RPC/FLIP packet)
    */
    this.rpcio_pool=[];
    this.rpcio_pool_head=-1;
    this.rpcio_pool_size=0;
    this.rpcio_pool_next=-1;

    /*
    ** Externally supplied event handler(s)
     */
    this.event=[];

    this.stats = {
        op_transreq:0,
        op_transrep:0,
        op_getreq:0,
        op_putrep:0,
        op_lookup:0,
        op_whereis:0,
        op_hereis:0,
        op_iamhere:0,
        op_brokerreq:0,
        op_brokerrep:0,
        op_brokernoent:0,
        op_transabort:0,
        op_lookupabort:0,
        op_error:0
    };

    this.monitor=this.options.monitor||0;
    this.verbose=this.options.verbose||0;
};


/**
 * @typedef {{route:rpcrouter.route}} rpcrouter~meth
 */

/**
 ** Add a client-to-broker connection.
 ** A HTTP or TPCNET broker connection is used by a client application. The connection
 ** provides the send and service operations to the broker server.
 *
 *
 * @param {httpConnection} conn
 */
rpcrouter.prototype.set_broker_conn = function(conn) {
    this.brokerconn=conn;
    this.add_conn(conn.rpccon);
};

/**
 * Add a broker server object (i.e., the router is used by a broker server).
 */
rpcrouter.prototype.set_broker = function(service) {
    this.broker=service;
};

rpcrouter.prototype.log = function(v) {
    log=v;
};

/**
 * Add an optional event handler called each time the trans_queue,.., are modified.
 *
 * @param {function} evfun
 */
rpcrouter.prototype.add_event = function(evfun) {
    this.event.push(evfun);
};

/*
** Packet pool (rpcio handle) management
*/

rpcrouter.prototype.pkt_alloc = function() {
    var rpcio;
    var off=this.rpcio_pool_size;
    for(var i=0;i<CHUNK_SIZE;i++) {
        rpcio=Rpc.Rpcio();
        this.rpcio_pool.push(rpcio);
    }
    this.rpcio_pool_size=this.rpcio_pool_size+CHUNK_SIZE;
};

/**
 * Init a packet rpcio object
 *
 * @param {rpcio} rpcio
 */
rpcrouter.prototype.pkt_init = function(rpcio) {
    rpcio.operation=undefined;
    rpcio.pubport=undefined;
    rpcio.connport=undefined;
    rpcio.header.h_status=undefined;
    rpcio.header.h_command=undefined;
    rpcio.header.h_port=Net.Port();
    rpcio.header.h_priv=Net.Private();
    rpcio.hostport=undefined;
    rpcio.sendport=undefined;
    rpcio.data=new Buffer('');
    rpcio.pos=0;
    rpcio.tid=-1;
    rpcio.timeout=-1;
    rpcio.hop=0;
    rpcio.hop_max=Net.DEF_RPC_MAX_HOP;
    rpcio.status=undefined;
    rpcio.context=undefined;

};

/**
 * Get a packet rpcio object from the pool.
 *
 * @returns {rpcio}
 */
rpcrouter.prototype.pkt_get = function() {
    var next=-1;
    var rpcio;
    if (this.rpcio_pool_next >= 0) {
        next=this.rpcio_pool_next;
        this.rpcio_pool_next=-1;
    } else if (this.rpcio_pool_head==this.rpcio_pool_size-1) {
        // Try to find a free slot
        loop: for(var i=0;i<this.rpcio_pool_size;i++) {
            if (this.rpcio_pool[i].index==-1) {next=i; break loop;}
        }
        if (next==-1) {
            next=this.rpcio_pool_head;
            this.rpcio_pool_head++;
            this.pkt_alloc();
        }
    } else {
        next= this.rpcio_pool_head;
        this.rpcio_pool_head++;
        if (this.rpcio_pool_head>=this.rpcio_pool_size)
            this.pkt_alloc();
    }
    if (next!=-1) {
        rpcio = this.rpcio_pool[next];
        // Only a handle in use has a valid index value!
        rpcio.index=next;
        this.pkt_init(rpcio);
    }
    else rpcio = undefined;
    return rpcio;
};

/**
 * Return a packet rpcio object to the pool.
 *
 * @param {rpcio} rpcio
 */
rpcrouter.prototype.pkt_discard = function(rpcio) {
    if (rpcio.index != -1) this.rpcio_pool_next=rpcio.index;
    else Io.warn('pkt_discard: packet not from packet pool! '+Rpc.Print.rpcio(rpcio));
    // mark rpcio packet handle as free!
    rpcio.index=-1;
    rpcio.data=undefined;
};

/**
** Add and remove local service ports (register public port of a server)
*
 *
 * @param {port} srvport
 * @param {port} [hostport]
 * @param [timeout]
 */
rpcrouter.prototype.add_port = function(srvport,hostport,timeout) {
    var exists=false;
    if (hostport==undefined) hostport=this.hostport;
    if (this.port_mapping[srvport] != undefined) exists=true;
    this.port_mapping[srvport]=hostport;
    if (timeout != undefined)
        this.port_mapping_live[srvport]=timeout;
    else
        this.port_mapping_live[srvport]=PORT_CACHE_MAXLIVE;
    // forward local server ports to the broker server if in client appl. mode
    if (!exists && this.brokerconn && this.brokerconn.status == Net.Status.STD_OK && Net.port_cmp(hostport,this.hostport)) {
        // short message
        
        Io.log((this.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] add_port: publishing port on broker '+Net.Print.port(srvport)));
        var msg = {type:'iamhere',hostport:this.hostport,srvport:srvport};
        this.brokerconn.send(msg,function (reply) {
            Io.log((log<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] add_port: got answer from broker '+reply));
        })
    } else if (!exists) {
        Io.log((this.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] add_port: publishing port '+Net.Print.port(srvport)));
    
    }
};

/**
 *
 * @param {port} srvport
 */
rpcrouter.prototype.remove_port = function(srvport) {
    this.port_mapping[srvport]=undefined;
};

/**
 *
 * @param {port} srvport
 * @returns {port}
 */
rpcrouter.prototype.lookup_port = function(srvport) {
    var found = this.port_mapping[srvport] ;
    // Refresh live time
    if (found!= undefined && this.port_mapping_live[srvport]>0)
        this.port_mapping_live[srvport]=PORT_CACHE_MAXLIVE;
    return found;
};

/**
** Add a local RPC service listener (ready getreq called by a server)
 *
 *
 * @param rpcio
 */
rpcrouter.prototype.add_service = function(rpcio) {
    this.req_queue.push(rpcio);
};

/** Find a RPC service listener (matching getreq)
 *
 * @param {port} port
 * @param {rpcio} rpcio
 * @param {function} callback
 * @returns {rpcio}
 */
rpcrouter.prototype.lookup_service = function(port,rpcio,callback) {
    var found=undefined;
    loop: for (var i in this.req_queue) {
        var rpcios=this.req_queue[i];
        // public port compare
        if (Net.port_cmp(rpcios.pubport,port)) {
            // TBD check valid hdr.hdr_priv field
            found=rpcios;
            Net.Copy.header(rpcio.header,rpcios.header);
            rpcios.tid=rpcio.tid;
            Buf.buf_copy(rpcios,rpcio);
            if (callback != undefined) rpcios.callback=callback;
            this.req_queue.splice(i,1);
            break loop;
        }
    }
    return found;
};

/**
** Add a local (client&server appl.) or remote (server app. only) pending transaction 
** (1. local server not ready, but it is registered, 2. remote client has not downloaded the request)
 *
 *
 * @param {rpcio} rpcio
 */
rpcrouter.prototype.add_trans = function(rpcio) {
    this.trans_queue.push(rpcio);
    /*
    ** Trigger a callback notification function that handles transaction queue updates. It is optional.
     */
    if (this.event.length>0)
      Array.iter(this.event,function (f) {f()});
};

/** Remove a RPCIO transaction from the queue.
 *
 * @param rpcio
 * @returns {boolean}
 */
rpcrouter.prototype.remove_trans = function(rpcio) {
    var found=false;
    loop: for (var i in this.trans_queue) {
        var rpcioc=this.trans_queue[i];
        if (rpcioc.index==rpcio.index) {
            found=true;
            this.trans_queue.splice(i,1);
            break loop;
        }
    }
    return found;
};

/** Find and remove a queued transaction for public RPC server port 'port'.
**
 *
 * @param {port} srvport
 * @param {rpcio} rpcio
 * @returns {rpcio}
 */
rpcrouter.prototype.lookup_trans = function(srvport,rpcio) {
    var rpcios=rpcio;
    var found=undefined;
    loop: for (var i in this.trans_queue) {
        var rpcioc=this.trans_queue[i];
        // public port compare

        // TBD
        if (rpcioc.operation==Rpc.Operation.TRANSREQ && Net.port_cmp(rpcioc.header.h_port,srvport)) {
            // TBD check valid hdr.hdr_priv field
            found=rpcioc;
            if (rpcios != undefined) {
                Net.Copy.header(rpcioc.header,rpcios.header);
                Buf.buf_copy(rpcios,rpcioc);
                rpcios.tid = rpcioc.tid;
                if (rpcioc.callback != undefined) rpcios.callback = rpcioc.callback;
            }
            this.trans_queue.splice(i,1);
            break loop;
        }
    }
    return found;
};

/** Find and remove a queued transaction for:
**  1. A server on host 'hostport' (TRANSREQ)
**  2. A client on host 'hostport' (TRANSREP)
 *
 *
 * @param {port} hostport
 * @param {rpcio} [rpcio]
 * @returns {rpcio}
 */
rpcrouter.prototype.lookup_trans_for_host = function(hostport,rpcio) {
    var rpcios=rpcio;
    var found=undefined;
    loop: for (var i in this.trans_queue) {
        var rpcioc=this.trans_queue[i];
        // public port compare
        var hostport2 = this.lookup_port(rpcioc.header.h_port);
        Io.log((this.monitor<10)||('[ROUT'+(timestamp?Perv.mtime():'')+'] lookup_trans_for_host: '+
                          Net.Print.port(hostport)+'? '+Net.Print.port(rpcioc.header.h_port)+' -> '+Net.Print.port(hostport2)));
        if ((hostport2 && rpcioc.operation==Rpc.Operation.TRANSREQ && Net.port_cmp(hostport,hostport2)) ||
            (rpcioc.sendport && rpcioc.operation==Rpc.Operation.TRANSREP && Net.port_cmp(hostport,rpcioc.sendport)) ||
            (rpcioc.sendport && rpcioc.operation==Rpc.Operation.TRANSREQ && Net.port_cmp(hostport,rpcioc.sendport))) {
            found=rpcioc;
            if (rpcios != undefined) {
                Net.Copy.header(rpcioc.header,rpcios.header);
                Buf.buf_copy(rpcios,rpcioc);
                rpcios.tid = rpcioc.tid;
                if (rpcioc.callback != undefined) rpcios.callback = rpcioc.callback;
            }
            this.trans_queue.splice(i,1);
            break loop;
        }
    }
    return found;
};

/** Find and remove a queued waiting transaction with transaction number tid
 *  Default expected operation: TRANSAWAIT (can be overriden).
 *
 * @param {port} srvport
 * @param {number} tid
 * @param {rpcio} [rpcio]
 * @param {Operation} [operation]
 * @returns {rpcio}
 */
rpcrouter.prototype.lookup_trans_await = function(srvport,tid,rpcio,operation) {
    var rpcios=rpcio;
    var found=undefined;
    loop: for (var i in this.trans_queue) {
        var rpcioc=this.trans_queue[i];
        // public port compare
        if (rpcioc.operation==(operation||Rpc.Operation.TRANSAWAIT) &&
            rpcioc.tid==tid && Net.port_cmp(rpcioc.header.h_port,srvport))  {
            found=rpcioc;
            if (rpcios != undefined) {
                Net.Copy.header(rpcios.header,rpcioc.header);
                Buf.buf_copy(rpcioc,rpcios);
                rpcioc.tid = rpcios.tid;
            }
            this.trans_queue.splice(i,1);
            break loop;
        }
    }
    return found;
};

/** Find all queued waiting transactions for the specified RPC server port.
 *
 *
 * @param {port} srvport
 * @returns {rpcio []}
 */
rpcrouter.prototype.find_all_trans = function(srvport) {
    var found=[];
    for (var i in this.trans_queue) {
        var rpcioc=this.trans_queue[i];
        // public port compare
        if (Net.port_cmp(rpcioc.header.h_port,srvport))  {
            found.push(rpcioc);
        }
    }
    return found;
};


/**
 ** Create and add a new pending RPC server lookup (register public port of a server)
 *
 *
 * @param {port} srvport
 * @returns {rpcio}
 */
rpcrouter.prototype.new_lookup = function(srvport) {
    var i,found;
    found=undefined;
    loop: for(i in this.lookup_queue) {
        var lookup=this.lookup_queue[i];
        if (Net.port_cmp(lookup.header.h_port,srvport) &&
            Net.port_cmp(lookup.hostport,this.hostport)) {
            found=lookup;
            break loop;
        }
    }
    if (!found) {
        var rpcio=this.pkt_get();
        rpcio.init(Rpc.Operation.LOOKUP);
        rpcio.header.h_port=srvport;
        rpcio.hostport=this.hostport;
        rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
        this.lookup_queue.push(rpcio);
        this.lookup_cache.push([]);
        found=rpcio;
    }
    return found;
};

/**
 ** Add a pending RPC server lookup
 *
 *
 * @param {rpcio} rpcio
 */
rpcrouter.prototype.add_lookup = function(rpcio) {
    var i,found;
    found=undefined;
    loop: for(i in this.lookup_queue) {
        var lookup=this.lookup_queue[i];
        if (Net.port_cmp(lookup.header.h_port,rpcio.header.h_port)) {
            found=lookup;
            break loop;
        }
    }
    if (!found) {
        this.lookup_queue.push(rpcio);
        this.lookup_cache.push([]);
    }
    if (this.event.length>0)
      Array.iter(this.event,function (f) {f()});
};

/** Remove all pending LOOKUPs for specified RPC server port.
 *  Return all found LOOKUP messages.
 *
 * @param {port} srvport
 * @returns {rpcio []}
 */
rpcrouter.prototype.remove_lookup = function(srvport) {
    var i;
    var found = [];
    loop: for(i in this.lookup_queue) {
        var lookup=this.lookup_queue[i];
        if (Net.port_cmp(lookup.header.h_port,srvport)) {
            this.lookup_queue.splice(i,1);
            this.lookup_cache.splice(i,1);
            found.push(lookup);
            //this.pkt_discard(lookup);
        }
    }
    return found;
};

/** Host to connection link port (route to host) mapping
 *
 * @param {port} hostport
 * @param {port} connport
 */
rpcrouter.prototype.add_host = function(hostport,connport) {
    this.host_mapping[hostport]=connport;
    this.host_mapping_live[hostport]=PORT_CACHE_MAXLIVE;
};

/**
 *
 * @param {port} hostport
 */
rpcrouter.prototype.remove_host = function(hostport) {
    this.host_mapping[hostport]=undefined;
    this.host_mapping_live[hostport]=undefined;
};

/**
 *
 * @param {port} hostport
 * @param {port} connport
 */
rpcrouter.prototype.update_host = function(hostport,connport) {
    this.host_mapping[hostport]=connport;
    this.host_mapping_live[hostport]=PORT_CACHE_MAXLIVE;
};
/** Return the communication port that connects the endpoint of the path to the host.
 *
 * @param {port} hostport
 * @returns {port}
 */
rpcrouter.prototype.lookup_host = function(hostport) {
    var found = this.host_mapping[hostport];
    if (found!=undefined) this.host_mapping_live[hostport]=PORT_CACHE_MAXLIVE;
    return found;
};

/**
 ** Add a pending host  lookup (find connection link port to host)
 *
 *
 * @param {port} hostport
 * @returns {rpcio}
 */
rpcrouter.prototype.add_hostlookup = function(hostport) {
    var i,found;
    found=undefined;
    for(i in this.lookup_queue) {
        var lookup=this.lookup_queue[i];
        if (Net.port_cmp(lookup.sendport,hostport)) found=lookup;
    }
    if (!found) {
        var rpcio=this.pkt_get();
        rpcio.init(Rpc.Operation.WHEREIS);
        rpcio.hostport=this.hostport;
        rpcio.sendport=hostport;
        rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
        this.lookup_queue.push(rpcio);
        this.lookup_cache.push([]);
        found=rpcio;
    }
    return found;
};

/**
 *
 * @param {port} hostport
 */
rpcrouter.prototype.remove_hostlookup = function(hostport) {
    var i;
    var found=[];
    loop: for(i in this.lookup_queue) {
        var lookup=this.lookup_queue[i];
        if (Net.port_cmp(lookup.header.h_port,Net.nilport) &&
            Net.port_cmp(lookup.sendport,hostport)) {
            this.lookup_queue.splice(i,1);
            this.lookup_cache.splice(i,1);
            found.push(lookup);
            //this.pkt_discard(lookup);
        }
    }
    return found;
};

/** Add a connection link to this router.
 *
 * @param {rpcconn} conn
 */
rpcrouter.prototype.add_conn = function(conn) {
    this.connections[conn.port]=conn;
};

/** Remove a connection link.
 *
 * @param {rpcconn} conn
 */
rpcrouter.prototype.remove_conn = function(conn) {
    this.connections[conn.port]=undefined;
};

/** Find a connection link by its connection port.
 *
 * @param {port} connport
 * @returns {rpcconn}
 */
rpcrouter.prototype.find_conn = function(connport) {
    return this.connections[connport];
};

/** Set default cache table entry timeout
 *
 * @param tmo
 */
rpcrouter.prototype.set_cachetimeout = function (tmo) {
    PORT_CACHE_MAXLIVE=tmo;
};

/** Broadcast a message (e.g., LOOKUP) to all known connection links w/o the
 *  rpcio.connport link (was the incoming link of rpcio message).
 *
 * @param rpcio
 */
rpcrouter.prototype.broadcast = function(rpcio) {
    var self=this,
        buf,msg,data;
    for (var i in this.connections) {
      var conn=self.connections[i];
      if (conn.alive() && conn.send!=undefined && !Net.Equal.port(conn.port,rpcio.connport)) conn.send(rpcio);
    }
    // TWOCHAN message broadcasting?
    if (this.broker.broadcast) {
      switch (rpcio.operation) {
        case Rpc.Operation.LOOKUP:
          buf = Buf.Buffer();
          Buf.buf_put_port(buf, rpcio.header.h_port);
          data = [{rpc:'lookup',hostport:rpcio.hostport,
                     data:Buf.buf_to_hex(buf)}];
          msg = {type:'broadcast',data:data};
          this.broker.broadcast(msg);
          // console.log(msg)
          break;
      }
    }
};

/**
 *
 * @param rpcio
 * @param [connport]
 * @param {function((Status.STD_OK|*),rpcio)} [callback]
 * @returns {number} status
 */
rpcrouter.prototype.forward = function (rpcio,connport,callback) {
    var self=this;
    assert((rpcio!=undefined)||('Router.forward: rpcio undefined'));
    rpcio.hop++;
    var conn = this.find_conn(connport||rpcio.connport);
    if (!conn || conn.send==undefined || !conn.alive() || rpcio.hop > rpcio.max) return 0;
    assert((conn!=undefined)||('Router.forward: invalid connection link '+Net.Print.port(connport||rpcio.connport)));
    conn.send(rpcio,callback);
    //Io.log((log<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] Router.forward, cannot forward: connection '+Net.Print.port(connport||rpcio.connport)+'not alive!'))
    return 1;
};

/** Swap hostport<->sendport
 *
 * @param rpcio
 */
rpcrouter.prototype.swapports = function(rpcio) {
    var tmp = rpcio.hostport;
    rpcio.hostport=rpcio.sendport;
    rpcio.sendport=tmp;
};


/**
 *
 */
rpcrouter.prototype.status = function() {
    var str ='';
    var nl = '\n';
    var i;
    var trans,port,lookup;
    var used=0;
    for(i in this.rpcio_pool) {
        trans = this.rpcio_pool[i];
        if (trans.index!=-1) used++;
    }

    str=str+'RPCIO Pool: '+used+'/'+this.rpcio_pool_size+' (next '+this.rpcio_pool_next+', head '+this.rpcio_pool_head+')'+nl;
    for(i in this.rpcio_pool) {
        trans = this.rpcio_pool[i];
        if (trans.index!=-1) {
            str = str + '  ' + trans.index+': '+Rpc.Operation.print(trans.operation);
            if (trans.timeout>0) str=str+' tmo='+trans.timeout;
            if (trans.tid >= 0) str=str+' tid='+trans.tid;
            if (trans.status) str=str+' status='+Status.print(trans.status);
            if (trans.context) str=str+' context='+trans.context.id;
            if (trans.hostport) str=str+' hostport='+Net.Print.port(trans.hostport);
            if (trans.sendport) str=str+' sendport='+Net.Print.port(trans.sendport);
            if (trans.connport) str=str+' connport='+Net.Print.port(trans.connport);
            str = str + ' hop='+trans.hop+'('+trans.hop_max+')';
            str = str + nl;
        }
    }

    str=str+'Connection Port Table: '+nl;
    for(i in this.connections) {
        var conn = this.connections[i];
        str=str+'  '+Net.Print.port(i)+' -> CON('+
            (conn.send!=undefined?'+SEND ':'')+
            (conn.alive()?'ALIVE':'DEAD')+
            (conn.send==undefined?(' GET='+conn.stats.op_get):(' RCV='+conn.stats.op_receive))+
            (conn.send==undefined?(' PUT='+conn.stats.op_put):(' SND='+conn.stats.op_send))+
            (conn.send==undefined?(' ALV='+conn.stats.op_alive):(' LNK='+conn.stats.op_link))+
            (conn.send==undefined?(' FWD='+conn.stats.op_forward):(' PNG='+conn.stats.op_ping))+
            (conn.send==undefined?(' SCH='+conn.stats.op_schedule):(' POG='+conn.stats.op_pong))+
            (conn.send==undefined?(' MSG='+conn.stats.op_messages):'')+
            (conn.send==undefined?(' ENT='+conn.stats.op_noentr):'')+
            (conn.send==undefined?(' ERR='+conn.stats.op_error):'')+
            ')'+nl;
    }
    str=str+'RPC Server to Host Port Mapping Table: '+nl;
    for(i in this.port_mapping) {
        port = this.port_mapping[i];
        if (port!=undefined)
            str=str+'  '+Net.Print.port(i)+' -> '+Net.Print.port(port)+' ['+this.port_mapping_live[i]+']'+nl;
    }
    str=str+'Host to Connection Port Mapping Table: '+nl;
    for(i in this.host_mapping) {
        port = this.host_mapping[i];
        if (port!=undefined)
            str=str+'  '+Net.Print.port(i)+' -> '+Net.Print.port(port)+' ['+this.host_mapping_live[i]+']'+nl;
    }
    str=str+'Queued RPC Transactions: '+nl;
    for(i in this.trans_queue) {
        trans = this.trans_queue[i];
        str=str+'  '+Net.Print.port(trans.header.h_port)+ ' ['+trans.timeout+'] '+ Net.Command.print(trans.header.h_command)+ nl;
    }
    str=str+'Queued RPC Lookups: LQ['+Array.length(this.lookup_queue)+'] LC['+Array.length(this.lookup_cache)+']'+nl;
    for(i in this.lookup_queue) {
        lookup = this.lookup_queue[i];
        if (lookup.operation == Rpc.Operation.LOOKUP)
            str=str+'  LOOKUP  '+Net.Print.port(lookup.header.h_port)+ ' ['+lookup.timeout+']'+ nl;
        else
            str=str+'  WHEREIS '+Net.Print.port(lookup.sendport)+ ' ['+lookup.timeout+']'+ nl;
    }
    str=str+'Queued RPC Server Requests: '+nl;
    for(i in this.req_queue) {
        trans = this.req_queue[i];
        str=str+'  '+Net.Print.port(trans.header.h_port)+ ' ['+trans.timeout+']'+ nl;
    }
    str=str+nl+'Message Statistics'+nl+'----------------------------------------'+nl;
    /*
    op_transreq:0,
        op_transrep:0,
        op_getreq:0,
        op_putrep:0,
        op_lookup:0,
        op_whereis:0,
        op_hereis:0,
        op_iamhere:0,
        op_brokerreq:0,
        op_brokerrep:0,
        op_brokernoent:0,
        op_transabort:0,
        op_lookupabort:0
    */
    str=str+Printf.sprintf2([['%20s','TRANSREQ'],':',['%8d',this.stats.op_transreq],'  ',['%20s','TRANSREP'],':',['%8d',this.stats.op_transrep]])+nl;
    str=str+Printf.sprintf2([['%20s','GETREQ'],':',['%8d',this.stats.op_getreq],'  ',['%20s','PUTREP'],':',['%8d',this.stats.op_putrep]])+nl;
    str=str+Printf.sprintf2([['%20s','LOOKUP'],':',['%8d',this.stats.op_lookup],'  ',['%20s','IAMHERE'],':',['%8d',this.stats.op_iamhere]])+nl;
    str=str+Printf.sprintf2([['%20s','WHEREIS'],':',['%8d',this.stats.op_whereis],'  ',['%20s','HEREIS'],':',['%8d',this.stats.op_hereis]])+nl;
    if (this.brokerconn != undefined) {
        str = str + Printf.sprintf2([['%20s', 'BROKERREQ'], ':', ['%8d', this.stats.op_brokerreq], '  ', ['%20s', 'BROKERREP'], ':', ['%8d', this.stats.op_brokerrep]]) + nl;
        str = str + Printf.sprintf2([['%20s', 'BROKERNOENT'], ':', ['%8d', this.stats.op_brokernoent]]) + nl;
    }
    str=str+Printf.sprintf2([['%20s','TRANSABORT'],':',['%8d',this.stats.op_transabort],'  ',['%20s','LOOKUPABORT'],':',['%8d',this.stats.op_lookupabort]])+nl;
    return str;
};

/**
** Main entry function for RPC message routing.
** The calling of the routing function expects an already blocked caller process context
** except for remote transaction execution.
 *
 * The router serves different connection modes:
 *
 * 1. Client Router using Broker (supporting only passive receiving)
 * 2. Client Router using P2P (supporting active sending)
 * 3. Broker Server (passive or active sending)
 * 4. Mixed mode: App + Broker
 *
 *
 * @param {rpcio} rpcio
 */
rpcrouter.prototype.route = function(rpcio) {
    var self=this;
    var trans,body,msg,data,path,buf,rpcio2,
        i,conn,connport,hostport,hostsrvport,transl,
        whereis,lookup,lookups,res,rpcios,
        local,hdr;
        
    Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] ON ENTRY: '+Rpc.Print.rpcio(rpcio)));
    Io.trace(trace||('[ROUT] ON ENTRY: '+Rpc.Print.rpcio(rpcio)));

    local = Net.Equal.port(rpcio.hostport,self.hostport);

    hdr=rpcio.header;
    if (rpcio.hop>rpcio.hop_max) {
        Io.log((self.verbose<0)||('[ROUT] Discarding RPCIO message with invalid hop count: '+Rpc.Print.rpcio(rpcio)));
        self.pkt_discard(rpcio);
        return;
    }
    if (rpcio.connport != undefined && rpcio.hostport!=undefined) self.add_host(rpcio.hostport,rpcio.connport);

    switch (rpcio.operation) {
        case Rpc.Operation.TRANSREQ:
            self.stats.op_transreq++;

            hostsrvport = self.lookup_port(hdr.h_port);

            if (hostsrvport && Net.port_cmp(hostsrvport,self.hostport)) {
                Io.log((self.monitor<1)||('[ROUT] TRANSREQ: local RPC server, local (or remote) RPC client!'));
                /******************************************
                ** Local RPC Server AND (Local OR Remote Transaction)!
                ******************************************/
                // Check for local ready servers
                rpcios = self.lookup_service(
                    hdr.h_port,rpcio,
                    function(reply) {
                        // Transfer header and data from server rpcio to client rpcio
                        if (rpcio.status==undefined) rpcio.status=Status.STD_OK; // RPC succeeded, right?

                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Servicing reply callback srvport='+
                                         Net.Print.port(rpcio.header.h_port)+' tid='+rpcio.tid));
                        Io.log((self.monitor<1)||('[ROUT] TRANSREQ: '+Rpc.Print.rpcio(rpcio)));

                        Net.Copy.header(reply.header,rpcio.header);
                        Buf.buf_copy(rpcio,reply);
                        // Remote transaction? Send reply to broker back...
                        if (rpcio.context != undefined) {
                            // Local request already served,
                            // now unblock and schedule the client
                            Sch.Wakeup(rpcio.context);
                            Sch.ScheduleNext();
                        } else {
                            /*
                            ** Remote transaction
                            *  1. Forwarded by a connection link
                            *  2. Handled by the broker
                            */
                            // Swap host- and sendports, update hostport with this hostport!
                            var tmp = rpcio.hostport;
                            rpcio.hostport=self.hostport;
                            rpcio.sendport=tmp;
                            rpcio.operation=Rpc.Operation.TRANSREP;
                            rpcio.hop=0;
                            self.route(rpcio);
                        }
                        // do not pkt_discard(reply)! It comes from outside of the router
                    });
                if (rpcios!=undefined) {
                    // Found server, servers rpcio is already updated, now wake-up server process...
                    Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Being serviced for host '+
                                     Net.Print.port(rpcio.hostport)+': srv='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
                    Sch.Wakeup(rpcios.context);
                    Sch.ScheduleNext();
                } else {
                    // actually no server available, wait ...
                    Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Suspend client for host '+
                                     Net.Print.port(rpcio.hostport)+': srv='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
                    rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                    self.add_trans(rpcio);
                }
            } else if (self.brokerconn && self.brokerconn.status==Net.Status.STD_OK) {
                /*
                ***********************************
                ** Client-App. with Broker connection
                ***********************************
                ** A local transaction request from HERE to be sent to a remote server by using the broker.
                ** TRANSREQ must be forwarded to the broker and finally to the RPC server.
                ** Check rpcio.hostport==this.hostport to avoid message ping-pong loops between broker and this node.
                ** The broker thinks the server is here, we received the message, but it is no longer here.
                ** We do no message forwarding here.
                */
                if (Net.Equal.port(rpcio.hostport,self.hostport)) {
                    /*
                     **
                     ** Application client mode: transaction AND server lookup must be handled by broker server
                     */
                    data = rpcio.to_json('simple');
                    Io.log((self.monitor < 1) || ('[ROUT'+(timestamp?Perv.mtime():'')+
                                                  '] TRANSREQ: Sending message to broker for RPC server ' + 
                                                  Net.Print.port(hdr.h_port) + ' tid ' + rpcio.tid));
                    // Wait for reply, do nothing, add this transaction again to transaction queue
                    Io.log((self.monitor < 1) || ('[ROUT] TRANSREQ: Await, client waiting for reply from RPC server ' + 
                                                  Net.Print.port(hdr.h_port) + ' tid ' + rpcio.tid));
                    rpcio.operation = Rpc.Operation.TRANSAWAIT;
                    rpcio.timeout = Sch.GetTime() + Net.TIMEOUT;
                    self.add_trans(rpcio);
                    msg = {rpc:'trans',hostport:self.hostport,tid:rpcio.tid,data:data};
                    self.brokerconn.send(msg, function (reply) {
                        if (reply.status=='EWOULDBLOCK') {
                          // Expected
                        } else if (reply.status=='EINVALID') {
                            Perv.failwith('[ROUT] TRANSREQ broker HTTP PUT request returns unexpected reply:'+util.inspect(rpcio)+
                                          ', got'+reply);
                        } else {
                            // Cancel transaction!
                        }
                    });
                } else {
                    Io.warn('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: not from here ('+Net.Print.port(rpcio.hostport)+'), discard it: '+Net.Print.header(rpcio.header));
                    self.pkt_discard(rpcio);
                }
            } else if (this.brokerconn) {
                /*
                ***********************************
                ** Client-App. with Broker connection
                ***********************************
                ** Just put it in the transaction queue.
                ** Queue transaction due to lost broker connection!
                ** Must be forwarded later...
                */
                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queuing transaction due to lost broker connection from host '+
                                 Net.Print.port(rpcio.hostport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid+ ' for host'+
                                 Net.Print.port(hostsrvport)));
                rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                self.add_trans(rpcio);
            } else {
                /*
                 **************************
                 ** Client-App. with P2P connection and / or broker
                 **************************
                 ** Just put it in the transaction queue.
                 ** 1. A client app. (the RPC server) must request the transaction for further processing (from broker server).
                 ** 2. If the server port is actually unknown, start lookup(srvport)
                 *  3. The server is located on another P2P-App. host (node), locate server, forward message. TODO
                 */
                if (local && hostsrvport==undefined) {
                    hostsrvport=self.lookup_port(hdr.h_port);
                    if (hostsrvport==undefined) {
                        Io.log((self.monitor < 1) || ('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREQ: Doing lookup for srvport=' + Net.Print.port(hdr.h_port)));
                        lookup = this.new_lookup(hdr.h_port);
                        this.route(lookup);
                    } else {
                        rpcio.sendport=hostsrvport;
                    }
                    Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queuing (local) transaction from host '+
                        Net.Print.port(rpcio.hostport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
                    if (Net.Equal.port(rpcio.hostport,this.hostport)) {
                        // Local transaction client, remote server, pending lookup
                        // rpcio.operation = Rpc.Operation.TRANSAWAIT;
                    }
                    rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                    self.add_trans(rpcio);
                } else if (local && hostsrvport!=undefined) {
                    // Queuing and Forwarding (local) transaction 
                    connport = self.lookup_host(hostsrvport);
                    Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queuing and Forwarding (local) transaction from host '+
                        Net.Print.port(rpcio.hostport) +' to host '+
                        Net.Print.port(hostsrvport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid+
                        ' on connection port '+Net.Print.port(connport)));
                    rpcio.sendport=hostsrvport;
                    if (connport!=undefined) res=self.forward(rpcio, connport);
                    rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                    rpcio.operation=Rpc.Operation.TRANSAWAIT;
                    self.add_trans(rpcio);
                } else if (rpcio.sendport != undefined) {
                    // Discarding or Queuing or Forwarding transaction 
                    connport = self.lookup_host(rpcio.sendport);
                    if (rpcio.hop>=rpcio.hop_max) {
                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Discarding transaction (hop count reached) from host '+
                            Net.Print.port(rpcio.hostport)+' to host '+
                            Net.Print.port(rpcio.sendport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
                        res=1;
                        self.pkt_discard(rpcio);
                    }
                    else if (connport!=undefined) {
                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Forwarding transaction from host '+
                            Net.Print.port(rpcio.hostport)+' to host '+
                            Net.Print.port(rpcio.sendport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid+
                            ' on connection port '+Net.Print.port(connport)));
                        res=self.forward(rpcio, connport, function (stat,rpcio) {self.pkt_discard(rpcio)});
                    }
                    else if (!connport) {
                        /*
                         ** Look-up host port (WHEREIS)!!
                         */
                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queueing and doing host lookup for sendport='+Net.Print.port(rpcio.sendport)));
                        whereis = self.add_hostlookup(rpcio.sendport);
                        rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                        self.add_trans(rpcio);
                        self.route(whereis);
                    }
                    if (res==0) {
                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queuing transaction from host '+
                                Net.Print.port(rpcio.hostport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
                        rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                        self.add_trans(rpcio);
                    }
                } else {
                    // Broker-app RPC client
                    hostsrvport=self.lookup_port(hdr.h_port);
                    conn=undefined;
                    if (hostsrvport==undefined) {
                        Io.log((self.monitor < 1) || ('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREQ: Doing lookup for srvport=' + Net.Print.port(hdr.h_port)));
                        lookup = this.new_lookup(hdr.h_port);
                        this.route(lookup);
                    } else {
                        rpcio.sendport=hostsrvport;
                        connport = self.lookup_host(rpcio.sendport);
                        if (connport) conn = self.find_conn(connport);
                    }


                    if (conn && conn.alive() && conn.send != undefined) {
                        if (rpcio.hop>=rpcio.hop_max) {
                            Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Discarding transaction (hop count reached) from host '+
                                Net.Print.port(rpcio.hostport)+' to host '+
                                Net.Print.port(rpcio.sendport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
                            res=1;
                            self.pkt_discard(rpcio);
                        } else {
                            // Remote RPC server, forward transaction
                            Io.log((self.monitor < 1) || ('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREQ: Forwarding transaction from host ' +
                                Net.Print.port(rpcio.hostport) + ' to host ' +
                                Net.Print.port(rpcio.sendport) + ': srvport=' + Net.Print.port(hdr.h_port) + ' tid=' + rpcio.tid +
                                ' on connection port ' + Net.Print.port(connport)));
                            res = self.forward(rpcio, connport, function (stat, rpcio) {
                                self.pkt_discard(rpcio)
                            });
                        }
                    } else {
                        // Broker-app RPC server?
                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queuing transaction from host '+
                            Net.Print.port(rpcio.hostport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
                        if (Net.Equal.port(rpcio.hostport,this.hostport)) {
                            // Local transaction client, remote server, pending lookup
                            // rpcio.operation = Rpc.Operation.TRANSAWAIT;
                        }
                        rpcio.timeout = Sch.GetTime() + Net.TIMEOUT;
                        self.add_trans(rpcio);
                    }
                }

            }
            break;

        case Rpc.Operation.TRANSREP:
            self.stats.op_transrep++;
            Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREP: for host='+
                Net.Print.port(rpcio.sendport)+' RPC server='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
            if (rpcio.sendport && Net.Equal.port(rpcio.sendport,self.hostport)) {
                /************************************
                 ** Local RPC Client, remote Server!
                 ************************************
                 ** Remote reply for local waiting transaction process
                 */
                // lookup matching TRANSAWAIT rpcio...

                trans = self.lookup_trans_await(rpcio.header.h_port, rpcio.tid, rpcio);
                Io.log((self.monitor < 1) || ('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREP: Matching transaction ' + Rpc.Print.rpcio(trans)));
                if (trans) {
                    trans.status = rpcio.status || trans.header.h_status;
                    trans.operation=Rpc.Operation.TRANSREP;
                    if (trans.callback) trans.callback(trans); else {
                        Sch.Wakeup(trans.context);
                        Sch.ScheduleNext();
                    }
                    self.pkt_discard(rpcio);
                } else {
                    // Sent by the garbage collector?
                    if (rpcio.callback) {
                        rpcio.callback(rpcio);
                        if (rpcio.index!=-1) self.pkt_discard(rpcio);
                    }
                    else if (rpcio.context && Sch.IsBlocked(rpcio.context)) {
                        // Usually the context process will release the package!
                        Sch.Wakeup(rpcio.context);
                        Sch.ScheduleNext();
                    }
                }

            } else if (this.brokerconn && this.brokerconn.status==Net.Status.STD_OK) {
                /*
                 ************************************************
                 ** Client-App. with Broker conenction, Local Server
                 ************************************************
                 ** Send transaction reply to broker
                 */
                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREP: Sending reply to broker for '+
                                 Net.Print.port(rpcio.sendport)+': '+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid));
                data = rpcio.to_json('simple');
                msg = {rpc:'reply',hostport:rpcio.hostport,sendport:rpcio.sendport,
                       tid:rpcio.tid, data:data}
                self.brokerconn.send(msg);
                self.pkt_discard(rpcio);
            } else if (!this.brokerconn) {
                /*
                 **************************
                 ** Client-App. with P2P connection or this is Broker
                 **************************
                 **
                 ** 1a. We are the broker: Queue transaction reply for a Client-app RPC client (!broker.forward)
                 ** 1b. We are the broker: Forward transaction reply to a Client-app RPC client (broker.forward)
                 ** 2. The server is located on another P2P-App. host (node), forward reply message.
                 ** 3. The server is here, forward reply message.
                 */
                if (rpcio.hop == 0) {
                    // Reply from here, set-up rpcio for forwarding...
                    rpcio.connport = undefined;
                }
                
                res = 0;

                if (this.broker.forward) {
                  data = rpcio.to_json('extended');
                  msg = {rpc:'reply',hostport:rpcio.hostport,sendport:rpcio.sendport,
                         tid:rpcio.tid, data:data}
                  res = this.broker.forward(msg);
                }
                if (res == 0) {
                  connport = self.lookup_host(rpcio.sendport);
                  if (connport) {
                    // P2P
                    conn = self.find_conn(connport);
                    if (conn.send != undefined) {
                        Io.log((self.monitor < 1) || ('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREP: Forwarding reply to source host ' +
                            Net.Print.port(rpcio.sendport) +
                            ' on connection port ' +
                            Net.Print.port(connport)));
                        if (rpcio.hop < rpcio.hop_max && !Net.Equal.port(connport, rpcio.connport)) {
                            res = self.forward(rpcio, connport, function (stat, rpcio) {
                                self.pkt_discard(rpcio)
                            });
                        } else {
                            res = 1;
                            self.pkt_discard(rpcio);
                        }
                    } // else queue it!
                  } else {
                    if (rpcio.hop < rpcio.hop_max) {
                        /*
                         ** Look-up host port (WHEREIS)!!
                         */
                        res = 1;
                        Io.log((self.monitor < 1) || ('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREP: Doing WHEREIS and Queuing transaction reply'));
                        rpcio.timeout = Sch.GetTime() + Net.TIMEOUT;
                        this.add_trans(rpcio);  // will wake up pending transaction request (this.event() -> connection.schedule)
                        whereis = self.add_hostlookup(rpcio.sendport);
                        self.route(whereis);
                    } else {
                        res = 1;
                        self.pkt_discard(rpcio);
                    }
                  }
                }
                if (res == 0) {
                    Io.log((self.monitor < 1) || ('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREP: Queuing transaction reply for Broker-App [tid='+rpcio.tid+
                           ']'));
                    rpcio.timeout = Sch.GetTime() + Net.TIMEOUT;
                    this.add_trans(rpcio);  // will wake up pending transaction request (this.event() -> connection.schedule)
                }

            }
            break;

        case Rpc.Operation.GETREQ:
            self.stats.op_getreq++;
            this.add_port(rpcio.pubport);
            trans = this.lookup_trans(rpcio.pubport,rpcio);
            if (trans != undefined) {
                // Matching and pending transaction found, service the request immed. ...
                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] GETREQ: Servicing trans '+Net.Print.port(rpcio.pubport)+' tid '+trans.tid));
                Sch.SetBlocked(false);
            } else {
                // After a TRANS request was received, this process will be woken up by lookup_service and the scheduler!
                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] GETREQ: Waiting '+Net.Print.port(rpcio.pubport)));
                this.add_service(rpcio);
            }
            break;

        case Rpc.Operation.PUTREP:
            self.stats.op_putrep++;
            if (rpcio.callback != undefined) {
                // local transaction, client will be unblocked in callback!
                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] PUTREP: Servicing reply callback '+Net.Print.port(rpcio.pubport)+' tid '+rpcio.tid));
                rpcio.callback(rpcio);
                rpcio.callback=undefined;
            } else {
                // transaction managed by broker
            }
            Sch.SetBlocked(false);
            break;

        case Rpc.Operation.LOOKUP:
            self.stats.op_lookup++;

            if (!this.brokerconn) {
                hostsrvport = undefined;
                hostsrvport = this.lookup_port(hdr.h_port);
                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] LOOKUP RPC Server port ' +
                    Net.Print.port(hdr.h_port) + ' -> Host port? ' +
                    Net.Print.port(hostsrvport)));
                /*
                 **************************
                 ** Client-App. with P2P connection or Broker
                 **************************
                 **
                 ** We are the broker or a P2P-APP:
                 *  1. Check RPC server port, is it here?
                 *  2. Broadcast lookup to all known links of connected hosts excluding the incoming link port
                 *
                 */
                 if (hostsrvport != undefined) {
                    /*
                     ** Send back an IAMHERE message
                     */
                    Io.log((self.monitor < 1) || ('[ROUT' + (timestamp ? Perv.mtime() : '') + '] LOOKUP: Sending IAMHERE reply to host ' +
                        Net.Print.port(rpcio.hostport) + ' for RPC server ' + Net.Print.port(hdr.h_port)));
                    rpcio.operation = Rpc.Operation.IAMHERE;
                    rpcio.hop = 0;
                    rpcio.sendport = rpcio.hostport;
                    rpcio.hostport = hostsrvport;
                    res = self.forward(rpcio, undefined, function (stat, rpcio) {
                        self.pkt_discard(rpcio);
                    });
                } else if (hostsrvport==undefined && rpcio.hop < rpcio.hop_max) {
                    /*
                    ** Broadcast message...
                     */
                    rpcio.hop++;
                    Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] LOOKUP: Broadcasting LOOKUP from host '+
                        Net.Print.port(rpcio.hostport)+' for RPC server '+Net.Print.port(hdr.h_port)));
                    self.broadcast(rpcio);
                    // Maybe we have client-app hosts connected to the broker server, we must add the lookup message to the pending queue!!!
                    if (!local && !self.brokerserver) self.pkt_discard(rpcio);
                    else if (self.brokerserver) {
                        rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                        self.add_lookup(rpcio);
                    }
                }
            }
            break;

        case Rpc.Operation.WHEREIS:
            self.stats.op_whereis++;
            if (Net.Equal.port(rpcio.sendport,self.hostport)) {
                /*
                 ** Send back an HEREIS message
                 */
                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] WHEREIS: Sending HEREIS reply to '+
                    Net.Print.port(rpcio.hostport)));
                rpcio.operation = Rpc.Operation.HEREIS;
                rpcio.hop = 0;
                rpcio.sendport = rpcio.hostport;
                rpcio.hostport = self.hostport;
                res=self.forward(rpcio, undefined, function () {
                    self.pkt_discard(rpcio);
                });
            } else if (rpcio.hop < rpcio.hop_max) {
                // Broadcast message to all connections w/o incoming connection
                rpcio.hop++;
                self.broadcast(rpcio);
                if (!local && !self.brokerserver) self.pkt_discard(rpcio);
                else if (self.brokerserver) {
                    rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                    self.add_lookup(rpcio);
                }
            }
            break;

        case Rpc.Operation.IAMHERE:
            self.stats.op_iamhere++;
            if (this.brokerconn && this.brokerconn.status==Net.Status.STD_OK) {
                /*
                 **************************
                 ** Client-App. with Broker connection
                 **************************/

                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Sending reply to broker from host port '+
                    Net.Print.port(rpcio.hostport)+' for RPC server port '+Net.Print.port(hdr.h_port)));
                // path = '/?rpc=iamhere&hostport='+Net.port_to_str(rpcio.hostport)+'&srvport='+Net.port_to_str(rpcio.header.h_port);
                msg = {rpc:'iamhere',hostport:rpcio.hostport,srvport:rpcio.header.h_port};
                self.brokerconn.send(msg,function () {});
                // self.brokerconn.get(path,function () {});
                self.pkt_discard(rpcio);
            } else if (!this.brokerconn) {
                /*
                 **************************
                 ** Client-App. or Broker with P2P connection
                 **************************
                 */
                // TODO
                if (rpcio.connport!=undefined) {
                    // original host port
                    hostport=rpcio.hostport;
                    if (Net.Equal.port(rpcio.sendport,self.hostport)) {
                        /*
                        ** 1. Destination reached, it is for this host.
                        *  2. We are the broker server: Stalled broker client transaction lookup
                        *  2. We are the broker server: Pending lookup from another host and reply from a broker client
                        */
                        self.add_port(rpcio.header.h_port,rpcio.hostport);
                        transl = self.find_all_trans(rpcio.header.h_port);
                        for(i in transl) {
                            trans=transl[i];
                            if (trans.operation==Rpc.Operation.TRANSREQ) {
                                trans.sendport = rpcio.hostport;
                                if (Net.Equal.port(trans.hostport,self.hostport)) {
                                    // Local transaction client, TRANSREQ already queued
                                    Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Forwarding transaction from host '+
                                        Net.Print.port(trans.hostport)+' to host '+Net.Print.port(trans.sendport)+': srvport='+
                                        Net.Print.port(trans.header.h_port)+' tid='+trans.tid+
                                        ' on connection port '+Net.Print.port(rpcio.connport)));
                                    res=self.forward(trans, rpcio.connport);
                                    trans.operation = Rpc.Operation.TRANSAWAIT;
                                } else {
                                    // Routing only
                                    conn=self.find_conn(rpcio.connport);
console.log(rpcio)
                                    if (conn && conn.send==undefined) {
                                        // Keep transaction queued for Client-App RPC Server
                                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Keeping transaction queued from host '+
                                            Net.Print.port(trans.hostport)+': srvport='+Net.Print.port(trans.header.h_port)+' tid='+trans.tid));
                                    } else {
                                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Forwarding transaction from host '+
                                            Net.Print.port(trans.hostport)+' to host '+Net.Print.port(trans.sendport)+': srvport='+
                                            Net.Print.port(trans.header.h_port)+' tid='+trans.tid+
                                            ' on connection port '+Net.Print.port(rpcio.connport)));
                                        self.remove_trans(trans);
                                        res = self.forward(trans, rpcio.connport, function (stat, rpcio) {
                                            self.pkt_discard(rpcio)
                                        });
                                        if (res == 0) {
                                            // ??

                                        }
                                    }
                                }
                            }
                        }
                        /*
                        ** Check pending LOOKUP messages and forward IAMHERE message...
                         */
                        lookups = self.remove_lookup(rpcio.header.h_port);
                        for (i in lookups) {
                            // stalled lookups
                            lookup=lookups[i];
                            if (lookup.connport != undefined) {
                                conn=self.find_conn(lookup.connport);
                                if (conn && conn.alive() && conn.send != undefined) {
                                    // Forward message...
                                    lookup.operation=Rpc.Operation.IAMHERE;
                                    lookup.sendport=lookup.hostport;
                                    lookup.hostport=hostport;
                                    Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Forwarding IAMHERE from host '+
                                        Net.Print.port(lookup.hostport)+' to host '+
                                        Net.Print.port(lookup.sendport)+' on port '+
                                        Net.Print.port(lookup.connport)));
                                    lookup.hop=0;
                                    res=self.forward(lookup,lookup.connport,function(stat,rpcio){self.pkt_discard(rpcio);});
                                } else self.pkt_discard(lookup);
                            } else self.pkt_discard(lookup);
                        }
                        self.pkt_discard(rpcio);
                    } else {
                        // Forward message...
                        connport=self.lookup_host(rpcio.sendport);
                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Forwarding IAMHERE from host '+
                                            Net.Print.port(rpcio.hostport)+' to host '+Net.Print.port(rpcio.sendport)+' on port '+Net.Print.port(connport)));
                        if (connport && !Net.Equal.port(connport,rpcio.connport) &&
                            rpcio.hop<rpcio.hop_max) res=self.forward(rpcio,connport,function(stat,rpcio){self.pkt_discard(rpcio);});
                        else self.pkt_discard(rpcio);
                        lookups = self.remove_lookup(rpcio.header.h_port);
                        for (i in lookups) {
                            // stalled lookups
                            lookup = lookups[i];
                            self.pkt_discard(lookup);
                        }
                    }
                }
            }
            break;

        case Rpc.Operation.HEREIS:
            self.stats.op_hereis++;
            if (!this.brokerconn) {
                if (rpcio.connport!=undefined) {

                    if (Net.Equal.port(rpcio.sendport,self.hostport)) {
                        // Destination reached, it is for this host.
                        lookups=self.remove_hostlookup(rpcio.hostport);
                        Array.iter(lookups,function(rpcio){self.pkt_discard(rpcio)});
                        do {
                            trans = self.lookup_trans_for_host(rpcio.hostport);
                            if (trans) {
                                Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] HEERIS: Forwarding transaction from host '+
                                    Net.Print.port(trans.hostport)+' to host '+Net.Print.port(trans.sendport)+': srvport='+
                                    Net.Print.port(trans.header.h_port)+' tid='+trans.tid+
                                    ' on connection port '+Net.Print.port(rpcio.connport)));
                                if (Net.Equal.port(trans.hostport,self.hostport)) {
                                    // Local transaction client
                                    res=self.forward(trans, rpcio.connport);
                                    trans.operation = Rpc.Operation.TRANSAWAIT;
                                } else {
                                    // Routing only
                                    self.remove_trans(trans);
                                    res=self.forward(trans, rpcio.connport,function (stat,rpcio) {self.pkt_discard(rpcio)});
                                }

                            }
                        } while (trans != undefined);
                        self.pkt_discard(rpcio);
                    } else {
                        // Forward message...
                        conn=self.lookup_host(rpcio.sendport);
                        Io.log((self.monitor<1)||('[ROUT'+(timestamp?Perv.mtime():'')+'] Forward HEREIS from host '+
                            Net.Print.port(rpcio.hostport)+' to host '+Net.Print.port(rpcio.sendport)+' on port '+Net.Print.port(conn)));
                        if (conn && !Net.Equal.port(conn,rpcio.connport) &&
                            rpcio.hop<rpcio.hop_max) res=self.forward(rpcio,conn,function(stat,rpcio){self.pkt_discard(rpcio);});
                        else self.pkt_discard(rpcio);
                    }
                }
            }
            break;

    }
};


/**
 *
 */
rpcrouter.prototype.init = function() {
    this.rpcio_pool=[];
    this.rpcio_pool_head=0;
    this.rpcio_pool_next=-1;
    for (var i=0;i<CHUNK_SIZE;i++)  this.rpcio_pool.push(Rpc.Rpcio());
    Io.log((this.monitor<1)||('[ROUT] My host port is '+Net.Print.port(this.hostport)));
};

/** Parse a received message
 *
 */
rpcrouter.prototype.parse = function (reply) {
  var i,rpc,rpcio,res,mysrv,
      routed=0,
      self=this;
//console.log(reply)
  if (reply.data==undefined) return 0;
  if (!Obj.isArray(reply.data)) reply.data=[reply.data];
  
  for (i in reply.data) {
     rpc = reply.data[i];
     if (!rpc.operation) switch (rpc.rpc) {
      case ('lookup') : rpc.operation='LOOKUP'; break;
     }
     if (self.brokerconn) self.brokerconn.rpccon.stats.op_messages++;

     rpcio = self.pkt_get();
     res=rpcio.of_json(rpc);
//console.log(rpc)
     if (res==0) {
       self.pkt_discard(rpcio);
       rpcio=undefined;
     }
     else if (rpcio.operation == Rpc.Operation.TRANSREQ) {
       if (rpcio.sendport==undefined) rpcio.sendport = self.hostport; // Nothing to-do?
     }
     else if (rpcio.operation == Rpc.Operation.TRANSREP) {
       // Nothing to-do?
     } else if (rpcio.operation == Rpc.Operation.LOOKUP) {
       self.stats.op_lookup++;
       mysrv = self.lookup_port(rpcio.header.h_port);
       Io.log((self.monitor<1)||('[ROUH'+(timestamp?Perv.mtime():'')+
             '] LOOKUP RPC port ' +Net.Print.port(rpcio.header.h_port) + ' -> Host port ' +Net.Print.port(mysrv)));
       if (mysrv) {
           rpcio.operation= Rpc.Operation.IAMHERE;
           rpcio.sendport = rpcio.hostport;
           rpcio.hostport = self.hostport
       } else {
           self.pkt_discard(rpcio);
           rpcio=undefined;
       }
     }
     Io.log((self.monitor<10)||('[ROUH] Broker Service: received ' + Rpc.Print.rpcio(rpcio)));
     Io.trace(trace||('[ROUH] Broker Service: received ' + Rpc.Print.rpcio(rpcio)));
     if (rpcio) { routed++; self.route(rpcio);}
  }
  return routed;
}

/**
 ** 1. Start a broker service handler (client-side appl.)
 ** 2. Start a garbage collector service handler
 *
 * @param {number} [interval]
 */
rpcrouter.prototype.start = function (interval) {
    var self=this;
    var rpcio,i;

    if (!interval) interval=100;

    var step=interval/20;

    if (this.brokerconn != undefined && this.brokerconn.service != undefined) {
        self.brokerconn.pending=0;
        Io.log((self.monitor<1)||('[ROUT] Starting broker request service '));
        // Install broker service handler
        Sch.AddTimer(interval, 'RPC broker service', function (context) {
            Io.log((self.monitor<3)||('[ROUH] broker.service run '+Status.print(self.brokerconn.status)+ ' '+ self.brokerconn.pending));

            if (self.brokerconn.status==Net.Status.STD_OK && self.brokerconn.pending<=0) {
                var timeout=interval*10;
                self.brokerconn.pending=timeout;
                Io.log((self.monitor<2)||('[ROUH] REQ...'));
                Io.trace(trace||('[ROUH] REQ...'));
                /*
                 ** Check for available TRANS messages for THIS application identified by the app. port (name..) ...
                 ** The broker request is blocked until RPC transactions are available or a timeout occurred.
                 */
                self.brokerconn.service({hostport:self.hostport,timeout:timeout},function (reply) {
                  var  msg,rpc,i,res;
                  self.stats.op_brokerrep++;
                  self.brokerconn.pending=0;
//console.log(reply)                  
                  if (reply.status=='EINVALID') {
                    // Not a valid reply, communication error or wrong server.
                    self.stats.op_error++;
                    self.brokerconn.rpccon.stats.op_error++;
                    Io.out('[ROUH] Received invalid HTTP message w/o data');                  
                  } else if (reply.status!='ENOENTR') {
                      /*
                       ** We can get more than one message contained in the reply: <xml><rpc>..</rpc><rpc>..</rpc>..</xml>
                       ** including lookup/WHOIS messages
                       */  
                      self.parse(reply);
                      // Force new execution of this handler immediately
                      Sch.Wakeup(context);
                      context.timer=Sch.time;
                      Sch.ScheduleNext();
                      
                  } else {
                      self.stats.op_brokernoent++;
                      self.brokerconn.rpccon.stats.op_noentr++;
                      // callback('ENOENTR');
                      // Force new execution of this handler immediately
                      Sch.Wakeup(context);
                      context.timer=Sch.time;
                      Sch.ScheduleNext();
                  }
                });
            } else if (self.brokerconn.status!=Net.Status.STD_OK)  self.brokerconn.pending=0;
              else if (self.brokerconn.pending>0) self.brokerconn.pending=self.brokerconn.pending-step;
        })
    }
    // Install a garbage collector service
    Sch.AddTimer(interval, 'RPC Garbage Collector and Timeout Service', function () {
        var i,remove,trans,lookup,cache,entry,key,live,time,
            lookups=[],
            caches=[],
            transactions=[],
            routing=[],
            hostport;
            
        Io.log((self.monitor<4)||('[ROUG] garbage collector run'));
        // TODO Locking!!!!
        time=Sch.GetTime();
        /*
        ** Pending look-up requests...
         */
        for(i in self.lookup_queue) {
            lookup=self.lookup_queue[i];
            cache=self.lookup_cache[i];
            remove=false;
            if (lookup.timeout > 0 && lookup.timeout <= time) {
                // remove lookup entry, no response
                self.stats.op_lookupabort++;
                remove=true;
                self.pkt_discard(lookup);
                if (lookup.operation == Rpc.Operation.LOOKUP)
                    Io.log((self.verbose<1)||('[ROUG] garbage collector: removing lookup (LOOKUP) for RPC server '+Net.Print.port(lookup.header.h_port)));
                else
                    Io.log((self.verbose<1)||('[ROUG] garbage collector: removing lookup (WHERIS) for host '+Net.Print.port(lookup.sendport)));
            }
            if (!remove) {
                lookups.push(lookup);
                caches.push(cache);
            }
        }
        self.lookup_queue=lookups;
        self.lookup_cache=caches;
        /*
        ** Pending transactions...
         */
        for(i in self.trans_queue) {
            trans=self.trans_queue[i];
            remove=false;
            // TODO: check for successfull server lookups and forward matching transactions... !?
            
            if (trans.timeout > 0 && trans.timeout <= time) {
                self.stats.op_transabort++;
                // Reduce port and host mapping cache lifetimes
                hostport=self.port_mapping[trans.header.h_port];
                if (hostport) {
                  self.port_mapping_live[trans.header.h_port]=1;
                  if (self.host_mapping[hostport]) self.host_mapping_live[hostport]=1;
                }
                
                // remove transaction entry, no response, deliver RPC_FAILURE
                if (trans.operation == Rpc.Operation.TRANSAWAIT) {
                    trans.header.h_status =  Net.Status.RPC_FAILURE;
                    trans.status = Net.Status.RPC_FAILURE;
                    trans.operation = Rpc.Operation.TRANSREP;
                    self.swapports(trans);
                    Buf.buf_init(trans);
                    Buf.buf_put_string(trans,'<status>RPC_FAILURE</status>');
                    if (trans.context) {
                        Sch.Wakeup(trans.context);
                        Sch.ScheduleNext();
                    }
                    remove = true;
                    Io.log((self.verbose<1)||('[ROUG] garbage collector: aborting local transaction to RPC server ' +
                                     Net.Print.port(trans.header.h_port) + ' tid=' + trans.tid));
                } else if (trans.operation == Rpc.Operation.TRANSREQ) {
                    trans.header.h_status = Net.Status.RPC_FAILURE;
                    trans.status = Net.Status.RPC_FAILURE;
                    trans.operation = Rpc.Operation.TRANSREP;
                    self.swapports(trans);
                    Buf.buf_init(trans);
                    Buf.buf_put_string(trans,'<status>RPC_FAILURE</status>');
                    trans.timeout=Sch.GetTime()+Net.TIMEOUT;
                    remove = true;
                    routing.push(trans);
                    Io.log((self.verbose<1)||('[ROUG] garbage collector: removing remote transaction (TRANSREQ) to RPC server ' +
                                     Net.Print.port(trans.header.h_port) + ' tid=' + trans.tid));
                } else if (trans.operation == Rpc.Operation.TRANSREP) {
                    remove = true;
                    self.pkt_discard(trans);
                    Io.log((self.verbose<1)||('[ROUG] garbage collector: removing transaction reply (TRANSREP) from RPC server ' +
                                     Net.Print.port(trans.header.h_port) + ' tid=' + trans.tid));
                }
            }

            if (!remove) transactions.push(trans);
        }
        self.trans_queue=transactions;

        /*
        ** Garbage collection of look-up tables (hash tables)
        */
        for (key in self.port_mapping) {
            if (!Net.Equal.port(self.port_mapping[key],self.hostport)) {
                live = self.port_mapping_live[key];
                if (live == 0) {
                    self.port_mapping_live[key] = undefined;
                    self.port_mapping[key] = undefined;
                } else if (live > 0) self.port_mapping_live[key]--;
            }
        }
        for (key in self.host_mapping) {
            live = self.host_mapping_live[key];
            if (live==0) {
                if (self.verbose>0) 
                  Io.out('[ROUG] Removing host '+Net.Print.port(key));
                self.host_mapping_live[key]=undefined;
                self.host_mapping[key]=undefined;
            } else self.host_mapping_live[key]--;
        }

        for (i in routing) {
            trans=routing[i];
            self.route(trans);
        }
    });

};

/** Stop all services
 *
 */
rpcrouter.prototype.stop = function () {
  Sch.RemoveTimer('RPC Garbage Collector and Timeout Service');
  Sch.RemoveTimer('RPC broker service');
 
}
/**
 *
 * @param  {port} hostport
 * @returns {rpcrouter}
 * @constructor
 */
function RpcRouter(hostport,options) {
    var obj = new rpcrouter(hostport,options);
    Object.preventExtensions(obj);
    return obj;
}

module.exports = {
    RpcRouter: RpcRouter
};
