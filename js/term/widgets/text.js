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
 **    text.js - text element for blessed
 **
 ** Usage:
 
   var obj = blessed.text({
    width: options.width||(options.content.length),
    left: (options.center?int(screen.width/2-options.content.length/2):options.left),
    right : options.right,
    top: options.top||0,
    height: 3,
    focus:false,
    align: 'center',
    content: options.content||'?',
    style: {
      bold:true
    }  
  });
  screen.append(obj);

  obj.setContent('New text');
  
 **    $ENDOFINFO
 */
var Comp = Require('com/compat');

/**
 * Modules
 */

var Node = Require('term/widgets/node');
var Element = Require('term/widgets/element');

/**
 * Text
 */

function Text(options) {
  if (!instanceOf(this, Node)) {
    return new Text(options);
  }
  options = options || {};
  options.shrink = true;
  Element.call(this, options);
}

//Text.prototype.__proto__ = Element.prototype;
inheritPrototype(Text,Element);

Text.prototype.type = 'text';

/**
 * Expose
 */

module.exports = Text;
