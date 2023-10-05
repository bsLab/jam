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
 **    $CREATED:     1-3-18 by sbosse.
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 **  JAM Shell Interpreter (Front end)
 **
 **    $ENDOFINFO
 */
/* Soem hacks */
process.noDeprecation = true

var Comp = Require('com/compat');
var Io = Require('com/io');
var doc = Require('doc/doc');
var table = Require('doc/table');
var readline = Require('com/readline');
var readlineSync = Require('term/readlineSync');
var renderer = doc.Renderer({lazy:true});
var http = Require('http');
var httpserv = Require('http/https');  // a file server!
try { var https = require('https'); } catch (e) {}; if (!https.request) https=undefined;
var geoip = Require('geoip/geoip');  // a geo location database server 
var util = Require('util')
var sip = Require('top/rendezvous');
var db = Require('db/db');
// JAM Shell Interpreter (Back end)
var JamShell = Require('shell/shell');

var nlp = Require('nlp/nlp');

var ml    = Require('ml/ml')
var nn    = Require('nn/nn')
var csp   = Require('csp/csp')
var sat   = Require('logic/sat')
var logic = Require('logic/prolog')
var csv   = Require('parser/papaparse');
var ampCOM = Require('jam/ampCOM');
var numerics = Require('numerics/numerics')
var osutils = Require('os/osutils');
var UI    = Require('ui/app/app');
var Des48 = Require('dos/des48');

var p;

var options= {
  args:[],
  echo: true,
  modules : {
    csp : csp,
    csv : csv,
    db : db,
    des48 : Des48,
    doc : doc,
    geoip : geoip,
    http : http,
    httpserv : httpserv,
    https : https,
    logic:logic,
    ml:ml,
    nlp:nlp,
    nn:nn,
    numerics:numerics,
    os:osutils,
    readline : readline,
    readlineSync : readlineSync,
    sat : sat,
    sip : sip,
    table : table,
    UI: UI,
  },
  extensions : {
    url2addr: ampCOM.url2addr,
    sleep: process.watchdog&&process.watchdog.sleep?
      function (milli) {
        process.watchdog.sleep(milli)
      }:undefined
  },
  nameopts : {length:8, memorable:true, lowercase:true},
  Nameopts : {length:8, memorable:true, uppercase:true},
  output : null,
  renderer : renderer,
  server : false,
  verbose : 0,
}

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  console.log("jamsh not exiting...");
});

if ((p=process.argv.indexOf('--'))>0) {
  options.args=process.argv.slice(p+1,process.argv.length);
  process.argv=process.argv.slice(0,p);
}

if (process.argv[1].match(/jamsh$/)||process.argv[1].match(/jamsh\.debug$/)) {
  var ind;
  if (process.argv.indexOf('-h')>0) return print('usage: jamsh [-v -s] [script] [-e "shell commands"]');
  if ((ind=process.argv.indexOf('-e'))>0) {
    options.server=true;
    options.output=console.log;
    options.exec=process.argv[ind+1];
  } else if (process.argv.length>2) {
    var script = process.argv.filter(function (arg,ind) {  
      return ind>1 && arg.indexOf(':') == -1 && arg.indexOf('-') != 0;
    });
    if (script.length == 1) {
      options.script=script[0];
      options.output=console.log;
      options.server=true;
    }
  }
  process.argv.forEach(function (arg) { 
    switch (arg) {
      case '-v': options.verbose++; break; 
      case '-s': options.server=false; break; 
    }
  })
  if (!options.server && options.verbose==0) options.verbose=1; 
  JamShell(options).init();
}
