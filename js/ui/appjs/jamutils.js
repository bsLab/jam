function loadjs(url,cb) {
  var script = document.createElement('script');
  if (typeof script != "undefined") {
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", url);
    if (cb) script.onload=cb;
    document.getElementsByTagName("head")[0].appendChild(script);
  }
}

function readfile(dir,ext,cb) {
  var input = document.createElement("input");
  input.setAttribute("type", "file");
  input.addEventListener('change',function () { 
    var fileReader = new FileReader();
    fileReader.onload = function (e) {
      var text = fileReader.result;
      if (cb) cb(fileReader.result);
    }
    input.files[0]=dir;
    fileReader.readAsText(input.files[0]);   
  });
  $(input).trigger("click"); // opening dialog
}

function basename(path) {
  return path.replace(/.*\//, '');
}
  
function classname(name) {
  return name.substring(0, name.lastIndexOf('.'))
}

function dirname(path) {
  return path.substring(0, path.lastIndexOf('/'))
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

function GET (url,params,cb,sync) {
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
                try { cb(JSON.parse(allText)) } catch (e) { cb(e+':'+allText) };
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
}
