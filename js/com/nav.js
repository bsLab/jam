/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     by sbosse on 12/11/15
 **    $REVESIO:     1.1.7
 **
 **    $INFO:
 **
 **  AST: Tree-based Navigator
 **
 **    $ENDOFINFO
 */
"use strict";
var Io = Require('com/io');
var Comp = Require('com/compat');
var Hashtbl = Comp.hashtbl;
var Array = Comp.array;
var Hashtbl = Comp.hashtbl;
var String = Comp.string;
var Perv = Comp.pervasives;
var Obj = Comp.obj;
var Rnd = Comp.random;
var Filename = Comp.filename;
var Err = Require('com/err');
var Printf = Comp.printf;
var blessed = Require('term/blessed');


/** A JS Tree-Object Navigator
 *
 * options:{title:string,info:string,showfun:boolean}
 */

var navigator = function (data,options) {
  var self=this;
  this.log='';
  var mem;
  this.options=options||{};
  if (this.options.showfun==undefined) this.options.showfun=true;
  this.info = function (element) {
    if (Obj.isObject(element)) return '{..}';
    else if(Obj.isArray(element)) return '[..]';
    else if (element != undefined) {
      var name=element.toString();
      var funpat = /function [0-9A-Z_$]*\(/i;
      var isfun=Obj.isFunction(element)||funpat.test(name);
        if (isfun) {
          return String.sub(name,0,name.indexOf('{'));
        } else return element 
    } else return 'undefined';
  };
  this.maketree = function (element) {
    var content,children;
    children={};
    if (Obj.isObject(element)  || Obj.isArray(element)) {
      for (var p in element) {
         children[p]={};
      }
      content={
         children : children,
         data : element
      }
    } else if (element != undefined) {
      var name=element.toString();
      var funpat = /function [0-9A-Z_$]*\(/i;
      var isfun=Obj.isFunction(element)||funpat.test(name);
      if (isfun) {
        element=String.sub(name,0,name.indexOf('{'));
      }
      if (!isfun || (isfun && self.options.showfun)) {
        children[element]={};
        content={children : children};
      }
    } else {
      children[element]={};
      content={children : children};    
    }
    return content;
  };
  this.screen = blessed.screen({
    smartCSR: false,
    terminal: 'xterm-color'
    });

  this.screen.title = this.options.title||'my window title';
  this.screen.cursor.color='red';  
  this.tree = blessed.tree({
    top: 3,
    left: 'left',
    width: '100%',
    height: this.screen.height>20?'75%':'60%',
    label: this.options.info||'AST',
    focus:true,
    border: {
      type: 'line'
    },
    style: {
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
    });
  this.tree.focus();
  // Create sub-trees
  this.tree.on('preselect',function(node){  
    var content,children;  
    if (node.name != '/' && !node.extended)  {
      // Io.out(node.extended);
      var data = node.data;
      if (data != none && (Obj.isObject(data) || Obj.isArray(data))) {
        node.children = {};
        if (Obj.isArray(data) && Array.empty(data) && Hashtbl.empty(data)) {
          node.children={'[]' : {}};
        } else for (var p in data) {
         var element = data[p];
         content=self.maketree(element);
         if (content) node.children[p]=content;
        } 
      }
    }
  });
  // Update preview
  this.tree.on('selected',function(node){
    mem=Io.mem();
    self.stats.setValue('Data: '+Perv.int_of_float(mem.data/1024)+' MB'+
                        '   Heap: '+Perv.int_of_float(mem.heap/1024)+ ' MB');
    self.preview.setValue(node.name);
    if (node.data) {
      for (var p in node.data) {
        self.preview.setValue(p+':'+self.info(node.data[p]));
        break;
      }
    } else if (node.children) self.preview.setValue(node.name+':'+Obj.head(node.children));
    self.screen.render();
  });
  this.tree.DATA = {
    name:'/',
    extended:true,
    children: {}
  };
  this.lastobj = data;
  for (var p in data) {
    var element=data[p];
    var content=this.maketree(element);
    if (content) this.tree.DATA.children[p]=content;
  }
  
  this.screen.append(this.tree);
  this.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });

  this.tree.setData(this.tree.DATA);

  
  this.preview = blessed.textbox({
    top: this.screen.height>20?'90%':'80%',
    left: 'left',
    width: '100%',
    height: 3,
    label: 'Preview',
    focus:false,
    border: {
      type: 'line'
    },
    style: {
      fg:'blue'
    }
  });
  this.screen.append(this.preview);
  this.preview.setValue('');

  this.stats = blessed.textbox({
    top: 0,
    left: this.screen.width-40,
    width: 40,
    height: 3,
    label: 'Statistics',
    focus:false,
    border: {
      type: 'line'
    },
    style: {
      fg:'blue'
    }
  });
  this.screen.append(this.stats);
  mem=Io.mem();
  this.stats.setValue('Data: '+Perv.int_of_float(mem.data/1024)+' MB'+
                      '   Heap: '+Perv.int_of_float(mem.heap/1024)+ ' MB');
  
  this.but1 = blessed.button({
    width: 8,
    top: 0,
    height: 3,
    align: 'center',
    content: 'QUIT',
    mouse:true,
    focus:true,
    border: {
      type: 'line'
    },
    style: {
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
  });
  this.but1.on('press', function(data) {
    return process.exit(0);  
  });
  this.screen.append(this.but1);
  this.screen.render(); 
  
}

var Navigator = function(data,options){
    var obj = new navigator(data,options);
    // Object.preventExtensions(obj);
    return obj;
};

module.exports = {
  Navigator:Navigator
}
