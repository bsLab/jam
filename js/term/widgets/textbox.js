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
 **    $INITIAL:     (C) 2013-2018, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.5.2
 **
 **    $INFO:
 **
 **    textbox.js - textbox element for blessed
 **
 **     Special options: {wrap,multiline,screct,censor}
 **
 **  Usage:
  
     1. Editable
     
     var obj = blessed.textbox({
      label: options.label||'My Input',
      value: options.value||'default value',
      fg: 'blue',
      bg: 'default',
      barBg: 'default',
      barFg: 'blue',
      width: options.width||(self.screen.width-(options.left*2||2)),
      height: 3,
      left: options.left,
      right : options.right,
      top: options.top||0,
      keys: true,
      vi: true,
      mouse: true,
      inputOnFocus: true,
      focus:true,
      //draggable:true,
      border: {
        type: 'line'
      },
      style: {
        fg:'blue',
        focus : {
          border: {
            fg: 'red'
          }      
        }
      }
    });
    
    2. Non editable

    var obj = blessed.textbox({
      top: options.top||1,
      left: options.left||1,
      width: options.width,
      height: options.height||3,
      label: options.label,
      focus:false,
      //draggable:true,
      border: {
        type: 'line'
      },
      style: {
        fg:'blue'
      }
    });
    
    screen.append(obj);
    
    obj.setValue('Some Text')
 **
 **
 ** New options: wrap:boolean
 **
 **    $ENDOFINFO
 */
var options = {
  version:'1.5.2'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Textarea = Require('term/widgets/textarea');

/**
 * Textbox
 */

function Textbox(options) {
  if (!instanceOf(this,Node)) {
    return new Textbox(options);
  }

  options = options || {};

  options.scrollable = options.scrollable||false;

  Textarea.call(this, options);

  // Special options
  this.secret = options.secret;
  this.censor = options.censor;
  this.wrap   = options.wrap;
  this.multiline = options.multiline;
}

//Textbox.prototype.__proto__ = Textarea.prototype;
inheritPrototype(Textbox,Textarea);

Textbox.prototype.type = 'textbox';

Textbox.prototype.__olistener = Textbox.prototype._listener;
Textbox.prototype._listener = function(ch, key) {
  if (!this.multiline && key.name === 'enter') {
    this.emit('enter',this.value);
    this._done(null, this.value);
    return;
  }
  return this.__olistener(ch, key);
};

Textbox.prototype.setValue = function(value) {
  var visible, val, i, line, sep;
  if (value == null) {
    value = this.value;
  }
  if (this._value !== value) {
    if (!this.multiline) {
      value = value.replace(/\n/g, '');
    }
    this.value = value;
    this._value = value;
    if (this.secret) {
      this.setContent('');
    } else if (this.censor) {
      this.setContent(Array(this.value.length + 1).join('*'));
    } else if (this.wrap && this.value.length > (this.width - this.iwidth - 1)) {
      line='';i=0, sep='';
      visible=this.width - this.iwidth - 1;
      val=this.value;
      while (val.length>0) {
        line = line + val.substr(0,visible);
        val = val.substr(visible,val.length-visible);  
        sep='\n';
      }
      this.setContent(line);    
    } else if (this.multiline) {
      val = this.value.replace(/\t/g, this.screen.tabc);
      this.setContent(val);
    } else {
      visible = -(this.width - this.iwidth - 1);
      val = this.value.replace(/\t/g, this.screen.tabc);
      this.setContent(val.slice(visible));
    }
    this._updateCursor();
  }
};
// setValue + update screen IM
Textbox.prototype.update = function(value) {
  this.setValue(value);
  this.screen.render();
}

Textbox.prototype.submit = function() {
  if (!this.__listener) return;
  return this.__listener('\r', { name: 'enter' });
};

/**
 * Expose
 */

module.exports = Textbox;
