// Version 1.2.1

var out = console.log
if (typeof print != 'undefined') print=console.log;

function readTextFile(file, cb) {
  try {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
      if(rawFile.readyState === 4)
      {
          if(rawFile.status === 200 || rawFile.status == 0)
          {
              var allText = rawFile.responseText;
              cb(allText)
          } else cb(null,rawFile.status||'failed');
      } else console.log(rawFile.readyState)
    }
    rawFile.onerror = function (err) {
      cb(null,err||'failed')
    }
    rawFile.send(null);
  } catch (e) {
    cb(null,e)
  }
}


function loadScript(dir,ext,cb) {
  var input = document.createElement("input");
  input.setAttribute("type", "file");
  input.addEventListener('change',function () { 
    var fileReader = new FileReader();
    fileReader.onload = function (e) {
      var text = fileReader.result;
      if (cb) cb(fileReader.result,input.files[0].name);
    }
    input.files[0]=dir;
    fileReader.readAsText(input.files[0]);   
  });
  $(input).trigger("click"); // opening dialog
}


function loadjs(filename) {
  var fileref = document.createElement('script');
  fileref.setAttribute("type", "text/javascript");
  fileref.setAttribute("src", filename);
  if (typeof fileref != "undefined")
      document.getElementsByTagName("head")[0].appendChild(fileref)
}

S = {
    sub: function (str,off,len) {
        if (len)
            return str.substr(off,off+len);
        else
            return str.substr(off);
    },
    /** Remove leading and trailing characters from string
     *
     * @param str
     * @param {number} pref number of head characters to remove
     * @param {number} post number of tail characters to remove
     * @returns {*}
     */
    trim: function (str,pref,post) {
        if (str.length==0 ||
            pref>str.length ||
            post>str.length ||
            pref < 0 || post < 0 ||
            (pref==0 && post==0)
        ) return str;
        return str.substr(pref,str.length-pref-post);
    }
}


function loadFile (cb) {
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

function saveFile(data, filename, type) {
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
function parseUrl(url) {
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

Utils.eraseCookie=eraseCookie;
Utils.getCookie=getCookie;
Utils.parseUrl=parseUrl;
Utils.setCookie=setCookie;

