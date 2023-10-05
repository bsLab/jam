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
 **    $INITIAL:     (C) 2006-2022 bLAB
 **    $CREATED:     01-02-17 by sbosse.
 **    $VERSION:     1.11.1
 **
 **    $INFO:
 **
 **  SEJAM2: Simulation Environment for JAM, GUI Webix+, Anychart Graphics, Cannon Phy Simu, NW edition
 **
 **    $ENDOFINFO
 */

global.Config=global.config={
  simulation:'simu/simuWEB',
  dos:false,
  nonetwork:false,
  wine:false,
  os:null,
};
sejamVersion = '1.11.1'

Require('os/polyfill');

var Io    = Require('com/io');
var Comp  = Require('com/compat');
var Name  = Require('com/pwgen');
var Aios  = Require('jam/aios');
var Fs    = Require('fs');
var Path  = Require('com/path');
var Esprima = Require('parser/esprima');
var util  = Require('util');
var simuPhy = Require('simu/simuPHY');
var simuSens = Require('simu/simuSENS');
var Base64 = Require('os/base64');
var Marked = Require('doc/marked');

Require('os/polyfill')

if (typeof process != 'undefined') global.config.os=process.platform;
if (global.config.os=='win32') global.config.wine=Io.getenv('WINE','');

function sq(x) {return x*x}
function equal(a,b) { 
  if (a==undefined || b==undefined) return false;
  if (Comp.obj.isArray(a) && Comp.obj.isArray(b))
    return Comp.array.equal(a,b);
};


var physicalAttributeSet = [
  'masses', 'loadings','springs','id',
  'x','y','z','mass','force',
  'position','gridPosition','velocity','torque',
  'restLength','length','stiffness','damping',
  'bodyA','bodyB',
  /[0-9]+/
]

// TODO: Replace many magic (heuristic) GUI window constants by reasonable values

var gui = function (options) {
  var self=this;
  this.nwgui = options.nwgui;
  this.UI = options.UI;
  this.webix = options.webix;
  this.acgraph = options.acgraph;
  this.CANNON = options.CANNON;
  this.Database = options.Database;
  this.Marked = Marked;
  this.utils = options.utils||{};
  this.version = sejamVersion;
  
  this.worldname = 'MY World';
  // if (Io.getenv('WINE','')!='' || process.platform == 'win32') {
  //  this.workdir=Io.getenv('CWD','/');
  //} else 
  //  this.workdir = Io.getenv('PWD','/');
  this.workdir=Io.getenv('CWD',Io.getenv('PWD','/'));
  this._filename='';
  // Top-level model file name
  this.filename = '';
  this.filesimu = 'simulation.js';
  this.model = {};
  this.source = '{\nname:"world",\nclasses:{},\nworld:{}\n}';
  this.imports = {};
  this.objects = {};
  this.level = Comp.array.create(100,1);
  this.level[-1]=1;
  this.matrix = undefined;
  
  this.inspect = {root:'/',data:{},filter:{array:true,string:true,number:true,boolean:true,object:true}};
  this.simu = none;
  this.simuPhy = none;
  
  this.messages = [];
  // Simulation world window corner coordinates (normalized/zoom=1)
  this.window = {
    x:0,
    y:0,
    w:0,
    h:0,
    mode:'pan'
  }
  this.message=function (msg,type) {
    self.webix.message({text:msg,type:type||'Info',expire:5000})
  };
  
  // Statistical logging (one row for each simualtion step)
  this.logging = false;
  this.logTable = [];
  
  this.options = {
    verbose:0,
    select:{agent:1,node:1,link:1,port:1,resource:0,patch:0,physics:0},
    display:{agent:1,node:1,link:1,port:1,resource:1,patch:1,world:1,flag:1,label:1,signal:1,
             lazy:0},
    message:{error:1,warning:0},
    numbering:{
      simulation:function () {return ''},
      simulationPhy:function () {return ''},
      plot:function () {return ''}      
    },
    plot:{
      width:600,
      height:400,
      margin:10,
      styles:Sejam2Plot.plot_styles
    },
    simulation:{
      fastcopy:true,   // JAM agent process copy/fork/migrate mode
      verbose:false,   // More SEJAM simulator messages
      TMO:1000000      // JAM Node Cache Timeout [gone,signals] in ms
    },
    log: {
      node:true,
      agent:true,
      parent:false,
      pid:false,    // agent process id!
      host:false,   // host id (os pid)
      time:false,
      class:true    
    },
    flag:{fontSize:14},    
  }
}

gui.prototype.addFlags = function (options) {
  var p,o,id;
  if (!options) options={agent:false,node:true,resource:true,fontSize:this.options.flag.fontSize,color:'red'};
  for(p in this.objects) {
    o=this.objects[p];
    if (!o) continue;
    id=o.id.replace(/[^\[]+\[([^\]]+)\]/,'$1');
    if (options.node && Comp.string.startsWith(o.id,'node') && !this.objects['label['+id+']']) {
      this.objects['flag['+id+']'] = {
        visual:{
          x:o.visual.x,
          y:o.visual.y-5-options.fontSize,
          shape:'text',
          fontSize:options.fontSize,
          color:options.color,
          text:o.id,
        },id:'flag['+id+']'};
      // this.drawObject('flag['+id+']');
    }
    if (options.resource && Comp.string.startsWith(o.id,'resource')) {
      this.objects['flag['+id+']'] = {
        visual:{
          x:o.visual.x,
          y:o.visual.y-5-options.fontSize,
          shape:'text',
          fontSize:options.fontSize,
          color:options.color,
          text:o.id,
        },id:'flag['+id+']'};
      // this.drawObject('flag['+id+']');
    }
  }
  this.clearWorld();
  this.drawWorld();
}

/** Auto Layout - it is magic due to width/height widget inconstitencies!
 *
 */
gui.prototype.autoLayout = function () {
  var self=this,
      screen=this.nwgui.Window.get(),
      offset=this.toolbar.getNode().offsetHeight,
      height=screen.height-(this.nw>"0.11.0"?15:offset), // TODO - nw.js toolbar height
      width=screen.width+(this.nw>"0.11.0"?8:0),
      margin=2,
      h=0,_w=0,w=0,w1=0,w2=0,h2=0;
  if (self.toolbar.locked) return;
        
  if (!this.logWin.isVisible() &&
      !this.worldWin.isVisible() &&
      !this.simulationWin.isVisible() &&
      !this.inspectorWin.isVisible() && 
      !this.editorWin.isVisible()) {
    this.logWin.show();
    this.worldWin.show();
    this.simulationWin.show();
    this.inspectorWin.show();
  }
  
  if (this.logWin.isVisible()) {
    // Align bottom, full width
    h=this.logWin.getNode().offsetHeight;
    this.logWin.define('width',width-2*margin-10);
    this.logWin.define('height',h-2);
    this.logWin.define('left',margin);
    this.logWin.define('top',height-margin-h+14);
    this.logWin.resize();
  }
  
  if (this.simulationWin.isVisible()) {
    h2=this.simulationWin.getNode().offsetHeight;
  }

  if (this.inspectorWin.isVisible()) {
    w2=this.inspectorWin.getNode().offsetWidth +2*margin+10;
  } else if (this.editorWin.isVisible()) {
    w2=this.editorWin.getNode().offsetWidth +2*margin+10;
  } else if (this.chatWin.isVisible()) {
    w2=this.chatWin.getNode().offsetWidth +2*margin+10;
  } 

  if (this.physicalWin.isVisible() && this.worldWin.isVisible()) {
    var _w;
    if (w2==0) _w=width-2*margin-8; else _w=width-w2;
    w1=_w/2;
  }
  
  if (this.worldWin.isVisible()) {
    // Align top, right
    _w=this.worldWin.getNode().offsetWidth;
    if (w2==0) w=width-2*margin-8; else w=width-w2;
    this.worldWin.define('width',w-2-w1);
    this.worldWin.define('height',height-h-h2-offset);
    this.worldWin.define('left',width-w-margin-8);
    this.worldWin.define('top',offset+margin+2);
    this.worldWin.resize();
  
  } else if (w2==0) w=width-2*margin-8; else w=width-w2;

  if (this.physicalWin.isVisible() && this.worldWin.isVisible()) {
    this.physicalWin.define('width',w1-2);
    this.physicalWin.define('height',height-h-h2-offset);
    this.physicalWin.define('left',width-w1-margin-8);
    this.physicalWin.define('top',offset+margin+2);
    this.physicalWin.resize();  
  }
  
  if (this.simulationWin.isVisible()) {
    if (w>0) this.simulationWin.define('left',width-w-margin-8);
    if (h>h2) this.simulationWin.define('top',height-h-h2+8);
    this.simulationWin.define('width',w-2);
    this.simulationWin.resize();
  }

  if (this.inspectorWin.isVisible()) {
    // Align top, left
    this.inspectorWin.define('width',w2 -2*margin-12);
    this.inspectorWin.define('height',height-h-offset+1);
    this.inspectorWin.define('left',margin);
    this.inspectorWin.define('top',offset+margin+2);
    this.inspectorWin.resize();
  
  } else if (this.editorWin.isVisible()) {
    // Align top, left
   this.editorWin.define('width',w2-2*margin-12);
    this.editorWin.define('height',height-h-offset);
    this.editorWin.define('left',margin);
    this.editorWin.define('top',offset+margin+2);
    this.editorWin.resize();
  
  } else if (this.chatWin.isVisible()) {
    // Align top, left
   this.chatWin.define('width',w2-2*margin-12);
    this.chatWin.define('height',height-h-offset);
    this.chatWin.define('left',margin);
    this.chatWin.define('top',offset+margin+2);
    this.chatWin.resize();
  
  }
}


/** Change CSS 
 *
 */
gui.prototype.changeCSS = function(theClass,element,value) {
   var cssRules;

   for (var S = 0; S < document.styleSheets.length; S++) {
	 try {
	   document.styleSheets[S].insertRule(theClass+' { '+element+': '+value+'; }',
                                          document.styleSheets[S][cssRules].length);
	 } catch(err) {
	   try{
         document.styleSheets[S].addRule(theClass,element+': '+value+';');
	   } catch(err){
		   try{
			 if (document.styleSheets[S]['rules']) {
			   cssRules = 'rules';
			  } else if (document.styleSheets[S]['cssRules']) {
			   cssRules = 'cssRules';
			  } else {
			   //no rules found... browser unknown
			  }

			  for (var R = 0; R < document.styleSheets[S][cssRules].length; R++) {
			    if (document.styleSheets[S][cssRules][R].selectorText == theClass) {
				  if(document.styleSheets[S][cssRules][R].style[element]){
				    document.styleSheets[S][cssRules][R].style[element] = value;
				    break;
				  }
			    }
		      }
		   } catch (err){}
	   }
	 }
  }
}

/** Change the visual of a visual object
 *
 */
gui.prototype.changeObject = function (id,visual) {
  var self=this,shape=this.worldWin.shapes[id],
      zoom=this.worldWin.zoom,
      off=this.worldWin.offset,
      obj=this.objects[id],
      redraw=false,
      p;
  if (!this.worldWin.container || !obj || !shape) return;
  for(p in visual) {
    if (p=='fill') {
      if (Comp.obj.isNumber(visual.fill.color)) {
        var c=Comp.printf.sprintf('%x',((visual.fill.color*255)|0));
        if (c.length==1) c='0'+c;
        visual.fill.color='#'+c+c+c;
        // Grey code
      } else if (Comp.obj.isObject(visual.fill.color)) {
        var c=Comp.printf.sprintf('%x',((visual.fill.color.value*255)|0));
        if (c.length==1) c='0'+c;
        switch (visual.fill.color.color) {
          case 'red': visual.fill.color='#'+c+'00'+'00'; break;
          case 'green': visual.fill.color='#'+'00'+c+'00'; break;
          case 'blue': visual.fill.color='#'+'00'+'00'+c; break;
          default:
            visual.fill.color='#'+c+c+c;
        }
        // Color gradient TODO
      }
      if (shape.fill) shape.fill(visual.fill.color,visual.fill.opacity||0.5);
    }
    if (p=='shape' && visual.shape!=obj.visual.shape) redraw=true;
    obj.visual[p]=visual[p];
  }
  if (redraw) {
    this.worldWin.shapes[id].remove();
    this.worldWin.shapes[id]=undefined;
    this.drawObject(id);
  }
}
/** Return the class of a simulation object:
 *  {'node','link','port','agent','resource','patch','world','flag'}
 */
gui.prototype.classObject = function (id) {
  if (id.indexOf('agent')==0) return 'agent';
  if (id.indexOf('world')==0 || id=="node[world]") return 'world';
  if (id.indexOf('node')==0) return 'node';
  if (id.indexOf('link')==0) return 'link';
  if (id.indexOf('port')==0) return 'port';
  if (id.indexOf('resource')==0) return 'resource';
  if (id.indexOf('patch')==0) return 'patch';
  if (id.indexOf('flag')==0) return 'flag';
  if (id.indexOf('label')==0) return 'label';
  if (id.indexOf('signal')==0) return 'signal';
}

/** Clear a logging window
 *
 */
gui.prototype.clear = function (win) {
  var self=this;
  var view = this.UI(win);
  var log = this.UI(win+'LogText');
  var scroll = view.getBody();
  var textview = this.UI(win+'LogTextView');
  var text = textview.getValue();
  text = '';
  textview.setValue(text);
  if (!textview.update) textview.update=setTimeout(function () {
    textview.update=undefined;
    self.update(win);
  },100); 
}

/** Clean the graphical world from outdated objects (visual.timeout <= 0).
 *
 */
gui.prototype.cleanWorld = function () {
  var p,pending=0;
  // this.log('[GUI] Cleaning world ...');
  if (this.worldWin.container) this.worldWin.container.suspend();
  for (p in this.objects) {
    obj=this.objects[p];
    if (!obj || !obj.visual) continue;
    if (obj.visual.timeout) {
      pending++;
      obj.visual.timeout--;
      if (obj.visual.timeout <= 0) {        
        if (this.worldWin.shapes[p]) 
          this.worldWin.shapes[p].remove();
        this.worldWin.shapes[p]=undefined;
        this.objects[p]=undefined;
      }
    }
  }
  if (this.worldWin.container) this.worldWin.container.resume();
  return pending;
}

/** Clear the graphical world.
 *
 */
gui.prototype.clearWorld = function () {
  var p,_shapes;
  this.log('[GUI] Clearing world ...');
  this.window={x0:Number.MAX_SAFE_INTEGER,y0:Number.MAX_SAFE_INTEGER,x1:0,y1:0,mode:this.window.mode};
  if (this.worldWin.container) this.worldWin.container.suspend();
  for (p in this.objects) {
    obj=this.objects[p];
    if (this.worldWin.shapes[p]) {
      // 1. remove shapes from stage
      this.worldWin.shapes[p].removeAllListeners();
      this.worldWin.shapes[p].remove();
      // this.worldWin.shapes[p]=undefined;
    }
  }
  // this.objects={};
  _shapes=this.worldWin.shapes;
  this.worldWin.shapes={};
  if (this.worldWin.container) this.worldWin.container.resume();
  // 2. finally dispose shapes after some delay (unlink it from acgraph/stage context)
  setTimeout(function () {
    for (var p in _shapes) {
      _shapes[p].dispose();
    }
    _shapes=undefined;
  },10);
  this.log('[GUI] Clearing world done.');
}

// Create simulation from model; external API
gui.prototype.createSimulation = function () {
  var self=this;
  self.clear('logWin');
  self.clear('msgWin');
  self.logTable = [];
  self.messages=[];
  self.objects={};
  self.createWorld(true);
  self.clearWorld();
  self.drawWorld();
  self.UI('simulationWinButErase').enable();
  self.UI('simulationWinButStep').enable();
  self.UI('simulationWinButPlay').enable();
  self.UI('simulationWinButStop').disable();
  self.UI('simulationWinButCreate').disable();
}

/** Create the sensors simulation world
 *
 */
gui.prototype.createSimuSens = function () {
  var self=this;
  if (!this.sensorsWin.isVisible())
    this.sensorsWin.show();

  if (this.simuSens) return;

  this.log('[GUI] Creating Sensors world ...');
  
  this.simuSens = simuSens.Sensors(
    {
      width:this.sensorsWin.getNode().offsetWidth-26,
      height:this.sensorsWin.getNode().offsetHeight-70,
      UI:this.UI,
      model:this.model,
      log:this.log
    });
  this.sensorsWin.gui=this.simuSens;
  this.UI('sensorsWinButCreate').disable();
  this.UI('sensorsWinButDestroy').enable();
  this.UI('sensorsWinButRun').enable();
  this.UI('sensorsWinButStep').enable();
  this.UI('sensorsWinButStop').disable();
}

/** Create the physical simulation world
 *
 */
gui.prototype.createSimuPhy = function () {
  var self=this;

  if (!this.physicalWin.isVisible())
    this.physicalWin.show();

  if (this.simuPhy) return;

  this.log('[GUI] Creating PHY world ...');
  
  this.simuPhy = simuPhy.Simu({width:this.physicalWin.getNode().offsetWidth-26,
                           height:this.physicalWin.getNode().offsetHeight-70,
                           CANNON:this.CANNON,
                           UI:this.UI,
                           model:this.model,
                           log:this.log,
                           display:this.options.display});
  this.physicalWin.gui=this.simuPhy.gui;
  if (this.simu) this.simu.simuPhy = this.simuPhy; // Attach simuPHY to simuWEB
  this.simuPhy.init();
  if (this.model && this.model.physics && this.model.physics.scenes) {
    for(var p in self.model.physics.scenes) {
      var f=this.model.physics.scenes[p];
      if (Comp.obj.isString(f)) {
        try {
          eval('f='+f); 
        } catch (e) {
          this.log('[GUI] Error in '+p+': '+e);
          continue;
        }
      }
      self.simuPhy.addScene(p,f,{});
    }
  }
  this.simuPhy.gui.animate1();

  this.UI('physicalWinButCreate').disable();
  this.UI('physicalWinButDestroy').enable();
  this.UI('physicalWinButRun').enable();
  this.UI('physicalWinButStep').enable();
  this.UI('physicalWinButStop').disable();
  
  return this.simuPhy;
}

/** Create MAS simulation world  and draw the world.
 */
gui.prototype.createWorld = function (nodraw) {
  var self=this,c;
  if (this.simu) this.destroyWorld();
  if (!this.model || Comp.obj.isEmpty(this.model)) return;
  if (this.model.options && this.model.options.verbose != undefined) this.options.verbose=this.model.options.verbose;
  this.log('[GUI] Creating MAS world'+(this.simuPhy?' with simuPHY':'')+' (verbosity '+this.options.verbose+') ...');
  this.simu=Aios.Simu.Simu({
    CANNON:this.CANNON,
    log:this.log,
    msg:this.msg,
    gui:this,
    simuPhy:this.simuPhy,
    nolimits:true,                                  // No AIOS agent proecss checkpointing and resource control!
    fastcopy:this.options.simulation.fastcopy,  // Dirty (fast) JAM agent code & signal copy?
    TMO:this.options.simulation.TMO,             // JAM Node cache timeout
    format:this.options.log,
    verbose:this.options.verbose     // Additional SEJAM messages
  });
  this.simu.init(this.model);
  if (!nodraw) this.drawWorld();
  this.worldname=this.simu.world.id;
  this.UI('myTopLabel').setValue(this.worldname);
}


/** Delete inspector tree
 */
gui.prototype.deleteTree = function(name_s) {
  var tree = this.UI('inspectorTree'),
      root,n,i;
  
  if (tree._roots) {
    for (var p in tree._roots) {
      p=tree._roots[p];
      tree.remove(p);
    } 
  } else tree.remove('root');
  tree._roots=undefined;
  if (!name_s||Comp.obj.isString(name_s)) {
    root={ id:"root", open:true, value:name_s||'/' }
    tree.add(root);
  } else {
    // Multiple objects
    tree._roots=[];
    for(i in name_s) {
      n=name_s[i];
      tree._roots.push('root@'+n);
      root={ id:'root@'+n, open:true, value:n }
      tree.add(root);
    }
  }
}


/** Destroy one visual object
 *
 */
gui.prototype.destroyObject = function (id) {
  var self=this,shape,
      obj=this.objects[id];
  if (!obj && this.options.verbose>1) this.log('destroyObject: Unknown object '+id);
  if (obj) obj.obj=undefined;
  delete this.objects[id];
  if (this.worldWin.shapes[id]) {
    this.worldWin.shapes[id].removeAllListeners();
    this.worldWin.shapes[id].remove();
    delete this.worldWin.shapes[id];
  }
}

/** Destroy sensors simulation wolrd
 *
 */
 
gui.prototype.destroySimuSens = function () {

  this.log('[GUI] Destroying Sensors world ...');
  this.simuSens.destroy();
  this.simuSens = none;
  this.UI('sensorsWinButCreate').enable();
  this.UI('sensorsWinButDestroy').disable();
  this.sensorsWin.gui=none;
  this.UI('sensorsWinButRun').disable();
  this.UI('sensorsWinButStep').disable();
  this.UI('sensorsWinButStop').disable();
}

/** Destroy physical simulation wolrd
 *
 */
 
gui.prototype.destroySimuPhy = function () {

  this.log('[GUI] Destroying Physical world ...');
  this.simuPhy.destroy();
  this.simuPhy = none;
  this.UI('physicalWinButCreate').enable();
  this.UI('physicalWinButDestroy').disable();
  this.physicalWin.gui=none;
  this.UI('physicalWinButRun').disable();
  this.UI('physicalWinButStep').disable();
  this.UI('physicalWinButStop').disable();
}


/** Destroy MAS simulation world and clear graphical world.
 *
 */
gui.prototype.destroyWorld = function () {
  this.clearWorld();
  if (this.simu) {
    this.log('[GUI] Destroying old simulation '+this.simu.world.id+' ...');
    if (this.simu) this.simu.destroy();
    this.simu=none;
  }
  this.objects={};
  this.worldname='No World!';
  this.UI('myTopLabel').setValue(this.worldname);
}

/** Draw and create one visual object
 *
 */
gui.prototype.drawObject = function (id) {
  var self=this,shape=this.worldWin.shapes[id],
      objClass=this.classObject(id),
      zoom=this.worldWin.zoom,
      off=this.worldWin.offset,
      obj=this.objects[id],
      level=(obj && obj.visual && obj.visual.level!=undefined)?obj.visual.level:-1,
      x0,x1,x2,y0,y1,y2,
      dx=0,dy=0;
  
  if (!this.worldWin.container || !obj || shape || !this.level[level] || !this.options.display[objClass]) return;  
  
  function makeListener(shape,id) {
    if (id != "world-anchor") shape.listen("click", function (e) {self.listenObject(id,e)});
  }
  this.window.x0=Math.min(this.window.x0,obj.visual.x);
  this.window.y0=Math.min(this.window.y0,obj.visual.y);
  if (obj.visual.w) this.window.x1=Math.max(this.window.x1,obj.visual.x+obj.visual.w);
  if (obj.visual.h) this.window.y1=Math.max(this.window.y1,obj.visual.y+obj.visual.h);

  switch (obj.visual.shape) {
    case 'rect':
      shape=this.worldWin.container.rect((obj.visual.x+off.x)*zoom, 
                                         (obj.visual.y+off.y)*zoom, 
                                         obj.visual.w*zoom, obj.visual.h*zoom);
      if (obj.visual.fill) shape.fill(obj.visual.fill.color,obj.visual.fill.opacity||0.5);
      if (obj.visual.line) shape.stroke(obj.visual.line.color||'black',checkOption(obj.visual.line.width,1));
      if (obj.visual.line && obj.visual.line.width!=undefined) shape.strokeThickness(obj.visual.line.width);
      makeListener(shape,obj.id);
      if (obj.visual.pattern) {
        var pattern = this.worldWin.container.pattern(
          new this.acgraph.math.Rect(0,0,obj.visual.pattern.w*zoom,obj.visual.pattern.h*zoom));
        pattern.rect(0, 0,obj.visual.pattern.w*zoom,obj.visual.pattern.h*zoom).fill("none")
               .stroke(obj.visual.pattern.color||"1 blue 0.9");
        shape.fill(pattern);
      }
      this.worldWin.shapes[obj.id]=shape;
      break;
    case 'circle':
      if (obj.visual.align == 'center') dx=obj.visual.w/2,dy=obj.visual.h/2;
      shape=this.worldWin.container.ellipse((obj.visual.x+off.x+dx)*zoom, 
                                            (obj.visual.y+off.y+dy)*zoom, 
                                             obj.visual.w*zoom/2, obj.visual.h*zoom/2);
      if (obj.visual.fill) shape.fill(obj.visual.fill.color,obj.visual.fill.opacity||0.5);
      if (obj.visual.line) shape.stroke(obj.visual.line.color||'black',checkOption(obj.visual.line.width,1));
      if (obj.visual.line && obj.visual.line.width!=undefined) shape.strokeThickness(obj.visual.line.width);
      makeListener(shape,obj.id);
      this.worldWin.shapes[obj.id]=shape;
      break;    
    case 'triangle':
      x0=(obj.visual.x+off.x)*zoom;
      y0=(obj.visual.y+obj.visual.h*7/8+off.y)*zoom;
      x1=(obj.visual.x+obj.visual.w+off.x)*zoom;
      x2=(obj.visual.x+obj.visual.w/2+off.x)*zoom;
      y2=(obj.visual.y-obj.visual.h/8+off.y)*zoom;
      
      shape=this.worldWin.container.path();
      shape.moveTo(x0,y0).
            lineTo(x1,y0).
            lineTo(x2,y2).
            lineTo(x0,y0);
     
      if (obj.visual.fill) shape.fill(obj.visual.fill.color,obj.visual.fill.opacity||0.5);
      if (obj.visual.line) shape.stroke(obj.visual.line.color||'black',checkOption(obj.visual.line.width,1));
      if (obj.visual.line && obj.visual.line.width!=undefined) shape.strokeThickness(obj.visual.line.width);
      makeListener(shape,obj.id);
      this.worldWin.shapes[obj.id]=shape;
      break;    
    case 'text':
      shape=this.worldWin.container.text((obj.visual.x+off.x)*zoom,(obj.visual.y+off.y)*zoom,obj.visual.text);
      if (obj.visual.fontSize) shape.fontSize(obj.visual.fontSize*zoom+'px');
      if (obj.visual.color) shape.color(obj.visual.color);
      this.worldWin.shapes[obj.id]=shape;
      break;
    case 'icon':
      src='icons/'+obj.visual.icon+'.svg';
      shape=this.worldWin.container.image(src,
                                          (obj.visual.x+off.x)*zoom, (obj.visual.y+off.y)*zoom, 
                                          obj.visual.w*zoom, obj.visual.h*zoom);
      // if (obj.visual.fill) shape.fill(obj.visual.fill.color,obj.visual.fill.opacity||0.5);
      makeListener(shape,obj.id);
      this.worldWin.shapes[obj.id]=shape;
      break;
  }  
}

/** Draw the simulation world with current settings.
 *
 */

gui.prototype.drawWorld = function () {
  var p,self=this,
      objClass;
      
  if (!self.worldWin.isVisible()) return;
  this.log('[GUI] Drawing world ...');
  if (!this.worldWin.container) {
    // Install mouse pan and region zoom handler
    this.worldWin.container = this.acgraph.create('worldGraphContainer');
    // this.worldWin.layer = this.acgraph.layer(); this.worldWin.layer.parent(container); ??
    this.worldWin.container._mouse = undefined;
    this.worldWin.container._mouse_line = undefined;
    document.getElementById("worldGraphContainer").addEventListener("mousedown", function(e){
      var m={x:e.clientX,y:e.clientY};
      if (self.worldWin.container._mouse_shape) {
          self.worldWin.container._mouse_shape.remove();
          self.worldWin.container._mouse_shape=undefined;
      }
      self.worldWin.container._mouse = {x:m.x,y:m.y};
      switch (self.window.mode) {
        case 'pan':
          self.worldWin.container._mouse_shape = self.worldWin.container.path();
          self.worldWin.container._mouse_shape.moveTo(m.x-self.worldWin.getNode().offsetLeft-10,
                                                      m.y-self.worldWin.getNode().offsetTop-60);
          // document.getElementById("worldGraphContainer").style.cursor='move';
          break;
        case 'zoom':
        case 'select':
          self.worldWin.container._mouse_shape = self.worldWin.container.rect(
              m.x-self.worldWin.getNode().offsetLeft-10,
              m.y-self.worldWin.getNode().offsetTop-60,
              1,1);
          //b document.getElementById("worldGraphContainer").style.cursor='s-resize';      
          break;
      }
          
    });
    document.getElementById("worldGraphContainer").addEventListener("mousemove", function(e){
      var m={x:e.clientX,y:e.clientY};
      if (self.worldWin.container._mouse_shape && 
            (Math.abs(m.x-self.worldWin.container._mouse.x)>5 ||
             Math.abs(m.y-self.worldWin.container._mouse.y)>5)) {
      switch (self.window.mode) {
        case 'pan':
          self.worldWin.container._mouse_shape.remove();
          self.worldWin.container._mouse_shape = self.worldWin.container.path();
          self.worldWin.container._mouse_shape.moveTo(self.worldWin.container._mouse.x-self.worldWin.getNode().offsetLeft-10,
                                                      self.worldWin.container._mouse.y-self.worldWin.getNode().offsetTop-60);
          self.worldWin.container._mouse_shape.lineTo(m.x-self.worldWin.getNode().offsetLeft-10,
                                                      m.y-self.worldWin.getNode().offsetTop-60);
          break;
        case 'zoom':
        case 'select':
          self.worldWin.container._mouse_shape.remove();
          self.worldWin.container._mouse_shape = self.worldWin.container.rect(
              self.worldWin.container._mouse.x-self.worldWin.getNode().offsetLeft-10,
              self.worldWin.container._mouse.y-self.worldWin.getNode().offsetTop-60,
              (m.x-self.worldWin.container._mouse.x),
              (m.y-self.worldWin.container._mouse.y));
        
          break;
        }
      }
    });
    document.getElementById("worldGraphContainer").addEventListener("mouseup", function(e){
      var x0,y0,dx,dy,dw,dh,zw,zh,m={x:e.clientX,y:e.clientY};
      if (!self.worldWin.container._mouse) return;
      switch (self.window.mode) {
        case 'pan':
          if (Math.abs(m.x-self.worldWin.container._mouse.x)>5 ||
              Math.abs(m.y-self.worldWin.container._mouse.y)>5) {
                var dx=((m.x-self.worldWin.container._mouse.x)/self.worldWin.zoom)|0,
                    dy=((m.y-self.worldWin.container._mouse.y)/self.worldWin.zoom)|0;
                self.worldWin.offset.x += dx;
                self.worldWin.offset.y += dy;
                for(var o in self.objects) {
                  self.moveShape(o,dx,dy);
                }          
          }
          self.worldWin.container._mouse_shape.remove();
          self.worldWin.container._mouse_shape=undefined;
          break;
        case 'zoom':
          if ((m.x-self.worldWin.container._mouse.x)>5 ||
              (m.y-self.worldWin.container._mouse.y)>5) {
                dw=Math.abs(m.x-self.worldWin.container._mouse.x)/self.worldWin.zoom;
                dh=Math.abs(m.y-self.worldWin.container._mouse.y)/self.worldWin.zoom;
                zw=(self.worldWin.getNode().offsetWidth-35)/(dw);
                zh=(self.worldWin.getNode().offsetHeight-70)/(dh);

                dx=-(self.worldWin.container._mouse.x-self.worldWin.getNode().offsetLeft-30)/self.worldWin.zoom|0+10;
                dy=-(self.worldWin.container._mouse.y-self.worldWin.getNode().offsetTop-50)/self.worldWin.zoom|0+10;

                dx +=  self.worldWin.offset.x;
                dy +=  self.worldWin.offset.y;

                self.worldWin.offset = {x:dx,y:dy};
                self.worldWin.zoom=Math.min(zw,zh);
                self.clearWorld();
                self.drawWorld();
          }
          self.worldWin.container._mouse_shape.remove();
          self.worldWin.container._mouse_shape=undefined;
          self.UI('worldWinButZoomRegion').enable();
          break;
        case 'select':
          if ((m.x-self.worldWin.container._mouse.x)>5 ||
              (m.y-self.worldWin.container._mouse.y)>5) {
            x0 = (self.worldWin.container._mouse.x-self.worldWin.getNode().offsetLeft-0)/self.worldWin.zoom;
            y0 = (self.worldWin.container._mouse.y-self.worldWin.getNode().offsetTop-50)/self.worldWin.zoom;
            x0 -=  self.worldWin.offset.x;
            y0 -=  self.worldWin.offset.y;
            dw=Math.abs(m.x-self.worldWin.container._mouse.x)/self.worldWin.zoom;
            dh=Math.abs(m.y-self.worldWin.container._mouse.y)/self.worldWin.zoom;
            // self.log([x0,y0,dw,dh]);
            self.selectRegion(x0,y0,dw,dh,function (id) {return id.indexOf('node')==0||id.indexOf('agent')==0});
          }
          self.worldWin.container._mouse_shape.remove();
          self.worldWin.container._mouse_shape=undefined;
          self.UI('worldWinButSelectRegion').enable();        
          break;
          
      }
      self.worldWin.container._mouse=undefined;
      self.window.mode='pan';
      document.getElementById("worldGraphContainer").style.cursor='default';
      // self.log('click '+e.type+' '+e.clientX+','+e.clientY);
    });
  }
  this.window={x0:Number.MAX_SAFE_INTEGER,y0:Number.MAX_SAFE_INTEGER,x1:0,y1:0,mode:this.window.mode};
  this.worldWin.container.suspend();
  for (p in this.objects) {
    this.drawObject(p);
  }
  this.worldWin.container.resume();
}



/** Print error message to logging window
 *  Returns a window-specific print function.
 */
gui.prototype.errToWin = function (win) {
  var self=this;
  return function(data) {
    var view = self.UI(win);
    var textview = self.UI(win+'LogTextView');
    var text = textview.getValue();
    if (self.options.message.error) self.message(data);
    text = text + 'X '+ data + '\n';
    textview.setValue(text);
  }  
}

/** Find objects based on class and regular expression pattern (string)
 *
 */
gui.prototype.findObjects = function (classId,pattern) {
  var id, regex=RegExp(pattern),
      objs={};
  for(id in this.objects) {
    if (id.indexOf(classId)==0 && id.match(regex)) objs[id]=this.objects[id];
  }
  return objs;
}

gui.prototype.getObject = function (id,visual) {
  return this.objects[id];
}
/** A shape/object listener (attached to graphics elements)
 *
 */
gui.prototype.listenObject = function (id,e) {
  var self=this,
      obj=this.objects[id];

  function selectable(id) {
      if (Comp.string.startsWith(id,'agent') && !self.options.select.agent) return false;
      if (Comp.string.startsWith(id,'node') && !self.options.select.node) return false;
      if (Comp.string.startsWith(id,'link') && !self.options.select.link) return false;
      if (Comp.string.startsWith(id,'port') && !self.options.select.port) return false;
      if (Comp.string.startsWith(id,'resource') && !self.options.select.resource) return false;
      if (Comp.string.startsWith(id,'patch') && !self.options.select.patch) return false;
      return true
  }
     
  function overlap(id,v) {
    var objs=[],id2;
    // Return all overlapping shapes
    for (id2 in self.objects) {
      if (self.objects[id2]==undefined) continue;
      var v2=self.objects[id2].visual;
      if (id2==id || !self.level[v2.level]) continue;

      if (Comp.string.startsWith(id,'agent') &&
          !Comp.string.startsWith(id2,'agent')) continue;
      else if (Comp.string.startsWith(id,'node') &&
              !Comp.string.startsWith(id2,'node')) continue;
      else if (Comp.string.startsWith(id,'link') &&
              !Comp.string.startsWith(id2,'link')) continue;

      if (!selectable(id2)) continue;

      if (v.shape=='circle' && v2.shape=='circle') {
        var r0=(v.w+v.h)/4,
            r1=(v2.w+v2.h)/4,
            c=sq(v.x-v2.x)+sq(v.y-v2.y);
        if (!(c <= sq(r0+r1))) continue;
      } else {
        // If one rectangle is on left side of other
        if (v.x > (v2.x+v2.w) || v2.x > (v.x+v.w)) continue;
        // If one rectangle is above other
        if (v.y > (v2.y+v2.h) || v2.y > (v.y+v.h)) continue;
      }
      objs.push(id2);
    };
    return objs;
  }
  function listen(id,e) {
    var ovl=overlap(id,obj.visual),objs={},id2,p,node;
    // self.log('Select: '+id+' ['+ovl.length+'] '+ selectable(id)); 
   
    if (!self.inspectorWin.locked && selectable(id)) {
      if (ovl.length==0) {
        self.inspect.data=self.objects[id].obj;
        self.deleteTree(id);
        self.makeTree(self.inspect.data,'root');
        self.UI('inspectorTree').close('root');
      } else {
        objs[id]=self.objects[id].obj;
        for(var id2 in ovl) {
          id2=ovl[id2];
          objs[id2]=self.objects[id2].obj;
        }
        self.inspect.data=objs;
        Comp.array.push(ovl,id);
        self.deleteTree(ovl);
        for(p in objs) {
          self.makeTree({},'root@'+p);
          self.UI('inspectorTree').close('root@'+p);                  
          node = self.UI('inspectorTree').getItem('root@'+p);
          node._data=objs[p];
        }
      }
    }
    if (Comp.string.startsWith(id,'node')) {
      id2=id.replace(/node\[([^\]]+)\]/,'$1');
      node = self.simu.world.getNode(id2);        
      if (node && node.position) {
        if (node.position.gps) 
          self.UI('worldWinInfo').setValue(Comp.printf.sprintf('%s %2.6f&deg; %2.6f&deg; %4.0fm',
                                                              node.id,
                                                              node.position.gps.latitude,
                                                              node.position.gps.longitude,
                                                              node.position.gps.height));
        else if (node.position.x != undefined && node.position.y != undefined)  
          self.UI('worldWinInfo').setValue(Comp.printf.sprintf(node.position.z!=undefined?'%s [%4.0f,%4.0f,%4.0f]':'%s [%4.0f,%4.0f]',
                                                              node.id,
                                                              node.position.x,
                                                              node.position.y,
                                                              node.position.z));
      } else self.UI('worldWinInfo').setValue('');
      if (self.options.select.physics && self.simuPhy) {
        var tokens = id2.split(',');
        // Try to find connected physical object. e.g., masses.
        self.simuPhy.select(tokens.map(function (s) {return Number(s)}));
      }
    } else {
      self.UI('worldWinInfo').setValue(id);
      if (self.options.select.physics && self.simuPhy) 
        self.simuPhy.unselect();
    }
  }
  listen(id,e);   
}

gui.prototype.lockLayout = function () {
  this.UI('topWinLock').define('icon','lock');
  this.UI('topWinLock').refresh();
  this.toolbar.locked=true;
  this.inspectorWin.define('move',false);  
  this.msgWin.define('move',false);
  this.logWin.define('move',false);
  this.simulationWin.define('move',false);
  this.worldWin.define('move',false);
}

/** Print logging message to logging window
 *  Returns a window-specific print function.
 */
gui.prototype.logToWin = function (win) {
  var self=this;
  function wrap(data) {
    function contains(it) { return data.indexOf(it) != -1; };
    if (contains('Warning:')) return '! '+data + '';
    else if (contains('Error:')) { if (self.options.message.error) self.message(data); return 'X '+data + ''}
    else return '  '+data;
  }
  return function(data) {
    if(data==undefined) data='undefined';
    if(typeof data != 'string') data=JSON.stringify(data);
    var view = self.UI(win);
    // var log = self.UI(win+'LogText');
    var textview = self.UI(win+'LogTextView');
    // var scroll = view.getBody();
    /*
    if (typeof log.logtext == 'undefined') log.logtext='';
    data=data.replace(/ /g,'&emsp;').replace(/\n/g,'<br>\n');
    log.logtext += wrap(data) + '<br>\n';
    log.removeView(win+'LogTextView');
    log.addView({template:'<tt>'+log.logtext+'</tt>', autoheight:true, borderless:true, id:win+'LogTextView'});
    */
    var text = textview.getValue();
    text = text + wrap(data) +'\n';
    textview.setValue(text);
    if (!textview.update) textview.update=setTimeout(function () {
      textview.update=undefined;
      self.update(win);
    },100); 
  }  
}

/** Highlight a line (lineNumber) in the editor
 *
 */
gui.prototype.highlightLine = function(editor,lineNumber) {
    //Select editor loaded in the DOM
    var myEditor = UI(editor).getEditor();
    if (!myEditor) return;
     //Set line CSS class to the line number & affecting the background of the line with the css class of line-error
    myEditor.setLineClass(lineNumber - 1, 'background', 'line-error');
    highlights[editor]=lineNumber;
}

// Load simulation model from file; external API
gui.prototype.loadSimulation = function(file) {
  var self=this;
  // If file != null, use loadFile/fs
  if (global.TARGET == "browser") {
    function setup(text,filename,dir) {
      console.log(filename,dir,typeof text, text && text.length)
      try { 
        self.filename=self.filesimu=filename;
        if (dir) self.workdir=dir;
        self.source = text;
        self.imports = {};
        console.log('Parsing model '+filename);
        self.model = self.parseModel(text);
        if (self.model && self.model.name)
          self.log('Loaded simulation model "'+self.model.name+'" ('+self.source.length+') from file '+self.filename);
        else  
          self.log('Loading simulation model from file '+self.filename+' failed.');
        self.UI('sourceText').setValue(self.source);
        self.UI('buttonTopSave').disable();
        self.UI('buttonEditorSave').disable();
        self.editorWin._changed=false;
        self.editorWin._active=self.filename;
        self.inspect.root = 'model';
        self.inspect.data = self.model;
        self.UI('sourceTextWinMenu').remove('root');
        files=[self.filename];
        for(p in self.imports) {
          files.push(p);
        }
        self.UI('sourceTextWinMenu').add({ 
          id:'root', 
          value:self.filename, 
          submenu:files});
      } catch (e) {                    
        self.log('Loading of simulation model from file '+self.filename+' failed: '+e.toString());
      }
    }
    if (!file) {
      if (Config.workdir==undefined) Config.workdir=self.workdir;
      if (typeof FS != 'undefined') FS.API.loadFilePoly(function (text,filename,dir) {setup(text,filename,dir)});
      else loadScript("simulation.js",".js",function (text,filename) {setup(text,filename)})
    } else {
      if (Config.workdir) {
        var dir = self.workdir,
            file = Path.basename(file);
        console.log(dir,file);
        var result = FS.loadSync(dir,file)
        if (Utils.isError(result)) self.log('Loading of simulation model from file '+file+' failed: '+result);
        if (result && result.status!=0) self.log('Loading of simulation model from file '+file+' failed: '+result.status);
        setup(result.reply,file);
      } else {
        setup(loadFile(file),file);
      }
    }
  } else {
    if (self.filename.indexOf('.js')<0) {
      self.filename='simulation.js';
      self.UI('filedialogWinFormFile').setValue(self.filename);
    }
    var but = self.UI('filedialogWinAction');
    but.setValue('Load Model');
    but.refresh();
    self.openDir(self.workdir);
    self.filedialogWin.show();
  }
}

/** Make an inspector tree node
 */
gui.prototype.makeTree = function(element,root) {
  var self=this,
      tree = this.UI('inspectorTree'),
      child,childid,i=1,p,v,isfun,name,pat;
      
  function filter(name,elem,type) {
    var p;
    if (name && name=='_update') return false;
    if (!self.inspect.filter) return true;
    if (type) return self.inspect.filter[type];
    type=typeof elem;
    if (!self.inspect.filter[type]) return false;
    if (self.inspect.filter.attributes) {
      if (self.inspect.filter.attributes[name]) return true;
      if (self.inspect.filter.attributes.patterns) 
        for(p in self.inspect.filter.attributes.patterns) {
          if (self.inspect.filter.attributes.patterns[p].test(name)) return true;
        }
      return false;
    }
    return true;
  }
  
  if (Comp.obj.isObject(element)  || Comp.obj.isArray(element)) {
    if (element && element != null && element._update) element._update(element);
    for (var p in element) {
      child=element[p];
      if (filter(p,child)) {
        if (child==undefined) v=p+' = undefined';
        else if (Comp.obj.isFunction(child)) {
          if (!filter(null,null,'function')) continue;
          name = child.toString();
          v=p+' = '+Comp.string.sub(name,0,name.indexOf('{'));
        } else if (!Comp.obj.isObject(child) && !Comp.obj.isArray(child)) {
          if (!filter(null,null,'array')) continue;
          if (Comp.obj.isString(child))
            v=p+' = "'+(child.length<20?child:(Comp.string.sub(child,0,20)+'..'))+'"';  
          else
            v=p+' = '+child.toString();
        } else if (Comp.obj.isEmpty(child))
          v = p+' = '+(Comp.obj.isArray(child)?'[]':'{}');
        else v=p;
        
        childid = root+'.'+i; i++;
        
        tree.add({
          id:childid, 
          open:false, 
          value:v,
          _data:child
        },i,root);

        if ((Comp.obj.isObject(child)  || Comp.obj.isArray(child)) &&
            !Comp.obj.isEmpty(child)) {
          tree.add({id:childid+'.0',value:'..'},0,childid);
        }
      }   
    }
  } else if (element != undefined) {
    name = element.toString();
    funpat = /function[\s0-9a-zA-Z_$]*\(/i;
    isfun=Comp.obj.isFunction(element)||funpat.test(name);
    if (isfun && filter(null,null,'function')) {
      element=Comp.string.sub(name,0,name.indexOf('{'));
    }
  } else {
  }  
}

/** Move one visual object (and optionally child objects) and the shapes
 *  relative to current (x,y) position (normalized coordinates independent of zoom/pan).
 *
 */
gui.prototype.moveObject = function (oid,dx,dy,and,andmore) {
  var shape=this.worldWin.shapes[oid],
      zoom=this.worldWin.zoom,
      obj=this.objects[oid],
      level=(obj && obj.visual && obj.visual.level!=undefined)?obj.visual.level:-1,
      node,pro,i,nid,lid;
  if (obj && !this.level[level]) return;
  if (!obj || !shape) {this.log('[GUI] moveObject: Unknown shape '+oid); return};
  obj.visual.x += dx;
  obj.visual.y += dy;
  shape.translate(dx*zoom,dy*zoom);
  this.window.x0=Math.min(this.window.x0,obj.visual.x);
  this.window.y0=Math.min(this.window.y0,obj.visual.y);
  if (obj.visual.w) this.window.x1=Math.max(this.window.x1,obj.visual.x+obj.visual.w);
  if (obj.visual.h) this.window.y1=Math.max(this.window.y1,obj.visual.y+obj.visual.h);
  
  if (and && and=='agent' && Comp.string.startsWith(oid,'node')) {
    // Move all agents of this node, too
    nid=oid.replace(/node\[([^\]]+)\]/,'$1');
    node=this.simu.world.getNode(nid);
    for (i in node.processes.table) {
      pro=node.processes.table[i];
      if (pro==undefined) continue;
      this.moveObject('agent['+pro.agent.ac+':'+pro.agent.id+':'+node.id+']',dx,dy);
    }
  }
  if (andmore && andmore=='port' && Comp.string.startsWith(oid,'node')) {
    nid=oid.replace(/node\[([^\]]+)\]/,'$1');
    lid='port['+nid+']';
    if (this.objects[lid]) this.moveObject(lid,dx,dy);
  } 
}

/** Move one visual object (and optionally child objects) and the shapes
 *  absolute to new (x,y) position (normalized coordinates independent of zoom/pan).
 *
 */
gui.prototype.moveObjectTo = function (oid,x,y,and,andmore) {
  var shape=this.worldWin.shapes[oid],
      zoom=this.worldWin.zoom,
      obj=this.objects[oid],
      level=(obj && obj.visual && obj.visual.level!=undefined)?obj.visual.level:-1,
      node,pro,i,nid,lid,dx,dy;
  if (obj && !this.level[level]) return;
  if (!obj || !shape) {this.log('[GUI] moveObjectTo: Unknown shape '+oid); return};
  dx=x-obj.visual.x;
  dy=y-obj.visual.y;
  obj.visual.x = x;
  obj.visual.y = y;
  shape.translate(dx*zoom,dy*zoom);
  this.window.x0=Math.min(this.window.x0,obj.visual.x);
  this.window.y0=Math.min(this.window.y0,obj.visual.y);
  if (obj.visual.w) this.window.x1=Math.max(this.window.x1,obj.visual.x+obj.visual.w);
  if (obj.visual.h) this.window.y1=Math.max(this.window.y1,obj.visual.y+obj.visual.h);
  
  if (and && and=='agent' && Comp.string.startsWith(oid,'node')) {
    // Move all agents of this node, too
    nid=oid.replace(/node\[([^\]]+)\]/,'$1');
    node=this.simu.world.getNode(nid);
    for (i in node.processes.table) {
      pro=node.processes.table[i];
      if (pro==undefined) continue;
      // this.log(nid+'['+pro.agent.id+']');
      this.moveObject('agent['+pro.agent.ac+':'+pro.agent.id+':'+node.id+']',dx,dy);
    }
  }
  if (andmore && andmore=='port' && Comp.string.startsWith(oid,'node')) {
    nid=oid.replace(/node\[([^\]]+)\]/,'$1');
    lid='port['+nid+']';
    if (this.objects[lid]) this.moveObject(lid,dx,dy);
  } 
}

/** Move the shapes of the object only!
 *
 */
gui.prototype.moveShape = function (oid,dx,dy,and,andmore) {
  var obj=this.objects[oid],
      shape=this.worldWin.shapes[oid],
      zoom=this.worldWin.zoom,
      level=(obj && obj.visual && obj.visual.level!=undefined)?obj.visual.level:-1,
      node,pro,i,nid,lid;
  if (obj && !this.level[level]) return;
  if (!shape) {this.log('[GUI] moveShape: Unknown shape '+oid); return};
  shape.translate(dx*zoom,dy*zoom);
  
  if (and && and=='agent' && Comp.string.startsWith(oid,'node')) {
    // Move all agents of this node, too
    nid=oid.replace(/node\[([^\]]+)\]/,'$1');
    node=this.simu.world.getNode(nid);
    for (i in node.processes.table) {
      pro=node.processes.table[i];
      if (pro==undefined) continue;
      this.moveShape('agent['+pro.agent.ac+':'+pro.agent.id+':'+node.id+']',dx,dy);
    }
  }
  if (andmore && andmore=='port' && Comp.string.startsWith(oid,'node')) {
    nid=oid.replace(/node\[([^\]]+)\]/,'$1');
    lid='port['+nid+']';
    if (this.objects[lid]) this.moveShape(lid,dx,dy);
  } 
}

/** File Explorer: Open and list directory
 *
 */
gui.prototype.openDir = function (dir) {
  var self = this;
  var list = this.UI('filedialogWinList');
  this.lastdir=dir;
  try {
    var entry,
        entries ,
        stats,
        index=1;
    try { entries=Fs.readdirSync(dir) } catch (e) { entries={} } 
    list.clearAll();
    list.add({ id:0, flag:'d', icon:'<span class="webix_icon fa-level-up"></span>', 
               dir:dir, name:".."});
    function make(entry,mode) {
      if (mode=='d')
        return { id:index, flag:mode, 
                 icon:'<span class="webix_icon fa-folder-o"></span>', 
                 name:entry,
                 dir:dir
        } 
      else
        return { id:index, flag:mode, 
                 icon:'<span class="webix_icon fa-file-o"></span>', 
                 name:entry,
                 dir:dir
        }
    }
    entries = entries.sort(entries,function (a,b) {return a<b?-1:1 });
    for(entry in entries) {
     try {
      stats = Fs.statSync(dir+'/'+entries[entry]);
      switch (entries[entry]) {
        case '..':
        case '.':
        case '':
          break;
        default:
          if (entries[entry].charAt(0) == '.') break;
          if (stats.isDirectory())
            list.add(make(entries[entry],'d'));       
          index++;
      }
     } catch (e) {}
    } 
    for(entry in entries) {
     try {
      stats = Fs.statSync(dir+'/'+entries[entry]);
      switch (entries[entry]) {
        case '..':
        case '.':
        case '':
          break;
        default:
          if (entries[entry].charAt(0) == '.') break;
          if (!stats.isDirectory())
            list.add(make(entries[entry],'f'))            
          index++;
      }
     } catch (e) {} 
    } 
 } catch (e) {
    this.log('opendir '+dir+' failed.');
    this.log(e.toString());
  }
}

/** Return all overlapping shapes/objects
 *
 */
gui.prototype.overlapObjects = function (objid) {
  var objs=[],id2,obj=this.objects[objid],v,self=this;
  if (!obj) return []; 
  v=obj.visual;
  // Return all overlapping shapes
  for (id2 in self.objects) {
    if (self.objects[id2]==undefined) continue;
    var v2=self.objects[id2].visual;
    if (id2==objid) continue;
    if (Comp.string.startsWith(objid,'agent') &&
        !Comp.string.startsWith(id2,'agent')) continue;
    else if (Comp.string.startsWith(objid,'node') &&
            !Comp.string.startsWith(id2,'node')) continue;
    else if (Comp.string.startsWith(objid,'port') &&
            !Comp.string.startsWith(id2,'port')) continue;
    else if (Comp.string.startsWith(objid,'link') &&
            !Comp.string.startsWith(id2,'link')) continue;
    if (v.shape=='circle' && v2.shape=='circle') {
      var r0=(v.w+v.h)/4,
          r1=(v2.w+v2.h)/4,
          c=sq(v.x-v2.x)+sq(v.y-v2.y);
      if (!(c <= sq(r0+r1))) continue;
    } else {
      // If one rectangle is on left side of other
      if (v.x > (v2.x+v2.w) || v2.x > (v.x+v.w)) continue;
      // If one rectangle is above other
      if (v.y > (v2.y+v2.h) || v2.y > (v.y+v.h)) continue;
    }
    objs.push(id2);
  };
  return objs;
}

/** Parse simulation model
  * Expected format: { name, classes, world, .. } or model = { }
  * Inside the simualtion model, the model attributes can be referenced with the variable model!
  * The open function can be used to load external content as text or as evalated data (setting the second
  * parameter true).
  */
gui.prototype.parseModel = function (text) {
  var model,
      prefix="",
      more='',
      error,
      Model={name:'',classes:{},world:{}},
      self=this;
      
  // not available in browser mode
  function open(filename,data) {
    if (global.TARGET != "browser") {
      var text=Io.read_file(self.workdir+'/'+filename);
      self.imports[filename]=text;
      if (text==undefined) 
        self.log('Error: Opening of file '+self.workdir+'/'+filename+' failed!'); 
      else {
        if (data) {
          eval('data='+text);
          return data;
        } else return text;
      }
    } else {
      var text;
      // Try synchronous FS
      if (Config.workdir) {
          var dir = self.workdir,
              file = filename;
        var result=FS.loadSync(dir,file);
        if (Utils.isError(result)) return self.log('Error: Opening of file '+self.workdir+'/'+filename+' failed!'); 
        if (result && result.status!=0) return self.log('Error: Opening of file '+self.workdir+'/'+filename+' failed!');
        text=result.reply;
      } else {
        text = loadFile(filename);
      }
      if (data) {
        eval('data='+text);
        return data;
      } else return text;
    }
  }
  try {
    if (text.match(/^\s*{/)) prefix="model = ";
    text = prefix+text;
    try {
      var ast = Esprima.parse(text, { tolerant: true, loc:true });
      if (ast.errors && ast.errors.length>0) error = ', '+ast.errors[0];
    } catch (e) {
      if (e.lineNumber) error = e+', in line '+e.lineNumber; 
    } 
    if (error) {this.log(error); return;}
    eval(text);
/*
    if (res) {
      model.name=res.name;
      model.classes=res.classes;
      model.world=res.world;
      model.parameter=res.parameter;
    }
*/
    return model;
  } catch (e) {
    this.log(e.name+(e.message?': '+e.message:'')+(more?more:''));
  }
}

gui.prototype.removeFlags = function () {
  var p,o;
  for(p in this.objects) {
    o=this.objects[p];
    if (!o) continue;
    if (Comp.string.startsWith(o.id,'flag')) {
      this.destroyObject(o.id);
    }
  }
}

/** Reset some GUI forms/windows/fields
 *
 */
gui.prototype.resetGui = function () {
  if (this.worldWin.flags) {
    this.UI('worldWinButFlags').define('icon','flag');
    this.UI('worldWinButFlags').refresh();
    this.worldWin.flags=false;
    this.removeFlags();
  };
  if (this.inspectorWin.locked) {
    this.UI('inspectorWinLock').define('icon','unlock');
    this.UI('inspectorWinLock').refresh();
    this.inspectorWin.locked=false;
  }   
  this.UI('worldWinInfo').setValue('');            
  this.UI('simulationWinInfoTime').setValue('Time: '+0);
  this.UI('simulationWinInfoSteps').setValue('Step: '+0);
  this.UI('simulationWinInfoAgents').setValue('Agents: '+0);
  this.UI('simulationWinInfoNodes').setValue('Nodes: '+0);
  this.inspect.data=this.model;
  this.deleteTree(this.inspect.root);
  this.makeTree(this.inspect.data,'root');
  this.UI('inspectorTree').close('root');
  this.UI('simulationWinButErase').disable();
  this.UI('simulationWinButStep').disable();
  this.UI('simulationWinButPlay').disable();
  this.UI('simulationWinButCreate').enable();
}

/** Save all model data form text editor and reload model.
 *
 */
gui.prototype.saveAll = function () {
  var self=this,file,text;
  try {
    self.log('Saving simulation model "'+(self.model?self.model.name:'')+'" ('+self.source.length+') to file '+self.filename);                      
    Io.write_file(self.workdir+'/'+self.filename,self.source);
    for(file in self.imports) {
      text=self.imports[file];
      self.log('Saving imported module ('+text.length+') to file '+file);                      
      Io.write_file(self.workdir+'/'+file,text);
    }            
    text=Io.read_file(self.workdir+'/'+self.filename);
    self.imports={};
    self.model = self.parseModel(text);
    if (self.model && self.model.name) {
      self.log('Updated simulation model "'+self.model.name+'" ('+self.source.length+') from file '+self.filename);
      self.inspect.root = 'model';
      self.inspect.data = self.model;
    } else
      self.log('Updating simulation model from file '+self.filename+' failed.');
  } catch (e) {                    
    self.log('Saving of simulation model to file '+self.filename+' failed: '+e.toString());
  }                  
}

/** Select all objects in the region in inspector window.
 *  ROI coordinates: normalized!
 *
 */

gui.prototype.selectRegion = function (x0,y0,w,h,filter) {
  var p,o,id,objs=[],p,node,ovl=[];
  if (!filter) filter=function (id) { return true};
  for(p in this.objects) {
    o=this.objects[p];
    if (!o) continue;
    switch (o.visual.shape) {
      case 'circle':
      case 'rect':
      case 'icon':
        if ((o.visual.x>=x0 && (o.visual.x+o.visual.w) <= (x0+w)) &&
            (o.visual.y>=y0 && (o.visual.y+o.visual.h) <= (y0+h)) &&
            filter(o.id)) ovl.push(o.id),objs.push(o);
        break;    
      case 'triangle':
        if ((o.visual.x>=x0 && (o.visual.x+o.visual.w) <= (x0+w)) &&
            (o.visual.y>=y0 && (o.visual.y+o.visual.h) <= (y0+h)) &&
            filter(o.id)) ovl.push(o.id),objs.push(o);
        break;    
    }
  }
  // this.log(map(objs,function (o) {return o.id}));
  if (!this.inspectorWin.locked) {
    if (objs.length>0) {
      this.inspect.data=objs;
      this.deleteTree(ovl);      
      for(p in objs) {
        o=objs[p];
        // this.log(o.id);
        this.makeTree({},'root@'+o.id);
        this.UI('inspectorTree').close('root@'+o.id);                  
        node = this.UI('inspectorTree').getItem('root@'+o.id);
        node._data=o;
      }
    }
  }  
}
gui.prototype.setFontSize = function (fontsize) {
  this.changeCSS('.input','font-size',fontsize+'px')
  this.changeCSS('.normalInput','font-size',fontsize+'px')
  this.changeCSS('.normalOutput','font-size',fontsize+'px')
  this.changeCSS('.error','font-size',fontsize+'px')
  this.changeCSS('.webix_inp_label','font-size',fontsize+'px')
  this.changeCSS('.webix_inp_top_label','font-size',fontsize+'px')
  this.changeCSS('.webix_label_right','font-size',fontsize+'px')
  this.changeCSS('.webix_view','font-size',fontsize+'px')
  this.changeCSS('.webix_el_box','font-size',fontsize+'px')
  this.changeCSS('.webix_el_text','font-size',fontsize+'px')
  this.changeCSS('.webix_el_label','font-size',fontsize+'px')
  this.changeCSS('.webix_el_textarea','font-size',fontsize+'px !important')
  this.changeCSS('textarea','font-size',fontsize+'px !important')
  this.changeCSS('input','font-size',fontsize+'px !important')
}

/** Show simulator and simulation world statistics
 *
 */
gui.prototype.showStats = function () {
  var mem = process.memoryUsage(),
      stats={},n,p,c,proc,nodes=0;

  this.stat('Memory: residentSize: '+div(mem.rss,1024)+' heapUsed:'+div(mem.heapUsed,1024));
  if (this.simu) {
    stats=this.simu.getStats();
    this.stat(Comp.printf.sprintf('Nodes:           %8d',stats.nodes));
    this.stat(Comp.printf.sprintf('Agents:               (%d)',stats.total));
    for (c in stats.agentsN) {
      this.stat(Comp.printf.sprintf('  %10s : %6d (%d)',c,stats.agents[c]?stats.agents[c]:0,stats.agentsN[c]));
    }
    this.stat(Comp.printf.sprintf('[create:%8d migrate:%8d fork:%8d fast:%8d]',
                                  stats.create,stats.migrate,stats.fork,stats.fastcopy));
    this.stat(Comp.printf.sprintf('Signals:         %8d',stats.signal));
    this.stat(Comp.printf.sprintf('Communication:   %8d Bytes|Obj.',stats.send));
    this.stat(Comp.printf.sprintf('CPU:             %8d ms',stats.cpu));
  }
}

// Start simulation (run); external API
gui.prototype.startSimulation = function (steps) {
  var self=this;
  if (!self.simu) return;
  var delay = Number(self.UI('simulationWinFormDelay').getValue());
  self.simu.setDelay(delay);
  self.simu.start(steps||100000); 
}

gui.prototype.unlockLayout = function () {
  this.UI('topWinLock').define('icon','unlock');
  this.UI('topWinLock').refresh();
  this.toolbar.locked=false;
  this.inspectorWin.define('move',true);              
  this.msgWin.define('move',true);
  this.logWin.define('move',true);
  this.simulationWin.define('move',true);
  this.worldWin.define('move',true);
}

/** Update a logging window
 *
 */
gui.prototype.update = function (win) {
  var view = this.UI(win);
  // var log = this.UI(win+'LogText');
  // var scroll = view.getBody();
  var textview = this.UI(win+'LogTextView');
  // textview.refresh();
  
  var element = textview.getNode();
  var data = textview.getValue();
  var textareaList = element.getElementsByTagName("textarea");
  if (view.scrollAuto && textareaList.length==1) {
    var textarea=textareaList[0];
    textarea.scrollTop = textarea.scrollHeight;
  }

   //view.show();    
}

gui.prototype.updateConfig = function () {
  for(i=0;i<10;i++) {
    this.UI('configZlevel'+i).setValue(this.level[i]);
    this.UI('configZlevel'+i).refresh();
  }
}

gui.prototype.updateGui = function (full) {
  var agents=0,nodes=0,n;
  this.update('logWin');
  if (!this.simu) return;
  for(n in this.simu.world.nodes) {
    agents += this.simu.world.nodes[n].processes.used;
    nodes++;
  }
  this.UI('simulationWinInfoTime').setValue('Time: '+(this.simu.time-this.simu.world.lag));
  this.UI('simulationWinInfoSteps').setValue('Step: '+this.simu.step);
  this.UI('simulationWinInfoAgents').setValue('Agents: '+agents);
  this.UI('simulationWinInfoNodes').setValue('Nodes: '+nodes);
  
  if (this.options.movie) {
    this.printer.simulation(false);
    if (this.simuPhy) this.printer.simulationPhy();
  }
}

/** Unhighlight all lines in editor
 *
 */
gui.prototype.unhighlight = function(editor) {
  if (highlights[editor]) {
    var myEditor = UI(editor).getEditor();
    if (!myEditor) return;
     //Set line CSS class to the line number & affecting the background of the line with the css class of line-error
    myEditor.setLineClass(highlights[editor] - 1, 'background', 'line-normal');  
    highlights[editor]=0;
  }
} 

/** Print a warning messager to the loggging window
 *  Returns a window-specific function.
 */
gui.prototype.warnToWin = function (win) {
  var self=this;
  return function(data) {
    var view = self.UI(win);
    var text = textview.getValue();
    text = text + '! '+ data +'\n';
    textview.setValue(text);
  }  
}


var Sejam2Gui = Require('ui/sejam2/sejam2-gui');
gui.prototype.init=Sejam2Gui.gui.prototype.init;
var Sejam2Plot = Require('ui/sejam2/sejam2-plot');
gui.prototype.plot      = Sejam2Plot.gui.prototype.plot;
gui.prototype.plotPoint = Sejam2Plot.gui.prototype.plotPoint;
gui.prototype.plotLine  = Sejam2Plot.gui.prototype.plotLine;
gui.prototype.plotText  = Sejam2Plot.gui.prototype.plotText;
gui.prototype.plotBar   = Sejam2Plot.gui.prototype.plotBar;
gui.prototype.plotAuto  = Sejam2Plot.gui.prototype.plotAuto;
gui.prototype.plotAutoSave  = Sejam2Plot.gui.prototype.plotAutoSave;


module.exports = {
  Gui: function (options) {return new gui(options)}
}
