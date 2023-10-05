var myMarked = require('./marked');

// Get reference
var myRenderer = new myMarked.Renderer();

// Override function
myRenderer.heading = function (text, level) {
  var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

  return level+': '+text+'\n';
};
// Set options
// `highlight` example uses `highlight.js`
myMarked.setOptions({
  renderer: myRenderer,
  highlight: function(code) {
    return require('highlight.js').highlightAuto(code).value;
  },
  pedantic: false,
  gfm: true,
  tables: true,
  breaks: false,
  sanitize: false,
  smartLists: true,
  smartypants: false,
  xhtml: false
});

// Compile
console.log(myMarked('# Intro\nI am using __markdown__.'));
