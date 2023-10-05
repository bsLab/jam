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
 **  JavaScript AIOS SAT Logic Solver API
 **
 **    $ENDOFINFO
 */
var current=none;
var Aios=none;
var options = {
  version: '1.1.1'
}

var Logic = Require('logic/logic-solver');

var Solved = [];

var sat = {
  create : function (options) {
    var model = {
      id : Aios.aidgen(), // or agent id?
      life : Aios.time()
    }
    return model;
  },
  
  eval: function (model,what) {
    sat.setup(model);
    if (!Solved[model.id]) return;
    Solved[model.id].life=Aios.time();
    return Solved[model.id].evaluate(what)
  },
  
  gc : function () {
    var time = Aios.time();
    for(var p in Solved) {
      if (Solved[p] && (Solved[p].time+sat.lifetime)<time) {
        delete Solved[p];
        delete Logic._minisatSolvers[p];
        delete Logic._termifiers[p];
      }
    }
  },
  // forbid rule
  F: function (model,logic) {
    sat.setup(model);   
    Logic.Solver.forbid(model,logic)
  },
  
  L : Logic,
  
  // require rule
  R: function (model,logic) { 
    sat.setup(model);  
    Logic.Solver.require(model,logic)
  },
  
  solver : function (options) {
    var model = sat.create();
    Logic.Solver(model);
    return model
  },
  
  // solve current logic formulas
  solve : function (model,assume) {
    sat.setup(model);
    if (!Solved[model.id]) {
      model._numClausesAddedToMiniSat=0;
    }
    if (assume)
      Solved[model.id]=Logic.Solver.solveAssuming(model,assume)
    else
      Solved[model.id]=Logic.Solver.solve(model);
    if (Solved[model.id]) Solved[model.id].life=Aios.time();
    return Solved[model.id]?Solved[model.id].getTrueVars():null
  },
  
  lifetime : 1E9,
  
  // complete the solver environemnt
  setup : function (model) {
    if (!Logic._termifiers[model.id] || !Logic._minisatSolvers[model.id]) {
      model.id=Aios.aidgen();
      model.life=Aios.time();
      Logic._termifiers[model.id]=new Logic.Termifier(model);
      model._numClausesAddedToMiniSat=0;
      Logic._minisatSolvers[model.id]=new Logic.MiniSat();
    }       
  },
  
  true : function (model) {
    sat.setup(model);
    if (!Solved[model.id]) return;
    Solved[model.id].life=Aios.time();
    return Solved[model.id].getTrueVars()
  }
}

sat.Logic   = sat.L;
sat.require = sat.R;
sat.forbid  = sat.F;

module.exports = {
  agent:sat,
  Logic:Logic,
  current:function (module) { current=module.current; Aios=module; }
}
