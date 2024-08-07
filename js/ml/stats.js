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
 **    $CREATED:     (C) 2006-2020 bLAB by sbosse
 **    $VERSION:     1.1.8
 **
 **    $INFO:
 **
 **  ML Data Statistics and Utils 
 **
 **  New:
 **    type eps = number | number []
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');

///////// UTILS ////////////
var stat = {
	max: function(array) {
		return Math.max.apply(null, array);
	},
	
	min: function(array) {
		return Math.min.apply(null, array);
	},
	
	range: function(array) {
		return stat.max(array) - stat.min(array);
	},
	
	midrange: function(array) {
		return stat.range(array) / 2;
	},

	sum: function(array) {
		var num = 0;
		for (var i = 0, l = array.length; i < l; i++) num += array[i];
		return num;
	},
	
	mean: function(array) {
		return stat.sum(array) / array.length;
	},
	
	median: function(array) {
		array.sort(function(a, b) {
			return a - b;
		});
		var mid = array.length / 2;
		return mid % 1 ? array[mid - 0.5] : (array[mid - 1] + array[mid]) / 2;
	},
	
	modes: function(array) {
		if (!array.length) return [];
		var modeMap = {},
			maxCount = 0,
			modes = [];

		array.forEach(function(val) {
			if (!modeMap[val]) modeMap[val] = 1;
			else modeMap[val]++;

			if (modeMap[val] > maxCount) {
				modes = [val];
				maxCount = modeMap[val];
			}
			else if (modeMap[val] === maxCount) {
				modes.push(val);
				maxCount = modeMap[val];
			}
		});
		return modes;
	},
	
	variance: function(array) {
		var mean = stat.mean(array);
		return stat.mean(array.map(function(num) {
			return Math.pow(num - mean, 2);
		}));
	},
	
	standardDeviation: function(array) {
		return Math.sqrt(stat.variance(array));
	},
	
	meanAbsoluteDeviation: function(array) {
		var mean = stat.mean(array);
		return stat.mean(array.map(function(num) {
			return Math.abs(num - mean);
		}));
	},
	
	zScores: function(array) {
		var mean = stat.mean(array);
		var standardDeviation = stat.standardDeviation(array);
		return array.map(function(num) {
			return (num - mean) / standardDeviation;
		});
	}
};

// Function aliases:
stat.average = stat.mean;

// function ({$x:number}|{value:*,prob;number}[]|number [],boolean) 
// -> {value:*,prob:number}|{index:number, prob:number}
// normalize=1: scale output max=[0,1]
// normalize=2: scale and weight output max*[0,1]

function best(o,normalize) {
  var p,max,pos=0,sum=0,res;
  if (Comp.obj.isArray(o) && typeof o[0]=='number')  {
    max=-Infinity;
    for(p in o) {
      sum += o[p];       
      if (o[p] > max) max=o[p],pos=p;
    }  
    res = {index:pos,prob:max}   
  } else if (Comp.obj.isArray(o) && typeof o[0]=='object')  {
    for(p in o) {
      sum += o[p].prob; 
      if (!max || o[p].prob>max.prob) max=o[p];
    }
    res = {value:max.value,prob:max.prob}
  } else if (Comp.obj.isObj(o)) {
    max=-Infinity;
    for(p in o) {
      sum += o[p];
      if (o[p]>max) max=o[p],pos=p;
    }
    res = {value:pos,prob:max}      
  }
  if (!res) return;
  switch (normalize) {
    case 1: res.prob=res.prob/sum; break;
    case 2: res.prob=res.prob*(res.prob/sum); break;
    default: 
  }
  return res;
}
function bestNormalize(o) { return best(o,1) }


function log2(n) {
  return Math.log(n) / Math.log(2);
}

// Select maximal value of an array by values 
// retuned by optional function applied to array values
function max(array,fun) {        
    var res,max,num;
    for(var i in array) {
        if (fun) num=fun(array[i],i); else num=array[i];
        if (max==undefined) { max=num; res=array[i] } 
        else if (num > max) { max=num; res=array[i] }
    }
    return res;
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


function pluck(collection, key) {
  return collection.map(function(object) {
    return object == null ? undefined : object[key];
  });
}

function prob(value, list) {
  var occurrences = list.filter(function(element) {
    return element === value
  });

  var numOccurrences = occurrences.length;
  var numElements = list.length;
  return numOccurrences / numElements;
}


function sort(array) {
  return array.sort(function (a,b) { return a<b?-1:1 });
}

function sum (a,b) { return a+b }

function unique(array) {
  var length = array ? array.length : 0;
  function baseUniq(array) {
    var index = -1,
        length = array.length,
        seen,
        result = [];

    seen = result;
    outer:
    while (++index < length) {
      var value = array[index];
      var seenIndex = seen.length;
      while (seenIndex--) {
        if (seen[seenIndex] === value) {
          continue outer;
        }
      }
      result.push(value);
    }
    return result;
  }
  if (!length) {
    return [];
  }
  return baseUniq(array);
}

function without () {
  var array,
      values=[];
  for(var i in arguments) {
    if (i==0) array=arguments[0];
    else values.push(arguments[i]);
  }
  return array.filter(function (e) {
    return values.indexOf(e) == -1;
  });
}


////////////////////////////////////////

// Entropy of data vectors
function entropy(vals) {
  var uniqueVals = unique(vals);
  var probs = uniqueVals.map(function(x) {
    return prob(x, vals)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(sum,0);
}

function entropyN(dist,N) {
  var p, probs=[];
  for(p in dist) probs.push(dist[p]/N);
  var logVals = probs.map(function(p) {
    return p==0?0:-p * log2(p)
  });
  return logVals.reduce(sum, 0);
  
}

function entropyEps(vals,eps) {
  var uniqueVals = uniqueEps(vals,eps);
  var probs = uniqueVals.map(function(x) {
    return probEps(x, vals, eps)
  });

  var logVals = probs.map(function(p) {
    return -p * log2(p)
  });

  return logVals.reduce(sum, 0);
}

// Entropy of target variable partitioned feature vector
function entropyT(data,featureIndex,targetIndex,targets) {
  var en = 0;
  var col =  pluck(data,featureIndex);
  var uniqueVals = unique(col);
  uniqueVals.forEach(function (v) {
    var frac = targets.map(function () { return 0 }),
        cn=0;
    col.forEach (function (v2,row) {
      if (v2==v) cn++,frac[targets.indexOf(data[row][targetIndex])]++;
    })
    var p = cn/data.length;
    en += (p*entropyN(frac,frac.reduce(sum)))
    // print(frac,p,frac.reduce(sum))
  })
  return en;
}

function entropyTEps(data,feature,target,targets,eps) {
  var en = 0;
  var col =  pluck(data,feature);
  var uniqueVals = uniqueEps(col,eps);
  uniqueVals.forEach(function (v) {
    var frac = targets.map(function () { return 0 }),
        cn=0;
    col.forEach (function (v2,row) {
      if (v2>=v-eps && v2<=v+eps) cn++,frac[targets.indexOf(data[row][target])]++;
    })
    var p = cn/data.length;
    en += (p*entropyN(frac,frac.reduce(sum)))
    // print(frac,p,frac.reduce(sum))
  })
  return en;
}

function features (data,target) {
  var f;
  if (Comp.obj.isObj(data[0])) 
    f=Object.keys(data[0]);
  else if (Comp.obj.isArray(data[0]))
    f=data[0].map(function (x,i) { return String(i) });
  if (f && target) delete f[target];
  return f;
}

function gainEps(data,feature,target,targets,eps) {
  var et = entropy(pluck(data,target));
  return et/entropyTEps(data,feature,target,targets,eps)
}


function maxGainEps(data,features,target,targets,eps) {
  var maxgain=max(features, function(feature,index) {
    var g = gainEps(data,feature,target,targets,selectEps(eps,index));
    return g;
  });
  return maxgain;
}

function partition(data,feature,target,targets) {
  var parts={};
  targets.forEach(function (t) {parts[t]=[]});
  data.forEach(function (row) {
    parts[row[target]].push(row[feature]);
  })
  return parts
}

function partitionEps(data,feature,target,targets,eps) {
  var p,parts={}
  targets.forEach(function (t) {parts[t]={range:[Number.MAX_VALUE,-Number.MAX_VALUE],values:[]}});
  data.forEach(function (row) {
    parts[row[target]].values.push(row[feature]);
    parts[row[target]].range[0]=Math.min(parts[row[target]].range[0],row[feature]);
    parts[row[target]].range[1]=Math.max(parts[row[target]].range[1],row[feature]);
  })
  for(p in parts) {
    parts[p].unique=uniqueEps(parts[p].values,eps)
    parts[p].noise=2*stat.standardDeviation(parts[p].values);
  }
  return parts
}

// Return only eps-not-overlapping parititions - the most significant are selected 
// (with the lowest unique column values) 
function partitionUniqueEps(data,feature,target,targets,eps) {
  var p, q, parts={}
  // 1. Create all partitions 
  targets.forEach(function (t) {parts[t]={range:[Number.MAX_VALUE,-Number.MAX_VALUE],values:[]}});
  data.forEach(function (row) {
    parts[row[target]].values.push(row[feature]);
    parts[row[target]].range[0]=Math.min(parts[row[target]].range[0],row[feature]);
    parts[row[target]].range[1]=Math.max(parts[row[target]].range[1],row[feature]);
  })
  for(p in parts) {
    parts[p].unique=uniqueEps(parts[p].values,eps)
  }
  // 2. Remove overlapping partitions
  for(p in parts) {
    if (!parts[p]) continue;
    for (q in parts) {
      if (!parts[p]) break;
      if (p==q || !parts[q]) continue;
      if ((parts[p].range[0]-eps)<parts[q].range[1] ||
          (parts[p].range[1]+eps)>parts[q].range[0]) {
        // overlapping, select the part with best unique column values
        if ((parts[p].unique.length/parts[p].values.length)<
            (parts[q].unique.length/parts[q].values.length)) {
          //print('delete '+q)
          delete parts[q];
        } else {
          //print('delete '+p)
          delete parts[p];
        }
      }
    }
  }  
  return parts
}

function select (data,what) {
  if (Comp.obj.isArray(what) && what.length==2) {
    var c0=what[0],c1=what[1];
    return data.map(function (row) {
      return row.slice(c0,c1+1);
    })
  } 
}

function selectEps (eps,index) {
  if (typeof eps == 'number') return eps;
  else return eps[index]
}

/** Split a data set by finding the best feature (column) 
 *  based on maximal gain/entropy calculation of columns. 
 *  type eps = number | number []
 */

function splitEps (data,features,target,targets,eps) {
  var bestFeature = maxGainEps(data,features,target,targets,eps);
  var index = features.indexOf(bestFeature);
  eps = selectEps(eps,index);
  var remainingFeatures = without(features, bestFeature);
  var possibleValues = sort(uniqueEps(pluck(data, bestFeature),eps));
  var choices = possibleValues.map( function(v) {
    var dataS = data.filter(function(x) {
      return Math.abs(x[bestFeature] - v) <= eps
    });
    return {
      val:v,
      data:dataS,
    }
  });
  return {
    feature:bestFeature,
    choices:choices,
    possibleValues:possibleValues,
    remainingFeatures:remainingFeatures
  };
}

function uniqueEps(array,eps) {
  var result=[];
  array.forEach(function (x) {
    var found;
    if (!result.length) result.push(x);
    else {
      result.forEach(function (y) {
        if (found) return;
        found = Math.abs(x-y)<=eps;
      }); 
      if (!found) result.push(x);
    }
  });
  return result;
}



module.exports =  {
  analyze : function (data,features,target,eps) {
    var noise=[];
    if (!eps) eps=0;
    var targets = unique(pluck(data,target));
    var parts = {}, partsUnique = {},diversity={}
    features.forEach(function (feature) {
      partsUnique[feature]=partitionUniqueEps(data,feature,target,targets,eps);
      parts[feature]=partitionEps(data,feature,target,targets,eps);
      for(var p in parts[feature]) noise.push(parts[feature][p].noise);
    })
    features.forEach(function (feature) {
      diversity[feature]=Object.keys(partsUnique[feature]).length;
    })
   
    return {
      features:features,
      partitions:parts, // for each data column
      diversity:diversity,
      noise:stat.mean(noise)
    }
  },
  entropy:entropy,
  entropyN:entropyN,
  entropyEps:entropyEps,
  entropyTEps:entropyTEps,
  entropyT:entropyT,
  features:features,
  gainEps:gainEps,
  maxGainEps:maxGainEps,
  mostCommon:mostCommon,
  partition:partition,
  partitionEps:partitionEps,
  partitionUniqueEps:partitionUniqueEps,
  splitEps:splitEps,
  unique:unique,
  uniqueEps:uniqueEps,
  utils : {
    // return column by key of a matrix (array array|record array) 
    best:best,
    bestNormalize:bestNormalize,
    column:pluck,
    log2:log2,
    prob:prob,
    // transform [v][] -> v[]
    relax: function (mat) {
      if (Comp.obj.isMatrix(mat) && mat[0].length==1) return mat.map(function (row) { return row[0]})
      else return mat;
    },
    select:select,
    selectEps:selectEps,
    sort:sort,
    stat:stat,
    without:without,
    // transform v[] -> [v][]
    wrap: function (mat) {
      if (!Comp.obj.isMatrix(mat)) return mat.map(function (v) { return [v]})
      else return mat
    },
  },
};

