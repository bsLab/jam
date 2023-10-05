var Comp = Require('com/compat');
var util = Require('util');
var current=none;
var Aios = none;
var DSP = Require('dsp/dsp');

function Matrix (cols,rows,init){
  var finit;
  if (typeof init == 'number') finit=function () { return init };
  else if (typeof init == 'undefined') finit=function () { return 0 };
  else finit=init;
  return Array.apply(null,Array(rows)).map(function () { return Array.apply(null,Array(cols)).map(finit) })
}

var sensors = function (options) {
  var self=this;
  this.UI=options.UI;
  this.options=options;
  this.log = options.log || console.log;
  this.gui = self;

  this.canvas = document.getElementById('sensorsContainer');
  this.canvas.width = options.width;
  this.canvas.height = options.height;
  this.ctx = this.canvas.getContext("2d"); 
  this.selected=none;
  this.options.steps=this.options.steps||1;
  this.options.delay=this.options.delay||100;
}

sensors.prototype.config = function (options) {
  for(var p in options) this.options[p]=options[p];
}

sensors.prototype.create = function (options) {
  this.options.width  = options.width||200;
  this.options.height = options.height||200;
  this.db=options.db||options.data;
  this.destroy();
  this.imgData = this.ctx.createImageData(this.options.width, this.options.height); // width x height
  this.ctx.putImageData(this.imgData, 0, 0);  
}


sensors.prototype.destroy = function () {
  if (this.imgData) {
    var data = this.imgData.data;
    for (var i = 0, len = this.imgData.data.length; i < len; i++) {
      data[i] = 255;
    }
    this.ctx.putImageData(this.imgData, 0, 0);
    this.imgData=null;
  }
}

sensors.prototype.resize = function (options) {
  this.canvas.width = options.width;
  this.canvas.height = options.height;
  this.ctx.putImageData(this.imgData, 0, 0);
}

sensors.prototype.show = function (mat,scale) {
  var self=this, data = this.imgData.data, row;
  if (typeof scale == 'number') scale={ k:scale, off:0 };
  else if (!scale) scale={ k:255, off:0 };
  mat.forEach(function (row,j) {
    row.forEach(function (col,i) {
      var v=(col-scale.off)*scale.k;
      data[(i+j*self.options.width)*4+0] = v;
      data[(i+j*self.options.width)*4+1] = v;
      data[(i+j*self.options.width)*4+2] = v;
      data[(i+j*self.options.width)*4+3] = 128;
    });
  });
  this.ctx.putImageData(this.imgData, 0, 0);
}

sensors.prototype.step = function (steps) {
  if (!this.imgData) this.create({width:200,height:300});
  var mat = Matrix(200,300,Math.random) 
  this.show(mat);
}

var Sensors = function(options) {
  var obj=none;
  obj = new sensors(options);
  return obj;
}

module.exports = {
  sensors:sensors,
  Sensors:Sensors,
  current:function (module) { current=module.current; Aios=module;}
}

