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
 **    $INITIAL:     (C) 2013-2016, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse
 **    $REVESIO:     1.3.2
 **
 **    $INFO:
 **
 **    Logging Widget with Scrollbars
 **
 **   options: {
 **       scrollOnInput:boolean -- auto scroll
 **       arrows?: {up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}}
 **
 **  Usage:
 
    if (options.top == undefined) options.top=2;
    if (options.left == undefined) options.left=1;
    var obj = blessed.log({
      top: options.top,
      left: options.left,
      width: options.width||(self.screen.width-options.left*2),
      height: options.height||(self.screen.height-options.top-4),
      label: options.label||'Log',
      mouse:true,
      keys:true,
      scrollback:100,
      border: {
        type: 'line'
      },
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          fg: 'cyan',
          inverse: true
        }
      },
      alwaysScroll:true,
      scrollOnInput:true,
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'green'
        },
        focus: {
          border: {
            fg: 'red'
          }
        }
      }
    });
    screen.append(obj);


 **    $ENDOFINFO
 */

var options = {
  version:'1.3.2'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var util = require('util');
var Helpers = Require('term/helpers');
var Button = Require('term/widgets/button');
var Arrows = Require('term/widgets/arrows');

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = Require('term/widgets/node');
var ScrollableText = Require('term/widgets/scrollabletext');

/**
 * Log
 */

function Log(options) {
  var self = this, bbox;

  if (!instanceOf(this,Node)) {
    return new Log(options);
  }

  options = options || {};

  ScrollableText.call(this, options);

  this.scrollback = options.scrollback != null
    ? options.scrollback
    : Infinity;
  this.scrollOnInput = options.scrollOnInput;
  this._updating=false;

  if (options.arrows) 
    Arrows(
      self,
      options,
      function () { self.scroll(-2)},
      function () { self.scroll(2)}
    );
  
  this.on('set content', function() {
    if (!self._updating && !self._userScrolled && self.scrollOnInput) {
      self._updating=true;
      setTimeout(function() {
        self.setScrollPerc(100);
        self._userScrolled = false;
        self._updating=false;
        self.screen.render();
      },20);
    }
  });
}

//Log.prototype.__proto__ = ScrollableText.prototype;
inheritPrototype(Log,ScrollableText);

Log.prototype.type = 'log';

Log.prototype.log =
Log.prototype.add = function() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] === 'object') {
    args[0] = util.inspect(args[0], true, 20, true);
  }
  var text = util.format.apply(util, args);
  this.emit('log', text);
  var ret = this.pushLine(text);
 
  //if (this._clines.fake.length > this.scrollback) {
  //  this.shiftLine(0, (this.scrollback / 3) | 0);
  // }
  return ret;
};

Log.prototype.clear = function() {
  if (this._userScrolled) this.setScrollPerc(100);
  this.setContent('');
  this.resetScroll();
}

Log.prototype._scroll = Log.prototype.scroll;
Log.prototype.scroll = function(offset, always) {
  if (offset>this.getScrollHeight() || (this.getScrollHeight()+offset)<0) return;
  if (offset === 0) return this._scroll(offset, always);
  this._userScrolled = true;
  var ret = this._scroll(offset, always);
  if (this.getScrollPerc() === 100) {
    this._userScrolled = false;
  }
  return ret;
};

/**
 * Expose
 */

module.exports = Log;



Log.prototype.logold = function(str) {  
  var i;
  this.logLines.push(str)  
  if (this.logLines.length==1) {
    this.setContent(str);
  }
  else if (this.logLines.length>this.options.bufferLength) {
    this.logLines.shift();
    this.setContent(this.logLines[0]);
    for(i=1;i<this.logLines.length;i++) {
      this.insertLine(i,this.logLines[i]);
    }
    this.scrollBottom();
  } else {
    this.scrollBottom();
    this.insertBottom(str);
    this.scrollBottom();
  }
  // this.setItems(this.logLines)
  // this.scrollTo(this.logLines.length)
}

