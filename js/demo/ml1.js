var Ml = require('/opt/JAM/lib/libml');

// KNN
console.log(Ml)
var data = [
[0, 0, 0], [0, 1, 1], [1, 1, 0], [2, 2, 2], [1, 2, 2], [3, 2, 2], [3, 5, 6]
]
var results = [
'a', 'a', 'a', 'b', 'b', 'c', 'c'
]
var model1 = Ml.learn({x:data,y:results,algorithm:Ml.ML.KNN,distance:Ml.ML.EUCL});
console.log(model1)
var prediction1 = Ml.classify(model1,[[1.81, 1.81, 1.81], [0.5, 0.5, 0.5]]);
console.log(Ml.ML.KNN,prediction1)

// DTI
var model2 = Ml.learn({x:data,y:results,algorithm:Ml.ML.DTI,eps:0.2});
console.log(Ml.print(model2))
var prediction2 = Ml.classify(model2,[[1.81, 1.81, 1.81], [0.5, 0.5, 0.5]]);
console.log(Ml.ML.DTI,prediction2)

// MLP
var x = [[0.4, 0.5, 0.5, 0.,  0.,  0.],
         [0.5, 0.3,  0.5, 0.,  0.,  0.],
         [0.4, 0.5, 0.5, 0.,  0.,  0.],
         [0.,  0.,  0.5, 0.3, 0.5, 0.],
         [0.,  0.,  0.5, 0.4, 0.5, 0.],
         [0.,  0.,  0.5, 0.5, 0.5, 0.]];
var y = [[1, 0],
         [1, 0],
         [1, 0],
         [0, 1],
         [0, 1],
         [0, 1]];

var mlp1 = new Ml.learn({
    x : x,
    y : y,
    labels:['a','b'],
    hidden_layers : [4,4,5],
    lr : 0.6,
    epochs : 20000,
    algorithm:Ml.ML.MLP,
    verbose:1
});
a = [[0.5, 0.5, 0., 0., 0., 0.],
     [0., 0., 0., 0.5, 0.5, 0.],
     [0.5, 0.5, 0.5, 0.5, 0.5, 0.]];

console.log(Ml.ML.MLP,Ml.classify(mlp1,a));
console.log(Ml.ML.MLP,Ml.classify(mlp1,a[0]));

var x = [[0.004, 0.005, 0.005, 0.,  0.,  0.],
         [0.005, 0.003, 0.005, 0.,  0.,  0.],
         [0.004, 0.005, 0.005, 0.,  0.,  0.],
         [0.,  0.,  0.005, 0.003, 0.005, 0.],
         [0.,  0.,  0.005, 0.004, 0.005, 0.],
         [0.,  0.,  0.005, 0.005, 0.005, 0.]];
var y = ['a',
         'a',
         'a',
         'b',
         'b',
         'b'];

var mlp2 = new Ml.learn({
    x : x,
    y : y,
    features:['f1','f2','f3','f4','f5','f6'],
    labels:['a','b'],
    hidden_layers : [4,4,5],
    lr : 0.6,
    epochs : 20000,
    algorithm:Ml.ML.MLP,
    normalize:true,
    bipolar:true,
    verbose:1
});



console.log(Ml.ML.MLP,Ml.classify(mlp2,{f1:0.005,f2:0.005,f3:0,f4:0,f5:0,f6:0}));

// SVM
var x = [[0.4, 0.5, 0.5, 0.,  0.,  0.],
         [0.5, 0.3,  0.5, 0.,  0.,  0.01],
         [0.4, 0.8, 0.5, 0.,  0.1,  0.2],
         [1.4, 0.5, 0.5, 0.,  0.,  0.],
         [1.5, 0.3,  0.5, 0.,  0.,  0.],
         [0., 0.9, 1.5, 0.,  0.,  0.],
         [0., 0.7, 1.5, 0.,  0.,  0.],
         [0.5, 0.1,  0.9, 0.,  -1.8,  0.],
         [0.8, 0.8, 0.5, 0.,  0.,  0.],
         [0.,  0.9,  0.5, 0.3, 0.5, 0.2],
         [0.,  0.,  0.5, 0.4, 0.5, 0.],
         [0.,  0.,  0.5, 0.5, 0.5, 0.],
         [0.3, 0.6, 0.7, 1.7,  1.3, -0.7],
         [0.,  0.,  0.5, 0.3, 0.5, 0.2],
         [0.,  0.,  0.5, 0.4, 0.5, 0.1],
         [0.,  0.,  0.5, 0.5, 0.5, 0.01],
         [0.2, 0.01, 0.5, 0.,  0.,  0.9],
         [0.,  0.,  0.5, 0.3, 0.5, -2.3],
         [0.,  0.,  0.5, 0.4, 0.5, 4],
         [0.,  0.,  0.5, 0.5, 0.5, -2]];

var y =  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,1,1,1,1,1,1,1,1,1];

var svm = Ml.learn({
    x : x,
    y : y,
    C : 1.1, // default : 1.0. C in SVM.
    tol : 1e-5, // default : 1e-4. Higher tolerance --> Higher precision
    max_passes : 20, // default : 20. Higher max_passes --> Higher precision
    alpha_tol : 1e-5, // default : 1e-5. Higher alpha_tolerance --> Higher precision

    kernel : { type: "polynomial", c: 1, d: 5},
    // default : {type : "gaussian", sigma : 1.0}
    // {type : "gaussian", sigma : 0.5}
    // {type : "linear"} // x*y
    // {type : "polynomial", c : 1, d : 8} // (x*y + c)^d
    // Or you can use your own kernel.
    // kernel : function(vecx,vecy) { return dot(vecx,vecy);}
    algorithm:Ml.ML.SVM
});

console.log(svm.algorithm,Ml.classify(svm,[1.3,  1.7,  0.5, 0.5, 1.5, 0.4]));


// C4.5
var CLASS1='CL1',CLASS2='CL2',A='A',B='B',C='C',True=true,False=false;
var data = [
[A,70,True,CLASS1],
[A,90,True,CLASS2],
[A,85,False,CLASS2],
[A,95,False,CLASS2],
[A,70,False,CLASS1],
[B,90,True,CLASS1],
[B,78,False,CLASS1],
[B,65,True,CLASS1],
[B,75,False,CLASS1],
[C,85,True,CLASS1],
[C,80,True,CLASS2],
[C,70,True,CLASS2],
[C,80,False,CLASS1],
[C,80,False,CLASS1],
[C,96,False,CLASS1],
];
var c45 = Ml.learn({
    data:data,
    algorithm:Ml.ML.C45
});

var testData = [
        [B,71,False],
        [C,70,True],
        [C,75,True],
        [C,95,True],
      ];
console.log(c45.algorithm,Ml.classify(c45,testData));
