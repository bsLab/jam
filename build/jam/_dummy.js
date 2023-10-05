
module.exports.helloworld = function () {
  this.verbose=1;
  this.group;

  
  // Activities
  this.act = {
    init : function () {
      log(myClass()+' initializing ..');
      timer.add(1000,'REFRESH');
    },

    end : function () {
      kill();
    },

    wait : function () {
      if (this.verbose>0) log(myClass()+' waiting ..');
      sleep(1800);
    },

    run : function () {
      if (this.verbose>0) log(myClass()+' Hello World');
    }
  };
  
  // Signal handler
  this.on = {
    'REFRESH': function (v) {
      log(myClass()+' got refresh time-out.');
      timer.add(1000,'REFRESH');
    },
    error : function (e) {
      log('Caught exception '+e);
    },
    exit : function () {
      log('Terminating.');
    }
  };
  
  // Transitions
  this.trans = {
    init: function () {
      return 'wait'; 
    },
    wait: function () {
      return 'run';
    },
    run: function () {
      return 'wait';
    }
  }
  // Control State
  this.next='init';   
}

