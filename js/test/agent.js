global.TOP='/home/sbosse/proj/jam/js';
require(TOP+'/top/module')([process.cwd(),TOP]);
var Io = Require('com/io');
var Aios = Require('jam/aios');


var ac = function (param1,param2) {
  //var self=this;
  // Data State
  this.delta={x:0,y:2};
  this.radius=1;
  this.param1=param1;
  this.param2=param2;
  this.x=0;
  this.list=[];

  this.inbound = function(nextdir) {
    log(this.delta.y);
    switch (nextdir) {
      case DIR.NORTH: return this.delta.y<=this.radius;
      case DIR.SOUTH: return this.delta.y>=-this.radius;
      case DIR.WEST: return this.delta.x>=-this.radius;
      case DIR.EAST: return this.delta.x<=this.radius;
    }  
    return false;
  };

  // Activities
  this.init = function () {
    var res;
    this.x=this.param1;
    log('init '+this.inbound(DIR.NORTH));
    out(['worker',this.param1*5]);
    inp(['worker',any],function (t) {this.x=t[1];});
  };
  this.end = function () {
    log('finalize');
  };
  this.act1 = function () {
    log('act1');
    log(this.x)
    this.x=this.x+1;
    this.list.push(this.x);
    L(
      function () {log (' in loop init'); this.x=5;},
      function () {log (' in loop cond'); return this.x < 7},
      function () {log (' in loop next'); this.x++;},
      [
        function() {log('in loop '+this.x)}
      ]
    );
  };
  this.act2 = function () {
    log('act2');
    log(this.x)
    this.x=this.x-5;
    trans.add('act2',function(){ return (this.x>10)?'act4':'act3';});
  };
  this.act3 = function () {
    log('act3');
    //while (1) {};
    this.x=0;
    for(var i=0;i<10000000;i++) {this.x++};
    //this.x=this.param2;
  };


  this.on = {
    error: function (e) {
      log('Caught exception '+e);
    },
    exit : function () {
      log('Terminating.');
    }
  };
 // Transition network
  this.trans = {
    init: function () {
      return 'act1'; 
    },
    act1: function () {
      if (this.x>1) return 'act2'; 
    },
    act2: function () {
      if (this.param1==1) return 'act3';
    },
    act4: function () {
      return 'end';
    },
    end: function () {
    
    }
  }
  // Control State
  this.next='init';
}
var world = Aios.World.World([]);
var node = Aios.Node.Node({id:'myfirstnode'});
world.add(node);

var agent1 = Aios.Code.create(ac,[1,1]);
console.log(agent1);
Aios.schedule(agent1);
