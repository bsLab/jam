var _ = undefined

function empty(v) {
    if (v == undefined) return true;
    if (isString(v)) return v=='';
    if (isArray(v)) return v.length==0;
    if (isObject(v)) return Object.keys(v).length==0;
    return false    
}

function isArray(o) {
  if (o==_ || o ==null) return false;
  else return typeof o == "array" || (typeof o == "object" && o.constructor === Array);
}
function isArrayArray(o) {
    if (o==_ || o ==null) return false;
    else return Utils.isArray(o) &&
                Utils.isArray(o[0]);
  }
function isArrayArrayArray(o) {
    if (o==_ || o ==null) return false;
    else return Utils.isArray(o) &&
                Utils.isArray(o[0]) &&
                Utils.isArray(o[0][0]);
  }
function isMatrix(o) {
  if (o==_ || o ==null) return false;
  else return isArray(o) &&
              isArray(o[0]);
}
function isBoolean (o) {
  return typeof o == "boolean"
}
function isBuffer (o) {
  if (o==_ || o ==null) return false;
  else return o instanceof Buffer;
}
function isEmpty(o) {
  for(var prop in o) {
     if (o[prop]!=undefined) return false;
  }
  return true;  
}
function isFunction(o) {
    return typeof o == "function";
}
function isObj(o) {
    return typeof o == "object";
}
function isObject(o) {
    return typeof o == "object";
}
function isRegex(o) {
    return o instanceof RegExp;
}
function isString(o) {
    return typeof o == "string" || (typeof o == "object" && o.constructor === String);
}
function isNumber(o) {
    return typeof o == "number" || (typeof o == "object" && o.constructor === Number);
}

function isTypedArray(o) {
    return Utils.isObject(o) && o.buffer instanceof ArrayBuffer
}
function isVector(o,noarray) {
    if (o==_ || o ==null) return false;
    else return (!noarray && Utils.isArray(o)) ||
                (Math.VectorTA && Math.VectorTA.isVector(o)) ||
                (Math.Vector && Math.Vector.isVector(o))
                ;
}


function flatten(array) {
    var res=[];
    var len=array.length;
    var i;
    for(i=0;i<len;i++) {
        var element=array[i];
        if (!isArray(element)) res.push(element);
        else {
            var j;
            var len2=element.length;
            for(j=0;j<len2;j++) {
                var element2=element[j];
                res.push(element2);
            }
        }
    }
    return res;
}

function nativeLoadFile (cb) {
  var input = document.createElement('input');
  input.type = 'file';
  input.onchange = function (e) { 
     // getting a hold of the file reference
     var file = e.target.files[0]; 

     // setting up the reader
     var reader = new FileReader();
     reader.readAsText(file,'UTF-8');

     // here we tell the reader what to do when it's done reading...
     reader.onload = function (readerEvent) {
        var content = readerEvent.target.result; // this is the content!
        // console.log( content );
        cb(content)
     }
  }
  input.click();
}

function loadFile (cb,binary) {
  if (Config.workdir) {
    // Try WEX service?
    return FS.API.loadFile(binary?'binary':'text',function (result,file) {
      if (Utils.isError(result)) {
        return nativeDialog();
      }
      if (cb) cb(result,file);
    })
  }
  function nativeDialog() {
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = function (e) { 
      // getting a hold of the file reference
      var file = e.target.files[0]; 

      // setting up the reader
      var reader = new FileReader();
      if (binary)
        reader.readAsArrayBuffer(file);
      else  
        reader.readAsText(file,'UTF-8');

       // here we tell the reader what to do when it's done reading...
       reader.onload = function (readerEvent) {
          var content = readerEvent.target.result; // this is the content!
          // console.log( content );
          if (binary)
            cb(new Uint8Array(content),input.files[0].name);
          else
            cb(content,input.files[0].name)
       }
    }
    input.click();
  }
  nativeDialog();
}

function nativeSveFile(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}
function saveFile(data, filename, mimetype) {
    if (Config.workdir) {
      // Try WEX service?
      return FS.API.saveFile(data, filename, mimetype||'text',function (result) {
        if (Utils.isError(result)) {
          return nativeDialog();
        }
      })
    }
    function nativeDialog() {
      var file = new Blob([data], {type: mimetype});
      if (window.navigator.msSaveOrOpenBlob) // IE10+
          window.navigator.msSaveOrOpenBlob(file, filename);
      else { // Others
          var a = document.createElement("a"),
              url = URL.createObjectURL(file);
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(function() {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);  
          }, 0); 
      }
    }
}


function loadData(from) {
  function parse(text) {
    var o = JSON.parse(text);
    console.log(o);
    if (o.meta && o.meta.file && appConfig.file && appConfig.file!=o.meta.file) {
      var r = confirm('Wrong JSON notebook version (expected '+appConfig.file+', but got '+o.meta.file+')\nContinue anyway?');
      if (!r) return;
    }
    var i,id,p,el,els = document.getElementsByTagName('textarea');
    if (o.styles) {
      for(var id in o.styles) {
        var style=o.styles[id];
        var el = document.getElementById(id);
        if (el) {
          for (var p in style) {
            el.style[p]=style[p];
          }
        }
      }
    }
    for(i=0;i<els.length;i++) {
      el=els[i];
      if (el.id.indexOf('input')==0)
        el.value=o.textarea[el.id];
    };
    if (typeof Editors != 'undefined') for(i in Editors) {
      if (o.editors[i]) { 
        Editors[i].setValue(o.editors[i]);
        Editors[i].refresh();
      }
    };
    if (typeof Tables != 'undefined') for(i in Tables) {
      if (o.tables[i]) Tables[i].setRows(o.tables[i]);
    };
    els = document.getElementsByClassName('inputfield');
    for(i=0;i<els.length;i++) {
      el=els[i];
      if (o.input[el.id])
        el.value=o.input[el.id];
    };
    if (o.points) {
      // get all points input fields
      els = document.getElementsByClassName('points');
      for(i=0;i<els.length;i++) {
        el=els[i];
        if (o.points[el.id]!="") {
          el.value=o.points[el.id];
          // make field immutable!!!!
          el.readOnly = true; 
        }
      };
    }
    if (o.notes) {
      Notes=[];
      PostClear();
      for(i=0;i<o.notes.length;i++) {
        Notes[i]=o.notes[i];
        if (i>0) {
          PostIt(null,Notes[i]);
        }
      }
    }
    if (typeof State != 'undefined' && o.this) State.this=o.this;
  }
  try {
  if (from) parse(from);
  else loadFile(parse);
  } catch (e) { console.log(e) }
}

function saveData(to) {
  var base = appConfig.file||document.URL.match(/([a-zA-Z_0-9\-]+)\.html(#.+)?(\?.+)?$/)[1];
  var i,o = {editors:{}, styles:{}, textarea:{},input:{},tables:{}, points:{}},el;
  var els = document.getElementsByTagName('textarea');
  // generic text input blocks (via textarea)
  for(i=0;i<els.length;i++) {
    el=els[i];
    if (el.id.indexOf('input')==0) o.textarea[el.id]=el.value;
  };
  if (typeof Editors != 'undefined') 
    for(i in Editors) {
      o.editors[i]=Editors[i].getValue();
      // Save styles, too
      el = document.getElementById('CodeMirror-scroll'+i);
      if (el) o.styles['CodeMirror-scroll'+i]={'max-height':el.style['max-height']};
    };
  // embedded input fields
  var els = document.getElementsByClassName('inputfield');
  for(i=0;i<els.length;i++) {
    el=els[i];
    o.input[el.id]=el.value;
  };
  // get all editable tables (Tables)
  if (typeof Tables != 'undefined') for(i in Tables) {
    o.tables[i]=Tables[i].getRows();
  }
  // get all points input fields
  els = document.getElementsByClassName('points');
  for(i=0;i<els.length;i++) {
    el=els[i];
    o.points[el.id]=el.value;
  };
  
  // update Notes with sticky notes (Note[0]: Top note editor text)
  var notes = $('.sticky-note');
  for(i=0;i<notes.length;i++) {
    var note = $(notes[i]), data=note.data(), off=note.offset();
    var ta = note.find('textarea');
    var shape = { left   : off.left, 
                  top    : off.top, 
                  height : note.height(),
                  width  : note.width(),
                  background : note.css('background-color'),
                  color : note.css('color'),
                  fontsize: ta.css('font-size'),
                  lineheight : ta.css('line-height'),
    };
    if (data.snToggle) shape.toggle={left:data.snLeft,height:data.snHeight,width:data.snWidth};
    var text = ta.val();
    Notes[i+1]={ text:text, shape:shape };
  }
  o.notes=Notes;
  o.meta={
    file:appConfig.file,
    title:appConfig.title
  }
  if (typeof State != 'undefined') o.this=State.this;
  // console.log(o);
  if (to) return { data: JSON.stringify(o), filename: base };
  else saveFile(JSON.stringify(o),base+'.json');
}

function  loadScript (filename) {
    var fileref = document.createElement('script');
    fileref.setAttribute("type", "text/javascript");
    fileref.setAttribute("src", filename);
    if (typeof fileref != "undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
}

/** Change CSS 
 *
 */
function changeCSS(theClass,element,value) {
   var cssRules;

   for (var S = 0; S < document.styleSheets.length; S++) {
	 try {
	   document.styleSheets[S].insertRule(theClass+' { '+element+': '+value+'; }',
                                          document.styleSheets[S][cssRules].length);
	 } catch(err) {
	   try{
         document.styleSheets[S].addRule(theClass,element+': '+value+';');
	   } catch(err){
		   try{
			 if (document.styleSheets[S]['rules']) {
			   cssRules = 'rules';
			  } else if (document.styleSheets[S]['cssRules']) {
			   cssRules = 'cssRules';
			  } else {
			   //no rules found... browser unknown
			  }

			  for (var R = 0; R < document.styleSheets[S][cssRules].length; R++) {
			    if (document.styleSheets[S][cssRules][R].selectorText == theClass) {
				  if(document.styleSheets[S][cssRules][R].style[element]){
				    document.styleSheets[S][cssRules][R].style[element] = value;
				    break;
				  }
			    }
		      }
		   } catch (err){}
	   }
	 }
  }
}

/** Cookie Management
 *
 */
function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}


function hashCode(s) {
  var h = 0, l = s.length, i = 0;
  if ( l > 0 )
    while (i < l)
     h = (h << 5) - h + s.charCodeAt(i++) | 0;
  return h;
};

Object.addProperty = function (obj,name,fun) {
  if (obj.prototype[name]) return;
  obj.prototype[name]=fun;
  Object.defineProperty(obj.prototype, name, {enumerable: false});
};

Object.updateProperty = function (obj,name,fun) {
  obj.prototype[name]=fun;
  Object.defineProperty(obj.prototype, name, {enumerable: false});
};

function uniqueID(length) {
  var s='',
      keys=['a','b','c','d','e','f','g','h','i','j','k','l',
            'o','p','q','r','s','t','u','v','w','x','y','z'];
  keys=keys.concat(keys,keys.map(function (k) { return k.toUpperCase() }));
  keys=keys.concat([1,2,3,4,5,6,7,8,9]);
  for(var i=0;i<length;i++) {
    s+= (keys[(Math.random()*keys.length)|0]);
  }
  return s;
}
  
function copy(o) {
  // recursively copy objects
  var _o,p;
  if (isArray(o)) {
    if (typeof o[0] != 'object') return o.slice();
    else return o.map(function (e) {
          if (typeof e == 'object') return copy(e);
            else return e;
          });

  } else if (isObject(o)) {
    if (o instanceof Date) return o;
    _o={};
    for(p in o) _o[p]=(typeof o[p]=='object'?copy(o[p]):o[p]);
    return _o;
  } 
  else if (isString(o)) 
    return o.slice();
  else return o;

}

// Analyze JS using esprima
function analyze (code)  {
  var more='';
  try {
    var ast = esprima.parse(code, { tolerant: true, loc:true });
    if (ast.errors && ast.errors.length>0) more = ast.errors[0];
  } catch (e) {
    if (e.lineNumber) more = e+', in line '+e.lineNumber; 
  }
  return more;
}

BrowserVersion = (function(){
      var ua= navigator.userAgent, tem, 
      M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
      if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
      }
      if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
      }
      M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
      if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
      return {name:M[0],version:M[1]};
    })(),

_Utils = {
  analyze : analyze,
  copy:copy,
  empty:empty,
  isArray:isArray,
  isArrayArray:isArrayArray,
  isArrayArrayArray:isArrayArrayArray,
  isBoolean:isBoolean,
  isBuffer:isBuffer,
  isMatrix:isMatrix,
  isEmpty:isEmpty,
  isError : function (o) {
    return o instanceof Error
  },
  isFunction:isFunction,
  isObj:isObj,
  isObject:isObject,
  isRegex:isRegex,
  isString:isString,
  isTypedArray:isTypedArray,
  isVector:isVector,
  isNumber:isNumber,
  loadData:loadData,
  loadScript:loadScript,
  flatten:flatten,
  uniqueID:uniqueID,
  
  ofString : function (source) {
    var code;
    try {
      // execute script in private context
      eval('code = '+source);
    } catch (e) { console.log(e,source); };
    return code; 
  },

  /** Convert any object to text source in JSOB format
  *
  */
  toString : function (o) {
    var usebuffer=false;
    var p,i,keys,s='',sep,tokens;
    if (o===null) return 'null';
    else if (Utils.isArray(o)) {
      s='[';sep='';
      for(p in o) {
        s=s+sep+Utils.toString(o[p]);
        sep=',';
      }
      s+=']';
    } else if (typeof Buffer != 'undefined' && o instanceof Buffer) {    
      s='Buffer([';sep='';
      for(i=0;i<o.length;i++) {
        s=s+sep+Utils.toString(o[i]);
        sep=',';
      }
      s+='])';  
    } else if (o instanceof Error) {    
      s='(new Error("'+o.toString()+'"))';
    } else if (Utils.isTypedArray(o)) {    
      s='(new '+Utils.TypedArrayToName(o)+'([';sep='';
      var b=Array.prototype.slice.call(o);
      for(i=0;i<b.length;i++) {
        s=s+sep+String(b[i]);
        sep=',';
      }
      s+=']))';  
    } else if (typeof o == 'object') {
      s='{';sep='';
      keys=Object.keys(o);
      for(i in keys) {
        p=keys[i];
        if (o[p]==undefined) continue;
        s=s+sep+"'"+p+"'"+':'+Utils.toString(o[p]);
        sep=',';
      }
      s+='}';
      if (o.__constructor__) s = '(function () { var o='+s+'; o.__proto__='+o.__constructor__+'.prototype; return o})()';
    } else if (typeof o == 'string')
      s=JSON.stringify(o);
    else if (typeof o == 'function') {
      s=o.toString(true);   // try minification (true) if supported by platform
      if (tokens=s.match(/function[ ]+([a-zA-Z0-9]+)[ ]*\(\)[ ]*{[^\[]*\[native code\][^}]*}/)) {
        return tokens[1];
      } else return s;
    } else if (o != undefined)
      s=o.toString();
    else s='undefined';
    return s;
  },
  
  get :function (url,callback){
      // read text from URL location
      var request = new XMLHttpRequest();

      request.open('GET', url, true);
      request.send(null);
      request.onreadystatechange = function () {
          if (request.readyState === 4) {
              callback( request.responseText );
          }
      }
  },
        
  put : function (url,data,callback){
      // write text to URL location
      var request = new XMLHttpRequest();

      request.open('POST', url, true);
      request.send(data);
      request.onreadystatechange = function () {
          if (request.readyState === 4 && request.status === 200) {
            if (callback) callback( 'POST '+request.responseText );
          }
      }
  },
  
  GET: function (url,params,cb,sync) {
    var result;
    if (sync && !cb) cb=function (_result) { result=_result }; 
    if (url.indexOf('http')!=0) url = 'http://'+url;
    try {
      if (params) {
        var o=params,sep='';
        params='/?';
        for(var p in o) {
          params = params + sep+ p + '='+o[p];
          sep='&';
        } 
      } else params='';
      // print(url+params)
      var request = new XMLHttpRequest();
      request.open("GET",url+params, !sync);
      request.onreadystatechange = function () {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                var allText = request.responseText;
                cb(JSON.parse(allText));
            } else cb('GET from '+url+params+' failed (status)');
        }
      }
      request.onerror = function (err) {
        cb(null,'GET from '+url+params+' failed (error)')
      }
      request.send(null);
    } catch (e) {
      cb(e)
    }
    return result;
  },
  
  _POST: function (url,data,cb,sync){
    var params,headers;
    if (data && data.params && data.data != undefined) {
      params=data.params;
      headers=data.headers;
      data=data.data;
    }
    var ishttps= url.match(/https:/);
    var result;
    if (!cb && sync) { cb=function (_result) { result=_result }}; 
    if (url.indexOf('http')!=0) url = 'http://'+url;
    try {
      var request = new XMLHttpRequest();
      request.open("POST", url, !sync);
      request.onreadystatechange = function () {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                var allText = request.responseText;                
                if (cb && allText!='') cb(JSON.parse(allText))
                else if (cb) cb(new Error('POST data error'));
            } else if (cb) cb(new Error('POST to '+url+' failed (status)'));
        }
      }
      request.onerror = function (err) {
        if (cb) cb(new Error('POST to '+url+' failed (error)'))
      }
      request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      request.send(JSON.stringify(data));
    } catch (e) {
      if (cb) cb(e)
    }
    return result;
  },

  POST: function (url,data,cb,sync){
    var result;
    // if (sync && !cb) cb=function (_result) { result=_result }; 
    if (url.indexOf('http')!=0) url = 'http://'+url;
    try {
      var request = new XMLHttpRequest();
      request.open("POST", url, !sync);
      request.onreadystatechange = function () {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {console.log(request);
                var allText = request.responseText;
                try {           
                  if (allText!='') result=JSON.parse(allText)
                  else result=new Error('POST data error (empty data)');
                } catch (e) {
                  result = new Error(e.toString());
                }
                if (cb) cb(result);
            } else {
                result = new Error('POST to '+url+' failed (status)');
                if (cb) cb(result);
            }
        }
      }
      request.onerror = function (error) {
        if (result) return;
        result = new Error('POST to '+url+' failed: '+error);
        if (cb) cb(result)
      }
      request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      request.send(JSON.stringify(data));
    } catch (error) {
      result=new Error('POST to '+url+' failed: '+error.toString());
      if (cb) cb(result)
    }
    return result;
  },

}


// Some polyfills
UI= $$;
// String prototype extensions

if (!String.prototype.contains) {
  Object.addProperty(String,'contains', function (el) {
    return this.includes(el)
  })
}

if (typeof Utils == 'undefined') Utils=_Utils;
else Object.assign(Utils,_Utils);


