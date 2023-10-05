function explorer(options) {
  this.dest=options.dest||DIR.ORIGIN;
  this.dir=DIR.ORIGIN;
  this.root=null;
  this.link=null;
  this.node=null;
  this.sensors={};
  this.goback=false;
  this.verbose=options.verbose||0;
  this.act = {
    init: function () {
      this.root=myNode();
      log('Starting to destination '+this.dest);
    },
    goto: function () {
      this.goback=true;   // after next percept action
      if (this.link=link(DIR.NODE(this.dest))) moveto(DIR.NODE(this.dest));
      else log('No way to '+this.dest+'!'),kill();
    },
    percept: function () {
      this.node=myNode();
      if (this.goback && this.verbose) 
        log('I am an explorer and coming from node '+this.root+', link '+DIR.print(this.link));
      this.sensors[this.node]={};
      try_rd(0,['SENSOR','cpu',_],function (t) {
        if (t) this.sensors[this.node].cpu=t[2];
      });
      try_rd(0,['SENSOR','proc',_],function (t) {
        if (t) this.sensors[this.node].proc=t[2];
      });
    },
    goback: function () {
      if (link(DIR.NODE(this.root))) moveto(DIR.NODE(this.root));
      else log('No way back to '+this.root+'!'),kill();
    },
    deliver: function () {
      if (this.verbose) log(this.sensors);
      send(myParent(),'DELIVER',this.sensors);
    },
    wait: function () {
      this.goback=false;
      sleep()
    }
  }
  this.trans = {
    init:percept,
    percept:function () { return this.goback?goback:goto },
    goto:percept,
    goback:deliver,
    deliver:wait,
    wait:percept
  }
  this.on = {
    'PING': function () {
      // notify parent that I am alive
      send(myParent,'PONG',me());
    },
    'JOB': function (dest) {
      // A new job to go to 
      this.dest=dest;
      wakeup();
    }
  }
  this.next = init
}
