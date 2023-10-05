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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2016-2017)
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    image.js - image element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

/**
 * Modules
 */

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Image
 */

function Image(options) {
  if (!instanceOf(this,Node)) {
    return new Image(options);
  }

  options = options || {};
  options.type = options.itype || options.type || 'ansi';

  Box.call(this, options);

  if (options.type === 'ansi' && this.type !== 'ansiimage') {
    var ANSIImage = require('./ansiimage');
    Object.getOwnPropertyNames(ANSIImage.prototype).forEach(function(key) {
      if (key === 'type') return;
      Object.defineProperty(this, key,
        Object.getOwnPropertyDescriptor(ANSIImage.prototype, key));
    }, this);
    ANSIImage.call(this, options);
    return this;
  }

  if (options.type === 'overlay' && this.type !== 'overlayimage') {
    var OverlayImage = require('./overlayimage');
    Object.getOwnPropertyNames(OverlayImage.prototype).forEach(function(key) {
      if (key === 'type') return;
      Object.defineProperty(this, key,
        Object.getOwnPropertyDescriptor(OverlayImage.prototype, key));
    }, this);
    OverlayImage.call(this, options);
    return this;
  }

  throw new Error('`type` must either be `ansi` or `overlay`.');
}

//Image.prototype.__proto__ = Box.prototype;
inheritPrototype(Image,Box);

Image.prototype.type = 'image';

/**
 * Expose
 */

module.exports = Image;
