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
 **    $CREATED:     13-12-16 by sbosse.
 **    $VERSION:     1.6.15
 **
 **    $INFO:
 **
 **    JAM APP using jamlib and terminal UI
 **
 **    Command line options:
 **
 **     style:invert|black|simple 
 **     mode:server connect:true
 **     config:<file>
 **
 **    $ENDOFINFO
 */
global.config={simulation:false};

var options = {
  version:'1.6.15'
}

var Io      = Require('com/io');
var Comp    = Require('com/compat');
var JamLib  = Require('top/jamlib');
var Name    = Require('com/pwgen');
var Aios    = JamLib.Aios;
var Net     = Require('dos/network');
var Buf     = Require('dos/buf');
var Obj     = Comp.obj;
var Args    = Comp.args;
var Status  = Net.Status;
var Command = Net.Command;
var Getenv  = Require('com/getenv');
var satelize = Require('dos/ext/satelize');
var UI      = Require('ui/app/app');
var util    = Require('util');
var Proc    = Require('child_process');

var nameopts = {length:8, memorable:true, lowercase:true},
    Nameopts = {length:8, memorable:true, uppercase:true};

var MB = function (bytes) { return int(bytes/1024/1024) }
var styles = {
  simple:{
    button:{
      // border:{type:'line',bg:'white'},
      border:{type:'none'}, 
      black: 'blue',
    },
    info:{
      bg:'black',
      fg:'yellow',
      border:{type:'none'},
      label:{fg:'green',bold:true},
    },
    input:{
      bg:'lightgrey',
      text:{fg:'black'},
      border:{type:'none'}, 
      label:{fg:'green',bold:true},
    },
    label: {
      bold:true,
      fg:'green',
    },
    list: {
      bg:'black',
      border:{type:'none'}, 
      label:{fg:'green',bold:true},
    },
    log:{
      bg:'black',
      border:{type:'none'},  
      label:{fg:'green',bold:true},
    },
    tree: {
      bg:'black',
      border:{type:'none'},
      label:{fg:'green',bold:true},
    },
    keyboard:{
      bg:'yellow',
      border:{type:'ch',ch:' ',bg:'yellow'},
      label:{bg:'yellow',fg:'black'}
    },
    filemanager:{
      bg:'yellow',
      fg:'black',
      arrows: {
        fg:'red',
        bg:'white',
      },
      border:{type:'ch',ch:' ',bg:'yellow'},
      box:{
        bg:'white'
      },
      label:{fg:'white',bg:'yellow'},
      input:{
        bg:'white',
        fg:'black',
      },
    },
  },

  black:{
    button:{
      border:{type:'line',fg:'white'},
      black: 'blue',
    },
    info:{
      fg:'yellow',
      border:{type:'line',fg:'green'},
      label:{fg:'green',bold:true},
    },
    input:{
      fg:'yellow',
      border:{type:'line',fg:'green'},
      label:{fg:'green',bold:true},
    },
    label: {
      bold:true,
      fg:'green',
    },
    list: {
      border:{type:'line',fg:'green'},   
      label:{fg:'green',bold:true},
    },
    tree: {
      border:{type:'line',fg:'green'},
      label:{fg:'green',bold:true},
    },
    keyboard:{
      border:{type:'line'}
    },
    filemanager:{
      border:{type:'line',fg:'green'},
      arrows: {
        fg:'red',
        bg:'default',
      },
      box:{
        bg:'default',
        fg:'white',
        border:{bg:'default',type:'line',fg:'green'}
      },
      input:{
        border:{type:'line'}
      },
      label:{
        fg:'white',
      }
    },
  },
  default: {
    button: {
      black:'black'
    },
    filemanager:{
      border:{type:'line'},
      arrows: {
        fg:'red',
        bg:'default',
      },
      box:{
        bg:'default',
        border:{bg:'default',type:'line'}
      },
      input:{
        border:{type:'line'}
      },
      label:{
        fg:'blue',
      }
    },
    keyboard:{
      border:{type:'line'}
    },
    label:{fg:'black',bold:true},
  }
}
// Create top-level App with UI
var appTerm = function (_options) {
  var self=this,
      id=Name.generate(nameopts),
      log,log2,
      changed=false,
      p;
  this.config = {
    agents: {level:1},
    autoconnect:false,
    domain: 'default',
    expert:false,
    keyboard:false,       // sync with this.UI.options.keyboard
    public:{'IP(1)':{address:'ag-0.de',port:10001,local:'*',enable:true}},
    nodename:id,   // pre-guess
    links:['IP(1)','IP(2)','IP(3)','IP(4)','NORTH','SOUTH','WEST','EAST'],  
    log:{node:false,agent:false,class:false,time:false},
    logJam:{world:false,node:false,pid:false,time:false},
    mode:'gui',
    proto:'udp',
    script:'//Type Here\n',
    security:false,
    sensors:false,
    simple:false,
    verbose:0,        // sync with this.options.verbose
    worldname:id.toUpperCase()
  };
  this.options = {
    configFile:JamLib.environment.config||'jam.app.config',
    env:{},
    geo:undefined,
    hostname:Io.hostname(),
    myip:'localhost',
    monitor:0,
    onexit:false,
    start:false,
    print:console.log,
    verbose:0,
  };
  for(p in _options) this.options[p]=_options[p];

  
  this.err=function (msg,err) {console.log('[APP] Error: '+msg); throw (err||'[JAM] Error')}
  this.warn=function (msg) {console.log('[APP] Warning: '+msg);}
  this.out=this.log=function (msg) {console.log('[APP] '+msg);}
    
  if (!this.options.terminal) this.options.terminal=(process.platform === 'win32' ? 'windows-ansi' : 'xterm-color');
  if (process.platform === 'android') this.config.keyboard=true;
  
  this.readConfig();

  if (JamLib.environment.mode=='server') this.config.mode='server';
  if (this.config.mode=='server' && JamLib.environment.connect=='true') this.config.autoconnect=true;
  
  if (!this.config.nodename) this.out('Setting node name to '+id),this.config.nodename=id,changed=true;
  if (!this.config.worldname) this.config.worldname=id.toUpperCase(),changed=true;
  
  // AIOS extensions we provide
  this.extensions = {
    config: {
      levels:[3],
      fun: function () { return self.config },
      args: 0
    },
    connect: {
      levels:[3],
      fun: function (to) { self.jam.world.connectTo(to); },
      args:1
    }
  }
  
  // Sensor TS provider
  this.provider = function (pat) {
    if (process.sensor) switch (pat.length) {
      case 2:
        switch (pat[0]) {
          case 'SENSORS':
            return [pat[0],process.sensor.info()];
        }
        break;
      case 3:
        switch (pat[0]) {
          case 'SENSOR':
            process.sensor.start(pat[1]);
            return [pat[0],pat[1],process.sensor.read(pat[1])];
        }
        break;
    }
  }
  
  this.events=[];
  this.todo=[];
  this.exit = [];  
  this.status = {initialized:false,run:false,connected:false,connecting:false,error:false};
  this.links = {};
  this.config.links.forEach(function (dir) {
    self.links[dir]=self.config.public[dir]||{};
  });
  
  this.classes={};
  
  if (this.config.mode!='server') log = function (msg) { self.logWin.log(msg) };
  else log = console.log;

  Aios.config({print:log});
  this.err=function (msg,err) {log('[APP] Error: '+msg); throw (err||'[JAM] Error')}
  this.warn=function (msg) {log('[APP] Warning: '+msg);}
  this.out=this.log=function (msg) {log('[APP] '+msg);}
  
  if (this.config.mode!='server') log2 = function (msg) { self.msgWin.log(msg) };
  else log2 = console.log;
  
  Aios.config({printAgent:log2});
  this.log2 = log2;
  
  this.jam = undefined;
  if (this.config.mode!='server') {
    if (this.config.simple || process.argv.indexOf('style:simple')!=-1) 
      this.styles=styles.simple;
    else if (process.platform=='android' || 
        process.platform=='win32' || 
        process.argv.indexOf('style:invert')!=-1 ||
        process.argv.indexOf('style:black')!=-1) 
      this.styles=styles.black;
    else this.styles=styles.default;
  } else {
    this.dialog=console.log;
  }
  
  if (changed) this.saveConfig();
};

appTerm.prototype.connect = function () {  
  var self=this,p,to;
  if (!this.jam || !this.jam.world || this.status.connecting) return;
  this.status.connecting=true;
  setTimeout(function () { self.status.connecting=false; self.update('status') }, 5000);
  for(p in this.links) {
    if (!this.links[p].enable) continue;
    if (p.indexOf('IP')==0 && this.links[p].address && this.links[p].port) {
      to=Aios.Chan.addr2url(this.links[p]);
      this.jam.world.connectTo(Aios.DIR.IP(to));
    }
  }

}

appTerm.prototype.createAgent = function (cls,args,level,confirm) {
  var msg;
  try {
    if (!args) throw 'Invalid arguments';
    if (level == undefined) level=1;
    msg=cls+'('+util.inspect(args)+') Level '+level;
    id=this.jam.createAgent(cls,args,level);
    if (id==null) throw ('Agent creation failed: '+this.jam.error);
    msg += (' : '+id);
    this.log('Created agent '+msg);
    if (confirm) this.dialog('Created agent '+msg);
  } catch (e) {
    this.dialog(msg+' Error: '+e);
  }    
}

appTerm.prototype.emit=function (event,args) {
  var e;
  for (e in this.events) {
    var ev=this.events[e];
    if (ev[0]==event) ev[1](args);
  }
}

appTerm.prototype.init = function () {
  if (this.config.mode!='server') this.setupGui();
}

// INITILIAZE JAM
appTerm.prototype.initJAM = function () {  
  var self=this,options={},connected={},p,status;    
  this.out('Creating JAM ..');
  options.log=this.config.log;
  options.logJam=this.config.logJam;
  options.verbose=this.options.verbose||1;
  options.id=this.config.nodename;
  options.world=this.config.worldname;
  options.provider=this.provider;
  
  // construct connections
  // TODO: multiple IP(*) ports!
  options.connections={};
  for(p in this.links) {
    if (!this.links[p].enable) continue;
    if (p.indexOf('IP')==0 && !options.connections.ip) options.connections.ip={
      from:this.links[p].local?this.links[p].local:'*',
      // to:this.links[p].address?Aios.Chan.addr2url(this.links[p]):undefined,
      on: { 
        'link+': function (url) {
          connected[url]=true;
          self.status.connecting=false; self.status.connected=true;
          self.update('status')
          },
        'link-': function (url) {
          var p,c=0;
          connected[url]=false;
          for(p in connected) if (connected[p]) c++;
          if (c==0) {
            self.status.connecting=false; self.status.connected=false;
            self.update('status')
          }
         } 
      },
      proto:'udp',
      multicast:true
    }
  }
  // this.out(util.inspect(options))
  this.jam=JamLib.Jam(options);
  this.jam.init();
  for(var p in this.extensions) {
    this.jam.extend(this.extensions[p].levels,p,this.extensions[p].fun,this.extensions[p].args);
  }
  this.status.initialized=true;
  for(p in this.classes) {
    status=this.jam.readClass(this.classes[p],{verbose:1});
    if (!status) {this.status.error='Load failed';delete this.classes[p]};
    this.update('status');
  }
}

appTerm.prototype.io = function () {

}

appTerm.prototype.loadClassFile = function (file) {
  var status,self=this,
      mod=Comp.filename.removeext(Comp.filename.basename(file));
  if (mod=='') mod=Comp.filename.basename(file);
  this.classes[mod]=file;
  if (this.status.initialized) {
    try { 
      status=this.jam.readClass(file,
      {
        verbose:1,
        error:function (e) {throw e}
      });
    } catch (e) {self.log(e); status=false};
    if (!status) this.status.error='Load failed',delete this.classes[mod]; else this.status.error=false;
    this.update('status');
    if (!status) this.dialog(this.jam.error);
  }
  if (this.config.mode!='server' && this.UI.pages[this.CS.pages.classes] && 
      this.UI.pages[this.CS.pages.classes].tree1)
    this.UI.pages[this.CS.pages.classes].tree1.set(this.classes);
}



appTerm.prototype.on=function (event,callback) {
  this.events.push([event,callback]);
}

// PRINT: Smart print function // obsolete //
appTerm.prototype.print = function (msg,header,depth,logger) {
  var self = this;
  var lines=[],
      line='';
  if (depth==_) depth=1;
  function isvec(obj) {return(Comp.obj.isArray(obj) && (obj.length == 0 || !Comp.obj.isArray(obj[0])))}
  function ismat(obj) {return(Comp.obj.isArray(obj) && obj.length > 0 && Comp.obj.isArray(obj[0]))}
  function mat(o,depth) {
      // matrix
      var lines=[];
      var line = '';
      if (header) {line=header; header=_};
      for (var j in o) {
        var row=o[j];
        line += Comp.printf.list(row,function (v) {
          return (Comp.obj.isArray(v)?(depth>0?'['+vec(v,depth-1)+']':'[..]'):
                                       Comp.obj.isObj(v)?(depth>0?obj(v,depth-1):'{..}'):v);
        });
        lines.push(line);
        line='';
      }    
      return lines;
  }
  function vec(v,depth) {
      // vector
      var lines=[];
      var line = '';
      if (header) {line=header; header=_};
      if (v.length==0) return(line+'[]');
      else {
        // can still contain matrix elements that must be separated
        var sep='',sepi='';
        for (var p in v) {
          if (ismat(v[p])) {              
            //self.log.log(line); line='  ';
            if (depth>0) {
              lines = mat(v[p],depth-1);
              line += sep+'['; sepi='';
              Comp.array.iter(lines,function (line2) {
                line += sepi+'['+line2+']';
                sepi=',';
              });
              line += ']';
              sep=',';
            } else {
              line += sep+'[[..]]';
              sep=',';
            }
          }
          else if (isvec(v[p])) {
            //self.log.log(line); line='  ';
            line += sep+vec(v[p],depth-1);
            sep=',';
          }
          else {
            line += sep+(Comp.obj.isArray(v[p])?(depth>0?vec(v[p],depth-1):'[..]'):
                                                Comp.obj.isObj(v[p])?(depth>0?obj(v[p],depth-1):'{..}'):v[p]);
            sep=',';
          }
        }
        if (line!='') return line;
      }
  }
  function obj(o,depth) {
    var line='';
    var sep='';
    if (header) {line=header; header=_};
    line += '{';
    for (var p in o) {
      if (!Comp.obj.isFunction(o[p])) {
        line += sep + p+':'+
          (Comp.obj.isArray(o[p])?(depth>0?vec(o[p],depth-1):'[..]'):
                                  Comp.obj.isObj(o[p])?(depth>0?obj(o[p],depth-1):'{..}'):o[p]);
        sep=',';
      } else {
        line += sep + p+':'+'function()';
        sep=',';
      }
    }      
    return line+'}';
  }

  function str(s) {
    var line='';
    var lines=[];
    var lines2 = Comp.string.split('\n',msg);
    if (header) {line=header; header=_};
    if (lines2.length==1)
      lines.push(line+msg);
    else {
      Comp.array.iter(lines2,function (line2,i) {
        if (i==0) lines.push(line+line2);
        else lines.push(line2);
      });
    } 
    return lines;
  }

  if (ismat(msg)) lines = Comp.array.concat(lines,
                                            Comp.array.map(mat(msg,depth-1),function (line){
                                                return '    '+line}));
  else if (Comp.obj.isString(msg)) lines = Comp.array.concat(lines,str(msg));
  else if (isvec(msg)) lines.push(vec(msg,depth-1));
  else if (Comp.obj.isObj(msg)) lines.push(obj(msg,depth-1));
  else {
    if (header) {line=header; header=_};
    line += msg;
    lines.push(line);      
  }

  if (logger==undefined) return lines; else 
    Comp.array.iter(lines,function (line) {logger(line)});    
}

/** quit app
 *
 */
appTerm.prototype.quit = function (stat) {
  this.saveConfig();
  return process.exit(stat);
}

/** Read configuation file
 *
 */
appTerm.prototype.readConfig = function (file) {
  // TODO
  var text,config;
  if (!file) file=this.options.configFile;
  this.out('Reading config file '+file);
  text=Io.read_file(file);
  if (text) {
    try { config=JSON.parse(text); for(var p in config) this.config[p]=config[p] } 
    catch (e) {this.err('Parsing config file failed: '+e)};
  }
}

/** Save configuation file
 *
 */
appTerm.prototype.saveConfig = function (file) {
  // TODO
  var text=JSON.stringify(this.config,null,2);
  if (!file) file=this.options.configFile;
  this.out('Saving config file '+file);
  Io.write_file(file,text);
}

appTerm.prototype.setupGui = function () {
  var self=this,
      page,
      p,i,x,y,first;
  // Information bar visible on all pages
  this.UI = UI.UI({
    pages:20,
    styles:this.styles,
    terminal:this.options.terminal,
    title:'JAMAPP (C) Stefan Bosse'
  });
  this.UI.init();
  this.UI.options.keyboard=this.config.keyboard;
  
  // Layout configuration
  this.CF = {
    fm: {
      height:this.UI.layout.small?this.UI.screen.height-4:Math.min(25,this.UI.screen.height-4),
      top:2,
      width:this.UI.layout.small?this.UI.screen.width:'60%',
    },
    info:{
      top:this.UI.layout.small?this.UI.screen.height-4:this.UI.screen.height-3,
      height:this.UI.layout.small?4:3
    },
    menu: {
      buttons:{
        top:4
      }
    },
    setup: {
      checkboxes:{
        x0:this.UI.layout.small?4:4,
        x1:this.UI.layout.small?20:int(this.UI.screen.width/2),
        y0:this.UI.layout.small?16:12,
        y1:this.UI.layout.small?24:20,
        left2:this.UI.layout.small?4:30,
        left3:this.UI.layout.small?4:4,
        top3:this.UI.layout.small?5:4,
        left4:this.UI.layout.small?4:50,
        top4:this.UI.layout.small?15:12,
      },
      labels:{
        input:{
          top:this.UI.layout.small?9:5,
          center:this.UI.layout.small?undefined:true,
          left:this.UI.layout.small?'65%':undefined,
        },
        top1:{
          content:this.UI.layout.small?'Setup':'Setup [Links]',
        },
        top2:{
          content:this.UI.layout.small?'Setup':'Setup [JAM]',      
        },
        top23:{
          content:this.UI.layout.small?'Setup':undefined,    
        },
        top3:{
          content:this.UI.layout.small?'Script':'Setup [Script]',    
        },
        top4:this.UI.layout.small?13:10
      },
      inputs:{
        remoteip:{
          top:4,
          left:4,
          right:undefined,
          width:this.UI.layout.small?'80%':int(this.UI.screen.width/2)-10
        },
        remoteipp:{
          top:this.UI.layout.small?8:4,
          left:this.UI.layout.small?4:undefined,
          right:this.UI.layout.small?undefined:4,
          width:this.UI.layout.small?'50%':int(this.UI.screen.width/2)-10
        },
        localip:{
          top:this.UI.layout.small?12:8,
          left:this.UI.layout.small?4:undefined,
          right:this.UI.layout.small?undefined:4,
          width:this.UI.layout.small?'50%':int(this.UI.screen.width/2)-10
        },
        protect:{
          top:this.UI.layout.small?16:8,
          left:4,
          right:undefined,
          width:this.UI.layout.small?'50%':int(this.UI.screen.width/2)-10
        },
        script:{
          top:4,
          left:2,
          height:this.UI.screen.height-8,
          width:this.UI.screen.width-4
        }
      },
    },
    control:{
      center:this.UI.layout.small?undefined:true,
      left:this.UI.layout.small?1:undefined,
      left2:this.UI.layout.small?1:'10%',
      right2:this.UI.layout.small?1:'10%',
      width:this.UI.layout.small?this.UI.screen.width-2:'80%',
      width2:this.UI.layout.small?12:'30%',
      info1:{
        height:this.UI.layout.small?4:3,
      }
    },
    classes:{
      center:this.UI.layout.small?undefined:true,
      left:this.UI.layout.small?1:undefined,
      left2:this.UI.layout.small?1:'10%',
      right2:this.UI.layout.small?1:'10%',
      width:this.UI.layout.small?this.UI.screen.width-2:'80%',
      width2:this.UI.layout.small?this.UI.screen.width/2-2:'40%',
      labels:{
        center:this.UI.layout.small?undefined:true,
        right:this.UI.layout.small?4:undefined,
        top:this.UI.layout.small?'Classes':'Agent Classes',
      }
    },
    stats:{
      left:this.UI.layout.small?1:4,
      width:this.UI.layout.small?this.UI.screen.width-4:self.UI.screen.width-8,
      labels:{
        center:true,
        right:undefined,
        top:this.UI.layout.small?'Info':'System Info',
      }
    },
    explorer:{
      left:this.UI.layout.small?1:4,
      right:this.UI.layout.small?1:4,
      width:this.UI.layout.small?this.UI.screen.width-4:self.UI.screen.width-8,
      labels:{
        center:this.UI.layout.small?undefined:true,
        right:this.UI.layout.small?4:undefined,
        top:'Explorer',
      }
    },
    log1:{
      left:this.UI.layout.small?1:4,
      width:this.UI.layout.small?this.UI.screen.width-4:undefined
    },
    log2:{
      left:this.UI.layout.small?1:4,
      width:this.UI.layout.small?this.UI.screen.width-4:undefined
    }
  }
  
  
  // Layout independent content structure
  this.CS = {
    agents:{
      buttons:{
        clear:this.UI.button({left:this.CF.log1.left,top:4,content:'Clear',bg:'green'}),
      },
      log1:this.UI.log({left:this.CF.log1.left,width:this.CF.log1.width,
                        top:8,height:this.UI.screen.height-12,label:'Agent Messages',
                        arrows:{up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}})
    },
    dialog: function (msg,callback) {
      var lines = int(msg.length/(self.UI.screen.width/2-4))+2;
      var dia = self.UI.dialog({
        width:self.UI.layout.small?'80%':'50%',
        height:lines+4,
        center:true,
        okButton     : 'Okay'
      });
      dia.ask(msg,function () {dia.destroy(); if (callback) callback()})
    },
    info: this.UI.info({
      top:this.CF.info.top,
      width:this.UI.screen.width-2,
      height:this.CF.info.height,
      wrap:true,
      label:'Information'
    }),
    menu: {
      buttons:{
        top:4,
        quit:this.UI.button({left:1,content:'QUIT'}),
        setup:this.UI.button({right:1,content:'SETUP'}),
        control:this.UI.button({top:this.CF.menu.buttons.top,center:true,bg:'blue',width:'80%',content:'Control'}),
        jam:this.UI.button({top:this.CF.menu.buttons.top+4,center:true,bg:'blue',width:'80%',content:'JAM'}),
        agents:this.UI.button({top:this.CF.menu.buttons.top+8,center:true,bg:'blue',width:'80%',content:'Agents'}),
        logging:this.UI.button({top:this.CF.menu.buttons.top+12,center:true,bg:'blue',width:'80%',content:'Logging'}),
      },
      labels:{
        top:this.UI.label({
          center:true,top:1,
          content:'JAMapp'+(this.UI.layout.small?'':(' '+options.version+' (Dr. Stefan Bosse)'))
        }),
      }
    },
    setup: {
      buttons:{
        less1:this.UI.button({left:1,content:'<< Less'}),
        less2:this.UI.layout.small?this.UI.button({left:1,content:'<< Less'}):undefined,
        less3:this.UI.button({left:1,content:'<< Less'}),
        menu:this.UI.button({left:1,content:'<< Menu'}),
        more1:this.UI.button({right:1,content:'More'}),
        more2:this.UI.layout.small?this.UI.button({right:1,content:'More'}):undefined,
        more3:this.UI.button({right:1,content:'Script'}),
      },
      checkboxes:{
        agentid:this.UI.checkbox({left:4,top:12,text:'Agent ID',value:this.config.log.agent}),
        parentid:this.UI.checkbox({left:4,top:14,text:'Parent ID',value:this.config.log.parent}),
        agenttime:this.UI.checkbox({left:4,top:16,text:'Time',value:this.config.log.time}),
        agentclass:this.UI.checkbox({left:4,top:18,text:'Class',value:this.config.log.class}),
        msgpid:this.UI.checkbox({left:this.CF.setup.checkboxes.left2,top:this.CF.setup.checkboxes.top4,text:'PID',value:this.config.logJam.pid}),
        msgnode:this.UI.checkbox({left:this.CF.setup.checkboxes.left2,top:this.CF.setup.checkboxes.top4+2,text:'Node',value:this.config.logJam.node}),
        msgworld:this.UI.checkbox({left:this.CF.setup.checkboxes.left2,top:this.CF.setup.checkboxes.top4+4,text:'World',value:this.config.logJam.world}),
        msgtime:this.UI.checkbox({left:this.CF.setup.checkboxes.left2,top:this.CF.setup.checkboxes.top4+6,text:'Time ',value:this.config.logJam.time}),
        verbose:this.UI.checkbox({left:this.CF.setup.checkboxes.left3,top:this.CF.setup.checkboxes.top3,text:'Verbose',value:false}),
        softkey:this.UI.checkbox({left:this.CF.setup.checkboxes.left3,top:this.CF.setup.checkboxes.top3+2,text:'Soft Keyboard',value:this.config.keyboard}),
        expert:!this.UI.layout.small?this.UI.checkbox({left:this.CF.setup.checkboxes.left3,top:this.CF.setup.checkboxes.top3+4,text:'Expert Mode',value:this.config.expert}):undefined,
        security:!this.UI.layout.small?this.UI.checkbox({left:this.CF.setup.checkboxes.left2,top:this.CF.setup.checkboxes.top3+4,text:'Security',value:this.config.security}):
                                     this.UI.checkbox({left:this.CF.setup.checkboxes.left3,top:this.CF.setup.checkboxes.top3+6,text:'Security',value:this.config.security})
                                       ,
        sensors:!this.UI.layout.small?this.UI.checkbox({left:this.CF.setup.checkboxes.left2,top:this.CF.setup.checkboxes.top3+2,text:'Sensors',value:this.config.sensors}):undefined,
        simple:!this.UI.layout.small?this.UI.checkbox({left:this.CF.setup.checkboxes.left2,top:this.CF.setup.checkboxes.top3,text:'Simple UI',value:this.config.simple}):
                                     this.UI.checkbox({left:this.CF.setup.checkboxes.left3,top:this.CF.setup.checkboxes.top3+4,text:'Simple UI',value:this.config.simple})
                                     ,
        http:this.UI.layout.small?this.UI.radiobutton({left:4,top:6,text:'HTTP',value:false,group:2}):
             this.UI.radiobutton({left:this.CF.setup.checkboxes.left4,top:12,text:'HTTP',value:false,noshow:config.expert,group:2}),
        udp:this.UI.layout.small?this.UI.radiobutton({left:4,top:8,text:'UDP',value:true,group:2}):
            this.UI.radiobutton({left:this.CF.setup.checkboxes.left4,top:14,text:'UDP',value:true,noshow:config.expert,group:2}),
        autoconnect:this.UI.layout.small?this.UI.checkbox({left:4,top:10,text:'Autoconnect',value:this.config.autoconnect}):
            this.UI.checkbox({left:this.CF.setup.checkboxes.left4,top:16,text:'Autoconnect',value:this.config.autoconnect}),
      },
      inputs:{
        remoteip:this.UI.input({top:this.CF.setup.inputs.remoteip.top,
                                left:this.CF.setup.inputs.remoteip.left, 
                                width:this.CF.setup.inputs.remoteip.width, 
                                label:'Remote IP Address',value:this.links[this.config.links[0]].address||''}),
        remoteipp:this.UI.input({top:this.CF.setup.inputs.remoteipp.top,
                                left:this.CF.setup.inputs.remoteipp.left, 
                                right:this.CF.setup.inputs.remoteipp.right, 
                                width:this.CF.setup.inputs.remoteipp.width, 
                                label:'Remote IP Port',value:String(this.links[this.config.links[0]].port||'')}),
        localip:this.UI.input({top:this.CF.setup.inputs.localip.top,
                               left:this.CF.setup.inputs.localip.left,
                               right:this.CF.setup.inputs.localip.right,
                                width:this.CF.setup.inputs.localip.width, 
                               label:'Local IP Port',
                               value:
                               this.links[this.config.links[0]].local?String(this.links[this.config.links[0]].local):'*'}),
        protect:this.UI.input({top:this.CF.setup.inputs.protect.top,
                               left:this.CF.setup.inputs.protect.left,
                               right:this.CF.setup.inputs.protect.right,
                                width:this.CF.setup.inputs.protect.width, 
                               label:'Security Key',
                               value:
                               '(00)[0:0:0:0:0:0]'}),
        script:this.UI.input({
          top:this.CF.setup.inputs.script.top,
          center:this.CF.setup.inputs.script.center,
          left:this.CF.setup.inputs.script.left,
          width:this.CF.setup.inputs.script.width,
          height:this.CF.setup.inputs.script.height,
          label:'Start Script',
          multiline:true,
          scrollable:true,
          value:this.config.script,
        }),
      },
      labels:{
        agentflags:this.UI.label({left:4,top:10,content:'Agent Message Flags'}),
        input:this.UI.label({center:this.CF.setup.labels.input.center,
                             left:this.CF.setup.labels.input.left,
                             right:this.CF.setup.labels.input.right,
                             top:this.CF.setup.labels.input.top,
                             content:'IP(1)',mutable:true}),
        messageflags:this.UI.label({left:this.CF.setup.checkboxes.left2,top:this.CF.setup.labels.top4,content:'JAM Message Flags'}),
        protocol:this.UI.layout.small?this.UI.label({left:4,top:4,content:'Link Protocol (IP)'}):
                                      this.UI.label({left:this.CF.setup.checkboxes.left4,top:10,
                                      content:'Link Protocol (IP)',
                                      noshow:options.expert}),
        top1:this.UI.label({center:true,top:1,content:this.CF.setup.labels.top1.content}),
        top2:this.UI.layout.large?undefined:this.UI.label({center:true,top:1,content:this.CF.setup.labels.top2.content}),
        top23:this.UI.layout.small?this.UI.label({center:true,top:1,content:this.CF.setup.labels.top23.content}):undefined,
        top3:this.UI.layout.small?this.UI.label({right:1,top:1,content:this.CF.setup.labels.top3.content}):this.UI.label({center:true,top:1,content:this.CF.setup.labels.top3.content}),
      },
    },
    control:{
      buttons:{
        start:this.UI.button({top:4,center:this.CF.control.center,left:this.CF.control.left,bg:'green',width:this.CF.control.width,content:'Start'}),
        stop:this.UI.button({top:8,center:this.CF.control.center,left:this.CF.control.left,bg:'lightgrey',width:this.CF.control.width,content:'Stop'}),
        connect:this.UI.button({top:12,left:this.CF.control.left2,bg:'blue',width:this.CF.control.width2,content:'Connect'}),
        reset:this.UI.button({top:12,right:this.CF.control.right2,bg:'blue',width:this.CF.control.width2,content:'Reset'}),
      },
      info1:this.UI.info({
        left:this.CF.control.left,
        center:this.CF.control.center,
        top:16,
        width:this.CF.control.width,
        height:this.CF.control.info1.height,
        wrap:true,
        label:'Status'
      }),
      labels:{
        top:this.UI.label({center:true,top:1,content:'Control'}),
      }
    },
    classes:{
      buttons:{
        load:this.UI.button({top:4,left:this.CF.classes.left2,bg:'green',width:this.CF.classes.width2,content:'Load'}),
        execute:this.UI.button({top:4,right:this.CF.classes.right2,bg:'blue',width:this.CF.classes.width2,content:'Execute'}),
        create:this.UI.button({top:8,center:this.CF.classes.center,left:this.CF.classes.left,bg:this.styles.button.black,width:this.CF.classes.width,content:'Create'}),
      },
      checkboxes:{
        level0:this.UI.radiobutton({left:'55%',top:17,text:'0',value:false,group:20}),
        level1:this.UI.radiobutton({left:'55%',top:19,text:'1',value:true,group:20}),
        level2:this.UI.radiobutton({left:'75%',top:17,text:'2',value:false,group:20}),
        level3:this.UI.radiobutton({left:'75%',top:19,text:'3',value:false,group:20})
      },
      labels:{
        top:this.UI.label({center:this.CF.classes.labels.center,right:this.CF.classes.labels.right,top:1,content:this.CF.classes.labels.top}),
        level:this.UI.label({left:'55%',top:15,content:'Level'}),
      },
      inputs:{
        arguments:this.UI.input({
          top:12,
          right:this.CF.classes.right2,
          width:this.CF.classes.width2,
          label:'Arguments',
          value:'{}'
        }),
      },
      lists:{
        classes:this.UI.list({
          top:12,
          left:this.CF.classes.left2,
          height:this.UI.screen.height-16,
          width:this.CF.classes.width2,
          label:'Classes',
          depth:1
        }),
      }
    },
    stats:{
      buttons:{
        back:this.UI.button({left:1,content:'<< Menu'}),
        explorer:this.UI.button({right:1,content:'Explorer'}),
      },
      infos:{
        mem:this.UI.info({top:4,left:this.CF.stats.left,width:this.CF.stats.width,label:'Memory'}),
        com:this.UI.info({top:8,left:this.CF.stats.left,width:this.CF.stats.width,label:'Communication'}),
      },
      labels:{
        top:this.UI.label({
          center:this.CF.stats.labels.center,
          right:this.CF.stats.labels.right,
          top:1,
          content:this.CF.stats.labels.top
        }),
      },
      tree1:this.UI.tree({top:12,
                          left:this.CF.stats.left,
                          width:this.CF.stats.width,
                          height:self.UI.screen.height-16,
                          label:'System',
                          arrows:{up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}})
    },
    explorer:{
      buttons:{
        back:this.UI.button({left:1,content:'<< Info'}),
        killall:this.UI.button({left:this.CF.explorer.left,top:4,content:'KILL All'}),
        kill:this.UI.button({right:this.CF.explorer.right,top:4,content:'KILL'}),
      },
      labels:{
        top:this.UI.label({
          center:this.CF.explorer.labels.center,
          right:this.CF.explorer.labels.right,
          top:1,
          content:this.CF.explorer.labels.top
        }),
      },
      tree1:this.UI.tree({top:8,
                          left:this.CF.explorer.left,
                          width:this.CF.explorer.width,
                          height:self.UI.screen.height-12,
                          label:'Agents',
                          arrows:{up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}})
    },
    log1:this.UI.log({
      left:this.CF.log1.left,
      top:4,
      width:this.CF.log1.width,
      label:'Logging',
      arrows:{up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}
    }),
    pages:{
    }
  }
  
  this.dialog = this.CS.dialog;

  this.info = this.CS.info;
  this.info.setValue('Not started. Not connected. Screen '+this.UI.screen.width+'x'+this.UI.screen.height);

  function set(label,flag) {
    switch (label) {
      case 'Agent ID': self.config.log.agent=flag; break;
      case 'Parent ID': self.config.log.parent=flag; break;
      case 'Time': self.config.log.time=flag; break;
      case 'Class': self.config.log.class=flag; break;
      case 'PID': self.config.logJam.pid=flag; break;
      case 'Node': self.config.logJam.node=flag; break;
      case 'World': self.config.logJam.world=flag; break;
      case 'Time ': self.config.logJam.time=flag; break;
      case 'Level': self.config.agents.level=flag; break;
    }
  }

  /* MENU */
  page=1;
  this.CS.pages.menu=page;

  this.UI.pages[page].quit = this.CS.menu.buttons.quit;
  this.CS.menu.buttons.quit.on('press', function(data) {
    return self.quit(0);  
  });
  this.UI.pages[page].label1 = this.CS.menu.labels.top;
  this.UI.pages[page].but2 = this.CS.menu.buttons.setup;
  this.CS.menu.buttons.setup.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.setup);
  });
  this.UI.pages[page].but3 = this.CS.menu.buttons.control;
  this.CS.menu.buttons.control.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.control);
  });
  this.UI.pages[page].but4 = this.CS.menu.buttons.jam;
  this.CS.menu.buttons.jam.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.jam);
    // if (!self.status.run) { self.dialog('You need to start JAM first!');}
  });
  this.UI.pages[page].but5 = this.CS.menu.buttons.agents;
  this.CS.menu.buttons.agents.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.agents);
  });
  this.UI.pages[page].but6 = this.CS.menu.buttons.logging;
  this.CS.menu.buttons.logging.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.logging);
  });
  this.UI.pages[page].next=page+1;

  /* SETUP (1) */
  page=2;
  this.CS.pages.setup=page;
  this.UI.pages[page].but1 = this.CS.setup.buttons.menu;
  this.CS.setup.buttons.menu.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show('prev');
  });
  if (this.UI.layout.size != 'large') {
    this.UI.pages[page].but2 = this.CS.setup.buttons.more1;
    this.CS.setup.buttons.more1.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('next');
    });
  }  
  this.UI.pages[page].label1 = this.CS.setup.labels.top1;
  this.UI.pages[page].input1 = this.CS.setup.inputs.remoteip;
  this.UI.pages[page].input2 = this.CS.setup.inputs.remoteipp;
  this.UI.pages[page].input3 = this.CS.setup.inputs.localip;
  this.UI.pages[page].input4 = this.CS.setup.inputs.protect;
  this.UI.pages[page].label2 = this.CS.setup.labels.input;
  if (!this.config.security) this.CS.setup.inputs.protect.noshow=true;
  
  this.CS.setup.inputs.remoteip.on('set content',function () {
    var p=self.CS.setup.labels.input.getContent();
    self.links[p].address=self.CS.setup.inputs.remoteip.getValue();
  });
  this.CS.setup.inputs.remoteipp.on('set content',function () {
    var p=self.CS.setup.labels.input.getContent();
    self.links[p].port=Number(self.CS.setup.inputs.remoteipp.getValue());
  });
  this.CS.setup.inputs.localip.on('set content',function () {
    var p=self.CS.setup.labels.input.getContent(),
        v=self.CS.setup.inputs.localip.getValue();
    
    self.links[p].local=v;
    if (p.indexOf('IP')==0) // All IP ports share same local IP listening port 
      for(p in self.links) 
        if (p.indexOf('IP')==0) self.links[p].local=v;
  });
  x=this.CF.setup.checkboxes.x0,y=this.CF.setup.checkboxes.y0; 
  for (p in this.links) {
    function make(p) {
      self.UI.pages[page][p]=self.UI.checkbox({left:x,top:y,text:p,value:self.links[p].enable});
      if (!self.UI.layout.small) {
        if (p.indexOf('IP')==0) {
          self.UI.pages[page][p+'-proto-udp']=self.UI.radiobutton({left:x+10,top:y,text:'UDP',value:true,group:p,hidden:!self.config.expert});
          self.UI.pages[page][p+'-proto-http']=self.UI.radiobutton({left:x+18,top:y,text:'HTTP',value:false,group:p,hidden:!self.config.expert});
        }
      }
      self.UI.pages[page][p].on('check',function () {
        self.CS.setup.labels.input.setValue(p);
        self.CS.setup.inputs.remoteip.setValue(self.links[p].address||'');
        self.CS.setup.inputs.remoteipp.setValue(String(self.links[p].port||''));
        self.CS.setup.inputs.localip.setValue(String(self.links[p].local||'*'));
        self.links[p].enable=true;
      });
      self.UI.pages[page][p].on('uncheck',function () {
        self.CS.setup.labels.input.setValue(p);
        self.CS.setup.inputs.remoteip.setValue(self.links[p].address||'');
        self.CS.setup.inputs.remoteipp.setValue(String(self.links[p].port||''));
        self.CS.setup.inputs.localip.setValue(String(self.links[p].local||'*'));
        self.links[p].enable=false;
      });
    }
    make(p);
    y += 2;
    if (y==this.CF.setup.checkboxes.y1) x=this.CF.setup.checkboxes.x1,y=this.CF.setup.checkboxes.y0;
  }
  this.UI.pages[page].prev=page-1;
  
  if (this.UI.layout.small) {
    /***** SMALL *******/
    this.UI.pages[page].next=3;
    /* SETUP (2) */
    page=3
    this.CS.pages.setup2=page;
    this.UI.pages[page].but1 = this.CS.setup.buttons.less1;
    this.UI.pages[page].label1 = this.CS.setup.labels.top2;
    this.CS.setup.buttons.less1.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('prev');
    });
    this.UI.pages[page].but2 = this.CS.setup.buttons.more2;
    this.CS.setup.buttons.more2.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('next');
    });
    this.UI.pages[page].label2 = this.CS.setup.labels.protocol;
    this.UI.pages[page].checkbox21 = this.CS.setup.checkboxes.http;
    this.UI.pages[page].checkbox22 = this.CS.setup.checkboxes.udp;
    this.UI.pages[page].checkbox23 = this.CS.setup.checkboxes.autoconnect;
    this.CS.setup.checkboxes.autoconnect.on('check',function () {self.config.autoconnect=true});
    this.CS.setup.checkboxes.autoconnect.on('uncheck',function () {self.config.autoconnect=false});

    this.UI.pages[page].label3 = this.CS.setup.labels.agentflags;
    this.UI.pages[page].checkbox31 = this.CS.setup.checkboxes.agentid;
    this.UI.pages[page].checkbox32 = this.CS.setup.checkboxes.parentid;
    this.UI.pages[page].checkbox33 = this.CS.setup.checkboxes.agenttime;    
    this.UI.pages[page].checkbox34 = this.CS.setup.checkboxes.agentclass;    
    
    this.UI.pages[page].prev=page-1;
    this.UI.pages[page].next=page+1;
    /* SETUP (3) */
  
    page=4;
    this.CS.pages.setup3=page;
    this.UI.pages[page].but1 = this.CS.setup.buttons.less2;
    this.UI.pages[page].label1 = this.CS.setup.labels.top23;
    this.CS.setup.buttons.less2.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('prev');
    });
    this.UI.pages[page].but2 = this.CS.setup.buttons.more3;
    this.CS.setup.buttons.more3.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('next');
    });

    this.UI.pages[page].checkbox5 = this.CS.setup.checkboxes.softkey;
    this.CS.setup.checkboxes.softkey.on('check',function () {self.UI.options.keyboard=self.config.keyboard=true});
    this.CS.setup.checkboxes.softkey.on('uncheck',function () {self.UI.options.keyboard=self.config.keyboard=false});

    this.UI.pages[page].checkbox6 = this.CS.setup.checkboxes.verbose;
    this.CS.setup.checkboxes.verbose.on('check',function () {self.options.verbose=2});
    this.CS.setup.checkboxes.verbose.on('uncheck',function () {self.options.verbose=1});

    this.UI.pages[page].checkbox7 = this.CS.setup.checkboxes.simple;
    this.CS.setup.checkboxes.simple.on('check',function () {self.config.simple=true});
    this.CS.setup.checkboxes.simple.on('uncheck',function () {self.config.simple=false});

    this.UI.pages[page].checkbox8 = this.CS.setup.checkboxes.security;
    this.CS.setup.checkboxes.security.on('check',function () {self.config.security=true});
    this.CS.setup.checkboxes.security.on('uncheck',function () {self.config.security=false});

    this.UI.pages[page].label4 = this.CS.setup.labels.messageflags;
    this.UI.pages[page].checkbox41 = this.CS.setup.checkboxes.msgpid;
    this.UI.pages[page].checkbox42 = this.CS.setup.checkboxes.msgnode;
    this.UI.pages[page].checkbox43 = this.CS.setup.checkboxes.msgworld;    
    this.UI.pages[page].checkbox44 = this.CS.setup.checkboxes.msgtime;


    this.UI.pages[page].prev=page-1;
    this.UI.pages[page].next=page+1;
    
    /* SETUP (4) SCRIPT*/
    page++;    
    this.CS.pages.setup4=page;
    this.UI.pages[page].but1 = this.CS.setup.buttons.less3;
    this.UI.pages[page].label1 = this.CS.setup.labels.top3;
    this.CS.setup.buttons.less3.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('prev');
    });
    this.UI.pages[page].input1 = this.CS.setup.inputs.script;
    this.UI.pages[page].input1.on('set content',function () {
      self.config.script = self.CS.setup.inputs.script.getContent();
    });
    this.UI.pages[page].prev=page-1;
    
  } else if (this.UI.layout.normal) {
    /***** NORMAL *******/
    this.UI.pages[page].next=page+1;
    /* SETUP (2) */
    page=3;
    this.CS.pages.setup2=page;
    this.UI.pages[page].but1 = this.CS.setup.buttons.less1;
    this.CS.setup.buttons.less1.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('prev');
    });
    this.UI.pages[page].but2 = this.CS.setup.buttons.more3;
    this.CS.setup.buttons.more3.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('next');
    });
    this.UI.pages[page].label1 = this.CS.setup.labels.top2;
    
    this.UI.pages[page].label2 = this.CS.setup.labels.protocol;
    this.UI.pages[page].checkbox21 = this.CS.setup.checkboxes.http;
    this.UI.pages[page].checkbox22 = this.CS.setup.checkboxes.udp;
    this.UI.pages[page].checkbox23 = this.CS.setup.checkboxes.autoconnect;
    this.CS.setup.checkboxes.autoconnect.on('check',function () {self.config.autoconnect=true});
    this.CS.setup.checkboxes.autoconnect.on('uncheck',function () {self.config.autoconnect=false});

    if (this.config.expert) {
      this.CS.setup.labels.protocol.noshow=true;
      this.CS.setup.checkboxes.http.noshow=true;
      this.CS.setup.checkboxes.udp.noshow=true;
    }

    this.UI.pages[page].label3 = this.CS.setup.labels.agentflags;
    this.UI.pages[page].checkbox31 = this.CS.setup.checkboxes.agentid;
    this.UI.pages[page].checkbox32 = this.CS.setup.checkboxes.parentid;
    this.UI.pages[page].checkbox33 = this.CS.setup.checkboxes.agenttime;    
    this.UI.pages[page].checkbox34 = this.CS.setup.checkboxes.agentclass;    

    this.UI.pages[page].label4 = this.CS.setup.labels.messageflags;
    this.UI.pages[page].checkbox41 = this.CS.setup.checkboxes.msgpid;
    this.UI.pages[page].checkbox42 = this.CS.setup.checkboxes.msgnode;
    this.UI.pages[page].checkbox43 = this.CS.setup.checkboxes.msgworld;    
    this.UI.pages[page].checkbox44 = this.CS.setup.checkboxes.msgtime;

    this.UI.pages[page].checkbox5 = this.CS.setup.checkboxes.expert;
    this.CS.setup.checkboxes.expert.on('check',function () {
      self.config.expert=true;
      for (var p in self.links) {
        if (p.indexOf('IP')==0) {
          self.UI.pages[self.CS.pages.setup][p+'-proto-udp'].noshow=false;
          self.UI.pages[self.CS.pages.setup][p+'-proto-http'].noshow=false;
        }
      }
      self.CS.setup.labels.protocol.noshow=true;
      self.CS.setup.checkboxes.udp.noshow=true;
      self.CS.setup.checkboxes.http.noshow=true;
    });
    this.CS.setup.checkboxes.expert.on('uncheck',function () {
      self.config.expert=false;
      for (var p in self.links) {
        if (p.indexOf('IP')==0) {
          self.UI.pages[self.CS.pages.setup][p+'-proto-udp'].noshow=true;
          self.UI.pages[self.CS.pages.setup][p+'-proto-http'].noshow=true;
        }
      }
      self.CS.setup.labels.protocol.noshow=false;
      self.CS.setup.checkboxes.udp.noshow=false;
      self.CS.setup.checkboxes.http.noshow=false;
    });

    this.UI.pages[page].checkbox6 = this.CS.setup.checkboxes.softkey;
    this.CS.setup.checkboxes.softkey.on('check',function () {self.UI.options.keyboard=self.config.keyboard=true});
    this.CS.setup.checkboxes.softkey.on('uncheck',function () {self.UI.options.keyboard=self.config.keyboard=false});

    this.UI.pages[page].checkbox7 = this.CS.setup.checkboxes.verbose;
    this.CS.setup.checkboxes.verbose.on('check',function () {self.options.verbose=2});
    this.CS.setup.checkboxes.verbose.on('uncheck',function () {self.options.verbose=1});

    this.UI.pages[page].checkbox8 = this.CS.setup.checkboxes.security;
    this.CS.setup.checkboxes.security.on('check',function () {
      self.config.security=true;
      self.CS.setup.inputs.protect.noshow=false;
    });
    this.CS.setup.checkboxes.security.on('uncheck',function () {
      self.config.security=false; 
      self.CS.setup.inputs.protect.noshow=true;
    });
    this.UI.pages[page].checkbox9 = this.CS.setup.checkboxes.sensors;
    this.CS.setup.checkboxes.sensors.on('check',function () {
      self.config.sensors=true;
    });
    this.CS.setup.checkboxes.sensors.on('uncheck',function () {
      self.config.sensors=false; 
    });
    this.UI.pages[page].checkbox10 = this.CS.setup.checkboxes.simple;
    this.CS.setup.checkboxes.simple.on('check',function () {
      self.config.simple=true;
    });
    this.CS.setup.checkboxes.simple.on('uncheck',function () {
      self.config.simple=false; 
    });

    for(i=1;i<=4;i++) {
      this.UI.pages[page]['checkbox3'+i].on('check',function (arg) {set(arg.text,true)});
      this.UI.pages[page]['checkbox3'+i].on('uncheck',function (arg) {set(arg.text,false)});
      this.UI.pages[page]['checkbox4'+i].on('check',function (arg) {set(arg.text,true)});
      this.UI.pages[page]['checkbox4'+i].on('uncheck',function (arg) {set(arg.text,false)});
    }

    this.UI.pages[page].prev=page-1;
    this.UI.pages[page].next=page+1;
    /* SETUP (3) SCRIPT*/
    page++;    
    this.CS.pages.setup3=page;
    this.UI.pages[page].but1 = this.CS.setup.buttons.less3;
    this.UI.pages[page].label1 = this.CS.setup.labels.top3;
    this.CS.setup.buttons.less3.on('press', function(data) {
      self.UI.pages.hide('this');    
      self.UI.pages.show('prev');
    });
    this.UI.pages[page].input1 = this.CS.setup.inputs.script;
    this.UI.pages[page].input1.on('set content',function () {
      self.config.script = self.CS.setup.inputs.script.getContent();
    });
    this.UI.pages[page].prev=page-1;
    
  } else {
    /***** BIG *******/
    // TODO BIG LAYOUT
    
  }

  /* CONTROL */
  page++;
  this.CS.pages.control=page;
  this.UI.pages[page].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[page].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(1);
  });
  
  if (process.platform === 'android') {
    // Hide keyboard button
    this.UI.pages[page].but1X = this.UI.button({right:1,content:'Hide KB'});
    this.UI.pages[page].but1X.on('press', function(data) {
      if (Proc) Proc.exec('input keyevent 4', function (err,stdout,stderr) {
        self.log('Hide KB: '+err+'/'+stdout+'/'+stderr);
      });
    });
  }

  this.UI.pages[page].label1 = this.CS.control.labels.top;
  this.UI.pages[page].but2 = this.CS.control.buttons.start;
  this.UI.pages[page].but2.on('press', function(data) {
    if (!self.run) {
      if (!self.status.initialized) self.initJAM();
      self.startJAM();
    }
    self.update('status');
    self.UI.pages[self.CS.pages.control].but2.setStyle({bg:'lightgrey'});
    self.UI.pages[self.CS.pages.control].but3.setStyle({bg:'red'});
  });
  this.UI.pages[page].but3 = this.CS.control.buttons.stop;
  this.UI.pages[page].but3.on('press', function(data) {
    if (self.run) {
      self.stopJAM();
    }
    self.update('status');
    self.UI.pages[self.CS.pages.control].but2.setStyle({bg:'green'});
    self.UI.pages[self.CS.pages.control].but3.setStyle({bg:'lightgrey'});
  });
  this.UI.pages[page].but4 = this.CS.control.buttons.connect;
  this.UI.pages[page].but4.on('press', function(data) {
    self.connect();
    self.update('status');
  });
  this.UI.pages[page].but5 = this.CS.control.buttons.reset;
  this.UI.pages[page].but5.on('press', function(data) {
    if (self.run) {
      self.stopJAM();
    }
    if (self.jam) self.jam=undefined,self.status.initialized=false;
    self.update('status');
  }); 
  this.UI.pages[page].info1 = this.CS.control.info1;    
  this.UI.pages[page].info1.setValue('Not connected.');
  
  this.UI.pages[page].prev=this.CS.pages.menu;

  /* JAM */
  page++;
  this.CS.pages.jam=page;
  this.UI.pages[page].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[page].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.menu);
  });
  this.UI.pages[page].label1 = this.UI.label({center:true,top:1,content:'JAM'});
  
  this.UI.pages[page].info1 = this.UI.info({top:4,left:4,width:self.UI.screen.width-8,label:'JAM World'});
  this.UI.pages[page].info2 = this.UI.info({top:8,left:4,width:self.UI.screen.width-8,label:'JAM Node'});
  this.UI.pages[page].info3 = this.UI.info({top:12,left:4,width:self.UI.screen.width-8,label:'JAM Domain'});
  this.UI.pages[page].info4 = this.UI.info({top:16,left:4,width:self.UI.screen.width-8,label:'JAM Status'});

  this.UI.pages[page].info1.setValue(this.config.worldname);
  this.UI.pages[page].info2.setValue(this.config.nodename);
  this.UI.pages[page].info3.setValue(this.config.domain);
  this.UI.pages[page].info4.setValue('Not started.');

  this.UI.pages[page].but2 = this.UI.button({right:1,content:'Info'});
  this.UI.pages[page].but2.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.stats);
    
  });
  this.UI.pages[page].prev=this.CS.pages.menu;
  this.UI.pages[page].next=page+1;
  
  /* STATISTICS */
  page++;
  this.CS.pages.stats=page;
  this.UI.pages[page].but1 = this.CS.stats.buttons.back;
  this.CS.stats.buttons.back.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.jam);
  });
  this.UI.pages[page].but2 = this.CS.stats.buttons.explorer;
  this.CS.stats.buttons.explorer.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show('next');
  });
  this.UI.pages[page].label1 = this.CS.stats.labels.top;

  this.UI.pages[page].info1 = this.CS.stats.infos.mem;
  this.UI.pages[page].info2 = this.CS.stats.infos.com;
  this.UI.pages[page].tree1 = this.CS.stats.tree1;
  this.CS.stats.tree1.update({
    mem:0,
    heap:0,
  });
  function updateStatTree (element) {
    var mem=process.memoryUsage(),
        stats={
          mem:{
            _value:mem.rss,
            // update beefore branch extend
            _update:function (data) {data._value=process.memoryUsage().rss}       
          },
          heap:{
            _value:mem.heapUsed,
            // update before branch extend
            _update:function (data) {data._value=process.memoryUsage().heapUsed}       
          }            
        },
        p,q,node,id,pro,
        sensor,sensors=process.sensor && process.sensor.info();
    var node = self.jam?self.jam.stats('node'):undefined;
    
    if (node) {
      stats.node={};
      for(p in node) {
        stats.node[p]={
          _value : node[p],
          _update:(function (p) { return function (data) { data._value=self.jam.stats('node')[p] }})(p)
        }
      }
    }
    if (self.config.sensors && sensors) {
      stats.sensors={};
      for(p in sensors) {
        sensor=sensors[p];
        stats.sensors[sensor]=(function (s) { 
            return {
            _value:process.sensor.read(s),
            _update:function (data) { data._value = process.sensor.read(s)}
            }})(typeof sensor == 'string'?sensor:sensor[2]);
      }
    }
    if (element) element=stats;
    if (self.jam) {
      node=self.jam.world.nodes[0];
      stats.connections={};
      for(q in node.connections) {
        if (node.connections[q]) stats.connections[q]={count:node.connections[q].count()+' Bytes'};
      }
      stats.agents={};
      for(q in node.processes.table) {
        if (!node.processes.table[q]) continue;
        pro=node.processes.table[q];
        id=pro.agent.id;
        stats.agents[id]={pid:pro.pid,class:pro.agent.ac,time:pro.consumed,level:pro.level};
      }        
    }
    stats._update=updateStatTree;
    if (!element) self.UI.pages[self.CS.pages.stats].tree1.update(stats);
  }
  this.UI.pages.on(page,'load',function () {
    var mem=process.memoryUsage();
    self.UI.pages[self.CS.pages.stats].info1.update('Total: '+String(MB(mem.rss))+' MB, Heap: '+String(MB(mem.heapUsed))+' MB');
    self.UI.pages[self.CS.pages.stats].info2.update('0 MB');
    updateStatTree();
  });
  this.UI.pages[page].prev=this.CS.pages.jam;
  this.UI.pages[page].next=page+1;
  
  /* EXPLORER */
  page++;
  this.CS.pages.explorer=page;
  this.UI.pages[page].but1 = this.CS.explorer.buttons.back;
  this.CS.explorer.buttons.back.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.stats);
  });
  this.UI.pages[page].but2 = this.CS.explorer.buttons.killall;
  this.CS.explorer.buttons.killall.on('press', function(data) {
    if (self.jam) self.jam.kill('*');
    updateAdminTree();
  });
  this.UI.pages[page].but3 = this.CS.explorer.buttons.kill;
  this.CS.explorer.buttons.kill.on('press', function(data) {
    // TODO kill selected agent
    updateAdminTree();
  });

  this.UI.pages[page].label1 = this.CS.explorer.labels.top;
  this.UI.pages[page].prev=this.CS.pages.stats;
  this.UI.pages[page].tree1 = this.CS.explorer.tree1;
  var _test=0;
  function updateAgent(node,id) {
    return function (data) {
    var p,pro=node.getAgentProcess(id);
      var pro=node.getAgentProcess(id);
      if (pro) {
        for(p in pro.agent) data[p]=pro.agent[p];
      } else for(p in data) delete data[p]; 
    }
  }
  function updateAdminTree (element) {
    var stats={},p,q,node,id,pro;
    
    if (element) element=stats;
    if (self.jam) {
      node=self.jam.world.nodes[0];
      for(q in node.processes.table) {
        if (!node.processes.table[q]) continue;
        pro=node.processes.table[q];
        id=pro.agent.ac+'.'+pro.agent.id+' (L'+pro.level+' T'+pro.consumed+')';
        stats[id]={};
        stats[id]._update=updateAgent(node,pro.agent.id);
        for(p in pro.agent) {
          stats[id][p]=pro.agent[p];
        }
      }
    }
    stats._update=updateAdminTree;
    if (!element) self.UI.pages[self.CS.pages.explorer].tree1.update(stats);
  }
  this.UI.pages.on(page,'load',function () {
    updateAdminTree();
  });  
  
  /* AGENTS */
  page++;
  this.CS.pages.agents=page;
  this.UI.pages[page].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[page].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(self.CS.pages.menu);
  });
  this.UI.pages[page].but2 = this.UI.button({right:1,content:'Config'});
  this.UI.pages[page].but2.on('press', function(data) {
    self.UI.pages.hide('this'); 
    self.UI.pages.show('next');
  });
  this.UI.pages[page].label1 = this.UI.label({center:true,top:1,content:'Agents'});
  this.UI.pages[page].but3 = this.CS.agents.buttons.clear;
  this.UI.pages[page].but3.on('press', function(data) {
    self.msgWin.clear();
  });
  this.UI.pages[page].log1 = this.CS.agents.log1;
  this.UI.pages[page].prev=this.CS.pages.menu;
  
  this.msgWin = this.CS.agents.log1;
  this.log2('Agent message window ready.');
     
  /* CLASSES */
  page++;
  this.CS.pages.classes=page;
  this.UI.pages[page].label1 = this.CS.classes.labels.top;
  this.UI.pages[page].but1 = this.UI.button({left:1,content:'<< Agents'});
  this.UI.pages[page].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show('prev');
  });

  this.UI.pages[page].but2 = this.CS.classes.buttons.load;
  this.UI.pages[page].but3 = this.CS.classes.buttons.execute;
  this.CS.classes.buttons.load.on('press', function(data) {
    var status;
    if (self.UI.pages[self.CS.pages.classes].fm && !self.UI.pages[self.CS.pages.classes].fm.hidden) {
      return
    };
    if (!self.UI.pages[self.CS.pages.classes].fm) {
      self.UI.pages[self.CS.pages.classes].fm =
        self.UI.fileManager({
          cwd:process.env.CWD||process.env.PWD,
          parent:this.screen,
          top:self.CF.fm.top,
          hidden:true,
          autohide:true,
          width:self.CF.fm.width,
          height:self.CF.fm.height,
          input:{mutable:true},
          box:{},
          arrows:{up:'[-]',down:'[+]',width:3,height:1}
        });
      self.UI.pages[self.CS.pages.classes].fm.refresh();
      self.UI.pages[self.CS.pages.classes].fm.on('file',function (file) {
        self.loadClassFile(file);
      });
    }
    self.UI.pages[self.CS.pages.classes].fm.show();
    self.UI.pages[self.CS.pages.classes].fm.focus();
  });
  this.CS.classes.buttons.execute.on('press', function(data) {
    var status;
    if (self.UI.pages[self.CS.pages.classes].fm && !self.UI.pages[self.CS.pages.classes].fm.hidden) {
      return
    };
    if (!self.UI.pages[self.CS.pages.classes].fm) {
      self.UI.pages[self.CS.pages.classes].fm =
        self.UI.fileManager({
          cwd:process.env.CWD||process.env.PWD,
          parent:this.screen,
          top:self.CF.fm.top,
          hidden:true,
          autohide:true,
          width:self.CF.fm.width,
          height:self.CF.fm.height,
          input:{mutable:true},
          box:{},
          arrows:{up:'[-]',down:'[+]',width:3,height:1}
        });
      self.UI.pages[self.CS.pages.classes].fm.refresh();
      self.UI.pages[self.CS.pages.classes].fm.on('file',function (file) {
      });
    }
    self.UI.pages[self.CS.pages.classes].fm.show();
    self.UI.pages[self.CS.pages.classes].fm.focus();
  });
  this.UI.pages[page].but4 = this.CS.classes.buttons.create;
  this.CS.classes.buttons.create.on('press', function(data) {
    var args,cls,msg,id;
    if (!self.status.run) return self.dialog('You need to start JAM first!');
    if (!self.UI.pages[self.CS.pages.classes].tree1.getSelected()) return self.dialog('No class selected!');
    cls=self.UI.pages[self.CS.pages.classes].tree1.getSelected().getContent();
    try {
      eval('args='+self.UI.pages[self.CS.pages.classes].input1.getValue());
      if (!args) throw 'Invalid arguments';
      self.createAgent(cls,args,self.config.agents.level,true);
    } catch (e) {
      self.dialog(msg+' Error: '+e);
    }    
  });
  
  this.UI.pages[page].tree1 = this.CS.classes.lists.classes;
  this.UI.pages[page].input1 = this.CS.classes.inputs.arguments;
  
  this.UI.pages[page].label2 = this.CS.classes.labels.level;
  this.UI.pages[page].checkbox21 = this.CS.classes.checkboxes.level0;
  this.UI.pages[page].checkbox22 = this.CS.classes.checkboxes.level1;
  this.UI.pages[page].checkbox23 = this.CS.classes.checkboxes.level2;
  this.UI.pages[page].checkbox24 = this.CS.classes.checkboxes.level3;
  for(i=1;i<=4;i++) {
    this.UI.pages[page]['checkbox2'+i].on('check',function (arg) {set('Level',Number(arg.text))});
  }
  
  this.UI.pages.on(page,'load',function() {
    self.UI.pages[self.CS.pages.classes].tree1.set(self.classes);  
  });
  this.UI.pages[page-1].next=page;
  this.UI.pages[page].prev=page-1;

  /* LOGGING */
  page++;
  this.CS.pages.logging=page;
  this.UI.pages[page].but1 = this.UI.button({left:1,content:'<< Menu'});
  this.UI.pages[page].but1.on('press', function(data) {
    self.UI.pages.hide('this');    
    self.UI.pages.show(1);
  });
  this.UI.pages[page].but2 = this.UI.button({right:1,content:'Clear',bg:'green'});
  this.UI.pages[page].but2.on('press', function(data) {
    self.logWin.clear();
  });
  this.UI.pages[page].label1 = this.UI.label({center:true,top:1,content:'Logging'});
  this.UI.pages[page].log1 = this.CS.log1;
  
  this.logWin = this.CS.log1;
  this.log('JAMapp Version '+options.version+'. (c) Dr. Stefan Bosse');

  this.UI.pages[page].prev=this.CS.pages.menu;
  
  this.UI.pages.show(1);
  for(i=2;i<=20;i++) this.UI.pages.hide(i);

  this.info.setValue('Not connected. Not started. Screen '+
                     this.UI.screen.width+'x'+this.UI.screen.height+
                     ' '+(this.UI.layout.small?'S':'N')+' '+process.platform);
  //console.log(this.pages[1]);

  this.UI.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return self.quit(0);
  });

  this.UI.screen.key(['left','right'], function(ch, key) {
    if (key.name=='right' && self.UI.pages[self.UI.page].next){
      if (self.UI.page==self.CS.pages.menu) {
        switch (self.CS.menu.selected) {
          case -1:
            self.UI.pages.hide('this');
            self.UI.pages.show(self.CS.pages.setup);
            break;
          case 0:
            self.UI.pages.hide('this');
            self.UI.pages.show(self.CS.pages.control);
            break;
          case 1:
            self.UI.pages.hide('this');
            self.UI.pages.show(self.CS.pages.jam);
            break;
          case 2:
            self.UI.pages.hide('this');
            self.UI.pages.show(self.CS.pages.agents);
            break;
          case 3:
            self.UI.pages.hide('this');
            self.UI.pages.show(self.CS.pages.logging);
            break;
        }  
      } else {
        self.UI.pages.hide('this');
        self.UI.pages.show('next');
      } 
    } else if (key.name=='left' && self.UI.pages[self.UI.page].prev) {
      self.UI.pages.hide('this');
      self.UI.pages.show('prev');
    }
  });
  this.CS.menu.selected=-1;
  this.UI.screen.key(['up','down'], function(ch, key) {
    if (key.name=='up' && self.UI.page==self.CS.pages.menu  && self.CS.menu.selected >= 0){
      self.CS.menu.selected--;
      switch (self.CS.menu.selected) {
        case -1:
          self.CS.menu.buttons.control.setStyle({bg:'blue'});
          break;
        case 0:
          self.CS.menu.buttons.jam.setStyle({bg:'blue'});
          self.CS.menu.buttons.control.setStyle({bg:'red'});
          break;
        case 1:
          self.CS.menu.buttons.agents.setStyle({bg:'blue'});
          self.CS.menu.buttons.jam.setStyle({bg:'red'});
          break;
        case 2:
          self.CS.menu.buttons.logging.setStyle({bg:'blue'});
          self.CS.menu.buttons.agents.setStyle({bg:'red'});
          break;
      }
      self.UI.screen.render();
    } else if (key.name=='down' && self.UI.page==self.CS.pages.menu && self.CS.menu.selected < 3) {
      self.CS.menu.selected++;
      switch (self.CS.menu.selected) {
        case 0:
          self.CS.menu.buttons.control.setStyle({bg:'red'});
          break;
        case 1:
          self.CS.menu.buttons.control.setStyle({bg:'blue'});
          self.CS.menu.buttons.jam.setStyle({bg:'red'});
          break;
        case 2:
          self.CS.menu.buttons.jam.setStyle({bg:'blue'});
          self.CS.menu.buttons.agents.setStyle({bg:'red'});
          break;
        case 3:
          self.CS.menu.buttons.agents.setStyle({bg:'blue'});
          self.CS.menu.buttons.logging.setStyle({bg:'red'});
          break;
      }
      self.UI.screen.render();
    }
  });
}

appTerm.prototype.start = function () {
  var self=this;
  if (this.config.mode!='server') this.UI.start(); 
  else {
    if (!self.run) {
      if (!self.status.initialized) self.initJAM();
      self.startJAM();
    }  
  }
  //setTimeout(function (){process.exit(0)},10000);
}


appTerm.prototype.startScript = function (script) {
  var self=this;
  function load(file) {
    self.out('[SCRIPT] Loading agent class file '+file);
    self.loadClassFile(file);
  }
  function create(cls,args,level) {
    self.out('[SCRIPT] Creating agent '+cls+'()');
    self.createAgent(cls,args,level);
  }
  try {
    eval(script);
  } catch (e) {
    self.out('Script execution failed: '+e);
  }
}

appTerm.prototype.startJAM = function () {
  var self=this;
  this.run=true;
  // Start up JAM 
  if (this.config.mode!='server') this.UI.pages[this.CS.pages.control].info1.setValue('JAM starting ..');
  this.jam.start(function () {
    self.out('JAM started.');
    if (self.config.mode!='server') {
      self.UI.pages[self.CS.pages.control].info1.setValue('JAM and NET started.');
      self.UI.pages[self.CS.pages.jam].info4.setValue('JAM running.');
    }
    self.status.run=true;
    self.update('status');
    if (self.config.autoconnect)
      self.connect();
    // Execute start script
    self.startScript(self.config.script);
  });
  
}

appTerm.prototype.stopJAM = function () {  
  this.run=false;
  // Stop JAM
  this.UI.pages[this.CS.pages.control].info1.setValue('JAM stopping ..');
  this.jam.stop();
  this.status.run=false;
  this.update('status');
  if (this.config.mode!='server') {
    this.UI.pages[this.CS.pages.control].info1.setValue('JAM and NET stopped.');
    this.UI.pages[this.CS.pages.jam].info4.setValue('JAM stopped.');
  }
  this.out('JAM stopped.');
}

appTerm.prototype.update = function (what) {
  var s,sep;
  switch (what) {
    case 'status': 
      s='';
      s += this.status.initialized?'Initialized.':'Not initialized.';
      s += this.status.run?' Running.':' Not running.';
      s += this.status.connected?' Connected.':' Not connected.';
      s += this.status.connecting?' Connecting ..':'';
      s += this.status.error?(' Error:'+this.status.error):'';
      if (this.config.mode!='server') this.info.setValue(s);
      break;
    case true:
      // full update
      break;
  }
}

var App = function(options) {
  var obj=none;
  obj = new appTerm(options);
  return obj;
}

var JA = App();
JA.init ();
JA.start ();

