// TODO: SHELL -> Worker VM
function Node(config) {
  var options = {
    cmd : null,
    name : "jam",
    nameopts : {length:8, memorable:true, lowercase:true},
    Nameopts : {length:8, memorable:true, uppercase:true},
    log : { Time: true, Network: false },
    server : true,
    verbose : 1,
  }
  var _shell,shell,worker;
 
  Object.assign(options.log,config.log);

  async function init (shell,callback) {
    _shell=shell;

    console.log(options)
    if (!config.worker) {
      options.output = shellCommands.print;      
      shell = options.shell = SHELL(options);
      options.shell = shell;
      options.cmd   = shell.init().cmd();
      options.name  = options.cmd.name('node');
      if (callback) callback()
    } else {
      // TODO vm.worker; need cmd proxy
      var vm = VM({
        VM:JS.VM,
        verbose:1,
      })
      console.log(vm)
      worker = await vm.worker({
        print:function () {
          var args=arguments,
              msg=Object.keys(args).map(function (index) { return args[index] });
          if (msg.length==1) msg=msg[0]; else msg=msg.map(function (arg) {
            if (typeof arg == 'object') return inspect(arg);
            else return String(arg);
          }).join(' , ');
          if (typeof msg == 'object') msg=inspect(msg);
          msg=(msg==undefined?'undefined':msg);
          msg = msg.toString();
          shellCommands.print(msg);
        },
        error:shellCommands.error,
        Environment : {
          SHELLinit : SHELLinit,
        },
        Init : {
          SHELLinit : function () { SHELLinit() },
        }
      })
      await worker.init()
      await worker.ready()
      var name = await worker.eval(function (options) {
        var cmd;
        function printAgent (msg) {
          emit('print-agent',msg);
        }
        options.output=print;
        options.outputAgent = printAgent;
        shell = SHELL(options);
        shellOptions = options;
        options.portIndex = 0;
        options.ports = [];
        options.shell = shell;
        options.cmd   = cmd = shell.init().cmd();
        options.name  = cmd.name('node');  
        cmd.on('link+',function (arg){
          emit('jam-link+',arg)
        });
        cmd.on('link-',function (arg){
          emit('jam-link-',arg)
        });
        return options.name;
      },options);
      options.name=name;
      options.cmd = {
         compile : function (code) {
          worker.run(function (code) {
            shellOptions.cmd.compile(code)
          },code);        
        },
       connect : function (dir,options) {
          return worker.eval(function (opts) {
            shellOptions.cmd.connect(opts.dir,opts.options);
          },{dir:dir});
        },
        connected : function (dir) {
          return worker.eval(function (dir) { return shellOptions.cmd.connected(dir)},dir);
        },
        config : function (opts) {
          worker.eval(function (config) {
            shellOptions.cmd.config(config)
          },opts);        
        },
        disconnect : function (dir,options) {
          return worker.eval(function (opts) {
            shellOptions.cmd.disconnect(opts.dir,opts.options)
          },{dir:dir,options:options})   
        },
        exec : function (code) {
          worker.run(function (code) {
            shellOptions.cmd.exec(code)
          },code);
        },
        info : function (what,arg) {
          return worker.eval(function (opts) {
            var what = opts.what, arg=opts.arg;
            if (what!='agent-data') 
              return shellOptions.cmd.info(what,arg);
            else {
              var agent = shellOptions.cmd.info(what,arg);
              var ao =  {
                id:agent
              }
              for (var p in agent) {
                switch (p) {
                  case 'act':
                  case 'trans':
                  case 'on':
                    ao[p]={}
                    for(var f in agent[p]) ao[p][f]='function';
                    break;
                  case 'self': 
                    break;
                  default :
                    if (typeof agent[p] == 'function') ao[p]='function';
                    else ao[p]=agent[p];
                }
              }
              return ao
            }
          },{what:what,arg:arg})        
        },
        kill : function (agent) {
          return worker.eval(function (agent) {
            return shellOptions.cmd.kill(agent)
          },agent)                
        },
        marked : SHELL.marked,
        on : function (ev,handler) {
          options.cmd.__handlers[ev]=handler;
        },
        port : async function (dir,options) {
          var portid = await worker.eval(function (opts) {
            var id = shellOptions.portIndex++;
            var port = shellOptions.cmd.port(opts.dir,opts.options);
            shellOptions.ports[id]=port;
            return id;
          },{dir:dir,options:options})   
          return {
            amp : {
              config : function (opts) {
                opts.id=portid;
                worker.eval(function (opts) {
                  shellOptions.ports[opts.id].amp.config(opts);
                },opts);
              }
            }
          }
        },
        __handlers:[],
        stats : function (what) {
          return worker.eval(function (what) {
            return shellOptions.cmd.stats(what)
          },what)
        },
        worker:worker,
        versions : function () {
          return worker.eval(function () { return shellOptions.cmd.versions()},0);
        },
      }
      options.shell = {
        env : {
          compile : function (code) {
            return worker.eval(function (code) {
              return shell.env.compile(code)
            },code);                
          },
          create : function (ac,args,level) {
            return worker.eval(function (opts) {
              return shell.env.create(opts.ac,opts.args,opts.level);
            },{
              ac:ac,
              args:args,
              level:level
            })
          },
          start : function () {
            worker.run(function () {
              shell.env.start();
            })
          },
          stop : function () {
            worker.run(function () {
              shell.env.stop();
            })
          }
        },
        options : {
        
        }
      }
      worker.on('jam-link+', function (arg) {
        if (options.cmd.__handlers['link+']) options.cmd.__handlers['link+'](arg);
      })
      worker.on('jam-link-', function (arg) {
        if (options.cmd.__handlers['link-']) options.cmd.__handlers['link-'](arg);
      })
      worker.on('print-agent', function (msg) {
        if (options.shell.options.outputAgent) options.shell.options.outputAgent(msg);
        else shellCommands.print(msg);
      })
      if (callback) callback()
    }
  }
  function ask (line) {
    return options.cmd.exec(question)
  }
  
  function println(s, type) {
    if (/error/.test(type||'')) _shell.env.error(s);
    else {
      var hastime = s.match(/^[0-9][0-9]:[0-9][0-9]:[0-9][0-9](.+)/);
      if (hastime && options.log.Time) s=hastime[1];
      s='<span style="color:blue; word-break: break-all;">'+s.replace(/&/g,'&amp;')
                  .replace(/</g,'&lt;')
                  .replace(/>/g,'&gt;')
                  .replace(/\n/g,'<br>')
                  .replace(/ /g,'&nbsp;')+'</span>';
      _shell.env.print('<div class="jquery-console-message">'+
                       (options.log.Time?'<span style="color:green">'+SHELL.Io.Time()+'</span> ':'')+
                       s+
                       '</div>');
    }
  }
  function run(question) {
    options.cmd.exec(question)
  }
  function setup() {
  
  }
  function start() {
  
  }
  function stop() {
    if (worker) {
      shellCommands.print('Closing worker and JAM instance..')
      worker.kill();
    } 
  }
  var shellCommands = {
    clear: function () {
      _shell.env.clear()
    },
    error: function (s) {
      println(s, "error");
    },
    print: function (s) {
      println(s, "print");
    },
    reset: function () {

    },
  }
  return {
    ask:ask,
    commands: shellCommands,
    init:init,
    options:options,
    question:run,
    setup:setup,
    start:start,
    stop:stop
  }
}
