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
 **    $INITIAL:     sbosse (C) 2006-2018
 **    $REVESIO:     1.2.3
 **
 **    $INFO:
 **
 **     keyboard.js - software keyboard (overlay)
 **
 **  Options:
 **  typeof options = {
 **     top,left,width,height,
 **     button?={width,height} is button size,
 **     margin?={x,y} is button margin,
 **     compact?:boolean,
 **     delButton?:string,
 **     nlButton?:string,
 **     okayButton?:string,
 **     cancelButton?:string,
 **  }
 **
 **    $ENDOFINFO
 */
var options = {
  version:'1.2.3'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Button = Require('term/widgets/button');
var TextBox = Require('term/widgets/textbox');
var Helpers = Require('term/helpers');
/**
 * Keyboard
 */

function Keyboard(options) {
  var self=this,
      x,y,key,i=0,bbox;

  if (!instanceOf(this,Node)) {
    return new Keyboard(options);
  }
  
  options = options || {};
  options.hidden = true;
  if (!options.height || options.height<10) options.height=10;
  
  Box.call(this, options);
  
  // Collect clickable elements of this widget
  this._clickable=this.screen.clickable;
  this.screen.clickable=[];
  
  if (!options.button) options.button={width:3,height:2};
  if (!options.margin) options.margin={x:2,y:1};

  this.shift=false;
  this.group=0;
  this._.buttons=[];

  var Keys = [
    [
    'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o',
    'p','q','r','s','t','u','v','w','x','y','z'
    ],
    [
    '0','1','2','3','4','5','6','7','8','9','.','+','-','*',':',';'
    ],
    [
    '"','!','=','_','<','>','(',')','{','}','[',']','?','#','~',' '
    ]
  ];
  
  
  var keys = Comp.array.flatten(Keys);
  var complen=Keys[0].length+Keys[1].length;
  
  // compute for button positions
  bbox=Helpers.bbox(this.screen,options);

  if (options.okayButton) {
    this._.okay = new Button({
      screen: this.screen,
      parent: this,
      top: bbox.height-3,
      height: 1,
      left: 1,
      width: Math.max(6,options.okayButton.length+2),
      content: options.okayButton,
      align: 'center',
      autoFocus: false,
      mouse: true,
      style: {
        bold:true,
        bg:'green',
        fg:'white'
      }
    });
    this._.okay.on('press',function () { self.hide(); if (self._.callback) self._.callback(self._.input.getValue())});
  }
  if (options.cancelButton) {
    this._.cancel = new Button({
      screen: this.screen,
      parent: this,
      top: bbox.height-3,
      height: 1,
      right: 1,
      width: options.cancelButton.length+2,
      content: options.cancelButton,
      align: 'center',
      autoFocus: false,
      mouse: true,
      style: {
        bold:true,
        bg:'red',
        fg:'white'
      }
    });
    this._.cancel.on('press',function () { self.hide(); });
  }
  this._.shift = new Button({
      screen: this.screen,
      parent: this,
      top: bbox.height-3,
      height: 1,
      right: int(bbox.width/2)+(options.compact?1:int(options.margin.x)),
      width: (options.shiftButton && options.shiftButton.length+2)||6,
      content: options.shiftButton||'Shft',
      align: 'center',
      autoFocus: false,
      mouse: true
    });
  this._.shift.on('press',function () { 
      self.shift=~self.shift;
      for(var i=0;i<26;i++) {
        self._.buttons[i].setContent(self.shift?Keys[0][i].toUpperCase():Keys[0][i]);
      }
      if (options.compact && self.shift) for(i in Keys[1]) self._.buttons[26+Number(i)].setContent(Keys[2][i]);
      if (options.compact && !self.shift) for(i in Keys[1]) self._.buttons[26+Number(i)].setContent(Keys[1][i]);
      if (self.shift && options.nlButton) self._.delete.setContent(options.nlButton);
      else if (!self.shift && options.nlButton) self._.delete.setContent(options.delButton||'DEL');
      self.screen.render();
  });
  this._.delete = new Button({
      screen: this.screen,
      parent: this,
      top: bbox.height-3,
      height: 1,
      left: int(bbox.width/2)+(options.compact?0:int(options.margin.x)),
      width: (options.delButton && options.delButton.length+2)||6,
      content: options.delButton||'DEL',
      align: 'center',
      autoFocus: false,
      mouse: true
  });
  this._.delete.on('press',function () {
    var line=self._.input.getValue();
    if (!self.shift || !options.nlButton) {
      // Delete last character
      self._.input.setValue(line.substring(0,line.length-1));
    } else if (self.shift && options.nlButton) {
      // Insert newline
      self._.input.setValue(line+'\n');
    }
    //self.screen.render();
    self._.input.update();
  });
  
  this._.input =  new TextBox({
      parent: this,
      value: options.value||'content',
      width: bbox.width-4,
      height: 1,
      left: 1,
      top: 0,
      style: {
        fg:(options.style.input&&options.style.input.fg)||'black',
        bg:(options.style.input&&options.style.input.bg)||'white',
        bold:true
      }
  });
  y=1+options.margin.y;
  
  i=0;
  while ((options.compact?i<complen:true) && keys[i] && y < (bbox.height-options.button.height-options.margin.y)-1) {
    x=options.margin.x;
    while ((options.compact?i<complen:true) && keys[i] && x < (bbox.width-options.button.width-options.margin.x)) {
      function make(i) {
        key = new Button ({
          screen: self.screen,
          parent: self,
          top: y,
          height: options.button.height,
          left: x,
          width: options.button.width,
          content: keys[i],
          align: 'center',
          autoFocus: false,
          mouse: true
        });
        self._.buttons.push(key);
        key.on('press',function () {self.emit('key',i)});
      }
      make(i);
      i++,x += (options.button.width+options.margin.x);
    }
    y += (options.button.height+options.margin.y);
  }
  // Save clickable elements of this widget; restore screen
  this.clickable=this.screen.clickable;
  this.screen.clickable=this._clickable;

  this._hide=this.hide;
  this.hide = function() {
    self._hide();
    self.screen.render();
    // restore all clickable elements
    self.screen.clickable=self._clickable;
  } 
  this._show = this.show;
  this.show = function() {
    // save all screen clickable elements; enable only this clickables
    self._clickable=self.screen.clickable;
    self.screen.clickable=self.clickable;
    self._show();
    self.screen.render();
  }
  this.on('key',function (index) {
    var line=self._.input.getValue(),ch;
    if (options.compact) {
      if (index<26) {
        ch=self.shift?Keys[0][index].toUpperCase():Keys[0][index];
      } else {
        ch=self.shift?Keys[2][index-26]:Keys[1][index-26];
      }
    } else {
      if (!self.shift || index>26) ch = keys[index];
      else ch = keys[index].toUpperCase();
    }
    line += ch;
    self._.input.setValue(line);
    //self.screen.render();
    self._.input.update();
  });
}

//Question.prototype.__proto__ = Box.prototype;
inheritPrototype(Keyboard,Box);

Keyboard.prototype.setCallback = function (cb) {
  this._.callback=cb
}

Keyboard.prototype.setValue = function (line) {
  this._.input.setValue(line);
  this._.input.update();
}

Keyboard.prototype.type = 'keyboard';
/**
 * Expose
 */

module.exports = Keyboard;
