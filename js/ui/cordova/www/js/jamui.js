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
 **    $CREATED:     09-11-16 by sbosse.
 **    $VERSION:     1.4.3
 **    $INFO:
 **
 **  Standalone JAM with app.js UI for Cordova/nw.js (w/o DOS) using jamlib.browser
 **  Javascript part of User Interface Module (page content structure in app.html)
 **  Used with Cordova and NW.
 **
 **    $ENDOFINFO
 **
*/
var version = "1.4.3M"

global=window;
global.simulation=false;
global.dos=false;
inspect = global.inspect = JAMLIB.Io.inspect

// Android layout
if (App.platform=='node-webkit') document.body.className += ' app-android app-android-4';


Logger.init();          // providesn global system log()
Logger.close();			// open logger initially
console.log=log;
console.warn=log;
//print=log;
log('Target: '+global.TARGET+(typeof HackTimer != 'undefined'?' with HackTimerWorker':''));

if (typeof jamConfig == 'undefined') log ('No custom configuration file config.js loaded.') 
else log ('Custom configuration file config.js loaded.');

log(process.execPath)


appCordova.initialize();
log('appCordova now initializing...');

// Optional App configuration loaded from file (config.js)
if (typeof jamConfig == 'undefined') jamConfig = {
  startJam: false,
  startNetwork:false,
  loadAgents: [],
  startAgents: [],
  network:[
    {ip:"localhost",ipport:10001,enable:true},
    {},
    {},
    {}
  ],
  log:{agent:true,parent:false,time:false,Time:true,class:false},  // Message flags: agent parent time class
  capabilities : [
    "",
    "",
    "",
    ""
  ],
  chatDelay:undefined,
  default:true,
  popupLevel    : 1,
  verbose:1,
}

function completeConfig() {
  jamConfig.version = version;
  if (!jamConfig.log) jamConfig.log={agent:true,parent:false,time:false,Time:true,class:false}; 
  if (!jamConfig.capabilities) jamConfig.capabilities=["","","",""]; 
  if (typeof Network != 'undefined') Network.options.link=jamConfig.network;
}
completeConfig()
log('JAMapp Version '+jamConfig.version);

var _log2List=[];
var _classes=[];
var _agents=[];
var _agentArgs="{}";
var verbose = jamConfig.verbose;
var clickevent = "click"

var nameopts = {
  world:{length:8, memorable:true, uppercase:true},
  node: {length:8, memorable:true, lowercase:true}
}



/********** UTILS ******************/

function replaceContentInContainer(target, source) {
  document.getElementById(target).innerHTML = document.getElementById(source).innerHTML;
}
function scrollToBottom(id){
   var div = document.getElementById(id);
   if (div) div.scrollTop = div.scrollHeight - div.clientHeight;
}


/** Resolve file path (../.)
 *
 */
function resolvePath(path) {
  var entries = path.split('/'),
      newentries=[],sep='', abs=path[0]=='/';
  for (var i in entries) {
    if (entries[i]=='.') continue;
    if (entries[i]=='..') {
      if (newentries.length==0) return null;
      newentries.pop();
    } else newentries.push(entries[i]);
  }
  return newentries.join('/');
}

/********** TUPLE INTERFACE *******************/
function provider(pat) {
  if (pat && pat.length == 3 && pat[0] == 'SENSOR') {
    if (appSensorsMap[pat[1]])
      return [pat[0],pat[1],appSensorsMap[pat[1]].read()]
  }
}


/********** FILEMANAGER ******************/

var fmmode ='load',
    fmselect=false,
    fmselected,
    fmlabel,
    fmmultiselect=false,
    fmdir,
    fmaction = function () {};

// Action handler
function fmexec() {
  if (fmselected) fmaction(fmselected);
}

// Action setup (called from app.html)
function fmsetup(action,label,select) {
  fmaction      = action;
  fmlabel       = label;
  fmselected    = null;
  fmselect      = select;
  App.load('page-filemanager');
}

/********** DIALOGS ******************/

var pb = new PromptBoxes({
      attrPrefix: 'pb',
      speeds: {
        backdrop: 250,  // The enter/leaving animation speed of the backdrop
        toasts: 250     // The enter/leaving animation speed of the toast
      },
      alert: {
        okText: 'Ok',           // The text for the ok button
        okClass: '',            // A class for the ok button
        closeWithEscape: false, // Allow closing with escaping
        absolute: false         // Show prompt popup as absolute
      },
      confirm: {
        confirmText: 'Confirm', // The text for the confirm button
        confirmClass: '',       // A class for the confirm button
        cancelText: 'Cancel',   // The text for the cancel button
        cancelClass: '',        // A class for the cancel button
        closeWithEscape: true,  // Allow closing with escaping
        absolute: false         // Show prompt popup as absolute
      },
      choices: {
        choicesClass: '',       // A class for the choices button
        cancelText: 'Cancel',   // The text for the cancel button
        cancelClass: '',        // A class for the cancel button
        closeWithEscape: true,  // Allow closing with escaping
        absolute: false         // Show prompt popup as absolute
      },
      prompt: {
        inputType: 'text',      // The type of input 'text' | 'password' etc.
        submitText: 'Submit',   // The text for the submit button
        submitClass: '',        // A class for the submit button
        cancelText: 'Cancel',   // The text for the cancel button
        cancelClass: '',        // A class for the cancel button
        closeWithEscape: true,  // Allow closing with escaping
        absolute: false         // Show prompt popup as absolute
      },
      toasts: {
        direction: 'bottom',       // Which direction to show the toast  'top' | 'bottom'
        max: 5,                 // The number of toasts that can be in the stack
        duration: 5000,         // The time the toast appears
        showTimerBar: false,     // Show timer bar countdown
        closeWithEscape: true,  // Allow closing with escaping
        allowClose: false,      // Whether to show a "x" to close the toast
      }
    });


var _pbinfo=pb.info.bind(pb);
pb.info=function (msg) {if (jamConfig.popupLevel<1) log(msg); else _pbinfo(msg) }

/********** AIOS/NETWORK *************/    
Aios = JAMLIB.Aios;
JAMLIB.Name = JAMLIB.Aios.Name;
JAMLIB.setup = function (options,callback) {
  log('Creating JAM platform ...');
  var jam=JAMLIB.Jam({
    print:options.print,
    print2:options.print2,
    nameopts:nameopts.node,
    Nameopts:nameopts.world,
    provider:provider,
    verbose:options.verbose,
    log:jamConfig.log,
    type:'mobileapp'
  });
  jam.init(function () {
    options.nodename  = jam.getNodeName();
    options.worldname = jam.getWorldName();
    if (callback) callback(jam);
  });
  var S=jam.security,N=jam.getNode();
  // Capability 1 contains the JAM node private port and security port (random field)
  if  (jamConfig.capabilities[0]!='') {
    var cap = S.Capability.ofString(jamConfig.capabilities[0]);
    N.port=cap.cap_port;
    N.random[N.port]=cap.cap_priv.prv_rand;
  } else {
    // Use random generated ports - secret!!!
    jamConfig.capabilities[0]=S.Capability.toString(S.Capability(N.port,S.Private(0,0xFF,N.random[N.port])));
  }
  return jam;
}
// AIOS log level 1 (agent) logging function
function log2(msg) {
  var elem = document.getElementById("app-agent-messages"),
      page = document.getElementById("page-agents"),
      scrollEnd;
  if (msg!=undefined && elem) {
    scrollEnd = (page.scrollTop-(page.scrollHeight- page.clientHeight))==0;
    elem.appendChild(document.createTextNode(msg));
    elem.appendChild(document.createElement('br'));
    if (scrollEnd)
      page.scrollTop = page.scrollHeight - page.clientHeight;
  }
  _log2List.push(msg);
}


/******************** PAGE UPDATES ****************/
// Each time the app-message page is opened the current log must be refreshed
function log2Update (clear) {
  var elem = document.getElementById("app-agent-messages");
  while (elem && elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }   
  if (clear) {
    _log2List=[];
  } else {
    for(var i in _log2List) {
      elem.appendChild(document.createTextNode(_log2List[i]));
      elem.appendChild(document.createElement('br'));  
    } 
  }
}

// Full page refresh chat update
function chatUpdate () {
  if (verbose>1) log('chatUpdate BotUI='+(BotUI?'true':'false'));
  nextChatHistory=[];
  botui = new BotUI('chat-bot',{callback:function (msg) {
      // Record message history for page refresh
      if (msg.content) {
        if (msg.human) nextChatHistory.push({kind:"answer", delay:jamConfig.chatDelay, content:msg.content});
        else nextChatHistory.push({kind:"message", delay:jamConfig.chatDelay, content:msg.content});
      }
    }});
  chatRefresh();
}

// Update agent class list
function classUpdate() {
   var list = document.getElementById("app-list-classes");
   while (list.firstChild)
    list.removeChild(list.firstChild);
   for(var name in _classes) {
     function add(name) {
       var selected=_classes[name].selected;
       var ListItem = document.createElement("li");
       ListItem.appendChild(document.createTextNode(name));
       ListItem.addEventListener(clickevent,function () {
        for(var p in _classes) 
          if (_classes[p].selected) {
            _classes[p].li.style.background='white';
            _classes[name].selected=false
          }
          ListItem.style.background = '#BBB';
          _classes[name].selected=true;
       });
       ListItem.style["cursor"]='pointer';
       list.appendChild(ListItem);
       if (selected) ListItem.style.background = ListItem.style.background = '#BBB';
       _classes[name]={li:ListItem,selected:selected};
     }
     add(name)
  }
}

// Update running agent list
function runUpdate() {
   var list = document.getElementById("app-list-agent-running");
   while (list.firstChild)
    list.removeChild(list.firstChild);

   _agents=[];
   for(var name in Jam.jam.stats('agent')) {
     function add(name) {
     var ListItem = document.createElement("li");
       ListItem.appendChild(document.createTextNode(name));
       ListItem.addEventListener(clickevent,function () {
         for(var p in _agents) 
           if (_agents[p].selected) { 
             _agents[p].li.style.background='white';
             _agents[name].selected=false
           }
         ListItem.style.background = '#BBB';
         _agents[name].selected=true;
       });
       ListItem.style["cursor"]='pointer';
       list.appendChild(ListItem);
       _agents[name]={li:ListItem,selected:false};
      }
      add(name)
   }
}

// Update sensor list
function sensorUpdate() {
  var list = document.getElementById("app-list-sensors");
  for(var name in appSensors) {
    var data;
    if (verbose>1) log('sensorUpdate '+name+' read='+ String(appSensors[name].read)+' error='+String(appSensors[name].error));
    if (!appSensors[name].read) continue;
    function format(data) {
      if (typeof data == 'string') return data;
      else return data[0]!=undefined?data.join(' , '):String(data);
    }
    function add(name,data) {
      var ListLabel = document.createElement("label");
      var ListItem = document.createElement("li");
      ListLabel.setAttribute("id",'SensorListLabel_'+name);
      ListItem.setAttribute("id",'SensorListItem1_'+name);
      ListLabel.appendChild(document.createTextNode(name+' ('+appSensors[name].sensor+')'));
      ListItem.appendChild(document.createTextNode(format(data)));
      list.appendChild(ListLabel);
      list.appendChild(ListItem);
    }
    function update(name,data) {
      var ListLabel = document.getElementById('SensorListLabel_'+name);
      var ListItem = document.getElementById('SensorListItem1_'+name);
      if (!ListLabel || !ListItem) return false;
      ListItem.firstChild.nodeValue=format(data);
      return true;
    }
    data=appSensors[name].read();
    if (data==undefined) continue;
    if (!update(name,data)) add(name,data);
    appSensors[name].last=data;
  }
}
var _fmdir;

// Filemanager directory list update
function fmUpdate() {
  var label = document.getElementById("page-filemanager-label");

  
  function fm(root) {
    switch (root) {
      case "Download":  fmdir=cordova.file.downloadDirectory||cordova.file.externalRootDirectory+'/Download'; break;
      case "Temp":      fmdir=cordova.file.tempDirectory; break;
      case "Home":      fmdir=cordova.file.userDirectory||"/"; break;
      case "App":       fmdir=cordova.file.applicationDirectory; break;
      case "Data":      fmdir=cordova.file.dataDirectory; break;
      case "Last":      fmdir=_fmdir; break;
    }
    if (!fmdir) fmdir=cordova.file.dataDirectory;

    label.innerHTML=resolvePath(fmdir);
    listDir(fmdir,function (entries, err) {
      if (err) { fmdir=null; return pb.error('listDir error: '+JAMLIB.Io.inspect(err))};
      var list = document.getElementById("page-filemanager-list");
      while (list.firstChild)
       list.removeChild(list.firstChild);
      if (entries) entries = entries.concat([{isFile:false,isDirectory:true,name:'..'}]).sort(function (a,b) { if (a.name > b.name) return 1; else return -1; });
      for(var index in entries) {
        var entry = entries[index];
        function add(entry) {
          var ListItem = document.createElement("li");
          ListItem.appendChild(document.createTextNode(entry.name));
          ListItem.addEventListener(clickevent,function () {
            if (entry.isDirectory) {
              fmdir=resolvePath(fmdir+'/'+entry.name);
              fmUpdate()
            } else if (fmselect) {
              // Select only
              if (fmselected && !fmmultiselect) fmselected.item.style.background='white';
              fmselected = {item:ListItem,entry:entry};
              ListItem.style.background = '#BBB';
            } else {
              entry.dir=fmdir;
              fmselected = entry;
              ListItem.style.background = '#BBB';
              fmexec();
              App.back()
            }
          });
          if (entry.isDirectory) ListItem.style["font-weight"] = 'bold';
          ListItem.style["cursor"]='pointer';
          list.appendChild(ListItem);
        }
        add(entry)
      }
    });  
  }
  if (!fmdir) pb.choices(function (choice) {
    if (choice) fm(choice);
    else { App.back() }
  },"Select Location:",["Download","Data","App","Temp","Home","Last"]);
  else fm();
}

function copy (o,isArray) {
  var _o=isArray?[]:{};
  for(var k in o) _o[k]=o[k];
  return _o;
}

function merge(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

// Load or update agent class from url
function loadClass(url,cb) {
  if (url) {
    var file = basename(url);
    var aclass = classname(file);
    // Load from remote source; script loading creates a global constructor function!
    if (typeof window[aclass] != 'undefined') {
      return pb.error('Cannot load agent class constructor '+aclass+': Exists already!');
    }
    console.log('Loading '+url)
    loadjs(url,function (ev) { 
        if (Jam.jam) {
          // Jam.jam.compileClass(aclass,constr,{verbose:1});
          if (typeof window[aclass] == 'function') {
            try { Jam.jam.compileClass(aclass,window[aclass],{verbose:1}) }
            catch (e) { return cb?cb():null }
          };
          if (_classes[aclass]==undefined) {
            _classes[aclass]=false;
          }
          if (cb) cb(aclass);
        }   
    });
  }
}
// Load a class from a local file
function loadClassFromFile(path, file, cb, onerror) {
  var aclass = classname(file);
  readFile(path, file, function (data) {
    // log(data)
    if (Jam.jam) {
      try { Jam.jam.compileClass(aclass,data,{verbose:1}) }
      catch (e) { return cb?cb():null };
      if (_classes[aclass]==undefined) {
        _classes[aclass]=false;
      }
      if (cb) cb(aclass);
    }   
  }, function (err) {
    if (onerror) onerror(err)
    else cb(null,err);
  })
}
function loadClassFromFileObj(file, cb, onerror) {
  return loadClassFromFile(file.dir,file.name,cb,onerror)
}

// Save a class to local file
function saveClassToFile(path, file, aclass, cb, onerror) {
  
}


function loadConfig(cb) {
  var path = cordova.file.dataDirectory,
      file = 'config.js'; 
  readFile(path, file, function (data) {
    eval(data);
    completeConfig();
    log('Loaded config file '+path+'/'+file);
    cb()
  }, function (err) {
    log(err)
    cb(err)
  }) 
}


// Save config file to App directory
function saveConfig(cb) {
  var path = cordova.file.dataDirectory,
      file = 'config.js'; 
  var data = JSON.stringify(jamConfig,null,2);
  function onsucc () { if (jamConfig.verbose>1) log('saveConfig '+file+': ok'); if (cb) cb() }
  function onerror(e) { pb.error('saveConfig: '+e.toString()+(e&&e.code?(' (Code '+e.code+')'):'')); if (cb) cb(e); }
  writeFile(path, file, 'jamConfig='+data, onsucc, onerror);
  checkIfFileExists(path,file, function (res) { log('exists? '+res) })
}


// Create an agent (class must be selected or given by argument)
function createAgent (ac,args) {
  var ac,
      selected,
      args;
  if (!Jam.jam) return pb.error('JAM not existing!');
  if (ac) {
    var id=Jam.jam.createAgent(ac,args,2);
    return pb.info('Agent '+id+' started.');
  }
  for (var name in _classes) 
    if (_classes[name].selected) {
      selected=name;
      break;
    }
  if (!selected) return pb.error('No class selected!');
  ac=selected;

  pb.prompt(
        function (value) { 
          if (value) { _agentArgs=value; eval('args='+value);  }
          else args={};
          if (!Jam.state) pb.info('JAM not started!');
          var id=Jam.jam.createAgent(ac,args,2);
          pb.info('Agent '+id+' started.');
        },
        'Agent arguments?', 
        'text',
        'Set Arguments',
        'No Arguments',
        {
          value:_agentArgs||'{}'
        }
      );
}


function infoAgent() {
  var list = document.getElementById("app-list-agent-running");
  var selected,name;

  for(name in _agents) 
    if (_agents[name].selected) {
      selected=name;
      break;
    } 
  if (!selected) return pb.error('No agent selected!');
  var stats=Jam.jam.stats('agent');
  for(var name in stats) {
    var stat=stats[name];
    if (name==selected) pb.alert(
      function () {},
      name+': pid='+ stat.pid+
                             ' gid='+stat.gid+
                             ' state='+stat.state+
                             ' next='+stat.next,
      'Ok');
  }
}

function killAgent() {
  var list = document.getElementById("app-list-agent-running");
  var selected,name;

  for(name in _agents) 
    if (_agents[name].selected) {
      selected=name;
      break;
    } 
  if (!selected) return pb.error('No agent selected!');
  Jam.jam.kill(selected);
  runUpdate();
  pb.info('Killed agent '+name);
}

/************************** NETWORK **********************/
log('Creating network module...');

var Network = {
  options: {link:jamConfig.network},
  location: undefined,
  state: 0,
  start: function () {
    var el; if (!Jam.jam) return;
    el=document.getElementById("app-net-start"); if (el) el.style.opacity=0.2;
    el=document.getElementById("app-net-stop"); if (el) el.style.opacity=1.0;
    Network.state=2;
    for (var i=0;i<4;i++)
      if (Network.options.link[i].ip && Network.options.link[i].ipport && Network.options.link[i].enable) 
        Jam.jam.connectTo(JAMLIB.Aios.DIR.IP(Network.options.link[i].ip+':'+
                                             Network.options.link[i].ipport));
    Network.status();
    pb.info('Network started');
  },
  status: function () {
    if (!document.getElementById("status-network-init")) return;
    switch (Network.state) {
      case 0:
      case 1:
        document.getElementById("status-network-init").style.visibility = "hidden";   
        document.getElementById("status-network-connected").style.visibility = "hidden";   
        document.getElementById("status-network-not-connected").style.visibility = "hidden";   
        document.getElementById("status-network-published").style.visibility = "hidden";   
        break;
      case 2:
        document.getElementById("status-network-init").style.visibility = "visible";
        document.getElementById("status-network-connected").style.visibility = "hidden";   
        document.getElementById("status-network-not-connected").style.visibility = "hidden";   
        document.getElementById("status-network-published").style.visibility = "hidden";   
        break;
      case 3:
        document.getElementById("status-network-init").style.visibility = "visible";
        document.getElementById("status-network-connected").style.visibility = "visible";   
        document.getElementById("status-network-not-connected").style.visibility = "hidden";   
        document.getElementById("status-network-published").style.visibility = "hidden";   
        break;          
      case 4:
        document.getElementById("status-network-init").style.visibility = "visible";
        document.getElementById("status-network-connected").style.visibility = "visible";   
        document.getElementById("status-network-not-connected").style.visibility = "hidden";   
        document.getElementById("status-network-published").style.visibility = "visible";   
        break;          
    }
    switch (Jam.state) {
      case 0:
        document.getElementById("status-jam-active").style.visibility = "hidden";
        break;
      case 1:
        document.getElementById("status-jam-active").style.visibility = "visible";
        break;
        
    }
  },
  stop: function () {
    var el;
    if (!Jam.jam) return;
    el=document.getElementById("app-net-start"); if (el) el.style.opacity=1.0;
    el=document.getElementById("app-net-stop"); if (el) el.style.opacity=0.2;
    Network.state=0;
    for (var i=0;i<4;i++) 
      if (Network.options.link[i].ip && Network.options.link[i].ipport) 
        Jam.jam.disconnect(JAMLIB.Aios.DIR.IP(Network.options.link[i].ip+':'+
                                            Network.options.link[i].ipport));
    Network.status();
    pb.info('Network stopped');
  }
}


/*********************** JAM **********************/
log('Creating agent module...');

var Jam = {
  options:{
    domain:'default',
    nodename  : undefined,
    worldname : undefined,
    log:jamConfig.log,
    print:log,
    print2:log2,
    verbose:1,
  },
  jam: undefined,
  state : 0,
  refresh: function () {
    if (!this.jam) return;
    var stats=this.jam.stats('node');
    // Update JAM statistics
    document.getElementById('statistics-cpu').innerHTML     = (stats.cpu|0).toString();
    document.getElementById('statistics-create').innerHTML  = stats.create.toString();
    document.getElementById('statistics-fastcopy').innerHTML= stats.fastcopy.toString();
    document.getElementById('statistics-fork').innerHTML    = stats.fork.toString();
    document.getElementById('statistics-received').innerHTML= stats.received.toString();
    document.getElementById('statistics-handled').innerHTML = stats.handled.toString();
    document.getElementById('statistics-migrate').innerHTML = stats.migrate.toString();
    document.getElementById('statistics-signal').innerHTML  = stats.signal.toString();
    document.getElementById('statistics-error').innerHTML   = stats.error.toString();
    document.getElementById('statistics-agents').innerHTML  = stats.agents.toString();
    document.getElementById('statistics-tsout').innerHTML   = stats.tsout.toString();
    document.getElementById('statistics-tsin').innerHTML    = stats.tsin.toString();
  },
  start: function () { 
    var el;
    if (this.jam) { 
      this.jam.start();
      Jam.state=1;
      el=document.getElementById("app-jam-start"); if (el) el.style.opacity=0.2;
      el=document.getElementById("app-jam-stop"); if (el) el.style.opacity=1.0;
      el=document.getElementById("app-jam-reset"); if (el) el.style.opacity=1.0;
      Network.status();
      pb.info('Agent processing started');
    } 
  },
  stop:  function () {
    var el; 
    if (this.jam && Jam.state==1) {
      this.jam.stop();
      Jam.state=0;
      el=document.getElementById("app-jam-start"); if (el) el.style.opacity=1.0;
      el=document.getElementById("app-jam-stop"); if (el) el.style.opacity=0.2;
      el=document.getElementById("app-jam-reset"); if (el) el.style.opacity=0.2;
      Network.status()
      pb.info('Agent processing stopped');
    }
  },
  reset: function () {}
}



//if (window.location.href.indexOf('file:')!=0)
//  Network.options.link1.ip = window.location.href.replace(/http:\/\//,'').replace(/:[0-9]+[\/]*/,'');
  

/*********************
**  APP Controller
*********************/
log('Creating app controller ...');

App.setDefaultTransition({
  ios             : 'fade' , // iOS
  iosFallback     : 'fade' , // iOS <5
  android         : 'fade' , // Android
  androidFallback : 'fade' , // Android < 4
  fallback        : 'instant'   // non-iOS, non-Android
});

App.controller('home', function (page) {
  // put stuff here
});

App.controller('page-network', function(page) {
  $(page).on('appShow', function () {
    Network.status();
    switch (Network.state) {
      case 0:
      case 1:
        document.getElementById("app-net-start").style.opacity=1.0;
        document.getElementById("app-net-stop").style.opacity=0.2;
        break;
      case 2:
      case 3:
        document.getElementById("app-net-start").style.opacity=0.2;
        document.getElementById("app-net-stop").style.opacity=1.0;
        break;
    }
  });
  $(page).on('appBack', function () {
  });
});

App.controller('page-jam', function (page) {
  // put stuff here
  $(page).on('appShow', function () {
    if (Jam.options.worldname) document.getElementById('jam-world').innerHTML   = Jam.options.worldname;
    if (Jam.options.domain)    document.getElementById('jam-domain').innerHTML  = Jam.options.domain;
    if (Jam.options.nodename)  document.getElementById('jam-node').innerHTML    = Jam.options.nodename;
    switch (Jam.state) {
      case 0:
        document.getElementById("app-jam-start").style.opacity=1.0;
        document.getElementById("app-jam-stop").style.opacity=0.2;
        document.getElementById("app-jam-reset").style.opacity=0.2;
        break;
      case 1:
        document.getElementById("app-jam-start").style.opacity=0.2;
        document.getElementById("app-jam-stop").style.opacity=1.0;
        document.getElementById("app-jam-reset").style.opacity=1.0;
        break;
    }
    Jam.refresh();
    /*
    if (Network.state>1) Jam.start();
    else App.dialog({
        title        : 'Network Error',
        text         : 'You need to start the network service first!',
        okButton     : 'Ok',
        cancelButton : 'Cancel'
      }, function (tryAgain) {
          if (tryAgain) {
            // try again
          }
    });
    */
  });
  $(page).on('appBack', function () {
  });
});

App.controller('page-agents', function (page) {
  // put stuff here
  // log('JAM is a '+JAMLIB.Jam);	// the first message
  $(page).on('appShow', function () {
    log2Update();
  });
  $(page).on('appBack', function () {
  });
  
});

App.controller('page-agents-manager', function (page) {
  $(page).on('appShow', function () {
    runUpdate();
  });
  $(page).on('appBack', function () {
  });
});

App.controller('page-agents-class', function (page) {
  $(page).on('appShow', function () {
    classUpdate();
  });
  $(page).on('appBack', function () {
  });
});

App.controller('page-filemanager', function (page) {
  // put stuff here
  $(page).find('.app-topbar').find('.app-button').text(fmlabel);
  $(page).on('appShow', function () {
    fmdir=null;
    fmUpdate();
  });
  $(page).on('appBack', function () {
    _fmdir=fmdir;
  });
  
});

App.controller('page-setup', function (page) {
  $(page).on('appShow', function () {
    document.getElementById('setup-link1-enable').checked=Network.options.link[0].enable;
    document.getElementById('setup-link1-ip').value=Network.options.link[0].ip;
    document.getElementById('setup-link1-ipport').value=Network.options.link[0].ipport;
    if (Network.options.link[1].ip) 
      document.getElementById('setup-link2-enable').checked=Network.options.link[1].enable,
      document.getElementById('setup-link2-ip').value=Network.options.link[1].ip,
      document.getElementById('setup-link2-ipport').value=Network.options.link[1].ipport;
    if (Network.options.link[2].ip) 
      document.getElementById('setup-link3-enable').checked=Network.options.link[2].enable,
      document.getElementById('setup-link3-ip').value=Network.options.link[2].ip,
      document.getElementById('setup-link3-ipport').value=Network.options.link[2].ipport;
    if (Network.options.link[3].ip) 
      document.getElementById('setup-link4-enable').checked=Network.options.link[3].enable,
      document.getElementById('setup-link4-ip').value=Network.options.link[3].ip,
      document.getElementById('setup-link4-ipport').value=Network.options.link[3].ipport;

    document.getElementById('setup-msg-agent').checked  = false;
    document.getElementById('setup-msg-parent').checked = false;
    document.getElementById('setup-msg-time').checked   = false;
    document.getElementById('setup-msg-Time').checked   = false;
    document.getElementById('setup-msg-class').checked  = false;
    if (Jam.options.log.agent)   document.getElementById('setup-msg-agent').checked=true;
    if (Jam.options.log.parent)  document.getElementById('setup-msg-parent').checked=true;
    if (Jam.options.log.time)    document.getElementById('setup-msg-time').checked=true;
    if (Jam.options.log.Time)    document.getElementById('setup-msg-Time').checked=true;
    if (Jam.options.log.class)   document.getElementById('setup-msg-class').checked=true;
    
    document.getElementById('setup-cap1').value=jamConfig.capabilities[0];
    document.getElementById('setup-cap2').value=jamConfig.capabilities[1];
    document.getElementById('setup-cap3').value=jamConfig.capabilities[2];
    document.getElementById('setup-cap4').value=jamConfig.capabilities[3];
  });
  $(page).on('appBack', function () {
    if (document.getElementById('setup-link1-ip').value!='')
      Network.options.link[0].enable=document.getElementById('setup-link1-enable').checked,
      Network.options.link[0].ip=document.getElementById('setup-link1-ip').value,
      Network.options.link[0].ipport=Number(document.getElementById('setup-link1-ipport').value);
    if (document.getElementById('setup-link2-ip').value!='')
      Network.options.link[1].enable=document.getElementById('setup-link2-enable').checked,
      Network.options.link[1].ip=document.getElementById('setup-link2-ip').value,
      Network.options.link[1].ipport=Number(document.getElementById('setup-link2-ipport').value);
    if (document.getElementById('setup-link3-ip').value!='')
      Network.options.link[2].enable=document.getElementById('setup-link3-enable').checked,
      Network.options.link[2].ip=document.getElementById('setup-link3-ip').value,
      Network.options.link[2].ipport=Number(document.getElementById('setup-link3-ipport').value);
    if (document.getElementById('setup-link4-ip').value!='')
      Network.options.link[3].enable=document.getElementById('setup-link4-enable').checked,
      Network.options.link[3].ip=document.getElementById('setup-link4-ip').value,
      Network.options.link[3].ipport=Number(document.getElementById('setup-link4-ipport').value);
    
    Jam.options.log.agent=  document.getElementById('setup-msg-agent').checked;
    Jam.options.log.parent= document.getElementById('setup-msg-parent').checked;
    Jam.options.log.time=   document.getElementById('setup-msg-time').checked;
    Jam.options.log.Time=   document.getElementById('setup-msg-Time').checked;
    Jam.options.log.class=  document.getElementById('setup-msg-class').checked;
    JAMLIB.Aios.config({log:Jam.options.log})
    saveConfig()
  });
  
});

var pageInfoTimer;
App.controller('page-info', function (page) {
  $(page).on('appShow', function () {
    sensorUpdate();
    pageInfoTimer=setInterval(sensorUpdate,500);
  });
  $(page).on('appBack', function () {
    if (pageInfoTimer) clearInterval(pageInfoTimer);
    pageInfoTimer=undefined;
  });
});


/***************** AGENT CHAT ***********************/
/** Actions (todos):
* {kind:'message', delay: ms, content: message }
* {kind:'button' , delay: ms, action: {text:string, value:string} []}
* {kind:'value'  , delay: ms, action: {size:px, icon?:string, value:number, sub_type:'number', placeholder:number}}
* {kind:'checkpoint', callback:callback}
*
*
*/
var chatHistory=[];
var nextChatHistory=[];
var chatActive=false; // is chat window visible?
var chatLastAction;   // Save last action for page refresh
var chatOpen=false;   // if set to false no questions are accpeted (denied)
var botui;

var chatActions=[]; // copy(chatActionsInit,true);

// Clear the chat
function chatReset () {
   chatActions=[];
   chatHistory=[];
   chatOpen=false;
   if (botui) botui.clear();
   chatUpdate();
}
// Refresh the chat by adding old/new messages and actions

function chatRefresh () {
  if (verbose>1) 
    log('chatRefresh: botui='+
        (botui?'true':'false')+' chatActive='+
        (chatActive?'true':'false')+
        ' chatHistory='+chatHistory.length+
        ' chatActions='+chatActions.length);
  if (!botui || !chatActive) return;
  function exec(l,last) {
    var todo=l.shift();
    if (!todo) return;
    function doit(todo,last) {
      if (verbose>1) log('chatRefresh: '+todo.kind);
      switch (todo.kind) {
        case 'message':
          last=botui.message.bot(todo);
          break;
        case 'answer':
          last=botui.message.human(todo);
          break;
        case 'wait':
          if (last) last=last.then(function () {});
          break;
        case 'button':
          chatLastAction=[todo]; 
          if (last) last=last.then(function () { return botui.action.button(todo); }).then(function (res) {
                                      chatLastAction=[];
                                      return { then:function (f) { f(res) } }
                          });
          else {
            last=botui.action.button(todo).then(function (res) {
                                      chatLastAction=undefined;
                                      return { then:function (f) { f(res) } }
                          });
          }
          break;
        case 'value':
          chatLastAction=[todo]; 
          if (last) last=last.then(function () { return botui.action.text(todo); }).then(function (res) {
                                      chatLastAction=[];
                                      return { then:function (f) { f(res) } }
                          });
          else {
            last=botui.action.text(todo).then(function (res) {
                                      chatLastAction=undefined;
                                      return { then:function (f) { f(res) } }
                          });
          }
          break;
        case 'checkpoint':
          if (chatLastAction.length) chatLastAction.push(todo);
          if (last) last=last.then(function (res) { if (todo.timer) clearTimeout(todo.timer); return todo.callback(res) });
          break;
      }
      return last
    }
    last=doit(todo,last);
    if (l.length) exec(l,last);
  }
  exec(chatHistory);
  exec(chatActions);  
  setTimeout(function () { 
    scrollToBottom('chat-bot-content');  
  },500);
}
// Add a chat action, but only if last action is different (chatActions/chatHistory)
function chatAction (action) {
  var last;
  function eq (a1,a2) {
    if (a1.kind != a2.kind) return false;
    if (a1.content && a2.content && a1.content==a2.content) return true;
    return false;
  }
  if (chatHistory.length) last = chatHistory[chatHistory.length-1];
  else last = undefined;
  if (last && eq(last,action)) return; 
  if (nextChatHistory.length) last = nextChatHistory[nextChatHistory.length-1];
  else last = undefined;
  if (last && eq(last,action)) return; 
  if (chatActions.length) last = chatActions[chatActions.length-1];
  else last = undefined;
  if (last && eq(last,action)) return; 
  chatActions.push(action);
  if (verbose>1) log('chatAction: ['+chatActions.length+']');
}

// External chat requests
function chatQuestion (id,question, action, callback, timeout) {
  // TODO: Remove question after timeout!
  var actions=[],timer;
  chatAction({kind:'message', delay: jamConfig.chatDelay, content: id+': '+question });
  if (timeout) timer=setTimeout(function () {
    chatLastAction=[];
    // console.log('chatQuestion timeout');
    chatActions=chatActions.filter(function (todo) {
      if (todo.kind=='checkpoint' || todo.action) return false;
      else return true;
    });
    if (botui && chatActive) 
      botui.removeAction();
    if (callback) callback();
  },timeout);
  if (action instanceof Array) {
    // Buttons/Choices
    if (typeof action[0] == 'string') action=action.map(function (s) { return { text:s, value:s } });
    chatAction({kind:'button', delay: jamConfig.chatDelay, action: action});
    chatAction({kind:'checkpoint', callback:callback, timer:timer});
  } else if (typeof action == 'object') {
    // Value or text
    chatAction({kind:'value', delay: jamConfig.chatDelay, action: action});
    chatAction({kind:'checkpoint', callback:callback, timer:timer});  
  } 
  if (chatActive) chatRefresh();
}

function chatMessage (id,message) {
  chatAction({kind:'message', delay: jamConfig.chatDelay, content: id+': '+message });
  if (chatActive) chatRefresh();
}


App.controller('page-chat', function(page) {
  $(page).on('appShow', function () {
    chatActive=true;
    chatUpdate();
  })
  $(page).on('appHide', function () {
    chatHistory=nextChatHistory;
    if (chatLastAction && chatLastAction.length) chatHistory=chatHistory.concat(chatLastAction);
    chatLastAction=[];
    chatActive=false;
    botui=undefined;
  })

})


// Create, setup, and start JAM/Network
function start(next) {
  // Create JAM instance
  JAMLIB.setup(Jam.options, function (jam) {
    log2 ('JAM '+Jam.options.nodename+ '['+Jam.options.worldname+'] is ready.');
    log ('JAMLIB Ver. '+JAMLIB.options.version);
    Jam.jam=jam;
    // Now create communication port(s)
    var options={};
    options.proto='http';
    options.verbose=Jam.options.verbose;
    options.multicast=true;
    var port=jam.createPort(jam.DIR.IP(),options);
    port.link.on("link+",function (addr) {Network.state=3; pb.info('Connected to '+addr); Network.status()})
    port.link.on("link-",function () {Network.state=2; Network.status()})
    port.link.on("error",function (err,arg) {if (err=='link') { Network.state=0; pb.error('Link to '+arg+' failed!'); } Network.status()})
  });

  // Try localization ...

  Jam.jam.locate(undefined, function (loc,err) {
    Network.location = loc;
    if (!loc) {
      log('locate error: '+err.toString());
      pb.error('locate error: '+err.toString()+'. You should disable ad-blocker for this page and reload page (top button)!');
    } else log('My location is '+loc.ip+' '+loc.geo.city+' '+loc.geo.country);
  });

  // Chat agent API extension
  Jam.jam.extend([2,3],'message',chatMessage);
  Jam.jam.extend([2,3],'question',function (id, question, choices, callback, timeout) {
    var process = Jam.jam.getProcess();
    chatQuestion (id,question, choices, function (res) {
      process.callback(callback,res?[res.value]:null);
      process.wakeup();
      Jam.jam.schedule();
    },timeout);
    process.suspend(Aios.timeout(timeout));
  });
  // PB extension
  Jam.jam.extend([2,3],'notify',function (msg) {
    pb.info(msg)
  });

  // Initialization on start up...
  if (jamConfig.startJam) Jam.start();
  if (jamConfig.startNetwork) Network.start();
  if (jamConfig.loadAgents.length) {
    for (var i in jamConfig.loadAgents) {
      var file=jamConfig.loadAgents[i];
      loadClassFromFile(cordova.file.dataDirectory, file, function (aclass, err) {
        if (!aclass) return pb.error('Compiling agent from file '+file+' failed.');
        if (jamConfig.startAgents[aclass]) {
          createAgent(aclass,jamConfig.startAgents[aclass]);
        } else if (jamConfig.startAgents.indexOf &&
                   jamConfig.startAgents.indexOf(aclass)>=0) createAgent(aclass,{});
      });
    }
  } 
  if (next) next()
}

// Prepare and setup files (transfer files to app data directory)
function init (next) {
  var resPath = cordova.file.applicationDirectory+(App.platform!='node-webkit'?'/www':'')+'/js';
  function setupConfig(next) {
    checkIfFileExists(cordova.file.dataDirectory,'config.js', function (exists) {
      if (exists) 
        loadConfig(function (res) { next() });
      else 
        saveConfig(function (res) { log('Saved config.js in App data storage'); next() });
    })
  }
  function setupAgents(next) {
    if (jamConfig.loadAgents) {
      jamConfig.loadAgents.forEach(function (file) {
        Schedule([
          function (next) {
            checkIfFileExists(cordova.file.dataDirectory,file, function (exists) {
              if (exists) next (); 
              else readFile(resPath,file, function (data) {
                writeFile(cordova.file.dataDirectory,file,data,
                  function () { log('Saved '+file+' in App data storage'); next() }, function () { next()})
              },
              function (err) {
                next ()
              })
            })
          }
        ])
      });
    }
    next();
  }
  Schedule([setupConfig,setupAgents]);
  next();
}

Schedule([init,start]);

log('Loading APP GUI...');
App.load('home');

