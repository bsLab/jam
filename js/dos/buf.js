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
 **    $INITIAL:     (C) 2006-2018 bLAB
 **    $CREATED:     29-4-15 by sbosse.
 **    $RCS:         $Id$
 **    $VERSION:     1.1.5
 **
 **    $INFO:
 **
 **  DOS: Buffer Management
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
var des48 = Require('dos/des48');
var Rand = Comp.random;
var Net = Require('dos/network');
var Status = Net.Status;
var Fs = Require('fs');


var SIZEOF_INT16 = 2;
var SIZEOF_INT32 = 4;
var PORT_SIZE = 6;
var PRIV_SIZE =  PORT_SIZE+SIZEOF_INT32;
var CAP_SIZE = PORT_SIZE+PRIV_SIZE;

/** Generic buffer, union with rpcio object
 ** Argument: optional, hex-ascci string or number (size), passed to Buffer instantiation
 *
 *
 * @param {number|string|Buffer} [data]
 * @constructor
 */
var buffer = function (data) {
    var size;
    this.pos=0;
    if (Comp.isNumber(data)) {
        this.data=new Buffer(data);
    } else if (Comp.isString(data)) {
        this.data=new Buffer('');
        buf_of_hex(this,data)
    } else if (Comp.isArray(data)) {
        this.data=new Buffer(data);
    } else if (typeof data == "object" && data.constructor === Buffer) {
        this.data=data;
    } else this.data=new Buffer('');
};

/** Extend a buffer to new size (buf.pos+off).
 *
 * @param buf
 * @param off
 */
function buf_extend(buf,off) {
    if (buf.data.length<(buf.pos+off)) {
        buf.data=Buffer.concat([buf.data,new Buffer(off-(buf.data.length-buf.pos))]);
    }
}

/** Expand buffer to new size.
 *
 * @param buf
 * @param size
 */
function buf_expand(buf,size) {
    if (buf.data.length<size) {
        buf.data=Buffer.concat([buf.data,new Buffer(size-buf.data.length)]);
    }
}

/** Shrink buffer to new size.
 *
 * @param buf
 * @param size
 */
function buf_shrink(buf,size) {
    if (buf.data.length>size) {
        buf.data=Buffer.slice(buf.data,size);
    }
}

/*
 ** BUFFER encoding and decoding of native data types
 ** Supported objects: rpcio, buffer.
 ** Supported native data types: int16, int32, string, float, port, private, capability, ...
 ** ALL buffer data is stored in byte buffers that extends automatically (buf_put_XX).
 */
function buf_put_string (buf,str) {
    buf_extend(buf,str.length+1);
    for(var i=0;i<str.length;i++) {
        buf.data[buf.pos]=Perv.int_of_char(String.get(str,i));
        buf.pos++;
    }
    buf.data[buf.pos]=0;
    buf.pos++;
}

function buf_get_string (buf) {
    var str='';
    var end=buf.data.length;
    var finished=false;

    while (!finished && buf.pos < end) {
        if (buf.data[buf.pos]==0) finished=true; else {
            str = str + Perv.char_of_int(buf.data[buf.pos]);
            buf.pos++;
        }
    }
    buf.pos++;
    return str;
}

/*
** Convert byte buffer to ASCII two-digit hexadecimal text representation and vice versa
 */
function buf_to_hex (buf) {
    /*
    var str='';
    var len=buf.data.length;
    for(var i=0;i<len;i++) {
        str=str+String.format_hex(buf.data[i],2);
    }
    return str;
    */
    return buf.data.toString('hex');
}

function buf_of_hex  (buf,str) {
    /*
    var len=str.length/2;
    var pos=0;
    buf.pos=0;
    buf_extend(buf,len);
    for(var i=0;i<len;i++) {
        buf.data[i]=String.parse_hex(str, pos, 2);
        pos=pos+2;
    }
    */
    buf.pos=0;
    buf.data= new Buffer(str,'hex');
}

/*
 ** Convert byte buffer to strings and vice versa
 */
function buf_to_str (buf) {
    var str=buf.data.toString('binary');
    return str;
}

function buf_of_str  (buf,str) {
    buf.pos=0;
    buf.data=new Buffer(str,'binary');
    return buf;
}

/** Put a string to a buffer w/o EOS
 *
 * @param buf
 * @param {string} str
 */
function buf_put_bytes (buf,str) {
    buf_extend(buf,str.length);
    for(var i=0;i<str.length;i++) {
        var n=Perv.int_of_char(String.get(str,i));
        buf.data[buf.pos]=n;
        buf.pos++;
    }
    // No final EOS marker!
}

/** Get number of bytes from buffer and store in string (w/o EOS)
 *
 * @param buf
 * @param size
 * @returns {string}
 */
function buf_get_bytes (buf,size) {
    var i=0;
    var str='';
    var end=buf.data.length;
    var finished=false;

    while (!finished && buf.pos < end) {
        if (i==size) finished=true; else {
            str = str + Perv.char_of_int(buf.data[buf.pos]);
            buf.pos++;i++;
        }
    }
    return str;
}

function buf_put_int16 (buf,n) {
    buf_extend(buf,2);
    buf.data[buf.pos]=n & 0xff;
    buf.data[buf.pos+1]=(n >> 8) & 0xff;
    buf.pos=buf.pos+2;
}

function buf_get_int16 (buf) {
    var n=0;
    var end=buf.data.length;
    if (buf.pos+2 <= end) {
        n = buf.data[buf.pos];
        n = n | (buf.data[buf.pos+1] << 8);
        buf.pos = buf.pos + 2;
        if (n&0x8000) return (n-0x10000); else return (n);
    } else throw Status.BUF_OVERFLOW;
}

function buf_put_int32 (buf,n) {
    buf_extend(buf,4);
    buf.data[buf.pos]=n & 0xff;
    buf.data[buf.pos+1]=(n >> 8) & 0xff;
    buf.data[buf.pos+2]=(n >> 16) & 0xff;
    buf.data[buf.pos+3]=(n >> 24) & 0xff;
    buf.pos=buf.pos+4;
}

function buf_get_int32 (buf) {
    var n=0;
    var end=buf.data.length;
    if (buf.pos+4 <= end) {
        n = buf.data[buf.pos];
        n = n | (buf.data[buf.pos+1] << 8);
        n = n | (buf.data[buf.pos+2] << 16);
        n = n | (buf.data[buf.pos+3] << 24);
        buf.pos = buf.pos + 4;
        // TBD: Sign check???
        return (n);
    } else throw Status.BUF_OVERFLOW;
}

function buf_put_port (buf,port) {
    buf_extend(buf,Net.PORT_SIZE);
    for(var i=0;i<Net.PORT_SIZE;i++) {
        var n=Perv.int_of_char(String.get(port,i));
        buf.data[buf.pos]=n;
        buf.pos++;
    }
}

function buf_get_port (buf) {
    var port='';
    var end=buf.data.length;
    if (buf.pos+Net.PORT_SIZE <= end) {
        for (var i = 0; i < Net.PORT_SIZE; i++) {
            port = port + Perv.char_of_int(buf.data[buf.pos]);
            buf.pos++;
        }
        return port;
    } else throw Status.BUF_OVERFLOW;
}

function buf_put_priv (buf,priv) {
    buf_extend(buf,Net.PRIV_SIZE);
    buf.data[buf.pos]=priv.prv_obj & 0xff;
    buf.data[buf.pos+1]=(priv.prv_obj >> 8) & 0xff;
    buf.data[buf.pos+2]=(priv.prv_obj >> 16) & 0xff;
    buf.data[buf.pos+3]=priv.prv_rights & 0xff;
    buf.pos=buf.pos+4;
    buf_put_port(buf,priv.prv_rand);
}

function buf_get_priv (buf,priv) {
    var n;
    var end=buf.data.length;
    if (buf.pos+(Net.PRIV_SIZE) <= end) {
        if (priv == undefined) priv = Net.Private();
        n = buf.data[buf.pos];
        n = n | (buf.data[buf.pos+1] << 8);
        n = n | (buf.data[buf.pos+2] << 16);
        priv.prv_obj=n;
        priv.prv_rights=buf.data[buf.pos+3];
        buf.pos=buf.pos+4;
        priv.prv_rand=buf_get_port(buf);
        return priv;
    } else throw Status.BUF_OVERFLOW;
}

function buf_put_cap (buf,cap) {
    buf_put_port(buf,cap.cap_port);
    buf_put_priv(buf,cap.cap_priv);
}

function buf_get_cap (buf,cap) {
    var end=buf.data.length;
    if (buf.pos+(Net.CAP_SIZE) <= end) {
        if (cap == undefined) cap = Net.Capability();
        cap.cap_port=buf_get_port(buf);
        buf_get_priv(buf,cap.cap_priv);
        return cap;
    } else throw Status.BUF_OVERFLOW;
}

function buf_put_hdr (buf,hdr) {
    buf_put_port(buf,hdr.h_port);
    buf_put_priv(buf,hdr.h_priv);
    buf_put_int32(buf,hdr.h_command);
    buf_put_int32(buf,hdr.h_status);
}

function buf_get_hdr (buf,hdr) {
    if (hdr==undefined) hdr=Net.Header();
    hdr.h_port=buf_get_port(buf);
    buf_get_priv(buf,hdr.h_priv);
    hdr.h_command=buf_get_int32(buf);
    hdr.h_status=buf_get_int32(buf);
    return hdr;
}

/** TODO: buf blit
 *
 * @param buf
 * @param bufsrc
 * @param [srcoff]
 * @param [len]
 */
function buf_put_buf (buf,bufsrc,srcoff,len) {
    if (srcoff==undefined) srcoff=0;
    if (len==undefined) len=bufsrc.data.length;
    buf_extend(buf,len);
    for(var i=0;i<len;i++) {
        buf.data[buf.pos]=bufsrc.data[srcoff+i];
        buf.pos++;
    }
}
/** TODO: buf blit
 *
 * @param buf
 * @param bufdst
 * @param dstoff
 * @param len
 */
function buf_get_buf (buf,bufdst,dstoff,len) {
    buf_extend(bufdst,dstoff+len);
    for(var i=0;i<len;i++) {
        bufdst.data[dstoff+i]=buf.data[buf.pos];
        buf.pos++;
    }
}

function buf_pad (buf,size,byte) {
    if (buf.data.length < size) buf_extend(buf,size-buf.data.length);
    if (byte!=undefined) {
        while (buf.pos < size) {
            buf.data[buf.pos] = byte;
            buf.pos++;
        }
    } else buf.pos=size-1;
}

function buf_set_pos (buf,off) {
    if (off >= buf.data.length) buf_expand(buf,off+1);
    buf.pos=off;
}
/**
 * @param {file} fd
 * @param {buffer} buf
 * @param {number} [off]        file offset
 * @param {number} [len]
 * @returns {number} n
 */
function buf_write (fd,buf,off,len) {
    var n;
    if (off==undefined) n=Io.write_buf(fd,buf.data,0,buf.data.length);
    else {
        if (len==undefined) len=buf.data.length;
        n=Io.write_buf(fd,buf.data,0,len,off);
    }
    return n;
}
/**
 * @param {file} fd
 * @param {buffer} buf
 * @param {number} off          file offset
 * @param {number} len
 * @returns {number} n
 */
function buf_read (fd,buf,off,len) {
    var n;
    buf_expand(buf,len);
    n=Io.read_buf(fd,buf.data,0,len,off);
    buf.pos=0;
    return n;
}

function buf_print(buf) {
    var str='[';
    for(var i=0;i<buf.data.length;i++) {
        if(i>0) str=str+','+buf.data[i];
        else str=str+buf.data[i];
    }
    return str+']'+buf.pos+':'+buf.data.length;
}

function buf_set (buf,off,byte) {
    if (off >= buf.data.length) buf_expand(buf,off+1);
    buf.data[off]=byte;
}

function buf_get (buf,off) {
    return buf.data[off];
}

/** Reset buffer
 *
 * @param buf
 */
function buf_init (buf) {
    buf.data=new Buffer('');
    buf.pos=0;
}

function buf_copy (dst,src) {
    dst.data=new Buffer(src.data);
    dst.pos=0;
}

function buf_blit (dst,dstoff,src,srcoff,len) {
    buf_expand(dst,dstoff+len);
    src.data.copy(dst.data,dstoff,srcoff,srcoff+len);
    dst.pos=0;
}


/**
 *
 * @type {{SIZEOF_INT16: number, SIZEOF_INT32: number, PORT_SIZE: number, PRIV_SIZE: number, CAP_SIZE: number, Buffer: Function, buf_put_string: buf_put_string, buf_put_int16: buf_put_int16, buf_put_int32: buf_put_int32, buf_put_port: buf_put_port, buf_put_priv: buf_put_priv, buf_put_cap: buf_put_cap, buf_put_hdr: buf_put_hdr, buf_put_buf: buf_put_buf, buf_put_bytes: buf_put_bytes, buf_get_string: buf_get_string, buf_get_int16: buf_get_int16, buf_get_int32: buf_get_int32, buf_get_port: buf_get_port, buf_get_priv: buf_get_priv, buf_get_cap: buf_get_cap, buf_get_hdr: buf_get_hdr, buf_get_buf: buf_get_buf, buf_get_bytes: buf_get_bytes, buf_pad: buf_pad, buf_set: buf_set, buf_get: buf_get, buf_set_pos: buf_set_pos, buf_init: buf_init, buf_blit: buf_blit, buf_copy: buf_copy, buf_extend: buf_extend, buf_expand: buf_expand, buf_shrink: buf_shrink, buf_read: buf_read, buf_write: buf_write, buf_print: buf_print, buf_to_hex: buf_to_hex, buf_of_hex: buf_of_hex, buf_to_str: buf_to_str, buf_of_str: buf_of_str}}
 */
module.exports = {
    SIZEOF_INT16: SIZEOF_INT16,
    SIZEOF_INT32: SIZEOF_INT32,
    PORT_SIZE: PORT_SIZE,
    PRIV_SIZE: PRIV_SIZE,
    CAP_SIZE: CAP_SIZE,
    /**
     *
     * @param {number|string|Buffer} [data]
     * @returns {buffer}
     */
    Buffer: function Buffer(data) {
        var obj = new buffer(data);
        Object.preventExtensions(obj);
        return obj;
    },
    // Buffer data operations
    buf_put_string:buf_put_string,
    buf_put_int16:buf_put_int16,
    buf_put_int32:buf_put_int32,
    buf_put_port:buf_put_port,
    buf_put_priv:buf_put_priv,
    buf_put_cap:buf_put_cap,
    buf_put_hdr:buf_put_hdr,
    buf_put_buf:buf_put_buf,
    buf_put_bytes:buf_put_bytes,
    buf_get_string:buf_get_string,
    buf_get_int16:buf_get_int16,
    buf_get_int32:buf_get_int32,
    buf_get_port:buf_get_port,
    buf_get_priv:buf_get_priv,
    buf_get_cap:buf_get_cap,
    buf_get_hdr:buf_get_hdr,
    buf_get_buf:buf_get_buf,
    buf_get_bytes:buf_get_bytes,
    buf_pad:buf_pad,
    buf_set:buf_set,
    buf_get:buf_get,
    buf_set_pos:buf_set_pos,
    buf_init:buf_init,
    buf_blit:buf_blit,
    buf_copy:buf_copy,
    buf_extend:buf_extend,
    buf_expand:buf_expand,
    buf_shrink:buf_shrink,
    // Buffer IO
    buf_read:buf_read,
    buf_write:buf_write,
    buf_print:buf_print,
    // Conversion
    buf_to_hex:buf_to_hex,
    buf_of_hex:buf_of_hex,
    buf_to_str:buf_to_str,
    buf_of_str:buf_of_str,

    length: function(buf) {
        if (buf.data==undefined) return 0;
        else return buf.data.length;
    }
};
