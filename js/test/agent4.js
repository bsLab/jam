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
    this.x=this.param1;
    //log('init');
  };
  this.end = function () {
    //log('finalize');
    kill();
  };
  this.act1 = function () {
    this.x++;
  };
  this.act2 = function () {
  };
  this.act3 = function () {
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
      if (this.x<this.param2) return 'act1';
      else return 'act2';
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

var agents = [];
var start=Aios.time();
console.log(Aios.current.node.print(true));
for (var i=0;i<1000;i++) agents.push(Aios.Code.create(ac,[0,1000]));
console.log('Time: '+(Aios.time()-start)+ ' ms');
console.log(Aios.current.node.print(true));
start=Aios.time();
Aios.loop();
console.log(Aios.current.node.print(true));
console.log('Time: '+(Aios.time()-start)+ ' ms');

