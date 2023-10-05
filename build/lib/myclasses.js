// Define an agent class constructor function
module.exports = {
  myclass : function (arg1,arg2) {
    // Body variables
    this.x=arg1; // Arg1
    this.y=arg2;
    // Activity section
    this.act = {
      init: function () { /* Initilization */ log('init '+this.x+' and square '+square(this.x)+'..')},
      read: function () {inp(['SENSOR1',_],function (t) {this.x=t[1]})},
      comp: function () {this.x++;this.y--;log(this.x+','+this.y); 
                         // Access of tuple space 
                         rd(['SENSOR2',_],function (t) {this.y=t[1]}) },
      notify: function () {out(['ADC',this.x,this.y])},
      wait: function () {
        sleep(1000);},
      migrate: function () {if (link(DIR.PATH('/next'))) moveto(DIR.PATH('/next'));}
    };
    // Transition section
    this.trans = {
      init: function () {return read},
      read: function () {return comp},
      comp: function () {return notify},
      notify: function () {return wait},
      wait: function () {return migrate},
      migrate: function () {return comp}
    };
    // Signal/Exception handler
    this.on = {
      'SIG1': function (arg) {
        log('Got signal SIG1('+arg+')');
      },
      error: function (e,error) {log('Exception '+e+': '+error)}
    }
    // The first activity to be executed
    this.next='init';
  }
}
