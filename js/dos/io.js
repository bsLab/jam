/**
 * Created by sbosse on 3/28/15.
 *
 * This module encapsulates all IO operations (except networking) supporting
 * node.js and browser applications.
 */


if (!(process.env.NODE_ENV === 'browser')) {
    /*
     ************
     ** Node.js
     ************
     */
    var util = require('util');
    var GetEnv = require('getenv');
    var Fs = require('fs');

    var stderr_fun = function (str) { process.stderr.write(str); };
    var stdout_fun = function (str) { process.stdout.write(str); };

    /*
     ** node.js specific
     */

    var tracefile = undefined;
    var tracing = true;

    /*
     ** node.js
     */
    module.exports = {
        /**************
         ** FILE IO
         ***************/
        close: function (fd) {
            Fs.closeSync(fd);
        },
        exists: function (path) {
            return Fs.existsSync(path);
        },
        open: function (path, mode) {
            return Fs.openSync(path, mode);
        },

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
                return Fs.readFileSync(path);
            } catch (e) {
                return undefined;
            }
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
            return Fs.readSync(fd, buf, boff, len, foff);
        },
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
        write_file: function (path,buf) {
            try {
                Fs.writeFileSync(path, buf, 'binary');
                return buf.length;
            } catch (e) {
                return -1;
            }
        },

        /****************
         ** CONSOLE IO
         ****************/
        debug: function (msg) {
            console.error('Debug: ' + msg);
        },
        err: function (msg) {
            console.error('Error: ' + msg);
            throw Error(msg);
        },
        fail: function (msg) {
            console.error('Fatal Error: ' + msg);
            process.exit(0);
        },
        inspect: function (obj) {
            console.warn(util.inspect(obj))
        },
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
                    this.out(line);
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
                    this.out(line);
                }
            }
            this.out('--------------------------------');
        },
        /**
         *
         * @param {boolean|string} condmsg conditional message var log=X;  log((log lt. N)||(msg))
         */
        log: function (condmsg) {
            if (condmsg != true) console.warn(condmsg);
        },
        out: function (msg) {
            console.warn(msg)
        },
        warn: function (msg) {
            console.warn('Warning: ' + msg);
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
        }
    };
} else {
    /*
    ************
    ** Browser
    ************
    */

    var tracing = true;
    var stderr_fun = function (str) { console.log(str); };
    var stdout_fun = function (str) { console.log(str); };
    var args=[];

    module.exports = {
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
            return;
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
        }
    };

}