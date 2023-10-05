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
 **      Dr. Stefan Bosse http://www.sblab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     1-1-19 by sbosse.
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 **   Various core poylfills and extensions 
 **
 **    $ENDOFINFO
 */
/* TYPED ARRAY */
var typed_arrays = [
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
];

TypedArrayOfName = {
    Int8Array:Int8Array,
    Uint8Array:Uint8Array,
    Int16Array:Int16Array,
    Uint16Array:Uint16Array,
    Int32Array:Int32Array,
    Uint32Array:Uint32Array,
    Float32Array:Float32Array,
    Float64Array:Float64Array  
}

typed_arrays.forEach(function (typed_array) {

    if (!typed_array.prototype.slice) typed_array.prototype.slice = function (begin, end) {
        var len = this.length;;
        var size;
        var start = begin || 0;

        start = (start >= 0) ? start : Math.max(0, len + start);
        end = end || len;

        var up_to = (typeof end == 'number') ? Math.min(end, len) : len;
        if (end < 0) up_to = len + end;

        // actual expected size of the slice
        size = up_to - start;

        // if size is negative it should return an empty array
        if (size <= 0) size = 0;

        var typed_array_constructor = this.constructor;
        var cloned = new typed_array_constructor(size);
        for (var i = 0; i < size; i++) {
            cloned[i] = this[start + i];
        }

        return cloned;
    };
    if (!typed_array.prototype.print)  typed_array.prototype.print = function () {
      var s = '[ ', sep='';
      
      for (var i=0;i<this.length;i++) {
        s = s + (i>0?' , ':'') + this[i].toString();
      }
      return s+' ]';
    };
    if (!typed_array.prototype.reduce)  typed_array.prototype.reduce = function (apply) {
      var res=this[0];
      
      for (var i=1;i<this.length;i++) {
        res=apply(res,this[i]);
      }
      return res;
    };
});

isTypedArray = function (o) { 
  for(var t in typed_arrays) if (o instanceof typed_arrays[t]) return true;
  return false;
}
isArray   = function (v)    { return v instanceof Array }
isNumber  = function (v)    { return typeof v == 'number' }
isObject  = function (v)    { return typeof v == 'object' }
isBuffer  = function (v)    { return v instanceof Buffer}
isFunction = function (v)   { return typeof v == 'function' }
isString  = function (v)    { return typeof v == 'string' }
isBoolean = function (v)    { return typeof v == 'boolean' }


// ARRAY polyfills
if (typeof Array.prototype.scale != 'function') 
 Object.defineProperty(Array.prototype, 'scale', {value: function (k,off,inplace) {
  var ar = this;
  if (isBoolean(off)) inplave=off,off=undefined;
  if (off!=undefined) {
    if (inplace) for(var i=0;i< ar.length; i++) ar[i]=(ar[i]-off)*k; 
    else ar=this.map(function (v) { return (v-off)*k });  
  } else {
    if (inplace) for(var i=0;i< ar.length; i++) ar[i]=ar[i]*k; 
    else ar=this.map(function (v) { return v*k });
  }
  return ar;
}, configurable: true})

if (typeof Array.prototype.get == 'undefined') {
  Object.defineProperty(Array.prototype, 'get', {value:function (i) {
    return this[i];
  }, configurable: true})
  Object.defineProperty(Array.prototype, 'set', {value: function (i,v) {
    this[i]=v;
  }, configurable: true})
}

