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
 **    $AUTHORS:     Vadim Kiryukhin, Stefan Bosse (2020)
 **    $MODIFIED:    by sbosse.
 **    $RCS:         $Id: jsonfo.js$
 **    $VERSION:     1.4.2
 **
 **    $INFO:
 **
 ** JSONfn - javascript (both node.js and browser) plugin to stringify, 
 **          parse and clone objects with embedded functions in an optional  masked context (mask).
 **        - supported data types: number, boolean, string, array, buffer, typedarray, function, regex
 **          and objects with and without prototypes (constructor functions have to be provided via mask)
 **
 **     browser:
 **         JSONfo.stringify(obj);
 **         JSONfo.parse(str[, date2obj]);
 **         JSONfo.clone(obj[, date2obj]);
 **
 **     nodejs:
 **       var JSONfo = require('path/to/json-fn');
 **       JSONfo.stringify(obj);
 **       JSONfo.parse(str[, mask]);
 **       JSONfo.clone(obj[, mask]);
 **
 **
 **     @obj      -  Object;
 **     @str      -  String, which is returned by JSONfn.stringify() function; 
 **     @mask     -  Environment Mask (optional)
 **
 **    Simple (non-nested) objects with prototype bindings can be serialized and deserialized 
 **    if the constructor function is provided via the mask object! 
 ** 
 **    $ENDOFINFO
 */

(function (exports) {
  var current=null;
  /* Remove any buffer toJSON bindings */
  if (typeof Buffer != 'undefined' && Buffer.prototype.toJSON) delete Buffer.prototype.toJSON;
  if (typeof buffer == 'object' && buffer.Buffer) delete buffer.Buffer.prototype.toJSON;

  Object.prototype.getConstructorName = function () {
    var str = (this.prototype ? this.prototype.constructor : this.constructor).toString();
    var cname = str.match(/function\s(\w*)/)[1];
    var aliases = ["", "anonymous", "Anonymous"];
    return aliases.indexOf(cname) > -1 ? "Function" : cname;
  }

  function typedarrayTObase64(ta,ftyp) {
    var b,i;
    if (ta.buffer instanceof ArrayBuffer) {
      b=Buffer(ta.buffer);
      if (b.length>0) return b.toString('base64');
    }
    // Fall-back conversion
    switch (ftyp) {
      case Float32Array: 
        b = Buffer(ta.length*4);
        for(i=0;i<ta.length;i++) b.writeFloatLE(ta[i],i*4);
        return b.toString('base64');
      case Float64Array: 
        b = Buffer(ta.length*8);
        for(i=0;i<ta.length;i++) b.writeDoubleLE(ta[i],i*8);
        return b.toString('base64');
      case Int16Array: 
        b = Buffer(ta.length*2);
        for(i=0;i<ta.length;i++) b.writeInt16LE(ta[i],i*2);
        return b.toString('base64');
      case Int32Array: 
        b = Buffer(ta.length*4);
        for(i=0;i<ta.length;i++) b.writeInt32LE(ta[i],i*4);
        return b.toString('base64');
    }
    return ta.toString();
  }
  function base64TOtypedarray(buff,ftyp) {
    var i,ta;
    if (typeof Uint8Array.from != 'undefined') {
      switch (ftyp) {
        case 'Float32Array': return new Float32Array(Uint8Array.from(buff).buffer);
        case 'Float64Array': return new Float64Array(Uint8Array.from(buff).buffer);
        case 'Int8Array':    return new Int8Array(Uint8Array.from(buff).buffer);
        case 'Int16Array':   return new Int16Array(Uint8Array.from(buff).buffer);
        case 'Int32Array':   return new Int32Array(Uint8Array.from(buff).buffer);
      }
    } else {
      // Fall-back conversion
      switch (ftyp) {
        case 'Float32Array': 
          ta=new Float32Array(buff.length/4);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readFloatLE(i*4);
          return ta;
        case 'Float64Array': 
          ta=new Float64Array(buff.length/8);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readDoubleLE(i*8);
          return ta;
        case 'Int8Array': 
          ta=new Int8Array(buff.length);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff[i];
          return ta;
        case 'Int16Array': 
          ta=new Int16Array(buff.length/2);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readInt16LE(i*2);
          return ta;
        case 'Int32Array': 
          ta=new Int32Array(buff.length/4);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readInt32LE(i*4);
          return ta;
      }
    }
  }

  function stringify(obj,mask) {
    return JSON.stringify(obj, function (key, value) {
// console.log(key,value,typeof value);
      if (mask && typeof value == 'object' && !(value instanceof Array)) {
        var name = value.getConstructorName();
        if (mask[name]) {
          var proto = {__PROTO__:name};
          Object.keys(value).map(function (key) {
            proto[key]=value[key];
          });
          return proto;
        }
      }
      if (value instanceof Function || typeof value == 'function')
        return {__function__:value.toString(true)} // try minification (true) if supported
      if (value instanceof Buffer)
        return {__buffer__:value.toString('base64')};
      if (typeof Float64Array != 'undefined' && value instanceof Float64Array)
        return {__buffer__:typedarrayTObase64(value,Float64Array),__type__:'Float64Array'};
      if (typeof Float32Array != 'undefined' && value instanceof Float32Array)
        return {__buffer__:typedarrayTObase64(value,Float32Array),__type__:'Float32Array'};
      if (typeof Int8Array != 'undefined' && value instanceof Int8Array)
        return {__buffer__:typedarrayTObase64(value,Int8Array),__type__:'Int8Array'};
      if (typeof Int16Array != 'undefined' && value instanceof Int16Array)
        return {__buffer__:typedarrayTObase64(value,Int16Array),__type__:'Int16Array'};
      if (typeof Int32Array != 'undefined' && value instanceof Int32Array)
        return {__buffer__:typedarrayTObase64(value,Int32Array),__type__:'Int32Array'};
      if (value instanceof RegExp)
        return '{"__regex__":"' + value +'"}';
       
      return value;
    });
  }
  function parse (str,mask) {
    return JSON.parse(str, function (key, value) {
      // console.log('key:'+key,'value:'+value)
      if (typeof value == 'object' && value.__function__)
        return value.__function__;
      if (typeof value == 'object' && value.__buffer__) {
        if (!value.__type__)
          return value.__buffer__;
        else 
          return base64TOtypedarray(Buffer(value.__buffer__,'base64'),value.__type__);
      }
      if (mask && typeof value == 'object' && value.__PROTO__ && mask[value.__PROTO__]) {
        var proto = value.__PROTO__;
        delete value.__PROTO__;
        value.__proto__=mask[proto].prototype;
      }
      try {
        switch (key) {
          case '__function__':
            with (mask||{}) {
              return eval('('+value+')');
            }
          case '__buffer__':
            return Buffer(value,'base64');
          break;
        }
      } catch (e) {
        print(e)
        throw {error:e,key:key,value:value};
      }
      return value;
    })
  }
  exports.stringify       = stringify;
  exports.parse           = parse;
  exports.serialize       = stringify;
  exports.deserialize     = parse;
  exports.clone           = function (obj, date2obj) {
    return exports.parse(exports.stringify(obj), date2obj);
  };
  exports.current =function (module) { current=module.current; };
}(typeof exports === 'undefined' ? (window.JSONfo = {}) : 
  (typeof exports == 'undefined' ? (global.JSONfo = {}) : exports)));
