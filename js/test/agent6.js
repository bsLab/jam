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
  this.learner={};
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
    var training_data = [
        {"color":"blue", "shape":"square", "liked":1},
        {"color":"red", "shape":"square", "liked":2},
        {"color":"blue", "shape":"circle", "liked":4},
        {"color":"red", "shape":"circle", "liked":5},
        {"color":"blue", "shape":"hexagon", "liked":1},
        {"color":"red", "shape":"hexagon", "liked":1},
        {"color":"yellow", "shape":"hexagon", "liked":4},
        {"color":"yellow", "shape":"circle", "liked":1}
    ];


    var class_name = "liked";
    var features = ["color", "shape"];
    log('act1');
    this.learner=ml.learn(training_data, class_name, features);
    out(['worker',this.param1]);
  };
  this.act2 = function () {
    log('act2');
    var test_data = [
        {"color":"blue", "shape":"hexagon", "liked":3},
        {"color":"red", "shape":"hexagon", "liked":1},
        {"color":"yellow", "shape":"hexagon", "liked":3},
        {"color":"yellow", "shape":"circle", "liked":5}
    ];
    log(ml.classify(this.learner,{
        color: "yellow",
        shape: "square"
      }));
    log(ml.evaluate(this.learner,'liked',test_data));
    inp(['worker',this.param1],function (t) {this.x=t[1];});
    //this.learner={};
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
var node = Aios.Node.Node({id:'mynode'});
world.add(node);

var agent = Aios.Code.create(ac,[1,2]);
//Aios.config({iterations:10});
Aios.loop();
var json = Aios.Code.ofCode(agent);
//console.log(json);
console.log(json.length);
console.log(Aios.current.world.print(true))
Nav.Navigator(Aios.current.world);

