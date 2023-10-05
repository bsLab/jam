function ac1(options) {
  this.text=options.text;
  this.repeat=options.repeat||1;
  this.time=1000;
  this.act={
    init: function () { log('Starting with text:'+this.text+'. I am from class '+myClass()); },
    wait: function () { log('Sleeping ..'); sleep(this.time) },
    end: function () { log('Terminate!'); kill() }
  };
  this.trans={
    init:wait,
    wait:function ()  { this.repeat--; return this.repeat?wait:end }
  };
  this.next=init;
}
