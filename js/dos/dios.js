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
 **    $INITIAL:     (C) 2006-2017 B-LAB
 **    $CREATED:     23/06/16 by sbosse.
 **    $VERSION:     1.1.4
 **
 **    $INFO:
 **
 **  DIOS: Simplified DOS I/O System Wrapper Layer
 **
 **
 **    $ENDOFINFO
 */
"use strict";
var Io = Require('com/io');
var Comp = Require('com/compat');

var Net = Require('dos/network');
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Std = Require('dos/std');
var Router = Require('dos/router');
var Fs = Require('fs');
var Dns = Require('dos/dns');
var Afs = Require('dos/afs');
var Cs = Require('dos/capset');
var Status = Net.Status;

/**
 *
 */
 
// type dios : function ('rpc:rpcint,'env) : dios
// with 'env:{rootdir:capset}
var dios = function(rpc,env) {
    this.rpc  = rpc;
    this.env  = env;
    this.env.workdir = env.rootdir;
    this.std  = Std.StdInt(rpc,env);
    this.dns  = Dns.DnsInt(rpc,env);
    this.afs  = Afs.AfsInt(rpc,env);
    this.cs   = Cs.CsInt(rpc,env);
    this.stat = Status.STD_OK;
};


// with cb:function((name:string,time:number,cap:capability,stat:status) [],status,boolean?)
dios.prototype.dir = function (path,cb,nocap) {
  var self=this;
  this.dns.dns_lookup(undefined,path,function (stat,cs,remain) {
    self.stat=stat;
    if (stat==Status.STD_OK) {
      self.dns.dns_list(cs,function (stat,dir) {
        var rows=[],index=0,stat;
        self.stat=stat;
        if (stat==Status.STD_OK) {
          // TODO: lookup all row entries ..
          rows=Comp.array.map(dir.di_rows,function (row) {
            return {
              name:row.de_name,
              time:row.de_time,
              cap:undefined,
              stat:Status.STD_OK
            }
          });
          
          if (!nocap) L(
            function () {return index<rows.length},
            [
              function () {
                // console.log(rows[index].name);
                self.dns.dns_lookup(cs,rows[index].name,function (_stat,_cs){
                  stat=_stat;
                  if (stat==Status.STD_OK) rows[index].cap=self.cs.cs_to_cap(_cs);
                })
              },
              function () {
                // Server can be unavailable or is gone
                if (stat!=Status.STD_OK) {
                  rows[index].stat=stat; // throw stat;
                  rows[index].cap=Net.nilcap;
                }
                index++;
              }
            ],
            [
              function () {cb(rows,stat);}
            ],
            function (stat) {cb(undefined,stat)}
          ); else cb(rows,stat);    
        } else cb(undefined,stat);
      });
    } else cb(undefined,stat);
  });
}

// with cb:function(capability?,status)
dios.prototype.resolve = function (path,cb) {
  var self=this;
  // console.log(path)
  this.dns.dns_lookup(undefined,path,function (stat,cs,remain) {
    self.stat=stat;
    if (stat==Status.STD_OK) cb(self.cs.cs_to_cap(cs),stat);
    else cb(undefined,stat);
  });
}

var Dios = function (rpc,env) {
  return new dios(rpc,env);
}

module.exports = {
  Dios: Dios
}
