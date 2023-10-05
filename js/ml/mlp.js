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
 **    $MODIFIED:    (C) 2006-2022 bLAB by sbosse
 **    $VERSION:     1.3.2
 **
 **    $INFO:
 **
 ** Multilayer Perceptron Artificial Neural Network
 **
 ** References : http://cs229.stanford.edu/materials/smo.pdf . simplified smo algorithm 
 **
 ** Portable model
 **
 **    $ENDOFINFO
 */
/**
 */
var math = Require('ml/math');
var HiddenLayer = Require('ml/HiddenLayer');

var MLP = function (settings) {
    var L = {}
    var self = L;
    self.x = settings.input||settings.x;
    self.y = settings.output||settings.y;
    self.sigmoidLayers = [];
    self.nLayers = settings.hidden_layer_sizes.length;
    self.settings = {
        'log level' : 1, // 0 : nothing, 1 : info, 2: warn
        hidden_layers : settings.hidden_layer_sizes
    };
    var i;
    for(i=0 ; i<self.nLayers+1 ; i++) {
        var inputSize, layerInput;
        if(i == 0)
            inputSize = settings.n_ins;
        else
            inputSize = settings.hidden_layer_sizes[i-1];

        if(i == 0)
            layerInput = self.x;
        else
            layerInput = HiddenLayer.code.sampleHgivenV(self.sigmoidLayers[self.sigmoidLayers.length-1]);

        var sigmoidLayer;
        if(i == self.nLayers) {
            sigmoidLayer = HiddenLayer({
                'input' : layerInput,
                'n_in' : inputSize,
                'n_out' : settings.n_outs,
                'activation' : math.sigmoid,
                'W' : (typeof settings.w_array === 'undefined')? undefined : settings.w_array[i],
                'b' : (typeof settings.b_array === 'undefined')? undefined : settings.b_array[i]
            });
        } else {
            sigmoidLayer = HiddenLayer({
                'input' : layerInput,
                'n_in' : inputSize,
                'n_out' : settings.hidden_layer_sizes[i],
                'activation' : math.sigmoid,
                'W' : (typeof settings.w_array === 'undefined')? undefined : settings.w_array[i],
                'b' : (typeof settings.b_array === 'undefined')? undefined : settings.b_array[i]
            });
        }
        self.sigmoidLayers.push(sigmoidLayer);
    }
    return L
};

MLP.code = {
  train : function(L,settings) { try {
    var self = L;
    var t0=Date.now();
    settings=settings||{}
    if (settings.input||settings.x) self.x = settings.input||settings.x;
    if (settings.output||settings.y) self.y = settings.output||settings.y;
    var epochs = 1000;
    if(typeof settings.epochs !== 'undefined')
        epochs = settings.epochs;
    self.settings.iterations=epochs;
    
    var epoch;
    var currentProgress = 1;
    for(epoch=0 ; epoch < epochs ; epoch++) {

        // Feed Forward
        var i;
        var layerInput = [];
        layerInput.push(self.x);
        for(i=0; i<self.nLayers+1 ; i++) {
            layerInput.push(HiddenLayer.code.output(self.sigmoidLayers[i],layerInput[i]));
        }
        var output = layerInput[self.nLayers+1];
        // Back Propagation
        var delta = new Array(self.nLayers + 1);
        delta[self.nLayers] = math.mulMatElementWise(math.minusMat(self.y, output),
            math.activateMat(HiddenLayer.code.linearOutput(self.sigmoidLayers[self.nLayers],layerInput[self.nLayers]), math.dSigmoid));

        /*
         self.nLayers = 3 (3 hidden layers)
         delta[3] : ouput layer
         delta[2] : 3rd hidden layer, delta[0] : 1st hidden layer
         */
        for(i = self.nLayers - 1; i>=0 ; i--) {
            delta[i] = math.mulMatElementWise(HiddenLayer.code.backPropagate(self.sigmoidLayers[i+1],delta[i+1]),
                math.activateMat(HiddenLayer.code.linearOutput(self.sigmoidLayers[i],layerInput[i]), math.dSigmoid));
        }
        // Update Weight, Bias
        for(var i=0; i<self.nLayers+1 ; i++) {
            var deltaW = math.activateMat(math.mulMat(math.transpose(layerInput[i]),delta[i]),function(x){return 1. * x / self.x.length;})
            var deltaB = math.meanMatAxis(delta[i],0);
            self.sigmoidLayers[i].W = math.addMat(self.sigmoidLayers[i].W,deltaW);
            self.sigmoidLayers[i].b = math.addVec(self.sigmoidLayers[i].b,deltaB);
        }

        if(self.settings['log level'] > 0) {
            var progress = (1.*epoch/epochs)*100;
            if(progress > currentProgress) {
                console.log("MLP",progress.toFixed(0),"% Completed.");
                currentProgress+=8;
            }
        }
    }
    var crossentropy = MLP.code.getReconstructionCrossEntropy(L);
    if(self.settings['log level'] > 0)
        console.log("MLP Final Cross Entropy : ",crossentropy);
    var t1=Date.now();
    return {
      time:t1-t0,
      epochs:epochs,
      loss:crossentropy,
    }; } catch (e) { console.log (e) }
  },
  getReconstructionCrossEntropy : function(L) {
    var self = L;
    var reconstructedOutput = MLP.code.predict(L,self.x);
    var a = math.activateTwoMat(self.y,reconstructedOutput,function(x,y){
        return x*Math.log(y);
    });

    var b = math.activateTwoMat(self.y,reconstructedOutput,function(x,y){
        return (1-x)*Math.log(1-y);
    });

    var crossEntropy = -math.meanVec(math.sumMatAxis(math.addMat(a,b),1));
    return crossEntropy
  },
  predict : function(L,x) {
    var self = L;
    var output = x;
    for(i=0; i<self.nLayers+1 ; i++) {
        output = HiddenLayer.code.output(self.sigmoidLayers[i],output);
    }
    return output;
  },
  set : function(L,property,value) {
    var self = L;
    self.settings[property] = value;
  }
}
module.exports = MLP
