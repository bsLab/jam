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
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.1.8
 **
 **    $INFO:
 **
 **    button.js - button element for blessed
 **
 **     Options: {mouse:boolean,content,border,style,object}
 **
 **     Events In: click keypress
 **     Events Out: press
 **
 **  Usage:
 
    var width;
    if (Comp.obj.isString(options.width)) {
      // relative value in %!
      width=Comp.pervasives.int_of_string(options.width);
      width=int(self.screen.width*width/100);
    }
    var obj = blessed.button({
      width: options.width||(options.content.length+4),
      left: (options.center?int(self.screen.width/2-width/2):options.left),
      right : options.right,
      top: options.top||0,
      height: 3,
      align: 'center',
      content: options.content||'?',
      mouse:true,
      focus:false,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: options.color||'blue',
        bold:true,
        border: {
          fg: 'black'
        },
        hover: {
          border: {
            fg: 'red'
          }
        }
      }  
    });
    screen.append(obj);
 
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Input = Require('term/widgets/input');

/**
 * Button
 */

function Button(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Button(options);
  }

  options = options || {};

  if (options.autoFocus == null) {
    options.autoFocus = false;
  }

  if (!options.style) options.style = {
      fg: 'white',
      bg: 'blue',
      bold:true,
      border: {
        fg: 'black'
      },
      hover: {
        border: {
          fg: 'red'
        }
      },
      focus : {
        border: {
          fg: 'red'
        }      
      }
  }
  if (options.object) this.object=options.object;
  
  Input.call(this, options);

  this.on('keypress', function(ch, key) {
    if (key.name == 'enter' || key.name == 'return') {
      return self.press();
    }
  });

  if (this.options.mouse) {
    this.on('click', function() {
      return self.press();
    });
  }
}

//Button.prototype.__proto__ = Input.prototype;
inheritPrototype(Button,Input);

Button.prototype.type = 'button';

Button.prototype.press = function() {
  this.focus();
  this.value = true;
  var result = this.emit('press');
  delete this.value;
  return result;
};

/**
 * Expose
 */

module.exports = Button;
