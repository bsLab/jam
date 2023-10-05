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
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    by sbosse (2017-2018)
 **    $REVESIO:     1.3.1
 **
 **    $INFO:
 **
 **    Tree Widget
 **
 **     Added:
 **       - 'preselect' event emission on node selection. The preselection
 **        event allows node children modificiation before screen rendering.
 **       - 'arrows', optional arrow buttons
 **
 **     Events Out: preselect(node), select(node), selected(node)
 **
 **     Node label text: node.name
 **     Node parent element: node.parent 
 **     Get path:
 **       var path=node.name;
 **       node=node.parent;
 **       while(node) 
 **         path=node.name+(node.name!='/'?'/':'')+path,
 **         node=node.parent;
 **
 **
 **    $ENDOFINFO
 */

var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var List = Require('term/widgets/list');
var Arrows = Require('term/widgets/arrows');

function Tree(options) {  
  var self=this,
      height=0;
  function strequal(str1,str2) {
        var i;
        var eq=true;
        if (str1.length != str2.length) return false;
        for(i=0;i<str1.length;i++) { if (str1.charAt(i)!=str2.charAt(i)) eq=false;}
        return eq;
  };

  if (!instanceOf(this,Node)) {
   return new Tree(options);
  }

  options = options || {};
  if (!options.style) options.style = {
      border: {
        fg: 'black'
      },
      focus: {
        border: {
          fg: 'red'
        }
      }
  };
  if (!options.border) options.border = {
      type:'line'
  };

  options.style.border._fg=options.style.border.fg; // save border style, can change
  options.bold = true;
  var self = this;
  this.options = options;
  this.data = {};
  this.nodeLines = [];
  this.lineNbr = 0;
  this.init=true;
  Box.call(this, options);

  var boxfocus=this.focus;
  
  if (options.height) {
    if (typeof options.height == 'number') height=options.height;
    else if (typeof options.height == 'string') {
        var perc=0;
        perc=parseInt(options.height);
        height=this.screen.height*perc/100;
    }
  }
  
  options.extended = options.extended || false;
  options.keys = options.keys || ['space','enter'];

  options.template = options.template || {};
  options.template.extend = options.template.extend || ' [+]';
  options.template.retract = options.template.retract || ' [-]';
  options.template.lines = options.template.lines || true;

  this.listOptions = {
          height: 0,
          top: 1,
          width: 0,
          left: 1,    
          selectedFg: 'white',
          selectedBg: 'blue',
          fg: "green",
          keys: true ,
          mouse:true ,
          selectoffset:height>8?4:2,
          };
          
  if (!options.scrollbar) this.listOptions.scrollbar = 
  {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        fg: 'cyan',
        inverse: true
      }
  }; 
  else if (options.scrollbar != null) 
    this.listOptions.scrollbar = options.scrollbar;

  /*
  ** Tree content
  */
  this.list = new List(this.listOptions);

  
  this.list.key(options.keys,function(){
    var ind = this.getItemIndex(this.selected);
    var line = self.nodeLines[ind];
    self.emit('preselect',line);
    self.nodeLines[ind].extended = !self.nodeLines[ind].extended;
    self.setData(self.data);
    self.screen.render();
    self.emit('select',line);
  });
  this.list.on('element click',function(w,ev){
    var ind = this.getItemIndex(this.selected);
    //console.log(ind)
    var line = self.nodeLines[ind];
    var pos = ev.x-w.aleft;
    var item = this.ritems[ind];
    if (item) {
      self.emit('preselect',line);
      var len1 = self.options.template.extend.length;
      var len2 = self.options.template.retract.length;
      var roi1 = item.indexOf(self.options.template.extend);
      var roi2 = item.indexOf(self.options.template.retract);
      if ((pos > roi1 && pos < roi1+len1) ||
          (pos > roi2 && pos < roi2+len1)) {
        self.nodeLines[ind].extended = !self.nodeLines[ind].extended;
        self.setData(self.data);
        self.screen.render();
        self.emit('select',line);    
      }
    }
  });

  if (options.arrows) 
    Arrows(
      self,
      options,
      function () { self.list.select(self.list.selected - 2); self.screen.render()},
      function () { self.list.select(self.list.selected + 2); self.screen.render()}
    );

  this.on('mousedown', function(data) {
    self.focus();
    Box.prototype.render.call(self);
    self.screen.render();
  });

  // Propagate selection events of list items ...
  this.list.on('selected', function() {
    var ind = this.getItemIndex(this.selected);
    var line = self.nodeLines[ind];
    self.emit('selected',line);
  });
  this.append(this.list);
  
}

Tree.prototype.walk = function (node,treeDepth) {

  var lines = [];

  if (!node.parent)
    node.parent = null;

  if (treeDepth == '' && node.name) {
    this.lineNbr = 0;
    this.nodeLines[this.lineNbr++] = node;
    lines.push(node.name);
    treeDepth = ' ';
  }

  node.depth = treeDepth.length-1;

  if (node.children && node.extended) {

    var i = 0;
    
    if (typeof node.children == 'function')
      node.childrenContent = node.children(node);
    
    if(!node.childrenContent)
      node.childrenContent = node.children;

    for (var child in node.childrenContent) {
      
      if(!node.childrenContent[child].name)
        node.childrenContent[child].name = child;

      var childIndex = child;
      child = node.childrenContent[child];
      child.parent = node;
      child.position = i++;
      
      if(typeof child.extended == 'undefined')
        child.extended = this.options.extended;
      
      if (typeof child.children == 'function')
        child.childrenContent = child.children(child);
      else
        child.childrenContent = child.children;
      
      var isLastChild = child.position == Object.keys(child.parent.childrenContent).length - 1;
      var tree;
      var suffix = '';
      if (isLastChild) {
        tree = '└';
      } else {
        tree = '├';
      }
      if (!child.childrenContent || Object.keys(child.childrenContent).length == 0){
        tree += '─';
      } else if(child.extended) {
        tree += '┬';
        suffix = this.options.template.retract;
      } else {
        tree += '─';
        suffix = this.options.template.extend;
      }

      if (!this.options.template.lines){
        tree = '|-';
      }

      lines.push(treeDepth + tree + child.name + suffix);

      this.nodeLines[this.lineNbr++] = child;

      var parentTree;
      if (isLastChild || !this.options.template.lines){
        parentTree = treeDepth+" ";
      } else {
        parentTree = treeDepth+"│";
      }
      lines = lines.concat(this.walk(child, parentTree));
    }
  }
  return lines;
}

Tree.prototype.focus = function(){
  this.list.focus();
}


Tree.prototype.render = function() {
//console.log(this.style.border._fg)
  if((this.screen.focused == this.list || this.screen.focused == this)) {
    // List is focussed, propagate style changes to the Box element.
    if (this.style.focus.border.fg) this.style.border.fg=this.style.focus.border.fg;  
  } else if ((this.screen.focused != this.list && this.screen.focused != this)) {
    // List is not focussed, restore style changes of the Box element.
    if (this.style.border._fg) this.style.border.fg=this.style.border._fg;
  }

  this.list.width = this.width-3;
  this.list.height = this.height-3;
  Box.prototype.render.call(this);
}

Tree.prototype.setData = function(data) {
  var formatted = [];
  formatted = this.walk(data,'');
  this.data = data;
  if (this.init) {
    this.screen.render();
    this.init=false;
  };
  this.list.setItems(formatted);
  this.screen.render();
}

//Tree.prototype.__proto__ = Box.prototype;
inheritPrototype(Tree,Box);

Tree.prototype.type = 'tree';

module.exports = Tree
