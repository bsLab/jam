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
 **    $REVESIO:     1.2.2
 **
 **    $INFO:
 **
 **    input.js - abstract input element for blessed
 **
 **     Added:
 **       - Focus handling
 **
 **    Usage:
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');

/**
 * Input
 */

function Input(options) {
  if (!instanceOf(this,Node)) {
    return new Input(options);
  }
  options = options || {};
  Box.call(this, options);
}

//Input.prototype.__proto__ = Box.prototype;
inheritPrototype(Input,Box);

Input.prototype.type = 'input';

Input.prototype.focus = function() {
  // Force focus for input field
  this.screen.rewindFocus();
  return this.screen.focused = this;
}

/**
 * Expose
 */

module.exports = Input;
