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
 **    $INITIAL:     (C) 2006-2021 bLAB
 **    $CREATED:     1-10-17 by sbosse.
 **    $VERSION:     1.7.24
 **
 **    $INFO:
 **
 **  X11/Widget library - can be embedded in any application
 **
 ** Create root display and one window:
 ** var root = windows({});
 **
 ** root.start(function (err) {
 **     console.log('Windows created');
 **   });
 ** var win1 = root.window({width:200,height:300}, function () {console.log('Window 1 exposed')});
 **
 ** Add and modify drawing objects (shapes):
 **
 ** win1.add({..});
 ** win1.modify('id',{..});
 ** 
 ** Add event listener:
 **
 ** win1.on('keypress',function (key) {});
 **
 ** Drawing objects:
 **
 **  (at least line or fill attribute must be specified)
 **
 **  Rectangle: 
 **  (x,y coordinates: default center point or with align='center')
 **  (x,y coordinates: left upper corner with align='left')
 **  {id,shape='rect',width,height,x,y,align?
 **   line?: {width,color:'black'|..},
 **   fill?: {color:'black'|..}}
 **
 **  Triangle: 
 **  (x,y coordinates: center point)
 **  {id,shape='rect',width,height,angle?,x,y,
 **   line?: {width,color:'black'|..},
 **   fill?: {color:'black'|..}}
 **
 **  Circle/Ellipse: 
 **  (x,y coordinates: center point)
 **  {id,shape='circle',width,height,x,y,
 **   line?: {width,color:'black'|..},
 **   fill?: {color: 'black'|..}}
 **
 **  Line/Polyline: 
 **  (x,y: absolute coordinates)
 **  {id,shape='line',points:[{x,y},..],
 **   line?: {width,style?,color:'black'|..}}
 **
 **  Text: 
 **  (x,y coordinates: default center point or with align='center')
 **  (x,y coordinates: left upper corner with align='left')
 **  {id,shape='text',x,y,text,style?:{color,align,font,size}}
 **
 **  Button: 
 **  (x,y coordinates: default center point or with align='center')
 **  (x,y coordinates: left upper corner with align='left')
 **  {id,shape='button',width,height,x,y,
 **   label:{text,..},handler:function,
 **   line?: {width,color:'black'|..},
 **   fill?: {color:'black'|..}}
 **
 **
 **  Pixmap: 
 **  var Pixmap = new X11.pixmap();
 +*  var pixmap = Pixmap.open(pathtofile); // pixmap.data, width, height
 **  (x,y coordinates: default center point or with align='center')
 **  (x,y coordinates: left upper corner with align='left')
 **  {id,shape='pixmap',width,height,x,y,
 **   line?: {width,color:'black'|..},
 **   fill?: {color:'black'|..},
 **   data: data}
 **
 ** All shape can be interactive via the onclick:function options attribute.
 ** The sensitive click region can be extended by the extendClick:number options attribute.
 **
 ** Shapes can be modified after drawing:
 **
 ** win.modify(shapeid,{label:{text:string,..}})
 **
 **    $ENDOFINFO
*/


var X11 = Require('x11/core/x11');
var Plot = Require('x11/win/plot');
var Comp = Require('com/compat');
var KeyPress = X11.eventMask.KeyPress;
var ButtonPress = X11.eventMask.ButtonPress;
var Exposure = X11.eventMask.Exposure;
var PointerMotion = X11.eventMask.PointerMotion;
var Rtree = Require('x11/win/rtree');

function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return [nx, ny];
}
function flatten (points) {
  return points.reduce(function (acc, val) { return acc.concat(val)},[]);;
}
// Can be extended!
var color_palette = {
  beig:[245,245,220],
  black:[0,0,0],
  blue:[0,0,255],
  brown:[165,42,42],
  coral:[255,127,80],
  crimson:[220,20,60],
  cyan:[0,255,255],
  gold:[255,215,0],
  gray:[128,128,128],
  gray5:[242,242,242],
  gray10:[230,230,230],
  gray15:[216,216,216],
  gray20:[204,204,204],
  gray25:[191,191,191],
  gray30:[178,178,178],
  gray35:[165,165,165],
  gray40:[152,152,152],
  gray45:[140,140,140],
  gray50:[128,128,128],
  gray55:[114,114,114],
  gray60:[102,102,102],
  gray65:[89,89,89],
  gray70:[76,76,76],
  gray75:[63,63,63],
  gray80:[51,51,51],
  gray50:[38,38,38],
  gray90:[25,25,25],
  gray95:[12,12,12],
  green:[0,200,0],
  indigo:[75,0,130],
  lime:[0,255,0],
  magenta:[255,0,255],
  maroon:[128,0,0],
  navy:[0,0,128],
  olive:[128,128,0],
  orange:[255,179,0],
  peru:[205,133,63],
  pink:[255,192,203],
  purple:[128,0,128],
  red:[255,0,0],
  salmon:[250,128,114],
  sienna:[160,82,45],
  silver:[192,192,192],
  tan:[210,180,140],
  turquoise:[64,224,208],
  violet:[238,130,238],
  white:[255,255,255],
  yellow:[255,242,0],
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

/*******************
** RTREE Object
*******************/

// rtree revision 2 using HP rtree
function rtree(w,h) {
  if (!(this instanceof rtree)) return new rtree(w,h);
  this.bbox={x0:0,y0:0,x1:w,y1:h};
  this.root=Rtree();
  this.within=this.root.within;
  this.bboxGroup=this.root.BBoxGroup;
  this.equal=this.root.equal;
} 
// add shape
rtree.prototype.add = function (shape) {
  var bbox=this.bboxOf(shape);
  shape.bbox=bbox;
  this.root.insert({x0:bbox.x0,y0:bbox.y0,x1:bbox.x1,y1:bbox.y1,shape:shape});
}
// Compute bbox of a shape
rtree.prototype.bboxOf = function (shape) {
  var ox0=0,oy0=0,x0=0,y0=0,x1=0,y1=0,i,p,first=true;
  switch (shape.shape) {
    case 'rect':
    case 'circle':
    case 'triangle':
    case 'button':
    case 'pixmap':
      if (!shape.align || shape.align=='center') ox0=shape.width/2,oy0=shape.height/2;
      x0=shape.x-ox0;
      y0=shape.y-oy0;
      x1=x0+shape.width;
      y1=y0+shape.height;
      break;
    case 'line':
      for (i in shape.points) {
        p=shape.points[i];
        if (first) x0=p.x,y0=p.y,x1=p.x,y1=p.y,first=false;
        x0=Math.min(x0,p.x),y0=Math.min(y0,p.y),
        x1=Math.max(x1,p.x),y1=Math.max(y1,p.y);
      }
      break;
    case 'text':
      // TODO: Rough approx.
      switch (shape.style && shape.style.align) {
        case 'center':
          x0=shape.x-shape.width/2;
          y0=shape.y-shape.height/2;
          x1=x0+shape.width/2;
          y1=shape.y+shape.height/2;
          break;
        default:
          x0=shape.x;
          y0=shape.y-shape.height;
          x1=x0+shape.width;
          y1=shape.y;
      }
  }
  return {x0:x0,y0:y0,x1:x1,y1:y1};
}
// remove shape
rtree.prototype.delete = function (shape) {
  var node = this.root.search(shape.bbox).find(function (n) {return n.shape.id==shape.id});
  if (node) this.root.remove(node);
}
// Find shape node in tree
rtree.prototype.find = function (shape) {
  return this.root.search(shape.bbox).find(function (n) {return n.shape.id==shape.id});
}
// Find all shapes overlapping with bounding box
rtree.prototype.findAll = function (bbox) {
  return this.root.search(bbox);
}
rtree.prototype.print = function (node,indent) {
  return this.root.print();
}
rtree.prototype.printBbox = function (bbox) {
  if (bbox.bbox) bbox=bbox.bbox;
  return bbox.x0+','+bbox.y0+'-'+bbox.x1+','+bbox.y1;
}


/*******************
** WINDOW Object
*******************/

function window(options) {
  var self=this;
  if (!(this instanceof window)) return new window(options);
  this.wid=0;
  // basic color space 
  this.gc={};
  this.ready=false;
  this.suspended=false;
  this.lazy=options.lazy||0;  // drawing update with timers (-1:never)
  this.pending=[];            // pending scheduling block
  this.events={};             // event handlers
  this.objects={};            // all primitive drawing objects
  this.plots={};              // all plot objects
  this.buttons={};            // any region handling mouse clicks
  this.rtree=rtree(options.width, options.height);    // draw object management
  this.z = {min:Number.MAX_VALUE,max:Number.MIN_VALUE};
  this.visible=false;
  this.background = options.background||'white';
  this.fonts = {
    fixed : {size:options.fontSize||10,id:0}
  };
  this.on('click',function (pos) {
    var bbox={x0:pos.x-1,y0:pos.y-1,x1:pos.x+1,y1:pos.y+1};
    for(var bid in self.buttons) {
      if (!self.buttons[bid]) continue;
      if (self.rtree.within(bbox,self.buttons[bid].bbox) && !self.buttons[bid].shape.hidden) {
        self.buttons[bid].handler(pos);
        return;
      }
    }
  });
  if (this.lazy>0) this.updater=setInterval(function () { self.update() },this.lazy);
}

// Add a shape
window.prototype.add = function (shape) {
  var fs;
  if (shape.id == undefined) shape.id='Shape'+Object.keys(this.objects).length;
  shape.redraw=true;
  if (shape.z==undefined) shape.z=0;
  switch (shape.shape) {
    case 'line':
      shape._points=[].concat.apply([],shape.points.map(function (p) {return [p.x,p.y]}));
      break;
    case 'text':
      // TODO: use text extent
      fs=(shape.style && shape.style.size)||this.fonts.fixed.size;
      shape.height=shape.height||fs;
      shape.width=shape.width||int(shape.text.length*fs*0.7);
      shape.width0=shape.width;
      shape.x0 = shape.x;
      shape.y0 = shape.y;
      switch (shape.style && shape.style.align) {
        case 'center':
          shape.height=shape.height||fs;
          shape.width=shape.width||int(shape.text.length*fs*0.7);
          // shape.width0=shape.width;
          shape.x0 = shape.x;
          shape.y0 = shape.y;
          shape.x = shape.x0 - int(shape.width/2);
          shape.y = shape.y0 + int(shape.height/2);          
          break;
      }
      break;
    case 'button':
      // TODO: use text extent
      fs=shape.label.size||this.fonts.fixed.size;
      shape.label.height=shape.label.height||fs;
      shape.label.width=shape.label.width||int(shape.label.text.length*fs*0.7);
      shape.label.x = shape.x - int(shape.label.width/2);
      shape.label.y = shape.y + int(shape.label.height/2);
      this.buttons[shape.id]={handler:shape.handler,bbox:this.rtree.bboxOf(shape),shape:shape};
      break;
  }
  if (shape.shape != 'button' && shape.onclick) {
    var bbox=this.rtree.bboxOf(shape);
    if (shape.extendClick) {
      // enlarg sensisive regione
      bbox.x0 -= shape.extendClick;
      bbox.y0 -= shape.extendClick;
      bbox.x1 += shape.extendClick;
      bbox.y1 += shape.extendClick;
    }
    this.buttons[shape.id]={handler:shape.onclick,bbox:bbox,shape:shape};
  }
  this.rtree.add(shape);
  
  // Pending clear operation of previous shape with same id?
  if (this.objects[shape.id] && this.objects[shape.id].clear && !this.equal(this.objects[shape.id],shape,true)) {
    this.clear(this.objects[shape.id]);
  } 
  this.objects[shape.id]=shape;
  //console.log(this.rtree.print());
  this.z.min=Math.min(shape.z,this.z.min);  
  this.z.max=Math.max(shape.z,this.z.max);  
  // TODO: redraw overlapping objects, too
  //if (!this.lazy) 
  this.emit('Redraw');
  return shape.id;
}

// Clear one shape/erase to background
window.prototype.clear = function (shapeOrId, background) {
  var shape=(typeof shapeOrId == 'object'?shapeOrId:this.objects[shapeOrId]),
      gc,
      x0=0,y0=0,
      X = this.X,
      self=this,
      todo=[];
      
  if (!background) background=shape.backgound||this.background||'white';
  switch (shape.shape) {
    case 'rect':
    case 'button':
      if (!shape.align || shape.align=='center') 
        x0=shape.width/2,y0=shape.height/2; // Default: (x,y) is center point
      if (shape.fill) {
        gc=self.gc[background];
        X.PolyFillRectangle(self.wid, gc, [shape.x-x0, 
                                           shape.y-y0,
                                           shape.width, shape.height]);
      }
      if (shape.line) {
        gc=self.gc[background];
        X.ChangeGC(gc, { lineWidth:shape.line.width||1 });
        X.PolyRectangle(self.wid, gc, [shape.x-x0, 
                                       shape.y-y0,
                                       shape.width, shape.height]);
        X.ChangeGC(gc, { lineWidth:1 });
      }
      if (shape.label) {
        gc=self.gc[background];
        X.PolyText8(self.wid, gc, shape.label.x, shape.label.y, [shape.label.text])        
      }
      break;
    case 'triangle':
      var points=[
        shape.x-shape.width/2, shape.y+shape.height/2,
        shape.x+shape.width/2, shape.y+shape.height/2,
        shape.x, shape.y-shape.height/2,
        shape.x-shape.width/2, shape.y+shape.height/2
      ]
      if (shape.angle) {
        points=points.map(function (p) {
          return rotate(shape.x,shape.y,p[0],p[1],shape.angle);
        });
      }
      points=flatten(points);
      if (shape.fill) {
        gc=self.gc[background];
        X.FillPoly(self.wid, gc, 0, 0, points);
      }
      if (shape.line) {
        gc=self.gc[background];
        X.ChangeGC(gc, { lineWidth:shape.line.width||1 });
        X.PolyLine(0, self.wid, gc, points);
        X.ChangeGC(gc, { lineWidth:1 });
      }
      break;
    case 'circle':
      if (shape.fill) {
        gc=self.gc[background];
        X.PolyFillArc(self.wid, gc, [shape.x-shape.width/2, 
                                     shape.y-shape.height/2,
                                     shape.width, shape.height, 0, 360*64]);
      }
      if (shape.line) {
        gc=self.gc[background];
        X.ChangeGC(gc, { lineWidth:shape.line.width||1 });
        X.PolyArc(self.wid, gc, [shape.x-shape.width/2, 
                                 shape.y-shape.height/2,
                                 shape.width, shape.height, 0, 360*64]);
        X.ChangeGC(gc, { lineWidth:1 });
      }
      break;
    case 'line':
      if (shape.line) {
        gc=self.gc[background];
        X.ChangeGC(gc, { lineWidth:shape.line.width||1 });
        X.PolyLine(0, self.wid, gc, shape._points);
        X.ChangeGC(gc, { lineWidth:1 });
      } else {
        gc=self.gc['background'];
        X.PolyLine(0, self.wid, gc, shape._points);      
      }
      break;
    case 'text':
      gc=self.gc[background];
      X.PolyText8(self.wid, gc, shape.x, shape.y, [shape.text])
      break;
    case 'pixmap':
      if (!shape.align || shape.align=='center') 
        x0=shape.width/2,y0=shape.height/2; // Default: (x,y) is center point
      gc=self.gc[background];
      X.PolyFillRectangle(self.wid, gc, [shape.x-x0, 
                                         shape.y-y0,
                                         shape.width, shape.height]);
      break;
  }
}

// Hider or show shapes (display=none|visible)
window.prototype.display = function (shapeOrId, attr) {
  var shape=(typeof shapeOrId == 'object'?shapeOrId:this.objects[shapeOrId]);
  if (attr=='none' || attr=='hidden') {
    if (!shape.hidden) {
      shape.hidden=true;
      this.clear(shapeOrId);
    }
  } else {
    shape.hidden=false;
    this.draw(shapeOrId);
  }
}

// hide (unmap) window
window.prototype.hide = function () {
  this.X.UnmapWindow(this.wid);
  this.visible=false;
}

// Draw one shape
window.prototype.draw = function (shapeOrId) {
  var shape=(typeof shapeOrId == 'object'?shapeOrId:this.objects[shapeOrId]);
  var gc,
      x0=0,y0=0,
      X = this.X,
      self=this,
      todo=[];
  var background=shape.backgound||'white';
  if (shape.hidden) return;
  switch (shape.shape) {
    case 'rect':
    case 'button':
      if (!shape.align || shape.align=='center') 
        x0=shape.width/2,y0=shape.height/2; // Default: (x,y) is center point
      if (shape.fill) {
        if (shape.fill.color && self.gc[shape.fill.color])
          gc=self.gc[shape.fill.color];
        else
          gc=self.gc.black;
        X.PolyFillRectangle(self.wid, gc, [shape.x-x0, 
                                           shape.y-y0,
                                           shape.width, shape.height]);
      }
      if (shape.line) {
        if (shape.line.color && self.gc[shape.line.color])
          gc=self.gc[shape.line.color];
        else
          gc=self.gc.black;
        X.ChangeGC(gc, { lineWidth:shape.line.width||1 });
        X.PolyRectangle(self.wid, gc, [shape.x-x0, 
                                       shape.y-y0,
                                       shape.width, shape.height]);
        X.ChangeGC(gc, { lineWidth:1 });
      }
      if (shape.label) {
        if (shape.label.color) 
          gc=self.gc[shape.label.color];
        else
          gc=self.gc.black;
        X.PolyText8(self.wid, gc, shape.label.x, shape.label.y, [shape.label.text])        
      }
      break;
    case 'triangle':
      var points=[
        [shape.x-shape.width/2, shape.y+shape.height/2],
        [shape.x+shape.width/2, shape.y+shape.height/2],
        [shape.x, shape.y-shape.height/2],
        [shape.x-shape.width/2, shape.y+shape.height/2]
      ]
      if (shape.angle) {
        points=points.map(function (p) {
          return rotate(shape.x,shape.y,p[0],p[1],shape.angle);
        });
      } 
      points = flatten(points);
      if (shape.fill) {
        if (shape.fill.color && self.gc[shape.fill.color])
          gc=self.gc[shape.fill.color];
        else
          gc=self.gc.black;
        X.FillPoly(self.wid, gc, 0, 0, points);
      }
      if (shape.line) {
        if (shape.line.color && self.gc[shape.line.color])
          gc=self.gc[shape.line.color];
        else
          gc=self.gc.black;
        X.ChangeGC(gc, { lineWidth:shape.line.width||1 });
        X.PolyLine(0, self.wid, gc, points);
        X.ChangeGC(gc, { lineWidth:1 });
      }
      break;
    case 'circle':
      if (shape.fill) {
        if (shape.fill.color && self.gc[shape.fill.color])
          gc=self.gc[shape.fill.color];
        else
          gc=self.gc.black;
        X.PolyFillArc(self.wid, gc, [shape.x-shape.width/2, 
                                     shape.y-shape.height/2,
                                     shape.width, shape.height, 0, 360*64]);
      }
      if (shape.line) {
        if (shape.line.color && self.gc[shape.line.color])
          gc=self.gc[shape.line.color];
        else
          gc=self.gc.black;
        X.ChangeGC(gc, { lineWidth:shape.line.width||1 });
        X.PolyArc(self.wid, gc, [shape.x-shape.width/2, 
                                 shape.y-shape.height/2,
                                 shape.width, shape.height, 0, 360*64]);
        X.ChangeGC(gc, { lineWidth:1 });
      }
      break;
    case 'line':
      if (shape.line) {
        if (shape.line.color && self.gc[shape.line.color])
          gc=self.gc[shape.line.color];
        else
          gc=self.gc.black;
        X.ChangeGC(gc, { lineWidth:shape.line.width||1 });
        X.PolyLine(0,self.wid, gc, shape._points);
        X.ChangeGC(gc, { lineWidth:1 });
      } else {
        gc=self.gc.black;
        X.PolyLine(0,self.wid, gc, shape._points);
      }
      break;
    case 'text':
      if (shape.style && shape.style.color) 
        gc=self.gc[shape.style.color];
      else
        gc=self.gc.black;        
      X.PolyText8(self.wid, gc, shape.x, shape.y, [shape.text])
      break;
    case 'pixmap':
      if (!shape.align || shape.align=='center') 
        x0=shape.width/2,y0=shape.height/2; // Default: (x,y) is center point
      gc = self.gc[background];
      X.PutImage(2, self.wid, gc, shape.width, shape.height, shape.x-x0, shape.y-y0, 0, shape.depth||24, shape.data);
      break; 
  }
  shape.redraw=false;
}


window.prototype.emit = function (ev,arg) {
  // console.log('EMIT ['+this.wid+'] '+ev);
  if (this.events[ev]) this.events[ev](arg);
}

// Are two shapes equal?
window.prototype.equal = function (shape1,shape2,geo) {
  if (shape1.shape!=shape2.shape) return false;
  if (!this.rtree.equal(shape1.bbox,shape2.bbox)) return false;
  if (geo) return true;
  return false;
}
// Erase window
window.prototype.erase = function (background) {
  
}

// return visual or plot object
window.prototype.get = function (id) {
  if (this.objects[id]) return this.objects[id];
  if (this.plots[id]) return this.plots[id];
}

// Modify a shape or plot object (or a part of a shape/node)
window.prototype.modify = function (shapeOrId,attr,part) {
  var shape=(typeof shapeOrId == 'object'?shapeOrId:this.objects[shapeOrId]),
      plot=(typeof shapeOrId == 'string'?this.plots[shapeOrId]:none),
      objs,
      background,
      move= attr && (attr.x!=undefined || attr.y!=undefined),
      repaint= attr && (attr.width!=undefined || attr.height!=undefined || attr.text || attr.label);
   
  if (plot) Plot.modify.call(this,shapeOrId,attr,part);
  if (!shape) return;
  
  if (!modifies(attr,shape)) return;    // no change; no redraw 
  
  // Get all overlapping shapes with this shape
  objs=this.overlap(shape);
  
  // Avoid redrawing of overlapping shapes if this shape is within the shape behind
  if (objs.length>1 && objs[0].id==shape.id && this.rtree.within(shape.bbox,objs[1].bbox))
    // Clear and redraw only this shape
    background=this.style(objs[1],'background');
  else
    // Redraw all underlying and overlying objects, too!    
    objs.map(function (s) {s.redraw=true});

  shape.redraw=true;
  // This shape must be cleared if moved/resized!
  if (move || repaint) this.clear(shape,shape.background||background);
  
  //console.log('>>',shape.id+'['+self.rtree.printBbox(shape)+']',objs.map(function (s) {return s.id+'['+self.rtree.printBbox(s)+']'}),'<<');
  update(shape,attr);

  if (attr.text) {
      // TODO: use text extent
      fs=(shape.style && shape.style.size)||this.fonts.fixed.size;
      switch (shape.style && shape.style.align) {
        case 'center':
          shape.width=shape.width0||int(shape.text.length*fs*0.7);
          shape.x = shape.x0 - int(shape.width/2);
          shape.y = shape.y0 + int(shape.height/2);          
          break;
      }
  }
  if (attr.label) {
      // TODO: use text extent
      fs=(shape.label.size)||this.fonts.fixed.size;
      shape.label.width=int(shape.label.text.length*fs*0.7);
      shape.label.x = shape.x - int(shape.label.width/2);
      shape.label.y = shape.y + int(shape.label.height/2);
  }
  if (!this.lazy && !this.suspended) {
    for(i in objs)
      if (objs[i].redraw) this.draw(objs[i]);
  } else {
    // we redraw this and the overlapping shapes later
    shape.background=background;
  }

  // update mouse area, too
  if (this.buttons[shape.id]) {
    var bbox=this.rtree.bboxOf(shape);
    if (shape.extendClick) {
      // enlarg sensisive regione
      bbox.x0 -= shape.extendClick;
      bbox.y0 -= shape.extendClick;
      bbox.x1 += shape.extendClick;
      bbox.y1 += shape.extendClick;
    }
    this.buttons[shape.id]={handler: this.buttons[shape.id].handler,bbox:bbox,shape:shape};  }
}

// Move a shape
window.prototype.move = function (shapeOrId,dx,dy) {
  var shape=(typeof shapeOrId == 'object'?shapeOrId:this.objects[shapeOrId]),
      attr={};
  if (dx) attr.x=shape.x+dx;
  if (dy) attr.y=shape.y+dy;
  
  this.modify(shape,attr)
}
window.prototype.moveTo = function (shapeOrId,x,y) {
  var shape=(typeof shapeOrId == 'object'?shapeOrId:this.objects[shapeOrId]),
      attr={};
  if (x) attr.x=x;
  if (y) attr.y=y;
  
  this.modify(shape,attr)
}

// Remove event handler
window.prototype.off = function (ev) {
  this.events[ev]=undefined;
}

// Add event handler
window.prototype.on = function (ev,handler) {
  this.events[ev]=handler;
}

// Find all overlapping shapes and return list in decreasing z order
window.prototype.overlap = function (shape) {
  var objs,
      self=this,
      bbox=shape.bbox;
  if (!shape.fill) switch (shape.shape) {
    case 'rect':
      // Optimization: Only find objects overlapping with rectangle lines!
      objs=this.rtree.findAll({x0:bbox.x0-1,y0:bbox.y0-1,x1:bbox.x0+1,y1:bbox.y1+1});
      objs=objs.concat(this.rtree.findAll({x0:bbox.x1-1,y0:bbox.y0-1,x1:bbox.x1+1,y1:bbox.y1+1}));
      objs=objs.concat(this.rtree.findAll({x0:bbox.x0-1,y0:bbox.y0-1,x1:bbox.x1+1,y1:bbox.y0+1}));
      objs=objs.concat(this.rtree.findAll({x0:bbox.x0-1,y0:bbox.y1-1,x1:bbox.x1+1,y1:bbox.y1+1}));
      break;
  }
  // Phase 1: get  all shapes overlapping with this shape
  if (!objs) objs=this.rtree.findAll(bbox);
  // Phase 2: Get bbox of all shapes
  bbox=this.rtree.bboxGroup(objs);
  // Phase 3: find all shapes from this list overlapping with any other shape
  objs=this.rtree.findAll(bbox).map(function (n) { return n.shape});
  
  return objs.sort(function(a,b) { return a.z<b.z});
}

/** Set window title
 *
 */
window.prototype.title = function (title) {
  this.X.ChangeProperty(0, this.wid, this.X.atoms.WM_NAME, this.X.atoms.STRING, 8, title);
}

window.prototype.plot = Plot.window.prototype.plot;



// Remove a shape
window.prototype.remove = function (shape) {
  var objs,background,i,
      self=this;
  if (typeof shape == 'string') shape=this.get(shape);
  if (!shape) return;
  
  // remove shape
  this.rtree.delete(shape);
  
  // Get all overlapping shapes w/o this shape
  objs=this.overlap(shape);

  // Avoid redrawing of overlapping shapes if this shape is within the shape behind
  if (objs.length && this.rtree.within(shape.bbox,objs[0].bbox))
    // Clear and redraw only this shape
    background=this.style(objs[0],'background');
  else
    // Redraw all underlying and overlying objects, too!    
    objs.map(function (s) {s.redraw=true});

  
  //console.log('>>',shape.id+'['+self.rtree.printBbox(shape)+']',objs.map(function (s) {return s.id+'['+self.rtree.printBbox(s)+']'}),'<<');

  if (!this.lazy && !this.suspended) {
    delete this.objects[shape.id];
    this.clear(shape,background);
    for(i in objs) 
      if (objs[i].redraw) this.draw(objs[i]);
  } else {
    // we can clear shape and redraw overlapping shapes later
    shape.clear=true;
    shape.background=background;
  }
}

// Resume window updates (enable redrawing)
window.prototype.resume = function () {
  this.suspended=false;
  this.update();
}


// Suspend window updates (disable redrawing)
window.prototype.suspend = function () {
  this.suspended=true;
}

// show (map) window
window.prototype.show = function () {
  this.X.MapWindow(this.wid);
  this.visible=true;
}

// Get shape style attribute
// {'background','foreground'}
window.prototype.style = function (shape,attr) {
  switch (attr) {
    case 'background':
      if (shape.fill && shape.fill.color) return shape.fill.color;
  }
  return 'white';
}

// Redraw all objects with redraw flag set with respect to their z layer
// Update object operations (redraw,clear,..)
window.prototype.update = function (all) {
  var updated=0;
  if (!this.ready) return 0;
  for(var z=this.z.min;z<=this.z.max;z++) {
    for(var i in this.objects) {
      var shape=this.objects[i];
      if (!shape || (!shape.redraw && !shape.clear && !all) || shape.z!=z) continue;
      if (shape.clear) {this.clear(shape);delete this.objects[shape.id]; updated++}
      else {this.draw(shape);updated++};
    }
  }
  return updated;
}

/********************************
** WINDOWS FRAMEWORK Object
********************************/

function windows(options) {
  if (!(this instanceof windows)) return new windows(options);
  this.options=options||{};
  this.init=false;
  this.ready=false;
  this.windows=[];
  this.pending=[];
  this.events=[];
  this.palette=color_palette;
}

windows.prototype.addColor = function (name,r,g,b) {
  this.palette[name]=[r,g,b];
}

windows.prototype.emit = function (ev,arg,id) {
  // console.log('EMIT '+ev+' ['+id+']');
  if (id!=undefined && this.windows[id]) this.windows[id].emit(ev,arg); 
  else if (this.events[ev]) this.events[ev](arg);
}

// Event handler
windows.prototype.handler = function (ev) {
  //console.log(ev)
  switch (ev.type) {
    case X11.eventNumber.Expose:
      this.emit('Expose',undefined,ev.wid);
      break;
    case X11.eventNumber.KeyPress:
      var key = this.kk2Name[ev.keycode][0];
      this.emit('keypress',key,ev.wid);
      break;
    case X11.eventNumber.ButtonPress:
      this.emit('click',{x:ev.x,y:ev.y},ev.wid);
      break;
  }
}

windows.prototype.off = function (ev) {
  this.events[ev]=undefined;
}

windows.prototype.on = function (ev,handler) {
  this.events[ev]=handler;
}

windows.prototype.start = function (callback) {
  var self=this;
  if (this.init) return;
  this.init=true;
  X11.createClient(function(err, display) {
    if (!err) {
      var X = self.X = display.client;
      self.display = display;
      self.root = display.screen[0].root;
      self.white = display.screen[0].white_pixel;
      self.black = display.screen[0].black_pixel;
      self.kk2Name = {};

      // Start event listener
      X.on('event', function(ev) {
        self.handler(ev);
      });
      X.on('error', function(e) {
        console.log(e);
      });  

      var todo = [
           function (next) {
            var ks = X11.keySyms;
            var ks2Name = {};
            for (var key in ks) ks2Name[ ks[key].code ] = key;
            var min = display.min_keycode;
            var max = display.max_keycode;      
            X.GetKeyboardMapping(min, max-min, function(err, list) {
              for (var i=0; i < list.length; ++i)
              {
                var name = self.kk2Name[i+min] = [];
                var sublist = list[i];
                for (var j =0; j < sublist.length; ++j)
                  name.push(ks2Name[sublist[j]]);
              };
              next();  
            });          
          },
          function (next) {
            self.ready=true;
            if (callback) callback(null,display);
            if (self.pending) {
              X11.block(self.pending);
              self.pending=[];
            }
          }
        ];
      X11.block(todo);
    } else {
      if (callback) callback(err);
    }
  });
  
}
 
// Create and add a new window
windows.prototype.window = function (options,callback) {
  var win = window(options),    
    self=this,
    X = this.X;
  
  function expose() {
    win.update(true);
  }
  function createColors(next) {
    var n=0,len=Object.keys(color_palette).length;
    function createColor(name,r,g,b) {
      X.AllocColor(self.display.screen[0].default_colormap,  r*255, g*255, b*255, function (err,color) {
        if (err) console.log(err);
        X.CreateGC(win.gc[name], win.wid, 
          { 
            foreground: color.pixel, 
            background: self.white,
            font: win.fonts.fixed.id
          });
        n++;              
        if (n==len) next();
      });    
    }
    for(var c in color_palette) {
      win.gc[c]=X.AllocID();
      switch (c) {
        case 'black':
          X.CreateGC(win.gc.black, win.wid, { foreground: self.black, background: self.white, font: win.fonts.fixed.id});
          n++;
          break;
        case 'white':
          X.CreateGC(win.gc.white, win.wid, { foreground: self.white, background: self.white, font: win.fonts.fixed.id});
          n++;
          break;
        default:
          createColor(c,color_palette[c][0],color_palette[c][1],color_palette[c][2]);          
      }
    }
  }
  var todo = [
      function (next) {
        X = self.X;
        win.gc = {};
        win.wid = X.AllocID();
        self.windows[win.wid]=win;
        console.log('Creating new window '+win.wid);
        win.X=X;
        X.CreateWindow(
          win.wid, self.root,        // new window id, parent
          options.x||0, options.y||0, 
          options.width, options.height,   // x, y, w, h
          0, 0, 0, 0,                 // border, depth, class, visual
          { 
            backgroundPixel: options.background=='black'?self.black:self.white,
            eventMask: KeyPress|ButtonPress|Exposure 
          } // other parameters
        );
        X.MapWindow(win.wid);
        win.visible=true;
        X.ChangeProperty(0, win.wid, X.atoms.WM_NAME, X.atoms.STRING, 8, options.title||'');
        win.on('Expose',next);
      },
      function (next) {
        if (!win.fonts.fixed.id) {
          win.fonts.fixed.id=X.AllocID();
          win.fonts.fixed.size=options.fontSize||14;
          X.OpenFont('-*-'+(options.fontFamily?options.fontFamily:'fixed')+
                     '-*-r-*-*-'+win.fonts.fixed.size+
                     '-*-*-*-*-*-*-*',win.fonts.fixed.id);
          if (options.verbose) console.log('Default Font: -*-'+(options.fontFamily?options.fontFamily:'fixed')+
                     '-*-r-*-*-'+win.fonts.fixed.size+
                     '-*-*-*-*-*-*-*',win.fonts.fixed.id);
        }
        next();
      },
      function (next) {
        win.off('Expose');
        createColors(next);
      },
      function (next) {
        // console.log('WIN REDAY!');
        win.ready=true;
        win.on('Expose',expose);
        win.on('Redraw',win.update.bind(win));
        win.emit('Redraw');
        if (callback) callback();
        next();
      }
    ];
  if (!this.ready) this.pending=this.pending.concat(todo); else X11.block(todo);
  return win;
};

module.exports = {
  windows:windows
}
