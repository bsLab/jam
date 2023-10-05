function hello(options) {
  this.text=options.text;
  this.repeat=options.repeat||1;
  this.time=1000;
  this.act={
    init: function () { 
      log('Hello '+this.text+'. I am from class '+myClass()+' on '+myNode()); 
      sleep(1000);
    },
    diffuse: function () {
      log(link(DIR.EAST))
      if (link(DIR.EAST)) moveto(DIR.EAST);
      else trans.update(diffuse,wait);
    },
    wait: function () { log('Sleeping ..'); sleep(this.time) },
    end: function () { log('Terminate!'); kill() }
  };
  this.trans={
    init:diffuse,
    diffuse:init,
    wait:function ()  { this.repeat--; return this.repeat?wait:end }
  };
  this.next=init;
}
