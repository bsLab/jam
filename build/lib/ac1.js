function ac1(options) {
  this.text=options.text;
  this.act={
    init: function () { log(this.text); },
    end: function () { kill() }
  };
  this.trans={
    init:end
  };
  this.next=init;
}
