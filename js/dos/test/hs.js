/**
 * Created by sbosse on 5/23/15.
 */

var Io = require('../io');
var http = require('http');
var String = require('../compat').string;
var Perv = require('../compat').pervasives;

var log=0;

var server = http.createServer(function(request, response) {
    //Io.inspect(request);
    String.match(request.method,[
        ['GET',function() {
            Io.log((log<1)||Perv.mtime());
            Io.log((log<1)||request.url);
            //Io.inspect(response);
            //response.send('STD_OK');
            response.writeHead(200);
            response.write('STD_OK');
            response.end();
        }],
        ['POST',function() {
            Io.out(request.url);
        }]
    ])
});

server.on("connection", function (socket) {
    socket.setNoDelay(true);
});

server.listen(3000);
