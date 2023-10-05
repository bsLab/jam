Logger.init();
Logger.close();			// open logger initially
console.log=log;
console.warn=log;
//print=log;
log('Target: '+global.TARGET);

function merge(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

var nameopts = {
  world:{length:8, memorable:true, uppercase:true},
  node:{length:8, memorable:true, lowercase:true}
}

var Network = {
  options:{
    bip:'localhost',
    bport:3001,
    http:false,
    tcpnet:2,
    verbose:1
  },
  net : undefined,
  privhostport : Main.Net.uniqport(),
  pubhostport : undefined,
  state: 0,
  start: function () {
    Network.net = Main.JamNet(merge({
        env:{rootdir:Main.Cs.nilcapset},
        pubhostport:Network.pubhostport,
      },Network.options));
    Network.state=1;
    Network.status();
    Network.net.on('connect',function () {
        Network.state=3;
        Network.status();
      });
    Network.net.on('disconnect',function () {
        Network.state=1;
        Network.status();
      });
    Network.net.on('error',function () {
        Network.state=1;
        Network.status();
      });
    Network.net.on('publish',function () {
        Network.state=4;
        Network.status();
      });
    Network.net.init();
    Network.state=2;
    Network.status();
    Network.net.start();
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
  },
  stop: function () {
    if (Network.net && Network.state > 1) {
      Network.net.stop();
      Network.state=1;
      Network.status();
    }
  }
}

Network.pubhostport = Main.Net.prv2pub(Network.privhostport);

var Jam = {
  options:{
    domain:'default',
    nodename:undefined,
    worldname : Main.Name.generate(nameopts.world)
  },
  jam : Main.Name.generate(nameopts.node),
  Jam: undefined,
  state : 0,
  start: function () {
    if (Jam.World==undefined && Network.state>=1) {
      log('Starting JAM World '+Jam.world+'..');
      Jam.state=1;
      Jam.World = Main.Aios.World.World([],{
        id:Jam.options.worldname,
        out:function (msg) {log('[JAW] '+msg)},
        scheduler:Network.net.scheduler
      });
      Jam.Jam = Main.Jam({
            world:Jam.World,
            verbose:1,
            out:function (msg) {log('[JAM] '+msg)},
            network:Network.net,
            scheduler:Network.net.scheduler
          });
          
      Jam.Jam.init(function (stat,nodename) {
        if (stat==Main.Net.Status.STD_OK) {
          document.getElementById('jam-node').innerHTML=nodename;
          Jam.options.nodename=nodename;
        }
      });
      Jam.Jam.start();        
    }    
  },
  World : undefined
}


log ('JAM World: '+Jam.world);

/*********************
**  APP Controller
*********************/

App.setDefaultTransition({
  ios             : 'fade' , // iOS
  iosFallback     : 'fade' , // iOS <5
  android         : 'fade' , // Android
  androidFallback : 'fade' , // Android < 4
  fallback        : 'fade'   // non-iOS, non-Android
});

App.controller('home', function (page) {
  // put stuff here
});

App.controller('page-network', function(page) {
  $(page).on('appShow', function () {
    Network.status();
  });
  $(page).on('appBack', function () {
  });
});

App.controller('page-jam', function (page) {
  // put stuff here
  $(page).on('appShow', function () {
    if (Jam.options.worldname) document.getElementById('jam-world').innerHTML=Jam.options.worldname;
    if (Jam.options.domain) document.getElementById('jam-domain').innerHTML=Jam.options.domain;
    if (Jam.options.nodename) {
      document.getElementById('jam-node').innerHTML=Jam.options.nodename;
      Jam.Jam.publish();
    }
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
  });
  $(page).on('appBack', function () {
  });
});

App.controller('page-agents', function (page) {
  // put stuff here
  // log('JAM is a '+Main.Jam);	// the first message
  $(page).on('appShow', function () {
  
  });
  $(page).on('appBack', function () {
  });
  
});

App.controller('page-setup', function (page) {
  $(page).on('appShow', function () {
    document.getElementById('setup-broker-ip').value=Network.options.bip;
    document.getElementById('setup-broker-ipport').value=Network.options.bport;
    document.getElementById('setup-domain').value=Jam.options.domain;
    if (Network.options.http) {
      document.getElementById('setup-proto-http').checked=true;
      document.getElementById('setup-proto-tcpnet').checked=false;
    } else {
      document.getElementById('setup-proto-http').checked=false;
      document.getElementById('setup-proto-tcpnet').checked=true;    
    }
  });
  $(page).on('appBack', function () {
    Network.options.bip=document.getElementById('setup-broker-ip').value;
    Network.options.bport=Main.Comp.pervasives.int_of_string(document.getElementById('setup-broker-ipport').value);
    Jam.options.domain=document.getElementById('setup-domain').value;
    if (document.getElementById('setup-proto-http').checked) {
      Network.options.http=true;
      Network.options.tcpnet=0;
    } else {
      Network.options.http=false;
      Network.options.tcpnet=1;    
    }
  });
  
});

try {
  App.restore();
} catch (err) {
  App.load('home');
}
