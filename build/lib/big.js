var Jam = process.release?require('./jamlib'):require('jamlib');
var div = function (x,y) {return (x/y)|0};
var mem = process.memoryUsage();
print('rss:'+div(mem.rss,1024)+
      ' heapUsed:'+div(mem.heapUsed,1024)+
      ' heapSize:'+div(mem.heapSize,1024));

var util = require('util');

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
  // dirty:true,
  print:console.log,
  provider:provider,
  verbose:0,
});
myJam.init();
myJam.extend([0,1,2],'sprint',function () {return '?'});
myJam.addNodes([{x:1,y:0},{x:0,y:1},{x:1,y:1}]);
myJam.connectNodes([{x1:0,y1:0,x2:1,y2:0},{x1:1,y1:0,x2:1,y2:1},
                    {x1:0,y1:0,x2:0,y2:1},{x1:0,y1:1,x2:1,y2:1}]);
myJam.Aios.options.log.node=true;

print('Has watchdog: '+(myJam.Aios.watchdog!=undefined));

var ac = myJam.open('explorer.js',{verbose:1,classname:'explorer'});

// Analyze agent constructor and create sandbox environment (activity variables)
var p,env={},
    an = myJam.analyze(ac,{level:2,classname:'explorer',verbose:1}); 
print(an.report);
for (p in an.interface.activities) env[p]=p;


var start=new Date().getTime();
// called from host application
var agents = [];
var N = 100;
var text,agent,code ;
var sac = myJam.Aios.Code.makeSandbox(ac,2,env);
myJam.Aios.options.json=false;
for(var n=0;n<N;n++) {
  /*
  agent = new ac(myJam.DIR.EAST,1,0,0,true,0);
  text = myJam.Aios.Code.ofCode({agent:agent},false,true); 
  print(text)
  code = myJam.Aios.Code.toCode(text,1);
  agents[n]=code; 
  myJam.world.nodes[0].register(code);
  */
  agents[n] = myJam.createAgent(sac,[myJam.DIR.EAST,1,0,0,true,0],1);
}
var stop=new Date().getTime();
print('Creation of one agent: '+(stop-start)/N+' millisec');

start=new Date().getTime();
myJam.start();

agent = new ac(myJam.DIR.EAST,1,0,0,true,0);
text = myJam.Aios.Code.ofCode({agent:agent},false,true); 
print('Size of agent code: '+text.length+'\n'+text)

// print(util.inspect(myJam.stats('process')))
print(myJam.version());
mem = process.memoryUsage();
print('rss:'+div(mem.rss,1024)+
      ' heapUsed:'+div(mem.heapUsed,1024)+
      ' heapSize:'+div(mem.heapSize,1024));

var poll=setInterval(function () {
  var p,n=0;
  for(p in myJam.world.nodes) {
    n=n+myJam.world.nodes[p].processes.used;
  }
  if(n==0) {
    stop=new Date().getTime();
    print('Migration of one agent: '+(stop-start)/(N*4)+' millisec');    
    clearInterval(poll);
    mem = process.memoryUsage();
    print('rss:'+div(mem.rss,1024)+
      ' heapUsed:'+div(mem.heapUsed,1024)+
      ' heapSize:'+div(mem.heapSize,1024));

    // process.exit();
    setTimeout(function () {
      if (process.gc) process.gc();
      mem = process.memoryUsage();
      print('rss:'+div(mem.rss,1024)+
        ' heapUsed:'+div(mem.heapUsed,1024)+
        ' heapSize:'+div(mem.heapSize,1024));
      process.exit();
    },500); 
  }
},20);

