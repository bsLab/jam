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
 **    $VERSION:     1.11.1
 **
 **    $INFO:
 *
 * This module encapsulates all IO operations (except networking) supporting
 * browser applications.
 *
 **    $ENDOFINFO
 */
/*
************
** Browser
************
*/
var tracing = true;
var stderr_fun = function (str) { console.log(str); };
var stdout_fun = function (str) { console.log(str); };
var args=[];
var inspect = Require('os/inspect');

Require('os/polyfill')

global.checkOptions = function(options,defaultOptions) {
  return Object.assign({}, defaultOptions||{}, options) };
global.checkOption = function (option,defaultOption) { 
 return option==undefined? defaultOption:option };

var io = {
  /*
  ************
  ** Browser
  ************
  */
  /*
   ** FILE IO
   * TODO WebStorage
   */
  close: function (fd) {
      return;
  },
  exists: function (path) {
      return false;
  },
  open: function (path, mode) {
      var fd = Fs.openSync(path, mode);
      return fd;
  },

  read: function (fd, len, foff) {
      // TODO
  },
  read_file: function (path) {
      return '';
  },

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
   * @returns {*}
   */
  read_buf: function (fd, buf, boff, len, foff) {
      return -1;
  },
  sync: function (fd) {
      return;
  },
  /**
   *
   * @param fd
   * @param data
   * @param [foff]
   * @returns {*}
   */
  write: function (fd, data, foff) {
      return -1;
  },
  /**
   *
   * @param fd
   * @param buf
   * @param bpos
   * @param blen
   * @param [foff]
   * @returns {*}
   */
  write_buf: function (fd, buf, bpos, blen, foff) {
      return -1;
  },

  /*
   ** CONSOLE IO
   */
  debug: function (msg) {
      stderr_fun('Debug: ' + msg);
  },
  err: function (msg) {
      stderr_fun('Error: ' + msg);
      throw Error(msg);
  },
  fail: function (msg) {
      stderr_fun('Fatal Error: ' + msg);
  },
  inspect: function (obj) {
      return inspect(obj);
  },
  stacktrace: function () {
      var e = new Error('dummy');
      var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
          .replace(/^\s+at\s+/gm, '')
          .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
          .split('\n');
      stderr_fun('Stack Trace');
      stderr_fun('--------------------------------');
      for(var i in stack) {
          if (i>0) {
              var line = stack[i];
              if(line.indexOf('Module.',0)>=0) break;
              stderr_fun(line);
          }
      }
      stderr_fun('--------------------------------');
  },
  /**
   *
   * @param e
   * @param where
   */
  printstack: function (e,where) {
      if (where==undefined) stderr_fun(e);
      else stderr_fun(where+': '+e);
  },
  sprintstack: function (e) {
    return e?e.toString():''
  },
  /**
   *
   * @param {boolean|string} condmsg conditional message var log=X;  log((log lt. N)||(msg))
   */
  log: function (condmsg) {
      if (condmsg != true) console.warn(condmsg);
  },
  out: function (msg) {
      stdout_fun(msg)
  },
  warn: function (msg) {
      stderr_fun('Warning: ' + msg);
  },


  set_stderr: function(fun) {
      stderr_fun=fun;
  },
  set_stdout: function(fun) {
      stdout_fun=fun;
  },

  stderr: function (msg) {
      stderr_fun(msg);
  },
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
          this.log('[' + time + '] ' + condmsg + '\n');
      }
  },
  tracing: tracing,
  /**
   *
   * @param {string} path
   */
  trace_open: function (path) {
      return undefined;
  },

  exit: function (n) {
      return;
  },
  getenv: function (name, def) {
      return def;
  },
  workdir: function () {
      return '';
  },
  /**
   *  @return {string []}
   */
  getargs: function () {
      return args;
  },
  set_args: function (argv) {
      args=argv;
  },

  sleep: function(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  },

  date: function () {
     var date = Date();
     return date.split(' ').slice(1,5).join(' ');
  },

  /** Return system time in milliseconds
   */
  time: function () {
    var date = new Date();
    return date.getTime();
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
        var milli = "0" + now.getMilliseconds();
        var milli = "0" + Math.floor(now.getMilliseconds()/10);
        milli = milli.substring(milli.length-2);
        return hour + ":" + minute + ":" + second+':'+milli;
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

};

module.exports = io;
