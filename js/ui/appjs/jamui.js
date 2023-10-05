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
 **    $INITIAL:     (C) 2006-2022 bLAB
 **    $CREATED:     09-11-16 by sbosse.
 **    $VERSION:     1.10.1
 **    $INFO:
 **
 **  Standalone JAM with app.js UI for WEB Browser (w/o DOS) using jamlib.browser
 **  Javascript part of User Interface Module (page content structure in app.html)
 **
 **  Supported URL parameters (with example values):
 **
 **  ?link=domain:proto&proto=https&secure=12:34:56:78&gps=true&sensors=gps5
 **   &popups=false&home=page-chat
 **
 **    $ENDOFINFO
 **
*/
global=window;
global.simulation=false;
global.dos=false

var version = "1.10.1W";
var cookieConfig = 'jam.webapp.config';

// Add ML module
ML.current(JAMLIB.Aios);
JAMLIB.Aios.ml=ML.agent;
JAMLIB.Aios.aios1.ml=ML.agent;
JAMLIB.Aios.aios2.ml=ML.agent;
JAMLIB.Aios.aios3.ml=ML.agent;

var Comp = JAMLIB.Comp;

Logger.init();          // providesn global system log()
Logger.close();			// open logger initially
_log=console.log.bind(console)
console.log=log;
console.warn=log;
//print=log;
log('Target: '+global.TARGET+(typeof HackTimer != 'undefined'?' with HackTimerWorker':''));


if (typeof jamConfig == 'undefined') log ('No custom configuration file config.js loaded.') 
else log ('Custom configuration file config.js loaded (early).');

// Optional App configuration loaded from file (config.js)
if (typeof jamConfig == 'undefined') jamConfig = {
  startJam: false,
  startNetwork:false,
  loadAgents: [],
  startAgents: [],
  network:[
    {ip:"ag-0.de",ipport:10001, secure:'', enable:true},
    {ip:"localhost",ipport:10001, secure:'', enable:false},
    {},
    {},
    {}
  ],
  proto:'http',
  log:{agent:true,parent:false,time:false,Time:true,class:false},  // Message flags: agent parent time class
  capabilities : [
    "",
    "",
    "",
    ""
  ],
  // lat,lon -> location info lookup
  reverse : {
    primary : 'https://api.opencagedata.com/geocode/v1/json?q=LAT+LON&key=8e7c3730678842468d6acf450ecbca16',
    secondary: 'https://nominatim.openstreetmap.org/reverse/?format=json&lat=LAT&lon=LON',
  },
  chatDelay:undefined,
  default:true,
  firstpage: 'home',
  title         : 'Mobile JavaScript Agent Machine',
  popupLevel    : 1,
  verbose:1,
  options : {
    network : { log:false }
  }
}

jamConfig.version = version;
_log(jamConfig.title+' '+jamConfig.version);

if (!jamConfig.log) jamConfig.log={agent:true,parent:false,time:false,Time:true,class:false}; 
if (!jamConfig.capabilities) jamConfig.capabilities=["","","",""]; 
if (!jamConfig.firstpage) jamConfig.firstpage='home'; 
if (!jamConfig.title) jamConfig.title='Mobile JavaScript Agent Machine';
if (jamConfig.popupLevel==undefined) jamConfig.popupLevel=1; 
log('JAMapp Version '+jamConfig.version);

var _log2List=[];
var _classes=[];
var _agents=[];
var _agentArgs="{}";
var verbose = jamConfig.verbose;

var nameopts = {
  world:{length:8, memorable:true, uppercase:true},
  node: {length:8, memorable:true, lowercase:true}
}

function loadConfig() {
  try {
    var data = typeof localStorage=='undefined'?getCookie(cookieConfig):localStorage.getItem(cookieConfig);
    if (!data) data=getCookie(cookieConfig);
    if (data) {
      var obj = JSON.parse(data);
      console.log('Loaded jamConfig from '+(typeof localStorage!='undefined' && localStorage.getItem(cookieConfig)?'localStorage':'cookie')+' '+cookieConfig);
      for(var p in obj) {
        if (['title','version'].indexOf(p)!=-1) continue;
        jamConfig[p]=obj[p];
      }
      jamConfig.version=version;
      if (Jam) Jam.options.log=jamConfig.log;
      JAMLIB.Aios.config({log:jamConfig.log})
    }
  } catch (e) {
      console.log('Loading jamConfig from cookie failed: '+e.toString());  
  }
}
function saveConfig() {
  var obj = {};
  for (var p in jamConfig) {
    if (['title','classes'].indexOf(p)!=-1) continue;
    obj[p]=jamConfig[p];
  }
  jamConfig.options.sensors=Sensors.options;
  jamConfig.proto = Network.options.proto; 
  var data=JSON.stringify(obj);
  console.log('Saving jamConfig in cookie '+cookieConfig);
  setCookie(cookieConfig,data,30)
  if (typeof localStorage != 'undefined') localStorage.setItem(cookieConfig, data);
}
function completeConfig() {
  jamConfig.version = version;
  if (!jamConfig.log) jamConfig.log={agent:true,parent:false,time:false,Time:true,class:false}; 
  if (!jamConfig.capabilities) jamConfig.capabilities=["","","",""]; 
  if (typeof Network != 'undefined') { 
    Network.options.link  = jamConfig.network; 
    Network.options.proto = jamConfig.proto };
  if (typeof Sensors != 'undefined') 
    Sensors.options=Object.assign(Sensors.options,
                                 jamConfig.options.sensors);
}
function cacheReset() {
  setCookie(cookieConfig,'{}',30)
  if (typeof localStorage != 'undefined') localStorage.setItem(cookieConfig, null);
  console.log('Cleared cookie '+cookieConfig)
}
function urlConfig() {
  var params = parseUrl(document.URL);
  console.log(document.URL,params);
  if (params.link||params.link1) {
      var tokens=(params.link||params.link1).split(':');
      if (tokens.length==2) {
        jamConfig.network[0].ip=tokens[0];
        jamConfig.network[0].ipport=Number(tokens[1]);
        jamConfig.network[0].enable=true;
      }
  } 
  if (params.link2) {
      var tokens=params.link2.split(':');
      if (tokens.length==2) {
        jamConfig.network[1].ip=tokens[0];
        jamConfig.network[1].ipport=Number(tokens[1]);
        jamConfig.network[1].enable=true;
      }
  } 
  if (params.secure||params.secure1) {
    jamConfig.network[0].secure=(params.secure||params.secure1);
  }
  if (params.secure2) {
    jamConfig.network[1].secure=params.secure2;
  }
  if (params.gps) {
    jamConfig.options.sensors=jamConfig.options.sensors||{};
    jamConfig.options.sensors.GeoLocation5=params.gps=='true';
  }
  if (params.proto) {
    jamConfig.proto=params.proto;
  }
  if (params.popups) {
    jamConfig.popupLevel=params.popups=='true'?1:0;
  }
  if (params.home) {
    jamConfig.firstpage=params.home;
  }
  if (params.sensors) {
    var sensors=params.sensors.split(',');
    sensors.forEach(function (sensor) {
      switch (sensor) {
        case 'gps5': jamConfig.options.sensors.GeoLocation5=true; break;
      }
    });
  }
}

loadConfig();
urlConfig();

console.log(JAMLIB.Io.inspect(jamConfig))
console.log(JAMLIB.Io.inspect(JAMLIB.Aios.options))
console.log(JAMLIB.Io.inspect(JAMLIB.Aios.Code.options))

var Sensors = {
  options : {
    Platform:true,
    Location:true,
    Clock:true,
    Time:true,
    GeoLocation:true,
    GeoLocation5:false,
    PublicNetworkIpAddress:true,
    Os:true,
    Browser:true,
    Device:true,
    Acceleration:true,
    Orientation:true,
    Light:true,
    Gps:true,
  }
}
Sensors.options=Object.assign(Sensors.options,jamConfig.options.sensors);
// Basic sensors
var appSensors = {
  Platform : { sensor:'PLATFORM', last:undefined, read:function () { 
    return "Browser" }},
  Location : { sensor:'LOCATION', info:'city,zip,country', last:undefined, read:function () { 
    var loc = Network.location;
    if (!loc || !loc.geo) return "?"
    else return [loc.geo.city,loc.geo.zip,loc.geo.country,'@IP'].join(',') }},
  Location5 : { sensor:'LOCATION5', info:'city,zip?,street,house number,country', gps5:{} , data: undefined, last:undefined, read:function () { 
    var loc = appSensors.Location5.data,ip=false;
    if (appSensors.GeoLocation5.data &&
        (appSensors.GeoLocation5.data.latitude!=appSensors.Location5.gps5.latitude ||
         appSensors.GeoLocation5.data.longitude!=appSensors.Location5.gps5.longitude)) {
      GET(jamConfig.reverse.primary.replace(/LAT/,appSensors.GeoLocation5.data.latitude)
                                   .replace(/LON/,appSensors.GeoLocation5.data.longitude),null,function (res) {
      _log('Location5: got ',res);
      // console.log('Location5: got '+JAMLIB.Io.inspect(res));
      if (res && typeof res == 'object') {
        var loc;
        if (res.address) loc=res.address;
        else if (res.results && res.results[0]) loc=res.results[0].components;
        appSensors.Location5.gps5=appSensors.GeoLocation5.data;
        if (loc)  appSensors.Location5.data={
          city:loc.city,
          zip:loc.postcode,
          street:loc.road,
          number:loc.house_number,
          country:loc.country
        }
      }

      // else _log('Location5 request failed: '+res);
      });
    } else if (!appSensors.GeoLocation5.data && Network.location && Network.location.geo5) {
      loc = Network.location.geo5;
      ip=true;
    }  
    // console.log('Location5: loc='+JAMLIB.Io.inspect(loc));
    if (!loc) return "?"
    else return ip?
                [loc.city,loc.zip,loc.street,loc.number,loc.country,'@IP'].join(',')
                :
                [loc.city,loc.zip,loc.street,loc.number,loc.country].join(',') }},
  Clock : { sensor:'CLOCK', last:undefined, read:function () { 
    return Math.floor(Date.now()) }},
  Time : { sensor:'TIME', last:undefined, read:function () { 
    var now = new Date();
    var hour = "0" + now.getHours();
    hour = hour.substring(hour.length-2);
    var minute = "0" + now.getMinutes();
    minute = minute.substring(minute.length-2);
    var second = "0" + now.getSeconds();
    second = second.substring(second.length-2);
    return hour + ":" + minute + ":" + second }},
  Date : { sensor:'DATE', last:undefined, read:function () { 
    var now = new Date();
    return now.toString() }},
  // GPS
  GeoLocation: { sensor:'GEO', info:'latitude,longitude,@IP', internal:true, state:0, last:undefined, read:function () { 
      if (Network.location && Network.location.gps) 
        return Network.location.gps.lat + ','+ 
               Network.location.gps.lon + ',@IP';
      else return "?";
    }, init : function () {
      appSensors.GeoLocation.state=1;
    }},
  PublicNetworkIpAddress : { sensor:'IP', last:undefined, read:function () { 
    if (Network.location) return Network.location.ip; else return "?" }},
  Os : { sensor:'OS', last:undefined, read:function () {    
    return global.platform.os.toString() }},
  Node : { sensor:'NODE', last:undefined, read:function () {    
    return Jam.jam.getNode().id }},
  Browser : { sensor:'BROWSER', last:undefined, read:function () {    
    return global.platform.name }},
  BrowserEngine : { sensor:'BENGINE', last:undefined, read:function () {    
    return global.platform.engine }},
  BrowserVersion : { sensor:'BVERSION', last:undefined, read:function () {    
    return global.platform.version }},
  JavaScriptVersion : { sensor:'JSVERSION', last:undefined, read:function () {    
    return global.platform.jsVersion() }},
  WebRTC : { sensor:'RTC?', last:undefined, read:function () {    
    return global.platform.hasWebRTC }},
  GeoLOC : { sensor:'GEOLOC?', last:undefined, read:function () {    
    return global.platform.geoloc }},
  Mobile : { sensor:'MOBILE?', last:undefined, read:function () {    
    return global.platform.mobile }},
  Device : { sensor:'DEVICE', last:undefined, read:function () {    
    return global.platform.product }},
  Author : { sensor:'AUTHOR', last:undefined, read:function () { 
    return "PD Dr. Stefan Bosse" }},
  ML  : { sensor:'MLVER', last:undefined, read:function () { 
    return ML.options.version }},
  JAMLIB  : { sensor:'JAMLIBVER', last:undefined, read:function () { 
    return JAMLIB.options.version }},
  Version : { sensor:'VERSION', last:undefined, read:function () { 
    return version }},
}
if (typeof phySensors != 'undefined') {
  appSensors=Object.assign(appSensors,phySensors);
}
var appSensorsMap = [];
appSensors.forEach( function(s,p) { appSensorsMap[s.sensor]=s });

function replaceContentInContainer(target, source) {
  document.getElementById(target).innerHTML = document.getElementById(source).innerHTML;
}
function scrollToBottom(id){
   var div = document.getElementById(id);
   if (div) div.scrollTop = div.scrollHeight - div.clientHeight;
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

pb._info=pb.info;
pb.info=function (msg) {if (jamConfig.popupLevel<1) log(msg); else pb._info(msg) }

/********** AIOS/NETWORK *************/    
Aios = JAMLIB.Aios;
JAMLIB.Name = JAMLIB.Aios.Name;
JAMLIB.setup = function (options,callback) {
  var jam=JAMLIB.Jam({
    print:options.print,
    print2:options.print2,
    provider:Jam.provider,
    nameopts:nameopts.node,
    Nameopts:nameopts.world,
    verbose:options.verbose,
    type:'webapp'
  });
  jam.init(function () {
    options.nodename  = jam.getNodeName();
    options.worldname = jam.getWorldName();
    if (callback) callback(jam);
  });
  // Capability 1 contains the JAM node private port and security port (random field)
  if  (jamConfig.capabilities[0]!='') {
  
  } else {
    var S=jam.security,N=jam.getNode();
    // Use random generated ports - secret!!!
    jamConfig.capabilities[0]=S.Capability(N.port,S.Private(0,0xFF,N.random[N.port]));
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


/******************** UPDATES ****************/
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
  // log('chatUpdate')
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
   for(var name in _classes) {
     function add(name) {
       var selected=_classes[name].selected;
       var ListItem = document.createElement("li");
       ListItem.appendChild(document.createTextNode(name));
       ListItem.addEventListener('click',function () {
        for(var p in _classes) 
          if (_classes[p].selected) {
            _classes[p].li.style.background='white';
            _classes[name].selected=false
          }
          ListItem.style.background = '#BBB';
          _classes[name].selected=true;
       });
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
       ListItem.addEventListener('click',function () {
         for(var p in _agents) 
           if (_agents[p].selected) { 
             _agents[p].li.style.background='white';
             _agents[name].selected=false
           }
         ListItem.style.background = '#BBB';
         _agents[name].selected=true;
       });
       list.appendChild(ListItem);
       _agents[name]={li:ListItem,selected:false};
      }
      add(name)
   }
}

function sensorInit() {
  for(var name in appSensors) {
    if (appSensors[name].init) appSensors[name].init();
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
      else if (Comp.obj.isArray(data)) return data.join(' , ');
      else if (Comp.obj.isObject(data)) return Object.keys(data).map(function (key) { return key+':'+data[key] }).join(',');
      else return String(data);
    }
    function add(name,data) {
      var ListLabel = document.createElement("label");
      var ListItem = document.createElement("li");
      ListLabel.style['overflow-x']='hidden';
      ListLabel.setAttribute("id",'SensorListLabel_'+name);
      ListItem.setAttribute("id",'SensorListItem1_'+name);
      ListLabel.appendChild(document.createTextNode(name+
        ' ('+appSensors[name].sensor+')'+
        (appSensors[name].info?' ['+appSensors[name].info+']':'')));
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

// Load or update agent class from user filesystem
function loadClass(url,cb) {
  if (url) {
    var file = basename(url);
    var aclass = classname(file);
    // Load from remote source; script loading creates a global constructor function!
    //if (typeof window[aclass] != 'undefined') {
    //  return pb.error('Cannot load agent class constructor '+aclass+': Exists already!');
    //}
    console.log('loadClass(url): Loading '+url)
    loadjs(url,function (ev) { 
        var added=[];
        if (Jam.jam) {
          // Jam.jam.compileClass(aclass,constr,{verbose:1});
          if (typeof window[aclass] == 'function') {
            try { Jam.jam.compileClass(aclass,window[aclass],{verbose:1}) }
            catch (e) { return cb?cb():null };
          };
          if (_classes[aclass]==undefined) {
            _classes[aclass]=false;
          }
          if (cb) cb(aclass);
        }   
    });
  } else {
    // Load from local filesystem - needs file reader
    var input = document.createElement("input");
    input.setAttribute("type", "file");
    input.addEventListener('change',function () { 
      var fileReader = new FileReader();
      fileReader.onload = function (e) {
        var added=[];
        // alert('Agent Class '+input.value+' loaded.\n');
        if (Jam.jam) {
          var constr = Jam.jam.open(fileReader.result);
          if (typeof constr == 'object')
            for(var p in constr) added.push(p),Jam.jam.compileClass(p,constr[p],{verbose:1});
          else 
            added.push('unkown'),Jam.jam.compileClass('unknown',constr,{verbose:1});
          for (p in added) {
            if (_classes[added[p]]==undefined) {
              _classes[added[p]]=false;
              function add(name) {
                var list = document.getElementById("app-list-classes");
                var ListItem = document.createElement("li");
                ListItem.appendChild(document.createTextNode(name));
                ListItem.addEventListener('click',function () {
                  for(var p in _classes) 
                    if (_classes[p].selected) _classes[p].li.style.background='white';
                  if (_classes[name].selected)
                    ListItem.style.background = 'white';
                  else
                    ListItem.style.background = '#BBB';
                  _classes[name].selected=!_classes[name].selected;
                });
                list.appendChild(ListItem);
                _classes[name]={li:ListItem,selected:false};
              }
              add(added[p]);
            }
          }
        }
      }
      fileReader.readAsText(input.files[0]);   
    });
    $(input).trigger("click"); // opening dialog
  }
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
      name+': ac='+stat.class+' pid='+ stat.pid+
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

var Network = {
  options: {link:jamConfig.network,proto:jamConfig.proto,log:jamConfig.options.network.log},
  location : undefined,
  state: 0,
  port:null,
  start: function () {
    var el; if (!Jam.jam) return;
    el=document.getElementById("app-net-start"); if (el) el.style.opacity=0.2;
    el=document.getElementById("app-net-stop"); if (el) el.style.opacity=1.0;
    Network.state=2;
    for (var i=0;i<4;i++)
      if (Network.options.link[i].ip && Network.options.link[i].ipport && Network.options.link[i].enable) 
        Jam.jam.connectTo(JAMLIB.Aios.DIR.IP(Network.options.link[i].ip+':'+
                                             Network.options.link[i].ipport+
                                             (Network.options.link[i].secure!=''?'?secure='+Network.options.link[i].secure:'')));
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
  },
  update : function (options) {
    if (Network.port) Network.port.amp.config(options);  
  }
}


/*********************** JAM **********************/
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
    document.getElementById('statistics-cpu').innerHTML=(stats.cpu|0).toString();
    document.getElementById('statistics-create').innerHTML=stats.create.toString();
    document.getElementById('statistics-fastcopy').innerHTML=stats.fastcopy.toString();
    document.getElementById('statistics-fork').innerHTML=stats.fork.toString();
    document.getElementById('statistics-received').innerHTML=stats.received.toString();
    document.getElementById('statistics-handled').innerHTML=stats.handled.toString();
    document.getElementById('statistics-migrate').innerHTML=stats.migrate.toString();
    document.getElementById('statistics-signal').innerHTML=stats.signal.toString();
    document.getElementById('statistics-error').innerHTML=stats.error.toString();
    document.getElementById('statistics-agents').innerHTML=stats.agents.toString();
    document.getElementById('statistics-tsout').innerHTML=stats.tsout.toString();
    document.getElementById('statistics-tsin').innerHTML=stats.tsin.toString();
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
  reset: function () {},
  // Sensor tuple provider
  provider: function (p) {
    if (p && p.length == 3 && p[0] == 'SENSOR') {
      if (appSensorsMap[p[1]])
        return [p[0],p[1],appSensorsMap[p[1]].read()]
    }
  }
}

// Creating JAM instance
JAMLIB.setup(Jam.options, function (jam) {
  log2 ('JAM '+Jam.options.nodename+ '['+Jam.options.worldname+'] is ready.');
  log ('JAMLIB Ver. '+JAMLIB.options.version);
  Jam.jam=jam;
  // Now create communication port(s)
  var options={};
  options.proto=Network.options.proto||'http';
  options.verbose=Network.options.log;
  options.multicast=true;
  var port = Network.port=jam.createPort(jam.DIR.IP(),options);
  port.link.on("link+",function (addr) {Network.state=3; pb.info('Connected to '+addr); Network.status()})
  port.link.on("link-",function () {Network.state=2; Network.status()})
  port.link.on("error",function (err,arg) {if (err=='link') { Network.state=0; pb.error('Link to '+arg+' failed!'); } Network.status()})
});


//if (window.location.href.indexOf('file:')!=0)
//  Network.options.link1.ip = window.location.href.replace(/http:\/\//,'').replace(/:[0-9]+[\/]*/,'');
  

/*********************
**  APP Controller
*********************/

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
    if (Jam.options.worldname) document.getElementById('jam-world').innerHTML=Jam.options.worldname;
    if (Jam.options.domain)    document.getElementById('jam-domain').innerHTML=Jam.options.domain;
    if (Jam.options.nodename)  document.getElementById('jam-node').innerHTML=Jam.options.nodename;
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

App.controller('page-setup', function (page) {
  $(page).on('appShow', function () {
    document.getElementById('setup-link1-enable').checked=Network.options.link[0].enable;
    document.getElementById('setup-link1-ip').value=Network.options.link[0].ip;
    document.getElementById('setup-link1-ipport').value=Network.options.link[0].ipport;
    document.getElementById('setup-link1-secure').value=Network.options.link[0].secure;
    if (Network.options.link[1].ip) 
      document.getElementById('setup-link2-enable').checked=Network.options.link[1].enable,
      document.getElementById('setup-link2-ip').value=Network.options.link[1].ip,
      document.getElementById('setup-link2-ipport').value=Network.options.link[1].ipport,
      document.getElementById('setup-link2-secure').value=Network.options.link[1].secure;
    if (Network.options.link[2].ip) 
      document.getElementById('setup-link3-enable').checked=Network.options.link[2].enable,
      document.getElementById('setup-link3-ip').value=Network.options.link[2].ip,
      document.getElementById('setup-link3-ipport').value=Network.options.link[2].ipport,
      document.getElementById('setup-link3-secure').value=Network.options.link[2].secure;
    if (Network.options.link[3].ip) 
      document.getElementById('setup-link4-enable').checked=Network.options.link[3].enable,
      document.getElementById('setup-link4-ip').value=Network.options.link[3].ip,
      document.getElementById('setup-link4-ipport').value=Network.options.link[3].ipport,
      document.getElementById('setup-link4-secure').value=Network.options.link[3].secure;

    document.getElementById('setup-network-https').checked=Network.options.proto=='https';

    document.getElementById('setup-msg-agent').checked=false;
    document.getElementById('setup-msg-parent').checked=false;
    document.getElementById('setup-msg-time').checked=false;
    document.getElementById('setup-msg-Time').checked=false;
    document.getElementById('setup-msg-class').checked=false;
    document.getElementById('setup-log-network').checked=false;
    document.getElementById('setup-sensors-geoloc').checked=false;
    document.getElementById('setup-jam-verbose').checked=false;
    if (Jam.options.log.agent)   document.getElementById('setup-msg-agent').checked=true;
    if (Jam.options.log.parent)  document.getElementById('setup-msg-parent').checked=true;
    if (Jam.options.log.time)    document.getElementById('setup-msg-time').checked=true;
    if (Jam.options.log.Time)    document.getElementById('setup-msg-Time').checked=true;
    if (Jam.options.log.class)   document.getElementById('setup-msg-class').checked=true;
    if (Network.options.log)     document.getElementById('setup-log-network').checked=true;
    if (Network.options.log)     document.getElementById('setup-log-network').checked=true;
    if (jamConfig.popupLevel==1)     document.getElementById('setup-popup').checked=true;
    if (Sensors.options.GeoLocation5)  document.getElementById('setup-sensors-geoloc').checked=true;
    if (Jam.options.verbose>1)     document.getElementById('setup-jam-verbose').checked=true;
  });
  $(page).on('appBack', function () {
    if (document.getElementById('setup-link1-ip').value!='')
      Network.options.link[0].enable=document.getElementById('setup-link1-enable').checked,
      Network.options.link[0].ip=document.getElementById('setup-link1-ip').value,
      Network.options.link[0].ipport=Number(document.getElementById('setup-link1-ipport').value),
      Network.options.link[0].secure=document.getElementById('setup-link1-secure').value;
    if (document.getElementById('setup-link2-ip').value!='')
      Network.options.link[1].enable=document.getElementById('setup-link2-enable').checked,
      Network.options.link[1].ip=document.getElementById('setup-link2-ip').value,
      Network.options.link[1].ipport=Number(document.getElementById('setup-link2-ipport').value),
      Network.options.link[1].secure=document.getElementById('setup-link2-secure').value;
    if (document.getElementById('setup-link3-ip').value!='')
      Network.options.link[2].enable=document.getElementById('setup-link3-enable').checked,
      Network.options.link[2].ip=document.getElementById('setup-link3-ip').value,
      Network.options.link[2].ipport=Number(document.getElementById('setup-link3-ipport').value),
      Network.options.link[2].secure=document.getElementById('setup-link3-secure').value;
    if (document.getElementById('setup-link4-ip').value!='')
      Network.options.link[3].enable=document.getElementById('setup-link4-enable').checked,
      Network.options.link[3].ip=document.getElementById('setup-link4-ip').value,
      Network.options.link[3].ipport=Number(document.getElementById('setup-link4-ipport').value),
      Network.options.link[3].secure=document.getElementById('setup-link4-secure').value;
    
    Network.options.proto=  document.getElementById('setup-network-https').checked?'https':'http',
    Jam.options.log.agent=  document.getElementById('setup-msg-agent').checked;
    Jam.options.log.parent= document.getElementById('setup-msg-parent').checked;
    Jam.options.log.time=   document.getElementById('setup-msg-time').checked;
    Jam.options.log.Time=   document.getElementById('setup-msg-Time').checked;
    Jam.options.log.class=  document.getElementById('setup-msg-class').checked;
    Network.options.log=    document.getElementById('setup-log-network').checked;
    jamConfig.popupLevel=   document.getElementById('setup-popup').checked?1:0;    
    Jam.options.verbose=    document.getElementById('setup-jam-verbose').checked?2:1;
    Sensors.options.GeoLocation5= document.getElementById('setup-sensors-geoloc').checked;
    JAMLIB.Aios.config({log:Jam.options.log})
    JAMLIB.Aios.config({verbose:Jam.options.verbose})
    Network.update({verbose:Network.options.log?1:0})
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
        case 'select':
          chatLastAction=[todo]; 
          if (last) last=last.then(function () { return botui.action.select(todo); }).then(function (res) {
                                      chatLastAction=[];
                                      return { then:function (f) { f(res) } }
                          });
          else {
            last=botui.action.select(todo).then(function (res) {
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
}

// External chat requests
function chatQuestion (id, question, action, callback, timeout) {
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
    if (botui && chatActive) botui.removeAction();
    if (callback) callback();
  },timeout);
  if (action instanceof Array) {
    // Buttons/Choices
    if (typeof action[0] == 'string') action=action.map(function (s) { return { text:s, value:s } });
    chatAction({kind:'button', delay: jamConfig.chatDelay, action: action});
    chatAction({kind:'checkpoint', callback:callback, timer:timer});
  } else if (typeof action == 'object' && action.options) {
    if (typeof action.options[0] == 'string') action.options=action.options.map(function (s) { return { text:s, value:s } });
    chatAction({kind:'select', delay: jamConfig.chatDelay, action: action});
    chatAction({kind:'checkpoint', callback:callback, timer:timer});
  } else if (typeof action == 'object')  {
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

// Chat agent API
Jam.jam.extend([2,3],'message',chatMessage);
Jam.jam.extend([2,3],'question',function (id, question, action, callback, timeout) {
  var process = Jam.jam.getProcess();
  chatQuestion (id, question, action, function (res) {
    process.callback(callback,res?[res.value]:null);
    process.wakeup();
    Jam.jam.schedule();
  },timeout);
  process.suspend(Aios.timeout(timeout));
},[4,5]);
Jam.jam.extend([2,3],'notify',function (msg) {
  pb._info(msg)
});

function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
}
Jam.jam.extend([2,3],'beep',function () {
  beep();
});

App.controller('page-chat', function(page) {
  $(page).on('appShow', function () {
    chatActive=true;
    chatUpdate();
    $('#chat-bot-content').height($('#chat-bot-page').height()-50);    
  })
  $(page).on('appHide', function () {
    chatHistory=nextChatHistory;
    if (chatLastAction && chatLastAction.length) chatHistory=chatHistory.concat(chatLastAction);
    chatLastAction=[];
    chatActive=false;
    botui=undefined;
  })

})

global.platform=Jam.jam.info('platform');
_log(global.platform)

var locationService = setInterval(function () {
  Jam.jam.locate(function (loc,err) { 
    Network.location=loc;
    _log('GeoLocation5 (secondary)',loc,err); 
  });
},30000);
Jam.jam.locate(function (loc,err) { 
  Network.location=loc;
  _log('GeoLocation5 (secondary)',loc,err); 
});

// Initialization on start up...
if (jamConfig.startJam) Jam.start();
if (jamConfig.startNetwork) Network.start();
if (jamConfig.classes) {
  for (var i in jamConfig.classes) {
    var aclass=jamConfig.classes[i];
    try { 
      Jam.jam.compileClass(aclass,i,{verbose:1}) 
      if (_classes[aclass]==undefined) {
        _classes[i]=false;
      }
    }
    catch (e) { pb.error(e) } 
  }
} 
if (jamConfig.loadAgents.length) {
  for (var i in jamConfig.loadAgents) {
    var url=jamConfig.loadAgents[i];
    loadClass(dirname(window.document.location.href)+'/'+url, function (aclass) {
      if (!aclass) return pb.error('Compiling agent from file '+url+' failed.');
    });
  }
} 
setTimeout(function () {
  for (var aclass in jamConfig.startAgents) {
    if (jamConfig.startAgents[aclass]) {
        createAgent(aclass,jamConfig.startAgents[aclass]);
    } else if (jamConfig.startAgents.indexOf &&
               jamConfig.startAgents.indexOf(aclass)>=0) 
        createAgent(aclass,{});
  }
},500);
sensorInit();
App.load('home');
document.getElementById("app-title").innerHTML = jamConfig.title;
if (jamConfig.firstpage != 'home') App.load(jamConfig.firstpage);
$('html').height($(window).height()-30);
$( window ).resize(function() {
  $('html').height($(window).height()-30);
})
document.addEventListener('click', function enableNoSleep() {
  try {
    document.removeEventListener('click', enableNoSleep, false);
    var noSleep = new NoSleep();
    noSleep.enable();
    pb.info('Disabled Screensaver!');
  } catch (e) { console.log(e) }
}, false);
          

