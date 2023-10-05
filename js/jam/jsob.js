

/** Convert agent object to text source in JSOB format
 *
 */
function toString(o) {
  var p,i,s='',sep;
  if (Comp.obj.isArray(o)) {
    s='[';sep='';
    for(p in o) {
      s=s+sep+toString(o[p]);
      sep=',';
    }
    s+=']';
  } else if (o instanceof Buffer) {    
    s='[';sep='';
    for(i=0;i<o.length;i++) {
      s=s+sep+toString(o[i]);
      sep=',';
    }
    s+=']';  
  } else if (typeof o == 'object') {
    s='{';sep='';
    for(p in o) {
      if (o[p]==undefined) continue;
      s=s+sep+"'"+p+"'"+':'+toString(o[p]);
      sep=',';
    }
    s+='}';
  } else if (typeof o == 'string')
    s="'"+o.toString()+"'"; 
  else if (typeof o == 'function') 
    s=o.toString(true);   // try minification (true) if supported by platform
  else if (o != undefined)
    s=o.toString();
  else s='undefined';
  return s;
}

/** Convert agent text sources to agent code in JSOB format
 *
 */
function ofString(source,mask) {
  var code;
  try {
    // execute script in private context
    with (mask) {
      eval('"use strict"; code = '+source);
    }
  } catch (e) { console.log(e) };
  return code; 
}

modules.exports = {
  parse:ofString,
  stringify:toString,
}


