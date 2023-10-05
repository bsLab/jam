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
 **    $MODIFIED:    by sbosse (2017-2021)
 **    $REVESIO:     1.5.7
 **
 **    $INFO:
 **
 **    chat.js - interactive chat terminal shell based on textarea element for blessed
 **
 **    events: 'eval' (high level passing command line after enter key was hit)
 ** 
 **    public methods:
 **
 **     print(string)
 **     ask(ask,options,callback)
 **
 **     typeof options = { choices? : string [], mutual?: boolean,
 **                        range? : [number,number], 
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var unicode = Require('term/unicode');

var nextTick = global.setImmediate || process.nextTick.bind(process);

var Node = Require('term/widgets/node');
var Input = Require('term/widgets/input');

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}
/**
 * Chat
 */

function Chat(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Chat(options);
  }

  options = options || {};

  options.scrollable = options.scrollable !== false;

  Input.call(this, options);

  this.screen._listenKeys(this);

  this.value = options.value || '';
  // cursor position
  this.cpos = {x:-1,y:-1};
  this.cursorControl=true;
  this.multiline=options.multiline;
  this.tags=true;   // we need formatting tag support
  this.input='text';  

  this.history=[];
  this.historyTop=0;
  
  this.__updateCursor = this._updateCursor.bind(this);
  this.on('resize', this.__updateCursor);
  this.on('move', this.__updateCursor);

  if (options.inputOnFocus) {
    this.on('focus', this.readInput.bind(this, null));
  }

  if (!options.inputOnFocus && options.keys) {
    this.on('keypress', function(ch, key) {
      if (self._reading) return;
      if (key.name === 'enter' || (options.vi && key.name === 'i')) {
        return self.readInput();
      }
      if (key.name === 'e') {
        return self.readEditor();
      }
    });
  }

  if (options.mouse) {
    this.on('click', function(data) {
      if (self._reading) return;
      if (data.button !== 'right') return;
      self.readEditor();
    });
  }
  
  var offsetY = 0;
  if (this._clines) offsetY=this._clines.length-(this.childBase||0);
  if (options.prompt) {
    this.value=options.prompt;
    this.prompt=options.prompt;
    this.inputRange={x0:options.prompt.length,y0:offsetY,y1:offsetY,last:0,line:0};
  } else {
    this.inputRange={x0:0,y0:offsetY,y1:offsetY,last:0,line:0};
    this.prompt='';
  }
}

//Chat.prototype.__proto__ = Input.prototype;
inheritPrototype(Chat,Input);

Chat.prototype.type = 'terminal';


Chat.prototype._updateCursor = function(get) {
  var offsetY=this.childBase||0;
  if (this.screen.focused !== this) {
    // at least update cursor to its bound
    this.cpos.y=Math.min(this._clines.length - 1 - offsetY,this.cpos.y);
    return;
  }
  var lpos = get ? this.lpos : this._getCoords();
  if (!lpos) return;

  var last = this._clines[this._clines.length - 1]
    , program = this.screen.program
    , line
    , offsetY = this.childBase||0
    , cx
    , cy;

  // Stop a situation where the textarea begins scrolling
  // and the last cline appears to always be empty from the
  // _typeScroll `+ '\n'` thing.
  // Maybe not necessary anymore?
  if (last === '' && this.value[this.value.length - 1] !== '\n') {
    last = this._clines[this._clines.length - 2] || '';
  }

  line = Math.min(
    this._clines.length - 1 - (this.childBase || 0),
    (lpos.yl - lpos.yi) - this.iheight - 1);

  // When calling clearValue() on a full textarea with a border, the first
  // argument in the above Math.min call ends up being -2. Make sure we stay
  // positive.
  line = Math.max(0, line);
  
  if (this.cpos.x==-1 || !this.cursorControl) this.cpos.x = this.strWidth(last);
  if (this.cpos.y==-1 || !this.cursorControl) this.cpos.y = line;
  this.cpos.y = Math.min(this.cpos.y,line);
  this.cpos.x = Math.min(this.cpos.x,this.strWidth(this._clines[offsetY+this.cpos.y]));
    
  cx = lpos.xi + this.ileft + this.cpos.x;
  cy = lpos.yi + this.itop + this.cpos.y;

  // XXX Not sure, but this may still sometimes
  // cause problems when leaving editor.
  if (cy === program.y && cx === program.x) {
    return;
  }

  if (cy === program.y) {
    if (cx > program.x) {
      program.cuf(cx - program.x);
    } else if (cx < program.x) {
      program.cub(program.x - cx);
    }
  } else if (cx === program.x) {
    if (cy > program.y) {
      program.cud(cy - program.y);
    } else if (cy < program.y) {
      program.cuu(program.y - cy);
    }
  } else {
    program.cup(cy, cx);
  }
};

Chat.prototype.input =
Chat.prototype.setInput =
Chat.prototype.readInput = function(callback) {
  var self = this
    , focused = this.screen.focused === this;

  if (this._reading) return;
  this._reading = true;

  this._callback = callback;

  if (!focused) {
    this.screen.saveFocus();
    this.focus();
  }

  this.screen.grabKeys = true;

  this._updateCursor();
  this.screen.program.showCursor();
  //this.screen.program.sgr('normal');

  this._done = function fn(err, value) {
    if (!self._reading) return;

    if (fn.done) return;
    fn.done = true;

    self._reading = false;

    delete self._callback;
    delete self._done;

    self.removeListener('keypress', self.__listener);
    delete self.__listener;

    self.removeListener('blur', self.__done);
    delete self.__done;

    self.screen.program.hideCursor();
    self.screen.grabKeys = false;

    if (!focused) {
      self.screen.restoreFocus();
    }

    if (self.options.inputOnFocus) {
      self.screen.rewindFocus();
    }

    // Ugly
    if (err === 'stop') return;

    if (err) {
      self.emit('error', err);
    } else if (value != null) {
      self.emit('submit', value);
    } else {
      self.emit('cancel', value);
    }
    self.emit('action', value);

    if (!callback) return;

    return err
      ? callback(err)
      : callback(null, value);
  };

  // Put this in a nextTick so the current
  // key event doesn't trigger any keys input.
  nextTick(function() {
    if (self.__listener) {
      // double fired?
      return;
    }
    self.__listener = self._listener.bind(self);
    self.on('keypress', self.__listener);
  });

  this.__done = this._done.bind(this, null, null);
  this.on('blur', this.__done);
};

// Ask request
Chat.prototype.ask = function (message,options,callback) {
  var offsetY = this.childBase||0,
      prompt = this.prompt,
      self=this;
  options=options||{};
  if (this.request) {
    // pending request; queue new request
    return;
  }
  // restore point
  var restorePos = offsetY+this.cpos.y;
  
  function ask(command,restore) {
    offsetY = self.childBase||0;
    var start = self.getLinearPos(self.value,offsetY+self.inputRange.y0,0),
        end   = self.getLinearPos(self.value,offsetY+self.inputRange.y1,
                                  self._clines[offsetY+self.inputRange.y1].length);
    var line; 
    if (restore) start=self.getLinearPos(self.value,restorePos,0);
    self.value=self.value.slice(0,start)+self.prompt+command+self.value.slice(end);
    self.screen.render();
    self.scrollBottom();
    self.cpos.x=self._clines[self._clines.length-1].length;
    self.cpos.y += 10; // bottom
    self._updateCursor(true);
    self.inputRange.y1=self.cpos.y;
    offsetY = self.childBase||0;
    // find start y
    var y0=self.cpos.y; 
// Log(self.cpos,offsetY,y0);
    self.inputRange.x0=self.prompt.length;
    self.inputRange.x1=null;

    while (self._clines[offsetY+y0].indexOf(self.prompt)!=0) y0--;
    self.inputRange.y0=y0; 
    self.inputRange.last=self.inputRange.y1-self.inputRange.y0;
  }

  this.print('{bold}'+message+'{/bold}');
  
  // choices
  if (options.choices) {
    // form can be multiline
    var choices = options.choices.slice();
    // Make buttons (with click handler)
    this.prompt='? ';
    var delim   = options.layout=='vertical'?'\n':' ',
        indent  = options.layout=='vertical'?'  ':'';
        
    if (!options.mutable) {
      line=choices.map(function (s,i) { return (i>0?indent:'')+'[ ] '+s}).join(delim);
      line += (delim+indent+'[Ok] [Cancel]');
      choices.push(restore1); choices.push(restore1);
    } else {
      line=choices.map(function (s,i) { return (i>0?indent:'')+'['+s+']'}).join(delim);
      line += (delim+indent+'[Cancel]');
      choices.push(restore1);
    }

    ask(line);
    this.input='mouse';
    this.screen.program.hideCursor(true);

    // get selector positions, install clicked handler
    var y=this.inputRange.y0,x=this.inputRange.x0;

    line=this._clines[offsetY+y];
    var actions = choices.map(function (choice,index) {
      // find [ ]/[...] in _clines
      while (line[x] && line[x] != '[') {
        x++;
        if (!line[x] && y<self.inputRange.y1) {
          x=0;
          y++;
          line=self._clines[offsetY+y];
        }
      }
      if (line[x] && line[x+1]==' ') {
        x++;
        return { choice:choice, index:index, fake: self.getLinearPos(self.value, offsetY+y,x), pos:{x:x,y:y}};
      } else {
        x++;
        var start = { x:x,y:y };
        // find end
        while (line[x] && line[x] != ']') {
          x++;
          if (!line[x] && y<self.inputRange.y1) {
            x=0;
            y++;
            line=self._clines[offsetY+y];
          }
        }
        var end = { x:x-1,y:y }
        return typeof choice=='string'?{ choice:choice, index:index, pos:[start,end]}:
                                       { action:choice, index:index, pos:[start,end]}; 
      }
    });
// Log(actions)
    function clicked1(pos) {
      var offsetY=self.childBase||0;
      function within (o) {
        if (typeof o.x != 'undefined') {
          return pos.x==o.x && pos.y==o.y
        } else if (o.length==2) {
          if (o[0].y==o[1].y && o[0].y==pos.y)
            return pos.x>=o[0].x&&pos.x<=o[1].x;
          else if (pos.y>=o[0].y && pos.y<=o[1].y) // multi-line
            return pos.x>=o[0].x&&pos.x<=o[1].x
        }
      }
      actions.forEach(function (action) {
        if (!action) return;
        if (within(action.pos)) {
          // fired
          if (action.choice) {
            if (self.selected.indexOf(action.choice)!=-1) {
              // deselect
              self.selected=self.selected.filter(function (choice) { return choice!=action.choice });
              self.value=setCharAt(self.value,action.fake,' ');
              self.screen.render();
            } else {
              // select
              if (!options.mutable) {
                self.value=setCharAt(self.value,action.fake,'X');
                self.screen.render();
                changed1();
              }
              self.selected.push(action.choice);
              if (options.mutable) restore1();
            }
          }
          if (action.action) {
            action.action();
          }
        }
      })
    };
    function changed1() {
      if (options.timeout) {
        if (self.timer) clearTimeout(self.timer);
        self.timer=setTimeout(restore1,options.timeout);
      }
    }
    function restore1 (timeout) {
      var result = callback?callback(self.selected):null;    
      if (self.selected != undefined && self.selected.length) 
        self.print(self.selected.join(', '),self.style.user);
      if (result) self.print(result);
      // restore text line
      self.prompt=prompt;
      ask('',!result && self.selected.length==0);
      self.input='text';
      self.removeListener('clicked',clicked1);
      if (!timeout && self.timer) clearTimeout(self.timer);
      self.timer=null;
      self.request=null;
    }
    this.on('clicked',clicked1);
    this.selected=[];
    if (options.timeout) {
      this.timer=setTimeout(restore1,options.timeout);
    }
  } 
  
  // range //
  if (options.range) {
    // assumption: entire form fits in one ine
    var sign=options.range[0]<0,
        step=options.step||1,
        digits = Math.floor(Math.log10(options.range[1]-options.range[0]+1))+1;
    if (sign) digits++;
    var value=options.default||options.value||options.range[0];
    line = '[-] '+Comp.printf.sprintf("%"+digits+"d",value)+' [+] [Ok] [Cancel]';
    this.prompt='? ';
    ask(line);
    var x0=this._clines[offsetY+this.cpos.y].indexOf('[-] ')+4;
    var x1=this._clines[offsetY+this.cpos.y].indexOf(' [+]')-1;
    this.cpos.x=x1;
    this.inputRange.x0=x0;
    this.inputRange.x1=x1;
    this.inputRange.right=true;
    this.inputRange.action=function () {
        var _value = Number(self._clines[offsetY+self.cpos.y].slice(x0,x1+1));
        if (_value>= options.range[0] && _value<= options.range[1]) {
          self.selected=value;
          restore2();
        } else {
          // invalid; try again
          value=options.range[0];
          line = '[-] '+Comp.printf.sprintf("%"+digits+"d",value)+' [+] [Ok] [Cancel]';
          ask(line);
          self.inputRange.x0=x0;
          self.inputRange.x1=x1;
          self.cpos.x=x1;
          self._updateCursor();
        }    
    }
    this._updateCursor();
    actions=[
      {pos:{x:this._clines[offsetY+this.cpos.y].indexOf('[-]')+1,y:this.cpos.y},action:function () {
        // decrease value
        value=Math.max(options.range[0],value-step);
        line = '[-] '+Comp.printf.sprintf("%"+digits+"d",value)+' [+] [Ok] [Cancel]';
        ask(line);
        self.inputRange.x0=x0;
        self.inputRange.x1=x1;
        self.cpos.x=x1;
        self._updateCursor();
      }},
      {pos:{x:this._clines[offsetY+this.cpos.y].indexOf('[+]')+1,y:this.cpos.y},action:function () {
        // increase value
        value=Math.min(options.range[1],value+step);
        line = '[-] '+Comp.printf.sprintf("%"+digits+"d",value)+' [+] [Ok] [Cancel]';
        ask(line);
        self.inputRange.x0=x0;
        self.inputRange.x1=x1;
        self.cpos.x=x1;
        self._updateCursor();
      }},
      {pos:[{x:this._clines[offsetY+this.cpos.y].indexOf('[Ok]')+1,y:this.cpos.y},
            {x:this._clines[offsetY+this.cpos.y].indexOf('[Ok]')+2,y:this.cpos.y}],action:function () {
        // Ok
        var _value = Number(self._clines[offsetY+self.cpos.y].slice(x0,x1+1));
        if (_value>= options.range[0] && _value<= options.range[1]) {
          self.selected=value;
          restore2();
        } else {
          // invalid; try again
          value=options.range[0];
          line = '[-] '+Comp.printf.sprintf("%"+digits+"d",value)+' [+] [Ok] [Cancel]';
          ask(line);
          self.inputRange.x0=x0;
          self.inputRange.x1=x1;
          self.cpos.x=x1;
          self._updateCursor();
        }
      }},
      {pos:[{x:this._clines[offsetY+this.cpos.y].indexOf('[Cancel]')+1,y:this.cpos.y},
            {x:this._clines[offsetY+this.cpos.y].indexOf('[Cancel]')+6,y:this.cpos.y}],action:function () {
        // Cancel
        restore2()
      }}
    ]
    function clicked2(pos) {
      var offsetY=self.childBase||0;
      function within (o) {
        if (typeof o.x != 'undefined') {
          return pos.x==o.x && pos.y==o.y
        } else if (o.length==2) {
          if (o[0].y==o[1].y && o[0].y==pos.y)
            return pos.x>=o[0].x&&pos.x<=o[1].x;
          else if (pos.y>=o[0].y && pos.y<=o[1].y) // multi-line
            return pos.x>=o[0].x&&pos.x<=o[1].x
        }
      }
      actions.forEach(function (action) {
        if (!action) return;
        if (within(action.pos)) action.action ();
      })
    }
    function changed2() {
      var _value = Number(self._clines[offsetY+self.cpos.y].slice(x0,x1+1));
      if (isNaN(_value) || _value < options.range[0] || _value > options.range[1]) {
      } else value=_value;
      if (options.timeout) {
        if (self.timer) clearTimeout(self.timer);
        self.timer=setTimeout(restore2,options.timeout);
      }
    }
    function restore2 (timeout) {
      var result = callback?callback(self.selected):null;
      if (self.selected != undefined) self.print(self.selected,self.style.user);
      if (result) self.print(result);
      // restore text line
      self.prompt=prompt;
      ask('',!result && self.selected == undefined);
      self.removeListener('clicked',clicked2);
      self.removeListener('modified',changed2);
      if (!timeout && self.timer) clearTimeout(self.timer);
      self.timer=null;
      self.inputRange.action=null;
      self.inputRange.right=null;
      self.request=null;
    }
    // this.on('clicked',clicked);
    this.selected=null;
    this.on('clicked',clicked2);
    this.on('modified',changed2);
    if (options.timeout) {
      this.timer=setTimeout(restore2,options.timeout);
    }
  }
  if (options.text) {
    this.selected=null;
    function changed3() {
      var offsetY=self.childBase||0,
          vpos = self.getLinearPos(self.value,offsetY+self.inputRange.y0,self.inputRange.x0);
      self.selected= value = self.value.slice(vpos,1000000);
      if (options.timeout) {
        if (self.timer) clearTimeout(self.timer);
        self.timer=setTimeout(restore3,options.timeout);
      }
    }
    function restore3 (timeout) {
      var result = callback?callback(self.selected):null;    
      if (self.selected != undefined) self.print(self.selected,self.style.user);
      if (result) self.print(result);
      // restore text line
      self.prompt=prompt;
      // Log(self.inputRange,self.value)
      ask('',!result && self.selected == undefined);
      self.removeListener('modified',changed3);
      if (!timeout && self.timer) clearTimeout(self.timer);
      self.timer=null;
      self.inputRange.action=null;
      self.request=null;
    }
    this.inputRange.action=function () {
      restore3()
    }
    this.on('modified',changed3);
    if (options.timeout) {
      this.timer=setTimeout(restore3,options.timeout);
    }  
  }
  this.request={message:message,options:options,callback:callback};
}


// Public API: Bot message
Chat.prototype.message = function (line,style) {
  return this.print(line,style||this.style.bot);
}

// Print ONE line (call mutiple times for multi-line text). Auto wrapping is supprted, though.
Chat.prototype.print = function (line,style) {
// Log(this.inputRange,this._clines.length); 
  var offsetY = this.childBase||0,
      cn1 = this._clines.length, y0=this.inputRange.y0,
      start = this.getLinearPos(this.value,offsetY+this.inputRange.y0,0),
      end   = this.getLinearPos(this.value,offsetY+this.inputRange.y1,
                                this._clines[offsetY+this.inputRange.y1].length);
//Log(this.cpos,this.inputRange,this.value)

  if (style) {
    if (style.color) line = '{'+style.color+'-fg}'+line+'{/'+style.color+'-fg}';
    if (style.align=='right') line = '{right}'+line+'{/right}';
  }
  
  var command = this.value.slice(start,end);
  this.value=this.value.slice(0,start)+line+'\n'+command+this.value.slice(end);
  this.screen.render();
  // Update inputRange
  var cn2= this._clines.length;
  this.scrollBottom();
  this.cpos.y += 10;
  this.cpos.x=this.inputRange.x0=this.prompt.length;
  this._updateCursor(true);
  this.inputRange.y0=Math.min(this._clines.length-1,this.cpos.y-this.inputRange.last);
  this.inputRange.y1=Math.min(this._clines.length-1,this.cpos.y);
// Log(this.cpos,this.inputRange,this.value)
}

Chat.prototype._listener = function(ch, key) { 
  // Cursor position must be synced with scrollablebox and vice versa (if scrollable)! A real mess.
  var done = this._done
    , self = this
    , value = this.value
    , clinesLength=this._clines.length
    , offsetY = this.childBase||0 // scrollable line offset if any
    , newline = false
    , lastchar = false
    , backspace = false
    , controlkey = false
    , lastline = (this.cpos.y+offsetY+1) == clinesLength;

// Log(key)  
  if (key.name === 'return') return;
  if (key.name === 'delete') {
    if (this.inputRange.x1 != undefined) {
      // ranged edit
      vpos=this.getLinearPos(this.value,offsetY+this.cpos.y, this.cpos.x);
        // shift right x0..x1 text, delete current char at this position
        var vpos0 = vpos-(this.cpos.x-this.inputRange.x0);
        this.value = this.value.substr(0,vpos0)+' '+
                     this.value.substr(vpos0,vpos-vpos0)+
                     this.value.substr(vpos+1,1000000);
        this.screen.render();
    }
    return;
  }
  if (key.name === 'enter') {
// Log(this._clines)
    if (this.inputRange.action) return this.inputRange.action();
    // clear input line; execute command; create new input line
    var start = this.getLinearPos(this.value,offsetY+this.inputRange.y0,0),
        end   = this.getLinearPos(this.value,offsetY+this.inputRange.y1,
                                  this._clines[offsetY+this.inputRange.y1].length);
// Log(this.inputRange,start,end,this.value,this._clines[0])
    var command = this.value.slice(start+this.prompt.length,end);
    if (command && command != this.history[this.historyTop-1])  {  
      this.history.push(command);
      this.historyTop=this.history.length;
    }
    this.value=this.value.slice(0,start)+this.prompt+this.value.slice(end);
    this.screen.render();
    offsetY = this.childBase||0;
    self.cpos.y += 10;  // bottom
    this._updateCursor(true);
    this.cpos.x=self._clines[offsetY+self.cpos.y].length;
    this.inputRange.y0=this.inputRange.y1=this.cpos.y; this.inputRange.last=0;
    this.print(command,this.style.user);
    this.emit('eval',command);
    return;
  }
  if (this.input!='text') return;


  function history(delta) {
    if (self.historyTop+delta<0 ) return self.scrollBottom();
    self.historyTop += delta;
    var start = self.getLinearPos(self.value,offsetY+self.inputRange.y0,0),
        end   = self.getLinearPos(self.value,offsetY+self.inputRange.y1,
                                  self._clines[offsetY+self.inputRange.y1].length);
    var command = self.history[self.historyTop]||'';
    self.historyTop = Math.min(Math.max(0,self.historyTop),self.history.length);
    self.value=self.value.slice(0,start)+self.prompt+command+self.value.slice(end);
    self.screen.render();
    self.scrollBottom();
    self.cpos.x=self._clines[self._clines.length-1].length;
    self.cpos.y += 10; // bottom
    self._updateCursor(true);
    self.inputRange.y1=self.cpos.y;
    offsetY = self.childBase||0;
    // find start y
    var y0=self.cpos.y; while (self._clines[offsetY+y0].indexOf(self.prompt)!=0) y0--;
    self.inputRange.y0=y0; 
    self.inputRange.last=self.inputRange.y1-self.inputRange.y0;
  }

  // Handle cursor positiong by keys.
  if (this.cursorControl) switch (key.name) {
    case 'left':
      controlkey=true;
      if (this.cpos.y==this.inputRange.y0 && this.cpos.x>this.inputRange.x0) this.cpos.x--;
      else if (this.cpos.y!=this.inputRange.y0 && this.cpos.x>0) this.cpos.x--;
      else if (this.cpos.y!=this.inputRange.y0 && this.cpos.x==0) {
        this.cpos.y--;
        this.cpos.x=this._clines[offsetY+this.cpos.y].length;
      }
      this._updateCursor(true);
      break;
    case 'right':
      controlkey=true;
      if (this.inputRange.x1 != undefined && this.cpos.x>=this.inputRange.x1) return;
      if (this.cpos.y>=this.inputRange.y0 && this.cpos.y<=this.inputRange.y1 && 
          this.cpos.x<this._clines[offsetY+this.cpos.y].length-1) {
        this.cpos.x++;
      } else if (this.cpos.y>=this.inputRange.y0 && this.cpos.y<this.inputRange.y1 && 
          this.cpos.x==this._clines[offsetY+this.cpos.y].length-1) {
        this.cpos.x=0;
        this.cpos.y++;
      } else if (this.cpos.y>=this.inputRange.y0 && this.cpos.y==this.inputRange.y1 && 
          this.cpos.x<this._clines[offsetY+this.cpos.y].length) {
        this.cpos.x++;
      }
      this._updateCursor(true);
      break;
    case 'up':
      controlkey=true;
      history(-1);
      return;
      break;
    case 'down':
      controlkey=true;
      history(1);
      return;
      break;
  }
  

  if (this.options.keys && key.ctrl && key.name === 'e') {
    return this.readEditor();
  }
  // Challenge: sync with line wrapping and adjust cursor and scrolling (done in element._wrapContent)
  
  // TODO: Optimize typing by writing directly
  // to the screen and screen buffer here.
  if (key.name === 'escape') {
    done(null, null);
  } else if (key.name === 'backspace') {
    backspace=true;
    if (this.cpos.y==this.inputRange.y0 && this.cpos.x<=this.inputRange.x0) return;
    if (this.inputRange.x1 != undefined) {
      // ranged edit
      vpos=this.getLinearPos(this.value,offsetY+this.cpos.y, this.cpos.x);
        // shift right x0..x1 text, delete current char at this position
      var vpos0 = vpos-(this.cpos.x-this.inputRange.x0);
      this.value = this.value.substr(0,vpos0)+' '+
                     this.value.substr(vpos0,vpos-vpos0)+
                     this.value.substr(vpos+1,1000000);
      this.screen.render();
      return;
    }
    if (this.value.length) {
      if (this.screen.fullUnicode) {
        if (unicode.isSurrogate(this.value, this.value.length - 2)) {
        // || unicode.isCombining(this.value, this.value.length - 1)) {
          this.value = this.value.slice(0, -2);
        } else {
          this.value = this.value.slice(0, -1);
        }
      } else {
        if (!this.cursorControl || 
             this.cpos.x==-1 ||
             (this.cpos.x==this._clines[offsetY+this.cpos.y].length &&
              this.cpos.y==this._clines.length-1-offsetY)) {
          // Delete last char of last line
          this.value = this.value.slice(0, -1);
        } else {
          // Delete char at current cursor position
          vpos=this.getLinearPos(this.value,offsetY+this.cpos.y, this.cpos.x);
          // vpos+= this.cpos.x;
          this.value = this.value.substr(0,vpos-1)+
                       this.value.substr(vpos,1000000);
        }
      }
      if (this.cpos.x>0) this.cpos.x--;
      else {this.cpos.x=-1; if (offsetY==0 && this.cpos.y>0 && lastline) this.cpos.y--; };
    }
  } else if (!controlkey && ch && this.inputRange.x1==undefined) {
    if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
      if (!this.cursorControl || 
           this.cpos.x==-1 ||
           (this.cpos.x==this._clines[offsetY+this.cpos.y].length &&
            this.cpos.y==this._clines.length-1-offsetY)) {
        // Append new char at end of (last) line
        lastchar=true;
        this.value += ch;
      } else {
        // Insert new char into line at current cursor position
        vpos=this.getLinearPos(this.value,offsetY+this.cpos.y, this.cpos.x);
        // vpos+= this.cpos.x;
        this.value = this.value.substr(0,vpos)+ch+
                     this.value.substr(vpos,1000000);
      }
      if (newline) {
        this.cpos.x=0;    // first left position is zero!
        this.cpos.y++;
      } else
        this.cpos.x++;
    }
  } else if (!controlkey && ch && this.inputRange.x1!=undefined) {
    // Range Edit (e.g., numerical form field)
    //////////////
    // shift or overwrite mode in limited char range (e.g., range selector)
    if (!/^[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]$/.test(ch)) {
      vpos=this.getLinearPos(this.value,offsetY+this.cpos.y, this.cpos.x);
      if (this.cpos.x!=this.inputRange.x1) {
        // Replace new char into line at current cursor position
        // vpos+= this.cpos.x;
        this.value = setCharAt(this.value,vpos,ch);
      } else {
        // shift left x0..x1 text, insert new char at right position
        var vpos0 = vpos-(this.inputRange.x1-this.inputRange.x0);
        this.value = this.value.substr(0,vpos0)+
                     this.value.substr(vpos0+1,vpos-vpos0)+ch+
                     this.value.substr(vpos+1,1000000);
        
      }
      if (this.cpos.x < this.inputRange.x1) this.cpos.x++;
    }
  }

  var rmline=this.cpos.x==-1;
  // TODO: clean up this mess; use rtof and ftor attributes of _clines
  // to determine where we are (react correctly on line wrap extension and reduction)
  if (this.value !== value) {
    var cn0=clinesLength,
        endofline=this.cpos.x==this._clines[offsetY+this.cpos.y].length+1,
        cn1=this._clines.length;
    var linelength1=this._clines[offsetY+this.cpos.y] && this._clines[offsetY+this.cpos.y].length;
    this.screen.render();
    var linelength2=this._clines[offsetY+this.cpos.y] && this._clines[offsetY+this.cpos.y].length;
    var cn2=this._clines.length;
// Log(this.cpos,linelength1,linelength2,cn0,cn2,this.inputRange,lastline,lastchar,endofline);
// Log('L',this.cpos,lastline,lastchar,endofline,linelength1,linelength2);
    if (cn2>cn0 && endofline) {
      this.scrollBottom();
      // wrap expansion
      this.cpos.y++; 
      this.inputRange.last++;
      if (this._clines[offsetY+this.cpos.y] && lastchar) this.cpos.x=this._clines[offsetY+this.cpos.y].length;
      else this.cpos.x=linelength1-linelength2-1;
      this._updateCursor(true);
      this.inputRange.y0=this.cpos.y-this.inputRange.last;
      this.inputRange.y1=this.cpos.y;
    } else if (cn2<cn0 && !rmline) { 
      // wrap reduction
      if (this.cpos.y>0 && !lastline && lastchar) this.cpos.y--;
      this.inputRange.last--;
      if (this._clines[offsetY+this.cpos.y]) this.cpos.x=this._clines[offsetY+this.cpos.y].length;
      this._updateCursor(true);
      this.inputRange.y0=this.cpos.y-this.inputRange.last;
      this.inputRange.y1=this.cpos.y;
      offsetY = this.childBase||0;
      this.cpos.x=this._clines[offsetY+this.cpos.y].length;
      this._updateCursor(true);
    } else if (linelength2<linelength1 && !backspace) {
      // wrap shift
      this.cpos.y++; 
      this.cpos.x=linelength1-linelength2;
      this._updateCursor(true);
    }
    if (offsetY>0 && backspace) {
      // @fix line deleted; refresh again due to miscalculation of height in scrollablebox!
      this.scroll(0);
      this.screen.render();
      if (rmline) {
        if (this._clines[offsetY+this.cpos.y]) this.cpos.x=this._clines[offsetY+this.cpos.y].length;
        else if (this._clines[offsetY+this.cpos.y-1]) this.cpos.x=this._clines[offsetY+this.cpos.y-1].length;
        this._updateCursor(true);
      }
    }
    this.emit('modified');
  }
  
};

// Return start position of nth (c)line in linear value string 
Chat.prototype.getLinearPos = function(v,clineIndex,cposx) {
  var lines=v.split('\n'),
      line=this._clines[clineIndex], // assuming search in plain text line (no ctrl/spaces aligns)
      flinenum=this._clines.rtof[clineIndex],
      vpos=flinenum>0?
           lines.slice(0,flinenum)
                .map(function (line) { return line.length+1 })
                .reduce(function (a,b) { return a+b }):0;
// console.log(clineIndex,lines.length,flinenum,lines[flinenum],line);
  // TODO: search from a start position in line estimated by _clines.ftor array
  function search(part,line) {
    // assuming search offset in plain text line (no ctrl/spaces aligns)
    var i=line.indexOf(part);
    if (i==-1) return 0;
    else return i;
  }
  if (lines[flinenum]) {
    return vpos+search(line,lines[flinenum])+cposx;
  } else
    return vpos+cposx;
}

Chat.prototype._typeScroll = function() {
  // XXX Workaround
  var height = this.height - this.iheight;
  // Scroll down?
// if (typeof Log != 'undefined') Log(this.childBase,this.childOffset,this.cpos.y,height);
  //if (this._clines.length - this.childBase > height) {
  if (this.cpos.y == height) {
    this.scroll(this._clines.length);
  }
};

Chat.prototype.getValue = function() {
  return this.value;
};

Chat.prototype.setValue = function(value) {
  if (value == null) {
    value = this.value;
  }
  if (this._value !== value) {
    this.value = value;
    this._value = value;
    this.setContent(this.value);
    this._typeScroll();
    this._updateCursor();
  }
};

Chat.prototype.clearInput =
Chat.prototype.clearValue = function() {
  return this.setValue('');
};

Chat.prototype.submit = function() {
  if (!this.__listener) return;
  return this.__listener('\x1b', { name: 'escape' });
};

Chat.prototype.cancel = function() {
  if (!this.__listener) return;
  return this.__listener('\x1b', { name: 'escape' });
};

Chat.prototype.render = function() {
  this.setValue();
  return this._render();
};

Chat.prototype.editor =
Chat.prototype.setEditor =
Chat.prototype.readEditor = function(callback) {
  var self = this;

  if (this._reading) {
    var _cb = this._callback
      , cb = callback;

    this._done('stop');

    callback = function(err, value) {
      if (_cb) _cb(err, value);
      if (cb) cb(err, value);
    };
  }

  if (!callback) {
    callback = function() {};
  }

  return this.screen.readEditor({ value: this.value }, function(err, value) {
    if (err) {
      if (err.message === 'Unsuccessful.') {
        self.screen.render();
        return self.readInput(callback);
      }
      self.screen.render();
      self.readInput(callback);
      return callback(err);
    }
    self.setValue(value);
    self.screen.render();
    return self.readInput(callback);
  });
};

/**
 * Expose
 */

module.exports = Chat;
