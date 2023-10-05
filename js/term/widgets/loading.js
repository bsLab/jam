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
 **    loading.js - loading element for blessed
 **
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Text = Require('term/widgets/text');

/**
 * Loading
 */

function Loading(options) {
  if (!instanceOf(this,Node)) {
    return new Loading(options);
  }

  options = options || {};

  Box.call(this, options);

  this._.icon = new Text({
    parent: this,
    align: 'center',
    top: 2,
    left: 1,
    right: 1,
    height: 1,
    content: '|'
  });
}

//Loading.prototype.__proto__ = Box.prototype;
inheritPrototype(Loading,Box);

Loading.prototype.type = 'loading';

Loading.prototype.load = function(text) {
  var self = this;

  // XXX Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);

  this.show();
  this.setContent(text);

  if (this._.timer) {
    this.stop();
  }

  this.screen.lockKeys = true;

  this._.timer = setInterval(function() {
    if (self._.icon.content === '|') {
      self._.icon.setContent('/');
    } else if (self._.icon.content === '/') {
      self._.icon.setContent('-');
    } else if (self._.icon.content === '-') {
      self._.icon.setContent('\\');
    } else if (self._.icon.content === '\\') {
      self._.icon.setContent('|');
    }
    self.screen.render();
  }, 200);
};

Loading.prototype.stop = function() {
  this.screen.lockKeys = false;
  this.hide();
  if (this._.timer) {
    clearInterval(this._.timer);
    delete this._.timer;
  }
  this.screen.render();
};

/**
 * Expose
 */

module.exports = Loading;
