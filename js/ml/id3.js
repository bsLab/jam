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
 **    $VERSION:     1.3.1
 **
 **    $INFO:
 **
 ** ID3 Decision Tree Algorithm supporting categorical values only
 ** Portable model
 **
 ** New
 **   predict with nn selection
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;


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

function isEqual(a,b) { return a==b }

/**
 * Predicts class for sample
 */
function predict(model,sample) {
  var root = model;
  while (root.type !== NODE_TYPES.RESULT) {
    var attr = root.name;
    var sampleVal = sample[attr];
    var childNode = Comp.array.min(root.vals, function(node) {
      if (typeof node.value == 'number' && typeof sampleVal == 'number')  
        return Math.pow(node.value - sampleVal,2);
      else
        return node.value == sampleVal? 0:1;
    });
    if (childNode){
      root = childNode.child;
    } else {
      root = root.vals[0].child;
    }
  }
  return root.value;
};

/**
 * Evalutes prediction accuracy on samples
 */
function evaluate(model,target,samples) {

   var total = 0;
   var correct = 0;

   Comp.array.iter(samples, function(s) {
     total++;
     var pred = predict(model,s);
     var actual = s[target];
     if (isEqual(pred,actual)) {
       correct++;
     }
   });

   return correct / total;
};

/**
 * Creates a new tree
 */
function createTree(data, target, features) {
  var targets = Comp.array.unique(Comp.array.pluck(data, target));
  
  if (targets.length == 1) {
    return {
      type:   NODE_TYPES.RESULT,
      value:  targets[0],
      name:   targets[0],
      // alias: targets[0] + randomUUID()
    };
  }

  if (features.length == 0) {
    var topTarget = mostCommon(targets);
    return {
      type:   NODE_TYPES.RESULT,
      value:  topTarget,
      name:   topTarget,
      // alias: topTarget + randomUUID()
    };
  }

  var bestFeature = maxGain(data, target, features);
  var remainingFeatures = Comp.array.without(features, bestFeature);
  var possibleValues = Comp.array.unique(Comp.array.pluck(data, bestFeature));

  var node = {
    name: bestFeature,
    // alias: bestFeature + randomUUID()
  };

  node.type = NODE_TYPES.FEATURE;
  node.vals = Comp.array.map(possibleValues, function(v) {
    var _newS = data.filter(function(x) {
      return x[bestFeature] == v
    });

    var child_node = {
      value: v,
      // alias: v + randomUUID(),
      type: NODE_TYPES.FEATURE_VALUE
    };

    child_node.child = createTree(_newS, target, remainingFeatures);
    return child_node;
  });

  return node;
}

/**
 * Computes Max gain across features to determine best split
 * @private
 */
function maxGain(data, target, features) {
  var gains=[];
  var maxgain= Comp.array.max(features, function(element) {
    var g = gain(data, target, element);
    gains.push(element+':'+g);
    return g;
  });
  return maxgain;
}

/**
 * Computes entropy of a list
 * @private
 */
function entropy(vals) {
  var uniqueVals = Comp.array.unique(vals);
  var probs = uniqueVals.map(function(x) {
    return prob(x, vals)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(function(a, b) {
    return a + b
  }, 0);
}

/**
 * Computes gain
 * @private
 */
function gain(data, target, feature) {
  var attrVals = Comp.array.unique(Comp.array.pluck(data, feature));
  var setEntropy = entropy(Comp.array.pluck(data, target));
  var setSize = data.length;

  var entropies = attrVals.map(function(n) {
    var subset = data.filter(function(x) {
      return x[feature] === n
    });

    return (subset.length / setSize) * entropy(Comp.array.pluck(subset, target));
  });

  // var entropyData = entropyV(Comp.array.pluck(data, feature),eps);
  // console.log('Feat '+feature+':'+entropyData);
  var sumOfEntropies = entropies.reduce(function(a, b) {
    return a + b
  }, 0);
  return setEntropy - sumOfEntropies;
}

/**
 * Computes probability of of a given value existing in a given list
 * @private
 */
function prob(value, list) {
  var occurrences = Comp.array.filter(list, function(element) {
    return element === value
  });

  var numOccurrences = occurrences.length;
  var numElements = list.length;
  return numOccurrences / numElements;
}

/**
 * Computes Log with base-2
 * @private
 */
function log2(n) {
  return Math.log(n) / Math.log(2);
}

/**
 * Finds element with highest occurrence in a list
 * @private
 */
function mostCommon(list) {
  var elementFrequencyMap = {};
  var largestFrequency = -1;
  var mostCommonElement = null;

  list.forEach(function(element) {
    var elementFrequency = (elementFrequencyMap[element] || 0) + 1;
    elementFrequencyMap[element] = elementFrequency;

    if (largestFrequency < elementFrequency) {
      mostCommonElement = element;
      largestFrequency = elementFrequency;
    }
  });

  return mostCommonElement;
}

/**
 * Generates random UUID
 * @private
 */
function randomUUID() {
  return "_r" + Math.random().toString(32).slice(2);
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


function print(model,indent) {
  var NL = '\n',
      line='',sep,
      sp = function () {return Comp.string.create(indent);};
  if (indent==undefined) indent=0;
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return ' -> '+model.name;
    case NODE_TYPES.FEATURE:
      line=NL+sp()+'($'+model.name+'?'+NL;
      sep='';
      Comp.array.iter(model.vals,function (v) {
        line += sep+print(v,indent+2)+NL;
        sep='';
      }); 
      return line+sp()+')';
    case NODE_TYPES.FEATURE_VALUE: 
      return sp()+model.value+':'+print(model.child,indent+2);   
  }
  return 0;
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

module.exports =  {
  NODE_TYPES:NODE_TYPES,
  createTree:createTree,
  depth:depth,
  entropy:entropy,
  evaluate:evaluate,
  info:info,
  predict:predict,
  print:print,
  current:function (module) { current=module.current; Aios=module;}
};

