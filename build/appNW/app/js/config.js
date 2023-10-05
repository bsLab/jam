jamConfig = {
  startJam      : true,
  startNetwork  : false,
  loadAgents    : ['chat.js'],
  startAgents   : {chat:{demo:false}},
  network:[
    {ip:"localhost",ipport:10001,enable:true},
    {ip:"192.168.0.100",ipport:10001,enable:false},
    {},
    {}
  ],
  capabilities : [
    "",
    "",
    "",
    ""
  ],
  log:{agent:true,parent:false,time:false,Time:true,class:false},  // Message flags: agent parent time class
  default       : false,
  verbose       : 0,
  popupLevel    : 1,
}

