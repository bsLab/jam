// Explorer agent
function (options) {
  this.mynode=none;
  this.sensors=[];
  this.delta=options.delta; // [dx,dy]
  this.lifetime=options.life||500;
  this.act = {
    init: function () {
      this.mynode=myNode();
      log('Starting on node '+this.mynode);
    },
    percept: function () {
      this.sensors.push(random(20,200));
    },
    migrate: function () {
      var dir=DIR.ORIGIN;
      if (this.delta[0] > 0 ) {dir=DIR.EAST; this.delta[0]--;}
      else if (this.delta[0] < 0 ) {dir=DIR.WEST; this.delta[0]++;}
      else if (this.delta[1] > 0 ) {dir=DIR.NORTH; this.delta[1]--;}
      else if (this.delta[1] < 0 ) {dir=DIR.SOUTH; this.delta[1]++;};
      if (dir != DIR.ORIGIN) moveto(dir);
    },
    wait: function () {
      sleep(this.lifetime);
    },
    terminate: function () {
      kill();
    }
  }
  this.trans = {
    init: function () {return percept},
    percept: function () {return (this.delta[0]==0 && this.delta[1]==0)?wait:migrate},
    migrate: function () {return percept;},
    wait: function () {return terminate}
  }
  this.next='init';
}
