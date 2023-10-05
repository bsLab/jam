/*
** Main Application 
*/

var UI= $$;
var logtext= '';
var treemap=[];
var sourcetext='';
var printloc=false;

var shell=[];
var shellWin=[];
var configShellWin=[];
var shellNum=1;
var monitorWin=[];
var monitorNum=1;
var monitor=[]
var reporterWin=[];
var reporterNum=1;
var editorWin=[];
var editorNum=1;
var configEditorWin=[];
var netNodes=[]
var state=0;

var portRoot = 5000;


/** Main Options **/

var options = {
  ipmask:'192.168.8.*', 
  ipportdef:5000,         // Default LUAOS IP port
  pollDelta:100,          // Polling time between two different node scans
  pollIntervall:10000,    // Polling time between two full scans
  portRange:[140,160],
  version:'1.1.6',
}

var luaTemplate = "local m = monitor:new('mydata','time:%8d x:%4d')\nfunction f(x)\n  print(x)\n  m:log({x=x})\nend\nf(math.random())\n"

function log (widget,data) {
  var view = UI(widget);
  var log = UI(widget+'LogText');
  var scroll = view.getBody();
  logtext += data + '\n';
  log.removeView(widget+'WinLogTextView');
  log.addView({template:'<pre>'+logtext+'</pre>', autoheight:true, borderless:true, id:widget+'LogTextView'});
  scroll.scrollTo(0,1000000)
  view.show();    
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
  root={ id:"root", open:true, value:'Nodes @'+Date.now() }
  tree.add(root);
}

function maketree() {
  var i=0,tree = this.UI('navTree');
  for(var p in netNodes) {
    tree.add({id:p,value:p},i,'root');
    i++;
  }
}
var ipNext=0;
var pollTimer;

function poll() {
  if (network.state==0) return; 
  if (ipNext != 0) return setTimeout(poll,10000);
  
  function get(ip, callback) {
      var url='http://'+ip+':'+options.ipportdef+'?ping=true';
      // read text from URL location
      var request = new XMLHttpRequest();

      request.open('GET', url, true);
      request.send(null);
      request.onreadystatechange = function() {
          if (request.readyState === 4) {
              var type = request.getResponseHeader('Content-Type');
              if (type && type.indexOf("text") !== 1) {
                  callback(ip,request.responseText);
              }
          }
      }
  }
  function check(ip,text) {
    if (text=='LUAOS') {
      if (!netNodes[ip])
        webix.message({
                text:"Found node "+ip+": "+text,
                type:"debug", 
                expire: 5000,
              });
      netNodes[ip]=Date.now();
    }
  }
  function onepoll() {
    if (network.state!=1) return;
    if (ipNext==0) { 
      get('localhost', check);
      ipNext=options.portRange[0];
    } else {
      get(options.ipmask.replace(/\*/,ipNext),check);
      ipNext++;
    }
    if (ipNext<options.portRange[1]) setTimeout(onepoll,options.pollDelta);
    else {
      ipNext=0;
      deltree();
      var now = Date.now();
      for (var p in netNodes) {
        console.log(p,now,netNodes[p])
        if ((now-netNodes[p])>options.pollIntervall*2) {
          delete netNodes[p];
          webix.message({
                text:"Unreachable node "+p,
                type:"error", 
                expire: 5000,
              });
        }
      }
      maketree();
    }
  }
  onepoll();
  pollTimer=setTimeout(poll,options.pollIntervall);

};
network = {
  state:0,
  start:  function () { 
    network.state=1; 
    setTimeout(poll,100) 
  },
  stop:   function () { 
    network.state=0;
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer=undefined;
    ipNext=0;
    for(var i in shell) {
      if (shell[i]) shell[i].stop();
    }
    for(var i in monitor) {
      if (monitor[i]) monitor[i].stop();
    }
  }
}




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
              options.ipmask=UI('mainConfigWinIp').getValue();
              options.ipportdef=UI('mainConfigWinIpPortDef').getValue();
              options.portRange[0]=UI('mainConfigWinIpPortRangeA').getValue();
              options.portRange[1]=UI('mainConfigWinIpPortRangeB').getValue();
              mainConfigWin.hide();
           }}
          ]
      },
	  body: {
        rows:[
          { view:"form", scroll:true, width:300, height:400, elements: [

            { view:"label", label:"<b>LUAOS Network</b>", height:'18px', align:'left'},
            { view:"text", id:"mainConfigWinIp", label:"IP Mask", value:options.ipmask},
            { view:"text", id:"mainConfigWinIpPortDef", label:"IP Port", value:options.ipportdef},
            { view:"text", id:"mainConfigWinIpPortRangeA", label:"IP Range A", value:options.portRange[0]},
            { view:"text", id:"mainConfigWinIpPortRangeB", label:"IP Range B", value:options.portRange[1]},


          ]}
        ]
      }
    });


/************ TOP TOOLBAR ********/

toolbar = this.webix.ui({
        view:"toolbar",
        id:"myToolbar",
    	left:0, top:0, width:'100%',
        cols:[
         { view:"button", type:"icon", icon:"play", id:'button.network.start', tooltip:'Connect', width:30, click:function () {
          if (network.state==0) {
            UI('button.network.start').disable();
            UI('button.network.stop').enable();
            network.start();
          }
         }},
         { view:"button", type:"icon", icon:"stop", id:'button.network.stop', tooltip:'Disconnect', width:30, click:function () {
            UI('button.network.start').enable();
            UI('button.network.stop').disable();
            network.stop();
         }},
         { view:"button", type:"icon", icon:"repeat", tooltip:'Reload', width:30, click:function () {
           window.location.reload(true)
         }},
         { view:"button", type:"icon", icon:"navicon", tooltip:'Configuration', width:30, click:function () {
           mainConfigWin.show();
         }},
         { view:"label", id:'myTopLabel', label:'LUANET WEB API (C) Dr. Stefan Bosse Ver. '+options.version, align:'right'},
         { view:"button", type:"icon", icon:"close", tooltip:'Exit', width:30, click:function () {
         }},
        ]
  });
UI('button.network.stop').disable();
toolbar.show();

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


/************ EDITOR *****************/
   
function createEditor(num,opts) {
  var options = {
    file:'untitled',
    shell:opts.shell,
    ip:shell[opts.shell].options.ip,
    port:shell[opts.shell].options.port
  }
  function Label() {
    return options.file+' / '+options.ip+':'+options.port+" / Shell "+options.shell+" / Editor "+num
  }
  editorWin[num]=webix.ui({
      id:'SourceTextWin'+num,
	  view:"window",
	  height:350,
	  width:600,
	  left:250, top:50,
	  move:true,
	  resize: true,
      toFront:true,
	  head:{
          view:"toolbar",
          cols:[
           { view:"button", type:"icon", icon:"folder-open", tooltip:'Open File', width:30, click:function () {
            loadScript(undefined,'.lua',function (text,file) {
              if (text) {
                UI('SourceText'+num).setValue(text)
                options.file=file
                UI('SourceTextWinLabel'+num).setValue(Label())
              }
            });            
           }},
           { view:"button", type:"icon", icon:"save", tooltip:'Save File', width:30, click:function () {
            var code = UI('SourceText'+num).getValue();
            saveFile(code,options.file,'text/plain');
           }},
           { view:"button", type:"icon", icon:"file", tooltip:'New File', width:30, click:function () {
           }},
           { view:"button", type:"icon", icon:"navicon", tooltip:'Config', width:30, click:function () {
             configEditorWin[num].show();
           }},
           { view:"button", type:"icon", icon:"play", tooltip:'Execute Script', width:30, click:function () {
            var code = UI('SourceText'+num).getValue();
            shell[options.shell].ask('thread',code,function (res) {
              createMonitor(monitorNum,{
                ip:options.ip,
                port:Number(shell[options.shell].options.port)+Number(res),
                thread:Number(res),
                shell:options.shell,
                tmoFixed:200,
              });
              monitor[monitorNum].print("Ready.");
              monitorNum++;
              webix.message({
                text:"Thread created: #"+res,
                type:"debug", 
                expire: 10000,
              });
            });
           }},
           { view:"label", label:Label(), id:'SourceTextWinLabel'+num,  align:'right'},
           { view:"button", type:"icon", icon:"close", tooltip:'Close Edutor', width:30, click:function () {
            var self=editorWin[num];
            editorWin[num]=undefined;
            self.close();
           }},
          ]
      },
	  body:{
          id : 'SourceText'+num,
          view: "codemirror-editor",        
          attributes : { spellcheck:false},
      }
/*
	  body:{
          id : 'SourceText'+num,
          view : 'textarea',
          attributes : { spellcheck:false},
          value:'function f(x)\n  print(x)\nend\nf(1)'
	  }
*/
  });
  UI('SourceText'+num).setValue(luaTemplate);

  editorWin[num].show();
  configEditorWin[num]=webix.ui({
      id:'configEditorWin'+num,
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
           { view:"label", label:"Configuration", align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              options.shell=UI('configEditorShellNum'+num).getValue();
              options.ip=shell[options.shell].options.ip;
              options.port=shell[options.shell].options.port;
              UI('SourceTextWinLabel'+num).setValue(options.ip+':'+options.port+" / Shell "+options.shell+" / Editor "+num);
              configEditorWin[num].hide();
           }}
          ]
      },
	  body: {
        rows:[
          { view:"form", scroll:true, width:300, height:400, elements: [

            { view:"label", label:"<b>Attached Shell</b>", height:'18px', align:'left'},
            { view:"text", id:"configEditorShellNum"+num, label:"Shell #", value:options.shell},

          ]}
        ]
      }
    });
}



/*
              var tree = UI('ASTree'),
                  Syntax,
                  root={ id:"root", open:true, value:"Processes" };
              sourcetext = UI('SourceText').getValue();
              tree.remove('root');
              treemap=[];
              tree.add(root);
              log('Compiling:\n<font color="blue">'+sourcetext+'</font>');
              try {
                var tree = {};
                log('Ok.');
                log('Printing tree ..');   
                maketree(tree,'root',0);
                log('Done.');
              } catch (e) {
                log('Failed:\n<font color="red">'+e+'</font>');
              }
              tree.render();

*/
 
// Shell windows


function createShell(num,params) {
  shell[num] = winShell({ip:params.ip,port:params.port||5001});
  var options = shell[num].options;

  shellWin[num]=webix.ui({
      id:'ShellWin'+num,
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
             shell[num].commands.clear()
           }},
           { view:"button", type:"icon", icon:"repeat", tooltip:'Update', width:30, click:function () {
           }},
           { view:"button", type:"icon", icon:"navicon", tooltip:'Config', width:30, click:function () {
             configShellWin[num].show();
           }},
           { view:"button", type:"icon", icon:"edit", tooltip:'New Editor', width:30, click:function () {
              createEditor(editorNum,{shell:num});
              editorNum++;
           }},
           { view:"button", type:"icon", icon:"link", tooltip:'Connect', width:30, click:function () {
           }},
           { view:"button", type:"icon", icon:"unlink", tooltip:'Disconnect', width:30, click:function () {
           }},
           { view:"button", type:"icon", icon:"flag", tooltip:'Scroll Auto', id:'ShellWinLogFilmBut'+num, width:30, click:function () {
             UI('ShellWinLog'+num).scrollAuto=!UI('ShellWinLog'+num).scrollAuto;
             if (UI('ShellWinLog'+num).scrollAuto) UI('ShellWinLogFilmBut'+num).define('icon','flag-o')
             else UI('ShellWinLogFilmBut'+num).define('icon','flag');
             UI('ShellWinLogFilmBut'+num).refresh();
           }},
           { view:"label", label:"Shell "+num, id:'ShellWinLabel'+num, align:'right'}
          ]
      },
	  body:{
		  // view:'textarea', value:'Ready.', id:'DOStext'
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
  configShellWin[num]=webix.ui({
      id:'configShellWin'+num,
	  view:"window",
	  width:300,
	  height:450,
	  left:90, top:90,
	  move:true,
	  resize: true,
      toFront:true,
      head: {
          view:"toolbar",
          id:"myToolbarconfigWin"+num,
          cols:[
           { view:"label", label:"Configuration", align:'right'},
           { view:"button", type:"icon", icon:"check-square",  align:'center', width:30, click: function () {
              options.ip=UI('configRemoteHostIp'+num).getValue();
              options.port=UI('configRemoteHostIpPort'+num).getValue();
              UI('ShellWinLabel'+num).setValue(options.ip+':'+options.port+" / Shell "+num);
              shell[num].setup();
              configShellWin[num].hide();
           }}
          ]
      },
	  body: {
        rows:[
          { view:"form", scroll:true, width:300, height:400, elements: [

            { view:"label", label:"<b>Remote Host</b>", height:'18px', align:'left'},
            { view:"text", id:"configRemoteHostIp"+num, label:"IP", value:options.ip},
            { view:"text", id:"configRemoteHostIpPort"+num, label:"IPPORT", value:options.port},


          ]}
        ]
      }
    });
  shell[num].init("ShellWinInput"+num,"ShellWinOutput"+num,UI('ShellWinLog'+num));
  UI('ShellWinLog'+num).scrollAuto=false;
  
  shellWin[num].attachEvent("onViewMove", function(pos, e){
  });
  shellWin[num].attachEvent("onViewMoveEnd", function(pos, e){
  });
  UI('ShellWinLabel'+num).setValue(options.ip+':'+options.port+" / Shell "+num);
  
}
createShell(shellNum,{ip:'localhost',port:portRoot});
shellNum++;

/****************** MONITOR *******************/

function createMonitor(num,opts) {
  var tables={},reporter;
  opts.cmd = function (cmd) {
    // Command interpreter for commands sent by luaos
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
  monitor[num] = winShell(opts);
  var options = monitor[num].options;
  options.thread=opts.thread;
  options.shell=opts.shell;
  options.closed = false;
    
  monitorWin[num]=webix.ui({
      id:'MonitorWin'+num,
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
              monitor[num].commands.clear()
            }},
            { view:"button", type:"icon", icon:"flag", tooltip:'Scroll Auto', id:'MonitorWinLogFilmBut'+num, width:30, click:function () {
              UI('MonitorWinLog'+num).scrollAuto=!UI('MonitorWinLog'+num).scrollAuto;
              if (UI('MonitorWinLog'+num).scrollAuto) UI('MonitorWinLogFilmBut'+num).define('icon','flag-o')
              else UI('MonitorWinLogFilmBut'+num).define('icon','flag');
              UI('MonitorWinLogFilmBut'+num).refresh();
            }},
            { view:"button", type:"icon", icon:"table", tooltip:'Data Monitor', width:30, click:function () {
              if (!reporterWin[num]) return;
              // createReporter(num,options);
              reporterWin[num].show();
            }},
            { view:"label", label:"Thread "+options.thread+ " / "+options.ip+':'+options.port+" / Shell "+options.shell+" / Monitor "+num, id:'MonitorWinLabel'+num, align:'right'},
            { view:"button", type:"icon", icon:"close", tooltip:'Kill', width:30, click:function () {
              var self=monitorWin[num];
              monitor[num].ask('kill','',function (res) {
                monitor[num].ask('end','',function (res) {
                });
                options.closed=true;
                monitorWin[num]=undefined;
                monitor[num].stop();
                webix.message({text:'Thread closed: #'+res});
                self.close();
              });
              setTimeout(function () {
                if (!options.closed) {
                  options.closed=true;
                  monitorWin[num]=undefined;
                  monitor[num].stop();
                  webix.message({text:'Thread closed: #'+options.thread});
                  self.close();
                }
              },1000);
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

