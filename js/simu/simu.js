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
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     02-10-16 by sbosse.
 **    $VERSION:     1.3.8
 **
 **    $INFO:
 **
 **  SEJAM: JavaScript AIOS JAM Agent Simluator
 **         - Terminal (curses) GUI
 **
 **    $ENDOFINFO
 */


var Io = Require('com/io');
var Comp = Require('com/compat');
var Db = Require('db/db');
var blessed = Require('term/blessed');
var current=none;
var Aios = none;
var Papa = Require('parser/papaparse.js');
var Esprima = Require('parser/esprima');

/** Create a simulation world with visualization
 *
 * options: {x:number,y:number,id:string?,terminal:string,gui='term'?,
 *           nolimits:boolean is a disable flag for agent check poininting,
 *           connection:{random:number?},
 *           classes:{node:{..},ac1:{..},..}}
 *
 */
var simuTerm = function (options) {
  var self=this;
  var node1,node2,row,row1,row2,i,j,p;
  
  this.options=options||{};
  if (this.options.x==_) this.options.x=6;
  if (this.options.y==_) this.options.y=6;
  if (this.options.id==_) this.options.id='Dark Universe World';
  if (this.options.connections==_) this.options.connections={};
  if (this.options.markings) this.options.nodebar=true;
  if (this.options.nolimits) Aios.config({nolimits:true});
  
  this.classes=this.options.classes||{};
  delete this.options.classes; 
  this.run=false;
  this.steps=0;
  this.loop=none;
  this.time=0;
  this.time0=0;
  this.log=[];
  this.events=[];

  this.err=function (msg,err) {
    Aios.aios.log('Error: '+msg);
    throw (err||'[SIM] Error');
  }
  this.warn=function (msg) {
    Aios.aios.log('Warning: '+msg);
  }
  
  this.out=function (msg) {
    Aios.aios.log(msg);    
  }
  // PRINT: Smart print function
  var print = function (msg,header,depth,nolog) {
    var lines=[];
    var line='';
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
          // can still contain matrix elements that must bes separated
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
 
    if (nolog) return lines; else Comp.array.iter(lines,function (line) {self.log.log(line)});    
  };
  
  var log = function(){
    if (!current.node || !current.process) {
      print(arguments[0]);
    }
    else if (arguments.length==1)
      print(arguments[0],'['+current.node.id+':'+current.process.agent.id+':'+current.process.pid+':'+current.process.agent.ac+'] ');
    else {
      for (var i in arguments) {
        if (i==0) 
          print(arguments[i],'['+current.node.id+':'+current.process.agent.id+':'+current.process.pid+':'+current.process.agent.ac+'] ');
        else
          print(arguments[i],_,2);
      }
    }
  };
  
  // Extended sandbox environment available for all agents
  Aios.aios0.log=log;
  Aios.aios1.log=log;
  Aios.aios2.log=log;
  Aios.aios0.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios1.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios2.print=function(msg,depth) {return print(msg,_,depth,false)};
  Aios.aios0.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  Aios.aios1.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  Aios.aios2.sprint=function(msg,depth) {return print(msg,_,depth,true)};
  
  
  Aios.config({TIMESCHED:1000});

  this.world = Aios.World.World([],{id:this.options.id,classes:this.classes});
  
  this.screen = blessed.screen({
    smartCSR: false,
    terminal: self.options.terminal||'xterm-color'
    });
  this.screen.title = 'SEJAM (c) Stefan Bosse - '+(this.options.id||'JAM Dark Universe Simulation World');
  this.screen.cursor.color='red';  
  
  // Information bar
  this.info = blessed.textbox({
    top: 0,
    left: 4*9+1,
    width: self.screen.width-4*9-1,
    height: 3,
    label: 'Information',
    focus:false,
    //draggable:true,
    border: {
      type: 'line'
    },
    style: {
      fg:'blue'
    }
  });
  this.screen.append(this.info);

  // Buttons

  function but(options) {
    var obj = blessed.button({
      width: options.width||8,
      left: options.left||0,
      top: options.top||0,
      height: 3,
      align: 'center',
      content: options.content||'?',
      mouse:true,
      focus:true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'blue',
        bold:true,
        border: {
          fg: 'black'
        },
        hover: {
          border: {
            fg: 'red'
          }
        }
      }  
    });
    self.screen.append(obj);
    return obj;
  }

  // Bt QUIT
  this.but1 = but({left:1,content:'QUIT'});
  this.but1.on('press', function(data) {
    return process.exit(0);  
  });
  // Bt RUN
  this.but2 = but({left:9,content:'RUN'});
  this.but2.on('press', function(data) {
    if (self.run) return;
    var curtime=Aios.time();
    var lasttime=curtime;
    if (self.time>0) current.world.lag=current.world.lag+(lasttime-self.time);
    if (self.time0==0) self.time0=curtime;
    self.time=curtime;
    self.log.log('Running simulation at '+self.steps+ ' .. ');
    self.but2.setStyle({bg:'red'});
    Aios.config({iterations:1});
    self.run=true;
    var loop = function () {
        var nexttime=Aios.scheduler();
        self.steps++;
        curtime=Aios.time();
        if (!self.run) return;
        //self.log.log(nexttime);
        if (nexttime>0) self.loop=setTimeout(loop,nexttime);
        else if (nexttime<0) self.loop=setTimeout(loop,0);
        else {
          self.but2.setStyle({bg:'blue'});
          self.log.log('Stopping simulation at '+self.steps+ ' .. (d '+(Aios.time()-self.time)+' ms / t '+(Aios.time()-current.world.lag)+' ms)');
          self.update(true);
          self.time=curtime;
        }
        
        if ((curtime-lasttime)>100) {
          self.update(true);
          lasttime=curtime;
        } else 
          self.update(false);
      }
    self.loop = setTimeout(loop,1);
  });
  // Bt STOP
  this.but3 = but({left:17,content:'STOP'});
  this.but3.on('press', function(data) {
    if (!self.run) return;
    self.log.log('Stopping simulation at '+self.steps+ ' .. (d '+(Aios.time()-self.time)+' ms / t '+(Aios.time()-current.world.lag)+' ms)');
    self.time=Aios.time();
    self.run=false;
    if (self.loop!=none) clearTimeout(self.loop);
    self.but2.setStyle({bg:'blue'});
    self.update(true);
  });
  // Bt STEP
  this.but4 = but({left:25,content:'STEP'});
  this.but4.on('press', function(data) {
    var start,stop;
    var curtime=Aios.time();
    var lasttime=curtime;
    start=curtime;
    if (self.time>0) current.world.lag=current.world.lag+(start-self.time);
    if (self.time0==0) self.time0=start;
    self.time=start;
    self.run=true;
    self.log.log('Stepping simulation ('+self.but5.steps+') at '+self.steps+ ' .. (t '+(Aios.time()-current.world.lag)+' ms)');
    self.but2.setStyle({bg:'red'});
    Aios.config({iterations:1});
    var stepped=self.but5.steps;
    var loop = function () {
        var nexttime=Aios.scheduler();
        self.steps++;
        stepped--;
        curtime=Aios.time();
        if (!self.run) return;
        if (stepped==0) {
          stop=Aios.time();
          self.run=false;
          self.but2.setStyle({bg:'blue'});
          self.log.log('Stopping simulation at '+self.steps+ ' .. (d '+(Aios.time()-self.time)+' ms / t '+(Aios.time()-current.world.lag)+' ms)');
          self.time=stop;
          self.update(true);
          return;      
        }
        if (nexttime>0) self.loop=setTimeout(loop,nexttime);
        else if (nexttime<0) self.loop=setTimeout(loop,0);
        else {
          self.but2.setStyle({bg:'blue'});
          self.log.log('Stopping simulation at '+self.steps+ ' .. (d '+(Aios.time()-self.time)+' ms / t '+(Aios.time()-current.world.lag)+' ms)');
          self.update(true);
          self.time=curtime;
        }
        
        if ((curtime-lasttime)>100) {
          self.update(true);
          lasttime=curtime;
        } else 
          self.update(false);
      }
    self.loop = setTimeout(loop,0);
  });
  // Bt STEPS
  this.but5 = blessed.button({
        width:3,
        top:1,
        left:33,
        height:1,
        align: 'center',
        mouse:true,
        content: '1',
        style: {
          bold:true,
          bg:'blue',
          fg:'white',
          hover: {
            bg: 'red'
          }
        }
      });
  this.but5.steps=1;
  var stepsall = [1,5,10,50,100,500];
  this.but5.on('press', function(data) {
    self.but5.steps=Comp.array.next(stepsall,self.but5.steps);
    self.but5.setContent(Comp.pervasives.string_of_int(self.but5.steps));
    self.screen.render();
  });
  self.screen.append(this.but5);

  // GUI Update
  this.update = function (full) {
    var mem = Io.mem();
    var info = self.world.info();
    var curtime=Aios.time();
    if (self.nodelast!=none)
      self.info.setValue(Comp.printf.sprintf('%s / %d stp. / %d ag. / C %d kB / M %d MB / t %d / d %d',
                         self.node(self.nodelast.i,self.nodelast.j).id,
                         self.steps,
                         info.agents,
                         div(info.transferred,1024),
                         div(mem.data+mem.heap,1024),
                         curtime-current.world.lag,
                         self.run?curtime-current.world.lag-self.time0:self.time-current.world.lag-self.time0));
    else
      self.info.setValue(Comp.printf.sprintf('%d stp. / %d ag. / C %d kB / M %d MB / t %d / d %d',
                         self.steps,
                         info.agents,
                         div(info.transferred,1024),
                         div(mem.data+mem.heap,1024),
                         curtime-current.world.lag,
                         self.run?curtime-current.world.lag-self.time0:self.time-current.world.lag-self.time0));
    if (full) 
     for (var j=0;j<self.options.y;j++) {
      var row=self.nodebuts[j];
      for (var i=0;i<self.options.x;i++) {
        var nodebut=row[i];
        var node=nodebut.object;
        var tsn=0,procn=0;
        // Node Stats
        for (var t in node.ts.db) {
          if (node.ts.db[t]) tsn += Aios.Ts.count(node.ts.db[t]);
        }
        if (tsn>99) tsn='>H';
        procn=node.processes.used;
        if (procn>999) procn='>k';
        nodebut.setContent(Comp.printf.sprintf('%s\n%3s|%2s',self.node(i,j).id,
                            Comp.pervasives.string_of_int(procn),
                            Comp.pervasives.string_of_int(tsn)));
        // Node Markings
        if (self.options.markings) {
          var marked=Comp.array.create(6,false);
          for (var m in self.options.markings) {
            // class:[index(0..),color,optional text]
            // class.property:[index(0..),color,text mapping function]
            var mark = self.options.markings[m];
            var index=mark[0]; var color=mark[1]; 
            var property = Comp.string.postfix(m);
            var ac=Comp.string.prefix(m);
            for (var p in node.processes.table) {
              if (node.processes.table[p]!=_){
                var agent=node.processes.table[p].agent;
                if (agent.ac==ac) {
                  // Agent property marking
                  if (agent[property]!=_) {
                    var val=mark[2](agent[property]);
                    if (val!=none) {
                      marked[index]=true;
                      nodebut.markbuts[index].setStyle({bg:color});
                      if (Comp.obj.isString(val) && val!='') nodebut.markbuts[index].setContent(Comp.string.get(val,0));                      
                    }
                  } else if (ac==property) {
                    var text=mark[2];
                    marked[index]=true;
                    nodebut.markbuts[index].setStyle({bg:color});
                    if (text) nodebut.markbuts[index].setContent(text);
                  }
                }
              }
            }
          }
          for (m in marked) {
            if (!marked[m]) nodebut.markbuts[m].setStyle({bg:'blue'});
            if (!marked[m]) nodebut.markbuts[m].setContent('');
          }
        }
      }
    }
    //if (!self.run) 
    if (full) self.screen.render();
  };
  
  // Simulation World

  this.worldframe = blessed.textbox({
    top: 3,
    left: 1,
    width: self.options.x*8,
    height: self.options.y*(self.options.nodebar?4:3)+1,
    label: 'Simulation World',
    focus:false,
    border: {
      type: 'line'
    },
    style: {
      fg:'blue'
    }
  });

  this.screen.append(this.worldframe);

  this.nodebuts=[];
  this.nodelast=none;
  this.nodes=[];
  
  // Get a node object
  this.node = function (i,j) {
    return this.nodes[j][i];
  };
  // Build the world
  
  for (var j=0;j<this.options.y;j++) {
    var nodebutrow=[];
    var noderow=[];
    for (var i=0;i<this.options.x;i++) {
      var id = Comp.printf.sprintf('N%2d.%2d',i,j);
      var node = Aios.Node.Node({id:id,position:{x:i,y:j}});
      var nodebut = blessed.button({
        width:6,
        top:j*(self.options.nodebar?4:3)+4,
        left:i*8+2,
        height:self.options.nodebar?3:2,
        align: 'left',
        mouse:true,
        content: id+'\n0',
        object:node
      });
      nodebut.options.style.bg='blue';
      this.screen.append(nodebut);
      if (self.options.nodebar) {
        nodebut.markbuts=[];
        for (var m=0;m<6;m++) {
          var markbut = blessed.button({
            width:1,
            top:j*4+6,
            left:i*8+2+m,
            height:1,
            align: 'center',
            mouse:true,
            content: '',
            object:node
          });
          markbut.options.style.bg='blue';
          nodebut.markbuts.push(markbut);
          this.screen.append(markbut);
        }
      }      
      self.world.addNode(node);
      nodebutrow.push(nodebut);
      noderow.push(node);
      (function (i,j,node) {
        nodebut.on('press', function(data) {
          var id = self.node(i,j).id;
          // self.info.setValue(Comp.printf.sprintf(' N%2d.%2d ',i,j));
          self.info.setValue(Comp.printf.sprintf(' %s ',id));
          //self.nodebuts[j][i].setContent('xxx');
          //self.nodebuts[j][i].setStyle({bg:'red'});
          if (self.nodelast!=none) self.nodebuts[self.nodelast.j][self.nodelast.i].setStyle({fg:'white'});
          if (self.worldbut) self.worldbut.setStyle({fg:'white'})
          self.nodelast={i:i,j:j};
          self.nodebuts[j][i].setStyle({fg:'yellow'});
          self.treeview.setLabel(Comp.printf.sprintf(' N%2d.%2d ',i,j));
          var data = node.info();
          for (var p in data) {
            var element=data[p];
            var content=self.maketree(element,data);
            if (content) self.treeview.DATA.children[p]=content;
          }
          self.treeview.setData(self.treeview.DATA);
          self.update();
        })})(i,j,node);
    }
    this.nodebuts.push(nodebutrow);
    this.nodes.push(noderow);
  } 

  function link(n1,n2) {
    var dx=n2.position.x-n1.position.x;
    var dy=n2.position.y-n1.position.y;
    var dir=Aios.DIR.ORIGIN;
    if (self.options.connections.random && 
        Comp.random.float(1.0) > self.options.connections.random) return;
        
    if (dx==1 && dy==0) dir=Aios.DIR.EAST;
    if (dx==-1 && dy==0) dir=Aios.DIR.WEST;
    if (dx==0 && dy==1) dir=Aios.DIR.SOUTH;
    if (dx==0 && dy==0) dir=Aios.DIR.NORTH;
    self.world.connect(dir,n1,n2,self.options.connections);
    var line = blessed.line({
      orientation:dx!=0?'horizontal':'vertical',
      top:dx==0?(dy<0?n1.position.y*(self.options.nodebar?4:3)+(self.options.nodebar?4:3):
                      n1.position.y*(self.options.nodebar?4:3)+(self.options.nodebar?4:3)+3):
                n1.position.y*(self.options.nodebar?4:3)+(self.options.nodebar?5:4),
      left:dy==0?(dx<0?n1.position.x*8:n1.position.x*8+8):(n1.position.x*8+5),
      width:dy==0?2:0,
      height:dx==0?1:0
    });
    self.screen.append(line);
  }

  // Create connections
  for (j=0;j<self.options.y;j++) {
    row1=self.nodebuts[j];
    for (i=0;i<self.options.x;i++) {
      if (i<self.options.x-1) {
        node1=row1[i].object;
        node2=row1[i+1].object;
        link(node1,node2);
      }
      if (j<self.options.y-1) {
        row2=self.nodebuts[j+1];
        node1=row1[i].object;
        node2=row2[i].object;
        link(node1,node2);    
      }
    }
  }   
  // Tree Viewer
  
  this.maketree = function (element,reference) {
    var content,children;
    children={};
    if (Comp.obj.isObject(element)  || Comp.obj.isArray(element)) {
      if (element && element != null && element._update) element._update(element);
      for (var p in element) {
        if (p != '_update')
           children[p]={};
      }
      content={
         children : children,
         data : element
      }
    } else if (element != undefined) {
      var name = element.toString();
      var funpat = /function[\s0-9a-zA-Z_$]*\(/i;
      var isfun=Comp.obj.isFunction(element)||funpat.test(name);
      if (isfun) {
        element=Comp.string.sub(name,0,name.indexOf('{'));
      }
      if (!isfun || (isfun && self.options.showfun)) {
        children[element]={};
        content={children : children,reference:reference};
      }
    } else {
      children[element]={};
      content={children : children};    
    }
    return content;
  };

  this.treeview = blessed.tree({
    top: 3,
    left: self.options.x*8+2,
    width: self.screen.width-self.options.x*8-2,
    height: self.options.y*(self.options.nodebar?4:3)+1,
    label: self.options.info||'Info',
    focus:true,
    border: {
      type: 'line'
    },
    style: {
      border: {
        fg: 'black'
      },
      hover: {
        border: {
          fg: 'red'
        }
      },
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  this.treeviewbut1 = blessed.button({
        width:7,
        top:3,
        left:self.screen.width-26,
        height:1,
        align: 'center',
        mouse:true,
        content: 'SIZE',
        style: {
          bold:true,
          bg:'blue',
          fg:'white',
          hover: {
            bg: 'red'
          }
        }
      });
  this.treeviewbut2 = blessed.button({
        width:7,
        top:3,
        left:self.screen.width-18,
        height:1,
        align: 'center',
        mouse:true,
        content: 'PRINT',
        style: {
          bold:true,
          bg:'blue',
          fg:'white',
          hover: {
            bg: 'red'
          }
        }
      });
  this.treeviewbut3 = blessed.button({
        width:7,
        top:3,
        left:self.screen.width-10,
        height:1,
        align: 'center',
        mouse:true,
        content: 'D1',
        style: {
          bold:true,
          bg:'blue',
          fg:'white',
          hover: {
            bg: 'red'
          }
        }
      });
  this.treeviewbut3.depth=1;
  
  this.treeviewbut1.on('press', function(data) {
    var item=self.treeview.nodeLines[self.treeview.list.getItemIndex(self.treeview.list.selected)];
    try {
      if (item.data) print(Aios.Code.size(item.data));
    } catch (e) { print(0); }
  });
  this.treeviewbut2.on('press', function(data) {
    var item=self.treeview.nodeLines[self.treeview.list.getItemIndex(self.treeview.list.selected)];
    if (item.data) print(item.data,_,self.treeviewbut3.depth); else if (item.children) {
      for (var p in item.children) {
        print(p,_,self.treeviewbut3.depth);
      }
    } else print(item.name);
  });
  this.treeviewbut3.on('press', function(data) {
    if (self.treeviewbut3.depth<3) self.treeviewbut3.depth++;
    else self.treeviewbut3.depth=1;
    self.treeviewbut3.setContent('D'+self.treeviewbut3.depth);
    self.screen.render();
  });
  
  // Create sub-trees
  this.treeview.on('preselect',function(node){  
    var content,children,element,data,name;  
    if (node.name != '/' && !node.extended)  {
      // Io.out(node.extended);
      data = node.data;
      if (data != none && (Comp.obj.isObject(data) || Comp.obj.isArray(data))) {
        node.children = {};
        if (Comp.obj.isArray(data) && Comp.array.empty(data) && Comp.hashtbl.empty(data)) {
          node.children={'[]' : {}};
        } else {
          if (data._update) data._update(data);
          for (var p in data) {
            if (p != '_update') {
              element = data[p];
              content=self.maketree(element,data);
              if (content) node.children[p]=content;
            }
          }
        } 
      } else if (data == none && node.reference) {
          node.children = {};
          element=node.reference[node.name];
          name=element.toString();
          var funpat = /function[\s0-9a-zA-Z_$]*\(/i;
          var isfun=Comp.obj.isFunction(element)||funpat.test(name);
          if (isfun) {
            element=Comp.string.sub(name,0,name.indexOf('{'));
          }          
          node.children[element]={};
      } 
    }
  });
  // Update preview
  this.treeview.on('selected',function(node){
    // self.screen.render();
  });
  this.screen.append(this.treeview);
  this.screen.append(this.treeviewbut1);
  this.screen.append(this.treeviewbut2);
  this.screen.append(this.treeviewbut3);
  
  this.treeview.DATA = {
    name:'/',
    extended:true,
    children: {}
  };
  this.treeview.setData(this.treeview.DATA);
  
  // this.tree.focus();
  

  // Log window
  
  this.log = blessed.Log({
    top: 3+self.options.y*(self.options.nodebar?4:3)+1,
    left: 1,
    width: this.screen.width-1,
    height: this.screen.height-self.options.y*(self.options.nodebar?4:3)-4,
    label: 'Log',
    mouse:true,
    keys:true,
    scrollback:100,
    border: {
      type: 'line'
    },
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        fg: 'cyan',
        inverse: true
      }
    },
    alwaysScroll:true,
    scrollOnInput:true,
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: 'green'
      },
      focus: {
        border: {
          fg: 'red'
        }
      }
    }
  });
  this.screen.append(this.log);

  this.log.key('enter',function (ch,key) {
    self.log.clear();
    self.screen.render();
  });    
  this.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });

  // DB connection?
  if (this.options.db) {
    if (this.options.db.path==_ || this.options.db.channel==_) Io.err('SIMU.DB: invalid options');
    this.db=Db.Sqlc(this.options.db.path,this.options.db.channel);
    if (this.db) {
      this.db.setLog(function (msg) {self.log.log(msg)});
      this.db.init();
    }
  }

  this.csv = {
    read: function (file,callback,verbose) {
      var data;
      var proc;
      Aios.aios.B([
        function () {
          if (verbose) Aios.aios.log('Reading '+file);
          data=Io.read_file(file);
          if (!data) throw 'File read error: '+file;          
        },
        function () {
          var done=false,run=true;
          if (verbose) Aios.aios.log('Parsing '+file);
          Papa.parse(data,{
            complete: function(results) {
              if (verbose) Aios.aios.log('DEL="'+results.meta.delimiter+'" TRUNC='+results.meta.truncated+
                                         ' ABORT='+results.meta.aborted);
              callback.call(current.process.agent,results.data);
              if (!run) Aios.aios.wakeup();
              done=true;
            }
          });
          if (!done)  {
            run=false;
            Aios.aios.sleep();
          }
        },
        function () {
          
        }
      ]);
    }
  };

  // Agent AIOS simulation extensions
  this.aiosX = {
    csv:this.csv,
    db:this.db,
    createOn:function (x,y,ac,args,level) {      
      var node=self.nodes[y][x];
      var agent=none;
      if (level==undefined) level=2;
      if (self.classes[ac])
        agent = Aios.Code.createOn(node,self.classes[ac],args,level);
      if (agent) {
        agent.agent.ac=ac;
        return agent.agent.id; 
      } else return none;
    },
    event: {
      add: function (ev) {
        self.events.push({step:self.steps,node:current.node.id,event:ev});
      },
      get: function () {
        var evl = self.events;
        self.events=[];
        return evl;
      }
    },
    getOn:function (x,y,agentid,property) {
      var node=self.nodes[y][x];
      var agent=node.processes.process(agentid);
      if (agent) {
        return agent.agent[property];
      } else self.log.log('Cannot find agent '+agentid+' on node ['+x+','+y+']'); 
    },
    getNode:function () {return current.node.id},
    getStats: function () {
      var i,j;
      var stats={steps:self.steps};
      for (i in self.world.nodes) {
        var node=self.world.nodes[i];
        for(j in node.processes.table) {
          var proc=node.processes.table[j];
          if (proc && proc.agent.ac) {
            if (stats[proc.agent.ac]==undefined) stats[proc.agent.ac]=1;
            else stats[proc.agent.ac]++;
          }
        }
      }
      return stats;
    },
    getSteps:function () {return self.steps},
    network: {
      x:this.options.x,
      y:this.options.y
    },
    options:this.options,
    print:print,
    setOn:function (x,y,agentid,properties) {
      if (x<0 || x >= self.options.x || y<0 || y>=self.options.y) throw 'setOn: Invalid Argument';
      var node=self.nodes[y][x];
      var agent=node.processes.process(agentid);
      if (agent) {
        for (var p in properties) {
          if (agent.agent[p]!=_) agent.agent[p]=properties[p];
        }
      } else self.log.log('Cannot find agent '+agentid+' on node ['+x+','+y+']'); 
    },
    setOnNode:function (x,y,properties) {
      if (x<0 || x >= self.options.x || y<0 || y>=self.options.y) throw 'setOnNode: Invalid Argument';
      var node=self.nodes[y][x];
      if (node) {
        for (var p in properties) {
          if (node[p]!=_) node[p]=properties[p];
          if (p=='id') {
            var nodebut=self.nodebuts[y][x];
            nodebut.setContent(properties[p]);
          }
        }
      } else self.log.log('Cannot find agent '+agentid+' on node ['+x+','+y+']'); 
    },
    stop: function () {
      if (!self.run) return;
      self.log.log('Stopping simulation at '+self.steps+ ' .. (d '+(Aios.time()-self.time)+' ms / t '+(Aios.time()-current.world.lag)+' ms)');
      self.time=Aios.time();
      self.run=false;
      if (self.loop!=none) clearTimeout(self.loop);
      self.but2.setStyle({bg:'blue'});
      self.update(true);         
    }
  };

  // Extended sandbox environment available for all agents in simulation
  Aios.aios0.simu=this.aiosX;
  Aios.aios1.simu=this.aiosX;
  Aios.aios2.simu=this.aiosX;

  if (options.aios) {
    // Extend AIOS environment(s)
    for (p in options.aios) {
      if (!Aios.aios0[p]) Aios.aios0[p]=options.aios[p];
      if (!Aios.aios1[p]) Aios.aios1[p]=options.aios[p];
      if (!Aios.aios2[p]) Aios.aios2[p]=options.aios[p];
    }
  }
  if (options.aios0) {
    // Extend AIOS environment(s)
    for (p in options.aios0) {
      if (!Aios.aios0[p]) Aios.aios0[p]=options.aios[p];
    }
  }
  if (options.aios1) {
    // Extend AIOS environment(s)
    for (p in options.aios1) {
      if (!Aios.aios1[p]) Aios.aios1[p]=options.aios[p];
    }
  }
  if (options.aios2) {
    // Extend AIOS environment(s)
    for (p in options.aios2) {
      if (!Aios.aios2[p]) Aios.aios2[p]=options.aios[p];
    }
  }
  // Start world agent - if world class is specified
  if (self.classes['world']) {
    // A virtual world node must be created.
    this.worldnode=Aios.Node.Node({id:'World0'});
    this.worldagent=Aios.Code.createOn(this.worldnode,self.classes['world'],[],2);
    this.worldagent.agent.ac='world';
    // Add additional attributes to world agent
    //this.worldagent.agent.options=self.options;
    //for (var p in this.agent) {
    //  this.worldagent.agent[p]=this.agent[p];
    //}
    this.world.addNode(this.worldnode);
    this.worldbut = blessed.button({
        width:1,
        top:3,
        left:self.options.x*8,
        height:1,
        align: 'left',
        mouse:true,
        content: 'W',
        object:self.worldnode,
        style: {
          bold:true,
          bg:'blue',
          fg:'white',
          hover: {
            bg: 'red'
          }
        }
      });
    this.screen.append(this.worldbut);
    (function (node) {
        self.worldbut.on('press', function(data) {
          //self.info.setValue(' World ');
          if (self.nodelast!=none) self.nodebuts[self.nodelast.j][self.nodelast.i].setStyle({fg:'white'});
          self.nodelast=none;
          self.worldbut.setStyle({fg:'yellow'});
          self.treeview.setLabel(' World ');
          var data = node.info();
          for (var p in data) {
            var element=data[p];
            var content=self.maketree(element,data);
            if (content) self.treeview.DATA.children[p]=content;
          }
          self.treeview.setData(self.treeview.DATA);
          self.update();
        })})(this.worldnode);  
  }
  // Start node agents - if node class is specified
  else if (self.classes['node']) {
    Comp.array.iter(self.world.nodes, function (node,i) {
        var agent = Aios.Code.createOn(node,self.classes['node'],[node.position.x,node.position.y]);
        agent.agent.ac='node';
      });
  }

  
}

simuTerm.prototype.start = function () {  
  this.screen.render(); 
  this.out('Initializing ...');
  // AC COMPILING
  for(var c in this.classes) {
    this.out('Compiling agent class '+c+'...');
    this.compile(this.classes[c],c);
  }
  // CONNECTION LINKS
  if(this.options.connections.link) 
    this.out('Setting up physical link(s) ...');
    
  for(var c in this.options.connections.link) {
    var link=this.options.connections.link[c];
    if (!link.from || !link.to || !link.from.url || !link.to.url || link.from.x==undefined || link.from.y==undefined || !link.dir)
      this.err('Invalid link: '+Io.inspect(link));
    this.out(link.from.url+' ['+link.from.x+','+link.from.y+'] -> '+link.to.url+(link.to.x!=_?' ['+link.to.x+','+link.to.y+']':''));
    var row = this.nodes[link.from.y];
    var node = row?row[link.from.x]:_;
    if (!node) 
      this.err('Invalid node reference in link: '+Io.inspect(link));
    this.world.connectPhy(link.dir,node,{rcv:link.from.url,snd:link.to.url,verbose:1,out:this.out});
  }
  this.out('Ready.');
}

var simu = simuTerm;

var JamAnal = Require('jam/analyzer');

simu.prototype.analyze=JamAnal.jamc.prototype.analyze;
simu.prototype.syntax=JamAnal.jamc.prototype.syntax;
simu.prototype.compile = function (ac,name) {
  var syntax,
      modu, 
      content,
      off;
        
  try {
    off=this.syntax.find(this.options.ast,'VariableDeclarator',name);
    if (off && off.loc) this.syntax.offset=off.loc.start.line-1;
    content = 'var ac = '+ac;
    syntax = Esprima.parse(content, { tolerant: true, loc:true });
    this.analyze(syntax,{classname:name,level:2,verbose:1});
    if (this.options.verbose>=0) this.out('Agent class template '+name+' compiled successfully.');
    this.syntax.offset=0;
  } catch (e) {
     this.out('Agent class template '+name+' not compiled successfully: '+e);
  }
  
};


var Simu = function(options) {
  var obj=none;
  if (!options || (options && (options.gui=='term' || !options.gui))) obj = new simuTerm(options);
  return obj;
}

module.exports = {
  simu:simu,
  Simu:Simu,
  current:function (module) { current=module.current; Aios=module; JamAnal.current(module)}
}
