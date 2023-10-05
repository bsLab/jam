var Jam = process.release?require('./jamlib'):require('jamlib');
var rnd = Math.random;
var print = print||console.log;

/** Tuple space provder and consumer functions 
 *  providing an IO gate between JAM and the host application
 */
function provider(pat) {
  switch (pat.length) {
    case 2:
      switch (pat[0]) {
        case 'SENSOR2':
          return [pat[0],(256*rnd())|0];
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

/** Test if a destination is reachable.
 *  Only PATH(p) with path=p locations are supported.
 */
function link(path) {
  console.log('Checking link to '+path);
  return true;
}

/** Send agent text code to a destination.
 */
function send(data,dest) {
  console.log(data.length+' -> '+dest);
  console.log(data);
  return data.length;
}

// A custom function
function sq (x) {return x*x};

// Create a JAM VM instance
var myJam = Jam.Jam({
  consumer:consumer,
  link:link,
  print:console.log,
  provider:provider,
  send:send,
  verbose:0,
});
// Extend the JAM with custom functions
myJam.extend([0,1,2],'square',sq);

// Start the engine ..
myJam.start();

// Define an agent class constructor function
var ac = function (arg1,arg2) {
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

// Analyze the agent class constructor function (for AIOS level 1)
print(myJam.analyze(ac,{level:2,classname:'ac',verbose:1}));

// Read agent classes from file ..
myJam.readClass('myclasses.js',{verbose:1});

// Two agent snapshots in JSON+ text format
var agent1 = '{"x":100,"y":200,"act":{"init":"function () { log(\\"I am initializing with x=\\"+this.x) }","read":"function (){inp([\\"SENSOR1\\",_],function (t) {this.x=t[1]}) }","comp":"function () { this.x++;this.y--; log(this.x+\\",\\"+this.y);rd([\\"SENSOR2\\",_],function (t) {this.y=t[1]}) }","notify":"function () { out([\\"ADC\\",this.x,this.y]) }","wait":"function () {sleep(1000);}"},"trans":{"init":"function () {return read}","read":"function () {return comp}","comp":"function () {return notify}","notify":"function () {return wait}","wait":"function () {return comp}"},"next":"init","id":"xojagomo","ac":"ac"}';
var agent2 = '{"x":1001,"y":2001,"act":{"init":"function () { log(\\"I am initializing with x=\\"+this.x) }","read":"function (){inp([\\"SENSOR1\\",_],function (t) {this.x=t[1]}) }","comp":"function () { this.x++;this.y--; log(this.x+\\",\\"+this.y);rd([\\"SENSOR2\\",_],function (t) {this.y=t[1]}) }","notify":"function () { out([\\"ADC\\",this.x,this.y]) }","wait":"function () {sleep(1000);}"},"trans":{"init":"function () {return read}","read":"function () {return comp}","comp":"function () {return notify}","notify":"function () {return wait}","wait":"function () {return comp}"},"next":"init","id":"mojagomo","ac":"ac"}';

// called from host application
var a1 = myJam.createAgent(ac,[1,2],1);
var a2 = myJam.createAgent(ac,[1000,2000],1);
var a3 = myJam.createAgent(ac,[10000,20000],1);
var a4 = myJam.createAgent(ac,[100,200],1);
var a5 = myJam.execute(agent1);
var a6 = myJam.createAgent('myclass',[8,0],1);

// called from host application that restarts an agent snapshot on this node
myJam.migrate(agent2);

// called from host application
for(var i = 1; i < 7; i++)
  myJam.out(['SENSOR1',123*i]);
print('Host signaling '+a1+'..');
myJam.signal(a1,'SIG1','argument');
