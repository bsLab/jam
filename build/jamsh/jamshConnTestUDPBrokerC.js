// Use broker server for P2P connect via node names
// Register this node 
port(DIR.IP('*'),{proto:'udp',name:'/domain1/C',broker:env.broker||'127.0.0.1:10001',verbose:1});
var x = setTimeout(function () {
  connect(DIR.IP('/domain1/A'));
},500);
lookup(DIR.PATH('/domain1/*'),function (result) {
  log('lookup: '+result)
});
