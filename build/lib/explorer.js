/************************
**  Explorer Agent Class
************************/

function (dir,radius,offset,group,ring,verbose) {
  this.sensors;
  this.delta;
  this.radius=radius;
  this.group=group;
  this.offset=offset;
  this.dir=dir;
  this.ring=ring;
  this.backdir;
  this.childs=[];
  this.goback=false;
  this.hop=0;
  this.parent;
  this.MAXHOP=4;
  this.verbose=verbose||0;
  this.enoughinput=0;
  
  this.act = {
    init : function () {
      if (this.verbose>0) log('Init');
      this.delta=Vector(0,0);
      this.parent=myParent();
      this.hop=0;
    },

    end : function () {
      if (this.verbose>0) log('Terminating.');
      kill();
    },

    move : function () {
      if (this.verbose>0) log('Move -> '+this.dir);
      if (!this.goback) this.backdir=opposite(this.dir);
      switch (this.dir) {
        case DIR.NORTH: this.delta.y--; break;
        case DIR.SOUTH: this.delta.y++; break;
        case DIR.WEST:  this.delta.x--; break;
        case DIR.EAST:  this.delta.x++; break;
      }

      if (this.dir!=DIR.ORIGIN) {
        this.hop++;
        moveto(this.dir);    
      }
    },

    percept : function () {
      if (this.verbose>0) log('Percept ..');
      if (this.ring) {
        switch (this.dir) {
          case DIR.EAST: this.dir=DIR.SOUTH; break;
          case DIR.SOUTH: this.dir=DIR.WEST; break;
          case DIR.WEST: this.dir=DIR.NORTH; break;
          case DIR.NORTH: this.dir=DIR.EAST; break;
        }
        return;
      }
      this.sensors=[];
      if (!exists(['EXPLORER',this.group])) {
        mark(['EXPLORER',this.group],5000);
        rd(['SENSOR',_,_,_],function (t) {
          if (this.verbose>0) log(this.delta.x+','+this.delta.y+':'+t[1]+','+t[2]+','+t[3]);
          this.sensors.push({d:this.delta,hhe:t[1],hhn:t[2],hhz:t[3]});
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
            if (dir!=this.backdir && this.inbound(dir) && link(dir)) {
              if (this.verbose>0) log('fork '+dir);
              agent=fork({dir:dir,radius:1,offset:this.offset});
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
      case DIR.NORTH: return (this.delta.y+this.offset.y)  > -(this.radius);
      case DIR.SOUTH: return (this.delta.y+this.offset.y)  <  (this.radius);
      case DIR.WEST:  return (this.delta.x+this.offset.x)  > -(this.radius);
      case DIR.EAST:  return (this.delta.x+this.offset.x)  <  (this.radius);
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
      if (this.ring) return this.hop<this.MAXHOP?'move':'end';
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
