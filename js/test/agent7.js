global.TOP='/home/sbosse/proj/jam/js';
require(TOP+'/top/module')([process.cwd(),TOP]);
var Io = Require('com/io');
var Aios = Require('jam/aios');
var Comp = Require('com/compat');

var node_ac = function (x,y) {
  //var self=this;
  // Data State
  this.pos={x:x,y:y};

  this.x;
  // Activities
  this.init = function () {
    this.x=0;
  };
  this.end = function () {
    log('finalize');
    kill();
  };
  this.act1 = function () {
    log('act1');
  };
  this.act2 = function () {
    //log('act2 '+this.x);
    this.x++;
    //sleep(1000);
  };
  this.act3 = function () {
    //log('act3');
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
      if (this.pos.x==3 && this.pos.y==3) return 'act2';
      else return 'end'; 
    },
    act2: function () {
      if (this.x<1000) return 'act3';
      else return 'end';
    },
    act3: function () {
      return 'act2';
    },
    end: function () {
    
    }
  }
  // Control State
  this.next='init';
}

var world_ac = function () {
  this.init = function () {
    log('World: Starting node agents ['+
         this.options.x+','+this.options.y+'] ..');
    for (var j=0;j<this.options.y;j++) {
      for (var i=0; i<this.options.x;i++) {
        this.simu.createOn(i,j,'node',[i,j]);
      }
    }
  };
  this.sleep = function () {
    sleep(10,'steps');
  };
  this.update = function () {
  };
  this.end = function () {
    log('finalize');
    kill();
  };
  this.on = {
    error : function (e) {
      log('WORLD: Caught exception '+e);
    },
    exit : function () {
      log('WORLD: Terminating.');
    }
  };
  // Transition network
  this.trans = {
    init: function () {
      return 'sleep'; 
    },
    sleep: function () {
      return 'update';
    },
    update: function () {
      return 'sleep';
    },
    end: function () {
    
    }
  }
  // Control State
  this.next='init';
 
}
var Simu = Aios.Simu.Simu({
  id:'My Agent World',
  x:10, y:10,
  showfun:true,   // show functions in tree viewer
  nodebar:true,   // node box with additional marking bar
  classes:{node:node_ac,world:world_ac},  // all known agent classes
  connections:{
    random:1.0  // Monte-Carlo Simualtion of node placement: Prob. for a link
  }
});
Simu.start();
