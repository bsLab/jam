var Shell = require('./libjamsh');
var options = {
  modules : {
  },
  nameopts : {length:8, memorable:true, lowercase:true},
  Nameopts : {length:8, memorable:true, uppercase:true},
  output : console.log,
  server : true,
}
var cmd = Shell(options).init().cmd();

cmd.port(DIR.IP(10001));
cmd.start()
cmd.exec('var stats={x:stats("conn"),y:stats("vm")}; stats');
