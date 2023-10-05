/*!
 * The buffer module from node.js, for the browser.
 * Can be used with SharedArrayBuffers!
 * Uses Uin8Array as data buffer (only slow buffers).
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * 
 * @license  MIT
 *
 * https://github.com/feross/buffer
 */
/* eslint-disable no-proto */

BufferArray = {};
BufferArray.init=function () {
/*
  Requires for SharedArrayBuffer -> Newer browsers need the following headers (and a HTTP-FILE service):
  
              'Content-Type': 'text/html; charset=UTF-8',
              'Cross-Origin-Opener-Policy': 'same-origin',
              'Cross-Origin-Embedder-Policy': 'require-corp',
*/
  // 'use strict'
  if (typeof BufferArray == 'undefined') BufferArray = {};
  var exports=BufferArray;
  var base64 = {};
  (function (exports) {
    exports.byteLength = byteLength
    exports.toByteArray = toByteArray
    exports.fromByteArray = fromByteArray

    var lookup = []
    var revLookup = []
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i]
      revLookup[code.charCodeAt(i)] = i
    }
    revLookup['-'.charCodeAt(0)] = 62
    revLookup['_'.charCodeAt(0)] = 63
    function getLens (b64) {
      var len = b64.length

      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }
      var validLen = b64.indexOf('=')
      if (validLen === -1) validLen = len
      var placeHoldersLen = validLen === len
        ? 0
        : 4 - (validLen % 4)

      return [validLen, placeHoldersLen]
    }
    function byteLength (b64) {
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }
    function _byteLength (b64, validLen, placeHoldersLen) {
      return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
    }
    function toByteArray (b64) {
      var tmp
      var lens = getLens(b64)
      var validLen = lens[0]
      var placeHoldersLen = lens[1]
      var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))
      var curByte = 0
      // if there are placeholders, only get up to the last complete 4 chars
      var len = placeHoldersLen > 0
        ? validLen - 4
        : validLen

      var i
      for (i = 0; i < len; i += 4) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 18) |
          (revLookup[b64.charCodeAt(i + 1)] << 12) |
          (revLookup[b64.charCodeAt(i + 2)] << 6) |
          revLookup[b64.charCodeAt(i + 3)]
        arr[curByte++] = (tmp >> 16) & 0xFF
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }
      if (placeHoldersLen === 2) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 2) |
          (revLookup[b64.charCodeAt(i + 1)] >> 4)
        arr[curByte++] = tmp & 0xFF
      }
      if (placeHoldersLen === 1) {
        tmp =
          (revLookup[b64.charCodeAt(i)] << 10) |
          (revLookup[b64.charCodeAt(i + 1)] << 4) |
          (revLookup[b64.charCodeAt(i + 2)] >> 2)
        arr[curByte++] = (tmp >> 8) & 0xFF
        arr[curByte++] = tmp & 0xFF
      }
      return arr
    }
    function tripletToBase64 (num) {
      return lookup[num >> 18 & 0x3F] +
        lookup[num >> 12 & 0x3F] +
        lookup[num >> 6 & 0x3F] +
        lookup[num & 0x3F]
    }
    function encodeChunk (uint8, start, end) {
      var tmp
      var output = []
      for (var i = start; i < end; i += 3) {
        tmp =
          ((uint8[i] << 16) & 0xFF0000) +
          ((uint8[i + 1] << 8) & 0xFF00) +
          (uint8[i + 2] & 0xFF)
        output.push(tripletToBase64(tmp))
      }
      return output.join('')
    }
    function fromByteArray (uint8) {
      var tmp
      var len = uint8.length
      var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
      var parts = []
      var maxChunkLength = 16383 // must be multiple of 3
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
      }
      if (extraBytes === 1) {
        tmp = uint8[len - 1]
        parts.push(
          lookup[tmp >> 2] +
          lookup[(tmp << 4) & 0x3F] +
          '=='
        )
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1]
        parts.push(
          lookup[tmp >> 10] +
          lookup[(tmp >> 4) & 0x3F] +
          lookup[(tmp << 2) & 0x3F] +
          '='
        )
      }
      return parts.join('')
    }
  })(base64);
  const ieee754 = {
    read : function(buffer, offset, isBE, mLen, nBytes) {
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
    },

    write :  function(buffer, value, offset, isBE, mLen, nBytes) {
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
    }
  }
  const customInspectSymbol =
    (typeof Symbol === 'function' && typeof Symbol['for'] === 'function') // eslint-disable-line dot-notation
      ? Symbol['for']('nodejs.util.inspect.custom') // eslint-disable-line dot-notation
      : null
  exports.Buffer = Buffer
  exports.SlowBuffer = SlowBuffer
  exports.INSPECT_MAX_BYTES = 50

  const K_MAX_LENGTH = 0x7fffffff
  exports.kMaxLength = K_MAX_LENGTH

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Print warning and recommend using `buffer` v4.x which has an Object
   *               implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * We report that the browser does not support typed arrays if the are not subclassable
   * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
   * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
   * for __proto__ and has a buggy typed array implementation.
   */
  Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

  if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
      typeof console.error === 'function') {
    console.error(
      'This browser lacks typed array (Uint8Array) support which is required by ' +
      '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
    )
  }

  function typedArraySupport () {
    // Can typed array instances can be augmented?
    try {
      const arr = new Uint8Array(1)
      const proto = { foo: function () { return 42 } }
      Object.setPrototypeOf(proto, Uint8Array.prototype)
      Object.setPrototypeOf(arr, proto)
      return arr.foo() === 42
    } catch (e) {
      return false
    }
  }

  Object.defineProperty(Buffer.prototype, 'parent', {
    enumerable: true,
    get: function () {
      if (!Buffer.isBuffer(this)) return undefined
      return this.buffer
    }
  })

  Object.defineProperty(Buffer.prototype, 'offset', {
    enumerable: true,
    get: function () {
      if (!Buffer.isBuffer(this)) return undefined
      return this.byteOffset
    }
  })

  function createBuffer (length) {
    if (length > K_MAX_LENGTH) {
      throw new RangeError('The value "' + length + '" is invalid for option "size"')
    }
    // Return an augmented `Uint8Array` instance
    const buf = new Uint8Array(length)
    Object.setPrototypeOf(buf, Buffer.prototype)
    return buf
  }

  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Buffer (arg, encodingOrOffset, length) {
    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new TypeError(
          'The "string" argument must be of type string. Received type number'
        )
      }
      return allocUnsafe(arg)
    }
    return from(arg, encodingOrOffset, length)
  }

  Buffer.poolSize = 8192 // not used by this implementation

  function from (value, encodingOrOffset, length) {
    if (typeof value === 'string') {
      return fromString(value, encodingOrOffset)
    }

    if (ArrayBuffer.isView(value)) {
      return fromArrayView(value)
    }

    if (value == null) {
      throw new TypeError(
        'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
        'or Array-like Object. Received type ' + (typeof value)
      )
    }

    if (isInstance(value, ArrayBuffer) ||
        (value && isInstance(value.buffer, ArrayBuffer))) {
      return fromArrayBuffer(value, encodingOrOffset, length)
    }

    if (typeof SharedArrayBuffer !== 'undefined' &&
        (isInstance(value, SharedArrayBuffer) ||
        (value && isInstance(value.buffer, SharedArrayBuffer)))) {
      return fromArrayBuffer(value, encodingOrOffset, length)
    }

    if (typeof value === 'number') {
      throw new TypeError(
        'The "value" argument must not be of type number. Received type number'
      )
    }

    const valueOf = value.valueOf && value.valueOf()
    if (valueOf != null && valueOf !== value) {
      return Buffer.from(valueOf, encodingOrOffset, length)
    }

    const b = fromObject(value)
    if (b) return b

    if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
        typeof value[Symbol.toPrimitive] === 'function') {
      return Buffer.from(value[Symbol.toPrimitive]('string'), encodingOrOffset, length)
    }

    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/
  Buffer.from = function (value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length)
  }

  // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
  // https://github.com/feross/buffer/pull/148
  Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
  Object.setPrototypeOf(Buffer, Uint8Array)

  function assertSize (size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be of type number')
    } else if (size < 0) {
      throw new RangeError('The value "' + size + '" is invalid for option "size"')
    }
  }

  function alloc (size, fill, encoding) {
    assertSize(size)
    if (size <= 0) {
      return createBuffer(size)
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpreted as a start offset.
      return typeof encoding === 'string'
        ? createBuffer(size).fill(fill, encoding)
        : createBuffer(size).fill(fill)
    }
    return createBuffer(size)
  }

  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/
  Buffer.alloc = function (size, fill, encoding) {
    return alloc(size, fill, encoding)
  }

  function allocUnsafe (size) {
    assertSize(size)
    return createBuffer(size < 0 ? 0 : checked(size) | 0)
  }

  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */
  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(size)
  }
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */
  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(size)
  }

  function fromString (string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8'
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }

    const length = byteLength(string, encoding) | 0
    let buf = createBuffer(length)

    const actual = buf.write(string, encoding)

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      buf = buf.slice(0, actual)
    }

    return buf
  }

  function fromArrayLike (array) {
    const length = array.length < 0 ? 0 : checked(array.length) | 0
    const buf = createBuffer(length)
    for (let i = 0; i < length; i += 1) {
      buf[i] = array[i] & 255
    }
    return buf
  }

  function fromArrayView (arrayView) {
    if (isInstance(arrayView, Uint8Array)) {
      const copy = new Uint8Array(arrayView)
      return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength)
    }
    return fromArrayLike(arrayView)
  }

  function fromArrayBuffer (array, byteOffset, length) {
    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('"offset" is outside of buffer bounds')
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('"length" is outside of buffer bounds')
    }

    let buf
    if (byteOffset === undefined && length === undefined) {
      buf = new Uint8Array(array)
    } else if (length === undefined) {
      buf = new Uint8Array(array, byteOffset)
    } else {
      buf = new Uint8Array(array, byteOffset, length)
    }

    // Return an augmented `Uint8Array` instance
    Object.setPrototypeOf(buf, Buffer.prototype)

    return buf
  }

  function fromObject (obj) {
    if (Buffer.isBuffer(obj)) {
      const len = checked(obj.length) | 0
      const buf = createBuffer(len)

      if (buf.length === 0) {
        return buf
      }

      obj.copy(buf, 0, 0, len)
      return buf
    }

    if (obj.length !== undefined) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  function checked (length) {
    // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= K_MAX_LENGTH) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                           'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
    }
    return length | 0
  }

  function SlowBuffer (length) {
    if (+length != length) { // eslint-disable-line eqeqeq
      length = 0
    }
    return Buffer.alloc(+length)
  }

  Buffer.isBuffer = function isBuffer (b) {
    return b != null && b._isBuffer === true &&
      b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
  }

  Buffer.compare = function compare (a, b) {
    if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
    if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
      throw new TypeError(
        'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
      )
    }

    if (a === b) return 0

    let x = a.length
    let y = b.length

    for (let i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i]
        y = b[i]
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  }

  Buffer.isEncoding = function isEncoding (encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  }

  Buffer.concat = function concat (list, length) {
    if (!Array.isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }

    if (list.length === 0) {
      return Buffer.alloc(0)
    }

    let i
    if (length === undefined) {
      length = 0
      for (i = 0; i < list.length; ++i) {
        length += list[i].length
      }
    }

    const buffer = Buffer.allocUnsafe(length)
    let pos = 0
    for (i = 0; i < list.length; ++i) {
      let buf = list[i]
      if (isInstance(buf, Uint8Array)) {
        if (pos + buf.length > buffer.length) {
          if (!Buffer.isBuffer(buf)) {
            buf = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)
          }
          buf.copy(buffer, pos)
        } else {
          Uint8Array.prototype.set.call(
            buffer,
            buf,
            pos
          )
        }
      } else if (!Buffer.isBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      } else {
        buf.copy(buffer, pos)
      }
      pos += buf.length
    }
    return buffer
  }

  function byteLength (string, encoding) {
    if (Buffer.isBuffer(string)) {
      return string.length
    }
    if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
      return string.byteLength
    }
    if (typeof string !== 'string') {
      throw new TypeError(
        'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
        'Received type ' + typeof string
      )
    }

    const len = string.length
    const mustMatch = (arguments.length > 2 && arguments[2] === true)
    if (!mustMatch && len === 0) return 0

    // Use a for loop to avoid recursion
    let loweredCase = false
    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len
        case 'utf8':
        case 'utf-8':
          return utf8ToBytes(string).length
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2
        case 'hex':
          return len >>> 1
        case 'base64':
          return base64ToBytes(string).length
        default:
          if (loweredCase) {
            return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
          }
          encoding = ('' + encoding).toLowerCase()
          loweredCase = true
      }
    }
  }
  Buffer.byteLength = byteLength

  function slowToString (encoding, start, end) {
    let loweredCase = false

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
      start = 0
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
      return ''
    }

    if (end === undefined || end > this.length) {
      end = this.length
    }

    if (end <= 0) {
      return ''
    }

    // Force coercion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0
    start >>>= 0

    if (end <= start) {
      return ''
    }

    if (!encoding) encoding = 'utf8'

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end)

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end)

        case 'ascii':
          return asciiSlice(this, start, end)

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end)

        case 'base64':
          return base64Slice(this, start, end)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = (encoding + '').toLowerCase()
          loweredCase = true
      }
    }
  }

  // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
  // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
  // reliably in a browserify context because there could be multiple different
  // copies of the 'buffer' package in use. This method works even for Buffer
  // instances that were created from another copy of the `buffer` package.
  // See: https://github.com/feross/buffer/issues/154
  Buffer.prototype._isBuffer = true

  function swap (b, n, m) {
    const i = b[n]
    b[n] = b[m]
    b[m] = i
  }

  Buffer.prototype.swap16 = function swap16 () {
    const len = this.length
    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits')
    }
    for (let i = 0; i < len; i += 2) {
      swap(this, i, i + 1)
    }
    return this
  }

  Buffer.prototype.swap32 = function swap32 () {
    const len = this.length
    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits')
    }
    for (let i = 0; i < len; i += 4) {
      swap(this, i, i + 3)
      swap(this, i + 1, i + 2)
    }
    return this
  }

  Buffer.prototype.swap64 = function swap64 () {
    const len = this.length
    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits')
    }
    for (let i = 0; i < len; i += 8) {
      swap(this, i, i + 7)
      swap(this, i + 1, i + 6)
      swap(this, i + 2, i + 5)
      swap(this, i + 3, i + 4)
    }
    return this
  }

  Buffer.prototype.toString = function toString () {
    const length = this.length
    if (length === 0) return ''
    if (arguments.length === 0) return utf8Slice(this, 0, length)
    return slowToString.apply(this, arguments)
  }

  Buffer.prototype.toLocaleString = Buffer.prototype.toString

  Buffer.prototype.equals = function equals (b) {
    if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
    if (this === b) return true
    return Buffer.compare(this, b) === 0
  }

  Buffer.prototype.inspect = function inspect () {
    let str = ''
    const max = exports.INSPECT_MAX_BYTES
    str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
    if (this.length > max) str += ' ... '
    return '<Buffer ' + str + '>'
  }
  if (customInspectSymbol) {
    Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
  }

  Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
    if (isInstance(target, Uint8Array)) {
      target = Buffer.from(target, target.offset, target.byteLength)
    }
    if (!Buffer.isBuffer(target)) {
      throw new TypeError(
        'The "target" argument must be one of type Buffer or Uint8Array. ' +
        'Received type ' + (typeof target)
      )
    }

    if (start === undefined) {
      start = 0
    }
    if (end === undefined) {
      end = target ? target.length : 0
    }
    if (thisStart === undefined) {
      thisStart = 0
    }
    if (thisEnd === undefined) {
      thisEnd = this.length
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index')
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0
    }
    if (thisStart >= thisEnd) {
      return -1
    }
    if (start >= end) {
      return 1
    }

    start >>>= 0
    end >>>= 0
    thisStart >>>= 0
    thisEnd >>>= 0

    if (this === target) return 0

    let x = thisEnd - thisStart
    let y = end - start
    const len = Math.min(x, y)

    const thisCopy = this.slice(thisStart, thisEnd)
    const targetCopy = target.slice(start, end)

    for (let i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i]
        y = targetCopy[i]
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  }

  // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf
  function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
      encoding = byteOffset
      byteOffset = 0
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000
    }
    byteOffset = +byteOffset // Coerce to Number.
    if (numberIsNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : (buffer.length - 1)
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset
    if (byteOffset >= buffer.length) {
      if (dir) return -1
      else byteOffset = buffer.length - 1
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0
      else return -1
    }

    // Normalize val
    if (typeof val === 'string') {
      val = Buffer.from(val, encoding)
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (Buffer.isBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
    } else if (typeof val === 'number') {
      val = val & 0xFF // Search for a byte value [0-255]
      if (typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
        }
      }
      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
    }

    throw new TypeError('val must be string, number or Buffer')
  }

  function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
    let indexSize = 1
    let arrLength = arr.length
    let valLength = val.length

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase()
      if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1
        }
        indexSize = 2
        arrLength /= 2
        valLength /= 2
        byteOffset /= 2
      }
    }

    function read (buf, i) {
      if (indexSize === 1) {
        return buf[i]
      } else {
        return buf.readUInt16BE(i * indexSize)
      }
    }

    let i
    if (dir) {
      let foundIndex = -1
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
        } else {
          if (foundIndex !== -1) i -= i - foundIndex
          foundIndex = -1
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
      for (i = byteOffset; i >= 0; i--) {
        let found = true
        for (let j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false
            break
          }
        }
        if (found) return i
      }
    }

    return -1
  }

  Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1
  }

  Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
  }

  Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
  }

  function hexWrite (buf, string, offset, length) {
    offset = Number(offset) || 0
    const remaining = buf.length - offset
    if (!length) {
      length = remaining
    } else {
      length = Number(length)
      if (length > remaining) {
        length = remaining
      }
    }

    const strLen = string.length

    if (length > strLen / 2) {
      length = strLen / 2
    }
    let i
    for (i = 0; i < length; ++i) {
      const parsed = parseInt(string.substr(i * 2, 2), 16)
      if (numberIsNaN(parsed)) return i
      buf[offset + i] = parsed
    }
    return i
  }

  function utf8Write (buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  }

  function asciiWrite (buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length)
  }

  function base64Write (buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length)
  }

  function ucs2Write (buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  }

  Buffer.prototype.write = function write (string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8'
      length = this.length
      offset = 0
    // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset
      length = this.length
      offset = 0
    // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset >>> 0
      if (isFinite(length)) {
        length = length >>> 0
        if (encoding === undefined) encoding = 'utf8'
      } else {
        encoding = length
        length = undefined
      }
    } else {
      throw new Error(
        'Buffer.write(string, encoding, offset[, length]) is no longer supported'
      )
    }

    const remaining = this.length - offset
    if (length === undefined || length > remaining) length = remaining

    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds')
    }

    if (!encoding) encoding = 'utf8'

    let loweredCase = false
    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length)

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length)

        case 'ascii':
        case 'latin1':
        case 'binary':
          return asciiWrite(this, string, offset, length)

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = ('' + encoding).toLowerCase()
          loweredCase = true
      }
    }
  }

  Buffer.prototype.toJSON = function toJSON () {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  }

  function base64Slice (buf, start, end) {
    if (start === 0 && end === buf.length) {
      return base64.fromByteArray(buf)
    } else {
      return base64.fromByteArray(buf.slice(start, end))
    }
  }

  function utf8Slice (buf, start, end) {
    end = Math.min(buf.length, end)
    const res = []

    let i = start
    while (i < end) {
      const firstByte = buf[i]
      let codePoint = null
      let bytesPerSequence = (firstByte > 0xEF)
        ? 4
        : (firstByte > 0xDF)
            ? 3
            : (firstByte > 0xBF)
                ? 2
                : 1

      if (i + bytesPerSequence <= end) {
        let secondByte, thirdByte, fourthByte, tempCodePoint

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte
            }
            break
          case 2:
            secondByte = buf[i + 1]
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint
              }
            }
            break
          case 3:
            secondByte = buf[i + 1]
            thirdByte = buf[i + 2]
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint
              }
            }
            break
          case 4:
            secondByte = buf[i + 1]
            thirdByte = buf[i + 2]
            fourthByte = buf[i + 3]
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD
        bytesPerSequence = 1
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000
        res.push(codePoint >>> 10 & 0x3FF | 0xD800)
        codePoint = 0xDC00 | codePoint & 0x3FF
      }

      res.push(codePoint)
      i += bytesPerSequence
    }

    return decodeCodePointsArray(res)
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  const MAX_ARGUMENTS_LENGTH = 0x1000

  function decodeCodePointsArray (codePoints) {
    const len = codePoints.length
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    let res = ''
    let i = 0
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      )
    }
    return res
  }

  function asciiSlice (buf, start, end) {
    let ret = ''
    end = Math.min(buf.length, end)

    for (let i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F)
    }
    return ret
  }

  function latin1Slice (buf, start, end) {
    let ret = ''
    end = Math.min(buf.length, end)

    for (let i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i])
    }
    return ret
  }

  function hexSlice (buf, start, end) {
    const len = buf.length

    if (!start || start < 0) start = 0
    if (!end || end < 0 || end > len) end = len

    let out = ''
    for (let i = start; i < end; ++i) {
      out += hexSliceLookupTable[buf[i]]
    }
    return out
  }

  function utf16leSlice (buf, start, end) {
    const bytes = buf.slice(start, end)
    let res = ''
    // If bytes.length is odd, the last 8 bits must be ignored (same as node.js)
    for (let i = 0; i < bytes.length - 1; i += 2) {
      res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
    }
    return res
  }

  Buffer.prototype.slice = function slice (start, end) {
    const len = this.length
    start = ~~start
    end = end === undefined ? len : ~~end

    if (start < 0) {
      start += len
      if (start < 0) start = 0
    } else if (start > len) {
      start = len
    }

    if (end < 0) {
      end += len
      if (end < 0) end = 0
    } else if (end > len) {
      end = len
    }

    if (end < start) end = start

    const newBuf = this.subarray(start, end)
    // Return an augmented `Uint8Array` instance
    Object.setPrototypeOf(newBuf, Buffer.prototype)

    return newBuf
  }

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
  }

  Buffer.prototype.readUintLE =
  Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) checkOffset(offset, byteLength, this.length)

    let val = this[offset]
    let mul = 1
    let i = 0
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul
    }

    return val
  }

  Buffer.prototype.readUintBE =
  Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length)
    }

    let val = this[offset + --byteLength]
    let mul = 1
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul
    }

    return val
  }

  Buffer.prototype.readUint8 =
  Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 1, this.length)
    return this[offset]
  }

  Buffer.prototype.readUint16LE =
  Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    return this[offset] | (this[offset + 1] << 8)
  }

  Buffer.prototype.readUint16BE =
  Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    return (this[offset] << 8) | this[offset + 1]
  }

  Buffer.prototype.readUint32LE =
  Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  }

  Buffer.prototype.readUint32BE =
  Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
  }

  Buffer.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE (offset) {
    offset = offset >>> 0
    validateNumber(offset, 'offset')
    const first = this[offset]
    const last = this[offset + 7]
    if (first === undefined || last === undefined) {
      boundsError(offset, this.length - 8)
    }

    const lo = first +
      this[++offset] * 2 ** 8 +
      this[++offset] * 2 ** 16 +
      this[++offset] * 2 ** 24

    const hi = this[++offset] +
      this[++offset] * 2 ** 8 +
      this[++offset] * 2 ** 16 +
      last * 2 ** 24

    return BigInt(lo) + (BigInt(hi) << BigInt(32))
  })

  Buffer.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE (offset) {
    offset = offset >>> 0
    validateNumber(offset, 'offset')
    const first = this[offset]
    const last = this[offset + 7]
    if (first === undefined || last === undefined) {
      boundsError(offset, this.length - 8)
    }

    const hi = first * 2 ** 24 +
      this[++offset] * 2 ** 16 +
      this[++offset] * 2 ** 8 +
      this[++offset]

    const lo = this[++offset] * 2 ** 24 +
      this[++offset] * 2 ** 16 +
      this[++offset] * 2 ** 8 +
      last

    return (BigInt(hi) << BigInt(32)) + BigInt(lo)
  })

  Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) checkOffset(offset, byteLength, this.length)

    let val = this[offset]
    let mul = 1
    let i = 0
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul
    }
    mul *= 0x80

    if (val >= mul) val -= Math.pow(2, 8 * byteLength)

    return val
  }

  Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) checkOffset(offset, byteLength, this.length)

    let i = byteLength
    let mul = 1
    let val = this[offset + --i]
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul
    }
    mul *= 0x80

    if (val >= mul) val -= Math.pow(2, 8 * byteLength)

    return val
  }

  Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 1, this.length)
    if (!(this[offset] & 0x80)) return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  }

  Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    const val = this[offset] | (this[offset + 1] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  }

  Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 2, this.length)
    const val = this[offset + 1] | (this[offset] << 8)
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  }

  Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
  }

  Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)

    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
  }

  Buffer.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE (offset) {
    offset = offset >>> 0
    validateNumber(offset, 'offset')
    const first = this[offset]
    const last = this[offset + 7]
    if (first === undefined || last === undefined) {
      boundsError(offset, this.length - 8)
    }

    const val = this[offset + 4] +
      this[offset + 5] * 2 ** 8 +
      this[offset + 6] * 2 ** 16 +
      (last << 24) // Overflow

    return (BigInt(val) << BigInt(32)) +
      BigInt(first +
      this[++offset] * 2 ** 8 +
      this[++offset] * 2 ** 16 +
      this[++offset] * 2 ** 24)
  })

  Buffer.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE (offset) {
    offset = offset >>> 0
    validateNumber(offset, 'offset')
    const first = this[offset]
    const last = this[offset + 7]
    if (first === undefined || last === undefined) {
      boundsError(offset, this.length - 8)
    }

    const val = (first << 24) + // Overflow
      this[++offset] * 2 ** 16 +
      this[++offset] * 2 ** 8 +
      this[++offset]

    return (BigInt(val) << BigInt(32)) +
      BigInt(this[++offset] * 2 ** 24 +
      this[++offset] * 2 ** 16 +
      this[++offset] * 2 ** 8 +
      last)
  })

  Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, true, 23, 4)
  }

  Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 4, this.length)
    return ieee754.read(this, offset, false, 23, 4)
  }

  Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, true, 52, 8)
  }

  Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    offset = offset >>> 0
    if (!noAssert) checkOffset(offset, 8, this.length)
    return ieee754.read(this, offset, false, 52, 8)
  }

  function checkInt (buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
  }

  Buffer.prototype.writeUintLE =
  Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
    value = +value
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) {
      const maxBytes = Math.pow(2, 8 * byteLength) - 1
      checkInt(this, value, offset, byteLength, maxBytes, 0)
    }

    let mul = 1
    let i = 0
    this[offset] = value & 0xFF
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF
    }

    return offset + byteLength
  }

  Buffer.prototype.writeUintBE =
  Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
    value = +value
    offset = offset >>> 0
    byteLength = byteLength >>> 0
    if (!noAssert) {
      const maxBytes = Math.pow(2, 8 * byteLength) - 1
      checkInt(this, value, offset, byteLength, maxBytes, 0)
    }

    let i = byteLength - 1
    let mul = 1
    this[offset + i] = value & 0xFF
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF
    }

    return offset + byteLength
  }

  Buffer.prototype.writeUint8 =
  Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
    this[offset] = (value & 0xff)
    return offset + 1
  }

  Buffer.prototype.writeUint16LE =
  Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    return offset + 2
  }

  Buffer.prototype.writeUint16BE =
  Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
    return offset + 2
  }

  Buffer.prototype.writeUint32LE =
  Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
    return offset + 4
  }

  Buffer.prototype.writeUint32BE =
  Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
    return offset + 4
  }

  function wrtBigUInt64LE (buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7)

    let lo = Number(value & BigInt(0xffffffff))
    buf[offset++] = lo
    lo = lo >> 8
    buf[offset++] = lo
    lo = lo >> 8
    buf[offset++] = lo
    lo = lo >> 8
    buf[offset++] = lo
    let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
    buf[offset++] = hi
    hi = hi >> 8
    buf[offset++] = hi
    hi = hi >> 8
    buf[offset++] = hi
    hi = hi >> 8
    buf[offset++] = hi
    return offset
  }

  function wrtBigUInt64BE (buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7)

    let lo = Number(value & BigInt(0xffffffff))
    buf[offset + 7] = lo
    lo = lo >> 8
    buf[offset + 6] = lo
    lo = lo >> 8
    buf[offset + 5] = lo
    lo = lo >> 8
    buf[offset + 4] = lo
    let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
    buf[offset + 3] = hi
    hi = hi >> 8
    buf[offset + 2] = hi
    hi = hi >> 8
    buf[offset + 1] = hi
    hi = hi >> 8
    buf[offset] = hi
    return offset + 8
  }

  Buffer.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE (value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
  })

  Buffer.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE (value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt('0xffffffffffffffff'))
  })

  Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) {
      const limit = Math.pow(2, (8 * byteLength) - 1)

      checkInt(this, value, offset, byteLength, limit - 1, -limit)
    }

    let i = 0
    let mul = 1
    let sub = 0
    this[offset] = value & 0xFF
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
    }

    return offset + byteLength
  }

  Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) {
      const limit = Math.pow(2, (8 * byteLength) - 1)

      checkInt(this, value, offset, byteLength, limit - 1, -limit)
    }

    let i = byteLength - 1
    let mul = 1
    let sub = 0
    this[offset + i] = value & 0xFF
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
    }

    return offset + byteLength
  }

  Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
    if (value < 0) value = 0xff + value + 1
    this[offset] = (value & 0xff)
    return offset + 1
  }

  Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    return offset + 2
  }

  Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
    return offset + 2
  }

  Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
    return offset + 4
  }

  Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
    if (value < 0) value = 0xffffffff + value + 1
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
    return offset + 4
  }

  Buffer.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE (value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
  })

  Buffer.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE (value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, -BigInt('0x8000000000000000'), BigInt('0x7fffffffffffffff'))
  })

  function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
    if (offset < 0) throw new RangeError('Index out of range')
  }

  function writeFloat (buf, value, offset, littleEndian, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
    }
    ieee754.write(buf, value, offset, littleEndian, 23, 4)
    return offset + 4
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  }

  Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
  }

  function writeDouble (buf, value, offset, littleEndian, noAssert) {
    value = +value
    offset = offset >>> 0
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
    }
    ieee754.write(buf, value, offset, littleEndian, 52, 8)
    return offset + 8
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  }

  Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  }

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer.prototype.copy = function copy (target, targetStart, start, end) {
    if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
    if (!start) start = 0
    if (!end && end !== 0) end = this.length
    if (targetStart >= target.length) targetStart = target.length
    if (!targetStart) targetStart = 0
    if (end > 0 && end < start) end = start

    // Copy 0 bytes; we're done
    if (end === start) return 0
    if (target.length === 0 || this.length === 0) return 0

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds')
    }
    if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
    if (end < 0) throw new RangeError('sourceEnd out of bounds')

    // Are we oob?
    if (end > this.length) end = this.length
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start
    }

    const len = end - start

    if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
      // Use built-in when available, missing from IE11
      this.copyWithin(targetStart, start, end)
    } else {
      Uint8Array.prototype.set.call(
        target,
        this.subarray(start, end),
        targetStart
      )
    }

    return len
  }

  // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])
  Buffer.prototype.fill = function fill (val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start
        start = 0
        end = this.length
      } else if (typeof end === 'string') {
        encoding = end
        end = this.length
      }
      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string')
      }
      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }
      if (val.length === 1) {
        const code = val.charCodeAt(0)
        if ((encoding === 'utf8' && code < 128) ||
            encoding === 'latin1') {
          // Fast path: If `val` fits into a single byte, use that numeric value.
          val = code
        }
      }
    } else if (typeof val === 'number') {
      val = val & 255
    } else if (typeof val === 'boolean') {
      val = Number(val)
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index')
    }

    if (end <= start) {
      return this
    }

    start = start >>> 0
    end = end === undefined ? this.length : end >>> 0

    if (!val) val = 0

    let i
    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val
      }
    } else {
      const bytes = Buffer.isBuffer(val)
        ? val
        : Buffer.from(val, encoding)
      const len = bytes.length
      if (len === 0) {
        throw new TypeError('The value "' + val +
          '" is invalid for argument "value"')
      }
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len]
      }
    }

    return this
  }

  // CUSTOM ERRORS
  // =============

  // Simplified versions from Node, changed for Buffer-only usage
  const errors = {}
  function E (sym, getMessage, Base) {
    errors[sym] = class NodeError extends Base {
      constructor () {
        super()

        Object.defineProperty(this, 'message', {
          value: getMessage.apply(this, arguments),
          writable: true,
          configurable: true
        })

        // Add the error code to the name to include it in the stack trace.
        this.name = `${this.name} [${sym}]`
        // Access the stack to generate the error message including the error code
        // from the name.
        this.stack // eslint-disable-line no-unused-expressions
        // Reset the name to the actual name.
        delete this.name
      }

      get code () {
        return sym
      }

      set code (value) {
        Object.defineProperty(this, 'code', {
          configurable: true,
          enumerable: true,
          value,
          writable: true
        })
      }

      toString () {
        return `${this.name} [${sym}]: ${this.message}`
      }
    }
  }

  E('ERR_BUFFER_OUT_OF_BOUNDS',
    function (name) {
      if (name) {
        return `${name} is outside of buffer bounds`
      }

      return 'Attempt to access memory outside buffer bounds'
    }, RangeError)
  E('ERR_INVALID_ARG_TYPE',
    function (name, actual) {
      return `The "${name}" argument must be of type number. Received type ${typeof actual}`
    }, TypeError)
  E('ERR_OUT_OF_RANGE',
    function (str, range, input) {
      let msg = `The value of "${str}" is out of range.`
      let received = input
      if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
        received = addNumericalSeparator(String(input))
      } else if (typeof input === 'bigint') {
        received = String(input)
        if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
          received = addNumericalSeparator(received)
        }
        received += 'n'
      }
      msg += ` It must be ${range}. Received ${received}`
      return msg
    }, RangeError)

  function addNumericalSeparator (val) {
    let res = ''
    let i = val.length
    const start = val[0] === '-' ? 1 : 0
    for (; i >= start + 4; i -= 3) {
      res = `_${val.slice(i - 3, i)}${res}`
    }
    return `${val.slice(0, i)}${res}`
  }

  // CHECK FUNCTIONS
  // ===============

  function checkBounds (buf, offset, byteLength) {
    validateNumber(offset, 'offset')
    if (buf[offset] === undefined || buf[offset + byteLength] === undefined) {
      boundsError(offset, buf.length - (byteLength + 1))
    }
  }

  function checkIntBI (value, min, max, buf, offset, byteLength) {
    if (value > max || value < min) {
      const n = typeof min === 'bigint' ? 'n' : ''
      let range
      if (byteLength > 3) {
        if (min === 0 || min === BigInt(0)) {
          range = `>= 0${n} and < 2${n} ** ${(byteLength + 1) * 8}${n}`
        } else {
          range = `>= -(2${n} ** ${(byteLength + 1) * 8 - 1}${n}) and < 2 ** ` +
                  `${(byteLength + 1) * 8 - 1}${n}`
        }
      } else {
        range = `>= ${min}${n} and <= ${max}${n}`
      }
      throw new errors.ERR_OUT_OF_RANGE('value', range, value)
    }
    checkBounds(buf, offset, byteLength)
  }

  function validateNumber (value, name) {
    if (typeof value !== 'number') {
      throw new errors.ERR_INVALID_ARG_TYPE(name, 'number', value)
    }
  }

  function boundsError (value, length, type) {
    if (Math.floor(value) !== value) {
      validateNumber(value, type)
      throw new errors.ERR_OUT_OF_RANGE(type || 'offset', 'an integer', value)
    }

    if (length < 0) {
      throw new errors.ERR_BUFFER_OUT_OF_BOUNDS()
    }

    throw new errors.ERR_OUT_OF_RANGE(type || 'offset',
                                      `>= ${type ? 1 : 0} and <= ${length}`,
                                      value)
  }

  // HELPER FUNCTIONS
  // ================

  const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

  function base64clean (str) {
    // Node takes equal signs as end of the Base64 encoding
    str = str.split('=')[0]
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = str.trim().replace(INVALID_BASE64_RE, '')
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return ''
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '='
    }
    return str
  }

  function utf8ToBytes (string, units) {
    units = units || Infinity
    let codePoint
    const length = string.length
    let leadSurrogate = null
    const bytes = []

    for (let i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i)

      // is surrogate component
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
            continue
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
            continue
          }

          // valid lead
          leadSurrogate = codePoint

          continue
        }

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          leadSurrogate = codePoint
          continue
        }

        // valid surrogate pair
        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
      }

      leadSurrogate = null

      // encode utf8
      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break
        bytes.push(codePoint)
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break
        bytes.push(
          codePoint >> 0x6 | 0xC0,
          codePoint & 0x3F | 0x80
        )
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break
        bytes.push(
          codePoint >> 0xC | 0xE0,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        )
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break
        bytes.push(
          codePoint >> 0x12 | 0xF0,
          codePoint >> 0xC & 0x3F | 0x80,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        )
      } else {
        throw new Error('Invalid code point')
      }
    }

    return bytes
  }

  function asciiToBytes (str) {
    const byteArray = []
    for (let i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF)
    }
    return byteArray
  }

  function utf16leToBytes (str, units) {
    let c, hi, lo
    const byteArray = []
    for (let i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break

      c = str.charCodeAt(i)
      hi = c >> 8
      lo = c % 256
      byteArray.push(lo)
      byteArray.push(hi)
    }

    return byteArray
  }

  function base64ToBytes (str) {
    return base64.toByteArray(base64clean(str))
  }

  function blitBuffer (src, dst, offset, length) {
    let i
    for (i = 0; i < length; ++i) {
      if ((i + offset >= dst.length) || (i >= src.length)) break
      dst[i + offset] = src[i]
    }
    return i
  }

  // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
  // the `instanceof` check but they should be treated as of that type.
  // See: https://github.com/feross/buffer/issues/166
  function isInstance (obj, type) {
    return obj instanceof type ||
      (obj != null && obj.constructor != null && obj.constructor.name != null &&
        obj.constructor.name === type.name)
  }
  function numberIsNaN (obj) {
    // For IE11 support
    return obj !== obj // eslint-disable-line no-self-compare
  }

  // Create lookup table for `toString('hex')`
  // See: https://github.com/feross/buffer/issues/219
  const hexSliceLookupTable = (function () {
    const alphabet = '0123456789abcdef'
    const table = new Array(256)
    for (let i = 0; i < 16; ++i) {
      const i16 = i * 16
      for (let j = 0; j < 16; ++j) {
        table[i16 + j] = alphabet[i] + alphabet[j]
      }
    }
    return table
  })()

  // Return not function with Error if BigInt not supported
  function defineBigIntMethod (fn) {
    return typeof BigInt === 'undefined' ? BufferBigIntNotDefined : fn
  }

  function BufferBigIntNotDefined () {
    throw new Error('BigInt not supported')
  }
}
BufferArray.init();

/* https://github.com/feross/buffer */
/* Buffer Polyfill for Browsers */

function BufferInit() {
! function(t) {
    if ("object" == typeof exports && "undefined" != typeof module) module.exports = t();
    else if ("function" == typeof define && define.amd) define([], t);
    else {
        ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).buffer = t()
    }
}(function() {
    return function() {
        return function t(r, e, n) {
            function i(f, u) {
                if (!e[f]) {
                    if (!r[f]) {
                        var s = "function" == typeof require && require;
                        if (!u && s) return s(f, !0);
                        if (o) return o(f, !0);
                        var h = new Error("Cannot find module '" + f + "'");
                        throw h.code = "MODULE_NOT_FOUND", h
                    }
                    var a = e[f] = {
                        exports: {}
                    };
                    r[f][0].call(a.exports, function(t) {
                        return i(r[f][1][t] || t)
                    }, a, a.exports, t, r, e, n)
                }
                return e[f].exports
            }
            for (var o = "function" == typeof require && require, f = 0; f < n.length; f++) i(n[f]);
            return i
        }
    }()({
        1: [function(t, r, e) {
            (function(r) {
                "use strict";
                var n = t("base64-js"),
                    i = t("ieee754"),
                    o = "function" == typeof Symbol && "function" == typeof Symbol.for ? Symbol.for("nodejs.util.inspect.custom") : null;
                e.Buffer = r, e.SlowBuffer = function(t) {
                    +t != t && (t = 0);
                    return r.alloc(+t)
                }, e.INSPECT_MAX_BYTES = 50;
                var f = 2147483647;

                function u(t) {
                    if (t > f) throw new RangeError('The value "' + t + '" is invalid for option "size"');
                    var e = new Uint8Array(t);
                    return Object.setPrototypeOf(e, r.prototype), e
                }

                function r(t, r, e) {
                    if ("number" == typeof t) {
                        if ("string" == typeof r) throw new TypeError('The "string" argument must be of type string. Received type number');
                        return a(t)
                    }
                    return s(t, r, e)
                }

                function s(t, e, n) {
                    if ("string" == typeof t) return function(t, e) {
                        "string" == typeof e && "" !== e || (e = "utf8");
                        if (!r.isEncoding(e)) throw new TypeError("Unknown encoding: " + e);
                        var n = 0 | l(t, e),
                            i = u(n),
                            o = i.write(t, e);
                        o !== n && (i = i.slice(0, o));
                        return i
                    }(t, e);
                    if (ArrayBuffer.isView(t)) return p(t);
                    if (null == t) throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t);
                    if (z(t, ArrayBuffer) || t && z(t.buffer, ArrayBuffer)) return function(t, e, n) {
                        if (e < 0 || t.byteLength < e) throw new RangeError('"offset" is outside of buffer bounds');
                        if (t.byteLength < e + (n || 0)) throw new RangeError('"length" is outside of buffer bounds');
                        var i;
                        i = void 0 === e && void 0 === n ? new Uint8Array(t) : void 0 === n ? new Uint8Array(t, e) : new Uint8Array(t, e, n);
                        return Object.setPrototypeOf(i, r.prototype), i
                    }(t, e, n);
                    if ("number" == typeof t) throw new TypeError('The "value" argument must not be of type number. Received type number');
                    var i = t.valueOf && t.valueOf();
                    if (null != i && i !== t) return r.from(i, e, n);
                    var o = function(t) {
                        if (r.isBuffer(t)) {
                            var e = 0 | c(t.length),
                                n = u(e);
                            return 0 === n.length ? n : (t.copy(n, 0, 0, e), n)
                        }
                        if (void 0 !== t.length) return "number" != typeof t.length || D(t.length) ? u(0) : p(t);
                        if ("Buffer" === t.type && Array.isArray(t.data)) return p(t.data)
                    }(t);
                    if (o) return o;
                    if ("undefined" != typeof Symbol && null != Symbol.toPrimitive && "function" == typeof t[Symbol.toPrimitive]) return r.from(t[Symbol.toPrimitive]("string"), e, n);
                    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t)
                }

                function h(t) {
                    if ("number" != typeof t) throw new TypeError('"size" argument must be of type number');
                    if (t < 0) throw new RangeError('The value "' + t + '" is invalid for option "size"')
                }

                function a(t) {
                    return h(t), u(t < 0 ? 0 : 0 | c(t))
                }

                function p(t) {
                    for (var r = t.length < 0 ? 0 : 0 | c(t.length), e = u(r), n = 0; n < r; n += 1) e[n] = 255 & t[n];
                    return e
                }

                function c(t) {
                    if (t >= f) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + f.toString(16) + " bytes");
                    return 0 | t
                }

                function l(t, e) {
                    if (r.isBuffer(t)) return t.length;
                    if (ArrayBuffer.isView(t) || z(t, ArrayBuffer)) return t.byteLength;
                    if ("string" != typeof t) throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof t);
                    var n = t.length,
                        i = arguments.length > 2 && !0 === arguments[2];
                    if (!i && 0 === n) return 0;
                    for (var o = !1;;) switch (e) {
                        case "ascii":
                        case "latin1":
                        case "binary":
                            return n;
                        case "utf8":
                        case "utf-8":
                            return P(t).length;
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return 2 * n;
                        case "hex":
                            return n >>> 1;
                        case "base64":
                            return j(t).length;
                        default:
                            if (o) return i ? -1 : P(t).length;
                            e = ("" + e).toLowerCase(), o = !0
                    }
                }

                function y(t, r, e) {
                    var n = t[r];
                    t[r] = t[e], t[e] = n
                }

                function g(t, e, n, i, o) {
                    if (0 === t.length) return -1;
                    if ("string" == typeof n ? (i = n, n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648), D(n = +n) && (n = o ? 0 : t.length - 1), n < 0 && (n = t.length + n), n >= t.length) {
                        if (o) return -1;
                        n = t.length - 1
                    } else if (n < 0) {
                        if (!o) return -1;
                        n = 0
                    }
                    if ("string" == typeof e && (e = r.from(e, i)), r.isBuffer(e)) return 0 === e.length ? -1 : w(t, e, n, i, o);
                    if ("number" == typeof e) return e &= 255, "function" == typeof Uint8Array.prototype.indexOf ? o ? Uint8Array.prototype.indexOf.call(t, e, n) : Uint8Array.prototype.lastIndexOf.call(t, e, n) : w(t, [e], n, i, o);
                    throw new TypeError("val must be string, number or Buffer")
                }

                function w(t, r, e, n, i) {
                    var o, f = 1,
                        u = t.length,
                        s = r.length;
                    if (void 0 !== n && ("ucs2" === (n = String(n).toLowerCase()) || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
                        if (t.length < 2 || r.length < 2) return -1;
                        f = 2, u /= 2, s /= 2, e /= 2
                    }

                    function h(t, r) {
                        return 1 === f ? t[r] : t.readUInt16BE(r * f)
                    }
                    if (i) {
                        var a = -1;
                        for (o = e; o < u; o++)
                            if (h(t, o) === h(r, -1 === a ? 0 : o - a)) {
                                if (-1 === a && (a = o), o - a + 1 === s) return a * f
                            } else -1 !== a && (o -= o - a), a = -1
                    } else
                        for (e + s > u && (e = u - s), o = e; o >= 0; o--) {
                            for (var p = !0, c = 0; c < s; c++)
                                if (h(t, o + c) !== h(r, c)) {
                                    p = !1;
                                    break
                                }
                            if (p) return o
                        }
                    return -1
                }

                function d(t, r, e, n) {
                    e = Number(e) || 0;
                    var i = t.length - e;
                    n ? (n = Number(n)) > i && (n = i) : n = i;
                    var o = r.length;
                    n > o / 2 && (n = o / 2);
                    for (var f = 0; f < n; ++f) {
                        var u = parseInt(r.substr(2 * f, 2), 16);
                        if (D(u)) return f;
                        t[e + f] = u
                    }
                    return f
                }

                function v(t, r, e, n) {
                    return N(P(r, t.length - e), t, e, n)
                }

                function b(t, r, e, n) {
                    return N(function(t) {
                        for (var r = [], e = 0; e < t.length; ++e) r.push(255 & t.charCodeAt(e));
                        return r
                    }(r), t, e, n)
                }

                function m(t, r, e, n) {
                    return b(t, r, e, n)
                }

                function E(t, r, e, n) {
                    return N(j(r), t, e, n)
                }

                function B(t, r, e, n) {
                    return N(function(t, r) {
                        for (var e, n, i, o = [], f = 0; f < t.length && !((r -= 2) < 0); ++f) e = t.charCodeAt(f), n = e >> 8, i = e % 256, o.push(i), o.push(n);
                        return o
                    }(r, t.length - e), t, e, n)
                }

                function A(t, r, e) {
                    return 0 === r && e === t.length ? n.fromByteArray(t) : n.fromByteArray(t.slice(r, e))
                }

                function U(t, r, e) {
                    e = Math.min(t.length, e);
                    for (var n = [], i = r; i < e;) {
                        var o, f, u, s, h = t[i],
                            a = null,
                            p = h > 239 ? 4 : h > 223 ? 3 : h > 191 ? 2 : 1;
                        if (i + p <= e) switch (p) {
                            case 1:
                                h < 128 && (a = h);
                                break;
                            case 2:
                                128 == (192 & (o = t[i + 1])) && (s = (31 & h) << 6 | 63 & o) > 127 && (a = s);
                                break;
                            case 3:
                                o = t[i + 1], f = t[i + 2], 128 == (192 & o) && 128 == (192 & f) && (s = (15 & h) << 12 | (63 & o) << 6 | 63 & f) > 2047 && (s < 55296 || s > 57343) && (a = s);
                                break;
                            case 4:
                                o = t[i + 1], f = t[i + 2], u = t[i + 3], 128 == (192 & o) && 128 == (192 & f) && 128 == (192 & u) && (s = (15 & h) << 18 | (63 & o) << 12 | (63 & f) << 6 | 63 & u) > 65535 && s < 1114112 && (a = s)
                        }
                        null === a ? (a = 65533, p = 1) : a > 65535 && (a -= 65536, n.push(a >>> 10 & 1023 | 55296), a = 56320 | 1023 & a), n.push(a), i += p
                    }
                    return function(t) {
                        var r = t.length;
                        if (r <= T) return String.fromCharCode.apply(String, t);
                        var e = "",
                            n = 0;
                        for (; n < r;) e += String.fromCharCode.apply(String, t.slice(n, n += T));
                        return e
                    }(n)
                }
                e.kMaxLength = f, r.TYPED_ARRAY_SUPPORT = function() {
                    try {
                        var t = new Uint8Array(1),
                            r = {
                                foo: function() {
                                    return 42
                                }
                            };
                        return Object.setPrototypeOf(r, Uint8Array.prototype), Object.setPrototypeOf(t, r), 42 === t.foo()
                    } catch (t) {
                        return !1
                    }
                }(), r.TYPED_ARRAY_SUPPORT || "undefined" == typeof console || "function" != typeof console.error || console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."), Object.defineProperty(r.prototype, "parent", {
                    enumerable: !0,
                    get: function() {
                        if (r.isBuffer(this)) return this.buffer
                    }
                }), Object.defineProperty(r.prototype, "offset", {
                    enumerable: !0,
                    get: function() {
                        if (r.isBuffer(this)) return this.byteOffset
                    }
                }), "undefined" != typeof Symbol && null != Symbol.species && r[Symbol.species] === r && Object.defineProperty(r, Symbol.species, {
                    value: null,
                    configurable: !0,
                    enumerable: !1,
                    writable: !1
                }), r.poolSize = 8192, r.from = function(t, r, e) {
                    return s(t, r, e)
                }, Object.setPrototypeOf(r.prototype, Uint8Array.prototype), Object.setPrototypeOf(r, Uint8Array), r.alloc = function(t, r, e) {
                    return function(t, r, e) {
                        return h(t), t <= 0 ? u(t) : void 0 !== r ? "string" == typeof e ? u(t).fill(r, e) : u(t).fill(r) : u(t)
                    }(t, r, e)
                }, r.allocUnsafe = function(t) {
                    return a(t)
                }, r.allocUnsafeSlow = function(t) {
                    return a(t)
                }, r.isBuffer = function(t) {
                    return null != t && !0 === t._isBuffer && t !== r.prototype
                }, r.compare = function(t, e) {
                    if (z(t, Uint8Array) && (t = r.from(t, t.offset, t.byteLength)), z(e, Uint8Array) && (e = r.from(e, e.offset, e.byteLength)), !r.isBuffer(t) || !r.isBuffer(e)) throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
                    if (t === e) return 0;
                    for (var n = t.length, i = e.length, o = 0, f = Math.min(n, i); o < f; ++o)
                        if (t[o] !== e[o]) {
                            n = t[o], i = e[o];
                            break
                        }
                    return n < i ? -1 : i < n ? 1 : 0
                }, r.isEncoding = function(t) {
                    switch (String(t).toLowerCase()) {
                        case "hex":
                        case "utf8":
                        case "utf-8":
                        case "ascii":
                        case "latin1":
                        case "binary":
                        case "base64":
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return !0;
                        default:
                            return !1
                    }
                }, r.concat = function(t, e) {
                    if (!Array.isArray(t)) throw new TypeError('"list" argument must be an Array of Buffers');
                    if (0 === t.length) return r.alloc(0);
                    var n;
                    if (void 0 === e)
                        for (e = 0, n = 0; n < t.length; ++n) e += t[n].length;
                    var i = r.allocUnsafe(e),
                        o = 0;
                    for (n = 0; n < t.length; ++n) {
                        var f = t[n];
                        if (z(f, Uint8Array) && (f = r.from(f)), !r.isBuffer(f)) throw new TypeError('"list" argument must be an Array of Buffers');
                        f.copy(i, o), o += f.length
                    }
                    return i
                }, r.byteLength = l, r.prototype._isBuffer = !0, r.prototype.swap16 = function() {
                    var t = this.length;
                    if (t % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
                    for (var r = 0; r < t; r += 2) y(this, r, r + 1);
                    return this
                }, r.prototype.swap32 = function() {
                    var t = this.length;
                    if (t % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
                    for (var r = 0; r < t; r += 4) y(this, r, r + 3), y(this, r + 1, r + 2);
                    return this
                }, r.prototype.swap64 = function() {
                    var t = this.length;
                    if (t % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
                    for (var r = 0; r < t; r += 8) y(this, r, r + 7), y(this, r + 1, r + 6), y(this, r + 2, r + 5), y(this, r + 3, r + 4);
                    return this
                }, r.prototype.toString = function() {
                    var t = this.length;
                    return 0 === t ? "" : 0 === arguments.length ? U(this, 0, t) : function(t, r, e) {
                        var n = !1;
                        if ((void 0 === r || r < 0) && (r = 0), r > this.length) return "";
                        if ((void 0 === e || e > this.length) && (e = this.length), e <= 0) return "";
                        if ((e >>>= 0) <= (r >>>= 0)) return "";
                        for (t || (t = "utf8");;) switch (t) {
                            case "hex":
                                return L(this, r, e);
                            case "utf8":
                            case "utf-8":
                                return U(this, r, e);
                            case "ascii":
                                return I(this, r, e);
                            case "latin1":
                            case "binary":
                                return S(this, r, e);
                            case "base64":
                                return A(this, r, e);
                            case "ucs2":
                            case "ucs-2":
                            case "utf16le":
                            case "utf-16le":
                                return R(this, r, e);
                            default:
                                if (n) throw new TypeError("Unknown encoding: " + t);
                                t = (t + "").toLowerCase(), n = !0
                        }
                    }.apply(this, arguments)
                }, r.prototype.toLocaleString = r.prototype.toString, r.prototype.equals = function(t) {
                    if (!r.isBuffer(t)) throw new TypeError("Argument must be a Buffer");
                    return this === t || 0 === r.compare(this, t)
                }, r.prototype.inspect = function() {
                    var t = "",
                        r = e.INSPECT_MAX_BYTES;
                    return t = this.toString("hex", 0, r).replace(/(.{2})/g, "$1 ").trim(), this.length > r && (t += " ... "), "<Buffer " + t + ">"
                }, o && (r.prototype[o] = r.prototype.inspect), r.prototype.compare = function(t, e, n, i, o) {
                    if (z(t, Uint8Array) && (t = r.from(t, t.offset, t.byteLength)), !r.isBuffer(t)) throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof t);
                    if (void 0 === e && (e = 0), void 0 === n && (n = t ? t.length : 0), void 0 === i && (i = 0), void 0 === o && (o = this.length), e < 0 || n > t.length || i < 0 || o > this.length) throw new RangeError("out of range index");
                    if (i >= o && e >= n) return 0;
                    if (i >= o) return -1;
                    if (e >= n) return 1;
                    if (this === t) return 0;
                    for (var f = (o >>>= 0) - (i >>>= 0), u = (n >>>= 0) - (e >>>= 0), s = Math.min(f, u), h = this.slice(i, o), a = t.slice(e, n), p = 0; p < s; ++p)
                        if (h[p] !== a[p]) {
                            f = h[p], u = a[p];
                            break
                        }
                    return f < u ? -1 : u < f ? 1 : 0
                }, r.prototype.includes = function(t, r, e) {
                    return -1 !== this.indexOf(t, r, e)
                }, r.prototype.indexOf = function(t, r, e) {
                    return g(this, t, r, e, !0)
                }, r.prototype.lastIndexOf = function(t, r, e) {
                    return g(this, t, r, e, !1)
                }, r.prototype.write = function(t, r, e, n) {
                    if (void 0 === r) n = "utf8", e = this.length, r = 0;
                    else if (void 0 === e && "string" == typeof r) n = r, e = this.length, r = 0;
                    else {
                        if (!isFinite(r)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
                        r >>>= 0, isFinite(e) ? (e >>>= 0, void 0 === n && (n = "utf8")) : (n = e, e = void 0)
                    }
                    var i = this.length - r;
                    if ((void 0 === e || e > i) && (e = i), t.length > 0 && (e < 0 || r < 0) || r > this.length) throw new RangeError("Attempt to write outside buffer bounds");
                    n || (n = "utf8");
                    for (var o = !1;;) switch (n) {
                        case "hex":
                            return d(this, t, r, e);
                        case "utf8":
                        case "utf-8":
                            return v(this, t, r, e);
                        case "ascii":
                            return b(this, t, r, e);
                        case "latin1":
                        case "binary":
                            return m(this, t, r, e);
                        case "base64":
                            return E(this, t, r, e);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return B(this, t, r, e);
                        default:
                            if (o) throw new TypeError("Unknown encoding: " + n);
                            n = ("" + n).toLowerCase(), o = !0
                    }
                }, r.prototype.toJSON = function() {
                    return {
                        type: "Buffer",
                        data: Array.prototype.slice.call(this._arr || this, 0)
                    }
                };
                var T = 4096;

                function I(t, r, e) {
                    var n = "";
                    e = Math.min(t.length, e);
                    for (var i = r; i < e; ++i) n += String.fromCharCode(127 & t[i]);
                    return n
                }

                function S(t, r, e) {
                    var n = "";
                    e = Math.min(t.length, e);
                    for (var i = r; i < e; ++i) n += String.fromCharCode(t[i]);
                    return n
                }

                function L(t, r, e) {
                    var n = t.length;
                    (!r || r < 0) && (r = 0), (!e || e < 0 || e > n) && (e = n);
                    for (var i = "", o = r; o < e; ++o) i += F[t[o]];
                    return i
                }

                function R(t, r, e) {
                    for (var n = t.slice(r, e), i = "", o = 0; o < n.length; o += 2) i += String.fromCharCode(n[o] + 256 * n[o + 1]);
                    return i
                }

                function C(t, r, e) {
                    if (t % 1 != 0 || t < 0) throw new RangeError("offset is not uint");
                    if (t + r > e) throw new RangeError("Trying to access beyond buffer length")
                }

                function O(t, e, n, i, o, f) {
                    if (!r.isBuffer(t)) throw new TypeError('"buffer" argument must be a Buffer instance');
                    if (e > o || e < f) throw new RangeError('"value" argument is out of bounds');
                    if (n + i > t.length) throw new RangeError("Index out of range")
                }

                function _(t, r, e, n, i, o) {
                    if (e + n > t.length) throw new RangeError("Index out of range");
                    if (e < 0) throw new RangeError("Index out of range")
                }

                function x(t, r, e, n, o) {
                    return r = +r, e >>>= 0, o || _(t, 0, e, 4), i.write(t, r, e, n, 23, 4), e + 4
                }

                function M(t, r, e, n, o) {
                    return r = +r, e >>>= 0, o || _(t, 0, e, 8), i.write(t, r, e, n, 52, 8), e + 8
                }
                r.prototype.slice = function(t, e) {
                    var n = this.length;
                    (t = ~~t) < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n), (e = void 0 === e ? n : ~~e) < 0 ? (e += n) < 0 && (e = 0) : e > n && (e = n), e < t && (e = t);
                    var i = this.subarray(t, e);
                    return Object.setPrototypeOf(i, r.prototype), i
                }, r.prototype.readUIntLE = function(t, r, e) {
                    t >>>= 0, r >>>= 0, e || C(t, r, this.length);
                    for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256);) n += this[t + o] * i;
                    return n
                }, r.prototype.readUIntBE = function(t, r, e) {
                    t >>>= 0, r >>>= 0, e || C(t, r, this.length);
                    for (var n = this[t + --r], i = 1; r > 0 && (i *= 256);) n += this[t + --r] * i;
                    return n
                }, r.prototype.readUInt8 = function(t, r) {
                    return t >>>= 0, r || C(t, 1, this.length), this[t]
                }, r.prototype.readUInt16LE = function(t, r) {
                    return t >>>= 0, r || C(t, 2, this.length), this[t] | this[t + 1] << 8
                }, r.prototype.readUInt16BE = function(t, r) {
                    return t >>>= 0, r || C(t, 2, this.length), this[t] << 8 | this[t + 1]
                }, r.prototype.readUInt32LE = function(t, r) {
                    return t >>>= 0, r || C(t, 4, this.length), (this[t] | this[t + 1] << 8 | this[t + 2] << 16) + 16777216 * this[t + 3]
                }, r.prototype.readUInt32BE = function(t, r) {
                    return t >>>= 0, r || C(t, 4, this.length), 16777216 * this[t] + (this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3])
                }, r.prototype.readIntLE = function(t, r, e) {
                    t >>>= 0, r >>>= 0, e || C(t, r, this.length);
                    for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256);) n += this[t + o] * i;
                    return n >= (i *= 128) && (n -= Math.pow(2, 8 * r)), n
                }, r.prototype.readIntBE = function(t, r, e) {
                    t >>>= 0, r >>>= 0, e || C(t, r, this.length);
                    for (var n = r, i = 1, o = this[t + --n]; n > 0 && (i *= 256);) o += this[t + --n] * i;
                    return o >= (i *= 128) && (o -= Math.pow(2, 8 * r)), o
                }, r.prototype.readInt8 = function(t, r) {
                    return t >>>= 0, r || C(t, 1, this.length), 128 & this[t] ? -1 * (255 - this[t] + 1) : this[t]
                }, r.prototype.readInt16LE = function(t, r) {
                    t >>>= 0, r || C(t, 2, this.length);
                    var e = this[t] | this[t + 1] << 8;
                    return 32768 & e ? 4294901760 | e : e
                }, r.prototype.readInt16BE = function(t, r) {
                    t >>>= 0, r || C(t, 2, this.length);
                    var e = this[t + 1] | this[t] << 8;
                    return 32768 & e ? 4294901760 | e : e
                }, r.prototype.readInt32LE = function(t, r) {
                    return t >>>= 0, r || C(t, 4, this.length), this[t] | this[t + 1] << 8 | this[t + 2] << 16 | this[t + 3] << 24
                }, r.prototype.readInt32BE = function(t, r) {
                    return t >>>= 0, r || C(t, 4, this.length), this[t] << 24 | this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3]
                }, r.prototype.readFloatLE = function(t, r) {
                    return t >>>= 0, r || C(t, 4, this.length), i.read(this, t, !0, 23, 4)
                }, r.prototype.readFloatBE = function(t, r) {
                    return t >>>= 0, r || C(t, 4, this.length), i.read(this, t, !1, 23, 4)
                }, r.prototype.readDoubleLE = function(t, r) {
                    return t >>>= 0, r || C(t, 8, this.length), i.read(this, t, !0, 52, 8)
                }, r.prototype.readDoubleBE = function(t, r) {
                    return t >>>= 0, r || C(t, 8, this.length), i.read(this, t, !1, 52, 8)
                }, r.prototype.writeUIntLE = function(t, r, e, n) {
                    (t = +t, r >>>= 0, e >>>= 0, n) || O(this, t, r, e, Math.pow(2, 8 * e) - 1, 0);
                    var i = 1,
                        o = 0;
                    for (this[r] = 255 & t; ++o < e && (i *= 256);) this[r + o] = t / i & 255;
                    return r + e
                }, r.prototype.writeUIntBE = function(t, r, e, n) {
                    (t = +t, r >>>= 0, e >>>= 0, n) || O(this, t, r, e, Math.pow(2, 8 * e) - 1, 0);
                    var i = e - 1,
                        o = 1;
                    for (this[r + i] = 255 & t; --i >= 0 && (o *= 256);) this[r + i] = t / o & 255;
                    return r + e
                }, r.prototype.writeUInt8 = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 1, 255, 0), this[r] = 255 & t, r + 1
                }, r.prototype.writeUInt16LE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 2, 65535, 0), this[r] = 255 & t, this[r + 1] = t >>> 8, r + 2
                }, r.prototype.writeUInt16BE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 2, 65535, 0), this[r] = t >>> 8, this[r + 1] = 255 & t, r + 2
                }, r.prototype.writeUInt32LE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 4, 4294967295, 0), this[r + 3] = t >>> 24, this[r + 2] = t >>> 16, this[r + 1] = t >>> 8, this[r] = 255 & t, r + 4
                }, r.prototype.writeUInt32BE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 4, 4294967295, 0), this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t, r + 4
                }, r.prototype.writeIntLE = function(t, r, e, n) {
                    if (t = +t, r >>>= 0, !n) {
                        var i = Math.pow(2, 8 * e - 1);
                        O(this, t, r, e, i - 1, -i)
                    }
                    var o = 0,
                        f = 1,
                        u = 0;
                    for (this[r] = 255 & t; ++o < e && (f *= 256);) t < 0 && 0 === u && 0 !== this[r + o - 1] && (u = 1), this[r + o] = (t / f >> 0) - u & 255;
                    return r + e
                }, r.prototype.writeIntBE = function(t, r, e, n) {
                    if (t = +t, r >>>= 0, !n) {
                        var i = Math.pow(2, 8 * e - 1);
                        O(this, t, r, e, i - 1, -i)
                    }
                    var o = e - 1,
                        f = 1,
                        u = 0;
                    for (this[r + o] = 255 & t; --o >= 0 && (f *= 256);) t < 0 && 0 === u && 0 !== this[r + o + 1] && (u = 1), this[r + o] = (t / f >> 0) - u & 255;
                    return r + e
                }, r.prototype.writeInt8 = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 1, 127, -128), t < 0 && (t = 255 + t + 1), this[r] = 255 & t, r + 1
                }, r.prototype.writeInt16LE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 2, 32767, -32768), this[r] = 255 & t, this[r + 1] = t >>> 8, r + 2
                }, r.prototype.writeInt16BE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 2, 32767, -32768), this[r] = t >>> 8, this[r + 1] = 255 & t, r + 2
                }, r.prototype.writeInt32LE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 4, 2147483647, -2147483648), this[r] = 255 & t, this[r + 1] = t >>> 8, this[r + 2] = t >>> 16, this[r + 3] = t >>> 24, r + 4
                }, r.prototype.writeInt32BE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || O(this, t, r, 4, 2147483647, -2147483648), t < 0 && (t = 4294967295 + t + 1), this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t, r + 4
                }, r.prototype.writeFloatLE = function(t, r, e) {
                    return x(this, t, r, !0, e)
                }, r.prototype.writeFloatBE = function(t, r, e) {
                    return x(this, t, r, !1, e)
                }, r.prototype.writeDoubleLE = function(t, r, e) {
                    return M(this, t, r, !0, e)
                }, r.prototype.writeDoubleBE = function(t, r, e) {
                    return M(this, t, r, !1, e)
                }, r.prototype.copy = function(t, e, n, i) {
                    if (!r.isBuffer(t)) throw new TypeError("argument should be a Buffer");
                    if (n || (n = 0), i || 0 === i || (i = this.length), e >= t.length && (e = t.length), e || (e = 0), i > 0 && i < n && (i = n), i === n) return 0;
                    if (0 === t.length || 0 === this.length) return 0;
                    if (e < 0) throw new RangeError("targetStart out of bounds");
                    if (n < 0 || n >= this.length) throw new RangeError("Index out of range");
                    if (i < 0) throw new RangeError("sourceEnd out of bounds");
                    i > this.length && (i = this.length), t.length - e < i - n && (i = t.length - e + n);
                    var o = i - n;
                    if (this === t && "function" == typeof Uint8Array.prototype.copyWithin) this.copyWithin(e, n, i);
                    else if (this === t && n < e && e < i)
                        for (var f = o - 1; f >= 0; --f) t[f + e] = this[f + n];
                    else Uint8Array.prototype.set.call(t, this.subarray(n, i), e);
                    return o
                }, r.prototype.fill = function(t, e, n, i) {
                    if ("string" == typeof t) {
                        if ("string" == typeof e ? (i = e, e = 0, n = this.length) : "string" == typeof n && (i = n, n = this.length), void 0 !== i && "string" != typeof i) throw new TypeError("encoding must be a string");
                        if ("string" == typeof i && !r.isEncoding(i)) throw new TypeError("Unknown encoding: " + i);
                        if (1 === t.length) {
                            var o = t.charCodeAt(0);
                            ("utf8" === i && o < 128 || "latin1" === i) && (t = o)
                        }
                    } else "number" == typeof t ? t &= 255 : "boolean" == typeof t && (t = Number(t));
                    if (e < 0 || this.length < e || this.length < n) throw new RangeError("Out of range index");
                    if (n <= e) return this;
                    var f;
                    if (e >>>= 0, n = void 0 === n ? this.length : n >>> 0, t || (t = 0), "number" == typeof t)
                        for (f = e; f < n; ++f) this[f] = t;
                    else {
                        var u = r.isBuffer(t) ? t : r.from(t, i),
                            s = u.length;
                        if (0 === s) throw new TypeError('The value "' + t + '" is invalid for argument "value"');
                        for (f = 0; f < n - e; ++f) this[f + e] = u[f % s]
                    }
                    return this
                };
                var k = /[^+\/0-9A-Za-z-_]/g;

                function P(t, r) {
                    var e;
                    r = r || 1 / 0;
                    for (var n = t.length, i = null, o = [], f = 0; f < n; ++f) {
                        if ((e = t.charCodeAt(f)) > 55295 && e < 57344) {
                            if (!i) {
                                if (e > 56319) {
                                    (r -= 3) > -1 && o.push(239, 191, 189);
                                    continue
                                }
                                if (f + 1 === n) {
                                    (r -= 3) > -1 && o.push(239, 191, 189);
                                    continue
                                }
                                i = e;
                                continue
                            }
                            if (e < 56320) {
                                (r -= 3) > -1 && o.push(239, 191, 189), i = e;
                                continue
                            }
                            e = 65536 + (i - 55296 << 10 | e - 56320)
                        } else i && (r -= 3) > -1 && o.push(239, 191, 189);
                        if (i = null, e < 128) {
                            if ((r -= 1) < 0) break;
                            o.push(e)
                        } else if (e < 2048) {
                            if ((r -= 2) < 0) break;
                            o.push(e >> 6 | 192, 63 & e | 128)
                        } else if (e < 65536) {
                            if ((r -= 3) < 0) break;
                            o.push(e >> 12 | 224, e >> 6 & 63 | 128, 63 & e | 128)
                        } else {
                            if (!(e < 1114112)) throw new Error("Invalid code point");
                            if ((r -= 4) < 0) break;
                            o.push(e >> 18 | 240, e >> 12 & 63 | 128, e >> 6 & 63 | 128, 63 & e | 128)
                        }
                    }
                    return o
                }

                function j(t) {
                    return n.toByteArray(function(t) {
                        if ((t = (t = t.split("=")[0]).trim().replace(k, "")).length < 2) return "";
                        for (; t.length % 4 != 0;) t += "=";
                        return t
                    }(t))
                }

                function N(t, r, e, n) {
                    for (var i = 0; i < n && !(i + e >= r.length || i >= t.length); ++i) r[i + e] = t[i];
                    return i
                }

                function z(t, r) {
                    return t instanceof r || null != t && null != t.constructor && null != t.constructor.name && t.constructor.name === r.name
                }

                function D(t) {
                    return t != t
                }
                var F = function() {
                    for (var t = new Array(256), r = 0; r < 16; ++r)
                        for (var e = 16 * r, n = 0; n < 16; ++n) t[e + n] = "0123456789abcdef" [r] + "0123456789abcdef" [n];
                    return t
                }()
            }).call(this, t("buffer").Buffer)
        }, {
            "base64-js": 2,
            buffer: 5,
            ieee754: 3
        }],
        2: [function(t, r, e) {
            "use strict";
            e.byteLength = function(t) {
                var r = h(t),
                    e = r[0],
                    n = r[1];
                return 3 * (e + n) / 4 - n
            }, e.toByteArray = function(t) {
                var r, e, n = h(t),
                    f = n[0],
                    u = n[1],
                    s = new o(function(t, r, e) {
                        return 3 * (r + e) / 4 - e
                    }(0, f, u)),
                    a = 0,
                    p = u > 0 ? f - 4 : f;
                for (e = 0; e < p; e += 4) r = i[t.charCodeAt(e)] << 18 | i[t.charCodeAt(e + 1)] << 12 | i[t.charCodeAt(e + 2)] << 6 | i[t.charCodeAt(e + 3)], s[a++] = r >> 16 & 255, s[a++] = r >> 8 & 255, s[a++] = 255 & r;
                2 === u && (r = i[t.charCodeAt(e)] << 2 | i[t.charCodeAt(e + 1)] >> 4, s[a++] = 255 & r);
                1 === u && (r = i[t.charCodeAt(e)] << 10 | i[t.charCodeAt(e + 1)] << 4 | i[t.charCodeAt(e + 2)] >> 2, s[a++] = r >> 8 & 255, s[a++] = 255 & r);
                return s
            }, e.fromByteArray = function(t) {
                for (var r, e = t.length, i = e % 3, o = [], f = 0, u = e - i; f < u; f += 16383) o.push(a(t, f, f + 16383 > u ? u : f + 16383));
                1 === i ? (r = t[e - 1], o.push(n[r >> 2] + n[r << 4 & 63] + "==")) : 2 === i && (r = (t[e - 2] << 8) + t[e - 1], o.push(n[r >> 10] + n[r >> 4 & 63] + n[r << 2 & 63] + "="));
                return o.join("")
            };
            for (var n = [], i = [], o = "undefined" != typeof Uint8Array ? Uint8Array : Array, f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", u = 0, s = f.length; u < s; ++u) n[u] = f[u], i[f.charCodeAt(u)] = u;

            function h(t) {
                var r = t.length;
                if (r % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
                var e = t.indexOf("=");
                return -1 === e && (e = r), [e, e === r ? 0 : 4 - e % 4]
            }

            function a(t, r, e) {
                for (var i, o, f = [], u = r; u < e; u += 3) i = (t[u] << 16 & 16711680) + (t[u + 1] << 8 & 65280) + (255 & t[u + 2]), f.push(n[(o = i) >> 18 & 63] + n[o >> 12 & 63] + n[o >> 6 & 63] + n[63 & o]);
                return f.join("")
            }
            i["-".charCodeAt(0)] = 62, i["_".charCodeAt(0)] = 63
        }, {}],
        3: [function(t, r, e) {
            e.read = function(t, r, e, n, i) {
                var o, f, u = 8 * i - n - 1,
                    s = (1 << u) - 1,
                    h = s >> 1,
                    a = -7,
                    p = e ? i - 1 : 0,
                    c = e ? -1 : 1,
                    l = t[r + p];
                for (p += c, o = l & (1 << -a) - 1, l >>= -a, a += u; a > 0; o = 256 * o + t[r + p], p += c, a -= 8);
                for (f = o & (1 << -a) - 1, o >>= -a, a += n; a > 0; f = 256 * f + t[r + p], p += c, a -= 8);
                if (0 === o) o = 1 - h;
                else {
                    if (o === s) return f ? NaN : 1 / 0 * (l ? -1 : 1);
                    f += Math.pow(2, n), o -= h
                }
                return (l ? -1 : 1) * f * Math.pow(2, o - n)
            }, e.write = function(t, r, e, n, i, o) {
                var f, u, s, h = 8 * o - i - 1,
                    a = (1 << h) - 1,
                    p = a >> 1,
                    c = 23 === i ? Math.pow(2, -24) - Math.pow(2, -77) : 0,
                    l = n ? 0 : o - 1,
                    y = n ? 1 : -1,
                    g = r < 0 || 0 === r && 1 / r < 0 ? 1 : 0;
                for (r = Math.abs(r), isNaN(r) || r === 1 / 0 ? (u = isNaN(r) ? 1 : 0, f = a) : (f = Math.floor(Math.log(r) / Math.LN2), r * (s = Math.pow(2, -f)) < 1 && (f--, s *= 2), (r += f + p >= 1 ? c / s : c * Math.pow(2, 1 - p)) * s >= 2 && (f++, s /= 2), f + p >= a ? (u = 0, f = a) : f + p >= 1 ? (u = (r * s - 1) * Math.pow(2, i), f += p) : (u = r * Math.pow(2, p - 1) * Math.pow(2, i), f = 0)); i >= 8; t[e + l] = 255 & u, l += y, u /= 256, i -= 8);
                for (f = f << i | u, h += i; h > 0; t[e + l] = 255 & f, l += y, f /= 256, h -= 8);
                t[e + l - y] |= 128 * g
            }
        }, {}],
        4: [function(t, r, e) {
            arguments[4][2][0].apply(e, arguments)
        }, {
            dup: 2
        }],
        5: [function(t, r, e) {
            (function(r) {
                "use strict";
                var n = t("base64-js"),
                    i = t("ieee754");
                e.Buffer = r, e.SlowBuffer = function(t) {
                    +t != t && (t = 0);
                    return r.alloc(+t)
                }, e.INSPECT_MAX_BYTES = 50;
                var o = 2147483647;

                function f(t) {
                    if (t > o) throw new RangeError('The value "' + t + '" is invalid for option "size"');
                    var e = new Uint8Array(t);
                    return e.__proto__ = r.prototype, e
                }

                function r(t, r, e) {
                    if ("number" == typeof t) {
                        if ("string" == typeof r) throw new TypeError('The "string" argument must be of type string. Received type number');
                        return h(t)
                    }
                    return u(t, r, e)
                }

                function u(t, e, n) {
                    if ("string" == typeof t) return function(t, e) {
                        "string" == typeof e && "" !== e || (e = "utf8");
                        if (!r.isEncoding(e)) throw new TypeError("Unknown encoding: " + e);
                        var n = 0 | c(t, e),
                            i = f(n),
                            o = i.write(t, e);
                        o !== n && (i = i.slice(0, o));
                        return i
                    }(t, e);
                    if (ArrayBuffer.isView(t)) return a(t);
                    if (null == t) throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t);
                    if (z(t, ArrayBuffer) || t && z(t.buffer, ArrayBuffer)) return function(t, e, n) {
                        if (e < 0 || t.byteLength < e) throw new RangeError('"offset" is outside of buffer bounds');
                        if (t.byteLength < e + (n || 0)) throw new RangeError('"length" is outside of buffer bounds');
                        var i;
                        i = void 0 === e && void 0 === n ? new Uint8Array(t) : void 0 === n ? new Uint8Array(t, e) : new Uint8Array(t, e, n);
                        return i.__proto__ = r.prototype, i
                    }(t, e, n);
                    if ("number" == typeof t) throw new TypeError('The "value" argument must not be of type number. Received type number');
                    var i = t.valueOf && t.valueOf();
                    if (null != i && i !== t) return r.from(i, e, n);
                    var o = function(t) {
                        if (r.isBuffer(t)) {
                            var e = 0 | p(t.length),
                                n = f(e);
                            return 0 === n.length ? n : (t.copy(n, 0, 0, e), n)
                        }
                        if (void 0 !== t.length) return "number" != typeof t.length || D(t.length) ? f(0) : a(t);
                        if ("Buffer" === t.type && Array.isArray(t.data)) return a(t.data)
                    }(t);
                    if (o) return o;
                    if ("undefined" != typeof Symbol && null != Symbol.toPrimitive && "function" == typeof t[Symbol.toPrimitive]) return r.from(t[Symbol.toPrimitive]("string"), e, n);
                    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof t)
                }

                function s(t) {
                    if ("number" != typeof t) throw new TypeError('"size" argument must be of type number');
                    if (t < 0) throw new RangeError('The value "' + t + '" is invalid for option "size"')
                }

                function h(t) {
                    return s(t), f(t < 0 ? 0 : 0 | p(t))
                }

                function a(t) {
                    for (var r = t.length < 0 ? 0 : 0 | p(t.length), e = f(r), n = 0; n < r; n += 1) e[n] = 255 & t[n];
                    return e
                }

                function p(t) {
                    if (t >= o) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + o.toString(16) + " bytes");
                    return 0 | t
                }

                function c(t, e) {
                    if (r.isBuffer(t)) return t.length;
                    if (ArrayBuffer.isView(t) || z(t, ArrayBuffer)) return t.byteLength;
                    if ("string" != typeof t) throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof t);
                    var n = t.length,
                        i = arguments.length > 2 && !0 === arguments[2];
                    if (!i && 0 === n) return 0;
                    for (var o = !1;;) switch (e) {
                        case "ascii":
                        case "latin1":
                        case "binary":
                            return n;
                        case "utf8":
                        case "utf-8":
                            return P(t).length;
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return 2 * n;
                        case "hex":
                            return n >>> 1;
                        case "base64":
                            return j(t).length;
                        default:
                            if (o) return i ? -1 : P(t).length;
                            e = ("" + e).toLowerCase(), o = !0
                    }
                }

                function l(t, r, e) {
                    var n = t[r];
                    t[r] = t[e], t[e] = n
                }

                function y(t, e, n, i, o) {
                    if (0 === t.length) return -1;
                    if ("string" == typeof n ? (i = n, n = 0) : n > 2147483647 ? n = 2147483647 : n < -2147483648 && (n = -2147483648), D(n = +n) && (n = o ? 0 : t.length - 1), n < 0 && (n = t.length + n), n >= t.length) {
                        if (o) return -1;
                        n = t.length - 1
                    } else if (n < 0) {
                        if (!o) return -1;
                        n = 0
                    }
                    if ("string" == typeof e && (e = r.from(e, i)), r.isBuffer(e)) return 0 === e.length ? -1 : g(t, e, n, i, o);
                    if ("number" == typeof e) return e &= 255, "function" == typeof Uint8Array.prototype.indexOf ? o ? Uint8Array.prototype.indexOf.call(t, e, n) : Uint8Array.prototype.lastIndexOf.call(t, e, n) : g(t, [e], n, i, o);
                    throw new TypeError("val must be string, number or Buffer")
                }

                function g(t, r, e, n, i) {
                    var o, f = 1,
                        u = t.length,
                        s = r.length;
                    if (void 0 !== n && ("ucs2" === (n = String(n).toLowerCase()) || "ucs-2" === n || "utf16le" === n || "utf-16le" === n)) {
                        if (t.length < 2 || r.length < 2) return -1;
                        f = 2, u /= 2, s /= 2, e /= 2
                    }

                    function h(t, r) {
                        return 1 === f ? t[r] : t.readUInt16BE(r * f)
                    }
                    if (i) {
                        var a = -1;
                        for (o = e; o < u; o++)
                            if (h(t, o) === h(r, -1 === a ? 0 : o - a)) {
                                if (-1 === a && (a = o), o - a + 1 === s) return a * f
                            } else -1 !== a && (o -= o - a), a = -1
                    } else
                        for (e + s > u && (e = u - s), o = e; o >= 0; o--) {
                            for (var p = !0, c = 0; c < s; c++)
                                if (h(t, o + c) !== h(r, c)) {
                                    p = !1;
                                    break
                                }
                            if (p) return o
                        }
                    return -1
                }

                function w(t, r, e, n) {
                    e = Number(e) || 0;
                    var i = t.length - e;
                    n ? (n = Number(n)) > i && (n = i) : n = i;
                    var o = r.length;
                    n > o / 2 && (n = o / 2);
                    for (var f = 0; f < n; ++f) {
                        var u = parseInt(r.substr(2 * f, 2), 16);
                        if (D(u)) return f;
                        t[e + f] = u
                    }
                    return f
                }

                function d(t, r, e, n) {
                    return N(P(r, t.length - e), t, e, n)
                }

                function v(t, r, e, n) {
                    return N(function(t) {
                        for (var r = [], e = 0; e < t.length; ++e) r.push(255 & t.charCodeAt(e));
                        return r
                    }(r), t, e, n)
                }

                function b(t, r, e, n) {
                    return v(t, r, e, n)
                }

                function m(t, r, e, n) {
                    return N(j(r), t, e, n)
                }

                function E(t, r, e, n) {
                    return N(function(t, r) {
                        for (var e, n, i, o = [], f = 0; f < t.length && !((r -= 2) < 0); ++f) e = t.charCodeAt(f), n = e >> 8, i = e % 256, o.push(i), o.push(n);
                        return o
                    }(r, t.length - e), t, e, n)
                }

                function B(t, r, e) {
                    return 0 === r && e === t.length ? n.fromByteArray(t) : n.fromByteArray(t.slice(r, e))
                }

                function A(t, r, e) {
                    e = Math.min(t.length, e);
                    for (var n = [], i = r; i < e;) {
                        var o, f, u, s, h = t[i],
                            a = null,
                            p = h > 239 ? 4 : h > 223 ? 3 : h > 191 ? 2 : 1;
                        if (i + p <= e) switch (p) {
                            case 1:
                                h < 128 && (a = h);
                                break;
                            case 2:
                                128 == (192 & (o = t[i + 1])) && (s = (31 & h) << 6 | 63 & o) > 127 && (a = s);
                                break;
                            case 3:
                                o = t[i + 1], f = t[i + 2], 128 == (192 & o) && 128 == (192 & f) && (s = (15 & h) << 12 | (63 & o) << 6 | 63 & f) > 2047 && (s < 55296 || s > 57343) && (a = s);
                                break;
                            case 4:
                                o = t[i + 1], f = t[i + 2], u = t[i + 3], 128 == (192 & o) && 128 == (192 & f) && 128 == (192 & u) && (s = (15 & h) << 18 | (63 & o) << 12 | (63 & f) << 6 | 63 & u) > 65535 && s < 1114112 && (a = s)
                        }
                        null === a ? (a = 65533, p = 1) : a > 65535 && (a -= 65536, n.push(a >>> 10 & 1023 | 55296), a = 56320 | 1023 & a), n.push(a), i += p
                    }
                    return function(t) {
                        var r = t.length;
                        if (r <= U) return String.fromCharCode.apply(String, t);
                        var e = "",
                            n = 0;
                        for (; n < r;) e += String.fromCharCode.apply(String, t.slice(n, n += U));
                        return e
                    }(n)
                }
                e.kMaxLength = o, r.TYPED_ARRAY_SUPPORT = function() {
                    try {
                        var t = new Uint8Array(1);
                        return t.__proto__ = {
                            __proto__: Uint8Array.prototype,
                            foo: function() {
                                return 42
                            }
                        }, 42 === t.foo()
                    } catch (t) {
                        return !1
                    }
                }(), r.TYPED_ARRAY_SUPPORT || "undefined" == typeof console || "function" != typeof console.error || console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."), Object.defineProperty(r.prototype, "parent", {
                    enumerable: !0,
                    get: function() {
                        if (r.isBuffer(this)) return this.buffer
                    }
                }), Object.defineProperty(r.prototype, "offset", {
                    enumerable: !0,
                    get: function() {
                        if (r.isBuffer(this)) return this.byteOffset
                    }
                }), "undefined" != typeof Symbol && null != Symbol.species && r[Symbol.species] === r && Object.defineProperty(r, Symbol.species, {
                    value: null,
                    configurable: !0,
                    enumerable: !1,
                    writable: !1
                }), r.poolSize = 8192, r.from = function(t, r, e) {
                    return u(t, r, e)
                }, r.prototype.__proto__ = Uint8Array.prototype, r.__proto__ = Uint8Array, r.alloc = function(t, r, e) {
                    return function(t, r, e) {
                        return s(t), t <= 0 ? f(t) : void 0 !== r ? "string" == typeof e ? f(t).fill(r, e) : f(t).fill(r) : f(t)
                    }(t, r, e)
                }, r.allocUnsafe = function(t) {
                    return h(t)
                }, r.allocUnsafeSlow = function(t) {
                    return h(t)
                }, r.isBuffer = function(t) {
                    return null != t && !0 === t._isBuffer && t !== r.prototype
                }, r.compare = function(t, e) {
                    if (z(t, Uint8Array) && (t = r.from(t, t.offset, t.byteLength)), z(e, Uint8Array) && (e = r.from(e, e.offset, e.byteLength)), !r.isBuffer(t) || !r.isBuffer(e)) throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
                    if (t === e) return 0;
                    for (var n = t.length, i = e.length, o = 0, f = Math.min(n, i); o < f; ++o)
                        if (t[o] !== e[o]) {
                            n = t[o], i = e[o];
                            break
                        }
                    return n < i ? -1 : i < n ? 1 : 0
                }, r.isEncoding = function(t) {
                    switch (String(t).toLowerCase()) {
                        case "hex":
                        case "utf8":
                        case "utf-8":
                        case "ascii":
                        case "latin1":
                        case "binary":
                        case "base64":
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return !0;
                        default:
                            return !1
                    }
                }, r.concat = function(t, e) {
                    if (!Array.isArray(t)) throw new TypeError('"list" argument must be an Array of Buffers');
                    if (0 === t.length) return r.alloc(0);
                    var n;
                    if (void 0 === e)
                        for (e = 0, n = 0; n < t.length; ++n) e += t[n].length;
                    var i = r.allocUnsafe(e),
                        o = 0;
                    for (n = 0; n < t.length; ++n) {
                        var f = t[n];
                        if (z(f, Uint8Array) && (f = r.from(f)), !r.isBuffer(f)) throw new TypeError('"list" argument must be an Array of Buffers');
                        f.copy(i, o), o += f.length
                    }
                    return i
                }, r.byteLength = c, r.prototype._isBuffer = !0, r.prototype.swap16 = function() {
                    var t = this.length;
                    if (t % 2 != 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
                    for (var r = 0; r < t; r += 2) l(this, r, r + 1);
                    return this
                }, r.prototype.swap32 = function() {
                    var t = this.length;
                    if (t % 4 != 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
                    for (var r = 0; r < t; r += 4) l(this, r, r + 3), l(this, r + 1, r + 2);
                    return this
                }, r.prototype.swap64 = function() {
                    var t = this.length;
                    if (t % 8 != 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
                    for (var r = 0; r < t; r += 8) l(this, r, r + 7), l(this, r + 1, r + 6), l(this, r + 2, r + 5), l(this, r + 3, r + 4);
                    return this
                }, r.prototype.toString = function() {
                    var t = this.length;
                    return 0 === t ? "" : 0 === arguments.length ? A(this, 0, t) : function(t, r, e) {
                        var n = !1;
                        if ((void 0 === r || r < 0) && (r = 0), r > this.length) return "";
                        if ((void 0 === e || e > this.length) && (e = this.length), e <= 0) return "";
                        if ((e >>>= 0) <= (r >>>= 0)) return "";
                        for (t || (t = "utf8");;) switch (t) {
                            case "hex":
                                return S(this, r, e);
                            case "utf8":
                            case "utf-8":
                                return A(this, r, e);
                            case "ascii":
                                return T(this, r, e);
                            case "latin1":
                            case "binary":
                                return I(this, r, e);
                            case "base64":
                                return B(this, r, e);
                            case "ucs2":
                            case "ucs-2":
                            case "utf16le":
                            case "utf-16le":
                                return L(this, r, e);
                            default:
                                if (n) throw new TypeError("Unknown encoding: " + t);
                                t = (t + "").toLowerCase(), n = !0
                        }
                    }.apply(this, arguments)
                }, r.prototype.toLocaleString = r.prototype.toString, r.prototype.equals = function(t) {
                    if (!r.isBuffer(t)) throw new TypeError("Argument must be a Buffer");
                    return this === t || 0 === r.compare(this, t)
                }, r.prototype.inspect = function() {
                    var t = "",
                        r = e.INSPECT_MAX_BYTES;
                    return t = this.toString("hex", 0, r).replace(/(.{2})/g, "$1 ").trim(), this.length > r && (t += " ... "), "<Buffer " + t + ">"
                }, r.prototype.compare = function(t, e, n, i, o) {
                    if (z(t, Uint8Array) && (t = r.from(t, t.offset, t.byteLength)), !r.isBuffer(t)) throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof t);
                    if (void 0 === e && (e = 0), void 0 === n && (n = t ? t.length : 0), void 0 === i && (i = 0), void 0 === o && (o = this.length), e < 0 || n > t.length || i < 0 || o > this.length) throw new RangeError("out of range index");
                    if (i >= o && e >= n) return 0;
                    if (i >= o) return -1;
                    if (e >= n) return 1;
                    if (this === t) return 0;
                    for (var f = (o >>>= 0) - (i >>>= 0), u = (n >>>= 0) - (e >>>= 0), s = Math.min(f, u), h = this.slice(i, o), a = t.slice(e, n), p = 0; p < s; ++p)
                        if (h[p] !== a[p]) {
                            f = h[p], u = a[p];
                            break
                        }
                    return f < u ? -1 : u < f ? 1 : 0
                }, r.prototype.includes = function(t, r, e) {
                    return -1 !== this.indexOf(t, r, e)
                }, r.prototype.indexOf = function(t, r, e) {
                    return y(this, t, r, e, !0)
                }, r.prototype.lastIndexOf = function(t, r, e) {
                    return y(this, t, r, e, !1)
                }, r.prototype.write = function(t, r, e, n) {
                    if (void 0 === r) n = "utf8", e = this.length, r = 0;
                    else if (void 0 === e && "string" == typeof r) n = r, e = this.length, r = 0;
                    else {
                        if (!isFinite(r)) throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
                        r >>>= 0, isFinite(e) ? (e >>>= 0, void 0 === n && (n = "utf8")) : (n = e, e = void 0)
                    }
                    var i = this.length - r;
                    if ((void 0 === e || e > i) && (e = i), t.length > 0 && (e < 0 || r < 0) || r > this.length) throw new RangeError("Attempt to write outside buffer bounds");
                    n || (n = "utf8");
                    for (var o = !1;;) switch (n) {
                        case "hex":
                            return w(this, t, r, e);
                        case "utf8":
                        case "utf-8":
                            return d(this, t, r, e);
                        case "ascii":
                            return v(this, t, r, e);
                        case "latin1":
                        case "binary":
                            return b(this, t, r, e);
                        case "base64":
                            return m(this, t, r, e);
                        case "ucs2":
                        case "ucs-2":
                        case "utf16le":
                        case "utf-16le":
                            return E(this, t, r, e);
                        default:
                            if (o) throw new TypeError("Unknown encoding: " + n);
                            n = ("" + n).toLowerCase(), o = !0
                    }
                }, r.prototype.toJSON = function() {
                    return {
                        type: "Buffer",
                        data: Array.prototype.slice.call(this._arr || this, 0)
                    }
                };
                var U = 4096;

                function T(t, r, e) {
                    var n = "";
                    e = Math.min(t.length, e);
                    for (var i = r; i < e; ++i) n += String.fromCharCode(127 & t[i]);
                    return n
                }

                function I(t, r, e) {
                    var n = "";
                    e = Math.min(t.length, e);
                    for (var i = r; i < e; ++i) n += String.fromCharCode(t[i]);
                    return n
                }

                function S(t, r, e) {
                    var n = t.length;
                    (!r || r < 0) && (r = 0), (!e || e < 0 || e > n) && (e = n);
                    for (var i = "", o = r; o < e; ++o) i += k(t[o]);
                    return i
                }

                function L(t, r, e) {
                    for (var n = t.slice(r, e), i = "", o = 0; o < n.length; o += 2) i += String.fromCharCode(n[o] + 256 * n[o + 1]);
                    return i
                }

                function R(t, r, e) {
                    if (t % 1 != 0 || t < 0) throw new RangeError("offset is not uint");
                    if (t + r > e) throw new RangeError("Trying to access beyond buffer length")
                }

                function C(t, e, n, i, o, f) {
                    if (!r.isBuffer(t)) throw new TypeError('"buffer" argument must be a Buffer instance');
                    if (e > o || e < f) throw new RangeError('"value" argument is out of bounds');
                    if (n + i > t.length) throw new RangeError("Index out of range")
                }

                function O(t, r, e, n, i, o) {
                    if (e + n > t.length) throw new RangeError("Index out of range");
                    if (e < 0) throw new RangeError("Index out of range")
                }

                function _(t, r, e, n, o) {
                    return r = +r, e >>>= 0, o || O(t, 0, e, 4), i.write(t, r, e, n, 23, 4), e + 4
                }

                function x(t, r, e, n, o) {
                    return r = +r, e >>>= 0, o || O(t, 0, e, 8), i.write(t, r, e, n, 52, 8), e + 8
                }
                r.prototype.slice = function(t, e) {
                    var n = this.length;
                    (t = ~~t) < 0 ? (t += n) < 0 && (t = 0) : t > n && (t = n), (e = void 0 === e ? n : ~~e) < 0 ? (e += n) < 0 && (e = 0) : e > n && (e = n), e < t && (e = t);
                    var i = this.subarray(t, e);
                    return i.__proto__ = r.prototype, i
                }, r.prototype.readUIntLE = function(t, r, e) {
                    t >>>= 0, r >>>= 0, e || R(t, r, this.length);
                    for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256);) n += this[t + o] * i;
                    return n
                }, r.prototype.readUIntBE = function(t, r, e) {
                    t >>>= 0, r >>>= 0, e || R(t, r, this.length);
                    for (var n = this[t + --r], i = 1; r > 0 && (i *= 256);) n += this[t + --r] * i;
                    return n
                }, r.prototype.readUInt8 = function(t, r) {
                    return t >>>= 0, r || R(t, 1, this.length), this[t]
                }, r.prototype.readUInt16LE = function(t, r) {
                    return t >>>= 0, r || R(t, 2, this.length), this[t] | this[t + 1] << 8
                }, r.prototype.readUInt16BE = function(t, r) {
                    return t >>>= 0, r || R(t, 2, this.length), this[t] << 8 | this[t + 1]
                }, r.prototype.readUInt32LE = function(t, r) {
                    return t >>>= 0, r || R(t, 4, this.length), (this[t] | this[t + 1] << 8 | this[t + 2] << 16) + 16777216 * this[t + 3]
                }, r.prototype.readUInt32BE = function(t, r) {
                    return t >>>= 0, r || R(t, 4, this.length), 16777216 * this[t] + (this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3])
                }, r.prototype.readIntLE = function(t, r, e) {
                    t >>>= 0, r >>>= 0, e || R(t, r, this.length);
                    for (var n = this[t], i = 1, o = 0; ++o < r && (i *= 256);) n += this[t + o] * i;
                    return n >= (i *= 128) && (n -= Math.pow(2, 8 * r)), n
                }, r.prototype.readIntBE = function(t, r, e) {
                    t >>>= 0, r >>>= 0, e || R(t, r, this.length);
                    for (var n = r, i = 1, o = this[t + --n]; n > 0 && (i *= 256);) o += this[t + --n] * i;
                    return o >= (i *= 128) && (o -= Math.pow(2, 8 * r)), o
                }, r.prototype.readInt8 = function(t, r) {
                    return t >>>= 0, r || R(t, 1, this.length), 128 & this[t] ? -1 * (255 - this[t] + 1) : this[t]
                }, r.prototype.readInt16LE = function(t, r) {
                    t >>>= 0, r || R(t, 2, this.length);
                    var e = this[t] | this[t + 1] << 8;
                    return 32768 & e ? 4294901760 | e : e
                }, r.prototype.readInt16BE = function(t, r) {
                    t >>>= 0, r || R(t, 2, this.length);
                    var e = this[t + 1] | this[t] << 8;
                    return 32768 & e ? 4294901760 | e : e
                }, r.prototype.readInt32LE = function(t, r) {
                    return t >>>= 0, r || R(t, 4, this.length), this[t] | this[t + 1] << 8 | this[t + 2] << 16 | this[t + 3] << 24
                }, r.prototype.readInt32BE = function(t, r) {
                    return t >>>= 0, r || R(t, 4, this.length), this[t] << 24 | this[t + 1] << 16 | this[t + 2] << 8 | this[t + 3]
                }, r.prototype.readFloatLE = function(t, r) {
                    return t >>>= 0, r || R(t, 4, this.length), i.read(this, t, !0, 23, 4)
                }, r.prototype.readFloatBE = function(t, r) {
                    return t >>>= 0, r || R(t, 4, this.length), i.read(this, t, !1, 23, 4)
                }, r.prototype.readDoubleLE = function(t, r) {
                    return t >>>= 0, r || R(t, 8, this.length), i.read(this, t, !0, 52, 8)
                }, r.prototype.readDoubleBE = function(t, r) {
                    return t >>>= 0, r || R(t, 8, this.length), i.read(this, t, !1, 52, 8)
                }, r.prototype.writeUIntLE = function(t, r, e, n) {
                    (t = +t, r >>>= 0, e >>>= 0, n) || C(this, t, r, e, Math.pow(2, 8 * e) - 1, 0);
                    var i = 1,
                        o = 0;
                    for (this[r] = 255 & t; ++o < e && (i *= 256);) this[r + o] = t / i & 255;
                    return r + e
                }, r.prototype.writeUIntBE = function(t, r, e, n) {
                    (t = +t, r >>>= 0, e >>>= 0, n) || C(this, t, r, e, Math.pow(2, 8 * e) - 1, 0);
                    var i = e - 1,
                        o = 1;
                    for (this[r + i] = 255 & t; --i >= 0 && (o *= 256);) this[r + i] = t / o & 255;
                    return r + e
                }, r.prototype.writeUInt8 = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 1, 255, 0), this[r] = 255 & t, r + 1
                }, r.prototype.writeUInt16LE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 2, 65535, 0), this[r] = 255 & t, this[r + 1] = t >>> 8, r + 2
                }, r.prototype.writeUInt16BE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 2, 65535, 0), this[r] = t >>> 8, this[r + 1] = 255 & t, r + 2
                }, r.prototype.writeUInt32LE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 4, 4294967295, 0), this[r + 3] = t >>> 24, this[r + 2] = t >>> 16, this[r + 1] = t >>> 8, this[r] = 255 & t, r + 4
                }, r.prototype.writeUInt32BE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 4, 4294967295, 0), this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t, r + 4
                }, r.prototype.writeIntLE = function(t, r, e, n) {
                    if (t = +t, r >>>= 0, !n) {
                        var i = Math.pow(2, 8 * e - 1);
                        C(this, t, r, e, i - 1, -i)
                    }
                    var o = 0,
                        f = 1,
                        u = 0;
                    for (this[r] = 255 & t; ++o < e && (f *= 256);) t < 0 && 0 === u && 0 !== this[r + o - 1] && (u = 1), this[r + o] = (t / f >> 0) - u & 255;
                    return r + e
                }, r.prototype.writeIntBE = function(t, r, e, n) {
                    if (t = +t, r >>>= 0, !n) {
                        var i = Math.pow(2, 8 * e - 1);
                        C(this, t, r, e, i - 1, -i)
                    }
                    var o = e - 1,
                        f = 1,
                        u = 0;
                    for (this[r + o] = 255 & t; --o >= 0 && (f *= 256);) t < 0 && 0 === u && 0 !== this[r + o + 1] && (u = 1), this[r + o] = (t / f >> 0) - u & 255;
                    return r + e
                }, r.prototype.writeInt8 = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 1, 127, -128), t < 0 && (t = 255 + t + 1), this[r] = 255 & t, r + 1
                }, r.prototype.writeInt16LE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 2, 32767, -32768), this[r] = 255 & t, this[r + 1] = t >>> 8, r + 2
                }, r.prototype.writeInt16BE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 2, 32767, -32768), this[r] = t >>> 8, this[r + 1] = 255 & t, r + 2
                }, r.prototype.writeInt32LE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 4, 2147483647, -2147483648), this[r] = 255 & t, this[r + 1] = t >>> 8, this[r + 2] = t >>> 16, this[r + 3] = t >>> 24, r + 4
                }, r.prototype.writeInt32BE = function(t, r, e) {
                    return t = +t, r >>>= 0, e || C(this, t, r, 4, 2147483647, -2147483648), t < 0 && (t = 4294967295 + t + 1), this[r] = t >>> 24, this[r + 1] = t >>> 16, this[r + 2] = t >>> 8, this[r + 3] = 255 & t, r + 4
                }, r.prototype.writeFloatLE = function(t, r, e) {
                    return _(this, t, r, !0, e)
                }, r.prototype.writeFloatBE = function(t, r, e) {
                    return _(this, t, r, !1, e)
                }, r.prototype.writeDoubleLE = function(t, r, e) {
                    return x(this, t, r, !0, e)
                }, r.prototype.writeDoubleBE = function(t, r, e) {
                    return x(this, t, r, !1, e)
                }, r.prototype.copy = function(t, e, n, i) {
                    if (!r.isBuffer(t)) throw new TypeError("argument should be a Buffer");
                    if (n || (n = 0), i || 0 === i || (i = this.length), e >= t.length && (e = t.length), e || (e = 0), i > 0 && i < n && (i = n), i === n) return 0;
                    if (0 === t.length || 0 === this.length) return 0;
                    if (e < 0) throw new RangeError("targetStart out of bounds");
                    if (n < 0 || n >= this.length) throw new RangeError("Index out of range");
                    if (i < 0) throw new RangeError("sourceEnd out of bounds");
                    i > this.length && (i = this.length), t.length - e < i - n && (i = t.length - e + n);
                    var o = i - n;
                    if (this === t && "function" == typeof Uint8Array.prototype.copyWithin) this.copyWithin(e, n, i);
                    else if (this === t && n < e && e < i)
                        for (var f = o - 1; f >= 0; --f) t[f + e] = this[f + n];
                    else Uint8Array.prototype.set.call(t, this.subarray(n, i), e);
                    return o
                }, r.prototype.fill = function(t, e, n, i) {
                    if ("string" == typeof t) {
                        if ("string" == typeof e ? (i = e, e = 0, n = this.length) : "string" == typeof n && (i = n, n = this.length), void 0 !== i && "string" != typeof i) throw new TypeError("encoding must be a string");
                        if ("string" == typeof i && !r.isEncoding(i)) throw new TypeError("Unknown encoding: " + i);
                        if (1 === t.length) {
                            var o = t.charCodeAt(0);
                            ("utf8" === i && o < 128 || "latin1" === i) && (t = o)
                        }
                    } else "number" == typeof t && (t &= 255);
                    if (e < 0 || this.length < e || this.length < n) throw new RangeError("Out of range index");
                    if (n <= e) return this;
                    var f;
                    if (e >>>= 0, n = void 0 === n ? this.length : n >>> 0, t || (t = 0), "number" == typeof t)
                        for (f = e; f < n; ++f) this[f] = t;
                    else {
                        var u = r.isBuffer(t) ? t : r.from(t, i),
                            s = u.length;
                        if (0 === s) throw new TypeError('The value "' + t + '" is invalid for argument "value"');
                        for (f = 0; f < n - e; ++f) this[f + e] = u[f % s]
                    }
                    return this
                };
                var M = /[^+\/0-9A-Za-z-_]/g;

                function k(t) {
                    return t < 16 ? "0" + t.toString(16) : t.toString(16)
                }

                function P(t, r) {
                    var e;
                    r = r || 1 / 0;
                    for (var n = t.length, i = null, o = [], f = 0; f < n; ++f) {
                        if ((e = t.charCodeAt(f)) > 55295 && e < 57344) {
                            if (!i) {
                                if (e > 56319) {
                                    (r -= 3) > -1 && o.push(239, 191, 189);
                                    continue
                                }
                                if (f + 1 === n) {
                                    (r -= 3) > -1 && o.push(239, 191, 189);
                                    continue
                                }
                                i = e;
                                continue
                            }
                            if (e < 56320) {
                                (r -= 3) > -1 && o.push(239, 191, 189), i = e;
                                continue
                            }
                            e = 65536 + (i - 55296 << 10 | e - 56320)
                        } else i && (r -= 3) > -1 && o.push(239, 191, 189);
                        if (i = null, e < 128) {
                            if ((r -= 1) < 0) break;
                            o.push(e)
                        } else if (e < 2048) {
                            if ((r -= 2) < 0) break;
                            o.push(e >> 6 | 192, 63 & e | 128)
                        } else if (e < 65536) {
                            if ((r -= 3) < 0) break;
                            o.push(e >> 12 | 224, e >> 6 & 63 | 128, 63 & e | 128)
                        } else {
                            if (!(e < 1114112)) throw new Error("Invalid code point");
                            if ((r -= 4) < 0) break;
                            o.push(e >> 18 | 240, e >> 12 & 63 | 128, e >> 6 & 63 | 128, 63 & e | 128)
                        }
                    }
                    return o
                }

                function j(t) {
                    return n.toByteArray(function(t) {
                        if ((t = (t = t.split("=")[0]).trim().replace(M, "")).length < 2) return "";
                        for (; t.length % 4 != 0;) t += "=";
                        return t
                    }(t))
                }

                function N(t, r, e, n) {
                    for (var i = 0; i < n && !(i + e >= r.length || i >= t.length); ++i) r[i + e] = t[i];
                    return i
                }

                function z(t, r) {
                    return t instanceof r || null != t && null != t.constructor && null != t.constructor.name && t.constructor.name === r.name
                }

                function D(t) {
                    return t != t
                }
            }).call(this, t("buffer").Buffer)
        }, {
            "base64-js": 4,
            buffer: 5,
            ieee754: 6
        }],
        6: [function(t, r, e) {
            arguments[4][3][0].apply(e, arguments)
        }, {
            dup: 3
        }]
    }, {}, [1])(1)
});
Buffer=buffer.Buffer;

/* Remove any buffer toJSON bindings */
if (typeof Buffer != 'undefined' && Buffer.prototype.toJSON) delete Buffer.prototype.toJSON;
if (typeof buffer == 'object' && buffer.Buffer) delete buffer.Buffer.prototype.toJSON;
if (!ArrayBuffer['isView']) {
  ArrayBuffer.isView = function(a) {
    return a !== null && typeof(a) === "object" && a['buffer'] instanceof ArrayBuffer;
  }
};
}

BufferInit();

