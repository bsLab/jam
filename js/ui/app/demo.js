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
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     14-08-17 by sbosse.
 **    $VERSION:     1.2.4
 **
 **    $INFO:
 **
 **     APP demo application
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var UI = Require('ui/app/app');
var Fs = Require('fs');

function Demo(options) {
  var self=this,
      //platform='android';
      platform=process.platform||'unix';
  this.options=options||{};
  this.netStatus = 'Uninitialized';
  this.UI = UI.UI({
    pages:7,
    terminal:this.options.terminal
    || (process.platform === 'win32' ? 'windows-ansi' : 'xterm-color'),
    title:'APP (C) Stefan Bosse',
    styles:{
      button:{
        border:{
          type:'line',
          fg:(process.platform=='android'?'red':'black')
        }
      },
      input: {
        text:{
          fg:process.platform=='android'?'white':'blue'
        }
      },
      tree:{
        border:{
          type:'line',
          fg:(process.platform=='android'?'white':'black')
        }
      }
    }
  });
  this.UI.init();
  
  this.info = this.UI.info({
    top:this.UI.screen.height-3,
    width:this.UI.screen.width-2,
    label:'Information'
  });
  this.info.setValue('Not connected.');

  /* MENU */
  var delta=4,top=4, group=1;
  //if ((platform=='android') && this.UI.screen.height< 34) delta=3;
  
  this.UI.pages[1].but1 = this.UI.button({left:1,content:'QUIT'});
  this.UI.pages[1].but1.on('press', function(data) {
    return process.exit(0);  
  });
  
  this.UI.pages[1].label1 = this.UI.label({center:true,top:1,content:'Menu'});
  this.UI.pages[1].but2 = this.UI.button({right:1,content:'SETUP'});
  this.UI.pages[1].but2.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(2);
  });
  this.UI.pages[1].but3 = this.UI.button({top:top,center:true, bg:'red',width:'80%',content:'Network'});
  this.UI.pages[1].but3.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(4);
  });
  top += delta;
  this.UI.pages[1].but4 = this.UI.button({top:top,center:true,width:'80%',content:'JAM'});
  this.UI.pages[1].but4.on('press', function(data) {
    self.UI.pages.hide(1);    
    self.UI.pages.show(5);
    if (self.netStatus != 'Connected') {
      var dia = self.UI.dialog({width:'50%',height:6,center:true,
                                okButton     : 'Okay',
                                cancelButton : 'Cancel'
                });
      dia.ask('You need to start the network service first!',function () {});
    }
  });
  top += delta;
  this.UI.pages[1].but5 = this.UI.button({top:top,center:true,width:'80%',content:'Agents'});
  this.UI.pages[1].but5.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(6);
  });
  top += delta;  
  this.UI.pages[1].but6 = this.UI.button({top:top,center:true,width:'80%',content:'Logging'});
  this.UI.pages[1].but6.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(7);
  });
  this.UI.pages[1].next=2;
  
  /* SETUP */
  this.UI.pages[2].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[2].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show('prev');
  });
  this.UI.pages[2].label1 = this.UI.label({center:true,top:1,content:'Setup'});
  this.UI.pages[2].input1 = this.UI.input({top:4,left:4,label:'Broker IP Address',value:'localhost'});
  this.UI.pages[2].input2 = this.UI.input({top:8,left:4,label:'Broker IP Port',value:'3001'});
  this.UI.pages[2].input3 = this.UI.input({top:12,left:4,label:'Domain',value:'default'});
  
  if (this.UI.screen.height< 34) {
    this.UI.pages[2].but2 = this.UI.button({right:1,content:'More'});
    this.UI.pages[2].but2.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('next');
    });
    this.UI.pages[2].prev=1;
    this.UI.pages[2].next=3;

    this.UI.pages[3].but1 = this.UI.button({left:1,content:'<< Less'});
    this.UI.pages[3].but1.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('prev');
    });
    this.UI.pages[3].label1 = this.UI.label({center:true,top:1,content:'Setup'});
    this.UI.pages[3].label2 = this.UI.label({left:4,top:4,content:'Protocol'});
    this.UI.pages[3].checkbox21 = this.UI.radiobutton({left:4,top:6,text:'HTTP',value:false,group:group});
    this.UI.pages[3].checkbox22 = this.UI.radiobutton({left:4,top:8,text:'TCPIP',value:true,group:group});
    
    this.UI.pages[3].label3 = this.UI.label({left:4,top:10,content:'Messages'});
    this.UI.pages[3].checkbox31 = this.UI.checkbox({left:4,top:12,text:'Agent ID',value:false});
    this.UI.pages[3].checkbox32 = this.UI.checkbox({left:4,top:14,text:'Parent ID',value:false});
    this.UI.pages[3].checkbox33 = this.UI.checkbox({left:4,top:16,text:'Time',value:false});    
    this.UI.pages[3].prev=2;

    if (platform=='android') {
      this.UI.pages[3].but2 = this.UI.button({right:1,content:'Update'});
      this.UI.pages[3].but2.on('press', function(data) {
        self.UI.pages.hide('this');    
        self.UI.pages.show('next');
      });
      this.UI.pages[3].next=8;
    } else {
      this.UI.pages[3].but2 = this.UI.button({right:1,content:'INFO'});
      this.UI.pages[3].but2.on('press', function(data) {
        self.UI.pages.hide('this');    
        self.UI.pages.show('next');
      });
      this.UI.pages[3].next=9;
    }
    
  } else {

    this.UI.pages[2].label2 = this.UI.label({left:4,top:16,content:'Protocol'});
    this.UI.pages[2].checkbox21 = this.UI.radiobutton({left:4,top:18,text:'HTTP',value:false,group:group});
    this.UI.pages[2].checkbox22 = this.UI.radiobutton({left:4,top:20,text:'TCPIP',value:true,group:group});
    
  
    this.UI.pages[2].label3 = this.UI.label({left:4,top:22,content:'Messages'});
    this.UI.pages[2].checkbox31 = this.UI.checkbox({left:4,top:24,text:'Agent ID',value:false});
    this.UI.pages[2].checkbox32 = this.UI.checkbox({left:4,top:26,text:'Parent ID',value:false});
    this.UI.pages[2].checkbox33 = this.UI.checkbox({left:4,top:28,text:'Time',value:false});    
    this.UI.pages[2].prev=1;

    if (platform=='android') {
      this.UI.pages[2].but2 = this.UI.button({right:1,content:'Update'});
      this.UI.pages[2].but2.on('press', function(data) {
        self.UI.pages.hide('this');    
        self.UI.pages.show('next');
      });
      this.UI.pages[2].but2.on('press', function(data) {
        self.UI.pages.hide('this');    
        self.UI.pages.show(8);
      });  
      this.UI.pages[2].next=8;
    } else {
      this.UI.pages[2].but2 = this.UI.button({right:1,content:'INFO'});
      this.UI.pages[2].but2.on('press', function(data) {
        self.UI.pages.hide('this');    
        self.UI.pages.show('next');
      });
      this.UI.pages[2].next=9;    
    }
    
  }
  group++;
  
  /* Network */
  this.UI.pages[4].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[4].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(1);
  });
  this.UI.pages[4].label1 = this.UI.label({center:true,top:1,content:'Network'});
  this.UI.pages[4].but2 = this.UI.button({top:4,center:true, bg:'green',width:'80%',content:'Start'});
  this.UI.pages[4].but2.on('press', function(data) {
    if (self.netStatus == 'Uninitialized') {
      self.UI.pages[4].info1.update('Network starting ..');
      self.UI.screen.render();
      setTimeout(function () {  
        self.netStatus = 'Initialized';
        self.UI.pages[4].info1.update('Connected.');
      },500);
    }
  });
  this.UI.pages[4].but3 = this.UI.button({top:8,center:true, bg:'red',width:'80%',content:'Stop'});
  this.UI.pages[4].but3.on('press', function(data) {
    if (self.netStatus != 'Uninitialized') {
      self.UI.pages[4].info1.update('Network stopping ..');
      setTimeout(function () {  
        self.netStatus = 'Uninitialized';
        self.UI.pages[4].info1.update('Not connected.');
      },500);
    }
  });

  this.UI.pages[4].info1 = this.UI.info({
    center:true,
    top:12,
    width:'80%',
    label:'Status'
  });  
  
  this.UI.pages[4].info1.setValue('Not connected.');
  this.UI.pages[4].prev=1;

  /* JAM */
  this.UI.pages[5].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[5].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(1);
  });
  this.UI.pages[5].label1 = this.UI.label({center:true,top:1,content:'JAM'});
  
  this.UI.pages[5].info1 = this.UI.info({top:4,left:4,width:self.UI.screen.width-8,label:'JAM World'});
  this.UI.pages[5].info2 = this.UI.info({top:8,left:4,width:self.UI.screen.width-8,label:'JAM Name'});
  this.UI.pages[5].info3 = this.UI.info({top:12,left:4,width:self.UI.screen.width-8,label:'JAM Domain'});
  this.UI.pages[5].info4 = this.UI.info({top:16,left:4,width:self.UI.screen.width-8,label:'JAM Status'});

  this.UI.pages[5].info1.setValue(this.options.worldname);
  this.UI.pages[5].info2.setValue(this.options.nodename);
  this.UI.pages[5].info3.setValue(this.options.domain);
  this.UI.pages[5].info4.setValue('Not started.');

  this.UI.pages[5].but2 = this.UI.button({right:1,content:'Start',bg:'green'});
  this.UI.pages[5].but2.on('press', function(data) {
    
  });
  this.UI.pages[5].prev=1;
  /* Agents */
  
  this.UI.pages[6].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[6].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(1);
  });
  this.UI.pages[6].but2 = this.UI.button({right:1,content:'Clear'});
  this.UI.pages[6].but2.on('press', function(data) {
    self.msgWin.clear();
    self.msgWin.log('['+(++i)+'] Again ready.');
  });
  this.UI.pages[6].label1 = this.UI.label({center:true,top:1,content:'Agents'});
  this.UI.pages[6].log1 = this.UI.log({left:4,top:4,height:'50%',label:'Messages'});
  
  this.msgWin = this.UI.pages[6].log1;
  for(var i=0;i < 20; i++)
    this.msgWin.log('Message '+i);
  
  this.UI.pages[6].prev=1;

  /* LOGGING */
  this.UI.pages[7].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[7].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(1);
  });
  this.UI.pages[7].but2 = this.UI.button({right:1,content:'Clear'});
  this.UI.pages[7].but2.on('press', function(data) {
    self.logWin.clear();
    setTimeout(function () {self.logWin.log('['+(++i)+'] Again ready.')},500);
  });
  this.UI.pages[7].label1 = this.UI.label({center:true,top:1,content:'Logging'});
  this.UI.pages[7].log1 = this.UI.log({left:4,top:4,label:'Logging'});
  
  this.logWin = this.UI.pages[7].log1;
  this.logWin.log('Ready.');
  
  this.UI.pages[7].prev=1;
  
  /* Optional UPDATE */
  if (platform=='android') {
    this.UI.pages[8]={};
    this.UI.pages[8].but1 = this.UI.button({left:1,content:'<< Menu',
                                            click:function(){self.UI.pages.hide('this');    
                                                             self.UI.pages.show(1);}});

    this.UI.pages[8].but2 = this.UI.button({right:1,content:'INFO'});
    this.UI.pages[8].but2.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('next');
    });

    this.UI.pages[8].label1 = this.UI.label({center:true,top:1,content:'Software Update'});
    this.UI.pages[8].label2 = this.UI.label({left:4,top:4,content:'Source'});
    this.UI.pages[8].checkbox21 = this.UI.radiobutton({left:4,top:6,text:'Local Download Folder',value:true,group:group});
    this.UI.pages[8].checkbox22 = this.UI.radiobutton({left:4,top:8,text:'Remote Download',value:false,group:group});
  
    this.UI.pages[8].but3 = this.UI.button({top:12,center:true,width:'80%',content:'UPDATE NOW'});
    var dia = self.UI.dialog({width:'70%',height:8,center:true,
                              okButton     : 'Okay'                              
                              
                });
    this.UI.pages[8].but3.on('press', function(data) {
      var data,err,file,n;
      file=process.platform=='android'?'/sdcard/Download/demo.app':'/home/sbosse/proj/jam/build/jamapp/demo.app2';
      data=Io.read_file(file);
      if (!data) err='Reading '+file+': '+Io.error;
      file=process.platform=='android'?'/data/data/jackpal.androidterm/bin/demo.app':'/tmp/data/data/jackpal.androidterm/bin/demo.app';
      if (!err) n=Io.write_file(file,data);
      if (n<=0) err='Reading '+file+': '+Io.error;
      if (err) 
        dia.ask('Update failed: '+err);
      else
        dia.ask('Update done! Transferred '+data.length+' bytes.',function () {});
    });
    this.UI.pages[8].prev=1;
    this.UI.pages[8].next=9;
    
    group++;
  }
  
  /* System Info */
  this.UI.pages[9]={};
  this.UI.pages[9].but1 = this.UI.button({left:1,content:'<< Menu',
                                          click:function(){self.UI.pages.hide('this');    
                                                           self.UI.pages.show(1);}});
  this.UI.pages[9].prev=1;
  this.UI.pages[9].label1 = this.UI.label({center:true,top:1,content:'Sytem Info'});

  this.UI.pages[9].info1 = this.UI.info({top:4,left:4,width:self.UI.screen.width-8,label:'Memory'});
  this.UI.pages[9].info2 = this.UI.info({top:8,left:4,width:self.UI.screen.width-8,label:'Heap Used'});
  this.UI.pages[9].tree1 = this.UI.tree({top:12,left:4,width:self.UI.screen.width-8,
                                         height:self.UI.screen.height-16,label:'System'});
  this.UI.pages[9].tree1.update({
    mem:0,
    heap:0,
    process:[
      'process1',
      'process2'
    ]
  });
  this.UI.pages.on(9,'load',function () {
    var mem=process.memoryUsage();
    self.UI.pages[9].info1.update(String(mem.rss)+' Bytes');
    self.UI.pages[9].info2.update(String(mem.heapUsed)+' Bytes');
    self.UI.pages[9].tree1.update({
      mem:mem.rss,
      heap:mem.heapUsed,
      process:[
        {id:'0'},
        {id:'1'}
      ]
    });
  });
  this.UI.pages.show(1);
  this.UI.pages.hide(2);
  this.UI.pages.hide(3);
  this.UI.pages.hide(4);
  this.UI.pages.hide(5);
  this.UI.pages.hide(6);
  this.UI.pages.hide(7);
  this.UI.pages.hide(8);
  this.UI.pages.hide(9);

  this.info.setValue('Not connected. Currently: '+this.UI.pages[2].input1.getValue()+':'+this.UI.pages[2].input2.getValue());
  //console.log(this.pages[1]);
  this.update = function (full) {
  };

  this.UI.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });
  this.UI.screen.key(['left','right'], function(ch, key) {
    if (key.name=='right' && self.UI.pages[self.UI.page].next){
      self.UI.pages.hide('this');
      self.UI.pages.show('next');    
    } else if (key.name=='left' && self.UI.pages[self.UI.page].prev) {
      self.UI.pages.hide('this');
      self.UI.pages.show('prev');    
    }
  });
  setInterval(function () {self.logWin.log('['+(++i)+'] Message ...')},2000);

}

var ui = new Demo();
ui.UI.start();

