global.TOP='/home/sbosse/proj/jam/js';
require(TOP+'/top/module')([process.cwd(),TOP]);
var Io = Require('com/io');
var Aios = Require('jam/aios');
var Db = Require('db/db');
var Fs = require('fs');
var db = Db.Sqlc('/tmp/sqld',1);

var repl;
db.init();

Io.out(db.send('help'));
repl=db.recv();
Io.out(repl);
