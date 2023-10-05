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
 **    $REVESIO:     1.4.1
 **
 **    $INFO:
 **
 **    checkbox.js - checkbox element for blessed
 **
 **  Usage:
 **
 **   var obj = blessed.checkbox({
 **     checked: options.value||false,  
 **     left: options.left,
 **     right : options.right,
 **     top: options.top||0,
 **     mouse: true,
 **     inputOnFocus: true,
 **     height: 1,
 **     text:options.text||'empty'
 **   });
 **   screen.append(obj);
 **   obj.on('check',function () {});
 **   
 ** Events: 
 **   'check' 'uncheck' 'select'
 **   
 **     
 **    $ENDOFINFO
 */
  
/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Input = Require('term/widgets/input');

/**
 * Checkbox
 */

function Checkbox(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Checkbox(options);
  }

  options = options || {};

  Input.call(this, options);

  this.text = options.content || options.text || '';
  this.checked = this.value = options.checked || false;

  this.on('keypress', function(ch, key) {
    if (key.name === 'enter' || key.name === 'space') {
      self.toggle();
      self.screen.render();
    }
  });

  if (options.mouse) {
    this.on('click', function() {
      self.toggle();
      self.screen.render();
    });
  }

  this.on('focus', function() {
    var lpos = self.lpos;
    if (!lpos) return;
    self.screen.program.lsaveCursor('checkbox');
    self.screen.program.cup(lpos.yi, lpos.xi + 1);
    self.screen.program.showCursor();
  });

  this.on('blur', function() {
    self.screen.program.lrestoreCursor('checkbox', true);
  });
}

//Checkbox.prototype.__proto__ = Input.prototype;
inheritPrototype(Checkbox,Input);

Checkbox.prototype.type = 'checkbox';

Checkbox.prototype.render = function() {
  this.clearPos(true);
  this.setContent('[' + (this.checked ? 'x' : ' ') + '] ' + this.text, true);
  return this._render();
};

Checkbox.prototype.check = function() {
  if (this.checked) return;
  this.checked = this.value = true;
  this.emit('check',this);
  this.emit('select',true);
};

Checkbox.prototype.uncheck = function() {
  if (!this.checked) return;
  this.checked = this.value = false;
  this.emit('uncheck',this);
  this.emit('select',false);
};

Checkbox.prototype.toggle = function() {
  return this.checked
    ? this.uncheck()
    : this.check();
};

/**
 * Expose
 */

module.exports = Checkbox;
