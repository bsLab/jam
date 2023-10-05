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
 **    $AUTHORS:     Christopher Jeffrey, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.2.1
 **
 **    $INFO:
 **
 **    box.js - box element for blessed
 **
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Element = Require('term/widgets/element');

/**
 * Box
 */

function Box(options) {
  if (!instanceOf(this,Node)) {
    return new Box(options);
  }
  options = options || {};
  Element.call(this, options);
}

//Box.prototype.__proto__ = Element.prototype;
inheritPrototype(Box,Element);

Box.prototype.type = 'box';

/**
 * Expose
 */

module.exports = Box;
