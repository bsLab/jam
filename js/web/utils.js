var XHR = XMLHttpRequest
if (!XHR) throw new Error('missing XMLHttpRequest')
else console.log('HTTP Browser Module Ver. 1.1.3 initialized.');

Utils = {
  addCSS : function (styles) {
    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)    
  },
  
  // Analyze JS using esprima
  analyze : function  (code)  {
    var more='';
    try {
      var ast = esprima.parse(code, { tolerant: true, loc:true });
      if (ast.errors && ast.errors.length>0) more = ast.errors[0];
    } catch (e) {
      if (e.lineNumber) more = e+', in line '+e.lineNumber; 
    }
    return more;
  },

  beep : function (duration,volume,frequency,type) {
    if (!Utils.audioCtx) Utils.audioCtx=new(window.AudioContext || window.webkitAudioContext)();
    
    var oscillator = Utils.audioCtx.createOscillator();
    var gainNode = Utils.audioCtx.createGain();
    duration=duration||10;
    volume=volume||100;
    frequency=frequency||1000;
    type=type||'sine';
    oscillator.connect(gainNode);
    gainNode.connect(Utils.audioCtx.destination);

    gainNode.gain.value = volume;
    oscillator.frequency.value = frequency;
    oscillator.type = type;


    oscillator.start();

    setTimeout(
      function() {
        oscillator.stop();
      },
      duration
    );
    
    oscillator.onended = function () {
        Utils.audioCtx.close();
        Utils.audioCtx=null;
    };
  },

  BrowserVersion :(function(){
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

  /** Change CSS 
   *
   */
  changeCSS: function changeCSS(theClass,element,value) {
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
  },
  
  copy : function (o) {
    // recursively copy objects
    var _o,p;
    if (Utils.isArray(o)) {
      if (typeof o[0] != 'object') return o.slice();
      else return o.map(function (e) {
            if (typeof e == 'object') return Utils.copy(e);
              else return e;
            });
      
    } else if (Utils.isObject(o)) {
      if (o instanceof Date) return o;
      _o={};
      for(p in o) _o[p]=(typeof o[p]=='object'?Utils.copy(o[p]):o[p]);
      return _o;
    } 
    else if (Utils.isString(o)) 
      return o.slice();
    else return o;
  
  },
  
  empty : function (v) {
    if (v == undefined) return true;
    if (Utils.isString(v)) return v=='';
    if (Utils.isArray(v)) return v.length==0;
    if (Utils.isObject(v)) return Object.keys(v).length==0;
    return false    
  },
  
  equal : function (o1,o2) {
    if (Utils.isArray(o1) && Utils.isArray(o2)) {
      if (o1.length!=o2.length) return false;
      for(var i=0;i<o1.length;i++) if (o1[i]!=o2[i]) return false;
      return true;
    }
    if (Utils.isObject(o1) && Utils.isObject(o2)) {
      var keys = Object.keys(o1);
      for(var i in keys) {
        if (!Utils.equal(o1[keys[i]],o2[keys[i]])) return false;
      }
      var keys = Object.keys(o2);
      for(var i in keys) {
        if (!Utils.equal(o1[keys[i]],o2[keys[i]])) return false;
      }
      return true;
    }
    return o1==o2
  },
  
  eraseCookie:function eraseCookie(name) {   
      document.cookie = name+'=; Max-Age=-99999999;';  
  },



  flatten: function flatten(array) {
      var res=[];
      var len=array.length;
      var i;
      for(i=0;i<len;i++) {
          var element=array[i];
          if (!Utils.isArray(element)) res.push(element);
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
  },

  getCookie:function getCookie(name) {
      var nameEQ = name + "=";
      var ca = document.cookie.split(';');
      for(var i=0;i < ca.length;i++) {
          var c = ca[i];
          while (c.charAt(0)==' ') c = c.substring(1,c.length);
          if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
      }
      return Utils.sessionCache[name]; // fallback 
  },

  getCookieObject:function (name,def) {
      var nameEQ = name + "=";
      try {
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
          var c = ca[i];
          while (c.charAt(0)==' ') c = c.substring(1,c.length);
          if (c.indexOf(nameEQ) == 0) return JSONfn.parse(c.substring(nameEQ.length,c.length));
        }
        return def;
      } catch (e) {
      console.log(e)
        return def;
      }
  },

  getOptions : function (text) {
    var tokens=text.split(' ');
    var options={}
    tokens.forEach(function (av) {
      var pl = av.split('=')
      if (pl.length==2) options[pl[0]]=pl[1];
    })
    return options
  },


  hashCode: function hashCode(s) {
    var h = 0, l = s.length, i = 0;
    if ( l > 0 )
      while (i < l)
       h = (h << 5) - h + s.charCodeAt(i++) | 0;
    return h;
  },

  info: function (o) {
    switch (typeof o) {
      case 'function':
        return o.toString().match(/^(function[ ]*[a-zA-Z0-9_]*\([^\)]+\))/)[1];
    }
  },
  
  inspect : inspect,
  isArray: function isArray(o) {
    if (o==_ || o ==null) return false;
    else return typeof o == "array" || (typeof o == "object" && o.constructor === Array);
  },
  isArrayArray: function isArrayArray(o) {
    if (o==_ || o ==null) return false;
    else return Utils.isArray(o) &&
                Utils.isArray(o[0]);
  },
  isArrayArrayArray: function isArrayArrayArray(o) {
    if (o==_ || o ==null) return false;
    else return Utils.isArray(o) &&
                Utils.isArray(o[0]) &&
                Utils.isArray(o[0][0]);
  },
  isBuffer: function isBuffer(o) {
    if (o==_ || o ==null) return false;
    else return o instanceof Buffer;
  },
  isEmpty: function isEmpty(o) {
    for(var prop in o) {
       if (o[prop]!=undefined) return false;
    }
    return true;  
  },
  isError : function (o) {
    return o instanceof Error
  },
  isFunction: function isFunction(o) {
      return typeof o == "function";
  },
  isMatrix: function isMatrix(o,noarray) {
    if (o==_ || o ==null) return false;
    else return (!noarray && Utils.isArray(o) &&
                 Utils.isArray(o[0])) ||
                (Math.MatrixTA && Math.MatrixTA.isMatrix(o)) ||
                (Math.Matrix && Math.Matrix.isMatrix(o))
                ;
  },
  isObj: function isObj(o) {
      return typeof o == "object";
  },
  isObject: function isObject(o) {
      return typeof o == "object";
  },
  isRegex: function isRegex(o) {
      return o instanceof RegExp;
  },
  isString: function isString(o) {
      return typeof o == "string" || (typeof o == "object" && o.constructor === String);
  },
  isNumber: function isNumber(o) {
      return typeof o == "number" || (typeof o == "object" && o.constructor === Number);
  },
  isBoolean: function isBoolean (o) {
      return typeof o == "boolean"
  },
  isString: function isString(o) {
      return typeof o == "string"
  },
  isStruct: function isStruct(o) {
      return !Utils.isArray(o) && Utils.isObject(o)
  },
  isTypedArray: function isTypedArray(o) {
      return Utils.isObject(o) && o.buffer instanceof ArrayBuffer
  },
  isVector: function isVector(o,noarray) {
    if (o==_ || o ==null) return false;
    else return (!noarray && Utils.isArray(o)) ||
                (Math.VectorTA && Math.VectorTA.isVector(o)) ||
                (Math.Vector && Math.Vector.isVector(o))
                ;
  },

  // toplevel entry for loading JS/JSON/JSOB/CSV files
  load : function (url,mimetype,cb) {
    var text;
    function filedia(e,process) {
        popup.confirm({
          content : url+':<br>\n'+e+'<br>\n',
        },function (reply)  {            
            if (!reply.proceed) return;
            Common.loadFile(function (data) {
              if (!data) return;
              cb(process(data));
            },false)
        });      
    }
    if (typeof mimetype == 'function') cb=mimetype,mimetype=null;
    if (!mimetype && url.match(/\.json$/)) mimetype='JSON';
    if (!mimetype && url.match(/\.js/)) mimetype='JS';
    if (!mimetype && url.match(/\.csv/)) mimetype='CSV';
    switch (mimetype && mimetype.replace(/application\//,'')) {
      case 'JSON':
        if (cb) return Utils.loadFile(url,function (text,err) {
          if (!err) cb(Utils.ofJSON(text));
          else filedia(err,Utils.ofJSON);
        });
        else return Utils.ofJSON(Utils.loadFile(url));
      case 'JSOB':
        if (cb) return Utils.loadFile(url,function (text,err) {
          if (!err) cb(Utils.ofString(text));
          else filedia(err,Utils.ofString);
        });
        else return Utils.ofString(Utils.loadFile(url));
      case 'CSV':
        if (cb) return Utils.loadFile(url,function (text,err) {
          if (!err) cb(Utils.ofCSV(text));
          else filedia(err,Utils.ofCSV);
        });
        else {
          text =Utils.loadFile(url,null,true);
          if (typeof text != 'string') return text;
          else return Utils.ofCSV(text);
        }
      case 'JS': 
      default:
        return Utils.loadScript(url);
        break; 
    };

  },
  
  loadFile: function (url,cb) {
    var result,error,_cb=cb;
    if (!_cb) _cb=function (_result,_error) { result=_result; error=_error; }; 
    try {
      // print(url+params)
      var request = new XMLHttpRequest();
      request.open("GET",url, cb);
      request.onreadystatechange = function () {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                var allText = request.responseText;
                _cb(allText);
            } else _cb(null,'GET from '+url+' failed (status)');
        }
      }
      request.onerror = function (err) {
        _cb(null,'GET from '+url+' failed (error)')
      }
      request.send(null);
    } catch (e) {
      _cb(null,e)
    }
    return error||result;
  },

  loadScript: function (filename) {
    var fileref = document.createElement('script');
    fileref.setAttribute("type", "text/javascript");
    fileref.setAttribute("src", filename);
    if (typeof fileref != "undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref)
  },
  
  name: function (o) {
    switch (typeof o) {
      case 'function':
        return o.toString().match(/^function[ ]*([a-zA-Z0-9_]*)\([^\)]+\)/)[1];
    }
  },

  ofCSV : function (source,convert) {
    try {
      Papa.parse(source,{
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: function(results) {
          data=results.data;
          if (convert) { // first line must be header
            header=data.shift();
            data=data.map(function (row) {
              var r={};
              header.forEach(function (col,i) { r[col]=row[i] });
              return r; 
            }) 
          }
        }
      });
      if (data && data[0].length==1) data=data.map(function (row) { return row[0] });
      return data;
    } catch (e) {
      return e;
    }
  },
  
  ofJSON : function (source) {
    return JSONfn.parse(source,{});
  },
  
  /** Convert agent text sources to agent code in JSOB format
   *
   */
  ofString : function (source) {
    var code;
    try {
      // execute script in private context
      eval('code = '+source);
    } catch (e) { console.log(e,source) };
    return code; 
  },

  parseUrl : function (url) {
    if (!url) return {};
    var queryString = url.substring( url.indexOf('?') + 1 );
    if (queryString == url) return {};
    var params = {}, queries, temp, i, l;

    // Split into key/value pairs
    queries = queryString.split("&");

    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        if (temp[1]==undefined) temp[1]='true';
        params[temp[0]] = temp[1].replace('%20',' ');
    }

    return params;
  },


  save : function (path,data,mimetype) {
    if (!mimetype && path.match(/\.json$/)) mimetype='JSON';
    if (!mimetype && path.match(/\.csv/)) mimetype='CSV';
    switch (mimetype && mimetype.replace(/application\//,'')) {
      case 'JSON':
        if (typeof data == 'object') data=JSONfn.stringify(data);
        break;
    }
    return Common.saveFile(data,path);
  },

  strip: function strip(line) {
    return line.replace(/\"/g,'')
               .replace(/\'/g,'')
  },


  /** Cookie Management
   *
   */
  sessionCache : {},

  setCookie:function setCookie(name,value,days) {
      var expires = "";
      if (days) {
          var date = new Date();
          date.setTime(date.getTime() + (days*24*60*60*1000));
          expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "")  + expires + "; path=/";
      Utils.sessionCache[name]=value; // fallback if cookies are denied
  },

  setCookieObject:function (name,obj,days) {
      var expires = "";
      var value = JSONfn.stringify(obj);
      if (days) {
          var date = new Date();
          date.setTime(date.getTime() + (days*24*60*60*1000));
          expires = "; expires=" + date.toUTCString();
      }
      document.cookie = name + "=" + (value || "")  + expires + "; path=/";
  },
  
  stringToArrayBuffer : function (str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);

    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }

    return buf;
  },

  stringToUint8Array : function (str) {
    var bufView = new Uint8Array(str.length);

    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }

    return bufView;
  },
  
  time : function () { return Date.now() },
  
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
    } else if (o instanceof Buffer) {    
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
      s="'"+
            o.toString().replace(/'/g,'\\\'')
                        .replace(/\n/g,'\\n')+
        "'"; 
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


  /* TYPED ARRAY */
  typed_arrays : [
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array
  ],

  TypedArrayOfName : {
    Int8Array:Int8Array,
    Uint8Array:Uint8Array,
    Int16Array:Int16Array,
    Uint16Array:Uint16Array,
    Int32Array:Int32Array,
    Uint32Array:Uint32Array,
    Float32Array:Float32Array,
    Float64Array:Float64Array  
  },
  TypedArrayToName : function (ftyp) {
        if (ftyp==Int8Array   || ftyp instanceof Int8Array) return 'Int8Array';
        if (ftyp==Uint8Array  || ftyp instanceof Uint8Array) return 'Uint8Array';
        if (ftyp==Int16Array  || ftyp instanceof Int16Array) return 'Int16Array';
        if (ftyp==Uint16Array || ftyp instanceof Uint16Array) return 'Uint16Array';
        if (ftyp==Int32Array  || ftyp instanceof Int32Array) return 'Int32Array';
        if (ftyp==Uint32Array || ftyp instanceof Uint32Array) return 'Uint32Array';
        if (ftyp==Float32Array || ftyp instanceof Float32Array) return 'Float32Array';
        if (ftyp==Float64Array || ftyp instanceof Float64Array) return 'Float64Array';
  },


  uniqueID : function (length) {
    var s='',
        keys=['a','b','c','d','e','f','g','h','i','j','k','l',
              'o','p','q','r','s','t','u','v','w','x','y','z'];
    keys=keys.concat(keys,keys.map(function (k) { return k.toUpperCase() }));
    keys=keys.concat([1,2,3,4,5,6,7,8,9]);
    for(var i=0;i<length;i++) {
      s+= (keys[(Math.random()*keys.length)|0]);
    }
    return s;
  },

  /** request
   *  typeof @options = { url:string, host: string, port:number, path:string, method:"GET"|"PUT", body?:string, headers:{} } 
   *  typeof @callback = function (err, xhr, body)
   */

  request : function (options, callback) {
    var DEFAULT_TIMEOUT = 2000;
    function is_crossDomain(url) {
      var rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/


      // jQuery #8138, IE may throw an exception when accessing
      // a field from window.location if document.domain has been set
      var ajaxLocation
      try { ajaxLocation = location.href }
      catch (e) {
        // Use the href attribute of an A element since IE will modify it given document.location
        ajaxLocation = document.createElement( "a" );
        ajaxLocation.href = "";
        ajaxLocation = ajaxLocation.href;
      }

      if (ajaxLocation.match('file:')) return true;

      var ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || []
          , parts = rurl.exec(url.toLowerCase() )

      var result = !!(
        parts &&
        (  parts[1] != ajaxLocParts[1]
        || parts[2] != ajaxLocParts[2]
        || (parts[3] || (parts[1] === "http:" ? 80 : 443)) != (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443))
        )
      )

      //console.debug('is_crossDomain('+url+') -> ' + result)
      return result
    }

    try {
      var xhr = new XHR(),
          err,
          url = options.url || options.uri || ((options.proto?options.proto:'http')+'://'+options.host+':'+(options.port?options.port:80)+'/'+options.path),
          is_cors = is_crossDomain(url),
          supports_cors = ('withCredentials' in xhr)

      if(is_cors && !supports_cors) {
        err = new Error('Browser does not support cross-origin request: ' + options.uri)
        err.cors = 'unsupported'
        return callback(err, xhr)
      }
      options.headers = options.headers || {};
      options.timeout = options.timeout || DEFAULT_TIMEOUT;
      options.headers = options.headers || {};
      options.body    = options.body || null;

      if(is_cors) xhr.withCredentials = !! options.withCredentials;
      xhr.timeout = options.timeout;

      xhr.onopen = function () {
        for (var key in options.headers)
          xhr.setRequestHeader(key, options.headers[key])      
      }

      xhr.onload = function () {
       if(xhr.status === 0) {
          err = new Error('EREQUEST')
          callback(err, xhr)
       } 
       else callback(null,xhr,xhr.responseText)   
      }

      xhr.ontimeout = function () {
        // XMLHttpRequest timed out. Do something here.
        err = new Error('ETIMEOUT')
        err.duration = options.timeout
        callback(err,xhr, null)
      };

      xhr.onrror = function () {
        // XMLHttpRequest failed. Do something here.
        err = new Error('ESERVER')
        callback(err,xhr, null)
      };

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XHR.DONE) {
          if(xhr.status === 0) {
            err = new Error('ENETWORK')
            callback(err, xhr)
          } 
        }
      };

      switch (options.method) {
        case 'GET':
        case 'get':
          xhr.open('GET', url, true /* async */);
          xhr.send()
          break;
        case 'PUT':
        case 'POST':
        case 'put':
        case 'post':
          xhr.open('POST', url, true /* async */);
          xhr.send(options.body)
          break;
      }
    } catch (e) { _log(options,e);console.log(['xhr error: ',options.host,options.path,e].join(' ')); }
  },
  
  GET: function (url,params,cb,sync) {
    var result;
    // if (sync && !cb) cb=function (_result) { result=_result }; 
    if (url.indexOf('http')!=0) url = 'http://'+url;
    try {
      if (params) {
        var o=params,sep='';
        params='/?';
        for(var p in o) {
          params = params + sep + p + '='+o[p];
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
                if (allText!='') result=JSONfn.parse(allText);
                else result = new Error('GET data error (empty data)');
                if (cb) cb(result);
            } else {
              result=new Error('GET from '+url+params+' failed (status '+request.status+')');
              if (cb) cb(result)
            }
        }
      }
      request.onerror = function (error) {
        result='Error: GET from '+url+params+' failed: '+error;
        if (cb) cb(result);
      }
      request.send(null);
    } catch (error) {
      result=new Error('GET from '+url+params+' failed: '+error.toString());
      if (cb) cb(result);      
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
            {
                var allText = request.responseText;
                try {           
                  if (allText!='') result=JSONfn.parse(allText)
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
        result = new Error('POST to '+url+' failed: '+error);
        if (cb) cb(result)
      }
      request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      request.send(JSONfn.stringify(data));
    } catch (error) {
      result=new Error('POST to '+url+' failed: '+error.toString());
      if (cb) cb(result)
    }
    return result;
  },


  version: '1.5.1'
}

Utils._init = function () {
  Object.addProperty = function (obj,name,fun) {
    if (obj.prototype[name]) return;
    obj.prototype[name]=fun;
    Object.defineProperty(obj.prototype, name, {enumerable: false});
  };

  Object.updateProperty = function (obj,name,fun) {
    obj.prototype[name]=fun;
    Object.defineProperty(obj.prototype, name, {enumerable: false});
  };

  // Array static methods extensions
  if (!Array.create) Array.create = function(length,init) {
        var arr = [], i = length;
        while (i--) {
          arr[i] = init;
        }
        return arr;
    }
    
  if (!Array.matrix) Array.matrix = function (rows,cols,init) {
    if (init==undefined) init=0;
    var mat=[];
    for(var i=0;i<rows;i++) {
      var row=[];
      for(j=0;j<cols;j++) row.push(typeof init == 'function'?init(i,j):init);
      mat.push(row);
    }
    return mat;
  };
  
  // Array prototype extensions
  Object.addProperty(Array,'last',function () { return this[this.length-1] });

  // String static methods extensions
  if (!String.create) String.create = function(size,init) {
        var i, s='';
        init=init||' ';
        for(i=0;i<size;i++) s=s+init;
        return s;
  };
  if (!String.copy) String.copy = function(src) {
        var i,dst='';
        for(i=0;i<src.length;i++) dst=dst+src.charAt(i);
        return dst;
  }; 
  if (!String.get) String.get = function (str,index) {
        return str.charAt(index);
  }
  if (!String.hex) String.hex = function (n,len) {
        // format a hexadecimal number with 'len' figures.
        switch (len) {
            case 2: return (((n>>4) & 0xf).toString(16))+
                            ((n&0xf).toString(16));
            case 4: return (((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            case 6: return (((n>>20) & 0xf).toString(16)+
                            ((n>>16) & 0xf).toString(16)+
                            ((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            case 8: return (((n>>28) & 0xf).toString(16)+
                            ((n>>24) & 0xf).toString(16)+
                            ((n>>20) & 0xf).toString(16)+
                            ((n>>16) & 0xf).toString(16)+
                            ((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            default: return 'format_hex??';
        }
  }; 
  if (!String.set) String.set = function (str,index,char) {
    return str.substr(0, index) + char + str.substr(index+1)
  }
  // String prototype extensions
  Object.addProperty(String,'contains', function (el) {
    return this.includes(el)
  })
  
  Object.addProperty(String, 'hashCode', function (seed) {
    var str=this,seed=seed||0;
    var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (var i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
    h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1>>>0)).toString(16).toUpperCase();
  });
  
  if (typeof assert == 'undefined') assert = function(condmsg) {
    if (condmsg != true) {
        Io.out('** Assertion failed: '+condmsg+' **');
        Io.stacktrace();
        throw Error(condmsg);
    }
  };
}

Utils._init();




