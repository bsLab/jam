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
 **    $CREATED:     29-5-19 by sbosse.
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 **  JavaScript AIOS Constraint Solver Programming API
 **
 **    $ENDOFINFO
 */
 
var Io = Require('com/io');
var Comp = Require('com/compat');
var simple = Require('csp/cspS');
var current=none;
var Aios=none;

var CSP = {
  SIMPLE:'SIMPLE',
}
var options = {
  version: '1.1.1'
}


var csp = {
  /* Add constraint */
  C : function (model,v1,v2,f) {
    switch (model.algorithm) {
      case CSP.SIMPLE:
        model.constraints.push([v1,v2,f]);
        break;
    }    
  },
  V : function (model,name,val) {
    switch (model.algorithm) {
      case CSP.SIMPLE:
        model.variables[name]=val;
        break;
    }    
  },
  range : function (a,b,step) {
    var res=[];
    if (step==undefined) step=1;
    for(var i=a;i<=b;i=i+step) res.push(i);
    return res;
  },
  /* Create a new solver */
  solver : function (options) {
    var model={}
    options=checkOptions(options,{});
    options.algorithm=checkOption(options.algorithm,CSP.SIMPLE);
    model.algorithm=options.algorithm;
    switch (options.algorithm) {
      case CSP.SIMPLE:
        model.variables= {}
        model.constraints = []
        break;
    }
    return model
  },
  /* Solve the problem, return solutions */
  solve : function (model,options) {
    switch (model.algorithm) {
      case CSP.SIMPLE:
        return simple.solve(model)
    }  
  },
  CSP:CSP,
}

module.exports = {
  agent:csp,
  CSP:CSP,
  current:function (module) { current=module.current; Aios=module; }
}
