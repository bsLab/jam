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
 **    $CREATED:     1-1-17 by sbosse.
 **    $RCS:         $Id: sandbox.js,v 1.2 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.6.2
 **
 **    $INFO:
 **
 **  JavaScript AIOS Sandbox Function Constructor
 **
 **   Two version: (1) with eval (2) with new Function
 **   Evaluated code is sometimes slower than a constructed function, though with(mask){} is a performance
 *    leak, too.
 **
 **    $ENDOFINFO
 */
var Json = Require('jam/jsonfn');

/** Returns a new function f' without global references
 *  except them provided in modules, and the masked environemnt.
 *  An optional checkpointing function call cp can be optionally injected.
 *
 * typeof @inject = {cp?:string,rt?:string}
 * with cp is a checkpointing functions, rt is an exception catcher rethrower
 */
function sandbox(f,modules,inject,env)
{
  var p,
      F,
      mask,
      source;
  // set up an object to serve as the context for the code
  // being evaluated. 
  mask = {mask:undefined,modules:undefined,require:undefined,cp:undefined,f:undefined};
  // mask global properties 
  for (p in this)
    mask[p] = undefined;
  for (p in modules)
    mask[p]=modules[p];
  if (env) for (p in env)
    mask[p]=env[p];
  // execute script in private context
  
  // (new Function( "with(this) { " + scr + "}")).call(mask);
  if (typeof f == 'function') source = f.toString(true);  // try minification (true) if supported
  else source=f;
  
  if (inject.cp) {
    // CP injection
    var regex1= /while[\s]*\(([^\)]+)\)/g;
    var regex2= /for[\s]*\(([^\)]+)\)/g;
    var regex3= /function([^\{]+)\{/g;
  
    source=source.replace(regex1,"while (($1) && "+inject.cp+"())")
                 .replace(regex2,"for ($1,"+inject.cp+"())")
                 .replace(regex3,"function $1{"+inject.cp+"();");
  }
  if (inject.rt) {
    var regex4 = /catch[\s]*\([\s]*([a-zA-Z0-9_]+)[\s]*\)[\s]*\{/g;
    source=source.replace(regex4,'catch ($1) {'+inject.rt+'($1);');
  }
  
  function evalInContext(context, js) {
    return eval('with(context) { "use strict"; F=' + js + ' }');
  }

  // with (mask) {
  //   eval('"use strict"; F='+source);
  //}
  mask.eval=undefined;
  evalInContext(mask,source);
  
  return {fun:F,mask:mask,size:source.length};
}

/** Returns a new function f' without global references
 *  except them provided in modules, and the masked environemnt.
 *  An optional checkpointing function call cp can be optionally injected.
 *
 * typeof @inject = {cp?:string,rt?:string}
 * with cp is a checkpointing functions, rt is an exception catcher rethrower
 */
function Sandbox(f,modules,inject,env) {
  var p,mask={},_mask='process';
  for(p in global) {
    if (p.indexOf('Array')>0) continue;
    _mask = _mask + ',' + p;
  }
  for (p in modules)
    mask[p]=modules[p];
  if (env) for (p in env)
    mask[p]=env[p];
    
  if (typeof f == 'function') source = f.toString(true);  // try minification (true) if supported
  else source=f;

  if (inject.cp) {
    // CP injection
    var regex1= /while[\s]*\(([^\)]+)\)/g;
    var regex2= /for[\s]*\(([^\)]+)\)/g;
    var regex3= /function([^\{]+)\{/g;
  
    source=source.replace(regex1,"while (($1) && "+inject.cp+"())")
                 .replace(regex2,"for ($1,"+inject.cp+"())")
                 .replace(regex3,"function $1{"+inject.cp+"();");
  }
  if (inject.rt) {
    var regex4 = /catch[\s]*\([\s]*([a-zA-Z0-9_]+)[\s]*\)[\s]*\{/g;
    source=source.replace(regex4,'catch ($1) {'+inject.rt+'($1);');
  }

  mask.eval=undefined;_mask += ',eval'
  mask.require=undefined;_mask += ',require'

  var F = new Function(_mask,'"use strict"; with(this) { f=('+source+').bind(this)} return f')
              .bind(mask);
  return {fun:F(),mask:mask,_mask:_mask};
}

function sandboxObject(obj,mask) {
  var objS;
  if (typeof obj == 'object') obj=Json.stringify(obj);
  return Json.parse(obj,mask);
}

module.exports = {
  sandbox:sandbox,
  sandboxObject:sandboxObject,
  Sandbox:Sandbox
}

module.exports = function () {return sandbox}
