/**
 **      ==============================
 **       OOOO        O      O   OOOO
 **       O   O       O     O O  O   O
 **       O   O       O     O O  O   O
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
 **    $INITIAL:     (C) 2006-2016 B-LAB
 **    $CREATED:     29/3/16 by sbosse.
 **    $VERSION:     1.1.22
 **
 **    $INFO:
 **
 **  JAM Main World Window // WEB edition
 **
 **    $ENDOFINFO
 */
var UI= $$,
    connected=false,
    highlights=[],
    CompWin,
    Cs,
    Dios,
    DnsTree,
    DnsWin,
    JamWeb,
    JamWorld,
    JamNet,
    JamNum=0,
    JamWin={},
    JamWinNum=1,
    Jam={},
    Net,
    SourceTextWin,
    SysWin,
    jamworld,
    privhostport,
    pubhostport;

var template = 
"var classes = {\n"+
"  // Type your AgentJS here\n"+
"  a1 : function () {\n"+
"    this.act = {\n"+
"      init : function () {},\n"+
"      first : function () {}\n"+
"    };\n"+
"    this.trans = {\n"+
"      init : function () {}\n"+
"    };\n"+
"    this.next=init;\n"+
"  }\n"+
"}\n";

var nameopts = {
  world:{length:8, memorable:true, uppercase:true},
  node:{length:8, memorable:true, lowercase:true}
}

webix.codebase = "./";

function log (win) {
  function wrap(data) {
    function contains(it) { return data.indexOf(it) != -1; };
    if (contains('[BHPC]&emsp;ALIVE!')) {
          UI('SYSTopBtn').define('badge','A');
          UI('SYSTopBtn').refresh();
          connected=true;
    };
    if (contains('[BHPC]&emsp;Error:&emsp;GET') && !contains('ETIMEDOUT')) {
          UI('SYSTopBtn').define('badge','!');
          UI('SYSTopBtn').refresh();
          connected=false;
    };
    if (contains('Warning:')) return '<font color="green">'+data + '</font>';
    else if (contains('Error:')) return '<font color="red">'+data + '</font>';
    else return data;
  }
  return function(data) {
    if(data==undefined) data='undefined';
    if(typeof data != 'string') data=JSON.stringify(data);
    var view = UI(win);
    var log = UI(win+'LogText');
    var scroll = view.getBody();
    if (typeof log.logtext == 'undefined') log.logtext='';
    data=data.replace(/ /g,'&emsp;').replace(/\n/g,'<br>\n');
    log.logtext += wrap(data) + '<br>\n';
    log.removeView(win+'LogTextView');
    log.addView({template:'<tt>'+log.logtext+'</tt>', autoheight:true, borderless:true, id:win+'LogTextView'});
    scroll.scrollTo(0,1000000)
    //view.show();
  }  
}

function warn (win) {
  return function(data) {
    var view = UI(win);
    var log = UI(win+'LogText');
    var scroll = view.getBody();
    if (typeof log.logtext == 'undefined') log.logtext='';
    data=data.replace(/ /g,'&emsp;').replace(/\n/g,'<br>\n');
    log.logtext += '<font color="green">'+data + '</font><br>\n';
    log.removeView(win+'LogTextView');
    log.addView({template:'<tt>'+log.logtext+'</tt>', autoheight:true, borderless:true, id:win+'LogTextView'});
    scroll.scrollTo(0,1000000)
    //view.show();
  }  
}

function err (win) {
  return function(data) {
    var view = UI(win);
    var log = UI(win+'LogText');
    var scroll = view.getBody();
    if (typeof log.logtext == 'undefined') log.logtext='';
    data=data.replace(/ /g,'&emsp;').replace(/\n/g,'<br>\n');
    log.logtext += '<font color="red">'+data + '</font><br>\n';
    log.removeView(win+'LogTextView');
    log.addView({template:'<tt>'+log.logtext+'</tt>', autoheight:true, borderless:true, id:win+'LogTextView'});
    scroll.scrollTo(0,1000000)
    //view.show();
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
  //view.show();    
}


function highlightLine(editor,lineNumber) {
    //Select editor loaded in the DOM
    var myEditor = UI(editor).getEditor();
    if (!myEditor) return;
     //Set line CSS class to the line number & affecting the background of the line with the css class of line-error
    myEditor.setLineClass(lineNumber - 1, 'background', 'line-error');
    highlights[editor]=lineNumber;
}   

function unhighlight(editor) {
  if (highlights[editor]) {
    var myEditor = UI(editor).getEditor();
    if (!myEditor) return;
     //Set line CSS class to the line number & affecting the background of the line with the css class of line-error
    myEditor.setLineClass(highlights[editor] - 1, 'background', 'line-normal');  
    highlights[editor]=0;
  }
} 

var popup_sysinfo=webix.ui({
              view:"popup",
              id:'SysWinInfo',
              resize: true,
	          body:{
                  id : 'SysWinInfoLog',
                  view : 'scrollview',
                  scroll : 'y',                  
                  body : {
                     id:'SysWinInfoLogText',
                     rows : [
                        { view:"button", type:"icon", icon:"close", click:function () {popup_sysinfo.hide()}}
                      ]
                  }
	          },
    });

SysWin = webix.ui({
    id:'SysWin',
	view:"window",
	height:200,
	width:500,
	left:50, top:50,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:("clear('SysWin');")},
         { view:"button", type:'icon', icon:'sign-in' , tooltip:'Connect to Broker', id: 'SysWinStartBut', width:30, click:function () {
          UI('SysWinStartBut').disable();
          UI('SysWinStopBut').enable();
          UI('SYSTopBtn').define('badge','C');
          UI('SYSTopBtn').refresh();
          JamNet.init();          
          Dios = JamWeb.Dios.Dios(JamNet.rpc,JamNet.env);
          JamNet.start();  
          JamWorld.init();
          JamWorld.start();                  
         }},
         { view:"button", type:'icon', icon:'sign-out' , tooltip:'Disconnect', id: 'SysWinStopBut', width:30, click:function () {
          UI('SysWinStartBut').enable();
          UI('SysWinStopBut').disable();
          UI('SYSTopBtn').define('badge','D');
          UI('SYSTopBtn').refresh();
          JamNet.stop();          
         }},
         { view:"button", type:'icon', icon:'info' , tooltip:'Statistics', id: 'SysWinInfoBut', width:30, click:function () {
           var node = UI("SysWin").getNode();
           //console.log(node); return;
           clear('SysWinInfo');
           log('SysWinInfo')(JamNet.status());
           popup_sysinfo.show(node , {pos:'bottom'});
         }},
         { view:"button", type:'icon', icon:'sitemap' , tooltip:'List', id: 'SysWinListBut', width:30, click:function () {
         }},
         { view:"button", type:'icon', icon:'plus-circle' , tooltip:'Increase Font Size', width:30, click:function () {
          changecss('.webix_el_textarea  textarea','font-size','14px');
          changecss('tt','font-size','14px');
          changecss('.CodeMirror pre','font-size',"14px");
         }},
         { view:"button", type:'icon', icon:'minus-circle' , tooltip:'Decrease Font Size', width:30, click:function () {
          changecss('.webix_el_textarea  textarea','font-size','12px');
          changecss('tt','font-size','12px');
          changecss('.CodeMirror pre','font-size',"12px");
         }},
         { view:"button", type:'icon', icon:'folder-open' , tooltip:'DNS Lookup', width:30, click:function () {
            if (JamNet.network) Dios.dir('/',function (rows,stat){
              var i=0;
              log('SysWin')('/ | '+Net.Print.status(stat));
              for (var row in rows) {
                log('SysWin')('  + '+rows[row].name+' ('+
                                     rows[row].time+') '+
                                     Net.Print.capability(rows[row].cap));
                i++;
              }
            });
            else log('SysWin')('Error: Not connected.');
         }},

         { view:"label", label:"System Console", align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30, click:("UI('SysWin').hide();")}
        ]
    },
	body:{
        id : 'SysWinLog',
        view : 'scrollview',
        scroll : 'y',
        body : {
           id:'SysWinLogText',
           rows : [
              { template : ('<tt>Ready.</tt>'),height:24, borderless:true},
            ]
        }
	}
});
UI('SysWinStopBut').disable();
changecss('.webix_el_textarea  textarea','font-size','12px');
changecss('tt','font-size','12px');
changecss('.CodeMirror pre','font-size',"12px");


DnsWin = webix.ui({
    id:'DnsWin',
	view:"window",
	height:200,
	width:500,
	left:100, top:100,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30,
           click:("clear('DnsWin');")},
         { view:"label", label:"DNS Tree", align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30,
           click:("UI('DnsWin').hide();")}
        ]
    },
	body:{
      id:'DNSTree',
	  left:50, top:70,
      view:'tree',
      type:'lineTree',
      select:false,
      tooltip:function(obj){
        return "<b>"+(obj.cap?Net.Print.capability(obj.cap)+' is '+obj.info:obj.id)+"</b>";
    },
      data: [
          { id:'/', open:false, value:"/", data : [
            { id:'/.', open:false, value:"No Network Connection!"}
          ]}
      ]
    }
});
DnsTree = UI('DNSTree');
DnsTree.attachEvent("onBeforeOpen", function(id){
  var child = DnsTree.getFirstChildId(id),
      i=0, next;
  if (!JamNet.network) return;
  while (child != null) {
    next=DnsTree.getNextSiblingId(child); 
    DnsTree.remove(child);
    child=next;
  }
  // webix.message({text:id,type:'Info'});
  // DnsTree.diable();
  Dios.dir(id, function (rows,stat){
    //DnsTree.open(child);
    for (var row in rows) {
      if (rows[row].stat != Net.Status.STD_OK) continue;
      // webix.message({text:(id+' ++ '+rows[row].name),type:'Info'});
      (function (row) {
        JamNet.std.std_info(rows[row].cap,function (stat,str) {
          // webix.message({text:('++ '+id+'/'+rows[row].name),type:'Info'});
          DnsTree.add({ id:(id+'/'+rows[row].name), cap:rows[row].cap, info:str,
                        open:(stat == Net.Status.STD_OK && S.startsWith(str,'/D')), 
                        value:rows[row].name },
                      i,
                      id);
          DnsTree.close(id+'/'+rows[row].name);
          i++;
        })
      })(row);
    }
  });
});

DnsTree.attachEvent("onBeforeClose", function(id){
  var child = DnsTree.getFirstChildId(id),next;
  // webix.message({text:'- '+id,type:'Info'});  
  while (child != null) {
    next=DnsTree.getNextSiblingId(child); 
    DnsTree.remove(child);
    child=next;
  }
  DnsTree.add({ id:id+'/.', open:true, value:"."},0,id);
});

var popup_load_file_id = (Math.random()*1000000)|0,
    popup_load_file=webix.ui({
              view:"popup",
              id:"popup_load_file"+popup_load_file_id,
              body: {
               view:"toolbar", 
               elements:[
                  { template:'<input type="file" id="load_file_input'+popup_load_file_id+'">', width:240 },
                  { view:"button", label:"Ok", width:80, click:function () {
                    var popup=UI("popup_load_file"+popup_load_file_id);
                    loadFileAsText('load_file_input'+popup_load_file_id,function(data) {
                      //console.log(data);
                      unhighlight('SourceText');
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

function sourcetextwin () {return  webix.ui({
    id:'SourceTextWin',
	view:"window",
	height:200,
	width:500,
	left:50, top:250,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", type:"icon", icon:"file-text", tooltip:'Load from File', width:30, click:function () {
           var node = UI("SourceTextWin").getNode();
           //console.log(node); return;
           popup_load_file.show(node , {pos:'top'});
          }
         },
         { view:"button", type:"icon", icon:"save", tooltip:'Save to File', width:30, click:function () {
            var sourcetext = UI('SourceText').getValue();
            saveTextAsFile(sourcetext, 'agent.classes.js');
         }},
         { view:"label", label:"Source Text", align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30, click:("UI('SourceTextWin').hide();")}
        ]
    },
	body:{
        id : 'SourceText',
        view: "codemirror-editor"
    }
})};



CompWin = webix.ui({
    id:'CompWin',
	view:"window",
	height:200,
	width:500,
	left:550, top:50,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:("clear('CompWin');")},
         { view:"button", type:"icon", icon:"gears", tooltip:'Compile', width:30, click:function () {                
            var count=0,
                sourcetext = UI('SourceText').getValue();            
            log('CompWin')('Compiling ...');
            unhighlight('SourceText');
            try {
              Jam[0].compile(sourcetext);
              log('CompWin')('Ok.');
            } catch (e) {
              err('CompWin')('Failed:\n'+e);
              
              if (e.lineNumber) highlightLine('SourceText',e.lineNumber);
            }
            for (var key in JamWorld.classes) {
              if (JamWorld.classes[key]) count++;
            }
            UI('COMPTopBtn').define('badge',count?count:'0');
            UI('COMPTopBtn').refresh();            
         }},
         { view:"button", type:"icon", icon:"wrench", tooltip:'Modify', width:30, click:function () {
         
         }},
         { view:"label", label:"AgentJS Compiler & Classes", align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30, click:("UI('CompWin').hide();")}
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
});


function newJamWin () {
  var id=JamWinNum;
  JamWinNum++;
  JamWin[id] = webix.ui({
    id:'JamWin'+id,
	view:"window",
	height:200,
	width:500,
	left:550, top:250,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30,
                          click:function () {clear('JamWin'+id);}},
         { view:"button", type:"icon", icon:"play", tooltip:'Start', 
                          id: 'JamWinStartBut'+id, 
                          width:30, click:function () {
          Jam[id] = JamWeb.Jam({
            world:JamWorld,
            http:true,verbose:1,
            out:log('JamWin'+id),
            network:JamNet.network,
            scheduler:JamNet.scheduler
          });
          JamNum++;
          UI('JamWinStartBut'+id).disable();
          UI('JamWinStopBut'+id).enable();
          UI('JAMTopBtn').define('badge',JamNum);
          UI('JAMTopBtn').refresh();
          Jam[id].init();
          Jam[id].start();
          UI('JamWinLabel'+id).setValue('JAM '+Jam[id].nodename);
         }},
         { view:"button", type:"icon", icon:"stop", tooltip:'Stop', 
                          id: 'JamWinStopBut'+id, 
                          width:30, click:function () {
          JamNum--;
          UI('JamWinStartBut'+id).enable();
          UI('JamWinStopBut'+id).disable();
          UI('JAMTopBtn').define('badge',JamNum);
          UI('JAMTopBtn').refresh();
          
          Jam[id].stop();
         }},
         { view:"button", type:"icon", icon:"user-plus", tooltip:'Create new Agent', 
                          width:30, click:function () {
         }},
         { view:"button", type:"icon", icon:"clone", tooltip:'Create new JAM', 
                          width:30, click:function () {
          var _id=newJamWin();
          UI('JamWinStopBut'+_id).disable();
          UI('JamWin'+_id).show();
         }},
         { view:"label", label:"JAM", align:'right',
           id: 'JamWinLabel'+id},
         { view:"button", type:"icon", icon:"close",  align:'center', 
                          width:30, 
                          click:function () {UI('JamWin'+id).hide()}}
        ]
    },
	body:{
        id : 'JamWin'+id+'Log',
        view : 'scrollview',
        scroll : 'y',
        body : {
           id:'JamWin'+id+'LogText',
           rows : [
              { template : ('<tt>Ready.</tt>'),height:24, borderless:true},
            ]
        }
	}
  });
  return id;
};
newJamWin();
UI('JamWinStopBut1').disable();

function Graph(container)
{
			// Checks if the browser is supported
			if (!mxClient.isBrowserSupported())
			{
				// Displays an error message if the browser is not supported.
				mxUtils.error('Browser is not supported!', 200, false);
			}
			else
			{
				// Disables the built-in context menu
				mxEvent.disableContextMenu(container);
				
				// Creates the graph inside the given container
				graph = new mxGraph(container);
				// Enables rubberband selection
				new mxRubberband(graph);
				
				// Gets the default parent for inserting new cells. This
				// is normally the first child of the root (ie. layer 0).
				var parent = graph.getDefaultParent();
								
				// Adds cells to the model in a single step
				graph.getModel().beginUpdate();
				try
				{
					var v1 = graph.insertVertex(parent, 'v1', 'Hello,', 20, 20, 80, 30);
					var v2 = graph.insertVertex(parent, 'v2', 'World!', 200, 150, 80, 30);
					var e1 = graph.insertEdge(parent, null, '', v1, v2);
				}
				finally
				{
					// Updates the display
					graph.getModel().endUpdate();
				}
			}
}
// Example of embedding a jgraph canvas
if (0) GraphWin = webix.ui({
    id:'GraphWin',
	view:"window",
	height:200,
	width:500,
	left:550, top:50,
	move:true,
	resize: true,
    toFront:true,
    head: {
        view:"toolbar",
        id:"myToolbar",
        cols:[
         { view:"label", label:"Graph", align:'right'},
         { view:"button", type:"icon", icon:"close",  align:'center', width:30, click:("UI('GraphWin').hide();")}
        ]
    },
	body: {
      template : '<div id="graphContainer" style="position:relative;overflow:hidden;cursor:default;"></div>',              
      borderless:true            
	}
});
// GraphWin.show();
//Graph(document.getElementById('graphContainer'));
//setTimeout(function () {Graph(document.getElementById('rootGraphContainer'));},1000);

// ----------------------------- //

JamWeb = loadfile('jamweb.debug.js',
  {
    console:{log:log('SysWin'),warn:log('SysWin')}
  }).main();    
  
Cs = JamWeb.Cs;
Net = JamWeb.Net;
jamworld=JamWeb.Name.generate(nameopts.world);
privhostport = JamWeb.Net.uniqport();
pubhostport = JamWeb.Net.prv2pub(privhostport);
JamNet = JamWeb.JamNet({
  world:jamworld,
  out:log('SysWin'),
  http:true,
  verbose:1,
  pubhostport:pubhostport,
  env:{rootdir:Cs.nilcapset}
});
JamWorld = JamWeb.Aios.World.World([],{
  id:jamworld,
  out:log('SysWin'),
  scheduler:JamNet.scheduler
});
JamWeb.Aios.current.scheduler=JamNet.scheduler;

Jam[0] = JamWeb.Jam({
  world:JamWorld,
  scheduler:JamNet.scheduler,
  out:log('CompWin'),
  err:err('CompWin'), 
  warn:warn('CompWin'), 
  nodename:'AgC'
});
JamNum++;

// ----------------------------- //


webix.ui({
        view:"toolbar",
        id:"myToolbar",
    	left:00, top:0, width:'100%',
        cols:[
         { view:"button", id:'SYSTopBtn', label:"System", width:120, badge: '-', click:function () {
          SysWin.show();
         }},
         { view:"button", label:"Source", width:120, click:function () {
          if (!SourceTextWin) {
            SourceTextWin=sourcetextwin();
            UI('SourceText').setValue(template);
          }
          SourceTextWin.show();
         }},
         { view:"button", id:'COMPTopBtn', label:"Classes",  badge: '0', width:120, click:function () {
          CompWin.show()
         }},
         { view:"button", id:'JAMTopBtn', label:"JAM", badge: '0', width:120, click:function () {
          for (var i in JamWin)
            if (JamWin[i]) JamWin[i].show()
         }},
         { view:"button", id:'DnsTopBtn', label:"DNS", width:120, click:function () {
          DnsWin.show()
         }},
         { view:"label", label:'JAM World '+jamworld+' ', align:'right'}
        ]
}).show();



DnsTree = UI('DNSTree');


setTimeout(function () {
  UI('JAMTopBtn').define('badge','1');
  UI('JAMTopBtn').refresh();
},1);

