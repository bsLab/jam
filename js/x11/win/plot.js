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
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     1-10-17 by sbosse.
 **    $VERSION:     1.3.1
 **
 **    $INFO:
 **
 **  X11/Widget library - High-level plot/data visualization widgets extending the window class 
 **
 **
 ** plot({
 **  type:'vector',
 **  x,y,min?,max?,
 **  width,height
 **  margin?,
 **  columns?,
 **  label?:{x0:string,x1:string,y0:string,y1:string},
 **  bar?: {
 **    fill:{
 **      color:string
 **    }
 **  },
 **  init?:function (i) { return 0.0 } // Creates vector:number [] attribute!
 ** })
 **
 **    $ENDOFINFO
*/

var Comp = Require('com/compat');


function window(options) {
  this.plots={};
}

function update(dst,src) {
  for(var a in src) {
    if (typeof dst[a] == 'object' && typeof src[a] == 'object')
      update(dst[a],src[a]);
    else
      dst[a]=src[a];
  }    
}
function modifies(attr,shape) {
  for(var a in attr) {
    if (typeof attr[a] == 'object' && typeof shape[a] == 'object')
      return modifies(attr[a],shape[a]);
    else if (attr[a] != shape[a]) return true;
  }
  return false;
}

function makeLabel(options,modify) {
  if (options.label.y0) {
    if (modify) this.remove(options.id+':Ly0');
    this.add({
      id:options.id+':Ly0',
      shape:'text',
      align:'left',
      x:options.x-15,
      y:options.y+options.height,
      text:options.label.y0
    });
  }
  if (options.label.y1) {
    if (modify) this.remove(options.id+':Ly1');
    this.add({
      id:options.id+':Ly1',
      shape:'text',
      align:'left',
      x:options.x-15,
      y:options.y,
      text:options.label.y1
    });
  }
  if (options.label.x0) {
    if (modify) this.remove(options.id+':Lx0');
    this.add({
      id:options.id+':Lx0',
      shape:'text',
      align:'left',
      x:options.x,
      y:options.y+options.height+15,
      text:options.label.x0
    });
  }
  if (options.label.x1) {
    if (modify) this.remove(options.id+':Lx1');
    this.add({
      id:options.id+':Lx1',
      shape:'text',
      align:'left',
      x:options.x+options.width,
      y:options.y+options.height,
      text:options.label.x1
    });
  }
}
/** Plot a metric matrix (image) or a grid (2d plot) of nodes
**
** typeof options = {
**  type='matrix',
**  x,y,     
**  rows?,columns?,margin?,
**  align?={'center'|'left'},
**  node: {
**    shape,
**    width,height,
**    fill:{color:string},
**    line:{color:string,width?}
**  },
**  init?: function (^i,^j) -> ^attr | [][],
**  map?: function (^i,^j,^v) -> ^attr:object,
**  matrix?: *[][]
** }
*/
function plotMatrix (options) {
  for(var j=0; j<options.rows;j++) {
    for(var i=0; i<options.columns; i++) {
      var node=Comp.obj.copy(options.node);
      node.x=options.x+i*(node.width+options.margin);
      node.y=options.y+j*(node.height+options.margin);
      node.id=options.id+':N'+(i+j*options.columns);
      if (typeof options.init == 'function') 
        update(node,options.init(i,j));
      else if (typeof options.map == 'function' && options.matrix) 
        update(node,options.map(i,j,options.matrix[j][i]));
      this.add(node);
    }
  }
}


function deleteLine (options,i) {
  var id=options.id+':L'+i;
  this.remove(this.objects[id]);
}

function plotLine (options,i) {
  var x0,y0,x1,y1,id;
  x0=options.x+int(options.width/options.columns*i);
  x1=options.x+int(options.width/options.columns*(i+1));
  y0=options.y+options.height-int(options.height/(options.max-options.min)*options.vector[i]);
  y1=options.y+options.height-int(options.height/(options.max-options.min)*options.vector[i+1]);
  this.add({
    id:options.id+':L'+i,
    shape:'line',
    line:{
      width:options.line.width||1,
      color:options.line.color||'black'
    },
    points:[
      {x:x0,y:y0},{x:x1,y:y1}
    ]
  });
}

function plotLines (options) {
  for(var i=0; i<options.columns-1; i++) {
    plotLine.call(this,options,i);
  }
  if (options.label) {
    makeLabel.call(this,options);
  }
}

function deleteBar (options,i) {
  var id=options.id+':B'+i;
  this.remove(this.objects[id]);
}

function plotBar (options,i) {
  var w=options.width/options.columns-(options.margin||0),
      x,y,h,id;
  x=options.x+int(options.width/options.columns*i)-w/2;
  h=int(options.height/(options.max-options.min)*(options.vector[i]-options.min));
  
  if (options.min>=0 || options.max <= 0) {
    h=Math.max(1,h);
    y=options.y+options.height-h;
  } else {
    off=int(options.height/(options.max-options.min)*(-options.min));
    if (options.vector[i]<0)
      y=options.y+options.height-off, h=Math.max(1,off-h);
    else
      h=Math.max(1,h-off),y=options.y+options.height-off-h;
  }
    
  this.add({
    id:options.id+':B'+i,
    shape:'rect',
    align:'left',
    x:x,
    y:y,
    width:w,
    height:h,
    fill:{
      color:(options.bar.fill && options.bar.fill.color)||'black'
    },
  });
}

function plotBars (options) {
  for(var i=0; i<options.columns; i++) {
    plotBar.call(this,options,i);
  }
  if (options.label) {
    makeLabel.call(this,options);
  }
}

/** Plot of a metric vector (1d plot)
**
** typeof options = {
**  type='vector',
**  x,y,     
**  columns?,
**  vector?:[],
**  align?={'center'|'left'},
**  min?,max?,
**  point?: {
**    shape,
**    width,height,
**    fill?:{color:string},
**    line?:{color:string}
**  },
**  line?:{color?,width?},
**  bar?:{fill?,line?},
**  init: function (i) -> number | []
** }
*/

function plotVector (options) {
  var v,x,y,x0,y0,x1,y1,min,max;
  options.vector=options.vector||[];
  for(var i=0; i<options.columns; i++) {
    v=undefined;
    if (typeof options.init == 'function') v=options.init(i);
    else if (typeof options.init == 'array' || typeof options.init == 'object')
      v=options.init[i]||options.min||0;
    if(v != undefined) options.vector[i]=v;
    if(min==undefined) min=options.vector[i];
    else min=Math.min(min,options.vector[i]);
    if(max==undefined) max=options.vector[i];
    else max=Math.max(max,options.vector[i]);
  }
  if (options.min==undefined) options.min=min;
  if (options.max==undefined) options.max=max;
  if (options.line) plotLines.call(this,options);
  if (options.bar) plotBars.call(this,options);
}

/** Modify a plot or a part of a plot
*   typeof attr = object | number | undefined
*   typeof part = {i,j} | {i} | number | undefined
*/ 
function modify(id,attr,part) {
  var i,j,id,plot=this.plots[id];
  switch (plot.type) {
    case 'matrix':
      if (part && typeof part.i == 'number' && typeof part.j == 'number') {
        id=id+':N'+(part.i+(plot.columns*part.j));
        if (plot.matrix && plot.map && attr == undefined) {
          // Matrix was externally modified; update visual
          attr=plot.map(part.i,part.j,plot.matrix[part.j][part.i]);
        }
        this.modify(id,attr);
      }
      break;
    case 'vector':
      if (!attr && !part) {
        // Update entire plot
        if (plot.line) {
          for(i=0;i<plot.columns-1;i++) {
            id=plot.id+':L'+i;
            this.remove(this.objects[id]);
          }
          plotLines.call(this,plot);
        } else if (plot.bar) {
          for(i=0;i<plot.columns;i++) {
            id=plot.id+':B'+i;
            this.remove(this.objects[id]);
          }
          plotBars.call(this,plot);        
        }
      } else if (typeof attr == 'number') {
        i=(typeof part == 'object')?part.i:part;
        if (i>=0 && i<plot.columns) 
          plot.vector[i]=attr;
        if (plot.line) {
          if (i>0 && i<plot.columns) 
            deleteLine.call(this,plot,i-1),plotLine.call(this,plot,i-1);
          if (i>=0 && i<plot.columns-1) 
            deleteLine.call(this,plot,i),plotLine.call(this,plot,i);
          if (i>0 && i<plot.columns-2) 
            deleteLine.call(this,plot,i+1),plotLine.call(this,plot,i+1);
        } else if (plot.bar) {
          if (i>=0 && i<plot.columns) 
            deleteBar.call(this,plot,i),plotBar.call(this,plot,i);
        }
      } else if (attr && attr.label) {
        if (modifies(attr,plot)) {
          update(plot,attr);
          makeLabel.call(this,plot,true);
        }
      }
      break;
  }
}

// Main entry method
window.prototype.plot = function (options) {
  if (!options.id) options.id='Plot'+Object.keys(this.plots).length;
  this.plots[options.id]=options;
  switch (options.type) {
    case 'matrix':
      if (options.margin==undefined) options.margin=0;
      if (options.matrix) 
        options.rows=options.matrix.length,
        options.columns=options.matrix[0].length;
      options.width=options.width||
                    (options.columns*options.node.width+(options.columns-1)*options.margin);
      options.height=options.height||
                    (options.rows*options.node.height+(options.rows-1)*options.margin);
      if (options.align && options.align=='center')
        options.x=options.x-options.width/2,
        options.y=options.y+options.height/2;
      plotMatrix.call(this,options);
      break;
    case 'vector':
      if (options.align && options.align=='center')
        options.x=options.x-options.width/2,
        options.y=options.y+options.height/2;
      plotVector.call(this,options);
      break;
  }
  return options.id;
}



module.exports = {
  modify:modify,
  window:window
}
