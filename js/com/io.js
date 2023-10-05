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
 **    $INITIAL:     (C) 2006-2020 bLAB
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.12.1
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
 ** Node.js/jxcore
 ************
 */
var util = Require('util');
var os = Require('os');
var child = Require('child_process');
var GetEnv = Require('os/getenv');
var Base64 = Require('os/base64');
var Fs = Require('fs');

Require('os/polyfill')

var stderr_fun = function (str) { process.stderr.write(str); };
var stdout_fun = function (str) { process.stdout.write(str); };

/*
 ** node.js specific
 */

var tracefile = undefined;
var tracing = false;
var timestamp = false;

/**
* Open a module and append all exported properties to the context (e.g., global or this).
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
var NL = '\n';

global.checkOptions = function(options,defaultOptions) {
  return Object.assign({}, defaultOptions||{}, options) };
global.checkOption = function (option,defaultOption) { 
 return option==undefined? defaultOption:option };


var io = {
  options: {
    columns:  undefined,
    rows:     undefined,
    log:      console.log.bind(console),
    err:      console.err,
    warn:     console.warn,
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
    io.options.err('Debug: ' + msg);
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
    io.options.err('Error: ' + msg);
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
    io.options.err('Fatal Error: ' + msg);
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
       if (io.file_exists(name)) return name; 
       else if (typeof PATH !== 'undefined') {
         for (var p in PATH) {
           if (io.file_exists(PATH[p]+'/'+name)) return (PATH[p]+'/'+name);
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
  inspect: util.inspect,

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
    io.options.log(msg)
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
       if (where==undefined) io.out(e);
       else io.out(where+': '+e);
       io.out('Stack Trace');
       io.out('--------------------------------');
       for(var i in stack) {
           if (i>0) {
               var line = stack[i];
               if(line.indexOf('Module.',0)>=0) break;
               io.out('   at '+line);
           }
       }
       io.out('--------------------------------');
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
          io.error=e;
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
          io.error=e;
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
       io.out('Stack Trace');
       io.out('--------------------------------');
       for(var i in stack) {
           if (i>0) {
               var line = stack[i];
               if(line.indexOf('Module.',0)>=0) break;
               io.out('  at '+line);
           }
       }
       io.out('--------------------------------');
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
  date: function () {
     var date = Date();
     return date.split(' ').slice(1,5).join(' ');
  },
  /** Return system time in milliseconds
    */
  time: function () {
     var date = new Date();
     return Math.floor(date.getTime());
  },
  /**
  **  Return current time in hour:minute:second:milli format
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
        var milli = "0" + Math.floor(now.getMilliseconds()/10);
        milli = milli.substring(milli.length-2);
        return hour + ":" + minute + ":" + second+':'+milli;
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
       if (tracefile != undefined) io.tracing = false;
  },
   /**
    *
    * @param msg
    */
  warn: function (msg) {
      if (!timestamp) io.options.warn('Warning: ' + msg);
      else {
        var date = new Date();
        var time = Math.floor(date.getTime());
        console.warn('['+process.pid+':'+time+'] Warning: '+msg);
      }   
  },
  workdir: function () {
       return io.getenv('PWD',io.getenv('CWD',''));
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
          io.error=e;
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
