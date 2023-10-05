/*
** Test: Signaling of agents between virtual nodes 
** Use: jamlib, explorer agent
** Setup: Meshgrid of 4 virtual nodes
**
*/

var Jam = (process.versions && process.versions.v8)?require('/opt/JAM/lib/jamlib'):require('jamlib');

var rnd = Math.random;


// Create the logical JAM node (and world)
var myJam = Jam.Jam({
  fastcopy:false,
  print:console.log,
  verbose:0,
});
myJam.init();
myJam.extend([0,1,2],'sprint',function () {return '?'});
myJam.addNodes([{x:1,y:0},{x:0,y:1},{x:1,y:1}]);
myJam.connectNodes([{x1:0,y1:0,x2:1,y2:0},{x1:1,y1:0,x2:1,y2:1},
                    {x1:0,y1:0,x2:0,y2:1},{x1:0,y1:1,x2:1,y2:1}]);
myJam.Aios.options.log.node=true;

var start,stop;
print('Has watchdog: '+(myJam.Aios.watchdog!=undefined));

// Simple explorer agent
var ac = function (dir,maxhops,verbose) {
  // Body variables
  this.delta={};
  this.sensors=[]; 
  this.y=0;
  this.dir=dir;
  this.hops=0;
  this.parent=none;
  this.MAXHOP=maxhops;
  this.verbose=verbose;
  this.ring=true;
  this.childs=[];
  
  // Activities
  this.act = {
    init: function () { 
      if (this.verbose>0) log('Starting on '+myNode());
      this.delta=Vector(0,0);
      this.parent=myParent();
      this.hops=0;    
    },
    replicate: function () {
      if (this.verbose) log('Replicating');
      trans.update(replicate,migrate);
      this.childs.push(fork({dir:DIR.EAST,MAXHOP:1}));
      this.childs.push(fork({dir:DIR.SOUTH,MAXHOP:1}));
      this.childs.push(fork({dir:DIR.EAST,MAXHOP:2}));
      trans.update(replicate,notify);
      log('BC: '+broadcast('siggy',0,'SIGX',{from:me()}));
      sleep(100);
    },
    percept: function () {
      if (this.verbose) log('Percepting');
      if (this.hops>0 && this.ring) {
        switch (this.dir) {
          case DIR.EAST: this.dir=DIR.SOUTH; break;
          case DIR.SOUTH: this.dir=DIR.WEST; break;
          case DIR.WEST: this.dir=DIR.NORTH; break;
          case DIR.NORTH: this.dir=DIR.EAST; break;
        }
        return;
      }
    },
    migrate: function () {
      if (this.verbose) log('Moving -> '+this.dir);
      switch (this.dir) {
        case DIR.NORTH: this.delta.y--; break;
        case DIR.SOUTH: this.delta.y++; break;
        case DIR.WEST:  this.delta.x--; break;
        case DIR.EAST:  this.delta.x++; break;
      }

      if (this.dir!=DIR.ORIGIN) {
        if (link(this.dir)) {
          this.hops++;
          moveto(this.dir);
        } else {
          log('No link to '+this.dir);
          kill();
        }
      }
    },
    notify: function () {
      if (this.verbose) log('Notification');
      send(me(),'SIG1',{from:'master'});
      iter(this.childs,function (child) {
        var s={};
        s.from=me();
        s['1,-1,0']={x:0,y:0};
        send(child,'SIG1',{from:me()});
      });
    },
    wait: function () {
      if (this.verbose) log('Waiting');
      sleep(1000);
    },
    end : function () {
      if (this.verbose) log('Terminating.');
      kill();
    }
  };
  // Transitions
  this.trans = {
    init: percept,
    percept: function () { return this.dir==DIR.ORIGIN?replicate:
                                  (this.hops<this.MAXHOP?migrate:wait)},
    replicate: notify,
    notify: wait,
    migrate: percept,
    wait:end
  };
  this.on = {
    'SIG1': function (arg) {
      log('Got signal SIG1('+arg.from+')');
      if (arg.from != 'master') {
        log(send(arg.from,'SIG2',{from:me()}));
      }
    },
    'SIG2': function (arg) {
      log('Got signal SIG2('+arg.from+')');
    },
    'SIGX': function (arg) {
      log('Got signal SIGX('+arg.from+')');
    },
    error: function (e,error) {log('Exception '+e+': '+error)}
  }
  this.next='init';
}

// Analyze agent constructor and create sandbox environment (activity variables)
var p,env={},
    an = myJam.analyze(ac,{level:2,classname:'myclass',verbose:1}); 
print(an.report);
if (an.interface) for (p in an.interface.activities) env[p]=p;


// Start agents on root node

var agents = [],
    N = 1,n, mem,
    text,agent,code,
    sac = myJam.Aios.Code.makeSandbox(ac,2,env);
    
myJam.Aios.options.json=false;
for(n=0;n<N;n++) {
  agents[n] = myJam.createAgent(sac,[myJam.DIR.ORIGIN,0,true],1,'siggy');
}

// Start agent processing
start=new Date().getTime();
myJam.start();

// Wait for all agents being terminated
var poll=setInterval(function () {
  var p,n=0;
  for(p in myJam.world.nodes) {
    n=n+myJam.world.nodes[p].processes.used;
  }
  if(n==0) {
    stop=new Date().getTime();
    //print('Signaling of one agent: '+(stop-start)/(N*4)+' millisec');    
    mem = process.memoryUsage();
    print('rss:'+div(mem.rss,1024)+
      ' heapUsed:'+div(mem.heapUsed,1024)+
      ' heapSize:'+div(mem.heapSize,1024));
    clearInterval(poll);
    process.exit();
  }
},20);

