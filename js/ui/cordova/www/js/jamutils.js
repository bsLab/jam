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

/** Sequential  Block Scheduling
 * 
 */
var scheduleList = [];  
// Add functions to top of schedule list
function Schedule(funcs) {
  funcs=funcs.reverse();
  for(var i in funcs) scheduleList.unshift(funcs[i])
}
// Run functions 
function Run(next) {
  if (scheduleList.length) {
    var f = scheduleList.shift();
    f(Run);
  } else if (next) next();
}
