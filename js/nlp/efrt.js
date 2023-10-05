(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.efrt = factory());
}(this, function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var commonPrefix = function(w1, w2) {
	  var len = Math.min(w1.length, w2.length);
	  while (len > 0) {
	    var prefix = w1.slice(0, len);
	    if (prefix === w2.slice(0, len)) {
	      return prefix
	    }
	    len -= 1;
	  }
	  return ''
	};

	/* Sort elements and remove duplicates from array (modified in place) */
	var unique = function(a) {
	  a.sort();
	  for (var i = 1; i < a.length; i++) {
	    if (a[i - 1] === a[i]) {
	      a.splice(i, 1);
	    }
	  }
	};

	var fns = {
	  commonPrefix: commonPrefix,
	  unique: unique
	};

	var Histogram = function() {
	  this.counts = {};
	};

	var methods = {
	  init: function(sym) {
	    if (this.counts[sym] === undefined) {
	      this.counts[sym] = 0;
	    }
	  },
	  add: function(sym, n) {
	    if (n === undefined) {
	      n = 1;
	    }
	    this.init(sym);
	    this.counts[sym] += n;
	  },
	  countOf: function(sym) {
	    this.init(sym);
	    return this.counts[sym]
	  },
	  highest: function(top) {
	    var sorted = [];
	    var keys = Object.keys(this.counts);
	    for (var i = 0; i < keys.length; i++) {
	      var sym = keys[i];
	      sorted.push([sym, this.counts[sym]]);
	    }
	    sorted.sort(function(a, b) {
	      return b[1] - a[1]
	    });
	    if (top) {
	      sorted = sorted.slice(0, top);
	    }
	    return sorted
	  }
	};
	Object.keys(methods).forEach(function(k) {
	  Histogram.prototype[k] = methods[k];
	});
	var histogram = Histogram;

	var BASE = 36;

	var seq = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var cache = seq.split('').reduce(function(h, c, i) {
	  h[c] = i;
	  return h
	}, {});

	// 0, 1, 2, ..., A, B, C, ..., 00, 01, ... AA, AB, AC, ..., AAA, AAB, ...
	var toAlphaCode = function(n) {
	  if (seq[n] !== undefined) {
	    return seq[n]
	  }
	  var places = 1;
	  var range = BASE;
	  var s = '';

	  for (; n >= range; n -= range, places++, range *= BASE) {}
	  while (places--) {
	    var d = n % BASE;
	    s = String.fromCharCode((d < 10 ? 48 : 55) + d) + s;
	    n = (n - d) / BASE;
	  }
	  return s
	};

	var fromAlphaCode = function(s) {
	  if (cache[s] !== undefined) {
	    return cache[s]
	  }
	  var n = 0;
	  var places = 1;
	  var range = BASE;
	  var pow = 1;

	  for (; places < s.length; n += range, places++, range *= BASE) {}
	  for (var i = s.length - 1; i >= 0; i--, pow *= BASE) {
	    var d = s.charCodeAt(i) - 48;
	    if (d > 10) {
	      d -= 7;
	    }
	    n += d * pow;
	  }
	  return n
	};

	var encoding = {
	  toAlphaCode: toAlphaCode,
	  fromAlphaCode: fromAlphaCode
	};

	var config = {
      SYM_SEP: '|',
	  NODE_SEP: ';',
	  KEY_VAL: ':',
	  STRING_SEP: ',',
	  TERMINAL_PREFIX: '!',
	  BASE: 36
	};

	// Return packed representation of Trie as a string.

	// Return packed representation of Trie as a string.
	//
	// Each node of the Trie is output on a single line.
	//
	// For example Trie("the them there thesis this"):
	// {
	//    "th": {
	//      "is": 1,
	//      "e": {
	//        "": 1,
	//        "m": 1,
	//        "re": 1,
	//        "sis": 1
	//      }
	//    }
	//  }
	//
	// Would be reperesented as:
	//
	// th0
	// e0is
	// !m,re,sis
	//
	// The line begins with a '!' iff it is a terminal node of the Trie.
	// For each string property in a node, the string is listed, along
	// with a (relative!) line number of the node that string references.
	// Terminal strings (those without child node references) are
	// separated by ',' characters.

	var nodeLine = function(self, node) {
	  var line = '',
	    sep = '';

	  if (self.isTerminal(node)) {
	    line += config.TERMINAL_PREFIX;
	  }

	  var props = self.nodeProps(node);
	  for (var i = 0; i < props.length; i++) {
	    var prop = props[i];
	    if (typeof node[prop] === 'number') {
	      line += sep + prop;
	      sep = config.STRING_SEP;
	      continue
	    }
	    if (self.syms[node[prop]._n]) {
	      line += sep + prop + self.syms[node[prop]._n];
	      sep = '';
	      continue
	    }
	    var ref = encoding.toAlphaCode(node._n - node[prop]._n - 1 + self.symCount);
	    // Large reference to smaller string suffix -> duplicate suffix
	    if (node[prop]._g && ref.length >= node[prop]._g.length && node[node[prop]._g] === 1) {
	      ref = node[prop]._g;
	      line += sep + prop + ref;
	      sep = config.STRING_SEP;
	      continue
	    }
	    line += sep + prop + ref;
	    sep = '';
	  }
	  return line
	};

	var analyzeRefs = function(self, node) {
	  if (self.visited(node)) {
	    return
	  }
	  var props = self.nodeProps(node, true);
	  for (var i = 0; i < props.length; i++) {
	    var prop = props[i];
	    var ref = node._n - node[prop]._n - 1;
	    // Count the number of single-character relative refs
	    if (ref < config.BASE) {
	      self.histRel.add(ref);
	    }
	    // Count the number of characters saved by converting an absolute
	    // reference to a one-character symbol.
	    self.histAbs.add(node[prop]._n, encoding.toAlphaCode(ref).length - 1);
	    analyzeRefs(self, node[prop]);
	  }
	};

	var symbolCount = function(self) {
	  self.histAbs = self.histAbs.highest(config.BASE);
	  var savings = [];
	  savings[-1] = 0;
	  var best = 0,
	    sCount = 0;
	  var defSize = 3 + encoding.toAlphaCode(self.nodeCount).length;
	  for (var sym = 0; sym < config.BASE; sym++) {
	    if (self.histAbs[sym] === undefined) {
	      break
	    }
	    savings[sym] =
	      self.histAbs[sym][1] -
	      defSize -
	      self.histRel.countOf(config.BASE - sym - 1) +
	      savings[sym - 1];
	    if (savings[sym] >= best) {
	      best = savings[sym];
	      sCount = sym + 1;
	    }
	  }
	  return sCount
	};

	var numberNodes = function(self, node) {
	  // Topological sort into nodes array
	  if (node._n !== undefined) {
	    return
	  }
	  var props = self.nodeProps(node, true);
	  for (var i = 0; i < props.length; i++) {
	    numberNodes(self, node[props[i]]); //recursive
	  }
	  node._n = self.pos++;
	  self.nodes.unshift(node);
	};

	var pack = function(self) {
	  self.nodes = [];
	  self.nodeCount = 0;
	  self.syms = {};
	  self.symCount = 0;
	  self.pos = 0;
	  // Make sure we've combined all the common suffixes
	  self.optimize();

	  self.histAbs = new histogram();
	  self.histRel = new histogram();

	  numberNodes(self, self.root);
	  self.nodeCount = self.nodes.length;

	  self.prepDFS();
	  analyzeRefs(self, self.root);
	  self.symCount = symbolCount(self);
	  for (var sym = 0; sym < self.symCount; sym++) {
	    self.syms[self.histAbs[sym][0]] = encoding.toAlphaCode(sym);
	  }
	  for (var i = 0; i < self.nodeCount; i++) {
	    self.nodes[i] = nodeLine(self, self.nodes[i]);
	  }
	  // Prepend symbols
	  for (var sym = self.symCount - 1; sym >= 0; sym--) {
	    self.nodes.unshift(
	      encoding.toAlphaCode(sym) +
	        config.KEY_VAL +
	        encoding.toAlphaCode(self.nodeCount - self.histAbs[sym][0] - 1)
	    );
	  }

	  return self.nodes.join(config.NODE_SEP)
	};

	var pack_1 = pack;

	var NOT_ALLOWED = new RegExp('[0-9A-Z,;!:|¦]'); //characters banned from entering the trie

	var methods$1 = {
	  // Insert words from one big string, or from an array.
	  insertWords: function(words) {
	    if (words === undefined) {
	      return
	    }
	    if (typeof words === 'string') {
	      words = words.split(/[^a-zA-Z]+/);
	    }
	    for (var i = 0; i < words.length; i++) {
	      words[i] = words[i].toLowerCase();
	    }
	    fns.unique(words);
	    for (var i = 0; i < words.length; i++) {
	      if (words[i].match(NOT_ALLOWED) === null) {
	        this.insert(words[i]);
	      }
	    }
	  },

	  insert: function(word) {
	    this._insert(word, this.root);
	    var lastWord = this.lastWord;
	    this.lastWord = word;

	    var prefix = fns.commonPrefix(word, lastWord);
	    if (prefix === lastWord) {
	      return
	    }

	    var freeze = this.uniqueNode(lastWord, word, this.root);
	    if (freeze) {
	      this.combineSuffixNode(freeze);
	    }
	  },

	  _insert: function(word, node) {
	    var prefix, next;

	    // Duplicate word entry - ignore
	    if (word.length === 0) {
	      return
	    }

	    // Do any existing props share a common prefix?
	    var keys = Object.keys(node);
	    for (var i = 0; i < keys.length; i++) {
	      var prop = keys[i];
	      prefix = fns.commonPrefix(word, prop);
	      if (prefix.length === 0) {
	        continue
	      }
	      // Prop is a proper prefix - recurse to child node
	      if (prop === prefix && typeof node[prop] === 'object') {
	        this._insert(word.slice(prefix.length), node[prop]);
	        return
	      }
	      // Duplicate terminal string - ignore
	      if (prop === word && typeof node[prop] === 'number') {
	        return
	      }
	      next = {};
	      next[prop.slice(prefix.length)] = node[prop];
	      this.addTerminal(next, word = word.slice(prefix.length));
	      delete node[prop];
	      node[prefix] = next;
	      this.wordCount++;
	      return
	    }

	    // No shared prefix.  Enter the word here as a terminal string.
	    this.addTerminal(node, word);
	    this.wordCount++;
	  },

	  // Add a terminal string to node.
	  // If 2 characters or less, just add with value == 1.
	  // If more than 2 characters, point to shared node
	  // Note - don't prematurely share suffixes - these
	  // terminals may become split and joined with other
	  // nodes in this part of the tree.
	  addTerminal: function(node, prop) {
	    if (prop.length <= 1) {
	      node[prop] = 1;
	      return
	    }
	    var next = {};
	    node[prop[0]] = next;
	    this.addTerminal(next, prop.slice(1));
	  },

	  // Well ordered list of properties in a node (string or object properties)
	  // Use nodesOnly==true to return only properties of child nodes (not
	  // terminal strings.
	  nodeProps: function(node, nodesOnly) {
	    var props = [];
	    for (var prop in node) {
	      if (prop !== '' && prop[0] !== '_') {
	        if (!nodesOnly || typeof node[prop] === 'object') {
	          props.push(prop);
	        }
	      }
	    }
	    props.sort();
	    return props
	  },

	  optimize: function() {
	    this.combineSuffixNode(this.root);
	    this.prepDFS();
	    this.countDegree(this.root);
	    this.prepDFS();
	    this.collapseChains(this.root);
	  },

	  // Convert Trie to a DAWG by sharing identical nodes
	  combineSuffixNode: function(node) {
	    // Frozen node - can't change.
	    if (node._c) {
	      return node
	    }
	    // Make sure all children are combined and generate unique node
	    // signature for this node.
	    var sig = [];
	    if (this.isTerminal(node)) {
	      sig.push('!');
	    }
	    var props = this.nodeProps(node);
	    for (var i = 0; i < props.length; i++) {
	      var prop = props[i];
	      if (typeof node[prop] === 'object') {
	        node[prop] = this.combineSuffixNode(node[prop]);
	        sig.push(prop);
	        sig.push(node[prop]._c);
	      } else {
	        sig.push(prop);
	      }
	    }
	    sig = sig.join('-');

	    var shared = this.suffixes[sig];
	    if (shared) {
	      return shared
	    }
	    this.suffixes[sig] = node;
	    node._c = this.cNext++;
	    return node
	  },

	  prepDFS: function() {
	    this.vCur++;
	  },

	  visited: function(node) {
	    if (node._v === this.vCur) {
	      return true
	    }
	    node._v = this.vCur;
	    return false
	  },

	  countDegree: function(node) {
	    if (node._d === undefined) {
	      node._d = 0;
	    }
	    node._d++;
	    if (this.visited(node)) {
	      return
	    }
	    var props = this.nodeProps(node, true);
	    for (var i = 0; i < props.length; i++) {
	      this.countDegree(node[props[i]]);
	    }
	  },

	  // Remove intermediate singleton nodes by hoisting into their parent
	  collapseChains: function(node) {
	    var prop, props, child, i;
	    if (this.visited(node)) {
	      return
	    }
	    props = this.nodeProps(node);
	    for (i = 0; i < props.length; i++) {
	      prop = props[i];
	      child = node[prop];
	      if (typeof child !== 'object') {
	        continue
	      }
	      this.collapseChains(child);
	      // Hoist the singleton child's single property to the parent
	      if (child._g !== undefined && (child._d === 1 || child._g.length === 1)) {
	        delete node[prop];
	        prop += child._g;
	        node[prop] = child[child._g];
	      }
	    }
	    // Identify singleton nodes
	    if (props.length === 1 && !this.isTerminal(node)) {
	      node._g = prop;
	    }
	  },

	  isTerminal: function(node) {
	    return !!node['']
	  },

	  // Find highest node in Trie that is on the path to word
	  // and that is NOT on the path to other.
	  uniqueNode: function(word, other, node) {
	    var props = this.nodeProps(node, true);
	    for (var i = 0; i < props.length; i++) {
	      var prop = props[i];
	      if (prop === word.slice(0, prop.length)) {
	        if (prop !== other.slice(0, prop.length)) {
	          return node[prop]
	        }
	        return this.uniqueNode(word.slice(prop.length), other.slice(prop.length), node[prop])
	      }
	    }
	    return undefined
	  },

	  pack: function() {
	    return pack_1(this)
	  }
	};

	/*
	 A JavaScript implementation of a Trie search datastructure.
	Each node of the Trie is an Object that can contain the following properties:
	      '' - If present (with value == 1), the node is a Terminal Node - the prefix
	          leading to this node is a word in the dictionary.
	      numeric properties (value == 1) - the property name is a terminal string
	          so that the prefix + string is a word in the dictionary.
	      Object properties - the property name is one or more characters to be consumed
	          from the prefix of the test string, with the remainder to be checked in
	          the child node.
	      '_c': A unique name for the node (starting from 1), used in combining Suffixes.
	      '_n': Created when packing the Trie, the sequential node number
	          (in pre-order traversal).
	      '_d': The number of times a node is shared (it's in-degree from other nodes).
	      '_v': Visited in DFS.
	      '_g': For singleton nodes, the name of it's single property.
	 */
	var Trie = function(words) {
	  this.root = {};
	  this.lastWord = '';
	  this.suffixes = {};
	  this.suffixCounts = {};
	  this.cNext = 1;
	  this.wordCount = 0;
	  this.insertWords(words);
	  this.vCur = 0;
	};
	Object.keys(methods$1).forEach(function(k) {
	  Trie.prototype[k] = methods$1[k];
	});
	var trie = Trie;

	var isArray = function(input) {
	  return Object.prototype.toString.call(input) === '[object Array]'
	};

	var handleFormats = function(input) {
	  //null
	  if (input === null || input === undefined) {
	    return {}
	  }
	  //string
	  if (typeof input === 'string') {
	    return input.split(/ +/g).reduce(function(h, str) {
	      h[str] = true;
	      return h
	    }, {})
	  }
	  //array
	  if (isArray(input)) {
	    return input.reduce(function(h, str) {
	      h[str] = true;
	      return h
	    }, {})
	  }
	  //object
	  return input
	};

	//turn an array into a compressed string
	var pack$1 = function(obj) {
	  obj = handleFormats(obj);
	  //pivot into categories:
	  var flat = Object.keys(obj).reduce(function(h, k) {
	    var val = obj[k];
	    //array version-
	    //put it in several buckets
	    if (isArray(val)) {
	      for (var i = 0; i < val.length; i++) {
	        h[val[i]] = h[val[i]] || [];
	        h[val[i]].push(k);
	      }
	      return h
	    }
	    //normal string/boolean version
	    if (h.hasOwnProperty(val) === false) {
	      //basically h[val]=[]  - support reserved words
	      Object.defineProperty(h, val, {
	        writable: true,
	        enumerable: true,
	        configurable: true,
	        value: []
	      });
	    }
	    h[val].push(k);
	    return h
	  }, {});
	  //pack each into a compressed string
	  Object.keys(flat).forEach(function(k) {
	    var t = new trie(flat[k]);
	    flat[k] = t.pack();
	  });
	  // flat = JSON.stringify(flat, null, 0);

	  return Object.keys(flat)
	    .map(function (k) {
	      return k + ':' + flat[k]
	    })
	    .join('|')

	  // return flat;
	};
	var pack_1$1 = pack$1;

	//the symbols are at the top of the array.
	var symbols = function(t) {
	  //... process these lines
	  var reSymbol = new RegExp('([0-9A-Z]+):([0-9A-Z]+)');
	  for (var i = 0; i < t.nodes.length; i++) {
	    var m = reSymbol.exec(t.nodes[i]);
	    if (!m) {
	      t.symCount = i;
	      break
	    }
	    t.syms[encoding.fromAlphaCode(m[1])] = encoding.fromAlphaCode(m[2]);
	  }
	  //remove from main node list
	  t.nodes = t.nodes.slice(t.symCount, t.nodes.length);
	};

	// References are either absolute (symbol) or relative (1 - based)
	var indexFromRef = function(trie, ref, index) {
	  var dnode = encoding.fromAlphaCode(ref);
	  if (dnode < trie.symCount) {
	    return trie.syms[dnode]
	  }
	  return index + dnode + 1 - trie.symCount
	};

	var toArray = function(trie) {
	  var all = [];
	  var crawl = function (index, pref) {
	    var node = trie.nodes[index];
	    if (node[0] === '!') {
	      all.push(pref);
	      node = node.slice(1); //ok, we tried. remove it.
	    }
	    var matches = node.split(/([A-Z0-9,]+)/g);
	    for (var i = 0; i < matches.length; i += 2) {
	      var str = matches[i];
	      var ref = matches[i + 1];
	      if (!str) {
	        continue
	      }

	      var have = pref + str;
	      //branch's end
	      if (ref === ',' || ref === undefined) {
	        all.push(have);
	        continue
	      }
	      var newIndex = indexFromRef(trie, ref, index);
	      crawl(newIndex, have);
	    }
	  };
	  crawl(0, '');
	  return all
	};

	//PackedTrie - Trie traversal of the Trie packed-string representation.
	var unpack = function(str) {
	  var trie = {
	    nodes: str.split(';'), //that's all ;)!
	    syms: [],
	    symCount: 0
	  };
	  //process symbols, if they have them
	  if (str.match(':')) {
	    symbols(trie);
	  }
	  return toArray(trie)
	};

	var unpack_1 = unpack;

	var unpack_1$1 = function(str) {
	  //turn the weird string into a key-value object again
	  var obj = str.split('|').reduce(function (h, s) {
	    var arr = s.split(':');
	    h[arr[0]] = arr[1];
	    return h
	  }, {});
	  var all = {};
	  Object.keys(obj).forEach(function(cat) {
	    var arr = unpack_1(obj[cat]);
	    //special case, for botched-boolean
	    if (cat === 'true') {
	      cat = true;
	    }
	    for (var i = 0; i < arr.length; i++) {
	      var k = arr[i];
	      if (all.hasOwnProperty(k) === true) {
	        if (Array.isArray(all[k]) === false) {
	          all[k] = [all[k], cat];
	        } else {
	          all[k].push(cat);
	        }
	      } else {
	        all[k] = cat;
	      }
	    }
	  });
	  return all
	};

    // Create a fast symbol lexer from packed string (about 2-5 times slower than unpacked hash table)
    var lexer = function (packed) {
      var lex={};
      var symbols = packed.split(config.SYM_SEP);
      function lexit (treestr) {
        var levels = treestr.split(';');
//        print(levels);
        return function (text) {
          var scannerOff=0,level=0,jump,shift,startOff=0;
          for(var textOff=0;;) {
            var current = levels[level];
// print(level,textOff,scannerOff,text[textOff],current[scannerOff],/[0-9A-Z]/.test(current[scannerOff]));
            if (current[scannerOff]==undefined) return true; // terminal; all chars consumed
            if (current[scannerOff]==',' && text[textOff]==undefined) return true; // terminal; all chars consumed
            if (current[scannerOff]==',') scannerOff++;
            if (/[0-9A-Z]/.test(current[scannerOff])) {
              jump = 0;
              // BASE36 encoding !!!
              var code='';
              while(/[0-9A-Z]/.test(current[scannerOff])) {
                code += current[scannerOff++];
              }
              
              level += (fromAlphaCode(code)+1); // delta
              scannerOff=0;
              startOff=textOff;
              jump=undefined;
              continue;
            }
            if (current[scannerOff]=='!' && text[textOff]==undefined) return true;
            else if (current[scannerOff]=='!') scannerOff++;
            if (current[scannerOff]==text[textOff]) {
              textOff++;scannerOff++;
            } else {
              // skip to next pattern on current level (starts after comma or jump number)
              while (current[scannerOff]!=undefined && !(/[0-9A-Z]/.test(current[scannerOff])) && current[scannerOff]!=',') 
               scannerOff++;
              if (current[scannerOff]==',') scannerOff++;
              else while (current[scannerOff]!=undefined && (/[0-9A-Z]/.test(current[scannerOff]))) scannerOff++;
              if (current[scannerOff]==undefined) return false; // no matching; end of pattern list on this level
              textOff=startOff;
            }
          }
          return text[textOff]==undefined && 
                 (current[scannerOff]==undefined||current[scannerOff]==','||current[scannerOff]=='!');
        }
      }
      symbols.forEach(function (line) {
        var tokens=line.split(':');
        lex[tokens[0]]=lexit(tokens[1]);
      });
      return lex;
    };
    
	var src = createCommonjsModule(function (module) {
	var efrt = {
      lexer : lexer,
	  pack: pack_1$1,
	  unpack: unpack_1$1
	};

	//and then all-the-exports...
	if (typeof self !== 'undefined') {
	  self.efrt = efrt; // Web Worker
	} else if (typeof window !== 'undefined') {
	  window.efrt = efrt; // Browser
	} else if (typeof commonjsGlobal !== 'undefined') {
	  commonjsGlobal.efrt = efrt; // NodeJS
	}
	//then for some reason, do this too!
	{
	  module.exports = efrt;
	}
	});

	return src;

}));
