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
 **    $INITIAL:     (C) 2013-2018, Christopher Jeffrey and contributors
 **    $VERSION:     1.4.2
 **
 **    $INFO:
 *
 * filemanager.js - file manager element for blessed
 *  
 * Events: 'ioerror','cd','file'
 *
 * New options: okayButton, cancelButton, autohide, select (select emits file event),
 *              noshow, arrows: {up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}},
 *              box:{bg,border}, input:{fg,bg,border}
 *
 **    $ENDOFINFO
 */

var options = {
  version:'1.4.2'
}
/**
 * Modules
 */
var Comp = Require('com/compat');

var path = Require('path')
  , fs = Require('fs');


var Node = Require('term/widgets/node');
var List = Require('term/widgets/list');
var Button = Require('term/widgets/button');
var Helpers = Require('term/helpers');
var Box = Require('term/widgets/box');
var TextBox = Require('term/widgets/textbox');
var Arrows = Require('term/widgets/arrows');
var Screen = Require('term/widgets/screen');

/**
 * FileManager
 */

function FileManager(options) {
  var self = this,
      bbox,
      off1=0,
      off2=0,
      arrows=options.arrows;

  if (!instanceOf(this,Node)) {
    return new FileManager(options);
  }

  options = options || {};
  options.parseTags = true;
  options.mouse = true;
  options.arrows=_;   // optional arrows are handled here, not in list

  if (options.parent == Screen.global) {
    // Screen overlay; adjust top/height settings
    bbox=Helpers.bbox(Screen.global,options);
    if (options.box) bbox.top += 1,bbox.height -= 2,bbox.width -= 4,bbox.left += 2;
    if (options.input) bbox.height -= 3;
    if (options.cancelButton||options.okayButton) bbox.height -= 1;
    if (arrows) bbox.width -= 4,bbox.left += 2;
    options.top=bbox.top;
    options.left=bbox.left;
    options.height=bbox.height;
    options.width=bbox.width;
  }
      
  // options.label = ' {blue-fg}%path{/blue-fg} ';
  List.call(this, options);

  options.arrows=arrows;
  
  this.cwd = options.cwd || process.cwd();
  this.file = this.cwd;
  this.value = this.cwd;
  this.noshow = options.noshow;
  
  if (options.parent == this.screen) {
    // Collect clickable elements of this widget
    this._clickable=this.screen.clickable;
    this.screen.clickable=[];
    
    // compute for button positions
    bbox=Helpers.bbox(this.screen,options);
    if (options.cancelButton||options.okayButton) off1=2;
    if (options.input) off2=3;
    if (options.box) 
      this._.box = new Box({
        top:bbox.top-2,
        width:bbox.width+8,
        left:bbox.left-4,
        height:bbox.height+3+off1+off2,
        hidden:options.hidden,
        border:options.box.border,
        style:{
          label:options.label,
          fg:options.box.fg,
          bg:options.box.bg||'white'
        }
      });
    if (this._.box) this.screen.append(this._.box);

    if (options.input) {
      this._.input =  new TextBox({
        screen: this.screen,
        top: bbox.top+bbox.height+(options.box?1:0)-1,
        height: options.input.border&&options.input.border.type=='line'?3:1,
        width: bbox.width,
        left: bbox.left,
        keys: options.input.mutable?true:undefined,
        vi: options.input.mutable?true:undefined,
        mouse: options.input.mutable?true:undefined,
        inputOnFocus: options.input.mutable?true:undefined,
        value: options.input.value||'<input>',
        hidden:options.hidden,
        border: options.input.border,
        style: {
          fg:options.input.fg||'black',
          bg:options.input.bg||'white',
          bold:true
        }
      });
      this.screen.append(this._.input);
    }
    
    if (options.okayButton) {
      this._.okay = new Button({
        screen: this.screen,
        top: bbox.top+bbox.height+(options.box?1:0)+off2,
        height: 1,
        left: bbox.left+1,
        width: 10,
        content: options.okayButton,
        align: 'center',
        style: {
          fg:'white',
          bg: 'blue',
          bold:true,
        },
        autoFocus: false,
        hidden:options.hidden,
        mouse: true
      });
      this._.okay.on('press',function () { 
        var item=self.items[self.selected],
            value = self._.input?
                    self._.input.getValue():
                    item.content.replace(/\{[^{}]+\}/g, '').replace(/@$/, ''),
            file=path.resolve(self.cwd, value);
        self.emit('file', file);
        self.hide(); 
      });
      this.screen.append(this._.okay);
    }
    if (options.cancelButton) {
      this._.cancel = new Button({
        screen: this.screen,
        top: bbox.top+bbox.height+(options.box?1:0)+off2,
        height: 1,
        left: bbox.left+bbox.width-10-1,
        width: 10,
        content: options.cancelButton,
        align: 'center',
        style: {
          fg:'white',
          bg: 'red',
          bold:true,
        },
        autoFocus: false,
        hidden:options.hidden,
        mouse: true
      });
      this._.cancel.on('press',function () { self.hide(); });
      this.screen.append(this._.cancel);
    }
    if (options.arrows) 
      Arrows(
        self,
        options,
        function () {self.emit('element wheelup')},
        function () {self.emit('element wheeldown')},
        true
      );
    this._hide=this.hide;
    this.hide = function() {
      self._hide();
      if (self._.box) self._.box.hide();
      if (self._.input) self._.input.hide();
      if (self._.okay) self._.okay.hide();
      if (self._.cancel) self._.cancel.hide();
      if (self._.up) self._.up.hide();
      if (self._.down) self._.down.hide();
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
      if (self._.box) self._.box.show();
      if (self._.input) self._.input.show();
      if (self._.okay) self._.okay.show();
      if (self._.cancel) self._.cancel.show();
      if (self._.up) self._.up.show();
      if (self._.down) self._.down.show();
      self.screen.render();
    } 
    
    // Save clickable elements of this widget; restore screen
    this.clickable=this.screen.clickable;
    this.screen.clickable=this._clickable;
  }
  if (options.label && ~options.label.indexOf('%path')) {
    this._label.setContent(options.label.replace('%path', this.cwd));
  }
  if (this._.input) 
    this.on('selected', function(item) {
      var value = item.content.replace(/\{[^{}]+\}/g, '').replace(/@$/, '');
      if (value.indexOf('/') != -1) value='';
      self._.input.setValue(value);
      self._.input.update();
    });
  
 
  this.on('select', function(item) {
    var value = item.content.replace(/\{[^{}]+\}/g, '').replace(/@$/, '')
      , file = path.resolve(self.cwd, value);
    return fs.stat(file, function(err, stat) {
      var _cwd=self.cwd;
      if (err) {
        return self.emit('ioerror', err, file);
      }
      self.file = file;
      self.value = file;
      if (stat.isDirectory()) {
        self.cwd = file;
        self.refresh(undefined,function (err) {
          if (err) self.cwd=_cwd;
          else if (options.label && ~options.label.indexOf('%path')) {
            self._label.setContent(options.label.replace('%path', self.cwd));
            self.emit('cd', file, self.cwd);
            self.screen.render();
          }
        });
      } else {
        if (self.options.select) self.emit('file', file);
        if (self.options.select && self.options.autohide) self.hide();
      }
    });
  });


}

//FileManager.prototype.__proto__ = List.prototype;
inheritPrototype(FileManager,List);

FileManager.prototype.type = 'file-manager'; 

FileManager.prototype.refresh = function(cwd, callback) {
  var self = this;

  if (cwd) this.cwd = cwd;
  else cwd = this.cwd;

  return fs.readdir(cwd, function(err, list) {
    if (err && err.code === 'ENOENT') {
      self.cwd = cwd !== process.env.HOME
        ? process.env.HOME
        : '/';
      return self.refresh(undefined,callback);
    }

    if (err) {
      if (callback) return callback(err);
      return self.emit('ioerror', err, cwd);
    }
    
    var dirs = []
      , files = [];

    list.unshift('..');

    list.forEach(function(name) {
      var f = path.resolve(cwd, name)
        , stat;

      try {
        stat = fs.lstatSync(f);
      } catch (e) {
        ;
      }

      if ((stat && stat.isDirectory()) || name === '..') {
        dirs.push({
          name: name,
          text: '{light-blue-fg}' + name + '{/light-blue-fg}/',
          dir: true
        });
      } else if (stat && stat.isSymbolicLink()) {
        files.push({
          name: name,
          text: '{light-cyan-fg}' + name + '{/light-cyan-fg}@',
          dir: false
        });
      } else {
        files.push({
          name: name,
          text: name,
          dir: false
        });
      }
    });

    dirs = Helpers.asort(dirs);
    files = Helpers.asort(files);

    list = dirs.concat(files).map(function(data) {
      return data.text;
    });

    self.setItems(list);
    self.select(0);
    self.screen.render();

    self.emit('refresh');

    if (callback) callback();
  });

};

FileManager.prototype.pick = function(cwd, callback) {
  if (!callback) {
    callback = cwd;
    cwd = null;
  }
  var self = this
    , focused = this.screen.focused === this
    , hidden = this.hidden
    , onfile
    , oncancel;

  function resume() {
    self.removeListener('file', onfile);
    self.removeListener('cancel', oncancel);
    if (hidden) {
      self.hide();
    }
    if (!focused) {
      self.screen.restoreFocus();
    }
    self.screen.render();
  }

  this.on('file', onfile = function(file) {
    resume();
    return callback(null, file);
  });

  this.on('cancel', oncancel = function() {
    resume();
    return callback();
  });

  this.refresh(cwd, function(err) {
    if (err) return callback(err);

    if (hidden) {
      self.show();
    }

    if (!focused) {
      self.screen.saveFocus();
      self.focus();
    }

    self.screen.render();
  });
};

FileManager.prototype.reset = function(cwd, callback) {
  if (!callback) {
    callback = cwd;
    cwd = null;
  }
  this.cwd = cwd || this.options.cwd;
  this.refresh(callback);
};

/**
 * Expose
 */

module.exports = FileManager;
