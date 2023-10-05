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
 **    $INITIAL:     (C) 2006-2019 BSSLAB
 **    $CREATED:     5-3-19 by sbosse.
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 **  JavaScript AIOS Machine Learning API: Text analysis
 **
 ** Portable model
 **
 **    $ENDOFINFO
 */
'use strict';
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios=none;

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}
function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}


// Create a model
function create(strings,options) {
  return {
    data:strings
  }
}

// Classify one sample; return best matching string
function classify(model,sample) {
  var matches = model.data.map(function (h) {
    return {
      match:similarity(h,sample),
      string:h
    }
  }).sort(function (a,b) {
    if (a.match < b.match) return 1; else return -1;
  });
  return matches[0];
}

module.exports = {
  classify:classify,
  create:create,
  similarity:similarity,
  current:function (module) { current=module.current; Aios=module;}  
}
