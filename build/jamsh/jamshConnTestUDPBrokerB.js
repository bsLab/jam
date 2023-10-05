// Use broker server for P2P connect via node names
on('link+',function (link,node) {
  log('link+ '+link+' '+node);
  lookup(DIR.PATH('/domain1/*'),function (result) {
    var nodes;
    log('lookup: '+result);
    log(nodes=connected(DIR.IP('%')));
    if (nodes) create('mi',[DIR.NODE(nodes[0])])
  })
});
// Register this node 
port(DIR.IP('*'),{proto:'udp',name:'/domain1/B',broker:env.broker||'127.0.0.1:10001',verbose:1});
var t1 = setTimeout(function () {
  connect(DIR.IP('/domain1/A'));
},200);
function mi(dest){
  this.src=null;
  this.dest=dest;
  this.act={
    init:function ()    { log('Starting on '+myNode())},
    goto: function ()   { log('Going to '+DIR.print(this.dest)); 
                          if (link(this.dest)) moveto(this.dest); else log('No route')},
    goback: function () { this.src=opposite(DIR.NODE());
                          log('Going back to '+DIR.print(this.src)); moveto(this.src)},
    end: function ()    { log('End'); kill() }
  }
  this.trans={
    init:goto, goto:goback, goback:end
  }
  this.next=init
}
compile(mi,{verbose:0})
start()
