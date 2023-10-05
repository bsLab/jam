var jamsh = require('./jamsh.debug');
var shell = jamsh.Shell({server:true,verbose:1});
shell.on('output',console.log);
shell.init();

shell.process('out(["a",1])');
shell.process('rd(["a",_])');
shell.process('start()');
shell.process('time()');

