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
 **    $MODIFIED:    by sbosse (2017-2021)
 **    $REVESIO:     1.3.1
 **
 **    $INFO:
 **
 **    radiobutton.js - radio button element for blessed
 **
 **     Added:
 **       - Simplified group management (using options.group identifier instead radioset parent)
 **
 **  Usage:
 **
 **  var obj = blessed.radiobutton({
 **      checked: options.value||false,  
 **      left: options.left,
 **      right : options.right,
 **      top: options.top||0,
 **      group:options.group,
 **      mouse: true,
 **      inputOnFocus: true,
 **      height: 1,
 **      text:options.text||'empty'
 **    });
 **    screen.append(obj);
 **    obj.on('select',function);
 ** 
 ** Events: 
 **   'check' 'uncheck' 'select'
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Checkbox = Require('term/widgets/checkbox');

/**
 * RadioButton
 */

function RadioButton(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new RadioButton(options);
  }

  options = options || {};
  this.group=options.group;
  Checkbox.call(this, options);

  this.on('check', function() {
    var el = self,
        group=self.group;
    while (el = el.parent) {
      if (el.type === 'radio-set'
          || el.type === 'form') break;
    }
    el = el || self.parent;
    var index=0;
    el.forDescendants(function(el) {
      if (el.type !== 'radio-button' || el === self || el.group!=group) {
        return;
      }
      index++;
      el.uncheck();
    });
  });
}

//RadioButton.prototype.__proto__ = Checkbox.prototype;
inheritPrototype(RadioButton,Checkbox);

RadioButton.prototype.type = 'radio-button';

RadioButton.prototype.render = function() {
  this.clearPos(true);
  this.setContent('(' + (this.checked ? '*' : ' ') + ') ' + this.text, true);
  return this._render();
};

RadioButton.prototype.toggle = RadioButton.prototype.check;

/**
 * Expose
 */

module.exports = RadioButton;
