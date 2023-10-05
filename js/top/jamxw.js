/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     5-12-18 by sbosse.
 **    $VERSION:     1.1.12
 **
 **    $INFO:
 **
 **  JAM Shell with X11 GUI
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var JamShell = Require('shell/shell');
var X11 = Require('x11/core/x11');
var Win = Require('x11/win/windows');

if (process.argv.indexOf('-h')>0) 
  return print('usage: jamxw [-i(ndex) #num] [-p(airing)] [-po(rtoffset) #num] [-cli] [script] [-e(execute) "shell commands"]');

String.prototype.chunk = function(size) {
    return [].concat.apply([],
        this.split('').map(function(x,i){ return i%size ? [] : this.slice(i,i+size) }, this)
    )
}

var options = {
  version:'1.1.12',
  config1:'config',
  config2:'setup',
  config3:'jam',
  log: {
    history:20,
    columns:69,
    lineheight:15,
    width:500,
    height:400,
  },
  number:'',
  width: 200,
  height: 360,
  button: {
    height:20,
  },
  margin : { left:5, right:5, top:5 },
  shell : {
    modules : {
    },
    nameopts : {length:8, memorable:true, lowercase:true},
    Nameopts : {length:8, memorable:true, uppercase:true},
    output : console.log,
    type:'relay',
    server : true,
  },
  portoff: 0,
  pairing: false,
  nowin  : false,
  verbose:1,
}


var stats = {
  agents:0,
  links:0,
  log:[],
  msg:[],
  ports:[],
}



if (process.argv.indexOf('-nowin')>0) options.nowin=true;
if (process.argv.indexOf('-cli')>0) options.nowin=true;
if (process.argv.indexOf('-p')>0) options.pairing=true;
if (process.argv.indexOf('-i')>0) options.number=Number(process.argv[process.argv.indexOf('-i')+1]);
if (process.argv.indexOf('-po')>0) options.portoff=Number(process.argv[process.argv.indexOf('-po')+1]);
if (!process.env.DISPLAY) options.nowin=true;

/** GUI
  *
  */
function gui () {
  function info (msg) {
    if (options.verbose) Io.out(msg);
    var lines = msg.split('\n'); 
    lines.forEach(function (line) { 
      if (line.length > options.log.columns) {
        var first=true;
        line.chunk(options.log.columns).forEach(function (line2) { stats.log.push(first?line2:" "+line2); first=false; }); 
      } else stats.log.push(line); 
    });
    while (stats.log.length > options.log.history) stats.log.shift();
    if (win2 && win2.visible) updateInfo(win2);
  }

  function speak(msg) {
    if (options.verbose) Io.out(msg);
    var lines = msg.split('\n'); 
    lines.forEach(function (line) { stats.msg.push(line) });
    while (stats.msg.length > options.msg.history) stats.msg.shift();
  }

  function updateInfo(win) {
    var x=options.margin.left, y = win._data.y0, linesW=win._data.lines, i=1;
    for (i=0;i<options.log.history;i++) {
      win.modify(linesW[i],{text:stats.log[i]?stats.log[i]:'  '});
    }
  }

  options.shell.output=info;
  options.shell.outputAgent=info;

  if (options.number != '') info('[JXW] I am node number '+options.number)+'.';

  var root = Win.windows({});
  var state = 0;

  root.start(function (err) {
    info('[JXW] Root windows instance created');
  });
  if (options.pairing) options.height += 90;
  var win1 = root.window({width:options.width,height:options.height,title:'JAM'}, function () {
   info('[JXW] Window 1 exposed');
   win1.emit('expose');
  });
  win1.on('keypress',function (key) {
    if (key=='XK_q') process.exit();
  });
  var win2

  var width = options.width-options.margin.left-options.margin.right;
  var y = options.button.height/2+options.margin.top;
  var WNodeName = win1.add({id:'NodeName',shape:'text',
            x:options.width/2+options.margin.left*2,
            y:y,
            text:"",
            style:{color:'blue',align:'center',size:14}
  });
  y += options.button.height+options.margin.top*2;

  win1.add({id:'ButtonExit', shape:'button',
            width:width,
            height:options.button.height,
            x:width/2+options.margin.left,
            y:y,
            label:{text:'Exit',color:'white'},
            line: {width: 1,color: 'black'},fill : {color: 'black'},  
            handler:function () {process.exit()}
  });

  y += options.button.height+options.margin.top*2;
  var ButtonStart = win1.add({id:'ButtonStart', shape:'button',
            width:width,
            height:options.button.height,
            x:width/2+options.margin.left,
            y:y,
            label:{text:'Start',color:'white'},
            line: {width: 1,color: 'green'},fill : {color: 'green'},  
            handler:function () {
              switch (state) {
                case 0: 
                  win1.modify(ButtonStart,
                    {line: {width: 1,color: 'gray10'},fill : {color: 'gray10'}});
                  win1.modify(ButtonStop,
                    {line: {width: 1,color: 'red'},fill : {color: 'red'}});
                  win1.modify(WStatus1,
                    {text:"Status:      ON",style:{color:'green'}});
                  state=1;
                  cmd.start();
                  break;
              }
            }
  });

  y += options.button.height+options.margin.top*2;
  var ButtonStop = win1.add({id:'ButtonStop', shape:'button',
            width:width,
            height:options.button.height,
            x:width/2+options.margin.left,
            y:y,
            label:{text:'Stop',color:'white'},
            line: {width: 1,color: 'gray10'},fill : {color: 'gray10'},  
            handler:function () {
              switch (state) {
                case 1: 
                  win1.modify(ButtonStart,
                    {line: {width: 1,color: 'green'},fill : {color: 'green'}});
                  win1.modify(ButtonStop,
                    {line: {width: 1,color: 'gray10'},fill : {color: 'gray10'}});
                  win1.modify(WStatus1,
                    {text:"Status:      OFF",style:{color:'red'}});
                  state=0;
                  // kill all agents
                  cmd.kill('*');
                  cmd.stop();
                  break;
              }

            }
  });
  y += options.button.height+options.margin.top*2;
  var WButtonInfo = win1.add({id:'ButtonInfo', shape:'button',
            width:width,
            height:options.button.height,
            x:width/2+options.margin.left,
            y:y,
            label:{text:'Info',color:'white'},
            line: {width: 1,color: 'gray40'},fill : {color: 'gray40'},  
            handler:function () {
              if (!win2) {
                win2 = root.window({width:options.log.width,height:options.log.height,title:'JAM-'+cmd.name('node')+' LOG'}, function () {
                  win2.emit('expose');
                });
                var x=options.margin.left,y=options.button.height+options.margin.top*2;
                win2.add({id:'ButtonClose', shape:'button',
                  width:options.log.width-options.margin.left*2,
                  height:options.button.height,
                  x:options.log.width/2,
                  y:y,
                  label:{text:'Close',color:'white'},
                  line: {width: 1,color: 'green'},fill : {color: 'green'},  
                  handler:function () {
                    win2.hide();
                  }
                });
                y += options.button.height+options.margin.top*2;
                win2.add({id:'ButtonClear', shape:'button',
                  width:options.log.width-options.margin.left*2,
                  height:options.button.height,
                  x:options.log.width/2,
                  y:y,
                  label:{text:'Clear',color:'white'},
                  line: {width: 1,color: 'orange'},fill : {color: 'orange'},  
                  handler:function () {
                    stats.log=[];
                    updateInfo(win2);
                  }
                });
                y += options.button.height+options.margin.top*2;
                var linesW=[];
                for (var i=0;i<options.log.history;i++) {
                  linesW.push(win2.add({id:'LogLine'+i,shape:'text',x:x,y:y,text:""}));
                  y += options.log.lineheight;
                };
                win2.on('expose', function () { updateInfo(win2) });
                win2._data={lines:linesW};
              } else {
                win2.show(); updateInfo(win2)
              }
            }
  });

  /********** Status and Stats ***********/

  y += options.button.height+options.margin.top*2;
  var WStatus1=win1.add({id:'Status1',shape:'text',
            x:options.margin.left,
            y:y,
            text:"Status:      OFF",
            style:{color:'red',align:'left',size:14}
  });
  y += options.button.height+options.margin.top;
  var WStatsLink=win1.add({id:'StatsLink',shape:'text',
            x:options.margin.left,
            y:y,
            text:"Links:       0",
            style:{color:'black',align:'left',size:14}
  });
  y += options.button.height+options.margin.top;
  var WStatsAgent=win1.add({id:'StatsAgent',shape:'text',
            x:options.margin.left,
            y:y,
            text:"Agents:      0",
            style:{color:'black',align:'left',size:14}
  });
  y += options.button.height+options.margin.top;
  var WTime=win1.add({id:'Time',shape:'text',
            x:options.margin.left,
            y:y,
            text:"Time:        0",
            style:{color:'gray40',align:'left',size:14}
  });

  /************ Ports Info **************/
  function portinfo(index,proto,port) {
    // proto = UDP TCP HTP PIP SOC
    win1.modify('Port'+index,{text:proto+' '+port})
  }
  function addport(proto,port) {
    var index = stats.ports.length;
    stats.ports[index]={proto:proto,port:port};
    portinfo(index,proto,port);
    win1.modify('StatsPort',{text:"Ports:       "+(index+1)})
  }
  function delport(proto,port) {

  }
  y += options.button.height+options.margin.top;
  var WStatsPort=win1.add({id:'StatsPort',shape:'text',
            x:options.margin.left,
            y:y,
            text:"Ports:       0",
            style:{color:'blue',align:'left',size:14}
  });
  y += options.button.height;
  var WPort0=win1.add({id:'Port0',shape:'text',
            x:options.margin.left,
            y:y,
            text:"",
            style:{color:'blue',align:'left',size:14}
  });
  var WPort1=win1.add({id:'Port1',shape:'text',
            x:options.width/2-options.margin.left,
            y:y,
            text:"",
            style:{color:'blue',align:'left',size:14}
  });
  y += options.button.height;
  var WPort2=win1.add({id:'Port2',shape:'text',
            x:options.margin.left,
            y:y,
            text:"",
            style:{color:'blue',align:'left',size:14}
  });
  var WPort3=win1.add({id:'Port3',shape:'text',
            x:options.width/2-options.margin.left,
            y:y,
            text:"",
            style:{color:'blue',align:'left',size:14}
  });
  y += options.button.height;
  var WPort4=win1.add({id:'Port4',shape:'text',
            x:options.margin.left,
            y:y,
            text:"",
            style:{color:'blue',align:'left',size:14}
  });
  var WPort5=win1.add({id:'Port5',shape:'text',
            x:options.width/2-options.margin.left,
            y:y,
            text:"",
            style:{color:'blue',align:'left',size:14}
  });
  y += options.button.height;
  var WPort6=win1.add({id:'Port6',shape:'text',
            x:options.margin.left,
            y:y,
            text:"",
            style:{color:'blue',align:'left',size:14}
  });
  var WPort7=win1.add({id:'Port7',shape:'text',
            x:options.width/2-options.margin.left,
            y:y,
            text:"",
            style:{color:'blue',align:'left',size:14}
  });


  /********** Ports Pairing **********/
  if (options.pairing) {
    var PairStates=[]
    var pairing = false;
    function pair(dir) {
      if (pairing) return;
      switch (PairStates[dir]) {
        case 0:
          win1.modify("ButtonPair"+dir,{label:{text:"?"}});
          PairStates[dir]=1;
          pairing=true;
          console.log('Pairing with '+dir+' ..');
          break;
        case 1:
          break;
      }

    }
    y += options.button.height+options.margin.top;
    var WButtonPairNorth = win1.add({id:'ButtonPairNorth', shape:'button',
              width:40,
              height:options.button.height,
              x:width/2,
              y:y,
              label:{text:'P',color:'gray40'},
              line: {width: 1,color: 'gray40'},  
              handler:function () {pair('North') },
    });
    PairStates['North']=0;

    y += options.button.height+options.margin.top;
    win1.add({id:'LabelPair',shape:'text',
              x:options.width/2,
              y:y,
              text:"Pair",
              style:{color:'green',align:'center',size:14}
    });
    var WButtonPairWest = win1.add({id:'ButtonPairWest', shape:'button',
              width:40,
              height:options.button.height,
              x:40,
              y:y,
              label:{text:'P',color:'gray40'},
              line: {width: 1,color: 'gray40'},  
              handler:function () {pair('West') },
    });
    PairStates['West']=0;
    var WButtonPairEast = win1.add({id:'ButtonPairEast', shape:'button',
              width:40,
              height:options.button.height,
              x:options.width-40,
              y:y,
              label:{text:'P',color:'gray40'},
              line: {width: 1,color: 'gray40'},  
              handler:function () {pair('East') },
    });
    PairStates['East']=0;
    y += options.button.height+options.margin.top*2;
    var WButtonPairSouth = win1.add({id:'ButtonPairSouth', shape:'button',
              width:40,
              height:options.button.height,
              x:width/2,
              y:y,
              label:{text:'P',color:'gray40'},
              line: {width: 1,color: 'gray40'},  
              handler:function () {pair('South') },
    });
    PairStates['South']=0;
  }

  var clock=0;
  setInterval(function () {
    clock++;
    win1.modify(WTime,{text:"Time:        "+clock});
  },1000)


  var shell = JamShell(options.shell).init(function () {})
  shell.on('port', function (dir,addr) {
    var proto='UDP';
    switch (addr && addr.proto) {
      case 'http': proto='HTP'; break;
      case 'udp':  proto='UDP'; break;
      case 'tcp':  proto='TCP'; break;
    }
    addport(proto,dir.ip)
  });
  shell.on('link+', function (addr) {
    stats.links++;
    win1.modify(WStatsLink,{text:"Links:       "+stats.links});
  });
  shell.on('link-', function (addr) {
    stats.links--;
    win1.modify(WStatsLink,{text:"Links:       "+stats.links});
  });
  shell.on('agent+', function (addr) {
    stats.agents++;
    win1.modify(WStatsAgent,{text:"Agents:      "+stats.agents});
  });
  shell.on('agent-', function (addr) {
    stats.agents--;
    win1.modify(WStatsAgent,{text:"Agents:      "+stats.agents});
  });
  var cmd = shell.cmd();
  win1.on('expose',function () {
    var configured=false;
    win1.modify(WNodeName,{text:'[ '+cmd.name('node')+' ]'});
    win1.title('JAM-'+cmd.name('node'));
    [
      options.config1+options.number+'.js',
      options.config2+options.number+'.js',
      options.config3+options.number+'.js'
    ].forEach(function (file) {
      var exists= Io.exists(file);
      configured |= exists;
      if (exists) {
        info('[JXW] Reading configuration script '+file)
        cmd.script(file);
      }
    });
    if (!configured) {
      cmd.port(DIR.IP(options.portoff+10001),{proto:'http'})
      cmd.port(DIR.IP(options.portoff+10002),{proto:'udp'})
      cmd.port(DIR.IP(options.portoff+10003),{proto:'tcp'})
    }
  });
  // Linmit number of scheduler loop iterations per one run to give GUI control and update a chance
  cmd.config({iterations:100})
}

/** CLI
 *
 */
function cli() {
  var configured=false;
  var info = console.log;
  var shell = JamShell(options.shell).init(function () {})
  shell.on('port', function (dir,addr) {
    var proto='UDP';
    switch (addr && addr.proto) {
      case 'http': proto='HTP'; break;
      case 'udp':  proto='UDP'; break;
      case 'tcp':  proto='TDP'; break;
    }
  });
  var cmd = shell.cmd();
  [
    options.config1+options.number+'.js',
    options.config2+options.number+'.js',
    options.config3+options.number+'.js'
  ].forEach(function (file) {
    var exists= Io.exists(file);
    configured |= exists;
    if (exists) {
      info('[JXW] Reading configuration script '+file)
      cmd.script(file);
    }
  });
  if (!configured) {
    cmd.port(DIR.IP(options.portoff+10001),{proto:'http'})
    cmd.port(DIR.IP(options.portoff+10002),{proto:'udp'})
    cmd.port(DIR.IP(options.portoff+10003),{proto:'tcp'})
  }
  // Linmit number of scheduler loop iterations per one run to give GUI control and update a chance
  cmd.config({iterations:100})
  cmd.start();
}

if (options.nowin) cli();
else gui();
