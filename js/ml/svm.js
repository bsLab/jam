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
 **    $AUTHORS:     joonkukang, Stefan Bosse
 **    $INITIAL:     (C) 2014, joonkukang
 **    $MODIFIED:    (C) 2006-2018 bLAB by sbosse
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 ** Support Vector Machine Algrotihm
 **
 ** 1. References : http://cs229.stanford.edu/materials/smo.pdf . simplified smo algorithm 
 ** 2. https://github.com/karpathy/svmjs
 ** 
 ** Portable model
 **
 **    $ENDOFINFO
 */

var math = Require('ml/math');

/**
 * type options = {x: number [] [], y: number []}
 */
var SVM = function (options) {
    var L = {};
    L.x = options.x;
    L.y = options.y;
    return L
};

SVM.code = {
  train : function (L,options) {
    var self = L;
    var C = options.C || 1.0;
    var tol = options.tol || 1e-4;
    var maxPasses = options.max_passes || 20;
    var alphatol = options.alpha_tol || 1e-5;

    L.options={kernel:options.kernel,iterations:maxPasses,alpha_tol:alphatol, C:C, tol:tol };
    self.kernel = getKernel(options.kernel);
    self.alphas = math.zeroVec(self.x.length);
    self.b = 0;
    var passes = 0, i;
    var count=0;
    while(passes < maxPasses) {
        var numChangedAlphas = 0;

        for(i=0; i<self.x.length; i++) {

            var E_i = SVM.code.f(self,self.x[i]) - self.y[i];

            if((self.y[i] * E_i < -tol && self.alphas[i] < C) || (self.y[i] * E_i > tol && self.alphas[i] >0)) {

                // Randomly selects j (i != j)
                var j = math.randInt(0,self.x.length-1);
                if(i==j) j = (j+1) % self.x.length;

                var E_j = SVM.code.f(self,self.x[j]) - self.y[j];
                var alpha_i_old = self.alphas[i], alpha_j_old = self.alphas[j];

                // Compute L,H
                var L,H;
                if(self.y[i] !== self.y[j]) {
                    L = Math.max(0, self.alphas[j] - self.alphas[i]);
                    H = Math.min(C, C + self.alphas[j] - self.alphas[i]);
                } else {
                    L = Math.max(0, self.alphas[j] + self.alphas[i] - C);
                    H = Math.min(C, self.alphas[j] + self.alphas[i]);
                }

                if(L === H)
                    continue;

                // Compute ETA
                var ETA = 2 * self.kernel(self.x[i],self.x[j]) - self.kernel(self.x[i],self.x[i]) - self.kernel(self.x[j],self.x[j]);
                if(ETA >= 0)
                    continue;

                // Clip new value to alpha_j
                self.alphas[j] -= 1.*self.y[j] * (E_i - E_j) / ETA;
                if(self.alphas[j] > H)
                    self.alphas[j] = H;
                else if(self.alphas[j] < L)
                    self.alphas[j] = L;

                if(Math.abs(self.alphas[j] - alpha_j_old) < alphatol)
                    continue;

                // Clip new value to alpha_i
                self.alphas[i] += self.y[i] * self.y[j] * (alpha_j_old - self.alphas[j]);

                // update b
                var b1 = self.b - E_i - self.y[i] * (self.alphas[i] - alpha_i_old) * self.kernel(self.x[i],self.x[i])
                                - self.y[j] * (self.alphas[j] - alpha_j_old) * self.kernel(self.x[i],self.x[j]);
                var b2 = self.b - E_j - self.y[i] * (self.alphas[i] - alpha_i_old) * self.kernel(self.x[i],self.x[j])
                                - self.y[j] * (self.alphas[j] - alpha_j_old) * self.kernel(self.x[j],self.x[j]);

                if(0 < self.alphas[i] && self.alphas[i] < C)
                    self.b = b1;
                else if(0 < self.alphas[j] && self.alphas[j] < C)
                    self.b = b2;
                else
                    self.b = (b1+b2)/2.0;

                numChangedAlphas ++ ;
            } // end-if
        } // end-for
        if(numChangedAlphas == 0)
            passes++;
        else
            passes = 0;
    }
  },
  
  predict : function(L,x) {
    var self = L;
    this.kernel = getKernel(L.options.kernel); // update kernel
    if(SVM.code.f(L,x) >= 0)
        return 1;
    else
        return -1;
  },

  f : function(L,x) {
    var self = L;
    var f = 0, j;
    for(j=0; j<self.x.length; j++)
        f += self.alphas[j] * self.y[j] * self.kernel(self.x[j],x);
    f += self.b;
    return f;
  }
}

function getKernel (options) {
    if(typeof options === 'undefined') {
        return function(x,y) {
            var sigma = 1.0;
            return Math.exp(-1.*Math.pow(math.getNormVec(math.minusVec(x,y)),2)/(2*sigma*sigma));
        }
    } else if (typeof options === 'function') {
        return options;
    } else if (options['type'] === 'gaussian') {
        return function(x,y) {
            var sigma = options['sigma'];
            return Math.exp(-1.*Math.pow(math.getNormVec(math.minusVec(x,y)),2)/(2*sigma*sigma));
        }
    } else if (options['type'] === 'linear') {
        return function(x,y) {
            return math.dotVec(x,y);
        }
    } else if (options['type'] === 'polynomial') {
        return function(x,y) {
            var c = options['c'];
            var d = options['d'];
            return Math.pow(math.dotVec(x,y) + c, d);
        }
    } else if (options['type'] === 'rbf') {
        return function(v1, v2) {
          var s=0;
          var sigma = options.sigma||options.rbfsigma || 0.5;
          for(var q=0;q<v1.length;q++) { s += (v1[q] - v2[q])*(v1[q] - v2[q]); } 
          return Math.exp(-s/(2.0*sigma*sigma));
        }
    }
}


var SVM2 = function (options) {
    var L = {};
    L.data = options.x;
    L.labels = options.y;
    L.threshold=checkOption(options.threshold,0);
    return L
};

SVM2.code = {

  // data is NxD array of floats. labels are 1 or -1.
  train: function(L, options) {
    var data = L.data,labels=L.labels;

    // parameters
    options = options || {};
    var C = options.C || 1.0; // C value. Decrease for more regularization
    var tol = options.tol || 1e-4; // numerical tolerance. Don't touch unless you're pro
    var alphatol = options.alphatol || options.alpha_tol || 1e-7; // non-support vectors for space and time efficiency are truncated. To guarantee correct result set this to 0 to do no truncating. If you want to increase efficiency, experiment with setting this little higher, up to maybe 1e-4 or so.
    var maxiter = options.maxiter || 10000; // max number of iterations
    var numpasses = options.numpasses || options.max_passes || 10; // how many passes over data with no change before we halt? Increase for more precision.

    // instantiate kernel according to options. kernel can be given as string or as a custom function
    var kernel = linearKernel;
    L.kernelType = "linear";
    L.options={kernel:options.kernel};
    if("kernel" in options) {
      if  (typeof options.kernel == 'object') {
        kernel = getKernel(options.kernel);
        L.kernelType=options.kernel.type;
        L.rbfSigma = options.kernel.sigma || options.kernel.rbfsigma;
      } else if (typeof options.kernel == 'function') {
        // assume kernel was specified as a function. Let's just use it
        L.kernelType = "custom";
        kernel = options.kernel;
      }
    }
    L.options.C=C;
    L.options.tol=tol;
    L.options.alphatol=alphatol;
    L.options.iterations=numpasses;
    
    // initializations
    L.kernel = kernel;
    L.N = data.length; var N = L.N;
    L.D = data[0].length; var D = L.D;
    L.alpha = zeros(N);
    L.b = 0.0;
    L.usew_ = false; // internal efficiency flag

    // Cache kernel computations to avoid expensive recomputation.
    // This could use too much memory if N is large.
    if (options.memoize) {
      L.kernelResults = new Array(N);
      for (var i=0;i<N;i++) {
        L.kernelResults[i] = new Array(N);
        for (var j=0;j<N;j++) {
          L.kernelResults[i][j] = kernel(data[i],data[j]);
        }
      }
    }

    // run SMO algorithm
    var iter = 0;
    var passes = 0;
    while(passes < numpasses && iter < maxiter) {

      var alphaChanged = 0;
      for(var i=0;i<N;i++) {

        var Ei= SVM2.code.marginOne(L, data[i]) - labels[i];
        if( (labels[i]*Ei < -tol && L.alpha[i] < C)
         || (labels[i]*Ei > tol && L.alpha[i] > 0) ){

          // alpha_i needs updating! Pick a j to update it with
          var j = i;
          while(j === i) j= randi(0, L.N);
          var Ej= SVM2.code.marginOne(L, data[j]) - labels[j];

          // calculate L and H bounds for j to ensure we're in [0 C]x[0 C] box
          ai= L.alpha[i];
          aj= L.alpha[j];
          var Lb = 0; var Hb = C;
          if(labels[i] === labels[j]) {
            Lb = Math.max(0, ai+aj-C);
            Hb = Math.min(C, ai+aj);
          } else {
            Lb = Math.max(0, aj-ai);
            Hb = Math.min(C, C+aj-ai);
          }

          if(Math.abs(Lb - Hb) < 1e-4) continue;

          var eta = 2*SVM2.code.kernelResult(L, i,j) - SVM2.code.kernelResult(L, i,i) - SVM2.code.kernelResult(L, j,j);
          if(eta >= 0) continue;

          // compute new alpha_j and clip it inside [0 C]x[0 C] box
          // then compute alpha_i based on it.
          var newaj = aj - labels[j]*(Ei-Ej) / eta;
          if(newaj>Hb) newaj = Hb;
          if(newaj<Lb) newaj = Lb;
          if(Math.abs(aj - newaj) < 1e-4) continue; 
          L.alpha[j] = newaj;
          var newai = ai + labels[i]*labels[j]*(aj - newaj);
          L.alpha[i] = newai;

          // update the bias term
          var b1 = L.b - Ei - labels[i]*(newai-ai)*SVM2.code.kernelResult(L, i,i)
                   - labels[j]*(newaj-aj)*SVM2.code.kernelResult(L, i,j);
          var b2 = L.b - Ej - labels[i]*(newai-ai)*SVM2.code.kernelResult(L, i,j)
                   - labels[j]*(newaj-aj)*SVM2.code.kernelResult(L, j,j);
          L.b = 0.5*(b1+b2);
          if(newai > 0 && newai < C) L.b= b1;
          if(newaj > 0 && newaj < C) L.b= b2;

          alphaChanged++;

        } // end alpha_i needed updating
      } // end for i=1..N

      iter++;
      //console.log("iter number %d, alphaChanged = %d", iter, alphaChanged);
      if(alphaChanged == 0) passes++;
      else passes= 0;

    } // end outer loop

    // if the user was using a linear kernel, lets also compute and store the
    // weights. This will speed up evaluations during testing time
    if(L.kernelType === "linear") {

      // compute weights and store them
      L.w = new Array(L.D);
      for(var j=0;j<L.D;j++) {
        var s= 0.0;
        for(var i=0;i<L.N;i++) {
          s+= L.alpha[i] * labels[i] * data[i][j];
        }
        L.w[j] = s;
        L.usew_ = true;
      }
    } else {

      // okay, we need to retain all the support vectors in the training data,
      // we can't just get away with computing the weights and throwing it out

      // But! We only need to store the support vectors for evaluation of testing
      // instances. So filter here based on L.alpha[i]. The training data
      // for which L.alpha[i] = 0 is irrelevant for future. 
      var newdata = [];
      var newlabels = [];
      var newalpha = [];
      for(var i=0;i<L.N;i++) {
        //console.log("alpha=%f", L.alpha[i]);
        if(L.alpha[i] > alphatol) {
          newdata.push(L.data[i]);
          newlabels.push(L.labels[i]);
          newalpha.push(L.alpha[i]);
        }
      }

      // store data and labels
      L.data = newdata;
      L.labels = newlabels;
      L.alpha = newalpha;
      L.N = L.data.length;
      // console.log("filtered training data from %d to %d support vectors.", data.length, L.data.length);
    }

    var trainstats = {};
    trainstats.iters= iter;
    trainstats.passes= passes;
    return trainstats;
  }, 

  // inst is an array of length D. Returns margin of given example
  // this is the core prediction function. All others are for convenience mostly
  // and end up calling this one somehow.
  marginOne: function(L,inst) {

    var f = L.b;
    // if the linear kernel was used and w was computed and stored,
    // (i.e. the svm has fully finished training)
    // the internal class variable usew_ will be set to true.
    if(L.usew_) {

      // we can speed this up a lot by using the computed weights
      // we computed these during train(). This is significantly faster
      // than the version below
      for(var j=0;j<L.D;j++) {
        f += inst[j] * L.w[j];
      }

    } else {

      for(var i=0;i<L.N;i++) {
        f += L.alpha[i] * L.labels[i] * L.kernel(inst, L.data[i]);
      }
    }
    return f;
  },

  predict: function(L,inst) { 
    L.kernel=getKernel(L.options.kernel); // update kernel
    var result = SVM2.code.marginOne(L,inst);
    if (L.threshold===false) return result;
    else return  result > L.threshold ? 1 : -1; 
  },

  // data is an NxD array. Returns array of margins.
  margins: function(L,data) {

    // go over support vectors and accumulate the prediction. 
    var N = data.length;
    var margins = new Array(N);
    for(var i=0;i<N;i++) {
      margins[i] = SVM2.code.marginOne(L,data[i]);
    }
    return margins;

  },

  kernelResult: function(L, i, j) {
    if (L.kernelResults) {
      return L.kernelResults[i][j];
    }
    return L.kernel(L.data[i], L.data[j]);
  },

  // data is NxD array. Returns array of 1 or -1, predictions
  predictN: function(L,data) {
    L.kernel=getKernel(L.options.kernel); // update kernel
    var margs = SVM2.code.margins(L, data);
    for(var i=0;i<margs.length;i++) {
      if (L.threshold!=false)
        margs[i] = margs[i] > L.threshold ? 1 : -1;
    }
    return margs;
  },

  // THIS FUNCTION IS NOW DEPRECATED. WORKS FINE BUT NO NEED TO USE ANYMORE. 
  // LEAVING IT HERE JUST FOR BACKWARDS COMPATIBILITY FOR A WHILE.
  // if we trained a linear svm, it is possible to calculate just the weights and the offset
  // prediction is then yhat = sign(X * w + b)
  getWeights: function(L) {

    // DEPRECATED
    var w= new Array(L.D);
    for(var j=0;j<L.D;j++) {
      var s= 0.0;
      for(var i=0;i<L.N;i++) {
        s+= L.alpha[i] * L.labels[i] * L.data[i][j];
      }
      w[j]= s;
    }
    return {w: w, b: L.b};
  },

  toJSON: function(L) {

    if(L.kernelType === "custom") {
      console.log("Can't save this SVM because it's using custom, unsupported kernel...");
      return {};
    }

    json = {}
    json.N = L.N;
    json.D = L.D;
    json.b = L.b;

    json.kernelType = L.kernelType;
    if(L.kernelType === "linear") { 
      // just back up the weights
      json.w = L.w; 
    }
    if(L.kernelType === "rbf") { 
      // we need to store the support vectors and the sigma
      json.rbfSigma = L.rbfSigma; 
      json.data = L.data;
      json.labels = L.labels;
      json.alpha = L.alpha;
    }

    return json;
  },

  fromJSON: function(L,json) {

    this.N = json.N;
    this.D = json.D;
    this.b = json.b;

    this.kernelType = json.kernelType;
    if(this.kernelType === "linear") { 

      // load the weights! 
      this.w = json.w; 
      this.usew_ = true; 
      this.kernel = linearKernel; // this shouldn't be necessary
    }
    else if(this.kernelType == "rbf") {

      // initialize the kernel
      this.rbfSigma = json.rbfSigma; 
      this.kernel = makeRbfKernel(this.rbfSigma);

      // load the support vectors
      this.data = json.data;
      this.labels = json.labels;
      this.alpha = json.alpha;
    } else {
      console.log("ERROR! unrecognized kernel type." + this.kernelType);
    }
  }
}

// Kernels
function makeRbfKernel(sigma) {
  return function(v1, v2) {
    var s=0;
    for(var q=0;q<v1.length;q++) { s += (v1[q] - v2[q])*(v1[q] - v2[q]); } 
    return Math.exp(-s/(2.0*sigma*sigma));
  }
}

function linearKernel(v1, v2) {
  var s=0; 
  for(var q=0;q<v1.length;q++) { s += v1[q] * v2[q]; } 
  return s;
}

// Misc utility functions
// generate random floating point number between a and b
function randf(a, b) {
  return Math.random()*(b-a)+a;
}

// generate random integer between a and b (b excluded)
function randi(a, b) {
   return Math.floor(Math.random()*(b-a)+a);
}

// create vector of zeros of length n
function zeros(n) {
  var arr= new Array(n);
  for(var i=0;i<n;i++) { arr[i]= 0; }
  return arr;
}

module.exports = SVM2
