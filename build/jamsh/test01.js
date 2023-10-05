// jamsh test APP A

// watcher agent

function watcher () {
  this.neighbours=[];
  this.act = {
    start: function () {},
    check: function () {
      var found=link(DIR.IP('%'));
      log(found);
      iter(found,function (node) {
        create('hello',[DIR.NODE(node),DIR.NODE(myNode())]);
      });
      sleep(2000);
    }
  }
  this.trans = {
    start: check,
    check: check
  }
  this.on = {
    'ping': function (arg) { log('pong '+arg) }
  }
  this.next = start;
}

function hello(dest,src) {
  this.dest=dest;
  this.src=src;
  
  this.act = {
    start: function () { 
      log('I am '+me()+' and migrating to '+DIR.print(this.dest));
      moveto(this.dest)
    },
    talk: function () {
      log('Hello you. I am from '+DIR.print(this.src));
    },
    goback: function () {
      moveto(this.src);
    },
    end: function () {
      log('I am back from '+DIR.print(this.dest)); 
      kill()   
    }
  }
  this.trans = {
    start: talk,
    talk: goback,
    goback:end
  }
  this.on = {
    error2: function (err) { log(err) }
  }
  this.next = start;
}
compile(watcher,'watcher');
compile(hello,'hello');
setlog('time',true);
setlog('Time',false);
verbose(2);
var watcher = create('watcher',{},3);
// File HTTP Server
http(10000,'../app/app','app.html');
// AMP HTTP server
port(DIR.IP(10001),{proto:'http'});
start();

setInterval(function () { signal(watcher,'ping','me') }, 5000);
