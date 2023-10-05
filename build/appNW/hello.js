function hello(msg) {
  this.msg = msg || 'world';
  this.counter = 4;
  this.act = {
    start : function () {
      log('I am starting ..')
    },
    speak: function () {
      log('Hello '+this.msg);
    },
    wait: function () {
      sleep(1000)
    },
    end : function () {
      log('Terminating.')
      kill()
    } 
  }
  this.trans = {
    start:speak,
    speak:wait,
    wait: function () { this.counter--; return this.counter==0?end:speak }
  }
  this.next = start
}
