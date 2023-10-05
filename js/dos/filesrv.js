/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     18-05-15 by sbosse.
 **    $VERSION:     1.1.4
 **
 **    $INFO:
 **
 **  HTTP file server Module.
 **
 *
 **    $ENDOFINFO
 */


"use strict";
var log = 0;

var Io = Require('com/io');
var Net = Require('dos/network');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var util = Require('util');
var http = Require('http');
var xmldoc = Require('dos/ext/xmldoc');
var Sch = Require('dos/scheduler');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var String = Comp.string;
var Array = Comp.array;
var Filename = Comp.filename;
var trace = Io.tracing;
var div = Perv.div;

var isNode = Comp.isNodeJS();

/*********************************************
**  HTTP File SERVER
 *********************************************/
/** Auxiliary File Server
 *
 * @param {options} 
 * @constructor
 */
var File = function(options) {
    this.srv_ip=options.srv_ip;                 // URL
    this.srv_ipport=options.srv_ipport;         // URL:port
    this.dir=options.dir;                       // Local file directory to be served
    this.https=undefined;
    this.verbose=options.verbose||0;
    this.index=options.index||'index.html';
};

File.prototype.init=function () {
    var self=this,
        stat='';

    this.dir=Filename.path_absolute(this.dir);
    this.https = http.createServer(function(request, response) {
        //Io.inspect(request);
        var path=String.prefix(request.url,'?');
        String.match(request.method,[
            ['GET',function() {
                // TODO
                Io.log(((log+self.verbose)<2)||('[HTTP] Get: '+path));
                var data='';
                try {
                    path=self.dir+'/'+Filename.path_normalize(path=='/'?self.index:path);
                    data=Io.read_file_bin(path);
                    stat='OK';
                } catch (e) {
                    data='File server: failed to read file '+path+' , '+util.inspect(e);
                    stat=data;
                }
                if (data == undefined) {
                  stat='Failed: no data read.';
                  Io.out('[HTTP] : Failed to get data for file '+path);
                }
                Io.log(((log+self.verbose)<2)||('[HTTP] Get: '+request.url+' -> '+stat+' ['+(data?data.length:0)+']'));

                if (data!=undefined) {
                    //response.writeHead(200);
                    response.writeHead(200,{'Access-Control-Allow-Origin': '*'});
                    response.write(data);
                    response.end();
                }
            }]
        ])
    });
    this.https.on("connection", function (socket) {
        socket.setNoDelay(true);
    });
    Io.out('[HTTP] servicing directory: ' + this.dir);

};

File.prototype.start=function () {
    var self=this;
    if (self.verbose) Io.out('[HTTP] Starting ..');
    this.https.listen(this.srv_ipport, function () {
        Io.out('[HTTP] listen: listening on *:' + self.srv_ipport);
    });
};


module.exports = {
    /** Auxiliary File/HTML Server
     *
     * @param srv_ip
     * @param srv_ipport
     * @param {string} dir Local directory path
     * @returns {File}
     * @constructor
     */
    // type options = {srv_ip,srv_ipport,dir,verbose?,index?}
    File: function(options) {
        var obj = new File(options);
        Object.preventExtensions(obj);
        return obj;
    }
}
