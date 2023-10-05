global.TOP='/home/sbosse/proj/jam/js';
require(TOP+'/top/module')([process.cwd(),TOP]);
var Comp = Require('com/compat');
var Io = Require('com/io');
var Aios = Require('jam/aios');
var Db = Require('db/db');
var Fs = require('fs');
var db = Db.Sqlc('/tmp/sqld',1);
var Ml = Require('ml/ml');
var ml = Ml.agent;
var _ = Require('ml/lodash');

var repl;
db.init();
var datasets=[0,1,2,3,4,5];
var features=[];
var eps=10;
var class_name='load';
var roid = 1;
var roi0 = {x:3,y:4};

var dataset=0;
var training_data=[];
var model;
//console.log(ml.entropy([31,11,10],10));

function entropyEps(vals,eps) {
  var uniqueVals = _.unique(vals);
  var probs = uniqueVals.map(function(x) {
    return probEps(x, vals, eps)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(function(a, b) {
    return a + b
  }, 0);
}

// with additional 2*epsilon interval, only applicable to numerical values
function probEps(value, list, eps) {
  var occurrences = _.filter(list, function(element) {
    return (element >= (value-eps)) && (element <= (value+eps));
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


var NODE_TYPES = {
  RESULT: 'result',
  FEATURE: 'feature',
  FEATURE_RANGE: 'feature_range',
  FEATURE_VALUE: 'feature_value'
};

function Result(key) {
  return {
    type:NODE_TYPES.RESULT,
    name:key
  }
}

function Feature(name,vals) {
  return {
    type:NODE_TYPES.FEATURE,
    name:name,
    vals:vals
  }
}

// A value can be a scalar or a range {a,b} object
function Value(val,child) {
  return {
    type:NODE_TYPES.FEATURE_VALUE,
    val:val,
    child:child
  }
}

function print(model) {
  var line='',sep;
  if (!model) return '';
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return ' -> '+model.name;
    case NODE_TYPES.FEATURE:
      line='('+model.name+'?';
      sep='';
      Comp.array.iter(model.vals,function (v) {
        line += sep+print(v);
        sep=',';
      }); 
      return line+')';
    case NODE_TYPES.FEATURE_VALUE: 
      return ' '+(model.val.a==undefined?model.val:'['+model.val.a+','+model.val.b+']')+
                 ':'+print(model.child);   
  }
  return 'model?';
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

function addVal(v1,v2) {
  return v1+v2; // TODO
}

function lowerBound(v) {
  if (v.a==undefined) return v; else return v.a;
}

function upperBound(v) {
  if (v.b==undefined) return v; else return v.b;
}

function Bounds(vl,v) {
  if (vl.length==0) return {a:v,b:v};
  else if (v==undefined) return {a:Min(vl),b:Max(vl)};
  else return {a:Min([Min(vl),v]),b:Max([Max(vl),v])};
}

function overlap(v1,v2) {
  return (upperBound(v1) >= lowerBound(v2) && upperBound(v1) <= upperBound(v2)) ||
         (upperBound(v2) >= lowerBound(v1) && upperBound(v2) <= upperBound(v1))
}

function containsVal(vl,v) {
  for (var i in vl) {
    var v2=vl[i];
    if (overlap(v,v2)) return true;
  }
  return false;
}

function Min(vals) {
  var min=none;
  Comp.array.iter(vals,function (val) {
    if (min==none) min=(val.a==undefined?val:val.a);
    else min=val.a==undefined?(val<min?val:min):(val.a<min?val.a:min);
  });
  return min;
}

function Max(vals) {
  var max=none;
  Comp.array.iter(vals,function (val) {
    if (max==none) max=(val.b==undefined?val:val.b);
    else max=(val.b==undefined?(val>max?val:max):(val.b>max?val.a:max));
  });
  return max;
}

function centerVal(v) {
  if (v.a==undefined) return v; else return (v.a+v.b)/2;
}

function distanceVal (v1,v2) {
  return Math.abs(centerVal(v1)-centerVal(v2));
}


function getBestFeatures(data,target,features,eps) {
  var bestfeatures=[];
  function deviation(vals) {
    var n = vals.length;
    var mu=Comp.array.sum(vals,function (val) {
      return (lowerBound(val)+upperBound(val))/2;
    })/n;
    var dev=Comp.array.sum(vals,function (val) {
      return Math.pow(((lowerBound(val)+upperBound(val))/2)-mu,2);
    })/n;
    return dev;
  }
  for (var feature in features) {
    var vals=_.pluck(data, features[feature]);
    var e = entropyEps(vals,eps);
    var d = deviation(vals);
    var min = Min(vals);
    var max = Max(vals);
    bestfeatures.push({e:e,d:d,range:{a:min,b:max},name:features[feature]});
  }
  bestfeatures.sort(function (ef1,ef2) {
    if (ef1.e > ef2.e) return -1; else return 1;
  });
  return bestfeatures;
}

function getPossibleValues(data,feature) {
  return Comp.array.sort(_.pluck(data, feature), function (x,y) {
    if (upperBound(x) < lowerBound(y)) return -1; else return 1; // increasing value order
  });
}

function add_training_set(set) {
  // Merge a data set with an existing for a specific key; create value ranges
  training_data.push(set);  
} 

function partitionVals(vals,eps) {
  var last=none;
  var partitions=[];
  var partition=[];
  for(var i in vals) {
    var val0=vals[i];
    var val1=vals[i-1];

    if (val1==undefined) partition.push(val0);
    else if ( upperBound(val0) < upperBound(addVal(val1,2*eps))) partition.push(val0);    
    else {
      partitions.push(partition);
      partition=[val0];
    }
  }
  if (partition.length>0) partitions.push(partition);
  return partitions;
}

/**
 * Creates a new tree
 */
function createTree(data, target, features, eps) {
  var _newS,child_node,bounds;
  
  var targets = _.unique(_.pluck(data, target));
  var classes = _.unique(_.pluck(training_data, class_name));

  console.log(data);
  console.log(features);
  
  // Aios.aios.log('createTree:'+targets.length);
  if (targets.length == 1) return Result(targets[0]);

  if (features.length == 0) {
    var topTarget = mostCommon(targets);
    return Result(topTarget)
  }
  var bestFeatures = getBestFeatures(data, target, features, eps);
  var bestFeature = bestFeatures[0];
  var remainingFeatures = Comp.array.filtermap(bestFeatures,function (feat) {
    if (feat.name!=bestFeature.name) return feat.name;
    else return none;
  });
  var possibleValues = getPossibleValues(data,bestFeature.name);
  var vals=[];
  
  var partitions=partitionVals(possibleValues,eps);

  console.log(partitions);
  console.log(bestFeatures);
  //console.log(possibleValues);
  if (partitions.length==1) {
    // no further 2*eps separation possible, find best feature by largest distance
    // resort beat feature list with respect to value deviation
    bestFeatures.sort(function (ef1,ef2) {
      if (ef1.d > ef2.d) return -1; else return 1;
    });
    bestFeature = bestFeatures[0];
    possibleValues = getPossibleValues(data,bestFeature.name);
    Comp.array.iter(possibleValues,function (val,i) {

      _newS = data.filter(function(x) {
        console.log(x[bestFeature.name],val,overlap(val,x[bestFeature.name]))
        
        return overlap(val,x[bestFeature.name]);
      });
      child_node = Value(val);
      child_node.child = createTree(_newS, target, remainingFeatures, eps);
      //console.log(_newS);
      vals.push(child_node);
    })    
    
  } else Comp.array.iter(partitions,function (partition,i) {
    
    _newS = data.filter(function(x) {
      // console.log(x[bestFeature.name],v,overlap(x[bestFeature.name],v))
      return containsVal(partition,x[bestFeature.name]);
    });
    bounds = Bounds(partition);
    child_node = Value(eps==0?v:{a:bounds.a-eps,b:bounds.b+eps});
    child_node.child = createTree(_newS, target, remainingFeatures, eps);
    //console.log(_newS);
    vals.push(child_node);
  });
  
  return Feature(bestFeature.name,vals);
}

function depth(model) {
  switch (model.type) {
    case NODE_TYPES.RESULT: return 0;
    case NODE_TYPES.FEATURE: 
      return 1+Comp.array.max(model.vals,function (val) {
        return depth(val);
      });
    case NODE_TYPES.FEATURE_VALUE: 
      return depth(model.child);   
  }
  return 0;
}

function results(model) {
  var line='',sep;
  if (!model) return '';
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return model.name;
    case NODE_TYPES.FEATURE:
      sep='';
      line='';
      Comp.array.iter(model.vals,function (v) {
        line += sep+results(v);
        sep=',';
      }); 
      return line;
    case NODE_TYPES.FEATURE_VALUE: 
      return results(model.child);   
  }
  return 'result?';
}


function nearestVal(vals,sample,fun) {
  var best=none;
  for (var v in vals) {
    var d=fun?distanceVal(fun(vals[v]),sample):distanceVal(vals[v],sample);
    if (best==none) 
      best={v:vals[v],d:d};
    else if (best.d > d)
      best={v:vals[v],d:d};    
  }
  if (best) return best.v;
  else return none;
}

function predict(model,sample) {
  var root = model;
  while (root && root.type !== NODE_TYPES.RESULT) {
    var attr = root.name;
    var sampleVal = sample[attr];
    var childNode = nearestVal(root.vals,sampleVal,function (node) {
      return node.val;
    });

    if (childNode){
      root = childNode.child;
    } else {
      root = none;
    }
  }
  if (root) return root.name||root.val;
  else return none;
};

var datasets=[];
var noise=function () {
  return Comp.random.range(-eps/2,eps/2);
};

for (dataset=0;dataset<=5;dataset++) {
  var training_set={};
  var data={};
  var matA = db.readMatrix('sensorsA'+dataset);
  var matB = db.readMatrix('sensorsB'+dataset);
  var matAs = Aios.aios.matrix(3,3);
  var matBs = Aios.aios.matrix(3,3);

  var n=0;
  features=[];
  for (j = roi0.y-roid;j <= (roi0.y+roid);j++) {
    for (i = roi0.x-roid;i <= (roi0.x+roid);i++) {
      matAs[j-(roi0.y-roid)][i-(roi0.x-roid)]=matA[j][i];
      matBs[j-(roi0.y-roid)][i-(roi0.x-roid)]=matB[j][i];
      training_set['A'+n]=matA[j][i]+noise();
      training_set['B'+n]=matB[j][i]+noise();
      data['A'+n]=matA[j][i]+noise();
      data['B'+n]=matB[j][i]+noise();
      features.push('A'+n);
      features.push('B'+n);
      n++;
    }
  }
  training_set[class_name]='L'+dataset;
  add_training_set(training_set);
  datasets.push(data);
}
//console.log(training_data);
var bestfeatures=getBestFeatures(training_data, class_name, features, eps);;
var classes=_.unique(_.pluck(training_data, class_name));
var model = createTree(training_data,class_name,features,eps);
console.log(print(model));
console.log(depth(model));
console.log(results(model));
console.log(predict(model,datasets[0]));
console.log(predict(model,datasets[1]));
console.log(predict(model,datasets[2]));
console.log(predict(model,datasets[3]));
console.log(predict(model,datasets[4]));
console.log(predict(model,datasets[5]));
