var CoreModule = {};
CoreModule['com/io']='com/io.app';
CoreModule['com/pwgen']='com/pwgen.lw';
CoreModule['assert']='os/assert';
CoreModule['crypto']='os/crypto.rand';
CoreModule['events']='os/events';
CoreModule['path']='os/path';
CoreModule['string_decoder']='os/string_decoder';
CoreModule['util']='util';
CoreModule['http']='http';
CoreModule['os']='os';
CoreModule['net']='net';
CoreModule['fs']='fs';
CoreModule['stream']='';
CoreModule['url']='';
CoreModule['zlib']='';
CoreModule['child_process']='';

var BundleModuleCode=[];
var BundleObjectCode=[];
var BundleModules = [];
var Fs = require("fs");
if (typeof __dirname == 'undefined') __dirname = '';
if (typeof __filename == 'undefined') __filename = '/home/sbosse/proj/jam/js/ui/app/app.js';
//From compat.js
var any = undefined;
var empty = null;
var none = null;
var _ = undefined;
var int = function (v) {return v|0};
var div = function (a,b) {return a/b|0};
var print = function (msg) {console.log(msg)};
if (typeof global == 'undefined') global={};
PATH=[process.cwd(),".","/home/sbosse/proj/jam/js","/opt/JAM"];
function _isdir(path) {
  var stats=Fs.statSync(path);
  return stats && stats.isDirectory()};
function _search(index,file) {
  if (PATH.length==index) return file;
  var path=PATH[index];
  if (Fs.existsSync(path+"/"+file+".js")) return path+"/"+file+".js";
  else if (Fs.existsSync(path+"/"+file) && !_isdir(path+"/"+file)) return path+"/"+file;
  else return _search(index+1,file);
 }
Require=global.Require=function(modupath) { 
  var file,filepath;
  if (BundleModules[modupath]) return BundleModules[modupath];
  var exports={}; var module={exports:exports};
  if (CoreModule[modupath]!=undefined) modupath=CoreModule[modupath];
  if (modupath=='') return undefined;
  if (BundleModuleCode[modupath]) BundleModuleCode[modupath](module,exports,global,process);
  else if (BundleObjectCode[modupath]) BundleObjectCode[modupath](module,exports,global,process);
  else { try { file=_search(0,modupath); module = require(file)}
  catch (e) { var more="";
   if ((e.name==="SyntaxError"||e.name==="TypeError") && file) {
      var src=Fs.readFileSync(file,"utf8");
      var Esprima = Require("parser/esprima");
      try {
        var ast = Esprima.parse(src, { tolerant: true, loc:true });
        if (ast.errors && ast.errors.length>0) more = ", "+ast.errors[0];
      } catch (e) {
        if (e.lineNumber) more = ", in line "+e.lineNumber;
      }
   }
   console.log("Require import of "+modupath+" ("+file+") failed: "+e+more);
   // if (e.stack) console.log(e.stack);
   throw e; // process.exit(-1);
  }}
  BundleModules[modupath]=module.exports||module;
  return module.exports||module;};
FilesEmbedded=global.FilesEmbedded = {};
FileEmbedd=global.FileEmbedd = function (path,format) {};
FileEmbedded=global.FileEmbedded = function (path,format) {return FilesEmbedded[path](format);};
global.TARGET='node';

BundleModuleCode['com/io.app']=function (module,exports,global,process){
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
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.9.3
 **
 **    $INFO:
 *
 * This module encapsulates all IO operations (except networking) supporting
 * jvm applications.
 *
 **    $ENDOFINFO
 */
/*
 ************
 ** JVM (node.js,jxcore)
 ************
 */
var util = Require('util');
var GetEnv = Require('os/getenv');
var Base64 = Require('os/base64');
var Fs = Require('fs');

var stderr_fun = function (str) { process.stderr.write(str); };
var stdout_fun = function (str) { process.stdout.write(str); };

/*
 ** node.js specific
 */

var tracefile = undefined;
var tracing = false;
var timestamp = false;

/**
* Open a module and append all exported properties to the current global object.
* (top-level scope)
*/
global.open = function(name,context,as) {
  var module = Require(name);
  if (!context) context=global;
  for (var p in module) {
    context[p] = module[p];
  };
  if (as) context[as]=module;
}
global.print = console.log;

var io = {
  options: {
    columns:undefined,
    rows:undefined,
    log:console.log,
    err:console.err,
    warn:console.warn,
  },
   /**
    *
    * @param fd
    */
  close: function (fd) {
    Fs.closeSync(fd);
  },
  /**
  **  Return current date in year-month-day format
  */
  Date: function ()
  {
        var now = new Date();
        var year = "" + now.getFullYear();
        var month = "0" + (now.getMonth()+1);
        month = month.substring(month.length-2);
        var date = "0" + now.getDate();
        date = date.substring(date.length-2);
        return year + "-" + month + "-" + date;
  },
   /**
    *
    * @param msg
    */
  debug: function (msg) {
    this.options.err('Debug: ' + msg);
  },
  /**
    *
    * @param path
    */
  exists: function (path) {
    return Fs.existsSync(path);
  },
  error: undefined,
   /**
    *
    * @param msg
    */
  err: function (msg) {
    this.options.err('Error: ' + msg);
    throw Error(msg);
  },
  exit: function (n) {
       process.exit(n);
  },
   /**
    *
    * @param msg
    */
  fail: function (msg) {
    this.options.err('Fatal Error: ' + msg);
    process.exit(0);
  },
   /**
    *
    * @param path
    */
  file_exists: function (path) {
      return Fs.existsSync(path);
  },
   /** Search a file by iterating global PATH variable.
    *
    * @param name  File name or partial (relative) path
    */
  file_search: function (name) {
       // Expecting global PATH variable !?
       if (this.file_exists(name)) return name; 
       else if (typeof PATH !== 'undefined') {
         for (var p in PATH) {
           if (this.file_exists(PATH[p]+'/'+name)) return (PATH[p]+'/'+name);
         }
         return undefined;
       } else return undefined;
  },
   /**
    *
    * @param path
    * @returns {number}
    */
  file_size: function (path) {
       var stat = Fs.statSync(path);
       if (stat != undefined)
           return stat.size;
       else
           return -1;
  },
   /**
    *
    * @param path
    * @param timekind a c m
    * @returns {number}
    */
  file_time: function (path,timekind) {
       var stat = Fs.statSync(path);
       if (stat != undefined)
           switch (timekind) {
               case 'a': return stat.atime.getTime()/1000;
               case 'c': return stat.ctime.getTime()/1000;
               case 'm': return stat.mtime.getTime()/1000;
               default: return stat.mtime.getTime()/1000;
           }
       else
           return -1;
  },

   /**
    *  @return {string []}
    */
  getargs: function () {
       return process.argv;
  },
  getenv: function (name, def) {
       return GetEnv(name, def);
  },



  /**
   *
   * @param obj
   */
  inspect: function (obj) {
     return util&&util.inspect?util.inspect(obj):(typeof obj)
  },

   /**
    *
    * @param {boolean|string} condmsg conditional message var log=X;  log((log lt. N)||(msg))
    */
  log: function (condmsg) {
      if (condmsg==true) return;
      if (!timestamp) console.warn(condmsg);
      else {
        var date = new Date();
        var time = Math.floor(date.getTime());
        console.warn('['+process.pid+':'+time+']'+condmsg);
      }
  },
   /**
    *
    * @returns {*} RSS HEAP in kBytes {data,heap}
    */
  mem: function () {
       var mem = process.memoryUsage();
       return {data:(mem.rss/1024)|0,heap:(mem.heapUsed/1024)|0};
  },
   /**
    *
    * @param path
    * @param mode
    * @returns {*}
    */
  open: function (path, mode) {
       return Fs.openSync(path, mode);
  },

   /**
    *
    * @param msg
    */
  out: function (msg) {
    this.options.log(msg)
  },
   /**
    *
    * @param e
    * @param where
    */
  printstack: function (e,where) {
       if (!e.stack) e=new Error(e);
       if (!e.stack) e.stack ='empty stack';
       var stack = e.stack //.replace(/^[^\(]+?[\n$]/gm, '')
           .replace(/^\s+at\s+/gm, '')
           .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
           .split('\n');
       if (where==undefined) this.out(e);
       else this.out(where+': '+e);
       this.out('Stack Trace');
       this.out('--------------------------------');
       for(var i in stack) {
           if (i>0) {
               var line = stack[i];
               if(line.indexOf('Module.',0)>=0) break;
               this.out('   at '+line);
           }
       }
       this.out('--------------------------------');
  },
   /**
    *
    * @param fd
    * @param len
    * @param foff
    */
  read: function (fd, len, foff) {
       // TODO
  },
   /**
    *
    * @param path
    * @returns {string|undefined}
    */
  read_file: function (path) {
       try {
          return Fs.readFileSync(path,'utf8');
       } catch (e) {
          this.error=e;
          return undefined;
       }
  },
   /**
    *
    * @param path
    * @returns {*}
    */
  read_file_bin: function (path) {
       try {
          return Fs.readFileSync(path);
       } catch (e) {
          this.error=e;
          return undefined;
       }
  },
   /**
    *
    * @param fd
    */
  read_line: function (fd) {
       // TODO
  },
   /**
    *
    * @param fd
    * @param buf
    * @param boff
    * @param len
    * @param [foff]
    * @returns {number}
    */
  read_buf: function (fd, buf, boff, len, foff) {
       return Fs.readSync(fd, buf, boff, len, foff);
  },
   /**
    *
    * @param e
    * @param where
    */
  sprintstack: function (e) {
       var str='';
       if (e==_ || !e.stack) e=new Error(e);
       if (!e.stack) e.stack ='empty stack';
       var stack = e.stack //.replace(/^[^\(]+?[\n$]/gm, '')
           .replace(/^\s+at\s+/gm, '')
           .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
           .replace(/^Object.eval\s*\(/gm, '')
           .split('\n');
       for(var i in stack) {
           if (i>0) {
               var line = stack[i];
               if(line.indexOf('Module.',0)>=0) break;
               if (str!='') str += '\n';
               str += '  at '+line;
           }
       }
       return str;
  },
   /**
    * 
    */
  stacktrace: function () {
       var e = new Error('dummy');
       if (!e.stack) e.stack ='empty stack';
       var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
           .replace(/^\s+at\s+/gm, '')
           .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
           .split('\n');
       this.out('Stack Trace');
       this.out('--------------------------------');
       for(var i in stack) {
           if (i>0) {
               var line = stack[i];
               if(line.indexOf('Module.',0)>=0) break;
               this.out('  at '+line);
           }
       }
       this.out('--------------------------------');
  },
   /**
    *
    * @param fun
    */
  set_stderr: function(fun) {
       stderr_fun=fun;
  },
   /**
    *
    * @param fun
    */
  set_stdout: function(fun) {
       stdout_fun=fun;
  },
   /**
    *
    * @param msg
    */
  stderr: function (msg) {
       stderr_fun(msg);
  },
  // sleep(ms)
  sleep: function(delay) {
     var start = new Date().getTime();
     while (new Date().getTime() < start + delay);
  },

   /**
    *
    * @param msg
    */
  stdout: function (msg) {
       stdout_fun(msg);
  },
   /**
    *
    * @param fd
    */
  sync: function (fd) {
       Fs.fsyncSync(fd);
  },
  /** Return system time in milliseconds
    */
  time: function () {
     var date = new Date();
     return Math.floor(date.getTime());
  },
  /**
  **  Return current time in hour:minute:second format
  */
  Time: function ()
  {
        var now = new Date();
        var hour = "0" + now.getHours();
        hour = hour.substring(hour.length-2);
        var minute = "0" + now.getMinutes();
        minute = minute.substring(minute.length-2);
        var second = "0" + now.getSeconds();
        second = second.substring(second.length-2);
        return hour + ":" + minute + ":" + second;
  },
   /** Write a message with a time stamp written to the trace file.
    *
    * @param {boolean|string} condmsg conditional message var trace=Io.tracing;  trace(trace||(msg))
    */
  trace: function (condmsg) {
       if (condmsg != true && tracefile != undefined) {
           var date = new Date();
           var time = Math.floor(date.getTime());
           Fs.writeSync(tracefile, '[' + time + '] ' + condmsg + '\n');
       }
  },
  tracing: tracing,
   /**
    *
    * @param {string} path
    */
  trace_open: function (path) {
       tracefile = Fs.openSync(path, 'w+');
       if (tracefile != undefined) this.tracing = false;
  },
   /**
    *
    * @param msg
    */
  warn: function (msg) {
      if (!timestamp) this.options.warn('Warning: ' + msg);
      else {
        var date = new Date();
        var time = Math.floor(date.getTime());
        console.warn('['+process.pid+':'+time+'] Warning: '+msg);
      }   
  },
  workdir: function () {
       return this.getenv('PWD',this.getenv('CWD',''));
  },
   /**
    *
    * @param fd
    * @param data
    * @param [foff]
    * @returns {number}
    */
  write: function (fd, data, foff) {
       return Fs.writeSync(fd, data, foff);
  },
   /**
    *
    * @param fd
    * @param buf
    * @param bpos
    * @param blen
    * @param [foff]
    * @returns {number}
    */
  write_buf: function (fd, buf, bpos, blen, foff) {
       return Fs.writeSync(fd, buf, bpos, blen, foff);
  },
   /**
    *
    * @param path
    * @param {string} buf
    */
  write_file: function (path,str) {
       try {
           Fs.writeFileSync(path, str, 'utf8');
           return str.length;
       } catch (e) {
           return -1;
       }
  },
   /**
    *
    * @param path
    * @param buf
    * @returns {*}
    */
  write_file_bin: function (path,buf) {
       try {
          Fs.writeFileSync(path, buf, 'binary');
          return buf.length;
       } catch (e) {
          this.error=e;
          return -1;
       }
  },
   /**
    *
    * @param fd
    * @param {string} str
    * @returns {number}
    */
  write_line: function (fd, str) {
       return Fs.writeSync(fd, str+NL);
  },




 
   /**
    *  Process management
    */
   fork: undefined,
   exec: undefined,
   execSync: undefined,
   spawn: undefined,

   /**
    * OS
    */
   hostname: function () {return 'localhost'}
};

module.exports = io;
};
BundleModuleCode['os/getenv']=function (module,exports,global,process){
var util = require("util");
//var url = require("url");

var fallbacksDisabled = false;

function _value(varName, fallback) {
  var value = process.env[varName];
  if (value === undefined) {
    if (fallback === undefined) {
      throw new Error('GetEnv.Nonexistent: ' + varName + ' does not exist ' +
                      'and no fallback value provided.');
    }
    if (fallbacksDisabled) {
      throw new Error('GetEnv.DisabledFallbacks: ' + varName + ' relying on fallback ' + 
                      'when fallbacks have been disabled');
    }
    return '' + fallback;
  }
  return value;
}

var convert = {
  string: function(value) {
    return '' + value;
  },
  int: function(value) {
    var isInt = value.match(/^-?\d+$/);
    if (!isInt) {
      throw new Error('GetEnv.NoInteger: ' + value + ' is not an integer.');
    }

    return +value;
  },
  float: function(value) {
    var isInfinity = (+value === Infinity || +value === -Infinity);
    if (isInfinity) {
      throw new Error('GetEnv.Infinity: ' + value + ' is set to +/-Infinity.');
    }

    var isFloat = !(isNaN(value) || value === '');
    if (!isFloat) {
      throw new Error('GetEnv.NoFloat: ' + value + ' is not a number.');
    }

    return +value;
  },
  bool: function(value) {
    var isBool = (value === 'true' || value === 'false');
    if (!isBool) {
      throw new Error('GetEnv.NoBoolean: ' + value + ' is not a boolean.');
    }

    return (value === 'true');
  }
  // , url: url.parse
};

function converter(type) {
  return function(varName, fallback) {
    if(typeof varName == 'string') { // default
      var value = _value(varName, fallback);
      return convert[type](value);
    } else { // multibert!
      return getenv.multi(varName);
    }
  };
};

var getenv = converter('string');

Object.keys(convert).forEach(function(type) {
  getenv[type] = converter(type);
});

getenv.array = function array(varName, type, fallback) {
  type = type || 'string';
  if (Object.keys(convert).indexOf(type) === -1) {
    throw new Error('GetEnv.ArrayUndefinedType: Unknown array type ' + type);
  }
  var value = _value(varName, fallback);
  return value.split(/\s*,\s*/).map(convert[type]);
};

getenv.multi = function multi(spec) {
  var key, value;
  var result = {};
  for(var key in spec) {
    var value = spec[key];
    if(util.isArray(value)) { // default value & typecast
      switch(value.length) {
        case 1: // no default value
        case 2: // no type casting
          result[key] = getenv(value[0], value[1]); // dirty, when case 1: value[1] is undefined
        break;
        case 3: // with typecast
          result[key] = getenv[value[2]](value[0], value[1]);
          break;
        default: // wtf?
          throw('getenv.multi(): invalid spec');
          break;
      }
    } else { // value or throw
      result[key] = getenv(value);
    }
  }
  return result;
};

getenv.disableFallbacks = function() {
  fallbacksDisabled = true;
};

getenv.enableFallbacks = function() {
  fallbacksDisabled = false;
};

module.exports = getenv;
};
BundleModuleCode['os/base64']=function (module,exports,global,process){
var keyStr = "ABCDEFGHIJKLMNOP" +
               "QRSTUVWXYZabcdef" +
               "ghijklmnopqrstuv" +
               "wxyz0123456789+/" +
               "=";

var Base64 = {
  encode: function (input) {
     input = escape(input);
     var output = "";
     var chr1, chr2, chr3 = "";
     var enc1, enc2, enc3, enc4 = "";
     var i = 0;

     do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
           enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
           enc4 = 64;
        }

        output = output +
           keyStr.charAt(enc1) +
           keyStr.charAt(enc2) +
           keyStr.charAt(enc3) +
           keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
     } while (i < input.length);

     return output;
  },

  encodeBuf: function (input) {
     var output = "";
     var NaN = output.charCodeAt(2);
     var chr1, chr2, chr3 = "";
     var enc1, enc2, enc3, enc4 = "";
     var i = 0;
     var len = input.length;
     do {
        chr1 = input.readUInt8(i++);
        chr2 = (i<len)?input.readUInt8(i++):NaN;
        chr3 = (i<len)?input.readUInt8(i++):NaN;

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
           enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
           enc4 = 64;
        }

        output = output +
           keyStr.charAt(enc1) +
           keyStr.charAt(enc2) +
           keyStr.charAt(enc3) +
           keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
     } while (i < len);

     return output;
  },

  decode: function (input) {
     var output = "";
     var chr1, chr2, chr3 = "";
     var enc1, enc2, enc3, enc4 = "";
     var i = 0;

     input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

     do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
           output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
           output = output + String.fromCharCode(chr3);
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

     } while (i < input.length);

     return unescape(output);
  },
  decodeBuf: function (input) {
     var len = input.length;
     var buf = new Buffer(len);
     var chr1, chr2, chr3 = "";
     var enc1, enc2, enc3, enc4 = "";
     var i = 0;
     var buflen = 0;
     input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
     buf.fill(0);
     do {
        enc1 = keyStr.indexOf(input.charAt(i++));
        enc2 = keyStr.indexOf(input.charAt(i++));
        enc3 = keyStr.indexOf(input.charAt(i++));
        enc4 = keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        buf.writeUInt8(chr1,buflen);
        buflen++;
        if (enc3 != 64) {
          buf.writeUInt8(chr2,buflen);
          buflen++;
        }
        if (enc4 != 64) {
            buf.writeUInt8(chr3,buflen);
            buflen++;
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

     } while (i < input.length);

     return buf.slice(0,buflen);
  }

};


module.exports = Base64;
};
BundleModuleCode['com/path']=function (module,exports,global,process){
var Fs = Require('fs');

var _process = process || {};
(function () {
  "use strict";

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


var isWindows = _process.platform === 'win32';
var util = Require('util');
if (!util.deprecate) util.deprecate=function(f,w) {return f;};

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}


if (isWindows) {
  // Regex to split a windows path into three parts: [*, device, slash,
  // tail] windows-only
  var splitDeviceRe =
      /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

  // Regex to split the tail part of the above into [*, dir, basename, ext]
  var splitTailRe =
      /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

  // Function to split a filename into [root, dir, basename, ext]
  // windows version
  var splitPath = function(filename) {
    // Separate device+slash from tail
    var result = splitDeviceRe.exec(filename),
        device = (result[1] || '') + (result[2] || ''),
        tail = result[3] || '';
    // Split the tail into dir, basename and extension
    var result2 = splitTailRe.exec(tail),
        dir = result2[1],
        basename = result2[2],
        ext = result2[3];
    return [device, dir, basename, ext];
  };

  var normalizeUNCRoot = function(device) {
    return '\\\\' + device.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '\\');
  };

  // path.resolve([from ...], to)
  // windows version
  exports.resolve = function() {
    var resolvedDevice = '',
        resolvedTail = '',
        resolvedAbsolute = false;

    for (var i = arguments.length - 1; i >= -1; i--) {
      var path;
      if (i >= 0) {
        path = arguments[i];
      } else if (!resolvedDevice) {
        path = _process.cwd();
      } else {
        // Windows has the concept of drive-specific current working
        // directories. If we've resolved a drive letter but not yet an
        // absolute path, get cwd for that drive. We're sure the device is not
        // an unc path at this points, because unc paths are always absolute.
        path = _process.env['=' + resolvedDevice];
        // Verify that a drive-local cwd was found and that it actually points
        // to our drive. If not, default to the drive's root.
        if (!path || path.substr(0, 3).toLowerCase() !==
            resolvedDevice.toLowerCase() + '\\') {
          path = resolvedDevice + '\\';
        }
      }

      // Skip empty and invalid entries
      if (!util.isString(path)) {
        throw new TypeError('Arguments to path.resolve must be strings');
      } else if (!path) {
        continue;
      }

      var result = splitDeviceRe.exec(path),
          device = result[1] || '',
          isUnc = device && device.charAt(1) !== ':',
          isAbsolute = exports.isAbsolute(path),
          tail = result[3];

      if (device &&
          resolvedDevice &&
          device.toLowerCase() !== resolvedDevice.toLowerCase()) {
        // This path points to another device so it is not applicable
        continue;
      }

      if (!resolvedDevice) {
        resolvedDevice = device;
      }
      if (!resolvedAbsolute) {
        resolvedTail = tail + '\\' + resolvedTail;
        resolvedAbsolute = isAbsolute;
      }

      if (resolvedDevice && resolvedAbsolute) {
        break;
      }
    }

    // Convert slashes to backslashes when `resolvedDevice` points to an UNC
    // root. Also squash multiple slashes into a single one where appropriate.
    if (isUnc) {
      resolvedDevice = normalizeUNCRoot(resolvedDevice);
    }

    // At this point the path should be resolved to a full absolute path,
    // but handle relative paths to be safe (might happen when process.cwd()
    // fails)

    // Normalize the tail path

    function f(p) {
      return !!p;
    }

    resolvedTail = normalizeArray(resolvedTail.split(/[\\\/]+/).filter(f),
                                  !resolvedAbsolute).join('\\');

    return (resolvedDevice + (resolvedAbsolute ? '\\' : '') + resolvedTail) ||
           '.';
  };

  // windows version
  exports.normalize = function(path) {
    var result = splitDeviceRe.exec(path),
        device = result[1] || '',
        isUnc = device && device.charAt(1) !== ':',
        isAbsolute = exports.isAbsolute(path),
        tail = result[3],
        trailingSlash = /[\\\/]$/.test(tail);

    // If device is a drive letter, we'll normalize to lower case.
    if (device && device.charAt(1) === ':') {
      device = device[0].toLowerCase() + device.substr(1);
    }

    // Normalize the tail path
    tail = normalizeArray(tail.split(/[\\\/]+/).filter(function(p) {
      return !!p;
    }), !isAbsolute).join('\\');

    if (!tail && !isAbsolute) {
      tail = '.';
    }
    if (tail && trailingSlash) {
      tail += '\\';
    }

    // Convert slashes to backslashes when `device` points to an UNC root.
    // Also squash multiple slashes into a single one where appropriate.
    if (isUnc) {
      device = normalizeUNCRoot(device);
    }

    return device + (isAbsolute ? '\\' : '') + tail;
  };

  // windows version
  exports.isAbsolute = function(path) {
    var result = splitDeviceRe.exec(path),
        device = result[1] || '',
        isUnc = !!device && device.charAt(1) !== ':';
    // UNC paths are always absolute
    return !!result[2] || isUnc;
  };

  // windows version
  exports.join = function() {
    function f(p) {
      if (!util.isString(p)) {
        throw new TypeError('Arguments to path.join must be strings');
      }
      return p;
    }

    var paths = Array.prototype.filter.call(arguments, f);
    var joined = paths.join('\\');

    // Make sure that the joined path doesn't start with two slashes, because
    // normalize() will mistake it for an UNC path then.
    //
    // This step is skipped when it is very clear that the user actually
    // intended to point at an UNC path. This is assumed when the first
    // non-empty string arguments starts with exactly two slashes followed by
    // at least one more non-slash character.
    //
    // Note that for normalize() to treat a path as an UNC path it needs to
    // have at least 2 components, so we don't filter for that here.
    // This means that the user can use join to construct UNC paths from
    // a server name and a share name; for example:
    //   path.join('//server', 'share') -> '\\\\server\\share\')
    if (!/^[\\\/]{2}[^\\\/]/.test(paths[0])) {
      joined = joined.replace(/^[\\\/]{2,}/, '\\');
    }

    return exports.normalize(joined);
  };

  // path.relative(from, to)
  // it will solve the relative path from 'from' to 'to', for instance:
  // from = 'C:\\orandea\\test\\aaa'
  // to = 'C:\\orandea\\impl\\bbb'
  // The output of the function should be: '..\\..\\impl\\bbb'
  // windows version
  exports.relative = function(from, to) {
    from = exports.resolve(from);
    to = exports.resolve(to);

    // windows is not case sensitive
    var lowerFrom = from.toLowerCase();
    var lowerTo = to.toLowerCase();

    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== '') break;
      }

      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== '') break;
      }

      if (start > end) return [];
      return arr.slice(start, end + 1);
    }

    var toParts = trim(to.split('\\'));

    var lowerFromParts = trim(lowerFrom.split('\\'));
    var lowerToParts = trim(lowerTo.split('\\'));

    var length = Math.min(lowerFromParts.length, lowerToParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (lowerFromParts[i] !== lowerToParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    if (samePartsLength == 0) {
      return to;
    }

    var outputParts = [];
    for (var i = samePartsLength; i < lowerFromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('\\');
  };

  exports.sep = '\\';
  exports.delimiter = ';';

} else /* posix */ {

  // Split a filename into [root, dir, basename, ext], unix version
  // 'root' is just a slash, or nothing.
  var splitPathRe =
      /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  var splitPath = function(filename) {
    return splitPathRe.exec(filename).slice(1);
  };

  // path.resolve([from ...], to)
  // posix version
  exports.resolve = function() {
    var resolvedPath = '',
        resolvedAbsolute = false;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = (i >= 0) ? arguments[i] : _process.cwd();

      // Skip empty and invalid entries
      if (!util.isString(path)) {
        throw new TypeError('Arguments to path.resolve must be strings');
      } else if (!path) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charAt(0) === '/';
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeArray(resolvedPath.split('/').filter(function(p) {
      return !!p;
    }), !resolvedAbsolute).join('/');

    return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
  };

  // path.normalize(path)
  // posix version
  exports.normalize = function(path) {
    var isAbsolute = exports.isAbsolute(path),
        trailingSlash = path[path.length - 1] === '/',
        segments = path.split('/'),
        nonEmptySegments = [];

    // Normalize the path
    for (var i = 0; i < segments.length; i++) {
      if (segments[i]) {
        nonEmptySegments.push(segments[i]);
      }
    }
    path = normalizeArray(nonEmptySegments, !isAbsolute).join('/');

    if (!path && !isAbsolute) {
      path = '.';
    }
    if (path && trailingSlash) {
      path += '/';
    }

    return (isAbsolute ? '/' : '') + path;
  };

  // posix version
  exports.isAbsolute = function(path) {
    return path.charAt(0) === '/';
  };

  // posix version
  exports.join = function() {
    var path = '';
    for (var i = 0; i < arguments.length; i++) {
      var segment = arguments[i];
      if (!util.isString(segment)) {
        throw new TypeError('Arguments to path.join must be strings');
      }
      if (segment) {
        if (!path) {
          path += segment;
        } else {
          path += '/' + segment;
        }
      }
    }
    return exports.normalize(path);
  };


  // path.relative(from, to)
  // posix version
  exports.relative = function(from, to) {
    from = exports.resolve(from).substr(1);
    to = exports.resolve(to).substr(1);

    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== '') break;
      }

      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== '') break;
      }

      if (start > end) return [];
      return arr.slice(start, end + 1);
    }

    var fromParts = trim(from.split('/'));
    var toParts = trim(to.split('/'));

    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('/');
  };

  exports.sep = '/';
  exports.delimiter = ':';
}

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};


exports.exists = util.deprecate(function(path, callback) {
  if (Fs) Fs.exists(path, callback);
  else callback(false);
}, 'path.exists is now called `fs.exists`.');


exports.existsSync = util.deprecate(function(path) {
  if (Fs) return Fs.existsSync(path);
  else return false;
}, 'path.existsSync is now called `fs.existsSync`.');


if (isWindows) {
  exports._makeLong = function(path) {
    // Note: this will *probably* throw somewhere.
    if (!util.isString(path))
      return path;

    if (!path) {
      return '';
    }

    var resolvedPath = exports.resolve(path);

    if (/^[a-zA-Z]\:\\/.test(resolvedPath)) {
      // path is local filesystem path, which needs to be converted
      // to long UNC path.
      return '\\\\?\\' + resolvedPath;
    } else if (/^\\\\[^?.]/.test(resolvedPath)) {
      // path is network UNC path, which needs to be converted
      // to long UNC path.
      return '\\\\?\\UNC\\' + resolvedPath.substring(2);
    }

    return path;
  };
} else {
  exports._makeLong = function(path) {
    return path;
  };
}
}());
};
BundleModuleCode['com/sprintf']=function (module,exports,global,process){
(function(window) {
    var re = {
        not_string: /[^s]/,
        number: /[diefg]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[\+\-]/
    }

    function sprintf() {
        var key = arguments[0], cache = sprintf.cache
        if (!(cache[key] && cache.hasOwnProperty(key))) {
            cache[key] = sprintf.parse(key)
        }
        return sprintf.format.call(null, cache[key], arguments)
    }

    sprintf.format = function(parse_tree, argv) {
        var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = ""
        for (i = 0; i < tree_length; i++) {
            node_type = get_type(parse_tree[i])
            if (node_type === "string") {
                output[output.length] = parse_tree[i]
            }
            else if (node_type === "array") {
                match = parse_tree[i] // convenience purposes only
                if (match[2]) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < match[2].length; k++) {
                        if (!arg.hasOwnProperty(match[2][k])) {
                            throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                        }
                        arg = arg[match[2][k]]
                    }
                }
                else if (match[1]) { // positional argument (explicit)
                    arg = argv[match[1]]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (get_type(arg) == "function") {
                    arg = arg()
                }

                if (re.not_string.test(match[8]) && re.not_json.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                    throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
                }

                if (re.number.test(match[8])) {
                    is_positive = arg >= 0
                }

                switch (match[8]) {
                    case "b":
                        arg = arg.toString(2)
                    break
                    case "c":
                        arg = String.fromCharCode(arg)
                    break
                    case "d":
                    case "i":
                        arg = parseInt(arg, 10)
                    break
                    case "j":
                        arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6]) : 0)
                    break
                    case "e":
                        arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential()
                    break
                    case "f":
                        arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg)
                    break
                    case "g":
                        arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg)
                    break
                    case "o":
                        arg = arg.toString(8)
                    break
                    case "s":
                        arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg)
                    break
                    case "u":
                        arg = arg >>> 0
                    break
                    case "x":
                        arg = arg.toString(16)
                    break
                    case "X":
                        arg = arg.toString(16).toUpperCase()
                    break
                }
                if (re.json.test(match[8])) {
                    output[output.length] = arg
                }
                else {
                    if (re.number.test(match[8]) && (!is_positive || match[3])) {
                        sign = is_positive ? "+" : "-"
                        arg = arg.toString().replace(re.sign, "")
                    }
                    else {
                        sign = ""
                    }
                    pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " "
                    pad_length = match[6] - (sign + arg).length
                    pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : ""
                    output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg)
                }
            }
        }
        return output.join("")
    }

    sprintf.cache = {}

    sprintf.parse = function(fmt) {
        var _fmt = fmt, match = [], parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = match[0]
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree[parse_tree.length] = "%"
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match = []
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list[field_list.length] = field_match[1]
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list[field_list.length] = field_match[1]
                            }
                            else {
                                throw new SyntaxError("[sprintf] failed to parse named argument key")
                            }
                        }
                    }
                    else {
                        throw new SyntaxError("[sprintf] failed to parse named argument key")
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
                }
                parse_tree[parse_tree.length] = match
            }
            else {
                throw new SyntaxError("[sprintf] unexpected placeholder")
            }
            try {_fmt = _fmt.substring(match[0].length)} catch (e) {throw new SyntaxError("[sprintf] unexpected fromat")}
        }
        return parse_tree
    }

    var vsprintf = function(fmt, argv, _argv) {
        _argv = (argv || []).slice(0)
        _argv.splice(0, 0, fmt)
        return sprintf.apply(null, _argv)
    }

    /**
     * helpers
     */
    function get_type(variable) {
        return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
    }

    function str_repeat(input, multiplier) {
        return Array(multiplier + 1).join(input)
    }

    /**
     * export to either browser or node.js
     */
    if (typeof exports !== "undefined") {
        exports.sprintf = sprintf
        exports.vsprintf = vsprintf
    }
    else {
        window.sprintf = sprintf
        window.vsprintf = vsprintf

        if (typeof define === "function" && define.amd) {
            define(function() {
                return {
                    sprintf: sprintf,
                    vsprintf: vsprintf
                }
            })
        }
    }
})(typeof window === "undefined" ? this : window);
};
BundleModuleCode['/home/sbosse/proj/jam/js/ui/app/app.js']=function (module,exports,global,process){
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
 **    $CREATED:     14-08-17 by sbosse.
 **    $VERSION:     1.7.3
 **
 **    $INFO:
 **
 **     Termnial GUI toolkit supporting pages using blessed/curses library.
 **     UI layout is similar to mobile application programs.
 **     A set of styles can defined used as default styles for various elements.
 **
 **     type styles = {
 **       button?:{fg?,bg?,border?},
 **       checkbox?:{},
 **       dialog?:{fg?,bg?},
 **       filemanager?:{fg?,bg?,arrows?:{fg?,bg?},border?,box:{bg?,border?},
 **                     label?:{fg?,bg?},input?:{fg?,bg?}},
 **       input:{fg?,bg?,border?,label?},
 **       keyboard?:{bg?,border?,label?:{fg,bg}},
 **       label:{bold?,fg?,bg?},
 **       
 **   New: UI Builder from compact template
 **
 **  Template (builder) Type Interface
 **  =================================
 **
 **  (@: smybolic identifier, parameter name, or wildcard place holder, $: type macro, ?:optional, ..:more,
 **   st {a,b,..}: sub type of object type st)
 **  
 **   typeof @border = { type? : string = 'line'|'none'|.., fg:string is color, .. }
 **    
 **   typeof @styles = {
 **     button?: { fg?, bg?, border? },
 **     input?:  { border? },
 **     tree?:   { border? },
 **     ..,
 **     @customstyle : { .. },
 **     ..
 **   }
 **
 ** Widget event handler:
 **
 ** type handler = function (wname:string,wval:boolean|number|string)
 ** type handlerT = function (wname:string,label:string,path:string,data:{name:string,parent:node,..})
 ** type handlerL = function (wname:string,label:string,data:{content:string,..})
 ** type handler1 = function (wname:string) is check handler
 ** type handlerp = function (pname:string) is page handler
 ** type handlerd = function (wname:string,data:*)
 **
 ** Widget styles and attributes:
 **
 ** $pos = top:number | left:number | right:number | center:boolean
 ** $geom = width:number | hight:number
 ** $cstyle = fg:string | bg:string 
 **
 ** Widget descriptor types:
 **
 ** type button =     { type='button', $pos?, $geom?, content:string, $cstyle, .. , onclick?:handler }
 ** type label =      { type='label', $pos?, $geom?,content:string, .. }
 ** type info =       { type='info', $pos?, $geom?, label:string, value?:string, .. }
 ** type checkbox =   { type='checkbox', $pos?, $geom?, text:string, value:string, .. , onclick?:handler, on?: on {check,uncheck} }
 ** type input =      { type='input', $pos, $geom?, wrap?:boolean, label:string, value?:string, onchange?:handler, .. }
 ** type radiobutton = { type='radiobutton', $pos, $geom?, .. }
 ** type group =      { type='group', name?:string, @but1:radiobutton, @but2:radiobutton, .., onclick?:handler }
 ** type tree =       { type='tree', $pos, $geom, .. ,  onclick?:handlerT }
 ** type list =       { type='tree', depth?:number, $pos, $geom, .. , onclick?:handlerL }
 **
 ** type widget = button | label | checkbox | input | group | tree | ..
 **
 ** The builder creates widget objects from descriptors that can be accessed by UI.pages.@name.
 **
 ** method (object of info).update (string) 
 ** method (object of tree).update ({}) 
 ** method (object of info).update (string) 
 ** method (object of info).setValue (string) 
 ** method (object of input).getValue () 
 ** method (object of widget).setStyle ({})
 **
 ** type on = { click?:handler|string, onclick?:handler|string, 
 **             check?:handler1, uncheck?:handler1, 
 **             keypress:{key: string | string [], handler: fucntion (@char,@key)] [],
 **             selected?:handlerd, change?:handler,
 **             show?:handlerp, hide?: handlerp }
 ** 
 ** $pageparam = next:string | prev:string | on: on {show,hide} | show:function | hide:function
 ** $widget = @name : widget
 **
 ** typeof content = {
 **   pages : { main: { $widget, $widget, .. , $pageparam, $pageparam, .. }, @p2: { @widget, .. }, .. }
 **   info?: {}
 ** }
 **
 ** ---
 **
 **  Examples (with template builder, see also ui/app/demo2.js)
 **
 **  UIApp = Require('ui/app/app');
 **  UI = UIApp.UI({});
 **  UI.init();
 **  styles = {}
 **  content = { pages : {
 **    main: { 
 **     lab1: {type:'label',  center:true, top:1, content:'Menu'},
 **     but1: {type:'button', left:1,  content:'QUIT',  bg:'red', onclick: process.exit },
 **     but2: {type:'button', right:1, content:'SETUP', onclick:'setup' },
 **    },
 **    setup: {  
 **     lab1: {type:'label',  center:true, top:1, content:'Menu'},
 **     but1: {type:'button', left:1,  content:'<< MENU',  onclick:'main' },
 **    }
 **  }}
 **  UI.builder(styles,content)
 **  UI.start()
 **
 ** ----------------------
 **
 **  Examples (without builder, programmatically):
 **
 **   ui=UIApp.UI({
 **     pages:7,
 **     terminal:this.options.terminal||'xterm-color',
 **     title:'JAMAPP (C) Stefan Bosse'
 **   });
 **   ui.init(); 
 **   page=ui.pages[1];
 **   page.b1= ui.button({left:1,content:'QUIT'});
 **   page.b1.on('press', function(data) {
 **    return process.exit(0);  
 **   });   
 **   page.l1 = ui.label({center:true,top:1,content:'Menu'});
 **   page.b2 = ui.button({right:1,content:'SETUP'});
 **   page.b2.on('press', function(data) {
 **     ui.pages.hide(1);    
 **     ui.pages.show(2);
 **   });
 **   // or
 **   page.b2.on('press', function(data) {
 **     ui.pages.hide();  
 **     ui.pages.show('next');
 **   });
 **
 **   page.l2 = ui.label({center:true,top:1,content:'Setup'});
 **   page.i1 = ui.input({top:4,left:4,label:'Broker IP Address',value:'localhost'});
 **   page.i1.setValue('127.0.0.1');
 **   url=page.i1.getValue();
 **
 **   page.i4 = ui.info({top:16,left:4,width:ui.screen.width-8,label:'JAM Status'});
 **
 **   page.l2 = ui.label({left:4,top:16,content:'Protocol'});
 **   page.ch21 = ui.radiobutton({left:4,top:18,text:'HTTP',value:false,group:2});
 **   page.ch22 = ui.radiobutton({left:4,top:20,text:'TCPIP',value:true,group:2});
 **
 **   page.l3 = ui.label({left:4,top:22,content:'Messages'});
 **   page.ch31 = ui.checkbox({left:4,top:24,text:'Agent ID',value:false});
 **   page.ch32 = ui.checkbox({left:4,top:26,text:'Parent ID',value:false});
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var blessed = Require('term/blessed');

var options = {
  version: '1.7.3'
}

/** pre-defined layouts based on screen rows and columns
 *
 */
var LAYOUT = {
  SMALL:'small',
  NORMAL:'normal',
  LARGE:'large',
  XLARGE:'xlarge',
  PORTRAIT:'portrait',
  LANDSCAPE:'landscape',
  from: function (screen) {
    if (screen.width>screen.height) {
      if(screen.width<70) return {small:true,landscape:true};
      else return {normal:true,landscape:true};
    } else {
      if(screen.height<70) return {small:true,portrait:true};
      else return {normal:true,portrait:true};
    } 
  }
}

/** Main User Interface providing a multiple page view
 *  Events: pages -> 'load'
 *  typeof options = {pages,terminal,forcecursor,styles}
*/ 
function UI(options) {
  var self=this,i;
  if (!(this instanceof UI)) {
    return new UI(options);
  }
  this.options=options||{};
  if (!this.options.pages) this.options.pages=1;
  if (!this.options.terminal) {
    this.options.terminal=
      (process.platform === 'win32' ? 'windows-ansi' : 'xterm-color');
  }
  if (this.options.forcecursor==undefined) this.options.forcecursor=true;
  
  this.page = 1;
  this.pages = [];           // Pages
  this.static = {};          // Top-level widegts visible on all pages
  this.styles=options.styles||{};
  
  for(i=0;i<=this.options.pages;i++) {
    this.pages.push({});
  }
  this.pages.show = function (page) {
    var thepage,p,current=self.page;
    switch (page) {
      case 'prev': 
        if (self.pages[self.page] && self.pages[self.page].prev) page=self.pages[self.page].prev;
        else if (self.pages[self.page-1]) page=self.page-1;
        break;
      case 'next': 
        if (self.pages[self.page] && self.pages[self.page].next) page=self.pages[self.page].next; 
        else if (self.pages[self.page+1]) page=self.page+1;
        break;
      case 'this': 
      case undefined:
        page=self.page; break;
    }
    thepage=self.pages[page];
    if (self.events[page] && self.events[page]['load'])
      self.events[page]['load']();
    for (p in thepage) {
      if (thepage[p] && thepage[p].show && !thepage[p].noshow) thepage[p].show();
    }
    self.screen.render();
    self.page=page;
  };
  this.pages.hide = function (page) {
    var thepage,p;
    if (page=='this' || page==undefined) page=self.page;
    thepage=self.pages[page];
    for (p in thepage) 
      if (thepage[p] && thepage[p].hide) thepage[p].hide();
    // hide cursor
    if (self.options.terminal.indexOf('xterm') != -1 && self.options.forcecursor)
       self.screen.program.resetMode('?25');
  };
  this.events=[];
  this.pages.on = function(page,event,callback) {
    if (!self.events[page]) self.events[page]=[];
    self.events[page][event]=callback;
  }
}

/** Button widget
 *  Methods: on
 *  Events: 'press'
 *  typeof @options ={
 *    width,content,center,left,right,top,
 *    fg is textcolor,bg is button color,border,click
 *   }
 */
UI.prototype.button = function(options) {
  var width=options.width;
  if (Comp.obj.isString(options.width)) {
    // relative value in %!
    width=Comp.pervasives.int_of_string(options.width);
    width=this.screen.width*width/100;
  }
  var obj = blessed.button({
    width: options.width||(options.content.length+4),
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top||0,
    height: 3,
    align: 'center',
    content: options.content||'?',
    mouse:true,
    focus:false,
    border: options.border||this.getStyle('button.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('button.fg','white'),
      bg: options.bg||this.getStyle('button.bg','blue'),
      bold:true,
      border: {
        fg: this.getStyle('button.border.fg','black'),
        bg: this.getStyle('button.border.bg',undefined),
      },
      hover: {
        border: {
          fg: 'red'
        }
      }
    }  
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  if (options.click) obj.on('press',options.click);
  return obj;
}

/** Checkbox widget
 *  Methods: on
 *  Events: 'check','uncheck'
 *  typeof @options ={value?,left?,right?,top?,text,hidden?}
 */
UI.prototype.checkbox = function(options) {
  var obj = blessed.checkbox({
    checked: options.value||false,  
    left: options.left,
    right : options.right,
    top: options.top||0,
    mouse: true,
    inputOnFocus: true,
    height: 1,
    text:options.text||'empty'
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Dialog pop-up window widget
 *
 *  typeof @options = {width,height,center?,left?,right?,top?,okButton?,cancelButton}
 */
UI.prototype.dialog = function(options) {
  var width=options.width,height=options.height;
  if (Comp.obj.isString(options.width)) {
    // relative value in %!
    width=Comp.pervasives.int_of_string(options.width);
    width=int(this.screen.width*width/100);
  }
  if (Comp.obj.isString(options.height)) {
    // relative value in %!
    height=Comp.pervasives.int_of_string(options.height);
    height=int(this.screen.height*height/100);
  }
  var obj = blessed.Question({
    width: width,
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top||(options.center?int(this.screen.height/2-height/2):0),
    height: height,
    noshow:true,
    okButton     : options.okButton||'Okay',
    cancelButton : options.cancelButton,
    style: {
      bg:this.getStyle('dialog.bg','red'),
      fg:this.getStyle('dialog.fg','white'),
      bold:true
    }  
  });
  this.screen.append(obj);
  return obj;
}

/** File manager widget with buttons
 *
 *  typeof @options={fg?,bg?,parent?,border?,label?,height?,width?,top?,left?,autohide?,
 *                   okayBotton?,cancelButton?,input?,box?,arrows?}
 */
UI.prototype.fileManager = function(options) {
  if (options.box) {
    options.box.border=this.getStyle('filemanager.box.border',options.box.border);
    options.box.bg=this.getStyle('filemanager.box.bg',options.box.bg);
    options.input=this.getStyle('filemanager.input',options.input);
  }
  if (options.arrows) {
    options.arrows.fg=this.getStyle('filemanager.arrows.fg',options.arrows.fg);
    options.arrows.bg=this.getStyle('filemanager.arrows.bg',options.arrows.bg);
  }
  var obj = blessed.FileManager({
    parent:options.parent,
    border:options.border||this.getStyle('filemanager.border',{}),
    style: {
      fg: options.fg||this.getStyle('filemanager.fg',undefined),
      bg: options.bg||this.getStyle('filemanager.bg',undefined),
      label:options.label||this.getStyle('filemanager.label',undefined),
      selected: {
        bg: 'blue',
        fg:'white'
      },
      focus: {
        border: {
          fg: 'red'
        }
      }
    },
    height: options.height||'half',
    width: options.width||'half',
    top: options.top||'center',
    left: options.left||'center',
    label: '%path',
    cwd: options.cwd||process.env.PWD||process.env.CWD||process.env.HOME,
    autohide:options.autohide,
    hidden:options.hidden,
    noshow:options.hidden, // no show on page load
    keys: true,
    vi: true,
    scrollbar: {
      bg: 'white',
      ch: ' '
    },
    okayButton:options.okayButton||'OK',
    cancelButton:options.cancelButton||'Cancel',
    input:options.input,
    arrows:options.arrows,
    box:options.box,
    border:this.getStyle('filemanager.border',undefined)
  });
  
  this.screen.append(obj);
  return obj;
}

/** Filter supported widget options, transform special options (click,..). Used by page builder.
 *
 */
UI.prototype.filterOptions = function(options,wname) {
  var self=this,attr,wopts = {};
  for (attr in options) {
    switch (attr) {
      case 'type':
      case 'index':
        break;
      case 'on':
        switch (options.type) {
          case 'button' :
            if (options.on.click && typeof options.on.click == 'function') 
              wopts.click=function () { options[attr](wname) };
            if (options.on.onclick && typeof options.on.onclick == 'function') 
              wopts.click=function () { options[attr](wname) };
            break;
        }
        break;
      case 'click':
      case 'onclick':
        switch (options.type) {
          case 'button' :
            if (typeof options[attr] == 'string') // Its a page destination; show new page
              wopts.click=function () {
                if (!self.pages[options[attr]]) return;
                self.pages.hide('this');    
                self.pages.show(options[attr]);
              };
            else
              wopts.click=options[attr];
            break;
        }
        break;
      default:
        wopts[attr]=options[attr];
    }
  }
  return wopts;
}

/** getStyle
 *
 */
UI.prototype.getStyle = function(attr,def) {
  var path=attr.split('.'),elem,style=this.styles;
  while(path.length && style) {
    elem=path.shift();
    style=style[elem];
  }
  return style!=undefined?style:def;
}

/** Information message widget
 * Methods: setValue
 * typeof options = {wodth,top,left,height,label,wrap,color}
 */
UI.prototype.info = function(options) {
  var width=options.width;
  if (Comp.obj.isString(options.width)) {
    // relative value in %!
    width=Comp.pervasives.int_of_string(options.width);
    width=this.screen.width*width/100;
  }
  var obj = blessed.textbox({
    top: options.top||1,
    left: (options.center?int(this.screen.width/2-width/2):options.left||1),
    width: options.width||(this.screen.width-(options.left*2||2)),
    height: options.height||3,
    label: options.label,
    value: options.value||'',
    focus:false,
    wrap:options.wrap,
    //draggable:true,
    border: this.getStyle('info.border',{
      type: 'line'
    }),
    style: {
      fg:options.fg||this.getStyle('info.fg','blue'),
      bg: options.bg||this.getStyle('info.bg',undefined),
      label:this.getStyle('info.label',undefined),
      border: {
        fg: this.getStyle('info.border.fg','black'),
        bg: this.getStyle('info.border.bg',undefined),
      },
    }
  });
  
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Initialite APP and create screen
 *
 */
UI.prototype.init = function () {
  var self=this;
  // Information bar visible on all pages
  this.screen = blessed.screen({
    smartCSR: false,
    terminal: this.options.terminal
    });
  this.screen.title = this.options.title||'APP (C) Stefan Bosse';
  this.screen.cursor.color='red';  
  this.layout=LAYOUT.from(this.screen);
  // restore cursor
  if (this.options.terminal.indexOf('xterm') != -1 && this.options.forcecursor) 
    process.on('exit',function () {self.screen.program._write('\x1b[?12;25h')});
}

/** Input field widget
 * typeof options = {top,left,right,width,height,label,value}
 * method getValue, setValue
 * events: {'set content'}
 */
UI.prototype.input = function(options) {
  var self=this, width=options.width||(this.screen.width-(options.left*2||2));
  var obj = blessed.textbox({
    label: options.label||'My Input',
    value: options.value||'',
    //fg: 'blue',
    bg: 'default',
    barBg: 'default',
    barFg: 'blue',
    width: width,
    height: options.height||3,
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top||0,
    keys: true,
    vi: true,
    mouse: true,
    inputOnFocus: true,
    focus:true,
    wrap:options.wrap,
    multiline:options.multiline,
    //draggable:true,
    border: this.getStyle('input.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('input.fg','blue'),
      bg: options.bg||this.getStyle('input.bg',undefined),
      border: {
        fg: this.getStyle('input.border.fg','black'),
        bg: this.getStyle('input.border.bg',undefined),
      },
      label:this.getStyle('input.label',undefined),
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  obj.on('focus',function () {
    if (!self.options.keyboard) // show cursor
      return self.options.terminal.indexOf('xterm')!=-1 && self.options.forcecursor?
             self.screen.program._write('\x1b[?12;25h'):0; 
    if (!self._keyboard) 
      self._keyboard=self.keyboard({
        width:self.screen.width<60?'100%':'80%',
        height:self.layout.small?'100%':'90%',
        compact:self.layout.small
      });
    self._keyboard.setCallback(function (v) {if (v) obj.setValue(v),obj.update();});
    self._keyboard.setValue(obj.getValue());
    self._keyboard.setLabel(obj.getLabel());
    self._keyboard.show();
  });
  return obj;
}

/** Software keyboard widget
 *
 */
UI.prototype.keyboard = function(options) {
  var obj = blessed.keyboard({
    parent:options.parent||this.screen,
    border: 'line',
    height: options.height||'half',
    width: options.width||'half',
    top: options.top||'center',
    left: options.left||'center',
    label: 'Keyboard',
    hidden:options.hidden,
    compact:options.compact,
    okayButton:options.okayButton||'OK',
    cancelButton:options.cancelButton||(this.layout.small?'CAN':'Cancel'),
    delButton:'DEL',
    shiftButton:'>>',
    border:options.border||this.getStyle('keyboard.border',{}),
    style:{
      bg: options.bg||this.getStyle('keyboard.bg',undefined),
      label:options.label||this.getStyle('keyboard.label',undefined),
    }
  });
  this.screen.append(obj);
  return obj;  
}

/** Generic labelw idget
 * method setValue(string)|mutable=true
 * typeof options = {width?,left?,right?,top?,center?,mutable?,content}
 */
UI.prototype.label = function(options) {
  var obj = blessed.text({
    width: options.width||(options.content.length),
    left: (options.center?int(this.screen.width/2-options.content.length/2):options.left),
    right : options.right,
    top: options.top||0,
    height: options.height||1,
    focus:false,
    align: 'center',
    content: options.content||'?',
    style: {
      bg:options.style?options.style.bg:this.getStyle('label.bg',undefined),
      fg:options.style?options.style.fg:this.getStyle('label.fg',undefined),
      bold:this.getStyle('label.bold',false)
    }  
  });
  if (options.mutable) 
    obj.setValue = function (content) {
      obj.setContent('');
      obj.position.left=(options.center?int(this.screen.width/2-content.length/2):options.left);
      obj.setContent(content);
    };
    
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Generic list navigator widget with scrollbar
 * typeof options = {top,left,width,height,label}
 * method set(data:object|array)
 */
UI.prototype.list = function(options) {
  var obj =  blessed.list({
    top: options.top,
    left: options.left,
    width: options.width||(this.screen.width-options.left*2),
    height: options.height||(this.screen.height-options.top-4),
    label: options.label||'Log',
    focus:true,
    mouse:true,
    keys:true,
    arrows:options.arrows,
    border: this.getStyle('list.border',{
      type: 'line'
    }),
    style: {
      bg: options.bg||this.getStyle('list.bg',undefined),
      selected:options.selected||{fg:'white',bg:'red',bold:true},
      item:options.item||{bold:true},
      border: {
        fg: this.getStyle('list.border.fg','black')
      },
      label:this.getStyle('list.label',undefined),
      hover: {
        border: {
          fg: 'red'
        }
      },
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  obj.noshow=options.hidden;
  obj.set = obj.update = function (data) {
    var p,items=[];
    obj.clearItems();
    if (Comp.obj.isArray(data)) items=data;
    else for (p in data) {
      items.push(p);
    }
    obj.setItems(items);
    obj.screen.render();
  }
  this.screen.append(obj);
  return obj;
}

/** Log message widget with scrollbar
 * typeof options = {left,top,width,height,label,scrollback,..}
 */
UI.prototype.log = function(options) {
  if (options.top == undefined) options.top=2;
  if (options.left == undefined) options.left=1;
  var obj = blessed.log({
    top: options.top,
    left: options.left,
    width: options.width||(this.screen.width-options.left*2),
    height: options.height||(this.screen.height-options.top-4),
    label: options.label||'Log',
    mouse:true,
    keys:true,
    scrollback:options.scrollback||100,
    border: this.getStyle('log.border',{
      type: 'line'
    }),
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        fg: 'cyan',
        inverse: true
      }
    },
    alwaysScroll:true,
    scrollOnInput:true,
    style: {
      fg: options.fg||this.getStyle('log.fg','white'),
      bg: options.bg||this.getStyle('log.bg','black'),
      label:this.getStyle('log.label',undefined),
      border: {
        fg: this.getStyle('log.border.fg','green'),
        bg: this.getStyle('log.border.bg',undefined),
      },
      focus: {
        border: {
          fg: 'red'
        }
      }
    },
    arrows:options.arrows,
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Apply post option actions (event handling)
 *
 */
UI.prototype.postOptions = function(options,widget,wname) {
  var self=this,attr;
  for (attr in options) {
    switch (attr) {
      case 'on':
        switch (options.type) {
          case 'checkbox' :
            if (options.on.click && typeof options.on.click == 'function') 
              widget.on('check',function () { options.on.click(wname,true) }),
              widget.on('uncheck',function () { options.on.click(wname,false) });
            if (options.on.onclick && typeof options.on.onclick == 'function') 
              widget.on('check',function () {  options.on.onclick(wname,true) }),
              widget.on('uncheck',function () {  options.on.onclick(wname,false) });
            if (options.on.check && typeof options.on.check == 'function') 
              widget.on('check',function () { options.on.check(wname,true) });
            if (options.on.uncheck && typeof options.on.uncheck == 'function') 
              widget.on('uncheck',function () { options.on.uncheck(wname,false) });
            if (options.on.selected && typeof options.on.selected == 'function') 
              widget.on('selected',function (data) { options.on.uncheck(wname,data) });
            if (options.on.change && typeof options.on.change == 'function') 
              widget.on('change',function (data) { options.on.change(wname,data) });
            break;
        }
        break;
      case 'click':
      case 'onclick':
        switch (options.type) {
          case 'checkbox' :
            if (typeof options[attr] == 'function') 
              widget.on('check',function () { options[attr](wname,true) }),
              widget.on('uncheck',function () { options[attr](wname,false) })
            break;
          case 'list':
            if (typeof options[attr] == 'function') 
              widget.on('selected',function (data) { options[attr](wname,data.content,data) })
            break;       
          case 'tree':
            if (typeof options[attr] == 'function') 
              widget.on('selected',function (data) { 
                  var _data=data,path=data.name;
                  data=data.parent;
                  while(data) 
                    path=data.name+(data.name!='/'?'/':'')+path,
                    data=data.parent;                
                  options[attr](wname,_data.name,path,_data) 
              })
            break;       
        }
        break;
      case 'onchange':
        switch (options.type) {
          case 'input' :
            if (typeof options[attr] == 'function') 
              widget.on('change',function (data) {
                var content = widget.getContent();
                options[attr](wname,content) 
              })
            break;
        }      
        break;
    }
  }
}

/** Radio button widget; can be grouped
 *
 */
UI.prototype.radiobutton = function(options) {
  var obj = blessed.radiobutton({
    checked: options.value||false,  
    left: options.left,
    right : options.right,
    top: options.top||0,
    group:options.group,
    mouse: true,
    inputOnFocus: true,
    height: 1,
    text:options.text||'empty'
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}


UI.prototype.start = function () {
  this.screen.render();
  this.screen.program.hideCursor();
}

/** Generic data object tree navigator widget with scrollbar
  * typeof options = {top,left,width,height,label,depth}
  * method set(dats)/update(data)
  *
  * Data object can contain _update attributes (function) modifying the data content of elements
  * before opening a tree branch. Root data _update must call self.update(new data)!
  * Deeper _update functions have only to modify the object data passed as an argument.
  * Scalar tree leafes can be updated before opening branch by a virtual object:
  * {_virtual:string|number|boolean,_update:function (data) {data._value=<newval>}}
*/

UI.prototype.tree = function(options) {
  var obj =  blessed.tree({
    top: options.top,
    left: options.left,
    width: options.width||(this.screen.width-options.left*2),
    height: options.height||(this.screen.height-options.top-4),
    label: options.label||'Log',
    focus:true,
    arrows:options.arrows,
    border: this.getStyle('tree.border',{
      type: 'line'
    }),
    style: {
      bold:true,
      border: {
        fg: this.getStyle('tree.border.fg','black')
      },
      label:this.getStyle('tree.label',undefined),
      hover: {
        border: {
          fg: 'red'
        }
      },
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  function makeleaf (element,reference,data) {
    var content,children,name,funpat,isfun,p;
    children={};
    name = element.toString();
    funpat = /function[\s0-9a-zA-Z_$]*\(/i;
    isfun=Comp.obj.isFunction(element)||funpat.test(name);
    if (isfun) {
      element=Comp.string.sub(name,0,name.indexOf('{'));
    }
    if (!isfun || (isfun && options.showfun)) {
      children[element]={};
      content={children : children,reference:reference,data:data};
    }
    return content;
  }
  function maketree (element,reference) {
    var content,children,p;
    children={};
    if (element && (Comp.obj.isObject(element) || Comp.obj.isArray(element))) {
    // console.log(element)    
      if (element._update != undefined) element._update(element);
      if (element._value != undefined) return makeleaf(element._value,_,element);
      for (p in element) {
        if (p != '_update')
           children[p]={};
      }
      content={
         children : children,
         data : element
      }
    } else if (element != undefined) {
      return makeleaf(element,reference);
    } else {
      children[element]={};
      content={children : children};    
    }
    return content;
  };
  obj.noshow=options.hidden;
  // Create sub-trees
  obj.on('preselect',function(node){
    var content,children,element,data,name;  
    if (node.name != '/' && !node.extended)  {
      // Io.out(node.extended);
      data = node.data;
      if (data != none && (Comp.obj.isObject(data) || Comp.obj.isArray(data))) {
        node.children = {};
        if (Comp.obj.isArray(data) && Comp.array.empty(data) && Comp.hashtbl.empty(data)) {
          node.children={'[]' : {}};
        } else {
          if (data._update != undefined) data._update(data);
          if (data._value != undefined) return node.children=makeleaf(data._value,_,data).children;
          for (var p in data) {
            if (p != '_update') {
              element = data[p];
              content=maketree(element,data);
              if (content) node.children[p]=content;
            }
          }
        } 
      } else if (data == none && node.reference) {
          node.children = {};
          element=node.reference[node.name];
          name=element.toString();
          var funpat = /function[\s0-9a-zA-Z_$]*\(/i;
          var isfun=Comp.obj.isFunction(element)||funpat.test(name);
          if (isfun) {
            element=Comp.string.sub(name,0,name.indexOf('{'));
          }          
          node.children[element]={};
      } 
    } else if (node.name == '/' && node.extended) {
      if (node.data && node.data._update) {
        node.data._update()
      }
    }
  });
  obj.set = obj.update = function (data) {
    obj.DATA = {
      name:'/',
      extended:true,
      children: {},
      data:data,
    };
    for (var p in data) {
      var element=data[p];
      var content=options.depth && options.depth==1?{}:maketree(element,data);
      if (content) obj.DATA.children[p]=content;
    }
    obj.setData(obj.DATA);
  };
  obj.DATA = {
    name:'/',
    extended:true,
    children: {},
  };
  obj.setData(obj.DATA);
  this.screen.append(obj);
  return obj;
}

/** Build an application GUI from compact styles and pages template.
*
* @typeof styles = {
*  button?: { .. },
*  input?: {..},
*  tree?: { .. },
*  ..,
*  @customstyle : { .. },
*  ..
* }
* @typeof content = {
*   pages : { @p1: { .. }, @p2: { .. }, .. }
*   static?: { w1: { .. }, .. }
* }
*
*
*
*
*/

UI.prototype.builder = function(styles,content,options) {
  var self=this,pagename,page,pagedesc,entryname,entry,handler,o,childs,index;
  // Update styles
  this.styles=Comp.obj.inherit(this.styles,styles);

  if (!content.pages) throw Error("UI.builder: empty or invalid pages template (missing pages)");
  if (!content.pages.main) throw Error("UI.builder: no main page");
  function addhandler(obj,event,handler,arg1,arg2)  { obj.on(event,function () { handler(arg1,arg2) })}
  function addhandlerP(page,event,handler,arg1,arg2)  { self.pages.on(page,event,function () { handler(arg1,arg2) })}
  
  for (pagename in content.pages) {
    pagedesc=content.pages[pagename];
    this.pages[pagename]=page = {};
    for (entryname in pagedesc) {
      entry=pagedesc[entryname];
      // Information and control entries?
      switch (entryname) {
        case 'next':
          page.next=entry;
          continue;
          break;
        case 'prev':
          page.prev=entry;
          continue;
          break;
        case 'on':
          if (pagedesc.on.show) addhandlerP(pagename,'load',pagedesc.on.show,pagename);  
          if (pagedesc.on.load) addhandlerP(pagename,'load',pagedesc.on.load,pagename);  
          continue;
          break;
        case 'onclick':
          continue;
          break;
      }
      // Supported widget class?
      switch (entry.type) {
        case 'label':
          page[entryname]=this.label(this.filterOptions(entry,entryname));
          break;
        case 'button':
          page[entryname]=this.button(this.filterOptions(entry,entryname));     
          break;
        case 'input':
          page[entryname]=this.input(this.filterOptions(entry,entryname));       
          this.postOptions(entry,page[entryname],entryname);      
          break;
        case 'info':
          page[entryname]=this.info(this.filterOptions(entry,entryname));
          break;
        case 'tree':
          page[entryname]=this.tree(this.filterOptions(entry,entryname)); 
          this.postOptions(entry,page[entryname],entryname);      
          break;
        case 'list':
          page[entryname]=this.list(this.filterOptions(entry,entryname)); 
          this.postOptions(entry,page[entryname],entryname);      
          break;
        case 'checkbox':
          page[entryname]=this.checkbox(this.filterOptions(entry,entryname)); 
          this.postOptions(entry,page[entryname],entryname);      
          break;
        case 'radiobutton':
          break;
        case 'log':
          page[entryname]=this.log(this.filterOptions(entry,entryname));       
          this.postOptions(entry,page[entryname],entryname);      
          break;
        case 'group':
          // Group of radiobuttons
          childs={};
          handler=undefined;
          for (o in entry) {
            switch (o) {
              case 'type':
                break;
              case 'onclick':
                handler=entry[o];
                break;
              default:
                if (entry[o].type=='radiobutton') childs[o]=entry[o];
            }
          }
          for (o in childs) {
            options=this.filterOptions(childs[o],entryname);
            options.group=entryname;
            page[entryname+'.'+o]=this.radiobutton(options);
            
            if (handler) {
              if (childs[o].index != undefined) index=childs[o].index;
              else index=childs[o].text;
              addhandler(page[entryname+'.'+o],'check',handler,entryname,index);
            }
          }
          break;
        default: throw Error("UI.builder: invalid or unsupported widget type "+entry.type+" in "+entryname);
      } 
    }
  }
  if (content.static) {
    for(entryname in content.static) {
      entry=content.static[entryname];
      switch (entry.type) { 
        case 'info':
          this.static[entryname]=this.info(this.filterOptions(entry,entryname));
          break;
      }
    }
  }
  if (content.on && content.on.keypress && Comp.obj.isArray(content.on.keypress)) {
    content.on.keypress.forEach(function (entry) {
      if (typeof entry.key == 'string') 
        self.screen.key([entry.key], entry.handler);
      else if (entry.key && Comp.obj.isArray(entry.key))
        self.screen.key(entry.key, entry.handler);
    });
  }
  
  for (page in this.pages) this.pages.hide(page);
  this.pages.show('main');
}

module.exports = {
  options:options,
  LAYOUT:LAYOUT,
  UI:UI
}
};
BundleModuleCode['com/compat']=function (module,exports,global,process){
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
 **    $CREATED:     30-3-15 by sbosse.
 **    $VERSION:     1.23.1
 **
 **    $INFO:
 **
 **  JavaScript-OCaML Compatibility Module
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Path = Require('com/path');
var Sprintf = Require('com/sprintf');

/*******************************
** Some global special "values"
********************************/

/** A matching template pattern matching any value
 *
 * @type {undefined}
 */
global.any = undefined;
/** A matching template pattern matching any value
 *
 * @type {undefined}
 */
global._ = undefined;

/**
 *
 * @type {null}
 */
global.none = null;
/**
 *
 * @type {null}
 */
global.empty = null;

global.NL = '\n';

global.int = function (v) {return v|0};
global.div = function (a,b) {return a/b|0};

if (!Object.prototype.forEach) {
	Object.defineProperties(Object.prototype, {
		'forEach': {
			value: function (callback) {
				if (this == null) {
					throw new TypeError('Not an object');
				}
				var obj = this;
				for (var key in obj) {
					if (obj.hasOwnProperty(key)) {
						callback.call(obj, obj[key], key, obj);
					}
				}
			},
			writable: true
		}
	});
}
/** Just transfer parent prototypes to child
 *
 */
function inherit(child,parent) {
  for(var p in parent.prototype) {
    if (p == '__proto__') continue;
    child.prototype[p]=parent.prototype[p];
  }
}

/** Portable class inheritance and instanceOf polyfill
 *
 */
// SomeObject.prototype.__proto__=SomeObject2.prototype;
// Child class inherits prototype from parent using __proto__
function inheritPrototype(child,parent) {
  var __proto__=child.__proto__;
  child.prototype.__proto__=parent.prototype;
  if (!__proto__) for(var p in parent.prototype) {
    if (p == '__proto__') continue;
    child.prototype[p]=parent.prototype[p];
  }
}
// Polyfill fir o instanceof c with inheritance check (checking __proto__)
function instanceOf(obj,cla) {
  var p=obj.__proto__;
  if (obj instanceof cla) return true;
  while (p) {
    if (p === cla.prototype) return true;
    p=p.__proto__
  }
  return false;
}
// Polyfill for __defineGetter__ / __defineSetter__
function defineGetter(cla,prop,fun) {
  Object.defineProperty(cla.prototype,prop,{
    configurable:true,
    get:fun
  });
}
function defineSetter(cla,prop,fun) {
  Object.defineProperty(cla.prototype,prop,{
    configurable:true,
    set:fun
  });

}

global.inherit = inherit;
global.inheritPrototype = inheritPrototype;
global.instanceOf = instanceOf;
global.defineGetter = defineGetter;
global.defineSetter = defineSetter;

/**
 *
 */
var assert = function(condmsg) {
    if (condmsg != true) {
        Io.out('** Assertion failed: '+condmsg+' **');
        Io.stacktrace();
        throw Error(condmsg);
    }
};
global.assert=assert;

function forof(obj,f) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = obj[Symbol.iterator](), _step; 
         !(_iteratorNormalCompletion = (_step = _iterator.next()).done); 
         _iteratorNormalCompletion = true) {
      element = _step.value;

      f(element);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
}


global.forof=forof;

/** OBJ
 *
 */
var obj = {
    /** Compact an object:
     * [{a:b},[c:d},..] -> {a:b,c:d,..}
     * {a:[b]} -> {a:b}
     *
     */
    compact: function (o) {
      var a;
      if (obj.isArray(o)) {
        if (o.length==1 && obj.isObject(o[0])) return obj.compact(o[0]);
        else return o;
      } else if (obj.isObject(o)) for (a in o) {
          var elem=o[a];
          o[a]=obj.compact(elem);
      }
      return o;
    },
    copy: function (o) {
      if (o === null || typeof o !== 'object') {
        return o;
      }
 
      var temp = (o instanceof Array) ? [] : {};
      for (var key in o) {
        temp[key] = obj.copy(o[key]);
      }
 
      return temp;    
    },
    equal: function (o1,o2) {
      if (!o1 || !o2) return false;
      for(var i in o1) if (o1[i]!=o2[i]) return false;
      for(var i in o2) if (o1[i]!=o2[i]) return false;
      return true;
    },
    extend: function (o1,o2) {
      for(var i in o2) o1[i]=o2[i];
      return o1;
    },
    find: function(obj,fun) {
      var p;
      for(p in obj) {
          if (fun(obj[p],p)) return obj[p];
      }
    },

    hasProperty: function (o,p) {
      return o[p]!=undefined || (p in o);
    },
    head:function(o) {
      for (var p in o) return p;
      return undefined;
    },
    // transfer src attributes to dst recusively (no object overwrite)
    inherit: function (dst,src) {
      for(var i in src) {
        if (typeof dst[i] == 'object' && typeof src[i] == 'object')
          inherit(dst[i],src[i]);
        else if (typeof dst[i] == 'undefined')
          dst[i]=src[i];
      }
      return dst;
    },
    isArray:function (o) {
      if (o==_ || o ==null) return false;
      else return typeof o == "array" || (typeof o == "object" && o.constructor === Array);
    },
    isMatrix:function (o) {
      if (o==_ || o ==null) return false;
      else return obj.isArray(o) &&
                  obj.isArray(o[0]);
    },
    isEmpty: function (o) {
      for(var prop in o) {
         if (o[prop]!=undefined) return false;
      }
      return true;  
    },
    isFunction: function (o) {
        return typeof o == "function";
    },
    isObj:function (o) {
        return typeof o == "object";
    },
    isObject:function (o) {
        return typeof o == "object";
    },
    isRegex: function (o) {
        return o instanceof RegExp;
    },
    isString: function (o) {
        return typeof o == "string" || (typeof o == "object" && o.constructor === String);
    },
    isNumber: function (o) {
        return typeof o == "number" || (typeof o == "object" && o.constructor === Number);
    },


    iter: function(obj,fun) {
      var p;
      for(p in obj) {
        fun(obj[p],p)
      }
    }
};

/** ARRAY
 *
 */
var array = {
    /** Evaluate a function returning a boolean value for each member of the array and
     *  compute the boolean conjunction.
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     */
    and: function(array,fun) {
        var res=true;
        var i=0;
        var len=array.length;
        for(i=0;i<len;i++) {
            var element=array[i];
            res=res&&fun(element,i)
        }
        return res;
    },
    /** Append one element at the end of the array.
     *
     * @param {* []} array
     * @param {*} element
     * @returns {* []}
     */
    append : function(array,element) {
        array.push(element);
        return array;
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     */
    call: function(array,args) {
        var i=0;
        var len=array.length;
        for(i=0;i<len;i++) {
            var element=array[i];
            element()
        }
    },
    /** Check for an elenment in the array by using a check function.
     *
     * @param array
     * @param fun
     * @returns {boolean}
     */
    check: function(array,fun) {
        var i,exist;
        exist=false;
        loop: for(i in array) {
            var element=array[i];
            if (fun(element,i)) {
                exist=true;
                break loop;
            }
        }
        return exist;
    },
    /** Append array2 at the end of array inplace. The extended array is returned.
     *  Source array (1) will be modified.
     *
     * @param {*[]} array
     * @param {*[]} array2
     * @returns {*[]}
     */
    concat : function(array,array2) {
        for(var i in array2) {
            array.push(array2[i]);
        }
        return array;
    },
    /** Create the conjunction set of two arrays
     *
     */
    conjunction :function (set1,set2,fun) {
      return array.union(set1,set2,fun);
    },
    /**
     *
     * @param {*[]} array
     * @param {number|string|*|*[]} elements
     * @param {function} [fun] Optional equality test function
     * @returns {boolean}
     */
    contains : function(array,elements,fun) {
        var i = array.length;
        if (!fun) fun=function(o1,o2) {return o1===o2};
        if (obj.isArray(elements)) {
          while (i--) {
            var j = elements.length;
            while (j--) {
              if (fun(array[i],elements[j])) {
                  return true;
              }          
            }
          }
        }
        else while (i--) {
            if (fun(array[i],elements)) {
                return true;
            }
        }
        return false;
    },
    /** Return a fresh copy of the source array or copy src array to dst.
     *
     * @param array
     * @returns {Array.<T>|string|Blob|ArrayBuffer}
     */
    copy: function(src,dst) {
        var i;
        if (dst) {
          for(i in src) dst[i]=src[i];  
        } else return src.slice();
    },
    /** Create a new array with initial element values.
     *
     * @param length
     * @param init
     * @returns {Array}
     */
    create : function(length,init) {
        var arr = [], i = length;
        while (i--) {
          arr[i] = init;
        }
        return arr;
    },
    /** Create a matrix (array of array) with initial element values.
     *
     */
    create_matrix : function(rows,cols,init) {
        var m = [];
        var r = [];
        var i,j;
        for (i = 0; i < rows; i++) {
            r=[];
            for(j=0;j<cols;j++) r.push(init);
            m.push(r);
        }
        return m;
    },
    /** Create the (inclusive) disjunction set of two arrays.
     *  Source arrays will not be modified.
     *
     */
    disjunction :function (set1,set2,fun) {
      return array.merge(set1,set2);
    },
    /**
     *
     * @param array
     * @returns {boolean}
     */
    empty : function (array) {
      return (array==undefined ||
              array.length==0)
    },
    
    /** Test for equality
    */
    equal: function (a1,a2) {
      if (a1.length != a2.length) return false;
      for(var i in a1) if (a1[i]!=a2[i]) return false;
      return true;
    },
    
    /** Create the (exclusive) disjunction set of two arrays. 
     *  Source arrays will not be modified.
     *
     */
    exclusive :function (set1,set2,fun) {
        var i,j,found,res = [];
        for (i in set1) {
          found=false;
          loop1: for (j in set2) {
            if (fun != undefined && fun(set1[i],set2[j])) {found=true; break loop1;}
            else if (fun == undefined && set1[i]==set2[j]) {found=true; break loop1;};
          }
          if (!found) res.push(set1[i]);
        }
        for (i in set2) {
          found=false;
          loop2: for (j in set1) {
            if (fun != undefined && fun(set2[i],set1[j])) {found=true; break loop2;}
            else if (fun == undefined && set2[i]==set1[j]) {found=true; break loop2;};
          }
          if (!found) res.push(set2[i]);
        }
        return res;
    },
    /** Find an element in an array and return it (or none);
     *
     * @param array
     * @param fun
     * @returns {undefined|*}
     */
    find: function(array,fun) {
        var i;
        for(i in array) {
          if (fun(array[i],i)) return array[i];
        }
        return none;
    },
    /** Search and map an element of an array using a test&map function.
     *
     * @param array
     * @param {function(*,number):*} fun
     * @returns {undefined|*}
     */
    findmap: function(array,fun) {
        var i,found;
        for(i in array) {
          found=fun(array[i],i);
          if (found) return found;
        }
        return none;
    },
    /** Filter out elements using a test function.
     *
     * @param {* []} array
     * @param {function(*,number):boolean} fun
     * @returns {* []}
     */
    filter: function(array,fun) {
      if (array.filter) return array.filter(fun);
      else {
        var res=[],
            len=array.length,
            element,i;
        for(i=0;i<len;i++) {
            element=array[i];
            if (fun(element,i)) res.push(element);
        }
        return res;
      }
    },
    /** Filter out and map elements using a test&map function.
     *
     * @param {* []} array
     * @param {function(*,number):*|undefined} fun
     * @returns {* []}
     */
    filtermap: function(array,fun) {
        var res=[],
            len=array.length,
            element,mapped,i;
        for(i=0;i<len;i++) {
            element=array[i];
            mapped=fun(element,i);
            if (mapped!=undefined) res.push(mapped);
        }
        return res;
    },
    /** Flattens an array consting of arrays (and elements)
     *
     * @param array
     * @returns {Array}
     */
    flatten: function (array) {
        var res=[];
        var len=array.length;
        var i;
        for(i=0;i<len;i++) {
            var element=array[i];
            if (!obj.isArray(element)) res.push(element);
            else {
                var j;
                var len2=element.length;
                for(j=0;j<len2;j++) {
                    var element2=element[j];
                    res.push(element2);
                }
            }
        }
        return res;

    },
    /**
     *
     * @param array
     * @returns {*}
     */
    head : function(array) {
        return array[0];
    },
    /**
     *
     * @param length
     * @param fun
     * @returns {Array}
     */
    init : function(length,fun) {
        var arr = [], i = length;
        while (i--) {
          arr[i] = fun(i);
        }
        return arr;
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     */
    iter: function(array,fun) {
      /*
        var i=0;
        var len=array.length;
        for(i=0;i<len;i++) {
            fun(array[i],i)
        }
      */
      array.forEach(fun);
    },
    /**
     *
     * @param {* []} array1
     * @param {* []} array2
     * @param {function(*,*,number)} fun
     */
    iter2: function(array1,array2,fun) {
        var i=0;
        assert((array1.length == array2.length)||('Array.iter2: arrays of different lengths'));
        /*
        var len=array1.length;
        for(i=0;i<len;i++) {
            fun(array1[i],array2[i],i)
        }
        */
        array1.forEach(function (e1,i) { fun(e1,array2[i],i) });
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number)} fun Returning a true value leaves iteration loop
     */
    iter_break: function(array,fun) {
        var i=0;
        var len=array.length;
        for(i=0;i<len;i++) {
            var element=array[i];
            if (fun(element,i)) return;
        }
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     */
    iter_rev: function(array,fun) {
        var i;
        var len=array.length;
        for(i=len-1;i>=0;i--) {
            fun(array[i],i)
        }
    },
    /** Return last element of array.
     *
     */
    last : function(array) {
      var len=array.length;
      if (len==0) return none;
      else return array[len-1];
    },
    
    length : function(array) {
        return array.length;
    },
    /**
     *
     * @param {* []} array1
     * @param {* []} array2
     * @param {function(*,*,number)} fun
     * @returns {* []}
     */
    map2: function(array1,array2,fun) {
        var i=0;
        assert((array1.length == array2.length)||('Array.map2: arrays of different lengths'));
        var len=array1.length;
        var res=[];
        for(i=0;i<len;i++) {
            res.push(fun(array1[i],array2[i],i));
        }
        return res;
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     * @returns {* []}
     */
    map: function(array,fun) {
        var i=0;
        var len=array.length;
        var res=[];
        for(i=0;i<len;i++) {
            var element=array[i];
            res.push(fun(element,i));
        }
        return res;
    },
    /**
     *
     * @param {* []} array
     * @param {Function} fun_hdtl  - function(hd,tl)
     * @param {Function} [fun_empty] - function()
     */
    match: function(array,fun_hdtl,fun_empty) {
        if (array.length == 0) {
            if (fun_empty) fun_empty();
        } else if (array.length>1) {
            var hd = this.head(array);
            var tl = this.tail(array);
            fun_hdtl(hd,tl);
        } else fun_hdtl(this.head(array),[]);
    },
    /**
     *
     * @param {* []} array
     * @param {Function} fun_hd1hd2  - function(hd1,hd2)
     * @param {Function} [fun_hdtl]  - function(hd,tl)
     * @param {Function} [fun_empty] - function()
     */
    match2: function(array,fun_hd1hd2,fun_hdtl,fun_empty) {
        if (array.length == 0 && fun_empty)
            fun_empty();
        else if (array.length == 2) {
            var hd1 = this.head(array);
            var hd2 = this.second(array);
            fun_hd1hd2(hd1,hd2);
        }
        else if (array.length>1 && fun_hdtl) {
            var hd = this.head(array);
            var tl = this.tail(array);
            fun_hdtl(hd,tl);
        } else if (fun_hdtl) fun_hdtl(this.head(array),[]);
    },
    /** Return the maximum number of an array applying
     *  an optional mapping function.
     *
     * @param {* []} array
     * @param [fun]
     * @returns {number|undefined}
     */
    max : function (array,fun) {        
        var res=undefined;
        for(var i in array) {
            var num;
            if (fun) num=fun(array[i]); else num=array[i];
            if (!obj.isNumber(num)) return undefined;
            if (res==undefined) res=num; else res=pervasives.max(res,num);
        }
        return res;
    },
    /** Return the minimum number of an array applying
     *  an optional mapping function.
     *
     * @param {* []} array
     * @param [fun]
     * @returns {number|undefined}
     */
    min : function (array,fun) {        
        var res=undefined;
        for(var i in array) {
            var num;
            if (fun) num=fun(array[i]); else num=array[i];
            if (!obj.isNumber(num)) return undefined;
            if (res==undefined) res=num; else res=pervasives.min(res,num);
        }
        return res;
    },
    /** Check for an element in the array.
     *
     * @param {(number|string|boolean) []} array
     * @param {number|string|boolean} element
     * @returns {boolean}
     */
    member: function(array,element) {
        var i,exist;
        var len=array.length;
        exist=false;
        loop: for(i=0;i<len;i++) {
            var _element=array[i];
            if (_element==element) {
                exist=true;
                break loop;
            }
        }
        return exist;
    },
    /** Merge all arrays and return a new array.
     *
     * @param {Array} array1
     * @param {Array} array2
     * @param {Array} [array3]
     * @param {Array} [array4]
     * @returns {Array}
     */
    merge: function(array1,array2,array3,array4) {
        var arraynew=array1.slice();
        arraynew=arraynew.concat(array2);
        if (array3!=undefined) arraynew=arraynew.concat(array3);
        if (array4!=undefined) arraynew=arraynew.concat(array4);
        return arraynew;
    },
    /** Return the next element from array after val (next element after last is first!)
     * @param {Array} array
     * @param {number|string} val
     * @returns {number|string}
     */
    next: function(array,val) {
        var i;
        var len=array.length;
        if (obj.isString(val))
          for(i=0;i<len;i++) {
            if (string.equal(array[i],val)) {
              if (i==len-1) return array[0];
              else return array[i+1];
            }
          }
        else
          for(i=0;i<len;i++) {
            if (array[i]==val) {
              if (i==len-1) return array[0];
              else return array[i+1];
            }
          }
          
        return none;
    },
    /** Evaluate a function returning a boolean value for each member of the array and
     *  compute the boolean disjunction.
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     */
    or: function(array,fun) {
        var res=false;
        var i=0;
        var len=array.length;
        for(i=0;i<len;i++) {
            var element=array[i];
            res=res||fun(element,i)
        }
        return res;
    },
    
   /**
     * Gets the property value of `key` from all elements in `collection`.
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * pluck(users, 'user');
     * // => ['barney', 'fred']
     */
    pluck: function(collection, key) {
      return collection.map(function(object) {
          return object == null ? undefined : object[key];
        });
    },
    /*
     ** Push/pop head elements (Stack behaviour)
     */
    /** Remove and return top element of array.
     *
     * @param array
     * @returns {*}
     */
    pop : function(array) {
        var element=array[0];
        array.shift();
        return element;
    },
    print: function(array) {
        var i;
        var len=array.length;
        var str='[';
        for(i=0;i<len;i++) {
            var cell=array[i];
            str=str+cell;
        }
        return str+']';
    },
    /** Add new element at top of array.
     *
     * @param array
     * @param element
     */
    push : function(array,element) {
        array.unshift(element);
    },
    /** Create an ordered array of numbers {a,a+1,..b}
     *
     * @param a
     * @param b
     * @returns {Array}
     */
    range : function(a,b) {
        var i;
        var array=[];
        for(i=a;i<=b;i++) array.push(i);
        return array;
    },
    /** Remove elements from an array.
     *  [1,2,3,4,5,6] (begin=2,end=4) => [1,2,6]
     * @param {* []} array
     * @returns {* []}
     */
    remove: function(array,begin,end) {
      var i,a;
      if (end==undefined) end=begin+1;
      if (begin<0 || end >= array.length) return [];
      a=array.slice(0,begin);
      for(i=end;i<array.length;i++) a.push(array[i]);
      return a;
    },
    
    second : function(array) {
        return array[1];
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,*):number} fun   (1:a gt. b by the ordering criterion,-1: a lt. b, 0: a eq. b)
     * @returns {* []}
     */
    sort: function(array,fun) {
        var array2=array.slice();
        array2.sort(fun);
        return array2;
    },
    /** Split an array at position 'pos', i.e., remove 'len' (1) elements starting at 
     *  position 'pos'.
     *  ==> use remove!!! split should return two arrays!!
     *
     * @param array
     * @param pos
     * @param [len]
     * @param element
     */    
    split: function(array,pos,len) {
      if (pos==0) return array.slice((len||1));
      else {
        var a1=array.slice(0,pos);
        var a2=array.slice(pos+(len||1));
        return a1.concat(a2);
      }
    },
    /** Return the sum number of an array applying
     *  an optional mapping function.
     *
     * @param {* []} array
     * @param [fun]
     * @returns {number|undefined}
     */
    sum : function (array,fun) {        
        var res=0;
        for(var i in array) {
            var num=0;
            if (fun) num=fun(array[i]); else num=array[i];
            if (!obj.isNumber(num)) return undefined;
            res += num;
        }
        return res;
    },
    /** Return a new array w/o the head element (or optional 
     *  w/o the first top elements).
     *
     */
    tail : function(array,top) {
        var array2=array.slice();
        array2.shift();
        if (top) for(;top>1;top--) array2.shift();
        return array2;
    },
    /** Return union of two sets (== conjunction set)
     *
     * @param {* []} set1 
     * @param {* []} set2
     * @param {function} [fun]  Equality test
     * @returns {* []}
     */
    union : function(set1,set2,fun) {
        var i,j,res = [];
        for (i in set1) {
          for (j in set2) {
            if (fun != undefined && fun(set1[i],set2[j])) res.push(set1[i]);
            else if (fun == undefined && set1[i]==set2[j]) res.push(set1[i]);
          }
        }
        return res;
    },
    
    /**
     * Creates a duplicate-free version of an array
     */
    unique: function(array) {
      var length = array ? array.length : 0;
      function baseUniq(array) {
        var index = -1,
            length = array.length,
            seen,
            result = [];

        seen = result;
        outer:
        while (++index < length) {
          var value = array[index];
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === value) {
              continue outer;
            }
          }
          result.push(value);
        }
        return result;
      }
      if (!length) {
        return [];
      }
      return baseUniq(array);
    },
    
    /**
     * Creates an array excluding all provided values
     * without([1, 2, 1, 3], 1, 2);
     * // => [3]
     */
    without: function () {
      var array,
          values=[];
      for(var i in arguments) {
        if (i==0) array=arguments[0];
        else values.push(arguments[i]);
      }
      return array.filter(function (e) {
        return values.indexOf(e) == -1;
      });
    },
    /** Test for zero elements {0, '', false, undefined, ..}
    */
    zero: function (array) {
      for(var i in array) if (!!array[i]) return false;
      return true;
    },
};

/** STRING
 *
 */
var string = {
    /** Is pattern conatined in template?
     *
     */
    contains: function (template,pattern) {
      return template.indexOf(pattern)>-1;
    },
    copy: function(src) {
        var i;
        var dst='';
        for(i=0;i<src.length;i++) dst=dst+src.charAt(i);
        return dst;
    },
    /**
     *
     * @param {number} size
     * @returns {string} filled with spaces
     */
    create: function(size)
    {
        var i;
        var s='';
        var init=' ';
        for(i=0;i<size;i++) s=s+init;
        return s;
    },
    endsWith : function (str,tail) {
        return str.indexOf(tail)==(str.length-tail.length);
    },
    empty: function (str) {
      return this.equal(str,'');
    },
    equal:  function(str1,str2) {
        var i;
        var eq=true;
        if (str1.length != str2.length) return false;
        for(i=0;i<str1.length;i++) { if (string.get(str1,i)!=string.get(str2,i)) eq=false;}
        return eq;
    },
    find: function (search,str) {
        return str.indexOf(search);
    },
    format_hex: function (n,len) {
        // format a hexadecimal number with 'len' figures.
        switch (len) {
            case 2: return (((n>>4) & 0xf).toString(16))+
                            ((n&0xf).toString(16));
            case 4: return (((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            case 6: return (((n>>20) & 0xf).toString(16)+
                            ((n>>16) & 0xf).toString(16)+
                            ((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            case 8: return (((n>>28) & 0xf).toString(16)+
                            ((n>>24) & 0xf).toString(16)+
                            ((n>>20) & 0xf).toString(16)+
                            ((n>>16) & 0xf).toString(16)+
                            ((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            default: return 'format_hex??';
        }
    },
    /**
     *
     * @param {string} str
     * @param {number} index
     * @returns {string}
     */
    get: function (str,index) {
        assert((str != undefined && index < str.length && index >= 0)||('string.get ('+str.length+')'));
        return str.charAt(index);
    },
    isBoolean: function (str) {
        return (str=='true' || str=='false')
    },
    isNumeric: function (str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    },
    isText: function (s) {
      var is_text=true;
      string.iter(s,function (ch,i) {
        string.match(ch,[
          ['a','z',function () {}],
          ['A','Z',function () {}],
          ['0','9',function () {if (i==0) is_text=false;}],
          function () {is_text=false;}
        ]);
      });
      return is_text;
    },
    /**
     *
     * @param {string} str
     * @param {function(string,number)} fun
     */
    iter: function(str,fun) {
        var i;
        var len=str.length;
        for (i = 0; i < len; i++)  {
            var c = str.charAt(i);
            fun(c,i);
        }
    },
    /**
     *
     * @param str
     * @returns {*}
     */
    length: function(str) {
        if (str!=undefined) return str.length;
        else return 0;
    },
    /**
     *
     * @param str
     * @returns {string}
     */
    lowercase : function (str) {
        return str.toLowerCase();
    },
    /**
     *
     * @param {number} size
     * @param {string} init
     * @returns {string}
     */
    make: function(size,init)
    {
        var i;
        var s='';
        for(i=0;i<size;i++) s=s+init;
        return s;
    },
    /** Map a string with a set of (test,reuslt) transformation rules.
     * 
     * @param {string} str
     * @param {* [] []} case - ([string,string] | fun) []
     */
    map: function(str,mapping) {
        var i;
        var map;
        for(i in mapping) {
            map=mapping[i];
            if (obj.isFunction(map)) return map(str);
            else if (this.equal(str,map[0])) return map[1];
        }          
    },
    /** Match a string with different patterns and apply a matching function.
     *
     * @param {string} str
     * @param {* [] []} cases - ([string,fun] | [string [<case1>,<case2>,..],fun] | [<range1>:string,<range2>:string,fun] | fun) []
     */
    match: function(str,cases) {
        var i,j;
        var cas,cex,cv;
        for(i in cases) {
            cas=cases[i];
            if (obj.isArray(cas)) {
              switch (cas.length) {
                case 2:
                  // Multi-value-case
                  cex=cas[0];
                  if (!obj.isArray(cex)) {
                      if (this.equal(str,cex)) {
                          cas[1]();
                          return;
                      }
                  } else {
                      for(j in cex) {
                          cv=cex[j];
                          if (this.equal(str,cv)) {
                              cas[1]();
                              return;
                          }
                      }
                  }
                  break;
                case 3:
                  // Character range check
                  try {
                    j=pervasives.int_of_char(str);
                    if (j>= pervasives.int_of_char(cas[0]) && j<=pervasives.int_of_char(cas[1])) {
                      cas[2](str);
                      return;
                    }
                  } catch(e) {
                    return
                  };
                  break;
                case 1:
                  cas[0](str); // Default case - obsolete
                  return;
                default: 
                  throw 'String.match #args';
              }
            } else if (obj.isFunction(cas)) {
                // Default case
                cas(str);
                return;
            }
        }
    },
    /** Pad a string on the left (pre-str.length) if pre>0,
     *  right (post-str.length) if post>0, or centered (pre>0&post>0).
     *
     */
     
    pad: function (str,pre,post,char) {
      var len = str.length;
      if (pre>0 && post==0) return string.make(len-pre,char||' ')+str;
      else if (post>0 && pre==0) return str+string.make(post-len,char||' ');
      else return string.make(len-pre/2,char||' ')+str+string.make(len-post/2,char||' ');
    },
    /**
     *
     * @param str
     * @param pos
     * @param len
     * @returns {Number}
     */
    parse_hex: function (str,pos,len) {
        // parse a hexadecimal number in string 'str' starting at position 'pos' with 'len' figures.
        return parseInt(this.sub(str,pos,len),16);
    },
    /** Return the sub-string after a point in the source string ('.' or optional point string).
     * If there is no splitting point, the original string is returned.
     *
     * @param str
     * @param [point]
     * @returns {string}
     */
    postfix: function (str,point) {
      var n = str.indexOf(point||'.');
        if (n <= 0) return str;
        else return str.substr(n+1);
    },
    /** Return the sub-string before a point in the source string ('.' or optional point string)
     * If there is no splitting point, the original string is returned.
     *
     * @param str
     * @param [point]
     * @returns {string}
     */
    prefix: function (str,point) {
        var n = str.indexOf(point||'.');
        if (n <= 0) return str;
        else return str.substr(0,n);
    },
    replace_first: function (pat,repl,str) {
        return str.replace(pat,repl);
    },
    replace_all: function (pat,repl,str) {
        return str.replace('/'+pat+'/g',repl);
    },
    /**
     *
     * @param str
     * @param index
     * @param char
     * @returns {string}
     */
    set: function (str,index,char) {
        assert((str != undefined && index < str.length && index >= 0)||'string.get');
        return str.substr(0, index) + char + str.substr(index+1)
    },
    /**
     *
     * @param delim
     * @param str
     * @returns {*|Array}
     */
    split: function (delim,str) {
        return str.split(delim);
    },
    startsWith : function (str,head) {
        return !str.indexOf(head);
    },
    /** Return a sub-string.
     * 
     * @param str
     * @param off
     * @param [len] If not give, return a sub-string from off to end
     * @returns {string}
     */
    sub: function (str,off,len) {
        if (len)
            return str.substr(off,len);
        else
            return str.substr(off);
    },
    /** Remove leading and trailing characters from string
     *
     * @param str
     * @param {number} pref number of head characters to remove
     * @param {number} post number of tail characters to remove
     * @returns {*}
     */
    trim: function (str,pref,post) {
        if (str.length==0 ||
            pref>str.length ||
            post>str.length ||
            pref < 0 || post < 0 ||
            (pref==0 && post==0)
        ) return str;
        return str.substr(pref,str.length-pref-post);
    },
    /** Return a string with all characters converted to uppercase letters.
     *
     * @param str
     * @returns {string}
     */
    uppercase : function (str) {
        return str.toUpperCase();
    },
    /** Return a string with first character converted to uppercase letter.
     *
     * @param str
     * @returns {string}
     */
    Uppercase : function (str) {
        var len = str.length;
        if (len > 1) {
            var head = str.substr(0,1);
            var tail = str.substr(1,len-1);
            return head.toUpperCase()+tail.toLowerCase()
        } if (len==1) return str.toUpperCase();
        else return '';
    }
};

/** RANDOM
 *
 */
var rnd = Math.random;
/* Antti Syk�ri's algorithm adapted from Wikipedia MWC
** Returns a random generator function [0.0,1.0| with seed initialization
*/
var seeder = function(s) {
    var m_w  = s;
    var m_z  = 987654321;
    var mask = 0xffffffff;

    return function() {
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;

      var result = ((m_z << 16) + m_w) & mask;
      result /= 4294967296;

      return result + 0.5;
    }
}
 
var random = {
    float: function(max) {
        return rnd()*max
    }, 
    int: function(max) {
        return Math.floor(rnd()*max+0)
    },
    // integer
    interval: function(min,max) {
        return Math.round(min+rnd()*(max-min))
    },
    // float
    range: function(min,max) {
        return min+rnd()*(max-min)
    },
    seed: function (s) {
      // Create a new initialized random generator
      rnd=seeder(s);
    }
};

/** PRINTF
 *
 */
var printf = {
    /** Trim string(s).
     *
     * @param str
     * @param indent
     * @param [width]
     * @param {string} [tab]
     * @returns {string}
     */
    align: function (str,indent,width,tab) {
        var lines = string.split('\n',str);
        var form = '';
        var sp = printf.spaces(indent);
        var spbreak = sp;

        array.iter(lines,function(line){
            var rest;
            function breakit(spbreak,str) {
                if (width < (str.length + spbreak.length)) {
                    return spbreak+string.sub(str,0,width-spbreak.length)+'\n'+
                           breakit(spbreak,string.sub(str,width-spbreak.length,str.length-width+spbreak.length));
                } else return spbreak+str+'\n';
            }
            if (width && width < (line.length + indent)) {
                if (tab) {
                    var pos = string.find(tab,line);
                    if (pos > 0 && pos < width) spbreak=printf.spaces(pos+indent+1);
                    else spbreak=sp;
                }
                form=form+sp+string.sub(line,0,width-indent)+'\n';
                rest=string.sub(line,width-indent,line.length-width+indent);
                form=form+breakit(spbreak,rest);
            }
            else
                form=form+sp+line+'\n';
        });
        return form;
    },
    /** Format a list of array elements using the (optional) mapping
     *  function <fun> and the separator <sep> (optional, too, default is ',').
     * 
     */
    list: function (array,fun,sep) {
      var i, str='';
      if (sep==undefined) sep=',';
      if (fun==undefined) fun=function (s) {return s;};
      if (!obj.isArray(array)) array=[array];
      for (i in array) {
        if (str==='') str=fun(array[i]);
        else str=str+sep+fun(array[i]);
      }
      return str;
    },
    /**
     *
     * @param n
     * @returns {string}
     */
    spaces: function (n){
        return string.make(n,' ');
    },
    /** Formatted printer (simplified)
     *
     * @param {* []} args (['%format',arg]|string) []  format=%s,%d,%f,%c,%x,%#d,%#s,..
     * @returns {string}
     */
    sprintf2: function(args) {
        var str='';
        array.iter(args,function(fmtarg) {
            var len, n,fs;
            if (obj.isArray(fmtarg)) {
                if (fmtarg.length==2) {
                    var fmt=fmtarg[0];
                    var arg=fmtarg[1];
                    var fc='';
                    var fn=0;
                    string.iter(fmt,function(c) {
                        if (c=='s' || c=='d' || c=='f' || c=='x') {
                            fc=c;
                        } else if (c!='%') {
                            fn=fn*10;
                            n=parseInt(c);
                            if (!isNaN(n)) fn=fn+n;
                        }
                    });
                    if (fc=='s' && obj.isString(arg)) {
                        str=str+arg;
                        if (fn!=0) {
                            len=arg.length;
                            if (len<fn) str=str+string.create(fn-len);
                        }
                    } else if (fc=='d' && obj.isNumber(arg)) {
                        fs = pervasives.string_of_int(arg);
                        if (fn!=0) {
                            len = fs.length;
                            if (len < fn) {
                                str=str+string.create(fn-len);
                            }
                        }
                        str=str+fs;
                    } else if (fc=='x' && obj.isNumber(arg)) {
                        fs = string.format_hex(arg,fn||8);
                        str=str+fs;
                    }
                }
            } else if (obj.isString(fmtarg)) {
                str = str + fmtarg;
            }
        });
        return str;
    },
    sprintf:Sprintf.sprintf
};

/** FILENAME
 *
 */
var filename = {
    /**
     *
     * @param path
     * @returns {string}
     */
    basename : function (path) {
        return Path.basename(path);
    },
    /**
     *
     * @param path
     * @returns {string}
     */
    dirname : function (path) {
        return Path.dirname(path);
    },
    /**
     *
     * @param path
     * @returns {string}
     */
    extname : function (path) {
        return Path.extname(path)
    },
    /**
     *
     * @param path
     * @returns {boolean}
     */
    is_relative: function(path) {
        return !(path.length > 0 && path[0] == '/');
    },
    /**
     *
     * @param pathl
     * @param absolute
     * @returns {string}
     */
    join: function (pathl,absolute) {
        var path=(absolute?'/':'');
        array.iter(pathl,function (name,index) {
            if (index>0) {
                path=path+'/'+name;
            }
            else {
                path=path+name;
            }
        });
        return path;
    },
    /**
     *
     * @param path
     * @returns {string}
     */
    normalize : function (path) {
        return Path.normalize(path)
    },
    /**
     *
     * @param path
     * @returns {*}
     */
    path_absolute: function (path) {
        if (this.is_relative(path)) {
            var workdir = Io.workdir();
            return this.path_normalize(workdir + '/' + path);
        } else return this.path_normalize(path);
    },
    /** Duplicate of Path.normalize!?
     *
     * @param path
     * @returns {string}
     */
    path_normalize: function (path) {
        var i;
        if (string.equal(path, '')) path = '/';
        var relpath = !(string.get(path, 0) == '/');
        var pathlist = path.split('/');
        var pathlist2 = pathlist.filter(function (s) {
            return (!string.equal(s, '') && !string.equal(s, '.'))
        });
        var pathlist3 = [];
        array.iter(pathlist2, function (pe) {
            if (!string.equal(pe, '..')) {
                array.push(pathlist3, pe)
            } else {
                if (pathlist3.length == 0) return '';
                else
                    pathlist3 = array.tail(pathlist3);
            }
        });
        var path2 = '';
        i = 0;
        array.iter(pathlist3, function (pe) {
            var sep;
            if (i == 0) sep = ''; else sep = '/';
            path2 = pe + sep + path2;
            i++;
        });
        if (relpath) return path2; else return '/' + path2;
    },
    removeext: function (path) {
      return path.substr(0, path.lastIndexOf('.'));
    }
};

/** PERVASIVES
 *
 *
 */
var pervasives = {
    assert:assert,
    char_of_int: function (i) {return String.fromCharCode(i)},
    div: function(a,b) {return a/b|0;},
    failwith: function(msg) {Io.err(msg);},
    float_of_string: function(s) {var num=parseFloat(s); if (isNaN(num)) throw 'NaN'; else return num;},
    int_of_char: function(c) {return c.charCodeAt()},
    int_of_float: function(f) {return f|0;},
    int_of_string: function(s) {      
      var num=parseInt(s); if (isNaN(num)) throw 'NaN'; else return num;
    },

    /** Try to find a value in a search list and return a mapping value.
     *
     * @param {*} value
     * @param {* []} mapping [testval,mapval] []
     * @returns {*}
     */
    map: function(value,mapping) {
        function eq(v1,v2) {
            if (v1==v2) return true;
            if (obj.isString(v1) && obj.isString(v2)) return string.equal(v1,v2);
            return false;
        }
        if (!array.empty(mapping)) {
          var hd=array.head(mapping);
          var tl=array.tail(mapping);
          if (eq(hd[0],value)) return hd[1];
          else return pervasives.map(value,tl);
        }  else return undefined;
    },
    /** Apply a matcher function to a list of cases with case handler functions.
     * A case is matched if the matcher function returns a value/object.
     *
     * The result of the matcher function is passed as an argument ot the case handler function.
     * The return value of the case handler fucntion is finally returned by this match function
     * or undefined if there was no matching case.
     *
     * @param {function(*,*):*} matcher function(expr,pat)
     * @param {*} expr
     * @param {*[]} cases (pattern,handler function | handler function) []
     * @returns {*|undefined}
     */
    match: function (matcher,expr,cases) {
        var ret = undefined;
        array.iter_break(cases, function (match) {
            var quit, succ, pat, fun;

            if (match.length == 2) {
                /*
                 ** Pattern, Function
                 */
                pat = match[0];
                fun = match[1];
                succ = matcher(expr, pat);
                if (succ) ret = fun(succ);
                quit = succ!=undefined;
            } else if (match.length == 1) {
                /*
                 ** Default case, Function
                 */
                fun = match[0];
                ret = fun();
                quit= true;
            }
            return quit;
        });
        return ret;
    },
    mtime: function () {var time = new Date(); return time.getTime();},
    min: function(a,b) { return (a<b)?a:b},
    max: function(a,b) { return (a>b)?a:b},
    string_of_float: function(f) {return f.toString()},
    string_of_int: function(i) {return i.toString()},
    string_of_int64: function(i) {return i.toString()},
    time: function () {var time = new Date(); return (time.getTime()/1000)|0;}
};

/** BIT
 *
 */
var bit = {
    get: function (v,b) {return (v >> b) && 1;},
    isSet: function (v,b) {return ((v >> b) && 1)==1;},
    set: function (v,b) {return v & (1 << b);}
};

/** ARGS
 *
 */
var args = {
    /** Parse process or command line arguments (array argv). The first offset [1] arguments are
     ** ignored. The numarg pattern '*' consumes all remaining arguments.
     *
     * @param {string []} argv
     * @param {*[]} map  [<argname>,<numargs:0..3|'*'>,<handler(up to 3 arguments|[])>]|[<defhandler(val)>] []
     * @param {number} [offset]
     */
    parse: function(argv,map,offset) {
        var shift=undefined,
            in_shift=0,
            shift_args=[],
            names,
            mapfun,
            numarg,
            len=argv.length;

        if (offset==undefined) offset=1;

        argv.forEach(function (val, index) {
            var last=index==(len-1);
            if(index>=offset) {
                if (in_shift==0) {
                    array.check(map,function (onemap) {
                        assert(onemap!=undefined||'map');
                        if (onemap.length==3) {
                            names  = onemap[0];
                            numarg = onemap[1];
                            mapfun = onemap[2];
                            if (!obj.isArray(names)) names=[names];
                            var found = array.find(names,function (name) {
                                if (string.equal(val, name)) return name; else _;
                            });
                            if (found) {
                                if (numarg==0) mapfun(found);
                                else {
                                    in_shift=numarg;
                                    shift_args=[];
                                    shift=mapfun;
                                }
                                return true;
                            }
                        } else if (obj.isFunction(onemap)) {
                          onemap(val);
                          return true;                        
                        } else if (onemap.length==1) {
                            mapfun = onemap[0];
                            mapfun(val);
                            return true;
                        }
                        return false;
                    });
                } else {
                    shift_args.push(val);
                    if (in_shift!='*') in_shift--;
                    if (in_shift==0 && shift!=undefined) {
                        numarg=shift_args.length;
                        switch (numarg) {
                            case 0: shift(val);break;
                            case 1: shift(shift_args[0],val); break;
                            case 2: shift(shift_args[0],shift_args[1],val); break;
                            case 3: shift(shift_args[0],shift_args[1],shift_args[2],val); break;
                            default: break;
                        }
                        shift=undefined;
                    } else if (in_shift=='*' && last) shift(shift_args);
                }
            }
        });
    }

};

/** HASHTBL
 *
 */
var hashtbl = {
    add: function(hash,key,data) {
        hash[key]=data;
    },
    create: function(initial) {
        return [];
    },
    empty: function(hash) {
        for (var key in hash) return false;
        return true;
    },
    find: function(hash,key) {
        return hash[key];
    },
    invalidate: function(hash,key) {
        hash[key]=undefined;
    },
    iter: function(hash,fun) {
        for (var key in hash) {
            if (hash[key]!=undefined) fun(key,hash[key]);
        }
    },
    mem: function(hash,key) {
        return hash[key] != undefined;
    },
    remove: function(hash,key) {
        // TODO: check, its wrong!
        if (!hash.hasOwnProperty(key))
            return;
        if (isNaN(parseInt(key)) || !(hash instanceof Array))
            delete hash[key];
        else
            hash.splice(key, 1)
    }
};

var types = [];
/**
 * 
 * @param name
 * @returns {number}
 */
function register_type(name) {
    var typoff = 1000+types.length*1000;
    if (array.member(types,name)) throw('[COMP] register_type: type '+name+' exists already.');
    types.push(name);
    return typoff;
}

/**
 *
 * @typedef {{v1:*, v2:*, v3:*, v4:*, v5:*, v6:*, v7:*, v8:*, v9:*  }} tuple
 */
/**
 *
 * @typedef {{t:number, v1:*, v2:*, v3:*, v4:*, v5:*, v6:*, v7:*, v8:*, v9:*  }} tagged_tuple
 */

module.exports = {
    args:args,
    assert: assert,
    array:array,
    bit:bit,
    div:pervasives.div,
    filename:filename,
    hashtbl:hashtbl,
    isNodeJS: function () {
        return (typeof global !== "undefined" &&
                {}.toString.call(global) == '[object global]');
    },
    obj:obj,
    pervasives:pervasives,
    printf:printf,
    random:random,
    string:string,
    isArray: obj.isArray,
    isString: obj.isString,
    isNumber: obj.isNumber,

    register_type:register_type,
    /**
     *
     * @param tag
     * @param [val1]
     * @param [val2]
     * @param [val3]
     * @returns {(tagged_tuple)}
     */
    Tuple: function (tag,val1,val2,val3) {
        if(val3) return {t:tag,v1:val1,v2:val2,v3:val3};
        else if (val2) return {t:tag,v1:val1,v2:val2};
        else if (val1) return {t:tag,v1:val1};
        else return {t:tag};
    }
};
};
BundleModuleCode['term/blessed']=function (module,exports,global,process){
/**
 * blessed - a high-level terminal interface library for node.js
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Blessed
 */

function blessed() {
  return blessed.program.apply(null, arguments);
}

blessed.program = blessed.Program = Require('term/program');
blessed.tput = blessed.Tput = Require('term/tput');
blessed.widget = Require('term/widget');
blessed.colors = Require('term/colors');
blessed.unicode = Require('term/unicode');
blessed.helpers = Require('term/helpers');

blessed.helpers.sprintf = blessed.tput.sprintf;
blessed.helpers.tryRead = blessed.tput.tryRead;
blessed.helpers.merge(blessed, blessed.helpers);

blessed.helpers.merge(blessed, blessed.widget);

/**
 * Expose
 */

module.exports = blessed;
};
BundleModuleCode['term/program']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2016, Christopher Jeffrey and contributors
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.9.1
 **
 **    $INFO:
 *
 * program.js - basic curses-like functionality for blessed.
 *
 **    $ENDOFINFO
 */
var options = {
  version:'1.9.1'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var EventEmitter = Require('events').EventEmitter
  , StringDecoder = Require('string_decoder').StringDecoder
  , cp = Require('child_process')
  , util = Require('util')
  , fs = Require('fs');

var Tput = Require('term/tput')
  , colors = Require('term/colors')
  , slice = Array.prototype.slice;

var nextTick = global.setImmediate || process.nextTick.bind(process);

/**
 * Program
 */

function Program(options) {
  var self = this;

  if (!instanceOf(this,Program)) {
    return new Program(options);
  }

  Program.bind(this);

  EventEmitter.call(this);

  //if (!options || options.__proto__ !== Object.prototype) {
  if (!options) {
    options = {
      input: arguments[0],
      output: arguments[1]
    };
  }

  this.options = options;
  this.input = options.input || process.stdin;
  this.output = options.output || process.stdout;

  options.log = options.log || options.dump;
  if (options.log) {
    this._logger = fs.createWriteStream(options.log);
    if (options.dump) this.setupDump();
  }

  this.zero = options.zero !== false;
  this.useBuffer = options.buffer;

  this.x = 0;
  this.y = 0;
  this.savedX = 0;
  this.savedY = 0;

  this.cols = this.output.columns || 80;
  this.rows = this.output.rows || 20;

  console.log('Terminal: '+this.cols + ' x ' + this.rows);
  this.scrollTop = 0;
  this.scrollBottom = this.rows - 1;

  this._terminal = options.terminal
    || options.term
    || process.env.TERM
    || (process.platform === 'win32' ? 'windows-ansi' : 'xterm');

  this._terminal = this._terminal.toLowerCase();

  // OSX
  this.isOSXTerm = process.env.TERM_PROGRAM === 'Apple_Terminal';
  this.isiTerm2 = process.env.TERM_PROGRAM === 'iTerm.app'
    || !!process.env.ITERM_SESSION_ID;

  // VTE
  // NOTE: lxterminal does not provide an env variable to check for.
  // NOTE: gnome-terminal and sakura use a later version of VTE
  // which provides VTE_VERSION as well as supports SGR events.
  this.isXFCE = /xfce/i.test(process.env.COLORTERM);
  this.isTerminator = !!process.env.TERMINATOR_UUID;
  this.isLXDE = false;
  this.isVTE = !!process.env.VTE_VERSION
    || this.isXFCE
    || this.isTerminator
    || this.isLXDE;

  // xterm and rxvt - not accurate
  this.isRxvt = /rxvt/i.test(process.env.COLORTERM);
  this.isXterm = false;

  this.tmux = !!process.env.TMUX;
  this.tmuxVersion = (function() {
    if (!self.tmux) return 2;
    try {
      var version = cp.execFileSync('tmux', ['-V'], { encoding: 'utf8' });
      return +/^tmux ([\d.]+)/i.exec(version.trim().split('\n')[0])[1];
    } catch (e) {
      return 2;
    }
  })();

  this._buf = '';
  this._flush = this.flush.bind(this);

  if (options.tput !== false) {
    this.setupTput();
  }
  // console.log(Require('com/io').write_file('/tmp/LOG',Require('os/inspect')(this)));
  this.listen();
  
  if (process.platform == 'win32') {
    process.winmouse.init(function (x,y,button,action) {
      var key = {
        name: 'mouse',
        ctrl: false,
        meta: false,
        shift: false,
        action: action,
        x:x,
        y:y
      };
      self.emit('mouse',key);
    });
  }
}

Program.global = null;

Program.total = 0;

Program.instances = [];

Program.bind = function(program) {
  if (!Program.global) {
    Program.global = program;
  }

  if (!~Program.instances.indexOf(program)) {
    Program.instances.push(program);
    program.index = Program.total;
    Program.total++;
  }

  if (Program._bound) return;
  Program._bound = true;

  unshiftEvent(process, 'exit', Program._exitHandler = function() {
    Program.instances.forEach(function(program) {
      // Potentially reset window title on exit:
      if (program._originalTitle) {
         program.setTitle(program._originalTitle);
      }
      // Ensure the buffer is flushed (it should
      // always be at this point, but who knows).
      program.flush();
      // Ensure _exiting is set (could technically
      // use process._exiting).
      program._exiting = true;
    });
  });
};

//Program.prototype.__proto__ = EventEmitter.prototype;
inheritPrototype(Program,EventEmitter);

Program.prototype.type = 'program';

Program.prototype.log = function() {
  return this._log('LOG',  util.format.apply(util, arguments));
};

Program.prototype.debug = function() {
  if (!this.options.debug) return;
  return this._log('DEBUG',  util.format.apply(util, arguments));
};

Program.prototype._log = function(pre, msg) {
  if (!this._logger) return;
  return this._logger.write(pre + ': ' + msg + '\n-\n');
};

Program.prototype.setupDump = function() {
  var self = this
    , write = this.output.write
    , decoder = new StringDecoder('utf8');

  function stringify(data) {
    return caret(data
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t'))
      .replace(/[^ -~]/g, function(ch) {
        if (ch.charCodeAt(0) > 0xff) return ch;
        ch = ch.charCodeAt(0).toString(16);
        if (ch.length > 2) {
          if (ch.length < 4) ch = '0' + ch;
          return '\\u' + ch;
        }
        if (ch.length < 2) ch = '0' + ch;
        return '\\x' + ch;
      });
  }

  function caret(data) {
    return data.replace(/[\0\x80\x1b-\x1f\x7f\x01-\x1a]/g, function(ch) {
      switch (ch) {
        case '\0':
        case '\200':
          ch = '@';
          break;
        case '\x1b':
          ch = '[';
          break;
        case '\x1c':
          ch = '\\';
          break;
        case '\x1d':
          ch = ']';
          break;
        case '\x1e':
          ch = '^';
          break;
        case '\x1f':
          ch = '_';
          break;
        case '\x7f':
          ch = '?';
          break;
        default:
          ch = ch.charCodeAt(0);
          // From ('A' - 64) to ('Z' - 64).
          if (ch >= 1 && ch <= 26) {
            ch = String.fromCharCode(ch + 64);
          } else {
            return String.fromCharCode(ch);
          }
          break;
      }
      return '^' + ch;
    });
  }

  this.input.on('data', function(data) {
    self._log('IN', stringify(decoder.write(data)));
  });

  this.output.write = function(data) {
    self._log('OUT', stringify(data));
    return write.apply(this, arguments);
  };
};

Program.prototype.setupTput = function() {
  if (this._tputSetup) return;
  this._tputSetup = true;

  var self = this
    , options = this.options
    , write = this._write.bind(this);

  var tput = this.tput = new Tput({
    terminal: this.terminal,
    padding: options.padding,
    extended: options.extended,
    printf: options.printf,
    termcap: options.termcap,
    forceUnicode: options.forceUnicode
  });

  if (tput.error) {
    nextTick(function() {
      self.emit('warning', tput.error.message);
    });
  }

  if (tput.padding) {
    nextTick(function() {
      self.emit('warning', 'Terminfo padding has been enabled.');
    });
  }

  this.put = function() {
    var args = slice.call(arguments)
      , cap = args.shift();

    if (tput[cap]) {
      return this._write(tput[cap].apply(tput, args));
    }
  };

  Object.keys(tput).forEach(function(key) {
    if (self[key] == null) {
      self[key] = tput[key];
    }

    if (typeof tput[key] !== 'function') {
      self.put[key] = tput[key];
      return;
    }

    if (tput.padding) {
      self.put[key] = function() {
        return tput._print(tput[key].apply(tput, arguments), write);
      };
    } else {
      self.put[key] = function() {
        return self._write(tput[key].apply(tput, arguments));
      };
    }
  });
};

/* Depricated: 
Program.prototype.__defineGetter__('terminal', function() {
  return this._terminal;
});

Program.prototype.__defineSetter__('terminal', function(terminal) {
  this.setTerminal(terminal);
  return this.terminal;
});
*/

Object.defineProperty(Program.prototype,'terminal', {
  get: function () {return this._terminal;},
  set: function (terminal) {
    this.setTerminal(terminal);
    return this.terminal;  
  }
});

Program.prototype.setTerminal = function(terminal) {
  this._terminal = terminal.toLowerCase();
  delete this._tputSetup;
  this.setupTput();
};

Program.prototype.has = function(name) {
  return this.tput
    ? this.tput.has(name)
    : false;
};

Program.prototype.term = function(is) {
  return this.terminal.indexOf(is) === 0;
};

Program.prototype.listen = function() {
  var self = this;

  // Potentially reset window title on exit:
  // if (!this.isRxvt) {
  //   if (!this.isVTE) this.setTitleModeFeature(3);
  //   this.manipulateWindow(21, function(err, data) {
  //     if (err) return;
  //     self._originalTitle = data.text;
  //   });
  // }

  // Listen for keys/mouse on input
  if (!this.input._blessedInput) {
    this.input._blessedInput = 1;
    this._listenInput();
  } else {
    this.input._blessedInput++;
  }

  this.on('newListener', this._newHandler = function fn(type) {
    if (type === 'keypress' || type === 'mouse') {
      self.removeListener('newListener', fn);
      if (self.input.setRawMode && !self.input.isRaw) {
        self.input.setRawMode(true);
        self.input.resume();
      }
    }
  });

  this.on('newListener', function fn(type) {
    if (type === 'mouse') {
      self.removeListener('newListener', fn);
      self.bindMouse();
    }
  });

  // Listen for resize on output
  if (!this.output._blessedOutput) {
    this.output._blessedOutput = 1;
    this._listenOutput();
  } else {
    this.output._blessedOutput++;
  }
};

Program.prototype._listenInput = function() {
  var keys = Require('term/keys')
    , self = this;

  // Input
  this.input.on('keypress', this.input._keypressHandler = function(ch, key) {
    key = key || { ch: ch };

    if (key.name === 'undefined'
        && (key.code === '[M' || key.code === '[I' || key.code === '[O')) {
      // A mouse sequence. The `keys` module doesn't understand these.
      return;
    }

    if (key.name === 'undefined') {
      // Not sure what this is, but we should probably ignore it.
      return;
    }

    if (key.name === 'enter' && key.sequence === '\n') {
      key.name = 'linefeed';
    }

    if (key.name === 'return' && key.sequence === '\r') {
      self.input.emit('keypress', ch, merge({}, key, { name: 'enter' }));
    }

    var name = (key.ctrl ? 'C-' : '')
      + (key.meta ? 'M-' : '')
      + (key.shift && key.name ? 'S-' : '')
      + (key.name || ch);

    key.full = name;

    Program.instances.forEach(function(program) {
      if (program.input !== self.input) return;
      program.emit('keypress', ch, key);
      program.emit('key ' + name, ch, key);
    });
  });

  this.input.on('data', this.input._dataHandler = function(data) {
    Program.instances.forEach(function(program) {
      if (program.input !== self.input) return;
      program.emit('data', data);
    });
  });

  keys.emitKeypressEvents(this.input);
};

Program.prototype._listenOutput = function() {
  var self = this;

  if (!this.output.isTTY) {
    nextTick(function() {
      self.emit('warning', 'Output is not a TTY');
    });
  }

  // Output
  function resize() {
    Program.instances.forEach(function(program) {
      if (program.output !== self.output) return;
      program.cols = program.output.columns;
      program.rows = program.output.rows;
      program.emit('resize');
    });
  }

  this.output.on('resize', this.output._resizeHandler = function() {
    Program.instances.forEach(function(program) {
      if (program.output !== self.output) return;
      if (!program.options.resizeTimeout) {
        return resize();
      }
      if (program._resizeTimer) {
        clearTimeout(program._resizeTimer);
        delete program._resizeTimer;
      }
      var time = typeof program.options.resizeTimeout === 'number'
        ? program.options.resizeTimeout
        : 300;
      program._resizeTimer = setTimeout(resize, time);
    });
  });
};

Program.prototype.destroy = function() {
  var index = Program.instances.indexOf(this);

  if (~index) {
    Program.instances.splice(index, 1);
    Program.total--;

    this.flush();
    this._exiting = true;

    Program.global = Program.instances[0];

    if (Program.total === 0) {
      Program.global = null;

      process.removeListener('exit', Program._exitHandler);
      delete Program._exitHandler;

      delete Program._bound;
    }

    this.input._blessedInput--;
    this.output._blessedOutput--;

    if (this.input._blessedInput === 0) {
      this.input.removeListener('keypress', this.input._keypressHandler);
      this.input.removeListener('data', this.input._dataHandler);
      delete this.input._keypressHandler;
      delete this.input._dataHandler;

      if (this.input.setRawMode) {
        if (this.input.isRaw) {
          this.input.setRawMode(false);
        }
        if (!this.input.destroyed) {
          this.input.pause();
        }
      }
    }

    if (this.output._blessedOutput === 0) {
      this.output.removeListener('resize', this.output._resizeHandler);
      delete this.output._resizeHandler;
    }

    this.removeListener('newListener', this._newHandler);
    delete this._newHandler;

    this.destroyed = true;
    this.emit('destroy');
  }
};

Program.prototype.key = function(key, listener) {
  if (typeof key === 'string') key = key.split(/\s*,\s*/);
  key.forEach(function(key) {
    return this.on('key ' + key, listener);
  }, this);
};

Program.prototype.onceKey = function(key, listener) {
  if (typeof key === 'string') key = key.split(/\s*,\s*/);
  key.forEach(function(key) {
    return this.once('key ' + key, listener);
  }, this);
};

Program.prototype.unkey =
Program.prototype.removeKey = function(key, listener) {
  if (typeof key === 'string') key = key.split(/\s*,\s*/);
  key.forEach(function(key) {
    return this.removeListener('key ' + key, listener);
  }, this);
};

// XTerm mouse events
// http://invisible-island.net/xterm/ctlseqs/ctlseqs.html#Mouse%20Tracking
// To better understand these
// the xterm code is very helpful:
// Relevant files:
//   button.c, charproc.c, misc.c
// Relevant functions in xterm/button.c:
//   BtnCode, EmitButtonCode, EditorButton, SendMousePosition
// send a mouse event:
// regular/utf8: ^[[M Cb Cx Cy
// urxvt: ^[[ Cb ; Cx ; Cy M
// sgr: ^[[ Cb ; Cx ; Cy M/m
// vt300: ^[[ 24(1/3/5)~ [ Cx , Cy ] \r
// locator: CSI P e ; P b ; P r ; P c ; P p & w
// motion example of a left click:
// ^[[M 3<^[[M@4<^[[M@5<^[[M@6<^[[M@7<^[[M#7<
// mouseup, mousedown, mousewheel
// left click: ^[[M 3<^[[M#3<
// mousewheel up: ^[[M`3>
Program.prototype.bindMouse = function() {
  if (this._boundMouse) return;
  this._boundMouse = true;

  var decoder = new StringDecoder('utf8')
    , self = this;

  this.on('data', function(data) {
    var text,seq=[data],_data,i,n=0,m=0;
    if (data.length && data.indexOf(0x1b,1) > 0) {
      // Split data
      seq=[];
      while(n<data.length)  {
        m=data.indexOf(0x1b,m+1);
        if (m==-1) m=data.length;
        // console.log(n,m);
        seq.push(data.slice(n,m));
        n=m;        
      }
    }
    for(i in seq) {
      _data=seq[i];
      text = decoder.write(_data);
      if (!text) continue;
      // console.log(_data); 
      self._bindMouse(text, _data);
    }
  });
};

Program.prototype._bindMouse = function(s, buf) {
  var self = this
    , key
    , parts
    , b
    , x
    , y
    , mod
    , params
    , down
    , page
    , button;

  key = {
    name: undefined,
    ctrl: false,
    meta: false,
    shift: false
  };

  if (Buffer.isBuffer(s)) {
    if (s[0] > 127 && s[1] === undefined) {
      s[0] -= 128;
      s = '\x1b' + s.toString('utf-8');
    } else {
      s = s.toString('utf-8');
    }
  }
  
  // if (this.8bit) {
  //   s = s.replace(/\233/g, '\x1b[');
  //   buf = new Buffer(s, 'utf8');
  // }

  // XTerm / X10 for buggy VTE
  // VTE can only send unsigned chars and no unicode for coords. This limits
  // them to 0xff. However, normally the x10 protocol does not allow a byte
  // under 0x20, but since VTE can have the bytes overflow, we can consider
  // bytes below 0x20 to be up to 0xff + 0x20. This gives a limit of 287. Since
  // characters ranging from 223 to 248 confuse javascript's utf parser, we
  // need to parse the raw binary. We can detect whether the terminal is using
  // a bugged VTE version by examining the coordinates and seeing whether they
  // are a value they would never otherwise be with a properly implemented x10
  // protocol. This method of detecting VTE is only 99% reliable because we
  // can't check if the coords are 0x00 (255) since that is a valid x10 coord
  // technically.
  var bx = s.charCodeAt(4);
  var by = s.charCodeAt(5);
  
  if (buf[0] === 0x1b && buf[1] === 0x5b && buf[2] === 0x4d
      && (this.isVTE
      || bx >= 65533 || by >= 65533
      || (bx > 0x00 && bx < 0x20)
      || (by > 0x00 && by < 0x20)
      || (buf[4] > 223 && buf[4] < 248 && buf.length === 6)
      || (buf[5] > 223 && buf[5] < 248 && buf.length === 6))) {
    b = buf[3];
    x = buf[4];
    y = buf[5];

    // unsigned char overflow.
    if (x < 0x20) x += 0xff;
    if (y < 0x20) y += 0xff;

    // Convert the coordinates into a
    // properly formatted x10 utf8 sequence.
    s = '\x1b[M'
      + String.fromCharCode(b)
      + String.fromCharCode(x)
      + String.fromCharCode(y);
  }
  // XTerm / X10
  if (parts = /^\x1b\[M([\x00\u0020-\ufffe]{3})/.exec(s)) {
    b = parts[1].charCodeAt(0);
    x = parts[1].charCodeAt(1);
    y = parts[1].charCodeAt(2);

    key.name = 'mouse';
    key.type = 'X10';

    key.raw = [b, x, y, parts[0]];
    key.buf = buf;
    key.x = x - 32;
    key.y = y - 32;

    if (this.zero) key.x--, key.y--;

    if (x === 0) key.x = 255;
    if (y === 0) key.y = 255;

    mod = b >> 2;
    key.shift = !!(mod & 1);
    key.meta = !!((mod >> 1) & 1);
    key.ctrl = !!((mod >> 2) & 1);

    b -= 32;

    if ((b >> 6) & 1) {
      key.action = b & 1 ? 'wheeldown' : 'wheelup';
      key.button = 'middle';
    } else if (b === 3 && this._lastButton) {
      // NOTE: x10 and urxvt have no way
      // of telling which button mouseup used.
      // Emit mouseup only if there was a mousedown
      key.action = 'mouseup';
      key.button = this._lastButton;
      delete this._lastButton;
    } else if ((b&3) < 3) {
      // Emit mousedown only with valid button
      key.action = 'mousedown';
      button = b & 3;
      key.button =
        button === 0 ? 'left'
        : button === 1 ? 'middle'
        : button === 2 ? 'right'
        : 'unknown';
      this._lastButton = key.button;
    }
//console.log(b,key)
    // Probably a movement.
    // The *newer* VTE gets mouse movements comepletely wrong.
    // This presents a problem: older versions of VTE that get it right might
    // be confused by the second conditional in the if statement.
    // NOTE: Possibly just switch back to the if statement below.
    // none, shift, ctrl, alt
    // gnome: 32, 36, 48, 40
    // xterm: 35, _, 51, _
    // urxvt: 35, _, _, _
    // if (key.action === 'mousedown' && key.button === 'unknown') {
    if (b === 35 || b === 39 || b === 51 || b === 43
        || (this.isVTE && (b === 32 || b === 36 || b === 48 || b === 40))) {
      delete key.button;
      key.action = 'mousemove';
    }
    self.emit('mouse', key);
    return;
  }

  // URxvt
  if (parts = /^\x1b\[(\d+;\d+;\d+)M/.exec(s)) {
    params = parts[1].split(';');
    b = +params[0];
    x = +params[1];
    y = +params[2];

    key.name = 'mouse';
    key.type = 'urxvt';

    key.raw = [b, x, y, parts[0]];
    key.buf = buf;
    key.x = x;
    key.y = y;

    if (this.zero) key.x--, key.y--;

    mod = b >> 2;
    key.shift = !!(mod & 1);
    key.meta = !!((mod >> 1) & 1);
    key.ctrl = !!((mod >> 2) & 1);

    // XXX Bug in urxvt after wheelup/down on mousemove
    // NOTE: This may be different than 128/129 depending
    // on mod keys.
    if (b === 128 || b === 129) {
      b = 67;
    }

    b -= 32;

    if ((b >> 6) & 1) {
      key.action = b & 1 ? 'wheeldown' : 'wheelup';
      key.button = 'middle';
    } else if (b === 3) {
      // NOTE: x10 and urxvt have no way
      // of telling which button mouseup used.
      key.action = 'mouseup';
      key.button = this._lastButton || 'unknown';
      delete this._lastButton;
    } else {
      key.action = 'mousedown';
      button = b & 3;
      key.button =
        button === 0 ? 'left'
        : button === 1 ? 'middle'
        : button === 2 ? 'right'
        : 'unknown';
      // NOTE: 0/32 = mousemove, 32/64 = mousemove with left down
      // if ((b >> 1) === 32)
      this._lastButton = key.button;
    }

    // Probably a movement.
    // The *newer* VTE gets mouse movements comepletely wrong.
    // This presents a problem: older versions of VTE that get it right might
    // be confused by the second conditional in the if statement.
    // NOTE: Possibly just switch back to the if statement below.
    // none, shift, ctrl, alt
    // urxvt: 35, _, _, _
    // gnome: 32, 36, 48, 40
    // if (key.action === 'mousedown' && key.button === 'unknown') {
    if (b === 35 || b === 39 || b === 51 || b === 43
        || (this.isVTE && (b === 32 || b === 36 || b === 48 || b === 40))) {
      delete key.button;
      key.action = 'mousemove';
    }

    self.emit('mouse', key);

    return;
  }

  // SGR
  if (parts = /^\x1b\[<(\d+;\d+;\d+)([mM])/.exec(s)) {
    down = parts[2] === 'M';
    params = parts[1].split(';');
    b = +params[0];
    x = +params[1];
    y = +params[2];

    key.name = 'mouse';
    key.type = 'sgr';

    key.raw = [b, x, y, parts[0]];
    key.buf = buf;
    key.x = x;
    key.y = y;

    if (this.zero) key.x--, key.y--;

    mod = b >> 2;
    key.shift = !!(mod & 1);
    key.meta = !!((mod >> 1) & 1);
    key.ctrl = !!((mod >> 2) & 1);

    if ((b >> 6) & 1) {
      key.action = b & 1 ? 'wheeldown' : 'wheelup';
      key.button = 'middle';
    } else {
      key.action = down
        ? 'mousedown'
        : 'mouseup';
      button = b & 3;
      key.button =
        button === 0 ? 'left'
        : button === 1 ? 'middle'
        : button === 2 ? 'right'
        : 'unknown';
    }

    // Probably a movement.
    // The *newer* VTE gets mouse movements comepletely wrong.
    // This presents a problem: older versions of VTE that get it right might
    // be confused by the second conditional in the if statement.
    // NOTE: Possibly just switch back to the if statement below.
    // none, shift, ctrl, alt
    // xterm: 35, _, 51, _
    // gnome: 32, 36, 48, 40
    // if (key.action === 'mousedown' && key.button === 'unknown') {
    if (b === 35 || b === 39 || b === 51 || b === 43
        || (this.isVTE && (b === 32 || b === 36 || b === 48 || b === 40))) {
      delete key.button;
      key.action = 'mousemove';
    }

    self.emit('mouse', key);

    return;
  }

  // DEC
  // The xterm mouse documentation says there is a
  // `<` prefix, the DECRQLP says there is no prefix.
  if (parts = /^\x1b\[<(\d+;\d+;\d+;\d+)&w/.exec(s)) {
    params = parts[1].split(';');
    b = +params[0];
    x = +params[1];
    y = +params[2];
    page = +params[3];

    key.name = 'mouse';
    key.type = 'dec';

    key.raw = [b, x, y, parts[0]];
    key.buf = buf;
    key.x = x;
    key.y = y;
    key.page = page;

    if (this.zero) key.x--, key.y--;

    key.action = b === 3
      ? 'mouseup'
      : 'mousedown';

    key.button =
      b === 2 ? 'left'
      : b === 4 ? 'middle'
      : b === 6 ? 'right'
      : 'unknown';

    self.emit('mouse', key);

    return;
  }

  // vt300
  if (parts = /^\x1b\[24([0135])~\[(\d+),(\d+)\]\r/.exec(s)) {
    b = +parts[1];
    x = +parts[2];
    y = +parts[3];

    key.name = 'mouse';
    key.type = 'vt300';

    key.raw = [b, x, y, parts[0]];
    key.buf = buf;
    key.x = x;
    key.y = y;

    if (this.zero) key.x--, key.y--;

    key.action = 'mousedown';
    key.button =
      b === 1 ? 'left'
      : b === 2 ? 'middle'
      : b === 5 ? 'right'
      : 'unknown';

    self.emit('mouse', key);

    return;
  }

  if (parts = /^\x1b\[(O|I)/.exec(s)) {
    key.action = parts[1] === 'I'
      ? 'focus'
      : 'blur';

    self.emit('mouse', key);
    self.emit(key.action);

    return;
  }
};

// gpm support for linux vc
Program.prototype.enableGpm = function() {
  var self = this;
  var gpmclient = Require('term/gpmclient');

  if (this.gpm) return;

  this.gpm = gpmclient();

  this.gpm.on('btndown', function(btn, modifier, x, y) {
    x--, y--;

    var key = {
      name: 'mouse',
      type: 'GPM',
      action: 'mousedown',
      button: self.gpm.ButtonName(btn),
      raw: [btn, modifier, x, y],
      x: x,
      y: y,
      shift: self.gpm.hasShiftKey(modifier),
      meta: self.gpm.hasMetaKey(modifier),
      ctrl: self.gpm.hasCtrlKey(modifier)
    };

    self.emit('mouse', key);
  });

  this.gpm.on('btnup', function(btn, modifier, x, y) {
    x--, y--;

    var key = {
      name: 'mouse',
      type: 'GPM',
      action: 'mouseup',
      button: self.gpm.ButtonName(btn),
      raw: [btn, modifier, x, y],
      x: x,
      y: y,
      shift: self.gpm.hasShiftKey(modifier),
      meta: self.gpm.hasMetaKey(modifier),
      ctrl: self.gpm.hasCtrlKey(modifier)
    };

    self.emit('mouse', key);
  });

  this.gpm.on('move', function(btn, modifier, x, y) {
    x--, y--;

    var key = {
      name: 'mouse',
      type: 'GPM',
      action: 'mousemove',
      button: self.gpm.ButtonName(btn),
      raw: [btn, modifier, x, y],
      x: x,
      y: y,
      shift: self.gpm.hasShiftKey(modifier),
      meta: self.gpm.hasMetaKey(modifier),
      ctrl: self.gpm.hasCtrlKey(modifier)
    };

    self.emit('mouse', key);
  });

  this.gpm.on('drag', function(btn, modifier, x, y) {
    x--, y--;

    var key = {
      name: 'mouse',
      type: 'GPM',
      action: 'mousemove',
      button: self.gpm.ButtonName(btn),
      raw: [btn, modifier, x, y],
      x: x,
      y: y,
      shift: self.gpm.hasShiftKey(modifier),
      meta: self.gpm.hasMetaKey(modifier),
      ctrl: self.gpm.hasCtrlKey(modifier)
    };

    self.emit('mouse', key);
  });

  this.gpm.on('mousewheel', function(btn, modifier, x, y, dx, dy) {
    var key = {
      name: 'mouse',
      type: 'GPM',
      action: dy > 0 ? 'wheelup' : 'wheeldown',
      button: self.gpm.ButtonName(btn),
      raw: [btn, modifier, x, y, dx, dy],
      x: x,
      y: y,
      shift: self.gpm.hasShiftKey(modifier),
      meta: self.gpm.hasMetaKey(modifier),
      ctrl: self.gpm.hasCtrlKey(modifier)
    };

    self.emit('mouse', key);
  });
};

Program.prototype.disableGpm = function() {
  if (this.gpm) {
    this.gpm.stop();
    delete this.gpm;
  }
};

// All possible responses from the terminal
Program.prototype.bindResponse = function() {
  if (this._boundResponse) return;
  this._boundResponse = true;

  var decoder = new StringDecoder('utf8')
    , self = this;

  this.on('data', function(data) {
    data = decoder.write(data);
    if (!data) return;
    self._bindResponse(data);
  });
};

Program.prototype._bindResponse = function(s) {
  var out = {}
    , parts;

  if (Buffer.isBuffer(s)) {
    if (s[0] > 127 && s[1] === undefined) {
      s[0] -= 128;
      s = '\x1b' + s.toString('utf-8');
    } else {
      s = s.toString('utf-8');
    }
  }

  // CSI P s c
  // Send Device Attributes (Primary DA).
  // CSI > P s c
  // Send Device Attributes (Secondary DA).
  if (parts = /^\x1b\[(\?|>)(\d*(?:;\d*)*)c/.exec(s)) {
    parts = parts[2].split(';').map(function(ch) {
      return +ch || 0;
    });

    out.event = 'device-attributes';
    out.code = 'DA';

    if (parts[1] === '?') {
      out.type = 'primary-attribute';
      // VT100-style params:
      if (parts[0] === 1 && parts[2] === 2) {
        out.term = 'vt100';
        out.advancedVideo = true;
      } else if (parts[0] === 1 && parts[2] === 0) {
        out.term = 'vt101';
      } else if (parts[0] === 6) {
        out.term = 'vt102';
      } else if (parts[0] === 60
        && parts[1] === 1 && parts[2] === 2
        && parts[3] === 6 && parts[4] === 8
        && parts[5] === 9 && parts[6] === 15) {
        out.term = 'vt220';
      } else {
        // VT200-style params:
        parts.forEach(function(attr) {
          switch (attr) {
            case 1:
              out.cols132 = true;
              break;
            case 2:
              out.printer = true;
              break;
            case 6:
              out.selectiveErase = true;
              break;
            case 8:
              out.userDefinedKeys = true;
              break;
            case 9:
              out.nationalReplacementCharsets = true;
              break;
            case 15:
              out.technicalCharacters = true;
              break;
            case 18:
              out.userWindows = true;
              break;
            case 21:
              out.horizontalScrolling = true;
              break;
            case 22:
              out.ansiColor = true;
              break;
            case 29:
              out.ansiTextLocator = true;
              break;
          }
        });
      }
    } else {
      out.type = 'secondary-attribute';
      switch (parts[0]) {
        case 0:
          out.term = 'vt100';
          break;
        case 1:
          out.term = 'vt220';
          break;
        case 2:
          out.term = 'vt240';
          break;
        case 18:
          out.term = 'vt330';
          break;
        case 19:
          out.term = 'vt340';
          break;
        case 24:
          out.term = 'vt320';
          break;
        case 41:
          out.term = 'vt420';
          break;
        case 61:
          out.term = 'vt510';
          break;
        case 64:
          out.term = 'vt520';
          break;
        case 65:
          out.term = 'vt525';
          break;
      }
      out.firmwareVersion = parts[1];
      out.romCartridgeRegistrationNumber = parts[2];
    }

    // LEGACY
    out.deviceAttributes = out;

    this.emit('response', out);
    this.emit('response ' + out.event, out);

    return;
  }

  // CSI Ps n  Device Status Report (DSR).
  //     Ps = 5  -> Status Report.  Result (``OK'') is
  //   CSI 0 n
  // CSI ? Ps n
  //   Device Status Report (DSR, DEC-specific).
  //     Ps = 1 5  -> Report Printer status as CSI ? 1 0  n  (ready).
  //     or CSI ? 1 1  n  (not ready).
  //     Ps = 2 5  -> Report UDK status as CSI ? 2 0  n  (unlocked)
  //     or CSI ? 2 1  n  (locked).
  //     Ps = 2 6  -> Report Keyboard status as
  //   CSI ? 2 7  ;  1  ;  0  ;  0  n  (North American).
  //   The last two parameters apply to VT400 & up, and denote key-
  //   board ready and LK01 respectively.
  //     Ps = 5 3  -> Report Locator status as
  //   CSI ? 5 3  n  Locator available, if compiled-in, or
  //   CSI ? 5 0  n  No Locator, if not.
  if (parts = /^\x1b\[(\?)?(\d+)(?:;(\d+);(\d+);(\d+))?n/.exec(s)) {
    out.event = 'device-status';
    out.code = 'DSR';

    if (!parts[1] && parts[2] === '0' && !parts[3]) {
      out.type = 'device-status';
      out.status = 'OK';

      // LEGACY
      out.deviceStatus = out.status;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1] && (parts[2] === '10' || parts[2] === '11') && !parts[3]) {
      out.type = 'printer-status';
      out.status = parts[2] === '10'
        ? 'ready'
        : 'not ready';

      // LEGACY
      out.printerStatus = out.status;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1] && (parts[2] === '20' || parts[2] === '21') && !parts[3]) {
      out.type = 'udk-status';
      out.status = parts[2] === '20'
        ? 'unlocked'
        : 'locked';

      // LEGACY
      out.UDKStatus = out.status;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1]
        && parts[2] === '27'
        && parts[3] === '1'
        && parts[4] === '0'
        && parts[5] === '0') {
      out.type = 'keyboard-status';
      out.status = 'OK';

      // LEGACY
      out.keyboardStatus = out.status;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1] && (parts[2] === '53' || parts[2] === '50') && !parts[3]) {
      out.type = 'locator-status';
      out.status = parts[2] === '53'
          ? 'available'
          : 'unavailable';

      // LEGACY
      out.locator = out.status;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    out.type = 'error';
    out.text = 'Unhandled: ' + JSON.stringify(parts);

    // LEGACY
    out.error = out.text;

    this.emit('response', out);
    this.emit('response ' + out.event, out);

    return;
  }

  // CSI Ps n  Device Status Report (DSR).
  //     Ps = 6  -> Report Cursor Position (CPR) [row;column].
  //   Result is
  //   CSI r ; c R
  // CSI ? Ps n
  //   Device Status Report (DSR, DEC-specific).
  //     Ps = 6  -> Report Cursor Position (CPR) [row;column] as CSI
  //     ? r ; c R (assumes page is zero).
  if (parts = /^\x1b\[(\?)?(\d+);(\d+)R/.exec(s)) {
    out.event = 'device-status';
    out.code = 'DSR';
    out.type = 'cursor-status';

    out.status = {
      x: +parts[3],
      y: +parts[2],
      page: !parts[1] ? undefined : 0
    };

    out.x = out.status.x;
    out.y = out.status.y;
    out.page = out.status.page;

    // LEGACY
    out.cursor = out.status;

    this.emit('response', out);
    this.emit('response ' + out.event, out);

    return;
  }

  // CSI Ps ; Ps ; Ps t
  //   Window manipulation (from dtterm, as well as extensions).
  //   These controls may be disabled using the allowWindowOps
  //   resource.  Valid values for the first (and any additional
  //   parameters) are:
  //     Ps = 1 1  -> Report xterm window state.  If the xterm window
  //     is open (non-iconified), it returns CSI 1 t .  If the xterm
  //     window is iconified, it returns CSI 2 t .
  //     Ps = 1 3  -> Report xterm window position.  Result is CSI 3
  //     ; x ; y t
  //     Ps = 1 4  -> Report xterm window in pixels.  Result is CSI
  //     4  ;  height ;  width t
  //     Ps = 1 8  -> Report the size of the text area in characters.
  //     Result is CSI  8  ;  height ;  width t
  //     Ps = 1 9  -> Report the size of the screen in characters.
  //     Result is CSI  9  ;  height ;  width t
  if (parts = /^\x1b\[(\d+)(?:;(\d+);(\d+))?t/.exec(s)) {
    out.event = 'window-manipulation';
    out.code = '';

    if ((parts[1] === '1' || parts[1] === '2') && !parts[2]) {
      out.type = 'window-state';
      out.state = parts[1] === '1'
        ? 'non-iconified'
        : 'iconified';

      // LEGACY
      out.windowState = out.state;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1] === '3' && parts[2]) {
      out.type = 'window-position';

      out.position = {
        x: +parts[2],
        y: +parts[3]
      };
      out.x = out.position.x;
      out.y = out.position.y;

      // LEGACY
      out.windowPosition = out.position;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1] === '4' && parts[2]) {
      out.type = 'window-size-pixels';
      out.size = {
        height: +parts[2],
        width: +parts[3]
      };
      out.height = out.size.height;
      out.width = out.size.width;

      // LEGACY
      out.windowSizePixels = out.size;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1] === '8' && parts[2]) {
      out.type = 'textarea-size';
      out.size = {
        height: +parts[2],
        width: +parts[3]
      };
      out.height = out.size.height;
      out.width = out.size.width;

      // LEGACY
      out.textAreaSizeCharacters = out.size;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1] === '9' && parts[2]) {
      out.type = 'screen-size';
      out.size = {
        height: +parts[2],
        width: +parts[3]
      };
      out.height = out.size.height;
      out.width = out.size.width;

      // LEGACY
      out.screenSizeCharacters = out.size;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    out.type = 'error';
    out.text = 'Unhandled: ' + JSON.stringify(parts);

    // LEGACY
    out.error = out.text;

    this.emit('response', out);
    this.emit('response ' + out.event, out);

    return;
  }

  // rxvt-unicode does not support window manipulation
  //   Result Normal: OSC l/L 0xEF 0xBF 0xBD
  //   Result ASCII: OSC l/L 0x1c (file separator)
  //   Result UTF8->ASCII: OSC l/L 0xFD
  // Test with:
  //   echo -ne '\ePtmux;\e\e[>3t\e\\'
  //   sleep 2 && echo -ne '\ePtmux;\e\e[21t\e\\' & cat -v
  //   -
  //   echo -ne '\e[>3t'
  //   sleep 2 && echo -ne '\e[21t' & cat -v
  if (parts = /^\x1b\](l|L)([^\x07\x1b]*)$/.exec(s)) {
    parts[2] = 'rxvt';
    s = '\x1b]' + parts[1] + parts[2] + '\x1b\\';
  }

  // CSI Ps ; Ps ; Ps t
  //   Window manipulation (from dtterm, as well as extensions).
  //   These controls may be disabled using the allowWindowOps
  //   resource.  Valid values for the first (and any additional
  //   parameters) are:
  //     Ps = 2 0  -> Report xterm window's icon label.  Result is
  //     OSC  L  label ST
  //     Ps = 2 1  -> Report xterm window's title.  Result is OSC  l
  //     label ST
  if (parts = /^\x1b\](l|L)([^\x07\x1b]*)(?:\x07|\x1b\\)/.exec(s)) {
    out.event = 'window-manipulation';
    out.code = '';

    if (parts[1] === 'L') {
      out.type = 'window-icon-label';
      out.text = parts[2];

      // LEGACY
      out.windowIconLabel = out.text;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    if (parts[1] === 'l') {
      out.type = 'window-title';
      out.text = parts[2];

      // LEGACY
      out.windowTitle = out.text;

      this.emit('response', out);
      this.emit('response ' + out.event, out);

      return;
    }

    out.type = 'error';
    out.text = 'Unhandled: ' + JSON.stringify(parts);

    // LEGACY
    out.error = out.text;

    this.emit('response', out);
    this.emit('response ' + out.event, out);

    return;
  }

  // CSI Ps ' |
  //   Request Locator Position (DECRQLP).
  //     -> CSI Pe ; Pb ; Pr ; Pc ; Pp &  w
  //   Parameters are [event;button;row;column;page].
  //   Valid values for the event:
  //     Pe = 0  -> locator unavailable - no other parameters sent.
  //     Pe = 1  -> request - xterm received a DECRQLP.
  //     Pe = 2  -> left button down.
  //     Pe = 3  -> left button up.
  //     Pe = 4  -> middle button down.
  //     Pe = 5  -> middle button up.
  //     Pe = 6  -> right button down.
  //     Pe = 7  -> right button up.
  //     Pe = 8  -> M4 button down.
  //     Pe = 9  -> M4 button up.
  //     Pe = 1 0  -> locator outside filter rectangle.
  //   ``button'' parameter is a bitmask indicating which buttons are
  //     pressed:
  //     Pb = 0  <- no buttons down.
  //     Pb & 1  <- right button down.
  //     Pb & 2  <- middle button down.
  //     Pb & 4  <- left button down.
  //     Pb & 8  <- M4 button down.
  //   ``row'' and ``column'' parameters are the coordinates of the
  //     locator position in the xterm window, encoded as ASCII deci-
  //     mal.
  //   The ``page'' parameter is not used by xterm, and will be omit-
  //   ted.
  // NOTE:
  // This is already implemented in the _bindMouse
  // method, but it might make more sense here.
  // The xterm mouse documentation says there is a
  // `<` prefix, the DECRQLP says there is no prefix.
  if (parts = /^\x1b\[(\d+(?:;\d+){4})&w/.exec(s)) {
    parts = parts[1].split(';').map(function(ch) {
      return +ch;
    });

    out.event = 'locator-position';
    out.code = 'DECRQLP';

    switch (parts[0]) {
      case 0:
        out.status = 'locator-unavailable';
        break;
      case 1:
        out.status = 'request';
        break;
      case 2:
        out.status = 'left-button-down';
        break;
      case 3:
        out.status = 'left-button-up';
        break;
      case 4:
        out.status = 'middle-button-down';
        break;
      case 5:
        out.status = 'middle-button-up';
        break;
      case 6:
        out.status = 'right-button-down';
        break;
      case 7:
        out.status = 'right-button-up';
        break;
      case 8:
        out.status = 'm4-button-down';
        break;
      case 9:
        out.status = 'm4-button-up';
        break;
      case 10:
        out.status = 'locator-outside';
        break;
    }

    out.mask = parts[1];
    out.row = parts[2];
    out.col = parts[3];
    out.page = parts[4];

    // LEGACY
    out.locatorPosition = out;

    this.emit('response', out);
    this.emit('response ' + out.event, out);

    return;
  }

  // OSC Ps ; Pt BEL
  // OSC Ps ; Pt ST
  // Set Text Parameters
  if (parts = /^\x1b\](\d+);([^\x07\x1b]+)(?:\x07|\x1b\\)/.exec(s)) {
    out.event = 'text-params';
    out.code = 'Set Text Parameters';
    out.ps = +s[1];
    out.pt = s[2];
    this.emit('response', out);
    this.emit('response ' + out.event, out);
  }
};

Program.prototype.response = function(name, text, callback, noBypass) {
  var self = this;

  if (arguments.length === 2) {
    callback = text;
    text = name;
    name = null;
  }

  if (!callback) {
    callback = function() {};
  }

  this.bindResponse();

  name = name
    ? 'response ' + name
    : 'response';

  var onresponse;

  this.once(name, onresponse = function(event) {
    if (timeout) clearTimeout(timeout);
    if (event.type === 'error') {
      return callback(new Error(event.event + ': ' + event.text));
    }
    return callback(null, event);
  });

  var timeout = setTimeout(function() {
    self.removeListener(name, onresponse);
    return callback(new Error('Timeout.'));
  }, 2000);

  return noBypass
    ? this._write(text)
    : this._twrite(text);
};

Program.prototype._owrite =
Program.prototype.write = function(text) {
  if (!this.output.writable) return;
  return this.output.write(text);
};

Program.prototype._buffer = function(text) {
  if (this._exiting) {
    this.flush();
    this._owrite(text);
    return;
  }

  if (this._buf) {
    this._buf += text;
    return;
  }

  this._buf = text;

  nextTick(this._flush);

  return true;
};

Program.prototype.flush = function() {
  if (!this._buf) return;
  this._owrite(this._buf);
  this._buf = '';
};

Program.prototype._write = function(text) {
  if (this.ret) return text;
  if (this.useBuffer) {
    return this._buffer(text);
  }
  return this._owrite(text);
};

// Example: `DCS tmux; ESC Pt ST`
// Real: `DCS tmux; ESC Pt ESC \`
Program.prototype._twrite = function(data) {
  var self = this
    , iterations = 0
    , timer;

  if (this.tmux) {
    // Replace all STs with BELs so they can be nested within the DCS code.
    data = data.replace(/\x1b\\/g, '\x07');

    // Wrap in tmux forward DCS:
    data = '\x1bPtmux;\x1b' + data + '\x1b\\';

    // If we've never even flushed yet, it means we're still in
    // the normal buffer. Wait for alt screen buffer.
    if (this.output.bytesWritten === 0) {
      timer = setInterval(function() {
        if (self.output.bytesWritten > 0 || ++iterations === 50) {
          clearInterval(timer);
          self.flush();
          self._owrite(data);
        }
      }, 100);
      return true;
    }

    // NOTE: Flushing the buffer is required in some cases.
    // The DCS code must be at the start of the output.
    this.flush();

    // Write out raw now that the buffer is flushed.
    return this._owrite(data);
  }

  return this._write(data);
};

Program.prototype.echo =
Program.prototype.print = function(text, attr) {
  return attr
    ? this._write(this.text(text, attr))
    : this._write(text);
};

Program.prototype._ncoords = function() {
  if (this.x < 0) this.x = 0;
  else if (this.x >= this.cols) this.x = this.cols - 1;
  if (this.y < 0) this.y = 0;
  else if (this.y >= this.rows) this.y = this.rows - 1;
};

Program.prototype.setx = function(x) {
  return this.cursorCharAbsolute(x);
  // return this.charPosAbsolute(x);
};

Program.prototype.sety = function(y) {
  return this.linePosAbsolute(y);
};

Program.prototype.move = function(x, y) {
  return this.cursorPos(y, x);
};

// TODO: Fix cud and cuu calls.
Program.prototype.omove = function(x, y) {
  if (!this.zero) {
    x = (x || 1) - 1;
    y = (y || 1) - 1;
  } else {
    x = x || 0;
    y = y || 0;
  }
  if (y === this.y && x === this.x) {
    return;
  }
  if (y === this.y) {
    if (x > this.x) {
      this.cuf(x - this.x);
    } else if (x < this.x) {
      this.cub(this.x - x);
    }
  } else if (x === this.x) {
    if (y > this.y) {
      this.cud(y - this.y);
    } else if (y < this.y) {
      this.cuu(this.y - y);
    }
  } else {
    if (!this.zero) x++, y++;
    this.cup(y, x);
  }
};

Program.prototype.rsetx = function(x) {
  // return this.HPositionRelative(x);
  if (!x) return;
  return x > 0
    ? this.forward(x)
    : this.back(-x);
};

Program.prototype.rsety = function(y) {
  // return this.VPositionRelative(y);
  if (!y) return;
  return y > 0
    ? this.up(y)
    : this.down(-y);
};

Program.prototype.rmove = function(x, y) {
  this.rsetx(x);
  this.rsety(y);
};

Program.prototype.simpleInsert = function(ch, i, attr) {
  return this._write(this.repeat(ch, i), attr);
};

Program.prototype.repeat = function(ch, i) {
  if (!i || i < 0) i = 0;
  return Array(i + 1).join(ch);
};

/* Depricated:
Program.prototype.__defineGetter__('title', function() {
  return this._title;
});

Program.prototype.__defineSetter__('title', function(title) {
  this.setTitle(title);
  return this._title;
});
*/
Object.defineProperty(Program.prototype,'title',{
  get: function () {  return this._title;},
  set: function (title) {
    this.setTitle(title);
    return this._title;  
  }
});

// Specific to iTerm2, but I think it's really cool.
// Example:
//  if (!screen.copyToClipboard(text)) {
//    execClipboardProgram(text);
//  }
Program.prototype.copyToClipboard = function(text) {
  if (this.isiTerm2) {
    this._twrite('\x1b]50;CopyToCliboard=' + text + '\x07');
    return true;
  }
  return false;
};

// Only XTerm and iTerm2. If you know of any others, post them.
Program.prototype.cursorShape = function(shape, blink) {
  if (this.isiTerm2) {
    switch (shape) {
      case 'block':
        if (!blink) {
          this._twrite('\x1b]50;CursorShape=0;BlinkingCursorEnabled=0\x07');
        } else {
          this._twrite('\x1b]50;CursorShape=0;BlinkingCursorEnabled=1\x07');
        }
        break;
      case 'underline':
        if (!blink) {
          // this._twrite('\x1b]50;CursorShape=n;BlinkingCursorEnabled=0\x07');
        } else {
          // this._twrite('\x1b]50;CursorShape=n;BlinkingCursorEnabled=1\x07');
        }
        break;
      case 'line':
        if (!blink) {
          this._twrite('\x1b]50;CursorShape=1;BlinkingCursorEnabled=0\x07');
        } else {
          this._twrite('\x1b]50;CursorShape=1;BlinkingCursorEnabled=1\x07');
        }
        break;
    }
    return true;
  } else if (this.term('xterm') || this.term('screen')) {
    switch (shape) {
      case 'block':
        if (!blink) {
          this._twrite('\x1b[0 q');
        } else {
          this._twrite('\x1b[1 q');
        }
        break;
      case 'underline':
        if (!blink) {
          this._twrite('\x1b[2 q');
        } else {
          this._twrite('\x1b[3 q');
        }
        break;
      case 'line':
        if (!blink) {
          this._twrite('\x1b[4 q');
        } else {
          this._twrite('\x1b[5 q');
        }
        break;
    }
    return true;
  }
  return false;
};

Program.prototype.cursorColor = function(color) {
  if (this.term('xterm') || this.term('rxvt') || this.term('screen')) {
    this._twrite('\x1b]12;' + color + '\x07');
    return true;
  }
  return false;
};

Program.prototype.cursorReset =
Program.prototype.resetCursor = function() {
  if (this.term('xterm') || this.term('rxvt') || this.term('screen')) {
    // XXX
    // return this.resetColors();
    this._twrite('\x1b[0 q');
    this._twrite('\x1b]112\x07');
    // urxvt doesnt support OSC 112
    this._twrite('\x1b]12;white\x07');
    return true;
  }
  return false;
};

Program.prototype.getTextParams = function(param, callback) {
  return this.response('text-params', '\x1b]' + param + ';?\x07', function(err, data) {
    if (err) return callback(err);
    return callback(null, data.pt);
  });
};

Program.prototype.getCursorColor = function(callback) {
  return this.getTextParams(12, callback);
};

/**
 * Normal
 */

//Program.prototype.pad =
Program.prototype.nul = function() {
  //if (this.has('pad')) return this.put.pad();
  return this._write('\200');
};

Program.prototype.bel =
Program.prototype.bell = function() {
  if (this.has('bel')) return this.put.bel();
  return this._write('\x07');
};

Program.prototype.vtab = function() {
  this.y++;
  this._ncoords();
  return this._write('\x0b');
};

Program.prototype.ff =
Program.prototype.form = function() {
  if (this.has('ff')) return this.put.ff();
  return this._write('\x0c');
};

Program.prototype.kbs =
Program.prototype.backspace = function() {
  this.x--;
  this._ncoords();
  if (this.has('kbs')) return this.put.kbs();
  return this._write('\x08');
};

Program.prototype.ht =
Program.prototype.tab = function() {
  this.x += 8;
  this._ncoords();
  if (this.has('ht')) return this.put.ht();
  return this._write('\t');
};

Program.prototype.shiftOut = function() {
  // if (this.has('S2')) return this.put.S2();
  return this._write('\x0e');
};

Program.prototype.shiftIn = function() {
  // if (this.has('S3')) return this.put.S3();
  return this._write('\x0f');
};

Program.prototype.cr =
Program.prototype.return = function() {
  this.x = 0;
  if (this.has('cr')) return this.put.cr();
  return this._write('\r');
};

Program.prototype.nel =
Program.prototype.newline =
Program.prototype.feed = function() {
  if (this.tput && this.tput.bools.eat_newline_glitch && this.x >= this.cols) {
    return;
  }
  this.x = 0;
  this.y++;
  this._ncoords();
  if (this.has('nel')) return this.put.nel();
  return this._write('\n');
};

/**
 * Esc
 */

// ESC D Index (IND is 0x84).
Program.prototype.ind =
Program.prototype.index = function() {
  this.y++;
  this._ncoords();
  if (this.tput) return this.put.ind();
  return this._write('\x1bD');
};

// ESC M Reverse Index (RI is 0x8d).
Program.prototype.ri =
Program.prototype.reverse =
Program.prototype.reverseIndex = function() {
  this.y--;
  this._ncoords();
  if (this.tput) return this.put.ri();
  return this._write('\x1bM');
};

// ESC E Next Line (NEL is 0x85).
Program.prototype.nextLine = function() {
  this.y++;
  this.x = 0;
  this._ncoords();
  if (this.has('nel')) return this.put.nel();
  return this._write('\x1bE');
};

// ESC c Full Reset (RIS).
Program.prototype.reset = function() {
  this.x = this.y = 0;
  if (this.has('rs1') || this.has('ris')) {
    return this.has('rs1')
      ? this.put.rs1()
      : this.put.ris();
  }
  return this._write('\x1bc');
};

// ESC H Tab Set (HTS is 0x88).
Program.prototype.tabSet = function() {
  if (this.tput) return this.put.hts();
  return this._write('\x1bH');
};

// ESC 7 Save Cursor (DECSC).
Program.prototype.sc =
Program.prototype.saveCursor = function(key) {
  if (key) return this.lsaveCursor(key);
  this.savedX = this.x || 0;
  this.savedY = this.y || 0;
  if (this.tput) return this.put.sc();
  return this._write('\x1b7');
};

// ESC 8 Restore Cursor (DECRC).
Program.prototype.rc =
Program.prototype.restoreCursor = function(key, hide) {
  if (key) return this.lrestoreCursor(key, hide);
  this.x = this.savedX || 0;
  this.y = this.savedY || 0;
  if (this.tput) return this.put.rc();
  return this._write('\x1b8');
};

// Save Cursor Locally
Program.prototype.lsaveCursor = function(key) {
  key = key || 'local';
  this._saved = this._saved || {};
  this._saved[key] = this._saved[key] || {};
  this._saved[key].x = this.x;
  this._saved[key].y = this.y;
  this._saved[key].hidden = this.cursorHidden;
};

// Restore Cursor Locally
Program.prototype.lrestoreCursor = function(key, hide) {
  var pos;
  key = key || 'local';
  if (!this._saved || !this._saved[key]) return;
  pos = this._saved[key];
  //delete this._saved[key];
  this.cup(pos.y, pos.x);
  if (hide && pos.hidden !== this.cursorHidden) {
    if (pos.hidden) {
      this.hideCursor();
    } else {
      this.showCursor();
    }
  }
};

// ESC # 3 DEC line height/width
Program.prototype.lineHeight = function() {
  return this._write('\x1b#');
};

// ESC (,),*,+,-,. Designate G0-G2 Character Set.
Program.prototype.charset = function(val, level) {
  level = level || 0;

  // See also:
  // acs_chars / acsc / ac
  // enter_alt_charset_mode / smacs / as
  // exit_alt_charset_mode / rmacs / ae
  // enter_pc_charset_mode / smpch / S2
  // exit_pc_charset_mode / rmpch / S3

  switch (level) {
    case 0:
      level = '(';
      break;
    case 1:
      level = ')';
      break;
    case 2:
      level = '*';
      break;
    case 3:
      level = '+';
      break;
  }

  var name = typeof val === 'string'
    ? val.toLowerCase()
    : val;

  switch (name) {
    case 'acs':
    case 'scld': // DEC Special Character and Line Drawing Set.
      if (this.tput) return this.put.smacs();
      val = '0';
      break;
    case 'uk': // UK
      val = 'A';
      break;
    case 'us': // United States (USASCII).
    case 'usascii':
    case 'ascii':
      if (this.tput) return this.put.rmacs();
      val = 'B';
      break;
    case 'dutch': // Dutch
      val = '4';
      break;
    case 'finnish': // Finnish
      val = 'C';
      val = '5';
      break;
    case 'french': // French
      val = 'R';
      break;
    case 'frenchcanadian': // FrenchCanadian
      val = 'Q';
      break;
    case 'german':  // German
      val = 'K';
      break;
    case 'italian': // Italian
      val = 'Y';
      break;
    case 'norwegiandanish': // NorwegianDanish
      val = 'E';
      val = '6';
      break;
    case 'spanish': // Spanish
      val = 'Z';
      break;
    case 'swedish': // Swedish
      val = 'H';
      val = '7';
      break;
    case 'swiss': // Swiss
      val = '=';
      break;
    case 'isolatin': // ISOLatin (actually /A)
      val = '/A';
      break;
    default: // Default
      if (this.tput) return this.put.rmacs();
      val = 'B';
      break;
  }

  return this._write('\x1b(' + val);
};

Program.prototype.enter_alt_charset_mode =
Program.prototype.as =
Program.prototype.smacs = function() {
  return this.charset('acs');
};

Program.prototype.exit_alt_charset_mode =
Program.prototype.ae =
Program.prototype.rmacs = function() {
  return this.charset('ascii');
};

// ESC N
// Single Shift Select of G2 Character Set
// ( SS2 is 0x8e). This affects next character only.
// ESC O
// Single Shift Select of G3 Character Set
// ( SS3 is 0x8f). This affects next character only.
// ESC n
// Invoke the G2 Character Set as GL (LS2).
// ESC o
// Invoke the G3 Character Set as GL (LS3).
// ESC |
// Invoke the G3 Character Set as GR (LS3R).
// ESC }
// Invoke the G2 Character Set as GR (LS2R).
// ESC ~
// Invoke the G1 Character Set as GR (LS1R).
Program.prototype.setG = function(val) {
  // if (this.tput) return this.put.S2();
  // if (this.tput) return this.put.S3();
  switch (val) {
    case 1:
      val = '~'; // GR
      break;
    case 2:
      val = 'n'; // GL
      val = '}'; // GR
      val = 'N'; // Next Char Only
      break;
    case 3:
      val = 'o'; // GL
      val = '|'; // GR
      val = 'O'; // Next Char Only
      break;
  }
  return this._write('\x1b' + val);
};

/**
 * OSC
 */

// OSC Ps ; Pt ST
// OSC Ps ; Pt BEL
//   Set Text Parameters.
Program.prototype.setTitle = function(title) {
  this._title = title;

  // if (this.term('screen')) {
  //   // Tmux pane
  //   // if (this.tmux) {
  //   //   return this._write('\x1b]2;' + title + '\x1b\\');
  //   // }
  //   return this._write('\x1bk' + title + '\x1b\\');
  // }

  return this._twrite('\x1b]0;' + title + '\x07');
};

// OSC Ps ; Pt ST
// OSC Ps ; Pt BEL
//   Reset colors
Program.prototype.resetColors = function(param) {
  if (this.has('Cr')) {
    return this.put.Cr(param);
  }
  return this._twrite('\x1b]112\x07');
  //return this._twrite('\x1b]112;' + param + '\x07');
};

// OSC Ps ; Pt ST
// OSC Ps ; Pt BEL
//   Change dynamic colors
Program.prototype.dynamicColors = function(param) {
  if (this.has('Cs')) {
    return this.put.Cs(param);
  }
  return this._twrite('\x1b]12;' + param + '\x07');
};

// OSC Ps ; Pt ST
// OSC Ps ; Pt BEL
//   Sel data
Program.prototype.selData = function(a, b) {
  if (this.has('Ms')) {
    return this.put.Ms(a, b);
  }
  return this._twrite('\x1b]52;' + a + ';' + b + '\x07');
};

/**
 * CSI
 */

// CSI Ps A
// Cursor Up Ps Times (default = 1) (CUU).
Program.prototype.cuu =
Program.prototype.up =
Program.prototype.cursorUp = function(param) {
  this.y -= param || 1;
  this._ncoords();
  if (this.tput) {
    if (!this.tput.strings.parm_up_cursor) {
      return this._write(this.repeat(this.tput.cuu1(), param));
    }
    return this.put.cuu(param);
  }
  return this._write('\x1b[' + (param || '') + 'A');
};

// CSI Ps B
// Cursor Down Ps Times (default = 1) (CUD).
Program.prototype.cud =
Program.prototype.down =
Program.prototype.cursorDown = function(param) {
  this.y += param || 1;
  this._ncoords();
  if (this.tput) {
    if (!this.tput.strings.parm_down_cursor) {
      return this._write(this.repeat(this.tput.cud1(), param));
    }
    return this.put.cud(param);
  }
  return this._write('\x1b[' + (param || '') + 'B');
};

// CSI Ps C
// Cursor Forward Ps Times (default = 1) (CUF).
Program.prototype.cuf =
Program.prototype.right =
Program.prototype.forward =
Program.prototype.cursorForward = function(param) {
  this.x += param || 1;
  this._ncoords();
  if (this.tput) {
    if (!this.tput.strings.parm_right_cursor) {
      return this._write(this.repeat(this.tput.cuf1(), param));
    }
    return this.put.cuf(param);
  }
  return this._write('\x1b[' + (param || '') + 'C');
};

// CSI Ps D
// Cursor Backward Ps Times (default = 1) (CUB).
Program.prototype.cub =
Program.prototype.left =
Program.prototype.back =
Program.prototype.cursorBackward = function(param) {
  this.x -= param || 1;
  this._ncoords();
  if (this.tput) {
    if (!this.tput.strings.parm_left_cursor) {
      return this._write(this.repeat(this.tput.cub1(), param));
    }
    return this.put.cub(param);
  }
  return this._write('\x1b[' + (param || '') + 'D');
};

// CSI Ps ; Ps H
// Cursor Position [row;column] (default = [1,1]) (CUP).
Program.prototype.cup =
Program.prototype.pos =
Program.prototype.cursorPos = function(row, col) {
  if (!this.zero) {
    row = (row || 1) - 1;
    col = (col || 1) - 1;
  } else {
    row = row || 0;
    col = col || 0;
  }
  this.x = col;
  this.y = row;
  this._ncoords();
  if (this.tput) return this.put.cup(row, col);
  return this._write('\x1b[' + (row + 1) + ';' + (col + 1) + 'H');
};

// CSI Ps J  Erase in Display (ED).
//     Ps = 0  -> Erase Below (default).
//     Ps = 1  -> Erase Above.
//     Ps = 2  -> Erase All.
//     Ps = 3  -> Erase Saved Lines (xterm).
// CSI ? Ps J
//   Erase in Display (DECSED).
//     Ps = 0  -> Selective Erase Below (default).
//     Ps = 1  -> Selective Erase Above.
//     Ps = 2  -> Selective Erase All.
Program.prototype.ed =
Program.prototype.eraseInDisplay = function(param) {
  if (this.tput) {
    switch (param) {
      case 'above':
        param = 1;
        break;
      case 'all':
        param = 2;
        break;
      case 'saved':
        param = 3;
        break;
      case 'below':
      default:
        param = 0;
        break;
    }
    // extended tput.E3 = ^[[3;J
    return this.put.ed(param);
  }
  switch (param) {
    case 'above':
      return this._write('\X1b[1J');
    case 'all':
      return this._write('\x1b[2J');
    case 'saved':
      return this._write('\x1b[3J');
    case 'below':
    default:
      return this._write('\x1b[J');
  }
};

Program.prototype.clear = function() {
  this.x = 0;
  this.y = 0;
  if (this.tput) return this.put.clear();
  return this._write('\x1b[H\x1b[J');
};

// CSI Ps K  Erase in Line (EL).
//     Ps = 0  -> Erase to Right (default).
//     Ps = 1  -> Erase to Left.
//     Ps = 2  -> Erase All.
// CSI ? Ps K
//   Erase in Line (DECSEL).
//     Ps = 0  -> Selective Erase to Right (default).
//     Ps = 1  -> Selective Erase to Left.
//     Ps = 2  -> Selective Erase All.
Program.prototype.el =
Program.prototype.eraseInLine = function(param) {
  if (this.tput) {
    //if (this.tput.back_color_erase) ...
    switch (param) {
      case 'left':
        param = 1;
        break;
      case 'all':
        param = 2;
        break;
      case 'right':
      default:
        param = 0;
        break;
    }
    return this.put.el(param);
  }
  switch (param) {
    case 'left':
      return this._write('\x1b[1K');
    case 'all':
      return this._write('\x1b[2K');
    case 'right':
    default:
      return this._write('\x1b[K');
  }
};

// CSI Pm m  Character Attributes (SGR).
//     Ps = 0  -> Normal (default).
//     Ps = 1  -> Bold.
//     Ps = 4  -> Underlined.
//     Ps = 5  -> Blink (appears as Bold).
//     Ps = 7  -> Inverse.
//     Ps = 8  -> Invisible, i.e., hidden (VT300).
//     Ps = 2 2  -> Normal (neither bold nor faint).
//     Ps = 2 4  -> Not underlined.
//     Ps = 2 5  -> Steady (not blinking).
//     Ps = 2 7  -> Positive (not inverse).
//     Ps = 2 8  -> Visible, i.e., not hidden (VT300).
//     Ps = 3 0  -> Set foreground color to Black.
//     Ps = 3 1  -> Set foreground color to Red.
//     Ps = 3 2  -> Set foreground color to Green.
//     Ps = 3 3  -> Set foreground color to Yellow.
//     Ps = 3 4  -> Set foreground color to Blue.
//     Ps = 3 5  -> Set foreground color to Magenta.
//     Ps = 3 6  -> Set foreground color to Cyan.
//     Ps = 3 7  -> Set foreground color to White.
//     Ps = 3 9  -> Set foreground color to default (original).
//     Ps = 4 0  -> Set background color to Black.
//     Ps = 4 1  -> Set background color to Red.
//     Ps = 4 2  -> Set background color to Green.
//     Ps = 4 3  -> Set background color to Yellow.
//     Ps = 4 4  -> Set background color to Blue.
//     Ps = 4 5  -> Set background color to Magenta.
//     Ps = 4 6  -> Set background color to Cyan.
//     Ps = 4 7  -> Set background color to White.
//     Ps = 4 9  -> Set background color to default (original).

//   If 16-color support is compiled, the following apply.  Assume
//   that xterm's resources are set so that the ISO color codes are
//   the first 8 of a set of 16.  Then the aixterm colors are the
//   bright versions of the ISO colors:
//     Ps = 9 0  -> Set foreground color to Black.
//     Ps = 9 1  -> Set foreground color to Red.
//     Ps = 9 2  -> Set foreground color to Green.
//     Ps = 9 3  -> Set foreground color to Yellow.
//     Ps = 9 4  -> Set foreground color to Blue.
//     Ps = 9 5  -> Set foreground color to Magenta.
//     Ps = 9 6  -> Set foreground color to Cyan.
//     Ps = 9 7  -> Set foreground color to White.
//     Ps = 1 0 0  -> Set background color to Black.
//     Ps = 1 0 1  -> Set background color to Red.
//     Ps = 1 0 2  -> Set background color to Green.
//     Ps = 1 0 3  -> Set background color to Yellow.
//     Ps = 1 0 4  -> Set background color to Blue.
//     Ps = 1 0 5  -> Set background color to Magenta.
//     Ps = 1 0 6  -> Set background color to Cyan.
//     Ps = 1 0 7  -> Set background color to White.

//   If xterm is compiled with the 16-color support disabled, it
//   supports the following, from rxvt:
//     Ps = 1 0 0  -> Set foreground and background color to
//     default.

//   If 88- or 256-color support is compiled, the following apply.
//     Ps = 3 8  ; 5  ; Ps -> Set foreground color to the second
//     Ps.
//     Ps = 4 8  ; 5  ; Ps -> Set background color to the second
//     Ps.
Program.prototype.sgr =
Program.prototype.attr =
Program.prototype.charAttributes = function(param, val) {
  return this._write(this._attr(param, val));
};

Program.prototype.text = function(text, attr) {
  return this._attr(attr, true) + text + this._attr(attr, false);
};

// NOTE: sun-color may not allow multiple params for SGR.
Program.prototype._attr = function(param, val) {
  var self = this
    , parts
    , color
    , m;

  if (Array.isArray(param)) {
    parts = param;
    param = parts[0] || 'normal';
  } else {
    param = param || 'normal';
    parts = param.split(/\s*[,;]\s*/);
  }

  if (parts.length > 1) {
    var used = {}
      , out = [];

    parts.forEach(function(part) {
      part = self._attr(part, val).slice(2, -1);
      if (part === '') return;
      if (used[part]) return;
      used[part] = true;
      out.push(part);
    });

    return '\x1b[' + out.join(';') + 'm';
  }

  if (param.indexOf('no ') === 0) {
    param = param.substring(3);
    val = false;
  } else if (param.indexOf('!') === 0) {
    param = param.substring(1);
    val = false;
  }

  switch (param) {
    // attributes
    case 'normal':
    case 'default':
      if (val === false) return '';
      return '\x1b[m';
    case 'bold':
      return val === false
        ? '\x1b[22m'
        : '\x1b[1m';
    case 'ul':
    case 'underline':
    case 'underlined':
      return val === false
        ? '\x1b[24m'
        : '\x1b[4m';
    case 'blink':
      return val === false
        ? '\x1b[25m'
        : '\x1b[5m';
    case 'inverse':
      return val === false
        ? '\x1b[27m'
        : '\x1b[7m';
    case 'invisible':
      return val === false
        ? '\x1b[28m'
        : '\x1b[8m';

    // 8-color foreground
    case 'black fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[30m';
    case 'red fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[31m';
    case 'green fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[32m';
    case 'yellow fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[33m';
    case 'blue fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[34m';
    case 'magenta fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[35m';
    case 'cyan fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[36m';
    case 'white fg':
    case 'light grey fg':
    case 'light gray fg':
    case 'bright grey fg':
    case 'bright gray fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[37m';
    case 'default fg':
      if (val === false) return '';
      return '\x1b[39m';

    // 8-color background
    case 'black bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[40m';
    case 'red bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[41m';
    case 'green bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[42m';
    case 'yellow bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[43m';
    case 'blue bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[44m';
    case 'magenta bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[45m';
    case 'cyan bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[46m';
    case 'white bg':
    case 'light grey bg':
    case 'light gray bg':
    case 'bright grey bg':
    case 'bright gray bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[47m';
    case 'default bg':
      if (val === false) return '';
      return '\x1b[49m';

    // 16-color foreground
    case 'light black fg':
    case 'bright black fg':
    case 'grey fg':
    case 'gray fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[90m';
    case 'light red fg':
    case 'bright red fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[91m';
    case 'light green fg':
    case 'bright green fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[92m';
    case 'light yellow fg':
    case 'bright yellow fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[93m';
    case 'light blue fg':
    case 'bright blue fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[94m';
    case 'light magenta fg':
    case 'bright magenta fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[95m';
    case 'light cyan fg':
    case 'bright cyan fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[96m';
    case 'light white fg':
    case 'bright white fg':
      return val === false
        ? '\x1b[39m'
        : '\x1b[97m';

    // 16-color background
    case 'light black bg':
    case 'bright black bg':
    case 'grey bg':
    case 'gray bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[100m';
    case 'light red bg':
    case 'bright red bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[101m';
    case 'light green bg':
    case 'bright green bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[102m';
    case 'light yellow bg':
    case 'bright yellow bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[103m';
    case 'light blue bg':
    case 'bright blue bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[104m';
    case 'light magenta bg':
    case 'bright magenta bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[105m';
    case 'light cyan bg':
    case 'bright cyan bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[106m';
    case 'light white bg':
    case 'bright white bg':
      return val === false
        ? '\x1b[49m'
        : '\x1b[107m';

    // non-16-color rxvt default fg and bg
    case 'default fg bg':
      if (val === false) return '';
      return this.term('rxvt')
        ? '\x1b[100m'
        : '\x1b[39;49m';

    default:
      // 256-color fg and bg
      if (param[0] === '#') {
        param = param.replace(/#(?:[0-9a-f]{3}){1,2}/i, colors.match);
      }

      m = /^(-?\d+) (fg|bg)$/.exec(param);
      if (m) {
        color = +m[1];

        if (val === false || color === -1) {
          return this._attr('default ' + m[2]);
        }

        color = colors.reduce(color, this.tput.colors);

        if (color < 16 || (this.tput && this.tput.colors <= 16)) {
          if (m[2] === 'fg') {
            if (color < 8) {
              color += 30;
            } else if (color < 16) {
              color -= 8;
              color += 90;
            }
          } else if (m[2] === 'bg') {
            if (color < 8) {
              color += 40;
            } else if (color < 16) {
              color -= 8;
              color += 100;
            }
          }
          return '\x1b[' + color + 'm';
        }

        if (m[2] === 'fg') {
          return '\x1b[38;5;' + color + 'm';
        }

        if (m[2] === 'bg') {
          return '\x1b[48;5;' + color + 'm';
        }
      }

      if (/^[\d;]*$/.test(param)) {
        return '\x1b[' + param + 'm';
      }

      return null;
  }
};

Program.prototype.fg =
Program.prototype.setForeground = function(color, val) {
  color = color.split(/\s*[,;]\s*/).join(' fg, ') + ' fg';
  return this.attr(color, val);
};

Program.prototype.bg =
Program.prototype.setBackground = function(color, val) {
  color = color.split(/\s*[,;]\s*/).join(' bg, ') + ' bg';
  return this.attr(color, val);
};

// CSI Ps n  Device Status Report (DSR).
//     Ps = 5  -> Status Report.  Result (``OK'') is
//   CSI 0 n
//     Ps = 6  -> Report Cursor Position (CPR) [row;column].
//   Result is
//   CSI r ; c R
// CSI ? Ps n
//   Device Status Report (DSR, DEC-specific).
//     Ps = 6  -> Report Cursor Position (CPR) [row;column] as CSI
//     ? r ; c R (assumes page is zero).
//     Ps = 1 5  -> Report Printer status as CSI ? 1 0  n  (ready).
//     or CSI ? 1 1  n  (not ready).
//     Ps = 2 5  -> Report UDK status as CSI ? 2 0  n  (unlocked)
//     or CSI ? 2 1  n  (locked).
//     Ps = 2 6  -> Report Keyboard status as
//   CSI ? 2 7  ;  1  ;  0  ;  0  n  (North American).
//   The last two parameters apply to VT400 & up, and denote key-
//   board ready and LK01 respectively.
//     Ps = 5 3  -> Report Locator status as
//   CSI ? 5 3  n  Locator available, if compiled-in, or
//   CSI ? 5 0  n  No Locator, if not.
Program.prototype.dsr =
Program.prototype.deviceStatus = function(param, callback, dec, noBypass) {
  if (dec) {
    return this.response('device-status',
      '\x1b[?' + (param || '0') + 'n', callback, noBypass);
  }
  return this.response('device-status',
    '\x1b[' + (param || '0') + 'n', callback, noBypass);
};

Program.prototype.getCursor = function(callback) {
  return this.deviceStatus(6, callback, false, true);
};

Program.prototype.saveReportedCursor = function(callback) {
  var self = this;
  if (this.tput.strings.user7 === '\x1b[6n' || this.term('screen')) {
    return this.getCursor(function(err, data) {
      if (data) {
        self._rx = data.status.x;
        self._ry = data.status.y;
      }
      if (!callback) return;
      return callback(err);
    });
  }
  if (!callback) return;
  return callback();
};

Program.prototype.restoreReportedCursor = function() {
  if (this._rx == null) return;
  return this.cup(this._ry, this._rx);
  // return this.nel();
};

/**
 * Additions
 */

// CSI Ps @
// Insert Ps (Blank) Character(s) (default = 1) (ICH).
Program.prototype.ich =
Program.prototype.insertChars = function(param) {
  this.x += param || 1;
  this._ncoords();
  if (this.tput) return this.put.ich(param);
  return this._write('\x1b[' + (param || 1) + '@');
};

// CSI Ps E
// Cursor Next Line Ps Times (default = 1) (CNL).
// same as CSI Ps B ?
Program.prototype.cnl =
Program.prototype.cursorNextLine = function(param) {
  this.y += param || 1;
  this._ncoords();
  return this._write('\x1b[' + (param || '') + 'E');
};

// CSI Ps F
// Cursor Preceding Line Ps Times (default = 1) (CNL).
// reuse CSI Ps A ?
Program.prototype.cpl =
Program.prototype.cursorPrecedingLine = function(param) {
  this.y -= param || 1;
  this._ncoords();
  return this._write('\x1b[' + (param || '') + 'F');
};

// CSI Ps G
// Cursor Character Absolute  [column] (default = [row,1]) (CHA).
Program.prototype.cha =
Program.prototype.cursorCharAbsolute = function(param) {
  if (!this.zero) {
    param = (param || 1) - 1;
  } else {
    param = param || 0;
  }
  this.x = param;
  this.y = 0;
  this._ncoords();
  if (this.tput) return this.put.hpa(param);
  return this._write('\x1b[' + (param + 1) + 'G');
};

// CSI Ps L
// Insert Ps Line(s) (default = 1) (IL).
Program.prototype.il =
Program.prototype.insertLines = function(param) {
  if (this.tput) return this.put.il(param);
  return this._write('\x1b[' + (param || '') + 'L');
};

// CSI Ps M
// Delete Ps Line(s) (default = 1) (DL).
Program.prototype.dl =
Program.prototype.deleteLines = function(param) {
  if (this.tput) return this.put.dl(param);
  return this._write('\x1b[' + (param || '') + 'M');
};

// CSI Ps P
// Delete Ps Character(s) (default = 1) (DCH).
Program.prototype.dch =
Program.prototype.deleteChars = function(param) {
  if (this.tput) return this.put.dch(param);
  return this._write('\x1b[' + (param || '') + 'P');
};

// CSI Ps X
// Erase Ps Character(s) (default = 1) (ECH).
Program.prototype.ech =
Program.prototype.eraseChars = function(param) {
  if (this.tput) return this.put.ech(param);
  return this._write('\x1b[' + (param || '') + 'X');
};

// CSI Pm `  Character Position Absolute
//   [column] (default = [row,1]) (HPA).
Program.prototype.hpa =
Program.prototype.charPosAbsolute = function(param) {
  this.x = param || 0;
  this._ncoords();
  if (this.tput) {
    return this.put.hpa.apply(this.put, arguments);
  }
  param = slice.call(arguments).join(';');
  return this._write('\x1b[' + (param || '') + '`');
};

// 141 61 a * HPR -
// Horizontal Position Relative
// reuse CSI Ps C ?
Program.prototype.hpr =
Program.prototype.HPositionRelative = function(param) {
  if (this.tput) return this.cuf(param);
  this.x += param || 1;
  this._ncoords();
  // Does not exist:
  // if (this.tput) return this.put.hpr(param);
  return this._write('\x1b[' + (param || '') + 'a');
};

// CSI Ps c  Send Device Attributes (Primary DA).
//     Ps = 0  or omitted -> request attributes from terminal.  The
//     response depends on the decTerminalID resource setting.
//     -> CSI ? 1 ; 2 c  (``VT100 with Advanced Video Option'')
//     -> CSI ? 1 ; 0 c  (``VT101 with No Options'')
//     -> CSI ? 6 c  (``VT102'')
//     -> CSI ? 6 0 ; 1 ; 2 ; 6 ; 8 ; 9 ; 1 5 ; c  (``VT220'')
//   The VT100-style response parameters do not mean anything by
//   themselves.  VT220 parameters do, telling the host what fea-
//   tures the terminal supports:
//     Ps = 1  -> 132-columns.
//     Ps = 2  -> Printer.
//     Ps = 6  -> Selective erase.
//     Ps = 8  -> User-defined keys.
//     Ps = 9  -> National replacement character sets.
//     Ps = 1 5  -> Technical characters.
//     Ps = 2 2  -> ANSI color, e.g., VT525.
//     Ps = 2 9  -> ANSI text locator (i.e., DEC Locator mode).
// CSI > Ps c
//   Send Device Attributes (Secondary DA).
//     Ps = 0  or omitted -> request the terminal's identification
//     code.  The response depends on the decTerminalID resource set-
//     ting.  It should apply only to VT220 and up, but xterm extends
//     this to VT100.
//     -> CSI  > Pp ; Pv ; Pc c
//   where Pp denotes the terminal type
//     Pp = 0  -> ``VT100''.
//     Pp = 1  -> ``VT220''.
//   and Pv is the firmware version (for xterm, this was originally
//   the XFree86 patch number, starting with 95).  In a DEC termi-
//   nal, Pc indicates the ROM cartridge registration number and is
//   always zero.
// More information:
//   xterm/charproc.c - line 2012, for more information.
//   vim responds with ^[[?0c or ^[[?1c after the terminal's response (?)
Program.prototype.da =
Program.prototype.sendDeviceAttributes = function(param, callback) {
  return this.response('device-attributes',
    '\x1b[' + (param || '') + 'c', callback);
};

// CSI Pm d
// Line Position Absolute  [row] (default = [1,column]) (VPA).
// NOTE: Can't find in terminfo, no idea why it has multiple params.
Program.prototype.vpa =
Program.prototype.linePosAbsolute = function(param) {
  this.y = param || 1;
  this._ncoords();
  if (this.tput) {
    return this.put.vpa.apply(this.put, arguments);
  }
  param = slice.call(arguments).join(';');
  return this._write('\x1b[' + (param || '') + 'd');
};

// 145 65 e * VPR - Vertical Position Relative
// reuse CSI Ps B ?
Program.prototype.vpr =
Program.prototype.VPositionRelative = function(param) {
  if (this.tput) return this.cud(param);
  this.y += param || 1;
  this._ncoords();
  // Does not exist:
  // if (this.tput) return this.put.vpr(param);
  return this._write('\x1b[' + (param || '') + 'e');
};

// CSI Ps ; Ps f
//   Horizontal and Vertical Position [row;column] (default =
//   [1,1]) (HVP).
Program.prototype.hvp =
Program.prototype.HVPosition = function(row, col) {
  if (!this.zero) {
    row = (row || 1) - 1;
    col = (col || 1) - 1;
  } else {
    row = row || 0;
    col = col || 0;
  }
  this.y = row;
  this.x = col;
  this._ncoords();
  // Does not exist (?):
  // if (this.tput) return this.put.hvp(row, col);
  if (this.tput) return this.put.cup(row, col);
  return this._write('\x1b[' + (row + 1) + ';' + (col + 1) + 'f');
};

// CSI Pm h  Set Mode (SM).
//     Ps = 2  -> Keyboard Action Mode (AM).
//     Ps = 4  -> Insert Mode (IRM).
//     Ps = 1 2  -> Send/receive (SRM).
//     Ps = 2 0  -> Automatic Newline (LNM).
// CSI ? Pm h
//   DEC Private Mode Set (DECSET).
//     Ps = 1  -> Application Cursor Keys (DECCKM).
//     Ps = 2  -> Designate USASCII for character sets G0-G3
//     (DECANM), and set VT100 mode.
//     Ps = 3  -> 132 Column Mode (DECCOLM).
//     Ps = 4  -> Smooth (Slow) Scroll (DECSCLM).
//     Ps = 5  -> Reverse Video (DECSCNM).
//     Ps = 6  -> Origin Mode (DECOM).
//     Ps = 7  -> Wraparound Mode (DECAWM).
//     Ps = 8  -> Auto-repeat Keys (DECARM).
//     Ps = 9  -> Send Mouse X & Y on button press.  See the sec-
//     tion Mouse Tracking.
//     Ps = 1 0  -> Show toolbar (rxvt).
//     Ps = 1 2  -> Start Blinking Cursor (att610).
//     Ps = 1 8  -> Print form feed (DECPFF).
//     Ps = 1 9  -> Set print extent to full screen (DECPEX).
//     Ps = 2 5  -> Show Cursor (DECTCEM).
//     Ps = 3 0  -> Show scrollbar (rxvt).
//     Ps = 3 5  -> Enable font-shifting functions (rxvt).
//     Ps = 3 8  -> Enter Tektronix Mode (DECTEK).
//     Ps = 4 0  -> Allow 80 -> 132 Mode.
//     Ps = 4 1  -> more(1) fix (see curses resource).
//     Ps = 4 2  -> Enable Nation Replacement Character sets (DECN-
//     RCM).
//     Ps = 4 4  -> Turn On Margin Bell.
//     Ps = 4 5  -> Reverse-wraparound Mode.
//     Ps = 4 6  -> Start Logging.  This is normally disabled by a
//     compile-time option.
//     Ps = 4 7  -> Use Alternate Screen Buffer.  (This may be dis-
//     abled by the titeInhibit resource).
//     Ps = 6 6  -> Application keypad (DECNKM).
//     Ps = 6 7  -> Backarrow key sends backspace (DECBKM).
//     Ps = 1 0 0 0  -> Send Mouse X & Y on button press and
//     release.  See the section Mouse Tracking.
//     Ps = 1 0 0 1  -> Use Hilite Mouse Tracking.
//     Ps = 1 0 0 2  -> Use Cell Motion Mouse Tracking.
//     Ps = 1 0 0 3  -> Use All Motion Mouse Tracking.
//     Ps = 1 0 0 4  -> Send FocusIn/FocusOut events.
//     Ps = 1 0 0 5  -> Enable Extended Mouse Mode.
//     Ps = 1 0 1 0  -> Scroll to bottom on tty output (rxvt).
//     Ps = 1 0 1 1  -> Scroll to bottom on key press (rxvt).
//     Ps = 1 0 3 4  -> Interpret "meta" key, sets eighth bit.
//     (enables the eightBitInput resource).
//     Ps = 1 0 3 5  -> Enable special modifiers for Alt and Num-
//     Lock keys.  (This enables the numLock resource).
//     Ps = 1 0 3 6  -> Send ESC   when Meta modifies a key.  (This
//     enables the metaSendsEscape resource).
//     Ps = 1 0 3 7  -> Send DEL from the editing-keypad Delete
//     key.
//     Ps = 1 0 3 9  -> Send ESC  when Alt modifies a key.  (This
//     enables the altSendsEscape resource).
//     Ps = 1 0 4 0  -> Keep selection even if not highlighted.
//     (This enables the keepSelection resource).
//     Ps = 1 0 4 1  -> Use the CLIPBOARD selection.  (This enables
//     the selectToClipboard resource).
//     Ps = 1 0 4 2  -> Enable Urgency window manager hint when
//     Control-G is received.  (This enables the bellIsUrgent
//     resource).
//     Ps = 1 0 4 3  -> Enable raising of the window when Control-G
//     is received.  (enables the popOnBell resource).
//     Ps = 1 0 4 7  -> Use Alternate Screen Buffer.  (This may be
//     disabled by the titeInhibit resource).
//     Ps = 1 0 4 8  -> Save cursor as in DECSC.  (This may be dis-
//     abled by the titeInhibit resource).
//     Ps = 1 0 4 9  -> Save cursor as in DECSC and use Alternate
//     Screen Buffer, clearing it first.  (This may be disabled by
//     the titeInhibit resource).  This combines the effects of the 1
//     0 4 7  and 1 0 4 8  modes.  Use this with terminfo-based
//     applications rather than the 4 7  mode.
//     Ps = 1 0 5 0  -> Set terminfo/termcap function-key mode.
//     Ps = 1 0 5 1  -> Set Sun function-key mode.
//     Ps = 1 0 5 2  -> Set HP function-key mode.
//     Ps = 1 0 5 3  -> Set SCO function-key mode.
//     Ps = 1 0 6 0  -> Set legacy keyboard emulation (X11R6).
//     Ps = 1 0 6 1  -> Set VT220 keyboard emulation.
//     Ps = 2 0 0 4  -> Set bracketed paste mode.
// Modes:
//   http://vt100.net/docs/vt220-rm/chapter4.html
Program.prototype.sm =
Program.prototype.setMode = function() {
  var param = slice.call(arguments).join(';');
  return this._write('\x1b[' + (param || '') + 'h');
};

Program.prototype.decset = function() {
  var param = slice.call(arguments).join(';');
  return this.setMode('?' + param);
};

Program.prototype.dectcem =
Program.prototype.cnorm =
Program.prototype.cvvis =
Program.prototype.showCursor = function() {
  this.cursorHidden = false;
  // NOTE: In xterm terminfo:
  // cnorm stops blinking cursor
  // cvvis starts blinking cursor
  if (this.tput) return this.put.cnorm();
  //if (this.tput) return this.put.cvvis();
  // return this._write('\x1b[?12l\x1b[?25h'); // cursor_normal
  // return this._write('\x1b[?12;25h'); // cursor_visible
  return this.setMode('?25');
};

Program.prototype.alternate =
Program.prototype.smcup =
Program.prototype.alternateBuffer = function() {
  this.isAlt = true;
  if (this.tput) return this.put.smcup();
  if (this.term('vt') || this.term('linux')) return;
  this.setMode('?47');
  return this.setMode('?1049');
};

// CSI Pm l  Reset Mode (RM).
//     Ps = 2  -> Keyboard Action Mode (AM).
//     Ps = 4  -> Replace Mode (IRM).
//     Ps = 1 2  -> Send/receive (SRM).
//     Ps = 2 0  -> Normal Linefeed (LNM).
// CSI ? Pm l
//   DEC Private Mode Reset (DECRST).
//     Ps = 1  -> Normal Cursor Keys (DECCKM).
//     Ps = 2  -> Designate VT52 mode (DECANM).
//     Ps = 3  -> 80 Column Mode (DECCOLM).
//     Ps = 4  -> Jump (Fast) Scroll (DECSCLM).
//     Ps = 5  -> Normal Video (DECSCNM).
//     Ps = 6  -> Normal Cursor Mode (DECOM).
//     Ps = 7  -> No Wraparound Mode (DECAWM).
//     Ps = 8  -> No Auto-repeat Keys (DECARM).
//     Ps = 9  -> Don't send Mouse X & Y on button press.
//     Ps = 1 0  -> Hide toolbar (rxvt).
//     Ps = 1 2  -> Stop Blinking Cursor (att610).
//     Ps = 1 8  -> Don't print form feed (DECPFF).
//     Ps = 1 9  -> Limit print to scrolling region (DECPEX).
//     Ps = 2 5  -> Hide Cursor (DECTCEM).
//     Ps = 3 0  -> Don't show scrollbar (rxvt).
//     Ps = 3 5  -> Disable font-shifting functions (rxvt).
//     Ps = 4 0  -> Disallow 80 -> 132 Mode.
//     Ps = 4 1  -> No more(1) fix (see curses resource).
//     Ps = 4 2  -> Disable Nation Replacement Character sets (DEC-
//     NRCM).
//     Ps = 4 4  -> Turn Off Margin Bell.
//     Ps = 4 5  -> No Reverse-wraparound Mode.
//     Ps = 4 6  -> Stop Logging.  (This is normally disabled by a
//     compile-time option).
//     Ps = 4 7  -> Use Normal Screen Buffer.
//     Ps = 6 6  -> Numeric keypad (DECNKM).
//     Ps = 6 7  -> Backarrow key sends delete (DECBKM).
//     Ps = 1 0 0 0  -> Don't send Mouse X & Y on button press and
//     release.  See the section Mouse Tracking.
//     Ps = 1 0 0 1  -> Don't use Hilite Mouse Tracking.
//     Ps = 1 0 0 2  -> Don't use Cell Motion Mouse Tracking.
//     Ps = 1 0 0 3  -> Don't use All Motion Mouse Tracking.
//     Ps = 1 0 0 4  -> Don't send FocusIn/FocusOut events.
//     Ps = 1 0 0 5  -> Disable Extended Mouse Mode.
//     Ps = 1 0 1 0  -> Don't scroll to bottom on tty output
//     (rxvt).
//     Ps = 1 0 1 1  -> Don't scroll to bottom on key press (rxvt).
//     Ps = 1 0 3 4  -> Don't interpret "meta" key.  (This disables
//     the eightBitInput resource).
//     Ps = 1 0 3 5  -> Disable special modifiers for Alt and Num-
//     Lock keys.  (This disables the numLock resource).
//     Ps = 1 0 3 6  -> Don't send ESC  when Meta modifies a key.
//     (This disables the metaSendsEscape resource).
//     Ps = 1 0 3 7  -> Send VT220 Remove from the editing-keypad
//     Delete key.
//     Ps = 1 0 3 9  -> Don't send ESC  when Alt modifies a key.
//     (This disables the altSendsEscape resource).
//     Ps = 1 0 4 0  -> Do not keep selection when not highlighted.
//     (This disables the keepSelection resource).
//     Ps = 1 0 4 1  -> Use the PRIMARY selection.  (This disables
//     the selectToClipboard resource).
//     Ps = 1 0 4 2  -> Disable Urgency window manager hint when
//     Control-G is received.  (This disables the bellIsUrgent
//     resource).
//     Ps = 1 0 4 3  -> Disable raising of the window when Control-
//     G is received.  (This disables the popOnBell resource).
//     Ps = 1 0 4 7  -> Use Normal Screen Buffer, clearing screen
//     first if in the Alternate Screen.  (This may be disabled by
//     the titeInhibit resource).
//     Ps = 1 0 4 8  -> Restore cursor as in DECRC.  (This may be
//     disabled by the titeInhibit resource).
//     Ps = 1 0 4 9  -> Use Normal Screen Buffer and restore cursor
//     as in DECRC.  (This may be disabled by the titeInhibit
//     resource).  This combines the effects of the 1 0 4 7  and 1 0
//     4 8  modes.  Use this with terminfo-based applications rather
//     than the 4 7  mode.
//     Ps = 1 0 5 0  -> Reset terminfo/termcap function-key mode.
//     Ps = 1 0 5 1  -> Reset Sun function-key mode.
//     Ps = 1 0 5 2  -> Reset HP function-key mode.
//     Ps = 1 0 5 3  -> Reset SCO function-key mode.
//     Ps = 1 0 6 0  -> Reset legacy keyboard emulation (X11R6).
//     Ps = 1 0 6 1  -> Reset keyboard emulation to Sun/PC style.
//     Ps = 2 0 0 4  -> Reset bracketed paste mode.
Program.prototype.rm =
Program.prototype.resetMode = function() {
  var param = slice.call(arguments).join(';');
  return this._write('\x1b[' + (param || '') + 'l');
};

Program.prototype.decrst = function() {
  var param = slice.call(arguments).join(';');
  return this.resetMode('?' + param);
};

Program.prototype.dectcemh =
Program.prototype.cursor_invisible =
Program.prototype.vi =
Program.prototype.civis =
Program.prototype.hideCursor = function() {
  this.cursorHidden = true;
  if (this.tput) return this.put.civis();
  return this.resetMode('?25');
};

Program.prototype.rmcup =
Program.prototype.normalBuffer = function() {
  this.isAlt = false;
  if (this.tput) return this.put.rmcup();
  this.resetMode('?47');
  return this.resetMode('?1049');
};

Program.prototype.enableMouse = function() {
  if (process.env.BLESSED_FORCE_MODES) {
    var modes = process.env.BLESSED_FORCE_MODES.split(',');
    var options = {};
    for (var n = 0; n < modes.length; ++n) {
      var pair = modes[n].split('=');
      var v = pair[1] !== '0';
      switch (pair[0].toUpperCase()) {
        case 'SGRMOUSE':
          options.sgrMouse = v;
          break;
        case 'UTFMOUSE':
          options.utfMouse = v;
          break;
        case 'VT200MOUSE':
          options.vt200Mouse = v;
          break;
        case 'URXVTMOUSE':
          options.urxvtMouse = v;
          break;
        case 'X10MOUSE':
          options.x10Mouse = v;
          break;
        case 'DECMOUSE':
          options.decMouse = v;
          break;
        case 'PTERMMOUSE':
          options.ptermMouse = v;
          break;
        case 'JSBTERMMOUSE':
          options.jsbtermMouse = v;
          break;
        case 'VT200HILITE':
          options.vt200Hilite = v;
          break;
        case 'GPMMOUSE':
          options.gpmMouse = v;
          break;
        case 'CELLMOTION':
          options.cellMotion = v;
          break;
        case 'ALLMOTION':
          options.allMotion = v;
          break;
        case 'SENDFOCUS':
          options.sendFocus = v;
          break;
      }
    }
    return this.setMouse(options, true);
  }

  // NOTE:
  // Cell Motion isn't normally need for anything below here, but we'll
  // activate it for tmux (whether using it or not) in case our all-motion
  // passthrough does not work. It can't hurt.

  if (this.term('rxvt-unicode')) {
    return this.setMouse({
      urxvtMouse: true,
      cellMotion: true,
      allMotion: true
    }, true);
  }

  // rxvt does not support the X10 UTF extensions
  if (this.term('rxvt')) {
    return this.setMouse({
      vt200Mouse: true,
      x10Mouse: true,
      cellMotion: true,
      allMotion: true
    }, true);
  }

  // libvte is broken. Older versions do not support the
  // X10 UTF extension. However, later versions do support
  // SGR/URXVT.
  if (this.isVTE) {
    return this.setMouse({
      // NOTE: Could also use urxvtMouse here.
      sgrMouse: true,
      cellMotion: true,
      allMotion: true
    }, true);
  }

  if (this.term('linux')) {
    return this.setMouse({
      vt200Mouse: true,
      gpmMouse: true
    }, true);
  }

  if (this.term('xterm')
      || this.term('screen')
      || (this.tput && this.tput.strings.key_mouse)) {
    return this.setMouse({
      vt200Mouse: true,
      utfMouse: true,
      cellMotion: true,
      allMotion: true
    }, true);
  }
};

Program.prototype.disableMouse = function() {
  if (!this._currentMouse) return;

  var obj = {};

  Object.keys(this._currentMouse).forEach(function(key) {
    obj[key] = false;
  });

  return this.setMouse(obj, false);
};

// Set Mouse
Program.prototype.setMouse = function(opt, enable) {
  if (opt.normalMouse != null) {
    opt.vt200Mouse = opt.normalMouse;
    opt.allMotion = opt.normalMouse;
  }

  if (opt.hiliteTracking != null) {
    opt.vt200Hilite = opt.hiliteTracking;
  }

  if (enable === true) {
    if (this._currentMouse) {
      this.setMouse(opt);
      Object.keys(opt).forEach(function(key) {
        this._currentMouse[key] = opt[key];
      }, this);
      return;
    }
    this._currentMouse = opt;
    this.mouseEnabled = true;
  } else if (enable === false) {
    delete this._currentMouse;
    this.mouseEnabled = false;
  }

  //     Ps = 9  -> Send Mouse X & Y on button press.  See the sec-
  //     tion Mouse Tracking.
  //     Ps = 9  -> Don't send Mouse X & Y on button press.
  // x10 mouse
  if (opt.x10Mouse != null) {
    if (opt.x10Mouse) this.setMode('?9');
    else this.resetMode('?9');
  }

  //     Ps = 1 0 0 0  -> Send Mouse X & Y on button press and
  //     release.  See the section Mouse Tracking.
  //     Ps = 1 0 0 0  -> Don't send Mouse X & Y on button press and
  //     release.  See the section Mouse Tracking.
  // vt200 mouse
  if (opt.vt200Mouse != null) {
    if (opt.vt200Mouse) this.setMode('?1000');
    else this.resetMode('?1000');
  }

  //     Ps = 1 0 0 1  -> Use Hilite Mouse Tracking.
  //     Ps = 1 0 0 1  -> Don't use Hilite Mouse Tracking.
  if (opt.vt200Hilite != null) {
    if (opt.vt200Hilite) this.setMode('?1001');
    else this.resetMode('?1001');
  }

  //     Ps = 1 0 0 2  -> Use Cell Motion Mouse Tracking.
  //     Ps = 1 0 0 2  -> Don't use Cell Motion Mouse Tracking.
  // button event mouse
  if (opt.cellMotion != null) {
    if (opt.cellMotion) this.setMode('?1002');
    else this.resetMode('?1002');
  }

  //     Ps = 1 0 0 3  -> Use All Motion Mouse Tracking.
  //     Ps = 1 0 0 3  -> Don't use All Motion Mouse Tracking.
  // any event mouse
  if (opt.allMotion != null) {
    // NOTE: Latest versions of tmux seem to only support cellMotion (not
    // allMotion). We pass all motion through to the terminal.
    if (this.tmux && this.tmuxVersion >= 2) {
      if (opt.allMotion) this._twrite('\x1b[?1003h');
      else this._twrite('\x1b[?1003l');
    } else {
      if (opt.allMotion) this.setMode('?1003');
      else this.resetMode('?1003');
    }
  }

  //     Ps = 1 0 0 4  -> Send FocusIn/FocusOut events.
  //     Ps = 1 0 0 4  -> Don't send FocusIn/FocusOut events.
  if (opt.sendFocus != null) {
    if (opt.sendFocus) this.setMode('?1004');
    else this.resetMode('?1004');
  }

  //     Ps = 1 0 0 5  -> Enable Extended Mouse Mode.
  //     Ps = 1 0 0 5  -> Disable Extended Mouse Mode.
  if (opt.utfMouse != null) {
    if (opt.utfMouse) this.setMode('?1005');
    else this.resetMode('?1005');
  }

  // sgr mouse
  if (opt.sgrMouse != null) {
    if (opt.sgrMouse) this.setMode('?1006');
    else this.resetMode('?1006');
  }

  // urxvt mouse
  if (opt.urxvtMouse != null) {
    if (opt.urxvtMouse) this.setMode('?1015');
    else this.resetMode('?1015');
  }

  // dec mouse
  if (opt.decMouse != null) {
    if (opt.decMouse) this._write('\x1b[1;2\'z\x1b[1;3\'{');
    else this._write('\x1b[\'z');
  }

  // pterm mouse
  if (opt.ptermMouse != null) {
    if (opt.ptermMouse) this._write('\x1b[>1h\x1b[>6h\x1b[>7h\x1b[>1h\x1b[>9l');
    else this._write('\x1b[>1l\x1b[>6l\x1b[>7l\x1b[>1l\x1b[>9h');
  }

  // jsbterm mouse
  if (opt.jsbtermMouse != null) {
    // + = advanced mode
    if (opt.jsbtermMouse) this._write('\x1b[0~ZwLMRK+1Q\x1b\\');
    else this._write('\x1b[0~ZwQ\x1b\\');
  }

  // gpm mouse
  if (opt.gpmMouse != null) {
    if (opt.gpmMouse) this.enableGpm();
    else this.disableGpm();
  }
};

// CSI Ps ; Ps r
//   Set Scrolling Region [top;bottom] (default = full size of win-
//   dow) (DECSTBM).
// CSI ? Pm r
Program.prototype.decstbm =
Program.prototype.csr =
Program.prototype.setScrollRegion = function(top, bottom) {
  if (!this.zero) {
    top = (top || 1) - 1;
    bottom = (bottom || this.rows) - 1;
  } else {
    top = top || 0;
    bottom = bottom || (this.rows - 1);
  }
  this.scrollTop = top;
  this.scrollBottom = bottom;
  this.x = 0;
  this.y = 0;
  this._ncoords();
  if (this.tput) return this.put.csr(top, bottom);
  return this._write('\x1b[' + (top + 1) + ';' + (bottom + 1) + 'r');
};

// CSI s
//   Save cursor (ANSI.SYS).
Program.prototype.scA =
Program.prototype.saveCursorA = function() {
  this.savedX = this.x;
  this.savedY = this.y;
  if (this.tput) return this.put.sc();
  return this._write('\x1b[s');
};

// CSI u
//   Restore cursor (ANSI.SYS).
Program.prototype.rcA =
Program.prototype.restoreCursorA = function() {
  this.x = this.savedX || 0;
  this.y = this.savedY || 0;
  if (this.tput) return this.put.rc();
  return this._write('\x1b[u');
};

/**
 * Lesser Used
 */

// CSI Ps I
//   Cursor Forward Tabulation Ps tab stops (default = 1) (CHT).
Program.prototype.cht =
Program.prototype.cursorForwardTab = function(param) {
  this.x += 8;
  this._ncoords();
  if (this.tput) return this.put.tab(param);
  return this._write('\x1b[' + (param || 1) + 'I');
};

// CSI Ps S  Scroll up Ps lines (default = 1) (SU).
Program.prototype.su =
Program.prototype.scrollUp = function(param) {
  this.y -= param || 1;
  this._ncoords();
  if (this.tput) return this.put.parm_index(param);
  return this._write('\x1b[' + (param || 1) + 'S');
};

// CSI Ps T  Scroll down Ps lines (default = 1) (SD).
Program.prototype.sd =
Program.prototype.scrollDown = function(param) {
  this.y += param || 1;
  this._ncoords();
  if (this.tput) return this.put.parm_rindex(param);
  return this._write('\x1b[' + (param || 1) + 'T');
};

// CSI Ps ; Ps ; Ps ; Ps ; Ps T
//   Initiate highlight mouse tracking.  Parameters are
//   [func;startx;starty;firstrow;lastrow].  See the section Mouse
//   Tracking.
Program.prototype.initMouseTracking = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + 'T');
};

// CSI > Ps; Ps T
//   Reset one or more features of the title modes to the default
//   value.  Normally, "reset" disables the feature.  It is possi-
//   ble to disable the ability to reset features by compiling a
//   different default for the title modes into xterm.
//     Ps = 0  -> Do not set window/icon labels using hexadecimal.
//     Ps = 1  -> Do not query window/icon labels using hexadeci-
//     mal.
//     Ps = 2  -> Do not set window/icon labels using UTF-8.
//     Ps = 3  -> Do not query window/icon labels using UTF-8.
//   (See discussion of "Title Modes").
Program.prototype.resetTitleModes = function() {
  return this._write('\x1b[>' + slice.call(arguments).join(';') + 'T');
};

// CSI Ps Z  Cursor Backward Tabulation Ps tab stops (default = 1) (CBT).
Program.prototype.cbt =
Program.prototype.cursorBackwardTab = function(param) {
  this.x -= 8;
  this._ncoords();
  if (this.tput) return this.put.cbt(param);
  return this._write('\x1b[' + (param || 1) + 'Z');
};

// CSI Ps b  Repeat the preceding graphic character Ps times (REP).
Program.prototype.rep =
Program.prototype.repeatPrecedingCharacter = function(param) {
  this.x += param || 1;
  this._ncoords();
  if (this.tput) return this.put.rep(param);
  return this._write('\x1b[' + (param || 1) + 'b');
};

// CSI Ps g  Tab Clear (TBC).
//     Ps = 0  -> Clear Current Column (default).
//     Ps = 3  -> Clear All.
// Potentially:
//   Ps = 2  -> Clear Stops on Line.
//   http://vt100.net/annarbor/aaa-ug/section6.html
Program.prototype.tbc =
Program.prototype.tabClear = function(param) {
  if (this.tput) return this.put.tbc(param);
  return this._write('\x1b[' + (param || 0) + 'g');
};

// CSI Pm i  Media Copy (MC).
//     Ps = 0  -> Print screen (default).
//     Ps = 4  -> Turn off printer controller mode.
//     Ps = 5  -> Turn on printer controller mode.
// CSI ? Pm i
//   Media Copy (MC, DEC-specific).
//     Ps = 1  -> Print line containing cursor.
//     Ps = 4  -> Turn off autoprint mode.
//     Ps = 5  -> Turn on autoprint mode.
//     Ps = 1  0  -> Print composed display, ignores DECPEX.
//     Ps = 1  1  -> Print all pages.
Program.prototype.mc =
Program.prototype.mediaCopy = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + 'i');
};

Program.prototype.print_screen =
Program.prototype.ps =
Program.prototype.mc0 = function() {
  if (this.tput) return this.put.mc0();
  return this.mc('0');
};

Program.prototype.prtr_on =
Program.prototype.po =
Program.prototype.mc5 = function() {
  if (this.tput) return this.put.mc5();
  return this.mc('5');
};

Program.prototype.prtr_off =
Program.prototype.pf =
Program.prototype.mc4 = function() {
  if (this.tput) return this.put.mc4();
  return this.mc('4');
};

Program.prototype.prtr_non =
Program.prototype.pO =
Program.prototype.mc5p = function() {
  if (this.tput) return this.put.mc5p();
  return this.mc('?5');
};

// CSI > Ps; Ps m
//   Set or reset resource-values used by xterm to decide whether
//   to construct escape sequences holding information about the
//   modifiers pressed with a given key.  The first parameter iden-
//   tifies the resource to set/reset.  The second parameter is the
//   value to assign to the resource.  If the second parameter is
//   omitted, the resource is reset to its initial value.
//     Ps = 1  -> modifyCursorKeys.
//     Ps = 2  -> modifyFunctionKeys.
//     Ps = 4  -> modifyOtherKeys.
//   If no parameters are given, all resources are reset to their
//   initial values.
Program.prototype.setResources = function() {
  return this._write('\x1b[>' + slice.call(arguments).join(';') + 'm');
};

// CSI > Ps n
//   Disable modifiers which may be enabled via the CSI > Ps; Ps m
//   sequence.  This corresponds to a resource value of "-1", which
//   cannot be set with the other sequence.  The parameter identi-
//   fies the resource to be disabled:
//     Ps = 1  -> modifyCursorKeys.
//     Ps = 2  -> modifyFunctionKeys.
//     Ps = 4  -> modifyOtherKeys.
//   If the parameter is omitted, modifyFunctionKeys is disabled.
//   When modifyFunctionKeys is disabled, xterm uses the modifier
//   keys to make an extended sequence of functions rather than
//   adding a parameter to each function key to denote the modi-
//   fiers.
Program.prototype.disableModifiers = function(param) {
  return this._write('\x1b[>' + (param || '') + 'n');
};

// CSI > Ps p
//   Set resource value pointerMode.  This is used by xterm to
//   decide whether to hide the pointer cursor as the user types.
//   Valid values for the parameter:
//     Ps = 0  -> never hide the pointer.
//     Ps = 1  -> hide if the mouse tracking mode is not enabled.
//     Ps = 2  -> always hide the pointer.  If no parameter is
//     given, xterm uses the default, which is 1 .
Program.prototype.setPointerMode = function(param) {
  return this._write('\x1b[>' + (param || '') + 'p');
};

// CSI ! p   Soft terminal reset (DECSTR).
// http://vt100.net/docs/vt220-rm/table4-10.html
Program.prototype.decstr =
Program.prototype.rs2 =
Program.prototype.softReset = function() {
  //if (this.tput) return this.put.init_2string();
  //if (this.tput) return this.put.reset_2string();
  if (this.tput) return this.put.rs2();
  //return this._write('\x1b[!p');
  //return this._write('\x1b[!p\x1b[?3;4l\x1b[4l\x1b>'); // init
  return this._write('\x1b[!p\x1b[?3;4l\x1b[4l\x1b>'); // reset
};

// CSI Ps$ p
//   Request ANSI mode (DECRQM).  For VT300 and up, reply is
//     CSI Ps; Pm$ y
//   where Ps is the mode number as in RM, and Pm is the mode
//   value:
//     0 - not recognized
//     1 - set
//     2 - reset
//     3 - permanently set
//     4 - permanently reset
Program.prototype.decrqm =
Program.prototype.requestAnsiMode = function(param) {
  return this._write('\x1b[' + (param || '') + '$p');
};

// CSI ? Ps$ p
//   Request DEC private mode (DECRQM).  For VT300 and up, reply is
//     CSI ? Ps; Pm$ p
//   where Ps is the mode number as in DECSET, Pm is the mode value
//   as in the ANSI DECRQM.
Program.prototype.decrqmp =
Program.prototype.requestPrivateMode = function(param) {
  return this._write('\x1b[?' + (param || '') + '$p');
};

// CSI Ps ; Ps " p
//   Set conformance level (DECSCL).  Valid values for the first
//   parameter:
//     Ps = 6 1  -> VT100.
//     Ps = 6 2  -> VT200.
//     Ps = 6 3  -> VT300.
//   Valid values for the second parameter:
//     Ps = 0  -> 8-bit controls.
//     Ps = 1  -> 7-bit controls (always set for VT100).
//     Ps = 2  -> 8-bit controls.
Program.prototype.decscl =
Program.prototype.setConformanceLevel = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '"p');
};

// CSI Ps q  Load LEDs (DECLL).
//     Ps = 0  -> Clear all LEDS (default).
//     Ps = 1  -> Light Num Lock.
//     Ps = 2  -> Light Caps Lock.
//     Ps = 3  -> Light Scroll Lock.
//     Ps = 2  1  -> Extinguish Num Lock.
//     Ps = 2  2  -> Extinguish Caps Lock.
//     Ps = 2  3  -> Extinguish Scroll Lock.
Program.prototype.decll =
Program.prototype.loadLEDs = function(param) {
  return this._write('\x1b[' + (param || '') + 'q');
};

// CSI Ps SP q
//   Set cursor style (DECSCUSR, VT520).
//     Ps = 0  -> blinking block.
//     Ps = 1  -> blinking block (default).
//     Ps = 2  -> steady block.
//     Ps = 3  -> blinking underline.
//     Ps = 4  -> steady underline.
Program.prototype.decscusr =
Program.prototype.setCursorStyle = function(param) {
  switch (param) {
    case 'blinking block':
      param = 1;
      break;
    case 'block':
    case 'steady block':
      param = 2;
      break;
    case 'blinking underline':
      param = 3;
      break;
    case 'underline':
    case 'steady underline':
      param = 4;
      break;
    case 'blinking bar':
      param = 5;
      break;
    case 'bar':
    case 'steady bar':
      param = 6;
      break;
  }
  if (param === 2 && this.has('Se')) {
    return this.put.Se();
  }
  if (this.has('Ss')) {
    return this.put.Ss(param);
  }
  return this._write('\x1b[' + (param || 1) + ' q');
};

// CSI Ps " q
//   Select character protection attribute (DECSCA).  Valid values
//   for the parameter:
//     Ps = 0  -> DECSED and DECSEL can erase (default).
//     Ps = 1  -> DECSED and DECSEL cannot erase.
//     Ps = 2  -> DECSED and DECSEL can erase.
Program.prototype.decsca =
Program.prototype.setCharProtectionAttr = function(param) {
  return this._write('\x1b[' + (param || 0) + '"q');
};

// CSI ? Pm r
//   Restore DEC Private Mode Values.  The value of Ps previously
//   saved is restored.  Ps values are the same as for DECSET.
Program.prototype.restorePrivateValues = function() {
  return this._write('\x1b[?' + slice.call(arguments).join(';') + 'r');
};

// CSI Pt; Pl; Pb; Pr; Ps$ r
//   Change Attributes in Rectangular Area (DECCARA), VT400 and up.
//     Pt; Pl; Pb; Pr denotes the rectangle.
//     Ps denotes the SGR attributes to change: 0, 1, 4, 5, 7.
// NOTE: xterm doesn't enable this code by default.
Program.prototype.deccara =
Program.prototype.setAttrInRectangle = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '$r');
};

// CSI ? Pm s
//   Save DEC Private Mode Values.  Ps values are the same as for
//   DECSET.
Program.prototype.savePrivateValues = function() {
  return this._write('\x1b[?' + slice.call(arguments).join(';') + 's');
};

// CSI Ps ; Ps ; Ps t
//   Window manipulation (from dtterm, as well as extensions).
//   These controls may be disabled using the allowWindowOps
//   resource.  Valid values for the first (and any additional
//   parameters) are:
//     Ps = 1  -> De-iconify window.
//     Ps = 2  -> Iconify window.
//     Ps = 3  ;  x ;  y -> Move window to [x, y].
//     Ps = 4  ;  height ;  width -> Resize the xterm window to
//     height and width in pixels.
//     Ps = 5  -> Raise the xterm window to the front of the stack-
//     ing order.
//     Ps = 6  -> Lower the xterm window to the bottom of the
//     stacking order.
//     Ps = 7  -> Refresh the xterm window.
//     Ps = 8  ;  height ;  width -> Resize the text area to
//     [height;width] in characters.
//     Ps = 9  ;  0  -> Restore maximized window.
//     Ps = 9  ;  1  -> Maximize window (i.e., resize to screen
//     size).
//     Ps = 1 0  ;  0  -> Undo full-screen mode.
//     Ps = 1 0  ;  1  -> Change to full-screen.
//     Ps = 1 1  -> Report xterm window state.  If the xterm window
//     is open (non-iconified), it returns CSI 1 t .  If the xterm
//     window is iconified, it returns CSI 2 t .
//     Ps = 1 3  -> Report xterm window position.  Result is CSI 3
//     ; x ; y t
//     Ps = 1 4  -> Report xterm window in pixels.  Result is CSI
//     4  ;  height ;  width t
//     Ps = 1 8  -> Report the size of the text area in characters.
//     Result is CSI  8  ;  height ;  width t
//     Ps = 1 9  -> Report the size of the screen in characters.
//     Result is CSI  9  ;  height ;  width t
//     Ps = 2 0  -> Report xterm window's icon label.  Result is
//     OSC  L  label ST
//     Ps = 2 1  -> Report xterm window's title.  Result is OSC  l
//     label ST
//     Ps = 2 2  ;  0  -> Save xterm icon and window title on
//     stack.
//     Ps = 2 2  ;  1  -> Save xterm icon title on stack.
//     Ps = 2 2  ;  2  -> Save xterm window title on stack.
//     Ps = 2 3  ;  0  -> Restore xterm icon and window title from
//     stack.
//     Ps = 2 3  ;  1  -> Restore xterm icon title from stack.
//     Ps = 2 3  ;  2  -> Restore xterm window title from stack.
//     Ps >= 2 4  -> Resize to Ps lines (DECSLPP).
Program.prototype.manipulateWindow = function() {
  var args = slice.call(arguments);

  var callback = typeof args[args.length - 1] === 'function'
    ? args.pop()
    : function() {};

  return this.response('window-manipulation',
    '\x1b[' + args.join(';') + 't', callback);
};

Program.prototype.getWindowSize = function(callback) {
  return this.manipulateWindow(18, callback);
};

// CSI Pt; Pl; Pb; Pr; Ps$ t
//   Reverse Attributes in Rectangular Area (DECRARA), VT400 and
//   up.
//     Pt; Pl; Pb; Pr denotes the rectangle.
//     Ps denotes the attributes to reverse, i.e.,  1, 4, 5, 7.
// NOTE: xterm doesn't enable this code by default.
Program.prototype.decrara =
Program.prototype.reverseAttrInRectangle = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '$t');
};

// CSI > Ps; Ps t
//   Set one or more features of the title modes.  Each parameter
//   enables a single feature.
//     Ps = 0  -> Set window/icon labels using hexadecimal.
//     Ps = 1  -> Query window/icon labels using hexadecimal.
//     Ps = 2  -> Set window/icon labels using UTF-8.
//     Ps = 3  -> Query window/icon labels using UTF-8.  (See dis-
//     cussion of "Title Modes")
// XXX VTE bizarelly echos this:
Program.prototype.setTitleModeFeature = function() {
  return this._twrite('\x1b[>' + slice.call(arguments).join(';') + 't');
};

// CSI Ps SP t
//   Set warning-bell volume (DECSWBV, VT520).
//     Ps = 0  or 1  -> off.
//     Ps = 2 , 3  or 4  -> low.
//     Ps = 5 , 6 , 7 , or 8  -> high.
Program.prototype.decswbv =
Program.prototype.setWarningBellVolume = function(param) {
  return this._write('\x1b[' + (param || '') + ' t');
};

// CSI Ps SP u
//   Set margin-bell volume (DECSMBV, VT520).
//     Ps = 1  -> off.
//     Ps = 2 , 3  or 4  -> low.
//     Ps = 0 , 5 , 6 , 7 , or 8  -> high.
Program.prototype.decsmbv =
Program.prototype.setMarginBellVolume = function(param) {
  return this._write('\x1b[' + (param || '') + ' u');
};

// CSI Pt; Pl; Pb; Pr; Pp; Pt; Pl; Pp$ v
//   Copy Rectangular Area (DECCRA, VT400 and up).
//     Pt; Pl; Pb; Pr denotes the rectangle.
//     Pp denotes the source page.
//     Pt; Pl denotes the target location.
//     Pp denotes the target page.
// NOTE: xterm doesn't enable this code by default.
Program.prototype.deccra =
Program.prototype.copyRectangle = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '$v');
};

// CSI Pt ; Pl ; Pb ; Pr ' w
//   Enable Filter Rectangle (DECEFR), VT420 and up.
//   Parameters are [top;left;bottom;right].
//   Defines the coordinates of a filter rectangle and activates
//   it.  Anytime the locator is detected outside of the filter
//   rectangle, an outside rectangle event is generated and the
//   rectangle is disabled.  Filter rectangles are always treated
//   as "one-shot" events.  Any parameters that are omitted default
//   to the current locator position.  If all parameters are omit-
//   ted, any locator motion will be reported.  DECELR always can-
//   cels any prevous rectangle definition.
Program.prototype.decefr =
Program.prototype.enableFilterRectangle = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '\'w');
};

// CSI Ps x  Request Terminal Parameters (DECREQTPARM).
//   if Ps is a "0" (default) or "1", and xterm is emulating VT100,
//   the control sequence elicits a response of the same form whose
//   parameters describe the terminal:
//     Ps -> the given Ps incremented by 2.
//     Pn = 1  <- no parity.
//     Pn = 1  <- eight bits.
//     Pn = 1  <- 2  8  transmit 38.4k baud.
//     Pn = 1  <- 2  8  receive 38.4k baud.
//     Pn = 1  <- clock multiplier.
//     Pn = 0  <- STP flags.
Program.prototype.decreqtparm =
Program.prototype.requestParameters = function(param) {
  return this._write('\x1b[' + (param || 0) + 'x');
};

// CSI Ps x  Select Attribute Change Extent (DECSACE).
//     Ps = 0  -> from start to end position, wrapped.
//     Ps = 1  -> from start to end position, wrapped.
//     Ps = 2  -> rectangle (exact).
Program.prototype.decsace =
Program.prototype.selectChangeExtent = function(param) {
  return this._write('\x1b[' + (param || 0) + 'x');
};

// CSI Pc; Pt; Pl; Pb; Pr$ x
//   Fill Rectangular Area (DECFRA), VT420 and up.
//     Pc is the character to use.
//     Pt; Pl; Pb; Pr denotes the rectangle.
// NOTE: xterm doesn't enable this code by default.
Program.prototype.decfra =
Program.prototype.fillRectangle = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '$x');
};

// CSI Ps ; Pu ' z
//   Enable Locator Reporting (DECELR).
//   Valid values for the first parameter:
//     Ps = 0  -> Locator disabled (default).
//     Ps = 1  -> Locator enabled.
//     Ps = 2  -> Locator enabled for one report, then disabled.
//   The second parameter specifies the coordinate unit for locator
//   reports.
//   Valid values for the second parameter:
//     Pu = 0  <- or omitted -> default to character cells.
//     Pu = 1  <- device physical pixels.
//     Pu = 2  <- character cells.
Program.prototype.decelr =
Program.prototype.enableLocatorReporting = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '\'z');
};

// CSI Pt; Pl; Pb; Pr$ z
//   Erase Rectangular Area (DECERA), VT400 and up.
//     Pt; Pl; Pb; Pr denotes the rectangle.
// NOTE: xterm doesn't enable this code by default.
Program.prototype.decera =
Program.prototype.eraseRectangle = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '$z');
};

// CSI Pm ' {
//   Select Locator Events (DECSLE).
//   Valid values for the first (and any additional parameters)
//   are:
//     Ps = 0  -> only respond to explicit host requests (DECRQLP).
//                (This is default).  It also cancels any filter
//   rectangle.
//     Ps = 1  -> report button down transitions.
//     Ps = 2  -> do not report button down transitions.
//     Ps = 3  -> report button up transitions.
//     Ps = 4  -> do not report button up transitions.
Program.prototype.decsle =
Program.prototype.setLocatorEvents = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '\'{');
};

// CSI Pt; Pl; Pb; Pr$ {
//   Selective Erase Rectangular Area (DECSERA), VT400 and up.
//     Pt; Pl; Pb; Pr denotes the rectangle.
Program.prototype.decsera =
Program.prototype.selectiveEraseRectangle = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + '${');
};

// CSI Ps ' |
//   Request Locator Position (DECRQLP).
//   Valid values for the parameter are:
//     Ps = 0 , 1 or omitted -> transmit a single DECLRP locator
//     report.

//   If Locator Reporting has been enabled by a DECELR, xterm will
//   respond with a DECLRP Locator Report.  This report is also
//   generated on button up and down events if they have been
//   enabled with a DECSLE, or when the locator is detected outside
//   of a filter rectangle, if filter rectangles have been enabled
//   with a DECEFR.

//     -> CSI Pe ; Pb ; Pr ; Pc ; Pp &  w

//   Parameters are [event;button;row;column;page].
//   Valid values for the event:
//     Pe = 0  -> locator unavailable - no other parameters sent.
//     Pe = 1  -> request - xterm received a DECRQLP.
//     Pe = 2  -> left button down.
//     Pe = 3  -> left button up.
//     Pe = 4  -> middle button down.
//     Pe = 5  -> middle button up.
//     Pe = 6  -> right button down.
//     Pe = 7  -> right button up.
//     Pe = 8  -> M4 button down.
//     Pe = 9  -> M4 button up.
//     Pe = 1 0  -> locator outside filter rectangle.
//   ``button'' parameter is a bitmask indicating which buttons are
//     pressed:
//     Pb = 0  <- no buttons down.
//     Pb & 1  <- right button down.
//     Pb & 2  <- middle button down.
//     Pb & 4  <- left button down.
//     Pb & 8  <- M4 button down.
//   ``row'' and ``column'' parameters are the coordinates of the
//     locator position in the xterm window, encoded as ASCII deci-
//     mal.
//   The ``page'' parameter is not used by xterm, and will be omit-
//   ted.
Program.prototype.decrqlp =
Program.prototype.req_mouse_pos =
Program.prototype.reqmp =
Program.prototype.requestLocatorPosition = function(param, callback) {
  // See also:
  // get_mouse / getm / Gm
  // mouse_info / minfo / Mi
  // Correct for tput?
  if (this.has('req_mouse_pos')) {
    var code = this.tput.req_mouse_pos(param);
    return this.response('locator-position', code, callback);
  }
  return this.response('locator-position',
    '\x1b[' + (param || '') + '\'|', callback);
};

// CSI P m SP }
// Insert P s Column(s) (default = 1) (DECIC), VT420 and up.
// NOTE: xterm doesn't enable this code by default.
Program.prototype.decic =
Program.prototype.insertColumns = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + ' }');
};

// CSI P m SP ~
// Delete P s Column(s) (default = 1) (DECDC), VT420 and up
// NOTE: xterm doesn't enable this code by default.
Program.prototype.decdc =
Program.prototype.deleteColumns = function() {
  return this._write('\x1b[' + slice.call(arguments).join(';') + ' ~');
};

Program.prototype.out = function(name) {
  var args = Array.prototype.slice.call(arguments, 1);
  this.ret = true;
  var out = this[name].apply(this, args);
  this.ret = false;
  return out;
};

Program.prototype.sigtstp = function(callback) {
  var resume = this.pause();

  process.once('SIGCONT', function() {
    resume();
    if (callback) callback();
  });

  process.kill(process.pid, 'SIGTSTP');
};

Program.prototype.pause = function(callback) {
  var self = this
    , isAlt = this.isAlt
    , mouseEnabled = this.mouseEnabled;

  this.lsaveCursor('pause');
  //this.csr(0, screen.height - 1);
  if (isAlt) this.normalBuffer();
  this.showCursor();
  if (mouseEnabled) this.disableMouse();

  var write = this.output.write;
  this.output.write = function() {};
  if (this.input.setRawMode) {
    this.input.setRawMode(false);
  }
  this.input.pause();

  return this._resume = function() {
    delete self._resume;

    if (self.input.setRawMode) {
      self.input.setRawMode(true);
    }
    self.input.resume();
    self.output.write = write;

    if (isAlt) self.alternateBuffer();
    //self.csr(0, screen.height - 1);
    if (mouseEnabled) self.enableMouse();
    self.lrestoreCursor('pause', true);

    if (callback) callback();
  };
};

Program.prototype.resume = function() {
  if (this._resume) return this._resume();
};

/**
 * Helpers
 */

// We could do this easier by just manipulating the _events object, or for
// older versions of node, manipulating the array returned by listeners(), but
// neither of these methods are guaranteed to work in future versions of node.
function unshiftEvent(obj, event, listener) {
  var listeners;
  if (obj.listeners) {
    listeners = obj.listeners(event);
    obj.removeAllListeners(event);
    obj.on(event, listener);
    listeners.forEach(function(listener) {
      obj.on(event, listener);
    });
  } else {
    if (obj == process) process.on(event,listener);  
  }
}

function merge(out) {
  slice.call(arguments, 1).forEach(function(obj) {
    Object.keys(obj).forEach(function(key) {
      out[key] = obj[key];
    });
  });
  return out;
}

/**
 * Expose
 */

module.exports = Program;
};
BundleModuleCode['os/events']=function (module,exports,global,process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

// listenerCount isn't in node 0.10, so here's a basic polyfill
EventEmitter._listenerCount = function (ee, event) {
  var listeners = ee && ee._events && ee._events[event]
  if (Array.isArray(listeners)) {
    return listeners.length
  } else if (typeof listeners === 'function') {
    return 1
  } else {
    return 0
  }
}

EventEmitter.listenerCount = function(emitter, type) {
  if (emitter.listenerCount == undefined) return EventEmitter._listenerCount(emitter,type)
  else
    return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}
};
BundleModuleCode['os/string_decoder']=function (module,exports,global,process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  this.charBuffer = new Buffer(6);
  this.charReceived = 0;
  this.charLength = 0;
};


StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  var offset = 0;

  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var i = (buffer.length >= this.charLength - this.charReceived) ?
                this.charLength - this.charReceived :
                buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, offset, i);
    this.charReceived += (i - offset);
    offset = i;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (i == buffer.length) return charStr;

    // otherwise cut off the characters end from the beginning of this buffer
    buffer = buffer.slice(i, buffer.length);
    break;
  }

  var lenIncomplete = this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - lenIncomplete, end);
    this.charReceived = lenIncomplete;
    end -= lenIncomplete;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    this.charBuffer.write(charStr.charAt(charStr.length - 1), this.encoding);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }

  return i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 2;
  this.charLength = incomplete ? 2 : 0;
  return incomplete;
}

function base64DetectIncompleteChar(buffer) {
  var incomplete = this.charReceived = buffer.length % 3;
  this.charLength = incomplete ? 3 : 0;
  return incomplete;
}
};
BundleModuleCode['term/tput']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse 
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors (MIT License)
 **    $REVESIO:     1.1.5
 **
 **    $INFO:
 *
 * tput.js - parse and compile terminfo caps to javascript.
 * Modification: Embedded file support.
 *
 *     $ENDINFO
 */

// Resources:
//   $ man term
//   $ man terminfo
//   http://invisible-island.net/ncurses/man/term.5.html
//   https://en.wikipedia.org/wiki/Terminfo

// Todo:
// - xterm's XT (set-title capability?) value should
//   be true (at least tmux thinks it should).
//   It's not parsed as true. Investigate.
// - Possibly switch to other method of finding the
//   extended data string table: i += h.symOffsetCount * 2;

/**
 * Modules
 */

var assert = Require('assert')
  , path = Require('path')
  , fs = Require('fs')
  , cp = Require('child_process');

/**
 * Tput
 */

FileEmbedd('term/def/xterm');
FileEmbedd('term/def/windows-ansi');

function Tput(options) {
  if (!(this instanceof Tput)) {
    return new Tput(options);
  }

  options = options || {};
  if (typeof options === 'string') {
    options = { terminal: options };
  }

  this.options = options;
  this.terminal = options.terminal
    || options.term
    || process.env.TERM
    || (process.platform === 'win32' ? 'windows-ansi' : 'xterm');

  this.terminal = this.terminal.toLowerCase();

  this.debug = options.debug;
  this.padding = options.padding;
  this.extended = options.extended;
  this.printf = options.printf;
  this.termcap = options.termcap;
  this.error = null;

  this.terminfoPrefix = options.terminfoPrefix;
  this.terminfoFile = options.terminfoFile;
  this.termcapFile = options.termcapFile;

  if (options.terminal || options.term) {
    this.setup();
  }
}

Tput.prototype.setup = function() {
  this.error = null;
  try {
    if (this.termcap) {
      try {
        this.injectTermcap();
      } catch (e) {
        if (this.debug) throw e;
        this.error = new Error('Termcap parse error.');
        this._useInternalCap(this.terminal);
      }
    } else {
      try {
        this.injectTerminfo();
      } catch (e) {
        if (this.debug) throw e;
        this.error = new Error('Terminfo parse error.');
        this._useInternalInfo(this.terminal);
      }
    }
  } catch (e) {
    // If there was an error, fallback
    // to an internally stored terminfo/cap.
    if (this.debug) throw e;
    this.error = new Error('Terminfo not found.');
    this._useXtermInfo();
  }
};

Tput.prototype.term = function(is) {
  return this.terminal.indexOf(is) === 0;
};

Tput.prototype._debug = function() {
  if (!this.debug) return;
  return console.log.apply(console, arguments);
};

/**
 * Fallback
 */

Tput.prototype._useVt102Cap = function() {
  return this.injectTermcap('vt102');
};

Tput.prototype._useXtermCap = function() {
  return this.injectTermcap('term/def/xterm.termcap');
};

Tput.prototype._useXtermInfo = function() {
  return this.injectTerminfo('term/def/xterm');
};

Tput.prototype._useInternalInfo = function(name) {
  name = path.basename(name);
  return this.injectTerminfo('term/def/' + name);
};

Tput.prototype._useInternalCap = function(name) {
  name = path.basename(name);
  return this.injectTermcap('term/def/' + name + '.termcap');
};

/**
 * Terminfo
 */

Tput.ipaths = [
  __dirname+'/..',
  process.env.TERMINFO || '',
  (process.env.TERMINFO_DIRS || '').split(':'),
  (process.env.HOME || '') + '/.terminfo',
  '/usr/share/terminfo',
  '/usr/share/lib/terminfo',
  '/usr/lib/terminfo',
  '/usr/local/share/terminfo',
  '/usr/local/share/lib/terminfo',
  '/usr/local/lib/terminfo',
  '/usr/local/ncurses/lib/terminfo',
  '/lib/terminfo'
];

Tput.prototype.readTerminfo = function(term) {
  var data
    , file
    , info;

  term = term || this.terminal;
  try {data = FileEmbedded(term);} catch (e) {};
  if (!data) {
    file = path.normalize(this._prefix(term));
    console.log('Reading '+file);
    data = fs.readFileSync(file);
  } else file=term;
  info = this.parseTerminfo(data, file);

  if (this.debug) {
    this._terminfo = info;
  }

  return info;
};

Tput._prefix =
Tput.prototype._prefix = function(term) {
  // If we have a terminfoFile, or our
  // term looks like a filename, use it.
  if (term) {
    if (term.indexOf(path.sep)==0) {
      return term;
    }
    if (this.terminfoFile) {
      return this.terminfoFile;
    }
  }
  var paths = Tput.ipaths.slice()
    , file;

  if (this.terminfoPrefix) {
    paths.unshift(this.terminfoPrefix);
  }


  // Try exact matches.
  file = this._tprefix(paths, term);
  if (file) return file;

  // Try similar matches.
  file = this._tprefix(paths, term, true);
  if (file) return file;

  // Not found.
  throw new Error('Terminfo directory not found.');
};

Tput._tprefix =
Tput.prototype._tprefix = function(prefix, term, soft) {
  if (!prefix) return;

  var file
    , dir
    , i
    , sdiff
    , sfile
    , list;


  try {
      file=prefix+'/'+term;
      fs.statSync(file);
      return file;
  } catch (e) {
      ;
  }

  if (Array.isArray(prefix)) {
    for (i = 0; i < prefix.length; i++) {
      file = this._tprefix(prefix[i], term, soft);
      if (file) return file;
    }
    return;
  }

  var find = function(word) {
    var file, ch;

    file = path.resolve(prefix, word[0]);
    
    try {
      fs.statSync(file);
      return file;
    } catch (e) {
      ;
    }

    ch = word[0].charCodeAt(0).toString(16);
    if (ch.length < 2) ch = '0' + ch;

    file = path.resolve(prefix, ch);

    try {
      fs.statSync(file);
      return file;
    } catch (e) {
      ;
    }
  };

  if (!term) {
    // Make sure the directory's sub-directories
    // are all one-letter, or hex digits.
    // return find('x') ? prefix : null;
    try {
      dir = fs.readdirSync(prefix).filter(function(file) {
        return file.length !== 1 && !/^[0-9a-fA-F]{2}$/.test(file);
      });
      if (!dir.length) {
        return prefix;
      }
    } catch (e) {
      ;
    }
    return;
  }

  term = path.basename(term);
  dir = find(term);

  if (!dir) return;

  if (soft) {
    try {
      list = fs.readdirSync(dir);
    } catch (e) {
      return;
    }

    list.forEach(function(file) {
      if (file.indexOf(term) === 0) {
        var diff = file.length - term.length;
        if (!sfile || diff < sdiff) {
          sdiff = diff;
          sfile = file;
        }
      }
    });

    return sfile && (soft || sdiff === 0)
      ? path.resolve(dir, sfile)
      : null;
  }

  file = path.resolve(dir, term);
  try {
    fs.statSync(file);
    return file;
  } catch (e) {
    ;
  }
};

/**
 * Terminfo Parser
 * All shorts are little-endian
 */

Tput.prototype.parseTerminfo = function(data, file) {
  var info = {}
    , extended
    , l = data.length
    , i = 0
    , v
    , o;

  var h = info.header = {
    dataSize: data.length,
    headerSize: 12,
    magicNumber: (data[1] << 8) | data[0],
    namesSize: (data[3] << 8) | data[2],
    boolCount: (data[5] << 8) | data[4],
    numCount: (data[7] << 8) | data[6],
    strCount: (data[9] << 8) | data[8],
    strTableSize: (data[11] << 8) | data[10]
  };
  console.log('parseTerminfo '+file+':'+data.length)

  h.total = h.headerSize
    + h.namesSize
    + h.boolCount
    + h.numCount * 2
    + h.strCount * 2
    + h.strTableSize;

  i += h.headerSize;

  // Names Section
  var names = data.toString('ascii', i, i + h.namesSize - 1)
    , parts = names.split('|')
    , name = parts[0]
    , desc = parts.pop();
  info.name = name;
  info.names = parts;
  info.desc = desc;
  
  info.dir = path.resolve(file, '..', '..');
  info.file = file;

  i += h.namesSize - 1;
  // Names is nul-terminated.
  assert.equal(data[i], 0);
  i++;

  // Booleans Section
  // One byte for each flag
  // Same order as <term.h>
  info.bools = {};
  l = i + h.boolCount;
  o = 0;
  for (; i < l; i++) {
    v = Tput.bools[o++];
    info.bools[v] = data[i] === 1;
  }

  // Null byte in between to make sure numbers begin on an even byte.
  if (i % 2) {
    assert.equal(data[i], 0);
    i++;
  }

  // Numbers Section
  info.numbers = {};
  l = i + h.numCount * 2;
  o = 0;
  for (; i < l; i += 2) {
    v = Tput.numbers[o++];
    if (data[i + 1] === 0377 && data[i] === 0377) {
      info.numbers[v] = -1;
    } else {
      info.numbers[v] = (data[i + 1] << 8) | data[i];
    }
  }

  // Strings Section
  info.strings = {};
  l = i + h.strCount * 2;
  o = 0;
  for (; i < l; i += 2) {
    v = Tput.strings[o++];
    if (data[i + 1] === 0377 && data[i] === 0377) {
      info.strings[v] = -1;
    } else {
      info.strings[v] = (data[i + 1] << 8) | data[i];
    }
  }

  // String Table
  Object.keys(info.strings).forEach(function(key) {
    if (info.strings[key] === -1) {
      delete info.strings[key];
      return;
    }

    // Workaround: fix an odd bug in the screen-256color terminfo where it tries
    // to set -1, but it appears to have {0xfe, 0xff} instead of {0xff, 0xff}.
    // TODO: Possibly handle errors gracefully below, as well as in the
    // extended info. Also possibly do: `if (info.strings[key] >= data.length)`.
    if (info.strings[key] === 65534) {
      delete info.strings[key];
      return;
    }

    var s = i + info.strings[key]
      , j = s;

    while (data[j]) j++;

    assert(j < data.length);

    info.strings[key] = data.toString('ascii', s, j);
  });

  // Extended Header
  if (this.extended !== false) {
    i--;
    i += h.strTableSize;
    if (i % 2) {
      assert.equal(data[i], 0);
      i++;
    }
    l = data.length;
    if (i < l - 1) {
      try {
        extended = this.parseExtended(data.slice(i));
      } catch (e) {
        if (this.debug) {
          throw e;
        }
        return info;
      }
      info.header.extended = extended.header;
      ['bools', 'numbers', 'strings'].forEach(function(key) {
        merge(info[key], extended[key]);
      });
    }
  }
  
  return info;
};

/**
 * Extended Parsing
 */

// Some data to help understand:

// For xterm, non-extended header:
// { dataSize: 3270,
//   headerSize: 12,
//   magicNumber: 282,
//   namesSize: 48,
//   boolCount: 38,
//   numCount: 15,
//   strCount: 413,
//   strTableSize: 1388,
//   total: 2342 }

// For xterm, header:
// Offset: 2342
// { header:
//    { dataSize: 928,
//      headerSize: 10,
//      boolCount: 2,
//      numCount: 1,
//      strCount: 57,
//      strTableSize: 117,
//      lastStrTableOffset: 680,
//      total: 245 },

// For xterm, layout:
// { header: '0 - 10', // length: 10
//   bools: '10 - 12', // length: 2
//   numbers: '12 - 14', // length: 2
//   strings: '14 - 128', // length: 114 (57 short)
//   symoffsets: '128 - 248', // length: 120 (60 short)
//   stringtable: '248 - 612', // length: 364
//   sym: '612 - 928' } // length: 316
//
// How lastStrTableOffset works:
//   data.length - h.lastStrTableOffset === 248
//     (sym-offset end, string-table start)
//   364 + 316 === 680 (lastStrTableOffset)
// How strTableSize works:
//   h.strCount + [symOffsetCount] === h.strTableSize
//   57 + 60 === 117 (strTableSize)
//   symOffsetCount doesn't actually exist in the header. it's just implied.
// Getting the number of sym offsets:
//   h.symOffsetCount = h.strTableSize - h.strCount;
//   h.symOffsetSize = (h.strTableSize - h.strCount) * 2;

Tput.prototype.parseExtended = function(data) {
  var info = {}
    , l = data.length
    , i = 0;

  var h = info.header = {
    dataSize: data.length,
    headerSize: 10,
    boolCount: (data[i + 1] << 8) | data[i + 0],
    numCount: (data[i + 3] << 8) | data[i + 2],
    strCount: (data[i + 5] << 8) | data[i + 4],
    strTableSize: (data[i + 7] << 8) | data[i + 6],
    lastStrTableOffset: (data[i + 9] << 8) | data[i + 8]
  };

  // h.symOffsetCount = h.strTableSize - h.strCount;

  h.total = h.headerSize
    + h.boolCount
    + h.numCount * 2
    + h.strCount * 2
    + h.strTableSize;

  i += h.headerSize;

  // Booleans Section
  // One byte for each flag
  var _bools = [];
  l = i + h.boolCount;
  for (; i < l; i++) {
    _bools.push(data[i] === 1);
  }

  // Null byte in between to make sure numbers begin on an even byte.
  if (i % 2) {
    assert.equal(data[i], 0);
    i++;
  }

  // Numbers Section
  var _numbers = [];
  l = i + h.numCount * 2;
  for (; i < l; i += 2) {
    if (data[i + 1] === 0377 && data[i] === 0377) {
      _numbers.push(-1);
    } else {
      _numbers.push((data[i + 1] << 8) | data[i]);
    }
  }

  // Strings Section
  var _strings = [];
  l = i + h.strCount * 2;
  for (; i < l; i += 2) {
    if (data[i + 1] === 0377 && data[i] === 0377) {
      _strings.push(-1);
    } else {
      _strings.push((data[i + 1] << 8) | data[i]);
    }
  }

  // Pass over the sym offsets and get to the string table.
  i = data.length - h.lastStrTableOffset;
  // Might be better to do this instead if the file has trailing bytes:
  // i += h.symOffsetCount * 2;

  // String Table
  var high = 0;
  _strings.forEach(function(offset, k) {
    if (offset === -1) {
      _strings[k] = '';
      return;
    }

    var s = i + offset
      , j = s;

    while (data[j]) j++;

    assert(j < data.length);

    // Find out where the string table ends by
    // getting the highest string length.
    if (high < j - i) {
      high = j - i;
    }

    _strings[k] = data.toString('ascii', s, j);
  });

  // Symbol Table
  // Add one to the highest string length because we didn't count \0.
  i += high + 1;
  l = data.length;

  var sym = []
    , j;

  for (; i < l; i++) {
    j = i;
    while (data[j]) j++;
    sym.push(data.toString('ascii', i, j));
    i = j;
  }

  // Identify by name
  j = 0;

  info.bools = {};
  _bools.forEach(function(bool) {
    info.bools[sym[j++]] = bool;
  });

  info.numbers = {};
  _numbers.forEach(function(number) {
    info.numbers[sym[j++]] = number;
  });

  info.strings = {};
  _strings.forEach(function(string) {
    info.strings[sym[j++]] = string;
  });

  // Should be the very last bit of data.
  assert.equal(i, data.length);

  return info;
};

Tput.prototype.compileTerminfo = function(term) {
  return this.compile(this.readTerminfo(term));
};

Tput.prototype.injectTerminfo = function(term) {
  return this.inject(this.compileTerminfo(term));
};

/**
 * Compiler - terminfo cap->javascript
 */

Tput.prototype.compile = function(info) {
  var self = this;

  if (!info) {
    throw new Error('Terminal not found.');
  }

  this.detectFeatures(info);

  this._debug(info);

  info.all = {};
  info.methods = {};

  ['bools', 'numbers', 'strings'].forEach(function(type) {
    Object.keys(info[type]).forEach(function(key) {
      info.all[key] = info[type][key];
      info.methods[key] = self._compile(info, key, info.all[key]);
    });
  });

  Tput.bools.forEach(function(key) {
    if (info.methods[key] == null) info.methods[key] = false;
  });

  Tput.numbers.forEach(function(key) {
    if (info.methods[key] == null) info.methods[key] = -1;
  });

  Tput.strings.forEach(function(key) {
    if (!info.methods[key]) info.methods[key] = noop;
  });

  Object.keys(info.methods).forEach(function(key) {
    if (!Tput.alias[key]) return;
    Tput.alias[key].forEach(function(alias) {
      info.methods[alias] = info.methods[key];
    });
    // Could just use:
    // Object.keys(Tput.aliasMap).forEach(function(key) {
    //   info.methods[key] = info.methods[Tput.aliasMap[key]];
    // });
  });

  return info;
};

Tput.prototype.inject = function(info) {
  var self = this
    , methods = info.methods || info;

  Object.keys(methods).forEach(function(key) {
    if (typeof methods[key] !== 'function') {
      self[key] = methods[key];
      return;
    }
    self[key] = function() {
      var args = Array.prototype.slice.call(arguments);
      return methods[key].call(self, args);
    };
  });

  this.info = info;
  this.all = info.all;
  this.methods = info.methods;
  this.bools = info.bools;
  this.numbers = info.numbers;
  this.strings = info.strings;

  if (!~info.names.indexOf(this.terminal)) {
    this.terminal = info.name;
  }

  this.features = info.features;
  Object.keys(info.features).forEach(function(key) {
    if (key === 'padding') {
      if (!info.features.padding && self.options.padding !== true) {
        self.padding = false;
      }
      return;
    }
    self[key] = info.features[key];
  });
};

// See:
// ~/ncurses/ncurses/tinfo/lib_tparm.c
// ~/ncurses/ncurses/tinfo/comp_scan.c
Tput.prototype._compile = function(info, key, str) {
  var v;

  this._debug('Compiling %s: %s', key, JSON.stringify(str));

  switch (typeof str) {
    case 'boolean':
      return str;
    case 'number':
      return str;
    case 'string':
      break;
    default:
      return noop;
  }

  if (!str) {
    return noop;
  }

  // See:
  // ~/ncurses/progs/tput.c - tput() - L149
  // ~/ncurses/progs/tset.c - set_init() - L992
  if (key === 'init_file' || key === 'reset_file') {
    try {
      str = fs.readFileSync(str, 'utf8');
      if (this.debug) {
        v = ('return ' + JSON.stringify(str) + ';')
          .replace(/\x1b/g, '\\x1b')
          .replace(/\r/g, '\\r')
          .replace(/\n/g, '\\n');
        process.stdout.write(v + '\n');
      }
      return function() { return str; };
    } catch (e) {
      return noop;
    }
  }

  var tkey = info.name + '.' + key
    , header = 'var v, dyn = {}, stat = {}, stack = [], out = [];'
    , footer = ';return out.join("");'
    , code = header
    , val = str
    , buff = ''
    , cap
    , ch
    , fi
    , then
    , els
    , end;

  function read(regex, no) {
    cap = regex.exec(val);
    if (!cap) return;
    val = val.substring(cap[0].length);
    ch = cap[1];
    if (!no) clear();
    return cap;
  }

  function stmt(c) {
    if (code[code.length - 1] === ',') {
      code = code.slice(0, -1);
    }
    code += c;
  }

  function expr(c) {
    code += c + ',';
  }

  function echo(c) {
    if (c === '""') return;
    expr('out.push(' + c + ')');
  }

  function print(c) {
    buff += c;
  }

  function clear() {
    if (buff) {
      echo(JSON.stringify(buff).replace(/\\u00([0-9a-fA-F]{2})/g, '\\x$1'));
      buff = '';
    }
  }

  while (val) {
    // Ignore newlines
    if (read(/^\n /, true)) {
      continue;
    }

    // '^A' -> ^A
    if (read(/^\^(.)/i, true)) {
      if (!(ch >= ' ' && ch <= '~')) {
        this._debug('%s: bad caret char.', tkey);
        // NOTE: ncurses appears to simply
        // continue in this situation, but
        // I could be wrong.
        print(cap[0]);
        continue;
      }
      if (ch === '?') {
        ch = '\x7f';
      } else {
        ch = ch.charCodeAt(0) & 31;
        if (ch === 0) ch = 128;
        ch = String.fromCharCode(ch);
      }
      print(ch);
      continue;
    }

    // 3 octal digits -> character
    if (read(/^\\([0-7]{3})/, true)) {
      print(String.fromCharCode(parseInt(ch, 8)));
      continue;
    }

    // '\e' -> ^[
    // '\n' -> \n
    // '\r' -> \r
    // '\0' -> \200 (special case)
    if (read(/^\\([eEnlrtbfs\^\\,:0]|.)/, true)) {
      switch (ch) {
        case 'e':
        case 'E':
          ch = '\x1b';
          break;
        case 'n':
          ch = '\n';
          break;
        case 'l':
          ch = '\x85';
          break;
        case 'r':
          ch = '\r';
          break;
        case 't':
          ch = '\t';
          break;
        case 'b':
          ch = '\x08';
          break;
        case 'f':
          ch = '\x0c';
          break;
        case 's':
          ch = ' ';
          break;
        case '^':
          ch = '^';
          break;
        case '\\':
          ch = '\\';
          break;
        case ',':
          ch = ',';
          break;
        case ':':
          ch = ':';
          break;
        case '0':
          ch = '\200';
          break;
        case 'a':
          ch = '\x07';
          break;
        default:
          this._debug('%s: bad backslash char.', tkey);
          ch = cap[0];
          break;
      }
      print(ch);
      continue;
    }

    // $<5> -> padding
    // e.g. flash_screen: '\u001b[?5h$<100/>\u001b[?5l',
    if (read(/^\$<(\d+)([*\/]{0,2})>/, true)) {
      if (this.padding) print(cap[0]);
      continue;
    }

    // %%   outputs `%'
    if (read(/^%%/, true)) {
      print('%');
      continue;
    }

    // %[[:]flags][width[.precision]][doxXs]
    //   as in printf, flags are [-+#] and space.  Use a `:' to allow the
    //   next character to be a `-' flag, avoiding interpreting "%-" as an
    //   operator.
    // %c   print pop() like %c in printf
    // Example from screen terminfo:
    //   S0: "\u001b(%p1%c"
    // %d   print pop()
    // "Print (e.g., "%d") is a special case."
    // %s   print pop() like %s in printf
    if (read(/^%((?::-|[+# ]){1,4})?(\d+(?:\.\d+)?)?([doxXsc])/)) {
      if (this.printf || cap[1] || cap[2] || ~'oxX'.indexOf(cap[3])) {
        echo('sprintf("'+ cap[0].replace(':-', '-') + '", stack.pop())');
      } else if (cap[3] === 'c') {
        echo('(v = stack.pop(), isFinite(v) '
          + '? String.fromCharCode(v || 0200) : "")');
      } else {
        echo('stack.pop()');
      }
      continue;
    }

    // %p[1-9]
    //   push i'th parameter
    if (read(/^%p([1-9])/)) {
      expr('(stack.push(v = params[' + (ch - 1) + ']), v)');
      continue;
    }

    // %P[a-z]
    //   set dynamic variable [a-z] to pop()
    if (read(/^%P([a-z])/)) {
      expr('dyn.' + ch + ' = stack.pop()');
      continue;
    }

    // %g[a-z]
    //   get dynamic variable [a-z] and push it
    if (read(/^%g([a-z])/)) {
      expr('(stack.push(dyn.' + ch + '), dyn.' + ch + ')');
      continue;
    }

    // %P[A-Z]
    //   set static variable [a-z] to pop()
    if (read(/^%P([A-Z])/)) {
      expr('stat.' + ch + ' = stack.pop()');
      continue;
    }

    // %g[A-Z]
    //   get static variable [a-z] and push it
    //   The  terms  "static"  and  "dynamic" are misleading.  Historically,
    //   these are simply two different sets of variables, whose values are
    //   not reset between calls to tparm.  However, that fact is not
    //   documented in other implementations.  Relying on it will adversely
    //   impact portability to other implementations.
    if (read(/^%g([A-Z])/)) {
      expr('(stack.push(v = stat.' + ch + '), v)');
      continue;
    }

    // %'c' char constant c
    // NOTE: These are stored as c chars, exemplified by:
    // cursor_address: "\u001b=%p1%' '%+%c%p2%' '%+%c"
    if (read(/^%'(.)'/)) {
      expr('(stack.push(v = ' + ch.charCodeAt(0) + '), v)');
      continue;
    }

    // %{nn}
    //   integer constant nn
    if (read(/^%\{(\d+)\}/)) {
      expr('(stack.push(v = ' + ch + '), v)');
      continue;
    }

    // %l   push strlen(pop)
    if (read(/^%l/)) {
      expr('(stack.push(v = (stack.pop() || "").length || 0), v)');
      continue;
    }

    // %+ %- %* %/ %m
    //   arithmetic (%m is mod): push(pop() op pop())
    // %& %| %^
    //   bit operations (AND, OR and exclusive-OR): push(pop() op pop())
    // %= %> %<
    //   logical operations: push(pop() op pop())
    if (read(/^%([+\-*\/m&|\^=><])/)) {
      if (ch === '=') ch = '===';
      else if (ch === 'm') ch = '%';
      expr('(v = stack.pop(),'
        + ' stack.push(v = (stack.pop() ' + ch + ' v) || 0),'
        + ' v)');
      continue;
    }

    // %A, %O
    //   logical AND and OR operations (for conditionals)
    if (read(/^%([AO])/)) {
      // Are we supposed to store the result on the stack?
      expr('(stack.push(v = (stack.pop() '
        + (ch === 'A' ? '&&' : '||')
        + ' stack.pop())), v)');
      continue;
    }

    // %! %~
    //   unary operations (logical and bit complement): push(op pop())
    if (read(/^%([!~])/)) {
      expr('(stack.push(v = ' + ch + 'stack.pop()), v)');
      continue;
    }

    // %i   add 1 to first two parameters (for ANSI terminals)
    if (read(/^%i/)) {
      // Are these supposed to go on the stack in certain situations?
      // ncurses doesn't seem to put them on the stack, but xterm.user6
      // seems to assume they're on the stack for some reason. Could
      // just be a bad terminfo string.
      // user6: "\u001b[%i%d;%dR" - possibly a termcap-style string.
      // expr('(params[0] |= 0, params[1] |= 0, params[0]++, params[1]++)');
      expr('(params[0]++, params[1]++)');
      continue;
    }

    // %? expr %t thenpart %e elsepart %;
    //   This forms an if-then-else.  The %e elsepart is optional.  Usually
    //   the %? expr part pushes a value onto the stack, and %t pops it from
    //   the stack, testing if it is nonzero (true).  If it is zero (false),
    //   control passes to the %e (else) part.
    //   It is possible to form else-if's a la Algol 68:
    //     %? c1 %t b1 %e c2 %t b2 %e c3 %t b3 %e c4 %t b4 %e %;
    //   where ci are conditions, bi are bodies.
    if (read(/^%\?/)) {
      end = -1;
      stmt(';if (');
      continue;
    }

    if (read(/^%t/)) {
      end = -1;
      // Technically this is supposed to pop everything off the stack that was
      // pushed onto the stack after the if statement, see man terminfo.
      // Right now, we don't pop anything off. This could cause compat issues.
      // Perhaps implement a "pushed" counter from the time the if statement
      // is added, to the time the then statement is added, and pop off
      // the appropriate number of elements.
      // while (pushed--) expr('stack.pop()');
      stmt(') {');
      continue;
    }

    // Terminfo does elseif's like
    // this: %?[expr]%t...%e[expr]%t...%;
    if (read(/^%e/)) {
      fi = val.indexOf('%?');
      then = val.indexOf('%t');
      els = val.indexOf('%e');
      end = val.indexOf('%;');
      if (end === -1) end = Infinity;
      if (then !== -1 && then < end
          && (fi === -1 || then < fi)
          && (els === -1 || then < els)) {
        stmt('} else if (');
      } else {
        stmt('} else {');
      }
      continue;
    }

    if (read(/^%;/)) {
      end = null;
      stmt('}');
      continue;
    }

    buff += val[0];
    val = val.substring(1);
  }

  // Clear the buffer of any remaining text.
  clear();

  // Some terminfos (I'm looking at you, atari-color), don't end an if
  // statement. It's assumed terminfo will automatically end it for
  // them, because they are a bunch of lazy bastards.
  if (end != null) {
    stmt('}');
  }

  // Add the footer.
  stmt(footer);

  // Optimize and cleanup generated code.
  v = code.slice(header.length, -footer.length);
  if (!v.length) {
    code = 'return "";';
  } else if (v = /^out\.push\(("(?:[^"]|\\")+")\)$/.exec(v)) {
    code = 'return ' + v[1] + ';';
  } else {
    // Turn `(stack.push(v = params[0]), v),out.push(stack.pop())`
    // into `out.push(params[0])`.
    code = code.replace(
      /\(stack\.push\(v = params\[(\d+)\]\), v\),out\.push\(stack\.pop\(\)\)/g,
      'out.push(params[$1])');

    // Remove unnecessary variable initializations.
    v = code.slice(header.length, -footer.length);
    if (!~v.indexOf('v = ')) code = code.replace('v, ', '');
    if (!~v.indexOf('dyn')) code = code.replace('dyn = {}, ', '');
    if (!~v.indexOf('stat')) code = code.replace('stat = {}, ', '');
    if (!~v.indexOf('stack')) code = code.replace('stack = [], ', '');

    // Turn `var out = [];out.push("foo"),` into `var out = ["foo"];`.
    code = code.replace(
      /out = \[\];out\.push\(("(?:[^"]|\\")+")\),/,
      'out = [$1];');
  }

  // Terminfos `wyse350-vb`, and `wy350-w`
  // seem to have a few broken strings.
  if (str === '\u001b%?') {
    code = 'return "\\x1b";';
  }

  if (this.debug) {
    v = code
      .replace(/\x1b/g, '\\x1b')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');
    process.stdout.write(v + '\n');
  }

  try {
    if (this.options.stringify && code.indexOf('return ') === 0) {
      return new Function('', code)();
    }
    return this.printf || ~code.indexOf('sprintf(')
      ? new Function('sprintf, params', code).bind(null, sprintf)
      : new Function('params', code);
  } catch (e) {
    console.error('');
    console.error('Error on %s:', tkey);
    console.error(JSON.stringify(str));
    console.error('');
    console.error(code.replace(/(,|;)/g, '$1\n'));
    e.stack = e.stack.replace(/\x1b/g, '\\x1b');
    throw e;
  }
};

// See: ~/ncurses/ncurses/tinfo/lib_tputs.c
Tput.prototype._print = function(code, print, done) {
  var xon = !this.bools.needs_xon_xoff || this.bools.xon_xoff;

  print = print || write;
  done = done || noop;

  if (!this.padding) {
    print(code);
    return done();
  }

  var parts = code.split(/(?=\$<[\d.]+[*\/]{0,2}>)/)
    , i = 0;

  (function next() {
    if (i === parts.length) {
      return done();
    }

    var part = parts[i++]
      , padding = /^\$<([\d.]+)([*\/]{0,2})>/.exec(part)
      , amount
      , suffix;
      // , affect;

    if (!padding) {
      print(part);
      return next();
    }

    part = part.substring(padding[0].length);
    amount = +padding[1];
    suffix = padding[2];

    // A `/'  suffix indicates  that  the  padding  is  mandatory and forces a
    // delay of the given number of milliseconds even on devices for which xon
    // is present to indicate flow control.
    if (xon && !~suffix.indexOf('/')) {
      print(part);
      return next();
    }

    // A `*' indicates that the padding required is proportional to the number
    // of lines affected by the operation, and  the amount  given  is the
    // per-affected-unit padding required.  (In the case of insert character,
    // the factor is still the number of lines affected.) Normally, padding is
    // advisory if the device has the xon capability; it is used for cost
    // computation but does not trigger delays.
    if (~suffix.indexOf('*')) {
      // XXX Disable this for now.
      amount = amount;
      // if (affect = /\x1b\[(\d+)[LM]/.exec(part)) {
      //   amount *= +affect[1];
      // }
      // The above is a huge workaround. In reality, we need to compile
      // `_print` into the string functions and check the cap name and
      // params.
      // if (cap === 'insert_line' || cap === 'delete_line') {
      //   amount *= params[0];
      // }
      // if (cap === 'clear_screen') {
      //   amount *= process.stdout.rows;
      // }
    }

    return setTimeout(function() {
      print(part);
      return next();
    }, amount);
  })();
};

// A small helper function if we want
// to easily output text with setTimeouts.
Tput.print = function() {
  var fake = {
    padding: true,
    bools: { needs_xon_xoff: true, xon_xoff: false }
  };
  return Tput.prototype._print.apply(fake, arguments);
};

/**
 * Termcap
 */

Tput.cpaths = [
  process.env.TERMCAP || '',
  (process.env.TERMPATH || '').split(/[: ]/),
  (process.env.HOME || '') + '/.termcap',
  '/usr/share/misc/termcap',
  '/etc/termcap'
];

Tput.prototype.readTermcap = function(term) {
  var self = this
    , terms
    , term_
    , root
    , paths;

  term = term || this.terminal;

  // Termcap has a bunch of terminals usually stored in one file/string,
  // so we need to find the one containing our desired terminal.
  if (~term.indexOf(path.sep) && (terms = this._tryCap(path.resolve(term)))) {
    term_ = path.basename(term).split('.')[0];
    if (terms[process.env.TERM]) {
      term = process.env.TERM;
    } else if (terms[term_]) {
      term = term_;
    } else {
      term = Object.keys(terms)[0];
    }
  } else {
    paths = Tput.cpaths.slice();

    if (this.termcapFile) {
      paths.unshift(this.termcapFile);
    }

    paths.push(Tput.termcap);

    terms = this._tryCap(paths, term);
  }

  if (!terms) {
    throw new Error('Cannot find termcap for: ' + term);
  }

  root = terms[term];

  if (this.debug) {
    this._termcap = terms;
  }

  (function tc(term) {
    if (term && term.strings.tc) {
      root.inherits = root.inherits || [];
      root.inherits.push(term.strings.tc);

      var names = terms[term.strings.tc]
        ? terms[term.strings.tc].names
        : [term.strings.tc];

      self._debug('%s inherits from %s.',
        term.names.join('/'), names.join('/'));

      var inherit = tc(terms[term.strings.tc]);
      if (inherit) {
        ['bools', 'numbers', 'strings'].forEach(function(type) {
          merge(term[type], inherit[type]);
        });
      }
    }
    return term;
  })(root);

  // Translate termcap names to terminfo-style names.
  root = this.translateTermcap(root);

  return root;
};

Tput.prototype._tryCap = function(file, term) {
  if (!file) return;

  var terms
    , data
    , i;

  if (Array.isArray(file)) {
    for (i = 0; i < file.length; i++) {
      data = this._tryCap(file[i], term);
      if (data) return data;
    }
    return;
  }

  // If the termcap string starts with `/`,
  // ncurses considers it a filename.
  data = file[0] === '/'
    ? tryRead(file)
    : file;

  if (!data) return;

  terms = this.parseTermcap(data, file);

  if (term && !terms[term]) {
    return;
  }

  return terms;
};

/**
 * Termcap Parser
 *  http://en.wikipedia.org/wiki/Termcap
 *  http://www.gnu.org/software
 *    /termutils/manual/termcap-1.3/html_mono/termcap.html
 *  http://www.gnu.org/software
 *    /termutils/manual/termcap-1.3/html_mono/termcap.html#SEC17
 *  http://tldp.org/HOWTO/Text-Terminal-HOWTO.html#toc16
 *  man termcap
 */

// Example:
// vt102|dec vt102:\
//  :do=^J:co#80:li#24:cl=50\E[;H\E[2J:\
//  :le=^H:bs:cm=5\E[%i%d;%dH:nd=2\E[C:up=2\E[A:\
//  :ce=3\E[K:cd=50\E[J:so=2\E[7m:se=2\E[m:us=2\E[4m:ue=2\E[m:\
//  :md=2\E[1m:mr=2\E[7m:mb=2\E[5m:me=2\E[m:is=\E[1;24r\E[24;1H:\
//  :rs=\E>\E[?3l\E[?4l\E[?5l\E[?7h\E[?8h:ks=\E[?1h\E=:ke=\E[?1l\E>:\
//  :ku=\EOA:kd=\EOB:kr=\EOC:kl=\EOD:kb=^H:\
//  :ho=\E[H:k1=\EOP:k2=\EOQ:k3=\EOR:k4=\EOS:pt:sr=5\EM:vt#3:\
//  :sc=\E7:rc=\E8:cs=\E[%i%d;%dr:vs=\E[?7l:ve=\E[?7h:\
//  :mi:al=\E[L:dc=\E[P:dl=\E[M:ei=\E[4l:im=\E[4h:

Tput.prototype.parseTermcap = function(data, file) {
  var terms = {}
    , parts
    , term
    , entries
    , fields
    , field
    , names
    , i
    , j
    , k;

  // remove escaped newlines
  data = data.replace(/\\\n[ \t]*/g, '');

  // remove comments
  data = data.replace(/^#[^\n]+/gm, '');

  // split entries
  entries = data.trim().split(/\n+/);

  for (i = 0; i < entries.length; i++) {
    fields = entries[i].split(/:+/);
    for (j = 0; j < fields.length; j++) {
      field = fields[j].trim();
      if (!field) continue;

      if (j === 0) {
        names = field.split('|');
        term = {
          name: names[0],
          names: names,
          desc: names.pop(),
          file: ~file.indexOf(path.sep)
            ? path.resolve(file)
            : file,
          termcap: true
        };

        for (k = 0; k < names.length; k++) {
          terms[names[k]] = term;
        }

        term.bools = {};
        term.numbers = {};
        term.strings = {};

        continue;
      }

      if (~field.indexOf('=')) {
        parts = field.split('=');
        term.strings[parts[0]] = parts.slice(1).join('=');
      } else if (~field.indexOf('#')) {
        parts = field.split('#');
        term.numbers[parts[0]] = +parts.slice(1).join('#');
      } else {
        term.bools[field] = true;
      }
    }
  }

  return terms;
};

/**
 * Termcap Compiler
 *  man termcap
 */

Tput.prototype.translateTermcap = function(info) {
  var self = this
    , out = {};

  if (!info) return;

  this._debug(info);

  ['name', 'names', 'desc', 'file', 'termcap'].forEach(function(key) {
    out[key] = info[key];
  });

  // Separate aliases for termcap
  var map = (function() {
    var out = {};

    Object.keys(Tput.alias).forEach(function(key) {
      var aliases = Tput.alias[key];
      out[aliases.termcap] = key;
    });

    return out;
  })();

  // Translate termcap cap names to terminfo cap names.
  // e.g. `up` -> `cursor_up`
  ['bools', 'numbers', 'strings'].forEach(function(key) {
    out[key] = {};
    Object.keys(info[key]).forEach(function(cap) {
      if (key === 'strings') {
        info.strings[cap] = self._captoinfo(cap, info.strings[cap], 1);
      }
      if (map[cap]) {
        out[key][map[cap]] = info[key][cap];
      } else {
        // NOTE: Possibly include all termcap names
        // in a separate alias.js file. Some are
        // missing from the terminfo alias.js file
        // which is why we have to do this:
        // See: $ man termcap
        out[key][cap] = info[key][cap];
      }
    });
  });

  return out;
};

Tput.prototype.compileTermcap = function(term) {
  return this.compile(this.readTermcap(term));
};

Tput.prototype.injectTermcap = function(term) {
  return this.inject(this.compileTermcap(term));
};

/**
 * _nc_captoinfo - ported to javascript directly from ncurses.
 * Copyright (c) 1998-2009,2010 Free Software Foundation, Inc.
 * See: ~/ncurses/ncurses/tinfo/captoinfo.c
 *
 * Convert a termcap string to terminfo format.
 * 'cap' is the relevant terminfo capability index.
 * 's' is the string value of the capability.
 * 'parameterized' tells what type of translations to do:
 *    % translations if 1
 *    pad translations if >=0
 */

Tput.prototype._captoinfo = function(cap, s, parameterized) {
  var self = this;

  var capstart;

  if (parameterized == null) {
    parameterized = 0;
  }

  var MAX_PUSHED = 16
    , stack = [];

  var stackptr = 0
    , onstack = 0
    , seenm = 0
    , seenn = 0
    , seenr = 0
    , param = 1
    , i = 0
    , out = '';

  function warn() {
    var args = Array.prototype.slice.call(arguments);
    args[0] = 'captoinfo: ' + (args[0] || '');
    return self._debug.apply(self, args);
  }

  function isdigit(ch) {
    return ch >= '0' && ch <= '9';
  }

  function isgraph(ch) {
    return ch > ' ' && ch <= '~';
  }

  // convert a character to a terminfo push
  function cvtchar(sp) {
    var c = '\0'
      , len;

    var j = i;

    switch (sp[j]) {
      case '\\':
        switch (sp[++j]) {
          case '\'':
          case '$':
          case '\\':
          case '%':
            c = sp[j];
            len = 2;
            break;
          case '\0':
            c = '\\';
            len = 1;
            break;
          case '0':
          case '1':
          case '2':
          case '3':
            len = 1;
            while (isdigit(sp[j])) {
              c = String.fromCharCode(8 * c.charCodeAt(0)
                + (sp[j++].charCodeAt(0) - '0'.charCodeAt(0)));
              len++;
            }
            break;
          default:
            c = sp[j];
            len = 2;
            break;
        }
        break;
      case '^':
        c = String.fromCharCode(sp[++j].charCodeAt(0) & 0x1f);
        len = 2;
        break;
      default:
        c = sp[j];
        len = 1;
    }
    if (isgraph(c) && c !== ',' && c !== '\'' && c !== '\\' && c !== ':') {
      out += '%\'';
      out += c;
      out += '\'';
    } else {
      out += '%{';
      if (c.charCodeAt(0) > 99) {
        out += String.fromCharCode(
          (c.charCodeAt(0) / 100 | 0) + '0'.charCodeAt(0));
      }
      if (c.charCodeAt(0) > 9) {
        out += String.fromCharCode(
          (c.charCodeAt(0) / 10 | 0) % 10 + '0'.charCodeAt(0));
      }
      out += String.fromCharCode(
        c.charCodeAt(0) % 10 + '0'.charCodeAt(0));
      out += '}';
    }

    return len;
  }

  // push n copies of param on the terminfo stack if not already there
  function getparm(parm, n) {
    if (seenr) {
      if (parm === 1) {
        parm = 2;
      } else if (parm === 2) {
        parm = 1;
      }
    }

    if (onstack === parm) {
      if (n > 1) {
        warn('string may not be optimal');
        out += '%Pa';
        while (n--) {
          out += '%ga';
        }
      }
      return;
    }

    if (onstack !== 0) {
      push();
    }

    onstack = parm;

    while (n--) {
      out += '%p';
      out += String.fromCharCode('0'.charCodeAt(0) + parm);
    }

    if (seenn && parm < 3) {
      out += '%{96}%^';
    }

    if (seenm && parm < 3) {
      out += '%{127}%^';
    }
  }

  // push onstack on to the stack
  function push() {
    if (stackptr >= MAX_PUSHED) {
      warn('string too complex to convert');
    } else {
      stack[stackptr++] = onstack;
    }
  }

  // pop the top of the stack into onstack
  function pop() {
    if (stackptr === 0) {
      if (onstack === 0) {
        warn('I\'m confused');
      } else {
        onstack = 0;
      }
    } else {
      onstack = stack[--stackptr];
    }
    param++;
  }

  function see03() {
    getparm(param, 1);
    out += '%3d';
    pop();
  }

  function invalid() {
    out += '%';
    i--;
    warn('unknown %% code %s (%#x) in %s',
      JSON.stringify(s[i]), s[i].charCodeAt(0), cap);
  }

  // skip the initial padding (if we haven't been told not to)
  capstart = null;
  if (s == null) s = '';

  if (parameterized >= 0 && isdigit(s[i])) {
    for (capstart = i;; i++) {
      if (!(isdigit(s[i]) || s[i] === '*' || s[i] === '.')) {
        break;
      }
    }
  }

  while (s[i]) {
    switch (s[i]) {
      case '%':
        i++;
        if (parameterized < 1) {
          out += '%';
          break;
        }
        switch (s[i++]) {
          case '%':
            out += '%';
            break;
          case 'r':
            if (seenr++ === 1) {
              warn('saw %%r twice in %s', cap);
            }
            break;
          case 'm':
            if (seenm++ === 1) {
              warn('saw %%m twice in %s', cap);
            }
            break;
          case 'n':
            if (seenn++ === 1) {
              warn('saw %%n twice in %s', cap);
            }
            break;
          case 'i':
            out += '%i';
            break;
          case '6':
          case 'B':
            getparm(param, 1);
            out += '%{10}%/%{16}%*';
            getparm(param, 1);
            out += '%{10}%m%+';
            break;
          case '8':
          case 'D':
            getparm(param, 2);
            out += '%{2}%*%-';
            break;
          case '>':
            getparm(param, 2);
            // %?%{x}%>%t%{y}%+%;
            out += '%?';
            i += cvtchar(s);
            out += '%>%t';
            i += cvtchar(s);
            out += '%+%;';
            break;
          case 'a':
            if ((s[i] === '=' || s[i] === '+' || s[i] === '-'
                || s[i] === '*' || s[i] === '/')
                && (s[i + 1] === 'p' || s[i + 1] === 'c')
                && s[i + 2] !== '\0' && s[i + 2]) {
              var l;
              l = 2;
              if (s[i] !== '=') {
                getparm(param, 1);
              }
              if (s[i + 1] === 'p') {
                getparm(param + s[i + 2].charCodeAt(0) - '@'.charCodeAt(0), 1);
                if (param !== onstack) {
                  pop();
                  param--;
                }
                l++;
              } else {
                i += 2, l += cvtchar(s), i -= 2;
              }
              switch (s[i]) {
                case '+':
                  out += '%+';
                  break;
                case '-':
                  out += '%-';
                  break;
                case '*':
                  out += '%*';
                  break;
                case '/':
                  out += '%/';
                  break;
                case '=':
                  if (seenr) {
                    if (param === 1) {
                      onstack = 2;
                    } else if (param === 2) {
                      onstack = 1;
                    } else {
                      onstack = param;
                    }
                  } else {
                    onstack = param;
                  }
                  break;
              }
              i += l;
              break;
            }
            getparm(param, 1);
            i += cvtchar(s);
            out += '%+';
            break;
          case '+':
            getparm(param, 1);
            i += cvtchar(s);
            out += '%+%c';
            pop();
            break;
          case 's':
// #ifdef WATERLOO
//          i += cvtchar(s);
//          getparm(param, 1);
//          out += '%-';
// #else
            getparm(param, 1);
            out += '%s';
            pop();
// #endif /* WATERLOO */
            break;
          case '-':
            i += cvtchar(s);
            getparm(param, 1);
            out += '%-%c';
            pop();
            break;
          case '.':
            getparm(param, 1);
            out += '%c';
            pop();
            break;
          case '0': // not clear any of the historical termcaps did this
            if (s[i] === '3') {
              see03(); // goto
              break;
            } else if (s[i] !== '2') {
              invalid(); // goto
              break;
            }
            // FALLTHRU
          case '2':
            getparm(param, 1);
            out += '%2d';
            pop();
            break;
          case '3':
            see03();
            break;
          case 'd':
            getparm(param, 1);
            out += '%d';
            pop();
            break;
          case 'f':
            param++;
            break;
          case 'b':
            param--;
            break;
          case '\\':
            out += '%\\';
            break;
          default:
            invalid();
            break;
        }
        break;
// #ifdef REVISIBILIZE
//    case '\\':
//      out += s[i++];
//      out += s[i++];
//      break;
//    case '\n':
//      out += '\\n';
//      i++;
//      break;
//    case '\t':
//      out += '\\t';
//      i++;
//      break;
//    case '\r':
//      out += '\\r';
//      i++;
//      break;
//    case '\200':
//      out += '\\0';
//      i++;
//      break;
//    case '\f':
//      out += '\\f';
//      i++;
//      break;
//    case '\b':
//      out += '\\b';
//      i++;
//      break;
//    case ' ':
//      out += '\\s';
//      i++;
//      break;
//    case '^':
//      out += '\\^';
//      i++;
//      break;
//    case ':':
//      out += '\\:';
//      i++;
//      break;
//    case ',':
//      out += '\\,';
//      i++;
//      break;
//    default:
//      if (s[i] === '\033') {
//        out += '\\E';
//        i++;
//      } else if (s[i].charCodeAt(0) > 0 && s[i].charCodeAt(0) < 32) {
//        out += '^';
//        out += String.fromCharCode(s[i].charCodeAt(0) + '@'.charCodeAt(0));
//        i++;
//      } else if (s[i].charCodeAt(0) <= 0 || s[i].charCodeAt(0) >= 127) {
//        out += '\\';
//        out += String.fromCharCode(
//          ((s[i].charCodeAt(0) & 0300) >> 6) + '0'.charCodeAt(0));
//        out += String.fromCharCode(
//          ((s[i].charCodeAt(0) & 0070) >> 3) + '0'.charCodeAt(0));
//        out += String.fromCharCode(
//          (s[i].charCodeAt(0) & 0007) + '0'.charCodeAt(0));
//        i++;
//      } else {
//        out += s[i++];
//      }
//      break;
// #else
      default:
        out += s[i++];
        break;
// #endif
    }
  }

  // Now, if we stripped off some leading padding, add it at the end
  // of the string as mandatory padding.
  if (capstart != null) {
    out += '$<';
    for (i = capstart;; i++) {
      if (isdigit(s[i]) || s[i] === '*' || s[i] === '.') {
        out += s[i];
      } else {
        break;
      }
    }
    out += '/>';
  }

  if (s !== out) {
    warn('Translating %s from %s to %s.',
      cap, JSON.stringify(s), JSON.stringify(out));
  }

  return out;
};

/**
 * Compile All Terminfo
 */

Tput.prototype.getAll = function() {
  var dir = this._prefix()
    , list = asort(fs.readdirSync(dir))
    , infos = [];

  list.forEach(function(letter) {
    var terms = asort(fs.readdirSync(path.resolve(dir, letter)));
    infos.push.apply(infos, terms);
  });

  function asort(obj) {
    return obj.sort(function(a, b) {
      a = a.toLowerCase().charCodeAt(0);
      b = b.toLowerCase().charCodeAt(0);
      return a - b;
    });
  }

  return infos;
};

Tput.prototype.compileAll = function(start) {
  var self = this
    , all = {};

  this.getAll().forEach(function(name) {
    if (start && name !== start) {
      return;
    } else {
      start = null;
    }
    all[name] = self.compileTerminfo(name);
  });

  return all;
};

/**
 * Detect Features / Quirks
 */

Tput.prototype.detectFeatures = function(info) {
  var data = this.parseACS(info);
  info.features = {
    unicode: this.detectUnicode(info),
    brokenACS: this.detectBrokenACS(info),
    PCRomSet: this.detectPCRomSet(info),
    magicCookie: this.detectMagicCookie(info),
    padding: this.detectPadding(info),
    setbuf: this.detectSetbuf(info),
    acsc: data.acsc,
    acscr: data.acscr
  };
  return info.features;
};

Tput.prototype.detectUnicode = function() {
  if (this.options.forceUnicode != null) {
    return this.options.forceUnicode;
  }

  var LANG = process.env.LANG
    + ':' + process.env.LANGUAGE
    + ':' + process.env.LC_ALL
    + ':' + process.env.LC_CTYPE;

  return /utf-?8/i.test(LANG) || (this.GetConsoleCP() === 65001);
};

// For some reason TERM=linux has smacs/rmacs, but it maps to `^[[11m`
// and it does not switch to the DEC SCLD character set. What the hell?
// xterm: \x1b(0, screen: \x0e, linux: \x1b[11m (doesn't work)
// `man console_codes` says:
// 11  select null mapping, set display control flag, reset tog‐
//     gle meta flag (ECMA-48 says "first alternate font").
// See ncurses:
// ~/ncurses/ncurses/base/lib_set_term.c
// ~/ncurses/ncurses/tinfo/lib_acs.c
// ~/ncurses/ncurses/tinfo/tinfo_driver.c
// ~/ncurses/ncurses/tinfo/lib_setup.c
Tput.prototype.detectBrokenACS = function(info) {
  // ncurses-compatible env variable.
  if (process.env.NCURSES_NO_UTF8_ACS != null) {
    return !!+process.env.NCURSES_NO_UTF8_ACS;
  }

  // If the terminal supports unicode, we don't need ACS.
  if (info.numbers.U8 >= 0) {
    return !!info.numbers.U8;
  }

  // The linux console is just broken for some reason.
  // Apparently the Linux console does not support ACS,
  // but it does support the PC ROM character set.
  if (info.name === 'linux') {
    return true;
  }

  // PC alternate charset
  // if (acsc.indexOf('+\x10,\x11-\x18.\x190') === 0) {
  if (this.detectPCRomSet(info)) {
    return true;
  }

  // screen termcap is bugged?
  if (this.termcap
      && info.name.indexOf('screen') === 0
      && process.env.TERMCAP
      && ~process.env.TERMCAP.indexOf('screen')
      && ~process.env.TERMCAP.indexOf('hhII00')) {
    if (~info.strings.enter_alt_charset_mode.indexOf('\016')
        || ~info.strings.enter_alt_charset_mode.indexOf('\017')
        || ~info.strings.set_attributes.indexOf('\016')
        || ~info.strings.set_attributes.indexOf('\017')) {
      return true;
    }
  }

  return false;
};

// If enter_pc_charset is the same as enter_alt_charset,
// the terminal does not support SCLD as ACS.
// See: ~/ncurses/ncurses/tinfo/lib_acs.c
Tput.prototype.detectPCRomSet = function(info) {
  var s = info.strings;
  if (s.enter_pc_charset_mode && s.enter_alt_charset_mode
      && s.enter_pc_charset_mode === s.enter_alt_charset_mode
      && s.exit_pc_charset_mode === s.exit_alt_charset_mode) {
    return true;
  }
  return false;
};

Tput.prototype.detectMagicCookie = function() {
  return process.env.NCURSES_NO_MAGIC_COOKIE == null;
};

Tput.prototype.detectPadding = function() {
  return process.env.NCURSES_NO_PADDING == null;
};

Tput.prototype.detectSetbuf = function() {
  return process.env.NCURSES_NO_SETBUF == null;
};

Tput.prototype.parseACS = function(info) {
  var data = {};

  data.acsc = {};
  data.acscr = {};

  // Possibly just return an empty object, as done here, instead of
  // specifically saying ACS is "broken" above. This would be more
  // accurate to ncurses logic. But it doesn't really matter.
  if (this.detectPCRomSet(info)) {
    return data;
  }

  // See: ~/ncurses/ncurses/tinfo/lib_acs.c: L208
  Object.keys(Tput.acsc).forEach(function(ch) {
    var acs_chars = info.strings.acs_chars || ''
      , i = acs_chars.indexOf(ch)
      , next = acs_chars[i + 1];

    if (!next || i === -1 || !Tput.acsc[next]) {
      return;
    }

    data.acsc[ch] = Tput.acsc[next];
    data.acscr[Tput.acsc[next]] = ch;
  });

  return data;
};

Tput.prototype.GetConsoleCP = function() {
  var ccp;

  if (process.platform !== 'win32') {
    return -1;
  }

  // Allow unicode on all windows consoles for now:
  if (+process.env.NCURSES_UNICODE !== 0) {
    return 65001;
  }

  // cp.execSync('chcp 65001', { stdio: 'ignore', timeout: 1500 });

  try {
    // Produces something like: 'Active code page: 437\n\n'
    ccp = cp.execFileSync(process.env.WINDIR + '\\system32\\chcp.com', [], {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'ascii',
      timeout: 1500
    });
    // ccp = cp.execSync('chcp', {
    //   stdio: ['ignore', 'pipe', 'ignore'],
    //   encoding: 'ascii',
    //   timeout: 1500
    // });
  } catch (e) {
    ;
  }

  ccp = /\d+/.exec(ccp);

  if (!ccp) {
    return -1;
  }

  ccp = +ccp[0];

  return ccp;
};

/**
 * Helpers
 */

function noop() {
  return '';
}

noop.unsupported = true;

function merge(a, b) {
  Object.keys(b).forEach(function(key) {
    a[key] = b[key];
  });
  return a;
}

function write(data) {
  return process.stdout.write(data);
}

function tryRead(file) {
  if (Array.isArray(file)) {
    for (var i = 0; i < file.length; i++) {
      var data = tryRead(file[i]);
      if (data) return data;
    }
    return '';
  }
  if (!file) return '';
  file = path.resolve.apply(path, arguments);
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    return '';
  }
}

/**
 * sprintf
 *  http://www.cplusplus.com/reference/cstdio/printf/
 */

function sprintf(src) {
  var params = Array.prototype.slice.call(arguments, 1)
    , rule = /%([\-+# ]{1,4})?(\d+(?:\.\d+)?)?([doxXsc])/g
    , i = 0;

  return src.replace(rule, function(_, flag, width, type) {
    var flags = (flag || '').split('')
      , param = params[i] != null ? params[i] : ''
      , initial = param
      // , width = +width
      , opt = {}
      , pre = '';

    i++;

    switch (type) {
      case 'd': // signed int
        param = (+param).toString(10);
        break;
      case 'o': // unsigned octal
        param = (+param).toString(8);
        break;
      case 'x': // unsigned hex int
        param = (+param).toString(16);
        break;
      case 'X': // unsigned hex int uppercase
        param = (+param).toString(16).toUppercase();
        break;
      case 's': // string
        break;
      case 'c': // char
        param = isFinite(param)
          ? String.fromCharCode(param || 0200)
          : '';
        break;
    }

    flags.forEach(function(flag) {
      switch (flag) {
        // left-justify by width
        case '-':
          opt.left = true;
          break;
        // always precede numbers with their signs
        case '+':
          opt.signs = true;
          break;
        // used with o, x, X - value is preceded with 0, 0x, or 0X respectively.
        // used with a, A, e, E, f, F, g, G - forces written output to contain
        // a decimal point even if no more digits follow
        case '#':
          opt.hexpoint = true;
          break;
        // if no sign is going to be written, black space in front of the value
        case ' ':
          opt.space = true;
          break;
      }
    });

    width = +width.split('.')[0];

    // Should this be for opt.left too?
    // Example: %2.2X - turns 0 into 00
    if (width && !opt.left) {
      param = param + '';
      while (param.length < width) {
        param = '0' + param;
      }
    }

    if (opt.signs) {
      if (+initial >= 0) {
        pre += '+';
      }
    }

    if (opt.space) {
      if (!opt.signs && +initial >= 0) {
        pre += ' ';
      }
    }

    if (opt.hexpoint) {
      switch (type) {
        case 'o': // unsigned octal
          pre += '0';
          break;
        case 'x': // unsigned hex int
          pre += '0x';
          break;
        case 'X': // unsigned hex int uppercase
          pre += '0X';
          break;
      }
    }

    if (opt.left) {
      if (width > (pre.length + param.length)) {
        width -= pre.length + param.length;
        pre = Array(width + 1).join(' ') + pre;
      }
    }

    return pre + param;
  });
}

/**
 * Aliases
 */

Tput._alias = Require('term/alias');

Tput.alias = {};

['bools', 'numbers', 'strings'].forEach(function(type) {
  Object.keys(Tput._alias[type]).forEach(function(key) {
    var aliases = Tput._alias[type][key];
    Tput.alias[key] = [aliases[0]];
    Tput.alias[key].terminfo = aliases[0];
    Tput.alias[key].termcap = aliases[1];
  });
});

// Bools
Tput.alias.no_esc_ctlc.push('beehive_glitch');
Tput.alias.dest_tabs_magic_smso.push('teleray_glitch');

// Numbers
Tput.alias.micro_col_size.push('micro_char_size');

/**
 * Feature Checking
 */

Tput.aliasMap = {};

Object.keys(Tput.alias).forEach(function(key) {
  Tput.aliasMap[key] = key;
  Tput.alias[key].forEach(function(k) {
    Tput.aliasMap[k] = key;
  });
});

Tput.prototype.has = function(name) {
  name = Tput.aliasMap[name];

  var val = this.all[name];

  if (!name) return false;

  if (typeof val === 'number') {
    return val !== -1;
  }

  return !!val;
};

/**
 * Fallback Termcap Entry
 */

Tput.termcap = ''
  + 'vt102|dec vt102:'
  + ':do=^J:co#80:li#24:cl=50\\E[;H\\E[2J:'
  + ':le=^H:bs:cm=5\\E[%i%d;%dH:nd=2\\E[C:up=2\\E[A:'
  + ':ce=3\\E[K:cd=50\\E[J:so=2\\E[7m:se=2\\E[m:us=2\\E[4m:ue=2\\E[m:'
  + ':md=2\\E[1m:mr=2\\E[7m:mb=2\\E[5m:me=2\\E[m:is=\\E[1;24r\\E[24;1H:'
  + ':rs=\\E>\\E[?3l\\E[?4l\\E[?5l\\E[?7h\\E[?8h:ks=\\E[?1h\\E=:ke=\\E[?1l\\E>:'
  + ':ku=\\EOA:kd=\\EOB:kr=\\EOC:kl=\\EOD:kb=^H:\\\n'
  + ':ho=\\E[H:k1=\\EOP:k2=\\EOQ:k3=\\EOR:k4=\\EOS:pt:sr=5\\EM:vt#3:'
  + ':sc=\\E7:rc=\\E8:cs=\\E[%i%d;%dr:vs=\\E[?7l:ve=\\E[?7h:'
  + ':mi:al=\\E[L:dc=\\E[P:dl=\\E[M:ei=\\E[4l:im=\\E[4h:';

/**
 * Terminfo Data
 */

Tput.bools = [
  'auto_left_margin',
  'auto_right_margin',
  'no_esc_ctlc',
  'ceol_standout_glitch',
  'eat_newline_glitch',
  'erase_overstrike',
  'generic_type',
  'hard_copy',
  'has_meta_key',
  'has_status_line',
  'insert_null_glitch',
  'memory_above',
  'memory_below',
  'move_insert_mode',
  'move_standout_mode',
  'over_strike',
  'status_line_esc_ok',
  'dest_tabs_magic_smso',
  'tilde_glitch',
  'transparent_underline',
  'xon_xoff',
  'needs_xon_xoff',
  'prtr_silent',
  'hard_cursor',
  'non_rev_rmcup',
  'no_pad_char',
  'non_dest_scroll_region',
  'can_change',
  'back_color_erase',
  'hue_lightness_saturation',
  'col_addr_glitch',
  'cr_cancels_micro_mode',
  'has_print_wheel',
  'row_addr_glitch',
  'semi_auto_right_margin',
  'cpi_changes_res',
  'lpi_changes_res',

  // #ifdef __INTERNAL_CAPS_VISIBLE
  'backspaces_with_bs',
  'crt_no_scrolling',
  'no_correctly_working_cr',
  'gnu_has_meta_key',
  'linefeed_is_newline',
  'has_hardware_tabs',
  'return_does_clr_eol'
];

Tput.numbers = [
  'columns',
  'init_tabs',
  'lines',
  'lines_of_memory',
  'magic_cookie_glitch',
  'padding_baud_rate',
  'virtual_terminal',
  'width_status_line',
  'num_labels',
  'label_height',
  'label_width',
  'max_attributes',
  'maximum_windows',
  'max_colors',
  'max_pairs',
  'no_color_video',
  'buffer_capacity',
  'dot_vert_spacing',
  'dot_horz_spacing',
  'max_micro_address',
  'max_micro_jump',
  'micro_col_size',
  'micro_line_size',
  'number_of_pins',
  'output_res_char',
  'output_res_line',
  'output_res_horz_inch',
  'output_res_vert_inch',
  'print_rate',
  'wide_char_size',
  'buttons',
  'bit_image_entwining',
  'bit_image_type',

  // #ifdef __INTERNAL_CAPS_VISIBLE
  'magic_cookie_glitch_ul',
  'carriage_return_delay',
  'new_line_delay',
  'backspace_delay',
  'horizontal_tab_delay',
  'number_of_function_keys'
];

Tput.strings = [
  'back_tab',
  'bell',
  'carriage_return',
  'change_scroll_region',
  'clear_all_tabs',
  'clear_screen',
  'clr_eol',
  'clr_eos',
  'column_address',
  'command_character',
  'cursor_address',
  'cursor_down',
  'cursor_home',
  'cursor_invisible',
  'cursor_left',
  'cursor_mem_address',
  'cursor_normal',
  'cursor_right',
  'cursor_to_ll',
  'cursor_up',
  'cursor_visible',
  'delete_character',
  'delete_line',
  'dis_status_line',
  'down_half_line',
  'enter_alt_charset_mode',
  'enter_blink_mode',
  'enter_bold_mode',
  'enter_ca_mode',
  'enter_delete_mode',
  'enter_dim_mode',
  'enter_insert_mode',
  'enter_secure_mode',
  'enter_protected_mode',
  'enter_reverse_mode',
  'enter_standout_mode',
  'enter_underline_mode',
  'erase_chars',
  'exit_alt_charset_mode',
  'exit_attribute_mode',
  'exit_ca_mode',
  'exit_delete_mode',
  'exit_insert_mode',
  'exit_standout_mode',
  'exit_underline_mode',
  'flash_screen',
  'form_feed',
  'from_status_line',
  'init_1string',
  'init_2string',
  'init_3string',
  'init_file',
  'insert_character',
  'insert_line',
  'insert_padding',
  'key_backspace',
  'key_catab',
  'key_clear',
  'key_ctab',
  'key_dc',
  'key_dl',
  'key_down',
  'key_eic',
  'key_eol',
  'key_eos',
  'key_f0',
  'key_f1',
  'key_f10',
  'key_f2',
  'key_f3',
  'key_f4',
  'key_f5',
  'key_f6',
  'key_f7',
  'key_f8',
  'key_f9',
  'key_home',
  'key_ic',
  'key_il',
  'key_left',
  'key_ll',
  'key_npage',
  'key_ppage',
  'key_right',
  'key_sf',
  'key_sr',
  'key_stab',
  'key_up',
  'keypad_local',
  'keypad_xmit',
  'lab_f0',
  'lab_f1',
  'lab_f10',
  'lab_f2',
  'lab_f3',
  'lab_f4',
  'lab_f5',
  'lab_f6',
  'lab_f7',
  'lab_f8',
  'lab_f9',
  'meta_off',
  'meta_on',
  'newline',
  'pad_char',
  'parm_dch',
  'parm_delete_line',
  'parm_down_cursor',
  'parm_ich',
  'parm_index',
  'parm_insert_line',
  'parm_left_cursor',
  'parm_right_cursor',
  'parm_rindex',
  'parm_up_cursor',
  'pkey_key',
  'pkey_local',
  'pkey_xmit',
  'print_screen',
  'prtr_off',
  'prtr_on',
  'repeat_char',
  'reset_1string',
  'reset_2string',
  'reset_3string',
  'reset_file',
  'restore_cursor',
  'row_address',
  'save_cursor',
  'scroll_forward',
  'scroll_reverse',
  'set_attributes',
  'set_tab',
  'set_window',
  'tab',
  'to_status_line',
  'underline_char',
  'up_half_line',
  'init_prog',
  'key_a1',
  'key_a3',
  'key_b2',
  'key_c1',
  'key_c3',
  'prtr_non',
  'char_padding',
  'acs_chars',
  'plab_norm',
  'key_btab',
  'enter_xon_mode',
  'exit_xon_mode',
  'enter_am_mode',
  'exit_am_mode',
  'xon_character',
  'xoff_character',
  'ena_acs',
  'label_on',
  'label_off',
  'key_beg',
  'key_cancel',
  'key_close',
  'key_command',
  'key_copy',
  'key_create',
  'key_end',
  'key_enter',
  'key_exit',
  'key_find',
  'key_help',
  'key_mark',
  'key_message',
  'key_move',
  'key_next',
  'key_open',
  'key_options',
  'key_previous',
  'key_print',
  'key_redo',
  'key_reference',
  'key_refresh',
  'key_replace',
  'key_restart',
  'key_resume',
  'key_save',
  'key_suspend',
  'key_undo',
  'key_sbeg',
  'key_scancel',
  'key_scommand',
  'key_scopy',
  'key_screate',
  'key_sdc',
  'key_sdl',
  'key_select',
  'key_send',
  'key_seol',
  'key_sexit',
  'key_sfind',
  'key_shelp',
  'key_shome',
  'key_sic',
  'key_sleft',
  'key_smessage',
  'key_smove',
  'key_snext',
  'key_soptions',
  'key_sprevious',
  'key_sprint',
  'key_sredo',
  'key_sreplace',
  'key_sright',
  'key_srsume',
  'key_ssave',
  'key_ssuspend',
  'key_sundo',
  'req_for_input',
  'key_f11',
  'key_f12',
  'key_f13',
  'key_f14',
  'key_f15',
  'key_f16',
  'key_f17',
  'key_f18',
  'key_f19',
  'key_f20',
  'key_f21',
  'key_f22',
  'key_f23',
  'key_f24',
  'key_f25',
  'key_f26',
  'key_f27',
  'key_f28',
  'key_f29',
  'key_f30',
  'key_f31',
  'key_f32',
  'key_f33',
  'key_f34',
  'key_f35',
  'key_f36',
  'key_f37',
  'key_f38',
  'key_f39',
  'key_f40',
  'key_f41',
  'key_f42',
  'key_f43',
  'key_f44',
  'key_f45',
  'key_f46',
  'key_f47',
  'key_f48',
  'key_f49',
  'key_f50',
  'key_f51',
  'key_f52',
  'key_f53',
  'key_f54',
  'key_f55',
  'key_f56',
  'key_f57',
  'key_f58',
  'key_f59',
  'key_f60',
  'key_f61',
  'key_f62',
  'key_f63',
  'clr_bol',
  'clear_margins',
  'set_left_margin',
  'set_right_margin',
  'label_format',
  'set_clock',
  'display_clock',
  'remove_clock',
  'create_window',
  'goto_window',
  'hangup',
  'dial_phone',
  'quick_dial',
  'tone',
  'pulse',
  'flash_hook',
  'fixed_pause',
  'wait_tone',
  'user0',
  'user1',
  'user2',
  'user3',
  'user4',
  'user5',
  'user6',
  'user7',
  'user8',
  'user9',
  'orig_pair',
  'orig_colors',
  'initialize_color',
  'initialize_pair',
  'set_color_pair',
  'set_foreground',
  'set_background',
  'change_char_pitch',
  'change_line_pitch',
  'change_res_horz',
  'change_res_vert',
  'define_char',
  'enter_doublewide_mode',
  'enter_draft_quality',
  'enter_italics_mode',
  'enter_leftward_mode',
  'enter_micro_mode',
  'enter_near_letter_quality',
  'enter_normal_quality',
  'enter_shadow_mode',
  'enter_subscript_mode',
  'enter_superscript_mode',
  'enter_upward_mode',
  'exit_doublewide_mode',
  'exit_italics_mode',
  'exit_leftward_mode',
  'exit_micro_mode',
  'exit_shadow_mode',
  'exit_subscript_mode',
  'exit_superscript_mode',
  'exit_upward_mode',
  'micro_column_address',
  'micro_down',
  'micro_left',
  'micro_right',
  'micro_row_address',
  'micro_up',
  'order_of_pins',
  'parm_down_micro',
  'parm_left_micro',
  'parm_right_micro',
  'parm_up_micro',
  'select_char_set',
  'set_bottom_margin',
  'set_bottom_margin_parm',
  'set_left_margin_parm',
  'set_right_margin_parm',
  'set_top_margin',
  'set_top_margin_parm',
  'start_bit_image',
  'start_char_set_def',
  'stop_bit_image',
  'stop_char_set_def',
  'subscript_characters',
  'superscript_characters',
  'these_cause_cr',
  'zero_motion',
  'char_set_names',
  'key_mouse',
  'mouse_info',
  'req_mouse_pos',
  'get_mouse',
  'set_a_foreground',
  'set_a_background',
  'pkey_plab',
  'device_type',
  'code_set_init',
  'set0_des_seq',
  'set1_des_seq',
  'set2_des_seq',
  'set3_des_seq',
  'set_lr_margin',
  'set_tb_margin',
  'bit_image_repeat',
  'bit_image_newline',
  'bit_image_carriage_return',
  'color_names',
  'define_bit_image_region',
  'end_bit_image_region',
  'set_color_band',
  'set_page_length',
  'display_pc_char',
  'enter_pc_charset_mode',
  'exit_pc_charset_mode',
  'enter_scancode_mode',
  'exit_scancode_mode',
  'pc_term_options',
  'scancode_escape',
  'alt_scancode_esc',
  'enter_horizontal_hl_mode',
  'enter_left_hl_mode',
  'enter_low_hl_mode',
  'enter_right_hl_mode',
  'enter_top_hl_mode',
  'enter_vertical_hl_mode',
  'set_a_attributes',
  'set_pglen_inch',

  // #ifdef __INTERNAL_CAPS_VISIBLE
  'termcap_init2',
  'termcap_reset',
  'linefeed_if_not_lf',
  'backspace_if_not_bs',
  'other_non_function_keys',
  'arrow_key_map',
  'acs_ulcorner',
  'acs_llcorner',
  'acs_urcorner',
  'acs_lrcorner',
  'acs_ltee',
  'acs_rtee',
  'acs_btee',
  'acs_ttee',
  'acs_hline',
  'acs_vline',
  'acs_plus',
  'memory_lock',
  'memory_unlock',
  'box_chars_1'
];

// DEC Special Character and Line Drawing Set.
// Taken from tty.js.
Tput.acsc = {    // (0
  '`': '\u25c6', // '◆'
  'a': '\u2592', // '▒'
  'b': '\u0009', // '\t'
  'c': '\u000c', // '\f'
  'd': '\u000d', // '\r'
  'e': '\u000a', // '\n'
  'f': '\u00b0', // '°'
  'g': '\u00b1', // '±'
  'h': '\u2424', // '\u2424' (NL)
  'i': '\u000b', // '\v'
  'j': '\u2518', // '┘'
  'k': '\u2510', // '┐'
  'l': '\u250c', // '┌'
  'm': '\u2514', // '└'
  'n': '\u253c', // '┼'
  'o': '\u23ba', // '⎺'
  'p': '\u23bb', // '⎻'
  'q': '\u2500', // '─'
  'r': '\u23bc', // '⎼'
  's': '\u23bd', // '⎽'
  't': '\u251c', // '├'
  'u': '\u2524', // '┤'
  'v': '\u2534', // '┴'
  'w': '\u252c', // '┬'
  'x': '\u2502', // '│'
  'y': '\u2264', // '≤'
  'z': '\u2265', // '≥'
  '{': '\u03c0', // 'π'
  '|': '\u2260', // '≠'
  '}': '\u00a3', // '£'
  '~': '\u00b7'  // '·'
};

// Convert ACS unicode characters to the
// most similar-looking ascii characters.
Tput.utoa = Tput.prototype.utoa = {
  '\u25c6': '*', // '◆'
  '\u2592': ' ', // '▒'
  // '\u0009': '\t', // '\t'
  // '\u000c': '\f', // '\f'
  // '\u000d': '\r', // '\r'
  // '\u000a': '\n', // '\n'
  '\u00b0': '*', // '°'
  '\u00b1': '+', // '±'
  '\u2424': '\n', // '\u2424' (NL)
  // '\u000b': '\v', // '\v'
  '\u2518': '+', // '┘'
  '\u2510': '+', // '┐'
  '\u250c': '+', // '┌'
  '\u2514': '+', // '└'
  '\u253c': '+', // '┼'
  '\u23ba': '-', // '⎺'
  '\u23bb': '-', // '⎻'
  '\u2500': '-', // '─'
  '\u23bc': '-', // '⎼'
  '\u23bd': '_', // '⎽'
  '\u251c': '+', // '├'
  '\u2524': '+', // '┤'
  '\u2534': '+', // '┴'
  '\u252c': '+', // '┬'
  '\u2502': '|', // '│'
  '\u2264': '<', // '≤'
  '\u2265': '>', // '≥'
  '\u03c0': '?', // 'π'
  '\u2260': '=', // '≠'
  '\u00a3': '?', // '£'
  '\u00b7': '*'  // '·'
};

/**
 * Expose
 */

exports = Tput;
exports.sprintf = sprintf;
exports.tryRead = tryRead;

module.exports = exports;
};
BundleModuleCode['os/assert']=function (module,exports,global,process){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = Require('util');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};
};
BundleModuleCode['os/path']=function (module,exports,global,process){
var Fs = Require('fs');

var _process = process || {};
(function () {
  "use strict";

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


var isWindows = _process.platform === 'win32';
var util = Require('util');
if (!util.deprecate) util.deprecate=function(f,w) {return f;};

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}


if (isWindows) {
  // Regex to split a windows path into three parts: [*, device, slash,
  // tail] windows-only
  var splitDeviceRe =
      /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

  // Regex to split the tail part of the above into [*, dir, basename, ext]
  var splitTailRe =
      /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

  // Function to split a filename into [root, dir, basename, ext]
  // windows version
  var splitPath = function(filename) {
    // Separate device+slash from tail
    var result = splitDeviceRe.exec(filename),
        device = (result[1] || '') + (result[2] || ''),
        tail = result[3] || '';
    // Split the tail into dir, basename and extension
    var result2 = splitTailRe.exec(tail),
        dir = result2[1],
        basename = result2[2],
        ext = result2[3];
    return [device, dir, basename, ext];
  };

  var normalizeUNCRoot = function(device) {
    return '\\\\' + device.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '\\');
  };

  // path.resolve([from ...], to)
  // windows version
  exports.resolve = function() {
    var resolvedDevice = '',
        resolvedTail = '',
        resolvedAbsolute = false;

    for (var i = arguments.length - 1; i >= -1; i--) {
      var path;
      if (i >= 0) {
        path = arguments[i];
      } else if (!resolvedDevice) {
        path = _process.cwd();
      } else {
        // Windows has the concept of drive-specific current working
        // directories. If we've resolved a drive letter but not yet an
        // absolute path, get cwd for that drive. We're sure the device is not
        // an unc path at this points, because unc paths are always absolute.
        path = _process.env['=' + resolvedDevice];
        // Verify that a drive-local cwd was found and that it actually points
        // to our drive. If not, default to the drive's root.
        if (!path || path.substr(0, 3).toLowerCase() !==
            resolvedDevice.toLowerCase() + '\\') {
          path = resolvedDevice + '\\';
        }
      }

      // Skip empty and invalid entries
      if (!util.isString(path)) {
        throw new TypeError('Arguments to path.resolve must be strings');
      } else if (!path) {
        continue;
      }

      var result = splitDeviceRe.exec(path),
          device = result[1] || '',
          isUnc = device && device.charAt(1) !== ':',
          isAbsolute = exports.isAbsolute(path),
          tail = result[3];

      if (device &&
          resolvedDevice &&
          device.toLowerCase() !== resolvedDevice.toLowerCase()) {
        // This path points to another device so it is not applicable
        continue;
      }

      if (!resolvedDevice) {
        resolvedDevice = device;
      }
      if (!resolvedAbsolute) {
        resolvedTail = tail + '\\' + resolvedTail;
        resolvedAbsolute = isAbsolute;
      }

      if (resolvedDevice && resolvedAbsolute) {
        break;
      }
    }

    // Convert slashes to backslashes when `resolvedDevice` points to an UNC
    // root. Also squash multiple slashes into a single one where appropriate.
    if (isUnc) {
      resolvedDevice = normalizeUNCRoot(resolvedDevice);
    }

    // At this point the path should be resolved to a full absolute path,
    // but handle relative paths to be safe (might happen when process.cwd()
    // fails)

    // Normalize the tail path

    function f(p) {
      return !!p;
    }

    resolvedTail = normalizeArray(resolvedTail.split(/[\\\/]+/).filter(f),
                                  !resolvedAbsolute).join('\\');

    return (resolvedDevice + (resolvedAbsolute ? '\\' : '') + resolvedTail) ||
           '.';
  };

  // windows version
  exports.normalize = function(path) {
    var result = splitDeviceRe.exec(path),
        device = result[1] || '',
        isUnc = device && device.charAt(1) !== ':',
        isAbsolute = exports.isAbsolute(path),
        tail = result[3],
        trailingSlash = /[\\\/]$/.test(tail);

    // If device is a drive letter, we'll normalize to lower case.
    if (device && device.charAt(1) === ':') {
      device = device[0].toLowerCase() + device.substr(1);
    }

    // Normalize the tail path
    tail = normalizeArray(tail.split(/[\\\/]+/).filter(function(p) {
      return !!p;
    }), !isAbsolute).join('\\');

    if (!tail && !isAbsolute) {
      tail = '.';
    }
    if (tail && trailingSlash) {
      tail += '\\';
    }

    // Convert slashes to backslashes when `device` points to an UNC root.
    // Also squash multiple slashes into a single one where appropriate.
    if (isUnc) {
      device = normalizeUNCRoot(device);
    }

    return device + (isAbsolute ? '\\' : '') + tail;
  };

  // windows version
  exports.isAbsolute = function(path) {
    var result = splitDeviceRe.exec(path),
        device = result[1] || '',
        isUnc = !!device && device.charAt(1) !== ':';
    // UNC paths are always absolute
    return !!result[2] || isUnc;
  };

  // windows version
  exports.join = function() {
    function f(p) {
      if (!util.isString(p)) {
        throw new TypeError('Arguments to path.join must be strings');
      }
      return p;
    }

    var paths = Array.prototype.filter.call(arguments, f);
    var joined = paths.join('\\');

    // Make sure that the joined path doesn't start with two slashes, because
    // normalize() will mistake it for an UNC path then.
    //
    // This step is skipped when it is very clear that the user actually
    // intended to point at an UNC path. This is assumed when the first
    // non-empty string arguments starts with exactly two slashes followed by
    // at least one more non-slash character.
    //
    // Note that for normalize() to treat a path as an UNC path it needs to
    // have at least 2 components, so we don't filter for that here.
    // This means that the user can use join to construct UNC paths from
    // a server name and a share name; for example:
    //   path.join('//server', 'share') -> '\\\\server\\share\')
    if (!/^[\\\/]{2}[^\\\/]/.test(paths[0])) {
      joined = joined.replace(/^[\\\/]{2,}/, '\\');
    }

    return exports.normalize(joined);
  };

  // path.relative(from, to)
  // it will solve the relative path from 'from' to 'to', for instance:
  // from = 'C:\\orandea\\test\\aaa'
  // to = 'C:\\orandea\\impl\\bbb'
  // The output of the function should be: '..\\..\\impl\\bbb'
  // windows version
  exports.relative = function(from, to) {
    from = exports.resolve(from);
    to = exports.resolve(to);

    // windows is not case sensitive
    var lowerFrom = from.toLowerCase();
    var lowerTo = to.toLowerCase();

    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== '') break;
      }

      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== '') break;
      }

      if (start > end) return [];
      return arr.slice(start, end + 1);
    }

    var toParts = trim(to.split('\\'));

    var lowerFromParts = trim(lowerFrom.split('\\'));
    var lowerToParts = trim(lowerTo.split('\\'));

    var length = Math.min(lowerFromParts.length, lowerToParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (lowerFromParts[i] !== lowerToParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    if (samePartsLength == 0) {
      return to;
    }

    var outputParts = [];
    for (var i = samePartsLength; i < lowerFromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('\\');
  };

  exports.sep = '\\';
  exports.delimiter = ';';

} else /* posix */ {

  // Split a filename into [root, dir, basename, ext], unix version
  // 'root' is just a slash, or nothing.
  var splitPathRe =
      /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  var splitPath = function(filename) {
    return splitPathRe.exec(filename).slice(1);
  };

  // path.resolve([from ...], to)
  // posix version
  exports.resolve = function() {
    var resolvedPath = '',
        resolvedAbsolute = false;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = (i >= 0) ? arguments[i] : _process.cwd();

      // Skip empty and invalid entries
      if (!util.isString(path)) {
        throw new TypeError('Arguments to path.resolve must be strings');
      } else if (!path) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charAt(0) === '/';
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeArray(resolvedPath.split('/').filter(function(p) {
      return !!p;
    }), !resolvedAbsolute).join('/');

    return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
  };

  // path.normalize(path)
  // posix version
  exports.normalize = function(path) {
    var isAbsolute = exports.isAbsolute(path),
        trailingSlash = path[path.length - 1] === '/',
        segments = path.split('/'),
        nonEmptySegments = [];

    // Normalize the path
    for (var i = 0; i < segments.length; i++) {
      if (segments[i]) {
        nonEmptySegments.push(segments[i]);
      }
    }
    path = normalizeArray(nonEmptySegments, !isAbsolute).join('/');

    if (!path && !isAbsolute) {
      path = '.';
    }
    if (path && trailingSlash) {
      path += '/';
    }

    return (isAbsolute ? '/' : '') + path;
  };

  // posix version
  exports.isAbsolute = function(path) {
    return path.charAt(0) === '/';
  };

  // posix version
  exports.join = function() {
    var path = '';
    for (var i = 0; i < arguments.length; i++) {
      var segment = arguments[i];
      if (!util.isString(segment)) {
        throw new TypeError('Arguments to path.join must be strings');
      }
      if (segment) {
        if (!path) {
          path += segment;
        } else {
          path += '/' + segment;
        }
      }
    }
    return exports.normalize(path);
  };


  // path.relative(from, to)
  // posix version
  exports.relative = function(from, to) {
    from = exports.resolve(from).substr(1);
    to = exports.resolve(to).substr(1);

    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== '') break;
      }

      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== '') break;
      }

      if (start > end) return [];
      return arr.slice(start, end + 1);
    }

    var fromParts = trim(from.split('/'));
    var toParts = trim(to.split('/'));

    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('/');
  };

  exports.sep = '/';
  exports.delimiter = ':';
}

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};


exports.exists = util.deprecate(function(path, callback) {
  if (Fs) Fs.exists(path, callback);
  else callback(false);
}, 'path.exists is now called `fs.exists`.');


exports.existsSync = util.deprecate(function(path) {
  if (Fs) return Fs.existsSync(path);
  else return false;
}, 'path.existsSync is now called `fs.existsSync`.');


if (isWindows) {
  exports._makeLong = function(path) {
    // Note: this will *probably* throw somewhere.
    if (!util.isString(path))
      return path;

    if (!path) {
      return '';
    }

    var resolvedPath = exports.resolve(path);

    if (/^[a-zA-Z]\:\\/.test(resolvedPath)) {
      // path is local filesystem path, which needs to be converted
      // to long UNC path.
      return '\\\\?\\' + resolvedPath;
    } else if (/^\\\\[^?.]/.test(resolvedPath)) {
      // path is network UNC path, which needs to be converted
      // to long UNC path.
      return '\\\\?\\UNC\\' + resolvedPath.substring(2);
    }

    return path;
  };
} else {
  exports._makeLong = function(path) {
    return path;
  };
}
}());
};
BundleModuleCode['term/alias']=function (module,exports,global,process){
/**
 * alias.js - terminfo/cap aliases for blessed.
 * https://github.com/chjj/blessed
 * Taken from terminfo(5) man page.
 */

/* jshint maxlen: 300 */
// jscs:disable maximumLineLength
// jscs:disable

var alias = exports;

// These are the boolean capabilities:
alias.bools = {
  //         Variable                                      Cap-                               TCap                                  Description
  //         Booleans                                      name                               Code
  'auto_left_margin':                                      ['bw',                                 'bw'], //                                cub1 wraps from col‐ umn 0 to last column
  'auto_right_margin':                                     ['am',                                 'am'], //                                terminal has auto‐ matic margins
  'back_color_erase':                                      ['bce',                                'ut'], //                                screen erased with background color
  'can_change':                                            ['ccc',                                'cc'], //                                terminal can re- define existing col‐ ors
  'ceol_standout_glitch':                                  ['xhp',                                'xs'], //                                standout not erased by overwriting (hp)
  'col_addr_glitch':                                       ['xhpa',                               'YA'], //                                only positive motion for hpa/mhpa caps
  'cpi_changes_res':                                       ['cpix',                               'YF'], //                                changing character pitch changes reso‐ lution
  'cr_cancels_micro_mode':                                 ['crxm',                               'YB'], //                                using cr turns off micro mode
  'dest_tabs_magic_smso':                                  ['xt',                                 'xt'], //                                tabs destructive, magic so char (t1061)
  'eat_newline_glitch':                                    ['xenl',                               'xn'], //                                newline ignored after 80 cols (con‐ cept)
  'erase_overstrike':                                      ['eo',                                 'eo'], //                                can erase over‐ strikes with a blank
  'generic_type':                                          ['gn',                                 'gn'], //                                generic line type
  'hard_copy':                                             ['hc',                                 'hc'], //                                hardcopy terminal
  'hard_cursor':                                           ['chts',                               'HC'], //                                cursor is hard to see
  'has_meta_key':                                          ['km',                                 'km'], //                                Has a meta key (i.e., sets 8th-bit)
  'has_print_wheel':                                       ['daisy',                              'YC'], //                                printer needs opera‐ tor to change char‐ acter set
  'has_status_line':                                       ['hs',                                 'hs'], //                                has extra status line
  'hue_lightness_saturation':                              ['hls',                                'hl'], //                                terminal uses only HLS color notation (Tektronix)
  'insert_null_glitch':                                    ['in',                                 'in'], //                                insert mode distin‐ guishes nulls
  'lpi_changes_res':                                       ['lpix',                               'YG'], //                                changing line pitch changes resolution
  'memory_above':                                          ['da',                                 'da'], //                                display may be retained above the screen
  'memory_below':                                          ['db',                                 'db'], //                                display may be retained below the screen
  'move_insert_mode':                                      ['mir',                                'mi'], //                                safe to move while in insert mode
  'move_standout_mode':                                    ['msgr',                               'ms'], //                                safe to move while in standout mode
  'needs_xon_xoff':                                        ['nxon',                               'nx'], //                                padding will not work, xon/xoff required
  'no_esc_ctlc':                                           ['xsb',                                'xb'], //                                beehive (f1=escape, f2=ctrl C)
  'no_pad_char':                                           ['npc',                                'NP'], //                                pad character does not exist
  'non_dest_scroll_region':                                ['ndscr',                              'ND'], //                                scrolling region is non-destructive
  'non_rev_rmcup':                                         ['nrrmc',                              'NR'], //                                smcup does not reverse rmcup
  'over_strike':                                           ['os',                                 'os'], //                                terminal can over‐ strike
  'prtr_silent':                                           ['mc5i',                               '5i'], //                                printer will not echo on screen
  'row_addr_glitch':                                       ['xvpa',                               'YD'], //                                only positive motion for vpa/mvpa caps
  'semi_auto_right_margin':                                ['sam',                                'YE'], //                                printing in last column causes cr
  'status_line_esc_ok':                                    ['eslok',                              'es'], //                                escape can be used on the status line
  'tilde_glitch':                                          ['hz',                                 'hz'], //                                cannot print ~'s (hazeltine)
  'transparent_underline':                                 ['ul',                                 'ul'], //                                underline character overstrikes
  'xon_xoff':                                              ['xon',                                'xo']  //                                terminal uses xon/xoff handshaking
};

// These are the numeric capabilities:
alias.numbers = {
  //         Variable                                      Cap-                               TCap                                  Description
  //          Numeric                                      name                               Code
  'columns':                                               ['cols',                               'co'], //                                number of columns in a line
  'init_tabs':                                             ['it',                                 'it'], //                                tabs initially every # spaces
  'label_height':                                          ['lh',                                 'lh'], //                                rows in each label
  'label_width':                                           ['lw',                                 'lw'], //                                columns in each label
  'lines':                                                 ['lines',                              'li'], //                                number of lines on screen or page
  'lines_of_memory':                                       ['lm',                                 'lm'], //                                lines of memory if > line. 0 means varies
  'magic_cookie_glitch':                                   ['xmc',                                'sg'], //                                number of blank characters left by smso or rmso
  'max_attributes':                                        ['ma',                                 'ma'], //                                maximum combined attributes terminal can handle
  'max_colors':                                            ['colors',                             'Co'], //                                maximum number of colors on screen
  'max_pairs':                                             ['pairs',                              'pa'], //                                maximum number of color-pairs on the screen
  'maximum_windows':                                       ['wnum',                               'MW'], //                                maximum number of defineable windows
  'no_color_video':                                        ['ncv',                                'NC'], //                                video attributes that cannot be used with colors
  'num_labels':                                            ['nlab',                               'Nl'], //                                number of labels on screen
  'padding_baud_rate':                                     ['pb',                                 'pb'], //                                lowest baud rate where padding needed
  'virtual_terminal':                                      ['vt',                                 'vt'], //                                virtual terminal number (CB/unix)
  'width_status_line':                                     ['wsl',                                'ws'], //                                number of columns in status line

  // The  following  numeric  capabilities  are present in the SVr4.0 term structure, but are not yet documented in the man page.  They came in with
  // SVr4's printer support.


  //         Variable                                      Cap-                               TCap                                  Description
  //          Numeric                                      name                               Code
  'bit_image_entwining':                                   ['bitwin',                             'Yo'], //                                number of passes for each bit-image row
  'bit_image_type':                                        ['bitype',                             'Yp'], //                                type of bit-image device
  'buffer_capacity':                                       ['bufsz',                              'Ya'], //                                numbers of bytes buffered before printing
  'buttons':                                               ['btns',                               'BT'], //                                number of buttons on mouse
  'dot_horz_spacing':                                      ['spinh',                              'Yc'], //                                spacing of dots hor‐ izontally in dots per inch
  'dot_vert_spacing':                                      ['spinv',                              'Yb'], //                                spacing of pins ver‐ tically in pins per inch
  'max_micro_address':                                     ['maddr',                              'Yd'], //                                maximum value in micro_..._address
  'max_micro_jump':                                        ['mjump',                              'Ye'], //                                maximum value in parm_..._micro
  'micro_col_size':                                        ['mcs',                                'Yf'], //                                character step size when in micro mode
  'micro_line_size':                                       ['mls',                                'Yg'], //                                line step size when in micro mode
  'number_of_pins':                                        ['npins',                              'Yh'], //                                numbers of pins in print-head
  'output_res_char':                                       ['orc',                                'Yi'], //                                horizontal resolu‐ tion in units per line
  'output_res_horz_inch':                                  ['orhi',                               'Yk'], //                                horizontal resolu‐ tion in units per inch
  'output_res_line':                                       ['orl',                                'Yj'], //                                vertical resolution in units per line
  'output_res_vert_inch':                                  ['orvi',                               'Yl'], //                                vertical resolution in units per inch
  'print_rate':                                            ['cps',                                'Ym'], //                                print rate in char‐ acters per second
  'wide_char_size':                                        ['widcs',                              'Yn']  //                                character step size when in double wide mode
};

// These are the string capabilities:
alias.strings = {
  //         Variable                                    Cap-                             TCap                                   Description
  //          String                                     name                             Code
  'acs_chars':                                           ['acsc',                             'ac'], //                              graphics charset pairs, based on vt100
  'back_tab':                                            ['cbt',                              'bt'], //                              back tab (P)
  'bell':                                                ['bel',                              'bl'], //                              audible signal (bell) (P)
  'carriage_return':                                     ['cr',                               'cr'], //                              carriage return (P*) (P*)
  'change_char_pitch':                                   ['cpi',                              'ZA'], //                              Change number of characters per inch to #1
  'change_line_pitch':                                   ['lpi',                              'ZB'], //                              Change number of lines per inch to #1
  'change_res_horz':                                     ['chr',                              'ZC'], //                              Change horizontal resolution to #1
  'change_res_vert':                                     ['cvr',                              'ZD'], //                              Change vertical res‐ olution to #1
  'change_scroll_region':                                ['csr',                              'cs'], //                              change region to line #1 to line #2 (P)
  'char_padding':                                        ['rmp',                              'rP'], //                              like ip but when in insert mode
  'clear_all_tabs':                                      ['tbc',                              'ct'], //                              clear all tab stops (P)
  'clear_margins':                                       ['mgc',                              'MC'], //                              clear right and left soft margins
  'clear_screen':                                        ['clear',                            'cl'], //                              clear screen and home cursor (P*)
  'clr_bol':                                             ['el1',                              'cb'], //                              Clear to beginning of line
  'clr_eol':                                             ['el',                               'ce'], //                              clear to end of line (P)
  'clr_eos':                                             ['ed',                               'cd'], //                              clear to end of screen (P*)
  'column_address':                                      ['hpa',                              'ch'], //                              horizontal position #1, absolute (P)
  'command_character':                                   ['cmdch',                            'CC'], //                              terminal settable cmd character in prototype !?
  'create_window':                                       ['cwin',                             'CW'], //                              define a window #1 from #2,#3 to #4,#5
  'cursor_address':                                      ['cup',                              'cm'], //                              move to row #1 col‐ umns #2
  'cursor_down':                                         ['cud1',                             'do'], //                              down one line
  'cursor_home':                                         ['home',                             'ho'], //                              home cursor (if no cup)
  'cursor_invisible':                                    ['civis',                            'vi'], //                              make cursor invisi‐ ble
  'cursor_left':                                         ['cub1',                             'le'], //                              move left one space
  'cursor_mem_address':                                  ['mrcup',                            'CM'], //                              memory relative cur‐ sor addressing, move to row #1 columns #2
  'cursor_normal':                                       ['cnorm',                            've'], //                              make cursor appear normal (undo civis/cvvis)
  'cursor_right':                                        ['cuf1',                             'nd'], //                              non-destructive space (move right one space)
  'cursor_to_ll':                                        ['ll',                               'll'], //                              last line, first column (if no cup)
  'cursor_up':                                           ['cuu1',                             'up'], //                              up one line
  'cursor_visible':                                      ['cvvis',                            'vs'], //                              make cursor very visible
  'define_char':                                         ['defc',                             'ZE'], //                              Define a character #1, #2 dots wide, descender #3
  'delete_character':                                    ['dch1',                             'dc'], //                              delete character (P*)
  'delete_line':                                         ['dl1',                              'dl'], //                              delete line (P*)
  'dial_phone':                                          ['dial',                             'DI'], //                              dial number #1
  'dis_status_line':                                     ['dsl',                              'ds'], //                              disable status line
  'display_clock':                                       ['dclk',                             'DK'], //                              display clock
  'down_half_line':                                      ['hd',                               'hd'], //                              half a line down
  'ena_acs':                                             ['enacs',                            'eA'], //                              enable alternate char set
  'enter_alt_charset_mode':                              ['smacs',                            'as'], //                              start alternate character set (P)
  'enter_am_mode':                                       ['smam',                             'SA'], //                              turn on automatic margins
  'enter_blink_mode':                                    ['blink',                            'mb'], //                              turn on blinking
  'enter_bold_mode':                                     ['bold',                             'md'], //                              turn on bold (extra bright) mode
  'enter_ca_mode':                                       ['smcup',                            'ti'], //                              string to start pro‐ grams using cup
  'enter_delete_mode':                                   ['smdc',                             'dm'], //                              enter delete mode
  'enter_dim_mode':                                      ['dim',                              'mh'], //                              turn on half-bright mode
  'enter_doublewide_mode':                               ['swidm',                            'ZF'], //                              Enter double-wide mode
  'enter_draft_quality':                                 ['sdrfq',                            'ZG'], //                              Enter draft-quality mode
  'enter_insert_mode':                                   ['smir',                             'im'], //                              enter insert mode
  'enter_italics_mode':                                  ['sitm',                             'ZH'], //                              Enter italic mode
  'enter_leftward_mode':                                 ['slm',                              'ZI'], //                              Start leftward car‐ riage motion
  'enter_micro_mode':                                    ['smicm',                            'ZJ'], //                              Start micro-motion mode
  'enter_near_letter_quality':                           ['snlq',                             'ZK'], //                              Enter NLQ mode
  'enter_normal_quality':                                ['snrmq',                            'ZL'], //                              Enter normal-quality mode
  'enter_protected_mode':                                ['prot',                             'mp'], //                              turn on protected mode
  'enter_reverse_mode':                                  ['rev',                              'mr'], //                              turn on reverse video mode
  'enter_secure_mode':                                   ['invis',                            'mk'], //                              turn on blank mode (characters invisi‐ ble)
  'enter_shadow_mode':                                   ['sshm',                             'ZM'], //                              Enter shadow-print mode
  'enter_standout_mode':                                 ['smso',                             'so'], //                              begin standout mode
  'enter_subscript_mode':                                ['ssubm',                            'ZN'], //                              Enter subscript mode
  'enter_superscript_mode':                              ['ssupm',                            'ZO'], //                              Enter superscript mode
  'enter_underline_mode':                                ['smul',                             'us'], //                              begin underline mode
  'enter_upward_mode':                                   ['sum',                              'ZP'], //                              Start upward car‐ riage motion
  'enter_xon_mode':                                      ['smxon',                            'SX'], //                              turn on xon/xoff handshaking
  'erase_chars':                                         ['ech',                              'ec'], //                              erase #1 characters (P)
  'exit_alt_charset_mode':                               ['rmacs',                            'ae'], //                              end alternate char‐ acter set (P)
  'exit_am_mode':                                        ['rmam',                             'RA'], //                              turn off automatic margins
  'exit_attribute_mode':                                 ['sgr0',                             'me'], //                              turn off all attributes
  'exit_ca_mode':                                        ['rmcup',                            'te'], //                              strings to end pro‐ grams using cup
  'exit_delete_mode':                                    ['rmdc',                             'ed'], //                              end delete mode
  'exit_doublewide_mode':                                ['rwidm',                            'ZQ'], //                              End double-wide mode
  'exit_insert_mode':                                    ['rmir',                             'ei'], //                              exit insert mode
  'exit_italics_mode':                                   ['ritm',                             'ZR'], //                              End italic mode
  'exit_leftward_mode':                                  ['rlm',                              'ZS'], //                              End left-motion mode


  'exit_micro_mode':                                     ['rmicm',                            'ZT'], //                              End micro-motion mode
  'exit_shadow_mode':                                    ['rshm',                             'ZU'], //                              End shadow-print mode
  'exit_standout_mode':                                  ['rmso',                             'se'], //                              exit standout mode
  'exit_subscript_mode':                                 ['rsubm',                            'ZV'], //                              End subscript mode
  'exit_superscript_mode':                               ['rsupm',                            'ZW'], //                              End superscript mode
  'exit_underline_mode':                                 ['rmul',                             'ue'], //                              exit underline mode
  'exit_upward_mode':                                    ['rum',                              'ZX'], //                              End reverse charac‐ ter motion
  'exit_xon_mode':                                       ['rmxon',                            'RX'], //                              turn off xon/xoff handshaking
  'fixed_pause':                                         ['pause',                            'PA'], //                              pause for 2-3 sec‐ onds
  'flash_hook':                                          ['hook',                             'fh'], //                              flash switch hook
  'flash_screen':                                        ['flash',                            'vb'], //                              visible bell (may not move cursor)
  'form_feed':                                           ['ff',                               'ff'], //                              hardcopy terminal page eject (P*)
  'from_status_line':                                    ['fsl',                              'fs'], //                              return from status line
  'goto_window':                                         ['wingo',                            'WG'], //                              go to window #1
  'hangup':                                              ['hup',                              'HU'], //                              hang-up phone
  'init_1string':                                        ['is1',                              'i1'], //                              initialization string
  'init_2string':                                        ['is2',                              'is'], //                              initialization string
  'init_3string':                                        ['is3',                              'i3'], //                              initialization string
  'init_file':                                           ['if',                               'if'], //                              name of initializa‐ tion file
  'init_prog':                                           ['iprog',                            'iP'], //                              path name of program for initialization
  'initialize_color':                                    ['initc',                            'Ic'], //                              initialize color #1 to (#2,#3,#4)
  'initialize_pair':                                     ['initp',                            'Ip'], //                              Initialize color pair #1 to fg=(#2,#3,#4), bg=(#5,#6,#7)
  'insert_character':                                    ['ich1',                             'ic'], //                              insert character (P)
  'insert_line':                                         ['il1',                              'al'], //                              insert line (P*)
  'insert_padding':                                      ['ip',                               'ip'], //                              insert padding after inserted character
  'key_a1':                                              ['ka1',                              'K1'], //                              upper left of keypad
  'key_a3':                                              ['ka3',                              'K3'], //                              upper right of key‐ pad
  'key_b2':                                              ['kb2',                              'K2'], //                              center of keypad
  'key_backspace':                                       ['kbs',                              'kb'], //                              backspace key
  'key_beg':                                             ['kbeg',                             '@1'], //                              begin key
  'key_btab':                                            ['kcbt',                             'kB'], //                              back-tab key
  'key_c1':                                              ['kc1',                              'K4'], //                              lower left of keypad
  'key_c3':                                              ['kc3',                              'K5'], //                              lower right of key‐ pad
  'key_cancel':                                          ['kcan',                             '@2'], //                              cancel key
  'key_catab':                                           ['ktbc',                             'ka'], //                              clear-all-tabs key
  'key_clear':                                           ['kclr',                             'kC'], //                              clear-screen or erase key
  'key_close':                                           ['kclo',                             '@3'], //                              close key
  'key_command':                                         ['kcmd',                             '@4'], //                              command key
  'key_copy':                                            ['kcpy',                             '@5'], //                              copy key
  'key_create':                                          ['kcrt',                             '@6'], //                              create key
  'key_ctab':                                            ['kctab',                            'kt'], //                              clear-tab key
  'key_dc':                                              ['kdch1',                            'kD'], //                              delete-character key
  'key_dl':                                              ['kdl1',                             'kL'], //                              delete-line key
  'key_down':                                            ['kcud1',                            'kd'], //                              down-arrow key

  'key_eic':                                             ['krmir',                            'kM'], //                              sent by rmir or smir in insert mode
  'key_end':                                             ['kend',                             '@7'], //                              end key
  'key_enter':                                           ['kent',                             '@8'], //                              enter/send key
  'key_eol':                                             ['kel',                              'kE'], //                              clear-to-end-of-line key
  'key_eos':                                             ['ked',                              'kS'], //                              clear-to-end-of- screen key
  'key_exit':                                            ['kext',                             '@9'], //                              exit key
  'key_f0':                                              ['kf0',                              'k0'], //                              F0 function key
  'key_f1':                                              ['kf1',                              'k1'], //                              F1 function key
  'key_f10':                                             ['kf10',                             'k;'], //                              F10 function key
  'key_f11':                                             ['kf11',                             'F1'], //                              F11 function key
  'key_f12':                                             ['kf12',                             'F2'], //                              F12 function key
  'key_f13':                                             ['kf13',                             'F3'], //                              F13 function key
  'key_f14':                                             ['kf14',                             'F4'], //                              F14 function key
  'key_f15':                                             ['kf15',                             'F5'], //                              F15 function key
  'key_f16':                                             ['kf16',                             'F6'], //                              F16 function key
  'key_f17':                                             ['kf17',                             'F7'], //                              F17 function key
  'key_f18':                                             ['kf18',                             'F8'], //                              F18 function key
  'key_f19':                                             ['kf19',                             'F9'], //                              F19 function key
  'key_f2':                                              ['kf2',                              'k2'], //                              F2 function key
  'key_f20':                                             ['kf20',                             'FA'], //                              F20 function key
  'key_f21':                                             ['kf21',                             'FB'], //                              F21 function key
  'key_f22':                                             ['kf22',                             'FC'], //                              F22 function key
  'key_f23':                                             ['kf23',                             'FD'], //                              F23 function key
  'key_f24':                                             ['kf24',                             'FE'], //                              F24 function key
  'key_f25':                                             ['kf25',                             'FF'], //                              F25 function key
  'key_f26':                                             ['kf26',                             'FG'], //                              F26 function key
  'key_f27':                                             ['kf27',                             'FH'], //                              F27 function key
  'key_f28':                                             ['kf28',                             'FI'], //                              F28 function key
  'key_f29':                                             ['kf29',                             'FJ'], //                              F29 function key
  'key_f3':                                              ['kf3',                              'k3'], //                              F3 function key
  'key_f30':                                             ['kf30',                             'FK'], //                              F30 function key
  'key_f31':                                             ['kf31',                             'FL'], //                              F31 function key
  'key_f32':                                             ['kf32',                             'FM'], //                              F32 function key
  'key_f33':                                             ['kf33',                             'FN'], //                              F33 function key
  'key_f34':                                             ['kf34',                             'FO'], //                              F34 function key
  'key_f35':                                             ['kf35',                             'FP'], //                              F35 function key
  'key_f36':                                             ['kf36',                             'FQ'], //                              F36 function key
  'key_f37':                                             ['kf37',                             'FR'], //                              F37 function key
  'key_f38':                                             ['kf38',                             'FS'], //                              F38 function key
  'key_f39':                                             ['kf39',                             'FT'], //                              F39 function key
  'key_f4':                                              ['kf4',                              'k4'], //                              F4 function key
  'key_f40':                                             ['kf40',                             'FU'], //                              F40 function key
  'key_f41':                                             ['kf41',                             'FV'], //                              F41 function key
  'key_f42':                                             ['kf42',                             'FW'], //                              F42 function key
  'key_f43':                                             ['kf43',                             'FX'], //                              F43 function key
  'key_f44':                                             ['kf44',                             'FY'], //                              F44 function key
  'key_f45':                                             ['kf45',                             'FZ'], //                              F45 function key
  'key_f46':                                             ['kf46',                             'Fa'], //                              F46 function key
  'key_f47':                                             ['kf47',                             'Fb'], //                              F47 function key
  'key_f48':                                             ['kf48',                             'Fc'], //                              F48 function key
  'key_f49':                                             ['kf49',                             'Fd'], //                              F49 function key
  'key_f5':                                              ['kf5',                              'k5'], //                              F5 function key
  'key_f50':                                             ['kf50',                             'Fe'], //                              F50 function key
  'key_f51':                                             ['kf51',                             'Ff'], //                              F51 function key
  'key_f52':                                             ['kf52',                             'Fg'], //                              F52 function key
  'key_f53':                                             ['kf53',                             'Fh'], //                              F53 function key
  'key_f54':                                             ['kf54',                             'Fi'], //                              F54 function key
  'key_f55':                                             ['kf55',                             'Fj'], //                              F55 function key
  'key_f56':                                             ['kf56',                             'Fk'], //                              F56 function key
  'key_f57':                                             ['kf57',                             'Fl'], //                              F57 function key
  'key_f58':                                             ['kf58',                             'Fm'], //                              F58 function key
  'key_f59':                                             ['kf59',                             'Fn'], //                              F59 function key

  'key_f6':                                              ['kf6',                              'k6'], //                              F6 function key
  'key_f60':                                             ['kf60',                             'Fo'], //                              F60 function key
  'key_f61':                                             ['kf61',                             'Fp'], //                              F61 function key
  'key_f62':                                             ['kf62',                             'Fq'], //                              F62 function key
  'key_f63':                                             ['kf63',                             'Fr'], //                              F63 function key
  'key_f7':                                              ['kf7',                              'k7'], //                              F7 function key
  'key_f8':                                              ['kf8',                              'k8'], //                              F8 function key
  'key_f9':                                              ['kf9',                              'k9'], //                              F9 function key
  'key_find':                                            ['kfnd',                             '@0'], //                              find key
  'key_help':                                            ['khlp',                             '%1'], //                              help key
  'key_home':                                            ['khome',                            'kh'], //                              home key
  'key_ic':                                              ['kich1',                            'kI'], //                              insert-character key
  'key_il':                                              ['kil1',                             'kA'], //                              insert-line key
  'key_left':                                            ['kcub1',                            'kl'], //                              left-arrow key
  'key_ll':                                              ['kll',                              'kH'], //                              lower-left key (home down)
  'key_mark':                                            ['kmrk',                             '%2'], //                              mark key
  'key_message':                                         ['kmsg',                             '%3'], //                              message key
  'key_move':                                            ['kmov',                             '%4'], //                              move key
  'key_next':                                            ['knxt',                             '%5'], //                              next key
  'key_npage':                                           ['knp',                              'kN'], //                              next-page key
  'key_open':                                            ['kopn',                             '%6'], //                              open key
  'key_options':                                         ['kopt',                             '%7'], //                              options key
  'key_ppage':                                           ['kpp',                              'kP'], //                              previous-page key
  'key_previous':                                        ['kprv',                             '%8'], //                              previous key
  'key_print':                                           ['kprt',                             '%9'], //                              print key
  'key_redo':                                            ['krdo',                             '%0'], //                              redo key
  'key_reference':                                       ['kref',                             '&1'], //                              reference key
  'key_refresh':                                         ['krfr',                             '&2'], //                              refresh key
  'key_replace':                                         ['krpl',                             '&3'], //                              replace key
  'key_restart':                                         ['krst',                             '&4'], //                              restart key
  'key_resume':                                          ['kres',                             '&5'], //                              resume key
  'key_right':                                           ['kcuf1',                            'kr'], //                              right-arrow key
  'key_save':                                            ['ksav',                             '&6'], //                              save key
  'key_sbeg':                                            ['kBEG',                             '&9'], //                              shifted begin key
  'key_scancel':                                         ['kCAN',                             '&0'], //                              shifted cancel key
  'key_scommand':                                        ['kCMD',                             '*1'], //                              shifted command key
  'key_scopy':                                           ['kCPY',                             '*2'], //                              shifted copy key
  'key_screate':                                         ['kCRT',                             '*3'], //                              shifted create key
  'key_sdc':                                             ['kDC',                              '*4'], //                              shifted delete-char‐ acter key
  'key_sdl':                                             ['kDL',                              '*5'], //                              shifted delete-line key
  'key_select':                                          ['kslt',                             '*6'], //                              select key
  'key_send':                                            ['kEND',                             '*7'], //                              shifted end key
  'key_seol':                                            ['kEOL',                             '*8'], //                              shifted clear-to- end-of-line key
  'key_sexit':                                           ['kEXT',                             '*9'], //                              shifted exit key
  'key_sf':                                              ['kind',                             'kF'], //                              scroll-forward key
  'key_sfind':                                           ['kFND',                             '*0'], //                              shifted find key
  'key_shelp':                                           ['kHLP',                             '#1'], //                              shifted help key
  'key_shome':                                           ['kHOM',                             '#2'], //                              shifted home key
  'key_sic':                                             ['kIC',                              '#3'], //                              shifted insert-char‐ acter key
  'key_sleft':                                           ['kLFT',                             '#4'], //                              shifted left-arrow key
  'key_smessage':                                        ['kMSG',                             '%a'], //                              shifted message key
  'key_smove':                                           ['kMOV',                             '%b'], //                              shifted move key
  'key_snext':                                           ['kNXT',                             '%c'], //                              shifted next key
  'key_soptions':                                        ['kOPT',                             '%d'], //                              shifted options key
  'key_sprevious':                                       ['kPRV',                             '%e'], //                              shifted previous key
  'key_sprint':                                          ['kPRT',                             '%f'], //                              shifted print key
  'key_sr':                                              ['kri',                              'kR'], //                              scroll-backward key
  'key_sredo':                                           ['kRDO',                             '%g'], //                              shifted redo key
  'key_sreplace':                                        ['kRPL',                             '%h'], //                              shifted replace key

  'key_sright':                                          ['kRIT',                             '%i'], //                              shifted right-arrow key
  'key_srsume':                                          ['kRES',                             '%j'], //                              shifted resume key
  'key_ssave':                                           ['kSAV',                             '!1'], //                              shifted save key
  'key_ssuspend':                                        ['kSPD',                             '!2'], //                              shifted suspend key
  'key_stab':                                            ['khts',                             'kT'], //                              set-tab key
  'key_sundo':                                           ['kUND',                             '!3'], //                              shifted undo key
  'key_suspend':                                         ['kspd',                             '&7'], //                              suspend key
  'key_undo':                                            ['kund',                             '&8'], //                              undo key
  'key_up':                                              ['kcuu1',                            'ku'], //                              up-arrow key
  'keypad_local':                                        ['rmkx',                             'ke'], //                              leave 'key‐ board_transmit' mode
  'keypad_xmit':                                         ['smkx',                             'ks'], //                              enter 'key‐ board_transmit' mode
  'lab_f0':                                              ['lf0',                              'l0'], //                              label on function key f0 if not f0
  'lab_f1':                                              ['lf1',                              'l1'], //                              label on function key f1 if not f1
  'lab_f10':                                             ['lf10',                             'la'], //                              label on function key f10 if not f10
  'lab_f2':                                              ['lf2',                              'l2'], //                              label on function key f2 if not f2
  'lab_f3':                                              ['lf3',                              'l3'], //                              label on function key f3 if not f3
  'lab_f4':                                              ['lf4',                              'l4'], //                              label on function key f4 if not f4
  'lab_f5':                                              ['lf5',                              'l5'], //                              label on function key f5 if not f5
  'lab_f6':                                              ['lf6',                              'l6'], //                              label on function key f6 if not f6
  'lab_f7':                                              ['lf7',                              'l7'], //                              label on function key f7 if not f7
  'lab_f8':                                              ['lf8',                              'l8'], //                              label on function key f8 if not f8
  'lab_f9':                                              ['lf9',                              'l9'], //                              label on function key f9 if not f9
  'label_format':                                        ['fln',                              'Lf'], //                              label format
  'label_off':                                           ['rmln',                             'LF'], //                              turn off soft labels
  'label_on':                                            ['smln',                             'LO'], //                              turn on soft labels
  'meta_off':                                            ['rmm',                              'mo'], //                              turn off meta mode
  'meta_on':                                             ['smm',                              'mm'], //                              turn on meta mode (8th-bit on)
  'micro_column_address':                                ['mhpa',                             'ZY'], //                              Like column_address in micro mode
  'micro_down':                                          ['mcud1',                            'ZZ'], //                              Like cursor_down in micro mode
  'micro_left':                                          ['mcub1',                            'Za'], //                              Like cursor_left in micro mode
  'micro_right':                                         ['mcuf1',                            'Zb'], //                              Like cursor_right in micro mode
  'micro_row_address':                                   ['mvpa',                             'Zc'], //                              Like row_address #1 in micro mode
  'micro_up':                                            ['mcuu1',                            'Zd'], //                              Like cursor_up in micro mode
  'newline':                                             ['nel',                              'nw'], //                              newline (behave like cr followed by lf)
  'order_of_pins':                                       ['porder',                           'Ze'], //                              Match software bits to print-head pins
  'orig_colors':                                         ['oc',                               'oc'], //                              Set all color pairs to the original ones
  'orig_pair':                                           ['op',                               'op'], //                              Set default pair to its original value
  'pad_char':                                            ['pad',                              'pc'], //                              padding char (instead of null)


  'parm_dch':                                            ['dch',                              'DC'], //                              delete #1 characters (P*)
  'parm_delete_line':                                    ['dl',                               'DL'], //                              delete #1 lines (P*)
  'parm_down_cursor':                                    ['cud',                              'DO'], //                              down #1 lines (P*)
  'parm_down_micro':                                     ['mcud',                             'Zf'], //                              Like parm_down_cur‐ sor in micro mode
  'parm_ich':                                            ['ich',                              'IC'], //                              insert #1 characters (P*)
  'parm_index':                                          ['indn',                             'SF'], //                              scroll forward #1 lines (P)
  'parm_insert_line':                                    ['il',                               'AL'], //                              insert #1 lines (P*)
  'parm_left_cursor':                                    ['cub',                              'LE'], //                              move #1 characters to the left (P)
  'parm_left_micro':                                     ['mcub',                             'Zg'], //                              Like parm_left_cur‐ sor in micro mode
  'parm_right_cursor':                                   ['cuf',                              'RI'], //                              move #1 characters to the right (P*)
  'parm_right_micro':                                    ['mcuf',                             'Zh'], //                              Like parm_right_cur‐ sor in micro mode
  'parm_rindex':                                         ['rin',                              'SR'], //                              scroll back #1 lines (P)
  'parm_up_cursor':                                      ['cuu',                              'UP'], //                              up #1 lines (P*)
  'parm_up_micro':                                       ['mcuu',                             'Zi'], //                              Like parm_up_cursor in micro mode
  'pkey_key':                                            ['pfkey',                            'pk'], //                              program function key #1 to type string #2
  'pkey_local':                                          ['pfloc',                            'pl'], //                              program function key #1 to execute string #2
  'pkey_xmit':                                           ['pfx',                              'px'], //                              program function key #1 to transmit string #2
  'plab_norm':                                           ['pln',                              'pn'], //                              program label #1 to show string #2
  'print_screen':                                        ['mc0',                              'ps'], //                              print contents of screen
  'prtr_non':                                            ['mc5p',                             'pO'], //                              turn on printer for #1 bytes
  'prtr_off':                                            ['mc4',                              'pf'], //                              turn off printer
  'prtr_on':                                             ['mc5',                              'po'], //                              turn on printer
  'pulse':                                               ['pulse',                            'PU'], //                              select pulse dialing
  'quick_dial':                                          ['qdial',                            'QD'], //                              dial number #1 with‐ out checking
  'remove_clock':                                        ['rmclk',                            'RC'], //                              remove clock
  'repeat_char':                                         ['rep',                              'rp'], //                              repeat char #1 #2 times (P*)
  'req_for_input':                                       ['rfi',                              'RF'], //                              send next input char (for ptys)
  'reset_1string':                                       ['rs1',                              'r1'], //                              reset string
  'reset_2string':                                       ['rs2',                              'r2'], //                              reset string
  'reset_3string':                                       ['rs3',                              'r3'], //                              reset string
  'reset_file':                                          ['rf',                               'rf'], //                              name of reset file
  'restore_cursor':                                      ['rc',                               'rc'], //                              restore cursor to position of last save_cursor
  'row_address':                                         ['vpa',                              'cv'], //                              vertical position #1 absolute (P)
  'save_cursor':                                         ['sc',                               'sc'], //                              save current cursor position (P)
  'scroll_forward':                                      ['ind',                              'sf'], //                              scroll text up (P)
  'scroll_reverse':                                      ['ri',                               'sr'], //                              scroll text down (P)
  'select_char_set':                                     ['scs',                              'Zj'], //                              Select character set, #1



  'set_attributes':                                      ['sgr',                              'sa'], //                              define video attributes #1-#9 (PG9)
  'set_background':                                      ['setb',                             'Sb'], //                              Set background color #1
  'set_bottom_margin':                                   ['smgb',                             'Zk'], //                              Set bottom margin at current line
  'set_bottom_margin_parm':                              ['smgbp',                            'Zl'], //                              Set bottom margin at line #1 or (if smgtp is not given) #2 lines from bottom
  'set_clock':                                           ['sclk',                             'SC'], //                              set clock, #1 hrs #2 mins #3 secs
  'set_color_pair':                                      ['scp',                              'sp'], //                              Set current color pair to #1
  'set_foreground':                                      ['setf',                             'Sf'], //                              Set foreground color #1
  'set_left_margin':                                     ['smgl',                             'ML'], //                              set left soft margin at current col‐ umn.  See smgl. (ML is not in BSD termcap).
  'set_left_margin_parm':                                ['smglp',                            'Zm'], //                              Set left (right) margin at column #1
  'set_right_margin':                                    ['smgr',                             'MR'], //                              set right soft margin at current column
  'set_right_margin_parm':                               ['smgrp',                            'Zn'], //                              Set right margin at column #1
  'set_tab':                                             ['hts',                              'st'], //                              set a tab in every row, current columns
  'set_top_margin':                                      ['smgt',                             'Zo'], //                              Set top margin at current line
  'set_top_margin_parm':                                 ['smgtp',                            'Zp'], //                              Set top (bottom) margin at row #1
  'set_window':                                          ['wind',                             'wi'], //                              current window is lines #1-#2 cols #3-#4
  'start_bit_image':                                     ['sbim',                             'Zq'], //                              Start printing bit image graphics
  'start_char_set_def':                                  ['scsd',                             'Zr'], //                              Start character set defi‐ nition #1, with #2 charac‐ ters in the set
  'stop_bit_image':                                      ['rbim',                             'Zs'], //                              Stop printing bit image graphics
  'stop_char_set_def':                                   ['rcsd',                             'Zt'], //                              End definition of charac‐ ter set #1
  'subscript_characters':                                ['subcs',                            'Zu'], //                              List of subscriptable characters
  'superscript_characters':                              ['supcs',                            'Zv'], //                              List of superscriptable characters
  'tab':                                                 ['ht',                               'ta'], //                              tab to next 8-space hard‐ ware tab stop
  'these_cause_cr':                                      ['docr',                             'Zw'], //                              Printing any of these characters causes CR
  'to_status_line':                                      ['tsl',                              'ts'], //                              move to status line, col‐ umn #1
  'tone':                                                ['tone',                             'TO'], //                              select touch tone dialing
  'underline_char':                                      ['uc',                               'uc'], //                              underline char and move past it
  'up_half_line':                                        ['hu',                               'hu'], //                              half a line up
  'user0':                                               ['u0',                               'u0'], //                              User string #0
  'user1':                                               ['u1',                               'u1'], //                              User string #1
  'user2':                                               ['u2',                               'u2'], //                              User string #2
  'user3':                                               ['u3',                               'u3'], //                              User string #3
  'user4':                                               ['u4',                               'u4'], //                              User string #4
  'user5':                                               ['u5',                               'u5'], //                              User string #5

  'user6':                                               ['u6',                               'u6'], //                              User string #6
  'user7':                                               ['u7',                               'u7'], //                              User string #7
  'user8':                                               ['u8',                               'u8'], //                              User string #8
  'user9':                                               ['u9',                               'u9'], //                              User string #9
  'wait_tone':                                           ['wait',                             'WA'], //                              wait for dial-tone
  'xoff_character':                                      ['xoffc',                            'XF'], //                              XOFF character
  'xon_character':                                       ['xonc',                             'XN'], //                              XON character
  'zero_motion':                                         ['zerom',                            'Zx'], //                              No motion for subsequent character

  // The following string capabilities are present in the SVr4.0 term structure, but were originally not documented in the man page.


  //         Variable                                      Cap-                                 TCap                                 Description
  //          String                                       name                                 Code
  'alt_scancode_esc':                                      ['scesa',                                'S8'], //                                Alternate escape for scancode emu‐ lation
  'bit_image_carriage_return':                             ['bicr',                                 'Yv'], //                                Move to beginning of same row
  'bit_image_newline':                                     ['binel',                                'Zz'], //                                Move to next row of the bit image
  'bit_image_repeat':                                      ['birep',                                'Xy'], //                                Repeat bit image cell #1 #2 times
  'char_set_names':                                        ['csnm',                                 'Zy'], //                                Produce #1'th item from list of char‐ acter set names
  'code_set_init':                                         ['csin',                                 'ci'], //                                Init sequence for multiple codesets
  'color_names':                                           ['colornm',                              'Yw'], //                                Give name for color #1
  'define_bit_image_region':                               ['defbi',                                'Yx'], //                                Define rectan‐ gualar bit image region
  'device_type':                                           ['devt',                                 'dv'], //                                Indicate lan‐ guage/codeset sup‐ port
  'display_pc_char':                                       ['dispc',                                'S1'], //                                Display PC charac‐ ter #1
  'end_bit_image_region':                                  ['endbi',                                'Yy'], //                                End a bit-image region
  'enter_pc_charset_mode':                                 ['smpch',                                'S2'], //                                Enter PC character display mode
  'enter_scancode_mode':                                   ['smsc',                                 'S4'], //                                Enter PC scancode mode
  'exit_pc_charset_mode':                                  ['rmpch',                                'S3'], //                                Exit PC character display mode
  'exit_scancode_mode':                                    ['rmsc',                                 'S5'], //                                Exit PC scancode mode
  'get_mouse':                                             ['getm',                                 'Gm'], //                                Curses should get button events, parameter #1 not documented.
  'key_mouse':                                             ['kmous',                                'Km'], //                                Mouse event has occurred
  'mouse_info':                                            ['minfo',                                'Mi'], //                                Mouse status information
  'pc_term_options':                                       ['pctrm',                                'S6'], //                                PC terminal options
  'pkey_plab':                                             ['pfxl',                                 'xl'], //                                Program function key #1 to type string #2 and show string #3
  'req_mouse_pos':                                         ['reqmp',                                'RQ'], //                                Request mouse position

  'scancode_escape':                                       ['scesc',                                'S7'], //                                Escape for scan‐ code emulation
  'set0_des_seq':                                          ['s0ds',                                 's0'], //                                Shift to codeset 0 (EUC set 0, ASCII)
  'set1_des_seq':                                          ['s1ds',                                 's1'], //                                Shift to codeset 1
  'set2_des_seq':                                          ['s2ds',                                 's2'], //                                Shift to codeset 2
  'set3_des_seq':                                          ['s3ds',                                 's3'], //                                Shift to codeset 3
  'set_a_background':                                      ['setab',                                'AB'], //                                Set background color to #1, using ANSI escape
  'set_a_foreground':                                      ['setaf',                                'AF'], //                                Set foreground color to #1, using ANSI escape
  'set_color_band':                                        ['setcolor',                             'Yz'], //                                Change to ribbon color #1
  'set_lr_margin':                                         ['smglr',                                'ML'], //                                Set both left and right margins to #1, #2.  (ML is not in BSD term‐ cap).
  'set_page_length':                                       ['slines',                               'YZ'], //                                Set page length to #1 lines
  'set_tb_margin':                                         ['smgtb',                                'MT'], //                                Sets both top and bottom margins to #1, #2

  // The XSI Curses standard added these.  They are some post-4.1 versions of System V curses, e.g., Solaris 2.5 and IRIX 6.x.  The ncurses termcap
  // names for them are invented; according to the XSI Curses standard, they have no termcap names.  If your compiled terminfo entries  use  these,
  // they may not be binary-compatible with System V terminfo entries after SVr4.1; beware!


  //         Variable                                      Cap-                               TCap                                 Description
  //          String                                       name                               Code
  'enter_horizontal_hl_mode':                              ['ehhlm',                              'Xh'], //                               Enter horizontal highlight mode
  'enter_left_hl_mode':                                    ['elhlm',                              'Xl'], //                               Enter left highlight mode
  'enter_low_hl_mode':                                     ['elohlm',                             'Xo'], //                               Enter low highlight mode
  'enter_right_hl_mode':                                   ['erhlm',                              'Xr'], //                               Enter right high‐ light mode
  'enter_top_hl_mode':                                     ['ethlm',                              'Xt'], //                               Enter top highlight mode
  'enter_vertical_hl_mode':                                ['evhlm',                              'Xv'], //                               Enter vertical high‐ light mode
  'set_a_attributes':                                      ['sgr1',                               'sA'], //                               Define second set of video attributes #1-#6
  'set_pglen_inch':                                        ['slength',                            'sL']  //                               YI Set page length to #1 hundredth of an inch
};
};
BundleModuleCode['term/colors']=function (module,exports,global,process){
/**
 * colors.js - color-related functions for blessed.
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

exports.match = function(r1, g1, b1) {
  if (typeof r1 === 'string') {
    var hex = r1;
    if (hex[0] !== '#') {
      return -1;
    }
    hex = exports.hexToRGB(hex);
    r1 = hex[0], g1 = hex[1], b1 = hex[2];
  } else if (Array.isArray(r1)) {
    b1 = r1[2], g1 = r1[1], r1 = r1[0];
  }

  var hash = (r1 << 16) | (g1 << 8) | b1;

  if (exports._cache[hash] != null) {
    return exports._cache[hash];
  }

  var ldiff = Infinity
    , li = -1
    , i = 0
    , c
    , r2
    , g2
    , b2
    , diff;

  for (; i < exports.vcolors.length; i++) {
    c = exports.vcolors[i];
    r2 = c[0];
    g2 = c[1];
    b2 = c[2];

    diff = colorDistance(r1, g1, b1, r2, g2, b2);

    if (diff === 0) {
      li = i;
      break;
    }

    if (diff < ldiff) {
      ldiff = diff;
      li = i;
    }
  }

  return exports._cache[hash] = li;
};

exports.RGBToHex = function(r, g, b) {
  if (Array.isArray(r)) {
    b = r[2], g = r[1], r = r[0];
  }

  function hex(n) {
    n = n.toString(16);
    if (n.length < 2) n = '0' + n;
    return n;
  }

  return '#' + hex(r) + hex(g) + hex(b);
};

exports.hexToRGB = function(hex) {
  if (hex.length === 4) {
    hex = hex[0]
      + hex[1] + hex[1]
      + hex[2] + hex[2]
      + hex[3] + hex[3];
  }

  var col = parseInt(hex.substring(1), 16)
    , r = (col >> 16) & 0xff
    , g = (col >> 8) & 0xff
    , b = col & 0xff;

  return [r, g, b];
};

// As it happens, comparing how similar two colors are is really hard. Here is
// one of the simplest solutions, which doesn't require conversion to another
// color space, posted on stackoverflow[1]. Maybe someone better at math can
// propose a superior solution.
// [1] http://stackoverflow.com/questions/1633828

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.pow(30 * (r1 - r2), 2)
    + Math.pow(59 * (g1 - g2), 2)
    + Math.pow(11 * (b1 - b2), 2);
}

// This might work well enough for a terminal's colors: treat RGB as XYZ in a
// 3-dimensional space and go midway between the two points.
exports.mixColors = function(c1, c2, alpha) {
  // if (c1 === 0x1ff) return c1;
  // if (c2 === 0x1ff) return c1;
  if (c1 === 0x1ff) c1 = 0;
  if (c2 === 0x1ff) c2 = 0;
  if (alpha == null) alpha = 0.5;

  c1 = exports.vcolors[c1];
  var r1 = c1[0];
  var g1 = c1[1];
  var b1 = c1[2];

  c2 = exports.vcolors[c2];
  var r2 = c2[0];
  var g2 = c2[1];
  var b2 = c2[2];

  r1 += (r2 - r1) * alpha | 0;
  g1 += (g2 - g1) * alpha | 0;
  b1 += (b2 - b1) * alpha | 0;

  return exports.match([r1, g1, b1]);
};

exports.blend = function blend(attr, attr2, alpha) {
  var name, i, c, nc;

  var bg = attr & 0x1ff;
  if (attr2 != null) {
    var bg2 = attr2 & 0x1ff;
    if (bg === 0x1ff) bg = 0;
    if (bg2 === 0x1ff) bg2 = 0;
    bg = exports.mixColors(bg, bg2, alpha);
  } else {
    if (blend._cache[bg] != null) {
      bg = blend._cache[bg];
    // } else if (bg < 8) {
    //   bg += 8;
    } else if (bg >= 8 && bg <= 15) {
      bg -= 8;
    } else {
      name = exports.ncolors[bg];
      if (name) {
        for (i = 0; i < exports.ncolors.length; i++) {
          if (name === exports.ncolors[i] && i !== bg) {
            c = exports.vcolors[bg];
            nc = exports.vcolors[i];
            if (nc[0] + nc[1] + nc[2] < c[0] + c[1] + c[2]) {
              blend._cache[bg] = i;
              bg = i;
              break;
            }
          }
        }
      }
    }
  }

  attr &= ~0x1ff;
  attr |= bg;

  var fg = (attr >> 9) & 0x1ff;
  if (attr2 != null) {
    var fg2 = (attr2 >> 9) & 0x1ff;
    // 0, 7, 188, 231, 251
    if (fg === 0x1ff) {
      // XXX workaround
      fg = 248;
    } else {
      if (fg === 0x1ff) fg = 7;
      if (fg2 === 0x1ff) fg2 = 7;
      fg = exports.mixColors(fg, fg2, alpha);
    }
  } else {
    if (blend._cache[fg] != null) {
      fg = blend._cache[fg];
    // } else if (fg < 8) {
    //   fg += 8;
    } else if (fg >= 8 && fg <= 15) {
      fg -= 8;
    } else {
      name = exports.ncolors[fg];
      if (name) {
        for (i = 0; i < exports.ncolors.length; i++) {
          if (name === exports.ncolors[i] && i !== fg) {
            c = exports.vcolors[fg];
            nc = exports.vcolors[i];
            if (nc[0] + nc[1] + nc[2] < c[0] + c[1] + c[2]) {
              blend._cache[fg] = i;
              fg = i;
              break;
            }
          }
        }
      }
    }
  }

  attr &= ~(0x1ff << 9);
  attr |= fg << 9;

  return attr;
};

exports.blend._cache = {};

exports._cache = {};

exports.reduce = function(color, total) {
  if (color >= 16 && total <= 16) {
    color = exports.ccolors[color];
  } else if (color >= 8 && total <= 8) {
    color -= 8;
  } else if (color >= 2 && total <= 2) {
    color %= 2;
  }
  return color;
};

// XTerm Colors
// These were actually tough to track down. The xterm source only uses color
// keywords. The X11 source needed to be examined to find the actual values.
// They then had to be mapped to rgb values and then converted to hex values.
exports.xterm = [
  '#000000', // black
  '#cd0000', // red3
  '#00cd00', // green3
  '#cdcd00', // yellow3
  '#0000ee', // blue2
  '#cd00cd', // magenta3
  '#00cdcd', // cyan3
  '#e5e5e5', // gray90
  '#7f7f7f', // gray50
  '#ff0000', // red
  '#00ff00', // green
  '#ffff00', // yellow
  '#5c5cff', // rgb:5c/5c/ff
  '#ff00ff', // magenta
  '#00ffff', // cyan
  '#ffffff'  // white
];

// Seed all 256 colors. Assume xterm defaults.
// Ported from the xterm color generation script.
exports.colors = (function() {
  var cols = exports.colors = []
    , _cols = exports.vcolors = []
    , r
    , g
    , b
    , i
    , l;

  function hex(n) {
    n = n.toString(16);
    if (n.length < 2) n = '0' + n;
    return n;
  }

  function push(i, r, g, b) {
    cols[i] = '#' + hex(r) + hex(g) + hex(b);
    _cols[i] = [r, g, b];
  }

  // 0 - 15
  exports.xterm.forEach(function(c, i) {
    c = parseInt(c.substring(1), 16);
    push(i, (c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff);
  });

  // 16 - 231
  for (r = 0; r < 6; r++) {
    for (g = 0; g < 6; g++) {
      for (b = 0; b < 6; b++) {
        i = 16 + (r * 36) + (g * 6) + b;
        push(i,
          r ? (r * 40 + 55) : 0,
          g ? (g * 40 + 55) : 0,
          b ? (b * 40 + 55) : 0);
      }
    }
  }

  // 232 - 255 are grey.
  for (g = 0; g < 24; g++) {
    l = (g * 10) + 8;
    i = 232 + g;
    push(i, l, l, l);
  }

  return cols;
})();

// Map higher colors to the first 8 colors.
// This allows translation of high colors to low colors on 8-color terminals.
exports.ccolors = (function() {
  var _cols = exports.vcolors.slice()
    , cols = exports.colors.slice()
    , out;

  exports.vcolors = exports.vcolors.slice(0, 8);
  exports.colors = exports.colors.slice(0, 8);

  out = cols.map(exports.match);

  exports.colors = cols;
  exports.vcolors = _cols;
  exports.ccolors = out;

  return out;
})();

var colorNames = exports.colorNames = {
  // special
  default: -1,
  normal: -1,
  bg: -1,
  fg: -1,
  // normal
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
  // light
  lightblack: 8,
  lightred: 9,
  lightgreen: 10,
  lightyellow: 11,
  lightblue: 12,
  lightmagenta: 13,
  lightcyan: 14,
  lightwhite: 15,
  // bright
  brightblack: 8,
  brightred: 9,
  brightgreen: 10,
  brightyellow: 11,
  brightblue: 12,
  brightmagenta: 13,
  brightcyan: 14,
  brightwhite: 15,
  // alternate spellings
  grey: 8,
  gray: 8,
  lightgrey: 7,
  lightgray: 7,
  brightgrey: 7,
  brightgray: 7
};

exports.convert = function(color) {
  if (typeof color === 'number') {
    ;
  } else if (typeof color === 'string') {
    color = color.replace(/[\- ]/g, '');
    if (colorNames[color] != null) {
      color = colorNames[color];
    } else {
      color = exports.match(color);
    }
  } else if (Array.isArray(color)) {
    color = exports.match(color);
  } else {
    color = -1;
  }
  return color !== -1 ? color : 0x1ff;
};

// Map higher colors to the first 8 colors.
// This allows translation of high colors to low colors on 8-color terminals.
// Why the hell did I do this by hand?
exports.ccolors = {
  blue: [
    4,
    12,
    [17, 21],
    [24, 27],
    [31, 33],
    [38, 39],
    45,
    [54, 57],
    [60, 63],
    [67, 69],
    [74, 75],
    81,
    [91, 93],
    [97, 99],
    [103, 105],
    [110, 111],
    117,
    [128, 129],
    [134, 135],
    [140, 141],
    [146, 147],
    153,
    165,
    171,
    177,
    183,
    189
  ],

  green: [
    2,
    10,
    22,
    [28, 29],
    [34, 36],
    [40, 43],
    [46, 50],
    [64, 65],
    [70, 72],
    [76, 79],
    [82, 86],
    [106, 108],
    [112, 115],
    [118, 122],
    [148, 151],
    [154, 158],
    [190, 194]
  ],

  cyan: [
    6,
    14,
    23,
    30,
    37,
    44,
    51,
    66,
    73,
    80,
    87,
    109,
    116,
    123,
    152,
    159,
    195
  ],

  red: [
    1,
    9,
    52,
    [88, 89],
    [94, 95],
    [124, 126],
    [130, 132],
    [136, 138],
    [160, 163],
    [166, 169],
    [172, 175],
    [178, 181],
    [196, 200],
    [202, 206],
    [208, 212],
    [214, 218],
    [220, 224]
  ],

  magenta: [
    5,
    13,
    53,
    90,
    96,
    127,
    133,
    139,
    164,
    170,
    176,
    182,
    201,
    207,
    213,
    219,
    225
  ],

  yellow: [
    3,
    11,
    58,
    [100, 101],
    [142, 144],
    [184, 187],
    [226, 230]
  ],

  black: [
    0,
    8,
    16,
    59,
    102,
    [232, 243]
  ],

  white: [
    7,
    15,
    145,
    188,
    231,
    [244, 255]
  ]
};

exports.ncolors = [];

Object.keys(exports.ccolors).forEach(function(name) {
  exports.ccolors[name].forEach(function(offset) {
    if (typeof offset === 'number') {
      exports.ncolors[offset] = name;
      exports.ccolors[offset] = exports.colorNames[name];
      return;
    }
    for (var i = offset[0], l = offset[1]; i <= l; i++) {
      exports.ncolors[i] = name;
      exports.ccolors[i] = exports.colorNames[name];
    }
  });
  delete exports.ccolors[name];
});
};
BundleModuleCode['term/widget']=function (module,exports,global,process){
/**
 * widget.js - high-level interface for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

var widget = exports;

widget.classes = [
  'Node',
  'Screen',
  'Element',
  'Box',
  'Text',
  'Line',
  'ScrollableBox',
  'ScrollableText',
  'BigText',
  'List',
  'Form',
  'Input',
  'Textarea',
  'Textbox',
  'Button',
  'ProgressBar',
  'FileManager',
  'Checkbox',
  'RadioSet',
  'RadioButton',
  'Prompt',
  'Question',
  'Message',
  'Keyboard',
  'Loading',
  'Listbar',
  'Log',
  'Table',
  'ListTable',
  'Terminal',
  'Image',
  'ANSIImage',
  'OverlayImage',
  'Video',
  'Layout',
  'Log',
  'Tree'
];

widget.classes.forEach(function(name) {
  var file = name.toLowerCase();
  widget[name] = widget[file] = Require('term/widgets/' + file);
});

widget.aliases = {
  'ListBar': 'Listbar',
  'PNG': 'ANSIImage'
};

Object.keys(widget.aliases).forEach(function(key) {
  var name = widget.aliases[key];
  widget[key] = widget[name];
  widget[key.toLowerCase()] = widget[name];
});
};
BundleModuleCode['term/widgets/node']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    sbosse (2017).
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 *
 * node.js - base abstract node for blessed
 *
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var EventEmitter = Require('term/events').EventEmitter;

/**
 * Node
 */

function Node(options) {
  var self = this;
  var Screen = Require('term/widgets/screen');

  if (!instanceOf(this,Node)) {
    return new Node(options);
  }

  EventEmitter.call(this);

  options = options || {};
  this.options = options;

  this.screen = this.screen || options.screen;

  if (!this.screen) {
    if (this.type === 'screen') {
      this.screen = this;
    } else if (Screen.total === 1) {
      this.screen = Screen.global;
    } else if (options.parent) {
      this.screen = options.parent;
      while (this.screen && this.screen.type !== 'screen') {
        this.screen = this.screen.parent;
      }
    } else if (Screen.total) {
      // This _should_ work in most cases as long as the element is appended
      // synchronously after the screen's creation. Throw error if not.
      this.screen = Screen.instances[Screen.instances.length - 1];
      process.nextTick(function() {
        if (!self.parent) {
          throw new Error('Element (' + self.type + ')'
            + ' was not appended synchronously after the'
            + ' screen\'s creation. Please set a `parent`'
            + ' or `screen` option in the element\'s constructor'
            + ' if you are going to use multiple screens and'
            + ' append the element later.');
        }
      });
    } else {
      throw new Error('No active screen.');
    }
  }

  this.parent = options.parent || null;
  this.children = [];
  this.$ = this._ = this.data = {};
  this.uid = Node.uid++;
  this.index = this.index != null ? this.index : -1;

  if (this.type !== 'screen') {
    this.detached = true;
  }

  if (this.parent) {
    this.parent.append(this);
  }

  (options.children || []).forEach(this.append.bind(this));
}

Node.uid = 0;

//Node.prototype.__proto__ = EventEmitter.prototype;
inheritPrototype(Node,EventEmitter);

Node.prototype.type = 'node';

Node.prototype.insert = function(element, i) {
  var self = this;

  if (element.screen && element.screen !== this.screen) {
    throw new Error('Cannot switch a node\'s screen.');
  }

  element.detach();
  element.parent = this;
  element.screen = this.screen;

  if (i === 0) {
    this.children.unshift(element);
  } else if (i === this.children.length) {
    this.children.push(element);
  } else {
    this.children.splice(i, 0, element);
  }

  element.emit('reparent', this);
  this.emit('adopt', element);

  (function emit(el) {
    var n = el.detached !== self.detached;
    el.detached = self.detached;
    if (n) el.emit('attach');
    el.children.forEach(emit);
  })(element);

  if (!this.screen.focused) {
    this.screen.focused = element;
  }
};

Node.prototype.prepend = function(element) {
  this.insert(element, 0);
};

Node.prototype.append = function(element) {
  this.insert(element, this.children.length);
};

Node.prototype.insertBefore = function(element, other) {
  var i = this.children.indexOf(other);
  if (~i) this.insert(element, i);
};

Node.prototype.insertAfter = function(element, other) {
  var i = this.children.indexOf(other);
  if (~i) this.insert(element, i + 1);
};

Node.prototype.remove = function(element) {
  if (element.parent !== this) return;

  var i = this.children.indexOf(element);
  if (!~i) return;

  element.clearPos();

  element.parent = null;

  this.children.splice(i, 1);

  i = this.screen.clickable.indexOf(element);
  if (~i) this.screen.clickable.splice(i, 1);
  i = this.screen.keyable.indexOf(element);
  if (~i) this.screen.keyable.splice(i, 1);

  element.emit('reparent', null);
  this.emit('remove', element);

  (function emit(el) {
    var n = el.detached !== true;
    el.detached = true;
    if (n) el.emit('detach');
    el.children.forEach(emit);
  })(element);

  if (this.screen.focused === element) {
    this.screen.rewindFocus();
  }
};

Node.prototype.detach = function() {
  if (this.parent) this.parent.remove(this);
};

Node.prototype.free = function() {
  return;
};

Node.prototype.destroy = function() {
  this.detach();
  this.forDescendants(function(el) {
    el.free();
    el.destroyed = true;
    el.emit('destroy');
  }, this);
};

Node.prototype.forDescendants = function(iter, s) {
  if (s) iter(this);
  this.children.forEach(function emit(el) {
    iter(el);
    el.children.forEach(emit);
  });
};

Node.prototype.forAncestors = function(iter, s) {
  var el = this;
  if (s) iter(this);
  while (el = el.parent) {
    iter(el);
  }
};

Node.prototype.collectDescendants = function(s) {
  var out = [];
  this.forDescendants(function(el) {
    out.push(el);
  }, s);
  return out;
};

Node.prototype.collectAncestors = function(s) {
  var out = [];
  this.forAncestors(function(el) {
    out.push(el);
  }, s);
  return out;
};

Node.prototype.emitDescendants = function() {
  var args = Array.prototype.slice(arguments)
    , iter;

  if (typeof args[args.length - 1] === 'function') {
    iter = args.pop();
  }

  return this.forDescendants(function(el) {
    if (iter) iter(el);
    el.emit.apply(el, args);
  }, true);
};

Node.prototype.emitAncestors = function() {
  var args = Array.prototype.slice(arguments)
    , iter;

  if (typeof args[args.length - 1] === 'function') {
    iter = args.pop();
  }

  return this.forAncestors(function(el) {
    if (iter) iter(el);
    el.emit.apply(el, args);
  }, true);
};

Node.prototype.hasDescendant = function(target) {
  return (function find(el) {
    for (var i = 0; i < el.children.length; i++) {
      if (el.children[i] === target) {
        return true;
      }
      if (find(el.children[i]) === true) {
        return true;
      }
    }
    return false;
  })(this);
};

Node.prototype.hasAncestor = function(target) {
  var el = this;
  while (el = el.parent) {
    if (el === target) return true;
  }
  return false;
};

Node.prototype.get = function(name, value) {
  if (this.data.hasOwnProperty(name)) {
    return this.data[name];
  }
  return value;
};

Node.prototype.set = function(name, value) {
  return this.data[name] = value;
};

/**
 * Expose
 */

module.exports = Node;
};
BundleModuleCode['term/events']=function (module,exports,global,process){
/**
 * events.js - event emitter for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

var slice = Array.prototype.slice;

/**
 * EventEmitter
 */

function EventEmitter() {
  if (!this._events) this._events = {};
}

EventEmitter.prototype.setMaxListeners = function(n) {
  this._maxListeners = n;
};

EventEmitter.prototype.addListener = function(type, listener) {
  if (!this._events[type]) {
    this._events[type] = listener;
  } else if (typeof this._events[type] === 'function') {
    this._events[type] = [this._events[type], listener];
  } else {
    this._events[type].push(listener);
  }
  this._emit('newListener', [type, listener]);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.removeListener = function(type, listener) {
  var handler = this._events[type];
  if (!handler) return;

  if (typeof handler === 'function' || handler.length === 1) {
    delete this._events[type];
    this._emit('removeListener', [type, listener]);
    return;
  }

  for (var i = 0; i < handler.length; i++) {
    if (handler[i] === listener || handler[i].listener === listener) {
      handler.splice(i, 1);
      this._emit('removeListener', [type, listener]);
      return;
    }
  }
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function(type) {
  if (type) {
    delete this._events[type];
  } else {
    this._events = {};
  }
};

EventEmitter.prototype.once = function(type, listener) {
  function on() {
    this.removeListener(type, on);
    return listener.apply(this, arguments);
  }
  on.listener = listener;
  return this.on(type, on);
};

EventEmitter.prototype.listeners = function(type) {
  return typeof this._events[type] === 'function'
    ? [this._events[type]]
    : this._events[type] || [];
};

EventEmitter.prototype._emit = function(type, args) {
  var handler = this._events[type]
    , ret;

  // if (type !== 'event') {
  //   this._emit('event', [type.replace(/^element /, '')].concat(args));
  // }

  if (!handler) {
    if (type === 'error') {
      throw new args[0];
    }
    return;
  }

  if (typeof handler === 'function') {
    return handler.apply(this, args);
  }

  for (var i = 0; i < handler.length; i++) {
    if (handler[i].apply(this, args) === false) {
      ret = false;
    }
  }

  return ret !== false;
};

EventEmitter.prototype.emit = function(type) {
  var args = slice.call(arguments, 1)
    , params = slice.call(arguments)
    , el = this;

  this._emit('event', params);

  if (this.type === 'screen') {
    return this._emit(type, args);
  }

  if (this._emit(type, args) === false) {
    return false;
  }

  type = 'element ' + type;
  args.unshift(this);
  // `element` prefix
  // params = [type].concat(args);
  // no `element` prefix
  // params.splice(1, 0, this);

  do {
    // el._emit('event', params);
    if (!el._events[type]) continue;
    if (el._emit(type, args) === false) {
      return false;
    }
  } while (el = el.parent);

  return true;
};

// For hooking into the main EventEmitter if we want to.
// Might be better to do things this way being that it
// will always be compatible with node, not to mention
// it gives us domain support as well.
// Node.prototype._emit = Node.prototype.emit;
// Node.prototype.emit = function(type) {
//   var args, el;
//
//   if (this.type === 'screen') {
//     return this._emit.apply(this, arguments);
//   }
//
//   this._emit.apply(this, arguments);
//   if (this._bubbleStopped) return false;
//
//   args = slice.call(arguments, 1);
//   el = this;
//
//   args.unshift('element ' + type, this);
//   this._bubbleStopped = false;
//   //args.push(stopBubble);
//
//   do {
//     if (!el._events || !el._events[type]) continue;
//     el._emit.apply(el, args);
//     if (this._bubbleStopped) return false;
//   } while (el = el.parent);
//
//   return true;
// };
//
// Node.prototype._addListener = Node.prototype.addListener;
// Node.prototype.on =
// Node.prototype.addListener = function(type, listener) {
//   function on() {
//     if (listener.apply(this, arguments) === false) {
//       this._bubbleStopped = true;
//     }
//   }
//   on.listener = listener;
//   return this._addListener(type, on);
// };

/**
 * Expose
 */

exports = EventEmitter;
exports.EventEmitter = EventEmitter;

module.exports = exports;
};
BundleModuleCode['term/widgets/screen']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2016-2017)
 **    $REVESIO:     1.1.6
 **
 **    $INFO:
 **
 **    screen.js - screen node for blessed
 **
 **     Added:
 **       - Round-Robin focus shift on tabulator key press event. Requires <box>.options.focus=true
 **         setting for selectable boxes.
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var path = Require('path')
  , fs = Require('fs')
  , cp = Require('child_process');

var colors = Require('term/colors')
  , program = Require('term/program')
  , unicode = Require('term/unicode');

var nextTick = global.setImmediate || process.nextTick.bind(process);

var helpers = Require('term/helpers');

var Node = Require('term/widgets/node');
var Log = Require('term/widgets/log');
var Element = Require('term/widgets/element');
var Box = Require('term/widgets/box');

/**
 * Screen
 */

function Screen(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Screen(options);
  }

  Screen.bind(this);

  options = options || {};
  if (options.rsety && options.listen) {
    options = { program: options };
  }

  this.program = options.program;
  if (!this.program) {
    this.program = program({
      input: options.input,
      output: options.output,
      log: options.log,
      debug: options.debug,
      dump: options.dump,
      terminal: options.terminal || options.term,
      resizeTimeout: options.resizeTimeout,
      forceUnicode: options.forceUnicode,
      tput: true,
      buffer: true,
      zero: true
    });
  } else {
    this.program.setupTput();
    this.program.useBuffer = true;
    this.program.zero = true;
    this.program.options.resizeTimeout = options.resizeTimeout;
    if (options.forceUnicode != null) {
      this.program.tput.features.unicode = options.forceUnicode;
      this.program.tput.unicode = options.forceUnicode;
    }
  }

  
  this.tput = this.program.tput;

  Node.call(this, options);

  this.autoPadding = options.autoPadding !== false;
  this.tabc = Array((options.tabSize || 4) + 1).join(' ');
  this.dockBorders = options.dockBorders;

  this.ignoreLocked = options.ignoreLocked || [];

  this._unicode = this.tput.unicode || this.tput.numbers.U8 === 1;
  this.fullUnicode = this.options.fullUnicode && this._unicode;

  this.dattr = ((0 << 18) | (0x1ff << 9)) | 0x1ff;

  this.renders = 0;
  this.position = {
    left: this.left = this.aleft = this.rleft = 0,
    right: this.right = this.aright = this.rright = 0,
    top: this.top = this.atop = this.rtop = 0,
    bottom: this.bottom = this.abottom = this.rbottom = 0,
    get height() { return self.height; },
    get width() { return self.width; }
  };

  this.ileft = 0;
  this.itop = 0;
  this.iright = 0;
  this.ibottom = 0;
  this.iheight = 0;
  this.iwidth = 0;

  this.padding = {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  };

  this.hover = null;
  this.history = [];
  this.clickable = [];
  this.keyable = [];
  this.grabKeys = false;
  this.lockKeys = false;
  this.focused;
  this._buf = '';

  this._ci = -1;

  if (options.title) {
    this.title = options.title;
  }

  options.cursor = options.cursor || {
    artificial: options.artificialCursor,
    shape: options.cursorShape,
    blink: options.cursorBlink,
    color: options.cursorColor
  };

  this.cursor = {
    artificial: options.cursor.artificial || false,
    shape: options.cursor.shape || 'block',
    blink: options.cursor.blink || false,
    color: options.cursor.color || null,
    _set: false,
    _state: 1,
    _hidden: true
  };

  this.program.on('resize', function() {
    self.alloc();
    self.render();
    (function emit(el) {
      el.emit('resize');
      el.children.forEach(emit);
    })(self);
  });

  this.program.on('focus', function() {
    self.emit('focus');
  });

  this.program.on('blur', function() {
    self.emit('blur');
  });

  this.program.on('warning', function(text) {
    self.emit('warning', text);
  });

  this.on('newListener', function fn(type) {
    if (type === 'keypress' || type.indexOf('key ') === 0 || type === 'mouse') {
      if (type === 'keypress' || type.indexOf('key ') === 0) self._listenKeys();
      if (type === 'mouse') self._listenMouse();
    }
    if (type === 'mouse'
      || type === 'click'
      || type === 'mouseover'
      || type === 'mouseout'
      || type === 'mousedown'
      || type === 'mouseup'
      || type === 'mousewheel'
      || type === 'wheeldown'
      || type === 'wheelup'
      || type === 'mousemove') {
      self._listenMouse();
    }
  });

  this.setMaxListeners(Infinity);

  this.enter();

  this.postEnter();
}

Screen.global = null;

Screen.total = 0;

Screen.instances = [];

Screen.bind = function(screen) {
  if (!Screen.global) {
    Screen.global = screen;
  }

  if (!~Screen.instances.indexOf(screen)) {
    Screen.instances.push(screen);
    screen.index = Screen.total;
    Screen.total++;
  }

  if (Screen._bound) return;
  Screen._bound = true;

  process.on('uncaughtException', Screen._exceptionHandler = function(err) {
    if (process.listeners('uncaughtException').length > 1) {
      return;
    }
    Screen.instances.slice().forEach(function(screen) {
      screen.destroy();
    });
    err = err || new Error('Uncaught Exception.');
    console.error(err.stack ? err.stack + '' : err + '');
    nextTick(function() {
      process.exit(1);
    });
  });

  ['SIGTERM', 'SIGINT', 'SIGQUIT'].forEach(function(signal) {
    var name = '_' + signal.toLowerCase() + 'Handler';
    process.on(signal, Screen[name] = function() {
      if (process.listeners(signal).length > 1) {
        return;
      }
      nextTick(function() {
        process.exit(0);
      });
    });
  });

  process.on('exit', Screen._exitHandler = function() {
    Screen.instances.slice().forEach(function(screen) {
      screen.destroy();
    });
  });
};

//Screen.prototype.__proto__ = Node.prototype;
inheritPrototype(Screen,Node);

Screen.prototype.type = 'screen';
/* Depricated
Screen.prototype.__defineGetter__('title', function() {
  return this.program.title;
});

Screen.prototype.__defineSetter__('title', function(title) {
  return this.program.title = title;
});

Screen.prototype.__defineGetter__('terminal', function() {
  return this.program.terminal;
});

Screen.prototype.__defineSetter__('terminal', function(terminal) {
  this.setTerminal(terminal);
  return this.program.terminal;
});
*/
defineGetter(Screen,'title', function() {
  return this.program.title;
});
defineSetter(Screen,'title', function(title) {
  return this.program.title = title;
});

defineGetter(Screen,'terminal', function() {
  return this.program.terminal;
});
defineSetter(Screen,'terminal', function(terminal) {
  this.setTerminal(terminal);
  return this.program.terminal;
});
/*

Object.defineProperty(Screen.prototype,'title',{
  get: function () {
    return this.program.title;  
  },
  set: function (title) {
    return this.program.title = title;
  }
});
Object.defineProperty(Screen.prototype,'terminal',{
  get: function () {
    return this.program.terminal;  
  },
  set: function (terminal) {
    this.setTerminal(terminal);
    return this.program.terminal;
  }
});
*/
Screen.prototype.setTerminal = function(terminal) {
  var entered = !!this.program.isAlt;
  if (entered) {
    this._buf = '';
    this.program._buf = '';
    this.leave();
  }
  this.program.setTerminal(terminal);
  this.tput = this.program.tput;
  if (entered) {
    this.enter();
  }
};


Screen.prototype.enter = function() {
  if (this.program.isAlt) return;
  if (!this.cursor._set) {
    if (this.options.cursor.shape) {
      this.cursorShape(this.cursor.shape, this.cursor.blink);
    }
    if (this.options.cursor.color) {
      this.cursorColor(this.cursor.color);
    }
  }
  if (process.platform === 'win32') {
    try {
      cp.execSync('cls', { stdio: 'ignore', timeout: 1000 });
    } catch (e) {
      ;
    }
  }
  this.program.alternateBuffer();
  this.program.put.keypad_xmit();
  this.program.csr(0, this.height - 1);
  this.program.hideCursor();
  this.program.cup(0, 0);
  // We need this for tmux now:
  if (this.tput.strings.ena_acs) {
    this.program._write(this.tput.enacs());
  }
  this.alloc();
};

Screen.prototype.leave = function() {
  if (!this.program.isAlt) return;
  this.program.put.keypad_local();
  if (this.program.scrollTop !== 0
      || this.program.scrollBottom !== this.rows - 1) {
    this.program.csr(0, this.height - 1);
  }
  // XXX For some reason if alloc/clear() is before this
  // line, it doesn't work on linux console.
  this.program.showCursor();
  this.alloc();
  if (this._listenedMouse) {
    this.program.disableMouse();
  }
  this.program.normalBuffer();
  if (this.cursor._set) this.cursorReset();
  this.program.flush();
  if (process.platform === 'win32') {
    try {
      cp.execSync('cls', { stdio: 'ignore', timeout: 1000 });
    } catch (e) {
      ;
    }
  }
};

Screen.prototype.postEnter = function() {
  var self = this;
  if (this.options.debug) {
    this.debugLog = new Log({
      screen: this,
      parent: this,
      hidden: true,
      draggable: true,
      left: 'center',
      top: 'center',
      width: '30%',
      height: '30%',
      border: 'line',
      label: ' {bold}Debug Log{/bold} ',
      tags: true,
      keys: true,
      vi: true,
      mouse: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          inverse: true
        }
      }
    });

    this.debugLog.toggle = function() {
      if (self.debugLog.hidden) {
        self.saveFocus();
        self.debugLog.show();
        self.debugLog.setFront();
        self.debugLog.focus();
      } else {
        self.debugLog.hide();
        self.restoreFocus();
      }
      self.render();
    };

    this.debugLog.key(['q', 'escape'], self.debugLog.toggle);
    this.key('f12', self.debugLog.toggle);
  }

  if (this.options.warnings) {
    this.on('warning', function(text) {
      var warning = new Box({
        screen: self,
        parent: self,
        left: 'center',
        top: 'center',
        width: 'shrink',
        padding: 1,
        height: 'shrink',
        align: 'center',
        valign: 'middle',
        border: 'line',
        label: ' {red-fg}{bold}WARNING{/} ',
        content: '{bold}' + text + '{/bold}',
        tags: true
      });
      self.render();
      var timeout = setTimeout(function() {
        warning.destroy();
        self.render();
      }, 1500);
      if (timeout.unref) {
        timeout.unref();
      }
    });
  }
};

Screen.prototype._destroy = Screen.prototype.destroy;
Screen.prototype.destroy = function() {
  if (!this.program) return;
  this.leave();

  var index = Screen.instances.indexOf(this);
  if (~index) {
    Screen.instances.splice(index, 1);
    Screen.total--;

    Screen.global = Screen.instances[0];

    if (Screen.total === 0) {
      Screen.global = null;

      process.removeListener('uncaughtException', Screen._exceptionHandler);
      process.removeListener('SIGTERM', Screen._sigtermHandler);
      process.removeListener('SIGINT', Screen._sigintHandler);
      process.removeListener('SIGQUIT', Screen._sigquitHandler);
      process.removeListener('exit', Screen._exitHandler);
      delete Screen._exceptionHandler;
      delete Screen._sigtermHandler;
      delete Screen._sigintHandler;
      delete Screen._sigquitHandler;
      delete Screen._exitHandler;

      delete Screen._bound;
    }

    this.destroyed = true;
    this.emit('destroy');
    this._destroy();
  }

  this.program.destroy();
};

Screen.prototype.log = function() {
  return this.program.log.apply(this.program, arguments);
};

Screen.prototype.debug = function() {
  if (this.debugLog) {
    this.debugLog.log.apply(this.debugLog, arguments);
  }
  return this.program.debug.apply(this.program, arguments);
};

Screen.prototype._listenMouse = function(el) {
  var self = this;

  if (el && !~this.clickable.indexOf(el)) {
    el.clickable = true;
    this.clickable.push(el);
  }

  if (this._listenedMouse) return;
  this._listenedMouse = true;

  this.program.enableMouse();
  if (this.options.sendFocus) {
    this.program.setMouse({ sendFocus: true }, true);
  }

  this.on('render', function() {
    self._needsClickableSort = true;
  });

  this.program.on('mouse', function(data) {
    if (self.lockKeys) return;

    if (self._needsClickableSort) {
      self.clickable = helpers.hsort(self.clickable);
      self._needsClickableSort = false;
    }

    var i = 0
      , el
      , set
      , pos;

    for (; i < self.clickable.length; i++) {
      el = self.clickable[i];

      if (el.detached || !el.visible) {
        continue;
      }

      // if (self.grabMouse && self.focused !== el
      //     && !el.hasAncestor(self.focused)) continue;

      pos = el.lpos;
      if (!pos) continue;

      if (data.x >= pos.xi && data.x < pos.xl
          && data.y >= pos.yi && data.y < pos.yl) {
        el.emit('mouse', data);
        if (data.action === 'mousedown') {
          self.mouseDown = el;
        } else if (data.action === 'mouseup') {
          (self.mouseDown || el).emit('click', data);
          self.mouseDown = null;
        } else if (data.action === 'mousemove') {
          if (self.hover && el.index > self.hover.index) {
            set = false;
          }
          if (self.hover !== el && !set) {
            if (self.hover) {
              self.hover.emit('mouseout', data);
            }
            el.emit('mouseover', data);
            self.hover = el;
          }
          set = true;
        }
        el.emit(data.action, data);
        break;
      }
    }

    // Just mouseover?
    if ((data.action === 'mousemove'
        || data.action === 'mousedown'
        || data.action === 'mouseup')
        && self.hover
        && !set) {
      self.hover.emit('mouseout', data);
      self.hover = null;
    }

    self.emit('mouse', data);
    self.emit(data.action, data);
  });

  // Autofocus highest element.
  // this.on('element click', function(el, data) {
  //   var target;
  //   do {
  //     if (el.clickable === true && el.options.autoFocus !== false) {
  //       target = el;
  //     }
  //   } while (el = el.parent);
  //   if (target) target.focus();
  // });

  // Autofocus elements with the appropriate option.
  this.on('element click', function(el) {
    if (el.clickable === true && el.options.autoFocus !== false) {
      el.focus();
    }
  });
};

Screen.prototype.enableMouse = function(el) {
  this._listenMouse(el);
};

Screen.prototype._listenKeys = function(el) {
  var self = this;

  if (el && !~this.keyable.indexOf(el)) {
    el.keyable = true;
    this.keyable.push(el);
  }

  if (this._listenedKeys) return;
  this._listenedKeys = true;

  // NOTE: The event emissions used to be reversed:
  // element + screen
  // They are now:
  // screen + element
  // After the first keypress emitted, the handler
  // checks to make sure grabKeys, lockKeys, and focused
  // weren't changed, and handles those situations appropriately.
  this.program.on('keypress', function(ch, key) {
    if (key.name == 'tab') {
      /* Round-Robin focus shift of top-level boxes -- find
      ** currently focussed box by iterating over children list.
      ** Maybe it is a child of a top-level box itself!
      */ 
      //console.log(self.focused.type)
      var last=self.focused;
      var first=undefined;
      var next=undefined;
      for (var c in self.children) {
        var child=self.children[c];
        if (first==undefined) first=child;
        if (last==undefined && next==undefined && child.options.focus) next=child;
        if (last && child==last) last=undefined;
        if (last && child[last.type]==last) last=undefined;
      }
      if (!next) next=first;
      if (next) next.focus();
      self.render();
      return;
    }
    if (self.lockKeys && !~self.ignoreLocked.indexOf(key.full)) {
      return;
    }

    var focused = self.focused
      , grabKeys = self.grabKeys;

    if (!grabKeys || ~self.ignoreLocked.indexOf(key.full)) {
      self.emit('keypress', ch, key);
      self.emit('key ' + key.full, ch, key);
    }

    // If something changed from the screen key handler, stop.
    if (self.grabKeys !== grabKeys || self.lockKeys) {
      return;
    }

    if (focused && focused.keyable) {
      focused.emit('keypress', ch, key);
      focused.emit('key ' + key.full, ch, key);
    }
  });
};

Screen.prototype.enableKeys = function(el) {
  this._listenKeys(el);
};

Screen.prototype.enableInput = function(el) {
  this._listenMouse(el);
  this._listenKeys(el);
};

Screen.prototype._initHover = function() {
  var self = this;

  if (this._hoverText) {
    return;
  }

  this._hoverText = new Box({
    screen: this,
    left: 0,
    top: 0,
    tags: false,
    height: 'shrink',
    width: 'shrink',
    border: 'line',
    style: {
      border: {
        fg: 'default'
      },
      bg: 'default',
      fg: 'default'
    }
  });

  this.on('mousemove', function(data) {
    if (self._hoverText.detached) return;
    self._hoverText.rleft = data.x + 1;
    self._hoverText.rtop = data.y;
    self.render();
  });

  this.on('element mouseover', function(el, data) {
    if (!el._hoverOptions) return;
    self._hoverText.parseTags = el.parseTags;
    self._hoverText.setContent(el._hoverOptions.text);
    self.append(self._hoverText);
    self._hoverText.rleft = data.x + 1;
    self._hoverText.rtop = data.y;
    self.render();
  });

  this.on('element mouseout', function() {
    if (self._hoverText.detached) return;
    self._hoverText.detach();
    self.render();
  });

  // XXX This can cause problems if the
  // terminal does not support allMotion.
  // Workaround: check to see if content is set.
  this.on('element mouseup', function(el) {
    if (!self._hoverText.getContent()) return;
    if (!el._hoverOptions) return;
    self.append(self._hoverText);
    self.render();
  });
};

/* Depricated
Screen.prototype.__defineGetter__('cols', function() {
  return this.program.cols;
});

Screen.prototype.__defineGetter__('rows', function() {
  return this.program.rows;
});

Screen.prototype.__defineGetter__('width', function() {
  return this.program.cols;
});

Screen.prototype.__defineGetter__('height', function() {
  return this.program.rows;
});
*/
Object.defineProperty(Screen.prototype,'cols',{
  get: function () {
    return this.program.cols;
  },
});
Object.defineProperty(Screen.prototype,'rows',{
  get: function () {
    return this.program.rows;
  },
});
Object.defineProperty(Screen.prototype,'width',{
  get: function () {
    return this.program.cols;
  },
});
Object.defineProperty(Screen.prototype,'height',{
  get: function () {
    return this.program.rows;
  },
});

Screen.prototype.alloc = function(dirty) {
  var x, y;

  this.lines = [];
  for (y = 0; y < this.rows; y++) {
    this.lines[y] = [];
    for (x = 0; x < this.cols; x++) {
      this.lines[y][x] = [this.dattr, ' '];
    }
    this.lines[y].dirty = !!dirty;
  }

  this.olines = [];
  for (y = 0; y < this.rows; y++) {
    this.olines[y] = [];
    for (x = 0; x < this.cols; x++) {
      this.olines[y][x] = [this.dattr, ' '];
    }
  }

  this.program.clear();
};

Screen.prototype.realloc = function() {
  return this.alloc(true);
};

Screen.prototype.render = function() {
  var self = this;

  if (this.destroyed) return;

  this.emit('prerender');

  this._borderStops = {};

  // TODO: Possibly get rid of .dirty altogether.
  // TODO: Could possibly drop .dirty and just clear the `lines` buffer every
  // time before a screen.render. This way clearRegion doesn't have to be
  // called in arbitrary places for the sake of clearing a spot where an
  // element used to be (e.g. when an element moves or is hidden). There could
  // be some overhead though.
  // this.screen.clearRegion(0, this.cols, 0, this.rows);
  this._ci = 0;
  this.children.forEach(function(el) {
    el.index = self._ci++;
    //el._rendering = true;
    el.render();
    //el._rendering = false;
  });
  this._ci = -1;

  if (this.screen.dockBorders) {
    this._dockBorders();
  }

  this.draw(0, this.lines.length - 1);

  // XXX Workaround to deal with cursor pos before the screen has rendered and
  // lpos is not reliable (stale).
  if (this.focused && this.focused._updateCursor) {
    this.focused._updateCursor(true);
  }

  this.renders++;

  this.emit('render');
};

Screen.prototype.blankLine = function(ch, dirty) {
  var out = [];
  for (var x = 0; x < this.cols; x++) {
    out[x] = [this.dattr, ch || ' '];
  }
  out.dirty = dirty;
  return out;
};

Screen.prototype.insertLine = function(n, y, top, bottom) {
  // if (y === top) return this.insertLineNC(n, y, top, bottom);

  if (!this.tput.strings.change_scroll_region
      || !this.tput.strings.delete_line
      || !this.tput.strings.insert_line) return;

  this._buf += this.tput.csr(top, bottom);
  this._buf += this.tput.cup(y, 0);
  this._buf += this.tput.il(n);
  this._buf += this.tput.csr(0, this.height - 1);

  var j = bottom + 1;

  while (n--) {
    this.lines.splice(y, 0, this.blankLine());
    this.lines.splice(j, 1);
    this.olines.splice(y, 0, this.blankLine());
    this.olines.splice(j, 1);
  }
};

Screen.prototype.deleteLine = function(n, y, top, bottom) {
  // if (y === top) return this.deleteLineNC(n, y, top, bottom);

  if (!this.tput.strings.change_scroll_region
      || !this.tput.strings.delete_line
      || !this.tput.strings.insert_line) return;

  this._buf += this.tput.csr(top, bottom);
  this._buf += this.tput.cup(y, 0);
  this._buf += this.tput.dl(n);
  this._buf += this.tput.csr(0, this.height - 1);

  var j = bottom + 1;

  while (n--) {
    this.lines.splice(j, 0, this.blankLine());
    this.lines.splice(y, 1);
    this.olines.splice(j, 0, this.blankLine());
    this.olines.splice(y, 1);
  }
};

// This is how ncurses does it.
// Scroll down (up cursor-wise).
// This will only work for top line deletion as opposed to arbitrary lines.
Screen.prototype.insertLineNC = function(n, y, top, bottom) {
  if (!this.tput.strings.change_scroll_region
      || !this.tput.strings.delete_line) return;

  this._buf += this.tput.csr(top, bottom);
  this._buf += this.tput.cup(top, 0);
  this._buf += this.tput.dl(n);
  this._buf += this.tput.csr(0, this.height - 1);

  var j = bottom + 1;

  while (n--) {
    this.lines.splice(j, 0, this.blankLine());
    this.lines.splice(y, 1);
    this.olines.splice(j, 0, this.blankLine());
    this.olines.splice(y, 1);
  }
};

// This is how ncurses does it.
// Scroll up (down cursor-wise).
// This will only work for bottom line deletion as opposed to arbitrary lines.
Screen.prototype.deleteLineNC = function(n, y, top, bottom) {
  if (!this.tput.strings.change_scroll_region
      || !this.tput.strings.delete_line) return;

  this._buf += this.tput.csr(top, bottom);
  this._buf += this.tput.cup(bottom, 0);
  this._buf += Array(n + 1).join('\n');
  this._buf += this.tput.csr(0, this.height - 1);

  var j = bottom + 1;

  while (n--) {
    this.lines.splice(j, 0, this.blankLine());
    this.lines.splice(y, 1);
    this.olines.splice(j, 0, this.blankLine());
    this.olines.splice(y, 1);
  }
};

Screen.prototype.insertBottom = function(top, bottom) {
  return this.deleteLine(1, top, top, bottom);
};

Screen.prototype.insertTop = function(top, bottom) {
  return this.insertLine(1, top, top, bottom);
};

Screen.prototype.deleteBottom = function(top, bottom) {
  return this.clearRegion(0, this.width, bottom, bottom);
};

Screen.prototype.deleteTop = function(top, bottom) {
  // Same as: return this.insertBottom(top, bottom);
  return this.deleteLine(1, top, top, bottom);
};

// Parse the sides of an element to determine
// whether an element has uniform cells on
// both sides. If it does, we can use CSR to
// optimize scrolling on a scrollable element.
// Not exactly sure how worthwile this is.
// This will cause a performance/cpu-usage hit,
// but will it be less or greater than the
// performance hit of slow-rendering scrollable
// boxes with clean sides?
Screen.prototype.cleanSides = function(el) {
  var pos = el.lpos;

  if (!pos) {
    return false;
  }

  if (pos._cleanSides != null) {
    return pos._cleanSides;
  }

  if (pos.xi <= 0 && pos.xl >= this.width) {
    return pos._cleanSides = true;
  }

  if (this.options.fastCSR) {
    // Maybe just do this instead of parsing.
    if (pos.yi < 0) return pos._cleanSides = false;
    if (pos.yl > this.height) return pos._cleanSides = false;
    if (this.width - (pos.xl - pos.xi) < 40) {
      return pos._cleanSides = true;
    }
    return pos._cleanSides = false;
  }

  if (!this.options.smartCSR) {
    return false;
  }

  // The scrollbar can't update properly, and there's also a
  // chance that the scrollbar may get moved around senselessly.
  // NOTE: In pratice, this doesn't seem to be the case.
  // if (this.scrollbar) {
  //   return pos._cleanSides = false;
  // }

  // Doesn't matter if we're only a height of 1.
  // if ((pos.yl - el.ibottom) - (pos.yi + el.itop) <= 1) {
  //   return pos._cleanSides = false;
  // }

  var yi = pos.yi + el.itop
    , yl = pos.yl - el.ibottom
    , first
    , ch
    , x
    , y;

  if (pos.yi < 0) return pos._cleanSides = false;
  if (pos.yl > this.height) return pos._cleanSides = false;
  if (pos.xi - 1 < 0) return pos._cleanSides = true;
  if (pos.xl > this.width) return pos._cleanSides = true;

  for (x = pos.xi - 1; x >= 0; x--) {
    if (!this.olines[yi]) break;
    first = this.olines[yi][x];
    for (y = yi; y < yl; y++) {
      if (!this.olines[y] || !this.olines[y][x]) break;
      ch = this.olines[y][x];
      if (ch[0] !== first[0] || ch[1] !== first[1]) {
        return pos._cleanSides = false;
      }
    }
  }

  for (x = pos.xl; x < this.width; x++) {
    if (!this.olines[yi]) break;
    first = this.olines[yi][x];
    for (y = yi; y < yl; y++) {
      if (!this.olines[y] || !this.olines[y][x]) break;
      ch = this.olines[y][x];
      if (ch[0] !== first[0] || ch[1] !== first[1]) {
        return pos._cleanSides = false;
      }
    }
  }

  return pos._cleanSides = true;
};

Screen.prototype._dockBorders = function() {
  var lines = this.lines
    , stops = this._borderStops
    , i
    , y
    , x
    , ch;

  // var keys, stop;
  //
  // keys = Object.keys(this._borderStops)
  //   .map(function(k) { return +k; })
  //   .sort(function(a, b) { return a - b; });
  //
  // for (i = 0; i < keys.length; i++) {
  //   y = keys[i];
  //   if (!lines[y]) continue;
  //   stop = this._borderStops[y];
  //   for (x = stop.xi; x < stop.xl; x++) {

  stops = Object.keys(stops)
    .map(function(k) { return +k; })
    .sort(function(a, b) { return a - b; });

  for (i = 0; i < stops.length; i++) {
    y = stops[i];
    if (!lines[y]) continue;
    for (x = 0; x < this.width; x++) {
      ch = lines[y][x][1];
      if (angles[ch]) {
        lines[y][x][1] = this._getAngle(lines, x, y);
        lines[y].dirty = true;
      }
    }
  }
};

Screen.prototype._getAngle = function(lines, x, y) {
  var angle = 0
    , attr = lines[y][x][0]
    , ch = lines[y][x][1];

  if (lines[y][x - 1] && langles[lines[y][x - 1][1]]) {
    if (!this.options.ignoreDockContrast) {
      if (lines[y][x - 1][0] !== attr) return ch;
    }
    angle |= 1 << 3;
  }

  if (lines[y - 1] && uangles[lines[y - 1][x][1]]) {
    if (!this.options.ignoreDockContrast) {
      if (lines[y - 1][x][0] !== attr) return ch;
    }
    angle |= 1 << 2;
  }

  if (lines[y][x + 1] && rangles[lines[y][x + 1][1]]) {
    if (!this.options.ignoreDockContrast) {
      if (lines[y][x + 1][0] !== attr) return ch;
    }
    angle |= 1 << 1;
  }

  if (lines[y + 1] && dangles[lines[y + 1][x][1]]) {
    if (!this.options.ignoreDockContrast) {
      if (lines[y + 1][x][0] !== attr) return ch;
    }
    angle |= 1 << 0;
  }

  // Experimental: fixes this situation:
  // +----------+
  //            | <-- empty space here, should be a T angle
  // +-------+  |
  // |       |  |
  // +-------+  |
  // |          |
  // +----------+
  // if (uangles[lines[y][x][1]]) {
  //   if (lines[y + 1] && cdangles[lines[y + 1][x][1]]) {
  //     if (!this.options.ignoreDockContrast) {
  //       if (lines[y + 1][x][0] !== attr) return ch;
  //     }
  //     angle |= 1 << 0;
  //   }
  // }

  return angleTable[angle] || ch;
};

Screen.prototype.draw = function(start, end) {
  // this.emit('predraw');

  var x
    , y
    , line
    , out
    , ch
    , data
    , attr
    , fg
    , bg
    , flags;

  var main = ''
    , pre
    , post;

  var clr
    , neq
    , xx;

  var lx = -1
    , ly = -1
    , o;

  var acs;

  if (this._buf) {
    main += this._buf;
    this._buf = '';
  }

  for (y = start; y <= end; y++) {
    line = this.lines[y];
    o = this.olines[y];

    if (!line.dirty && !(this.cursor.artificial && y === this.program.y)) {
      continue;
    }
    line.dirty = false;

    out = '';
    attr = this.dattr;

    for (x = 0; x < line.length; x++) {
      data = line[x][0];
      ch = line[x][1];

      // Render the artificial cursor.
      if (this.cursor.artificial
          && !this.cursor._hidden
          && this.cursor._state
          && x === this.program.x
          && y === this.program.y) {
        var cattr = this._cursorAttr(this.cursor, data);
        if (cattr.ch) ch = cattr.ch;
        data = cattr.attr;
      }

      // Take advantage of xterm's back_color_erase feature by using a
      // lookahead. Stop spitting out so many damn spaces. NOTE: Is checking
      // the bg for non BCE terminals worth the overhead?
      if (this.options.useBCE
          && ch === ' '
          && (this.tput.bools.back_color_erase
          || (data & 0x1ff) === (this.dattr & 0x1ff))
          && ((data >> 18) & 8) === ((this.dattr >> 18) & 8)) {
        clr = true;
        neq = false;

        for (xx = x; xx < line.length; xx++) {
          if (line[xx][0] !== data || line[xx][1] !== ' ') {
            clr = false;
            break;
          }
          if (line[xx][0] !== o[xx][0] || line[xx][1] !== o[xx][1]) {
            neq = true;
          }
        }

        if (clr && neq) {
          lx = -1, ly = -1;
          if (data !== attr) {
            out += this.codeAttr(data);
            attr = data;
          }
          out += this.tput.cup(y, x);
          out += this.tput.el();
          for (xx = x; xx < line.length; xx++) {
            o[xx][0] = data;
            o[xx][1] = ' ';
          }
          break;
        }

        // If there's more than 10 spaces, use EL regardless
        // and start over drawing the rest of line. Might
        // not be worth it. Try to use ECH if the terminal
        // supports it. Maybe only try to use ECH here.
        // //if (this.tput.strings.erase_chars)
        // if (!clr && neq && (xx - x) > 10) {
        //   lx = -1, ly = -1;
        //   if (data !== attr) {
        //     out += this.codeAttr(data);
        //     attr = data;
        //   }
        //   out += this.tput.cup(y, x);
        //   if (this.tput.strings.erase_chars) {
        //     // Use erase_chars to avoid erasing the whole line.
        //     out += this.tput.ech(xx - x);
        //   } else {
        //     out += this.tput.el();
        //   }
        //   if (this.tput.strings.parm_right_cursor) {
        //     out += this.tput.cuf(xx - x);
        //   } else {
        //     out += this.tput.cup(y, xx);
        //   }
        //   this.fillRegion(data, ' ',
        //     x, this.tput.strings.erase_chars ? xx : line.length,
        //     y, y + 1);
        //   x = xx - 1;
        //   continue;
        // }

        // Skip to the next line if the
        // rest of the line is already drawn.
        // if (!neq) {
        //   for (; xx < line.length; xx++) {
        //     if (line[xx][0] !== o[xx][0] || line[xx][1] !== o[xx][1]) {
        //       neq = true;
        //       break;
        //     }
        //   }
        //   if (!neq) {
        //     attr = data;
        //     break;
        //   }
        // }
      }

      // Optimize by comparing the real output
      // buffer to the pending output buffer.
      if (data === o[x][0] && ch === o[x][1]) {
        if (lx === -1) {
          lx = x;
          ly = y;
        }
        continue;
      } else if (lx !== -1) {
        if (this.tput.strings.parm_right_cursor) {
          out += y === ly
            ? this.tput.cuf(x - lx)
            : this.tput.cup(y, x);
        } else {
          out += this.tput.cup(y, x);
        }
        lx = -1, ly = -1;
      }
      o[x][0] = data;
      o[x][1] = ch;

      if (data !== attr) {
        if (attr !== this.dattr) {
          out += '\x1b[m';
        }
        if (data !== this.dattr) {
          out += '\x1b[';

          bg = data & 0x1ff;
          fg = (data >> 9) & 0x1ff;
          flags = data >> 18;

          // bold
          if (flags & 1) {
            out += '1;';
          }

          // underline
          if (flags & 2) {
            out += '4;';
          }

          // blink
          if (flags & 4) {
            out += '5;';
          }

          // inverse
          if (flags & 8) {
            out += '7;';
          }

          // invisible
          if (flags & 16) {
            out += '8;';
          }

          if (bg !== 0x1ff) {
            bg = this._reduceColor(bg);
            if (bg < 16) {
              if (bg < 8) {
                bg += 40;
              } else if (bg < 16) {
                bg -= 8;
                bg += 100;
              }
              out += bg + ';';
            } else {
              out += '48;5;' + bg + ';';
            }
          }

          if (fg !== 0x1ff) {
            fg = this._reduceColor(fg);
            if (fg < 16) {
              if (fg < 8) {
                fg += 30;
              } else if (fg < 16) {
                fg -= 8;
                fg += 90;
              }
              out += fg + ';';
            } else {
              out += '38;5;' + fg + ';';
            }
          }

          if (out[out.length - 1] === ';') out = out.slice(0, -1);

          out += 'm';
        }
      }

      // If we find a double-width char, eat the next character which should be
      // a space due to parseContent's behavior.
      if (this.fullUnicode) {
        // If this is a surrogate pair double-width char, we can ignore it
        // because parseContent already counted it as length=2.
        if (unicode.charWidth(line[x][1]) === 2) {
          // NOTE: At cols=44, the bug that is avoided
          // by the angles check occurs in widget-unicode:
          // Might also need: `line[x + 1][0] !== line[x][0]`
          // for borderless boxes?
          if (x === line.length - 1 || angles[line[x + 1][1]]) {
            // If we're at the end, we don't have enough space for a
            // double-width. Overwrite it with a space and ignore.
            ch = ' ';
            o[x][1] = '\0';
          } else {
            // ALWAYS refresh double-width chars because this special cursor
            // behavior is needed. There may be a more efficient way of doing
            // this. See above.
            o[x][1] = '\0';
            // Eat the next character by moving forward and marking as a
            // space (which it is).
            o[++x][1] = '\0';
          }
        }
      }

      // Attempt to use ACS for supported characters.
      // This is not ideal, but it's how ncurses works.
      // There are a lot of terminals that support ACS
      // *and UTF8, but do not declare U8. So ACS ends
      // up being used (slower than utf8). Terminals
      // that do not support ACS and do not explicitly
      // support UTF8 get their unicode characters
      // replaced with really ugly ascii characters.
      // It is possible there is a terminal out there
      // somewhere that does not support ACS, but
      // supports UTF8, but I imagine it's unlikely.
      // Maybe remove !this.tput.unicode check, however,
      // this seems to be the way ncurses does it.
      if (this.tput.strings.enter_alt_charset_mode
          && !this.tput.brokenACS && (this.tput.acscr[ch] || acs)) {
        // Fun fact: even if this.tput.brokenACS wasn't checked here,
        // the linux console would still work fine because the acs
        // table would fail the check of: this.tput.acscr[ch]
        if (this.tput.acscr[ch]) {
          if (acs) {
            ch = this.tput.acscr[ch];
          } else {
            ch = this.tput.smacs()
              + this.tput.acscr[ch];
            acs = true;
          }
        } else if (acs) {
          ch = this.tput.rmacs() + ch;
          acs = false;
        }
      } else {
        // U8 is not consistently correct. Some terminfo's
        // terminals that do not declare it may actually
        // support utf8 (e.g. urxvt), but if the terminal
        // does not declare support for ACS (and U8), chances
        // are it does not support UTF8. This is probably
        // the "safest" way to do this. Should fix things
        // like sun-color.
        // NOTE: It could be the case that the $LANG
        // is all that matters in some cases:
        // if (!this.tput.unicode && ch > '~') {
        if (!this.tput.unicode && this.tput.numbers.U8 !== 1 && ch > '~') {
          ch = this.tput.utoa[ch] || '?';
        }
      }

      out += ch;
      attr = data;
    }

    if (attr !== this.dattr) {
      out += '\x1b[m';
    }

    if (out) {
      main += this.tput.cup(y, 0) + out;
    }
  }

  if (acs) {
    main += this.tput.rmacs();
    acs = false;
  }

  if (main) {
    pre = '';
    post = '';

    pre += this.tput.sc();
    post += this.tput.rc();

    if (!this.program.cursorHidden) {
      pre += this.tput.civis();
      post += this.tput.cnorm();
    }

    // this.program.flush();
    // this.program._owrite(pre + main + post);
    this.program._write(pre + main + post);
  }

  // this.emit('draw');
};

Screen.prototype._reduceColor = function(color) {
  return colors.reduce(color, this.tput.colors);
};

// Convert an SGR string to our own attribute format.
Screen.prototype.attrCode = function(code, cur, def) {
  var flags = (cur >> 18) & 0x1ff
    , fg = (cur >> 9) & 0x1ff
    , bg = cur & 0x1ff
    , c
    , i;

  code = code.slice(2, -1).split(';');
  if (!code[0]) code[0] = '0';

  for (i = 0; i < code.length; i++) {
    c = +code[i] || 0;
    switch (c) {
      case 0: // normal
        bg = def & 0x1ff;
        fg = (def >> 9) & 0x1ff;
        flags = (def >> 18) & 0x1ff;
        break;
      case 1: // bold
        flags |= 1;
        break;
      case 22:
        flags = (def >> 18) & 0x1ff;
        break;
      case 4: // underline
        flags |= 2;
        break;
      case 24:
        flags = (def >> 18) & 0x1ff;
        break;
      case 5: // blink
        flags |= 4;
        break;
      case 25:
        flags = (def >> 18) & 0x1ff;
        break;
      case 7: // inverse
        flags |= 8;
        break;
      case 27:
        flags = (def >> 18) & 0x1ff;
        break;
      case 8: // invisible
        flags |= 16;
        break;
      case 28:
        flags = (def >> 18) & 0x1ff;
        break;
      case 39: // default fg
        fg = (def >> 9) & 0x1ff;
        break;
      case 49: // default bg
        bg = def & 0x1ff;
        break;
      case 100: // default fg/bg
        fg = (def >> 9) & 0x1ff;
        bg = def & 0x1ff;
        break;
      default: // color
        if (c === 48 && +code[i+1] === 5) {
          i += 2;
          bg = +code[i];
          break;
        } else if (c === 48 && +code[i+1] === 2) {
          i += 2;
          bg = colors.match(+code[i], +code[i+1], +code[i+2]);
          if (bg === -1) bg = def & 0x1ff;
          i += 2;
          break;
        } else if (c === 38 && +code[i+1] === 5) {
          i += 2;
          fg = +code[i];
          break;
        } else if (c === 38 && +code[i+1] === 2) {
          i += 2;
          fg = colors.match(+code[i], +code[i+1], +code[i+2]);
          if (fg === -1) fg = (def >> 9) & 0x1ff;
          i += 2;
          break;
        }
        if (c >= 40 && c <= 47) {
          bg = c - 40;
        } else if (c >= 100 && c <= 107) {
          bg = c - 100;
          bg += 8;
        } else if (c === 49) {
          bg = def & 0x1ff;
        } else if (c >= 30 && c <= 37) {
          fg = c - 30;
        } else if (c >= 90 && c <= 97) {
          fg = c - 90;
          fg += 8;
        } else if (c === 39) {
          fg = (def >> 9) & 0x1ff;
        } else if (c === 100) {
          fg = (def >> 9) & 0x1ff;
          bg = def & 0x1ff;
        }
        break;
    }
  }

  return (flags << 18) | (fg << 9) | bg;
};

// Convert our own attribute format to an SGR string.
Screen.prototype.codeAttr = function(code) {
  var flags = (code >> 18) & 0x1ff
    , fg = (code >> 9) & 0x1ff
    , bg = code & 0x1ff
    , out = '';

  // bold
  if (flags & 1) {
    out += '1;';
  }

  // underline
  if (flags & 2) {
    out += '4;';
  }

  // blink
  if (flags & 4) {
    out += '5;';
  }

  // inverse
  if (flags & 8) {
    out += '7;';
  }

  // invisible
  if (flags & 16) {
    out += '8;';
  }

  if (bg !== 0x1ff) {
    bg = this._reduceColor(bg);
    if (bg < 16) {
      if (bg < 8) {
        bg += 40;
      } else if (bg < 16) {
        bg -= 8;
        bg += 100;
      }
      out += bg + ';';
    } else {
      out += '48;5;' + bg + ';';
    }
  }

  if (fg !== 0x1ff) {
    fg = this._reduceColor(fg);
    if (fg < 16) {
      if (fg < 8) {
        fg += 30;
      } else if (fg < 16) {
        fg -= 8;
        fg += 90;
      }
      out += fg + ';';
    } else {
      out += '38;5;' + fg + ';';
    }
  }

  if (out[out.length - 1] === ';') out = out.slice(0, -1);

  return '\x1b[' + out + 'm';
};

Screen.prototype.focusOffset = function(offset) {
  var shown = this.keyable.filter(function(el) {
    return !el.detached && el.visible;
  }).length;

  if (!shown || !offset) {
    return;
  }

  var i = this.keyable.indexOf(this.focused);
  if (!~i) return;

  if (offset > 0) {
    while (offset--) {
      if (++i > this.keyable.length - 1) i = 0;
      if (this.keyable[i].detached || !this.keyable[i].visible) offset++;
    }
  } else {
    offset = -offset;
    while (offset--) {
      if (--i < 0) i = this.keyable.length - 1;
      if (this.keyable[i].detached || !this.keyable[i].visible) offset++;
    }
  }

  return this.keyable[i].focus();
};

Screen.prototype.focusPrev =
Screen.prototype.focusPrevious = function() {
  return this.focusOffset(-1);
};

Screen.prototype.focusNext = function() {
  return this.focusOffset(1);
};

Screen.prototype.focusPush = function(el) {
  if (!el) return;
  var old = this.history[this.history.length - 1];
  if (this.history.length === 10) {
    this.history.shift();
  }
  this.history.push(el);
  this._focus(el, old);
};

Screen.prototype.focusPop = function() {
  var old = this.history.pop();
  if (this.history.length) {
    this._focus(this.history[this.history.length - 1], old);
  }
  return old;
};

Screen.prototype.saveFocus = function() {
  return this._savedFocus = this.focused;
};

Screen.prototype.restoreFocus = function() {
  if (!this._savedFocus) return;
  this._savedFocus.focus();
  delete this._savedFocus;
  return this.focused;
};

Screen.prototype.rewindFocus = function() {
  var old = this.history.pop()
    , el;

  while (this.history.length) {
    el = this.history.pop();
    if (!el.detached && el.visible) {
      this.history.push(el);
      this._focus(el, old);
      return el;
    }
  }

  if (old) {
    old.emit('blur');
  }
};

Screen.prototype._focus = function(self, old) {
  // Find a scrollable ancestor if we have one.
  var el = self;
  while (el = el.parent) {
    if (el.scrollable) break;
  }

  // If we're in a scrollable element,
  // automatically scroll to the focused element.
  if (el && !el.detached) {
    // NOTE: This is different from the other "visible" values - it needs the
    // visible height of the scrolling element itself, not the element within
    // it.
    var visible = self.screen.height - el.atop - el.itop - el.abottom - el.ibottom;
    if (self.rtop < el.childBase) {
      el.scrollTo(self.rtop);
      self.screen.render();
    } else if (self.rtop + self.height - self.ibottom > el.childBase + visible) {
      // Explanation for el.itop here: takes into account scrollable elements
      // with borders otherwise the element gets covered by the bottom border:
      el.scrollTo(self.rtop - (el.height - self.height) + el.itop, true);
      self.screen.render();
    }
  }

  if (old) {
    old.emit('blur', self);
  }

  self.emit('focus', old);
};

/* Depricated
Screen.prototype.__defineGetter__('focused', function() {
  return this.history[this.history.length - 1];
});

Screen.prototype.__defineSetter__('focused', function(el) {
  return this.focusPush(el);
});
*/
Object.defineProperty(Screen.prototype,'focused',{
  get: function () {return this.history[this.history.length - 1];},
  set: function (el) {
    return this.focusPush(el);  
  }
});

Screen.prototype.clearRegion = function(xi, xl, yi, yl, override) {
  return this.fillRegion(this.dattr, ' ', xi, xl, yi, yl, override);
};

Screen.prototype.fillRegion = function(attr, ch, xi, xl, yi, yl, override) {
  var lines = this.lines
    , cell
    , xx;

  if (xi < 0) xi = 0;
  if (yi < 0) yi = 0;

  for (; yi < yl; yi++) {
    if (!lines[yi]) break;
    for (xx = xi; xx < xl; xx++) {
      cell = lines[yi][xx];
      if (!cell) break;
      if (override || attr !== cell[0] || ch !== cell[1]) {
        lines[yi][xx][0] = attr;
        lines[yi][xx][1] = ch;
        lines[yi].dirty = true;
      }
    }
  }
};

Screen.prototype.key = function() {
  return this.program.key.apply(this, arguments);
};

Screen.prototype.onceKey = function() {
  return this.program.onceKey.apply(this, arguments);
};

Screen.prototype.unkey =
Screen.prototype.removeKey = function() {
  return this.program.unkey.apply(this, arguments);
};

Screen.prototype.spawn = function(file, args, options) {
  if (!Array.isArray(args)) {
    options = args;
    args = [];
  }

  var screen = this
    , program = screen.program
    , spawn = require('child_process').spawn
    , mouse = program.mouseEnabled
    , ps;

  options = options || {};

  options.stdio = options.stdio || 'inherit';

  program.lsaveCursor('spawn');
  // program.csr(0, program.rows - 1);
  program.normalBuffer();
  program.showCursor();
  if (mouse) program.disableMouse();

  var write = program.output.write;
  program.output.write = function() {};
  program.input.pause();
  if (program.input.setRawMode) {
    program.input.setRawMode(false);
  }

  var resume = function() {
    if (resume.done) return;
    resume.done = true;

    if (program.input.setRawMode) {
      program.input.setRawMode(true);
    }
    program.input.resume();
    program.output.write = write;

    program.alternateBuffer();
    // program.csr(0, program.rows - 1);
    if (mouse) {
      program.enableMouse();
      if (screen.options.sendFocus) {
        screen.program.setMouse({ sendFocus: true }, true);
      }
    }

    screen.alloc();
    screen.render();

    screen.program.lrestoreCursor('spawn', true);
  };

  ps = spawn(file, args, options);

  ps.on('error', resume);

  ps.on('exit', resume);

  return ps;
};

Screen.prototype.exec = function(file, args, options, callback) {
  var ps = this.spawn(file, args, options);

  ps.on('error', function(err) {
    if (!callback) return;
    return callback(err, false);
  });

  ps.on('exit', function(code) {
    if (!callback) return;
    return callback(null, code === 0);
  });

  return ps;
};

Screen.prototype.readEditor = function(options, callback) {
  if (typeof options === 'string') {
    options = { editor: options };
  }

  if (!callback) {
    callback = options;
    options = null;
  }

  if (!callback) {
    callback = function() {};
  }

  options = options || {};

  var self = this
    , editor = options.editor || process.env.EDITOR || 'vi'
    , name = options.name || process.title || 'blessed'
    , rnd = Math.random().toString(36).split('.').pop()
    , file = '/tmp/' + name + '.' + rnd
    , args = [file]
    , opt;

  opt = {
    stdio: 'inherit',
    env: process.env,
    cwd: process.env.HOME
  };

  function writeFile(callback) {
    if (!options.value) return callback();
    return fs.writeFile(file, options.value, callback);
  }

  return writeFile(function(err) {
    if (err) return callback(err);
    return self.exec(editor, args, opt, function(err, success) {
      if (err) return callback(err);
      return fs.readFile(file, 'utf8', function(err, data) {
        return fs.unlink(file, function() {
          if (!success) return callback(new Error('Unsuccessful.'));
          if (err) return callback(err);
          return callback(null, data);
        });
      });
    });
  });
};

Screen.prototype.displayImage = function(file, callback) {
  if (!file) {
    if (!callback) return;
    return callback(new Error('No image.'));
  }

  file = path.resolve(process.cwd(), file);

  if (!~file.indexOf('://')) {
    file = 'file://' + file;
  }

  var args = ['w3m', '-T', 'text/html'];

  var input = '<title>press q to exit</title>'
    + '<img align="center" src="' + file + '">';

  var opt = {
    stdio: ['pipe', 1, 2],
    env: process.env,
    cwd: process.env.HOME
  };

  var ps = this.spawn(args[0], args.slice(1), opt);

  ps.on('error', function(err) {
    if (!callback) return;
    return callback(err);
  });

  ps.on('exit', function(code) {
    if (!callback) return;
    if (code !== 0) return callback(new Error('Exit Code: ' + code));
    return callback(null, code === 0);
  });

  ps.stdin.write(input + '\n');
  ps.stdin.end();
};

Screen.prototype.setEffects = function(el, fel, over, out, effects, temp) {
  if (!effects) return;

  var tmp = {};
  if (temp) el[temp] = tmp;

  if (typeof el !== 'function') {
    var _el = el;
    el = function() { return _el; };
  }

  fel.on(over, function() {
    var element = el();
    Object.keys(effects).forEach(function(key) {
      var val = effects[key];
      if (val !== null && typeof val === 'object') {
        tmp[key] = tmp[key] || {};
        // element.style[key] = element.style[key] || {};
        Object.keys(val).forEach(function(k) {
          var v = val[k];
          tmp[key][k] = element.style[key][k];
          element.style[key][k] = v;
        });
        return;
      }
      tmp[key] = element.style[key];
      element.style[key] = val;
    });
    element.screen.render();
  });

  fel.on(out, function() {
    var element = el();
    Object.keys(effects).forEach(function(key) {
      var val = effects[key];
      if (val !== null && typeof val === 'object') {
        tmp[key] = tmp[key] || {};
        // element.style[key] = element.style[key] || {};
        Object.keys(val).forEach(function(k) {
          if (tmp[key].hasOwnProperty(k)) {
            element.style[key][k] = tmp[key][k];
          }
        });
        return;
      }
      if (tmp.hasOwnProperty(key)) {
        element.style[key] = tmp[key];
      }
    });
    element.screen.render();
  });
};

Screen.prototype.sigtstp = function(callback) {
  var self = this;
  this.program.sigtstp(function() {
    self.alloc();
    self.render();
    self.program.lrestoreCursor('pause', true);
    if (callback) callback();
  });
};

Screen.prototype.copyToClipboard = function(text) {
  return this.program.copyToClipboard(text);
};

Screen.prototype.cursorShape = function(shape, blink) {
  var self = this;

  this.cursor.shape = shape || 'block';
  this.cursor.blink = blink || false;
  this.cursor._set = true;

  if (this.cursor.artificial) {
    if (!this.program.hideCursor_old) {
      var hideCursor = this.program.hideCursor;
      this.program.hideCursor_old = this.program.hideCursor;
      this.program.hideCursor = function() {
        hideCursor.call(self.program);
        self.cursor._hidden = true;
        if (self.renders) self.render();
      };
    }
    if (!this.program.showCursor_old) {
      var showCursor = this.program.showCursor;
      this.program.showCursor_old = this.program.showCursor;
      this.program.showCursor = function() {
        self.cursor._hidden = false;
        if (self.program._exiting) showCursor.call(self.program);
        if (self.renders) self.render();
      };
    }
    if (!this._cursorBlink) {
      this._cursorBlink = setInterval(function() {
        if (!self.cursor.blink) return;
        self.cursor._state ^= 1;
        if (self.renders) self.render();
      }, 500);
      if (this._cursorBlink.unref) {
        this._cursorBlink.unref();
      }
    }
    return true;
  }

  return this.program.cursorShape(this.cursor.shape, this.cursor.blink);
};

Screen.prototype.cursorColor = function(color) {
  this.cursor.color = color != null
    ? colors.convert(color)
    : null;
  this.cursor._set = true;

  if (this.cursor.artificial) {
    return true;
  }

  return this.program.cursorColor(colors.ncolors[this.cursor.color]);
};

Screen.prototype.cursorReset =
Screen.prototype.resetCursor = function() {
  this.cursor.shape = 'block';
  this.cursor.blink = false;
  this.cursor.color = null;
  this.cursor._set = false;

  if (this.cursor.artificial) {
    this.cursor.artificial = false;
    if (this.program.hideCursor_old) {
      this.program.hideCursor = this.program.hideCursor_old;
      delete this.program.hideCursor_old;
    }
    if (this.program.showCursor_old) {
      this.program.showCursor = this.program.showCursor_old;
      delete this.program.showCursor_old;
    }
    if (this._cursorBlink) {
      clearInterval(this._cursorBlink);
      delete this._cursorBlink;
    }
    return true;
  }

  return this.program.cursorReset();
};

Screen.prototype._cursorAttr = function(cursor, dattr) {
  var attr = dattr || this.dattr
    , cattr
    , ch;

  if (cursor.shape === 'line') {
    attr &= ~(0x1ff << 9);
    attr |= 7 << 9;
    ch = '\u2502';
  } else if (cursor.shape === 'underline') {
    attr &= ~(0x1ff << 9);
    attr |= 7 << 9;
    attr |= 2 << 18;
  } else if (cursor.shape === 'block') {
    attr &= ~(0x1ff << 9);
    attr |= 7 << 9;
    attr |= 8 << 18;
  } else if (typeof cursor.shape === 'object' && cursor.shape) {
    cattr = Element.prototype.sattr.call(cursor, cursor.shape);

    if (cursor.shape.bold || cursor.shape.underline
        || cursor.shape.blink || cursor.shape.inverse
        || cursor.shape.invisible) {
      attr &= ~(0x1ff << 18);
      attr |= ((cattr >> 18) & 0x1ff) << 18;
    }

    if (cursor.shape.fg) {
      attr &= ~(0x1ff << 9);
      attr |= ((cattr >> 9) & 0x1ff) << 9;
    }

    if (cursor.shape.bg) {
      attr &= ~(0x1ff << 0);
      attr |= cattr & 0x1ff;
    }

    if (cursor.shape.ch) {
      ch = cursor.shape.ch;
    }
  }

  if (cursor.color != null) {
    attr &= ~(0x1ff << 9);
    attr |= cursor.color << 9;
  }

  return {
    ch: ch,
    attr: attr
  };
};

Screen.prototype.screenshot = function(xi, xl, yi, yl, term) {
  if (xi == null) xi = 0;
  if (xl == null) xl = this.cols;
  if (yi == null) yi = 0;
  if (yl == null) yl = this.rows;

  if (xi < 0) xi = 0;
  if (yi < 0) yi = 0;

  var x
    , y
    , line
    , out
    , ch
    , data
    , attr;

  var sdattr = this.dattr;

  if (term) {
    this.dattr = term.defAttr;
  }

  var main = '';

  for (y = yi; y < yl; y++) {
    line = term
      ? term.lines[y]
      : this.lines[y];

    if (!line) break;

    out = '';
    attr = this.dattr;

    for (x = xi; x < xl; x++) {
      if (!line[x]) break;

      data = line[x][0];
      ch = line[x][1];

      if (data !== attr) {
        if (attr !== this.dattr) {
          out += '\x1b[m';
        }
        if (data !== this.dattr) {
          var _data = data;
          if (term) {
            if (((_data >> 9) & 0x1ff) === 257) _data |= 0x1ff << 9;
            if ((_data & 0x1ff) === 256) _data |= 0x1ff;
          }
          out += this.codeAttr(_data);
        }
      }

      if (this.fullUnicode) {
        if (unicode.charWidth(line[x][1]) === 2) {
          if (x === xl - 1) {
            ch = ' ';
          } else {
            x++;
          }
        }
      }

      out += ch;
      attr = data;
    }

    if (attr !== this.dattr) {
      out += '\x1b[m';
    }

    if (out) {
      main += (y > 0 ? '\n' : '') + out;
    }
  }

  main = main.replace(/(?:\s*\x1b\[40m\s*\x1b\[m\s*)*$/, '') + '\n';

  if (term) {
    this.dattr = sdattr;
  }

  return main;
};

/**
 * Positioning
 */

Screen.prototype._getPos = function() {
  return this;
};

/**
 * Angle Table
 */

var angles = {
  '\u2518': true, // '┘'
  '\u2510': true, // '┐'
  '\u250c': true, // '┌'
  '\u2514': true, // '└'
  '\u253c': true, // '┼'
  '\u251c': true, // '├'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u252c': true, // '┬'
  '\u2502': true, // '│'
  '\u2500': true  // '─'
};

var langles = {
  '\u250c': true, // '┌'
  '\u2514': true, // '└'
  '\u253c': true, // '┼'
  '\u251c': true, // '├'
  '\u2534': true, // '┴'
  '\u252c': true, // '┬'
  '\u2500': true  // '─'
};

var uangles = {
  '\u2510': true, // '┐'
  '\u250c': true, // '┌'
  '\u253c': true, // '┼'
  '\u251c': true, // '├'
  '\u2524': true, // '┤'
  '\u252c': true, // '┬'
  '\u2502': true  // '│'
};

var rangles = {
  '\u2518': true, // '┘'
  '\u2510': true, // '┐'
  '\u253c': true, // '┼'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u252c': true, // '┬'
  '\u2500': true  // '─'
};

var dangles = {
  '\u2518': true, // '┘'
  '\u2514': true, // '└'
  '\u253c': true, // '┼'
  '\u251c': true, // '├'
  '\u2524': true, // '┤'
  '\u2534': true, // '┴'
  '\u2502': true  // '│'
};

// var cdangles = {
//   '\u250c': true  // '┌'
// };

// Every ACS angle character can be
// represented by 4 bits ordered like this:
// [langle][uangle][rangle][dangle]
var angleTable = {
  '0000': '', // ?
  '0001': '\u2502', // '│' // ?
  '0010': '\u2500', // '─' // ??
  '0011': '\u250c', // '┌'
  '0100': '\u2502', // '│' // ?
  '0101': '\u2502', // '│'
  '0110': '\u2514', // '└'
  '0111': '\u251c', // '├'
  '1000': '\u2500', // '─' // ??
  '1001': '\u2510', // '┐'
  '1010': '\u2500', // '─' // ??
  '1011': '\u252c', // '┬'
  '1100': '\u2518', // '┘'
  '1101': '\u2524', // '┤'
  '1110': '\u2534', // '┴'
  '1111': '\u253c'  // '┼'
};

Object.keys(angleTable).forEach(function(key) {
  angleTable[parseInt(key, 2)] = angleTable[key];
  delete angleTable[key];
});

/**
 * Expose
 */

module.exports = Screen;
};
BundleModuleCode['term/unicode']=function (module,exports,global,process){
/**
 * unicode.js - east asian width and surrogate pairs
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 * Borrowed from vangie/east-asian-width, komagata/eastasianwidth,
 * and mathiasbynens/String.prototype.codePointAt. Licenses below.
 */

// east-asian-width
//
// Copyright (c) 2015 Vangie Du
// https://github.com/vangie/east-asian-width
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

// eastasianwidth
//
// Copyright (c) 2013, Masaki Komagata
// https://github.com/komagata/eastasianwidth
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// String.prototype.codePointAt
//
// Copyright Mathias Bynens <https://mathiasbynens.be/>
// https://github.com/mathiasbynens/String.prototype.codePointAt
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// String.fromCodePoint
//
// Copyright Mathias Bynens <https://mathiasbynens.be/>
// https://github.com/mathiasbynens/String.fromCodePoint
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var stringFromCharCode = String.fromCharCode;
var floor = Math.floor;

/**
 * Wide, Surrogates, and Combining
 */

exports.charWidth = function(str, i) {
  var point = typeof str !== 'number'
    ? exports.codePointAt(str, i || 0)
    : str;

  // nul
  if (point === 0) return 0;

  // tab
  if (point === 0x09) {
    if (!exports.blessed) {
      // TODO? ??? exports.blessed = require('../');
    }
    return exports.blessed.screen.global
      ? exports.blessed.screen.global.tabc.length
      : 8;
  }

  // 8-bit control characters (2-width according to unicode??)
  if (point < 32 || (point >= 0x7f && point < 0xa0)) {
    return 0;
  }

  // search table of non-spacing characters
  // is ucs combining or C0/C1 control character
  if (exports.combining[point]) {
    return 0;
  }

  // check for double-wide
  // if (point >= 0x1100
  //     && (point <= 0x115f // Hangul Jamo init. consonants
  //     || point === 0x2329 || point === 0x232a
  //     || (point >= 0x2e80 && point <= 0xa4cf
  //     && point !== 0x303f) // CJK ... Yi
  //     || (point >= 0xac00 && point <= 0xd7a3) // Hangul Syllables
  //     || (point >= 0xf900 && point <= 0xfaff) // CJK Compatibility Ideographs
  //     || (point >= 0xfe10 && point <= 0xfe19) // Vertical forms
  //     || (point >= 0xfe30 && point <= 0xfe6f) // CJK Compatibility Forms
  //     || (point >= 0xff00 && point <= 0xff60) // Fullwidth Forms
  //     || (point >= 0xffe0 && point <= 0xffe6)
  //     || (point >= 0x20000 && point <= 0x2fffd)
  //     || (point >= 0x30000 && point <= 0x3fffd))) {
  //   return 2;
  // }

  // check for double-wide
  if ((0x3000 === point)
      || (0xFF01 <= point && point <= 0xFF60)
      || (0xFFE0 <= point && point <= 0xFFE6)) {
    return 2;
  }

  if ((0x1100 <= point && point <= 0x115F)
      || (0x11A3 <= point && point <= 0x11A7)
      || (0x11FA <= point && point <= 0x11FF)
      || (0x2329 <= point && point <= 0x232A)
      || (0x2E80 <= point && point <= 0x2E99)
      || (0x2E9B <= point && point <= 0x2EF3)
      || (0x2F00 <= point && point <= 0x2FD5)
      || (0x2FF0 <= point && point <= 0x2FFB)
      || (0x3001 <= point && point <= 0x303E)
      || (0x3041 <= point && point <= 0x3096)
      || (0x3099 <= point && point <= 0x30FF)
      || (0x3105 <= point && point <= 0x312D)
      || (0x3131 <= point && point <= 0x318E)
      || (0x3190 <= point && point <= 0x31BA)
      || (0x31C0 <= point && point <= 0x31E3)
      || (0x31F0 <= point && point <= 0x321E)
      || (0x3220 <= point && point <= 0x3247)
      || (0x3250 <= point && point <= 0x32FE)
      || (0x3300 <= point && point <= 0x4DBF)
      || (0x4E00 <= point && point <= 0xA48C)
      || (0xA490 <= point && point <= 0xA4C6)
      || (0xA960 <= point && point <= 0xA97C)
      || (0xAC00 <= point && point <= 0xD7A3)
      || (0xD7B0 <= point && point <= 0xD7C6)
      || (0xD7CB <= point && point <= 0xD7FB)
      || (0xF900 <= point && point <= 0xFAFF)
      || (0xFE10 <= point && point <= 0xFE19)
      || (0xFE30 <= point && point <= 0xFE52)
      || (0xFE54 <= point && point <= 0xFE66)
      || (0xFE68 <= point && point <= 0xFE6B)
      || (0x1B000 <= point && point <= 0x1B001)
      || (0x1F200 <= point && point <= 0x1F202)
      || (0x1F210 <= point && point <= 0x1F23A)
      || (0x1F240 <= point && point <= 0x1F248)
      || (0x1F250 <= point && point <= 0x1F251)
      || (0x20000 <= point && point <= 0x2F73F)
      || (0x2B740 <= point && point <= 0x2FFFD)
      || (0x30000 <= point && point <= 0x3FFFD)) {
    return 2;
  }

  // CJK Ambiguous
  // http://www.unicode.org/reports/tr11/
  // http://www.unicode.org/reports/tr11/#Ambiguous
  if (process.env.NCURSES_CJK_WIDTH) {
    if ((0x00A1 === point)
        || (0x00A4 === point)
        || (0x00A7 <= point && point <= 0x00A8)
        || (0x00AA === point)
        || (0x00AD <= point && point <= 0x00AE)
        || (0x00B0 <= point && point <= 0x00B4)
        || (0x00B6 <= point && point <= 0x00BA)
        || (0x00BC <= point && point <= 0x00BF)
        || (0x00C6 === point)
        || (0x00D0 === point)
        || (0x00D7 <= point && point <= 0x00D8)
        || (0x00DE <= point && point <= 0x00E1)
        || (0x00E6 === point)
        || (0x00E8 <= point && point <= 0x00EA)
        || (0x00EC <= point && point <= 0x00ED)
        || (0x00F0 === point)
        || (0x00F2 <= point && point <= 0x00F3)
        || (0x00F7 <= point && point <= 0x00FA)
        || (0x00FC === point)
        || (0x00FE === point)
        || (0x0101 === point)
        || (0x0111 === point)
        || (0x0113 === point)
        || (0x011B === point)
        || (0x0126 <= point && point <= 0x0127)
        || (0x012B === point)
        || (0x0131 <= point && point <= 0x0133)
        || (0x0138 === point)
        || (0x013F <= point && point <= 0x0142)
        || (0x0144 === point)
        || (0x0148 <= point && point <= 0x014B)
        || (0x014D === point)
        || (0x0152 <= point && point <= 0x0153)
        || (0x0166 <= point && point <= 0x0167)
        || (0x016B === point)
        || (0x01CE === point)
        || (0x01D0 === point)
        || (0x01D2 === point)
        || (0x01D4 === point)
        || (0x01D6 === point)
        || (0x01D8 === point)
        || (0x01DA === point)
        || (0x01DC === point)
        || (0x0251 === point)
        || (0x0261 === point)
        || (0x02C4 === point)
        || (0x02C7 === point)
        || (0x02C9 <= point && point <= 0x02CB)
        || (0x02CD === point)
        || (0x02D0 === point)
        || (0x02D8 <= point && point <= 0x02DB)
        || (0x02DD === point)
        || (0x02DF === point)
        || (0x0300 <= point && point <= 0x036F)
        || (0x0391 <= point && point <= 0x03A1)
        || (0x03A3 <= point && point <= 0x03A9)
        || (0x03B1 <= point && point <= 0x03C1)
        || (0x03C3 <= point && point <= 0x03C9)
        || (0x0401 === point)
        || (0x0410 <= point && point <= 0x044F)
        || (0x0451 === point)
        || (0x2010 === point)
        || (0x2013 <= point && point <= 0x2016)
        || (0x2018 <= point && point <= 0x2019)
        || (0x201C <= point && point <= 0x201D)
        || (0x2020 <= point && point <= 0x2022)
        || (0x2024 <= point && point <= 0x2027)
        || (0x2030 === point)
        || (0x2032 <= point && point <= 0x2033)
        || (0x2035 === point)
        || (0x203B === point)
        || (0x203E === point)
        || (0x2074 === point)
        || (0x207F === point)
        || (0x2081 <= point && point <= 0x2084)
        || (0x20AC === point)
        || (0x2103 === point)
        || (0x2105 === point)
        || (0x2109 === point)
        || (0x2113 === point)
        || (0x2116 === point)
        || (0x2121 <= point && point <= 0x2122)
        || (0x2126 === point)
        || (0x212B === point)
        || (0x2153 <= point && point <= 0x2154)
        || (0x215B <= point && point <= 0x215E)
        || (0x2160 <= point && point <= 0x216B)
        || (0x2170 <= point && point <= 0x2179)
        || (0x2189 === point)
        || (0x2190 <= point && point <= 0x2199)
        || (0x21B8 <= point && point <= 0x21B9)
        || (0x21D2 === point)
        || (0x21D4 === point)
        || (0x21E7 === point)
        || (0x2200 === point)
        || (0x2202 <= point && point <= 0x2203)
        || (0x2207 <= point && point <= 0x2208)
        || (0x220B === point)
        || (0x220F === point)
        || (0x2211 === point)
        || (0x2215 === point)
        || (0x221A === point)
        || (0x221D <= point && point <= 0x2220)
        || (0x2223 === point)
        || (0x2225 === point)
        || (0x2227 <= point && point <= 0x222C)
        || (0x222E === point)
        || (0x2234 <= point && point <= 0x2237)
        || (0x223C <= point && point <= 0x223D)
        || (0x2248 === point)
        || (0x224C === point)
        || (0x2252 === point)
        || (0x2260 <= point && point <= 0x2261)
        || (0x2264 <= point && point <= 0x2267)
        || (0x226A <= point && point <= 0x226B)
        || (0x226E <= point && point <= 0x226F)
        || (0x2282 <= point && point <= 0x2283)
        || (0x2286 <= point && point <= 0x2287)
        || (0x2295 === point)
        || (0x2299 === point)
        || (0x22A5 === point)
        || (0x22BF === point)
        || (0x2312 === point)
        || (0x2460 <= point && point <= 0x24E9)
        || (0x24EB <= point && point <= 0x254B)
        || (0x2550 <= point && point <= 0x2573)
        || (0x2580 <= point && point <= 0x258F)
        || (0x2592 <= point && point <= 0x2595)
        || (0x25A0 <= point && point <= 0x25A1)
        || (0x25A3 <= point && point <= 0x25A9)
        || (0x25B2 <= point && point <= 0x25B3)
        || (0x25B6 <= point && point <= 0x25B7)
        || (0x25BC <= point && point <= 0x25BD)
        || (0x25C0 <= point && point <= 0x25C1)
        || (0x25C6 <= point && point <= 0x25C8)
        || (0x25CB === point)
        || (0x25CE <= point && point <= 0x25D1)
        || (0x25E2 <= point && point <= 0x25E5)
        || (0x25EF === point)
        || (0x2605 <= point && point <= 0x2606)
        || (0x2609 === point)
        || (0x260E <= point && point <= 0x260F)
        || (0x2614 <= point && point <= 0x2615)
        || (0x261C === point)
        || (0x261E === point)
        || (0x2640 === point)
        || (0x2642 === point)
        || (0x2660 <= point && point <= 0x2661)
        || (0x2663 <= point && point <= 0x2665)
        || (0x2667 <= point && point <= 0x266A)
        || (0x266C <= point && point <= 0x266D)
        || (0x266F === point)
        || (0x269E <= point && point <= 0x269F)
        || (0x26BE <= point && point <= 0x26BF)
        || (0x26C4 <= point && point <= 0x26CD)
        || (0x26CF <= point && point <= 0x26E1)
        || (0x26E3 === point)
        || (0x26E8 <= point && point <= 0x26FF)
        || (0x273D === point)
        || (0x2757 === point)
        || (0x2776 <= point && point <= 0x277F)
        || (0x2B55 <= point && point <= 0x2B59)
        || (0x3248 <= point && point <= 0x324F)
        || (0xE000 <= point && point <= 0xF8FF)
        || (0xFE00 <= point && point <= 0xFE0F)
        || (0xFFFD === point)
        || (0x1F100 <= point && point <= 0x1F10A)
        || (0x1F110 <= point && point <= 0x1F12D)
        || (0x1F130 <= point && point <= 0x1F169)
        || (0x1F170 <= point && point <= 0x1F19A)
        || (0xE0100 <= point && point <= 0xE01EF)
        || (0xF0000 <= point && point <= 0xFFFFD)
        || (0x100000 <= point && point <= 0x10FFFD)) {
      return +process.env.NCURSES_CJK_WIDTH || 1;
    }
  }

  return 1;
};

exports.strWidth = function(str) {
  var width = 0;
  for (var i = 0; i < str.length; i++) {
    width += exports.charWidth(str, i);
    if (exports.isSurrogate(str, i)) i++;
  }
  return width;
};

exports.isSurrogate = function(str, i) {
  var point = typeof str !== 'number'
    ? exports.codePointAt(str, i || 0)
    : str;
  return point > 0x00ffff;
};

exports.combiningTable = [
  [0x0300, 0x036F],   [0x0483, 0x0486],   [0x0488, 0x0489],
  [0x0591, 0x05BD],   [0x05BF, 0x05BF],   [0x05C1, 0x05C2],
  [0x05C4, 0x05C5],   [0x05C7, 0x05C7],   [0x0600, 0x0603],
  [0x0610, 0x0615],   [0x064B, 0x065E],   [0x0670, 0x0670],
  [0x06D6, 0x06E4],   [0x06E7, 0x06E8],   [0x06EA, 0x06ED],
  [0x070F, 0x070F],   [0x0711, 0x0711],   [0x0730, 0x074A],
  [0x07A6, 0x07B0],   [0x07EB, 0x07F3],   [0x0901, 0x0902],
  [0x093C, 0x093C],   [0x0941, 0x0948],   [0x094D, 0x094D],
  [0x0951, 0x0954],   [0x0962, 0x0963],   [0x0981, 0x0981],
  [0x09BC, 0x09BC],   [0x09C1, 0x09C4],   [0x09CD, 0x09CD],
  [0x09E2, 0x09E3],   [0x0A01, 0x0A02],   [0x0A3C, 0x0A3C],
  [0x0A41, 0x0A42],   [0x0A47, 0x0A48],   [0x0A4B, 0x0A4D],
  [0x0A70, 0x0A71],   [0x0A81, 0x0A82],   [0x0ABC, 0x0ABC],
  [0x0AC1, 0x0AC5],   [0x0AC7, 0x0AC8],   [0x0ACD, 0x0ACD],
  [0x0AE2, 0x0AE3],   [0x0B01, 0x0B01],   [0x0B3C, 0x0B3C],
  [0x0B3F, 0x0B3F],   [0x0B41, 0x0B43],   [0x0B4D, 0x0B4D],
  [0x0B56, 0x0B56],   [0x0B82, 0x0B82],   [0x0BC0, 0x0BC0],
  [0x0BCD, 0x0BCD],   [0x0C3E, 0x0C40],   [0x0C46, 0x0C48],
  [0x0C4A, 0x0C4D],   [0x0C55, 0x0C56],   [0x0CBC, 0x0CBC],
  [0x0CBF, 0x0CBF],   [0x0CC6, 0x0CC6],   [0x0CCC, 0x0CCD],
  [0x0CE2, 0x0CE3],   [0x0D41, 0x0D43],   [0x0D4D, 0x0D4D],
  [0x0DCA, 0x0DCA],   [0x0DD2, 0x0DD4],   [0x0DD6, 0x0DD6],
  [0x0E31, 0x0E31],   [0x0E34, 0x0E3A],   [0x0E47, 0x0E4E],
  [0x0EB1, 0x0EB1],   [0x0EB4, 0x0EB9],   [0x0EBB, 0x0EBC],
  [0x0EC8, 0x0ECD],   [0x0F18, 0x0F19],   [0x0F35, 0x0F35],
  [0x0F37, 0x0F37],   [0x0F39, 0x0F39],   [0x0F71, 0x0F7E],
  [0x0F80, 0x0F84],   [0x0F86, 0x0F87],   [0x0F90, 0x0F97],
  [0x0F99, 0x0FBC],   [0x0FC6, 0x0FC6],   [0x102D, 0x1030],
  [0x1032, 0x1032],   [0x1036, 0x1037],   [0x1039, 0x1039],
  [0x1058, 0x1059],   [0x1160, 0x11FF],   [0x135F, 0x135F],
  [0x1712, 0x1714],   [0x1732, 0x1734],   [0x1752, 0x1753],
  [0x1772, 0x1773],   [0x17B4, 0x17B5],   [0x17B7, 0x17BD],
  [0x17C6, 0x17C6],   [0x17C9, 0x17D3],   [0x17DD, 0x17DD],
  [0x180B, 0x180D],   [0x18A9, 0x18A9],   [0x1920, 0x1922],
  [0x1927, 0x1928],   [0x1932, 0x1932],   [0x1939, 0x193B],
  [0x1A17, 0x1A18],   [0x1B00, 0x1B03],   [0x1B34, 0x1B34],
  [0x1B36, 0x1B3A],   [0x1B3C, 0x1B3C],   [0x1B42, 0x1B42],
  [0x1B6B, 0x1B73],   [0x1DC0, 0x1DCA],   [0x1DFE, 0x1DFF],
  [0x200B, 0x200F],   [0x202A, 0x202E],   [0x2060, 0x2063],
  [0x206A, 0x206F],   [0x20D0, 0x20EF],   [0x302A, 0x302F],
  [0x3099, 0x309A],   [0xA806, 0xA806],   [0xA80B, 0xA80B],
  [0xA825, 0xA826],   [0xFB1E, 0xFB1E],   [0xFE00, 0xFE0F],
  [0xFE20, 0xFE23],   [0xFEFF, 0xFEFF],   [0xFFF9, 0xFFFB],
  [0x10A01, 0x10A03], [0x10A05, 0x10A06], [0x10A0C, 0x10A0F],
  [0x10A38, 0x10A3A], [0x10A3F, 0x10A3F], [0x1D167, 0x1D169],
  [0x1D173, 0x1D182], [0x1D185, 0x1D18B], [0x1D1AA, 0x1D1AD],
  [0x1D242, 0x1D244], [0xE0001, 0xE0001], [0xE0020, 0xE007F],
  [0xE0100, 0xE01EF]
];

exports.combining = exports.combiningTable.reduce(function(out, row) {
  for (var i = row[0]; i <= row[1]; i++) {
    out[i] = true;
  }
  return out;
}, {});

exports.isCombining = function(str, i) {
  var point = typeof str !== 'number'
    ? exports.codePointAt(str, i || 0)
    : str;
  return exports.combining[point] === true;
};

/**
 * Code Point Helpers
 */

exports.codePointAt = function(str, position) {
  if (str == null) {
    throw TypeError();
  }
  var string = String(str);
  if (string.codePointAt) {
    return string.codePointAt(position);
  }
  var size = string.length;
  // `ToInteger`
  var index = position ? Number(position) : 0;
  if (index !== index) { // better `isNaN`
    index = 0;
  }
  // Account for out-of-bounds indices:
  if (index < 0 || index >= size) {
    return undefined;
  }
  // Get the first code unit
  var first = string.charCodeAt(index);
  var second;
  if ( // check if it’s the start of a surrogate pair
    first >= 0xD800 && first <= 0xDBFF && // high surrogate
    size > index + 1 // there is a next code unit
  ) {
    second = string.charCodeAt(index + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
    }
  }
  return first;
};

// exports.codePointAt = function(str, position) {
//   position = +position || 0;
//   var x = str.charCodeAt(position);
//   var y = str.length > 1 ? str.charCodeAt(position + 1) : 0;
//   var point = x;
//   if ((0xD800 <= x && x <= 0xDBFF) && (0xDC00 <= y && y <= 0xDFFF)) {
//     x &= 0x3FF;
//     y &= 0x3FF;
//     point = (x << 10) | y;
//     point += 0x10000;
//   }
//   return point;
// };

exports.fromCodePoint = function() {
  if (String.fromCodePoint) {
    return String.fromCodePoint.apply(String, arguments);
  }
  var MAX_SIZE = 0x4000;
  var codeUnits = [];
  var highSurrogate;
  var lowSurrogate;
  var index = -1;
  var length = arguments.length;
  if (!length) {
    return '';
  }
  var result = '';
  while (++index < length) {
    var codePoint = Number(arguments[index]);
    if (
      !isFinite(codePoint) ||       // `NaN`, `+Infinity`, or `-Infinity`
      codePoint < 0 ||              // not a valid Unicode code point
      codePoint > 0x10FFFF ||       // not a valid Unicode code point
      floor(codePoint) !== codePoint // not an integer
    ) {
      throw RangeError('Invalid code point: ' + codePoint);
    }
    if (codePoint <= 0xFFFF) { // BMP code point
      codeUnits.push(codePoint);
    } else { // Astral code point; split in surrogate halves
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      codePoint -= 0x10000;
      highSurrogate = (codePoint >> 10) + 0xD800;
      lowSurrogate = (codePoint % 0x400) + 0xDC00;
      codeUnits.push(highSurrogate, lowSurrogate);
    }
    if (index + 1 === length || codeUnits.length > MAX_SIZE) {
      result += stringFromCharCode.apply(null, codeUnits);
      codeUnits.length = 0;
    }
  }
  return result;
};

/**
 * Regexes
 */

exports.chars = {};

// Double width characters that are _not_ surrogate pairs.
// NOTE: 0x20000 - 0x2fffd and 0x30000 - 0x3fffd are not necessary for this
// regex anyway. This regex is used to put a blank char after wide chars to
// be eaten, however, if this is a surrogate pair, parseContent already adds
// the extra one char because its length equals 2 instead of 1.
exports.chars.wide = new RegExp('(['
  + '\\u1100-\\u115f' // Hangul Jamo init. consonants
  + '\\u2329\\u232a'
  + '\\u2e80-\\u303e\\u3040-\\ua4cf' // CJK ... Yi
  + '\\uac00-\\ud7a3' // Hangul Syllables
  + '\\uf900-\\ufaff' // CJK Compatibility Ideographs
  + '\\ufe10-\\ufe19' // Vertical forms
  + '\\ufe30-\\ufe6f' // CJK Compatibility Forms
  + '\\uff00-\\uff60' // Fullwidth Forms
  + '\\uffe0-\\uffe6'
  + '])', 'g');

// All surrogate pair wide chars.
exports.chars.swide = new RegExp('('
  // 0x20000 - 0x2fffd:
  + '[\\ud840-\\ud87f][\\udc00-\\udffd]'
  + '|'
  // 0x30000 - 0x3fffd:
  + '[\\ud880-\\ud8bf][\\udc00-\\udffd]'
  + ')', 'g');

// All wide chars including surrogate pairs.
exports.chars.all = new RegExp('('
  + exports.chars.swide.source.slice(1, -1)
  + '|'
  + exports.chars.wide.source.slice(1, -1)
  + ')', 'g');

// Regex to detect a surrogate pair.
exports.chars.surrogate = /[\ud800-\udbff][\udc00-\udfff]/g;

// Regex to find combining characters.
exports.chars.combining = exports.combiningTable.reduce(function(out, row) {
  var low, high, range;
  if (row[0] > 0x00ffff) {
    low = exports.fromCodePoint(row[0]);
    low = [
      hexify(low.charCodeAt(0)),
      hexify(low.charCodeAt(1))
    ];
    high = exports.fromCodePoint(row[1]);
    high = [
      hexify(high.charCodeAt(0)),
      hexify(high.charCodeAt(1))
    ];
    range = '[\\u' + low[0] + '-' + '\\u' + high[0] + ']'
          + '[\\u' + low[1] + '-' + '\\u' + high[1] + ']';
    if (!~out.indexOf('|')) out += ']';
    out += '|' + range;
  } else {
    low = hexify(row[0]);
    high = hexify(row[1]);
    low = '\\u' + low;
    high = '\\u' + high;
    out += low + '-' + high;
  }
  return out;
}, '[');

exports.chars.combining = new RegExp(exports.chars.combining, 'g');

function hexify(n) {
  n = n.toString(16);
  while (n.length < 4) n = '0' + n;
  return n;
}

/*
exports.chars.combining = new RegExp(
  '['
  + '\\u0300-\\u036f'
  + '\\u0483-\\u0486'
  + '\\u0488-\\u0489'
  + '\\u0591-\\u05bd'
  + '\\u05bf-\\u05bf'
  + '\\u05c1-\\u05c2'
  + '\\u05c4-\\u05c5'
  + '\\u05c7-\\u05c7'
  + '\\u0600-\\u0603'
  + '\\u0610-\\u0615'
  + '\\u064b-\\u065e'
  + '\\u0670-\\u0670'
  + '\\u06d6-\\u06e4'
  + '\\u06e7-\\u06e8'
  + '\\u06ea-\\u06ed'
  + '\\u070f-\\u070f'
  + '\\u0711-\\u0711'
  + '\\u0730-\\u074a'
  + '\\u07a6-\\u07b0'
  + '\\u07eb-\\u07f3'
  + '\\u0901-\\u0902'
  + '\\u093c-\\u093c'
  + '\\u0941-\\u0948'
  + '\\u094d-\\u094d'
  + '\\u0951-\\u0954'
  + '\\u0962-\\u0963'
  + '\\u0981-\\u0981'
  + '\\u09bc-\\u09bc'
  + '\\u09c1-\\u09c4'
  + '\\u09cd-\\u09cd'
  + '\\u09e2-\\u09e3'
  + '\\u0a01-\\u0a02'
  + '\\u0a3c-\\u0a3c'
  + '\\u0a41-\\u0a42'
  + '\\u0a47-\\u0a48'
  + '\\u0a4b-\\u0a4d'
  + '\\u0a70-\\u0a71'
  + '\\u0a81-\\u0a82'
  + '\\u0abc-\\u0abc'
  + '\\u0ac1-\\u0ac5'
  + '\\u0ac7-\\u0ac8'
  + '\\u0acd-\\u0acd'
  + '\\u0ae2-\\u0ae3'
  + '\\u0b01-\\u0b01'
  + '\\u0b3c-\\u0b3c'
  + '\\u0b3f-\\u0b3f'
  + '\\u0b41-\\u0b43'
  + '\\u0b4d-\\u0b4d'
  + '\\u0b56-\\u0b56'
  + '\\u0b82-\\u0b82'
  + '\\u0bc0-\\u0bc0'
  + '\\u0bcd-\\u0bcd'
  + '\\u0c3e-\\u0c40'
  + '\\u0c46-\\u0c48'
  + '\\u0c4a-\\u0c4d'
  + '\\u0c55-\\u0c56'
  + '\\u0cbc-\\u0cbc'
  + '\\u0cbf-\\u0cbf'
  + '\\u0cc6-\\u0cc6'
  + '\\u0ccc-\\u0ccd'
  + '\\u0ce2-\\u0ce3'
  + '\\u0d41-\\u0d43'
  + '\\u0d4d-\\u0d4d'
  + '\\u0dca-\\u0dca'
  + '\\u0dd2-\\u0dd4'
  + '\\u0dd6-\\u0dd6'
  + '\\u0e31-\\u0e31'
  + '\\u0e34-\\u0e3a'
  + '\\u0e47-\\u0e4e'
  + '\\u0eb1-\\u0eb1'
  + '\\u0eb4-\\u0eb9'
  + '\\u0ebb-\\u0ebc'
  + '\\u0ec8-\\u0ecd'
  + '\\u0f18-\\u0f19'
  + '\\u0f35-\\u0f35'
  + '\\u0f37-\\u0f37'
  + '\\u0f39-\\u0f39'
  + '\\u0f71-\\u0f7e'
  + '\\u0f80-\\u0f84'
  + '\\u0f86-\\u0f87'
  + '\\u0f90-\\u0f97'
  + '\\u0f99-\\u0fbc'
  + '\\u0fc6-\\u0fc6'
  + '\\u102d-\\u1030'
  + '\\u1032-\\u1032'
  + '\\u1036-\\u1037'
  + '\\u1039-\\u1039'
  + '\\u1058-\\u1059'
  + '\\u1160-\\u11ff'
  + '\\u135f-\\u135f'
  + '\\u1712-\\u1714'
  + '\\u1732-\\u1734'
  + '\\u1752-\\u1753'
  + '\\u1772-\\u1773'
  + '\\u17b4-\\u17b5'
  + '\\u17b7-\\u17bd'
  + '\\u17c6-\\u17c6'
  + '\\u17c9-\\u17d3'
  + '\\u17dd-\\u17dd'
  + '\\u180b-\\u180d'
  + '\\u18a9-\\u18a9'
  + '\\u1920-\\u1922'
  + '\\u1927-\\u1928'
  + '\\u1932-\\u1932'
  + '\\u1939-\\u193b'
  + '\\u1a17-\\u1a18'
  + '\\u1b00-\\u1b03'
  + '\\u1b34-\\u1b34'
  + '\\u1b36-\\u1b3a'
  + '\\u1b3c-\\u1b3c'
  + '\\u1b42-\\u1b42'
  + '\\u1b6b-\\u1b73'
  + '\\u1dc0-\\u1dca'
  + '\\u1dfe-\\u1dff'
  + '\\u200b-\\u200f'
  + '\\u202a-\\u202e'
  + '\\u2060-\\u2063'
  + '\\u206a-\\u206f'
  + '\\u20d0-\\u20ef'
  + '\\u302a-\\u302f'
  + '\\u3099-\\u309a'
  + '\\ua806-\\ua806'
  + '\\ua80b-\\ua80b'
  + '\\ua825-\\ua826'
  + '\\ufb1e-\\ufb1e'
  + '\\ufe00-\\ufe0f'
  + '\\ufe20-\\ufe23'
  + '\\ufeff-\\ufeff'
  + '\\ufff9-\\ufffb'
  + ']'
  + '|[\\ud802-\\ud802][\\ude01-\\ude03]'
  + '|[\\ud802-\\ud802][\\ude05-\\ude06]'
  + '|[\\ud802-\\ud802][\\ude0c-\\ude0f]'
  + '|[\\ud802-\\ud802][\\ude38-\\ude3a]'
  + '|[\\ud802-\\ud802][\\ude3f-\\ude3f]'
  + '|[\\ud834-\\ud834][\\udd67-\\udd69]'
  + '|[\\ud834-\\ud834][\\udd73-\\udd82]'
  + '|[\\ud834-\\ud834][\\udd85-\\udd8b]'
  + '|[\\ud834-\\ud834][\\uddaa-\\uddad]'
  + '|[\\ud834-\\ud834][\\ude42-\\ude44]'
  + '|[\\udb40-\\udb40][\\udc01-\\udc01]'
  + '|[\\udb40-\\udb40][\\udc20-\\udc7f]'
  + '|[\\udb40-\\udb40][\\udd00-\\uddef]'
, 'g');
*/
};
BundleModuleCode['term/helpers']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2016, Christopher Jeffrey and contributors
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.9.1
 **
 **    $INFO:
 *
 * helpers.js - helpers for blessed
 *
 **    $ENDOFINFO
 */

/**
 * Modules
 */

var fs = Require('fs');
var Comp = Require('com/compat');

var unicode = Require('term/unicode');

/**
 * Helpers
 */

var helpers = exports;


helpers.asort = function(obj) {
  return obj.sort(function(a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if (a[0] === '.' && b[0] === '.') {
      a = a[1];
      b = b[1];
    } else {
      a = a[0];
      b = b[0];
    }

    return a > b ? 1 : (a < b ? -1 : 0);
  });
};

helpers.attrToBinary = function(style, element) {
  return helpers.Element.prototype.sattr.call(element || {}, style);
};

// Compute absolute position, width, height of a box 
// Requires parent object with absolute bbox valies. 
// Commonly parent is screen object.
// Supported formats: number,'half','center','%'
helpers.bbox = function (parent,options) {
  function eval(a,b) {
    if (a.indexOf('%')) return int(Number(a.substring(0,a.length-1))*b/100);
  }
  var bbox={width:options.width,height:options.height,top:options.top,left:options.left,right:options.right};
  if (bbox.width=='half') bbox.width=int(parent.width/2);
  if (typeof bbox.width == 'string' && bbox.width.indexOf('%')!=-1) bbox.width=eval(bbox.width,parent.width);
  if (bbox.height=='half') bbox.height=int(parent.height/2);
  if (typeof bbox.height == 'string' && bbox.height.indexOf('%')!=-1) bbox.height=eval(bbox.height,parent.height);
  if (bbox.left=='center') bbox.left=int((parent.width/2)-(bbox.width/2));
  if (bbox.top=='center') bbox.top=int((parent.height/2)-(bbox.height/2));
  return bbox;  
}

helpers.cleanTags = function(text) {
  return helpers.stripTags(text).trim();
};

helpers.dropUnicode = function(text) {
  if (!text) return '';
  return text
    .replace(unicode.chars.all, '??')
    .replace(unicode.chars.combining, '')
    .replace(unicode.chars.surrogate, '?');
};

helpers.findFile = function(start, target) {
  return (function read(dir) {
    var files, file, stat, out;

    if (dir === '/dev' || dir === '/sys'
        || dir === '/proc' || dir === '/net') {
      return null;
    }

    try {
      files = fs.readdirSync(dir);
    } catch (e) {
      files = [];
    }

    for (var i = 0; i < files.length; i++) {
      file = files[i];

      if (file === target) {
        return (dir === '/' ? '' : dir) + '/' + file;
      }

      try {
        stat = fs.lstatSync((dir === '/' ? '' : dir) + '/' + file);
      } catch (e) {
        stat = null;
      }

      if (stat && stat.isDirectory() && !stat.isSymbolicLink()) {
        out = read((dir === '/' ? '' : dir) + '/' + file);
        if (out) return out;
      }
    }

    return null;
  })(start);
};

// Escape text for tag-enabled elements.
helpers.escape = function(text) {
  return text.replace(/[{}]/g, function(ch) {
    return ch === '{' ? '{open}' : '{close}';
  });
};

helpers.generateTags = function(style, text) {
  var open = ''
    , close = '';

  Object.keys(style || {}).forEach(function(key) {
    var val = style[key];
    if (typeof val === 'string') {
      val = val.replace(/^light(?!-)/, 'light-');
      val = val.replace(/^bright(?!-)/, 'bright-');
      open = '{' + val + '-' + key + '}' + open;
      close += '{/' + val + '-' + key + '}';
    } else {
      if (val === true) {
        open = '{' + key + '}' + open;
        close += '{/' + key + '}';
      }
    }
  });

  if (text != null) {
    return open + text + close;
  }

  return {
    open: open,
    close: close
  };
};

helpers.hsort = function(obj) {
  return obj.sort(function(a, b) {
    return b.index - a.index;
  });
};

helpers.merge = function(a, b) {
  Object.keys(b).forEach(function(key) {
    a[key] = b[key];
  });
  return a;
};

helpers.parseTags = function(text, screen) {
  return helpers.Element.prototype._parseTags.call(
    { parseTags: true, screen: screen || helpers.Screen.global }, text);
};


helpers.stripTags = function(text) {
  if (!text) return '';
  return text
    .replace(/\{(\/?)([\w\-,;!#]*)\}/g, '')
    .replace(/\x1b\[[\d;]*m/g, '');
};

/* Depricated
helpers.__defineGetter__('Screen', function() {
  if (!helpers._screen) {
    helpers._screen = Require('term/widgets/screen');
  }
  return helpers._screen;
});

helpers.__defineGetter__('Element', function() {
  if (!helpers._element) {
    helpers._element = Require('term/widgets/element');
  }
  return helpers._element;
});
*/
Object.defineProperty(helpers,'Screen',{
  get: function () {
    if (!helpers._screen) {
      helpers._screen = Require('term/widgets/screen');
    }
    return helpers._screen;
  }
});
Object.defineProperty(helpers,'Element',{
  get: function () {
    if (!helpers._element) {
      helpers._element = Require('term/widgets/element');
    }
    return helpers._element;
  }
});
};
BundleModuleCode['term/widgets/log']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2013-2016, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.3.2
 **
 **    $INFO:
 **
 **    Logging Widget with Scrollbars
 **
 **   options: {
 **       scrollOnInput:boolean -- auto scroll
 **       arrows?: {up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}}
 **
 **  Usage:
 
    if (options.top == undefined) options.top=2;
    if (options.left == undefined) options.left=1;
    var obj = blessed.log({
      top: options.top,
      left: options.left,
      width: options.width||(self.screen.width-options.left*2),
      height: options.height||(self.screen.height-options.top-4),
      label: options.label||'Log',
      mouse:true,
      keys:true,
      scrollback:100,
      border: {
        type: 'line'
      },
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          fg: 'cyan',
          inverse: true
        }
      },
      alwaysScroll:true,
      scrollOnInput:true,
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'green'
        },
        focus: {
          border: {
            fg: 'red'
          }
        }
      }
    });
    screen.append(obj);


 **    $ENDOFINFO
 */

var options = {
  version:'1.3.2'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var util = require('util');
var Helpers = Require('term/helpers');
var Button = Require('term/widgets/button');
var Arrows = Require('term/widgets/arrows');

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = Require('term/widgets/node');
var ScrollableText = Require('term/widgets/scrollabletext');

/**
 * Log
 */

function Log(options) {
  var self = this, bbox;

  if (!instanceOf(this,Node)) {
    return new Log(options);
  }

  options = options || {};

  ScrollableText.call(this, options);

  this.scrollback = options.scrollback != null
    ? options.scrollback
    : Infinity;
  this.scrollOnInput = options.scrollOnInput;
  this._updating=false;

  if (options.arrows) 
    Arrows(
      self,
      options,
      function () { self.scroll(-2)},
      function () { self.scroll(2)}
    );
  
  this.on('set content', function() {
    if (!self._updating && !self._userScrolled && self.scrollOnInput) {
      self._updating=true;
      setTimeout(function() {
        self.setScrollPerc(100);
        self._userScrolled = false;
        self._updating=false;
        self.screen.render();
      },20);
    }
  });
}

//Log.prototype.__proto__ = ScrollableText.prototype;
inheritPrototype(Log,ScrollableText);

Log.prototype.type = 'log';

Log.prototype.log =
Log.prototype.add = function() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] === 'object') {
    args[0] = util.inspect(args[0], true, 20, true);
  }
  var text = util.format.apply(util, args);
  this.emit('log', text);
  var ret = this.pushLine(text);
 
  //if (this._clines.fake.length > this.scrollback) {
  //  this.shiftLine(0, (this.scrollback / 3) | 0);
  // }
  return ret;
};

Log.prototype.clear = function() {
  if (this._userScrolled) this.setScrollPerc(100);
  this.setContent('');
  this.resetScroll();
}

Log.prototype._scroll = Log.prototype.scroll;
Log.prototype.scroll = function(offset, always) {
  if (offset>this.getScrollHeight() || (this.getScrollHeight()+offset)<0) return;
  if (offset === 0) return this._scroll(offset, always);
  this._userScrolled = true;
  var ret = this._scroll(offset, always);
  if (this.getScrollPerc() === 100) {
    this._userScrolled = false;
  }
  return ret;
};

/**
 * Expose
 */

module.exports = Log;



Log.prototype.logold = function(str) {  
  var i;
  this.logLines.push(str)  
  if (this.logLines.length==1) {
    this.setContent(str);
  }
  else if (this.logLines.length>this.options.bufferLength) {
    this.logLines.shift();
    this.setContent(this.logLines[0]);
    for(i=1;i<this.logLines.length;i++) {
      this.insertLine(i,this.logLines[i]);
    }
    this.scrollBottom();
  } else {
    this.scrollBottom();
    this.insertBottom(str);
    this.scrollBottom();
  }
  // this.setItems(this.logLines)
  // this.scrollTo(this.logLines.length)
}

};
BundleModuleCode['term/widgets/button']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.1.8
 **
 **    $INFO:
 **
 **    button.js - button element for blessed
 **
 **     Options: {mouse:boolean,content,border,style,object}
 **
 **     Events In: click keypress
 **     Events Out: press
 **
 **  Usage:
 
    var width;
    if (Comp.obj.isString(options.width)) {
      // relative value in %!
      width=Comp.pervasives.int_of_string(options.width);
      width=int(self.screen.width*width/100);
    }
    var obj = blessed.button({
      width: options.width||(options.content.length+4),
      left: (options.center?int(self.screen.width/2-width/2):options.left),
      right : options.right,
      top: options.top||0,
      height: 3,
      align: 'center',
      content: options.content||'?',
      mouse:true,
      focus:false,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: options.color||'blue',
        bold:true,
        border: {
          fg: 'black'
        },
        hover: {
          border: {
            fg: 'red'
          }
        }
      }  
    });
    screen.append(obj);
 
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Input = Require('term/widgets/input');

/**
 * Button
 */

function Button(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Button(options);
  }

  options = options || {};

  if (options.autoFocus == null) {
    options.autoFocus = false;
  }

  if (!options.style) options.style = {
      fg: 'white',
      bg: 'blue',
      bold:true,
      border: {
        fg: 'black'
      },
      hover: {
        border: {
          fg: 'red'
        }
      },
      focus : {
        border: {
          fg: 'red'
        }      
      }
  }
  if (options.object) this.object=options.object;
  
  Input.call(this, options);

  this.on('keypress', function(ch, key) {
    if (key.name == 'enter' || key.name == 'return') {
      return self.press();
    }
  });

  if (this.options.mouse) {
    this.on('click', function() {
      return self.press();
    });
  }
}

//Button.prototype.__proto__ = Input.prototype;
inheritPrototype(Button,Input);

Button.prototype.type = 'button';

Button.prototype.press = function() {
  this.focus();
  this.value = true;
  var result = this.emit('press');
  delete this.value;
  return result;
};

/**
 * Expose
 */

module.exports = Button;
};
BundleModuleCode['term/widgets/input']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.2
 **
 **    $INFO:
 **
 **    input.js - abstract input element for blessed
 **
 **     Added:
 **       - Focus handling
 **
 **    Usage:
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Input
 */

function Input(options) {
  if (!instanceOf(this,Node)) {
    return new Input(options);
  }
  options = options || {};
  Box.call(this, options);
}

//Input.prototype.__proto__ = Box.prototype;
inheritPrototype(Input,Box);

Input.prototype.type = 'input';

Input.prototype.focus = function() {
  // Force focus for input field
  this.screen.rewindFocus();
  return this.screen.focused = this;
}

/**
 * Expose
 */

module.exports = Input;
};
BundleModuleCode['term/widgets/box']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    box.js - box element for blessed
 **
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Element = Require('term/widgets/element');

/**
 * Box
 */

function Box(options) {
  if (!instanceOf(this,Node)) {
    return new Box(options);
  }
  options = options || {};
  Element.call(this, options);
}

//Box.prototype.__proto__ = Element.prototype;
inheritPrototype(Box,Element);

Box.prototype.type = 'box';

/**
 * Expose
 */

module.exports = Box;
};
BundleModuleCode['term/widgets/element']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2016, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2016-2018)
 **    $REVESIO:     1.4.3
 **
 **    $INFO:
 **
 **    Base element for blessed
 **
 **    Event Out: change, resize, set content, show, hide
 **
 **     Added:
 **       - 'setStyle({fg:..})' method
 **       - 'getLabel()' method 
 **       - 'isfocus' method
 **       - relative right align attribute right:'60%'
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var assert = Require('assert');

var colors = Require('term/colors')
  , unicode = Require('term/unicode');

var nextTick = global.setImmediate || process.nextTick.bind(process);

var helpers = Require('term/helpers');

var Node = Require('term/widgets/node');

/**
 * Element
 */

function Element(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Element(options);
  }

  options = options || {};

  // Workaround to get a `scrollable` option.
  if (options.scrollable && !this._ignore && this.type !== 'scrollable-box') {
    var ScrollableBox = Require('term/widgets/scrollablebox');
    Object.getOwnPropertyNames(ScrollableBox.prototype).forEach(function(key) {
      if (key === 'type') return;
      Object.defineProperty(this, key,
        Object.getOwnPropertyDescriptor(ScrollableBox.prototype, key));
    }, this);
    this._ignore = true;
    ScrollableBox.call(this, options);
    delete this._ignore;
    // Workaround two: catch scrollbar mouse events
    if (options.mouse) {
      this.onScreenEvent('mouse',function (data) { 
        var x = data.x - self.aleft;
        var y = data.y - self.atop;
        if (!self.hidden && data.action=='mousedown' &&
            x === self.width - self.iright - 1) {
          self.focus();  
          var perc = (y - self.itop) / (self.height - self.iheight);
          self.setScrollPerc(perc * 100 | 0);
          self.screen.render();
        } 
      });
    }
    return this;
  }

  Node.call(this, options);

  this.name = options.name;

  options.position = options.position || {
    left: options.left,
    right: options.right,
    top: options.top,
    bottom: options.bottom,
    width: options.width,
    height: options.height
  };

  if (options.position.width === 'shrink'
      || options.position.height === 'shrink') {
    if (options.position.width === 'shrink') {
      delete options.position.width;
    }
    if (options.position.height === 'shrink') {
      delete options.position.height;
    }
    options.shrink = true;
  }

  this.position = options.position;

  this.noOverflow = options.noOverflow;
  this.dockBorders = options.dockBorders;
  this.shadow = options.shadow;

  this.style = options.style;

  if (!this.style) {
    this.style = {};
    this.style.fg = options.fg;
    this.style.bg = options.bg;
    this.style.bold = options.bold;
    this.style.underline = options.underline;
    this.style.blink = options.blink;
    this.style.inverse = options.inverse;
    this.style.invisible = options.invisible;
    this.style.transparent = options.transparent;
  }

  this.hidden = options.hidden || false;
  this.fixed = options.fixed || false;
  this.align = options.align || 'left';
  this.valign = options.valign || 'top';
  this.wrap = options.wrap !== false;
  this.shrink = options.shrink;
  this.ch = options.ch || ' ';

  if (typeof options.padding === 'number' || !options.padding) {
    options.padding = {
      left: options.padding,
      top: options.padding,
      right: options.padding,
      bottom: options.padding
    };
  }

  this.padding = {
    left: options.padding.left || 0,
    top: options.padding.top || 0,
    right: options.padding.right || 0,
    bottom: options.padding.bottom || 0
  };

  this.border = options.border;
  if (this.border) {
    if (typeof this.border === 'string') {
      this.border = { type: this.border };
    }
    this.border.type = this.border.type || 'bg';
    if (this.border.type === 'ascii') this.border.type = 'line';
    this.border.ch = this.border.ch || ' ';
    this.style.border = this.style.border || this.border.style;
    if (!this.style.border) {
      this.style.border = {};
      this.style.border.fg = this.border.fg;
      this.style.border.bg = this.border.bg;
    }
    //this.border.style = this.style.border;
    if (this.border.left == null) this.border.left = true;
    if (this.border.top == null) this.border.top = true;
    if (this.border.right == null) this.border.right = true;
    if (this.border.bottom == null) this.border.bottom = true;
  }

  // if (options.mouse || options.clickable) {
  if (options.clickable) {
    this.screen._listenMouse(this);
  }

  if (options.input || options.keyable) {
    this.screen._listenKeys(this);
  }

  this.parseTags = options.parseTags || options.tags;

  this.setContent(options.content || '', true);

  if (options.label) {
    this.setLabel(options.label);
  }

  if (options.hoverText) {
    this.setHover(options.hoverText);
  }

  // TODO: Possibly move this to Node for onScreenEvent('mouse', ...).
  this.on('newListener', function fn(type) {
    // type = type.split(' ').slice(1).join(' ');
    if (type === 'mouse'
      || type === 'click'
      || type === 'mouseover'
      || type === 'mouseout'
      || type === 'mousedown'
      || type === 'mouseup'
      || type === 'mousewheel'
      || type === 'wheeldown'
      || type === 'wheelup'
      || type === 'mousemove') {
      self.screen._listenMouse(self);
    } else if (type === 'keypress' || type.indexOf('key ') === 0) {
      self.screen._listenKeys(self);
    }
  });

  this.on('resize', function() {
    self.parseContent();
  });

  this.on('attach', function() {
    self.parseContent();
  });

  this.on('detach', function() {
    delete self.lpos;
  });

  if (options.hoverBg != null) {
    options.hoverEffects = options.hoverEffects || {};
    options.hoverEffects.bg = options.hoverBg;
  }

  if (this.style.hover) {
    options.hoverEffects = this.style.hover;
  }

  if (this.style.focus) {
    options.focusEffects = this.style.focus;
  }

  if (options.effects) {
    if (options.effects.hover) options.hoverEffects = options.effects.hover;
    if (options.effects.focus) options.focusEffects = options.effects.focus;
  }

  [['hoverEffects', 'mouseover', 'mouseout', '_htemp'],
   ['focusEffects', 'focus', 'blur', '_ftemp']].forEach(function(props) {
    var pname = props[0], over = props[1], out = props[2], temp = props[3];
    self.screen.setEffects(self, self, over, out, self.options[pname], temp);
  });

  if (this.options.draggable) {
    this.draggable = true;
  }

  if (options.focused) {
    this.focus();
  }
}

//Element.prototype.__proto__ = Node.prototype;
inheritPrototype(Element,Node);

Element.prototype.type = 'element';

/* Deprictaed
Element.prototype.__defineGetter__('focused', function() {
  return this.screen.focused === this;
});
*/
Object.defineProperty(Element.prototype,'focused',{
  get: function () {return this.screen.focused === this;}
});

Element.prototype.sattr = function(style, fg, bg) {
  var bold = style.bold
    , underline = style.underline
    , blink = style.blink
    , inverse = style.inverse
    , invisible = style.invisible;

  // if (arguments.length === 1) {
  if (fg == null && bg == null) {
    fg = style.fg;
    bg = style.bg;
  }

  // This used to be a loop, but I decided
  // to unroll it for performance's sake.
  if (typeof bold === 'function') bold = bold(this);
  if (typeof underline === 'function') underline = underline(this);
  if (typeof blink === 'function') blink = blink(this);
  if (typeof inverse === 'function') inverse = inverse(this);
  if (typeof invisible === 'function') invisible = invisible(this);

  if (typeof fg === 'function') fg = fg(this);
  if (typeof bg === 'function') bg = bg(this);

  // return (this.uid << 24)
  //   | ((this.dockBorders ? 32 : 0) << 18)
  return ((invisible ? 16 : 0) << 18)
    | ((inverse ? 8 : 0) << 18)
    | ((blink ? 4 : 0) << 18)
    | ((underline ? 2 : 0) << 18)
    | ((bold ? 1 : 0) << 18)
    | (colors.convert(fg) << 9)
    | colors.convert(bg);
};

Element.prototype.onScreenEvent = function(type, handler) {
  var listeners = this._slisteners = this._slisteners || [];
  listeners.push({ type: type, handler: handler });
  this.screen.on(type, handler);
};

Element.prototype.onceScreenEvent = function(type, handler) {
  var listeners = this._slisteners = this._slisteners || [];
  var entry = { type: type, handler: handler };
  listeners.push(entry);
  this.screen.once(type, function() {
    var i = listeners.indexOf(entry);
    if (~i) listeners.splice(i, 1);
    return handler.apply(this, arguments);
  });
};

Element.prototype.removeScreenEvent = function(type, handler) {
  var listeners = this._slisteners = this._slisteners || [];
  for (var i = 0; i < listeners.length; i++) {
    var listener = listeners[i];
    if (listener.type === type && listener.handler === handler) {
      listeners.splice(i, 1);
      if (this._slisteners.length === 0) {
        delete this._slisteners;
      }
      break;
    }
  }
  this.screen.removeListener(type, handler);
};

Element.prototype.free = function() {
  var listeners = this._slisteners = this._slisteners || [];
  for (var i = 0; i < listeners.length; i++) {
    var listener = listeners[i];
    this.screen.removeListener(listener.type, listener.handler);
  }
  delete this._slisteners;
};

Element.prototype.hide = function() {
  if (this.hidden) return;
  this.clearPos();
  this.hidden = true;
  this.emit('hide');
  if (this.screen.focused === this) {
    this.screen.rewindFocus();
  }
};

Element.prototype.show = function() {
  if (!this.hidden) return;
  this.hidden = false;
  this.emit('show');
};

Element.prototype.toggle = function() {
  return this.hidden ? this.show() : this.hide();
};

Element.prototype.focus = function() {
  return this.screen.focused = this;
};
Element.prototype.isfocus = function() {
  return this.screen.focused == this;
};

Element.prototype.setStyle = function(styles) {
  for(var p in styles) {
    if (this.style[p]!=undefined) this.style[p]=styles[p];
  }
};


Element.prototype.setContent = function(content, noClear, noTags) {
  var changed=this.content!=content;
  if (!noClear) this.clearPos();
  this.content = content || '';
  this.parseContent(noTags);
  this.emit('set content');
  if (changed) this.emit('change');
};

Element.prototype.getContent = function() {
  if (!this._clines) return '';
  return this._clines.fake.join('\n');
};

Element.prototype.setText = function(content, noClear) {
  content = content || '';
  content = content.replace(/\x1b\[[\d;]*m/g, '');
  return this.setContent(content, noClear, true);
};

Element.prototype.getText = function() {
  return this.getContent().replace(/\x1b\[[\d;]*m/g, '');
};

Element.prototype.parseContent = function(noTags) {
  var self=this;
  if (this.detached) return false;

  var width = this.width - this.iwidth;
  if (this._clines == null
      || this._clines.width !== width
      || this._clines.content !== this.content) {
    var content = this.content;

    content = content
      .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1a\x1c-\x1f\x7f]/g, '')
      .replace(/\x1b(?!\[[\d;]*m)/g, '')
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, this.screen.tabc);

    if (this.screen.fullUnicode) {
      // double-width chars will eat the next char after render. create a
      // blank character after it so it doesn't eat the real next char.
      content = content.replace(unicode.chars.all, '$1\x03');
      // iTerm2 cannot render combining characters properly.
      if (this.screen.program.isiTerm2) {
        content = content.replace(unicode.chars.combining, '');
      }
    } else {
      // no double-width: replace them with question-marks.
      content = content.replace(unicode.chars.all, '??');
      // delete combining characters since they're 0-width anyway.
      // NOTE: We could drop this, the non-surrogates would get changed to ? by
      // the unicode filter, and surrogates changed to ? by the surrogate
      // regex. however, the user might expect them to be 0-width.
      // NOTE: Might be better for performance to drop!
      content = content.replace(unicode.chars.combining, '');
      // no surrogate pairs: replace them with question-marks.
      content = content.replace(unicode.chars.surrogate, '?');
      // XXX Deduplicate code here:
      // content = helpers.dropUnicode(content);
    }

    if (!noTags) {
      content = this._parseTags(content);
    }

    this._clines = this._wrapContent(content, width);
    this._clines.width = width;
    this._clines.content = this.content;
    this._clines.attr = this._parseAttr(this._clines);
    this._clines.ci = [];
    this._clines.reduce(function(total, line) {
        self._clines.ci.push(total);
        return total + line.length + 1;
      }, 0);

    this._pcontent = this._clines.join('\n');
    this.emit('parsed content');

    return true;
  }

  // Need to calculate this every time because the default fg/bg may change.
  this._clines.attr = this._parseAttr(this._clines) || this._clines.attr;

  return false;
};

// Convert `{red-fg}foo{/red-fg}` to `\x1b[31mfoo\x1b[39m`.
Element.prototype._parseTags = function(text) {
  if (!this.parseTags) return text;
  if (!/\{\/?[\w\-,;!#]*\}/.test(text)) return text;

  var program = this.screen.program
    , out = ''
    , state
    , bg = []
    , fg = []
    , flag = []
    , cap
    , slash
    , param
    , attr
    , esc;

  for (;;) {
    if (!esc && (cap = /^\{escape\}/.exec(text))) {
      text = text.substring(cap[0].length);
      esc = true;
      continue;
    }

    if (esc && (cap = /^([\s\S]+?)\{\/escape\}/.exec(text))) {
      text = text.substring(cap[0].length);
      out += cap[1];
      esc = false;
      continue;
    }

    if (esc) {
      // throw new Error('Unterminated escape tag.');
      out += text;
      break;
    }

    if (cap = /^\{(\/?)([\w\-,;!#]*)\}/.exec(text)) {
      text = text.substring(cap[0].length);
      slash = cap[1] === '/';
      param = cap[2].replace(/-/g, ' ');

      if (param === 'open') {
        out += '{';
        continue;
      } else if (param === 'close') {
        out += '}';
        continue;
      }

      if (param.slice(-3) === ' bg') state = bg;
      else if (param.slice(-3) === ' fg') state = fg;
      else state = flag;

      if (slash) {
        if (!param) {
          out += program._attr('normal');
          bg.length = 0;
          fg.length = 0;
          flag.length = 0;
        } else {
          attr = program._attr(param, false);
          if (attr == null) {
            out += cap[0];
          } else {
            // if (param !== state[state.length - 1]) {
            //   throw new Error('Misnested tags.');
            // }
            state.pop();
            if (state.length) {
              out += program._attr(state[state.length - 1]);
            } else {
              out += attr;
            }
          }
        }
      } else {
        if (!param) {
          out += cap[0];
        } else {
          attr = program._attr(param);
          if (attr == null) {
            out += cap[0];
          } else {
            state.push(param);
            out += attr;
          }
        }
      }

      continue;
    }

    if (cap = /^[\s\S]+?(?=\{\/?[\w\-,;!#]*\})/.exec(text)) {
      text = text.substring(cap[0].length);
      out += cap[0];
      continue;
    }

    out += text;
    break;
  }

  return out;
};

Element.prototype._parseAttr = function(lines) {
  var dattr = this.sattr(this.style)
    , attr = dattr
    , attrs = []
    , line
    , i
    , j
    , c;

  if (lines[0].attr === attr) {
    return;
  }

  for (j = 0; j < lines.length; j++) {
    line = lines[j];
    attrs[j] = attr;
    for (i = 0; i < line.length; i++) {
      if (line[i] === '\x1b') {
        if (c = /^\x1b\[[\d;]*m/.exec(line.substring(i))) {
          attr = this.screen.attrCode(c[0], attr, dattr);
          i += c[0].length - 1;
        }
      }
    }
  }

  return attrs;
};

Element.prototype._align = function(line, width, align) {
  if (!align) return line;
  //if (!align && !~line.indexOf('{|}')) return line;

  var cline = line.replace(/\x1b\[[\d;]*m/g, '')
    , len = cline.length
    , s = width - len;

  if (this.shrink) {
    s = 0;
  }

  if (len === 0) return line;
  if (s < 0) return line;

  if (align === 'center') {
    s = Array(((s / 2) | 0) + 1).join(' ');
    return s + line + s;
  } else if (align === 'right') {
    s = Array(s + 1).join(' ');
    return s + line;
  } else if (this.parseTags && ~line.indexOf('{|}')) {
    var parts = line.split('{|}');
    var cparts = cline.split('{|}');
    s = Math.max(width - cparts[0].length - cparts[1].length, 0);
    s = Array(s + 1).join(' ');
    return parts[0] + s + parts[1];
  }

  return line;
};

Element.prototype._wrapContent = function(content, width) {
  var tags = this.parseTags
    , state = this.align
    , wrap = this.wrap
    , margin = 0
    , rtof = []
    , ftor = []
    , out = []
    , no = 0
    , line
    , align
    , cap
    , total
    , i
    , part
    , j
    , lines
    , rest;

  lines = content.split('\n');

  if (!content) {
    out.push(content);
    out.rtof = [0];
    out.ftor = [[0]];
    out.fake = lines;
    out.real = out;
    out.mwidth = 0;
    return out;
  }

  if (this.scrollbar) margin++;
  if (this.type === 'textarea') margin++;
  if (width > margin) width -= margin;

main:
  for (; no < lines.length; no++) {
    line = lines[no];
    align = state;

    ftor.push([]);

    // Handle alignment tags.
    if (tags) {
      if (cap = /^\{(left|center|right)\}/.exec(line)) {
        line = line.substring(cap[0].length);
        align = state = cap[1] !== 'left'
          ? cap[1]
          : null;
      }
      if (cap = /\{\/(left|center|right)\}$/.exec(line)) {
        line = line.slice(0, -cap[0].length);
        //state = null;
        state = this.align;
      }
    }

    // If the string is apparently too long, wrap it.
    while (line.length > width) {
      // Measure the real width of the string.
      for (i = 0, total = 0; i < line.length; i++) {
        while (line[i] === '\x1b') {
          while (line[i] && line[i++] !== 'm');
        }
        if (!line[i]) break;
        if (++total === width) {
          // If we're not wrapping the text, we have to finish up the rest of
          // the control sequences before cutting off the line.
          i++;
          if (!wrap) {
            rest = line.substring(i).match(/\x1b\[[^m]*m/g);
            rest = rest ? rest.join('') : '';
            out.push(this._align(line.substring(0, i) + rest, width, align));
            ftor[no].push(out.length - 1);
            rtof.push(no);
            continue main;
          }
          if (!this.screen.fullUnicode) {
            // Try to find a space to break on.
            if (i !== line.length) {
              j = i;
              while (j > i - 10 && j > 0 && line[--j] !== ' ');
              if (line[j] === ' ') i = j + 1;
            }
          } else {
            // Try to find a character to break on.
            if (i !== line.length) {
              // <XXX>
              // Compensate for surrogate length
              // counts on wrapping (experimental):
              // NOTE: Could optimize this by putting
              // it in the parent for loop.
              if (unicode.isSurrogate(line, i)) i--;
              for (var s = 0, n = 0; n < i; n++) {
                if (unicode.isSurrogate(line, n)) s++, n++;
              }
              i += s;
              // </XXX>
              j = i;
              // Break _past_ space.
              // Break _past_ double-width chars.
              // Break _past_ surrogate pairs.
              // Break _past_ combining chars.
              while (j > i - 10 && j > 0) {
                j--;
                if (line[j] === ' '
                    || line[j] === '\x03'
                    || (unicode.isSurrogate(line, j - 1) && line[j + 1] !== '\x03')
                    || unicode.isCombining(line, j)) {
                  break;
                }
              }
              if (line[j] === ' '
                  || line[j] === '\x03'
                  || (unicode.isSurrogate(line, j - 1) && line[j + 1] !== '\x03')
                  || unicode.isCombining(line, j)) {
                i = j + 1;
              }
            }
          }
          break;
        }
      }

      part = line.substring(0, i);
      line = line.substring(i);

      out.push(this._align(part, width, align));
      ftor[no].push(out.length - 1);
      rtof.push(no);

      // Make sure we didn't wrap the line to the very end, otherwise
      // we get a pointless empty line after a newline.
      if (line === '') continue main;

      // If only an escape code got cut off, at it to `part`.
      if (/^(?:\x1b[\[\d;]*m)+$/.test(line)) {
        out[out.length - 1] += line;
        continue main;
      }
    }

    out.push(this._align(line, width, align));
    ftor[no].push(out.length - 1);
    rtof.push(no);
  }

  out.rtof = rtof;
  out.ftor = ftor;
  out.fake = lines;
  out.real = out;

  out.mwidth = out.reduce(function(current, line) {
    line = line.replace(/\x1b\[[\d;]*m/g, '');
    return line.length > current
      ? line.length
      : current;
  }, 0);

  return out;
};

/* Depricated
Element.prototype.__defineGetter__('visible', function() {
  var el = this;
  do {
    if (el.detached) return false;
    if (el.hidden) return false;
    // if (!el.lpos) return false;
    // if (el.position.width === 0 || el.position.height === 0) return false;
  } while (el = el.parent);
  return true;
});

Element.prototype.__defineGetter__('_detached', function() {
  var el = this;
  do {
    if (el.type === 'screen') return false;
    if (!el.parent) return true;
  } while (el = el.parent);
  return false;
});
*/
Object.defineProperty(Element.prototype,'visible',{
  get: function () {
    var el = this;
    do {
      if (el.detached) return false;
      if (el.hidden) return false;
      // if (!el.lpos) return false;
      // if (el.position.width === 0 || el.position.height === 0) return false;
    } while (el = el.parent);
    return true;
  }
});
Object.defineProperty(Element.prototype,'_detached',{
  get: function () {
    var el = this;
    do {
      if (el.type === 'screen') return false;
      if (!el.parent) return true;
    } while (el = el.parent);
    return false;
  }
});

Element.prototype.enableMouse = function() {
  this.screen._listenMouse(this);
};

Element.prototype.enableKeys = function() {
  this.screen._listenKeys(this);
};

Element.prototype.enableInput = function() {
  this.screen._listenMouse(this);
  this.screen._listenKeys(this);
};

/* Depricated:
Element.prototype.__defineGetter__('draggable', function() {
  return this._draggable === true;
});

Element.prototype.__defineSetter__('draggable', function(draggable) {
  return draggable ? this.enableDrag(draggable) : this.disableDrag();
});
*/
Object.defineProperty(Element.prototype,'draggable',{
  get: function () {
    return this._draggable === true;  
  },
  set: function (draggable) {
    return draggable ? this.enableDrag(draggable) : this.disableDrag();  
  }
});

Element.prototype.enableDrag = function(verify) {
  var self = this;

  if (this._draggable) return true;

  if (typeof verify !== 'function') {
    verify = function() { return true; };
  }

  this.enableMouse();

  this.on('mousedown', this._dragMD = function(data) {
    if (self.screen._dragging) return;
    if (!verify(data)) return;
    self.screen._dragging = self;
    self._drag = {
      x: data.x - self.aleft,
      y: data.y - self.atop
    };
    self.setFront();
  });

  this.onScreenEvent('mouse', this._dragM = function(data) {
    if (self.screen._dragging !== self) return;

    if (data.action !== 'mousedown' && data.action !== 'mousemove') {
      delete self.screen._dragging;
      delete self._drag;
      return;
    }

    // This can happen in edge cases where the user is
    // already dragging and element when it is detached.
    if (!self.parent) return;

    var ox = self._drag.x
      , oy = self._drag.y
      , px = self.parent.aleft
      , py = self.parent.atop
      , x = data.x - px - ox
      , y = data.y - py - oy;

    if (self.position.right != null) {
      if (self.position.left != null) {
        self.width = '100%-' + (self.parent.width - self.width);
      }
      self.position.right = null;
    }

    if (self.position.bottom != null) {
      if (self.position.top != null) {
        self.height = '100%-' + (self.parent.height - self.height);
      }
      self.position.bottom = null;
    }

    self.rleft = x;
    self.rtop = y;

    self.screen.render();
  });

  return this._draggable = true;
};

Element.prototype.disableDrag = function() {
  if (!this._draggable) return false;
  delete this.screen._dragging;
  delete this._drag;
  this.removeListener('mousedown', this._dragMD);
  this.removeScreenEvent('mouse', this._dragM);
  return this._draggable = false;
};

Element.prototype.key = function() {
  return this.screen.program.key.apply(this, arguments);
};

Element.prototype.onceKey = function() {
  return this.screen.program.onceKey.apply(this, arguments);
};

Element.prototype.unkey =
Element.prototype.removeKey = function() {
  return this.screen.program.unkey.apply(this, arguments);
};

Element.prototype.setIndex = function(index) {
  if (!this.parent) return;

  if (index < 0) {
    index = this.parent.children.length + index;
  }

  index = Math.max(index, 0);
  index = Math.min(index, this.parent.children.length - 1);

  var i = this.parent.children.indexOf(this);
  if (!~i) return;

  var item = this.parent.children.splice(i, 1)[0];
  this.parent.children.splice(index, 0, item);
};

Element.prototype.setFront = function() {
  return this.setIndex(-1);
};

Element.prototype.setBack = function() {
  return this.setIndex(0);
};

Element.prototype.clearPos = function(get, override) {
  if (this.detached) return;
  var lpos = this._getCoords(get);
  if (!lpos) return;
  this.screen.clearRegion(
    lpos.xi, lpos.xl,
    lpos.yi, lpos.yl,
    override);
};
Element.prototype.getLabel = function() {
  if (this._label) return this._label.getContent();
}

Element.prototype.setLabel = function(options) {
  var self = this;
  var Box = Require('term/widgets/box');

  if (typeof options === 'string') {
    options = { text: options };
  }

  if (this._label) {
    this._label.setContent(options.text);
    if (options.side !== 'right') {
      this._label.rleft = 2 + (this.border ? -1 : 0);
      this._label.position.right = undefined;
      if (!this.screen.autoPadding) {
        this._label.rleft = 2;
      }
    } else {
      this._label.rright = 2 + (this.border ? -1 : 0);
      this._label.position.left = undefined;
      if (!this.screen.autoPadding) {
        this._label.rright = 2;
      }
    }
    return;
  }

  this._label = new Box({
    screen: this.screen,
    parent: this,
    content: options.text,
    top: -this.itop,
    tags: this.parseTags,
    shrink: true,
    style: this.style.label
  });

  if (options.side !== 'right') {
    this._label.rleft = 2 - this.ileft;
  } else {
    this._label.rright = 2 - this.iright;
  }
  
  if (this.border && this.border.type=='none') this._label.rleft=0;
  
  this._label._isLabel = true;

  if (!this.screen.autoPadding) {
    if (options.side !== 'right') {
      this._label.rleft = 2;
    } else {
      this._label.rright = 2;
    }
    this._label.rtop = 0;
  }

  var reposition = function() {
    self._label.rtop = (self.childBase || 0) - self.itop;
    if (!self.screen.autoPadding) {
      self._label.rtop = (self.childBase || 0);
    }
    self.screen.render();
  };

  this.on('scroll', this._labelScroll = function() {
    reposition();
  });

  this.on('resize', this._labelResize = function() {
    nextTick(function() {
      reposition();
    });
  });
};

Element.prototype.removeLabel = function() {
  if (!this._label) return;
  this.removeListener('scroll', this._labelScroll);
  this.removeListener('resize', this._labelResize);
  this._label.detach();
  delete this._labelScroll;
  delete this._labelResize;
  delete this._label;
};

Element.prototype.setHover = function(options) {
  if (typeof options === 'string') {
    options = { text: options };
  }

  this._hoverOptions = options;
  this.enableMouse();
  this.screen._initHover();
};

Element.prototype.removeHover = function() {
  delete this._hoverOptions;
  if (!this.screen._hoverText || this.screen._hoverText.detached) return;
  this.screen._hoverText.detach();
  this.screen.render();
};

/**
 * Positioning
 */

// The below methods are a bit confusing: basically
// whenever Box.render is called `lpos` gets set on
// the element, an object containing the rendered
// coordinates. Since these don't update if the
// element is moved somehow, they're unreliable in
// that situation. However, if we can guarantee that
// lpos is good and up to date, it can be more
// accurate than the calculated positions below.
// In this case, if the element is being rendered,
// it's guaranteed that the parent will have been
// rendered first, in which case we can use the
// parant's lpos instead of recalculating it's
// position (since that might be wrong because
// it doesn't handle content shrinkage).

Element.prototype._getPos = function() {
  var pos = this.lpos;

  assert.ok(pos);

  if (pos.aleft != null) return pos;

  pos.aleft = pos.xi;
  pos.atop = pos.yi;
  pos.aright = this.screen.cols - pos.xl;
  pos.abottom = this.screen.rows - pos.yl;
  pos.width = pos.xl - pos.xi;
  pos.height = pos.yl - pos.yi;

  return pos;
};

/**
 * Position Getters
 */

Element.prototype._getWidth = function(get) {
  var parent = get ? this.parent._getPos() : this.parent
    , width = this.position.width
    , left
    , expr;

  if (typeof width === 'string') {
    if (width === 'half') width = '50%';
    expr = width.split(/(?=\+|-)/);
    width = expr[0];
    width = +width.slice(0, -1) / 100;
    width = parent.width * width | 0;
    width += +(expr[1] || 0);
    return width;
  }

  // This is for if the element is being streched or shrunken.
  // Although the width for shrunken elements is calculated
  // in the render function, it may be calculated based on
  // the content width, and the content width is initially
  // decided by the width the element, so it needs to be
  // calculated here.
  if (width == null) {
    left = this.position.left || 0;
    if (typeof left === 'string') {
      if (left === 'center') left = '50%';
      expr = left.split(/(?=\+|-)/);
      left = expr[0];
      left = +left.slice(0, -1) / 100;
      left = parent.width * left | 0;
      left += +(expr[1] || 0);
    }
    width = parent.width - (this.position.right || 0) - left;
    if (this.screen.autoPadding) {
      if ((this.position.left != null || this.position.right == null)
          && this.position.left !== 'center') {
        width -= this.parent.ileft;
      }
      width -= this.parent.iright;
    }
  }

  return width;
};

/* Depricated:
Element.prototype.__defineGetter__('width', function() {
  return this._getWidth(false);
});
*/
Object.defineProperty(Element.prototype,'width',{
  get: function () {return this._getWidth(false);},
  set: function (val) {
    if (this.position.width === val) return;
    if (/^\d+$/.test(val)) val = +val;
    this.emit('resize');
    this.clearPos();
    return this.position.width = val;
  }
});

Element.prototype._getHeight = function(get) {
  var parent = get ? this.parent._getPos() : this.parent
    , height = this.position.height
    , top
    , expr;

  if (typeof height === 'string') {
    if (height === 'half') height = '50%';
    expr = height.split(/(?=\+|-)/);
    height = expr[0];
    height = +height.slice(0, -1) / 100;
    height = parent.height * height | 0;
    height += +(expr[1] || 0);
    return height;
  }

  // This is for if the element is being streched or shrunken.
  // Although the width for shrunken elements is calculated
  // in the render function, it may be calculated based on
  // the content width, and the content width is initially
  // decided by the width the element, so it needs to be
  // calculated here.
  if (height == null) {
    top = this.position.top || 0;
    if (typeof top === 'string') {
      if (top === 'center') top = '50%';
      expr = top.split(/(?=\+|-)/);
      top = expr[0];
      top = +top.slice(0, -1) / 100;
      top = parent.height * top | 0;
      top += +(expr[1] || 0);
    }
    height = parent.height - (this.position.bottom || 0) - top;
    if (this.screen.autoPadding) {
      if ((this.position.top != null
          || this.position.bottom == null)
          && this.position.top !== 'center') {
        height -= this.parent.itop;
      }
      height -= this.parent.ibottom;
    }
  }

  return height;
};

/* Depricated 
Element.prototype.__defineGetter__('height', function() {
  return this._getHeight(false);
});
*/
Object.defineProperty(Element.prototype,'height',{
  get: function () {return this._getHeight(false);},
  set: function (val) {
    if (this.position.height === val) return;
    if (/^\d+$/.test(val)) val = +val;
    this.emit('resize');
    this.clearPos();
    return this.position.height = val;
  }
});

Element.prototype._getLeft = function(get) {
  var parent = get ? this.parent._getPos() : this.parent
    , left = this.position.left || 0
    , expr;

  if (typeof left === 'string') {
    if (left === 'center') left = '50%';
    expr = left.split(/(?=\+|-)/);
    left = expr[0];
    left = +left.slice(0, -1) / 100;
    left = parent.width * left | 0;
    left += +(expr[1] || 0);
    if (this.position.left === 'center') {
      left -= this._getWidth(get) / 2 | 0;
    }
  }

  if (this.position.left == null && this.position.right != null) {
    return this.screen.cols - this._getWidth(get) - this._getRight(get);
  }

  if (this.screen.autoPadding) {
    if ((this.position.left != null
        || this.position.right == null)
        && this.position.left !== 'center') {
      left += this.parent.ileft;
    }
  }

  return (parent.aleft || 0) + left;
};

/* Depricated:
Element.prototype.__defineGetter__('aleft', function() {
  return this._getLeft(false);
});
*/
Object.defineProperty(Element.prototype,'aleft',{
  get: function () {return this._getLeft(false);},
  set: function (val) {
    var expr;
    if (typeof val === 'string') {
      if (val === 'center') {
        val = this.screen.width / 2 | 0;
        val -= this.width / 2 | 0;
      } else {
        expr = val.split(/(?=\+|-)/);
        val = expr[0];
        val = +val.slice(0, -1) / 100;
        val = this.screen.width * val | 0;
        val += +(expr[1] || 0);
      }
    }
    val -= this.parent.aleft;
    if (this.position.left === val) return;
    this.emit('move');
    this.clearPos();
    return this.position.left = val;
  }
});

Element.prototype._getRight = function(get) {
  var parent = get ? this.parent._getPos() : this.parent
    , right= this.position.right || 0;

  // @blab
  if (typeof right === 'string') {
    // Hack; relative right align of elements; e.g., 50% of parent width
    // usually used with one left and one right aligned element in a row (both relative alignments)
    expr = right.split(/(?=\+|-)/);
    right = expr[0];
    right = +right.slice(0, -1) / 100;
    right = Math.ceil(parent.width * right) | 0;
    return right; 
  }

  if (this.position.right == null && this.position.left != null) {
    right = this.screen.cols - (this._getLeft(get) + this._getWidth(get));
    if (this.screen.autoPadding) {
      right += this.parent.iright;
    }
    return right;
  }

  right = (parent.aright || 0) + (this.position.right || 0);

  if (this.screen.autoPadding) {
    right += this.parent.iright;
  }

  return right;
};

/* Depricated
Element.prototype.__defineGetter__('aright', function() {
  return this._getRight(false);
});
*/
Object.defineProperty(Element.prototype,'aright',{
  get: function () {return this._getRight(false);},
  set: function (val) {
    val -= this.parent.aright;
    if (this.position.right === val) return;
    this.emit('move');
    this.clearPos();
    return this.position.right = val;  
  }
});

Element.prototype._getTop = function(get) {
  var parent = get ? this.parent._getPos() : this.parent
    , top = this.position.top || 0
    , expr;

  if (typeof top === 'string') {
    if (top === 'center') top = '50%';
    expr = top.split(/(?=\+|-)/);
    top = expr[0];
    top = +top.slice(0, -1) / 100;
    top = parent.height * top | 0;
    top += +(expr[1] || 0);
    if (this.position.top === 'center') {
      top -= this._getHeight(get) / 2 | 0;
    }
  }

  if (this.position.top == null && this.position.bottom != null) {
    return this.screen.rows - this._getHeight(get) - this._getBottom(get);
  }

  if (this.screen.autoPadding) {
    if ((this.position.top != null
        || this.position.bottom == null)
        && this.position.top !== 'center') {
      top += this.parent.itop;
    }
  }

  return (parent.atop || 0) + top;
};

/* Depricated
Element.prototype.__defineGetter__('atop', function() {
  return this._getTop(false);
});
*/
Object.defineProperty(Element.prototype,'atop',{
  get: function () {return this._getTop(false);},
  set: function (val) {
    var expr;
    if (typeof val === 'string') {
      if (val === 'center') {
        val = this.screen.height / 2 | 0;
        val -= this.height / 2 | 0;
      } else {
        expr = val.split(/(?=\+|-)/);
        val = expr[0];
        val = +val.slice(0, -1) / 100;
        val = this.screen.height * val | 0;
        val += +(expr[1] || 0);
      }
    }
    val -= this.parent.atop;
    if (this.position.top === val) return;
    this.emit('move');
    this.clearPos();
    return this.position.top = val; 
  }

});

Element.prototype._getBottom = function(get) {
  var parent = get ? this.parent._getPos() : this.parent
    , bottom;

  if (this.position.bottom == null && this.position.top != null) {
    bottom = this.screen.rows - (this._getTop(get) + this._getHeight(get));
    if (this.screen.autoPadding) {
      bottom += this.parent.ibottom;
    }
    return bottom;
  }

  bottom = (parent.abottom || 0) + (this.position.bottom || 0);

  if (this.screen.autoPadding) {
    bottom += this.parent.ibottom;
  }

  return bottom;
};

/* Depricated
Element.prototype.__defineGetter__('abottom', function() {
  return this._getBottom(false);
});

Element.prototype.__defineGetter__('rleft', function() {
  return this.aleft - this.parent.aleft;
});

Element.prototype.__defineGetter__('rright', function() {
  return this.aright - this.parent.aright;
});

Element.prototype.__defineGetter__('rtop', function() {
  return this.atop - this.parent.atop;
});

Element.prototype.__defineGetter__('rbottom', function() {
  return this.abottom - this.parent.abottom;
});
*/
Object.defineProperty(Element.prototype,'abottom',{
  get: function () {return this._getBottom(false);},
  set: function (val) {
    val -= this.parent.abottom;
    if (this.position.bottom === val) return;
    this.emit('move');
    this.clearPos();
    return this.position.bottom = val;  
  }
});
Object.defineProperty(Element.prototype,'rleft',{
  get: function () {return this.aleft - this.parent.aleft;},
  set: function (val) {
    if (this.position.left === val) return;
    if (/^\d+$/.test(val)) val = +val;
    this.emit('move');
    this.clearPos();
    return this.position.left = val;  
  }
});
Object.defineProperty(Element.prototype,'rright',{
  get: function () {return this.aright - this.parent.aright;},
  set: function (val) {
    if (this.position.right === val) return;
    this.emit('move');
    this.clearPos();
    return this.position.right = val;  
  }
});
Object.defineProperty(Element.prototype,'rtop',{
  get: function () {return this.atop - this.parent.atop;},
  set: function (val) {
    if (this.position.top === val) return;
    if (/^\d+$/.test(val)) val = +val;
    this.emit('move');
    this.clearPos();
    return this.position.top = val;  
  }
});
Object.defineProperty(Element.prototype,'rbottom',{
  get: function () {return this.abottom - this.parent.abottom;},
  set: function (val) {
    if (this.position.bottom === val) return;
    this.emit('move');
    this.clearPos();
    return this.position.bottom = val;  
  }
});

/**
 * Position Setters
 */

// NOTE:
// For aright, abottom, right, and bottom:
// If position.bottom is null, we could simply set top instead.
// But it wouldn't replicate bottom behavior appropriately if
// the parent was resized, etc.
/* Depricated
Element.prototype.__defineSetter__('width', function(val) {
  if (this.position.width === val) return;
  if (/^\d+$/.test(val)) val = +val;
  this.emit('resize');
  this.clearPos();
  return this.position.width = val;
});

Element.prototype.__defineSetter__('height', function(val) {
  if (this.position.height === val) return;
  if (/^\d+$/.test(val)) val = +val;
  this.emit('resize');
  this.clearPos();
  return this.position.height = val;
});

Element.prototype.__defineSetter__('aleft', function(val) {
  var expr;
  if (typeof val === 'string') {
    if (val === 'center') {
      val = this.screen.width / 2 | 0;
      val -= this.width / 2 | 0;
    } else {
      expr = val.split(/(?=\+|-)/);
      val = expr[0];
      val = +val.slice(0, -1) / 100;
      val = this.screen.width * val | 0;
      val += +(expr[1] || 0);
    }
  }
  val -= this.parent.aleft;
  if (this.position.left === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.left = val;
});

Element.prototype.__defineSetter__('aright', function(val) {
  val -= this.parent.aright;
  if (this.position.right === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.right = val;
});

Element.prototype.__defineSetter__('atop', function(val) {
  var expr;
  if (typeof val === 'string') {
    if (val === 'center') {
      val = this.screen.height / 2 | 0;
      val -= this.height / 2 | 0;
    } else {
      expr = val.split(/(?=\+|-)/);
      val = expr[0];
      val = +val.slice(0, -1) / 100;
      val = this.screen.height * val | 0;
      val += +(expr[1] || 0);
    }
  }
  val -= this.parent.atop;
  if (this.position.top === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.top = val;
});

Element.prototype.__defineSetter__('abottom', function(val) {
  val -= this.parent.abottom;
  if (this.position.bottom === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.bottom = val;
});

Element.prototype.__defineSetter__('rleft', function(val) {
  if (this.position.left === val) return;
  if (/^\d+$/.test(val)) val = +val;
  this.emit('move');
  this.clearPos();
  return this.position.left = val;
});

Element.prototype.__defineSetter__('rright', function(val) {
  if (this.position.right === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.right = val;
});

Element.prototype.__defineSetter__('rtop', function(val) {
  if (this.position.top === val) return;
  if (/^\d+$/.test(val)) val = +val;
  this.emit('move');
  this.clearPos();
  return this.position.top = val;
});

Element.prototype.__defineSetter__('rbottom', function(val) {
  if (this.position.bottom === val) return;
  this.emit('move');
  this.clearPos();
  return this.position.bottom = val;
});
*/

/* Depricated
Element.prototype.__defineGetter__('ileft', function() {
  return (this.border ? 1 : 0) + this.padding.left;
  // return (this.border && this.border.left ? 1 : 0) + this.padding.left;
});

Element.prototype.__defineGetter__('itop', function() {
  return (this.border ? 1 : 0) + this.padding.top;
  // return (this.border && this.border.top ? 1 : 0) + this.padding.top;
});

Element.prototype.__defineGetter__('iright', function() {
  return (this.border ? 1 : 0) + this.padding.right;
  // return (this.border && this.border.right ? 1 : 0) + this.padding.right;
});

Element.prototype.__defineGetter__('ibottom', function() {
  return (this.border ? 1 : 0) + this.padding.bottom;
  // return (this.border && this.border.bottom ? 1 : 0) + this.padding.bottom;
});

Element.prototype.__defineGetter__('iwidth', function() {
  // return (this.border
  //   ? ((this.border.left ? 1 : 0) + (this.border.right ? 1 : 0)) : 0)
  //   + this.padding.left + this.padding.right;
  return (this.border ? 2 : 0) + this.padding.left + this.padding.right;
});

Element.prototype.__defineGetter__('iheight', function() {
  // return (this.border
  //   ? ((this.border.top ? 1 : 0) + (this.border.bottom ? 1 : 0)) : 0)
  //   + this.padding.top + this.padding.bottom;
  return (this.border ? 2 : 0) + this.padding.top + this.padding.bottom;
});

Element.prototype.__defineGetter__('tpadding', function() {
  return this.padding.left + this.padding.top
    + this.padding.right + this.padding.bottom;
});
*/
Object.defineProperty(Element.prototype,'ileft',{
  get: function () {
    return (this.border ? 1 : 0) + this.padding.left;
    // return (this.border && this.border.left ? 1 : 0) + this.padding.left;
  }
});
Object.defineProperty(Element.prototype,'itop',{
  get: function () {
    return (this.border ? 1 : 0) + this.padding.top;
    // return (this.border && this.border.top ? 1 : 0) + this.padding.top;
  }
});
Object.defineProperty(Element.prototype,'iright',{
  get: function () {
    return (this.border ? 1 : 0) + this.padding.right;
    // return (this.border && this.border.right ? 1 : 0) + this.padding.right;
  }
});
Object.defineProperty(Element.prototype,'ibottom',{
  get: function () {
    return (this.border ? 1 : 0) + this.padding.bottom;
    // return (this.border && this.border.bottom ? 1 : 0) + this.padding.bottom;
  }
});
Object.defineProperty(Element.prototype,'iwidth',{
  get: function () {
    // return (this.border
    //   ? ((this.border.left ? 1 : 0) + (this.border.right ? 1 : 0)) : 0)
    //   + this.padding.left + this.padding.right;
    return (this.border ? 2 : 0) + this.padding.left + this.padding.right;
  }
});
Object.defineProperty(Element.prototype,'iheight',{
  get: function () {
    // return (this.border
    //   ? ((this.border.top ? 1 : 0) + (this.border.bottom ? 1 : 0)) : 0)
    //   + this.padding.top + this.padding.bottom;
    return (this.border ? 2 : 0) + this.padding.top + this.padding.bottom;
  }
});
Object.defineProperty(Element.prototype,'tpadding',{
  get: function () {
    return this.padding.left + this.padding.top
      + this.padding.right + this.padding.bottom;
  }
});

/**
 * Relative coordinates as default properties
 */
/* Depricated
Element.prototype.__defineGetter__('left', function() {
  return this.rleft;
});

Element.prototype.__defineGetter__('right', function() {
  return this.rright;
});

Element.prototype.__defineGetter__('top', function() {
  return this.rtop;
});

Element.prototype.__defineGetter__('bottom', function() {
  return this.rbottom;
});
*/
Object.defineProperty(Element.prototype,'left',{
  get: function () {return this.rleft;},
  set: function (val) {
    return this.rleft = val;  
  }
});
Object.defineProperty(Element.prototype,'right',{
  get: function () {return this.rright;},
  set: function (val) {
    return this.rright = val; 
  }
});
Object.defineProperty(Element.prototype,'top',{
  get: function () {return this.rtop;},
  set: function (val) {
    return this.rtop = val;  
  }
});
Object.defineProperty(Element.prototype,'bottom',{
  get: function () {return this.rbottom;},
  set: function (val) {
    return this.rbottom = val;    
  }
});
  
/* Depricated
Element.prototype.__defineSetter__('left', function(val) {
  return this.rleft = val;
});

Element.prototype.__defineSetter__('right', function(val) {
  return this.rright = val;
});

Element.prototype.__defineSetter__('top', function(val) {
  return this.rtop = val;
});

Element.prototype.__defineSetter__('bottom', function(val) {
  return this.rbottom = val;
});
*/

/**
 * Rendering - here be dragons
 */

Element.prototype._getShrinkBox = function(xi, xl, yi, yl, get) {
  if (!this.children.length) {
    return { xi: xi, xl: xi + 1, yi: yi, yl: yi + 1 };
  }

  var i, el, ret, mxi = xi, mxl = xi + 1, myi = yi, myl = yi + 1;

  // This is a chicken and egg problem. We need to determine how the children
  // will render in order to determine how this element renders, but it in
  // order to figure out how the children will render, they need to know
  // exactly how their parent renders, so, we can give them what we have so
  // far.
  var _lpos;
  if (get) {
    _lpos = this.lpos;
    this.lpos = { xi: xi, xl: xl, yi: yi, yl: yl };
    //this.shrink = false;
  }

  for (i = 0; i < this.children.length; i++) {
    el = this.children[i];

    ret = el._getCoords(get);

    // Or just (seemed to work, but probably not good):
    // ret = el.lpos || this.lpos;

    if (!ret) continue;

    // Since the parent element is shrunk, and the child elements think it's
    // going to take up as much space as possible, an element anchored to the
    // right or bottom will inadvertantly make the parent's shrunken size as
    // large as possible. So, we can just use the height and/or width the of
    // element.
    // if (get) {
    if (el.position.left == null && el.position.right != null) {
      ret.xl = xi + (ret.xl - ret.xi);
      ret.xi = xi;
      if (this.screen.autoPadding) {
        // Maybe just do this no matter what.
        ret.xl += this.ileft;
        ret.xi += this.ileft;
      }
    }
    if (el.position.top == null && el.position.bottom != null) {
      ret.yl = yi + (ret.yl - ret.yi);
      ret.yi = yi;
      if (this.screen.autoPadding) {
        // Maybe just do this no matter what.
        ret.yl += this.itop;
        ret.yi += this.itop;
      }
    }

    if (ret.xi < mxi) mxi = ret.xi;
    if (ret.xl > mxl) mxl = ret.xl;
    if (ret.yi < myi) myi = ret.yi;
    if (ret.yl > myl) myl = ret.yl;
  }

  if (get) {
    this.lpos = _lpos;
    //this.shrink = true;
  }

  if (this.position.width == null
      && (this.position.left == null
      || this.position.right == null)) {
    if (this.position.left == null && this.position.right != null) {
      xi = xl - (mxl - mxi);
      if (!this.screen.autoPadding) {
        xi -= this.padding.left + this.padding.right;
      } else {
        xi -= this.ileft;
      }
    } else {
      xl = mxl;
      if (!this.screen.autoPadding) {
        xl += this.padding.left + this.padding.right;
        // XXX Temporary workaround until we decide to make autoPadding default.
        // See widget-listtable.js for an example of why this is necessary.
        // XXX Maybe just to this for all this being that this would affect
        // width shrunken normal shrunken lists as well.
        // if (this._isList) {
        if (this.type === 'list-table') {
          xl -= this.padding.left + this.padding.right;
          xl += this.iright;
        }
      } else {
        //xl += this.padding.right;
        xl += this.iright;
      }
    }
  }

  if (this.position.height == null
      && (this.position.top == null
      || this.position.bottom == null)
      && (!this.scrollable || this._isList)) {
    // NOTE: Lists get special treatment if they are shrunken - assume they
    // want all list items showing. This is one case we can calculate the
    // height based on items/boxes.
    if (this._isList) {
      myi = 0 - this.itop;
      myl = this.items.length + this.ibottom;
    }
    if (this.position.top == null && this.position.bottom != null) {
      yi = yl - (myl - myi);
      if (!this.screen.autoPadding) {
        yi -= this.padding.top + this.padding.bottom;
      } else {
        yi -= this.itop;
      }
    } else {
      yl = myl;
      if (!this.screen.autoPadding) {
        yl += this.padding.top + this.padding.bottom;
      } else {
        yl += this.ibottom;
      }
    }
  }

  return { xi: xi, xl: xl, yi: yi, yl: yl };
};

Element.prototype._getShrinkContent = function(xi, xl, yi, yl) {
  var h = this._clines.length
    , w = this._clines.mwidth || 1;

  if (this.position.width == null
      && (this.position.left == null
      || this.position.right == null)) {
    if (this.position.left == null && this.position.right != null) {
      xi = xl - w - this.iwidth;
    } else {
      xl = xi + w + this.iwidth;
    }
  }

  if (this.position.height == null
      && (this.position.top == null
      || this.position.bottom == null)
      && (!this.scrollable || this._isList)) {
    if (this.position.top == null && this.position.bottom != null) {
      yi = yl - h - this.iheight;
    } else {
      yl = yi + h + this.iheight;
    }
  }

  return { xi: xi, xl: xl, yi: yi, yl: yl };
};

Element.prototype._getShrink = function(xi, xl, yi, yl, get) {
  var shrinkBox = this._getShrinkBox(xi, xl, yi, yl, get)
    , shrinkContent = this._getShrinkContent(xi, xl, yi, yl, get)
    , xll = xl
    , yll = yl;

  // Figure out which one is bigger and use it.
  if (shrinkBox.xl - shrinkBox.xi > shrinkContent.xl - shrinkContent.xi) {
    xi = shrinkBox.xi;
    xl = shrinkBox.xl;
  } else {
    xi = shrinkContent.xi;
    xl = shrinkContent.xl;
  }

  if (shrinkBox.yl - shrinkBox.yi > shrinkContent.yl - shrinkContent.yi) {
    yi = shrinkBox.yi;
    yl = shrinkBox.yl;
  } else {
    yi = shrinkContent.yi;
    yl = shrinkContent.yl;
  }

  // Recenter shrunken elements.
  if (xl < xll && this.position.left === 'center') {
    xll = (xll - xl) / 2 | 0;
    xi += xll;
    xl += xll;
  }

  if (yl < yll && this.position.top === 'center') {
    yll = (yll - yl) / 2 | 0;
    yi += yll;
    yl += yll;
  }

  return { xi: xi, xl: xl, yi: yi, yl: yl };
};

Element.prototype._getCoords = function(get, noscroll) {
  if (this.hidden) return;

  // if (this.parent._rendering) {
  //   get = true;
  // }

  var xi = this._getLeft(get)
    , xl = xi + this._getWidth(get)
    , yi = this._getTop(get)
    , yl = yi + this._getHeight(get)
    , base = this.childBase || 0
    , el = this
    , fixed = this.fixed
    , coords
    , v
    , noleft
    , noright
    , notop
    , nobot
    , ppos
    , b;

  // Attempt to shrink the element base on the
  // size of the content and child elements.
  if (this.shrink) {
    coords = this._getShrink(xi, xl, yi, yl, get);
    xi = coords.xi, xl = coords.xl;
    yi = coords.yi, yl = coords.yl;
  }

  // Find a scrollable ancestor if we have one.
  while (el = el.parent) {
    if (el.scrollable) {
      if (fixed) {
        fixed = false;
        continue;
      }
      break;
    }
  }

  // Check to make sure we're visible and
  // inside of the visible scroll area.
  // NOTE: Lists have a property where only
  // the list items are obfuscated.

  // Old way of doing things, this would not render right if a shrunken element
  // with lots of boxes in it was within a scrollable element.
  // See: $ node test/widget-shrink-fail.js
  // var thisparent = this.parent;

  var thisparent = el;
  if (el && !noscroll) {
    ppos = thisparent.lpos;

    // The shrink option can cause a stack overflow
    // by calling _getCoords on the child again.
    // if (!get && !thisparent.shrink) {
    //   ppos = thisparent._getCoords();
    // }

    if (!ppos) return;

    // TODO: Figure out how to fix base (and cbase to only
    // take into account the *parent's* padding.

    yi -= ppos.base;
    yl -= ppos.base;

    b = thisparent.border ? 1 : 0;

    // XXX
    // Fixes non-`fixed` labels to work with scrolling (they're ON the border):
    // if (this.position.left < 0
    //     || this.position.right < 0
    //     || this.position.top < 0
    //     || this.position.bottom < 0) {
    if (this._isLabel) {
      b = 0;
    }

    if (yi < ppos.yi + b) {
      if (yl - 1 < ppos.yi + b) {
        // Is above.
        return;
      } else {
        // Is partially covered above.
        notop = true;
        v = ppos.yi - yi;
        if (this.border) v--;
        if (thisparent.border) v++;
        base += v;
        yi += v;
      }
    } else if (yl > ppos.yl - b) {
      if (yi > ppos.yl - 1 - b) {
        // Is below.
        return;
      } else {
        // Is partially covered below.
        nobot = true;
        v = yl - ppos.yl;
        if (this.border) v--;
        if (thisparent.border) v++;
        yl -= v;
      }
    }

    // Shouldn't be necessary.
    // assert.ok(yi < yl);
    if (yi >= yl) return;

    // Could allow overlapping stuff in scrolling elements
    // if we cleared the pending buffer before every draw.
    if (xi < el.lpos.xi) {
      xi = el.lpos.xi;
      noleft = true;
      if (this.border) xi--;
      if (thisparent.border) xi++;
    }
    if (xl > el.lpos.xl) {
      xl = el.lpos.xl;
      noright = true;
      if (this.border) xl++;
      if (thisparent.border) xl--;
    }
    //if (xi > xl) return;
    if (xi >= xl) return;
  }

  if (this.noOverflow && this.parent.lpos) {
    if (xi < this.parent.lpos.xi + this.parent.ileft) {
      xi = this.parent.lpos.xi + this.parent.ileft;
    }
    if (xl > this.parent.lpos.xl - this.parent.iright) {
      xl = this.parent.lpos.xl - this.parent.iright;
    }
    if (yi < this.parent.lpos.yi + this.parent.itop) {
      yi = this.parent.lpos.yi + this.parent.itop;
    }
    if (yl > this.parent.lpos.yl - this.parent.ibottom) {
      yl = this.parent.lpos.yl - this.parent.ibottom;
    }
  }

  // if (this.parent.lpos) {
  //   this.parent.lpos._scrollBottom = Math.max(
  //     this.parent.lpos._scrollBottom, yl);
  // }

  return {
    xi: xi,
    xl: xl,
    yi: yi,
    yl: yl,
    base: base,
    noleft: noleft,
    noright: noright,
    notop: notop,
    nobot: nobot,
    renders: this.screen.renders
  };
};

Element.prototype.render = function() {
  this._emit('prerender');

  this.parseContent();

  var coords = this._getCoords(true);
  if (!coords) {
    delete this.lpos;
    return;
  }

  if (coords.xl - coords.xi <= 0) {
    coords.xl = Math.max(coords.xl, coords.xi);
    return;
  }

  if (coords.yl - coords.yi <= 0) {
    coords.yl = Math.max(coords.yl, coords.yi);
    return;
  }

  var lines = this.screen.lines
    , xi = coords.xi
    , xl = coords.xl
    , yi = coords.yi
    , yl = coords.yl
    , x
    , y
    , cell
    , attr
    , ch
    , content = this._pcontent
    , ci = this._clines.ci[coords.base]
    , battr
    , dattr
    , c
    , visible
    , i
    , bch = this.ch;

  // Clip content if it's off the edge of the screen
  // if (xi + this.ileft < 0 || yi + this.itop < 0) {
  //   var clines = this._clines.slice();
  //   if (xi + this.ileft < 0) {
  //     for (var i = 0; i < clines.length; i++) {
  //       var t = 0;
  //       var csi = '';
  //       var csis = '';
  //       for (var j = 0; j < clines[i].length; j++) {
  //         while (clines[i][j] === '\x1b') {
  //           csi = '\x1b';
  //           while (clines[i][j++] !== 'm') csi += clines[i][j];
  //           csis += csi;
  //         }
  //         if (++t === -(xi + this.ileft) + 1) break;
  //       }
  //       clines[i] = csis + clines[i].substring(j);
  //     }
  //   }
  //   if (yi + this.itop < 0) {
  //     clines = clines.slice(-(yi + this.itop));
  //   }
  //   content = clines.join('\n');
  // }

  if (coords.base >= this._clines.ci.length) {
    ci = this._pcontent.length;
  }

  this.lpos = coords;

  if (this.border && this.border.type === 'line') {
    this.screen._borderStops[coords.yi] = true;
    this.screen._borderStops[coords.yl - 1] = true;
    // if (!this.screen._borderStops[coords.yi]) {
    //   this.screen._borderStops[coords.yi] = { xi: coords.xi, xl: coords.xl };
    // } else {
    //   if (this.screen._borderStops[coords.yi].xi > coords.xi) {
    //     this.screen._borderStops[coords.yi].xi = coords.xi;
    //   }
    //   if (this.screen._borderStops[coords.yi].xl < coords.xl) {
    //     this.screen._borderStops[coords.yi].xl = coords.xl;
    //   }
    // }
    // this.screen._borderStops[coords.yl - 1] = this.screen._borderStops[coords.yi];
  }

  dattr = this.sattr(this.style);
  attr = dattr;

  // If we're in a scrollable text box, check to
  // see which attributes this line starts with.
  if (ci > 0) {
    attr = this._clines.attr[Math.min(coords.base, this._clines.length - 1)];
  }

  if (this.border) xi++, xl--, yi++, yl--;

  // If we have padding/valign, that means the
  // content-drawing loop will skip a few cells/lines.
  // To deal with this, we can just fill the whole thing
  // ahead of time. This could be optimized.
  if (this.tpadding || (this.valign && this.valign !== 'top')) {
    if (this.style.transparent) {
      for (y = Math.max(yi, 0); y < yl; y++) {
        if (!lines[y]) break;
        for (x = Math.max(xi, 0); x < xl; x++) {
          if (!lines[y][x]) break;
          lines[y][x][0] = colors.blend(attr, lines[y][x][0]);
          // lines[y][x][1] = bch;
          lines[y].dirty = true;
        }
      }
    } else {
      this.screen.fillRegion(dattr, bch, xi, xl, yi, yl);
    }
  }

  if (this.tpadding) {
    xi += this.padding.left, xl -= this.padding.right;
    yi += this.padding.top, yl -= this.padding.bottom;
  }

  // Determine where to place the text if it's vertically aligned.
  if (this.valign === 'middle' || this.valign === 'bottom') {
    visible = yl - yi;
    if (this._clines.length < visible) {
      if (this.valign === 'middle') {
        visible = visible / 2 | 0;
        visible -= this._clines.length / 2 | 0;
      } else if (this.valign === 'bottom') {
        visible -= this._clines.length;
      }
      ci -= visible * (xl - xi);
    }
  }

  // Draw the content and background.
  for (y = yi; y < yl; y++) {
    if (!lines[y]) {
      if (y >= this.screen.height || yl < this.ibottom) {
        break;
      } else {
        continue;
      }
    }
    for (x = xi; x < xl; x++) {
      cell = lines[y][x];
      if (!cell) {
        if (x >= this.screen.width || xl < this.iright) {
          break;
        } else {
          continue;
        }
      }

      ch = content[ci++] || bch;

      // if (!content[ci] && !coords._contentEnd) {
      //   coords._contentEnd = { x: x - xi, y: y - yi };
      // }

      // Handle escape codes.
      while (ch === '\x1b') {
        if (c = /^\x1b\[[\d;]*m/.exec(content.substring(ci - 1))) {
          ci += c[0].length - 1;
          attr = this.screen.attrCode(c[0], attr, dattr);
          // Ignore foreground changes for selected items.
          if (this.parent._isList && this.parent.interactive
              && this.parent.items[this.parent.selected] === this
              && this.parent.options.invertSelected !== false) {
            attr = (attr & ~(0x1ff << 9)) | (dattr & (0x1ff << 9));
          }
          ch = content[ci] || bch;
          ci++;
        } else {
          break;
        }
      }

      // Handle newlines.
      if (ch === '\t') ch = bch;
      if (ch === '\n') {
        // If we're on the first cell and we find a newline and the last cell
        // of the last line was not a newline, let's just treat this like the
        // newline was already "counted".
        if (x === xi && y !== yi && content[ci - 2] !== '\n') {
          x--;
          continue;
        }
        // We could use fillRegion here, name the
        // outer loop, and continue to it instead.
        ch = bch;
        for (; x < xl; x++) {
          cell = lines[y][x];
          if (!cell) break;
          if (this.style.transparent) {
            lines[y][x][0] = colors.blend(attr, lines[y][x][0]);
            if (content[ci]) lines[y][x][1] = ch;
            lines[y].dirty = true;
          } else {
            if (attr !== cell[0] || ch !== cell[1]) {
              lines[y][x][0] = attr;
              lines[y][x][1] = ch;
              lines[y].dirty = true;
            }
          }
        }
        continue;
      }

      if (this.screen.fullUnicode && content[ci - 1]) {
        var point = unicode.codePointAt(content, ci - 1);
        // Handle combining chars:
        // Make sure they get in the same cell and are counted as 0.
        if (unicode.combining[point]) {
          if (point > 0x00ffff) {
            ch = content[ci - 1] + content[ci];
            ci++;
          }
          if (x - 1 >= xi) {
            lines[y][x - 1][1] += ch;
          } else if (y - 1 >= yi) {
            lines[y - 1][xl - 1][1] += ch;
          }
          x--;
          continue;
        }
        // Handle surrogate pairs:
        // Make sure we put surrogate pair chars in one cell.
        if (point > 0x00ffff) {
          ch = content[ci - 1] + content[ci];
          ci++;
        }
      }

      if (this._noFill) continue;

      if (this.style.transparent) {
        lines[y][x][0] = colors.blend(attr, lines[y][x][0]);
        if (content[ci]) lines[y][x][1] = ch;
        lines[y].dirty = true;
      } else {
        if (attr !== cell[0] || ch !== cell[1]) {
          lines[y][x][0] = attr;
          lines[y][x][1] = ch;
          lines[y].dirty = true;
        }
      }
    }
  }

  // Draw the scrollbar.
  // Could possibly draw this after all child elements.
  if (this.scrollbar) {
    // XXX
    // i = this.getScrollHeight();
    i = Math.max(this._clines.length, this._scrollBottom());
  }
  if (coords.notop || coords.nobot) i = -Infinity;

  if (this.scrollbar && (yl - yi) < i) {
    x = xl - 1;
    if (this.scrollbar.ignoreBorder && this.border) x++;
    if (this.alwaysScroll) {
      y = this.childBase / (i - (yl - yi));
    } else {
      y = (this.childBase + this.childOffset) / (i - 1);
    }
    y = yi + ((yl - yi) * y | 0);
    if (y >= yl) y = yl - 1;
    cell = lines[y] && lines[y][x];
    if (cell) {
      if (this.track) {
        ch = this.track.ch || ' ';
        attr = this.sattr(this.style.track,
          this.style.track.fg || this.style.fg,
          this.style.track.bg || this.style.bg);    
        this.screen.fillRegion(attr, ch, x, x + 1, yi, yl);
      }
      ch = this.scrollbar.ch || ' ';
      attr = this.sattr(this.style.scrollbar,
        this.style.scrollbar.fg || this.style.fg,
        this.style.scrollbar.bg || this.style.bg);
      if (attr !== cell[0] || ch !== cell[1]) {
        lines[y][x][0] = attr;
        lines[y][x][1] = ch;
        lines[y].dirty = true;
      }
    }
  }

  if (this.border) xi--, xl++, yi--, yl++;

  if (this.tpadding) {
    xi -= this.padding.left, xl += this.padding.right;
    yi -= this.padding.top, yl += this.padding.bottom;
  }

  // Draw the border.
  if (this.border) {
    battr = this.sattr(this.style.border);
    y = yi;
    if (coords.notop) y = -1;
    for (x = xi; x < xl; x++) {
      if (!lines[y]) break;
      if (coords.noleft && x === xi) continue;
      if (coords.noright && x === xl - 1) continue;
      cell = lines[y][x];
      if (!cell) continue;
      if (this.border.type === 'line') {
        if (x === xi) {
          if (!this.border.double) ch = '\u250c'; else ch = '\u2554'; // '┌'
          if (!this.border.left) {
            if (this.border.top) {
              if (!this.border.double) ch = '\u2500'; else ch = '\u2550'; // '─'
            } else {
              continue;
            }
          } else {
            if (!this.border.top) {
              if (!this.border.double) ch = '\u2502'; else ch = '\u2551'; // '│'
            }
          }
        } else if (x === xl - 1) {
          if (!this.border.double) ch = '\u2510'; else ch = '\u2557'; // '┐'
          if (!this.border.right) {
            if (this.border.top) {
              if (!this.border.double) ch = '\u2500'; else ch = '\u2550'; // '─'
            } else {
              continue;
            }
          } else {
            if (!this.border.top) {
              if (!this.border.double) ch = '\u2502'; else ch = '\u2551'; // '│'
            }
          }
        } else {
          if (!this.border.double) ch = '\u2500'; else ch = '\u2550';// '─'
        }
      } else if (this.border.type === 'bg') {
        ch = this.border.ch;
      }
      if (!this.border.top && x !== xi && x !== xl - 1) {
        ch = ' ';
        if (dattr !== cell[0] || ch !== cell[1]) {
          lines[y][x][0] = dattr;
          lines[y][x][1] = ch;
          lines[y].dirty = true;
          continue;
        }
      }
      if (battr !== cell[0] || ch !== cell[1]) {
        lines[y][x][0] = battr;
        lines[y][x][1] = ch;
        lines[y].dirty = true;
      }
    }
    y = yi + 1;
    for (; y < yl - 1; y++) {
      if (!lines[y]) continue;
      cell = lines[y][xi];
      if (cell) {
        if (this.border.left) {
          if (this.border.type === 'line') {
            if (!this.border.double) ch = '\u2502'; else ch = '\u2551'; // '│'
          } else if (this.border.type === 'bg') {
            ch = this.border.ch;
          }
          if (!coords.noleft)
          if (battr !== cell[0] || ch !== cell[1]) {
            lines[y][xi][0] = battr;
            lines[y][xi][1] = ch;
            lines[y].dirty = true;
          }
        } else {
          ch = ' ';
          if (dattr !== cell[0] || ch !== cell[1]) {
            lines[y][xi][0] = dattr;
            lines[y][xi][1] = ch;
            lines[y].dirty = true;
          }
        }
      }
      cell = lines[y][xl - 1];
      if (cell) {
        if (this.border.right) {
          if (this.border.type === 'line') {
            if (!this.border.double) ch = '\u2502'; else ch = '\u2551'; // '│'
          } else if (this.border.type === 'bg') {
            ch = this.border.ch;
          }
          if (!coords.noright)
          if (battr !== cell[0] || ch !== cell[1]) {
            lines[y][xl - 1][0] = battr;
            lines[y][xl - 1][1] = ch;
            lines[y].dirty = true;
          }
        } else {
          ch = ' ';
          if (dattr !== cell[0] || ch !== cell[1]) {
            lines[y][xl - 1][0] = dattr;
            lines[y][xl - 1][1] = ch;
            lines[y].dirty = true;
          }
        }
      }
    }
    y = yl - 1;
    if (coords.nobot) y = -1;
    for (x = xi; x < xl; x++) {
      if (!lines[y]) break;
      if (coords.noleft && x === xi) continue;
      if (coords.noright && x === xl - 1) continue;
      cell = lines[y][x];
      if (!cell) continue;
      if (this.border.type === 'line') {
        if (x === xi) {
          if (!this.border.double) ch = '\u2514'; else ch = '\u255a'; // '└'
          if (!this.border.left) {
            if (this.border.bottom) {
              if (!this.border.double) ch = '\u2500'; else ch = '\u2550'; // '─'
            } else {
              continue;
            }
          } else {
            if (!this.border.bottom) {
              if (!this.border.double) ch = '\u2502'; else ch = '\u2551'; // '│'
            }
          }
        } else if (x === xl - 1) {
          if (!this.border.double) ch = '\u2518'; else ch = '\u255d'; // '┘'
          if (!this.border.right) {
            if (this.border.bottom) {
              if (!this.border.double) ch = '\u2500'; else ch = '\u2550'; // '─'
            } else {
              continue;
            }
          } else {
            if (!this.border.bottom) {
              if (!this.border.double) ch = '\u2502'; else ch = '\u2551'; // '│'
            }
          }
        } else {
          if (!this.border.double) ch = '\u2500'; else ch = '\u2550'; // '─'
        }
      } else if (this.border.type === 'bg') {
        ch = this.border.ch;
      }
      if (!this.border.bottom && x !== xi && x !== xl - 1) {
        ch = ' ';
        if (dattr !== cell[0] || ch !== cell[1]) {
          lines[y][x][0] = dattr;
          lines[y][x][1] = ch;
          lines[y].dirty = true;
        }
        continue;
      }
      if (battr !== cell[0] || ch !== cell[1]) {
        lines[y][x][0] = battr;
        lines[y][x][1] = ch;
        lines[y].dirty = true;
      }
    }
  }

  if (this.shadow) {
    // right
    y = Math.max(yi + 1, 0);
    for (; y < yl + 1; y++) {
      if (!lines[y]) break;
      x = xl;
      for (; x < xl + 2; x++) {
        if (!lines[y][x]) break;
        // lines[y][x][0] = colors.blend(this.dattr, lines[y][x][0]);
        lines[y][x][0] = colors.blend(lines[y][x][0]);
        lines[y].dirty = true;
      }
    }
    // bottom
    y = yl;
    for (; y < yl + 1; y++) {
      if (!lines[y]) break;
      for (x = Math.max(xi + 1, 0); x < xl; x++) {
        if (!lines[y][x]) break;
        // lines[y][x][0] = colors.blend(this.dattr, lines[y][x][0]);
        lines[y][x][0] = colors.blend(lines[y][x][0]);
        lines[y].dirty = true;
      }
    }
  }

  this.children.forEach(function(el) {
    if (el.screen._ci !== -1) {
      el.index = el.screen._ci++;
    }
    // if (el.screen._rendering) {
    //   el._rendering = true;
    // }
    el.render();
    // if (el.screen._rendering) {
    //   el._rendering = false;
    // }
  });

  this._emit('render', [coords]);

  return coords;
};

Element.prototype._render = Element.prototype.render;

/**
 * Content Methods
 */

Element.prototype.insertLine = function(i, line) {
  if (typeof line === 'string') line = line.split('\n');

  if (i !== i || i == null) {
    i = this._clines.ftor.length;
  }

  i = Math.max(i, 0);

  while (this._clines.fake.length < i) {
    this._clines.fake.push('');
    this._clines.ftor.push([this._clines.push('') - 1]);
    this._clines.rtof(this._clines.fake.length - 1);
  }

  // NOTE: Could possibly compare the first and last ftor line numbers to see
  // if they're the same, or if they fit in the visible region entirely.
  var start = this._clines.length
    , diff
    , real;

  if (i >= this._clines.ftor.length) {
    real = this._clines.ftor[this._clines.ftor.length - 1];
    real = real[real.length - 1] + 1;
  } else {
    real = this._clines.ftor[i][0];
  }

  for (var j = 0; j < line.length; j++) {
    this._clines.fake.splice(i + j, 0, line[j]);
  }

  this.setContent(this._clines.fake.join('\n'), true);

  diff = this._clines.length - start;

  if (diff > 0) {
    var pos = this._getCoords();
    if (!pos) return;

    var height = pos.yl - pos.yi - this.iheight
      , base = this.childBase || 0
      , visible = real >= base && real - base < height;

    if (pos && visible && this.screen.cleanSides(this)) {
      this.screen.insertLine(diff,
        pos.yi + this.itop + real - base,
        pos.yi,
        pos.yl - this.ibottom - 1);
    }
  }
};

Element.prototype.deleteLine = function(i, n) {
  n = n || 1;

  if (i !== i || i == null) {
    i = this._clines.ftor.length - 1;
  }

  i = Math.max(i, 0);
  i = Math.min(i, this._clines.ftor.length - 1);

  // NOTE: Could possibly compare the first and last ftor line numbers to see
  // if they're the same, or if they fit in the visible region entirely.
  var start = this._clines.length
    , diff
    , real = this._clines.ftor[i][0];

  while (n--) {
    this._clines.fake.splice(i, 1);
  }

  this.setContent(this._clines.fake.join('\n'), true);

  diff = start - this._clines.length;

  // XXX clearPos() without diff statement?
  var height = 0;

  if (diff > 0) {
    var pos = this._getCoords();
    if (!pos) return;

    height = pos.yl - pos.yi - this.iheight;

    var base = this.childBase || 0
      , visible = real >= base && real - base < height;

    if (pos && visible && this.screen.cleanSides(this)) {
      this.screen.deleteLine(diff,
        pos.yi + this.itop + real - base,
        pos.yi,
        pos.yl - this.ibottom - 1);
    }
  }

  if (this._clines.length < height) {
    this.clearPos();
  }
};

Element.prototype.insertTop = function(line) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.insertLine(fake, line);
};

Element.prototype.insertBottom = function(line) {
  var h = (this.childBase || 0) + this.height - this.iheight
    , i = Math.min(h, this._clines.length)
    , fake = this._clines.rtof[i - 1] + 1;

  return this.insertLine(fake, line);
};

Element.prototype.deleteTop = function(n) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.deleteLine(fake, n);
};

Element.prototype.deleteBottom = function(n) {
  var h = (this.childBase || 0) + this.height - 1 - this.iheight
    , i = Math.min(h, this._clines.length - 1)
    , fake = this._clines.rtof[i];

  n = n || 1;

  return this.deleteLine(fake - (n - 1), n);
};

Element.prototype.setLine = function(i, line) {
  i = Math.max(i, 0);
  while (this._clines.fake.length < i) {
    this._clines.fake.push('');
  }
  this._clines.fake[i] = line;
  return this.setContent(this._clines.fake.join('\n'), true);
};

Element.prototype.setBaseLine = function(i, line) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.setLine(fake + i, line);
};

Element.prototype.getLine = function(i) {
  i = Math.max(i, 0);
  i = Math.min(i, this._clines.fake.length - 1);
  return this._clines.fake[i];
};

Element.prototype.getBaseLine = function(i) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.getLine(fake + i);
};

Element.prototype.clearLine = function(i) {
  i = Math.min(i, this._clines.fake.length - 1);
  return this.setLine(i, '');
};

Element.prototype.clearBaseLine = function(i) {
  var fake = this._clines.rtof[this.childBase || 0];
  return this.clearLine(fake + i);
};

Element.prototype.unshiftLine = function(line) {
  return this.insertLine(0, line);
};

Element.prototype.shiftLine = function(n) {
  return this.deleteLine(0, n);
};

Element.prototype.pushLine = function(line) {
  if (!this.content) return this.setLine(0, line);
  return this.insertLine(this._clines.fake.length, line);
};

Element.prototype.popLine = function(n) {
  return this.deleteLine(this._clines.fake.length - 1, n);
};

Element.prototype.getLines = function() {
  return this._clines.fake.slice();
};

Element.prototype.getScreenLines = function() {
  return this._clines.slice();
};

Element.prototype.strWidth = function(text) {
  text = this.parseTags
    ? helpers.stripTags(text)
    : text;
  return this.screen.fullUnicode
    ? unicode.strWidth(text)
    : helpers.dropUnicode(text).length;
};

Element.prototype.screenshot = function(xi, xl, yi, yl) {
  xi = this.lpos.xi + this.ileft + (xi || 0);
  if (xl != null) {
    xl = this.lpos.xi + this.ileft + (xl || 0);
  } else {
    xl = this.lpos.xl - this.iright;
  }
  yi = this.lpos.yi + this.itop + (yi || 0);
  if (yl != null) {
    yl = this.lpos.yi + this.itop + (yl || 0);
  } else {
    yl = this.lpos.yl - this.ibottom;
  }
  return this.screen.screenshot(xi, xl, yi, yl);
};

/**
 * Expose
 */

module.exports = Element;
};
BundleModuleCode['term/widgets/arrows']=function (module,exports,global,process){
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Helpers = Require('term/helpers');
var Button = Require('term/widgets/button');


// Add up and down arrow buttons on the right outside of a widget
// options.arrows: {up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}}
module.exports = function (parent,options,up,down,nocontrol) {  
  var bbox;
  // Bbox computing for button positions; relatives can only be resolved to screen
  // coordinates?
  bbox=Helpers.bbox(parent.screen,options);
  parent._.up = new Button({
    screen: parent.screen,
    top: bbox.top+1,
    height: options.arrows.height||1,
    left: bbox.left+bbox.width,
    width: options.arrows.width||3,
    content: options.arrows.up||'[-]',
    align: 'center',
    style: {
      fg:options.arrows.fg||'red',
      bg: options.arrows.bg||'white',
      bold:true,
    },
    autoFocus: false,
    hidden:options.hidden,
    mouse: true
  });
  parent._.up.on('press',up);
  parent.screen.append(parent._.up);
  parent._.down = new Button({
    screen: this.screen,
    top: bbox.top+bbox.height-1-(options.arrows.height||1),
    height: options.arrows.height||1,
    left: bbox.left+bbox.width,
    width: options.arrows.width||3,
    content: options.arrows.down||'[+]',
    align: 'center',
    style: {
      fg:options.arrows.fg||'red',
      bg: options.arrows.bg||'white',
      bold:true,
    },
    autoFocus: false,
    hidden:options.hidden,
    mouse: true
  });
  parent._.down.on('press',down);
  parent.screen.append(parent._.down);
  if (!nocontrol) {
    parent._hide=parent.hide;
    parent.hide = function() {
      parent._hide();
      if (parent._.up) parent._.up.hide();
      if (parent._.down) parent._.down.hide();
      parent.screen.render();
    } 
    parent._show = parent.show;
    parent.show = function() {
      parent._show();
      if (parent._.up) parent._.up.show();
      if (parent._.down) parent._.down.show();
      parent.screen.render();
    } 
  }
}
};
BundleModuleCode['term/widgets/scrollabletext']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    scrollabletext.js - scrollable text element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var ScrollableBox = Require('term/widgets/scrollablebox');

/**
 * ScrollableText
 */

function ScrollableText(options) {
  if (!instanceOf(this,Node)) {
    return new ScrollableText(options);
  }
  options = options || {};
  options.alwaysScroll = true;
  ScrollableBox.call(this, options);
}

//ScrollableText.prototype.__proto__ = ScrollableBox.prototype;
inheritPrototype(ScrollableText,ScrollableBox);

ScrollableText.prototype.type = 'scrollable-text';

/**
 * Expose
 */

module.exports = ScrollableText;
};
BundleModuleCode['term/widgets/scrollablebox']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2016, Christopher Jeffrey and contributors
 **    $MODIFIED:    sbosse (2017).
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 *
 * scrollablebox.js - scrollable box element for blessed
 *
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * ScrollableBox
 */

function ScrollableBox(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new ScrollableBox(options);
  }

  options = options || {};

  Box.call(this, options);

  if (options.scrollable === false) {
    return this;
  }

  this.scrollable = true;
  this.childOffset = 0;
  this.childBase = 0;
  this.baseLimit = options.baseLimit || Infinity;
  this.alwaysScroll = options.alwaysScroll;

  this.scrollbar = options.scrollbar;
  if (this.scrollbar) {
    this.scrollbar.ch = this.scrollbar.ch || ' ';
    this.style.scrollbar = this.style.scrollbar || this.scrollbar.style;
    if (!this.style.scrollbar) {
      this.style.scrollbar = {};
      this.style.scrollbar.fg = this.scrollbar.fg;
      this.style.scrollbar.bg = this.scrollbar.bg;
      this.style.scrollbar.bold = this.scrollbar.bold;
      this.style.scrollbar.underline = this.scrollbar.underline;
      this.style.scrollbar.inverse = this.scrollbar.inverse;
      this.style.scrollbar.invisible = this.scrollbar.invisible;
    }
    //this.scrollbar.style = this.style.scrollbar;
    if (this.track || this.scrollbar.track) {
      this.track = this.scrollbar.track || this.track;
      this.style.track = this.style.scrollbar.track || this.style.track;
      this.track.ch = this.track.ch || ' ';
      this.style.track = this.style.track || this.track.style;
      if (!this.style.track) {
        this.style.track = {};
        this.style.track.fg = this.track.fg;
        this.style.track.bg = this.track.bg;
        this.style.track.bold = this.track.bold;
        this.style.track.underline = this.track.underline;
        this.style.track.inverse = this.track.inverse;
        this.style.track.invisible = this.track.invisible;
      }
      this.track.style = this.style.track;
    }
    // Allow controlling of the scrollbar via the mouse:
    if (options.mouse) {
      this.on('mousedown', function(data) {
        if (self._scrollingBar) {
          // Do not allow dragging on the scrollbar:
          delete self.screen._dragging;
          delete self._drag;
          return;
        }
        var x = data.x - self.aleft;
        var y = data.y - self.atop;
        if (x === self.width - self.iright - 1) {
          // Do not allow dragging on the scrollbar:
          delete self.screen._dragging;
          delete self._drag;
          var perc = (y - self.itop) / (self.height - self.iheight);
          self.setScrollPerc(perc * 100 | 0);
          self.screen.render();
          var smd, smu;
          self._scrollingBar = true;
          self.onScreenEvent('mousedown', smd = function(data) {
            var y = data.y - self.atop;
            var perc = y / self.height;
            self.setScrollPerc(perc * 100 | 0);
            self.screen.render();
          });
          // If mouseup occurs out of the window, no mouseup event fires, and
          // scrollbar will drag again on mousedown until another mouseup
          // occurs.
          self.onScreenEvent('mouseup', smu = function() {
            self._scrollingBar = false;
            self.removeScreenEvent('mousedown', smd);
            self.removeScreenEvent('mouseup', smu);
          });
        }
      });
    }
  }

  if (options.mouse) {
    this.on('wheeldown', function() {
      self.scroll(self.height / 2 | 0 || 1);
      self.screen.render();
    });
    this.on('wheelup', function() {
      self.scroll(-(self.height / 2 | 0) || -1);
      self.screen.render();
    });
  }

  if (options.keys && !options.ignoreKeys) {
    this.on('keypress', function(ch, key) {
      if (key.name === 'up' || (options.vi && key.name === 'k')) {
        self.scroll(-1);
        self.screen.render();
        return;
      }
      if (key.name === 'down' || (options.vi && key.name === 'j')) {
        self.scroll(1);
        self.screen.render();
        return;
      }
      if (key.name === 'pageup') {
        self.scroll(-(self.height / 2 | 0) || -1);
        self.screen.render();
        return;
      }
      if (key.name === 'pagedown') {
        self.scroll(self.height / 2 | 0 || 1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'u' && key.ctrl) {
        self.scroll(-(self.height / 2 | 0) || -1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'd' && key.ctrl) {
        self.scroll(self.height / 2 | 0 || 1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'b' && key.ctrl) {
        self.scroll(-self.height || -1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'f' && key.ctrl) {
        self.scroll(self.height || 1);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'g' && !key.shift) {
        self.scrollTo(0);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'g' && key.shift) {
        self.scrollTo(self.getScrollHeight());
        self.screen.render();
        return;
      }
    });
  }

  this.on('parsed content', function() {
    self._recalculateIndex();
  });

  self._recalculateIndex();
}

//ScrollableBox.prototype.__proto__ = Box.prototype;
inheritPrototype(ScrollableBox,Box);

ScrollableBox.prototype.type = 'scrollable-box';

/* depricated
// XXX Potentially use this in place of scrollable checks elsewhere.
ScrollableBox.prototype.__defineGetter__('reallyScrollable', function() {
  if (this.shrink) return this.scrollable;
  return this.getScrollHeight() > this.height;
});
*/
Object.defineProperty(ScrollableBox.prototype,'reallyScrollable',{
  get: function () {  
    if (this.shrink) return this.scrollable;
    return this.getScrollHeight() > this.height;
  },
  set: function (val) {
  }
});


ScrollableBox.prototype._scrollBottom = function() {
  if (!this.scrollable) return 0;

  // We could just calculate the children, but we can
  // optimize for lists by just returning the items.length.
  if (this._isList) {
    return this.items ? this.items.length : 0;
  }

  if (this.lpos && this.lpos._scrollBottom) {
    return this.lpos._scrollBottom;
  }

  var bottom = this.children.reduce(function(current, el) {
    // el.height alone does not calculate the shrunken height, we need to use
    // getCoords. A shrunken box inside a scrollable element will not grow any
    // larger than the scrollable element's context regardless of how much
    // content is in the shrunken box, unless we do this (call getCoords
    // without the scrollable calculation):
    // See: $ node test/widget-shrink-fail-2.js
    if (!el.detached) {
      var lpos = el._getCoords(false, true);
      if (lpos) {
        return Math.max(current, el.rtop + (lpos.yl - lpos.yi));
      }
    }
    return Math.max(current, el.rtop + el.height);
  }, 0);

  // XXX Use this? Makes .getScrollHeight() useless!
  // if (bottom < this._clines.length) bottom = this._clines.length;

  if (this.lpos) this.lpos._scrollBottom = bottom;

  return bottom;
};

ScrollableBox.prototype.setScroll =
ScrollableBox.prototype.scrollTo = function(offset, always) {
  // XXX
  // At first, this appeared to account for the first new calculation of childBase:
  this.scroll(0);
  return this.scroll(offset - (this.childBase + this.childOffset), always);
};

ScrollableBox.prototype.getScroll = function() {
  return this.childBase + this.childOffset;
};

ScrollableBox.prototype.scroll = function(offset, always) {
  if (!this.scrollable) return;

  if (this.detached) return;

  // Handle scrolling.
  var visible = this.height - this.iheight
    , base = this.childBase
    , d
    , p
    , t
    , b
    , max
    , emax;

  if (this.alwaysScroll || always) {
    // Semi-workaround
    this.childOffset = offset > 0
      ? visible - 1 + offset
      : offset;
  } else {
    this.childOffset += offset;
  }

  if (this.childOffset > visible - 1) {
    d = this.childOffset - (visible - 1);
    this.childOffset -= d;
    this.childBase += d;
  } else if (this.childOffset < 0) {
    d = this.childOffset;
    this.childOffset += -d;
    this.childBase += d;
  }

  if (this.childBase < 0) {
    this.childBase = 0;
  } else if (this.childBase > this.baseLimit) {
    this.childBase = this.baseLimit;
  }

  // Find max "bottom" value for
  // content and descendant elements.
  // Scroll the content if necessary.
  if (this.childBase === base) {
    return this.emit('scroll');
  }

  // When scrolling text, we want to be able to handle SGR codes as well as line
  // feeds. This allows us to take preformatted text output from other programs
  // and put it in a scrollable text box.
  this.parseContent();

  // XXX
  // max = this.getScrollHeight() - (this.height - this.iheight);

  max = this._clines.length - (this.height - this.iheight);
  if (max < 0) max = 0;
  emax = this._scrollBottom() - (this.height - this.iheight);
  if (emax < 0) emax = 0;

  this.childBase = Math.min(this.childBase, Math.max(emax, max));

  if (this.childBase < 0) {
    this.childBase = 0;
  } else if (this.childBase > this.baseLimit) {
    this.childBase = this.baseLimit;
  }

  // Optimize scrolling with CSR + IL/DL.
  p = this.lpos;
  // Only really need _getCoords() if we want
  // to allow nestable scrolling elements...
  // or if we **really** want shrinkable
  // scrolling elements.
  // p = this._getCoords();
  if (p && this.childBase !== base && this.screen.cleanSides(this)) {
    t = p.yi + this.itop;
    b = p.yl - this.ibottom - 1;
    d = this.childBase - base;

    if (d > 0 && d < visible) {
      // scrolled down
      this.screen.deleteLine(d, t, t, b);
    } else if (d < 0 && -d < visible) {
      // scrolled up
      d = -d;
      this.screen.insertLine(d, t, t, b);
    }
  }

  return this.emit('scroll');
};

ScrollableBox.prototype.scrollBottom = function () {
  // Workaround: inserting lines when scrollbar was manually set
  // breaks scroll window (can't usee _scrollBottom...)
  this.scrollTo(10000000);
};

ScrollableBox.prototype._recalculateIndex = function() {
  var max, emax;

  if (this.detached || !this.scrollable) {
    return 0;
  }

  // XXX
  // max = this.getScrollHeight() - (this.height - this.iheight);

  max = this._clines.length - (this.height - this.iheight);
  if (max < 0) max = 0;
  emax = this._scrollBottom() - (this.height - this.iheight);
  if (emax < 0) emax = 0;

  this.childBase = Math.min(this.childBase, Math.max(emax, max));

  if (this.childBase < 0) {
    this.childBase = 0;
  } else if (this.childBase > this.baseLimit) {
    this.childBase = this.baseLimit;
  }
};

ScrollableBox.prototype.resetScroll = function() {
  if (!this.scrollable) return;
  this.childOffset = 0;
  this.childBase = 0;
  return this.emit('scroll');
};

ScrollableBox.prototype.getScrollHeight = function() {
  return Math.max(this._clines.length, this._scrollBottom());
};

ScrollableBox.prototype.getScrollPerc = function(s) {
  var pos = this.lpos || this._getCoords();
  if (!pos) return s ? -1 : 0;

  var height = (pos.yl - pos.yi) - this.iheight
    , i = this.getScrollHeight()
    , p;

  if (height < i) {
    if (this.alwaysScroll) {
      p = this.childBase / (i - height);
    } else {
      p = (this.childBase + this.childOffset) / (i - 1);
    }
    return p * 100;
  }

  return s ? -1 : 0;
};

ScrollableBox.prototype.setScrollPerc = function(i) {
  // XXX
  // var m = this.getScrollHeight();
  var m = Math.max(this._clines.length, this._scrollBottom());
  return this.scrollTo((i / 100) * m | 0);
};

/**
 * Expose
 */

module.exports = ScrollableBox;
};
BundleModuleCode['term/widgets/text']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2016-2017)
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    text.js - text element for blessed
 **
 ** Usage:
 
   var obj = blessed.text({
    width: options.width||(options.content.length),
    left: (options.center?int(screen.width/2-options.content.length/2):options.left),
    right : options.right,
    top: options.top||0,
    height: 3,
    focus:false,
    align: 'center',
    content: options.content||'?',
    style: {
      bold:true
    }  
  });
  screen.append(obj);

  obj.setContent('New text');
  
 **    $ENDOFINFO
 */
var Comp = Require('com/compat');

/**
 * Modules
 */

var Node = Require('term/widgets/node');
var Element = Require('term/widgets/element');

/**
 * Text
 */

function Text(options) {
  if (!instanceOf(this, Node)) {
    return new Text(options);
  }
  options = options || {};
  options.shrink = true;
  Element.call(this, options);
}

//Text.prototype.__proto__ = Element.prototype;
inheritPrototype(Text,Element);

Text.prototype.type = 'text';

/**
 * Expose
 */

module.exports = Text;
};
BundleModuleCode['term/widgets/line']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    line.js - line element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Line
 */

function Line(options) {
  if (!instanceOf(this,Node)) {
    return new Line(options);
  }

  options = options || {};

  var orientation = options.orientation || 'vertical';
  delete options.orientation;

  if (orientation === 'vertical') {
    options.width = 1;
  } else {
    options.height = 1;
  }

  Box.call(this, options);

  this.ch = !options.type || options.type === 'line'
    ? orientation === 'horizontal' ? '─' : '│'
    : options.ch || ' ';

  this.border = {
    type: 'bg',
    __proto__: this
  };

  this.style.border = this.style;
}

//Line.prototype.__proto__ = Box.prototype;
inheritPrototype(Line,Box);

Line.prototype.type = 'line';

/**
 * Expose
 */

module.exports = Line;
};
BundleModuleCode['term/widgets/bigtext']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    bigtext.js - bigtext element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var fs = require('fs');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * BigText
 */

function BigText(options) {
  if (!instanceOf(this instanceof Node)) {
    return new BigText(options);
  }
  options = options || {};
  options.font = options.font
    || __dirname + '/../../usr/fonts/ter-u14n.json';
  options.fontBold = options.font
    || __dirname + '/../../usr/fonts/ter-u14b.json';
  this.fch = options.fch;
  this.ratio = {};
  this.font = this.loadFont(options.font);
  this.fontBold = this.loadFont(options.font);
  Box.call(this, options);
  if (this.style.bold) {
    this.font = this.fontBold;
  }
}

//BigText.prototype.__proto__ = Box.prototype;
inheritPrototype(BigText,Box);

BigText.prototype.type = 'bigtext';

BigText.prototype.loadFont = function(filename) {
  var self = this
    , data
    , font;

  data = JSON.parse(fs.readFileSync(filename, 'utf8'));

  this.ratio.width = data.width;
  this.ratio.height = data.height;

  function convertLetter(ch, lines) {
    var line, i;

    while (lines.length > self.ratio.height) {
      lines.shift();
      lines.pop();
    }

    lines = lines.map(function(line) {
      var chs = line.split('');
      chs = chs.map(function(ch) {
        return ch === ' ' ? 0 : 1;
      });
      while (chs.length < self.ratio.width) {
        chs.push(0);
      }
      return chs;
    });

    while (lines.length < self.ratio.height) {
      line = [];
      for (i = 0; i < self.ratio.width; i++) {
        line.push(0);
      }
      lines.push(line);
    }

    return lines;
  }

  font = Object.keys(data.glyphs).reduce(function(out, ch) {
    var lines = data.glyphs[ch].map;
    out[ch] = convertLetter(ch, lines);
    return out;
  }, {});

  delete font[' '];

  return font;
};

BigText.prototype.setContent = function(content) {
  this.content = '';
  this.text = content || '';
};

BigText.prototype.render = function() {
  if (this.position.width == null || this._shrinkWidth) {
    // if (this.width - this.iwidth < this.ratio.width * this.text.length + 1) {
      this.position.width = this.ratio.width * this.text.length + 1;
      this._shrinkWidth = true;
    // }
  }
  if (this.position.height == null || this._shrinkHeight) {
    // if (this.height - this.iheight < this.ratio.height + 0) {
      this.position.height = this.ratio.height + 0;
      this._shrinkHeight = true;
    // }
  }

  var coords = this._render();
  if (!coords) return;

  var lines = this.screen.lines
    , left = coords.xi + this.ileft
    , top = coords.yi + this.itop
    , right = coords.xl - this.iright
    , bottom = coords.yl - this.ibottom;

  var dattr = this.sattr(this.style)
    , bg = dattr & 0x1ff
    , fg = (dattr >> 9) & 0x1ff
    , flags = (dattr >> 18) & 0x1ff
    , attr = (flags << 18) | (bg << 9) | fg;

  for (var x = left, i = 0; x < right; x += this.ratio.width, i++) {
    var ch = this.text[i];
    if (!ch) break;
    var map = this.font[ch];
    if (!map) continue;
    for (var y = top; y < Math.min(bottom, top + this.ratio.height); y++) {
      if (!lines[y]) continue;
      var mline = map[y - top];
      if (!mline) continue;
      for (var mx = 0; mx < this.ratio.width; mx++) {
        var mcell = mline[mx];
        if (mcell == null) break;
        if (this.fch && this.fch !== ' ') {
          lines[y][x + mx][0] = dattr;
          lines[y][x + mx][1] = mcell === 1 ? this.fch : this.ch;
        } else {
          lines[y][x + mx][0] = mcell === 1 ? attr : dattr;
          lines[y][x + mx][1] = mcell === 1 ? ' ' : this.ch;
        }
      }
      lines[y].dirty = true;
    }
  }

  return coords;
};

/**
 * Expose
 */

module.exports = BigText;
};
BundleModuleCode['term/widgets/list']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2017-2018)
 **    $REVESIO:     1.2.5
 **
 **    $INFO:
 **
 **    list.js - list element for blessed
 **
 **     Added: 
 **       - 'arrows', arrow buttons
 **
 **     Options: {selectlast,selectoffset,label, border, style, arrows?}
 **
 **       selectlast:boolean    (try to) select always last selected item after modification
 **       selectoffset:number   additional (positive, downto) scroll shift on selection 
 **                             (otherwise selected line jumps to bottom of window)
 **
 **     Events In: click, keypress, element wheeldown, element wheelup, resize, adopt, remove
 **     Events Out: action(item,selected), select(item,selected), selected(item)
 **     Item content text: item.content
 **
 **
 **    Usage:
 **     Create list: list=new List({..});
 **     Update list: list.setItems([content1:string,content2:string,..]);
 **     Get selected item content (label): list.getSelected().getContent();
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');
var Io = Require('com/io');
var helpers = Require('term/helpers');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Button = Require('term/widgets/button');
var Arrows = Require('term/widgets/arrows');

/**
 * List
 */

function List(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new List(options);
  }


  options = options || {};

  options.ignoreKeys = true;
  // Possibly put this here: this.items = [];
  options.scrollable = true;
  Box.call(this, options);
  this.value = '';
  this.items = [];
  this.ritems = [];
  this.selected = 0;
  this._isList = true;

  if (!this.style.selected) {
    this.style.selected = {};
    this.style.selected.bg = options.selectedBg;
    this.style.selected.fg = options.selectedFg;
    this.style.selected.bold = options.selectedBold;
    this.style.selected.underline = options.selectedUnderline;
    this.style.selected.blink = options.selectedBlink;
    this.style.selected.inverse = options.selectedInverse;
    this.style.selected.invisible = options.selectedInvisible;
  }

  if (!this.style.item) {
    this.style.item = {};
    this.style.item.bg = options.itemBg;
    this.style.item.fg = options.itemFg;
    this.style.item.bold = options.itemBold;
    this.style.item.underline = options.itemUnderline;
    this.style.item.blink = options.itemBlink;
    this.style.item.inverse = options.itemInverse;
    this.style.item.invisible = options.itemInvisible;
  }

  // Legacy: for apps written before the addition of item attributes.
  ['bg', 'fg', 'bold', 'underline',
   'blink', 'inverse', 'invisible'].forEach(function(name) {
    if (self.style[name] != null && self.style.item[name] == null) {
      self.style.item[name] = self.style[name];
    }
  });

  if (this.options.itemHoverBg) {
    this.options.itemHoverEffects = { bg: this.options.itemHoverBg };
  }

  if (this.options.itemHoverEffects) {
    this.style.item.hover = this.options.itemHoverEffects;
  }

  if (this.options.itemFocusEffects) {
    this.style.item.focus = this.options.itemFocusEffects;
  }

  this.interactive = options.interactive !== false;

  this.mouse = options.mouse || false;

  if (options.items) {
    this.ritems = options.items;
    options.items.forEach(this.add.bind(this));
  }

  this.select(0);

  if (options.mouse) {
    this.screen._listenMouse(this);
    this.on('element wheeldown', function() {
      self.select(self.selected + 2);
      self.screen.render();
    });
    this.on('element wheelup', function() {
      self.select(self.selected - 2);
      self.screen.render();
    });
  }

  if (options.keys) {
    this.on('keypress', function(ch, key) {
      if (key.name === 'up' || (options.vi && key.name === 'k')) {
        self.up();
        self.screen.render();
        self.emit('selected', self.items[self.selected]);
        return;
      }
      if (key.name === 'down' || (options.vi && key.name === 'j')) {
        self.down();
        self.screen.render();
        self.emit('selected', self.items[self.selected]);
        return;
      }
      if (key.name === 'enter'
          || (options.vi && key.name === 'l' && !key.shift)) {
        self.enterSelected();
        return;
      }
      if (key.name === 'escape' || (options.vi && key.name === 'q')) {
        self.cancelSelected();
        return;
      }
      if (options.vi && key.name === 'u' && key.ctrl) {
        self.move(-((self.height - self.iheight) / 2) | 0);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'd' && key.ctrl) {
        self.move((self.height - self.iheight) / 2 | 0);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'b' && key.ctrl) {
        self.move(-(self.height - self.iheight));
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'f' && key.ctrl) {
        self.move(self.height - self.iheight);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'h' && key.shift) {
        self.move(self.childBase - self.selected);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'm' && key.shift) {
        // TODO: Maybe use Math.min(this.items.length,
        // ... for calculating visible items elsewhere.
        var visible = Math.min(
          self.height - self.iheight,
          self.items.length) / 2 | 0;
        self.move(self.childBase + visible - self.selected);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'l' && key.shift) {
        // XXX This goes one too far on lists with an odd number of items.
        self.down(self.childBase
          + Math.min(self.height - self.iheight, self.items.length)
          - self.selected);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'g' && !key.shift) {
        self.select(0);
        self.screen.render();
        return;
      }
      if (options.vi && key.name === 'g' && key.shift) {
        self.select(self.items.length - 1);
        self.screen.render();
        return;
      }

      if (options.vi && (key.ch === '/' || key.ch === '?')) {
        if (typeof self.options.search !== 'function') {
          return;
        }
        return self.options.search(function(err, value) {
          if (typeof err === 'string' || typeof err === 'function'
              || typeof err === 'number' || (err && err.test)) {
            value = err;
            err = null;
          }
          if (err || !value) return self.screen.render();
          self.select(self.fuzzyFind(value, key.ch === '?'));
          self.screen.render();
        });
      }
    });
  }

  this.on('resize', function() {
    var visible = self.height - self.iheight;
    // if (self.selected < visible - 1) {
    if (visible >= self.selected + 1) {
      self.childBase = 0;
      self.childOffset = self.selected;
    } else {
      // Is this supposed to be: self.childBase = visible - self.selected + 1; ?
      self.childBase = self.selected - visible + 1;
      self.childOffset = visible - 1;
    }
  });

  this.on('adopt', function(el) {
    if (!~self.items.indexOf(el)) {
      el.fixed = true;
    }
  });

  // Ensure children are removed from the
  // item list if they are items.
  this.on('remove', function(el) {
    self.removeItem(el);
  });

  if (options.arrows) 
    Arrows(
      self,
      options,
      function () { self.select(self.selected - 2); self.screen.render()},
      function () { self.select(self.selected + 2); self.screen.render()}
    );
}

//List.prototype.__proto__ = Box.prototype;
inheritPrototype(List,Box);

List.prototype.type = 'list';

List.prototype.createItem = function(content) {
  var self = this;

  // Note: Could potentially use Button here.
  var options = {
    screen: this.screen,
    content: content,
    align: this.align || 'left',
    top: 0,
    left: 0,
    right: (this.scrollbar ? 1 : 0),
    tags: this.parseTags,
    height: 1,
    hoverEffects: this.mouse ? this.style.item.hover : null,
    focusEffects: this.mouse ? this.style.item.focus : null,
    autoFocus: false
  };

  if (!this.screen.autoPadding) {
    options.top = 1;
    options.left = this.ileft;
    options.right = this.iright + (this.scrollbar ? 1 : 0);
  }

  // if (this.shrink) {
  // XXX NOTE: Maybe just do this on all shrinkage once autoPadding is default?
  if (this.shrink && this.options.normalShrink) {
    delete options.right;
    options.width = 'shrink';
  }

  ['bg', 'fg', 'bold', 'underline',
   'blink', 'inverse', 'invisible'].forEach(function(name) {
    options[name] = function() {
      var attr = self.items[self.selected] === item && self.interactive
        ? self.style.selected[name]
        : self.style.item[name];
      if (typeof attr === 'function') attr = attr(item);
      return attr;
    };
  });

  if (this.style.transparent) {
    options.transparent = true;
  }

  var item = new Box(options);

  if (this.mouse) {
    item.on('click', function() {
      self.focus();
      if (self.items[self.selected] === item) {
        self.emit('action', item, self.selected);
        self.emit('select', item, self.selected);
        return;
      }
      self.select(item);
      self.emit('selected', self.items[self.selected]);
      self.screen.render();
    });
  }

  this.emit('create item');

  return item;
};

List.prototype.add =
List.prototype.addItem =
List.prototype.appendItem = function(content) {
  content = typeof content === 'string' ? content : content.getContent();

  var item = this.createItem(content);
  item.position.top = this.items.length;
  if (!this.screen.autoPadding) {
    item.position.top = this.itop + this.items.length;
  }

  this.ritems.push(content);
  this.items.push(item);
  this.append(item);

  if (this.items.length === 1) {
    this.select(0);
  }

  this.emit('add item');

  return item;
};

List.prototype.removeItem = function(child) {
  var i = this.getItemIndex(child);
  if (~i && this.items[i]) {
    child = this.items.splice(i, 1)[0];
    this.ritems.splice(i, 1);
    this.remove(child);
    for (var j = i; j < this.items.length; j++) {
      this.items[j].position.top--;
    }
    if (i === this.selected) {
      this.select(i - 1);
    }
  }
  this.emit('remove item');
  return child;
};

List.prototype.insertItem = function(child, content) {
  content = typeof content === 'string' ? content : content.getContent();
  var i = this.getItemIndex(child);
  if (!~i) return;
  if (i >= this.items.length) return this.appendItem(content);
  var item = this.createItem(content);
  for (var j = i; j < this.items.length; j++) {
    this.items[j].position.top++;
  }
  item.position.top = i + (!this.screen.autoPadding ? 1 : 0);
  this.ritems.splice(i, 0, content);
  this.items.splice(i, 0, item);
  this.append(item);
  if (i === this.selected) {
    this.select(i + 1);
  }
  this.emit('insert item');
};

List.prototype.getItem = function(child) {
  return this.items[this.getItemIndex(child)];
};

List.prototype.setItem = function(child, content) {
  content = typeof content === 'string' ? content : content.getContent();
  var i = this.getItemIndex(child);
  if (!~i) return;
  this.items[i].setContent(content);
  this.ritems[i] = content;
};

List.prototype.clearItems = function() {
  return this.setItems([]);
};

List.prototype.setItems = function(items) {
  var original = this.items.slice()
    , selected = this.selected
    , sel = this.ritems[this.selected]
    , i = 0;

  items = items.slice();

  this.select(0);

  for (; i < items.length; i++) {
    if (this.items[i]) {
      this.items[i].setContent(items[i]);
    } else {
      this.add(items[i]);
    }
  }

  for (; i < original.length; i++) {
    this.remove(original[i]);
  }

  this.ritems = items;

  // Try to find our old item if it still exists.
  // But how to deal with ambiquous string items? indexOf can point to wrong item!?
  sel = items.indexOf(sel);
  if (this.options.selectlast) this.select(selected);
  /*
  if (~sel) {
    this.select(sel);
  } else */ if (items.length === original.length) {
    this.select(selected);
  } else {
    this.select(Math.min(selected, items.length - 1));
  }

  this.emit('set items');
};

List.prototype.pushItem = function(content) {
  this.appendItem(content);
  return this.items.length;
};

List.prototype.popItem = function() {
  return this.removeItem(this.items.length - 1);
};

List.prototype.unshiftItem = function(content) {
  this.insertItem(0, content);
  return this.items.length;
};

List.prototype.shiftItem = function() {
  return this.removeItem(0);
};

List.prototype.spliceItem = function(child, n) {
  var self = this;
  var i = this.getItemIndex(child);
  if (!~i) return;
  var items = Array.prototype.slice.call(arguments, 2);
  var removed = [];
  while (n--) {
    removed.push(this.removeItem(i));
  }
  items.forEach(function(item) {
    self.insertItem(i++, item);
  });
  return removed;
};

List.prototype.find =
List.prototype.fuzzyFind = function(search, back) {
  var start = this.selected + (back ? -1 : 1)
    , i;

  if (typeof search === 'number') search += '';

  if (search && search[0] === '/' && search[search.length - 1] === '/') {
    try {
      search = new RegExp(search.slice(1, -1));
    } catch (e) {
      ;
    }
  }

  var test = typeof search === 'string'
    ? function(item) { return !!~item.indexOf(search); }
    : (search.test ? search.test.bind(search) : search);

  if (typeof test !== 'function') {
    if (this.screen.options.debug) {
      throw new Error('fuzzyFind(): `test` is not a function.');
    }
    return this.selected;
  }

  if (!back) {
    for (i = start; i < this.ritems.length; i++) {
      if (test(helpers.cleanTags(this.ritems[i]))) return i;
    }
    for (i = 0; i < start; i++) {
      if (test(helpers.cleanTags(this.ritems[i]))) return i;
    }
  } else {
    for (i = start; i >= 0; i--) {
      if (test(helpers.cleanTags(this.ritems[i]))) return i;
    }
    for (i = this.ritems.length - 1; i > start; i--) {
      if (test(helpers.cleanTags(this.ritems[i]))) return i;
    }
  }

  return this.selected;
};

List.prototype.getItemIndex = function(child) {
  if (typeof child === 'number') {
    return child;
  } else if (typeof child === 'string') {
    var i = this.ritems.indexOf(child);
    if (~i) return i;
    for (i = 0; i < this.ritems.length; i++) {
      if (helpers.cleanTags(this.ritems[i]) === child) {
        return i;
      }
    }
    return -1;
  } else {
    return this.items.indexOf(child);
  }
};

List.prototype.getSelected = function() {
  return this.items[this.selected]; 
}

List.prototype.select = function(index) {
  var lastindex=this.selected;
  if (!this.interactive) {
    return;
  }
  if (!this.items.length) {
    this.selected = 0;
    this.value = '';
    this.scrollTo(0);
    return;
  }
  if (typeof index === 'object') {
    index = this.items.indexOf(index);
  }
  
  if (index < 0) {
    index = 0;
  } else if (index >= this.items.length) {
    index = this.items.length - 1;
  }

  if (this.selected === index && this._listInitialized) return;
  this._listInitialized = true;

  this.selected = index;
  this.value = helpers.cleanTags(this.ritems[this.selected]);
  if (!this.parent) return;
  if (index>=lastindex)
    this.scrollTo(this.selected+(this.options.selectoffset||0));
  else
    this.scrollTo(this.selected);
    

  // XXX Move `action` and `select` events here.
  this.emit('select item', this.items[this.selected], this.selected);
};

List.prototype.move = function(offset) {
  this.select(this.selected + offset);
};

List.prototype.up = function(offset) {
  this.move(-(offset || 1));
};

List.prototype.down = function(offset) {
  this.move(offset || 1);
};

List.prototype.pick = function(label, callback) {
  if (!callback) {
    callback = label;
    label = null;
  }

  if (!this.interactive) {
    return callback();
  }

  var self = this;
  var focused = this.screen.focused;
  if (focused && focused._done) focused._done('stop');
  this.screen.saveFocus();

  // XXX Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.focus();
  this.show();
  this.select(0);
  if (label) this.setLabel(label);
  this.screen.render();
  this.once('action', function(el, selected) {
    if (label) self.removeLabel();
    self.screen.restoreFocus();
    self.hide();
    self.screen.render();
    if (!el) return callback();
    return callback(null, helpers.cleanTags(self.ritems[selected]));
  });
};

List.prototype.enterSelected = function(i) {
  if (i != null) this.select(i);
  this.emit('action', this.items[this.selected], this.selected);
  this.emit('select', this.items[this.selected], this.selected);
};

List.prototype.cancelSelected = function(i) {
  if (i != null) this.select(i);
  this.emit('action');
  this.emit('cancel');
};

/**
 * Expose
 */

module.exports = List;
};
BundleModuleCode['term/widgets/form']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    form.js - form element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Form
 */

function Form(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Form(options);
  }

  options = options || {};

  options.ignoreKeys = true;
  Box.call(this, options);

  if (options.keys) {
    this.screen._listenKeys(this);
    this.on('element keypress', function(el, ch, key) {
      if ((key.name === 'tab' && !key.shift)
          || (el.type === 'textbox' && options.autoNext && key.name === 'enter')
          || key.name === 'down'
          || (options.vi && key.name === 'j')) {
        if (el.type === 'textbox' || el.type === 'textarea') {
          if (key.name === 'j') return;
          if (key.name === 'tab') {
            // Workaround, since we can't stop the tab from being added.
            el.emit('keypress', null, { name: 'backspace' });
          }
          el.emit('keypress', '\x1b', { name: 'escape' });
        }
        self.focusNext();
        return;
      }

      if ((key.name === 'tab' && key.shift)
          || key.name === 'up'
          || (options.vi && key.name === 'k')) {
        if (el.type === 'textbox' || el.type === 'textarea') {
          if (key.name === 'k') return;
          el.emit('keypress', '\x1b', { name: 'escape' });
        }
        self.focusPrevious();
        return;
      }

      if (key.name === 'escape') {
        self.focus();
        return;
      }
    });
  }
}

//Form.prototype.__proto__ = Box.prototype;
inheritPrototype(Form,Box),

Form.prototype.type = 'form';

Form.prototype._refresh = function() {
  // XXX Possibly remove this if statement and refresh on every focus.
  // Also potentially only include *visible* focusable elements.
  // This would remove the need to check for _selected.visible in previous()
  // and next().
  if (!this._children) {
    var out = [];

    this.children.forEach(function fn(el) {
      if (el.keyable) out.push(el);
      el.children.forEach(fn);
    });

    this._children = out;
  }
};

Form.prototype._visible = function() {
  return !!this._children.filter(function(el) {
    return el.visible;
  }).length;
};

Form.prototype.next = function() {
  this._refresh();

  if (!this._visible()) return;

  if (!this._selected) {
    this._selected = this._children[0];
    if (!this._selected.visible) return this.next();
    if (this.screen.focused !== this._selected) return this._selected;
  }

  var i = this._children.indexOf(this._selected);
  if (!~i || !this._children[i + 1]) {
    this._selected = this._children[0];
    if (!this._selected.visible) return this.next();
    return this._selected;
  }

  this._selected = this._children[i + 1];
  if (!this._selected.visible) return this.next();
  return this._selected;
};

Form.prototype.previous = function() {
  this._refresh();

  if (!this._visible()) return;

  if (!this._selected) {
    this._selected = this._children[this._children.length - 1];
    if (!this._selected.visible) return this.previous();
    if (this.screen.focused !== this._selected) return this._selected;
  }

  var i = this._children.indexOf(this._selected);
  if (!~i || !this._children[i - 1]) {
    this._selected = this._children[this._children.length - 1];
    if (!this._selected.visible) return this.previous();
    return this._selected;
  }

  this._selected = this._children[i - 1];
  if (!this._selected.visible) return this.previous();
  return this._selected;
};

Form.prototype.focusNext = function() {
  var next = this.next();
  if (next) next.focus();
};

Form.prototype.focusPrevious = function() {
  var previous = this.previous();
  if (previous) previous.focus();
};

Form.prototype.resetSelected = function() {
  this._selected = null;
};

Form.prototype.focusFirst = function() {
  this.resetSelected();
  this.focusNext();
};

Form.prototype.focusLast = function() {
  this.resetSelected();
  this.focusPrevious();
};

Form.prototype.submit = function() {
  var out = {};

  this.children.forEach(function fn(el) {
    if (el.value != null) {
      var name = el.name || el.type;
      if (Array.isArray(out[name])) {
        out[name].push(el.value);
      } else if (out[name]) {
        out[name] = [out[name], el.value];
      } else {
        out[name] = el.value;
      }
    }
    el.children.forEach(fn);
  });

  this.emit('submit', out);

  return this.submission = out;
};

Form.prototype.cancel = function() {
  this.emit('cancel');
};

Form.prototype.reset = function() {
  this.children.forEach(function fn(el) {
    switch (el.type) {
      case 'screen':
        break;
      case 'box':
        break;
      case 'text':
        break;
      case 'line':
        break;
      case 'scrollable-box':
        break;
      case 'list':
        el.select(0);
        return;
      case 'form':
        break;
      case 'input':
        break;
      case 'textbox':
        el.clearInput();
        return;
      case 'textarea':
        el.clearInput();
        return;
      case 'button':
        delete el.value;
        break;
      case 'progress-bar':
        el.setProgress(0);
        break;
      case 'file-manager':
        el.refresh(el.options.cwd);
        return;
      case 'checkbox':
        el.uncheck();
        return;
      case 'radio-set':
        break;
      case 'radio-button':
        el.uncheck();
        return;
      case 'prompt':
        break;
      case 'question':
        break;
      case 'message':
        break;
      case 'info':
        break;
      case 'loading':
        break;
      case 'list-bar':
        //el.select(0);
        break;
      case 'dir-manager':
        el.refresh(el.options.cwd);
        return;
      case 'terminal':
        el.write('');
        return;
      case 'image':
        //el.clearImage();
        return;
    }
    el.children.forEach(fn);
  });

  this.emit('reset');
};

/**
 * Expose
 */

module.exports = Form;
};
BundleModuleCode['term/widgets/textarea']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2018, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.4.1
 **
 **    $INFO:
 **
 **    textarea.js - textarea element for blessed
 **
 **    new: cursor control
 **
 **    special options: {cursorControl}
 ** 
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var unicode = Require('term/unicode');

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = Require('term/widgets/node');
var Input = Require('term/widgets/input');

/**
 * Textarea
 */

function Textarea(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Textarea(options);
  }

  options = options || {};

  options.scrollable = options.scrollable !== false;

  Input.call(this, options);

  this.screen._listenKeys(this);

  this.value = options.value || '';
  // cursor position
  this.cpos = {x:-1,y:-1};
  this.cursorControl=true;
  
  this.__updateCursor = this._updateCursor.bind(this);
  this.on('resize', this.__updateCursor);
  this.on('move', this.__updateCursor);

  if (options.inputOnFocus) {
    this.on('focus', this.readInput.bind(this, null));
  }

  if (!options.inputOnFocus && options.keys) {
    this.on('keypress', function(ch, key) {
      if (self._reading) return;
      if (key.name === 'enter' || (options.vi && key.name === 'i')) {
        return self.readInput();
      }
      if (key.name === 'e') {
        return self.readEditor();
      }
    });
  }

  if (options.mouse) {
    this.on('click', function(data) {
      if (self._reading) return;
      if (data.button !== 'right') return;
      self.readEditor();
    });
  }
}

//Textarea.prototype.__proto__ = Input.prototype;
inheritPrototype(Textarea,Input);

Textarea.prototype.type = 'textarea';

Textarea.prototype._updateCursor = function(get) {
  if (this.screen.focused !== this) {
    return;
  }

  var lpos = get ? this.lpos : this._getCoords();
  if (!lpos) return;

  var last = this._clines[this._clines.length - 1]
    , program = this.screen.program
    , line
    , cx
    , cy;

  // Stop a situation where the textarea begins scrolling
  // and the last cline appears to always be empty from the
  // _typeScroll `+ '\n'` thing.
  // Maybe not necessary anymore?
  if (last === '' && this.value[this.value.length - 1] !== '\n') {
    last = this._clines[this._clines.length - 2] || '';
  }

  line = Math.min(
    this._clines.length - 1 - (this.childBase || 0),
    (lpos.yl - lpos.yi) - this.iheight - 1);

  // When calling clearValue() on a full textarea with a border, the first
  // argument in the above Math.min call ends up being -2. Make sure we stay
  // positive.
  line = Math.max(0, line);

  if (this.cpos.x==-1 || !this.cursorControl) this.cpos.x = this.strWidth(last);
  if (this.cpos.y==-1 || !this.cursorControl) this.cpos.y = line;
  this.cpos.y = Math.min(this.cpos.y,line);
  this.cpos.x = Math.min(this.cpos.x,this.strWidth(this._clines[this.cpos.y]));
    
  cx = lpos.xi + this.ileft + this.cpos.x;
  cy = lpos.yi + this.itop + this.cpos.y;

  // XXX Not sure, but this may still sometimes
  // cause problems when leaving editor.
  if (cy === program.y && cx === program.x) {
    return;
  }

  if (cy === program.y) {
    if (cx > program.x) {
      program.cuf(cx - program.x);
    } else if (cx < program.x) {
      program.cub(program.x - cx);
    }
  } else if (cx === program.x) {
    if (cy > program.y) {
      program.cud(cy - program.y);
    } else if (cy < program.y) {
      program.cuu(program.y - cy);
    }
  } else {
    program.cup(cy, cx);
  }
};

Textarea.prototype.input =
Textarea.prototype.setInput =
Textarea.prototype.readInput = function(callback) {
  var self = this
    , focused = this.screen.focused === this;

  if (this._reading) return;
  this._reading = true;

  this._callback = callback;

  if (!focused) {
    this.screen.saveFocus();
    this.focus();
  }

  this.screen.grabKeys = true;

  this._updateCursor();
  this.screen.program.showCursor();
  //this.screen.program.sgr('normal');

  this._done = function fn(err, value) {
    if (!self._reading) return;

    if (fn.done) return;
    fn.done = true;

    self._reading = false;

    delete self._callback;
    delete self._done;

    self.removeListener('keypress', self.__listener);
    delete self.__listener;

    self.removeListener('blur', self.__done);
    delete self.__done;

    self.screen.program.hideCursor();
    self.screen.grabKeys = false;

    if (!focused) {
      self.screen.restoreFocus();
    }

    if (self.options.inputOnFocus) {
      self.screen.rewindFocus();
    }

    // Ugly
    if (err === 'stop') return;

    if (err) {
      self.emit('error', err);
    } else if (value != null) {
      self.emit('submit', value);
    } else {
      self.emit('cancel', value);
    }
    self.emit('action', value);

    if (!callback) return;

    return err
      ? callback(err)
      : callback(null, value);
  };

  // Put this in a nextTick so the current
  // key event doesn't trigger any keys input.
  nextTick(function() {
    self.__listener = self._listener.bind(self);
    self.on('keypress', self.__listener);
  });

  this.__done = this._done.bind(this, null, null);
  this.on('blur', this.__done);
};

Textarea.prototype._listener = function(ch, key) {
  var done = this._done
    , value = this.value
    , newline = false;

  if (key.name === 'return') return;
  if (key.name === 'enter') {
    ch = '\n';
    // this.cpos.x=1;
    // this.cpos.y++;
    newline=true;
  }

  // Handle cursor positiong by keys.
  if (this.cursorControl) switch (key.name) {
    case 'left':
      if (this.cpos.x>0) this.cpos.x--;
      this._updateCursor(true);
      break;
    case 'right':
      this.cpos.x++;
      this._updateCursor(true);
      break;
    case 'up':
      if (this.cpos.y>0) {
        this.cpos.y--;
        //this.cpos.x=this.strWidth(this._clines[this.cpos.y]);
      }
      this._updateCursor(true);
      break;
    case 'down':
      this.cpos.y++;
      this._updateCursor(true);
      break;
  }
  
  if (this.options.keys && key.ctrl && key.name === 'e') {
    return this.readEditor();
  }

  // TODO: Optimize typing by writing directly
  // to the screen and screen buffer here.
  if (key.name === 'escape') {
    done(null, null);
  } else if (key.name === 'backspace') {
    if (this.value.length) {
      if (this.screen.fullUnicode) {
        if (unicode.isSurrogate(this.value, this.value.length - 2)) {
        // || unicode.isCombining(this.value, this.value.length - 1)) {
          this.value = this.value.slice(0, -2);
        } else {
          this.value = this.value.slice(0, -1);
        }
      } else {
        if (!this.cursorControl || 
             this.cpos.x==-1 ||
             (this.cpos.x==this._clines[this.cpos.y].length &&
              this.cpos.y==this._clines.length-1))
          // Delete last char of last line
          this.value = this.value.slice(0, -1);
        else {
          // Delete char at current cursor position
          vpos=this.getLinearPos(this.value,this.cpos.y);
          vpos+= this.cpos.x;
          this.value = this.value.substr(0,vpos-1)+
                       this.value.substr(vpos,1000000);
        }
      }
      if (this.cpos.x>0) this.cpos.x--;
      else {this.cpos.y--;this.cpos.x=-1};
    }
  } else if (ch) {
    if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
      if (!this.cursorControl || 
           this.cpos.x==-1 ||
           (this.cpos.x==this._clines[this.cpos.y].length &&
            this.cpos.y==this._clines.length-1))
        // Append new char at end of (last) line
        this.value += ch;
      else {
        // Insert new char into line at current cursor position
        vpos=this.getLinearPos(this.value,this.cpos.y);
        vpos+= this.cpos.x;
        this.value = this.value.substr(0,vpos)+ch+
                     this.value.substr(vpos,1000000);
      }
      if (newline) {
        this.cpos.x=1;
        this.cpos.y++;
      } else  
        this.cpos.x++;
    }
  }

  if (this.value !== value) {
    this.screen.render();
  }
  
};

// Return start position of nth line in linear string 
Textarea.prototype.getLinearPos = function(v,line) {
  var cpos=0,len=v.length;
  while (cpos < len && line) {
    if (v.charAt(cpos)=='\n') line--;
    cpos++;
  }
  if (line==0) return cpos;
  else 0
}

Textarea.prototype._typeScroll = function() {
  // XXX Workaround
  var height = this.height - this.iheight;
  if (this._clines.length - this.childBase > height) {
    this.scroll(this._clines.length);
  }
};

Textarea.prototype.getValue = function() {
  return this.value;
};

Textarea.prototype.setValue = function(value) {
  if (value == null) {
    value = this.value;
  }
  if (this._value !== value) {
    this.value = value;
    this._value = value;
    this.setContent(this.value);
    this._typeScroll();
    this._updateCursor();
  }
};

Textarea.prototype.clearInput =
Textarea.prototype.clearValue = function() {
  return this.setValue('');
};

Textarea.prototype.submit = function() {
  if (!this.__listener) return;
  return this.__listener('\x1b', { name: 'escape' });
};

Textarea.prototype.cancel = function() {
  if (!this.__listener) return;
  return this.__listener('\x1b', { name: 'escape' });
};

Textarea.prototype.render = function() {
  this.setValue();
  return this._render();
};

Textarea.prototype.editor =
Textarea.prototype.setEditor =
Textarea.prototype.readEditor = function(callback) {
  var self = this;

  if (this._reading) {
    var _cb = this._callback
      , cb = callback;

    this._done('stop');

    callback = function(err, value) {
      if (_cb) _cb(err, value);
      if (cb) cb(err, value);
    };
  }

  if (!callback) {
    callback = function() {};
  }

  return this.screen.readEditor({ value: this.value }, function(err, value) {
    if (err) {
      if (err.message === 'Unsuccessful.') {
        self.screen.render();
        return self.readInput(callback);
      }
      self.screen.render();
      self.readInput(callback);
      return callback(err);
    }
    self.setValue(value);
    self.screen.render();
    return self.readInput(callback);
  });
};

/**
 * Expose
 */

module.exports = Textarea;
};
BundleModuleCode['term/widgets/textbox']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2018, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.5.2
 **
 **    $INFO:
 **
 **    textbox.js - textbox element for blessed
 **
 **     Special options: {wrap,multiline,screct,censor}
 **
 **  Usage:
  
     1. Editable
     
     var obj = blessed.textbox({
      label: options.label||'My Input',
      value: options.value||'default value',
      fg: 'blue',
      bg: 'default',
      barBg: 'default',
      barFg: 'blue',
      width: options.width||(self.screen.width-(options.left*2||2)),
      height: 3,
      left: options.left,
      right : options.right,
      top: options.top||0,
      keys: true,
      vi: true,
      mouse: true,
      inputOnFocus: true,
      focus:true,
      //draggable:true,
      border: {
        type: 'line'
      },
      style: {
        fg:'blue',
        focus : {
          border: {
            fg: 'red'
          }      
        }
      }
    });
    
    2. Non editable

    var obj = blessed.textbox({
      top: options.top||1,
      left: options.left||1,
      width: options.width,
      height: options.height||3,
      label: options.label,
      focus:false,
      //draggable:true,
      border: {
        type: 'line'
      },
      style: {
        fg:'blue'
      }
    });
    
    screen.append(obj);
    
    obj.setValue('Some Text')
 **
 **
 ** New options: wrap:boolean
 **
 **    $ENDOFINFO
 */
var options = {
  version:'1.5.2'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Textarea = Require('term/widgets/textarea');

/**
 * Textbox
 */

function Textbox(options) {
  if (!instanceOf(this,Node)) {
    return new Textbox(options);
  }

  options = options || {};

  options.scrollable = options.scrollable||false;

  Textarea.call(this, options);

  // Special options
  this.secret = options.secret;
  this.censor = options.censor;
  this.wrap   = options.wrap;
  this.multiline = options.multiline;
}

//Textbox.prototype.__proto__ = Textarea.prototype;
inheritPrototype(Textbox,Textarea);

Textbox.prototype.type = 'textbox';

Textbox.prototype.__olistener = Textbox.prototype._listener;
Textbox.prototype._listener = function(ch, key) {
  if (!this.multiline && key.name === 'enter') {
    this._done(null, this.value);
    return;
  }
  return this.__olistener(ch, key);
};

Textbox.prototype.setValue = function(value) {
  var visible, val, i, line, sep;
  if (value == null) {
    value = this.value;
  }
  if (this._value !== value) {
    if (!this.multiline) {
      value = value.replace(/\n/g, '');
    }
    this.value = value;
    this._value = value;
    if (this.secret) {
      this.setContent('');
    } else if (this.censor) {
      this.setContent(Array(this.value.length + 1).join('*'));
    } else if (this.wrap && this.value.length > (this.width - this.iwidth - 1)) {
      line='';i=0, sep='';
      visible=this.width - this.iwidth - 1;
      val=this.value;
      while (val.length>0) {
        line = line + val.substr(0,visible);
        val = val.substr(visible,val.length-visible);  
        sep='\n';
      }
      this.setContent(line);    
    } else if (this.multiline) {
      val = this.value.replace(/\t/g, this.screen.tabc);
      this.setContent(val);
    } else {
      visible = -(this.width - this.iwidth - 1);
      val = this.value.replace(/\t/g, this.screen.tabc);
      this.setContent(val.slice(visible));
    }
    this._updateCursor();
  }
};
// setValue + update screen IM
Textbox.prototype.update = function(value) {
  this.setValue(value);
  this.screen.render();
}

Textbox.prototype.submit = function() {
  if (!this.__listener) return;
  return this.__listener('\r', { name: 'enter' });
};

/**
 * Expose
 */

module.exports = Textbox;
};
BundleModuleCode['term/widgets/progressbar']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    progressbar.js - progress bar element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Input = Require('term/widgets/input');

/**
 * ProgressBar
 */

function ProgressBar(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new ProgressBar(options);
  }

  options = options || {};

  Input.call(this, options);

  this.filled = options.filled || 0;
  if (typeof this.filled === 'string') {
    this.filled = +this.filled.slice(0, -1);
  }
  this.value = this.filled;

  this.pch = options.pch || ' ';

  // XXX Workaround that predates the usage of `el.ch`.
  if (options.ch) {
    this.pch = options.ch;
    this.ch = ' ';
  }
  if (options.bch) {
    this.ch = options.bch;
  }

  if (!this.style.bar) {
    this.style.bar = {};
    this.style.bar.fg = options.barFg;
    this.style.bar.bg = options.barBg;
  }

  this.orientation = options.orientation || 'horizontal';

  if (options.keys) {
    this.on('keypress', function(ch, key) {
      var back, forward;
      if (self.orientation === 'horizontal') {
        back = ['left', 'h'];
        forward = ['right', 'l'];
      } else if (self.orientation === 'vertical') {
        back = ['down', 'j'];
        forward = ['up', 'k'];
      }
      if (key.name === back[0] || (options.vi && key.name === back[1])) {
        self.progress(-5);
        self.screen.render();
        return;
      }
      if (key.name === forward[0] || (options.vi && key.name === forward[1])) {
        self.progress(5);
        self.screen.render();
        return;
      }
    });
  }

  if (options.mouse) {
    this.on('click', function(data) {
      var x, y, m, p;
      if (!self.lpos) return;
      if (self.orientation === 'horizontal') {
        x = data.x - self.lpos.xi;
        m = (self.lpos.xl - self.lpos.xi) - self.iwidth;
        p = x / m * 100 | 0;
      } else if (self.orientation === 'vertical') {
        y = data.y - self.lpos.yi;
        m = (self.lpos.yl - self.lpos.yi) - self.iheight;
        p = y / m * 100 | 0;
      }
      self.setProgress(p);
    });
  }
}

//ProgressBar.prototype.__proto__ = Input.prototype;
inheritPrototype(ProgressBar,Input);

ProgressBar.prototype.type = 'progress-bar';

ProgressBar.prototype.render = function() {
  var ret = this._render();
  if (!ret) return;

  var xi = ret.xi
    , xl = ret.xl
    , yi = ret.yi
    , yl = ret.yl
    , dattr;

  if (this.border) xi++, yi++, xl--, yl--;

  if (this.orientation === 'horizontal') {
    xl = xi + ((xl - xi) * (this.filled / 100)) | 0;
  } else if (this.orientation === 'vertical') {
    yi = yi + ((yl - yi) - (((yl - yi) * (this.filled / 100)) | 0));
  }

  dattr = this.sattr(this.style.bar);

  this.screen.fillRegion(dattr, this.pch, xi, xl, yi, yl);

  if (this.content) {
    var line = this.screen.lines[yi];
    for (var i = 0; i < this.content.length; i++) {
      line[xi + i][1] = this.content[i];
    }
    line.dirty = true;
  }

  return ret;
};

ProgressBar.prototype.progress = function(filled) {
  this.filled += filled;
  if (this.filled < 0) this.filled = 0;
  else if (this.filled > 100) this.filled = 100;
  if (this.filled === 100) {
    this.emit('complete');
  }
  this.value = this.filled;
};

ProgressBar.prototype.setProgress = function(filled) {
  this.filled = 0;
  this.progress(filled);
};

ProgressBar.prototype.reset = function() {
  this.emit('reset');
  this.filled = 0;
  this.value = this.filled;
};

/**
 * Expose
 */

module.exports = ProgressBar;
};
BundleModuleCode['term/widgets/filemanager']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2018, Christopher Jeffrey and contributors
 **    $VERSION:     1.4.2
 **
 **    $INFO:
 *
 * filemanager.js - file manager element for blessed
 *  
 * Events: 'ioerror','cd','file'
 *
 * New options: okayButton, cancelButton, autohide, select (select emits file event),
 *              noshow, arrows: {up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}},
 *              box:{bg,border}, input:{fg,bg,border}
 *
 **    $ENDOFINFO
 */

var options = {
  version:'1.4.2'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var path = Require('path')
  , fs = Require('fs');


var Node = Require('term/widgets/node');
var List = Require('term/widgets/list');
var Button = Require('term/widgets/button');
var Helpers = Require('term/helpers');
var Box = Require('term/widgets/box');
var TextBox = Require('term/widgets/textbox');
var Arrows = Require('term/widgets/arrows');
var Screen = Require('term/widgets/screen');

/**
 * FileManager
 */

function FileManager(options) {
  var self = this,
      bbox,
      off1=0,
      off2=0,
      arrows=options.arrows;

  if (!instanceOf(this,Node)) {
    return new FileManager(options);
  }

  options = options || {};
  options.parseTags = true;
  options.mouse = true;
  options.arrows=_;   // optional arrows are handled here, not in list

  if (options.parent == Screen.global) {
    // Screen overlay; adjust top/height settings
    bbox=Helpers.bbox(Screen.global,options);
    if (options.box) bbox.top += 1,bbox.height -= 2,bbox.width -= 4,bbox.left += 2;
    if (options.input) bbox.height -= 3;
    if (options.cancelButton||options.okayButton) bbox.height -= 1;
    if (arrows) bbox.width -= 4,bbox.left += 2;
    options.top=bbox.top;
    options.left=bbox.left;
    options.height=bbox.height;
    options.width=bbox.width;
  }
      
  // options.label = ' {blue-fg}%path{/blue-fg} ';
  List.call(this, options);

  options.arrows=arrows;
  
  this.cwd = options.cwd || process.cwd();
  this.file = this.cwd;
  this.value = this.cwd;
  this.noshow = options.noshow;
  
  if (options.parent == this.screen) {
    // Collect clickable elements of this widget
    this._clickable=this.screen.clickable;
    this.screen.clickable=[];
    
    // compute for button positions
    bbox=Helpers.bbox(this.screen,options);
    if (options.cancelButton||options.okayButton) off1=2;
    if (options.input) off2=3;
    if (options.box) 
      this._.box = new Box({
        top:bbox.top-2,
        width:bbox.width+8,
        left:bbox.left-4,
        height:bbox.height+3+off1+off2,
        hidden:options.hidden,
        border:options.box.border,
        style:{
          label:options.label,
          fg:options.box.fg,
          bg:options.box.bg||'white'
        }
      });
    if (this._.box) this.screen.append(this._.box);

    if (options.input) {
      this._.input =  new TextBox({
        screen: this.screen,
        top: bbox.top+bbox.height+(options.box?1:0)-1,
        height: options.input.border&&options.input.border.type=='line'?3:1,
        width: bbox.width,
        left: bbox.left,
        keys: options.input.mutable?true:undefined,
        vi: options.input.mutable?true:undefined,
        mouse: options.input.mutable?true:undefined,
        inputOnFocus: options.input.mutable?true:undefined,
        value: options.input.value||'<input>',
        hidden:options.hidden,
        border: options.input.border,
        style: {
          fg:options.input.fg||'black',
          bg:options.input.bg||'white',
          bold:true
        }
      });
      this.screen.append(this._.input);
    }
    
    if (options.okayButton) {
      this._.okay = new Button({
        screen: this.screen,
        top: bbox.top+bbox.height+(options.box?1:0)+off2,
        height: 1,
        left: bbox.left+1,
        width: 10,
        content: options.okayButton,
        align: 'center',
        style: {
          fg:'white',
          bg: 'blue',
          bold:true,
        },
        autoFocus: false,
        hidden:options.hidden,
        mouse: true
      });
      this._.okay.on('press',function () { 
        var item=self.items[self.selected],
            value = self._.input?
                    self._.input.getValue():
                    item.content.replace(/\{[^{}]+\}/g, '').replace(/@$/, ''),
            file=path.resolve(self.cwd, value);
        self.emit('file', file);
        self.hide(); 
      });
      this.screen.append(this._.okay);
    }
    if (options.cancelButton) {
      this._.cancel = new Button({
        screen: this.screen,
        top: bbox.top+bbox.height+(options.box?1:0)+off2,
        height: 1,
        left: bbox.left+bbox.width-10-1,
        width: 10,
        content: options.cancelButton,
        align: 'center',
        style: {
          fg:'white',
          bg: 'red',
          bold:true,
        },
        autoFocus: false,
        hidden:options.hidden,
        mouse: true
      });
      this._.cancel.on('press',function () { self.hide(); });
      this.screen.append(this._.cancel);
    }
    if (options.arrows) 
      Arrows(
        self,
        options,
        function () {self.emit('element wheelup')},
        function () {self.emit('element wheeldown')},
        true
      );
    this._hide=this.hide;
    this.hide = function() {
      self._hide();
      if (self._.box) self._.box.hide();
      if (self._.input) self._.input.hide();
      if (self._.okay) self._.okay.hide();
      if (self._.cancel) self._.cancel.hide();
      if (self._.up) self._.up.hide();
      if (self._.down) self._.down.hide();
      self.screen.render();
      // restore all clickable elements
      self.screen.clickable=self._clickable;
    } 
    this._show = this.show;
    this.show = function() {
      // save all screen clickable elements; enable only this clickables
      self._clickable=self.screen.clickable;
      self.screen.clickable=self.clickable;
      self._show();
      if (self._.box) self._.box.show();
      if (self._.input) self._.input.show();
      if (self._.okay) self._.okay.show();
      if (self._.cancel) self._.cancel.show();
      if (self._.up) self._.up.show();
      if (self._.down) self._.down.show();
      self.screen.render();
    } 
    
    // Save clickable elements of this widget; restore screen
    this.clickable=this.screen.clickable;
    this.screen.clickable=this._clickable;
  }
  if (options.label && ~options.label.indexOf('%path')) {
    this._label.setContent(options.label.replace('%path', this.cwd));
  }
  if (this._.input) 
    this.on('selected', function(item) {
      var value = item.content.replace(/\{[^{}]+\}/g, '').replace(/@$/, '');
      if (value.indexOf('/') != -1) value='';
      self._.input.setValue(value);
      self._.input.update();
    });
  
 
  this.on('select', function(item) {
    var value = item.content.replace(/\{[^{}]+\}/g, '').replace(/@$/, '')
      , file = path.resolve(self.cwd, value);
    return fs.stat(file, function(err, stat) {
      var _cwd=self.cwd;
      if (err) {
        return self.emit('ioerror', err, file);
      }
      self.file = file;
      self.value = file;
      if (stat.isDirectory()) {
        self.cwd = file;
        self.refresh(undefined,function (err) {
          if (err) self.cwd=_cwd;
          else if (options.label && ~options.label.indexOf('%path')) {
            self._label.setContent(options.label.replace('%path', self.cwd));
            self.emit('cd', file, self.cwd);
            self.screen.render();
          }
        });
      } else {
        if (self.options.select) self.emit('file', file);
        if (self.options.select && self.options.autohide) self.hide();
      }
    });
  });


}

//FileManager.prototype.__proto__ = List.prototype;
inheritPrototype(FileManager,List);

FileManager.prototype.type = 'file-manager'; 

FileManager.prototype.refresh = function(cwd, callback) {
  var self = this;

  if (cwd) this.cwd = cwd;
  else cwd = this.cwd;

  return fs.readdir(cwd, function(err, list) {
    if (err && err.code === 'ENOENT') {
      self.cwd = cwd !== process.env.HOME
        ? process.env.HOME
        : '/';
      return self.refresh(undefined,callback);
    }

    if (err) {
      if (callback) return callback(err);
      return self.emit('ioerror', err, cwd);
    }
    
    var dirs = []
      , files = [];

    list.unshift('..');

    list.forEach(function(name) {
      var f = path.resolve(cwd, name)
        , stat;

      try {
        stat = fs.lstatSync(f);
      } catch (e) {
        ;
      }

      if ((stat && stat.isDirectory()) || name === '..') {
        dirs.push({
          name: name,
          text: '{light-blue-fg}' + name + '{/light-blue-fg}/',
          dir: true
        });
      } else if (stat && stat.isSymbolicLink()) {
        files.push({
          name: name,
          text: '{light-cyan-fg}' + name + '{/light-cyan-fg}@',
          dir: false
        });
      } else {
        files.push({
          name: name,
          text: name,
          dir: false
        });
      }
    });

    dirs = Helpers.asort(dirs);
    files = Helpers.asort(files);

    list = dirs.concat(files).map(function(data) {
      return data.text;
    });

    self.setItems(list);
    self.select(0);
    self.screen.render();

    self.emit('refresh');

    if (callback) callback();
  });

};

FileManager.prototype.pick = function(cwd, callback) {
  if (!callback) {
    callback = cwd;
    cwd = null;
  }
  var self = this
    , focused = this.screen.focused === this
    , hidden = this.hidden
    , onfile
    , oncancel;

  function resume() {
    self.removeListener('file', onfile);
    self.removeListener('cancel', oncancel);
    if (hidden) {
      self.hide();
    }
    if (!focused) {
      self.screen.restoreFocus();
    }
    self.screen.render();
  }

  this.on('file', onfile = function(file) {
    resume();
    return callback(null, file);
  });

  this.on('cancel', oncancel = function() {
    resume();
    return callback();
  });

  this.refresh(cwd, function(err) {
    if (err) return callback(err);

    if (hidden) {
      self.show();
    }

    if (!focused) {
      self.screen.saveFocus();
      self.focus();
    }

    self.screen.render();
  });
};

FileManager.prototype.reset = function(cwd, callback) {
  if (!callback) {
    callback = cwd;
    cwd = null;
  }
  this.cwd = cwd || this.options.cwd;
  this.refresh(callback);
};

/**
 * Expose
 */

module.exports = FileManager;
};
BundleModuleCode['term/widgets/checkbox']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.3.4
 **
 **    $INFO:
 **
 **    checkbox.js - checkbox element for blessed
 **
 **  Usage:
 **
 **   var obj = blessed.checkbox({
 **     checked: options.value||false,  
 **     left: options.left,
 **     right : options.right,
 **     top: options.top||0,
 **     mouse: true,
 **     inputOnFocus: true,
 **     height: 1,
 **     text:options.text||'empty'
 **   });
 **   screen.append(obj);
 **   obj.on('check',function () {});
 **   
 ** Events: 
 **   'check' 'uncheck'
 **   
 **     
 **    $ENDOFINFO
 */
  
/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Input = Require('term/widgets/input');

/**
 * Checkbox
 */

function Checkbox(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Checkbox(options);
  }

  options = options || {};

  Input.call(this, options);

  this.text = options.content || options.text || '';
  this.checked = this.value = options.checked || false;

  this.on('keypress', function(ch, key) {
    if (key.name === 'enter' || key.name === 'space') {
      self.toggle();
      self.screen.render();
    }
  });

  if (options.mouse) {
    this.on('click', function() {
      self.toggle();
      self.screen.render();
    });
  }

  this.on('focus', function() {
    var lpos = self.lpos;
    if (!lpos) return;
    self.screen.program.lsaveCursor('checkbox');
    self.screen.program.cup(lpos.yi, lpos.xi + 1);
    self.screen.program.showCursor();
  });

  this.on('blur', function() {
    self.screen.program.lrestoreCursor('checkbox', true);
  });
}

//Checkbox.prototype.__proto__ = Input.prototype;
inheritPrototype(Checkbox,Input);

Checkbox.prototype.type = 'checkbox';

Checkbox.prototype.render = function() {
  this.clearPos(true);
  this.setContent('[' + (this.checked ? 'x' : ' ') + '] ' + this.text, true);
  return this._render();
};

Checkbox.prototype.check = function() {
  if (this.checked) return;
  this.checked = this.value = true;
  this.emit('check',this);
};

Checkbox.prototype.uncheck = function() {
  if (!this.checked) return;
  this.checked = this.value = false;
  this.emit('uncheck',this);
};

Checkbox.prototype.toggle = function() {
  return this.checked
    ? this.uncheck()
    : this.check();
};

/**
 * Expose
 */

module.exports = Checkbox;
};
BundleModuleCode['term/widgets/radioset']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    radioset.js - radio set element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * RadioSet
 */

function RadioSet(options) {
  if (!instanceOf(this,Node)) {
    return new RadioSet(options);
  }
  options = options || {};
  // Possibly inherit parent's style.
  // options.style = this.parent.style;
  Box.call(this, options);
}

//RadioSet.prototype.__proto__ = Box.prototype;
inheritPrototype(RadioSet,Box);

RadioSet.prototype.type = 'radio-set';

/**
 * Expose
 */

module.exports = RadioSet;
};
BundleModuleCode['term/widgets/radiobutton']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.2
 **
 **    $INFO:
 **
 **    radiobutton.js - radio button element for blessed
 **
 **     Added:
 **       - Simplified group management (using options.group identifier instead radioset parent)
 **
 **  Usage:
 
   var obj = blessed.radiobutton({
      checked: options.value||false,  
      left: options.left,
      right : options.right,
      top: options.top||0,
      group:options.group,
      mouse: true,
      inputOnFocus: true,
      height: 1,
      text:options.text||'empty'
    });
    screen.append(obj);
 
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Checkbox = Require('term/widgets/checkbox');

/**
 * RadioButton
 */

function RadioButton(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new RadioButton(options);
  }

  options = options || {};
  this.group=options.group;
  Checkbox.call(this, options);

  this.on('check', function() {
    var el = self,
        group=self.group;
    while (el = el.parent) {
      if (el.type === 'radio-set'
          || el.type === 'form') break;
    }
    el = el || self.parent;
    el.forDescendants(function(el) {
      if (el.type !== 'radio-button' || el === self || el.group!=group) {
        return;
      }
      el.uncheck();
    });
  });
}

//RadioButton.prototype.__proto__ = Checkbox.prototype;
inheritPrototype(RadioButton,Checkbox);

RadioButton.prototype.type = 'radio-button';

RadioButton.prototype.render = function() {
  this.clearPos(true);
  this.setContent('(' + (this.checked ? '*' : ' ') + ') ' + this.text, true);
  return this._render();
};

RadioButton.prototype.toggle = RadioButton.prototype.check;

/**
 * Expose
 */

module.exports = RadioButton;
};
BundleModuleCode['term/widgets/prompt']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2016-2017)
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    prompt.js - prompt element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Button = Require('term/widgets/button');
var Textbox = Require('term/widgets/textbox');

/**
 * Prompt
 */

function Prompt(options) {
  if (!instanceOf(this, Node)) {
    return new Prompt(options);
  }

  options = options || {};

  options.hidden = true;

  Box.call(this, options);

  this._.input = new Textbox({
    parent: this,
    top: 3,
    height: 1,
    left: 2,
    right: 2,
    bg: 'black'
  });

  this._.okay = new Button({
    parent: this,
    top: 5,
    height: 1,
    left: 2,
    width: 6,
    content: 'Okay',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });

  this._.cancel = new Button({
    parent: this,
    top: 5,
    height: 1,
    shrink: true,
    left: 10,
    width: 8,
    content: 'Cancel',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });
}

//Prompt.prototype.__proto__ = Box.prototype;
inheritPrototype(Prompt,Box);

Prompt.prototype.type = 'prompt';

Prompt.prototype.input =
Prompt.prototype.setInput =
Prompt.prototype.readInput = function(text, value, callback) {
  var self = this;
  var okay, cancel;

  if (!callback) {
    callback = value;
    value = '';
  }

  // Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.show();
  this.setContent(' ' + text);

  this._.input.value = value;

  this.screen.saveFocus();

  this._.okay.on('press', okay = function() {
    self._.input.submit();
  });

  this._.cancel.on('press', cancel = function() {
    self._.input.cancel();
  });

  this._.input.readInput(function(err, data) {
    self.hide();
    self.screen.restoreFocus();
    self._.okay.removeListener('press', okay);
    self._.cancel.removeListener('press', cancel);
    return callback(err, data);
  });

  this.screen.render();
};

/**
 * Expose
 */

module.exports = Prompt;
};
BundleModuleCode['term/widgets/question']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (C) 2006-2017
 **    $REVESIO:     1.3.5
 **
 **    $INFO:
 **
 **     question.js - question element for blessed (overlay)
 **
 **  Usage:

    var width=options.width,height=options.height;
    if (Comp.obj.isString(options.width)) {
      // relative value in %!
      width=Comp.pervasives.int_of_string(options.width);
      width=int(self.screen.width*width/100);
    }
    if (Comp.obj.isString(options.height)) {
      // relative value in %!
      height=Comp.pervasives.int_of_string(options.height);
      height=int(self.screen.height*height/100);
    }
    var obj = blessed.Question({
      width: width,
      left: (options.center?int(self.screen.width/2-width/2):options.left),
      right : options.right,
      top: options.top||(options.center?int(self.screen.height/2-height/2):0),
      height: height,
      okButton     : options.okButton||'Okay',
      cancelButton : options.cancelButton||'Cancel',
      style: {
        bg:'red',
        fg:'white',
        bold:true
      }  
    });
    screen.append(obj);

    ...
    var dia = dialog({width:'50%',height:6,center:true,
              okButton     : 'Okay',
              cancelButton : 'Cancel'
      });
    dia.ask('You need to start the network service first!',function (answer) {});

 
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Button = Require('term/widgets/button');

/**
 * Question
 */

function Question(options) {
  if (!instanceOf(this,Node)) {
    return new Question(options);
  }

  options = options || {};
  options.hidden = true;
  if (!options.height || options.height<5) options.height=5;

  Box.call(this, options);

  // Collect clickable elements of this widget
  this._clickable=this.screen.clickable;
  this.screen.clickable=[];

  this._.okay = new Button({
    screen: this.screen,
    parent: this,
    top: options.height?(options.height-2):3,
    height: 1,
    left: 2,
    width: 10,
    content: options.okButton||'Okay',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });

  if (options.cancelButton) 
    this._.cancel = new Button({
      screen: this.screen,
      parent: this,
      top: options.height?(options.height-2):3,
      height: 1,
      left: options.width?(options.width-12):10,
      width: 10,
      content: options.cancelButton,
      align: 'center',
      bg: 'black',
      hoverBg: 'blue',
      autoFocus: false,
      mouse: true
    });
  // Save clickable elements of this widget; restore screen
  this.clickable=this.screen.clickable;
  this.screen.clickable=this._clickable;
}

//Question.prototype.__proto__ = Box.prototype;
inheritPrototype(Question,Box);

Question.prototype.type = 'question';

Question.prototype.ask = function(text, callback) {
  var self = this,
      press, okay, cancel,
      off,room;
  if (!callback) callback=function () {};
  
  // Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);
  
  // save all clickable elements; enable only this clickables
  this._clickable=this.screen.clickable;
  this.screen.clickable=this.clickable;
  this.show();
  if (text.length > this.options.width-4) {
    var tokens=text.split(' '),
        curlen=0,temp='';
    for(var t in tokens) {
      var token=tokens[t];
      if (curlen+token.length+1 < this.options.width-4) {
        temp = temp+token+' ';
        curlen = curlen + token.length + 1;
      } else {
        if (token.length < this.options.width-4) {
          temp = temp + '\n' + token+ ' ';
          curlen = token.length + 1;
        } else {
          off=0,room=this.options.width-4-curlen;
          temp = temp+token.substr(0,room);
          off=room;
          room=this.options.width-4;
          while (off < token.length) {
            frag = token.substr(off,room);
            temp = temp + '\n' + frag;
            off += room;
            curlen = frag;
          }
          temp = temp + ' ';
          curlen++;
        }
      } 
    }
    text=temp;
  }
  this.setContent('\n  ' + text.replace(/\n/g,'\n  '));

  this.onScreenEvent('keypress', press = function(ch, key) {
    if (key.name === 'mouse') return;
    if (key.name !== 'enter'
        && key.name !== 'escape'
        && key.name !== 'q'
        && key.name !== 'y'
        && key.name !== 'n') {
      return;
    }
    done(null, key.name === 'enter' || key.name === 'y');
  });

  this._.okay.on('press', okay = function() {
    done(null, true);
  });

  if (this._.cancel) this._.cancel.on('press', cancel = function() {
    done(null, false);
  });

  this.screen.saveFocus();
  this.focus();

  function done(err, data) {
    self.hide();
    // restore all clickable elements
    self.screen.clickable=self._clickable;
    self.screen.restoreFocus();
    self.removeScreenEvent('keypress', press);
    self._.okay.removeListener('press', okay);
    if (self._.cancel) self._.cancel.removeListener('press', cancel);
    return callback(err, data);
  }

  this.screen.render();
};

/**
 * Expose
 */

module.exports = Question;
};
BundleModuleCode['term/widgets/message']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2016-2017)
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    message.js - message element for blessed
 **
 **    $ENDOFINFO
 */

var Comp = Require('com/compat');

/**
 * Modules
 */

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Message / Error
 */

function Message(options) {
  if (!instanceOf(this,Node)) {
    return new Message(options);
  }

  options = options || {};
  options.tags = true;

  Box.call(this, options);
}

//Message.prototype.__proto__ = Box.prototype;
inheritPrototype(Message,Box);

Message.prototype.type = 'message';

Message.prototype.log =
Message.prototype.display = function(text, time, callback) {
  var self = this;

  if (typeof time === 'function') {
    callback = time;
    time = null;
  }

  if (time == null) time = 3;

  // Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  if (this.scrollable) {
    this.screen.saveFocus();
    this.focus();
    this.scrollTo(0);
  }

  this.show();
  this.setContent(text);
  this.screen.render();

  if (time === Infinity || time === -1 || time === 0) {
    var end = function() {
      if (end.done) return;
      end.done = true;
      if (self.scrollable) {
        try {
          self.screen.restoreFocus();
        } catch (e) {
          ;
        }
      }
      self.hide();
      self.screen.render();
      if (callback) callback();
    };

    setTimeout(function() {
      self.onScreenEvent('keypress', function fn(ch, key) {
        if (key.name === 'mouse') return;
        if (self.scrollable) {
          if ((key.name === 'up' || (self.options.vi && key.name === 'k'))
            || (key.name === 'down' || (self.options.vi && key.name === 'j'))
            || (self.options.vi && key.name === 'u' && key.ctrl)
            || (self.options.vi && key.name === 'd' && key.ctrl)
            || (self.options.vi && key.name === 'b' && key.ctrl)
            || (self.options.vi && key.name === 'f' && key.ctrl)
            || (self.options.vi && key.name === 'g' && !key.shift)
            || (self.options.vi && key.name === 'g' && key.shift)) {
            return;
          }
        }
        if (self.options.ignoreKeys && ~self.options.ignoreKeys.indexOf(key.name)) {
          return;
        }
        self.removeScreenEvent('keypress', fn);
        end();
      });
      // XXX May be affected by new element.options.mouse option.
      if (!self.options.mouse) return;
      self.onScreenEvent('mouse', function fn(data) {
        if (data.action === 'mousemove') return;
        self.removeScreenEvent('mouse', fn);
        end();
      });
    }, 10);

    return;
  }

  setTimeout(function() {
    self.hide();
    self.screen.render();
    if (callback) callback();
  }, time * 1000);
};

Message.prototype.error = function(text, time, callback) {
  return this.display('{red-fg}Error: ' + text + '{/red-fg}', time, callback);
};

/**
 * Expose
 */

module.exports = Message;
};
BundleModuleCode['term/widgets/keyboard']=function (module,exports,global,process){
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
 **    $INITIAL:     sbosse (C) 2006-2018
 **    $REVESIO:     1.2.3
 **
 **    $INFO:
 **
 **     keyboard.js - software keyboard (overlay)
 **
 **  Options:
 **  typeof options = {
 **     top,left,width,height,
 **     button?={width,height} is button size,
 **     margin?={x,y} is button margin,
 **     compact?:boolean,
 **     delButton?:string,
 **     nlButton?:string,
 **     okayButton?:string,
 **     cancelButton?:string,
 **  }
 **
 **    $ENDOFINFO
 */
var options = {
  version:'1.2.3'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Button = Require('term/widgets/button');
var TextBox = Require('term/widgets/textbox');
var Helpers = Require('term/helpers');
/**
 * Keyboard
 */

function Keyboard(options) {
  var self=this,
      x,y,key,i=0,bbox;

  if (!instanceOf(this,Node)) {
    return new Keyboard(options);
  }
  
  options = options || {};
  options.hidden = true;
  if (!options.height || options.height<10) options.height=10;
  
  Box.call(this, options);
  
  // Collect clickable elements of this widget
  this._clickable=this.screen.clickable;
  this.screen.clickable=[];
  
  if (!options.button) options.button={width:3,height:2};
  if (!options.margin) options.margin={x:2,y:1};

  this.shift=false;
  this.group=0;
  this._.buttons=[];

  var Keys = [
    [
    'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o',
    'p','q','r','s','t','u','v','w','x','y','z'
    ],
    [
    '0','1','2','3','4','5','6','7','8','9','.','+','-','*',':',';'
    ],
    [
    '"','!','=','_','<','>','(',')','{','}','[',']','?','#','~',' '
    ]
  ];
  
  
  var keys = Comp.array.flatten(Keys);
  var complen=Keys[0].length+Keys[1].length;
  
  // compute for button positions
  bbox=Helpers.bbox(this.screen,options);

  if (options.okayButton) {
    this._.okay = new Button({
      screen: this.screen,
      parent: this,
      top: bbox.height-3,
      height: 1,
      left: 1,
      width: Math.max(6,options.okayButton.length+2),
      content: options.okayButton,
      align: 'center',
      autoFocus: false,
      mouse: true,
      style: {
        bold:true,
        bg:'green',
        fg:'white'
      }
    });
    this._.okay.on('press',function () { self.hide(); if (self._.callback) self._.callback(self._.input.getValue())});
  }
  if (options.cancelButton) {
    this._.cancel = new Button({
      screen: this.screen,
      parent: this,
      top: bbox.height-3,
      height: 1,
      right: 1,
      width: options.cancelButton.length+2,
      content: options.cancelButton,
      align: 'center',
      autoFocus: false,
      mouse: true,
      style: {
        bold:true,
        bg:'red',
        fg:'white'
      }
    });
    this._.cancel.on('press',function () { self.hide(); });
  }
  this._.shift = new Button({
      screen: this.screen,
      parent: this,
      top: bbox.height-3,
      height: 1,
      right: int(bbox.width/2)+(options.compact?1:int(options.margin.x)),
      width: (options.shiftButton && options.shiftButton.length+2)||6,
      content: options.shiftButton||'Shft',
      align: 'center',
      autoFocus: false,
      mouse: true
    });
  this._.shift.on('press',function () { 
      self.shift=~self.shift;
      for(var i=0;i<26;i++) {
        self._.buttons[i].setContent(self.shift?Keys[0][i].toUpperCase():Keys[0][i]);
      }
      if (options.compact && self.shift) for(i in Keys[1]) self._.buttons[26+Number(i)].setContent(Keys[2][i]);
      if (options.compact && !self.shift) for(i in Keys[1]) self._.buttons[26+Number(i)].setContent(Keys[1][i]);
      if (self.shift && options.nlButton) self._.delete.setContent(options.nlButton);
      else if (!self.shift && options.nlButton) self._.delete.setContent(options.delButton||'DEL');
      self.screen.render();
  });
  this._.delete = new Button({
      screen: this.screen,
      parent: this,
      top: bbox.height-3,
      height: 1,
      left: int(bbox.width/2)+(options.compact?0:int(options.margin.x)),
      width: (options.delButton && options.delButton.length+2)||6,
      content: options.delButton||'DEL',
      align: 'center',
      autoFocus: false,
      mouse: true
  });
  this._.delete.on('press',function () {
    var line=self._.input.getValue();
    if (!self.shift || !options.nlButton) {
      // Delete last character
      self._.input.setValue(line.substring(0,line.length-1));
    } else if (self.shift && options.nlButton) {
      // Insert newline
      self._.input.setValue(line+'\n');
    }
    //self.screen.render();
    self._.input.update();
  });
  
  this._.input =  new TextBox({
      parent: this,
      value: options.value||'content',
      width: bbox.width-4,
      height: 1,
      left: 1,
      top: 0,
      style: {
        fg:(options.style.input&&options.style.input.fg)||'black',
        bg:(options.style.input&&options.style.input.bg)||'white',
        bold:true
      }
  });
  y=1+options.margin.y;
  
  i=0;
  while ((options.compact?i<complen:true) && keys[i] && y < (bbox.height-options.button.height-options.margin.y)-1) {
    x=options.margin.x;
    while ((options.compact?i<complen:true) && keys[i] && x < (bbox.width-options.button.width-options.margin.x)) {
      function make(i) {
        key = new Button ({
          screen: self.screen,
          parent: self,
          top: y,
          height: options.button.height,
          left: x,
          width: options.button.width,
          content: keys[i],
          align: 'center',
          autoFocus: false,
          mouse: true
        });
        self._.buttons.push(key);
        key.on('press',function () {self.emit('key',i)});
      }
      make(i);
      i++,x += (options.button.width+options.margin.x);
    }
    y += (options.button.height+options.margin.y);
  }
  // Save clickable elements of this widget; restore screen
  this.clickable=this.screen.clickable;
  this.screen.clickable=this._clickable;

  this._hide=this.hide;
  this.hide = function() {
    self._hide();
    self.screen.render();
    // restore all clickable elements
    self.screen.clickable=self._clickable;
  } 
  this._show = this.show;
  this.show = function() {
    // save all screen clickable elements; enable only this clickables
    self._clickable=self.screen.clickable;
    self.screen.clickable=self.clickable;
    self._show();
    self.screen.render();
  }
  this.on('key',function (index) {
    var line=self._.input.getValue(),ch;
    if (options.compact) {
      if (index<26) {
        ch=self.shift?Keys[0][index].toUpperCase():Keys[0][index];
      } else {
        ch=self.shift?Keys[2][index-26]:Keys[1][index-26];
      }
    } else {
      if (!self.shift || index>26) ch = keys[index];
      else ch = keys[index].toUpperCase();
    }
    line += ch;
    self._.input.setValue(line);
    //self.screen.render();
    self._.input.update();
  });
}

//Question.prototype.__proto__ = Box.prototype;
inheritPrototype(Keyboard,Box);

Keyboard.prototype.setCallback = function (cb) {
  this._.callback=cb
}

Keyboard.prototype.setValue = function (line) {
  this._.input.setValue(line);
  this._.input.update();
}

Keyboard.prototype.type = 'keyboard';
/**
 * Expose
 */

module.exports = Keyboard;
};
BundleModuleCode['term/widgets/loading']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    loading.js - loading element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Text = Require('term/widgets/text');

/**
 * Loading
 */

function Loading(options) {
  if (!instanceOf(this,Node)) {
    return new Loading(options);
  }

  options = options || {};

  Box.call(this, options);

  this._.icon = new Text({
    parent: this,
    align: 'center',
    top: 2,
    left: 1,
    right: 1,
    height: 1,
    content: '|'
  });
}

//Loading.prototype.__proto__ = Box.prototype;
inheritPrototype(Loading,Box);

Loading.prototype.type = 'loading';

Loading.prototype.load = function(text) {
  var self = this;

  // XXX Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.show();
  this.setContent(text);

  if (this._.timer) {
    this.stop();
  }

  this.screen.lockKeys = true;

  this._.timer = setInterval(function() {
    if (self._.icon.content === '|') {
      self._.icon.setContent('/');
    } else if (self._.icon.content === '/') {
      self._.icon.setContent('-');
    } else if (self._.icon.content === '-') {
      self._.icon.setContent('\\');
    } else if (self._.icon.content === '\\') {
      self._.icon.setContent('|');
    }
    self.screen.render();
  }, 200);
};

Loading.prototype.stop = function() {
  this.screen.lockKeys = false;
  this.hide();
  if (this._.timer) {
    clearInterval(this._.timer);
    delete this._.timer;
  }
  this.screen.render();
};

/**
 * Expose
 */

module.exports = Loading;
};
BundleModuleCode['term/widgets/listbar']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2016, Christopher Jeffrey and contributors
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 *
 * listbar.js - listbar element for blessed
 *
 **    $ENDOFINFO
 */
/**
 * Modules
 */
var Comp = Require('com/compat');

var helpers = Require('term/helpers');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Listbar / HorizontalList
 */

function Listbar(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Listbar(options);
  }

  options = options || {};

  this.items = [];
  this.ritems = [];
  this.commands = [];

  this.leftBase = 0;
  this.leftOffset = 0;

  this.mouse = options.mouse || false;

  Box.call(this, options);

  if (!this.style.selected) {
    this.style.selected = {};
  }

  if (!this.style.item) {
    this.style.item = {};
  }

  if (options.commands || options.items) {
    this.setItems(options.commands || options.items);
  }

  if (options.keys) {
    this.on('keypress', function(ch, key) {
      if (key.name === 'left'
          || (options.vi && key.name === 'h')
          || (key.shift && key.name === 'tab')) {
        self.moveLeft();
        self.screen.render();
        // Stop propagation if we're in a form.
        if (key.name === 'tab') return false;
        return;
      }
      if (key.name === 'right'
          || (options.vi && key.name === 'l')
          || key.name === 'tab') {
        self.moveRight();
        self.screen.render();
        // Stop propagation if we're in a form.
        if (key.name === 'tab') return false;
        return;
      }
      if (key.name === 'enter'
          || (options.vi && key.name === 'k' && !key.shift)) {
        self.emit('action', self.items[self.selected], self.selected);
        self.emit('select', self.items[self.selected], self.selected);
        var item = self.items[self.selected];
        if (item._.cmd.callback) {
          item._.cmd.callback();
        }
        self.screen.render();
        return;
      }
      if (key.name === 'escape' || (options.vi && key.name === 'q')) {
        self.emit('action');
        self.emit('cancel');
        return;
      }
    });
  }

  if (options.autoCommandKeys) {
    this.onScreenEvent('keypress', function(ch) {
      if (/^[0-9]$/.test(ch)) {
        var i = +ch - 1;
        if (!~i) i = 9;
        return self.selectTab(i);
      }
    });
  }

  this.on('focus', function() {
    self.select(self.selected);
  });
}

//Listbar.prototype.__proto__ = Box.prototype;
inheritPrototype(Listbar,Box);

Listbar.prototype.type = 'listbar';

Object.defineProperty(Listbar.prototype,'selected',{
  get: function () {return this.leftBase + this.leftOffset;}
});
/* Depricated
Listbar.prototype.__defineGetter__('selected', function() {
  return this.leftBase + this.leftOffset;
});
*/

Listbar.prototype.setItems = function(commands) {
  var self = this;

  if (!Array.isArray(commands)) {
    commands = Object.keys(commands).reduce(function(obj, key, i) {
      var cmd = commands[key]
        , cb;

      if (typeof cmd === 'function') {
        cb = cmd;
        cmd = { callback: cb };
      }

      if (cmd.text == null) cmd.text = key;
      if (cmd.prefix == null) cmd.prefix = ++i + '';

      if (cmd.text == null && cmd.callback) {
        cmd.text = cmd.callback.name;
      }

      obj.push(cmd);

      return obj;
    }, []);
  }

  this.items.forEach(function(el) {
    el.detach();
  });

  this.items = [];
  this.ritems = [];
  this.commands = [];

  commands.forEach(function(cmd) {
    self.add(cmd);
  });

  this.emit('set items');
};

Listbar.prototype.add =
Listbar.prototype.addItem =
Listbar.prototype.appendItem = function(item, callback) {
  var self = this
    , prev = this.items[this.items.length - 1]
    , drawn
    , cmd
    , title
    , len;

  if (!this.parent) {
    drawn = 0;
  } else {
    drawn = prev ? prev.aleft + prev.width : 0;
    if (!this.screen.autoPadding) {
      drawn += this.ileft;
    }
  }

  if (typeof item === 'object') {
    cmd = item;
    if (cmd.prefix == null) cmd.prefix = (this.items.length + 1) + '';
  }

  if (typeof item === 'string') {
    cmd = {
      prefix: (this.items.length + 1) + '',
      text: item,
      callback: callback
    };
  }

  if (typeof item === 'function') {
    cmd = {
      prefix: (this.items.length + 1) + '',
      text: item.name,
      callback: item
    };
  }

  if (cmd.keys && cmd.keys[0]) {
    cmd.prefix = cmd.keys[0];
  }

  var t = helpers.generateTags(this.style.prefix || { fg: 'lightblack' });

  title = (cmd.prefix != null ? t.open + cmd.prefix + t.close + ':' : '') + cmd.text;

  len = ((cmd.prefix != null ? cmd.prefix + ':' : '') + cmd.text).length;

  var options = {
    screen: this.screen,
    top: 0,
    left: drawn + 1,
    height: 1,
    content: title,
    width: len + 2,
    align: 'center',
    autoFocus: false,
    tags: true,
    mouse: true,
    style: helpers.merge({}, this.style.item),
    noOverflow: true
  };

  if (!this.screen.autoPadding) {
    options.top += this.itop;
    options.left += this.ileft;
  }

  ['bg', 'fg', 'bold', 'underline',
   'blink', 'inverse', 'invisible'].forEach(function(name) {
    options.style[name] = function() {
      var attr = self.items[self.selected] === el
        ? self.style.selected[name]
        : self.style.item[name];
      if (typeof attr === 'function') attr = attr(el);
      return attr;
    };
  });

  var el = new Box(options);

  this._[cmd.text] = el;
  cmd.element = el;
  el._.cmd = cmd;

  this.ritems.push(cmd.text);
  this.items.push(el);
  this.commands.push(cmd);
  this.append(el);

  if (cmd.callback) {
    if (cmd.keys) {
      this.screen.key(cmd.keys, function() {
        self.emit('action', el, self.selected);
        self.emit('select', el, self.selected);
        if (el._.cmd.callback) {
          el._.cmd.callback();
        }
        self.select(el);
        self.screen.render();
      });
    }
  }

  if (this.items.length === 1) {
    this.select(0);
  }

  // XXX May be affected by new element.options.mouse option.
  if (this.mouse) {
    el.on('click', function() {
      self.emit('action', el, self.selected);
      self.emit('select', el, self.selected);
      if (el._.cmd.callback) {
        el._.cmd.callback();
      }
      self.select(el);
      self.screen.render();
    });
  }

  this.emit('add item');
};

Listbar.prototype.render = function() {
  var self = this
    , drawn = 0;

  if (!this.screen.autoPadding) {
    drawn += this.ileft;
  }

  this.items.forEach(function(el, i) {
    if (i < self.leftBase) {
      el.hide();
    } else {
      el.rleft = drawn + 1;
      drawn += el.width + 2;
      el.show();
    }
  });

  return this._render();
};

Listbar.prototype.select = function(offset) {
  if (typeof offset !== 'number') {
    offset = this.items.indexOf(offset);
  }

  if (offset < 0) {
    offset = 0;
  } else if (offset >= this.items.length) {
    offset = this.items.length - 1;
  }

  if (!this.parent) {
    this.emit('select item', this.items[offset], offset);
    return;
  }

  var lpos = this._getCoords();
  if (!lpos) return;

  var self = this
    , width = (lpos.xl - lpos.xi) - this.iwidth
    , drawn = 0
    , visible = 0
    , el;

  el = this.items[offset];
  if (!el) return;

  this.items.forEach(function(el, i) {
    if (i < self.leftBase) return;

    var lpos = el._getCoords();
    if (!lpos) return;

    if (lpos.xl - lpos.xi <= 0) return;

    drawn += (lpos.xl - lpos.xi) + 2;

    if (drawn <= width) visible++;
  });

  var diff = offset - (this.leftBase + this.leftOffset);
  if (offset > this.leftBase + this.leftOffset) {
    if (offset > this.leftBase + visible - 1) {
      this.leftOffset = 0;
      this.leftBase = offset;
    } else {
      this.leftOffset += diff;
    }
  } else if (offset < this.leftBase + this.leftOffset) {
    diff = -diff;
    if (offset < this.leftBase) {
      this.leftOffset = 0;
      this.leftBase = offset;
    } else {
      this.leftOffset -= diff;
    }
  }

  // XXX Move `action` and `select` events here.
  this.emit('select item', el, offset);
};

Listbar.prototype.removeItem = function(child) {
  var i = typeof child !== 'number'
    ? this.items.indexOf(child)
    : child;

  if (~i && this.items[i]) {
    child = this.items.splice(i, 1)[0];
    this.ritems.splice(i, 1);
    this.commands.splice(i, 1);
    this.remove(child);
    if (i === this.selected) {
      this.select(i - 1);
    }
  }

  this.emit('remove item');
};

Listbar.prototype.move = function(offset) {
  this.select(this.selected + offset);
};

Listbar.prototype.moveLeft = function(offset) {
  this.move(-(offset || 1));
};

Listbar.prototype.moveRight = function(offset) {
  this.move(offset || 1);
};

Listbar.prototype.selectTab = function(index) {
  var item = this.items[index];
  if (item) {
    if (item._.cmd.callback) {
      item._.cmd.callback();
    }
    this.select(index);
    this.screen.render();
  }
  this.emit('select tab', item, index);
};

/**
 * Expose
 */

module.exports = Listbar;
};
BundleModuleCode['term/widgets/table']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    table.js - table element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Table
 */

function Table(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Table(options);
  }

  options = options || {};
  options.shrink = true;
  options.style = options.style || {};
  options.style.border = options.style.border || {};
  options.style.header = options.style.header || {};
  options.style.cell = options.style.cell || {};
  options.align = options.align || 'center';

  // Regular tables do not get custom height (this would
  // require extra padding). Maybe add in the future.
  delete options.height;

  Box.call(this, options);

  this.pad = options.pad != null
    ? options.pad
    : 2;

  this.setData(options.rows || options.data);

  this.on('attach', function() {
    self.setContent('');
    self.setData(self.rows);
  });

  this.on('resize', function() {
    self.setContent('');
    self.setData(self.rows);
    self.screen.render();
  });
}

//Table.prototype.__proto__ = Box.prototype;
inheritPrototype(Table,Box);

Table.prototype.type = 'table';

Table.prototype._calculateMaxes = function() {
  var self = this;
  var maxes = [];

  if (this.detached) return;

  this.rows = this.rows || [];

  this.rows.forEach(function(row) {
    row.forEach(function(cell, i) {
      var clen = self.strWidth(cell);
      if (!maxes[i] || maxes[i] < clen) {
        maxes[i] = clen;
      }
    });
  });

  var total = maxes.reduce(function(total, max) {
    return total + max;
  }, 0);
  total += maxes.length + 1;

  // XXX There might be an issue with resizing where on the first resize event
  // width appears to be less than total if it's a percentage or left/right
  // combination.
  if (this.width < total) {
    delete this.position.width;
  }

  if (this.position.width != null) {
    var missing = this.width - total;
    var w = missing / maxes.length | 0;
    var wr = missing % maxes.length;
    maxes = maxes.map(function(max, i) {
      if (i === maxes.length - 1) {
        return max + w + wr;
      }
      return max + w;
    });
  } else {
    maxes = maxes.map(function(max) {
      return max + self.pad;
    });
  }

  return this._maxes = maxes;
};

Table.prototype.setRows =
Table.prototype.setData = function(rows) {
  var self = this
    , text = ''
    , align = this.align;

  this.rows = rows || [];

  this._calculateMaxes();

  if (!this._maxes) return;

  this.rows.forEach(function(row, i) {
    var isFooter = i === self.rows.length - 1;
    row.forEach(function(cell, i) {
      var width = self._maxes[i];
      var clen = self.strWidth(cell);

      if (i !== 0) {
        text += ' ';
      }

      while (clen < width) {
        if (align === 'center') {
          cell = ' ' + cell + ' ';
          clen += 2;
        } else if (align === 'left') {
          cell = cell + ' ';
          clen += 1;
        } else if (align === 'right') {
          cell = ' ' + cell;
          clen += 1;
        }
      }

      if (clen > width) {
        if (align === 'center') {
          cell = cell.substring(1);
          clen--;
        } else if (align === 'left') {
          cell = cell.slice(0, -1);
          clen--;
        } else if (align === 'right') {
          cell = cell.substring(1);
          clen--;
        }
      }

      text += cell;
    });
    if (!isFooter) {
      text += '\n\n';
    }
  });

  delete this.align;
  this.setContent(text);
  this.align = align;
};

Table.prototype.render = function() {
  var self = this;

  var coords = this._render();
  if (!coords) return;

  this._calculateMaxes();

  if (!this._maxes) return coords;

  var lines = this.screen.lines
    , xi = coords.xi
    , yi = coords.yi
    , rx
    , ry
    , i;

  var dattr = this.sattr(this.style)
    , hattr = this.sattr(this.style.header)
    , cattr = this.sattr(this.style.cell)
    , battr = this.sattr(this.style.border);

  var width = coords.xl - coords.xi - this.iright
    , height = coords.yl - coords.yi - this.ibottom;

  // Apply attributes to header cells and cells.
  for (var y = this.itop; y < height; y++) {
    if (!lines[yi + y]) break;
    for (var x = this.ileft; x < width; x++) {
      if (!lines[yi + y][xi + x]) break;
      // Check to see if it's not the default attr. Allows for tags:
      if (lines[yi + y][xi + x][0] !== dattr) continue;
      if (y === this.itop) {
        lines[yi + y][xi + x][0] = hattr;
      } else {
        lines[yi + y][xi + x][0] = cattr;
      }
      lines[yi + y].dirty = true;
    }
  }

  if (!this.border || this.options.noCellBorders) return coords;

  // Draw border with correct angles.
  ry = 0;
  for (i = 0; i < self.rows.length + 1; i++) {
    if (!lines[yi + ry]) break;
    rx = 0;
    self._maxes.forEach(function(max, i) {
      rx += max;
      if (i === 0) {
        if (!lines[yi + ry][xi + 0]) return;
        // left side
        if (ry === 0) {
          // top
          lines[yi + ry][xi + 0][0] = battr;
          // lines[yi + ry][xi + 0][1] = '\u250c'; // '┌'
        } else if (ry / 2 === self.rows.length) {
          // bottom
          lines[yi + ry][xi + 0][0] = battr;
          // lines[yi + ry][xi + 0][1] = '\u2514'; // '└'
        } else {
          // middle
          lines[yi + ry][xi + 0][0] = battr;
          lines[yi + ry][xi + 0][1] = '\u251c'; // '├'
          // XXX If we alter iwidth and ileft for no borders - nothing should be written here
          if (!self.border.left) {
            lines[yi + ry][xi + 0][1] = '\u2500'; // '─'
          }
        }
        lines[yi + ry].dirty = true;
      } else if (i === self._maxes.length - 1) {
        if (!lines[yi + ry][xi + rx + 1]) return;
        // right side
        if (ry === 0) {
          // top
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
          // lines[yi + ry][xi + rx][1] = '\u2510'; // '┐'
        } else if (ry / 2 === self.rows.length) {
          // bottom
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
          // lines[yi + ry][xi + rx][1] = '\u2518'; // '┘'
        } else {
          // middle
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
          lines[yi + ry][xi + rx][1] = '\u2524'; // '┤'
          // XXX If we alter iwidth and iright for no borders - nothing should be written here
          if (!self.border.right) {
            lines[yi + ry][xi + rx][1] = '\u2500'; // '─'
          }
        }
        lines[yi + ry].dirty = true;
        return;
      }
      if (!lines[yi + ry][xi + rx + 1]) return;
      // center
      if (ry === 0) {
        // top
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
        lines[yi + ry][xi + rx][1] = '\u252c'; // '┬'
        // XXX If we alter iheight and itop for no borders - nothing should be written here
        if (!self.border.top) {
          lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        }
      } else if (ry / 2 === self.rows.length) {
        // bottom
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
        lines[yi + ry][xi + rx][1] = '\u2534'; // '┴'
        // XXX If we alter iheight and ibottom for no borders - nothing should be written here
        if (!self.border.bottom) {
          lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        }
      } else {
        // middle
        if (self.options.fillCellBorders) {
          var lbg = (ry <= 2 ? hattr : cattr) & 0x1ff;
          rx++;
          lines[yi + ry][xi + rx][0] = (battr & ~0x1ff) | lbg;
        } else {
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
        }
        lines[yi + ry][xi + rx][1] = '\u253c'; // '┼'
        // rx++;
      }
      lines[yi + ry].dirty = true;
    });
    ry += 2;
  }

  // Draw internal borders.
  for (ry = 1; ry < self.rows.length * 2; ry++) {
    if (!lines[yi + ry]) break;
    rx = 0;
    self._maxes.slice(0, -1).forEach(function(max) {
      rx += max;
      if (!lines[yi + ry][xi + rx + 1]) return;
      if (ry % 2 !== 0) {
        if (self.options.fillCellBorders) {
          var lbg = (ry <= 2 ? hattr : cattr) & 0x1ff;
          rx++;
          lines[yi + ry][xi + rx][0] = (battr & ~0x1ff) | lbg;
        } else {
          rx++;
          lines[yi + ry][xi + rx][0] = battr;
        }
        lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        lines[yi + ry].dirty = true;
      } else {
        rx++;
      }
    });
    rx = 1;
    self._maxes.forEach(function(max) {
      while (max--) {
        if (ry % 2 === 0) {
          if (!lines[yi + ry]) break;
          if (!lines[yi + ry][xi + rx + 1]) break;
          if (self.options.fillCellBorders) {
            var lbg = (ry <= 2 ? hattr : cattr) & 0x1ff;
            lines[yi + ry][xi + rx][0] = (battr & ~0x1ff) | lbg;
          } else {
            lines[yi + ry][xi + rx][0] = battr;
          }
          lines[yi + ry][xi + rx][1] = '\u2500'; // '─'
          lines[yi + ry].dirty = true;
        }
        rx++;
      }
      rx++;
    });
  }

  return coords;
};

/**
 * Expose
 */

module.exports = Table;
};
BundleModuleCode['term/widgets/listtable']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 *
 * listtable.js - list table element for blessed
 *
 **    $ENDOFINFO
 */
/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var List = Require('term/widgets/list');
var Table = Require('term/widgets/table');

/**
 * ListTable
 */

function ListTable(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new ListTable(options);
  }

  options = options || {};
  options.shrink = true;
  options.normalShrink = true;
  options.style = options.style || {};
  options.style.border = options.style.border || {};
  options.style.header = options.style.header || {};
  options.style.cell = options.style.cell || {};
  this.__align = options.align || 'center';
  delete options.align;

  options.style.selected = options.style.cell.selected;
  options.style.item = options.style.cell;

  List.call(this, options);

  this._header = new Box({
    parent: this,
    left: this.screen.autoPadding ? 0 : this.ileft,
    top: 0,
    width: 'shrink',
    height: 1,
    style: options.style.header,
    tags: options.parseTags || options.tags
  });

  this.on('scroll', function() {
    self._header.setFront();
    self._header.rtop = self.childBase;
    if (!self.screen.autoPadding) {
      self._header.rtop = self.childBase + (self.border ? 1 : 0);
    }
  });

  this.pad = options.pad != null
    ? options.pad
    : 2;

  this.setData(options.rows || options.data);

  this.on('attach', function() {
    self.setData(self.rows);
  });

  this.on('resize', function() {
    var selected = self.selected;
    self.setData(self.rows);
    self.select(selected);
    self.screen.render();
  });
}

//ListTable.prototype.__proto__ = List.prototype;
inheritPrototype(ListTable,List);

ListTable.prototype.type = 'list-table';

ListTable.prototype._calculateMaxes = Table.prototype._calculateMaxes;

ListTable.prototype.setRows =
ListTable.prototype.setData = function(rows) {
  var self = this
    , align = this.__align;

  if (this.visible && this.lpos) {
    this.clearPos();
  }

  this.clearItems();

  this.rows = rows || [];

  this._calculateMaxes();

  if (!this._maxes) return;

  this.addItem('');

  this.rows.forEach(function(row, i) {
    var isHeader = i === 0;
    var text = '';
    row.forEach(function(cell, i) {
      var width = self._maxes[i];
      var clen = self.strWidth(cell);

      if (i !== 0) {
        text += ' ';
      }

      while (clen < width) {
        if (align === 'center') {
          cell = ' ' + cell + ' ';
          clen += 2;
        } else if (align === 'left') {
          cell = cell + ' ';
          clen += 1;
        } else if (align === 'right') {
          cell = ' ' + cell;
          clen += 1;
        }
      }

      if (clen > width) {
        if (align === 'center') {
          cell = cell.substring(1);
          clen--;
        } else if (align === 'left') {
          cell = cell.slice(0, -1);
          clen--;
        } else if (align === 'right') {
          cell = cell.substring(1);
          clen--;
        }
      }

      text += cell;
    });
    if (isHeader) {
      self._header.setContent(text);
    } else {
      self.addItem(text);
    }
  });

  this._header.setFront();

  this.select(0);
};

ListTable.prototype._select = ListTable.prototype.select;
ListTable.prototype.select = function(i) {
  if (i === 0) {
    i = 1;
  }
  if (i <= this.childBase) {
    this.setScroll(this.childBase - 1);
  }
  return this._select(i);
};

ListTable.prototype.render = function() {
  var self = this;

  var coords = this._render();
  if (!coords) return;

  this._calculateMaxes();

  if (!this._maxes) return coords;

  var lines = this.screen.lines
    , xi = coords.xi
    , yi = coords.yi
    , rx
    , ry
    , i;

  var battr = this.sattr(this.style.border);

  var height = coords.yl - coords.yi - this.ibottom;

  if (!this.border || this.options.noCellBorders) return coords;

  // Draw border with correct angles.
  ry = 0;
  for (i = 0; i < height + 1; i++) {
    if (!lines[yi + ry]) break;
    rx = 0;
    self._maxes.slice(0, -1).forEach(function(max) {
      rx += max;
      if (!lines[yi + ry][xi + rx + 1]) return;
      // center
      if (ry === 0) {
        // top
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
        lines[yi + ry][xi + rx][1] = '\u252c'; // '┬'
        // XXX If we alter iheight and itop for no borders - nothing should be written here
        if (!self.border.top) {
          lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        }
        lines[yi + ry].dirty = true;
      } else if (ry === height) {
        // bottom
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
        lines[yi + ry][xi + rx][1] = '\u2534'; // '┴'
        // XXX If we alter iheight and ibottom for no borders - nothing should be written here
        if (!self.border.bottom) {
          lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
        }
        lines[yi + ry].dirty = true;
      } else {
        // middle
        rx++;
      }
    });
    ry += 1;
  }

  // Draw internal borders.
  for (ry = 1; ry < height; ry++) {
    if (!lines[yi + ry]) break;
    rx = 0;
    self._maxes.slice(0, -1).forEach(function(max) {
      rx += max;
      if (!lines[yi + ry][xi + rx + 1]) return;
      if (self.options.fillCellBorders !== false) {
        var lbg = lines[yi + ry][xi + rx][0] & 0x1ff;
        rx++;
        lines[yi + ry][xi + rx][0] = (battr & ~0x1ff) | lbg;
      } else {
        rx++;
        lines[yi + ry][xi + rx][0] = battr;
      }
      lines[yi + ry][xi + rx][1] = '\u2502'; // '│'
      lines[yi + ry].dirty = true;
    });
  }

  return coords;
};

/**
 * Expose
 */

module.exports = ListTable;
};
BundleModuleCode['term/widgets/terminal']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.2
 **
 **    $INFO:
 **
 **    terminal.js - term.js terminal element for blessed
 **    TODO: reolsve pty.js dependency
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');
var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Terminal
 */

function Terminal(options) {
  if (!instanceOf(this,Node)) {
    return new Terminal(options);
  }

  options = options || {};
  options.scrollable = false;

  Box.call(this, options);

  // XXX Workaround for all motion
  if (this.screen.program.tmux && this.screen.program.tmuxVersion >= 2) {
    this.screen.program.enableMouse();
  }

  this.handler = options.handler;
  this.shell = options.shell || process.env.SHELL || 'sh';
  this.args = options.args || [];

  this.cursor = this.options.cursor;
  this.cursorBlink = this.options.cursorBlink;
  this.screenKeys = this.options.screenKeys;

  this.style = this.style || {};
  this.style.bg = this.style.bg || 'default';
  this.style.fg = this.style.fg || 'default';

  this.termName = options.terminal
    || options.term
    || process.env.TERM
    || 'xterm';

  this.bootstrap();
}

//Terminal.prototype.__proto__ = Box.prototype;
inheritPrototype(Terminal,Box);

Terminal.prototype.type = 'terminal';

Terminal.prototype.bootstrap = function() {
  var self = this;

  var element = {
    // window
    get document() { return element; },
    navigator: { userAgent: 'node.js' },

    // document
    get defaultView() { return element; },
    get documentElement() { return element; },
    createElement: function() { return element; },

    // element
    get ownerDocument() { return element; },
    addEventListener: function() {},
    removeEventListener: function() {},
    getElementsByTagName: function() { return [element]; },
    getElementById: function() { return element; },
    parentNode: null,
    offsetParent: null,
    appendChild: function() {},
    removeChild: function() {},
    setAttribute: function() {},
    getAttribute: function() {},
    style: {},
    focus: function() {},
    blur: function() {},
    console: console
  };

  element.parentNode = element;
  element.offsetParent = element;

  this.term = Require('term/widgets/term')({
    termName: this.termName,
    cols: this.width - this.iwidth,
    rows: this.height - this.iheight,
    context: element,
    document: element,
    body: element,
    parent: element,
    cursorBlink: this.cursorBlink,
    screenKeys: this.screenKeys
  });

  this.term.refresh = function() {
    self.screen.render();
  };

  this.term.keyDown = function() {};
  this.term.keyPress = function() {};

  this.term.open(element);

  // Emits key sequences in html-land.
  // Technically not necessary here.
  // In reality if we wanted to be neat, we would overwrite the keyDown and
  // keyPress methods with our own node.js-keys->terminal-keys methods, but
  // since all the keys are already coming in as escape sequences, we can just
  // send the input directly to the handler/socket (see below).
  // this.term.on('data', function(data) {
  //   self.handler(data);
  // });

  // Incoming keys and mouse inputs.
  // NOTE: Cannot pass mouse events - coordinates will be off!
  this.screen.program.input.on('data', this._onData = function(data) {
    if (self.screen.focused === self && !self._isMouse(data)) {
      self.handler(data);
    }
  });

  this.onScreenEvent('mouse', function(data) {
    if (self.screen.focused !== self) return;

    if (data.x < self.aleft + self.ileft) return;
    if (data.y < self.atop + self.itop) return;
    if (data.x > self.aleft - self.ileft + self.width) return;
    if (data.y > self.atop - self.itop + self.height) return;

    if (self.term.x10Mouse
        || self.term.vt200Mouse
        || self.term.normalMouse
        || self.term.mouseEvents
        || self.term.utfMouse
        || self.term.sgrMouse
        || self.term.urxvtMouse) {
      ;
    } else {
      return;
    }

    var b = data.raw[0]
      , x = data.x - self.aleft
      , y = data.y - self.atop
      , s;

    if (self.term.urxvtMouse) {
      if (self.screen.program.sgrMouse) {
        b += 32;
      }
      s = '\x1b[' + b + ';' + (x + 32) + ';' + (y + 32) + 'M';
    } else if (self.term.sgrMouse) {
      if (!self.screen.program.sgrMouse) {
        b -= 32;
      }
      s = '\x1b[<' + b + ';' + x + ';' + y
        + (data.action === 'mousedown' ? 'M' : 'm');
    } else {
      if (self.screen.program.sgrMouse) {
        b += 32;
      }
      s = '\x1b[M'
        + String.fromCharCode(b)
        + String.fromCharCode(x + 32)
        + String.fromCharCode(y + 32);
    }

    self.handler(s);
  });

  this.on('focus', function() {
    self.term.focus();
  });

  this.on('blur', function() {
    self.term.blur();
  });

  this.term.on('title', function(title) {
    self.title = title;
    self.emit('title', title);
  });

  this.term.on('passthrough', function(data) {
    self.screen.program.flush();
    self.screen.program._owrite(data);
  });

  this.on('resize', function() {
    nextTick(function() {
      self.term.resize(self.width - self.iwidth, self.height - self.iheight);
    });
  });

  this.once('render', function() {
    self.term.resize(self.width - self.iwidth, self.height - self.iheight);
  });

  this.on('destroy', function() {
    self.kill();
    self.screen.program.input.removeListener('data', self._onData);
  });

  if (this.handler) {
    return;
  }

  this.pty = Require('term/widgets/pty.js').fork(this.shell, this.args, {
    name: this.termName,
    cols: this.width - this.iwidth,
    rows: this.height - this.iheight,
    cwd: process.env.HOME,
    env: this.options.env || process.env
  });

  this.on('resize', function() {
    nextTick(function() {
      try {
        self.pty.resize(self.width - self.iwidth, self.height - self.iheight);
      } catch (e) {
        ;
      }
    });
  });

  this.handler = function(data) {
    self.pty.write(data);
    self.screen.render();
  };

  this.pty.on('data', function(data) {
    self.write(data);
    self.screen.render();
  });

  this.pty.on('exit', function(code) {
    self.emit('exit', code || null);
  });

  this.onScreenEvent('keypress', function() {
    self.screen.render();
  });

  this.screen._listenKeys(this);
};

Terminal.prototype.write = function(data) {
  return this.term.write(data);
};

Terminal.prototype.render = function() {
  var ret = this._render();
  if (!ret) return;

  this.dattr = this.sattr(this.style);

  var xi = ret.xi + this.ileft
    , xl = ret.xl - this.iright
    , yi = ret.yi + this.itop
    , yl = ret.yl - this.ibottom
    , cursor;

  var scrollback = this.term.lines.length - (yl - yi);

  for (var y = Math.max(yi, 0); y < yl; y++) {
    var line = this.screen.lines[y];
    if (!line || !this.term.lines[scrollback + y - yi]) break;

    if (y === yi + this.term.y
        && this.term.cursorState
        && this.screen.focused === this
        && (this.term.ydisp === this.term.ybase || this.term.selectMode)
        && !this.term.cursorHidden) {
      cursor = xi + this.term.x;
    } else {
      cursor = -1;
    }

    for (var x = Math.max(xi, 0); x < xl; x++) {
      if (!line[x] || !this.term.lines[scrollback + y - yi][x - xi]) break;

      line[x][0] = this.term.lines[scrollback + y - yi][x - xi][0];

      if (x === cursor) {
        if (this.cursor === 'line') {
          line[x][0] = this.dattr;
          line[x][1] = '\u2502';
          continue;
        } else if (this.cursor === 'underline') {
          line[x][0] = this.dattr | (2 << 18);
        } else if (this.cursor === 'block' || !this.cursor) {
          line[x][0] = this.dattr | (8 << 18);
        }
      }

      line[x][1] = this.term.lines[scrollback + y - yi][x - xi][1];

      // default foreground = 257
      if (((line[x][0] >> 9) & 0x1ff) === 257) {
        line[x][0] &= ~(0x1ff << 9);
        line[x][0] |= ((this.dattr >> 9) & 0x1ff) << 9;
      }

      // default background = 256
      if ((line[x][0] & 0x1ff) === 256) {
        line[x][0] &= ~0x1ff;
        line[x][0] |= this.dattr & 0x1ff;
      }
    }

    line.dirty = true;
  }

  return ret;
};

Terminal.prototype._isMouse = function(buf) {
  var s = buf;
  if (Buffer.isBuffer(s)) {
    if (s[0] > 127 && s[1] === undefined) {
      s[0] -= 128;
      s = '\x1b' + s.toString('utf-8');
    } else {
      s = s.toString('utf-8');
    }
  }
  return (buf[0] === 0x1b && buf[1] === 0x5b && buf[2] === 0x4d)
    || /^\x1b\[M([\x00\u0020-\ufffe]{3})/.test(s)
    || /^\x1b\[(\d+;\d+;\d+)M/.test(s)
    || /^\x1b\[<(\d+;\d+;\d+)([mM])/.test(s)
    || /^\x1b\[<(\d+;\d+;\d+;\d+)&w/.test(s)
    || /^\x1b\[24([0135])~\[(\d+),(\d+)\]\r/.test(s)
    || /^\x1b\[(O|I)/.test(s);
};

Terminal.prototype.setScroll =
Terminal.prototype.scrollTo = function(offset) {
  this.term.ydisp = offset;
  return this.emit('scroll');
};

Terminal.prototype.getScroll = function() {
  return this.term.ydisp;
};

Terminal.prototype.scroll = function(offset) {
  this.term.scrollDisp(offset);
  return this.emit('scroll');
};

Terminal.prototype.resetScroll = function() {
  this.term.ydisp = 0;
  this.term.ybase = 0;
  return this.emit('scroll');
};

Terminal.prototype.getScrollHeight = function() {
  return this.term.rows - 1;
};

Terminal.prototype.getScrollPerc = function() {
  return (this.term.ydisp / this.term.ybase) * 100;
};

Terminal.prototype.setScrollPerc = function(i) {
  return this.setScroll((i / 100) * this.term.ybase | 0);
};

Terminal.prototype.screenshot = function(xi, xl, yi, yl) {
  xi = 0 + (xi || 0);
  if (xl != null) {
    xl = 0 + (xl || 0);
  } else {
    xl = this.term.lines[0].length;
  }
  yi = 0 + (yi || 0);
  if (yl != null) {
    yl = 0 + (yl || 0);
  } else {
    yl = this.term.lines.length;
  }
  return this.screen.screenshot(xi, xl, yi, yl, this.term);
};

Terminal.prototype.kill = function() {
  if (this.pty) {
    this.pty.destroy();
    this.pty.kill();
  }
  this.term.refresh = function() {};
  this.term.write('\x1b[H\x1b[J');
  if (this.term._blink) {
    clearInterval(this.term._blink);
  }
  this.term.destroy();
};

/**
 * Expose
 */

module.exports = Terminal;
};
BundleModuleCode['term/widgets/image']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2016-2017)
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    image.js - image element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

/**
 * Modules
 */

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Image
 */

function Image(options) {
  if (!instanceOf(this,Node)) {
    return new Image(options);
  }

  options = options || {};
  options.type = options.itype || options.type || 'ansi';

  Box.call(this, options);

  if (options.type === 'ansi' && this.type !== 'ansiimage') {
    var ANSIImage = require('./ansiimage');
    Object.getOwnPropertyNames(ANSIImage.prototype).forEach(function(key) {
      if (key === 'type') return;
      Object.defineProperty(this, key,
        Object.getOwnPropertyDescriptor(ANSIImage.prototype, key));
    }, this);
    ANSIImage.call(this, options);
    return this;
  }

  if (options.type === 'overlay' && this.type !== 'overlayimage') {
    var OverlayImage = require('./overlayimage');
    Object.getOwnPropertyNames(OverlayImage.prototype).forEach(function(key) {
      if (key === 'type') return;
      Object.defineProperty(this, key,
        Object.getOwnPropertyDescriptor(OverlayImage.prototype, key));
    }, this);
    OverlayImage.call(this, options);
    return this;
  }

  throw new Error('`type` must either be `ansi` or `overlay`.');
}

//Image.prototype.__proto__ = Box.prototype;
inheritPrototype(Image,Box);

Image.prototype.type = 'image';

/**
 * Expose
 */

module.exports = Image;
};
BundleModuleCode['term/widgets/ansiimage']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    sbosse (2017).
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 *
 * ansiimage.js - render PNGS/GIFS as ANSI
 *
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var cp = Require('child_process');

var colors = Require('term/colors');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

var tng = Require('term/tng');

/**
 * ANSIImage
 */

function ANSIImage(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new ANSIImage(options);
  }

  options = options || {};
  options.shrink = true;

  Box.call(this, options);

  this.scale = this.options.scale || 1.0;
  this.options.animate = this.options.animate !== false;
  this._noFill = true;

  if (this.options.file) {
    this.setImage(this.options.file);
  }

  this.screen.on('prerender', function() {
    var lpos = self.lpos;
    if (!lpos) return;
    // prevent image from blending with itself if there are alpha channels
    self.screen.clearRegion(lpos.xi, lpos.xl, lpos.yi, lpos.yl);
  });

  this.on('destroy', function() {
    self.stop();
  });
}

//ANSIImage.prototype.__proto__ = Box.prototype;
inheritPrototype(ANSIImage,Box);

ANSIImage.prototype.type = 'ansiimage';

ANSIImage.curl = function(url) {
  try {
    return cp.execFileSync('curl',
      ['-s', '-A', '', url],
      { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    ;
  }
  try {
    return cp.execFileSync('wget',
      ['-U', '', '-O', '-', url],
      { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    ;
  }
  throw new Error('curl or wget failed.');
};

ANSIImage.prototype.setImage = function(file) {
  this.file = typeof file === 'string' ? file : null;

  if (/^https?:/.test(file)) {
    file = ANSIImage.curl(file);
  }

  var width = this.position.width;
  var height = this.position.height;

  if (width != null) {
    width = this.width;
  }

  if (height != null) {
    height = this.height;
  }

  try {
    this.setContent('');

    this.img = tng(file, {
      colors: colors,
      width: width,
      height: height,
      scale: this.scale,
      ascii: this.options.ascii,
      speed: this.options.speed,
      filename: this.file
    });

    if (width == null || height == null) {
      this.width = this.img.cellmap[0].length;
      this.height = this.img.cellmap.length;
    }

    if (this.img.frames && this.options.animate) {
      this.play();
    } else {
      this.cellmap = this.img.cellmap;
    }
  } catch (e) {
    this.setContent('Image Error: ' + e.message);
    this.img = null;
    this.cellmap = null;
  }
};

ANSIImage.prototype.play = function() {
  var self = this;
  if (!this.img) return;
  return this.img.play(function(bmp, cellmap) {
    self.cellmap = cellmap;
    self.screen.render();
  });
};

ANSIImage.prototype.pause = function() {
  if (!this.img) return;
  return this.img.pause();
};

ANSIImage.prototype.stop = function() {
  if (!this.img) return;
  return this.img.stop();
};

ANSIImage.prototype.clearImage = function() {
  this.stop();
  this.setContent('');
  this.img = null;
  this.cellmap = null;
};

ANSIImage.prototype.render = function() {
  var coords = this._render();
  if (!coords) return;

  if (this.img && this.cellmap) {
    this.img.renderElement(this.cellmap, this);
  }

  return coords;
};

/**
 * Expose
 */

module.exports = ANSIImage;
};
BundleModuleCode['term/tng']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse 
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors (MIT License)
 **    $REVESIO:     1.1.6
 **
 **    $INFO:
 *
 * tng.js - png reader
 *
 *     $ENDINFO
 */


var fs = Require('fs')
  , util = Require('util')
  , path = Require('path')
  , zlib = Require('zlib')
  , assert = Require('assert')
  , cp = Require('child_process')
  , exec = cp?cp.execFileSync:_;

/**
 * PNG
 */

function PNG(file, options) {
  var buf
    , chunks
    , idat
    , pixels;

  if (!(this instanceof PNG)) {
    return new PNG(file, options);
  }

  if (!file) throw new Error('no file');

  this.options = options || {};
  this.colors = options.colors || Require('term/colors');
  this.optimization = this.options.optimization || 'mem';
  this.speed = this.options.speed || 1;

  if (Buffer.isBuffer(file)) {
    this.file = this.options.filename || null;
    buf = file;
  } else {
    this.options.filename = file;
    this.file = path.resolve(process.cwd(), file);
    buf = fs.readFileSync(this.file);
  }

  this.format = buf.readUInt32BE(0) === 0x89504e47 ? 'png'
    : buf.slice(0, 3).toString('ascii') === 'GIF' ? 'gif'
    : buf.readUInt16BE(0) === 0xffd8 ? 'jpg'
    : path.extname(this.file).slice(1).toLowerCase() || 'png';

  if (this.format !== 'png') {
    try {
      return this.toPNG(buf);
    } catch (e) {
      throw e;
    }
  }

  chunks = this.parseRaw(buf);
  idat = this.parseChunks(chunks);
  pixels = this.parseLines(idat);

  this.bmp = this.createBitmap(pixels);
  this.cellmap = this.createCellmap(this.bmp);
  this.frames = this.compileFrames(this.frames);
}

PNG.prototype.parseRaw = function(buf) {
  var chunks = []
    , index = 0
    , i = 0
    , buf
    , len
    , type
    , name
    , data
    , crc
    , check
    , critical
    , public_
    , conforming
    , copysafe
    , pos;

  this._debug(this.file);

  if (buf.readUInt32BE(0) !== 0x89504e47
      || buf.readUInt32BE(4) !== 0x0d0a1a0a) {
    throw new Error('bad header');
  }

  i += 8;

  while (i < buf.length) {
    try {
      len = buf.readUInt32BE(i);
      i += 4;
      pos = i;
      type = buf.slice(i, i + 4);
      name = type.toString('ascii');
      i += 4;
      data = buf.slice(i, i + len);
      i += len;
      check = this.crc32(buf.slice(pos, i));
      crc = buf.readInt32BE(i);
      i += 4;
      critical = !!(~type[0] & 32);
      public_ = !!(~type[1] & 32);
      conforming = !!(~type[2] & 32);
      copysafe = !!(~type[3] & 32);
      if (crc !== check) {
        throw new Error(name + ': bad crc');
      }
    } catch (e) {
      if (this.options.debug) throw e;
      break;
    }
    chunks.push({
      index: index++,
      id: name.toLowerCase(),
      len: len,
      pos: pos,
      end: i,
      type: type,
      name: name,
      data: data,
      crc: crc,
      check: check,
      raw: buf.slice(pos, i),
      flags: {
        critical: critical,
        public_: public_,
        conforming: conforming,
        copysafe: copysafe
      }
    });
  }

  return chunks;
};

PNG.prototype.parseChunks = function(chunks) {
  var i
    , chunk
    , name
    , data
    , p
    , idat
    , info;

  for (i = 0; i < chunks.length; i++) {
    chunk = chunks[i];
    name = chunk.id;
    data = chunk.data;
    info = {};
    switch (name) {
      case 'ihdr': {
        this.width = info.width = data.readUInt32BE(0);
        this.height = info.height = data.readUInt32BE(4);
        this.bitDepth = info.bitDepth = data.readUInt8(8);
        this.colorType = info.colorType = data.readUInt8(9);
        this.compression = info.compression = data.readUInt8(10);
        this.filter = info.filter = data.readUInt8(11);
        this.interlace = info.interlace = data.readUInt8(12);
        switch (this.bitDepth) {
          case 1: case 2: case 4: case 8: case 16: case 24: case 32: break;
          default: throw new Error('bad bit depth: ' + this.bitDepth);
        }
        switch (this.colorType) {
          case 0: case 2: case 3: case 4: case 6: break;
          default: throw new Error('bad color: ' + this.colorType);
        }
        switch (this.compression) {
          case 0: break;
          default: throw new Error('bad compression: ' + this.compression);
        }
        switch (this.filter) {
          case 0: case 1: case 2: case 3: case 4: break;
          default: throw new Error('bad filter: ' + this.filter);
        }
        switch (this.interlace) {
          case 0: case 1: break;
          default: throw new Error('bad interlace: ' + this.interlace);
        }
        break;
      }
      case 'plte': {
        this.palette = info.palette = [];
        for (p = 0; p < data.length; p += 3) {
          this.palette.push({
            r: data[p + 0],
            g: data[p + 1],
            b: data[p + 2],
            a: 255
          });
        }
        break;
      }
      case 'idat': {
        this.size = this.size || 0;
        this.size += data.length;
        this.idat = this.idat || [];
        this.idat.push(data);
        info.size = data.length;
        break;
      }
      case 'iend': {
        this.end = true;
        break;
      }
      case 'trns': {
        this.alpha = info.alpha = Array.prototype.slice.call(data);
        if (this.palette) {
          for (p = 0; p < data.length; p++) {
            if (!this.palette[p]) break;
            this.palette[p].a = data[p];
          }
        }
        break;
      }
      // https://wiki.mozilla.org/APNG_Specification
      case 'actl': {
        this.actl = info = {};
        this.frames = [];
        this.actl.numFrames = data.readUInt32BE(0);
        this.actl.numPlays = data.readUInt32BE(4);
        break;
      }
      case 'fctl': {
        // IDAT is the first frame depending on the order:
        // IDAT is a frame: acTL->fcTL->IDAT->[fcTL]->fdAT
        // IDAT is not a frame: acTL->IDAT->[fcTL]->fdAT
        if (!this.idat) {
          this.idat = [];
          this.frames.push({
            idat: true,
            fctl: info,
            fdat: this.idat
          });
        } else {
          this.frames.push({
            fctl: info,
            fdat: []
          });
        }
        info.sequenceNumber = data.readUInt32BE(0);
        info.width = data.readUInt32BE(4);
        info.height = data.readUInt32BE(8);
        info.xOffset = data.readUInt32BE(12);
        info.yOffset = data.readUInt32BE(16);
        info.delayNum = data.readUInt16BE(20);
        info.delayDen = data.readUInt16BE(22);
        info.disposeOp = data.readUInt8(24);
        info.blendOp = data.readUInt8(25);
        break;
      }
      case 'fdat': {
        info.sequenceNumber = data.readUInt32BE(0);
        info.data = data.slice(4);
        this.frames[this.frames.length - 1].fdat.push(info.data);
        break;
      }
    }
    chunk.info = info;
  }

  this._debug(chunks);

  if (this.frames) {
    this.frames = this.frames.map(function(frame, i) {
      frame.fdat = this.decompress(frame.fdat);
      if (!frame.fdat.length) throw new Error('no data');
      return frame;
    }, this);
  }

  idat = this.decompress(this.idat);
  if (!idat.length) throw new Error('no data');

  return idat;
};

PNG.prototype.parseLines = function(data) {
  var pixels = []
    , x
    , p
    , prior
    , line
    , filter
    , samples
    , pendingSamples
    , ch
    , shiftStart
    , i
    , toShift
    , sample;

  this.sampleDepth =
    this.colorType === 0 ? 1
    : this.colorType === 2 ? 3
    : this.colorType === 3 ? 1
    : this.colorType === 4 ? 2
    : this.colorType === 6 ? 4
    : 1;
  this.bitsPerPixel = this.bitDepth * this.sampleDepth;
  this.bytesPerPixel = Math.ceil(this.bitsPerPixel / 8);
  this.wastedBits = ((this.width * this.bitsPerPixel) / 8) - ((this.width * this.bitsPerPixel / 8) | 0);
  this.byteWidth = Math.ceil(this.width * (this.bitsPerPixel / 8));

  this.shiftStart = ((this.bitDepth + (8 / this.bitDepth - this.bitDepth)) - 1) | 0;
  this.shiftMult = this.bitDepth >= 8 ? 0 : this.bitDepth;
  this.mask = this.bitDepth === 32 ? 0xffffffff : (1 << this.bitDepth) - 1;

  if (this.interlace === 1) {
    samples = this.sampleInterlacedLines(data);
    for (i = 0; i < samples.length; i += this.sampleDepth) {
      pixels.push(samples.slice(i, i + this.sampleDepth));
    }
    return pixels;
  }

  for (p = 0; p < data.length; p += this.byteWidth) {
    prior = line || [];
    filter = data[p++];
    line = data.slice(p, p + this.byteWidth);
    line = this.unfilterLine(filter, line, prior);
    samples = this.sampleLine(line);
    for (i = 0; i < samples.length; i += this.sampleDepth) {
      pixels.push(samples.slice(i, i + this.sampleDepth));
    }
  }

  return pixels;
};

PNG.prototype.unfilterLine = function(filter, line, prior) {
  for (var x = 0; x < line.length; x++) {
    if (filter === 0) {
      break;
    } else if (filter === 1) {
      line[x] = this.filters.sub(x, line, prior, this.bytesPerPixel);
    } else if (filter === 2) {
      line[x] = this.filters.up(x, line, prior, this.bytesPerPixel);
    } else if (filter === 3) {
      line[x] = this.filters.average(x, line, prior, this.bytesPerPixel);
    } else if (filter === 4) {
      line[x] = this.filters.paeth(x, line, prior, this.bytesPerPixel);
    }
  }
  return line;
};

PNG.prototype.sampleLine = function(line, width) {
  var samples = []
    , x = 0
    , pendingSamples
    , ch
    , i
    , sample
    , shiftStart
    , toShift;

  while (x < line.length) {
    pendingSamples = this.sampleDepth;
    while (pendingSamples--) {
      ch = line[x];
      if (this.bitDepth === 16) {
        ch = (ch << 8) | line[++x];
      } else if (this.bitDepth === 24) {
        ch = (ch << 16) | (line[++x] << 8) | line[++x];
      } else if (this.bitDepth === 32) {
        ch = (ch << 24) | (line[++x] << 16) | (line[++x] << 8) | line[++x];
      } else if (this.bitDepth > 32) {
        throw new Error('bitDepth ' + this.bitDepth + ' unsupported.');
      }
      shiftStart = this.shiftStart;
      toShift = shiftStart - (x === line.length - 1 ? this.wastedBits : 0);
      for (i = 0; i <= toShift; i++) {
        sample = (ch >> (this.shiftMult * shiftStart)) & this.mask;
        if (this.colorType !== 3) {
          if (this.bitDepth < 8) { // <= 8 would work too, doesn't matter
            // sample = sample * (0xff / this.mask) | 0; // would work too
            sample *= 0xff / this.mask;
            sample |= 0;
          } else if (this.bitDepth > 8) {
            sample = (sample / this.mask) * 255 | 0;
          }
        }
        samples.push(sample);
        shiftStart--;
      }
      x++;
    }
  }

  // Needed for deinterlacing?
  if (width != null) {
    samples = samples.slice(0, width * this.sampleDepth);
  }

  return samples;
};

// http://www.w3.org/TR/PNG-Filters.html
PNG.prototype.filters = {
  sub: function Sub(x, line, prior, bpp) {
    if (x < bpp) return line[x];
    return (line[x] + line[x - bpp]) % 256;
  },
  up: function Up(x, line, prior, bpp) {
    return (line[x] + (prior[x] || 0)) % 256;
  },
  average: function Average(x, line, prior, bpp) {
    if (x < bpp) return Math.floor((prior[x] || 0) / 2);
    // if (x < bpp) return (prior[x] || 0) >> 1;
    return (line[x]
      + Math.floor((line[x - bpp] + prior[x]) / 2)
      // + ((line[x - bpp] + prior[x]) >> 1)
    ) % 256;
  },
  paeth: function Paeth(x, line, prior, bpp) {
    if (x < bpp) return prior[x] || 0;
    return (line[x] + this._predictor(
      line[x - bpp], prior[x] || 0, prior[x - bpp] || 0
    )) % 256;
  },
  _predictor: function PaethPredictor(a, b, c) {
    // a = left, b = above, c = upper left
    var p = a + b - c
      , pa = Math.abs(p - a)
      , pb = Math.abs(p - b)
      , pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }
};

/**
 * Adam7 deinterlacing ported to javascript from PyPNG:
 * pypng - Pure Python library for PNG image encoding/decoding
 * Copyright (c) 2009-2015, David Jones (MIT License).
 * https://github.com/drj11/pypng
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

PNG.prototype.sampleInterlacedLines = function(raw) {
  var psize
    , vpr
    , samples
    , source_offset
    , i
    , pass
    , xstart
    , ystart
    , xstep
    , ystep
    , recon
    , ppr
    , row_size
    , y
    , filter_type
    , scanline
    , flat
    , offset
    , k
    , end_offset
    , skip
    , j
    , k
    , f;

  var adam7 = [
    [0, 0, 8, 8],
    [4, 0, 8, 8],
    [0, 4, 4, 8],
    [2, 0, 4, 4],
    [0, 2, 2, 4],
    [1, 0, 2, 2],
    [0, 1, 1, 2]
  ];

  // Fractional bytes per pixel
  psize = (this.bitDepth / 8) * this.sampleDepth;

  // Values per row (of the target image)
  vpr = this.width * this.sampleDepth;

  // Make a result array, and make it big enough. Interleaving
  // writes to the output array randomly (well, not quite), so the
  // entire output array must be in memory.
  samples = new Buffer(vpr * this.height);
  samples.fill(0);

  source_offset = 0;

  for (i = 0; i < adam7.length; i++) {
    pass = adam7[i];
    xstart = pass[0];
    ystart = pass[1];
    xstep = pass[2];
    ystep = pass[3];
    if (xstart >= this.width) continue;
    // The previous (reconstructed) scanline. Empty array at the
    // beginning of a pass to indicate that there is no previous
    // line.
    recon = [];
    // Pixels per row (reduced pass image)
    ppr = Math.ceil((this.width - xstart) / xstep);
    // Row size in bytes for this pass.
    row_size = Math.ceil(psize * ppr);
    for (y = ystart; y < this.height; y += ystep) {
      filter_type = raw[source_offset];
      source_offset += 1;
      scanline = raw.slice(source_offset, source_offset + row_size);
      source_offset += row_size;
      recon = this.unfilterLine(filter_type, scanline, recon);
      // Convert so that there is one element per pixel value
      flat = this.sampleLine(recon, ppr);
      if (xstep === 1) {
        assert.equal(xstart, 0);
        offset = y * vpr;
        for (k = offset, f = 0; k < offset + vpr; k++, f++) {
          samples[k] = flat[f];
        }
      } else {
        offset = y * vpr + xstart * this.sampleDepth;
        end_offset = (y + 1) * vpr;
        skip = this.sampleDepth * xstep;
        for (j = 0; j < this.sampleDepth; j++) {
          for (k = offset + j, f = j; k < end_offset; k += skip, f += this.sampleDepth) {
            samples[k] = flat[f];
          }
        }
      }
    }
  }

  return samples;
};

PNG.prototype.createBitmap = function(pixels) {
  var bmp = []
    , i;

  if (this.colorType === 0) {
    pixels = pixels.map(function(sample) {
      return { r: sample[0], g: sample[0], b: sample[0], a: 255 };
    });
  } else if (this.colorType === 2) {
    pixels = pixels.map(function(sample) {
      return { r: sample[0], g: sample[1], b: sample[2], a: 255 };
    });
  } else if (this.colorType === 3) {
    pixels = pixels.map(function(sample) {
      if (!this.palette[sample[0]]) throw new Error('bad palette index');
      return this.palette[sample[0]];
    }, this);
  } else if (this.colorType === 4) {
    pixels = pixels.map(function(sample) {
      return { r: sample[0], g: sample[0], b: sample[0], a: sample[1] };
    });
  } else if (this.colorType === 6) {
    pixels = pixels.map(function(sample) {
      return { r: sample[0], g: sample[1], b: sample[2], a: sample[3] };
    });
  }

  for (i = 0; i < pixels.length; i += this.width) {
    bmp.push(pixels.slice(i, i + this.width));
  }

  return bmp;
};

PNG.prototype.createCellmap = function(bmp, options) {
  var bmp = bmp || this.bmp
    , options = options || this.options
    , cellmap = []
    , scale = options.scale || 0.20
    , height = bmp.length
    , width = bmp[0].length
    , cmwidth = options.width
    , cmheight = options.height
    , line
    , x
    , y
    , xx
    , yy
    , scale
    , xs
    , ys;

  if (cmwidth) {
    scale = cmwidth / width;
  } else if (cmheight) {
    scale = cmheight / height;
  }

  if (!cmheight) {
    cmheight = Math.round(height * scale);
  }

  if (!cmwidth) {
    cmwidth = Math.round(width * scale);
  }

  ys = height / cmheight;
  xs = width / cmwidth;

  for (y = 0; y < bmp.length; y += ys) {
    line = [];
    yy = Math.round(y);
    if (!bmp[yy]) break;
    for (x = 0; x < bmp[yy].length; x += xs) {
      xx = Math.round(x);
      if (!bmp[yy][xx]) break;
      line.push(bmp[yy][xx]);
    }
    cellmap.push(line);
  }

  return cellmap;
};

PNG.prototype.renderANSI = function(bmp) {
  var self = this
    , out = '';

  bmp.forEach(function(line, y) {
    line.forEach(function(pixel, x) {
      var outch = self.getOutch(x, y, line, pixel);
      out += self.pixelToSGR(pixel, outch);
    });
    out += '\n';
  });

  return out;
};

PNG.prototype.renderContent = function(bmp, el) {
  var self = this
    , out = '';

  bmp.forEach(function(line, y) {
    line.forEach(function(pixel, x) {
      var outch = self.getOutch(x, y, line, pixel);
      out += self.pixelToTags(pixel, outch);
    });
    out += '\n';
  });

  el.setContent(out);

  return out;
};

PNG.prototype.renderScreen = function(bmp, screen, xi, xl, yi, yl) {
  var self = this
    , lines = screen.lines
    , cellLines
    , y
    , yy
    , x
    , xx
    , alpha
    , attr
    , ch;

  cellLines = bmp.reduce(function(cellLines, line, y) {
    var cellLine = [];
    line.forEach(function(pixel, x) {
      var outch = self.getOutch(x, y, line, pixel)
        , cell = self.pixelToCell(pixel, outch);
      cellLine.push(cell);
    });
    cellLines.push(cellLine);
    return cellLines;
  }, []);

  for (y = yi; y < yl; y++) {
    yy = y - yi;
    for (x = xi; x < xl; x++) {
      xx = x - xi;
      if (lines[y] && lines[y][x] && cellLines[yy] && cellLines[yy][xx]) {
        alpha = cellLines[yy][xx].pop();
        // completely transparent
        if (alpha === 0.0) {
          continue;
        }
        // translucency / blending
        if (alpha < 1.0) {
          attr = cellLines[yy][xx][0];
          ch = cellLines[yy][xx][1];
          lines[y][x][0] = this.colors.blend(lines[y][x][0], attr, alpha);
          if (ch !== ' ') lines[y][x][1] = ch;
          lines[y].dirty = true;
          continue;
        }
        // completely opaque
        lines[y][x] = cellLines[yy][xx];
        lines[y].dirty = true;
      }
    }
  }
};

PNG.prototype.renderElement = function(bmp, el) {
  var xi = el.aleft + el.ileft
    , xl = el.aleft + el.width - el.iright
    , yi = el.atop + el.itop
    , yl = el.atop + el.height - el.ibottom;

  return this.renderScreen(bmp, el.screen, xi, xl, yi, yl);
};

PNG.prototype.pixelToSGR = function(pixel, ch) {
  var bga = 1.0
    , fga = 0.5
    , a = pixel.a / 255
    , bg
    , fg;

  bg = this.colors.match(
    pixel.r * a * bga | 0,
    pixel.g * a * bga | 0,
    pixel.b * a * bga | 0);

  if (ch && this.options.ascii) {
    fg = this.colors.match(
      pixel.r * a * fga | 0,
      pixel.g * a * fga | 0,
      pixel.b * a * fga | 0);
    if (a === 0) {
      return '\x1b[38;5;' + fg + 'm' + ch + '\x1b[m';
    }
    return '\x1b[38;5;' + fg + 'm\x1b[48;5;' + bg + 'm' + ch + '\x1b[m';
  }

  if (a === 0) return ' ';

  return '\x1b[48;5;' + bg + 'm \x1b[m';
};

PNG.prototype.pixelToTags = function(pixel, ch) {
  var bga = 1.0
    , fga = 0.5
    , a = pixel.a / 255
    , bg
    , fg;

  bg = this.colors.RGBtoHex(
    pixel.r * a * bga | 0,
    pixel.g * a * bga | 0,
    pixel.b * a * bga | 0);

  if (ch && this.options.ascii) {
    fg = this.colors.RGBtoHex(
      pixel.r * a * fga | 0,
      pixel.g * a * fga | 0,
      pixel.b * a * fga | 0);
    if (a === 0) {
      return '{' + fg + '-fg}' + ch + '{/}';
    }
    return '{' + fg + '-fg}{' + bg + '-bg}' + ch + '{/}';
  }

  if (a === 0) return ' ';

  return '{' + bg + '-bg} {/' + bg + '-bg}';
};

PNG.prototype.pixelToCell = function(pixel, ch) {
  var bga = 1.0
    , fga = 0.5
    , a = pixel.a / 255
    , bg
    , fg;

  bg = this.colors.match(
    pixel.r * bga | 0,
    pixel.g * bga | 0,
    pixel.b * bga | 0);

  if (ch && this.options.ascii) {
    fg = this.colors.match(
      pixel.r * fga | 0,
      pixel.g * fga | 0,
      pixel.b * fga | 0);
  } else {
    fg = 0x1ff;
    ch = null;
  }

  // if (a === 0) bg = 0x1ff;

  return [(0 << 18) | (fg << 9) | (bg << 0), ch || ' ', a];
};

// Taken from libcaca:
PNG.prototype.getOutch = (function() {
  var dchars = '????8@8@#8@8##8#MKXWwz$&%x><\\/xo;+=|^-:i\'.`,  `.        ';

  var luminance = function(pixel) {
    var a = pixel.a / 255
      , r = pixel.r * a
      , g = pixel.g * a
      , b = pixel.b * a
      , l = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return l / 255;
  };

  return function(x, y, line, pixel) {
    var lumi = luminance(pixel)
      , outch = dchars[lumi * (dchars.length - 1) | 0];

    return outch;
  };
})();

PNG.prototype.compileFrames = function(frames) {
  return this.optimization === 'mem'
    ? this.compileFrames_lomem(frames)
    : this.compileFrames_locpu(frames);
};

PNG.prototype.compileFrames_lomem = function(frames) {
  if (!this.actl) return;
  return frames.map(function(frame, i) {
    this.width = frame.fctl.width;
    this.height = frame.fctl.height;

    var pixels = frame._pixels || this.parseLines(frame.fdat)
      , bmp = frame._bmp || this.createBitmap(pixels)
      , fc = frame.fctl;

    return {
      actl: this.actl,
      fctl: frame.fctl,
      delay: (fc.delayNum / (fc.delayDen || 100)) * 1000 | 0,
      bmp: bmp
    };
  }, this);
};

PNG.prototype.compileFrames_locpu = function(frames) {
  if (!this.actl) return;

  this._curBmp = null;
  this._lastBmp = null;

  return frames.map(function(frame, i) {
    this.width = frame.fctl.width;
    this.height = frame.fctl.height;

    var pixels = frame._pixels || this.parseLines(frame.fdat)
      , bmp = frame._bmp || this.createBitmap(pixels)
      , renderBmp = this.renderFrame(bmp, frame, i)
      , cellmap = this.createCellmap(renderBmp)
      , fc = frame.fctl;

    return {
      actl: this.actl,
      fctl: frame.fctl,
      delay: (fc.delayNum / (fc.delayDen || 100)) * 1000 | 0,
      bmp: renderBmp,
      cellmap: cellmap
    };
  }, this);
};

PNG.prototype.renderFrame = function(bmp, frame, i) {
  var first = this.frames[0]
    , last = this.frames[i - 1]
    , fc = frame.fctl
    , xo = fc.xOffset
    , yo = fc.yOffset
    , lxo
    , lyo
    , x
    , y
    , line
    , p;

  if (!this._curBmp) {
    this._curBmp = [];
    for (y = 0; y < first.fctl.height; y++) {
      line = [];
      for (x = 0; x < first.fctl.width; x++) {
        p = bmp[y][x];
        line.push({ r: p.r, g: p.g, b: p.b, a: p.a });
      }
      this._curBmp.push(line);
    }
  }

  if (last && last.fctl.disposeOp !== 0) {
    lxo = last.fctl.xOffset;
    lyo = last.fctl.yOffset;
    for (y = 0; y < last.fctl.height; y++) {
      for (x = 0; x < last.fctl.width; x++) {
        if (last.fctl.disposeOp === 0) {
          // none / keep
        } else if (last.fctl.disposeOp === 1) {
          // background / clear
          this._curBmp[lyo + y][lxo + x] = { r: 0, g: 0, b: 0, a: 0 };
        } else if (last.fctl.disposeOp === 2) {
          // previous / restore
          p = this._lastBmp[y][x];
          this._curBmp[lyo + y][lxo + x] = { r: p.r, g: p.g, b: p.b, a: p.a };
        }
      }
    }
  }

  if (frame.fctl.disposeOp === 2) {
    this._lastBmp = [];
    for (y = 0; y < frame.fctl.height; y++) {
      line = [];
      for (x = 0; x < frame.fctl.width; x++) {
        p = this._curBmp[yo + y][xo + x];
        line.push({ r: p.r, g: p.g, b: p.b, a: p.a });
      }
      this._lastBmp.push(line);
    }
  } else {
    this._lastBmp = null;
  }

  for (y = 0; y < frame.fctl.height; y++) {
    for (x = 0; x < frame.fctl.width; x++) {
      p = bmp[y][x];
      if (fc.blendOp === 0) {
        // source
        this._curBmp[yo + y][xo + x] = { r: p.r, g: p.g, b: p.b, a: p.a };
      } else if (fc.blendOp === 1) {
        // over
        if (p.a !== 0) {
          this._curBmp[yo + y][xo + x] = { r: p.r, g: p.g, b: p.b, a: p.a };
        }
      }
    }
  }

  return this._curBmp;
};

PNG.prototype._animate = function(callback) {
  if (!this.frames) {
    return callback(this.bmp, this.cellmap);
  }

  var self = this
    , numPlays = this.actl.numPlays || Infinity
    , running = 0
    , i = -1;

  this._curBmp = null;
  this._lastBmp = null;

  var next_lomem = function() {
    if (!running) return;

    var frame = self.frames[++i];
    if (!frame) {
      if (!--numPlays) return callback();
      i = -1;
      // XXX may be able to optimize by only setting the self._curBmp once???
      self._curBmp = null;
      self._lastBmp = null;
      return setImmediate(next);
    }

    var bmp = frame.bmp
      , renderBmp = self.renderFrame(bmp, frame, i)
      , cellmap = self.createCellmap(renderBmp);

    callback(renderBmp, cellmap);
    return setTimeout(next, frame.delay / self.speed | 0);
  };

  var next_locpu = function() {
    if (!running) return;
    var frame = self.frames[++i];
    if (!frame) {
      if (!--numPlays) return callback();
      i = -1;
      return setImmediate(next);
    }
    callback(frame.bmp, frame.cellmap);
    return setTimeout(next, frame.delay / self.speed | 0);
  };

  var next = this.optimization === 'mem'
    ? next_lomem
    : next_locpu;

  this._control = function(state) {
    if (state === -1) {
      i = -1;
      self._curBmp = null;
      self._lastBmp = null;
      running = 0;
      callback(self.frames[0].bmp,
        self.frames[0].cellmap || self.createCellmap(self.frames[0].bmp));
      return;
    }
    if (state === running) return;
    running = state;
    return next();
  };

  this._control(1);
};

PNG.prototype.play = function(callback) {
  if (!this._control || callback) {
    this.stop();
    return this._animate(callback);
  }
  this._control(1);
};

PNG.prototype.pause = function() {
  if (!this._control) return;
  this._control(0);
};

PNG.prototype.stop = function() {
  if (!this._control) return;
  this._control(-1);
};

PNG.prototype.toPNG = function(input) {
  var options = this.options
    , file = this.file
    , format = this.format
    , buf
    , img
    , gif
    , i
    , control
    , disposeOp;

  if (format !== 'gif') {
    buf = exec('convert', [format + ':-', 'png:-'],
      { stdio: ['pipe', 'pipe', 'ignore'], input: input });
    img = PNG(buf, options);
    img.file = file;
    return img;
  }

  gif = GIF(input, options);

  this.width = gif.width;
  this.height = gif.height;
  this.frames = [];

  for (i = 0; i < gif.images.length; i++) {
    img = gif.images[i];
    // Convert from gif disposal to png disposal. See:
    // http://www.w3.org/Graphics/GIF/spec-gif89a.txt
    control = img.control || gif;
    disposeOp = Math.max(0, (control.disposeMethod || 0) - 1);
    if (disposeOp > 2) disposeOp = 0;
    this.frames.push({
      fctl: {
        sequenceNumber: i,
        width: img.width,
        height: img.height,
        xOffset: img.left,
        yOffset: img.top,
        delayNum: control.delay,
        delayDen: 100,
        disposeOp: disposeOp,
        blendOp: 1
      },
      fdat: [],
      _pixels: [],
      _bmp: img.bmp
    });
  }

  this.bmp = this.frames[0]._bmp;
  this.cellmap = this.createCellmap(this.bmp);

  if (this.frames.length > 1) {
    this.actl = { numFrames: gif.images.length, numPlays: gif.numPlays || 0 };
    this.frames = this.compileFrames(this.frames);
  } else {
    this.frames = undefined;
  }

  return this;
};

// Convert a gif to an apng using imagemagick. Unfortunately imagemagick
// doesn't support apngs, so we coalesce the gif frames into one image and then
// slice them into frames.
PNG.prototype.gifMagick = function(input) {
  var options = this.options
    , file = this.file
    , format = this.format
    , buf
    , fmt
    , img
    , frames
    , frame
    , width
    , height
    , iwidth
    , twidth
    , i
    , lines
    , line
    , x
    , y;

  buf = exec('convert',
    [format + ':-', '-coalesce', '+append', 'png:-'],
    { stdio: ['pipe', 'pipe', 'ignore'], input: input });

  fmt = '{"W":%W,"H":%H,"w":%w,"h":%h,"d":%T,"x":"%X","y":"%Y"},'
  frames = exec('identify', ['-format', fmt, format + ':-'],
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], input: input });
  frames = JSON.parse('[' + frames.trim().slice(0, -1) + ']');

  img = PNG(buf, options);
  img.file = file;
  Object.keys(img).forEach(function(key) {
    this[key] = img[key];
  }, this);

  width = frames[0].W;
  height = frames[0].H;
  iwidth = 0;
  twidth = 0;

  this.width = width;
  this.height = height;

  this.frames = [];

  for (i = 0; i < frames.length; i++) {
    frame = frames[i];
    frame.x = +frame.x;
    frame.y = +frame.y;

    iwidth = twidth;
    twidth += width;

    lines = [];
    for (y = frame.y; y < height; y++) {
      line = [];
      for (x = iwidth + frame.x; x < twidth; x++) {
        line.push(img.bmp[y][x]);
      }
      lines.push(line);
    }

    this.frames.push({
      fctl: {
        sequenceNumber: i,
        width: frame.w,
        height: frame.h,
        xOffset: frame.x,
        yOffset: frame.y,
        delayNum: frame.d,
        delayDen: 100,
        disposeOp: 0,
        blendOp: 0
      },
      fdat: [],
      _pixels: [],
      _bmp: lines
    });
  }

  this.bmp = this.frames[0]._bmp;
  this.cellmap = this.createCellmap(this.bmp);

  if (this.frames.length > 1) {
    this.actl = { numFrames: frames.length, numPlays: 0 };
    this.frames = this.compileFrames(this.frames);
  } else {
    this.frames = undefined;
  }

  return this;
};

PNG.prototype.decompress = function(buffers) {
  return zlib.inflateSync(new Buffer(buffers.reduce(function(out, data) {
    return out.concat(Array.prototype.slice.call(data));
  }, [])));
};

/**
 * node-crc
 * https://github.com/alexgorbatchev/node-crc
 * https://github.com/alexgorbatchev/node-crc/blob/master/LICENSE
 *
 * The MIT License (MIT)
 *
 * Copyright 2014 Alex Gorbatchev
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

PNG.prototype.crc32 = (function() {
  var crcTable = [
    0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f,
    0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988,
    0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91, 0x1db71064, 0x6ab020f2,
    0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7,
    0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
    0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172,
    0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b, 0x35b5a8fa, 0x42b2986c,
    0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59,
    0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423,
    0xcfba9599, 0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
    0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190, 0x01db7106,
    0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433,
    0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d,
    0x91646c97, 0xe6635c01, 0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e,
    0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
    0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65,
    0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7,
    0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0,
    0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa,
    0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
    0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81,
    0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a,
    0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683, 0xe3630b12, 0x94643b84,
    0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1,
    0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
    0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc,
    0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5, 0xd6d6a3e8, 0xa1d1937e,
    0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
    0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55,
    0x316e8eef, 0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
    0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe, 0xb2bd0b28,
    0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d,
    0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f,
    0x72076785, 0x05005713, 0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38,
    0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
    0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777,
    0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69,
    0x616bffd3, 0x166ccf45, 0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2,
    0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc,
    0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
    0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693,
    0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94,
    0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d
  ];

  return function crc32(buf) {
    //var crc = previous === 0 ? 0 : ~~previous ^ -1;
    var crc = -1;
    for (var i = 0, len = buf.length; i < len; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ -1;
  };
})();

PNG.prototype._debug = function() {
  if (!this.options.log) return;
  return this.options.log.apply(null, arguments);
};

/**
 * GIF
 */

function GIF(file, options) {
  var self = this;

  if (!(this instanceof GIF)) {
    return new GIF(file, options);
  }

  var info = {}
    , p = 0
    , buf
    , i
    , total
    , sig
    , desc
    , img
    , ext
    , label
    , size;

  if (!file) throw new Error('no file');

  options = options || {};

  this.options = options;

  // XXX If the gif is not optimized enough
  // it may OOM the process with too many frames.
  // TODO: Implement in PNG reader.
  this.pixelLimit = this.options.pixelLimit || 7622550;
  this.totalPixels = 0;

  if (Buffer.isBuffer(file)) {
    buf = file;
    file = null;
  } else {
    file = path.resolve(process.cwd(), file);
    buf = fs.readFileSync(file);
  }

  sig = buf.slice(0, 6).toString('ascii');
  if (sig !== 'GIF87a' && sig !== 'GIF89a') {
    throw new Error('bad header: ' + sig);
  }

  this.width = buf.readUInt16LE(6);
  this.height = buf.readUInt16LE(8);

  this.flags = buf.readUInt8(10);
  this.gct = !!(this.flags & 0x80);
  this.gctsize = (this.flags & 0x07) + 1;

  this.bgIndex = buf.readUInt8(11);
  this.aspect = buf.readUInt8(12);
  p += 13;

  if (this.gct) {
    this.colors = [];
    total = 1 << this.gctsize;
    for (i = 0; i < total; i++, p += 3) {
      this.colors.push([buf[p], buf[p + 1], buf[p + 2], 255]);
    }
  }

  this.images = [];
  this.extensions = [];

  try {
    while (p < buf.length) {
      desc = buf.readUInt8(p);
      p += 1;
      if (desc === 0x2c) {
        img = {};

        img.left = buf.readUInt16LE(p);
        p += 2;
        img.top = buf.readUInt16LE(p);
        p += 2;

        img.width = buf.readUInt16LE(p);
        p += 2;
        img.height = buf.readUInt16LE(p);
        p += 2;

        img.flags = buf.readUInt8(p);
        p += 1;

        img.lct = !!(img.flags & 0x80);
        img.ilace = !!(img.flags & 0x40);
        img.lctsize = (img.flags & 0x07) + 1;

        if (img.lct) {
          img.lcolors = [];
          total = 1 << img.lctsize;
          for (i = 0; i < total; i++, p += 3) {
            img.lcolors.push([buf[p], buf[p + 1], buf[p + 2], 255]);
          }
        }

        img.codeSize = buf.readUInt8(p);
        p += 1;

        img.size = buf.readUInt8(p);
        p += 1;

        img.lzw = [buf.slice(p, p + img.size)];
        p += img.size;

        while (buf[p] !== 0x00) {
          // Some gifs screw up their size.
          // XXX Same for all subblocks?
          if (buf[p] === 0x3b && p === buf.length - 1) {
            p--;
            break;
          }
          size = buf.readUInt8(p);
          p += 1;
          img.lzw.push(buf.slice(p, p + size));
          p += size;
        }

        assert.equal(buf.readUInt8(p), 0x00);
        p += 1;

        if (ext && ext.label === 0xf9) {
          img.control = ext;
        }

        this.totalPixels += img.width * img.height;

        this.images.push(img);

        if (this.totalPixels >= this.pixelLimit) {
          break;
        }
      } else if (desc === 0x21) {
        // Extensions:
        // http://www.w3.org/Graphics/GIF/spec-gif89a.txt
        ext = {};
        label = buf.readUInt8(p);
        p += 1;
        ext.label = label;
        if (label === 0xf9) {
          size = buf.readUInt8(p);
          assert.equal(size, 0x04);
          p += 1;
          ext.fields = buf.readUInt8(p);
          ext.disposeMethod = (ext.fields >> 2) & 0x07;
          ext.useTransparent = !!(ext.fields & 0x01);
          p += 1;
          ext.delay = buf.readUInt16LE(p);
          p += 2;
          ext.transparentColor = buf.readUInt8(p);
          p += 1;
          while (buf[p] !== 0x00) {
            size = buf.readUInt8(p);
            p += 1;
            p += size;
          }
          assert.equal(buf.readUInt8(p), 0x00);
          p += 1;
          this.delay = ext.delay;
          this.transparentColor = ext.transparentColor;
          this.disposeMethod = ext.disposeMethod;
          this.useTransparent = ext.useTransparent;
        } else if (label === 0xff) {
          // https://wiki.whatwg.org/wiki/GIF#Specifications
          size = buf.readUInt8(p);
          p += 1;
          ext.id = buf.slice(p, p + 8).toString('ascii');
          p += 8;
          ext.auth = buf.slice(p, p + 3).toString('ascii');
          p += 3;
          ext.data = [];
          while (buf[p] !== 0x00) {
            size = buf.readUInt8(p);
            p += 1;
            ext.data.push(buf.slice(p, p + size));
            p += size;
          }
          ext.data = new Buffer(ext.data.reduce(function(out, data) {
            return out.concat(Array.prototype.slice.call(data));
          }, []));
          // AnimExts looping extension (identical to netscape)
          if (ext.id === 'ANIMEXTS' && ext.auth === '1.0') {
            ext.id = 'NETSCAPE';
            ext.auth = '2.0';
            ext.animexts = true;
          }
          // Netscape extensions
          if (ext.id === 'NETSCAPE' && ext.auth === '2.0') {
            if (ext.data.readUInt8(0) === 0x01) {
              // Netscape looping extension
              // http://graphcomp.com/info/specs/ani_gif.html
              ext.numPlays = ext.data.readUInt16LE(1);
              this.numPlays = ext.numPlays;
            } else if (ext.data.readUInt8(0) === 0x02) {
              // Netscape buffering extension
              this.minBuffer = ext.data;
            }
          }
          // Adobe XMP extension
          if (ext.id === 'XMP Data' && ext.auth === 'XMP') {
            ext.xmp = ext.data.toString('utf8');
            this.xmp = ext.xmp;
          }
          // ICC extension
          if (ext.id === 'ICCRGBG1' && ext.auth === '012') {
            // NOTE: Says size is 4 bytes, not 1? Maybe just buffer size?
            this.icc = ext.data;
          }
          // fractint extension
          if (ext.id === 'fractint' && /^00[1-7]$/.test(ext.auth)) {
            // NOTE: Says size is 4 bytes, not 1? Maybe just buffer size?
            // Size: '!\377\013' == [0x00, 0x15, 0xff, 0x0b]
            this.fractint = ext.data;
          }
          assert.equal(buf.readUInt8(p), 0x00);
          p += 1;
        } else {
          ext.data = [];
          while (buf[p] !== 0x00) {
            size = buf.readUInt8(p);
            p += 1;
            ext.data.push(buf.slice(p, p + size));
            p += size;
          }
          assert.equal(buf.readUInt8(p), 0x00);
          p += 1;
        }
        this.extensions.push(ext);
      } else if (desc === 0x3b) {
        break;
      } else if (p === buf.length - 1) {
        // } else if (desc === 0x00 && p === buf.length - 1) {
        break;
      } else {
        throw new Error('unknown block');
      }
    }
  } catch (e) {
    if (options.debug) {
      throw e;
    }
  }

  this.images = this.images.map(function(img, imageIndex) {
    var control = img.control || this;

    img.lzw = new Buffer(img.lzw.reduce(function(out, data) {
      return out.concat(Array.prototype.slice.call(data));
    }, []));

    try {
      img.data = this.decompress(img.lzw, img.codeSize);
    } catch (e) {
      if (options.debug) throw e;
      return;
    }

    var interlacing = [
      [ 0, 8 ],
      [ 4, 8 ],
      [ 2, 4 ],
      [ 1, 2 ],
      [ 0, 0 ]
    ];

    var table = img.lcolors || this.colors
      , row = 0
      , col = 0
      , ilp = 0
      , p = 0
      , b
      , idx
      , i
      , y
      , x
      , line
      , pixel;

    img.samples = [];
    // Rewritten version of:
    // https://github.com/lbv/ka-cs-programs/blob/master/lib/gif-reader.js
    for (;;) {
      b = img.data[p++];
      if (b == null) break;
      idx = (row * img.width + col) * 4;
      if (!table[b]) {
        if (options.debug) throw new Error('bad samples');
        table[b] = [0, 0, 0, 0];
      }
      img.samples[idx] = table[b][0];
      img.samples[idx + 1] = table[b][1];
      img.samples[idx + 2] = table[b][2];
      img.samples[idx + 3] = table[b][3];
      if (control.useTransparent && b === control.transparentColor) {
        img.samples[idx + 3] = 0;
      }
      if (++col >= img.width) {
        col = 0;
        if (img.ilace) {
          row += interlacing[ilp][1];
          if (row >= img.height) {
            row = interlacing[++ilp][0];
          }
        } else {
          row++;
        }
      }
    }

    img.pixels = [];
    for (i = 0; i < img.samples.length; i += 4) {
      img.pixels.push(img.samples.slice(i, i + 4));
    }

    img.bmp = [];
    for (y = 0, p = 0; y < img.height; y++) {
      line = [];
      for (x = 0; x < img.width; x++) {
        pixel = img.pixels[p++];
        if (!pixel) {
          if (options.debug) throw new Error('no pixel');
          line.push({ r: 0, g: 0, b: 0, a: 0 });
          continue;
        }
        line.push({ r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] });
      }
      img.bmp.push(line);
    }

    return img;
  }, this).filter(Boolean);

  if (!this.images.length) {
    throw new Error('no image data or bad decompress');
  }
}

// Rewritten version of:
// https://github.com/lbv/ka-cs-programs/blob/master/lib/gif-reader.js
GIF.prototype.decompress = function(input, codeSize) {
  var bitDepth = codeSize + 1
    , CC = 1 << codeSize
    , EOI = CC + 1
    , stack = []
    , table = []
    , ntable = 0
    , oldCode = null
    , buffer = 0
    , nbuffer = 0
    , p = 0
    , buf = []
    , bits
    , read
    , ans
    , n
    , code
    , i
    , K
    , b
    , maxElem;

  for (;;) {
    if (stack.length === 0) {
      bits = bitDepth;
      read = 0;
      ans = 0;
      while (read < bits) {
        if (nbuffer === 0) {
          if (p >= input.length) return buf;
          buffer = input[p++];
          nbuffer = 8;
        }
        n = Math.min(bits - read, nbuffer);
        ans |= (buffer & ((1 << n) - 1)) << read;
        read += n;
        nbuffer -= n;
        buffer >>= n;
      }
      code = ans;

      if (code === EOI) {
        break;
      }

      if (code === CC) {
        table = [];
        for (i = 0; i < CC; ++i) {
          table[i] = [i, -1, i];
        }
        bitDepth = codeSize + 1;
        maxElem = 1 << bitDepth;
        ntable = CC + 2;
        oldCode = null;
        continue;
      }

      if (oldCode === null) {
        oldCode = code;
        buf.push(table[code][0]);
        continue;
      }

      if (code < ntable) {
        for (i = code; i >= 0; i = table[i][1]) {
          stack.push(table[i][0]);
        }
        table[ntable++] = [
          table[code][2],
          oldCode,
          table[oldCode][2]
        ];
      } else {
        K = table[oldCode][2];
        table[ntable++] = [K, oldCode, K];
        for (i = code; i >= 0; i = table[i][1]) {
          stack.push(table[i][0]);
        }
      }

      oldCode = code;
      if (ntable === maxElem) {
        maxElem = 1 << (++bitDepth);
        if (bitDepth > 12) bitDepth = 12;
      }
    }
    b = stack.pop();
    if (b == null) break;
    buf.push(b);
  }

  return buf;
};

/**
 * Expose
 */

exports = PNG;
exports.png = PNG;
exports.gif = GIF;

module.exports = exports;
};
BundleModuleCode['term/widgets/overlayimage']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    sbosse (2017).
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 *
 * overlayimage.js - w3m image element for blessed
 *
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var fs = Require('fs')
  , cp = Require('child_process');

var helpers = Require('term/helpers');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * OverlayImage
 * Good example of w3mimgdisplay commands:
 * https://github.com/hut/ranger/blob/master/ranger/ext/img_display.py
 */

function OverlayImage(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new OverlayImage(options);
  }

  options = options || {};

  Box.call(this, options);

  if (options.w3m) {
    OverlayImage.w3mdisplay = options.w3m;
  }

  if (OverlayImage.hasW3MDisplay == null) {
    if (fs.existsSync(OverlayImage.w3mdisplay)) {
      OverlayImage.hasW3MDisplay = true;
    } else if (options.search !== false) {
      var file = helpers.findFile('/usr', 'w3mimgdisplay')
              || helpers.findFile('/lib', 'w3mimgdisplay')
              || helpers.findFile('/bin', 'w3mimgdisplay');
      if (file) {
        OverlayImage.hasW3MDisplay = true;
        OverlayImage.w3mdisplay = file;
      } else {
        OverlayImage.hasW3MDisplay = false;
      }
    }
  }

  this.on('hide', function() {
    self._lastFile = self.file;
    self.clearImage();
  });

  this.on('show', function() {
    if (!self._lastFile) return;
    self.setImage(self._lastFile);
  });

  this.on('detach', function() {
    self._lastFile = self.file;
    self.clearImage();
  });

  this.on('attach', function() {
    if (!self._lastFile) return;
    self.setImage(self._lastFile);
  });

  this.onScreenEvent('resize', function() {
    self._needsRatio = true;
  });

  // Get images to overlap properly. Maybe not worth it:
  // this.onScreenEvent('render', function() {
  //   self.screen.program.flush();
  //   if (!self._noImage) return;
  //   function display(el, next) {
  //     if (el.type === 'w3mimage' && el.file) {
  //       el.setImage(el.file, next);
  //     } else {
  //       next();
  //     }
  //   }
  //   function done(el) {
  //     el.children.forEach(recurse);
  //   }
  //   function recurse(el) {
  //     display(el, function() {
  //       var pending = el.children.length;
  //       el.children.forEach(function(el) {
  //         display(el, function() {
  //           if (!--pending) done(el);
  //         });
  //       });
  //     });
  //   }
  //   recurse(self.screen);
  // });

  this.onScreenEvent('render', function() {
    self.screen.program.flush();
    if (!self._noImage) {
      self.setImage(self.file);
    }
  });

  if (this.options.file || this.options.img) {
    this.setImage(this.options.file || this.options.img);
  }
}

//OverlayImage.prototype.__proto__ = Box.prototype;
inheritPrototype(OverlayImage,Box);

OverlayImage.prototype.type = 'overlayimage';

OverlayImage.w3mdisplay = '/usr/lib/w3m/w3mimgdisplay';

OverlayImage.prototype.spawn = function(file, args, opt, callback) {
  var spawn = require('child_process').spawn
    , ps;

  opt = opt || {};
  ps = spawn(file, args, opt);

  ps.on('error', function(err) {
    if (!callback) return;
    return callback(err);
  });

  ps.on('exit', function(code) {
    if (!callback) return;
    if (code !== 0) return callback(new Error('Exit Code: ' + code));
    return callback(null, code === 0);
  });

  return ps;
};

OverlayImage.prototype.setImage = function(img, callback) {
  var self = this;

  if (this._settingImage) {
    this._queue = this._queue || [];
    this._queue.push([img, callback]);
    return;
  }
  this._settingImage = true;

  var reset = function() {
    self._settingImage = false;
    self._queue = self._queue || [];
    var item = self._queue.shift();
    if (item) {
      self.setImage(item[0], item[1]);
    }
  };

  if (OverlayImage.hasW3MDisplay === false) {
    reset();
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  if (!img) {
    reset();
    if (!callback) return;
    return callback(new Error('No image.'));
  }

  this.file = img;

  return this.getPixelRatio(function(err, ratio) {
    if (err) {
      reset();
      if (!callback) return;
      return callback(err);
    }

    return self.renderImage(img, ratio, function(err, success) {
      if (err) {
        reset();
        if (!callback) return;
        return callback(err);
      }

      if (self.shrink || self.options.autofit) {
        delete self.shrink;
        delete self.options.shrink;
        self.options.autofit = true;
        return self.imageSize(function(err, size) {
          if (err) {
            reset();
            if (!callback) return;
            return callback(err);
          }

          if (self._lastSize
              && ratio.tw === self._lastSize.tw
              && ratio.th === self._lastSize.th
              && size.width === self._lastSize.width
              && size.height === self._lastSize.height
              && self.aleft === self._lastSize.aleft
              && self.atop === self._lastSize.atop) {
            reset();
            if (!callback) return;
            return callback(null, success);
          }

          self._lastSize = {
            tw: ratio.tw,
            th: ratio.th,
            width: size.width,
            height: size.height,
            aleft: self.aleft,
            atop: self.atop
          };

          self.position.width = size.width / ratio.tw | 0;
          self.position.height = size.height / ratio.th | 0;

          self._noImage = true;
          self.screen.render();
          self._noImage = false;

          reset();
          return self.renderImage(img, ratio, callback);
        });
      }

      reset();
      if (!callback) return;
      return callback(null, success);
    });
  });
};

OverlayImage.prototype.renderImage = function(img, ratio, callback) {
  var self = this;

  if (cp.execSync) {
    callback = callback || function(err, result) { return result; };
    try {
      return callback(null, this.renderImageSync(img, ratio));
    } catch (e) {
      return callback(e);
    }
  }

  if (OverlayImage.hasW3MDisplay === false) {
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  if (!ratio) {
    if (!callback) return;
    return callback(new Error('No ratio.'));
  }

  // clearImage unsets these:
  var _file = self.file;
  var _lastSize = self._lastSize;
  return self.clearImage(function(err) {
    if (err) return callback(err);

    self.file = _file;
    self._lastSize = _lastSize;

    var opt = {
      stdio: 'pipe',
      env: process.env,
      cwd: process.env.HOME
    };

    var ps = self.spawn(OverlayImage.w3mdisplay, [], opt, function(err, success) {
      if (!callback) return;
      return err
        ? callback(err)
        : callback(null, success);
    });

    var width = self.width * ratio.tw | 0
      , height = self.height * ratio.th | 0
      , aleft = self.aleft * ratio.tw | 0
      , atop = self.atop * ratio.th | 0;

    var input = '0;1;'
      + aleft + ';'
      + atop + ';'
      + width + ';'
      + height + ';;;;;'
      + img
      + '\n4;\n3;\n';

    self._props = {
      aleft: aleft,
      atop: atop,
      width: width,
      height: height
    };

    ps.stdin.write(input);
    ps.stdin.end();
  });
};

OverlayImage.prototype.clearImage = function(callback) {
  if (cp.execSync) {
    callback = callback || function(err, result) { return result; };
    try {
      return callback(null, this.clearImageSync());
    } catch (e) {
      return callback(e);
    }
  }

  if (OverlayImage.hasW3MDisplay === false) {
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  if (!this._props) {
    if (!callback) return;
    return callback(null);
  }

  var opt = {
    stdio: 'pipe',
    env: process.env,
    cwd: process.env.HOME
  };

  var ps = this.spawn(OverlayImage.w3mdisplay, [], opt, function(err, success) {
    if (!callback) return;
    return err
      ? callback(err)
      : callback(null, success);
  });

  var width = this._props.width + 2
    , height = this._props.height + 2
    , aleft = this._props.aleft
    , atop = this._props.atop;

  if (this._drag) {
    aleft -= 10;
    atop -= 10;
    width += 10;
    height += 10;
  }

  var input = '6;'
   + aleft + ';'
   + atop + ';'
   + width + ';'
   + height
   + '\n4;\n3;\n';

  delete this.file;
  delete this._props;
  delete this._lastSize;

  ps.stdin.write(input);
  ps.stdin.end();
};

OverlayImage.prototype.imageSize = function(callback) {
  var img = this.file;

  if (cp.execSync) {
    callback = callback || function(err, result) { return result; };
    try {
      return callback(null, this.imageSizeSync());
    } catch (e) {
      return callback(e);
    }
  }

  if (OverlayImage.hasW3MDisplay === false) {
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  if (!img) {
    if (!callback) return;
    return callback(new Error('No image.'));
  }

  var opt = {
    stdio: 'pipe',
    env: process.env,
    cwd: process.env.HOME
  };

  var ps = this.spawn(OverlayImage.w3mdisplay, [], opt);

  var buf = '';

  ps.stdout.setEncoding('utf8');

  ps.stdout.on('data', function(data) {
    buf += data;
  });

  ps.on('error', function(err) {
    if (!callback) return;
    return callback(err);
  });

  ps.on('exit', function() {
    if (!callback) return;
    var size = buf.trim().split(/\s+/);
    return callback(null, {
      raw: buf.trim(),
      width: +size[0],
      height: +size[1]
    });
  });

  var input = '5;' + img + '\n';

  ps.stdin.write(input);
  ps.stdin.end();
};

OverlayImage.prototype.termSize = function(callback) {
  var self = this;

  if (cp.execSync) {
    callback = callback || function(err, result) { return result; };
    try {
      return callback(null, this.termSizeSync());
    } catch (e) {
      return callback(e);
    }
  }

  if (OverlayImage.hasW3MDisplay === false) {
    if (!callback) return;
    return callback(new Error('W3M Image Display not available.'));
  }

  var opt = {
    stdio: 'pipe',
    env: process.env,
    cwd: process.env.HOME
  };

  var ps = this.spawn(OverlayImage.w3mdisplay, ['-test'], opt);

  var buf = '';

  ps.stdout.setEncoding('utf8');

  ps.stdout.on('data', function(data) {
    buf += data;
  });

  ps.on('error', function(err) {
    if (!callback) return;
    return callback(err);
  });

  ps.on('exit', function() {
    if (!callback) return;

    if (!buf.trim()) {
      // Bug: w3mimgdisplay will sometimes
      // output nothing. Try again:
      return self.termSize(callback);
    }

    var size = buf.trim().split(/\s+/);

    return callback(null, {
      raw: buf.trim(),
      width: +size[0],
      height: +size[1]
    });
  });

  ps.stdin.end();
};

OverlayImage.prototype.getPixelRatio = function(callback) {
  var self = this;

  if (cp.execSync) {
    callback = callback || function(err, result) { return result; };
    try {
      return callback(null, this.getPixelRatioSync());
    } catch (e) {
      return callback(e);
    }
  }

  // XXX We could cache this, but sometimes it's better
  // to recalculate to be pixel perfect.
  if (this._ratio && !this._needsRatio) {
    return callback(null, this._ratio);
  }

  return this.termSize(function(err, dimensions) {
    if (err) return callback(err);

    self._ratio = {
      tw: dimensions.width / self.screen.width,
      th: dimensions.height / self.screen.height
    };

    self._needsRatio = false;

    return callback(null, self._ratio);
  });
};

OverlayImage.prototype.renderImageSync = function(img, ratio) {
  if (OverlayImage.hasW3MDisplay === false) {
    throw new Error('W3M Image Display not available.');
  }

  if (!ratio) {
    throw new Error('No ratio.');
  }

  // clearImage unsets these:
  var _file = this.file;
  var _lastSize = this._lastSize;

  this.clearImageSync();

  this.file = _file;
  this._lastSize = _lastSize;

  var width = this.width * ratio.tw | 0
    , height = this.height * ratio.th | 0
    , aleft = this.aleft * ratio.tw | 0
    , atop = this.atop * ratio.th | 0;

  var input = '0;1;'
    + aleft + ';'
    + atop + ';'
    + width + ';'
    + height + ';;;;;'
    + img
    + '\n4;\n3;\n';

  this._props = {
    aleft: aleft,
    atop: atop,
    width: width,
    height: height
  };

  try {
    cp.execFileSync(OverlayImage.w3mdisplay, [], {
      env: process.env,
      encoding: 'utf8',
      input: input,
      timeout: 1000
    });
  } catch (e) {
    ;
  }

  return true;
};

OverlayImage.prototype.clearImageSync = function() {
  if (OverlayImage.hasW3MDisplay === false) {
    throw new Error('W3M Image Display not available.');
  }

  if (!this._props) {
    return false;
  }

  var width = this._props.width + 2
    , height = this._props.height + 2
    , aleft = this._props.aleft
    , atop = this._props.atop;

  if (this._drag) {
    aleft -= 10;
    atop -= 10;
    width += 10;
    height += 10;
  }

  var input = '6;'
   + aleft + ';'
   + atop + ';'
   + width + ';'
   + height
   + '\n4;\n3;\n';

  delete this.file;
  delete this._props;
  delete this._lastSize;

  try {
    cp.execFileSync(OverlayImage.w3mdisplay, [], {
      env: process.env,
      encoding: 'utf8',
      input: input,
      timeout: 1000
    });
  } catch (e) {
    ;
  }

  return true;
};

OverlayImage.prototype.imageSizeSync = function() {
  var img = this.file;

  if (OverlayImage.hasW3MDisplay === false) {
    throw new Error('W3M Image Display not available.');
  }

  if (!img) {
    throw new Error('No image.');
  }

  var buf = '';
  var input = '5;' + img + '\n';

  try {
    buf = cp.execFileSync(OverlayImage.w3mdisplay, [], {
      env: process.env,
      encoding: 'utf8',
      input: input,
      timeout: 1000
    });
  } catch (e) {
    ;
  }

  var size = buf.trim().split(/\s+/);

  return {
    raw: buf.trim(),
    width: +size[0],
    height: +size[1]
  };
};

OverlayImage.prototype.termSizeSync = function(_, recurse) {
  if (OverlayImage.hasW3MDisplay === false) {
    throw new Error('W3M Image Display not available.');
  }

  var buf = '';

  try {
    buf = cp.execFileSync(OverlayImage.w3mdisplay, ['-test'], {
      env: process.env,
      encoding: 'utf8',
      timeout: 1000
    });
  } catch (e) {
    ;
  }

  if (!buf.trim()) {
    // Bug: w3mimgdisplay will sometimes
    // output nothing. Try again:
    recurse = recurse || 0;
    if (++recurse === 5) {
      throw new Error('Term size not determined.');
    }
    return this.termSizeSync(_, recurse);
  }

  var size = buf.trim().split(/\s+/);

  return {
    raw: buf.trim(),
    width: +size[0],
    height: +size[1]
  };
};

OverlayImage.prototype.getPixelRatioSync = function() {
  // XXX We could cache this, but sometimes it's better
  // to recalculate to be pixel perfect.
  if (this._ratio && !this._needsRatio) {
    return this._ratio;
  }
  this._needsRatio = false;

  var dimensions = this.termSizeSync();

  this._ratio = {
    tw: dimensions.width / this.screen.width,
    th: dimensions.height / this.screen.height
  };

  return this._ratio;
};

OverlayImage.prototype.displayImage = function(callback) {
  return this.screen.displayImage(this.file, callback);
};

/**
 * Expose
 */

module.exports = OverlayImage;
};
BundleModuleCode['term/widgets/video']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    sbosse (2017).
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 *
 * video.js - video element for blessed
 *
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var cp = Require('child_process');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Terminal = Require('term/widgets/terminal');

/**
 * Video
 */

function Video(options) {
  var self = this
    , shell
    , args;

  if (!instanceOf(this,Node)) {
    return new Video(options);
  }

  options = options || {};

  Box.call(this, options);

  if (this.exists('mplayer')) {
    shell = 'mplayer';
    args = ['-vo', 'caca', '-quiet', options.file];
  } else if (this.exists('mpv')) {
    shell = 'mpv';
    args = ['--vo', 'caca', '--really-quiet', options.file];
  } else {
    this.parseTags = true;
    this.setContent('{red-fg}{bold}Error:{/bold}'
      + ' mplayer or mpv not installed.{/red-fg}');
    return this;
  }

  var opts = {
    parent: this,
    left: 0,
    top: 0,
    width: this.width - this.iwidth,
    height: this.height - this.iheight,
    shell: shell,
    args: args.slice()
  };

  this.now = Date.now() / 1000 | 0;
  this.start = opts.start || 0;
  if (this.start) {
    if (shell === 'mplayer') {
      opts.args.unshift('-ss', this.start + '');
    } else if (shell === 'mpv') {
      opts.args.unshift('--start', this.start + '');
    }
  }

  var DISPLAY = process.env.DISPLAY;
  delete process.env.DISPLAY;
  this.tty = new Terminal(opts);
  process.env.DISPLAY = DISPLAY;

  this.on('click', function() {
    self.tty.pty.write('p');
  });

  // mplayer/mpv cannot resize itself in the terminal, so we have
  // to restart it at the correct start time.
  this.on('resize', function() {
    self.tty.destroy();

    var opts = {
      parent: self,
      left: 0,
      top: 0,
      width: self.width - self.iwidth,
      height: self.height - self.iheight,
      shell: shell,
      args: args.slice()
    };

    var watched = (Date.now() / 1000 | 0) - self.now;
    self.now = Date.now() / 1000 | 0;
    self.start += watched;
    if (shell === 'mplayer') {
      opts.args.unshift('-ss', self.start + '');
    } else if (shell === 'mpv') {
      opts.args.unshift('--start', self.start + '');
    }

    var DISPLAY = process.env.DISPLAY;
    delete process.env.DISPLAY;
    self.tty = new Terminal(opts);
    process.env.DISPLAY = DISPLAY;
    self.screen.render();
  });
}

//Video.prototype.__proto__ = Box.prototype;
inheritPrototype(Video,Box);

Video.prototype.type = 'video';

Video.prototype.exists = function(program) {
  try {
    return !!+cp.execSync('type '
      + program + ' > /dev/null 2> /dev/null'
      + ' && echo 1', { encoding: 'utf8' }).trim();
  } catch (e) {
    return false;
  }
};

/**
 * Expose
 */

module.exports = Video;
};
BundleModuleCode['term/widgets/layout']=function (module,exports,global,process){
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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    layout.js - layout element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Element = Require('term/widgets/element');

/**
 * Layout
 */

function Layout(options) {
  if (!instanceOf(this,Node)) {
    return new Layout(options);
  }

  options = options || {};

  if ((options.width == null
      && (options.left == null && options.right == null))
      || (options.height == null
      && (options.top == null && options.bottom == null))) {
    throw new Error('`Layout` must have a width and height!');
  }

  options.layout = options.layout || 'inline';

  Element.call(this, options);

  if (options.renderer) {
    this.renderer = options.renderer;
  }
}

//Layout.prototype.__proto__ = Element.prototype;
inheritPrototype(Layout,Element);

Layout.prototype.type = 'layout';

Layout.prototype.isRendered = function(el) {
  if (!el.lpos) return false;
  return (el.lpos.xl - el.lpos.xi) > 0
      && (el.lpos.yl - el.lpos.yi) > 0;
};

Layout.prototype.getLast = function(i) {
  while (this.children[--i]) {
    var el = this.children[i];
    if (this.isRendered(el)) return el;
  }
};

Layout.prototype.getLastCoords = function(i) {
  var last = this.getLast(i);
  if (last) return last.lpos;
};

Layout.prototype._renderCoords = function() {
  var coords = this._getCoords(true);
  var children = this.children;
  this.children = [];
  this._render();
  this.children = children;
  return coords;
};

Layout.prototype.renderer = function(coords) {
  var self = this;

  // The coordinates of the layout element
  var width = coords.xl - coords.xi
    , height = coords.yl - coords.yi
    , xi = coords.xi
    , yi = coords.yi;

  // The current row offset in cells (which row are we on?)
  var rowOffset = 0;

  // The index of the first child in the row
  var rowIndex = 0;
  var lastRowIndex = 0;

  // Figure out the highest width child
  if (this.options.layout === 'grid') {
    var highWidth = this.children.reduce(function(out, el) {
      out = Math.max(out, el.width);
      return out;
    }, 0);
  }

  return function iterator(el, i) {
    // Make our children shrinkable. If they don't have a height, for
    // example, calculate it for them.
    el.shrink = true;

    // Find the previous rendered child's coordinates
    var last = self.getLast(i);

    // If there is no previously rendered element, we are on the first child.
    if (!last) {
      el.position.left = 0;
      el.position.top = 0;
    } else {
      // Otherwise, figure out where to place this child. We'll start by
      // setting it's `left`/`x` coordinate to right after the previous
      // rendered element. This child will end up directly to the right of it.
      el.position.left = last.lpos.xl - xi;

      // Make sure the position matches the highest width element
      if (self.options.layout === 'grid') {
        // Compensate with width:
        // el.position.width = el.width + (highWidth - el.width);
        // Compensate with position:
        el.position.left += highWidth - (last.lpos.xl - last.lpos.xi);
      }

      // If our child does not overlap the right side of the Layout, set it's
      // `top`/`y` to the current `rowOffset` (the coordinate for the current
      // row).
      if (el.position.left + el.width <= width) {
        el.position.top = rowOffset;
      } else {
        // Otherwise we need to start a new row and calculate a new
        // `rowOffset` and `rowIndex` (the index of the child on the current
        // row).
        rowOffset += self.children.slice(rowIndex, i).reduce(function(out, el) {
          if (!self.isRendered(el)) return out;
          out = Math.max(out, el.lpos.yl - el.lpos.yi);
          return out;
        }, 0);
        lastRowIndex = rowIndex;
        rowIndex = i;
        el.position.left = 0;
        el.position.top = rowOffset;
      }
    }

    // Make sure the elements on lower rows graviatate up as much as possible
    if (self.options.layout === 'inline') {
      var above = null;
      var abovea = Infinity;
      for (var j = lastRowIndex; j < rowIndex; j++) {
        var l = self.children[j];
        if (!self.isRendered(l)) continue;
        var abs = Math.abs(el.position.left - (l.lpos.xi - xi));
        // if (abs < abovea && (l.lpos.xl - l.lpos.xi) <= el.width) {
        if (abs < abovea) {
          above = l;
          abovea = abs;
        }
      }
      if (above) {
        el.position.top = above.lpos.yl - yi;
      }
    }

    // If our child overflows the Layout, do not render it!
    // Disable this feature for now.
    if (el.position.top + el.height > height) {
      // Returning false tells blessed to ignore this child.
      // return false;
    }
  };
};

Layout.prototype.render = function() {
  this._emit('prerender');

  var coords = this._renderCoords();
  if (!coords) {
    delete this.lpos;
    return;
  }

  if (coords.xl - coords.xi <= 0) {
    coords.xl = Math.max(coords.xl, coords.xi);
    return;
  }

  if (coords.yl - coords.yi <= 0) {
    coords.yl = Math.max(coords.yl, coords.yi);
    return;
  }

  this.lpos = coords;

  if (this.border) coords.xi++, coords.xl--, coords.yi++, coords.yl--;
  if (this.tpadding) {
    coords.xi += this.padding.left, coords.xl -= this.padding.right;
    coords.yi += this.padding.top, coords.yl -= this.padding.bottom;
  }

  var iterator = this.renderer(coords);

  if (this.border) coords.xi--, coords.xl++, coords.yi--, coords.yl++;
  if (this.tpadding) {
    coords.xi -= this.padding.left, coords.xl += this.padding.right;
    coords.yi -= this.padding.top, coords.yl += this.padding.bottom;
  }

  this.children.forEach(function(el, i) {
    if (el.screen._ci !== -1) {
      el.index = el.screen._ci++;
    }
    var rendered = iterator(el, i);
    if (rendered === false) {
      delete el.lpos;
      return;
    }
    // if (el.screen._rendering) {
    //   el._rendering = true;
    // }
    el.render();
    // if (el.screen._rendering) {
    //   el._rendering = false;
    // }
  });

  this._emit('render', [coords]);

  return coords;
};

/**
 * Expose
 */

module.exports = Layout;
};
BundleModuleCode['term/widgets/tree']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2017-2018)
 **    $REVESIO:     1.3.1
 **
 **    $INFO:
 **
 **    Tree Widget
 **
 **     Added:
 **       - 'preselect' event emission on node selection. The preselection
 **        event allows node children modificiation before screen rendering.
 **       - 'arrows', optional arrow buttons
 **
 **     Events Out: preselect(node), select(node), selected(node)
 **
 **     Node label text: node.name
 **     Node parent element: node.parent 
 **     Get path:
 **       var path=node.name;
 **       node=node.parent;
 **       while(node) 
 **         path=node.name+(node.name!='/'?'/':'')+path,
 **         node=node.parent;
 **
 **
 **    $ENDOFINFO
 */

var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var List = Require('term/widgets/list');
var Arrows = Require('term/widgets/arrows');

function Tree(options) {  
  var self=this,
      height=0;
  function strequal(str1,str2) {
        var i;
        var eq=true;
        if (str1.length != str2.length) return false;
        for(i=0;i<str1.length;i++) { if (str1.charAt(i)!=str2.charAt(i)) eq=false;}
        return eq;
  };

  if (!instanceOf(this,Node)) {
   return new Tree(options);
  }

  options = options || {};
  if (!options.style) options.style = {
      border: {
        fg: 'black'
      },
      focus: {
        border: {
          fg: 'red'
        }
      }
  };
  if (!options.border) options.border = {
      type:'line'
  };

  options.style.border._fg=options.style.border.fg; // save border style, can change
  options.bold = true;
  var self = this;
  this.options = options;
  this.data = {};
  this.nodeLines = [];
  this.lineNbr = 0;
  this.init=true;
  Box.call(this, options);

  var boxfocus=this.focus;
  
  if (options.height) {
    if (typeof options.height == 'number') height=options.height;
    else if (typeof options.height == 'string') {
        var perc=0;
        perc=parseInt(options.height);
        height=this.screen.height*perc/100;
    }
  }
  
  options.extended = options.extended || false;
  options.keys = options.keys || ['space','enter'];

  options.template = options.template || {};
  options.template.extend = options.template.extend || ' [+]';
  options.template.retract = options.template.retract || ' [-]';
  options.template.lines = options.template.lines || true;

  this.listOptions = {
          height: 0,
          top: 1,
          width: 0,
          left: 1,    
          selectedFg: 'white',
          selectedBg: 'blue',
          fg: "green",
          keys: true ,
          mouse:true ,
          selectoffset:height>8?4:2,
          };
          
  if (!options.scrollbar) this.listOptions.scrollbar = 
  {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        fg: 'cyan',
        inverse: true
      }
  }; 
  else if (options.scrollbar != null) 
    this.listOptions.scrollbar = options.scrollbar;

  /*
  ** Tree content
  */
  this.list = new List(this.listOptions);

  
  this.list.key(options.keys,function(){
    var ind = this.getItemIndex(this.selected);
    var line = self.nodeLines[ind];
    self.emit('preselect',line);
    self.nodeLines[ind].extended = !self.nodeLines[ind].extended;
    self.setData(self.data);
    self.screen.render();
    self.emit('select',line);
  });
  this.list.on('element click',function(w,ev){
    var ind = this.getItemIndex(this.selected);
    //console.log(ind)
    var line = self.nodeLines[ind];
    var pos = ev.x-w.aleft;
    var item = this.ritems[ind];
    if (item) {
      self.emit('preselect',line);
      var len1 = self.options.template.extend.length;
      var len2 = self.options.template.retract.length;
      var roi1 = item.indexOf(self.options.template.extend);
      var roi2 = item.indexOf(self.options.template.retract);
      if ((pos > roi1 && pos < roi1+len1) ||
          (pos > roi2 && pos < roi2+len1)) {
        self.nodeLines[ind].extended = !self.nodeLines[ind].extended;
        self.setData(self.data);
        self.screen.render();
        self.emit('select',line);    
      }
    }
  });

  if (options.arrows) 
    Arrows(
      self,
      options,
      function () { self.list.select(self.list.selected - 2); self.screen.render()},
      function () { self.list.select(self.list.selected + 2); self.screen.render()}
    );

  this.on('mousedown', function(data) {
    self.focus();
    Box.prototype.render.call(self);
    self.screen.render();
  });

  // Propagate selection events of list items ...
  this.list.on('selected', function() {
    var ind = this.getItemIndex(this.selected);
    var line = self.nodeLines[ind];
    self.emit('selected',line);
  });
  this.append(this.list);
  
}

Tree.prototype.walk = function (node,treeDepth) {

  var lines = [];

  if (!node.parent)
    node.parent = null;

  if (treeDepth == '' && node.name) {
    this.lineNbr = 0;
    this.nodeLines[this.lineNbr++] = node;
    lines.push(node.name);
    treeDepth = ' ';
  }

  node.depth = treeDepth.length-1;

  if (node.children && node.extended) {

    var i = 0;
    
    if (typeof node.children == 'function')
      node.childrenContent = node.children(node);
    
    if(!node.childrenContent)
      node.childrenContent = node.children;

    for (var child in node.childrenContent) {
      
      if(!node.childrenContent[child].name)
        node.childrenContent[child].name = child;

      var childIndex = child;
      child = node.childrenContent[child];
      child.parent = node;
      child.position = i++;
      
      if(typeof child.extended == 'undefined')
        child.extended = this.options.extended;
      
      if (typeof child.children == 'function')
        child.childrenContent = child.children(child);
      else
        child.childrenContent = child.children;
      
      var isLastChild = child.position == Object.keys(child.parent.childrenContent).length - 1;
      var tree;
      var suffix = '';
      if (isLastChild) {
        tree = '└';
      } else {
        tree = '├';
      }
      if (!child.childrenContent || Object.keys(child.childrenContent).length == 0){
        tree += '─';
      } else if(child.extended) {
        tree += '┬';
        suffix = this.options.template.retract;
      } else {
        tree += '─';
        suffix = this.options.template.extend;
      }

      if (!this.options.template.lines){
        tree = '|-';
      }

      lines.push(treeDepth + tree + child.name + suffix);

      this.nodeLines[this.lineNbr++] = child;

      var parentTree;
      if (isLastChild || !this.options.template.lines){
        parentTree = treeDepth+" ";
      } else {
        parentTree = treeDepth+"│";
      }
      lines = lines.concat(this.walk(child, parentTree));
    }
  }
  return lines;
}

Tree.prototype.focus = function(){
  this.list.focus();
}


Tree.prototype.render = function() {
//console.log(this.style.border._fg)
  if((this.screen.focused == this.list || this.screen.focused == this)) {
    // List is focussed, propagate style changes to the Box element.
    if (this.style.focus.border.fg) this.style.border.fg=this.style.focus.border.fg;  
  } else if ((this.screen.focused != this.list && this.screen.focused != this)) {
    // List is not focussed, restore style changes of the Box element.
    if (this.style.border._fg) this.style.border.fg=this.style.border._fg;
  }

  this.list.width = this.width-3;
  this.list.height = this.height-3;
  Box.prototype.render.call(this);
}

Tree.prototype.setData = function(data) {
  var formatted = [];
  formatted = this.walk(data,'');
  this.data = data;
  if (this.init) {
    this.screen.render();
    this.init=false;
  };
  this.list.setItems(formatted);
  this.screen.render();
}

//Tree.prototype.__proto__ = Box.prototype;
inheritPrototype(Tree,Box);

Tree.prototype.type = 'tree';

module.exports = Tree
};
FilesEmbedded['term/def/xterm']=function (format){return Base64.decodeBuf('GgEcACYADwCdAWwFeHRlcm18WDExIHRlcm1pbmFsIGVtdWxhdG9yAAABAAABAAAAAQAAAAABAQAAAAAAAAABAAABAAABAAAAAAAAAAABUAAIABgA//////////////////////////8IAEAAAAAEAAYACAAZAB4AJgAqAC4A//85AEoATABQAFcA//9ZAGYA//9qAG4AeAB8AP////+AAIQAiQCOAP////+XAJwA//+hAKYAqwCwALkAvQDEAP//zQDSANgA3gD////////wAP///////wIB//8GAf///////wgB//8NAf//////////EQEVARsBHwEjAScBLQEzATkBPwFFAUkB//9OAf//UgFXAVwBYAFnAf//bgFyAXoB/////////////////////////////4IBiwH/////lAGdAaYBrwG4AcEBygHTAdwB5QH////////uAfIB9wH///wB/wH/////EQIUAh8CIgIkAicCeQL//3wC////////////////fgL//////////4IC//+3Av////+7AsEC/////////////////////////////8cCywL//////////////////////////////////////////////////////////////////88C/////9YC///////////dAuQC6wL/////8gL///kC////////AAP/////////////BwMNAxMDGgMhAygDLwM3Az8DRwNPA1cDXwNnA28DdgN9A4QDiwOTA5sDowOrA7MDuwPDA8sD0gPZA+AD5wPvA/cD/wMHBA8EFwQfBCcELgQ1BDwEQwRLBFMEWwRjBGsEcwR7BIMEigSRBJgE/////////////////////////////////////////////////////////////50EqAStBLUEuQT//////////8IECAX///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////9OBf///////1IFXAX/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////ZgVpBRtbWgAHAA0AG1slaSVwMSVkOyVwMiVkcgAbWzNnABtbSBtbMkoAG1tLABtbSgAbWyVpJXAxJWRHABtbJWklcDElZDslcDIlZEgACgAbW0gAG1s/MjVsAAgAG1s/MTJsG1s/MjVoABtbQwAbW0EAG1s/MTI7MjVoABtbUAAbW00AGygwABtbNW0AG1sxbQAbWz8xMDQ5aAAbWzRoABtbOG0AG1s3bQAbWzdtABtbNG0AG1slcDElZFgAGyhCABsoQhtbbQAbWz8xMDQ5bAAbWzRsABtbMjdtABtbMjRtABtbPzVoJDwxMDAvPhtbPzVsABtbIXAbWz8zOzRsG1s0bBs+ABtbTAAIABtbM34AG09CABtPUAAbWzIxfgAbT1EAG09SABtPUwAbWzE1fgAbWzE3fgAbWzE4fgAbWzE5fgAbWzIwfgAbT0gAG1syfgAbT0QAG1s2fgAbWzV+ABtPQwAbWzE7MkIAG1sxOzJBABtPQQAbWz8xbBs+ABtbPzFoGz0AG1s/MTAzNGwAG1s/MTAzNGgAG1slcDElZFAAG1slcDElZE0AG1slcDElZEIAG1slcDElZEAAG1slcDElZFMAG1slcDElZEwAG1slcDElZEQAG1slcDElZEMAG1slcDElZFQAG1slcDElZEEAG1tpABtbNGkAG1s1aQAbYwAbWyFwG1s/Mzs0bBtbNGwbPgAbOAAbWyVpJXAxJWRkABs3AAoAG00AJT8lcDkldBsoMCVlGyhCJTsbWzAlPyVwNiV0OzElOyU/JXAyJXQ7NCU7JT8lcDElcDMlfCV0OzclOyU/JXA0JXQ7NSU7JT8lcDcldDs4JTttABtIAAkAG09FAGBgYWFmZmdnaWlqamtrbGxtbW5ub29wcHFxcnJzc3R0dXV2dnd3eHh5eXp6e3t8fH19fn4AG1taABtbPzdoABtbPzdsABtPRgAbT00AG1szOzJ+ABtbMTsyRgAbWzE7MkgAG1syOzJ+ABtbMTsyRAAbWzY7Mn4AG1s1OzJ+ABtbMTsyQwAbWzIzfgAbWzI0fgAbWzE7MlAAG1sxOzJRABtbMTsyUgAbWzE7MlMAG1sxNTsyfgAbWzE3OzJ+ABtbMTg7Mn4AG1sxOTsyfgAbWzIwOzJ+ABtbMjE7Mn4AG1syMzsyfgAbWzI0OzJ+ABtbMTs1UAAbWzE7NVEAG1sxOzVSABtbMTs1UwAbWzE1OzV+ABtbMTc7NX4AG1sxODs1fgAbWzE5OzV+ABtbMjA7NX4AG1syMTs1fgAbWzIzOzV+ABtbMjQ7NX4AG1sxOzZQABtbMTs2UQAbWzE7NlIAG1sxOzZTABtbMTU7Nn4AG1sxNzs2fgAbWzE4OzZ+ABtbMTk7Nn4AG1syMDs2fgAbWzIxOzZ+ABtbMjM7Nn4AG1syNDs2fgAbWzE7M1AAG1sxOzNRABtbMTszUgAbWzE7M1MAG1sxNTszfgAbWzE3OzN+ABtbMTg7M34AG1sxOTszfgAbWzIwOzN+ABtbMjE7M34AG1syMzszfgAbWzI0OzN+ABtbMTs0UAAbWzE7NFEAG1sxOzRSABtbMUsAG1slaSVkOyVkUgAbWzZuABtbPzE7MmMAG1tjABtbMzk7NDltABtbMyU/JXAxJXsxfSU9JXQ0JWUlcDElezN9JT0ldDYlZSVwMSV7NH0lPSV0MSVlJXAxJXs2fSU9JXQzJWUlcDElZCU7bQAbWzQlPyVwMSV7MX0lPSV0NCVlJXAxJXszfSU9JXQ2JWUlcDElezR9JT0ldDElZSVwMSV7Nn0lPSV0MyVlJXAxJWQlO20AG1tNABtbMyVwMSVkbQAbWzQlcDElZG0AG2wAG20AAgAAAD4AfgDvAgEBAAAHABMAGQArADEAOwBCAEkAUABXAF4AZQBsAHMAegCBAIgAjwCWAJ0ApACrALIAuQDAAMcAzgDVANwA4wDqAPEA+AD/AAYBDQEUARsBIgEpATABNwE+AUUBTAFTAVoBYQFoAW8BdgF9AYQBiwGSAZkBoAH//////////wAAAwAGAAkADAAPABIAFQAYAB0AIgAnACwAMQA1ADoAPwBEAEkATgBUAFoAYABmAGwAcgB4AH4AhACKAI8AlACZAJ4AowCpAK8AtQC7AMEAxwDNANMA2QDfAOUA6wDxAPcA/QADAQkBDwEVARsBHwEkASkBLgEzATgBPAFAAUQBG10xMTIHABtdMTI7JXAxJXMHABtbMztKABtdNTI7JXAxJXM7JXAyJXMHABtbMiBxABtbJXAxJWQgcQAbWzM7M34AG1szOzR+ABtbMzs1fgAbWzM7Nn4AG1szOzd+ABtbMTsyQgAbWzE7M0IAG1sxOzRCABtbMTs1QgAbWzE7NkIAG1sxOzdCABtbMTszRgAbWzE7NEYAG1sxOzVGABtbMTs2RgAbWzE7N0YAG1sxOzNIABtbMTs0SAAbWzE7NUgAG1sxOzZIABtbMTs3SAAbWzI7M34AG1syOzR+ABtbMjs1fgAbWzI7Nn4AG1syOzd+ABtbMTszRAAbWzE7NEQAG1sxOzVEABtbMTs2RAAbWzE7N0QAG1s2OzN+ABtbNjs0fgAbWzY7NX4AG1s2OzZ+ABtbNjs3fgAbWzU7M34AG1s1OzR+ABtbNTs1fgAbWzU7Nn4AG1s1Ozd+ABtbMTszQwAbWzE7NEMAG1sxOzVDABtbMTs2QwAbWzE7N0MAG1sxOzJBABtbMTszQQAbWzE7NEEAG1sxOzVBABtbMTs2QQAbWzE7N0EAQVgAWFQAQ3IAQ3MARTMATXMAU2UAU3MAa0RDMwBrREM0AGtEQzUAa0RDNgBrREM3AGtETgBrRE4zAGtETjQAa0RONQBrRE42AGtETjcAa0VORDMAa0VORDQAa0VORDUAa0VORDYAa0VORDcAa0hPTTMAa0hPTTQAa0hPTTUAa0hPTTYAa0hPTTcAa0lDMwBrSUM0AGtJQzUAa0lDNgBrSUM3AGtMRlQzAGtMRlQ0AGtMRlQ1AGtMRlQ2AGtMRlQ3AGtOWFQzAGtOWFQ0AGtOWFQ1AGtOWFQ2AGtOWFQ3AGtQUlYzAGtQUlY0AGtQUlY1AGtQUlY2AGtQUlY3AGtSSVQzAGtSSVQ0AGtSSVQ1AGtSSVQ2AGtSSVQ3AGtVUABrVVAzAGtVUDQAa1VQNQBrVVA2AGtVUDcAa2EyAGtiMQBrYjMAa2MyAA==')};
FilesEmbedded['term/def/windows-ansi']=function (format){return Base64.decodeBuf('GgEoACYAEAB9AUQCYW5zaXxhbnNpL3BjLXRlcm0gY29tcGF0aWJsZSB3aXRoIGNvbG9yAAABAAAAAAAAAAAAAAABAQAAAAAAAAABAAAAAAAAAAAAAAAAAAABUAAIABgA//////////////////////////8IAEAAAwAAAAQABgD//wgADQAUABgAHAD//ycAOAA8AP//QAD/////RAD//0gA//9MAFAA/////1QAWgBfAP//////////ZAD//2kAbgBzAHgAgQCHAP///////48AkwD/////////////////////lwD//5sA/////////////50A/////////////////////////////////////6EApQD//6kA////////rQD///////+xAP///////////////////////////////////////7UA//+6AMMAzADVAN4A5wDwAPkAAgELAf//////////FAEZAR4B/////////////zIB//89Af//PwGVAf//mAH/////////////////////////////nAH//9sB////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////3wH/////////////////////////////////////////////////////////////5AHvAfQBBwILAv//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////FAIeAv///////ygCLAIwAjQC/////////////////////////////zgCPgIbW1oABwANABtbMmcAG1tIG1tKABtbSwAbW0oAG1slaSVwMSVkRwAbWyVpJXAxJWQ7JXAyJWRIABtbQgAbW0gAG1tEABtbQwAbW0EAG1tQABtbTQAbWzExbQAbWzVtABtbMW0AG1s4bQAbWzdtABtbN20AG1s0bQAbWyVwMSVkWAAbWzEwbQAbWzA7MTBtABtbbQAbW20AG1tMAAgAG1tCABtbSAAbW0wAG1tEABtbQwAbW0EADRtbUwAbWyVwMSVkUAAbWyVwMSVkTQAbWyVwMSVkQgAbWyVwMSVkQAAbWyVwMSVkUwAbWyVwMSVkTAAbWyVwMSVkRAAbWyVwMSVkQwAbWyVwMSVkVAAbWyVwMSVkQQAbWzRpABtbNWkAJXAxJWMbWyVwMiV7MX0lLSVkYgAbWyVpJXAxJWRkAAoAG1swOzEwJT8lcDEldDs3JTslPyVwMiV0OzQlOyU/JXAzJXQ7NyU7JT8lcDQldDs1JTslPyVwNiV0OzElOyU/JXA3JXQ7OCU7JT8lcDkldDsxMSU7bQAbSAAbW0kAKxAsES0YLhkw22AEYbGm+C3xaLBq2Wu/bNptwG7Fb35wxHHEcsRzX3TDdbR2wXfCeLN583rye+N82H2cfv4AG1taABtbMUsAG1slaSVkOyVkUgAbWzZuABtbPyVbOzAxMjM0NTY3ODldYwAbW2MAG1szOTs0OW0AG1szJXAxJWRtABtbNCVwMSVkbQAbKEIAGylCABsqQgAbK0IAG1sxMW0AG1sxMG0AAQAAAAAAAQADAAEAAABBWAA=')};

var Base64=Require('os/base64');
module.exports = Require('/home/sbosse/proj/jam/js/ui/app/app.js');
