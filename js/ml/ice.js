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
 **    $AUTHORS:     Ankit Kuwadekar, Stefan Bosse
 **    $INITIAL:     (C) 2014, Ankit Kuwadekar
 **    $MODIFIED:    (C) 2006-2018 bLAB by sbosse
 **    $VERSION:     1.3.2
 **
 **    $INFO:
 **
 ** ICE: C45/ID3 Decision Tree Algorithm supporting feature variables with eps intervals
 **
 ** Portable model
 **
 ** New:
 **        typeof eps = number | [epsx1:number,epsx2:number,..]
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;
var that;

/**
 * Map of valid tree node types
 * @constant
 * @static
 */
var NODE_TYPES = {
  RESULT: 'result',
  FEATURE: 'feature',
  FEATURE_VALUE: 'feature_value'
};

var NL ='\n'

/**
 * Creates a new tree
 */
function createTree(data, target, features, eps) {
  var ml = that.ml;
  var targets = ml.stats.unique(ml.stats.utils.column(data, target));
  if (targets.length == 1) {
    return {
      type: NODE_TYPES.RESULT,
      name: targets[0],
    };
  }

  if (features.length == 0) {
    var topTarget = ml.stats.mostCommon(targets);
    return {
      type: NODE_TYPES.RESULT,
      name: topTarget,
    };
  }

  
  var split = ml.stats.splitEps(data,features,target,targets,eps);
  var bestFeature = split.feature;
  var index = features.indexOf(bestFeature);
  var remainingFeatures = split.remainingFeatures;
  var remainingEps = 
    typeof eps == 'number'?eps:remainingFeatures.map(function (v) { return eps[features.indexOf(v)] });
  var possibleValues = split.possibleValues;

  var node = {
    type: NODE_TYPES.FEATURE,
    name: bestFeature,
    index: index,
    eps: that.ml.stats.utils.selectEps(eps,index)
  };

  node.vals = split.choices.map(function (c) {
    var child_node = {
      val : c.val,
      eps : that.ml.stats.utils.selectEps(eps,index),
      type: NODE_TYPES.FEATURE_VALUE
    };

    child_node.child = createTree(c.data, target, remainingFeatures, remainingEps);
    return child_node;
    
  })
  return node;
}


function depth(model) {
  switch (model.type) {
    case NODE_TYPES.RESULT: return 1;
    case NODE_TYPES.FEATURE: 
      return 1+Comp.array.max(model.vals.map(function (val) {
        return depth(val);
      }));
    case NODE_TYPES.FEATURE_VALUE: 
      return 1+depth(model.child);   
  }
  return 0;
}

function info(model) {
  var vl = vars(model);
  return {
    depth:depth(model),
    nodes:vl.length,
    vars:vl.unique(),
  }
}

function predictEps(model,sample,prob,eps) {
  var root = model;
  if (!prob) prob=1;
  while (root.type !== NODE_TYPES.RESULT) {
    var attr = root.name;
    var sampleVal = sample[attr];
    // kNN approximation
    var childNode = null;
    root.vals.forEach(function(node) {
      var fit=Math.abs(node.val-sampleVal);
      if (!childNode || fit < childNode.fit) childNode={fit:fit,node:node};
    });
    if (childNode){
      // with fit quality propagation
      prob = prob * (1-Math.abs(childNode.fit/that.ml.stats.utils.selectEps(eps,root.index))/4) 
      root = childNode.node.child;
    } else {
      root = root.vals[0].child;
    }
  }
  return {value:root.name,prob:prob};
};


function printModel(model,indent) {
  var line='',sep;
  if (indent==undefined) indent=0;
  if (!model) return '';
  var sp = function () {var s=''; for(var i=0;i<indent;i++) s+=' '; return s};
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return sp()+'-> '+model.name+NL;
    case NODE_TYPES.FEATURE:
      line=sp()+'$'+model.name+'?'+NL;
      model.vals.forEach(function (v) {
        line += printModel(v,indent+2);
      }); 
      return line;
    case NODE_TYPES.FEATURE_VALUE: 
      line=sp()+'=['+(model.val-model.eps)+','+(model.val+model.eps)+']'+NL;
      return line+printModel(model.child,indent+2); 
  }
  return 'model?';
}

function vars(model) {
  switch (model.type) {
    case NODE_TYPES.RESULT: return [];
    case NODE_TYPES.FEATURE: 
      return [model.name].concat(Comp.array.flatten(model.vals.map(vars)));
    case NODE_TYPES.FEATURE_VALUE: 
      return vars(model.child);   
  }
  return [];
}

that = module.exports = {
  create: function (options) {
    return createTree(options.data,
                      options.target,
                      options.features,
                      options.eps)
  },
  depth:depth,
  info:info,
  ml:{},
  predict:function (model,sample) {
    return predictEps(model,sample,1,model.eps)
  },
  print:printModel,
}
