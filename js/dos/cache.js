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
 **    $CREATED:     7/8/15 by sbosse.
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 **
 **  DOS: Cache module. 
 **
 ** Provides a fixed table cache. 
 ** Searching is done from the newest entry down to the oldest.
 ** It's possible to invalidate (remove) a cache entry.
 ** Garbage collection and cache updating is optionally provided.
 ** Basically a caching hash table with a bound size.
 *
 **
 **    $ENDOFINFO
 */


/**
 *
 * @param size
 * @constructor
 * @typedef {{cache_size,cache_head,cache_hit,cache_miss,cache_table:* []}} cache~obj
 * @see cache~obj
 * @see cache~meth
 */
var cache = function (size) {
    this.cache_size=size;
    this.cache_head=0;
    this.cache_table={};
};

/**
 * @typedef {{add:cache.add,lookup:cache.lookup,invalidate:cache.invalidate}} cache~meth
 */

/**
 *
 * @param size
 * @returns {cache}
 */
function Cache(size) {
    var obj = new cache(size);
    Object.preventExtensions(obj);
    return obj;
}

/** Add a new cache entry
 *
 * @param key
 * @param data
 * @param [tmo]
 * @param [stat]
 */
cache.prototype.add = function (key,data) {
  
  if (this.cache_head==this.cache_size) {
      /*
      ** Invalidate oldest cache entry
      */
      for (i in this.cache_table) {
        delete this.cache_table[i];
        break;
      }
  } else this.cache_head++;
  this.cache_table[key]=data;    // We use the JS array hash table feature here!
};

/** Invalidate (remove) a cache entry
 *
 * @param key
 */
cache.prototype.invalidate = function (key) {
  if (this.cache_table[key]) {
    delete this.cache_table[key];
    this.cache_head--;
  }
};


/** Find a cache entry
 *
 * @param key
 * @returns {*}
 */
cache.prototype.lookup = function (key) {
  var data=this.cache_table[key];
  if (data) return data;
};

cache.prototype.map = function (key,data) {
  var map={};
  map[key]=data;
  return map;  
}

/** Refresh and garabage collection handler
 *
 * @param key
 * @returns {*}
 */
cache.prototype.refresh = function (f) {
  var p,data;
  for(p in this.cache_table) {
    data=this.cache_table[p];
    if (!f(p,data)) this.invalidate(p);
  }
};

/** Update a cache entry
 *
 * @param key
 * @returns {*}
 */
cache.prototype.update = function (key,data) {
  var entry=this.cache_table[key];
  if (entry) for (var p in data) {
    entry[i]=data[i];
  } else this.add(key,data);
};

module.exports = {
    Cache: Cache
};
