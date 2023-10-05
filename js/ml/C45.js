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
 **    $AUTHORS:     ?, Stefan Bosse
 **    $INITIAL:     (C) ?
 **    $MODIFIED:    (C) 2006-2018 bLAB by sbosse
 **    $VERSION:     1.1.6
 **
 **    $INFO:
 **
 ** C45 Decision Tree ML Algorithm
 **
 ** Portable model
 **
 **    $ENDOFINFO
 */
'use strict';
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;

var NODE_TYPES = {
  RESULT: 'result',
  FEATURE_NUMBER: 'feature_number',     // Number value node (cut split)
  FEATURE_VALUE: 'feature_value',       // Category value
  FEATURE_CATEGORY: 'feature_category'  // Symbolic variable node (split)
};

function unique(col) {
  var u = {}, a = [];
  for(var i = 0, l = col.length; i < l; ++i){
    if(u.hasOwnProperty(col[i])) {
      continue;
    }
    a.push(col[i]);
    u[col[i]] = 1;
  }
  return a;
}

function find(col, pred) {
  var value;
  col.forEach(function(item) {
    var result = pred(item);
    if (result) {
      value = item;
    }
  });
  return value;
}

function max(array, fn) {
  var max = -Infinity;
  var index;
  for (var i = 0; i < array.length; i++) {
    var result = fn(array[i]);
    if (result >= max) {
      max = result;
      index = i;
    }
  }
  return typeof index !== 'undefined' ? array[index] : max;
}

function sortBy(col, fn) {
 col = [].slice.call(col);
 return col.sort(fn);
}

var C45 = {
  create: function () {
    return {
      features : [],
      targets: [],
      model: null
    }
  },
  /**
   * train
   *
   * @param {object} options
   * @param {array} options.data - training data
   * @param {string} options.target - class label
   * @param {array} options.features - features names
   * @param {array} options.featureTypes - features type (ie 'category', 'number')
   */
  train: function(model,options) {
    var data = options.data,
        target = options.target,
        features = options.features,
        featureTypes = options.featureTypes;
    featureTypes.forEach(function(f) {
      if (['number','category'].indexOf(f) === -1) {
        throw new Error('C4.5: Unrecognized option!');
      }
    });

    var targets = unique(data.map(function(d) {
      return d[d.length-1];
    }));
    
    model.features = features;
    model.targets = targets;
    // model is the generated tree structure
    model.model = C45._c45(model, data, target, features, featureTypes, 0);
  },

  _c45: function(model, data, target, features, featureTypes, depth) {
    var targets = unique(data.map(function(d) {
      return d[d.length-1];
    }));

    if (!targets.length) {
      return {
        type: 'result',
        value: 'none data',
        name: 'none data'
      };
    }

    if (targets.length === 1) {
      return {
        type: 'result',
        value: targets[0],
        name: targets[0]
      };
    }

    if (!features.length) {
      var topTarget = C45.mostCommon(targets);
      return {
        type: 'result',
        value: topTarget,
        name: topTarget
      };
    }

    var bestFeatureData = C45.maxGain(model, data, target, features, featureTypes);
    var bestFeature = bestFeatureData.feature;

    var remainingFeatures = features.slice(0);
    remainingFeatures.splice(features.indexOf(bestFeature), 1);

    if (featureTypes[model.features.indexOf(bestFeature)] === 'category') {
      var possibleValues = unique(data.map(function(d) {
        return d[model.features.indexOf(bestFeature)];
      }));
      var node = {
        name: bestFeature,
        type: 'feature_category',
        values: possibleValues.map(function(v) {
          var newData = data.filter(function(x) {
            return x[model.features.indexOf(bestFeature)] === v;
          });
          var childNode = {
            name: v,
            type: 'feature_value',
            child: C45._c45(model, newData, target, remainingFeatures, featureTypes, depth+1)
          };
          return childNode;
        })
      };
    } else if (featureTypes[model.features.indexOf(bestFeature)] === 'number') {
      var possibleValues = unique(data.map(function(d) {
        return d[model.features.indexOf(bestFeature)];
      }));
      var node = {
        name: bestFeature,
        type: 'feature_number',
        cut: bestFeatureData.cut,
        values: []
      };

      var newDataRight = data.filter(function(x) {
        return parseFloat(x[model.features.indexOf(bestFeature)]) > bestFeatureData.cut;
      });
      var childNodeRight = {
        name: bestFeatureData.cut.toString(),
        type: 'feature_value',
        child: C45._c45(model, newDataRight, target, remainingFeatures, featureTypes, depth+1)
      };
      node.values.push(childNodeRight);

      var newDataLeft = data.filter(function(x) {
        return parseFloat(x[model.features.indexOf(bestFeature)]) <= bestFeatureData.cut;
      });
      var childNodeLeft = {
        name: bestFeatureData.cut.toString(),
        type: 'feature_value',
        child: C45._c45(model, newDataLeft, target, remainingFeatures, featureTypes, depth+1),
      };
      node.values.push(childNodeLeft);
    }
    return node;
  },


  classify: function (model,sample) {
    // root is feature (attribute) containing all sub values
    var childNode, featureName, sampleVal;
    var root = model.model;

    if (typeof root === 'undefined') {
      callback(new Error('model is undefined'));
    }

    while (root.type != NODE_TYPES.RESULT) {

      if (root.type == NODE_TYPES.FEATURE_NUMBER) {
        // feature number attribute
        featureName = root.name;
        sampleVal = parseFloat(sample[featureName]);
        if (sampleVal <= root.cut) {
          childNode = root.values[1];
        } else {
          childNode = root.values[0];
        }
      } else if (root.type == NODE_TYPES.FEATURE_CATEGORY) {
        // feature category attribute
        featureName = root.name;
        sampleVal = sample[featureName];

        // sub value , containing n childs
        childNode = find(root.values, function(x) {
          return x.name === sampleVal;
        });
      }

      // non trained feature
      if (typeof childNode === 'undefined') {
        return 'unknown';
      }
      root = childNode.child;
    }
    return root.value;
  },

  conditionalEntropy: function(model, data, feature, cut, target) {
    var subset1 = data.filter(function(x) {
      return parseFloat(x[model.features.indexOf(feature)]) <= cut;
    });
    var subset2 = data.filter(function(x) {
      return parseFloat(x[model.features.indexOf(feature)]) > cut;
    });
    var setSize = data.length;
    return subset1.length/setSize * C45.entropy(model,
      subset1.map(function(d) {
        return d[d.length-1];
      })
    ) + subset2.length/setSize*C45.entropy(model,
      subset2.map(function(d) {
        return d[d.length-1];
      })
    );
  },

  count: function(target, targets) {
    return targets.filter(function(t) {
      return t === target;
    }).length;
  },

  entropy: function(model, vals) {
    var uniqueVals = unique(vals);
    var probs = uniqueVals.map(function(x) {
      return C45.prob(x, vals);
    });
    var logVals = probs.map(function(p) {
      return -p * C45.log2(p);
    });
    return logVals.reduce(function(a, b) {
      return a + b;
    }, 0);
  },

  gain: function(model, data, target, features, feature, featureTypes) {
    var setEntropy = C45.entropy(model, data.map(function(d) {
      return d[d.length-1];
    }));
    if (featureTypes[model.features.indexOf(feature)] === 'category') {
      var attrVals = unique(data.map(function(d) {
        return d[model.features.indexOf(feature)];
      }));
      var setSize = data.length;
      var entropies = attrVals.map(function(n) {
        var subset = data.filter(function(x) {
          return x[feature] === n;
        });
        return (subset.length/setSize) * C45.entropy(model,
          subset.map(function(d) {
            return d[d.length-1];
          })
        );
      });
      var sumOfEntropies = entropies.reduce(function(a, b) {
        return a + b;
      }, 0);
      return {
        feature: feature,
        gain: setEntropy - sumOfEntropies,
        cut: 0
      };
    } else if (featureTypes[model.features.indexOf(feature)] === 'number') {
      var attrVals = unique(data.map(function(d) {
        return d[model.features.indexOf(feature)];
      }));
      var gainVals = attrVals.map(function(cut) {
        var cutf = parseFloat(cut);
        var gain = setEntropy - C45.conditionalEntropy(model, data, feature, cutf, target);
        return {
            feature: feature,
            gain: gain,
            cut: cutf
        };
      });
      var maxgain = max(gainVals, function(e) {
        return e.gain;
      });
      return maxgain;
    }
  },

  log2: function(n) {
    return Math.log(n) / Math.log(2);
  },
  
  maxGain: function(model, data, target, features, featureTypes) {
    var g45 = features.map(function(feature) {
      return C45.gain(model, data, target, features, feature, featureTypes);
    });
    return max(g45, function(e) {
      return e.gain;
    });
  },


  mostCommon: function(targets) {
    return sortBy(targets, function(target) {
      return C45.count(target, targets);
    }).reverse()[0];
  },

  /** Print the tree
  *
  */
  print: function (model,indent) {
    var NL = '\n',
        line='',sep;
    if (indent==undefined) indent=0;
    if (!model) return '';
    var sp = function () {return Comp.string.create(indent);};
    switch (model.type) {
      case NODE_TYPES.RESULT: 
        return sp()+'-> '+model.name+NL;
      case NODE_TYPES.FEATURE_CATEGORY:
        line=sp()+'$'+model.name+'?'+NL;
        Comp.array.iter(model.values,function (v) {
          line += C45.print(v,indent+2);
        }); 
        return line;
      case NODE_TYPES.FEATURE_NUMBER:
        line = sp()+'$'+model.name+'>'+model.cut+'?'+NL;
        if (model.values[0].type==NODE_TYPES.FEATURE_VALUE)
          line = line+C45.print(model.values[0].child,indent+2);
        else
          line = line+C45.print(model.values[0],indent+2);
        line = line+sp()+'$'+model.name+'<='+model.cut+'?'+NL;
        if (model.values[0].type==NODE_TYPES.FEATURE_VALUE)
          line = line+C45.print(model.values[1].child,indent+2);
        else
          line = line+C45.print(model.values[1],indent+2);
        return line;
      case NODE_TYPES.FEATURE_VALUE:
        line=sp()+''+model.name+NL;
        line += C45.print(model.child,indent+2);
        return line;
    }
    return 'model?';
  },

  prob: function(target, targets) {
    return C45.count(target,targets)/targets.length;
  },

};

module.exports = {
  classify:C45.classify,
  create:C45.create,
  entropy:C45.entropy,
  log2:C45.log2,
  print:function (model,indent) { return C45.print(model.model,indent) },
  unique:unique,
  train:C45.train,
  current:function (module) { current=module.current; Aios=module;}  
}
