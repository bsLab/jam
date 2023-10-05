// UDP Hole Punching; Rendevouz Broker 
// usage UDP_Broker

var dgram = require('dgram');

var udp = dgram.createSocket('udp4');
var udp_port = 10001;

var clients = {};

udp.on('listening', function() {
  var address = udp.address();
  console.log('# listening [%s:%s]', address.address, address.port);
});

udp.on('message', function(data, rinfo) {
  try {
    data = JSON.parse(data);
  } catch (e) {
    return console.log('! Couldn\'t parse data (%s):\n%s', e, data);
  }
  if (data.type == 'register') {
    clients[data.name] = {
        name: data.name,
        connections: {
          local: data.linfo, 
          public: rinfo
        }
    };
    console.log('# Client registered: P %s@[%s:%s | L %s:%s]', data.name,
                rinfo.address, rinfo.port, data.linfo.address, data.linfo.port);
    send(rinfo.address,rinfo.port,{type:'cack',from:'BROKER'});
  } else if (data.type == 'connect') {
    var couple = [ clients[data.from], clients[data.to] ] 
    for (var i=0; i<couple.length; i++) {
      if (!couple[i]) return console.log('Client unknown!');
    }
    
    for (var i=0; i<couple.length; i++) {
      send(couple[i].connections.public.address, couple[i].connections.public.port, {
        type: 'connection',
        client: couple[(i+1)%couple.length],
      }); 
    }
  }
});

var send = function(host, port, msg, cb) {
  var data = new Buffer(JSON.stringify(msg));
  udp.send(data, 0, data.length, port, host, function(err, bytes) {
    if (err) {
      udp.close();
      console.log('# stopped due to error: %s', err);
    } else {
      console.log('# sent '+msg.type+' to '+host+':'+port);
      if (cb) cb();
    }
  });
}

udp.bind(udp_port);
