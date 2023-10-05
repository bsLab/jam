/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     29/3/16 by sbosse.
 **    $VERSION:     1.1.4
 **
 **    $INFO:
 **
 **  JAM Main Shell Window // WEB edition
 **
 **    $ENDOFINFO
 */
var UI= $$,
    JamWeb,
    JamWorld;

function out(txt) {console.log(txt)};

function load (text,maskext) {
  var m = {},
      p,
      mask = {
        console:{
          log:out,
          warn:out
        },
        global:{},
        module:{exports:{}},
        process:{
          argv:[],
          cwd:(typeof process != 'undefined')?process.cwd:'/',
          env:(typeof process != 'undefined')?process.env:{},
          exit:function () {},
          on:(typeof process != 'undefined')?process.on:function () {}
        }
      },
      text, reg;
  if (maskext) for (p in maskext) {
    mask[p]=maskext[p];
  }

  reg = /#!/
  text=text.replace(reg,'//');
  with (mask) {
    m=eval('var x={main:function(args) {process.argv=args; '+text+'}}; x')
  }
  m.module=mask.module;
  return m;
}

function loadfile(file,maskext) {
  var xmlhttp, text;
  xmlhttp = new XMLHttpRequest();
  xmlhttp.overrideMimeType('text/plain');
  xmlhttp.open('GET', file, false);
  xmlhttp.send();
  text = xmlhttp.responseText;
  console.log('Loaded '+file+' ['+text.length+']')
  return load(text,maskext);
}


var O = {
    isArray:function (o) {
      if (o==undefined || o ==null) return false;
      else return typeof o == "array" || (typeof o == "object" && o.constructor === Array);
    },
    isObject:function (o) {
        return typeof o == "object";
    }
}
var S = {
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

function log (win) {
  return function(data) {
    var view = UI(win);
    var log = UI(win+'LogText');
    var scroll = view.getBody();
    if (typeof log.logtext == 'undefined') log.logtext='';
    data=data.replace(/\n/g,'<br>\n');
    log.logtext += data + '<br>\n';
    log.removeView(win+'LogTextView');
    log.addView({template:'<tt>'+log.logtext+'</tt>', autoheight:true, borderless:true, id:win+'LogTextView'});
    scroll.scrollTo(0,1000000)
    view.show();
  }  
}

function clear (win) {
  var view = UI(win);
  var log = UI(win+'LogText');
  var scroll = view.getBody();
  log.logtext = '';
  log.removeView(win+'LogTextView');
  log.addView({template:'<tt></tt>', autoheight:true, borderless:true, id:win+'LogTextView'});
  scroll.scrollTo(0,1000000)
  view.show();    
}

   
 
webix.ui({
    id:'LogWin',
	view:"window",
	height:200,
	width:600,
	left:50, top:50,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", label:"Clear", width:80, click:("clear('LogWin');")},
         { view:"label", label:"System Console", align:'right'}
        ]
    },
	body:{
        id : 'LogWinLog',
        view : 'scrollview',
        scroll : 'y',
        body : {
           id:'LogWinLogText',
           rows : [
              { template : ('<tt>Ready.</tt>'),height:24, borderless:true},
            ]
        }
	}
}).show();

var popup_load_file_id = (Math.random()*1000000)|0,
    popup_load_file=webix.ui({
              view:"popup",
              id:"popup_load_file"+popup_load_file_id,
              body: {
               view:"toolbar", 
               elements:[
                  { template:'<input type="file" id="load_file_input'+popup_load_file_id+'">', width:200 },
                  { view:"button", label:"Ok", width:80, click:function () {
                    var reader = JamWeb.FileReader.Reader(window,document,'load_file_input'+popup_load_file_id);
                    var popup=UI("popup_load_file"+popup_load_file_id);
                    reader.readAsText(function(data) {
                      //console.log(data);
                      UI("SourceText").setValue(data);                     
                      popup.hide();
                    });
                  }},
                  { view:"button", label:"Cancel", width:80, click:function () {
                    var popup=UI("popup_load_file"+popup_load_file_id);
                    popup.hide();
                  }}
                ]
              }
            });

webix.ui({
    id:'SourceTextWin',
	view:"window",
	height:200,
	width:600,
	left:50, top:250,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", label:"Load", width:80, click:function () {
           var node = UI("SourceTextWin").getNode();
           //console.log(node); return;
           popup_load_file.show(node , {pos:'top'});
          }
         },
         { view:"button", label:"Save", width:80, click:function () {
            var sourcetext = UI('SourceText').getValue(),
                saver = JamWeb.FileSaver.Saver(window);                
            saver.saveAsText(sourcetext, 'agent.classes.js');
         }},
         { view:"label", label:"Source Text", align:'right'}
        ]
    },
	body:{
        id : 'SourceText',
        view : 'textarea',
        css: 'myClass',
        value:'// Type your AgentJS here\na1 : function () {}'
	}
}).show();

webix.ui({
    id:'CompWin',
	view:"window",
	height:200,
	width:600,
	left:50, top:450,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", label:"Clear", width:80, click:("clear('CompWin');")},
         { view:"button", label:"Compile", width:80, click:function () {                
            var sourcetext = UI('SourceText').getValue();            
            log('CompWin')('Compiling:\n<font color="blue">'+sourcetext+'</font>');
            try {
              Jam1.compile(sourcetext);
              log('CompWin')('Ok.');
            } catch (e) {
              log('CompWin')('Failed:\n<font color="red">'+e+'</font>');
            }
         }},
         { view:"label", label:"AgentJS Compiler", align:'right'}
        ]
    },
	body:{
        id : 'CompWinLog',
        view : 'scrollview',
        scroll : 'y',
        body : {
           id:'CompWinLogText',
           rows : [
              { template : ('<tt>Ready.</tt>'),height:24, borderless:true},
            ]
        }
	}
}).show();


webix.ui({
    id:'JamWin',
	view:"window",
	height:200,
	width:600,
	left:50, top:650,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", label:"Clear", width:80, click:("clear('JamWin');")},
         { view:"button", label:"Run", width:80, click:function () {
         }},
         { view:"label", label:"JAM", align:'right'}
        ]
    },
	body:{
        id : 'JamWinLog',
        view : 'scrollview',
        scroll : 'y',
        body : {
           id:'JamWinLogText',
           rows : [
              { template : ('<tt>Ready.</tt>'),height:24, borderless:true},
            ]
        }
	}
}).show();

JamWeb = loadfile('jamweb.debug.js',
  {
    console:{log:log('LogWin'),warn:log('LogWin')}
  }).main();    
JamWorld = JamWeb.Aios.World.World([],{id:JamWeb.Name.generate('countries')});
Jam1 = JamWeb.Jam({world:JamWorld,out:log('CompWin'),nodename:'AgC'});

