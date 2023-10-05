
var Options = {
  // stage1
  locate : {
    primary   : {http:'ag-0.de:9999',https:'ag-0.de:9998',timeout:1000},
    secondary : {http:'ip-api.com:80',https:'ip-api.com:80',path:'/json',timeout:2000},
  },
  // stage2
  locate5 : {
    secondary : {https:'location.services.mozilla.com:443',path:'/v1/geolocate?key=test'},
  },
  // stage 3: lat,lon -> location info lookup
  reverse : {
    primary : {https:'api.opencagedata.com',path:'/geocode/v1/json?q=LAT+LON&key=8e7c3730678842468d6acf450ecbca16'},
    secondary: {https:'nominatim.openstreetmap.org',path:'/reverse/?format=json&lat=LAT&lon=LON'},
  },
  verbose : 0
}

var http=Require("http"),https; /* https on demand */

function ip(url)    { return url.split(':')[0] }
function port(url)  { return url.split(':')[1] }

// 1. GPS/GEO via IP and external database service
function stage1 (cb,options,location) {
  var e,r;
  if (!http.xhr && http.request) {
    // node.js
    e={hostname:ip(options.http),
       path:options.path||'',method:"GET",
       port:port(options.http)};
    if (Options.verbose) console.log('locate.stage1',e);
    r=http.request(e,function(a){
        a.setEncoding("utf8");
        var c="";
        a.on("data",function(a){c+=a}),
        a.on("end",function(){
          try {
            var info=JSON.parse(c);
            if (Options.verbose) console.log('locate.stage1.res',info);
            Object.assign(location,{
              ip:info.query,
              gps:{lat:info.lat,lon:info.lon},
              geo:{city:info.city,country:info.country,countryCode:info.countryCode,region:info.region,zip:info.zip}
            })
            return cb(location);
          } catch (err) {
            return cb(err); 
          }
        })
    });
    r.on("error",function(a)  { 
      if (Options.verbose) console.log('locate.stage1.err',a);
      return cb(a);
    })
    r.setTimeout(options.timeout,function() {  
      if (Options.verbose) console.log('locate.stage1.err',"ETIMEOUT");
      return cb(new Error("ETIMEOUT"));
    }) 
    r.end();
  } else {
    // Browser
    var proto=document.URL.indexOf('https')==0?'https':'http';
    e={uri:proto+'://'+options[proto]+'/'+options.path,
       method:"GET",
       headers:{}};
    if (Options.verbose) console.log('stage1',e);
    http.request(e,function(err,xhr,body){
          if (err) {
            if (Options.verbose) console.log('locate.stage1.err',err);
            return cb(err);
          }
          try {
            var info=JSON.parse(body);
            if (Options.verbose) console.log('locate.stage1.res',info);
            Object.assign(location,{
              ip:info.query,
              gps:{lat:info.lat,lon:info.lon},
              geo:{city:info.city,country:info.country,countryCode:info.countryCode,region:info.region,zip:info.zip}
            })
            return cb(location);
          } catch (err) {
            if (Options.verbose) console.log('locate.stage1.err',err);
            return cb(err); 
          }
    })
  }
}

// 2. GPS via IP and external database service
function stage2 (cb,options,location) {
  if (!https || !https.request) return cb(new Error('ENETWORK'));
  if (!https.xhr && https.request) {
    var e = {
      hostname: ip(options.https),
      port: port(options.https),
      path: options.path,
      method: 'GET'
    }
    if (Options.verbose) console.log('locate.stage2',e);
    var req = https.request(e, function (res) {
      res.on('data', function (d){
        try {
          var pos = JSON.parse(d);
          if (Options.verbose) console.log('locate.stage3.res',pos);
          location.gps5 = { lat: pos.location.lat, lon:pos.location.lng }
          cb(location)
        } catch (e) { if (Options.verbose) console.log('locate.stage2.err',e); cb(e) };
      });
    })

    req.on('error', function (e) {
      cb(e);
    });
    req.end();
  } else {
    // Browser
    e={uri:'https://'+options.https+'/'+options.path,
       method:"GET",
       headers:{}};
    if (Options.verbose) console.log('locate.stage2',e);
    https.request(e,function(err,xhr,body){
          if (err) {
            if (Options.verbose) console.log('locate.stage2.err',err);
            return cb(err);
          }
          try {
            var pos = JSON.parse(body);
            if (Options.verbose) console.log('locate.stage2.res',pos);
            location.gps5 = { lat: pos.location.lat, lon:pos.location.lng }
            return cb(location);
          } catch (err) {
            if (Options.verbose) console.log('locate.stage2.err',err);
            return cb(err); 
          }
    })
    
  }
}

// GPS -> GEO mapping by external database service
function stage3 (cb,options,location) {
  if (!https || !https.request) return cb(new Error('ENETWORK'));
  options.path=options.path
                  .replace(/LAT/,location.gps5.lat)
                  .replace(/LON/,location.gps5.lon);
  if (!https.xhr && https.request) {
    var e = {
      hostname: ip(options.https),
      port: port(options.https),
      path: options.path,
      method: 'GET'
    }
    if (Options.verbose) console.log('locate.stage3',e);
    var req = https.request(e, function (res) {
      res.on('data', function (d){
        try {
          var res = JSON.parse(d);
          var loc;
          if (Options.verbose) console.log('locate.stage3.res',res);
          if (res.address) loc=res.address;
          else if (res.results && res.results[0]) loc=res.results[0].components;
          location.geo5 = {
            city:loc.city,
            zip:loc.postcode,
            street:loc.road,
            number:loc.house_number,
            country:loc.country
          }
          cb(location)
        } catch (e) { if (Options.verbose) console.log('locate.stage3.err',e); cb(e) };
      });
    })

    req.on('error', function (e) {
      if (Options.verbose) console.log('locate.stage3.err',e);
      cb(e);
    });
    req.end();
  } else {
    // Browser
    e={uri:'https://'+options.https+'/'+options.path,
       method:"GET",
       headers:{}};
    if (Options.verbose) console.log('locate.stage3',e);
    https.request(e,function(err,xhr,body){
       if (err) {
        if (Options.verbose) console.log('locate.stage3.err',err);
        return cb(err);
       }
       try {
          var res = JSON.parse(body);
          var loc;
          if (Options.verbose) console.log('locate.stage3.res',res);
          if (res.address) loc=res.address;
          else if (res.results && res.results[0]) loc=res.results[0].components;
          location.geo5 = {
            city:loc.city,
            zip:loc.postcode,
            street:loc.road,
            number:loc.house_number,
            country:loc.country
          }
          return cb(location);
        } catch (err) {
          if (Options.verbose) console.log('locate.stage3.err',err);
          return cb(err); 
        }
    })
    
  }
}

                                   
var todo = {
  // 1. Direct ISP - IP - GPS/GEO lookup
  // 1a. with proxy
  stage1A: function (cb,errors,location) {
    stage1(function (res) {
      if (res instanceof Error) {
        errors.push({url:Options.locate.primary,error:res});
        todo.stage1B(cb,errors,location);
      } else {
        todo.stage2A(cb,errors,location);        
      }
    },Options.locate.primary,location);
  },
  // 1b. w/o proxy
  stage1B: function (cb,errors,location) {
    stage1(function (res) {
      if (res instanceof Error) {
        errors.push({url:Options.locate.secondary,error:res});
        todo.stage2A(cb,errors,location);
      } else {
        todo.stage2A(cb,errors,location);        
      }
    },Options.locate.secondary,location);    
  },
  // 2. Get geo position (lat,lon)
  stage2A: function (cb,errors,location) {
    stage2(function (res) {
      if (res instanceof Error) {
        errors.push({url:Options.locate5.secondary,error:res});
        todo.finalize(cb,errors,location);
      } else  {
        todo.stage2B(cb,errors,location);        
      }
    },Options.locate5.secondary,location);
  },
  // 3. Get geo location (country,..)
  stage2B: function (cb,errors,location) {
    stage3(function (res) {
      if (res instanceof Error) {
        errors.push({url:Options.reverse.primary,x:1,error:res});
        todo.finalize(cb,errors,location);
      } else  {
        todo.finalize(cb,errors,location);
      }
    },Options.reverse.primary,location);
  },
  finalize : function (cb,errors,location) {
    cb(location,errors);
  }
}

function locate (cb,options) {
  var e;
  if (options) Options=Object.assign(Options,options);
  if (typeof require == 'function' && !https) try {
    https = require('https');
  } catch (e) { /* TODO Browser */ } else  if (http.xhr) https = http;
  if (!http) return cb(new Error('ENOTSUPPORTED'));
  todo.stage1A(cb,[],{});
  return;
}

module.exports={locate:locate,options:Options};

