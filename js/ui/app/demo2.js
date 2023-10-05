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
 **    $INITIAL:     (C) 2006-2018 bLAB
 **    $CREATED:     19-08-18 by sbosse.
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 **
 **     APP demo application using the APP builder
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var UIApp = Require('ui/app/app');
var Fs = Require('fs');

var UI = UIApp.UI({});
UI.init();

var netStatus='Uninitialized';

function handler(wname,val) {
  // 1. Check/uncheck = onclick event handler for checkbox with val: boolean ...
  // 2. Select = onclick event handler for radiobutton with val: number ...
  // wname: widget name
  // console.log(wname,val)
  UI.pages.log.log1.log('handler: '+wname+'('+val+')');
}
function handler1(wname) {
  UI.pages.log.log1.log('handler1: '+wname);
}
function handler0(wname) {
  UI.pages.log.log1.log('handler9: '+wname);
}

var styles = {
  // Common widget class style overwrites
  button:{
    border:{
      type:'line',
      fg:process.platform=='android'?'white':'black'
    },
  },
  input: {
    text:{
      border:{
        type:'line',
        fg:process.platform=='android'?'white':'black'
      },
      fg:process.platform=='android'?'white':'blue'
    }
  },
  tree:{
    border:{
      type:'line',
      fg:process.platform=='android'?'white':'black'
    }
  },
  // custom user styles
  buttonQuit: {
    color:'red'
  }
}

var content = {
  // All the pages
  pages : {
    main:{
      label1:  {type:'label',  center:true, top:1, content:'Menu'},
      button1: {type:'button', left:1,  content:'QUIT',  bg:'red', onclick: process.exit, style:'buttonQuit'},
      button2: {type:'button', right:1, content:'SETUP', onclick: 'setup1' /*jump to this page*/},
      button3: {type:'button', top:4, center:true, color:'red', width:'80%', content:'Network', onclick: 'network'},
      button4: {type:'button', top:8,center:true,width:'80%',content:'JAM', onclick: 'jam'},
      button5: {type:'button', top:12,center:true,width:'80%',content:'INFO', onclick: 'info1'},
      button6: {type:'button', top:16,center:true,width:'80%',content:'LOGS', onclick: 'log'},
      next : 'setup1',
    },
    setup1: {
      label1 : {type:'label', center:true,top:1,content:'Setup'},
      button1: {type:'button', left:1,  content:'<< Menu',  onclick: 'main'},
      button2: {type:'button', right:1, content:'More', onclick: 'setup2' /*jump to this page*/},
      input1 : {type:'input', top:4,  left:4, label:'Broker IP Address', value:'localhost', 
                onchange:function () {
                  var line=UI.pages.setup1.input1.getContent()+'.'+UI.pages.setup1.input2.getContent();                                                        
                  UI.pages.setup1.info1.update(line);
                }},
      input2 : {type:'input', top:8,  left:4, label:'Broker IP Port', value:'3001'},
      input3 : {type:'input', top:12, left:4, label:'Domain', value:'default'},
      info1  : {type:'info',  top:16, left:4, label:'URL'},
      on : {
        hide: function () {},
        show: function () {}
      },
      prev:'main',
      next:'setup2',
    },
    setup2: {
      label1 : {type:'label', left:4,top:16,content:'Protocol'},
      button1: {type:'button', left:1,  content:'<< Less',  onclick: 'setup1'},
      group1 : {
        type:'group',
        checkbox21 : {type:'radiobutton', left:4, top:6, text:'HTTP',  value:false, index:0},
        checkbox22 : {type:'radiobutton', left:4, top:8, text:'TCPIP', value:true,  index:1},
        onclick : handler
      },
      group2 : {
        type:'group',
        checkbox21 : {type:'radiobutton', left:18, top:6, text:'SYNC',  value:false, index:0},
        checkbox22 : {type:'radiobutton', left:18, top:8, text:'ASYNC', value:true,  index:1},
        onclick : handler
      },
      label3 : {type:'label', left:4, top:10, content:'Messages'},
      checkbox31 : {type:'checkbox', left:4, top:12, text:'Agent ID',  value:false, on:{ click:handler}},
      checkbox32 : {type:'checkbox', left:4, top:14, text:'Parent ID', value:false, on:{ check:handler1, uncheck:handler0}},
      checkbox33 : {type:'checkbox', left:4, top:16, text:'Time',      value:false, onclick: handler},
      prev:'setup1',
    },
    network: {
      label1 : {type:'label', center:true, top:1, content:'Network'},
      button1: {type:'button', left:1, content:'<< Menu', onclick:'main'},    
      button2: {type:'button', top:4, center:true, color:'green', width:'80%', content:'Start',
                onclick: function(data) {
                  if (netStatus == 'Uninitialized') {
                      UI.pages.network.info1.update('Network starting ..');
                      UI.screen.render();
                      setTimeout(function () {  
                        netStatus = 'Initialized';
                        UI.pages.network.info1.update('Connected.');
                        UI.pages.network.button2.setStyle({bg:'white'});
                        UI.pages.network.button3.setStyle({bg:'blue'});
                        UI.screen.render();
                      },500);
                  }
              }},
      button3: {type:'button', top:8, center:true, color:'red', width:'80%', content:'Stop',
                onclick: function(data) {
                  if (netStatus != 'Uninitialized') {
                      UI.pages.network.info1.update('Network stopping ..');
                      UI.screen.render();
                      setTimeout(function () {  
                        netStatus = 'Uninitialized';
                        UI.pages.network.info1.update('Not connected.');
                        UI.pages.network.button2.setStyle({bg:'blue'});
                        UI.pages.network.button3.setStyle({bg:'white'});
                        UI.screen.render();
                      },500);
                  }
              }},
      info1: {type:'info', center:true, top:12, width:'80%', label:'Status'},
      prev : 'main'
    },
    jam : {
      label1 : {type:'label', center:true, top:1, content:'JAM'},
      button1: {type:'button', left:1, content:'<< Menu', onclick:'main'},
      list1: {
          type:'list',
          top:4,
          left:4,
          height:UI.screen.height-16,
          width:40,
          label:'Classes',
          depth:1,
          onclick : function (wname,label,data) { print(label) }
        },
      on : {
        show: function () {
          UI.pages.jam.list1.update({1:'a',2:'b'})
        }
      },
      prev : 'main'
    },
    info1: {
      label1 : {type:'label', center:true, top:1, content:'System Info'},
      button1: {type:'button', left:1, content:'<< Menu', onclick:'main'},

      info1 : {type:'info', top:4, left:4, width:UI.screen.width-8, label:'Memory', value:'?'},
      info2 : {type:'info', top:8, left:4, width:UI.screen.width-8, label:'Heap Used'},
      tree1 : {type:'tree', top:12,left:4, width:UI.screen.width-8,
                                           height:UI.screen.height-16, label:'System',
                                           onclick : function (wname,path,label,data) { 
                                                UI.pages.log.log1.log('tree select '+label+' '+path); 
                                           }},
      on : {
        show : function (page) {
          var mem=process.memoryUsage();
          UI.pages['info1'].info1.update(String(mem.rss)+' Bytes');
          UI.pages['info1'].info2.update(String(mem.heapUsed)+' Bytes');
          UI.pages['info1'].tree1.update({
            mem:mem.rss,
            heap:mem.heapUsed,
            process:[
              {id:'0'},
              {id:'1'}
            ]
          })        
        }
      },
      prev : 'main' 
    },
    log:{
      label1 : {type:'label', center:true, top:1, content:'System Logs'},
      button1: {type:'button', left:1, content:'<< Menu', onclick:'main'},
      log1: { type:'log', top:4, left:4, width:UI.screen.width-8, label:'System Log' }
    }
  },
  // Bottom info container visible on all pages
  static : {
    info : {
      type : 'info',
      top:    UI.screen.height-3,
      width:  UI.screen.width-2,
      label:  'Information',
      value:  'Unknown'
    }
  }
}

UI.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });
UI.screen.key(['left','right'], function(ch, key) {
    if (key.name=='right' && UI.pages[UI.page].next){
      UI.pages.hide('this');
      UI.pages.show('next');    
    } else if (key.name=='left' && UI.pages[UI.page].prev) {
      UI.pages.hide('this');
      UI.pages.show('prev');    
    }
  });

UI.builder(styles,content,{});
UI.start();
setInterval(function (){ UI.pages.log.log1.log('Test '+Date.now())},5000);
