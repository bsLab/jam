/** Module convention:
 *  A.js:
 *    this.Ae=<exported var or function>;
 *    var As=<static variable>;
 *    function As(){<static function>}
 *    Ag=<global var or function>
 *
 *  B.js:
 *    open('A',this)
 *    this.Ae <visible in this scope>
 *    Ag <visible in any scope>
 *
 *
 */

/** GLOBALS **/
/* C2JS Compat. */
_=null;
/* Define a reference variable with an initial container value */
ref = function (init) { return {ref:init }}
/* Return container value of a reference */
$ = function (r) { return r.ref!=undefined?r.ref:r }
/* Set new container value of a reference variable */ 
$$ = function (r,x) { r.ref=x }
sizeof = function (x) { return x.length }
strlen = function (x) { return x.length }
//  buffer.copy(target, targetStart, sourceStart, sourceEnd);
memcpy = function (dst,src,n,doff,soff) { if (!doff) doff=0; if (!soff) soff=0; src.copy(dst,doff,soff,n-soff)}
memcmp = function (s1,s2,len) { var i; for (i=0;i<len;i++) if (s1[i]!=s2[i]) return -1; return 0;}
memset = function (s,c,n) { var i; for(i=0;i<n;i++) s[i]=c }
// Type conversion
U8 = function (i) { return (i & 255) }

/* Open a module and pass exported attributes to context object */
open = function(name,context,as) {  
  var module = require('./'+name);
  if (!context) context=global;
  for (var p in module) {
    context[p] = module[p];
  };
  if (as) context[as]=module;
}


////////////////////////////////
