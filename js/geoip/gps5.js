/* GPS location based on an external database lookup */

/* requires https */

var serviceHost="location.services.mozilla.com",
    servicePath="/v1/geolocate?key=test";
    


function geolocate (cb) {
  var https;
  if (typeof require == 'function') try {
    https = require('https');
  } catch (e) { /* TODO Browser */ }
  if (!https) return cb(new Error('ENETWORK'));
  var req = https.request({
    hostname: serviceHost,
    port: 443,
    path: servicePath,
    method: 'GET'
  }, function (res) {
    res.on('data', function (d){
      try {
        var json = JSON.parse(d);
        cb(json)
      } catch (e) { cb(e) };
    });
  })
  
  req.on('error', function (e) {
    console.error(e);
    cb(e);
  });
  req.end();
}

module.exports = { geolocate : geolocate };
