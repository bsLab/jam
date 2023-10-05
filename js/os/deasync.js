/*!
 * deasync
 * https://github.com/abbr/deasync
 *
 * Copyright 2014-2015 Abbr
 * Released under the MIT license
 */
 
(function () {
		
	var fs = Require('fs'),
		path = Require('path'),
        file,i,paths,        
		binding;
	
	// Seed random numbers [gh-82] if on Windows. See https://github.com/laverdet/node-fibers/issues/82
	if(process.platform === 'win32') Math.random();
    paths=[
      global.TOP+'/../node/deasync/'+process.platform+'/'+process.versions.node+'/deasync.node',
      global.TOP+'/../node/deasync/'+process.platform+'/deasync.node',
      process.platform+'/'+process.versions.node+'/deasync.node',
      process.platform+'/deasync.node',
      ''
    ];
    for (i in paths) {
      file=paths[i];
      console.log(file)
      if (fs.existsSync(file)) break;          
    }
    if (file=='') {
      console.log('No deasync binary module found!');
      return;
    }
    file=fs.realpathSync(file);

    binding = require(file); // bindings(file);
	
	function deasync(fn) {
		return function() {
			var done = false;
			var args = Array.prototype.slice.apply(arguments).concat(cb);
			var err;
			var res;

			fn.apply(this, args);
			module.exports.loopWhile(function(){return !done;});
			if (err)
				throw err;

			return res;

			function cb(e, r) {
				err = e;
				res = r;
				done = true;		
			}
		}
	}
	
	module.exports = deasync;
	
	module.exports.sleep = deasync(function(timeout, done) {
		setTimeout(done, timeout);
	});
	
	module.exports.runLoopOnce = function(){
		process._tickDomainCallback();
		binding.run();
	};
	
	module.exports.loopWhile = function(pred){
	  while(pred()){
		process._tickDomainCallback();
		if(pred()) binding.run();
	  }
	};

}());
