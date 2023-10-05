// Explorer agent
function (options) {
  this.mynode=none;
  this.sensors=[];
  this.hops=0;
  this.range=options.range; // number
  this.act = {
    init: function () {
      this.mynode=simu.getNode();
      log('Starting on node '+this.mynode);
    },
    percept: function () {
      this.mynode=simu.getNode();
      // log('Percepting on node '+this.mynode);
      this.sensors.push(random(20,200));
    },
    migrate: function () {
      var neighbours=link(DIR.PATH('/*'));
      // log('Neighbours: '+neighbours);
      if (neighbours && neighbours.length>0) {
        this.hops++;
        moveto(DIR.PATH(neighbours[0]))
      }
    },
    wait: function () {
      sleep(100);
    }
  }
  this.trans = {
    init: function () {return percept},
    percept: function () {return (this.hops==this.range)?wait:migrate},
    migrate: function () {return percept;},
    wait: function () {return}
  }
  this.next='init';
}
