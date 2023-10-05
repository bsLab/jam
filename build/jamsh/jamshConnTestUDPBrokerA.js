// Use broker server for P2P connect via node names
// > ampbroker verbose:1

on('link+',function (link,node) {
  log('link+ '+link+' '+node);
  create('mi',[DIR.IP('/domain1/B')])
});
// Register this node 
port(DIR.IP('*'),{proto:'udp',name:'/domain1/A',broker:env.broker||'127.0.0.1:10001',verbose:1});
lookup(DIR.PATH('/domain1/*'),function (result) {
  log('lookup: '+result)
});
function mi(dest){
  this.src;
  this.dest=dest;
  this.act={
    init:function ()    {log('Starting on '+myNode())},
    goto: function ()   {log('Going to '+DIR.print(this.dest)); 
                         if (link(this.dest)) moveto(this.dest); else log('No route')},
    goback: function () {log('Going back to '+opposite(this.dest))},
    end: function ()    {log('End'); kill() }
  }
  this.trans={
    init:goto, goto:goback, goback:end
  }
  this.next=init
}
compile(mi,{verbose:0})
start()

