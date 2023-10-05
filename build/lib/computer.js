var Jam = process.release?require('./jamlib'):require('jamlib');
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




var myJam = Jam.Jam({
  consumer:consumer,
  print:console.log,
  provider:provider,
  verbose:0,
});
myJam.init();

var ac = function (arg1,arg2) {
  /* Body variables */
  this.x=arg1; // Arg1
  this.N=arg2;
  this.vec=[];
  this.sq = function (x) {return x*x};
  this.sum = function (x,n) {
    var i;
    for(i=0;i<n;i++) {
      x=x+this.sq(n);
    }
    return x;
  };
  /* Activities */
  this.act = {
    init: function () { 
      /* Initilization */ 
      negotiate('SCHED',1000000);
      this.vec=[1,2,3];
      log('init '+this.x+' * '+this.N);
    },
    comp: function () {
      var i;
      log('compute start');
      for(i=0;i<this.N;i++) {
        this.x=this.sum(this.x,1000);
      }
      log('compute stop');
    },
    wait: function () {
      log('wait');
      sleep(100);
    },
    terminate: function () {
      log('terminate.');
    }
  };
  this.trans = {
    init: function () {return comp},
    comp: function () {return wait},
    wait: function () {return terminate},
    terminate: function () {return}
  };
  this.on = {
    'SIG1': function (arg) {
      log('Got signal SIG1('+arg+')');
    },
    error: function (e,error) {
      switch (e) {
        case 'SCHEDULE':
          log('SCHEDULE timeout '+error);
          break;
        case 'EOL':
          log('EOL timeout '+error);
          break;
        default:
          log('Exception '+e+': '+error);
      }
    }      
  }
  this.next='init';
}

// Analyze agent constructor and create sandbox environment (activity variables)
var p,env={},
    an = myJam.analyze(ac,{level:2,classname:'myclass',verbose:1}); 
print(an.report);
for (p in an.interface.activities) env[p]=p;


var start=new Date().getTime();
// called from host application
var N=1000;
var agents = [],code,text,agent;
for(var n=0;n<N;n++) {
  /*
  agent = new ac(1000,1000);
  text = myJam.Aios.Code.ofCode({agent:agent},false,false); 
  code = myJam.Aios.Code.toCode(text,1);
  agents[n]=code; 
  myJam.world.nodes[0].register(code);
  */
  agents[n] = myJam.createAgent(ac,[1000,1000],2);
}
var stop=new Date().getTime();
print('Creation of one agent: '+(stop-start)/N+' millisec');

myJam.start();


// print(util.inspect(myJam.stats('process')))
print(myJam.version());
var mem = process.memoryUsage();
print('rss:'+div(mem.rss,1024)+
      ' heapUsed:'+div(mem.heapUsed,1024)+
      ' heapSize:'+div(mem.heapSize,1024));
