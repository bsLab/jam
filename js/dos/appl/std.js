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
 **    $INITIAL:     (C) 2015-2017 bLAB
 **    $CREATED:     21-5-15
 **    $VERSION:     1.5.3
 **
 **    $INFO:
 **
 **  Standard Request Command Line Application
 **
 **    $ENDOFINFO
 */
var log = 0;

var Io = Require('com/io');
//Io.trace_open('/tmp/std.trace');

if (typeof Shell == 'object') Io.set_stdout(Shell.stdout);

var Net = Require('dos/network');
var Sch = Require('dos/scheduler');
var Conn = Require('dos/connection');
var Std = Require('dos/std');
var Dns = Require('dos/dns');
var Cs = Require('dos/capset');
var HostSrv = Require('dos/hostsrv');
var util = Require('util');
var Comp = Require('com/compat');
var assert = Comp.assert;
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Args = Comp.args;
var Status = Net.Status;
var Command = Net.Command;

var trace = Io.tracing;

var options = {
  bip:'localhost',
  bport:3001,
  broker: true,
  caps:[],
  cmd:Command.STD_INFO,
  default:false,
  delay:0,
  dip : 'localhost',
  dports : [],
  echo:false,
  env:{},
  fifo:false,
  fifodir:'/tmp/broker',
  fifochan:1,
  hostname:Io.hostname(),
  hostport:undefined,
  http:false,
  keepalive:true,
  links:[],
  monitor:0,
  myip:'localhost',
  overwrite:false,
  params : [],
  print : false,
  servmode:false,
  tcpnet:1,
  test:0,
  verbose:0
};

var help=false;
var shift='';

var env={};
options.env=env;
var argv = Io.getargs();

var out = function (s) {Io.out('[STD] '+s)};

function err(msg) {
    out('Error: std '+Comp.array.tail(argv,2)+' => '+msg);
    Io.exit();
}

function getip(str) {
    var tokens = String.split(':',str);
    if (tokens.length==2) return tokens[0];
    else if (tokens.length==1) return 'localhost';
    else return '';

}

function getipport(str) {
    var tokens = String.split(':', str);
    if (tokens.length == 2) return Perv.int_of_string(tokens[1]);
    else if (tokens.length == 1) return Perv.int_of_string(tokens[0]);
    else return '';

}

if (typeof Shell == 'object') Io.set_args(Shell.args);
Args.parse(argv, [
    [['-h','-help'],0,function() {help=true}],
    [['-v','-verbose'],0,function() {options.verbose++;options.echo=true}],
    [['-d','-default'],0,function() {options.default=true;}],
    ['-overwrite',0,function() {options.overwrite=true;}],
    ['-monitor',0,function() {options.monitor++;}],
    ['-print',0,function() {options.print=true;}],
    ['-server',0,function() {options.servmode=true;options.verbose++;}],
    ['-test',1,function(val) {options.test=Perv.int_of_string(val);}],
    ['-delay',1,function(val) {options.delay=Perv.int_of_string(val);}],
    ['-broker',1,function(val){
      var tokens = Comp.string.split(':',val);
      if (tokens.length==1)
        options.bip=val;
      else {
        options.bip=tokens[0];      
        options.bport=Perv.int_of_string(tokens[1])
      }
    }],
    ['-dip',1,function(val){options.dip=val}],
    ['info',0,function() {options.cmd=Command.STD_INFO;}],
    ['status',0,function() {options.cmd=Command.STD_STATUS;}],
    ['age',0,function() {options.cmd=Command.STD_AGE;}],
    ['setparams',0,function() {options.cmd=Command.STD_SETPARAMS;}],
    ['touch',0,function() {options.cmd=Command.STD_TOUCH;}],
    ['destroy',0,function() {options.cmd=Command.STD_DESTROY;}],
    ['create',0,function() {options.cmd=Command.DNS_CREATE;}],
    ['delete',0,function() {options.cmd=Command.DNS_DELETE;}],
    ['-D',1,function(val){options.dports.push(Perv.int_of_string(val))}],
    ['-L',2,function(val1,val2){options.links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])}],
    ['-nokeepalive',0,function(val){options.keepalive=false;}],
    ['-T',0,function(val){options.tcpnet=1;options.http=false;}],
    ['-T2',0,function(val){options.tcpnet=2;options.http=false;}],
    ['-H',0,function(val){options.http=true;options.tcpnet=0;}],
    ['-F',1,function(val){
      options.fifo=true;options.tcpnet=0;
      if (Comp.string.isNumeric(val)) options.fifochan=Perv.int_of_string(val);
      else {
        options.fifodir=val.split(/[0-9]./)[0];
        options.fifochan=(val.split(/[a-z]./).reverse()[0])||options.fifochan;
      }
    }],
    [function(val){
        var pv = String.split('=',val);
        if (Array.length(pv)==2) {
            options.params.push(pv);
        } else
            options.caps.push(val);
    }]
],2);


if ((help || options.cmd==undefined || options.caps.length==0) && !options.servmode) {
    Io.out('usage: '+argv[0]+' '+argv[1]);
    Io.out('  [-help -test #loops -delay #msec -print]');
    Io.out('  [-H -T -T2 -F <path>]  Enable connection service');
    Io.out('    T: TCPIP, 1-ch H:HTTP T2: TCPIP, 2-ch');
    Io.out('    H: bport, T: bport+100');
    Io.out('    F: FIFO channel or full FS path with FIFO basename');
    Io.out('    (Default: -T)');
    Io.out('  [-D <port>] UDP Server Port');
    Io.out('  [-L <src port> <UDP dst [address:]port] UDP P2P Connection');
    Io.out('  [-nokeepalive] Establish a new conncetion for each message.');
    Io.out('  [-broker <ip[:ipport]>]  Broker URL (Default: '+options.bip+': HTTP '+options.bport+' TCPNET '+(options.bport+100)+')');
    Io.out('  [-dip <VLC UDP server IP>] (Default: '+options.dip+')');
    Io.out('  [-v -verbose -monitor]');
    Io.out('  [-default -d] Ask broker server for default DNS root');
    Io.out('  [-overwrite AFS/DNS overwrite mode]');
    Io.out('  [-server] Host Server Mode (only)');
    Io.out('  info status age touch destroy setparams create delete');
    Io.out('  <port> | <cap> | <capfile> | <path> | <parameter>=<value>..');
    return;
}


if (options.servmode) options.privhostport = Net.port_name('std'+options.hostname);
else options.privhostport = Net.uniqport();
options.pubhostport = Net.prv2pub(options.privhostport);

if (options.echo) out('['+Net.Print.port(options.pubhostport)+'] '+argv[1]+' '+
                      Command.print(options.cmd)+ ' ' + options.caps);

var scheduler = Sch.TaskScheduler();
scheduler.Init();
//scheduler.log(2);



// Set-up the network environment ..
// typeof options : {http,tcpnet,dports,bip,bport,myip,verbose}
var network = Conn.setup(options);

var StdInt = Std.StdInt(network.rpc);
var DnsInt = Dns.DnsInt(network.rpc);
var CsInt = Cs.CsInt(network.rpc);

var cap;
if (env.rootdir) {
  DnsInt.set_rootdir(env.rootdir);
} 


var schedules=[];

var stat,data;

function action (capp) {
  var cap,
      cs,
      csnew,
      capp,
      row,
      stat; 

  function resolve (name,cb) {
    var cap;
    if (name !='/' && Io.exists(name)) {
        /*
        ** It is a capability file
         */
        cap = Net.cap_of_file(name);
        cb(Status.STD_OK,cap);
    } else if (env.rootdir) {
      /*
      ** Look-up from DNS ...
      */
      DnsInt.dns_lookup(env.rootdir,name,function (_stat,_cs) {
        if (_stat==Status.STD_OK) cb(_stat,CsInt.cs_to_cap(_cs));
        else cb(_stat);
      })
    } else {
        /*
        ** It is a capability string?
         */
        var cp=Net.Parse.capability(name,0);
        if (cp==undefined) {
            /*
            ** It is a port string?
             */
            cp=Net.Parse.port(name,0);
            if (cp!=undefined) {
                cap=Net.Capability(cp.port);
            }
        } else {
            cap=cp.cap;
        }
        if (cp==undefined) {
            err('Invalid capability or port: '+name);
        }
        cb(Status.STD_OK,cap);
    }
  }
  switch (options.cmd) {
      case Command.STD_INFO:
          Io.log(((log+options.verbose)<1)||('+std_info '+capp));
          schedules=Array.concat(schedules,[
              function () {
                resolve(capp, function (_stat,_cap) {
                  stat=_stat;
                  cap=_cap;
                });
              },
              function () {
                  if (stat!=Status.STD_OK) err('Cannot get info for '+capp+': '+Status.print(stat));
                  if (!cap) err('Invalid capability ('+capp+')');
                  Io.log(((log+options.verbose)<1)||('exec std_info '+Net.Print.capability(cap)));
                  StdInt.std_info(cap,function(_stat,_data) {
                      stat=_stat;
                      data=_data;
                  });
              },
              function () {
                  Io.log(((log+options.verbose)<1)||('finalize std_info '+
                                                      Net.Print.capability(cap)+' ['+
                                                      (data?data.length:0)+']'));
                  if (stat==Status.STD_OK) {if (options.delay > 0  || options.test==0 || options.print) out(data);}
                  else out(Status.print(stat));
                  if ((options.delay > 0  || options.test==0) && options.monitor) out(network.router.status());
                  if (options.delay > 0) Sch.Delay(options.delay);
              }
          ]);
          break;

      case Command.STD_SETPARAMS:
          Io.log(((log+options.verbose)<1)||('+std_setparams '+capp));
          schedules=Array.merge(schedules,[
              function () {
                resolve(capp, function (_stat,_cap) {
                  stat=_stat;
                  cap=_cap;
                })
              },
              function () {
                  if (stat!=Status.STD_OK) err('Cannot set params for '+capp+': '+Status.print(stat));
                  if (!cap) err('Invalid capability ('+capp+')');
                  Io.log(((log+options.verbose)<1)||('exec std_setparams '+Net.Print.capability(cap)));
                  StdInt.std_setparams(cap,params,function(_stat) {
                      stat=_stat;
                  });
              },
              function () {
                  Io.log(((log+options.verbose)<1)||('finalize std_setparams '+Net.Print.capability(cap)));
                  if (stat!=Status.STD_OK) out(Status.print(stat));
                  if ((options.delay > 0  || options.test==0) && monitor) 
                    out(network.router.status());
                  if (options.delay > 0) Sch.Delay(options.delay);
              }
          ]);
          break;

      case Command.STD_STATUS:
          Io.log(((log+options.verbose)<1)||('+std_status '+Net.Print.capability(cap)));
          schedules=Array.merge(schedules,[
              function () {
                resolve(capp, function (_stat,_cap) {
                  stat=_stat;
                  cap=_cap;
                })
              },
              function () {
                  if (stat!=Status.STD_OK) err('Cannot get status for '+capp+': '+Status.print(stat));
                  if (!cap) err('Invalid capability ('+capp+')');
                  StdInt.std_status(cap,function(_stat,_data) {
                      stat=_stat;
                      data=_data;
                  });
              },
              function () {
                  Io.log(((log+options.verbose)<1)||('finalize std_status '+
                                                      Net.Print.capability(cap)+' ['+
                                                      (data?data.length:0)+']'));
                  if (stat==Status.STD_OK) {
                    if (options.delay > 0  || options.test==0 || options.print) out(data);
                  }
                  else 
                    Io.out(Status.print(stat));
                  if ((options.delay > 0  || options.test==0) && options.monitor) 
                    out(network.router.status());
                  if (options.delay > 0) Sch.Delay(options.delay);
              }
          ]);
          break;
          
      case Command.STD_AGE:
          Io.log(((log+options.verbose)<1)||('+std_age '+Net.Print.capability(cap)));
          schedules=Array.merge(schedules,[
              function () {
                resolve(capp, function (_stat,_cap) {
                  stat=_stat;
                  cap=_cap;
                })
              },
              function () {
                  if (stat!=Status.STD_OK) err('Cannot age '+capp+':'+Status.print(stat));
                  if (!cap) err('Invalid capability ('+capp+')');
                  StdInt.std_age(cap,function(_stat) {
                      stat=_stat;
                  });
              },
              function () {
                  if (options.delay > 0 || options.test==0) 
                    out(Status.print(stat));
                  if ((options.delay > 0  || options.test==0) && options.monitor) 
                    out(network.router.status());
                  if (options.delay > 0) Sch.Delay(options.delay);
              }
          ]);
          break;

      case Command.DNS_CREATE:
          Io.log(((log+options.verbose)<1)||('+dns_create '+capp));
          schedules=Array.merge(schedules,[
              function () {
                var path=Comp.filename.dirname(capp);
                console.log(path)
                if (!env.rootdir) err('No DNS root specified for '+capp);
                DnsInt.dns_lookup(env.rootdir,path,function (_stat,_cs) {
                  stat=_stat;
                  if (_stat==Status.STD_OK) cap = CsInt.cs_to_cap(_cs);                     
                })
              },
              function () {
                  if (stat!=Status.STD_OK) err('Cannot create '+capp+': '+Status.print(stat));
                  if (!cap) err('Invalid capability ('+capp+')');
                  row=Comp.filename.basename(capp);
                  if (row=='') row='/';
                  Io.log(((log+options.verbose)<1)||('exec dns_create I. lookup '+row+' in '+Net.Print.capability(cap)));
                  cs=CsInt.cs_singleton(cap);
                  DnsInt.dns_lookup(cs,row,function(_stat,_cs) {
                      stat=_stat;
                  });
              },
              function () {
                Io.log(((log+options.verbose)<1)||('check dns_create '+
                                                      Cs.Print.capset(cs)));
                if (stat==Status.STD_OK && env.overwrite) {
                  DnsInt.dns_delete(cs,row,function(_stat) {
                      stat=_stat;
                      if (stat==Status.STD_OK) stat=Status.STD_NOTFOUND;
                  });
                } else if (stat!=Status.STD_NOTFOUND) 
                  err('Cannot create '+capp+': '+
                      (stat==Status.STD_OK?'exists already':Status.print(stat)));
              },
              function () {
                Io.log(((log+options.verbose)<1)||('create directory dns_create '+
                                                      Cs.Print.capset(cs)));
                if (stat==Status.STD_NOTFOUND) {
                  DnsInt.dns_create(cs,Dns.DNS_DEFAULT_COLS,function(_stat,_cs) {
                      stat=_stat;
                      csnew=_cs;
                      if (stat==Status.STD_OK) {
                        DnsInt.dns_append(cs,row,csnew,Dns.DNS_DEFAULT_RIGHTS,function(_stat,_cs) {
                            stat=_stat;
                        });                        
                      }
                  });
                } 
              },
              function () {
                  Io.log(((log+options.verbose)<1)||('finalize dns_create '+
                                                      Cs.Print.capset(csnew)));
                  out('create '+capp+': '+Status.print(stat));
                  if (options.delay>0) Sch.Delay(options.delay);
              },
              function () {

              }
          ]);
          break;

      case Command.DNS_DELETE:
          Io.log(((log+options.verbose)<1)||('+dns_delete '+capp));
          schedules=Array.merge(schedules,[
              function () {
                var path=Comp.filename.dirname(capp);
                if (!env.rootdir) err('No DNS root specified for '+capp);
                resolve(path, function (_stat,_cap) {
                  stat=_stat;
                  cap=_cap;                      
                });
              },
              function () {
                  if (stat!=Status.STD_OK) err('Cannot delete '+capp+': '+Status.print(stat));
                  if (!cap) err('Invalid capability ('+capp+')');
                  row=Comp.filename.basename(capp);
                  if (row=='') row='/';
                  Io.log(((log+options.verbose)<1)||('exec dns_delete I. lookup '+row+' in '+Net.Print.capability(cap)));
                  cs=CsInt.cs_singleton(cap);
                  DnsInt.dns_lookup(cs,row,function(_stat,_cs) {
                      stat=_stat;
                  });
              },
              function () {
                Io.log(((log+options.verbose)<1)||('check dns_delete '+
                                                      Cs.Print.capset(cs)));
                if (stat==Status.STD_OK) {
                  DnsInt.dns_delete(cs,row,function(_stat) {
                      stat=_stat;
                  });
                } else 
                  err('Cannot delete '+capp+': '+
                      (stat==Status.STD_NOTFOUND?'exists not':Status.print(stat)));
              },
              function () {
                  Io.log(((log+options.verbose)<1)||('finalize dns_delete '+
                                                      CsInt.Print.capset(csnew)));
                  out('delete '+capp+': '+Status.print(stat));
                  if (options.delay>0) Sch.Delay(options.delay);
              },
              function () {

              }
          ]);
          break;

      default:
          err('unsupported')
  }
}
for (var i in options.caps) {
  action (options.caps[i]);
}
var hostsrv;

if (options.verbose) out('My host port: '+Net.Print.port(options.pubhostport));
if (options.servmode) {
 hostsrv = HostSrv.HostServer(scheduler,
                              network.rpc,
                              options,
                              'STD.'+options.hostname,
                              options.env);
} else if (options.test==0)
    Sch.ScheduleBlock(Array.merge(schedules,
        [
            function () {
              network.stop();
              Sch.Delay(10);
            },
            function () {
                process.exit(0)
            }
        ]));
else {
    var start,stop;
    Io.out('Test loops: '+options.test);
    Sch.ScheduleBlock([
        function() {
            stop = Perv.mtime();
            if (options.monitor) Io.out(network.router.status());
            if (options.delay==0) {
                out('Test result: ' + ((options.test / (stop - start) * 1000) | 0) + ' ops/sec (' + 
                                      (((stop - start) * 1000 / options.test) | 0) + ' microsec/op)');
            }
        },
        function () {
              network.stop();
              Sch.Delay(10);
        },
        function () {
            process.exit(0);
        }]);
    Sch.ScheduleLoop(function(index) {return index<options.test;},schedules);
    Sch.ScheduleBlock([function() {start=Perv.mtime();}]);
}
// Start up the network ..
network.init(network.start);
scheduler.Run();

