global.TOP='/home/sbosse/proj/jam/js';
require(TOP+'/top/module')([process.cwd(),TOP]);
var Io = Require('com/io');
var Aios = Require('jam/aios');


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
    this.x=this.param1*10;
    log('init');
    if (this.param1==2) aid=this.id;
  };
  this.end = function () {
    log('finalize');
    kill();
  };
  this.act1 = function () {
    log('act1.1');
    out(['worker',this.param1]);
    log('act1.2');
    if (this.param1==1) send(aid,'SIG',0);
    log('act1.3');
    log('Forking '+fork({param1:3,param2:4}));
    log('act1.4');
    timer.add(1000,'TIMER');
  };
  this.act2 = function () {
    log('act2 '+this.param1+','+this.param2);
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
    },
    SIG : function (arg) {
      log('Handling SIG '+this.x);
    },
    TIMER : function (arg) {
      log('Handling TIMER '+arg);
    }
  }
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
//Aios.lock();

var world = Aios.World.World([]);
var node = Aios.Node.Node({id:'mynode'});
world.add(node);

var agent1 = Aios.Code.create(ac,[1,2]);
var agent2 = Aios.Code.create(ac,[2,1]);


//Aios.kill(agent1);
//Aios.kill(agent2);
//Aios.config({iterations:10});
Aios.loop();

console.log(Aios.current.node.print(true))
//console.log(agent3);
