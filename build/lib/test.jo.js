var Jam = require('jamlib');
var util = require('util');
var div = function (x,y) {return (x/y)|0};

var rnd = Math.random;

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
 */
function link(dest) {
  console.log('Checking link to '+dest);
  return true;
}

/** Send agent text code to a destination.
 */
function send(data,dest) {
  console.log(data.length+' -> '+dest);
  console.log(data);
  return data.length;
}


function sq (x) {return x*x};

var myJam = Jam.Jam({
  connections : {
    path: {
      send:send,
      link:link
    }
  },
  consumer:consumer,
  print:console.log,
  provider:provider,
  verbose:0,
});
myJam.extend([0,1,2],'square',sq);
myJam.start();

var ac = function (arg1,arg2) {
  /* Body variables */
  this.x=arg1; // Arg1
  this.y=arg2;
  /* Activities */
  this.act = {
    init: function () { /* Initilization */ log('init '+this.x+' and square '+square(this.x)+'..\n')},
    read: function () {inp(['SENSOR1',_],function (t) {this.x=t[1]})},
    comp: function () {this.x++;this.y--;log(this.x+','+this.y); 
                       // Access of tuple space 
                       // log('Starting monitor agent '+create('monitor\n',[]));
                       rd(['SENSOR2',_],function (t) {this.y=t[1]}) },
    notify: function () {out(['ADC',this.x,this.y])},
    wait: function () {
      sleep(1000);},
    migrate: function () {if (link(DIR.PATH('/next'))) moveto(DIR.PATH('/next'));}
  };
  this.trans = {
    init: function () {return read},
    read: function () {return comp},
    comp: function () {return notify},
    notify: function () {return wait},
    wait: function () {return migrate},
    migrate: function () {return comp}
  };
  this.on = {
    'SIG1': function (arg) {
      log('Got signal SIG1('+arg+')');
    },
    error: function (e,error) {log('Exception '+e+': '+error)}
  }
  this.next='init';
}
print(myJam.analyze(ac,{level:2,classname:'myclass',verbose:1}));

var agent1 = '{"x":100,"y":200,"act":{"init":"function () { log(\\"I am initializing with x=\\"+this.x) }","read":"function (){inp([\\"SENSOR1\\",_],function (t) {this.x=t[1]}) }","comp":"function () { this.x++;this.y--; log(this.x+\\",\\"+this.y);rd([\\"SENSOR2\\",_],function (t) {this.y=t[1]}) }","notify":"function () { out([\\"ADC\\",this.x,this.y]) }","wait":"function () {sleep(1000);}"},"trans":{"init":"function () {return read}","read":"function () {return comp}","comp":"function () {return notify}","notify":"function () {return wait}","wait":"function () {return comp}"},"next":"init","id":"xojagomo","ac":"ac"}';
var agent2 = '{"x":1001,"y":2001,"act":{"init":"function () { log(\\"I am initializing with x=\\"+this.x) }","read":"function (){inp([\\"SENSOR1\\",_],function (t) {this.x=t[1]}) }","comp":"function () { this.x++;this.y--; log(this.x+\\",\\"+this.y);rd([\\"SENSOR2\\",_],function (t) {this.y=t[1]}) }","notify":"function () { out([\\"ADC\\",this.x,this.y]) }","wait":"function () {sleep(1000);}"},"trans":{"init":"function () {return read}","read":"function () {return comp}","comp":"function () {return notify}","notify":"function () {return wait}","wait":"function () {return comp}"},"next":"init","id":"mojagomo","ac":"ac"}';

var start=new Date().getTime();
// called from host application
var a1 = myJam.createAgent(ac,[1,2],1);
var a2 = myJam.createAgent(ac,[1000,2000],1);
var a3 = myJam.createAgent(ac,[10000,20000],1);
var a4 = myJam.createAgent(ac,[100,200],1);
var a5 = myJam.execute(agent1);

// called from host application that restarts an agent snapshot on this node
myJam.migrate(agent2);

setTimeout(function () {
  for(var i = 1; i < 7; i++)
    // called from host application
    myJam.out(['SENSOR1',123*i]);
  print('['+(new Date().getTime())+'] Host signaling '+a1+'..');
  myJam.signal(a1,'SIG1','argument');
  myJam.schedule();
},500);
var stop=new Date().getTime();
print('Creation of one agent: '+(stop-start)/5+' millisec');


print(util.inspect(myJam.stats('process')))
print(myJam.version());
var mem = process.memoryUsage();
print('rss:'+div(mem.rss,1024)+
      ' heapUsed:'+div(mem.heapUsed,1024)+
      ' heapSize:'+div(mem.heapSize,1024));
