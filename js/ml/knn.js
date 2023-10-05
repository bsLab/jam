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
 **    $MODIFIED:    (C) 2006-2019 bLAB by sbosse
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 ** KNN: k-nearest-neighbour Algorithm
 ** A General purpose k-nearest neighbor classifier algorithm based on the 
 ** k-d tree Javascript library develop by Ubilabs.
 **
 ** Portable models (KNN/KNN2)
 **
 **    $ENDOFINFO
 */
var options = {
  version:'1.2.1'
}
var Comp = Require('com/compat');
var math = Require('ml/math');
var euclideanDistance = math.euclidean;

/*
 * Original code from:
 *
 * k-d Tree JavaScript - V 1.01
 *
 * https://github.com/ubilabs/kd-tree-javascript
 *
 * @author Mircea Pricop <pricop@ubilabs.net>, 2012
 * @author Martin Kleppe <kleppe@ubilabs.net>, 2012
 * @author Ubilabs http://ubilabs.net, 2012
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 */

function Node(obj, dimension, parent) {
    var N = {}
    N.obj = obj;
    N.left = null;
    N.right = null;
    N.parent = parent;
    N.dimension = dimension;
    return N;
}

/* KDTree
 *
 */

function KDTree(points, metric) {
    // if (!(this instanceof KDTree)) return new KDTree(points, metric);
    // If points is not an array, assume we're loading a pre-built tree
    var K ={}
    if (!Array.isArray(points)) {
        K.dimensions = points.dimensions;
        K.root = points;
        restoreParent(K.root);
    } else {
        K.dimensions = new Array(points[0].length);
        for (var i = 0; i < K.dimensions.length; i++) {
            K.dimensions[i] = i;
        }
        K.root = buildTree(points, 0, null, K.dimensions);
    }
    K.metric = metric;
    return K;
}

// Convert to a JSON serializable structure; this just requires removing
// the `parent` property
KDTree.code = {
  nearest : function(K, point, maxNodes, maxDistance) {
    var metric = K.metric;
    var dimensions = K.dimensions;
    var i;

    var bestNodes = BinaryHeap(
        function (e) {
            return -e[1];
        }
    );

    function nearestSearch(node) {
        var dimension   = dimensions[node.dimension];
        var ownDistance = metric(point, node.obj);
        var linearPoint = {};
        var bestChild,
            linearDistance,
            otherChild,
            i;
        function saveNode(node, distance) {
            BinaryHeap.code.push(bestNodes,[node, distance]);
            if (BinaryHeap.code.size(bestNodes) > maxNodes) {
                BinaryHeap.code.pop(bestNodes);
            }
        }

        for (i = 0; i < dimensions.length; i += 1) {
            if (i === node.dimension) {
                linearPoint[dimensions[i]] = point[dimensions[i]];
            } else {
                linearPoint[dimensions[i]] = node.obj[dimensions[i]];
            }
        }

        linearDistance = metric(linearPoint, node.obj);
        if (node.right === null && node.left === null) {
            if (BinaryHeap.code.size(bestNodes) < maxNodes || ownDistance < BinaryHeap.code.peek(bestNodes)[1]) {
                saveNode(node, ownDistance);
            }
            return;
        }

        if (node.right === null) {
            bestChild = node.left;
        } else if (node.left === null) {
            bestChild = node.right;
        } else {
            if (point[dimension] < node.obj[dimension]) {
                bestChild = node.left;
            } else {
                bestChild = node.right;
            }
        }

        nearestSearch(bestChild);

        if (BinaryHeap.code.size(bestNodes) < maxNodes || ownDistance < BinaryHeap.code.peek(bestNodes)[1]) {
            saveNode(node, ownDistance);
        }

        if (BinaryHeap.code.size(bestNodes) < maxNodes || Math.abs(linearDistance) < BinaryHeap.code.peek(bestNodes)[1]) {
            if (bestChild === node.left) {
                otherChild = node.right;
            } else {
                otherChild = node.left;
            }
            if (otherChild !== null) {
                nearestSearch(otherChild);
            }
        }
    }

    if (maxDistance) {
        for (i = 0; i < maxNodes; i += 1) {
            BinaryHeap.code.push(bestNodes,[null, maxDistance]);
        }
    }

    if (K.root) {
        nearestSearch(K.root);
    }

    var result = [];
    for (i = 0; i < Math.min(maxNodes, bestNodes.content.length); i += 1) {
        if (bestNodes.content[i][0]) {
            result.push([bestNodes.content[i][0].obj, bestNodes.content[i][1]]);
        }
    }
    return result;
  }
}

function buildTree(points, depth, parent, dimensions) {
    var dim = depth % dimensions.length;

    if (points.length === 0) {
        return null;
    }
    if (points.length === 1) {
        return Node(points[0], dim, parent);
    }

    points.sort(function (a, b) { a[dimensions[dim]] - b[dimensions[dim]]});

    var median  = Math.floor(points.length / 2);
    var node    = Node(points[median], dim, parent);
    node.left   = buildTree(points.slice(0, median), depth + 1, node, dimensions);
    node.right  = buildTree(points.slice(median + 1), depth + 1, node, dimensions);

    return node;
}

function restoreParent(root) {
    if (root.left) {
        root.left.parent = root;
        restoreParent(root.left);
    }

    if (root.right) {
        root.right.parent = root;
        restoreParent(root.right);
    }
}
/** BinaryHeap
 *
 */
 
// Binary heap implementation from:
// http://eloquentjavascript.net/appendix2.html
function BinaryHeap (scoreFunction) {
  var B={}
    //if (!(this instanceof BinaryHeap)) return new BinaryHeap (scoreFunction);
  B.content = [];
  B.scoreFunction = scoreFunction;
  return B;
}


BinaryHeap.code = {
  push : function(B,element) {
    // Add the new element to the end of the array.
    B.content.push(element);
    // Allow it to bubble up.
    BinaryHeap.code.bubbleUp(B,B.content.length - 1);
  },
  pop : function(B) {
    // Store the first element so we can return it later.
    var result = B.content[0];
    // Get the element at the end of the array.
    var end = B.content.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (B.content.length > 0) {
        B.content[0] = end;
        BinaryHeap.code.sinkDown(B,0);
    }
    return result;
  },
  peek : function(B) {
    return B.content[0];
  },
  size : function(B) {
    return B.content.length;
  },
  bubbleUp : function(B,n) {
    // Fetch the element that has to be moved.
    var element = B.content[n];
    // When at 0, an element can not go up any further.
    while (n > 0) {
        // Compute the parent element's index, and fetch it.
        var parentN = Math.floor((n + 1) / 2) - 1;
        var parent = B.content[parentN];
        // Swap the elements if the parent is greater.
        if (B.scoreFunction(element) < B.scoreFunction(parent)) {
            B.content[parentN] = element;
            B.content[n] = parent;
            // Update 'n' to continue at the new position.
            n = parentN;
        } else { // Found a parent that is less, no need to move it further.
            break;
        }
    }
  },
  sinkDown : function(B,n) {
    // Look up the target element and its score.
    var length = B.content.length;
    var element = B.content[n];
    var elemScore = B.scoreFunction(element);

    while (true) {
        // Compute the indices of the child elements.
        var child2N = (n + 1) * 2;
        var child1N = child2N - 1;
        // This is used to store the new position of the element,
        // if any.
        var swap = null;
        // If the first child exists (is inside the array)...
        if (child1N < length) {
            // Look it up and compute its score.
            var child1 = B.content[child1N];
            var child1Score = B.scoreFunction(child1);
            // If the score is less than our element's, we need to swap.
            if (child1Score < elemScore) {
                swap = child1N;
            }
        }
        // Do the same checks for the other child.
        if (child2N < length) {
            var child2 = B.content[child2N];
            var child2Score = B.scoreFunction(child2);
            if (child2Score < (swap === null ? elemScore : child1Score)) {
                swap = child2N;
            }
        }

        // If the element needs to be moved, swap it, and continue.
        if (swap !== null) {
            B.content[n] = B.content[swap];
            B.content[swap] = element;
            n = swap;
        } else {
            // Otherwise, we are done.
            break;
        }
    }
  }
}

/** KNN
 *
 */

/**
 ** typeof @dataset = number [] []
 ** typeof @labels  = number []
 ** typeof @options = { distance?:function, k?:number }
 */
function KNN(dataset, labels, options) {
    var L = {}
    if (!options) options={};
    if (dataset === true) {
        var model = labels;
        L.kdTree = KDTree(model.kdTree, options);
        L.k = model.k;
        L.classes = new Set(model.classes);
        L.isEuclidean = model.isEuclidean;
        return L;
    }
    var classes = new Set(labels);

    var distance = getDistanceFunction(options.distance),
        k = options.k||classes.size + 1;

    var points = new Array(dataset.length);
    for (var i = 0; i < points.length; ++i) {
        points[i] = dataset[i].slice();
    }

    for (i = 0; i < labels.length; ++i) {
        points[i].push(labels[i]);
    }

    L.kdTree = KDTree(points, distance);
    L.k = k;
    L.distance = distance;
    L.classes = classes;
    L.isEuclidean = distance === euclideanDistance;
    return L;
}


/**
 * Predicts the output given the matrix to predict.
 * @param {Array} dataset
 * @return {Array} predictions
 */
KNN.code = {
  predict : function(L,dataset) {
    if (Array.isArray(dataset)) {
        if (typeof dataset[0] === 'number') {
            return getSinglePrediction(L, dataset);
        } else if (Array.isArray(dataset[0]) && typeof dataset[0][0] === 'number') {
            var predictions = new Array(dataset.length);
            for (var i = 0; i < dataset.length; i++) {
                predictions[i] = getSinglePrediction(L, dataset[i]);
            }
            return predictions;
        }
    }
    throw new TypeError('dataset to predict must be an array or a matrix');
  }
}

function getSinglePrediction(knn, currentCase) {
    var nearestPoints = KDTree.code.nearest(knn.kdTree, currentCase, knn.k);
    var pointsPerClass = {};
    var predictedClassMin = null;
    var predictedClassMax = null;
    var predictedClassDistance = 0;
    var maxPoints = -1;
    var minDistance = 1E30;
    
    var lastElement = nearestPoints[0][0].length - 1;
    //for (var element of knn.classes) {
    //    pointsPerClass[element] = 0;
    //}
    forof(knn.classes,function (element) {
      pointsPerClass[element] = 0;
    });
    for (var i = 0; i < nearestPoints.length; ++i) {
        var currentClass = nearestPoints[i][0][lastElement];
        var currentPoints = ++pointsPerClass[currentClass];
        // Either use majority of points matching a class or the nearest points
        if (currentPoints > maxPoints) {
            predictedClassMax = currentClass;
            predictedClassDistance = predictedClassDistance+nearestPoints[i][1];
            maxPoints = currentPoints;
        }
        if (nearestPoints[i][1] < minDistance) {
            predictedClassMin = currentClass;
            minDistance = nearestPoints[i][1];
        }
    }
    predictedClassDistance /= maxPoints;
    return maxPoints>2?predictedClassMax:predictedClassMin;
}



/** Create a simple KNN (2)
 *
 * typeof @options = {x:number [] [],y: number []}
 *
 */
var KNN2 = function (options) {
  var model={}
  // if (!(this instanceof KNN2)) return new KNN2(options);
  model.x       = options.x;
  model.y       = options.y;
  model.target  = options.y;
  model.k       = options.k || 3
  model.distance = getDistanceFunction(options.distance);
  model.weightf =  getWeightedFunction(options.weightf);
  return model
}

/** Make a prediction
 *  
 */
KNN2.code = {
  predict : function (model,data) {
    var x = data;
    var k = model.k;
    var weightf = model.weightf;
    var distance = model.distance;
    var distanceList = [];
    var i;
    for(i=0; i<model.x.length; i++)
        distanceList.push([distance(x,model.x[i]),i]);
    distanceList.sort(function(a,b) {return a[0]-b[0];});
    var avg = 0.0;
    var totalWeight = 0, weight;
    for(i=0; i<k; i++) {
        var dist = distanceList[i][0];
        var idx = distanceList[i][1];
        weight = weightf(dist);
        avg += weight * model.y[idx];
        totalWeight += weight;
    }

    avg /= totalWeight;
    return avg;
  }
}

function getWeightedFunction(options) {
    if(typeof options === 'undefined') {
        return function(x) {
            var sigma = 10.0;
            return Math.exp(-1.*x*x/(2*sigma*sigma));
        }
    } else if(typeof options === 'function') {
        return options;
    } else if(options === 'gaussian') {
        return function(x) {
            var sigma = options.sigma;
            return Math.exp(-1.*x*x/(2*sigma*sigma));
        }
    } else if(options === 'none') {
        return function(dist) {
            return 1.0;
        }
    }
}

function getDistanceFunction(options) {
    if(typeof options === 'undefined') {
        return math.euclidean;
    } else if (typeof options === 'function') {
        return options;
    } else if (options === 'euclidean') {
        return math.euclidean;
    } else if (options === 'pearson') {
        return math.pearson;
    } else 
        throw new TypeError('distance opions invalid: '+options);;      
}

module.exports={
  create    : KNN,
  predict   : KNN.code.predict,
  create2   : KNN2,
  predict2  : KNN2.code.predict,
}
