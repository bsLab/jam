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
 **    $INITIAL:     (C) 2015-2017 bLAB
 **    $CREATED:     4-4-15.
 **    $VERSION:     1.5.2
 **
 **    $INFO:
 **
 ** RPCIO Message ROUTER
 *
 *
 * The router passes RPC messages (trans, getreq, putrep, lookup, iamhere,...) between different
 * processes of a host (local routing), manages process scheudling, and forwards messages to remote processe.
 * The router manages RPC server port look-ups, generates look-up messages, queues
 * transactions, and is the interface between processes and the network. Finally, the router forwards
 * messages between different nodes using MUX (HTTP, TCPNET, FIFO) or P2P communication modules (UDP).
 *
 * Each communication module must be registers using the add_conn({port,send,alive,..}) operation.
 *
 * MUX communication modules handle multiple client connections at once (with one- or two channel client connections), 
 * but wrapped by one communicaiton interface (with a unique communication port on the router side).
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
 */
var rpcrouter = function (hostport,options) {
    this.options=options||{};
    // this public host port
    this.hostport=hostport;
    
    this.log = options.log||Io.out;
    
    // Connections links to other nodes, including MUX communication modules : [rpcconn]
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
        op_transabort:0,
        op_lookupabort:0,
        op_error:0
    };

    this.monitor=this.options.monitor||0;
    this.verbose=this.options.verbose||0;
    this.verbose++;
};


/**
 * @typedef {{route:rpcrouter.route}} rpcrouter~meth
 */


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
 * Init a packet rpcio object
 *
 * @param {rpcio} rpcio
 */
rpcrouter.prototype.pkt_init = function(rpcio) {
  rpcio.init();
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
    if (this.monitor>0) this.log('[ROUT'+(timestamp?Perv.mtime():'')+'] add_port: publishing port '+Net.Print.port(srvport));
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
        if (this.monitor>9) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] lookup_trans_for_host: '+
                                     Net.Print.port(hostport)+'? '+Net.Print.port(rpcioc.header.h_port)+' -> '+Net.Print.port(hostport2));
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
 *  rpcio.connport link (was the incoming link of rpcio message, except for multiport/MUX connections).
 *
 * @param rpcio
 */
rpcrouter.prototype.broadcast = function(rpcio,callback) {
    var self=this,
        cb=function (stat,rpcio) {self.pkt_discard(rpcio)};
    for (var i in this.connections) {
      var conn=self.connections[i];
      if (conn.alive() && conn.send!=undefined && (!Net.Equal.port(conn.port,rpcio.connport) || conn.multiport)) {
        var rpcio2=this.pkt_get();
        rpcio2.copy(rpcio);
        conn.send(rpcio2,cb);
      }
    }
    if (callback) callback(Net.Status.STD_OK,rpcio);
};

/**
 *
 * @param rpcio
 * @param [connport]
 * @param {function((Status.STD_OK|*),rpcio)} [callback]
 * @returns {number} status
 */
rpcrouter.prototype.forward = function (rpcio,connport,callback) {
    var self=this,conn;
    assert((rpcio!=undefined)||('Router.forward: rpcio undefined'));
    rpcio.hop++;
    conn = this.find_conn(connport||rpcio.connport);
    if (!conn || conn.send==undefined || !conn.alive() || rpcio.hop > rpcio.hop_max) return 0;
    assert((conn!=undefined)||('Router.forward: invalid connection link '+Net.Print.port(connport||rpcio.connport)));
    conn.send(rpcio,callback);
    //if (log>0) this.log('[ROUT'+(timestamp?Perv.mtime():'')+'] Router.forward, cannot forward: connection '+Net.Print.port(connport||rpcio.connport)+'not alive!')
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
    var rpcio,trans,port,lookup;
    var used=0;
    for(i in this.rpcio_pool) {
        rpcio = this.rpcio_pool[i];
        if (rpcio.index!=-1) used++;
    }

    str=str+'RPCIO Pool: '+used+'/'+this.rpcio_pool_size+' (next '+this.rpcio_pool_next+', head '+this.rpcio_pool_head+')'+nl;
    for(i in this.rpcio_pool) {
        rpcio = this.rpcio_pool[i];
        if (rpcio.index!=-1) {
            str = str + '  ' + rpcio.index+': '+Rpc.Operation.print(rpcio.operation);
            if (rpcio.timeout>0) str=str+' tmo='+rpcio.timeout;
            if (rpcio.tid >= 0) str=str+' tid='+rpcio.tid;
            if (rpcio.status) str=str+' status='+Status.print(rpcio.status);
            if (rpcio.context) str=str+' context='+rpcio.context.id;
            if (rpcio.hostport) str=str+' hostport='+Net.Print.port(rpcio.hostport);
            if (rpcio.sendport) str=str+' sendport='+Net.Print.port(rpcio.sendport);
            if (rpcio.connport) str=str+' connport='+Net.Print.port(rpcio.connport);
            str = str + ' hop='+rpcio.hop+'('+rpcio.hop_max+')';
            str = str + nl;
        }
    }

    str=str+'Connection Port Table: '+nl;
    for(i in this.connections) {
        var conn = this.connections[i];
        str=str+'  '+Net.Print.port(i)+' -> CON('+
            (conn.alive()?'ALIVE':'DEAD')+
            (conn.stats.op_get?(' GET='+conn.stats.op_get):'')+
            (conn.stats.op_receive?(' RCV='+conn.stats.op_receive):'')+
            (conn.stats.op_put?(' PUT='+conn.stats.op_put):'')+
            (conn.stats.op_send?(' SND='+conn.stats.op_send):'')+
            (conn.stats.op_alive?(' ALV='+conn.stats.op_alive):'')+
            (conn.stats.op_ask?(' ASK='+conn.stats.op_ask):'')+
            (conn.stats.op_notify?(' NOT='+conn.stats.op_notify):'')+
            (conn.stats.op_link?(' LNK='+conn.stats.op_link):'')+
            (conn.stats.op_broadcast?(' BRC='+conn.stats.op_broadcast):'')+
            (conn.stats.op_forward?(' FWD='+conn.stats.op_forward):'')+
            (conn.stats.op_ping?(' PNG='+conn.stats.op_ping):'')+
            (conn.stats.op_schedule?(' SCH='+conn.stats.op_schedule):'')+
            (conn.stats.op_pong?(' POG='+conn.stats.op_pong):'')+
            (conn.stats.op_messages?(' MSG='+conn.stats.op_messages):'')+
            (conn.stats.op_noentr?(' NOE='+conn.stats.op_noentr):'')+
            (conn.stats.op_error?(' ERR='+conn.stats.op_error):'')+
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
    str=str+nl+'RPC Statistics'+nl+'----------------------------------------'+nl;
    /*
    op_transreq:0,
        op_transrep:0,
        op_getreq:0,
        op_putrep:0,
        op_lookup:0,
        op_whereis:0,
        op_hereis:0,
        op_iamhere:0,
        op_transabort:0,
        op_lookupabort:0
    */
    str=str+Printf.sprintf2([['%20s','TRANSREQ'],':',['%8d',this.stats.op_transreq],'  ',['%20s','TRANSREP'],':',['%8d',this.stats.op_transrep]])+nl;
    str=str+Printf.sprintf2([['%20s','GETREQ'],':',['%8d',this.stats.op_getreq],'  ',['%20s','PUTREP'],':',['%8d',this.stats.op_putrep]])+nl;
    str=str+Printf.sprintf2([['%20s','LOOKUP'],':',['%8d',this.stats.op_lookup],'  ',['%20s','IAMHERE'],':',['%8d',this.stats.op_iamhere]])+nl;
    str=str+Printf.sprintf2([['%20s','WHEREIS'],':',['%8d',this.stats.op_whereis],'  ',['%20s','HEREIS'],':',['%8d',this.stats.op_hereis]])+nl;
    str=str+Printf.sprintf2([['%20s','TRANSABORT'],':',['%8d',this.stats.op_transabort],'  ',['%20s','LOOKUPABORT'],':',['%8d',this.stats.op_lookupabort]])+nl;
    return str;
};

/**
** Main entry function for RPC message routing.
** The calling of the routing function expects an already blocked caller process context
** except for remote transaction execution.
 *
 * The router serves different connection modules:
 *
 * 1. Client Router using MUX Broker 
 * 2. Client Router using P2P 
 * 3. Broker Server 
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
        
    if (this.monitor>0) this.log('[ROUT'+(timestamp?Perv.mtime():'')+'] ON ENTRY: '+Rpc.Print.rpcio(rpcio));
    Io.trace(trace||('[ROUT] ON ENTRY: '+Rpc.Print.rpcio(rpcio)));

    local = Net.Equal.port(rpcio.hostport,self.hostport);

    hdr=rpcio.header;
    if (rpcio.hop>rpcio.hop_max) {
        if (this.verbose>0) this.log('[ROUT] Discarding RPCIO message with invalid hop count: '+Rpc.Print.rpcio(rpcio));
        self.pkt_discard(rpcio);
        return;
    }
    if (rpcio.connport != undefined && rpcio.hostport!=undefined) self.add_host(rpcio.hostport,rpcio.connport);

    switch (rpcio.operation) {
        case Rpc.Operation.TRANSREQ:
            self.stats.op_transreq++;

            hostsrvport = self.lookup_port(hdr.h_port);

            if (hostsrvport && Net.port_cmp(hostsrvport,self.hostport)) {
                if (self.monitor>0) self.log('[ROUT] TRANSREQ: local RPC server, local (or remote) RPC client!');
                /******************************************
                ** Local RPC Server AND (Local OR Remote Transaction)!
                ******************************************/
                // Check for local ready servers
                rpcios = self.lookup_service(
                    hdr.h_port,
                    rpcio,
                    function(reply) {
                        // Transfer header and data from server rpcio to client rpcio
                        if (rpcio.status==undefined) rpcio.status=Status.STD_OK; // RPC succeeded, right?

                        if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Servicing reply callback srvport='+
                                                     Net.Print.port(rpcio.header.h_port)+' tid='+rpcio.tid);
                        if (self.monitor>0) self.log('[ROUT] TRANSREQ: '+Rpc.Print.rpcio(rpcio));

                        Net.Copy.header(reply.header,rpcio.header);
                        Buf.buf_copy(rpcio,reply);
                        if (rpcio.context != undefined) {
                            /* Local request already served,
                            ** now unblock and schedule the client
                            */
                            Sch.Wakeup(rpcio.context);
                            Sch.ScheduleNext();
                        } else {
                            /*
                            ** Remote transaction
                            *  1. Forwarded to a connection link
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
                    if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Being serviced for host '+
                                                 Net.Print.port(rpcio.hostport)+': srv='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
                    Sch.Wakeup(rpcios.context);
                    Sch.ScheduleNext();
                } else {
                    // actually no server available, wait ...
                    if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Suspend client for host '+
                                                 Net.Print.port(rpcio.hostport)+': srv='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
                    rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                    self.add_trans(rpcio);
                }
            } 
            /******************************************
             ** Remote RPC Server AND Local Transaction!
             ******************************************/            
            else if (local && hostsrvport!=undefined) {
              // Queuing and forwarding local transaction request
              connport = self.lookup_host(hostsrvport);
              if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queuing and forwarding local transaction from host '+
                                           Net.Print.port(rpcio.hostport) +' to host '+
                                           Net.Print.port(hostsrvport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid+
                                           ' on connection port '+Net.Print.port(connport));
              rpcio.sendport=hostsrvport;
              if (connport!=undefined) res=self.forward(rpcio, connport);
              rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
              rpcio.operation=Rpc.Operation.TRANSAWAIT;
              self.add_trans(rpcio);
            } else if (local && hostsrvport==undefined) {
              // Local transaction request
              hostsrvport=self.lookup_port(hdr.h_port);
              if (hostsrvport==undefined) {
                  if (self.monitor > 0) self.log('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREQ: Doing lookup for srvport=' + Net.Print.port(hdr.h_port));
                  lookup = this.new_lookup(hdr.h_port);
                  this.route(lookup);
              } else {
                  rpcio.sendport=hostsrvport;
              }
              if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queuing local transaction from host '+
                                           Net.Print.port(rpcio.hostport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
              if (Net.Equal.port(rpcio.hostport,this.hostport)) {
                  // Local transaction client, remote server, pending lookup
                  // rpcio.operation = Rpc.Operation.TRANSAWAIT;
              }
              rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
              self.add_trans(rpcio);
            }  
            /******************************************
             ** Remote RPC Server AND Remote Transaction!
             ******************************************/            
            else if (rpcio.sendport != undefined) {
              // Discarding or queuing or forwarding non-local transaction request
              res=0; 
              connport = self.lookup_host(rpcio.sendport);
              if (rpcio.hop>=rpcio.hop_max) {
                  if (self.verbose>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Discarding transaction (hop count reached) from host '+
                                               Net.Print.port(rpcio.hostport)+' to host '+
                                               Net.Print.port(rpcio.sendport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
                  res=1;
                  self.pkt_discard(rpcio);
              }
              else if (connport!=undefined) {
                  if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Forwarding transaction from host '+
                                               Net.Print.port(rpcio.hostport)+' to host '+
                                               Net.Print.port(rpcio.sendport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid+
                                               ' on connection port '+Net.Print.port(connport));
                  res=self.forward(rpcio, connport, function (stat,rpcio) {
                    self.pkt_discard(rpcio)
                  });
              }
              else if (!connport) {
                  /*
                   ** Look-up host port (WHEREIS)!!
                   */
                  if (self.verbose>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queueing and doing host lookup for sendport='+Net.Print.port(rpcio.sendport));
                  whereis = self.add_hostlookup(rpcio.sendport);
                  rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                  self.add_trans(rpcio);
                  self.route(whereis);
                  res=1;
              }
              if (res==0) {
                  if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Queuing transaction from host '+
                                               Net.Print.port(rpcio.hostport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
                  rpcio.timeout=Sch.GetTime()+Net.TIMEOUT;
                  self.add_trans(rpcio);
              }
            } else {
              if (self.verbose>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREQ: Discarding transaction from host '+
                                           Net.Print.port(rpcio.hostport)+' to host '+
                                           Net.Print.port(rpcio.sendport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
              self.pkt_discard(rpcio);
            }
            break;

        case Rpc.Operation.TRANSREP:
            self.stats.op_transrep++;
            if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREP: for host='+
                                         Net.Print.port(rpcio.sendport)+' RPC server='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
            if (rpcio.sendport && Net.Equal.port(rpcio.sendport,self.hostport)) {
                /************************************
                 ** Local RPC Client, remote Server!
                 ************************************
                 ** Destination reached: Remote reply for local waiting transaction process
                 */
                // lookup matching TRANSAWAIT rpcio...

                trans = self.lookup_trans_await(rpcio.header.h_port, rpcio.tid, rpcio);
                if (self.monitor > 0) self.log('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREP: Matching transaction ' + 
                                               Rpc.Print.rpcio(trans));
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
            } else {
                /************************************
                 ** Remote RPC Client, remote Server!
                 ************************************
                 * Forward reply
                 */
                if (rpcio.hop == 0) {
                    // Reply from here, set-up rpcio for forwarding...
                    rpcio.connport = undefined;
                }
                
                res = 0;

                if (rpcio.sendport) {
                  connport = self.lookup_host(rpcio.sendport);
                  if (connport) {
                    // P2P
                    conn = self.find_conn(connport);
                    if (self.monitor > 0) self.log('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREP: Forwarding reply to source host ' +
                                                   Net.Print.port(rpcio.sendport) +
                                                   ' on connection port ' +
                                                   Net.Print.port(connport));
                    if (rpcio.hop < rpcio.hop_max) {
                        res = self.forward(rpcio, connport, function (stat, rpcio) {
                            self.pkt_discard(rpcio)
                        });
                    } else {
                        res = 1;
                        self.pkt_discard(rpcio);
                    }
                  } else {
                    if (rpcio.hop < rpcio.hop_max) {
                        /*
                         ** Look-up host port (WHEREIS)!!
                         */
                        res = 1;
                        if (self.monitor > 0) self.log('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREP: Doing WHEREIS and queuing transaction reply');
                        rpcio.timeout = Sch.GetTime() + Net.TIMEOUT;
                        this.add_trans(rpcio);  // will wake up pending transaction request (this.event() -> connection.schedule)
                        whereis = self.add_hostlookup(rpcio.sendport);
                        self.route(whereis);
                    } else {
                        if (self.verbose>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREP: Discarding transaction reply from host '+
                                                     Net.Print.port(rpcio.hostport)+' to host '+
                                                     Net.Print.port(rpcio.sendport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
                        res = 1;
                        self.pkt_discard(rpcio);
                    }
                  }
                } else {
                  if (self.verbose>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] TRANSREP: Discarding transaction reply from host '+
                                               Net.Print.port(rpcio.hostport)+' to host '+
                                               Net.Print.port(rpcio.sendport)+': srvport='+Net.Print.port(hdr.h_port)+' tid='+rpcio.tid);
                  res = 1;
                  self.pkt_discard(rpcio);                
                }
                if (res == 0) {
                    if (self.monitor > 0) self.log('[ROUT' + (timestamp ? Perv.mtime() : '') + '] TRANSREP: Queuing transaction reply for Broker-App [tid='+
                                                   rpcio.tid+']');
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
                if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] GETREQ: Servicing trans '+Net.Print.port(rpcio.pubport)+' tid '+trans.tid);
                Sch.SetBlocked(false);
            } else {
                // After a TRANS request was received, this process will be woken up by lookup_service and the scheduler!
                if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] GETREQ: Waiting '+Net.Print.port(rpcio.pubport));
                this.add_service(rpcio);
            }
            break;

        case Rpc.Operation.PUTREP:
            self.stats.op_putrep++;
            if (rpcio.callback != undefined) {
                // local transaction, client will be unblocked in callback!
                if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] PUTREP: Servicing reply callback '+Net.Print.port(rpcio.pubport)+' tid '+rpcio.tid);
                rpcio.callback(rpcio);
                rpcio.callback=undefined;
            } else {
                // transaction managed by broker
            }
            Sch.SetBlocked(false);
            break;

        case Rpc.Operation.LOOKUP:
            self.stats.op_lookup++;

            hostsrvport = this.lookup_port(hdr.h_port);
            if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] LOOKUP RPC Server port ' +
                                         Net.Print.port(hdr.h_port) + ' -> Known hostsrvport? ' +
                                         Net.Print.port(hostsrvport));
            /*
             *  1. Check RPC server port, is it here?
             *  2. Broadcast lookup to all known links of connected hosts excluding the incoming link port
             *
             */
             if (hostsrvport != undefined) {
                /*
                 ** Send back an IAMHERE message
                 */
                if (self.monitor>0) self.log('[ROUT' + (timestamp ? Perv.mtime() : '') + '] LOOKUP: Sending IAMHERE reply to host ' +
                                             Net.Print.port(rpcio.hostport) + ' for RPC server ' + Net.Print.port(hdr.h_port));
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
                if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] LOOKUP: Broadcasting LOOKUP from host '+
                                             Net.Print.port(rpcio.hostport)+' for RPC server '+Net.Print.port(hdr.h_port));
                self.broadcast(
                    rpcio,
                    function (stat, rpcio) {
                      if (rpcio.timeout==-1) self.pkt_discard(rpcio); // discard only remote lookup messages      
                });
            }
            break;

        case Rpc.Operation.WHEREIS:
            self.stats.op_whereis++;
            if (Net.Equal.port(rpcio.sendport,self.hostport)) {
                /*
                 ** Send back an HEREIS message
                 */
                if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] WHEREIS: Sending HEREIS reply to '+
                                             Net.Print.port(rpcio.hostport));
                rpcio.operation = Rpc.Operation.HEREIS;
                rpcio.hop = 0;
                rpcio.sendport = rpcio.hostport;
                rpcio.hostport = self.hostport;
                res=self.forward(rpcio, undefined, function (stat,rpcio) {
                    self.pkt_discard(rpcio);
                });
            } else if (rpcio.hop < rpcio.hop_max) {
                // Broadcast message to all connections w/o incoming connection
                rpcio.hop++;
                self.broadcast(rpcio, function (stat, rpcio) {
                    self.pkt_discard(rpcio);                
                });
             }
            break;

        case Rpc.Operation.IAMHERE:
            self.stats.op_iamhere++;
            if (rpcio.connport!=undefined) {
               // original host port
               hostport=rpcio.hostport;
               
               if (Net.Equal.port(rpcio.sendport,self.hostport)) {
                   /*
                   ** 1. Destination reached, it is for this host.
                   *  2. Stalled broker client transaction lookup
                   *  3. Pending lookup from another host and reply from a broker client
                   */
                   self.add_port(rpcio.header.h_port,rpcio.hostport);
                   transl = self.find_all_trans(rpcio.header.h_port);
                   for(i in transl) {
                       trans=transl[i];
                       if (trans.operation==Rpc.Operation.TRANSREQ) {
                           trans.sendport = rpcio.hostport;
                           if (Net.Equal.port(trans.hostport,self.hostport)) {
                               // Local transaction client, TRANSREQ already queued
                               if (self.monitor>0) 
                                self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Forwarding transaction from host '+
                                   Net.Print.port(trans.hostport)+' to host '+Net.Print.port(trans.sendport)+': srvport='+
                                   Net.Print.port(trans.header.h_port)+' tid='+trans.tid+
                                   ' on connection port '+Net.Print.port(rpcio.connport));
                               res=self.forward(trans, rpcio.connport);
                               trans.operation = Rpc.Operation.TRANSAWAIT;
                           } else {
                               // Routing only
                               conn=self.find_conn(rpcio.connport);
                               //console.log(rpcio)
                               if (conn && conn.send==undefined) {
                                  // Keep transaction queued for Client-App RPC Server
                                  if (self.monitor>0) 
                                    self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Keeping transaction queued from host '+
                                       Net.Print.port(trans.hostport)+': srvport='+Net.Print.port(trans.header.h_port)+' tid='+trans.tid);
                               } else {
                                   if (self.monitor>0)
                                     self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Forwarding transaction from host '+
                                              Net.Print.port(trans.hostport)+' to host '+Net.Print.port(trans.sendport)+': srvport='+
                                              Net.Print.port(trans.header.h_port)+' tid='+trans.tid+
                                              ' on connection port '+Net.Print.port(rpcio.connport));
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
                               if (self.monitor>0) 
                                 self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Forwarding IAMHERE from host '+
                                   Net.Print.port(lookup.hostport)+' to host '+
                                   Net.Print.port(lookup.sendport)+' on port '+
                                   Net.Print.port(lookup.connport));
                               lookup.hop=0;
                               res=self.forward(lookup,lookup.connport,function(stat,rpcio){self.pkt_discard(rpcio);});
                           } else self.pkt_discard(lookup);
                       } else self.pkt_discard(lookup);
                   }
                   self.pkt_discard(rpcio);
               } else {
                   // Forward message...
                   // TODO store srvport-hostport-connport
                   connport=self.lookup_host(rpcio.sendport);
                   if (self.monitor>0) self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] IAMHERE: Forwarding IAMHERE from host '+
                                                Net.Print.port(rpcio.hostport)+' to host '+
                                                Net.Print.port(rpcio.sendport)+' on port '+Net.Print.port(connport));
                   if (connport &&
                       rpcio.hop<rpcio.hop_max) 
                      res=self.forward(rpcio,connport,function(stat,rpcio){
                        self.pkt_discard(rpcio);
                      });
                   else self.pkt_discard(rpcio);
                   lookups = self.remove_lookup(rpcio.header.h_port);
                   for (i in lookups) {
                       // stalled lookups
                       lookup = lookups[i];
                       self.pkt_discard(lookup);
                   }
               }
            }
            break;

        case Rpc.Operation.HEREIS:
            self.stats.op_hereis++;
            if (rpcio.connport!=undefined) {

                if (Net.Equal.port(rpcio.sendport,self.hostport)) {
                    // Destination reached, it is for this host.
                    lookups=self.remove_hostlookup(rpcio.hostport);
                    Array.iter(lookups,function(rpcio){self.pkt_discard(rpcio)});
                    do {
                        trans = self.lookup_trans_for_host(rpcio.hostport);
                        if (trans) {
                            if (self.monitor>0) 
                              self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] HEERIS: Forwarding transaction from host '+
                                Net.Print.port(trans.hostport)+' to host '+Net.Print.port(trans.sendport)+': srvport='+
                                Net.Print.port(trans.header.h_port)+' tid='+trans.tid+
                                ' on connection port '+Net.Print.port(rpcio.connport));
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
                    if (self.monitor>0)
                      self.log('[ROUT'+(timestamp?Perv.mtime():'')+'] Forward HEREIS from host '+
                               Net.Print.port(rpcio.hostport)+' to host '+
                               Net.Print.port(rpcio.sendport)+' on port '+Net.Print.port(conn));
                    if (conn && rpcio.hop<rpcio.hop_max) 
                      res=self.forward(rpcio,conn,function(stat,rpcio){
                        self.pkt_discard(rpcio);
                      });
                    else self.pkt_discard(rpcio);
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
    if(this.verbose>0) this.log('[ROUT] Initialized. My host port is '+Net.Print.port(this.hostport));
};


/**
 ** 1. Start a garbage collector service handler
 *
 * @param {number} [interval]
 */
rpcrouter.prototype.start = function (interval) {
    var self=this,
        rpcio,i,
        step;

    if (!interval) interval=100;
    step=interval/20;

    if (this.verbose>0) this.log('[ROUT] Starting. My host port is '+Net.Print.port(this.hostport));

    // Install a garbage collector service
    Sch.AddTimer(interval, 'RPC Garbage Collector and Timeout Service', function () {
        var i,remove,trans,lookup,cache,entry,key,live,time,
            lookups=[],
            caches=[],
            transactions=[],
            routing=[],
            hostport;
            
        if (self.monitor>3) self.log('[ROUG] garbage collector run');
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
                    if (self.verbose>0) self.log('[ROUG] garbage collector: removing LOOKUP for RPC server '+Net.Print.port(lookup.header.h_port));
                else
                    if (self.verbose>0) self.log('[ROUG] garbage collector: removing WHEREIS for host '+Net.Print.port(lookup.sendport));
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
                    if (self.verbose>0) self.log('[ROUG] garbage collector: aborting local transaction (TRANSAWAIT) to RPC server ' +
                                     Net.Print.port(trans.header.h_port) + ' tid=' + trans.tid);
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
                    if (self.verbose>0) self.log('[ROUG] garbage collector: removing transaction (TRANSREQ) to RPC server ' +
                                                 Net.Print.port(trans.header.h_port) + ' tid=' + trans.tid);
                } else if (trans.operation == Rpc.Operation.TRANSREP) {
                    remove = true;
                    self.pkt_discard(trans);
                    if (self.verbose>0) self.log('[ROUG] garbage collector: removing transaction reply (TRANSREP) from RPC server ' +
                                                 Net.Print.port(trans.header.h_port) + ' tid=' + trans.tid);
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
                  self.log('[ROUG] Removing host '+Net.Print.port(key));
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
