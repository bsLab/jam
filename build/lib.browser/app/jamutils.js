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
