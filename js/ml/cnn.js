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
 **    $CREATED:     (C) 2006-2019 bLAB by sbosse
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 ** Convolutional neural network ML Algorithm
 **
 ** Incremental learner using ml.update! Initial training data via ml.learn (or empty data set) 
 ** 
 **    $ENDOFINFO
 */
'use strict';
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;

var convnetjs = Require('ml/convnet')
var that;

that = module.exports =  {
  // typeof options = {x:[][],y:[],width,height,depth,normalize?:[a,b],layers:{}[]..}
  // format x = [ [row1=[col1=[z1,z2,..],col2,..],row2,..] ]
  create : function (options) {
    var net = new convnetjs.Net();
    if (options.layers)
      net.makeLayers(options.layers);
    if (!options.iterations) options.iterations=10;
    if (!options.depth) options.depth=1;
    if (!options.width) options.width=options.x[0].length,options.height=1;
    var trainer = new convnetjs.SGDTrainer(net, options.trainer||
                                          {method: 'adadelta', 
                                          l2_decay: 0.001, 
                                          batch_size: 10});
    // convert matrix (2dim/3dim) to volume elements
    var x = options.x;
    if (options.normalize) {
      var a,b,
          c=options.normalize[0],
          d=options.normalize[1];
      x.forEach(function (row) {
        var min=Math.min.apply(null,row),
            max=Math.max.apply(null,row);
        if (a==undefined) a=min; else a=Math.min(a,min);
        if (b==undefined) b=max; else b=Math.max(b,max);        
      })
      x=x.map(function (row) {
        return row.map(function (col) { return (((col-a)/(b-a))*(d-c))+c })  // scale [0,1] -> [c,d]
      })
    }
    x=x.map(function (row) {
      var vol = new convnetjs.Vol(options.width, options.height, options.depth, 0.0); //input volume (image)
      vol.w = row;
      return vol;
    });
    x.forEach (function (row) {
      //net.forward(row);
    })
    var y = options.y;
    if (!options.targets) {
      options.targets=that.ml.stats.unique(y);
    }
    for(var iters=0;iters<options.iterations;iters++) {
      y.forEach(function (v,i) {
        trainer.train(x[i],options.targets.indexOf(v));
      })
    }
    trainer.options= {width:options.width,height:options.height,depth:options.depth,targets:options.targets};
    return trainer;
  },
  ml:{},
  predict: function (model,sample) {
    var options = model.options;
    var vol = new convnetjs.Vol(options.width, options.height, options.depth, 0.0); //input volume (image)
    vol.w = sample;
    return model.net.forward(vol);
  },
  print: function () {
  },
  update: function (data) {
  },
  current:function (module) { current=module.current; Aios=module;}
};
