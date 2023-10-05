var log = 0;

var Io = require('../io');
//Io.trace_open('/tmp/std.trace');

var Net = require('../network');
var Sch = require('../scheduler');
var Conn = require('../connection');
var Rpc = require('../rpc');
var Std = require('../std');
var Router = require('../router');
var util = require('util');
var Comp = require('../compat');
var assert = Comp.assert;
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Status = Net.Status;
var Command = Net.Command;

var trace = Io.tracing;

var help=false;
var cmd=Command.STD_INFO;
var shift='';
var caps=[];
var test=0;
var verbose=false;

process.argv.forEach(function (val, index, array) {
    if(index>1) {
        if (String.equal(shift,''))
            String.match(val,[
                ['-help',function() {help=true;}],
                ['-h',function() {help=true;}],
                ['-test',function() {shift='test';}],
                ['-verbose',function() {verbose=true;}],
                ['info',function() {cmd=Command.STD_INFO;}],
                ['status',function() {cmd=Command.STD_STATUS;}],
                ['age',function() {cmd=Command.STD_AGE;}],
                ['touch',function() {cmd=Command.STD_TOUCH;}],
                ['destroy',function() {cmd=Command.STD_DESTROY;}],
                [function() {caps.push(val);}]
            ]);
        else {
            String.match(shift,[
                ['test',function () {test=Perv.int_of_string(val);}]
             ]);
            shift='';
        }
    }
});

if (help || cmd==undefined || caps.length==0) {
    Io.out('usage: '+process.argv[0]+' '+process.argv[1]);
    Io.out('         [-help -test #loops]');
    Io.out('         info status age touch destroy');
    Io.out('         cap capfile ..');
}
