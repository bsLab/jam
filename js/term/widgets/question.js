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
 **    $MODIFIED:    by sbosse (C) 2006-2017
 **    $REVESIO:     1.3.5
 **
 **    $INFO:
 **
 **     question.js - question element for blessed (overlay)
 **
 **  Usage:

    var width=options.width,height=options.height;
    if (Comp.obj.isString(options.width)) {
      // relative value in %!
      width=Comp.pervasives.int_of_string(options.width);
      width=int(self.screen.width*width/100);
    }
    if (Comp.obj.isString(options.height)) {
      // relative value in %!
      height=Comp.pervasives.int_of_string(options.height);
      height=int(self.screen.height*height/100);
    }
    var obj = blessed.Question({
      width: width,
      left: (options.center?int(self.screen.width/2-width/2):options.left),
      right : options.right,
      top: options.top||(options.center?int(self.screen.height/2-height/2):0),
      height: height,
      okButton     : options.okButton||'Okay',
      cancelButton : options.cancelButton||'Cancel',
      style: {
        bg:'red',
        fg:'white',
        bold:true
      }  
    });
    screen.append(obj);

    ...
    var dia = dialog({width:'50%',height:6,center:true,
              okButton     : 'Okay',
              cancelButton : 'Cancel'
      });
    dia.ask('You need to start the network service first!',function (answer) {});

 
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Button = Require('term/widgets/button');

/**
 * Question
 */

function Question(options) {
  if (!instanceOf(this,Node)) {
    return new Question(options);
  }

  options = options || {};
  options.hidden = true;
  if (!options.height || options.height<5) options.height=5;

  Box.call(this, options);

  // Collect clickable elements of this widget
  this._clickable=this.screen.clickable;
  this.screen.clickable=[];

  this._.okay = new Button({
    screen: this.screen,
    parent: this,
    top: options.height?(options.height-2):3,
    height: 1,
    left: 2,
    width: 10,
    content: options.okButton||'Okay',
    align: 'center',
    bg: 'black',
    hoverBg: 'blue',
    autoFocus: false,
    mouse: true
  });

  if (options.cancelButton) 
    this._.cancel = new Button({
      screen: this.screen,
      parent: this,
      top: options.height?(options.height-2):3,
      height: 1,
      left: options.width?(options.width-12):10,
      width: 10,
      content: options.cancelButton,
      align: 'center',
      bg: 'black',
      hoverBg: 'blue',
      autoFocus: false,
      mouse: true
    });
  // Save clickable elements of this widget; restore screen
  this.clickable=this.screen.clickable;
  this.screen.clickable=this._clickable;
}

//Question.prototype.__proto__ = Box.prototype;
inheritPrototype(Question,Box);

Question.prototype.type = 'question';

Question.prototype.ask = function(text, callback) {
  var self = this,
      press, okay, cancel,
      off,room;
  if (!callback) callback=function () {};
  
  // Keep above:
  // var parent = this.parent;
  // this.detach();
  // parent.append(this);
  
  // save all clickable elements; enable only this clickables
  this._clickable=this.screen.clickable;
  this.screen.clickable=this.clickable;
  this.show();
  if (text.length > this.options.width-4) {
    var tokens=text.split(' '),
        curlen=0,temp='';
    for(var t in tokens) {
      var token=tokens[t];
      if (curlen+token.length+1 < this.options.width-4) {
        temp = temp+token+' ';
        curlen = curlen + token.length + 1;
      } else {
        if (token.length < this.options.width-4) {
          temp = temp + '\n' + token+ ' ';
          curlen = token.length + 1;
        } else {
          off=0,room=this.options.width-4-curlen;
          temp = temp+token.substr(0,room);
          off=room;
          room=this.options.width-4;
          while (off < token.length) {
            frag = token.substr(off,room);
            temp = temp + '\n' + frag;
            off += room;
            curlen = frag;
          }
          temp = temp + ' ';
          curlen++;
        }
      } 
    }
    text=temp;
  }
  this.setContent('\n  ' + text.replace(/\n/g,'\n  '));

  this.onScreenEvent('keypress', press = function(ch, key) {
    if (key.name === 'mouse') return;
    if (key.name !== 'enter'
        && key.name !== 'escape'
        && key.name !== 'q'
        && key.name !== 'y'
        && key.name !== 'n') {
      return;
    }
    done(null, key.name === 'enter' || key.name === 'y');
  });

  this._.okay.on('press', okay = function() {
    done(null, true);
  });

  if (this._.cancel) this._.cancel.on('press', cancel = function() {
    done(null, false);
  });

  this.screen.saveFocus();
  this.focus();

  function done(err, data) {
    self.hide();
    // restore all clickable elements
    self.screen.clickable=self._clickable;
    self.screen.restoreFocus();
    self.removeScreenEvent('keypress', press);
    self._.okay.removeListener('press', okay);
    if (self._.cancel) self._.cancel.removeListener('press', cancel);
    return callback(err, data);
  }

  this.screen.render();
};

/**
 * Expose
 */

module.exports = Question;
