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
 **    $CREATED:     23.9.2016
 **    $VERSION:     1.1.17
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
  afs : undefined,
  bip:'localhost',
  bport:3001,
  broker: true,
  caps:[],
  cmd:[Command.STD_TOUCH,Command.STD_AGE],
  default:false,
  delay:0,
  dip : 'localhost',
  dns : undefined,
  dports : [],
  echo:false,
  env:{},
  hostname:Io.hostname(),
  hostport:undefined,
  hostsrv:false,
  http:false,
  interval:1000,
  keepalive:true,
  links:[],
  maxlive:8,
  monitor:0,
  myip:'localhost',
  print : false,
  root:'/',
  run:1,
  servmode:false,
  tcpnet:1,
  verbose:0
};

var help=false;
var shift='';

var env={};
options.env=env;
var argv = Io.getargs();

var out = function (s) {Io.out('[GC] '+s)};

function err(msg) {
    out('Error: gc '+Comp.array.tail(argv,2)+' => '+msg);
    Io.exit();
}


if (typeof Shell == 'object') Io.set_args(Shell.args);
Args.parse(argv, [
    [['-h','-help'],0,function() {help=true}],
    [['-v','-verbose'],0,function() {options.verbose++;options.echo=true}],
    [['-d','-default'],0,function() {options.default=true;}],
    ['-monitor',0,function() {options.monitor++;}],
    ['-print',0,function() {options.print=true;}],
    ['-delay',1,function(val) {options.delay=Perv.int_of_string(val);}],
    ['-interval',1,function(val) {options.interval=Perv.int_of_string(val);}],
    ['-run',1,function(val) {options.run=Perv.int_of_string(val);}],
    ['-dns',1,function(val) {options.dns=val;}],
    ['-afs',1,function(val) {options.afs=val;}],
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
    ['-D',1,function(val){options.dports.push(Perv.int_of_string(val))}],
    ['-L',2,function(val1,val2){options.links.push([Perv.int_of_string(val1),getip(val2),getipport(val2)])}],
    ['-nokeepalive',0,function(val){options.keepalive=false;}],
    ['-T',0,function(val){options.tcpnet=1;options.http=false;}],
    ['-T2',0,function(val){options.tcpnet=2;options.http=false;}],
    ['-H',0,function(val){options.http=true;options.tcpnet=0;}],
    ['-fcap',1,function(val){options.fcap=val}],
    [function(val){
      options.dns=val;
    }]
],2);


if (help) {
    Io.out('usage: '+argv[0]+' [<DNS server>]'+argv[1]);
    Io.out('  [-H -T -T2]  Enable connection service');
    Io.out('    T: TCPIP, 1-ch H:HTTP T2: TCPIP, 2-ch');
    Io.out('    H: bport, T: bport+100');
    Io.out('    (Default: -T)');
    Io.out('  [-D <port>] UDP Server Port');
    Io.out('  [-L <src port> <UDP dst [address:]port] UDP P2P Connection');
    Io.out('  [-nokeepalive] Establish a new conncetion for each message.');
    Io.out('  [-broker <ip[:ipport]>]  Broker URL (Default: '+options.bip+': HTTP '+options.bport+' TCPNET '+(options.bport+100)+')');
    Io.out('  [-dip <VLC UDP server IP>] (Default: '+options.dip+')');
    Io.out('  [-help -h -v -verbose -monitor]');
    Io.out('  [-delay <millisec>] Start-up delay');
    Io.out('  [-interval <millisec>] Loop interval');
    Io.out('  [-root <path>]  DNS Root path (default '+options.root+')');
    Io.out('  [-afs <capfile|cap>]  AFS server capability');
    Io.out('  [-dns <capfile|cap>]  DNS server capability');
    Io.out('  [-run <number of service loop runs>] 0:infinite loop');
    Io.out('  [-default -d] Ask broker server for default DNS');
    return;
}


options.privhostport = Net.uniqport();
options.pubhostport = Net.prv2pub(options.privhostport);

if (options.echo) out('['+Net.Print.port(options.pubhostport)+'] '+argv[1]+' '+
                      (options.cmd[0]?Command.print(options.cmd[0]):'')+
                      (options.cmd[1]?' '+Command.print(options.cmd[1]):'')+ ' ' + options.caps);

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

function action () {
  var aged,
      cap,
      cs,
      csnew,
      capp,
      dir,
      error,
      failed0,
      path,
      remain,
      row,
      rowi,
      rows,
      stat=Status.STD_UNKNOWN,
      touched=0,
      trash=[],
      n; 

  function statcb(_stat) {stat=_stat};
  function resolve (name,cb) {
    var cap,cp;
    if (env.rootdir) {
      /*
      ** Look-up from DNS ...
      */
      DnsInt.dns_lookup(env.rootdir,name,function (_stat,_cs) {
        if (_stat==Status.STD_OK) cb(_stat,CsInt.cs_to_cap(_cs));
        else cb(_stat);
      })
    } else if (Io.exists(name)) {
        /*
        ** It is a capability file
         */
        cap = Net.cap_of_file(name);
        if (cap) {
          env.rootdir=options.dns=CsInt.cs_singleton(cap);
          cb(Status.STD_OK,cap);
        } else {
          err('Invalid capability file: '+name);
        }
        
    } else {
        /*
        ** Is it a capability string?
         */
        cp=Net.Parse.capability(name,0);       
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
        env.rootdir=options.dns=CsInt.cs_singleton(cap);
        cb(Status.STD_OK,cap);
    }
  }
  path=options.root;
  
  function scan (rootcs,path) {    
    var stat=Status.STD_UNKNOWN,
        remain,dir,cs,msg,info,
        entry;
    function statcb(_stat,_msg) {stat=_stat;msg=_msg;};
    function err(msg) {out(msg); failed++; error=Status.STD_NOTNOW;};
    B([
      function () {
        if (options.verbose) out('Scanning '+path+', root='+Cs.Print.capset(rootcs));
        DnsInt.dns_list(rootcs,function (_stat,_dir) {
            stat=_stat; dir=_dir;
        });
      },
      function () {
        rowi=0;
        if (stat==Status.STD_OK) 
            L(
              function (index) {rowi=index; return index<dir.di_rows.length},
              [
                function () {
                  // console.log(rows[index].name);
                  // console.log(dir.di_rows[rowi])
                  error=false;
                  entry=path+(path=='/'?'':'/')+
                        dir.di_rows[rowi].de_name;
                  DnsInt.dns_lookup(rootcs,dir.di_rows[rowi].de_name,function (_stat,_cs){
                    stat=_stat;
                    cs=_cs;
                  })
                },
                function () {
                  if (stat==Status.STD_OK) {
                    // get info 
                    cap=CsInt.cs_to_cap(cs);
                    if (cap) StdInt.std_info(cap,statcb);
                  } else if (!error) {
                    err('DNS lookup of '+entry+' failed: '+Status.print(stat)); 
                  }
                  
                },
                function () {
                  if (stat==Status.RPC_FAILURE) {
                    if (trash[entry]==undefined) trash[entry]=options.maxlive;
                    else {
                      trash[entry]--;
                      if (trash[entry]==0) {
                        out('Deleting '+entry);
                        DnsInt.dns_delete(rootcs,dir.di_rows[rowi].de_name,function (stat) {
                          if (stat!=Status.STD_OK)
                            err(entry+' not deleted: '+Status.print(stat));
                        });
                      }
                    }                  
                  }
                  else if (stat==Status.STD_OK) {
                    // touch it
                    info=msg;
                    if (cap) StdInt.std_touch(cap,statcb);
                    if (trash[entry]!=undefined) trash[entry]=undefined;
                  } else if (!error)
                    err(entry+' not responding: '+Status.print(stat)); 
                },
                function () {                  
                  if (stat==Status.STD_OK) {
                    touched++;
                    if (options.verbose) out('Touched '+entry);
                    if (info && Comp.string.startsWith(info,'/D')) 
                      scan(cs,entry);
                  } else if (!error)
                    err('Touching of '+entry+' failed: '+Status.print(stat));
                  
                }
              ],
              [
                function () {}
              ],
              function (stat) {console.log(stat)}
            );  
        else
          out('DNS list of '+path+' failed: '+Status.print(stat));
          
      }    
    ]);
  }
  L(
    function(index) {n=index; return options.run==0?true:index<options.run;},
    [
      function () {
        if (options.verbose) out('Run '+n+' ..');
        touched=0;
        failed=0;
        error=Status.STD_OK;
      },
      function () {
        stat=Status.STD_NOTNOW;
        cap=CsInt.cs_to_cap(env.rootdir);
        if (cap) StdInt.std_touch(cap,statcb);
      },
      function () {
        if (stat==Status.STD_OK) scan(env.rootdir,path);
        else error=stat;
      },
      function () {
        if (error) return;
        // age it        
        if (options.verbose) out('  [touched='+touched+', failed='+failed+']');
        if (options.verbose) out('Aging (I)  '+Net.Print.capability(options.dns));
        if (failed==0) {
          StdInt.std_age(options.dns,statcb); 
          aged++;
        } else {
          stat=Status.STD_NOTNOW;
          error=stat;
        }
      },
      function () {
        if (error) return;
        error=stat;
        if (stat!=Status.STD_OK) {
          out('Aging (I) failed: '+Status.print(stat));
        }
      },
      function () {
        if (error) return;
        if (stat==Status.STD_OK && options.afs) {
          if (options.verbose) out('Aging (II) '+Net.Print.capability(options.afs));
          StdInt.std_age(options.afs,statcb); 
        }
      },
      function () {
        if (!error && options.afs && stat!=Status.STD_OK) {
          out('Aging (II) failed: '+Status.print(stat));
          error=stat;
        }
        // if (stat!=Status.STD_OK || error) throw stat;
        if (error) out('Run '+n+' failed: '+Status.print(error));
        Sch.Delay(options.interval)
      }
    ],
    [
      function () {
        out('Exiting.');
        process.exit(0)
      }
    ],
    function (stat) {
      out('Failed: '+Status.print(stat));
    }  
  );
  
  
  B([
    function () {
      if (options.delay) Delay(options.delay);
    },
    function () {
      out('Starting ..');
      resolve(options.dns||options.root,function (_stat,cap) {
        if (_stat==Status.STD_OK) {
          out('Using DNS cap '+Net.Print.capability(cap));
          options.dns=cap;
        } else { 
          out('No DNS resolved!: '+Status.print(_stat));
        }
        stat=_stat;          
      });
    },
    function () {
      if (stat!=Status.STD_OK) throw stat;
      if (options.afs) resolve(options.afs,function (stat,cap) {
        if (stat==Status.STD_OK) {
          out('Using AFS cap '+Net.Print.capability(cap));
          options.afs=cap;
        }
      });
      else if (options.dns) DnsInt.dns_getdefafs(env.rootdir,function (stat,cap) {
        if (stat==Status.STD_OK) {
          out('Using default AFS cap '+Net.Print.capability(cap));
          options.afs=cap;
        }        
      });
    },
  ]);
}

action ();

var hostsrv;
if (options.hostsrv) 
  hostsrv = HostSrv.HostServer(scheduler,
                               network.rpc,
                               options,
                               'GC.'+options.hostname,
                               options.env);


var interrupt=0;

process.on('SIGINT', function () {
  out('Got SIGINT ..');
  interrupt++;
  if (interrupt>1) process.exit(2);
});


if (options.verbose) out('My host port: '+Net.Print.port(options.pubhostport));


// Start up the network ..
network.init(network.start);

scheduler.Run();
