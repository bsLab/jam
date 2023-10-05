/* New tuple space implementation - Prototype */
/**

Tupel space is divided in sub-spaces by creating a hierachical tuple space:

1. Arity 
  2. Tuple type signature
    3. Hash tag from first tuple element
    
*/

var inspect = require('util').inspect;
var _ = undefined;


var SIGTYPE = {
  undefined:0,
  number:1,
  string:2,
  boolean:4,
  object:8,
  array:16,
  function:32
}

var SIGTYPEMAX=6;

function signature(tuple) {
  var s=0;
  for(var i in tuple) {
    var t = typeof tuple[i];
    if (t=='object' && t instanceof Array) t='array';
    s = s | SIGTYPE[t]; s = s << SIGTYPEMAX;
  }
  return s;
}

var db = [];
var MAXDIM=10;
 
function init () {
  for(var i=1;i<=MAXDIM;i++) 
    db[i]={dim:i,n:0,stores:{}}
}

function store (tuple) {
  var ary = tuple.length;
  var sig = signature(tuple);
  var ts = db[ary];
  var store,index,hash;
  if (!ts.stores[sig]) {
    store={hash:{},sig:sig};
    store.hash[tuple[0]]={data:[tuple],free:[]};
    ts.stores[sig]=store;
  } else  {
    store=ts.stores[sig];
    hash=store.hash[tuple[0]];
    if (hash) {
      if (hash.free.length)
        hash.data[index=hash.free.pop()]=tuple;
      else
        hash.data.push(tuple);
    } else {
      store.hash[tuple[0]]={data:[tuple],free:[]};   
    }
  }
}

function match (tuple,pattern) {
  function eq (v1,v2) {
    // simplified test
    if (v1==v2) return true;
    return false;
  }
  for(var index in tuple) {
    if (pattern[index]!=undefined && !eq(tuple[index],pattern[index]))
      return false;
  }
  return true;
}

function lookup (pattern) {
  var ary = pattern.length;
  var sig = signature(pattern);
  var ts = db[ary];
  // Search in all matching stores
  for (var s in ts.stores) {
    store= ts.stores[s];
    if ((store.sig & sig) == sig) {
      // pattern signature is contained in this store
      if (pattern[0]!=undefined) {
        hash=store.hash[pattern[0]];
        if (hash) for (d in hash.data) {
          if (match(hash.data[d],pattern)) return hash.data[d]
        }
      }
    }
  }
  return;
}

init();
store(['SEN',100,100]);
store(['SEN',200,100]);
store(['SEN2',100,true]);
print(inspect(db[3],_,8));
print(lookup(['SEN',_,_]));
print(lookup(['SEN',_,100]));
print(lookup(['SEN',_,101]));
