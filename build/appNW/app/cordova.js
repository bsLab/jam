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
 **    $CREATED:     09-01-19 by sbosse.
 **    $VERSION:     1.1.7
 **    $INFO:
 **
 ** Cordova Node-Webkit Wrapper (emulation API)
 **
 **    $ENDOFINFO
 **
*/

var nw = require("nw.gui");
gui = nw

if (typeof navigator == 'undefined') navigator = {}
if (typeof cordova == 'undefined') cordova = {}

// cordova-plugin-contacts
// TODO
navigator.contacts = {
    fieldType : {
      id:1,
      displayName:2,
      name:3
    },
    find : function (fields,onsucc,onerr,options) { onerr('not supported'); }
};
ContactFindOptions = function () { return {} }

// Disable what ever of geolocation service is in nw
// delete navigator.geolocation;
// Use JAM satelite localization instead
navigator.geolocation.getCurrentPosition = function (ondata,onerror) {
  if (Network && Network.location && ondata) ondata({coords:{latitude:Network.location.gps.lat,longitude:Network.location.gps.lon}}); 
  else if (onerror) onerror({message:'Currently not active'});
}

function docReady(callback, context) {
    "use strict";
    // The public function name defaults to window.docReady
    // but you can modify the last line of this function to pass in a different object or method name
    // if you want to put them in a different namespace and those will be used instead of 
    // window.docReady(...)
    var baseObj =  window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;
    
    // call this when the document is ready
    // this function protects itself against being called more than once
    function ready() {
        if (!readyFired) {
            // this must be set to true before we start calling callbacks
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                // if a callback here happens to add new ready handlers,
                // the docReady() function will see that it already fired
                // and will schedule the callback to run right after
                // this event loop finishes so all handlers will still execute
                // in order and no new ones will be added to the readyList
                // while we are processing the list
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            // allow any closures held by these functions to free
            readyList = [];
        }
    }
    
    function readyStateChange() {
        if ( document.readyState === "complete" ) {
            ready();
        }
    }
    
    // This is the one public interface
    // docReady(fn, context);
    // the context argument is optional - if present, it will be passed
    // as an argument to the callback
    if (typeof callback !== "function") {
        throw new TypeError("callback for docReady(fn) must be a function");
    }
    // if ready has already fired, then just schedule the callback
    // to fire asynchronously, but right away
    if (readyFired) {
        setTimeout(function() {callback(context);}, 1);
        return;
    } else {
        // add the function and context to the list
        readyList.push({fn: callback, ctx: context});
    }
    // if document already ready to go, schedule the ready function to run
    // IE only safe when readyState is "complete", others safe when readyState is "interactive"
    if (document.readyState === "complete" || (!document.attachEvent && document.readyState === "interactive")) {
        setTimeout(ready, 1);
    } else if (!readyEventHandlersInstalled) {
        // otherwise if we don't have event handlers installed, install them
        if (document.addEventListener) {
            // first choice is DOMContentLoaded event
            document.addEventListener("DOMContentLoaded", ready, false);
            // backup is window load event
            window.addEventListener("load", ready, false);
        } else {
            // must be IE
            document.attachEvent("onreadystatechange", readyStateChange);
            window.attachEvent("onload", ready);
        }
        readyEventHandlersInstalled = true;
    }
};

docReady(function () {
  console.log('load event')
  var event = new Event('deviceready');
  document.dispatchEvent(event);
});

// cordova-plugin-sensors
sensors = {
  addSensorListener: function (sensor, mode, fevent, ferr) {
    ferr('Not supported');
  },
}

// cordova-plugin-file
cordova.file = {
  applicationDirectory:       '/',
  applicationStorageDirectory:'/',
  dataDirectory:              '/',
  downloadDirectory:          (process.env._HOME||process.env.HOME||"/"),
  externalRootDirectory:      "/",
  tempDirectory:              "/tmp/",
  userDirectory:              (process.env._HOME||process.env.HOME||"/"),
}

var fs = require('fs');

// Find Download directory ..
if (fs.existsSync(cordova.file.userDirectory+'/Downloads')) 
  cordova.file.downloadDirectory=cordova.file.userDirectory+'/Downloads';
else if (fs.existsSync(cordova.file.userDirectory+'/downloads')) 
  cordova.file.downloadDirectory=cordova.file.userDirectory+'/downloads';
// Find app root directory
if (fs.existsSync(process.cwd()+'/app.html')) 
  cordova.file.applicationDirectory=process.cwd();
else if (fs.existsSync(process.cwd()+'/app/app.html')) 
  cordova.file.applicationDirectory=process.cwd()+'/app';
cordova.file.dataDirectory = cordova.file.applicationDirectory+'/data'

window.resolveLocalFileSystemURL = function (path, cb, onerror1) {
  var resolvedPath = path;
  var fileSystem = {
    file: function (cb, onerror2) {
      if (!fs.existsSync(resolvedPath)) { 
        if (onerror2) onerror2('Not existing: '+resolvedPath); 
        else if (onerror1) onerror1('Not existing: '+resolvedPath); 
        return; 
      };
      cb(resolvedPath);
    },
    createReader: function () { 
      var reader = {
        readEntries : function (cb,onerror2) {
          if (!fs.existsSync(resolvedPath)) { 
            if (onerror2) onerror2('Not existing: '+resolvedPath); 
            else if (onerror1) onerror1('Not existing: '+resolvedPath); 
            return; 
          };
          try {
            var entries = fs.readdirSync(resolvedPath);
            if (entries) cb(entries.map(
              function (name) {
                try {
                  var stat = fs.lstatSync(resolvedPath+'/'+name);
                  if (stat.isDirectory()) return {isFile:false,isDirectory:true,name:name};
                  else return {isFile:true,isDirectory:false,name:name};
                } catch (err) { return null };
              }).filter(
                function (entry) {
                  if (!entry) return;
                  if (entry.name!='..' && entry.name[0]=='.') return;
                  return entry;
              }));
          } catch (err) {
            if (onerror2) onerror2(err+': '+resolvedPath); 
            else if (onerror1) onerror1(err+': '+resolvedPath); 
          }
        }
      }
      return reader;
    },
    createWriter: function (cb) { 
      var fileWriter = {
        write: function (blob) {
        
        }
      }
      cb(fileWriter);
    },
    getFile: function (filename, options, cb, onerror2) {
      var pathToFile=path+'/'+filename;
      if (options.create) {
        var fileWriter = {}
        
        fileWriter.write = function (blob) {
            // log(pathToFile)
            try {
              fs.writeFileSync(pathToFile, blob.data, 'utf8');
              if (fileWriter.onwriteend) fileWriter.onwriteend();
            } catch (e) {
              var errmsg = 'Write of file '+pathToFile+' failed: '+e.toString();
              if (fileWriter.onerror) fileWriter.onerror(errmsg);
              else if (onerror2) onerror2(errmsg);             
            }    
        }
        
        var file = {
          createWriter: function (cb2) {
            cb2(fileWriter)
          }
        }
        cb(file)
      } else {
        // CHeck if file exists
        if (fs.existsSync(pathToFile)) cb({});
        else if (onerror2) onerror2('No such file: '+pathToFile); 
      }
    }
  }
  cb(fileSystem);
}

function FileReader () {
  this.onloadend = function () {};
}
FileReader.prototype.readAsText = function (pathToFile) {
  var data = 'Hello World';
  try {
    this.result = fs.readFileSync(pathToFile,'utf8');
    if (this.onloadend) this.onloadend();
  } catch (err) {
    if (this.onerror) this.onerror(err);
  }
} 

function Blob(data,options) {
  this.data=data;
  this.options=options;
}
