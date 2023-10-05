var crypto = global.crypto || global.msCrypto


function oldBrowser () {
  throw new Error ('Crypto: No native crypto.getRandomValues available. Use crypto.rand module instead!');
}

function randomBytes (size, cb) {
  // phantomjs needs to throw
  if (size > 65536) throw new Error('Crypto: Requested too many random bytes')
  if (!crypto || !crypto.getRandomValues) oldBrowser();

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
  randomBytes:randomBytes
}
