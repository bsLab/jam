global.TOP='/home/sbosse/proj/jam/js';
require(TOP+'/top/module')([process.cwd(),TOP]);
var Io = Require('com/io');
var Aios = Require('jam/aios');
var Nav = Require('com/nav');
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
    log(this.x)
    kill();
  };
  this.act1 = function () {
    log('act1');
    out(['worker',this.param1]);
  };
  this.act2 = function () {
    log('act2');
    if (this.param1==1) move(DIR.EAST);
    if (this.param1==2) move(DIR.WEST);
  };
  this.act3 = function () {
    log('act3');
    inp(['worker',this.param2],function (t) {this.x=t[1];});
  };
  this.act4 = function () {
    log('act4');
    this.x++;
  };
  this.act4 = function () {
    //log('act4 '+this.x+' '+this.process.consumed);
    log('act4 '+this.x);
    this.x++;
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
      return 'act4';
    },
    act4: function () {
      return 'act4';
    },
    end: function () {
    
    }
  }
  // Control State
  this.next='init';
}

var world = Aios.World.World([],'My World');
var node1 = Aios.Node.Node({id:'N01',position:{x:1,y:1}});
var node2 = Aios.Node.Node({id:'N02',position:{x:2,y:1}});
world.add(node1);
world.add(node2);
world.connect(Aios.DIR.EAST,node1,node2);

var agent1 = Aios.Code.createOn(node1,ac,[1,2]);
var agent2 = Aios.Code.createOn(node2,ac,[2,1]);
Aios.config({iterations:10});
Aios.loop();
console.log(Aios.current.world.print(true))
Nav.Navigator(Aios.current.world);
