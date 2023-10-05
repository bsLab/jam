var CoreModule = {};
CoreModule['com/io']='com/io.browser';
CoreModule['crypto']='os/crypto';
CoreModule['util']='os/util';
CoreModule['http']='os/http.browser';
CoreModule['url']='os/url';
CoreModule['path']='os/path';
CoreModule['string_decoder']='os/string_decoder';
CoreModule['fs']='';
CoreModule['stream']='';
CoreModule['zlib']='';
CoreModule['dgram']='';
CoreModule['net']='';
CoreModule['child_process']='';
CoreModule['dns']='';

var BundleModuleCode=[];
var BundleObjectCode=[];
var BundleModules = [];
PATH=[".","/home/sbosse/proj/jam/js"];
if (typeof global == "undefined")  global=(typeof window != "undefined"?window:{})
if (typeof process == "undefined") var process={};
Require=function(modupath) {
  if (CoreModule[modupath]!=undefined) modupath=CoreModule[modupath];
  if (modupath=='') return undefined;
  if (BundleModules[modupath]) return BundleModules[modupath];
  var exports={}, module={exports:exports};
  if (BundleModuleCode[modupath]) BundleModuleCode[modupath](module,exports,window,process);
  else if (BundleObjectCode[modupath]) BundleObjectCode[modupath](module,exports,window,process);
  else return undefined;
  BundleModules[modupath]=module.exports||module;
  return module.exports||module;};
var FilesEmbedded = {};
var FileEmbedd = function (path,format) {};
var FileEmbedded = function (path,format) {return FilesEmbedded[path](format);};
global.TARGET='browser';

BundleModuleCode['com/io.browser']=function (module,exports,global,process){
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
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.10.1
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
        return hour + ":" + minute + ":" + second;
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
};
BundleModuleCode['os/inspect']=function (module,exports,global,process){

/**
 * Module dependencies.
 */

var map = function(array, callback) {
  var length = array.length,
  i = -1,
  il = length - 1,
  results = new Array(length);
  while (i++ < il) {
    results[i] = callback(array[i], i, array);
  }
  return results;
}
var indexOf = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
var str = Object.prototype.toString;
var isArray = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};
var forEach = function (ary, callback, thisArg) {
  if (ary.forEach) {
    ary.forEach(callback, thisArg);
    return;
  }
  for (var i = 0; i < ary.length; i+=1) {
    callback.call(thisArg, ary[i], i, ary);
  }
};
var _hasOwn = Object.prototype.hasOwnProperty;

var reduce = function (xs, f, acc) {
  var hasAcc = arguments.length >= 3;
  if (hasAcc && xs.reduce) return xs.reduce(f, acc);
  if (xs.reduce) return xs.reduce(f);
  for (var i = 0; i < xs.length; i++) {
    if (!_hasOwn.call(xs, i)) continue;
    if (!hasAcc) {
      acc = xs[i];
      hasAcc = true;
      continue;
    }
    acc = f(acc, xs[i], i);
  }
  return acc;
};
var getObjectKeys = Require('os/object-keys');
var JSON = Require('os/json3');

/**
 * Make sure `Object.keys` work for `undefined`
 * values that are still there, like `document.all`.
 * http://lists.w3.org/Archives/Public/public-html/2009Jun/0546.html
 *
 * @api private
 */

function objectKeys(val){
  if (Object.keys) return Object.keys(val);
  return getObjectKeys(val);
}

/**
 * Module exports.
 */

module.exports = inspect;

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 * @license MIT (© Joyent)
 */
/* legacy: obj, showHidden, depth, colors*/

function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    _extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}

// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};

function stylizeNoColor(str, styleType) {
  return str;
}

function isBoolean(arg) {
  return typeof arg === 'boolean';
}

function isUndefined(arg) {
  return arg === void 0;
}

function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}

function isFunction(arg) {
  return typeof arg === 'function';
}

function isString(arg) {
  return typeof arg === 'string';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isNull(arg) {
  return arg === null;
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

function arrayToHash(array) {
  var hash = {};

  forEach(array, function(val, idx) {
    hash[val] = true;
  });

  return hash;
}

function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwn(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  forEach(keys, function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}

function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}

function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = objectKeys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden && Object.getOwnPropertyNames) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (indexOf(keys, 'message') >= 0 || indexOf(keys, 'description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = map(keys, function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}

function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = { value: value[key] };
  if (Object.getOwnPropertyDescriptor) {
    desc = Object.getOwnPropertyDescriptor(value, key) || desc;
  }
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwn(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (indexOf(ctx.seen, desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = map(str.split('\n'), function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + map(str.split('\n'), function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}

function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}

function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = reduce(output, function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}

function _extend(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = objectKeys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}
};
BundleModuleCode['os/object-keys']=function (module,exports,global,process){
'use strict';

// modified from https://github.com/es-shims/es5-shim
var has = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var isArgs = function (value) {
  var str = toStr.call(value);
  var isArgs = str === '[object Arguments]';
  if (!isArgs) {
    isArgs = str !== '[object Array]' &&
    value !== null &&
    typeof value === 'object' &&
    typeof value.length === 'number' &&
    value.length >= 0 &&
    toStr.call(value.callee) === '[object Function]';
  }
  return isArgs;
};
var isEnumerable = Object.prototype.propertyIsEnumerable;
var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
var dontEnums = [
	'toString',
	'toLocaleString',
	'valueOf',
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'constructor'
];
var equalsConstructorPrototype = function (o) {
	var ctor = o.constructor;
	return ctor && ctor.prototype === o;
};
var excludedKeys = {
	$console: true,
	$external: true,
	$frame: true,
	$frameElement: true,
	$frames: true,
	$innerHeight: true,
	$innerWidth: true,
	$outerHeight: true,
	$outerWidth: true,
	$pageXOffset: true,
	$pageYOffset: true,
	$parent: true,
	$scrollLeft: true,
	$scrollTop: true,
	$scrollX: true,
	$scrollY: true,
	$self: true,
	$webkitIndexedDB: true,
	$webkitStorageInfo: true,
	$window: true
};
var hasAutomationEqualityBug = (function () {
	/* global window */
	if (typeof window === 'undefined') { return false; }
	for (var k in window) {
		try {
			if (!excludedKeys['$' + k] && has.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
				try {
					equalsConstructorPrototype(window[k]);
				} catch (e) {
					return true;
				}
			}
		} catch (e) {
			return true;
		}
	}
	return false;
}());
var equalsConstructorPrototypeIfNotBuggy = function (o) {
	/* global window */
	if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
		return equalsConstructorPrototype(o);
	}
	try {
		return equalsConstructorPrototype(o);
	} catch (e) {
		return false;
	}
};

var keysShim = function keys(object) {
	var isObject = object !== null && typeof object === 'object';
	var isFunction = toStr.call(object) === '[object Function]';
	var isArguments = isArgs(object);
	var isString = isObject && toStr.call(object) === '[object String]';
	var theKeys = [];

	if (!isObject && !isFunction && !isArguments) {
		throw new TypeError('Object.keys called on a non-object');
	}

	var skipProto = hasProtoEnumBug && isFunction;
	if (isString && object.length > 0 && !has.call(object, 0)) {
		for (var i = 0; i < object.length; ++i) {
			theKeys.push(String(i));
		}
	}

	if (isArguments && object.length > 0) {
		for (var j = 0; j < object.length; ++j) {
			theKeys.push(String(j));
		}
	} else {
		for (var name in object) {
			if (!(skipProto && name === 'prototype') && has.call(object, name)) {
				theKeys.push(String(name));
			}
		}
	}

	if (hasDontEnumBug) {
		var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

		for (var k = 0; k < dontEnums.length; ++k) {
			if (!(skipConstructor && dontEnums[k] === 'constructor') && has.call(object, dontEnums[k])) {
				theKeys.push(dontEnums[k]);
			}
		}
	}
	return theKeys;
};

keysShim.shim = function shimObjectKeys() {
	if (Object.keys) {
		var keysWorksWithArguments = (function () {
			// Safari 5.0 bug
			return (Object.keys(arguments) || '').length === 2;
		}(1, 2));
		if (!keysWorksWithArguments) {
			var originalKeys = Object.keys;
			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
				if (isArgs(object)) {
					return originalKeys(slice.call(object));
				} else {
					return originalKeys(object);
				}
			};
		}
	} else {
		Object.keys = keysShim;
	}
	return Object.keys || keysShim;
};

module.exports = keysShim;
};
BundleModuleCode['os/json3']=function (module,exports,global,process){
/*! JSON v3.3.2 | https://bestiejs.github.io/json3 | Copyright 2012-2015, Kit Cambridge, Benjamin Tan | http://kit.mit-license.org */
;(function () {
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // A set of types used to distinguish objects from primitives.
  var objectTypes = {
    "function": true,
    "object": true
  };

  // Detect the `exports` object exposed by CommonJS implementations.
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  // Use the `global` object exposed by Node (including Browserify via
  // `insert-module-globals`), Narwhal, and Ringo as the default context,
  // and the `window` object in browsers. Rhino exports a `global` function
  // instead.
  var root = objectTypes[typeof window] && window || this,
      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
    root = freeGlobal;
  }

  // Public: Initializes JSON 3 using the given `context` object, attaching the
  // `stringify` and `parse` functions to the specified `exports` object.
  function runInContext(context, exports) {
    context || (context = root.Object());
    exports || (exports = root.Object());

    // Native constructor aliases.
    var Number = context.Number || root.Number,
        String = context.String || root.String,
        Object = context.Object || root.Object,
        Date = context.Date || root.Date,
        SyntaxError = context.SyntaxError || root.SyntaxError,
        TypeError = context.TypeError || root.TypeError,
        Math = context.Math || root.Math,
        nativeJSON = context.JSON || root.JSON;

    // Delegate to the native `stringify` and `parse` implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty = objectProto.hasOwnProperty,
        undefined;

    // Internal: Contains `try...catch` logic used by other functions.
    // This prevents other functions from being deoptimized.
    function attempt(func, errorFunc) {
      try {
        func();
      } catch (exception) {
        if (errorFunc) {
          errorFunc();
        }
      }
    }

    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    attempt(function () {
      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    });

    // Internal: Determines whether the native `JSON.stringify` and `parse`
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] != null) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both `JSON.stringify` and `JSON.parse` are
        // supported.
        isSupported = has("json-stringify") && has("date-serialization") && has("json-parse");
      } else if (name == "date-serialization") {
        // Indicates whether `Date`s can be serialized accurately by `JSON.stringify`.
        isSupported = has("json-stringify") && isExtended;
        if (isSupported) {
          var stringify = exports.stringify;
          attempt(function () {
            isSupported =
              // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
              // serialize extended years.
              stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
              // The milliseconds are optional in ES 5, but required in 5.1.
              stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
              // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
              // four-digit years instead of six-digit years. Credits: @Yaffle.
              stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
              // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
              // values less than 1000. Credits: @Yaffle.
              stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
          });
        }
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test `JSON.stringify`.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function";
          if (stringifySupported) {
            // A test function object with a custom `toJSON` method.
            (value = function () {
              return 1;
            }).toJSON = value;
            attempt(function () {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                // does not define a canonical JSON representation (this applies to
                // objects with `toJSON` properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undefined &&
                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undefined) === undefined &&
                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                // respectively, if the value is omitted entirely.
                stringify() === undefined &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or `null` literal. This applies to
                // objects with custom `toJSON` methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                // `"[null]"`.
                stringify([undefined]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize `null` literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom `toJSON` methods.
                stringify([undefined, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]";
            }, function () {
              stringifySupported = false;
            });
          }
          isSupported = stringifySupported;
        }
        // Test `JSON.parse`.
        if (name == "json-parse") {
          var parse = exports.parse, parseSupported;
          if (typeof parse == "function") {
            attempt(function () {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  attempt(function () {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  });
                  if (parseSupported) {
                    attempt(function () {
                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    });
                  }
                  if (parseSupported) {
                    attempt(function () {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    });
                  }
                }
              }
            }, function () {
              parseSupported = false;
            });
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }
    has["bug-string-char-index"] = has["date-serialization"] = has["json"] = has["json-stringify"] = has["json-parse"] = null;

    if (!has("json")) {
      // Common `[[Class]]` name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Internal: Normalizes the `for...in` iteration algorithm across
      // environments. Each enumerated key is yielded to a `callback` function.
      var forOwn = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's `for...in` algorithm. The
        // `valueOf` property inherits the non-enumerable flag from
        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the `Properties` class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from `Object.prototype`.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from `Object.prototype`.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forOwn = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the `prototype` property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = dontEnums.length; property = dontEnums[--length];) {
              if (hasProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard `for...in` algorithm.
          forOwn = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the `constructor` property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forOwn(object, callback);
      };

      // Public: Serializes a JavaScript `value` as a JSON string. The optional
      // `filter` argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional `width`
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (!has("json-stringify") && !has("date-serialization")) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts `value` into a zero-padded string such that its
        // length is at least equal to `width`. The `width` must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The `|| 0` expression is necessary to work around a bug in
          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Serializes a date object.
        var serializeDate = function (value) {
          var getData, year, month, date, time, hours, minutes, seconds, milliseconds;
          // Define additional utility methods if the `Date` methods are buggy.
          if (!isExtended) {
            var floor = Math.floor;
            // A mapping between the months of the year and the number of days between
            // January 1st and the first of the respective month.
            var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
            // Internal: Calculates the number of days between the Unix epoch and the
            // first day of the given month.
            var getDay = function (year, month) {
              return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
            };
            getData = function (value) {
              // Manually compute the year, month, date, hours, minutes,
              // seconds, and milliseconds if the `getUTC*` methods are
              // buggy. Adapted from @Yaffle's `date-shim` project.
              date = floor(value / 864e5);
              for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
              for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
              date = 1 + date - getDay(year, month);
              // The `time` value specifies the time within the day (see ES
              // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
              // to compute `A modulo B`, as the `%` operator does not
              // correspond to the `modulo` operation for negative numbers.
              time = (value % 864e5 + 864e5) % 864e5;
              // The hours, minutes, seconds, and milliseconds are obtained by
              // decomposing the time within the day. See section 15.9.1.10.
              hours = floor(time / 36e5) % 24;
              minutes = floor(time / 6e4) % 60;
              seconds = floor(time / 1e3) % 60;
              milliseconds = time % 1e3;
            };
          } else {
            getData = function (value) {
              year = value.getUTCFullYear();
              month = value.getUTCMonth();
              date = value.getUTCDate();
              hours = value.getUTCHours();
              minutes = value.getUTCMinutes();
              seconds = value.getUTCSeconds();
              milliseconds = value.getUTCMilliseconds();
            };
          }
          serializeDate = function (value) {
            if (value > -1 / 0 && value < 1 / 0) {
              // Dates are serialized according to the `Date#toJSON` method
              // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
              // for the ISO 8601 date time string format.
              getData(value);
              // Serialize extended years correctly.
              value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
              "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
              // Months, dates, hours, minutes, and seconds should have two
              // digits; milliseconds should have three.
              "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
              // Milliseconds are optional in ES 5.0, but required in 5.1.
              "." + toPaddedString(3, milliseconds) + "Z";
              year = month = date = hours = minutes = seconds = milliseconds = null;
            } else {
              value = null;
            }
            return value;
          };
          return serializeDate(value);
        };

        // For environments with `JSON.stringify` but buggy date serialization,
        // we override the native `Date#toJSON` implementation with a
        // spec-compliant one.
        if (has("json-stringify") && !has("date-serialization")) {
          // Internal: the `Date#toJSON` implementation used to override the native one.
          function dateToJSON (key) {
            return serializeDate(this);
          }

          // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
          var nativeStringify = exports.stringify;
          exports.stringify = function (source, filter, width) {
            var nativeToJSON = Date.prototype.toJSON;
            Date.prototype.toJSON = dateToJSON;
            var result = nativeStringify(source, filter, width);
            Date.prototype.toJSON = nativeToJSON;
            return result;
          }
        } else {
          // Internal: Double-quotes a string `value`, replacing all ASCII control
          // characters (characters with code unit values between 0 and 31) with
          // their escaped equivalents. This is an implementation of the
          // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
          var unicodePrefix = "\\u00";
          var escapeChar = function (character) {
            var charCode = character.charCodeAt(0), escaped = Escapes[charCode];
            if (escaped) {
              return escaped;
            }
            return unicodePrefix + toPaddedString(2, charCode.toString(16));
          };
          var reEscape = /[\x00-\x1f\x22\x5c]/g;
          var quote = function (value) {
            reEscape.lastIndex = 0;
            return '"' +
              (
                reEscape.test(value)
                  ? value.replace(reEscape, escapeChar)
                  : value
              ) +
              '"';
          };

          // Internal: Recursively serializes an object. Implements the
          // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
          var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
            var value, type, className, results, element, index, length, prefix, result;
            attempt(function () {
              // Necessary for host object support.
              value = object[property];
            });
            if (typeof value == "object" && value) {
              if (value.getUTCFullYear && getClass.call(value) == dateClass && value.toJSON === Date.prototype.toJSON) {
                value = serializeDate(value);
              } else if (typeof value.toJSON == "function") {
                value = value.toJSON(property);
              }
            }
            if (callback) {
              // If a replacement function was provided, call it to obtain the value
              // for serialization.
              value = callback.call(object, property, value);
            }
            // Exit early if value is `undefined` or `null`.
            if (value == undefined) {
              return value === undefined ? value : "null";
            }
            type = typeof value;
            // Only call `getClass` if the value is an object.
            if (type == "object") {
              className = getClass.call(value);
            }
            switch (className || type) {
              case "boolean":
              case booleanClass:
                // Booleans are represented literally.
                return "" + value;
              case "number":
              case numberClass:
                // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
                // `"null"`.
                return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
              case "string":
              case stringClass:
                // Strings are double-quoted and escaped.
                return quote("" + value);
            }
            // Recursively serialize objects and arrays.
            if (typeof value == "object") {
              // Check for cyclic structures. This is a linear search; performance
              // is inversely proportional to the number of unique nested objects.
              for (length = stack.length; length--;) {
                if (stack[length] === value) {
                  // Cyclic structures cannot be serialized by `JSON.stringify`.
                  throw TypeError();
                }
              }
              // Add the object to the stack of traversed objects.
              stack.push(value);
              results = [];
              // Save the current indentation level and indent one additional level.
              prefix = indentation;
              indentation += whitespace;
              if (className == arrayClass) {
                // Recursively serialize array elements.
                for (index = 0, length = value.length; index < length; index++) {
                  element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                  results.push(element === undefined ? "null" : element);
                }
                result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
              } else {
                // Recursively serialize object members. Members are selected from
                // either a user-specified list of property names, or the object
                // itself.
                forOwn(properties || value, function (property) {
                  var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                  if (element !== undefined) {
                    // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                    // is not the empty string, let `member` {quote(property) + ":"}
                    // be the concatenation of `member` and the `space` character."
                    // The "`space` character" refers to the literal space
                    // character, not the `space` {width} argument provided to
                    // `JSON.stringify`.
                    results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                  }
                });
                result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
              }
              // Remove the object from the traversed object stack.
              stack.pop();
              return result;
            }
          };

          // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
          exports.stringify = function (source, filter, width) {
            var whitespace, callback, properties, className;
            if (objectTypes[typeof filter] && filter) {
              className = getClass.call(filter);
              if (className == functionClass) {
                callback = filter;
              } else if (className == arrayClass) {
                // Convert the property names array into a makeshift set.
                properties = {};
                for (var index = 0, length = filter.length, value; index < length;) {
                  value = filter[index++];
                  className = getClass.call(value);
                  if (className == "[object String]" || className == "[object Number]") {
                    properties[value] = 1;
                  }
                }
              }
            }
            if (width) {
              className = getClass.call(width);
              if (className == numberClass) {
                // Convert the `width` to an integer and create a string containing
                // `width` number of space characters.
                if ((width -= width % 1) > 0) {
                  if (width > 10) {
                    width = 10;
                  }
                  for (whitespace = ""; whitespace.length < width;) {
                    whitespace += " ";
                  }
                }
              } else if (className == stringClass) {
                whitespace = width.length <= 10 ? width : width.slice(0, 10);
              }
            }
            // Opera <= 7.54u2 discards the values associated with empty string keys
            // (`""`) only if they are used directly within an object member list
            // (e.g., `!("" in { "": 1})`).
            return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
          };
        }
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a `SyntaxError`.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or `"$"` if the parser has reached
        // the end of the source string. A token may be a string, number, `null`
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // `"` delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel `@` character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (`\`) marks the beginning of an escaped
                    // control character (including `"`, `\`, and `/`) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // `\u` marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length; position++) {
                      charCode = source.charCodeAt(position);
                      if (charCode < 48 || charCode > 57) {
                        break;
                      }
                    }
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The `e` denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length; position++) {
                      charCode = source.charCodeAt(position);
                      if (charCode < 48 || charCode > 57) {
                        break;
                      }
                    }
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // `true`, `false`, and `null` literals.
                var temp = source.slice(Index, Index + 4);
                if (temp == "true") {
                  Index += 4;
                  return true;
                } else if (temp == "fals" && source.charCodeAt(Index + 4 ) == 101) {
                  Index += 5;
                  return false;
                } else if (temp == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel `$` character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON `value` token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel `@` character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;;) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing `,` in array literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each array element.
                    abort();
                  }
                } else {
                  hasMembers = true;
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;;) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing `,` in object literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each object member.
                    abort();
                  }
                } else {
                  hasMembers = true;
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a `:` must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undefined) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // `callback` function for each value. This is an implementation of the
        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // `forOwn` can't be used to traverse an array in Opera <= 8.54
            // because its `Object#hasOwnProperty` implementation returns `false`
            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(getClass, forOwn, value, length, callback);
              }
            } else {
              forOwn(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports.runInContext = runInContext;
    return exports;
  }

  if (freeExports && !isLoader) {
    // Export for CommonJS environments.
    runInContext(root, freeExports);
  } else {
    // Export for web browsers and JavaScript engines.
    var nativeJSON = root.JSON,
        previousJSON = root.JSON3,
        isRestored = false;

    var JSON3 = runInContext(root, (root.JSON3 = {
      // Public: Restores the original value of the global `JSON` object and
      // returns a reference to the `JSON3` object.
      "noConflict": function () {
        if (!isRestored) {
          isRestored = true;
          root.JSON = nativeJSON;
          root.JSON3 = previousJSON;
          nativeJSON = previousJSON = null;
        }
        return JSON3;
      }
    }));

    root.JSON = {
      "parse": JSON3.parse,
      "stringify": JSON3.stringify
    };
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}).call(this);
};
BundleModuleCode['os/polyfill']=function (module,exports,global,process){
/************** ARRAY ********************/

if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, ( kValue, k, O ))).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    }
  });
}

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

// Check Options Extension
checkOptions = function(options,defaultOptions) {
  return Object.assign({}, defaultOptions||{}, options) };
checkOption = function (option,defaultOption) { 
 return option==undefined? defaultOption:option };
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
BundleModuleCode['os/util']=function (module,exports,global,process){
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

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = function isBuffer(arg) {
  return arg && typeof arg === 'object'
             && typeof arg.copy === 'function'
             && typeof arg.fill === 'function'
             && typeof arg.readUInt8 === 'function';
};

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */

exports.inherits = Require('os/inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
};
BundleModuleCode['os/inherits']=function (module,exports,global,process){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}
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
BundleModuleCode['os/buffer']=function (module,exports,global,process){
var Ieee754 = Require('os/buffer_ieee754');

/* ------- base64-js -------- */
var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}
/* ------- base64-js -------- */

var assert;

exports.Buffer = Buffer;
exports.SlowBuffer = Buffer;
Buffer.poolSize = 8192;
exports.INSPECT_MAX_BYTES = 50;

function stringtrim(str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, '');
}

function Buffer(subject, encoding, offset) {
  if(!assert) assert= {
    ok : function(cond,msg) {
      if (cond != true) {
        console.log('** Assertion failed: '+msg+' **');
        throw Error(msg);
      }
    }
  };
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }
  this.parent = this;
  this.offset = 0;

  // Work-around: node's base64 implementation
  // allows for non-padded strings while base64-js
  // does not..
  if (encoding == "base64" && typeof subject == "string") {
    subject = stringtrim(subject);
    while (subject.length % 4 != 0) {
      subject = subject + "="; 
    }
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    // slicing works, with limitations (no parent tracking/update)
    // check https://github.com/toots/buffer-browserify/issues/19
    for (var i = 0; i < this.length; i++) {
        this[i] = subject.get(i+offset);
    }
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new TypeError('First argument needs to be a number, ' +
                            'array or string.');
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        if (subject instanceof Buffer) {
          this[i] = subject.readUInt8(i);
        }
        else {
          // Round-up subject[i] to a UInt8.
          // e.g.: ((-432 % 256) + 256) % 256 = (-176 + 256) % 256
          //                                  = 80
          this[i] = ((subject[i] % 256) + 256) % 256;
        }
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    } else if (type === 'number') {
      for (var i = 0; i < this.length; i++) {
        this[i] = 0;
      }
    }
  }
}

Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this[i];
};

Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this[i] = v;
};

Buffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
    case 'binary':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

Buffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

Buffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

Buffer.prototype.binaryWrite = Buffer.prototype.asciiWrite;

Buffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return Buffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

Buffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return fromByteArray(bytes);
};

Buffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

Buffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

Buffer.prototype.binarySlice = Buffer.prototype.asciiSlice;

Buffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


Buffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var b = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(b)) throw new Error('Invalid hex string');
    this[offset + i] = b;
  }
  Buffer._charsWritten = i * 2;
  return i;
};


Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};

// slice(start, end)
function clamp(index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue;
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len;
  if (index >= 0) return index;
  index += len;
  if (index >= 0) return index;
  return 0;
}

Buffer.prototype.slice = function(start, end) {
  var len = this.length;
  start = clamp(start, len, 0);
  end = clamp(end, len, len);
  return new Buffer(this, end - start, +start);
};

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  if (end === undefined || isNaN(end)) {
    end = this.length;
  }
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  var temp = [];
  for (var i=start; i<end; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=target_start; i<target_start+temp.length; i++) {
    target[i] = temp[i-target_start];
  }
};

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  for (var i = start; i < end; i++) {
    this[i] = value;
  }
}

// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer;
};

Buffer.concat = function (list, totalLength) {
  if (!isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

Buffer.isEncoding = function(encoding) {
  switch ((encoding + '').toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
    case 'raw':
      return true;

    default:
      return false;
  }
};

// helpers

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}

function isArray(subject) {
  return (Array.isArray ||
    function(subject){
      return {}.toString.apply(subject) == '[object Array]'
    })
    (subject)
}

function isArrayIsh(subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return toByteArray(str);
}

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

// read/write bit-twiddling

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  return buffer[offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    val = buffer[offset] << 8;
    if (offset + 1 < buffer.length) {
      val |= buffer[offset + 1];
    }
  } else {
    val = buffer[offset];
    if (offset + 1 < buffer.length) {
      val |= buffer[offset + 1] << 8;
    }
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    if (offset + 1 < buffer.length)
      val = buffer[offset + 1] << 16;
    if (offset + 2 < buffer.length)
      val |= buffer[offset + 2] << 8;
    if (offset + 3 < buffer.length)
      val |= buffer[offset + 3];
    val = val + (buffer[offset] << 24 >>> 0);
  } else {
    if (offset + 2 < buffer.length)
      val = buffer[offset + 2] << 16;
    if (offset + 1 < buffer.length)
      val |= buffer[offset + 1] << 8;
    val |= buffer[offset];
    if (offset + 3 < buffer.length)
      val = val + (buffer[offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  neg = buffer[offset] & 0x80;
  if (!neg) {
    return (buffer[offset]);
  }

  return ((0xff - buffer[offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }
  // TODO
  return Ieee754.readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return Ieee754.readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  if (offset < buffer.length) {
    buffer[offset] = value;
  }
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {
    buffer[offset + i] =
        (value & (0xff << (8 * (isBigEndian ? 1 - i : i)))) >>>
            (isBigEndian ? 1 - i : i) * 8;
  }

}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {
    buffer[offset + i] =
        (value >>> (isBigEndian ? 3 - i : i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  Ieee754.writeIEEE754(buffer, value, offset, isBigEndian, 23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  Ieee754.writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};
};
BundleModuleCode['os/buffer_ieee754']=function (module,exports,global,process){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};
};
BundleModuleCode['os/process']=function (module,exports,global,process){
// shim for using process in browser
if (typeof process != 'undefined' && process.env) {
  module.exports = process;
  return;
}

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};
process.pid=0;

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };
};
BundleModuleCode['/home/sbosse/proj/jam/js/top/jamlib.js']=function (module,exports,global,process){
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
 **    $CREATED:     25-12-16 by sbosse.
 **    $RCS:         $Id: jamlib.js,v 1.4 2017/06/19 17:18:39 sbosse Exp sbosse $
 **    $VERSION:     1.32.1
 **
 **    $INFO:
 **
 **  JAM library API that can be embedded in any host application.
 **
 **
 ** New: Embedded auto setup (e.g., for clusters) using command line arguments
 ** 
 **      jamlib autosetup:"{options}"
 **
 **
 **    $ENDOFINFO
 */
var onexit=false;
var start=false;
var options = {
  geo:undefined,
  verbose:0,
  version:'1.32.1'  // public version
};

global.config={simulation:false,nonetwork:false};

var Io = Require('com/io');
var Comp = Require('com/compat');
var Aios = Require('jam/aios');
var Esprima = Require('parser/esprima');
var Json = Require('jam/jsonfn');
var fs = Require('fs');
var Sat = Require('dos/ext/satelize');
var CBL = Require('com/cbl');
var platform = Require('os/platform');

var DIR = Aios.DIR;

// Parse command line arguments; extract a:v attributes
var environment = process.env; process.argv.slice(2).forEach(function (arg) { 
  var tokens=arg.match(/([a-zA-Z]+):(['"0-9a-zA-Z_:\->\.\{\},;]+)/);
  if (tokens && tokens.length==3) environment[tokens[1]]=tokens[2];
});

function locationEvalError(e) {
  return (e.lineNumber?(' at line '+e.lineNumber+
                       (e.columnNumber?(' column '+e.columnNumber):'')):'')
}

if (typeof setImmediate == 'undefined') {
  function setImmediate(callback) {return setTimeout(callback,0)};
}

// Extend DIR with IP capabilities of NORTH, ..
DIR.North= function (ip) { return {tag:DIR.NORTH,ip:ip}}
DIR.South= function (ip) { return {tag:DIR.SOUTH,ip:ip}}
DIR.West = function (ip) { return {tag:DIR.WEST ,ip:ip}}
DIR.East = function (ip) { return {tag:DIR.EAST ,ip:ip}}
DIR.Up   = function (ip) { return {tag:DIR.UP ,ip:ip}}
DIR.Down = function (ip) { return {tag:DIR.DOWN ,ip:ip}}

/**
 *  typeof options = { 
 *                     connections?, 
 *                     print? is agent and control message output function,
 *                     printAgent? is agent message only output function,
 *                     fork?,
 *                     provider?, consumer?, 
 *                     classes?, 
 *                     id?:string is JAM and JAM root node id,
 *                     world?:string is JAM world id,
 *                     position?:{x,y}, 
 *                     cluster?:boolean|[] is an attached cluster node,
 *                     nowatch:boolean is a disable flag for agent watchdog checking,
 *                     checkpoint:boolean is a flag forcing code checkpointing (even if watchdog is available),
 *                     nolimits:boolean is a disable flag for agent resource monitoring,
 *                     log?:{class?:boolean,node?,agent?,parent?,host?,time?,Time?,pid?},
 *                     logJam?:{host?,time?,pid?,node?,world?},
 *                     scheduler?:scheduler is an external scheduler, singlestep?,
 *                     network?:{cluster?,rows,columns,connect?:function},
 *                     verbose?, TMO? }
 *  with typeof connections = { 
 *    @kind : {from:string,to?:string,proto:string='udp'|'tcp'|'http'|'stream',num?:number,on?,range?:number[]},
 *    @kind : {send:function, status:function, register?:function(@link)} , 
 *    @kind : .. }
 *  with @kind = {north,south,west,east,ip, ..}
 *
 * Connecting JAM nodes (IP)
 * -------------------------
 *   
 *  .. Jam({
 *    connections: {
 *      // Generic, P2PN
 *      ip?: {from:string,to?:string,proto:string='udp'|'tcp'|'http',num?:number} // AMP link (UDP) or set of AMP links (num>1)
 *      // Assigned to a logical direction, P2P
 *      north?: {                                                             
 *        from:string,to?:string,proto?='udp'|'tcp'|'http'|'device',device?:string // device is a hardware P2P stream device 
 *      }, ..
 *
 * Integration of host program streams
 * ------------------------------------
 *
 *  var chan = Some Stream Channel Object;
 *  
 *  .. Jam({
 *    connections: {
 *      north?: {
 *        register: function (link) {
 *          // register channel data handler with link handler 
 *          chan.on('data',function (data) {
 *            // process raw data, extract msg={agent:string,to?,from?,..} or {signal:string,to?,from?,..}
 *            if (msg.agent) link.emit('agent',msg.agent);
 *            if (msg.signal) link.emit('signal',msg.signal);
 *          });
 *        }
 *        send: function (msg) {
 *          chan.send(msg);
 *        },
 *        status: function (to) {
 *          return true;
 *        }
 *      }
 *    }, ..
 *  } 
 *  
 * Cluster
 * --------
 *
 * A forked cluster consists of a master node (0) and up to 8 child ndoes connected around the root node
 * by streams in directions {E,S,SE,W,SW,N,NW,NE}. Each node is executed physically in a different JAM process. 
 * Ex. network: {cluster:true, rows:2, columns:2},
 *
 */
 
var jam = function (options) {
  var self=this,
      p,conn,node;
  this.options = options||{};
  this.environment=environment;
  if (this.setup)           this.setup(); // overwrite options
  if (this.options.world && !this.options.id) this.options.id=this.options.world;
  if (!this.options.id)     this.options.id=Aios.aidgen();
  if (!this.options.log)    this.options.log={};
  if (!this.options.logJam) this.options.logJam={pid:false,host:false,time:false};
  this.verbose =  this.options.verbose || 0;
  this.Aios =     Aios;
  this.DIR =      Aios.aios.DIR;

  Aios.options.verbose=this.verbose;
  if (options.scheduler) Aios.current.scheduler=scheduler;
  if (options.nolimits||options.nowatch||options.checkpoint) 
    Aios.config({nolimits:options.nolimits,nowatch:options.nowatch,checkpoint:options.checkpoint});

  // out=function (msg) { Io.print('[JAM '+self.options.id+'] '+msg)};
  if (this.options.print)  Aios.print=Aios.printAgent=this.options.print;
  if (this.options.print2) Aios.printAgent=this.options.print2;
  if (this.options.printAgent) Aios.printAgent=this.options.printAgent;
  
  // JAM messages
  this.log=function (msg) { 
    var s='[JAM',sep=' ';
    if (self.options.logJam.pid && process) s += (' '+process.pid),sep=':';
    if (self.options.logJam.world && Aios.current.world) s += (sep+Aios.current.world.id),sep=':';
    if (self.options.logJam.node && Aios.current.node) s += (sep+Aios.current.node.id),sep=':';
    if (self.options.logJam.time) s += (sep+Aios.time());
    Aios.print(s+'] '+msg);
  };
  
  
  this.err=function (msg,err) {
    self.log('Error: '+msg);
    throw (err||'JAMLIB');
  }
  this.warn=function (msg) {
    self.log('Warning: '+msg);
  }
  
  this.error=undefined;
  
  // Create a world
  this.world = Aios.World.World([],{
    id:this.options.world||this.options.id.toUpperCase(),
    classes:options.classes||[],
    scheduler:options.scheduler,
    verbose:options.verbose
  });
  if (this.verbose) this.log('Created world '+this.world.id+'.');
  
  this.node=none;
  this.run=false;
  
  
  // Service loop executing the AIOS scheduler
  // NOT USED if there is an external scheduler supplied (world will create JAM scheduling loop)
  

  this.ticks=0;       // schedule loop execution counter!
  this.steps=0;       // Number of schedule loop execution steps
  this.loop=none;     // Schedule loop function
  this.looping=none;  // Current schedule loop run (or none); can be waiting for a timeout
      
  Aios.config({fastcopy:this.options.fastcopy,
               verbose:this.options.verbose});
  
  if (this.options.log) 
    for(p in this.options.log) Aios.config(this.options.log[p]?{"log+":p}:{"log-":p});

  this.process = Aios.Proc.Proc();
  this.process.agent={id:'jamlib'};
    
  this.events={};
}

// Import analyzer class...
var JamAnal = Require('jam/analyzer');
JamAnal.current(Aios);
jam.prototype.analyzeSyntax=JamAnal.jamc.prototype.analyze;
jam.prototype.syntax=JamAnal.jamc.prototype.syntax;



/** Add agent class to the JAM world and create sandboxed constructors.
 *  type constructor = function|string
 */
jam.prototype.addClass = function (name,constructor,env) {
  this.world.addClass(name,constructor,env);
  if (this.verbose) this.log('Agent class '+name+' added to world library.');
};

/** Add a new node to the world.
 *  Assumption: 2d meshgrid network with (x,y) coordinates.
 *  The root node has position {x=0,y=0}.
 *  type of nodeDesc = {x:number,y:number,id?}
 *
 */
jam.prototype.addNode = function (nodeDesc) {
  var node,x,y;
  x=nodeDesc.x;
  y=nodeDesc.y;
  if (Comp.array.find(this.world.nodes,function (node) {
    return node.position.x==x && node.position.y==y;
  })) {
    this.err('addNodes: Node at positition ('+x+','+y+') exists already.');
    return;
  }
  node=Aios.Node.Node({id:nodeDesc.id||Aios.aidgen(),position:{x:x,y:y}},true);
  if (this.verbose) this.log('Created node '+node.id+' ('+x+','+y+').');
  // Add node to world
  this.world.addNode(node);    
  return node.id;
}

/** Add logical nodes.
 *  The root node has position {x=0,y=0}.
 *  type of nodes = [{x:number,y:number,id?},..]
 */
jam.prototype.addNodes = function (nodes) {  
  var n,node,x,y,nodeids=[];
  for(n in nodes) {
    nodeids.push(this.addNode(nodes[n]));
  }
  return nodeids;
}

/** Analyze agent class template in text or object form
 ** typeof @options = {..,classname?:string}
 *  Returns {report:string,interface}
 */
jam.prototype.analyze = function (ac,options) {
  var source,name,syntax,content,report,interface;
  if (Comp.obj.isString(ac)) {
    // TODO
  } else if (Comp.obj.isObject(ac)) {
    // TODO
  } else if (Comp.obj.isFunction(ac)) {
    source = ac.toString();
    if (!options.classname) { 
      name=source.match(/^ *function *([^\s\(]*)\(/);
      if (name && name[1]!='') options.classname=name[1];
    }
    content = 'var ac ='+source;
    syntax = Esprima.parse(content, { tolerant: true, loc:true });
    try {
      interface=this.analyzeSyntax(syntax,{
        classname:options.classname||'anonymous',
        level:options.level==undefined?2:options.level,
        verbose:options.verbose,
        err:function (msg){throw msg},
        out:function (msg){if (!report) report=msg; else report=report+'\n'+msg;},
        warn:function (msg){if (!report) report=msg; else report=report+'\n'+msg;}
      });
      return {report:report||'OK',interface:interface};
    } catch (e) {
      return {report:e,interface:interface};
    }
  }
}
jam.prototype.clock = Aios.clock;

/** Compile (analyze) an agent class constructor function and add it to the world class library.
 ** Can be used after an open statement.
 ** Usage: compileClass(name,constructor,options?)
 **        compileClass(constructor,options?)
 **
 **  typeof @name=string|undefined
 **  typeof @constructor=function|string
 **  typeof @options={verbose:number|boolean)|verbose:number|undefined
*/ 
jam.prototype.compileClass = function (name,constructor,options) {
  var ac,p,verbose,content,syntax,report,text,env={ac:undefined},self=this,ac;

  if (typeof name == 'function') constructor=name,name=undefined,options=constructor;
  if (typeof options == 'object') verbose=options.verbose||0; 
  else if (options!=undefined) verbose=options; else verbose=this.verbose;
  // if (typeof constructor != 'function') throw 'compileClass: second constructor argument not a function';

  if (typeof constructor == 'function') text = constructor.toString();
  else text = constructor;
  
  if (!name) {
    // try to find name in function definition
    name=text.match(/[\s]*function[\s]*([A-Za-z0-9_]+)[\s]*\(/);
    if (!name) throw ('compileClass: No class name provided and no name found in constructor '+
                      text.substring(0,80));
    name=name[1];
    
  }
  content = 'var ac = '+text;
  try { syntax = Esprima.parse(content, { tolerant: true, loc:true }) }
  catch (e) { throw 'compileClass('+name+'): Parsing failed with '+e }
  report = this.analyzeSyntax(syntax,
    {
      classname:name,
      level:2,
      verbose:verbose||0,
      err:  function (msg){self.log(msg)},
      out:  function (msg){self.log(msg)},
      warn: function (msg){self.log(msg)}
    });
  if (report.errors.length) { throw 'compileClass('+name+'): failed with '+report.errors.join('; ')};
  for (p in report.activities) env[p]=p;
  try { with (env) { eval(content) } }
  catch (e) { throw ('compileClass('+name+'): failed with '+e+locationEvalError(e)) };
  ac=env.ac; env.ac=undefined;
  this.addClass(name,ac,env);
  return name;
}

/** Connect logical nodes (virtual link).
 *  The root node has position {x=0,y=0}.
 *  type of links = [{x1:number,y1:number,x2:number,x2:number},..]|[{x,y},{x,y}]
 */
jam.prototype.connectNodes = function (connections) {  
  var c,node1,node2,x1,y1,x2,y2,dir;
  if (connections[0].x != undefined && connections[0].y != undefined) {
    if (connections.length!=2) throw 'INVALID'; // invalid
    // simple style
    connections=[{x1:connections[0].x,x2:connections[1].x,
                  y1:connections[0].y,y2:connections[0].y}];
  }
  for(c in connections) {
    x1=connections[c].x1;
    y1=connections[c].y1;
    x2=connections[c].x2;
    y2=connections[c].y2;
    if (this.verbose) this.log('Connecting ('+x1+','+y1+') -> ('+x2+','+y2+')');
    node1=Comp.array.find(this.world.nodes,function (node) {
      return node.position.x==x1 && node.position.y==y1;
    });
    node2=Comp.array.find(this.world.nodes,function (node) {
      return node.position.x==x2 && node.position.y==y2;
    });
    if (!node1) this.err('connectNodes: Node at positition ('+x1+','+y1+') does not exist.');
    if (!node2) this.err('connectNodes: Node at positition ('+x2+','+y2+') does not exist.');
    if ((x2-x1)==0) {
      if ((y2-y1) > 0) dir=Aios.DIR.SOUTH;
      else dir=Aios.DIR.NORTH;
    } else if ((x2-x1)>0) dir=Aios.DIR.EAST;
    else dir=Aios.DIR.WEST;
    this.world.connect(dir,node1,node2);
    this.world.connect(Aios.DIR.opposite(dir),node2,node1);
  }
}

/** Dynamically connect remote endpoint at run-time
  * typeof @to = string <dir->url>|<url>
  */
jam.prototype.connectTo = function (to,nodeid) {
  var node=this.getNode(nodeid),
      tokens=(typeof to=='string')?to.split('->'):null,
      dir;
  // console.log(tokens)
  if (!node) return;
  if (to.tag) dir=to;
  else if (tokens.length==2) {
    dir=Aios.DIR.from(tokens[0]);
    if (dir) dir.ip=tokens[1];
  } else dir={tag:'DIR.IP',ip:to};
  if (dir) this.world.connectTo(dir,node);
}

/** Check connection status of a link
 *
 */
jam.prototype.connected = function (dir,nodeid) {
  var node=this.getNode(nodeid);
  if (!node) return;
  return this.world.connected(dir,node);
}

/** Create and start an agent from class ac with arguments. 
 *  Ac is either already loaded (i.e., ac specifies the class name) or 
 *  AC is supplied as a constructor function (ac), a class name, or a sandboxed constructor
 *  {fun:function,mask:{}} object for a specific level.
 *
 *  type of ac = string|object|function
 *  type of args = * []
 *  level = {0,1,2,3}
 *
 */
jam.prototype.createAgent = function (ac,args,level,className,parent) {
  var node=this.world.nodes[this.node],
      process=none,sac;
  if (level==undefined) level=1;
  if (!className && typeof ac == 'string') className=ac;
  if (!className && typeof ac == 'function') className=Aios.Code.className(ac);
  if (Comp.obj.isFunction(ac) || Comp.obj.isObject(ac)) {
    // Create an agent process from a constructor function or sandboxed constructor object
    process = Aios.Code.createOn(node,ac,args,level,className);
    if (process && !process.agent.parent) process.agent.parent=parent;
    if (process) return process.agent.id;   
  } else {
    // It is a class name. Find an already sandboxed constructor from world classes pool
    if (this.world.classes[ac])
      process = Aios.Code.createOn(node,this.world.classes[ac][level],args,level,className);
    else {
      this.error='createAgent: Cannot find agent class '+ac;
      this.log(this.error);
      return;
    }
    if (process) {
      if (!process.agent.parent) process.agent.parent=parent;
      process.agent.ac=ac;
      return process.agent.id; 
    } else return none;
  }
}

/** Create agent on specified (logical or physical) node.
 *  typeof node = number|string|{x,y}
 */
jam.prototype.createAgentOn = function (node,ac,args,level,className,parent) {
  var res,_currentNode=this.node,found=this.getNode(node);

  if (found) {
    this.setCurrentNode();
    res=this.createAgent(ac,args,level,className,parent);
    this.setCurrentNode(_currentNode);
  }
  return res;
}

/** Create a physical communication port
 *
 */
jam.prototype.createPort = function (dir,options,nodeid) {
  if (!options) options={};
  var multicast=options.multicast;
  switch (dir.tag) { 
    case Aios.DIR.NORTH: 
    case Aios.DIR.SOUTH: 
    case Aios.DIR.WEST: 
    case Aios.DIR.EAST: 
    case Aios.DIR.UP: 
    case Aios.DIR.DOWN: 
      multicast=false;
      break;
  }
  if (dir.ip && typeof dir.ip == 'string' && dir.ip.indexOf('//')>0) {
        // extract proto from url
        var addr = Aios.Amp.url2addr(dir.ip);
        if (!options.proto && addr.proto) options.proto=addr.proto;
        dir.ip=Aios.Amp.addr2url(addr);
  }
  if (options.from==undefined && dir.ip) options.from=dir.ip.toString();
  var  chan=this.world.connectPhy(
            dir,
            this.getNode(nodeid),
            {
              broker  :   options.broker,
              multicast : multicast,
              name  :     options.name,
              on    :     options.on,
              oneway  :   options.oneway,
              proto :     options.proto||'udp',
              rcv   :     options.from,
              secure :    options.secure,
              snd   :     options.to,
              verbose:(options.verbose!=undefined?options.verbose:this.verbose)
            });
  chan.init();
  chan.start();
  return chan;
}
/** Dynamically disconnect remote endpoint at run-time
 *
 */
jam.prototype.disconnect = function (to,nodeid) {
  var node=this.getNode(nodeid);
  if (node) {
    this.world.disconnect(to,node);
  }
}

/** Emit an event
 ** function emit(@event,@arg1,..)
 */
jam.prototype.emit = function () {
  Aios.emit.apply(this,arguments);
}


/** Execute an agent snapshot on current node delivered in JSON+ text format or read from a file. 
 */
jam.prototype.execute = function (data,file) {
  if (!data && file && fs) 
    try {
      data=fs.readFileSync(file,'utf8');
    } catch (e) {
      this.log('Error: Reading file '+file+' failed: '+e);
      return undefined;
    }
  if (data) return this.world.nodes[this.node].receive(data,true);
}

/** Execute an agent snapshot on node @node delivered in JSON+ text format or read from a file.
 */
jam.prototype.executeOn = function (data,node,file) {
  node=this.getNode(node);
  if (!node) return;
  if (!data && file && fs) 
    try {
      data=fs.readFileSync(file,'utf8');
    } catch (e) {
      this.log('Error: Reading file '+file+' failed: '+e);
      return undefined;
    }
  if (data) return node.receive(data,true);
}

/** Extend AIOS of specific privilege level. The added functions can be accessed by agents.
 *
 * function extend(level:number [],name:string,func:function,argn?:number|number []);
 */
jam.prototype.extend = function (level,name,func,argn) {
  var self=this;
  if (Comp.obj.isArray(level)) {
    Comp.array.iter(level,function (l) {self.extend(l,name,func,argn)});
    return;
  }
  switch (level) {
    case 0: 
      if (Aios.aios0[name]) throw Error('JAM: Cannot extend AIOS(0) with '+name+', existst already!');
      Aios.aios0[name]=func; break;
    case 1: 
      if (Aios.aios1[name]) throw Error('JAM: Cannot extend AIOS(1) with '+name+', existst already!');
      Aios.aios1[name]=func; break;
    case 2: 
      if (Aios.aios2[name]) throw Error('JAM: Cannot extend AIOS(2) with '+name+', existst already!');
      Aios.aios2[name]=func; break;
    case 3: 
      if (Aios.aios3[name]) throw Error('JAM: Cannot extend AIOS(3) with '+name+', existst already!');
      Aios.aios3[name]=func; break;
    default:
      throw Error('JAM: Extend: Invalid privilige level argument ([0,1,2,3])');
  }
  if (!JamAnal.corefuncs[name]) JamAnal.corefuncs[name]={argn:argn||func.length}; 
}

/** Return node object referenced by logical node number, position, or name
 *  If @id is undefined return current node object.
 */
jam.prototype.getNode = function (id) {
  var node;
  if (id==undefined) return this.world.nodes[this.node];
  if (typeof id == 'number') 
    node=this.world.nodes[id];
  else if (typeof id == 'string') {
    // Search node identifier or position;
    loop: for(var i in this.world.nodes) {
      if (this.world.nodes[i] && this.world.nodes[i].id==id) {
        node = this.world.nodes[i];
        break loop;
      } 
    }
  } else if (id.x != undefined && 
             id.y != undefined) {
    // Search node position;
    loop: for(var i in this.world.nodes) {
      if (this.world.nodes[i] && Comp.obj.equal(this.world.nodes[i].position,id)) {
        node = this.world.nodes[i];
        break loop;
      } 
    }
  }
  
  return node;
} 

/** Return node name from logical node number or position
 *
 */
jam.prototype.getNodeName = function (nodeNumberorPosition) {
  var node=this.getNode(nodeNumberorPosition);  
  if (node) return node.id;
} 

/** Get current agent process or search for agent process
 *
 */
jam.prototype.getProcess = function (agent) {
  if (!agent)
    return Aios.current.process;
  else {
    var node = this.getNode();  // current node
    if (node) return node.getAgentProcess(agent);
  }
}


/** Return node name from logical node number or position
 *
 */
jam.prototype.getWorldName = function () {
  return this.world.id;
} 

/** Get info about node, agents, plattform
 *
 */
jam.prototype.info = function (kind,id) {
  switch (kind) {
    case 'node':
      var node=this.getNode(id);
      if (!node) return;
      return { 
        id:node.id, 
        position: node.position, 
        location:node.location,
        type:node.type 
      }
      break;
    case 'agent':
      var agent = this.getProcess(id);
      if (!agent) return;
      var code = Aios.Code.print(agent.agent,true);
      return {
        id:id,
        pid:agent.pid,
        level:agent.level,
        blocked:agent.blocked,
        suspended:agent.suspended,
        resources:agent.resources,
        code:code
      }
      break;
    case 'agent-data':
      var agent = this.getProcess(id);
      if (!agent) return;
      else return agent.agent;
      break;
    case 'version': return Aios.options.version;
    case 'host': return { 
      type:global.TARGET,
      watchdog:Aios.watchdog?true:false,
      protect: Aios.watchdog&&Aios.watchdog.protect?true:false,
      jsonify:Aios.options.json,
      minify:!Aios.Code.options.compactit,
    };
    case 'platform': return platform;     
  }
}

/** INITIALIZE
 *  1. Create and initialize node(s)/world
 *  2. Add optional TS provider/consumer
 *  3. Create physical network conenctions
 */
jam.prototype.init = function (callback) {
  var i=0,j=0, n, p, id, node, connect=[], chan, dir, dirs, pos,
      self=this;
  
  // Current node == root node
  this.node=0;

  ///////////// CREATE NODES /////////
  if (!this.options.network) {
    if (this.options.position) i=this.options.position.x,j=this.options.position.y;
    // Create one (root) node if not already existing
    if (!this.getNode({x:i,y:j})) {
      node = Aios.Node.Node({
          id:this.options.id,
          position:{x:i,y:j},
          TMO:this.options.TMO,
          type:this.options.type
        },true);
      // Add node to world
      if (this.verbose) this.log('Created '+(i==0&&j==0?'root ':'')+'node '+node.id+' ('+i+','+j+').');
      this.world.addNode(node);
    }
    // Register jamlib event handler for the root node
    this.register(node);
  } else if (!this.options.network.cluster) {
    // Create a virtual network of logical nodes. Default: grid
    if (this.options.network.rows && this.options.network.columns) {
      for(j=0;j<this.options.network.rows;j++) 
        for(i=0;i<this.options.network.columns;i++) {
          node = Aios.Node.Node({id:Aios.aidgen(),position:{x:i,y:j},TMO:this.options.TMO},true);
          if (this.verbose) this.log('Created node '+node.id+' at ('+i+','+j+').');
          if (i==0&&j==0) {
            // Register jamlib event handler for the root node
            this.register(node);
          }
          this.world.addNode(node);
        }
      // Connect nodes with virtual links
      for(j=0;j<this.options.network.rows;j++) 
        for(i=0;i<this.options.network.columns;i++) {
          if (i+1<this.options.network.columns)  connect.push({x1:i,y1:j,x2:i+1,y2:j});
          if (j+1<this.options.network.rows)  connect.push({x1:i,y1:j,x2:i,y2:j+1});
        }
      if (this.options.network.connect) connect=connect.filter(this.options.network.connect);
      this.connectNodes(connect);
    }
  } else if (this.options.network.cluster && this.options.fork) {
      // Physical network cluster; each node is executed in a process on this host
      dirs=[DIR.ORIGIN,DIR.EAST,DIR.SOUTH,DIR.SE,DIR.WEST,DIR.SW,DIR.NORTH,DIR.NW,DIR.NE];
      pos={x:[0,1,0,1,-1,-1,0,-1,1],
           y:[0,0,1,1,0,1,-1,-1,-1]};
      // Create a physical network of nodes. Here create only the root node (0,0)
      this.cluster=[]; this.master=true;
      for(j=0;j<this.options.network.rows;j++) 
        for(i=0;i<this.options.network.columns;i++) {
          id=Aios.aidgen();
          if (i==0 && j==0) {
            dir=undefined;
            node = Aios.Node.Node({id:id,position:{x:i,y:j},TMO:this.options.TMO},true);
            if (this.verbose) this.log('Created root node '+node.id+' at ('+i+','+j+').');
            // Register jamlib event handler for the root node
            this.register(node);
            this.world.addNode(node); 
          } else {
            n=i+j*this.options.network.columns;
            dir=dirs[n];
            if (this.verbose) this.log('Started cluster node '+id+' at ('+i+','+j+'). with link '+DIR.print(dir));
            this.cluster[id]=this.options.fork(process.argv[1],['autosetup:'+JSON.stringify({
              id:id,
              world:this.world.id,
              cluster:true,
              network:null,
              position:{x:pos.x[n],y:pos.y[n]},
              dir:dir,
              connections:{
                stream:{
                  dir:DIR.opposite(dir)
                }
              }
            })]);
            this.cluster[id].dir=dir;
            // Clustered forked nodes communicate via process.send, receive message via process.on('message') handler
          }
        }
      // Create physical stream links to all child nodes
      for(p in this.cluster) {
        chan=this.world.connectPhy(
            this.cluster[p].dir,
            this.getNode(),
            {
              proto:'stream',
              sock:this.cluster[p],
              mode:'object',
              verbose:this.verbose
            });
        chan.init();                
      }
  }

  //////////// Install host platform tuple provider and consumer //////////
  
  /*
  ** Each time a tuple of a specific dimension is requested by an agent (rd) 
  ** the provider function can return (provide) a mathcing tuple (returning the tuple).
  ** IO gate between agents/JAM and host application.
  */
  if (this.options.provider) this.world.nodes[this.node].ts.register(function (pat) {
    // Caching?
    return self.options.provider(pat);
  });

  /*
  ** Each time a tuple of a specific dimension is stored by an agent (out) 
  ** the consumer function can return consume the tuple (returning true).
  ** IO gate between agents/JAM and host application.
  */
  if (this.options.consumer) this.world.nodes[this.node].ts.register(function (tuple) {
    // Caching?
    return self.options.consumer(tuple);
  },true);
  
  ///////////// CREATE NETWORK CONNECTIVITY /////////

  // Register host application connections {send,status,count,register?} using host app. streams or
  // create physical conenction ports (using the AMP P2P protocol over IP/RS232) {from:*,proto:'udp'|..}
  if (this.options.connections) {
    for (p in this.options.connections) {
      conn=this.options.connections[p];
      if (!conn) continue;
      
      if (p=='ip' || conn.proto) {
        // 1. IP
        // Attach AMP port to root node, actually not linked with endpoint
        n=1;
        switch (p) {
          case 'ip': 
            dir=this.DIR.IP(this.options.connections.ip.from||'*');
                                                        // actually not linked with endpoint
            n = (conn.range && conn.range.length==2 && (conn.range[1]-conn.range[0]+1))||
                conn.num||
                1; // multiple interface are allowed
            break;
          case 'north': dir=this.DIR.NORTH; break;
          case 'south': dir=this.DIR.SOUTH; break;
          case 'west': dir=this.DIR.WEST; break;
          case 'east': dir=this.DIR.EAST; break;
          case 'up': dir=this.DIR.UP; break;
          case 'down': dir=this.DIR.DOWN; break;
        }
        function makeAddr(ip,i) {
          if (!conn.range) return ip;
          else return ip+':'+(conn.range[0]+i);
        }
        for(i=0;i<n;i++) {
          chan=this.world.connectPhy(
            dir,
            this.getNode(),
            {
              broker:conn.broker,
              multicast:conn.multicast,
              name:conn.name,
              on:conn.on,
              oneway:conn.oneway,
              proto:conn.proto||'udp',
              rcv:makeAddr(conn.from,i),
              snd:conn.to,
              verbose:this.verbose
            });
          chan.init();
        }
      } else if (conn.send) {
        // 2. Host stream interface
        node=this.world.nodes[this.node]; // TODO: connections.node -> world node#
        function makeconn (p,conn) {
          var link = { 
            _handler:[],
            emit: function (event,msg) {
              if (link._handler[event]) link._handler[event](msg);
            },
            on: function (event,callback) {
              link._handler[event]=callback;
            },
            send: function (data,dest,context) {
              var res;
              self.world.nodes[self.node].connections[p]._count += data.length;
              res=conn.send(data,dest);
              if (!res) {
                context.error='Migration to destination '+dest+' failed';
                // We're still in the agent process context! Throw an error for this agent ..
                throw 'MOVE';              
              };

              // kill ghost agent
              context.process.finalize();
            },
            status : conn.status?conn.status:(function () {return true}),
            count: conn.count?conn.count:function () {return link._count},
            _count:0
          };
          if (conn.register) conn.register(link);
          return link;       
        }
        node.connections[p] = makeconn(p,conn);
        // register agent receiver and signal handler
        node.connections[p].on('agent',node.receive.bind(node));
        node.connections[p].on('signal',node.handle.bind(node));
      } else if (p=='stream') {
        // 3. Physical process stream interface (cluster); child->parent proecss connection
        chan=this.world.connectPhy(
            conn.dir,
            this.getNode(),
            {
              proto:'stream',
              sock:process,
              mode:'object',
              verbose:this.verbose
            });
        chan.init();
      }    
    } 
  }
  if (callback) callback();

}


/** Tuple space input operation - non blocking, i.e., equiv. to inp(pat,_,0)
 */
jam.prototype.inp = function (pat,all) {
  return this.world.nodes[this.node].ts.extern.inp(pat,all);
}


/** Kill agent with specified id ('*': kill all agents on node or current node)
 */
jam.prototype.kill = function (id,node) {
  if (id=='*') {
    this.world.nodes[this.node].processes.table.forEach(function (p) {
      if (p) Aios.kill(p.agent.id);
    });
  } else
    return Aios.kill(id);
}

/** Try to locate this node (based on network connectivity)
 *  Any geospatial information is attached to current (node=undefined) or specific node
 */
 
jam.prototype.locate = function (nodeid,cb) {
  var node=this.getNode(nodeid);
  if (!node) return;
  Sat.satelize({},function (err,info) {
        if (err) {
          return cb?cb(undefined,err):console.log(err.toString());
        } else {
          var location = {
            ip:info.query,
            gps:{lat:info.lat,lon:info.lon},
            geo:{city:info.city,country:info.country,countryCode:info.countryCode,region:info.region,zip:info.zip}
          }
          node.location=location;
          if (cb) cb(location);
        }
   })
}
/** Lookup nodes and get connection info (more general as connected and broker support)
 *
 */
jam.prototype.lookup = function (dir,callback,nodeid) {
  var node=this.getNode(nodeid);
  if (!node) return;
  return this.world.lookup(dir,callback,node);
}

/** Tuple space output operation with timeout 
 */
jam.prototype.mark = function (tuple,tmo) {
  return this.world.nodes[this.node].ts.extern.mark(tuple,tmo);
}


/** Execute an agent snapshot in JSON+ text form after migration provided from host application
 */
jam.prototype.migrate = function (data) {
  return this.world.nodes[this.node].receive(data,false);
}

/** Install event handler
*
*   typeof @event = {'agent','agent+','agent-','signal+','signal','link+','link-',..}
*   agent+/agent-: Agent creation and destruction event
*   agent: Agent receive event
*   signal+: Signal raise event
*   signal: Signal receive (handle) event
*   route+: A new link was established
*   route-: A link is broken
*/

jam.prototype.on = function (event,handler) {
  Aios.on(event,handler);
}

/** Remove event handler
 */
jam.prototype.off = function (ev) {
  Aios.off(event); 
}



/** Read and parse one agent class from file. Can contain nested open statements.
 *  Browser (no fs module): @file parameter contains source text.
 *  File/source text format: function [ac] (p1,p2,..) { this.x; .. ; this.act = {..}; ..}
 *  open(file:string,options?:{verbose?:number|boolean,classname?:string}) -> function | object
 *  
 *  Output can be processed by method compileClass
 */
jam.prototype.open = function (file,options) {
  var self=this,
      res,
      text,
      name,
      ast=null;
  if (!options) options={};
  name=options.classname||'<unknown>';
  if (options.verbose>0) this.log('Reading agent class template '+name+' from '+file);
  
  function parseModel (text) {
    var modu={},more,module={exports:{}},name=text.match(/[\s]*function[\s]*([a-z0-9]+)[\s]*\(/);
    if (name) name=name[1];
    function open(filename) {
      var text;
      try {
        text=fs?fs.readFileSync(filename,'utf8'):null;
        return parseModel(text);
      } catch (e) {
        self.log('Error: Opening of '+(fs?file:'text')+' failed: '+e); 
      }
    }
    try {
      with (module) {eval('res = '+text)};
      if (name) { modu[name]=res; return modu} 
      else if (module.exports) return module.exports; 
      else return res;
    } catch (e) {
      try {
        ast = Esprima.parse(text, { tolerant: true, loc:true });
        if (ast.errors && ast.errors.length>0) more = ', '+ast.errors[0];
      } catch (e) {
        if (e.lineNumber) more = ', in line '+e.lineNumber; 
      } 
      self.log(e.name+(e.message?': '+e.message:'')+(more?more:''));
    }
  }
  try {
    text=fs?fs.readFileSync(file,'utf8'):file;    // Browser: file parameter contains already source text
    return parseModel(text);
  } catch (e) {
    this.log('Error: Opening of '+(fs?file:'text')+' failed: '+e); 
  }  
};

/** Tuple space output operation 
 */
jam.prototype.out = function (tuple) {
  return this.world.nodes[this.node].ts.extern.out(tuple);
}

/** Tuple space read operation - non blocking, i.e., equiv. to rd(pat,_,0)
 */
jam.prototype.rd = function (pat,all) {
  return this.world.nodes[this.node].ts.extern.rd(pat,all);
}

/** 1. Read agent template classes from file and compile (analyze) agent constructor functions.
 *     Expected file format: module.exports = { ac1: function (p1,p2,..) {}, ac2:.. }
 *  2. Read single agent constructor function from file
 *
 * typeof @options={verbose,error:function}
 */
// TODO: clean up, split fs interface, no require caching ..
if (fs) jam.prototype.readClass = function (file,options) {
  var self=this,
      ac,
      name,
      env,
      interface,
      text,
      modu,
      path,
      p,m,
      regex1,
      ast=null,
      fileText=null,
      off=null;
  this.error=_;
  function errLoc(ast) {
    var err;
    if (ast && ast.errors && ast.errors.length) {
      err=ast.errors[0];
      if (err.lineNumber != undefined) return 'line '+err.lineNumber;
    }
    return 'unknown'
  }
  try {
    if (!options) options={};
    if (options.verbose>0) this.log('Looking up agent class template(s) from '+file);
    //modu=Require(file);
    if (Comp.obj.isEmpty(modu)) {
      if (options.verbose>0) this.log('Reading agent class template(s) from file '+file);
      if (Comp.string.get(file,0)!='/') 
        path = (process.cwd?process.cwd()+'/':'./')+file;
      else
        path = file;
      fileText=fs.readFileSync(path,'utf8');
      ast=Esprima.parse(fileText, { tolerant: true, loc:true });
      if (require.cache) delete require.cache[file]; // force reload of file by require
      modu=require(path);
      if(Comp.obj.isEmpty(modu)) {
        modu={};
        // Try evaluation of fileText containing one single function definition
        if (!fileText) throw 'No such file!';
        name=fileText.match(/[\s]*function[\s]*([a-z0-9]+)[\s]*\(/);
        if (!name) throw ('Export interface of module is empty and file contains no valid function definition!');
        name=name[1];
        eval('(function () {'+fileText+' modu["'+name+'"]='+name+'})()');        
      }
    }
    if (!modu || Comp.obj.isEmpty(modu)) throw 'Empty module.';
    
    for (m in modu) {
      ac=modu[m];
      env={};

      if (fileText)       off=this.syntax.find(fileText,'VariableDeclarator',m);
      if (off && off.loc) this.syntax.offset=off.loc.start.line-1;

      content = 'var ac = '+ac;
      syntax = Esprima.parse(content, { tolerant: true, loc:true });
      interface = this.analyzeSyntax(syntax,
        {
          classname:m,
          level:2,
          verbose:  options.verbose||0,
          err:      options.error||function (msg){throw(msg)},
          out:      function (msg){self.log(msg)},
          warn:     function (msg){self.log(msg)}
        });
      // text=Json.stringify(ac);
      for (var p in interface.activities) env[p]=p;
      with (env) { eval(content) };

      if (options.verbose>0) this.log('Adding agent class constructor '+m+' ('+(typeof ac)+').');
      this.addClass(m,ac,env);
      this.syntax.offset=0;
    }
    this.error=undefined;
    return true;
  } catch (e) {
    this.error='Compiling agent class file "'+file+'" failed: '+e+
               (ast && ast.errors.length?', in '+errLoc(ast):'');
    if (options.error) 
      options.error(e+(ast && ast.errors.length?', in '+errLoc(ast):''));
    else {
      this.log(this.error);
    }
    return false;
  }
};

/** Register jamlib event handler for the (root) node
*/
jam.prototype.register = function (node) {
  this.on('agent', function (msg) { node.receive(msg) });
  this.on('signal', function (msg) { node.handle(msg) });
}

/** Disconnect and remove a virtual node from the world
 *
 */
jam.prototype.removeNode = function (nodeid) {
  this.world.removeNode(nodeid);  
}

/** Tuple space remove operation 
 */
jam.prototype.rm = function (pat,all) {
  return this.world.nodes[this.node].ts.extern.rm(pat,all);
}


/** Take an agent process snapshot executed currently on given node @node:number|string|undefined.
 *  If @file:string is not specified, a string containing the snapshot is
 *  returned, otehrwise it is saved to the file (text format. JSON+).
 *  If @node is undefined, the current node is used.
 *  If @kill is set, the agent is killed after taken the snapshot.
 */
jam.prototype.saveSnapshotOn = function (aid,node,file,kill) {
  var snapshot,pro;
  node=this.getNode(node);
  if (!node) return;
  // Look-up agent process ..
  pro=node.getAgentProcess(aid);
  if (!pro) return;
  // Take snapshot od the process ..
  snapshot=Aios.Code.ofCode(pro,false);
  if (kill) Aios.killOn(aid,node);
  // Save it ..
  if (!file) return snapshot;
  else if (fs) return fs.writeFileSync(file, snapshot, 'utf8');
}

jam.prototype.saveSnapshot = function (aid,file,kill) {
  return this.saveSnapshotOn(aid,_,file,kill);
}

/** Force a scheduler run immediately normally executed by the
 *  jam service loop. Required if there were externeal agent 
 *  management, e.g., by sending signals.
 */
jam.prototype.schedule = function () {
  if (this.loop) {
    clearTimeout(this.loop);
    setImmediate(this.looping);
  } else if (!this.run) setImmediate(this.looping);
}


/** Access to JAM security module
 *
 */
jam.prototype.security = Aios.Sec;

/** Set current node
 *
 */
jam.prototype.setCurrentNode=function (n) {
  if (n>=0 && n < this.world.nodes.length) this.node=n;
}

/** Send a signal to a specific agent 'to'.
 *
 */
jam.prototype.signal=function (to,sig,arg,broadcast) {
  var node=this.getNode(),
      _process=Aios.current.process;
  Aios.current.process=this.process;
  if (!broadcast)
    Aios.aios.send(to,sig,arg);
  else  
    Aios.aios.broadcast(to,sig,arg);    
    
  Aios.current.process=_process;
  this.schedule();
}


/** Start the JAM scheduler
 *
 */
jam.prototype.start=function (callback) {
  var self=this,cbl=CBL(callback);
  // Start all connections if not already done
  
  this.world.nodes.forEach(function (node) {
    node.connections.forEach(function (chan,kind) {
      if (!chan) return;
      if (chan.start) cbl.push(function (next) {chan.start(next)});
    });
  });
  cbl.start();
  
  Aios.on('schedule',function () {
    self.schedule();
  });

  function loop() {
    var loop = function () {
      var nexttime,curtime;
      if (self.verbose>3) self.log('loop: Entering scheduler #'+self.ticks);
      self.ticks++;

      nexttime=Aios.scheduler();
      curtime=Aios.time();
      if (self.verbose>3) self.log('loop: Scheduler returned nexttime='+nexttime+
                                           ' ('+(nexttime>0?nexttime-curtime:0)+')');
      if (!self.run) return;
      if (nexttime>0) 
        self.loop=setTimeout(loop,nexttime-curtime);
      else if (nexttime==0) 
        self.loop=setTimeout(loop,1000);
      else setImmediate(loop);
      // else setTimeout(loop,10);
    };
    self.loop = setTimeout(loop,1);
  };
  this.looping=loop;
  
  Aios.config({iterations:100});

  this.run=true;
  this.world.start();
  if (this.verbose) this.log('Starting JAM loop .. ');
  if (!this.options.scheduler) this.loop = setTimeout(loop,1); // Start internal scheduling loop
}

/** Get agent process table info and other statistics
 *
 *  type kind = 'process'|'agent'|'node'|'vm'|'conn'
 */
 
 
jam.prototype.stats = function (kind,id) {
  var p,n,sys,conn,pro,agent,state,stats,allstats={},signals,node;
  switch (kind) {
    case 'process':      
    case 'agent':      
      for(n in this.world.nodes) {        
        stats={};
        node=this.world.nodes[n];
        for (p in node.processes.table) {
          if (node.processes.table[p]) {
            pro=node.processes.table[p];
            if (pro.signals.length == 0) signals=[];
            else signals = pro.signals.map(function (sig)  {return sig[0] });
            agent=pro.agent;
            if (pro.suspended) state='SUSPENDED';
            else if (pro.blocked) state='BLOCKED';
            else if (pro.dead) state='DEAD';
            else if (pro.kill) state='KILL';
            else if (pro.move) state='MOVE';
            else state='READY';
            stats[agent.id]={
              pid:pro.pid,
              gid:pro.gid,
              state:state,
              parent:pro.agent.parent,
              class:pro.agent.ac,
              next:agent.next,
              resources:Comp.obj.copy(pro.resources)
            };
            if (signals.length) stats[agent.id].signals=signals;
          }
        }
        allstats[node.id]=stats;
      }
    break;
    case 'node':
      return Comp.obj.copy(this.getNode(id).stats);
    break;
    case 'conn':
      for(n in this.world.nodes) {        
        stats={};
        node=this.world.nodes[n];
        for (p in node.connections) {
          conn=node.connections[p];
          if (conn) {
            stats[p]={count:conn.count(),conn:conn.status('%')};
          }
        }
        allstats[node.id]=stats;
      }
    break;
    case 'vm':
      // Return VM memory usage in kB units and VM system information
      if (process && process.memoryUsage) {
        sys=process.memoryUsage();
        for ( p in sys) sys[p] = (sys[p]/1024)|0;
        sys.v8 = process.versions && process.versions.v8;
        sys.node = process.versions && process.versions.node;
        sys.arch = process.arch;
        sys.platform = process.platform;
        sys.watchdog = Aios.watchdog?(Aios.watchdog.checkPoint?'semi':'full'):'none'; 
        return sys;
      }
    break;
  }
  if (this.world.nodes.length==1) return stats;
  else return allstats;
}

/** Stepping the scheduler loop 
 */
jam.prototype.step = function (steps,callback) {
  // TODO: accurate timing
  var self=this,
      milliTime=function () {return Math.ceil(Date.now())},
      curtime=Aios.time(),// Aios.time();
      lasttime=curtime;

      
  function loop () {
    var loop = function () {
      var nexttime,curtime;
      if (self.verbose>1) self.log('loop: Entering scheduler #'+self.ticks);
      self.ticks++,self.steps--;
      self.time=curtime=Aios.time();

      // Execute scheduler loop
      nexttime=Aios.scheduler();
      
      curtime=Aios.time();
      if (self.verbose>3) self.log('loop: Scheduler returned nexttime='+nexttime+
                                           ' ('+(nexttime>0?nexttime-curtime:0)+')');
      if (self.steps==0 || !self.run) {
        self.loop=none;
        self.run=false;
        self.time=curtime;
        if (callback) callback();
        return;              
      }
      if (nexttime>0) 
        self.loop=setTimeout(loop,nexttime-curtime);
      else if (nexttime < 0) self.loop=setImmediate(loop);
      else {
        self.loop=none;
        self.run=false;
        self.time=curtime;
        if (callback) callback();        
      }
    };
    self.loop = setTimeout(loop,1);
  };
  this.looping=loop;
  
  Aios.config({iterations:1});
  this.steps=steps;
  this.run=true;
  if (this.time>0) current.world.lag=current.world.lag+(curtime-this.time);
  this.time=curtime;
  if (!this.options.scheduler) this.loop = setTimeout(loop,0); // Start internal scheduling loop
}


/** Stop the JAM scheduler and all network connections
 * 
 */
jam.prototype.stop=function (callback) {
  this.run=false,cbl=CBL(callback);
  this.log('Stopping JAM ..');
  Aios.off('schedule');
  if (this.loop)
    clearTimeout(this.loop);
  this.world.nodes.forEach(function (node) {
    node.connections.forEach(function (chan,kind) {
      if (!chan) return;
      if (chan.stop) cbl.push(function (next) {chan.stop(next)});
    });
  });
  cbl.start();
}
/** Tuple space test operation - non blocking
 */
jam.prototype.test = function (pat) {
  return this.world.nodes[this.node].ts.extern.exists(pat);
}

/** Tuple space testandset operation 
 */
jam.prototype.ts = function (pat,callback) {
  return this.world.nodes[this.node].ts.extern.ts(pat,callback);
}

/** Get JAM time
 */
jam.prototype.time=function () {
  return Aios.time();
}

/** Get JAMLIB version
 */
jam.prototype.version=function () {
  return options.version;
}



var Jam = function(options) {
  var obj = new jam(options);
  return obj;
};

/** Embedded cluster setup and start; 
 * Provided by process arguments
 */
if (environment.autosetup) {
  try {
    var _options=JSON.parse(environment.autosetup);
    // console.log('['+process.pid+'] JAM cluster setup with options:',process.argv[_index+1]);
    jam.prototype.setup=function () {
      for(var p in _options) this.options[p]=_options[p];
    }
  } catch (e) {
    console.log('['+process.pid+'] JAM auto setup failed: '+e);
  }
}


module.exports = {
  Aios:Aios,
  Comp:Comp,
  Esprima:Esprima,
  Io:Io,
  Jam:Jam,
  Json:Json,
  environment:environment,
  options:options
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
 **    $VERSION:     1.23.2
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
    /** Return the maximum element of an array applying
     *  an optional mapping function.
     *
     * @param {* []} array
     * @param [fun]
     * @returns {number|undefined}
     */
    max : function (array,fun) {        
        var res,max,num;
        for(var i in array) {
            if (fun) num=fun(array[i]); else num=array[i];
            if (max==undefined) { max=num; res=array[i] } 
            else if (num > max) { max=num; res=array[i] }
        }
        return res;
    },
    /** Return the minimum element of an array applying
     *  an optional mapping function.
     *
     * @param {* []} array
     * @param [fun]
     * @returns {number|undefined}
     */
    min : function (array,fun) {        
        var res,min,num;
        for(var i in array) {
            if (fun) num=fun(array[i]); else num=array[i];
            if (min==undefined) { min=num; res=array[i] }
            else if (num < min) { min=num; res=array[i] }
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
BundleModuleCode['jam/aios']=function (module,exports,global,process){
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
 **    $CREATED:     15-1-16 by sbosse.
 **    $VERSION:     1.46.3
 **    $RCS:         $Id: aios.js,v 1.5 2017/06/19 17:18:39 sbosse Exp sbosse $
 **    $INFO:
 **
 **  JavaScript AIOS: Agent Execution & IO System with Sandbox environment.
 **
 **    $ENDOFINFO
 */
var Io =    Require('com/io');
var Comp =  Require('com/compat');
var Name =  Require('com/pwgen');
var Conf =  Require('jam/conf');
var Code =  Require('jam/code');
var Sig =   Require('jam/sig');
var Node =  Require('jam/node');
var Proc =  Require('jam/proc');
var Sec  =  Require('jam/security');
var Ts =    Require('jam/ts');
var World = Require('jam/world');
var Chan =  Require('jam/chan');
var Mobi =  Require('jam/mobi');
var Simu =  global.config.simulation?Require(global.config.simulation):none;
var Json =  Require('jam/jsonfn');
var watchdog = Require('jam/watchdog');
var util =  Require('util');
var Amp  =  Require('jam/amp')

var aiosExceptions = ['CREATE','MOVE','SIGNAL','SCHEDULE','WATCHDOG','EOL','KILL'];
var aiosEvents = ['agent','agent+','agent-','signal','signal+','node+','node-'];

// AIOS OPTIONS //
var options =  {
  version: "1.46.3",
  // Fast dirty process forking and migration between logical nodes (virtual)
  // w/o using of/toCode?
  fastcopy:false,
  // Using JSON+ (json compliant) or JSOB (raw object) in to/ofCode?
  json:false,
  // logging parameters
  log : {
    node:false,
    agent:true,
    parent:false,
    pid:false,    // agent process id!
    host:false,   // host id (os pid)
    time:false,   // time in milliseconds
    Time:true,    // time in hour:minute:sec format
    class:false
  },
  // agent ID generator name options
  nameopts : {length:8, memorable:true, lowercase:true},
  // Disable agent checkpointing and resource control
  nolimits:false,
  // No statistics
  nostats:false,
  // Use process memory for resource control? (slows down JAM execution)
  useproc: false,
  // Verbosity level
  verbose:0,
  
  // Default maximal life-time on this host (even idle)
  LIFETIME: Infinity,
  // Default maximal run-time of an agent process activity
  TIMESCHED:200,
  // Default maximal run-time of an agent process
  TIMEPOOL:5000,
  // Default maximal memory of an agent (code+data)
  MEMPOOL:50000,
  // Maximal number of tuple generations on current node
  TSPOOL:1000,
  // Maximal number of agent generations on current node
  AGENTPOOL:20,
  // Default minimal run-time costs below 1ms resolution (very short activity executions)
  MINCOST:0.1,
  // Default maximal scheduler run-time
  RUNTIME:1000,
  
  // Default scheduler idle-time (maximal nexttime interval)
  IDLETIME:0,
  
  // Random service ports (capability protection)
  // (public service port: private security port) pairs
  security : {
  }
};

var timer,
    ticks=0,  // scheduler execution counter!
    iterations=0,
    events={};

// Current execution environment (scheduler: global scheduler)
var current = {process:none,world:none,node:none,network:none,error:none,scheduler:none};

// System clock in ms (what=true) or hh:mm:ss format (what=undefined) or
// full date+time (what='date')
function clock (what) {
  if (what==undefined) return Io.Time();
  else if (what=='date') return Io.Date();
  else return Io.time();  // ms clock
}

// AIOS smart logging function for Agents
var logAgent = function(){
    var msg='';
    arguments.forEach(function (arg,i) {
      if (typeof arg == 'string' || typeof arg == Number) msg += (i>0?', '+arg:arg);
      else msg += (i>0?' '+Io.inspect(arg):Io.inspect(arg));
    });
    (Aios.printAgent||Aios.print)('['+(options.log.host?(process.pid+'.'):'')+
               (options.log.world&&current.world?(current.world.id+'.'):'')+
               (options.log.node&&current.node?(current.node.id+'.'):'')+
               (options.log.class&&current.process?(current.process.agent.ac+'.'):'')+
               (options.log.agent&&current.process?(current.process.agent.id):'')+
               (options.log.parent&&current.process?('<'+current.process.agent.parent):'')+
               (options.log.pid&&current.process?('('+current.process.pid+')'):'')+
               (options.log.time?('@'+Io.time()):
               (options.log.Time?('@'+Io.Time()):''))+
               '] '+msg)

}

// AIOS smart logging function for AIOS internals (w/o agent messages)
var logAIOS = function(){
    var msg='';
    arguments.forEach(function (arg,i) {
      if (typeof arg == 'string' || typeof arg == Number) msg += (i>0?', '+arg:arg);
      else msg += (i>0?' '+Io.inspect(arg):Io.inspect(arg));
    });
    if (current.process)
    Aios.print('['+(options.log.host?(process.pid+'.'):'')+
              (options.log.world&&current.world?(current.world.id+'.'):'')+
              (options.log.node&&current.node?(current.node.id+'.'):'')+
              (options.log.pid&&current.process?('('+current.process.pid+')'):'')+
              (options.log.time?('@'+Io.time()):
              (options.log.Time?('@'+Io.Time()):''))+
              '] '+msg)
    else
    (Aios.printAgent||Aios.print)('['
               (options.log.time?('@'+Io.time()):
               (options.log.Time?('@'+Io.Time()):''))+
               '] '+msg)
}

// Generic AIOS messages
var log = function () {
    var msg='',pref='';
    arguments.forEach(function (arg,i) {
      if (typeof arg == 'string' || typeof arg == Number) msg += (i>0?', '+arg:arg);
      else msg += (i>0?', '+Io.inspect(arg):Io.inspect(arg));
    });
    if (options.log.time) pref=Io.time()+' ';
    else if (options.log.Time) pref=Io.Time()+' ';
    if (msg[0]=='[')
      Aios.print(pref+msg);
    else 
      Aios.print('[AIOS'+pref+'] '+msg);
}

var eval0=eval;

/** Sandbox module environment for agents (level 0): Untrusted, 
 * minimal set of operations (no move, fork, kill(others),..)
 */
var aios0 = {
  abs:Math.abs,
  add: function (a,b) {
    var res,i;
    if (Comp.obj.isNumber(a) && Comp.obj.isNumber(b)) return a+b;
    if (Comp.obj.isArray(a) && Comp.obj.isArray(b)) {
      if (a.length!=b.length) return none;
      res=Comp.array.copy(a);
      for (i in a) {
        res[i]=aios0.add(a[i],b[i]);
      }
      return res;  
    }
    if (Comp.obj.isArray(a) && Comp.obj.isFunction(b)) {
      res=Comp.array.copy(a);
      for (i in a) {
        res[i]=aios0.add(a[i],b.call(current.process.agent,a[i]));
      }
      return res;  
    }
    if (Comp.obj.isObj(a) && Comp.obj.isObj(b)) {
      res={};
      for (i in a) {
        res[i]=aios0.add(a[i],b[i]);
      }
      return res;     
    }
    return none;
  },
  Capability: Sec.Capability,
  clock: clock,
  concat: function (a,b) {
    var res,i;
    if (Comp.obj.isArray(a) && Comp.obj.isArray(b)) 
      return a.concat(b);
    else if (Comp.obj.isObj(a) && Comp.obj.isObj(b)) {
      res={};
      for (i in a) {
        res[i]=a[i];
      }
      for (i in b) {
        res[i]=b[i];
      }
      return res;     
    } else if (Comp.obj.isString(a) && Comp.obj.isString(b)) {
      return a+b;
    } else
      return undefined;
  },
  contains : function (o,e) {
    // e can be a scalar or array of values
    if (Comp.obj.isArray(o)) 
      return Comp.array.contains(o,e);
    else if (Comp.obj.isObj(o) && (Comp.obj.isString(e) || Comp.obj.isNumber(e))) 
      return o[e] != undefined;
    else if (Comp.obj.isString(o) && Comp.obj.isString(e)) 
      return o.indexOf(e)!=-1
  },
  copy : function (o)  {
    // recursively copy objects
    var _o,p;
    if (Comp.obj.isArray(o)) {
      if (typeof o[0] != 'object') return o.slice();
      else return o.map(function (e) {
            if (typeof e == 'object') return aios0.copy(e);
              else return e;
            });
      
    } else if (Comp.obj.isObject(o)) {
      _o={};
      for(p in o) _o[p]=(typeof o[p]=='object'?aios0.copy(o[p]):o[p]);
      return _o;
    } 
    else if (Comp.obj.isString(o)) 
      return o.slice();
    else return o;
  },
  delta : function (o1,o2) {
    var res;
    if (Comp.obj.isArray(o1) && Comp.obj.isArray(o2)) {
      if (o1.length != o2.length) return;
      res=[];
      for (var i in o1) res[i]=o1[i]-o2[i]; 
    } else if (Comp.obj.isObject(o1) && Comp.obj.isObject(o2)) {
      res={};
      for (var p in o1) res[p]=o1[p]-o2[p];     
    }
    return res; 
  },
  distance: function (p1,p2) {
    var y=0;
    if (p2) for(var p in p1) y+=Math.pow(p1[p]-p2[p],2);
    else for(var p in p1) y+=Math.pow(p1[p],2);
    return Math.sqrt(y)
  },
  div: div,
  dump: function (x) { 
    if (x=='res') x=Comp.obj.copy(current.process.resources); 
    if (x=='?') x=this; 
    logAgent(util.inspect(x)); },
  empty: function (o) {
    if (Comp.obj.isArray(o) || Comp.obj.isString(o)) return o.length==0;
    else if (Comp.obj.isObj(o)) return Comp.obj.isEmpty(o);
    else return false;
  },
  equal: function (a,b) {
    var i;
    if (Comp.obj.isNumber(a) && Comp.obj.isNumber(b)) return a==b;
    else if (Comp.obj.isArray(a) && Comp.obj.isArray(b)) {
      if (a.length!=b.length) return false;
      for (i in a) {
        if (!aios0.equal(a[i],b[i])) return false;
      }
      return true;     
    }
    else if (Comp.obj.isObj(a) && Comp.obj.isObj(b)) {
      for (i in a) {
        if (!aios0.equal(a[i],b[i])) return false;
      }
      return true;     
    }
    else if (Comp.obj.isString(a) && Comp.obj.isString(b))
      return (a.length==b.length && a==b)
    return false;
  },
  filter:function (a,f) {
    var element,res=[],len,len2,i,j,found;
    if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
        res=[];
        len=a.length;
        for(i=0;i<len;i++) {
            element=a[i];
            if (f.call(current.process.agent,element,i)) res.push(element);
        }
        return res;
    } else if (Comp.obj.isArray(a) && Comp.obj.isArray(f)) {
        res=[];
        len=a.length;
        len2=f.length;
        for(i=0;i<len;i++) {
            element=a[i];
            found=false;
            for (j=0;j<len2;j++) if(element==f[j]){found=true; break;}
            if (!found) res.push(element);
        }
        return res;      
    } else return undefined;   
  },
  flatten : function (a,level) {
    if (Comp.obj.isMatrix(a)) { // [][] -> []
      return a.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) && level>1? aios0.flatten(toFlatten,level-1) : toFlatten);
      }, []);
    } else if (Comp.obj.isObj(a)) { // {{}} {[]} -> {}
      function flo (o) {
        var o2={},o3;
        for(var p in o) {
          if (typeof o[p]=='object') {
            o3=flo(o[p]);
            for(var p2 in o3) {
              o2[p+p2]=o3[p2];
            }
          } else o2[p]=o[p];
        }
        return o2;
      }
      return flo(a);
    }
    return a;
  },
  head:function (a) {
    if (Comp.obj.isArray(a))
      return Comp.array.head(a);
    else return undefined;
  },
  id:aidgen,
  info:function (kind) {
    switch (kind) {
      case 'node':  
        return { 
          id:current.node.id, 
          position: current.node.position, 
          location:current.node.location,
          type:current.node.type, 
        };
      case 'version': 
        return options.version;
      case 'host': 
        return { 
          type:global.TARGET 
        };      
    }
  },
  int: int,
  isin: function (o,v) {
    var p;
    if (Comp.obj.isArray(o)) {
      for(p in o) if (aios0.equal(o[p],v)) return true;
      return false;
    } else if (Comp.obj.isObj(o)) {
      for(p in o) if (aios0.equal(o[p],v)) return true;
      return false;    
    } else if (Comp.obj.isString(o)) {
      return o.indexOf(v)!=-1
    }
  },
  iter:function (obj,fun) {
    var p;
    if (Comp.obj.isArray(obj))
      for(p in obj) fun.call(current.process.agent,obj[p],Number(p));
    else
      for(p in obj) fun.call(current.process.agent,obj[p],p)
  },
  kill:function () {kill(current.process.agent.id)},
  length: function (o) {
    if (o==undefined) return 0;
    else if (Comp.obj.isObj(o)) {
      var p,l=0;
      for(p in o) if (o[p]!=undefined) l++;
      return l; 
    } else return o.length
  },
  log:function () { logAgent.apply(_,arguments) },
  map:function (a,f) {
    var res,i,p;
    if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
      res=[];
      for (i in a) {
        v=f.call(current.process.agent,a[i],i);
        if (v!=undefined) res.push(v);
      }
      return res;
    } else if (Comp.obj.isObject(a) && Comp.obj.isFunction(f)) {
      // Objects can be filtered (on first level), too!
      res={};
      for(p in a) {
        v=f.call(current.process.agent,a[p],p);
        if (v != undefined) res[p]=v;
      }
      return res;
    } else return undefined;   
  },
  matrix: function (x,y,init) {
    var row=[];
    var mat=[];
    for (var j=0;j<y;j++) {
      row=[];
      for(var i=0;i<x;i++) 
        row.push(init||0)
      mat.push(row)
    }
    return mat;
  },
  max: function (a,b) {
    if (Comp.obj.isArray(a)) {
      var f=function (x) {return x},v,vi;
      if (Comp.obj.isFunction(b)) f=b;
      Comp.array.iter(a,function (a0,i) {
        a0=f(a0);
        if (v==undefined || a0>v) {v=a0; vi=i};
      });
      if (vi!=undefined) return a[vi];
    } else return Math.max(a,b);
  },
  me: function () {
    return current.process.agent.id;
  },
  min: function (a,b) {
    if (Comp.obj.isArray(a)) {
      var f=function (x) {return x},v,vi;
      if (Comp.obj.isFunction(b)) f=b;
      Comp.array.iter(a,function (a0,i) {
        a0=f(a0);
        if (v==undefined || a0<v) {v=a0; vi=i};
      });
      if (vi!=undefined) return a[vi];
    } else return Math.min(a,b);
  },
  myClass: function () {
    return current.process.agent.ac;
  },
  myNode: function () {
    return current.node.id;
  },
  myParent: function () {
    return current.process.agent.parent;
  },
  myPosition: function () {
    return current.node.location||current.node.position;
  },
  neg: function (v) {
    var p;
    if (Comp.obj.isNumber(v)) return -v;
    if (Comp.obj.isArray(v)) return v.map(function (e) {return aios0.neg(e)});
    if (Comp.obj.isObj(v)) {
      var o=v,_o={};
      for(p in o) _o[p]=typeof o[p]=='number'?-o[p]:o[p];
      return _o;
    }
  },
  negotiate:function (res,val,cap) { return negotiate(0,res,val,cap) },
  next:function () {},
  object : function (str) {
    var myobj={data:null};
    with ({myobj:myobj, str:str}) { myobj.data=eval0('var _o='+str+';_o') };
    return myobj.data;
  },
  privilege: function () {return 0},
  Port: Sec.Port,
  Private: Sec.Private,
  random: function (a,b,frac) {
    var r,n,p,i,keys,k;
    if (Comp.obj.isArray(a)) {
      n = a.length;
      if (n>0)
        return a[Comp.random.int(n)];  
      else
        return none;
    } else if (Comp.obj.isObj(a)) {
      keys=Object.keys(a);
      n = keys.length;
      if (n>0)
        return a[keys[Comp.random.int(n)]];  
      else
        return none;
    } else if (b==undefined) {b=a;a=0}; 
    if (!frac ||frac==1)
      return Comp.random.interval(a,b);
    else {
      r=Comp.random.range(a,b);
      return ((r/frac)|0)*frac;
    }
  },
  reduce : function (a,f) {
    if (Comp.obj.isArray(a)) {
      return a.reduce(function (a,b) {
        return current.process?f.call(current.process.agent,a,b):f(a,b);
      });
    }
  },
  reverse: function (a) {
    if (Comp.obj.isArray(a)) 
      return a.slice().reverse(); 
    else if (Comp.obj.isString(a)) 
      return a.split("").reverse().join("")
  }, 
  sleep:Sig.agent.sleep,
  sort: function (a,f) {
    if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
      return Comp.array.sort(a,function (x,y) {
        return f.call(current.process.agent,x,y);
      });
    } else return undefined;       
  },
  sum: function (o,f) {
    if (Comp.obj.isArray(o)) return Comp.array.sum(o,f);
    else if (Comp.obj.isObject(o)) {
      var s=0,p;
      if (!f) f=function(x){return x};
      for(p in o) s+=f(o[p]);
      return s;
    }
  },
  string:function (o) {if (Comp.obj.isString(o)) return o; else return o.toString()},
  tail:function (a) {
    if (Comp.obj.isArray(a))
      return Comp.array.tail(a);
    else return undefined;
  },
  time:function () { return time()-current.world.lag},
  zero: function (a) {
    var i;
    if (Comp.obj.isNumber(a)) return a==0;
    if (Comp.obj.isArray(a)) {
      for (i in a) {
        if (!aios0.zero(a[i])) return false;
      }
      return true;     
    }
    if (Comp.obj.isObj(a)) {
      for (i in a) {
        if (!aios0.zero(a[i])) return false;
      }
      return true;     
    }
    return false;    
  },

  Vector: function (x,y,z) {var o={}; if (x!=_) o['x']=x; if (y!=_) o['y']=y; if (z!=_) o['z']=z; return o},

  // Scheduling and checkpointing
  B:B,
  CP:CP,
  I:I,
  L:L,
  RT:RT,
  
  Math:Math
}

// Sandbox module environment for agents (level 1): Trusted, standard operational set
var aios1 = {
  abs:aios0.abs,
  add:aios0.add,
  act:Conf.agent.act,
  alt:Ts.agent.alt,
  broadcast:Sig.agent.broadcast,
  Capability: Sec.Capability,
  clock: clock,
  collect:Ts.agent.collect,
  concat:aios0.concat,
  contains:aios0.contains,
  copy:aios0.copy,
  copyto:Ts.agent.copyto,
  // type create = function(ac:string,args:object|[]) -> agentid:string
  create: function(ac,args,level) {
    if (level==undefined || level>1) level=1;
    var process=none;
    if (!Comp.obj.isArray(args) && !Comp.obj.isObject(args)) {
      current.error='Invalid argument: Agent argument is neither array nor object'; 
      throw 'CREATE';
    };
    current.process.resources.agents++;
    if (current.world.classes[ac] && current.world.classes[ac][level])
      process = Code.createOn(current.node,current.world.classes[ac][level],args,level,ac);
    else if (current.process.agent.subclass && current.process.agent.subclass[ac]) {
      process = Code.createOn(current.node,current.process.agent.subclass[ac],args,level,ac);    
    } else {
      current.error='Invalid argument: Unknown agent class '+ac; 
      throw 'CREATE';
    }
    if (process) {
      if (current.process!=none && process.gid==none) {
        process.gid=current.process.pid;
        if (!process.agent.parent) 
          process.agent.parent=current.process.agent.id;
      }
      return process.agent.id; 
    } else return none;    
  },
  delta:aios0.delta,
  distance: aios0.distance,
  div: aios0.div,
  dump: aios0.dump,
  empty:aios0.empty,
  evaluate:Ts.agent.evaluate,
  equal:aios0.equal,
  exists:Ts.agent.exists,
  Export:function (name,code) { current.node.export(name,code) },
  filter:aios0.filter,
  flatten:aios0.flatten,
  fork:function (parameter) {var process = current.process.fork(parameter,undefined,options.fastcopy); return process.agent.id},
  head:aios0.head,
  id:aidgen,
  Import:function (name) { return current.node.import(name) },
  info:aios0.info,
  inp:Ts.agent.inp,
  int: aios0.int,
  isin: aios0.isin,
  iter:aios0.iter,
  kill:function (aid) {if (aid==undefined) kill(current.process.agent.id); else kill(aid)},
  length: aios0.length,
  link:function (dir) {return current.world.connected(dir,current.node)},
  listen:Ts.agent.listen,
  log:aios0.log,
  me:aios0.me,
  mark:Ts.agent.mark,
  map:aios0.map,
  max:aios0.max,
  matrix:aios0.matrix,
  moveto:Mobi.agent.move,
  min:aios0.min,
  myClass:aios0.myClass,
  myNode:aios0.myNode,
  myParent:aios0.myParent,
  myPosition:aios0.myPosition,
  neg:aios0.neg,
  negotiate:function (res,val,cap) { return negotiate(1,res,val,cap) },
  object:aios0.object,
  opposite:Mobi.agent.opposite,
  out:Ts.agent.out,
  Port: Sec.Port,
  position: function () {return current.node.position},
  Private: Sec.Private,
  privilege: function () {return 1},
  random: aios0.random,
  rd:Ts.agent.rd,
  reduce:aios0.reduce,
  reverse:aios0.reverse,
  rm:Ts.agent.rm,
  security: Sec,
  send:Sig.agent.send,
  sendto:Sig.agent.sendto,
  sleep:Sig.agent.sleep,
  sort:aios0.sort,
  store:Ts.agent.store,
  string:aios0.string,
  sum:aios0.sum,
  tail:aios0.tail,
  test:Ts.agent.exists,
  time:aios0.time,
  timer:Sig.agent.timer,
  trans:Conf.agent.trans,
  try_alt:Ts.agent.try.alt,
  try_inp:Ts.agent.try.inp,
  try_rd:Ts.agent.try.rd,
  wakeup:Sig.agent.wakeup,
  zero:aios0.zero,
  
  B:B,
  CP:CP,
  I:I,
  L:L,
  RT:RT,
  
  Vector:aios0.Vector,
  DIR:Mobi.agent.DIR,
  Math:Math
};

// Sandbox module environment for agents (level 2): Trusted with extended privileges
var aios2 = {
  abs:aios0.abs,
  add:aios0.add,
  act:Conf.agent.act,
  alt:Ts.agent.alt,
  broadcast:Sig.agent.broadcast,
  Capability: Sec.Capability,
  clock: clock,
  collect:Ts.agent.collect,
  concat:aios0.concat,
  contains:aios0.contains,
  copy:aios0.copy,
  copyto:Ts.agent.copyto,
  create: function(ac,args,level) {
    var process=none;
    if (level==undefined || level>2) level=2;
    if (!Comp.obj.isArray(args) && !Comp.obj.isObject(args)) {
      current.error='Invalid argument: Agent arguments is neither array nor object'; 
      throw 'CREATE';
    };
    current.process.resources.agents++;
    if (current.world.classes[ac] && current.world.classes[ac][level])
      process = Code.createOn(current.node,current.world.classes[ac][level],args,level,ac);
    else if (current.process.agent.subclass && current.process.agent.subclass[ac]) {
      process = Code.createOn(current.node,current.process.agent.subclass[ac],args,level,ac);    
    } else {
      current.error='Invalid argument: Unknown agent class '+ac; 
      throw 'CREATE';
    }
    if (process) {
      process.agent.ac=ac;
      if (current.process!=none && process.gid==none) {
        process.gid=current.process.pid;
        if (process.agent.parent==_ || process.agent.parent==none) 
          process.agent.parent=current.process.agent.id;
      }
      return process.agent.id; 
    } else return none;    
  },
  delta:aios0.delta,
  distance: aios0.distance,
  div: aios0.div,
  dump: aios0.dump,
  empty:aios0.empty,
  evaluate:Ts.agent.evaluate,
  equal:aios0.equal,
  exists:Ts.agent.exists,
  Export:function (name,code) { current.node.export(name,code) },
  filter:aios0.filter,
  flatten:aios0.flatten,
  fork:function (parameter) {var process = current.process.fork(parameter); return process.agent.id},
  head:aios0.head,
  id:aidgen,
  Import:function (name) { return current.node.import(name) },
  info:aios0.info,
  inp:Ts.agent.inp,
  int: aios0.int,
  isin: aios0.isin,
  iter:aios0.iter,
  kill:function (aid) {if (aid==undefined) kill(current.process.agent.id); else kill(aid)},
  length: aios0.length,
  link:function (dir) {return current.world.connected(dir,current.node)},
  listen:Ts.agent.listen,
  log:aios0.log,
  max:aios0.max,
  me:aios0.me,
  min:aios0.min,
  myClass:aios0.myClass,
  myNode:aios0.myNode,
  myParent:aios0.myParent,
  myPosition:aios0.myPosition,
  mark:Ts.agent.mark,
  map:aios0.map,
  matrix:aios0.matrix,
  moveto:Mobi.agent.move,
  neg:aios0.neg,
  negotiate:function (res,val,cap) { return negotiate(2,res,val,cap) },
  object:aios0.object,
  opposite:Mobi.agent.opposite,
  out:Ts.agent.out,
  random: aios0.random,
  reduce:aios0.reduce,
  rd:Ts.agent.rd,
  reverse:aios0.reverse,
  rm:Ts.agent.rm,
  Port: Sec.Port,
  position: function () {return current.node.position},
  Private: Sec.Private,
  privilege: function () {return 2},
  security: Sec,
  send:Sig.agent.send,
  sendto:Sig.agent.sendto,
  sleep:Sig.agent.sleep,
  sort:aios0.sort,
  store:Ts.agent.store,
  string:aios0.string,
  sum:aios0.sum,
  tail:aios0.tail,
  test:Ts.agent.exists,
  time:aios0.time,
  timer:Sig.agent.timer,
  trans:Conf.agent.trans,
  try_alt:Ts.agent.try.alt,
  try_inp:Ts.agent.try.inp,
  try_rd:Ts.agent.try.rd,
  wakeup:Sig.agent.wakeup,
  zero:aios0.zero,
  
  B:B,
  CP:CP,
  I:I,
  L:L,
  RT:RT,
  
  Vector:aios0.Vector,
  DIR:Mobi.agent.DIR,
  
  Math:Math,
};

// Sandbox module environment for agents (level 3): Trusted with extended privileges, system level
// May not migrate!!
var aios3 = {
  abs:aios0.abs,
  add:aios0.add,
  act:Conf.agent.act,
  alt:Ts.agent.alt,
  broadcast:Sig.agent.broadcast,
  Capability: Sec.Capability,
  clock: clock,
  collect:Ts.agent.collect,
  connectTo:function (dir,options) {
    // Connect this node with another node using a virtual or physical channel link
    var node=current.node, world=current.world;
    if (!dir || !dir.tag) throw('CONNECT');
    world.connectTo(dir,node,options);
  },
  concat:aios0.concat,
  contains:aios0.contains,
  copy:aios0.copy,
  copyto:Ts.agent.copyto,
  create: function(ac,args,level) {
    var process=none;
    if (level==undefined) level=3;
    if (!Comp.obj.isArray(args) && !Comp.obj.isObject(args)) {
      current.error='Invalid argument: Agent arguments is neither array nor object'; 
      throw 'CREATE';
    };
    current.process.resources.agents++;
    if (current.world.classes[ac] && current.world.classes[ac][level])
      process = Code.createOn(current.node,current.world.classes[ac][level],args,level,ac);
    else if (current.process.agent.subclass && current.process.agent.subclass[ac]) {
      process = Code.createOn(current.node,current.process.agent.subclass[ac],args,level,ac);    
    } else {
      current.error='Invalid argument: Unknown agent class '+ac; 
      throw 'CREATE';
    }
    if (process) {
      process.agent.ac=ac;
      if (current.process!=none && process.gid==none) {
        process.gid=current.process.pid;
        if (process.agent.parent==_ || process.agent.parent==none) 
          process.agent.parent=current.process.agent.id;
      }
      return process.agent.id; 
    } else return none;    
  },
  delta:aios0.delta,
  distance: aios0.distance,
  div: aios0.div,
  dump: aios0.dump,
  empty:aios0.empty,
  equal:aios0.equal,
  evaluate:Ts.agent.evaluate,
  exists:Ts.agent.exists,
  Export:aios2.Export,
  filter:aios0.filter,
  flatten:aios0.flatten,
  fork:aios2.fork,
  head:aios0.head,
  id:aidgen,
  Import:aios2.Import,
  info:aios0.info,
  inp:Ts.agent.inp,
  int: aios0.int,
  isin: aios0.isin,
  iter:aios0.iter,
  kill:aios2.kill,
  length:aios0.length,
  link:aios2.link,
  listen:Ts.agent.listen,
  log:aios0.log,
  max:aios0.max,
  me:aios0.me,
  min:aios0.min,
  myClass:aios0.myClass,
  myNode:aios0.myNode,
  myParent:aios0.myParent,
  myPosition:aios0.myPosition,
  mark:Ts.agent.mark,
  map:aios0.map,
  matrix:aios0.matrix,
  moveto:function () {/* System level agents may not migrate ! */ current.error='ENOTSUPPORTED';throw 'MOVE';},
  neg:aios0.neg,
  negotiate:function (res,val,cap) { return negotiate(3,res,val,cap) },
  object:aios0.object,
  opposite:Mobi.agent.opposite,
  out:Ts.agent.out,
  Port: Sec.Port,
  position: function () {return current.node.position},
  Private: Sec.Private,
  privilege: function () {return 3},
  reduce:aios0.reduce,
  random: aios0.random,
  rd:Ts.agent.rd,
  reverse:aios0.reverse,
  rm:Ts.agent.rm,
  send:Sig.agent.send,
  sendto:Sig.agent.sendto,
  sleep:aios0.sleep,
  sort:aios0.sort,
  store:Ts.agent.store,
  string:aios0.string,
  sum:aios0.sum,
  tail:aios0.tail,
  test:Ts.agent.exists,
  time:aios0.time,
  timer:Sig.agent.timer,
  trans:Conf.agent.trans,
  try_alt:Ts.agent.try.alt,
  try_inp:Ts.agent.try.inp,
  try_rd:Ts.agent.try.rd,
  wakeup:Sig.agent.wakeup,
  zero:aios0.zero,
  
  B:B,
  CP:CP,
  I:I,
  L:L,
  RT:RT,
  
  Vector:aios0.Vector,
  DIR:Mobi.agent.DIR,
  
  Math:Math,
  
  // Exucute an IO block sequence in an agent process context
  IOB: function (block) {
    var proc=current.process;
    setImmediate(function () {
      var index=0;
      function next (to) {
        var _proc=current.process,_node=current.node;        
        if (to==none) {
          // done or failiure
          proc.mask.next=undefined;
          proc.wakeup();
          return;
        }
        index=index+to;        
        try {
          current.process=proc; current.node=proc.node;
          block[index].call(proc.agent);
        } catch (e) {
          logAgent('Caught IOB error: '+e);
        }
        current.process=_proc; current.node=_node;
      }
      proc.mask.next=next;      
      next(0);
    });
    proc.suspend();
  }
};

var aios = aios1;

/*
** Agent code scheduling blocks can migrate 
** - must be handled different from internal scheduling blocks!
*/
// Schedule linear sequence of functions that may block (suspending execution of current agent process).
function B(block) {
  if (current.process.schedule.length==0) 
    current.process.schedule = block;
  else 
    current.process.schedule = Comp.array.concat(block,current.process.schedule);
}

/** Add pending callback call to process scheduling block
 *
 */
function CB(process,cb,args) {
  if (args)
    Comp.array.push(process.schedule,function () { cb.apply(this,args) });  
  else
    Comp.array.push(process.schedule,cb);
}

/** Agent process activity check pointing (injected in loops/functions)
 *
 */
function CP() {
  if (current.process.runtime && (current.process.runtime+current.world.lag-Date.now())<0) throw "SCHEDULE";
  return true;
}

/** Agent exception checker; agents may not consume scheduler/watchdog exceptions!!
*/

function RT(e) {
  if (['WATCHDOG','SCHEDULE'].indexOf(e.toString())!=-1) throw(e);
}

/** Schedule an object iteration sequence that may block (suspending execution of current agent process).
 *
 */
function I(obj,next,block,finalize) {
  /*
  ** Iterate and schedule a block
   * obj: []
   * next: function(next) {}
  */
  var index=0;
  var length=obj.length;
   
  var iterator = [
      function() {
        next(obj[index]);
        if (index<length) {
          B(block.slice());
          index++;
        }           
      },
      function () {
        if (index<length) B(iterator.slice());
        else if (finalize) finalize.call(this);
      }
   ];
  B(iterator.slice());
}

// Schedule a loop iteration sequence that may block (suspending execution of current agent process).
function L(init,cond,next,block,finalize) {
   /*
   ** Iterate and schedule a block
    * init: function() {}
    * cond: function() { return cond; }
    * next: function() {}
   */
   var loop = [
       function() {
          if (cond.call(this)) B(block.slice());
       },
       next,
       function () {
          if (cond.call(this)) B(loop.slice());           
       }
   ];
  B(loop.slice());
  B([init]);
}


/** Agent Identifier Generator
 *
 */ 
function aidgen() {
  return Name.generate(options.nameopts);
}

/** AIOS configuration 
 *
 */
function config(settings) {
  for (var p in settings) {
    switch (p) {
      case 'iterations': iterations=settings[p]; break;
      case 'fastcopy':  options.fastcopy=settings[p]; break;
      case 'verbose':   options.verbose=settings[p]; break;
      case 'log+':      options.log[settings[p]]=true; break;
      case 'log-':      options.log[settings[p]]=false; break;
      case 'log':
        // log options object override
        for(var l in settings[p]) options.log[l]=settings[p][l];
        break;
      case 'nolimits': 
        if (settings[p]) 
          Aios.watchdog=undefined,
          options.nolimits=true,
          Aios.Code.inject.cp=undefined,
          Aios.Code.inject.rt=undefined; 
        break;
      case 'nowatch': 
        if (settings[p]) 
          Aios.watchdog=undefined,
          Aios.Code.inject.cp=undefined,
          Aios.Code.inject.rt=undefined; 
        break;
      case 'checkpoint': 
        if (settings[p]) 
          Aios.watchdog=undefined,
          Aios.Code.inject.cp='CP',
          Aios.Code.inject.rt='RT';
        break;
      case 'security':
        // Capability port-random pairs
        for (var q in settings[p]) {
          var port=Sec.Port.ofString(q),
              random=Sec.Port.ofString(settings[p][q]);
          options.security[port]=random;
        }
        break;
      case 'print':       Aios.print=settings[p]; break;
      case 'printAgent':  Aios.printAgent=settings[p]; break;
      case 'LIFETIME':    options.LIFETIME=settings[p]; break;
      case 'TIMESCHED':   options.TIMESCHED=settings[p]; break;
      case 'TIMEPOOL':    options.TIMEPOOL=settings[p]; break;
      case 'MEMPOOL':     options.MEMPOOL=settings[p]; break;
      case 'MINCOST':     options.MINCOST=settings[p]; break;
      case 'RUNTIME' :    options.RUNTIME=settings[p]; break;
      case 'IDLETIME' :   options.IDLETIME=settings[p]; break;
      case 'TSTMO':       Aios.Ts.options.timeout=settings[p]; break;
      case 'time': 
        time=settings[p]; 
        // Update alle time and CP references
        Aios.time=aios0.time=aios1.time=aios2.time=aios3.time=time;
        Aios.CP=aios0.CP=aios1.CP=aios2.CP=aios3.CP=function () {
          if (current.process.runtime && (current.process.runtime+current.world.lag-time())<0) throw "SCHEDULE";
          return true;
        };
        break;
    }
  }
}

function dump(e) {
        var e = e ||(new Error('dummy'));
        var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n');
        log(e);
        log('Stack Trace');
        log('--------------------------------');
        for(var i in stack) {
            if (i>0) {
                var line = stack[i];
                if(line.indexOf('Module.',0)>=0) break;
                log(line);
            }
        }
        log('--------------------------------');
};
/** Emit event
 *  function emit(@event,@arg1,..)
 */
function emit() {
  if (events[arguments[0]]) 
    events[arguments[0]](arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]);
}
/** Try to get the source position of an error raised in an agent activity
 *
 */
function errorLocation(process,err) {
  try {
    var stack = err.stack.split('\n');
    for (var i in stack) {
      var line=stack[i];
      if (line.indexOf('at act.')>=0||line.indexOf('at F.act.')>=0) {        
        return line.replace(/\([^\)]+\)/,'').replace(/\)/,'');
      }
      else if (line.indexOf('at trans.')>=0 || line.indexOf('at F.trans.')>=0) {        
        return line.replace(/\([^\)]+\)/,'').replace(/\)/,'');
      }
    }
    return '';
  } catch (e) {
    return '';
  } 
}

// Execute a block scheduling function
function exec_block_fun(next) {
    var fun = next[0]||next,
        argn = next.length-1;
    switch (argn) {
        case 0:
        case -1:
            fun(); break;
        case 1: fun(next[1]); break;
        case 2: fun(next[1],next[2]); break;
        case 3: fun(next[1],next[2],next[3]); break;
        case 4: fun(next[1],next[2],next[3],next[4]); break;
        case 5: fun(next[1],next[2],next[3],next[4],next[5]); break;
        case 6: fun(next[1],next[2],next[3],next[4],next[5],next[6]); break;
        case 7: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7]); break;
        case 8: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7],next[8]); break;
        case 9: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7],next[8],next[9]); break;
        default:
            // TODO: fun.apply(undefined,next.slice(1))
            Io.err('Aios.exec_block_fun: more than 9 function arguments');
    }
}


/** Fork the current agent with an optional new set of parameters.
 *
 */
function fork(parameters) {
  return current.process.fork(parameters);
}

/** Kill an agent (if agent identifier is undefined the current agent will be killed).
 *
 */
function kill(agent) {
  var process;
  if (!agent) {
    process=current.process;
  } else {
    process=current.node.processes.process(agent);
  }
  if (process) {
    process.kill=true;
    current.node.unregister(process);
    return true;
  } else return false;
}

function killOn(agent,node) {
  var process;
  process=node.processes.process(agent); 
  if (process) {
    process.kill=true;
    node.unregister(process);
  };
}

/** Lock the global namespace. Disable inter-agent communication
 *  by using the global namespace => Sandbox (level 2)
 *
 */
function lock() {
  Object.preventExtensions(global);
}

/** Execute agent processes until there are no more schedulable agents.
 *  Loop returns if there are no more runnable agents. If there are waiting
 *  agent processes, the loop will be rescheduled on the earliest time event.
 *
 */
 
function loop(services) {
  var nexttime = scheduler(services);
  if (nexttime>0) {
    // Nothing to do.
    // Sleep until next event and re-enter the scheduling loop.
    if (options.verbose>3) log('[LOOP '+current.node.id+'] next schedule on '+ nexttime);
    timer=setTimeout(function () {loop (services)},nexttime-time());
  }
}

function min0(a,b) { return a==0?b:(b==0?a:Comp.pervasives.min(a,b)) };

/** Call agent exception handler. If exception was handled by agent return true, otherwise false.
 *
 */
function handleException(process,exc,arg1,arg2,arg3,arg4) {
  var agent=process.agent;
  if (Aios.watchdog && Aios.watchdog.protect) {
    try { Aios.watchdog.protect(function () {agent.on[exc].call(agent,arg1,arg2,arg3,arg4)})} catch(e) {
      // If there is no handler managing the error (e.g. SCHEDULE), the agent must be terminated!
      if (options.verbose) logAIOS ('Agent '+agent.id+' ['+agent.ac+'] failed handling '+exc+'('+arg1+')');
      process.kill=true
      return false;
    };
  } else
    try {agent.on[exc].call(agent,arg1,arg2,arg3,arg4)} catch(e) {
      // If there is no handler managing the error (e.g. SCHEDULE), the agent must be terminated!
      if (options.verbose) logAIOS ('Agent '+agent.id+' ['+agent.ac+'] failed handling '+exc+'('+arg1+')');
      process.kill=true
      return false;
    }
  return true;
}

/** Agent resource constraint negotiation
 *
 */
function negotiate (level,resource,value,cap) {
  var obj,security=options.security;
  // Check capability rights
  function checkRights(r) {
    return (level > 1 || 
           (cap && security[cap.cap_port] && Sec.Private.rights_check(cap.cap_priv,security[cap.cap_port],r))) 
  
  }
  switch (resource) {
    case 'LIFE':
      if (!checkRights(Sec.Rights.NEG_LIFE)) return false;
      current.process.resources.LIFE=value; break;
    case 'CPU':
      if (!checkRights(Sec.Rights.NEG_CPU)) return false;
      if (value>options.TIMEPOOL) current.process.resources.CPU=value; break;
    case 'SCHED': 
    case 'SCHEDULE': 
      if (!checkRights(Sec.Rights.NEG_SCHED)) return false;
      if (value>options.TIMESCHED) current.process.resources.SCHED=value; break;
    case 'MEM': 
    case 'MEMORY': 
      if (!checkRights(Sec.Rights.NEG_RES)) return false;
      if (value>options.MEMPOOL) current.process.resources.MEM=value; break;
    case 'TS': 
      if (!checkRights(Sec.Rights.NEG_RES)) return false;
      if (value>options.TSPOOL) current.process.resources.TS=value; break;
    case 'AGENT': 
      if (!checkRights(Sec.Rights.NEG_RES)) return false;
      if (value>options.AGENTPOOL) current.process.resources.AGENT=value; break;
    case 'LEVEL': 
      if (!checkRights(Sec.Rights.NEG_LEVEL)) return false;
      // Extend process mask
      switch (value) {
        case 1:
          break;
        case 2:
          break;
      }
      break;
    case '?':
      obj=Comp.obj.copy(current.process.resources);
      Comp.obj.extend(obj,{
        SCHED:  current.process.resources.SCHED||options.TIMESCHED,
        CPU:    current.process.resources.CPU||options.TIMEPOOL,
        MEM:    current.process.resources.MEM||options.MEMPOOL,
        TS:     current.process.resources.TS||options.TSPOOL,
        AGENT:  current.process.resources.AGENT||options.AGENTPOOL,
      });
      return obj;
      break;
    default: return false;
  }  
  return true;
}



/** Event callback management
 *
 */
function off(event) {
  // TODO: care of function chains??
  events[event]=undefined;
}
function on(event,fun) {
  if (events[event]) {
    // Implement callback function chain
    var funorig=events[event];
    events[event]=function () {
      funorig.apply(this,arguments);
      fun.apply(this,arguments);    
    };
  } else
    events[event]=fun;
}

function out(str) {log(str)};

/** Get current resource allocation of process memory
 *
 */
function resource(r0) {
  var r;
  if (!options.useproc) return 0;
  // Time expensive operation: requires system call and a lot of internal computation
  r=process.memoryUsage();
  // console.log(r)
  if (r0==undefined) 
    return {r:r.rss-r.heapTotal,h:r.heapUsed};
  else return int((Math.max(0,r.rss-r.heapTotal-r0.r)+Math.max(0,r.heapUsed-r0.h))/1024);
}

/** Scheduling function for one agent process.
 *
 *  Scheduling order:
 *    1. Process Blocks (process.block, passed to global DOS scheduler)
 *    2. Signals (process.signals, handled by AIOS scheduler)
 *    3. Transition (process.transition==true, handled by AIOS scheduler)
 *    4. Agent Blocks (process.schedule, handled by AIOS scheduler)
 *    5. Activity (handled by AIOS scheduler)
 *
 */
var SA = {
  NOOP:0,
  BLOCK:1,
  NORES:2,
  SIG:3,
  TRANS:4,
  SCHED:5,
  ACT:6,
  print: function (op) {
    switch (op) {
      case SA.NOOP: return 'NOOP';
      case SA.BLOCK: return 'BLOCK';
      case SA.NORES: return 'NORES';
      case SA.SIG: return 'SIG';
      case SA.TRANS: return 'TRANS';
      case SA.SCHED: return 'SCHED';
      case SA.ACT: return 'ACT';
    }
  }
}

// One scheduler run
function schedule(process) {
  var exec,sig,start,delta,next,
      _current,
      node=current.node,
      agent=process.agent,
      action='',
      op=SA.NOOP,
      handled,
      exception,
      curtime,
      r0;

  ticks++;   // move to scheduler ???
  // console.log(process);
  assert((process.agent!=undefined && process.id=='agent')||('Aios.schedule: not an agent process: '+process.id));

  /* Order of operation selection:
  **
  ** -1: Lifetime check
  ** 0. Process (internal) block scheduling [block]
  ** 1. Resource exception handling
  ** 2. Signal handling [signals]
  **    - Signals only handled if process priority < HIGH 
  **    - Signal handling increase proecss priority to enable act scheduling!
  ** 3. Transition execution
  ** 4. Agent schedule block execution [schedule]
  ** 5. Next activity execution
  */
  curtime = time();
  
  if (!options.nolimits && !process.kill && 
      (process.resources.start+(process.resources.LIFE||options.LIFETIME))<
       (curtime-current.world.lag)) op=SA.NORES; 
  else if (process.blocked ||
      (process.suspended==true && process.block.length==0 && process.signals.length==0) ||
      process.dead==true ||
      (agent.next==none && process.signals.length==0 && process.schedule.length == 0)) op=SA.NOOP;
  // if (process.suspended==true && process.schedule.length==0 && process.signals.length==0) op=SA.NOOP;
  else if (!process.blocked && process.block.length > 0) op=SA.BLOCK;
  else if (!options.nolimits && 
           (process.resources.consumed>(process.resources.CPU||options.TIMEPOOL) || 
            process.resources.memory>(process.resources.MEM||options.MEMPOOL)
           ))  
          op=SA.NORES;
  else if (process.priority<Proc.PRIO.HIGH && process.signals.length>0) op=SA.SIG;
  else if (!process.suspended && process.transition) op=SA.TRANS;
  else if (!process.suspended && process.schedule.length > 0) op=SA.SCHED;
  else if (!process.suspended) op=SA.ACT;

  if (options.verbose>3) print('[SCH] '+time()+' '+process.agent.id+' : '+
                               SA.print(op)+' [susp='+process.suspended+
                               ',trans='+process.transition+',tmo='+process.timeout+']');
  
  if (op==SA.NOOP) return 0;

  start=curtime;
  
  if (Aios.watchdog) Aios.watchdog.start(process.resources.SCHED||options.TIMESCHED);
  else if (!options.nolimits)
    process.runtime=start-current.world.lag+(process.resources.SCHED||options.TIMESCHED); 
  if (!options.nolimits)
    r0=resource(); // Start resource monitor
  
  current.process=process;
  current.error=none;
  if (current.scheduler) _current=current.scheduler.SetCurrent(process);
  try {
    switch (op) {  
      case SA.BLOCK:
        // An internal schedule block [Linear/Loop]
        // Pass to global scheduler
        // console.log(process.block)
        schedule_block(process);  
        break;
      case SA.NORES:
        throw 'EOL';
        break;
      case SA.SIG:
        /* Execute a signal handler 
        ** 1. A signal handler can wakeup a suspended agent process by calling wakeup()
        ** 2. A signal handler can wakeup a suspended agent process by modifying variables and satisfying the current
        **    transition condition resulting in an activity transition!
        */
        if (!process.suspended && !process.transition) process.priority++;   
          // Pending activity execution -> block signal handling temporarily
        action='signal';
        sig=Comp.array.pop(process.signals);
        try {
          // sig=[signal,argument?,from?]
          agent.on[sig[0]].call(agent,sig[1],sig[2]);
          if (process.suspended && process.transition) process.suspended=false; // ==> 2.)
        } catch(e) {
          if (!agent.on[sig[0]]) 
            logAIOS ('Signal handler '+sig[0]+' in agent '+agent.id+' ['+agent.ac+'] not defined, ignoring signal.');
          else 
            logAIOS ('Signal handler '+sig[0]+' in agent '+agent.id+' ['+agent.ac+'] failed: '+e+
                      (current.error?' / '+current.error:'')+', in: \n'+Code.print(agent.on[sig[0]])+
                      +errorLocation(process,e))
          current.error=none;
          process.kill=true; // Always?
        };  
        Aios.emit('signal+',process,node,sig[0],sig[1],sig[2]);
        break;
      case SA.TRANS:
        // Pending next computation: Compute next transition after wakeup or after a signal was handled.
        // If still not successfull, suspend agent process.
        try {
          action='transition';
          if (!agent.trans[agent.next]) throw "NOTDEFINED";
          next=(typeof agent.trans[agent.next] == 'function')?
                agent.trans[agent.next].call(agent):
                agent.trans[agent.next];
          // TODO: check blocking state - transitions may not block!
          if (next) {
            agent.next=next;
            process.suspended=false;
            process.transition=false;
          } else {
            process.suspended=true;      
          }
        } catch (e) {
          if (agent.trans[agent.next]==undefined) 
            logAIOS ('Transition table entry '+agent.next+' not defined in agent '+agent.id+' ['+agent.ac+'].');
          else 
            logAIOS ('Agent '+agent.id+' ['+agent.ac+'] in transition '+agent.next+
                      ' failed:\n'+e+(current.error?' / '+current.error:'')+
                      +errorLocation(process,e));
          process.kill=true;
          current.error=none;      
        }
        break;
      case SA.SCHED:
        // An agent schedule block function [Linear/Loop] executed in agent context
        action='block';
        exec = Comp.array.pop(process.schedule);
        Aios.watchdog&&Aios.watchdog.protect?Aios.watchdog.protect(exec.bind(agent)):exec.call(agent);
        if (!process.kill && !process.suspended && process.schedule.length == 0) {
          if (process.notransition) {
            // prevent transition after this process.schedule was executed.
            process.notransition=false;
          } else {
            // next=agent.trans[agent.next].call(agent);      
            next=(typeof agent.trans[agent.next] == 'function')?agent.trans[agent.next].call(agent):agent.trans[agent.next];
            if (!next) process.suspend(0,true); // no current transition enabled; suspend process
            else agent.next=next;
          } 
        }
        break;
      case SA.ACT:
        // Normal activity execution
        // console.log('[SCH] next:'+agent.next)
        if (process.priority==Proc.PRIO.HIGH) process.priority--;
        action='activity';
        if (agent.next==none) throw 'KILL';
        Aios.watchdog&&Aios.watchdog.protect?
          Aios.watchdog.protect(agent.act[agent.next].bind(agent)):
          agent.act[agent.next].call(agent);
        if (!process.kill && !process.suspended && process.schedule.length == 0) {
          action='transition';
          // next=agent.trans[agent.next].call(agent);
          if (!agent.trans[agent.next]) throw "NOTDEFINED";
          next=(typeof agent.trans[agent.next] == 'function')?
                  agent.trans[agent.next].call(agent):
                  agent.trans[agent.next];
          // TODO: check blocking state - transitions may not block!
          if (!next) process.suspend(0,true); // no current transition enabled; suspend process
          else agent.next=next; 
        } 
        break;
    }   
  } catch (e) {
    if (Aios.watchdog) Aios.watchdog.stop();
    curtime=time()-current.world.lag;
    exception=true;
    switch (e) {
      case 'SCHEDULE':
      case 'WATCHDOG':
        e='SCHEDULE';
        if (Aios.watchdog) Aios.watchdog.start(options.TIMESCHED/10); 
        else process.runtime=curtime+options.TIMESCHED/10;
        handleException(process,'error',e,options.TIMESCHED,agent.next);
        break;
      case 'EOL':
        if (Aios.watchdog) Aios.watchdog.start(options.TIMESCHED/10); else
        process.runtime=curtime+options.TIMESCHED/10;
        // New time or memory contingent must be negotiated based on policy!
        if (process.resources.consumed>(process.resources.CPU||options.TIMEPOOL)) {
          handleException(process,'error','CPU',e,process.resources.consumed,agent.next);
          if (process.resources.consumed>(process.resources.CPU||options.TIMEPOOL)) 
            process.kill=true;
        } else if (process.resources.memory>(process.resources.MEM||options.MEMPOOL)) {
          handleException(process,'error','EOM',process.resources.memory,agent.next);
          if (process.resources.memory>(process.resources.MEM||options.MEMPOOL))
            process.kill=true;
        } else if ((process.resources.start+(process.resources.LIFE||options.LIFETIME))
                   <curtime) {
          handleException(process,'error','EOL',process.resources.memory,agent.next);
          if ((process.resources.start+(process.resources.LIFE||options.LIFETIME))
              <curtime)
            process.kill=true;
        } else {
          // TODO generic resource overflow?
          handleException(process,'error','EOR',0,agent.next);
          process.kill=true;
        }
        break;
      case 'KILL':
        if (Aios.watchdog) Aios.watchdog.start(options.TIMESCHED/10); 
        else process.runtime=curtime+options.TIMESCHED/10;
        handleException(process,'exit');
        process.kill=true;
        break;
      case 'NOTDEFINED':
        if (agent.act[agent.next]==undefined && options.verbose) 
          logAIOS('Activity '+agent.next+' not defined in agent '+
                   agent.id+' ['+agent.ac+'].');
        else if (agent.trans[agent.next]==undefined && options.verbose) 
          logAIOS('Transition table entry '+agent.next+' not defined in agent '+agent.id+' ['+agent.ac+'].');
        process.kill=true;
        current.error=none;
        break;
      default:
        handled=handleException(process,aiosExceptions.indexOf(e.toString())!=-1?e:'error',e,current.error,agent.next);
        if (!handled && options.verbose) 
          logAIOS ('Agent '+agent.id+' ['+agent.ac+'] in '+(action=='block'?'block in':action)+' '+
                  (action=='signal'?sig[0]:agent.next)+
                  ' failed: Error '+e+(current.error?('; '+current.error):'')+
                  (options.verbose>1?(
                    ', in code: \n'+(
                      action=='activity'?Code.print(agent.act[agent.next]):
                        (action=='transition'?Code.print(agent.trans[agent.next]):
                          (agent.on && sig && agent.on[sig[0]])?Code.print(agent.on[sig[0]]):'none')  
                    )+
                    errorLocation(process,e)
                  ):'')
                  );
        if (options.verbose>2 && ['CREATE','MOVE','SIGNAL'].indexOf(e) == -1) Io.printstack(e);             
        if (!handled) process.kill=true;
        else {
          action='transition';
          // next=agent.trans[agent.next].call(agent);
          if (!agent.trans[agent.next]) throw "NOTDEFINED";
          next=(typeof agent.trans[agent.next] == 'function')?
                  agent.trans[agent.next].call(agent):
                  agent.trans[agent.next];
          // TODO: check blocking state - transitions may not block!
          if (!next) process.suspend(0,true); // no current transition enabled; suspend process
          else agent.next=next;
        }
        current.error=none;
    }
  }
  if (Aios.watchdog) Aios.watchdog.stop();
  else process.runtime=0;
  
  if (!options.nostats) {
    delta=(time()-start)||options.MINCOST;
    process.resources.consumed += delta;
    process.resources.memory += resource(r0);
    current.node.stats.cpu += delta;
  }

  if (options.verbose && exception && process.kill) logAIOS('Killed agent '+agent.id);

  if (current.scheduler) current.scheduler.SetCurrent(_current);

  current.process=none;

  if (options.verbose>3) print(time()+' <- '+process.print());
  
  return 1;
}

/**
 * Internal block scheduling
 */
 

function schedule_block(process) {
    var next;
    /*
     ** Process current function block sequence first!
     ** Format: [[fun,arg1,arg2,...],[block2], [block3], ..]
     ** Simplified: [fun,fun,...]
     */
    if (!process.blocked) {
        next = process.block[0];
        process.block.splice(0,1);
        /*
         ** Do no execute handler blocks maybe at the end of a subsection
         ** of the block list.
         */
        while (!Comp.array.empty(process.block) && next.handler!=undefined) {
            next = process.block[0];
            process.block.splice(0,1);
        }
        if (next.handler==undefined) {
            try {exec_block_fun(next)} catch(e) {
                /*
                 ** Iterate through the block list and try to find a handler entry.
                 */
                while (next.handler==undefined && !Comp.array.empty(process.block)) {
                    next = process.block[0];
                    process.block.splice(0,1);
                }
                if (next.handler!=undefined) {
                    /*
                     ** Call handler ...
                     */
                    // console.log(next.handler.toString())
                    try {exec_block_fun([next.handler,e])} 
                    catch (e) {
                      Io.out('Aios.schedule_block [Internal B], in agent context '+
                             process.agent.id+', got exception in exception handler: '+e);
                      // Io.printstack(e);
                      Io.out(Json.stringify(next).replace(/\\n/g,'\n'));
                    };
                } else {
                    logAIOS ('Agent '+process.agent.id+' ['+process.agent.ac+'] in activity '+
                              process.agent.next+
                              ' failed:\n'+e+(current.error?' / '+current.error:', in: \n'+
                              Code.print(process.agent.act[process.agent.next]))+
                              '');// '\nat:\n'+Io.sprintstack(e)));
                    process.kill=true;
                    current.error=none;
                }
            }
        }
    }
}

var scheduled=0;

/** Main scheduler entry.
 *  Returns the next event time, negative number of scheduled agent processes, or zero.
 *  If result is negative, the scheduler should be executed immediately again because there
 *  can be pending agent signals created in the current run.
 */
function scheduler(services) {
  var run=1,nexttime=0,n=0,curtime,process,env,node,pro,
      timeout=time()+options.RUNTIME;
      
  scheduled=0;
  while (run && (iterations==0 || n<iterations) && time()<timeout) {
    run=0; n++;
    if (services) services();
    nexttime=options.IDLETIME;

    for (env in current.world.nodes) {
      node=current.world.nodes[env];
      if (!node) continue;
      current.node=node;
      curtime=time()-current.world.lag;
      // 1. Timer management
      if (node.timers.length>0) {
        remove=false;
        // 1.1. Check timers and execute runnable signaled agents
        Comp.array.iter(node.timers, function(timer,i) {
            if (timer && timer[1]<=curtime) {
              var process=timer[0],
                  agent=process.agent,
              // Save original process state
                  suspended=process.suspended,
                  timeout=process.timeout;
              
              // process.suspeneded=false;  ?? Signal handler can be executed even with blocked process
              process.signals.push([timer[2],timer[3],agent.id]);
              // TODO: A wakeup call in the signal handler re-enters schedule() !!!
              run += schedule(process);
              curtime=time()-current.world.lag;
              remove=true;              
              node.timers[i]=undefined;
              
              // Restore original process state
              //process.suspended=suspended; ??
              process.timeout=timeout;
            } else if (timer) nexttime=min0(nexttime,timer[1]);
          });
        // 1.2. Timer destruction
        if (remove) 
          node.timers=
            Comp.array.filter(node.timers,function (timer) {
              return timer!=undefined;
            });
      }
      
      curtime=time()-current.world.lag;
      // Node service management (caches, TS)
      node.service(curtime);
      
      // 3. Agent process management
      for (pro in node.processes.table) {
        if (node.processes.table[pro]) {
          // 2.1 Agent execution
          curtime=time()-current.world.lag;
          process=node.processes.table[pro];
          // Io.out('scheduler: checking '+process.agent.id+': '+process.suspended+' '+process.timeout);
          if (process.suspended && process.timeout && process.timeout<=curtime) {
            // Io.out('scheduler: waking up '+process.agent.id);
            process.wakeup();
          }
          run += schedule(process);
          // 2.2 Agent destruction
          if (node.processes.table[pro] && node.processes.table[pro].kill) 
            node.unregister(node.processes.table[pro]);
          if (node.processes.table[pro] && process.suspended && process.timeout>0) 
            nexttime=min0(nexttime,process.timeout);
        }
      }
    }
    scheduled += run;
  }
  if (scheduled>0) return -scheduled;
  else if (nexttime>0) return nexttime;
  else return 0;
}

/*
** The time function can be changed, e.g., by simulators handling simulation
** steps instead of real time. Can be changed with Aios.config({time:fun}), 
** updating all Aios/aiosX references and CP as well.
*/
var time = function () {return Math.ceil(Date.now())};
  
var Aios = {
  aidgen:aidgen,
  aios:aios1,
  aios0:aios0,
  aios1:aios1,
  aios2:aios2,
  aios3:aios3,
  aiosEvents:aiosEvents,
  Amp:Amp,
  callback:undefined,
  clock:clock,
  collect:Ts.agent.collect,
  // External API: Change AIOS settings only using config!
  config:config,
  current:current,
  emit:emit,          // Emit event
  err: function (msg) {if (options.verbose) log('Error: '+msg)},
  fork:fork,
  kill:kill,
  killOn:killOn,
  lock:lock,
  loop:loop,
  log:log,            // Generic AIOS logging function
  logAgent:logAgent,  // Agent message logging (with details about current)
  logAIOS:logAIOS,    // AIOS logging function related with agent proecssing (with details about current)  
  off:off,            // Remove event handler
  on:on,              // Add event handler
  options:options,
  print:Io.out,         // Low-level print IO function for agent messages via Aios.aiosX.log and internal Aios.log; 
                        // OR if printAgent is set only AIOS internal messages; can be modified by host app
  printAgent:undefined, // Low-level print IO function for agent messages only via Aios.aiosX.log; can be modified by host app
  schedule:schedule,
  scheduled:scheduled,
  scheduler:scheduler,
  ticks:function (v) { if (v!=undefined) ticks=v; else return ticks},
  time:time,
  timeout:function (tmo) { return tmo>0?Aios.time()-current.world.lag+tmo:0 },  // Compute absolute time from relative timeout
  Chan:Chan,
  Code:Code,
  Json:Json,
  Mobi:Mobi,
  Name:Name,
  Node:Node,
  Proc:Proc,
  Sec:Sec,
  Sig:Sig,
  Simu:Simu,
  Ts:Ts,
  World:World,
  CB:CB,
  CP:CP,
  RT:RT,
  B:B,
  DIR:Mobi.DIR,
  I:I,
  L:L,
  warn: function (msg) {if (options.verbose>1) log('Warning: '+msg)},
  watchdog: undefined
}

// Builtin watchdog support by JS VM platform?
if (watchdog && watchdog.start) Aios.watchdog=watchdog;
if (watchdog && watchdog.init)  watchdog.init('WATCHDOG');
if (watchdog && watchdog.checkPoint) {
  // only partial watchdog support by platform
  aios0.CP=watchdog.checkPoint;
  aios1.CP=watchdog.checkPoint;
  aios2.CP=watchdog.checkPoint;
  aios3.CP=watchdog.checkPoint;
  Aios.CP=watchdog.checkPoint;
}

Conf.current(Aios);
Code.current(Aios);
Sig.current(Aios);
Sec.current(Aios);
Ts.current(Aios);
Proc.current(Aios);
Node.current(Aios);
World.current(Aios);
Mobi.current(Aios);
if (Simu) Simu.current(Aios);
Chan.current(Aios);
Json.current(Aios);

module.exports = Aios;
};
BundleModuleCode['com/pwgen']=function (module,exports,global,process){
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
 **    $AUTHORS:     Bermi Ferrer, Stefan Bosse 
 **    $INITIAL:     (C) 2011-2015 Bermi Ferrer <bermi@bermilabs.com>, 2017-2018 Stefan Bosse
 **    $REVESIO:     1.3.1
 **
 **    $INFO:
 *
 * password-generator using crypto random number generation (slow,HQ)
 * !using built-in crypto random generators using either native crypto module or polyfill!
 * 
 * options = {length,memorable,lowercase,uppercase,pattern,number?:boolean,range?:[]}
 *
 * Using always twister random byte generator (not random byte array) 
 *
 *     $ENDINFO
 */

var Crypto = Require('os/crypto.rand'); // Require('crypto');

module.exports.generate = function (options) {
  
  function numgen (options) {
    // assuming byte number range 0-255
    var arr = new Uint8Array(options.length||8);
    getRandomValues(arr);
    return arr;
  }
  
  function pwgen (options) {
    var localName, consonant, letter, vowel, pattern = options.pattern,
        char = "", n, i, validChars = [], prefix=options.prefix;
    letter = /[a-zA-Z]$/;
    vowel = /[aeiouAEIOU]$/;
    consonant = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]$/;
    if (options.length == null) {
      options.length = 10;
    }
    if (pattern == null) {
      pattern = /\w/;
    }
    if (prefix == null) {
      prefix = '';
    }

    // Non memorable passwords will pick characters from a pre-generated
    // list of characters
    if (!options.memorable) {
      for (i = 33; 126 > i; i += 1) {
        char = String.fromCharCode(i);
        if (char.match(pattern)) {
          validChars.push(char);
        }
      }

      if (!validChars.length) {
        throw new Error("Could not find characters that match the " +
          "password pattern " + pattern + ". Patterns must match individual " +
          "characters, not the password as a whole.");
      }
    }


    while (prefix.length < options.length) {
      if (options.memorable) {
        if (prefix.match(consonant)) {
          pattern = vowel;
        } else {
          pattern = consonant;
        }
        n = Crypto.randomByte(33,126); // rand(33, 126);
        char = String.fromCharCode(n);
      } else {
        char = validChars[rand(0, validChars.length)];
      }

      if (options.lowercase) char = char.toLowerCase();
      else if (options.uppercase) char = char.toUpperCase();
      
      if (char.match(pattern)) {
        prefix = "" + prefix + char;
      }
    }
    return prefix;
  };


  function rand(min, max) {
    var key, value, arr = new Uint8Array(max);
    getRandomValues(arr);
    for (key in arr) {
      if (arr.hasOwnProperty(key)) {
        value = arr[key];
        if (value > min && value < max) {
          return value;
        }
      }
    }
    return rand(min, max);
  }


  function getRandomValues(buf) {
    var bytes = Crypto.randomBytes(buf.length);
    buf.set(bytes);
  }
  if (options.number) 
    return numgen(options)
  else
    return pwgen(options);
};
};
BundleModuleCode['os/crypto.rand']=function (module,exports,global,process){
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
 **    $CREATED:     15-1-16 by sbosse.
 **    $VERSION:     1.2.4
 **
 **    $INFO:
 **
 **  Crypto module with HQ random number generators (replacing not available crypto.getRandomValues
 **  if there is no global crypto module).
 **
 **    $ENDOFINFO
 */
var crypto = global.crypto || global.msCrypto;

if (!crypto && typeof require != 'undefined') try { crypto=global.crypto=require('require') } catch (e) {};

var twister;

var MersenneTwister = function(seed) {
	if (seed == undefined) {
        /**
        ** It is not sure that Math.random is seeded randomly
        ** Thus, a combination of current system time and Math.random 
        ** is used to seed and initialize this random generator
        */
		seed = new Date().getTime();
        seed *= Math.random()*91713;
        seed |= 0;
	}

	/* Period parameters */
	this.N = 624;
	this.M = 397;
	this.MATRIX_A = 0x9908b0df;   /* constant vector a */
	this.UPPER_MASK = 0x80000000; /* most significant w-r bits */
	this.LOWER_MASK = 0x7fffffff; /* least significant r bits */

	this.mt = new Array(this.N); /* the array for the state vector */
	this.mti=this.N+1; /* mti==N+1 means mt[N] is not initialized */

	if (seed.constructor == Array) {
		this.init_by_array(seed, seed.length);
	}
	else {
		this.init_seed(seed);
	}
}

/* initializes mt[N] with a seed */
/* origin name init_genrand */
MersenneTwister.prototype.init_seed = function(s) {
	this.mt[0] = s >>> 0;
	for (this.mti=1; this.mti<this.N; this.mti++) {
		var s = this.mt[this.mti-1] ^ (this.mt[this.mti-1] >>> 30);
		this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253)
		+ this.mti;
		/* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
		/* In the previous versions, MSBs of the seed affect   */
		/* only MSBs of the array mt[].                        */
		/* 2002/01/09 modified by Makoto Matsumoto             */
		this.mt[this.mti] >>>= 0;
		/* for >32 bit machines */
	}
}

/* initialize by an array with array-length */
/* init_key is the array for initializing keys */
/* key_length is its length */
/* slight change for C++, 2004/2/26 */
MersenneTwister.prototype.init_by_array = function(init_key, key_length) {
	var i, j, k;
	this.init_seed(19650218);
	i=1; j=0;
	k = (this.N>key_length ? this.N : key_length);
	for (; k; k--) {
		var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30)
		this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525)))
		+ init_key[j] + j; /* non linear */
		this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
		i++; j++;
		if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
		if (j>=key_length) j=0;
	}
	for (k=this.N-1; k; k--) {
		var s = this.mt[i-1] ^ (this.mt[i-1] >>> 30);
		this.mt[i] = (this.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941))
		- i; /* non linear */
		this.mt[i] >>>= 0; /* for WORDSIZE > 32 machines */
		i++;
		if (i>=this.N) { this.mt[0] = this.mt[this.N-1]; i=1; }
	}

	this.mt[0] = 0x80000000; /* MSB is 1; assuring non-zero initial array */
}

/* generates a random number on [0,0xffffffff]-interval */
/* origin name genrand_int32 */
MersenneTwister.prototype.random_int = function() {
	var y;
	var mag01 = new Array(0x0, this.MATRIX_A);
	/* mag01[x] = x * MATRIX_A  for x=0,1 */

	if (this.mti >= this.N) { /* generate N words at one time */
		var kk;

		if (this.mti == this.N+1)  /* if init_seed() has not been called, */
			this.init_seed(5489);  /* a default initial seed is used */

		for (kk=0;kk<this.N-this.M;kk++) {
			y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
			this.mt[kk] = this.mt[kk+this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
		}
		for (;kk<this.N-1;kk++) {
			y = (this.mt[kk]&this.UPPER_MASK)|(this.mt[kk+1]&this.LOWER_MASK);
			this.mt[kk] = this.mt[kk+(this.M-this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
		}
		y = (this.mt[this.N-1]&this.UPPER_MASK)|(this.mt[0]&this.LOWER_MASK);
		this.mt[this.N-1] = this.mt[this.M-1] ^ (y >>> 1) ^ mag01[y & 0x1];

		this.mti = 0;
	}

	y = this.mt[this.mti++];

	/* Tempering */
	y ^= (y >>> 11);
	y ^= (y << 7) & 0x9d2c5680;
	y ^= (y << 15) & 0xefc60000;
	y ^= (y >>> 18);

	return y >>> 0;
}

/* generates a random number on [0,0x7fffffff]-interval */
/* origin name genrand_int31 */
MersenneTwister.prototype.random_int31 = function() {
	return (this.random_int()>>>1);
}

/* generates a random number on [0,1]-real-interval */
/* origin name genrand_real1 */
MersenneTwister.prototype.random_incl = function() {
	return this.random_int()*(1.0/4294967295.0);
	/* divided by 2^32-1 */
}

/* generates a random number on [0,1)-real-interval */
MersenneTwister.prototype.random = function() {
	return this.random_int()*(1.0/4294967296.0);
	/* divided by 2^32 */
}

/* generates a random number on (0,1)-real-interval */
/* origin name genrand_real3 */
MersenneTwister.prototype.random_excl = function() {
	return (this.random_int() + 0.5)*(1.0/4294967296.0);
	/* divided by 2^32 */
}

/* generates a random number on [0,1) with 53-bit resolution*/
/* origin name genrand_res53 */
MersenneTwister.prototype.random_long = function() {
	var a=this.random_int()>>>5, b=this.random_int()>>>6;
	return(a*67108864.0+b)*(1.0/9007199254740992.0);
}

function polyfill () {
  twister = new MersenneTwister(); // (Math.random()*Number.MAX_SAFE_INTEGER)|0)
  if (!crypto) crypto=global.crypto={};
  crypto.getRandomValues = function getRandomValues (abv) {
    var l = abv.length
    while (l--) {
      abv[l] = Math.floor(twister.random() * 256)
    }
    return abv
  }
  if (!global.Uint8Array && !Uint8Array) throw new Error('crypto.rand: No Uint8Array found!');
  if (!global.Uint8Array) global.Uint8Array=Uint8Array;
}


function randomByte (min,max) {
  if (!twister) twister = new MersenneTwister();
  return Math.floor(twister.random() * (max-min))+min;
}

function randomBytes (size, cb) {
  // phantomjs needs to throw
  if (size > 65536) throw new Error('requested too many random bytes')
  if (!crypto || !crypto.getRandomValues) polyfill();

  // in case browserify  isn't using the Uint8Array version
  var rawBytes = new global.Uint8Array(size);
  // This will not work in older browsers.
  // See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
  if (size > 0) {  // getRandomValues fails on IE if size == 0
    crypto.getRandomValues(rawBytes);
  }
  // phantomjs doesn't like a buffer being passed here
  var bytes = new Buffer(rawBytes);
  if (typeof cb === 'function') {
    cb(null, bytes)
  }

  return bytes
} 

module.exports = {
  randomByte:randomByte,
  randomBytes:randomBytes
}
};
BundleModuleCode['jam/conf']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: conf.js,v 1.2 2017/05/23 07:00:43 sbosse Exp $
 **    $VERSION:     1.1.5
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Reconfiguration Sub-System
 **
 **    $ENDOFINFO
 */

var Json = Require('jam/jsonfn');
var Comp = Require('com/compat');
var current=none;
var Aios = none;

var act = {
  add: function (act,code) {
    current.process.agent.act[act]=code;
    // Add the new activity to the mask environment of the agent for further referencing.
    current.process.mask[act]=act;
  },
  delete: function (act) {
    if(Comp.obj.isArray(act)) Comp.array.iter(act,function (a) {current.process.agent.act[a]=undefined});
    else current.process.agent.act[act]=undefined
  },
  update: function (act,code) {
    current.process.agent.act[act]=code;
  }
};

var trans = {
  add: function (from,cond) {
    if (current.process.agent.trans[from]) {
      var regex1= /"function[\s]*\([\s]*\)[\s]*\{([^\}]+)\}"/;
      var regex2= /\\n/g;
      var old=Json.stringify(current.process.agent.trans[from]).replace(regex1,"$1").replace(regex2,"");
      var next=Json.stringify(cond).replace(regex1,"$1").replace(regex2,"");
      var merged='(function () {'+old+next+'})';
      //console.log(merged)
      with(current.process.mask) {
        current.process.agent.trans[from]=eval(merged);
      }
    } else current.process.agent.trans[from]=cond;
  },
  delete: function (trans) {
    if(Comp.obj.isArray(trans)) Comp.array.iter(trans,function (t) {current.process.agent.trans[t]=undefined});
    else current.process.agent.trans[trans]=undefined
    },
  update: function (from,cond) {
    current.process.agent.trans[from]=cond;
    }  
}


module.exports = {
  agent:{
    act:act,
    trans:trans
  },
  current:function (module) { current=module.current; Aios=module; }
}
};
BundleModuleCode['jam/jsonfn']=function (module,exports,global,process){
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
 **    $AUTHORS:     Vadim Kiryukhin, Stefan Bosse
 **    $INITIAL:     (C) 2006-2017 Vadim Kiryukhin
 **    $MODIFIED:    by sbosse.
 **    $RCS:         $Id: jsonfn.js,v 1.1 2017/05/20 15:56:53 sbosse Exp $
 **    $VERSION:     1.1.7
 **
 **    $INFO:
 **
 ** JSONfn - javascript (both node.js and browser) plugin to stringify, 
 **          parse and clone objects with functions with masked context (mask).
 **
 **     browser:
 **         JSONfn.stringify(obj);
 **         JSONfn.parse(str[, date2obj]);
 **         JSONfn.clone(obj[, date2obj]);
 **
 **     nodejs:
 **       var JSONfn = require('path/to/json-fn');
 **       JSONfn.stringify(obj);
 **       JSONfn.parse(str[, date2obj]);
 **       JSONfn.clone(obj[, date2obj]);
 **
 **
 **     @obj      -  Object;
 **     @str      -  String, which is returned by JSONfn.stringify() function; 
 **     @date2obj - Boolean (optional); if true, date string in ISO8061 format
 **                 is converted into a Date object; otherwise, it is left as a String.
 **
 **    $ENDOFINFO
 */

var current=none;

(function (exports) {

  exports.stringify = function (obj) {

    return JSON.stringify(obj, function (key, value) {
      if (value instanceof Function || typeof value == 'function') {
        return value.toString(true);  // try minification (true) if supported
      }
      if (value instanceof RegExp) {
        return '_PxEgEr_' + value;
      }
      return value;
    });
  };

  exports.parse = function (str, mask) {
    var code;
    try {
      with (mask) {
        code= JSON.parse(str, function (key, value) {
          var prefix;

          try {
            if (typeof value != 'string') {
              return value;
            }
            if (value.length < 8) {
              return value;
            }

            prefix = value.substring(0, 8);

            if (prefix === 'function') {
              return eval('(' + value + ')');
            }
            if (prefix === '_PxEgEr_') {
              return eval(value.slice(8));
            }
            return value;
          } catch (e) {
            throw {error:e,value:value};
          }
        });
     };
    } catch (e) {
      // within mask there was no current reference
      if (current) current.error=e.value||str;
      throw e.error||e;
    }
   return code;
  };

  exports.clone = function (obj, date2obj) {
    return exports.parse(exports.stringify(obj), date2obj);
  };

  exports.current =function (module) { current=module.current; };

}(typeof exports === 'undefined' ? (window.JSONfn = {}) : exports));


};
BundleModuleCode['jam/code']=function (module,exports,global,process){
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
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: code.js,v 1.3 2017/05/27 18:20:36 sbosse Exp $
 **    $VERSION:     1.10.7
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Code Management Sub-System
 **
 **  New: Check pointing (CP) can be replaced with JS VM watchdog timer.
 **  New: Fast sandboxed constructor
 **  New: Dual mode JSON+/JSOB (with auto detection in toCode)
 **  New: Dirty fastcopy process copy (JS object copy)
 **  New: Function toString with minification (if supported by platform)
 **
 **  JSOB: Simplified and compact textual representation of JS object including function code
 **
 **    $ENDOFINFO
 */
 
var options = {
  compactit:true,
  version:'1.10.7'
}

try {
  // Use built-in JS code minimizer if available
  var M = process.binding('minify');
  Function.prototype._toString=Function.prototype.toString;
  Function.prototype.toString = function (compact) {
    return compact?M.minify(this._toString()):this._toString();
  }
} catch (e) {}; 
 
var Io = Require('com/io');
var Json = Require('jam/jsonfn');
var Comp = Require('com/compat');
var sandbox = Require('jam/sandbox')();
var current=none;
var Aios = none;
var util = Require('util');

/* Test if Json.stringify returns compacted code, otherwise text must be compacted here */
function _testac (p1,p2) {
  /* comment */
  this.x = p1;
  this.y = p2;
  this.z = 0;
  this.act = {
    init: function () {
      /* comment */
      this.z=this.x;
      this.x++;
    }
  }
}
var _testobj = new _testac(1,2);
options.compactit=Json.stringify(_testobj).length>72;
var inject = {cp:undefined,rt:undefined};

/** Construct an agent object with given arguments (array)
 *
 */

function construct(constructor,argArray) {
  var inst = Object.create(constructor.prototype);
  constructor.apply(inst, argArray);
  return inst;  
}

/** Fast dirty copy (fork): Return a fresh copy of the agent object (i.e., process.agent, instead using ofCode/toCode transf.)
 *  attached to a new process object.
 *  All function and AIOS references will be copied as is. The AIOS level cannot be changed. The mask of the 
 *  parent process is now valid for the copied process, too. Any changes in the parent environment effects the child
 *  process, too, and vice versa.
 *
 */
function copyProcess(process) {
  var _process,_agent,agent=process.agent,mask=process.mask;

  process.node.stats.fastcopy++;

  agent.process={};
  
  for (var p in process) {
    switch (p) {
      case 'schedule':
        if (process.schedule.length > 0) 
          agent.process[p]=process.schedule;
        // keep it only if <> []        
        break;
      case 'blocked':
        if (agent.process.suspended==true) 
          agent.process[p]=true;
        // keep it only if it is true   
        break;
      case 'gid':
      case 'pid':
        break; // ?????
      // case 'delta':
      case 'back':
      case 'dir':
        // keep it
         agent.process[p]=process[p];
        break;
    }
  }
  if (Comp.obj.isEmpty(agent.process)) agent['process']=undefined;
  agent['self']=undefined;

  _agent=Comp.obj.copy(agent);
  
  if (!_agent.process) 
    _process=Aios.Proc.Proc({mask:mask,agent:_agent});
  else {
    _process=Aios.Proc.Proc(agent.process);
    _process.init({timeout:0,schedule:[],blocked:false,mask:mask,agent:_agent});
    _agent['process']=undefined;
  }
  agent['self']=agent;
  return _process;
}

/** Return name of a class constructor function
 *
 */
function className (f) {
  var name=f.toString().match(/[\s]*function[\s]*([a-z0-9]+)[\s]*\(/);
  return name?name[1]:"unknown"
}

/** Create a sandboxed agent object process on the current node
 *  using either a sandboxed agent constructor object {fun,mask}
 *  or a generic agent class constructor function that is sandboxed here.
 *
 *  Returns process object.
 *
 * type create = 
 *  function (node:node,
 *            constructor:function|{fun:function,mask:{}},
 *            args:{}|[],level?:number,className?:string) -> process
 */
function create(constructor,args,level,className) {
  return createOn(current.node,constructor,args,level,className);
}

/** Create a sandboxed agent process on a specified node
 *  using either a sandboxed agent constructor object {fun,mask}
 *  or a generic agent class constructor function that is sandboxed here.
 *  
 *
 *  Returns process object.
 *
 * type createOn = 
 *  function (node:node,
 *            constructor:function|{fun:function,mask:{}},
 *            args:{}|*[],level?:number,className?:string) -> process
 */
function createOn(node,constructor,args,level,className) {
  if (!constructor.fun && !Comp.obj.isFunction(constructor)) {
    Aios.err('Code.create: No valid constructor function specified.');
    return;
  }
    
  var code,
      agent0,
      agent,
      process,
      _process;
      
  _process=current.process; 
  current.process={timeout:0};
  if (level==undefined) level=1;
  
  try {
    if (!constructor.fun) 
      constructor=makeSandbox(constructor,level);
    if (!(args instanceof Array)) args=[args];
    
    agent0= construct(constructor.fun,args);

    if (!agent0) {
      Aios.err('Code.createOn ('+className+'): Agent constructor failed.');
      current.process=_process;  
      return null;
    }

    process=makeProcess(agent0,constructor.mask);
    process.resources.memory=constructor.size||0;
    current.process=_process;  
  
  } catch (e) {
    current.process=_process;  
    Aios.err('Code.createOn ('+className+'): '+e);
    return;
  }
  
  agent=process.agent;
  if (!Comp.obj.isArray(args) && Comp.obj.isObject(args))
    for (var p in args) {
      if (Comp.obj.hasProperty(agent,p)) agent[p]=args[p];
    }
  // Test minimal structure requirements
  if (!agent['next'] || !agent['trans'] || !agent['act']) {    
    Aios.err('Code.createOn: Missing next/trans/act attribute in agent constructor '+className);
    return none;  // must be defined and initialized
  }
  process.level=level;
  agent['self']=agent;
  if (className) agent['ac']=className;
  node.register(process);

  node.stats.create++;
  
  return process;
}

/** Create a compiled agent process in a sandbox environment from an 
 *  agent class constructor function on the current node.
 *  Returns JSON+/JSOB representation of agent process snapshot and
 *  the newly created process.
 *
 */
function createAndReturn(constructor,ac,args,level) {
  if (!(args instanceof Array)) args=[args];
/*
  var code = ofCode({agent:new constructor(args[0],args[1],args[2],args[3],
                                           args[4],args[5],args[6],args[7],
                                           args[8],args[9])},true);
*/
  var process,agent,
      code = ofCode({agent:construct(constructor,args)},true);
  if (level==undefined) level=1;
  process = toCode(code,level);
  agent=process.agent;
  agent.id=Aios.aidgen();
  agent.ac=ac;
  return {code:ofCode(process,false),process:process};
}

/** Fork an agent object and return JSON+/JSOB text code.
 *  Note: Forking discards current scheduling blocks (in contrast to migration)!!!
 *
 *  Returns cleaned code (w/o CP and internal AIOS properties).
 *
 */
function forkCode(process) {
  var code='',p;
  var agent = process.agent;
  var self = agent.self;
  // Clean up current agent process
  agent['process']=undefined;
  agent['self']=undefined;
  
  code=Aios.options.json?Json.stringify(agent):toString(agent);
  
  // Restore current agent process
  agent.process=process;
  agent.self=self;
  
  // Cleanup required?
    
  // CP/RT removal
  if (inject.cp || inject.rt)
    code=removeInjection(code);
  return code;
}

/** Convert agent object code from a process to text JSON+/JSOB.
 *  Returns cleaned code (w/o CP and internal AIOS properties).
 *  @clean: Code is already clean, no further filtering
 *
 */
function ofCode(process,clean) {
  var code='',p;
  var agent=process.agent;
  agent.process={};
  
  for (var p in process) {
    switch (p) {
      case 'schedule':
        if (process.schedule.length > 0) 
          agent.process[p]=process.schedule;
        // keep it only if <> []        
        break;
      case 'blocked':
        if (agent.process.suspended==true) 
          agent.process[p]=true;
        // keep it only if it is true   
        break;
      case 'gid':
      case 'pid':
        break; // ?????
      // case 'delta':
      case 'back':
      case 'dir':
        // keep it
         agent.process[p]=process[p];
        break;
    }
  }
  if (Comp.obj.isEmpty(agent.process)) agent['process']=undefined;
  agent['self']=undefined;

  code=Aios.options.json?Json.stringify(agent):toString(agent);

  if (clean && !options.compactit) return code;
  
  
  /* Newline and comment removal is critical. We need to convert '\\''n' to '\n',
  ** replacing comments, finally removing '\n'. This should only be done one time 
  ** on agent creation with compact=true option. Have top deal with '\\''\\''n', too!
  ** More complictaed, we must preserve newlines after blocks! 
  */
    
  if (!clean && (inject.cp||inject.rt)) 
    // CP/RT removal; no or only partial watchdog support by platform
    code=removeInjection(code);

  if (options.compactit) code=minimize(code);

  return code;
}

/** Fast copy agent process creation (virtual, migrate).
 *  All function and AIOS references will remain unchanged. The AIOS level cannot be changed. The mask of the 
 *  original (died) process is now valid for the new process, too.
 */
function ofObject(agent) {
  var process;
  
  if (!agent.process) 
    process=Aios.Proc.Proc({mask:agent.mask,agent:agent});
  else {
    process=Aios.Proc.Proc(agent.process);
    process.init({timeout:0,schedule:[],blocked:false,mask:agent.mask,agent:agent});
    agent['process']=undefined;
  }
  agent['mask']=undefined;

  process.node.stats.fastcopy++;
    
  return process;
}

/** Convert agent text sources to agent code in JSOB format
 *
 */
function ofString(source,mask) {
  var code;
  try {
    // execute script in private context
    with (mask) {
      eval('"use strict"; code = '+source);
    }
  } catch (e) { console.log(e) };
  return code; 
}


/** Create an agent process from agent object code
 *
 */
function makeProcess (agent,mask) {
  var process;
  // Add all activities to the masked environment:
  if (mask) for(var p in agent.act) {
    mask[p]=p;
  }
  if (!agent.process) 
    process=Aios.Proc.Proc({mask:mask,agent:agent});
  else {
    process=Aios.Proc.Proc(agent.process);
    process.init({timeout:0,schedule:[],blocked:false,mask:mask,agent:agent});
    agent['process']=undefined;
  }
  agent['self']=agent;
  
  return process;
}

/** Create a sandboxed agent class constructor object {fun,mask} from
 *  an agent class template constructor function providing 
 *  a sandboxed agent constructor function and the sandbox 
 *  mask agent environment. 
 *  The optional environment object 'env' can contain additional references, e.g.,
 *  activitiy references.
 *
 * Note: All agents created using the constructor function share the same mask
 *       object!
 *
 * typeof constructor = function|string
 * typeof sac = {fun:function, mask: {}, size:number } 
 */
function makeSandbox (constructor,level,env) {
  var _process,sac,aios;
  switch (level) {
    case 0: aios=Aios.aios0; break;
    case 1: aios=Aios.aios1; break;
    case 2: aios=Aios.aios2; break;
    case 3: aios=Aios.aios3; break;
    default: aios=Aios.aios0; break;
  }
  _process=current.process; 
  current.process={timeout:0};
  sac=sandbox(constructor,aios,inject,env);
  current.process=_process;
  return sac;
}

/** Minimize code text
 *
 */
function minimize (code) {
  // Inline and multi-line comments
  var regex4= /\/\*([\S\s]*?)\*\//g;
  var regex5= /([^\\}])\\n/g;                     
  var regex6= /\/\/[^\n]+/g;
   // Newline after {},;
  var regex7= /[ ]*([{},; ]|else)[ ]*\n[\n]*/g;
  // Filter for string quotes
  var regex8= /([^\'"]+)|([\'"](?:[^\'"\\]|\\.)+[\'"])/g;
  // Multi-spaces reduction
  var regex9= / [ ]+/g;
  // relax } <identifier> syntax errors after newline removal; exclude keywords!
  var regex10= /}\s+(?!else|finally|catch)([a-zA-Z_]+)/g;      
  // relax ) <identifier> syntax errors after newline removal
  var regex11= /\)\s+([a-zA-Z_]+)/g; 

  code=code.replace(regex4,"")
           .replace(regex5,'$1\n')
           .replace(regex5,'$1\n')
           .replace(regex6,"")
           .replace(regex7,"$1")
           .replace(regex8, function($0, $1, $2) {
              if ($1) {
                return $1.replace(regex9,' ').replace(regex10,'};$1').replace(regex11,')\n$1');
              } else {
                return $2; 
              } 
            });
  return code;
}

/** Print agent code
 */
 
function print(agent,compact) {
  var process = agent.process;
  var self = agent.self;
  agent['process']=undefined;
  agent['self']=undefined;

  var text=Aios.options.json?Json.stringify(agent):toString(agent);

  agent.process=process;
  agent.self=self;

  if (!text) return 'undefined';
  
  var regex4= /\\n/g;

  if (inject.cp || inject.rt)
    // CP/RT removal; i.e., none or only partial watchdog support by platform
    text= removeInjection(text);

  if (compact && options.compactit)
    text=minimize(text);
    
  return text.replace(regex4,'\n');  
}

/** Remove CP/RT injections from code text
 *
 */
function removeInjection(text) {
  // CP removal
  if (inject.cp) {
    var regex1= /CP\(\);/g;
    var regex2= /\(\(([^\)]+)\)\s&&\sCP\(\)\)/g;
    var regex3= /,CP\(\)/g;
    text=text.replace(regex1,"").replace(regex2,"($1)").replace(regex3,"");
  }
  // RT removal
  if (inject.rt) {
    var regex4= /RT\(\);/g;
    text=text.replace(regex4,"");
  }
  return text;
}

/**  Returns size of cleaned code (w/o CP and internal AIOS properties).
 *
 */
function size(agent) {
  var text='',p;
  var process = agent.process;
  var self = agent.self;
  agent['process']=undefined;
  agent['self']=undefined;
  
  text=Aios.options.json?Json.stringify(agent):toString(agent);
  
  agent.process=process;
  agent.self=self;
  
  if (inject.cp || inject.rt) {   
    text=removeInjection(text);
  }

  return text.length;
}

/** Convert JSON+/or JSOB text to an agent object process encapsulated in a sandbox (aios access only).
 *  Returns process container with CP injected agent code (process.agent).
 *
 *  CP Injection (required on generic JS VM platform w/o watchdog, e.g., node.js, browser):
 *    1. In all loop expressions (for/while)
 *    2. In all function bodies (start)
 *
 *  No watchdog: Aios.watchdog == undefined (nodes.js, browser)
 *  Full watchdog implementation: Aios.watchdog && Aios.watchdog.checkPoint==undefined (jvm)
 *  Partial watchdog implementation with checkPoint function: Aios.watchdog.checkPoint (jxcore)
 * 
 *
 */
function toCode(text,level) {
  var agent,
      process,
      p,
      aios,
      next;
  switch (level) {
    case undefined:
    case 0: aios=Aios.aios0; break;
    case 1: aios=Aios.aios1; break;
    case 2: aios=Aios.aios2; break;
    case 3: aios=Aios.aios3; break;
    default: aios=Aios.aios0; break;
  }
  if (inject.cp) {
    // CP injection; no or only partial watchdog support
    var regex1= /while[\s]*\(([^\)]+)\)/g;
    var regex2= /for[\s]*\(([^\)]+)\)/g;
    var regex3= /function([^\{]+)\{/g;
  
    text=text.replace(regex1,"while (($1) && CP())")
             .replace(regex2,"for ($1,CP())")
             .replace(regex3,"function $1{CP();");
  }
  if (inject.rt) {
    // RT injection
    var regex4 = /catch[\s]*\([\s]*([a-zA-Z0-9_]+)[\s]*\)[\s]*\{/g;
    text=text.replace(regex4,'catch ($1) {'+inject.rt+'($1);');    
  }
  
  /* Set up an object to serve as the local context for the code
  ** being evaluated. The entire global scope must be masked out!
  ** Additionally, Json defines a variable current, which must be 
  ** masked, too.
  */  
  var mask = {current:undefined};
  // mask local properties 
  for (p in this)
    mask[p] = undefined;
  // mask global properties 
  for (p in global)
    mask[p] = undefined;
  // add sandbox content
  for (p in aios) {
    mask[p]=aios[p];
  }
  // Auto detect JSON+ / RAWOBJ format
  var isjson=Comp.string.startsWith(text,'{"');
  try {agent=isjson?Json.parse(text,mask):ofString(text,mask);}
  catch (e) {    
    if (Aios.options.verbose) Aios.log('Aios.code.toCode: '+e+(current.error?(',\nin: '+current.error):''));
    return null;
  }
  if (!agent) {
    return  Aios.log('Aios.code.toCode: Invalid agent code received (empty or invalid source text?)');
  } 
  // Add all activities to the masked environment:
  for(var p in agent.act) {
    mask[p]=p;
  }
  if (!agent.process) 
    process=Aios.Proc.Proc({mask:mask,agent:agent});
  else {
    process=Aios.Proc.Proc(agent.process);
    process.init({timeout:0,schedule:[],blocked:false,mask:mask,agent:agent});
    agent['process']=undefined;
  }
  process.level=level;
  process.resources.memory=text.length;
  agent['self']=agent;
  
  return process;
}

/** Convert agent object (i.e., process.agent) to a snapshot object.
  * 
  */
function toObject(process) {
  var _process,_agent,agent=process.agent,mask=process.mask; 
   
  agent.process={};
  
  for (var p in process) {
    switch (p) {
      case 'schedule':
        if (process.schedule.length > 0) 
          agent.process[p]=process.schedule;
        // keep it only if <> []        
        break;
      case 'blocked':
        if (agent.process.suspended==true) 
          agent.process[p]=true;
        // keep it only if it is true   
        break;
      case 'gid':
      case 'pid':
        break; // ?????
      // case 'delta':
      case 'back':
      case 'dir':
        // keep it
         agent.process[p]=process[p];
        break;
    }
  }
  if (Comp.obj.isEmpty(agent.process)) agent['process']=undefined;
  agent['self']=undefined;

  _agent=Comp.obj.copy(agent);
  _agent.mask = mask;
  
  agent['self']=agent;
  return _agent;
}

/** Convert agent object to text source in JSOB format
 *
 */
function toString(o) {
  var p,i,s='',sep;
  if (Comp.obj.isArray(o)) {
    s='[';sep='';
    for(p in o) {
      s=s+sep+toString(o[p]);
      sep=',';
    }
    s+=']';
  } else if (o instanceof Buffer) {    
    s='[';sep='';
    for(i=0;i<o.length;i++) {
      s=s+sep+toString(o[i]);
      sep=',';
    }
    s+=']';  
  } else if (typeof o == 'object') {
    s='{';sep='';
    for(p in o) {
      if (o[p]==undefined) continue;
      s=s+sep+"'"+p+"'"+':'+toString(o[p]);
      sep=',';
    }
    s+='}';
  } else if (typeof o == 'string')
    s="'"+o.toString()+"'"; 
  else if (typeof o == 'function') 
    s=o.toString(true);   // try minification (true) if supported by platform
  else if (o != undefined)
    s=o.toString();
  else s='undefined';
  return s;
}


module.exports = {
  className:className,
  copyProcess:copyProcess,
  create:create,
  createAndReturn:createAndReturn,
  createOn:createOn,
  forkCode:forkCode,
  ofCode:ofCode,
  ofObject:ofObject,
  ofString:ofString,
  inject:inject,
  Jsonf:Json,
  makeProcess:makeProcess,
  makeSandbox:makeSandbox,
  minimize:minimize,
  print:print,
  size:size,
  toCode:toCode,
  toObject:toObject,
  toString:toString,
  options:options,
  current:function (module) { 
    current=module.current; 
    Aios=module;
    // Set-up inject configuration
    inject.cp=(Aios.watchdog && !Aios.watchdog.checkPoint)?undefined:'CP';
    inject.rt=(Aios.watchdog && Aios.watchdog.protect)?undefined:'RT';
  }
}
};
BundleModuleCode['jam/sandbox']=function (module,exports,global,process){
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
 **    $CREATED:     1-1-17 by sbosse.
 **    $RCS:         $Id: sandbox.js,v 1.1 2017/05/20 15:56:53 sbosse Exp $
 **    $VERSION:     1.5.4
 **
 **    $INFO:
 **
 **  JavaScript AIOS Sandbox Function Constructor
 **
 **   Two version: (1) with eval (2) with new Function
 **   Evaluated code is sometimes slower than a constructed function, though with(mask){} is a performance
 *    leak, too.
 **
 **    $ENDOFINFO
 */

/** Returns a new function f' without global references
 *  except them provided in modules, and the masked environemnt.
 *  An optional checkpointing function call cp can be optionally injected.
 *
 * typeof @inject = {cp?:string,rt?:string}
 * with cp is a checkpointing functions, rt is an exception catcher rethrower
 */
function sandbox(f,modules,inject,env)
{
  var p,
      F,
      mask,
      source;
  // set up an object to serve as the context for the code
  // being evaluated. 
  mask = {mask:undefined,modules:undefined,cp:undefined,f:undefined};
  // mask global properties 
  for (p in this)
    mask[p] = undefined;
  for (p in modules)
    mask[p]=modules[p];
  if (env) for (p in env)
    mask[p]=env[p];
  // execute script in private context
  
  // (new Function( "with(this) { " + scr + "}")).call(mask);
  if (typeof f == 'function') source = f.toString(true);  // try minification (true) if supported
  else source=f;
  
  if (inject.cp) {
    // CP injection
    var regex1= /while[\s]*\(([^\)]+)\)/g;
    var regex2= /for[\s]*\(([^\)]+)\)/g;
    var regex3= /function([^\{]+)\{/g;
  
    source=source.replace(regex1,"while (($1) && "+inject.cp+"())")
                 .replace(regex2,"for ($1,"+inject.cp+"())")
                 .replace(regex3,"function $1{"+inject.cp+"();");
  }
  if (inject.rt) {
    var regex4 = /catch[\s]*\([\s]*([a-zA-Z0-9_]+)[\s]*\)[\s]*\{/g;
    source=source.replace(regex4,'catch ($1) {'+inject.rt+'($1);');
  }
  
  function evalInContext(context, js) {
    return eval('with(context) { "use strict"; F=' + js + ' }');
  }

  // with (mask) {
  //   eval('"use strict"; F='+source);
  //}
  mask.eval=undefined;
  evalInContext(mask,source);
  
  return {fun:F,mask:mask,size:source.length};
}

/** Returns a new function f' without global references
 *  except them provided in modules, and the masked environemnt.
 *  An optional checkpointing function call cp can be optionally injected.
 *
 * typeof @inject = {cp?:string,rt?:string}
 * with cp is a checkpointing functions, rt is an exception catcher rethrower
 */
function Sandbox(f,modules,inject,env) {
  var p,mask={},_mask='process';
  for(p in global) {
    if (p.indexOf('Array')>0) continue;
    _mask = _mask + ',' + p;
  }
  for (p in modules)
    mask[p]=modules[p];
  if (env) for (p in env)
    mask[p]=env[p];
    
  if (typeof f == 'function') source = f.toString(true);  // try minification (true) if supported
  else source=f;

  if (inject.cp) {
    // CP injection
    var regex1= /while[\s]*\(([^\)]+)\)/g;
    var regex2= /for[\s]*\(([^\)]+)\)/g;
    var regex3= /function([^\{]+)\{/g;
  
    source=source.replace(regex1,"while (($1) && "+inject.cp+"())")
                 .replace(regex2,"for ($1,"+inject.cp+"())")
                 .replace(regex3,"function $1{"+inject.cp+"();");
  }
  if (inject.rt) {
    var regex4 = /catch[\s]*\([\s]*([a-zA-Z0-9_]+)[\s]*\)[\s]*\{/g;
    source=source.replace(regex4,'catch ($1) {'+inject.rt+'($1);');
  }

  mask.eval=undefined;_mask += ',eval'

  var F = new Function(_mask,'"use strict"; with(this) { f=('+source+').bind(this)} return f')
              .bind(mask);
  return {fun:F(),mask:mask,_mask:_mask};
}

module.exports = {
  sandbox:sandbox,
  Sandbox:Sandbox
}

module.exports = function () {return sandbox}
};
BundleModuleCode['jam/sig']=function (module,exports,global,process){
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
 **    $CREATED:     15/1/16 by sbosse.
 **    $RCS:         $Id: sig.js,v 1.3 2017/06/19 17:18:39 sbosse Exp sbosse $
 **    $VERSION:     1.4.1
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Signal Sub-System
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios = none;

var options = {
  version:'1.4.1'
}

var sig = {
  broadcast: function (ac,range,sig,arg) {
    var delivered=0;
    // Currently only range=0 is supported => local agents
    if (!Comp.obj.isString(ac)) {current.error='broadcast, invalid class '+ac;throw 'SIGNAL'};
    if (!Comp.obj.isString(sig) && !Comp.obj.isNumber(sig)) {current.error='broadcast, invalid signal '+sig;throw 'SIGNAL'};
    if (range!=0) {current.error='broadcast, invalid range '+range;throw 'SIGNAL'};
    for (var p in current.node.processes.table) {
      var proc=current.node.processes.table[p];
      if (proc && proc.agent.ac == ac && proc.agent.on[sig]) {       
        proc.signals.push([sig,arg,current.process.agent.id]);
        delivered++;
      }
    }
    return delivered;
  },
  // 'to' is the destination agent id
  // 'from' indicates source agent id and remote signal propagation (from node.handle)
  send: function (to,sig,arg,from) {
    var p,node,delivered;
    // Local agent?
    var pid=current.node.processes.lookup(to);
    if (!Comp.obj.isString(sig) && !Comp.obj.isNumber(sig)) {current.error='send, invalid signal';throw 'SIGNAL'};
    current.node.stats.signal++;
    if (pid!=none) {
      // [sig,arg,from]
      current.node.processes.table[pid].signals.push([sig,arg,from||current.process.agent.id]);
      // ?? Aios.emit('schedule',current.node);
      return true;
    } else {
      // console.log('send',current.node.id,to,sig,arg,current.node.processes.gone[to])
      // Agent migrated and still cached?
      if (current.node.processes.gone[to]) {
        var curtime=Aios.time()-current.world.lag;
        current.node.processes.gone[to].timeout=curtime+current.node.TMO;
        return route(current.node.processes.gone[to].dir,
                     to,sig,arg,from||current.process.agent.id);
      }
      
      // coupled nodes via grouping? (used in virtual world/simulation)
      // TODO: prevent children-parent ping-pong if agent was not found
      if (current.node.parent) {
        return current.node.parent.handle({to:to,sig:sig,arg:arg,from:from})
      } else if (current.node.children) {
        delivered=false;
        for(p in current.node.children) {
          node=current.node.children[p];
          delivered=node.handle({to:to,sig:sig,arg:arg,from:from});
          if (delivered) break;
        }
        if (delivered) return true;
      } 
      
      if (current.node.signals[to]) {
        var curtime=Aios.time()-current.world.lag;
        current.node.signals[to].timeout=curtime+current.node.TMO;
        return route(current.node.signals[to].dir,
                     to,sig,arg,from||current.process.agent.id);
        
      }
    }
    return false;
  },
  // Send a signal to agents on a specific remote destination node, e.g., to=DIR.DELTA([-1,-2])
  sendto: function (to,sig,arg) {
    var delivered=0,i;
    if (!Comp.obj.isString(sig) && !Comp.obj.isNumber(sig)) {current.error='sendto, invalid signal '+sig;throw 'SIGNAL'};
    if ((to.tag||to).indexOf('DIR') != 0) {current.error='sendto, invalid destination '+to; throw 'SIGNAL'};
    if (to == Aios.DIR.ORIGIN || (to.delta && Comp.array.zero(to.delta))) {
      if (sig=='TS.SIG') {
        // copy/collect from remote TS
        for(i in arg) {
          Aios.Ts.agent.out(arg[i]);
        }
      } else for (var p in current.node.processes.table) {
        var proc=current.node.processes.table[p];
        if (proc && proc.agent.on && proc.agent.on[sig]) {       
          proc.signals.push([sig,arg,current.process.agent.id]);
          delivered++;
        }
      }
      return delivered;
    } else {
        return route(to,
                     none,sig,arg,current.process.agent.id);    
    }
  },
  sleep: function (tmo) {
    current.process.suspend(tmo?Aios.time()-current.world.lag+tmo:0);
  },
  // Returns signal name
  timer: {
    // Add a oneshot or repeating timer raising a signal 'sig' after timeout 'tmo'.
    add : function (tmo,sig,arg,repeat) {
      if (!Comp.obj.isNumber(tmo)) {current.error='timer, invalid timeout '+tmo; throw 'SIGNAL'};
      if (!Comp.obj.isString(sig)) {current.error='timer, invalid signal '+sig; throw 'SIGNAL'};
      current.node.timers.push([current.process,(Aios.time()-current.world.lag+tmo),sig,arg,repeat]);
      return sig;
    },
    delete: function (sig) {
      current.node.timers=current.node.timers.filter(function (t) {
        return t[2]!=sig
      });
    }
  },
  wakeup: function (process) {
    if (!process) current.process.wakeup();
    else process.wakeup();
  }
}

/** Route signal to next node 
 *
 */
function route(dir,to,sig,arg,from) {
  var node1=current.node,
      chan=none,
      dest,
      stat,
      alive = function () {return 1},
      sigobj = {sig:sig,to:to||dir,from:from,arg:arg,back:Aios.DIR.opposite(dir,true)},
      msg;
  // console.log('route',node1.id,dir,sigobj)
  switch (dir.tag||dir) {
    case Aios.DIR.NORTH:  chan=node1.connections.north; break;
    case Aios.DIR.SOUTH:  chan=node1.connections.south; break;
    case Aios.DIR.WEST:   chan=node1.connections.west; break;
    case Aios.DIR.EAST:   chan=node1.connections.east; break;
    case Aios.DIR.UP:     chan=node1.connections.up; break;
    case Aios.DIR.DOWN:   chan=node1.connections.down; break;
    case Aios.DIR.NW:     chan=node1.connections.nw; break;
    case Aios.DIR.NE:     chan=node1.connections.ne; break;
    case Aios.DIR.SE:     chan=node1.connections.se; break;
    case Aios.DIR.SW:     chan=node1.connections.sw; break;
    case 'DIR.IP':    chan=node1.connections.ip; dest=dir.ip; break;
    case 'DIR.DELTA':
      // Simple Delta routing: Minimize [x,y,..] -> [0,0,..] with {x,y,..}
      sigobj.to=Comp.obj.copy(sigobj.to);
      if (dir.delta[0]>0 && node1.connections.east && node1.connections.east.status()) 
        sigobj.to.delta[0]--,chan=node1.connections.east;
      else if (dir.delta[0]<0 && node1.connections.west && node1.connections.west.status()) 
        sigobj.to.delta[0]++,chan=node1.connections.west;
      else if (dir.delta[1]>0 && node1.connections.south && node1.connections.south.status()) 
        sigobj.to.delta[1]--,chan=node1.connections.south;
      else if (dir.delta[1]<0 && node1.connections.north && node1.connections.north.status()) 
        sigobj.to.delta[1]++,chan=node1.connections.north;
      else if (dir.delta[2]>0 && node1.connections.up && node1.connections.up.status()) 
        sigobj.to.delta[2]--,chan=node1.connections.up;
      else if (dir.delta[2]<0 && node1.connections.down && node1.connections.down.status()) 
        sigobj.to.delta[2]++,chan=node1.connections.down;
      break;
    case 'DIR.PATH':
      chan=node1.connections.path; dest=dir.path; 
      break;
    case 'DIR.CAP':
      if (!current.network) {current.error='No connection to server '+dir.cap; return false;};
      chan=node1.connections.dos; dest=Net.Parse.capability(dir.cap).cap; 
      break;
    default: return false;
  }
  switch (dir.tag||dir) {
    // One hop to next neighbour only?
    case Aios.DIR.NORTH:
    case Aios.DIR.SOUTH:
    case Aios.DIR.WEST:
    case Aios.DIR.EAST:
    case Aios.DIR.UP: 
    case Aios.DIR.DOWN:
    case Aios.DIR.NW:
    case Aios.DIR.NE:
    case Aios.DIR.SE:
    case Aios.DIR.SW:
      sigobj.to=Aios.DIR.ORIGIN; // After messaging signal has arrived
      break;
  }
  if (chan==none || !chan.status(dest) /* OLDCOMM || !chan.signal*/) {
    current.error='No connection to direction '+dir; 
    return false;
  };
  node1.stats.signal++;

  if (Aios.options.fastcopy && chan.virtual) msg=sigobj;
  else msg=Aios.Code.toString(sigobj);
  /** OLDCOMM
  chan.signal(msg,dest);
  */
  /* NEWCOMM */
  chan.send({signal:msg,to:dest});
  
  return true;
}

module.exports = {
  agent:sig,
  options:options,
  route:route,
  current:function (module) { current=module.current; Aios=module; }
}
};
BundleModuleCode['jam/node']=function (module,exports,global,process){
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
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: node.js,v 1.3 2017/06/06 14:53:57 sbosse Exp $
 **    $VERSION:     1.12.1
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Node Sub-System
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var Security = Require('jam/security');
var current=none;
var Aios = none;

var options = {
  version:'1.12.1'
}

function aid(process) { return process.agent.id+':'+process.pid }
function min0(a,b) { return a==0?b:(b==0?a:Comp.pervasives.min(a,b)) };

/** Create a node.
 *  typeof options = {id,maxpro,maxts,position:{x,y},defaultLevel?,TMO?}
 *
 */
var node= function (options) {
  var self=this;
  options=checkOptions(options,{});
  this.options=options;
  this.id       = checkOption(this.options.id,Aios.aidgen());
  this.position = checkOption(this.options.position,Aios.DIR.ORIGIN);
  this.type     = checkOption(this.options.type,'generic');
  this.verbose  = checkOption(this.options.verbose,0);
  // Default AIOS privilege level for received agent snapshots
  this.defaultLevel=checkOption(this.options.defaultLevel,1);
  this.processes={
    free:none,
    max:checkOption(this.options.maxpro,100),
    // (proc|undefined) []
    table:[],
    // number|undefined []
    hash:[],
    top:0,
    used:0,
    // a cache of migrated agents [id]={dir,timeout}
    gone:[]
  };
  this.processes.lookup = function (aid) {
    if(self.processes.hash[aid]!=undefined) 
      return self.processes.hash[aid];
    else 
      return none;
  };
  this.processes.process = function (aid) {
    if (self.processes.hash[aid]!=_)
      return self.processes.table[self.processes.hash[aid]];
    else
      return none;
  };
  
  // Signal propagation cache [from]={dir:timeout}
  this.signals=[];
  // [agent,tmo,sig,arg]
  this.timers=[];
  
  /** Connections to other nodes using P2P/IP/DOS links
  *  type link = {recv: function (callback),send:function(data),
  *               status: function() -> bool,count:number}
  */
  this.connections={north:none,south:none,west:none,east:none};
  // tuple spaces
  this.ts = Aios.Ts.create({maxn:checkOption(this.options.maxts,8),
                            id:this.id,node:self});
  
  // Random ports for negotiation and node security
  this.random = {};
  this.port = Security.Port.unique();
  this.random[this.port]=Security.Port.unique();
  
  // Code dictionary shared by agents
  this.library = {};
  
  // Location (geo) and position (virtual) information
  // location : { ip:string, 
  //              gps:{lat:number, lon:number}, 
  //              geo:{city:string,country:string,countryCode:string,region:string,zip:string} }
  
  this.location = null;
  
  
  this.position = options.position;
  
  this.stats = {
    cpu:0,
    create:0,
    fastcopy:0,
    fork:0,
    handled:0,
    migrate:0,
    received:0,
    signal:0,
    error:0,
    tsout:0,
    tsin:0,
    agents:0,
  }
  
  // Agent migration (gone) cache timeout
  this.TMO = checkOption(this.options.TMO,100000);
  // Needs node's service?
  this.timeout = 0;
  
  Aios.emit('node+',self); 

};

/** Clean-up and destroy this node. Terminate all agent processes.
 */
node.prototype.destroy = function () {
  var p,pro,_node=current.node,self=this;
  this.connections={};
  current.node=this;
  for(p in this.processes.table) {
    pro=this.processes.table[p];
    if (!pro) continue;
    pro.kill=true;
    this.unregister(pro);    
  }
  this.processes.gone=[];
  this.ts = none;
  current.node=_node;
  Aios.emit('node-',self); 
}

/** Export of code library
 *
 */
node.prototype.export = function (name,code) {
  // copy and sandbox code
  if (!this.library[name]) 
    this.library[name]=Aios.Code.toString(code);
}

/** Find an agent of the node by it's id and/or class, or agents matching a regular expression. 
 *
 */
node.prototype.getAgent = function (id,ac) {
  var pros=this.getAgentProcess(id,ac);
  if (pros && Comp.obj.isArray(pros)) 
    return Comp.array.map(pros,function (pro) {return pro.agent});
  else if (pros) return pros.agent;
};


node.prototype.getAgentProcess = function (id,ac) {
  var matches=Comp.obj.isRegex(id)?[]:undefined,
      table=this.processes.table,p;
  if (!matches && this.processes.hash[id]!=undefined) {
    p=table[this.processes.hash[id]];
    if (!ac || p.agent.ac==ac) return p;
  }
  if (typeof id == 'number') return table[id];
  for(var p in table) {
    if (!table[p]) continue;
    if (!matches && table[p].agent.id==id && (!ac || table[p].agent.ac==ac)) 
      return table[p];
    if (matches && id.test(table[p].agent.id) && (!ac || table[p].agent.ac==ac)) 
      matches.push(table[p]);
  }
  return matches;
};



/** Receive a signal to be passed to an agent located here or routed to another node.
 *  Message is in JSOB text format or a JS object (fastcopy mode).
 *
 * typeof sigobj = {to,sig,arg,from,back?}
 *
 */
node.prototype.handle = function (msg) {
  var delivered,tmo,curtime=Aios.time()-current.world.lag,
      _node=current.node,self=this,
      sigobj=(typeof msg == 'string')?Aios.Code.ofString(msg,{}):msg;
  if (!sigobj) return; // Error
  current.node=this;
  // console.log('handler',this.id,sigobj);  
  delivered=(Aios.Mobi.DIR.isDir(sigobj.to)?Aios.Sig.agent.sendto:Aios.Sig.agent.send)
            (sigobj.to,sigobj.sig,sigobj.arg,sigobj.from);
  if (delivered && sigobj.back) {
    // Update signal route cache
    tmo=curtime+this.TMO;
    this.signals[sigobj.from]={dir:sigobj.back,timeout:tmo};
    this.timeout=min0(this.timeout,tmo);
  };
  this.stats.handled++;
  current.node=_node;
  Aios.emit('schedule',self);
  return delivered;
}

/** Import code from library.
 *  Returns a sandboxed code copy.
 *
 */
node.prototype.import = function (name) {
  var code;
  if (this.library[name]) code=Aios.Code.ofString(this.library[name],current.process.mask);
  return code;
}

/** Get node statistics 
 * 
 */
node.prototype.info = function () {
  var self=this,
      p,
      obj = {};
  ovj.stats = this.stats; 
  obj.id = this.id;
  obj.position = this.position;
  obj.agents={};
  var update=function (obj) {   
    var p;
    for (p in obj) {
      if (p != '_update') delete obj[p];
    }
    for (p in self.processes.hash) {
      if (self.processes.hash[p]!=_)
        obj[p]=self.processes.table[self.processes.hash[p]];
    };
  }
  obj.agents._update=update;
  update(obj.agents);
  
  obj.signals=this.signals;
  obj.timers=this.timers;
  obj.ts=this.ts;
  obj.connections=this.connections;
  return obj;
}

/** Print node statistics
 *
 */
node.prototype.print = function (summary) {
  var i,blocked,pending,total,ghost=0;
  var str='==== NODE '+this.id+' ===='+NL;
  str += 'SYSTIME='+Aios.time()+NL;
  str += 'PROCESS TABLE >>'+NL;
  if (summary) {
    blocked=0; pending=0; total=0; ghost=0;
    for (i in this.processes.table) {
      if (this.processes.table[i]!=_) { 
        total++;
        if (this.processes.table[i].blocked) blocked++;
        if (this.processes.table[i].signals.length>0) pending++;
        if (this.processes.table[i].agent.next==undefined) ghost++;
      };
    }
    str += '  TOTAL='+total+' BLOCKED='+blocked+' DYING='+ghost+' SIGPEND='+pending+NL;
  } else {
    for (i in this.processes.table) {
      if (this.processes.table[i]!=_) { 
        str += '  ['+aid(this.processes.table[i])+'] '+
             'NEXT='+this.processes.table[i].agent.next+' '+
             this.processes.table[i].print();
      };
    }
  }
  if (this.timers.length>0) {
    str += 'TIMER TABLE >>'+NL;
    for (i in this.timers) {
      str += '  ['+aid(this.timers[i][0])+'] TMO='+this.timers[i][1]+' SIG='+this.timers[i][2]+NL;
    }
  }
  str += 'TUPLE SPACES >>'+NL;
  if (summary) str += '  '+this.ts.print(summary); else str += this.ts.print(summary);
  return str;
}

/** Receive migrated agent text code and create a process container registered on this node.
 *  If start=false then the next activity is computed here.
 *
 */
node.prototype.receive = function (msg,start,from) {
  // Save context
  var _process=current.process,
      _node=current.node,
      self=this,
      process,agent;
  if (this.verbose>1) Io.log ('Received (start='+start+'):\n'+msg);
  if (typeof msg !== 'object') process=Aios.Code.toCode(msg,this.defaultLevel); 
  else process=Aios.Code.ofObject(msg); // Virtual migration, same physical JAM
  
  if (!process) return; // Error
  
  agent=process.agent;
  agent['self']=agent;
  this.register(process);
  this.stats.received++;
  
  if (process.dir || process.delta) { 
    /* TODO migration if this node is not the destination */
  };
  if (!process.back && from && from.address && from.port) process.back=Aios.DIR.IP(from.address+':'+from.port); 
  if (process.back && process.agent.parent) { // register child-to-parent signal path
    tmo=Aios.time()-current.world.lag+this.TMO;
    this.signals[process.agent.parent]={dir:process.back,timeout:tmo};
    this.timeout=min0(this.timeout,tmo); 
  }
  
  // console.log('node.receive '+this.position.x+','+this.position.y);
  if (process.schedule.length == 0) {
    // Compute next activity on THIS node
    current.node=this;
    current.process=process;
    try {       
      if (!start) 
        agent.next=(typeof agent.trans[agent.next] == 'function')?agent.trans[agent.next].call(agent):
                                                                  agent.trans[agent.next];
      if (process.blocked) throw 'BLOCKING';
      //console.log(agent.next);
    } catch (e) {
      Aios.aios.log ('Node.receive: Agent '+agent.id+' ['+agent.ac+'] in transition '+agent.next+
                    ' failed:\n'+e+(current.error?' / '+current.error:', in: \n'+Aios.Code.print(agent.trans[agent.next]))+
                    '\nat:\n'+Io.sprintstack(e));
      this.unregister(process);
    };
    // Restore context
    current.node=_node;
    current.process=_process;
  }
}

/** Register agent code and assign a process container.
 *
 */
node.prototype.register = function (process) {
  var i,p,
      self=this,
      agent=process.agent;
  if (this.processes.free==none) {
    loop: for (i in this.processes.table) {
      if (this.processes.table[i]==_) { this.processes.free=i; break loop};
    }
  }
  if (this.processes.free!=none) {
    this.processes.table[this.processes.free]=process;
    process.pid=this.processes.free;
    process.agent=agent;
    this.processes.free=none;
  } else {
    this.processes.table[this.processes.top]=process;
    process.agent=agent;
    process.pid=this.processes.top;
    this.processes.top++;
  }
  if (agent.id==undefined) agent.id=Aios.aidgen();
  this.processes.hash[agent.id]=process.pid;
  this.processes.used++;
  this.stats.agents++;
  
  if (this.processes.gone[process.agent.id]) 
    // Agent returned again!
    this.processes.gone[process.agent.id]=undefined;
  process.node=this;
  Aios.emit('agent+',{agent:agent,proc:process,node:self},self); 
  Aios.emit('schedule',self); 
}

/** Node Garbage Collection and Timeout Service
 *
 */
node.prototype.service = function (curtime) {
  var nexttime=0,p,pro,sig;
  
  // TS cleanup management        
  this.ts.service(curtime);

  if (curtime<this.timeout) return;

  for (p in this.processes.gone) {
    pro=this.processes.gone[p];
    
    if (pro==undefined) continue;
    if (pro.timeout < curtime) {
      this.processes.gone[p]=undefined;
    } 
    else
      nexttime=min0(nexttime,pro.timeout);      
  }
  for (p in this.signals) {
    sig=this.signals[p];
    
    if (sig==undefined) continue;
    if (sig.timeout < curtime) {
      this.signals[p]=undefined;
    } 
    else
      nexttime=min0(nexttime,sig.timeout);      
  }
  this.timeout=nexttime;
}


/** Release a proecss container. If the process migrated,
 *  move the process container to a cache (signal and group comm.)
 *
 */
 
node.prototype.unregister = function (process) {
  var i,p,remove,
      self=this,tmo,
      agent=process.agent,
      curtime=Aios.time()-current.world.lag;
  // Check pending timers
  remove=false;
  Comp.array.iter(this.timers,function (timer,i) {
    if (timer && timer[0].pid==process.pid) {
      self.timers[i]=_;
      remove=true;
    }
  });
  if (remove) 
    this.timers = 
      Comp.array.filter(this.timers,function (timer) {
        return timer!=undefined;
      });
  // Unlink process
  this.processes.table[process.pid]=_;
  delete this.processes.hash[agent.id];
  if (this.processes.free==none) this.processes.free=process.pid;
  current.node.ts.cleanup(process);
  process.pid=none;
  process.signals=[];
  process.dead=true;
  this.processes.used--;
  this.stats.agents--;
  
  if (process.move) {
    // Cache migrated process
    tmo=curtime+this.TMO;
    this.processes.gone[process.agent.id]={dir:process.move,timeout:tmo};
    // Maganged in world GC
    this.timeout=min0(this.timeout,tmo);
  }
  Aios.emit('agent-',{agent:agent,node:self,proc:process},self); 
}

/** Create a new node object.
 *  If setcurrent is set, the new node will be set as the current node.
 */
var Node = function (options,setcurrent) {
  var obj=new node(options);
  if (setcurrent) current.node=obj;
  return obj;
}

module.exports = {
  isNode: function (o) { return o instanceof Node }, 
  Node:Node,
  current:function (module) { current=module.current; Aios=module; }
}
};
BundleModuleCode['jam/security']=function (module,exports,global,process){
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
 **    $RCS:         $Id:$
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

};
BundleModuleCode['dos/des48']=function (module,exports,global,process){
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
 **    $CREATED:     3/30/15 by sbosse.
 **    $VERSION:     1.1.4
 **
 **    $INFO:
 **
 **  DOS: Encryption 48bit
 **
 **    $ENDOFINFO
 */
var util = Require('util');
var Io = Require('com/io');
var Comp = Require('com/compat');
var Array = Comp.array;
var assert = Comp.assert;


const des_HBS = 24;
const des_BS = des_HBS * 2;


/*
** Initial permutation,
*/

var des_IP = [
    23, 27, 34, 44, 37, 17, 12, 42,
    3, 32, 41, 29, 20,  2,  1, 10,
    0, 28, 40,  6,  7, 11, 16,  8,
    25, 30, 14, 26, 47, 38, 19, 43,
    18,  5, 35, 39, 36, 21,  4, 45,
    24, 22, 13, 33, 31,  9, 15, 46 ];

/*
** Final permutation, FP = IP^(-1)
*/

var des_FP = [
    16, 14, 13,  8, 38, 33, 19, 20,
    23, 45, 15, 21,  6, 42, 26, 46,
    22,  5, 32, 30, 12, 37, 41,  0,
    40, 24, 27,  1, 17, 11, 25, 44,
    9, 43,  2, 34, 36,  4, 29, 35,
    18, 10,  7, 31,  3, 39, 47, 28 ];

/*
** Permuted-choice 1 from the key bits
** to yield C and D.
** Note that bits 8,16... are left out:
    ** They are intended for a parity check.
*/

var des_PC1_C = [
    57,49,41,33,25,17, 9,
    1,58,50,42,34,26,18,
    10, 2,59,51,43,35,27,
    19,11, 3,60,52,44,36 ];

var des_PC1_D = [
    63,55,47,39,31,23,15,
    7,62,54,46,38,30,22,
    14, 6,61,53,45,37,29,
    21,13, 5,28,20,12, 4 ];


/*
** Sequence of shifts used for the key schedule.
*/

var des_shifts = [
    1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1 ];



/*
** Permuted-choice 2, to pick out the bits from
** the CD array that generate the key schedule.
*/

var des_PC2_C = [
    14,17,11,24, 1, 5,
    3,28,15, 6,21,10,
    23,19,12, 4,26, 8,
    16, 7,27,20,13, 2 ];

var des_PC2_D = [
    41,52,31,37,47,55,
    30,40,51,45,33,48,
    44,49,39,56,34,53,
    46,42,50,36,29,32 ];

/*
** The C and D arrays used to calculate the key schedule.
*/


var des_C = Array.create(56,0);
// des_D = des_C[28]
var des_D_get = function (i) {return des_C[i+28]};
var des_D_set  =  function (i,sval) { des_C[i+28] = sval };

/*
** The key schedule.
** Generated from the key.
*/

var des_KS= Array.create_matrix(16,48,0);

var des_OWsetkey = function(key) {
    var ks = [];
    var t = 0;
    var i,j,k;
    /*
    ** First, generate C and D by permuting
    ** the key.  The low order bit of each
    ** 8-bit char is not used, so C and D are only 28
    ** bits apiece.
    */

    for(i = 0;i < 28;i++) {

        var index1 = des_PC1_C[i] - 1;
        var index2 = des_PC1_D[i] - 1;

        des_C[i] = key[index1];
        des_D_set(i,key[index2]);
    }

    /*
    ** To generate Ki, rotate C and D according
    ** to schedule and pick up a permutation
    ** using PC2.
    */


    for (i = 0 ;i< 16;i++) {

        ks = des_KS[i];

        // rotate
        for (k = 0; k < des_shifts[i]; k++) {
            t = des_C[0];

            for (j = 0; j < 27; j++) {
                des_C[j] = -des_C[j + 1];
            }

            des_C[27] = t;
            t = des_D_get(0);

            for (j = 0; j < 27; j++) {
                des_D_set(j, des_D_get(j + 1));
            }
            des_D_set(27, t);
        }

        /*
         ** get Ki. Note C and D are concatenated.
         */

        for (j = 0; j < 24; j++) {
            ks[j] = des_C[des_PC2_C[j] - 1];
            ks[j + 24] = des_D_get(des_PC2_D[j] - 28 - 1);
        }

    }
};


/*
** The E bit-selection table.
*/

var des_E = [
    22, 15, 12,  3,  8,  2, 23, 16,
    14, 13,  9, 10,  0,  1, 21, 19,
    18,  6, 11,  7, 17,  4, 20,  5,
    5, 17, 11, 13, 12, 14,  8,  7,
    19, 22, 18,  9,  3,  4,  1,  6,
    16,  2, 20, 15, 10, 23,  0, 21 ];


/*
** The 8 selection functions.
** For some reason, they give a 0-origin
** index, unlike everything else.
*/

var des_S = [
    [ 14, 4,13, 1, 2,15,11, 8, 3,10, 6,12, 5, 9, 0, 7,
    0,15, 7, 4,14, 2,13, 1,10, 6,12,11, 9, 5, 3, 8,
    4, 1,14, 8,13, 6, 2,11,15,12, 9, 7, 3,10, 5, 0,
    15,12, 8, 2, 4, 9, 1, 7, 5,11, 3,14,10, 0, 6,13 ],

    [ 15, 1, 8,14, 6,11, 3, 4, 9, 7, 2,13,12, 0, 5,10,
    3,13, 4, 7,15, 2, 8,14,12, 0, 1,10, 6, 9,11, 5,
    0,14, 7,11,10, 4,13, 1, 5, 8,12, 6, 9, 3, 2,15,
    13, 8,10, 1, 3,15, 4, 2,11, 6, 7,12, 0, 5,14, 9 ],

    [ 10, 0, 9,14, 6, 3,15, 5, 1,13,12, 7,11, 4, 2, 8,
    13, 7, 0, 9, 3, 4, 6,10, 2, 8, 5,14,12,11,15, 1,
    13, 6, 4, 9, 8,15, 3, 0,11, 1, 2,12, 5,10,14, 7,
    1,10,13, 0, 6, 9, 8, 7, 4,15,14, 3,11, 5, 2,12 ],

    [ 7,13,14, 3, 0, 6, 9,10, 1, 2, 8, 5,11,12, 4,15,
    13, 8,11, 5, 6,15, 0, 3, 4, 7, 2,12, 1,10,14, 9,
    10, 6, 9, 0,12,11, 7,13,15, 1, 3,14, 5, 2, 8, 4,
    3,15, 0, 6,10, 1,13, 8, 9, 4, 5,11,12, 7, 2,14 ],

    [ 2,12, 4, 1, 7,10,11, 6, 8, 5, 3,15,13, 0,14, 9,
    14,11, 2,12, 4, 7,13, 1, 5, 0,15,10, 3, 9, 8, 6,
    4, 2, 1,11,10,13, 7, 8,15, 9,12, 5, 6, 3, 0,14,
    11, 8,12, 7, 1,14, 2,13, 6,15, 0, 9,10, 4, 5, 3 ],

    [ 12, 1,10,15, 9, 2, 6, 8, 0,13, 3, 4,14, 7, 5,11,
    10,15, 4, 2, 7,12, 9, 5, 6, 1,13,14, 0,11, 3, 8,
    9,14,15, 5, 2, 8,12, 3, 7, 0, 4,10, 1,13,11, 6,
    4, 3, 2,12, 9, 5,15,10,11,14, 1, 7, 6, 0, 8,13 ],

    [ 4,11, 2,14,15, 0, 8,13, 3,12, 9, 7, 5,10, 6, 1,
    13, 0,11, 7, 4, 9, 1,10,14, 3, 5,12, 2,15, 8, 6,
    1, 4,11,13,12, 3, 7,14,10,15, 6, 8, 0, 5, 9, 2,
    6,11,13, 8, 1, 4,10, 7, 9, 5, 0,15,14, 2, 3,12 ],

    [ 13, 2, 8, 4, 6,15,11, 1,10, 9, 3,14, 5, 0,12, 7,
    1,15,13, 8,10, 3, 7, 4,12, 5, 6,11, 0,14, 9, 2,
    7,11, 4, 1, 9,12,14, 2, 0, 6,10,13,15, 3, 5, 8,
    2, 1,14, 7, 4,10, 8,13,15,12, 9, 0, 3, 5, 6,11 ]
    ];


/*
** P is a permutation on the selected combination
** of the current L and key.
*/

var des_P = [
    3, 13,  9, 12,  8, 20, 21,  7,
    5, 23, 16,  1, 14, 18,  4, 15,
    22, 10,  2,  0, 11, 19, 17,  6 ];

var des_L = Array.create(des_BS,0);
var des_R_get = function (i) { return des_L[(i+des_HBS)]};
var des_R_set = function (i,sval) { des_L[i+des_HBS]= sval};
var des_tempL = Array.create(des_HBS,0);
var des_f = Array.create (32,0);

/*
** Warning!!
**
** f[] used to be HBS for some years.
** 21/6/1990 cbo and sater discovered that inside the loop where f is computed
** indices are used from 0 to 31. These overlapped the preS array which is
** declared hereafter on all compilers upto that point, but only those
** values that were not used anymore. But the values of f are only used
** upto HBS. Makes you wonder about the one-way property.
** Then came ACK, and reversed the order of the arrays in the image.
**
** As a short term solution f[] was increased to 32, but in the long run
** someone should have a good look at our "oneway" function
*/

/*
** The combination of the key and the input, before selection.
*/
var des_preS = Array.create (48,0);

/*
** The payoff: encrypt a block. (Now 48 bytes, 1 bit/byte)
*/

var des_OWcrypt48 = function(block) {
    var ks = [];
    var t1 = 0;
    var t2 = 0;
    var i, j, k;
    /*
     ** First, permute the bits in the input
     */

    for (j = 0; j <= (des_BS - 1); j++) {
        des_L[j] = block[des_IP[j]];
    }
    /*
     ** Perform an encryption operation 16 times.
     */

    for (i = 0; i <= 15; i++) {
        ks = des_KS[i];

        /*
         ** Save the R array,
         ** which will be the new L.
         */

        for (j = 0; j < (des_HBS - 1); j++) {
            des_tempL[j] = des_R_get(j);
        }
        /*
         ** Expand R to 48 bits using the E selector;
         ** exclusive-or with the current key bits.
         */

        for (j = 0; j <= 47; j++) {
            des_preS[j] = (des_R_get(des_E[j])) ^ ks[j];
        }

        /*
         ** The pre-select bits are now considered
         ** in 8 groups of 6 bits each.
         ** The 8 selection functions map these
         ** 6-bit quantities into 4-bit quantities
         ** and the results permuted
         ** to make an f(R, K).
         ** The indexing into the selection functions
         ** is peculiar; it could be simplified by
         ** rewriting the tables.
         */

        t1 = 0;
        t2 = 0;

        for (j = 0; j <= 7; j++) {
            var sind2 =
                ((des_preS[t1 + 0] << 5) & 0xff) +
                ((des_preS[t1 + 1] << 3) & 0xff) +
                ((des_preS[t1 + 2] << 2) & 0xff) +
                ((des_preS[t1 + 3] << 1) & 0xff) +
                ((des_preS[t1 + 4] << 0) & 0xff) +
                ((des_preS[t1 + 5] << 4) & 0xff);

            k = des_S[j][sind2];

            des_f[t2 + 0] = (k >> 3) & 0x1;
            des_f[t2 + 1] = (k >> 2) & 0x1;
            des_f[t2 + 2] = (k >> 1) & 0x1;
            des_f[t2 + 3] = (k >> 0) & 0x1;    // 3 .. 31 !!!

            t1 = t1 + 6;
            t2 = t2 + 4;
        }

        /*
         ** The new R is L ^ f(R, K).
         ** The f here has to be permuted first, though.
         */

        for (j = 0; j < des_HBS; j++) {
            des_R_set(j, (des_L[j] ^ des_f[des_P[j]]));
        }

        /*
         ** Finally, the new L (the original R)
         ** is copied back.
         */

        for (j = 0; j < des_HBS; j++) {
            des_L[j] = des_tempL[j];
        }

    }


    /*
     ** The output L and R are reversed.
     */

    for (j = 0; j < des_HBS; j++) {
        t1 = des_L[j];
        des_L[j] = des_R_get(j);
        des_R_set(j, t1);
    }

    /*
     ** The final output
     ** gets the inverse permutation of the very original.
     */

    for (j = 0; j < des_BS; j++) {
        block[j] = des_L[des_FP[j]];
    }
    return block;
};

module.exports = {
    des_OWsetkey:des_OWsetkey,
    des_OWcrypt48:des_OWcrypt48
};
};
BundleModuleCode['jam/proc']=function (module,exports,global,process){
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
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: proc.js,v 1.1 2017/05/20 15:56:53 sbosse Exp $
 **    $VERSION:     1.6.2
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Process Module
 **
 **    $ENDOFINFO
 */
var Comp = Require('com/compat');
var current=none;
var Aios = none;

var options = {
  version:'1.6.2'
}

var PRIO = {
  LOW:0,
  NORMAL:1,
  HIGH:2
}
/*
** Agent process - must be compatible with scheduler context process!
*/

var proc = function (properties) {
  // Agent code
  this.agent={};
  
  // Internal scheudling blocks - can'tmigrate - if any
  // Handled by global scheduler (DOS)
  this.block=[];
  // Process execution suspended?
  this.blocked=false;

  // Process blocking timeout
  this.timeout=0;
  
  // For soft checkpointing
  this.runtime=0;
  
  // Ressource control (node constraints)
  this.resources = {
    start:Aios.clock('ms'),      // start time on this host
    consumed:0,   // total processing time consumed
    memory:0,     // total memory (code+data) consumed
    tuples:0,     // total tuple generation
    agents:0,     // total agents created
  }
  
  this.level=undefined;
  
  // Dynamic process priority effecting scheduling order 
  this.priority = PRIO.NORMAL;  
  
  // Agent scheduling blocks - can migrate!
  // Handled by AIOS scheduler only!
  // function []
  this.schedule=[];
  // Agent activity suspended, waiting for an event?
  this.suspended=false;
  this.suspendedIn=undefined;
  
  this.error=none;
  
  // process id
  this.pid=none;
  // process parent id
  this.gid=none;
  this.id='agent';
  this.mask={};
  // [sig,arg,from] []
  this.signals=[];
  
  // Did we moved?
  this.move=none;
  // Killing state
  this.kill=false;
  // Dead state
  this.dead=false;
  // Pending next transition computatuion?
  this.transition=false;
  // Prevent transition
  this.notransition=false;
  
  for (var p in properties) {
    if (properties[p]!=undefined) this[p]=properties[p];
  }

  // Used in simulators only: A geometric shape object
  this.shape=undefined;  

  if (current.world) this.parent = current.world.context;
  this.node=current.node;
}


/** Execute a callback function in this agent process context immediately (should invoke scheduler and CB!)
 *
 */
proc.prototype.callback = function (cb,args) {
  var _process=current.process,_node=current.node, res;
  current.node=this.node;
  current.process=this;
  try {
    res=cb.apply(this.agent,args||[]);
  } catch (e) {
    Aios.aios.log('Caught callback error: '+e);
  }
  current.process=_process;
  current.node=_node;  
  return res;
}

/** Execute this process immediately
 *
 */
proc.prototype.exec = function() {
  var _process=current.process,_node=current.node, res;
  current.node=this.node;
  res = Aios.schedule(this);
  current.process=_process;
  current.node=_node;  
  return res;
}

/** Finalize this process
 *
 */
proc.prototype.finalize = function() {
  this.kill=true;
  this.suspended=false;
  current.node.unregister(this);
}


/** Fork an agent process.
 *  Returns child process. 
 *  If level is not specified, the parent process level is used.
 */ 
proc.prototype.fork = function(parameters,level,dirty) {
  var code,
      _process=current.process,
      process_,
      agent_,
      p;
  current.process.resources.agents++;
  if (dirty && level!=undefined) dirty=false; // Dirty process copy with level change not possible!    
  if (level==undefined) level=current.process.mask.privilege();
  else level=Math.min(current.process.mask.privilege(),level);
  if (!dirty) {
    code = Aios.Code.forkCode(current.process);
    process_ = Aios.Code.toCode(code,level);
  } else {
    process_ = Aios.Code.copyProcess(current.process);
  }
  agent_ = process_.agent
  agent_.id=Aios.aidgen();
  agent_.parent=current.process.agent.id;
  process_.init({gid:current.process.pid});
  current.process=process_;
  current.node.register(process_);
  // Update forked child agent parameters only if they already exist
  for (p in parameters) {
    if (Comp.obj.hasProperty(agent_,p)) agent_[p]=parameters[p];
  }
  // Should next activity computed in scheduler by setting process.transition ???
  // compute next activity after fork if there is no scheduling block,
  // no parameter next set,
  // and forkCode should always discard all current schedule blocks!
  if (!parameters.next) try {
    agent_.next=(typeof agent_.trans[agent_.next] == 'function')?agent_.trans[agent_.next].call(agent_):
                                                                 agent_.trans[agent_.next];
  } catch (e) { /*kill agent?*/ process_.kill=true; };
  this.node.stats.fork++;
  current.process=_process;
  return process_;
}

proc.prototype.init = function (properties) {
  for (var p in properties) {
    if (this[p]!=undefined) this[p]=properties[p];
  }
}

proc.prototype.print = function () {
  var str='',
      agent=this.agent;
  str = 'PID='+this.pid+
              (this.gid?' GID='+this.gid:'')+
              (this.timeout?(' TMO='+this.timeout):'')+
              (this.blocked?' BLOCKED':'')+
              (this.suspended?' SUSP':'')+
              (this.kill?' KILL':'')+
              (this.dead?' DEAD':'');
  if (this.schedule.length>0) str += ' SCHEDULE='+this.schedule.length;
  if (this.block.length>0) str += ' BLOCK='+this.block.length;
  if (this.signals.length>0) str += ' SIGNALS('+this.signals.length+'):'+
                                    Comp.printf.list(this.signals,function (s) {return s[0]});
  if (this.transition) str += ' TRANS';
  if (this.consumed|0) str += ' CONS='+(this.consumed|0);
  if (agent) str += ' AGENT '+agent.id+' next='+agent.next;
  return str;
}


/**
 * Suspend agent activity processing, but not internal block scheduling!
 */
proc.prototype.suspend = function (timeout,transition,suspendedIn){
  if (!this.kill && !this.dead) {
    this.suspended=true;
    if (timeout!=undefined) this.timeout=timeout;
    if (transition) this.transition=true;  // pending next computation    
    this.suspendedIn = suspendedIn;
  }
}


proc.prototype.update = function (properties) {
  for (var p in properties) {
    this[p]=properties[p];
  }
}


/**
 * Wakeup agent process from a previous suspend call (sleep)
 */
proc.prototype.wakeup = function (immediate){
  this.suspended=false;
  this.timeout=0;
  if (!this.kill && !this.dead && (immediate || this.schedule.length == 0)) {
    var _process=current.process,_node=current.node;
    current.node=this.node;
    if (this.suspendedIn=='ts') this.node.ts.cleanup(this,true);  // Have to call callback handler to inform about timeout!?
    this.suspendedIn=undefined;
    this.transition=this.schedule.length == 0;
    // Re-entering the scheduler is a bad idea!?
    Aios.schedule(this);
    current.process=_process;
    current.node=_node;
  } else Aios.scheduled++;
}

function Proc(properties) {
  var obj = new proc(properties);
  return obj;
}


module.exports = {
  agent: {
    fork:function fork(parameters) {
            return current.process.fork(parameters);
    }
  },
  isProc: function (o) { return o instanceof Proc }, 
  Proc:Proc,
  PRIO:PRIO,
  current:function (module) { current=module.current; Aios=module; },
  options:options
}
};
BundleModuleCode['jam/ts']=function (module,exports,global,process){
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
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: ts.js,v 1.3 2017/06/19 17:18:39 sbosse Exp sbosse $
 **    $VERSION:     1.10.2
 **
 **    $INFO:
 **
 **  JavaScript Agent Tuple-Space Sub-System
 **
 **  New: Global lifetime limit of all tuples
 **  New: xx.try function synonyms (inp.try, rd.try,..) and try functions now fire callback on timeout
 **  New: testandset
 **  New: eval/listen
 **  New: Patterns can contain regular expression! (p_i instanceof RegExp)
 **  New: A rd/inp operation can return all matching tuples
 **  New: alt operation supporting listening on multiple patterns
 **  New: Distributed TS with collect, copyto, store
 **
 **  Exeception: 'TS' 
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios = none;
var verbose=false;

var options = {
  version:'1.10.2',
  // global lifetime limit of tuples
  timeout : 0,
}

function aid(process) { return process.agent.id+':'+process.pid }
function log(tsi,process,msg) {
  if (verbose && process) Aios.aios.log('[TS'+(tsi.i)+':'+current.node.ts.id+'] Ag '
                                          + aid(process)+ ' '+msg);
  else if (verbose) Io.log('[TS'+(tsi.i)+':'+current.node.ts.id+'] SYS'+msg);
}
function min0(a,b) { return a==0?b:(b==0?a:Comp.pervasives.min(a,b)) };

/*******************************************
** Waiter management
*******************************************/

/** Add a waiter to a tuple space data base
 *
 */
var addwaiter = function (tsi,waiter) {
  var index,key;
  if (tsi.waiters.free.length==0) {
    index=tsi.waiters.length;
    tsi.waiters.push(waiter);
  } else {
    index=tsi.waiters.free[0];
    tsi.waiters[index]=waiter;
    tsi.waiters.free.shift();
  }
  if (typeof (key=waiter.pat[0]) == 'string') switch (waiter.op) {
    case 'listen': 
      tsi.waiters.hash[key]=index; break;
  }
}

/** Check for waiting agent processes and try to match the provided tuple.
 *  Readers can read multiple copies of the tuple, whereby consumers can only read the tuple one time.
 *  Consumers (in-op) can be in a waiting list (next/prev). If one waiter in a list consumes
 *  a tuple, all waiters must be removed. The other waiters (the same process, but different patterns; alt-op)
 *  can be in different tuple data bases!
 *
 */
var checkwaiter = function (tsi,tuple,callback) {
  var res,consumed=false,
      i,waiter;
   // Create agent callback   
  function cb(waiter,res) {
    Aios.CB(waiter.pro,function () {waiter.cb.call(waiter.pro.agent,res)});
  }
  for(i=0;i<tsi.waiters.length;i++) {
    if (!tsi.waiters[i]) continue;
    waiter=tsi.waiters[i];
    if (!consumed) switch (waiter.op) {
      case 'rd':
      case 'rd-all':
        res=match(tuple,waiter.pat);
        log(tsi,current.process,' rd waiter? '+res);
        if (res!=none) {
          cb(waiter,(waiter.op=='rd'?res:[res])),
          waiter.pro.wakeup();
          removewaiter(tsi,i);
        }
        break;
      case 'in':
      case 'in-all':
        res=match(tuple,waiter.pat);
        log(tsi,current.process,' in waiter? '+res);
        if (res!=none) {
          cb(waiter,(waiter.op=='in'?res:[res])),
          waiter.pro.wakeup();
          consumed=true;
          removewaiter(tsi,i);
        }
        break;
      case 'listen':
        res=match(tuple,waiter.pat);
        log(tsi,current.process,' listen waiter? '+res);
        if (res!=none) {
          res=waiter.pro.callback(waiter.cb,[res]);
          if (callback) callback.apply(current.process.agent,[res]);
          consumed=true;
        }
        break;    
    } else break;
  }
  
  if (!consumed && current.node.ts.consumers.length>0) {
    consumed = Comp.array.findmap(current.node.ts.consumers,function (consumer) {
      return consumer(tuple);
    });
  }
  return consumed;
}

var findwaiter = function (tsi,waiter) {
  var i;
  for(i=0;i<tsi.waiters.length;i++) {
    if (!tsi.waiters[i]) continue;
    if (tsi.waiters[i].pro.pid!=waiter.pro.pid) continue;
    if (equal(tsi.waiters[i].pat,waiter.pat)) return i;
  }
  return;
}

var removewaiter = function (tsi,index) {
  var waiter=tsi.waiters[index],_tsi,_index;
  tsi.waiters[index]=undefined;
  tsi.waiters.free.push(index);
  // Waiter in a chained waiter list?
  if (waiter.prev) {
    waiter.prev.next=undefined;    
    _tsi=current.node.ts.db[waiter.prev.pat.length];
    _index=findwaiter(_tsi,waiter.prev);
    if (_index != undefined) removewaiter(_tsi,_index);
  };
  if (waiter.next) {
    waiter.next.prev=undefined;    
    _tsi=current.node.ts.db[waiter.next.pat.length];
    _index=findwaiter(_tsi,waiter.next);
    if (_index != undefined) removewaiter(_tsi,_index);
  };
}

var count = function (tsi) {
  var data=tsi.data,i,n=0;  
  for (i in data) {if (data[i] != undefined) n++};
  return n;
}

/** Find one/all matching tuple(s) in the database based on pattern matching
 *
 */
var lookup = function (pat,all) {
  var tsi,nary=pat.length,res=none;
  if (nary>current.node.ts.n || nary==0) return;
  tsi=current.node.ts.db[nary];
  if (!all && Comp.isString(pat[0]) && tsi.hash[pat[0]]!=undefined) {
    // Speedup trial with hash key
    res=match(tsi.data[tsi.hash[pat[0]]],pat);
  }
  if (res==none) {
    res = (all?Comp.array.filtermap:Comp.array.findmap)(tsi.data,function (tuple) {
      if (tuple==_) return none;
      else return match(tuple,pat);
    });
    if (res && res.length==0) res=none;
    if (res == none && current.node.ts.providers.length>0) {
      res = Comp.array.findmap(current.node.ts.providers,function (provider) {
        return provider(pat);
      });
    }
  }
  return res;
}

/*******************************************
** Tuple management
*******************************************/

/**
 * Compare two values, check equiality
 */
var equal = function(x,y) {
  var i;
  if(x==y) return true;
  if (Comp.obj.isArray(x) && Comp.obj.isArray(y)) {
    if (x.length!=y.length) return false;
    for(i in x) {
      if (x[i] != y[i]) return false;
    }
    return true;
  }
  return false;  
}

/** Match a tuple element with a template pattern element y.
 *
 */
var match1 = function (x,y) {
  if (y==any) return true;
  if (x==y)   return true;
  if ((x instanceof Array) && (y instanceof Array)) return match(x,y)!=none;
  if (y instanceof RegExp && typeof x == 'string' && y.test(x)) return true; 
  return false;
}

/** Match a tuple with a template and return none or the original tuple (equivalence result?)
 *
 */
var match = function (tuple,templ) {
  var i;
  if (tuple.length != templ.length) return none;
  for(i in tuple) {
    if (!match1(tuple[i],templ[i])) return none;
  };
  return tuple;
}


/** Find and remove one/all matching tuple(s) from the database based on pattern matching
 *
 */
var remove = function (pat,all) {
  var tsi,nary=pat.length,res=none,removed=false,hashed=_;
  if (nary>current.node.ts.n || nary==0) return;
  tsi=current.node.ts.db[nary];
  if (!all && Comp.isString(pat[0])) hashed=tsi.hash[pat[0]];
  if (hashed != _) {
    // Speedup trial with hash key
    res=match(tsi.data[hashed],pat);
    if (res) {
      // invalidate matching tuple in data list
      removed=true;
      tsi.data[hashed]=_;
      tsi.tmo[hashed]=0;
      // remember the free slot in the data list
      if (tsi.free==none) tsi.free=hashed;
      // invalidate hash entry - tuple is consumed
      delete tsi.hash[pat[0]];
    }
  }
  if (res==none || removed==false) {    
    res = (all?Comp.array.filtermap:Comp.array.findmap)(tsi.data,function (tuple,i) {
        if (tuple==_) return none;
        var res_=match(tuple,pat);
        if (res_!=none) {
          if (Comp.isString(pat[0]) && tsi.hash[pat[0]]==i) {
            // Invalidate hash - tuple is consumed
            delete tsi.hash[pat[0]];            
          } 
          tsi.data[i]=_;
          tsi.tmo[i]=0;
          if (tsi.free==none) tsi.free=i;
          return res_;
        } else return none;
    });
    if (res && res.length==0) res=none;
  }
  return res;
}


/*******************************************
** Tuple Space Agent/Client API
*******************************************/

var ts = {
  // consuming - tmo <> 0 => try_alt
  alt: function (pats,callback,all,tmo) {
    var tsi,nary,res,
        i,p,pat,waiters=none,last=none;
    for(i in pats) {
      pat=pats[i];
      nary=pat.length;
      if (nary>current.node.ts.n || nary==0) return none;
      res = remove(pat,all);
      if (res && res.length) current.node.stats.tsin += (all?res.length:1);
      if (res && callback) {
        callback.call(current.process.agent,res);
        return;
      } 
      else if (res) return res;  
    }
    if (callback && tmo==0) return callback();
    if (tmo==0) return;
     
    // No matching tuple found - go to sleep
    
    for(i in pats) {
      pat=pats[i];
      nary=pat.length;
      if (callback  && (tmo==undefined||tmo>0))  {
        if (waiters==none) 
          waiters={pat:pat,
                   pro:current.process,
                   cb:callback,
                   op:'in'+(all?'-all':''),
                   tmo:tmo>0?Aios.time()-current.world.lag+tmo:0
                  },last=waiters;
        else {
          last.next={pat:pat,
                   pro:current.process,
                   cb:callback,
                   op:'in'+(all?'-all':''),
                   tmo:tmo>0?Aios.time()-current.world.lag+tmo:0,
                   prev:last
                  },last=last.next;
        }
      }
    }
    if (waiters!=none) {
      p=waiters;
      while(p) {
        tsi=current.node.ts.db[p.pat.length];
        addwaiter(tsi,p);
        p=p.next;
      }
      log(tsi,current.process,' +waiter');
      current.process.suspend(tmo>0?Aios.time()-current.world.lag+tmo:0,_,'ts');
    }
  },
  
  // The collect primitive moves tuples from this source TS that match template 
  // pattern into destination TS specified by path 'to' (a node destination).
  collect: function (to,pat) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0) return none;
    tsi=current.node.ts.db[nary];
    res = remove(pat,true);    
    if (res.length>0) {
      current.node.stats.tsin += res.length;
      Aios.Sig.agent.sendto(to,'TS.SIG',res);
    }
    return res.length;
  },
  // Copy all matching tuples form this source TS to a remote destination TS
  // specified by path 'to' (a node destination).
  copyto: function (to,pat) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0) return 0;
    tsi=current.node.ts.db[nary];
    res = lookup(pat,true);    
    if (res.length>0) {
      Aios.Sig.agent.sendto(to,'TS.SIG',res);
    }
    return res.length;
  },

  // Access a tuple evaluator - non-blocking: no listener -> callback(null)
  // TODO blocking/tmo
  evaluate: function (pat,callback,tmo) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0) return none;
    tsi=current.node.ts.db[nary];
    consumed=checkwaiter(tsi,pat,callback);
    if (!consumed && callback) callback.call(current.process.agent,null); 
  },  
  
  // Test tuple existence
  exists: function (pat) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0) return none;
    tsi=current.node.ts.db[nary];
    res = lookup(pat);
    return res!=none;  
  },
  
  // consuming - tmo <> 0 => try_in
  inp: function (pat,callback,all,tmo) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0 || typeof pat != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    res = remove(pat,all);
    log(tsi,current.process,' in? '+res+' []='+count(tsi));
    if (res && res.length) current.node.stats.tsin += (all?res.length:1);
    if (res==none && callback && (tmo==undefined||tmo>0)) {
      addwaiter(tsi,{pat:pat,
                     pro:current.process,
                     cb:callback,
                     op:'in'+(all?'-all':''),
                     tmo:tmo>0?Aios.time()-current.world.lag+tmo:0
                     });
      log(tsi,current.process,' +waiter');
      current.process.suspend(tmo>0?Aios.time()-current.world.lag+tmo:0,_,'ts');
      return none;
    } else if (callback) callback.call(current.process.agent,res); else return res;
  },

  // Provide a tuple evaluator
  listen: function (pat,callback) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0 || typeof pat != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    addwaiter(tsi,{pat:pat,
                     pro:current.process,
                     cb:callback,
                     op:'listen',
                     tmo:0
                     });    
  },  
  
  // Store time-limited tuples
  mark: function (tuple,tmo) {
    var p,tsi,nary=tuple.length,consumed=false;
    if (nary>current.node.ts.n || nary==0 || typeof tuple != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    current.node.stats.tsout++;
    // Check waiters
    consumed=checkwaiter(tsi,tuple);
    if (!consumed) {
      if (tsi.free==none) {
        loop: for (var i in tsi.data) {
          if (tsi.data[i]==_) {tsi.free=i; break loop}
        }
      }
      if (options.timeout) tmo=min0(options.timeout,tmo);
      tmo=Aios.time()-current.world.lag+tmo;
      if (tsi.free!=none) {
        tsi.data[tsi.free]=tuple;
        tsi.tmo[tsi.free]=tmo;
        current.node.ts.timeout=min0(current.node.ts.timeout,tsi.tmo[tsi.free]);
        if (Comp.obj.isString(tuple[0]))
          tsi.hash[tuple[0]]=tsi.free;
        tsi.free=none;
      } else {
        tsi.data.push(tuple);
        tsi.tmo.push(tmo);
        // hash is only a first guess to find a tuple
        if (Comp.obj.isString(tuple[0]))
          tsi.hash[tuple[0]]=tsi.data.length-1;
      }
    } else current.node.stats.tsin++;
  },
  // Store a tuple in this TS
  out: function (tuple) {
    var tsi,tmo=0,nary=tuple.length,consumed=false,res;
    if (nary>current.node.ts.n || nary==0 || typeof tuple != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    current.node.stats.tsout++;
    // Check waiters
    consumed=checkwaiter(tsi,tuple);
    if (!consumed) {
      if (tsi.free==none) {
        loop: for (var i in tsi.data) {
          if (tsi.data[i]==_) {tsi.free=i; break loop}
        }
      }
      if (options.timeout) tmo=Aios.time()-current.world.lag+options.timeout;
      if (tmo)  current.node.ts.timeout=min0(current.node.ts.timeout,tmo);

      if (tsi.free!=none) {
        tsi.data[tsi.free]=tuple;
        tsi.tmo[tsi.free]=tmo;
        if (Comp.obj.isString(tuple[0]))
          tsi.hash[tuple[0]]=tsi.free;
        tsi.free=none;
      }
      else {
        tsi.data.push(tuple);
        tsi.tmo.push(tmo);
        // hash is only a first guess to find a tuple
        if (Comp.obj.isString(tuple[0]))
          tsi.hash[tuple[0]]=tsi.data.length-1;
      }
    } else current.node.stats.tsin++;
    log(tsi,current.process,' out '+tuple+'  ['+nary+'] consumed='+consumed+' []='+count(tsi));
  },
  
  // not consuming - tmo <> undefined => try_rd [0: immed.]
  rd: function (pat,callback,all,tmo) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0 || typeof pat != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    res = lookup(pat,all);

    if (res==none && callback && (tmo==_||tmo>0)) {
      addwaiter(tsi,{pat:pat,
                     pro:current.process,
                     cb:callback,
                     op:'rd'+(all?'-all':''),
                     tmo:tmo>0?Aios.time()-current.world.lag+tmo:0
                    });
      current.process.suspend(tmo>0?Aios.time()-current.world.lag+tmo:0,_,'ts');
      return none;
    } else if (callback) callback.call(current.process.agent,res); else return res;
  },
  
  // consuming 
  rm: function (pat,all) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0 || typeof pat != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    res = remove(pat,all);
    if (res && res.length) current.node.stats.tsin += (all?res.length:1);
    return (res!=none);
  },

  // Remote tuple storage
  store: function (to,tuple) {
    Aios.Sig.agent.sendto(to,'TS.SIG',[tuple]);
    return 1;
  },
  
  // Test and Set: Atomic modification of a tuple - non blocking
  // typeof @callback: function (tuple) -> tuple
  ts: function (pat,callback) {
    var tsi,nary=pat.length,res,ret;
    if (nary>current.node.ts.n || nary==0 || !Comp.obj.isArray(pat)) throw 'TS';
    tsi=current.node.ts.db[nary];
    res = lookup(pat,false);
    log(tsi,current.process,' test? '+res+' []='+count(tsi));
    if (res) current.node.stats.tsin += 1;
    if (callback) {
      if (current.process)
        ret=callback.call(current.process.agent,res);
      else
        ret=callback(res);
      // update the modified tuple
      if (ret && ret.length==res.length) Comp.array.copy(ret,res);
      res=ret;
    } else if (res) {
      // restore the originally consumed tuple
      ts.out(res);
    }
    return res;
  },
  try : {
    alt : function (tmo,pats,callback,all) {
      return ts.alt(pats,callback,all,tmo);
    },
    evaluate : function (tmo,pat,callback) {
      return ts.evaluate(pat,callback,tmo);
    },
    inp : function (tmo,pat,callback,all) {
      return ts.inp(pat,callback,all,tmo);
    },
    rd : function (tmo,pat,callback,all) {
      return ts.rd(pat,callback,all,tmo);
    }
  }
}

// Synonyms
ts.alt.try = ts.try.alt
ts.evaluate.try = ts.try.evaluate
ts.inp.try = ts.try.inp
ts.rd.try = ts.try.rd

/*******************************************
** Tuple Space Data Base
*******************************************/

var tsd = function (options) {
  var self=this;
  if (!options) options={};
  this.n=options.maxn||8;
  this.id=options.id||'TS';
  this.timeout=0;
  this.db=Comp.array.init(this.n+1,function (i) {
    var tsi;
    if (i==0) return none;
    tsi = {
        i:i,
        hash:[],
        // number|none
        free:none,
        // [*] [] 
        data:[],
        // number []
        tmo:[],
        // [pattern,agent,callback,kind]
        waiters:[]
    };
    tsi.waiters.free=[];
    tsi.waiters.hash={}; // Hash tuple key for consuming waiter
    return tsi;
  });
  /*
  ** Additional external tuple providers implementing a match function.
  */
  this.providers=[];
  /*
  ** Additional external tuple consumers implementing a match function.
  */
  this.consumers=[];
  this.node=options.node;

  // External API w/o blocking and callbacks (i.e., try_ versions with tmo=0)
  // Can be called from any context
  this.extern = {
    exists: function (pat,callback) { 
      var res,_node=current.node;
      current.node=self.node||_node;
      res=ts.exists(pat,callback);
      current.node=_node;
      return res;
    },    
    inp: function (pat,all) {
      var res,tsi,nary=pat.length,_node=current.node;
      current.node=self.node||_node;
      if (nary>current.node.ts.n || nary==0) return none;
      tsi=current.node.ts.db[nary];
      res = remove(pat,all);
      if (res && res.length) current.node.stats.tsin += (all?res.length:1);
      current.node=_node;
      return res;
    },
    mark: function (pat,tmo) { 
      var res,_node=current.node;
      current.node=self.node||_node;
      res = ts.mark(pat,tmo);
      current.node=_node;
      return res;
    },
    out: function (pat) { 
      var res,_node=current.node;
      current.node=self.node||_node;
      res = ts.out(pat)
      current.node=_node;
      return res;
    },
    rd: function (pat,all) {
      var res,tsi,nary=pat.length,_node=current.node;
      current.node=self.node||_node;
      if (nary>current.node.ts.n || nary==0) return none;
      tsi=current.node.ts.db[nary];
      res = lookup(pat,all);
      if (res && res.length) current.node.stats.tsin += (all?res.length:1);
      current.node=_node;
      return res;
    },
    rm: function (pat,all) { 
      var res,_node=current.node;
      current.node=self.node||_node;
      res=ts.rm(pat,all);
      current.node=_node;
      return res;
    },
    ts: function (pat,callback) { 
      var res,_node=current.node;
      current.node=self.node||_node;
      res=ts.ts(pat,callback);
      current.node=_node;
      return res;
    },
  }

}

var create = function (options) {
  return new tsd(options);
}

tsd.prototype.checkwaiter = function (tuple) {
  var tsi,nary=tuple.length;
  if (nary>this.n || nary==0) return none;
  tsi=current.node.ts.db[nary];
  return checkwaiter(tsi,tuple);
}

/** Remove an agent process from waiter queues.
 * If doCallback is set, a pending operation callback handler is executed here (e.g., on timeout or interruption).
 *
 */
tsd.prototype.cleanup = function (process,doCallback) {
  var i,j,tsi,p,waiter;
  function cb(waiter) {
    Aios.CB(waiter.pro,function () {waiter.cb.call(waiter.pro.agent,null)});
  }
  for (i in current.node.ts.db) {
    if (i==0) continue;
    tsi=current.node.ts.db[i];
    for(j=0;j<tsi.waiters.length;j++) {
      if (!tsi.waiters[j]) continue;
      waiter=tsi.waiters[j];
      if (waiter.pro.pid==process.pid) {
        if (doCallback && waiter.cb) cb(waiter);
        removewaiter(tsi,j);
      }
    }
  }
} 


/**
 * Register an external tuple provider (function).
 * The provider can immediately return a matching tuple,
 * or can deliver it later on calling the checkwaiter loop 
 * which delivers the tuple to the agent.
 *
 * type of func  : provider|consumer
 * type provider : function ('pat) -> 'tuple
 * type consumer : function ('pat) -> boolean
 */
tsd.prototype.register = function (func,consumer) {
  if (consumer) this.consumers.push(func)
  else this.providers.push(func);
};


tsd.prototype.print = function (summary) {
  var i,tsi,num,str='',sep='';
  if (summary) {
    str += '[';
    for (i in current.node.ts.db) {
      if (i==0) continue;
      tsi=current.node.ts.db[i];
      num = count(tsi);
      if (num>0) {
        str += sep+'TS'+(int(i)+1)+'='+num;
        sep=' ';
      }
    }
    str += ']'+NL;
  }    
  else for (i in current.node.ts.db) {
    if (i==0) continue;
    tsi=current.node.ts.db[i];
    str += '['+Comp.printf.sprintf('%2d',tsi.i)+
           ' free='+(tsi.free?Comp.printf.sprintf('%4d',tsi.free):'none')+
           ' data='+Comp.printf.sprintf('%4d(%4d)',count(tsi),tsi.data.length)+
           ' waiters='+Comp.printf.sprintf('%4d',tsi.waiters.length)+']'+NL;
  }  
  return str;  
}


/** Tuple Space Garbage Collection and Timeout Service
 *
 */
tsd.prototype.service = function (curtime) {
  var i,hashed,tsi,nexttime=0;
  
  // TODO: if (curtime<this.timeout) return;
  for (i in this.db) {
    tsi=this.db[i];
    hashed;
    if (tsi==_) continue;
    Comp.array.iter(tsi.tmo,function (tmo,i) {
      var tuple=tsi.data[i];
      if (tuple && tmo) {
        if (tmo < curtime) {
          if (Comp.isString(tuple[0])) hashed=tsi.hash[tuple[0]];
          if (hashed != _ && hashed==i) delete tsi.hash[tuple[0]];
          tsi.data[i]=_;
          tsi.tmo[i]=0;
          if (tsi.free==none) tsi.free=i;        
        } else nexttime=min0(nexttime,tmo);
      }
    });
  }
  this.timeout=nexttime;
}

module.exports = {
  agent:ts,
  count:count,
  create: create,
  current:function (module) { current=module.current; Aios=module; },
  match:match,
  options:options
}
};
BundleModuleCode['jam/world']=function (module,exports,global,process){
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
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: world.js,v 1.2 2017/05/27 18:20:36 sbosse Exp $
 **    $VERSION:     1.11.3
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent World Module
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;

var options = {
  version:'1.11.3'
}

/** Word object
 *
 * typeof options = {
 *    classes?,
 *    id?:string,
 *    scheduler?,
 *    verbose?
 * }
 */
var world= function (nodes,options) {
  var main=this;
  options=checkOptions(options,{});
  this.options=options;
  
  this.nodes=nodes||[];
  this.verbose=checkOption(this.options.verbose,0);
  this.hash={};
  this.id=checkOption(this.options.id,Aios.aidgen().toUpperCase());
  this.classes=checkOption(this.options.classes,[]);
  // A time lag (offset), required for simulation
  this.lag=0;
  this.scheduler = this.options.scheduler;
  this.log = Aios.log;
  this.out = function (msg) { main.log('[JAW '+this.id+'] '+msg)};

  /* Create a task context for the scheduler
  */
  
  this.thread = function (arg) {
    var thr = this;
    var dying=false;
    this.nexttime=0;
    this.number=arg;
    this.curtime=0;
    
    this.init = function () {
      main.out('JAM World is starting ..');
    };
    this.run = function () {
      thr.nexttime=Aios.scheduler();
      thr.curtime=Aios.time();
      if (main.verbose>3) main.out(' .. nexttime = '+thr.nexttime+
                                   ' ('+(thr.nexttime>0?thr.nexttime-thr.curtime:0)+')');
    };
    this.sleep = function () {
      var delta;
      thr.curtime=Aios.time();
      delta=thr.nexttime>0?thr.nexttime-thr.curtime:1000;
      if (main.verbose>3) main.out(' .. sleeping for '+delta+' ms');
      main.scheduler.Delay(delta);
    };
    
    this.transitions = function () {
        var trans;
        trans =
            [
                [undefined, this.init, function (thr) {                    
                    return true
                }],
                [this.init, this.run, function (thr) {
                    return true
                }],
                [this.run, this.run, function (thr) {
                    return thr.nexttime<0;
                }],
                [this.run, this.sleep, function (thr) {
                    return !dying;
                }],
                [this.run, this.terminate, function (thr) {
                    return dying
                }],
                [this.sleep, this.run, function (thr) {
                    return true;
                }]
            ];
        return trans;
    };
    this.context = main.scheduler.TaskContext('JAM World'+main.id, thr);
    
  }

};

// Add an agent class constructor (@env can contain resolved constructor function variables). 
// typepf constructor = function|string

world.prototype.addClass = function (name,constructor,env) {
  this.classes[name]=[
    Aios.Code.makeSandbox(constructor,0,env),
    Aios.Code.makeSandbox(constructor,1,env),
    Aios.Code.makeSandbox(constructor,2,env),
    Aios.Code.makeSandbox(constructor,3,env)     
  ];
}

/** Add a node to the world. 
 *
 */
world.prototype.addNode = function (node) {
  this.nodes.push(node);
  if (node.id) this.hash[node.id]=node;
};

/** Connect two nodes in directions dir:node1->node2 and dir':node2->node1
 *  with two virtual channel links that are created here.
 *
 */
world.prototype.connect = function (dir,node1,node2,options) {
  if (!options) options={};
  var chan=Aios.Chan.Virtual(node1,node2,dir,options); 
  switch (dir) {
    case Aios.DIR.NORTH: 
      node1.connections.north=chan.link1;
      node2.connections.south=chan.link2;
      break;
    case Aios.DIR.SOUTH: 
      node1.connections.south=chan.link1; 
      node2.connections.north=chan.link2; 
      break;
    case Aios.DIR.WEST:  
      node1.connections.west=chan.link1; 
      node2.connections.east=chan.link2; 
      break;
    case Aios.DIR.EAST:
      node1.connections.east=chan.link1; 
      node2.connections.west=chan.link2; 
      break;
    case Aios.DIR.NE:
      node1.connections.ne=chan.link1; 
      node2.connections.sw=chan.link2; 
      break;
    case Aios.DIR.NW:
      node1.connections.nw=chan.link1; 
      node2.connections.se=chan.link2; 
      break;
    case Aios.DIR.SE:
      node1.connections.se=chan.link1; 
      node2.connections.nw=chan.link2; 
      break;
    case Aios.DIR.SW:
      node1.connections.sw=chan.link1; 
      node2.connections.ne=chan.link2; 
      break;
    case Aios.DIR.UP:
      node1.connections.up=chan.link1; 
      node2.connections.down=chan.link2; 
      break;
    case Aios.DIR.DOWN:
      node1.connections.down=chan.link1; 
      node2.connections.up=chan.link2; 
      break;
    default: 
      if (current) current.error='EINVALID';
      throw 'CONNECT';
  } 
  chan.link2.on('agent',node1.receive.bind(node2));
  chan.link1.on('agent',node2.receive.bind(node1));
  chan.link2.on('signal',node1.handle.bind(node2));
  chan.link1.on('signal',node2.handle.bind(node1));
  chan.link1.end=node2.id;
  chan.link2.end=node1.id;
  return chan;
};

/** Connect node via a port in direction dir:node->*. The endpoint node * will be
 *  connected if the @snd parameter is specified. Otherwise only an unconnected port is created.
 *  An endpoint can be later connected using the world.connectTo method (if provided by the interface).
 *
 *  One uni- or bidirectional physical link is created and attached to the given node.
 *
 *  typeof options={
 *    compress?:boolean,
 *    oneway?:boolean,
 *    proto:'udp'|'tcp'|'http'|'device',
 *    device?:string,
 *    rcv:url is node endpoint,
 *    snd?:url is remote endpoint
 *  }
 *  with type url = "<name>:<ipport>" | "<ip>:<ipport>" | "<ipport>"
 *  and ipport = (1-65535) | "*"
 */
world.prototype.connectPhy = function (dir,node,options) {
  var self=this,chan,name=Aios.DIR.to(dir);
  if (!options) options={};
  chan=Aios.Chan.Physical(node,dir,options); 
  switch (dir.tag||dir) {
    case 'DIR.IP':
      // Update routing table of router!
      if (!node.connections.ip) node.connections.ip=new Aios.Chan.iprouter();
      node.connections.ip.addLink(chan.link);
      chan.router=node.connections.ip;
      break;
    default: 
      if (!name) {
        if (current) current.error='ENOCHANNEL';
        throw 'CONNECT';
      }
      node.connections[name]=chan.link;
  } 
  chan.link.on('agent',node.receive.bind(node));
  chan.link.on('signal',node.handle.bind(node));
  chan.link.on('class',function (obj){ for(var p in obj) self.addClass(p,obj[p].fun,obj[p].env)});
  return chan;
};

/** Connect a physical link of node @node to a remote endpoint (if curerently not connected) specified by the @dir parameter.
 *  typeof @dir = {tag,ip?,device?} with tag='DIR.IP'|'DIR.NORTH',..
 *
 */
world.prototype.connectTo = function (dir,node,options) {
  var chan,tokens,to=dir.ip,name=Aios.DIR.to(dir);
  if (!node) node=current.node;
  chan=node.connections[name];
  if (chan && (chan.status(to) || !chan.connect)) chan=undefined;
  if (chan) chan.connect(to,options);
}

/** Check connectivity to a specific node or a set of nodes
 *
 */
world.prototype.connected = function (dir,node) {
  var name=Aios.DIR.to(dir),list;
  chan=node.connections[name];
  switch (dir.tag||dir) {
    case Aios.DIR.tag.PATH:
      return chan && chan.status(dir.path);
      break;
    case Aios.DIR.tag.IP:
      // DIR.IP('*') returns all linked IP routes
      // DIR.IP('%') returns all linked nodes (names)
      return chan && chan.status(dir.ip); 
      break;
    case Aios.DIR.tag.NODE:
      // DIR.NODE('*') returns all linked nodes on all connections!
      if (dir.node=='*') {
        // Check all conenctions for remote node information
        list=[];
        if (node.connections.ip) list=list.concat(node.connections.ip.status('%'));
        return list; 
      } else if (typeof dir.node == 'string') {
        // Return link (IP)
        if (node.connections.ip && node.connections.ip.lookup) { 
          found=node.connections.ip.lookup(dir.node);
          return found?Aios.DIR.IP(found):none;
        }
      }
      break;
    case Aios.DIR.tag.DELTA:
      // a rough guess (no nw/sw/se/ne)
      if (dir.delta[0]==1) chan=node.connections.east;
      else if (dir.delta[0]==-1) chan=node.connections.west;
      else if (dir.delta[1]==1) chan=node.connections.north;
      else if (dir.delta[1]==-1) chan=node.connections.south;
      else if (dir.delta[2]==1) chan=node.connections.up;
      else if (dir.delta[2]==-1) chan=node.connections.down;
      return chan && chan.status(); 
      break;
    default: 
      return (chan && chan.status())||false;    
  }  
}

/** Disconnect a physical link of node @node to a remote endpoint (if curerently connected) specified by the @dir parameter.
 *
 */
world.prototype.disconnect = function (dir,node) {
  var chan;
  switch (dir.tag||dir) {
    case 'DIR.IP':
      if (node.connections.ip && 
          node.connections.ip.status(dir.ip) && 
          node.connections.ip.disconnect) 
        node.connections.ip.disconnect(dir.ip); 
      break;
  }  
}


/** Find an agent in the world by it's id  and class (option), 
 *  or agents matching a regular expression by their id. 
 *
 */
world.prototype.getAgent = function (id,ac) {
  var res = this.getAgentProcess(id,ac);
  if (res && Comp.obj.isArray(res)) return res.map(function (ap) { return ap.agent });
  if (res) return res.agent;
  return;
};

world.prototype.getAgentProcess = function (id,ac) {
  var matches=Comp.obj.isRegex(id)?[]:undefined;
  for(var n in this.nodes) {
    var table=this.nodes[n].processes.table;
    for(var p in table) {
      if (!table[p]) continue;
      if (!matches && table[p].agent.id==id && (!ac || table[p].agent.ac==ac)) 
        return table[p];
      if (matches && id.test(table[p].agent.id) && (!ac || table[p].agent.ac==ac)) 
        matches.push(table[p]);
    }
  }
  return matches;
};


/** Find a node in the world by it's id or nodes matching a regular expression. 
 *
 */
world.prototype.getNode = function (nodeid) {
  if (Comp.obj.isRegex(nodeid)) {
    var res=[];
    for(var n in this.nodes) {
      if (nodeid.test(this.nodes[n].id)) res.push(this.nodes[n]);
    }
    return res;
  } else return this.hash[nodeid];
};

world.prototype.info = function () {
  var obj={},stat;
  obj.agents=0;
  obj.transferred=0;
  obj.links=0;
  obj.ports=0;
  for(var n in this.nodes) {
    obj.agents += this.nodes[n].processes.used;
    for (var l in this.nodes[n].connections) {
      if (this.nodes[n].connections[l]) {
        obj.ports++;
        obj.transferred += this.nodes[n].connections[l].count();
        if (this.nodes[n].connections[l].stats) {
          stat = this.nodes[n].connections[l].stats();
          obj.links += (stat.links||0);
        }
      }
    }
  }  
  return obj;
}


world.prototype.init = function () {
}

/** Lookup nodes (using patterns and providing broker support)
 *
 */
world.prototype.lookup = function (dir,callback,node) {
  switch (dir.tag||dir) {
    case Aios.DIR.tag.PATH:
      if (node.connections.ip && node.connections.ip.lookup) return node.connections.ip.lookup(dir.path,callback);
      break;
    default:
      if (callback) callback();
  }
}

world.prototype.print = function (summary) {
  var str='**** WORLD '+this.id+' ****'+NL;
  var res = Io.mem();
  str += 'DATA='+int(res.data/1024)+' MB HEAP='+int(res.heap/1024)+' MB'+NL;
  for(var n in this.nodes) {
    str += this.nodes[n].print(summary);
  }
  return str;
}

/** Disconnect and remove a node from the world. 
 *  The node must be destroyed explicitly.
 *
 */
world.prototype.removeNode = function (nodeid) {
  var c,c2,conn,thenode,chan,node2;
  this.nodes=Comp.array.filter(this.nodes,function (node) {
    if (node.id==nodeid) thenode=node;
    return node.id!=nodeid;
  });
  this.hash[nodeid]=undefined;
  if (thenode) for(c in thenode.connections) {
    conn=thenode.connections[c];
    if (conn && conn.end) {
      node2=this.getNode(conn.end);
      if (node2) for (c2 in node2.connections) {
        // Unlink?
        if (node2.connections[c2] && node2.connections[c2].end==nodeid)
          node2.connections[c2]=undefined;
      }
    }
  }
};

world.prototype.start = function () {
  var self=this;
  if (this.scheduler) {
    proc = new this.thread(0);
    this.context=proc.context;
    this.scheduler.Add(proc.context);
  }
  this.gc = setInterval(function () {
    var node,n,p;
    if (self.verbose>3) self.out('GC');
    for(n in self.nodes) {
      node=self.nodes[n];
      for(p in node.processes.gone) {
        if (node.processes.gone[p]) {
          node.processes.gone[p].tmo -= 500;
          if (node.processes.gone[p].tmo<=0) node.processes.gone[p]=undefined;
        }
      }
    }
  },500);
}

world.prototype.stop = function () {
}

var World = function (nodes,options) {
  var obj=new world(nodes,options);
  current.world=obj;
  return obj;
}

module.exports = {
  options:options,
  World:World,
  current:function (module) { current=module.current; Aios=module}
}
};
BundleModuleCode['jam/chan']=function (module,exports,global,process){
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
 **    $CREATED:     09-02-16 by sbosse.
 **    $RCS:         $Id: chan.js,v 1.3 2017/05/27 18:20:36 sbosse Exp $
 **    $VERSION:     1.15.2
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Node Communication Module offering P2P communication with another nodes
 **
 **  1. Virtual Link: Connecting virtual (logical) nodes using buffers
 **
 **  2. Physical Link: Connecting physical nodes (on the same physical host or remote hosts) 
 **  using AMP protocol and IP communication (including endpoint pairing across NAT routers
 **  using a rendezvous broker service)
 **    
 **  3. Physical Link: Connecting node processes (in a cluster on the same physical host) using process streams 
 **
 **   For IP-based communication ports an internal IP router is provided offering operation 
 **   of multiple ports and connections.
 **
 **   Communciation link object provided by 1.-3.:
 **
 **     type link = {
 **       on: method (@event,@handler) with @event={'agent'|'signal'|'class'},
 **       send: method (@msg) with @msg:{agent:string|object,to:dir}|{signal:string|object},to:dir},
 **       status: method (dir) -> boolean,
 **       count: method () -> number is returning number of received (phy only) and sent bytes,
 **       connect?:method (@to),
 **       disconnect?:method (@to),
 **       start?:method,
 **       stop?:method
 **     } 
 **
 **
 ** Events, emitter: link+  link-  error(err="link"|string,arg?)
 **
 **
 ** TODO:
 **   - Phy capability protected communication and operations
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');
var Amp = Require('jam/amp');
var Sec = Require('jam/security');

var options = {
  verbose:1,
  version:'1.15.2'
}
module.exports.options=options;

var SLINK = {
  INIT:'INIT',
  INITED:'INITED',
  RUNNING:'RUNNING'
}

/******************** 
 *  Virtual Circuit
 ********************
 */
 
var virtual= function (node1,node2,dir,options) {
  var self=this;
  this.node1=node1;
  this.node2=node2;
  this.dir=dir; // node1 -> node2
  this.buffer1=[];
  this.buffer2=[];
  this.count1={rcv:0,snd:0};
  this.count2={rcv:0,snd:0};
  this.compress=options.compress;

  /* NEWCOMM */
  this.handler1=[];
  this.handler2=[];
  
  // External API
  this.link1 = {
    control : function (msg,to,callback) {
      // TODO
    },
    on: function (event,callback) {
      var data;
      self.handler1[event]=callback;
      if (event=='agent' && self.buffer2.length>0) {
          // Agent receiver
          data=Comp.array.pop(self.buffer2);        
          if (self.compress) data=Lz.decompress(data);
          callback(data);
      }
    },

    send: function (msg) {
      var data;
      if (msg.agent) {
        // Agent migration
        data=msg.agent;
        if (self.compress) data=Lz.compress(data);
        if (self.handler2.agent) self.handler2.agent(self.compress?Lz.decompress(data):data);
        else self.buffer1.push(data);
        if (data.length) self.count1.snd += data.length; else self.count1.snd++;
      } else if (msg.signal) {
        // Signal propagation - signals are not queued
        data=msg.signal;
        if (data.length) self.count1.snd += data.length; else self.count1.snd++;
        if (self.handler2.signal) self.handler2.signal(data);
      }
    },
    count: function () {return self.count1.snd},
    status: function () {return true},      // Linked?
    virtual:true

  }

  this.link2 = {
    control : function (msg,to,callback) {
      // TODO
    },
    on: function (event,callback) {
      var data;
      self.handler2[event]=callback;
      if (event=='agent' && self.buffer1.length>0) {
          // Agent receiver
          data=Comp.array.pop(self.buffer1);        
          if (self.compress) data=Lz.decompress(data);
          callback(data);
      }
    },

    send: function (msg) {
      var data;
      if (msg.agent) {
        // Agent migration
        data=msg.agent;
        if (self.compress) data=Lz.compress(data);
        if (self.handler1.agent) self.handler1.agent(self.compress?Lz.decompress(data):data);
        else self.buffer2.push(data);
        if (data.length) self.count2.snd += data.length; else self.count2.snd++;
      } else if (msg.signal) {
        // Signal propagation - signals are not queued
        data=msg.signal;
        if (data.length) self.count2.snd += data.length; else self.count2.snd++;
        if (self.handler1.signal) self.handler1.signal(data);
      }
    },
    count: function () {return self.count2.snd},
    status: function () {return true},      // Linked?
    virtual:true

  }
};

virtual.prototype.init  = function () {};
virtual.prototype.start = function () {};
virtual.prototype.stop  = function () {};

var Virtual = function (node1,node2,dir,options) {
  var obj=new virtual(node1,node2,dir,options);
  return obj;
}

module.exports.Virtual=Virtual;
module.exports.current=function (module) { current=module.current; Aios=module; Amp.current(module); };




if (global.config.nonetwork) return;
/******************************* PHYSICAL *************************************/


/********************* 
 ** Physical Circuit
 *********************
 *  
 * Using UDP-AMP or process stream connections (TODO)
 * typeof options={
 *   broker?:url is UDP hole punching rendezvous broker 
 *   compress?:boolean,
 *   device?:string,
 *   name?:string is optional name of the comm. port e.g. the JAM node name,
 *   on?: { } is event handler object,
 *   oneway?:boolean,
 *   out?:function,
 *   proto?:'udp'|'tcp'|'http'|'hardware',
 *   rcv:url is this endpoint address,
 *   secure?:port string,
 *   snd?:url is remote endpoint address,
 *   stream?:boolean,
 *   verbose?
 *  }
 *  with type url = "<name>:<ipport>" | "<ip>:<ipport>" | "<ipport>"
 *  and type ipport = (1-65535) | "*"
 */
var physical= function (node,dir,options) {
  var self=this;
  options=checkOptions(options,{});
  this.options=options;
  
  this.ip=none;
  if (options.rcv) this.ip=url2addr(options.rcv);
  else this.ip={address:Amp.options.localhost,port:undefined};
  if (options.proto && this.ip) this.ip.proto=options.proto;
  
  this.node=node;
  this.dir=dir; // outgoing port (node -> dst), e.g., IP
  this.count=0;
  this.broker=options.broker;
  
  this.mode=this.options.compress?Amp.AMMode.AMO_COMPRESS:0;

  this.state = SLINK.INIT;
  this.linked = 0;
  
  this.events = [];

  this.out=Aios.log;
  
  if (this.ip.parameter && this.ip.parameter.secure) {
    this.options.secure=Sec.Port.ofString(this.ip.parameter.secure);
    delete this.ip.parameter;
    this.dir.ip=addr2url(this.ip);
  }
  
  this.amp= Amp.Amp({
      broker:options.broker?url2addr(options.broker,this.ip.address):undefined,
      dir:this.dir,
      mode:this.options.mode,
      name:this.options.name,
      node:node,
      oneway:this.options.oneway,
      multicast:this.options.multicast,
      proto:this.options.proto,  
      rcv:this.ip,
      secure:this.options.secure,
      snd:options.snd?url2addr(options.snd):undefined,
      sock:options.sock,
      verbose:options.verbose,
    });

  // External API
  this.link = {
    // Control RPC
    // STD_STATUS/PS_STUN/...
    control : function (msg,to,callback) {
      var buf,data,addr=to?url2addr(to):{};
      buf=Buf.Buffer();
      if (msg.args) Buf.buf_put_string(buf,JSON.stringify(msg.args));
      msg.tid=Comp.random.int(65536/2);
      self.callbacks[msg.tid]=callback;
      self.amp.request(msg.cmd,
                       buf, 
                       self.amp.mode & Amp.AMMode.AMO_MULTICAST? addr:undefined);        
      
    }, 
    on: function (event,callback) {
      self.events[event]=callback;
    },
    send: function (msg,to) {
      var buf,data,addr=to?url2addr(to):{};
      if (msg.agent) {
        data=msg.agent; // string of JSON+
        buf=Buf.Buffer();
        if (self.mode & Amp.AMMode.AMO_COMPRESS) data=Lz.compress(data);
        Buf.buf_put_string(buf,data); 
        // function request(cmd:integer,msg:Buffer,snd?:address)
        self.amp.request(Command.PS_MIGRATE, 
                         buf, 
                         self.amp.mode & Amp.AMMode.AMO_MULTICAST? addr:undefined);        
      } else if (msg.signal) {
        data=msg.signal;  // string of JSON
        // Signal propagation  
        buf=Buf.Buffer();
        if (self.mode & Amp.AMMode.AMO_COMPRESS) data=Lz.compress(data);
        Buf.buf_put_string(buf,data);   
        // function request(cmd:integer,msg:Buffer,snd?:address)
        self.amp.request(Command.PS_SIGNAL, 
                         buf, 
                         self.amp.mode & Amp.AMMode.AMO_MULTICAST? addr:undefined);        
      }
    },
    count: function () {return self.amp.count.rcv+self.amp.count.snd},
    status : function (to) {
      if (self.amp) {
        if (to) to=url2addr(to);
        return to?self.amp.status(to.address,to.port):self.amp.status();
      }
    },  // Linked?
    stats : function () {
      return {
        transferred:self.amp.count.rcv+self.amp.count.snd,
        linked:self.linked
      }
    },
    ip:this.ip,
    mode:this.amp.mode
  }
  
  /** Connect to remote endpoint with optional capability key protection
   *  typeof @to = "<url>" | "<path>" | "<ip>:<ipport>" | "<ipport>"
   *  typeof @key = string "[<port>](<rights>)[<protport>]"
   */
  this.link.connect=function (to,key) {
    // allow url2addr DNS lookup
    url2addr(to,self.ip.address,function (addr) {
      self.amp.link(addr,true,key);
    })
  };

  // Disconnect remote endpoint
  this.link.disconnect=function (to) {
    var tokens;
    if (!to){
      if (self.amp.snd && self.amp.snd.address && self.amp.snd.port)
        self.amp.unlink(self.amp.snd);
    } else {
      var addr=url2addr(to,self.ip.address);
      self.amp.unlink(addr);
    }
  };
  this.link.init=function (cb) {
    if (self.state!=SLINK.INIT) return cb?cb():null;
    self.state=SLINK.INITED;
    return self.amp.init(cb);
  }
  this.link.start=function (cb) {
    if (self.state!=SLINK.INITED) return cb?cb():null;
    self.state=SLINK.RUNNING;
    return self.amp.start(cb);
  }
  this.link.stop=function (cb) {
    if (self.state!=SLINK.RUNNING) return cb?cb():null;
    self.state=SLINK.INITED;
    return self.amp.stop(cb); 
  }
  
  if (this.broker) this.link.lookup = function (path,callback) {
    if (self.amp.lookup) self.amp.lookup(path,callback);
    else if (callback) callback([]);
  }
  // Install route notification propagation to router (if installed)
  this.amp.on('route+',function (arg,arg2) {
    if (self.router) self.router.add(arg,self.link,arg2);
    self.emit('link+',arg,arg2);
    Aios.emit('link+',arg,arg2);
    self.linked++;
  });
  this.amp.on('route-',function (arg) {
    if (self.router) self.router.delete(arg,self.link);
    self.emit('link-',arg);
    Aios.emit('link-',arg);
    self.linked--;
  });
  this.amp.on('error',function (err,arg) {
    self.emit('error',err,arg);
  });
  if (options.on) {
    for(var p in options.on) this.on(p,options.on[p]);
  }
  // Register message receiver handler
  this.amp.receiver(function (handler) {
    var code,name,env,agentid,stat,obj,buf,status;
    if (!handler) return;
    if (self.options.verbose>2) { self.out('AMP: got request:'+ Io.inspect(handler)) };
    switch (handler.cmd) {
      case Command.PS_MIGRATE:
        code = Buf.buf_get_string(handler.buf);
        // console.log(code);
        // console.log(myJam.amp.url(handler.remote))
        if (self.mode & Amp.AMMode.AMO_COMPRESS) code=Lz.decompress(code);
        if (self.events.agent) self.events.agent(code,false,handler.remote);
        break;
      case Command.PS_CREATE:
        code = Buf.buf_get_string(handler.buf);
        // console.log(code);
        // console.log(myJam.amp.url(handler.remote))
        if (self.mode & Amp.AMMode.AMO_COMPRESS) code=Lz.decompress(code);
        if (self.events.agent) self.events.agent(code,true);
        break;
      case Command.PS_WRITE:
        name = Buf.buf_get_string(handler.buf);
        code = Buf.buf_get_string(handler.buf);
        env = Buf.buf_get_string(handler.buf);
        // console.log(code);
        // console.log(myJam.amp.url(handler.remote))
        if (self.mode & Amp.AMMode.AMO_COMPRESS) code=Lz.decompress(code);
        obj={};
        try {eval("env = "+env)} catch (e) {};
        obj[name]={
          fun:code,
          env:env
        }
        if (self.events['class']) self.events['class'](obj);
        break;
      case Command.PS_SIGNAL:
        // TODO
        code = Buf.buf_get_string(handler.buf);
        // console.log(code);
        if (self.mode & Amp.AMMode.AMO_COMPRESS) code=Lz.decompress(code);
        if (self.events.signal) self.events.signal(code,handler.remote);
        break;
      case Command.PS_STUN:
        // Kill an agent (or all)
        break;
        
      // Control Mesages
      case Command.STD_STATUS:
        // Send agent and node status
        status = {}; // TODO
        buf=Buf.Buffer();
        Buf.buf_put_string(buf,JSON.stringify(status));           
        self.amp.reply(Command.STD_MONITOR,  // Hack: Reply to STD_STATUS request
                       buf, 
                       self.amp.mode & Amp.AMMode.AMO_MULTICAST? msg.remote:undefined);        
        break;
      case Command.STD_INFO:
        // Send agent-data
        status = {}; // TODO
        buf=Buf.Buffer();
        Buf.buf_put_string(buf,JSON.stringify(status));           
        self.amp.reply(Command.STD_MONITOR,  // Hack: Reply to STD_INFO request
                       buf, 
                       self.amp.mode & Amp.AMMode.AMO_MULTICAST? msg.remote:undefined);        
        break;
      case Command.STD_MONITOR:
        // Hack: Reply to STD_STATUS/INFO request
        code = JSON.parse(Buf.buf_get_string(handler.buf));
        if (self.callbacks[msg.tid]) {
          self.callbacks[msg.tid](code);
          delete self.callbacks[msg.tid];
        }
        break;
    }

  });
};

physical.prototype.emit = function (event,arg,aux1,aux2) { if (this.events[event]) this.events[event](arg,aux1,aux2)};
physical.prototype.on = function (event,handler) {this.events[event]=handler};
physical.prototype.init = function (callback) { return this.link.init(callback)};
physical.prototype.start = function (callback) {return this.link.start(callback)};
physical.prototype.stop = function () {return this.link.stop()};

var Physical = function (node,dir,options) {
  var obj=new physical(node,dir,options);
  return obj;
}

module.exports.Physical=Physical;

/*************************
** IP UTILS
*************************/
var url2addr=Amp.url2addr;
var addr2url=Amp.addr2url;
var resolve=Amp.resolve;

/*  url = "<name>:<ipport>" | "<ip>:<ipport>" | "<ipport>"
 *  and ipport = (1-65535) | "*"
function url2addr(url,defaultIP) {
  var addr={address:defaultIP||'localhost',proto:'IP',port:undefined},
      parts = url.toString().split(':');
  if (parts.length==1) {
    if (Comp.string.isNumeric(parts[0])) addr.port=Number(parts[0]); // port number
    else if (parts[0].indexOf('-') != -1) addr.port=parts[0]; // port range p0-p1
    else if (parts[0]=='*') addr.port=undefined; // any port
    else addr.address=parts[0];  // ip/url
  } else return {address:parts[0],port:parts[1]=='*'?undefined:Number(parts[1])||parts[1]};
  return addr;
};

function addr2url(addr) {
  return (addr.proto?(addr.proto+'://'):'')+addr.address+':'+(addr.port?addr.port:'*')
};
function resolve (url,defaultIP) {
  var addr=url2addr(url,defaultIP);
  return addr2url(addr) 
}
 */

function addrequal(addr1,addr2) {
  return ipequal(addr1.address,addr2.address) && addr1.port==addr2.port;
}


function ipequal(ip1,ip2) {
  if (ip1==undefined || ip2==undefined) return false;
  else if ((Comp.string.equal(ip1,'localhost') || Comp.string.equal(ip1,'127.0.0.1')) &&
           (Comp.string.equal(ip2,'localhost') || Comp.string.equal(ip2,'127.0.0.1'))) return true;
  else return ip1==ip2;
}


/***********************************************
 * IP Router using AMP/UDP/TCP/HTTP links
 * Entry point for move and send operations DIR.IP
 ***********************************************
 */

function iprouter() {
  this.routingTable={};
  this.nodeTable={};
  this.links=[];
}
// Add route and link to be used for the route (and optional remote node id)
iprouter.prototype.add = function (to,link,node) {
  to=resolve(to);
  if (options.verbose) Aios.log('[IP] iprouter: add route '+addr2url(link.ip)+' -> '+to+(node?'#'+node:''));
  this.routingTable[to]=link;
  this.nodeTable[to]=node;
}

// Add link device
iprouter.prototype.addLink = function (link) {
  if (!link.ip) link.ip='*';
  if (options.verbose) Aios.log('[IP] iprouter: add link '+addr2url(link.ip));
  this.links.push(link);
}

// Connect to a remote endpoint
iprouter.prototype.connect = function (to,key) {
  var link,p,addr;
  to=resolve(to);
  addr=url2addr(to);
  // Search for an unconnected port!?
  for(p in this.links) {
    if (this.links[p].status(to)) return;
    if (!(this.links[p].mode&Amp.AMMode.AMO_MULTICAST) && this.links[p].status()) continue;
    if (addr.proto && this.links[p].ip && this.links[p].ip.proto != addr.proto) continue;
    link=this.links[p]; 
    break;
  }
  if (link && link.connect) {
    link.connect(to,key);
  }
}

//
iprouter.prototype.count = function (dest) {
  var res=0;
  for(var i in this.links) {
    res += this.links[i].count();
  }
  return res;
}

// Remove route
iprouter.prototype.delete = function (to) {
  to=resolve(to);
  if (this.routingTable[to]) {
    if (options.verbose) Aios.log('[IP] iprouter: remove route '+addr2url(this.routingTable[to].ip)+ ' -> ' + to);
    delete this.routingTable[to];
    delete this.nodeTable[to];
  }
}

// Disconnect a remote endpoint
iprouter.prototype.disconnect = function (to) {
  // Search for a connected port!
  to=resolve(to);
  if (this.routingTable[to] && this.routingTable[to].status(to)) {
    this.routingTable[to].disconnect(to);
  }
}

/** Lookup a IP:PORT address pair of a nodeid OR contact a broker to get reachable 
 *  nodeid-IP address pairs 
 *
 */
iprouter.prototype.lookup = function (nodeid,callback) {
  var p,result=[],n=0;
  // Broker lookup with a pattern like /domain/*  (DIR.PATH)
  if (nodeid.indexOf('*')!=-1) {
    // TODO
    for (p in this.links) {
      if (this.links[p].lookup) {
        n++;
        this.links[p].lookup(nodeid,function (_result) {
          if (_result && _result.length) result=result.concat(_result);
          n--;
          if (n==0) callback(result);
        });
      }
    }
  } else for(p in this.nodeTable) { 
    if (this.nodeTable[p] == nodeid && this.routingTable[p]) return p; 
  }
} 


/** Try to find our local IP address. 
 *
 */
iprouter.prototype.ip = function () {
  for(var i in this.links) {
    if (this.links[i].ip) return this.links[i].ip;
  }
} 

/** Reverse lookup: Get the nodeid from an IP:PORT address
*   typeof @ip = string <ip:ipport>
*/
iprouter.prototype.reverse = function (ip) {
  return this.nodeTable[ip];
}



/** Send a message
*
*/

iprouter.prototype.send = function (msg) {
  msg.to=resolve(msg.to);
  if (this.routingTable[msg.to]) {
    this.routingTable[msg.to].send(msg,msg.to);
  } else {
    
  }
}

/** Start all attached devices
*
*/
iprouter.prototype.start = function (callback) {
  var cbl=CBL(callback||function(){});
  this.links.forEach(function (link) {
    cbl.push(function (next) {link.start(next)});
  });
  cbl.start();
}

iprouter.prototype.stats = function () {
  return {
    links:Object.keys(this.routingTable).length
  }
}

// Check status of link in given direction  (or any direction dest==undefined)
// OR return all current registered routes string []  (dest=='*')!
// OR return all current connected nodes   string []  (dest=='%')!
// OR return all current registered links (ip) string [] (dest=='$')!
iprouter.prototype.status = function (dest) {
  var res,p;
  if (dest==undefined) {
    // Any registered routes?
    for(p in this.routingTable) { if (this.routingTable[p]) return true }
  } else if (dest=='*') {
    res=[];
    for(p in this.routingTable) { if (this.routingTable[p]) res.push(p) }
    return res;
  } else if (dest=='%') {
    res=[];
    for(p in this.nodeTable) { 
      if (this.nodeTable[p] && this.routingTable[p]) res.push(this.nodeTable[p]); 
    }
    return res;
  } else {
    dest=resolve(dest);
    if (this.routingTable[dest])
      return this.routingTable[dest].status(dest);
    else
      return false;
  }
  return false;
}

// Stop all attached devices
iprouter.prototype.stop = function (callback) {
  var cbl=CBL(callback||function(){});
  this.links.forEach(function (link) {
    cbl.push(function (next) {link.stop(next)});
  });
  cbl.start();
}


module.exports.iprouter=iprouter;

module.exports.Command=Command
module.exports.Status=Status

module.exports.url2addr=url2addr;
module.exports.addr2url=addr2url;
};
BundleModuleCode['os/lz-string']=function (module,exports,global,process){
// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.4
var LZString = (function() {

// private property
var f = String.fromCharCode;
var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
var baseReverseDic = {};

function getBaseValue(alphabet, character) {
  if (!baseReverseDic[alphabet]) {
    baseReverseDic[alphabet] = {};
    for (var i=0 ; i<alphabet.length ; i++) {
      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
    }
  }
  return baseReverseDic[alphabet][character];
}

var LZString = {
  compressToBase64 : function (input) {
    if (input == null) return "";
    var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
    switch (res.length % 4) { // To produce valid Base64
    default: // When could this happen ?
    case 0 : return res;
    case 1 : return res+"===";
    case 2 : return res+"==";
    case 3 : return res+"=";
    }
  },

  decompressFromBase64 : function (input) {
    if (input == null) return "";
    if (input == "") return null;
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
  },

  compressToUTF16 : function (input) {
    if (input == null) return "";
    return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
  },

  decompressFromUTF16: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
  },

  //compress into uint8array (UCS-2 big endian format)
  compressToUint8Array: function (uncompressed) {
    var compressed = LZString.compress(uncompressed);
    var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

    for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
      var current_value = compressed.charCodeAt(i);
      buf[i*2] = current_value >>> 8;
      buf[i*2+1] = current_value % 256;
    }
    return buf;
  },

  //decompress from uint8array (UCS-2 big endian format)
  decompressFromUint8Array:function (compressed) {
    if (compressed===null || compressed===undefined){
        return LZString.decompress(compressed);
    } else {
        var buf=new Array(compressed.length/2); // 2 bytes per character
        for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
          buf[i]=compressed[i*2]*256+compressed[i*2+1];
        }

        var result = [];
        buf.forEach(function (c) {
          result.push(f(c));
        });
        return LZString.decompress(result.join(''));

    }

  },


  //compress into a string that is already URI encoded
  compressToEncodedURIComponent: function (input) {
    if (input == null) return "";
    return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
  },

  //decompress from an output of compressToEncodedURIComponent
  decompressFromEncodedURIComponent:function (input) {
    if (input == null) return "";
    if (input == "") return null;
    input = input.replace(/ /g, "+");
    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
  },

  compress: function (uncompressed) {
    return LZString._compress(uncompressed, 16, function(a){return f(a);});
  },
  _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
    if (uncompressed == null) return "";
    var i, value,
        context_dictionary= {},
        context_dictionaryToCreate= {},
        context_c="",
        context_wc="",
        context_w="",
        context_enlargeIn= 2, // Compensate for the first entry which should not count
        context_dictSize= 3,
        context_numBits= 2,
        context_data=[],
        context_data_val=0,
        context_data_position=0,
        ii;

    for (ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii);
      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
        context_dictionary[context_c] = context_dictSize++;
        context_dictionaryToCreate[context_c] = true;
      }

      context_wc = context_w + context_c;
      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
        context_w = context_wc;
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
          if (context_w.charCodeAt(0)<256) {
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<8 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          } else {
            value = 1;
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position ==bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (i=0 ; i<16 ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }


        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        // Add wc to the dictionary.
        context_dictionary[context_wc] = context_dictSize++;
        context_w = String(context_c);
      }
    }

    // Output the code for w.
    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
        if (context_w.charCodeAt(0)<256) {
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<8 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        } else {
          value = 1;
          for (i=0 ; i<context_numBits ; i++) {
            context_data_val = (context_data_val << 1) | value;
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = 0;
          }
          value = context_w.charCodeAt(0);
          for (i=0 ; i<16 ; i++) {
            context_data_val = (context_data_val << 1) | (value&1);
            if (context_data_position == bitsPerChar-1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
        }
        context_enlargeIn--;
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
        delete context_dictionaryToCreate[context_w];
      } else {
        value = context_dictionary[context_w];
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position == bitsPerChar-1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }


      }
      context_enlargeIn--;
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits);
        context_numBits++;
      }
    }

    // Mark the end of the stream
    value = 2;
    for (i=0 ; i<context_numBits ; i++) {
      context_data_val = (context_data_val << 1) | (value&1);
      if (context_data_position == bitsPerChar-1) {
        context_data_position = 0;
        context_data.push(getCharFromInt(context_data_val));
        context_data_val = 0;
      } else {
        context_data_position++;
      }
      value = value >> 1;
    }

    // Flush the last char
    while (true) {
      context_data_val = (context_data_val << 1);
      if (context_data_position == bitsPerChar-1) {
        context_data.push(getCharFromInt(context_data_val));
        break;
      }
      else context_data_position++;
    }
    return context_data.join('');
  },

  decompress: function (compressed) {
    if (compressed == null) return "";
    if (compressed == "") return null;
    return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
  },

  _decompress: function (length, resetValue, getNextValue) {
    var dictionary = [],
        next,
        enlargeIn = 4,
        dictSize = 4,
        numBits = 3,
        entry = "",
        result = [],
        i,
        w,
        bits, resb, maxpower, power,
        c,
        data = {val:getNextValue(0), position:resetValue, index:1};

    for (i = 0; i < 3; i += 1) {
      dictionary[i] = i;
    }

    bits = 0;
    maxpower = Math.pow(2,2);
    power=1;
    while (power!=maxpower) {
      resb = data.val & data.position;
      data.position >>= 1;
      if (data.position == 0) {
        data.position = resetValue;
        data.val = getNextValue(data.index++);
      }
      bits |= (resb>0 ? 1 : 0) * power;
      power <<= 1;
    }

    switch (next = bits) {
      case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
        c = f(bits);
        break;
      case 2:
        return "";
    }
    dictionary[3] = c;
    w = c;
    result.push(c);
    while (true) {
      if (data.index > length) {
        return "";
      }

      bits = 0;
      maxpower = Math.pow(2,numBits);
      power=1;
      while (power!=maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position == 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (c = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2,8);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2,16);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }
          dictionary[dictSize++] = f(bits);
          c = dictSize-1;
          enlargeIn--;
          break;
        case 2:
          return result.join('');
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

      if (dictionary[c]) {
        entry = dictionary[c];
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0);
        } else {
          return null;
        }
      }
      result.push(entry);

      // Add w+entry[0] to the dictionary.
      dictionary[dictSize++] = w + entry.charAt(0);
      enlargeIn--;

      w = entry;

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits);
        numBits++;
      }

    }
  }
};
  return LZString;
})();

if (typeof define === 'function' && define.amd) {
  define(function () { return LZString; });
} else if( typeof module !== 'undefined' && module != null ) {
  module.exports = LZString
}
};
BundleModuleCode['dos/buf']=function (module,exports,global,process){
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
};
BundleModuleCode['dos/network']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2006-2018 bLAB
 **    $CREATED:     3-5-15 by sbosse.
 **    $VERSION:     1.2.6
 **
 **    $INFO:
 **
 **  DOS: Networking, Commands, Status/Error codes, ..
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
var Perv =Comp.pervasives;
var Des48 = Require('dos/des48');
var Base64 = Require('os/base64');
var Rand = Comp.random;
var Fs = Require('fs');

//var xmldoc = Require('xmldoc');


function pad(str,size) {
    while (str.length < (size || 2)) {str = "0" + str;}
    return str;
}


/** Direction
 *
var Direction = {
    NORTH:1,
    WEST:2,
    EAST:3,
    SOUTH:4,
    ORIGIN:5,
    tostring:function (i) {
        switch (i) {
            case 1: return 'NORTH';
            case 2: return 'WEST';
            case 3: return 'EAST';
            case 4: return 'SOUTH';
            case 5: return 'ORIGIN';
            default: return 'Direction?';
        }
    }
};
*/


// Standard Object Service
var STD_FIRST_COM = 1000;
var STD_LAST_COM = 1999;
var STD_FIRST_ERR = (-STD_FIRST_COM);
var STD_LAST_ERR = (-STD_LAST_COM);

// File Server
var AFS_FIRST_COM = 2000;
var AFS_LAST_COM = 2099;
var AFS_FIRST_ERR = (-AFS_FIRST_COM);
var AFS_LAST_ERR = (-AFS_LAST_COM);
var AFS_REQBUFSZ = 1024*32;


// Directory and Name Server
var DNS_FIRST_COM = 2100;
var DNS_LAST_COM = 2199;
var DNS_FIRST_ERR = (-DNS_FIRST_COM);
var DNS_LAST_ERR = (-DNS_LAST_COM);
var DNS_MAXCOLUMNS = 4;

// System Process Server (incl. Agent Platform Manager)
var PS_FIRST_COM = 2200;
var PS_LAST_COM = 2299;
var PS_FIRST_ERR = (-PS_FIRST_COM);
var PS_LAST_ERR = (-PS_LAST_COM);

// Broker Server
var BR_FIRST_COM = 2300;
var BR_LAST_COM = 2399;
var BR_FIRST_ERR = (-BR_FIRST_COM);
var BR_LAST_ERR = (-BR_LAST_COM);
/** RPC Status
 *
 * @enum {number}
 */
var Status = {
    STD_OK:0,
    STD_CAPBAD      :   STD_FIRST_ERR,
    STD_COMBAD      :  (STD_FIRST_ERR-1),
    STD_ARGBAD      :  (STD_FIRST_ERR-2),
    STD_NOTNOW      :  (STD_FIRST_ERR-3),
    STD_NOSPACE     :  (STD_FIRST_ERR-4),
    STD_DENIED      :  (STD_FIRST_ERR-5),
    STD_NOMEM       :  (STD_FIRST_ERR-6),
    STD_EXISTS      :  (STD_FIRST_ERR-7),
    STD_NOTFOUND    :  (STD_FIRST_ERR-8),
    STD_SYSERR      :  (STD_FIRST_ERR-9),
    STD_INTR        :  (STD_FIRST_ERR-10),
    STD_OVERFLOW    :  (STD_FIRST_ERR-11),
    STD_WRITEPROT   :  (STD_FIRST_ERR-12),
    STD_NOMEDIUM    :  (STD_FIRST_ERR-13),
    STD_IOERR       :  (STD_FIRST_ERR-14),
    STD_WRONGSRV    :  (STD_FIRST_ERR-15),
    STD_OBJBAD      :  (STD_FIRST_ERR-16),
    STD_UNKNOWN     :  (STD_FIRST_ERR-17),
    DNS_UNAVAIL      : (DNS_FIRST_ERR -1),
    DNS_NOTEMPTY     : (DNS_FIRST_ERR -2),
    DNS_UNREACH      : (DNS_FIRST_ERR -3),
    DNS_CLASH        : (DNS_FIRST_ERR -4),
    RPC_FAILURE     : -1,
    BUF_OVERFLOW    : -2,
    print: function(stat) {
        switch(stat) {
            case Status.STD_OK          :  return 'STD_OK';
            case Status.STD_CAPBAD      :  return 'STD_CAPBAD';
            case Status.STD_COMBAD      :  return 'STD_COMBAD';
            case Status.STD_ARGBAD      :  return 'STD_ARGBAD';
            case Status.STD_NOTNOW      :  return 'STD_NOTNOW';
            case Status.STD_NOSPACE     :  return 'STD_NOSPACE';
            case Status.STD_DENIED      :  return 'STD_DENIED';
            case Status.STD_NOMEM       :  return 'STD_NOMEM';
            case Status.STD_EXISTS      :  return 'STD_EXISTS';
            case Status.STD_NOTFOUND    :  return 'STD_NOTFOUND';
            case Status.STD_SYSERR      :  return 'STD_SYSERR';
            case Status.STD_INTR        :  return 'STD_INTR';
            case Status.STD_OVERFLOW    :  return 'STD_OVERFLOW';
            case Status.STD_WRITEPROT   :  return 'STD_WRITEPROT';
            case Status.STD_NOMEDIUM    :  return 'STD_NOMEDIUM';
            case Status.STD_IOERR       :  return 'STD_IOERR';
            case Status.STD_WRONGSRV    :  return 'STD_WRONGSRV';
            case Status.STD_OBJBAD      :  return 'STD_OBJBAD';
            case Status.STD_UNKNOWN     :  return 'STD_UNKNOWN';
            case Status.DNS_UNAVAIL     :  return 'DNS_UNAVAIL';
            case Status.DNS_NOTEMPTY    :  return 'DNS_NOTEMPTY';
            case Status.DNS_UNREACH     :  return 'DNS_UNREACH';
            case Status.DNS_CLASH       :  return 'DNS_CLASH';
            case Status.RPC_FAILURE     :  return 'RPC_FAILURE';
            case Status.BUF_OVERFLOW     :  return 'BUF_OVERFLOW';
            default          :     return '"'+stat+'"';
        }
    }
};

/** RPC Command
 *
 * @enum {number}
 */

var Command = {
    /*
    ** Standard Commands
     */
    STD_MONITOR     : STD_FIRST_COM,
    STD_AGE         : (STD_FIRST_COM+1),
    STD_COPY        : (STD_FIRST_COM + 2),
    STD_DESTROY     : (STD_FIRST_COM + 3),
    STD_INFO        : (STD_FIRST_COM + 4),
    STD_RESTRICT    : (STD_FIRST_COM + 5),
    STD_STATUS      : (STD_FIRST_COM + 6),
    STD_TOUCH       : (STD_FIRST_COM + 7),
    STD_GETPARAMS   : (STD_FIRST_COM + 8),
    STD_SETPARAMS   : (STD_FIRST_COM + 9),
    STD_NTOUCH      : (STD_FIRST_COM + 10),
    STD_EXIT        : (STD_FIRST_COM + 11),
    STD_RIGHTS      : (STD_FIRST_COM + 12),
    STD_EXEC        : (STD_FIRST_COM + 13),
    STD_LOCATION    : (STD_FIRST_COM + 20),
    STD_LABEL       : (STD_FIRST_COM + 21),

    /*
    ** AFC Commands
     */
    AFS_CREATE          : (AFS_FIRST_COM + 1),
    AFS_DELETE          : (AFS_FIRST_COM + 2),
    AFS_FSCK            : (AFS_FIRST_COM + 3),
    AFS_INSERT          : (AFS_FIRST_COM + 4),
    AFS_MODIFY          : (AFS_FIRST_COM + 5),
    AFS_READ            : (AFS_FIRST_COM + 6),
    AFS_SIZE            : (AFS_FIRST_COM + 7),
    AFS_DISK_COMPACT    : (AFS_FIRST_COM + 8),
    AFS_SYNC            : (AFS_FIRST_COM + 9),
    AFS_DESTROY         : (AFS_FIRST_COM + 10),

    /*
    ** DNS Commands
     */

    DNS_CREATE       : (DNS_FIRST_COM),
    DNS_DISCARD      : (DNS_FIRST_COM + 1),
    DNS_LIST         : (DNS_FIRST_COM + 2),
    DNS_APPEND       : (DNS_FIRST_COM + 3),
    DNS_CHMOD        : (DNS_FIRST_COM + 4),
    DNS_DELETE       : (DNS_FIRST_COM + 5),
    DNS_LOOKUP       : (DNS_FIRST_COM + 6),
    DNS_SETLOOKUP    : (DNS_FIRST_COM + 7),
    DNS_INSTALL      : (DNS_FIRST_COM + 8),
    DNS_REPLACE      : (DNS_FIRST_COM + 10),
    DNS_GETMASKS     : (DNS_FIRST_COM + 11),
    DNS_GETSEQNR     : (DNS_FIRST_COM + 12),
    DNS_RENAME       : (DNS_FIRST_COM + 13),
    DNS_GETROOT      : (DNS_FIRST_COM + 14),
    DNS_GETDEFAFS    : (DNS_FIRST_COM + 15),

    PS_STUN         : (PS_FIRST_COM),     // Kill a process/ create a snapshot
    PS_MIGRATE      : (PS_FIRST_COM+1),   // Execute a process from a snapshot after migration (->next+)
    PS_EXEC         : (PS_FIRST_COM+2),   // Execute a process from a snapshot (->next)
    PS_WRITE        : (PS_FIRST_COM+4),   // Store a process class template
    PS_READ         : (PS_FIRST_COM+5),   // Get a process class template
    PS_CREATE       : (PS_FIRST_COM+6),   // Create a process from a template and execute
    PS_FORK         : (PS_FIRST_COM+7),   // Fork a process from a running process
    PS_SIGNAL       : (PS_FIRST_COM+8),   // Send a signal to a process

    BR_CONNECT      : (BR_FIRST_COM),
    BR_DISCONN      : (BR_FIRST_COM+1),

    print: function(cmd) {
        switch(cmd) {
            case Command.STD_MONITOR     : return 'STD_MONITOR';
            case Command.STD_AGE         : return 'STD_AGE';
            case Command.STD_COPY        : return 'STD_COPY';
            case Command.STD_DESTROY     : return 'STD_DESTROY';
            case Command.STD_INFO        : return 'STD_INFO';
            case Command.STD_RESTRICT    : return 'STD_RESTRICT';
            case Command.STD_STATUS      : return 'STD_STATUS';
            case Command.STD_TOUCH       : return 'STD_TOUCH';
            case Command.STD_GETPARAMS   : return 'STD_GETPARAMS';
            case Command.STD_SETPARAMS   : return 'STD_SETPARAMS';
            case Command.STD_NTOUCH      : return 'STD_NTOUCH';
            case Command.STD_EXIT        : return 'STD_EXIT';
            case Command.STD_RIGHTS      : return 'STD_RIGHTS';
            case Command.STD_EXEC        : return 'STD_EXEC';
            case Command.STD_LOCATION    : return 'STD_LOCATION';
            case Command.STD_LABEL       : return 'STD_LABEL';
            case Command.AFS_CREATE      : return 'AFS_CREATE';
            case Command.AFS_DELETE      : return 'AFS_DELETE';
            case Command.AFS_FSCK        : return 'AFS_FSCK';
            case Command.AFS_INSERT      : return 'AFS_INSERT';
            case Command.AFS_MODIFY      : return 'AFS_MODIFY';
            case Command.AFS_READ        : return 'AFS_READ';
            case Command.AFS_SIZE        : return 'AFS_SIZE';
            case Command.AFS_DISK_COMPACT : return 'AFS_DISK_COMPACT';
            case Command.AFS_SYNC        : return 'AFS_SYNC';
            case Command.AFS_DESTROY     : return 'AFS_DESTROY';
            case Command.DNS_CREATE      : return 'DNS_CREATE';
            case Command.DNS_DISCARD     : return 'DNS_DISCARD';
            case Command.DNS_LIST        : return 'DNS_LIST';
            case Command.DNS_APPEND      : return 'DNS_APPEND';
            case Command.DNS_CHMOD       : return 'DNS_CHMOD';
            case Command.DNS_DELETE      : return 'DNS_DELETE';
            case Command.DNS_LOOKUP      : return 'DNS_LOOKUP';
            case Command.DNS_SETLOOKUP   : return 'DNS_SETLOOKUP';
            case Command.DNS_INSTALL     : return 'DNS_INSTALL';
            case Command.DNS_REPLACE     : return 'DNS_REPLACE';
            case Command.DNS_GETMASKS    : return 'DNS_GETMASKS';
            case Command.DNS_GETSEQNR    : return 'DNS_GETSEQNR';
            case Command.DNS_RENAME      : return 'DNS_RENAME';
            case Command.DNS_GETROOT     : return 'DNS_GETRROT';
            case Command.DNS_GETDEFAFS   : return 'DNS_GETDEFAFS';
            case Command.PS_STUN         : return 'PS_STUN';
            case Command.PS_EXEC         : return 'PS_EXEC';
            case Command.PS_MIGRATE      : return 'PS_MIGRATE';
            case Command.PS_READ         : return 'PS_READ';
            case Command.PS_WRITE        : return 'PS_WRITE';
            case Command.PS_CREATE       : return 'PS_CREATE';
            case Command.PS_FORK         : return 'PS_FORK';
            case Command.PS_SIGNAL       : return 'PS_SIGNAL';
            case Command.BR_CONNECT      : return 'BR_CONNECT';
            case Command.BR_DISCONN      : return 'BR_DISCONN';
            default: return '"'+cmd+'"';
        }


    }
};

var PORT_SIZE = 6;
var PRIV_SIZE = 4+PORT_SIZE;
var CAP_SIZE = 16;

/** Object Rights
 *
 * @enum {number}
 */
var Rights = {
    AFS_RGT_READ        : 0x1,
    AFS_RGT_CREATE      : 0x2,
    AFS_RGT_MODIFY      : 0x4,
    AFS_RGT_DESTROY     : 0x8,
    AFS_RGT_ADMIN       : 0x80,
    
    DNS_COLMASK     : ((1 << DNS_MAXCOLUMNS) - 1),  // Rights to access specific columns of a directory row, one bit, one column.
    DNS_RGT_COLALL  : ((1 << DNS_MAXCOLUMNS) - 1),
    DNS_RGT_COL1    : 0x01,
    DNS_RGT_OWNER   : 0x01,
    DNS_RGT_COL2    : 0x02,
    DNS_RGT_GROUP   : 0x02,
    DNS_RGT_COL3    : 0x04,
    DNS_RGT_OTHERS  : 0x04,
    DNS_RGT_COL4    : 0x08,
    DNS_RGT_READ    : 0x10,
    DNS_RGT_CREATE  : 0x20,
    DNS_RGT_MODIFY  : 0x40,
    DNS_RGT_DELETE  : 0x80,

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
    NEG_LEVEL       : 0x40,
    
    PRV_ALL_RIGHTS  : 0xff

};



var DEF_RPC_MAX_HOP = 4;

var priv2pub_cache = [];

/**
 *
 * @param {number []} [port_vals]
 * @returns {string}
 */
var port = function (port_vals) {
    if (port_vals==undefined) port_vals=[0,0,0,0,0,0];
    var port='';
    for(var i = 0; i< PORT_SIZE;i++) {
        port=port+Perv.char_of_int(port_vals[i]);
    }
    return port;

};
/**
 *
 * @param {number} [obj]
 * @param {number} [rights]
 * @param {port} [rand]
 * @constructor
 */
var privat = function (obj,rights,rand) {
    if (obj==undefined) {
        // Create empty private field
        this.prv_obj=0;
        this.prv_rights=0;
        this.prv_rand=port();
    } else {
        this.prv_obj = obj;               // Integer
        this.prv_rights = rights;         // Integer
        this.prv_rand = rand;             // Port=string
    }
};

/**
 *
 * @param {port} [cap_port]
 * @param {privat} [cap_priv]
 * @constructor
 */
var capability = function(cap_port, cap_priv) {
    if (cap_port==undefined) {
        // Create empty capability
        this.cap_port = port();
        this.cap_priv = new privat();
    } else {
        this.cap_port = cap_port;       // Port=string
        if (cap_priv==undefined)
            this.cap_priv = new privat();
        else
            this.cap_priv = cap_priv;    // Private
    }
};

/*
 ** RPC communication is XML based using the HTTP interface.
 ** RPC communication is synchronous, hence a callback
 ** function is used to handle the reply (acknowledge).
 */
/**
 *
 * @param {port} [h_port]
 * @param {privat} [h_priv]
 * @param {Command} [h_command]
 * @param {(Status.STD_OK|*)} [h_status]
 * @constructor
 */
var header = function(h_port,h_priv,h_command,h_status) {
    if (h_port==undefined) {
        // Create empty header
        this.h_port = port();
        this.h_priv = new privat();
        this.h_command = undefined;
        this.h_status = undefined;
    } else {
        this.h_port = h_port;
        this.h_priv = h_priv;
        this.h_command = h_command;
        this.h_status = h_status;
    }
};

/**
 *
 * @param {number} [obj]
 * @param {number} [rights]
 * @param {port} [rand]
 * @returns {privat}
 */
function Private(obj,rights,rand) {
    var _obj = new privat(obj,rights,rand);
    Object.preventExtensions(_obj);
    return _obj;
}
/**
 *
 * @param {port} [cap_port]
 * @param {privat} [cap_priv]
 * @returns {capability}
 */
function Capability (cap_port, cap_priv) {
    var obj = new capability(cap_port, cap_priv);
    Object.preventExtensions(obj);
    return obj;
}
/**
 *
 * @param {port} [h_port]
 * @param {privat} [h_priv]
 * @param {Command} [h_command]
 * @param {(Status.STD_OK|*)} [h_status]
 * @returns {header}
 */

function Header(h_port,h_priv,h_command,h_status) {
    var obj = new header(h_port,h_priv,h_command,h_status);
    Object.preventExtensions(obj);
    return obj;
}

/*
** Hash table of all locally created unique ports.
 */
var uniqports=[];


/**
 *
 */
var Net = {
    // Direction:Direction,
    PORT_SIZE:PORT_SIZE,
    PRIV_SIZE:PRIV_SIZE,

    AFS_REQBUFSZ:AFS_REQBUFSZ,
    CAP_SIZE:CAP_SIZE,
    DNS_MAXCOLUMNS:DNS_MAXCOLUMNS,
    TIMEOUT:5000,
    DEF_RPC_MAX_HOP:DEF_RPC_MAX_HOP,

    Status:Status,
    Command:Command,
    Rights:Rights,

    Private:Private,
    Capability: Capability,
    Header: Header,
    Port: port,

    /**
     * @type {port}
     */
    nilport: port(),
    nilpriv: Private(0,0,this.nilport),
    nilcap: Capability(this.nilport,this.nilpriv),

    /*
     ** Utils to get and set single bytes of a port
     */
    get_portbyte: function(port,i) {
        return Perv.int_of_char(String.get(port,i))
    },
    set_portbyte: function(port,i,byte) {
        return String.set(port, i, (Perv.char_of_int(byte)));
    },
    /*
     * Return a unique key of a capability that can be used for hash tables
     */
    key: function (cap) {
        return cap.cap_port+
         cap.cap_priv.prv_obj+
         cap.cap_priv.prv_rights+
         cap.cap_priv.prv_rand;
    },

    /*
     ** Encryption function
     */
    one_way: function (port) {
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
                if ((this.get_portbyte(port, (j >> 3)) & (1 << (j & 7))) != 0)
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
            pubport=this.set_portbyte(pubport, i, pbyte);
        }

        return pubport;
    },
    /*
     ** Check whether the required rights [R1;R2;..] are
     ** present in the rights field rg. Return a boolean value.
     */
    rights_req : function(rights,required) {
        var all=true;
        Array.iter(required,function(rq) {
            if (rq & rights == 0) all = false;
        });
        return all;
    },
    port_cmp: function(port1,port2) {
        var i;
        var eq=true;
        for(i=0;i<PORT_SIZE;i++) { if (String.get(port1,i)!=String.get(port2,i)) eq=false;}
        return eq;},
    port_copy: function(port) {
        return String.copy(port);
    },
    /*
     ** Derive a port from a string.
     */
    port_name: function(name){
        var p = String.make(PORT_SIZE,'\0');
        var i;
        var n = name.length;

        for (i = 0; i < n;i++) {
            var k = i % PORT_SIZE;
            p = String.set(p, k, Perv.char_of_int(
                (Perv.int_of_char(String.get(p, k)) +
                 Perv.int_of_char(String.get(name, i)))
                                 & 0xff));
        }
        return p;
    },
    port_to_str: function(port,compact) {
        var i,str='';
        if (port) {
            for (i = 0; i < PORT_SIZE; i++) {
                var num = Perv.int_of_char(String.get(port, i));
                if (!compact && i > 0) str = str + ':';
                str = str + pad(num.toString(16).toUpperCase(), 2);
            }
        } else str='undefined';
        return str;
    },
    port_of_str: function (str,compact) {
        var tokens=str.split(':'),i,port='';
        for (i=0;i<PORT_SIZE;i++) {
            var num='0x'+tokens[i];
            port=port+Perv.char_of_int(parseInt(num,16));
        }
        return port;
    },
    /** String parameter to port conversion including "undefined" case.
     *
     * @param str
     * @returns {string}
     */
    port_of_param: function (str) {
        if (str==undefined ||
            String.equal(str,'undefined')) return undefined;
        var tokens=str.split(':');
        var i;
        var port='';
        for (i=0;i<PORT_SIZE;i++) {
            var num='0x'+tokens[i];
            port=port+Perv.char_of_int(parseInt(num,16));
        }
        return port;
    },
    prv2pub: function(port) {
        var putport;
        if (priv2pub_cache[port] == undefined) {
            putport=this.one_way(port);
            priv2pub_cache[port] = putport;
        } else putport = priv2pub_cache[port];
        return putport;
    },
    /**
     ** Decode a private structure
     *
     * @param {privat} prv
     * @param {port} rand
     * @returns {boolean}
     */
    prv_decode: function(prv,rand) {
        if (prv.prv_rights == Rights.PRV_ALL_RIGHTS)
            return this.port_cmp(prv.prv_rand,rand);
        else {
            var tmp_port = this.port_copy(rand),
                pt0 = this.get_portbyte(tmp_port, 0),
                pr0 = prv.prv_rights;
            tmp_port = this.set_portbyte(tmp_port, 0, (pt0 ^ pr0));
            tmp_port = this.one_way(tmp_port);
            return this.port_cmp(prv.prv_rand, tmp_port)
        }
    },
    /*
     ** Encode a private part from the object number, the rights field
     ** and the random port.
     ** Returns the created private structure.
     */
    prv_encode: function(obj,rights,rand) {
        var tmp_port = this.port_copy(rand);

        var r1 = rights;
        var rmask = Rights.PRV_ALL_RIGHTS;

        if (rights == Rights.PRV_ALL_RIGHTS)
            return this.Private(obj,r1 & rmask,tmp_port);
        else {
            var pt0 = this.get_portbyte(tmp_port,0);
            tmp_port = this.set_portbyte(tmp_port,0,pt0 ^ r1);
            tmp_port = this.one_way(tmp_port);
            return this.Private(obj,r1 & rmask,tmp_port)
        }
    },
    /*
     ** Return the private object number form a private structure
     */
    prv_number: function(prv) {
        return prv.prv_obj;
    },
    /*
     ** Return the private rights field.
     */
    prv_rights: function(prv) {
        return prv.prv_rights & Rights.PRV_ALL_RIGHTS;
    },

    /*
     ** Check the private rights field: 1. Validation, 2: Required rights.
     */
    prv_rights_check: function(prv,rand,required) {
      if (!Net.prv_decode(prv,rand)) return false;
      return (prv.prv_rights & required)==required;
    },

    /** Restrict a private field (rights&mask) of a capability.
     *
     * @param {privat} priv
     * @param {number} mask rights restriction mask
     * @param {port} random secret server random port
     */
    restrict: function(priv,mask,random) {
        var pr =
            this.prv_encode(priv.prv_obj,
                            priv.prv_rights & mask,
                            random);
        return pr;
    },
    /*
     * Return a new random port.
     *
     * Warning: the quality of the random ports are strongly
     * related to JSVMs underlying random generator. Be warned!
     *
     * @returns {port}
     */
    uniqport: function() {
        var port = String.create (PORT_SIZE);
        var exists = true;
        while (exists) {
            var i;
            for (i = 0; i <= (PORT_SIZE - 1); i++) {

                port = String.set(port, i, (Perv.char_of_int(Rand.int(256))));
            }
            if (uniqports[port]==undefined)
            {
                uniqports[port]=port;
                exists=false;
            }
        }
        return port;
    },
    /** Write a capability to a file.
     *
     * @param {capability} cap
     * @param {string} path
     */
    cap_to_file: function(cap,path) {
        try {
            Fs.writeFileSync(path, this.Print.capability(cap));
        } catch(e) {
        }
    },
    /** Read a capability from a file.
     *
     * @param {string} path
     * @returns {capability|undefined}
     */
    cap_of_file: function(path) {
        try {
            var cap=undefined;
            var data = Fs.readFileSync(path);
            var cp = this.Parse.capability(data.toString(), 0);
            cap = cp.cap;
            return cap;
        } catch(e) {
            return undefined;
        }
    },

    Position: function (x,y) {
        this.x = x;
        this.y = y;
    },
    Copy: {
        /**
         *
         * @param src
         * @returns {port}
         */
        port: function(src) {
            // !!!!
            return String.copy(src);
        },
        /**
         *
         * @param src
         * @param dst
         * @returns {privat}
         */
        private: function(src,dst) {
            if (dst!=undefined) {
                dst.prv_obj = src.prv_obj;
                dst.prv_rights = src.prv_rights;
                dst.prv_rand = this.port(src.prv_rand);
                return dst;
            } else {
                var dstnew=Private();
                dstnew.prv_obj = src.prv_obj;
                dstnew.prv_rights = src.prv_rights;
                dstnew.prv_rand = this.port(src.prv_rand);
                return dstnew;
            }
        },
        /**
         *
         * @param src
         * @param dst
         * @returns {capability}
         */
        capability: function(src,dst) {
            if (dst!=undefined) {
                dst.cap_port = this.port(src.cap_port);
                this.private(src.cap_priv, dst.cap_priv);
                return dst;
            }
            else {
                var dstnew=Capability();
                dstnew.cap_port = this.port(src.cap_port);
                this.private(src.cap_priv, dstnew.cap_priv);
                return dstnew;
            }
        },
        /**
         *
         * @param src
         * @param dst
         */
        header: function(src,dst) {
            dst.h_port=this.port(src.h_port);
            dst.h_status=src.h_status;
            dst.h_command=src.h_command;
            if (src.h_priv!=undefined) {
                if (dst.h_priv==undefined) {
                    var obj = new privat();
                    Object.preventExtensions(obj);
                    dst.h_priv=obj;
                }
                this.private(src.h_priv,dst.h_priv);
            } else dst.h_priv=undefined;
        }
    },
    Equal: {
        port: function (port1,port2) {
            if (port1==undefined || port2==undefined) return (port1==port2);
            else return String.equal(port1,port2);
        },
        private: function (prv1,prv2) {
            return  (prv1==undefined&&prv2==undefined) ||
                    (prv1.prv_obj==prv2.prv_obj &&
                     prv1.prv_rights==prv2.prv_rights &&
                     this.port(prv1.prv_rand,prv2.prv_rand))
        },
        capability: function(cap1,cap2) {
            return  (cap1==undefined&&cap2==undefined) ||
                    (this.private(cap1.cap_priv,cap2.cap_priv) &&
                     this.port(cap1.cap_port,cap2.cap_port))
        },
        header: function(hdr1,hdr2) {
            return  (hdr1==undefined&&hdr2==undefined) ||
                    (this.private(hdr1.h_priv,hdr1.h_priv) &&
                     this.port(hdr1.h_port,hdr2.h_port) &&
                     hdr1.h_status==hdr2.h_status &&
                     hdr1.h_command==hdr2.h_command)

        }
    },

    /**
     * @typedef {{
     * port:function(string,number):{port:port,pos:number}|undefined,
     * private:function(string,number):{priv:privat,pos:number}|undefined,
     * capability:function(string,number):{cap:capability,pos:number}|undefined
     * }} Parse
     */
    Parse: {
        /**
         *
         * @param str
         * @param pos
         * @returns {{port:port,pos:number}}
         */
        port: function(str,pos) {
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
        },
        /**
         *
         * @param str
         * @param pos
         * @returns {{priv:privat,pos:number}}
         */
        private: function(str,pos) {
            var priv=Private();
            var sv;
            var len=str.length;
            if (pos==undefined) pos=0;
            if (len<(pos+25)) return undefined;
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
            var pp=this.port(str,pos);
            if (pp==undefined) return undefined;
            priv.prv_rand=pp.port;
            pos=pp.pos;
            return {priv:priv,pos:pos};
        },
        /**
         *
         * @param str
         * @param pos
         * @returns {{cap:capability,pos:number}|undefined}
         */
        capability: function(str,pos) {
            var cap=Capability();
            if (pos==undefined) pos=0;
            var pp=this.port(str,pos);
            if (pp==undefined) return undefined;
            cap.cap_port=pp.port;
            pos=pp.pos;
            pp=this.private(str,pos);
            if (pp==undefined) return undefined;
            cap.cap_priv=pp.priv;
            pos=pp.pos;
            return {cap:cap,pos:pos};
        }
    },
    Print: {
        /**
         *
         * @param cap
         * @returns {string}
         */
        capability: function (cap) {
            var str='';
            if (cap==undefined) return 'undefined';
            if (cap.cap_port!=undefined) str='['+this.port(cap.cap_port)+']'; else str = '[]';
            if (cap.cap_priv!=undefined) str=str+'('+this.private(cap.cap_priv)+')'; else str=str+'()';
            return str;
        },
        command: Command.print,
        /**
         *
         * @param hdr
         * @returns {string}
         */
        header: function (hdr) {
            var str='';
            if (hdr==undefined) return 'undefined';
            if (hdr.h_port!=undefined) str='['+this.port(hdr.h_port)+']'; else str = '[]';
            if (hdr.h_command!=undefined) str=str+': '+Command.print(hdr.h_command);
            if (hdr.h_priv!=undefined) str=str+'('+this.private(hdr.h_priv)+')'; else str=str+'()';
            if (hdr.h_status!=undefined) str=str+' ?'+Status.print(hdr.h_status);
            return str;
        },
        /**
         *
         * @param port
         * @returns {string}
         */
        port: function(port) {
            var i;
            var str='';
            if (port!=undefined) {
                for (i = 0; i < PORT_SIZE; i++) {
                    var num = Perv.int_of_char(String.get(port, i));
                    if (i > 0) str = str + ':';
                    str = str + pad(num.toString(16).toUpperCase(), 2);
                }
            } else str='undefined';
            return str;
        },
        /**
         *
         * @param priv
         * @returns {string}
         */
        private: function(priv) {
            var str='';
            if (priv==undefined) return 'undefined';
            str=priv.prv_obj;
            str=str+'('+String.format_hex(priv.prv_rights,2).toUpperCase()+')[';
            str=str+this.port(priv.prv_rand)+']';
            return str;
        },
        status: Status.print
    }
};

module.exports = Net;
};
BundleModuleCode['com/cbl']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     27-11-17 by sbosse.
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 **  JavaScript Callback List
 **
 **  Assume there is a set of non-blocking IO operations with callbacks io1,io2,.., and there is a final
 **  callback function that should be called after all io operations have finished.
 **
 **    $ENDOFINFO
 */

function CBL(callback) {
  if (!(this instanceof CBL)) return new CBL(callback);
  this.schedules=[];
  this.callback=callback;
}

// Next schedule
CBL.prototype.next = function (status) {
  var f=this.schedules.shift();
  // if (f) console.log('next '+f.toString())
  if (f) {
    f(this.next.bind(this),status);
  } else if (this.callback) this.callback(status);
}

// Add next IO callback at the end of the list
CBL.prototype.push = function (f) {
  this.schedules.push(f);
}

// Execute CBL
CBL.prototype.start = function () {
  this.next();
}

// Add next IO callback at the top of the list
CBL.prototype.top = function (f) {
  this.schedules.unshift(f);
}

module.exports=CBL;
};
BundleModuleCode['jam/amp']=function (module,exports,global,process){
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
 **    $CREATED:     09-02-16 by sbosse.
 **    $RCS:         $Id: chan.js,v 1.3 2017/05/27 18:20:36 sbosse Exp $
 **    $VERSION:     1.11.1
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) over UDP/HTTP/devices/streams
 **
 **
 **  New: Fully negotiated IP Multicast Ports (P2N)
 **
 **    $ENDOFINFO
 */

var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');

var COM = Require('jam/ampCOM'),
    AMMode=COM.AMMode,
    AMMessageType=COM.AMMessageType,
    AMState=COM.AMState,
    amp=COM.amp,
    options=COM.options,
    url2addr=COM.url2addr,
    addr2url=COM.addr2url,
    addrequal=COM.addrequal,
    resolve=COM.resolve,
    ipequal=COM.ipequal,
    getNetworkIP=COM.getNetworkIP,
    doUntilAck=COM.doUntilAck;

options.localhost='localhost';
options.version='1.11.1',
options.AMC_MAXLIVE=5,
options.TIMER=500,
options.TRIES=10;
options.REGTMO=1000;

/***********************
** AMP
************************/

var ampMAN = Require('jam/ampMAN');

if (global.TARGET!= 'browser') {
  /******************************* AMP *************************************/

  var ampUDP = Require('jam/ampUDP');
  var ampTCP = Require('jam/ampTCP');
  var ampStream = Require('jam/ampStream');

}  

var ampHTTP = Require('jam/ampHTTP');

  
/** Main AMP constructor
 *  ====================
 *
 */
var Amp = function (options) {
  var obj;
  switch (options.proto) {
    case 'stream':
      obj=new amp.stream(options);
      break;
    case 'http':
      obj=new amp.http(options);
      break;
    case 'tcp':
      obj=new amp.tcp(options);
      break;
    case 'udp':
    default:
      obj=new amp.udp(options);
  }
  return obj;
}

module.exports.current=function (module) { 
  current=module.current; Aios=module; 
  if (ampMAN) ampMAN.current(module);
  if (ampUDP) ampUDP.current(module);
  if (ampHTTP) ampHTTP.current(module);
  if (ampTCP) ampTCP.current(module);
  if (ampStream) ampStream.current(module);
};

module.exports.Amp=Amp;
module.exports.AMMessageType=AMMessageType;
module.exports.AMState=AMState;
module.exports.AMMode=AMMode;
module.exports.url2addr=url2addr;
module.exports.addr2url=addr2url;
module.exports.resolve=resolve;
module.exports.Command=Command
module.exports.Status=Status
module.exports.options=options;
};
BundleModuleCode['jam/ampCOM']=function (module,exports,global,process){
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
 **    $CREATED:     09-02-16 by sbosse.
 **    $RCS:         $Id: chan.js,v 1.3 2017/05/27 18:20:36 sbosse Exp $
 **    $VERSION:     1.14.9
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) - Common Types and Utils
 **
 **
 **
 **    $ENDOFINFO
 */
 
var options = {
  magic: 0x6dab,              // start of an AMP message (16bit)
  peekIP: '134.102.22.124',   // used by getnetworkip, must be an HTTP server
  localhost : 'localhost',    // default name for localhost
}

var Comp = Require('com/compat');
var Dns = Require('dns');

// Channel mode flags
var AMMode = {
    AMO_UNICAST: 1,       // P2P
    AMO_MULTICAST: 2,     // P2N
    AMO_STATIC: 4,        // 
    AMO_BUFFER: 8,        // Transfer buffer data
    AMO_OBJECT: 16,       // Transfer objects instead of buffer data
    AMO_COMPRESS: 32,     // Compress data
    AMO_SERVER: 64,       // This is HTTP server mode
    AMO_CLIENT: 128,      // This is HTTP client mode
    AMO_ONEWAY:256,       // Other side can be reache dw/o link negotiation
    print: function (m) {
      var s='',sep='';
      if (m & AMMode.AMO_UNICAST) s += (sep+'UNI'),sep='|';
      if (m & AMMode.AMO_MULTICAST) s += (sep+'MUL'),sep='|';
      if (m & AMMode.AMO_STATIC) s += (sep+'STA'),sep='|';
      if (m & AMMode.AMO_BUFFER) s += (sep+'BUF'),sep='|';
      if (m & AMMode.AMO_OBJECT) s += (sep+'OBJ'),sep='|';
      if (m & AMMode.AMO_COMPRESS) s += (sep+'ZIP'),sep='|';
      if (m & AMMode.AMO_CLIENT) s += (sep+'CLI'),sep='|';
      if (m & AMMode.AMO_SERVER) s += (sep+'SRV'),sep='|';
      if (m & AMMode.AMO_ONEWAY) s += (sep+'ONE'),sep='|';
      return s;
    }
}

// Message type
var AMMessageType = {
      AMMACK:0,
      AMMPING:1,
      AMMPONG:2,
      AMMLINK:3,
      AMMUNLINK:4,
      AMMRPCHEAD:6, // Header followed by multiple data requests
      AMMRPCDATA:7,
      // Broker Rendezvous support
      AMMCONTROL:8,
      AMMRPC:9,   // Header + data in one message
      AMMCOLLECT:10,   // Collect messages
      AMMRPCHEADDATA:11, // Header with embedded data
 
      // Port Scan for external Run Server - returns AMP info
      AMMSCAN : 12,
      
      print:function(op) {
          switch (op) {
              case AMMessageType.AMMACK: return "AMMACK";
              case AMMessageType.AMMPING: return "AMMPING";
              case AMMessageType.AMMPONG: return "AMMPONG";
              case AMMessageType.AMMLINK: return "AMMLINK";
              case AMMessageType.AMMUNLINK: return "AMMUNLINK";
              case AMMessageType.AMMRPCHEAD: return "AMMRPCHEAD";
              case AMMessageType.AMMRPCHEADDATA: return "AMMRPCHEADDATA";
              case AMMessageType.AMMRPCDATA: return "AMMRPCDATA";
              case AMMessageType.AMMRPC: return "AMMRPC";
              case AMMessageType.AMMCOLLECT: return "AMMCOLLECT";
              // Rendezvous Broker Message
              case AMMessageType.AMMCONTROL: return "AMMCONTROL";
              case AMMessageType.AMMSCAN: return "AMMSCAN";
              default: return "Chan.AMMessageType?";
          }
      }

};

// Channel state
var AMState = {
      AMS_NOTINIT:1,          // AMP Not initialized conenction
      AMS_INIT:2,             // AMP Server started, but not confirmed
      AMS_READY:3,            // AMP Server initialized and confirmed (other end point not connected)
      AMS_NEGOTIATE:4,        // AMP Server intiialized, in negotiation state (other end point not connected)
      AMS_CONNECTED:5,        // AMP Other side connected
      AMS_AWAIT:6,            // AMP waits for event (pairing)
      AMS_NOTCONNECTED:10,    // AMP Other side not connected
      // Optional IP broker service
      AMS_RENDEZVOUS:7,       // Broker IP P2P rendezvous; starting
      AMS_REGISTERED:8,       // Broker IP P2P rendezvous; registered; expecting pairing
      AMS_PAIRING:9,          // Broker IP P2P rendezvous; now pairing; send punches until paired
      AMS_PAIRED:10,          // Broker IP P2P rendezvous; acknowldeged and paired -> NOTCONNECTED
      print:function(op) {
          switch (op) {
              case AMState.AMS_NOTINIT: return "AMS_NOTINIT";
              case AMState.AMS_INIT: return "AMS_INIT";
              case AMState.AMS_READY: return "AMS_READY";
              case AMState.AMS_NEGOTIATE: return "AMS_NEGOTIATE";
              case AMState.AMS_CONNECTED: return "AMS_CONNECTED";
              case AMState.AMS_AWAIT: return "AMS_AWAIT";
              case AMState.AMS_NOTCONNECTED: return "AMS_NOTCONNECTED";
              case AMState.AMS_RENDEZVOUS: return "AMS_RENDEZVOUS";
              case AMState.AMS_REGISTERED: return "AMS_REGISTERED";
              case AMState.AMS_PAIRING: return "AMS_PAIRING";
              case AMState.AMS_PAIRED: return "AMS_PAIRED";
              default: return "Chan.AMState?";
          }
      }
  };

/** Used by AMP messages (msg.cmd,msg.status)
 *
 */

// Standard Object Service
var STD_FIRST_COM = 1000;
var STD_LAST_COM = 1999;
var STD_FIRST_ERR = (-STD_FIRST_COM);
var STD_LAST_ERR = (-STD_LAST_COM);

// System Process Server (incl. Agent Platform Manager)
var PS_FIRST_COM = 2200;
var PS_LAST_COM = 2299;
var PS_FIRST_ERR = (-PS_FIRST_COM);
var PS_LAST_ERR = (-PS_LAST_COM);

var Command = {
    /*
    ** Standard Commands
     */
    STD_MONITOR     : STD_FIRST_COM,
    STD_AGE         : (STD_FIRST_COM+1),
    STD_COPY        : (STD_FIRST_COM + 2),
    STD_DESTROY     : (STD_FIRST_COM + 3),
    // Get agent or node info
    STD_INFO        : (STD_FIRST_COM + 4),
    STD_RESTRICT    : (STD_FIRST_COM + 5),
    // Get agent or node status
    STD_STATUS      : (STD_FIRST_COM + 6),
    STD_TOUCH       : (STD_FIRST_COM + 7),
    STD_GETPARAMS   : (STD_FIRST_COM + 8),
    STD_SETPARAMS   : (STD_FIRST_COM + 9),
    STD_NTOUCH      : (STD_FIRST_COM + 10),
    STD_EXIT        : (STD_FIRST_COM + 11),
    STD_RIGHTS      : (STD_FIRST_COM + 12),
    STD_EXEC        : (STD_FIRST_COM + 13),
    STD_LOCATION    : (STD_FIRST_COM + 20),
    STD_LABEL       : (STD_FIRST_COM + 21),

    /*
    ** Agent Process Control
    */
    PS_STUN         : (PS_FIRST_COM),     // Kill a process/ create a snapshot
    PS_MIGRATE      : (PS_FIRST_COM+1),   // Execute a process from a snapshot after migration (->next+)
    PS_EXEC         : (PS_FIRST_COM+2),   // Execute a process from a snapshot (->next)
    PS_WRITE        : (PS_FIRST_COM+4),   // Store a process class template
    PS_READ         : (PS_FIRST_COM+5),   // Get a process class template
    PS_CREATE       : (PS_FIRST_COM+6),   // Create a process from a template and execute
    PS_FORK         : (PS_FIRST_COM+7),   // Fork a process from a running process
    PS_SIGNAL       : (PS_FIRST_COM+8),   // Send a signal to a process

};

var Status = {
    STD_OK:0,
    STD_CAPBAD      :   STD_FIRST_ERR,
    STD_COMBAD      :  (STD_FIRST_ERR-1),
    STD_ARGBAD      :  (STD_FIRST_ERR-2),
    STD_NOTNOW      :  (STD_FIRST_ERR-3),
    STD_NOSPACE     :  (STD_FIRST_ERR-4),
    STD_DENIED      :  (STD_FIRST_ERR-5),
    STD_NOMEM       :  (STD_FIRST_ERR-6),
    STD_EXISTS      :  (STD_FIRST_ERR-7),
    STD_NOTFOUND    :  (STD_FIRST_ERR-8),
    STD_SYSERR      :  (STD_FIRST_ERR-9),
    STD_INTR        :  (STD_FIRST_ERR-10),
    STD_OVERFLOW    :  (STD_FIRST_ERR-11),
    STD_WRITEPROT   :  (STD_FIRST_ERR-12),
    STD_NOMEDIUM    :  (STD_FIRST_ERR-13),
    STD_IOERR       :  (STD_FIRST_ERR-14),
    STD_WRONGSRV    :  (STD_FIRST_ERR-15),
    STD_OBJBAD      :  (STD_FIRST_ERR-16),
    STD_UNKNOWN     :  (STD_FIRST_ERR-17),
    RPC_FAILURE     : -1,
    BUF_OVERFLOW    : -2,
}

var amp={
  AMMessageType:AMMessageType,
  AMState:AMState
};

  
/*************************
** IP UTILS
*************************/
function isLocal(addr) {
  return addr=='localhost'||
         addr=='127.0.0.1'
}
function isIpAddr(addr) {
  return (/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/.test(addr))
}
/*  typeof @url = "<proto>://<domain>:<ipport>" | "<domain>:<ipport>" | 
*                 "<name>:<ipport>" | "<ip>:<ipport>" | "<ip>:<portname>" | "<ipport>"
 *  and @ipport = (1-65535) | "*" 
 *  and @port = string 
 */
function parseUrl(url) {
  if (!isNaN(Number(url))) return {
    proto:  undefined,
    address:   undefined,
    port:   url,
    param:  undefined,
    value:  undefined    
  }
  var tokens = url.match(/((http|udp|tcp):\/\/)?([a-zA-Z0-9_\.\-]+):(\[?[a-zA-Z0-9]+\]?|\*)(\?([a-zA-z0-9]+)=([a-zA-Z0-9:]+))?/)
  if (!tokens)
    tokens   = url.match(/((http|udp|tcp):\/\/)?([a-zA-Z0-9_\.\-]+)/);
  return  {
    proto:  tokens[2],
    address:   tokens[3],
    port:   tokens[4],
    param:  tokens[6],
    value:  tokens[7]
  }
}

function url2addr(url,defaultIP,callback) {
  var addr={address:defaultIP||options.localhost,port:undefined},
      parts = parseUrl(url);
  if (parts.proto)   addr.proto=parts.proto;
  if (parts.address) addr.address=parts.address;
  if (parts.port && parts.port!='*')
    addr.port=!isNaN(Number(parts.port))?Number(parts.port):parts.port;
  if (parts.param) { 
    addr.parameter={};
    addr.parameter[parts.param]=parts.value;
  }

  if (!isLocal(parts.address) && !isIpAddr(parts.address)) {
    // <domain>:<ipport>
    // needs dns lookup with callback (async)
    if (Dns) 
      Dns.lookup(parts.address, function (err,_addr) {
        if (!err) addr.address=_addr;
        if (callback) callback(addr);
      }); 
    else if (callback) callback(addr);
    return addr;
  }
  if (callback) callback(addr);
  else return addr;
};

function params(po) {
  var s='?',sep='';
  for(var p in po) {
    s += (sep+p+'='+po[p]);
    sep='&';
  }
  return s;
}
function addr2url(addr,noproto) {
  return (!noproto && addr.proto?(addr.proto+'://'):'')+
         (isLocal(addr.address)?options.localhost:addr.address)+':'+
         (addr.port?addr.port:'*')+
         (!noproto && addr.parameter?params(addr.parameter):'')
};

function obj2url(obj) {
  if (!obj) return '*';
  if (obj.name && !obj.address) return obj.name+':*';
  if (!obj.address) return '*';
  return (isLocal(obj.address)?options.localhost:obj.address)+':'+(obj.port?obj.port:'*')
};

function addrequal(addr1,addr2) {
  return ipequal(addr1.address,addr2.address) && addr1.port==addr2.port;
}

function addrempty(addr) {
  return !(addr && addr.address && addr.port);
}

function resolve (url) {return addr2url(url2addr(url)) }

function ipequal(ip1,ip2) {
  if (ip1==undefined || ip2==undefined) return false;
  else if ((Comp.string.equal(ip1,'localhost') || Comp.string.equal(ip1,'127.0.0.1')) &&
           (Comp.string.equal(ip2,'localhost') || Comp.string.equal(ip2,'127.0.0.1'))) return true;
  else return ip1==ip2;
}

// Use remote TCP connection to get this host IP (private address if behind NAT) 
var ipnet = Require('net');
var myip;
function getNetworkIP(server,callback) {
  var socket;
  if (!ipnet) return callback('Not supported','error');
  if (myip) return callback(undefined,myip);
  if (!server) server={address:options.peekIP,port:80};
  socket = ipnet.createConnection(server.port, server.address);
  socket.on('connect', function() {
    myip=socket.address().address;
    callback(undefined, socket.address().address);
      socket.end();
  });
  socket.on('error', function(e) {
    callback(e, 'error');
  });
}


function doUntilAck(interval, fn, ack, arg) {
  if (ack()) return;
  fn(arg);
  return setTimeout(function() {
    doUntilAck(interval, fn, ack, arg);
  }, interval);  
}


module.exports = {
  AMMode:AMMode,
  AMMessageType:AMMessageType,
  AMState:AMState,
  doUntilAck:doUntilAck,
  getNetworkIP:getNetworkIP,
  amp:amp,
  options:options,
  addrempty:addrempty,
  addrequal:addrequal,
  addr2url:addr2url,
  ipequal:ipequal,
  isLocal:isLocal,
  obj2url:obj2url,
  resolve:resolve,
  url2addr:url2addr,
}
};
BundleModuleCode['jam/ampMAN']=function (module,exports,global,process){
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
 **    $CREATED:     30-01-18 by sbosse.
 **    $RCS:         $Id: chan.js,v 1.3 2017/05/27 18:20:36 sbosse Exp $
 **    $VERSION:     1.14.7
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) - General Management Operations
 **
 **
 **  New:
 **   - Single message transfers (HEADER+DATA)
 **
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Sec = Require('jam/security');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');

var COM = Require('jam/ampCOM'),
    AMMode=COM.AMMode,
    AMMessageType=COM.AMMessageType,
    AMState=COM.AMState,
    amp=COM.amp,
    options=COM.options,
    url2addr=COM.url2addr,
    addr2url=COM.addr2url,
    addrequal=COM.addrequal,
    resolve=COM.resolve,
    ipequal=COM.ipequal,
    addrempty=COM.addrempty,
    getNetworkIP=COM.getNetworkIP;

// Get data from message
function msgData(msg) {
  // typeof msg.data = Array | Buffer | { type: 'Buffer', data: Array }
  return msg.data && msg.data.data?msg.data.data:msg.data;
}

module.exports.current=function (module) { current=module.current; Aios=module; };


amp.man = function (options) {

}

// Message logger
amp.man.prototype.LOG = function (op,msg) {
  if (!this.logging) return;
  switch (op) {
    case 'print':
      for(var i in this.logs) {
        Aios.log(this.logs[i].op,this.logs[i].time,this.logs[i].msg,AMState.print(this.logs[i].state));
      }
      this.logs=[];
      break;
    case 'enable':
      this.logging=true;
      break;
    case 'disable':
      this.logging=false;
      break;
    default:
      var date = new Date();
      var time = Math.floor(date.getTime());
      this.logs.push({op:op,time:time,msg:msg,state:(this.url && this.links[this.url].state)});
  }
} 



/** Transation cache for receiving data fragments that can be out of order.
 *  typeof @data = [handler:{tid,remote,cmd,size,frags,buf},data:[],timeout:number]
 *
 */
amp.man.prototype.addTransaction = function (remote,tid,data) {
  if (this.mode & AMMode.AMO_MULTICAST)
    this.transactions[remote.address+remote.port+tid]=data; 
  else
    this.transactions[tid]=data; 
}
amp.man.prototype.deleteTransaction = function (remote,tid) {
  if (this.mode & AMMode.AMO_MULTICAST)
    delete this.transactions[remote.address+remote.port+tid];
  else 
    delete this.transactions[tid];
}
amp.man.prototype.findTransaction = function (remote,tid) {
  if (this.mode & AMMode.AMO_MULTICAST)
    return this.transactions[remote.address+remote.port+tid];
  else
    return this.transactions[tid];
}

/** Check the state of a link
  *
  */
amp.man.prototype.checkState = function (state,addr) {
  switch (state) {
    case AMState.AMS_CONNECTED:
      if (this.mode & AMMode.AMO_ONEWAY) return true;
      if (this.mode & AMMode.AMO_MULTICAST) return this.links[addr2url(addr,true)];
      if (this.url && this.links[this.url].state == AMState.AMS_CONNECTED) return true;
      break;
  }
  return false;
}

/** Update AMP object configuration
 *
 */
amp.man.prototype.config = function(options) { 
  for(var p in options) this[p]=options[p];
}
/** Handle events
 *
 */
amp.man.prototype.emit = function(event,arg,aux,aux2) { 
  if (this.events[event]) this.events[event](arg,aux,aux2);
}

/** Handler for incoming messages (proecssed by receiver)
 *
 */
amp.man.prototype.handle = function (msg,remote,response) {
  var handler,thisnum,ipport,cmsg,url,ack,info;
  if (this.verbose > 1) this.out('handle '+AMMessageType.print(msg.type)+' from '+addr2url(remote));
  switch (msg.type) {
    case AMMessageType.AMMRPCHEAD:
    case AMMessageType.AMMRPCHEADDATA:
      if (!this.checkState(AMState.AMS_CONNECTED,remote)) return;

      handler={};
      handler.tid=msg.tid; 
      // handler.remote=remote.address+':'+Buf.buf_get_int16(buf);
      handler.remote=remote;
      handler.cmd=msg.cmd;
      handler.size=msg.size;
      handler.frags=msg.frags;
      // console.log(handler)
      if (handler.size>0 && handler.frags>0) {
        // AMMRPCDATA messages are following (used by UDP)
        handler.buf=Buf.Buffer();
        dlist = Comp.array.range(0, handler.frags - 1);
        // Add transaction to cache for pending data
        this.addTransaction(remote, handler.tid, [handler,dlist,1000]);
      } else if (handler.size>0) {
        // Single message transfer; message contains all data (msg.data: Buf.buffer!, used by TCP)
        handler.buf=msg.data;
        this.callback(handler);        
      } else {
        // No data; control message
        handler.buf=Buf.Buffer();
        this.callback(handler);
      }
      break;

    case AMMessageType.AMMRPCDATA:
      if (!this.checkState(AMState.AMS_CONNECTED,remote)) return;
      thisnum = msg.off/this.dlimit;
      transaction = this.findTransaction(remote,msg.tid);
      if (transaction!=undefined) {
        handler=transaction[0];
        if (this.verbose>1)
          this.out('receiver: adding data num='+
                   thisnum+' off='+msg.off+' size='+msg.size+' dlist='+transaction[1]);

        Buf.buf_get_buf(msg.data,handler.buf,msg.off,msg.size);
        transaction[1]=Comp.array.filter(transaction[1],function(num) {return (num!=thisnum)});
        if (Comp.array.empty(transaction[1])) {
            if (this.verbose>1) this.out('[AMP] receiver: finalize '+addr2url(remote));
            // Io.out(handler.data.toString());
            // Deliver
            this.callback(handler);
            this.deleteTransaction(remote,msg.tid);
        }
      }
      break;

    case AMMessageType.AMMRPC:
      // Single data transfer - used by HTTP/Browser
      if (!this.checkState(AMState.AMS_CONNECTED,remote)) return;
      // Complete RPC message
      handler={};
      handler.tid=msg.tid; 
      // handler.remote=remote.address+':'+Buf.buf_get_int16(buf);
      handler.remote=remote;
      handler.cmd=msg.cmd;
      handler.size=msg.size;
      handler.frags=msg.frags;
      handler.buf=Buf.Buffer(msgData(msg));
      this.callback(handler);
      if (this.ack && response) this.ack(response);
      break;
      
    case AMMessageType.AMMPING:
        url=addr2url(remote,true);
        ipport=remote.port;
        if (this.mode&AMMode.AMO_MULTICAST) {
          if (!this.links[url] || this.links[url].state!=AMState.AMS_CONNECTED) return;
        } else if (this.url) {
          if (this.links[this.url].state!=AMState.AMS_CONNECTED) return;
        }
        // Send back a PONG message only if we're connected
        this.pong({address:remote.address,port:ipport},response);
        break;

    case AMMessageType.AMMPONG:
        ipport=remote.port;
        if (this.mode&AMMode.AMO_MULTICAST) {
          url=addr2url(remote,true);
          if (this.links[url] && this.links[url].state==AMState.AMS_CONNECTED) {
            this.links[url].live = options.AMC_MAXLIVE;
          }
        } else if (this.url && this.links[this.url].state==AMState.AMS_CONNECTED) {
          this.links[this.url].live = options.AMC_MAXLIVE;
        }
        if (this.ack && response) this.ack(response);
        break;

    case AMMessageType.AMMACK:
        // TODO: check pending waiters (scan mode)
        if (msg.status=="ELINKED") {    
          if (this.mode&AMMode.AMO_MULTICAST) {
            // Multicast mode
            url=addr2url(remote,true);
            if (!this.links[url] || this.links[url].state==AMState.AMS_NOTCONNECTED) {
                // Ad-hoc remote connect
                if (!this.links[url]) this.links[url]={};
                this.links[url].snd=remote;
                this.links[url].live=options.AMC_MAXLIVE; 
                this.links[url].port=msg.port;
                this.links[url].ipport=remote.port; 
                this.links[url].state=AMState.AMS_CONNECTED;
                this.links[url].node=msg.node;
                this.emit('route+',url,msg.node);
                this.watchdog(true);
                if (this.verbose) 
                  this.out('Linked with ad-hoc '+this.proto+' '+url+', AMP '+
                            Net.Print.port(msg.port)+', Node '+msg.node);
            }           
          }
        }
        break;
        
    case AMMessageType.AMMLINK:
        ipport=remote.port;
        url=addr2url(remote,true);
        if (this.secure && (!msg.secure || !Sec.Port.equal(this.secure,msg.secure))) return; 
        if (this.mode&AMMode.AMO_MULTICAST) {
          // Multicast mode
          if (!this.links[url] || this.links[url].state==AMState.AMS_NOTCONNECTED) {
              // Ad-hoc remote connect
              if (!this.links[url]) this.links[url]={};
              this.links[url].snd=remote;
              this.links[url].live=options.AMC_MAXLIVE; 
              this.links[url].port=msg.port;
              this.links[url].ipport=remote.port; 
              // back link acknowledge
              this.link(this.links[url].snd,false,none,response);
              // no ack="EOK" -- ack send by link response!;
              this.links[url].state=AMState.AMS_CONNECTED;
              this.links[url].node=msg.node;
              // if (this.mode&AMMode.AMO_UNICAST) this.snd=remote,this.url=url;
              this.emit('route+',url,msg.node);
              this.watchdog(true);
              if (this.verbose) 
                this.out('Linked with ad-hoc '+this.proto+' '+url+', AMP '+
                          Net.Print.port(msg.port)+', Node '+msg.node);
          } else if (this.links[url].state==AMState.AMS_CONNECTED) {
            // Already linked! Just acknowledge
            ack="ELINKED";
          }
        } else {

          // Unicast mode; only one connection
          if (this.links[url] && !addrempty(this.links[url].snd) &&
              this.links[url].state==AMState.AMS_NOTCONNECTED &&
              ipequal(this.links[url].snd.address,remote.address) &&
              this.links[url].snd.port==ipport)    // ipport or remote.port??
          {
              // Preferred / expected remote connect
              this.links[url].snd=remote;
              this.links[url].port=msg.port;
              this.links[url].ipport=remote.port; 
              this.links[url].node=msg.node;
              this.links[url].live=options.AMC_MAXLIVE; 

              // back link acknowledge
              this.link(this.links[url].snd);

              this.links[url].state=AMState.AMS_CONNECTED;
              // Inform router
              this.emit('route+',url,msg.node);
              this.watchdog(true);
              if (this.verbose) 
                this.out('Linked with preferred '+this.proto+' '+ url +', '+
                         Net.Print.port(msg.port)); 
          } else if ((!this.links[url] && !this.url) || 
                     (this.links[url] && this.links[url].state==AMState.AMS_NOTCONNECTED) ||
                     (this.broker && this.url && this.links[this.url].state==AMState.AMS_NOTCONNECTED)) {
              if (!this.links[url]) this.links[url]={};
              this.links[url].snd=remote;
              this.links[url].live=options.AMC_MAXLIVE; 
              this.links[url].port=msg.port;
              this.links[url].ipport=remote.port; 
              this.links[url].node=msg.node;

              // back link acknowledge
              this.link(this.links[url].snd,false,none,response);
              // no ack="EOK"; - ack was send with link message!

              this.links[url].state=AMState.AMS_CONNECTED;
              this.url=url;  // remember this link

              // Inform router
              this.emit('route+',url,msg.node);
              this.watchdog(true);
          
              if (this.verbose) 
                this.out('Linked with ad-hoc ' + this.proto +' '+ url +', '+
                          Net.Print.port(msg.port));
          } 
        }
        if (ack && this.ack && response) this.ack(response,ack);
        break;

    case AMMessageType.AMMUNLINK:
        ipport=remote.port;
        if (this.mode&AMMode.AMO_MULTICAST) {
          // Multicast mode
          url=addr2url(remote,true); // ipport or remote.port??
          if (this.links[url] && !addrempty(this.links[url].snd) && ipequal(this.links[url].snd.address,remote.address) &&
              this.links[url].snd.port==ipport && this.links[url].state==AMState.AMS_CONNECTED) {
              this.links[url].state=AMState.AMS_NOTCONNECTED;
              // Not negotiated. Just close the link!
              if (this.verbose) 
                this.out('Unlinked ' +url+', '+
                         Net.Print.port(msg.port));
              // Inform router
              this.emit('route-',url);
              if (!this.links[url].snd.connect) this.links[url].snd={};
              if (this.cleanup) this.cleanup(url);
          }
        } else {
          // Unicast mode
          if (this.url && !addrempty(this.links[this.url].snd) &&
              ipequal(this.links[this.url].snd.address,remote.address) &&
              this.links[this.url].snd.port==ipport &&
              this.links[this.url].state==AMState.AMS_CONNECTED) 
          {
              this.links[this.url].state=AMState.AMS_NOTCONNECTED;
              addr=this.links[this.url].snd;
              // Not negotiated. Just close the link!
              if (this.verbose) 
                this.out('Unlinked ' + this.url +', '+
                         Net.Print.port(msg.port));

              // Inform router
              this.emit('route-',addr2url(addr));
              if (!this.links[this.url].snd.connect) this.links[this.url].snd=null;
              if (this.cleanup) this.cleanup(url);
          }
        }
        if (this.ack && response) this.ack(response);
        break;

    // optional rendezvous brokerage ; remote is broker IP!!!
    case AMMessageType.AMMCONTROL:
        cmsg = JSON.parse(msgData(msg));
        if (this.verbose>1) this.out('# got message '+msgData(msg));
        this.LOG('rcv',cmsg);
        // All brokerage and pairing is handled by the root path '*'!
        if (this.control && this.links['*'])
          this.control(this.links['*'],cmsg,remote);    
        break;
        
    case AMMessageType.AMMSCAN:
        url=addr2url(remote,true);
        ipport=remote.port;
        info={
          world:(current.world&&current.world.id),
          stats:(current.world&&current.world.info()),
        };
        this.scan({address:remote.address,port:ipport,info:info},response);
        break;

    default:
      this.out('handle: Unknown message type '+msg.type);
  }
}

/** Install event handler
 *
 */
amp.man.prototype.on = function(event,handler) { 
  this.events[event]=handler;
}

// Status of link, optionally checking destination
amp.man.prototype.status = function (ip,ipport) {
  var p,url;
  if (this.mode&AMMode.AMO_MULTICAST) {
    if (!ip) {
      for(p in this.links) if (this.links[p] && this.links[p].state==AMState.AMS_CONNECTED) return true;
      return false;
    } else {
      url=addr2url({address:ip,port:ipport});
      if (!this.links[url]) return false;
      return this.links[url].state==AMState.AMS_CONNECTED;
    }
  }
  if (!ip && this.url) return this.links[this.url].state==AMState.AMS_CONNECTED || 
                              (this.mode&AMMode.AMO_ONEWAY)==AMMode.AMO_ONEWAY;
 
  return (this.url && ipequal(this.links[this.url].snd.address,ip) && this.links[this.url].snd.port==ipport);
}
};
BundleModuleCode['jam/ampHTTP']=function (module,exports,global,process){
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
 **    $CREATED:     09-02-16 by sbosse.
 **    $RCS:         $Id:$
 **    $VERSION:     1.14.4
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) over HTTP
 **  Only Mulitcast IP(*) mode is supported!
 **
 **  Events out: 'error','route-'
 **
 **  TODO: Garbage collection
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');
var Bas64 = Require('os/base64');
var Sec = Require('jam/security')

var COM = Require('jam/ampCOM'),
    AMMode=COM.AMMode,
    AMMessageType=COM.AMMessageType,
    AMState=COM.AMState,
    amp=COM.amp,
    options=COM.options,
    url2addr=COM.url2addr,
    addr2url=COM.addr2url,
    addrequal=COM.addrequal,
    resolve=COM.resolve,
    ipequal=COM.ipequal,
    isLocal=COM.isLocal,
    getNetworkIP=COM.getNetworkIP
    magic=COM.options.magic;

var debug = false;

module.exports.current=function (module) { current=module.current; Aios=module; };

/*
** Parse query string '?attr=val&attr=val... and return parameter record
*/
function parseQueryString( url ) {
    var queryString = url.substring( url.indexOf('?') + 1 );
    if (queryString == url) return [];
    var params = {}, queries, temp, i, l;

    // Split into key/value pairs
    queries = queryString.split("&");

    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        if (temp[1]==undefined) temp[1]='true';
        params[temp[0]] = temp[1].replace('%20',' ');
    }

    return params;
}
/*
** Format a query string from a parameter record
*/
function formatQueryString (msg) {
  var path= '/?';
  path += "magic="+msg.magic;
  path += "&type="+AMMessageType.print(msg.type);
  if (msg.cmd) path += '&cmd='+msg.cmd;
  if (msg.tid) path += '&tid='+msg.tid;
  if (msg.port) path += '&port='+Net.port_to_str(msg.port);
  if (msg.timeout) path += '&timeout='+msg.timeout;
  if (msg.node) path += '&node='+msg.node.replace(' ','%20');
  if (msg.index) path += '&index='+msg.index;
  if (msg.secure) path += '&secure='+(msg.secure.length==8?Net.port_to_str(msg.secure):msg.secure);
  return path;
}

function msg2JSON(msg) {
  if (msg.port) msg.port=Net.port_to_str(msg.port);
  if (msg.msg && msg.msg.length) Comp.array.iter(msg.msg,function (msg) {
    if (msg.port) msg.port=Net.port_to_str(msg.port);
  });
  return JSON.stringify(msg);
}
function JSON2msg(data) {
  var msg=JSON.parse(data);
  if (msg.port) msg.port=Net.port_of_str(msg.port);
  if (msg.msg && msg.msg.length) Comp.array.iter(msg.msg,function (msg) {
    if (msg.port) msg.port=Net.port_of_str(msg.port);
  });
  return msg;
}

/** Get XML data
 *
 */
function getData(data) {
  if (data==undefined) return undefined;
  else if (data.val!='') return data.val;
  else return data.children.toString();
}

function is_error(data,err) {
  if (data==undefined) return true;
  if (err==undefined)
    return (data.length > 0 && Comp.string.get(data,0)=='E');
  else
    return (Comp.string.equal(data,err));
};

/** AMP port using HTTP
 *  ===================
 *
 *  No negotiation is performed. Data transfer can be fragmented.
 *  Each time a remote endpoint sends a GET/PUT request, we stall the request until
 *  a timeout occurs or we have to send data to the remote endpoint. A link is established. 
 *  The routing table is refreshed each time the same client send a
 *  GET/PUT request again. If the client do not send requests anymore after a timeout, it is considered to be 
 *  unlinked and the route is removed.
 * 
 * type amp.http = function (options:{rcv:address,snd?:address,verbose?,logging?,out?:function,log?})
 */
var http = Require('http');

amp.http = function (options) {
  var self=this;
  this.proto = 'http';
  this.options=checkOptions(options,{});
  this.verbose=checkOption(this.options.verbose,0);

  this.dir  = options.dir;                          // attached to JAM port
  this.rcv  = options.rcv;                          // Local  HTTP Server Port; Server Mode 
  this.mode = AMMode.AMO_MULTICAST;                 // We can handle multiple links at once 
  this.node   = options.node;                       // Attached to this node

  if (options.rcv && options.rcv.address!='*' && options.rcv.port) this.mode |= AMMode.AMO_SERVER;
  else this.mode |= AMMode.AMO_CLIENT;
  
  this.options.keepalive=true;
  this.secure = this.options.secure;
  
  this.port = options.port||Net.uniqport();     // Connection Link Port (this side)
  this.id = Net.Print.port(this.port);
  // Stream socket; can be a process object!
  this.out = function (msg) {
    Aios.log('[AMP '+Net.Print.port(self.port)+
             (self.dir?(' '+Aios.DIR.print(self.dir)):'')+'] '+msg);
  }
  this.err = function (msg) {
    Aios.log('[AMP '+Net.Print.port(self.port)+
             (self.dir?(' '+Aios.DIR.print(self.dir)):'')+'] Error: '+msg);
    throw 'AMP';
  }

  this.events = [];
  // typeof linkentry = {snd:address,tries:number,state:amstate,collect?,collecting?,msgqueue?:{} []} 
  this.links = {};
  this.count={rcv:0,snd:0,lnk:0,png:0};
  if (options.snd) {
    url=addr2url(options.snd,true);
    this.links[url]={snd:options.snd,tries:0,state:AMState.AMS_NOTCONNECTED,live:options.AMC_MAXLIVE};
    //this.out(url)
  }
  // Collector thread collecting messages from server (AMO_CLIENT mode)
  this.collector=undefined;
  
  this.logs=[];
  this.logging=options.logging||false;
  if (this.logging) {
    setInterval(function () { self.LOG('print') },5000);
  }
  this.index=0;
};

amp.http.prototype.LOG = amp.man.prototype.LOG;  
amp.http.prototype.checkState = amp.man.prototype.checkState;
amp.http.prototype.config = amp.man.prototype.config;
amp.http.prototype.emit = amp.man.prototype.emit;
amp.http.prototype.on = amp.man.prototype.on;
amp.http.prototype.handle = amp.man.prototype.handle;
amp.http.prototype.status = amp.man.prototype.status;

/** Acknowledge reply
 *
 */
amp.http.prototype.ack=function(snd,status) {
  this.reply(snd,{type:AMMessageType.AMMACK,status:status||"EOK",
                  port:this.port,node:this.node?this.node.id:'*'});
}

/** Callback from ampMAN handler to inform about remote unlink event
 *
 */
amp.http.prototype.cleanup=function(url,keep) {
  // Cleanup link
  var obj=this.links[url];
  if (!obj) return;
  obj.state=AMState.AMS_NOTCONNECTED
  if (obj.collect) clearTimeout(obj.collect), obj.collect=undefined;
  if (obj.collecting) this.reply(obj.collecting,{status:'ENOENTRY'}),obj.collecting=undefined;
  // Link was initiated on remote side
  // Remove link!
  if (!keep) {
    obj.snd={};
    this.links[url]=undefined;
  }
}

/** Collect request
 *
 */
amp.http.prototype.collect=function(snd) {
  var self=this,
      url=addr2url(snd,true),
      msg={type:AMMessageType.AMMCOLLECT,port:this.port,index:this.index++,magic:magic};
  if (this.links[url] && this.links[url].state==AMState.AMS_CONNECTED) 
    this.send(snd,msg,function (reply) {
      var err=is_error(reply);
      if (err) return; //  self.cleanup(url,true);
      if (reply.msg) Comp.array.iter(reply.msg,function (msg) {
        self.handle(msg,snd);
      });
      if (!self.links[url]) return; // unlinked?
      self.links[url].collect=setTimeout(function () {
        self.collect(snd); 
      },0);
    });
}
/** Service collect request
 *
 */
amp.http.prototype.collecting=function(msg,remote,response) {
  var url;
  if (this.verbose>2) this.out('handle AMMCOLLECT from '+addr2url(remote));
  url=addr2url(remote,true); // ipport or remote.port??
  if (this.links[url]  && this.links[url].msgqueue && this.links[url].msgqueue.length) {
    this.reply(response,{msg:this.links[url].msgqueue});
    this.links[url].msgqueue=[];
  } 
  else if (this.links[url]) this.links[url].collecting=response;
  else this.reply(response,{status:'ENOENTRY'});
}

/** HTTP GET request to send a messageto the server broker returning data on reply.
 *
 * @param path
 * @param callback
 */
 
amp.http.prototype.get = function (snd,path,callback) {
    var body,req,
        self=this;
  
    if (this.verbose>2) this.out('get '+addr2url(snd)+ path); 
    this.count.snd = this.count.snd + path.length;
    if (!http.xhr) {
      req = http.request({
        host: snd.address,
        port: snd.port,
        path: path,
        method: 'GET',
        keepAlive: this.options.keepalive,
        headers: {
        }
      } , function(res) {
        if (self.verbose>2) self.out('got '+addr2url(snd)+ path); 
        if (res.setEncoding != null) res.setEncoding('utf8');
        body = '';
        res.on('data', function (chunk) {
          body = body + chunk;
        });
        res.once('end', function () {
          self.count.rcv += body.length;
          if (callback) callback(body);
        });
      });
      req.once('error', function(err) {
        if (self.verbose) self.out('Warning: request to '+addr2url(snd)+' '+path+' failed: '+err);
        self.emit('error',err);
        if (callback) callback();
      });
      req.end();
    } else {
      // XHR Browser
      http.request({
        host: snd.address,
        port: snd.port,
        path:path,
        proto:'http',
        method: 'GET',
        headers: {
        }
      } , function(err,xhr,body) {
        if (err) {
          if (self.verbose) self.out('Warning: request to '+addr2url(snd)+' '+path+' failed: '+err);
          self.emit('error',err);
          if (callback) callback();
        } else {
          self.count.rcv += body.length;
          if (callback) callback(body);
        }
    });    
  }
};

/** Initialize AMP
 *
 */
amp.http.prototype.init = function(callback) { 
  if (callback) callback();
};

/** Negotiate a virtual communication link (peer-to-peer).
 *  In oneway mode only a destination endpoint is set and it is assumed the endpoint can receive messages a-priori!
 *
 * typeof @snd = address
 * typeof @callback = function
 * typeof @connect = boolean is indicating an initial connect request and not an acknowledge
 * typeof @key = private
 * typeof @response = object
 *
 * +------------+
 * VCMessageType (int16)
 * Connection Port (port)
 * Node ID (string)
 * // Receiver IP Port (int32)
 * +------------+
 *
 */
amp.http.prototype.link=function(snd,connect,key,response) {
    var self = this,
        msg,
        url;
    if (this.verbose>1) this.out('amp.link: to '+addr2url(snd));
    
    // MULTICAST mode
    // Add new link to cache of links
    if (!snd) this.err('link: no destinataion set in MULTICAST mode');
    if (snd.parameter && snd.parameter.secure) key=snd.parameter.secure;
    url=addr2url(snd,true);
    if (!this.links[url] || !this.links[url].snd.address) {
      if (connect) snd.connect=true;
      this.links[url]={
        snd:snd,
        state:AMState.AMS_NOTCONNECTED,
        tries:0,
        connect:connect,
        live:options.AMC_MAXLIVE};
    }
    // Let watchdog handle connect request link messages
    if (!this.inwatchdog && connect)
        return this.watchdog(true);
    // if (this.verbose>1) this.out('send link '+Io.inspect(snd));
    msg={
      type:AMMessageType.AMMLINK,
      port:this.port,
      node:this.node?this.node.id:'*',
      index:this.index++,
      magic:magic
    };
    if (key) msg.secure=key;

    this.count.lnk++;
    
    if (response)
      this.reply(response,msg); 
    else this.send(snd,msg,function (reply) {
      if (is_error(reply)) return; // error
      // start message collector thread after first link reply!
      if ((self.mode & AMMode.AMO_CLIENT) && !self.links[url].collect) {
        self.links[url].collect=setTimeout(function () {
          self.collect(snd); 
        },0);
      }
      // handle reply
      self.handle(reply,snd);
    });
};

amp.http.prototype.ping=function(snd,response) {
    var self = this,msg={};

   
    msg.type=AMMessageType.AMMPING;
    msg.port=this.port;
    msg.index=this.index++;
    msg.magic=magic;
     
    if (this.verbose>1) this.out('amp.ping'+(response?'in response':'')+': to '+addr2url(snd));

    this.count.png++;

    if (response)
      this.reply(response,msg); 
    else this.send(snd,msg,function (reply) {
      if (is_error(reply)) return;   // error
      // handle reply
      self.handle(reply,snd);
    });
}

amp.http.prototype.pong=function(snd,response) {
    var self = this,msg={};

    msg.type=AMMessageType.AMMPONG;
    msg.port=this.port;
    msg.index=this.index++;
    msg.magic=magic;

    if (this.verbose>1) this.out('amp.pong '+(response?'in response':'')+': to '+addr2url(snd));

    this.count.png++;

    if (response)
      this.reply(response,msg); 
    else this.send(snd,msg,function (reply) {
        if (is_error(reply)) {
          self.emit('error',reply);
        }
    });
}

/** HTTP PUT request to send a message and data to the AMP HTTP server.
 *
 * @param path
 * @param data
 */
amp.http.prototype.put = function (snd,path,data) {
    var self=this,
        req,body;
    this.count.snd = this.count.snd + path.length + data.length;
    if (!http.xhr) {
      req = http.request({
        host: snd.address,
        port: snd.port,
        path: path,
        method: 'POST',
        keepAlive: this.options.keepalive,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
      } , function(res) {
        if (res.setEncoding != null) res.setEncoding('utf8');
        // TODO body=+chunk, res.on('end') ..??
        res.once('data', function (chunk) {
          // TODO
        });
      });
      req.once('error', function(err) {
        self.out('Warning: request to '+addr2url(snd)+' failed: '+err);
        self.emit('error',err);
      });

      // write data to request body
      req.write(data);
      req.end();
    } else {
      // XHR Browser
      http.request({
        host: snd.address,
        port: snd.port,
        path: path,
        method: 'POST',
        body:data,
        keepAlive: this.options.keepalive,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
      } , function(err,xhr,body) {
        if (err) {
          if (self.verbose) self.out('Warning: request to '+addr2url(snd)+' failed: '+err);
          self.emit('error',err);
        }
        // TODO
      })
    }
};

amp.http.prototype.receiver = function (callback,rcv) {
  var self = this;

  if (callback) this.callback=callback;
  
  if (this.mode & AMMode.AMO_SERVER) {
    // Only if this is a public or locally visible network node this node 
    // should provide a server port!
    if (rcv == undefined || rcv.address==undefined) rcv={},rcv.address=this.rcv.address;
    if (rcv.port==undefined) rcv.port=this.rcv.port;
    
    this.server=http.createServer(function (request,response) {
      if(parseQueryString(request.url).length==0) return response.end('EINVALID'); // accidental access by WEB browser
      var i,body,
          msg = parseQueryString(request.url),
          remote = {address:request.connection.remoteAddress.replace(/^::ffff:/,''),
                    port:'['+msg.port.replace(/:/g,'')+']' /* unique remote identifier */};

      if (self.verbose>2) 
        console.log(request.method,request.url,msg,addr2url(remote),url2addr(addr2url(remote)));
        
      // consistency check
      if (msg.magic!=magic) return;
      
      self.count.rcv += msg.length;
      msg.type=AMMessageType[msg.type];

      if (msg.secure) msg.secure=Net.port_of_str(msg.secure);
      
      if (debug) console.log(Io.Time(),msg)

      response.origin=request.headers.origin||request.headers.Origin;
      Comp.string.match(request.method,[
          ['GET',function() {
            if (msg.type==AMMessageType.AMMCOLLECT)
              self.collecting(msg,remote,response);
            else
              self.handle(msg,remote,response);
          }],
          ['POST',function() {
            body = '';
            request.on('data', function (chunk) {
              body = body + chunk;
            });
            request.on('end', function () {
              msg.data=Buffer(body,'hex');
              self.count.rcv += msg.data.length;
              if (msg.cmd) msg.cmd=Number(msg.cmd);
              self.handle(msg,remote,response);
            });
          }]
      ])
    });

    this.server.on("connection", function (socket) {
        socket.setNoDelay(true);
    });

    this.server.on("error", function (err) {
      self.out('Warning: receiver failed: '+err);
      if (err) self.err(err);
    });

    this.server.listen(rcv.port,function (err) {
      // Try to get network IP address of this host 
      if (!err) getNetworkIP(undefined,function (err,ip) {
        if (!err) self.rcv.address=isLocal(ip)?options.localhost:ip;
        if (self.verbose) self.out('IP port '+addr2url(self.rcv)+ ' (proto '+self.options.proto+')');
        if (err) return self.out("! Unable to obtain network connection information: "+err);
      });
      if (callback) callback(err);
    });
  }
  if (this.mode & AMMode.AMO_CLIENT) {

    // If this is a hidden node (e.g., inside a WEB browser), we have to connect to a remote public server
    // by using stalled GET requests.
    if (callback) this.callback=callback;
  }
}

/** Send a reply for a pending HTTP GET/PUT request (AMO_SERVER)
 *
 */ 
amp.http.prototype.reply = function (response,msg) {
  var data=msg2JSON(msg), header;

  if (response.origin!=undefined)
      header={'Access-Control-Allow-Origin': response.origin,
              'Access-Control-Allow-Credentials': 'true',
              'Content-Type': 'text/plain'};
  else
      header={'Content-Type': 'text/plain'};
  if (this.options.keepalive) header["Connection"]="keep-alive";
  
  response.writeHead(200,header);
  response.write(data);
  if (debug) console.log(Io.Time(),msg)
  response.end();
}

/** Send a request message to a remote node endpoint
 *
 * function (cmd:integer,msg:Buffer,snd:address)
 */

amp.http.prototype.request = function (cmd,msg,snd) {
  var self=this,req={},
      size = msg.data.length,
      tid = msg.tid||Comp.random.int(65536/2);

  if (snd==undefined) this.err('request: snd=null');

  req.type=AMMessageType.AMMRPC;
  req.tid=tid;                   // Transaction Message ID
  req.port=this.port;            // This AMP id
  req.cmd=cmd;
  req.size=size;
  req.magic=magic;
  req.data=msg.data;
  this.send(snd,req);

}


amp.http.prototype.scan=function(snd,response,callback) {
    var self = this,msg={};
    
    msg.type=response?AMMessageType.AMMACK:AMMessageType.AMMSCAN;
    msg.port=this.port;
    msg.magic=magic;

    if (response) msg.info=snd.info;
    
    if (this.verbose>1 && snd) this.out('amp.scan: to '+addr2url(snd));

    if (response) 
      this.reply(response,msg);
    else
      this.send(snd,msg,function (reply) {
        callback(reply)
      });
}

/** Main entry for requests with JSON interface. Multiplexer for HTTP GET/PUT.
 *
 *  msg: JSON 
 *  callback : function (reply:object)
 */
amp.http.prototype.send = function (snd,msg,callback) {
  var path,
      url,
      body,
      self=this;
  // Create query selector
  path = formatQueryString(msg);
    
  if (typeof snd.port == 'string') {
    url=addr2url(snd,true);
    // If Pending get from client
    
    // Else queue message, client will collect them later (or never)
    if (this.links[url]) {
      if (!this.links[url].msgqueue) this.links[url].msgqueue=[];
      if (this.links[url].collecting) {// pending AMMCOLLECT request
        if (this.verbose>1) this.out('REPLY msg '+AMMessageType.print(msg.type)+' to '+url);
        this.reply(this.links[url].collecting,{msg:[msg]});
        this.links[url].collecting=undefined;
      } else {
        if (this.verbose>1) this.out('QUEUE msg '+AMMessageType.print(msg.type)+' for '+url);
        this.links[url].msgqueue.push(msg);
      }
    }
  } else if (msg.data!=undefined) { 
    // Convert buffer data to hex formatted string
    body=msg.data.toString('hex');
    
    this.put(snd,path,body,function (body) {
      if (is_error(body)) self.emit('error',body);
      else if (!is_status(body)) self.emit('error','EINVALID');
      // No reply expected!
    }); 
  } else {
    this.get(snd,path,function (body) {
      var xml,i,
          reply;
      if (!body || is_error(body)) {
        self.emit('error','EINVALID');
      } else {
        reply=JSON2msg(body);
        // { status:string,reply:*,msg?:{}[],..} 
      }
      if (callback) callback(reply);
    });
  } 
}


// Start AMP watchdog and receiver
amp.http.prototype.start = function(callback) {
  var self=this,
      s=this.secure?' (security port '+Sec.Port.toString(this.secure)+')':'';
  if (this.verbose>0 && this.mode & AMMode.AMO_SERVER) 
    this.out('Starting ' + addr2url(this.rcv)+' ['+AMMode.print(this.mode)+'] (proto '+this.proto+')'+s);
  if (this.verbose>0 && this.mode & AMMode.AMO_CLIENT) 
    this.out('Starting ['+AMMode.print(this.mode)+'] (proto http)');
  this.watchdog(true);
  if (!this.server && this.mode & AMMode.AMO_SERVER) {
    // After stop? Restart receiver.
    this.receiver();
  } 
  if (callback) callback();
}

// Stop AMP
amp.http.prototype.stop = function(callback) {
  if (this.links) for(var p in this.links) {
    if (this.links[p]) {
      // Try to unlink remote endpoint
      this.unlink(this.links[p].snd);
      this.links[p].state=AMState.AMS_NOTCONNECTED;
      if (this.links[p].collect) clearTimeout(this.links[p].collect),this.links[p].collect=undefined;
    }
  }
  if (this.timer) clearTimeout(this.timer),this.timer=undefined;
  if (this.server) this.server.close(),this.server=undefined;
  
  if (callback) callback();
}

// Unlink remote endpoint
amp.http.prototype.unlink=function(snd) {
  var self = this,msg,
      url = snd?addr2url(snd,true):null;
  if (this.mode&AMMode.AMO_MULTICAST) {
    if (!this.links[url] || this.links[url].state!=AMState.AMS_CONNECTED) return;
  } else {
    if (this.links.state!=AMState.AMS_CONNECTED) return;
  }
  msg={type:AMMessageType.AMMUNLINK,port:this.port,node:this.node?this.node.id:'*',index:this.index++,magic:magic};
    
  this.send(snd,msg,function (reply) {
    // handle reply
    if (reply) {}
  });
  this.emit('route-',addr2url(snd,true));
  if (this.mode&AMMode.AMO_MULTICAST) {
    this.links[url].state=AMState.AMS_NOTCONNECTED;
    if (!this.links[url].snd.connect) this.links[url].snd={};
  } else {
    this.links.state=AMState.AMS_NOTCONNECTED;
    if (!this.links.snd.connect) this.links.snd={};
  }
  this.cleanup(url);
}


/** Install a watchdog timer.
 *
 * 1. If link state is AMS_NOTCONNECTED, retry link request if this.links[].snd is set.
 * 2. If link state is AMS_CONNECTED, check link end point.
 * 3, If link state is AMS_RENDEZVOUS, get remote endpoint connectivity via broker
 *
 * @param run
 */
amp.http.prototype.watchdog = function(run,immedOrDelay) {
    var self=this;
    if (this.timer) clearTimeout(self.timer),this.timer=undefined;
    if (run) self.timer=setTimeout(function () {
        if (!self.timer ||  self.inwatchdog) return; // stopped or busy?
        self.timer = undefined;
        self.inwatchdog=true;
        
        function handle(obj,url) {
          if (self.verbose>1) self.out('Watchdog: handle link ('+url+') '+
                                        (obj.snd?addr2url(obj.snd):'')+' in state '+
                                        AMState.print(obj.state)+' live '+obj.live);
          switch (obj.state) {
            case AMState.AMS_CONNECTED:
                if (obj.live == 0) {
                    // No PING received, disconnect...
                    if (self.verbose>0) 
                      self.out('Endpoint ' + addr2url(obj.snd) +
                               ' not responding, propably dead. Unlinking...');
                    obj.state = AMState.AMS_NOTCONNECTED;
                    self.emit('route-',addr2url(obj.snd,true));
                    self.cleanup(url,obj.snd.connect);
                    if (obj.snd.connect) self.watchdog(true,2000);
                } else {
                    obj.tries=0;
                    obj.live--;
                    self.watchdog(true);
                    if (self.mode&AMMode.AMO_MULTICAST) self.ping(obj.snd);
                    else self.ping();
                }
                break;
            case AMState.AMS_NOTCONNECTED:
            case AMState.AMS_PAIRED:
                if (obj.snd.port && typeof obj.snd.port == 'number') {
                  // Try link to specified remote endpoint obj.snd
                  if (self.verbose>0 && obj.tries==0) 
                    self.out('Trying link to ' + addr2url(obj.snd));
                  self.link(obj.snd); 
                  obj.tries++;
                  if (obj.tries < options.TRIES) self.watchdog(true);
                  else {
                    self.out('Giving up to link '+addr2url(obj.snd));
                    self.emit('error','link',addr2url(obj.snd));
                    obj.snd={},obj.tries=0;
                  }
                }
                break;
            // AMP P2P Control
            case AMState.AMS_RENDEZVOUS:
                obj.send(
                  {type:'register',name: self.rcv.name, linfo: self.rcv},
                  self.broker,
                  function () {}
                );
                self.watchdog(true);
                break;
            case AMState.AMS_REGISTERED:
                if (obj.tries < options.TRIES && obj.snd.name) {
                  obj.tries++;
                  self.send(
                    {type:'pair', from:self.rcv.name, to: obj.snd.name},
                    self.broker,
                    function () {
                    }
                  );
                }
                if (obj.tries < options.TRIES) self.watchdog(true);
                break;
          }          
        }
        for(var p in self.links) if (self.links[p]) handle(self.links[p],p);
        self.inwatchdog=false;
    },immedOrDelay==true?0:immedOrDelay||options.TIMER);
};
    
};
BundleModuleCode['os/http.browser']=function (module,exports,global,process){
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
 **    $CREATED:     Stefan Bosse
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 * ================================
 *  Browser HTTP Request (Simplified version)
 * ================================
 *
 **
 **    $ENDOFINFO
 */

var XHR = XMLHttpRequest
if (!XHR) throw new Error('missing XMLHttpRequest')
else console.log('HTTP Browser Module Ver. 1.1.1 initialized.');

var DEFAULT_TIMEOUT = 2000;

/** request
 *  typeof @options = { host: string, port:number, path:string, method:"GET"|"PUT", body?:string, headers:{} } 
 *  typeof @callback = function (err, xhr, body)
 */

function request(options, callback) {
  var xhr = new XHR(),
      err,
      url = options.uri || ('http://'+options.host+':'+(options.port?options.port:80)+'/'+options.path),
      is_cors = is_crossDomain(url),
      supports_cors = ('withCredentials' in xhr)

  if(is_cors && !supports_cors) {
    err = new Error('Browser does not support cross-origin request: ' + options.uri)
    err.cors = 'unsupported'
    return callback(err, xhr)
  }
  options.headers = options.headers || {};
  options.timeout = options.timeout || DEFAULT_TIMEOUT;
  options.headers = options.headers || {};
  options.body    = options.body || null;

  if(is_cors) xhr.withCredentials = !! options.withCredentials;
  xhr.timeout = options.timeout;
    
  xhr.onopen = function () {
    for (var key in options.headers)
      xhr.setRequestHeader(key, options.headers[key])      
  }

  xhr.onload = function () {
   if(xhr.status === 0) {
      err = new Error('EREQUEST')
      callback(err, xhr)
   } 
   else callback(null,xhr,xhr.responseText)   
  }
  
  xhr.ontimeout = function () {
    // XMLHttpRequest timed out. Do something here.
    err = new Error('ETIMEOUT')
    err.duration = options.timeout
    callback(err,xhr, null)
  };

  xhr.onrror = function () {
    // XMLHttpRequest failed. Do something here.
    err = new Error('ESERVER')
    callback(err,xhr, null)
  };
  
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XHR.DONE) {
      if(xhr.status === 0) {
        err = new Error('ENETWORK')
        callback(err, xhr)
      } 
    }
  };

  switch (options.method) {
    case 'GET':
    case 'get':
      xhr.open('GET', url, true /* async */);
      xhr.send()
      break;
    case 'PUT':
    case 'POST':
    case 'put':
    case 'post':
      xhr.open('POST', url, true /* async */);
      xhr.send(options.body)
      break;
  }
}

function is_crossDomain(url) {
  var rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/


  // jQuery #8138, IE may throw an exception when accessing
  // a field from window.location if document.domain has been set
  var ajaxLocation
  try { ajaxLocation = location.href }
  catch (e) {
    // Use the href attribute of an A element since IE will modify it given document.location
    ajaxLocation = document.createElement( "a" );
    ajaxLocation.href = "";
    ajaxLocation = ajaxLocation.href;
  }

  if (ajaxLocation.match('file:')) return true;
  
  var ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || []
      , parts = rurl.exec(url.toLowerCase() )

  var result = !!(
    parts &&
    (  parts[1] != ajaxLocParts[1]
    || parts[2] != ajaxLocParts[2]
    || (parts[3] || (parts[1] === "http:" ? 80 : 443)) != (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443))
    )
  )

  //console.debug('is_crossDomain('+url+') -> ' + result)
  return result
}

module.exports = {
  request:request,
  xhr: true  
};
};
BundleModuleCode['jam/mobi']=function (module,exports,global,process){
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
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: mobi.js,v 1.2 2017/05/27 18:20:36 sbosse Exp $
 **    $VERSION:     1.9.4
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Mobilityn Module
 **
 **    $ENDOFINFO
 */

var Comp = Require('com/compat');
var Net;

var options = {
  version:'1.9.2'
}

function addr2url(addr) {
  return typeof addr=='number'?String(addr):addr.address+':'+addr.port;
}

if (global.config.dos) Net=Require('dos/network');

var current=none;
var Aios = none;

/** Direction type; used with move and link? operations
 *  The link operation can eitehr return a boolean value or
 *  a list of reachable destiantions (PATH/IP only).
 *  NORTH, ..., are used for P2P connections only. 
 */
var DIRS= ['NORTH','SOUTH','WEST','EAST','LEFT','RIGHT','UP','DOWN','ORIGIN','NW','NE','SW','SE',
           'DELTA','RANGE','NODE','IP','PATH','CAP'];

/*

enum DIR = {
  NORTH , SOUTH , .. ,
  IP(ip:string) , .. 
  } : dir
tyoe dir = NORTH | SOUTH | .. | IP {tag,ip:string } | ..
*/
var DIR = {
  NORTH:'DIR.NORTH',
  SOUTH:'DIR.SOUTH',
  WEST:'DIR.WEST',
  EAST:'DIR.EAST',
  LEFT:'DIR.LEFT',
  RIGHT:'DIR.RIGHT',
  UP:'DIR.UP',
  DOWN:'DIR.DOWN',
  ORIGIN:'DIR.ORIGIN',
  NW:'DIR.NW',
  NE:'DIR.NE',
  SW:'DIR.SW',
  SE:'DIR.SE',
  // Assuming:  z-> x     N
  //            |        W+E  U(+z)/D(-z)
  //            v y       S
  DELTA: function (addr) { return {tag:"DIR.DELTA",delta:addr} },
  // Only for link? operation
  RANGE: function (r) { return {tag:"DIR.RANGE",radius:r} },  
  // Address a node (identifier name) directly
  NODE: function (node) { return {tag:"DIR.NODE",node:node} },
  IP:function (addr) { return {tag:"DIR.IP",ip:addr} },
  /*
  ** 
  ** Path can contain filter, e.g. range /distance[0-5], /distance[5], .. 
  ** or sets of destinations, e.g., /node*
  ** or a hopping array [dest1,dest2,..]
  ** type of path = string | string array
  */
  PATH:function (path) { return {tag:"DIR.PATH",path:path} },
  CAP:function (cap) { return {tag:"DIR.CAP",cap:cap} }
}

DIR.tag = {
  NORTH:'DIR.NORTH',
  SOUTH:'DIR.SOUTH',
  WEST:'DIR.WEST',
  EAST:'DIR.EAST',
  LEFT:'DIR.LEFT',
  RIGHT:'DIR.RIGHT',
  UP:'DIR.UP',
  DOWN:'DIR.DOWN',
  ORIGIN:'DIR.ORIGIN',
  NW:'DIR.NW',
  NE:'DIR.NE',
  SW:'DIR.SW',
  SE:'DIR.SE',
  DELTA:'DIR.DELTA',
  RANGE:'DIR.RANGE',
  NODE:'DIR.NODE',
  IP:'DIR.IP',
  PATH:'DIR.PATH',
  CAP:'DIR.CAP',
}
/** Back direction. In case of IP, the remote address on receiving agent code is used.
 */

function opposite (dir,next) {
  var chan;
  switch (dir.tag||dir) {
    case DIR.NORTH: return DIR.SOUTH;
    case DIR.SOUTH: return DIR.NORTH;
    case DIR.WEST:  return DIR.EAST;
    case DIR.EAST:  return DIR.WEST;
    case DIR.LEFT:  return DIR.RIGHT;
    case DIR.RIGHT: return DIR.LEFT;
    case DIR.UP:    return DIR.DOWN;
    case DIR.DOWN:  return DIR.UP;
    case DIR.NW:    return DIR.SE;
    case DIR.NE:    return DIR.SW;
    case DIR.SE:    return DIR.NW;
    case DIR.SW:    return DIR.NE;
    case DIR.tag.DELTA: 
      if (!next) return DIR.DELTA(dir.delta.map(function (v) {return -v}));
      else return;
    case DIR.tag.IP: 
      // try to use current process back attribute containing remote IP address upon receiving
      if (current.process && current.process.back && current.process.back.tag==DIR.tag.IP) return current.process.back;
      else return none;
    case DIR.tag.NODE:
      // try to use current process back attribute containing remote IP address upon receiving
      if (current.process && current.process.back) {
        switch (current.process.back.tag) {
          case DIR.tag.IP: 
            // Try to resolve node name
            if (current.node && current.node.connections.ip && current.node.connections.ip.reverse) 
              return DIR.NODE(current.node.connections.ip.reverse(current.process.back.ip));
            else 
              return current.process.back;
          case DIR.tag.NODE: 
            return current.process.back;
          default:
            return none;
        }
      } else return none;
    
    case 'DIR.PATH': 
      // TODO: this node name/path!
      return none;
    case 'DIR.CAP': 
      // TODO: this node capability!
      return none;
    default: 
      return none;
  }
};

// Create a valid DIR compatible type from a lowercase name specifier (e.g., north -> DIR.NORTH
DIR.from = function (name) {
  var Dir=name.toUpperCase();
  if (DIRS.indexOf(Dir) == -1) return;
  return {tag:'DIR.'+Dir}
}
// Create a valid lowercase name specifier from DIR (e.g. DIR.NORTH -> north)
DIR.to = function (dir) {
  if ((dir.tag||dir).substr(0,4)!='DIR.') return;
  return (dir.tag||dir).substr(4).toLowerCase();
}

DIR.isDir = function (o) {
  return (o.tag||o).indexOf('DIR')==0;
}
DIR.opposite=opposite;
DIR.print = function (dir) {
  if (!dir) return 'undefined';
  var name=(dir.tag||dir).substring(4);
  switch (dir.tag||dir) {
    case 'DIR.DELTA':
      return name+'('+Comp.printf.list(dir.delta)+')';
    case 'DIR.RANGE':
      return name+'('+dir.radius+')';
    case 'DIR.NODE':
      return name+'('+dir.node+')';
    case 'DIR.IP': 
      return name+'('+(dir.ip==undefined?'*':dir.ip)+')';
    case 'DIR.PATH': 
      return name+'('+dir.path+')';
    case 'DIR.CAP':
      return name+'('+dir.cao+')';
    default:
      if (!dir.ip) return name
      else return name+'('+addr2url(dir.ip)+')';
  }
};
DIR.toString = function (dir) {
  function format(ip) {
    if (ip==undefined) return '';
    if (typeof ip == 'number') return ip;
    if (typeof ip == 'string') return '"'+ip+'"';
  }
  switch (dir.tag) {
    case DIR.NORTH: return 'DIR.North('+format(dir.ip)+')';
    case DIR.SOUTH: return 'DIR.South('+format(dir.ip)+')';
    case DIR.WEST:  return 'DIR.West('+format(dir.ip)+')';
    case DIR.EAST:  return 'DIR.East('+format(dir.ip)+')';
    case DIR.tag.IP:    return 'DIR.IP('+format(dir.ip)+')';
  }
  return dir;
}
/** Search a channel that is connected to node 'destnode'
 *
 */
function lookup(node,destnode) {
  var chan,path;
  if (node.connections.ip && node.connections.ip.lookup) {
    path=node.connections.ip.lookup(destnode);
    if (path) return {chan:node.connections.ip,dest:path};
  }
}

/** Move current agent to new node 
 *
 */
function move(dir) {
  var node1=current.node,
      chan=none,
      dest,
      stat,
      path,
      alive = function () {return 1},
      nokill=false,
      name=DIR.to(dir),
      msg;
  switch (dir.tag||dir) {
    case 'DIR.IP':    
      chan=node1.connections.ip; 
      dest=dir.ip; 
      break;
    case 'DIR.DELTA':
      current.process.dir=Comp.obj.copy(dir);
      if (dir.delta[0]>0 && node1.connections.east && node1.connections.east.status()) 
        current.process.dir.delta[0]--,chan=node1.connections.east;
      else if (dir.delta[0]<0 && node1.connections.west && node1.connections.west.status()) 
        current.process.dir.delta[0]++,chan=node1.connections.west;
      else if (dir.delta[1]>0 && node1.connections.south && node1.connections.south.status()) 
        current.process.dir.delta[1]--,chan=node1.connections.south;
      else if (dir.delta[1]<0 && node1.connections.north && node1.connections.north.status()) 
        current.process.dir.delta[1]++,chan=node1.connections.north;
      else if (dir.delta[2]>0 && node1.connections.up && node1.connections.up.status()) 
        current.process.dir.delta[2]--,chan=node1.connections.up;
      else if (dir.delta[2]<0 && node1.connections.down && node1.connections.down.status()) 
        current.process.dir.delta[2]++,chan=node1.connections.down;
      break;
    case 'DIR.NODE':
      if (node1.connections.range && 
          node1.connections.range[dir.node] && 
          node1.connections.range[dir.node].status()) 
        chan=node1.connections.range[dir.node],dest=dir.node;
      else {
        // Find node name -> channel mapping
        dest=lookup(node1,dir.node); 
        if (dest) chan=dest.chan,dest=dest.dest;
      }
      break;
    case 'DIR.PATH':
      // TODO
      // if (!current.network) {current.error='No connection to path '+dir.path; throw 'MOVE'};
      if (Comp.obj.isArray(dir.path)) {
        path=Comp.array.pop(dir.path);
      } else path = dir.path;
      chan=node1.connections.path; dest=path; 
      nokill=true;
      break;
    case 'DIR.CAP':
      // TODO
      if (!current.network) {current.error='No connection to server '+dir.cap; throw 'MOVE'};
      chan=node1.connections.dos; dest=Net.Parse.capability(dir.cap).cap; 
      nokill=true; 
      break;
    default:
      if (!name) {
        current.error='ENOCHANNEL';
        throw 'MOVE';
      }
      chan=node1.connections[name];
  }
  // print(node1.connections);
  // print(chan)
  if (chan==none || !chan.status(dest)) {
    current.error='No connection to direction '+DIR.print(dir); throw 'MOVE'
  };
  
  if (!current.process.back) current.process.back=Aios.DIR.opposite(dir);
  node1.stats.migrate++;
    
  if (Aios.options.fastcopy && chan.virtual) msg=Aios.Code.toObject(current.process);
  else msg=Aios.Code.ofCode(current.process,false);
  
  current.process.move=dir;

  /* NEWCOMM | context is current process !!!! */ 
  chan.send({agent:msg,to:dest,context:current.process});
  // kill or supend ghost agent
  if (!nokill) current.process.kill=true;       // discard process now
  else         current.process.suspended=true;  // discard process after send op finished
  //print(current.process.print());

}

module.exports = {
  agent:{
    move:move,
    opposite:opposite,
    DIR:DIR
  },
  current:function (module) { current=module.current; Aios=module; },
  DIR:DIR,
  DIRS:DIRS,
  options:options
}
};
BundleModuleCode['jam/watchdog']=function (module,exports,global,process){
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
 **    $CREATED:     6-12-17 by sbosse.
 **    $RCS:         $Id: sandbox.js,v 1.1 2017/05/20 15:56:53 sbosse Exp $
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 **  JavaScript AIOS native platform Watchdog Interface
 **
 **
 **   A watchdog provides a timer and some kind of protected envrionment executing a function.
 **   If the function execution time exceeds the timeout of the timer, an exception is thrown (pre-emptive).
 **   This exception can be handled by a scheduler for round-robinson scheduling.
 **   There are different watchdog functionalities provided by different JS VM platforms:
 **
 **   1A. Full (jvm) {start,stop}
 **   1B. Full (jxcore+,pl3) {start,stop,protect}
 **   2. Protected (Node + watchdog.node module) {start, stop, protect}
 **   3. Partial with injected checkpointing (jxcore) {start, stop, checkpoint}
 **   4. No (generic node, browser) {}
 **
 **    $ENDOFINFO
 */
var Fs = Require('fs');
function search(index,module) {
  if (PATH.length==index) return module;
  var path=PATH[index];
  if (Fs.existsSync(path+'/'+module)) return path+'/'+module;
  else return search(index+1,module);
}

try {
  var watchdog;
  try {watchdog = process && process.binding && process.binding && process.binding('watchdog')} catch (e){}; // JX/JX+
  if (!watchdog) watchdog = process && process.watchdog; // JX+
  if (!watchdog && process && process.startWatchdog) watchdog={
    // JVM
    start:process.startWatchdog,
    stop:process.stopWatchdog,
    init:process.initWatchdog,
    tick:process.tick
  };
  if (!watchdog && process && process.version && Fs) {
    // NODE
    var nativePath,platformVersion;
    if (process.version.match(/^v0.12/)) platformVersion="0.12";
    else if (process.version.match(/^v3/)) platformVersion="3.x";
    else if (process.version.match(/^v4/)) platformVersion="4.x";
    else if (process.version.match(/^v5/)) platformVersion="5.x";
    else if (process.version.match(/^v6/)) platformVersion="6.x";
    else if (process.version.match(/^v7/)) platformVersion="7.x";
    else if (process.version.match(/^v8/)) platformVersion="8.x";
    else if (process.version.match(/^v9/)) platformVersion="9.x";
    if (platformVersion && process.platform && process.arch)
      nativePath = 'native/'+process.platform+'/'+platformVersion+'/' + process.arch + '/watchdog'; 
    if (PATH)  
    if (nativePath) watchdog = require(nativePath);
  }
} catch (e) {
    
}

if (watchdog) {
  module.exports={
    start:watchdog.start||watchdog.startWatchdog,
    stop:watchdog.stop||watchdog.stopWatchdog,
    init:watchdog.init||watchdog.initWatchdog,
    checkPoint:watchdog.checkPoint,
    tick:watchdog.tick,
    protect:watchdog.protect
  }
} else module=undefined;
};
BundleModuleCode['parser/esprima']=function (module,exports,global,process){
/*
  Copyright (c) jQuery Foundation, Inc. and Contributors, All Rights Reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  
  $Id: esprima.js,v 1.3 2017/06/08 15:41:11 sbosse Exp sbosse $
*/

(function (root, factory) {
    'use strict';

    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js,
    // Rhino, and plain browser loading.

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.esprima = {}));
    }
}(this, function (exports) {
    'use strict';

    var Token,
        TokenName,
        FnExprTokens,
        Syntax,
        PlaceHolders,
        Messages,
        Regex,
        source,
        strict,
        index,
        lineNumber,
        lineStart,
        hasLineTerminator,
        lastIndex,
        lastLineNumber,
        lastLineStart,
        startIndex,
        startLineNumber,
        startLineStart,
        scanning,
        length,
        lookahead,
        state,
        extra,
        isBindingElement,
        isAssignmentTarget,
        firstCoverInitializedNameError;

    Token = {
        BooleanLiteral: 1,
        EOF: 2,
        Identifier: 3,
        Keyword: 4,
        NullLiteral: 5,
        NumericLiteral: 6,
        Punctuator: 7,
        StringLiteral: 8,
        RegularExpression: 9,
        Template: 10
    };

    TokenName = {};
    TokenName[Token.BooleanLiteral] = 'Boolean';
    TokenName[Token.EOF] = '<end>';
    TokenName[Token.Identifier] = 'Identifier';
    TokenName[Token.Keyword] = 'Keyword';
    TokenName[Token.NullLiteral] = 'Null';
    TokenName[Token.NumericLiteral] = 'Numeric';
    TokenName[Token.Punctuator] = 'Punctuator';
    TokenName[Token.StringLiteral] = 'String';
    TokenName[Token.RegularExpression] = 'RegularExpression';
    TokenName[Token.Template] = 'Template';

    // A function following one of those tokens is an expression.
    FnExprTokens = ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
                    'return', 'case', 'delete', 'throw', 'void',
                    // assignment operators
                    '=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '>>>=',
                    '&=', '|=', '^=', ',',
                    // binary/unary operators
                    '+', '-', '*', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
                    '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
                    '<=', '<', '>', '!=', '!=='];

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        AssignmentPattern: 'AssignmentPattern',
        ArrayExpression: 'ArrayExpression',
        ArrayPattern: 'ArrayPattern',
        ArrowFunctionExpression: 'ArrowFunctionExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ClassBody: 'ClassBody',
        ClassDeclaration: 'ClassDeclaration',
        ClassExpression: 'ClassExpression',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExportAllDeclaration: 'ExportAllDeclaration',
        ExportDefaultDeclaration: 'ExportDefaultDeclaration',
        ExportNamedDeclaration: 'ExportNamedDeclaration',
        ExportSpecifier: 'ExportSpecifier',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForOfStatement: 'ForOfStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        ImportDeclaration: 'ImportDeclaration',
        ImportDefaultSpecifier: 'ImportDefaultSpecifier',
        ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
        ImportSpecifier: 'ImportSpecifier',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        MetaProperty: 'MetaProperty',
        MethodDefinition: 'MethodDefinition',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        ObjectPattern: 'ObjectPattern',
        Program: 'Program',
        Property: 'Property',
        RestElement: 'RestElement',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SpreadElement: 'SpreadElement',
        Super: 'Super',
        SwitchCase: 'SwitchCase',
        SwitchStatement: 'SwitchStatement',
        TaggedTemplateExpression: 'TaggedTemplateExpression',
        TemplateElement: 'TemplateElement',
        TemplateLiteral: 'TemplateLiteral',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement',
        YieldExpression: 'YieldExpression'
    };

    PlaceHolders = {
        ArrowParameterPlaceHolder: 'ArrowParameterPlaceHolder'
    };

    // Error messages should be identical to V8.
    Messages = {
        UnexpectedToken: 'Unexpected token %0',
        UnexpectedNumber: 'Unexpected number',
        UnexpectedString: 'Unexpected string',
        UnexpectedIdentifier: 'Unexpected identifier',
        UnexpectedReserved: 'Unexpected reserved word',
        UnexpectedTemplate: 'Unexpected quasi %0',
        UnexpectedEOS: 'Unexpected end of input',
        NewlineAfterThrow: 'Illegal newline after throw',
        InvalidRegExp: 'Invalid regular expression',
        UnterminatedRegExp: 'Invalid regular expression: missing /',
        InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
        InvalidLHSInForIn: 'Invalid left-hand side in for-in',
        InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
        MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
        NoCatchOrFinally: 'Missing catch or finally after try',
        UnknownLabel: 'Undefined label \'%0\'',
        Redeclaration: '%0 \'%1\' has already been declared',
        IllegalContinue: 'Illegal continue statement',
        IllegalBreak: 'Illegal break statement',
        IllegalReturn: 'Illegal return statement',
        StrictModeWith: 'Strict mode code may not include a with statement',
        StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
        StrictVarName: 'Variable name may not be eval or arguments in strict mode',
        StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
        StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
        StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
        StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
        StrictDelete: 'Delete of an unqualified identifier in strict mode.',
        StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
        StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
        StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
        StrictReservedWord: 'Use of future reserved word in strict mode',
        TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
        ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
        DefaultRestParameter: 'Unexpected token =',
        ObjectPatternAsRestParameter: 'Unexpected token {',
        DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
        ConstructorSpecialMethod: 'Class constructor may not be an accessor',
        DuplicateConstructor: 'A class may only have one constructor',
        StaticPrototype: 'Classes may not have static property named prototype',
        MissingFromClause: 'Unexpected token',
        NoAsAfterImportNamespace: 'Unexpected token',
        InvalidModuleSpecifier: 'Unexpected token',
        IllegalImportDeclaration: 'Unexpected token',
        IllegalExportDeclaration: 'Unexpected token',
        DuplicateBinding: 'Duplicate binding %0'
    };

    // See also tools/generate-unicode-regex.js.
    Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,

        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    // Ensure the condition is true, otherwise throw an error.
    // This is only to have a better contract semantic, i.e. another safety net
    // to catch a logic error. The condition shall be fulfilled in normal case.
    // Do NOT use this to enforce a certain condition on any user input.

    function assert(condition, message) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error('ASSERT: ' + message);
        }
    }

    function isDecimalDigit(ch) {
        return (ch >= 0x30 && ch <= 0x39);   // 0..9
    }

    function isHexDigit(ch) {
        return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
    }

    function isOctalDigit(ch) {
        return '01234567'.indexOf(ch) >= 0;
    }

    function octalToDecimal(ch) {
        // \0 is not octal escape sequence
        var octal = (ch !== '0'), code = '01234567'.indexOf(ch);

        if (index < length && isOctalDigit(source[index])) {
            octal = true;
            code = code * 8 + '01234567'.indexOf(source[index++]);

            // 3 digits are only allowed when string starts
            // with 0, 1, 2, 3
            if ('0123'.indexOf(ch) >= 0 &&
                    index < length &&
                    isOctalDigit(source[index])) {
                code = code * 8 + '01234567'.indexOf(source[index++]);
            }
        }

        return {
            code: code,
            octal: octal
        };
    }

    // ECMA-262 11.2 White Space

    function isWhiteSpace(ch) {
        return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
    }

    // ECMA-262 11.3 Line Terminators

    function isLineTerminator(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
    }

    // ECMA-262 11.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        return (cp < 0x10000) ? String.fromCharCode(cp) :
            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
            String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
    }

    function isIdentifierStart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch)));
    }

    function isIdentifierPart(ch) {
        return (ch === 0x24) || (ch === 0x5F) ||  // $ (dollar) and _ (underscore)
            (ch >= 0x41 && ch <= 0x5A) ||         // A..Z
            (ch >= 0x61 && ch <= 0x7A) ||         // a..z
            (ch >= 0x30 && ch <= 0x39) ||         // 0..9
            (ch === 0x5C) ||                      // \ (backslash)
            ((ch >= 0x80) && Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch)));
    }

    // ECMA-262 11.6.2.2 Future Reserved Words

    function isFutureReservedWord(id) {
        switch (id) {
        case 'enum':
        case 'export':
        case 'import':
        case 'super':
            return true;
        default:
            return false;
        }
    }

    function isStrictModeReservedWord(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'yield':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    // ECMA-262 11.6.2.1 Keywords

    function isKeyword(id) {
        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') ||
                   (id === 'try') || (id === 'let');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    // ECMA-262 11.4 Comments

    function addComment(type, value, start, end, loc) {
        var comment;

        assert(typeof start === 'number', 'Comment must have valid position');

        state.lastCommentStart = start;

        comment = {
            type: type,
            value: value
        };
        if (extra.range) {
            comment.range = [start, end];
        }
        if (extra.loc) {
            comment.loc = loc;
        }
        extra.comments.push(comment);
        if (extra.attachComment) {
            extra.leadingComments.push(comment);
            extra.trailingComments.push(comment);
        }
        if (extra.tokenize) {
            comment.type = comment.type + 'Comment';
            if (extra.delegate) {
                comment = extra.delegate(comment);
            }
            extra.tokens.push(comment);
        }
    }

    function skipSingleLineComment(offset) {
        var start, loc, ch, comment;

        start = index - offset;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart - offset
            }
        };

        while (index < length) {
            ch = source.charCodeAt(index);
            ++index;
            if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                if (extra.comments) {
                    comment = source.slice(start + offset, index - 1);
                    loc.end = {
                        line: lineNumber,
                        column: index - lineStart - 1
                    };
                    addComment('Line', comment, start, index - 1, loc);
                }
                if (ch === 13 && source.charCodeAt(index) === 10) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                return;
            }
        }

        if (extra.comments) {
            comment = source.slice(start + offset, index);
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            addComment('Line', comment, start, index, loc);
        }
    }

    function skipMultiLineComment() {
        var start, loc, ch, comment;

        if (extra.comments) {
            start = index - 2;
            loc = {
                start: {
                    line: lineNumber,
                    column: index - lineStart - 2
                }
            };
        }

        while (index < length) {
            ch = source.charCodeAt(index);
            if (isLineTerminator(ch)) {
                if (ch === 0x0D && source.charCodeAt(index + 1) === 0x0A) {
                    ++index;
                }
                hasLineTerminator = true;
                ++lineNumber;
                ++index;
                lineStart = index;
            } else if (ch === 0x2A) {
                // Block comment ends with '*/'.
                if (source.charCodeAt(index + 1) === 0x2F) {
                    ++index;
                    ++index;
                    if (extra.comments) {
                        comment = source.slice(start + 2, index - 2);
                        loc.end = {
                            line: lineNumber,
                            column: index - lineStart
                        };
                        addComment('Block', comment, start, index, loc);
                    }
                    return;
                }
                ++index;
            } else {
                ++index;
            }
        }

        // Ran off the end of the file - the whole thing is a comment
        if (extra.comments) {
            loc.end = {
                line: lineNumber,
                column: index - lineStart
            };
            comment = source.slice(start + 2, index);
            addComment('Block', comment, start, index, loc);
        }
        tolerateUnexpectedToken();
    }

    function skipComment() {
        var ch, start;
        hasLineTerminator = false;

        start = (index === 0);
        while (index < length) {
            ch = source.charCodeAt(index);

            if (isWhiteSpace(ch)) {
                ++index;
            } else if (isLineTerminator(ch)) {
                hasLineTerminator = true;
                ++index;
                if (ch === 0x0D && source.charCodeAt(index) === 0x0A) {
                    ++index;
                }
                ++lineNumber;
                lineStart = index;
                start = true;
            } else if (ch === 0x2F) { // U+002F is '/'
                ch = source.charCodeAt(index + 1);
                if (ch === 0x2F) {
                    ++index;
                    ++index;
                    skipSingleLineComment(2);
                    start = true;
                } else if (ch === 0x2A) {  // U+002A is '*'
                    ++index;
                    ++index;
                    skipMultiLineComment();
                } else {
                    break;
                }
            } else if (start && ch === 0x2D) { // U+002D is '-'
                // U+003E is '>'
                if ((source.charCodeAt(index + 1) === 0x2D) && (source.charCodeAt(index + 2) === 0x3E)) {
                    // '-->' is a single-line comment
                    index += 3;
                    skipSingleLineComment(3);
                } else {
                    break;
                }
            } else if (ch === 0x3C) { // U+003C is '<'
                if (source.slice(index + 1, index + 4) === '!--') {
                    ++index; // `<`
                    ++index; // `!`
                    ++index; // `-`
                    ++index; // `-`
                    skipSingleLineComment(4);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function scanHexEscape(prefix) {
        var i, len, ch, code = 0;

        len = (prefix === 'u') ? 4 : 2;
        for (i = 0; i < len; ++i) {
            if (index < length && isHexDigit(source[index])) {
                ch = source[index++];
                code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
            } else {
                return '';
            }
        }
        return String.fromCharCode(code);
    }

    function scanUnicodeCodePointEscape() {
        var ch, code;

        ch = source[index];
        code = 0;

        // At least, one hex digit is required.
        if (ch === '}') {
            throwUnexpectedToken();
        }

        while (index < length) {
            ch = source[index++];
            if (!isHexDigit(ch)) {
                break;
            }
            code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
        }

        if (code > 0x10FFFF || ch !== '}') {
            throwUnexpectedToken();
        }

        return fromCodePoint(code);
    }

    function codePointAt(i) {
        var cp, first, second;

        cp = source.charCodeAt(i);
        if (cp >= 0xD800 && cp <= 0xDBFF) {
            second = source.charCodeAt(i + 1);
            if (second >= 0xDC00 && second <= 0xDFFF) {
                first = cp;
                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
            }
        }

        return cp;
    }

    function getComplexIdentifier() {
        var cp, ch, id;

        cp = codePointAt(index);
        id = fromCodePoint(cp);
        index += id.length;

        // '\u' (U+005C, U+0075) denotes an escaped character.
        if (cp === 0x5C) {
            if (source.charCodeAt(index) !== 0x75) {
                throwUnexpectedToken();
            }
            ++index;
            if (source[index] === '{') {
                ++index;
                ch = scanUnicodeCodePointEscape();
            } else {
                ch = scanHexEscape('u');
                cp = ch.charCodeAt(0);
                if (!ch || ch === '\\' || !isIdentifierStart(cp)) {
                    throwUnexpectedToken();
                }
            }
            id = ch;
        }

        while (index < length) {
            cp = codePointAt(index);
            if (!isIdentifierPart(cp)) {
                break;
            }
            ch = fromCodePoint(cp);
            id += ch;
            index += ch.length;

            // '\u' (U+005C, U+0075) denotes an escaped character.
            if (cp === 0x5C) {
                id = id.substr(0, id.length - 1);
                if (source.charCodeAt(index) !== 0x75) {
                    throwUnexpectedToken();
                }
                ++index;
                if (source[index] === '{') {
                    ++index;
                    ch = scanUnicodeCodePointEscape();
                } else {
                    ch = scanHexEscape('u');
                    cp = ch.charCodeAt(0);
                    if (!ch || ch === '\\' || !isIdentifierPart(cp)) {
                        throwUnexpectedToken();
                    }
                }
                id += ch;
            }
        }

        return id;
    }

    function getIdentifier() {
        var start, ch;

        start = index++;
        while (index < length) {
            ch = source.charCodeAt(index);
            if (ch === 0x5C) {
                // Blackslash (U+005C) marks Unicode escape sequence.
                index = start;
                return getComplexIdentifier();
            } else if (ch >= 0xD800 && ch < 0xDFFF) {
                // Need to handle surrogate pairs.
                index = start;
                return getComplexIdentifier();
            }
            if (isIdentifierPart(ch)) {
                ++index;
            } else {
                break;
            }
        }

        return source.slice(start, index);
    }

    function scanIdentifier() {
        var start, id, type;

        start = index;

        // Backslash (U+005C) starts an escaped character.
        id = (source.charCodeAt(index) === 0x5C) ? getComplexIdentifier() : getIdentifier();

        // There is no keyword or literal with only one character.
        // Thus, it must be an identifier.
        if (id.length === 1) {
            type = Token.Identifier;
        } else if (isKeyword(id)) {
            type = Token.Keyword;
        } else if (id === 'null') {
            type = Token.NullLiteral;
        } else if (id === 'true' || id === 'false') {
            type = Token.BooleanLiteral;
        } else {
            type = Token.Identifier;
        }

        return {
            type: type,
            value: id,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }


    // ECMA-262 11.7 Punctuators

    function scanPunctuator() {
        var token, str;

        token = {
            type: Token.Punctuator,
            value: '',
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: index,
            end: index
        };

        // Check for most common single-character punctuators.
        str = source[index];
        switch (str) {

        case '(':
            if (extra.tokenize) {
                extra.openParenToken = extra.tokenValues.length;
            }
            ++index;
            break;

        case '{':
            if (extra.tokenize) {
                extra.openCurlyToken = extra.tokenValues.length;
            }
            state.curlyStack.push('{');
            ++index;
            break;

        case '.':
            ++index;
            if (source[index] === '.' && source[index + 1] === '.') {
                // Spread operator: ...
                index += 2;
                str = '...';
            }
            break;

        case '}':
            ++index;
            state.curlyStack.pop();
            break;
        case ')':
        case ';':
        case ',':
        case '[':
        case ']':
        case ':':
        case '?':
        case '~':
            ++index;
            break;

        default:
            // 4-character punctuator.
            str = source.substr(index, 4);
            if (str === '>>>=') {
                index += 4;
            } else {

                // 3-character punctuators.
                str = str.substr(0, 3);
                if (str === '===' || str === '!==' || str === '>>>' ||
                    str === '<<=' || str === '>>=') {
                    index += 3;
                } else {

                    // 2-character punctuators.
                    str = str.substr(0, 2);
                    if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
                        str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
                        str === '++' || str === '--' || str === '<<' || str === '>>' ||
                        str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
                        str === '<=' || str === '>=' || str === '=>') {
                        index += 2;
                    } else {

                        // 1-character punctuators.
                        str = source[index];
                        if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
                            ++index;
                        }
                    }
                }
            }
        }

        if (index === token.start) {
            throwUnexpectedToken();
        }

        token.end = index;
        token.value = str;
        return token;
    }

    // ECMA-262 11.8.3 Numeric Literals

    function scanHexLiteral(start) {
        var number = '';

        while (index < length) {
            if (!isHexDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt('0x' + number, 16),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanBinaryLiteral(start) {
        var ch, number;

        number = '';

        while (index < length) {
            ch = source[index];
            if (ch !== '0' && ch !== '1') {
                break;
            }
            number += source[index++];
        }

        if (number.length === 0) {
            // only 0b or 0B
            throwUnexpectedToken();
        }

        if (index < length) {
            ch = source.charCodeAt(index);
            /* istanbul ignore else */
            if (isIdentifierStart(ch) || isDecimalDigit(ch)) {
                throwUnexpectedToken();
            }
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 2),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function scanOctalLiteral(prefix, start) {
        var number, octal;

        if (isOctalDigit(prefix)) {
            octal = true;
            number = '0' + source[index++];
        } else {
            octal = false;
            ++index;
            number = '';
        }

        while (index < length) {
            if (!isOctalDigit(source[index])) {
                break;
            }
            number += source[index++];
        }

        if (!octal && number.length === 0) {
            // only 0o or 0O
            throwUnexpectedToken();
        }

        if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseInt(number, 8),
            octal: octal,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    function isImplicitOctalLiteral() {
        var i, ch;

        // Implicit octal, unless there is a non-octal digit.
        // (Annex B.1.1 on Numeric Literals)
        for (i = index + 1; i < length; ++i) {
            ch = source[i];
            if (ch === '8' || ch === '9') {
                return false;
            }
            if (!isOctalDigit(ch)) {
                return true;
            }
        }

        return true;
    }

    function scanNumericLiteral() {
        var number, start, ch;

        ch = source[index];
        assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
            'Numeric literal must start with a decimal digit or a decimal point');

        start = index;
        number = '';
        if (ch !== '.') {
            number = source[index++];
            ch = source[index];

            // Hex number starts with '0x'.
            // Octal number starts with '0'.
            // Octal number in ES6 starts with '0o'.
            // Binary number in ES6 starts with '0b'.
            if (number === '0') {
                if (ch === 'x' || ch === 'X') {
                    ++index;
                    return scanHexLiteral(start);
                }
                if (ch === 'b' || ch === 'B') {
                    ++index;
                    return scanBinaryLiteral(start);
                }
                if (ch === 'o' || ch === 'O') {
                    return scanOctalLiteral(ch, start);
                }

                if (isOctalDigit(ch)) {
                    if (isImplicitOctalLiteral()) {
                        return scanOctalLiteral(ch, start);
                    }
                }
            }

            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === '.') {
            number += source[index++];
            while (isDecimalDigit(source.charCodeAt(index))) {
                number += source[index++];
            }
            ch = source[index];
        }

        if (ch === 'e' || ch === 'E') {
            number += source[index++];

            ch = source[index];
            if (ch === '+' || ch === '-') {
                number += source[index++];
            }
            if (isDecimalDigit(source.charCodeAt(index))) {
                while (isDecimalDigit(source.charCodeAt(index))) {
                    number += source[index++];
                }
            } else {
                throwUnexpectedToken();
            }
        }

        if (isIdentifierStart(source.charCodeAt(index))) {
            throwUnexpectedToken();
        }

        return {
            type: Token.NumericLiteral,
            value: parseFloat(number),
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.4 String Literals

    function scanStringLiteral() {
        var str = '', quote, start, ch, unescaped, octToDec, octal = false;

        quote = source[index];
        assert((quote === '\'' || quote === '"'),
            'String literal must starts with a quote');

        start = index;
        ++index;

        while (index < length) {
            ch = source[index++];

            if (ch === quote) {
                quote = '';
                break;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            str += scanUnicodeCodePointEscape();
                        } else {
                            unescaped = scanHexEscape(ch);
                            if (!unescaped) {
                                throw throwUnexpectedToken();
                            }
                            str += unescaped;
                        }
                        break;
                    case 'n':
                        str += '\n';
                        break;
                    case 'r':
                        str += '\r';
                        break;
                    case 't':
                        str += '\t';
                        break;
                    case 'b':
                        str += '\b';
                        break;
                    case 'f':
                        str += '\f';
                        break;
                    case 'v':
                        str += '\x0B';
                        break;
                    case '8':
                    case '9':
                        str += ch;
                        tolerateUnexpectedToken();
                        break;

                    default:
                        if (isOctalDigit(ch)) {
                            octToDec = octalToDecimal(ch);

                            octal = octToDec.octal || octal;
                            str += String.fromCharCode(octToDec.code);
                        } else {
                            str += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                break;
            } else {
                str += ch;
            }
        }

        if (quote !== '') {
            throwUnexpectedToken();
        }

        return {
            type: Token.StringLiteral,
            value: str,
            octal: octal,
            lineNumber: startLineNumber,
            lineStart: startLineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.6 Template Literal Lexical Components

    function scanTemplate() {
        var cooked = '', ch, start, rawOffset, terminated, head, tail, restore, unescaped;

        terminated = false;
        tail = false;
        start = index;
        head = (source[index] === '`');
        rawOffset = 2;

        ++index;

        while (index < length) {
            ch = source[index++];
            if (ch === '`') {
                rawOffset = 1;
                tail = true;
                terminated = true;
                break;
            } else if (ch === '$') {
                if (source[index] === '{') {
                    state.curlyStack.push('${');
                    ++index;
                    terminated = true;
                    break;
                }
                cooked += ch;
            } else if (ch === '\\') {
                ch = source[index++];
                if (!isLineTerminator(ch.charCodeAt(0))) {
                    switch (ch) {
                    case 'n':
                        cooked += '\n';
                        break;
                    case 'r':
                        cooked += '\r';
                        break;
                    case 't':
                        cooked += '\t';
                        break;
                    case 'u':
                    case 'x':
                        if (source[index] === '{') {
                            ++index;
                            cooked += scanUnicodeCodePointEscape();
                        } else {
                            restore = index;
                            unescaped = scanHexEscape(ch);
                            if (unescaped) {
                                cooked += unescaped;
                            } else {
                                index = restore;
                                cooked += ch;
                            }
                        }
                        break;
                    case 'b':
                        cooked += '\b';
                        break;
                    case 'f':
                        cooked += '\f';
                        break;
                    case 'v':
                        cooked += '\v';
                        break;

                    default:
                        if (ch === '0') {
                            if (isDecimalDigit(source.charCodeAt(index))) {
                                // Illegal: \01 \02 and so on
                                throwError(Messages.TemplateOctalLiteral);
                            }
                            cooked += '\0';
                        } else if (isOctalDigit(ch)) {
                            // Illegal: \1 \2
                            throwError(Messages.TemplateOctalLiteral);
                        } else {
                            cooked += ch;
                        }
                        break;
                    }
                } else {
                    ++lineNumber;
                    if (ch === '\r' && source[index] === '\n') {
                        ++index;
                    }
                    lineStart = index;
                }
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                ++lineNumber;
                if (ch === '\r' && source[index] === '\n') {
                    ++index;
                }
                lineStart = index;
                cooked += '\n';
            } else {
                cooked += ch;
            }
        }

        if (!terminated) {
            throwUnexpectedToken();
        }

        if (!head) {
            state.curlyStack.pop();
        }

        return {
            type: Token.Template,
            value: {
                cooked: cooked,
                raw: source.slice(start + 1, index - rawOffset)
            },
            head: head,
            tail: tail,
            lineNumber: lineNumber,
            lineStart: lineStart,
            start: start,
            end: index
        };
    }

    // ECMA-262 11.8.5 Regular Expression Literals

    function testRegExp(pattern, flags) {
        // The BMP character to use as a replacement for astral symbols when
        // translating an ES6 "u"-flagged pattern to an ES5-compatible
        // approximation.
        // Note: replacing with '\uFFFF' enables false positives in unlikely
        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
        // pattern that would not be detected by this substitution.
        var astralSubstitute = '\uFFFF',
            tmp = pattern;

        if (flags.indexOf('u') >= 0) {
            tmp = tmp
                // Replace every Unicode escape sequence with the equivalent
                // BMP character or a constant ASCII code point in the case of
                // astral symbols. (See the above note on `astralSubstitute`
                // for more information.)
                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
                    var codePoint = parseInt($1 || $2, 16);
                    if (codePoint > 0x10FFFF) {
                        throwUnexpectedToken(null, Messages.InvalidRegExp);
                    }
                    if (codePoint <= 0xFFFF) {
                        return String.fromCharCode(codePoint);
                    }
                    return astralSubstitute;
                })
                // Replace each paired surrogate with a single ASCII symbol to
                // avoid throwing on regular expressions that are only valid in
                // combination with the "u" flag.
                .replace(
                    /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
                    astralSubstitute
                );
        }

        // First, detect invalid regular expressions.
        try {
            RegExp(tmp);
        } catch (e) {
            throwUnexpectedToken(null, Messages.InvalidRegExp);
        }

        // Return a regular expression object for this pattern-flag pair, or
        // `null` in case the current environment doesn't support the flags it
        // uses.
        try {
            return new RegExp(pattern, flags);
        } catch (exception) {
            return null;
        }
    }

    function scanRegExpBody() {
        var ch, str, classMarker, terminated, body;

        ch = source[index];
        assert(ch === '/', 'Regular expression literal must start with a slash');
        str = source[index++];

        classMarker = false;
        terminated = false;
        while (index < length) {
            ch = source[index++];
            str += ch;
            if (ch === '\\') {
                ch = source[index++];
                // ECMA-262 7.8.5
                if (isLineTerminator(ch.charCodeAt(0))) {
                    throwUnexpectedToken(null, Messages.UnterminatedRegExp);
                }
                str += ch;
            } else if (isLineTerminator(ch.charCodeAt(0))) {
                throwUnexpectedToken(null, Messages.UnterminatedRegExp);
            } else if (classMarker) {
                if (ch === ']') {
                    classMarker = false;
                }
            } else {
                if (ch === '/') {
                    terminated = true;
                    break;
                } else if (ch === '[') {
                    classMarker = true;
                }
            }
        }

        if (!terminated) {
            throwUnexpectedToken(null, Messages.UnterminatedRegExp);
        }

        // Exclude leading and trailing slash.
        body = str.substr(1, str.length - 2);
        return {
            value: body,
            literal: str
        };
    }

    function scanRegExpFlags() {
        var ch, str, flags, restore;

        str = '';
        flags = '';
        while (index < length) {
            ch = source[index];
            if (!isIdentifierPart(ch.charCodeAt(0))) {
                break;
            }

            ++index;
            if (ch === '\\' && index < length) {
                ch = source[index];
                if (ch === 'u') {
                    ++index;
                    restore = index;
                    ch = scanHexEscape('u');
                    if (ch) {
                        flags += ch;
                        for (str += '\\u'; restore < index; ++restore) {
                            str += source[restore];
                        }
                    } else {
                        index = restore;
                        flags += 'u';
                        str += '\\u';
                    }
                    tolerateUnexpectedToken();
                } else {
                    str += '\\';
                    tolerateUnexpectedToken();
                }
            } else {
                flags += ch;
                str += ch;
            }
        }

        return {
            value: flags,
            literal: str
        };
    }

    function scanRegExp() {
        var start, body, flags, value;
        scanning = true;

        lookahead = null;
        skipComment();
        start = index;

        body = scanRegExpBody();
        flags = scanRegExpFlags();
        value = testRegExp(body.value, flags.value);
        scanning = false;
        if (extra.tokenize) {
            return {
                type: Token.RegularExpression,
                value: value,
                regex: {
                    pattern: body.value,
                    flags: flags.value
                },
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: start,
                end: index
            };
        }

        return {
            literal: body.literal + flags.literal,
            value: value,
            regex: {
                pattern: body.value,
                flags: flags.value
            },
            start: start,
            end: index
        };
    }

    function collectRegex() {
        var pos, loc, regex, token;

        skipComment();

        pos = index;
        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        regex = scanRegExp();

        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        /* istanbul ignore next */
        if (!extra.tokenize) {
            // Pop the previous token, which is likely '/' or '/='
            if (extra.tokens.length > 0) {
                token = extra.tokens[extra.tokens.length - 1];
                if (token.range[0] === pos && token.type === 'Punctuator') {
                    if (token.value === '/' || token.value === '/=') {
                        extra.tokens.pop();
                    }
                }
            }

            extra.tokens.push({
                type: 'RegularExpression',
                value: regex.literal,
                regex: regex.regex,
                range: [pos, index],
                loc: loc
            });
        }

        return regex;
    }

    function isIdentifierName(token) {
        return token.type === Token.Identifier ||
            token.type === Token.Keyword ||
            token.type === Token.BooleanLiteral ||
            token.type === Token.NullLiteral;
    }

    // Using the following algorithm:
    // https://github.com/mozilla/sweet.js/wiki/design

    function advanceSlash() {
        var regex, previous, check;

        function testKeyword(value) {
            return value && (value.length > 1) && (value[0] >= 'a') && (value[0] <= 'z');
        }

        previous = extra.tokenValues[extra.tokens.length - 1];
        regex = (previous !== null);

        switch (previous) {
        case 'this':
        case ']':
            regex = false;
            break;

        case ')':
            check = extra.tokenValues[extra.openParenToken - 1];
            regex = (check === 'if' || check === 'while' || check === 'for' || check === 'with');
            break;

        case '}':
            // Dividing a function by anything makes little sense,
            // but we have to check for that.
            regex = false;
            if (testKeyword(extra.tokenValues[extra.openCurlyToken - 3])) {
                // Anonymous function, e.g. function(){} /42
                check = extra.tokenValues[extra.openCurlyToken - 4];
                regex = check ? (FnExprTokens.indexOf(check) < 0) : false;
            } else if (testKeyword(extra.tokenValues[extra.openCurlyToken - 4])) {
                // Named function, e.g. function f(){} /42/
                check = extra.tokenValues[extra.openCurlyToken - 5];
                regex = check ? (FnExprTokens.indexOf(check) < 0) : true;
            }
        }

        return regex ? collectRegex() : scanPunctuator();
    }

    function advance() {
        var cp, token;

        if (index >= length) {
            return {
                type: Token.EOF,
                lineNumber: lineNumber,
                lineStart: lineStart,
                start: index,
                end: index
            };
        }

        cp = source.charCodeAt(index);

        if (isIdentifierStart(cp)) {
            token = scanIdentifier();
            if (strict && isStrictModeReservedWord(token.value)) {
                token.type = Token.Keyword;
            }
            return token;
        }

        // Very common: ( and ) and ;
        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
            return scanPunctuator();
        }

        // String literal starts with single quote (U+0027) or double quote (U+0022).
        if (cp === 0x27 || cp === 0x22) {
            return scanStringLiteral();
        }

        // Dot (.) U+002E can also start a floating-point number, hence the need
        // to check the next character.
        if (cp === 0x2E) {
            if (isDecimalDigit(source.charCodeAt(index + 1))) {
                return scanNumericLiteral();
            }
            return scanPunctuator();
        }

        if (isDecimalDigit(cp)) {
            return scanNumericLiteral();
        }

        // Slash (/) U+002F can also start a regex.
        if (extra.tokenize && cp === 0x2F) {
            return advanceSlash();
        }

        // Template literals start with ` (U+0060) for template head
        // or } (U+007D) for template middle or template tail.
        if (cp === 0x60 || (cp === 0x7D && state.curlyStack[state.curlyStack.length - 1] === '${')) {
            return scanTemplate();
        }

        // Possible identifier start in a surrogate pair.
        if (cp >= 0xD800 && cp < 0xDFFF) {
            cp = codePointAt(index);
            if (isIdentifierStart(cp)) {
                return scanIdentifier();
            }
        }

        return scanPunctuator();
    }

    function collectToken() {
        var loc, token, value, entry;

        loc = {
            start: {
                line: lineNumber,
                column: index - lineStart
            }
        };

        token = advance();
        loc.end = {
            line: lineNumber,
            column: index - lineStart
        };

        if (token.type !== Token.EOF) {
            value = source.slice(token.start, token.end);
            entry = {
                type: TokenName[token.type],
                value: value,
                range: [token.start, token.end],
                loc: loc
            };
            if (token.regex) {
                entry.regex = {
                    pattern: token.regex.pattern,
                    flags: token.regex.flags
                };
            }
            if (extra.tokenValues) {
                extra.tokenValues.push((entry.type === 'Punctuator' || entry.type === 'Keyword') ? entry.value : null);
            }
            if (extra.tokenize) {
                if (!extra.range) {
                    delete entry.range;
                }
                if (!extra.loc) {
                    delete entry.loc;
                }
                if (extra.delegate) {
                    entry = extra.delegate(entry);
                }
            }
            extra.tokens.push(entry);
        }

        return token;
    }

    function lex() {
        var token;
        scanning = true;

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        skipComment();

        token = lookahead;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
        return token;
    }

    function peek() {
        scanning = true;

        skipComment();

        lastIndex = index;
        lastLineNumber = lineNumber;
        lastLineStart = lineStart;

        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;

        lookahead = (typeof extra.tokens !== 'undefined') ? collectToken() : advance();
        scanning = false;
    }

    function Position() {
        this.line = startLineNumber;
        this.column = startIndex - startLineStart;
    }

    function SourceLocation() {
        this.start = new Position();
        this.end = null;
    }

    function WrappingSourceLocation(startToken) {
        this.start = {
            line: startToken.lineNumber,
            column: startToken.start - startToken.lineStart
        };
        this.end = null;
    }

    function Node() {
        if (extra.range) {
            this.range = [startIndex, 0];
        }
        if (extra.loc) {
            this.loc = new SourceLocation();
        }
    }

    function WrappingNode(startToken) {
        if (extra.range) {
            this.range = [startToken.start, 0];
        }
        if (extra.loc) {
            this.loc = new WrappingSourceLocation(startToken);
        }
    }

    WrappingNode.prototype = Node.prototype = {

        processComment: function () {
            var lastChild,
                innerComments,
                leadingComments,
                trailingComments,
                bottomRight = extra.bottomRightStack,
                i,
                comment,
                last = bottomRight[bottomRight.length - 1];

            if (this.type === Syntax.Program) {
                if (this.body.length > 0) {
                    return;
                }
            }
            /**
             * patch innnerComments for properties empty block
             * `function a() {/** comments **\/}`
             */

            if (this.type === Syntax.BlockStatement && this.body.length === 0) {
                innerComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (this.range[1] >= comment.range[1]) {
                        innerComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                if (innerComments.length) {
                    this.innerComments = innerComments;
                    //bottomRight.push(this);
                    return;
                }
            }

            if (extra.trailingComments.length > 0) {
                trailingComments = [];
                for (i = extra.trailingComments.length - 1; i >= 0; --i) {
                    comment = extra.trailingComments[i];
                    if (comment.range[0] >= this.range[1]) {
                        trailingComments.unshift(comment);
                        extra.trailingComments.splice(i, 1);
                    }
                }
                extra.trailingComments = [];
            } else {
                if (last && last.trailingComments && last.trailingComments[0].range[0] >= this.range[1]) {
                    trailingComments = last.trailingComments;
                    delete last.trailingComments;
                }
            }

            // Eating the stack.
            while (last && last.range[0] >= this.range[0]) {
                lastChild = bottomRight.pop();
                last = bottomRight[bottomRight.length - 1];
            }

            if (lastChild) {
                if (lastChild.leadingComments) {
                    leadingComments = [];
                    for (i = lastChild.leadingComments.length - 1; i >= 0; --i) {
                        comment = lastChild.leadingComments[i];
                        if (comment.range[1] <= this.range[0]) {
                            leadingComments.unshift(comment);
                            lastChild.leadingComments.splice(i, 1);
                        }
                    }

                    if (!lastChild.leadingComments.length) {
                        lastChild.leadingComments = undefined;
                    }
                }
            } else if (extra.leadingComments.length > 0) {
                leadingComments = [];
                for (i = extra.leadingComments.length - 1; i >= 0; --i) {
                    comment = extra.leadingComments[i];
                    if (comment.range[1] <= this.range[0]) {
                        leadingComments.unshift(comment);
                        extra.leadingComments.splice(i, 1);
                    }
                }
            }


            if (leadingComments && leadingComments.length > 0) {
                this.leadingComments = leadingComments;
            }
            if (trailingComments && trailingComments.length > 0) {
                this.trailingComments = trailingComments;
            }

            bottomRight.push(this);
        },

        finish: function () {
            if (extra.range) {
                this.range[1] = lastIndex;
            }
            if (extra.loc) {
                this.loc.end = {
                    line: lastLineNumber,
                    column: lastIndex - lastLineStart
                };
                if (extra.source) {
                    this.loc.source = extra.source;
                }
            }

            if (extra.attachComment) {
                this.processComment();
            }
        },

        finishArrayExpression: function (elements) {
            this.type = Syntax.ArrayExpression;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrayPattern: function (elements) {
            this.type = Syntax.ArrayPattern;
            this.elements = elements;
            this.finish();
            return this;
        },

        finishArrowFunctionExpression: function (params, defaults, body, expression) {
            this.type = Syntax.ArrowFunctionExpression;
            this.id = null;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = false;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishAssignmentExpression: function (operator, left, right) {
            this.type = Syntax.AssignmentExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishAssignmentPattern: function (left, right) {
            this.type = Syntax.AssignmentPattern;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBinaryExpression: function (operator, left, right) {
            this.type = (operator === '||' || operator === '&&') ? Syntax.LogicalExpression : Syntax.BinaryExpression;
            this.operator = operator;
            this.left = left;
            this.right = right;
            this.finish();
            return this;
        },

        finishBlockStatement: function (body) {
            this.type = Syntax.BlockStatement;
            this.body = body;
            this.finish();
            return this;
        },

        finishBreakStatement: function (label) {
            this.type = Syntax.BreakStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishCallExpression: function (callee, args) {
            this.type = Syntax.CallExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishCatchClause: function (param, body) {
            this.type = Syntax.CatchClause;
            this.param = param;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassBody: function (body) {
            this.type = Syntax.ClassBody;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassDeclaration: function (id, superClass, body) {
            this.type = Syntax.ClassDeclaration;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishClassExpression: function (id, superClass, body) {
            this.type = Syntax.ClassExpression;
            this.id = id;
            this.superClass = superClass;
            this.body = body;
            this.finish();
            return this;
        },

        finishConditionalExpression: function (test, consequent, alternate) {
            this.type = Syntax.ConditionalExpression;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishContinueStatement: function (label) {
            this.type = Syntax.ContinueStatement;
            this.label = label;
            this.finish();
            return this;
        },

        finishDebuggerStatement: function () {
            this.type = Syntax.DebuggerStatement;
            this.finish();
            return this;
        },

        finishDoWhileStatement: function (body, test) {
            this.type = Syntax.DoWhileStatement;
            this.body = body;
            this.test = test;
            this.finish();
            return this;
        },

        finishEmptyStatement: function () {
            this.type = Syntax.EmptyStatement;
            this.finish();
            return this;
        },

        finishExpressionStatement: function (expression) {
            this.type = Syntax.ExpressionStatement;
            this.expression = expression;
            this.finish();
            return this;
        },

        finishForStatement: function (init, test, update, body) {
            this.type = Syntax.ForStatement;
            this.init = init;
            this.test = test;
            this.update = update;
            this.body = body;
            this.finish();
            return this;
        },

        finishForOfStatement: function (left, right, body) {
            this.type = Syntax.ForOfStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.finish();
            return this;
        },

        finishForInStatement: function (left, right, body) {
            this.type = Syntax.ForInStatement;
            this.left = left;
            this.right = right;
            this.body = body;
            this.each = false;
            this.finish();
            return this;
        },

        finishFunctionDeclaration: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionDeclaration;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishFunctionExpression: function (id, params, defaults, body, generator) {
            this.type = Syntax.FunctionExpression;
            this.id = id;
            this.params = params;
            this.defaults = defaults;
            this.body = body;
            this.generator = generator;
            this.expression = false;
            this.finish();
            return this;
        },

        finishIdentifier: function (name) {
            this.type = Syntax.Identifier;
            this.name = name;
            this.finish();
            return this;
        },

        finishIfStatement: function (test, consequent, alternate) {
            this.type = Syntax.IfStatement;
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
            this.finish();
            return this;
        },

        finishLabeledStatement: function (label, body) {
            this.type = Syntax.LabeledStatement;
            this.label = label;
            this.body = body;
            this.finish();
            return this;
        },

        finishLiteral: function (token) {
            this.type = Syntax.Literal;
            this.value = token.value;
            this.raw = source.slice(token.start, token.end);
            if (token.regex) {
                this.regex = token.regex;
            }
            this.finish();
            return this;
        },

        finishMemberExpression: function (accessor, object, property) {
            this.type = Syntax.MemberExpression;
            this.computed = accessor === '[';
            this.object = object;
            this.property = property;
            this.finish();
            return this;
        },

        finishMetaProperty: function (meta, property) {
            this.type = Syntax.MetaProperty;
            this.meta = meta;
            this.property = property;
            this.finish();
            return this;
        },

        finishNewExpression: function (callee, args) {
            this.type = Syntax.NewExpression;
            this.callee = callee;
            this.arguments = args;
            this.finish();
            return this;
        },

        finishObjectExpression: function (properties) {
            this.type = Syntax.ObjectExpression;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishObjectPattern: function (properties) {
            this.type = Syntax.ObjectPattern;
            this.properties = properties;
            this.finish();
            return this;
        },

        finishPostfixExpression: function (operator, argument) {
            this.type = Syntax.UpdateExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = false;
            this.finish();
            return this;
        },

        finishProgram: function (body, sourceType) {
            this.type = Syntax.Program;
            this.body = body;
            this.sourceType = sourceType;
            this.finish();
            return this;
        },

        finishProperty: function (kind, key, computed, value, method, shorthand) {
            this.type = Syntax.Property;
            this.key = key;
            this.computed = computed;
            this.value = value;
            this.kind = kind;
            this.method = method;
            this.shorthand = shorthand;
            this.finish();
            return this;
        },

        finishRestElement: function (argument) {
            this.type = Syntax.RestElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishReturnStatement: function (argument) {
            this.type = Syntax.ReturnStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSequenceExpression: function (expressions) {
            this.type = Syntax.SequenceExpression;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishSpreadElement: function (argument) {
            this.type = Syntax.SpreadElement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishSwitchCase: function (test, consequent) {
            this.type = Syntax.SwitchCase;
            this.test = test;
            this.consequent = consequent;
            this.finish();
            return this;
        },

        finishSuper: function () {
            this.type = Syntax.Super;
            this.finish();
            return this;
        },

        finishSwitchStatement: function (discriminant, cases) {
            this.type = Syntax.SwitchStatement;
            this.discriminant = discriminant;
            this.cases = cases;
            this.finish();
            return this;
        },

        finishTaggedTemplateExpression: function (tag, quasi) {
            this.type = Syntax.TaggedTemplateExpression;
            this.tag = tag;
            this.quasi = quasi;
            this.finish();
            return this;
        },

        finishTemplateElement: function (value, tail) {
            this.type = Syntax.TemplateElement;
            this.value = value;
            this.tail = tail;
            this.finish();
            return this;
        },

        finishTemplateLiteral: function (quasis, expressions) {
            this.type = Syntax.TemplateLiteral;
            this.quasis = quasis;
            this.expressions = expressions;
            this.finish();
            return this;
        },

        finishThisExpression: function () {
            this.type = Syntax.ThisExpression;
            this.finish();
            return this;
        },

        finishThrowStatement: function (argument) {
            this.type = Syntax.ThrowStatement;
            this.argument = argument;
            this.finish();
            return this;
        },

        finishTryStatement: function (block, handler, finalizer) {
            this.type = Syntax.TryStatement;
            this.block = block;
            this.guardedHandlers = [];
            this.handlers = handler ? [handler] : [];
            this.handler = handler;
            this.finalizer = finalizer;
            this.finish();
            return this;
        },

        finishUnaryExpression: function (operator, argument) {
            this.type = (operator === '++' || operator === '--') ? Syntax.UpdateExpression : Syntax.UnaryExpression;
            this.operator = operator;
            this.argument = argument;
            this.prefix = true;
            this.finish();
            return this;
        },

        finishVariableDeclaration: function (declarations) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = 'var';
            this.finish();
            return this;
        },

        finishLexicalDeclaration: function (declarations, kind) {
            this.type = Syntax.VariableDeclaration;
            this.declarations = declarations;
            this.kind = kind;
            this.finish();
            return this;
        },

        finishVariableDeclarator: function (id, init) {
            this.type = Syntax.VariableDeclarator;
            this.id = id;
            this.init = init;
            this.finish();
            return this;
        },

        finishWhileStatement: function (test, body) {
            this.type = Syntax.WhileStatement;
            this.test = test;
            this.body = body;
            this.finish();
            return this;
        },

        finishWithStatement: function (object, body) {
            this.type = Syntax.WithStatement;
            this.object = object;
            this.body = body;
            this.finish();
            return this;
        },

        finishExportSpecifier: function (local, exported) {
            this.type = Syntax.ExportSpecifier;
            this.exported = exported || local;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportDefaultSpecifier: function (local) {
            this.type = Syntax.ImportDefaultSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishImportNamespaceSpecifier: function (local) {
            this.type = Syntax.ImportNamespaceSpecifier;
            this.local = local;
            this.finish();
            return this;
        },

        finishExportNamedDeclaration: function (declaration, specifiers, src) {
            this.type = Syntax.ExportNamedDeclaration;
            this.declaration = declaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishExportDefaultDeclaration: function (declaration) {
            this.type = Syntax.ExportDefaultDeclaration;
            this.declaration = declaration;
            this.finish();
            return this;
        },

        finishExportAllDeclaration: function (src) {
            this.type = Syntax.ExportAllDeclaration;
            this.source = src;
            this.finish();
            return this;
        },

        finishImportSpecifier: function (local, imported) {
            this.type = Syntax.ImportSpecifier;
            this.local = local || imported;
            this.imported = imported;
            this.finish();
            return this;
        },

        finishImportDeclaration: function (specifiers, src) {
            this.type = Syntax.ImportDeclaration;
            this.specifiers = specifiers;
            this.source = src;
            this.finish();
            return this;
        },

        finishYieldExpression: function (argument, delegate) {
            this.type = Syntax.YieldExpression;
            this.argument = argument;
            this.delegate = delegate;
            this.finish();
            return this;
        }
    };


    function recordError(error) {
        var e, existing;

        for (e = 0; e < extra.errors.length; e++) {
            existing = extra.errors[e];
            // Prevent duplicated error.
            /* istanbul ignore next */
            if (existing.index === error.index && existing.message === error.message) {
                return;
            }
        }

        extra.errors.push(error);
    }

    function constructError(msg, column) {
        var error = new Error(msg);
        try {
            throw error;
        } catch (base) {
            /* istanbul ignore else */
            if (Object.create && Object.defineProperty) {
                error = Object.create(base);
                Object.defineProperty(error, 'column', { value: column });
            }
        } finally {
            return error;
        }
    }

    function createError(line, pos, description) {
        var msg, column, error;

        msg = 'Line ' + line + ': ' + description;
        column = pos - (scanning ? lineStart : lastLineStart) + 1;
        error = constructError(msg, column);
        error.lineNumber = line;
        error.description = description;
        error.index = pos;
        return error;
    }

    // Throw an exception

    function throwError(messageFormat) {
        var args, msg;

        args = Array.prototype.slice.call(arguments, 1);
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        throw createError(lastLineNumber, lastIndex, msg);
    }

    function tolerateError(messageFormat) {
        var args, msg, error;

        args = Array.prototype.slice.call(arguments, 1);
        /* istanbul ignore next */
        msg = messageFormat.replace(/%(\d)/g,
            function (whole, idx) {
                assert(idx < args.length, 'Message reference must be in range');
                return args[idx];
            }
        );

        error = createError(lineNumber, lastIndex, msg);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Throw an exception because of the token.

    function unexpectedTokenError(token, message) {
        var value, msg = message || Messages.UnexpectedToken;

        if (token) {
            if (!message) {
                msg = (token.type === Token.EOF) ? Messages.UnexpectedEOS :
                    (token.type === Token.Identifier) ? Messages.UnexpectedIdentifier :
                    (token.type === Token.NumericLiteral) ? Messages.UnexpectedNumber :
                    (token.type === Token.StringLiteral) ? Messages.UnexpectedString :
                    (token.type === Token.Template) ? Messages.UnexpectedTemplate :
                    Messages.UnexpectedToken;

                if (token.type === Token.Keyword) {
                    if (isFutureReservedWord(token.value)) {
                        msg = Messages.UnexpectedReserved;
                    } else if (strict && isStrictModeReservedWord(token.value)) {
                        msg = Messages.StrictReservedWord;
                    }
                }
            }

            value = (token.type === Token.Template) ? token.value.raw : token.value;
        } else {
            value = 'ILLEGAL';
        }

        msg = msg.replace('%0', value);

        return (token && typeof token.lineNumber === 'number') ?
            createError(token.lineNumber, token.start, msg) :
            createError(scanning ? lineNumber : lastLineNumber, scanning ? index : lastIndex, msg);
    }

    function throwUnexpectedToken(token, message) {
        throw unexpectedTokenError(token, message);
    }

    function tolerateUnexpectedToken(token, message) {
        var error = unexpectedTokenError(token, message);
        if (extra.errors) {
            recordError(error);
        } else {
            throw error;
        }
    }

    // Expect the next token to match the specified punctuator.
    // If not, an exception will be thrown.

    function expect(value) {
        var token = lex();
        if (token.type !== Token.Punctuator || token.value !== value) {
            throwUnexpectedToken(token);
        }
    }

    /**
     * @name expectCommaSeparator
     * @description Quietly expect a comma when in tolerant mode, otherwise delegates
     * to <code>expect(value)</code>
     * @since 2.0
     */
    function expectCommaSeparator() {
        var token;

        if (extra.errors) {
            token = lookahead;
            if (token.type === Token.Punctuator && token.value === ',') {
                lex();
            } else if (token.type === Token.Punctuator && token.value === ';') {
                lex();
                tolerateUnexpectedToken(token);
            } else {
                tolerateUnexpectedToken(token, Messages.UnexpectedToken);
            }
        } else {
            expect(',');
        }
    }

    // Expect the next token to match the specified keyword.
    // If not, an exception will be thrown.

    function expectKeyword(keyword) {
        var token = lex();
        if (token.type !== Token.Keyword || token.value !== keyword) {
            throwUnexpectedToken(token);
        }
    }

    // Return true if the next token matches the specified punctuator.

    function match(value) {
        return lookahead.type === Token.Punctuator && lookahead.value === value;
    }

    // Return true if the next token matches the specified keyword

    function matchKeyword(keyword) {
        return lookahead.type === Token.Keyword && lookahead.value === keyword;
    }

    // Return true if the next token matches the specified contextual keyword
    // (where an identifier is sometimes a keyword depending on the context)

    function matchContextualKeyword(keyword) {
        return lookahead.type === Token.Identifier && lookahead.value === keyword;
    }

    // Return true if the next token is an assignment operator

    function matchAssign() {
        var op;

        if (lookahead.type !== Token.Punctuator) {
            return false;
        }
        op = lookahead.value;
        return op === '=' ||
            op === '*=' ||
            op === '/=' ||
            op === '%=' ||
            op === '+=' ||
            op === '-=' ||
            op === '<<=' ||
            op === '>>=' ||
            op === '>>>=' ||
            op === '&=' ||
            op === '^=' ||
            op === '|=';
    }

    function consumeSemicolon() {
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(startIndex) === 0x3B || match(';')) {
            lex();
            return;
        }

        if (hasLineTerminator) {
            return;
        }

        // FIXME(ikarienator): this is seemingly an issue in the previous location info convention.
        lastIndex = startIndex;
        lastLineNumber = startLineNumber;
        lastLineStart = startLineStart;

        if (lookahead.type !== Token.EOF && !match('}')) {
            throwUnexpectedToken(lookahead);
        }
    }

    // Cover grammar support.
    //
    // When an assignment expression position starts with an left parenthesis, the determination of the type
    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
    //
    // There are three productions that can be parsed in a parentheses pair that needs to be determined
    // after the outermost pair is closed. They are:
    //
    //   1. AssignmentExpression
    //   2. BindingElements
    //   3. AssignmentTargets
    //
    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
    // binding element or assignment target.
    //
    // The three productions have the relationship:
    //
    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
    //
    // with a single exception that CoverInitializedName when used directly in an Expression, generates
    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
    //
    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
    // the CoverInitializedName check is conducted.
    //
    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
    // pattern. The CoverInitializedName check is deferred.
    function isolateCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        if (firstCoverInitializedNameError !== null) {
            throwUnexpectedToken(firstCoverInitializedNameError);
        }
        isBindingElement = oldIsBindingElement;
        isAssignmentTarget = oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError;
        return result;
    }

    function inheritCoverGrammar(parser) {
        var oldIsBindingElement = isBindingElement,
            oldIsAssignmentTarget = isAssignmentTarget,
            oldFirstCoverInitializedNameError = firstCoverInitializedNameError,
            result;
        isBindingElement = true;
        isAssignmentTarget = true;
        firstCoverInitializedNameError = null;
        result = parser();
        isBindingElement = isBindingElement && oldIsBindingElement;
        isAssignmentTarget = isAssignmentTarget && oldIsAssignmentTarget;
        firstCoverInitializedNameError = oldFirstCoverInitializedNameError || firstCoverInitializedNameError;
        return result;
    }

    // ECMA-262 13.3.3 Destructuring Binding Patterns

    function parseArrayPattern(params, kind) {
        var node = new Node(), elements = [], rest, restNode;
        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else {
                if (match('...')) {
                    restNode = new Node();
                    lex();
                    params.push(lookahead);
                    rest = parseVariableIdentifier(kind);
                    elements.push(restNode.finishRestElement(rest));
                    break;
                } else {
                    elements.push(parsePatternWithDefault(params, kind));
                }
                if (!match(']')) {
                    expect(',');
                }
            }

        }

        expect(']');

        return node.finishArrayPattern(elements);
    }

    function parsePropertyPattern(params, kind) {
        var node = new Node(), key, keyToken, computed = match('['), init;
        if (lookahead.type === Token.Identifier) {
            keyToken = lookahead;
            key = parseVariableIdentifier();
            if (match('=')) {
                params.push(keyToken);
                lex();
                init = parseAssignmentExpression();

                return node.finishProperty(
                    'init', key, false,
                    new WrappingNode(keyToken).finishAssignmentPattern(key, init), false, false);
            } else if (!match(':')) {
                params.push(keyToken);
                return node.finishProperty('init', key, false, key, false, true);
            }
        } else {
            key = parseObjectPropertyKey();
        }
        expect(':');
        init = parsePatternWithDefault(params, kind);
        return node.finishProperty('init', key, computed, init, false, false);
    }

    function parseObjectPattern(params, kind) {
        var node = new Node(), properties = [];

        expect('{');

        while (!match('}')) {
            properties.push(parsePropertyPattern(params, kind));
            if (!match('}')) {
                expect(',');
            }
        }

        lex();

        return node.finishObjectPattern(properties);
    }

    function parsePattern(params, kind) {
        if (match('[')) {
            return parseArrayPattern(params, kind);
        } else if (match('{')) {
            return parseObjectPattern(params, kind);
        } else if (matchKeyword('let')) {
            if (kind === 'const' || kind === 'let') {
                tolerateUnexpectedToken(lookahead, Messages.UnexpectedToken);
            }
        }

        params.push(lookahead);
        return parseVariableIdentifier(kind);
    }

    function parsePatternWithDefault(params, kind) {
        var startToken = lookahead, pattern, previousAllowYield, right;
        pattern = parsePattern(params, kind);
        if (match('=')) {
            lex();
            previousAllowYield = state.allowYield;
            state.allowYield = true;
            right = isolateCoverGrammar(parseAssignmentExpression);
            state.allowYield = previousAllowYield;
            pattern = new WrappingNode(startToken).finishAssignmentPattern(pattern, right);
        }
        return pattern;
    }

    // ECMA-262 12.2.5 Array Initializer

    function parseArrayInitializer() {
        var elements = [], node = new Node(), restSpread;

        expect('[');

        while (!match(']')) {
            if (match(',')) {
                lex();
                elements.push(null);
            } else if (match('...')) {
                restSpread = new Node();
                lex();
                restSpread.finishSpreadElement(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    isAssignmentTarget = isBindingElement = false;
                    expect(',');
                }
                elements.push(restSpread);
            } else {
                elements.push(inheritCoverGrammar(parseAssignmentExpression));

                if (!match(']')) {
                    expect(',');
                }
            }
        }

        lex();

        return node.finishArrayExpression(elements);
    }

    // ECMA-262 12.2.6 Object Initializer

    function parsePropertyFunction(node, paramInfo, isGenerator) {
        var previousStrict, body;

        isAssignmentTarget = isBindingElement = false;

        previousStrict = strict;
        body = isolateCoverGrammar(parseFunctionSourceElements);

        if (strict && paramInfo.firstRestricted) {
            tolerateUnexpectedToken(paramInfo.firstRestricted, paramInfo.message);
        }
        if (strict && paramInfo.stricted) {
            tolerateUnexpectedToken(paramInfo.stricted, paramInfo.message);
        }

        strict = previousStrict;
        return node.finishFunctionExpression(null, paramInfo.params, paramInfo.defaults, body, isGenerator);
    }

    function parsePropertyMethodFunction() {
        var params, method, node = new Node(),
            previousAllowYield = state.allowYield;

        state.allowYield = false;
        params = parseParams();
        state.allowYield = previousAllowYield;

        state.allowYield = false;
        method = parsePropertyFunction(node, params, false);
        state.allowYield = previousAllowYield;

        return method;
    }

    function parseObjectPropertyKey() {
        var token, node = new Node(), expr;

        token = lex();

        // Note: This function is called only from parseObjectProperty(), where
        // EOF and Punctuator tokens are already filtered out.

        switch (token.type) {
        case Token.StringLiteral:
        case Token.NumericLiteral:
            if (strict && token.octal) {
                tolerateUnexpectedToken(token, Messages.StrictOctalLiteral);
            }
            return node.finishLiteral(token);
        case Token.Identifier:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.Keyword:
            return node.finishIdentifier(token.value);
        case Token.Punctuator:
            if (token.value === '[') {
                expr = isolateCoverGrammar(parseAssignmentExpression);
                expect(']');
                return expr;
            }
            break;
        }
        throwUnexpectedToken(token);
    }

    function lookaheadPropertyName() {
        switch (lookahead.type) {
        case Token.Identifier:
        case Token.StringLiteral:
        case Token.BooleanLiteral:
        case Token.NullLiteral:
        case Token.NumericLiteral:
        case Token.Keyword:
            return true;
        case Token.Punctuator:
            return lookahead.value === '[';
        }
        return false;
    }

    // This function is to try to parse a MethodDefinition as defined in 14.3. But in the case of object literals,
    // it might be called at a position where there is in fact a short hand identifier pattern or a data property.
    // This can only be determined after we consumed up to the left parentheses.
    //
    // In order to avoid back tracking, it returns `null` if the position is not a MethodDefinition and the caller
    // is responsible to visit other options.
    function tryParseMethodDefinition(token, key, computed, node) {
        var value, options, methodNode, params,
            previousAllowYield = state.allowYield;

        if (token.type === Token.Identifier) {
            // check for `get` and `set`;

            if (token.value === 'get' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, {
                    params: [],
                    defaults: [],
                    stricted: null,
                    firstRestricted: null,
                    message: null
                }, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('get', key, computed, value, false, false);
            } else if (token.value === 'set' && lookaheadPropertyName()) {
                computed = match('[');
                key = parseObjectPropertyKey();
                methodNode = new Node();
                expect('(');

                options = {
                    params: [],
                    defaultCount: 0,
                    defaults: [],
                    firstRestricted: null,
                    paramSet: {}
                };
                if (match(')')) {
                    tolerateUnexpectedToken(lookahead);
                } else {
                    state.allowYield = false;
                    parseParam(options);
                    state.allowYield = previousAllowYield;
                    if (options.defaultCount === 0) {
                        options.defaults = [];
                    }
                }
                expect(')');

                state.allowYield = false;
                value = parsePropertyFunction(methodNode, options, false);
                state.allowYield = previousAllowYield;

                return node.finishProperty('set', key, computed, value, false, false);
            }
        } else if (token.type === Token.Punctuator && token.value === '*' && lookaheadPropertyName()) {
            computed = match('[');
            key = parseObjectPropertyKey();
            methodNode = new Node();

            state.allowYield = true;
            params = parseParams();
            state.allowYield = previousAllowYield;

            state.allowYield = false;
            value = parsePropertyFunction(methodNode, params, true);
            state.allowYield = previousAllowYield;

            return node.finishProperty('init', key, computed, value, true, false);
        }

        if (key && match('(')) {
            value = parsePropertyMethodFunction();
            return node.finishProperty('init', key, computed, value, true, false);
        }

        // Not a MethodDefinition.
        return null;
    }

    function parseObjectProperty(hasProto) {
        var token = lookahead, node = new Node(), computed, key, maybeMethod, proto, value;

        computed = match('[');
        if (match('*')) {
            lex();
        } else {
            key = parseObjectPropertyKey();
        }
        maybeMethod = tryParseMethodDefinition(token, key, computed, node);
        if (maybeMethod) {
            return maybeMethod;
        }

        if (!key) {
            throwUnexpectedToken(lookahead);
        }

        // Check for duplicated __proto__
        if (!computed) {
            proto = (key.type === Syntax.Identifier && key.name === '__proto__') ||
                (key.type === Syntax.Literal && key.value === '__proto__');
            if (hasProto.value && proto) {
                tolerateError(Messages.DuplicateProtoProperty);
            }
            hasProto.value |= proto;
        }

        if (match(':')) {
            lex();
            value = inheritCoverGrammar(parseAssignmentExpression);
            return node.finishProperty('init', key, computed, value, false, false);
        }

        if (token.type === Token.Identifier) {
            if (match('=')) {
                firstCoverInitializedNameError = lookahead;
                lex();
                value = isolateCoverGrammar(parseAssignmentExpression);
                return node.finishProperty('init', key, computed,
                    new WrappingNode(token).finishAssignmentPattern(key, value), false, true);
            }
            return node.finishProperty('init', key, computed, key, false, true);
        }

        throwUnexpectedToken(lookahead);
    }

    function parseObjectInitializer() {
        var properties = [], hasProto = {value: false}, node = new Node();

        expect('{');

        while (!match('}')) {
            properties.push(parseObjectProperty(hasProto));

            if (!match('}')) {
                expectCommaSeparator();
            }
        }

        expect('}');

        return node.finishObjectExpression(properties);
    }

    function reinterpretExpressionAsPattern(expr) {
        var i;
        switch (expr.type) {
        case Syntax.Identifier:
        case Syntax.MemberExpression:
        case Syntax.RestElement:
        case Syntax.AssignmentPattern:
            break;
        case Syntax.SpreadElement:
            expr.type = Syntax.RestElement;
            reinterpretExpressionAsPattern(expr.argument);
            break;
        case Syntax.ArrayExpression:
            expr.type = Syntax.ArrayPattern;
            for (i = 0; i < expr.elements.length; i++) {
                if (expr.elements[i] !== null) {
                    reinterpretExpressionAsPattern(expr.elements[i]);
                }
            }
            break;
        case Syntax.ObjectExpression:
            expr.type = Syntax.ObjectPattern;
            for (i = 0; i < expr.properties.length; i++) {
                reinterpretExpressionAsPattern(expr.properties[i].value);
            }
            break;
        case Syntax.AssignmentExpression:
            expr.type = Syntax.AssignmentPattern;
            reinterpretExpressionAsPattern(expr.left);
            break;
        default:
            // Allow other node type for tolerant parsing.
            break;
        }
    }

    // ECMA-262 12.2.9 Template Literals

    function parseTemplateElement(option) {
        var node, token;

        if (lookahead.type !== Token.Template || (option.head && !lookahead.head)) {
            throwUnexpectedToken();
        }

        node = new Node();
        token = lex();

        return node.finishTemplateElement({ raw: token.value.raw, cooked: token.value.cooked }, token.tail);
    }

    function parseTemplateLiteral() {
        var quasi, quasis, expressions, node = new Node();

        quasi = parseTemplateElement({ head: true });
        quasis = [quasi];
        expressions = [];

        while (!quasi.tail) {
            expressions.push(parseExpression());
            quasi = parseTemplateElement({ head: false });
            quasis.push(quasi);
        }

        return node.finishTemplateLiteral(quasis, expressions);
    }

    // ECMA-262 12.2.10 The Grouping Operator

    function parseGroupExpression() {
        var expr, expressions, startToken, i, params = [];

        expect('(');

        if (match(')')) {
            lex();
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [],
                rawParams: []
            };
        }

        startToken = lookahead;
        if (match('...')) {
            expr = parseRestElement(params);
            expect(')');
            if (!match('=>')) {
                expect('=>');
            }
            return {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: [expr]
            };
        }

        isBindingElement = true;
        expr = inheritCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            isAssignmentTarget = false;
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();

                if (match('...')) {
                    if (!isBindingElement) {
                        throwUnexpectedToken(lookahead);
                    }
                    expressions.push(parseRestElement(params));
                    expect(')');
                    if (!match('=>')) {
                        expect('=>');
                    }
                    isBindingElement = false;
                    for (i = 0; i < expressions.length; i++) {
                        reinterpretExpressionAsPattern(expressions[i]);
                    }
                    return {
                        type: PlaceHolders.ArrowParameterPlaceHolder,
                        params: expressions
                    };
                }

                expressions.push(inheritCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }


        expect(')');

        if (match('=>')) {
            if (expr.type === Syntax.Identifier && expr.name === 'yield') {
                return {
                    type: PlaceHolders.ArrowParameterPlaceHolder,
                    params: [expr]
                };
            }

            if (!isBindingElement) {
                throwUnexpectedToken(lookahead);
            }

            if (expr.type === Syntax.SequenceExpression) {
                for (i = 0; i < expr.expressions.length; i++) {
                    reinterpretExpressionAsPattern(expr.expressions[i]);
                }
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            expr = {
                type: PlaceHolders.ArrowParameterPlaceHolder,
                params: expr.type === Syntax.SequenceExpression ? expr.expressions : [expr]
            };
        }
        isBindingElement = false;
        return expr;
    }


    // ECMA-262 12.2 Primary Expressions

    function parsePrimaryExpression() {
        var type, token, expr, node;

        if (match('(')) {
            isBindingElement = false;
            return inheritCoverGrammar(parseGroupExpression);
        }

        if (match('[')) {
            return inheritCoverGrammar(parseArrayInitializer);
        }

        if (match('{')) {
            return inheritCoverGrammar(parseObjectInitializer);
        }

        type = lookahead.type;
        node = new Node();

        if (type === Token.Identifier) {
            if (state.sourceType === 'module' && lookahead.value === 'await') {
                tolerateUnexpectedToken(lookahead);
            }
            expr = node.finishIdentifier(lex().value);
        } else if (type === Token.StringLiteral || type === Token.NumericLiteral) {
            isAssignmentTarget = isBindingElement = false;
            if (strict && lookahead.octal) {
                tolerateUnexpectedToken(lookahead, Messages.StrictOctalLiteral);
            }
            expr = node.finishLiteral(lex());
        } else if (type === Token.Keyword) {
            if (!strict && state.allowYield && matchKeyword('yield')) {
                return parseNonComputedProperty();
            }
            isAssignmentTarget = isBindingElement = false;
            if (matchKeyword('function')) {
                return parseFunctionExpression();
            }
            if (matchKeyword('this')) {
                lex();
                return node.finishThisExpression();
            }
            if (matchKeyword('class')) {
                return parseClassExpression();
            }
            if (!strict && matchKeyword('let')) {
                return node.finishIdentifier(lex().value);
            }
            throwUnexpectedToken(lex());
        } else if (type === Token.BooleanLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = (token.value === 'true');
            expr = node.finishLiteral(token);
        } else if (type === Token.NullLiteral) {
            isAssignmentTarget = isBindingElement = false;
            token = lex();
            token.value = null;
            expr = node.finishLiteral(token);
        } else if (match('/') || match('/=')) {
            isAssignmentTarget = isBindingElement = false;
            index = startIndex;

            if (typeof extra.tokens !== 'undefined') {
                token = collectRegex();
            } else {
                token = scanRegExp();
            }
            lex();
            expr = node.finishLiteral(token);
        } else if (type === Token.Template) {
            expr = parseTemplateLiteral();
        } else {
            throwUnexpectedToken(lex());
        }

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseArguments() {
        var args = [], expr;

        expect('(');

        if (!match(')')) {
            while (startIndex < length) {
                if (match('...')) {
                    expr = new Node();
                    lex();
                    expr.finishSpreadElement(isolateCoverGrammar(parseAssignmentExpression));
                } else {
                    expr = isolateCoverGrammar(parseAssignmentExpression);
                }
                args.push(expr);
                if (match(')')) {
                    break;
                }
                expectCommaSeparator();
            }
        }

        expect(')');

        return args;
    }

    function parseNonComputedProperty() {
        var token, node = new Node();

        token = lex();

        if (!isIdentifierName(token)) {
            throwUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseNonComputedMember() {
        expect('.');

        return parseNonComputedProperty();
    }

    function parseComputedMember() {
        var expr;

        expect('[');

        expr = isolateCoverGrammar(parseExpression);

        expect(']');

        return expr;
    }

    // ECMA-262 12.3.3 The new Operator

    function parseNewExpression() {
        var callee, args, node = new Node();

        expectKeyword('new');

        if (match('.')) {
            lex();
            if (lookahead.type === Token.Identifier && lookahead.value === 'target') {
                if (state.inFunctionBody) {
                    lex();
                    return node.finishMetaProperty('new', 'target');
                }
            }
            throwUnexpectedToken(lookahead);
        }

        callee = isolateCoverGrammar(parseLeftHandSideExpression);
        args = match('(') ? parseArguments() : [];

        isAssignmentTarget = isBindingElement = false;

        return node.finishNewExpression(callee, args);
    }

    // ECMA-262 12.3.4 Function Calls

    function parseLeftHandSideExpressionAllowCall() {
        var quasi, expr, args, property, startToken, previousAllowIn = state.allowIn;

        startToken = lookahead;
        state.allowIn = true;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('(') && !match('.') && !match('[')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (match('(')) {
                isBindingElement = false;
                isAssignmentTarget = false;
                args = parseArguments();
                expr = new WrappingNode(startToken).finishCallExpression(expr, args);
            } else if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        state.allowIn = previousAllowIn;

        return expr;
    }

    // ECMA-262 12.3 Left-Hand-Side Expressions

    function parseLeftHandSideExpression() {
        var quasi, expr, property, startToken;
        assert(state.allowIn, 'callee of new expression always allow in keyword.');

        startToken = lookahead;

        if (matchKeyword('super') && state.inFunctionBody) {
            expr = new Node();
            lex();
            expr = expr.finishSuper();
            if (!match('[') && !match('.')) {
                throwUnexpectedToken(lookahead);
            }
        } else {
            expr = inheritCoverGrammar(matchKeyword('new') ? parseNewExpression : parsePrimaryExpression);
        }

        for (;;) {
            if (match('[')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('[', expr, property);
            } else if (match('.')) {
                isBindingElement = false;
                isAssignmentTarget = true;
                property = parseNonComputedMember();
                expr = new WrappingNode(startToken).finishMemberExpression('.', expr, property);
            } else if (lookahead.type === Token.Template && lookahead.head) {
                quasi = parseTemplateLiteral();
                expr = new WrappingNode(startToken).finishTaggedTemplateExpression(expr, quasi);
            } else {
                break;
            }
        }
        return expr;
    }

    // ECMA-262 12.4 Postfix Expressions

    function parsePostfixExpression() {
        var expr, token, startToken = lookahead;

        expr = inheritCoverGrammar(parseLeftHandSideExpressionAllowCall);

        if (!hasLineTerminator && lookahead.type === Token.Punctuator) {
            if (match('++') || match('--')) {
                // ECMA-262 11.3.1, 11.3.2
                if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                    tolerateError(Messages.StrictLHSPostfix);
                }

                if (!isAssignmentTarget) {
                    tolerateError(Messages.InvalidLHSInAssignment);
                }

                isAssignmentTarget = isBindingElement = false;

                token = lex();
                expr = new WrappingNode(startToken).finishPostfixExpression(token.value, expr);
            }
        }

        return expr;
    }

    // ECMA-262 12.5 Unary Operators

    function parseUnaryExpression() {
        var token, expr, startToken;

        if (lookahead.type !== Token.Punctuator && lookahead.type !== Token.Keyword) {
            expr = parsePostfixExpression();
        } else if (match('++') || match('--')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            // ECMA-262 11.4.4, 11.4.5
            if (strict && expr.type === Syntax.Identifier && isRestrictedWord(expr.name)) {
                tolerateError(Messages.StrictLHSPrefix);
            }

            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (match('+') || match('-') || match('~') || match('!')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            isAssignmentTarget = isBindingElement = false;
        } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
            startToken = lookahead;
            token = lex();
            expr = inheritCoverGrammar(parseUnaryExpression);
            expr = new WrappingNode(startToken).finishUnaryExpression(token.value, expr);
            if (strict && expr.operator === 'delete' && expr.argument.type === Syntax.Identifier) {
                tolerateError(Messages.StrictDelete);
            }
            isAssignmentTarget = isBindingElement = false;
        } else {
            expr = parsePostfixExpression();
        }

        return expr;
    }

    function binaryPrecedence(token, allowIn) {
        var prec = 0;

        if (token.type !== Token.Punctuator && token.type !== Token.Keyword) {
            return 0;
        }

        switch (token.value) {
        case '||':
            prec = 1;
            break;

        case '&&':
            prec = 2;
            break;

        case '|':
            prec = 3;
            break;

        case '^':
            prec = 4;
            break;

        case '&':
            prec = 5;
            break;

        case '==':
        case '!=':
        case '===':
        case '!==':
            prec = 6;
            break;

        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            prec = 7;
            break;

        case 'in':
            prec = allowIn ? 7 : 0;
            break;

        case '<<':
        case '>>':
        case '>>>':
            prec = 8;
            break;

        case '+':
        case '-':
            prec = 9;
            break;

        case '*':
        case '/':
        case '%':
            prec = 11;
            break;

        default:
            break;
        }

        return prec;
    }

    // ECMA-262 12.6 Multiplicative Operators
    // ECMA-262 12.7 Additive Operators
    // ECMA-262 12.8 Bitwise Shift Operators
    // ECMA-262 12.9 Relational Operators
    // ECMA-262 12.10 Equality Operators
    // ECMA-262 12.11 Binary Bitwise Operators
    // ECMA-262 12.12 Binary Logical Operators

    function parseBinaryExpression() {
        var marker, markers, expr, token, prec, stack, right, operator, left, i;

        marker = lookahead;
        left = inheritCoverGrammar(parseUnaryExpression);

        token = lookahead;
        prec = binaryPrecedence(token, state.allowIn);
        if (prec === 0) {
            return left;
        }
        isAssignmentTarget = isBindingElement = false;
        token.prec = prec;
        lex();

        markers = [marker, lookahead];
        right = isolateCoverGrammar(parseUnaryExpression);

        stack = [left, token, right];

        while ((prec = binaryPrecedence(lookahead, state.allowIn)) > 0) {

            // Reduce: make a binary expression from the three topmost entries.
            while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
                right = stack.pop();
                operator = stack.pop().value;
                left = stack.pop();
                markers.pop();
                expr = new WrappingNode(markers[markers.length - 1]).finishBinaryExpression(operator, left, right);
                stack.push(expr);
            }

            // Shift.
            token = lex();
            token.prec = prec;
            stack.push(token);
            markers.push(lookahead);
            expr = isolateCoverGrammar(parseUnaryExpression);
            stack.push(expr);
        }

        // Final reduce to clean-up the stack.
        i = stack.length - 1;
        expr = stack[i];
        markers.pop();
        while (i > 1) {
            expr = new WrappingNode(markers.pop()).finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
            i -= 2;
        }

        return expr;
    }


    // ECMA-262 12.13 Conditional Operator

    function parseConditionalExpression() {
        var expr, previousAllowIn, consequent, alternate, startToken;

        startToken = lookahead;

        expr = inheritCoverGrammar(parseBinaryExpression);
        if (match('?')) {
            lex();
            previousAllowIn = state.allowIn;
            state.allowIn = true;
            consequent = isolateCoverGrammar(parseAssignmentExpression);
            state.allowIn = previousAllowIn;
            expect(':');
            alternate = isolateCoverGrammar(parseAssignmentExpression);

            expr = new WrappingNode(startToken).finishConditionalExpression(expr, consequent, alternate);
            isAssignmentTarget = isBindingElement = false;
        }

        return expr;
    }

    // ECMA-262 14.2 Arrow Function Definitions

    function parseConciseBody() {
        if (match('{')) {
            return parseFunctionSourceElements();
        }
        return isolateCoverGrammar(parseAssignmentExpression);
    }

    function checkPatternParam(options, param) {
        var i;
        switch (param.type) {
        case Syntax.Identifier:
            validateParam(options, param, param.name);
            break;
        case Syntax.RestElement:
            checkPatternParam(options, param.argument);
            break;
        case Syntax.AssignmentPattern:
            checkPatternParam(options, param.left);
            break;
        case Syntax.ArrayPattern:
            for (i = 0; i < param.elements.length; i++) {
                if (param.elements[i] !== null) {
                    checkPatternParam(options, param.elements[i]);
                }
            }
            break;
        case Syntax.YieldExpression:
            break;
        default:
            assert(param.type === Syntax.ObjectPattern, 'Invalid type');
            for (i = 0; i < param.properties.length; i++) {
                checkPatternParam(options, param.properties[i].value);
            }
            break;
        }
    }
    function reinterpretAsCoverFormalsList(expr) {
        var i, len, param, params, defaults, defaultCount, options, token;

        defaults = [];
        defaultCount = 0;
        params = [expr];

        switch (expr.type) {
        case Syntax.Identifier:
            break;
        case PlaceHolders.ArrowParameterPlaceHolder:
            params = expr.params;
            break;
        default:
            return null;
        }

        options = {
            paramSet: {}
        };

        for (i = 0, len = params.length; i < len; i += 1) {
            param = params[i];
            switch (param.type) {
            case Syntax.AssignmentPattern:
                params[i] = param.left;
                if (param.right.type === Syntax.YieldExpression) {
                    if (param.right.argument) {
                        throwUnexpectedToken(lookahead);
                    }
                    param.right.type = Syntax.Identifier;
                    param.right.name = 'yield';
                    delete param.right.argument;
                    delete param.right.delegate;
                }
                defaults.push(param.right);
                ++defaultCount;
                checkPatternParam(options, param.left);
                break;
            default:
                checkPatternParam(options, param);
                params[i] = param;
                defaults.push(null);
                break;
            }
        }

        if (strict || !state.allowYield) {
            for (i = 0, len = params.length; i < len; i += 1) {
                param = params[i];
                if (param.type === Syntax.YieldExpression) {
                    throwUnexpectedToken(lookahead);
                }
            }
        }

        if (options.message === Messages.StrictParamDupe) {
            token = strict ? options.stricted : options.firstRestricted;
            throwUnexpectedToken(token, options.message);
        }

        if (defaultCount === 0) {
            defaults = [];
        }

        return {
            params: params,
            defaults: defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseArrowFunctionExpression(options, node) {
        var previousStrict, previousAllowYield, body;

        if (hasLineTerminator) {
            tolerateUnexpectedToken(lookahead);
        }
        expect('=>');

        previousStrict = strict;
        previousAllowYield = state.allowYield;
        state.allowYield = true;

        body = parseConciseBody();

        if (strict && options.firstRestricted) {
            throwUnexpectedToken(options.firstRestricted, options.message);
        }
        if (strict && options.stricted) {
            tolerateUnexpectedToken(options.stricted, options.message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishArrowFunctionExpression(options.params, options.defaults, body, body.type !== Syntax.BlockStatement);
    }

    // ECMA-262 14.4 Yield expression

    function parseYieldExpression() {
        var argument, expr, delegate, previousAllowYield;

        argument = null;
        expr = new Node();

        expectKeyword('yield');

        if (!hasLineTerminator) {
            previousAllowYield = state.allowYield;
            state.allowYield = false;
            delegate = match('*');
            if (delegate) {
                lex();
                argument = parseAssignmentExpression();
            } else {
                if (!match(';') && !match('}') && !match(')') && lookahead.type !== Token.EOF) {
                    argument = parseAssignmentExpression();
                }
            }
            state.allowYield = previousAllowYield;
        }

        return expr.finishYieldExpression(argument, delegate);
    }

    // ECMA-262 12.14 Assignment Operators

    function parseAssignmentExpression() {
        var token, expr, right, list, startToken;

        startToken = lookahead;
        token = lookahead;

        if (!state.allowYield && matchKeyword('yield')) {
            return parseYieldExpression();
        }

        expr = parseConditionalExpression();

        if (expr.type === PlaceHolders.ArrowParameterPlaceHolder || match('=>')) {
            isAssignmentTarget = isBindingElement = false;
            list = reinterpretAsCoverFormalsList(expr);

            if (list) {
                firstCoverInitializedNameError = null;
                return parseArrowFunctionExpression(list, new WrappingNode(startToken));
            }

            return expr;
        }

        if (matchAssign()) {
            if (!isAssignmentTarget) {
                tolerateError(Messages.InvalidLHSInAssignment);
            }

            // ECMA-262 12.1.1
            if (strict && expr.type === Syntax.Identifier) {
                if (isRestrictedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictLHSAssignment);
                }
                if (isStrictModeReservedWord(expr.name)) {
                    tolerateUnexpectedToken(token, Messages.StrictReservedWord);
                }
            }

            if (!match('=')) {
                isAssignmentTarget = isBindingElement = false;
            } else {
                reinterpretExpressionAsPattern(expr);
            }

            token = lex();
            right = isolateCoverGrammar(parseAssignmentExpression);
            expr = new WrappingNode(startToken).finishAssignmentExpression(token.value, expr, right);
            firstCoverInitializedNameError = null;
        }

        return expr;
    }

    // ECMA-262 12.15 Comma Operator

    function parseExpression() {
        var expr, startToken = lookahead, expressions;

        expr = isolateCoverGrammar(parseAssignmentExpression);

        if (match(',')) {
            expressions = [expr];

            while (startIndex < length) {
                if (!match(',')) {
                    break;
                }
                lex();
                expressions.push(isolateCoverGrammar(parseAssignmentExpression));
            }

            expr = new WrappingNode(startToken).finishSequenceExpression(expressions);
        }

        return expr;
    }

    // ECMA-262 13.2 Block

    function parseStatementListItem() {
        if (lookahead.type === Token.Keyword) {
            switch (lookahead.value) {
            case 'export':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalExportDeclaration);
                }
                return parseExportDeclaration();
            case 'import':
                if (state.sourceType !== 'module') {
                    tolerateUnexpectedToken(lookahead, Messages.IllegalImportDeclaration);
                }
                return parseImportDeclaration();
            case 'const':
                return parseLexicalDeclaration({inFor: false});
            case 'function':
                return parseFunctionDeclaration(new Node());
            case 'class':
                return parseClassDeclaration();
            }
        }

        if (matchKeyword('let') && isLexicalDeclaration()) {
            return parseLexicalDeclaration({inFor: false});
        }

        return parseStatement();
    }

    function parseStatementList() {
        var list = [];
        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            list.push(parseStatementListItem());
        }

        return list;
    }

    function parseBlock() {
        var block, node = new Node();

        expect('{');

        block = parseStatementList();

        expect('}');

        return node.finishBlockStatement(block);
    }

    // ECMA-262 13.3.2 Variable Statement

    function parseVariableIdentifier(kind) {
        var token, node = new Node();

        token = lex();

        if (token.type === Token.Keyword && token.value === 'yield') {
            if (strict) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } if (!state.allowYield) {
                throwUnexpectedToken(token);
            }
        } else if (token.type !== Token.Identifier) {
            if (strict && token.type === Token.Keyword && isStrictModeReservedWord(token.value)) {
                tolerateUnexpectedToken(token, Messages.StrictReservedWord);
            } else {
                if (strict || token.value !== 'let' || kind !== 'var') {
                    throwUnexpectedToken(token);
                }
            }
        } else if (state.sourceType === 'module' && token.type === Token.Identifier && token.value === 'await') {
            tolerateUnexpectedToken(token);
        }

        return node.finishIdentifier(token.value);
    }

    function parseVariableDeclaration(options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, 'var');

        // ECMA-262 12.2.1
        if (strict && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (match('=')) {
            lex();
            init = isolateCoverGrammar(parseAssignmentExpression);
        } else if (id.type !== Syntax.Identifier && !options.inFor) {
            expect('=');
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseVariableDeclarationList(options) {
        var list = [];

        do {
            list.push(parseVariableDeclaration({ inFor: options.inFor }));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }

    function parseVariableStatement(node) {
        var declarations;

        expectKeyword('var');

        declarations = parseVariableDeclarationList({ inFor: false });

        consumeSemicolon();

        return node.finishVariableDeclaration(declarations);
    }

    // ECMA-262 13.3.1 Let and Const Declarations

    function parseLexicalBinding(kind, options) {
        var init = null, id, node = new Node(), params = [];

        id = parsePattern(params, kind);

        // ECMA-262 12.2.1
        if (strict && id.type === Syntax.Identifier && isRestrictedWord(id.name)) {
            tolerateError(Messages.StrictVarName);
        }

        if (kind === 'const') {
            if (!matchKeyword('in') && !matchContextualKeyword('of')) {
                expect('=');
                init = isolateCoverGrammar(parseAssignmentExpression);
            }
        } else if ((!options.inFor && id.type !== Syntax.Identifier) || match('=')) {
            expect('=');
            init = isolateCoverGrammar(parseAssignmentExpression);
        }

        return node.finishVariableDeclarator(id, init);
    }

    function parseBindingList(kind, options) {
        var list = [];

        do {
            list.push(parseLexicalBinding(kind, options));
            if (!match(',')) {
                break;
            }
            lex();
        } while (startIndex < length);

        return list;
    }


    function tokenizerState() {
        return {
            index: index,
            lineNumber: lineNumber,
            lineStart: lineStart,
            hasLineTerminator: hasLineTerminator,
            lastIndex: lastIndex,
            lastLineNumber: lastLineNumber,
            lastLineStart: lastLineStart,
            startIndex: startIndex,
            startLineNumber: startLineNumber,
            startLineStart: startLineStart,
            lookahead: lookahead,
            tokenCount: extra.tokens ? extra.tokens.length : 0
        };
    }

    function resetTokenizerState(ts) {
        index = ts.index;
        lineNumber = ts.lineNumber;
        lineStart = ts.lineStart;
        hasLineTerminator = ts.hasLineTerminator;
        lastIndex = ts.lastIndex;
        lastLineNumber = ts.lastLineNumber;
        lastLineStart = ts.lastLineStart;
        startIndex = ts.startIndex;
        startLineNumber = ts.startLineNumber;
        startLineStart = ts.startLineStart;
        lookahead = ts.lookahead;
        if (extra.tokens) {
            extra.tokens.splice(ts.tokenCount, extra.tokens.length);
        }
    }

    function isLexicalDeclaration() {
        var lexical, ts;

        ts = tokenizerState();

        lex();
        lexical = (lookahead.type === Token.Identifier) || match('[') || match('{') ||
            matchKeyword('let') || matchKeyword('yield');

        resetTokenizerState(ts);

        return lexical;
    }

    function parseLexicalDeclaration(options) {
        var kind, declarations, node = new Node();

        kind = lex().value;
        assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');

        declarations = parseBindingList(kind, options);

        consumeSemicolon();

        return node.finishLexicalDeclaration(declarations, kind);
    }

    function parseRestElement(params) {
        var param, node = new Node();

        lex();

        if (match('{')) {
            throwError(Messages.ObjectPatternAsRestParameter);
        }

        params.push(lookahead);

        param = parseVariableIdentifier();

        if (match('=')) {
            throwError(Messages.DefaultRestParameter);
        }

        if (!match(')')) {
            throwError(Messages.ParameterAfterRestParameter);
        }

        return node.finishRestElement(param);
    }

    // ECMA-262 13.4 Empty Statement

    function parseEmptyStatement(node) {
        expect(';');
        return node.finishEmptyStatement();
    }

    // ECMA-262 12.4 Expression Statement

    function parseExpressionStatement(node) {
        var expr = parseExpression();
        consumeSemicolon();
        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 13.6 If statement

    function parseIfStatement(node) {
        var test, consequent, alternate;

        expectKeyword('if');

        expect('(');

        test = parseExpression();

        expect(')');

        consequent = parseStatement();

        if (matchKeyword('else')) {
            lex();
            alternate = parseStatement();
        } else {
            alternate = null;
        }

        return node.finishIfStatement(test, consequent, alternate);
    }

    // ECMA-262 13.7 Iteration Statements

    function parseDoWhileStatement(node) {
        var body, test, oldInIteration;

        expectKeyword('do');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        if (match(';')) {
            lex();
        }

        return node.finishDoWhileStatement(body, test);
    }

    function parseWhileStatement(node) {
        var test, body, oldInIteration;

        expectKeyword('while');

        expect('(');

        test = parseExpression();

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = parseStatement();

        state.inIteration = oldInIteration;

        return node.finishWhileStatement(test, body);
    }

    function parseForStatement(node) {
        var init, forIn, initSeq, initStartToken, test, update, left, right, kind, declarations,
            body, oldInIteration, previousAllowIn = state.allowIn;

        init = test = update = null;
        forIn = true;

        expectKeyword('for');

        expect('(');

        if (match(';')) {
            lex();
        } else {
            if (matchKeyword('var')) {
                init = new Node();
                lex();

                state.allowIn = false;
                declarations = parseVariableDeclarationList({ inFor: true });
                state.allowIn = previousAllowIn;

                if (declarations.length === 1 && matchKeyword('in')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                    init = init.finishVariableDeclaration(declarations);
                    lex();
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    init = init.finishVariableDeclaration(declarations);
                    expect(';');
                }
            } else if (matchKeyword('const') || matchKeyword('let')) {
                init = new Node();
                kind = lex().value;

                if (!strict && lookahead.value === 'in') {
                    init = init.finishIdentifier(kind);
                    lex();
                    left = init;
                    right = parseExpression();
                    init = null;
                } else {
                    state.allowIn = false;
                    declarations = parseBindingList(kind, {inFor: true});
                    state.allowIn = previousAllowIn;

                    if (declarations.length === 1 && declarations[0].init === null && matchKeyword('in')) {
                        init = init.finishLexicalDeclaration(declarations, kind);
                        lex();
                        left = init;
                        right = parseExpression();
                        init = null;
                    } else if (declarations.length === 1 && declarations[0].init === null && matchContextualKeyword('of')) {
                        init = init.finishLexicalDeclaration(declarations, kind);
                        lex();
                        left = init;
                        right = parseAssignmentExpression();
                        init = null;
                        forIn = false;
                    } else {
                        consumeSemicolon();
                        init = init.finishLexicalDeclaration(declarations, kind);
                    }
                }
            } else {
                initStartToken = lookahead;
                state.allowIn = false;
                init = inheritCoverGrammar(parseAssignmentExpression);
                state.allowIn = previousAllowIn;

                if (matchKeyword('in')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForIn);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseExpression();
                    init = null;
                } else if (matchContextualKeyword('of')) {
                    if (!isAssignmentTarget) {
                        tolerateError(Messages.InvalidLHSInForLoop);
                    }

                    lex();
                    reinterpretExpressionAsPattern(init);
                    left = init;
                    right = parseAssignmentExpression();
                    init = null;
                    forIn = false;
                } else {
                    if (match(',')) {
                        initSeq = [init];
                        while (match(',')) {
                            lex();
                            initSeq.push(isolateCoverGrammar(parseAssignmentExpression));
                        }
                        init = new WrappingNode(initStartToken).finishSequenceExpression(initSeq);
                    }
                    expect(';');
                }
            }
        }

        if (typeof left === 'undefined') {

            if (!match(';')) {
                test = parseExpression();
            }
            expect(';');

            if (!match(')')) {
                update = parseExpression();
            }
        }

        expect(')');

        oldInIteration = state.inIteration;
        state.inIteration = true;

        body = isolateCoverGrammar(parseStatement);

        state.inIteration = oldInIteration;

        return (typeof left === 'undefined') ?
                node.finishForStatement(init, test, update, body) :
                forIn ? node.finishForInStatement(left, right, body) :
                    node.finishForOfStatement(left, right, body);
    }

    // ECMA-262 13.8 The continue statement

    function parseContinueStatement(node) {
        var label = null, key;

        expectKeyword('continue');

        // Optimize the most common form: 'continue;'.
        if (source.charCodeAt(startIndex) === 0x3B) {
            lex();

            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (hasLineTerminator) {
            if (!state.inIteration) {
                throwError(Messages.IllegalContinue);
            }

            return node.finishContinueStatement(null);
        }

        if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !state.inIteration) {
            throwError(Messages.IllegalContinue);
        }

        return node.finishContinueStatement(label);
    }

    // ECMA-262 13.9 The break statement

    function parseBreakStatement(node) {
        var label = null, key;

        expectKeyword('break');

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (source.charCodeAt(lastIndex) === 0x3B) {
            lex();

            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }

            return node.finishBreakStatement(null);
        }

        if (hasLineTerminator) {
            if (!(state.inIteration || state.inSwitch)) {
                throwError(Messages.IllegalBreak);
            }
        } else if (lookahead.type === Token.Identifier) {
            label = parseVariableIdentifier();

            key = '$' + label.name;
            if (!Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.UnknownLabel, label.name);
            }
        }

        consumeSemicolon();

        if (label === null && !(state.inIteration || state.inSwitch)) {
            throwError(Messages.IllegalBreak);
        }

        return node.finishBreakStatement(label);
    }

    // ECMA-262 13.10 The return statement

    function parseReturnStatement(node) {
        var argument = null;

        expectKeyword('return');

        if (!state.inFunctionBody) {
            tolerateError(Messages.IllegalReturn);
        }

        // 'return' followed by a space and an identifier is very common.
        if (source.charCodeAt(lastIndex) === 0x20) {
            if (isIdentifierStart(source.charCodeAt(lastIndex + 1))) {
                argument = parseExpression();
                consumeSemicolon();
                return node.finishReturnStatement(argument);
            }
        }

        if (hasLineTerminator) {
            // HACK
            return node.finishReturnStatement(null);
        }

        if (!match(';')) {
            if (!match('}') && lookahead.type !== Token.EOF) {
                argument = parseExpression();
            }
        }

        consumeSemicolon();

        return node.finishReturnStatement(argument);
    }

    // ECMA-262 13.11 The with statement

    function parseWithStatement(node) {
        var object, body;

        if (strict) {
            tolerateError(Messages.StrictModeWith);
        }

        expectKeyword('with');

        expect('(');

        object = parseExpression();

        expect(')');

        body = parseStatement();

        return node.finishWithStatement(object, body);
    }

    // ECMA-262 13.12 The switch statement

    function parseSwitchCase() {
        var test, consequent = [], statement, node = new Node();

        if (matchKeyword('default')) {
            lex();
            test = null;
        } else {
            expectKeyword('case');
            test = parseExpression();
        }
        expect(':');

        while (startIndex < length) {
            if (match('}') || matchKeyword('default') || matchKeyword('case')) {
                break;
            }
            statement = parseStatementListItem();
            consequent.push(statement);
        }

        return node.finishSwitchCase(test, consequent);
    }

    function parseSwitchStatement(node) {
        var discriminant, cases, clause, oldInSwitch, defaultFound;

        expectKeyword('switch');

        expect('(');

        discriminant = parseExpression();

        expect(')');

        expect('{');

        cases = [];

        if (match('}')) {
            lex();
            return node.finishSwitchStatement(discriminant, cases);
        }

        oldInSwitch = state.inSwitch;
        state.inSwitch = true;
        defaultFound = false;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            clause = parseSwitchCase();
            if (clause.test === null) {
                if (defaultFound) {
                    throwError(Messages.MultipleDefaultsInSwitch);
                }
                defaultFound = true;
            }
            cases.push(clause);
        }

        state.inSwitch = oldInSwitch;

        expect('}');

        return node.finishSwitchStatement(discriminant, cases);
    }

    // ECMA-262 13.14 The throw statement

    function parseThrowStatement(node) {
        var argument;

        expectKeyword('throw');

        if (hasLineTerminator) {
            throwError(Messages.NewlineAfterThrow);
        }

        argument = parseExpression();

        consumeSemicolon();

        return node.finishThrowStatement(argument);
    }

    // ECMA-262 13.15 The try statement

    function parseCatchClause() {
        var param, params = [], paramMap = {}, key, i, body, node = new Node();

        expectKeyword('catch');

        expect('(');
        if (match(')')) {
            throwUnexpectedToken(lookahead);
        }

        param = parsePattern(params);
        for (i = 0; i < params.length; i++) {
            key = '$' + params[i].value;
            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
                tolerateError(Messages.DuplicateBinding, params[i].value);
            }
            paramMap[key] = true;
        }

        // ECMA-262 12.14.1
        if (strict && isRestrictedWord(param.name)) {
            tolerateError(Messages.StrictCatchVariable);
        }

        expect(')');
        body = parseBlock();
        return node.finishCatchClause(param, body);
    }

    function parseTryStatement(node) {
        var block, handler = null, finalizer = null;

        expectKeyword('try');

        block = parseBlock();

        if (matchKeyword('catch')) {
            handler = parseCatchClause();
        }

        if (matchKeyword('finally')) {
            lex();
            finalizer = parseBlock();
        }

        if (!handler && !finalizer) {
            throwError(Messages.NoCatchOrFinally);
        }

        return node.finishTryStatement(block, handler, finalizer);
    }

    // ECMA-262 13.16 The debugger statement

    function parseDebuggerStatement(node) {
        expectKeyword('debugger');

        consumeSemicolon();

        return node.finishDebuggerStatement();
    }

    // 13 Statements

    function parseStatement() {
        var type = lookahead.type,
            expr,
            labeledBody,
            key,
            node;

        if (type === Token.EOF) {
            throwUnexpectedToken(lookahead);
        }

        if (type === Token.Punctuator && lookahead.value === '{') {
            return parseBlock();
        }
        isAssignmentTarget = isBindingElement = true;
        node = new Node();

        if (type === Token.Punctuator) {
            switch (lookahead.value) {
            case ';':
                return parseEmptyStatement(node);
            case '(':
                return parseExpressionStatement(node);
            default:
                break;
            }
        } else if (type === Token.Keyword) {
            switch (lookahead.value) {
            case 'break':
                return parseBreakStatement(node);
            case 'continue':
                return parseContinueStatement(node);
            case 'debugger':
                return parseDebuggerStatement(node);
            case 'do':
                return parseDoWhileStatement(node);
            case 'for':
                return parseForStatement(node);
            case 'function':
                return parseFunctionDeclaration(node);
            case 'if':
                return parseIfStatement(node);
            case 'return':
                return parseReturnStatement(node);
            case 'switch':
                return parseSwitchStatement(node);
            case 'throw':
                return parseThrowStatement(node);
            case 'try':
                return parseTryStatement(node);
            case 'var':
                return parseVariableStatement(node);
            case 'while':
                return parseWhileStatement(node);
            case 'with':
                return parseWithStatement(node);
            default:
                break;
            }
        }

        expr = parseExpression();

        // ECMA-262 12.12 Labelled Statements
        if ((expr.type === Syntax.Identifier) && match(':')) {
            lex();

            key = '$' + expr.name;
            if (Object.prototype.hasOwnProperty.call(state.labelSet, key)) {
                throwError(Messages.Redeclaration, 'Label', expr.name);
            }

            state.labelSet[key] = true;
            labeledBody = parseStatement();
            delete state.labelSet[key];
            return node.finishLabeledStatement(expr, labeledBody);
        }

        consumeSemicolon();

        return node.finishExpressionStatement(expr);
    }

    // ECMA-262 14.1 Function Definition

    function parseFunctionSourceElements() {
        var statement, body = [], token, directive, firstRestricted,
            oldLabelSet, oldInIteration, oldInSwitch, oldInFunctionBody, oldParenthesisCount,
            node = new Node();

        expect('{');

        while (startIndex < length) {
            if (lookahead.type !== Token.StringLiteral) {
                break;
            }
            token = lookahead;

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        oldLabelSet = state.labelSet;
        oldInIteration = state.inIteration;
        oldInSwitch = state.inSwitch;
        oldInFunctionBody = state.inFunctionBody;
        oldParenthesisCount = state.parenthesizedCount;

        state.labelSet = {};
        state.inIteration = false;
        state.inSwitch = false;
        state.inFunctionBody = true;
        state.parenthesizedCount = 0;

        while (startIndex < length) {
            if (match('}')) {
                break;
            }
            body.push(parseStatementListItem());
        }

        expect('}');

        state.labelSet = oldLabelSet;
        state.inIteration = oldInIteration;
        state.inSwitch = oldInSwitch;
        state.inFunctionBody = oldInFunctionBody;
        state.parenthesizedCount = oldParenthesisCount;

        return node.finishBlockStatement(body);
    }

    function validateParam(options, param, name) {
        var key = '$' + name;
        if (strict) {
            if (isRestrictedWord(name)) {
                options.stricted = param;
                options.message = Messages.StrictParamName;
            }
            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        } else if (!options.firstRestricted) {
            if (isRestrictedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictParamName;
            } else if (isStrictModeReservedWord(name)) {
                options.firstRestricted = param;
                options.message = Messages.StrictReservedWord;
            } else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
                options.stricted = param;
                options.message = Messages.StrictParamDupe;
            }
        }
        options.paramSet[key] = true;
    }

    function parseParam(options) {
        var token, param, params = [], i, def;

        token = lookahead;
        if (token.value === '...') {
            param = parseRestElement(params);
            validateParam(options, param.argument, param.argument.name);
            options.params.push(param);
            options.defaults.push(null);
            return false;
        }

        param = parsePatternWithDefault(params);
        for (i = 0; i < params.length; i++) {
            validateParam(options, params[i], params[i].value);
        }

        if (param.type === Syntax.AssignmentPattern) {
            def = param.right;
            param = param.left;
            ++options.defaultCount;
        }

        options.params.push(param);
        options.defaults.push(def);

        return !match(')');
    }

    function parseParams(firstRestricted) {
        var options;

        options = {
            params: [],
            defaultCount: 0,
            defaults: [],
            firstRestricted: firstRestricted
        };

        expect('(');

        if (!match(')')) {
            options.paramSet = {};
            while (startIndex < length) {
                if (!parseParam(options)) {
                    break;
                }
                expect(',');
            }
        }

        expect(')');

        if (options.defaultCount === 0) {
            options.defaults = [];
        }

        return {
            params: options.params,
            defaults: options.defaults,
            stricted: options.stricted,
            firstRestricted: options.firstRestricted,
            message: options.message
        };
    }

    function parseFunctionDeclaration(node, identifierIsOptional) {
        var id = null, params = [], defaults = [], body, token, stricted, tmp, firstRestricted, message, previousStrict,
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        if (!identifierIsOptional || !match('(')) {
            token = lookahead;
            id = parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        state.allowYield = !isGenerator;
        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }


        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }

        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionDeclaration(id, params, defaults, body, isGenerator);
    }

    function parseFunctionExpression() {
        var token, id = null, stricted, firstRestricted, message, tmp,
            params = [], defaults = [], body, previousStrict, node = new Node(),
            isGenerator, previousAllowYield;

        previousAllowYield = state.allowYield;

        expectKeyword('function');

        isGenerator = match('*');
        if (isGenerator) {
            lex();
        }

        state.allowYield = !isGenerator;
        if (!match('(')) {
            token = lookahead;
            id = (!strict && !isGenerator && matchKeyword('yield')) ? parseNonComputedProperty() : parseVariableIdentifier();
            if (strict) {
                if (isRestrictedWord(token.value)) {
                    tolerateUnexpectedToken(token, Messages.StrictFunctionName);
                }
            } else {
                if (isRestrictedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictFunctionName;
                } else if (isStrictModeReservedWord(token.value)) {
                    firstRestricted = token;
                    message = Messages.StrictReservedWord;
                }
            }
        }

        tmp = parseParams(firstRestricted);
        params = tmp.params;
        defaults = tmp.defaults;
        stricted = tmp.stricted;
        firstRestricted = tmp.firstRestricted;
        if (tmp.message) {
            message = tmp.message;
        }

        previousStrict = strict;
        body = parseFunctionSourceElements();
        if (strict && firstRestricted) {
            throwUnexpectedToken(firstRestricted, message);
        }
        if (strict && stricted) {
            tolerateUnexpectedToken(stricted, message);
        }
        strict = previousStrict;
        state.allowYield = previousAllowYield;

        return node.finishFunctionExpression(id, params, defaults, body, isGenerator);
    }

    // ECMA-262 14.5 Class Definitions

    function parseClassBody() {
        var classBody, token, isStatic, hasConstructor = false, body, method, computed, key;

        classBody = new Node();

        expect('{');
        body = [];
        while (!match('}')) {
            if (match(';')) {
                lex();
            } else {
                method = new Node();
                token = lookahead;
                isStatic = false;
                computed = match('[');
                if (match('*')) {
                    lex();
                } else {
                    key = parseObjectPropertyKey();
                    if (key.name === 'static' && (lookaheadPropertyName() || match('*'))) {
                        token = lookahead;
                        isStatic = true;
                        computed = match('[');
                        if (match('*')) {
                            lex();
                        } else {
                            key = parseObjectPropertyKey();
                        }
                    }
                }
                method = tryParseMethodDefinition(token, key, computed, method);
                if (method) {
                    method['static'] = isStatic; // jscs:ignore requireDotNotation
                    if (method.kind === 'init') {
                        method.kind = 'method';
                    }
                    if (!isStatic) {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'constructor') {
                            if (method.kind !== 'method' || !method.method || method.value.generator) {
                                throwUnexpectedToken(token, Messages.ConstructorSpecialMethod);
                            }
                            if (hasConstructor) {
                                throwUnexpectedToken(token, Messages.DuplicateConstructor);
                            } else {
                                hasConstructor = true;
                            }
                            method.kind = 'constructor';
                        }
                    } else {
                        if (!method.computed && (method.key.name || method.key.value.toString()) === 'prototype') {
                            throwUnexpectedToken(token, Messages.StaticPrototype);
                        }
                    }
                    method.type = Syntax.MethodDefinition;
                    delete method.method;
                    delete method.shorthand;
                    body.push(method);
                } else {
                    throwUnexpectedToken(lookahead);
                }
            }
        }
        lex();
        return classBody.finishClassBody(body);
    }

    function parseClassDeclaration(identifierIsOptional) {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (!identifierIsOptional || lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassDeclaration(id, superClass, classBody);
    }

    function parseClassExpression() {
        var id = null, superClass = null, classNode = new Node(), classBody, previousStrict = strict;
        strict = true;

        expectKeyword('class');

        if (lookahead.type === Token.Identifier) {
            id = parseVariableIdentifier();
        }

        if (matchKeyword('extends')) {
            lex();
            superClass = isolateCoverGrammar(parseLeftHandSideExpressionAllowCall);
        }
        classBody = parseClassBody();
        strict = previousStrict;

        return classNode.finishClassExpression(id, superClass, classBody);
    }

    // ECMA-262 15.2 Modules

    function parseModuleSpecifier() {
        var node = new Node();

        if (lookahead.type !== Token.StringLiteral) {
            throwError(Messages.InvalidModuleSpecifier);
        }
        return node.finishLiteral(lex());
    }

    // ECMA-262 15.2.3 Exports

    function parseExportSpecifier() {
        var exported, local, node = new Node(), def;
        if (matchKeyword('default')) {
            // export {default} from 'something';
            def = new Node();
            lex();
            local = def.finishIdentifier('default');
        } else {
            local = parseVariableIdentifier();
        }
        if (matchContextualKeyword('as')) {
            lex();
            exported = parseNonComputedProperty();
        }
        return node.finishExportSpecifier(local, exported);
    }

    function parseExportNamedDeclaration(node) {
        var declaration = null,
            isExportFromIdentifier,
            src = null, specifiers = [];

        // non-default export
        if (lookahead.type === Token.Keyword) {
            // covers:
            // export var f = 1;
            switch (lookahead.value) {
                case 'let':
                case 'const':
                    declaration = parseLexicalDeclaration({inFor: false});
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
                case 'var':
                case 'class':
                case 'function':
                    declaration = parseStatementListItem();
                    return node.finishExportNamedDeclaration(declaration, specifiers, null);
            }
        }

        expect('{');
        while (!match('}')) {
            isExportFromIdentifier = isExportFromIdentifier || matchKeyword('default');
            specifiers.push(parseExportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');

        if (matchContextualKeyword('from')) {
            // covering:
            // export {default} from 'foo';
            // export {foo} from 'foo';
            lex();
            src = parseModuleSpecifier();
            consumeSemicolon();
        } else if (isExportFromIdentifier) {
            // covering:
            // export {default}; // missing fromClause
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        } else {
            // cover
            // export {foo};
            consumeSemicolon();
        }
        return node.finishExportNamedDeclaration(declaration, specifiers, src);
    }

    function parseExportDefaultDeclaration(node) {
        var declaration = null,
            expression = null;

        // covers:
        // export default ...
        expectKeyword('default');

        if (matchKeyword('function')) {
            // covers:
            // export default function foo () {}
            // export default function () {}
            declaration = parseFunctionDeclaration(new Node(), true);
            return node.finishExportDefaultDeclaration(declaration);
        }
        if (matchKeyword('class')) {
            declaration = parseClassDeclaration(true);
            return node.finishExportDefaultDeclaration(declaration);
        }

        if (matchContextualKeyword('from')) {
            throwError(Messages.UnexpectedToken, lookahead.value);
        }

        // covers:
        // export default {};
        // export default [];
        // export default (1 + 2);
        if (match('{')) {
            expression = parseObjectInitializer();
        } else if (match('[')) {
            expression = parseArrayInitializer();
        } else {
            expression = parseAssignmentExpression();
        }
        consumeSemicolon();
        return node.finishExportDefaultDeclaration(expression);
    }

    function parseExportAllDeclaration(node) {
        var src;

        // covers:
        // export * from 'foo';
        expect('*');
        if (!matchContextualKeyword('from')) {
            throwError(lookahead.value ?
                    Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
        }
        lex();
        src = parseModuleSpecifier();
        consumeSemicolon();

        return node.finishExportAllDeclaration(src);
    }

    function parseExportDeclaration() {
        var node = new Node();
        if (state.inFunctionBody) {
            throwError(Messages.IllegalExportDeclaration);
        }

        expectKeyword('export');

        if (matchKeyword('default')) {
            return parseExportDefaultDeclaration(node);
        }
        if (match('*')) {
            return parseExportAllDeclaration(node);
        }
        return parseExportNamedDeclaration(node);
    }

    // ECMA-262 15.2.2 Imports

    function parseImportSpecifier() {
        // import {<foo as bar>} ...;
        var local, imported, node = new Node();

        imported = parseNonComputedProperty();
        if (matchContextualKeyword('as')) {
            lex();
            local = parseVariableIdentifier();
        }

        return node.finishImportSpecifier(local, imported);
    }

    function parseNamedImports() {
        var specifiers = [];
        // {foo, bar as bas}
        expect('{');
        while (!match('}')) {
            specifiers.push(parseImportSpecifier());
            if (!match('}')) {
                expect(',');
                if (match('}')) {
                    break;
                }
            }
        }
        expect('}');
        return specifiers;
    }

    function parseImportDefaultSpecifier() {
        // import <foo> ...;
        var local, node = new Node();

        local = parseNonComputedProperty();

        return node.finishImportDefaultSpecifier(local);
    }

    function parseImportNamespaceSpecifier() {
        // import <* as foo> ...;
        var local, node = new Node();

        expect('*');
        if (!matchContextualKeyword('as')) {
            throwError(Messages.NoAsAfterImportNamespace);
        }
        lex();
        local = parseNonComputedProperty();

        return node.finishImportNamespaceSpecifier(local);
    }

    function parseImportDeclaration() {
        var specifiers = [], src, node = new Node();

        if (state.inFunctionBody) {
            throwError(Messages.IllegalImportDeclaration);
        }

        expectKeyword('import');

        if (lookahead.type === Token.StringLiteral) {
            // import 'foo';
            src = parseModuleSpecifier();
        } else {

            if (match('{')) {
                // import {bar}
                specifiers = specifiers.concat(parseNamedImports());
            } else if (match('*')) {
                // import * as foo
                specifiers.push(parseImportNamespaceSpecifier());
            } else if (isIdentifierName(lookahead) && !matchKeyword('default')) {
                // import foo
                specifiers.push(parseImportDefaultSpecifier());
                if (match(',')) {
                    lex();
                    if (match('*')) {
                        // import foo, * as foo
                        specifiers.push(parseImportNamespaceSpecifier());
                    } else if (match('{')) {
                        // import foo, {bar}
                        specifiers = specifiers.concat(parseNamedImports());
                    } else {
                        throwUnexpectedToken(lookahead);
                    }
                }
            } else {
                throwUnexpectedToken(lex());
            }

            if (!matchContextualKeyword('from')) {
                throwError(lookahead.value ?
                        Messages.UnexpectedToken : Messages.MissingFromClause, lookahead.value);
            }
            lex();
            src = parseModuleSpecifier();
        }

        consumeSemicolon();
        return node.finishImportDeclaration(specifiers, src);
    }

    // ECMA-262 15.1 Scripts

    function parseScriptBody() {
        var statement, body = [], token, directive, firstRestricted;

        while (startIndex < length) {
            token = lookahead;
            if (token.type !== Token.StringLiteral) {
                break;
            }

            statement = parseStatementListItem();
            body.push(statement);
            if (statement.expression.type !== Syntax.Literal) {
                // this is not directive
                break;
            }
            directive = source.slice(token.start + 1, token.end - 1);
            if (directive === 'use strict') {
                strict = true;
                if (firstRestricted) {
                    tolerateUnexpectedToken(firstRestricted, Messages.StrictOctalLiteral);
                }
            } else {
                if (!firstRestricted && token.octal) {
                    firstRestricted = token;
                }
            }
        }

        while (startIndex < length) {
            statement = parseStatementListItem();
            /* istanbul ignore if */
            if (typeof statement === 'undefined') {
                break;
            }
            body.push(statement);
        }
        return body;
    }

    function parseProgram() {
        var body, node;

        peek();
        node = new Node();

        body = parseScriptBody();
        return node.finishProgram(body, state.sourceType);
    }

    function filterTokenLocation() {
        var i, entry, token, tokens = [];

        for (i = 0; i < extra.tokens.length; ++i) {
            entry = extra.tokens[i];
            token = {
                type: entry.type,
                value: entry.value
            };
            if (entry.regex) {
                token.regex = {
                    pattern: entry.regex.pattern,
                    flags: entry.regex.flags
                };
            }
            if (extra.range) {
                token.range = entry.range;
            }
            if (extra.loc) {
                token.loc = entry.loc;
            }
            tokens.push(token);
        }

        extra.tokens = tokens;
    }

    function tokenize(code, options, delegate) {
        var toString,
            tokens;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: []
        };

        extra = {};

        // Options matching.
        options = options || {};

        // Of course we collect tokens here.
        options.tokens = true;
        extra.tokens = [];
        extra.tokenValues = [];
        extra.tokenize = true;
        extra.delegate = delegate;

        // The following two fields are necessary to compute the Regex tokens.
        extra.openParenToken = -1;
        extra.openCurlyToken = -1;

        extra.range = (typeof options.range === 'boolean') && options.range;
        extra.loc = (typeof options.loc === 'boolean') && options.loc;

        if (typeof options.comment === 'boolean' && options.comment) {
            extra.comments = [];
        }
        if (typeof options.tolerant === 'boolean' && options.tolerant) {
            extra.errors = [];
        }

        try {
            peek();
            if (lookahead.type === Token.EOF) {
                return extra.tokens;
            }

            lex();
            while (lookahead.type !== Token.EOF) {
                try {
                    lex();
                } catch (lexError) {
                    if (extra.errors) {
                        recordError(lexError);
                        // We have to break on the first error
                        // to avoid infinite loops.
                        break;
                    } else {
                        throw lexError;
                    }
                }
            }

            tokens = extra.tokens;
            if (typeof extra.errors !== 'undefined') {
                tokens.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }
        return tokens;
    }

    function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }

        source = code;
        index = 0;
        lineNumber = (source.length > 0) ? 1 : 0;
        lineStart = 0;
        startIndex = index;
        startLineNumber = lineNumber;
        startLineStart = lineStart;
        length = source.length;
        lookahead = null;
        state = {
            allowIn: true,
            allowYield: true,
            labelSet: {},
            inFunctionBody: false,
            inIteration: false,
            inSwitch: false,
            lastCommentStart: -1,
            curlyStack: [],
            sourceType: 'script'
        };
        strict = false;

        extra = {};
        if (typeof options !== 'undefined') {
            extra.range = (typeof options.range === 'boolean') && options.range;
            extra.loc = (typeof options.loc === 'boolean') && options.loc;
            extra.attachComment = (typeof options.attachComment === 'boolean') && options.attachComment;

            if (extra.loc && options.source !== null && options.source !== undefined) {
                extra.source = toString(options.source);
            }

            if (typeof options.tokens === 'boolean' && options.tokens) {
                extra.tokens = [];
            }
            if (typeof options.comment === 'boolean' && options.comment) {
                extra.comments = [];
            }
            if (typeof options.tolerant === 'boolean' && options.tolerant) {
                extra.errors = [];
            }
            if (extra.attachComment) {
                extra.range = true;
                extra.comments = [];
                extra.bottomRightStack = [];
                extra.trailingComments = [];
                extra.leadingComments = [];
            }
            if (options.sourceType === 'module') {
                // very restrictive condition for now
                state.sourceType = options.sourceType;
                strict = true;
            }
        }

        try {
            program = parseProgram();
            if (typeof extra.comments !== 'undefined') {
                program.comments = extra.comments;
            }
            if (typeof extra.tokens !== 'undefined') {
                filterTokenLocation();
                program.tokens = extra.tokens;
            }
            if (typeof extra.errors !== 'undefined') {
                program.errors = extra.errors;
            }
        } catch (e) {
            throw e;
        } finally {
            extra = {};
        }

        return program;
    }

    // Sync with *.json manifests.
    exports.version = '2.7.0';

    exports.tokenize = tokenize;

    exports.parse = parse;

    // Deep copy.
    /* istanbul ignore next */
    exports.Syntax = (function () {
        var name, types = {};

        if (typeof Object.create === 'function') {
            types = Object.create(null);
        }

        for (name in Syntax) {
            if (Syntax.hasOwnProperty(name)) {
                types[name] = Syntax[name];
            }
        }

        if (typeof Object.freeze === 'function') {
            Object.freeze(types);
        }

        return types;
    }());

}));
/* vim: set sw=4 ts=4 et tw=80 : */
};
BundleModuleCode['dos/ext/satelize']=function (module,exports,global,process){
/* 
* satelize - v0.1.2
*
* (c) 2013 Julien VALERY https://github.com/darul75/satelize, 2018 modfied by bLAB Dr. Stefan Bosse
*
* Usage: satelize(ip:string|undefined,function (err,info))
*
* License: MIT 
*/

  
function Satelize(){
  this.init()
}
var http=Require("http"),
    serviceHost="ip-api.com",
    servicePath="/json",
    serviceJSONP="";
    
Satelize.prototype.init=function(){
  return this
}

Satelize.prototype.satelize=function(a,b){
  var c=(a.ip?"/"+a.ip:"")+(a.JSONP?serviceJSONP:""),
      d=a.timeout||1e3,
      e,
      f;
  if (!http) return b('ENOTSUPPORTED',null);
  if (!http.xhr && http.request) {
     e={hostname:serviceHost,path:servicePath+c,method:"GET",port:80};
     f=http.request(e,function(a){
        a.setEncoding("utf8");
        var c="";
        a.on("data",function(a){c+=a}),
        a.on("end",function(){
          return b(null,JSON.parse(c))
        })
    });
    return f.on("error",function(a){return b(a)}),
           f.setTimeout(d,function(){return b(new Error("timeout"))}),
           f.end(),this;
  } else {
    e={uri:'http://'+serviceHost+servicePath+c,method:"GET",
       headers:{}};
    http.request(e,function(err,xhr,body){
      if (err) return b(err);
      else b(null,JSON.parse(body));
    })
    return this;
  }
}

var sat=new Satelize;
module.exports=sat;
};
BundleModuleCode['os/platform']=function (module,exports,global,process){
/*!
 * Platform.js
 * get OS/Cpu/Arch/memory/.. information in nodejs and browser
 * Copyright 2014-2018 Benjamin Tan
 * Copyright 2011-2013 John-David Dalton
 * Available under MIT license
 * Modified by @blab
 * Ver. 1.2.2
 */
if (global.TARGET=='browser') {
/*
Returns: 

platform.name; // 'Safari'
platform.version; // '5.1'
platform.product; // 'iPad'
platform.manufacturer; // 'Apple'
platform.engine; // 'WebKit'
platform.os; // 'iOS 5.0'
platform.description; // 'Safari 5.1 on Apple iPad (iOS 5.0)'
platform.mobile; // 'true'
platform.touch; // 'false'
platform.geoloc; // 'true'
*/
  /** Used to determine if values are of the language type `Object`. */
  var objectTypes = {
    'function': true,
    'object': true
  };

  /** Used as a reference to the global object. */
  var root = (objectTypes[typeof window] && window) || this;

  /** Backup possible global object. */
  var oldRoot = root;

  /** Detect free variable `exports`. */
  var freeExports = objectTypes[typeof exports] && exports;

  /** Detect free variable `module`. */
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;

  /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. */
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
    root = freeGlobal;
  }

  /**
   * Used as the maximum length of an array-like object.
   * See the [ES6 spec](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
   * for more details.
   */
  var maxSafeInteger = Math.pow(2, 53) - 1;

  /** Regular expression to detect Opera. */
  var reOpera = /\bOpera/;

  /** Possible global object. */
  var thisBinding = this;

  /** Used for native method references. */
  var objectProto = Object.prototype;

  /** Used to check for own properties of an object. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /** Used to resolve the internal `[[Class]]` of values. */
  var toString = objectProto.toString;

  /*--------------------------------------------------------------------------*/

  /**
   * Capitalizes a string value.
   *
   * @private
   * @param {string} string The string to capitalize.
   * @returns {string} The capitalized string.
   */
  function capitalize(string) {
    string = String(string);
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * A utility function to clean up the OS name.
   *
   * @private
   * @param {string} os The OS name to clean up.
   * @param {string} [pattern] A `RegExp` pattern matching the OS name.
   * @param {string} [label] A label for the OS.
   */
  function cleanupOS(os, pattern, label) {
    // Platform tokens are defined at:
    // http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
    // http://web.archive.org/web/20081122053950/http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
    var data = {
      '10.0': '10',
      '6.4':  '10 Technical Preview',
      '6.3':  '8.1',
      '6.2':  '8',
      '6.1':  'Server 2008 R2 / 7',
      '6.0':  'Server 2008 / Vista',
      '5.2':  'Server 2003 / XP 64-bit',
      '5.1':  'XP',
      '5.01': '2000 SP1',
      '5.0':  '2000',
      '4.0':  'NT',
      '4.90': 'ME'
    };
    // Detect Windows version from platform tokens.
    if (pattern && label && /^Win/i.test(os) && !/^Windows Phone /i.test(os) &&
        (data = data[/[\d.]+$/.exec(os)])) {
      os = 'Windows ' + data;
    }
    // Correct character case and cleanup string.
    os = String(os);

    if (pattern && label) {
      os = os.replace(RegExp(pattern, 'i'), label);
    }

    os = format(
      os.replace(/ ce$/i, ' CE')
        .replace(/\bhpw/i, 'web')
        .replace(/\bMacintosh\b/, 'Mac OS')
        .replace(/_PowerPC\b/i, ' OS')
        .replace(/\b(OS X) [^ \d]+/i, '$1')
        .replace(/\bMac (OS X)\b/, '$1')
        .replace(/\/(\d)/, ' $1')
        .replace(/_/g, '.')
        .replace(/(?: BePC|[ .]*fc[ \d.]+)$/i, '')
        .replace(/\bx86\.64\b/gi, 'x86_64')
        .replace(/\b(Windows Phone) OS\b/, '$1')
        .replace(/\b(Chrome OS \w+) [\d.]+\b/, '$1')
        .split(' on ')[0]
    );

    return os;
  }

  /**
   * An iteration utility for arrays and objects.
   *
   * @private
   * @param {Array|Object} object The object to iterate over.
   * @param {Function} callback The function called per iteration.
   */
  function each(object, callback) {
    var index = -1,
        length = object ? object.length : 0;

    if (typeof length == 'number' && length > -1 && length <= maxSafeInteger) {
      while (++index < length) {
        callback(object[index], index, object);
      }
    } else {
      forOwn(object, callback);
    }
  }

  /**
   * Trim and conditionally capitalize string values.
   *
   * @private
   * @param {string} string The string to format.
   * @returns {string} The formatted string.
   */
  function format(string) {
    string = trim(string);
    return /^(?:webOS|i(?:OS|P))/.test(string)
      ? string
      : capitalize(string);
  }

  /**
   * Iterates over an object's own properties, executing the `callback` for each.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} callback The function executed per own property.
   */
  function forOwn(object, callback) {
    for (var key in object) {
      if (hasOwnProperty.call(object, key)) {
        callback(object[key], key, object);
      }
    }
  }

  /**
   * Gets the internal `[[Class]]` of a value.
   *
   * @private
   * @param {*} value The value.
   * @returns {string} The `[[Class]]`.
   */
  function getClassOf(value) {
    return value == null
      ? capitalize(value)
      : toString.call(value).slice(8, -1);
  }

  /**
   * Host objects can return type values that are different from their actual
   * data type. The objects we are concerned with usually return non-primitive
   * types of "object", "function", or "unknown".
   *
   * @private
   * @param {*} object The owner of the property.
   * @param {string} property The property to check.
   * @returns {boolean} Returns `true` if the property value is a non-primitive, else `false`.
   */
  function isHostType(object, property) {
    var type = object != null ? typeof object[property] : 'number';
    return !/^(?:boolean|number|string|undefined)$/.test(type) &&
      (type == 'object' ? !!object[property] : true);
  }

  /**
   * Prepares a string for use in a `RegExp` by making hyphens and spaces optional.
   *
   * @private
   * @param {string} string The string to qualify.
   * @returns {string} The qualified string.
   */
  function qualify(string) {
    return String(string).replace(/([ -])(?!$)/g, '$1?');
  }

  /**
   * A bare-bones `Array#reduce` like utility function.
   *
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function called per iteration.
   * @returns {*} The accumulated result.
   */
  function reduce(array, callback) {
    var accumulator = null;
    each(array, function(value, index) {
      accumulator = callback(accumulator, value, index, array);
    });
    return accumulator;
  }

  /**
   * Removes leading and trailing whitespace from a string.
   *
   * @private
   * @param {string} string The string to trim.
   * @returns {string} The trimmed string.
   */
  function trim(string) {
    return String(string).replace(/^ +| +$/g, '');
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Creates a new platform object.
   *
   * @memberOf platform
   * @param {Object|string} [ua=navigator.userAgent] The user agent string or
   *  context object.
   * @returns {Object} A platform object.
   */
  function parse(ua) {

    /** The environment context object. */
    var context = root;

    /** Used to flag when a custom context is provided. */
    var isCustomContext = ua && typeof ua == 'object' && getClassOf(ua) != 'String';

    // Juggle arguments.
    if (isCustomContext) {
      context = ua;
      ua = null;
    }

    /** Browser navigator object. */
    var nav = context.navigator || {};

    /** Browser user agent string. */
    var userAgent = nav.userAgent || '';

    ua || (ua = userAgent);

    /** Used to flag when `thisBinding` is the [ModuleScope]. */
    var isModuleScope = isCustomContext || thisBinding == oldRoot;

    /** Used to detect if browser is like Chrome. */
    var likeChrome = isCustomContext
      ? !!nav.likeChrome
      : /\bChrome\b/.test(ua) && !/internal|\n/i.test(toString.toString());

    /** Internal `[[Class]]` value shortcuts. */
    var objectClass = 'Object',
        airRuntimeClass = isCustomContext ? objectClass : 'ScriptBridgingProxyObject',
        enviroClass = isCustomContext ? objectClass : 'Environment',
        javaClass = (isCustomContext && context.java) ? 'JavaPackage' : getClassOf(context.java),
        phantomClass = isCustomContext ? objectClass : 'RuntimeObject';

    /** Detect Java environments. */
    var java = /\bJava/.test(javaClass) && context.java;

    /** Detect Rhino. */
    var rhino = java && getClassOf(context.environment) == enviroClass;

    /** A character to represent alpha. */
    var alpha = java ? 'a' : '\u03b1';

    /** A character to represent beta. */
    var beta = java ? 'b' : '\u03b2';

    /** Browser document object. */
    var doc = context.document || {};

    /**
     * Detect Opera browser (Presto-based).
     * http://www.howtocreate.co.uk/operaStuff/operaObject.html
     * http://dev.opera.com/articles/view/opera-mini-web-content-authoring-guidelines/#operamini
     */
    var opera = context.operamini || context.opera;

    /** Opera `[[Class]]`. */
    var operaClass = reOpera.test(operaClass = (isCustomContext && opera) ? opera['[[Class]]'] : getClassOf(opera))
      ? operaClass
      : (opera = null);

    /*------------------------------------------------------------------------*/

    /** Temporary variable used over the script's lifetime. */
    var data;

    /** The CPU architecture. */
    var arch = ua;

    /** Platform description array. */
    var description = [];

    /** Platform alpha/beta indicator. */
    var prerelease = null;

    /** A flag to indicate that environment features should be used to resolve the platform. */
    var useFeatures = ua == userAgent;

    /** The browser/environment version. */
    var version = useFeatures && opera && typeof opera.version == 'function' && opera.version();

    /** A flag to indicate if the OS ends with "/ Version" */
    var isSpecialCasedOS;

    /* Detectable layout engines (order is important). */
    var layout = getLayout([
      { 'label': 'EdgeHTML', 'pattern': '(?:Edge|EdgA|EdgiOS)' },
      'Trident',
      { 'label': 'WebKit', 'pattern': 'AppleWebKit' },
      'iCab',
      'Presto',
      'NetFront',
      'Tasman',
      'KHTML',
      'Gecko'
    ]);

    /* Detectable browser names (order is important). */
    var name = getName([
      'Adobe AIR',
      'Arora',
      'Avant Browser',
      'Breach',
      'Camino',
      'Electron',
      'Epiphany',
      'Fennec',
      'Flock',
      'Galeon',
      'GreenBrowser',
      'iCab',
      'Iceweasel',
      'K-Meleon',
      'Konqueror',
      'Lunascape',
      'Maxthon',
      { 'label': 'Microsoft Edge', 'pattern': '(?:Edge|Edg|EdgA|EdgiOS)' },
      'Midori',
      'Nook Browser',
      'PaleMoon',
      'PhantomJS',
      'Raven',
      'Rekonq',
      'RockMelt',
      { 'label': 'Samsung Internet', 'pattern': 'SamsungBrowser' },
      'SeaMonkey',
      { 'label': 'Silk', 'pattern': '(?:Cloud9|Silk-Accelerated)' },
      'Sleipnir',
      'SlimBrowser',
      { 'label': 'SRWare Iron', 'pattern': 'Iron' },
      'Sunrise',
      'Swiftfox',
      'Waterfox',
      'WebPositive',
      'Opera Mini',
      { 'label': 'Opera Mini', 'pattern': 'OPiOS' },
      'Opera',
      { 'label': 'Opera', 'pattern': 'OPR' },
      'Chrome',
      { 'label': 'Chrome Mobile', 'pattern': '(?:CriOS|CrMo)' },
      { 'label': 'Firefox', 'pattern': '(?:Firefox|Minefield)' },
      { 'label': 'Firefox for iOS', 'pattern': 'FxiOS' },
      { 'label': 'IE', 'pattern': 'IEMobile' },
      { 'label': 'IE', 'pattern': 'MSIE' },
      'Safari'
    ]);

    /* Detectable products (order is important). */
    var product = getProduct([
      { 'label': 'BlackBerry', 'pattern': 'BB10' },
      'BlackBerry',
      { 'label': 'Galaxy S', 'pattern': 'GT-I9000' },
      { 'label': 'Galaxy S2', 'pattern': 'GT-I9100' },
      { 'label': 'Galaxy S3', 'pattern': 'GT-I9300' },
      { 'label': 'Galaxy S4', 'pattern': 'GT-I9500' },
      { 'label': 'Galaxy S5', 'pattern': 'SM-G900' },
      { 'label': 'Galaxy S6', 'pattern': 'SM-G920' },
      { 'label': 'Galaxy S6 Edge', 'pattern': 'SM-G925' },
      { 'label': 'Galaxy S7', 'pattern': 'SM-G930' },
      { 'label': 'Galaxy S7 Edge', 'pattern': 'SM-G935' },
      'Google TV',
      'Lumia',
      'iPad',
      'iPod',
      'iPhone',
      'Kindle',
      { 'label': 'Kindle Fire', 'pattern': '(?:Cloud9|Silk-Accelerated)' },
      'Nexus',
      'Nook',
      'PlayBook',
      'PlayStation Vita',
      'PlayStation',
      'TouchPad',
      'Transformer',
      { 'label': 'Wii U', 'pattern': 'WiiU' },
      'Wii',
      'Xbox One',
      { 'label': 'Xbox 360', 'pattern': 'Xbox' },
      'Xoom'
    ]);

    /* Detectable manufacturers. */
    var manufacturer = getManufacturer({
      'Apple': { 'iPad': 1, 'iPhone': 1, 'iPod': 1 },
      'Archos': {},
      'Amazon': { 'Kindle': 1, 'Kindle Fire': 1 },
      'Asus': { 'Transformer': 1 },
      'Barnes & Noble': { 'Nook': 1 },
      'BlackBerry': { 'PlayBook': 1 },
      'Google': { 'Google TV': 1, 'Nexus': 1 },
      'HP': { 'TouchPad': 1 },
      'HTC': {},
      'LG': {},
      'Microsoft': { 'Xbox': 1, 'Xbox One': 1 },
      'Motorola': { 'Xoom': 1 },
      'Nintendo': { 'Wii U': 1,  'Wii': 1 },
      'Nokia': { 'Lumia': 1 },
      'Samsung': { 'Galaxy S': 1, 'Galaxy S2': 1, 'Galaxy S3': 1, 'Galaxy S4': 1 },
      'Sony': { 'PlayStation': 1, 'PlayStation Vita': 1 }
    });

    /* Detectable operating systems (order is important). */
    var os = getOS([
      'Windows Phone',
      'Android',
      'CentOS',
      { 'label': 'Chrome OS', 'pattern': 'CrOS' },
      'Debian',
      'Fedora',
      'FreeBSD',
      'Gentoo',
      'Haiku',
      'Kubuntu',
      'Linux Mint',
      'OpenBSD',
      'Red Hat',
      'SuSE',
      'Ubuntu',
      'Xubuntu',
      'Cygwin',
      'Symbian OS',
      'hpwOS',
      'webOS ',
      'webOS',
      'Tablet OS',
      'Tizen',
      'Linux',
      'Mac OS X',
      'Macintosh',
      'Mac',
      'Windows 98;',
      'Windows ',
      'SunOS',
    ]);

    /*------------------------------------------------------------------------*/

    /**
     * Picks the layout engine from an array of guesses.
     *
     * @private
     * @param {Array} guesses An array of guesses.
     * @returns {null|string} The detected layout engine.
     */
    function getLayout(guesses) {
      return reduce(guesses, function(result, guess) {
        return result || RegExp('\\b' + (
          guess.pattern || qualify(guess)
        ) + '\\b', 'i').exec(ua) && (guess.label || guess);
      });
    }

    /**
     * Picks the manufacturer from an array of guesses.
     *
     * @private
     * @param {Array} guesses An object of guesses.
     * @returns {null|string} The detected manufacturer.
     */
    function getManufacturer(guesses) {
      return reduce(guesses, function(result, value, key) {
        // Lookup the manufacturer by product or scan the UA for the manufacturer.
        return result || (
          value[product] ||
          value[/^[a-z]+(?: +[a-z]+\b)*/i.exec(product)] ||
          RegExp('\\b' + qualify(key) + '(?:\\b|\\w*\\d)', 'i').exec(ua)
        ) && key;
      });
    }

    /**
     * Picks the browser name from an array of guesses.
     *
     * @private
     * @param {Array} guesses An array of guesses.
     * @returns {null|string} The detected browser name.
     */
    function getName(guesses) {
      return reduce(guesses, function(result, guess) {
        return result || RegExp('\\b' + (
          guess.pattern || qualify(guess)
        ) + '\\b', 'i').exec(ua) && (guess.label || guess);
      });
    }

    /**
     * Picks the OS name from an array of guesses.
     *
     * @private
     * @param {Array} guesses An array of guesses.
     * @returns {null|string} The detected OS name.
     */
    function getOS(guesses) {
      return reduce(guesses, function(result, guess) {
        var pattern = guess.pattern || qualify(guess);
        if (!result && (result =
              RegExp('\\b' + pattern + '(?:/[\\d.]+|[ \\w.]*)', 'i').exec(ua)
            )) {
          result = cleanupOS(result, pattern, guess.label || guess);
        }
        return result;
      });
    }

    /**
     * Picks the product name from an array of guesses.
     *
     * @private
     * @param {Array} guesses An array of guesses.
     * @returns {null|string} The detected product name.
     */
    function getProduct(guesses) {
      return reduce(guesses, function(result, guess) {
        var pattern = guess.pattern || qualify(guess);
        if (!result && (result =
              RegExp('\\b' + pattern + ' *\\d+[.\\w_]*', 'i').exec(ua) ||
              RegExp('\\b' + pattern + ' *\\w+-[\\w]*', 'i').exec(ua) ||
              RegExp('\\b' + pattern + '(?:; *(?:[a-z]+[_-])?[a-z]+\\d+|[^ ();-]*)', 'i').exec(ua)
            )) {
          // Split by forward slash and append product version if needed.
          if ((result = String((guess.label && !RegExp(pattern, 'i').test(guess.label)) ? guess.label : result).split('/'))[1] && !/[\d.]+/.test(result[0])) {
            result[0] += ' ' + result[1];
          }
          // Correct character case and cleanup string.
          guess = guess.label || guess;
          result = format(result[0]
            .replace(RegExp(pattern, 'i'), guess)
            .replace(RegExp('; *(?:' + guess + '[_-])?', 'i'), ' ')
            .replace(RegExp('(' + guess + ')[-_.]?(\\w)', 'i'), '$1 $2'));
        }
        return result;
      });
    }

    /**
     * Resolves the version using an array of UA patterns.
     *
     * @private
     * @param {Array} patterns An array of UA patterns.
     * @returns {null|string} The detected version.
     */
    function getVersion(patterns) {
      return reduce(patterns, function(result, pattern) {
        return result || (RegExp(pattern +
          '(?:-[\\d.]+/|(?: for [\\w-]+)?[ /-])([\\d.]+[^ ();/_-]*)', 'i').exec(ua) || 0)[1] || null;
      });
    }

    /**
     * Returns `platform.description` when the platform object is coerced to a string.
     *
     * @name toString
     * @memberOf platform
     * @returns {string} Returns `platform.description` if available, else an empty string.
     */
    function toStringPlatform() {
      return this.description || '';
    }

    /*------------------------------------------------------------------------*/

    // Convert layout to an array so we can add extra details.
    layout && (layout = [layout]);

    // Detect product names that contain their manufacturer's name.
    if (manufacturer && !product) {
      product = getProduct([manufacturer]);
    }
    // Clean up Google TV.
    if ((data = /\bGoogle TV\b/.exec(product))) {
      product = data[0];
    }
    // Detect simulators.
    if (/\bSimulator\b/i.test(ua)) {
      product = (product ? product + ' ' : '') + 'Simulator';
    }
    // Detect Opera Mini 8+ running in Turbo/Uncompressed mode on iOS.
    if (name == 'Opera Mini' && /\bOPiOS\b/.test(ua)) {
      description.push('running in Turbo/Uncompressed mode');
    }
    // Detect IE Mobile 11.
    if (name == 'IE' && /\blike iPhone OS\b/.test(ua)) {
      data = parse(ua.replace(/like iPhone OS/, ''));
      manufacturer = data.manufacturer;
      product = data.product;
    }
    // Detect iOS.
    else if (/^iP/.test(product)) {
      name || (name = 'Safari');
      os = 'iOS' + ((data = / OS ([\d_]+)/i.exec(ua))
        ? ' ' + data[1].replace(/_/g, '.')
        : '');
    }
    // Detect Kubuntu.
    else if (name == 'Konqueror' && !/buntu/i.test(os)) {
      os = 'Kubuntu';
    }
    // Detect Android browsers.
    else if ((manufacturer && manufacturer != 'Google' &&
        ((/Chrome/.test(name) && !/\bMobile Safari\b/i.test(ua)) || /\bVita\b/.test(product))) ||
        (/\bAndroid\b/.test(os) && /^Chrome/.test(name) && /\bVersion\//i.test(ua))) {
      name = 'Android Browser';
      os = /\bAndroid\b/.test(os) ? os : 'Android';
    }
    // Detect Silk desktop/accelerated modes.
    else if (name == 'Silk') {
      if (!/\bMobi/i.test(ua)) {
        os = 'Android';
        description.unshift('desktop mode');
      }
      if (/Accelerated *= *true/i.test(ua)) {
        description.unshift('accelerated');
      }
    }
    // Detect PaleMoon identifying as Firefox.
    else if (name == 'PaleMoon' && (data = /\bFirefox\/([\d.]+)\b/.exec(ua))) {
      description.push('identifying as Firefox ' + data[1]);
    }
    // Detect Firefox OS and products running Firefox.
    else if (name == 'Firefox' && (data = /\b(Mobile|Tablet|TV)\b/i.exec(ua))) {
      os || (os = 'Firefox OS');
      product || (product = data[1]);
    }
    // Detect false positives for Firefox/Safari.
    else if (!name || (data = !/\bMinefield\b/i.test(ua) && /\b(?:Firefox|Safari)\b/.exec(name))) {
      // Escape the `/` for Firefox 1.
      if (name && !product && /[\/,]|^[^(]+?\)/.test(ua.slice(ua.indexOf(data + '/') + 8))) {
        // Clear name of false positives.
        name = null;
      }
      // Reassign a generic name.
      if ((data = product || manufacturer || os) &&
          (product || manufacturer || /\b(?:Android|Symbian OS|Tablet OS|webOS)\b/.test(os))) {
        name = /[a-z]+(?: Hat)?/i.exec(/\bAndroid\b/.test(os) ? os : data) + ' Browser';
      }
    }
    // Add Chrome version to description for Electron.
    else if (name == 'Electron' && (data = (/\bChrome\/([\d.]+)\b/.exec(ua) || 0)[1])) {
      description.push('Chromium ' + data);
    }
    // Detect non-Opera (Presto-based) versions (order is important).
    if (!version) {
      version = getVersion([
        '(?:Cloud9|CriOS|CrMo|Edge|Edg|EdgA|EdgiOS|FxiOS|IEMobile|Iron|Opera ?Mini|OPiOS|OPR|Raven|SamsungBrowser|Silk(?!/[\\d.]+$))',
        'Version',
        qualify(name),
        '(?:Firefox|Minefield|NetFront)'
      ]);
    }
    // Detect stubborn layout engines.
    if ((data =
          layout == 'iCab' && parseFloat(version) > 3 && 'WebKit' ||
          /\bOpera\b/.test(name) && (/\bOPR\b/.test(ua) ? 'Blink' : 'Presto') ||
          /\b(?:Midori|Nook|Safari)\b/i.test(ua) && !/^(?:Trident|EdgeHTML)$/.test(layout) && 'WebKit' ||
          !layout && /\bMSIE\b/i.test(ua) && (os == 'Mac OS' ? 'Tasman' : 'Trident') ||
          layout == 'WebKit' && /\bPlayStation\b(?! Vita\b)/i.test(name) && 'NetFront'
        )) {
      layout = [data];
    }
    // Detect Windows Phone 7 desktop mode.
    if (name == 'IE' && (data = (/; *(?:XBLWP|ZuneWP)(\d+)/i.exec(ua) || 0)[1])) {
      name += ' Mobile';
      os = 'Windows Phone ' + (/\+$/.test(data) ? data : data + '.x');
      description.unshift('desktop mode');
    }
    // Detect Windows Phone 8.x desktop mode.
    else if (/\bWPDesktop\b/i.test(ua)) {
      name = 'IE Mobile';
      os = 'Windows Phone 8.x';
      description.unshift('desktop mode');
      version || (version = (/\brv:([\d.]+)/.exec(ua) || 0)[1]);
    }
    // Detect IE 11 identifying as other browsers.
    else if (name != 'IE' && layout == 'Trident' && (data = /\brv:([\d.]+)/.exec(ua))) {
      if (name) {
        description.push('identifying as ' + name + (version ? ' ' + version : ''));
      }
      name = 'IE';
      version = data[1];
    }
    // Leverage environment features.
    if (useFeatures) {
      // Detect server-side environments.
      // Rhino has a global function while others have a global object.
      if (isHostType(context, 'global')) {
        if (java) {
          data = java.lang.System;
          arch = data.getProperty('os.arch');
          os = os || data.getProperty('os.name') + ' ' + data.getProperty('os.version');
        }
        if (rhino) {
          try {
            version = context.require('ringo/engine').version.join('.');
            name = 'RingoJS';
          } catch(e) {
            if ((data = context.system) && data.global.system == context.system) {
              name = 'Narwhal';
              os || (os = data[0].os || null);
            }
          }
          if (!name) {
            name = 'Rhino';
          }
        }
        else if (
          typeof context.process == 'object' && !context.process.browser &&
          (data = context.process)
        ) {
          if (typeof data.versions == 'object') {
            if (typeof data.versions.electron == 'string') {
              description.push('Node ' + data.versions.node);
              name = 'Electron';
              version = data.versions.electron;
            } else if (typeof data.versions.nw == 'string') {
              description.push('Chromium ' + version, 'Node ' + data.versions.node);
              name = 'NW.js';
              version = data.versions.nw;
            }
          }
          if (!name) {
            name = 'Node.js';
            arch = data.arch;
            os = data.platform;
            version = /[\d.]+/.exec(data.version);
            version = version ? version[0] : null;
          }
        }
      }
      // Detect Adobe AIR.
      else if (getClassOf((data = context.runtime)) == airRuntimeClass) {
        name = 'Adobe AIR';
        os = data.flash.system.Capabilities.os;
      }
      // Detect PhantomJS.
      else if (getClassOf((data = context.phantom)) == phantomClass) {
        name = 'PhantomJS';
        version = (data = data.version || null) && (data.major + '.' + data.minor + '.' + data.patch);
      }
      // Detect IE compatibility modes.
      else if (typeof doc.documentMode == 'number' && (data = /\bTrident\/(\d+)/i.exec(ua))) {
        // We're in compatibility mode when the Trident version + 4 doesn't
        // equal the document mode.
        version = [version, doc.documentMode];
        if ((data = +data[1] + 4) != version[1]) {
          description.push('IE ' + version[1] + ' mode');
          layout && (layout[1] = '');
          version[1] = data;
        }
        version = name == 'IE' ? String(version[1].toFixed(1)) : version[0];
      }
      // Detect IE 11 masking as other browsers.
      else if (typeof doc.documentMode == 'number' && /^(?:Chrome|Firefox)\b/.test(name)) {
        description.push('masking as ' + name + ' ' + version);
        name = 'IE';
        version = '11.0';
        layout = ['Trident'];
        os = 'Windows';
      }
      os = os && format(os);
    }
    // Detect prerelease phases.
    if (version && (data =
          /(?:[ab]|dp|pre|[ab]\d+pre)(?:\d+\+?)?$/i.exec(version) ||
          /(?:alpha|beta)(?: ?\d)?/i.exec(ua + ';' + (useFeatures && nav.appMinorVersion)) ||
          /\bMinefield\b/i.test(ua) && 'a'
        )) {
      prerelease = /b/i.test(data) ? 'beta' : 'alpha';
      version = version.replace(RegExp(data + '\\+?$'), '') +
        (prerelease == 'beta' ? beta : alpha) + (/\d+\+?/.exec(data) || '');
    }
    // Detect Firefox Mobile.
    if (name == 'Fennec' || name == 'Firefox' && /\b(?:Android|Firefox OS)\b/.test(os)) {
      name = 'Firefox Mobile';
    }
    // Obscure Maxthon's unreliable version.
    else if (name == 'Maxthon' && version) {
      version = version.replace(/\.[\d.]+/, '.x');
    }
    // Detect Xbox 360 and Xbox One.
    else if (/\bXbox\b/i.test(product)) {
      if (product == 'Xbox 360') {
        os = null;
      }
      if (product == 'Xbox 360' && /\bIEMobile\b/.test(ua)) {
        description.unshift('mobile mode');
      }
    }
    // Add mobile postfix.
    else if ((/^(?:Chrome|IE|Opera)$/.test(name) || name && !product && !/Browser|Mobi/.test(name)) &&
        (os == 'Windows CE' || /Mobi/i.test(ua))) {
      name += ' Mobile';
    }
    // Detect IE platform preview.
    else if (name == 'IE' && useFeatures) {
      try {
        if (context.external === null) {
          description.unshift('platform preview');
        }
      } catch(e) {
        description.unshift('embedded');
      }
    }
    // Detect BlackBerry OS version.
    // http://docs.blackberry.com/en/developers/deliverables/18169/HTTP_headers_sent_by_BB_Browser_1234911_11.jsp
    else if ((/\bBlackBerry\b/.test(product) || /\bBB10\b/.test(ua)) && (data =
          (RegExp(product.replace(/ +/g, ' *') + '/([.\\d]+)', 'i').exec(ua) || 0)[1] ||
          version
        )) {
      data = [data, /BB10/.test(ua)];
      os = (data[1] ? (product = null, manufacturer = 'BlackBerry') : 'Device Software') + ' ' + data[0];
      version = null;
    }
    // Detect Opera identifying/masking itself as another browser.
    // http://www.opera.com/support/kb/view/843/
    else if (this != forOwn && product != 'Wii' && (
          (useFeatures && opera) ||
          (/Opera/.test(name) && /\b(?:MSIE|Firefox)\b/i.test(ua)) ||
          (name == 'Firefox' && /\bOS X (?:\d+\.){2,}/.test(os)) ||
          (name == 'IE' && (
            (os && !/^Win/.test(os) && version > 5.5) ||
            /\bWindows XP\b/.test(os) && version > 8 ||
            version == 8 && !/\bTrident\b/.test(ua)
          ))
        ) && !reOpera.test((data = parse.call(forOwn, ua.replace(reOpera, '') + ';'))) && data.name) {
      // When "identifying", the UA contains both Opera and the other browser's name.
      data = 'ing as ' + data.name + ((data = data.version) ? ' ' + data : '');
      if (reOpera.test(name)) {
        if (/\bIE\b/.test(data) && os == 'Mac OS') {
          os = null;
        }
        data = 'identify' + data;
      }
      // When "masking", the UA contains only the other browser's name.
      else {
        data = 'mask' + data;
        if (operaClass) {
          name = format(operaClass.replace(/([a-z])([A-Z])/g, '$1 $2'));
        } else {
          name = 'Opera';
        }
        if (/\bIE\b/.test(data)) {
          os = null;
        }
        if (!useFeatures) {
          version = null;
        }
      }
      layout = ['Presto'];
      description.push(data);
    }
    // Detect WebKit Nightly and approximate Chrome/Safari versions.
    if ((data = (/\bAppleWebKit\/([\d.]+\+?)/i.exec(ua) || 0)[1])) {
      // Correct build number for numeric comparison.
      // (e.g. "532.5" becomes "532.05")
      data = [parseFloat(data.replace(/\.(\d)$/, '.0$1')), data];
      // Nightly builds are postfixed with a "+".
      if (name == 'Safari' && data[1].slice(-1) == '+') {
        name = 'WebKit Nightly';
        prerelease = 'alpha';
        version = data[1].slice(0, -1);
      }
      // Clear incorrect browser versions.
      else if (version == data[1] ||
          version == (data[2] = (/\bSafari\/([\d.]+\+?)/i.exec(ua) || 0)[1])) {
        version = null;
      }
      // Use the full Chrome version when available.
      data[1] = (/\bChrome\/([\d.]+)/i.exec(ua) || 0)[1];
      // Detect Blink layout engine.
      if (data[0] == 537.36 && data[2] == 537.36 && parseFloat(data[1]) >= 28 && layout == 'WebKit') {
        layout = ['Blink'];
      }
      // Detect JavaScriptCore.
      // http://stackoverflow.com/questions/6768474/how-can-i-detect-which-javascript-engine-v8-or-jsc-is-used-at-runtime-in-androi
      if (!useFeatures || (!likeChrome && !data[1])) {
        layout && (layout[1] = 'like Safari');
        data = (data = data[0], data < 400 ? 1 : data < 500 ? 2 : data < 526 ? 3 : data < 533 ? 4 : data < 534 ? '4+' : data < 535 ? 5 : data < 537 ? 6 : data < 538 ? 7 : data < 601 ? 8 : '8');
      } else {
        layout && (layout[1] = 'like Chrome');
        data = data[1] || (data = data[0], data < 530 ? 1 : data < 532 ? 2 : data < 532.05 ? 3 : data < 533 ? 4 : data < 534.03 ? 5 : data < 534.07 ? 6 : data < 534.10 ? 7 : data < 534.13 ? 8 : data < 534.16 ? 9 : data < 534.24 ? 10 : data < 534.30 ? 11 : data < 535.01 ? 12 : data < 535.02 ? '13+' : data < 535.07 ? 15 : data < 535.11 ? 16 : data < 535.19 ? 17 : data < 536.05 ? 18 : data < 536.10 ? 19 : data < 537.01 ? 20 : data < 537.11 ? '21+' : data < 537.13 ? 23 : data < 537.18 ? 24 : data < 537.24 ? 25 : data < 537.36 ? 26 : layout != 'Blink' ? '27' : '28');
      }
      // Add the postfix of ".x" or "+" for approximate versions.
      layout && (layout[1] += ' ' + (data += typeof data == 'number' ? '.x' : /[.+]/.test(data) ? '' : '+'));
      // Obscure version for some Safari 1-2 releases.
      if (name == 'Safari' && (!version || parseInt(version) > 45)) {
        version = data;
      }
    }
    // Detect Opera desktop modes.
    if (name == 'Opera' &&  (data = /\bzbov|zvav$/.exec(os))) {
      name += ' ';
      description.unshift('desktop mode');
      if (data == 'zvav') {
        name += 'Mini';
        version = null;
      } else {
        name += 'Mobile';
      }
      os = os.replace(RegExp(' *' + data + '$'), '');
    }
    // Detect Chrome desktop mode.
    else if (name == 'Safari' && /\bChrome\b/.exec(layout && layout[1])) {
      description.unshift('desktop mode');
      name = 'Chrome Mobile';
      version = null;

      if (/\bOS X\b/.test(os)) {
        manufacturer = 'Apple';
        os = 'iOS 4.3+';
      } else {
        os = null;
      }
    }
    // Strip incorrect OS versions.
    if (version && version.indexOf((data = /[\d.]+$/.exec(os))) == 0 &&
        ua.indexOf('/' + data + '-') > -1) {
      os = trim(os.replace(data, ''));
    }
    // Add layout engine.
    if (layout && !/\b(?:Avant|Nook)\b/.test(name) && (
        /Browser|Lunascape|Maxthon/.test(name) ||
        name != 'Safari' && /^iOS/.test(os) && /\bSafari\b/.test(layout[1]) ||
        /^(?:Adobe|Arora|Breach|Midori|Opera|Phantom|Rekonq|Rock|Samsung Internet|Sleipnir|Web)/.test(name) && layout[1])) {
      // Don't add layout details to description if they are falsey.
      (data = layout[layout.length - 1]) && description.push(data);
    }
    // Combine contextual information.
    if (description.length) {
      description = ['(' + description.join('; ') + ')'];
    }
    // Append manufacturer to description.
    if (manufacturer && product && product.indexOf(manufacturer) < 0) {
      description.push('on ' + manufacturer);
    }
    // Append product to description.
    if (product) {
      description.push((/^on /.test(description[description.length - 1]) ? '' : 'on ') + product);
    }
    // Parse the OS into an object.
    if (os) {
      data = / ([\d.+]+)$/.exec(os);
      isSpecialCasedOS = data && os.charAt(os.length - data[0].length - 1) == '/';
      os = {
        'architecture': 32,
        'family': (data && !isSpecialCasedOS) ? os.replace(data[0], '') : os,
        'version': data ? data[1] : null,
        'toString': function() {
          var version = this.version;
          return this.family + ((version && !isSpecialCasedOS) ? ' ' + version : '') + (this.architecture == 64 ? ' 64-bit' : '');
        }
      };
    }
    // Add browser/OS architecture.
    if ((data = /\b(?:AMD|IA|Win|WOW|x86_|x)64\b/i.exec(arch)) && !/\bi686\b/i.test(arch)) {
      if (os) {
        os.architecture = 64;
        os.family = os.family.replace(RegExp(' *' + data), '');
      }
      if (
          name && (/\bWOW64\b/i.test(ua) ||
          (useFeatures && /\w(?:86|32)$/.test(nav.cpuClass || nav.platform) && !/\bWin64; x64\b/i.test(ua)))
      ) {
        description.unshift('32-bit');
      }
    }
    // Chrome 39 and above on OS X is always 64-bit.
    else if (
        os && /^OS X/.test(os.family) &&
        name == 'Chrome' && parseFloat(version) >= 39
    ) {
      os.architecture = 64;
    }

    ua || (ua = null);

    /*------------------------------------------------------------------------*/

    /**
     * The platform object.
     *
     * @name platform
     * @type Object
     */
    var platform = {};

    /**
     * The platform description.
     *
     * @memberOf platform
     * @type string|null
     */
    platform.description = ua;

    /**
     * The name of the browser's layout engine.
     *
     * The list of common layout engines include:
     * "Blink", "EdgeHTML", "Gecko", "Trident" and "WebKit"
     *
     * @memberOf platform
     * @type string|null
     */
    platform.engine = layout && layout[0];

    /**
     * The name of the product's manufacturer.
     *
     * The list of manufacturers include:
     * "Apple", "Archos", "Amazon", "Asus", "Barnes & Noble", "BlackBerry",
     * "Google", "HP", "HTC", "LG", "Microsoft", "Motorola", "Nintendo",
     * "Nokia", "Samsung" and "Sony"
     *
     * @memberOf platform
     * @type string|null
     */
    platform.manufacturer = manufacturer;

    /**
     * The name of the browser/environment.
     *
     * The list of common browser names include:
     * "Chrome", "Electron", "Firefox", "Firefox for iOS", "IE",
     * "Microsoft Edge", "PhantomJS", "Safari", "SeaMonkey", "Silk",
     * "Opera Mini" and "Opera"
     *
     * Mobile versions of some browsers have "Mobile" appended to their name:
     * eg. "Chrome Mobile", "Firefox Mobile", "IE Mobile" and "Opera Mobile"
     *
     * @memberOf platform
     * @type string|null
     */
    platform.name = name;

    /**
     * The alpha/beta release indicator.
     *
     * @memberOf platform
     * @type string|null
     */
    platform.prerelease = prerelease;

    /**
     * The name of the product hosting the browser.
     *
     * The list of common products include:
     *
     * "BlackBerry", "Galaxy S4", "Lumia", "iPad", "iPod", "iPhone", "Kindle",
     * "Kindle Fire", "Nexus", "Nook", "PlayBook", "TouchPad" and "Transformer"
     *
     * @memberOf platform
     * @type string|null
     */
    platform.product = product;

    /**
     * The browser's user agent string.
     *
     * @memberOf platform
     * @type string|null
     */
    platform.ua = ua;

    /**
     * The browser/environment version.
     *
     * @memberOf platform
     * @type string|null
     */
    platform.version = name && version;

    /**
     * The name of the operating system.
     *
     * @memberOf platform
     * @type Object
     */
    platform.os = os || {

      /**
       * The CPU architecture the OS is built for.
       *
       * @memberOf platform.os
       * @type number|null
       */
      'architecture': null,

      /**
       * The family of the OS.
       *
       * Common values include:
       * "Windows", "Windows Server 2008 R2 / 7", "Windows Server 2008 / Vista",
       * "Windows XP", "OS X", "Ubuntu", "Debian", "Fedora", "Red Hat", "SuSE",
       * "Android", "iOS" and "Windows Phone"
       *
       * @memberOf platform.os
       * @type string|null
       */
      'family': null,

      /**
       * The version of the OS.
       *
       * @memberOf platform.os
       * @type string|null
       */
      'version': null,

      /**
       * Returns the OS string.
       *
       * @memberOf platform.os
       * @returns {string} The OS string.
       */
      'toString': function() { return 'null'; }
    };

    platform.parse = parse;
    platform.toString = toStringPlatform;

    if (platform.version) {
      description.unshift(version);
    }
    if (platform.name) {
      description.unshift(name);
    }
    if (os && name && !(os == String(os).split(' ')[0] && (os == name.split(' ')[0] || product))) {
      description.push(product ? '(' + os + ')' : 'on ' + os);
    }
    if (description.length) {
      platform.description = description.join(' ');
    }
    
    // Are pop-up windows allowed for this site? (i. e. has the user a pop-up blocker?)
    function popupsAllowed() {
        var allowed = false;
        if (!window.open) return;
        var w = window.open("about:blank","","directories=no,height=1,width=1,menubar=no,resizable=no,scrollbars=no,status=no,titlebar=no,left=0,top=0,location=no");
        if (w) {
            allowed = true;
            w.close();
        }
        return allowed;
    }
    function isTouch() {
      try{ document.createEvent("TouchEvent"); return true; }
      catch(e){ return ("ontouchstart" in window)?true:false; }
    }
    function isMobile() {
      if (typeof navigator == 'undefined') return false;
      if (typeof sessionStorage != 'undefined' && sessionStorage.desktop) // desktop storage 
          return false;
      else if (typeof localStorage != 'undefined' &&  localStorage.mobile) // mobile storage
          return true;
      var mobile = ['iphone','ipad','android','blackberry','nokia','opera mini','windows mobile','windows phone','iemobile']; 
      for (var i in mobile) if (navigator.userAgent.toLowerCase().indexOf(mobile[i].toLowerCase()) > 0) return true;
      return false;
    }
    global.jsVersion=1.0;
    // Helper function to detect Javascript version
    function _detectJsVersion() {
        if (!document.write) return;

        document.write('<script language="JavaScript1.0">');
        document.write('jsVersion=1.0;');
        document.write('</script>');

        document.write('<script language="JavaScript1.1">');
        document.write('jsVersion=1.1;');
        document.write('</script>');

        document.write('<script language="JavaScript1.2">');
        document.write('jsVersion=1.2;');
        document.write('</script>');

        document.write('<script language="JavaScript1.3">');
        document.write('jsVersion=1.3;');
        document.write('</script>');

        document.write('<script language="JavaScript1.4">');
        document.write('jsVersion=1.4;');
        document.write('</script>');

        document.write('<script language="JavaScript1.5">');
        document.write('jsVersion=1.5;');
        document.write('</script>');

        document.write('<script language="JavaScript1.6">');
        document.write('jsVersion=1.6;');
        document.write('</script>');

        document.write('<script language="JavaScript1.7">');
        document.write('jsVersion=1.7;');
        document.write('</script>');

        document.write('<script language="JavaScript1.8">');
        document.write('jsVersion=1.8;');
        document.write('</script>');

        document.write('<script language="JavaScript2.0">');
        document.write('jsVersion=2.0;');
        document.write('</script>');

    }

    // What is the newest version of Javascript does the browser report as supported?
    function detectJsVersion() {
       _detectJsVersion(); 
    }
    detectJsVersion();
    platform.jsVersion=function () { return jsVersion };
    // platform.popups=popupsAllowed();
    
    if (typeof navigator != 'undefined')
      platform.hasWebRTC = (navigator.getUserMedia ||
                            navigator.webkitGetUserMedia ||
                            navigator.mozGetUserMedia ||
                            navigator.msGetUserMedia)?1:undefined;
    platform.touch = isTouch();
    platform.mobile = isMobile();

    platform.geoloc = (typeof navigator != 'undefined' && 
                       navigator.geolocation && 
                       typeof navigator.geolocation.getCurrentPosition == 'function')?true:false;

    return platform;
  }

  /*--------------------------------------------------------------------------*/

  // Export platform.
  var platform = parse();
} else {
  var platform = {}
}

module.exports=platform;
};
BundleModuleCode['jam/analyzer']=function (module,exports,global,process){
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
 **    $CREATED:     4-5-16 by sbosse.
 **    $RCS:         $Id: analyzer.js,v 1.4 2017/06/19 17:18:39 sbosse Exp sbosse $
 **    $VERSION:     1.6.13
 **
 **    $INFO:
 **
 **  JAM AgentJS Analyzer. A branch tree monster! 
 **  Uses esprima parser AST structure.
 **
 ** TODO: Many checks are missing or are incomplete!
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var Aios = none;
var current = none;
var util = Require('util');

var options = {
  version:'1.6.13',
}
var out = function (msg) { Io.out('[AJS] '+msg)};

/** All functions with 'this' property pass the agent 'this' object to their bodies or callback functions!
 *  The 'this' property array contains the argument index indicating functions or arrays of functions inheriting the
 *  agent 'this' object.
 */
var corefuncs = {
  act:    {obj:{add:{argn:2},delete:{argn:1},update:{argn:2}}},  // TODO obj handling!
  add:    {argn:2},
  alt :   {argn:[2,3], obj:{try:{argn:[2,3,4]}}},
  collect:    {argn:2},
  concat: {argn:2},
  connectTo: {argn:1},
  copyto:    {argn:2},
  empty:  {argn:1},
  equal:  {argn:2},
  Export:  {argn:2},
  exists: {argn:1},
  filter: {argn:2, this:[1]},
  head:   {argn:1},
  iter:   {argn:2, this:[1]},
  Import:  {argn:1},
  inp:    {argn:[2,3], this:[1], obj:{try:{argn:[2,3,4]}}},
  kill:   {argn:[0,1]},
  length: {argn:1},
  log:    {argn:[1,2,3,4,5,6,7,8,9,10]},
  mark:   {argn:2},
  map:    {argn:2, this:[1]},
  matrix: {argn:[2,3]},
  max:    {argn:[1,2]},
  me:     {argn:0},
  min:    {argn:[1,2]},
  myClass: {argn:0},
  myNode: {argn:0},
  myParent: {argn:0},
  myPosition: {argn:0},
  Number: {argn:1},
  object:    {argn:1},
  out:    {argn:1},
  opposite:    {argn:1},
  privilege: {argn:0},
  random: {argn:[1,2,3]},
  reduce:  {argn:2, this:[1]},
  reverse: {argn:1,this:[1]},
  rd:     {argn:[2,3], this:[1], obj:{try:{argn:[2,3,4]}}},
  rm:     {argn:[1,2]},
  send:   {argn:[2,3]},
  sendto:   {argn:[2,3]},
  sort:   {argn:2, this:[1]},
  sleep:  {argn:[0,1]},
  store:    {argn:2},
  string: {argn:1},
  sum:    {argn:[1,2]},
  tail:   {argn:1},
  time:   {argn:0}, 
  timer:    {obj:{add:{argn:[2,3]},delete:{argn:1},update:{argn:2}}},  // TODO obj handling!
  try_alt:     {argn:[2,3,4], this:[2]},
  try_inp:     {argn:[2,3,4], this:[2]},
  try_rd:     {argn:[2,3,4], this:[2]},
  zero:   {argn:1},
  B:      {argn:[1,2], this:[0,1]},
  I:      {argn:[3,4], this:[1,2,3]},
  L:      {argn:[4,5], this:[1,2,3,4]},
  Vector: {argn:[1,2,3]}
};

function check_args (arguments,corefun) {
  var len=arguments?arguments.length:0,passed=false;
  if (Comp.obj.isArray(corefun.argn)) Comp.array.iter(corefun.argn,function (n) {
    if (n==len) passed=true;
  });
  else passed=(len==corefun.argn);
  return passed;
}


var jamc = function (options) {
  // Dummy constructor
};

var properties = {
  indexOf:'string.indexOf',
  push:'array.push',
  shift:'array.shift'
}

var literals={
  none:'Literal',
  undefined:'Literal'
}
literals['_']='Literal';

var syntax = {
  find: function (root,typ,name) {
    if (root.type==typ && root.id && root.id.type == 'Identifier' && root.id.name==name) return root;
    switch (root.type) {
        case 'Program': 
          return Comp.array.findmap(root.body,function (el) { return syntax.find(el,typ,name)}); 
          break;
        case 'VariableDeclaration':
          return Comp.array.findmap(root.declarations,function (el) { return syntax.find(el,typ,name)});         
          break;
    }
    return null;
  },
  location: function (elem,short) {
    var str='';
    if (elem.loc) {
      if (elem.loc.start) str='line '+(elem.loc.start.line+syntax.offset)+', position '+elem.loc.start.column;
      if (elem.loc.end) str +=' to line '+(elem.loc.end.line+syntax.offset)+', position '+elem.loc.end.column;
      return str;
    } else return "unknown location";
  },
  name: function (elem) {
    switch (elem.type) {
      case 'ThisExpression': return 'this';
      case 'Identifier': return elem.name;
      case 'MemberExpression':
        return syntax.name(elem.object)+'.'+syntax.name(elem.property);
      default: return elem.toString();
    }
  },
  offset:0
}

jamc.prototype.syntax = syntax;


/** The Big Machine: Analyze and check an agent class constructor function.
 * 
 * Checks performed:
 *  - references (top-level this, local this, local variables, no free variable access)
 *  - AIOS function calls, privilege level sensitive
 *  - basic structure (act, trans, on? , next)
 *
 */
 
/*
 * options and evaluation order:
 * 
 *  {left:true,this:true, syms: *[]}
 *  {right:true, this:true, target:elem, syms: *[]}
 *  {funbody:true, this:true, syms: *[]}
 *  {funbody:true, syms: *[]}
 *  {this:true}
 *  {reference:true, syms: *[]}
 *  {funcall:true, external:true, arguments:elem [], syms: *[]}
 *  {trans:true}
 *
 *
 *
 * type Esprima.syntax=object|*;
 * type jamc.prototype.analyze = function(syntax:Esprima.syntax,options:{classname:string,level:number}) ->
 * {
 *   activities:object,
 *   transitions:object,
 *   subclasses:object,
 *   symbols:object,
 *   errors: string []
 * }
 */
 
jamc.prototype.analyze = function (syntax,_options) {
  var self=this,
      classname=_options.classname,
      level=_options.level,
      ep,elem,cp,declarator,ac,val,
      // Pre-defined top-level this.XX symbols
      syms={id:{type:'Literal'},ac:{type:'Literal'}},
      nextVal,
      transObj,
      actObj,
      subclassObj,
      transitions={},
      activities={},
      subclasses,
      aios,
      options={},
      errors=[],
      verbose=_options.verbose||0,
      err=function (msg) { errors.push(msg); (_options.err||this.err||Io.err)(msg)},
      out=_options.out||this.out||Io.out,
      warn=_options.warn||this.warn||Io.warn;
      
  switch (level) {
    case 0: aios=Aios.aios0; break;
    case 1: aios=Aios.aios1; break;
    case 2: aios=Aios.aios2; break;
    case 3: aios=Aios.aios3; break;
  }
  
  function unwrap(elem) {
    switch (elem.type) {
      case 'BlockStatement':
        if (elem.body.length==1) return elem.body[0];
        else return elem;
        break;
      default:
        return elem;
    }
  }
  
  function isThisExpr(elem) {
    switch (elem.type) {
      case 'MemberExpression':
        return isThisExpr(elem.object);
      case 'ThisExpression':
        return true;
    }
    return false;
  }
  
  function isEmpty(o) {
    if (!o) return true;
    for (var p in o) { if (o[p]!=undefined) return false;};
    return true;
  }
  
  /**************************
  ** Iterate Member Expression
  **************************/
  
  function iterMemberExpression (elem,options) {
    var part,corefun,obj;

    switch (elem.type) {
      case 'Identifier':
        if (!aios[elem.name] && !corefuncs[elem.name])
          err('['+classname+'] Call of undefined function: '+
              elem.name+', in level '+level+' ,at '+self.syntax.location(elem));            
        else if (corefuncs[elem.name]) {
          corefun=corefuncs[elem.name];
          if (!check_args(options.arguments,corefun))
            err('['+classname+']: Call of AIOS function '+elem.name+' with invalid number of arguments, '+
                '(expecting '+corefun.argn+' argument(s), got '+options.arguments.length+
                '), in level '+level+
                ' ,at '+self.syntax.location(elem));            
          return aios[elem.name];
        } else return aios[elem.name];    
        break;

      case 'MemberExpression':
        switch (elem.object.type) {
          case 'ThisExpression':
            if (!syms[elem.property.name] || syms[elem.property.name].context!='ThisExpression') 
                err("['+classname+'] Undefined 'this' reference: "+
                    elem.property.name+', at '+self.syntax.location(elem));
            if(syms[elem.property.name].type=='ObjectExpression') {
              var Osyms={};
              Comp.array.iter(syms[elem.property.name].properties,function (p) {
                Osyms[p.key.name]=p.type;
              });
              if (!isEmpty(Osyms))               
                return Osyms;
              else
                return none;
            } else return none;
            break;

          case 'Identifier':
            if (!aios[elem.object.name] && 
                !corefuncs[elem.object.name] &&
                !options.syms[elem.object.name]) {
              // console.log(elem);
              err('['+classname+'] Access of undefined object variable: '+
                  elem.object.name+', in level '+level+' ,at '+self.syntax.location(elem));
            } 

            if (properties[elem.property.name]) return undefined;
            if (elem.computed) return undefined; // TODO, check property!
            
            if (corefuncs[elem.object.name]) {
              obj=corefuncs[elem.object.name].obj||corefuncs[elem.object.name];
              if (!obj[elem.property.name]) {
                // console.log(corefuncs[elem.object.name])
                err('['+classname+'] Access of unknown AIOS(corefuncs) object attribute: '+
                    elem.object.name+'.'+elem.property.name+', in level '+level+' ,at '+self.syntax.location(elem));
              }
              return obj[elem.property.name];
            } else if (aios[elem.object.name]) {
              // console.log(elem);
              obj=aios[elem.object.name].obj||aios[elem.object.name];
              if (!obj[elem.property.name])
                err('['+classname+'] Access of unknown AIOS object attribute: '+
                    elem.object.name+'.'+elem.property.name+', in level '+level+' ,at '+self.syntax.location(elem));
              return obj[elem.property.name];
            } 
            else if (options.syms[elem.object.name]) {
              // console.log(elem);
              // User defined object, can't be resolved further
              return none;
            }                                   
            return;
            break;

          case 'MemberExpression': 
            part=iterMemberExpression(elem.object,options);
            if (part && part.obj) part=part.obj;
            if (!elem.computed && part && !part[elem.property.name] && !properties[elem.property.name]) {
              err('['+classname+'] Access of unknown object attribute: '+
                  self.syntax.name(elem)+' ('+elem.property.name+'), in level '+
                  level+' ,at '+self.syntax.location(elem));
            }
            if (elem.computed) check(elem.property,{reference:true,syms:options.syms});
            if (part && (typeof part[elem.property.name] == 'object') && !isEmpty(part[elem.property.name])) 
              return part[elem.property.name];
            else 
              return none;
            break;
        }
        break;
    } 
    return;
  }
  
  
  /**********************************
  ** Check for a declaration and add it to the symbol table
  **********************************/
  function addDeclaration(elem,options) {
    var ep,el;
    switch (elem.type) {
      case 'VariableDeclaration':
        for (ep in elem.declarations) {
          el=elem.declarations[ep];           
          if (!options.shadow[el.id.name]) options.shadow[el.id.name]=options.syms[el.id.name];
          if (el.type=='VariableDeclarator') {
            if (el.id.type=='Identifier') {
              options.syms[el.id.name]=el;
            }
          }
        }
        break;
      case 'FunctionDeclaration':
        if (!options.shadow[elem.id.name]) options.shadow[elem.id.name]=options.syms[elem.id.name];
        options.syms[elem.id.name]=elem;
        break;

      case 'ForStatement':
        addDeclaration(elem.init,options);
        break;

    }
  }
  
  /*********************************
  ** Main checker function
  *********************************/
  
  function check(elem,options) {
    var ep,el,name,thismaybe,shadow,locshadow;
/*    
console.log(elem);
console.log(options);    
*/
    /*
    ** Top-level statements 
    */
    if (options.left && options.this) {
      // LHS check of agent class top-level statements
      switch (elem.type) {
      
        case 'Identifier':
          err('['+classname+'] Assignment may not contain free variables: var '+
              elem.name+', at '+self.syntax.location(elem));
          break;
          
        case 'MemberExpression':
          if (elem.object.type != 'ThisExpression')
            err('['+classname+'] Assignment may not contain non-this MemberExpression on left side: '+
                self.syntax.name(elem.object)+', at '+self.syntax.location(elem));
          switch (elem.property.type) {
          
            case 'Identifier':
              if (syms[elem.property.name])
                err('['+classname+'] Found duplicate property definition: '+
                    elem.property.name+' ('+syms[elem.property.name].type+'), at '+self.syntax.location(elem));
              else {
                syms[elem.property.name]=options.target;
                syms[elem.property.name].context=elem.object.type;
              }
              switch (elem.property.name) {
                case 'act':     actObj = options.target; break;
                case 'trans':   transObj = options.target; break;
                case 'subclass':   subclassObj = options.target; break;
              }
              break;
          }
          break;
      }
    }
    else if (options.right && options.this) {
      // RHS check of agent class top-level statements
      switch (elem.type) {
        case 'Literal':
        case 'Identifier':
          switch (options.target.property.name) {
            case 'next':
              val = elem.value||elem.name;
              if (!Comp.obj.isString(val)) 
                  err('['+classname+'] Invalid next property, expected string, got '+
                      val+', at '+self.syntax.location(elem));
              nextVal = val;
              break;
          }
          break;
          
        case 'ObjectExpression':
          switch (options.target.property.name) {        
            case 'trans':
              for (ep in elem.properties) {
                el=elem.properties[ep];
                //console.log(el)
                if (el.type=='Property') {
                  transitions[el.key.name]=el.value;
                }
              }
              break;

            case 'act':
              for (ep in elem.properties) {
                el=elem.properties[ep];
                // console.log(el)
                if (el.type=='Property') {
                  if (aios[el.key.name])
                    err('['+classname+'] Activity name '+el.key.name+
                        ' shadows AIOS function or object, at '+self.syntax.location(elem));
                  
                  
                  activities[el.key.name]=el.value;
                }
              }
              break;

            case 'subclass':
              subclasses={};
              for (ep in elem.properties) {
                el=elem.properties[ep];
                // console.log(el)
                if (el.type=='Property') {
                  subclasses[el.key.name]=el.value;
                }
              }
              break;
          }
          break; 
          
        case 'FunctionExpression':
          // Check and add function parameters
          locshadow={};
          for (ep in elem.params) {
            param=elem.params[ep];
            if (param.type!='Identifier')
              err('['+classname+'] Invalid function parameter type'+param.type+', expected Identifier'+
                  ', at '+self.syntax.location(elem));
            locshadow[param.name]=options.syms[param.name];
            options.syms[param.name]=param.type;
          }
          check(elem.body,{funbody:true,this:true,syms:options.syms});
          // Restore symbol table
          for (ep in locshadow) {
            options.syms[ep]=locshadow[ep];
          }
          break;     
      }
    }
    
    /*
    ** Function body statements that can access the agent object by 'this' 
    */
    else if (options.funbody && options.this) {
      // Activity or transition top- or second level function bodies - 'this' references always the agent object!
      elem=unwrap(elem);
      
      switch (elem.type) {
        case 'BlockStatement':
          // Local symbols 
          if (options.shadow) shadow=options.shadow;
          options.shadow={};
          // First get all function and variable definitions in current scope
          if (!options.syms) options.syms={};
          Comp.array.iter(elem.body,function (el) {
            addDeclaration(el,options);
          });
          // Now check the body statements
          Comp.array.iter(elem.body,function (el) {check(el,options)});
          if (options.syms) for (ep in options.shadow) {
            options.syms[ep]=options.shadow[ep];
          }
          options.shadow=shadow;    
          break;
          
        case 'ExpressionStatement':
          switch (elem.expression.type) {
          
            case 'AssignmentExpression':
              switch (elem.expression.left.type) {
                case 'MemberExpression':  
                  if (isThisExpr(elem.expression.left.object))
                    check(elem.expression.left,{this:true});
                  break;
                case 'Identifier':
                  check(elem.expression.left,{reference:true,syms:options.syms});
                  break;
              }
              check(elem.expression.right,{reference:true,syms:options.syms});              
              break;
              
            case 'CallExpression':
              thismaybe=[]; // for 'this' propagation to arguments
              if (elem.expression.callee.object && isThisExpr(elem.expression.callee.object)) {
                check(elem.expression.callee,{this:true,funcall:true,arguments:elem.expression.arguments});
              } else {
                if (corefuncs[elem.expression.callee.name] && corefuncs[elem.expression.callee.name].this)
                {
                    thismaybe=corefuncs[elem.expression.callee.name].this;           
                }
                if (options.syms[elem.expression.callee.name]) {
                  if (options.syms[elem.expression.callee.name].type != 'FunctionDeclaration')
                    err('['+classname+'] Not a function:'+elem.expression.callee.name+
                        ', at '+self.syntax.location(elem));
// TODO                  
                } else
                  /* AIOS function call */
                  check(elem.expression.callee,{funcall:true,external:true,syms:options.syms,
                                                arguments:elem.expression.arguments});
              }
              // Check arguments
              Comp.array.iter(elem.expression.arguments,function (el,i) {
                var ep,param,shadow;
                if (!Comp.array.member(thismaybe,i)) {
                  check(el,{reference:true,syms:options.syms});                
                } else {
                  // It's a AIOS function call with a function argument. 
                  // Check function body with 'this' referencing the agent object.
                  
                  switch (el.type) {
                    case 'ArrayExpression':
                      // Block of functions ...
                      Comp.array.iter(el.elements,function (el_block,block_i) {
                        if (el_block.type != 'FunctionExpression')
                          err('['+classname+'] Invalid argument '+(i+1)+' of AIOS core function '+
                              elem.expression.callee.name+': Expeceted FunctionExpression array, but got '+
                              el_block.type+ ' element (array index '+(block_i+1)+')'+
                              ', at '+self.syntax.location(elem));
                        check(el_block.body,{funbody:true,this:true,syms:options.syms});                          
                      });
                      break;
                      
                    case 'FunctionExpression':
                      // Check and add function parameters
                      shadow={};
                      for (ep in el.params) {
                        param=el.params[ep];
                        if (param.type!='Identifier')
                          err('['+classname+'] Invalid function parameter type'+param.type+', expected Identifier'+
                              ', at '+self.syntax.location(elem));
                        if (options.syms[param.name]) shadow[param.name]=options.syms[param.name];
                        options.syms[param.name]=param.type;
                      }
                      check(el.body,{funbody:true,this:true,syms:options.syms});
                      // Restore symbol table
                      for (ep in shadow) {
                        options.syms[ep]=shadow[ep];
                      }
                      break;
                      
                    case 'CallExpression':
                      // TODO, check arguments ..
                      break;
                      
                    case 'Identifier':
                      // Nothing to do?
                      break;
                      
                    default:
                      err('['+classname+'] Invalid argument '+(i+1)+' of AIOS core function '+
                          elem.expression.callee.name+': Expeceted FunctionExpression, ArrayExpression, or Identifier, but got '+
                          el.type+
                          ', at '+self.syntax.location(elem));
                  }
                }  
              });
              break;
              
            case 'UpdateExpression':
              check(elem.expression.argument,{reference:true,syms:options.syms});
              break;
          }
          break;
          
        case 'VariableDeclaration':
          // console.log(elem.declarations);
          if (!options.shadow) options.shadow={};
          for (ep in elem.declarations) {
            el=elem.declarations[ep];           
            if (!options.shadow[el.id.name]) options.shadow[el.id.name]=options.syms[el.id.name];
            if (el.type=='VariableDeclarator') {
              if (el.id.type=='Identifier') {
                options.syms[el.id.name]=el;
              }
            }
          }
          break;
          
        case 'IfStatement':
          check(elem.consequent,options);
          if (elem.alternate) check(elem.alternate,options);
          check(elem.test,{reference:true,syms:options.syms});
          break;
          
        case 'ForStatement':
          //console.log(elem)
          check(elem.body,options);
          check(elem.init,{reference:true,syms:options.syms});
          check(elem.test,{reference:true,syms:options.syms});
          check(elem.update,{reference:true,syms:options.syms});
          break;
          
        case 'WhileStatement':
          //console.log(elem)
          check(elem.body,options);
          check(elem.test,{reference:true,syms:options.syms});
          break;

        case 'ReturnStatement':
          if (elem.argument)
            check(elem.argument,{reference:true,syms:options.syms});
          break;
          
        case 'FunctionDeclaration':
          if (!options.shadow[elem.id.name]) options.shadow[elem.id.name]=options.syms[elem.id.name];
          options.syms[elem.id.name]=elem;
          /* agent object not accessible in function body! */
          // Check and add function parameters
          locshadow={};
          for (ep in elem.params) {
            param=elem.params[ep];
            if (param.type!='Identifier')
              err('['+classname+'] Invalid function parameter type'+param.type+', expected Identifier'+
                  ', at '+self.syntax.location(elem));
            locshadow[param.name]=options.syms[param.name];
            options.syms[param.name]=param.type;
          }
          check(elem.body,{funbody:true,syms:options.syms});
          // Restore symbol table
          for (ep in locshadow) {
            options.syms[ep]=locshadow[ep];
          }
          
          break;
      }
    }
    /*
    ** Funcion body that cannot access the agent object (local functions) 
    */
    else if (options.funbody) {
// TODO    
      elem=unwrap(elem);
      
      switch (elem.type) {
        case 'BlockStatement':
          // Local symbols 
          if (options.shadow) shadow=options.shadow;
          options.shadow={};
          // First get all function and variable definitions in current scope
          if (!options.syms) options.syms={};
          Comp.array.iter(elem.body,function (el) {
            addDeclaration(el,options);
          });
          Comp.array.iter(elem.body,function (el) {check(el,options)});
          if (options.syms) for (ep in options.shadow) {
            options.syms[ep]=options.shadow[ep];
          }
          options.shadow=shadow;    
          break;

        case 'ExpressionStatement':
          switch (elem.expression.type) {
          
            case 'AssignmentExpression':
              switch (elem.expression.left.type) {
                case 'MemberExpression':  
                  if (elem.expression.left.object && isThisExpr(elem.expression.left.object))
                    check(elem.expression.left,{syms:options.syms});
                  break;
                case 'Identifier':
                  check(elem.expression.left,{reference:true,syms:options.syms});
                  break;
              }
              check(elem.expression.right,{reference:true,syms:options.syms});              
              break;
              
            case 'CallExpression':
              thismaybe=[]; // for 'this' propagation to arguments
              if (elem.expression.callee.object && isThisExpr(elem.expression.callee.object)) {
                check(elem.expression.callee,{this:true,funcall:true,arguments:elem.expression.arguments});
              } else {
                if (corefuncs[elem.expression.callee.name] && corefuncs[elem.expression.callee.name].this)
                {
                    thismaybe=corefuncs[elem.expression.callee.name].this;           
                }
                if (options.syms[elem.expression.callee.name]) {
                  if (options.syms[elem.expression.callee.name].type != 'FunctionDeclaration')
                    err('['+classname+'] Not a function:'+elem.expression.callee.name+
                        ', at '+self.syntax.location(elem));
// TODO                  
                } else
                  /* AIOS function call */
                  check(elem.expression.callee,{funcall:true,external:true,syms:options.syms,
                                                arguments:elem.expression.arguments});
              }
              // Check arguments
              Comp.array.iter(elem.expression.arguments,function (el,i) {
                var ep,param,shadow;
                if (!Comp.array.member(thismaybe,i)) {
                  check(el,{reference:true,syms:options.syms});                
                } else {
                  // It's a AIOS function call with a function argument. 
                  // Check function body with 'this' referencing the agent object.
                  
                  switch (el.type) {
                    case 'ArrayExpression':
                      // Block of functions ...
                      Comp.array.iter(el.elements,function (el_block,block_i) {
                        if (el_block.type != 'FunctionExpression')
                          err('['+classname+'] Invalid argument '+(i+1)+' of AIOS core function '+
                              elem.expression.callee.name+': Expeceted FunctionExpression array, but got '+
                              el_block.type+ ' element (array index '+(block_i+1)+')'+
                              ', at '+self.syntax.location(elem));
                        check(el_block.body,{funbody:true,this:true,syms:options.syms});                          
                      });
                      break;
                      
                    case 'FunctionExpression':
                      // Check and add function parameters
                      shadow={};
                      for (ep in el.params) {
                        param=el.params[ep];
                        if (param.type!='Identifier')
                          err('['+classname+'] Invalid function parameter type'+param.type+', expected Identifier'+
                              ', at '+self.syntax.location(elem));
                        if (options.syms[param.name]) shadow[param.name]=options.syms[param.name];
                        options.syms[param.name]=param.type;
                      }
                      check(el.body,{funbody:true,this:true,syms:options.syms});
                      // Restore symbol table
                      for (ep in shadow) {
                        options.syms[ep]=shadow[ep];
                      }
                      break;

                    case 'CallExpression':
                      // TODO, check arguments ..
                      break;
                      
                    case 'Identifier':
                      // Nothing to do?
                      break;
                      
                     default:
                      err('['+classname+'] Invalid argument '+(i+1)+' of AIOS core function '+
                          elem.expression.callee.name+': Expeceted FunctionExpression, ArrayExpression, or Identifier, but got '+
                          el.type+
                          ', at '+self.syntax.location(elem));
                  }
                }  
              });
              break;
              
            case 'UpdateExpression':
              check(elem.expression.argument,{reference:true,syms:options.syms});
              break;
          }
          break;
          
        case 'VariableDeclaration':
          for (ep in elem.declarations) {
            el=elem.declarations[ep];
            if (!options.shadow[el.id.name]) options.shadow[el.id.name]=options.syms[el.id.name];
            if (el.type=='VariableDeclarator') {
              if (el.id.type=='Identifier') {
                options.syms[el.id.name]=el;
              }
            }
          }
          break;
          
        case 'IfStatement':
          check(elem.consequent,options);
          if (elem.alternate) check(elem.alternate,options);
          check(elem.test,{reference:true,syms:options.syms});
          break;
          
        case 'ForStatement':
          //console.log(elem)
          check(elem.body,options);
          check(elem.init,{reference:true,syms:options.syms});
          check(elem.test,{reference:true,syms:options.syms});
          check(elem.update,{reference:true,syms:options.syms});
          break;
          
        case 'WhileStatement':
          //console.log(elem)
          check(elem.body,options);
          check(elem.test,{reference:true,syms:options.syms});
          break;

        case 'ReturnStatement':
          if (elem.argument)
            check(elem.argument,{reference:true,syms:options.syms});
          break;

        case 'FunctionDeclaration':
          if (!options.shadow[elem.id.name]) options.shadow[elem.id.name]=options.syms[elem.id.name];
          options.syms[elem.id.name]=elem;
          /* agent object not accessible in function body! */
          // Check and add function parameters
          locshadow={};
          for (ep in elem.params) {
            param=elem.params[ep];
            if (param.type!='Identifier')
              err('['+classname+'] Invalid function parameter type '+param.type+', expected Identifier'+
                  ', at '+self.syntax.location(elem));
            locshadow[param.name]=options.syms[param.name];
            options.syms[param.name]=param.type;
          }
          check(elem.body,{funbody:true,syms:options.syms});
          // Restore symbol table
          for (ep in locshadow) {
            options.syms[ep]=locshadow[ep];
          }
          
          break;
      }      
    } 
    /*
    ** Check agent object 'this' reference
    */
    else if (options.this) {
      // Check symbol reference for ThisExpression only
      switch (elem.object.type) {
        case 'MemberExpression':
          check(elem.object,{this:true});
          break;
        case 'ThisExpression':
          if (!syms[elem.property.name]) 
            err('['+classname+"] Undefined 'this' reference: "+
                elem.property.name+', at '+self.syntax.location(elem));
          if(options.funcall && syms[elem.property.name].type != 'FunctionExpression')
            err('['+classname+"] Not a function: this."+
                elem.property.name+', at '+self.syntax.location(elem));
      }
    }
    /*
    ** Check generic references
    */
    else if (options.reference) {
      // Check symbol reference for local symbols only
      switch (elem.type) {
        case 'Identifier':
          if (!options.syms[elem.name] && !literals[elem.name] && !aios[elem.name] && !activities[elem.name]) 
            err('['+classname+'] Undefined variable reference: '+
                elem.name+', at '+self.syntax.location(elem));
          break;
          
        case 'BinaryExpression':
          check(elem.left,options);
          check(elem.right,options);
          break;

        case 'AssignmentExpression':
          switch (elem.left.type) {
            case 'MemberExpression':
              if (elem.left.object && isThisExpr(elem.left.object))
                check(elem.left,{this:true});
              break;
            case 'Identifier':
              check(elem.left,{reference:true,syms:options.syms});
              break;
          }
          check(elem.right,options);
          break;

        case 'UpdateExpression':
          check(elem.argument,options);
          break;
          
        case 'MemberExpression':
          switch (elem.object.type) {
            case 'ThisExpression':
              check(elem,{this:true,syms:options.syms});
              break;
            case 'Identifier':
              check(elem.object,{reference:true,syms:options.syms});
              if (elem.computed) switch (elem.property.type) {
                case 'Identifier':
                  check(elem.property,{reference:true,syms:options.syms});
                  break;            
              }
              break;
            case 'MemberExpression':
              iterMemberExpression(elem,options);

              //if (isThisExpr(elem.object))
              //    check(elem.object,{this:true,syms:options.syms});                
          }
          break;

        case 'ArrayExpression':
          Comp.array.iter(elem.elements, function (el2,i) {
            if (el2) check(el2,{reference:true,syms:options.syms});          
          });
          break;
          
        case 'CallExpression':         
          if (elem.callee.object && isThisExpr(elem.callee.object)) {
            check(elem.callee,{this:true,funobj:true,arguments:elem.arguments});
          } else {
            if (options.syms[elem.callee.name]) {
              if (options.syms[elem.callee.name].type != 'FunctionDeclaration')
                err('['+classname+'] Not a function:'+elem.callee.name+
                    ', at '+self.syntax.location(elem));
              /* Internal function call, nothing to do */
            } else 
              check(elem.callee,{funcall:true,external:true,syms:options.syms,
                                 arguments:elem.arguments});
          }
          Comp.array.iter(elem.arguments,function (el) {
            check(el,{reference:true,syms:options.syms,arguments:elem.arguments})
          });          
          break;
      }
    }
    /*
    ** AIOS function calls and objects
    */
    else if (options.funcall && options.external) {
      // Check external AIOS function references
      switch (elem.type) {
        case 'Identifier':
        case 'MemberExpression':
          iterMemberExpression(elem,options);
          break;
      }      
    } 
    /*
    ** Check transition function body statements
    */
    else if (options.trans) {
      switch (elem.type) {
        case 'BlockStatement': 
          Comp.array.iter(elem.body,function (el) {check(el,options)});
          break;     
               
        case 'IfStatement':
          check(elem.consequent,options);
          if (elem.alternate) check(elem.alternate,options);
          break;
          
        case 'ReturnStatement':
          options.ret++;
          if (elem.argument) 
            check(elem.argument,options);
          else
            if (verbose) warn('['+classname+'] Returns undefined in transition '+
                              options.trans+', at '+self.syntax.location(elem)+'.');
          break;
          
        case 'Literal':
          if (!activities[elem.value])
            err('['+classname+'] Returns unknown activity reference '+
                elem.value+' in transition '+options.trans+', at '+self.syntax.location(elem)+'.');
          break;
          
        case 'Identifier':
          if (!activities[elem.name])
            err('['+classname+'] Returns unknown activity reference '+
                elem.name+' in transition '+options.trans+', at '+self.syntax.location(elem)+'.');
          break;
      }      
    }
    
  } /* End of check */
  
  /************************
  ** Analyzer
  ************************/
  
  if (verbose) out('Analyzing agent class "'+classname+'" ..');
  if (syntax.type!='Program') 
    err('Syntax is not a program: '+syntax.type);
    
  // Phase 1 
  loop1: for (ep in syntax.body) {
    var elem=syntax.body[ep];
    if (elem.type!='VariableDeclaration') 
      err('Body element is not a variable declaration: '+elem.type);
    for(cp in elem.declarations) {
      var declarator=elem.declarations[cp];
      if (declarator.type!='VariableDeclarator') {
        err('VariableDeclaration element is not a variable declarator: '+declarator.type);
      }
      if (declarator.id.name!='ac') 
        err('['+classname+'] Entry not found, expected ac, got: '+declarator.id.name);
      else { ac=declarator; break loop1;};
    }
  }
  if (!ac)
    err('No agent class template found.');
  if (!ac.init || ac.init.type != 'FunctionExpression')
    err('['+classname+'] Entry is invalid, expected function, got: '+ac.init.type);
  if (ac.init.type != 'FunctionExpression')
    err('['+classname+'] Entry is invalid, expected function, got: '+ac.init.type);

  if (ac.init.body.type != 'BlockStatement')
    err('['+classname+'] Entry is invalid, expected function body, got: '+ac.init.body.type);
    
  // Phase 2 Agent Class Pre-check / Top-level / Top symbol table creation
  loop2: for (ep in ac.init.body.body) {
    var elem=ac.init.body.body[ep];

    switch (elem.type) {
      case 'VariableDeclaration':
        err('['+classname+'] May not contain free variable declarations: '+
            Comp.printf.list(Comp.array.map(elem.declarations,function (decl) {
                  if (decl.type!='VariableDeclarator') return '?'; 
                    else return 'var '+self.syntax.name(decl.id)
                }))+', at '+self.syntax.location(elem));
        break;
      case 'ExpressionStatement': 
        switch (elem.expression.type) {
          case 'AssignmentExpression':
            check(elem.expression.left,{left:true,this:true,target:elem.expression.right});
            check(elem.expression.right,{right:true,this:true,target:elem.expression.left,syms:syms});
            break;
          case 'MemberExpression':          
            if (elem.expression.object && elem.expression.object.type=='ThisExpression')
              check(elem.expression,{left:true,this:true,target:{type:'undefined'}});
            break;
        }
        break;
      default:
        err('['+classname+'] Invalid top-level '+elem.type+
            ', at '+self.syntax.location(elem));
        break;
    }
  }
  
  if (!syms['act'] || syms['act'].type != 'ObjectExpression') 
    err('['+classname+'] Found no or no valid activity section, expecting this.act={..}.');
  if (!syms['trans'] || syms['trans'].type != 'ObjectExpression') 
    err('['+classname+'] Found no or no valid transition section, expecting this.trans={..}.');
  if (syms['on'] && syms['on'].type != 'ObjectExpression') 
    err('['+classname+'] Found invalid handler section, expecting this.on={..}.');
  if (!syms['on'] && verbose) 
    warn('['+classname+'] Found no handler section, expecting this.on={..}.');
  if (!nextVal) 
    err('['+classname+'] Found no next attribute, expecting  this.next="<nextact>".');
  if (!activities[nextVal])
    err('['+classname+'] Found invalid next attribute pointing to undefined activity '+nextVal+'.');
  
  // Phase 3 Function, Activity, and Transition properties check
  loop3A: for (ep in activities) {
    var elem=activities[ep];
    if (!transitions[ep] && verbose) warn('['+classname+'] No transition entry found for activity '+ep);
    switch (elem.type) {
      case 'FunctionExpression':
        options={funbody:true,this:true,syms:{}};
        check(elem.body,options); 
        elem.syms=syms;
        break;
      default:
        err('['+classname+'] Found invalid activity entry, expecting FunctionExpression, got'+
            elem.type+', at '+self.syntax.location(elem));
        
    }  
  }
  loop3B: for (ep in transitions) {
    var elem=transitions[ep],opt;
    if (!activities[ep])
        err('['+classname+'] Transition entry found referencing unknown activity: '+
            ep+', at '+self.syntax.location(elem));
    switch (elem.type) {
      case 'Identifier': 
        if (!activities[elem.name])
          err('['+classname+'] Unknown transition found: '+
            elem.name+', at '+self.syntax.location(elem));
        
        break;
      case 'Literal': 
        if (!activities[elem.value])
          err('['+classname+'] Unknown transition found: '+
            elem.value+', at '+self.syntax.location(elem));
        
        break;
      case 'FunctionExpression': 
        opt={trans:ep,ret:0};
        check(elem.body,opt);
        if (opt.ret==0 && verbose) 
           warn('['+classname+'] Missing return (undefined) in transition '+
                 opt.trans+', at '+self.syntax.location(elem)+'.');
        break;
      default:
        err('['+classname+'] Found invalid transition entry, expecting FunctionExpression, Identifier, or String Literal, got'+
            elem.type+', at '+self.syntax.location(elem));
        
    }  
  }

  if (verbose) out(classname+' passed check.');
  if (verbose) {
    out(classname+' has the following top-level object properties:');
    for (ep in syms) {
      var sym=syms[ep];
      if (!sym) continue;
      out('       '+ep+' : '+sym.type);
    }
    out(classname+' has the following activities:');
    for (ep in activities) {
      var elem=activities[ep];
      out('       '+ep);
    }
    out(classname+' next activity: '+nextVal);
    out(classname+' has the following transition entries:');
    for (ep in transitions) {
      var elem=transitions[ep];
      out('       '+ep);
    }
    if (subclasses) {
      out(classname+' has the following subclass entries:');
      for (ep in subclasses) {
        var elem=subclasses[ep];
        out('       '+ep);
      }
    }
  }
  if (verbose>1) {
    out(classname+' has the following top-level symbols:');
    for (ep in syms) {
      if (!syms[ep]) continue;
      out('       '+ep+':'+(verbose>2?Io.inspect(syms[ep]):syms[ep].type));
    }
  }
  return {
    activities:activities,
    transitions:transitions,
    subclasses:subclasses,
    symbols:syms,
    errors: errors
  }
}


module.exports = {
  corefuncs:corefuncs,
  /* Extend corefuncs */
  extend: function (funcs) {
    var p;
    for(p in funcs) {
      corefuncs[p]=funcs[p];
    }
  },
  jamc:jamc,
  options:options,
  current:function (module) { current=module.current; Aios=module; }
};
};

Base64=Require('os/base64');
Buffer=Require('os/buffer').Buffer;
process=Require('os/process');
window.JAMLIB=JAMLIB = Require('/home/sbosse/proj/jam/js/top/jamlib.js');
