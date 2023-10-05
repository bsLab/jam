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
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     04-02-19 by sbosse.
 **    $RCS:         $Id: security.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 **  JAM Capability and Security Management. Derived from dos/net module.
 **
 **
 **
 **    $ENDOFINFO
 */

var Io      = Require('com/io');
var Des48   = Require('dos/des48');
var Base64  = Require('os/base64');
var Comp    = Require('com/compat');
var String  = Comp.string;
var Array   = Comp.array;
var Perv    = Comp.pervasives;
var current = none;
var Aios    = none;
var Rnd     = Require('com/pwgen');


var PORT_SIZE = 6;
var PRIV_SIZE = 4+PORT_SIZE;
var CAP_SIZE = 16;
var PRV_ALL_RIGHTS = 0xff;


var priv2pub_cache = [];
var uniquePorts = {};

var Rights = {
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
    NEG_LIFE        : 0x40,
    NEG_LEVEL       : 0x80,
    
    PRV_ALL_RIGHTS  : 0xff
};

/**
 *
 * typeof @port_valse = number [] 
 * typeof return = string
 */
var Port = function (port_vals) {
    if (port_vals==undefined) port_vals=[0,0,0,0,0,0];
    var port='';
    for(var i = 0; i< PORT_SIZE;i++) {
        port=port+Perv.char_of_int(port_vals[i]);
    }
    return port;

};
/**
 *
 * typeof @obj = number | undefined
 * typeof @rights = number | undefined
 * typeof @rand = port | undefined
 * typeof function = constructor
 */
var Private = function (obj,rights,rand) {
    if (obj==undefined) {
        // Create empty private field
      return {
          prv_obj : 0,
          prv_rights : 0,
          prv_rand : Port()
      }
    } else {
      return {
        prv_obj : obj,               // Integer
        prv_rights : rights,         // Integer
        prv_rand : rand              // Port=string
      }
    }
}

/**
 *
 * typeof @cap_port = port
 * typeof @cap_priv = privat
 * typeof function = @constructor
 */
var Capability = function(cap_port, cap_priv) {
    if (cap_port==undefined) {
        // Create empty capability
        return {
          cap_port : Port(),
          cap_priv : Private()
        }
    } else {
        return {
          cap_port : cap_port,      // Port=string
          cap_priv : cap_priv?cap_priv:Private()
        }
    }
}
function cap_parse(str,offset) {
    var cap=Capability(),
        pos=0;
    if (offset!=undefined) pos=offset;
    var pp=port_parse(str,pos);
    if (pp==undefined) return undefined;
    cap.cap_port=pp.port;
    pos=pp.pos;
    pp=prv_parse(str,pos);
    if (pp==undefined) return undefined;
    cap.cap_priv=pp.priv;
    pos=pp.pos;
    return {cap:cap,pos:pos};
}

function cap_of_string(str) { var pp = cap_parse(str,0); return pp?pp.cap:undefined }

function cap_to_string(cap) {
    var str='';
    if (cap==undefined) return 'undefined';
    if (cap.cap_port!=undefined) str='['+port_to_string(cap.cap_port)+']'; else str = '[]';
    if (cap.cap_priv!=undefined) str=str+'('+prv_to_string(cap.cap_priv)+')'; else str=str+'()';
    return str;
}

/*
 ** Utils to get and set single bytes of a port
 */
function get_portbyte(port,i) {
    return Perv.int_of_char(String.get(port,i))
}
function set_portbyte(port,i,byte) {
    return String.set(port, i, (Perv.char_of_int(byte)));
}

/*
 ** Encryption function
 */
function one_way(port) {
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
            if ((get_portbyte(port, (j >> 3)) & (1 << (j & 7))) != 0)
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
        pubport=set_portbyte(pubport, i, pbyte);
    }
    return pubport;
}

function pad(str,size) {
    while (str.length < (size || 2)) {str = "0" + str;}
    return str;
}

function port_cmp(port1,port2) {
  if (port1==undefined || port2==undefined) return (port1==port2);
  else return String.equal(port1,port2);
}

function port_copy(port) {
    return String.copy(port);
}

// Expected format: XX:XX:XX:XX:XX
function port_of_string(str,compact) {
    var tokens=str.split(':'),i,port='';
    for (i=0;i<PORT_SIZE;i++) {
        var num='0x'+tokens[i];
        port=port+Perv.char_of_int(parseInt(num,16));
    }
    return port;
}

function port_parse(str,pos) {
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
}

function port_to_string(port,compact) {
    var i,str='';
    if (port) {
        for (i = 0; i < PORT_SIZE; i++) {
            var num = Perv.int_of_char(String.get(port, i));
            if (!compact && i > 0) str = str + ':';
            str = str + pad(num.toString(16).toUpperCase(), 2);
        }
    } else str='undefined';
    return str;
}


function prv2pub (port) {
    var putport;
    if (priv2pub_cache[port] == undefined) {
        putport=one_way(port);
        priv2pub_cache[port] = putport;
    } else putport = priv2pub_cache[port];
    return putport;
}

function prv_cmp(prv1,prv2) {
 return  (prv1==undefined&&prv2==undefined) ||
         (prv1.prv_obj==prv2.prv_obj &&
          prv1.prv_rights==prv2.prv_rights &&
          port_cmp(prv1.prv_rand,prv2.prv_rand))
}

/**
 ** Decode a private structure (check for a valid private field)
 *
 * typeof @prv =  privat
 * typeof @rand = port
 * returns boolean
 */
function prv_decode (prv,rand) {
    if (prv.prv_rights == PRV_ALL_RIGHTS)
        return port_cmp(prv.prv_rand,rand);
    else {
        var tmp_port = port_copy(rand),
            pt0 = get_portbyte(tmp_port, 0),
            pr0 = prv.prv_rights;
        tmp_port = set_portbyte(tmp_port, 0, (pt0 ^ pr0));
        tmp_port = one_way(tmp_port);
        return port_cmp(prv.prv_rand, tmp_port)
    }
}

/*
 ** Encode a private part from the object number, the rights field
 ** and the random port.
 ** Returns the created private structure.
 */
function prv_encode(obj,rights,rand) {
    var tmp_port = port_copy(rand),
        r1 = rights,
        rmask = PRV_ALL_RIGHTS;

    if (rights == PRV_ALL_RIGHTS)
        return Private(obj,r1 & rmask,tmp_port);
    else {
        var pt0 = get_portbyte(tmp_port,0);
        tmp_port = set_portbyte(tmp_port,0,pt0 ^ r1);
        tmp_port = one_way(tmp_port);
        return Private(obj,r1 & rmask,tmp_port)
    }
}

function prv_of_string(str) { var pp=prv_parse(str,0); return pp?pp.priv:undefined }

/*
 ** Return the private object number form a private structure
 */
function prv_number(prv) {
    return prv.prv_obj;
}

// Expected format: obj(right)[port]
function prv_parse(str,offset) {
    var priv=Private();
    var sv;
    var len=str.length,pos=offset;
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
    var pp=port_parse(str,pos);
    if (pp==undefined) return undefined;
    priv.prv_rand=pp.port;
    pos=pp.pos;
    return {priv:priv,pos:pos};
}


function prv_to_string(priv) {
    var str='';
    if (priv==undefined) return 'undefined';
    str=priv.prv_obj;
    str=str+'('+String.format_hex(priv.prv_rights,2).toUpperCase()+')[';
    str=str+port_to_string(priv.prv_rand)+']';
    return str;
}

/** Restrict a private field (rights&mask) of a capability.
 *
 * @param {privat} priv
 * @param {number} mask rights restriction mask
 * @param {port} random secret server random port
 */
function prv_restrict(priv,mask,random) {
    var pr = prv_encode(priv.prv_obj,
                        priv.prv_rights & mask,
                        random);
    return pr;
}
/*
 ** Return the private rights field.
 */
function prv_rights(prv) {
    return prv.prv_rights & Rights.PRV_ALL_RIGHTS;
}
/*
 ** Check the private rights field: 1. Validation, 2: Required rights.
 */
function prv_rights_check(prv,rand,required) {
  if (!prv_decode(prv,rand)) return false;
  return (prv.prv_rights & required)==required;
}

/*
 * Return a new random unique port.
 *
 * Warning: the quality of the random ports are strongly
 * related to JSVMs underlying random generator.
 *
 * typeof return = port
 */
function uniqport() {
    var port = String.create (PORT_SIZE);
    var i,values;
    
    do {
      values = Rnd.generate({number:true,length:PORT_SIZE});
      for (i = 0; i <= (PORT_SIZE - 1); i++) 
        port = String.set(port, i, (Perv.char_of_int(values[i])));
      if (uniquePorts[port]) uniquePorts[port]++;
      else uniquePorts[port]=1;
    } while (uniquePorts[port]>1);
    return port;
}

Port.equal = port_cmp
Port.toString = port_to_string
Port.ofString = port_of_string
Port.prv2pub = prv2pub
Port.random = uniqport
Port.unique = uniqport
Private.decode = prv_decode
Private.encode = prv_encode
Private.equal = prv_cmp
Private.number = prv_number
Private.ofString = prv_of_string
Private.restrict = prv_restrict
Private.rights = prv_rights
Private.rights_check = prv_rights_check
Private.toString = prv_to_string
Capability.toString = cap_to_string
Capability.ofString = cap_of_string

 
var Security = {
    current:function (module) { current=module.current; Aios=module; },

    PORT_SIZE:PORT_SIZE,
    PRIV_SIZE:PRIV_SIZE,
    Rights:Rights,
    Private:Private,
    Capability: Capability,
    Port: Port,
    nilport: Port(),
    nilpriv: Private(0,0,Port()),
    nilcap:  Capability(Port(),Private(0,0,Port())),
    one_way : one_way,
    prv2pub : prv2pub,
}

module.exports = Security;

