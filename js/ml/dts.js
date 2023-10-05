/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     22/04/16 by sbosse.
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 ** ID3 eps-Entropy-sigma Interval Decision Tree Algorithm for Strings
 **
 ** String ::= {c} 
 ** c ::= 'a'-'z''A'-'Z''-''*''!'
 **
 **    $ENDOFINFO
 */
var _ = Require('ml/lodash');
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


function decA(c) {
  var c,cv;
  if (c==undefined || c=='*' || c=='0' || c=='-') return 0;
  if (c=='!') return 100;
  cv=c.charCodeAt();
  if (c>='a' && c<='z') cv=cv-96; // 1..26 
  else if (c>='A' && c<='Z') cv=cv-38; // 27..52
  else cv=0;
  return cv;
}
    
/** Naive Hammer(ing) Distance of two strings (based on alg. from Mitch Anderson).
 *  0: equal
 *  >0: not equal
 * 
 */
function Distance(str1, str2) {
  var dist = 0;
  if (str1.length<str2.length) {
    var temp=str2;
    str2=str1;
    str1=temp;
  }
  for(var i = 0; i < str1.length; i++) {
    var x=decA(str1[i]);
    var y=decA(str2[i]);
    if(y != x) {
      dist += Math.abs(x - y) + Math.abs(str2.indexOf( str1[i] )) * 2;
    }
  }
  return dist;
}


/** Add a new training set with optional data set merging and value interval expansion.
 * 
 */
function add_training_set(data,set,merge) {
  if (merge) {
    // Merge a data set with an existing for a specific key; create value ranges
  } else
    data.push(set);  
} 


/** Computes entropy of a list with 2-epsilon intervals
 *
 */

function entropyEps(vals,eps) {
  // TODO: overlapping value intervals
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

/**
 * Computes probability of of a given value existing in a given list
 * with additional 2*epsilon interval, only applicable to numerical values.
 */
function probEps(value, list, eps) {
  // TODO: ranges
  var occurrences = _.filter(list, function(element) {
    var d=Distance(element);
    return (d >= (value-eps)) && (d <= (value+eps));
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
  if (v1.a!=undefined) {
    if (v2.a!=undefined) return {a:v1.a+v2.a,b:v1.b+v2.b};
    else return {a:v1.a+v2,b:v2.b+v2};
  } else if (v2.a!=undefined) return {a:v2.a+v1,b:v2.b+v1};
  else return v1+v2;
}

function lowerBound(v) {
  if (v.a==undefined) return v; else return v.a;
}

function upperBound(v) {
  if (v.b==undefined) return v; else return v.b;
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

function centerVal(v) {
  if (v.a==undefined) return v; else return (v.a+v.b)/2;
}

function distanceVal (v1,v2) {
  return Math.abs(centerVal(v1)-centerVal(v2));
}

function Bounds(vl,v) {
  if (vl.length==0) return {a:v,b:v};
  else if (v==undefined) return {a:Min(vl),b:Max(vl)};
  else return {a:Min([Min(vl),v]),b:Max([Max(vl),v])};
}

function Min(vals) {
  var min=none;
  Comp.array.iter(vals, function (val) {
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

/** Parttition an ordered set of values
 *  Each partition of values has at least 2*eps distance to the next partition.
 *
 */
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

function getPossibleVals(data,feature) {
  return Comp.array.sort(_.pluck(data, feature), function (x,y) {
    if (upperBound(x) < lowerBound(y)) return -1; else return 1; // increasing value order
  });
}

/**
 * Creates a new tree
 */
function createTree(data, target, features, eps) {
  var _newS,child_node,bounds;
  var targets = _.unique(_.pluck(data, target));

  //console.log(data);
  //console.log(features);

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
  var possibleValues = Comp.array.sort(_.pluck(data, bestFeature.name), function (x,y) {
    if (upperBound(x) < lowerBound(y)) return -1; else return 1; // increasing value order
  });
  var vals=[];
  
  //console.log(bestFeatures);
  //console.log(possibleValues);
  var partitions=partitionVals(possibleValues,eps);
  // Aios.aios.log(partitions);
  //console.log(bestFeatures);
  //console.log(possibleValues);
  if (partitions.length==1) {
    // no further 2*eps separation possible, find best feature by largest distance
    // resort beat feature list with respect to value deviation
    bestFeatures.sort(function (ef1,ef2) {
      if (ef1.d > ef2.d) return -1; else return 1;
    });
    bestFeature = bestFeatures[0];
    possibleValues = getPossibleVals(data,bestFeature.name);
    Comp.array.iter(possibleValues,function (val,i) {

      _newS = data.filter(function(x) {
        // console.log(x[bestFeature.name],val,overlap(val,x[bestFeature.name]))
        
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

/**
 * Predicts class for sample
 */
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

module.exports =  {
  NODE_TYPES:NODE_TYPES,
  createTree:createTree,
  depth:depth,
  entropy:entropyEps,
  evaluate:function evaluate(model,target,samples){},
  predict:predict,
  print:print,
  results:results,
  current:function (module) { current=module.current; Aios=module;}
};


