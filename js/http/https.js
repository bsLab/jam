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
 **    $INITIAL:     (C) 2006-2022 bLAB
 **    $CREATED:     18-05-15 by sbosse.
 **    $RCS:         $Id:$
 **    $VERSION:     1.3.1
 **
 **    $INFO:
 **
 **  HTTP(S) File Server Module.
 **
 *
 **    $ENDOFINFO
 */


"use strict";
var log = 0;

var Io = Require('com/io');
var util = Require('util');
var http = Require('http');
var https; try { https = require('https'); } catch (e) {}
var fs = Require('fs');
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
 * typeof @options  = { sip,ipport,dir,verbose?,index?,log? } 
 * typeof File = constructor
 */
var HTTPSrv = function(options) {
    if (!(this instanceof HTTPSrv)) return new  HTTPSrv(options);
    this.srv_ip     = options.ip;     // URL
    this.srv_ipport = options.ipport; // URL:port
    this.dir        = options.dir;    // Local file directory to be served
    this.proto      = options.proto||'http';
    this.https=undefined;
    this.verbose=options.verbose||0;
    this.index=options.index||'index.html';
    this.log=options.log||Io.log;
    this.options=options;
};

HTTPSrv.prototype.init=function () {
    var self=this,
        stat='';
    this.dir=Filename.path_absolute(this.dir);
    
    function handler(request, response) {
        //Io.inspect(request);
        response.origin=request.headers.origin;
        var path=String.prefix(request.url,'?');
        String.match(request.method,[
            ['GET',function() {
              // TODO
              if (self.verbose>2) self.log('[HTTP] Get: '+path);
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
                  if (self.verbose>1) self.log('[HTTP] : Failed to get data for file '+path);
                  data='Error: Not found: '+path;
              }
              if (self.verbose>2) self.log('[HTTP] Get: '+request.url+' -> '+stat+' ['+(data?data.length:0)+']');

              if (data!=undefined) {
                    //response.writeHead(200);
                if (response.origin!=undefined)
                      response.writeHead(200,{'Access-Control-Allow-Origin': response.origin,
                                              'Access-Control-Allow-Credentials': 'true',
                                             });
                else
                      // response.writeHead(200,{'Content-Type': 'text/html'});
                      response.writeHead(200,{'Access-Control-Allow-Origin': '*'});
                response.write(data);
                response.end();
              }
            }]
        ])
    };
    if (this.proto=='http') this.https = http.createServer(handler);
    else if (this.proto=='https' && https) {
      // Dummy certs, can be overriden by options
      var _options={
        key:"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCj1c0IRFOg2FZt\ncDtVgdQetk0RtOmU5ukMs09xw+irPHZeHmtu0gWy11yCHfqHwaqsrYdmnC1EAJsr\nlyBgdoiOn2MJNxW52/x7/I1ZVUke6p4OPyhNGaQHcCPmp/dBzMH9yY6K/HHPDqR/\ncDR1ait3ttpsvMxFT0baHZsxm/bajKUETSkGOW5gugq32egyjAKfHYSbbSY2zm8R\n3g1kluYKGvhjt/SvTPjcGYiTMwkyKBTuvpfZqxRArkaMlQdKKKBT+X3cY47ZD4I3\n0Hy8kirTeLvPf91THeI8pcTVU8a6qPryttOB9cRruzYJF4Z0sdnAzTPmVugPjRqn\n6BFPb0v1AgMBAAECggEASTMAHV5xwt6FlvXa/LQ58tLekjezWRzmKQ+AQkMWlFM6\nS4jp1SSu+R2xrkz4n2kO+YG6ikTjEIv4yDwIcjDjiF18ISTkZxr7ruXCvZQWTGLk\n5VagifoXyF75G1gWZ+a1Ec/ZCQ4LR0iyhGG8fm1GKIGhC4468giejltF+J9HZpNT\nJTcOZ/d5+WtwFa67o1vEqp8tIZ6bA6as9Jp4brmWifXSNZpGh3oIa6eQcVAl9b32\nxnh9F1oBwAz5D5TbHZ7RfiRsoUKeEprsJ8XEfVwO5R8xd7IMc5eXqDcZIZHJEWeV\nRqY0GOGRCdBWZydrHnyIpkCcJ9TytN4nx3OD0BsCYQKBgQDRrXDM88lVWW3htatu\nZiEZQIVkJ3Lj/S9/YByeU22UBUr7UZfWAQWEF7nhDnoa3NeQULMekgeH8O4Yd7Qd\nsGHm9DwiqPiyw2MRUU2eM074GiDpgy1K+oP669YHSMe+Vq5TnW1deNDuPYm4R85V\nGqG0rpG5yN6FojMmQsn+0qTxDQKBgQDIB7E8AMLFV7g1e8mor4uMa68GyScl1bFK\ngQ3Yoq+yLUV0zziFIcR9IwGxopC81QN4qXynb1JnlQyTASEPxJT558wFIUqRwnND\nxbwfwcNL5KVN7F1yTn55mmKHuxYGURs3Au8ErwQ+cdDu3bFsQxk8eBEob3OEzAd1\nxEW1yAh8iQKBgGaU4y3yS1rtULvvhHqTjrfrABe60RPHp7g6jmXLTT3wxPllttIl\nV8yDSxZXXdfMmc3qHWfka7jPX70quz0XMR6r+MvAPURAITS0wTOXyJfLOLTlz3/y\nRiW5wdF4gviVMd6Ik5v6YsVb6Af3YXPzfo+GJJdvNabNbxbV8DsyVS31AoGAGaTy\n0fB/B/HRCfpOxjOLPntnuwT64dzdl+GntshUohEvwGP4qQjFOg3M38sppyvgAA4q\njwS0mdb//7C7XlwjhU50V4wHFVzKjjvBfIjI0ugDUVQmPstVZ52lWCViE3k+dfUI\nU59keeT5lkYRwwFvMNNrz7VKKBJIOo7pKP72J5ECgYAygg6zNNUzrcUuuZHSpyEM\nx5uy5nmoD81RwlGS0N8m5SwN8jW+c7C7ROUdGakXV69zubMXzAsz4xMJTTSQBep2\nsNTNjlV71UikZhhx/spLZqaLb0ZIgCxj4dfNZS3XRh7Wi1bYuf2III+SUf4zitG0\nuGKHIqJgcSumSzjYGiMSAA==\n-----END PRIVATE KEY-----\n",
        cert:"-----BEGIN CERTIFICATE-----\nMIIDITCCAgmgAwIBAgIJAKMxU7sE4FnyMA0GCSqGSIb3DQEBCwUAMCcxCzAJBgNV\nBAYTAlVTMRgwFgYDVQQDDA9FeGFtcGxlLVJvb3QtQ0EwHhcNMjIwNjA1MTEzMDMy\nWhcNMjUwMzI1MTEzMDMyWjAnMQswCQYDVQQGEwJVUzEYMBYGA1UEAwwPRXhhbXBs\nZS1Sb290LUNBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo9XNCERT\noNhWbXA7VYHUHrZNEbTplObpDLNPccPoqzx2Xh5rbtIFstdcgh36h8GqrK2HZpwt\nRACbK5cgYHaIjp9jCTcVudv8e/yNWVVJHuqeDj8oTRmkB3Aj5qf3QczB/cmOivxx\nzw6kf3A0dWord7babLzMRU9G2h2bMZv22oylBE0pBjluYLoKt9noMowCnx2Em20m\nNs5vEd4NZJbmChr4Y7f0r0z43BmIkzMJMigU7r6X2asUQK5GjJUHSiigU/l93GOO\n2Q+CN9B8vJIq03i7z3/dUx3iPKXE1VPGuqj68rbTgfXEa7s2CReGdLHZwM0z5lbo\nD40ap+gRT29L9QIDAQABo1AwTjAdBgNVHQ4EFgQU763HyX73limLTXAwJ4SwpVGv\nD/AwHwYDVR0jBBgwFoAU763HyX73limLTXAwJ4SwpVGvD/AwDAYDVR0TBAUwAwEB\n/zANBgkqhkiG9w0BAQsFAAOCAQEAaO662eNFN2wWtMsUrITX8pwUAJRKxkFvxEQI\nt0HgtfxxvZeTgYjLeTv5U0Jmv8K+6QnNnFIfoc9CD0fFaETw9Z6a+mzliMnHwzZ2\ndI+3eahIcRZ86VuvwisJsDzpW1931Jz+/arIEZprTTSfCPkJs9U790W4wfA6/7Cc\nyZ57EWiug8sP/0NcgofKNNCiixlnlNhXJIOh7/7gXw+zJVdyoKUHMJMoii1UElzN\nVTm6YKSTiuOc+rOIbC4Aw5gQqRDtUqbf/Vcr2IEdOqlL7r4vW9urH+/p3sLVF20C\n8ssjea8dmHcrb5Omu0tUMbhzMM1/eHZS3iwcauu2VWzBDOOjeQ==\n-----END CERTIFICATE-----\n"
      }
      if (fs.existsSync(this.options.key)) { console.log('Loading '+_this.options.key); _options.key=fs.readFileSync(this.options.key,'utf8') };
      if (fs.existsSync(this.options.cert)) { console.log('Loading '+this.options.cert); _options.cert=fs.readFileSync(this.options,'utf8') };
      this.https = https.createServer(_options,handler);
    } else throw "ENOTSUPPORTED";
    this.https.on("connection", function (socket) {
      socket.setNoDelay(true);
    });
    this.log('[HTTP] servicing directory: ' + this.dir);

};

HTTPSrv.prototype.start=function () {
    var self=this;
    if (self.verbose) Io.out('[HTTP] Starting ..');
    this.https.listen(this.srv_ipport, function () {
        self.log('[HTTP] listen: listening on *:' + self.srv_ipport);
    });
};

HTTPSrv.prototype.stop=function () {
  if (this.https) this.https.close();
}

module.exports = {
    /** Auxiliary File/HTML Server
     *
     */
    // typeof @options = {ip,ipport,dir,verbose?,index?}
    HTTPSrv: HTTPSrv
}
