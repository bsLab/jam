// jamsh test APP C

// watcher agent testing tuple space access (with timeout)

function watcher (options) {
  this.data=[];
  this.act = {
    start: function () { 
      log('START')
      if (random(1)>0.5) out(['TST',1]),log('OUT');
    },
    check: function () {
      log('CHECK')
      rd.try(1000,['TST',_],function (t) {
         if (t) this.data.push(t),log('GOTIT');
         else log('DONT GOTIT');
      })
    },
    end:function () { log('END'); log(this.data); kill() }
  }
  this.trans = {
    start: check,
    check: end
  }
  this.on = {
  }
  this.next = start;
}

compile(watcher,'watcher');
setlog('time',false);
setlog('Time',true);
var watcher = create('watcher',{},1);
start();

