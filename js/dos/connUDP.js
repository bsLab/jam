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
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     28-3-15 by sbosse.
 **    $VERSION:     1.1.11
 **
 **    $INFO:
 **
 * ================================
 * DOS: UDP P2P connection module.
 * ================================
 *
 **
 **    $ENDOFINFO
 */
"use strict";
var log = 0;

var Io = Require('com/io');
var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var util = Require('util');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var Hashtbl = Comp.hashtbl;
var String = Comp.string;
var Rand = Comp.random;
var Array = Comp.array;
var trace = Io.tracing;
var div = Perv.div;
var Status = Net.Status;
var Conn = Require('dos/connutils');

if (global && global.TARGET && global.TARGET!= 'browser') {

    /* Virtual Link Connection (VLC) using connectionless UDP Messages
    **
    ** Internet Server-capable Appl. only
    ** UDP Frames: Header,Data1,Data2,...
    *
    * RPC Frame Format:
    *
    *  +-----------------------------------+
    *  MessageType (int16)
    *  Transaction ID (int16)
    *  Hostport (port)
    *  Offset (int32)   |
    *  Size (int16)     | Operation (int16)
    *  Data (Buffer)    | Sendport (port)
    *                   | Hop (int16)
    *                   | Hop_max (int16)
    *                   | Header? (header)
    *                   | NumDataFrags? (int16)
    *  +-----------------------------------+
    *
    *  Unicast Mode:
    *  Here                            Remote
    *   |                                |
    *  Node 1 ------ VLC -------------- Node 2
    *  rcv_ip                           snd_ip
    *  rcv_ipport                       snd_ipport
    *                                   src_ipport
    *
    *  Multicast Mode
    *                                   Node 2
    *  Node 1 -------- VLC ------------ Node 3
    *                                   Node 4 ...
    *
    * Ping/Link Frame Format:
    *
    *  +-----------------------------------+
    *  MessageType (int16)
    *  Conneciton Port (port)
     * Receiver IP Port (int32)
    *  +-----------------------------------+
    *  +-----------------------------------+
    *
    *
    *  1. A listener on address rcv_ip:rcv_ipport must be started (receiver)
    *  2. Unicast Mode: Another node can connect to this receiver and will be the other side
    *     of the virtual link (snd_ip:snd_ipport), that can be used by the router
    *     to forward RPCIO messages.
    *  3. Unicast Mode: Ping remote side periodically to test virtual link. No remote endpoint = (undefined:undefined),
    *  4. Multicast Mode: Any node can connect to the VLC (receive), and any other host can be contacted (send)
    */

    var VLC_MAXLIVE=4;
    var VCMessageType = {
        VCMPING:1,
        VCMPONG:2,
        VCMLINK:3,
        VCMUNLINK:4,
        VCMRPCHEAD:6,
        VCMRPCDATA:7,
        print:function(op) {
            switch (op) {
                case VCMessageType.VCMPING: return "VCMPING";
                case VCMessageType.VCMPONG: return "VCMPONG";
                case VCMessageType.VCMLINK: return "VCMLINK";
                case VCMessageType.VCMUNLINK: return "VCMUNLINK";
                case VCMessageType.VCMRPCHEAD: return "VCMRPCHEAD";
                case VCMessageType.VCMRPCDATA: return "VCMRPCDATA";
                default: return "Connection.VCMessageType?";
            }
        }

    };
    var VCState = {
        VCS_NOTINIT:1,          // Not initialized conenction
        VCS_INIT:2,             // Server started, but not confirmed
        VCS_READY:3,            // Server intiialized and confirmed (other end point not connected)
        VCS_NEGOTIATE:4,            // Server intiialized, in negotiation state (other end point not connected)
        VCS_CONNECTED:5,               // Other side connected
        VCS_NOTCONNECTED:6,              // Other side not connected
        print:function(op) {
            switch (op) {
                case VCState.VCS_NOTINIT: return "VCS_NOTINIT";
                case VCState.VCS_INIT: return "VCS_INIT";
                case VCState.VCS_READY: return "VCS_READY";
                case VCState.VCS_NEGOTIATE: return "VCS_NEGOTIATE";
                case VCState.VCS_CONNECTED: return "VCS_CONNECTED";
                case VCState.VCS_NOTCONNECTED: return "VCS_NOTCONNECTED";
                default: return "Connection.VCState?";
            }
        }
    };

    var dgram = Require('dgram');
    // type options = {conn_port,rcv_ip,rcv_ipport,snd_ip,snd_ipport,router,verbose}
    var udpConnection = function (options) {
        var self=this;
        this.host_port = undefined;                     // Host server port (== host node port), returned by ALIVE request
        this.conn_port = options.conn_port||Net.uniqport();     // Connection Link Port (this side)
        this._status = Net.Status.STD_OK;

        /*
         ** 1. Receive Connection Port (Local service point)
         ** 2. Send Connection Port establishing a connection to another host (Remote endpoint)
         */
        this.rcv_ip = options.rcv_ip;                           // URL
        this.rcv_ipport = options.rcv_ipport;                   // IP port
        this.rcv_sock = dgram.createSocket("udp4");

        /*
        ** The other communication endpoint
        ** 1. Public receiver IP port we are sending to
        *  2. Private sender IP port we are receiving from
         */
        this.snd_ip = options.snd_ip;                           // -> URL
        this.snd_ipport = options.snd_ipport;                   // -> IP port
        this.src_ipport = undefined;                    // (IP port) ->

        this.snd_port = undefined;                      // Connection Link Port (other side)
        this.snd_sock = dgram.createSocket("udp4");


        this.verbose = options.verbose||0;
        this.dlimit = 512;                              // MTU limited maximal data payload of a fragment!
        this.multicast=false;
        this.router=options.router;
        this.rpccon=Rpc.RpcConn(
            // Communication port
            self.conn_port,
            /*
             ** Rpcio Send/Forward Operation
             */
            function(rpcio,callback) {
                // Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] Send '+rpcio.tid);
                self.send(rpcio,callback);
            },
            /*
             ** Rpcio Alive Operation
             */
            function() {
                return self.state==VCState.VCS_CONNECTED;
            }
        );
        /*
        ** Next ping time..
         */
        this.live=0;
        this.state=VCState.VCS_NOTINIT;
        this.timer=undefined;

        this.mode = Conn.Mode.TWOCHANN;
        
        this.callback=undefined;
    };

    udpConnection.prototype.debug = function (v) {log=v};

    udpConnection.prototype.init = function () {
        if (this.router) this.router.add_conn(this.rpccon);
    };



    /** Negotiate a virtual communication link (peer-to-peer).
     *
     * @param snd_ip
     * @param snd_ipport
     * @param callback
     *
     * +------------+
     * VCMessageType (int16)
     * Connection Port (port)
     * Receiver IP Port (int32)
     * +------------+
     *
     */
    udpConnection.prototype.link=function(snd_ip,snd_ipport,callback) {
        var self = this;
        var buf = Buf.Buffer();
        var sock = this.snd_sock;
        this.rpccon.stats.op_link++;

        if (self.state==VCState.VCS_CONNECTED) return;

        Buf.buf_put_int16(buf, VCMessageType.VCMLINK);
        Buf.buf_put_port(buf,this.conn_port);

        if (snd_ip!=undefined) this.snd_ip=snd_ip;
        if (snd_ipport!=undefined) this.snd_ipport=snd_ipport;

        if (snd_ip==undefined) snd_ip=this.snd_ip;
        if (snd_ipport==undefined) snd_ipport=this.snd_ipport;

        Buf.buf_put_int32(buf, self.rcv_ipport);

        Io.log(((log+self.verbose)<2)||('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.link: to '+snd_ip + ':' + snd_ipport));
        sock.send(buf.data,0,Buf.length(buf),snd_ipport,snd_ip,function (err) {
            if (err) {
                sock.close();
                if (callback) callback(Status.STD_IOERR);
            } else {
                if (callback) callback(Status.STD_OK);
            }
        });
    };

    /**
     *
     * @param snd_ip
     * @param snd_ipport
     * @param callback
     *
     * +------------+
     * VCMessageType (int16)
     * Connection Port (port)
     * Receiver IP Port (int32)
     * +------------+
     */
    udpConnection.prototype.ping=function(snd_ip,snd_ipport,callback) {
        var self = this;
        var buf = Buf.Buffer();
        var sock = this.snd_sock;
        this.rpccon.stats.op_ping++;

        Buf.buf_put_int16(buf, VCMessageType.VCMPING);
        Buf.buf_put_port(buf,this.conn_port);

        if (snd_ip==undefined) snd_ip=this.snd_ip;
        if (snd_ipport==undefined) snd_ipport=this.snd_ipport;

        Buf.buf_put_int32(buf, self.rcv_ipport);

        Io.log(((log+self.verbose)<2)||('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.ping: to '+snd_ip + ':' + snd_ipport));
        sock.send(buf.data,0,Buf.length(buf),snd_ipport,snd_ip,function (err) {
            if (err) {
                sock.close();
                if (callback) callback(Status.STD_IOERR);
            } else {
                if (callback) callback(Status.STD_OK);
            }
        });
    };
    /**
     *
     * @param snd_ip
     * @param snd_ipport
     * @param callback
     * +------------+
     * VCMessageType (int16)
     * Connection Port (port)
     * Receiver IP Port (int32)
     * +------------+
     */
    udpConnection.prototype.pong=function(snd_ip,snd_ipport,callback) {
        var self = this;
        var buf = Buf.Buffer();
        var sock = this.snd_sock;
        this.rpccon.stats.op_pong++;

        Buf.buf_put_int16(buf, VCMessageType.VCMPONG);
        Buf.buf_put_port(buf,this.conn_port);

        if (snd_ip==undefined) snd_ip=this.snd_ip;
        if (snd_ipport==undefined) snd_ipport=this.snd_ipport;

        Buf.buf_put_int32(buf, self.rcv_ipport);

        Io.log(((log+self.verbose)<2)||('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.pong: to '+snd_ip + ':' + snd_ipport));
        sock.send(buf.data,0,Buf.length(buf),snd_ipport,snd_ip,function (err) {
            if (err) {
                sock.close();
                if (callback) callback(Status.STD_IOERR);
            } else {
                if (callback) callback(Status.STD_OK);
            }
        });
    };



    /** Install a receiver.
     *
     *
     * @param callback
     * @param [rcv_ip]
     * @param [rcv_ipport]
     */
    udpConnection.prototype.receive=function(callback,rcv_ip,rcv_ipport) {
        var self = this;

        if (rcv_ip==undefined) rcv_ip=this.rcv_ip;
        if (rcv_ipport==undefined) rcv_ipport=this.rcv_ipport;

        // RPCIO fragmentation cache
        // TODO: garabage collection
        var cache = Hashtbl.create();
        var buf = Buf.Buffer();
        var sock = this.rcv_sock;

        sock.on('listening', function () {
            var address = sock.address();
            if (self.verbose>=0) Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] UDP receiver listening on ' + address.address + ":" + address.port);
        });

        sock.on('message', function (message, remote) {
            var rpcio,dfrags,dlist,msgtyp,port,ipport,discard;
            Io.log((log<2)||('Receive: '+Perv.mtime()));
            self.rpccon.stats.op_receive++;

            Buf.buf_init(buf);
            Buf.buf_of_str(buf,message);
            if (message.length >= 2) {
                msgtyp=Buf.buf_get_int16(buf);
                discard=false;
                Io.log(((log+self.verbose)<2)||(msgtyp==VCMessageType.VCMPING||msgtyp==VCMessageType.VCMPONG)||
                        ('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.receive('+VCState.print(self.state)+'): Receiving Message from '+remote.address + ':' + remote.port +' [' + message.length+'] '+VCMessageType.print(msgtyp)));
                switch (msgtyp) {

                    case VCMessageType.VCMLINK:
                        port = Buf.buf_get_port(buf);
                        ipport = Buf.buf_get_int32(buf);
                        if (!self.multicast &&
                            self.snd_ip==undefined &&
                            self.snd_ipport==undefined)
                        {
                            if (self.timer) clearTimeout(self.timer);
                            self.snd_ip=remote.address;
                            self.snd_ipport=ipport;
                            self.snd_port=port;
                            self.src_ipport=remote.port;
                            if (self.verbose>0) Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] Linked with ' + remote.address + ":" + ipport+', '+
                                                    Net.Print.port(port));
                            self.live=VLC_MAXLIVE;
                            self.link(self.snd_ip,self.snd_ipport);
                            self.state=VCState.VCS_CONNECTED;
                            self.watchdog(true);
                        }
                        else if (!self.multicast &&
                            self.snd_ip &&
                            Conn.ipequal(self.snd_ip,remote.address) &&
                            self.snd_ipport==ipport &&
                            self.state==VCState.VCS_READY)
                        {
                            if (self.timer) clearTimeout(self.timer);
                            self.snd_port=port;
                            self.src_ipport=remote.port;
                            self.live = VLC_MAXLIVE;
                            self.link(self.snd_ip,self.snd_ipport);
                            self.state=VCState.VCS_CONNECTED;
                            if (self.verbose>0) Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] Linked with preferred ' + remote.address + ":" + ipport+', '+
                                                  Net.Print.port(port));
                            self.watchdog(true);
                        } else if (!self.multicast &&
                            self.state==VCState.VCS_CONNECTED &&
                            Net.Equal.port(port,self.snd_port))
                        {
                            if (self.verbose>0) Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] Refresh link with ' + remote.address + ":" + ipport+', '+
                                                  Net.Print.port(port));
                            self.src_ipport=remote.port;
                            self.live = VLC_MAXLIVE;
                            self.state=VCState.VCS_CONNECTED;
                            // self.link(self.snd_ip,self.snd_ipport);
                            self.watchdog(true);
                        } else if (!self.multicast &&
                            self.state==VCState.VCS_CONNECTED &&
                            !Net.Equal.port(port,self.snd_port) &&
                            Conn.ipequal(self.snd_ip,remote.address) &&
                            self.snd_ipport==ipport)
                        {

                            self.state=VCState.VCS_READY;
                            /*
                             ** Reincarnation of node?
                             */
                            self.snd_port=port;
                            self.src_ipport=remote.port;
                            if (self.verbose>0) Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] Relinked with ' + remote.address + ":" + ipport+', '+
                                                  Net.Print.port(port));
                            self.live=VLC_MAXLIVE;
                            self.link(self.snd_ip,self.snd_ipport);
                            self.state=VCState.VCS_CONNECTED;
                            self.watchdog(true);
                        }
                        break;

                    case VCMessageType.VCMUNLINK:
                        port = Buf.buf_get_port(buf);
                        ipport = Buf.buf_get_int32(buf);
                        if (!self.multicast && self.state==VCState.VCS_CONNECTED) {
                            if (self.verbose>0) Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] Unlink from ' + remote.address + ":" + ipport+', '+
                                    Net.Print.port(port));
                            if (self.timer) clearTimeout(self.timer);
                            self.timer=undefined;
                            self.state=VCState.VCS_READY;
                        }
                        break;

                    case VCMessageType.VCMPING:
                        port = Buf.buf_get_port(buf);
                        ipport = Buf.buf_get_int32(buf);
                        if (self.state==VCState.VCS_INIT && Net.Equal.port(port,self.conn_port)) {
                            /*
                             ** Self ping message received: this connection end point is confirmed to be unique!
                             */
                            if (self.timer) clearTimeout(self.timer);
                            self.timer=undefined;
                            self.state=VCState.VCS_READY;
                            if (self.verbose>0) Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] Ready.');
                            if (self.callback) {
                                var f = self.callback;
                                self.callback=undefined;
                                f(Status.STD_OK);
                            }
                        } else {
                            // Send back a PONG message with this connection port
                            self.pong(remote.address,ipport);
                        }
                        break;

                    case VCMessageType.VCMPONG:
                        port = Buf.buf_get_port(buf);
                        ipport = Buf.buf_get_int32(buf);
                        if (self.state==VCState.VCS_CONNECTED && Net.Equal.port(self.snd_port,port)) {
                            self.live = VLC_MAXLIVE;
                        }
                        break;

                    case VCMessageType.VCMRPCHEAD:
                    case VCMessageType.VCMRPCDATA:
                        if (!self.multicast && self.src_ipport!=remote.port) discard=true;
                        break;
                }
            }
            if (!discard && (msgtyp==VCMessageType.VCMRPCHEAD||msgtyp==VCMessageType.VCMRPCDATA) && message.length >= 12) {
                var tid = Buf.buf_get_int16(buf);
                var hostport = Buf.buf_get_port(buf);
                Io.log(((log+self.verbose)<2)||('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.receive: TID='+tid+' for HOSTPORT='+Net.Print.port(hostport)+' '+VCMessageType.print(msgtyp)));
                if (msgtyp==VCMessageType.VCMRPCHEAD) {
                    // header frame
                    rpcio = self.router.pkt_get();
                    rpcio.connport=self.conn_port;
                    rpcio.tid=tid;
                    rpcio.hostport=hostport;                    // FROM
                    rpcio.operation = Buf.buf_get_int16(buf);
                    rpcio.sendport = Buf.buf_get_port(buf);     // TO
                    rpcio.hop = Buf.buf_get_int16(buf);
                    rpcio.hop_max = Buf.buf_get_int16(buf);
                    switch (rpcio.operation) {
                        case Rpc.Operation.LOOKUP:
                        case Rpc.Operation.IAMHERE:
                            rpcio.header=Buf.buf_get_hdr(buf);
                            dfrags=0;
                            break;
                        default:
                            rpcio.header=Buf.buf_get_hdr(buf);
                            dfrags = Buf.buf_get_int16(buf);
                    }
                    rpcio.data=new Buffer('');
                    if (dfrags>0) {
                        dlist = Array.range(0, dfrags - 1);
                        Hashtbl.add(cache, rpcio.hostport + rpcio.tid, [rpcio, dlist, 1000]);
                        rpcio=undefined;
                    } else {
                        if (self.router) self.router.route(rpcio);
                    }
                    // Io.inspect(cache)
                } else {
                    // data frame
                    var off = Buf.buf_get_int32(buf);
                    var size = Buf.buf_get_int16(buf);
                    var thisnum = off/self.dlimit;
                    var handler = Hashtbl.find(cache,hostport+tid);
                    if (handler!=undefined) {
                        rpcio=handler[0];
                        Io.log(((log+self.verbose)<3)||('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.receive: adding data num='+
                            thisnum+' off='+off+' size='+size+' '+handler[1]));
                        Buf.buf_get_buf(buf,rpcio,off,size);
                        handler[1]=Array.filter(handler[1],function(num) {return (num!=thisnum)});
                        if (Array.empty(handler[1])) {
                            Io.log(((log+self.verbose)<3)||('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.receive: finalize '+remote.address + ':' + remote.port));
                            // Io.out(rpcio.data.toString());
                            // Deliver
                            rpcio.connport=self.conn_port;
                            self.router.route(rpcio);
                            Hashtbl.remove(cache,hostport+tid);
                        }
                        rpcio=undefined;
                    }
                }
            }
            // console.log();
        });
        sock.bind(rcv_ipport, rcv_ip, function () {
                // self.snd_sock.bind(self.rcv_ipport, self.rcv_ip);
                self.state=VCState.VCS_INIT;
                if (callback) callback(Status.STD_OK);
        });
    }

    /** Send a RPCIO to a remote node
     *
     * @param rpcio
     * @param {function((Status.STD_OK|*),rpcio)} [callback]
     * @param [snd_ip]
     * @param [snd_ipport]
     *
     * +------------+
     * VCMessageType (int16)
     * RPCIO Transaction ID (int16)
     * RPCIO Host Port (port)
     * RPCIO Operation (int16)
     * RPCIO Send Port (port)
     * RPCIO Hop (int16)
     * RPCIO HopMax (int16)
     * ...
     * +------------+
     */
    udpConnection.prototype.send=function(rpcio,callback,snd_ip,snd_ipport) {
        var self = this;
        var buf = Buf.Buffer();
        var sock = this.snd_sock;
        this.rpccon.stats.op_send++;

        var size = Buf.length(rpcio);
        var frags = div((size+self.dlimit-1),self.dlimit);

        if (snd_ip==undefined) snd_ip=this.snd_ip;
        if (snd_ipport==undefined) snd_ipport=this.snd_ipport;

        Buf.buf_put_int16(buf, VCMessageType.VCMRPCHEAD);
        Buf.buf_put_int16(buf,rpcio.tid);       // Transaction Message number
        Buf.buf_put_port(buf, rpcio.hostport);
        Buf.buf_put_int16(buf,rpcio.operation);
        if (rpcio.sendport) Buf.buf_put_port(buf,rpcio.sendport);
        else Buf.buf_put_port(buf,Net.nilport);

        Buf.buf_put_int16(buf,rpcio.hop);
        Buf.buf_put_int16(buf,rpcio.hop_max);
        switch (rpcio.operation) {
            case Rpc.Operation.LOOKUP:
            case Rpc.Operation.IAMHERE:
                Buf.buf_put_hdr(buf,rpcio.header);
                break;
            default:
                Buf.buf_put_hdr(buf,rpcio.header);
                Buf.buf_put_int16(buf,frags);
        }
        Io.log(((log+self.verbose)<2)||('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.send: to '+self.snd_ip + ':' + self.snd_ipport +' TID='+rpcio.tid+ ' SENDPORT='+ Net.Print.port(rpcio.sendport)+ ' [' + size +']'));
        Io.log(((log+self.verbose)<3)||('Send VCMRPCHEAD Start: '+Perv.mtime()));
        sock.send(buf.data,0,Buf.length(buf),snd_ipport,snd_ip,function (err) {
            Io.log(((log+self.verbose)<3)||('Send VCMRPCHEAD Done: '+Perv.mtime()));
            if (err) {
                sock.close();
                callback(Status.STD_IOERR,rpcio);
            } else {
                if (size >0) {
                    var dsend = function (n, off) {
                        var fsize,more;
                        if (frags == 1) fsize = size;
                        else if (n < frags) fsize = self.dlimit;
                        else fsize = size - off;
                        if (n==frags) more=0; else more=1;
                        Buf.buf_init(buf);
                        Buf.buf_put_int16(buf, VCMessageType.VCMRPCDATA);
                        Buf.buf_put_int16(buf, rpcio.tid);      // Transaction Message number
                        Buf.buf_put_port(buf,rpcio.hostport);
                        Buf.buf_put_int32(buf, off);            // Data fragment offset
                        Buf.buf_put_int16(buf, fsize);          // Data fragment size
                        if (rpcio.data==undefined) {
                            Io.out('[PVDP] Invalid RPCIO in VCMRPCDATA send (#:'+n+' off='+off+') found: '+Rpc.Print.rpcio(rpcio));
                        }
                        Buf.buf_put_buf(buf, rpcio, off, fsize);
                        Io.log(((log+self.verbose)<3)||('Send VCMRPCDATA Start #'+n+': '+Perv.mtime()));
                        sock.send(buf.data, 0, Buf.length(buf), self.snd_ipport, self.snd_ip, function (err) {
                            Io.log(((log+self.verbose)<3)||('Send VCMRPCDATA Done #'+n+': '+Perv.mtime()));

                            if (err) {
                                sock.close();
                                if (callback) callback(Status.STD_IOERR,rpcio);
                            }
                            else if (n < frags) dsend(n + 1, off + fsize);
                            else {
                                if (callback) callback(Status.STD_OK,rpcio);
                            }
                        });
                    };
                    dsend(1,0);
                } else {
                    if (callback) callback(Status.STD_OK,rpcio);
                }
            }
        })
    };
    
    udpConnection.prototype.start = function (callback) {
        var self=this;
        var interval = 1000;
        // Start Listener (asynchronous)
        this.callback=callback;
        this.receive(function () {
            /*
            * Test that this server UDP IP-port is not used already by another connection port. We must receive
            * our own PING message. Otherwise another connection port listening
            * on the same IP port.
            */
            self.ping(self.rcv_ip,self.rcv_ipport);
            self.timer=setTimeout(function () {
                // No PING received, shut down...
                Io.out('[PVDP '+Net.Print.port(self.conn_port)+'] Not received my PING on ' + self.rcv_ip + ":" + self.rcv_ipport+
                        ', propably IP-port used by another connection port. Shutting down...');
                self.state=VCState.VCS_NOTINIT;
                self.rcv_sock.close();
                self.snd_sock.close();
            },1000);
        });
        // Install a garabage collector
        Sch.AddTimer(interval, 'VLC Garbage Collector '+Net.Print.port(this.conn_port), function (context) {

        });
    };

    udpConnection.prototype.status = function () {
      return this._status;
    }
    
    udpConnection.prototype.stop = function (callback) {
        var self=this;
        var buf = Buf.Buffer();
        if (this.timer) clearTimeout(self.timer);
        switch (self.state) {
            case VCState.VCS_CONNECTED:
                if (self.verbose>=1) Io.out('[PVDP ' + Net.Print.port(self.conn_port) + '] Unlinking  ' + self.snd_ip + ":" + self.snd_ipport);
                self.unlink(undefined,undefined,callback);
                self.state = VCState.VCS_NOTCONNECTED;
                self.snd_ip = undefined;
                self.snd_ipport = undefined;
                break;
        }
    };

    /** Unlink operation
     *
     */
    udpConnection.prototype.unlink=function(snd_ip,snd_ipport,callback) {
        var self = this;
        var buf = Buf.Buffer();
        var sock = this.snd_sock;
        this.rpccon.stats.op_unlink++;

        if (self.state!=VCState.VCS_CONNECTED) return;

        Buf.buf_put_int16(buf, VCMessageType.VCMUNLINK);
        Buf.buf_put_port(buf,this.conn_port);

        if (snd_ip!=undefined) this.snd_ip=snd_ip;
        if (snd_ipport!=undefined) this.snd_ipport=snd_ipport;

        if (snd_ip==undefined) snd_ip=this.snd_ip;
        if (snd_ipport==undefined) snd_ipport=this.snd_ipport;

        Buf.buf_put_int32(buf, self.rcv_ipport);

        Io.log(((log+self.verbose)<2)||('[PVDP '+Net.Print.port(self.conn_port)+'] udpConnection.unlink: to '+snd_ip + ':' + snd_ipport));
        sock.send(buf.data,0,Buf.length(buf),snd_ipport,snd_ip,function (err) {
            if (err) {
                sock.close();
                if (callback) callback(Status.STD_IOERR);
            } else {
                if (callback) callback(Status.STD_OK);
            }
        });
    };

    /** Install a watchdog timer.
     *
     * 1. If link state is VCS_READY, retry link request.
     * 2. If link state is VCS_CONNECTED, check link end point.
     *
     * @param run
     */
    udpConnection.prototype.watchdog = function(run) {
        var self=this;
        if (self.timer) clearTimeout(self.timer);
        if (run) self.timer=setTimeout(function () {
            self.timer = undefined;
            switch (self.state) {
                case VCState.VCS_CONNECTED:
                    if (self.live == 0) {
                        // No PING received, disconnect...
                        if (self.verbose>=1)  Io.out('[PVDP ' + Net.Print.port(self.conn_port) + '] Endpoint ' + self.snd_ip + ":" + self.snd_ipport +
                                               ' not responding, propably dead. Unlinking...');
                        self.state = VCState.VCS_NOTCONNECTED;
                        self.snd_ip = undefined;
                        self.snd_ipport = undefined;
                    } else {
                        self.live--;
                        self.watchdog(true);
                        self.ping();
                    }
                    break;
                case VCState.VCS_READY:
                    Io.log(((log+self.verbose)<1)||('[PVDP ' + Net.Print.port(self.conn_port) + '] Retrying Link to ' + self.snd_ip + ":" + self.snd_ipport));
                    self.link();
                    self.watchdog(true);
                    break;
            }
        },1000);
    };
}

module.exports = {
    /** Virtual Connection Linkc (VLC) using connectionless UDP
     *
     * @param conn_port
     * @param [rcv_ip]
     * @param [rcv_ipport]
     * @param [snd_ip]
     * @param [snd_ipport]
     * @param [router]
     * @returns {udpConnection}
     * @constructor
     */
    /**
     * type options = {conn_port,rcv_ip,rcv_ipport,snd_ip,snd_ipport,router,verbose}
     */
    Connection: function(options) {
        var obj = new udpConnection(options);
        Object.preventExtensions(obj);
        return obj;
    }
};
