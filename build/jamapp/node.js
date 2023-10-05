function node(options) {
  this.text=options.text;
  this.repeat=options.repeat||-1;
  this.time=options.sleep||5000;
  this.server=options.server||false,
  this.links=[];
  this.connects=[];
  this.sensors={};
  this.config={};
  this.pendingjobs=[];
  this.verbose=options.verbose||0;
  this.verboseChild=options.verboseChild||0;
  this.service={};
  this.node=null;
  
  this.act={
    init: function () { 
      var conn;
      this.node=myNode();
      log('Starting. I am from class '+myClass()+' and being '+(this.server?'server':'client'));
      log('Negotiation: '+negotiate('CPU',100000000));
      log('My resources: ',negotiate('?'));
      if (privilege() == 3) {
        this.config=config();
        // if (this.verbose) log(this.config);
        iter(this.config.public,function (addr,ch) {
          var dir=ch;
          if (dir.indexOf('IP')==0) dir='IP';
          if (addr.enable && addr.address && addr.port) {
            conn={address:addr.address,port:addr.port,time:time(),state:false,dir:dir};
            this.connects.push(conn);
          }
        });
        if (this.verbose && !empty(this.connects)) log('Connects: ',this.connects);
      }
      try_rd(0,['SENSORS',_],function (t) {
        if (t) log('Sensors available: ',t[1])
      });      
    },
    percept: function () { 
      var curlinks,curnodes;
      if (this.verbose>1) log('Percepting ..'); 
      // Get all currently linked nodes
      curlinks=link(DIR.IP('*'));
      curnodes=link(DIR.NODE('*'));
      if (this.verbose>1) log(curlinks,curnodes);
      if (curlinks && curlinks.length==curnodes.length) {
        iter(curlinks,function (li,i) {
          if (!this.service[li]) {
            this.service[li]={time:time(),node:curnodes[i]};
            if (this.service[li].node) {
              this.service[li].explorer=
                  create('explorer',{dest:this.service[li].node,verbose:this.verboseChild},1);
            }
          } else {
            send(this.service[li].explorer,'JOB',this.service[li].node);          
          }
        });
      }
      if (this.connects) iter(this.connects,function (to) {
        var url1=to.address+':'+to.port,
            url2=(to.address=='localhost'?'127.0.0.1':to.address)+':'+to.port;
        if (curlinks.indexOf(url1) != 0 &&
            curlinks.indexOf(url2) != 0) {
          log('Connecting to '+url1);
          connect(DIR[to.dir](url1));
        }
      });
    },
    service: function () {
    
    },
    wait: function () { if (this.verbose>1) log('Sleeping ..'); sleep(this.time) },
    end: function () { log('Terminate!'); kill() }
  };
  this.trans={
    init:percept,
    percept:function () { return this.pendingjobs.length?service:wait },
    service:wait,
    wait:function ()  { if (this.repeat>0) this.repeat--; return this.repeat!=0?percept:end }
  }
  
  this.on = {
    'CREATE': function (e,arg) { log(e,arg) },
    'DELIVER': function (s) {
      log('Got sensors',s);
    },
    'PONG': function (explorer) {
      // reply to PING; explorer is alive and reachable!
    },

  }
  this.next=init;
}
