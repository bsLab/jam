var jamlib = require('./jamlib.debug');
var util = require('util');
var N = 100;

print('Checkpoint 0: Creating JAM...');

// Create the JAM and JAM world consisting of one logical node
var JAM = jamlib.Jam({
  print:function (msg) {console.log(msg);},
  verbose:1,
});


print('Checkpoint 1: Starting JAM...');
JAM.init();
JAM.start();
print(util.inspect(JAM.stats('node')))


print('Checkpoint 2: Compiling agent constructor function...');

function ac(options) {
  this.options=options;
  this.act = {
    a1:function () {},
    a2:function () {},
    a3:function () {},
    a4:function () {log('Checkpoint a4');},
  }
  this.trans = {
    a1:a2,
    a2:function () { if (this.options.state<100) return a3; else return a4; },
    a3:a4,
  }
  this.next=a1;
}

try { JAM.compileClass(undefined,ac,{verbose:1}); }
catch (e) { 
  print(e);
  print('Checkpoint 2: Compiling agent constructor function with name ...');
  JAM.compileClass('ac',ac,{verbose:1});
};

print('Checkpoint 3: Creating agents ...');
for(var i = 0; i<N;i++) {
  JAM.createAgent('ac',{verbose:0});
} 
print(util.inspect(JAM.stats('process')))
print(util.inspect(JAM.stats('vm')))

print('All checks passed.');
