var Shell = require('./libjamsh');
var App = require('../jamapp/libapp');
var UI = App.UI({});
UI.init();
UI.builder({},{
  pages : {
    main: {
      label1:  {type:'label',  center:true, top:1, content:'Menu'},
      button1: {type:'button', left:1,  content:'QUIT',  bg:'red', onclick: process.exit},    
      button2: {type:'button', right:1,  content:'AGENTS',  bg:'green', onclick:'agents'},    
      button3: {type:'button', top:4, width:UI.screen.width-8,  center:true, content:'START',  bg:'black', onclick:start},    
      button4: {type:'button', top:8, width:UI.screen.width-8,  center:true, content:'STOP',  bg:'white', onclick:stop},    
      syslog: { type:'log',    top:12, left:4, width:UI.screen.width-8, height:UI.screen.height-12, label:'System Log' },
      next : 'agents'
    },
    agents: {
      label1:  {type:'label',  center:true, top:1, content:'Agents'},
      button1: {type:'button', left:1,  content:'<< HOME',  bg:'blue', onclick:'main'},    
      button2: {type:'button', top:4, width:UI.screen.width-8, center:true,  content:'CREATE',  bg:'red', onclick: create}, 
      input1: { type:'input', top:8, width:UI.screen.width-8, center:true, label:'Message', value:'world' },   
      agentlog: { type:'log', top:12, left:4, width:UI.screen.width-8, height:UI.screen.height-12, label:'Agent Messages' },
      prev : 'main'
    }
  },
  on : {
    keypress : [
       { key:['escape', 'q', 'C-c'], handler:function(ch, key) { return process.exit(0); } },
       { key:['left','right'], handler: function(ch, key) {
          if (key.name=='right' && UI.pages[UI.page].next){
            UI.pages.hide('this');
            UI.pages.show('next');    
          } else if (key.name=='left' && UI.pages[UI.page].prev) {
            UI.pages.hide('this');
            UI.pages.show('prev');    
          }
      }}
    ]
  }
},{});

function start() { UI.pages.main.button3.setStyle({bg:'white'}); UI.pages.main.button4.setStyle({bg:'black'}); cmd.start()  }
function stop() { cmd.stop(); UI.pages.main.button3.setStyle({bg:'black'}); UI.pages.main.button4.setStyle({bg:'white'}) }
function create (){ cmd.create('agent',UI.pages.agents.input1.getValue())}

function agent (msg) {
  this.msg=msg;
  this.act = { init:function () {}, greetings: function () { log('hello '+this.msg) }, end: function () { log('bye'); kill() }}
  this.trans = { init:greetings,greetings:end }
  this.next = init
}

var options = {
  modules : {
  },
  nameopts : {length:8, memorable:true, lowercase:true},
  Nameopts : {length:8, memorable:true, uppercase:true},
  output : UI.pages.main.syslog.log.bind(UI.pages.main.syslog),
  outputAgent : UI.pages.agents.agentlog.log.bind(UI.pages.agents.agentlog),
  server : true,
}
var cmd = Shell(options).init().cmd();
cmd.compile (agent);

cmd.port(DIR.IP(10001));
