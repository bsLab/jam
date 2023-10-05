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
 **    $REVESIO:     1.5.2
 **
 **    $INFO:
 **
 **    terminal.js - interactive terminal shell based on textarea element for blessed
 **
 **    events: 'eval' (high level passing command line after enter key was hit)
 ** 
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

/**
 * Terminal
 */

function Terminal(options) {
  var self = this;

  if (!instanceOf(this,Node)) {
    return new Terminal(options);
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
  this.history=[];
  this.historyTop=0;
  this.break='all';
  
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

//Terminal.prototype.__proto__ = Input.prototype;
inheritPrototype(Terminal,Input);

Terminal.prototype.type = 'terminal';

Terminal.prototype._updateCursor = function(get) {
  if (this.screen.focused !== this) {
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

Terminal.prototype.input =
Terminal.prototype.setInput =
Terminal.prototype.readInput = function(callback) {
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

// Print ONE line (call mutiple times for multi-line text). Auto wrapping is supprted, though.
Terminal.prototype.print = function (line) {
// Log(this.inputRange,this._clines.length); 
  var offsetY = this.childBase||0,
      cn1 = this._clines.length, y0=this.inputRange.y0,
      start = this.getLinearPos(this.value,offsetY+this.inputRange.y0,0),
      end   = this.getLinearPos(this.value,offsetY+this.inputRange.y1,
                                this._clines[offsetY+this.inputRange.y1].length);
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
}

Terminal.prototype._listener = function(ch, key) { 
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

  
  if (key.name === 'return') return;
  if (key.name === 'enter') {
// Log(this._clines)
    // clear input line; execute command; create new input line
    var start = this.getLinearPos(this.value,offsetY+this.inputRange.y0,0),
        end   = this.getLinearPos(this.value,offsetY+this.inputRange.y1,
                                  this._clines[offsetY+this.inputRange.y1].length);
    var command = this.value.slice(start+this.prompt.length,end);
    this.value=this.value.slice(0,start)+this.prompt+this.value.slice(end);
    if (command && command != this.history[this.historyTop-1])  {  
      this.history.push(command);
      this.historyTop=this.history.length;
    }
    this.screen.render();
    offsetY = this.childBase||0;
    self.cpos.y += 10;  // bottom
    this._updateCursor(true);
    this.cpos.x=self._clines[offsetY+self.cpos.y].length;
    this.inputRange.y0=this.inputRange.y1=this.cpos.y; this.inputRange.last=0;
    this.emit('eval',command);
    return;
  }
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
  } else if (!controlkey && ch) {
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
  }

  var rmline=this.cpos.x==-1;
  this.inputRange.line = this._clines.rtof[offsetY+this.cpos.y];
// Log(this.cpos,  this.inputRange);
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
// Log(this.cpos,this.inputRange,linelength1,linelength2,cn0,cn2,this.inputRange,lastline,lastchar,endofline);
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
  }
  
};

// Return start position of nth (c)line in linear value string 
Terminal.prototype.getLinearPos = function(v,clineIndex,cposx) {
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


  // clineIndex is the index in the _clines array, cposx the cursor position in this line!
  var vpos=0,len=v.length,cline,clinePos=0,clineNum=0;
  cline=this._clines[clineNum];
  // To support auto line wrapping the clines have to be parsed, too!
  while (vpos < len && clineIndex) {
    if (v.charAt(vpos)=='\n') {
        clinePos=-1;
        clineIndex--;
        clineNum++;
        cline=this._clines[clineNum];
    } else {
      if (v.charAt(vpos) != cline.charAt(clinePos)) {
        // 
        clinePos=0;
        clineIndex--;
        clineNum++;
        cline=this._clines[clineNum];
        continue;
      }
    }
    vpos++; clinePos++;
  }
  if (clineIndex==0) return vpos+cposx;
  else 0
}

Terminal.prototype._typeScroll = function() {
  // XXX Workaround
  var height = this.height - this.iheight;
  // Scroll down?
// if (typeof Log != 'undefined') Log(this.childBase,this.childOffset,this.cpos.y,height);
  //if (this._clines.length - this.childBase > height) {
  if (this.cpos.y == height) {
    this.scroll(this._clines.length);
  }
};

Terminal.prototype.getValue = function() {
  return this.value;
};

Terminal.prototype.setValue = function(value) {
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

Terminal.prototype.clearInput =
Terminal.prototype.clearValue = function() {
  return this.setValue('');
};

Terminal.prototype.submit = function() {
  if (!this.__listener) return;
  return this.__listener('\x1b', { name: 'escape' });
};

Terminal.prototype.cancel = function() {
  if (!this.__listener) return;
  return this.__listener('\x1b', { name: 'escape' });
};

Terminal.prototype.render = function() {
  this.setValue();
  return this._render();
};

Terminal.prototype.editor =
Terminal.prototype.setEditor =
Terminal.prototype.readEditor = function(callback) {
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

module.exports = Terminal;
