/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     23/05/16 by sbosse.
 **    $VERSION:     1.1.8
 **
 **    $INFO:
 **
 **  JAMDOS: Run Server Extension
 **
 **
 **    $ENDOFINFO
 */

var log = 0;
var util = Require('util');
var Io = Require('com/io');
var trace = Io.tracing;
var current=none;
var Aios = none;


var Net = Require('dos/network');
var Rpc = Require('dos/rpc');
var Router = Require('dos/router');
var Compat = Require('com/compat');
var Perv = Compat.pervasives;
var String = Compat.string;
var Array = Compat.array;
var assert = Compat.assert;
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var DnsCom = Require('dos/dns_srv_common');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var Json = Require('jam/jsonfn');
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;

var isNodeJS = Compat.isNodeJS();

var run = function (options) {
  this.options=options;
}


run.prototype.request = function (rpcio) {
  var text,ac,code,name,
      id,obj;
  Io.log((log < 1) || ('[RUN] service request: '+Net.Print.header(rpcio.header)));
  assert(rpcio.index != -1, 'RPCIO invalid');

  rpcio.pos = 0;
  rpcio.header.h_status = Status.STD_OK;
  obj = Net.prv_number(rpcio.header.h_priv);

  try {switch (rpcio.header.h_command) {
    case Command.PS_CREATE:
      /* Create a process from a template and execute with arguments
      ** --------------------
      ** class name (string)
      ** num argunments (int16)
      ** arg1 (string) 
      ** ..
      ** --------------------
      ** --------------------
      */
      break;

    case Command.PS_EXEC:
      /* Create a process from code {} (next activity already computed!)
      ** ------------------
      **  object JS   (string)  "{ x:..,y:..,act:..,trans:..,.. }"
      **  ----------------------
      **  ----------------------
      */
      if (!Net.prv_rights_check(rpcio.header.h_priv ,this.random, Rights.PSR_WRITE|Rights.PSR_CREATE)) {
        throw Status.STD_DENIED;        
      }
      text = Buf.buf_get_string(rpcio);
      // code=Json.parse(text,{}); 
      // console.log(code)   
      this.receive(text,true);
      break;

    case Command.PS_FORK:
      // Fork a process from a running process
      break;
  
    case Command.PS_MIGRATE:
      // Migration: Execute a process from a snapshot (next activity computed here!)
      // console.log(Net.Print.private(rpcio.header.h_priv))
      if (!Net.prv_rights_check(rpcio.header.h_priv ,this.random, Rights.PSR_WRITE|Rights.PSR_CREATE)) {
        throw Status.STD_DENIED;        
      }
      /*
      **
      **  ----------------------
      **  object JS   (string)  "{ x:..,y:..,act:..,trans:..,.. }"
      **  ----------------------
      **  ----------------------
      */
      text = Buf.buf_get_string(rpcio);
      // code=Json.parse(text,{}); 
      // console.log(code)   
      // console.log(text)
      this.receive(text,false);
      break;

      
    case Command.PS_READ:
      /* Client read request for a process class template
      **
      **  ----------------------
      **  class name (string)
      **  ----------------------
      **  object JS   (string)  "{ ac: function() .. }"
      **  ----------------------
      */
      name = Buf.buf_get_string(rpcio);
      ac=this.getclass(name);
      if (ac) {
        text=Json.stringify({name:ac});
        Buf.buf_init(rpcio);
        Buf.buf_put_string(rpcio, text);
      } else rpcio.header.h_status = Status.STD_UNKNOWN;
      break;
      

    case Command.PS_STUN:
      // Kill a process/ create a snapshot
      id = Buf.buf_get_string(rpcio);
      stat=Aios.kill(id);
      if (stat) this.out('Agent '+id+' terminated.');
      break;

    case Command.PS_WRITE:
      // console.log(Net.Print.private(rpcio.header.h_priv))
      if (!Net.prv_rights_check(rpcio.header.h_priv ,this.random, Rights.PSR_WRITE|Rights.PSR_CREATE)) {
        throw Status.STD_DENIED;        
      }
      /*
      **  Client write request for a process class template
      **
      **  ----------------------
      **  object JS   (string)  "{ ac: function() .. }"
      **  ----------------------
      **  ----------------------
      */
      text = Buf.buf_get_string(rpcio);
      ac=Json.parse(text,{}); 
      // console.log(ac)   
      this.addclass(ac);
      break;
      
    default:
      // Not serviced.
      return false;
  }} catch (e) {
    switch (e) {
      case Status.STD_DENIED: rpcio.header.h_status=e; break;
      default: 
        Io.out('[RUN] Error: '+e);
        rpcio.header.h_status=Status.STD_SYSERR;
    }
  }
  return true;  // serviced
}

module.exports = {
  run:run,
  current:function (module) { current=module.current; Aios=module; }
}

