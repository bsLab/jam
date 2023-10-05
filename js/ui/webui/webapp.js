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
 **    $INITIAL:     (C) 2006-2022 bLAB
 **    $CREATED:     1-1-19 by sbosse.
 **    $VERSION:     1.8.1
 **    $RCS:         $Id:$
 **    $INFO:
 **
 ** Main Application JAM LAB WEBUI
 **
 **    $ENDOFINFO
 */

var version = "1.8.2"
console.log(version)
var UI= $$;
var logtext= '';
var treemap=[];
var sourcetext='';
var printloc=false;

var shell=[];
var shellWin=[];
var infoShellWin=[];
var configShellWin=[];
var shellNum=1;
var monitorWin=[];
var monitorNum=1;
var monitor=[]
var reporterWin=[];
var reporterNum=1;
var editor=[];
var editorWin=[];
var editorNum=1;
var configEditorWin=[];
var netNodes=[]
var state=0;
var cookieConfig = 'jam.webui.config';
var help={md:{}};
var Marked;

if (typeof jamConfig == 'undefined') info ('No custom configuration file config.js loaded.') 
else info ('Custom configuration file config.js loaded.');

/** Main Options **/

// Optional App configuration loaded from file (config.js)
if (typeof jamConfig == 'undefined') jamConfig = {
  name : '?',
  link1:{ip:"ag-0.de",  ipport:10001, proto:'http', secure:'', enable:true, shells:[1]},
  link2:{ip:"localhost",ipport:10001, proto:'http', secure:'', enable:false, shells:[1]},
  link3:{ip:"",ipport:0, proto:'http', secure:'', enable:false, shells:[1]},
  link4:{ip:"",ipport:0, proto:'http', secure:'', enable:false, shells:[1]},
  log:{agent:true,parent:false,time:false,Time:true,class:false},  // Message flags: agent parent time class
  fontsize: 14,
  group:'jamweb',
  user:'user',
  workdir : '/',
  webclipTime:300,
  webclipUrl:'edu-9.de:9176',
}
jamConfig.version=version;

// load config from cookie
function loadConfig() {
  var data = typeof localStorage=='undefined'?Utils.getCookie(cookieConfig):localStorage.getItem(cookieConfig);
  if (!data) data=Utils.getCookie(cookieConfig);
  if (data) {
    console.log('Loaded jamConfig from cookie '+cookieConfig);
    var obj = JSON.parse(data);
    delete obj.version;
    Object.assign(jamConfig,obj);
    /*
    jamConfig.link1=obj.link1;
    jamConfig.link2=obj.link2;
    jamConfig.link3=obj.link3;
    jamConfig.link4=obj.link4;
    jamConfig.log=obj.log;
    jamConfig.version=version;
    */
  }
}
function saveConfig() {
  var obj = {}
  /*
    link1:jamConfig.link1,
    link2:jamConfig.link2,
    link3:jamConfig.link3,
    link4:jamConfig.link4,
    log:jamConfig.log,
  }
  */
  Object.assign(obj,jamConfig);
  console.log('Saving jamConfig in cookie '+cookieConfig);
  var data = JSON.stringify(obj);
  setCookie(cookieConfig,obj,2)
  if (typeof localStorage!='undefined') localStorage.setItem(cookieConfig, data);
}
function updateConfig(shell) {
  shell.config({log:jamConfig.log});
}

// get config updates from URL params
function urlConfig() {
  var params = parseUrl(document.URL);
  console.log(document.URL,params);
  if (params && (params.link||params.link1)) {
      var tokens=(params.link||params.link1).split(':');
      if (tokens.length==2) {
        jamConfig.link1.ip=tokens[0];
        jamConfig.link1.ipport=Number(tokens[1]);
        jamConfig.link1.enable=true;
      }
  } 
  if (params && params.link2) {
      var tokens=params.link2.split(':');
      if (tokens.length==2) {
        jamConfig.link2.ip=tokens[0];
        jamConfig.link2.ipport=Number(tokens[1]);
        jamConfig.link2.enable=true;
      }
  } 
  if (params && (params.secure||params.secure1)) {
    jamConfig.link1.secure=(params.secure||params.secure1);
  }
  if (params && params.secure2) {
    jamConfig.link2.secure=params.secure2;
  }
  if (params.proto) {
    jamConfig.link1.proto=params.proto;
    jamConfig.link2.proto=params.proto;
    jamConfig.link3.proto=params.proto;
    jamConfig.link4.proto=params.proto;
  }
}
loadConfig();
urlConfig();

var classTemplate = "function ac (options) {\n  this.x=null;\n  this.act = {\n    a1: () => {log('Start')},\n    a2: () => {log('End');kill()}  }\n  this.trans = {\n    a1:a2\n  }\n  this.on = {\n    signal : function () {}\n  }\n  this.next = a1\n} "


// Info and error message toasts ...
function info (text) {
  webix.message({text:text,type:'Info'})
}

function error (text) {
  webix.message({text:text,type:'error'})
}

function clear (widget) {
  var view = UI(widget);
  var log = UI(widget+'LogText');
  var scroll = view.getBody();
  logtext = '';
  log.removeView(widget+'LogTextView');
  log.addView({template:'<pre>'+logtext+'</pre>', autoheight:true, borderless:true, id:widget+'LogTextView'});
  scroll.scrollTo(0,1000000)
  view.show();    
}

function deltree() {
  var root,tree = this.UI('navTree');
  if (tree._roots) {
    for (var p in tree._roots) {
      p=tree._roots[p];
      tree.remove(p);
    } 
  } else tree.remove('root');
  root={ id:"root", open:true, value:'Nodes @'+SHELL.Io.Time() }
  tree.add(root);
}

function maketree() {
  var i=0,tree = this.UI('navTree');
  for(var p in netNodes) {
    tree.add({id:p,value:netNodes[p]+' '+p},i,'root');
    i++;
  }
}


// Update node information view in shell window
async function updateInfo(shellcmd, shellnum) {
  var node = await shellcmd.info('node').id,
      stats = await shellcmd.stats('node');
  function makeTree(element,root) {
    var i=0;
    var rows=[];
    if (element == undefined) 
      return { id:root+'-'+i, value:'null' }
    else if (typeof element == 'number' ||
        typeof element == 'string' ||
        typeof element == 'boolean')
      return { id:root+'-'+i, value:String(element) }
    else if (typeof element == 'function')
      return { id:root+'-'+i, value:'function' }   
    else if (typeof element == 'object') {
      for(var p in element) {
        if (p=='self') continue;
        var tree=makeTree(element[p],root+'-'+i);
        if (!tree) continue;
        if (tree && tree.length)
          rows.push({ id:root+'-'+i, open:false, value:p, data : tree});
        else {
          tree.value=p+'='+tree.value;
          rows.push(tree);
        }
        i++;
      }
      return rows
    }
  }
  var rows = [
    { view:'label', label:'<b>Node '+node+'</b>', height:18}
  ]
  var agents = await shellcmd.stats('agent');
  var i = 1, height=50;
  var treeAgents = [];
  function click(o) { console.log(o) }
  for(var p in agents) {
    var info='agent.'+p+' pid='+agents[p].pid+' class='+agents[p].class+' state='+agents[p].state;
    var agent = await shellcmd.info('agent-data',p);
    treeAgents.push({ id:info, open:false, value:p, data : [
       { id:info+'-'+0, value:'class='+agents[p].class },
       { id:info+'-'+1, value:'pid='+agents[p].pid },
       { id:info+'-'+2, value:'gid='+agents[p].gid },
       { id:info+'-'+3, value:'parent='+agents[p].parent },
       { id:info+'-'+4, value:'state='+agents[p].state },
       { id:info+'-'+5, value:'next='+agents[p].next },
       { id:info+'-'+6, value:'time='+agents[p].resources.consumed },
       { id:info+'-'+7, open:false, value:'agent', data : makeTree(agent,info+'-'+7)},
    ]});
    i++;
  }
  height=50+i*25;
  var tree1 = {
    view:"tree",
    id:'treeAgentsNode'+shellnum,
    select:true,
    tooltip:true,
    height:'auto',
    data: [
        {id:"root", value:"Agents", open:true, data:treeAgents}
    ],
    on:{
      // the default click behavior that is true for any datatable cell
      "onItemClick":function(id, e, trg){ 
         if (id.indexOf('agent.')==0) {
          
         }
      }
    }, 
  }
  rows.push(tree1)
  for (var p in stats) rows.push({ view:"text", label:p, readonly:true, type:'text', value:stats[p].toString()})
  return rows;  
}

// Update window pull-down menus
function updateMenu() {
  var i,items=[];
  UI('menuShells').clearAll();
  for(i in shellWin) items.push((i)+' : '+shellWin[i]._options.name);
  UI('menuShells').add({value:"Shells", submenu:items});
  items=[];
  for(i in editorWin) items.push((i)+' : '+editorWin[i]._options.file);
  UI('menuEditors').clearAll();
  UI('menuEditors').add({value:"Editors", submenu:items});  
  items=[];
  for(i in monitorWin) items.push((i)+' : '+monitorWin[i]._options.name);
  UI('menuMonitors').clearAll();
  UI('menuMonitors').add({value:"Monitors", submenu:items});  
}

// Update conenction tree
async function updateConn(cmd,name) {
  var links = await cmd.connected(DIR.IP('%')),
      ips   = await cmd.connected(DIR.IP('*'));
  // netNodes={};
  for(var i in netNodes) {
    if (i.indexOf(name)==0) delete netNodes[i];
  }
  for(var i in links) netNodes[name+':'+links[i]]=ips[i]; 
  deltree();
  maketree();  
}

function removeConn(name) {
  for(var i in netNodes) {
    if (i.indexOf(name)==0) delete netNodes[i];
  }
  deltree();
  maketree();  
}
function autoLayout() {
  var x=0,
      y=50;
  for(i in shellWin) {
    var shell=shellWin[i];
    if (!shell) continue;
    var size=shell.collapse(true);
    x=$('body').width()-size.width;
    shell.window.setPosition(x,y);
    y+=(size.height+1);
  }
  for(i in editorWin) {
    var shell=editorWin[i];
    if (!shell) continue;
    var size=shell.collapse(true);
    x=$('body').width()-size.width;
    shell.window.setPosition(x,y);
    y+=(size.height+1);
  }
  for(i in monitorWin) {
    var shell=monitorWin[i];
    if (!shell) continue;
    var size=shell.collapse(true);
    x=$('body').width()-size.width;
    shell.window.setPosition(x,y);
    y+=(size.height+1);
  }
}

/************ NETWORK ***************/
Network = {
  state:0,
  start:  async function () { 
    if (Network.state<2) {
      var proto=jamConfig.link1.proto||'http';
      for(var i in shell) {
        if (shell[i] && shell[i].options.shell && !shell[i].port) 
          shell[i].port=await shell[i].options.cmd.port(DIR.IP(),{proto:proto,verbose:shell[i].options.log.Network});
      }
      Network.state=1;
    }
    for(var i in shell) {
      if (!shell[i] || !shell[i].options.shell) continue;
      if (jamConfig.link1.enable && jamConfig.link1.ipport) 
        shell[i].options.cmd.connect(DIR.IP(jamConfig.link1.proto+'://'+jamConfig.link1.ip+':'+
                                                  jamConfig.link1.ipport+
                                                  (jamConfig.link1.secure!=''?'?secure='+jamConfig.link1.secure:'')));
      if (jamConfig.link2.enable && jamConfig.link2.ipport) 
        shell[i].options.cmd.connect(DIR.IP(jamConfig.link2.proto+'://'+jamConfig.link2.ip+':'+
                                                  jamConfig.link2.ipport+
                                                  (jamConfig.link2.secure!=''?'?secure='+jamConfig.link2.secure:'')));
      if (jamConfig.link3.enable && jamConfig.link3.ipport) 
        shell[i].options.cmd.connect(DIR.IP(jamConfig.link3.proto+'://'+jamConfig.link3.ip+':'+
                                                  jamConfig.link3.ipport+
                                                  (jamConfig.link3.secure!=''?'?secure='+jamConfig.link3.secure:'')));
      if (jamConfig.link4.enable && jamConfig.link4.ipport) 
        shell[i].options.cmd.connect(DIR.IP(jamConfig.link4.proto+'://'+jamConfig.link4.ip+':'+
                                                  jamConfig.link4.ipport+
                                                  (jamConfig.link4.secure!=''?'?secure='+jamConfig.link4.secure:'')));
    }
    Network.state=2; 
  },
  stop:   function () { 
    for(var i in shell) {
      if (!shell[i] || !shell[i].options.shell) continue;
      // disconnect w/o proto!!
      if (jamConfig.link1.enable) 
        shell[i].options.cmd.disconnect(DIR.IP(jamConfig.link1.ip+':'+
                                                     jamConfig.link1.ipport));
      if (jamConfig.link2.enable) 
        shell[i].options.cmd.disconnect(DIR.IP(jamConfig.link2.ip+':'+
                                                     jamConfig.link2.ipport));
      if (jamConfig.link3.enable) 
        shell[i].options.cmd.disconnect(DIR.IP(jamConfig.link3.ip+':'+
                                                     jamConfig.link3.ipport));
      if (jamConfig.link4.enable) 
        shell[i].options.cmd.disconnect(DIR.IP(jamConfig.link4.ip+':'+
                                                     jamConfig.link4.ipport));
    }
    Network.state=1;
  },
  update : function (options,num) {
    if (shell[num].port) shell[num].port.amp.config(options);  
  }
}
jam = {
  state:0,
  start:  function () { 
    for(var i in shell) {
      if (shell[i] && shell[i].options.shell) shell[i].options.shell.env.start();
    }
    jam.state=1; 
  },
  stop:   function () { 
    for(var i in shell) {
      if (shell[i] && shell[i].options.shell) shell[i].options.shell.env.stop();
    }
    jam.state=0;
  }

}





/************ TOP TOOLBAR ********/

toolbar = this.webix.ui({
        view:"toolbar",
        id:"myToolbar",
    	left:0, top:0, width:'100%',
        cols:[
         { view:"button", type:"icon", icon:"play", id:'button.jam.start', tooltip:'Start', width:30, click:function () {
          if (jam.state==0) {
            UI('button.jam.start').disable();
            UI('button.jam.stop').enable();
            jam.start();
          }
         }},
         { view:"button", type:"icon", icon:"stop", id:'button.jam.stop', tooltip:'Stop', width:30, click:function () {
            UI('button.jam.start').enable();
            UI('button.jam.stop').disable();
            jam.stop();
         }},
         { view:"button", type:"icon", icon:"chain", id:'button.net.start', tooltip:'Connect', width:30, click:function () {
          if (Network.state<2) {
            UI('button.net.start').disable();
            UI('button.net.stop').enable();
            Network.start();
          }
         }},
         { view:"button", type:"icon", icon:"chain-broken", id:'button.net.stop', tooltip:'Disconnect', width:30, click:function () {
            UI('button.net.start').enable();
            UI('button.net.stop').disable();
            Network.stop();
         }},
         { view:"button", type:"icon", icon:"navicon", tooltip:'Configuration', width:30, click:function () {
           mainConfigWin.show();
         }},
         { view:"button", type:"icon", icon:"plus", tooltip:'New Shell Worker', width:30, click:function () {
            createShell(shellNum,{worker:true});
            shellNum++;
         }},
         { view:"button", type:"icon", icon:"sort-amount-asc", tooltip:'Bigger Fonts', width:30, click:function () {
           jamConfig.fontsize++;
           changeCSS('.input','font-size',jamConfig.fontsize+'px')
           changeCSS('.normalInput','font-size',jamConfig.fontsize+'px')
           changeCSS('.normalOutput','font-size',jamConfig.fontsize+'px')
           changeCSS('.error','font-size',jamConfig.fontsize+'px')
           changeCSS('.webix_view','font-size',jamConfig.fontsize+'px')
         }},
         { view:"button", type:"icon", icon:"sort-amount-desc", tooltip:'Smaller Fonts', width:30, click:function () {
           jamConfig.fontsize--;
           changeCSS('.input','font-size',jamConfig.fontsize+'px')
           changeCSS('.normalInput','font-size',jamConfig.fontsize+'px')
           changeCSS('.normalOutput','font-size',jamConfig.fontsize+'px')
           changeCSS('.error','font-size',jamConfig.fontsize+'px')
           changeCSS('.webix_view','font-size',jamConfig.fontsize+'px')
         }},
         { view:"button", type:"icon", icon:"user-plus", tooltip:'Chat Dialog', width:30, click:function () {
            if (chatWin.isVisible())
              chatWin.hide();
            else {
              chatWin.show();
              chatInit();
            }
         }},
         { view:"button", type:"icon", icon:"hand-o-right", tooltip:'Visual Pointer', width:30, click:function () {
            var el = document.getElementsByTagName("body")[0];
            self._cursorToggle=!self._cursorToggle;
            if (self._cursorToggle)
             el.style.cursor = "url(redpointer.png), auto";
            else
             el.style.cursor = "auto";
            ['webix_view'].forEach(function (id) {
              var ell = document.getElementsByClassName(id);
              if (!ell) return;
              ell.forEach(function (el) {
                if (self._cursorToggle)
                  el.style.cursor = "url(redpointer.png), auto";
                else
                  el.style.cursor = "auto";
              });
            })
         }},
         { view:"button", type:"icon", icon:"question", tooltip:'Help', width:30, click:function () {
           helpWin.show();
         }},
         { view:"button", type:"icon", icon:"th", tooltip:'Auto Layout', width:30, click:function () {
          autoLayout()
         }},
         { view:"button", type:"icon", icon:"terminal", tooltip:'New Developer Console', width:30, click:function () {
          var shell = Shell.default({
            label:'Developer Console (JS)',
            hide:false,
            editor:true,
          });
          shell.run = function (code) {
            var ___error;
            with ({
              error:shell.env.error,
              keys:Object.keys.bind(Object),
              load:Utils.loadScript,
              print:shell.env.print,
              time:Date.now,
            }) { try { var result = eval(code) } catch (e) { ___error=result=e }};
            if (!code.match(/;[ ]*$/))
              shell.env.print(result);
            else if (___error) shell.env.error(___error);
          }
         }},
         {
             view:"menu",
             id:"menuShells",
             autowidth:true,
             width:100,
             data:[ //menu data
                 { value:"Shells", submenu:["1"] },
             ],
             type:{
                 subsign:true,
             },          
             on:{
                 onMenuItemClick:function(id){
                    var name = this.getMenuItem(id).value.split(':');
                     var win=shellWin[Number(name[0])].window;
                     if (win) win.isVisible()?win.hide():win.show();
                 }
             }
         },
         {
             view:"menu",
             id:"menuEditors",
             autowidth:true,
             width:100,
             data:[ //menu data
                 { value:"Editors", submenu:[] },
             ],
             type:{
                 subsign:true,
             }, 
             on:{
                 onMenuItemClick:function(id){
                    var name = this.getMenuItem(id).value.split(':');
                     var win=editorWin[Number(name[0])].window;
                     if (win) win.isVisible()?win.hide():win.show();
                 }
             }
         },
         {
             view:"menu",
             id:"menuMonitors",
             autowidth:true,
             width:100,
             data:[ //menu data
                 { value:"Monitors", submenu:[] },
             ],
             type:{
                 subsign:true,
             },
             on:{
                 onMenuItemClick:function(id){
                    var name = this.getMenuItem(id).value.split(':');
                     var win=monitorWin[Number(name[0])].window;
                     if (win) win.isVisible()?win.hide():win.show();
                 }
             }
         },
         { view:"label", id:'myTopLabel', label:'JAM Laboratory WEB API (C) Dr. Stefan Bosse Ver. '+jamConfig.version, align:'right'},
         { view:"button", type:"icon", icon:"close", tooltip:'Exit', width:30, click:function () {
         }},
        ]
  });
UI('button.jam.stop').disable();
UI('button.net.stop').disable();
toolbar.show();


/************ MAIN CONFIG ********/
mainConfigWin=webix.ui({
      id:'mainConfigWin',
	  view:"window",
	  width:300,
	  height:450,
	  left:90, top:90,
	  move:true,
	  resize: true,
      toFront:true,
      head: {
          view:"toolbar",
          cols:[
           { view:"label", label:"Main Configuration", align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              jamConfig.link1.ip=UI('mainConfigWinLink1IPAddress').getValue();
              jamConfig.link1.ipport=UI('mainConfigWinLink1IPPort').getValue();
              jamConfig.link1.proto=UI('mainConfigWinLink1IPProto').getValue();
              jamConfig.link1.secure=UI('mainConfigWinLink1SecPort').getValue();
              jamConfig.link2.ip=UI('mainConfigWinLink2IPAddress').getValue();
              jamConfig.link2.ipport=UI('mainConfigWinLink2IPPort').getValue();
              jamConfig.link2.proto=UI('mainConfigWinLink2IPProto').getValue();
              jamConfig.link2.secure=UI('mainConfigWinLink2SecPort').getValue();
              jamConfig.link3.ip=UI('mainConfigWinLink3IPAddress').getValue();
              jamConfig.link3.ipport=UI('mainConfigWinLink3IPPort').getValue();
              jamConfig.link3.proto=UI('mainConfigWinLink3IPProto').getValue();
              jamConfig.link3.secure=UI('mainConfigWinLink3SecPort').getValue();
              jamConfig.link4.ip=UI('mainConfigWinLink4IPAddress').getValue();
              jamConfig.link4.ipport=UI('mainConfigWinLink4IPPort').getValue();
              jamConfig.link4.proto=UI('mainConfigWinLink4IPProto').getValue();
              jamConfig.link4.secure=UI('mainConfigWinLink4SecPort').getValue();
              jamConfig.webclipUrl=UI('mainConfigWinClipUrl').getValue();
              jamConfig.user=UI('mainConfigWinUser').getValue();
              jamConfig.workdir=UI('mainConfigWinWorkdir').getValue();
              saveConfig();
              mainConfigWin.hide();
           }}
          ]
      },
	  body: {
        rows:[
          { view:"form", scroll:true, width:300, height:400, elements: [

            { view:"label", label:"<b>JAM Network Link 1</b>", height:'18px', align:'left'},
            { view:"checkbox", customCheckbox:false, labelRight:"Enable", height:'18px', value:jamConfig.link1.enable?1:0,
              click: function (o) {jamConfig.link1.enable=Number(self.UI(o).getValue())?true:false}}, 
            { view:"text", id:"mainConfigWinLink1IPAddress", label:"IP Address", value:jamConfig.link1.ip},
            { view:"text", id:"mainConfigWinLink1IPPort", label:"IP Port", value:jamConfig.link1.ipport},
            { view:"text", id:"mainConfigWinLink1IPProto", label:"IP Proto", value:jamConfig.link1.proto},
            { view:"text", id:"mainConfigWinLink1SecPort", label:"Secure Port (Opt.)", value:jamConfig.link1.secure},

            { view:"label", label:"<b>JAM Network Link 2</b>", height:'18px', align:'left'},
            { view:"checkbox", customCheckbox:false, labelRight:"Enable", height:'18px', value:jamConfig.link2.enable?1:0,
              click: function (o) {jamConfig.link2.enable=Number(self.UI(o).getValue())?true:false}}, 
            { view:"text", id:"mainConfigWinLink2IPAddress", label:"IP Address", value:jamConfig.link2.ip},
            { view:"text", id:"mainConfigWinLink2IPPort", label:"IP Port", value:jamConfig.link2.ipport},
            { view:"text", id:"mainConfigWinLink2IPProto", label:"IP Proto", value:jamConfig.link2.proto},
            { view:"text", id:"mainConfigWinLink2SecPort", label:"Secure Port (Opt.)", value:jamConfig.link2.secure},

            { view:"label", label:"<b>JAM Network Link 3</b>", height:'18px', align:'left'},
            { view:"checkbox", customCheckbox:false, labelRight:"Enable", height:'18px', value:jamConfig.link3.enable?1:0,
              click: function (o) {jamConfig.link3.enable=Number(self.UI(o).getValue())?true:false}}, 
            { view:"text", id:"mainConfigWinLink3IPAddress", label:"IP Address", value:jamConfig.link3.ip},
            { view:"text", id:"mainConfigWinLink3IPPort", label:"IP Port", value:jamConfig.link3.ipport},
            { view:"text", id:"mainConfigWinLink3IPProto", label:"IP Proto", value:jamConfig.link3.proto},
            { view:"text", id:"mainConfigWinLink3SecPort", label:"Secure Port (Opt.)", value:jamConfig.link3.secure},

            { view:"label", label:"<b>JAM Network Link 4</b>", height:'18px', align:'left'},
            { view:"checkbox", customCheckbox:false, labelRight:"Enable", height:'18px', value:jamConfig.link4.enable?1:0,
              click: function (o) {jamConfig.link4.enable=Number(self.UI(o).getValue())?true:false}}, 
            { view:"text", id:"mainConfigWinLink4IPAddress", label:"IP Address", value:jamConfig.link4.ip},
            { view:"text", id:"mainConfigWinLink4IPPort", label:"IP Port", value:jamConfig.link4.ipport},
            { view:"text", id:"mainConfigWinLink4IPProto", label:"IP Proto", value:jamConfig.link4.proto},
            { view:"text", id:"mainConfigWinLink4SecPort", label:"Secure Port (Opt.)", value:jamConfig.link4.secure},

            { view:"label", label:"<b>WebClipboard</b>", height:'18px', align:'left'},
            { view:"text", id:"mainConfigWinClipUrl", label:"URL", value:jamConfig.webclipUrl},
            { view:"text", id:"mainConfigWinUser", label:"User", value:jamConfig.user},
            { view:"text", id:"mainConfigWinWorkdir", label:"WorkDir", value:jamConfig.workdir},
          ]}
        ]
      }
    });


helpWin=webix.ui({
    id:'helpWin',
	  view:"window",
	  width:500,
	  height:450,
	  left:90, top:90,
	  move:true,
	  resize: true,
      toFront:true,
      css:'gray_toolbar',
      head: {
          view:"toolbar",
          cols:[
           { view:"button", value:'JAMSH',  align:'center', click: function () {
            if (helpWin._view) UI('helpWinScrollView').removeView(helpWin._view);
            var helpRendered=help.md.jamsh?help.md.jamsh:Marked(help.jamsh);
            help.md.jamsh=helpRendered;
            helpWin._view=UI('helpWinScrollView').addView(
                {
                  rows : [
                    {template:'<div class="marked">'+helpRendered+'</div>', autoheight:true}
                  ]
                }
             );
            }  
           },
           { view:"button", value:'AIOS',  align:'center', click: function () {
            if (helpWin._view) UI('helpWinScrollView').removeView(helpWin._view);
            var helpRendered=help.md.aios?help.md.aios:Marked(help.aios);
            help.md.aios=helpRendered;
            helpWin._view=UI('helpWinScrollView').addView(
                {
                  rows : [
                    {template:'<div class="marked">'+helpRendered+'</div>', autoheight:true}
                  ]
                }
             );
            }  
           },
           { view:"button", value:'JS',  align:'center', click: function () {
            if (helpWin._view) UI('helpWinScrollView').removeView(helpWin._view);
            var helpRendered=help.md.js?help.md.js:Marked(help.js);
            help.md.js=helpRendered;
            helpWin._view=UI('helpWinScrollView').addView(
                {
                  rows : [
                    {template:'<div class="marked">'+helpRendered+'</div>', autoheight:true}
                  ]
                }
             );
            }  
           },
           { view:"label", label:"Help", align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              helpWin.hide();
           }}
          ]
      },
	  body:{
        view : 'scrollview',
        scroll : 'y',
        body : {
          id:'helpWinScrollView',
          rows : [
          ]
        }
     }    
    });

/*********** Network Tree **********/
navTree=webix.ui({
    id:'navTree',
	left:50, top:50,
    view:'tree',
    type:'lineTree',
    select:true,
    data: [
        { id:"root", open:true, value:"Not connected!"}
    ]
})
navTree.show();        
navTree.attachEvent("onAfterSelect", function(id){
  webix.message({text:id,type:'Info'});
  if (id!='root') for (var i in configShellWin) {
    if (configShellWin[i] && configShellWin[i].isVisible()) {
      UI('configRemoteHostIp'+i).setValue(id);
    }
  }
});



 
/************ SHELL ********/

// Only one shell (num=1) supported!

function _createShell(num,params) {
  shell[num] = winShell(jamConfig);    // shell[num].options.shell contains the jamsh object
  var options = shell[num].options;
  var cmd;
  
  function Label () {
    return options.name+" / Shell "+num
  }
  
  shellWin[num]=webix.ui({
      id:'ShellWin'+num,
	  view:"window",
	  height:350,
	  width:600,
	  left:250, top:250,
	  move:true,
	  resize: true,
      toFront:true,
      css:'red_toolbar',
      head: {
          view:"toolbar",
          cols:[
           { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
             shell[num].commands.clear()
           }},
           { view:"button", type:"icon", icon:"navicon", tooltip:'Config', width:30, click:function () {
             configShellWin[num].show();
           }},
           { view:"button", type:"icon", icon:"edit", tooltip:'New Agent Editor', width:30, click:function () {
              createEditor(editorNum,{shell:num,name:options.name});
              editorNum++;
           }},
           { view:"button", type:"icon", icon:"envelope", tooltip:'Agent Monitor', width:30, click:function () {
            if (!monitor[num]) {
              createMonitor(num,{shell:shell[num].options.shell})
            } else monitorWin[num].show();
           }},
           { view:"button", type:"icon", icon:"info", tooltip:'Node Information', width:30, click:function () {
              UI('infoShellWinLabel'+num).setValue("Info / "+Label());
              if (options.infoView) UI('infoShellWinScrollView'+num).removeView(options.infoView);
              options.infoView=UI('infoShellWinScrollView'+num).addView(
                {
                  rows : updateInfo(cmd,num)
                }
              );
              infoShellWin[num].show();
           }},
           { view:"button", type:"icon", icon:"dot-circle-o", tooltip:'Scroll Auto', id:'ShellWinLogFilmBut'+num, width:30, click:function () {
             UI('ShellWinLog'+num).scrollAuto=!UI('ShellWinLog'+num).scrollAuto;
             if (UI('ShellWinLog'+num).scrollAuto) UI('ShellWinLogFilmBut'+num).define('icon','arrow-circle-down')
             else UI('ShellWinLogFilmBut'+num).define('icon','dot-circle-o');
             UI('ShellWinLogFilmBut'+num).refresh();
           }},
           { view:"label", label:"Shell "+num, id:'ShellWinLabel'+num, align:'right'},
           { view:"button", type:"icon", icon:"gear", tooltip:'New Script Editor', width:30, click:function () {
              createEditor(editorNum,{shell:num,name:options.name,script:true});
              editorNum++;
           }},
           { view:"button", type:"icon", icon:"close", tooltip:'Close Shell', width:30, click:function () {
            var self=shellWin[num];
            self.hide();
           }},
          ]
      },
	  body:{
          id : 'ShellWinLog'+num,
          view : 'scrollview',
          scroll : 'y',
          body : {
             id:'ShellWinLogText'+num,
             rows : [
                {template:('<div id="ShellWinOutput'+num+'" '+
                           'spellcheck="false" style="">'), height:"auto", borderless:true},
                {template:('<div><textarea id="ShellWinInput'+num+'" '+
                           'class="input" spellcheck="false" wrap="on" onkeydown="shell['+num+
                           '].inputKeydown(event)" rows="1" style="width:98%"></textarea></div>'), height:"auto", borderless:true},
              ]
          }
	  }
  });
  shellWin[num].show();
  
  /************** SHELL CONFIG ****************/
  configShellWin[num]=webix.ui({
      id:'configShellWin'+num,
	  view:"window",
	  width:300,
	  height:450,
	  left:90, top:90,
	  move:true,
	  resize: true,
      toFront:true,
      css:'gray_toolbar',
      head: {
          view:"toolbar",
          id:"configShellWinToolbarWin"+num,
          cols:[
           { view:"label", label:"Configuration", align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              configShellWin[num].hide();
              updateConfig(cmd);
              saveConfig();
           }}
          ]
      },
	  body: {
        rows:[
          { view:"form", scroll:true, width:300, height:400, elements: [
            { view:'label', label:'<b>Agent Logging</b>', height:0},
            { view:"checkbox", customCheckbox:false, labelRight:"agent", height:'18px', value:jamConfig.log.agent?1:0,
              click: function (o) {jamConfig.log.agent=Number(self.UI(o).getValue())?true:false;}}, 
            { view:"checkbox", customCheckbox:false, labelRight:"class", height:'18px', value:jamConfig.log.class?1:0,
              click: function (o) {jamConfig.log.class=Number(self.UI(o).getValue())?true:false;}}, 
            { view:"checkbox", customCheckbox:false, labelRight:"parent", height:'18px', value:jamConfig.log.parent?1:0,
              click: function (o) {jamConfig.log.parent=Number(self.UI(o).getValue())?true:false;}}, 
            { view:"checkbox", customCheckbox:false, labelRight:"time", height:'18px', value:jamConfig.log.time?1:0,
              click: function (o) {jamConfig.log.time=Number(self.UI(o).getValue())?true:false; }}, 
            { view:"checkbox", customCheckbox:false, labelRight:"Time", height:'18px', value:jamConfig.log.Time?1:0,
              click: function (o) {jamConfig.log.Time=Number(self.UI(o).getValue())?true:false;}}, 

            { view:'label', label:'<b>Shell Logging</b>', height:0},
            { view:"checkbox", customCheckbox:false, labelRight:"Time", height:'18px', value:options.log.Time?1:0,
              click: function (o) {options.log.Time=Number(self.UI(o).getValue())?true:false;}}, 
            { view:"checkbox", customCheckbox:false, labelRight:"Network", height:'18px', value:options.log.Network?1:0,
              click: function (o) {options.log.Network=Number(self.UI(o).getValue())?true:false;
                                   Network.update({verbose:options.log.Network?1:0},num)}}, 
          ]}
        ]
      }
    });

  /************** SHELL INFO ****************/
  infoShellWin[num]=webix.ui({
      id:'infoShellWin'+num,
	  view:"window",
	  height:350,
	  width:500,
	  left:90, top:90,
	  move:true,
	  resize: true,
      toFront:true,
      css:'gray_toolbar',
      head: {
          view:"toolbar",
          id:"infoShellWinToolbarWin"+num,
          cols:[
           { view:"button", type:"icon", icon:"repeat", tooltip:'Refresh', width:30, click:function () {
              if (options.infoView) UI('infoShellWinScrollView'+num).removeView(options.infoView);
              options.infoView=UI('infoShellWinScrollView'+num).addView(
                {
                  rows : updateInfo(cmd,num)
                }
              );
           }},
           { view:"button", type:"icon", icon:"times-circle", tooltip:'Kill Agent', width:30, click:function () {
              var tree = UI('treeAgentsNode'+options.name);
              var selectedId = tree.getSelectedId();
              if (selectedId.indexOf('agent.')==0) {
                var agentid = selectedId.substring(selectedId.indexOf('.')+1,selectedId.indexOf(' '));
                cmd.kill(agentid);
              }
              if (options.infoView) UI('infoShellWinScrollView'+num).removeView(options.infoView);
              options.infoView=UI('infoShellWinScrollView'+num).addView(
                {
                  rows : updateInfo(cmd,num)
                }
              );
           }},
           { view:"label", label:"Info / "+Label(), id:'infoShellWinLabel'+num, align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              infoShellWin[num].hide();
           }}
          ]
      },
	  body:{
        view : 'form',
        scroll : 'y',
        height: 300,
        id:'infoShellWinScrollView'+num,
        rows : [
          ]
     }    
    });
  shell[num].init("ShellWinInput"+num,"ShellWinOutput"+num,UI('ShellWinLog'+num));
  UI('ShellWinLog'+num).scrollAuto=false;
  jamConfig.name = options.name;
  cmd = options.cmd;
  shell[num].run=cmd;
  Marked = options.cmd.marked;
  cmd.on('link+',function (arg){
    updateConn(cmd,options.name);
  });
  cmd.on('link-',function (arg){
    updateConn(cmd,options.name);
  });
  
  shellWin[num].attachEvent("onViewMove", function(pos, e){
  });
  shellWin[num].attachEvent("onViewMoveEnd", function(pos, e){
  });
  UI('ShellWinLabel'+num).setValue(Label());
  updateMenu();
  var versions = cmd.versions();
  shell[num].print('JAMlib Version '+versions.lib+' JAMShell Version '+versions.shell+' JAMAios Version '+versions.aios);
}




// New shell widget (includes monitor, config, info, and editor widgets, too)
function createShell(num,params) {
  var shellControl;
  var config = {
    log : Object.assign({},jamConfig.log),
    verbose : jamConfig.verbose||0,
  };
  Object.assign(config,params); 
  shellControl = shell[num] = Node(config);    // shell[num].options.shell contains the jamsh object
  var options = shell[num].options;
  var cmd;
  function Label () {
    return options.name+' / Shell '+num
  }
  var shellWidget = UI.Shell.default({
    buttons:{
      'config:bars:Configuration' : function () {
        UI.Form.create({
          'Shell Logging':options.log,
          'JAM Logging':config.log,
        },{}, function (_config) {
          Object.assign(config.log,_config['JAM Logging']);
          Object.assign(options.log,_config['Shell Logging']);
          shellWidget.setLabel(Label())
          shellControl.setup(config);
          cmd.config({log:config.log});
        })
      },
      'edit:edit:New Agent Editor' : function () {
        var optionsE = {
          shell:num,
          level:1,
          arguments:'{}',
          file:'agent.js',
        }
        var numed = editorNum++;
        function Label() {
          return optionsE.file+(optionsE.acname? ' ('+optionsE.acname+')':'')+' / '+options.name+' AgE'+numed+':S'+optionsE.shell
        }
        var editorWidget = UI.Editor.default({
          label:Label(),
          mode:'js',
          //x:options.x,
          //y:options.y,
          // hide:false,
          buttons : {
            'config:bars:Configure' : function (label,ev) {
                /********** EDITOR CONFIG ****************/
                if (!configEditorWin[numed]) {
                  configEditorWin[numed]=webix.ui({
                    id:'configEditorWin'+numed,
	                  view:"window",
	                  width:300,
	                  height:450,
	                  left:ev.clientX-50, top:ev.clientY,
	                  move:true,
	                  resize: true,
                      toFront:true,
                      css:'gray_toolbar',
                      head: {
                          view:"toolbar",
                          cols:[
                           { view:"label", label:"Runtime Configuration", align:'right'},
                           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
                              optionsE.arguments = UI('configEditorAgentArgs'+numed).getValue();
                              optionsE.level = Number(UI('configEditorAgentLevel'+numed).getValue())||0;
                              optionsE.file=UI('configEditorFileName'+numed).getValue();
                              editorWidget.setLabel(Label());
                              configEditorWin[numed].hide();
                              updateMenu();
                           }}
                          ]
                      },
	                  body: {
                        rows:[
                          { view:"form", scroll:true, width:300, height:400, elements: [
                            { view:"label", label:"<b>Agent Creation</b>", height:'18px', align:'left'},
                            { view:"textarea", id:"configEditorAgentArgs"+numed, label:"Argument",  height:150, value:optionsE.arguments},
                            { view:"text", id:"configEditorAgentLevel"+numed, label:"Level",    value:optionsE.level},
                            { view:"label", label:"<b>Code</b>", height:'18px', align:'left'},
                            { view:"text", id:"configEditorFileName"+numed, label:"File Name", value:optionsE.file},
                          ]}
                        ]
                      }
                    });
                }
                configEditorWin[numed].show();
            },
            'compile:indent:Compile Code' : async function () {
              var code = editorWidget.editor.get();
              var acname = await options.shell.env.compile(code);
              if (acname) optionsE.acname=acname;
              editorWidget.setLabel(Label());
              optionsE.compiled=true;
              updateMenu();
            },
            'compile:play:Start Agent' : async function () {
              var code = editorWidget.editor.get();
              if (!optionsE.compiled) {
                var acname = options.shell.env.compile(code);
                if (acname) optionsE.acname=acname;
                editorWidget.setLabel(Label());
                updateMenu();
              }
              var ac=optionsE.acname||optionsE.file.replace(/\.js$/,''),args; 
              if (optionsE.arguments!="") eval('args='+optionsE.arguments);
              else args={};
              var id=await options.shell.env.create(ac,args,optionsE.level);
              if (id) {
                info('Agent '+id+' of class '+ac+' started.');
                shellControl.commands.print('[JLB] Agent '+id+' of class '+ac+' started.'); 
              } else {
                error('Starting agent of class '+ac+' failed.');
                shellControl.commands.error('[JLB] Error: Starting agent of class '+ac+' failed.');             
              }
              
            },
            
          }
        })
        editorWin[numed]=editorWidget;
        editorWin[numed]._options=optionsE;
        editorWidget.on('file',function (filename) {
          optionsE.file=filename;
          editorWidget.setLabel(Label())
          updateMenu();
        })
        editorWidget.on('close',function () {
          delete editorWin[numed];
          updateMenu();  
        })
        editorWin[numed].editor.set(classTemplate);
        updateMenu();  
      },
      'monitor:envelope:Agent Monitor' : function () {
        if (!monitorWin[num]) {
          // createMonitor(num,{shell:shell[num].options.shell})
          // TODO
          monitorWidget=UI.Monitor.default({
            label:options.name+' / Monitor S'+num,
            close:false,
            run : function (line) {
              shellControl.question(line);
            }
          })
          monitorWin[num]=monitorWidget;
          monitorWin[num]._options=options;
          options.shell.options.outputAgent = function (line) { monitorWidget.env.print(line) };
          updateMenu();
        } else monitorWin[num].window.show();
      },
      'info:info:Node Information' : async function () {
        UI('infoShellWinLabel'+num).setValue("Info / "+Label());
        if (options.infoView) UI('infoShellWinScrollView'+num).removeView(options.infoView);
        options.infoView=UI('infoShellWinScrollView'+num).addView(
          {
            rows : await updateInfo(cmd,num)
          }
        );
        infoShellWin[num].show();
      },
      'script:gear:New Script Editor': function () {
        var optionsSE = {
          shell:num,
          file:'script.js',
        }
        var numed = editorNum++;
        function Label() {
          return optionsSE.file+' / '+options.name+' ScE'+numed+':S'+optionsSE.shell
        }
        var editorWidget = UI.Editor.default({
          label:Label(),
          mode:'js',
          buttons : {
            'compile:play:Start Agent' : function () {
              var code = editorWidget.editor.get();
              shellControl.options.cmd.exec(code);
            }
          }
        })
        editorWin[numed]=editorWidget;
        editorWin[numed]._options=optionsSE;
        editorWidget.on('file',function (filename) {
          optionsSE.file=filename;
          editorWidget.setLabel(Label())
          updateMenu();
        })
        editorWidget.on('close',function () {
          delete editorWin[numed];
          updateMenu();  
        })
        updateMenu();        
      }
    },
    run : function (line,env) {
      shellControl.question(line);
    },
    label : Label(),
    close : num>1,
  })
  shellControl.init(shellWidget, async function () {
    shellWin[num]=shellWidget;
    shellWin[num]._options=options;
    shellWidget.on('close', function () {
      shellControl.stop()
    })
    // config.name = options.name;
    cmd = options.cmd;
    shell[num].run=cmd;
    cmd.on('link+',function (arg){
      updateConn(cmd,options.name);
    });
    cmd.on('link-',function (arg){
      updateConn(cmd,options.name);
    });
    if (num==1) Marked = cmd.marked;
    updateMenu();  
    var versions = await cmd.versions();
    shellControl.commands.print('JAMlib Version '+versions.lib+' JAMShell Version '+versions.shell+' JAMAios Version '+versions.aios);
    shellWidget.setLabel(Label());  
  });
  if (num>1) {
    shellWidget.on('close',function () {
      removeConn(options.name);
      shellControl.stop();
      delete shell[num];
      delete shellWin[num];
    })
  }

  /************** SHELL INFO MANAGER ****************/
  infoShellWin[num]=webix.ui({
    id:'infoShellWin'+num,
	  view:"window",
	  height:350,
	  width:500,
	  left:90, top:90,
	  move:true,
	  resize: true,
      toFront:true,
      css:'gray_toolbar',
      head: {
          view:"toolbar",
          id:"infoShellWinToolbarWin"+num,
          cols:[
           { view:"button", type:"icon", icon:"repeat", tooltip:'Refresh', width:30, click:async function () {
              if (options.infoView) UI('infoShellWinScrollView'+num).removeView(options.infoView);
              options.infoView=UI('infoShellWinScrollView'+num).addView(
                {
                  rows : await updateInfo(cmd,num)
                }
              );
           }},
           { view:"button", type:"icon", icon:"times-circle", tooltip:'Kill Agent', width:30, click:async function () {
              var tree = UI('treeAgentsNode'+num);
              var selectedId = tree.getSelectedId();
              if (selectedId.indexOf('agent.')==0) {
                var agentid = selectedId.substring(selectedId.indexOf('.')+1,selectedId.indexOf(' '));
                await cmd.kill(agentid);
              }
              if (options.infoView) UI('infoShellWinScrollView'+num).removeView(options.infoView);
              options.infoView=UI('infoShellWinScrollView'+num).addView(
                {
                  rows : await updateInfo(cmd,num)
                }
              );
           }},
           { view:"label", label:"Info / "+Label(), id:'infoShellWinLabel'+num, align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              infoShellWin[num].hide();
           }}
          ]
      },
	  body:{
        view : 'form',
        scroll : 'y',
        height: 300,
        id:'infoShellWinScrollView'+num,
        rows : [
          ]
     }    
    });

}
createShell(shellNum,{});
shellNum++;




/************ EDITOR *****************/
   
function createEditor(num,opts) {
  var options = {
    arguments : "{}",
    level:2,
    compiled:false,
    file:'untitled',
    shell:opts.shell,  // number
    script:opts.script,
    name : opts.name
  }
  function Label() {
    if (options.script)
      return options.file+' / script / Shell '+options.shell+' / Editor '+num
    else
      return options.file+' / '+options.name+" / Shell "+options.shell+" / Editor "+num
  }
  var head = {
          view:"toolbar",
          cols:[
           { view:"button", type:"icon", icon:"folder-open", tooltip:'Open File', width:30, click:function () {
             options.compiled = false;
             loadFile(function (text,file) {
                if (text) {
                  UI('SourceText'+num).setValue(text)
                  options.file=file
                  UI('SourceTextWinLabel'+num).setValue(Label())
                  updateMenu();
                }
              });            
           }},
           { view:"button", type:"icon", icon:"save", tooltip:'Save File', width:30, click:function () {
            var code = UI('SourceText'+num).getValue();
            if (!/\.js$/.test(options.file)) options.file+='.js';
            saveFile(code,options.file,'text/plain',function (file) {
              if (file) {
                options.file=file
                UI('SourceTextWinLabel'+num).setValue(Label())
                updateMenu()
              }
            });
           }},
           { view:"button", type:"icon", icon:"file", tooltip:'New File', width:30, click:function () {
              options.compiled = false;
           }},
           opts.script?null:{ view:"button", type:"icon", icon:"navicon", tooltip:'Config', width:30, click:function () {
             configEditorWin[num].show();
           }},
           { view:"button", type:"icon", icon:"user", tooltip:'Share Code', width:30, click:function () {
             Clip.share(num);
           }},
           opts.script?null:{ view:"button", type:"icon", icon:"indent", tooltip:'Compile Class', width:30, click:function () {
            var code = UI('SourceText'+num).getValue();
            var acname = shell[options.shell].options.shell.env.compile(code);
            if (acname) {
              options.file = acname+'.js';
              UI('SourceTextWinLabel'+num).setValue(Label());
              options.compiled = true;
            }
            updateMenu();
           }},
           opts.script?{ view:"button", type:"icon", icon:"play", tooltip:'Execute script', width:30, click:function () {
              var code = 'later(1,function () {'+UI('SourceText'+num).getValue()+'})';
              shell[options.shell].ask(code);
           }}           
           :{ view:"button", type:"icon", icon:"play", tooltip:'Create Agent', width:30, click:function () {
            if (options.compiled == false) {
              var code = UI('SourceText'+num).getValue();
              var acname = shell[options.shell].options.shell.env.compile(code);
              if (acname) {
                options.file = acname+'.js';
                UI('SourceTextWinLabel'+num).setValue(Label());
              }
              options.compiled = true;
              updateMenu();
            }
            var ac=options.file.replace(/\.js$/,''),args; 
            if (options.arguments!="") eval('args='+options.arguments);
            else args={};
            var id=shell[options.shell].options.shell.env.create(ac,args,options.level);
            if (id) {
              info('Agent '+id+' of class '+ac+' started.');
              shell[options.shell].print('[JLB] Agent '+id+' of class '+ac+' started.'); 
            } else {
              error('Starting agent of class '+ac+' failed.');
              shell[options.shell].print('[JLB] Error: Starting agent of class '+ac+' failed.');             
            }
           }},
           { view:"label", label:Label(), id:'SourceTextWinLabel'+num,  align:'right'},
           { view:"button", type:"icon", icon:"close", tooltip:'Close Editor', width:30, click:function () {
            var self=editorWin[num];
            // editorWin[num]=undefined;
            self.hide();
           }},
          ].filter(function (o) { return o })
      }
  var config = {
    id:'SourceTextWin'+num,
	  view:"window",
	  height:350,
	  width:600,
	  left:250, top:50,
	  move:true,
	  resize: true,
      toFront:true,
      css:opts.script?'blue_toolbar':'green_toolbar',
	  head:head,
	  body:{
          id : 'SourceText'+num,
          view: "codemirror-editor",        
          attributes : { spellcheck:false, smartIndent:false, indentUnit:2},
      }
  }
  
  editorWin[num]=webix.ui(config);
  if (!options.script) UI('SourceText'+num).setValue(classTemplate);

  editorWin[num]._options=options;
  editorWin[num].show();
    
  /********** EDITOR CONFIG ****************/
  configEditorWin[num]=webix.ui({
      id:'configEditorWin'+num,
	  view:"window",
	  width:300,
	  height:450,
	  left:90, top:90,
	  move:true,
	  resize: true,
      toFront:true,
      css:'gray_toolbar',
      head: {
          view:"toolbar",
          cols:[
           { view:"label", label:"Configuration", align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              options.arguments = UI('configEditorAgentArgs'+num).getValue();
              options.level = Number(UI('configEditorAgentLevel'+num).getValue())||0;
              options.file=UI('configEditorFileName'+num).getValue();
              UI('SourceTextWinLabel'+num).setValue(Label());
              configEditorWin[num].hide();
           }}
          ]
      },
	  body: {
        rows:[
          { view:"form", scroll:true, width:300, height:400, elements: [

            { view:"label", label:"<b>Agent Creation</b>", height:'18px', align:'left'},
            { view:"textarea", id:"configEditorAgentArgs"+num, label:"Argument",  height:150, value:options.arguments},
            { view:"text", id:"configEditorAgentLevel"+num, label:"Level",    value:options.level},
            { view:"label", label:"<b>Code</b>", height:'18px', align:'left'},
            { view:"text", id:"configEditorFileName"+num, label:"File Name", value:options.file},
          ]}
        ]
      }
    });
  updateMenu();
}



/****************** MONITOR *******************/

function createMonitor(num,opts) {
  var tables={},reporter;
  opts.cmd = function (cmd) {
    // @cmd arg1 arg2 ...
    var obj,table,
        prefix=cmd.substr(0,cmd.indexOf(' ')),
        args=cmd.substr(cmd.indexOf(' ')+1); 
        console.log(prefix);
        console.log(args);
    switch (prefix) {
      case '@monitor:new':
        obj=JSON.parse(args);
        options.header=obj.header;
        options.id=obj.id;
        if (!reporterWin[num]) createReporter(num,options);
        break;
      case '@monitor:data':
        if (!reporterWin[num]) return;
        obj=JSON.parse(args);
        table=UI(reporterWin[num]._datatable.id);
        table.add(obj.row)
        break;
    } 
  }
  monitor[num]    = winShell(opts);
  var options     = monitor[num].options;
  options.shell   = opts.shell;
  options.closed  = false;
    
  function Label () {
    return jamConfig.name+" / Shell "+num+" / Agent Monitor"
  }
  monitorWin[num]=webix.ui({
      id:'MonitorWin'+num,
	  view:"window",
	  height:350,
	  width:600,
	  left:350, top:250,
	  move:true,
	  resize: true,
      toFront:true,
      css:'black_toolbar',
      head: {
          view:"toolbar",
          cols:[
            { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
              monitor[num].commands.clear()
            }},
            { view:"button", type:"icon", icon:"dot-circle-o", tooltip:'Scroll Auto', id:'MonitorWinLogFilmBut'+num, width:30, click:function () {
              UI('MonitorWinLog'+num).scrollAuto=!UI('MonitorWinLog'+num).scrollAuto;
              if (UI('MonitorWinLog'+num).scrollAuto) UI('MonitorWinLogFilmBut'+num).define('icon','arrow-circle-down')
              else UI('MonitorWinLogFilmBut'+num).define('icon','dot-circle-o');
              UI('MonitorWinLogFilmBut'+num).refresh();
            }},
            { view:"button", type:"icon", icon:"table", tooltip:'Data Monitor', width:30, click:function () {
              if (!reporterWin[num]) return;
              // createReporter(num,options);
              reporterWin[num].show();
            }},
            { view:"label", label:Label(), id:'MonitorWinLabel'+num, align:'right'},
            { view:"button", type:"icon", icon:"close", tooltip:'Kill', width:30, click:function () {
              monitorWin[num].hide();
            }},
          ]
      },
	  body:{
          id : 'MonitorWinLog'+num,
          view : 'scrollview',
          scroll : 'y',
          body : {
             id:'MonitorWinLogText'+num,
             rows : [
                {template:('<div id="MonitorWinOutput'+num+'" '+
                           'spellcheck="false" style="">'), height:"auto", borderless:true},
              ]
          }
	  }
  });
  UI('MonitorWinLog'+num).scrollAuto=false;
  monitorWin[num].show();
  monitor[num].init(undefined,"MonitorWinOutput"+num,UI('MonitorWinLog'+num));
  UI('MonitorWinLabel'+num).setValue(Label());
  updateMenu()
}

/****************** REPORTER *******************/

function createReporter(num,options) {
  function makeReport(tbl) {
  console.log(tbl)
    var header = tbl.shift(),
        columns = [],
        hash =[],
        data =[];
    header.forEach(function (col,i) { 
      console.log(i,col)
      columns.push({id:col,header:col,editor:'text'}); hash[i]=col; 
    });
    tbl.forEach (function (row,i) {
      var obj={id:i};
      row.forEach(function (col,j) { obj[hash[j]]=col; });
      data.push(obj);
    });
    var datatbl = {
      view:"datatable",
      id:'DataTable'+options.id+num, 
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
  var datatable =  makeReport([options.header.map(function (col) { return Object.keys(col)[0]})]);
  reporterWin[num]=webix.ui({
      id:'ReporterWin'+num,
	  view:"window",
	  height:350,
	  width:600,
	  left:350, top:250,
	  move:true,
	  resize: true,
      toFront:true,
      head: {
          view:"toolbar",
          cols:[
            { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
            }},
            { view:"button", type:"icon", icon:"flag", tooltip:'Scroll Auto', id:'ReporterWinLogFilmBut'+num, width:30, click:function () {
              UI('ReporterWinLog'+num).scrollAuto=!UI('ReporterWinLog'+num).scrollAuto;
              if (UI('ReporterWinLog'+num).scrollAuto) UI('ReporterWinLogFilmBut'+num).define('icon','flag-o')
              else UI('ReporterWinLogFilmBut'+num).define('icon','flag');
              UI('ReporterWinLogFilmBut'+num).refresh();
            }},
            { view:"button", type:"icon", icon:"table", tooltip:'Data Monitor', width:30, click:function () {
            }},
            { view:"label", label:"Thread "+options.thread+ " / "+options.ip+':'+options.port+" / Shell "+options.shell+" / Report "+num, id:'ReporterWinLabel'+num, align:'right'},
            { view:"button", type:"icon", icon:"close", tooltip:'Kill', width:30, click:function () {
              var self=reporterWin[num];
              self.hide();
            }},
          ]
      },
	  body:datatable
	 
  });
  reporterWin[num]._datatable=datatable;
  return reporterWin[num]
}

/* Load help files */
help.aios = SHELL.doc.aios;
help.jamsh = SHELL.doc.shell;
help.js = SHELL.doc.javascript;

/////////////
// CHAT WIN
/////////////
chatWin = webix.ui({
  id:'chatWin',
      view:"window",
      height:400,
      width:400,
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
       { view:"label", label:"Agent Chat", align:'right'},
       { view:"button", type:"icon", icon:"close",  align:'center', width:30, click: function () {
          chatWin.hide();
       }}
      ]
  },
  body:{
    template : ' <div class="botui-app-container" id="chat-bot" style="width:100%;"><bot-ui></bot-ui></div>',
    borderless:false            
  }
});

chatWin.chatActions=[]; // copy(chatActionsInit,true);
chatWin.chatLastAction=undefined;
chatWin.nextChatHistory=[];
chatWin.chatHistory=[];
chatWin.chatOpen=false;

// Clear the chat
function chatReset () {
  chatWin.chatActions=[];
  chatWin.chatHistory=[];
  chatWin.nextChatHistory=[];
  chatWin.chatLastAction=undefined;
  if (chatWin.botui) {
    chatWin.botui.message.removeAll();
  }
  chatRefresh();
}
// Refresh the chat by adding old/new messages and actions

function chatRefresh () {
  if (!chatWin.botui) return;
  function exec(l,last) {
    var todo=l.shift();
    if (!todo) return;
    function doit(todo,last) {
      switch (todo.kind) {
        case 'message':
          last=chatWin.botui.message.bot(todo);
          break;
        case 'answer':
          last=chatWin.botui.message.human(todo);
          break;
        case 'wait':
          if (last) last=last.then(function () {});
          break;
        case 'button':
          chatWin.chatLastAction=[todo]; 
          if (last) last=last.then(function () { return chatWin.botui.action.button(todo); }).then(function (res) {
                                      chatWin.chatLastAction=[];
                                      return { then:function (f) { f(res) } }
                          });
          else {
            last=chatWin.botui.action.button(todo).then(function (res) {
                                      chatWin.chatLastAction=undefined;
                                      return { then:function (f) { f(res) } }
                          });
          }
          break;
        case 'value':
          chatWin.chatLastAction=[todo]; 
          if (last) last=last.then(function () { return chatWin.botui.action.text(todo); }).then(function (res) {
                                      chatWin.chatLastAction=[];
                                      return { then:function (f) { f(res) } }
                          });
          else {
            last=chatWin.botui.action.text(todo).then(function (res) {
                                      chatWin.chatLastAction=undefined;
                                      return { then:function (f) { f(res) } }
                          });
          }
          break;
        case 'checkpoint':
          if (chatWin.chatLastAction.length) chatWin.chatLastAction.push(todo);
          if (last) last=last.then(function (res) { if (todo.timer) clearTimeout(todo.timer); return todo.callback(res) });
          break;
      }
      return last
    }
    last=doit(todo,last);
    if (l.length) exec(l,last);
  }
  exec(chatWin.chatHistory);
  exec(chatWin.chatActions);  
}
// Add a chat action
function chatAction (action) {
  chatWin.chatActions.push(action);
}

// External chat requests
function chatQuestion (id, question, action, callback, timeout) {
  // TODO: Remove question after timeout!
  var actions=[],timer;
  chatAction({kind:'message', delay:0, content: id+': '+question });
  if (timeout) timer=setTimeout(function () {
    chatWin.chatLastAction=[];
    // console.log('chatQuestion timeout');
    chatWin.chatActions=chatWin.chatActions.filter(function (todo) {
      if (todo.kind=='checkpoint' || todo.action) return false;
      else return true;
    });
    if (chatWin.botui) chatWin.botui.removeAction();
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




/* Chat Script Interpreter */
// {question:string, choices?:[], value?:number|string, eval?:function, 
//  cond?:function, timeout?:numebr, tag?:string }
// {message:string}
// {finalize:function}
// {process:function}
// {init:function}
// ! After reply to a question the question record contains an answer attribute !
chatScript = {
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
    var process = shell[1].run.Aios.current.process;
    var next = self.chatScript.script[self.chatScript.index];
    self.chatScript.index++;
    if (!next) return 0;
    if (next.question) {
      if (next.cond && !next.cond.call(process.agent,self.chatScript.script)) return -1;
      if (next.eval) {
        var replace = next.eval.call(process.agent,self.chatScript.script);
        // TODO
      }
      var timeout = next.timeout||30000;
      chatQuestion(self.chatScript.id,
                  next.question,
                  next.choices||{value:next.value},
                  function (res) {
                    if (next.callback)
                      shell[1].run.Aios.CB(process,next.callback,res?[res.value]:null);
                    process.wakeup();
                    shell[1].run.schedule();
                  },
                  timeout
      );
      process.suspend(shell[1].run.Aios.timeout(timeout));
    } else if (next.message) {
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

chatInit = function () {
  if (!chatWin.botui) {
    chatWin.nextChatHistory=[];
    chatWin.botui = new BotUI('chat-bot',{callback:function (msg) {
        // Record message history for page refresh
        if (msg.content) {
          if (msg.human) chatWin.nextChatHistory.push({kind:"answer", delay:0, content:msg.content});
          else chatWin.nextChatHistory.push({kind:"message", delay:0, content:msg.content});
        }
      }}); 
    chatMessage('Chat','Ready.');
    chatRefresh();        
  }
}
chatAgent = function (action) {
  if (!chatWin.agent) {
    if (action.load)
      return clippy.load(action.load, function (agent) {
                chatWin.agent=agent;
           });
    else return;
  }
  for(var p in action) {
    switch (p) {
      case 'play' :   chatWin.agent.play(action[p]); break;
      case 'speak':   chatWin.agent.speak(action[p]); break;
      case 'hide':    chatWin.agent.stop(); chatWin.agent.hide(); break;
      case 'moveTo':  chatWin.agent.moveTo(action[p].x,action[p].y,action[p].time); break;
      case 'load':    chatWin.agent.show(true); break;
      case 'show':    chatWin.agent.show(action[p]); break;
      case 'stop':    chatWin.agent.stop(); break;
      case 'stopCurrent': chatWin.agent.stopCurrent(); break;
    }
  }
}
shell[1].run.extend([2,3],'message',chatMessage,2);
shell[1].run.extend([2,3],'question',function (id, question, action, callback, timeout) {
        var process = shell[1].run.Aios.current.process;
        if (timeout==undefined) timeout=60000;
        chatQuestion (id, question, action, function (res) {
          shell[1].run.Aios.CB(process,callback,res?[res.value]:null);
          process.wakeup();
          shell[1].run.schedule();
        },timeout);
        process.suspend(shell[1].run.Aios.timeout(timeout));
      },[4,5]);


function openWin(num,content,options) {
  var panel = webix.ui({
      id:'Panel'+num,
	  view:"window",
	  height:350,
	  width:600,
	  left:350, top:250,
	  move:true,
	  resize: true,
      toFront:true,
      css:'black_toolbar',
      head: {
          view:"toolbar",
          cols:[
            { view:"label", label:options.title||("Window "+num), align:'right'},
            { view:"button", type:"icon", icon:"close", tooltip:'Close', width:30, click:function () {
              panel.close();
            }},
          ]
      },
      body:    {
        template : content,
        borderless:false            
      }   
  });
  panel.show();
}

Config=jamConfig;
//////////////////////////////////////////////////////////////

