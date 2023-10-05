/** Markdown renderer for highlighted and formatted terminal output
 *  by embedding (escaped) terminal control sequences
 *
 */

var Marked = Require('doc/marked');
var Colors = Require('doc/colors');
var List   = Require('doc/list');
var Table  = Require('doc/cli-table');
var NL = '\n';

function id (x) {return x}

// default css
var css = {
  bold:Colors.black.bold,
  italic:Colors.underline,
  h1:Colors.bold,
  h2:Colors.blue.bold,
  h3:Colors.red.bold,
  
  ol:{
    label:['1','a','i'],
  },
  ul:{
    label:['*','-','+'],
  },
  
}

// Increment numeric/alphanumeric list label
function incr(label,start) {
  switch (label) {
    case '1': return start.toString();
  }
  return label;
}

function B (text) { return css.bold(text) }
function I (text) { return css.italic(text) }
function P (text) { return text+'\n' }

function H (text, level) {
  var color,
      escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
  
  switch (level) {
    case 1: color=css.h1; break;
    case 2: color=css.h2; break;
    case 3: color=css.h3; break;
    default: color=id;
  }

  return color(text+'\n');
};

function CD(text) {
  return text+'\n';
}


function DL(body) {
  var item;
  list=new List({type:'dl',tab:2});
  while (this._data.stack.length && this._data.stack[0].dt != undefined) {
    item=this._data.stack.shift();
    //print(item)
    list.unshift({dt:css.bold(item.dt),dd:item.dd});
  }
  return list.toString()+NL;
    
}
function DT(body) {
  this._data.stack.unshift({dt:body});
}
function DD(body) {
  if (this._data.stack.length && this._data.stack[0].dt!=undefined)
     this._data.stack[0].dd=body;
}

function L(body, ordered, start) {
  var list,label;
  if (ordered) label=incr(css.ol.label[this._data.olist],start);
  else label=css.ul.label[this._data.ulist];
  list=new List({type:label});

  if (ordered) this._data.olist++; else this._data.ulist++; 
  
  while (this._data.stack.length && this._data.stack[0].item != undefined) {
    list.unshift(this._data.stack.shift().item);
  }
    
  if (ordered) this._data.olist--; else this._data.ulist--; 
  return list.toString()+NL;
}

function LI(text) {
  this._data.stack.unshift({item:text});
}

function text(text) {
  return text.replace(/&quot;/g,'"').
              replace(/&gt;/g,'>').
              replace(/&lt;/g,'<');
}

// Terminal MarkDown Renderer
function Renderer (options) {
  var marked = Marked(),
      renderer = new marked.Renderer();

  renderer.heading = H.bind(renderer);
  renderer.list = L.bind(renderer);
  renderer.listitem = LI.bind(renderer);
  renderer.paragraph = P.bind(renderer);
  renderer.strong = B.bind(renderer);
  renderer.em = I.bind(renderer);
  renderer._data={stack:[],ulist:0,olist:0};
  renderer.dt = DT.bind(renderer);
  renderer.dd = DD.bind(renderer);
  renderer.dl = DL.bind(renderer);
  renderer.code = CD.bind(renderer);
  renderer.text = text;
  
  marked.setOptions({
    renderer: renderer,
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
  if (options.lazy) return function (text) { try { return marked(text) } catch (e) { return text }};
  else return marked;
}

module.exports = {
  Colors:Colors,
  List:List,
  Marked:Marked,
  Renderer:Renderer,
  Table:Table
}
