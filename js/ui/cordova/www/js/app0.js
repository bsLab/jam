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
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     12-12-18 by sbosse.
 **    $VERSION:     1.1.13
 **    $INFO:
 **
 **  Cordova App Initialization
 **
 **    $ENDOFINFO
 **
*/
appSensors = {
  Platform : { sensor:'PLATFORM', internal:true, last:undefined, read:function () { 
    return App.platform }},
  Location : { sensor:'LOCATION', internal:true, last:undefined, read:function () { 
    var loc = Network.location;
    if (!loc) return "?"
    else return loc.geo.city+', '+loc.geo.country }},
  Clock : { sensor:'CLOCK', internal:true, last:undefined, read:function () { 
    return Math.floor(Date.now()) }},
  Time : { sensor:'TIME', internal:true, last:undefined, read:function () { 
    var now = new Date();
    var hour = "0" + now.getHours();
    hour = hour.substring(hour.length-2);
    var minute = "0" + now.getMinutes();
    minute = minute.substring(minute.length-2);
    var second = "0" + now.getSeconds();
    second = second.substring(second.length-2);
    return hour + ":" + minute + ":" + second }},
  GeoLocation: { sensor:'GPS', internal:true, state:0, last:undefined, read:function () { 
      if (appSensors.GeoLocation.error) {
        return Network.location?(
              // Use IP localization
              Network.location.gps.lat + ', '+ 
              Network.location.gps.lon              
        ):('? '+ appSensors.GeoLocation.error.message);
      } else if (appSensors.GeoLocation.data) 
        return appSensors.GeoLocation.data.coords.latitude + ', '+ 
               appSensors.GeoLocation.data.coords.longitude + 
               (appSensors.GeoLocation.data.coords.altitude!=undefined?
                 (', '+appSensors.GeoLocation.data.coords.altitude):'');
      else return Network.location?(
              // Use IP localization
              Network.location.gps.lat + ', '+ 
              Network.location.gps.lon      
      ):"?";
    }, init : function () {
      var timer,timer0;
      if (App.platform == 'node-webkit' && !navigator.geolocation) { appSensors.GeoLocation.read=undefined; return }
      if (appSensors.GeoLocation.state) return;
      
      if (cordova.dialogGPS)
        cordova.dialogGPS("Your GPS is Disabled, this app needs to be enable to works.",//message
                          "Use GPS, with wifi or 3G.",//description
                          function(buttonIndex){//callback
                            switch(buttonIndex) {
                              case 0: break;//cancel
                              case 1: break;//neutro option
                              case 2: break;//user go to configuration
                            }},
                            "Please Turn on GPS",//title
                            ["Cancel","Later","Go"]);//buttons
 
      var onSuccess = function(position) { 
        appSensors.GeoLocation.error = null;
        appSensors.GeoLocation.data = position 
        if (timer) clearInterval(timer0);
        if (timer) clearTimeout(timer);
        timer=setTimeout(sample,1000)
      }
      /*
        alert('Latitude: '          + position.coords.latitude          + '\n' +
              'Longitude: '         + position.coords.longitude         + '\n' +
              'Altitude: '          + position.coords.altitude          + '\n' +
              'Accuracy: '          + position.coords.accuracy          + '\n' +
              'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
              'Heading: '           + position.coords.heading           + '\n' +
              'Speed: '             + position.coords.speed             + '\n' +
              'Timestamp: '         + position.timestamp                + '\n');
    */

    // onError Callback receives a PositionError object
    //
    function onError(error) { 
      appSensors.GeoLocation.error = error
      if (!timer0) timer0=setInterval(sample,2000);
    }
    function sample() {
      navigator.geolocation.getCurrentPosition(onSuccess, onError)
    }
    sample();
    // Initial sampler ... called until first GPS callback response (success, error)
    timer0=setInterval(sample,2000)
    appSensors.GeoLocation.state=1;
    }},
  Light: { sensor:'LIGHT', last:undefined, data:undefined , read:function () { 
    return appSensors.Light.data[0]|0 }},
  Magnetics: { sensor:'MAGNETIC_FIELD', last:undefined, data:undefined , read:function () { 
    return appSensors.Magnetics.data.map(function (e) { return Number(e)|0 }) }},
  Acceleration: { sensor:'ACCELEROMETER', last:undefined, data:undefined , read:function () { 
    return appSensors.Acceleration.data.map(function (e) { return Number(e)|0 }) }},
  Acceleration2: { sensor:'LINEAR_ACCELERATION', last:undefined, data:undefined , read:function () { 
    return appSensors.Acceleration2.data.map(function (e) { return Number(e)|0 }) }},
  Temperature: { sensor:'AMBIENT_TEMPERATURE', last:undefined, data:undefined , read:function () { 
    return appSensors.Temperature.data[0]|0 }},
  Temperature2: { sensor:'TEMPERATURE', last:undefined, data:undefined , read:function () { 
    return appSensors.Temperature2.data[0]|0 }},
  Gyroscope: { sensor:'GYROSCOPE', last:undefined, data:undefined , read:function () { 
    return appSensors.Gyroscope.data.map(function (e) { return Number(e)|0 }) }},
  Orientation: { sensor:'ORIENTATION', last:undefined, data:undefined , read:function () { 
    return appSensors.Orientation.data.map(function (e) { return Number(e)|0 }) }},
  Pressure: { sensor:'PRESSURE', last:undefined, data:undefined , read:function () { 
    return appSensors.Pressure.data[0]|0 }},
  Humidity: { sensor:'RELATIVE_HUMIDITY', last:undefined, data:undefined , read:function () { 
    return appSensors.Humidity.data[0]|0 }},
}

appSensorsMap = [];
appSensors.forEach( function(s,p) { appSensorsMap[s.sensor]=s });

var appSensorsInit=false;

appCordova = {
    options : {
      SENSORFREQ: "NORMAL", // "GAME",
    },
    exit : function () {
      if (navigator.app) {
          navigator.app.exitApp();
      } else if (navigator.device) {
          navigator.device.exitApp();
      } else {
          window.close();
      }    
    },
    // Application Constructor
    initialize: function() {
        console.log('appCordova: initialize');
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        var id = 'deviceready';
        var parentElement = document.getElementById(id);
        if (!parentElement) return console.log('appCordova.receivedEvent: No parent element found for '+id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('appCordova handling onDeviceReady');
        
        // cordova-plugin-contacts
        if (navigator && navigator.contacts) {
          var options      = new ContactFindOptions();
          options.filter   = "";
          options.multiple = true;
          var fields       = [navigator.contacts.fieldType.displayName, navigator.contacts.fieldType.name];
          navigator.contacts.find(fields, function (entries) {
            console.log('Found '+entries.length+' contacts');
          }, function (err) {
            console.log('Found no contacts (error '+err+')');
          }, options);
        }
        // cordova-plugin-sensors
        if (!appSensorsInit) {
          appSensorsInit=true;
          console.log('Sensors ...');
          // Sensor initialization
          function add(s) {
            sensors.addSensorListener(appSensors[s].sensor, appCordova.options.SENSORFREQ, 
              function (event) {
                appSensors[s].data=event.values;
              }, 
              function(error) {
                if (error) { appSensors[s].error=error; appSensors[s].read=undefined }
              });        
          }
          for (var s in appSensors) {
            if (appSensors[s].init) {
              appSensors[s].init();
              continue;
            } else if (appSensors[s].internal) continue;
            add(s)
          }
          console.log('Sensors initialized.');
        }
        // Run main schedules ..
        try {
          Run();
        } catch (e) { log(e) }

        // cordova-plugin-file
        appCordova.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
      // console.log('appCordova receivedEvent: '+id);
    },
    startstop : function () {
      if (Jam.state>0) {
        Jam.stop();
        if (Network.state>0) Network.stop(); 
      } else {
        Jam.start();
        if (Network.state==0) Network.start(); 
      }
    }
};

/** Asynchronous File API
 *
 */
function readFile(path,file, cb, onerror) {
  var pathToFile = path+'/'+file;
  window.resolveLocalFileSystemURL(pathToFile, function (fileSystem) {
      fileSystem.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function (e) {
              cb(this.result);
          };
          reader.onerror = function (err) {
            if (onerror) onerror(err); else cb(null,err,pathToFile);
          }
          reader.readAsText(file);
      }, function (err) { if (onerror) onerror(err); else cb(null,err,pathToFile) });
  }, function (err) { if (onerror) onerror(err); else cb(null,err, pathToFile) });
}        
function listDir(path,cb){
  window.resolveLocalFileSystemURL(path, function (fileSystem) {
      var reader = fileSystem.createReader();
      reader.readEntries(
        function (entries) {
          cb(entries);
        },
        function (err) {
          cb(null,err);
        }
      );
    }, function (err) {
      cb(null,err);
    }
  );
}
function writeFile(path, filename , data, cb, onerror) {
  window.resolveLocalFileSystemURL(path, function(dir) {
    dir.getFile(filename, {create: true, exclusive: false}, function(file) {
      file.createWriter(function(fileWriter) {
        fileWriter.onwriteend = function() {
          // log('fileWriter done')
          if (cb) cb();
        };
        fileWriter.onerror = function (err) {
          log(inspect(err))
          if (onerror) onerror(err); else if (cb) cb(err)
        };
		var blob = new Blob([data], {type:'text/plain'});
		fileWriter.write(blob);
        // if (cb) cb();
	  }, function (err) { if (onerror) onerror(err); else if (cb) cb(err) });    
    }, function (err) { if (onerror) onerror(err); else if (cb) cb(err) });
  });
}
function checkIfFileExists(path,filename, cb) {
  window.resolveLocalFileSystemURL(path, function(dir) {
    dir.getFile(filename, {create: false}, 
      function () { cb(true) },
      function () { cb(false) }
    )
  })
}
