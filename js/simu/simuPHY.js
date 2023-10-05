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
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     21-04-17 by sbosse.
 **    $VERSION:     1.3.1
 **
 **    $INFO:
 **
 **  Physical Multi-body Simulator that can be combined with MAS simulation
 **
 **  Physical scene constructor function type signature:
 **
 **  function constructor(world:{CANNON,GUI,..},settings:{$p:$v},log:function) -> {map?:function, destroy?:function, ..}
 **
 **    $ENDOFINFO
 */

var Comp = Require('com/compat');
var util = Require('util');
var current=none;
var Aios = none;
var DSP = Require('dsp/dsp');

var simu = function (options) {
  this.CANNON=options.CANNON;
  this.UI=options.UI;
  this.options=options;
  this.options.width=options.width||100;
  this.options.height=options.height||100;
  this.log = options.log || console.log;
  
  this.gui = new this.CANNON.Gui({width:this.options.width,
                                  height:this.options.height,
                                  log:this.log,
                                  display:options.display});
  this.objects=[];
  this.selected=none;
}

/** Add a physical world scene defining physical and visual objects incl. constraints.
 *
 */
simu.prototype.addScene = function (name,constructor,settings) {
  var self=this, 
      gui = this.gui,
      CANNON = this.CANNON,      
      world = this.world;
  this.objects=[];
  this.scene=_;
  if (!settings) settings={};
  // Pass MAS simulation model to physical model constructor
  settings.model=this.options.model;
  gui.addScene(name,function(options){
    for(var p in options) settings[p]=options[p];
    // remove old scene bindings (listeners ..)
    if (self.objects && self.objects.destroy) self.objects.destroy();
    self.objects=constructor(world,settings,self.log);
    self.scene=name;
    return;
  });
}

/** Show a scene by name
 *
 */
simu.prototype.changeScene = function (name,settings) {
  this.gui.scenePicker[name](settings);
}

simu.prototype.destroy = function () {
  if (this.gui) this.gui.destroy();
  this.gui=none;
  this.wolrd=none;
  this.selected=none;
}

simu.prototype.get = function (id) {
  if (this.objects && this.objects.map) 
  try {
    return this.objects.map(id);
  } catch (e) {return none};
}

simu.prototype.init = function () {
  this.gui.init();
  this.gui.enable();
  this.gui.animate();
  this.gui.disable();
  this.world = this.gui.getWorld();
  this.world.CANNON=this.CANNON;
  this.world.GUI=this.gui;
  this.world.DSP=DSP;
}

simu.prototype.refresh = function (steps) {
  this.gui.checkRender();
}

// Try to get a report from a scene
simu.prototype.report = function (name) {
  if (!name) name=this.scene;
  if (this.scene && this.objects.report) 
    try { return  this.objects.report() }
    catch (e) { this.gui.log('report: '+e.toString()) } 
}

simu.prototype.select = function (id) {
  var obj,shape;
  if (this.selected) {
    this.selected.shape.color=this.selected.color; 
    this.gui.setMaterial(this.selected.shape);
    this.selected=none;
  }
  if (this.objects && this.objects.map) {
    obj = this.objects.map(id);
    if (obj && obj.shapes && obj.shapes[0]) {
      shape=obj.shapes[0];
      // this.log(util.inspect(shape));
      if (shape.mesh) {
        this.selected={shape:shape.mesh,color:shape.mesh.color||'white'};
        shape.mesh.color = 'red';
        this.gui.setMaterial(shape.mesh);
      }
      this.gui.checkRender();
    }
  }
}

simu.prototype.start = function (steps) {

}

simu.prototype.step = function (steps,callback) { 
  this.gui.enable();
  return this.gui.step(steps,callback);
}

simu.prototype.stepPhyOnly = function (steps,callback) { 
  this.gui.stepPhyOnly(steps,callback);
}

simu.prototype.stop = function (steps) {

}

simu.prototype.unselect = function () {
  if (this.selected) {
    this.selected.shape.color=this.selected.color; 
    this.gui.setMaterial(this.selected.shape);
    this.selected=none;
    this.gui.checkRender();
  }
}


var Simu = function(options) {
  var obj=none;
  obj = new simu(options);
  return obj;
}

module.exports = {
  simu:simu,
  Simu:Simu,
  current:function (module) { current=module.current; Aios=module; JamAnal.current(module)}
}

