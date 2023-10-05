var Jam = process.release?require('./jamlib'):require('jamlib');

/** Tuple space provder and consumer functions 
 *  providing an IO gate between JAM and the host application
 */
function provider(pat) {
  switch (pat.length) {
    case 2:
      switch (pat[0]) {
        case 'SENSOR2':
          return [pat[0],(256*Math.random())|0];
      }
      break;
  }
}

function consumer(tuple) {
  switch (tuple.length) {
    case 3:
      switch (tuple[0]) {
        case 'ADC':
          console.log('Host application got '+tuple);
          return true;
      }
      break;
  }
  return false;  
}

// Create a JAM VM instance
var myJam = Jam.Jam({
  consumer:consumer,
  print:console.log,
  provider:provider,
  verbose:0,
});

// Start the engine ..
myJam.start();

// Define an agent class constructor function
var ac = function (arg1,arg2) {
  // Body variables
  this.x=arg1; // Arg1
  this.y=arg2;
  // Activity section
  this.act = {
    init: function () { /* Initilization */ log('init '+this.x+'..')},
    read: function () {inp(['SENSOR1',_],function (t) {this.x=t[1]})},
    comp: function () {this.x++;this.y--;log(this.x+','+this.y); 
                       // Access of tuple space 
                       rd(['SENSOR2',_],function (t) {this.y=t[1]}) },
    notify: function () {out(['ADC',this.x,this.y])},
    wait: function () {
      sleep(1000);},
  };
  // Transition section
  this.trans = {
    init: function () {return read},
    read: function () {return comp},
    comp: function () {return notify},
    notify: function () {return wait},
    wait: function () {return comp},
  };
  // Signal/Exception handler
  this.on = {
    'SIG1': function (arg) {
      log('Got signal SIG1('+arg+')');
    },
    error: function (e,error) {log('Exception '+e+': '+error)}
  }
  this.subclass = {
    sb : function () {
    
    }
  }
  // The first activity to be executed
  this.next='init';
}

// Analyze the agent class constructor function (for AIOS level 1)
print(myJam.analyze(ac,{level:2,classname:'ac',verbose:1}));

// called from host application
var a1 = myJam.createAgent(ac,[1,2],1);
var a2 = myJam.createAgent(ac,[1000,2000],1);


// called from host application
for(var i = 1; i < 2; i++)
  myJam.out(['SENSOR1',123*i]);
print('Host signaling '+a1+'..');
myJam.signal(a1,'SIG1','argument');
