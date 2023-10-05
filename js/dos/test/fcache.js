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
var Fc = require('../fcache');

var fc = Fc.Fcache(1000,512);
Io.out(fc.cache_stat())