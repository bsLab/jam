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
 **    $INITIAL:     (C) 2006-2020 bLAB
 **    $CREATED:     09-02-16 by sbosse.
 **    $RCS:         $Id: amp.js,v 1.1 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.11.1
 **
 **    $INFO:
 **
 **  JAM Agent Management Port (AMP) over UDP/HTTP/devices/streams
 **
 **
 **  New: Fully negotiated IP Multicast Ports (P2N)
 **
 **    $ENDOFINFO
 */

var Io = Require('com/io');
var Lz = Require('os/lz-string');
var Comp = Require('com/compat');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var Command = Net.Command;
var Status = Net.Status;
var current=none;
var Aios=none;
var CBL = Require('com/cbl');

var COM = Require('jam/ampCOM'),
    AMMode=COM.AMMode,
    AMMessageType=COM.AMMessageType,
    AMState=COM.AMState,
    amp=COM.amp,
    options=COM.options,
    url2addr=COM.url2addr,
    addr2url=COM.addr2url,
    addrequal=COM.addrequal,
    resolve=COM.resolve,
    ipequal=COM.ipequal,
    getNetworkIP=COM.getNetworkIP,
    doUntilAck=COM.doUntilAck;

options.localhost='localhost';
options.version='1.11.1',
options.AMC_MAXLIVE=5,
options.TIMER=500,
options.TRIES=10;
options.REGTMO=1000;
options.pem={};

/***********************
** AMP
************************/

var ampMAN = Require('jam/ampMAN');
var ampRPC = Require('jam/ampRPC');

if (global.TARGET!= 'browser') {
  /******************************* AMP *************************************/

  var ampUDP = Require('jam/ampUDP');
  var ampTCP = Require('jam/ampTCP');
  var ampStream = Require('jam/ampStream');
}  

var ampHTTP = Require('jam/ampHTTP');
var ampHTTPS = Require('jam/ampHTTPS');

  
/** Main AMP constructor
 *  ====================
 *
 */
var Amp = function (options) {
  var obj;

  switch (options.proto) {
    case 'stream':
      obj=new amp.stream(options);
      break;
    case 'http':
      obj=new amp.http(options);
      break;
    case 'https':
      obj=new amp.https(options);
      break;
    case 'tcp':
      obj=new amp.tcp(options);
      break;
    case 'udp':
    default:
      obj=new amp.udp(options);
  }
  return obj;
}

module.exports.current=function (module) { 
  current=module.current; Aios=module; 
  if (ampMAN) ampMAN.current(module);
  if (ampUDP) ampUDP.current(module);
  if (ampHTTP) ampHTTP.current(module);
  if (ampHTTPS) ampHTTPS.current(module);
  if (ampTCP) ampTCP.current(module);
  if (ampStream) ampStream.current(module);
  if (ampRPC) ampRPC.current(module);
};

module.exports.Amp=Amp;
module.exports.AMMessageType=AMMessageType;
module.exports.AMState=AMState;
module.exports.AMMode=AMMode;
module.exports.Com=COM;
module.exports.Rpc=ampRPC;

module.exports.url2addr=url2addr;
module.exports.addr2url=addr2url;
module.exports.resolve=resolve;

module.exports.Command=Command
module.exports.Status=Status

module.exports.options=options;
