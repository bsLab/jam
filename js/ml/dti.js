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
 **    $INITIAL:     (C) 2006-2018 bLAB
 **    $CREATED:     03-03-16 by sbosse.
 **    $VERSION:     1.4.2
 **
 **    $INFO:
 **
 ** Interval Decision Tree Learner
 **
 ** Modified ID3-based Decision Tree Algorithm that wraps all data with 2-eps intervals and uses
 ** interval instead single value arithmetic for entropy calculation and feature selection.
 ** The classification bases on a nearest-neighbourhood look-up of best matching results.
 **
 ** Two different algorithms are supported:
 **
 **   1. Static (using learn), the DTI learner using attribute selection based on entropy.
 **      The training data must be available in advance.
 **   2. Dynamic (using update), the DTI learrner using attribute selection based on significance.
 **      The training data is applied sequentielly (stream learning) updating the model.
 **
 **   Though in principle the both algrotihms can be mixed (first static, then dynamic updating), 
 **   the resulting model will have poor classification quality. Either use static or only dynamic
 **   (stream) learning.
 **   
 ** Portable model
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;
var min = Comp.pervasives.min;
var max = Comp.pervasives.max;

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

/** Add a new training set with optional data set merging and value interval expansion.
 * 
 */
function add_training_set(data,set,merge) {
  if (merge) {
    // Merge a data set with an existing for a specific key; create value ranges
  } else
    data.push(set);  
} 


/**
 * Computes Log with base-2
 * @private
 */
function log2(n) {
  return Math.log(n) / Math.log(2);
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

function equal(v1,v2) {
  return (v1==v2 ||
          (upperBound(v1) == upperBound(v2) &&
          (lowerBound(v1) == lowerBound(v2))))
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

// Return interval of a value x with a<=x_center-eps, b>=x_center+eps
function epsVal(x,eps) {
  if (x.a == undefined) return {a:x-eps,b:x+eps};
  else if ((x.b-x.a) < 2*eps) return {a:centerVal(x)-eps,b:centerVal(x)+eps}; 
  else return x;
}
/** Filter out unique values that are spaced at least by eps
 *
 */
function uniqueEps(data,eps) {
  var results=[];
  Comp.array.iter(data,function (x) {
    var found;
    if (!results.length) results.push(x);
    else {
      Comp.array.iter(results,function (y,i) {
        if (found) return;
        found = Math.abs(centerVal(x)-centerVal(y))<eps;
        if (found) // create new overlapping value with +-eps extensions 
          results[i]={a:Min([x,y])-eps,b:Max([x,y])+eps}
      }); 
      if (!found) results.push(x);
    }
  });
  return results;
}

/** Compact tree, merge nodes and intervals.
 ** adjust=true: Adjust overlapping feature variable value intervals!!!
 */

function compactTree(model,adjust) {
  var i,j,vi,vj,_vals,merged;
  function target(model) {
    var line;
    switch (model.type) {
      case NODE_TYPES.RESULT: 
        return model.name;
      case NODE_TYPES.FEATURE:      
        line = model.name+'?'+target;
        Comp.array.iter(model.vals,function (v) {
          line += target(v);
        }); 
        return line;  
      case NODE_TYPES.FEATURE_VALUE: 
        line='='+(model.val.a==undefined?model.val:'['+model.val.a+','+model.val.b+']')+NL;
        return line+target(model.child); 
    }
  }
  if (!model) return model;
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return model;
      break;
    case NODE_TYPES.FEATURE:
      _vals=[];
      // 1. Merge
      for (i in model.vals) {
        vi=model.vals[i];
        assert((vi.type==NODE_TYPES.FEATURE_VALUE)||'vi.type==NODE_TYPES.FEATURE_VALUE');
        merged=false;
        loopj: for(j in _vals) {
          vj=_vals[j];
          if (target(vi.child)==target(vj.child)) {
            merged=true;
            vj.val={a:Min([vi.val,vj.val]),b:Max([vi.val,vj.val])}
            break loopj;
          }
        }
        if (!merged) {
          _vals.push(vi);
          vi.child=compactTree(vi.child);
        }
      }
      // 2. Adjust overlapping value intervals!
      if (adjust) {
        // TODO: approach too simple!!!! 
        for (i in _vals) {
          i=Comp.pervasives.int_of_string(i);
          if (_vals[i+1]) {
            if (upperBound(_vals[i].val) > lowerBound(_vals[i+1].val)) {
              if (_vals[i].val.b) _vals[i].val.b=lowerBound(_vals[i+1].val)-1;
              else _vals[i+1].val.a=upperBound(_vals[i].val)+1;
            }
          }
        }
      }
      
      model.vals=_vals;
      return model;
      break;
    case NODE_TYPES.FEATURE_VALUE:
      return model;
      break;
  }
}



/** Creates a new tree from training data (data)
 *
 *  data is {x1:v1,x2:v2,..,y:vn} []
 *  target is classification key name
 *  features is ['x1','x2,',..]  w/o target variable
 *  eps is interval applied to all data values
 *
 */
function createTree(data, target, features, options) {
  var _newS,child_node,bounds;
      
  var targets = Comp.array.unique(Comp.array.pluck(data, target));
  // console.log(targets)  
  if (options.maxdepth==undefined) options.maxdepth=1;
  if (options.maxdepth==0) return Result('-');
  // console.log(data);
  // console.log(features);

  //Aios.aios.log('createTree:'+targets.length);
  //try {Aios.aios.CP();} catch (e) {throw 'DTI.createTree: '+options.maxdepth };
  if (Aios) Aios.aios.CP();
  if (targets.length == 1) return Result(targets[0]);

  if (features.length == 0) {
    var topTarget = mostCommon(targets);
    return Result(topTarget)
  }
  var bestFeatures = getBestFeatures(data, target, features, options.eps);
  var bestFeature = bestFeatures[0];

  var remainingFeatures = Comp.array.filtermap(bestFeatures,function (feat) {
    if (feat.name!=bestFeature.name) return feat.name;
    else return none;
  });
/*  
  var possibleValues = Comp.array.sort(Comp.array.pluck(data, bestFeature.name), function (x,y) {
    if (upperBound(x) < lowerBound(y)) return -1; else return 1; // increasing value order
  });
*/
  var possibleValues = getPossibleVals(data,bestFeature.name);
  
  var vals=[];
  
  //console.log(bestFeatures);
  //console.log(possibleValues);
  var partitions=partitionVals(possibleValues,options.eps);
  // Aios.aios.log(partitions);
  //console.log(bestFeatures);
  //console.log(possibleValues);
  if (partitions.length==1) {
    // no further 2*eps separation possible, find best feature by largest distance
    // resort best feature list with respect to value deviation
    bestFeatures.sort(function (ef1,ef2) {
      if (ef1.d > ef2.d) return -1; else return 1;
    });
    bestFeature = bestFeatures[0];
    possibleValues = getPossibleVals(data,bestFeature.name);
    Comp.array.iter(mergeVals(possibleValues),function (val,i) {

      _newS = data.filter(function(x) {
        // console.log(x[bestFeature.name],val,overlap(val,x[bestFeature.name]))
        
        return overlap(val,x[bestFeature.name]);
      });
      child_node = Value(val);
      options.maxdepth--;
      child_node.child = createTree(_newS, target, remainingFeatures, options);
      //console.log(_newS);
      vals.push(child_node);
    })    
    
  } else Comp.array.iter(partitions,function (partition,i) {
    
    _newS = data.filter(function(x) {
      // console.log(x[bestFeature.name],v,overlap(x[bestFeature.name],v))
      return containsVal(partition,x[bestFeature.name]);
    });
    bounds = Bounds(partition);
    child_node = Value(options.eps==0?{a:bounds.a,b:bounds.b}:{a:bounds.a-options.eps,b:bounds.b+options.eps});
      options.maxdepth--;
    child_node.child = createTree(_newS, target, remainingFeatures, options);
    //console.log(_newS);
    vals.push(child_node);
  });
  
  return Feature(bestFeature.name,vals);
}

/** Return the depth of the tree
 *
 */
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

/** Computes entropy of a list with 2-epsilon intervals
 *
 */

function entropyEps(vals,eps) {
  // TODO: overlapping value intervals
  var uniqueVals = Comp.array.unique(vals);
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

function entropyEps2(vals,eps) {
  // TODO: overlapping value intervals
  var uniqueVals = uniqueEps(vals,eps);
  var probs = uniqueVals.map(function(x) {
    return probEps2(x, vals, eps)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(function(a, b) {
    return a + b
  }, 0);
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
    if (features[feature]==undefined) throw 'DTI.getBestFeatures: invalid feature vector';
    var vals=Comp.array.pluck(data, features[feature]).map(function (val) {return val==undefined?0:val});
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

/** Find in one data set the most significant feature variable (i.e., with highest value)
 */
function getSignificantFeature(data,features) {
  var f,sig;
  for (f in features) {
    if (sig==undefined || sig.val < data[features[f]]) sig={name:features[f],val:data[features[f]]};
  }
  return sig;
}

function getPossibleVals(data,feature) {
  return Comp.array.sort(Comp.array.pluck(data, feature), function (x,y) {
    if (upperBound(x) < lowerBound(y)) return -1; else return 1; // increasing value order
  });
}

/** Merge values and intervals
 */
function mergeVals(vals) {
  var _vals,
      merged,i,j;
  for (i in vals) {
    var vi = vals[i];
    if (!_vals) _vals=[vi];
    else {
      // Find overlapping values and merge
      merged=false;
      loopj: for (j in _vals) {
        var vj = _vals[j];
        if (equal(vi,vj)) {
          merged=true;
          break loopj;          
        }
        else if (overlap(vi,vj)) {
          merged=true;
          _vals[j]={a:Min([vi,vj]),b:Max([vi,vj])};
          break loopj;
        }
      }
      if (!merged) _vals.push(vi);
    }
  }
  //Aios.aios.log(_vals);
  return _vals||[];
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

/** Make a predicition with sample data
 *
 */
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

/** Print the tree
 *
 */
function print(model,indent, compact) {
  var line='',sep;
  if (compact) return results(model);
  if (indent==undefined) indent=0;
  if (!model) return '';
  var sp = function () {return Comp.string.create(indent);};
  switch (model.type) {
    case NODE_TYPES.RESULT: 
      return sp()+'-> '+model.name+NL;
    case NODE_TYPES.FEATURE:
      line=sp()+'$'+model.name+'?'+NL;
      Comp.array.iter(model.vals,function (v) {
        line += print(v,indent+2);
      }); 
      return line;
    case NODE_TYPES.FEATURE_VALUE: 
      line=sp()+'='+(model.val.a==undefined?model.val:'['+model.val.a+','+model.val.b+']')+NL;
      return line+print(model.child,indent+2); 
  }
  return 'model?';
}

/**
 * Computes probability of of a given value existing in a given list
 * with additional 2*epsilon interval, only applicable to numerical values.
 */
function probEps(value, list, eps) {
  // TODO: ranges
  var occurrences = Comp.array.filter(list, function(element) {
    return (element >= (value-eps)) && (element <= (value+eps));
  });

  var numOccurrences = occurrences.length;
  var numElements = list.length;
  return numOccurrences / numElements;
}

function probEps2(value, list, eps) {
  // TODO: ranges
  var occurrences = Comp.array.filter(list, function(element) {
    return overlap(epsVal(value), epsVal(element));
  });

  var numOccurrences = occurrences.length;
  var numElements = list.length;
  return numOccurrences / numElements;
}

/** Incremental update of the model with new training set(s). Can be executed with an empty model.
 *  The current tree can be week for a new training set (new target).
 *  This can result in a classification of the new target with insignificant variables.
 *  Therefore, the last tree node must be exapnded with an additional strong (most significant)
 *  variable of the new data set (but it is still a heuristic for future updates). 
 */
function updateTree(model,data, target, features, options) {
  var eps = options.eps,
      maxdepth = options.maxdepth,
      verbose = options.verbose;
  var featuresINm={},   // All current tree feature variables and their value interval
      results=[],       // All current tree result leafs
      set,i,v,feature,remainingFeatures,exists,sigFeature;
  // 1. Analysis of existing model
 
  var analyze = function (model,feature) {
    var feature2;
    if (!model) return;
    switch (model.type) {
      case NODE_TYPES.RESULT:
        if (!Comp.array.contains(results,model.name)) results.push(model.name); 
        break;
      case NODE_TYPES.FEATURE:
        feature2={name:model.name};
        if (!featuresINm[model.name]) featuresINm[model.name]=feature2;
        Comp.array.iter(model.vals,function (v) { analyze(v,featuresINm[model.name]) });
        break;
      case NODE_TYPES.FEATURE_VALUE:
        if (!feature.val) feature.val={
          a:(model.val.a==undefined?model.val:model.val.a),
          b:(model.val.a==undefined?model.val:model.val.b)
        }; else {
          feature.val.a=min(feature.val.a,
                            (model.val.a==undefined?model.val:model.val.a));
          feature.val.b=max(feature.val.b,
                            (model.val.a==undefined?model.val:model.val.b));
        }                  
        analyze(model.child);
        break; 
    }   
  }

  
  analyze(model);
  // console.log(featuresINm);
  // console.log(results);
  
  exists=Comp.array.contains(results,data[target]);

  
  // 2a. Empty model, add first training set with two significant feature variable nodes
  function init(set) {
    set=data[i];
      sigFeature1=getSignificantFeature(set,features);
      remainingFeatures=Comp.array.filter(features,function (feat) {
        return sigFeature1.name!=feat;
      });
      sigFeature2=getSignificantFeature(set,remainingFeatures);

      featuresINm[sigFeature1.name]={name:sigFeature1.name,
                                    val:{a:sigFeature1.val-eps,b:sigFeature1.val+eps}};
      featuresINm[sigFeature2.name]={name:sigFeature2.name,
                                    val:{a:sigFeature2.val-eps,b:sigFeature2.val+eps}};
      results.push(set[target]);
      model=Feature(sigFeature1.name,[
                    Value({a:set[sigFeature1.name]-eps,b:set[sigFeature1.name]+eps},
                          Feature(sigFeature2.name,[
                                 Value({a:sigFeature2.val-eps,b:sigFeature2.val+eps},
                                       Result(set[target])) 
                                  ]))]);
      return model;
  }
  
  remainingFeatures=Comp.array.filter(features,function (feat) {
    return !featuresINm[feat];
  });
  
  // 2b. Update the tree with the new training set
  var update = function (model,set,feature) {
    var feature2,p;
    if (!model) return;
    switch (model.type) {
    
      case NODE_TYPES.RESULT:
        if (model.name != set[target] && verbose)
          console.log('Cannot insert new training set '+set[target]+' in tree. No more separating variables!');
        break;
        
      case NODE_TYPES.FEATURE:
        // console.log(set[target]+': '+ model.name+'='+set[model.name]);
        if (set[model.name]<(featuresINm[model.name].val.a-eps) ||
            set[model.name]>(featuresINm[model.name].val.b+eps)) {
          // add new training set; done
          // the current decision tree can  be week, thus add another strong variable node, too! 
          sigFeature=getSignificantFeature(set,remainingFeatures);
          featuresINm[sigFeature.name]={name:sigFeature.name,
                                        val:{a:sigFeature.val-eps,b:sigFeature.val+eps}};
          featuresINm[model.name].val.a=min(featuresINm[model.name].val.a,set[model.name]-eps);
          featuresINm[model.name].val.b=max(featuresINm[model.name].val.b,set[model.name]+eps);
          if (!Comp.array.contains(results,set[target])) results.push(set[target]);

          model.vals.push(Value({a:set[model.name]-eps,b:set[model.name]+eps},
                          Feature(sigFeature.name,[
                            Value({a:sigFeature.val-eps,b:sigFeature.val+eps},
                                  Result(set[target]))
                          ])));
          model.vals=Comp.array.sort(model.vals,function (v1,v2) {return (lowerBound(v1.val)<lowerBound(v2.val))?-1:1});  
        } else {
          // go deeper, but extend the interval of the best matching child node with new data variable
          Comp.array.iter_break(model.vals,function (fv) {
            // console.log(model.name,fv.val,overlap(fv.val,{a:set[model.name]-eps,b:set[model.name]+eps})) 
            if (overlap(fv.val,{a:set[model.name]-eps,b:set[model.name]+eps})) {
              fv.val.a=min(lowerBound(fv.val),set[model.name]-eps);
              fv.val.b=max(upperBound(fv.val),set[model.name]+eps);
              update(fv,set,model.name);
              return true;
            } else return false;
          });
        }
        break;
        
      case NODE_TYPES.FEATURE_VALUE:
        update(model.child,set);
        break; 
    }   
  }

  for (i in data) {
    set=data[i];
    if (model==undefined || model.type==undefined)
      model=init(set);
    else
      update(model,set);
  }
  return model;
}

module.exports =  {
  NODE_TYPES:NODE_TYPES,
  compactTree:compactTree,
  create:function (options) {
    // type options = {data number [][], target:string, features: string [], eps;number, maxdepth}
    return createTree(options.data,options.target,options.features,options)
  },
  depth:depth,
  entropy:entropyEps,
  evaluate:function evaluate(model,target,samples){},
  predict:predict,
  print:print,
  results:results,
  update:function (model,options) {
    // type options = {data number [][], target:string, features: string [], eps:number, maxdepth}
    return updateTree(model,options.data,options.target,options.features,options)
  },
  current:function (module) { current=module.current; Aios=module;}
};


