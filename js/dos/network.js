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
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2018 bLAB
 **    $CREATED:     3-5-15 by sbosse.
 **    $VERSION:     1.2.6
 **
 **    $INFO:
 **
 **  DOS: Networking, Commands, Status/Error codes, ..
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
var Perv =Comp.pervasives;
var Des48 = Require('dos/des48');
var Base64 = Require('os/base64');
var Rand = Comp.random;
var Fs = Require('fs');

//var xmldoc = Require('xmldoc');


function pad(str,size) {
    while (str.length < (size || 2)) {str = "0" + str;}
    return str;
}


/** Direction
 *
var Direction = {
    NORTH:1,
    WEST:2,
    EAST:3,
    SOUTH:4,
    ORIGIN:5,
    tostring:function (i) {
        switch (i) {
            case 1: return 'NORTH';
            case 2: return 'WEST';
            case 3: return 'EAST';
            case 4: return 'SOUTH';
            case 5: return 'ORIGIN';
            default: return 'Direction?';
        }
    }
};
*/


// Standard Object Service
var STD_FIRST_COM = 1000;
var STD_LAST_COM = 1999;
var STD_FIRST_ERR = (-STD_FIRST_COM);
var STD_LAST_ERR = (-STD_LAST_COM);

// File Server
var AFS_FIRST_COM = 2000;
var AFS_LAST_COM = 2099;
var AFS_FIRST_ERR = (-AFS_FIRST_COM);
var AFS_LAST_ERR = (-AFS_LAST_COM);
var AFS_REQBUFSZ = 1024*32;


// Directory and Name Server
var DNS_FIRST_COM = 2100;
var DNS_LAST_COM = 2199;
var DNS_FIRST_ERR = (-DNS_FIRST_COM);
var DNS_LAST_ERR = (-DNS_LAST_COM);
var DNS_MAXCOLUMNS = 4;

// System Process Server (incl. Agent Platform Manager)
var PS_FIRST_COM = 2200;
var PS_LAST_COM = 2299;
var PS_FIRST_ERR = (-PS_FIRST_COM);
var PS_LAST_ERR = (-PS_LAST_COM);

// Broker Server
var BR_FIRST_COM = 2300;
var BR_LAST_COM = 2399;
var BR_FIRST_ERR = (-BR_FIRST_COM);
var BR_LAST_ERR = (-BR_LAST_COM);
/** RPC Status
 *
 * @enum {number}
 */
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
    DNS_UNAVAIL      : (DNS_FIRST_ERR -1),
    DNS_NOTEMPTY     : (DNS_FIRST_ERR -2),
    DNS_UNREACH      : (DNS_FIRST_ERR -3),
    DNS_CLASH        : (DNS_FIRST_ERR -4),
    RPC_FAILURE     : -1,
    BUF_OVERFLOW    : -2,
    print: function(stat) {
        switch(stat) {
            case Status.STD_OK          :  return 'STD_OK';
            case Status.STD_CAPBAD      :  return 'STD_CAPBAD';
            case Status.STD_COMBAD      :  return 'STD_COMBAD';
            case Status.STD_ARGBAD      :  return 'STD_ARGBAD';
            case Status.STD_NOTNOW      :  return 'STD_NOTNOW';
            case Status.STD_NOSPACE     :  return 'STD_NOSPACE';
            case Status.STD_DENIED      :  return 'STD_DENIED';
            case Status.STD_NOMEM       :  return 'STD_NOMEM';
            case Status.STD_EXISTS      :  return 'STD_EXISTS';
            case Status.STD_NOTFOUND    :  return 'STD_NOTFOUND';
            case Status.STD_SYSERR      :  return 'STD_SYSERR';
            case Status.STD_INTR        :  return 'STD_INTR';
            case Status.STD_OVERFLOW    :  return 'STD_OVERFLOW';
            case Status.STD_WRITEPROT   :  return 'STD_WRITEPROT';
            case Status.STD_NOMEDIUM    :  return 'STD_NOMEDIUM';
            case Status.STD_IOERR       :  return 'STD_IOERR';
            case Status.STD_WRONGSRV    :  return 'STD_WRONGSRV';
            case Status.STD_OBJBAD      :  return 'STD_OBJBAD';
            case Status.STD_UNKNOWN     :  return 'STD_UNKNOWN';
            case Status.DNS_UNAVAIL     :  return 'DNS_UNAVAIL';
            case Status.DNS_NOTEMPTY    :  return 'DNS_NOTEMPTY';
            case Status.DNS_UNREACH     :  return 'DNS_UNREACH';
            case Status.DNS_CLASH       :  return 'DNS_CLASH';
            case Status.RPC_FAILURE     :  return 'RPC_FAILURE';
            case Status.BUF_OVERFLOW     :  return 'BUF_OVERFLOW';
            default          :     return '"'+stat+'"';
        }
    }
};

/** RPC Command
 *
 * @enum {number}
 */

var Command = {
    /*
    ** Standard Commands
     */
    STD_MONITOR     : STD_FIRST_COM,
    STD_AGE         : (STD_FIRST_COM+1),
    STD_COPY        : (STD_FIRST_COM + 2),
    STD_DESTROY     : (STD_FIRST_COM + 3),
    STD_INFO        : (STD_FIRST_COM + 4),
    STD_RESTRICT    : (STD_FIRST_COM + 5),
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
    ** AFC Commands
     */
    AFS_CREATE          : (AFS_FIRST_COM + 1),
    AFS_DELETE          : (AFS_FIRST_COM + 2),
    AFS_FSCK            : (AFS_FIRST_COM + 3),
    AFS_INSERT          : (AFS_FIRST_COM + 4),
    AFS_MODIFY          : (AFS_FIRST_COM + 5),
    AFS_READ            : (AFS_FIRST_COM + 6),
    AFS_SIZE            : (AFS_FIRST_COM + 7),
    AFS_DISK_COMPACT    : (AFS_FIRST_COM + 8),
    AFS_SYNC            : (AFS_FIRST_COM + 9),
    AFS_DESTROY         : (AFS_FIRST_COM + 10),

    /*
    ** DNS Commands
     */

    DNS_CREATE       : (DNS_FIRST_COM),
    DNS_DISCARD      : (DNS_FIRST_COM + 1),
    DNS_LIST         : (DNS_FIRST_COM + 2),
    DNS_APPEND       : (DNS_FIRST_COM + 3),
    DNS_CHMOD        : (DNS_FIRST_COM + 4),
    DNS_DELETE       : (DNS_FIRST_COM + 5),
    DNS_LOOKUP       : (DNS_FIRST_COM + 6),
    DNS_SETLOOKUP    : (DNS_FIRST_COM + 7),
    DNS_INSTALL      : (DNS_FIRST_COM + 8),
    DNS_REPLACE      : (DNS_FIRST_COM + 10),
    DNS_GETMASKS     : (DNS_FIRST_COM + 11),
    DNS_GETSEQNR     : (DNS_FIRST_COM + 12),
    DNS_RENAME       : (DNS_FIRST_COM + 13),
    DNS_GETROOT      : (DNS_FIRST_COM + 14),
    DNS_GETDEFAFS    : (DNS_FIRST_COM + 15),

    PS_STUN         : (PS_FIRST_COM),     // Kill a process/ create a snapshot
    PS_MIGRATE      : (PS_FIRST_COM+1),   // Execute a process from a snapshot after migration (->next+)
    PS_EXEC         : (PS_FIRST_COM+2),   // Execute a process from a snapshot (->next)
    PS_WRITE        : (PS_FIRST_COM+4),   // Store a process class template
    PS_READ         : (PS_FIRST_COM+5),   // Get a process class template
    PS_CREATE       : (PS_FIRST_COM+6),   // Create a process from a template and execute
    PS_FORK         : (PS_FIRST_COM+7),   // Fork a process from a running process
    PS_SIGNAL       : (PS_FIRST_COM+8),   // Send a signal to a process

    BR_CONNECT      : (BR_FIRST_COM),
    BR_DISCONN      : (BR_FIRST_COM+1),

    print: function(cmd) {
        switch(cmd) {
            case Command.STD_MONITOR     : return 'STD_MONITOR';
            case Command.STD_AGE         : return 'STD_AGE';
            case Command.STD_COPY        : return 'STD_COPY';
            case Command.STD_DESTROY     : return 'STD_DESTROY';
            case Command.STD_INFO        : return 'STD_INFO';
            case Command.STD_RESTRICT    : return 'STD_RESTRICT';
            case Command.STD_STATUS      : return 'STD_STATUS';
            case Command.STD_TOUCH       : return 'STD_TOUCH';
            case Command.STD_GETPARAMS   : return 'STD_GETPARAMS';
            case Command.STD_SETPARAMS   : return 'STD_SETPARAMS';
            case Command.STD_NTOUCH      : return 'STD_NTOUCH';
            case Command.STD_EXIT        : return 'STD_EXIT';
            case Command.STD_RIGHTS      : return 'STD_RIGHTS';
            case Command.STD_EXEC        : return 'STD_EXEC';
            case Command.STD_LOCATION    : return 'STD_LOCATION';
            case Command.STD_LABEL       : return 'STD_LABEL';
            case Command.AFS_CREATE      : return 'AFS_CREATE';
            case Command.AFS_DELETE      : return 'AFS_DELETE';
            case Command.AFS_FSCK        : return 'AFS_FSCK';
            case Command.AFS_INSERT      : return 'AFS_INSERT';
            case Command.AFS_MODIFY      : return 'AFS_MODIFY';
            case Command.AFS_READ        : return 'AFS_READ';
            case Command.AFS_SIZE        : return 'AFS_SIZE';
            case Command.AFS_DISK_COMPACT : return 'AFS_DISK_COMPACT';
            case Command.AFS_SYNC        : return 'AFS_SYNC';
            case Command.AFS_DESTROY     : return 'AFS_DESTROY';
            case Command.DNS_CREATE      : return 'DNS_CREATE';
            case Command.DNS_DISCARD     : return 'DNS_DISCARD';
            case Command.DNS_LIST        : return 'DNS_LIST';
            case Command.DNS_APPEND      : return 'DNS_APPEND';
            case Command.DNS_CHMOD       : return 'DNS_CHMOD';
            case Command.DNS_DELETE      : return 'DNS_DELETE';
            case Command.DNS_LOOKUP      : return 'DNS_LOOKUP';
            case Command.DNS_SETLOOKUP   : return 'DNS_SETLOOKUP';
            case Command.DNS_INSTALL     : return 'DNS_INSTALL';
            case Command.DNS_REPLACE     : return 'DNS_REPLACE';
            case Command.DNS_GETMASKS    : return 'DNS_GETMASKS';
            case Command.DNS_GETSEQNR    : return 'DNS_GETSEQNR';
            case Command.DNS_RENAME      : return 'DNS_RENAME';
            case Command.DNS_GETROOT     : return 'DNS_GETRROT';
            case Command.DNS_GETDEFAFS   : return 'DNS_GETDEFAFS';
            case Command.PS_STUN         : return 'PS_STUN';
            case Command.PS_EXEC         : return 'PS_EXEC';
            case Command.PS_MIGRATE      : return 'PS_MIGRATE';
            case Command.PS_READ         : return 'PS_READ';
            case Command.PS_WRITE        : return 'PS_WRITE';
            case Command.PS_CREATE       : return 'PS_CREATE';
            case Command.PS_FORK         : return 'PS_FORK';
            case Command.PS_SIGNAL       : return 'PS_SIGNAL';
            case Command.BR_CONNECT      : return 'BR_CONNECT';
            case Command.BR_DISCONN      : return 'BR_DISCONN';
            default: return '"'+cmd+'"';
        }


    }
};

var PORT_SIZE = 6;
var PRIV_SIZE = 4+PORT_SIZE;
var CAP_SIZE = 16;

/** Object Rights
 *
 * @enum {number}
 */
var Rights = {
    AFS_RGT_READ        : 0x1,
    AFS_RGT_CREATE      : 0x2,
    AFS_RGT_MODIFY      : 0x4,
    AFS_RGT_DESTROY     : 0x8,
    AFS_RGT_ADMIN       : 0x80,
    
    DNS_COLMASK     : ((1 << DNS_MAXCOLUMNS) - 1),  // Rights to access specific columns of a directory row, one bit, one column.
    DNS_RGT_COLALL  : ((1 << DNS_MAXCOLUMNS) - 1),
    DNS_RGT_COL1    : 0x01,
    DNS_RGT_OWNER   : 0x01,
    DNS_RGT_COL2    : 0x02,
    DNS_RGT_GROUP   : 0x02,
    DNS_RGT_COL3    : 0x04,
    DNS_RGT_OTHERS  : 0x04,
    DNS_RGT_COL4    : 0x08,
    DNS_RGT_READ    : 0x10,
    DNS_RGT_CREATE  : 0x20,
    DNS_RGT_MODIFY  : 0x40,
    DNS_RGT_DELETE  : 0x80,

    HOST_INFO       : 0x01,
    HOST_READ       : 0x02,
    HOST_WRITE      : 0x04,
    HOST_EXEC       : 0x08,

    PSR_READ        : 0x01,
    PSR_WRITE       : 0x02,
    PSR_CREATE      : 0x04,
    PSR_DELETE      : 0x08,
    PSR_EXEC        : 0x10,
    PSR_KILL        : 0x20,
    PSR_ALL         : 0xff,

    NEG_SCHED       : 0x08,
    NEG_CPU         : 0x10,
    NEG_RES         : 0x20,
    NEG_LEVEL       : 0x40,
    
    PRV_ALL_RIGHTS  : 0xff

};



var DEF_RPC_MAX_HOP = 4;

var priv2pub_cache = [];

/**
 *
 * @param {number []} [port_vals]
 * @returns {string}
 */
var port = function (port_vals) {
    if (port_vals==undefined) port_vals=[0,0,0,0,0,0];
    var port='';
    for(var i = 0; i< PORT_SIZE;i++) {
        port=port+Perv.char_of_int(port_vals[i]);
    }
    return port;

};
/**
 *
 * @param {number} [obj]
 * @param {number} [rights]
 * @param {port} [rand]
 * @constructor
 */
var privat = function (obj,rights,rand) {
    if (obj==undefined) {
        // Create empty private field
        this.prv_obj=0;
        this.prv_rights=0;
        this.prv_rand=port();
    } else {
        this.prv_obj = obj;               // Integer
        this.prv_rights = rights;         // Integer
        this.prv_rand = rand;             // Port=string
    }
};

/**
 *
 * @param {port} [cap_port]
 * @param {privat} [cap_priv]
 * @constructor
 */
var capability = function(cap_port, cap_priv) {
    if (cap_port==undefined) {
        // Create empty capability
        this.cap_port = port();
        this.cap_priv = new privat();
    } else {
        this.cap_port = cap_port;       // Port=string
        if (cap_priv==undefined)
            this.cap_priv = new privat();
        else
            this.cap_priv = cap_priv;    // Private
    }
};

/*
 ** RPC communication is XML based using the HTTP interface.
 ** RPC communication is synchronous, hence a callback
 ** function is used to handle the reply (acknowledge).
 */
/**
 *
 * @param {port} [h_port]
 * @param {privat} [h_priv]
 * @param {Command} [h_command]
 * @param {(Status.STD_OK|*)} [h_status]
 * @constructor
 */
var header = function(h_port,h_priv,h_command,h_status) {
    if (h_port==undefined) {
        // Create empty header
        this.h_port = port();
        this.h_priv = new privat();
        this.h_command = undefined;
        this.h_status = undefined;
    } else {
        this.h_port = h_port;
        this.h_priv = h_priv;
        this.h_command = h_command;
        this.h_status = h_status;
    }
};

/**
 *
 * @param {number} [obj]
 * @param {number} [rights]
 * @param {port} [rand]
 * @returns {privat}
 */
function Private(obj,rights,rand) {
    var _obj = new privat(obj,rights,rand);
    Object.preventExtensions(_obj);
    return _obj;
}
/**
 *
 * @param {port} [cap_port]
 * @param {privat} [cap_priv]
 * @returns {capability}
 */
function Capability (cap_port, cap_priv) {
    var obj = new capability(cap_port, cap_priv);
    Object.preventExtensions(obj);
    return obj;
}
/**
 *
 * @param {port} [h_port]
 * @param {privat} [h_priv]
 * @param {Command} [h_command]
 * @param {(Status.STD_OK|*)} [h_status]
 * @returns {header}
 */

function Header(h_port,h_priv,h_command,h_status) {
    var obj = new header(h_port,h_priv,h_command,h_status);
    Object.preventExtensions(obj);
    return obj;
}

/*
** Hash table of all locally created unique ports.
 */
var uniqports=[];


/**
 *
 */
var Net = {
    // Direction:Direction,
    PORT_SIZE:PORT_SIZE,
    PRIV_SIZE:PRIV_SIZE,

    AFS_REQBUFSZ:AFS_REQBUFSZ,
    CAP_SIZE:CAP_SIZE,
    DNS_MAXCOLUMNS:DNS_MAXCOLUMNS,
    TIMEOUT:5000,
    DEF_RPC_MAX_HOP:DEF_RPC_MAX_HOP,

    Status:Status,
    Command:Command,
    Rights:Rights,

    Private:Private,
    Capability: Capability,
    Header: Header,
    Port: port,

    /**
     * @type {port}
     */
    nilport: port(),
    nilpriv: Private(0,0,this.nilport),
    nilcap: Capability(this.nilport,this.nilpriv),

    /*
     ** Utils to get and set single bytes of a port
     */
    get_portbyte: function(port,i) {
        return Perv.int_of_char(String.get(port,i))
    },
    set_portbyte: function(port,i,byte) {
        return String.set(port, i, (Perv.char_of_int(byte)));
    },
    /*
     * Return a unique key of a capability that can be used for hash tables
     */
    key: function (cap) {
        return cap.cap_port+
         cap.cap_priv.prv_obj+
         cap.cap_priv.prv_rights+
         cap.cap_priv.prv_rand;
    },

    /*
     ** Encryption function
     */
    one_way: function (port) {
        var key = Array.create(64,0);
        var block = Array.create(48,0);
        var pubport = String.make (PORT_SIZE,'\0');
        var i, j, k;

        /*
        ** We actually need 64 bit key.
        ** Throw some zeroes in at bits 6 and 7 mod 8
        ** The bits at 7 mod 8 etc are not used by the algorithm
        */
        j=0;
        for (i = 0; i< 64; i++) {
            if ((i & 7) > 5)
                key[i] = 0;
            else {
                if ((this.get_portbyte(port, (j >> 3)) & (1 << (j & 7))) != 0)
                    key[i] = 1;
                else
                    key[i] = 0;
                j++;
            }
        }

        Des48.des_OWsetkey(key);
        /*
        ** Now go encrypt constant 0
        */
        block=Des48.des_OWcrypt48(block);


        /*
        ** and put the bits in the destination port
        */
        var pb = 0;

        for (i = 0; i < PORT_SIZE;i++) {
            var pbyte = 0;
            for (j = 0; j < 8; j++) {
                pbyte = pbyte | (block[pb] << j);
                pb++;
            }
            pubport=this.set_portbyte(pubport, i, pbyte);
        }

        return pubport;
    },
    /*
     ** Check whether the required rights [R1;R2;..] are
     ** present in the rights field rg. Return a boolean value.
     */
    rights_req : function(rights,required) {
        var all=true;
        Array.iter(required,function(rq) {
            if (rq & rights == 0) all = false;
        });
        return all;
    },
    port_cmp: function(port1,port2) {
        var i;
        var eq=true;
        for(i=0;i<PORT_SIZE;i++) { if (String.get(port1,i)!=String.get(port2,i)) eq=false;}
        return eq;},
    port_copy: function(port) {
        return String.copy(port);
    },
    /*
     ** Derive a port from a string.
     */
    port_name: function(name){
        var p = String.make(PORT_SIZE,'\0');
        var i;
        var n = name.length;

        for (i = 0; i < n;i++) {
            var k = i % PORT_SIZE;
            p = String.set(p, k, Perv.char_of_int(
                (Perv.int_of_char(String.get(p, k)) +
                 Perv.int_of_char(String.get(name, i)))
                                 & 0xff));
        }
        return p;
    },
    port_to_str: function(port,compact) {
        var i,str='';
        if (port) {
            for (i = 0; i < PORT_SIZE; i++) {
                var num = Perv.int_of_char(String.get(port, i));
                if (!compact && i > 0) str = str + ':';
                str = str + pad(num.toString(16).toUpperCase(), 2);
            }
        } else str='undefined';
        return str;
    },
    port_of_str: function (str,compact) {
        var tokens=str.split(':'),i,port='';
        for (i=0;i<PORT_SIZE;i++) {
            var num='0x'+tokens[i];
            port=port+Perv.char_of_int(parseInt(num,16));
        }
        return port;
    },
    /** String parameter to port conversion including "undefined" case.
     *
     * @param str
     * @returns {string}
     */
    port_of_param: function (str) {
        if (str==undefined ||
            String.equal(str,'undefined')) return undefined;
        var tokens=str.split(':');
        var i;
        var port='';
        for (i=0;i<PORT_SIZE;i++) {
            var num='0x'+tokens[i];
            port=port+Perv.char_of_int(parseInt(num,16));
        }
        return port;
    },
    prv2pub: function(port) {
        var putport;
        if (priv2pub_cache[port] == undefined) {
            putport=this.one_way(port);
            priv2pub_cache[port] = putport;
        } else putport = priv2pub_cache[port];
        return putport;
    },
    /**
     ** Decode a private structure
     *
     * @param {privat} prv
     * @param {port} rand
     * @returns {boolean}
     */
    prv_decode: function(prv,rand) {
        if (prv.prv_rights == Rights.PRV_ALL_RIGHTS)
            return this.port_cmp(prv.prv_rand,rand);
        else {
            var tmp_port = this.port_copy(rand),
                pt0 = this.get_portbyte(tmp_port, 0),
                pr0 = prv.prv_rights;
            tmp_port = this.set_portbyte(tmp_port, 0, (pt0 ^ pr0));
            tmp_port = this.one_way(tmp_port);
            return this.port_cmp(prv.prv_rand, tmp_port)
        }
    },
    /*
     ** Encode a private part from the object number, the rights field
     ** and the random port.
     ** Returns the created private structure.
     */
    prv_encode: function(obj,rights,rand) {
        var tmp_port = this.port_copy(rand);

        var r1 = rights;
        var rmask = Rights.PRV_ALL_RIGHTS;

        if (rights == Rights.PRV_ALL_RIGHTS)
            return this.Private(obj,r1 & rmask,tmp_port);
        else {
            var pt0 = this.get_portbyte(tmp_port,0);
            tmp_port = this.set_portbyte(tmp_port,0,pt0 ^ r1);
            tmp_port = this.one_way(tmp_port);
            return this.Private(obj,r1 & rmask,tmp_port)
        }
    },
    /*
     ** Return the private object number form a private structure
     */
    prv_number: function(prv) {
        return prv.prv_obj;
    },
    /*
     ** Return the private rights field.
     */
    prv_rights: function(prv) {
        return prv.prv_rights & Rights.PRV_ALL_RIGHTS;
    },

    /*
     ** Check the private rights field: 1. Validation, 2: Required rights.
     */
    prv_rights_check: function(prv,rand,required) {
      if (!Net.prv_decode(prv,rand)) return false;
      return (prv.prv_rights & required)==required;
    },

    /** Restrict a private field (rights&mask) of a capability.
     *
     * @param {privat} priv
     * @param {number} mask rights restriction mask
     * @param {port} random secret server random port
     */
    restrict: function(priv,mask,random) {
        var pr =
            this.prv_encode(priv.prv_obj,
                            priv.prv_rights & mask,
                            random);
        return pr;
    },
    /*
     * Return a new random port.
     *
     * Warning: the quality of the random ports are strongly
     * related to JSVMs underlying random generator. Be warned!
     *
     * @returns {port}
     */
    uniqport: function() {
        var port = String.create (PORT_SIZE);
        var exists = true;
        while (exists) {
            var i;
            for (i = 0; i <= (PORT_SIZE - 1); i++) {

                port = String.set(port, i, (Perv.char_of_int(Rand.int(256))));
            }
            if (uniqports[port]==undefined)
            {
                uniqports[port]=port;
                exists=false;
            }
        }
        return port;
    },
    /** Write a capability to a file.
     *
     * @param {capability} cap
     * @param {string} path
     */
    cap_to_file: function(cap,path) {
        try {
            Fs.writeFileSync(path, this.Print.capability(cap));
        } catch(e) {
        }
    },
    /** Read a capability from a file.
     *
     * @param {string} path
     * @returns {capability|undefined}
     */
    cap_of_file: function(path) {
        try {
            var cap=undefined;
            var data = Fs.readFileSync(path);
            var cp = this.Parse.capability(data.toString(), 0);
            cap = cp.cap;
            return cap;
        } catch(e) {
            return undefined;
        }
    },

    Position: function (x,y) {
        this.x = x;
        this.y = y;
    },
    Copy: {
        /**
         *
         * @param src
         * @returns {port}
         */
        port: function(src) {
            // !!!!
            return String.copy(src);
        },
        /**
         *
         * @param src
         * @param dst
         * @returns {privat}
         */
        private: function(src,dst) {
            if (dst!=undefined) {
                dst.prv_obj = src.prv_obj;
                dst.prv_rights = src.prv_rights;
                dst.prv_rand = this.port(src.prv_rand);
                return dst;
            } else {
                var dstnew=Private();
                dstnew.prv_obj = src.prv_obj;
                dstnew.prv_rights = src.prv_rights;
                dstnew.prv_rand = this.port(src.prv_rand);
                return dstnew;
            }
        },
        /**
         *
         * @param src
         * @param dst
         * @returns {capability}
         */
        capability: function(src,dst) {
            if (dst!=undefined) {
                dst.cap_port = this.port(src.cap_port);
                this.private(src.cap_priv, dst.cap_priv);
                return dst;
            }
            else {
                var dstnew=Capability();
                dstnew.cap_port = this.port(src.cap_port);
                this.private(src.cap_priv, dstnew.cap_priv);
                return dstnew;
            }
        },
        /**
         *
         * @param src
         * @param dst
         */
        header: function(src,dst) {
            dst.h_port=this.port(src.h_port);
            dst.h_status=src.h_status;
            dst.h_command=src.h_command;
            if (src.h_priv!=undefined) {
                if (dst.h_priv==undefined) {
                    var obj = new privat();
                    Object.preventExtensions(obj);
                    dst.h_priv=obj;
                }
                this.private(src.h_priv,dst.h_priv);
            } else dst.h_priv=undefined;
        }
    },
    Equal: {
        port: function (port1,port2) {
            if (port1==undefined || port2==undefined) return (port1==port2);
            else return String.equal(port1,port2);
        },
        private: function (prv1,prv2) {
            return  (prv1==undefined&&prv2==undefined) ||
                    (prv1.prv_obj==prv2.prv_obj &&
                     prv1.prv_rights==prv2.prv_rights &&
                     this.port(prv1.prv_rand,prv2.prv_rand))
        },
        capability: function(cap1,cap2) {
            return  (cap1==undefined&&cap2==undefined) ||
                    (this.private(cap1.cap_priv,cap2.cap_priv) &&
                     this.port(cap1.cap_port,cap2.cap_port))
        },
        header: function(hdr1,hdr2) {
            return  (hdr1==undefined&&hdr2==undefined) ||
                    (this.private(hdr1.h_priv,hdr1.h_priv) &&
                     this.port(hdr1.h_port,hdr2.h_port) &&
                     hdr1.h_status==hdr2.h_status &&
                     hdr1.h_command==hdr2.h_command)

        }
    },

    /**
     * @typedef {{
     * port:function(string,number):{port:port,pos:number}|undefined,
     * private:function(string,number):{priv:privat,pos:number}|undefined,
     * capability:function(string,number):{cap:capability,pos:number}|undefined
     * }} Parse
     */
    Parse: {
        /**
         *
         * @param str
         * @param pos
         * @returns {{port:port,pos:number}}
         */
        port: function(str,pos) {
            var port='';
            var len=str.length;
            if (pos==undefined) pos=0;
            if (len<(pos+17)) return undefined;
            if (str[pos]=='[') pos++;
            for(var i=0;i<6;i++) {
                var sv='0x'+str[pos]+str[pos+1];
                port=port+Perv.char_of_int(Perv.int_of_string(sv));
                pos=pos+2;
                if (str[pos]==':') pos++;
            }
            if (str[pos]==']') pos++;
            return {port:port,pos:pos};
        },
        /**
         *
         * @param str
         * @param pos
         * @returns {{priv:privat,pos:number}}
         */
        private: function(str,pos) {
            var priv=Private();
            var sv;
            var len=str.length;
            if (pos==undefined) pos=0;
            if (len<(pos+25)) return undefined;
            if (str[pos]=='(') pos++;
            sv='';
            while(str[pos]!='(') {
                sv=sv+str[pos];
                pos++;
            }
            priv.prv_obj=Perv.int_of_string(sv);
            sv='';
            if (str[pos]=='(') pos++;
            while(str[pos]!=')') {
                sv=sv+str[pos];
                pos++;
            }
            priv.prv_rights=Perv.int_of_string('0x'+sv);
            if (str[pos]==')') pos++;
            var pp=this.port(str,pos);
            if (pp==undefined) return undefined;
            priv.prv_rand=pp.port;
            pos=pp.pos;
            return {priv:priv,pos:pos};
        },
        /**
         *
         * @param str
         * @param pos
         * @returns {{cap:capability,pos:number}|undefined}
         */
        capability: function(str,pos) {
            var cap=Capability();
            if (pos==undefined) pos=0;
            var pp=this.port(str,pos);
            if (pp==undefined) return undefined;
            cap.cap_port=pp.port;
            pos=pp.pos;
            pp=this.private(str,pos);
            if (pp==undefined) return undefined;
            cap.cap_priv=pp.priv;
            pos=pp.pos;
            return {cap:cap,pos:pos};
        }
    },
    Print: {
        /**
         *
         * @param cap
         * @returns {string}
         */
        capability: function (cap) {
            var str='';
            if (cap==undefined) return 'undefined';
            if (cap.cap_port!=undefined) str='['+this.port(cap.cap_port)+']'; else str = '[]';
            if (cap.cap_priv!=undefined) str=str+'('+this.private(cap.cap_priv)+')'; else str=str+'()';
            return str;
        },
        command: Command.print,
        /**
         *
         * @param hdr
         * @returns {string}
         */
        header: function (hdr) {
            var str='';
            if (hdr==undefined) return 'undefined';
            if (hdr.h_port!=undefined) str='['+this.port(hdr.h_port)+']'; else str = '[]';
            if (hdr.h_command!=undefined) str=str+': '+Command.print(hdr.h_command);
            if (hdr.h_priv!=undefined) str=str+'('+this.private(hdr.h_priv)+')'; else str=str+'()';
            if (hdr.h_status!=undefined) str=str+' ?'+Status.print(hdr.h_status);
            return str;
        },
        /**
         *
         * @param port
         * @returns {string}
         */
        port: function(port) {
            var i;
            var str='';
            if (port!=undefined) {
                for (i = 0; i < PORT_SIZE; i++) {
                    var num = Perv.int_of_char(String.get(port, i));
                    if (i > 0) str = str + ':';
                    str = str + pad(num.toString(16).toUpperCase(), 2);
                }
            } else str='undefined';
            return str;
        },
        /**
         *
         * @param priv
         * @returns {string}
         */
        private: function(priv) {
            var str='';
            if (priv==undefined) return 'undefined';
            str=priv.prv_obj;
            str=str+'('+String.format_hex(priv.prv_rights,2).toUpperCase()+')[';
            str=str+this.port(priv.prv_rand)+']';
            return str;
        },
        status: Status.print
    }
};

module.exports = Net;
