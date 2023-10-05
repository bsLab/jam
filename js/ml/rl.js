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
 **    $INITIAL:     (C) 2015, Andrej Karpathy
 **    $MODIFIED:    (C) 2006-2019 bLAB by sbosse
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 ** Reinforcement Learning module that implements several common RL algorithms.
 ** Portable models (TDAgent/DPAgent/DQNAgent)
 **
 **    $ENDOFINFO
 */
"use strict";

var options = {
  version:'1.1.2'
}
var Io = Require('com/io')
var R = module.exports; // the Recurrent library


// Utility fun
function assert(condition, message) {
  // from http://stackoverflow.com/questions/15313418/javascript-assert
  if (!condition) {
    message = message || "Assertion failed";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}

// Random numbers utils
var return_v = false;
var v_val = 0.0;
var gaussRandom = function() {
  if(return_v) { 
    return_v = false;
    return v_val; 
  }
  var u = 2*Math.random()-1;
  var v = 2*Math.random()-1;
  var r = u*u + v*v;
  if(r == 0 || r > 1) return gaussRandom();
  var c = Math.sqrt(-2*Math.log(r)/r);
  v_val = v*c; // cache this
  return_v = true;
  return u*c;
}
var randf = function(a, b) { return Math.random()*(b-a)+a; }
var randi = function(a, b) { return Math.floor(Math.random()*(b-a)+a); }
var randn = function(mu, std){ return mu+gaussRandom()*std; }

// helper function returns array of zeros of length n
// and uses typed arrays if available
var zeros = function(n) {
  if(typeof(n)==='undefined' || isNaN(n)) { return []; }
  if(typeof ArrayBuffer === 'undefined') {
    // lacking browser support
    var arr = new Array(n);
    for(var i=0;i<n;i++) { arr[i] = 0; }
    return arr;
  } else {
    return new Float64Array(n);
  }
}

// Mat holds a matrix
var Mat = function(n,d) {
  var M = {}
  // n is number of rows d is number of columns
  M.n = n;
  M.d = d;
  M.w = zeros(n * d);
  M.dw = zeros(n * d);
  return M;
}

Mat.code = {
  get: function(M,row, col) { 
    // slow but careful accessor function
    // we want row-major order
    var ix = (M.d * row) + col;
    assert(ix >= 0 && ix < M.w.length);
    return M.w[ix];
  },
  set: function(M, row, col, v) {
    // slow but careful accessor function
    var ix = (M.d * row) + col;
    assert(ix >= 0 && ix < M.w.length);
    M.w[ix] = v; 
  },
  setFrom: function(M, arr) {
    for(var i=0,n=arr.length;i<n;i++) {
      M.w[i] = arr[i]; 
    }
  },
  setColumn: function(M, m, i) {
    for(var q=0,n=m.w.length;q<n;q++) {
      M.w[(M.d * q) + i] = m.w[q];
    }
  },
  toJSON: function(M) {
    var json = {};
    json['n'] = M.n;
    json['d'] = M.d;
    json['w'] = M.w;
    return json;
  },
  fromJSON: function(M, json) {
    M.n = json.n;
    M.d = json.d;
    M.w = zeros(M.n * M.d);
    M.dw = zeros(M.n * M.d);
    for(var i=0,n=M.n * M.d;i<n;i++) {
      M.w[i] = json.w[i]; // copy over weights
    }
  }
}

var copyMat = function(b) {
  var a = Mat(b.n, b.d);
  Mat.code.setFrom(a, b.w);
  return a;
}

var copyNet = function(net) {
  // nets are (k,v) pairs with k = string key, v = Mat()
  var new_net = {};
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      new_net[p] = copyMat(net[p]);
    }
  }
  return new_net;
}

var updateMat = function(m, alpha) {
  // updates in place
  for(var i=0,n=m.n*m.d;i<n;i++) {
    if(m.dw[i] !== 0) {
      m.w[i] += - alpha * m.dw[i];
      m.dw[i] = 0;
    }
  }
}

var updateNet = function(net, alpha) {
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      updateMat(net[p], alpha);
    }
  }
}

var netToJSON = function(net) {
  var j = {};
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      j[p] = Mat.code.toJSON(net[p]);
    }
  }
  return j;
}
var netFromJSON = function(j) {
  var net = {};
  for(var p in j) {
    if(j.hasOwnProperty(p)){
      net[p] = Mat(1,1); // not proud of this
      Mat.code.fromJSON(net[p],j[p]);
    }
  }
  return net;
}
var netZeroGrads = function(net) {
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      var mat = net[p];
      gradFillConst(mat, 0);
    }
  }
}
var netFlattenGrads = function(net) {
  var n = 0;
  for(var p in net) { 
   if(net.hasOwnProperty(p)) { 
    var mat = net[p]; n += mat.dw.length; 
  }}
  var g = Mat(n, 1);
  var ix = 0;
  for(var p in net) {
    if(net.hasOwnProperty(p)){
      var mat = net[p];
      for(var i=0,m=mat.dw.length;i<m;i++) {
        g.w[ix] = mat.dw[i];
        ix++;
      }
    }
  }
  return g;
}

// return Mat but filled with random numbers from gaussian
var RandMat = function(n,d,mu,std) {
  var m = Mat(n, d);
  fillRandn(m,mu,std);
  //fillRand(m,-std,std); // kind of :P
  return m;
}

// Mat utils
// fill matrix with random gaussian numbers
var fillRandn = function(m, mu, std) { for(var i=0,n=m.w.length;i<n;i++) { m.w[i] = randn(mu, std); } }
var fillRand = function(m, lo, hi) { for(var i=0,n=m.w.length;i<n;i++) { m.w[i] = randf(lo, hi); } }
var gradFillConst = function(m, c) { for(var i=0,n=m.dw.length;i<n;i++) { m.dw[i] = c } }



// Transformer definitions
var Graph = function(needs_backprop) {
  var G = {}
  if(typeof needs_backprop === 'undefined') { needs_backprop = true; }
  G.needs_backprop = needs_backprop;

  // this will store a list of functions that perform backprop,
  // in their forward pass order. So in backprop we will go
  // backwards and evoke each one
  G.backprop = [];
  return G
}
Graph.code = {
  backward: function(G) {
    for(var i=G.backprop.length-1;i>=0;i--) {
      G.backprop[i](); // tick!
    }
  },
  rowPluck: function(G, m, ix) {
    // pluck a row of m with index ix and return it as col vector
    assert(ix >= 0 && ix < m.n);
    var d = m.d;
    var out = Mat(d, 1);
    for(var i=0,n=d;i<n;i++){ out.w[i] = m.w[d * ix + i]; } // copy over the data

    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0,n=d;i<n;i++){ m.dw[d * ix + i] += out.dw[i]; }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  tanh: function(G, m) {
    // tanh nonlinearity
    var out = Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) { 
      out.w[i] = Math.tanh(m.w[i]);
    }

    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          // grad for z = tanh(x) is (1 - z^2)
          var mwi = out.w[i];
          m.dw[i] += (1.0 - mwi * mwi) * out.dw[i];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  sigmoid: function(G, m) {
    // sigmoid nonlinearity
    var out = Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) { 
      out.w[i] = sig(m.w[i]);
    }

    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          // grad for z = tanh(x) is (1 - z^2)
          var mwi = out.w[i];
          m.dw[i] += mwi * (1.0 - mwi) * out.dw[i];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  relu: function(G, m) {
    var out = Mat(m.n, m.d);
    var n = m.w.length;
    for(var i=0;i<n;i++) { 
      out.w[i] = Math.max(0, m.w[i]); // relu
    }
    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0;i<n;i++) {
          m.dw[i] += m.w[i] > 0 ? out.dw[i] : 0.0;
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  mul: function(G, m1, m2) {
    // multiply matrices m1 * m2
    assert(m1.d === m2.n, 'matmul dimensions misaligned');

    var n = m1.n;
    var d = m2.d;
    var out = Mat(n,d);
    for(var i=0;i<m1.n;i++) { // loop over rows of m1
      for(var j=0;j<m2.d;j++) { // loop over cols of m2
        var dot = 0.0;
        for(var k=0;k<m1.d;k++) { // dot product loop
          dot += m1.w[m1.d*i+k] * m2.w[m2.d*k+j];
        }
        out.w[d*i+j] = dot;
      }
    }

    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0;i<m1.n;i++) { // loop over rows of m1
          for(var j=0;j<m2.d;j++) { // loop over cols of m2
            for(var k=0;k<m1.d;k++) { // dot product loop
              var b = out.dw[d*i+j];
              m1.dw[m1.d*i+k] += m2.w[m2.d*k+j] * b;
              m2.dw[m2.d*k+j] += m1.w[m1.d*i+k] * b;
            }
          }
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  add: function(G, m1, m2) {
    assert(m1.w.length === m2.w.length);

    var out = Mat(m1.n, m1.d);
    for(var i=0,n=m1.w.length;i<n;i++) {
      out.w[i] = m1.w[i] + m2.w[i];
    }
    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += out.dw[i];
          m2.dw[i] += out.dw[i];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  dot: function(G, m1, m2) {
    // m1 m2 are both column vectors
    assert(m1.w.length === m2.w.length);
    var out = Mat(1,1);
    var dot = 0.0;
    for(var i=0,n=m1.w.length;i<n;i++) {
      dot += m1.w[i] * m2.w[i];
    }
    out.w[0] = dot;
    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += m2.w[i] * out.dw[0];
          m2.dw[i] += m1.w[i] * out.dw[0];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
  eltmul: function(G, m1, m2) {
    assert(m1.w.length === m2.w.length);

    var out = Mat(m1.n, m1.d);
    for(var i=0,n=m1.w.length;i<n;i++) {
      out.w[i] = m1.w[i] * m2.w[i];
    }
    if(G.needs_backprop) {
      var backward = function() {
        for(var i=0,n=m1.w.length;i<n;i++) {
          m1.dw[i] += m2.w[i] * out.dw[i];
          m2.dw[i] += m1.w[i] * out.dw[i];
        }
      }
      G.backprop.push(backward);
    }
    return out;
  },
}


var softmax = function(m) {
    var out = Mat(m.n, m.d); // probability volume
    var maxval = -999999;
    for(var i=0,n=m.w.length;i<n;i++) { if(m.w[i] > maxval) maxval = m.w[i]; }

    var s = 0.0;
    for(var i=0,n=m.w.length;i<n;i++) { 
      out.w[i] = Math.exp(m.w[i] - maxval);
      s += out.w[i];
    }
    for(var i=0,n=m.w.length;i<n;i++) { out.w[i] /= s; }

    // no backward pass here needed
    // since we will use the computed probabilities outside
    // to set gradients directly on m
    return out;
  }


var Solver = function() {
  var S = {}
  S.decay_rate = 0.999;
  S.smooth_eps = 1e-8;
  S.step_cache = {};
  return S
}
Solver.code = {
  step: function(S, model, step_size, regc, clipval) {
    // perform parameter update
    var solver_stats = {};
    var num_clipped = 0;
    var num_tot = 0;
    for(var k in model) {
      if(model.hasOwnProperty(k)) {
        var m = model[k]; // mat ref
        if(!(k in S.step_cache)) { S.step_cache[k] = Mat(m.n, m.d); }
        var s = S.step_cache[k];
        for(var i=0,n=m.w.length;i<n;i++) {

          // rmsprop adaptive learning rate
          var mdwi = m.dw[i];
          s.w[i] = s.w[i] * S.decay_rate + (1.0 - S.decay_rate) * mdwi * mdwi;

          // gradient clip
          if(mdwi > clipval) {
            mdwi = clipval;
            num_clipped++;
          }
          if(mdwi < -clipval) {
            mdwi = -clipval;
            num_clipped++;
          }
          num_tot++;

          // update (and regularize)
          m.w[i] += - step_size * mdwi / Math.sqrt(s.w[i] + S.smooth_eps) - regc * m.w[i];
          m.dw[i] = 0; // reset gradients for next iteration
        }
      }
    }
    solver_stats['ratio_clipped'] = num_clipped*1.0/num_tot;
    return solver_stats;
  }
}

var initLSTM = function(input_size, hidden_sizes, output_size) {
  // hidden size should be a list

  var model = {};
  for(var d=0;d<hidden_sizes.length;d++) { // loop over depths
    var prev_size = d === 0 ? input_size : hidden_sizes[d - 1];
    var hidden_size = hidden_sizes[d];

    // gates parameters
    model['Wix'+d]  = RandMat(hidden_size, prev_size , 0, 0.08);  
    model['Wih'+d]  = RandMat(hidden_size, hidden_size , 0, 0.08);
    model['bi'+d]   = Mat(hidden_size, 1);
    model['Wfx'+d]  = RandMat(hidden_size, prev_size , 0, 0.08);  
    model['Wfh'+d]  = RandMat(hidden_size, hidden_size , 0, 0.08);
    model['bf'+d]   = Mat(hidden_size, 1);
    model['Wox'+d]  = RandMat(hidden_size, prev_size , 0, 0.08);  
    model['Woh'+d]  = RandMat(hidden_size, hidden_size , 0, 0.08);
    model['bo'+d]   = Mat(hidden_size, 1);
    // cell write params
    model['Wcx'+d]  = RandMat(hidden_size, prev_size , 0, 0.08);  
    model['Wch'+d]  = RandMat(hidden_size, hidden_size , 0, 0.08);
    model['bc'+d]   = Mat(hidden_size, 1);
  }
  // decoder params
  model['Whd']  = RandMat(output_size, hidden_size, 0, 0.08);
  model['bd']   = Mat(output_size, 1);
  return model;
}

var forwardLSTM = function(G, model, hidden_sizes, x, prev) {
  // forward prop for a single tick of LSTM
  // G is graph to append ops to
  // model contains LSTM parameters
  // x is 1D column vector with observation
  // prev is a struct containing hidden and cell
  // from previous iteration

  if(prev == null || typeof prev.h === 'undefined') {
    var hidden_prevs = [];
    var cell_prevs = [];
    for(var d=0;d<hidden_sizes.length;d++) {
      hidden_prevs.push(R.Mat(hidden_sizes[d],1)); 
      cell_prevs.push(R.Mat(hidden_sizes[d],1)); 
    }
  } else {
    var hidden_prevs = prev.h;
    var cell_prevs = prev.c;
  }

  var hidden = [];
  var cell = [];
  for(var d=0;d<hidden_sizes.length;d++) {

    var input_vector = d === 0 ? x : hidden[d-1];
    var hidden_prev = hidden_prevs[d];
    var cell_prev = cell_prevs[d];

    // input gate
    var h0 = Graph.code.mul(G,model['Wix'+d], input_vector);
    var h1 = Graph.code.mul(G,model['Wih'+d], hidden_prev);
    var input_gate = Graph.code.sigmoid(G,Graph.code.add(G,Graph.code.add(G,h0,h1),
                                        model['bi'+d]));

    // forget gate
    var h2 = Graph.code.mul(G,model['Wfx'+d], input_vector);
    var h3 = Graph.code.mul(G,model['Wfh'+d], hidden_prev);
    var forget_gate = Graph.code.sigmoid(
                        G,Graph.code.add(G,Graph.code.add(G,h2, h3),
                        model['bf'+d]));

    // output gate
    var h4 = Graph.code.mul(G,model['Wox'+d], input_vector);
    var h5 = Graph.code.mul(G,model['Woh'+d], hidden_prev);
    var output_gate = Graph.code.sigmoid(G,Graph.code.add(G,Graph.code.add(G,h4, h5),
                                                          model['bo'+d]));

    // write operation on cells
    var h6 = Graph.code.mul(G,model['Wcx'+d], input_vector);
    var h7 = Graph.code.mul(G,model['Wch'+d], hidden_prev);
    var cell_write = Graph.code.tanh(G,Graph.code.add(
                                         G,Graph.code.add(G,h6, h7),
                                         model['bc'+d]));

    // compute new cell activation
    var retain_cell = Graph.code.eltmul(G,forget_gate, cell_prev); // what do we keep from cell
    var write_cell = Graph.code.eltmul(G,input_gate, cell_write); // what do we write to cell
    var cell_d = Graph.code.add(G,retain_cell, write_cell); // new cell contents

    // compute hidden state as gated, saturated cell activations
    var hidden_d = Graph.code.eltmul(G, output_gate, Graph.code.tanh(G,cell_d));

    hidden.push(hidden_d);
    cell.push(cell_d);
  }

  // one decoder to outputs at end
  var output = Graph.code.add(G,Graph.code.mul(G,model['Whd'], hidden[hidden.length - 1]),model['bd']);

  // return cell memory, hidden representation and output
  return {'h':hidden, 'c':cell, 'o' : output};
}

var sig = function(x) {
  // helper function for computing sigmoid
  return 1.0/(1+Math.exp(-x));
}

var maxi = function(w) {
  // argmax of array w
  var maxv = w[0];
  var maxix = 0;
  for(var i=1,n=w.length;i<n;i++) {
    var v = w[i];
    if(v > maxv) {
      maxix = i;
      maxv = v;
    }
  }
  return maxix;
}

var samplei = function(w) {
  // sample argmax from w, assuming w are 
  // probabilities that sum to one
  var r = randf(0,1);
  var x = 0.0;
  var i = 0;
  while(true) {
    x += w[i];
    if(x > r) { return i; }
    i++;
  }
  return w.length - 1; // pretty sure we should never get here?
}

// various utils
module.exports.assert = assert;
module.exports.zeros = zeros;
module.exports.maxi = maxi;
module.exports.samplei = samplei;
module.exports.randi = randi;
module.exports.randn = randn;
module.exports.softmax = softmax;
// classes
module.exports.Mat = Mat;
module.exports.RandMat = RandMat;
module.exports.forwardLSTM = forwardLSTM;
module.exports.initLSTM = initLSTM;
// more utils
module.exports.updateMat = updateMat;
module.exports.updateNet = updateNet;
module.exports.copyMat = copyMat;
module.exports.copyNet = copyNet;
module.exports.netToJSON = netToJSON;
module.exports.netFromJSON = netFromJSON;
module.exports.netZeroGrads = netZeroGrads;
module.exports.netFlattenGrads = netFlattenGrads;
// optimization
module.exports.Solver = Solver;
module.exports.Graph = Graph;

// END OF RECURRENTJS

var RL = module.exports;

// syntactic sugar function for getting default parameter values
var getopt = function(opt, field_name, default_value) {
  if(typeof opt === 'undefined') { return default_value; }
  return (typeof opt[field_name] !== 'undefined') ? opt[field_name] : default_value;
}

var zeros = R.zeros; // inherit these
var assert = R.assert;
var randi = R.randi;
var randf = R.randf;

var setConst = function(arr, c) {
  for(var i=0,n=arr.length;i<n;i++) {
    arr[i] = c;
  }
}

var sampleWeighted = function(p) {
  var r = Math.random();
  var c = 0.0;
  for(var i=0,n=p.length;i<n;i++) {
    c += p[i];
    if(c >= r) { return i; }
  }
  // assert(false, 'sampleWeighted: Invalid samples '+Io.inspect(p));
  return 0
}

// ------
// AGENTS
// ------

// DPAgent performs Value Iteration
// - can also be used for Policy Iteration if you really wanted to
// - requires model of the environment :(
// - does not learn from experience :(
// - assumes finite MDP :(
var DPAgent = function(env, opt) {
  var L={};
  L.V = null; // state value function
  L.P = null; // policy distribution \pi(s,a)
  L.env = env; // store pointer to environment
  L.gamma = getopt(opt, 'gamma', 0.75); // future reward discount factor
  DPAgent.code.reset(L);
  return L;
}
DPAgent.code = {
  reset: function(L) {
    // reset the agent's policy and value function
    L.ns = L.env.getNumStates();
    L.na = L.env.getMaxNumActions();
    L.V = zeros(L.ns);
    L.P = zeros(L.ns * L.na);
    // initialize uniform random policy
    for(var s=0;s<L.ns;s++) {
      var poss = L.env.allowedActions(s);
      for(var i=0,n=poss.length;i<n;i++) {
        L.P[poss[i]*L.ns+s] = 1.0 / poss.length;
      }
    }
  },
  act: function(L,s) {
    // behave according to the learned policy
    var poss = L.env.allowedActions(s);
    var ps = [];
    for(var i=0,n=poss.length;i<n;i++) {
      var a = poss[i];
      var prob = L.P[a*L.ns+s];
      ps.push(prob);
    }
    var maxi = sampleWeighted(ps);
    return poss[maxi];
  },
  learn: function(L) {
    // perform a single round of value iteration
    DPAgent.code.evaluatePolicy(L); // writes this.V
    DPAgent.code.updatePolicy(L); // writes this.P
  },
  evaluatePolicy: function(L) {
    // perform a synchronous update of the value function
    var Vnew = zeros(L.ns);
    for(var s=0;s<L.ns;s++) {
      // integrate over actions in a stochastic policy
      // note that we assume that policy probability mass over allowed actions sums to one
      var v = 0.0;
      var poss = L.env.allowedActions(s);
      for(var i=0,n=poss.length;i<n;i++) {
        var a = poss[i];
        var prob = L.P[a*L.ns+s]; // probability of taking action under policy
        if(prob === 0) { continue; } // no contribution, skip for speed
        var ns = L.env.nextState(s,a);
        var rs = L.env.reward(s,a,ns); // reward for s->a->ns transition
        v += prob * (rs + L.gamma * L.V[ns]);
      }
      Vnew[s] = v;
    }
    L.V = Vnew; // swap
  },
  updatePolicy: function(L) {
    // update policy to be greedy w.r.t. learned Value function
    for(var s=0;s<L.ns;s++) {
      var poss = L.env.allowedActions(s);
      // compute value of taking each allowed action
      var vmax, nmax;
      var vs = [];
      for(var i=0,n=poss.length;i<n;i++) {
        var a = poss[i];
        var ns = L.env.nextState(s,a);
        var rs = L.env.reward(s,a,ns);
        var v = rs + L.gamma * L.V[ns];
        vs.push(v);
        if(i === 0 || v > vmax) { vmax = v; nmax = 1; }
        else if(v === vmax) { nmax += 1; }
      }
      // update policy smoothly across all argmaxy actions
      for(var i=0,n=poss.length;i<n;i++) {
        var a = poss[i];
        L.P[a*L.ns+s] = (vs[i] === vmax) ? 1.0/nmax : 0.0;
      }
    }
  },
}

// QAgent uses TD (Q-Learning, SARSA)
// - does not require environment model :)
// - learns from experience :)
var TDAgent = function(env, opt) {
  var L={}
  L.update = getopt(opt, 'update', 'qlearn'); // qlearn | sarsa
  L.gamma = getopt(opt, 'gamma', 0.75); // future reward discount factor
  L.epsilon = getopt(opt, 'epsilon', 0.1); // for epsilon-greedy policy
  L.alpha = getopt(opt, 'alpha', 0.01); // value function learning rate

  // class allows non-deterministic policy, and smoothly regressing towards the optimal policy based on Q
  L.smooth_policy_update = getopt(opt, 'smooth_policy_update', false);
  L.beta = getopt(opt, 'beta', 0.01); // learning rate for policy, if smooth updates are on

  // eligibility traces
  L.lambda = getopt(opt, 'lambda', 0); // eligibility trace decay. 0 = no eligibility traces used
  L.replacing_traces = getopt(opt, 'replacing_traces', true);

  // optional optimistic initial values
  L.q_init_val = getopt(opt, 'q_init_val', 0);

  L.planN = getopt(opt, 'planN', 0); // number of planning steps per learning iteration (0 = no planning)

  L.Q = null; // state action value function
  L.P = null; // policy distribution \pi(s,a)
  L.e = null; // eligibility trace
  L.env_model_s = null;; // environment model (s,a) -> (s',r)
  L.env_model_r = null;; // environment model (s,a) -> (s',r)
  L.env = env; // store pointer to environment
  TDAgent.code.reset(L);
  return L;
}
TDAgent.code = {
  reset: function(L){
    // reset the agent's policy and value function
    L.ns = L.env.getNumStates();
    L.na = L.env.getMaxNumActions();
    L.Q = zeros(L.ns * L.na);
    if(L.q_init_val !== 0) { setConst(L.Q, L.q_init_val); }
    L.P = zeros(L.ns * L.na);
    L.e = zeros(L.ns * L.na);

    // model/planning vars
    L.env_model_s = zeros(L.ns * L.na);
    setConst(L.env_model_s, -1); // init to -1 so we can test if we saw the state before
    L.env_model_r = zeros(L.ns * L.na);
    L.sa_seen = [];
    L.pq = zeros(L.ns * L.na);

    // initialize uniform random policy
    for(var s=0;s<L.ns;s++) {
      var poss = L.env.allowedActions(s);
      for(var i=0,n=poss.length;i<n;i++) {
        L.P[poss[i]*L.ns+s] = 1.0 / poss.length;
      }
    }
    // agent memory, needed for streaming updates
    // (s0,a0,r0,s1,a1,r1,...)
    L.r0 = null;
    L.s0 = null;
    L.s1 = null;
    L.a0 = null;
    L.a1 = null;
  },
  resetEpisode: function(L) {
    // an episode finished
  },
  act: function(L,s){
    // act according to epsilon greedy policy
    var poss = L.env.allowedActions(s);
    var probs = [];
    for(var i=0,n=poss.length;i<n;i++) {
      probs.push(L.P[poss[i]*L.ns+s]);
    }
    // epsilon greedy policy
    if(Math.random() < L.epsilon) {
      var a = poss[randi(0,poss.length)]; // random available action
      L.explored = true;
    } else {
      var a = poss[sampleWeighted(probs)];
      L.explored = false;
    }
    // shift state memory
    L.s0 = L.s1;
    L.a0 = L.a1;
    L.s1 = s;
    L.a1 = a;
    return a;
  },
  learn: function(L,r1){
    // takes reward for previous action, which came from a call to act()
    if(!(L.r0 == null)) {
      TDAgent.code.learnFromTuple(L, L.s0, L.a0, L.r0, L.s1, L.a1, L.lambda);
      if(L.planN > 0) {
        TDAgent.code.updateModel(L, L.s0, L.a0, L.r0, L.s1);
        TDAgent.code.plan(L);
      }
    }
    L.r0 = r1; // store this for next update
  },
  updateModel: function(L, s0, a0, r0, s1) {
    // transition (s0,a0) -> (r0,s1) was observed. Update environment model
    var sa = a0 * L.ns + s0;
    if(L.env_model_s[sa] === -1) {
      // first time we see this state action
      L.sa_seen.push(a0 * L.ns + s0); // add as seen state
    }
    L.env_model_s[sa] = s1;
    L.env_model_r[sa] = r0;
  },
  plan: function(L) {

    // order the states based on current priority queue information
    var spq = [];
    for(var i=0,n=L.sa_seen.length;i<n;i++) {
      var sa = L.sa_seen[i];
      var sap = L.pq[sa];
      if(sap > 1e-5) { // gain a bit of efficiency
        spq.push({sa:sa, p:sap});
      }
    }
    spq.sort(function(a,b){ return a.p < b.p ? 1 : -1});

    // perform the updates
    var nsteps = Math.min(L.planN, spq.length);
    for(var k=0;k<nsteps;k++) {
      // random exploration
      //var i = randi(0, this.sa_seen.length); // pick random prev seen state action
      //var s0a0 = this.sa_seen[i];
      var s0a0 = spq[k].sa;
      L.pq[s0a0] = 0; // erase priority, since we're backing up this state
      var s0 = s0a0 % L.ns;
      var a0 = Math.floor(s0a0 / L.ns);
      var r0 = L.env_model_r[s0a0];
      var s1 = L.env_model_s[s0a0];
      var a1 = -1; // not used for Q learning
      if(L.update === 'sarsa') {
        // generate random action?...
        var poss = L.env.allowedActions(s1);
        var a1 = poss[randi(0,poss.length)];
      }
      TDAgent.code.learnFromTuple(L, s0, a0, r0, s1, a1, 0); // note lambda = 0 - shouldnt use eligibility trace here
    }
  },
  learnFromTuple: function(L, s0, a0, r0, s1, a1, lambda) {
    var sa = a0 * L.ns + s0;

    // calculate the target for Q(s,a)
    if(L.update === 'qlearn') {
      // Q learning target is Q(s0,a0) = r0 + gamma * max_a Q[s1,a]
      var poss = L.env.allowedActions(s1);
      var qmax = 0;
      for(var i=0,n=poss.length;i<n;i++) {
        var s1a = poss[i] * L.ns + s1;
        var qval = L.Q[s1a];
        if(i === 0 || qval > qmax) { qmax = qval; }
      }
      var target = r0 + L.gamma * qmax;
    } else if(L.update === 'sarsa') {
      // SARSA target is Q(s0,a0) = r0 + gamma * Q[s1,a1]
      var s1a1 = a1 * L.ns + s1;
      var target = r0 + L.gamma * L.Q[s1a1];
    }

    if(lambda > 0) {
      // perform an eligibility trace update
      if(L.replacing_traces) {
        L.e[sa] = 1;
      } else {
        L.e[sa] += 1;
      }
      var edecay = lambda * L.gamma;
      var state_update = zeros(L.ns);
      for(var s=0;s<L.ns;s++) {
        var poss = L.env.allowedActions(s);
        for(var i=0;i<poss.length;i++) {
          var a = poss[i];
          var saloop = a * L.ns + s;
          var esa = L.e[saloop];
          var update = L.alpha * esa * (target - L.Q[saloop]);
          L.Q[saloop] += update;
          L.updatePriority(s, a, update);
          L.e[saloop] *= edecay;
          var u = Math.abs(update);
          if(u > state_update[s]) { state_update[s] = u; }
        }
      }
      for(var s=0;s<L.ns;s++) {
        if(state_update[s] > 1e-5) { // save efficiency here
          TDAgent.code.updatePolicy(L,s);
        }
      }
      if(L.explored && L.update === 'qlearn') {
        // have to wipe the trace since q learning is off-policy :(
        L.e = zeros(L.ns * L.na);
      }
    } else {
      // simpler and faster update without eligibility trace
      // update Q[sa] towards it with some step size
      var update = L.alpha * (target - L.Q[sa]);
      L.Q[sa] += update;
      TDAgent.code.updatePriority(L,s0, a0, update);
      // update the policy to reflect the change (if appropriate)
      TDAgent.code.updatePolicy(L,s0);
    }
  },
  updatePriority: function(L,s,a,u) {
    // used in planning. Invoked when Q[sa] += update
    // we should find all states that lead to (s,a) and upgrade their priority
    // of being update in the next planning step
    u = Math.abs(u);
    if(u < 1e-5) { return; } // for efficiency skip small updates
    if(L.planN === 0) { return; } // there is no planning to be done, skip.
    for(var si=0;si<L.ns;si++) {
      // note we are also iterating over impossible actions at all states,
      // but this should be okay because their env_model_s should simply be -1
      // as initialized, so they will never be predicted to point to any state
      // because they will never be observed, and hence never be added to the model
      for(var ai=0;ai<L.na;ai++) {
        var siai = ai * L.ns + si;
        if(L.env_model_s[siai] === s) {
          // this state leads to s, add it to priority queue
          L.pq[siai] += u;
        }
      }
    }
  },
  updatePolicy: function(L,s) {
    var poss = L.env.allowedActions(s);
    // set policy at s to be the action that achieves max_a Q(s,a)
    // first find the maxy Q values
    var qmax, nmax;
    var qs = [];
    for(var i=0,n=poss.length;i<n;i++) {
      var a = poss[i];
      var qval = L.Q[a*L.ns+s];
      qs.push(qval);
      if(i === 0 || qval > qmax) { qmax = qval; nmax = 1; }
      else if(qval === qmax) { nmax += 1; }
    }
    // now update the policy smoothly towards the argmaxy actions
    var psum = 0.0;
    for(var i=0,n=poss.length;i<n;i++) {
      var a = poss[i];
      var target = (qs[i] === qmax) ? 1.0/nmax : 0.0;
      var ix = a*L.ns+s;
      if(L.smooth_policy_update) {
        // slightly hacky :p
        L.P[ix] += L.beta * (target - L.P[ix]);
        psum += L.P[ix];
      } else {
        // set hard target
        L.P[ix] = target;
      }
    }
    if(L.smooth_policy_update) {
      // renomalize P if we're using smooth policy updates
      for(var i=0,n=poss.length;i<n;i++) {
        var a = poss[i];
        L.P[a*L.ns+s] /= psum;
      }
    }
  }
}


var DQNAgent = function(env, opt) {
  var L = {}
  L.gamma = getopt(opt, 'gamma', 0.75); // future reward discount factor
  L.epsilon = getopt(opt, 'epsilon', 0.1); // for epsilon-greedy policy
  L.alpha = getopt(opt, 'alpha', 0.01); // value function learning rate

  L.experience_add_every = getopt(opt, 'experience_add_every', 25); // number of time steps before we add another experience to replay memory
  L.experience_size = getopt(opt, 'experience_size', 5000); // size of experience replay
  L.learning_steps_per_iteration = getopt(opt, 'learning_steps_per_iteration', 10);
  L.tderror_clamp = getopt(opt, 'tderror_clamp', 1.0); 

  L.num_hidden_units =  getopt(opt, 'num_hidden_units', 100); 

  L.env = env;
  DQNAgent.code.reset(L);
  return L
}
DQNAgent.code = {
  reset: function(L) {
    L.nh = L.num_hidden_units; // number of hidden units
    L.ns = L.env.getNumStates();
    L.na = L.env.getMaxNumActions();

    // nets are hardcoded for now as key (str) -> Mat
    // not proud of this. better solution is to have a whole Net object
    // on top of Mats, but for now sticking with this
    L.net = {};
    L.net.W1 = R.RandMat(L.nh, L.ns, 0, 0.01);
    L.net.b1 = R.Mat(L.nh, 1, 0, 0.01);
    L.net.W2 = R.RandMat(L.na, L.nh, 0, 0.01);
    L.net.b2 = R.Mat(L.na, 1, 0, 0.01);

    L.exp = []; // experience
    L.expi = 0; // where to insert

    L.t = 0;

    L.r0 = null;
    L.s0 = null;
    L.s1 = null;
    L.a0 = null;
    L.a1 = null;

    L.tderror = 0; // for visualization only...
  },
  toJSON: function(L) {
    // save function
    var j = {};
    j.nh = L.nh;
    j.ns = L.ns;
    j.na = L.na;
    j.net = R.netToJSON(L.net);
    return j;
  },
  fromJSON: function(L,j) {
    // load function
    L.nh = j.nh;
    L.ns = j.ns;
    L.na = j.na;
    L.net = R.netFromJSON(j.net);
  },
  forwardQ: function(L, net, s, needs_backprop) {
    var G = R.Graph(needs_backprop);
    var a1mat = Graph.code.add(G,Graph.code.mul(G,net.W1, s), net.b1);
    var h1mat = Graph.code.tanh(G,a1mat);
    var a2mat = Graph.code.add(G,Graph.code.mul(G,net.W2, h1mat), net.b2);
    L.lastG = G; // back this up. Kind of hacky isn't it
    return a2mat;
  },
  act: function(L,slist) {
    // convert to a Mat column vector
    var s = R.Mat(L.ns, 1);
    Mat.code.setFrom(s,slist);

    // epsilon greedy policy
    if(Math.random() < L.epsilon) {
      var a = randi(0, L.na);
    } else {
      // greedy wrt Q function
      var amat = DQNAgent.code.forwardQ(L,L.net, s, false);
      var a = R.maxi(amat.w); // returns index of argmax action
    }

    // shift state memory
    L.s0 = L.s1;
    L.a0 = L.a1;
    L.s1 = s;
    L.a1 = a;

    return a;
  },
  learn: function(L,r1) {
    // perform an update on Q function
    if(!(L.r0 == null) && L.alpha > 0) {

      // learn from this tuple to get a sense of how "surprising" it is to the agent
      var tderror = DQNAgent.code.learnFromTuple(L, L.s0, L.a0, L.r0, L.s1, L.a1);
      L.tderror = tderror; // a measure of surprise
      // decide if we should keep this experience in the replay
      if(L.t % L.experience_add_every === 0) {
        L.exp[L.expi] = [L.s0, L.a0, L.r0, L.s1, L.a1];
        L.expi += 1;
        if(L.expi > L.experience_size) { L.expi = 0; } // roll over when we run out
      }
      L.t += 1;

      // sample some additional experience from replay memory and learn from it
      for(var k=0;k<L.learning_steps_per_iteration;k++) {
        var ri = randi(0, L.exp.length); // todo: priority sweeps?
        var e = L.exp[ri];
        DQNAgent.code.learnFromTuple(L, e[0], e[1], e[2], e[3], e[4])
      }
    }
    L.r0 = r1; // store for next update
  },
  learnFromTuple: function(L, s0, a0, r0, s1, a1) {
    // want: Q(s,a) = r + gamma * max_a' Q(s',a')

    // compute the target Q value
    var tmat = DQNAgent.code.forwardQ(L, L.net, s1, false);
    var qmax = r0 + L.gamma * tmat.w[R.maxi(tmat.w)];

    // now predict
    var pred = DQNAgent.code.forwardQ(L, L.net, s0, true);

    var tderror = pred.w[a0] - qmax;
    var clamp = L.tderror_clamp;
    if(Math.abs(tderror) > clamp) {  // huber loss to robustify
      if(tderror > clamp) tderror = clamp;
      if(tderror < -clamp) tderror = -clamp;
    }
    pred.dw[a0] = tderror;

    Graph.code.backward( L.lastG); // compute gradients on net params

    // update net
    R.updateNet(L.net, L.alpha);
    return tderror;
  }
}



// exports
module.exports.DPAgent = DPAgent;
module.exports.TDAgent = TDAgent;
module.exports.DQNAgent = DQNAgent;
//module.exports.SimpleReinforceAgent = SimpleReinforceAgent;
//module.exports.RecurrentReinforceAgent = RecurrentReinforceAgent;
//module.exports.DeterministPG = DeterministPG;


