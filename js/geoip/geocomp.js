
var geo = Require('geoip/geoip');
if (0) geo.init (function () {
  console.log('ready');
  //geo.save();
  console.log(geo.lookup('134.102.219.4'));
});

else geo.load (function () {
  console.log('ready');
  // geo.save();
  console.log(geo.lookup('134.102.20.20'));
});
