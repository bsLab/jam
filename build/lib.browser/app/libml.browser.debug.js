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
BundleModuleCode['/home/sbosse/proj/jam/js/ml/ml.js']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2006-2019 BSSLAB
 **    $CREATED:     8-2-16 by sbosse.
 **    $VERSION:     1.14.7
 **
 **    $INFO:
 **
 **  JavaScript AIOS Machine Learning API
 **
 ** type algorithm = {'dti','dt','id3','c45','kmeans','knn','knn2','mlp','slp','rl','svm','txt','cnn'}
 **
 **
 ** id3: Symbolic Decision Tree algorithm
 ** -------------------------------------
 **
 ** typeof @options = {
 **   algorithm='id3',
 **   data:{x1:number,x2:number,..,y:*} []
 **   target:string is e.g. 'y'
 **   features: string [] is e.g. ['x1','x2',..]
 ** }
 **
 ** ice: decision tree algorithm supporting numbers with eps intervals (hybrid C45/ID3)
 ** -------------------------------------
 **
 ** General feature variable set:
 **
 ** typeof @options = {
 **   algorithm='dt',
 **   data:{x1:number,x2:number,..,y:*} [],
 **   target:string is e.g. 'y',
 **   features: string [] is e.g. ['x1','x2',..],
 **   eps:number is e.g. '5',
 ** }
 ** 
 ** dti: interval decision tree algorithm
 ** -------------------------------------
 **
 ** General feature variable set:
 **
 ** typeof @options = {
 **   algorithm='dti',
 **   data:{x1:number,x2:number,..,y:*} []
 **   target:string is e.g. 'y'
 **   features: string [] is e.g. ['x1','x2',..]
 **   eps:number is e.g. '5',
 **   maxdepth:number,
 ** }
 ** 
 ** Or vector feature variables (i.e., features=[0,1,2,...n-1], target=n):
 **
 ** typeof @options = {
 **   algorithm='dti',
 **   x:* [] [],
 **   y:* [],
 **   eps:number is e.g. '5',
 **   maxdepth:number,
 ** }
 **
 ** knn: k-Nearest-Neighbour Algorithm
 ** ----------------------------------
 **
 ** typeof @options = {
 **   algorithm='knn',
 **   x: number [][], 
 **   y: * []
 ** }
 **
 ** mlp: multi layer perceptron Algorithm
 ** ----------------------------------
 **
 ** typeof @options = {
 **   algorithm='mlp',
 **   x: number [][], 
 **   y: number [] [] | * [],
 **   hidden_layers?:number [],
 **   lr?:number,
 **   epochs?:number,
 **   labels?:string [], 
 **   features?: string [], 
 **   normalize?, 
 **   verbose?:number
 ** }
 **
 **
 ** cnn: Convolutional Neural Network for numerial (2D) data
 ** -------------------------------------
 **
 ** General feature variable set:
 **
 ** typeof @options = {
 **   algorithm='cnn',
 **   data:{x:[]|[][],y:'a} []
 **   layers: layer [],
 **   trainer:trainer,
 ** }
 ** type layer = 
 **  {type:'input', out_sx:number, out_sy:number, out_depth:number} | // Input Layer
 **  {type:'conv', sx:number, filters:number, stride:number, pad:number, activation:string} | // Convolution Layer
 **  {type:'pool', sx:number, stride:number} | // Pooling Layer
 **  {type:'softmax', num_classes:number} | // Classifier Layers
 **  {type:'svm', num_classes:number| // Classifier Layers
 **  {type:'fc', num_neurons:number, activation:string} // Fully Connected Layer
 **
 ** typeof activation = 'relu'| 'maxout' | 'sigmoid' | 'tanh' ..
 **
 ** type trainer = 
 **  {method: 'sgd', learning_rate:number,  momentum: number, batch_size:number, l2_decay:number} |
 **  {method: 'adadelta', learning_rate:number,  eps: number, ro:number, batch_size:number, l2_decay:number} |
 **  {method: 'adam', learning_rate:number, eps: number, beta1: number, beta2: number, batch_size: number, l2_decay:number} |
 **  ..
 **
 ** text: text analysis (similarity checking)
 ** -----------------------------------------
 **   classify(model,string) -> {match:number [0..1],string:string }
 **   learn({algorithm:ML.TXT, data:string []]) -> model
 **   test({algorithm:ML.TXT,string:string}|model,string) -> number [0..1]
 **   similarity(string,string) -> number [0..1]
 ** 
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');


var ICE = Require('ml/dt'); // ICE ID3/C45 eps
var DTI = Require('ml/dti');
var KNN = Require('ml/knn');
var KMN = Require('ml/kmeans');
var SVM = Require('ml/svm');
var MLP = Require('ml/mlp');
var ID3 = Require('ml/id3');
var C45 = Require('ml/C45');
var TXT = Require('ml/text');
var RF  = Require('ml/rf');
var RL  = Require('ml/rl');
var STAT= Require('ml/stats');
var CNN = Require('ml/cnn');
var ANN = Require('ml/ann');

var current=none;
var Aios=none;

var options = {
  version: '1.14.7'
}

// Some definitions
var ML = {
  // Algorithms
  ANN:'ann',    // neataptic NN 
  C45:'c45',
  CNN:'cnn',
  ICE:'ice',   // ICE ID3/C45 eps
  DTI:'dti',
  ID3:'id3',
  KMN:'kmeans',
  KNN:'knn',
  KNN2:'knn2',
  MLP:'mlp',
  RF:'rf',    // Random Forest
  RL:'rl',    // Reinforcement Leerner
  SLP:'slp',  // Synonym for MLP (but single layer)
  SVM:'svm',
  TXT:'txt',
  // Some Functions
  EUCL:'euclidean',
  PEAR:'pearson',
  
  // RL agents
  DPAgent:'DPAgent',
  TDAgent:'TDAgent',
  DQNAgent:'DQNAgent',
};

/**
 * Computes Log with base-2
 * @private
 */
function log2(n) {
  return Math.log(n) / Math.log(2);
}

function obj2Array(row,features) {
  return features.map(function (attr) { return row[attr] });
}
function objSlice(row,features) {
  var o = {};
  features.forEach(function (attr) { o[attr]=row[attr] });
  return o;
}

// transform [v][] -> v[]
function relax(mat) {
  if (Comp.obj.isMatrix(mat) && mat[0].length==1) return mat.map(function (row) { return row[0]})
  else return mat;
}

// transform v[] -> [v][]
function wrap(mat) {
  if (!Comp.obj.isMatrix(mat)) return mat.map(function (v) { return [v]})
  else return mat
}

/* Common data transformation between different formats
**
** 1a. need='xy':   data={$x:'a,$y:'b}[] -> {x:{$x} [], y:'b[]}
** 1b. need='xy':   data=('a|'b)[][] -> {x:'a [][], y:'b[]}
** 1c. need='xry':  data=('a|'b)[][] -> {x:{$x} [], y:'b[]}
** 1c. need='io':   data=number[][] -> {input:number, output:number} []
** 1d. need='io':   data={$x:number,$y:number}[] -> {input:number, output:number} []
** 2. need='xmy':   data={$x:'a,$y:'b}[] -> {x:'a [][], y:'b[]}
** 3. need='d':     data={x:'a[][],y:'b[]}} -> {data:{$x:'a,$y:'b}[][]}
** 4. need='dm':    data={x:'a[][],y;'b[]} -> {data:('a|'b)[][]}
** 5. need='m':     data={$x:'a}[] -> 'a [][]
** 6. need='a':     data={$x:'a} -> 'a []

** typeof options = {
**   scale: {k:number, off:number, shift:number} is transformation of input data,
**   features : string [] is feature variable list,
**   target: string is output variable,
**
**/

function preprocess(data,need,options) {
  var row,x,y,_data;
  function scale(row) {
    if (!options.scale) return row;
    if (typeof options.scale.k == 'number')
      return row.map(function (col,i) { 
        return options.scale.shift+(col-options.scale.off)*options.scale.k })
    else
      return row.map(function (col,i) { 
        return options.scale.shift+(col-options.scale.off[i])*options.scale.k[i] })
  }
  function array(data) {
    return Comp.obj.isArray(data)?data:[data]
  } 
  if (Comp.obj.isArray(data)) {
    row=data[0];
    switch (need) {
      case 'xy':
      case 'xry':
        if (options.target!=undefined && options.features!=undefined) {
          if (Comp.obj.isArray(row) && need=='xy') {
            if (Number(options.target)==row.length-1) {
              x=data.map(function (row) { return scale(row.slice(0,options.target)) });
              y=data.map(function (row) { return row[options.target] })
            }
          } else  if (Comp.obj.isObj(row)) {
            if (typeof options.target == 'string') {
              x=data.map(function (row) { return scale(objSlice(row,options.features)) });
              y=data.map(function (row) { return row[options.target] });
            }
          }
        }
        if (x && y) return {x:x,y:y}
        break;
      case 'a':
        if (Comp.obj.isArray(data) && typeof data[0] != 'object') return {data:data};  
        if (Comp.obj.isObject(data) && options.features!=undefined) {
          return { data:data.map(function (row) { 
                    return scale(objSlice(row,options.features)) })};
        }
        break;
      case 'm':
       if (Comp.obj.isMatrix(data)) return {data:data};
        if (Comp.obj.isObject(row) && options.features!=undefined) {
          return { data:data.map(function (row) { 
                    return scale(obj2Array(row,options.features)) })};
        }
       break;  
      case 'xmy':
        if (Comp.obj.isObject(row) && options.features!=undefined && options.target!=undefined) {
          return { x:data.map(function (row) { 
                      return scale(obj2Array(row,options.features)) }),
                   y:data.map(function (row) { return row[options.target]})};
        }
       break;  
      case 'io':
        if (Comp.obj.isArray(row) && options.target!=undefined) {
          // number [][] 
          if (Number(options.target)==row.length-1) {
            _data=data.map(function (row) { return { input:scale(row.slice(0,options.target)),
                                                     output:array(row[options.target]) }});
            return _data
          } 
        } else if (Comp.obj.isObject(row) && options.target!=undefined && options.features!=undefined) {
          _data=data.map(function (row) { return { input:scale(obj2Array(row,options.features)),
                                                   output:array(row[options.target]) }});
          return _data
        }

        break;
    }
  } else if (data.x && data.y) {
    if (Comp.obj.isArray(data.x) && Comp.obj.isArray(data.y)) {
      row=data.x[0];
      switch (need) {
        case 'io':
        if (Comp.obj.isArray(row)) {
          // number [][] 
          _data=data.x.map(function (row, rowi) { return { input:scale(row),
                                                           output:array(data.y[rowi]) }});
          return _data          
        } 
        if (Comp.obj.isObject(row) && options.features!=undefined) {
          _data=data.x.map(function (row, rowi) { return { input:scale(obj2Array(row,options.features)),
                                                           output:array(data.y[rowi]) }});
          return _data          
        }
        break;
        case 'xm':
          if (Comp.obj.isArray(row)) return data.x;
          break;
        case 'xmy':
          if (Comp.obj.isArray(row)) return { x:data.x, y:data.y};
          break;
        case 'xmya':
          if (Comp.obj.isArray(row)) return { x:data.x, y:data.y.map(array)};
          break;
      } 
    }   
  }
}



// Agent AIOS API
var  ml = {
  // only RL
  action : function (model,arg) {
    switch (model.algorithm) {
      // Selects and returns next action from set of actions
      case ML.RL:
        switch (model.kind) {
          case ML.DQNAgent:
            // arg == state array
            return model.actions[RL.DQNAgent.code.act(model,arg)];   
            break;
          case ML.DPAgent:
            // arg == state (integer number)
            return model.actions[RL.DPAgent.code.act(model,arg)];   
            break;
          case ML.TDAgent:
            // arg == state (integer number)
            return model.actions[RL.TDAgent.code.act(model,arg)];   
            break;
        }
        break;   
    }
  },
  /** Classification (prediction): Apply sample data to learned model.
   *  Returns prediction result.
   *
   */ 
  classify: function (model,samples) {
    var x,solutions;
    switch (model.algorithm) {
    
      case ML.ANN:
        if (Comp.obj.isArray(samples)) 
          return samples.map(function (sample) { 
            return model.network.activate(sample) 
          });
        else
          return model.network.activate(samples);

      case ML.CNN:
        if (Comp.obj.isMatrix(samples))
          return samples.map(function (sample) {
            return CNN.predict(model,sample);
          });
        else
          return CNN.predict(model,samples);
        break;

      case ML.C45:
        // Sample row format: [x1,x2,..,xn]
        if (Comp.obj.isMatrix(samples)) {
          return samples.map(function (sample) {
            return C45.classify(model,sample);
          });
        } else if (Comp.obj.isArray(samples) && !Comp.obj.isObj(samples[0])) {
          return C45.classify(model,samples);
        } else if (Comp.obj.isArray(samples) &&  Comp.obj.isObj(samples[0])) {
          return samples.map(function (sample) {
            return C45.classify(model,sample); 
          });
        } else if (Comp.obj.isObj(samples)) {
          return C45.classify(model,samples);
        }
        break;

      case ML.DT:
      case ML.ICE:
        if (Comp.obj.isMatrix(samples) ||
            Comp.obj.isArray(samples) && Comp.obj.isObj(samples[0])) 
          return samples.map(function (sample) { 
            return ICE.predict(model,sample) 
          });
        else 
          return ICE.predict(model,samples);

      case ML.DTI:
        if (Comp.obj.isMatrix(samples)) 
          return samples.map(function (sample) { 
            return DTI.predict(model,sample) 
          });
        else
          return DTI.predict(model,samples);

      case ML.ID3:
        if (Comp.obj.isArray(samples)) 
          return samples.map(function (sample) { 
            return ID3.predict(model,sample) 
          });
        else
          return ID3.predict(model,samples);

      case ML.KNN:
        if (Comp.obj.isMatrix(samples))
          return KNN.predict(model,samples);        
        else if (Comp.obj.isArray(samples) && Comp.obj.isObj(samples[0]))
          return KNN.predict(model,samples.map(function (sample) { 
            return obj2Array(sample,model.features)}));
        else if (Comp.obj.isObj(samples))
          return KNN.predict(model,obj2Array(samples,model.features));
        else
          return KNN.predict(model,samples);
        break;

      case ML.KNN2:
        if (Comp.obj.isMatrix(samples))
          return samples.map(function (sample) {
            return KNN.predict2(model,sample);
          });
        else if (Comp.obj.isArray(samples) && Comp.obj.isObj(samples[0]))
          return samples.map(function (sample) {
             return KNN.predict2(model,obj2Array(sample,model.features))
            })
        else if (Comp.obj.isObj(samples))
          return KNN.predict2(model,obj2Array(samples,model.features));
        else
          return KNN.predict2(model,samples);
        break;

      case ML.KMN:
        return model.clusters
        break;

      case ML.RF:
        if (model.labels) {
          if (Comp.obj.isMatrix(samples)) {
            return samples.map(function (sample) {
              return model.rfs.map(function (rf) {
                return RF.code.predictOne(rf,sample);
              }).map(function (v,i) {
                return { value:model.labels[i], prob:v }
              })
            });
          } else if (Comp.obj.isArray(samples) && typeof samples[0] == 'number') {
            return model.rfs.map(function (rf) {
              return RF.code.predictOne(rf,samples);
            }).map(function (v,i) {
                return { value:model.labels[i], prob:v }
            })
          } // TODO
        } else {
          // Sample row format: [x1,x2,..,xn]
          if (Comp.obj.isMatrix(samples)) {
            return samples.map(function (sample) {
              return RF.code.predictOne(model,sample);
            });
          } else if (Comp.obj.isArray(samples) && typeof samples[0] == 'number') {
            return RF.predictOne(model,samples);
          } // TODO
        }
        // preprocess(samples,'m')
        break;
                
      case ML.SVM:
        if (!model._labels) {
          // Single SVM 
          if (Comp.obj.isMatrix(samples))
            return samples.map(function (sample) {
              return SVM.code.predict(model,sample);
            });
          else
            return SVM.code.predict(model,samples);
        } else {
          // Multi SVM
          if (Comp.obj.isMatrix(samples))
            return samples.map(function (sample) {
              solutions=model.svms.map(function (svm,index) { 
                if (svm.threshold==false)
                  return SVM.code.predict(svm,sample)
                else
                  return SVM.code.predict(svm,sample); 
              });
              return solutions.map(function (v,i) { return { value:model._labels[i], prob:v } });
            });
          else {
            solutions=model.svms.map(function (svm,index) { 
                if (svm.threshold==false)
                  return SVM.code.predict(svm,samples)
                else
                  return SVM.code.predict(svm,samples)==1; 
            })
            return solutions.map(function (v,i) { return { value:model._labels[i], prob:v } });
          }
        }
        break;
        
      case ML.SLP:
      case ML.MLP:
        if (Comp.obj.isMatrix(samples)) {
          x=samples;
          if (model.scale) 
            x=x.map(function (row) { return row.map(function (col,i) { 
                                      return model.scale.shift+(col-model.scale.off[i])*model.scale.k[i] })});
          return model.labels?MLP.code.predict(model,x).map(function (r) {
            var o={};
            r.forEach(function (v,i) { o[model.labels[i]]=v });
            return o;
          }):relax(MLP.code.predict(model,x));
        } else if (Comp.obj.isArray(samples)) {
          x=samples;
          if (model.scale) 
            x=x.map(function (col,i) { return model.scale.shift+(col-model.scale.off[i])*model.scale.k[i] });
          return model.labels?MLP.code.predict(model,[x]).map(function (r) {
            var o={};
            r.forEach(function (v,i) { o[model.labels[i]]=v });
            return o;
          })[0]:relax(MLP.code.predict(model,[x])[0]);
        } else if (Comp.obj.isObj(samples) && model.features) {
          x=model.features.map(function (f) { return samples[f] });
          if (model.scale) 
            x=x.map(function (col,i) { return model.scale.shift+
                                              (col-model.scale.off[i])*model.scale.k[i] });
          return model.labels?MLP.code.predict(model,[x]).map(function (r) {
            var o={};
            r.forEach(function (v,i) { o[model.labels[i]]=v });
            return o;
          })[0]:relax(MLP.code.predict(model,[x])[0]); 
        }  
        break;
        
       case ML.TXT:
        // typeof options = {data: string []}
        if (Comp.obj.isArray(samples))
          return samples.map(function (sample) { return TXT.classify(model,sample) });
        else
          return TXT.classify(model,samples);
        break;

   }
  },
  
  compact: function (model) {
    switch (model.algorithm) {
      case ML.DTI:
      default:
        return DTI.compactTree(model);
    }
  },
  
  depth: function (model) {
    switch (model.algorithm) {
      case ML.DTI:
        return DTI.depth(model);
    }
  },
  
  
  evaluate: function (model,target,samples) {
    switch (model.algorithm) {
      case ML.DTI:
      default:
        return DTI.evaluate(model,target,samples);
    }
  },
  /** Learning: Create a classification model from training data (or an empty model that can be updated)
   *
   */
  learn: function (options) {
    var model,data,data2,x,y,features,featureTypes,test,target,result,cols,n_ins,n_outs,x,y,scale,offset,shift,key,err;
    if (options==_) options={};
    switch (options.algorithm) {
    
      case ML.ANN:
        // typeof options = { x,y,features?,target?,layers:number [], trainerror:number}
        data = preprocess(options,'io',options);
        model={};
        model.algorithm=options.algorithm
        if (!options.layers) options.layers=[]
        if (data)
          model.network = new ANN.Network(options.layers[0],options.layers[options.layers.length-1]);
        else throw 'ML.learn.ANN: Invalid options';
        model.network.evolve(data,options);
        return model;
        break;      
        

      case ML.CNN:
        // typeof options = {x:[][],y:[],..}
        model = CNN.create(options);
        model.algorithm=options.algorithm;
        return model;
        break;

      case ML.C45:
        // typeof options = {data: {}[], target:string, features: string []} |
        //                  {data: [][], target?:string, features?: string []} |
        //                  {x: number [][], y:[]} |
        //                  {data: {x,y}[] }
        var model = C45.create();
        if (options.x && options.y) {
          features=options.x[0].map(function (col,i) { return String(i) }); 
          featureTypes=options.x[0].map(function (col,i) { return 'number' });
          data=options.x.map(function (row,i) { row=row.slice(); row.push(options.y[i]); return row});
          target='y';
        } else if (options.data && Comp.obj.isMatrix(options.data)) {
          data=options.data;
          features=options.features||options.data[0].slice(0,-1).map(function (col,i) { return String(i) });
          featureTypes=options.data[0].slice(0,-1).map(function (col,i) { return typeof col == 'number'?'number':'category' });
          target=options.target||'y';
        } else if (options.data && Comp.obj.isObj(options.data[0]) && options.data[0].x && options.data[0].y!=undefined) {
          data=options.data.map(function (row) { return row.x.concat(row.y) });
          features=options.features||options.data[0].x.slice(0,-1).map(function (col,i) { return String(i) });
          featureTypes=options.data[0].x.slice(0,-1).map(function (col,i) { return typeof col == 'number'?'number':'category' });
          target=options.target||'y';
        } else if (options.data && Comp.obj.isArray(options.data) && Comp.obj.isObj(options.data[0]) && 
                   options.target && options.features) {
          rowNames=Comp.obj.isArray(options.target)?options.features.concat(options.target):
                                                    options.features.concat([options.target]);
          data=options.data.map(function (row) { return obj2Array(row,rowNames) })
          features=options.features;
          featureTypes=data[0].slice(0,-1).map(function (col,i) { return typeof col == 'number'?'number':'category' });
          target=options.target;
        } else throw 'ML.learn.C45: Invalid options';

        C45.train(model,{
          data: data,
          target: target,
          features: features,
          featureTypes: featureTypes
        });
        model.algorithm=options.algorithm
        return model;
        break;


      case ML.DTI:
        // typeof options = {data: {}[], target:string, features: string [], eps;number, maxdepth} |
        //                   {x: number [][], y:[], eps;number, maxdepth}
        if (options.eps==_) options.eps=0;
        if (options.maxdepth==_) options.maxdepth=20;
        if (options.data && options.target && options.features)
          model = DTI.create(options);
        else if (options.x && options.y) {
          if (options.x.length != options.y.length) throw 'ML.learn.DTI: X and Y vector have different length';
          data=options.x.map(function (row,i) { row=row.slice(); row.push(options.y[i]); return row});
          features=Comp.array.init(data[0].length-1,function (i) { return String(i)});
          target=String(data[0].length-1);
          // console.log(data,features,target)
          model = DTI.create({
            data:data,
            features:features,
            target:target,
            eps:options.eps,
            maxdepth:options.maxdepth
          });
        } else throw 'ML.learn.DTI: Invalid options';
        model.algorithm=options.algorithm;
        return model;


      case ML.ICE:
      case ML.DT:
        if (options.eps==_) options.eps=0;
        if (options.data && options.target && options.features)
          model = ICE.create(options);                  
        else if (options.x && options.y) {
          if (options.x.length != options.y.length) throw 'ML.learn.ICE: X and Y vector have different length';
          data=options.x.map(function (row,i) { row=row.slice(); row.push(options.y[i]); return row});
          features=Comp.array.init(data[0].length-1,function (i) { return String(i)});
          target=String(data[0].length-1);
          model = ICE.create({
            data:data,
            features:features,
            target:target,
            eps:options.eps,
          });
        } else throw 'ML.learn.ICE: Invalid options';
        model.algorithm=options.algorithm;
        model.eps=options.eps;
        return model;
        break;      

      case ML.ID3:
        if (options.data && options.target && options.features)
          model = ID3.createTree(options.data,options.target,
                                 options.features);
        else throw 'ML.learn.ID3: Invalid options';
        model.algorithm=options.algorithm
        return model;
        break;      
          
      case ML.KNN:
        // typeof @options = {data: {}[]|[][], distance?:function|string,k?:number}
        // typeof @options = {x:number [][], y:number [], 
        //                    distance?:function|string,k?:number}
        if (options.features && options.target) target=options.target,features = options.features;
        else {
          features = [];
          if (options.data) {
            for(key in options.data[0]) features.push(key);
            target = features.pop()
          } else if (options.x) {
            for(key in options.x[0]) features.push('x'+key);
            target='y';
          }
        }
        if (options.data && Comp.obj.isObj(options.data[0])) {
          x = options.data.map(function (row) { return obj2Array(row,features) });
          y = options.data.map(function (row) { return row[target] })
        } else if (options.data && Comp.obj.isMatrix(options.data)) {
          x = options.data,map(function (row) { return row.slice(0,row.length-1) });
          y = options.data,map(function (row) { return row[row.length-1] });
        } else if (options.x && options.y) {
          x = options.x;
          y = options.y;
        }
        model = KNN.create(
          x,
          y,
          {
            distance:options.distance,
            k:options.k
          });
        model.algorithm = options.algorithm
        model.features  = features
        model.target    = target
        return model;
        break;

      case ML.KNN2:
        // typeof @options = {data: {}[]|[][], distance?:function|string,k?:number}
        // typeof @options = {x:number [][], y:number [], 
        //                    distance?:function|string,k?:number}
        if (options.features && options.target) target=options.target,features = options.features;
        else {
          features = [];
          if (options.data) {
            for(key in options.data[0]) features.push(key);
            target = features.pop()
          } else if (options.x) {
            for(key in options.x[0]) features.push('x'+key);
            target='y';
          }
        }
        if (options.data && Comp.obj.isObj(options.data[0])) {
          x = options.data.map(function (row) { return obj2Array(row,features) });
          y = options.data.map(function (row) { return row[target] })
        } else if (options.data && Comp.obj.isMatrix(options.data)) {
          x = options.data,map(function (row) { return row.slice(0,row.length-1) });
          y = options.data,map(function (row) { return row[row.length-1] });
        } else if (options.x && options.y) {
          x = options.x;
          y = options.y;
        }
        model = KNN.create2(
          {
            x : x,
            y : y,
            distance:options.distance,
            k:options.k
          });
        model.algorithm=options.algorithm
        model.features = features
        model.target = target
        return model;
        break;
        
      case ML.KMN:
        if (options.data && Comp.obj.isMatrix(options.data)) {
          data=options.data;
        } 
        model = KMN.cluster({
          data:data,
          k:options.k,
          distance:options.distance,
          epochs:options.epochs,
        })
        model.algorithm=options.algorithm
        model.data = data
        return model;
        break;
                
      case ML.RF:
        var model={};
        // Single Binary RF (y={-1,1}) or Multi-RF (y:string is in labels)
        // typeof options = {data: {}[], target:string, features: string []} |
        //                  {data: [][], target?:string, features?: string []} |
        //                  {x: number [][], y: {-1,1} []} |
        //                  {data: {x,y}[] }
        //                  {data: {x,y}[], labels: string [] }
        if (!options.x || !options.y) throw 'ML.learn.RF: Invalid options';
        // data=preprocess(data,'xmy',{features:features,target:target})
        data={x:options.x,y:options.y}; // TODO 
        if (options.labels) {
          // multi-RF
          model.labels = options.labels;
          model.rfs = model.labels.map (function (label) { return RF() });
          model.rfs.forEach (function (rf,i) {
            var y = data.y.map(function (label) { return label==model.labels[i]?1:-1} );
            RF.code.train(rf,options.x,y,{
              numTrees:options.numTrees,
              maxDepth:options.maxDepth,
              numTries:options.numTries,
              type:options.weakType,
            });
          });
        } else {
          model = RF();
          features=options.x[0].map(function (col,i) { return String(i) }); 
          target='y';
        
          RF.code.train(model,
            options.x,
            options.y,
            {
              numTrees:options.numTrees,
              maxDepth:options.maxDepth,
              numTries:options.numTries,
              type:options.weakType,
            });    
        }
        model.algorithm=options.algorithm
        return model;
        break;

      case ML.RL:
        // Create learner instance
        model = {}
        options.environment=checkOptions(options.environment,{});
        options.environment.getMaxNumActions=
          checkOption(options.environment.getMaxNumActions,
                      function () { return options.actions.length })
        options.environment.getNumStates=
          checkOption(options.environment.getNumStates,
                      function () { return options.states.length })
        var allowedActions=checkOption(options.environment.allowedActions, function () { return options.actions });
        options.environment.allowedActions=
          // Ensure that allowedActions return number array!
          function (state) { 
            return allowedActions(state).map(function (a) {
              return options.actions.indexOf(a)
            })
          }  
        var nextState = options.environment.nextState;
        if (nextState) {
          options.environment.nextState = function (state,action) {
            return nextState(state,options.actions[action])
          }
        }
        switch (options.kind) {
          case ML.DQNAgent:                          
            model = RL.DQNAgent(
              options.environment,  
              {
                alpha:options.alpha,gamma:options.gamma,epsilon:options.epsilon,
                experience_add_every:options.experience_add_every,
                experience_size:options.experience_size,
                learning_steps_per_iteration:options.learning_steps_per_iteration,
                tderror_clamp:options.tderror_clamp,
                num_hidden_units:options.num_hidden_units,
                update:options.update,
               }
            )
            break;
          case ML.DPAgent:
            model = RL.DPAgent(
              options.environment,  
              {alpha:options.alpha,beta:options.beta,gamma:options.gamma,
               epsilon:options.epsilon,lambda:options.lambda}
            )
            break;
          case ML.TDAgent:
            model = RL.TDAgent(
              options.environment,  
              // specs
              {alpha:options.alpha,beta:options.beta,gamma:options.gamma,
               epsilon:options.epsilon,lambda:options.lambda,
               replacing_traces:options.replacing_traces,
               smooth_policy_update:options.smooth_policy_update,
               update:options.update,
               planN:options.planN}
            )
            break;
        }
        model.algorithm = options.algorithm;
        model.kind      = options.kind;
        if (options.actions)  model.actions   = options.actions;
        if (options.states)   model.states    = options.states;
        if (options.rewards)  model.rewards   = options.rewards;
        return model;
        break;



      case ML.SLP:
      case ML.MLP:
        // typeof options = {x: number [][], 
        //                   y: number [][] | * [],
        //                   hidden_layers?:[],epochs?:number,
        //                   labels?:string [], features?: string [], 
        //                   normalize?, bipolar?, verbose?}
        //
        // y and MLP(learn) requires [[p1,p2,..],[p1,p2,..],..] with 0>=p>=1
        //                                                           p:label probability
        x=options.x;
        if (Comp.obj.isMatrix(options.y)) 
          y=options.y;
        else if (Comp.obj.isArray(options.y) && typeof options.y[0] == 'number') 
          y=wrap(options.y);        
        else if (Comp.obj.isArray(options.y) && options.labels) {
          y=options.y.map(function (l1) {
            return options.labels.map(function (l2) {
              return l1==l2?1:0;
            });
          });
        } else throw 'ML.learn.MLP: invalid options';
        if (options.normalize) {
          // normalize each variable independently!?
          var max=x[0].map(function (col) { return col}),
              min=x[0].map(function (col) { return col});
          x.forEach(function (row) { row.forEach(function (col,i) { 
            max[i]=Math.max(max[i],col);
            min[i]=Math.min(min[i],col) }) });
          shift=options.bipolar?-1:0;
          scale=max.map(function (x,i) { return (shift?2:1)/((x-min[i])==0?1:x-min[i])});
          offset=min;
          x=x.map(function (row) { return row.map(function (col,i) { return shift+(col-offset[i])*scale[i] }) });
        }

        model = MLP({
          input:x,
          label:y,
          n_ins:x[0].length,
          n_outs:y[0].length,
          hidden_layer_sizes:options.algorithm==ML.SLP?[]:(options.hidden_layers||[])
        });
        model.algorithm=options.algorithm;
        model.labels=options.labels;
        model.features=options.features;
        model.scale=options.normalize?{k:scale,off:offset,shift:shift}:undefined;
        model.nOutputs=y[0].length;
        
        MLP.code.set(model,'log level',options.verbose||0); // 0 : nothing, 1 : info, 2 : warning.
        MLP.code.train(model,{
          epochs : options.epochs||20000
        });
        return model;
        break;

      case ML.SVM:
        // typeof options = {x: number [][], 
        //                   y: ({-1,1}|string) [],
        //                   labels?:string|number [],
        //                   threshold?:number|false,
        //                   C?:numer,tol?:number,max_passes?:number,alpha_tol?:number,kernel?:{}}
        
        // If classes then multi-SVM (one for each class to be separated)!
        if (!options.labels) {
          model = SVM({
            x:options.x,
            y:options.y,
            threshold:options.threshold,
          });
          model.algorithm=options.algorithm
          SVM.code.train(model,{
            C:options.C||1.0,
            tol:options.tol||1e-4,
            max_passes:options.max_passes||20,
            alpha_tol:options.alpha_tol||1e-5,
            kernel:options.kernel
          });
        } else {
          model={};
          model.algorithm=options.algorithm;
          model._labels=options.labels;
          model.svms=options.labels.map(function (cl) {
            return SVM({
              x:options.x,
              y:options.y.map(function (y) { return y==cl?1:-1 }),
              threshold:options.threshold,
            });
          });
          
          model.svms.forEach(function (svm) {
            SVM.code.train(svm,{
              C:options.C||1.0,
              tol:options.tol||1e-4,
              max_passes:options.max_passes||20,
              alpha_tol:options.alpha_tol||1e-5,
              kernel:options.kernel
            });
          });
          // Create one SVM for each class
          // Transform y vector          
        }
        return model;
        break;

      case ML.TXT:
        // typeof options = {data: string []}
        model = TXT.create(options.data,{
        });
        model.algorithm=options.algorithm
        return model;
        break;
    }
  },

  preprocess:preprocess,

  print: function (model,indent,compact) {
    switch (model.algorithm) {
      case ML.DTI:
        return DTI.print(model,indent,compact);
      case ML.DT:
      case ML.ICE:
        return ICE.print(model,indent);
      case ML.C45:
        return C45.print(model,indent);
      case ML.ID3:
        return ID3.print(model,indent);
    }
  },
  
  // Only text module
  similarity : TXT.similarity,
  
  stats : STAT,
  
  // Check model consistency
  test: function (model,samples) {
    var x,y,data,res,p=0.0;
    switch (model.algorithm) {
    
      case ML.ANN:
        data=preprocess(samples,'xmya',{features:model.features,target:model.target});
        // TODO
        break;
        
      case ML.C45:
        // Sample row format: [x1,x2,..,y]
        if (Comp.obj.isMatrix(samples)) {
          samples.forEach(function (sample) {
            x=sample.slice(0,sample.length-1);
            y=sample[sample.length-1];
            res= C45.classify(model,x);
            if (res==y) p += 1;
          });
          return p/samples.length;
        } else if (Comp.obj.isArray(samples)) {
          x=samples.slice(0,samples.length-1);
          y=samples[samples.length-1];
          res = C45.classify(model,x);
          return res==y?1.0:0.0
        } else if (Comp.obj.isObj(samples) && model.features) {
        }
        break;

      case ML.TXT:
        var model = model.string?{ data : [model.string] }:model;
        if (Comp.obj.isArray(samples))
          return samples.map(function (sample) { 
            return TXT.classify(model,sample).match
          });
        else
          return TXT.classify(model,samples).match;
        break;

        
    }
  },
  

  /** Update a learned model
   *
   */
  update: function (model,options) {
    switch (model.algorithm||options.algorithm) {
    
      case ML.RL:
        switch (model.kind) {
          case ML.DQNAgent:
            return RL.DQNAgent.code.learn(model,options);
            break;
          case ML.DPAgent:  
            return RL.DPAgent.code.learn(model,options);
            break;
          case ML.TDAgent:
            return RL.TDAgent.code.learn(model,options);
            break;
        }
        break;

      case ML.DTI:
        // typeof @options = {data: number [][], target:string, features: string [], eps?:number, maxdepth?:number} |
        //                   {x: number [][], y:[], eps?:number, maxdepth?:number}
        if (options.eps==_) options.eps=0;
        if (options.maxdepth==_) options.maxdepth=20;
        if (options.data && options.target && options.features)
          model = DTI.update(model,options);
        else if (options.x && options.y) {
          if (options.x.length != options.y.length) throw 'ML.update.DTI: X and Y vector have different length';
          data=options.x.slice();
          data=data.map(function (row,i) {row.push(options.y[i]); return row});
          features=Comp.array.init(data[0].length-1,function (i) { return String(i)});
          target=String(data[0].length-1);
          console.log(data,features,target)
          model = DTI.update(model,{
            data:data,
            features:features,
            target:target,
            eps:options.eps,
            maxdepth:options.maxdepth
          });
        } else throw 'ML.update.DTI: Invalid options';
          
        model.algorithm=options.algorithm;
        return model;

      case ML.CNN:
        break;
    }
  },
  ML:ML,
};
  
ICE.ml=ml;
CNN.ml=ml;
ml.predict=ml.classify;
ml.train=ml.learn;
ml.best=ml.stats.utils.best;

module.exports = {
  agent:ml,
  classify:ml.classify,
  column:ml.column,
  compact:ml.compact,
  depth:ml.depth,
  entropy:ml.entropy,
  entropyN:ml.entropyN,
  entropyDep:ml.entropyDep,
  evaluate:ml.evaluate,
  learn:ml.learn,
  options:options,
  preprocess:preprocess,
  print:ml.print,
  test:ml.test,
  unique:ml.unique,
  update:ml.update,
  ML:ML,
  current:function (module) { current=module.current; Aios=module; }
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
BundleModuleCode['ml/dt']=function (module,exports,global,process){
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
 **    $AUTHORS:     Ankit Kuwadekar, Stefan Bosse
 **    $INITIAL:     (C) 2014, Ankit Kuwadekar
 **    $MODIFIED:    (C) 2006-2018 bLAB by sbosse
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 **
 ** ICE: C45/ID3 Decision Tree Algorithm supporting feature variables with eps intervals
 **
 ** Portable model
 **
 ** TODO: independent eps for each feature variable 
 **        typeof eps = number | [epsx1:number,epsx2:number,..]
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;
var that;

/**
 * Map of valid tree node types
 * @constant
 * @static
 */
var NODE_TYPES = {
  RESULT: 'result',
  FEATURE: 'feature',
  FEATURE_VALUE: 'feature_value'
};

var NL ='\n'

/**
 * Creates a new tree
 */
function createTree(data, target, features, eps) {
  var ml = that.ml;
  var targets = ml.stats.unique(ml.stats.utils.column(data, target));
  if (targets.length == 1) {
    return {
      type: NODE_TYPES.RESULT,
      name: targets[0],
    };
  }

  if (features.length == 0) {
    var topTarget = ml.stats.mostCommon(targets);
    return {
      type: NODE_TYPES.RESULT,
      name: topTarget,
    };
  }

  
  var split = ml.stats.splitEps(data,features,target,targets,eps);
  var bestFeature = split.feature;
  var remainingFeatures = split.remainingFeatures;
  var possibleValues = split.possibleValues;

  var node = {
    type: NODE_TYPES.FEATURE,
    name: bestFeature,
    eps: eps,  // eps[bestFeature]
  };

  node.vals = split.choices.map(function (c) {
    var child_node = {
      val : c.val,
      eps : eps, // TODO
      type: NODE_TYPES.FEATURE_VALUE
    };

    child_node.child = createTree(c.data, target, remainingFeatures, eps);
    return child_node;
    
  })
  return node;
}


function depth(model) {
  switch (model.type) {
    case NODE_TYPES.RESULT: return 1;
    case NODE_TYPES.FEATURE: 
      return 1+Comp.array.max(model.vals,function (val) {
        return depth(val);
      });
    case NODE_TYPES.FEATURE_VALUE: 
      return 1+depth(model.child);   
  }
  return 0;
}

function predictEps(model,sample,prob,eps) {
  var root = model;
  if (!prob) prob=1;
  while (root.type !== NODE_TYPES.RESULT) {
    var attr = root.name;
    var sampleVal = sample[attr];
    // kNN approximation
    var childNode = null;
    root.vals.forEach(function(node) {
      var fit=Math.abs(node.val-sampleVal);
      if (!childNode || fit < childNode.fit) childNode={fit:fit,node:node};
    });
    if (childNode){
      // with fit quality propagation
      prob = prob * (1-Math.abs(childNode.fit/eps)/4) 
      root = childNode.node.child;
    } else {
      root = root.vals[0].child;
    }
  }
  return {value:root.name,prob:prob};
};


function printModel(model,indent) {
  var line='',sep;
  if (indent==undefined) indent=0;
  if (!model) return '';
  var sp = function () {var s=''; for(var i=0;i<indent;i++) s+=' '; return s};
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return sp()+'-> '+model.name+NL;
    case NODE_TYPES.FEATURE:
      line=sp()+'$'+model.name+'?'+NL;
      model.vals.forEach(function (v) {
        line += printModel(v,indent+2);
      }); 
      return line;
    case NODE_TYPES.FEATURE_VALUE: 
      line=sp()+'=['+(model.val-model.eps)+','+(model.val+model.eps)+']'+NL;
      return line+printModel(model.child,indent+2); 
  }
  return 'model?';
}


that = module.exports = {
  create: function (options) {
    return createTree(options.data,
                      options.target,
                      options.features,
                      options.eps)
  },
  depth:depth,
  ml:{},
  predict:function (model,sample) {
    return predictEps(model,sample,1,model.eps)
  },
  print:printModel,
}
};
BundleModuleCode['ml/dti']=function (module,exports,global,process){
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
 **    $CREATED:     03-03-16 by sbosse.
 **    $VERSION:     1.4.2
 **
 **    $INFO:
 **
 ** Interval Decision Tree Learner
 **
 ** Modified ID3-based Decision Tree Algorithm that wraps all data with 2-eps intervals and uses
 ** interval instead single value arithmetic for entropy calculation and feature selection.
 ** The classification bases on a nearest-neighbourhood look-up of best matching results.
 **
 ** Two different algorithms are supported:
 **
 **   1. Static (using learn), the DTI learner using attribute selection based on entropy.
 **      The training data must be available in advance.
 **   2. Dynamic (using update), the DTI learrner using attribute selection based on significance.
 **      The training data is applied sequentielly (stream learning) updating the model.
 **
 **   Though in principle the both algrotihms can be mixed (first static, then dynamic updating), 
 **   the resulting model will have poor classification quality. Either use static or only dynamic
 **   (stream) learning.
 **   
 ** Portable model
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;
var min = Comp.pervasives.min;
var max = Comp.pervasives.max;

/**
 * Map of valid tree node types
 * @constant
 * @static
 */
var NODE_TYPES = {
  RESULT: 'result',
  FEATURE: 'feature',
  FEATURE_VALUE: 'feature_value'
};


function Result(key) {
  return {
    type:NODE_TYPES.RESULT,
    name:key
  }
}

function Feature(name,vals) {
  return {
    type:NODE_TYPES.FEATURE,
    name:name,
    vals:vals
  }
}

// A value can be a scalar or a range {a,b} object
function Value(val,child) {
  return {
    type:NODE_TYPES.FEATURE_VALUE,
    val:val,
    child:child
  }
}

/** Add a new training set with optional data set merging and value interval expansion.
 * 
 */
function add_training_set(data,set,merge) {
  if (merge) {
    // Merge a data set with an existing for a specific key; create value ranges
  } else
    data.push(set);  
} 


/**
 * Computes Log with base-2
 * @private
 */
function log2(n) {
  return Math.log(n) / Math.log(2);
}




function results(model) {
  var line='',sep;
  if (!model) return '';
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return model.name;
    case NODE_TYPES.FEATURE:
      sep='';
      line='';
      Comp.array.iter(model.vals,function (v) {
        line += sep+results(v);
        sep=',';
      }); 
      return line;
    case NODE_TYPES.FEATURE_VALUE: 
      return results(model.child);   
  }
  return 'result?';
}


/**
 * Finds element with highest occurrence in a list
 * @private
 */
function mostCommon(list) {
  var elementFrequencyMap = {};
  var largestFrequency = -1;
  var mostCommonElement = null;

  list.forEach(function(element) {
    var elementFrequency = (elementFrequencyMap[element] || 0) + 1;
    elementFrequencyMap[element] = elementFrequency;

    if (largestFrequency < elementFrequency) {
      mostCommonElement = element;
      largestFrequency = elementFrequency;
    }
  });

  return mostCommonElement;
}

function addVal(v1,v2) {
  if (v1.a!=undefined) {
    if (v2.a!=undefined) return {a:v1.a+v2.a,b:v1.b+v2.b};
    else return {a:v1.a+v2,b:v2.b+v2};
  } else if (v2.a!=undefined) return {a:v2.a+v1,b:v2.b+v1};
  else return v1+v2;
}

function lowerBound(v) {
  if (v.a==undefined) return v; else return v.a;
}

function upperBound(v) {
  if (v.b==undefined) return v; else return v.b;
}

function equal(v1,v2) {
  return (v1==v2 ||
          (upperBound(v1) == upperBound(v2) &&
          (lowerBound(v1) == lowerBound(v2))))
}

function overlap(v1,v2) {
  return (upperBound(v1) >= lowerBound(v2) && upperBound(v1) <= upperBound(v2)) ||
         (upperBound(v2) >= lowerBound(v1) && upperBound(v2) <= upperBound(v1))
}

function containsVal(vl,v) {
  for (var i in vl) {
    var v2=vl[i];
    if (overlap(v,v2)) return true;
  }
  return false;
}

function centerVal(v) {
  if (v.a==undefined) return v; else return (v.a+v.b)/2;
}

function distanceVal (v1,v2) {
  return Math.abs(centerVal(v1)-centerVal(v2));
}

function Bounds(vl,v) {
  if (vl.length==0) return {a:v,b:v};
  else if (v==undefined) return {a:Min(vl),b:Max(vl)};
  else return {a:Min([Min(vl),v]),b:Max([Max(vl),v])};
}

function Min(vals) {
  var min=none;
  Comp.array.iter(vals, function (val) {
    if (min==none) min=(val.a==undefined?val:val.a);
    else min=val.a==undefined?(val<min?val:min):(val.a<min?val.a:min);
  });
  return min;
}

function Max(vals) {
  var max=none;
  Comp.array.iter(vals,function (val) {
    if (max==none) max=(val.b==undefined?val:val.b);
    else max=(val.b==undefined?(val>max?val:max):(val.b>max?val.a:max));
  });
  return max;
}

// Return interval of a value x with a<=x_center-eps, b>=x_center+eps
function epsVal(x,eps) {
  if (x.a == undefined) return {a:x-eps,b:x+eps};
  else if ((x.b-x.a) < 2*eps) return {a:centerVal(x)-eps,b:centerVal(x)+eps}; 
  else return x;
}
/** Filter out unique values that are spaced at least by eps
 *
 */
function uniqueEps(data,eps) {
  var results=[];
  Comp.array.iter(data,function (x) {
    var found;
    if (!results.length) results.push(x);
    else {
      Comp.array.iter(results,function (y,i) {
        if (found) return;
        found = Math.abs(centerVal(x)-centerVal(y))<eps;
        if (found) // create new overlapping value with +-eps extensions 
          results[i]={a:Min([x,y])-eps,b:Max([x,y])+eps}
      }); 
      if (!found) results.push(x);
    }
  });
  return results;
}

/** Compact tree, merge nodes and intervals.
 ** adjust=true: Adjust overlapping feature variable value intervals!!!
 */

function compactTree(model,adjust) {
  var i,j,vi,vj,_vals,merged;
  function target(model) {
    var line;
    switch (model.type) {
      case NODE_TYPES.RESULT: 
        return model.name;
      case NODE_TYPES.FEATURE:      
        line = model.name+'?'+target;
        Comp.array.iter(model.vals,function (v) {
          line += target(v);
        }); 
        return line;  
      case NODE_TYPES.FEATURE_VALUE: 
        line='='+(model.val.a==undefined?model.val:'['+model.val.a+','+model.val.b+']')+NL;
        return line+target(model.child); 
    }
  }
  if (!model) return model;
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return model;
      break;
    case NODE_TYPES.FEATURE:
      _vals=[];
      // 1. Merge
      for (i in model.vals) {
        vi=model.vals[i];
        assert((vi.type==NODE_TYPES.FEATURE_VALUE)||'vi.type==NODE_TYPES.FEATURE_VALUE');
        merged=false;
        loopj: for(j in _vals) {
          vj=_vals[j];
          if (target(vi.child)==target(vj.child)) {
            merged=true;
            vj.val={a:Min([vi.val,vj.val]),b:Max([vi.val,vj.val])}
            break loopj;
          }
        }
        if (!merged) {
          _vals.push(vi);
          vi.child=compactTree(vi.child);
        }
      }
      // 2. Adjust overlapping value intervals!
      if (adjust) {
        // TODO: approach too simple!!!! 
        for (i in _vals) {
          i=Comp.pervasives.int_of_string(i);
          if (_vals[i+1]) {
            if (upperBound(_vals[i].val) > lowerBound(_vals[i+1].val)) {
              if (_vals[i].val.b) _vals[i].val.b=lowerBound(_vals[i+1].val)-1;
              else _vals[i+1].val.a=upperBound(_vals[i].val)+1;
            }
          }
        }
      }
      
      model.vals=_vals;
      return model;
      break;
    case NODE_TYPES.FEATURE_VALUE:
      return model;
      break;
  }
}



/** Creates a new tree from training data (data)
 *
 *  data is {x1:v1,x2:v2,..,y:vn} []
 *  target is classification key name
 *  features is ['x1','x2,',..]  w/o target variable
 *  eps is interval applied to all data values
 *
 */
function createTree(data, target, features, options) {
  var _newS,child_node,bounds;
      
  var targets = Comp.array.unique(Comp.array.pluck(data, target));
  // console.log(targets)  
  if (options.maxdepth==undefined) options.maxdepth=1;
  if (options.maxdepth==0) return Result('-');
  // console.log(data);
  // console.log(features);

  //Aios.aios.log('createTree:'+targets.length);
  //try {Aios.aios.CP();} catch (e) {throw 'DTI.createTree: '+options.maxdepth };
  if (Aios) Aios.aios.CP();
  if (targets.length == 1) return Result(targets[0]);

  if (features.length == 0) {
    var topTarget = mostCommon(targets);
    return Result(topTarget)
  }
  var bestFeatures = getBestFeatures(data, target, features, options.eps);
  var bestFeature = bestFeatures[0];

  var remainingFeatures = Comp.array.filtermap(bestFeatures,function (feat) {
    if (feat.name!=bestFeature.name) return feat.name;
    else return none;
  });
/*  
  var possibleValues = Comp.array.sort(Comp.array.pluck(data, bestFeature.name), function (x,y) {
    if (upperBound(x) < lowerBound(y)) return -1; else return 1; // increasing value order
  });
*/
  var possibleValues = getPossibleVals(data,bestFeature.name);
  
  var vals=[];
  
  //console.log(bestFeatures);
  //console.log(possibleValues);
  var partitions=partitionVals(possibleValues,options.eps);
  // Aios.aios.log(partitions);
  //console.log(bestFeatures);
  //console.log(possibleValues);
  if (partitions.length==1) {
    // no further 2*eps separation possible, find best feature by largest distance
    // resort best feature list with respect to value deviation
    bestFeatures.sort(function (ef1,ef2) {
      if (ef1.d > ef2.d) return -1; else return 1;
    });
    bestFeature = bestFeatures[0];
    possibleValues = getPossibleVals(data,bestFeature.name);
    Comp.array.iter(mergeVals(possibleValues),function (val,i) {

      _newS = data.filter(function(x) {
        // console.log(x[bestFeature.name],val,overlap(val,x[bestFeature.name]))
        
        return overlap(val,x[bestFeature.name]);
      });
      child_node = Value(val);
      options.maxdepth--;
      child_node.child = createTree(_newS, target, remainingFeatures, options);
      //console.log(_newS);
      vals.push(child_node);
    })    
    
  } else Comp.array.iter(partitions,function (partition,i) {
    
    _newS = data.filter(function(x) {
      // console.log(x[bestFeature.name],v,overlap(x[bestFeature.name],v))
      return containsVal(partition,x[bestFeature.name]);
    });
    bounds = Bounds(partition);
    child_node = Value(options.eps==0?{a:bounds.a,b:bounds.b}:{a:bounds.a-options.eps,b:bounds.b+options.eps});
      options.maxdepth--;
    child_node.child = createTree(_newS, target, remainingFeatures, options);
    //console.log(_newS);
    vals.push(child_node);
  });
  
  return Feature(bestFeature.name,vals);
}

/** Return the depth of the tree
 *
 */
function depth(model) {
  switch (model.type) {
    case NODE_TYPES.RESULT: return 0;
    case NODE_TYPES.FEATURE: 
      return 1+Comp.array.max(model.vals,function (val) {
        return depth(val);
      });
    case NODE_TYPES.FEATURE_VALUE: 
      return depth(model.child);   
  }
  return 0;
}

/** Computes entropy of a list with 2-epsilon intervals
 *
 */

function entropyEps(vals,eps) {
  // TODO: overlapping value intervals
  var uniqueVals = Comp.array.unique(vals);
  var probs = uniqueVals.map(function(x) {
    return probEps(x, vals, eps)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(function(a, b) {
    return a + b
  }, 0);
}

function entropyEps2(vals,eps) {
  // TODO: overlapping value intervals
  var uniqueVals = uniqueEps(vals,eps);
  var probs = uniqueVals.map(function(x) {
    return probEps2(x, vals, eps)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(function(a, b) {
    return a + b
  }, 0);
}


function getBestFeatures(data,target,features,eps) {
  var bestfeatures=[];
  function deviation(vals) {
    var n = vals.length;
    var mu=Comp.array.sum(vals,function (val) {
      return (lowerBound(val)+upperBound(val))/2;
    })/n;
    var dev=Comp.array.sum(vals,function (val) {
      return Math.pow(((lowerBound(val)+upperBound(val))/2)-mu,2);
    })/n;
    return dev;
  }
  for (var feature in features) {
    if (features[feature]==undefined) throw 'DTI.getBestFeatures: invalid feature vector';
    var vals=Comp.array.pluck(data, features[feature]).map(function (val) {return val==undefined?0:val});
    var e = entropyEps(vals,eps);
    var d = deviation(vals);
    var min = Min(vals);
    var max = Max(vals);
    bestfeatures.push({e:e,d:d,range:{a:min,b:max},name:features[feature]});
  }
  bestfeatures.sort(function (ef1,ef2) {
    if (ef1.e > ef2.e) return -1; else return 1;
  });
  return bestfeatures;
}

/** Find in one data set the most significant feature variable (i.e., with highest value)
 */
function getSignificantFeature(data,features) {
  var f,sig;
  for (f in features) {
    if (sig==undefined || sig.val < data[features[f]]) sig={name:features[f],val:data[features[f]]};
  }
  return sig;
}

function getPossibleVals(data,feature) {
  return Comp.array.sort(Comp.array.pluck(data, feature), function (x,y) {
    if (upperBound(x) < lowerBound(y)) return -1; else return 1; // increasing value order
  });
}

/** Merge values and intervals
 */
function mergeVals(vals) {
  var _vals,
      merged,i,j;
  for (i in vals) {
    var vi = vals[i];
    if (!_vals) _vals=[vi];
    else {
      // Find overlapping values and merge
      merged=false;
      loopj: for (j in _vals) {
        var vj = _vals[j];
        if (equal(vi,vj)) {
          merged=true;
          break loopj;          
        }
        else if (overlap(vi,vj)) {
          merged=true;
          _vals[j]={a:Min([vi,vj]),b:Max([vi,vj])};
          break loopj;
        }
      }
      if (!merged) _vals.push(vi);
    }
  }
  //Aios.aios.log(_vals);
  return _vals||[];
}

/**
 * Predicts class for sample
 */
function nearestVal(vals,sample,fun) {
  var best=none;
  for (var v in vals) {
    var d=fun?distanceVal(fun(vals[v]),sample):distanceVal(vals[v],sample);
    if (best==none) 
      best={v:vals[v],d:d};
    else if (best.d > d)
      best={v:vals[v],d:d};    
  }
  if (best) return best.v;
  else return none;
}


/** Parttition an ordered set of values
 *  Each partition of values has at least 2*eps distance to the next partition.
 *
 */
function partitionVals(vals,eps) {
  var last=none;
  var partitions=[];
  var partition=[];
  for(var i in vals) {
    var val0=vals[i];
    var val1=vals[i-1];

    if (val1==undefined) partition.push(val0);
    else if ( upperBound(val0) < upperBound(addVal(val1,2*eps))) partition.push(val0);    
    else {
      partitions.push(partition);
      partition=[val0];
    }
  }
  if (partition.length>0) partitions.push(partition);
  return partitions;
}

/** Make a predicition with sample data
 *
 */
function predict(model,sample) {
  var root = model;
  while (root && root.type !== NODE_TYPES.RESULT) {
    var attr = root.name;
    var sampleVal = sample[attr];
    var childNode = nearestVal(root.vals,sampleVal,function (node) {
      return node.val;
    });

    if (childNode){
      root = childNode.child;
    } else {
      root = none;
    }
  }
  if (root) return root.name||root.val;
  else return none;
};

/** Print the tree
 *
 */
function print(model,indent, compact) {
  var line='',sep;
  if (compact) return results(model);
  if (indent==undefined) indent=0;
  if (!model) return '';
  var sp = function () {return Comp.string.create(indent);};
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return sp()+'-> '+model.name+NL;
    case NODE_TYPES.FEATURE:
      line=sp()+'$'+model.name+'?'+NL;
      Comp.array.iter(model.vals,function (v) {
        line += print(v,indent+2);
      }); 
      return line;
    case NODE_TYPES.FEATURE_VALUE: 
      line=sp()+'='+(model.val.a==undefined?model.val:'['+model.val.a+','+model.val.b+']')+NL;
      return line+print(model.child,indent+2); 
  }
  return 'model?';
}

/**
 * Computes probability of of a given value existing in a given list
 * with additional 2*epsilon interval, only applicable to numerical values.
 */
function probEps(value, list, eps) {
  // TODO: ranges
  var occurrences = Comp.array.filter(list, function(element) {
    return (element >= (value-eps)) && (element <= (value+eps));
  });

  var numOccurrences = occurrences.length;
  var numElements = list.length;
  return numOccurrences / numElements;
}

function probEps2(value, list, eps) {
  // TODO: ranges
  var occurrences = Comp.array.filter(list, function(element) {
    return overlap(epsVal(value), epsVal(element));
  });

  var numOccurrences = occurrences.length;
  var numElements = list.length;
  return numOccurrences / numElements;
}

/** Incremental update of the model with new training set(s). Can be executed with an empty model.
 *  The current tree can be week for a new training set (new target).
 *  This can result in a classification of the new target with insignificant variables.
 *  Therefore, the last tree node must be exapnded with an additional strong (most significant)
 *  variable of the new data set (but it is still a heuristic for future updates). 
 */
function updateTree(model,data, target, features, options) {
  var eps = options.eps,
      maxdepth = options.maxdepth,
      verbose = options.verbose;
  var featuresINm={},   // All current tree feature variables and their value interval
      results=[],       // All current tree result leafs
      set,i,v,feature,remainingFeatures,exists,sigFeature;
  // 1. Analysis of existing model
 
  var analyze = function (model,feature) {
    var feature2;
    if (!model) return;
    switch (model.type) {
      case NODE_TYPES.RESULT:
        if (!Comp.array.contains(results,model.name)) results.push(model.name); 
        break;
      case NODE_TYPES.FEATURE:
        feature2={name:model.name};
        if (!featuresINm[model.name]) featuresINm[model.name]=feature2;
        Comp.array.iter(model.vals,function (v) { analyze(v,featuresINm[model.name]) });
        break;
      case NODE_TYPES.FEATURE_VALUE:
        if (!feature.val) feature.val={
          a:(model.val.a==undefined?model.val:model.val.a),
          b:(model.val.a==undefined?model.val:model.val.b)
        }; else {
          feature.val.a=min(feature.val.a,
                            (model.val.a==undefined?model.val:model.val.a));
          feature.val.b=max(feature.val.b,
                            (model.val.a==undefined?model.val:model.val.b));
        }                  
        analyze(model.child);
        break; 
    }   
  }

  
  analyze(model);
  // console.log(featuresINm);
  // console.log(results);
  
  exists=Comp.array.contains(results,data[target]);

  
  // 2a. Empty model, add first training set with two significant feature variable nodes
  function init(set) {
    set=data[i];
      sigFeature1=getSignificantFeature(set,features);
      remainingFeatures=Comp.array.filter(features,function (feat) {
        return sigFeature1.name!=feat;
      });
      sigFeature2=getSignificantFeature(set,remainingFeatures);

      featuresINm[sigFeature1.name]={name:sigFeature1.name,
                                    val:{a:sigFeature1.val-eps,b:sigFeature1.val+eps}};
      featuresINm[sigFeature2.name]={name:sigFeature2.name,
                                    val:{a:sigFeature2.val-eps,b:sigFeature2.val+eps}};
      results.push(set[target]);
      model=Feature(sigFeature1.name,[
                    Value({a:set[sigFeature1.name]-eps,b:set[sigFeature1.name]+eps},
                          Feature(sigFeature2.name,[
                                 Value({a:sigFeature2.val-eps,b:sigFeature2.val+eps},
                                       Result(set[target])) 
                                  ]))]);
      return model;
  }
  
  remainingFeatures=Comp.array.filter(features,function (feat) {
    return !featuresINm[feat];
  });
  
  // 2b. Update the tree with the new training set
  var update = function (model,set,feature) {
    var feature2,p;
    if (!model) return;
    switch (model.type) {
    
      case NODE_TYPES.RESULT:
        if (model.name != set[target] && verbose)
          console.log('Cannot insert new training set '+set[target]+' in tree. No more separating variables!');
        break;
        
      case NODE_TYPES.FEATURE:
        // console.log(set[target]+': '+ model.name+'='+set[model.name]);
        if (set[model.name]<(featuresINm[model.name].val.a-eps) ||
            set[model.name]>(featuresINm[model.name].val.b+eps)) {
          // add new training set; done
          // the current decision tree can  be week, thus add another strong variable node, too! 
          sigFeature=getSignificantFeature(set,remainingFeatures);
          featuresINm[sigFeature.name]={name:sigFeature.name,
                                        val:{a:sigFeature.val-eps,b:sigFeature.val+eps}};
          featuresINm[model.name].val.a=min(featuresINm[model.name].val.a,set[model.name]-eps);
          featuresINm[model.name].val.b=max(featuresINm[model.name].val.b,set[model.name]+eps);
          if (!Comp.array.contains(results,set[target])) results.push(set[target]);

          model.vals.push(Value({a:set[model.name]-eps,b:set[model.name]+eps},
                          Feature(sigFeature.name,[
                            Value({a:sigFeature.val-eps,b:sigFeature.val+eps},
                                  Result(set[target]))
                          ])));
          model.vals=Comp.array.sort(model.vals,function (v1,v2) {return (lowerBound(v1.val)<lowerBound(v2.val))?-1:1});  
        } else {
          // go deeper, but extend the interval of the best matching child node with new data variable
          Comp.array.iter_break(model.vals,function (fv) {
            // console.log(model.name,fv.val,overlap(fv.val,{a:set[model.name]-eps,b:set[model.name]+eps})) 
            if (overlap(fv.val,{a:set[model.name]-eps,b:set[model.name]+eps})) {
              fv.val.a=min(lowerBound(fv.val),set[model.name]-eps);
              fv.val.b=max(upperBound(fv.val),set[model.name]+eps);
              update(fv,set,model.name);
              return true;
            } else return false;
          });
        }
        break;
        
      case NODE_TYPES.FEATURE_VALUE:
        update(model.child,set);
        break; 
    }   
  }

  for (i in data) {
    set=data[i];
    if (model==undefined || model.type==undefined)
      model=init(set);
    else
      update(model,set);
  }
  return model;
}

module.exports =  {
  NODE_TYPES:NODE_TYPES,
  compactTree:compactTree,
  create:function (options) {
    // type options = {data number [][], target:string, features: string [], eps;number, maxdepth}
    return createTree(options.data,options.target,options.features,options)
  },
  depth:depth,
  entropy:entropyEps,
  evaluate:function evaluate(model,target,samples){},
  predict:predict,
  print:print,
  results:results,
  update:function (model,options) {
    // type options = {data number [][], target:string, features: string [], eps:number, maxdepth}
    return updateTree(model,options.data,options.target,options.features,options)
  },
  current:function (module) { current=module.current; Aios=module;}
};


};
BundleModuleCode['ml/knn']=function (module,exports,global,process){
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
 **    $AUTHORS:     Ankit Kuwadekar, Stefan Bosse
 **    $INITIAL:     (C) 2014, Ankit Kuwadekar
 **    $MODIFIED:    (C) 2006-2019 bLAB by sbosse
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 ** KNN: k-nearest-neighbour Algorithm
 ** A General purpose k-nearest neighbor classifier algorithm based on the 
 ** k-d tree Javascript library develop by Ubilabs.
 **
 ** Portable models (KNN/KNN2)
 **
 **    $ENDOFINFO
 */
var options = {
  version:'1.2.1'
}
var Comp = Require('com/compat');
var math = Require('ml/math');
var euclideanDistance = math.euclidean;

/*
 * Original code from:
 *
 * k-d Tree JavaScript - V 1.01
 *
 * https://github.com/ubilabs/kd-tree-javascript
 *
 * @author Mircea Pricop <pricop@ubilabs.net>, 2012
 * @author Martin Kleppe <kleppe@ubilabs.net>, 2012
 * @author Ubilabs http://ubilabs.net, 2012
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */

function Node(obj, dimension, parent) {
    var N = {}
    N.obj = obj;
    N.left = null;
    N.right = null;
    N.parent = parent;
    N.dimension = dimension;
    return N;
}

/* KDTree
 *
 */

function KDTree(points, metric) {
    // if (!(this instanceof KDTree)) return new KDTree(points, metric);
    // If points is not an array, assume we're loading a pre-built tree
    var K ={}
    if (!Array.isArray(points)) {
        K.dimensions = points.dimensions;
        K.root = points;
        restoreParent(K.root);
    } else {
        K.dimensions = new Array(points[0].length);
        for (var i = 0; i < K.dimensions.length; i++) {
            K.dimensions[i] = i;
        }
        K.root = buildTree(points, 0, null, K.dimensions);
    }
    K.metric = metric;
    return K;
}

// Convert to a JSON serializable structure; this just requires removing
// the `parent` property
KDTree.code = {
  nearest : function(K, point, maxNodes, maxDistance) {
    var metric = K.metric;
    var dimensions = K.dimensions;
    var i;

    var bestNodes = BinaryHeap(
        function (e) {
            return -e[1];
        }
    );

    function nearestSearch(node) {
        var dimension   = dimensions[node.dimension];
        var ownDistance = metric(point, node.obj);
        var linearPoint = {};
        var bestChild,
            linearDistance,
            otherChild,
            i;
        function saveNode(node, distance) {
            BinaryHeap.code.push(bestNodes,[node, distance]);
            if (BinaryHeap.code.size(bestNodes) > maxNodes) {
                BinaryHeap.code.pop(bestNodes);
            }
        }

        for (i = 0; i < dimensions.length; i += 1) {
            if (i === node.dimension) {
                linearPoint[dimensions[i]] = point[dimensions[i]];
            } else {
                linearPoint[dimensions[i]] = node.obj[dimensions[i]];
            }
        }

        linearDistance = metric(linearPoint, node.obj);
        if (node.right === null && node.left === null) {
            if (BinaryHeap.code.size(bestNodes) < maxNodes || ownDistance < BinaryHeap.code.peek(bestNodes)[1]) {
                saveNode(node, ownDistance);
            }
            return;
        }

        if (node.right === null) {
            bestChild = node.left;
        } else if (node.left === null) {
            bestChild = node.right;
        } else {
            if (point[dimension] < node.obj[dimension]) {
                bestChild = node.left;
            } else {
                bestChild = node.right;
            }
        }

        nearestSearch(bestChild);

        if (BinaryHeap.code.size(bestNodes) < maxNodes || ownDistance < BinaryHeap.code.peek(bestNodes)[1]) {
            saveNode(node, ownDistance);
        }

        if (BinaryHeap.code.size(bestNodes) < maxNodes || Math.abs(linearDistance) < BinaryHeap.code.peek(bestNodes)[1]) {
            if (bestChild === node.left) {
                otherChild = node.right;
            } else {
                otherChild = node.left;
            }
            if (otherChild !== null) {
                nearestSearch(otherChild);
            }
        }
    }

    if (maxDistance) {
        for (i = 0; i < maxNodes; i += 1) {
            BinaryHeap.code.push(bestNodes,[null, maxDistance]);
        }
    }

    if (K.root) {
        nearestSearch(K.root);
    }

    var result = [];
    for (i = 0; i < Math.min(maxNodes, bestNodes.content.length); i += 1) {
        if (bestNodes.content[i][0]) {
            result.push([bestNodes.content[i][0].obj, bestNodes.content[i][1]]);
        }
    }
    return result;
  }
}

function buildTree(points, depth, parent, dimensions) {
    var dim = depth % dimensions.length;

    if (points.length === 0) {
        return null;
    }
    if (points.length === 1) {
        return Node(points[0], dim, parent);
    }

    points.sort(function (a, b) { a[dimensions[dim]] - b[dimensions[dim]]});

    var median  = Math.floor(points.length / 2);
    var node    = Node(points[median], dim, parent);
    node.left   = buildTree(points.slice(0, median), depth + 1, node, dimensions);
    node.right  = buildTree(points.slice(median + 1), depth + 1, node, dimensions);

    return node;
}

function restoreParent(root) {
    if (root.left) {
        root.left.parent = root;
        restoreParent(root.left);
    }

    if (root.right) {
        root.right.parent = root;
        restoreParent(root.right);
    }
}
/** BinaryHeap
 *
 */
 
// Binary heap implementation from:
// http://eloquentjavascript.net/appendix2.html
function BinaryHeap (scoreFunction) {
  var B={}
    //if (!(this instanceof BinaryHeap)) return new BinaryHeap (scoreFunction);
  B.content = [];
  B.scoreFunction = scoreFunction;
  return B;
}


BinaryHeap.code = {
  push : function(B,element) {
    // Add the new element to the end of the array.
    B.content.push(element);
    // Allow it to bubble up.
    BinaryHeap.code.bubbleUp(B,B.content.length - 1);
  },
  pop : function(B) {
    // Store the first element so we can return it later.
    var result = B.content[0];
    // Get the element at the end of the array.
    var end = B.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (B.content.length > 0) {
        B.content[0] = end;
        BinaryHeap.code.sinkDown(B,0);
    }
    return result;
  },
  peek : function(B) {
    return B.content[0];
  },
  size : function(B) {
    return B.content.length;
  },
  bubbleUp : function(B,n) {
    // Fetch the element that has to be moved.
    var element = B.content[n];
    // When at 0, an element can not go up any further.
    while (n > 0) {
        // Compute the parent element's index, and fetch it.
        var parentN = Math.floor((n + 1) / 2) - 1;
        var parent = B.content[parentN];
        // Swap the elements if the parent is greater.
        if (B.scoreFunction(element) < B.scoreFunction(parent)) {
            B.content[parentN] = element;
            B.content[n] = parent;
            // Update 'n' to continue at the new position.
            n = parentN;
        } else { // Found a parent that is less, no need to move it further.
            break;
        }
    }
  },
  sinkDown : function(B,n) {
    // Look up the target element and its score.
    var length = B.content.length;
    var element = B.content[n];
    var elemScore = B.scoreFunction(element);

    while (true) {
        // Compute the indices of the child elements.
        var child2N = (n + 1) * 2;
        var child1N = child2N - 1;
        // This is used to store the new position of the element,
        // if any.
        var swap = null;
        // If the first child exists (is inside the array)...
        if (child1N < length) {
            // Look it up and compute its score.
            var child1 = B.content[child1N];
            var child1Score = B.scoreFunction(child1);
            // If the score is less than our element's, we need to swap.
            if (child1Score < elemScore) {
                swap = child1N;
            }
        }
        // Do the same checks for the other child.
        if (child2N < length) {
            var child2 = B.content[child2N];
            var child2Score = B.scoreFunction(child2);
            if (child2Score < (swap === null ? elemScore : child1Score)) {
                swap = child2N;
            }
        }

        // If the element needs to be moved, swap it, and continue.
        if (swap !== null) {
            B.content[n] = B.content[swap];
            B.content[swap] = element;
            n = swap;
        } else {
            // Otherwise, we are done.
            break;
        }
    }
  }
}

/** KNN
 *
 */

/**
 ** typeof @dataset = number [] []
 ** typeof @labels  = number []
 ** typeof @options = { distance?:function, k?:number }
 */
function KNN(dataset, labels, options) {
    var L = {}
    if (!options) options={};
    if (dataset === true) {
        var model = labels;
        L.kdTree = KDTree(model.kdTree, options);
        L.k = model.k;
        L.classes = new Set(model.classes);
        L.isEuclidean = model.isEuclidean;
        return L;
    }
    var classes = new Set(labels);

    var distance = getDistanceFunction(options.distance),
        k = options.k||classes.size + 1;

    var points = new Array(dataset.length);
    for (var i = 0; i < points.length; ++i) {
        points[i] = dataset[i].slice();
    }

    for (i = 0; i < labels.length; ++i) {
        points[i].push(labels[i]);
    }

    L.kdTree = KDTree(points, distance);
    L.k = k;
    L.distance = distance;
    L.classes = classes;
    L.isEuclidean = distance === euclideanDistance;
    return L;
}


/**
 * Predicts the output given the matrix to predict.
 * @param {Array} dataset
 * @return {Array} predictions
 */
KNN.code = {
  predict : function(L,dataset) {
    if (Array.isArray(dataset)) {
        if (typeof dataset[0] === 'number') {
            return getSinglePrediction(L, dataset);
        } else if (Array.isArray(dataset[0]) && typeof dataset[0][0] === 'number') {
            var predictions = new Array(dataset.length);
            for (var i = 0; i < dataset.length; i++) {
                predictions[i] = getSinglePrediction(L, dataset[i]);
            }
            return predictions;
        }
    }
    throw new TypeError('dataset to predict must be an array or a matrix');
  }
}

function getSinglePrediction(knn, currentCase) {
    var nearestPoints = KDTree.code.nearest(knn.kdTree, currentCase, knn.k);
    var pointsPerClass = {};
    var predictedClassMin = null;
    var predictedClassMax = null;
    var predictedClassDistance = 0;
    var maxPoints = -1;
    var minDistance = 1E30;
    
    var lastElement = nearestPoints[0][0].length - 1;
    //for (var element of knn.classes) {
    //    pointsPerClass[element] = 0;
    //}
    forof(knn.classes,function (element) {
      pointsPerClass[element] = 0;
    });
    for (var i = 0; i < nearestPoints.length; ++i) {
        var currentClass = nearestPoints[i][0][lastElement];
        var currentPoints = ++pointsPerClass[currentClass];
        // Either use majority of points matching a class or the nearest points
        if (currentPoints > maxPoints) {
            predictedClassMax = currentClass;
            predictedClassDistance = predictedClassDistance+nearestPoints[i][1];
            maxPoints = currentPoints;
        }
        if (nearestPoints[i][1] < minDistance) {
            predictedClassMin = currentClass;
            minDistance = nearestPoints[i][1];
        }
    }
    predictedClassDistance /= maxPoints;
    return maxPoints>2?predictedClassMax:predictedClassMin;
}



/** Create a simple KNN (2)
 *
 * typeof @options = {x:number [] [],y: number []}
 *
 */
var KNN2 = function (options) {
  var model={}
  // if (!(this instanceof KNN2)) return new KNN2(options);
  model.x       = options.x;
  model.y       = options.y;
  model.target  = options.y;
  model.k       = options.k || 3
  model.distance = getDistanceFunction(options.distance);
  model.weightf =  getWeightedFunction(options.weightf);
  return model
}

/** Make a prediction
 *  
 */
KNN2.code = {
  predict : function (model,data) {
    var x = data;
    var k = model.k;
    var weightf = model.weightf;
    var distance = model.distance;
    var distanceList = [];
    var i;
    for(i=0; i<model.x.length; i++)
        distanceList.push([distance(x,model.x[i]),i]);
    distanceList.sort(function(a,b) {return a[0]-b[0];});
    var avg = 0.0;
    var totalWeight = 0, weight;
    for(i=0; i<k; i++) {
        var dist = distanceList[i][0];
        var idx = distanceList[i][1];
        weight = weightf(dist);
        avg += weight * model.y[idx];
        totalWeight += weight;
    }

    avg /= totalWeight;
    return avg;
  }
}

function getWeightedFunction(options) {
    if(typeof options === 'undefined') {
        return function(x) {
            var sigma = 10.0;
            return Math.exp(-1.*x*x/(2*sigma*sigma));
        }
    } else if(typeof options === 'function') {
        return options;
    } else if(options === 'gaussian') {
        return function(x) {
            var sigma = options.sigma;
            return Math.exp(-1.*x*x/(2*sigma*sigma));
        }
    } else if(options === 'none') {
        return function(dist) {
            return 1.0;
        }
    }
}

function getDistanceFunction(options) {
    if(typeof options === 'undefined') {
        return math.euclidean;
    } else if (typeof options === 'function') {
        return options;
    } else if (options === 'euclidean') {
        return math.euclidean;
    } else if (options === 'pearson') {
        return math.pearson;
    } else 
        throw new TypeError('distance opions invalid: '+options);;      
}

module.exports={
  create    : KNN,
  predict   : KNN.code.predict,
  create2   : KNN2,
  predict2  : KNN2.code.predict,
}
};
BundleModuleCode['ml/math']=function (module,exports,global,process){
/**
 * Created by joonkukang on 2014. 1. 12..
 */
var m = module.exports;

m.randn = function() {
    // generate random guassian distribution number. (mean : 0, standard deviation : 1)
    var v1, v2, s;

    do {
        v1 = 2 * Math.random() - 1;   // -1.0 ~ 1.0 까지의 값
        v2 = 2 * Math.random() - 1;   // -1.0 ~ 1.0 까지의 값
        s = v1 * v1 + v2 * v2;
    } while (s >= 1 || s == 0);

    s = Math.sqrt( (-2 * Math.log(s)) / s );
    return v1 * s;
}

m.shape = function(mat) {
    var row = mat.length;
    var col = mat[0].length;
    return [row,col];
};

m.addVec = function(vec1, vec2) {
    if(vec1.length === vec2.length) {
        var result = [];
        var i;
        for(i=0;i<vec1.length;i++)
            result.push(vec1[i]+vec2[i]);
        return result;
    } else {
        throw new Error("Length Error : not same.")
    }
}

m.minusVec = function(vec1,vec2) {
    if(vec1.length === vec2.length) {
        var result = [];
        var i;
        for(i=0;i<vec1.length;i++)
            result.push(vec1[i]-vec2[i]);
        return result;
    } else {
        throw new Error("Length Error : not same.")
    }
};

m.addMatScalar = function(mat,scalar) {
    var row = m.shape(mat)[0];
    var col = m.shape(mat)[1];
    var i , j,result = [];
    for(i=0 ; i<row ; i++) {
        var rowVec = [];
        for(j=0 ; j<col ; j++) {
            rowVec.push(mat[i][j] + scalar);
        }
        result.push(rowVec);
    }
    return result;
}

m.addMatVec = function(mat,vec) {
    if(mat[0].length === vec.length) {
        var result = [];
        var i;
        for(i=0;i<mat.length;i++)
            result.push(m.addVec(mat[i],vec));
        return result;
    } else {
        throw new Error("Length Error : not same.")
    }
}

m.minusMatVec = function(mat,vec) {
    if(mat[0].length === vec.length) {
        var result = [];
        var i;
        for(i=0;i<mat.length;i++)
            result.push(m.minusVec(mat[i],vec));
        return result;
    } else {
        throw new Error("Length Error : not same.")
    }
}

m.addMat = function (mat1, mat2) {
    if ((mat1.length === mat2.length) && (mat1[0].length === mat2[0].length)) {
        var result = new Array(mat1.length);
        for (var i = 0; i < mat1.length; i++) {
            result[i] = new Array(mat1[i].length);
            for (var j = 0; j < mat1[i].length; j++) {
                result[i][j] = mat1[i][j] + mat2[i][j];
            }
        }
        return result;
    } else {
        throw new Error('Matrix mismatch.');
    }
};

m.minusMat = function(mat1, mat2) {
    if ((mat1.length === mat2.length) && (mat1[0].length === mat2[0].length)) {
        var result = new Array(mat1.length);
        for (var i = 0; i < mat1.length; i++) {
            result[i] = new Array(mat1[i].length);
            for (var j = 0; j < mat1[i].length; j++) {
                result[i][j] = mat1[i][j] - mat2[i][j];
            }
        }
        return result;
    } else {
        throw new Error('Matrix mismatch.');
    }
}

m.transpose = function (mat) {
    var result = new Array(mat[0].length);
    for (var i = 0; i < mat[0].length; i++) {
        result[i] = new Array(mat.length);
        for (var j = 0; j < mat.length; j++) {
            result[i][j] = mat[j][i];
        }
    }
    return result;
};

m.dotVec = function (vec1, vec2) {
    if (vec1.length === vec2.length) {
        var result = 0;
        for (var i = 0; i < vec1.length; i++) {
            result += vec1[i] * vec2[i];
        }
        return result;
    } else {
        throw new Error("Vector mismatch");
    }
};

m.outerVec = function (vec1,vec2) {
    var mat1 = m.transpose([vec1]);
    var mat2 = [vec2];
    return m.mulMat(mat1,mat2);
};

m.mulVecScalar = function(vec,scalar) {
    var i, result = [];
    for(i=0;i<vec.length;i++)
        result.push(vec[i]*scalar);
    return result;
};

m.mulMatScalar = function(mat,scalar) {
    var row = m.shape(mat)[0];
    var col = m.shape(mat)[1];
    var i , j,result = [];
    for(i=0 ; i<row ; i++) {
        var rowVec = [];
        for(j=0 ; j<col ; j++) {
            rowVec.push(mat[i][j] * scalar);
        }
        result.push(rowVec);
    }
    return result;
};

m.mulMatElementWise = function(mat1, mat2) {
    if (mat1.length === mat2.length && mat1[0].length === mat2[0].length) {
        var result = new Array(mat1.length);

        for (var x = 0; x < mat1.length; x++) {
            result[x] = new Array(mat1[0].length);
        }

        for (var i = 0; i < result.length; i++) {
            for (var j = 0; j < result[i].length; j++) {
                result[i][j] = mat1[i][j] * mat2[i][j]
            }
        }
        return result;
    } else {
        throw new Error("Matrix shape error : not same");
    }
};

m.mulMat = function (mat1, mat2) {
    if (mat1[0].length === mat2.length) {
        var result = new Array(mat1.length);

        for (var x = 0; x < mat1.length; x++) {
            result[x] = new Array(mat2[0].length);
        }


        var mat2_T = m.transpose(mat2);
        for (var i = 0; i < result.length; i++) {
            for (var j = 0; j < result[i].length; j++) {
                result[i][j] = m.dotVec(mat1[i],mat2_T[j]);
            }
        }
        return result;
    } else {
        throw new Error("Array mismatch");
    }
};

m.sumVec = function(vec) {
    var sum = 0;
    var i = vec.length;
    while (i--) {
        sum += vec[i];
    }
    return sum;
};

m.sumMat = function(mat) {
    var sum = 0;
    var i = mat.length;
    while (i--) {
        for(var j=0;j<mat[0].length;j++)
          sum += mat[i][j];
    }
    return sum;
};

m.sumMatAxis = function(mat,axis) {
    // default axis 0;
    // axis 0 : mean of col vector . axis 1 : mean of row vector
    if(axis === 1) {
        var row = m.shape(mat)[0];
        var i ;
        var result = [];
        for(i=0 ; i<row; i++)
            result.push(m.sumVec(mat[i]));
        return result;
    } else {
        mat_T = m.transpose(mat);
        return m.sumMatAxis(mat_T,1);
    }
};

m.meanVec = function(vec) {
    return 1. * m.sumVec(vec) / vec.length;
};

m.meanMat = function(mat) {
    var row = mat.length;
    var col = mat[0].length;
    return 1. * m.sumMat(mat) / (row * col);
};

m.meanMatAxis = function(mat,axis) {
    // default axis 0;
    // axis 0 : mean of col vector . axis 1 : mean of row vector
    if(axis === 1) {
        var row = m.shape(mat)[0];
        var i ;
        var result = [];
        for(i=0 ; i<row; i++)
            result.push(m.meanVec(mat[i]));
        return result;
    } else {
        mat_T = m.transpose(mat);
        return m.meanMatAxis(mat_T,1);
    }
};

m.squareVec = function(vec) {
    var squareVec = [];
    var i;
    for(i=0;i<vec.length;i++) {
        squareVec.push(vec[i]*vec[i]);
    }
    return squareVec;
};

m.squareMat = function(mat) {
    var squareMat = [];
    var i;
    for(i=0;i<mat.length;i++) {
        squareMat.push(m.squareVec(mat[i]));
    }
    return squareMat;
};

m.minVec = function(vec) {
    var min = vec[0];
    var i = vec.length;
    while (i--) {
        if (vec[i] < min)
            min = vec[i];
    }
    return min;
};

m.maxVec = function(vec) {
    var max = vec[0];
    var i = vec.length;
    while (i--) {
        if (vec[i] > max)
            max = vec[i];
    }
    return max;
}

m.minMat = function(mat) {
    var min = mat[0][0];
    var i = mat.length;
    while (i--) {
        for(var j=0;j<mat[0].length;j++) {
            if(mat[i][j] < min)
                min = mat[i][j];
        }
    }
    return min;
};

m.maxMat = function(mat) {
    var max = mat[0][0];
    var i = mat.length;
    while (i--) {
        for(var j=0;j<mat[0].length;j++) {
            if(mat[i][j] < max)
                max = mat[i][j];
        }
    }
    return max;
};

m.zeroVec = function(n) {
    var vec = [];
    while(vec.length < n)
        vec.push(0);
    return vec;
};

m.zeroMat = function(row,col) {
    var mat = [];
    while(mat.length < row)
        mat.push(m.zeroVec(col));
    return mat;
};

m.oneVec = function(n) {
    var vec = [];
    while(vec.length < n)
        vec.push(1);
    return vec;
};

m.oneMat = function(row,col) {
    var mat = [];
    while(mat.length < row)
        mat.push(m.oneVec(col));
    return mat;
};

m.randVec = function(n,lower,upper) {
    lower = (typeof lower !== 'undefined') ? lower : 0;
    upper = (typeof upper !== 'undefined') ? upper : 1;
    var vec = [];
    while(vec.length < n)
        vec.push(lower + (upper-lower) * Math.random());
    return vec;
};

m.randMat = function(row,col,lower,upper) {
    lower = (typeof lower !== 'undefined') ? lower : 0;
    upper = (typeof upper !== 'undefined') ? upper : 1;
    var mat = [];
    while(mat.length < row)
        mat.push(m.randVec(col,lower,upper));
    return mat;
};

m.randnVec = function(n,mean,sigma) {
    var vec = [];
    while(vec.length < n)
        vec.push(mean+sigma* m.randn());
    return vec;
};

m.randnMat = function(row,col,mean,sigma) {
    var mat = [];
    while(mat.length < row)
        mat.push(m.randnVec(col,mean,sigma));
    return mat;
};

m.identity = function (n) {
    var result = new Array(n);

    for (var i = 0; i < n ; i++) {
        result[i] = new Array(n);
        for (var j = 0; j < n; j++) {
            result[i][j] = (i === j) ? 1 : 0;
        }
    }

    return result;
};

m.sigmoid = function(x) {
    var sigmoid = (1. / (1 + Math.exp(-x)))
    if(sigmoid ==1) {
     //   console.warn("Something Wrong!! Sigmoid Function returns 1. Probably javascript float precision problem?\nSlightly Controlled value to 1 - 1e-14")
        sigmoid = 0.99999999999999; // Javascript Float Precision Problem.. This is a limit of javascript.
    } else if(sigmoid ==0) {
      //  console.warn("Something Wrong!! Sigmoid Function returns 0. Probably javascript float precision problem?\nSlightly Controlled value to 1e-14")
        sigmoid = 1e-14;
    }
    return sigmoid; // sigmoid cannot be 0 or 1;;
};

m.dSigmoid = function(x){
    a = m.sigmoid(x);
    return a * (1. - a);
};

m.probToBinaryMat = function(mat) {
    var row = m.shape(mat)[0];
    var col = m.shape(mat)[1];
    var i,j;
    var result = [];

    for(i=0;i<row;i++) {
        var rowVec = [];
        for(j=0;j<col;j++) {
            if(Math.random() < mat[i][j])
                rowVec.push(1);
            else
                rowVec.push(0);
        }
        result.push(rowVec);
    }
    return result;
};

m.activateVec = function(vec,activation) {
    var i, result = [];
    for(i=0;i<vec.length;i++)
        result.push(activation(vec[i]));
    return result;
};

m.activateMat = function(mat,activation) {
    var row = m.shape(mat)[0];
    var col = m.shape(mat)[1];
    var i, j,result = [];
    for(i=0;i<row;i++) {
        var rowVec = [];
        for(j=0;j<col;j++)
            rowVec.push(activation(mat[i][j]));
        result.push(rowVec);
    }
    return result;
};

m.activateTwoVec = function(vec1, vec2,activation) {
    if (vec1.length === vec2.length) {
        var result = new Array(vec1.length);
        for (var i = 0; i < result.length; i++) {
            result[i] = activation(vec1[i],vec2[i]);
        }
        return result;
    } else {
        throw new Error("Matrix shape error : not same");
    }
};

m.activateTwoMat = function(mat1, mat2,activation) {
    if (mat1.length === mat2.length && mat1[0].length === mat2[0].length) {
        var result = new Array(mat1.length);

        for (var x = 0; x < mat1.length; x++) {
            result[x] = new Array(mat1[0].length);
        }

        for (var i = 0; i < result.length; i++) {
            for (var j = 0; j < result[i].length; j++) {
                result[i][j] = activation(mat1[i][j],mat2[i][j]);
            }
        }
        return result;
    } else {
        throw new Error("Matrix shape error : not same");
    }
};

m.fillVec = function(n,value) {
    var vec = [];
    while(vec.length < n)
        vec.push(value);
    return vec;
};

m.fillMat = function(row,col,value) {
    var mat = [];
    while(mat.length < row) {
        var rowVec = [];
        while(rowVec.length < col)
            rowVec.push(value);
        mat.push(rowVec);
    }
    return mat;
};

m.softmaxVec = function(vec) {
    var max = m.maxVec(vec);
    var preSoftmaxVec = m.activateVec(vec,function(x) {return Math.exp(x - max);})
    return m.activateVec(preSoftmaxVec,function(x) {return x/ m.sumVec(preSoftmaxVec)})
};

m.softmaxMat = function(mat) {
    var result=[], i;
    for(i=0 ; i<mat.length ; i++)
        result.push(m.softmaxVec(mat[i]));
    return result;
};

m.randInt = function(min,max) {
  var rand = Math.random() * (max - min + 0.9999) + min
  return Math.floor(rand);
}

m.normalizeVec = function(vec) {
    var i;
    var newVec = [],tot = 0;
    for(i=0; i<vec.length; i++)
        tot += vec[i];
    for(i=0; i<vec.length;i++)
        newVec.push(1.*vec[i]/tot);
    return newVec;
};

m.euclidean = function(x1,x2) {
    var i;
    var distance = 0;
    for(i=0 ; i<x1.length; i++) {
        var dx = x1[i] - x2[i];
        distance += dx * dx;
    }
    return Math.sqrt(distance);
};

m.pearson = function(x, y)
{
    var xy = [];
    var x2 = [];
    var y2 = [];

    for(var i=0; i<x.length; i++)
    {
        xy.push(x[i] * y[i]);
        x2.push(x[i] * x[i]);
        y2.push(y[i] * y[i]);
    }

    var sum_x = 0;
    var sum_y = 0;
    var sum_xy = 0;
    var sum_x2 = 0;
    var sum_y2 = 0;

    for(var i=0; i<x.length; i++)
    {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += xy[i];
        sum_x2 += x2[i];
        sum_y2 += y2[i];
    }

    var step1 = (x.length * sum_xy) - (sum_x * sum_y);
    var step2 = (x.length * sum_x2) - (sum_x * sum_x);
    var step3 = (x.length * sum_y2) - (sum_y * sum_y);
    var step4 = Math.sqrt(step2 * step3);
    var answer = step1 / step4;

    return answer;
};

m.getNormVec = function(vec) {
    var i;
    var sqsum = 0;
    for(i=0; i<vec.length; i++)
        sqsum += vec[i] * vec[i];
    return Math.sqrt(sqsum);
}

m.gaussian = function(x, sigma) {
    sigma = sigma || 10.0;
    return Math.exp(-1.*x*x/(2*sigma*sigma));
}

m.meanVecs = function(vecs) {
    var sum = m.zeroVec(vecs[0].length);
    var i;
    for(i=0; i<vecs.length; i++)
        sum = m.addVec(sum,vecs[i]);
    return m.activateVec(sum,function(x) {return 1.*x/vecs.length;});
};

m.covarianceVecs = function(vecs) {
    var mat = m.zeroMat(vecs[0].length,vecs[0].length);
    var meanVec = m.meanVecs(vecs);
    var i;
    for(i=0; i<vecs.length; i++) {
        var a = m.minusVec(vecs[i],meanVec);
        mat = m.addMat(mat, m.mulMat(m.transpose([a]),[a]));
    }
    return m.activateMat(mat,function(x) { return 1.*x/(vecs.length-1);});
};

m.shuffle = function(arr){
    var o = [];
    for(var i=0;i<arr.length;i++)
        o.push(arr[i]); // deep copy
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

m.range = function(start, end, step) {
    var ret = [];
    if(typeof step === "undefined")
        step = 1;
    if(typeof end === "undefined") {
        end = start;
        start = 0;
    }
    for(var i=start;i<end;i+=step)
        ret.push(i);
    return ret;
};
// For CRBM
/*
m.phi = function(mat,vec,low,high) {
    var i;
    var result = [];
    for(i=0;i<mat.length;i++) {
        result.push(m.activateTwoVec(mat[i],vec,function(x,y){return low+(high-low)* m.sigmoid(x*y);}))
    }
    return result;
}
*/
};
BundleModuleCode['ml/kmeans']=function (module,exports,global,process){
/**
 * Created by joonkukang on 2014. 1. 16..
 */
var math = Require('ml/math')
var Kmeans = module.exports;

Kmeans.cluster = function(options) {
    var data = options['data'];
    var k = options['k'];
    var distance = getDistanceFunction(options['distance']);
    var epochs = options['epochs'];
    var init_using_data = options['init_using_data'];
    if(typeof init_using_data === "undefined");
        init_using_data = true;
    var means = getRandomMeans(data,k, init_using_data);

    var epoch, i, j, l;
    var clusters = [];
    for(i=0 ; i<k ; i++)
        clusters.push([]);

    for(epoch=0 ; epoch<epochs ; epoch++) {
        clusters = [];
        for(i=0 ; i<k ; i++)
            clusters.push([]);

        // Find which centroid is the closest for each row
        for(i=0 ; i<data.length ; i++) {
            var bestmatch = 0;
            for(j=0 ; j<k ; j++) {
                if(distance(means[j],data[i]) < distance(means[bestmatch],data[i])) bestmatch = j;
            }
            clusters[bestmatch].push(i);
        }

        // Move the centroids to the average of their members
        for(i=0 ; i<k ; i++) {
            var avgs = [];
            for(j=0 ; j<data[0].length ; j++)
                avgs.push(0.0);
            if(clusters[i].length > 0) {
                for(j=0 ; j<clusters[i].length ; j++) {
                    for(l=0 ; l<data[0].length ; l++) {
                        avgs[l] += data[clusters[i][j]][l];
                    }
                }
                for(j=0 ; j<data[0].length ; j++) {
                    avgs[j] /= clusters[i].length;
                }
                means[i] = avgs;
            }
        }
    }
    return {
        clusters : clusters,
        means : means
    };
}

var getRandomMeans = function(data,k, init_using_data) {
    var clusters = [];
    if(init_using_data) {
        var cluster_index = math.range(data.length);
        cluster_index = math.shuffle(cluster_index);
        for(i=0 ; i<k ; i++) {
            clusters.push(data[cluster_index[i]]);
        }
    } else {
        var i,j;
        var ranges = [];
        for(i=0 ; i<data[0].length ; i++) {
            var min = data[0][i] , max = data[0][i];
            for(j=0 ; j<data.length ; j++) {
                if(data[j][i] < min) min = data[j][i];
                if(data[j][i] > max) max = data[j][i];
            }
            ranges.push([min,max]);
        }
        for(i=0 ; i<k ; i++) {
            var cluster = [];
            for(j=0 ; j<data[0].length;j++) {
                cluster.push(Math.random() * (ranges[j][1] - ranges[j][0]) + ranges[j][0]);
            }
            clusters.push(cluster);
        }
    }
    return clusters;
}


function getDistanceFunction(options) {
    if(typeof options === 'undefined') {
        return math.euclidean;
    } else if (typeof options === 'function') {
        return options;
    } else if (options['type'] === 'euclidean') {
        return math.euclidean;
    } else if (options['type'] === 'pearson') {
        return math.pearson;
    }
}
};
BundleModuleCode['ml/svm']=function (module,exports,global,process){
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
 **    $AUTHORS:     joonkukang, Stefan Bosse
 **    $INITIAL:     (C) 2014, joonkukang
 **    $MODIFIED:    (C) 2006-2018 bLAB by sbosse
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 ** Support Vector Machine Algrotihm
 **
 ** 1. References : http://cs229.stanford.edu/materials/smo.pdf . simplified smo algorithm 
 ** 2. https://github.com/karpathy/svmjs
 ** 
 ** Portable model
 **
 **    $ENDOFINFO
 */

var math = Require('ml/math');

/**
 * type options = {x: number [] [], y: number []}
 */
var SVM = function (options) {
    var L = {};
    L.x = options.x;
    L.y = options.y;
    return L
};

SVM.code = {
  train : function (L,options) {
    var self = L;
    var C = options.C || 1.0;
    var tol = options.tol || 1e-4;
    var maxPasses = options.max_passes || 20;
    var alphatol = options.alpha_tol || 1e-5;

    L.options={kernel:options.kernel,iterations:maxPasses,alpha_tol:alphatol, C:C, tol:tol };
    self.kernel = getKernel(options.kernel);
    self.alphas = math.zeroVec(self.x.length);
    self.b = 0;
    var passes = 0, i;
    var count=0;
    while(passes < maxPasses) {
        var numChangedAlphas = 0;

        for(i=0; i<self.x.length; i++) {

            var E_i = SVM.code.f(self,self.x[i]) - self.y[i];

            if((self.y[i] * E_i < -tol && self.alphas[i] < C) || (self.y[i] * E_i > tol && self.alphas[i] >0)) {

                // Randomly selects j (i != j)
                var j = math.randInt(0,self.x.length-1);
                if(i==j) j = (j+1) % self.x.length;

                var E_j = SVM.code.f(self,self.x[j]) - self.y[j];
                var alpha_i_old = self.alphas[i], alpha_j_old = self.alphas[j];

                // Compute L,H
                var L,H;
                if(self.y[i] !== self.y[j]) {
                    L = Math.max(0, self.alphas[j] - self.alphas[i]);
                    H = Math.min(C, C + self.alphas[j] - self.alphas[i]);
                } else {
                    L = Math.max(0, self.alphas[j] + self.alphas[i] - C);
                    H = Math.min(C, self.alphas[j] + self.alphas[i]);
                }

                if(L === H)
                    continue;

                // Compute ETA
                var ETA = 2 * self.kernel(self.x[i],self.x[j]) - self.kernel(self.x[i],self.x[i]) - self.kernel(self.x[j],self.x[j]);
                if(ETA >= 0)
                    continue;

                // Clip new value to alpha_j
                self.alphas[j] -= 1.*self.y[j] * (E_i - E_j) / ETA;
                if(self.alphas[j] > H)
                    self.alphas[j] = H;
                else if(self.alphas[j] < L)
                    self.alphas[j] = L;

                if(Math.abs(self.alphas[j] - alpha_j_old) < alphatol)
                    continue;

                // Clip new value to alpha_i
                self.alphas[i] += self.y[i] * self.y[j] * (alpha_j_old - self.alphas[j]);

                // update b
                var b1 = self.b - E_i - self.y[i] * (self.alphas[i] - alpha_i_old) * self.kernel(self.x[i],self.x[i])
                                - self.y[j] * (self.alphas[j] - alpha_j_old) * self.kernel(self.x[i],self.x[j]);
                var b2 = self.b - E_j - self.y[i] * (self.alphas[i] - alpha_i_old) * self.kernel(self.x[i],self.x[j])
                                - self.y[j] * (self.alphas[j] - alpha_j_old) * self.kernel(self.x[j],self.x[j]);

                if(0 < self.alphas[i] && self.alphas[i] < C)
                    self.b = b1;
                else if(0 < self.alphas[j] && self.alphas[j] < C)
                    self.b = b2;
                else
                    self.b = (b1+b2)/2.0;

                numChangedAlphas ++ ;
            } // end-if
        } // end-for
        if(numChangedAlphas == 0)
            passes++;
        else
            passes = 0;
    }
  },
  
  predict : function(L,x) {
    var self = L;
    this.kernel = getKernel(L.options.kernel); // update kernel
    if(SVM.code.f(L,x) >= 0)
        return 1;
    else
        return -1;
  },

  f : function(L,x) {
    var self = L;
    var f = 0, j;
    for(j=0; j<self.x.length; j++)
        f += self.alphas[j] * self.y[j] * self.kernel(self.x[j],x);
    f += self.b;
    return f;
  }
}

function getKernel (options) {
    if(typeof options === 'undefined') {
        return function(x,y) {
            var sigma = 1.0;
            return Math.exp(-1.*Math.pow(math.getNormVec(math.minusVec(x,y)),2)/(2*sigma*sigma));
        }
    } else if (typeof options === 'function') {
        return options;
    } else if (options['type'] === 'gaussian') {
        return function(x,y) {
            var sigma = options['sigma'];
            return Math.exp(-1.*Math.pow(math.getNormVec(math.minusVec(x,y)),2)/(2*sigma*sigma));
        }
    } else if (options['type'] === 'linear') {
        return function(x,y) {
            return math.dotVec(x,y);
        }
    } else if (options['type'] === 'polynomial') {
        return function(x,y) {
            var c = options['c'];
            var d = options['d'];
            return Math.pow(math.dotVec(x,y) + c, d);
        }
    } else if (options['type'] === 'rbf') {
        return function(v1, v2) {
          var s=0;
          var sigma = options.sigma||options.rbfsigma || 0.5;
          for(var q=0;q<v1.length;q++) { s += (v1[q] - v2[q])*(v1[q] - v2[q]); } 
          return Math.exp(-s/(2.0*sigma*sigma));
        }
    }
}


var SVM2 = function (options) {
    var L = {};
    L.data = options.x;
    L.labels = options.y;
    L.threshold=checkOption(options.threshold,0);
    return L
};

SVM2.code = {

  // data is NxD array of floats. labels are 1 or -1.
  train: function(L, options) {
    var data = L.data,labels=L.labels;

    // parameters
    options = options || {};
    var C = options.C || 1.0; // C value. Decrease for more regularization
    var tol = options.tol || 1e-4; // numerical tolerance. Don't touch unless you're pro
    var alphatol = options.alphatol || options.alpha_tol || 1e-7; // non-support vectors for space and time efficiency are truncated. To guarantee correct result set this to 0 to do no truncating. If you want to increase efficiency, experiment with setting this little higher, up to maybe 1e-4 or so.
    var maxiter = options.maxiter || 10000; // max number of iterations
    var numpasses = options.numpasses || options.max_passes || 10; // how many passes over data with no change before we halt? Increase for more precision.

    // instantiate kernel according to options. kernel can be given as string or as a custom function
    var kernel = linearKernel;
    L.kernelType = "linear";
    L.options={kernel:options.kernel};
    if("kernel" in options) {
      if  (typeof options.kernel == 'object') {
        kernel = getKernel(options.kernel);
        L.kernelType=options.kernel.type;
        L.rbfSigma = options.kernel.sigma || options.kernel.rbfsigma;
      } else if (typeof options.kernel == 'function') {
        // assume kernel was specified as a function. Let's just use it
        L.kernelType = "custom";
        kernel = options.kernel;
      }
    }
    L.options.C=C;
    L.options.tol=tol;
    L.options.alphatol=alphatol;
    L.options.iterations=numpasses;
    
    // initializations
    L.kernel = kernel;
    L.N = data.length; var N = L.N;
    L.D = data[0].length; var D = L.D;
    L.alpha = zeros(N);
    L.b = 0.0;
    L.usew_ = false; // internal efficiency flag

    // Cache kernel computations to avoid expensive recomputation.
    // This could use too much memory if N is large.
    if (options.memoize) {
      L.kernelResults = new Array(N);
      for (var i=0;i<N;i++) {
        L.kernelResults[i] = new Array(N);
        for (var j=0;j<N;j++) {
          L.kernelResults[i][j] = kernel(data[i],data[j]);
        }
      }
    }

    // run SMO algorithm
    var iter = 0;
    var passes = 0;
    while(passes < numpasses && iter < maxiter) {

      var alphaChanged = 0;
      for(var i=0;i<N;i++) {

        var Ei= SVM2.code.marginOne(L, data[i]) - labels[i];
        if( (labels[i]*Ei < -tol && L.alpha[i] < C)
         || (labels[i]*Ei > tol && L.alpha[i] > 0) ){

          // alpha_i needs updating! Pick a j to update it with
          var j = i;
          while(j === i) j= randi(0, L.N);
          var Ej= SVM2.code.marginOne(L, data[j]) - labels[j];

          // calculate L and H bounds for j to ensure we're in [0 C]x[0 C] box
          ai= L.alpha[i];
          aj= L.alpha[j];
          var Lb = 0; var Hb = C;
          if(labels[i] === labels[j]) {
            Lb = Math.max(0, ai+aj-C);
            Hb = Math.min(C, ai+aj);
          } else {
            Lb = Math.max(0, aj-ai);
            Hb = Math.min(C, C+aj-ai);
          }

          if(Math.abs(Lb - Hb) < 1e-4) continue;

          var eta = 2*SVM2.code.kernelResult(L, i,j) - SVM2.code.kernelResult(L, i,i) - SVM2.code.kernelResult(L, j,j);
          if(eta >= 0) continue;

          // compute new alpha_j and clip it inside [0 C]x[0 C] box
          // then compute alpha_i based on it.
          var newaj = aj - labels[j]*(Ei-Ej) / eta;
          if(newaj>Hb) newaj = Hb;
          if(newaj<Lb) newaj = Lb;
          if(Math.abs(aj - newaj) < 1e-4) continue; 
          L.alpha[j] = newaj;
          var newai = ai + labels[i]*labels[j]*(aj - newaj);
          L.alpha[i] = newai;

          // update the bias term
          var b1 = L.b - Ei - labels[i]*(newai-ai)*SVM2.code.kernelResult(L, i,i)
                   - labels[j]*(newaj-aj)*SVM2.code.kernelResult(L, i,j);
          var b2 = L.b - Ej - labels[i]*(newai-ai)*SVM2.code.kernelResult(L, i,j)
                   - labels[j]*(newaj-aj)*SVM2.code.kernelResult(L, j,j);
          L.b = 0.5*(b1+b2);
          if(newai > 0 && newai < C) L.b= b1;
          if(newaj > 0 && newaj < C) L.b= b2;

          alphaChanged++;

        } // end alpha_i needed updating
      } // end for i=1..N

      iter++;
      //console.log("iter number %d, alphaChanged = %d", iter, alphaChanged);
      if(alphaChanged == 0) passes++;
      else passes= 0;

    } // end outer loop

    // if the user was using a linear kernel, lets also compute and store the
    // weights. This will speed up evaluations during testing time
    if(L.kernelType === "linear") {

      // compute weights and store them
      L.w = new Array(L.D);
      for(var j=0;j<L.D;j++) {
        var s= 0.0;
        for(var i=0;i<L.N;i++) {
          s+= L.alpha[i] * labels[i] * data[i][j];
        }
        L.w[j] = s;
        L.usew_ = true;
      }
    } else {

      // okay, we need to retain all the support vectors in the training data,
      // we can't just get away with computing the weights and throwing it out

      // But! We only need to store the support vectors for evaluation of testing
      // instances. So filter here based on L.alpha[i]. The training data
      // for which L.alpha[i] = 0 is irrelevant for future. 
      var newdata = [];
      var newlabels = [];
      var newalpha = [];
      for(var i=0;i<L.N;i++) {
        //console.log("alpha=%f", L.alpha[i]);
        if(L.alpha[i] > alphatol) {
          newdata.push(L.data[i]);
          newlabels.push(L.labels[i]);
          newalpha.push(L.alpha[i]);
        }
      }

      // store data and labels
      L.data = newdata;
      L.labels = newlabels;
      L.alpha = newalpha;
      L.N = L.data.length;
      // console.log("filtered training data from %d to %d support vectors.", data.length, L.data.length);
    }

    var trainstats = {};
    trainstats.iters= iter;
    trainstats.passes= passes;
    return trainstats;
  }, 

  // inst is an array of length D. Returns margin of given example
  // this is the core prediction function. All others are for convenience mostly
  // and end up calling this one somehow.
  marginOne: function(L,inst) {

    var f = L.b;
    // if the linear kernel was used and w was computed and stored,
    // (i.e. the svm has fully finished training)
    // the internal class variable usew_ will be set to true.
    if(L.usew_) {

      // we can speed this up a lot by using the computed weights
      // we computed these during train(). This is significantly faster
      // than the version below
      for(var j=0;j<L.D;j++) {
        f += inst[j] * L.w[j];
      }

    } else {

      for(var i=0;i<L.N;i++) {
        f += L.alpha[i] * L.labels[i] * L.kernel(inst, L.data[i]);
      }
    }
    return f;
  },

  predict: function(L,inst) { 
    L.kernel=getKernel(L.options.kernel); // update kernel
    var result = SVM2.code.marginOne(L,inst);
    if (L.threshold===false) return result;
    else return  result > L.threshold ? 1 : -1; 
  },

  // data is an NxD array. Returns array of margins.
  margins: function(L,data) {

    // go over support vectors and accumulate the prediction. 
    var N = data.length;
    var margins = new Array(N);
    for(var i=0;i<N;i++) {
      margins[i] = SVM2.code.marginOne(L,data[i]);
    }
    return margins;

  },

  kernelResult: function(L, i, j) {
    if (L.kernelResults) {
      return L.kernelResults[i][j];
    }
    return L.kernel(L.data[i], L.data[j]);
  },

  // data is NxD array. Returns array of 1 or -1, predictions
  predictN: function(L,data) {
    L.kernel=getKernel(L.options.kernel); // update kernel
    var margs = SVM2.code.margins(L, data);
    for(var i=0;i<margs.length;i++) {
      if (L.threshold!=false)
        margs[i] = margs[i] > L.threshold ? 1 : -1;
    }
    return margs;
  },

  // THIS FUNCTION IS NOW DEPRECATED. WORKS FINE BUT NO NEED TO USE ANYMORE. 
  // LEAVING IT HERE JUST FOR BACKWARDS COMPATIBILITY FOR A WHILE.
  // if we trained a linear svm, it is possible to calculate just the weights and the offset
  // prediction is then yhat = sign(X * w + b)
  getWeights: function(L) {

    // DEPRECATED
    var w= new Array(L.D);
    for(var j=0;j<L.D;j++) {
      var s= 0.0;
      for(var i=0;i<L.N;i++) {
        s+= L.alpha[i] * L.labels[i] * L.data[i][j];
      }
      w[j]= s;
    }
    return {w: w, b: L.b};
  },

  toJSON: function(L) {

    if(L.kernelType === "custom") {
      console.log("Can't save this SVM because it's using custom, unsupported kernel...");
      return {};
    }

    json = {}
    json.N = L.N;
    json.D = L.D;
    json.b = L.b;

    json.kernelType = L.kernelType;
    if(L.kernelType === "linear") { 
      // just back up the weights
      json.w = L.w; 
    }
    if(L.kernelType === "rbf") { 
      // we need to store the support vectors and the sigma
      json.rbfSigma = L.rbfSigma; 
      json.data = L.data;
      json.labels = L.labels;
      json.alpha = L.alpha;
    }

    return json;
  },

  fromJSON: function(L,json) {

    this.N = json.N;
    this.D = json.D;
    this.b = json.b;

    this.kernelType = json.kernelType;
    if(this.kernelType === "linear") { 

      // load the weights! 
      this.w = json.w; 
      this.usew_ = true; 
      this.kernel = linearKernel; // this shouldn't be necessary
    }
    else if(this.kernelType == "rbf") {

      // initialize the kernel
      this.rbfSigma = json.rbfSigma; 
      this.kernel = makeRbfKernel(this.rbfSigma);

      // load the support vectors
      this.data = json.data;
      this.labels = json.labels;
      this.alpha = json.alpha;
    } else {
      console.log("ERROR! unrecognized kernel type." + this.kernelType);
    }
  }
}

// Kernels
function makeRbfKernel(sigma) {
  return function(v1, v2) {
    var s=0;
    for(var q=0;q<v1.length;q++) { s += (v1[q] - v2[q])*(v1[q] - v2[q]); } 
    return Math.exp(-s/(2.0*sigma*sigma));
  }
}

function linearKernel(v1, v2) {
  var s=0; 
  for(var q=0;q<v1.length;q++) { s += v1[q] * v2[q]; } 
  return s;
}

// Misc utility functions
// generate random floating point number between a and b
function randf(a, b) {
  return Math.random()*(b-a)+a;
}

// generate random integer between a and b (b excluded)
function randi(a, b) {
   return Math.floor(Math.random()*(b-a)+a);
}

// create vector of zeros of length n
function zeros(n) {
  var arr= new Array(n);
  for(var i=0;i<n;i++) { arr[i]= 0; }
  return arr;
}

module.exports = SVM2
};
BundleModuleCode['ml/mlp']=function (module,exports,global,process){
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
 **    $AUTHORS:     joonkukang, Stefan Bosse
 **    $INITIAL:     (C) 2014, joonkukang
 **    $MODIFIED:    (C) 2006-2018 bLAB by sbosse
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 ** Multilayer Perceptron Artificial Neural Network
 **
 ** References : http://cs229.stanford.edu/materials/smo.pdf . simplified smo algorithm 
 **
 ** Portable model
 **
 **    $ENDOFINFO
 */
/**
 */
var math = Require('ml/math');
var HiddenLayer = Require('ml/HiddenLayer');

var MLP = function (settings) {
    var L = {}
    var self = L;
    self.x = settings.input;
    self.y = settings.label;
    self.sigmoidLayers = [];
    self.nLayers = settings.hidden_layer_sizes.length;
    self.settings = {
        'log level' : 1, // 0 : nothing, 1 : info, 2: warn
        hidden_layers : settings.hidden_layer_sizes
    };
    var i;
    for(i=0 ; i<self.nLayers+1 ; i++) {
        var inputSize, layerInput;
        if(i == 0)
            inputSize = settings.n_ins;
        else
            inputSize = settings.hidden_layer_sizes[i-1];

        if(i == 0)
            layerInput = self.x;
        else
            layerInput = HiddenLayer.code.sampleHgivenV(self.sigmoidLayers[self.sigmoidLayers.length-1]);

        var sigmoidLayer;
        if(i == self.nLayers) {
            sigmoidLayer = HiddenLayer({
                'input' : layerInput,
                'n_in' : inputSize,
                'n_out' : settings.n_outs,
                'activation' : math.sigmoid,
                'W' : (typeof settings.w_array === 'undefined')? undefined : settings.w_array[i],
                'b' : (typeof settings.b_array === 'undefined')? undefined : settings.b_array[i]
            });
        } else {
            sigmoidLayer = HiddenLayer({
                'input' : layerInput,
                'n_in' : inputSize,
                'n_out' : settings.hidden_layer_sizes[i],
                'activation' : math.sigmoid,
                'W' : (typeof settings.w_array === 'undefined')? undefined : settings.w_array[i],
                'b' : (typeof settings.b_array === 'undefined')? undefined : settings.b_array[i]
            });
        }
        self.sigmoidLayers.push(sigmoidLayer);
    }
    return L
};

MLP.code = {
  train : function(L,settings) {
    var self = L;
    var epochs = 1000;
    if(typeof settings.epochs !== 'undefined')
        epochs = settings.epochs;
    self.settings.iterations=epochs;
    
    var epoch;
    var currentProgress = 1;
    for(epoch=0 ; epoch < epochs ; epoch++) {

        // Feed Forward
        var i;
        var layerInput = [];
        layerInput.push(self.x);
        for(i=0; i<self.nLayers+1 ; i++) {
            layerInput.push(HiddenLayer.code.output(self.sigmoidLayers[i],layerInput[i]));
        }
        var output = layerInput[self.nLayers+1];
        // Back Propagation
        var delta = new Array(self.nLayers + 1);
        delta[self.nLayers] = math.mulMatElementWise(math.minusMat(self.y, output),
            math.activateMat(HiddenLayer.code.linearOutput(self.sigmoidLayers[self.nLayers],layerInput[self.nLayers]), math.dSigmoid));

        /*
         self.nLayers = 3 (3 hidden layers)
         delta[3] : ouput layer
         delta[2] : 3rd hidden layer, delta[0] : 1st hidden layer
         */
        for(i = self.nLayers - 1; i>=0 ; i--) {
            delta[i] = math.mulMatElementWise(HiddenLayer.code.backPropagate(self.sigmoidLayers[i+1],delta[i+1]),
                math.activateMat(HiddenLayer.code.linearOutput(self.sigmoidLayers[i],layerInput[i]), math.dSigmoid));
        }
        // Update Weight, Bias
        for(var i=0; i<self.nLayers+1 ; i++) {
            var deltaW = math.activateMat(math.mulMat(math.transpose(layerInput[i]),delta[i]),function(x){return 1. * x / self.x.length;})
            var deltaB = math.meanMatAxis(delta[i],0);
            self.sigmoidLayers[i].W = math.addMat(self.sigmoidLayers[i].W,deltaW);
            self.sigmoidLayers[i].b = math.addVec(self.sigmoidLayers[i].b,deltaB);
        }

        if(self.settings['log level'] > 0) {
            var progress = (1.*epoch/epochs)*100;
            if(progress > currentProgress) {
                console.log("MLP",progress.toFixed(0),"% Completed.");
                currentProgress+=8;
            }
        }
    }
    if(self.settings['log level'] > 0)
        console.log("MLP Final Cross Entropy : ",self.getReconstructionCrossEntropy());
  },
  getReconstructionCrossEntropy : function(L) {
    var self = L;
    var reconstructedOutput = self.predict(self.x);
    var a = math.activateTwoMat(self.y,reconstructedOutput,function(x,y){
        return x*Math.log(y);
    });

    var b = math.activateTwoMat(self.y,reconstructedOutput,function(x,y){
        return (1-x)*Math.log(1-y);
    });

    var crossEntropy = -math.meanVec(math.sumMatAxis(math.addMat(a,b),1));
    return crossEntropy
  },
  predict : function(L,x) {
    var self = L;
    var output = x;
    for(i=0; i<self.nLayers+1 ; i++) {
        output = HiddenLayer.code.output(self.sigmoidLayers[i],output);
    }
    return output;
  },
  set : function(L,property,value) {
    var self = L;
    self.settings[property] = value;
  }
}
module.exports = MLP
};
BundleModuleCode['ml/HiddenLayer']=function (module,exports,global,process){
/**
 * Created by joonkukang on 2014. 1. 12..
 */
var math = Require('ml/math');
var HiddenLayer = module.exports = function (settings) {
    var L = {}
    var self = L;
    self.input = settings['input'];

    if(typeof settings['W'] === 'undefined') {
        var a = 1. / settings['n_in'];
        settings['W'] = math.randMat(settings['n_in'],settings['n_out'],-a,a);
    }
    if(typeof settings['b'] === 'undefined')
        settings['b'] = math.zeroVec(settings['n_out']);
    if(typeof settings['activation'] === 'undefined')
        settings['activation'] = math.sigmoid;

    self.W = settings['W'];
    self.b = settings['b'];
    self.activation = settings['activation'];
    return L;
}

HiddenLayer.code = {
  output : function(L,input) {
    var self = L;
    if(typeof input !== 'undefined')
        self.input = input;

    var linearOutput = math.addMatVec(math.mulMat(self.input,self.W),self.b);
    return math.activateMat(linearOutput,self.activation);
  },
  linearOutput : function(L,input) { // returns the value before activation.
    var self = L;
    if(typeof input !== 'undefined')
        self.input = input;

    var linearOutput = math.addMatVec(math.mulMat(self.input,self.W),self.b);
    return linearOutput;
  },
  backPropagate : function (L,input) { // example+num * n_out matrix
    var self = L;
    if(typeof input === 'undefined')
        throw new Error("No BackPropagation Input.")

    var linearOutput = math.mulMat(input, math.transpose(self.W));
    return linearOutput;
  },
  sampleHgivenV : function(L,input) {
    var self = L;
    if(typeof input !== 'undefined')
        self.input = input;

    var hMean = HiddenLayer.code.output(self);
    var hSample = math.probToBinaryMat(hMean);
    return hSample;
  }
}
};
BundleModuleCode['ml/id3']=function (module,exports,global,process){
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
 **    $AUTHORS:     Ankit Kuwadekar, Stefan Bosse
 **    $INITIAL:     (C) 2014, Ankit Kuwadekar
 **    $MODIFIED:    (C) 2006-2018 bLAB by sbosse
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 ** ID3 Decision Tree Algorithm supporting categorical values only
 ** Portable model
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;


/**
 * Map of valid tree node types
 * @constant
 * @static
 */
var NODE_TYPES = {
  RESULT: 'result',
  FEATURE: 'feature',
  FEATURE_VALUE: 'feature_value'
};

function isEqual(a,b) { return a==b }

/**
 * Predicts class for sample
 */
function predict(model,sample) {
  var root = model;
  while (root.type !== NODE_TYPES.RESULT) {
    var attr = root.name;
    var sampleVal = sample[attr];
    var childNode = Comp.array.find(root.vals, function(node) {
      return node.name == sampleVal
    });
    if (childNode){
      root = childNode.child;
    } else {
      root = root.vals[0].child;
    }
  }
  return root.val;
};

/**
 * Evalutes prediction accuracy on samples
 */
function evaluate(model,target,samples) {

   var total = 0;
   var correct = 0;

   Comp.array.iter(samples, function(s) {
     total++;
     var pred = predict(model,s);
     var actual = s[target];
     if (isEqual(pred,actual)) {
       correct++;
     }
   });

   return correct / total;
};

/**
 * Creates a new tree
 */
function createTree(data, target, features) {
  var targets = Comp.array.unique(Comp.array.pluck(data, target));
  
  if (targets.length == 1) {
    return {
      type: NODE_TYPES.RESULT,
      val: targets[0],
      name: targets[0],
      alias: targets[0] + randomUUID()
    };
  }

  if (features.length == 0) {
    var topTarget = mostCommon(targets);
    return {
      type: NODE_TYPES.RESULT,
      val: topTarget,
      name: topTarget,
      alias: topTarget + randomUUID()
    };
  }

  var bestFeature = maxGain(data, target, features);
  var remainingFeatures = Comp.array.without(features, bestFeature);
  var possibleValues = Comp.array.unique(Comp.array.pluck(data, bestFeature));

  var node = {
    name: bestFeature,
    alias: bestFeature + randomUUID()
  };

  node.type = NODE_TYPES.FEATURE;
  node.vals = Comp.array.map(possibleValues, function(v) {
    var _newS = data.filter(function(x) {
      return x[bestFeature] == v
    });

    var child_node = {
      name: v,
      alias: v + randomUUID(),
      type: NODE_TYPES.FEATURE_VALUE
    };

    child_node.child = createTree(_newS, target, remainingFeatures);
    return child_node;
  });

  return node;
}

/**
 * Computes Max gain across features to determine best split
 * @private
 */
function maxGain(data, target, features) {
  var gains=[];
  var maxgain= Comp.array.max(features, function(element) {
    var g = gain(data, target, element);
    gains.push(element+':'+g);
    return g;
  });
  return maxgain;
}

/**
 * Computes entropy of a list
 * @private
 */
function entropy(vals) {
  var uniqueVals = Comp.array.unique(vals);
  var probs = uniqueVals.map(function(x) {
    return prob(x, vals)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(function(a, b) {
    return a + b
  }, 0);
}

/**
 * Computes gain
 * @private
 */
function gain(data, target, feature) {
  var attrVals = Comp.array.unique(Comp.array.pluck(data, feature));
  var setEntropy = entropy(Comp.array.pluck(data, target));
  var setSize = data.length;

  var entropies = attrVals.map(function(n) {
    var subset = data.filter(function(x) {
      return x[feature] === n
    });

    return (subset.length / setSize) * entropy(Comp.array.pluck(subset, target));
  });

  // var entropyData = entropyV(Comp.array.pluck(data, feature),eps);
  // console.log('Feat '+feature+':'+entropyData);
  var sumOfEntropies = entropies.reduce(function(a, b) {
    return a + b
  }, 0);
  return setEntropy - sumOfEntropies;
}

/**
 * Computes probability of of a given value existing in a given list
 * @private
 */
function prob(value, list) {
  var occurrences = Comp.array.filter(list, function(element) {
    return element === value
  });

  var numOccurrences = occurrences.length;
  var numElements = list.length;
  return numOccurrences / numElements;
}

/**
 * Computes Log with base-2
 * @private
 */
function log2(n) {
  return Math.log(n) / Math.log(2);
}

/**
 * Finds element with highest occurrence in a list
 * @private
 */
function mostCommon(list) {
  var elementFrequencyMap = {};
  var largestFrequency = -1;
  var mostCommonElement = null;

  list.forEach(function(element) {
    var elementFrequency = (elementFrequencyMap[element] || 0) + 1;
    elementFrequencyMap[element] = elementFrequency;

    if (largestFrequency < elementFrequency) {
      mostCommonElement = element;
      largestFrequency = elementFrequency;
    }
  });

  return mostCommonElement;
}

/**
 * Generates random UUID
 * @private
 */
function randomUUID() {
  return "_r" + Math.random().toString(32).slice(2);
}

function depth(model) {
  switch (model.type) {
    case NODE_TYPES.RESULT: return 1;
    case NODE_TYPES.FEATURE: 
      return 1+Comp.array.max(model.vals,function (val) {
        return depth(val);
      });
    case NODE_TYPES.FEATURE_VALUE: 
      return 1+depth(model.child);   
  }
  return 0;
}

function print(model) {
  var line='',sep;
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return ' -> '+model.name;
    case NODE_TYPES.FEATURE:
      line='('+model.name+'?';
      sep='';
      Comp.array.iter(model.vals,function (v) {
        line += sep+print(v);
        sep=',';
      }); 
      return line+')';
    case NODE_TYPES.FEATURE_VALUE: 
      return ' '+model.name+':'+print(model.child);   
  }
  return 0;
}


module.exports =  {
  NODE_TYPES:NODE_TYPES,
  createTree:createTree,
  depth:depth,
  entropy:entropy,
  evaluate:evaluate,
  predict:predict,
  print:print,
  current:function (module) { current=module.current; Aios=module;}
};

};
BundleModuleCode['ml/C45']=function (module,exports,global,process){
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
 **    $AUTHORS:     ?, Stefan Bosse
 **    $INITIAL:     (C) ?
 **    $MODIFIED:    (C) 2006-2018 bLAB by sbosse
 **    $VERSION:     1.1.6
 **
 **    $INFO:
 **
 ** C45 Decision Tree ML Algorithm
 **
 ** Portable model
 **
 **    $ENDOFINFO
 */
'use strict';
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;

var NODE_TYPES = {
  RESULT: 'result',
  FEATURE_NUMBER: 'feature_number',     // Number value node (cut split)
  FEATURE_VALUE: 'feature_value',       // Category value
  FEATURE_CATEGORY: 'feature_category'  // Symbolic variable node (split)
};

function unique(col) {
  var u = {}, a = [];
  for(var i = 0, l = col.length; i < l; ++i){
    if(u.hasOwnProperty(col[i])) {
      continue;
    }
    a.push(col[i]);
    u[col[i]] = 1;
  }
  return a;
}

function find(col, pred) {
  var value;
  col.forEach(function(item) {
    var result = pred(item);
    if (result) {
      value = item;
    }
  });
  return value;
}

function max(array, fn) {
  var max = -Infinity;
  var index;
  for (var i = 0; i < array.length; i++) {
    var result = fn(array[i]);
    if (result >= max) {
      max = result;
      index = i;
    }
  }
  return typeof index !== 'undefined' ? array[index] : max;
}

function sortBy(col, fn) {
 col = [].slice.call(col);
 return col.sort(fn);
}

var C45 = {
  create: function () {
    return {
      features : [],
      targets: [],
      model: null
    }
  },
  /**
   * train
   *
   * @param {object} options
   * @param {array} options.data - training data
   * @param {string} options.target - class label
   * @param {array} options.features - features names
   * @param {array} options.featureTypes - features type (ie 'category', 'number')
   */
  train: function(model,options) {
    var data = options.data,
        target = options.target,
        features = options.features,
        featureTypes = options.featureTypes;
    featureTypes.forEach(function(f) {
      if (['number','category'].indexOf(f) === -1) {
        throw new Error('C4.5: Unrecognized option!');
      }
    });

    var targets = unique(data.map(function(d) {
      return d[d.length-1];
    }));
    
    model.features = features;
    model.targets = targets;
    // model is the generated tree structure
    model.model = C45._c45(model, data, target, features, featureTypes, 0);
  },

  _c45: function(model, data, target, features, featureTypes, depth) {
    var targets = unique(data.map(function(d) {
      return d[d.length-1];
    }));

    if (!targets.length) {
      return {
        type: 'result',
        value: 'none data',
        name: 'none data'
      };
    }

    if (targets.length === 1) {
      return {
        type: 'result',
        value: targets[0],
        name: targets[0]
      };
    }

    if (!features.length) {
      var topTarget = C45.mostCommon(targets);
      return {
        type: 'result',
        value: topTarget,
        name: topTarget
      };
    }

    var bestFeatureData = C45.maxGain(model, data, target, features, featureTypes);
    var bestFeature = bestFeatureData.feature;

    var remainingFeatures = features.slice(0);
    remainingFeatures.splice(features.indexOf(bestFeature), 1);

    if (featureTypes[model.features.indexOf(bestFeature)] === 'category') {
      var possibleValues = unique(data.map(function(d) {
        return d[model.features.indexOf(bestFeature)];
      }));
      var node = {
        name: bestFeature,
        type: 'feature_category',
        values: possibleValues.map(function(v) {
          var newData = data.filter(function(x) {
            return x[model.features.indexOf(bestFeature)] === v;
          });
          var childNode = {
            name: v,
            type: 'feature_value',
            child: C45._c45(model, newData, target, remainingFeatures, featureTypes, depth+1)
          };
          return childNode;
        })
      };
    } else if (featureTypes[model.features.indexOf(bestFeature)] === 'number') {
      var possibleValues = unique(data.map(function(d) {
        return d[model.features.indexOf(bestFeature)];
      }));
      var node = {
        name: bestFeature,
        type: 'feature_number',
        cut: bestFeatureData.cut,
        values: []
      };

      var newDataRight = data.filter(function(x) {
        return parseFloat(x[model.features.indexOf(bestFeature)]) > bestFeatureData.cut;
      });
      var childNodeRight = {
        name: bestFeatureData.cut.toString(),
        type: 'feature_value',
        child: C45._c45(model, newDataRight, target, remainingFeatures, featureTypes, depth+1)
      };
      node.values.push(childNodeRight);

      var newDataLeft = data.filter(function(x) {
        return parseFloat(x[model.features.indexOf(bestFeature)]) <= bestFeatureData.cut;
      });
      var childNodeLeft = {
        name: bestFeatureData.cut.toString(),
        type: 'feature_value',
        child: C45._c45(model, newDataLeft, target, remainingFeatures, featureTypes, depth+1),
      };
      node.values.push(childNodeLeft);
    }
    return node;
  },


  classify: function (model,sample) {
    // root is feature (attribute) containing all sub values
    var childNode, featureName, sampleVal;
    var root = model.model;

    if (typeof root === 'undefined') {
      callback(new Error('model is undefined'));
    }

    while (root.type != NODE_TYPES.RESULT) {

      if (root.type == NODE_TYPES.FEATURE_NUMBER) {
        // feature number attribute
        featureName = root.name;
        sampleVal = parseFloat(sample[featureName]);
        if (sampleVal <= root.cut) {
          childNode = root.values[1];
        } else {
          childNode = root.values[0];
        }
      } else if (root.type == NODE_TYPES.FEATURE_CATEGORY) {
        // feature category attribute
        featureName = root.name;
        sampleVal = sample[featureName];

        // sub value , containing n childs
        childNode = find(root.values, function(x) {
          return x.name === sampleVal;
        });
      }

      // non trained feature
      if (typeof childNode === 'undefined') {
        return 'unknown';
      }
      root = childNode.child;
    }
    return root.value;
  },

  conditionalEntropy: function(model, data, feature, cut, target) {
    var subset1 = data.filter(function(x) {
      return parseFloat(x[model.features.indexOf(feature)]) <= cut;
    });
    var subset2 = data.filter(function(x) {
      return parseFloat(x[model.features.indexOf(feature)]) > cut;
    });
    var setSize = data.length;
    return subset1.length/setSize * C45.entropy(model,
      subset1.map(function(d) {
        return d[d.length-1];
      })
    ) + subset2.length/setSize*C45.entropy(model,
      subset2.map(function(d) {
        return d[d.length-1];
      })
    );
  },

  count: function(target, targets) {
    return targets.filter(function(t) {
      return t === target;
    }).length;
  },

  entropy: function(model, vals) {
    var uniqueVals = unique(vals);
    var probs = uniqueVals.map(function(x) {
      return C45.prob(x, vals);
    });
    var logVals = probs.map(function(p) {
      return -p * C45.log2(p);
    });
    return logVals.reduce(function(a, b) {
      return a + b;
    }, 0);
  },

  gain: function(model, data, target, features, feature, featureTypes) {
    var setEntropy = C45.entropy(model, data.map(function(d) {
      return d[d.length-1];
    }));
    if (featureTypes[model.features.indexOf(feature)] === 'category') {
      var attrVals = unique(data.map(function(d) {
        return d[model.features.indexOf(feature)];
      }));
      var setSize = data.length;
      var entropies = attrVals.map(function(n) {
        var subset = data.filter(function(x) {
          return x[feature] === n;
        });
        return (subset.length/setSize) * C45.entropy(model,
          subset.map(function(d) {
            return d[d.length-1];
          })
        );
      });
      var sumOfEntropies = entropies.reduce(function(a, b) {
        return a + b;
      }, 0);
      return {
        feature: feature,
        gain: setEntropy - sumOfEntropies,
        cut: 0
      };
    } else if (featureTypes[model.features.indexOf(feature)] === 'number') {
      var attrVals = unique(data.map(function(d) {
        return d[model.features.indexOf(feature)];
      }));
      var gainVals = attrVals.map(function(cut) {
        var cutf = parseFloat(cut);
        var gain = setEntropy - C45.conditionalEntropy(model, data, feature, cutf, target);
        return {
            feature: feature,
            gain: gain,
            cut: cutf
        };
      });
      var maxgain = max(gainVals, function(e) {
        return e.gain;
      });
      return maxgain;
    }
  },

  log2: function(n) {
    return Math.log(n) / Math.log(2);
  },
  
  maxGain: function(model, data, target, features, featureTypes) {
    var g45 = features.map(function(feature) {
      return C45.gain(model, data, target, features, feature, featureTypes);
    });
    return max(g45, function(e) {
      return e.gain;
    });
  },


  mostCommon: function(targets) {
    return sortBy(targets, function(target) {
      return C45.count(target, targets);
    }).reverse()[0];
  },

  /** Print the tree
  *
  */
  print: function (model,indent) {
    var NL = '\n',
        line='',sep;
    if (indent==undefined) indent=0;
    if (!model) return '';
    var sp = function () {return Comp.string.create(indent);};
    switch (model.type) {
      case NODE_TYPES.RESULT: 
        return sp()+'-> '+model.name+NL;
      case NODE_TYPES.FEATURE_CATEGORY:
        line=sp()+'$'+model.name+'?'+NL;
        Comp.array.iter(model.values,function (v) {
          line += C45.print(v,indent+2);
        }); 
        return line;
      case NODE_TYPES.FEATURE_NUMBER:
        line = sp()+'$'+model.name+'>'+model.cut+'?'+NL;
        if (model.values[0].type==NODE_TYPES.FEATURE_VALUE)
          line = line+C45.print(model.values[0].child,indent+2);
        else
          line = line+C45.print(model.values[0],indent+2);
        line = line+sp()+'$'+model.name+'<='+model.cut+'?'+NL;
        if (model.values[0].type==NODE_TYPES.FEATURE_VALUE)
          line = line+C45.print(model.values[1].child,indent+2);
        else
          line = line+C45.print(model.values[1],indent+2);
        return line;
      case NODE_TYPES.FEATURE_VALUE:
        line=sp()+''+model.name+NL;
        line += C45.print(model.child,indent+2);
        return line;
    }
    return 'model?';
  },

  prob: function(target, targets) {
    return C45.count(target,targets)/targets.length;
  },

};

module.exports = {
  classify:C45.classify,
  create:C45.create,
  entropy:C45.entropy,
  log2:C45.log2,
  print:function (model,indent) { return C45.print(model.model,indent) },
  unique:unique,
  train:C45.train,
  current:function (module) { current=module.current; Aios=module;}  
}
};
BundleModuleCode['ml/text']=function (module,exports,global,process){
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
 **    $INITIAL:     (C) 2006-2019 BSSLAB
 **    $CREATED:     5-3-19 by sbosse.
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 **  JavaScript AIOS Machine Learning API: Text analysis
 **
 ** Portable model
 **
 **    $ENDOFINFO
 */
'use strict';
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}


// Create a model
function create(strings,options) {
  return {
    data:strings
  }
}

// Classify one sample; return best matching string
function classify(model,sample) {
  var matches = model.data.map(function (h) {
    return {
      match:similarity(h,sample),
      string:h
    }
  }).sort(function (a,b) {
    if (a.match < b.match) return 1; else return -1;
  });
  return matches[0];
}

module.exports = {
  classify:classify,
  create:create,
  similarity:similarity,
  current:function (module) { current=module.current; Aios=module;}  
}
};
BundleModuleCode['ml/rf']=function (module,exports,global,process){
// MIT License
// Random Forest Trees (only binary classifier)
// Andrej Karpathy
// @blab+ 
// https://github.com/karpathy/forestjs


var RandomForest = function(options) {
  var L = {};
  return L
}

RandomForest.code = {

  /*
  data is 2D array of size N x D of examples
  labels is a 1D array of labels (only -1 or 1 for now). In future will support multiclass or maybe even regression
  options.numTrees can be used to customize number of trees to train (default = 100)
  options.maxDepth is the maximum depth of each tree in the forest (default = 4)
  options.numTries is the number of random hypotheses generated at each node during training (default = 10)
  options.trainFun is a function with signature "function myWeakTrain(data, labels, ix, options)". Here, ix is a list of 
                   indeces into data of the instances that should be payed attention to. Everything not in the list 
                   should be ignored. This is done for efficiency. The function should return a model where you store 
                   variables. (i.e. model = {}; model.myvar = 5;) This will be passed to testFun.
  options.testFun is a function with signature "funtion myWeakTest(inst, model)" where inst is 1D array specifying an example,
                   and model will be the same model that you return in options.trainFun. For example, model.myvar will be 5.
                   see decisionStumpTrain() and decisionStumpTest() downstairs for example.
  */
  train: function(L, data, labels, options) {
    options = options || {};
    L.options = options;
    
    L.numTrees = options.numTrees || 100;

    // initialize many trees and train them all independently
    L.trees= new Array(L.numTrees);
    for(var i=0;i<L.numTrees;i++) {
      L.trees[i] = DecisionTree();
      DecisionTree.code.train(L.trees[i],data, labels, options);
    }
  },

  /*
  inst is a 1D array of length D of an example. 
  returns the probability of label 1, i.e. a number in range [0, 1]
  */
  predictOne: function(L, inst) {

    // have each tree predict and average out all votes
    var dec=0;
    for(var i=0;i<L.numTrees;i++) {
      dec += DecisionTree.code.predictOne(L.trees[i],inst);
    }
    dec /= L.numTrees;
    return dec;
  },

  // convenience function. Here, data is NxD array. 
  // returns probabilities of being 1 for all data in an array.
  predict: function(L, data) {

    var probabilities= new Array(data.length);
    for(var i=0;i<data.length;i++) {
      probabilities[i]= RandomForest.code.predictOne(L,data[i]);
    }
    return probabilities;

  }

}

// represents a single decision tree
var DecisionTree = function(options) {
  var L = {};
  return L
}

DecisionTree.code = {

  train: function(L, data, labels, options) {

    options = options || {};
    var maxDepth = options.maxDepth || 4;
    var weakType = options.type || 0;

    
    var trainFun= decisionStumpTrain;
    var testFun= decisionStumpTest;

    if(options.trainFun) trainFun = options.trainFun;
    if(options.testFun) testFun = options.testFun;

    if(weakType == 0) {
      // Default
      trainFun  = decisionStumpTrain;
      testFun   = decisionStumpTest;
    }
    if(weakType) {
      trainFun  = decision2DStumpTrain;
      L.testFun = testFun = decision2DStumpTest;
    }

    // initialize various helper variables
    var numInternals= Math.pow(2, maxDepth)-1;
    var numNodes= Math.pow(2, maxDepth + 1)-1;
    var ixs= new Array(numNodes);
    for(var i=1;i<ixs.length;i++) ixs[i]=[];
    ixs[0]= new Array(labels.length);
    for(var i=0;i<labels.length;i++) ixs[0][i]= i; // root node starts out with all nodes as relevant
    var models = new Array(numInternals);

    // train
    for(var n=0; n < numInternals; n++) {

      // few base cases
      var ixhere= ixs[n];
      if(ixhere.length == 0) { continue; }
      if(ixhere.length == 1) { ixs[n*2+1] = [ixhere[0]]; continue; } // arbitrary send it down left

      // learn a weak model on relevant data for this node
      var model= trainFun(data, labels, ixhere);
      models[n]= model; // back it up model

      // split the data according to the learned model
      var ixleft=[];
      var ixright=[];
      for(var i=0; i<ixhere.length;i++) {
          var label= testFun(data[ixhere[i]], model);
          if(label === 1) ixleft.push(ixhere[i]);
          else ixright.push(ixhere[i]);
      }
      ixs[n*2+1]= ixleft;
      ixs[n*2+2]= ixright;
    }

    // compute data distributions at the leafs
    var leafPositives = new Array(numNodes);
    var leafNegatives = new Array(numNodes);
    for(var n=numInternals; n < numNodes; n++) {
      var numones= 0;
      for(var i=0;i<ixs[n].length;i++) {
          if(labels[ixs[n][i]] === 1) numones+=1;
      }
      leafPositives[n]= numones;
      leafNegatives[n]= ixs[n].length-numones;
    }

    // back up important prediction variables for predicting later
    L.models= models;
    L.leafPositives = leafPositives;
    L.leafNegatives = leafNegatives;
    L.maxDepth= maxDepth;
    // L.trainFun= trainFun;
    // L.testFun= testFun;
  }, 

  // returns probability that example inst is 1.
  predictOne: function(L, inst) { 
      var testFun = L.testFun||decisionStumpTest;
      var n=0;
      for(var i=0;i<L.maxDepth;i++) {
          var dir= testFun(inst, L.models[n]);
          if(dir === 1) n= n*2+1; // descend left
          else n= n*2+2; // descend right
      }

      return (L.leafPositives[n] + 0.5) / (L.leafNegatives[n] + 1.0); // bayesian smoothing!
  }
}

// returns model
function decisionStumpTrain(data, labels, ix, options) {

  options = options || {};
  var numtries = options.numTries || 10;

  // choose a dimension at random and pick a best split
  var ri= randi(0, data[0].length);
  var N= ix.length;

  // evaluate class entropy of incoming data
  var H= entropy(labels, ix);
  var bestGain=0; 
  var bestThr= 0;
  for(var i=0;i<numtries;i++) {

      // pick a random splitting threshold
      var ix1= ix[randi(0, N)];
      var ix2= ix[randi(0, N)];
      while(ix2==ix1) ix2= ix[randi(0, N)]; // enforce distinctness of ix2

      var a= Math.random();
      var thr= data[ix1][ri]*a + data[ix2][ri]*(1-a);

      // measure information gain we'd get from split with thr
      var l1=1, r1=1, lm1=1, rm1=1; //counts for Left and label 1, right and label 1, left and minus 1, right and minus 1
      for(var j=0;j<ix.length;j++) {
          if(data[ix[j]][ri] < thr) {
            if(labels[ix[j]]==1) l1++;
            else lm1++;
          } else {
            if(labels[ix[j]]==1) r1++;
            else rm1++;
          }
      }
      var t= l1+lm1;  // normalize the counts to obtain probability estimates
      l1=l1/t;
      lm1=lm1/t;
      t= r1+rm1;
      r1=r1/t;
      rm1= rm1/t;

      var LH= -l1*Math.log(l1) -lm1*Math.log(lm1); // left and right entropy
      var RH= -r1*Math.log(r1) -rm1*Math.log(rm1);

      var informationGain= H - LH - RH;
      //console.log("Considering split %f, entropy %f -> %f, %f. Gain %f", thr, H, LH, RH, informationGain);
      if(informationGain > bestGain || i === 0) {
          bestGain= informationGain;
          bestThr= thr;
      }
  }

  model= {};
  model.thr= bestThr;
  model.ri= ri;
  return model;
}

// returns a decision for a single data instance
function decisionStumpTest(inst, model) {
  if(!model) {
      // this is a leaf that never received any data... 
      return 1;
  }
  return inst[model.ri] < model.thr ? 1 : -1;

}

// returns model. Code duplication with decisionStumpTrain :(
function decision2DStumpTrain(data, labels, ix, options) {

  options = options || {};
  var numtries = options.numTries || 10;

  // choose a dimension at random and pick a best split
  var N= ix.length;

  var ri1= 0;
  var ri2= 1;
  if(data[0].length > 2) {
    // more than 2D data. Pick 2 random dimensions
    ri1= randi(0, data[0].length);
    ri2= randi(0, data[0].length);
    while(ri2 == ri1) ri2= randi(0, data[0].length); // must be distinct!
  }

  // evaluate class entropy of incoming data
  var H= entropy(labels, ix);
  var bestGain=0; 
  var bestw1, bestw2, bestthr;
  var dots= new Array(ix.length);
  for(var i=0;i<numtries;i++) {

      // pick random line parameters
      var alpha= randf(0, 2*Math.PI);
      var w1= Math.cos(alpha);
      var w2= Math.sin(alpha);

      // project data on this line and get the dot products
      for(var j=0;j<ix.length;j++) {
        dots[j]= w1*data[ix[j]][ri1] + w2*data[ix[j]][ri2];
      }

      // we are in a tricky situation because data dot product distribution
      // can be skewed. So we don't want to select just randomly between
      // min and max. But we also don't want to sort as that is too expensive
      // let's pick two random points and make the threshold be somewhere between them.
      // for skewed datasets, the selected points will with relatively high likelihood
      // be in the high-desnity regions, so the thresholds will make sense
      var ix1= ix[randi(0, N)];
      var ix2= ix[randi(0, N)];
      while(ix2==ix1) ix2= ix[randi(0, N)]; // enforce distinctness of ix2
      var a= Math.random();
      var dotthr= dots[ix1]*a + dots[ix2]*(1-a);

      // measure information gain we'd get from split with thr
      var l1=1, r1=1, lm1=1, rm1=1; //counts for Left and label 1, right and label 1, left and minus 1, right and minus 1
      for(var j=0;j<ix.length;j++) {
          if(dots[j] < dotthr) {
            if(labels[ix[j]]==1) l1++;
            else lm1++;
          } else {
            if(labels[ix[j]]==1) r1++;
            else rm1++;
          }
      }
      var t= l1+lm1; 
      l1=l1/t;
      lm1=lm1/t;
      t= r1+rm1;
      r1=r1/t;
      rm1= rm1/t;

      var LH= -l1*Math.log(l1) -lm1*Math.log(lm1); // left and right entropy
      var RH= -r1*Math.log(r1) -rm1*Math.log(rm1);

      var informationGain= H - LH - RH;
      //console.log("Considering split %f, entropy %f -> %f, %f. Gain %f", thr, H, LH, RH, informationGain);
      if(informationGain > bestGain || i === 0) {
          bestGain= informationGain;
          bestw1= w1;
          bestw2= w2;
          bestthr= dotthr;
      }
  }

  model= {};
  model.w1= bestw1;
  model.w2= bestw2;
  model.dotthr= bestthr;
  return model;
}

// returns label for a single data instance
function decision2DStumpTest(inst, model) {
  if(!model) {
      // this is a leaf that never received any data... 
      return 1;
  }
  return inst[0]*model.w1 + inst[1]*model.w2 < model.dotthr ? 1 : -1;

}

// Misc utility functions
function entropy(labels, ix) {
  var N= ix.length;
  var p=0.0;
  for(var i=0;i<N;i++) {
      if(labels[ix[i]]==1) p+=1;
  }
  p=(1+p)/(N+2); // let's be bayesian about this
  q=(1+N-p)/(N+2);
  return (-p*Math.log(p) -q*Math.log(q));
}

// generate random floating point number between a and b
function randf(a, b) {
  return Math.random()*(b-a)+a;
}

// generate random integer between a and b (b excluded)
function randi(a, b) {
   return Math.floor(Math.random()*(b-a)+a);
}

module.exports = RandomForest
};
BundleModuleCode['ml/rl']=function (module,exports,global,process){
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
 **    $AUTHORS:     Ankit Kuwadekar, Stefan Bosse
 **    $INITIAL:     (C) 2015, Andrej Karpathy
 **    $MODIFIED:    (C) 2006-2019 bLAB by sbosse
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 ** Reinforcement Learning module that implements several common RL algorithms.
 ** Portable models (TDAgent/DPAgent/DQNAgent)
 **
 **    $ENDOFINFO
 */
"use strict";

var options = {
  version:'1.1.2'
}
var Io = Require('com/io')
var R = module.exports; // the Recurrent library


// Utility fun
function assert(condition, message) {
  // from http://stackoverflow.com/questions/15313418/javascript-assert
  if (!condition) {
    message = message || "Assertion failed";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}

// Random numbers utils
var return_v = false;
var v_val = 0.0;
var gaussRandom = function() {
  if(return_v) { 
    return_v = false;
    return v_val; 
  }
  var u = 2*Math.random()-1;
  var v = 2*Math.random()-1;
  var r = u*u + v*v;
  if(r == 0 || r > 1) return gaussRandom();
  var c = Math.sqrt(-2*Math.log(r)/r);
  v_val = v*c; // cache this
  return_v = true;
  return u*c;
}
var randf = function(a, b) { return Math.random()*(b-a)+a; }
var randi = function(a, b) { return Math.floor(Math.random()*(b-a)+a); }
var randn = function(mu, std){ return mu+gaussRandom()*std; }

// helper function returns array of zeros of length n
// and uses typed arrays if available
var zeros = function(n) {
  if(typeof(n)==='undefined' || isNaN(n)) { return []; }
  if(typeof ArrayBuffer === 'undefined') {
    // lacking browser support
    var arr = new Array(n);
    for(var i=0;i<n;i++) { arr[i] = 0; }
    return arr;
  } else {
    return new Float64Array(n);
  }
}

// Mat holds a matrix
var Mat = function(n,d) {
  var M = {}
  // n is number of rows d is number of columns
  M.n = n;
  M.d = d;
  M.w = zeros(n * d);
  M.dw = zeros(n * d);
  return M;
}

Mat.code = {
  get: function(M,row, col) { 
    // slow but careful accessor function
    // we want row-major order
    var ix = (M.d * row) + col;
    assert(ix >= 0 && ix < M.w.length);
    return M.w[ix];
  },
  set: function(M, row, col, v) {
    // slow but careful accessor function
    var ix = (M.d * row) + col;
    assert(ix >= 0 && ix < M.w.length);
    M.w[ix] = v; 
  },
  setFrom: function(M, arr) {
    for(var i=0,n=arr.length;i<n;i++) {
      M.w[i] = arr[i]; 
    }
  },
  setColumn: function(M, m, i) {
    for(var q=0,n=m.w.length;q<n;q++) {
      M.w[(M.d * q) + i] = m.w[q];
    }
  },
  toJSON: function(M) {
    var json = {};
    json['n'] = M.n;
    json['d'] = M.d;
    json['w'] = M.w;
    return json;
  },
  fromJSON: function(M, json) {
    M.n = json.n;
    M.d = json.d;
    M.w = zeros(M.n * M.d);
    M.dw = zeros(M.n * M.d);
    for(var i=0,n=M.n * M.d;i<n;i++) {
      M.w[i] = json.w[i]; // copy over weights
    }
  }
}

var copyMat = function(b) {
  var a = Mat(b.n, b.d);
  Mat.code.setFrom(a, b.w);
  return a;
}

var copyNet = function(net) {
  // nets are (k,v) pairs with k = string key, v = Mat()
  var new_net = {};
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      new_net[p] = copyMat(net[p]);
    }
  }
  return new_net;
}

var updateMat = function(m, alpha) {
  // updates in place
  for(var i=0,n=m.n*m.d;i<n;i++) {
    if(m.dw[i] !== 0) {
      m.w[i] += - alpha * m.dw[i];
      m.dw[i] = 0;
    }
  }
}

var updateNet = function(net, alpha) {
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      updateMat(net[p], alpha);
    }
  }
}

var netToJSON = function(net) {
  var j = {};
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      j[p] = Mat.code.toJSON(net[p]);
    }
  }
  return j;
}
var netFromJSON = function(j) {
  var net = {};
  for(var p in j) {
    if(j.hasOwnProperty(p)){
      net[p] = Mat(1,1); // not proud of this
      Mat.code.fromJSON(net[p],j[p]);
    }
  }
  return net;
}
var netZeroGrads = function(net) {
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      var mat = net[p];
      gradFillConst(mat, 0);
    }
  }
}
var netFlattenGrads = function(net) {
  var n = 0;
  for(var p in net) { 
   if(net.hasOwnProperty(p)) { 
    var mat = net[p]; n += mat.dw.length; 
  }}
  var g = Mat(n, 1);
  var ix = 0;
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      var mat = net[p];
      for(var i=0,m=mat.dw.length;i<m;i++) {
        g.w[ix] = mat.dw[i];
        ix++;
      }
    }
  }
  return g;
}

// return Mat but filled with random numbers from gaussian
var RandMat = function(n,d,mu,std) {
  var m = Mat(n, d);
  fillRandn(m,mu,std);
  //fillRand(m,-std,std); // kind of :P
  return m;
}

// Mat utils
// fill matrix with random gaussian numbers
var fillRandn = function(m, mu, std) { for(var i=0,n=m.w.length;i<n;i++) { m.w[i] = randn(mu, std); } }
var fillRand = function(m, lo, hi) { for(var i=0,n=m.w.length;i<n;i++) { m.w[i] = randf(lo, hi); } }
var gradFillConst = function(m, c) { for(var i=0,n=m.dw.length;i<n;i++) { m.dw[i] = c } }



// Transformer definitions
var Graph = function(needs_backprop) {
  var G = {}
  if(typeof needs_backprop === 'undefined') { needs_backprop = true; }
  G.needs_backprop = needs_backprop;

  // this will store a list of functions that perform backprop,
  // in their forward pass order. So in backprop we will go
  // backwards and evoke each one
  G.backprop = [];
  return G
}
Graph.code = {
  backward: function(G) {
    for(var i=G.backprop.length-1;i>=0;i--) {
      G.backprop[i](); // tick!
    }
  },
  rowPluck: function(G, m, ix) {
    // pluck a row of m with index ix and return it as col vector
    assert(ix >= 0 && ix < m.n);
    var d = m.d;
    var out = Mat(d, 1);
    for(var i=0,n=d;i<n;i++){ out.w[i] = m.w[d * ix + i]; } // copy over the data

    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0,n=d;i<n;i++){ m.dw[d * ix + i] += out.dw[i]; }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  tanh: function(G, m) {
    // tanh nonlinearity
    var out = Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) { 
      out.w[i] = Math.tanh(m.w[i]);
    }

    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          // grad for z = tanh(x) is (1 - z^2)
          var mwi = out.w[i];
          m.dw[i] += (1.0 - mwi * mwi) * out.dw[i];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  sigmoid: function(G, m) {
    // sigmoid nonlinearity
    var out = Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) { 
      out.w[i] = sig(m.w[i]);
    }

    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          // grad for z = tanh(x) is (1 - z^2)
          var mwi = out.w[i];
          m.dw[i] += mwi * (1.0 - mwi) * out.dw[i];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  relu: function(G, m) {
    var out = Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) { 
      out.w[i] = Math.max(0, m.w[i]); // relu
    }
    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          m.dw[i] += m.w[i] > 0 ? out.dw[i] : 0.0;
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  mul: function(G, m1, m2) {
    // multiply matrices m1 * m2
    assert(m1.d === m2.n, 'matmul dimensions misaligned');

    var n = m1.n;
    var d = m2.d;
    var out = Mat(n,d);
    for(var i=0;i<m1.n;i++) { // loop over rows of m1
      for(var j=0;j<m2.d;j++) { // loop over cols of m2
        var dot = 0.0;
        for(var k=0;k<m1.d;k++) { // dot product loop
          dot += m1.w[m1.d*i+k] * m2.w[m2.d*k+j];
        }
        out.w[d*i+j] = dot;
      }
    }

    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0;i<m1.n;i++) { // loop over rows of m1
          for(var j=0;j<m2.d;j++) { // loop over cols of m2
            for(var k=0;k<m1.d;k++) { // dot product loop
              var b = out.dw[d*i+j];
              m1.dw[m1.d*i+k] += m2.w[m2.d*k+j] * b;
              m2.dw[m2.d*k+j] += m1.w[m1.d*i+k] * b;
            }
          }
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  add: function(G, m1, m2) {
    assert(m1.w.length === m2.w.length);

    var out = Mat(m1.n, m1.d);
    for(var i=0,n=m1.w.length;i<n;i++) {
      out.w[i] = m1.w[i] + m2.w[i];
    }
    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += out.dw[i];
          m2.dw[i] += out.dw[i];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  dot: function(G, m1, m2) {
    // m1 m2 are both column vectors
    assert(m1.w.length === m2.w.length);
    var out = Mat(1,1);
    var dot = 0.0;
    for(var i=0,n=m1.w.length;i<n;i++) {
      dot += m1.w[i] * m2.w[i];
    }
    out.w[0] = dot;
    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += m2.w[i] * out.dw[0];
          m2.dw[i] += m1.w[i] * out.dw[0];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  eltmul: function(G, m1, m2) {
    assert(m1.w.length === m2.w.length);

    var out = Mat(m1.n, m1.d);
    for(var i=0,n=m1.w.length;i<n;i++) {
      out.w[i] = m1.w[i] * m2.w[i];
    }
    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += m2.w[i] * out.dw[i];
          m2.dw[i] += m1.w[i] * out.dw[i];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
}


var softmax = function(m) {
    var out = Mat(m.n, m.d); // probability volume
    var maxval = -999999;
    for(var i=0,n=m.w.length;i<n;i++) { if(m.w[i] > maxval) maxval = m.w[i]; }

    var s = 0.0;
    for(var i=0,n=m.w.length;i<n;i++) { 
      out.w[i] = Math.exp(m.w[i] - maxval);
      s += out.w[i];
    }
    for(var i=0,n=m.w.length;i<n;i++) { out.w[i] /= s; }

    // no backward pass here needed
    // since we will use the computed probabilities outside
    // to set gradients directly on m
    return out;
  }


var Solver = function() {
  var S = {}
  S.decay_rate = 0.999;
  S.smooth_eps = 1e-8;
  S.step_cache = {};
  return S
}
Solver.code = {
  step: function(S, model, step_size, regc, clipval) {
    // perform parameter update
    var solver_stats = {};
    var num_clipped = 0;
    var num_tot = 0;
    for(var k in model) {
      if(model.hasOwnProperty(k)) {
        var m = model[k]; // mat ref
        if(!(k in S.step_cache)) { S.step_cache[k] = Mat(m.n, m.d); }
        var s = S.step_cache[k];
        for(var i=0,n=m.w.length;i<n;i++) {

          // rmsprop adaptive learning rate
          var mdwi = m.dw[i];
          s.w[i] = s.w[i] * S.decay_rate + (1.0 - S.decay_rate) * mdwi * mdwi;

          // gradient clip
          if(mdwi > clipval) {
            mdwi = clipval;
            num_clipped++;
          }
          if(mdwi < -clipval) {
            mdwi = -clipval;
            num_clipped++;
          }
          num_tot++;

          // update (and regularize)
          m.w[i] += - step_size * mdwi / Math.sqrt(s.w[i] + S.smooth_eps) - regc * m.w[i];
          m.dw[i] = 0; // reset gradients for next iteration
        }
      }
    }
    solver_stats['ratio_clipped'] = num_clipped*1.0/num_tot;
    return solver_stats;
  }
}

var initLSTM = function(input_size, hidden_sizes, output_size) {
  // hidden size should be a list

  var model = {};
  for(var d=0;d<hidden_sizes.length;d++) { // loop over depths
    var prev_size = d === 0 ? input_size : hidden_sizes[d - 1];
    var hidden_size = hidden_sizes[d];

    // gates parameters
    model['Wix'+d]  = RandMat(hidden_size, prev_size , 0, 0.08);  
    model['Wih'+d]  = RandMat(hidden_size, hidden_size , 0, 0.08);
    model['bi'+d]   = Mat(hidden_size, 1);
    model['Wfx'+d]  = RandMat(hidden_size, prev_size , 0, 0.08);  
    model['Wfh'+d]  = RandMat(hidden_size, hidden_size , 0, 0.08);
    model['bf'+d]   = Mat(hidden_size, 1);
    model['Wox'+d]  = RandMat(hidden_size, prev_size , 0, 0.08);  
    model['Woh'+d]  = RandMat(hidden_size, hidden_size , 0, 0.08);
    model['bo'+d]   = Mat(hidden_size, 1);
    // cell write params
    model['Wcx'+d]  = RandMat(hidden_size, prev_size , 0, 0.08);  
    model['Wch'+d]  = RandMat(hidden_size, hidden_size , 0, 0.08);
    model['bc'+d]   = Mat(hidden_size, 1);
  }
  // decoder params
  model['Whd']  = RandMat(output_size, hidden_size, 0, 0.08);
  model['bd']   = Mat(output_size, 1);
  return model;
}

var forwardLSTM = function(G, model, hidden_sizes, x, prev) {
  // forward prop for a single tick of LSTM
  // G is graph to append ops to
  // model contains LSTM parameters
  // x is 1D column vector with observation
  // prev is a struct containing hidden and cell
  // from previous iteration

  if(prev == null || typeof prev.h === 'undefined') {
    var hidden_prevs = [];
    var cell_prevs = [];
    for(var d=0;d<hidden_sizes.length;d++) {
      hidden_prevs.push(R.Mat(hidden_sizes[d],1)); 
      cell_prevs.push(R.Mat(hidden_sizes[d],1)); 
    }
  } else {
    var hidden_prevs = prev.h;
    var cell_prevs = prev.c;
  }

  var hidden = [];
  var cell = [];
  for(var d=0;d<hidden_sizes.length;d++) {

    var input_vector = d === 0 ? x : hidden[d-1];
    var hidden_prev = hidden_prevs[d];
    var cell_prev = cell_prevs[d];

    // input gate
    var h0 = Graph.code.mul(G,model['Wix'+d], input_vector);
    var h1 = Graph.code.mul(G,model['Wih'+d], hidden_prev);
    var input_gate = Graph.code.sigmoid(G,Graph.code.add(G,Graph.code.add(G,h0,h1),
                                        model['bi'+d]));

    // forget gate
    var h2 = Graph.code.mul(G,model['Wfx'+d], input_vector);
    var h3 = Graph.code.mul(G,model['Wfh'+d], hidden_prev);
    var forget_gate = Graph.code.sigmoid(
                        G,Graph.code.add(G,Graph.code.add(G,h2, h3),
                        model['bf'+d]));

    // output gate
    var h4 = Graph.code.mul(G,model['Wox'+d], input_vector);
    var h5 = Graph.code.mul(G,model['Woh'+d], hidden_prev);
    var output_gate = Graph.code.sigmoid(G,Graph.code.add(G,Graph.code.add(G,h4, h5),
                                                          model['bo'+d]));

    // write operation on cells
    var h6 = Graph.code.mul(G,model['Wcx'+d], input_vector);
    var h7 = Graph.code.mul(G,model['Wch'+d], hidden_prev);
    var cell_write = Graph.code.tanh(G,Graph.code.add(
                                         G,Graph.code.add(G,h6, h7),
                                         model['bc'+d]));

    // compute new cell activation
    var retain_cell = Graph.code.eltmul(G,forget_gate, cell_prev); // what do we keep from cell
    var write_cell = Graph.code.eltmul(G,input_gate, cell_write); // what do we write to cell
    var cell_d = Graph.code.add(G,retain_cell, write_cell); // new cell contents

    // compute hidden state as gated, saturated cell activations
    var hidden_d = Graph.code.eltmul(G, output_gate, Graph.code.tanh(G,cell_d));

    hidden.push(hidden_d);
    cell.push(cell_d);
  }

  // one decoder to outputs at end
  var output = Graph.code.add(G,Graph.code.mul(G,model['Whd'], hidden[hidden.length - 1]),model['bd']);

  // return cell memory, hidden representation and output
  return {'h':hidden, 'c':cell, 'o' : output};
}

var sig = function(x) {
  // helper function for computing sigmoid
  return 1.0/(1+Math.exp(-x));
}

var maxi = function(w) {
  // argmax of array w
  var maxv = w[0];
  var maxix = 0;
  for(var i=1,n=w.length;i<n;i++) {
    var v = w[i];
    if(v > maxv) {
      maxix = i;
      maxv = v;
    }
  }
  return maxix;
}

var samplei = function(w) {
  // sample argmax from w, assuming w are 
  // probabilities that sum to one
  var r = randf(0,1);
  var x = 0.0;
  var i = 0;
  while(true) {
    x += w[i];
    if(x > r) { return i; }
    i++;
  }
  return w.length - 1; // pretty sure we should never get here?
}

// various utils
module.exports.assert = assert;
module.exports.zeros = zeros;
module.exports.maxi = maxi;
module.exports.samplei = samplei;
module.exports.randi = randi;
module.exports.randn = randn;
module.exports.softmax = softmax;
// classes
module.exports.Mat = Mat;
module.exports.RandMat = RandMat;
module.exports.forwardLSTM = forwardLSTM;
module.exports.initLSTM = initLSTM;
// more utils
module.exports.updateMat = updateMat;
module.exports.updateNet = updateNet;
module.exports.copyMat = copyMat;
module.exports.copyNet = copyNet;
module.exports.netToJSON = netToJSON;
module.exports.netFromJSON = netFromJSON;
module.exports.netZeroGrads = netZeroGrads;
module.exports.netFlattenGrads = netFlattenGrads;
// optimization
module.exports.Solver = Solver;
module.exports.Graph = Graph;

// END OF RECURRENTJS

var RL = module.exports;

// syntactic sugar function for getting default parameter values
var getopt = function(opt, field_name, default_value) {
  if(typeof opt === 'undefined') { return default_value; }
  return (typeof opt[field_name] !== 'undefined') ? opt[field_name] : default_value;
}

var zeros = R.zeros; // inherit these
var assert = R.assert;
var randi = R.randi;
var randf = R.randf;

var setConst = function(arr, c) {
  for(var i=0,n=arr.length;i<n;i++) {
    arr[i] = c;
  }
}

var sampleWeighted = function(p) {
  var r = Math.random();
  var c = 0.0;
  for(var i=0,n=p.length;i<n;i++) {
    c += p[i];
    if(c >= r) { return i; }
  }
  // assert(false, 'sampleWeighted: Invalid samples '+Io.inspect(p));
  return 0
}

// ------
// AGENTS
// ------

// DPAgent performs Value Iteration
// - can also be used for Policy Iteration if you really wanted to
// - requires model of the environment :(
// - does not learn from experience :(
// - assumes finite MDP :(
var DPAgent = function(env, opt) {
  var L={};
  L.V = null; // state value function
  L.P = null; // policy distribution \pi(s,a)
  L.env = env; // store pointer to environment
  L.gamma = getopt(opt, 'gamma', 0.75); // future reward discount factor
  DPAgent.code.reset(L);
  return L;
}
DPAgent.code = {
  reset: function(L) {
    // reset the agent's policy and value function
    L.ns = L.env.getNumStates();
    L.na = L.env.getMaxNumActions();
    L.V = zeros(L.ns);
    L.P = zeros(L.ns * L.na);
    // initialize uniform random policy
    for(var s=0;s<L.ns;s++) {
      var poss = L.env.allowedActions(s);
      for(var i=0,n=poss.length;i<n;i++) {
        L.P[poss[i]*L.ns+s] = 1.0 / poss.length;
      }
    }
  },
  act: function(L,s) {
    // behave according to the learned policy
    var poss = L.env.allowedActions(s);
    var ps = [];
    for(var i=0,n=poss.length;i<n;i++) {
      var a = poss[i];
      var prob = L.P[a*L.ns+s];
      ps.push(prob);
    }
    var maxi = sampleWeighted(ps);
    return poss[maxi];
  },
  learn: function(L) {
    // perform a single round of value iteration
    DPAgent.code.evaluatePolicy(L); // writes this.V
    DPAgent.code.updatePolicy(L); // writes this.P
  },
  evaluatePolicy: function(L) {
    // perform a synchronous update of the value function
    var Vnew = zeros(L.ns);
    for(var s=0;s<L.ns;s++) {
      // integrate over actions in a stochastic policy
      // note that we assume that policy probability mass over allowed actions sums to one
      var v = 0.0;
      var poss = L.env.allowedActions(s);
      for(var i=0,n=poss.length;i<n;i++) {
        var a = poss[i];
        var prob = L.P[a*L.ns+s]; // probability of taking action under policy
        if(prob === 0) { continue; } // no contribution, skip for speed
        var ns = L.env.nextState(s,a);
        var rs = L.env.reward(s,a,ns); // reward for s->a->ns transition
        v += prob * (rs + L.gamma * L.V[ns]);
      }
      Vnew[s] = v;
    }
    L.V = Vnew; // swap
  },
  updatePolicy: function(L) {
    // update policy to be greedy w.r.t. learned Value function
    for(var s=0;s<L.ns;s++) {
      var poss = L.env.allowedActions(s);
      // compute value of taking each allowed action
      var vmax, nmax;
      var vs = [];
      for(var i=0,n=poss.length;i<n;i++) {
        var a = poss[i];
        var ns = L.env.nextState(s,a);
        var rs = L.env.reward(s,a,ns);
        var v = rs + L.gamma * L.V[ns];
        vs.push(v);
        if(i === 0 || v > vmax) { vmax = v; nmax = 1; }
        else if(v === vmax) { nmax += 1; }
      }
      // update policy smoothly across all argmaxy actions
      for(var i=0,n=poss.length;i<n;i++) {
        var a = poss[i];
        L.P[a*L.ns+s] = (vs[i] === vmax) ? 1.0/nmax : 0.0;
      }
    }
  },
}

// QAgent uses TD (Q-Learning, SARSA)
// - does not require environment model :)
// - learns from experience :)
var TDAgent = function(env, opt) {
  var L={}
  L.update = getopt(opt, 'update', 'qlearn'); // qlearn | sarsa
  L.gamma = getopt(opt, 'gamma', 0.75); // future reward discount factor
  L.epsilon = getopt(opt, 'epsilon', 0.1); // for epsilon-greedy policy
  L.alpha = getopt(opt, 'alpha', 0.01); // value function learning rate

  // class allows non-deterministic policy, and smoothly regressing towards the optimal policy based on Q
  L.smooth_policy_update = getopt(opt, 'smooth_policy_update', false);
  L.beta = getopt(opt, 'beta', 0.01); // learning rate for policy, if smooth updates are on

  // eligibility traces
  L.lambda = getopt(opt, 'lambda', 0); // eligibility trace decay. 0 = no eligibility traces used
  L.replacing_traces = getopt(opt, 'replacing_traces', true);

  // optional optimistic initial values
  L.q_init_val = getopt(opt, 'q_init_val', 0);

  L.planN = getopt(opt, 'planN', 0); // number of planning steps per learning iteration (0 = no planning)

  L.Q = null; // state action value function
  L.P = null; // policy distribution \pi(s,a)
  L.e = null; // eligibility trace
  L.env_model_s = null;; // environment model (s,a) -> (s',r)
  L.env_model_r = null;; // environment model (s,a) -> (s',r)
  L.env = env; // store pointer to environment
  TDAgent.code.reset(L);
  return L;
}
TDAgent.code = {
  reset: function(L){
    // reset the agent's policy and value function
    L.ns = L.env.getNumStates();
    L.na = L.env.getMaxNumActions();
    L.Q = zeros(L.ns * L.na);
    if(L.q_init_val !== 0) { setConst(L.Q, L.q_init_val); }
    L.P = zeros(L.ns * L.na);
    L.e = zeros(L.ns * L.na);

    // model/planning vars
    L.env_model_s = zeros(L.ns * L.na);
    setConst(L.env_model_s, -1); // init to -1 so we can test if we saw the state before
    L.env_model_r = zeros(L.ns * L.na);
    L.sa_seen = [];
    L.pq = zeros(L.ns * L.na);

    // initialize uniform random policy
    for(var s=0;s<L.ns;s++) {
      var poss = L.env.allowedActions(s);
      for(var i=0,n=poss.length;i<n;i++) {
        L.P[poss[i]*L.ns+s] = 1.0 / poss.length;
      }
    }
    // agent memory, needed for streaming updates
    // (s0,a0,r0,s1,a1,r1,...)
    L.r0 = null;
    L.s0 = null;
    L.s1 = null;
    L.a0 = null;
    L.a1 = null;
  },
  resetEpisode: function(L) {
    // an episode finished
  },
  act: function(L,s){
    // act according to epsilon greedy policy
    var poss = L.env.allowedActions(s);
    var probs = [];
    for(var i=0,n=poss.length;i<n;i++) {
      probs.push(L.P[poss[i]*L.ns+s]);
    }
    // epsilon greedy policy
    if(Math.random() < L.epsilon) {
      var a = poss[randi(0,poss.length)]; // random available action
      L.explored = true;
    } else {
      var a = poss[sampleWeighted(probs)];
      L.explored = false;
    }
    // shift state memory
    L.s0 = L.s1;
    L.a0 = L.a1;
    L.s1 = s;
    L.a1 = a;
    return a;
  },
  learn: function(L,r1){
    // takes reward for previous action, which came from a call to act()
    if(!(L.r0 == null)) {
      TDAgent.code.learnFromTuple(L, L.s0, L.a0, L.r0, L.s1, L.a1, L.lambda);
      if(L.planN > 0) {
        TDAgent.code.updateModel(L, L.s0, L.a0, L.r0, L.s1);
        TDAgent.code.plan(L);
      }
    }
    L.r0 = r1; // store this for next update
  },
  updateModel: function(L, s0, a0, r0, s1) {
    // transition (s0,a0) -> (r0,s1) was observed. Update environment model
    var sa = a0 * L.ns + s0;
    if(L.env_model_s[sa] === -1) {
      // first time we see this state action
      L.sa_seen.push(a0 * L.ns + s0); // add as seen state
    }
    L.env_model_s[sa] = s1;
    L.env_model_r[sa] = r0;
  },
  plan: function(L) {

    // order the states based on current priority queue information
    var spq = [];
    for(var i=0,n=L.sa_seen.length;i<n;i++) {
      var sa = L.sa_seen[i];
      var sap = L.pq[sa];
      if(sap > 1e-5) { // gain a bit of efficiency
        spq.push({sa:sa, p:sap});
      }
    }
    spq.sort(function(a,b){ return a.p < b.p ? 1 : -1});

    // perform the updates
    var nsteps = Math.min(L.planN, spq.length);
    for(var k=0;k<nsteps;k++) {
      // random exploration
      //var i = randi(0, this.sa_seen.length); // pick random prev seen state action
      //var s0a0 = this.sa_seen[i];
      var s0a0 = spq[k].sa;
      L.pq[s0a0] = 0; // erase priority, since we're backing up this state
      var s0 = s0a0 % L.ns;
      var a0 = Math.floor(s0a0 / L.ns);
      var r0 = L.env_model_r[s0a0];
      var s1 = L.env_model_s[s0a0];
      var a1 = -1; // not used for Q learning
      if(L.update === 'sarsa') {
        // generate random action?...
        var poss = L.env.allowedActions(s1);
        var a1 = poss[randi(0,poss.length)];
      }
      TDAgent.code.learnFromTuple(L, s0, a0, r0, s1, a1, 0); // note lambda = 0 - shouldnt use eligibility trace here
    }
  },
  learnFromTuple: function(L, s0, a0, r0, s1, a1, lambda) {
    var sa = a0 * L.ns + s0;

    // calculate the target for Q(s,a)
    if(L.update === 'qlearn') {
      // Q learning target is Q(s0,a0) = r0 + gamma * max_a Q[s1,a]
      var poss = L.env.allowedActions(s1);
      var qmax = 0;
      for(var i=0,n=poss.length;i<n;i++) {
        var s1a = poss[i] * L.ns + s1;
        var qval = L.Q[s1a];
        if(i === 0 || qval > qmax) { qmax = qval; }
      }
      var target = r0 + L.gamma * qmax;
    } else if(L.update === 'sarsa') {
      // SARSA target is Q(s0,a0) = r0 + gamma * Q[s1,a1]
      var s1a1 = a1 * L.ns + s1;
      var target = r0 + L.gamma * L.Q[s1a1];
    }

    if(lambda > 0) {
      // perform an eligibility trace update
      if(L.replacing_traces) {
        L.e[sa] = 1;
      } else {
        L.e[sa] += 1;
      }
      var edecay = lambda * L.gamma;
      var state_update = zeros(L.ns);
      for(var s=0;s<L.ns;s++) {
        var poss = L.env.allowedActions(s);
        for(var i=0;i<poss.length;i++) {
          var a = poss[i];
          var saloop = a * L.ns + s;
          var esa = L.e[saloop];
          var update = L.alpha * esa * (target - L.Q[saloop]);
          L.Q[saloop] += update;
          L.updatePriority(s, a, update);
          L.e[saloop] *= edecay;
          var u = Math.abs(update);
          if(u > state_update[s]) { state_update[s] = u; }
        }
      }
      for(var s=0;s<L.ns;s++) {
        if(state_update[s] > 1e-5) { // save efficiency here
          TDAgent.code.updatePolicy(L,s);
        }
      }
      if(L.explored && L.update === 'qlearn') {
        // have to wipe the trace since q learning is off-policy :(
        L.e = zeros(L.ns * L.na);
      }
    } else {
      // simpler and faster update without eligibility trace
      // update Q[sa] towards it with some step size
      var update = L.alpha * (target - L.Q[sa]);
      L.Q[sa] += update;
      TDAgent.code.updatePriority(L,s0, a0, update);
      // update the policy to reflect the change (if appropriate)
      TDAgent.code.updatePolicy(L,s0);
    }
  },
  updatePriority: function(L,s,a,u) {
    // used in planning. Invoked when Q[sa] += update
    // we should find all states that lead to (s,a) and upgrade their priority
    // of being update in the next planning step
    u = Math.abs(u);
    if(u < 1e-5) { return; } // for efficiency skip small updates
    if(L.planN === 0) { return; } // there is no planning to be done, skip.
    for(var si=0;si<L.ns;si++) {
      // note we are also iterating over impossible actions at all states,
      // but this should be okay because their env_model_s should simply be -1
      // as initialized, so they will never be predicted to point to any state
      // because they will never be observed, and hence never be added to the model
      for(var ai=0;ai<L.na;ai++) {
        var siai = ai * L.ns + si;
        if(L.env_model_s[siai] === s) {
          // this state leads to s, add it to priority queue
          L.pq[siai] += u;
        }
      }
    }
  },
  updatePolicy: function(L,s) {
    var poss = L.env.allowedActions(s);
    // set policy at s to be the action that achieves max_a Q(s,a)
    // first find the maxy Q values
    var qmax, nmax;
    var qs = [];
    for(var i=0,n=poss.length;i<n;i++) {
      var a = poss[i];
      var qval = L.Q[a*L.ns+s];
      qs.push(qval);
      if(i === 0 || qval > qmax) { qmax = qval; nmax = 1; }
      else if(qval === qmax) { nmax += 1; }
    }
    // now update the policy smoothly towards the argmaxy actions
    var psum = 0.0;
    for(var i=0,n=poss.length;i<n;i++) {
      var a = poss[i];
      var target = (qs[i] === qmax) ? 1.0/nmax : 0.0;
      var ix = a*L.ns+s;
      if(L.smooth_policy_update) {
        // slightly hacky :p
        L.P[ix] += L.beta * (target - L.P[ix]);
        psum += L.P[ix];
      } else {
        // set hard target
        L.P[ix] = target;
      }
    }
    if(L.smooth_policy_update) {
      // renomalize P if we're using smooth policy updates
      for(var i=0,n=poss.length;i<n;i++) {
        var a = poss[i];
        L.P[a*L.ns+s] /= psum;
      }
    }
  }
}


var DQNAgent = function(env, opt) {
  var L = {}
  L.gamma = getopt(opt, 'gamma', 0.75); // future reward discount factor
  L.epsilon = getopt(opt, 'epsilon', 0.1); // for epsilon-greedy policy
  L.alpha = getopt(opt, 'alpha', 0.01); // value function learning rate

  L.experience_add_every = getopt(opt, 'experience_add_every', 25); // number of time steps before we add another experience to replay memory
  L.experience_size = getopt(opt, 'experience_size', 5000); // size of experience replay
  L.learning_steps_per_iteration = getopt(opt, 'learning_steps_per_iteration', 10);
  L.tderror_clamp = getopt(opt, 'tderror_clamp', 1.0); 

  L.num_hidden_units =  getopt(opt, 'num_hidden_units', 100); 

  L.env = env;
  DQNAgent.code.reset(L);
  return L
}
DQNAgent.code = {
  reset: function(L) {
    L.nh = L.num_hidden_units; // number of hidden units
    L.ns = L.env.getNumStates();
    L.na = L.env.getMaxNumActions();

    // nets are hardcoded for now as key (str) -> Mat
    // not proud of this. better solution is to have a whole Net object
    // on top of Mats, but for now sticking with this
    L.net = {};
    L.net.W1 = R.RandMat(L.nh, L.ns, 0, 0.01);
    L.net.b1 = R.Mat(L.nh, 1, 0, 0.01);
    L.net.W2 = R.RandMat(L.na, L.nh, 0, 0.01);
    L.net.b2 = R.Mat(L.na, 1, 0, 0.01);

    L.exp = []; // experience
    L.expi = 0; // where to insert

    L.t = 0;

    L.r0 = null;
    L.s0 = null;
    L.s1 = null;
    L.a0 = null;
    L.a1 = null;

    L.tderror = 0; // for visualization only...
  },
  toJSON: function(L) {
    // save function
    var j = {};
    j.nh = L.nh;
    j.ns = L.ns;
    j.na = L.na;
    j.net = R.netToJSON(L.net);
    return j;
  },
  fromJSON: function(L,j) {
    // load function
    L.nh = j.nh;
    L.ns = j.ns;
    L.na = j.na;
    L.net = R.netFromJSON(j.net);
  },
  forwardQ: function(L, net, s, needs_backprop) {
    var G = R.Graph(needs_backprop);
    var a1mat = Graph.code.add(G,Graph.code.mul(G,net.W1, s), net.b1);
    var h1mat = Graph.code.tanh(G,a1mat);
    var a2mat = Graph.code.add(G,Graph.code.mul(G,net.W2, h1mat), net.b2);
    L.lastG = G; // back this up. Kind of hacky isn't it
    return a2mat;
  },
  act: function(L,slist) {
    // convert to a Mat column vector
    var s = R.Mat(L.ns, 1);
    Mat.code.setFrom(s,slist);

    // epsilon greedy policy
    if(Math.random() < L.epsilon) {
      var a = randi(0, L.na);
    } else {
      // greedy wrt Q function
      var amat = DQNAgent.code.forwardQ(L,L.net, s, false);
      var a = R.maxi(amat.w); // returns index of argmax action
    }

    // shift state memory
    L.s0 = L.s1;
    L.a0 = L.a1;
    L.s1 = s;
    L.a1 = a;

    return a;
  },
  learn: function(L,r1) {
    // perform an update on Q function
    if(!(L.r0 == null) && L.alpha > 0) {

      // learn from this tuple to get a sense of how "surprising" it is to the agent
      var tderror = DQNAgent.code.learnFromTuple(L, L.s0, L.a0, L.r0, L.s1, L.a1);
      L.tderror = tderror; // a measure of surprise
      // decide if we should keep this experience in the replay
      if(L.t % L.experience_add_every === 0) {
        L.exp[L.expi] = [L.s0, L.a0, L.r0, L.s1, L.a1];
        L.expi += 1;
        if(L.expi > L.experience_size) { L.expi = 0; } // roll over when we run out
      }
      L.t += 1;

      // sample some additional experience from replay memory and learn from it
      for(var k=0;k<L.learning_steps_per_iteration;k++) {
        var ri = randi(0, L.exp.length); // todo: priority sweeps?
        var e = L.exp[ri];
        DQNAgent.code.learnFromTuple(L, e[0], e[1], e[2], e[3], e[4])
      }
    }
    L.r0 = r1; // store for next update
  },
  learnFromTuple: function(L, s0, a0, r0, s1, a1) {
    // want: Q(s,a) = r + gamma * max_a' Q(s',a')

    // compute the target Q value
    var tmat = DQNAgent.code.forwardQ(L, L.net, s1, false);
    var qmax = r0 + L.gamma * tmat.w[R.maxi(tmat.w)];

    // now predict
    var pred = DQNAgent.code.forwardQ(L, L.net, s0, true);

    var tderror = pred.w[a0] - qmax;
    var clamp = L.tderror_clamp;
    if(Math.abs(tderror) > clamp) {  // huber loss to robustify
      if(tderror > clamp) tderror = clamp;
      if(tderror < -clamp) tderror = -clamp;
    }
    pred.dw[a0] = tderror;

    Graph.code.backward( L.lastG); // compute gradients on net params

    // update net
    R.updateNet(L.net, L.alpha);
    return tderror;
  }
}



// exports
module.exports.DPAgent = DPAgent;
module.exports.TDAgent = TDAgent;
module.exports.DQNAgent = DQNAgent;
//module.exports.SimpleReinforceAgent = SimpleReinforceAgent;
//module.exports.RecurrentReinforceAgent = RecurrentReinforceAgent;
//module.exports.DeterministPG = DeterministPG;


};
BundleModuleCode['ml/stats']=function (module,exports,global,process){
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
 **    $CREATED:     (C) 2006-2019 bLAB by sbosse
 **    $VERSION:     1.1.5
 **
 **    $INFO:
 **
 **  ML Data Statistics and Utils 
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');

///////// UTILS ////////////
var stat = {
	max: function(array) {
		return Math.max.apply(null, array);
	},
	
	min: function(array) {
		return Math.min.apply(null, array);
	},
	
	range: function(array) {
		return stat.max(array) - stat.min(array);
	},
	
	midrange: function(array) {
		return stat.range(array) / 2;
	},

	sum: function(array) {
		var num = 0;
		for (var i = 0, l = array.length; i < l; i++) num += array[i];
		return num;
	},
	
	mean: function(array) {
		return stat.sum(array) / array.length;
	},
	
	median: function(array) {
		array.sort(function(a, b) {
			return a - b;
		});
		var mid = array.length / 2;
		return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
	},
	
	modes: function(array) {
		if (!array.length) return [];
		var modeMap = {},
			maxCount = 0,
			modes = [];

		array.forEach(function(val) {
			if (!modeMap[val]) modeMap[val] = 1;
			else modeMap[val]++;

			if (modeMap[val] > maxCount) {
				modes = [val];
				maxCount = modeMap[val];
			}
			else if (modeMap[val] === maxCount) {
				modes.push(val);
				maxCount = modeMap[val];
			}
		});
		return modes;
	},
	
	variance: function(array) {
		var mean = stat.mean(array);
		return stat.mean(array.map(function(num) {
			return Math.pow(num - mean, 2);
		}));
	},
	
	standardDeviation: function(array) {
		return Math.sqrt(stat.variance(array));
	},
	
	meanAbsoluteDeviation: function(array) {
		var mean = stat.mean(array);
		return stat.mean(array.map(function(num) {
			return Math.abs(num - mean);
		}));
	},
	
	zScores: function(array) {
		var mean = stat.mean(array);
		var standardDeviation = stat.standardDeviation(array);
		return array.map(function(num) {
			return (num - mean) / standardDeviation;
		});
	}
};

// Function aliases:
stat.average = stat.mean;

// function ({$x:number}|{value:*,prob;number}[]|number [],boolean) 
// -> {value:*,prob:number}|{index:number, prob:number}
// normalize=1: scale output max=[0,1]
// normalize=2: scale and weight output max*[0,1]

function best(o,normalize) {
  var p,max,pos=0,sum=0,res;
  if (Comp.obj.isArray(o) && typeof o[0]=='number')  {
    max=-Infinity;
    for(p in o) {
      sum += o[p];       
      if (o[p] > max) max=o[p],pos=p;
    }  
    res = {index:pos,prob:max}   
  } else if (Comp.obj.isArray(o) && typeof o[0]=='object')  {
    for(p in o) {
      sum += o[p].prob; 
      if (!max || o[p].prob>max.prob) max=o[p];
    }
    res = {value:max.value,prob:max.prob}
  } else if (Comp.obj.isObj(o)) {
    max=-Infinity;
    for(p in o) {
      sum += o[p];
      if (o[p]>max) max=o[p],pos=p;
    }
    res = {value:pos,prob:max}      
  }
  if (!res) return;
  switch (normalize) {
    case 1: res.prob=res.prob/sum; break;
    case 2: res.prob=res.prob*(res.prob/sum); break;
    default: 
  }
  return res;
}
function bestNormalize(o) { return best(o,1) }


function log2(n) {
  return Math.log(n) / Math.log(2);
}

function max(array,fun) {        
    var res,max,num;
    for(var i in array) {
        if (fun) num=fun(array[i]); else num=array[i];
        if (max==undefined) { max=num; res=array[i] } 
        else if (num > max) { max=num; res=array[i] }
    }
    return res;
}

/**
 * Finds element with highest occurrence in a list
 * @private
 */
function mostCommon(list) {
  var elementFrequencyMap = {};
  var largestFrequency = -1;
  var mostCommonElement = null;
  list.forEach(function(element) {
    var elementFrequency = (elementFrequencyMap[element] || 0) + 1;
    elementFrequencyMap[element] = elementFrequency;

    if (largestFrequency < elementFrequency) {
      mostCommonElement = element;
      largestFrequency = elementFrequency;
    }
  });

  return mostCommonElement;
}


function pluck(collection, key) {
  return collection.map(function(object) {
    return object == null ? undefined : object[key];
  });
}

function prob(value, list) {
  var occurrences = list.filter(function(element) {
    return element === value
  });

  var numOccurrences = occurrences.length;
  var numElements = list.length;
  return numOccurrences / numElements;
}

function sort(array) {
  return array.sort(function (a,b) { return a<b?-1:1 });
}

function sum (a,b) { return a+b }

function unique(array) {
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
}

function without () {
  var array,
      values=[];
  for(var i in arguments) {
    if (i==0) array=arguments[0];
    else values.push(arguments[i]);
  }
  return array.filter(function (e) {
    return values.indexOf(e) == -1;
  });
}


////////////////////////////////////////

function entropy(vals) {
  var uniqueVals = unique(vals);
  var probs = uniqueVals.map(function(x) {
    return prob(x, vals)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(sum,0);
}

function entropyN(dist,N) {
  var p, probs=[];
  for(p in dist) probs.push(dist[p]/N);
  var logVals = probs.map(function(p) {
    return p==0?0:-p * log2(p)
  });
  return logVals.reduce(sum, 0);
  
}

function entropyEps(vals,eps) {
  var uniqueVals = uniqueEps(vals,eps);
  var probs = uniqueVals.map(function(x) {
    return probEps(x, vals, eps)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(sum, 0);
}

function entropyTEps(data,feature,target,targets,eps) {
  var en = 0;
  var col =  pluck(data,feature);
  var uniqueVals = uniqueEps(col,eps);
  uniqueVals.forEach(function (v) {
    var frac = targets.map(function () { return 0 }),
        cn=0;
    col.forEach (function (v2,row) {
      if (v2>=v-eps && v2<=v+eps) cn++,frac[targets.indexOf(data[row][target])]++;
    })
    var p = cn/data.length;
    en += (p*entropyN(frac,frac.reduce(sum)))
    // print(frac,p,frac.reduce(sum))
  })
  return en;
}

function features (data,target) {
  var f;
  if (Comp.obj.isObj(data[0])) 
    f=Object.keys(data[0]);
  else if (Comp.obj.isArray(data[0]))
    f=data[0].map(function (x,i) { return String(i) });
  if (f && target) delete f[target];
  return f;
}

function gainEps(data,feature,target,targets,eps) {
  var et = entropy(pluck(data,target));
  return et/entropyTEps(data,feature,target,targets,eps)
}


function maxGainEps(data,features,target,targets,eps) {
  var maxgain=max(features, function(feature) {
    var g = gainEps(data,feature,target,targets,eps);
    return g;
  });
  return maxgain;
}

function partition(data,feature,target,targets) {
  var parts={};
  targets.forEach(function (t) {parts[t]=[]});
  data.forEach(function (row) {
    parts[row[target]].push(row[feature]);
  })
  return parts
}

function partitionEps(data,feature,target,targets,eps) {
  var p,parts={}
  targets.forEach(function (t) {parts[t]={range:[Number.MAX_VALUE,-Number.MAX_VALUE],values:[]}});
  data.forEach(function (row) {
    parts[row[target]].values.push(row[feature]);
    parts[row[target]].range[0]=Math.min(parts[row[target]].range[0],row[feature]);
    parts[row[target]].range[1]=Math.max(parts[row[target]].range[1],row[feature]);
  })
  for(p in parts) {
    parts[p].unique=uniqueEps(parts[p].values,eps)
    parts[p].noise=2*stat.standardDeviation(parts[p].values);
  }
  return parts
}

// Return only eps-not-overlapping parititions - the most significant are selected 
// (with the lowest unique column values) 
function partitionUniqueEps(data,feature,target,targets,eps) {
  var p, q, parts={}
  // 1. Create all partitions 
  targets.forEach(function (t) {parts[t]={range:[Number.MAX_VALUE,-Number.MAX_VALUE],values:[]}});
  data.forEach(function (row) {
    parts[row[target]].values.push(row[feature]);
    parts[row[target]].range[0]=Math.min(parts[row[target]].range[0],row[feature]);
    parts[row[target]].range[1]=Math.max(parts[row[target]].range[1],row[feature]);
  })
  for(p in parts) {
    parts[p].unique=uniqueEps(parts[p].values,eps)
  }
  // 2. Remove overlapping partitions
  for(p in parts) {
    if (!parts[p]) continue;
    for (q in parts) {
      if (!parts[p]) break;
      if (p==q || !parts[q]) continue;
      if ((parts[p].range[0]-eps)<parts[q].range[1] ||
          (parts[p].range[1]+eps)>parts[q].range[0]) {
        // overlapping, select the part with best unique column values
        if ((parts[p].unique.length/parts[p].values.length)<
            (parts[q].unique.length/parts[q].values.length)) {
          //print('delete '+q)
          delete parts[q];
        } else {
          //print('delete '+p)
          delete parts[p];
        }
      }
    }
  }  
  return parts
}

function select (data,what) {
  if (Comp.obj.isArray(what) && what.length==2) {
    var c0=what[0],c1=what[1];
    return data.map(function (row) {
      return row.slice(c0,c1+1);
    })
  } 
}

/** Split a data set by finding the best feature (column) 
 *  based on maximal gain/entropy calculation of columns. 
 *  TODO: independent eps for each feature variable (typeof @eps=number [])
 */

function splitEps (data,features,target,targets,eps) {
  var bestFeature = maxGainEps(data,features,target,targets,eps);
  var remainingFeatures = without(features, bestFeature);
  var possibleValues = sort(uniqueEps(pluck(data, bestFeature),eps));
  var choices = possibleValues.map( function(v) {
    var dataS = data.filter(function(x) {
      return Math.abs(x[bestFeature] - v) <= eps
    });
    return {
      val:v,
      data:dataS,
    }
  });
  return {
    feature:bestFeature,
    choices:choices,
    possibleValues:possibleValues,
    remainingFeatures:remainingFeatures
  };
}

function uniqueEps(array,eps) {
  var result=[];
  array.forEach(function (x) {
    var found;
    if (!result.length) result.push(x);
    else {
      result.forEach(function (y) {
        if (found) return;
        found = Math.abs(x-y)<=eps;
      }); 
      if (!found) result.push(x);
    }
  });
  return result;
}



module.exports =  {
  analyze : function (data,features,target,eps) {
    var noise=[];
    if (!eps) eps=0;
    var targets = unique(pluck(data,target));
    var parts = {}, partsUnique = {},diversity={}
    features.forEach(function (feature) {
      partsUnique[feature]=partitionUniqueEps(data,feature,target,targets,eps);
      parts[feature]=partitionEps(data,feature,target,targets,eps);
      for(var p in parts[feature]) noise.push(parts[feature][p].noise);
    })
    features.forEach(function (feature) {
      diversity[feature]=Object.keys(partsUnique[feature]).length;
    })
   
    return {
      features:features,
      partitions:parts, // for each data column
      diversity:diversity,
      noise:stat.mean(noise)
    }
  },
  entropy:entropy,
  entropyN:entropyN,
  entropyEps:entropyEps,
  entropyTEps:entropyTEps,
  features:features,
  gainEps:gainEps,
  maxGainEps:maxGainEps,
  mostCommon:mostCommon,
  partition:partition,
  partitionEps:partitionEps,
  partitionUniqueEps:partitionUniqueEps,
  splitEps:splitEps,
  unique:unique,
  uniqueEps:uniqueEps,
  utils : {
    // return column by key of a matrix (array array|record array) 
    best:best,
    bestNormalize:bestNormalize,
    column:pluck,
    log2:log2,
    prob:prob,
    select:select,
    sort:sort,
    stat:stat,
    without:without,
  },
};

};
BundleModuleCode['ml/cnn']=function (module,exports,global,process){
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
 **    $CREATED:     (C) 2006-2019 bLAB by sbosse
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 ** Convolutional neural network ML Algorithm
 **
 ** Incremental learner using ml.update! Initial training data via ml.learn (or empty data set) 
 ** 
 **    $ENDOFINFO
 */
'use strict';
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;

var convnetjs = Require('ml/convnet')
var that;

that = module.exports =  {
  // typeof options = {x:[][],y:[],width,height,depth,normalize?:[a,b],layers:{}[]..}
  // format x = [ [row1=[col1=[z1,z2,..],col2,..],row2,..] ]
  create : function (options) {
    var net = new convnetjs.Net();
    if (options.layers)
      net.makeLayers(options.layers);
    if (!options.iterations) options.iterations=10;
    if (!options.depth) options.depth=1;
    if (!options.width) options.width=options.x[0].length,options.height=1;
    var trainer = new convnetjs.SGDTrainer(net, options.trainer||
                                          {method: 'adadelta', 
                                          l2_decay: 0.001, 
                                          batch_size: 10});
    // convert matrix (2dim/3dim) to volume elements
    var x = options.x;
    if (options.normalize) {
      var a,b,
          c=options.normalize[0],
          d=options.normalize[1];
      x.forEach(function (row) {
        var min=Math.min.apply(null,row),
            max=Math.max.apply(null,row);
        if (a==undefined) a=min; else a=Math.min(a,min);
        if (b==undefined) b=max; else b=Math.max(b,max);        
      })
      x=x.map(function (row) {
        return row.map(function (col) { return (((col-a)/(b-a))*(d-c))+c })  // scale [0,1] -> [c,d]
      })
    }
    x=x.map(function (row) {
      var vol = new convnetjs.Vol(options.width, options.height, options.depth, 0.0); //input volume (image)
      vol.w = row;
      return vol;
    });
    x.forEach (function (row) {
      //net.forward(row);
    })
    var y = options.y;
    if (!options.targets) {
      options.targets=that.ml.stats.unique(y);
    }
    for(var iters=0;iters<options.iterations;iters++) {
      y.forEach(function (v,i) {
        trainer.train(x[i],options.targets.indexOf(v));
      })
    }
    trainer.options= {width:options.width,height:options.height,depth:options.depth,targets:options.targets};
    return trainer;
  },
  ml:{},
  predict: function (model,sample) {
    var options = model.options;
    var vol = new convnetjs.Vol(options.width, options.height, options.depth, 0.0); //input volume (image)
    vol.w = sample;
    return model.net.forward(vol);
  },
  print: function () {
  },
  update: function (data) {
  },
  current:function (module) { current=module.current; Aios=module;}
};
};
BundleModuleCode['ml/convnet']=function (module,exports,global,process){

/*** https://github.com/karpathy/convnetjs ***/

var convnet={REVISION: 'ALPHA'}
module.exports=convnet;
"use strict";

/*** convnet_util ***/
  // Random number utilities
  var return_v = false;
  var v_val = 0.0;
  var gaussRandom = function() {
    if(return_v) { 
      return_v = false;
      return v_val; 
    }
    var u = 2*Math.random()-1;
    var v = 2*Math.random()-1;
    var r = u*u + v*v;
    if(r == 0 || r > 1) return gaussRandom();
    var c = Math.sqrt(-2*Math.log(r)/r);
    v_val = v*c; // cache this
    return_v = true;
    return u*c;
  }
  var randf = function(a, b) { return Math.random()*(b-a)+a; }
  var randi = function(a, b) { return Math.floor(Math.random()*(b-a)+a); }
  var randn = function(mu, std){ return mu+gaussRandom()*std; }

  // Array utilities
  var zeros = function(n) {
    if(typeof(n)==='undefined' || isNaN(n)) { return []; }
    if(typeof ArrayBuffer === 'undefined') {
      // lacking browser support
      var arr = new Array(n);
      for(var i=0;i<n;i++) { arr[i]= 0; }
      return arr;
    } else {
      return new Float64Array(n);
    }
  }

  var arrContains = function(arr, elt) {
    for(var i=0,n=arr.length;i<n;i++) {
      if(arr[i]===elt) return true;
    }
    return false;
  }

  var arrUnique = function(arr) {
    var b = [];
    for(var i=0,n=arr.length;i<n;i++) {
      if(!arrContains(b, arr[i])) {
        b.push(arr[i]);
      }
    }
    return b;
  }

  // return max and min of a given non-empty array.
  var maxmin = function(w) {
    if(w.length === 0) { return {}; } // ... ;s
    var maxv = w[0];
    var minv = w[0];
    var maxi = 0;
    var mini = 0;
    var n = w.length;
    for(var i=1;i<n;i++) {
      if(w[i] > maxv) { maxv = w[i]; maxi = i; } 
      if(w[i] < minv) { minv = w[i]; mini = i; } 
    }
    return {maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv:maxv-minv};
  }

  // create random permutation of numbers, in range [0...n-1]
  var randperm = function(n) {
    var i = n,
        j = 0,
        temp;
    var array = [];
    for(var q=0;q<n;q++)array[q]=q;
    while (i--) {
        j = Math.floor(Math.random() * (i+1));
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
  }

  // sample from list lst according to probabilities in list probs
  // the two lists are of same size, and probs adds up to 1
  var weightedSample = function(lst, probs) {
    var p = randf(0, 1.0);
    var cumprob = 0.0;
    for(var k=0,n=lst.length;k<n;k++) {
      cumprob += probs[k];
      if(p < cumprob) { return lst[k]; }
    }
  }

  // syntactic sugar function for getting default parameter values
  var getopt = function(opt, field_name, default_value) {
    if(typeof field_name === 'string') {
      // case of single string
      return (typeof opt[field_name] !== 'undefined') ? opt[field_name] : default_value;
    } else {
      // assume we are given a list of string instead
      var ret = default_value;
      for(var i=0;i<field_name.length;i++) {
        var f = field_name[i];
        if (typeof opt[f] !== 'undefined') {
          ret = opt[f]; // overwrite return value
        }
      }
      return ret;
    }
  }

  function assert(condition, message) {
    if (!condition) {
      message = message || "Assertion failed";
      if (typeof Error !== "undefined") {
        throw new Error(message);
      }
      throw message; // Fallback
    }
  }

  convnet.randf = randf;
  convnet.randi = randi;
  convnet.randn = randn;
  convnet.zeros = zeros;
  convnet.maxmin = maxmin;
  convnet.randperm = randperm;
  convnet.weightedSample = weightedSample;
  convnet.arrUnique = arrUnique;
  convnet.arrContains = arrContains;
  convnet.getopt = getopt;
  convnet.assert = assert;

/*** convnet_vol ***/
 // Vol is the basic building block of all data in a net.
  // it is essentially just a 3D volume of numbers, with a
  // width (sx), height (sy), and depth (depth).
  // it is used to hold data for all filters, all volumes,
  // all weights, and also stores all gradients w.r.t. 
  // the data. c is optionally a value to initialize the volume
  // with. If c is missing, fills the Vol with random numbers.
  var Vol = function(sx, sy, depth, c) {
    // this is how you check if a variable is an array. Oh, Javascript :)
    if(Object.prototype.toString.call(sx) === '[object Array]') {
      // we were given a list in sx, assume 1D volume and fill it up
      this.sx = 1;
      this.sy = 1;
      this.depth = sx.length;
      // we have to do the following copy because we want to use
      // fast typed arrays, not an ordinary javascript array
      this.w = convnet.zeros(this.depth);
      this.dw = convnet.zeros(this.depth);
      for(var i=0;i<this.depth;i++) {
        this.w[i] = sx[i];
      }
    } else {
      // we were given dimensions of the vol
      this.sx = sx;
      this.sy = sy;
      this.depth = depth;
      var n = sx*sy*depth;
      this.w = convnet.zeros(n);
      this.dw = convnet.zeros(n);
      if(typeof c === 'undefined') {
        // weight normalization is done to equalize the output
        // variance of every neuron, otherwise neurons with a lot
        // of incoming connections have outputs of larger variance
        var scale = Math.sqrt(1.0/(sx*sy*depth));
        for(var i=0;i<n;i++) { 
          this.w[i] = convnet.randn(0.0, scale);
        }
      } else {
        for(var i=0;i<n;i++) { 
          this.w[i] = c;
        }
      }
    }
  }

  Vol.prototype = {
    get: function(x, y, d) { 
      var ix=((this.sx * y)+x)*this.depth+d;
      return this.w[ix];
    },
    set: function(x, y, d, v) { 
      var ix=((this.sx * y)+x)*this.depth+d;
      this.w[ix] = v; 
    },
    add: function(x, y, d, v) { 
      var ix=((this.sx * y)+x)*this.depth+d;
      this.w[ix] += v; 
    },
    get_grad: function(x, y, d) { 
      var ix = ((this.sx * y)+x)*this.depth+d;
      return this.dw[ix]; 
    },
    set_grad: function(x, y, d, v) { 
      var ix = ((this.sx * y)+x)*this.depth+d;
      this.dw[ix] = v; 
    },
    add_grad: function(x, y, d, v) { 
      var ix = ((this.sx * y)+x)*this.depth+d;
      this.dw[ix] += v; 
    },
    cloneAndZero: function() { return new Vol(this.sx, this.sy, this.depth, 0.0)},
    clone: function() {
      var V = new Vol(this.sx, this.sy, this.depth, 0.0);
      var n = this.w.length;
      for(var i=0;i<n;i++) { V.w[i] = this.w[i]; }
      return V;
    },
    addFrom: function(V) { for(var k=0;k<this.w.length;k++) { this.w[k] += V.w[k]; }},
    addFromScaled: function(V, a) { for(var k=0;k<this.w.length;k++) { this.w[k] += a*V.w[k]; }},
    setConst: function(a) { for(var k=0;k<this.w.length;k++) { this.w[k] = a; }},

    toJSON: function() {
      // todo: we may want to only save d most significant digits to save space
      var json = {}
      json.sx = this.sx; 
      json.sy = this.sy;
      json.depth = this.depth;
      json.w = this.w;
      return json;
      // we wont back up gradients to save space
    },
    fromJSON: function(json) {
      this.sx = json.sx;
      this.sy = json.sy;
      this.depth = json.depth;

      var n = this.sx*this.sy*this.depth;
      this.w = convnet.zeros(n);
      this.dw = convnet.zeros(n);
      // copy over the elements.
      for(var i=0;i<n;i++) {
        this.w[i] = json.w[i];
      }
    }
  }

  convnet.Vol = Vol;

/*** convnet_vol_util ***/
  var Vol = convnet.Vol; // convenience

  // Volume utilities
  // intended for use with data augmentation
  // crop is the size of output
  // dx,dy are offset wrt incoming volume, of the shift
  // fliplr is boolean on whether we also want to flip left<->right
  var augment = function(V, crop, dx, dy, fliplr) {
    // note assumes square outputs of size crop x crop
    if(typeof(fliplr)==='undefined') var fliplr = false;
    if(typeof(dx)==='undefined') var dx = convnet.randi(0, V.sx - crop);
    if(typeof(dy)==='undefined') var dy = convnet.randi(0, V.sy - crop);
    
    // randomly sample a crop in the input volume
    var W;
    if(crop !== V.sx || dx!==0 || dy!==0) {
      W = new Vol(crop, crop, V.depth, 0.0);
      for(var x=0;x<crop;x++) {
        for(var y=0;y<crop;y++) {
          if(x+dx<0 || x+dx>=V.sx || y+dy<0 || y+dy>=V.sy) continue; // oob
          for(var d=0;d<V.depth;d++) {
           W.set(x,y,d,V.get(x+dx,y+dy,d)); // copy data over
          }
        }
      }
    } else {
      W = V;
    }

    if(fliplr) {
      // flip volume horziontally
      var W2 = W.cloneAndZero();
      for(var x=0;x<W.sx;x++) {
        for(var y=0;y<W.sy;y++) {
          for(var d=0;d<W.depth;d++) {
           W2.set(x,y,d,W.get(W.sx - x - 1,y,d)); // copy data over
          }
        }
      }
      W = W2; //swap
    }
    return W;
  }

  // img is a DOM element that contains a loaded image
  // returns a Vol of size (W, H, 4). 4 is for RGBA
  var img_to_vol = function(img, convert_grayscale) {

    if(typeof(convert_grayscale)==='undefined') var convert_grayscale = false;

    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");

    // due to a Firefox bug
    try {
      ctx.drawImage(img, 0, 0);
    } catch (e) {
      if (e.name === "NS_ERROR_NOT_AVAILABLE") {
        // sometimes happens, lets just abort
        return false;
      } else {
        throw e;
      }
    }

    try {
      var img_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
      if(e.name === 'IndexSizeError') {
        return false; // not sure what causes this sometimes but okay abort
      } else {
        throw e;
      }
    }

    // prepare the input: get pixels and normalize them
    var p = img_data.data;
    var W = img.width;
    var H = img.height;
    var pv = []
    for(var i=0;i<p.length;i++) {
      pv.push(p[i]/255.0-0.5); // normalize image pixels to [-0.5, 0.5]
    }
    var x = new Vol(W, H, 4, 0.0); //input volume (image)
    x.w = pv;

    if(convert_grayscale) {
      // flatten into depth=1 array
      var x1 = new Vol(W, H, 1, 0.0);
      for(var i=0;i<W;i++) {
        for(var j=0;j<H;j++) {
          x1.set(i,j,0,x.get(i,j,0));
        }
      }
      x = x1;
    }

    return x;
  }
  
  convnet.augment = augment;
  convnet.img_to_vol = img_to_vol;


/*** convnet_layers_dotproducts ***/
  // This file contains all layers that do dot products with input,
  // but usually in a different connectivity pattern and weight sharing
  // schemes: 
  // - FullyConn is fully connected dot products 
  // - ConvLayer does convolutions (so weight sharing spatially)
  // putting them together in one file because they are very similar
  var ConvLayer = function(opt) {
    var opt = opt || {};

    // required
    this.out_depth = opt.filters;
    this.sx = opt.sx; // filter size. Should be odd if possible, it's cleaner.
    this.in_depth = opt.in_depth;
    this.in_sx = opt.in_sx;
    this.in_sy = opt.in_sy;
    
    // optional
    this.sy = typeof opt.sy !== 'undefined' ? opt.sy : this.sx;
    this.stride = typeof opt.stride !== 'undefined' ? opt.stride : 1; // stride at which we apply filters to input volume
    this.pad = typeof opt.pad !== 'undefined' ? opt.pad : 0; // amount of 0 padding to add around borders of input volume
    this.l1_decay_mul = typeof opt.l1_decay_mul !== 'undefined' ? opt.l1_decay_mul : 0.0;
    this.l2_decay_mul = typeof opt.l2_decay_mul !== 'undefined' ? opt.l2_decay_mul : 1.0;

    // computed
    // note we are doing floor, so if the strided convolution of the filter doesnt fit into the input
    // volume exactly, the output volume will be trimmed and not contain the (incomplete) computed
    // final application.
    this.out_sx = Math.floor((this.in_sx + this.pad * 2 - this.sx) / this.stride + 1);
    this.out_sy = Math.floor((this.in_sy + this.pad * 2 - this.sy) / this.stride + 1);
    this.layer_type = 'conv';

    // initializations
    var bias = typeof opt.bias_pref !== 'undefined' ? opt.bias_pref : 0.0;
    this.filters = [];
    for(var i=0;i<this.out_depth;i++) { this.filters.push(new Vol(this.sx, this.sy, this.in_depth)); }
    this.biases = new Vol(1, 1, this.out_depth, bias);
  }
  ConvLayer.prototype = {
    forward: function(V, is_training) {
      // optimized code by @mdda that achieves 2x speedup over previous version

      this.in_act = V;
      var A = new Vol(this.out_sx |0, this.out_sy |0, this.out_depth |0, 0.0);
      
      var V_sx = V.sx |0;
      var V_sy = V.sy |0;
      var xy_stride = this.stride |0;

      for(var d=0;d<this.out_depth;d++) {
        var f = this.filters[d];
        var x = -this.pad |0;
        var y = -this.pad |0;
        for(var ay=0; ay<this.out_sy; y+=xy_stride,ay++) {  // xy_stride
          x = -this.pad |0;
          for(var ax=0; ax<this.out_sx; x+=xy_stride,ax++) {  // xy_stride

            // convolve centered at this particular location
            var a = 0.0;
            for(var fy=0;fy<f.sy;fy++) {
              var oy = y+fy; // coordinates in the original input array coordinates
              for(var fx=0;fx<f.sx;fx++) {
                var ox = x+fx;
                if(oy>=0 && oy<V_sy && ox>=0 && ox<V_sx) {
                  for(var fd=0;fd<f.depth;fd++) {
                    // avoid function call overhead (x2) for efficiency, compromise modularity :(
                    a += f.w[((f.sx * fy)+fx)*f.depth+fd] * V.w[((V_sx * oy)+ox)*V.depth+fd];
                  }
                }
              }
            }
            a += this.biases.w[d];
            A.set(ax, ay, d, a);
          }
        }
      }
      this.out_act = A;
      return this.out_act;
    },
    backward: function() {

      var V = this.in_act;
      V.dw = convnet.zeros(V.w.length); // zero out gradient wrt bottom data, we're about to fill it

      var V_sx = V.sx |0;
      var V_sy = V.sy |0;
      var xy_stride = this.stride |0;

      for(var d=0;d<this.out_depth;d++) {
        var f = this.filters[d];
        var x = -this.pad |0;
        var y = -this.pad |0;
        for(var ay=0; ay<this.out_sy; y+=xy_stride,ay++) {  // xy_stride
          x = -this.pad |0;
          for(var ax=0; ax<this.out_sx; x+=xy_stride,ax++) {  // xy_stride

            // convolve centered at this particular location
            var chain_grad = this.out_act.get_grad(ax,ay,d); // gradient from above, from chain rule
            for(var fy=0;fy<f.sy;fy++) {
              var oy = y+fy; // coordinates in the original input array coordinates
              for(var fx=0;fx<f.sx;fx++) {
                var ox = x+fx;
                if(oy>=0 && oy<V_sy && ox>=0 && ox<V_sx) {
                  for(var fd=0;fd<f.depth;fd++) {
                    // avoid function call overhead (x2) for efficiency, compromise modularity :(
                    var ix1 = ((V_sx * oy)+ox)*V.depth+fd;
                    var ix2 = ((f.sx * fy)+fx)*f.depth+fd;
                    f.dw[ix2] += V.w[ix1]*chain_grad;
                    V.dw[ix1] += f.w[ix2]*chain_grad;
                  }
                }
              }
            }
            this.biases.dw[d] += chain_grad;
          }
        }
      }
    },
    getParamsAndGrads: function() {
      var response = [];
      for(var i=0;i<this.out_depth;i++) {
        response.push({params: this.filters[i].w, grads: this.filters[i].dw, l2_decay_mul: this.l2_decay_mul, l1_decay_mul: this.l1_decay_mul});
      }
      response.push({params: this.biases.w, grads: this.biases.dw, l1_decay_mul: 0.0, l2_decay_mul: 0.0});
      return response;
    },
    toJSON: function() {
      var json = {};
      json.sx = this.sx; // filter size in x, y dims
      json.sy = this.sy;
      json.stride = this.stride;
      json.in_depth = this.in_depth;
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.l1_decay_mul = this.l1_decay_mul;
      json.l2_decay_mul = this.l2_decay_mul;
      json.pad = this.pad;
      json.filters = [];
      for(var i=0;i<this.filters.length;i++) {
        json.filters.push(this.filters[i].toJSON());
      }
      json.biases = this.biases.toJSON();
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.sx = json.sx; // filter size in x, y dims
      this.sy = json.sy;
      this.stride = json.stride;
      this.in_depth = json.in_depth; // depth of input volume
      this.filters = [];
      this.l1_decay_mul = typeof json.l1_decay_mul !== 'undefined' ? json.l1_decay_mul : 1.0;
      this.l2_decay_mul = typeof json.l2_decay_mul !== 'undefined' ? json.l2_decay_mul : 1.0;
      this.pad = typeof json.pad !== 'undefined' ? json.pad : 0;
      for(var i=0;i<json.filters.length;i++) {
        var v = new Vol(0,0,0,0);
        v.fromJSON(json.filters[i]);
        this.filters.push(v);
      }
      this.biases = new Vol(0,0,0,0);
      this.biases.fromJSON(json.biases);
    }
  }

  var FullyConnLayer = function(opt) {
    var opt = opt || {};

    // required
    // ok fine we will allow 'filters' as the word as well
    this.out_depth = typeof opt.num_neurons !== 'undefined' ? opt.num_neurons : opt.filters;

    // optional 
    this.l1_decay_mul = typeof opt.l1_decay_mul !== 'undefined' ? opt.l1_decay_mul : 0.0;
    this.l2_decay_mul = typeof opt.l2_decay_mul !== 'undefined' ? opt.l2_decay_mul : 1.0;

    // computed
    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'fc';

    // initializations
    var bias = typeof opt.bias_pref !== 'undefined' ? opt.bias_pref : 0.0;
    this.filters = [];
    for(var i=0;i<this.out_depth ;i++) { this.filters.push(new Vol(1, 1, this.num_inputs)); }
    this.biases = new Vol(1, 1, this.out_depth, bias);
  }

  FullyConnLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      var A = new Vol(1, 1, this.out_depth, 0.0);
      var Vw = V.w;
      for(var i=0;i<this.out_depth;i++) {
        var a = 0.0;
        var wi = this.filters[i].w;
        for(var d=0;d<this.num_inputs;d++) {
          a += Vw[d] * wi[d]; // for efficiency use Vols directly for now
        }
        a += this.biases.w[i];
        A.w[i] = a;
      }
      this.out_act = A;
      return this.out_act;
    },
    backward: function() {
      var V = this.in_act;
      V.dw = convnet.zeros(V.w.length); // zero out the gradient in input Vol
      
      // compute gradient wrt weights and data
      for(var i=0;i<this.out_depth;i++) {
        var tfi = this.filters[i];
        var chain_grad = this.out_act.dw[i];
        for(var d=0;d<this.num_inputs;d++) {
          V.dw[d] += tfi.w[d]*chain_grad; // grad wrt input data
          tfi.dw[d] += V.w[d]*chain_grad; // grad wrt params
        }
        this.biases.dw[i] += chain_grad;
      }
    },
    getParamsAndGrads: function() {
      var response = [];
      for(var i=0;i<this.out_depth;i++) {
        response.push({params: this.filters[i].w, grads: this.filters[i].dw, l1_decay_mul: this.l1_decay_mul, l2_decay_mul: this.l2_decay_mul});
      }
      response.push({params: this.biases.w, grads: this.biases.dw, l1_decay_mul: 0.0, l2_decay_mul: 0.0});
      return response;
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.num_inputs = this.num_inputs;
      json.l1_decay_mul = this.l1_decay_mul;
      json.l2_decay_mul = this.l2_decay_mul;
      json.filters = [];
      for(var i=0;i<this.filters.length;i++) {
        json.filters.push(this.filters[i].toJSON());
      }
      json.biases = this.biases.toJSON();
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.num_inputs = json.num_inputs;
      this.l1_decay_mul = typeof json.l1_decay_mul !== 'undefined' ? json.l1_decay_mul : 1.0;
      this.l2_decay_mul = typeof json.l2_decay_mul !== 'undefined' ? json.l2_decay_mul : 1.0;
      this.filters = [];
      for(var i=0;i<json.filters.length;i++) {
        var v = new Vol(0,0,0,0);
        v.fromJSON(json.filters[i]);
        this.filters.push(v);
      }
      this.biases = new Vol(0,0,0,0);
      this.biases.fromJSON(json.biases);
    }
  }

  convnet.ConvLayer = ConvLayer;
  convnet.FullyConnLayer = FullyConnLayer;


/*** convnet_layers_pool ***/
  var PoolLayer = function(opt) {

    var opt = opt || {};

    // required
    this.sx = opt.sx; // filter size
    this.in_depth = opt.in_depth;
    this.in_sx = opt.in_sx;
    this.in_sy = opt.in_sy;

    // optional
    this.sy = typeof opt.sy !== 'undefined' ? opt.sy : this.sx;
    this.stride = typeof opt.stride !== 'undefined' ? opt.stride : 2;
    this.pad = typeof opt.pad !== 'undefined' ? opt.pad : 0; // amount of 0 padding to add around borders of input volume

    // computed
    this.out_depth = this.in_depth;
    this.out_sx = Math.floor((this.in_sx + this.pad * 2 - this.sx) / this.stride + 1);
    this.out_sy = Math.floor((this.in_sy + this.pad * 2 - this.sy) / this.stride + 1);
    this.layer_type = 'pool';
    // store switches for x,y coordinates for where the max comes from, for each output neuron
    this.switchx = convnet.zeros(this.out_sx*this.out_sy*this.out_depth);
    this.switchy = convnet.zeros(this.out_sx*this.out_sy*this.out_depth);
  }

  PoolLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;

      var A = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);
      
      var n=0; // a counter for switches
      for(var d=0;d<this.out_depth;d++) {
        var x = -this.pad;
        var y = -this.pad;
        for(var ax=0; ax<this.out_sx; x+=this.stride,ax++) {
          y = -this.pad;
          for(var ay=0; ay<this.out_sy; y+=this.stride,ay++) {

            // convolve centered at this particular location
            var a = -99999; // hopefully small enough ;\
            var winx=-1,winy=-1;
            for(var fx=0;fx<this.sx;fx++) {
              for(var fy=0;fy<this.sy;fy++) {
                var oy = y+fy;
                var ox = x+fx;
                if(oy>=0 && oy<V.sy && ox>=0 && ox<V.sx) {
                  var v = V.get(ox, oy, d);
                  // perform max pooling and store pointers to where
                  // the max came from. This will speed up backprop 
                  // and can help make nice visualizations in future
                  if(v > a) { a = v; winx=ox; winy=oy;}
                }
              }
            }
            this.switchx[n] = winx;
            this.switchy[n] = winy;
            n++;
            A.set(ax, ay, d, a);
          }
        }
      }
      this.out_act = A;
      return this.out_act;
    },
    backward: function() { 
      // pooling layers have no parameters, so simply compute 
      // gradient wrt data here
      var V = this.in_act;
      V.dw = convnet.zeros(V.w.length); // zero out gradient wrt data
      var A = this.out_act; // computed in forward pass 

      var n = 0;
      for(var d=0;d<this.out_depth;d++) {
        var x = -this.pad;
        var y = -this.pad;
        for(var ax=0; ax<this.out_sx; x+=this.stride,ax++) {
          y = -this.pad;
          for(var ay=0; ay<this.out_sy; y+=this.stride,ay++) {

            var chain_grad = this.out_act.get_grad(ax,ay,d);
            V.add_grad(this.switchx[n], this.switchy[n], d, chain_grad);
            n++;

          }
        }
      }
    },
    getParamsAndGrads: function() {
      return [];
    },
    toJSON: function() {
      var json = {};
      json.sx = this.sx;
      json.sy = this.sy;
      json.stride = this.stride;
      json.in_depth = this.in_depth;
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.pad = this.pad;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.sx = json.sx;
      this.sy = json.sy;
      this.stride = json.stride;
      this.in_depth = json.in_depth;
      this.pad = typeof json.pad !== 'undefined' ? json.pad : 0; // backwards compatibility
      this.switchx = convnet.zeros(this.out_sx*this.out_sy*this.out_depth); // need to re-init these appropriately
      this.switchy = convnet.zeros(this.out_sx*this.out_sy*this.out_depth);
    }
  }

  convnet.PoolLayer = PoolLayer;


/*** convnet_layers_input ***/
  var getopt = convnet.getopt;

  var InputLayer = function(opt) {
    var opt = opt || {};

    // required: depth
    this.out_depth = getopt(opt, ['out_depth', 'depth'], 0);

    // optional: default these dimensions to 1
    this.out_sx = getopt(opt, ['out_sx', 'sx', 'width'], 1);
    this.out_sy = getopt(opt, ['out_sy', 'sy', 'height'], 1);
    
    // computed
    this.layer_type = 'input';
  }
  InputLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      this.out_act = V;
      return this.out_act; // simply identity function for now
    },
    backward: function() { },
    getParamsAndGrads: function() {
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type; 
    }
  }

  convnet.InputLayer = InputLayer;


/*** convnet_layers_loss ***/
  // Layers that implement a loss. Currently these are the layers that 
  // can initiate a backward() pass. In future we probably want a more 
  // flexible system that can accomodate multiple losses to do multi-task
  // learning, and stuff like that. But for now, one of the layers in this
  // file must be the final layer in a Net.

  // This is a classifier, with N discrete classes from 0 to N-1
  // it gets a stream of N incoming numbers and computes the softmax
  // function (exponentiate and normalize to sum to 1 as probabilities should)
  var SoftmaxLayer = function(opt) {
    var opt = opt || {};

    // computed
    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'softmax';
  }

  SoftmaxLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;

      var A = new Vol(1, 1, this.out_depth, 0.0);

      // compute max activation
      var as = V.w;
      var amax = V.w[0];
      for(var i=1;i<this.out_depth;i++) {
        if(as[i] > amax) amax = as[i];
      }

      // compute exponentials (carefully to not blow up)
      var es = convnet.zeros(this.out_depth);
      var esum = 0.0;
      for(var i=0;i<this.out_depth;i++) {
        var e = Math.exp(as[i] - amax);
        esum += e;
        es[i] = e;
      }

      // normalize and output to sum to one
      for(var i=0;i<this.out_depth;i++) {
        es[i] /= esum;
        A.w[i] = es[i];
      }

      this.es = es; // save these for backprop
      this.out_act = A;
      return this.out_act;
    },
    backward: function(y) {

      // compute and accumulate gradient wrt weights and bias of this layer
      var x = this.in_act;
      x.dw = convnet.zeros(x.w.length); // zero out the gradient of input Vol

      for(var i=0;i<this.out_depth;i++) {
        var indicator = i === y ? 1.0 : 0.0;
        var mul = -(indicator - this.es[i]);
        x.dw[i] = mul;
      }

      // loss is the class negative log likelihood
      return -Math.log(this.es[y]);
    },
    getParamsAndGrads: function() { 
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.num_inputs = this.num_inputs;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.num_inputs = json.num_inputs;
    }
  }

  // implements an L2 regression cost layer,
  // so penalizes \sum_i(||x_i - y_i||^2), where x is its input
  // and y is the user-provided array of "correct" values.
  var RegressionLayer = function(opt) {
    var opt = opt || {};

    // computed
    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'regression';
  }

  RegressionLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      this.out_act = V;
      return V; // identity function
    },
    // y is a list here of size num_inputs
    // or it can be a number if only one value is regressed
    // or it can be a struct {dim: i, val: x} where we only want to 
    // regress on dimension i and asking it to have value x
    backward: function(y) { 

      // compute and accumulate gradient wrt weights and bias of this layer
      var x = this.in_act;
      x.dw = convnet.zeros(x.w.length); // zero out the gradient of input Vol
      var loss = 0.0;
      if(y instanceof Array || y instanceof Float64Array) {
        for(var i=0;i<this.out_depth;i++) {
          var dy = x.w[i] - y[i];
          x.dw[i] = dy;
          loss += 0.5*dy*dy;
        }
      } else if(typeof y === 'number') {
        // lets hope that only one number is being regressed
        var dy = x.w[0] - y;
        x.dw[0] = dy;
        loss += 0.5*dy*dy;
      } else {
        // assume it is a struct with entries .dim and .val
        // and we pass gradient only along dimension dim to be equal to val
        var i = y.dim;
        var yi = y.val;
        var dy = x.w[i] - yi;
        x.dw[i] = dy;
        loss += 0.5*dy*dy;
      }
      return loss;
    },
    getParamsAndGrads: function() { 
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.num_inputs = this.num_inputs;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.num_inputs = json.num_inputs;
    }
  }

  var SVMLayer = function(opt) {
    var opt = opt || {};

    // computed
    this.num_inputs = opt.in_sx * opt.in_sy * opt.in_depth;
    this.out_depth = this.num_inputs;
    this.out_sx = 1;
    this.out_sy = 1;
    this.layer_type = 'svm';
  }

  SVMLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      this.out_act = V; // nothing to do, output raw scores
      return V;
    },
    backward: function(y) {

      // compute and accumulate gradient wrt weights and bias of this layer
      var x = this.in_act;
      x.dw = convnet.zeros(x.w.length); // zero out the gradient of input Vol

      // we're using structured loss here, which means that the score
      // of the ground truth should be higher than the score of any other 
      // class, by a margin
      var yscore = x.w[y]; // score of ground truth
      var margin = 1.0;
      var loss = 0.0;
      for(var i=0;i<this.out_depth;i++) {
        if(y === i) { continue; }
        var ydiff = -yscore + x.w[i] + margin;
        if(ydiff > 0) {
          // violating dimension, apply loss
          x.dw[i] += 1;
          x.dw[y] -= 1;
          loss += ydiff;
        }
      }

      return loss;
    },
    getParamsAndGrads: function() { 
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.num_inputs = this.num_inputs;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type;
      this.num_inputs = json.num_inputs;
    }
  }
  
  convnet.RegressionLayer = RegressionLayer;
  convnet.SoftmaxLayer = SoftmaxLayer;
  convnet.SVMLayer = SVMLayer;


/*** convnet_layers_nonlinearities ***/
  // Implements ReLU nonlinearity elementwise
  // x -> max(0, x)
  // the output is in [0, inf)
  var ReluLayer = function(opt) {
    var opt = opt || {};

    // computed
    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'relu';
  }
  ReluLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      var V2 = V.clone();
      var N = V.w.length;
      var V2w = V2.w;
      for(var i=0;i<N;i++) { 
        if(V2w[i] < 0) V2w[i] = 0; // threshold at 0
      }
      this.out_act = V2;
      return this.out_act;
    },
    backward: function() {
      var V = this.in_act; // we need to set dw of this
      var V2 = this.out_act;
      var N = V.w.length;
      V.dw = convnet.zeros(N); // zero out gradient wrt data
      for(var i=0;i<N;i++) {
        if(V2.w[i] <= 0) V.dw[i] = 0; // threshold
        else V.dw[i] = V2.dw[i];
      }
    },
    getParamsAndGrads: function() {
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type; 
    }
  }

  // Implements Sigmoid nnonlinearity elementwise
  // x -> 1/(1+e^(-x))
  // so the output is between 0 and 1.
  var SigmoidLayer = function(opt) {
    var opt = opt || {};

    // computed
    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'sigmoid';
  }
  SigmoidLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      var V2 = V.cloneAndZero();
      var N = V.w.length;
      var V2w = V2.w;
      var Vw = V.w;
      for(var i=0;i<N;i++) { 
        V2w[i] = 1.0/(1.0+Math.exp(-Vw[i]));
      }
      this.out_act = V2;
      return this.out_act;
    },
    backward: function() {
      var V = this.in_act; // we need to set dw of this
      var V2 = this.out_act;
      var N = V.w.length;
      V.dw = convnet.zeros(N); // zero out gradient wrt data
      for(var i=0;i<N;i++) {
        var v2wi = V2.w[i];
        V.dw[i] =  v2wi * (1.0 - v2wi) * V2.dw[i];
      }
    },
    getParamsAndGrads: function() {
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type; 
    }
  }

  // Implements Maxout nnonlinearity that computes
  // x -> max(x)
  // where x is a vector of size group_size. Ideally of course,
  // the input size should be exactly divisible by group_size
  var MaxoutLayer = function(opt) {
    var opt = opt || {};

    // required
    this.group_size = typeof opt.group_size !== 'undefined' ? opt.group_size : 2;

    // computed
    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = Math.floor(opt.in_depth / this.group_size);
    this.layer_type = 'maxout';

    this.switches = convnet.zeros(this.out_sx*this.out_sy*this.out_depth); // useful for backprop
  }
  MaxoutLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      var N = this.out_depth; 
      var V2 = new Vol(this.out_sx, this.out_sy, this.out_depth, 0.0);

      // optimization branch. If we're operating on 1D arrays we dont have
      // to worry about keeping track of x,y,d coordinates inside
      // input volumes. In convnets we do :(
      if(this.out_sx === 1 && this.out_sy === 1) {
        for(var i=0;i<N;i++) {
          var ix = i * this.group_size; // base index offset
          var a = V.w[ix];
          var ai = 0;
          for(var j=1;j<this.group_size;j++) {
            var a2 = V.w[ix+j];
            if(a2 > a) {
              a = a2;
              ai = j;
            }
          }
          V2.w[i] = a;
          this.switches[i] = ix + ai;
        }
      } else {
        var n=0; // counter for switches
        for(var x=0;x<V.sx;x++) {
          for(var y=0;y<V.sy;y++) {
            for(var i=0;i<N;i++) {
              var ix = i * this.group_size;
              var a = V.get(x, y, ix);
              var ai = 0;
              for(var j=1;j<this.group_size;j++) {
                var a2 = V.get(x, y, ix+j);
                if(a2 > a) {
                  a = a2;
                  ai = j;
                }
              }
              V2.set(x,y,i,a);
              this.switches[n] = ix + ai;
              n++;
            }
          }
        }

      }
      this.out_act = V2;
      return this.out_act;
    },
    backward: function() {
      var V = this.in_act; // we need to set dw of this
      var V2 = this.out_act;
      var N = this.out_depth;
      V.dw = convnet.zeros(V.w.length); // zero out gradient wrt data

      // pass the gradient through the appropriate switch
      if(this.out_sx === 1 && this.out_sy === 1) {
        for(var i=0;i<N;i++) {
          var chain_grad = V2.dw[i];
          V.dw[this.switches[i]] = chain_grad;
        }
      } else {
        // bleh okay, lets do this the hard way
        var n=0; // counter for switches
        for(var x=0;x<V2.sx;x++) {
          for(var y=0;y<V2.sy;y++) {
            for(var i=0;i<N;i++) {
              var chain_grad = V2.get_grad(x,y,i);
              V.set_grad(x,y,this.switches[n],chain_grad);
              n++;
            }
          }
        }
      }
    },
    getParamsAndGrads: function() {
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.group_size = this.group_size;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type; 
      this.group_size = json.group_size;
      this.switches = convnet.zeros(this.group_size);
    }
  }

  // a helper function, since tanh is not yet part of ECMAScript. Will be in v6.
  function tanh(x) {
    var y = Math.exp(2 * x);
    return (y - 1) / (y + 1);
  }
  // Implements Tanh nnonlinearity elementwise
  // x -> tanh(x) 
  // so the output is between -1 and 1.
  var TanhLayer = function(opt) {
    var opt = opt || {};

    // computed
    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'tanh';
  }
  TanhLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      var V2 = V.cloneAndZero();
      var N = V.w.length;
      for(var i=0;i<N;i++) { 
        V2.w[i] = tanh(V.w[i]);
      }
      this.out_act = V2;
      return this.out_act;
    },
    backward: function() {
      var V = this.in_act; // we need to set dw of this
      var V2 = this.out_act;
      var N = V.w.length;
      V.dw = convnet.zeros(N); // zero out gradient wrt data
      for(var i=0;i<N;i++) {
        var v2wi = V2.w[i];
        V.dw[i] = (1.0 - v2wi * v2wi) * V2.dw[i];
      }
    },
    getParamsAndGrads: function() {
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type; 
    }
  }
  
  convnet.TanhLayer = TanhLayer;
  convnet.MaxoutLayer = MaxoutLayer;
  convnet.ReluLayer = ReluLayer;
  convnet.SigmoidLayer = SigmoidLayer;




/*** convnet_layers_dropout ***/
  // An inefficient dropout layer
  // Note this is not most efficient implementation since the layer before
  // computed all these activations and now we're just going to drop them :(
  // same goes for backward pass. Also, if we wanted to be efficient at test time
  // we could equivalently be clever and upscale during train and copy pointers during test
  // todo: make more efficient.
  var DropoutLayer = function(opt) {
    var opt = opt || {};

    // computed
    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'dropout';
    this.drop_prob = typeof opt.drop_prob !== 'undefined' ? opt.drop_prob : 0.5;
    this.dropped = convnet.zeros(this.out_sx*this.out_sy*this.out_depth);
  }
  DropoutLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;
      if(typeof(is_training)==='undefined') { is_training = false; } // default is prediction mode
      var V2 = V.clone();
      var N = V.w.length;
      if(is_training) {
        // do dropout
        for(var i=0;i<N;i++) {
          if(Math.random()<this.drop_prob) { V2.w[i]=0; this.dropped[i] = true; } // drop!
          else {this.dropped[i] = false;}
        }
      } else {
        // scale the activations during prediction
        for(var i=0;i<N;i++) { V2.w[i]*=this.drop_prob; }
      }
      this.out_act = V2;
      return this.out_act; // dummy identity function for now
    },
    backward: function() {
      var V = this.in_act; // we need to set dw of this
      var chain_grad = this.out_act;
      var N = V.w.length;
      V.dw = convnet.zeros(N); // zero out gradient wrt data
      for(var i=0;i<N;i++) {
        if(!(this.dropped[i])) { 
          V.dw[i] = chain_grad.dw[i]; // copy over the gradient
        }
      }
    },
    getParamsAndGrads: function() {
      return [];
    },
    toJSON: function() {
      var json = {};
      json.out_depth = this.out_depth;
      json.out_sx = this.out_sx;
      json.out_sy = this.out_sy;
      json.layer_type = this.layer_type;
      json.drop_prob = this.drop_prob;
      return json;
    },
    fromJSON: function(json) {
      this.out_depth = json.out_depth;
      this.out_sx = json.out_sx;
      this.out_sy = json.out_sy;
      this.layer_type = json.layer_type; 
      this.drop_prob = json.drop_prob;
    }
  }
  
  convnet.DropoutLayer = DropoutLayer;

/*** convnet_layers_normailzation ***/
  // a bit experimental layer for now. I think it works but I'm not 100%
  // the gradient check is a bit funky. I'll look into this a bit later.
  // Local Response Normalization in window, along depths of volumes
  var LocalResponseNormalizationLayer = function(opt) {
    var opt = opt || {};

    // required
    this.k = opt.k;
    this.n = opt.n;
    this.alpha = opt.alpha;
    this.beta = opt.beta;

    // computed
    this.out_sx = opt.in_sx;
    this.out_sy = opt.in_sy;
    this.out_depth = opt.in_depth;
    this.layer_type = 'lrn';

    // checks
    if(this.n%2 === 0) { console.log('WARNING n should be odd for LRN layer'); }
  }
  LocalResponseNormalizationLayer.prototype = {
    forward: function(V, is_training) {
      this.in_act = V;

      var A = V.cloneAndZero();
      this.S_cache_ = V.cloneAndZero();
      var n2 = Math.floor(this.n/2);
      for(var x=0;x<V.sx;x++) {
        for(var y=0;y<V.sy;y++) {
          for(var i=0;i<V.depth;i++) {

            var ai = V.get(x,y,i);

            // normalize in a window of size n
            var den = 0.0;
            for(var j=Math.max(0,i-n2);j<=Math.min(i+n2,V.depth-1);j++) {
              var aa = V.get(x,y,j);
              den += aa*aa;
            }
            den *= this.alpha / this.n;
            den += this.k;
            this.S_cache_.set(x,y,i,den); // will be useful for backprop
            den = Math.pow(den, this.beta);
            A.set(x,y,i,ai/den);
          }
        }
      }

      this.out_act = A;
      return this.out_act; // dummy identity function for now
    },
    backward: function() { 
      // evaluate gradient wrt data
      var V = this.in_act; // we need to set dw of this
      V.dw = convnet.zeros(V.w.length); // zero out gradient wrt data
      var A = this.out_act; // computed in forward pass 

      var n2 = Math.floor(this.n/2);
      for(var x=0;x<V.sx;x++) {
        for(var y=0;y<V.sy;y++) {
          for(var i=0;i<V.depth;i++) {

            var chain_grad = this.out_act.get_grad(x,y,i);
            var S = this.S_cache_.get(x,y,i);
            var SB = Math.pow(S, this.beta);
            var SB2 = SB*SB;

            // normalize in a window of size n
            for(var j=Math.max(0,i-n2);j<=Math.min(i+n2,V.depth-1);j++) {              
              var aj = V.get(x,y,j); 
              var g = -aj*this.beta*Math.pow(S,this.beta-1)*this.alpha/this.n*2*aj;
              if(j===i) g+= SB;
              g /= SB2;
              g *= chain_grad;
              V.add_grad(x,y,j,g);
            }

          }
        }
      }
    },
    getParamsAndGrads: function() { return []; },
    toJSON: function() {
      var json = {};
      json.k = this.k;
      json.n = this.n;
      json.alpha = this.alpha; // normalize by size
      json.beta = this.beta;
      json.out_sx = this.out_sx; 
      json.out_sy = this.out_sy;
      json.out_depth = this.out_depth;
      json.layer_type = this.layer_type;
      return json;
    },
    fromJSON: function(json) {
      this.k = json.k;
      this.n = json.n;
      this.alpha = json.alpha; // normalize by size
      this.beta = json.beta;
      this.out_sx = json.out_sx; 
      this.out_sy = json.out_sy;
      this.out_depth = json.out_depth;
      this.layer_type = json.layer_type;
    }
  }
  
  convnet.LocalResponseNormalizationLayer = LocalResponseNormalizationLayer;



/*** convnet_net ***/
  var assert = convnet.assert;

  // Net manages a set of layers
  // For now constraints: Simple linear order of layers, first layer input last layer a cost layer
  var Net = function(options) {
    this.layers = [];
  }

  Net.prototype = {
    
    // takes a list of layer definitions and creates the network layer objects
    makeLayers: function(defs) {

      // few checks
      assert(defs.length >= 2, 'Error! At least one input layer and one loss layer are required.');
      assert(defs[0].type === 'input', 'Error! First layer must be the input layer, to declare size of inputs');

      // desugar layer_defs for adding activation, dropout layers etc
      var desugar = function() {
        var new_defs = [];
        for(var i=0;i<defs.length;i++) {
          var def = defs[i];
          
          if(def.type==='softmax' || def.type==='svm') {
            // add an fc layer here, there is no reason the user should
            // have to worry about this and we almost always want to
            new_defs.push({type:'fc', num_neurons: def.num_classes});
          }

          if(def.type==='regression') {
            // add an fc layer here, there is no reason the user should
            // have to worry about this and we almost always want to
            new_defs.push({type:'fc', num_neurons: def.num_neurons});
          }

          if((def.type==='fc' || def.type==='conv') 
              && typeof(def.bias_pref) === 'undefined'){
            def.bias_pref = 0.0;
            if(typeof def.activation !== 'undefined' && def.activation === 'relu') {
              def.bias_pref = 0.1; // relus like a bit of positive bias to get gradients early
              // otherwise it's technically possible that a relu unit will never turn on (by chance)
              // and will never get any gradient and never contribute any computation. Dead relu.
            }
          }

          new_defs.push(def);

          if(typeof def.activation !== 'undefined') {
            if(def.activation==='relu') { new_defs.push({type:'relu'}); }
            else if (def.activation==='sigmoid') { new_defs.push({type:'sigmoid'}); }
            else if (def.activation==='tanh') { new_defs.push({type:'tanh'}); }
            else if (def.activation==='maxout') {
              // create maxout activation, and pass along group size, if provided
              var gs = def.group_size !== 'undefined' ? def.group_size : 2;
              new_defs.push({type:'maxout', group_size:gs});
            }
            else { console.log('ERROR unsupported activation ' + def.activation); }
          }
          if(typeof def.drop_prob !== 'undefined' && def.type !== 'dropout') {
            new_defs.push({type:'dropout', drop_prob: def.drop_prob});
          }

        }
        return new_defs;
      }
      defs = desugar(defs);

      // create the layers
      this.layers = [];
      for(var i=0;i<defs.length;i++) {
        var def = defs[i];
        if(i>0) {
          var prev = this.layers[i-1];
          def.in_sx = prev.out_sx;
          def.in_sy = prev.out_sy;
          def.in_depth = prev.out_depth;
        }

        switch(def.type) {
          case 'fc': this.layers.push(new convnet.FullyConnLayer(def)); break;
          case 'lrn': this.layers.push(new convnet.LocalResponseNormalizationLayer(def)); break;
          case 'dropout': this.layers.push(new convnet.DropoutLayer(def)); break;
          case 'input': this.layers.push(new convnet.InputLayer(def)); break;
          case 'softmax': this.layers.push(new convnet.SoftmaxLayer(def)); break;
          case 'regression': this.layers.push(new convnet.RegressionLayer(def)); break;
          case 'conv': this.layers.push(new convnet.ConvLayer(def)); break;
          case 'pool': this.layers.push(new convnet.PoolLayer(def)); break;
          case 'relu': this.layers.push(new convnet.ReluLayer(def)); break;
          case 'sigmoid': this.layers.push(new convnet.SigmoidLayer(def)); break;
          case 'tanh': this.layers.push(new convnet.TanhLayer(def)); break;
          case 'maxout': this.layers.push(new convnet.MaxoutLayer(def)); break;
          case 'svm': this.layers.push(new convnet.SVMLayer(def)); break;
          default: console.log('ERROR: UNRECOGNIZED LAYER TYPE: ' + def.type);
        }
      }
    },

    // forward prop the network. 
    // The trainer class passes is_training = true, but when this function is
    // called from outside (not from the trainer), it defaults to prediction mode
    forward: function(V, is_training) {
      if(typeof(is_training) === 'undefined') is_training = false;
      var act = this.layers[0].forward(V, is_training);
      for(var i=1;i<this.layers.length;i++) {
        act = this.layers[i].forward(act, is_training);
      }
      return act;
    },

    getCostLoss: function(V, y) {
      this.forward(V, false);
      var N = this.layers.length;
      var loss = this.layers[N-1].backward(y);
      return loss;
    },
    
    // backprop: compute gradients wrt all parameters
    backward: function(y) {
      var N = this.layers.length;
      var loss = this.layers[N-1].backward(y); // last layer assumed to be loss layer
      for(var i=N-2;i>=0;i--) { // first layer assumed input
        this.layers[i].backward();
      }
      return loss;
    },
    getParamsAndGrads: function() {
      // accumulate parameters and gradients for the entire network
      var response = [];
      for(var i=0;i<this.layers.length;i++) {
        var layer_reponse = this.layers[i].getParamsAndGrads();
        for(var j=0;j<layer_reponse.length;j++) {
          response.push(layer_reponse[j]);
        }
      }
      return response;
    },
    getPrediction: function() {
      // this is a convenience function for returning the argmax
      // prediction, assuming the last layer of the net is a softmax
      var S = this.layers[this.layers.length-1];
      assert(S.layer_type === 'softmax', 'getPrediction function assumes softmax as last layer of the net!');

      var p = S.out_act.w;
      var maxv = p[0];
      var maxi = 0;
      for(var i=1;i<p.length;i++) {
        if(p[i] > maxv) { maxv = p[i]; maxi = i;}
      }
      return maxi; // return index of the class with highest class probability
    },
    toJSON: function() {
      var json = {};
      json.layers = [];
      for(var i=0;i<this.layers.length;i++) {
        json.layers.push(this.layers[i].toJSON());
      }
      return json;
    },
    fromJSON: function(json) {
      this.layers = [];
      for(var i=0;i<json.layers.length;i++) {
        var Lj = json.layers[i]
        var t = Lj.layer_type;
        var L;
        if(t==='input') { L = new convnet.InputLayer(); }
        if(t==='relu') { L = new convnet.ReluLayer(); }
        if(t==='sigmoid') { L = new convnet.SigmoidLayer(); }
        if(t==='tanh') { L = new convnet.TanhLayer(); }
        if(t==='dropout') { L = new convnet.DropoutLayer(); }
        if(t==='conv') { L = new convnet.ConvLayer(); }
        if(t==='pool') { L = new convnet.PoolLayer(); }
        if(t==='lrn') { L = new convnet.LocalResponseNormalizationLayer(); }
        if(t==='softmax') { L = new convnet.SoftmaxLayer(); }
        if(t==='regression') { L = new convnet.RegressionLayer(); }
        if(t==='fc') { L = new convnet.FullyConnLayer(); }
        if(t==='maxout') { L = new convnet.MaxoutLayer(); }
        if(t==='svm') { L = new convnet.SVMLayer(); }
        L.fromJSON(Lj);
        this.layers.push(L);
      }
    }
  }
  
  convnet.Net = Net;


/*** convnet_trainers ***/
  var Trainer = function(net, options) {

    this.net = net;

    var options = options || {};
    this.learning_rate = typeof options.learning_rate !== 'undefined' ? options.learning_rate : 0.01;
    this.l1_decay = typeof options.l1_decay !== 'undefined' ? options.l1_decay : 0.0;
    this.l2_decay = typeof options.l2_decay !== 'undefined' ? options.l2_decay : 0.0;
    this.batch_size = typeof options.batch_size !== 'undefined' ? options.batch_size : 1;
    this.method = typeof options.method !== 'undefined' ? options.method : 'sgd'; // sgd/adam/adagrad/adadelta/windowgrad/netsterov

    this.momentum = typeof options.momentum !== 'undefined' ? options.momentum : 0.9;
    this.ro = typeof options.ro !== 'undefined' ? options.ro : 0.95; // used in adadelta
    this.eps = typeof options.eps !== 'undefined' ? options.eps : 1e-8; // used in adam or adadelta
    this.beta1 = typeof options.beta1 !== 'undefined' ? options.beta1 : 0.9; // used in adam
    this.beta2 = typeof options.beta2 !== 'undefined' ? options.beta2 : 0.999; // used in adam

    this.k = 0; // iteration counter
    this.gsum = []; // last iteration gradients (used for momentum calculations)
    this.xsum = []; // used in adam or adadelta

    // check if regression is expected 
    if(this.net.layers[this.net.layers.length - 1].layer_type === "regression")
      this.regression = true;
    else
      this.regression = false;
  }

  Trainer.prototype = {
    train: function(x, y) {

      var start = new Date().getTime();
      this.net.forward(x, true); // also set the flag that lets the net know we're just training
      var end = new Date().getTime();
      var fwd_time = end - start;

      var start = new Date().getTime();
      var cost_loss = this.net.backward(y);
      var l2_decay_loss = 0.0;
      var l1_decay_loss = 0.0;
      var end = new Date().getTime();
      var bwd_time = end - start;

      if(this.regression && y.constructor !== Array)
        console.log("Warning: a regression net requires an array as training output vector.");
      
      this.k++;
      if(this.k % this.batch_size === 0) {

        var pglist = this.net.getParamsAndGrads();

        // initialize lists for accumulators. Will only be done once on first iteration
        if(this.gsum.length === 0 && (this.method !== 'sgd' || this.momentum > 0.0)) {
          // only vanilla sgd doesnt need either lists
          // momentum needs gsum
          // adagrad needs gsum
          // adam and adadelta needs gsum and xsum
          for(var i=0;i<pglist.length;i++) {
            this.gsum.push(convnet.zeros(pglist[i].params.length));
            if(this.method === 'adam' || this.method === 'adadelta') {
              this.xsum.push(convnet.zeros(pglist[i].params.length));
            } else {
              this.xsum.push([]); // conserve memory
            }
          }
        }

        // perform an update for all sets of weights
        for(var i=0;i<pglist.length;i++) {
          var pg = pglist[i]; // param, gradient, other options in future (custom learning rate etc)
          var p = pg.params;
          var g = pg.grads;

          // learning rate for some parameters.
          var l2_decay_mul = typeof pg.l2_decay_mul !== 'undefined' ? pg.l2_decay_mul : 1.0;
          var l1_decay_mul = typeof pg.l1_decay_mul !== 'undefined' ? pg.l1_decay_mul : 1.0;
          var l2_decay = this.l2_decay * l2_decay_mul;
          var l1_decay = this.l1_decay * l1_decay_mul;

          var plen = p.length;
          for(var j=0;j<plen;j++) {
            l2_decay_loss += l2_decay*p[j]*p[j]/2; // accumulate weight decay loss
            l1_decay_loss += l1_decay*Math.abs(p[j]);
            var l1grad = l1_decay * (p[j] > 0 ? 1 : -1);
            var l2grad = l2_decay * (p[j]);

            var gij = (l2grad + l1grad + g[j]) / this.batch_size; // raw batch gradient

            var gsumi = this.gsum[i];
            var xsumi = this.xsum[i];
            if(this.method === 'adam') {
              // adam update
              gsumi[j] = gsumi[j] * this.beta1 + (1- this.beta1) * gij; // update biased first moment estimate
              xsumi[j] = xsumi[j] * this.beta2 + (1-this.beta2) * gij * gij; // update biased second moment estimate
              var biasCorr1 = gsumi[j] * (1 - Math.pow(this.beta1, this.k)); // correct bias first moment estimate
              var biasCorr2 = xsumi[j] * (1 - Math.pow(this.beta2, this.k)); // correct bias second moment estimate
              var dx =  - this.learning_rate * biasCorr1 / (Math.sqrt(biasCorr2) + this.eps);
              p[j] += dx;
            } else if(this.method === 'adagrad') {
              // adagrad update
              gsumi[j] = gsumi[j] + gij * gij;
              var dx = - this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij;
              p[j] += dx;
            } else if(this.method === 'windowgrad') {
              // this is adagrad but with a moving window weighted average
              // so the gradient is not accumulated over the entire history of the run. 
              // it's also referred to as Idea #1 in Zeiler paper on Adadelta. Seems reasonable to me!
              gsumi[j] = this.ro * gsumi[j] + (1-this.ro) * gij * gij;
              var dx = - this.learning_rate / Math.sqrt(gsumi[j] + this.eps) * gij; // eps added for better conditioning
              p[j] += dx;
            } else if(this.method === 'adadelta') {
              gsumi[j] = this.ro * gsumi[j] + (1-this.ro) * gij * gij;
              var dx = - Math.sqrt((xsumi[j] + this.eps)/(gsumi[j] + this.eps)) * gij;
              xsumi[j] = this.ro * xsumi[j] + (1-this.ro) * dx * dx; // yes, xsum lags behind gsum by 1.
              p[j] += dx;
            } else if(this.method === 'nesterov') {
            	var dx = gsumi[j];
            	gsumi[j] = gsumi[j] * this.momentum + this.learning_rate * gij;
                dx = this.momentum * dx - (1.0 + this.momentum) * gsumi[j];
                p[j] += dx;
            } else {
              // assume SGD
              if(this.momentum > 0.0) {
                // momentum update
                var dx = this.momentum * gsumi[j] - this.learning_rate * gij; // step
                gsumi[j] = dx; // back this up for next iteration of momentum
                p[j] += dx; // apply corrected gradient
              } else {
                // vanilla sgd
                p[j] +=  - this.learning_rate * gij;
              }
            }
            g[j] = 0.0; // zero out gradient so that we can begin accumulating anew
          }
        }
      }

      // appending softmax_loss for backwards compatibility, but from now on we will always use cost_loss
      // in future, TODO: have to completely redo the way loss is done around the network as currently 
      // loss is a bit of a hack. Ideally, user should specify arbitrary number of loss functions on any layer
      // and it should all be computed correctly and automatically. 
      return {fwd_time: fwd_time, bwd_time: bwd_time, 
              l2_decay_loss: l2_decay_loss, l1_decay_loss: l1_decay_loss,
              cost_loss: cost_loss, softmax_loss: cost_loss, 
              loss: cost_loss + l1_decay_loss + l2_decay_loss}
    }
  }
  
  convnet.Trainer = Trainer;
  convnet.SGDTrainer = Trainer; // backwards compatibility


/*** convnet_magicnets ***/
  // used utilities, make explicit local references
  var randf = convnet.randf;
  var randi = convnet.randi;
  var Net = convnet.Net;
  var Trainer = convnet.Trainer;
  var maxmin = convnet.maxmin;
  var randperm = convnet.randperm;
  var weightedSample = convnet.weightedSample;
  var getopt = convnet.getopt;
  var arrUnique = convnet.arrUnique;

  /*
  A MagicNet takes data: a list of convnetjs.Vol(), and labels
  which for now are assumed to be class indeces 0..K. MagicNet then:
  - creates data folds for cross-validation
  - samples candidate networks
  - evaluates candidate networks on all data folds
  - produces predictions by model-averaging the best networks
  */
  var MagicNet = function(data, labels, opt) {
    var opt = opt || {};
    if(typeof data === 'undefined') { data = []; }
    if(typeof labels === 'undefined') { labels = []; }

    // required inputs
    this.data = data; // store these pointers to data
    this.labels = labels;

    // optional inputs
    this.train_ratio = getopt(opt, 'train_ratio', 0.7);
    this.num_folds = getopt(opt, 'num_folds', 10);
    this.num_candidates = getopt(opt, 'num_candidates', 50); // we evaluate several in parallel
    // how many epochs of data to train every network? for every fold?
    // higher values mean higher accuracy in final results, but more expensive
    this.num_epochs = getopt(opt, 'num_epochs', 50); 
    // number of best models to average during prediction. Usually higher = better
    this.ensemble_size = getopt(opt, 'ensemble_size', 10);

    // candidate parameters
    this.batch_size_min = getopt(opt, 'batch_size_min', 10);
    this.batch_size_max = getopt(opt, 'batch_size_max', 300);
    this.l2_decay_min = getopt(opt, 'l2_decay_min', -4);
    this.l2_decay_max = getopt(opt, 'l2_decay_max', 2);
    this.learning_rate_min = getopt(opt, 'learning_rate_min', -4);
    this.learning_rate_max = getopt(opt, 'learning_rate_max', 0);
    this.momentum_min = getopt(opt, 'momentum_min', 0.9);
    this.momentum_max = getopt(opt, 'momentum_max', 0.9);
    this.neurons_min = getopt(opt, 'neurons_min', 5);
    this.neurons_max = getopt(opt, 'neurons_max', 30);

    // computed
    this.folds = []; // data fold indices, gets filled by sampleFolds()
    this.candidates = []; // candidate networks that are being currently evaluated
    this.evaluated_candidates = []; // history of all candidates that were fully evaluated on all folds
    this.unique_labels = arrUnique(labels);
    this.iter = 0; // iteration counter, goes from 0 -> num_epochs * num_training_data
    this.foldix = 0; // index of active fold

    // callbacks
    this.finish_fold_callback = null;
    this.finish_batch_callback = null;

    // initializations
    if(this.data.length > 0) {
      this.sampleFolds();
      this.sampleCandidates();
    }
  };

  MagicNet.prototype = {

    // sets this.folds to a sampling of this.num_folds folds
    sampleFolds: function() {
      var N = this.data.length;
      var num_train = Math.floor(this.train_ratio * N);
      this.folds = []; // flush folds, if any
      for(var i=0;i<this.num_folds;i++) {
        var p = randperm(N);
        this.folds.push({train_ix: p.slice(0, num_train), test_ix: p.slice(num_train, N)});
      }
    },

    // returns a random candidate network
    sampleCandidate: function() {
      var input_depth = this.data[0].w.length;
      var num_classes = this.unique_labels.length;

      // sample network topology and hyperparameters
      var layer_defs = [];
      layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth: input_depth});
      var nl = weightedSample([0,1,2,3], [0.2, 0.3, 0.3, 0.2]); // prefer nets with 1,2 hidden layers
      for(var q=0;q<nl;q++) {
        var ni = randi(this.neurons_min, this.neurons_max);
        var act = ['tanh','maxout','relu'][randi(0,3)];
        if(randf(0,1)<0.5) {
          var dp = Math.random();
          layer_defs.push({type:'fc', num_neurons: ni, activation: act, drop_prob: dp});
        } else {
          layer_defs.push({type:'fc', num_neurons: ni, activation: act});
        }
      }
      layer_defs.push({type:'softmax', num_classes: num_classes});
      var net = new Net();
      net.makeLayers(layer_defs);

      // sample training hyperparameters
      var bs = randi(this.batch_size_min, this.batch_size_max); // batch size
      var l2 = Math.pow(10, randf(this.l2_decay_min, this.l2_decay_max)); // l2 weight decay
      var lr = Math.pow(10, randf(this.learning_rate_min, this.learning_rate_max)); // learning rate
      var mom = randf(this.momentum_min, this.momentum_max); // momentum. Lets just use 0.9, works okay usually ;p
      var tp = randf(0,1); // trainer type
      var trainer_def;
      if(tp<0.33) {
        trainer_def = {method:'adadelta', batch_size:bs, l2_decay:l2};
      } else if(tp<0.66) {
        trainer_def = {method:'adagrad', learning_rate: lr, batch_size:bs, l2_decay:l2};
      } else {
        trainer_def = {method:'sgd', learning_rate: lr, momentum: mom, batch_size:bs, l2_decay:l2};
      }
      
      var trainer = new Trainer(net, trainer_def);

      var cand = {};
      cand.acc = [];
      cand.accv = 0; // this will maintained as sum(acc) for convenience
      cand.layer_defs = layer_defs;
      cand.trainer_def = trainer_def;
      cand.net = net;
      cand.trainer = trainer;
      return cand;
    },

    // sets this.candidates with this.num_candidates candidate nets
    sampleCandidates: function() {
      this.candidates = []; // flush, if any
      for(var i=0;i<this.num_candidates;i++) {
        var cand = this.sampleCandidate();
        this.candidates.push(cand);
      }
    },

    step: function() {
      
      // run an example through current candidate
      this.iter++;

      // step all candidates on a random data point
      var fold = this.folds[this.foldix]; // active fold
      var dataix = fold.train_ix[randi(0, fold.train_ix.length)];
      for(var k=0;k<this.candidates.length;k++) {
        var x = this.data[dataix];
        var l = this.labels[dataix];
        this.candidates[k].trainer.train(x, l);
      }

      // process consequences: sample new folds, or candidates
      var lastiter = this.num_epochs * fold.train_ix.length;
      if(this.iter >= lastiter) {
        // finished evaluation of this fold. Get final validation
        // accuracies, record them, and go on to next fold.
        var val_acc = this.evalValErrors();
        for(var k=0;k<this.candidates.length;k++) {
          var c = this.candidates[k];
          c.acc.push(val_acc[k]);
          c.accv += val_acc[k];
        }
        this.iter = 0; // reset step number
        this.foldix++; // increment fold

        if(this.finish_fold_callback !== null) {
          this.finish_fold_callback();
        }

        if(this.foldix >= this.folds.length) {
          // we finished all folds as well! Record these candidates
          // and sample new ones to evaluate.
          for(var k=0;k<this.candidates.length;k++) {
            this.evaluated_candidates.push(this.candidates[k]);
          }
          // sort evaluated candidates according to accuracy achieved
          this.evaluated_candidates.sort(function(a, b) { 
            return (a.accv / a.acc.length) 
                 > (b.accv / b.acc.length) 
                 ? -1 : 1;
          });
          // and clip only to the top few ones (lets place limit at 3*ensemble_size)
          // otherwise there are concerns with keeping these all in memory 
          // if MagicNet is being evaluated for a very long time
          if(this.evaluated_candidates.length > 3 * this.ensemble_size) {
            this.evaluated_candidates = this.evaluated_candidates.slice(0, 3 * this.ensemble_size);
          }
          if(this.finish_batch_callback !== null) {
            this.finish_batch_callback();
          }
          this.sampleCandidates(); // begin with new candidates
          this.foldix = 0; // reset this
        } else {
          // we will go on to another fold. reset all candidates nets
          for(var k=0;k<this.candidates.length;k++) {
            var c = this.candidates[k];
            var net = new Net();
            net.makeLayers(c.layer_defs);
            var trainer = new Trainer(net, c.trainer_def);
            c.net = net;
            c.trainer = trainer;
          }
        }
      }
    },

    evalValErrors: function() {
      // evaluate candidates on validation data and return performance of current networks
      // as simple list
      var vals = [];
      var fold = this.folds[this.foldix]; // active fold
      for(var k=0;k<this.candidates.length;k++) {
        var net = this.candidates[k].net;
        var v = 0.0;
        for(var q=0;q<fold.test_ix.length;q++) {
          var x = this.data[fold.test_ix[q]];
          var l = this.labels[fold.test_ix[q]];
          net.forward(x);
          var yhat = net.getPrediction();
          v += (yhat === l ? 1.0 : 0.0); // 0 1 loss
        }
        v /= fold.test_ix.length; // normalize
        vals.push(v);
      }
      return vals;
    },

    // returns prediction scores for given test data point, as Vol
    // uses an averaged prediction from the best ensemble_size models
    // x is a Vol.
    predict_soft: function(data) {
      // forward prop the best networks
      // and accumulate probabilities at last layer into a an output Vol

      var eval_candidates = [];
      var nv = 0;
      if(this.evaluated_candidates.length === 0) {
        // not sure what to do here, first batch of nets hasnt evaluated yet
        // lets just predict with current candidates.
        nv = this.candidates.length;
        eval_candidates = this.candidates;
      } else {
        // forward prop the best networks from evaluated_candidates
        nv = Math.min(this.ensemble_size, this.evaluated_candidates.length);
        eval_candidates = this.evaluated_candidates
      }

      // forward nets of all candidates and average the predictions
      var xout, n;
      for(var j=0;j<nv;j++) {
        var net = eval_candidates[j].net;
        var x = net.forward(data);
        if(j===0) { 
          xout = x; 
          n = x.w.length; 
        } else {
          // add it on
          for(var d=0;d<n;d++) {
            xout.w[d] += x.w[d];
          }
        }
      }
      // produce average
      for(var d=0;d<n;d++) {
        xout.w[d] /= nv;
      }
      return xout;
    },

    predict: function(data) {
      var xout = this.predict_soft(data);
      if(xout.w.length !== 0) {
        var stats = maxmin(xout.w);
        var predicted_label = stats.maxi; 
      } else {
        var predicted_label = -1; // error out
      }
      return predicted_label;

    },

    toJSON: function() {
      // dump the top ensemble_size networks as a list
      var nv = Math.min(this.ensemble_size, this.evaluated_candidates.length);
      var json = {};
      json.nets = [];
      for(var i=0;i<nv;i++) {
        json.nets.push(this.evaluated_candidates[i].net.toJSON());
      }
      return json;
    },

    fromJSON: function(json) {
      this.ensemble_size = json.nets.length;
      this.evaluated_candidates = [];
      for(var i=0;i<this.ensemble_size;i++) {
        var net = new Net();
        net.fromJSON(json.nets[i]);
        var dummy_candidate = {};
        dummy_candidate.net = net;
        this.evaluated_candidates.push(dummy_candidate);
      }
    },

    // callback functions
    // called when a fold is finished, while evaluating a batch
    onFinishFold: function(f) { this.finish_fold_callback = f; },
    // called when a batch of candidates has finished evaluating
    onFinishBatch: function(f) { this.finish_batch_callback = f; }
    
  };

  convnet.MagicNet = MagicNet;


};
BundleModuleCode['ml/ann']=function (module,exports,global,process){
/*******************************************************************************
                                      CONFIG
*******************************************************************************/

// Config
var config = {
  warnings: false
};

/*******************************************************************************
                                  ACTIVATION FUNCTIONS
*******************************************************************************/

// https://en.wikipedia.org/wiki/Activation_function
// https://stats.stackexchange.com/questions/115258/comprehensive-list-of-activation-functions-in-neural-networks-with-pros-cons
var activation = {
  LOGISTIC: function LOGISTIC (x, derivate) {
    var fx = 1 / (1 + Math.exp(-x));
    if (!derivate) return fx;
    return fx * (1 - fx);
  },
  TANH: function TANH (x, derivate) {
    if (derivate) return 1 - Math.pow(Math.tanh(x), 2);
    return Math.tanh(x);
  },
  IDENTITY: function IDENTITY (x, derivate) {
    return derivate ? 1 : x;
  },
  STEP: function STEP (x, derivate) {
    return derivate ? 0 : x > 0 ? 1 : 0;
  },
  RELU: function RELU (x, derivate) {
    if (derivate) return x > 0 ? 1 : 0;
    return x > 0 ? x : 0;
  },
  SOFTSIGN: function SOFTSIGN (x, derivate) {
    var d = 1 + Math.abs(x);
    if (derivate) return x / Math.pow(d, 2);
    return x / d;
  },
  SINUSOID: function SINUSOID (x, derivate) {
    if (derivate) return Math.cos(x);
    return Math.sin(x);
  },
  GAUSSIAN: function GAUSSIAN (x, derivate) {
    var d = Math.exp(-Math.pow(x, 2));
    if (derivate) return -2 * x * d;
    return d;
  },
  BENT_IDENTITY: function BENT_IDENTITY (x, derivate) {
    var d = Math.sqrt(Math.pow(x, 2) + 1);
    if (derivate) return x / (2 * d) + 1;
    return (d - 1) / 2 + x;
  },
  BIPOLAR: function BIPOLAR (x, derivate) {
    return derivate ? 0 : x > 0 ? 1 : -1;
  },
  BIPOLAR_SIGMOID: function BIPOLAR_SIGMOID (x, derivate) {
    var d = 2 / (1 + Math.exp(-x)) - 1;
    if (derivate) return 1 / 2 * (1 + d) * (1 - d);
    return d;
  },
  HARD_TANH: function HARD_TANH (x, derivate) {
    if (derivate) return x > -1 && x < 1 ? 1 : 0;
    return Math.max(-1, Math.min(1, x));
  },
  ABSOLUTE: function ABSOLUTE (x, derivate) {
    if (derivate) return x < 0 ? -1 : 1;
    return Math.abs(x);
  },
  INVERSE: function INVERSE (x, derivate) {
    if (derivate) return -1;
    return 1 - x;
  },
  // https://arxiv.org/pdf/1706.02515.pdf
  SELU: function SELU (x, derivate) {
    var alpha = 1.6732632423543772848170429916717;
    var scale = 1.0507009873554804934193349852946;
    var fx = x > 0 ? x : alpha * Math.exp(x) - alpha;
    if (derivate) { return x > 0 ? scale : (fx + alpha) * scale; }
    return fx * scale;
  }
};

/*******************************************************************************
                                      MUTATION
*******************************************************************************/

// https://en.wikipedia.org/wiki/mutation_(genetic_algorithm)
var mutation = {
  ADD_NODE: {
    name: 'ADD_NODE'
  },
  SUB_NODE: {
    name: 'SUB_NODE',
    keep_gates: true
  },
  ADD_CONN: {
    name: 'ADD_CONN'
  },
  SUB_CONN: {
    name: 'REMOVE_CONN'
  },
  MOD_WEIGHT: {
    name: 'MOD_WEIGHT',
    min: -1,
    max: 1
  },
  MOD_BIAS: {
    name: 'MOD_BIAS',
    min: -1,
    max: 1
  },
  MOD_ACTIVATION: {
    name: 'MOD_ACTIVATION',
    mutateOutput: true,
    allowed: [
      activation.LOGISTIC,
      activation.TANH,
      activation.RELU,
      activation.IDENTITY,
      activation.STEP,
      activation.SOFTSIGN,
      activation.SINUSOID,
      activation.GAUSSIAN,
      activation.BENT_IDENTITY,
      activation.BIPOLAR,
      activation.BIPOLAR_SIGMOID,
      activation.HARD_TANH,
      activation.ABSOLUTE,
      activation.INVERSE,
      activation.SELU
    ]
  },
  ADD_SELF_CONN: {
    name: 'ADD_SELF_CONN'
  },
  SUB_SELF_CONN: {
    name: 'SUB_SELF_CONN'
  },
  ADD_GATE: {
    name: 'ADD_GATE'
  },
  SUB_GATE: {
    name: 'SUB_GATE'
  },
  ADD_BACK_CONN: {
    name: 'ADD_BACK_CONN'
  },
  SUB_BACK_CONN: {
    name: 'SUB_BACK_CONN'
  },
  SWAP_NODES: {
    name: 'SWAP_NODES',
    mutateOutput: true
  }
};

mutation.ALL = [
  mutation.ADD_NODE,
  mutation.SUB_NODE,
  mutation.ADD_CONN,
  mutation.SUB_CONN,
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.ADD_GATE,
  mutation.SUB_GATE,
  mutation.ADD_SELF_CONN,
  mutation.SUB_SELF_CONN,
  mutation.ADD_BACK_CONN,
  mutation.SUB_BACK_CONN,
  mutation.SWAP_NODES
];

mutation.FFW = [
  mutation.ADD_NODE,
  mutation.SUB_NODE,
  mutation.ADD_CONN,
  mutation.SUB_CONN,
  mutation.MOD_WEIGHT,
  mutation.MOD_BIAS,
  mutation.MOD_ACTIVATION,
  mutation.SWAP_NODES
];

/*******************************************************************************
                                      SELECTION
*******************************************************************************/

// https://en.wikipedia.org/wiki/Selection_(genetic_algorithm)

var selection = {
  FITNESS_PROPORTIONATE: {
    name: 'FITNESS_PROPORTIONATE'
  },
  POWER: {
    name: 'POWER',
    power: 4
  },
  TOURNAMENT: {
    name: 'TOURNAMENT',
    size: 5,
    probability: 0.5
  }
};

/*******************************************************************************
                                      CROSSOVER
*******************************************************************************/

// https://en.wikipedia.org/wiki/Crossover_(genetic_algorithm)
var crossover = {
  SINGLE_POINT: {
    name: 'SINGLE_POINT',
    config: [0.4]
  },
  TWO_POINT: {
    name: 'TWO_POINT',
    config: [0.4, 0.9]
  },
  UNIFORM: {
    name: 'UNIFORM'
  },
  AVERAGE: {
    name: 'AVERAGE'
  }
};

/*******************************************************************************
                                    COST FUNCTIONS
*******************************************************************************/

// https://en.wikipedia.org/wiki/Loss_function
var cost = {
  // Cross entropy error
  CROSS_ENTROPY: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      // Avoid negative and zero numbers, use 1e-15 http://bit.ly/2p5W29A
      error -= target[i] * Math.log(Math.max(output[i], 1e-15)) + (1 - target[i]) * Math.log(1 - Math.max(output[i], 1e-15));
    }
    return error / output.length;
  },
  // Mean Squared Error
  MSE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.pow(target[i] - output[i], 2);
    }

    return error / output.length;
  },
  // Binary error
  BINARY: function (target, output) {
    var misses = 0;
    for (var i = 0; i < output.length; i++) {
      misses += Math.round(target[i] * 2) !== Math.round(output[i] * 2);
    }

    return misses;
  },
  // Mean Absolute Error
  MAE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.abs(target[i] - output[i]);
    }

    return error / output.length;
  },
  // Mean Absolute Percentage Error
  MAPE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.abs((output[i] - target[i]) / Math.max(target[i], 1e-15));
    }

    return error / output.length;
  },
  // Mean Squared Logarithmic Error
  MSLE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.log(Math.max(target[i], 1e-15)) - Math.log(Math.max(output[i], 1e-15));
    }

    return error;
  },
  // Hinge loss, for classifiers
  HINGE: function (target, output) {
    var error = 0;
    for (var i = 0; i < output.length; i++) {
      error += Math.max(0, 1 - target[i] * output[i]);
    }

    return error;
  }
};


/*******************************************************************************
                                    GATING
*******************************************************************************/

// Specifies how to gate a connection between two groups of multiple neurons
var gating = {
  OUTPUT: {
    name: 'OUTPUT'
  },
  INPUT: {
    name: 'INPUT'
  },
  SELF: {
    name: 'SELF'
  }
};


/*******************************************************************************
                                    CONNECTION
*******************************************************************************/

// Specifies in what manner two groups are connected
var connection = {
  ALL_TO_ALL: {
    name: 'OUTPUT'
  },
  ALL_TO_ELSE: {
    name: 'INPUT'
  },
  ONE_TO_ONE: {
    name: 'SELF'
  }
};


/*******************************************************************************
                                      RATE
*******************************************************************************/

// https://stackoverflow.com/questions/30033096/what-is-lr-policy-in-caffe/30045244
var rate = {
  FIXED: function () {
    var func = function (baseRate, iteration) { return baseRate; };
    return func;
  },
  STEP: function (gamma, stepSize) {
    gamma = gamma || 0.9;
    stepSize = stepSize || 100;

    var func = function (baseRate, iteration) {
      return baseRate * Math.pow(gamma, Math.floor(iteration / stepSize));
    };

    return func;
  },
  EXP: function (gamma) {
    gamma = gamma || 0.999;

    var func = function (baseRate, iteration) {
      return baseRate * Math.pow(gamma, iteration);
    };

    return func;
  },
  INV: function (gamma, power) {
    gamma = gamma || 0.001;
    power = power || 2;

    var func = function (baseRate, iteration) {
      return baseRate * Math.pow(1 + gamma * iteration, -power);
    };

    return func;
  }
};

/*******************************************************************************
                                  METHODS
*******************************************************************************/

var methods = {
  activation: activation,
  mutation: mutation,
  selection: selection,
  crossover: crossover,
  cost: cost,
  gating: gating,
  connection: connection,
  rate: rate
};

/*******************************************************************************
                                      CONNECTION
*******************************************************************************/

function Connection (from, to, weight) {
  this.from = from;
  this.to = to;
  this.gain = 1;

  this.weight = (typeof weight === 'undefined') ? Math.random() * 0.2 - 0.1 : weight;

  this.gater = null;
  this.elegibility = 0;

  // For tracking momentum
  this.previousDeltaWeight = 0;

  // Batch training
  this.totalDeltaWeight = 0;

  this.xtrace = {
    nodes: [],
    values: []
  };
}

Connection.prototype = {
  /**
   * Converts the connection to a json object
   */
  toJSON: function () {
    var json = {
      weight: this.weight
    };

    return json;
  }
};

/**
 * Returns an innovation ID
 * https://en.wikipedia.org/wiki/Pairing_function (Cantor pairing function)
 */
Connection.innovationID = function (a, b) {
  return 1 / 2 * (a + b) * (a + b + 1) + b;
};

/*******************************************************************************
                                 NETWORK
*******************************************************************************/


/* Easier variable naming */
var mutation = methods.mutation;

function Network (input, output) {
  if (typeof input === 'undefined' || typeof output === 'undefined') {
    throw new Error('No input or output size given');
  }

  this.input = input;
  this.output = output;

  // Store all the node and connection genes
  this.nodes = []; // Stored in activation order
  this.connections = [];
  this.gates = [];
  this.selfconns = [];

  // Regularization
  this.dropout = 0;

  // Create input and output nodes
  var i;
  for (i = 0; i < this.input + this.output; i++) {
    var type = i < this.input ? 'input' : 'output';
    this.nodes.push(new Node(type));
  }

  // Connect input nodes with output nodes directly
  for (i = 0; i < this.input; i++) {
    for (var j = this.input; j < this.output + this.input; j++) {
      // https://stats.stackexchange.com/a/248040/147931
      var weight = Math.random() * this.input * Math.sqrt(2 / this.input);
      this.connect(this.nodes[i], this.nodes[j], weight);
    }
  }
}

Network.prototype = {
  /**
   * Activates the network
   */
  activate: function (input, training) {
    var output = [];

    // Activate nodes chronologically
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].type === 'input') {
        this.nodes[i].activate(input[i]);
      } else if (this.nodes[i].type === 'output') {
        var activation = this.nodes[i].activate();
        output.push(activation);
      } else {
        if (training) this.nodes[i].mask = Math.random() < this.dropout ? 0 : 1;
        this.nodes[i].activate();
      }
    }

    return output;
  },

  /**
   * Activates the network without calculating elegibility traces and such
   */
  noTraceActivate: function (input) {
    var output = [];

    // Activate nodes chronologically
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].type === 'input') {
        this.nodes[i].noTraceActivate(input[i]);
      } else if (this.nodes[i].type === 'output') {
        var activation = this.nodes[i].noTraceActivate();
        output.push(activation);
      } else {
        this.nodes[i].noTraceActivate();
      }
    }

    return output;
  },

  /**
   * Backpropagate the network
   */
  propagate: function (rate, momentum, update, target) {
    if (typeof target === 'undefined' || target.length !== this.output) {
      throw new Error('Output target length should match network output length');
    }

    var targetIndex = target.length;

    // Propagate output nodes
    var i;
    for (i = this.nodes.length - 1; i >= this.nodes.length - this.output; i--) {
      this.nodes[i].propagate(rate, momentum, update, target[--targetIndex]);
    }

    // Propagate hidden and input nodes
    for (i = this.nodes.length - this.output - 1; i >= this.input; i--) {
      this.nodes[i].propagate(rate, momentum, update);
    }
  },

  /**
   * Clear the context of the network
   */
  clear: function () {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
  },

  /**
   * Connects the from node to the to node
   */
  connect: function (from, to, weight) {
    var connections = from.connect(to, weight);

    for (var i = 0; i < connections.length; i++) {
      var connection = connections[i];
      if (from !== to) {
        this.connections.push(connection);
      } else {
        this.selfconns.push(connection);
      }
    }

    return connections;
  },

  /**
   * Disconnects the from node from the to node
   */
  disconnect: function (from, to) {
    // Delete the connection in the network's connection array
    var connections = from === to ? this.selfconns : this.connections;

    for (var i = 0; i < connections.length; i++) {
      var connection = connections[i];
      if (connection.from === from && connection.to === to) {
        if (connection.gater !== null) this.ungate(connection);
        connections.splice(i, 1);
        break;
      }
    }

    // Delete the connection at the sending and receiving neuron
    from.disconnect(to);
  },

  /**
   * Gate a connection with a node
   */
  gate: function (node, connection) {
    if (this.nodes.indexOf(node) === -1) {
      throw new Error('This node is not part of the network!');
    } else if (connection.gater != null) {
      if (config.warnings) console.warn('This connection is already gated!');
      return;
    }
    node.gate(connection);
    this.gates.push(connection);
  },

  /**
   *  Remove the gate of a connection
   */
  ungate: function (connection) {
    var index = this.gates.indexOf(connection);
    if (index === -1) {
      throw new Error('This connection is not gated!');
    }

    this.gates.splice(index, 1);
    connection.gater.ungate(connection);
  },

  /**
   *  Removes a node from the network
   */
  remove: function (node) {
    var index = this.nodes.indexOf(node);

    if (index === -1) {
      throw new Error('This node does not exist in the network!');
    }

    // Keep track of gaters
    var gaters = [];

    // Remove selfconnections from this.selfconns
    this.disconnect(node, node);

    // Get all its inputting nodes
    var inputs = [];
    for (var i = node.connections.in.length - 1; i >= 0; i--) {
      var connection = node.connections.in[i];
      if (mutation.SUB_NODE.keep_gates && connection.gater !== null && connection.gater !== node) {
        gaters.push(connection.gater);
      }
      inputs.push(connection.from);
      this.disconnect(connection.from, node);
    }

    // Get all its outputing nodes
    var outputs = [];
    for (i = node.connections.out.length - 1; i >= 0; i--) {
      var connection = node.connections.out[i];
      if (mutation.SUB_NODE.keep_gates && connection.gater !== null && connection.gater !== node) {
        gaters.push(connection.gater);
      }
      outputs.push(connection.to);
      this.disconnect(node, connection.to);
    }

    // Connect the input nodes to the output nodes (if not already connected)
    var connections = [];
    for (i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      for (var j = 0; j < outputs.length; j++) {
        var output = outputs[j];
        if (!input.isProjectingTo(output)) {
          var conn = this.connect(input, output);
          connections.push(conn[0]);
        }
      }
    }

    // Gate random connections with gaters
    for (i = 0; i < gaters.length; i++) {
      if (connections.length === 0) break;

      var gater = gaters[i];
      var connIndex = Math.floor(Math.random() * connections.length);

      this.gate(gater, connections[connIndex]);
      connections.splice(connIndex, 1);
    }

    // Remove gated connections gated by this node
    for (i = node.connections.gated.length - 1; i >= 0; i--) {
      var conn = node.connections.gated[i];
      this.ungate(conn);
    }

    // Remove selfconnection
    this.disconnect(node, node);

    // Remove the node from this.nodes
    this.nodes.splice(index, 1);
  },

  /**
   * Mutates the network with the given method
   */
  mutate: function (method) {
    if (typeof method === 'undefined') {
      throw new Error('No (correct) mutate method given!');
    }

    var i, j;
    switch (method) {
      case mutation.ADD_NODE:
        // Look for an existing connection and place a node in between
        var connection = this.connections[Math.floor(Math.random() * this.connections.length)];
        var gater = connection.gater;
        this.disconnect(connection.from, connection.to);

        // Insert the new node right before the old connection.to
        var toIndex = this.nodes.indexOf(connection.to);
        var node = new Node('hidden');

        // Random squash function
        node.mutate(mutation.MOD_ACTIVATION);

        // Place it in this.nodes
        var minBound = Math.min(toIndex, this.nodes.length - this.output);
        this.nodes.splice(minBound, 0, node);

        // Now create two new connections
        var newConn1 = this.connect(connection.from, node)[0];
        var newConn2 = this.connect(node, connection.to)[0];

        // Check if the original connection was gated
        if (gater != null) {
          this.gate(gater, Math.random() >= 0.5 ? newConn1 : newConn2);
        }
        break;
      case mutation.SUB_NODE:
        // Check if there are nodes left to remove
        if (this.nodes.length === this.input + this.output) {
          if (config.warnings) console.warn('No more nodes left to remove!');
          break;
        }

        // Select a node which isn't an input or output node
        var index = Math.floor(Math.random() * (this.nodes.length - this.output - this.input) + this.input);
        this.remove(this.nodes[index]);
        break;
      case mutation.ADD_CONN:
        // Create an array of all uncreated (feedforward) connections
        var available = [];
        for (i = 0; i < this.nodes.length - this.output; i++) {
          var node1 = this.nodes[i];
          for (j = Math.max(i + 1, this.input); j < this.nodes.length; j++) {
            var node2 = this.nodes[j];
            if (!node1.isProjectingTo(node2)) available.push([node1, node2]);
          }
        }

        if (available.length === 0) {
          if (config.warnings) console.warn('No more connections to be made!');
          break;
        }

        var pair = available[Math.floor(Math.random() * available.length)];
        this.connect(pair[0], pair[1]);
        break;
      case mutation.SUB_CONN:
        // List of possible connections that can be removed
        var possible = [];

        for (i = 0; i < this.connections.length; i++) {
          var conn = this.connections[i];
          // Check if it is not disabling a node
          if (conn.from.connections.out.length > 1 && conn.to.connections.in.length > 1 && this.nodes.indexOf(conn.to) > this.nodes.indexOf(conn.from)) {
            possible.push(conn);
          }
        }

        if (possible.length === 0) {
          if (config.warnings) console.warn('No connections to remove!');
          break;
        }

        var randomConn = possible[Math.floor(Math.random() * possible.length)];
        this.disconnect(randomConn.from, randomConn.to);
        break;
      case mutation.MOD_WEIGHT:
        var allconnections = this.connections.concat(this.selfconns);

        var connection = allconnections[Math.floor(Math.random() * allconnections.length)];
        var modification = Math.random() * (method.max - method.min) + method.min;
        connection.weight += modification;
        break;
      case mutation.MOD_BIAS:
        // Has no effect on input node, so they are excluded
        var index = Math.floor(Math.random() * (this.nodes.length - this.input) + this.input);
        var node = this.nodes[index];
        node.mutate(method);
        break;
      case mutation.MOD_ACTIVATION:
        // Has no effect on input node, so they are excluded
        if (!method.mutateOutput && this.input + this.output === this.nodes.length) {
          if (config.warnings) console.warn('No nodes that allow mutation of activation function');
          break;
        }

        var index = Math.floor(Math.random() * (this.nodes.length - (method.mutateOutput ? 0 : this.output) - this.input) + this.input);
        var node = this.nodes[index];

        node.mutate(method);
        break;
      case mutation.ADD_SELF_CONN:
        // Check which nodes aren't selfconnected yet
        var possible = [];
        for (i = this.input; i < this.nodes.length; i++) {
          var node = this.nodes[i];
          if (node.connections.self.weight === 0) {
            possible.push(node);
          }
        }

        if (possible.length === 0) {
          if (config.warnings) console.warn('No more self-connections to add!');
          break;
        }

        // Select a random node
        var node = possible[Math.floor(Math.random() * possible.length)];

        // Connect it to himself
        this.connect(node, node);
        break;
      case mutation.SUB_SELF_CONN:
        if (this.selfconns.length === 0) {
          if (config.warnings) console.warn('No more self-connections to remove!');
          break;
        }
        var conn = this.selfconns[Math.floor(Math.random() * this.selfconns.length)];
        this.disconnect(conn.from, conn.to);
        break;
      case mutation.ADD_GATE:
        var allconnections = this.connections.concat(this.selfconns);

        // Create a list of all non-gated connections
        var possible = [];
        for (i = 0; i < allconnections.length; i++) {
          var conn = allconnections[i];
          if (conn.gater === null) {
            possible.push(conn);
          }
        }

        if (possible.length === 0) {
          if (config.warnings) console.warn('No more connections to gate!');
          break;
        }

        // Select a random gater node and connection, can't be gated by input
        var index = Math.floor(Math.random() * (this.nodes.length - this.input) + this.input);
        var node = this.nodes[index];
        var conn = possible[Math.floor(Math.random() * possible.length)];

        // Gate the connection with the node
        this.gate(node, conn);
        break;
      case mutation.SUB_GATE:
        // Select a random gated connection
        if (this.gates.length === 0) {
          if (config.warnings) console.warn('No more connections to ungate!');
          break;
        }

        var index = Math.floor(Math.random() * this.gates.length);
        var gatedconn = this.gates[index];

        this.ungate(gatedconn);
        break;
      case mutation.ADD_BACK_CONN:
        // Create an array of all uncreated (backfed) connections
        var available = [];
        for (i = this.input; i < this.nodes.length; i++) {
          var node1 = this.nodes[i];
          for (j = this.input; j < i; j++) {
            var node2 = this.nodes[j];
            if (!node1.isProjectingTo(node2)) available.push([node1, node2]);
          }
        }

        if (available.length === 0) {
          if (config.warnings) console.warn('No more connections to be made!');
          break;
        }

        var pair = available[Math.floor(Math.random() * available.length)];
        this.connect(pair[0], pair[1]);
        break;
      case mutation.SUB_BACK_CONN:
        // List of possible connections that can be removed
        var possible = [];

        for (i = 0; i < this.connections.length; i++) {
          var conn = this.connections[i];
          // Check if it is not disabling a node
          if (conn.from.connections.out.length > 1 && conn.to.connections.in.length > 1 && this.nodes.indexOf(conn.from) > this.nodes.indexOf(conn.to)) {
            possible.push(conn);
          }
        }

        if (possible.length === 0) {
          if (config.warnings) console.warn('No connections to remove!');
          break;
        }

        var randomConn = possible[Math.floor(Math.random() * possible.length)];
        this.disconnect(randomConn.from, randomConn.to);
        break;
      case mutation.SWAP_NODES:
        // Has no effect on input node, so they are excluded
        if ((method.mutateOutput && this.nodes.length - this.input < 2) ||
          (!method.mutateOutput && this.nodes.length - this.input - this.output < 2)) {
          if (config.warnings) console.warn('No nodes that allow swapping of bias and activation function');
          break;
        }

        var index = Math.floor(Math.random() * (this.nodes.length - (method.mutateOutput ? 0 : this.output) - this.input) + this.input);
        var node1 = this.nodes[index];
        index = Math.floor(Math.random() * (this.nodes.length - (method.mutateOutput ? 0 : this.output) - this.input) + this.input);
        var node2 = this.nodes[index];

        var biasTemp = node1.bias;
        var squashTemp = node1.squash;

        node1.bias = node2.bias;
        node1.squash = node2.squash;
        node2.bias = biasTemp;
        node2.squash = squashTemp;
        break;
    }
  },

  /**
   * Train the given set to this network
   */
  train: function (set, options) {
    if (set[0].input.length !== this.input || set[0].output.length !== this.output) {
      throw new Error('Dataset input/output size should be same as network input/output size!');
    }

    options = options || {};

    // Warning messages
    if (typeof options.rate === 'undefined') {
      if (config.warnings) console.warn('Using default learning rate, please define a rate!');
    }
    if (typeof options.iterations === 'undefined') {
      if (config.warnings) console.warn('No target iterations given, running until error is reached!');
    }

    // Read the options
    var targetError = options.error || 0.05;
    var cost = options.cost || methods.cost.MSE;
    var baseRate = options.rate || 0.3;
    var dropout = options.dropout || 0;
    var momentum = options.momentum || 0;
    var batchSize = options.batchSize || 1; // online learning
    var ratePolicy = options.ratePolicy || methods.rate.FIXED();

    var start = Date.now();

    if (batchSize > set.length) {
      throw new Error('Batch size must be smaller or equal to dataset length!');
    } else if (typeof options.iterations === 'undefined' && typeof options.error === 'undefined') {
      throw new Error('At least one of the following options must be specified: error, iterations');
    } else if (typeof options.error === 'undefined') {
      targetError = -1; // run until iterations
    } else if (typeof options.iterations === 'undefined') {
      options.iterations = 0; // run until target error
    }

    // Save to network
    this.dropout = dropout;

    if (options.crossValidate) {
      var numTrain = Math.ceil((1 - options.crossValidate.testSize) * set.length);
      var trainSet = set.slice(0, numTrain);
      var testSet = set.slice(numTrain);
    }

    // Loops the training process
    var currentRate = baseRate;
    var iteration = 0;
    var error = 1;

    var i, j, x;
    while (error > targetError && (options.iterations === 0 || iteration < options.iterations)) {
      if (options.crossValidate && error <= options.crossValidate.testError) break;

      iteration++;

      // Update the rate
      currentRate = ratePolicy(baseRate, iteration);

      // Checks if cross validation is enabled
      if (options.crossValidate) {
        this._trainSet(trainSet, batchSize, currentRate, momentum, cost);
        if (options.clear) this.clear();
        error = this.test(testSet, cost).error;
        if (options.clear) this.clear();
      } else {
        error = this._trainSet(set, batchSize, currentRate, momentum, cost);
        if (options.clear) this.clear();
      }

      // Checks for options such as scheduled logs and shuffling
      if (options.shuffle) {
        for (j, x, i = set.length; i; j = Math.floor(Math.random() * i), x = set[--i], set[i] = set[j], set[j] = x);
      }

      if (options.log && iteration % options.log === 0) {
        console.log('iteration', iteration, 'error', error, 'rate', currentRate);
      }

      if (options.schedule && iteration % options.schedule.iterations === 0) {
        options.schedule.function({ error: error, iteration: iteration });
      }
    }

    if (options.clear) this.clear();

    if (dropout) {
      for (i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].type === 'hidden' || this.nodes[i].type === 'constant') {
          this.nodes[i].mask = 1 - this.dropout;
        }
      }
    }

    return {
      error: error,
      iterations: iteration,
      time: Date.now() - start
    };
  },

  /**
   * Performs one training epoch and returns the error
   * private function used in this.train
   */
  _trainSet: function (set, batchSize, currentRate, momentum, costFunction) {
    var errorSum = 0;
    for (var i = 0; i < set.length; i++) {
      var input = set[i].input;
      var target = set[i].output;

      var update = !!((i + 1) % batchSize === 0 || (i + 1) === set.length);

      var output = this.activate(input, true);
      this.propagate(currentRate, momentum, update, target);

      errorSum += costFunction(target, output);
    }
    return errorSum / set.length;
  },

  /**
   * Tests a set and returns the error and elapsed time
   */
  test: function (set, cost) {
    if (cost == undefined) cost = methods.cost.MSE;
    // Check if dropout is enabled, set correct mask
    var i;
    if (this.dropout) {
      for (i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i].type === 'hidden' || this.nodes[i].type === 'constant') {
          this.nodes[i].mask = 1 - this.dropout;
        }
      }
    }

    var error = 0;
    var start = Date.now();

    for (i = 0; i < set.length; i++) {
      var input = set[i].input;
      var target = set[i].output;
      var output = this.noTraceActivate(input);
      error += cost(target, output);
    }

    error /= set.length;

    var results = {
      error: error,
      time: Date.now() - start
    };

    return results;
  },

  /**
   * Creates a json that can be used to create a graph with d3 and webcola
   */
  graph: function (width, height) {
    var input = 0;
    var output = 0;

    var json = {
      nodes: [],
      links: [],
      constraints: [{
        type: 'alignment',
        axis: 'x',
        offsets: []
      }, {
        type: 'alignment',
        axis: 'y',
        offsets: []
      }]
    };

    var i;
    for (i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];

      if (node.type === 'input') {
        if (this.input === 1) {
          json.constraints[0].offsets.push({
            node: i,
            offset: 0
          });
        } else {
          json.constraints[0].offsets.push({
            node: i,
            offset: 0.8 * width / (this.input - 1) * input++
          });
        }
        json.constraints[1].offsets.push({
          node: i,
          offset: 0
        });
      } else if (node.type === 'output') {
        if (this.output === 1) {
          json.constraints[0].offsets.push({
            node: i,
            offset: 0
          });
        } else {
          json.constraints[0].offsets.push({
            node: i,
            offset: 0.8 * width / (this.output - 1) * output++
          });
        }
        json.constraints[1].offsets.push({
          node: i,
          offset: -0.8 * height
        });
      }

      json.nodes.push({
        id: i,
        name: node.type === 'hidden' ? node.squash.name : node.type.toUpperCase(),
        activation: node.activation,
        bias: node.bias
      });
    }

    var connections = this.connections.concat(this.selfconns);
    for (i = 0; i < connections.length; i++) {
      var connection = connections[i];
      if (connection.gater == null) {
        json.links.push({
          source: this.nodes.indexOf(connection.from),
          target: this.nodes.indexOf(connection.to),
          weight: connection.weight
        });
      } else {
        // Add a gater 'node'
        var index = json.nodes.length;
        json.nodes.push({
          id: index,
          activation: connection.gater.activation,
          name: 'GATE'
        });
        json.links.push({
          source: this.nodes.indexOf(connection.from),
          target: index,
          weight: 1 / 2 * connection.weight
        });
        json.links.push({
          source: index,
          target: this.nodes.indexOf(connection.to),
          weight: 1 / 2 * connection.weight
        });
        json.links.push({
          source: this.nodes.indexOf(connection.gater),
          target: index,
          weight: connection.gater.activation,
          gate: true
        });
      }
    }

    return json;
  },

  /**
   * Convert the network to a json object
   */
  toJSON: function () {
    var json = {
      nodes: [],
      connections: [],
      input: this.input,
      output: this.output,
      dropout: this.dropout
    };

    // So we don't have to use expensive .indexOf()
    var i;
    for (i = 0; i < this.nodes.length; i++) {
      this.nodes[i].index = i;
    }

    for (i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      var tojson = node.toJSON();
      tojson.index = i;
      json.nodes.push(tojson);

      if (node.connections.self.weight !== 0) {
        var tojson = node.connections.self.toJSON();
        tojson.from = i;
        tojson.to = i;

        tojson.gater = node.connections.self.gater != null ? node.connections.self.gater.index : null;
        json.connections.push(tojson);
      }
    }

    for (i = 0; i < this.connections.length; i++) {
      var conn = this.connections[i];
      var tojson = conn.toJSON();
      tojson.from = conn.from.index;
      tojson.to = conn.to.index;

      tojson.gater = conn.gater != null ? conn.gater.index : null;

      json.connections.push(tojson);
    }

    return json;
  },

  /**
   * Sets the value of a property for every node in this network
   */
  set: function (values) {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].bias = values.bias || this.nodes[i].bias;
      this.nodes[i].squash = values.squash || this.nodes[i].squash;
    }
  },

  /**
   * Evolves the network to reach a lower error on a dataset
   */
  evolve: function (set, options) {
    if (set[0].input.length !== this.input || set[0].output.length !== this.output) {
      throw new Error('Dataset input/output size should be same as network input/output size!');
    }

    // Read the options
    options = options || {};
    var targetError = typeof options.error !== 'undefined' ? options.error : 0.05;
    var growth = typeof options.growth !== 'undefined' ? options.growth : 0.0001;
    var cost = options.cost || methods.cost.MSE;
    var amount = options.amount || 1;


    var start = Date.now();

    if (typeof options.iterations === 'undefined' && typeof options.error === 'undefined') {
      throw new Error('At least one of the following options must be specified: error, iterations');
    } else if (typeof options.error === 'undefined') {
      targetError = -1; // run until iterations
    } else if (typeof options.iterations === 'undefined') {
      options.iterations = 0; // run until target error
    }

    var fitnessFunction;
    {
      // Create the fitness function
      fitnessFunction = function (genome) {
        var score = 0;
        for (var i = 0; i < amount; i++) {
          score -= genome.test(set, cost).error;
        }

        score -= (genome.nodes.length - genome.input - genome.output + genome.connections.length + genome.gates.length) * growth;
        score = isNaN(score) ? -Infinity : score; // this can cause problems with fitness proportionate selection

        return score / amount;
      };
    } 

    // Intialise the NEAT instance
    options.network = this;
    var neat = new Neat(this.input, this.output, fitnessFunction, options);

    var error = -Infinity;
    var bestFitness = -Infinity;
    var bestGenome;

    while (error < -targetError && (options.iterations === 0 || neat.generation < options.iterations)) {
      var fittest = neat.evolve();
      var fitness = fittest.score;
      error = fitness + (fittest.nodes.length - fittest.input - fittest.output + fittest.connections.length + fittest.gates.length) * growth;

      if (fitness > bestFitness) {
        bestFitness = fitness;
        bestGenome = fittest;
      }

      if (options.log && neat.generation % options.log === 0) {
        console.log('iteration', neat.generation, 'fitness', fitness, 'error', -error);
      }

      if (options.schedule && neat.generation % options.schedule.iterations === 0) {
        options.schedule.function({ fitness: fitness, error: -error, iteration: neat.generation });
      }
    }


    if (typeof bestGenome !== 'undefined') {
      this.nodes = bestGenome.nodes;
      this.connections = bestGenome.connections;
      this.selfconns = bestGenome.selfconns;
      this.gates = bestGenome.gates;

      if (options.clear) this.clear();
    }

    return {
      error: -error,
      iterations: neat.generation,
      time: Date.now() - start
    };
  },

  /**
   * Creates a standalone function of the network which can be run without the
   * need of a library
   */
  standalone: function () {
    var present = [];
    var activations = [];
    var states = [];
    var lines = [];
    var functions = [];

    var i;
    for (i = 0; i < this.input; i++) {
      var node = this.nodes[i];
      activations.push(node.activation);
      states.push(node.state);
    }

    lines.push('for(var i = 0; i < input.length; i++) A[i] = input[i];');

    // So we don't have to use expensive .indexOf()
    for (i = 0; i < this.nodes.length; i++) {
      this.nodes[i].index = i;
    }

    for (i = this.input; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      activations.push(node.activation);
      states.push(node.state);

      var functionIndex = present.indexOf(node.squash.name);

      if (functionIndex === -1) {
        functionIndex = present.length;
        present.push(node.squash.name);
        functions.push(node.squash.toString());
      }

      var incoming = [];
      for (var j = 0; j < node.connections.in.length; j++) {
        var conn = node.connections.in[j];
        var computation = "A[" + conn.from.index + "] * " + conn.weight;
        
        if (conn.gater != null) {
          computation += " * A[" + conn.gater.index + "]";
        }

        incoming.push(computation);
      }

      if (node.connections.self.weight) {
        var conn = node.connections.self;
        var computation = "S[" + i + "] * " + conn.weight;

        if (conn.gater != null) {
          computation += " * A[" + conn.gater.index + "]";
        }

        incoming.push(computation);
      }

      var line1 = "S[" + i + "] = " + incoming.join(' + ') + " + " + node.bias + ";";
      var line2 = "A[" + i + "] = F[" + functionIndex + "](S[" + i + "])" + (!node.mask ? ' * ' + node.mask : '') + ";";
      lines.push(line1);
      lines.push(line2);
    }

    var output = [];
    for (i = this.nodes.length - this.output; i < this.nodes.length; i++) {
      output.push("A[" + i + "]");
    }

    output = "return [" + output.join(',') + "];";
    lines.push(output);

    var total = '';
    
    total += "var F = [" + functions.toString() + "];\r\n"; 
    total += "var A = [" + activations.toString() + "];\r\n";
    total += "var S = [" + states.toString() + "];\r\n";
    total += "function activate(input){\r\n" + lines.join('\r\n') + "\r\n}";
    return total;
  },

  /**
   * Serialize to send to workers efficiently
   */
  serialize: function () {
    var activations = [];
    var states = [];
    var conns = [];
    var squashes = [
      'LOGISTIC', 'TANH', 'IDENTITY', 'STEP', 'RELU', 'SOFTSIGN', 'SINUSOID',
      'GAUSSIAN', 'BENT_IDENTITY', 'BIPOLAR', 'BIPOLAR_SIGMOID', 'HARD_TANH',
      'ABSOLUTE', 'INVERSE', 'SELU'
    ];

    conns.push(this.input);
    conns.push(this.output);

    var i;
    for (i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      node.index = i;
      activations.push(node.activation);
      states.push(node.state);
    }

    for (i = this.input; i < this.nodes.length; i++) {
      var node = this.nodes[i];
      conns.push(node.index);
      conns.push(node.bias);
      conns.push(squashes.indexOf(node.squash.name));

      conns.push(node.connections.self.weight);
      conns.push(node.connections.self.gater == null ? -1 : node.connections.self.gater.index);

      for (var j = 0; j < node.connections.in.length; j++) {
        var conn = node.connections.in[j];

        conns.push(conn.from.index);
        conns.push(conn.weight);
        conns.push(conn.gater == null ? -1 : conn.gater.index);
      }

      conns.push(-2); // stop token -> next node
    }

    return [activations, states, conns];
  }
};

/**
 * Convert a json object to a network
 */
Network.fromJSON = function (json) {
  var network = new Network(json.input, json.output);
  network.dropout = json.dropout;
  network.nodes = [];
  network.connections = [];

  var i;
  for (i = 0; i < json.nodes.length; i++) {
    network.nodes.push(Node.fromJSON(json.nodes[i]));
  }

  for (i = 0; i < json.connections.length; i++) {
    var conn = json.connections[i];

    var connection = network.connect(network.nodes[conn.from], network.nodes[conn.to])[0];
    connection.weight = conn.weight;

    if (conn.gater != null) {
      network.gate(network.nodes[conn.gater], connection);
    }
  }

  return network;
};

/**
 * Merge two networks into one
 */
Network.merge = function (network1, network2) {
  // Create a copy of the networks
  network1 = Network.fromJSON(network1.toJSON());
  network2 = Network.fromJSON(network2.toJSON());

  // Check if output and input size are the same
  if (network1.output !== network2.input) {
    throw new Error('Output size of network1 should be the same as the input size of network2!');
  }

  // Redirect all connections from network2 input from network1 output
  var i;
  for (i = 0; i < network2.connections.length; i++) {
    var conn = network2.connections[i];
    if (conn.from.type === 'input') {
      var index = network2.nodes.indexOf(conn.from);

      // redirect
      conn.from = network1.nodes[network1.nodes.length - 1 - index];
    }
  }

  // Delete input nodes of network2
  for (i = network2.input - 1; i >= 0; i--) {
    network2.nodes.splice(i, 1);
  }

  // Change the node type of network1's output nodes (now hidden)
  for (i = network1.nodes.length - network1.output; i < network1.nodes.length; i++) {
    network1.nodes[i].type = 'hidden';
  }

  // Create one network from both networks
  network1.connections = network1.connections.concat(network2.connections);
  network1.nodes = network1.nodes.concat(network2.nodes);

  return network1;
};

/**
 * Create an offspring from two parent networks
 */
Network.crossOver = function (network1, network2, equal) {
  if (network1.input !== network2.input || network1.output !== network2.output) {
    throw new Error("Networks don't have the same input/output size!");
  }

  // Initialise offspring
  var offspring = new Network(network1.input, network1.output);
  offspring.connections = [];
  offspring.nodes = [];

  // Save scores and create a copy
  var score1 = network1.score || 0;
  var score2 = network2.score || 0;

  // Determine offspring node size
  var size;
  if (equal || score1 === score2) {
    var max = Math.max(network1.nodes.length, network2.nodes.length);
    var min = Math.min(network1.nodes.length, network2.nodes.length);
    size = Math.floor(Math.random() * (max - min + 1) + min);
  } else if (score1 > score2) {
    size = network1.nodes.length;
  } else {
    size = network2.nodes.length;
  }

  // Rename some variables for easier reading
  var outputSize = network1.output;

  // Set indexes so we don't need indexOf
  var i;
  for (i = 0; i < network1.nodes.length; i++) {
    network1.nodes[i].index = i;
  }

  for (i = 0; i < network2.nodes.length; i++) {
    network2.nodes[i].index = i;
  }

  // Assign nodes from parents to offspring
  for (i = 0; i < size; i++) {
    // Determine if an output node is needed
    var node;
    if (i < size - outputSize) {
      var random = Math.random();
      node = random >= 0.5 ? network1.nodes[i] : network2.nodes[i];
      var other = random < 0.5 ? network1.nodes[i] : network2.nodes[i];

      if (typeof node === 'undefined' || node.type === 'output') {
        node = other;
      }
    } else {
      if (Math.random() >= 0.5) {
        node = network1.nodes[network1.nodes.length + i - size];
      } else {
        node = network2.nodes[network2.nodes.length + i - size];
      }
    }

    var newNode = new Node();
    newNode.bias = node.bias;
    newNode.squash = node.squash;
    newNode.type = node.type;

    offspring.nodes.push(newNode);
  }

  // Create arrays of connection genes
  var n1conns = {};
  var n2conns = {};

  // Normal connections
  for (i = 0; i < network1.connections.length; i++) {
    var conn = network1.connections[i];
    var data = {
      weight: conn.weight,
      from: conn.from.index,
      to: conn.to.index,
      gater: conn.gater != null ? conn.gater.index : -1
    };
    n1conns[Connection.innovationID(data.from, data.to)] = data;
  }

  // Selfconnections
  for (i = 0; i < network1.selfconns.length; i++) {
    var conn = network1.selfconns[i];
    var data = {
      weight: conn.weight,
      from: conn.from.index,
      to: conn.to.index,
      gater: conn.gater != null ? conn.gater.index : -1
    };
    n1conns[Connection.innovationID(data.from, data.to)] = data;
  }

  // Normal connections
  for (i = 0; i < network2.connections.length; i++) {
    var conn = network2.connections[i];
    var data = {
      weight: conn.weight,
      from: conn.from.index,
      to: conn.to.index,
      gater: conn.gater != null ? conn.gater.index : -1
    };
    n2conns[Connection.innovationID(data.from, data.to)] = data;
  }

  // Selfconnections
  for (i = 0; i < network2.selfconns.length; i++) {
    var conn = network2.selfconns[i];
    var data = {
      weight: conn.weight,
      from: conn.from.index,
      to: conn.to.index,
      gater: conn.gater != null ? conn.gater.index : -1
    };
    n2conns[Connection.innovationID(data.from, data.to)] = data;
  }

  // Split common conn genes from disjoint or excess conn genes
  var connections = [];
  var keys1 = Object.keys(n1conns);
  var keys2 = Object.keys(n2conns);
  for (i = keys1.length - 1; i >= 0; i--) {
    // Common gene
    if (typeof n2conns[keys1[i]] !== 'undefined') {
      var conn = Math.random() >= 0.5 ? n1conns[keys1[i]] : n2conns[keys1[i]];
      connections.push(conn);

      // Because deleting is expensive, just set it to some value
      n2conns[keys1[i]] = undefined;
    } else if (score1 >= score2 || equal) {
      connections.push(n1conns[keys1[i]]);
    }
  }

  // Excess/disjoint gene
  if (score2 >= score1 || equal) {
    for (i = 0; i < keys2.length; i++) {
      if (typeof n2conns[keys2[i]] !== 'undefined') {
        connections.push(n2conns[keys2[i]]);
      }
    }
  }

  // Add common conn genes uniformly
  for (i = 0; i < connections.length; i++) {
    var connData = connections[i];
    if (connData.to < size && connData.from < size) {
      var from = offspring.nodes[connData.from];
      var to = offspring.nodes[connData.to];
      var conn = offspring.connect(from, to)[0];

      conn.weight = connData.weight;

      if (connData.gater !== -1 && connData.gater < size) {
        offspring.gate(offspring.nodes[connData.gater], conn);
      }
    }
  }

  return offspring;
};

/*******************************************************************************
                                        architect
*******************************************************************************/


var architect = {
  /**
   * Constructs a network from a given array of connected nodes
   */
  Construct: function (list) {
    // Create a network
    var network = new Network(0, 0);

    // Transform all groups into nodes
    var nodes = [];

    var i;
    for (i = 0; i < list.length; i++) {
      var j;
      if (list[i] instanceof Group) {
        for (j = 0; j < list[i].nodes.length; j++) {
          nodes.push(list[i].nodes[j]);
        }
      } else if (list[i] instanceof Layer) {
        for (j = 0; j < list[i].nodes.length; j++) {
          for (var k = 0; k < list[i].nodes[j].nodes.length; k++) {
            nodes.push(list[i].nodes[j].nodes[k]);
          }
        }
      } else if (list[i] instanceof Node) {
        nodes.push(list[i]);
      }
    }

    // Determine input and output nodes
    var inputs = [];
    var outputs = [];
    for (i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].type === 'output' || nodes[i].connections.out.length + nodes[i].connections.gated.length === 0) {
        nodes[i].type = 'output';
        network.output++;
        outputs.push(nodes[i]);
        nodes.splice(i, 1);
      } else if (nodes[i].type === 'input' || !nodes[i].connections.in.length) {
        nodes[i].type = 'input';
        network.input++;
        inputs.push(nodes[i]);
        nodes.splice(i, 1);
      }
    }

    // Input nodes are always first, output nodes are always last
    nodes = inputs.concat(nodes).concat(outputs);

    if (network.input === 0 || network.output === 0) {
      throw new Error('Given nodes have no clear input/output node!');
    }

    for (i = 0; i < nodes.length; i++) {
      var j;
      for (j = 0; j < nodes[i].connections.out.length; j++) {
        network.connections.push(nodes[i].connections.out[j]);
      }
      for (j = 0; j < nodes[i].connections.gated.length; j++) {
        network.gates.push(nodes[i].connections.gated[j]);
      }
      if (nodes[i].connections.self.weight !== 0) {
        network.selfconns.push(nodes[i].connections.self);
      }
    }

    network.nodes = nodes;

    return network;
  },

  /**
   * Creates a multilayer perceptron (MLP)
   */
  Perceptron: function () {
    // Convert arguments to Array
    var layers = Array.prototype.slice.call(arguments);
    if (layers.length < 3) {
      throw new Error('You have to specify at least 3 layers');
    }

    // Create a list of nodes/groups
    var nodes = [];
    nodes.push(new Group(layers[0]));

    for (var i = 1; i < layers.length; i++) {
      var layer = layers[i];
      layer = new Group(layer);
      nodes.push(layer);
      nodes[i - 1].connect(nodes[i], methods.connection.ALL_TO_ALL);
    }

    // Construct the network
    return architect.Construct(nodes);
  },

  /**
   * Creates a randomly connected network
   */
  Random: function (input, hidden, output, options) {
    options = options || {};

    var connections = options.connections || hidden * 2;
    var backconnections = options.backconnections || 0;
    var selfconnections = options.selfconnections || 0;
    var gates = options.gates || 0;

    var network = new Network(input, output);

    var i;
    for (i = 0; i < hidden; i++) {
      network.mutate(methods.mutation.ADD_NODE);
    }

    for (i = 0; i < connections - hidden; i++) {
      network.mutate(methods.mutation.ADD_CONN);
    }

    for (i = 0; i < backconnections; i++) {
      network.mutate(methods.mutation.ADD_BACK_CONN);
    }

    for (i = 0; i < selfconnections; i++) {
      network.mutate(methods.mutation.ADD_SELF_CONN);
    }

    for (i = 0; i < gates; i++) {
      network.mutate(methods.mutation.ADD_GATE);
    }

    return network;
  },

  /**
   * Creates a long short-term memory network
   */
  LSTM: function () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length < 3) {
      throw new Error('You have to specify at least 3 layers');
    }

    var last = args.pop();

    var outputLayer;
    if (typeof last === 'number') {
      outputLayer = new Group(last);
      last = {};
    } else {
      outputLayer = new Group(args.pop()); // last argument
    }

    outputLayer.set({
      type: 'output'
    });

    var options = {};
    options.memoryToMemory = last.memoryToMemory || false;
    options.outputToMemory = last.outputToMemory || false;
    options.outputToGates = last.outputToGates || false;
    options.inputToOutput = last.inputToOutput === undefined ? true : last.inputToOutput;
    options.inputToDeep = last.inputToDeep === undefined ? true : last.inputToDeep;

    var inputLayer = new Group(args.shift()); // first argument
    inputLayer.set({
      type: 'input'
    });

    var blocks = args; // all the arguments in the middle

    var nodes = [];
    nodes.push(inputLayer);

    var previous = inputLayer;
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];

      // Init required nodes (in activation order)
      var inputGate = new Group(block);
      var forgetGate = new Group(block);
      var memoryCell = new Group(block);
      var outputGate = new Group(block);
      var outputBlock = i === blocks.length - 1 ? outputLayer : new Group(block);

      inputGate.set({
        bias: 1
      });
      forgetGate.set({
        bias: 1
      });
      outputGate.set({
        bias: 1
      });

      // Connect the input with all the nodes
      var input = previous.connect(memoryCell, methods.connection.ALL_TO_ALL);
      previous.connect(inputGate, methods.connection.ALL_TO_ALL);
      previous.connect(outputGate, methods.connection.ALL_TO_ALL);
      previous.connect(forgetGate, methods.connection.ALL_TO_ALL);

      // Set up internal connections
      memoryCell.connect(inputGate, methods.connection.ALL_TO_ALL);
      memoryCell.connect(forgetGate, methods.connection.ALL_TO_ALL);
      memoryCell.connect(outputGate, methods.connection.ALL_TO_ALL);
      var forget = memoryCell.connect(memoryCell, methods.connection.ONE_TO_ONE);
      var output = memoryCell.connect(outputBlock, methods.connection.ALL_TO_ALL);

      // Set up gates
      inputGate.gate(input, methods.gating.INPUT);
      forgetGate.gate(forget, methods.gating.SELF);
      outputGate.gate(output, methods.gating.OUTPUT);

      // Input to all memory cells
      if (options.inputToDeep && i > 0) {
        var input = inputLayer.connect(memoryCell, methods.connection.ALL_TO_ALL);
        inputGate.gate(input, methods.gating.INPUT);
      }

      // Optional connections
      if (options.memoryToMemory) {
        var input = memoryCell.connect(memoryCell, methods.connection.ALL_TO_ELSE);
        inputGate.gate(input, methods.gating.INPUT);
      }

      if (options.outputToMemory) {
        var input = outputLayer.connect(memoryCell, methods.connection.ALL_TO_ALL);
        inputGate.gate(input, methods.gating.INPUT);
      }

      if (options.outputToGates) {
        outputLayer.connect(inputGate, methods.connection.ALL_TO_ALL);
        outputLayer.connect(forgetGate, methods.connection.ALL_TO_ALL);
        outputLayer.connect(outputGate, methods.connection.ALL_TO_ALL);
      }

      // Add to array
      nodes.push(inputGate);
      nodes.push(forgetGate);
      nodes.push(memoryCell);
      nodes.push(outputGate);
      if (i !== blocks.length - 1) nodes.push(outputBlock);

      previous = outputBlock;
    }

    // input to output direct connection
    if (options.inputToOutput) {
      inputLayer.connect(outputLayer, methods.connection.ALL_TO_ALL);
    }

    nodes.push(outputLayer);
    return architect.Construct(nodes);
  },

  /**
   * Creates a gated recurrent unit network
   */
  GRU: function () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length < 3) {
      throw new Error('not enough layers (minimum 3) !!');
    }

    var inputLayer = new Group(args.shift()); // first argument
    var outputLayer = new Group(args.pop()); // last argument
    var blocks = args; // all the arguments in the middle

    var nodes = [];
    nodes.push(inputLayer);

    var previous = inputLayer;
    for (var i = 0; i < blocks.length; i++) {
      var layer = new Layer.GRU(blocks[i]);
      previous.connect(layer);
      previous = layer;

      nodes.push(layer);
    }

    previous.connect(outputLayer);
    nodes.push(outputLayer);

    return architect.Construct(nodes);
  },

  /**
   * Creates a hopfield network of the given size
   */
  Hopfield: function (size) {
    var input = new Group(size);
    var output = new Group(size);

    input.connect(output, methods.connection.ALL_TO_ALL);

    input.set({
      type: 'input'
    });
    output.set({
      squash: methods.activation.STEP,
      type: 'output'
    });

    var network = new architect.Construct([input, output]);

    return network;
  },

  /**
   * Creates a NARX network (remember previous inputs/outputs)
   */
  NARX: function (inputSize, hiddenLayers, outputSize, previousInput, previousOutput) {
    if (!Array.isArray(hiddenLayers)) {
      hiddenLayers = [hiddenLayers];
    }

    var nodes = [];

    var input = new Layer.Dense(inputSize);
    var inputMemory = new Layer.Memory(inputSize, previousInput);
    var hidden = [];
    var output = new Layer.Dense(outputSize);
    var outputMemory = new Layer.Memory(outputSize, previousOutput);

    nodes.push(input);
    nodes.push(outputMemory);

    for (var i = 0; i < hiddenLayers.length; i++) {
      var hiddenLayer = new Layer.Dense(hiddenLayers[i]);
      hidden.push(hiddenLayer);
      nodes.push(hiddenLayer);
      if (typeof hidden[i - 1] !== 'undefined') {
        hidden[i - 1].connect(hiddenLayer, methods.connection.ALL_TO_ALL);
      }
    }

    nodes.push(inputMemory);
    nodes.push(output);

    input.connect(hidden[0], methods.connection.ALL_TO_ALL);
    input.connect(inputMemory, methods.connection.ONE_TO_ONE, 1);
    inputMemory.connect(hidden[0], methods.connection.ALL_TO_ALL);
    hidden[hidden.length - 1].connect(output, methods.connection.ALL_TO_ALL);
    output.connect(outputMemory, methods.connection.ONE_TO_ONE, 1);
    outputMemory.connect(hidden[0], methods.connection.ALL_TO_ALL);

    input.set({
      type: 'input'
    });
    output.set({
      type: 'output'
    });

    return architect.Construct(nodes);
  }
};




/*******************************************************************************
                                         NODE
*******************************************************************************/

function Node (type) {
  this.bias = (type === 'input') ? 0 : Math.random() * 0.2 - 0.1;
  this.squash = methods.activation.LOGISTIC;
  this.type = type || 'hidden';

  this.activation = 0;
  this.state = 0;
  this.old = 0;

  // For dropout
  this.mask = 1;

  // For tracking momentum
  this.previousDeltaBias = 0;

  // Batch training
  this.totalDeltaBias = 0;

  this.connections = {
    in: [],
    out: [],
    gated: [],
    self: new Connection(this, this, 0)
  };

  // Data for backpropagation
  this.error = {
    responsibility: 0,
    projected: 0,
    gated: 0
  };
}

Node.prototype = {
  /**
   * Activates the node
   */
  activate: function (input) {
    // Check if an input is given
    if (typeof input !== 'undefined') {
      this.activation = input;
      return this.activation;
    }

    this.old = this.state;

    // All activation sources coming from the node itself
    this.state = this.connections.self.gain * this.connections.self.weight * this.state + this.bias;

    // Activation sources coming from connections
    var i;
    for (i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];
      this.state += connection.from.activation * connection.weight * connection.gain;
    }

    // Squash the values received
    this.activation = this.squash(this.state) * this.mask;
    this.derivative = this.squash(this.state, true);

    // Update traces
    var nodes = [];
    var influences = [];

    for (i = 0; i < this.connections.gated.length; i++) {
      var conn = this.connections.gated[i];
      var node = conn.to;

      var index = nodes.indexOf(node);
      if (index > -1) {
        influences[index] += conn.weight * conn.from.activation;
      } else {
        nodes.push(node);
        influences.push(conn.weight * conn.from.activation +
          (node.connections.self.gater === this ? node.old : 0));
      }

      // Adjust the gain to this nodes' activation
      conn.gain = this.activation;
    }

    for (i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];

      // Elegibility trace
      connection.elegibility = this.connections.self.gain * this.connections.self.weight *
        connection.elegibility + connection.from.activation * connection.gain;

      // Extended trace
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        var influence = influences[j];

        var index = connection.xtrace.nodes.indexOf(node);

        if (index > -1) {
          connection.xtrace.values[index] = node.connections.self.gain * node.connections.self.weight *
            connection.xtrace.values[index] + this.derivative * connection.elegibility * influence;
        } else {
          // Does not exist there yet, might be through mutation
          connection.xtrace.nodes.push(node);
          connection.xtrace.values.push(this.derivative * connection.elegibility * influence);
        }
      }
    }

    return this.activation;
  },

  /**
   * Activates the node without calculating elegibility traces and such
   */
  noTraceActivate: function (input) {
    // Check if an input is given
    if (typeof input !== 'undefined') {
      this.activation = input;
      return this.activation;
    }

    // All activation sources coming from the node itself
    this.state = this.connections.self.gain * this.connections.self.weight * this.state + this.bias;

    // Activation sources coming from connections
    var i;
    for (i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];
      this.state += connection.from.activation * connection.weight * connection.gain;
    }

    // Squash the values received
    this.activation = this.squash(this.state);

    for (i = 0; i < this.connections.gated.length; i++) {
      this.connections.gated[i].gain = this.activation;
    }

    return this.activation;
  },

  /**
   * Back-propagate the error, aka learn
   */
  propagate: function (rate, momentum, update, target) {
    momentum = momentum || 0;
    rate = rate || 0.3;

    // Error accumulator
    var error = 0;

    // Output nodes get their error from the enviroment
    if (this.type === 'output') {
      this.error.responsibility = this.error.projected = target - this.activation;
    } else { // the rest of the nodes compute their error responsibilities by backpropagation
      // error responsibilities from all the connections projected from this node
      var i;
      for (i = 0; i < this.connections.out.length; i++) {
        var connection = this.connections.out[i];
        var node = connection.to;
        // Eq. 21
        error += node.error.responsibility * connection.weight * connection.gain;
      }

      // Projected error responsibility
      this.error.projected = this.derivative * error;

      // Error responsibilities from all connections gated by this neuron
      error = 0;

      for (i = 0; i < this.connections.gated.length; i++) {
        var conn = this.connections.gated[i];
        var node = conn.to;
        var influence = node.connections.self.gater === this ? node.old : 0;

        influence += conn.weight * conn.from.activation;
        error += node.error.responsibility * influence;
      }

      // Gated error responsibility
      this.error.gated = this.derivative * error;

      // Error responsibility
      this.error.responsibility = this.error.projected + this.error.gated;
    }

    if (this.type === 'constant') return;

    // Adjust all the node's incoming connections
    for (i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];

      var gradient = this.error.projected * connection.elegibility;

      for (var j = 0; j < connection.xtrace.nodes.length; j++) {
        var node = connection.xtrace.nodes[j];
        var value = connection.xtrace.values[j];
        gradient += node.error.responsibility * value;
      }

      // Adjust weight
      var deltaWeight = rate * gradient * this.mask;
      connection.totalDeltaWeight += deltaWeight;
      if (update) {
        connection.totalDeltaWeight += momentum * connection.previousDeltaWeight;
        connection.weight += connection.totalDeltaWeight;
        connection.previousDeltaWeight = connection.totalDeltaWeight;
        connection.totalDeltaWeight = 0;
      }
    }

    // Adjust bias
    var deltaBias = rate * this.error.responsibility;
    this.totalDeltaBias += deltaBias;
    if (update) {
      this.totalDeltaBias += momentum * this.previousDeltaBias;
      this.bias += this.totalDeltaBias;
      this.previousDeltaBias = this.totalDeltaBias;
      this.totalDeltaBias = 0;
    }
  },

  /**
   * Creates a connection from this node to the given node
   */
  connect: function (target, weight) {
    var connections = [];
    if (typeof target.bias !== 'undefined') { // must be a node!
      if (target === this) {
        // Turn on the self connection by setting the weight
        if (this.connections.self.weight !== 0) {
          if (config.warnings) console.warn('This connection already exists!');
        } else {
          this.connections.self.weight = weight || 1;
        }
        connections.push(this.connections.self);
      } else if (this.isProjectingTo(target)) {
        throw new Error('Already projecting a connection to this node!');
      } else {
        var connection = new Connection(this, target, weight);
        target.connections.in.push(connection);
        this.connections.out.push(connection);

        connections.push(connection);
      }
    } else { // should be a group
      for (var i = 0; i < target.nodes.length; i++) {
        var connection = new Connection(this, target.nodes[i], weight);
        target.nodes[i].connections.in.push(connection);
        this.connections.out.push(connection);
        target.connections.in.push(connection);

        connections.push(connection);
      }
    }
    return connections;
  },

  /**
   * Disconnects this node from the other node
   */
  disconnect: function (node, twosided) {
    if (this === node) {
      this.connections.self.weight = 0;
      return;
    }

    for (var i = 0; i < this.connections.out.length; i++) {
      var conn = this.connections.out[i];
      if (conn.to === node) {
        this.connections.out.splice(i, 1);
        var j = conn.to.connections.in.indexOf(conn);
        conn.to.connections.in.splice(j, 1);
        if (conn.gater !== null) conn.gater.ungate(conn);
        break;
      }
    }

    if (twosided) {
      node.disconnect(this);
    }
  },

  /**
   * Make this node gate a connection
   */
  gate: function (connections) {
    if (!Array.isArray(connections)) {
      connections = [connections];
    }

    for (var i = 0; i < connections.length; i++) {
      var connection = connections[i];

      this.connections.gated.push(connection);
      connection.gater = this;
    }
  },

  /**
   * Removes the gates from this node from the given connection(s)
   */
  ungate: function (connections) {
    if (!Array.isArray(connections)) {
      connections = [connections];
    }

    for (var i = connections.length - 1; i >= 0; i--) {
      var connection = connections[i];

      var index = this.connections.gated.indexOf(connection);
      this.connections.gated.splice(index, 1);
      connection.gater = null;
      connection.gain = 1;
    }
  },

  /**
   * Clear the context of the node
   */
  clear: function () {
    for (var i = 0; i < this.connections.in.length; i++) {
      var connection = this.connections.in[i];

      connection.elegibility = 0;
      connection.xtrace = {
        nodes: [],
        values: []
      };
    }

    for (i = 0; i < this.connections.gated.length; i++) {
      var conn = this.connections.gated[i];
      conn.gain = 0;
    }

    this.error.responsibility = this.error.projected = this.error.gated = 0;
    this.old = this.state = this.activation = 0;
  },

  /**
   * Mutates the node with the given method
   */
  mutate: function (method) {
    if (typeof method === 'undefined') {
      throw new Error('No mutate method given!');
    } else if (!(method.name in methods.mutation)) {
      throw new Error('This method does not exist!');
    }

    switch (method) {
      case methods.mutation.MOD_ACTIVATION:
        // Can't be the same squash
        var squash = method.allowed[(method.allowed.indexOf(this.squash) + Math.floor(Math.random() * (method.allowed.length - 1)) + 1) % method.allowed.length];
        this.squash = squash;
        break;
      case methods.mutation.MOD_BIAS:
        var modification = Math.random() * (method.max - method.min) + method.min;
        this.bias += modification;
        break;
    }
  },

  /**
   * Checks if this node is projecting to the given node
   */
  isProjectingTo: function (node) {
    if (node === this && this.connections.self.weight !== 0) return true;

    for (var i = 0; i < this.connections.out.length; i++) {
      var conn = this.connections.out[i];
      if (conn.to === node) {
        return true;
      }
    }
    return false;
  },

  /**
   * Checks if the given node is projecting to this node
   */
  isProjectedBy: function (node) {
    if (node === this && this.connections.self.weight !== 0) return true;

    for (var i = 0; i < this.connections.in.length; i++) {
      var conn = this.connections.in[i];
      if (conn.from === node) {
        return true;
      }
    }

    return false;
  },

  /**
   * Converts the node to a json object
   */
  toJSON: function () {
    var json = {
      bias: this.bias,
      type: this.type,
      squash: this.squash.name,
      mask: this.mask
    };

    return json;
  }
};

/**
 * Convert a json object to a node
 */
Node.fromJSON = function (json) {
  var node = new Node();
  node.bias = json.bias;
  node.type = json.type;
  node.mask = json.mask;
  node.squash = methods.activation[json.squash];

  return node;
};

/*******************************************************************************
                                         Group
*******************************************************************************/

function Layer () {
  this.output = null;

  this.nodes = [];
  this.connections = { in: [],
    out: [],
    self: []
  };
}

Layer.prototype = {
  /**
   * Activates all the nodes in the group
   */
  activate: function (value) {
    var values = [];

    if (typeof value !== 'undefined' && value.length !== this.nodes.length) {
      throw new Error('Array with values should be same as the amount of nodes!');
    }

    for (var i = 0; i < this.nodes.length; i++) {
      var activation;
      if (typeof value === 'undefined') {
        activation = this.nodes[i].activate();
      } else {
        activation = this.nodes[i].activate(value[i]);
      }

      values.push(activation);
    }

    return values;
  },

  /**
   * Propagates all the node in the group
   */
  propagate: function (rate, momentum, target) {
    if (typeof target !== 'undefined' && target.length !== this.nodes.length) {
      throw new Error('Array with values should be same as the amount of nodes!');
    }

    for (var i = this.nodes.length - 1; i >= 0; i--) {
      if (typeof target === 'undefined') {
        this.nodes[i].propagate(rate, momentum, true);
      } else {
        this.nodes[i].propagate(rate, momentum, true, target[i]);
      }
    }
  },

  /**
   * Connects the nodes in this group to nodes in another group or just a node
   */
  connect: function (target, method, weight) {
    var connections;
    if (target instanceof Group || target instanceof Node) {
      connections = this.output.connect(target, method, weight);
    } else if (target instanceof Layer) {
      connections = target.input(this, method, weight);
    }

    return connections;
  },

  /**
   * Make nodes from this group gate the given connection(s)
   */
  gate: function (connections, method) {
    this.output.gate(connections, method);
  },

  /**
   * Sets the value of a property for every node
   */
  set: function (values) {
    for (var i = 0; i < this.nodes.length; i++) {
      var node = this.nodes[i];

      if (node instanceof Node) {
        if (typeof values.bias !== 'undefined') {
          node.bias = values.bias;
        }

        node.squash = values.squash || node.squash;
        node.type = values.type || node.type;
      } else if (node instanceof Group) {
        node.set(values);
      }
    }
  },

  /**
   * Disconnects all nodes from this group from another given group/node
   */
  disconnect: function (target, twosided) {
    twosided = twosided || false;

    // In the future, disconnect will return a connection so indexOf can be used
    var i, j, k;
    if (target instanceof Group) {
      for (i = 0; i < this.nodes.length; i++) {
        for (j = 0; j < target.nodes.length; j++) {
          this.nodes[i].disconnect(target.nodes[j], twosided);

          for (k = this.connections.out.length - 1; k >= 0; k--) {
            var conn = this.connections.out[k];

            if (conn.from === this.nodes[i] && conn.to === target.nodes[j]) {
              this.connections.out.splice(k, 1);
              break;
            }
          }

          if (twosided) {
            for (k = this.connections.in.length - 1; k >= 0; k--) {
              var conn = this.connections.in[k];

              if (conn.from === target.nodes[j] && conn.to === this.nodes[i]) {
                this.connections.in.splice(k, 1);
                break;
              }
            }
          }
        }
      }
    } else if (target instanceof Node) {
      for (i = 0; i < this.nodes.length; i++) {
        this.nodes[i].disconnect(target, twosided);

        for (j = this.connections.out.length - 1; j >= 0; j--) {
          var conn = this.connections.out[j];

          if (conn.from === this.nodes[i] && conn.to === target) {
            this.connections.out.splice(j, 1);
            break;
          }
        }

        if (twosided) {
          for (k = this.connections.in.length - 1; k >= 0; k--) {
            var conn = this.connections.in[k];

            if (conn.from === target && conn.to === this.nodes[i]) {
              this.connections.in.splice(k, 1);
              break;
            }
          }
        }
      }
    }
  },

  /**
   * Clear the context of this group
   */
  clear: function () {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
  }
};

Layer.Dense = function (size) {
  // Create the layer
  var layer = new Layer();

  // Init required nodes (in activation order)
  var block = new Group(size);

  layer.nodes.push(block);
  layer.output = block;

  layer.input = function (from, method, weight) {
    if (from instanceof Layer) from = from.output;
    method = method || methods.connection.ALL_TO_ALL;
    return from.connect(block, method, weight);
  };

  return layer;
};

Layer.LSTM = function (size) {
  // Create the layer
  var layer = new Layer();

  // Init required nodes (in activation order)
  var inputGate = new Group(size);
  var forgetGate = new Group(size);
  var memoryCell = new Group(size);
  var outputGate = new Group(size);
  var outputBlock = new Group(size);

  inputGate.set({
    bias: 1
  });
  forgetGate.set({
    bias: 1
  });
  outputGate.set({
    bias: 1
  });

  // Set up internal connections
  memoryCell.connect(inputGate, methods.connection.ALL_TO_ALL);
  memoryCell.connect(forgetGate, methods.connection.ALL_TO_ALL);
  memoryCell.connect(outputGate, methods.connection.ALL_TO_ALL);
  var forget = memoryCell.connect(memoryCell, methods.connection.ONE_TO_ONE);
  var output = memoryCell.connect(outputBlock, methods.connection.ALL_TO_ALL);

  // Set up gates
  forgetGate.gate(forget, methods.gating.SELF);
  outputGate.gate(output, methods.gating.OUTPUT);

  // Add to nodes array
  layer.nodes = [inputGate, forgetGate, memoryCell, outputGate, outputBlock];

  // Define output
  layer.output = outputBlock;

  layer.input = function (from, method, weight) {
    if (from instanceof Layer) from = from.output;
    method = method || methods.connection.ALL_TO_ALL;
    var connections = [];

    var input = from.connect(memoryCell, method, weight);
    connections = connections.concat(input);

    connections = connections.concat(from.connect(inputGate, method, weight));
    connections = connections.concat(from.connect(outputGate, method, weight));
    connections = connections.concat(from.connect(forgetGate, method, weight));

    inputGate.gate(input, methods.gating.INPUT);

    return connections;
  };

  return layer;
};

Layer.GRU = function (size) {
  // Create the layer
  var layer = new Layer();

  var updateGate = new Group(size);
  var inverseUpdateGate = new Group(size);
  var resetGate = new Group(size);
  var memoryCell = new Group(size);
  var output = new Group(size);
  var previousOutput = new Group(size);

  previousOutput.set({
    bias: 0,
    squash: methods.activation.IDENTITY,
    type: 'constant'
  });
  memoryCell.set({
    squash: methods.activation.TANH
  });
  inverseUpdateGate.set({
    bias: 0,
    squash: methods.activation.INVERSE,
    type: 'constant'
  });
  updateGate.set({
    bias: 1
  });
  resetGate.set({
    bias: 0
  });

  // Update gate calculation
  previousOutput.connect(updateGate, methods.connection.ALL_TO_ALL);

  // Inverse update gate calculation
  updateGate.connect(inverseUpdateGate, methods.connection.ONE_TO_ONE, 1);

  // Reset gate calculation
  previousOutput.connect(resetGate, methods.connection.ALL_TO_ALL);

  // Memory calculation
  var reset = previousOutput.connect(memoryCell, methods.connection.ALL_TO_ALL);

  resetGate.gate(reset, methods.gating.OUTPUT); // gate

  // Output calculation
  var update1 = previousOutput.connect(output, methods.connection.ALL_TO_ALL);
  var update2 = memoryCell.connect(output, methods.connection.ALL_TO_ALL);

  updateGate.gate(update1, methods.gating.OUTPUT);
  inverseUpdateGate.gate(update2, methods.gating.OUTPUT);

  // Previous output calculation
  output.connect(previousOutput, methods.connection.ONE_TO_ONE, 1);

  // Add to nodes array
  layer.nodes = [updateGate, inverseUpdateGate, resetGate, memoryCell, output, previousOutput];

  layer.output = output;

  layer.input = function (from, method, weight) {
    if (from instanceof Layer) from = from.output;
    method = method || methods.connection.ALL_TO_ALL;
    var connections = [];

    connections = connections.concat(from.connect(updateGate, method, weight));
    connections = connections.concat(from.connect(resetGate, method, weight));
    connections = connections.concat(from.connect(memoryCell, method, weight));

    return connections;
  };

  return layer;
};

Layer.Memory = function (size, memory) {
  // Create the layer
  var layer = new Layer();
  // Because the output can only be one group, we have to put the nodes all in óne group

  var previous = null;
  var i;
  for (i = 0; i < memory; i++) {
    var block = new Group(size);

    block.set({
      squash: methods.activation.IDENTITY,
      bias: 0,
      type: 'constant'
    });

    if (previous != null) {
      previous.connect(block, methods.connection.ONE_TO_ONE, 1);
    }

    layer.nodes.push(block);
    previous = block;
  }

  layer.nodes.reverse();

  for (i = 0; i < layer.nodes.length; i++) {
    layer.nodes[i].nodes.reverse();
  }

  // Because output can only be óne group, fit all memory nodes in óne group
  var outputGroup = new Group(0);
  for (var group in layer.nodes) {
    outputGroup.nodes = outputGroup.nodes.concat(layer.nodes[group].nodes);
  }
  layer.output = outputGroup;

  layer.input = function (from, method, weight) {
    if (from instanceof Layer) from = from.output;
    method = method || methods.connection.ALL_TO_ALL;

    if (from.nodes.length !== layer.nodes[layer.nodes.length - 1].nodes.length) {
      throw new Error('Previous layer size must be same as memory size');
    }

    return from.connect(layer.nodes[layer.nodes.length - 1], methods.connection.ONE_TO_ONE, 1);
  };

  return layer;
};


/*******************************************************************************
                                         Group
*******************************************************************************/

function Group (size) {
  this.nodes = [];
  this.connections = {
    in: [],
    out: [],
    self: []
  };

  for (var i = 0; i < size; i++) {
    this.nodes.push(new Node());
  }
}

Group.prototype = {
  /**
   * Activates all the nodes in the group
   */
  activate: function (value) {
    var values = [];

    if (typeof value !== 'undefined' && value.length !== this.nodes.length) {
      throw new Error('Array with values should be same as the amount of nodes!');
    }

    for (var i = 0; i < this.nodes.length; i++) {
      var activation;
      if (typeof value === 'undefined') {
        activation = this.nodes[i].activate();
      } else {
        activation = this.nodes[i].activate(value[i]);
      }

      values.push(activation);
    }

    return values;
  },

  /**
   * Propagates all the node in the group
   */
  propagate: function (rate, momentum, target) {
    if (typeof target !== 'undefined' && target.length !== this.nodes.length) {
      throw new Error('Array with values should be same as the amount of nodes!');
    }

    for (var i = this.nodes.length - 1; i >= 0; i--) {
      if (typeof target === 'undefined') {
        this.nodes[i].propagate(rate, momentum, true);
      } else {
        this.nodes[i].propagate(rate, momentum, true, target[i]);
      }
    }
  },

  /**
   * Connects the nodes in this group to nodes in another group or just a node
   */
  connect: function (target, method, weight) {
    var connections = [];
    var i, j;
    if (target instanceof Group) {
      if (typeof method === 'undefined') {
        if (this !== target) {
          if (config.warnings) console.warn('No group connection specified, using ALL_TO_ALL');
          method = methods.connection.ALL_TO_ALL;
        } else {
          if (config.warnings) console.warn('No group connection specified, using ONE_TO_ONE');
          method = methods.connection.ONE_TO_ONE;
        }
      }
      if (method === methods.connection.ALL_TO_ALL || method === methods.connection.ALL_TO_ELSE) {
        for (i = 0; i < this.nodes.length; i++) {
          for (j = 0; j < target.nodes.length; j++) {
            if (method === methods.connection.ALL_TO_ELSE && this.nodes[i] === target.nodes[j]) continue;
            var connection = this.nodes[i].connect(target.nodes[j], weight);
            this.connections.out.push(connection[0]);
            target.connections.in.push(connection[0]);
            connections.push(connection[0]);
          }
        }
      } else if (method === methods.connection.ONE_TO_ONE) {
        if (this.nodes.length !== target.nodes.length) {
          throw new Error('From and To group must be the same size!');
        }

        for (i = 0; i < this.nodes.length; i++) {
          var connection = this.nodes[i].connect(target.nodes[i], weight);
          this.connections.self.push(connection[0]);
          connections.push(connection[0]);
        }
      }
    } else if (target instanceof Layer) {
      connections = target.input(this, method, weight);
    } else if (target instanceof Node) {
      for (i = 0; i < this.nodes.length; i++) {
        var connection = this.nodes[i].connect(target, weight);
        this.connections.out.push(connection[0]);
        connections.push(connection[0]);
      }
    }

    return connections;
  },

  /**
   * Make nodes from this group gate the given connection(s)
   */
  gate: function (connections, method) {
    if (typeof method === 'undefined') {
      throw new Error('Please specify Gating.INPUT, Gating.OUTPUT');
    }

    if (!Array.isArray(connections)) {
      connections = [connections];
    }

    var nodes1 = [];
    var nodes2 = [];

    var i, j;
    for (i = 0; i < connections.length; i++) {
      var connection = connections[i];
      if (!nodes1.includes(connection.from)) nodes1.push(connection.from);
      if (!nodes2.includes(connection.to)) nodes2.push(connection.to);
    }

    switch (method) {
      case methods.gating.INPUT:
        for (i = 0; i < nodes2.length; i++) {
          var node = nodes2[i];
          var gater = this.nodes[i % this.nodes.length];

          for (j = 0; j < node.connections.in.length; j++) {
            var conn = node.connections.in[j];
            if (connections.includes(conn)) {
              gater.gate(conn);
            }
          }
        }
        break;
      case methods.gating.OUTPUT:
        for (i = 0; i < nodes1.length; i++) {
          var node = nodes1[i];
          var gater = this.nodes[i % this.nodes.length];

          for (j = 0; j < node.connections.out.length; j++) {
            var conn = node.connections.out[j];
            if (connections.includes(conn)) {
              gater.gate(conn);
            }
          }
        }
        break;
      case methods.gating.SELF:
        for (i = 0; i < nodes1.length; i++) {
          var node = nodes1[i];
          var gater = this.nodes[i % this.nodes.length];

          if (connections.includes(node.connections.self)) {
            gater.gate(node.connections.self);
          }
        }
    }
  },

  /**
   * Sets the value of a property for every node
   */
  set: function (values) {
    for (var i = 0; i < this.nodes.length; i++) {
      if (typeof values.bias !== 'undefined') {
        this.nodes[i].bias = values.bias;
      }

      this.nodes[i].squash = values.squash || this.nodes[i].squash;
      this.nodes[i].type = values.type || this.nodes[i].type;
    }
  },

  /**
   * Disconnects all nodes from this group from another given group/node
   */
  disconnect: function (target, twosided) {
    twosided = twosided || false;

    // In the future, disconnect will return a connection so indexOf can be used
    var i, j, k;
    if (target instanceof Group) {
      for (i = 0; i < this.nodes.length; i++) {
        for (j = 0; j < target.nodes.length; j++) {
          this.nodes[i].disconnect(target.nodes[j], twosided);

          for (k = this.connections.out.length - 1; k >= 0; k--) {
            var conn = this.connections.out[k];

            if (conn.from === this.nodes[i] && conn.to === target.nodes[j]) {
              this.connections.out.splice(k, 1);
              break;
            }
          }

          if (twosided) {
            for (k = this.connections.in.length - 1; k >= 0; k--) {
              var conn = this.connections.in[k];

              if (conn.from === target.nodes[j] && conn.to === this.nodes[i]) {
                this.connections.in.splice(k, 1);
                break;
              }
            }
          }
        }
      }
    } else if (target instanceof Node) {
      for (i = 0; i < this.nodes.length; i++) {
        this.nodes[i].disconnect(target, twosided);

        for (j = this.connections.out.length - 1; j >= 0; j--) {
          var conn = this.connections.out[j];

          if (conn.from === this.nodes[i] && conn.to === target) {
            this.connections.out.splice(j, 1);
            break;
          }
        }

        if (twosided) {
          for (j = this.connections.in.length - 1; j >= 0; j--) {
            var conn = this.connections.in[j];

            if (conn.from === target && conn.to === this.nodes[i]) {
              this.connections.in.splice(j, 1);
              break;
            }
          }
        }
      }
    }
  },

  /**
   * Clear the context of this group
   */
  clear: function () {
    for (var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].clear();
    }
  }
};

/* Easier variable naming */
var selection = methods.selection;

/*******************************************************************************
                                         NEAT
*******************************************************************************/

function Neat (input, output, fitness, options) {
  this.input = input; // The input size of the networks
  this.output = output; // The output size of the networks
  this.fitness = fitness; // The fitness function to evaluate the networks

  // Configure options
  options = options || {};
  this.equal = options.equal || false;
  this.clear = options.clear || false;
  this.popsize = options.popsize || 50;
  this.elitism = options.elitism || 0;
  this.provenance = options.provenance || 0;
  this.mutationRate = options.mutationRate || 0.3;
  this.mutationAmount = options.mutationAmount || 1;

  this.fitnessPopulation = options.fitnessPopulation || false;

  this.selection = options.selection || methods.selection.POWER;
  this.crossover = options.crossover || [
    methods.crossover.SINGLE_POINT,
    methods.crossover.TWO_POINT,
    methods.crossover.UNIFORM,
    methods.crossover.AVERAGE
  ];
  this.mutation = options.mutation || methods.mutation.FFW;

  this.template = options.network || false;

  this.maxNodes = options.maxNodes || Infinity;
  this.maxConns = options.maxConns || Infinity;
  this.maxGates = options.maxGates || Infinity;

  // Custom mutation selection function if given
  this.selectMutationMethod = typeof options.mutationSelection === 'function' ? options.mutationSelection.bind(this) : this.selectMutationMethod;

  // Generation counter
  this.generation = 0;

  // Initialise the genomes
  this.createPool(this.template);
}

Neat.prototype = {
  /**
   * Create the initial pool of genomes
   */
  createPool: function (network) {
    this.population = [];

    for (var i = 0; i < this.popsize; i++) {
      var copy;
      if (this.template) {
        copy = Network.fromJSON(network.toJSON());
      } else {
        copy = new Network(this.input, this.output);
      }
      copy.score = undefined;
      this.population.push(copy);
    }
  },

  /**
   * Evaluates, selects, breeds and mutates population
   */
  evolve: function () {
    // Check if evaluated, sort the population
    if (typeof this.population[this.population.length - 1].score === 'undefined') {
      this.evaluate();
    }
    this.sort();

    var fittest = Network.fromJSON(this.population[0].toJSON());
    fittest.score = this.population[0].score;

    var newPopulation = [];

    // Elitism
    var elitists = [];
    for (var i = 0; i < this.elitism; i++) {
      elitists.push(this.population[i]);
    }

    // Provenance
    for (i = 0; i < this.provenance; i++) {
      newPopulation.push(Network.fromJSON(this.template.toJSON()));
    }

    // Breed the next individuals
    for (i = 0; i < this.popsize - this.elitism - this.provenance; i++) {
      newPopulation.push(this.getOffspring());
    }

    // Replace the old population with the new population
    this.population = newPopulation;
    this.mutate();

    // this.population.push(...elitists);
    var _this$population;
    (_this$population = this.population).push.apply(_this$population, elitists); 

    // Reset the scores
    for (i = 0; i < this.population.length; i++) {
      this.population[i].score = undefined;
    }

    this.generation++;

    return fittest;
  },

  /**
   * Breeds two parents into an offspring, population MUST be surted
   */
  getOffspring: function () {
    var parent1 = this.getParent();
    var parent2 = this.getParent();

    return Network.crossOver(parent1, parent2, this.equal);
  },

  /**
   * Selects a random mutation method for a genome according to the parameters
   */
  selectMutationMethod: function (genome) {
    var mutationMethod = this.mutation[Math.floor(Math.random() * this.mutation.length)];

    if (mutationMethod === methods.mutation.ADD_NODE && genome.nodes.length >= this.maxNodes) {
      if (config.warnings) console.warn('maxNodes exceeded!');
      return;
    }

    if (mutationMethod === methods.mutation.ADD_CONN && genome.connections.length >= this.maxConns) {
      if (config.warnings) console.warn('maxConns exceeded!');
      return;
    }

    if (mutationMethod === methods.mutation.ADD_GATE && genome.gates.length >= this.maxGates) {
      if (config.warnings) console.warn('maxGates exceeded!');
      return;
    }

    return mutationMethod;
  },

  /**
   * Mutates the given (or current) population
   */
  mutate: function () {
    // Elitist genomes should not be included
    for (var i = 0; i < this.population.length; i++) {
      if (Math.random() <= this.mutationRate) {
        for (var j = 0; j < this.mutationAmount; j++) {
          var mutationMethod = this.selectMutationMethod(this.population[i]);
          this.population[i].mutate(mutationMethod);
        }
      }
    }
  },

  /**
   * Evaluates the current population
   */
  evaluate: function () {
    var i;
    if (this.fitnessPopulation) {
      if (this.clear) {
        for (i = 0; i < this.population.length; i++) {
          this.population[i].clear();
        }
      }
      this.fitness(this.population);
    } else {
      for (i = 0; i < this.population.length; i++) {
        var genome = this.population[i];
        if (this.clear) genome.clear();
        genome.score = this.fitness(genome);
      }
    }
  },

  /**
   * Sorts the population by score
   */
  sort: function () {
    this.population.sort(function (a, b) {
      return b.score - a.score;
    });
  },

  /**
   * Returns the fittest genome of the current population
   */
  getFittest: function () {
    // Check if evaluated
    if (typeof this.population[this.population.length - 1].score === 'undefined') {
      this.evaluate();
    }
    if (this.population[0].score < this.population[1].score) {
      this.sort();
    }

    return this.population[0];
  },

  /**
   * Returns the average fitness of the current population
   */
  getAverage: function () {
    if (typeof this.population[this.population.length - 1].score === 'undefined') {
      this.evaluate();
    }

    var score = 0;
    for (var i = 0; i < this.population.length; i++) {
      score += this.population[i].score;
    }

    return score / this.population.length;
  },

  /**
   * Gets a genome based on the selection function
   * @return {Network} genome
   */
  getParent: function () {
    var i;
    switch (this.selection) {
      case selection.POWER:
        if (this.population[0].score < this.population[1].score) this.sort();

        var index = Math.floor(Math.pow(Math.random(), this.selection.power) * this.population.length);
        return this.population[index];
      case selection.FITNESS_PROPORTIONATE:
        // As negative fitnesses are possible
        // https://stackoverflow.com/questions/16186686/genetic-algorithm-handling-negative-fitness-values
        // this is unnecessarily run for every individual, should be changed

        var totalFitness = 0;
        var minimalFitness = 0;
        for (i = 0; i < this.population.length; i++) {
          var score = this.population[i].score;
          minimalFitness = score < minimalFitness ? score : minimalFitness;
          totalFitness += score;
        }

        minimalFitness = Math.abs(minimalFitness);
        totalFitness += minimalFitness * this.population.length;

        var random = Math.random() * totalFitness;
        var value = 0;

        for (i = 0; i < this.population.length; i++) {
          var genome = this.population[i];
          value += genome.score + minimalFitness;
          if (random < value) return genome;
        }

        // if all scores equal, return random genome
        return this.population[Math.floor(Math.random() * this.population.length)];
      case selection.TOURNAMENT:
        if (this.selection.size > this.popsize) {
          throw new Error('Your tournament size should be lower than the population size, please change methods.selection.TOURNAMENT.size');
        }

        // Create a tournament
        var individuals = [];
        for (i = 0; i < this.selection.size; i++) {
          var random = this.population[Math.floor(Math.random() * this.population.length)];
          individuals.push(random);
        }

        // Sort the tournament individuals by score
        individuals.sort(function (a, b) {
          return b.score - a.score;
        });

        // Select an individual
        for (i = 0; i < this.selection.size; i++) {
          if (Math.random() < this.selection.probability || i === this.selection.size - 1) {
            return individuals[i];
          }
        }
    }
  },
  
  
  test: function (L,data) {
    
  },

  /**
   * Export the current population to a json object
   */
  export: function () {
    var json = [];
    for (var i = 0; i < this.population.length; i++) {
      var genome = this.population[i];
      json.push(genome.toJSON());
    }

    return json;
  },

  /**
   * Import population from a json object
   */
  import: function (json) {
    var population = [];
    for (var i = 0; i < json.length; i++) {
      var genome = json[i];
      population.push(Network.fromJSON(genome));
    }
    this.population = population;
    this.popsize = population.length;
  }
};


var Neataptic = {
  methods: methods,
  Connection: Connection,
  architect: architect,
  Network: Network,
  config: config,
  Group: Group,
  Layer: Layer,
  Node: Node,
  Neat: Neat
};

module.exports = Neataptic
};

Base64=Require('os/base64');
Buffer=Require('os/buffer').Buffer;
process=Require('os/process');
window.ML=ML = Require('/home/sbosse/proj/jam/js/ml/ml.js');
