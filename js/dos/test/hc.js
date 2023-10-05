/**
 * Created by sbosse on 5/23/15.
 */

var Io = require('../io');
//Io.trace_open('/tmp/hc.trace');
var trace = Io.tracing;
var http = require('http');
var Sch = require('../scheduler');
var Perv = require('../compat').pervasives;

var log = 0;
var port=3000;
var test=10000;

var scheduler = Sch.Scheduler();
scheduler.Init();


function get (path,callback) {
    Io.trace(trace||('GET: req '+Perv.mtime()));
    var req = http.request({
        hostname: 'localhost',
        port: port,
        path: path,
        keepAlive:true,
        method: 'GET',
        headers: {
        }
    } , function(res) {
        res.setEncoding('utf8');
        res.on('data', function (data) {
            Io.trace(trace||('GET: repl '+Perv.mtime()));
            Io.log((log<1)||('GET BODY: ' + data));
            callback(data);
        });
    });
    req.on('error', function(e) {
        Io.out('[CONN] GET problem with request ['+self.srv_url+':'+self.srv_ipport+path+']: ' + e.message);
    });
    req.end();
}

function put (path,data,callback) {
    var req = http.request({
        hostname: 'localhost',
        port: port,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
    } , function(res) {
        Io.log((log<10)||('[CONN] POST STATUS: ' + res.statusCode));
        Io.log((log<10)||('[CONN] POST HEADERS: ' + JSON.stringify(res.headers)));
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            Io.log((log<1)||('[CONN] POST BODY: ' + chunk));
            if (callback != undefined) callback(chunk);
        });
    });

    req.on('error', function(e) {
        Io.out('[CONN] PUT problem with request ['+self.srv_url+':'+self.srv_ipport+path+']: ' + e.message);
    });

    // write data to request body
    req.write(data);
    req.end();

}
var count=0;

Sch.ScheduleBlock([function () {Io.out(count);process.exit(0);}]);
var start,stop;
Sch.ScheduleBlock([function() {
    stop=Perv.mtime();
    Io.out(count);
    Io.out('Test result: '+((test/(stop-start)*1000)|0)+' ops/sec ('+(((stop-start)*1000/test)|0)+' microsec/op)');
    process.exit(0);}]);
Sch.ScheduleLoop(function(index) {return index<test;},[
    function () {
        Sch.Suspend();
        var context=Sch.GetCurrent();
        get('/?rpc=request',function(data) {
            count++;
            Sch.Wakeup(context);
            Sch.ScheduleNext();
        })
    }
]);
Sch.ScheduleBlock([function() {start=Perv.mtime();}]);

scheduler.Run();
