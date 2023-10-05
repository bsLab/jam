var udprpc = Require('rpc/udp_rpc');
var version = "1.1.3"

function rpc(proto,port,arrayOfNamedFunctions,options) {
  options=options||{}
  switch (proto.toUpperCase()) {
    case 'UDP': 
      return new udprpc(options.dgramType||'udp4',port,
                        arrayOfNamedFunctions,options);
            
  }
}

var clientCache=[];
// server
function getreq (url, requestCallback, options) {
  var proto = url.match(/^([a-zA-Z]+):/),
      port  = url.match(/([0-9]+)$/);
  proto=(proto&&proto[1])||'udp';
  port=(port&&port[1]);
  if (!port) throw Error('getreq: invalid port');
  var myport = rpc(proto,port,[
    function request(source, data, callback) {
      callback(requestCallback(data,source))
    }
  ],options)
  return myport;
}
// client
function trans (url,data,replyCallback,options) {
  var proto = url.match(/^([a-zA-Z]+):/),
      destination = url.replace(/^([a-zA-Z]+):\/\//,''),
      port  = url.match(/([0-9]+)$/);
  proto=(proto&&proto[1])||'udp';
  port=(port&&port[1]);
  if (!port) throw Error('getreq: invalid port');
  if (clientCache[url]) {
    if (clientCache[url].state!='listening') {
      clientCache[url].queue.push([destination,data,replyCallback]);
    } else
      clientCache[url].request(destination,data,replyCallback||function(){});
    clientCache[url].timestamp=Date.now();
  } else {
    var myport = clientCache[url] = rpc(proto,0,[
      function request(source, data, callback) {}
    ],options);
    clientCache[url].timestamp=Date.now();
    clientCache[url].queue=[];
    clientCache[url].queue.push([destination,data,replyCallback]);
    myport.on('init',function () {
      while (clientCache[url].queue.length) {
        var next = clientCache[url].queue.shift();
        myport.request(next[0],next[1],next[2]||function(){});
      }
    });
    
  }
}

module.exports = {
  clientCache : clientCache,
  rpc    : rpc,
  getreq : getreq,
  trans  : trans,
  version : version
}
