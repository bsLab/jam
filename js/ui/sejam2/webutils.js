// Polyfills and helper for WEB browser implementation

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

function setImmediate(f) {
  return setTimeout(f,0);
}

function loadFile(file) {
  var reader = new XMLHttpRequest();
  console.log(file)
  reader.open("GET", file, false);
  reader.send(null);
  var text = reader.responseText;
  console.log(file,text.length)
  return text;
}

nwgui={
  Window: {
    get: function () {
      var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      var height = window.innerHeight || document.documentElement.clientHeight  || document.body.clientHeight;
      console.log(width,height)
      return {
          height : height,
          width : width,
          on: function (ev) {

          }
      }
    }
  }
}
