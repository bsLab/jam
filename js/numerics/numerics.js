var current=none;
var Aios=none;

var options = {
  version: '1.1.1'
}

module.exports = {
  current:function (module) { current=module.current; Aios=module; },
  agent: {
    fft:Require('numerics/fft'),
    matrix:Require('numerics/matrix'),
    vector:Require('numerics/vector'),
  }
}
