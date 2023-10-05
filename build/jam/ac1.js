
module.exports.learner = function () {
  this.MONTECARLO={apply:false,noise:5,sets:5};
  this.sensors;
  this.sensmatA;
  this.sensmatB;
  this.delta={x:0,y:0};
  this.todo;
  this.args=[];
  this.dirs=[];
  this.childs=[];
  this.enoughinput=0;
  this.ROI=3;
  this.RADIUS=1;
  this.verbose=0;
  this.group;

  // Learning
  this.training_data=[];
  this.model;
  this.LEARN= {
    class:'load',
    features:[],
    eps:0
    
  };
  
  // Activities
  this.act = {
    init : function () {
      log(myclass()+' initializing ..');
      this.delta={x:0,y:0};
      this.sensors=[];
      this.sensmatA=matrix(this.ROI,this.ROI);
      this.sensmatB=matrix(this.ROI,this.ROI);
      iter([DIR.NORTH,DIR.SOUTH,DIR.WEST,DIR.EAST],function (dir) {
        if (link(dir)) this.dirs.push(dir);
      });
      this.dirs.push(DIR.ORIGIN);
      for(var i = 0; i<this.ROI*this.ROI;i++) {
        this.LEARN.features.push('A'+i);
        this.LEARN.features.push('B'+i);
      }
      timer.add(1000,'REFRESH');
    },

    end : function () {
      kill();
    },

    wait : function () {
      var learn,run;
      if (this.verbose>0) log('Wait');
      inp(['TODO',_,_],function(t){this.todo=t[1];this.args=t[2]});
    },

    explore : function () {
      var dir;
      // send out child explorer agents
      if (this.verbose>0) log('Explore');
      this.enoughinput=0;
      this.sensors=[];
      this.group=id();
      I(this.dirs,
        function (next) {dir=next},
        [
          function () {
            var agent;
            if (this.verbose>0) log('Create explorer '+dir);
            agent=create('explorer',[dir,this.RADIUS,this.group]);
            this.childs.push(agent);
            this.enoughinput++;
          }
        ])
    },

    learn : function () {
      var set,n,sets=[];
      var center=Vector(div(this.ROI,2),div(this.ROI,2));
      
      // Build sensor matrix and training set
      n=this.MONTECARLO.apply?this.MONTECARLO.sets:1;
      for (set=0; set<n;set++) {
        var training_set={};
        iter(this.sensors,function (s) {
          //log(sprint([center,s],2));
          var i=center.x+s.d.x;
          var j=center.y+s.d.y;
          if (set==0) {
            this.sensmatA[j][i]=s.a;
            this.sensmatB[j][i]=s.b;
            training_set['A'+(j*this.ROI+i)]=s.a;
            training_set['B'+(j*this.ROI+i)]=s.b;
          } else {
            training_set['A'+(j*this.ROI+i)]=s.a+random(-this.MONTECARLO.noise,this.MONTECARLO.noise);
            training_set['B'+(j*this.ROI+i)]=s.b+random(-this.MONTECARLO.noise,this.MONTECARLO.noise);          
          } 
        });
        iter(this.args,function (a,prop) {
          training_set[prop]=a;
        });
        this.training_data.push(training_set);
        sets.push(training_set);
      }
      if (this.verbose>=0) log('Learning with '+this.training_data.length+' dataset(s), new is/are ',sets);
      this.model=ml.learn(this.training_data,this.LEARN.class,this.LEARN.features,this.LEARN.eps);
      if (this.verbose>=0) log('Learned model is '+ml.print(this.model));
    },
    
    classify : function () {
      var data={};
      var center=Vector(div(this.ROI,2),div(this.ROI,2));
      
      // Build sensor matrix and data set
      iter(this.sensors,function (s) {
          //log(sprint([center,s],2));
          var i=center.x+s.d.x;
          var j=center.y+s.d.y;
            this.sensmatA[j][i]=s.a;
            this.sensmatB[j][i]=s.b;
            data['A'+(j*this.ROI+i)]=s.a;
            data['B'+(j*this.ROI+i)]=s.b;
        });
        
      if (this.verbose>=0) log('Predicting with data set ',data);
      var key=ml.classify(this.model,data);
      if (this.verbose>=0) log('Learned model is '+ml.print(this.model));
      if (this.verbose>=0) log('Predicted key is '+key);
      out(['VOTE',key]);
    },
    deliver : function () {
    },
    forget : function () {
      this.training_data=[];
      this.model=undefined;
    }
  };
  
  // Signal handler
  this.on = {
    'DELIVER': function (v) {
      var sensors;
      if (this.verbose>0) log('Got signal DELIVER');
      try_inp(0,['SENSORS',this.id,_],function(t){
        if (t) sensors=t[2]; else sensors=[];
        this.sensors=concat(this.sensors,sensors);
        this.enoughinput--;
        if (this.verbose>0) log('Got SENSORS #'+sensors.length+', enoughinput='+this.enoughinput);
      });
    },
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
  // Sub-classes
  this.subclass = {
    explorer : module.exports.explorer,
    voter : module.exports.voter
  }
  
  // Transitions
  this.trans = {
    init: function () {
      return 'wait'; 
    },
    wait: function () {
      return 'explore';
    },
    explore: function () {
      if (this.enoughinput>0) return;
      switch (this.todo) {
        case 'LEARN': return 'learn';
        case 'CLASSIFY': return 'classify';
        case 'FORGET': return 'forget';
      }
      return;
    },
    learn: function () {
      return 'wait';
    },
    classify: function () {
      return 'wait';
    },
    forget: function () {
      return 'wait';
    },
    move: function () {
    },
    deliver: function () {
      return 'end';
    },
  }
  // Control State
  this.next='init';   
}

/************************
**  Explorer Agent Class
************************/

module.exports.explorer = function (dir,radius,group) {
  this.sensors;
  this.delta;
  this.radius=radius;
  this.group=group;
  this.dir=dir;
  this.backdir;
  this.childs=[];
  this.goback=false;
  this.hop=0;
  this.parent;
  this.MAXHOP=3;
  this.verbose=0;
  
  this.act = {
    init : function () {
      this.delta=Vector(0,0);
      this.parent=parent();
      this.hop=0;
    },

    end : function () {
      kill();
    },

    move : function () {
      if (this.verbose>0) log('Move -> '+this.dir);
      if (!this.goback) this.backdir=opposite(this.dir);
      switch (this.dir) {
        case DIR.NORTH: this.delta.y--; break;
        case DIR.SOUTH: this.delta.y++; break;
        case DIR.WEST: this.delta.x--; break;
        case DIR.EAST: this.delta.x++; break;
      }

      if (this.dir!=DIR.ORIGIN) {
        this.hop++;
        moveto(this.dir);    
      }
    },

    percept : function () {
      if (this.verbose>0) log('Percept ..');
      this.sensors=[];
      if (!exists(['EXPLORER',this.group])) {
        mark(['EXPLORER',this.group],100);
        rd(['SENSOR',_,_],function (t) {
          if (this.verbose>0) log(this.delta.x+','+this.delta.y+':'+s);
          this.sensors.push({d:this.delta,a:t[1],b:t[2]});
        })
      } else {  
        if (this.verbose>0) log('Found marking. Going back ..');
        this.goback=true;
      }
    },


    explore : function () {
      var dir;
      // send out child explorer agents
      if (this.verbose>0) log('Explore');
      this.enoughinput=0;
      trans.update('explore',function () {return 'move'});
      I([DIR.NORTH,DIR.SOUTH,DIR.WEST,DIR.EAST],
        function (next) {dir=next},
        [
          function () {
            var agent;
            if (dir!=this.backdir && this.inbound(dir)) {
              if (this.verbose>0) log('fork '+dir);
              agent=fork({dir:dir,radius:1});
              this.childs.push(agent);
              this.enoughinput++;
            }
          }
        ],
        function () {
          trans.update('explore',function () {if (this.enoughinput<1) return 'goback';});      
        })
    },

    goback : function () {
      if (this.verbose>0) log('Goback -> '+this.backdir);
      this.goback=true;
      if (this.backdir!=DIR.ORIGIN) moveto(this.backdir);    
    },

    deliver : function () {
      if (this.verbose>0) log('Deliver '+sprint(this.sensors,2)+ ' to '+this.parent);
      out(['SENSORS',this.parent,this.sensors]);
      send(this.parent,'DELIVER');
    }
  };
  
  this.inbound = function(nextdir) {
    switch (nextdir) {
      case DIR.NORTH: return this.delta.y>-this.radius;
      case DIR.SOUTH: return this.delta.y<this.radius;
      case DIR.WEST: return this.delta.x>-this.radius;
      case DIR.EAST: return this.delta.x<this.radius;
    }  
    return false;
  };
  
  this.on = {
    'DELIVER': function (v) {
      var sensors;
      if (this.verbose>0) log('Got signal DELIVER');
      try_inp(0,['SENSORS',this.id,_],function(t){
        if (t) sensors=t[2]; else sensors=[];
        this.sensors=concat(this.sensors,sensors);
        this.enoughinput--;
        if (this.verbose>0) log('Got SENSORS #'+sensors.length+', enoughinput='+this.enoughinput);
      });
    },
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
      return 'move'; 
    },
    move: function () {
      return 'percept';
    },
    percept: function () {
      return (this.goback||this.dir==DIR.ORIGIN||this.hop==this.MAXHOP)?'goback':'explore';
    },
    explore: function () {
      if (this.enoughinput<1) return 'goback';
    },
    goback: function () {
      return 'deliver';
    },
    deliver: function () {
      return 'end';
    },
  }
  // Control State
  this.next='init';   
}

/************************
**  Voter Agent Class
************************/
module.exports.voter = function (dir,target) {
  this.feature;
  this.delta={x:0,y:0};
  this.dir=dir;
  this.target=target;
  
  this.act = {
    init : function () {
      this.delta={x:0,y:0};
      this.feature=none;
    },

    end : function () {
      kill();
    },

    sense : function () {
      rd(['VOTE',_],function(t){this.feature=t[1]} );
    },

    move : function () {
      switch (this.dir) {
        case DIR.NORTH: this.delta.y--; break;
        case DIR.SOUTH: this.delta.y++; break;
        case DIR.WEST: this.delta.x--; break;
        case DIR.EAST: this.delta.x++; break;
      }

      moveto(this.dir);    
    },

    vote : function () {
      var sensmat=none;
      var i,j;
      var pos=position();
      if (this.delta.x==0 && this.delta.y==0) this.dir=DIR.ORIGIN;
    }
  };
  // Signal handling
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
      return 'sense'; 
    },
    sense: function () {
      if ((!exists([this.target]) || zero(this.delta))  && this.dir!=DIR.ORIGIN) return 'move';
      else return 'deliver';
    },
    move: function () {
      return 'sense';
    },
    vote: function () {
      return 'end';
    },
  }
  // Control State
  this.next='init';   
}


