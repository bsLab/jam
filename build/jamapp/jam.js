var BundleModuleCode=[];
var BundleObjectCode=[];
var BundleModules = [];
var Fs = require("fs");
PATH=[process.cwd(),".","/home/sbosse/proj/jam/js"];
function search(index,file) {
  if (PATH.length==index) return file;
  var path=PATH[index];
  if (Fs.existsSync(path+"/"+file+".js")) return path+"/"+file+".js";
  else if (Fs.existsSync(path+"/"+file)) return path+"/"+file;
  else return search(index+1,file);
 }
global.Require=function(modupath) { 
  var file,filepath;
  if (BundleModules[modupath]) return BundleModules[modupath];
  var exports={}; var module={exports:exports};
  if (BundleModuleCode[modupath]) BundleModuleCode[modupath](module,exports);
  else if (BundleObjectCode[modupath]) BundleObjectCode[modupath](module,exports);
  else { try {  file=search(0,modupath); module = require(file)}
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
   console.log("Require import of "+file+" failed: "+e+more);
   // if (e.stack) console.log(e.stack);
   throw e; // process.exit(-1);
  }}
  BundleModules[modupath]=module.exports||module;
  return module.exports||module;};
global.FilesEmbedded = {};
global.FileEmbedd = function (path,format) {};
global.FileEmbedded = function (path,format) {return FilesEmbedded[path](format);};
global.TARGET='node';

BundleModuleCode['com/io']=function (module,exports){
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
 **    $INITIAL:     (C) 2006-2016 bLAB
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.7.4
 **
 **    $INFO:
 *
 * This module encapsulates all IO operations (except networking) supporting
 * node.js applications.
 *
 **    $ENDOFINFO
 */
/*
 ************
 ** Node.js
 ************
 */
var util = Require('util');
var os = require('os');
var child = require('child_process');
var GetEnv = Require('os/getenv');
var Base64 = Require('os/base64');
var Fs = require('fs');

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
global.open = function(name,as) {
  var module = Require(name);
  for (var p in module) {
    global[p] = module[p];
  };
  if (as) global[as]=module;
}
global.print = console.log;

var io = {
   config: {
       columns:undefined,
       rows:undefined
   },
   /**************
    ** FILE IO
    ***************/
   /**
    *
    * @param fd
    */
   close: function (fd) {
       Fs.closeSync(fd);
   },
   /**
    *
    * @param path
    */
   exists: function (path) {
       return Fs.existsSync(path);
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
    * @param fd
    */
   sync: function (fd) {
       Fs.fsyncSync(fd);
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

   /****************
    ** CONSOLE IO
    ****************/
   /**
    *
    * @param msg
    */
   debug: function (msg) {
       console.error('Debug: ' + msg);
   },
   /**
    *
    * @param msg
    */
   err: function (msg) {
       console.error('Error: ' + msg);
       throw Error(msg);
   },
   /**
    *
    * @param msg
    */
   fail: function (msg) {
       console.error('Fatal Error: ' + msg);
       process.exit(0);
   },
   /**
    * 
    */
   stacktrace: function () {
       var e = new Error('dummy');
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
    * @param e
    * @param where
    */
   printstack: function (e,where) {
       if (!e.stack) e=new Error(e);
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
    * @param e
    * @param where
    */
   sprintstack: function (e) {
       var str='';
       if (e==_ || !e.stack) e=new Error(e);
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
    * @param {boolean|string} condmsg conditional message var log=X;  log((log lt. N)||(msg))
    */
   log: function (condmsg) {
      if (condmsg==true) return;
      if (!timestamp) console.warn(condmsg);
      else {
        var date = new Date();
        var time = date.getTime();
        console.warn('['+process.pid+':'+time+']'+condmsg);
      }
   },
   /**
    *
    * @param msg
    */
   out: function (msg) {
       console.warn(msg)
   },
   /**
    *
    * @param msg
    */
   warn: function (msg) {
      if (!timestamp) console.warn('Warning: ' + msg);
      else {
        var date = new Date();
        var time = date.getTime();
        console.warn('['+process.pid+':'+time+'] Warning: '+msg);
      }   
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
   /**
    *
    * @param msg
    */
   stdout: function (msg) {
       stdout_fun(msg);
   },

   /** Write a message with a time stamp written to the trace file.
    *
    * @param {boolean|string} condmsg conditional message var trace=Io.tracing;  trace(trace||(msg))
    */
   trace: function (condmsg) {
       if (condmsg != true && tracefile != undefined) {
           var date = new Date();
           var time = date.getTime();
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

   /**************
    ** Process control
    ***************/
   exit: function (n) {
       process.exit(n);
   },
   /**
    *
    * @returns {*} RSS HEAP in kBytes {data,heap}
    */
   mem: function () {
       var mem = process.memoryUsage();
       return {data:(mem.rss/1024)|0,heap:(mem.heapUsed/1024)|0};
   },
   /****************************
    ** Environment and Arguments
    ****************************/
   getenv: function (name, def) {
       return GetEnv(name, def);
   },
   workdir: function () {
       return this.getenv('PWD','');
   },

   /**
    *  @return {string []}
    */
   getargs: function () {
       return process.argv;
   },

   /**
    *
    * @param obj
    */
   inspect: util.inspect,

   sleep: function(delay) {
     var start = new Date().getTime();
     while (new Date().getTime() < start + delay);
   },

   /** Return system time in milliseconds
    */
   time: function () {
     var date = new Date();
     return date.getTime();
   },

   /**
    *  Process management
    */
   fork: child.fork,
   exec: child.exec,
   execSync: child.execSync,
   spawn: child.spawn,

   /**
    * OS
    */
   hostname: os.hostname
};

module.exports = io;
};
BundleModuleCode['os/getenv']=function (module,exports){
var util = require("util");
var url = require("url");

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
  },
  url: url.parse
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
BundleModuleCode['os/base64']=function (module,exports){
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
BundleModuleCode['com/path']=function (module,exports){
var Fs = Require('fs');

var process = process || {};
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


var isWindows = process.platform === 'win32';
var util = Require('util');

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
        path = process.cwd();
      } else {
        // Windows has the concept of drive-specific current working
        // directories. If we've resolved a drive letter but not yet an
        // absolute path, get cwd for that drive. We're sure the device is not
        // an unc path at this points, because unc paths are always absolute.
        path = process.env['=' + resolvedDevice];
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
      var path = (i >= 0) ? arguments[i] : process.cwd();

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
BundleModuleCode['com/sprintf']=function (module,exports){
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
BundleModuleCode['/home/sbosse/proj/jam/js/top/jamapp.js']=function (module,exports){
/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     13-12-16 by sbosse.
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 **    JAMDOS Terminal APP with blessed UI
 **
 **    $ENDOFINFO
 */
global.config={simulation:false};

var Io = Require('com/io');
var Comp = Require('com/compat');
var blessed = Require('term/blessed');
var Aios = Require('jam/aios');
var current=Aios.current;

// Create top-level App with UI
var appTerm = function (options) {
  var self=this;
  this.options = options||{};
  this.screen = blessed.screen({
    smartCSR: false,
    terminal: self.options.terminal||'xterm-color'
    });
  this.screen.title = 'JAMAPP (C) Stefan Bosse';
  this.screen.cursor.color='red';  

  this.err=function (msg,err) {
    Aios.aios.log('Error: '+msg); throw (err||'[JAM] Error');
  }
  this.warn=function (msg) {Aios.aios.log('Warning: '+msg);}
  
  this.out=function (msg) {Aios.aios.log(msg);}

  // PRINT: Smart print function
  var print = function (msg,header,depth,nolog) {
    nolog=true;
    var lines=[];
    var line='';
    if (depth==_) depth=1;
    function isvec(obj) {return(Comp.obj.isArray(obj) && (obj.length == 0 || !Comp.obj.isArray(obj[0])))}
    function ismat(obj) {return(Comp.obj.isArray(obj) && obj.length > 0 && Comp.obj.isArray(obj[0]))}
    function mat(o,depth) {
        // matrix
        var lines=[];
        var line = '';
        if (header) {line=header; header=_};
        for (var j in o) {
          var row=o[j];
          line += Comp.printf.list(row,function (v) {
            return (Comp.obj.isArray(v)?(depth>0?'['+vec(v,depth-1)+']':'[..]'):
                                         Comp.obj.isObj(v)?(depth>0?obj(v,depth-1):'{..}'):v);
          });
          lines.push(line);
          line='';
        }    
        return lines;
    }
    function vec(v,depth) {
        // vector
        var lines=[];
        var line = '';
        if (header) {line=header; header=_};
        if (v.length==0) return(line+'[]');
        else {
          // can still contain matrix elements that must bes separated
          var sep='',sepi='';
          for (var p in v) {
            if (ismat(v[p])) {              
              //self.log.log(line); line='  ';
              if (depth>0) {
                lines = mat(v[p],depth-1);
                line += sep+'['; sepi='';
                Comp.array.iter(lines,function (line2) {
                  line += sepi+'['+line2+']';
                  sepi=',';
                });
                line += ']';
                sep=',';
              } else {
                line += sep+'[[..]]';
                sep=',';
              }
            }
            else if (isvec(v[p])) {
              //self.log.log(line); line='  ';
              line += sep+vec(v[p],depth-1);
              sep=',';
            }
            else {
              line += sep+(Comp.obj.isArray(v[p])?(depth>0?vec(v[p],depth-1):'[..]'):
                                                  Comp.obj.isObj(v[p])?(depth>0?obj(v[p],depth-1):'{..}'):v[p]);
              sep=',';
            }
          }
          if (line!='') return line;
        }
    }
    function obj(o,depth) {
      var line='';
      var sep='';
      if (header) {line=header; header=_};
      line += '{';
      for (var p in o) {
        if (!Comp.obj.isFunction(o[p])) {
          line += sep + p+':'+
            (Comp.obj.isArray(o[p])?(depth>0?vec(o[p],depth-1):'[..]'):
                                    Comp.obj.isObj(o[p])?(depth>0?obj(o[p],depth-1):'{..}'):o[p]);
          sep=',';
        } else {
          line += sep + p+':'+'function()';
          sep=',';
        }
      }      
      return line+'}';
    }
    
    function str(s) {
      var line='';
      var lines=[];
      var lines2 = Comp.string.split('\n',msg);
      if (header) {line=header; header=_};
      if (lines2.length==1)
        lines.push(line+msg);
      else {
        Comp.array.iter(lines2,function (line2,i) {
          if (i==0) lines.push(line+line2);
          else lines.push(line2);
        });
      } 
      return lines;
    }
    
    if (ismat(msg)) lines = Comp.array.concat(lines,
                                              Comp.array.map(mat(msg,depth-1),function (line){
                                                  return '    '+line}));
    else if (Comp.obj.isString(msg)) lines = Comp.array.concat(lines,str(msg));
    else if (isvec(msg)) lines.push(vec(msg,depth-1));
    else if (Comp.obj.isObj(msg)) lines.push(obj(msg,depth-1));
    else {
      if (header) {line=header; header=_};
      line += msg;
      lines.push(line);      
    }
 
    if (nolog) return lines; else Comp.array.iter(lines,function (line) {self.log.log(line)});    
  };
  
  var log = function(){
    if (!current.node || !current.process) {
      print(arguments[0]);
    }
    else if (arguments.length==1)
      print(arguments[0],'['+current.node.id+':'+current.process.agent.id+':'+current.process.pid+':'+current.process.agent.ac+'] ');
    else {
      for (var i in arguments) {
        if (i==0) 
          print(arguments[i],'['+current.node.id+':'+current.process.agent.id+':'+current.process.pid+':'+current.process.agent.ac+'] ');
        else
          print(arguments[i],_,2);
      }
    }
  };

  Aios.aios0.log=log;
  Aios.aios1.log=log;
  Aios.aios2.log=log;
  Aios.aios0.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios1.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios2.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios0.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  Aios.aios1.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  Aios.aios2.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  
  this.world = Aios.World.World([],{id:this.options.id,classes:this.classes});
 
  // Information bar
  this.info = blessed.textbox({
    top: self.screen.height-3,
    left: 1,
    width: self.screen.width-3,
    height: 3,
    label: 'Information',
    focus:false,
    //draggable:true,
    border: {
      type: 'line'
    },
    style: {
      fg:'blue'
    }
  });
  this.screen.append(this.info);
  // Buttons

  function but(options) {
    var obj = blessed.button({
      width: options.width||8,
      left: options.left||0,
      top: options.top||0,
      height: 3,
      align: 'center',
      content: options.content||'?',
      mouse:true,
      focus:true,
      border: {
        type: 'line'
      },
      style: {
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
        }
      }  
    });
    self.screen.append(obj);
    return obj;
  }

  // Bt QUIT
  this.but1 = but({left:1,content:'QUIT'});
  this.but1.on('press', function(data) {
    return process.exit(0);  
  });

  this.update = function (full) {
  };
};

appTerm.prototype.start = function () {
  this.screen.render(); 
  this.out('Initializing ...');
}

var App = function(options) {
  var obj=none;
  obj = new appTerm(options);
  return obj;
}

var JA = App();
JA.start ();

};
BundleModuleCode['com/compat']=function (module,exports){
/**
 **      ==============================
 **       OOOO        O      O   OOOO
 **       O   O       O     O O  O   O
 **       O   O       O     O O  O   O
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
 **    $INITIAL:     (C) 2006-2016 B-LAB
 **    $CREATED:     3/30/15 by sbosse.
 **    $VERSION:     1.11.7
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

/**
 *
 * @param {boolean|string} condmsg conditional message (cond)||(msg)
 */
var assert = function(condmsg) {
    if (condmsg != true) {
        Io.out('** Assertion failed: '+condmsg+' **');
        Io.stacktrace();
        throw Error(condmsg);
    }
};
global.assert=assert;


/** OBJ
 *
 * @type {{isArray: Function, isFunction: Function, isString: Function, isNumber: Function}}
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
    hasProperty: function (o,p) {
      return o[p]!=undefined || (p in o);
    },
    head:function(o) {
      for (var p in o) return p;
      return undefined;
    },
    isArray:function (o) {
      if (o==_ || o ==null) return false;
      else return typeof o == "array" || (typeof o == "object" && o.constructor === Array);
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
    isString: function (o) {
        return typeof o == "string" || (typeof o == "object" && o.constructor === String);
    },
    isNumber: function (o) {
        return typeof o == "number" || (typeof o == "object" && o.constructor === Number);
    }
};

/** ARRAY
 *
 * @type {{append: Function, check: Function, concat: Function, copy: Function, create: Function, create_matrix: Function, empty: Function, find: Function, filter: Function, flatten: Function, head: Function, init: Function, iter: Function, iter_rev: Function, length: Function, map: Function, match: Function, member: Function, merge: Function, pop: Function, push: Function, range: Function, tail: Function, print: Function, sort: Function}}
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
    /** Return a fresh copy of the source array.
     *
     * @param array
     * @returns {Array.<T>|string|Blob|ArrayBuffer}
     */
    copy: function(array) {
        return array.slice();
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
        var i,found;
        var len=array.length;
        found=none;
        loop: for(i=0;i<len;i++) {
            var element=array[i];
            if (fun(element,i)) {
                found=element;
                break loop;
            }
        }
        return found;
    },
    /** Search adn map an element of an array using a test&map function.
     *
     * @param array
     * @param {function(*,number):*} fun
     * @returns {undefined|*}
     */
    findmap: function(array,fun) {
        var i,found;
        var len=array.length;
        found=undefined;
        loop: for(i=0;i<len;i++) {
            var element=array[i];
            found=fun(element,i);
            if (found!=undefined)
              break loop;            
        }
        return found;
    },
    /** Filter out elements using a test function.
     *
     * @param {* []} array
     * @param {function(*,number):boolean} fun
     * @returns {* []}
     */
    filter: function(array,fun) {
        var res=[];
        var len=array.length;
        var i;
        for(i=0;i<len;i++) {
            var element=array[i];
            if (fun(element,i)) res.push(element);
        }
        return res;
    },
    /** Filter out and map elements using a test&map function.
     *
     * @param {* []} array
     * @param {function(*,number):*|undefined} fun
     * @returns {* []}
     */
    filtermap: function(array,fun) {
        var res=[];
        var len=array.length;
        var i;
        for(i=0;i<len;i++) {
            var element=array[i];
            var map=fun(element,i);
            if (map!=undefined) res.push(map);
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
        var i=0;
        var len=array.length;
        for(i=0;i<len;i++) {
            var element=array[i];
            fun(element,i)
        }
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
        var len=array1.length;
        for(i=0;i<len;i++) {
            fun(array1[i],array2[i],i)
        }
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
    }
};

/** STRING
 *
 * @type {{contains: Function, copy: Function, create: Function, empty: Function, equal: Function, format_hex: Function, get: Function, iter: Function, length: Function, make: Function, match: Function, parse_hex: Function, set: Function, split: Function, sub: Function, trim: Function}}
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
            return str.substr(off,off+len);
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
 * @type {{int: Function}}
 */
var random = {
    float: function(max) {
        return Math.random()*max
    }, 
    int: function(max) {
        return Math.floor(Math.random()*max+0)
    },
    // integer
    interval: function(min,max) {
        return Math.floor(min+Math.random()*(max-min))
    },
    // float
    range: function(min,max) {
        return min+Math.random()*(max-min)
    }
};

/** PRINTF
 *
 * @type {{sprintf: Function}}
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
 * @type {{basename: Function, dirname: Function, is_relative: Function, join: Function, path_absolute: Function, path_normalize: Function}}
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
 * @type {{assert: Function, char_of_int: Function, div: Function, failwith: Function, int_of_char: Function, int_of_float: Function, int_of_string: Function, match: Function, mtime: Function, min: Function, max: Function, string_of_float: Function, string_of_int: Function, string_of_int64: Function, time: Function}}
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
 * @type {{get: Function, isSet: Function, set: Function}}
 */
var bit = {
    get: function (v,b) {return (v >> b) && 1;},
    isSet: function (v,b) {return ((v >> b) && 1)==1;},
    set: function (v,b) {return v & (1 << b);}
};

/** ARGS
 *
 * @type {{parse: Function}}
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
 * @type {{add: Function, create: Function, empty: Function, find: Function, invalidate: Function, iter: Function, remove: Function}}
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
BundleModuleCode['term/blessed']=function (module,exports){
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
BundleModuleCode['term/program']=function (module,exports){
/**
 * program.js - basic curses-like functionality for blessed.
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

var EventEmitter = require('events').EventEmitter
  , StringDecoder = require('string_decoder').StringDecoder
  , cp = require('child_process')
  , util = require('util')
  , fs = require('fs');

var Tput = Require('term/tput')
  , colors = Require('term/colors')
  , slice = Array.prototype.slice;

var nextTick = global.setImmediate || process.nextTick.bind(process);

/**
 * Program
 */

function Program(options) {
  var self = this;

  if (!(this instanceof Program)) {
    return new Program(options);
  }

  Program.bind(this);

  EventEmitter.call(this);

  if (!options || options.__proto__ !== Object.prototype) {
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

  this.cols = this.output.columns || 1;
  this.rows = this.output.rows || 1;

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

  this.listen();
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
      // if (program._originalTitle) {
      //   program.setTitle(program._originalTitle);
      // }
      // Ensure the buffer is flushed (it should
      // always be at this point, but who knows).
      program.flush();
      // Ensure _exiting is set (could technically
      // use process._exiting).
      program._exiting = true;
    });
  });
};

Program.prototype.__proto__ = EventEmitter.prototype;

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

Program.prototype.__defineGetter__('terminal', function() {
  return this._terminal;
});

Program.prototype.__defineSetter__('terminal', function(terminal) {
  this.setTerminal(terminal);
  return this.terminal;
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
    var text = decoder.write(data);
    if (!text) return;
    self._bindMouse(text, data);
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
  if (parts = /^\x1b\[M([\x00\u0020-\uffff]{3})/.exec(s)) {
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
      this._lastButton = key.button;
    }

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

Program.prototype.__defineGetter__('title', function() {
  return this._title;
});

Program.prototype.__defineSetter__('title', function(title) {
  this.setTitle(title);
  return this._title;
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
  var listeners = obj.listeners(event);
  obj.removeAllListeners(event);
  obj.on(event, listener);
  listeners.forEach(function(listener) {
    obj.on(event, listener);
  });
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
BundleModuleCode['term/tput']=function (module,exports){
/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse 
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors (MIT License)
 **    $REVESIO:     1.1.3
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

var assert = require('assert')
  , path = require('path')
  , fs = require('fs')
  , cp = require('child_process');

/**
 * Tput
 */

FileEmbedd('term/def/xterm');

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
  //console.log(info)
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
print('CP1')
BundleModuleCode['term/alias']=function (module,exports){
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

print('CP')
