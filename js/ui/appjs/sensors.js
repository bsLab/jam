/*
Physical Sensors
*/
Math.frac = function (x,frac) {
  if (frac<=1) {
    frac=(1/frac)|0;
    return Math.round(x*frac)/frac;
  } else {
    return Math.floor(x-(x%frac));
  }
}

Math.signal = {
  filter : {
    boxcar : function (array,points) {
      // https://terpconnect.umd.edu/~toh/spectrum/Smoothing.html
      var result=[];
      points=points||3;
      switch (points) {
        case 3:
          for(var i=1;i<array.length-1;i++) result.push(
            (array[i-1]+array[i]+array[i+1])/3
          );
          return result;
          break;
      }
    },
    // 0 > k > 1 !!!
    lowpass : function (x,k,state) {
      var y,t;
      // typeof @state = { z:number }
      if (state.z == undefined) state.z=0;
      t=(1-k)*x+state.z*k;
      y=t;
      state.z=t;
      return y;
    },
    // 0 > k > 1 !!!!
    highpass : function (x,k,state) {
      var y,t;
      // typeof @state = { z:number }
      if (state.y == undefined) state.y=0;
      if (state.x == undefined) state.x=0;
      // t=(1-k)*x+state.z*(-k);
      t=k*(state.y+x-state.x);
      y=t;
      state.y=t;
      state.x=x;
      return y;    
    },
    // Function constructors
    lowPass : function (k,state) {
      state=state||{}
      return function (x) { return Math.signal.filter.lowpass(x,k,state) }
    },
    highPass : function (k,state) {
      state=state||{}
      return function (x) { return Math.signal.filter.highpass(x,k,state) }
    },
    triangular : function (array,points) {
      // https://terpconnect.umd.edu/~toh/spectrum/Smoothing.html
      var result=[];
      points=points||5;
      switch (points) {
        case 5:
          for(var i=2;i<array.length-2;i++) result.push(
            (array[i-2]+2*array[i-1]+3*array[i]+2*array[i+1]+array[i+2])/9
          );
          return result;
          break;
      }
    },
    
  },
  meanAbsoluteDeviation: function(data) {
    var mean = Math.signal.mean(data);
       return Math.signal.mean(data.map(function(num) {
         return Math.abs(num - mean);
       }));
  },
  mean:function (data) { return data.mean() },
  peak: function (data) {
    if (Utils.isArray(data)) {
      return Math.max(Math.abs(data.max()),Math.abs(data.min()));
    }  
  },
  rms: function (data) {
    return Math.sqrt(data.map(Math.sq).sum()/data.length)
  },
  sample : function (data,frag,filter) {
    return data.sample(frag,filter)
  },
  standardDeviation: function(data) {
    return Math.sqrt(Math.signal.variance(data));
  },
  variance: function (data) {
    if (Utils.isArray(data)) {
      return data.variance()
    }
  }
}
var phySensors = {
  Acceleration : {
    sensor:'ACCEL', info:'x,y,z,time', 
    state : 0,
    offset : { x:0, y:0, z:0 },
    history : [],
    historyN : 100,
    filters : {
      xl : Math.signal.filter.lowPass(0.95),
      yl : Math.signal.filter.lowPass(0.95),
      zl : Math.signal.filter.lowPass(0.95),
      xal : Math.signal.filter.lowPass(0.95),
      yal : Math.signal.filter.lowPass(0.95),
      zal : Math.signal.filter.lowPass(0.95),
    },
    features : {
      xl : 0,
      yl : 0,
      zl : 0,
      xal : 0,
      yal : 0,
      zal : 0,
      dt : 0,
    },
    data  : {},
    init : function () {
      this.start()
    },
    start : function () {
      var self=this;
      if (typeof window.Accelerometer == 'undefined') {
        log('No Accelerometer');
        return;
      }
      if (typeof window.LinearAccelerationSensor == 'undefined') {
        log('No LinearAccelerationSensor');
        return;
      }
      if (typeof window.Gyroscope == 'undefined') {
        log('No Gyroscope');
        return;
      }
      var sensorA = new Accelerometer(),
          sensorB = new Gyroscope(),
          sensorC = new LinearAccelerationSensor({frequency:100});
      Promise.all([navigator.permissions.query({ name: "accelerometer" }),
                   navigator.permissions.query({ name: "magnetometer" }),
                   navigator.permissions.query({ name: "gyroscope" })])
             .then(function (results) {
              if (results.every(result => result.state === "granted")) {
                sensorA.start();
                sensorB.start();
                sensorC.start();
                var countA=0,countB=0,countC=0,t0=0;
                if (0) sensorA.addEventListener("reading", function (event) {
                  var t = Date.now();
                  self.data.x=sensorA.x-self.offset.x;
                  self.data.y=sensorA.y-self.offset.y;
                  self.data.z=sensorA.z-self.offset.z;
                  self.data.t=t;
                });
                if (0) sensorB.addEventListener("reading", function (event) {
                  countB++;
                  var t = Date.now();
                  self.data.x=sensorB.x-self.offset.x;
                  self.data.y=sensorB.y-self.offset.y;
                  self.data.z=sensorB.z-self.offset.z;
                  self.data.t=t;
                });
                if (1) sensorC.addEventListener("reading", function (event) {
                  var t1 = Date.now();
                  self.data.x=sensorC.x-self.offset.x;
                  self.data.y=sensorC.y-self.offset.y;
                  self.data.z=sensorC.z-self.offset.z;
                  self.data.t=t1;
                  self.features.xl = self.filters.xl(self.data.x);
                  self.features.yl = self.filters.yl(self.data.y);
                  self.features.zl = self.filters.zl(self.data.z);
                  self.features.xal = self.filters.xal(Math.abs(self.data.x));
                  self.features.yal = self.filters.yal(Math.abs(self.data.y));
                  self.features.zal = self.filters.zal(Math.abs(self.data.z));
                  self.features.dt  = t1-t0;
                  self.history.push(self.data);
                  if (self.history.length > self.historyN) self.history.shift();
                  t0=t1;
                });
                log('Accelerometer and Gyroscope sensor access granted.')
               } else {
                 log("No permissions to use Accelerometer.");
               }
         });
    },
    read : function () {
      return this.data
    },
    stop : function () {
    }
  },
  AccelerationFeaturesHist : {
    sensor:'ACCELH', 
    info:'xl,yl,zl,time',
    state : 0,
    init : function () {
      this.start()
    },
    start : function () {
    },
    read : function () {
      return phySensors.Acceleration.history
    },
    stop : function () {
    }
  },  
  AccelerationFeatures1 : {
    sensor:'ACCELO', 
    info:'xl,yl,zl,time',
    state : 0,
    init : function () {
      this.start()
    },
    start : function () {
    },
    read : function () {
      return {
        x:Math.frac(phySensors.Acceleration.features.xl,0.01),
        y:Math.frac(phySensors.Acceleration.features.yl,0.01),
        z:Math.frac(phySensors.Acceleration.features.zl,0.01),
        dt: phySensors.Acceleration.features.dt,
        t: phySensors.Acceleration.data.t,
      }
    },
    stop : function () {
    }
  },
  AccelerationFeatures2 : {
    sensor:'ACCELAO', 
    info:'xl,yl,zl,time',
    state : 0,
    init : function () {
      this.start()
    },
    start : function () {
    },
    read : function () {
      return {
        x:Math.frac(phySensors.Acceleration.features.xal,0.01),
        y:Math.frac(phySensors.Acceleration.features.yal,0.01),
        z:Math.frac(phySensors.Acceleration.features.zal,0.01),
        dt: phySensors.Acceleration.features.dt,
        t: phySensors.Acceleration.data.t,
      }
    },
    stop : function () {
    }
  },
  Light : {
    sensor:'LIGHT', info:'intensity/dig,time', 
    data  : {},
    state : 0,
    init : function () {
      this.start()
    },
    start : function () {
      var self=this;
      if (typeof window.AmbientLightSensor == 'undefined') {
        log('No AmbientLightSensor');
        return;
      }
      console.log('light2.start')
      var sensor = new AmbientLightSensor();
      Promise.all([navigator.permissions.query({ name: "ambient-light-sensor" }),
                  ])
             .then(function (results) {
              if (results.every(result => result.state === "granted")) {
                sensor.start();
                var count=0;
                sensor.addEventListener("reading", function (event) {
                  // log('light '+sensor.illuminance)
                  self.data.value=sensor.illuminance;
                  var t = Date.now();
                  self.data.time=t;
                  count++;
                });
                log('AmbientLightSensor granted.')
                self.state=1;
              } else {
                log("No permissions to use AbsoluteOrientationSensor.");
              }
         });
    
    },
    read : function () {
      return this.data
    },
    stop : function () {
    }
  },
  Orientation : {
    sensor:'ORIENT', info:'x,y,z,time', 
    state : 0,
    data  : {},
    init : function () {
      this.start()
    },
    start : function (options) {
      var self=this;
      options=options||{ frequency: 10, referenceFrame: 'device' };
      if (typeof window.AbsoluteOrientationSensor == 'undefined') {
        log('No AbsoluteOrientationSensor');
        return;
      }
      var sensor = new AbsoluteOrientationSensor({frequency:100});
      Promise.all([navigator.permissions.query({ name: "accelerometer" }),
                   navigator.permissions.query({ name: "magnetometer" }),
                   navigator.permissions.query({ name: "gyroscope" })])
             .then(function (results) {
              if (results.every(result => result.state === "granted")) {
                sensor.start(options);
                // not firing?
                if (0) sensor.addEventListener("reading", function (event) {
                  self.data.alpha=sensor.quaternion[0];
                  self.data.beta=sensor.quaternion[1];
                  self.data.gamma=sensor.quaternion[2];
                  var t = Date.now();
                  self.data.time=t;
                });
                // try this
                window.addEventListener('deviceorientation', function(event) {
                  self.data.alpha=event.alpha;
                  self.data.beta=event.beta;
                  self.data.gamma=event.gamma;
                  var t = Date.now();
                  self.data.time=t;
                });
                log('AbsoluteOrientationSensor granted.')
                self.state=1;
               } else {
                 log("No permissions to use AbsoluteOrientationSensor.");
               }
         });
    },
    read : function () {
      return this.data
    },
    stop : function () {
    }
  },
  // GPS5
  GeoLocation5: { sensor:'GEO5', info:'latitude,longitude,altitude', 
                  internal:true, state:0, timer:undefined, 
                  last:undefined, data: undefined, read:function () { 
      if (appSensors.GeoLocation5.data) {
        return [appSensors.GeoLocation5.data.latitude,
               appSensors.GeoLocation5.data.longitude, 
               appSensors.GeoLocation5.data.altitude||0].join(',')
               ;
      } 
      /*else if (Network.location && Network.location.gps5) {
        return [Network.location.gps5.lat,
               Network.location.gps5.lon, 
               0,'@IP'].join(',')
      }*/ else return '?';
    }, init : function () {
      if (navigator.geolocation && Sensors.options.GeoLocation5) {
        console.log('GeoLocation5 (primary): requesting position..');
        navigator.geolocation.getCurrentPosition(function (pos) {
          // console.log(JAMLIB.Io.inspect(pos.coords))
          appSensors.GeoLocation5.data=pos && pos.coords;
          appSensors.GeoLocation5.state=2;
          console.log('GeoLocation5 (primary): got initial sensor data: '+JAMLIB.Io.inspect(pos && pos.coords));
          var watchId = navigator.geolocation.watchPosition(function (pos) {
              // console.log(JAMLIB.Io.inspect(pos.coords))
              _log('GeoLocation5 (primary) watchPosition: got sensor data update: '+JAMLIB.Io.inspect(pos && pos.coords));
              appSensors.GeoLocation5.data=pos.coords;
            }, function (err) {
              appSensors.GeoLocation5.state=0;
              console.log('GeoLocation5 (primary) watchPosition: '+JAMLIB.Io.inspect(err))
            }, {enableHighAccuracy:true,timeout:60000,maximumAge:0});
        }, function (err) {
          _log(err);
          appSensors.GeoLocation5.state=0;
          console.log('GeoLocation5 (primary) getCurrentPosition: '+JAMLIB.Io.inspect(err))
        }, {enableHighAccuracy:true,timeout:60000})
      }
      appSensors.GeoLocation5.state=1;
    }},
}

