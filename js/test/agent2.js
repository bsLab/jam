global.TOP='/home/sbosse/proj/jam/js';
require(TOP+'/top/module')([process.cwd(),TOP]);
var Io = Require('com/io');
var Aios = Require('jam/aios');
Aios.lock();


var ac = function (param1,param2) {
  //var self=this;
  // Data State
  this.param1=param1;
  this.param2=param2;
  this.x=0;
  this.list=[];
  // Activities
  this.init = function () {
    var res;
    this.x=-1;
    log('init');
  };
  this.end = function () {
    log('finalize');
    kill();
  };
  this.act1 = function () {
    log('act1');
    //test=this.param1;
    out(['worker',this.param1]);
  };
  this.act2 = function () {
    //log('act2 '+test);
    log('act2');
    inp(['worker',this.param2],function (t) {this.x=t[1];});
  };
  this.act3 = function () {
    log('act3');
    log(this.x)
  };
  this.on = {
    error : function (e) {
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
      return 'act2'; 
    },
    act2: function () {
      return 'act3';
    },
    act3: function () {
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

var agent1 = Aios.Code.create(ac,[1,2]);
var agent2 = Aios.Code.create(ac,[2,1]);
for(var i=0;i < 4;i ++) {
  Aios.schedule(agent1);
  //Aios.schedule(agent2);
};
console.log(Aios.current.node.print(true))
for(var i=0;i < 5;i ++) {
  Aios.schedule(agent1);
  Aios.schedule(agent2);
};

//Aios.kill(agent1);
//Aios.kill(agent2);

console.log(Aios.current.node.print(true))
//console.log(test)
