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
 **    $INITIAL:     (C) 2006-2022 bLAB
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: conf.js,v 1.2 2017/05/23 07:00:43 sbosse Exp $
 **    $VERSION:     1.3.1
 **
 **    $INFO:
 **
 **  JavaScript AIOS Agent Reconfiguration Sub-System
 **
 **    $ENDOFINFO
 */

var Json = Require('jam/jsonfn');
var Comp = Require('com/compat');
var current=none;
var Aios = none;

var act = {
  add: function (act,code) {
    if (typeof code == 'function') current.process.agent.act[act]=code;
    else if (typeof code == 'string') {
      with(current.process.mask) {
        current.process.agent.act[act]=eval(code);
      }    
    } 
    // Add the new activity to the mask environment of the agent for further referencing.
    current.process.mask[act]=act;
  },
  // return deleted activity(ies)
  delete: function (act) {
    if(Comp.obj.isArray(act)) return Comp.array.map(act,function (a) { 
      var f=current.process.agent.act[a]; 
      current.process.agent.act[a]=undefined;
      return f;
    });
    else {
      var f = current.process.agent.act[act];
      current.process.agent.act[act]=undefined;
      return f;
    }
  },
  update: function (act,code) {
    if (typeof code == 'function') current.process.agent.act[act]=code;
    else if (typeof code == 'string') current.process.agent.act[act]=Json.parse(code,current.process.mask);
  }
};
var __eval=eval;
function sandBoxCode(mask,code) {
  var __code;
  with (mask) {
    __code=__eval('__code='+code);
  }
  // console.log(typeof __code);
  return __code;
}
var trans = {
  add: function (from,cond,data) {
    if (current.process.agent.trans[from]) {
      function wrap(s) { return s[0]=='"'||s[0]=="'"?s:'"'+s+'"' };
      var old = current.process.agent.trans[from];
      if (typeof old != 'function') old='function () { return'+wrap(old)+'}';
      else old = old.toString();
      if (typeof cond != 'function') cond='function () { return'+wrap(cond)+'}';
      else cond = cond.toString();
      if (data) data=JSON.stringify(data);
      else data='null';
      var merged = 'function () { var next = ('+cond+').call(this,'+data+'); if (next) return next; else return ('+old+').call(this) }';
      // console.log(merged);
      var code = sandBoxCode(current.process.mask,merged);
      current.process.agent.trans[from]=code;
      // console.log(typeof current.process.agent.trans[from])
    } else current.process.agent.trans[from]=cond;
  },
  // return deleted transaction(s)
  delete: function (trans) {
    if(Comp.obj.isArray(trans)) Comp.array.iter(trans,function (t) {
      var f = current.process.agent.trans[t];
      current.process.agent.trans[t]=undefined;
      return f
    });
    else {
      var f = current.process.agent.trans[trans];
      current.process.agent.trans[trans]=undefined;
      return f;
    }
  },
  update: function (from,cond) {
    current.process.agent.trans[from]=cond;
  }  
}


module.exports = {
  agent:{
    act:act,
    trans:trans
  },
  current:function (module) { current=module.current; Aios=module; }
}
