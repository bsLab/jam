
module.exports.helloworld = function () {
  this.verbose=1;
  this.group;
  this.n;
  
  // Activities
  this.act = {
    init : function () {
      log(myclass()+' initializing ..');
      timer.add(1000,'REFRESH');
      this.n=0;
    },

    end : function () {
      kill();
    },

    wait : function () {
      if (this.verbose>0) log(myclass()+' waiting ..');
      sleep(1800);
    },

    run : function () {
      this.n++;
      if (this.verbose>0) log(myclass()+' Hello World');
    }
  };
  
  // Signal handler
  this.on = {
    'REFRESH': function (v) {
      log(myclass()+' got refresh time-out.');
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
      return wait; 
    },
    wait: function () {
      return run;
    },
    run: function () {
      if (this.n<10) return wait;
      else return 'end';
    }
  }
  // Control State
  this.next=init;   
}

