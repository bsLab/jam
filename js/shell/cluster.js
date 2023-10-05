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
 **    $INITIAL:     (C) 2006-2020 bLAB
 **    $CREATED:     1-9-19 by sbosse.
 **    $VERSION:     1.3.3
 **
 **    $INFO: 
 **
 **    Automatic JAM Shell Cluster Manager
 **
 **  var workers = new Cluster(options);
 **  workers.start()
 **
 **  typeof @options = {
 **    cluster?:clusterdesc [],
 **    verbose?:number,
 **    connect?:boolean,
 **    rows?:number,
 **    cols?:number,
 **    port0?:number is private IP port base for grid links,
 **    port1?:number is public IP port base,
 **    portn?:number is public IP delta,
 **    proto?:string [] is public IP protocoll list,
 **    poll?: function (gridprocess),
 **    secure?:string is AMP security port,
 **    todo?: string is default command for worker,
 **  }
 **
 **  typeof clusterdesc = {
 **    id:string|number,
 **    todo;string,
 **    ports?:number|{port:number,proto:string}|dir [],
 **    connect?:{from:dir,to:dir} [],
 **    poll?:function|number
 **  }
 **  type gridprocess = {
 **  }
 ** 
 **  TODO:
 **   - Grid reconnect (pro.cluster.connect) after worker restart
 **   - Check internal links (satisfy above)
 **
 **    $ENDOFINFO
 **
 */
var Comp    = Require('com/compat');
var CP      = Require('child_process')
var osutils = Require('os/osutils');
var program = process.argv[1];
var Aios    = none;

var PS = {
  START   : 'PS.START',   // starting
  STOP    : 'PS.STOP',    // stopping
  RUN     : 'PS.RUN',     // running 
  RESTART : 'PS.RESTART', // restarting
  DEAD    : 'PS.DEAD',    // killed - non existing anymore
  EXIT    : 'PS.EXIT',    // on exit
  DEAF    : 'PS.DEAF',    // not responding
}



/** Create the CLUSTER (Grid of physical nodes)
 */
function Cluster(options,shell) {
  var i,j,n,m,self=this,poll;
  function pos2index(col,row) {
    return row*self.grid.cols+col;
  }
  function pos2ip(col,row,dir) {
    var off=0;
    switch (dir) {
      case DIR.NORTH: off=0; break; 
      case DIR.WEST:  off=1; break; 
      case DIR.EAST:  off=2; break; 
      case DIR.SOUTH: off=3; break; 
    }
    return self.options.port0+row*self.grid.cols*4+col*4+off;
  }
  function addr(port) {
    return 'localhost:'+port;
  }
  function ports(col,row) {
    // Create public ports if any
    var port;
    if (options.port1 && options.proto) {
      port=options.port1+pos2index(col,row)*(options.portn||options.proto.length)-1;
      return options.proto.map(function (proto) {
        port++;
        return DIR.IP(proto+'://'+addr(port)+
                      (options.secure?'?secure='+options.secure:''));
      })
    } else return [];
  }
  this.cluster  = options.cluster;
  this.options  = options;
  this.logging  = options.logging;  // messages from workers passed to outside!
  
  if ((options.poll==true||typeof options.poll=='number') && 
       options.port1 && options.proto &&
       options.proto.contains('http')) {
    // HTTP worker polling function using amp.scan  
    // -- requires http / no https with localhost DNS permitted!
    this.log('Creating AMP HTTP scanner on port '+(options.port0||(options.port1-1)));
    this.probe = shell.port(DIR.IP(options.port0||(options.port1-1)),{
      proto:'http',
    });
    poll = function poll(pro) {
      var port=(options.port1+options.proto.indexOf('http'))+pro.index*(options.portn||options.proto.length)
      self.probe.amp.scan(
        {address:'localhost',port:port,proto:'http'},
        null,
        function (reply) {
          pro.poll={
            time  : shell.time(), 
            state : reply!=undefined, 
            info  : reply&&reply.info,
            port  : (reply&&reply.port?shell.Port.toString(reply.port):null)
          };
        })
    }
    this.polltimer=setInterval(self.poll.bind(self),options.poll);
  } else if (typeof options.poll=='function') poll=options.poll;
  
  if (!this.cluster && this.options.rows && this.options.cols) {
    this.cluster=[];
    this.grid = {
      rows: this.options.rows,
      cols: this.options.cols
    }
    // Create cluster descriptor array
    for(j=0;j<this.grid.rows;j++)
      for(i=0;i<this.grid.cols;i++) 
        this.cluster.push({
          id:'node('+i+','+j+')',
          poll:poll,
          todo:this.options.todo||'',
          ports:ports(i,j)
        })
  } else if (this.cluster) {
    n=m=int(Math.log2(this.cluster.length));
    while (n*m<this.cluster.length) n++;
    this.grid = {
      rows: n,
      cols: m
    }
  } else return;
  if (this.options.verbose) this.log('Grid: '+this.grid.rows+','+this.grid.cols);
  this.cluster.forEach(function (node,i) {
    var row=int(i/self.grid.cols),
        col=i-row*self.grid.cols,
        ports,connects,ip;
    node.position=[col,row];
    if (!self.options.connect || !self.options.port0) return;
    
    // Create private P2P ports and connect them
    ip=pos2ip(col,row);
    if (!node.ports) node.ports=[];
    if (!node.connect) node.connect=[];
    // TODO: compact; iterative composition
    if (row==0) {
      if (col == 0) ports = [
        DIR.East  (ip+2),  
        DIR.South (ip+3)        
      ]; else if (col<(self.grid.cols-1)) ports = [
        DIR.West  (ip+1),
        DIR.East  (ip+2),  
        DIR.South (ip+3)        
      ]; else ports = [
        DIR.West  (ip+1),
        DIR.South (ip+3)        
      ]    
    } else if (row<(self.grid.rows-1)) {
      if (col == 0) ports = [
        DIR.North (ip),
        DIR.East  (ip+2),  
        DIR.South (ip+3)        
      ]; else if (col<(self.grid.cols-1)) ports = [
        DIR.North (ip),
        DIR.West  (ip+1),
        DIR.East  (ip+2),  
        DIR.South (ip+3)        
      ]; else ports = [
        DIR.North (ip),
        DIR.West  (ip+1),
        DIR.South (ip+3)        
      ]
    } else {
      if (col == 0) ports = [
        DIR.North (ip),
        DIR.East  (ip+2),  
      ]; else if (col<(self.grid.cols-1)) ports = [
        DIR.North (ip),
        DIR.West  (ip+1),
        DIR.East  (ip+2),  
      ]; else ports = [
        DIR.North (ip),
        DIR.West  (ip+1),
      ]
    }
    self.log('Creating cluster interconnect AMP UDP ports for node '+i+': '+
              ports.map(function (p) { return DIR.print(p) }).join(' '));

    node.ports=node.ports.concat(ports);
    if (row==0) {
      if (col==0) {
        connects = [
          DIR.East  (addr(pos2ip(col+1,row,DIR.WEST))),  
          DIR.South (addr(pos2ip(col,row+1,DIR.NORTH)))
        ]
      } else if (col<(self.grid.cols-1)) connects = [
          DIR.East  (addr(pos2ip(col+1,row,DIR.WEST))),  
          DIR.South (addr(pos2ip(col,row+1,DIR.NORTH)))
      ]; else connects = [
          DIR.South (addr(pos2ip(col,row+1,DIR.NORTH)))
      ]    
    } else if (row<(self.grid.rows-1)) {
      if (col==0) {
        connects = [
          DIR.East  (addr(pos2ip(col+1,row,DIR.WEST))),  
          DIR.South (addr(pos2ip(col,row+1,DIR.NORTH)))
        ]
      } else if (col<(self.grid.cols-1)) connects = [
          DIR.East  (addr(pos2ip(col+1,row,DIR.WEST))),  
          DIR.South (addr(pos2ip(col,row+1,DIR.NORTH)))
      ]; else connects = [
          DIR.South (addr(pos2ip(col,row+1,DIR.NORTH)))
      ]
    } else {
      if (col==0) {
        connects = [
          DIR.East  (addr(pos2ip(col+1,row,DIR.WEST))),  
        ]
      } else if (col<(self.grid.cols-1)) ports = [
          DIR.East(localhost+':'+pos2ip(col+1,row))
      ]; else connects = [
      ]
    }
    node.connect=node.connect.concat(connects);
    
  });
}

Cluster.prototype.log = function (msg,pid) {
  console.log('[CLU'+(pid||process.pid)+' '+Aios.clock()+'] '+msg);
}

Cluster.prototype.newVM = function(index,todo) {
  var argv = [],desc=this.cluster[index],self=this;
  if (this.options.verbose) argv.push('-v');
  if (this.options.verbose>1) argv.push('-v');
  if (todo && todo[todo.length-1]!=';') todo += ';';
  if (desc.ports) todo += desc.ports.map(function (port,index) {
    if (port.port != undefined || port.proto != undefined || port.address != undefined) 
      return ('var p'+index+'='+
              'port(DIR.IP('+port.port+'),{proto:"'+port.proto+'"'+
               (port.secure?',secure:"'+port.secure+'"':'')+
               '})');
    if (port.tag) 
      return ('var p'+index+'=port('+Aios.DIR.toString(port)+')');
  }).join(';');
  if (desc.connect) todo = todo +';'+desc.connect.map(function (port,index) {
    return 'var t'+index+'=setTimeout(function () { connect('+Aios.DIR.toString(port)+')},500)';
  }).join(';');
  todo = [
    'config({print:process.send.bind(process),printAgent:process.send.bind(process),printAsync:process.send.bind(process)})',
    ''
  ].join(';') + todo;
  argv=argv.concat(['-e',todo]);
  if (this.options.verbose>1) this.log(argv);
  var pro = CP.fork(program,argv);
  pro.on('exit',function (code,signal) {
    if (self.options.verbose) self.log('Process #'+pro.pid+' got signal '+code);
    pro.exited={code:code,signal:signal};
  });
  pro.on('message', function(msg) {
    if (self.logging) self.logging(msg,index);
    else self.log(msg,pro.pid);
  });
  if (this.options.verbose) this.log('Started worker #'+pro.pid+': '+todo);
  else this.log('Started worker #'+pro.pid);
  pro.argv=argv;
  pro.todo=todo;
  pro.state=PS.START;
  pro.index=index;
  pro.cluster=desc;
  pro.load=0;
  pro.mem=0;
  return pro;
}

// Check all worker processes
Cluster.prototype.check = function (index) {
  var self=this,stats=[];
  this.childs.forEach(function (pro,_index) {
    if (index != undefined && _index != index) return;
    if (pro.state != PS.DEAD) 
      pro.state=pro.exited?PS.STOP:PS.RUN;
    stats.push({pid:pro.pid,state:pro.state,poll:pro.poll,load:pro.load,mem:pro.mem})
    osutils.getProcess(pro.pid,function (res) {
        if (res) {
          pro.load=Math.floor(res.cpu)/100;
          pro.mem=Math.floor(res.mem);
        }
    });
  })
  return stats;
}

// Start polling - poll function must be provided by cluster descriptor
Cluster.prototype.poll = function (index) {
  var self=this;
  this.childs.forEach(function (pro,_index) {
    if (index != undefined && _index != index) return; 
    if (pro.cluster.poll) pro.cluster.poll(pro);
  })
}

// Restart all or one worker processs
Cluster.prototype.restart = function (index) {
  var self=this;
  this.childs=this.childs.map(function (pro,_index) {
    if (index != undefined && _index != index) return pro; 
    if (self.options.verbose) self.log('Restarting worker #'+index);
    if (pro.state == PS.RUN) pro.kill();
    return self.newVM(_index,self.cluster[_index].todo);
  })
}

Cluster.prototype.report = function (index) {
  var desc=this.cluster;
  function pn(proto) { 
    switch (proto) {
      case 'http':  return 'h';
      case 'https': return 'hs';
      case 'udp':   return 'u';
      case 'tcp':   return 't';
    }
  }
  function ports(index) {
    if (desc[index].ports) {
      var ports = desc[index].ports.filter(function (p) {
        return p.tag==DIR.tag.IP || p.port;
      });
      return ports.map(function(port) {
              if (port.proto) return pn(port.proto)+port.port+(port.secure?'S':'P');
              if (port.ip) return port.ip.replace(/localhost|ttp|dp|cp|:|\//g,'')
                                         .replace(/\?[^$]+$/,'')+
                                         (port.ip.match(/\?secure=/)?'S':'P')
             }).join(',');
    } else return '-';
  }
  var table='';
  // this.poll();
  var stats=this.check();
  table = '| Node | Ports | PID | Status | CPU% | Memory MB | Agents | Links |\n'+
          '|:---|:---|:---|:---|:---|:---|:---|:---|\n';
  table = table+stats.map(function (row,index) {
    if (!row || row.state!=Cluster.PS.RUN || !row.poll ||
        !row.poll.state || !row.poll.info)
      return '| - | '+ports(index)+' | -  | '+row.state+' | -  | - | - | - |'; 
    else
      return '| '+row.poll.info.world+' | '+ports(index)+' | '+
             row.pid+' | '+row.state + ' | '+row.load + ' | '+row.mem + ' | '+
             row.poll.info.stats.agents+' | '+
             row.poll.info.stats.links+' |';
  }).join('\n')
  return table;
}
// Start all or one worker processs
Cluster.prototype.start = function (index) {
  this.childs = [];
  for (var pi=0;pi<this.cluster.length;pi++) {
    if (index != undefined && index!=pi) continue;
    this.childs.push(this.newVM(pi,this.cluster[pi].todo));
  }
}

// Stop all or one worker processs
Cluster.prototype.stop = function (index) {
  var self=this;
  this.childs.forEach(function (pro,_index) {
    if (index != undefined && _index != index) return; 
    if (pro.state == PS.DEAD) return;
    self.log('Stopping worker #'+_index);
    pro.state=PS.DEAD;
    pro.kill();
  })
}


Cluster.PS=PS;
Cluster.current = function (module) { Aios=module };

module.exports = Cluster;
