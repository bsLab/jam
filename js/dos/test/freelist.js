/**
 * Created by sbosse on 4/29/15.
 */
var Io = require('../io');
var Net = require('../network');
var Sch = require('../scheduler');
var Conn = require('../connection');
var Rpc = require('../rpc');
var Std = require('../std');
var Afs = require('../afs');
var Router = require('../router');
var util = require('util');
var assert = require('../compat').assert;
var Fl = require('../freelist');

var fbs = Fl.Free_blocks();
fbs.free_create(6,1000000);
Io.out(fbs.free_info())