open('c2');
sqlite3OsRandomSeed =function(buf) {
  var i=buf.length;
  while (i--) buf[i]=(Math.random()*256)|0;
}
/*
** Get a single 8-bit random value from the RC4 PRNG.  The Mutex
** must be held while executing this routine.
**
** Why not just use a library random generator like lrand48() for this?
** Because the OP_NewRowid opcode in the VDBE depends on having a very
** good source of random numbers.  The lrand48() library function may
** well be good enough.  But maybe not.  Or maybe lrand48() has some
** subtle problems on some systems that could cause problems.  It is hard
** to know.  To minimize the risk of problems due to bad lrand48()
** implementations, SQLite uses this random number generator based
** on RC4, which we know works very well.
**
** (Later):  Actually, OP_NewRowid does not depend on a good source of
** randomness any more.  But we will leave this code in all the same.
*/

/* All threads share a single random number generator.
** This structure is the current state of the generator.
*/
var prng = {
    isInit:false,          /* True if initialized */
    i:U8(0), 
    j:U8(0),            /* State variables */
    s: Buffer(256)          /* State variables */
};


function randomByte(){
  // TODO
 var t=U8(0);

  /* Initialize the state of the random number generator once,
  ** the first time this routine is called.  The seed value does
  ** not need to contain a lot of randomness since we are not
  ** trying to do secure encryption or anything like that...
  **
  ** Nothing in this file or anywhere else in SQLite does any kind of
  ** encryption.  The RC4 algorithm is being used as a PRNG (pseudo-random
  ** number generator) not as an encryption device.
  */
  if( !prng.isInit ){
    var i;
    var k=Buffer(256);
    prng.j = U8(0);
    prng.i = U8(0);
    sqlite3OsRandomSeed(k);
    for(i=0; i<256; i++){
      prng.s[i] = i;
    }
    for(i=0; i<256; i++){
      prng.j = U8(prng.j + prng.s[i] + k[i]);
      t = prng.s[prng.j];
      prng.s[prng.j] = prng.s[i];
      prng.s[i] = t;
    }
    prng.isInit = true;
  }

  /* Generate and return single random byte
  */
  prng.i = U8(prng.i+1);
  t = prng.s[prng.i];
  prng.j = U8(prng.j+t);
  prng.s[prng.i] = prng.s[prng.j];
  prng.s[prng.j] = t;
  t = U8(t+prng.s[prng.i]);
  return prng.s[t];
}
/*
** Return N random bytes.
** void sqlite3Randomness(int N, void *pBuf)
*/
sqlite3Randomness = function(N,pBuf) {
  if (pBuf.ref != undefined && typeof pBuf.ref == 'number') {
    pBuf.ref=0;
    while(N--) {
      pBuf.ref = pBuf.ref << 8;
      pBuf.ref = pBuf.ref | randomByte();
    }
  }
}
