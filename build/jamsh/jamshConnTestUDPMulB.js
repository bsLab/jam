port(DIR.IP(5002),{proto:'udp',verbose:1});
connect(DIR.IP(5001));

function test() {
  this.origin=null;
  this.act = {
    init: function () { this.origin=myNode(); log('init') },
    explore: function () { this.links=link(DIR.IP('%')); log('explore',this.links); if (!this.links || !this.links.length) sleep(1000) },
    migrate: function () { var dst=random(this.links); log('moveto ',dst); moveto(DIR.NODE(dst)) },
    goback: function () { log('goback ',this.origin); moveto(DIR.NODE(this.origin)) },
    end: function () { log('done'); kill() }  
  }
  this.trans = {
    init:'explore',
    explore: function () { return this.links&&this.links.length?'migrate':'explore' },
    migrate: 'goback',
    goback: 'end'
  }
  this.next='init'
}

create(test,{})
start()


