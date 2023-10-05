module.exports.ac = function (arg1,arg2) {
  this.x=arg1;
  this.y=arg2;
  this.act = {
    init: function () {
      log("I am  initializing with x="+this.x)
    },
    read: function () {
      inp(["SENSOR1",_],function (t) {this.x=t[1]})
    },
    comp: function () {
      this.x++;this.y--;
      log(this.x+","+this.y); 
      rd(["SENSOR2",_],function (t) {this.y=t[1]}) 
    },
    notify: function () {
      out(["ADC",this.x,this.y])
    },
    wait: function () {sleep(1000);}
  };
  this.trans = {
    init: function () {return read},
    read: function () {return comp},
    comp: function () {return notify},
    notify: function () {return wait},
    wait: function () {return comp}
  };
  this.next="init";
}
