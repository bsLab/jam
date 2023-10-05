/**
 **      ==============================
 **       OOOO        O      O   OOOO
 **       O   O       O     O O  O   O
 **       O   O       O     O O  O   O
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
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     3/28/15 by sbosse.
 **    $VERSION:     1.1.9
 **
 **    $INFO:
 **
 * ================================
 * DOS: Common connection utilities.
 * ================================
 *
 **
 **    $ENDOFINFO
 */
"use strict";
var log = 0;

var util = Require('util');
var http = Require('http');

var Io = Require('com/io');
var Buf = Require('dos/buf');
var Net = Require('dos/network');
var xmldoc = Require('dos/ext/xmldoc');
var Comp = Require('com/compat');
var Perv = Comp.pervasives;
var Hashtbl = Comp.hashtbl;
var String = Comp.string;
var Rand = Comp.random;
var Array = Comp.array;
var trace = Io.tracing;
var div = Perv.div;

var Mode = {
  ONECHAN:'ONECHAN',    // Only client can send messages (ang get replies on the request channel) - one two-way channel
  TWOCHAN:'TWOCHAN',    // Both broker server and client can send messages, i.e., different one-way request/reply channels
  KEEPALIVE:'KEEPALIVE',// Reuse connections
  AUTO:'AUTO'           // Automatic mode 1-chan/2-chan/keepalive, broker only
}


/*
** Parse query string '?attr=val&attr=val...
*/
function parseQueryString( url ) {
    var queryString = url.substring( url.indexOf('?') + 1 );
    if (queryString == url) return [];
    var params = {}, queries, temp, i, l;

    // Split into key/value pairs
    queries = queryString.split("&");

    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=');
        if (temp[1]==undefined) temp[1]='true';
        params[temp[0]] = temp[1];
    }

    return params;
}

/** Get XML data
 *
 */
function getData(data) {
  if (data==undefined) return undefined;
  else if (data.val!='') return data.val;
  else return data.children.toString();
}

function ipequal(ip1,ip2) {
    if (ip1==undefined || ip2==undefined) return false;
    else if ((String.equal(ip1,'localhost') || String.equal(ip1,'127.0.0.1')) &&
        (String.equal(ip2,'localhost') || String.equal(ip2,'127.0.0.1'))) return true;
    else return String.equal(ip1,ip2);
}

/** Split multiple first-level {}\n{}\n message parts // Buffer or string
 *
 */
function splitData(data) {
  var messages;
  if (Buffer.isBuffer(data)) messages = data.toString().split('\n');
  else messages = data.split('\n');
  return messages;
}

/** Decode a message (ASCII -> Binary)
 *
 */
function decode(msg) {
  if (msg.hostport && msg.hostport.length!=Net.PORT_SIZE) msg.hostport = Net.port_of_str(msg.hostport);
  if (msg.sendport && msg.sendport.length!=Net.PORT_SIZE) msg.sendport = Net.port_of_str(msg.sendport);  
  if (msg.srvport && msg.srvport.length!=Net.PORT_SIZE) msg.srvport = Net.port_of_str(msg.srvport);
  if (msg.data && msg.data[0]) for(var i in msg.data) decode(msg.data[i]);
  else if (msg.data) decode(msg.data);
}

/** Encode a message (Binary->ASCII)
 *
 */
function encode(msg) {
  if (msg.hostport && msg.hostport.length==Net.PORT_SIZE) msg.hostport = Net.port_to_str(msg.hostport);
  if (msg.sendport && msg.sendport.length==Net.PORT_SIZE) msg.sendport = Net.port_to_str(msg.sendport);  
  if (msg.srvport && msg.srvport.length==Net.PORT_SIZE) msg.srvport = Net.port_to_str(msg.srvport);  
  if (msg.data && msg.data[0]) for(var i in msg.data) encode(msg.data[i]);  
  else if (msg.data) encode(msg.data);
}


module.exports = {
    decode:decode,
    encode:encode,
    // Extract data from xmldoc <data>..</data> element
    getData: getData,
    ipequal: ipequal,
    splitData:splitData,
    EOM: '\n',
    // Parse HTTP query string
    parseQueryString: parseQueryString,

    is_error: function (data,err) {
        if (err==undefined)
            return (data.length > 0 && String.get(data,0)=='E');
        else
            return (String.equal(data,err));
    },
    is_status: function (data,stat) {
        if (stat==undefined)
            return (data.length > 4 && String.equal(data.substring(0,4),'STAT'));
        else
            return (String.equal(data,stat));
    },
    is_xml: function(data) {
        return (data.length > 5 && String.equal(data.substring(0,5),'<xml>'));
    },
    Mode:Mode
};
