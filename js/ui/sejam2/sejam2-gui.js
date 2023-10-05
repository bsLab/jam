/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     28-05-17 by sbosse.
 **    $VERSION:     1.22.1
 **
 **    $INFO:
 **
 **  SEJAM2: Simulation Environment for JAM, GUI Webix+, Cannon Phy Simu, NW edition
 **  GUI Window and Subwindow Creator
 **  New: WEB Browser support
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var Name = Require('com/pwgen');
var Aios = Require('jam/aios');
var Fs = Require('fs');
var Path = Require('com/path');
var Esprima = Require('parser/esprima');
var util = Require('util');
var simuPhy = Require('simu/simuPHY');
var Base64 = Require('os/base64');
var Marked = Require('doc/marked');
var marked = Marked();
var winShell = Require('ui/sejam2/winshell');


var fontsize=12;

var gui = function () {
  
};

function getOptions(text) {
  //a=v a=v ..
  var tokens=text.split(' ');
  var options={}
  tokens.forEach(function (av) {
    var pl = av.split('=')
    if (pl.length==2) options[pl[0]]=pl[1];
  })
  return options
}

/** Build and initialize the GUI using the Webix toolkit.
 *
 */
gui.prototype.init = function () {
  var self = this;
  
  this.changeCSS('.webix_el_textarea  textarea','font-size','12px');
  this.changeCSS('tt','font-size','12px');
  this.changeCSS('.CodeMirror pre','font-size',"12px");
  this.changeCSS('.CodeMirror pre','font-family','"DejaVu Sans Mono",Tahoma');
  
  this._cursorToggle=false;
  // Printer
  
  this.printer = {
    simulation: function (svg) {
      function snap() {
        var image;
        image = self.worldWin.container.toSvg((self.window.x1-self.window.x0+20)*self.worldWin.zoom,
                                              (self.window.y1-self.window.y0)*self.worldWin.zoom);
        self.worldWin.container.toSvg();
        // image=image.replace(/\.svg/g,'.png');
        return image; 
      };
      function toPng(svg,cb) {
        // TODO: resolve embedded images and map on embeddeed canvas objects
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext("2d"); 
        var img = new self.utils.Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            var png = canvas.toDataURL('image/png');
            var data = Base64.decodeBuf(png.replace('data:image/png;base64,', ''));
            cb(data);
        };
        // Init the image with our SVG
        img.src = "data:image/svg+xml," + svg;
      }
      try { 
        var num=self.options.numbering.simulation(),          
            image = snap ();
        if (!svg) toPng(image, function (data) {
          var len = Io.write_file_bin(self.workdir+'/'+'simulation'+num+'.png',data);
          if (self.options.verbose) self.log('Exported world to simulation'+num+'.png ['+len+']'); 
        });
        if (svg) {
          var len = Io.write_file(self.workdir+'/'+'simulation'+num+'.svg',image.replace(/\.svg/g,'.png'));
          if (self.options.verbose) self.log('Exported world to simulation'+num+'.svg ['+len+']'); 
        }
      } catch (e) { self.log(util.inspect(e)) };
    
    },
    simulationPhy: function () {
      function snap() {
        var image = Base64.decodeBuf(self.physicalWin.gui.exportImage().replace('data:image/png;base64,', ''));   
        return image; 
      };
      try {             
        var num=self.options.numbering.simulationPhy(),
            len = Io.write_file_bin(self.workdir+'/'+'simulationPhy'+num+'.png',snap());
        if (self.options.verbose) self.log('Exported physical world to simulationPhy'+num+'.png ['+len+']'); 
      } catch (e) { self.log(util.inspect(e)) };    
    }
  }
  
  /**************** MARKED ***********************/
  
  var renderer = new marked.Renderer();
  renderer.image = function (href, title, label) {
    var tokens = label.split(' ');
    label=tokens[0];
    tokens.shift()
    if (global.config.wine)
      href = 'file://Z:'+self.lastdir+'/'+href;
    else if (global.config.os=='win32')
      href = 'file://'+self.lastdir+'/'+href;
    else
      href = 'file://'+self.lastdir+'/'+href;
    var options = getOptions(tokens.join(' '))
    var width=options["html-width"]||"100%";
    var height=options["html-height"];
    if (width && height) 
      return '<img src="'+href+'" height='+height+' width='+width+
             ' style="height:'+height+';width:'+width+
             ';display:block;margin-left:auto;margin-right:auto;" alt="'+
             label+'"><br>'
    else if (!width && height)
      return '<img src="'+href+'"'+
             ' style="height:'+height+
             ';display:block;margin-left:auto;margin-right:auto;" alt="'+
             label+'"><br>'    
    else if (width && !height)
      return '<img src="'+href+'"'+
             ' style="width:'+width+
             ';display:block;margin-left:auto;margin-right:auto;" alt="'+
             label+'"><br>'    
  }
  renderer.text = function (text) {
    function script (text) {
    if (text.indexOf('~')==0) renderer._state.sub = !renderer._state.sub;
      return text.replace(/\^([^\^]+)\^/g,'<sup>$1</sup>')
                 .replace(/\~/g,renderer._state.sub?'<sub>':'</sub>'); // ~ is parsed by marked !?
    }    
    text = script(text);
    return text;
  }  
  renderer._state = { 
    sub:false 
  };
  
  marked.setOptions({
    renderer: renderer,
    pedantic: false,
    gfm: true,
    tables: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false
  });  
  
  /**************** WINDOWS *********************/
  
  // TOP TOOLBAR
  this.toolbar = this.webix.ui({
        view:"toolbar",
        id:"myToolbar",
    	left:00, top:0, width:'100%',
        cols:[
         { view:"button", type:"icon", icon:"folder-open", tooltip:'Open Model', width:30, click:function () {
            self.loadSimulation();
         }},
         { view:"button", type:"icon", icon:"repeat", tooltip:'Reload', width:30, click:function () {
            if (!self.filesimu) return;
            self.clear('msgWin');
            self.messages=[];
            self.logTable = [];
            self.destroyWorld();
            self.resetGui();
            if (self.simuPhy) self.simuPhy.destroy();
            self.simuPhy = none;
            self.UI('physicalWinButCreate').enable();
            self.UI('physicalWinButDestroy').disable();
            self.physicalWin.gui=none;
            self.UI('physicalWinButRun').disable();
            self.UI('physicalWinButStep').disable();
            self.UI('physicalWinButStop').disable();
            if (global.TARGET == "browser") {
              return self.loadSimulation(self.filesimu);
            }
            try {
              text = Io.read_file(self.workdir+'/'+self.filesimu);
              self.source = text;
              self.imports = {};
              if (!text) return self.log('Reloading simulation model from file '+self.filesimu+' failed.');
              self.model = self.parseModel(text);
              if (self.model && self.model.name)
                self.log('Loaded simulation model "'+self.model.name+'" ('+self.source.length+') from file '+self.filesimu);
              else  
                return self.log('Parsing simulation model from file '+self.filesimu+' failed.');
              self.filedialogWin.hide();
              self.UI('sourceText').setValue(self.source);
              self.UI('buttonTopSave').disable();
              self.UI('buttonEditorSave').disable();
              self.editorWin._changed=false;
              self.editorWin._active=self.filesimu;
              self.inspect.root = 'model';
              self.inspect.data = self.model;
              self.UI('sourceTextWinMenu').remove('root');
              files=[self.filesimu];
              for(p in self.imports) {
                files.push(p);
              }
              self.UI('sourceTextWinMenu').add({ 
                id:'root', 
                value:self.filesimu, 
                submenu:files});
            } catch (e) {                    
              self.log('Loading of simulation model from file '+self.filesimu+' failed: '+e.toString());
              console.log(e)
            }
            
         }},
         { view:"button", id:'buttonTopSave', type:"icon", icon:"save", tooltip:'Save Model', width:30, click:function () {
            /*
            var but = self.UI('filedialogWinAction');
            but.setValue('Save Model');
            but.refresh();
            self.filedialogWin.show();
            */
            self.saveAll();
            self.UI('buttonTopSave').disable();
            self.UI('buttonEditorSave').disable();
         }},
         { view:"button", type:"icon", icon:"user-plus", tooltip:'Chat Dialog', width:30, click:function () {
            if (self.chatWin.isVisible())
              self.chatWin.hide();
            else {
              self.chatWin.show();
              self.chatInit();
            }
         }},
         { view:"button", type:"icon", icon:"edit", tooltip:'Edit', width:30, click:function () {
            if (self.editorWin.isVisible())
              self.editorWin.hide();
            else {
              self.editorWin.show();
              if (!self.editorWin._active && self.filename) self.editorWin._active=self.filename;
              if (!self.editorWin._changed) self.editorWin._switched=true;
              if (self.editorWin._active==self.filename)
                self.UI('sourceText').setValue(self.source);
              else
                self.UI('sourceText').setValue(self.imports[self.editorWin._active]);
                
              if (!self.editorWin._changed) {
                self.UI('buttonTopSave').disable();
                self.UI('buttonEditorSave').disable();
              }
                 
              self.UI('sourceText').editor.setOption("onChange", function(id){
                if (!self.editorWin._switched) {
                  self.UI('buttonTopSave').enable();
                  self.UI('buttonEditorSave').enable();
                  self.editorWin._changed=true;
                }
                self.editorWin._switched=false;
              });
            }
         }},
         { view:"button", type:"icon", icon:"terminal", tooltip:'Shell', width:30, click:function () {
            self.shellWin.show();
            window.shell[0].init("ShellWinInput","ShellWinOutput",UI('ShellWinLog'));
         }},
         { view:"button", type:"icon", icon:"sitemap", tooltip:'Inspector', width:30, click:function () {
            if (self.inspectorWin.isVisible()) 
              self.inspectorWin.hide();
            else {
              self.deleteTree(self.inspect.root);
              self.makeTree(self.inspect.data,'root');
              self.inspectorWin.show();
            }
         }},
         { view:"button", type:"icon", icon:"info-circle", tooltip:'System Console', width:30, click:function () {
            if (self.logWin.isVisible()) 
              self.logWin.hide();
            else
              self.logWin.show();
         }},
         { view:"button", type:"icon", icon:"table", tooltip:'Classes', width:30, click:function () {
         }},
         { view:"button", type:"icon", icon:"cloud", tooltip:'World', width:30, click:function () {
            if (self.worldWin.isVisible()) 
              self.worldWin.hide();
            else {
              self.worldWin.show();
              self.clearWorld();
              self.drawWorld();
            }
         }},
         { view:"button", type:"icon", icon:"play", tooltip:'Simulation', width:30, click:function () {
            if (self.simulationWin.isVisible()) 
             self.simulationWin.hide();
            else
             self.simulationWin.show();
         }},
         { view:"button", type:"icon", icon:"pie-chart", tooltip:'Analysis', width:30, click:function () {
            if (self.analysisWin.isVisible())
              self.analysisWin.hide();
            else {
              self.analysisWin.show();
            }         
         }},
         { view:"button", type:"icon", icon:"navicon", tooltip:'Configuration', width:30, click:function () {
            if (self.configWin.isVisible())
              self.configWin.hide();
            else {
              self.configWin.show();
              self.updateConfig();
            }
         }},
         { view:"button", type:"icon", icon:"th-large", tooltip:'Auto Layout', width:30, click:function () {
            var _locked=self.toolbar.locked;            
            self.toolbar.locked=false;
            self.autoLayout();
            self.toolbar.locked=_locked;
         }},
         { view:"button", id:'topWinLock', type:"icon", icon:"unlock", tooltip:'Lock/Unlock Layout', width:30, click:function () {
            if (self.toolbar.locked) {
              self.unlockLayout();
            } else {
              self.lockLayout();
            }
         }},
         { view:"button", type:"icon", icon:"cubes", tooltip:'Physical Engine', width:30, click:function () {
            if (self.physicalWin.isVisible())
              self.physicalWin.hide();
            else 
              self.physicalWin.show();
         }},
         { view:"button", type:"icon", icon:"thermometer", tooltip:'Sensors World', width:30, click:function () {
            if (self.sensorsWin.isVisible())
              self.sensorsWin.hide();
            else 
              self.sensorsWin.show();
         }},
         { view:"button", type:"icon", icon:"hand-o-right", tooltip:'Visual Pointer', width:30, click:function () {
            var el = document.getElementsByTagName("body")[0];
            self._cursorToggle=!self._cursorToggle;
            if (self._cursorToggle)
             el.style.cursor = "url(redpointer.png), auto";
            else
             el.style.cursor = "auto";
            ['worldGraphContainer','CANNON','chat-bot','infoBoardWin-marked'].forEach(function (id) {
              var el = document.getElementById(id);
              if (!el) return;
              if (self._cursorToggle)
                el.style.cursor = "url(redpointer.png), auto";
              else
                el.style.cursor = "auto";
            })
         }},
         { view:"button", type:"icon", icon:"sort-amount-asc", tooltip:'Bigger Fonts', width:30, click:function () {
           fontsize++;
           self.setFontSize(fontsize);
         }},
         { view:"button", type:"icon", icon:"sort-amount-desc", tooltip:'Smaller Fonts', width:30, click:function () {
           fontsize--;
           self.setFontSize(fontsize);
         }},
         { view:"label", label:"Version "+sejamVersion, align:'right'},
         { view:"label", id:'myTopLabel', label:'JAM World '+self.worldname+' ', align:'right'},
        ]
  });
  
  
  // Shell Win
  
  this.shellWin = this.webix.ui({
      id:'ShellWin',
	  view:"window",
	  height:350,
	  width:600,
	  left:250, top:250,
	  move:true,
	  resize: true,
      toFront:true,
      head: {
          view:"toolbar",
          cols:[
           { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
             window.shell[0].commands.clear()
           }},
           { view:"button", type:"icon", icon:"dot-circle-o", tooltip:'Scroll Auto', id:'ShellWinLogFilmBut', width:30, click:function () {
             UI('ShellWinLog').scrollAuto=!UI('ShellWinLog').scrollAuto;
             if (UI('ShellWinLog').scrollAuto) UI('ShellWinLogFilmBut').define('icon','arrow-circle-down')
             else UI('ShellWinLogFilmBut').define('icon','dot-circle-o');
             UI('ShellWinLogFilmBut').refresh();
           }},
           { view:"label", label:"JAM Shell", id:'ShellWinLabel', align:'right'},
           { view:"button", type:"icon", icon:"close", tooltip:'Close Shell', width:30, click:function () {
            self.shellWin.hide();
           }},
          ]
      },
	  body:{
          id : 'ShellWinLog',
          view : 'scrollview',
          scroll : 'y',
          body : {
             id:'ShellWinLogText',
             rows : [
                {template:('<div id="ShellWinOutput" '+
                           'spellcheck="false" style="">'), height:"auto", borderless:true},
                {template:('<div><textarea id="ShellWinInput" '+
                           'class="inputShell" spellcheck="false" wrap="on" onkeydown="shell[0'+
                           '].inputKeydown(event)" rows="1" style="width:98%"></textarea></div>'), height:"auto", borderless:true},
              ]
            }
	  }
  });
  window.shell=[
    winShell({Io:Io, gui:self})
  ];
  
  // STATISTICS WIN
  this.statWin = this.webix.ui({
    view:"popup",
    id:'statWin',
    resize: true,
    width:500,             
    body: {   
      rows: [
        {cols: [
          { view:"button", type:"icon", icon:"repeat", tooltip:'Refresh', width:30, click:function () {
          }},
          { view:"label", label:"Statistics", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.statWin.hide();
          }}          
        ]},
        {view:'textarea', autoheight:true, readonly:true, borderless:true, id:'statWinLogTextView',value: ''}
      ]
    }      
  });
  function refreshMsgWin() {
    var textview = self.UI('msgWinLogTextView');
    var text='',off=self.messages.length>1000?self.messages.length-1000:0;
    Comp.array.iter(self.messages,function (m,i) {if (i>=off) text=text+m+'\n'});
    textview.setValue(text);
    textview.refresh();
    var element = textview.getNode();
    var data = textview.getValue();
    var textareaList = element.getElementsByTagName("textarea");
    if (textareaList.length==1) {
      var textarea=textareaList[0];
      textarea.scrollTop = textarea.scrollHeight;
    }  
  }
  // MESSAGE WIN
  this.msgWin = this.webix.ui({
    view:"popup",
    id:'msgWin',
    resize: true,
    width:500,             
    body:    {
      rows: [
        {cols: [
          { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
            self.clear('msgWin');
            var textview = self.UI('msgWinLogTextView');
            self.messages=[];
            UI('msgWin').messagesLast=0;
            textview.setValue('');
          }},
          { view:"button", type:"icon", icon:"repeat", tooltip:'Refresh', width:30, click:function () {
            refreshMsgWin();
          }},
          { view:"button", type:"icon", icon:"dot-circle-o", tooltip:'Scroll Auto', id:'msgWinFilmBut', width:30, click:function () {
            UI('msgWin').scrollAuto=!UI('msgWin').scrollAuto;
            if (UI('msgWin').scrollAuto) {
              UI('msgWinFilmBut').define('icon','arrow-circle-down');
              UI('msgWin').messagesLast=self.messages.length;
              UI('msgWin').refreshAuto=setInterval(function () {
                if (UI('msgWin').messagesLast<self.messages.length) {
                  refreshMsgWin();          
                }
              },100);
            } else {
              UI('msgWinFilmBut').define('icon','dot-circle-o');
              clearInterval(UI('msgWin').refreshAuto)
            }
            UI('msgWinFilmBut').refresh();
          }},
          { view:"label", label:"Agent Messages", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.msgWin.hide();
          }}          
        ]},
        {view:'textarea', autoheight:true, readonly:true, borderless:true, id:'msgWinLogTextView',value: '<Empty>'}
      ]
    }
  });

  // LOG WIN
  this.logWin = this.webix.ui({
    id:'logWin',
	view:"window",
	height:200,
	width:500,
	left:50, top:50,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarlogWin",
        cols:[
         { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
          self.clear('logWin');
         }},
         { view:"button", type:'icon', icon:'info' , tooltip:'Statistics', id: 'SysWinInfoBut', width:30, click:function () {
           var parent = self.UI("logWin").getNode();
           if (self.statWin.isVisible()) {
              self.statWin.hide();
              return;
           }

           //console.log(node); return;
           self.clear('statWin');
           self.showStats();
           self.statWin.show(parent , {pos:'bottom'});
        }},
        { view:"button", type:'icon', icon:'inbox' , tooltip:'Agent Messages', id: 'SysWinMsgBut', width:30, click:function () {
          var parent = self.UI("logWin").getNode();
          if (self.msgWin.isVisible()) {
            self.msgWin.hide();
            return;
          }
          self.clear('msgWin');
          var textview = self.UI('msgWinLogTextView');
          var text='',off=self.messages.length>1000?self.messages.length-1000:0;
          Comp.array.iter(self.messages,function (m,i) {if (i>=off) text=text+m+'\n'});
          textview.setValue(text);
          self.msgWin.define('width',self.logWin.getNode().offsetWidth-2);
          self.msgWin.resize();
          self.msgWin.show(parent , {pos:'bottom'});
                     
        }},
        { view:"button", type:'icon', icon:'plus-circle' , tooltip:'Increase Font Size', width:30, click:function () {
          self.changeCSS('.webix_el_textarea  textarea','font-size','14px');
          self.changeCSS('tt','font-size','14px');
          self.changeCSS('.CodeMirror pre','font-size',"14px");
        }},
        { view:"button", type:'icon', icon:'minus-circle' , tooltip:'Decrease Font Size', width:30, click:function () {
          self.changeCSS('.webix_el_textarea  textarea','font-size','12px');
          self.changeCSS('tt','font-size','12px');
          self.changeCSS('.CodeMirror pre','font-size',"12px");
        }},
        { view:"button", type:"icon", icon:"dot-circle-o", tooltip:'Scroll Auto', id:'logWinFilmBut', width:30, click:function () {
          UI('logWin').scrollAuto=!UI('logWin').scrollAuto;
          if (UI('logWin').scrollAuto) UI('logWinFilmBut').define('icon','arrow-circle-down')
          else UI('logWinFilmBut').define('icon','dot-circle-o');
          UI('logWinFilmBut').refresh();
        }},
        { view:"label", label:"System Console", align:'right'},
        { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.logWin.hide();
        }}
      ]
    },
/*    
	body:{
        id : 'logWinLog',
        view : 'scrollview',
        scroll : 'y',
        body : {view:'textarea',autoheight:true, borderless:true, id:'logWinLogTextView',value: ''}
	}
*/
    body:    {view:'textarea', autoheight:true, readonly:true, borderless:true, id:'logWinLogTextView', value: ''} 
  });
  UI('logWin').scrollAuto=false;
  this.log = this.logToWin('logWin');
  this.stat =  this.logToWin('statWin');
  this.msg =  function (line) { self.messages.push(line) };
  this.log('SEJAM2: Simulation Environment for JAM. Version '+this.version+' (C) Dr. Stefan Bosse, 2015-2019');
  this.log('Ready. Have fun!');
  this.log('My current working directory is '+this.workdir);
  this.log(util.inspect(global.config));
  this.log('My platform: '+process.platform+(global.config.wine?' WINE':'')+' node:'+process.version+', node-wekbkit:'+process.versions['node-webkit']+
           ', nw:'+process.versions['nw']+', chromium: '+process.versions['chromium']);
  this.log('My modules: MAS World, Physical World (Multi-body Physics Engine), Simulation Control, Inspector'+
           (this.Database?', SQL Database':''));
  this.log('No simulation model loaded. Load a model using the open button (upper left corner)!');

  this.nw = process.versions['nw'];
  
  /////////////////
  // FILE DIALOG WIN
  /////////////////
  
  if (global.TARGET != "browser") this.filedialogWin = this.webix.ui({
    id:'filedialogWin',
	view:"window",
	height:350,
	width:500,
	left:100, top:100,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarfiledialogWin",
        cols:[
         { view:"label", label:"File Explorer", align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.filedialogWin.hide();
         }}
        ]
    },
    body:{
      id: 'filedialogWinForm',
      view:"form", 
      elements:[
          {
            view:"list",
            // height:150,
            id: 'filedialogWinList',
            template:"#icon# #name#",
            select:false,
            data:[
              // { id:0, flag:'d', icon:'<span class="webix_icon fa-level-up"></span>', name:".."},
            ]
          },
          { view:"text", id:'filedialogWinFormDirectory', label:"Directory", value:self.workdir },
          { view:"text", id:'filedialogWinFormFile', label:"Filename" },
          {cols:[
              { view:"button", id:'filedialogWinAction', value:'?', type:'form', click : function () {
                var text,files=[],p,filename,ext;
                switch (self.UI('filedialogWinAction').getValue()) {
                  case 'Load Model':
                    try {
                      self.filename=self.filesimu=self._filename||self.filename;
                      text = Io.read_file(self.workdir+'/'+self.filename);
                      self.source = text;
                      self.imports = {};
                      self.model = self.parseModel(text);
                      if (self.model && self.model.name)
                        self.log('Loaded and parsed simulation model "'+self.model.name+'" ('+self.source.length+') from file '+self.filename);
                      else  
                        self.log('Parsing simulation model from file '+self.filename+' failed.');
                      self.filedialogWin.hide();
                      self.UI('sourceText').setValue(self.source);
                      self.UI('buttonTopSave').disable();
                      self.UI('buttonEditorSave').disable();
                      self.editorWin._changed=false;
                      self.editorWin._active=self.filename;
                      self.inspect.root = 'model';
                      self.inspect.data = self.model;
                      self.UI('sourceTextWinMenu').remove('root');
                      files=[self.filename];
                      for(p in self.imports) {
                        files.push(p);
                      }
                      self.UI('sourceTextWinMenu').add({ 
                        id:'root', 
                        value:self.filename, 
                        submenu:files});
                    } catch (e) {                    
                      self.log('Loading of simulation model from file '+self.filename+' failed: '+e.toString());
                      console.log(e)
                    }
                    break;
                    
                  case 'Load Module':                 
                    try {
                      filename = self._filename;
                      text = Io.read_file(self.workdir+'/'+filename);
                      self.filedialogWin.hide();
                      self.imports[filename]=text;
                      files=[self.filename];
                      for(p in self.imports) {
                        files.push(p);
                      }
                      self.UI('sourceTextWinMenu').add({ 
                        id:'root', 
                        value:self.filename, 
                        submenu:files});
                      self.log('Loaded simulation module "'+filename+'" ('+text.length+') from file ');
                    } catch (e) {                    
                      self.log('Loading of simulation module from file '+filename+' failed: '+e.toString());
                    }
                    break;
                  
                  case 'Save Model':
                    try {
                      self.filename=self._filename=self.UI('filedialogWinFormFile').getValue(); 
                      self.log('Saving simulation model "'+(self.model?self.model.name:'')+'" ('+self.source.length+') to file '+self.filename);                      
                      self.filedialogWin.hide();
                      Io.write_file(self.workdir+'/'+self.filename,self.source);                     
                      text=Io.read_file(self.workdir+'/'+self.filename);
                      self.imports={};
                      self.model = self.parseModel(text);
                      if (self.model && self.model.name) {
                        self.log('Updated simulation model "'+self.model.name+'" ('+self.source.length+') from file '+self.filename);
                        self.inspect.root='model';
                        self.inspect.data=self.model;
                      } else
                        self.log('Updating simulation model from file '+self.filename+' failed.');
                    } catch (e) {                    
                      self.log('Saving of simulation model to file '+self.filename+' failed: '+e.toString());
                    }                  
                    break;
                    
                  case 'Save Image':
                    try {
                      self.filename=self._filename=self.UI('filedialogWinFormFile').getValue(); 
                      ext = self.filename.match(/\.([a-zA-Z]+)$/)
                      if (ext) ext=ext[1];
                      self.filedialogWin.hide();
                      if (ext=='png' && self.image.png) {
                        self.log('Saving image '+self.filename);                      
                        Io.write_file_bin(self.workdir+'/'+self.filename,self.image.png);
                      } else  if (ext=='svg' && self.image.svg) {
                        self.log('Saving image '+self.filename);                      
                        Io.write_file(self.workdir+'/'+self.filename,self.image.svg);
                      }               
                    } catch (e) {                    
                      self.log('Saving of file '+self.filename+' failed: '+e.toString());
                    }                  
                    break;
                  case 'Save Object':
                    try {
                      var filename=self.UI('filedialogWinFormFile').getValue(); 
                      ext = filename.match(/\.([a-zA-Z]+)$/)
                      if (ext) ext=ext[1];
                      self.filedialogWin.hide();
                      self.log('Saving JSON data to file '+filename);                      
                      Io.write_file_bin(self.workdir+'/'+filename,self.objectData);
                    } catch (e) {                    
                      self.log('Saving of file '+self.filename+' failed: '+e.toString());
                    }
                    self.UI('filedialogWinFormFile').setValue(self.filename); 
                    break;
                }
              }},
              { view:"button", value:'Cancel', click: function () {
                self.filedialogWin.hide();
              }}
          ]}
      ]
    }
  });
  if (global.TARGET != "browser") this.UI('filedialogWinList').attachEvent("onItemClick", function(id, e, node){
    var item = this.getItem(id);
    if (item.flag=='d') {
      self.workdir = Path.resolve(item.dir+'/'+item.name);   
      self.UI('filedialogWinFormDirectory').setValue(self.workdir);
      self._filename = '';
      self.UI('filedialogWinFormFile').setValue(self._filename); 
      self.openDir(self.workdir);
    } else {
      self._filename = item.name;
      self.UI('filedialogWinList').select(id);
      self.UI('filedialogWinFormFile').setValue(self._filename); 
    }
  });
  
  /////////////////
  // EDITOR WIN
  /////////////////
  
  this.editorWin = this.webix.ui({
    id:'sourceTextWin',
	view:"window",
	height:300,
	width:500,
	left:100, top:100,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarsourceTextWin",
        cols:[
          { view:"button", type:"icon", icon:"folder-open", 
            tooltip:'Open Module File', width:30, click:function () {
              if (global.TARGET != "browser") {
                var but = self.UI('filedialogWinAction');
                but.setValue('Load Module');
                but.refresh();
                self.openDir(self.workdir);
                self.filedialogWin.show();
              }
            }
          },
          { view:"button", id:'buttonEditorSave', type:"icon", icon:"save", disable:true, 
            tooltip:'Save Model', width:30, click:function () {
            /*
            var but = self.UI('filedialogWinAction');
            self.source = self.UI('sourceText').getValue();          
            but.setValue('Save');
            but.refresh();
            self.openDir(self.workdir);
            self.filedialogWin.show();
            */
            if (self.editorWin._active && self.editorWin._active!=self.filename) 
              self.imports[self.editorWin._active]=self.UI('sourceText').getValue();
            else
              self.source=self.UI('sourceText').getValue();
            self.saveAll();
            self.UI('buttonTopSave').disable();
            self.UI('buttonEditorSave').disable();
            self.editorWin._changed=false;
          }},
          { view:"button", type:"icon", icon:"file", 
            tooltip:'New Module File', width:30, click:function () {
            }
          },
          {
            view:"menu",
            id:"sourceTextWinMenu",
            subMenuPos:"right",
            layout:'x',
            autowidth:true,
            data:[ //menu data
              { id:'root', value:"Modules", submenu:["Main"]},
            ],
            click:function(id) {
              var p,files;
              self.log('Selected '+id);
              if (id!='root') {
                self.UI('sourceTextWinMenu').remove('root');
                files=[self.filename];
                for(p in self.imports) files.push(p);
                self.UI('sourceTextWinMenu').add({ 
                        id:'root', 
                        value:id, 
                        submenu:files});                
                        
                if (!self.editorWin._changed) self.editorWin._switched=true;
                if (self.editorWin._active && self.editorWin._active!=self.filename) 
                  self.imports[self.editorWin._active]=self.UI('sourceText').getValue();
                else
                  self.source=self.UI('sourceText').getValue();
                
                if (id==self.filename) 
                  self.UI('sourceText').setValue(self.source);
                else 
                  self.UI('sourceText').setValue(self.imports[id]);
                self.editorWin._active=id;
                if (!self.editorWin._changed) {
                  self.UI('buttonTopSave').disable();
                  self.UI('buttonEditorSave').disable();
                }
              }
            },  
            type:{
              subsign:true
            }           
          },         
          { view:"label", label:"Model Editor", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            if (self.editorWin._active==self.filename)
              self.source = self.UI('sourceText').getValue();   
            else 
              self.imports[self.editorWin._active]=self.UI('sourceText').getValue();
                
            self.editorWin.hide();
         }}
        ]
    },
	body:{
        id : 'sourceText',
        view: "codemirror-editor"        
    }
  });
  
  ////////////////////
  // SIMULATION CONTROL WIN
  ////////////////////
  this.simulationWin = this.webix.ui({
    id:'simulationWin',
	view:"window",
	height:120,
	width:400,
	left:110, top:110,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarsimulationWin",
        cols:[
         { view:"button", id:'simulationWinButCreate', type:"icon", icon:"star",  tooltip:'Create Simulation World', width:30, click: function () {
            self.createSimulation()
         }},
         { view:"button", id:'simulationWinButErase', type:"icon", icon:"trash", tooltip:'Destroy Simulation World', width:30, click:function () {
            if (self.simu) self.simu.stop();
            self.clear('msgWin');
            self.messages=[];
            self.logTable = [];
            self.destroyWorld();
            self.resetGui();
         }},
         { view:"button", id:'simulationWinButStep', type:"icon", icon:"step-forward",  tooltip:'Step Mode', width:30, click: function () {
            if (!self.simu) return;
            var steps = Number(self.UI('simulationWinFormSteps').getValue());
            var delay = Number(self.UI('simulationWinFormDelay').getValue());
            if (steps > 0 && UI('msgWin').scrollAuto) {
              if (UI('msgWin').refreshAuto) clearInterval(UI('msgWin').refreshAuto);
              UI('msgWin').refreshAuto=setInterval(function () {
                if (UI('msgWin').messagesLast<self.messages.length) {
                  refreshMsgWin();          
                }
              },100);
            }
            if (steps > 0 && self.simu) {
              self.simu.setDelay(delay);
              self.simu.start(steps);
            }
         
         }},
         { view:"button", id:'simulationWinButPlay', type:"icon", icon:"play",  tooltip:'Start Simulation', width:30, click: function () {
            if (UI('msgWin').scrollAuto) {
              if (UI('msgWin').refreshAuto) clearInterval(UI('msgWin').refreshAuto);
              UI('msgWin').refreshAuto=setInterval(function () {
                if (UI('msgWin').messagesLast<self.messages.length) {
                  refreshMsgWin();          
                }
              },100);
            }
            self.startSimulation(100000);
         }},
         { view:"button", id:'simulationWinButStop', type:"icon", icon:"stop",  tooltip:'Stop Simulation', width:30, click: function () {
            if (!self.simu) return;
            self.simu.stop();
            if (UI('msgWin').scrollAuto) {
              if (UI('msgWin').refreshAuto) clearInterval(UI('msgWin').refreshAuto);
            }
            self.UI('simulationWinButStep').enable();
            self.UI('simulationWinButPlay').enable();
            self.UI('simulationWinButStop').disable();                
         }},
         { view:"button", type:"icon", icon:"navicon", tooltip:'Configuration', width:30, click:function () {
            var parent = self.UI("simulationWin").getNode();
            if (self.configSimulationWin && self.configSimulationWin.isVisible()) {
              self.configSimulationWin.close();              
              self.configSimulationWin=none;
              return;
            }
            self.configSimulationWinSetup();  
            self.configSimulationWin.show(parent , {pos:'top'});
         }},
         { view:"button", type:"icon", icon:"camera", tooltip:'Enable Movie Record', width:30, click:function () {
            if (!self.options.movie) {
              self.log('Enabling movie record mode. After each simulation step, the simulation world is saved to image files.');
              var i=0,j=0;
              self.options.numbering.simulation=
                function () {var _i=i; i++; return _i<10?'000'+_i:(_i<100?'00'+_i:(_i<1000?'0'+_i:''+_i))};
              self.options.numbering.simulationPhy=
                function () {var _i=j; j++; return _i<10?'000'+_i:(_i<100?'00'+_i:(_i<1000?'0'+_i:''+_i))};
              self.options.movie=true;
            } else {
              self.log('Disabling movie record mode.');
              self.options.movie=false;
            }
         }},
         { view:"button", type:'icon', icon:'info' , tooltip:'Report', width:30, click:function () {
         }},
         { view:"button", id:'simulationWinButLazy', type:'icon', icon:'area-chart' , tooltip:'Lazy Updates', width:30, click:function () {
          if (!self.options.display.lazy) {
            UI('simulationWinButLazy').define('icon','bar-chart')
          } else {
            UI('simulationWinButLazy').define('icon','area-chart')
          }
          self.UI('simulationWinButLazy').refresh();
          self.options.display.lazy=!self.options.display.lazy; 
          // update config window
          UI('configObjectUpdates').setValue(self.options.display.lazy);
         }},
         { view:"label", label:"Simulation Control", align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.simulationWin.hide();
         }}
        ]
    },
	body:{
      id: 'simulationWinForm',
      view:"form", 
      paddingX:2,
      paddingY:4,
      elements:[
        {cols:[
          { view:"text", id:'simulationWinFormSteps', label:"Steps", value:'1', maxWidth:150},
          { view:"text", id:'simulationWinFormDelay', label:"Delay [ms]", value:'0', maxWidth:150},  
          { view:"label", id:'simulationWinInfoTime', label:"Time: 0" },      
          { view:"label", id:'simulationWinInfoSteps', label:"Steps: 0" },      
          { view:"label", id:'simulationWinInfoAgents', label:"Agents: 0" },      
          { view:"label", id:'simulationWinInfoNodes', label:"Nodes: 0" },      
        ]}
      ]
    }
  });

  this.UI('simulationWinButStep').disable();
  this.UI('simulationWinButPlay').disable();
  this.UI('simulationWinButStop').disable();
  this.UI('simulationWinButErase').disable();

  ////////////////////////////////
  // SIMULATION CONFIGURATION WIN
  ////////////////////////////////
  this.configSimulationWin = none;
  
  this.configSimulationWinSetup = function () {
    var rows=[],p,params;
      
    if (self.model) {
      if (self.model.parameter) {
        rows.push({ view:"label", label:"<b>Simulation Parameter</b>", height:'18px', align:'left'});
        for (p in self.model.parameter) {
          var s,o=self.model.parameter[p];
          if (typeof o != 'object' && typeof o != 'function') s=o.toString();
          else s=Aios.Json.stringify(o);
          rows.push(function (p) {
            return { 
              view:"text", 
              id:"configSimulationParameter"+p, 
              label:p, 
              value:s
            }}(p));
        }
      }
    }
    self.configSimulationWin = self.webix.ui({
       id:'configSimulationWin',
	   view:"window",
	   width:300,
	   height:500,
	   // left:90, top:90,
	   move:true,
	   resize: true,
       toFront:true,
       head: {
           view:"toolbar",
           id:"myToolbarconfigSimulationWin",
           cols:[
            { view:"label", label:"Simulation Parameter", align:'right'},
            { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              // TODO update simulation parameter
              if (self.model && self.model.parameter) {
                for (p in self.model.parameter) {
                  try {
                    var v=self.UI('configSimulationParameter'+p).getValue();
                    if (typeof self.model.parameter[p] == 'string') self.model.parameter[p]=v;
                    else if (typeof self.model.parameter[p] == 'number') self.model.parameter[p]=Number(v);
                    else if (typeof self.model.parameter[p] == 'boolean') 
                      self.model.parameter[p]=(v.toLowerCase()=='false'?false:true);
                    else
                      self.model.parameter[p]=Aios.Json.parse(v,{});
                  } catch (e) {
                    self.message('Invalid parameter setting of '+p+': '+e,'error');
                    return;
                  };
                  if (self.simu) self.simu.setParameter(p,self.model.parameter[p]);
                }
              }
              self.configSimulationWin.close();
              self.configSimulationWin=none;
            }}
           ]
       },
	   body: {
         rows:[{ view:"form", scroll:true, width:300, height:450, elements:rows }]
       }
     });
  }

   
  ////////////////////////
  // SIMULATION WORLD WIN
  ////////////////////////
  
  this.worldWin = this.webix.ui({
    id:'worldWin',
	view:"window",
	height:400,
	width:500,
	left:70, top:70,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarworldWin",
        cols:[
         { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
            if (self.worldWin.flags) {
              self.UI('worldWinButFlags').define('icon','flag');
              self.UI('worldWinButFlags').refresh();
              self.worldWin.flags=false;
              self.removeFlags();
            };
            self.clearWorld();
         }},
         { view:"button", type:"icon", icon:"repeat", tooltip:'Redraw', width:30, click:function () {
            self.clearWorld();
            self.drawWorld();
         }},
         { view:"button", type:"icon", icon:"search-plus", tooltip:'Zoom In', width:28, click:function () {
            self.worldWin.zoom  *= 1.25;
            self.clearWorld();
            self.drawWorld();
         }},
         { view:"button", type:"icon", icon:"search-minus", tooltip:'Zoom Out', width:28, click:function () {
            self.worldWin.zoom  /= 1.25;
            self.clearWorld();
            self.drawWorld();
         }},
         { view:"button", id:'worldWinButZoomRegion', type:"icon", icon:"search", tooltip:'Zoom Region', width:28, click:function () {
            self.window.mode='zoom';
            self.UI('worldWinButZoomRegion').disable();
         }},
         { view:"button", type:"icon", icon:"square-o", tooltip:'Zoom Fit', width:28, click:function () {
            self.worldWin.zoomFit();
         }},
         { view:"button", id:'worldWinButSelectRegion', type:"icon", icon:"crop", tooltip:'Select Region', width:28, click:function () {
            self.window.mode='select';
            self.UI('worldWinButSelectRegion').disable();
         }},
         { view:"button", id:'worldWinButResetView', type:"icon", icon:"step-backward", tooltip:'Reset View', width:28, click:function () {
            self.worldWin.zoom=1.0;
            self.worldWin.offset={x:0,y:0};
            self.clearWorld();
            self.drawWorld();
         }},
         { view:"button", id:'worldWinButFlags', type:"icon", icon:"flag", tooltip:'Enable/Disable Object Flags', width:30, click:function () {
            if (self.worldWin.flags) {
              self.UI('worldWinButFlags').define('icon','flag');
              self.UI('worldWinButFlags').refresh();
              self.worldWin.flags=false;
              self.removeFlags();
            } else {
              self.UI('worldWinButFlags').define('icon','flag-o');
              self.UI('worldWinButFlags').refresh();
              self.worldWin.flags=true;
              self.addFlags();
            }
         }},
         
         { view:"button", id:'worldWinSave', type:"icon", icon:"print", tooltip:'Export simulation world to SVG/PNG', width:30, click:function () {
            self.printer.simulation(true);
         }},

         { view:"label", id:'worldWinInfo', label:'', align:'center'},
         { view:"label", label:'MAS World', width:200, align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.worldWin.hide();
         }}
        ]
    },
    body:{
      template : '<div id="worldGraphContainer" style="width: 2000px; height: 2000px;"></div>',
      borderless:false            
    }
  });

  this.worldWin.shapes={};
  this.worldWin.zoom=1.0;
  this.worldWin.offset={x:0,y:0};
  this.worldWin.zoomFit = function () {
    var zw=1,zh=1,o,dx,dy;
    self.worldWin.offset={x:0,y:0};
    // self.log(util.inspect(self.window));
    zw=(self.worldWin.getNode().offsetWidth-35)/(self.window.x1-self.window.x0);
    zh=(self.worldWin.getNode().offsetHeight-70)/(self.window.y1-self.window.y0);
    self.worldWin.zoom=Math.min(zw,zh);
    dx=-self.window.x0+10;
    dy=-self.window.y0+10;
    for(o in self.objects) {
      self.moveShape(o,dx,dy);
    }          
    self.clearWorld();
    self.drawWorld();
  }
  this.toolbar.show();
  this.UI('buttonTopSave').disable();
  
  ////////////////////
  // INSPECTOR WIN
  ////////////////////
  this.inspectorWin = this.webix.ui({
    id:'inspectorWin',
	view:"window",
	height:400,
	width:300,
	left:90, top:90,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarinspectorWin",
        cols:[
         { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
            self.deleteTree('/');
         }},
         { view:"button", type:"icon", icon:"university", tooltip:'Model', width:30, click:function () {
            self.inspect.data=self.model;
            self.deleteTree(self.inspect.root);
            self.makeTree(self.inspect.data,'root');
            self.UI('inspectorTree').close('root');
         }},
         { view:"button", type:"icon", icon:"picture-o", tooltip:'GUI Objects', width:30, click:function () {
            self.inspect.data=self.objects;
            self.deleteTree('GUI');
            self.makeTree(self.inspect.data,'root');
            self.UI('inspectorTree').close('root');
         }},
         { view:"button", type:"icon", icon:"pie-chart", tooltip:'Analysis', width:30, click:function () {
            // get selected object and create plot
            var tree = self.UI('inspectorTree'),
                node = tree.getSelectedItem(),
                data = node && node._data;
            self.plotAutoWin.show();
            if (data) self.plotAuto(data,node.value,{});
            else self.plotAuto([1,2,3,4,5,4,3,2,1],'test'); // test
         }},
         { view:"button", id:'buttonObjectSave', type:"icon", icon:"save", tooltip:'Save Selected Object', width:30, click:function () {
            var tree = self.UI('inspectorTree'),
                node = tree.getSelectedItem(),
                data = node && node._data;
            if (!node) return;
            var but = self.UI('filedialogWinAction');
            self.objectData = Aios.Json.stringify(data);          
            but.setValue('Save Object');
            but.refresh();
            self.UI('filedialogWinFormFile').setValue((node.value=='/'?'root':node.value)+'.json');
            self.openDir(self.workdir);
            self.filedialogWin.show();
         }},
         { view:"button", id:'inspectorWinLock', type:"icon", icon:"unlock", tooltip:'Lock/Unlock View', width:30, click:function () {
            if (self.inspectorWin.locked) {
              self.UI('inspectorWinLock').define('icon','unlock');
              self.UI('inspectorWinLock').refresh();
              self.inspectorWin.locked=false;
            } else {
              self.UI('inspectorWinLock').define('icon','lock');
              self.UI('inspectorWinLock').refresh();
              self.inspectorWin.locked=true;
            }
         }},
         { view:"label", label:"Inspector", align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.inspectorWin.hide();
         }}
        ]
    },
    body: {
      id:'inspectorTree',
      view:'tree',
      type:'lineTree',
      template:"{common.icon()}<span>&nbsp;#value#<span>",
      select:true,
      data: [
        { id:"root", open:true, value:"/"}
      ]
    }
  });
  this.UI('inspectorTree').attachEvent("onBeforeOpen", function(id){
    var tree = self.UI('inspectorTree'),
        node = tree.getItem(id),
        childid,n=100000,p,remove=[];
    childid=tree.getFirstChildId(id);
    while (childid != undefined && n>0) {
      n--;
      remove.push(childid);
      childid=tree.getNextSiblingId(childid);      
    }
    for(p in remove) tree.remove(remove[p]);
    if (node._data) self.makeTree(node._data,id);
    else if (id=='root') self.makeTree(self.inspect.data,id);
  });
  this.UI('inspectorTree').attachEvent("onBeforeClose", function(id){
    var tree = self.UI('inspectorTree'),
        node = tree.getItem(id);
    tree.add({id:id+'.0',value:'..'},0,id);   
  });

  /////////////////////////
  // MAIN CONFIGURATION WIN
  /////////////////////////
  this.configWin = this.webix.ui({
    id:'configWin',
	view:"window",
	width:300,
	height:450,
	left:90, top:90,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarconfigWin",
        cols:[
         { view:"label", label:"Configuration", align:'right'},
         { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
            self.options.simulation.TMO=Number(self.UI('configSimulationTMO').getValue());
            self.configWin.hide();
         }}
        ]
    },
	body: {
      rows:[
        { view:"form", scroll:true, width:300, height:400, elements: [
          
          { view:"label", label:"<b>Object Selection</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configObjectSelectionAgent', customCheckbox:false, labelRight:"Agents", height:'18px', value:self.options.select.agent,
            click: function (o) {self.options.select.agent=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectSelectionNode', customCheckbox:false, labelRight:"Nodes", height:'18px',value:self.options.select.node,
            click: function (o) {self.options.select.node=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectSelectionLink', customCheckbox:false, labelRight:"Links", height:'18px',value:self.options.select.link,
            click: function (o) {self.options.select.link=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectSelectionPort', customCheckbox:false, labelRight:"Ports", height:'18px',value:self.options.select.port,
            click: function (o) {self.options.select.port=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectSelectionResource', customCheckbox:false, labelRight:"Resources", height:'18px',value:self.options.select.resource,
            click: function (o) {self.options.select.resource=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectSelectionPatch', customCheckbox:false, labelRight:"Patches", height:'18px',value:self.options.select.patch,
            click: function (o) {self.options.select.patch=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectSelectionPhysics', customCheckbox:false, labelRight:"Physics Connect", height:'18px',value:self.options.select.physics,
            click: function (o) {self.options.select.physics=self.UI(o).getValue()}}, 

          { view:"label", label:"<b>Object Display</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configObjectDisplayAgents', customCheckbox:false, labelRight:"Agents", height:'18px', value:self.options.display.agent,
            click: function (o) {self.options.display.agent=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectDisplayNodes', customCheckbox:false, labelRight:"Nodes", height:'18px',value:self.options.display.node,
            click: function (o) {self.options.display.node=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectDisplayLinks', customCheckbox:false, labelRight:"Links", height:'18px',value:self.options.display.link,
            click: function (o) {self.options.display.link=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectDisplayPorts', customCheckbox:false, labelRight:"Ports", height:'18px',value:self.options.display.port,
            click: function (o) {self.options.display.port=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectDisplayResources', customCheckbox:false, labelRight:"Resources", height:'18px',value:self.options.display.resource,
            click: function (o) {self.options.display.resource=self.UI(o).getValue()}},
          { view:"checkbox", id:'configObjectDisplayPatches', customCheckbox:false, labelRight:"Patches", height:'18px',value:self.options.display.patch,
            click: function (o) {self.options.display.patch=self.UI(o).getValue()}},
          { view:"checkbox", id:'configObjectDisplayWorld', customCheckbox:false, labelRight:"World", height:'18px',value:self.options.display.world,
            click: function (o) {self.options.display.world=self.UI(o).getValue()}},
          { view:"checkbox", id:'configObjectDisplayFlags', customCheckbox:false, labelRight:"Flags", height:'18px',value:self.options.display.flag,
            click: function (o) {self.options.display.flag=self.UI(o).getValue()}},
          { view:"checkbox", id:'configObjectDisplayLabels', customCheckbox:false, labelRight:"Labels", height:'18px',value:self.options.display.label,
            click: function (o) {self.options.display.label=self.UI(o).getValue()}},
          { view:"checkbox", id:'configObjectDisplaySignals', customCheckbox:false, labelRight:"Signals", height:'18px',value:self.options.display.signal,
            click: function (o) {self.options.display.signal=self.UI(o).getValue()}},

          { view:"label", label:"<b>Inspector Object Filter</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configInspectorFilterFunction', customCheckbox:false, labelRight:"Functions", height:'18px', value:0,
            click: function (o) {self.inspect.filter.function=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configInspectorFilterCannon', customCheckbox:false, labelRight:"Physical Attributes", height:'18px', value:0,
            click: function (o) {
              var set=self.UI(o).getValue();
              if (!set) {self.inspect.filter.attributes=undefined; return;}
              if (!self.inspect.filter.attributes) self.inspect.filter.attributes={};
              for(var p in physicalAttributeSet) {
                if (typeof physicalAttributeSet[p] == 'string')
                  self.inspect.filter.attributes[physicalAttributeSet[p]]=true;
                else if (physicalAttributeSet[p] instanceof RegExp) {
                  if (!self.inspect.filter.attributes.patterns) self.inspect.filter.attributes.patterns=[];
                  self.inspect.filter.attributes.patterns.push(physicalAttributeSet[p]);
                }
              }
            }
          }, 


          { view:"label", label:"<b>Object Updates</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configObjectUpdates', customCheckbox:false, labelRight:"Lazy", height:'18px', value:self.options.display.lazy,
            click: function (o) {
              self.options.display.lazy=self.UI(o).getValue()
              // update simulation control window
              if (self.options.display.lazy) {
                UI('simulationWinButLazy').define('icon','bar-chart')
              } else {
                UI('simulationWinButLazy').define('icon','area-chart')
              }
              UI('simulationWinButLazy').refresh();
            }}, 

          { view:"label", label:"<b>Balloon Messages</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configObjectMessageWarning', customCheckbox:false, labelRight:"Warning", height:'18px', value:0,
            click: function (o) {self.options.message.warning=self.UI(o).getValue()}}, 
          { view:"checkbox", id:'configObjectMessageError', customCheckbox:false, labelRight:"Error", height:'18px', value:1,
            click: function (o) {self.options.message.error=self.UI(o).getValue()}}, 


          { view:"label", label:"<b>Export Image Auto Numbering</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configNumberingSimulation', customCheckbox:false, labelRight:"simulation", height:'18px', value:0,
            click: function (o) {
              var i=0; 
              self.options.numbering.simulation=self.UI(o).getValue()?
                function () {var _i=i; i++; return _i<10?'00'+_i:(_i<100?'0'+_i:''+_i)}:function(){return''}}
          }, 
          { view:"checkbox", id:'configNumberingSimulationPhy', customCheckbox:false, labelRight:"simulationPhy", height:'18px', value:0,
            click: function (o) {
              var i=0; 
              self.options.numbering.simulationPhy=self.UI(o).getValue()?
                function () {var _i=i; i++; return _i<10?'00'+_i:(_i<100?'0'+_i:''+_i)}:function(){return''}}
          }, 
          { view:"checkbox", id:'configNumberingPlot', customCheckbox:false, labelRight:"Plot", height:'18px', value:0,
            click: function (o) {
              var i=0; 
              self.options.numbering.plot=self.UI(o).getValue()?
                function () {var _i=i; i++; return _i<10?'00'+_i:(_i<100?'0'+_i:''+_i)}:function(){return''}}
          }, 



          { view:'label', label:'<b>Flag Fontsize</b>',height:0},
          {
            view:"radio", 
            id:"configFlagSize",
            name:"configFlagSize",
            label:"      ", 
            value:14, 
            vertical:true,
            customRadio:false,
            click: function () {self.options.flag.fontSize=self.UI('configFlagSize').getValue()}, 
            options:[
                {"id":14, "value":"14 px"}, 
                {"id":18, "value":"18 px"},
                {"id":24, "value":"24 px"},
                {"id":28, "value":"28 px"},
            ]
          },

          { view:'label', label:'<b>Verbosity Level Simulation)</b>', height:0},
          {
            view:"radio", 
            id:"configVerbosity",
            name:"configVerbosity",
            label:"      ", 
            value:0, 
            vertical:true,
            customRadio:false,
            click: function () {self.options.verbose=self.UI('configVerbosity').getValue()}, 
            options:[
                {"id":0, "value":"None"}, 
                {"id":1, "value":"Low"},
                {"id":2, "value":"Mid"},
                {"id":3, "value":"High"},
            ]
          },

          { view:'label', label:'<b>Simulation</b>', height:0},
          { view:"checkbox", id:'configSimulationFastCopy', customCheckbox:false, labelRight:"Fast Copy", height:'18px', value:self.options.simulation.fastcopy,
            click: function (o) {self.options.simulation.fastcopy=Number(self.UI(o).getValue())==1;}}, 
          { view:"text", id:"configSimulationTMO", label:"Node TMO", value:self.options.simulation.TMO},

          { view:'label', label:'<b>Agent Logging</b>', height:0},
          { view:"checkbox", id:'configLogNode', customCheckbox:false, labelRight:"node", height:'18px', value:self.options.log.node,
            click: function (o) {self.options.log.node=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configLogAgent', customCheckbox:false, labelRight:"agent", height:'18px', value:self.options.log.agent,
            click: function (o) {self.options.log.agent=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configLogClass', customCheckbox:false, labelRight:"class", height:'18px', value:self.options.log.class,
            click: function (o) {self.options.log.class=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configLogParent', customCheckbox:false, labelRight:"parent", height:'18px', value:self.options.log.parent,
            click: function (o) {self.options.log.parent=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configLogPid', customCheckbox:false, labelRight:"pid", height:'18px', value:self.options.log.pid,
            click: function (o) {self.options.log.pid=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configLogHost', customCheckbox:false, labelRight:"host", height:'18px', value:self.options.log.host,
            click: function (o) {self.options.log.host=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configLogTime', customCheckbox:false, labelRight:"time", height:'18px', value:self.options.log.time,
            click: function (o) {self.options.log.time=Number(self.UI(o).getValue())}}, 


          { view:'label', label:'<b>Z Level</b>', height:0},
          { view:"checkbox", id:'configZlevel0', customCheckbox:false, labelRight:"0", height:'18px', value:self.level[0],
            click: function (o) {self.level[0]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel1', customCheckbox:false, labelRight:"1", height:'18px', value:self.level[1],
            click: function (o) {self.level[1]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel2', customCheckbox:false, labelRight:"2", height:'18px', value:self.level[2],
            click: function (o) {self.level[2]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel3', customCheckbox:false, labelRight:"3", height:'18px', value:self.level[3],
            click: function (o) {self.level[3]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel4', customCheckbox:false, labelRight:"4", height:'18px', value:self.level[4],
            click: function (o) {self.level[4]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel5', customCheckbox:false, labelRight:"5", height:'18px', value:self.level[5],
            click: function (o) {self.level[5]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel6', customCheckbox:false, labelRight:"6", height:'18px', value:self.level[6],
            click: function (o) {self.level[6]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel7', customCheckbox:false, labelRight:"7", height:'18px', value:self.level[7],
            click: function (o) {self.level[7]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel8', customCheckbox:false, labelRight:"8", height:'18px', value:self.level[8],
            click: function (o) {self.level[8]=Number(self.UI(o).getValue())}}, 
          { view:"checkbox", id:'configZlevel9', customCheckbox:false, labelRight:"9", height:'18px', value:self.level[9],
            click: function (o) {self.level[9]=Number(self.UI(o).getValue())}}, 

        ]}
      ]
    }
  });

  ///////////////
  // REPORTER WIN
  ///////////////
  this.reportWin = none;
  this.reportWinIndex = 0;
  this.reportWinSetup = function (tbl) { 
    var win,
        rows=[];
    // Create table; First row is header
    function makeReport(tbl) {
      if (!tbl || !tbl.length) return {};
      var header = tbl.shift(),
          columns = [],
          hash =[],
          data =[];
      header.forEach(function (col,i) { columns.push({id:col,header:col,editor:'text'}); hash[i]=col; });
      tbl.forEach (function (row,i) {
        var obj={id:i};
        row.forEach(function (col,j) { obj[hash[j]]=col; });
        data.push(obj);
      });
      var datatbl = {
        view:"datatable", 
        columns:columns,
		select:"cell",
		multiselect:true,
	    blockselect:true,
        clipboard:"selection",
        data: data,
        on:{
					onBeforeBlockSelect:function(start, end, fin){
						if (start.column === "rank")
							end.column = "votes";

						if (fin && start.column == "rank"){
							var mode = this.isSelected(start) ? -1 : 1;
							this.selectRange(
								start.row, start.column, end.row, end.column,
								mode
							);
							return false;
						}
					}
				},
      };
      return datatbl;          
    }
    for(var t in tbl) {
      rows.push({ view:"label", label:t, align:'left'});
      rows.push(makeReport(tbl[t]));
    }
    self.reportWinIndex++;
    win=self.webix.ui({
      id:'reportWin'+self.reportWinIndex,
	  view:"window",
	  width:400,
	  height:450,
	  left:90, top:90,
	  move:true,
	  resize: true,
      toFront:true,
      head: {
          view:"toolbar",
          id:"myToolbarreportWin",
          cols:[
           { view:"label", label:"Report "+self.reportWinIndex, align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              win.hide();
              self.reportWin=none;
           }}
          ]
      },
	  body: {
        rows:rows
      }
    });
    self.reportWin=win;
  }
  
  
  //////////////////////
  // PHYSICAL SIMULATION WIN
  //////////////////////
  this.physicalWin = this.webix.ui({
    id:'physicalWin',
	view:"window",
	height:400,
	width:600,
	left:50, top:50,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarphysicalWin",
        cols:[
          { view:"button", id:"physicalWinButCreate", type:"icon", icon:"star", tooltip:'Create', width:30, click:function () {
            self.createSimuPhy();
          }},
          { view:"button", id:"physicalWinButDestroy", type:"icon", icon:"trash", tooltip:'Destroy', width:30, click:function () {
            self.destroySimuPhy();
          }},
          { view:"button", id:"physicalWinButRun",type:"icon", icon:"play", tooltip:'Run', width:30, click:function () {
            if (self.physicalWin.gui) {
              self.physicalWin.gui.enable();
              //self.UI('physicalWinButRender').define('icon','toggle-on');
              //self.UI('physicalWinButRender').refresh();
              self.physicalWin.render=true;
              self.physicalWin.gui.start();
              self.UI('physicalWinButRun').disable();
              self.UI('physicalWinButStep').disable();
              self.UI('physicalWinButStop').enable();
            }
          }},
          { view:"button", id:"physicalWinButStep", type:"icon", icon:"step-forward", tooltip:'Step', width:30, click:function () {
            var steps = Number(self.UI('physicalWinFormSteps').getValue());
            if (self.physicalWin.gui) {
              self.physicalWin.gui.enable();
              self.physicalWin.gui.step(steps);
              //self.UI('physicalWinButRender').define('icon','toggle-off');
              //self.UI('physicalWinButRender').refresh();
              self.physicalWin.render=false;
            } 
          }},
          { view:"button", id:"physicalWinButStop", type:"icon", icon:"stop", tooltip:'Stop', width:30, click:function () {
            if (self.physicalWin.gui) {
              self.physicalWin.gui.disable()
              self.physicalWin.gui.stop();
              self.UI('physicalWinButRun').enable();
              self.UI('physicalWinButStep').enable();
              self.UI('physicalWinButStop').disable();
              //self.UI('physicalWinButRender').define('icon','toggle-off');
              //self.UI('physicalWinButRender').refresh();
              self.physicalWin.render=false;
            }
          }},
          { view:"button", type:"icon", icon:"sitemap", tooltip:'Inspector', width:30, click:function () {
            if (self.simuPhy && self.simuPhy.objects) {
              self.inspect.data=self.simuPhy.objects;
              self.deleteTree('PHY');
              self.makeTree(self.inspect.data,'root');
              self.UI('inspectorTree').close('root');
           }
         
          }},
          { view:"button", id:'physicalWinSave', type:"icon", icon:"print", tooltip:'Export simulation world to PNG', width:30, click:function () {
            self.printer.simulationPhy();
          }},
          { view:"button", type:'icon', icon:'info' , tooltip:'Report', width:30, click:function () {
            var tbl;
            if (self.simuPhy) tbl=self.simuPhy.report();
            self.reportWinSetup(tbl);
            self.reportWin.show();
          }},
          { view:"text", id:'physicalWinFormSteps', label:"Steps", value:'1', maxWidth:150},
          { view:"label", label:"Physical World", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.physicalWin.hide();
          }}
      ]
    },
    body:    {
      template : '<div id="CANNON" tabindex="0" style="padding:0px; margin:0px;"></div>',
      borderless:false            
    } 
  });


  this.physicalWin.attachEvent("onViewResize", function(id){
    if (self.physicalWin.gui) {
      self.physicalWin.gui.resize({width:self.physicalWin.getNode().offsetWidth-26,
                                   height:self.physicalWin.getNode().offsetHeight-70});
      self.physicalWin.gui.animate1();
    }
  });





  //////////////////////
  // SENSORS SIMULATION WIN
  //////////////////////
  this.sensorsWin = this.webix.ui({
    id:'sensorsWin',
	view:"window",
	height:400,
	width:600,
	left:50, top:50,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarSensorsWin",
        cols:[
          { view:"button", id:"sensorsWinButCreate", type:"icon", icon:"star", tooltip:'Create', width:30, click:function () {
            self.createSimuSens(self.sensorsWin.options);
          }},
          { view:"button", id:"sensorsWinButDestroy", type:"icon", icon:"trash", tooltip:'Destroy', width:30, click:function () {
            self.destroySimuSens();
          }},
          { view:"button", id:"sensorsWinButRun",type:"icon", icon:"play", tooltip:'Run', width:30, click:function () {
            self.UI('sensorsWinButRun').disable();
            self.UI('sensorsWinButStep').disable();
            self.UI('sensorsWinButStop').enable();
          }},
          { view:"button", id:"sensorsWinButStep", type:"icon", icon:"step-forward", tooltip:'Step', width:30, click:function () {
            //self.UI('sensorsWinButRender').define('icon','toggle-off');
            //self.UI('sensorsWinButRender').refresh();
            if (self.sensorsWin.gui) self.sensorsWin.gui.step();
          }},
          { view:"button", id:"sensorsWinButStop", type:"icon", icon:"stop", tooltip:'Stop', width:30, click:function () {
            self.UI('sensorsWinButRun').enable();
            self.UI('sensorsWinButStep').enable();
            self.UI('sensorsWinButStop').disable();
          }},
          { view:"button", type:"icon", icon:"navicon", tooltip:'Sensors World Setup', width:30, click:function () {
            if (self.configsensorsWin.isVisible())
              self.configsensorsWin.hide();
            else {
              self.configsensorsWin.show();
            }
          }},
          { view:"button", type:"icon", icon:"sitemap", tooltip:'Inspector', width:30, click:function () {
            if (self.simuSensors && self.simuSensors.objects) {
              self.inspect.data=[];
              self.deleteTree('PHY');
              self.makeTree(self.inspect.data,'root');
              self.UI('inspectorTree').close('root');
           }
         
          }},
          { view:"button", id:'sensorsWinSave', type:"icon", icon:"print", tooltip:'Export simulation world to PNG', width:30, click:function () {
          }},
          { view:"label", label:"Sensors World", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.sensorsWin.hide();
          }}
      ]
    },
    body:    {
      template : '<canvas id="sensorsContainer" style="padding:0px; margin:0px; border: 1px solid gray"></canvas>',
      borderless:false            
    } 
  });


  this.sensorsWin.attachEvent("onViewResize", function(id){
    if (self.sensorsWin.gui) {
      self.sensorsWin.gui.resize({width:self.sensorsWin.getNode().offsetWidth-26,
                                  height:self.sensorsWin.getNode().offsetHeight-70});
    }
  });
  ////////////////////////////////
  // SENSORS WORLD CONFIGURATION WIN
  ////////////////////////////////

  this.sensorsWin.options = {
    steps:1,
    delay:100,
  }
  this.configsensorsWin = self.webix.ui({
     id:'configsensorsWin',
	view:"window",
	width:300,
	height:500,
	left:90, top:90,
	move:true,
	resize: true,
        toFront:true,
     head: {
         view:"toolbar",
         id:"myToolbarconfigsensorsWin",
         cols:[
          { view:"label", label:"Configuration", align:'right'},
          { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
            self.sensorsWin.options.steps=Number(self.UI('configSensorsSteps').getValue());
            self.sensorsWin.options.delay=Number(self.UI('configSensorsDelay').getValue());
            if (self.sensorsWin.gui) self.sensorsWin.gui.config(self.sensorsWin.options);
            
            self.configsensorsWin.hide();
          }}
         ]
     },
	 body: {
       rows:[{ view:"form", scroll:true, width:300, height:450, elements:[
          { view:"text", id:"configSensorsSteps", label:"Steps", value:String(self.sensorsWin.options.steps)},
          { view:"text", id:"configSensorsDelay", label:"Delay [ms]", value:String(self.sensorsWin.options.delay)},
       ]}]
     }
   });

  ///////////////////
  // ANALYSIS WINDOW
  ///////////////////
  this.analysisWin = this.webix.ui({
    id:'analysisWin',
	view:"window",
	height:this.options.plot.height+70,
	width:this.options.plot.width+20,
	left:70, top:70,
	move:true,
	resize: false,
    toFront:true,
    head: {  
        view:"toolbar",
        id:"myToolbaranalysisWin",
        cols:[
          { view:"button", type:"icon", icon:"navicon", tooltip:'Configuration', width:30, click:function () {
            var parent = self.UI("analysisWin").getNode();
            if (self.configAnalysisWin && self.configAnalysisWin.isVisible()) {
              self.configAnalysisWin.close();              
              self.configAnalysisWin=none;
              return;
            }
            self.configAnalysisWinSetup();  
            self.configAnalysisWin.show(parent , {pos:'top'});
          }},
          { view:"button", id:'analysisWinButPlay', type:"icon", icon:"play",  tooltip:'Start Logging', width:30, click: function () {
            self.log('[ANA] Enable logging of simulation.');  
            self.logging=true;
            self.logTable=[];
            self.UI('analysisWinButPlay').disable();
            self.UI('analysisWinButStop').enable();
          }},
          { view:"button", id:'analysisWinButStop', type:"icon", icon:"stop",  tooltip:'Stop Logging', disable:true, width:30, click: function () {
            self.log('[ANA] Disable logging of simulation.');  
            self.UI('analysisWinButPlay').enable();
            self.UI('analysisWinButStop').disable();
            self.logging=false;
          }},
          { view:"button", id:'analysisWinPlotDestroy', type:"icon", icon:"trash", tooltip:'Destroy Plot', width:30, click:function () {
            self.UI('analysisWinPlotDestroy').disable();
            self.UI('analysisWinPlotCreate').enable();
            self.plot({destroy:true});
          }},
          { view:"button", id:'analysisWinPlotCreate', type:"icon", icon:"pie-chart", tooltip:'Create Plot', width:30, click:function () {
            self.log('[ANA] Logging table has '+self.logTable.length+' entries.');  
            self.UI('analysisWinPlotDestroy').enable();
            self.UI('analysisWinPlotCreate').disable();
            self.plot({
              container:'plotGraphContainer',
              width:self.options.plot.width,
              height:self.options.plot.height,
              margin:self.options.plot.margin
            });
          }},
          { view:"button", id:'analysisWinPrint', type:"icon", icon:"print", tooltip:'Export simulation world to SVG/PNG', width:30, click:function () {
            function snap() {
              var image;
              image = self.analysisWin.container.toSvg(self.options.plot.width,
                                                       self.options.plot.height+20);
              self.analysisWin.container.toSvg();
              image=image.replace(/\.svg/g,'.png');
              return image; 
            };
            try { 
              var num=self.options.numbering.plot(),
                  image = snap ();
              Io.write_file(self.workdir+'/'+self.analysisWin.options.plot.filename+num+'.svg',image);
              self.log('[ANA] Exported plot to '+self.analysisWin.options.plot.filename+num+'.svg'); 
            } catch (e) { self.log(util.inspect(e)) };
          }},
          { view:"button", id:'analysisWinSave', type:"icon", icon:"save", tooltip:'Export simulation data to CSV', width:30, click:function () {
            var data=self.plot({
              csv:true
            });
            try { 
              var num=self.options.numbering.plot();
              Io.write_file(self.workdir+'/'+'data'+num+'.csv',data);
              self.log('[ANA] Exported plot data to data'+num+'.csv'); 
            } catch (e) { self.log(util.inspect(e)) };
          }},
          { view:"label", label:"Plot Analysis", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.analysisWin.hide();
          }}
      ]
    },
    body:    {
      template : '<div id="plotGraphContainer" tabindex="0" style="padding:0px; margin:0px; width: 2000px; height: 2000px;"></div>',
      borderless:false
    } 
  });
  this.UI('analysisWinButStop').disable();
  this.UI('analysisWinPlotDestroy').disable();
  
  this.analysisWin.options={
    plot:{
      agent:0,
      node:0,
      comm:0,
      custom:0,
      migrate:0,
      fork:0,
      signal:0,
      diff:0,
      Custom1:'',
      Custom2:'',
      Title:'',
      LabelX:'Simulation Step',
      LabelY1:'',
      LabelY2:'',
      filename:'plot',
    },
    classes:{
    
    },
    nodes:{
    
    },
    type:'Point',
    window:1,
    filter:'peak'    // 'avg'|'peak'
  };
  
  ////////////////////////////
  // ANALYSIS CONFIGURATION WIN
  ////////////////////////////
  this.configAnalysisWin = none;
  
  this.configAnalysisWinSetup = function () {
    var rows=[],p;
    self.analysisWin.options.plot.styles=self.options.plot.styles;
    function disable(flags) {
      for(var i in flags) {
        p=flags[i].substring(2);
        a=p.charAt(1);
        self.UI('configPlot'+flags[i]).setValue(0);
        self.UI('configPlot'+flags[i]).refresh();
        if (self.analysisWin.options.plot[p] != undefined) 
          self.analysisWin.options.plot[p]=a==2?self.analysisWin.options.plot[p]&2:
                                                self.analysisWin.options.plot[p]&1;
      }
    }
    rows = [        
          { view:"text", id:"configPlotFilename", label:"Filename", value:self.analysisWin.options.plot.filename},
          { view:"label", label:"<b>Plot Type</b>", height:'18px', align:'left'},
          {
            view:"radio", 
            id:"configPlotType",
            name:"configPlotType",
            label:"      ", 
            value:self.analysisWin.options.type, 
            vertical:true,
            customRadio:false,
            click: function () {
              self.analysisWin.options.type=self.UI('configPlotType').getValue();
            }, 
            options:[
                {"id":"Point",",value":"Point"}, 
                {"id":"Line", "value":"Line"},
                {"id":"PointLine", "value":"PointLine"},
            ]
          },
          { view:"label", label:"<b>Plot X Variable</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configPlotStep', customCheckbox:false, labelRight:"Simulation Step", height:'18px', disabled:true, 
            value:1,
            click: function (o) {}}, 
            
          { view:"label", label:"<b>Plot Y1 Variable(s)</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configPlotY1agent', customCheckbox:false, labelRight:"Agents", height:'18px', 
            value:self.analysisWin.options.plot.agent,
            click: function (o) {
              self.analysisWin.options.plot.agent=self.UI(o).getValue();
            }},
          { view:"checkbox", id:'configPlotY1node', customCheckbox:false, labelRight:"Nodes", height:'18px', 
            value:self.analysisWin.options.plot.node,
            click: function (o) {
              self.analysisWin.options.plot.node=self.UI(o).getValue();
          }},
          { view:"checkbox", id:'configPlotY1comm', customCheckbox:false, labelRight:"Communication", height:'18px', 
            value:self.analysisWin.options.plot.comm==1?1:0,
            click: function (o) {
              disable(['Y2comm']);
              self.analysisWin.options.plot.comm=self.UI(o).getValue()?1:0;
          }},
          { view:"checkbox", id:'configPlotY1migrate', customCheckbox:false, labelRight:"Migration", height:'18px', 
            value:self.analysisWin.options.plot.migrate==1?1:0,
            click: function (o) {
              disable(['Y2migrate']);
              self.analysisWin.options.plot.migrate=self.UI(o).getValue()?1:0;
          }},
          { view:"checkbox", id:'configPlotY1fork', customCheckbox:false, labelRight:"Forking", height:'18px', 
            value:self.analysisWin.options.plot.fork==1?1:0,
            click: function (o) {
              disable(['Y2fork']);
              self.analysisWin.options.plot.fork=self.UI(o).getValue()?1:0;
          }},
          { view:"checkbox", id:'configPlotY1signal', customCheckbox:false, labelRight:"Signals", height:'18px', 
            value:self.analysisWin.options.plot.signal==1?1:0,
            click: function (o) {
              disable(['Y2signal']);
              self.analysisWin.options.plot.signal=self.UI(o).getValue()?1:0;
          }},
          { view:"checkbox", id:'configPlotY1diff', customCheckbox:false, labelRight:"Y1 / Step", height:'18px', 
            value:self.analysisWin.options.plot.diff&1?1:0,
            click: function (o) {
              self.analysisWin.options.plot.diff=
                self.analysisWin.options.plot.diff&(self.UI(o).getValue()?3:2);
              self.analysisWin.options.plot.diff=
                self.analysisWin.options.plot.diff|(self.UI(o).getValue()?1:0);
          }},
          { view:"checkbox", id:'configPlotY1custom', customCheckbox:false, labelRight:"Custom", height:'18px', 
            value:self.analysisWin.options.plot.custom&1?1:0,
            click: function (o) {
              self.analysisWin.options.plot.custom=
                self.analysisWin.options.plot.custom&(self.UI(o).getValue()?3:2);
              self.analysisWin.options.plot.custom=
                self.analysisWin.options.plot.custom|(self.UI(o).getValue()?1:0);
              if (self.UI(o).getValue()) self.UI('configPlotY1Custom').enable();
              else {
                self.UI('configPlotY1Custom').disable();
                self.analysisWin.options.plot.Custom1='';
              }
          }},
          { view:"text", id:"configPlotY1Custom", label:"      ", value:self.analysisWin.options.plot.Custom1},

          { view:"label", label:"<b>Plot Y2 Variable</b>", height:'18px', align:'left'},
          { view:"checkbox", id:'configPlotY2comm', customCheckbox:false, labelRight:"Communication", height:'18px', 
            value:self.analysisWin.options.plot.comm==2?1:0,
            click: function (o) {
              disable(['Y2migrate','Y2fork','Y2custom','Y2signal','Y1comm']);
              self.analysisWin.options.plot.comm=self.UI(o).getValue()?2:0;
          }},
          { view:"checkbox", id:'configPlotY2migrate', customCheckbox:false, labelRight:"Migration", height:'18px', 
            value:self.analysisWin.options.plot.migrate==2?1:0,
            click: function (o) {
              disable(['Y2comm','Y2fork','Y2custom','Y2signal','Y1migrate']);
              self.analysisWin.options.plot.migrate=self.UI(o).getValue()?2:0;
          }},
          { view:"checkbox", id:'configPlotY2fork', customCheckbox:false, labelRight:"Forking", height:'18px', 
            value:self.analysisWin.options.plot.fork==2?1:0,
            click: function (o) {
              disable(['Y2comm','Y2migrate','Y2custom','Y1fork','Y2signal']);
              self.analysisWin.options.plot.fork=self.UI(o).getValue()?2:0;
          }},
          { view:"checkbox", id:'configPlotY2signal', customCheckbox:false, labelRight:"Signals", height:'18px', 
            value:self.analysisWin.options.plot.signal==2?1:0,
            click: function (o) {
              disable(['Y2comm','Y2migrate','Y2fork','Y2custom','Y1signal']);
              self.analysisWin.options.plot.signal=self.UI(o).getValue()?2:0;
          }},
          { view:"checkbox", id:'configPlotY2diff', customCheckbox:false, labelRight:"Y2 / Step", height:'18px', 
            value:self.analysisWin.options.plot.diff&2?1:0,
            click: function (o) {
              self.analysisWin.options.plot.diff=
                self.analysisWin.options.plot.diff&(self.UI(o).getValue()?3:1);
              self.analysisWin.options.plot.diff=
                self.analysisWin.options.plot.diff|(self.UI(o).getValue()?2:0);
          }},
          { view:"checkbox", id:'configPlotY2custom', customCheckbox:false, labelRight:"Custom", height:'18px', 
            value:self.analysisWin.options.plot.custom&2?1:0,
            click: function (o) {
              disable(['Y2comm','Y2migrate','Y2fork','Y2signal']);
              self.analysisWin.options.plot.custom=
                self.analysisWin.options.plot.custom&(self.UI(o).getValue()?3:1);
              self.analysisWin.options.plot.custom=
                self.analysisWin.options.plot.custom|(self.UI(o).getValue()?2:0);
              if (self.UI(o).getValue()) self.UI('configPlotY2Custom').enable();
              else { 
                self.UI('configPlotY2Custom').disable();
                self.analysisWin.options.plot.Custom2='';
              }
          }},
          { view:"text", id:"configPlotY2Custom", label:"      ", value:self.analysisWin.options.plot.Custom2},


          { view:"label", label:"<b>Labels</b>", height:'18px', align:'left'},
          { view:"text", id:"configPlotXLabel", label:"X Label", value:self.analysisWin.options.plot.LabelX},
          { view:"text", id:"configPlotY1Label", label:"Y1 Label", value:self.analysisWin.options.plot.LabelY1},
          { view:"text", id:"configPlotY2Label", label:"Y2 Label", value:self.analysisWin.options.plot.LabelY2},
          { view:"text", id:"configPlotTitle", label:"Title", value:self.analysisWin.options.plot.Title},

          { view:"label", label:"<b>Point Size [px]</b>", height:'18px', align:'left'},
          {
            view:"radio", 
            id:"configPlotPointSize",
            name:"configPlotPointSize",
            label:"      ", 
            value:self.analysisWin.options.plot.styles.point[0].r*2, 
            vertical:true,
            customRadio:false,
            click: function () {
              var p;
              for (p in self.options.plot.styles.point) 
                self.analysisWin.options.plot.styles.point[p].r=Number(self.UI('configPlotPointSize').getValue())/2;
            }, 
            options:[
                {"id":2, "value":"2"}, 
                {"id":4, "value":"4"}, 
                {"id":6, "value":"6"},
                {"id":8, "value":"8"},
                {"id":10, "value":"10"},
            ]
          },
          { view:"label", label:"<b>Line Width [px]</b>", height:'18px', align:'left'},
          {
            view:"radio", 
            id:"configPlotLineWidth",
            name:"configPlotLineWidth",
            label:"      ", 
            value:self.analysisWin.options.plot.styles.line[0].width, 
            vertical:true,
            customRadio:false,
            click: function () {
              var p;
              for (p in self.analysisWin.options.plot.styles.line) 
                self.analysisWin.options.plot.styles.line[p].width=Number(self.UI('configPlotLineWidth').getValue());
            }, 
            options:[
                {"id":1, "value":"1"}, 
                {"id":2, "value":"2"},
                {"id":3, "value":"3"},
                {"id":4, "value":"4"},
            ]
          },
          { view:"label", label:"<b>Filter Window [steps]</b>", height:'18px', align:'left'},
          {
            view:"radio", 
            id:"configPlotAverage",
            name:"configPlotAverage",
            label:"      ", 
            value:self.analysisWin.options.window, 
            vertical:true,
            customRadio:false,
            click: function () {
              self.analysisWin.options.window=Number(self.UI('configPlotAverage').getValue());
            }, 
            options:[
                {"id":1, "value":"1"}, 
                {"id":2, "value":"2"},
                {"id":5, "value":"5"},
                {"id":10, "value":"10"},
                {"id":20, "value":"20"}, 
                {"id":50, "value":"50"},
                {"id":100, "value":"100"},
            ]
          },
          { view:"label", label:"<b>Filter [type]</b>", height:'18px', align:'left'},
          {
            view:"radio", 
            id:"configPlotFilter",
            name:"configPlotFilter",
            label:"      ", 
            value:self.analysisWin.options.filter, 
            vertical:true,
            customRadio:false,
            click: function () {
              self.analysisWin.options.filter=self.UI('configPlotFilter').getValue();
            }, 
            options:[
                {"id":'avg', "value":"Exponential Average"}, 
                {"id":'peak', "value":"Peak"},
            ]
          },
    ];

    if (self.model) {
      if (self.model.classes) {
        rows.push({ view:"label", label:"<b>Agent Classes</b>", height:'18px', align:'left'});
        for (p in self.model.classes) {
          rows.push(function (p) {return { view:"checkbox", id:'configPlotClasses'+p, customCheckbox:false, labelRight:p, height:'18px', value:self.analysisWin.options.classes[p],
                                           click: function (o) {
                                            self.analysisWin.options.classes[p]=self.UI(o).getValue();
                                            self.analysisWin.options.plot.agent=1;
                                            self.UI('configPlotY1agent').setValue(1);
                                            self.UI('configPlotY1agent').refresh();
                                          }}}(p));
        }
      }
      if (self.model.world && self.model.world.nodes) {
        rows.push({ view:"label", label:"<b>Node Classes</b>", height:'18px', align:'left'});
        for (p in self.model.world.nodes) {
          rows.push(function (p) {return { view:"checkbox", id:'configPlotNodes'+p, customCheckbox:false, labelRight:p, height:'18px', value:self.analysisWin.options.nodes[p],
                                           click: function (o) {
                                            self.analysisWin.options.nodes[p]=self.UI(o).getValue();
                                            self.analysisWin.options.plot.node=1;
                                            self.UI('configPlotY1node').setValue(1);
                                            self.UI('configPlotY1node').refresh();
                                          }}}(p));
        }
      }
    }
    
    self.configAnalysisWin = self.webix.ui({
       id:'configAnalysisWin',
	   view:"window",
	   width:300,
	   height:500,
	   // left:90, top:90,
	   move:true,
	   resize: true,
       toFront:true,
       head: {
           view:"toolbar",
           id:"myToolbarconfigAnalysisWin",
           cols:[
            { view:"label", label:"Configuration", align:'right'},
            { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              self.analysisWin.options.plot.LabelX=self.UI('configPlotXLabel').getValue();
              self.analysisWin.options.plot.LabelY1=self.UI('configPlotY1Label').getValue();
              self.analysisWin.options.plot.LabelY2=self.UI('configPlotY2Label').getValue();
              self.analysisWin.options.plot.Title=self.UI('configPlotTitle').getValue();
              self.analysisWin.options.plot.Custom1=self.UI('configPlotY1Custom').getValue();
              self.analysisWin.options.plot.Custom2=self.UI('configPlotY2Custom').getValue();
              self.analysisWin.options.plot.filename=self.UI('configPlotFilename').getValue();
              self.configAnalysisWin.close();
              self.configAnalysisWin=none;
            }}
           ]
       },
	   body: {
         rows:[{ view:"form", scroll:true, width:300, height:450, elements:rows }]
       }
     });
    if ((self.analysisWin.options.plot.custom&1)==0) self.UI('configPlotY1Custom').disable();
    if ((self.analysisWin.options.plot.custom&2)==0) self.UI('configPlotY2Custom').disable();
  }
  
  /////////////
  // PLOT WIN
  /////////////
  
  
  this.plotAutoWin = this.webix.ui({
    id:'plotAutoWin',
	view:"window",
	height:300,
	width:500,
	left:70, top:70,
	move:true,
	resize: true,
    toFront:true,
    head: {  
        view:"toolbar",
        id:"myToolbarplotAutoWin",
        cols:[
          { view:"button", type:"icon", icon:"print", tooltip:'Export plot world to SVG/PNG', width:30, click:function () {
            if (global.TARGET != "browser") {
              self.image=self.plotAutoSave({data:self.plotAutoWin.options.data,name:self.plotAutoWin.options.name});            
              if (self.image.png && self.filename.indexOf('.png')<0) {
                self.filename='plot.png';
                self.UI('filedialogWinFormFile').setValue(self.filename);
              }
              var but = self.UI('filedialogWinAction');
              but.setValue('Save Image');
              but.refresh();
              self.openDir(self.workdir);
              self.filedialogWin.show();
            }
          }},
          { view:"button", type:"icon", icon:"navicon", tooltip:'Plot Setup', width:30, click:function () {
            if (self.configplotAutoWin.isVisible())
              self.configplotAutoWin.hide();
            else {
              self.configplotAutoWin.show();
            }
          }},
          { view:"label", label:"Auto Plotter", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.plotAutoWin.hide();
          }}
      ]
    },
    body:    {
      template : '<canvas id="chartContainer" style="padding:0px; margin:0px; "></canvas>',
      borderless:false
    } 
  });
  this.plotAutoWin.options = {
    labelX:'',
    labelY1:'',
    labelY2:'',
    title:'',
    fontsize:14,
  }
  this.configplotAutoWin = self.webix.ui({
     id:'configplotAutoWin',
	view:"window",
	width:300,
	height:500,
	// left:90, top:90,
	move:true,
	resize: true,
        toFront:true,
     head: {
         view:"toolbar",
         id:"myToolbarconfigplotAutoWin",
         cols:[
          { view:"label", label:"Configuration", align:'right'},
          { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
            self.plotAutoWin.options.labelX=self.UI('configPlotAutoXLabel').getValue();
            self.plotAutoWin.options.labelY1=self.UI('configPlotAutoY1Label').getValue();
            self.plotAutoWin.options.labelY2=self.UI('configPlotAutoY2Label').getValue();
            self.plotAutoWin.options.title=self.UI('configPlotAutoTitle').getValue();

            self.configplotAutoWin.hide();
            if (self.plotAutoWin.options.data) self.plotAuto(self.plotAutoWin.options.data,
                                                             self.plotAutoWin.options.name,{})
          }}
         ]
     },
	 body: {
       rows:[{ view:"form", scroll:true, width:300, height:450, elements:[
          { view:"label", label:"<b>Labels</b>", height:'18px', align:'left'},
          { view:"text", id:"configPlotAutoXLabel", label:"X Label", value:self.plotAutoWin.options.labelX},
          { view:"text", id:"configPlotAutoY1Label", label:"Y1 Label", value:self.plotAutoWin.options.labelY1},
          { view:"text", id:"configPlotAutoY2Label", label:"Y2 Label", value:self.plotAutoWin.options.labelY2},
          { view:"text", id:"configPlotAutoTitle", label:"Title", value:self.plotAutoWin.options.title},

          { view:"label", label:"<b>Font Size [px]</b>", height:'18px', align:'left'},
          {
            view:"radio", 
            id:"configPlotAutoFontSize",
            name:"configPlotAutoFontSize",
            label:"      ", 
            value:self.plotAutoWin.options.fontsize, 
            vertical:true,
            customRadio:false,
            click: function () {
              self.plotAutoWin.options.fontsize=Number(self.UI('configPlotAutoFontSize').getValue())/2;
            }, 
            options:[
                {"id":10, "value":"10"}, 
                {"id":12, "value":"12"}, 
                {"id":14, "value":"14"},
                {"id":16, "value":"16"},
                {"id":18, "value":"18"},
            ]
          },
       ]}]
     }
   });

  /////////////
  // INFO BOARD WIN
  /////////////
  
  
  this.infoBoardWin = this.webix.ui({
    id:'infoBoardWin',
    view:"window",
    height:500,
    width:700,
    left:70, top:70,
    move:true,
    resize: true,
    toFront:true,
    head: {  
        view:"toolbar",
        id:"myToolbarinfoBoardWin",
        cols:[
          { view:"label", label:"Information Board", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.infoBoardWin.hide();
          }}
      ]
    },
    body:{
        view : 'scrollview',
        id:'infoBoardWinScrollView',
        scroll : 'y',
        body : {
          id:'infoBoardWinScrollViewBody',
          rows : [
          ]
        }
     } 
  });
  this.infoBoardWin.marked  = function (help) {
    if (self.infoBoardWin._view) UI('infoBoardWinScrollViewBody').removeView(self.infoBoardWin._view);
    var helpRendered=marked(help);
    self.infoBoardWin._view=UI('infoBoardWinScrollViewBody').addView({
      rows : [
        {template:'<div class="marked" id="infoBoardWin-marked">'+helpRendered+'</div>', autoheight:true}
      ]
     });
  }
  this.infoBoardWin.attachEvent("onShow", function(){
    setTimeout(function () { UI('infoBoardWinScrollViewBody').resize(); UI('infoBoardWin').resize() }, 50)
  });
  
  
  /////////////
  // CHAT WIN
  /////////////
  this.chatWin = this.webix.ui({
    id:'chatWin',
	view:"window",
	height:400,
	width:300,
	left:100, top:100,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbarchatWin",
        cols:[
         { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:50, click:function () {
          chatReset();
         }},
         { view:"button", type:"icon", icon:"user", tooltip:'Talk', width:50, click:function () {
          // interrupt request (question)
         }},
         { view:"button", type:"icon", icon:"info", tooltip:'Information', width:50, click:function () {
          // show info window
            self.infoBoardWin.marked(self.model.info||'# Online Help');
            self.infoBoardWin.show();
         }},
          { view:"label", label:"Simulation Dialog Chat", align:'right'},
          { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
            self.chatWin.hide();
         }}
        ]
    },
    body:{
      template : ' <div class="botui-app-container" id="chat-bot" style="width:100%;"><bot-ui></bot-ui></div>',
      borderless:false            
    }
  });

  this.chatWin.chatActions=[]; // copy(chatActionsInit,true);
  this.chatWin.chatLastAction=undefined;
  this.chatWin.nextChatHistory=[];
  this.chatWin.chatHistory=[];
  this.chatWin.chatOpen=false;

  // Clear the chat
  function chatReset () {
    self.chatWin.chatActions=[];
    self.chatWin.chatHistory=[];
    self.chatWin.nextChatHistory=[];
    self.chatWin.chatLastAction=undefined;
    if (self.chatWin.botui) {
      self.chatWin.botui.message.removeAll();
    }
    chatRefresh();
  }
  // Refresh the chat by adding old/new messages and actions

  function chatRefresh () {
    if (!self.chatWin.botui) return;
    function exec(l,last) {
      var todo=l.shift();
      if (!todo) return;
      function doit(todo,last) {
        switch (todo.kind) {
          case 'message':
            last=self.chatWin.botui.message.bot(todo);
            break;
          case 'answer':
            last=self.chatWin.botui.message.human(todo);
            break;
          case 'wait':
            if (last) last=last.then(function () {});
            break;
          case 'button':
            self.chatWin.chatLastAction=[todo]; 
            if (last) last=last.then(function () { return self.chatWin.botui.action.button(todo); }).then(function (res) {
                                        self.chatWin.chatLastAction=[];
                                        return { then:function (f) { f(res) } }
                            });
            else {
              last=self.chatWin.botui.action.button(todo).then(function (res) {
                                        self.chatWin.chatLastAction=undefined;
                                        return { then:function (f) { f(res) } }
                            });
            }
            break;
          case 'value':
            self.chatWin.chatLastAction=[todo]; 
            if (last) last=last.then(function () { return self.chatWin.botui.action.text(todo); }).then(function (res) {
                                        self.chatWin.chatLastAction=[];
                                        return { then:function (f) { f(res) } }
                            });
            else {
              last=self.chatWin.botui.action.text(todo).then(function (res) {
                                        self.chatWin.chatLastAction=undefined;
                                        return { then:function (f) { f(res) } }
                            });
            }
            break;
          case 'checkpoint':
            if (self.chatWin.chatLastAction.length) self.chatWin.chatLastAction.push(todo);
            if (last) last=last.then(function (res) { if (todo.timer) clearTimeout(todo.timer); return todo.callback(res) });
            break;
        }
        return last
      }
      last=doit(todo,last);
      if (l.length) exec(l,last);
    }
    exec(self.chatWin.chatHistory);
    exec(self.chatWin.chatActions);  
  }
  // Add a chat action
  function chatAction (action) {
    self.chatWin.chatActions.push(action);
  }

  // External chat requests
  function chatQuestion (id, question, action, callback, timeout) {
    // TODO: Remove question after timeout!
    var actions=[],timer;
    chatAction({kind:'message', delay:0, content: id+': '+question });
    if (timeout) timer=setTimeout(function () {
      self.chatWin.chatLastAction=[];
      // console.log('chatQuestion timeout');
      self.chatWin.chatActions=self.chatWin.chatActions.filter(function (todo) {
        if (todo.kind=='checkpoint' || todo.action) return false;
        else return true;
      });
      if (self.chatWin.botui) self.chatWin.botui.removeAction();
      if (callback) callback();
    },timeout);
    if (action instanceof Array) {
      // Buttons/Choices
      if (typeof action[0] == 'string') action=action.map(function (s) { return { text:s, value:s } });
      chatAction({kind:'button', delay:0, action: action});
      chatAction({kind:'checkpoint', callback:callback, timer:timer});
    } else if (typeof action == 'object') {
      // Value or text
      chatAction({kind:'value', delay:0, action: action});
      chatAction({kind:'checkpoint', callback:callback, timer:timer});  
    } 
    chatRefresh();
  }

  function chatMessage (id,message) {
    chatAction({kind:'message', delay:0, content: id+': '+message });
    chatRefresh();
  }  
  
  
  this.chatQuestion=chatQuestion;
  this.chatMessage=chatMessage;
  this.chatReset=chatReset;
  
  
  /* Chat Script Interpreter */
  // {question:string, choices?:[], value?:number|string, eval?:function, 
  //  cond?:function, timeout?:numebr, tag?:string }
  // {message:string}
  // {finalize:function}
  // {process:function}
  // {init:function}
  // ! After reply to a question the question record contains an answer attribute !
  this.chatScript = {
    script :  [],
    id:'Anonymous',
    index : 0,
    cancel : function () {
      self.chatScript.script=[];
    },
    init: function (id,script) {
      self.chatScript.script=script;
      self.chatScript.index=0;
      self.chatScript.id=id;
    },
    next : function () {
      function replaceText(text,vars) {
         var reg=[
           /\$1/g,
           /\$2/g,
           /\$3/g,
           /\$4/g,
           /\$5/g,
           /\$6/g,
           /\$7/g,      
           /\$8/g,
         ]
         if (!vars) return text;
         vars.forEach(function (v,i) {
           text=text.replace(reg[i],v)
         });
         return text;
      }
      var process = Aios.current.process;
      var index = self.chatScript.index;
      var next = self.chatScript.script[index];
      self.chatScript.index++;
      if (!next) return 0;
      if (next.question) {
        var msg=next.eval?
                replaceText(next.question,next.eval.call(process.agent,self.chatScript.script,index))
                :next.question;
        next.question=msg;
        if (next.cond && !next.cond.call(process.agent,self.chatScript.script,index)) return -1;
        var timeout = next.timeout||30000;
        chatQuestion(self.chatScript.id,
                    next.question,
                    next.choices||{value:next.value},
                    function (res) {
                      if (next.callback)
                        process.callback(next.callback,res?[res.value]:null);
                      process.wakeup();
                    },
                    timeout
        );
        process.suspend(Aios.timeout(timeout));
      } else if (next.message) {
        var msg=next.eval?
                replaceText(next.message,next.eval.call(process.agent,self.chatScript.script,index))
                :next.message;
        next.message=msg;
        chatMessage(self.chatScript.id,
                    next.message)     
      } 
      else if (next.process) next.process(self.chatScript.script);
      else if (next.init) next.init.call(process.agent,self.chatScript.script);
      else if (next.finalize) next.finalize(self.chatScript.script);
      return 1;
    },
    reset : function () {
      self.chatScript.index=0;
    },
  }
  
  this.chatInit = function () {
    if (!self.chatWin.botui) {
      self.chatWin.nextChatHistory=[];
      self.chatWin.botui = new BotUI('chat-bot',{callback:function (msg) {
          // Record message history for page refresh
          if (msg.content) {
            if (msg.human) self.chatWin.nextChatHistory.push({kind:"answer", delay:0, content:msg.content});
            else self.chatWin.nextChatHistory.push({kind:"message", delay:0, content:msg.content});
          }
        }}); 
      chatMessage('Simulator','Ready.');
      chatRefresh();        
    }
  }
  this.chatAgent = function (action) {
    if (!self.chatWin.agent) {
      if (action.load)
        return clippy.load(action.load, function (agent) {
                  self.chatWin.agent=agent;
             });
      else return;
    }
    for(var p in action) {
      switch (p) {
        case 'play' :   self.chatWin.agent.play(action[p]); break;
        case 'speak':   self.chatWin.agent.speak(action[p]); break;
        case 'hide':    self.chatWin.agent.stop(); self.chatWin.agent.hide(); break;
        case 'moveTo':  self.chatWin.agent.moveTo(action[p].x,action[p].y,action[p].time); break;
        case 'load':    self.chatWin.agent.show(true); break;
        case 'show':    self.chatWin.agent.show(action[p]); break;
        case 'stop':    self.chatWin.agent.stop(); break;
        case 'stopCurrent': self.chatWin.agent.stopCurrent(); break;
      }
    }
  }
  //////////////////////////////////////////////////////////////
  
  
  this.autoLayout();
  this.lockLayout();
  // window.update_timeout = null;
  this.nwgui.Window.get().on('resize',function(x,y){
    var width = window.width;
    var height = window.height;
    /*
    if(typeof(window.update_timeout) !== null){
        clearTimeout(window.update_timeout);
    }
    window.update_timeout = setTimeout(function(){
        // Do your required stuff here
    },125);
    */
    self.unlockLayout();
    self.autoLayout();
    self.lockLayout();     
  });
}

module.exports = {
  gui:gui
}
