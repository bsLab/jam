/**
 * Created by sbosse on 4/30/15.
 */
var Io = require('../io');
var Net = require('../network');
var Buf = require('../buf');

var b = Buf.Buffer();
var ba = Buf.Buffer('344577');
Buf.buf_put_string(b,'test');
Buf.buf_put_int32(b,-1);
Buf.buf_put_int16(b,-1);
var p=Net.uniqport();
var pp=Net.Private(111,45,p);
var cap=Net.Capability(p,pp);
Buf.buf_put_port(b,p);
Buf.buf_put_priv(b,pp);
Buf.buf_put_cap(b,cap);

Io.out(Buf.buf_print(b))
Io.out(Buf.buf_print(ba))
b.pos=0;
Io.out(Buf.buf_get_string(b))
Io.out(Buf.buf_get_int32(b))
Io.out(Buf.buf_get_int16(b))
Io.out(Net.Print.port(p)+'='+Net.Print.port(Buf.buf_get_port(b)))
Io.out(Net.Print.private(pp)+'='+Net.Print.private(Buf.buf_get_priv(b)))
Io.out(Net.Print.capability(cap)+'='+Net.Print.capability(Buf.buf_get_cap(b)))
