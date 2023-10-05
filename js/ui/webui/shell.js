var Shells=[];

Shell = {
  clear : function (index) {
    Shells[index].controller.clearScreen()
  },
  create : function (options) {
    var shell,
        i=Shell.shellIndex++,
        id='shell'+i;
       
    var cell=$('<div/>',{
      class:'',
      style:'height:100%;',
    });
      var console=$('<div/>',{
        class:'console',
      }).appendTo(cell);
    options=options||{};
    shell={cell:cell,console:console,id:id,index:i};
    Shells[i]=shell;
    shell.index=i;
    shell.id=id;
    var env = {
      // inject interactive code (html), e.g., buttons, forms, .., wait for completion (callback is returned). 
      ask : function (html) {
        controller.message(html,'jquery-console-message-type',true);
        var state=0;
        setTimeout(function () { if (state==0) controller.disable(); state=1; },1);
        return function (reply) {
          state=2;
          controller.enable();
          env.print(reply);
        }
      },
      clear: function () { controller.clearScreen() },
      exit: function() { Shell.exit(i) },
      error: function () {
        var msg=Array.prototype.slice.call(arguments);
        function unwrap(str) {
          if (str[0]=='"'||str[0]=="'") return str.slice(1,str.length-1);
          return str;
        }
        if (msg.length==1) msg=msg[0];
        else if (msg.length==0) msg='undefined';
        else {
          msg=msg.map(inspect).map(unwrap).join(' ');
        }
        if (msg==undefined) msg='undefined';
        if (typeof(msg) == 'object') {
          msg=inspect(msg);
        }
        msg=String(msg);
        controller.report(msg,'jquery-console-message-error');
      },
      print: function () {
        var msg=Array.prototype.slice.call(arguments);
        function unwrap(str) {
          if (str[0]=='"'||str[0]=="'") return str.slice(1,str.length-1);
          return str;
        }
        if (msg.length==1) msg=msg[0];
        else if (msg.length==0) msg='undefined';
        else {
          msg=msg.map(inspect).map(unwrap).join(' ');
        }
        if (msg==undefined) msg='undefined';
        if (typeof(msg) == 'object') {
          msg=inspect(msg);
        }
        msg=String(msg);
        var isHtml = msg[0]=='<' && msg[1]!='B' && msg[msg.length-1]=='>';
        controller.report(msg.toString(),'jquery-console-message-value',isHtml);
        setTimeout(function () { $('div[view_id="ShellWinLog'+i+'"]').scrollTop(1000000) },1);
      },
      printf : function () {
        return env.print(sprintf.apply(this,arguments));
      },
      refresh : function () {
        // Terminal.refresh(id);
      },
      time:Date.now,
    };
    if (!options.run) {
      shell.run=function (line,env) {
        env.print(line);
        return 1;
      }
    } else shell.run=options.run;
    shell.env=env;
    var controller = shell.console.console({
          promptLabel: '> ',
          commandValidate:function(line) {
            if (line == "") return false;
            else return true;
          },
          commandHandle:function(line) {
              if (!shell.run) return [{msg:"No interpreter installed!",className:'jquery-console-message-error'}];
              var res = shell.run(line, env);
              setTimeout(function () { $('div[view_id="ShellWinLog'+i+'"]').scrollTop(1000000) },1);
              if (line[line.length-1]==';' || res===undefined)
                return [{msg:'',className:'jquery-console-message-type'}];
              else
                return [{msg:inspect(res),className:'jquery-console-message-type'}];
          },
          completeHandle : function (text) {
            console.log(text);
            return []
          },
          scrollHandle: function () {
            shell.console.prop({ scrollTop: shell.console.prop("scrollHeight") });
          },
          autofocus:true,
          animateScroll:true,
          promptHistory:true,
          echo:false,
       });
    shell.controller=controller;
    Shells[i]=shell;
    return shell;
  },
  default : function (options) {
    options=options||{}
    if (options.editor===true) {
      // Script editor attached to shell
      options.buttons=options.buttons||{}
      options.buttons['edit:edit:Script Editor'] = function () {
        var editor = Editor.default({
          label:options.label,
          mode:'javascript',
          x:options.x,
          y:options.y,
          hide:false,
          buttons : {
            'run:play:Run Code' : function () {
              var code = editor.editor.get();
              shell.run(code);
            },
          }
        })
      }
    }
    var shell = Shell.shell({
      label   : options.label||'Shell',
      run     : options.run,
      buttons : options.buttons,
      collapse : options.collapse,
      hide    : options.hide,
      close   : options.close,
      x       : options.x,
      y       : options.y,
    });
    if (options.actions) {
      options.actions.widget(shell);
      shell.on('close',options.actions.close); 
    }
    return shell;
  },
  exit : function (id) {
    id=String(id).replace('shell','');
    if (!Shells[id]) return;
    delete Shells[id];
  }, 
  shellIndex:0,
  shell: function (options) {
    var shell = Shell.create(options),
        id    = shell.index,
        label = options.label||('#'+id);
    options=options||{}
    options.collapsed=options.collapsed||false;

    function collapse(mini) {
      var container = $('[view_id=ShellWin'+id+']'),
          head = container.find('.webix_win_head');
      if (mini && options.collapsed) {
        return {width:head.width(),height:head.height()}
      }
      options.collapsed=!options.collapsed;
      if (options.collapsed) {
        options._height=container.height();
        container.height(head.height());
      } else container.height(options._height);
      return options.collapsed?{width:head.width(),height:head.height()}:
                               {width:container.width(),height:container.height()};
    }
    function createButtons (buts) {
      var buttons=[];
      for(var label in buts) {
        // id:icon:tooltip
        var tokens = label.split(':'),
            icon = tokens[1]||'?',
            tooltip = tokens[2]||'?',
            handler = buts[label];
        buttons.push(
          { view:"button", type:"icon", icon:icon, tooltip:tooltip, width:30, click:handler}
        )
      }
      return buttons;
    }
    var toolbar = [
             { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
               shell.env.clear();
             }},
             { view:"button", type:"icon", icon:"repeat", tooltip:'Update', width:30, click:function () {
             }}
             ].concat(options.buttons?createButtons(options.buttons):[]).concat([             
             { view:"button", type:"icon", icon:"arrow-circle-down", tooltip:'Scroll Auto', width:30, click:function () {
                     UI('ShellWinLog'+id).scrollAuto=!UI('ShellWinLog'+id).scrollAuto;
                     if (UI('ShellWinLog'+id).scrollAuto) this.define('icon','arrow-circle-down')
                     else this.define('icon','dot-circle-o');
                     this.refresh();
                   }},
             { view:"label", label:label, id:'ShellWinLabel'+id, align:'right'},
             { view:"button", type:"icon", icon:"caret-down", tooltip:'Collapse Shell', width:30, click:function () {
               if (options.collapse!=false) collapse()
             }},
             { view:"button", type:"icon", icon:"windows", tooltip:'Hide Shell', width:30, click:function () {
               if (options.hide!==false)  window.hide();
             }},
            ])
    if (options.close!==false) toolbar.push( { view:"button", type:"icon", icon:"close", tooltip:'Kill', width:30, click:function () {
              window.close();
              Shell.exit(id);
              if (shell.handlers.close) shell.handlers.close();
             }});
    var window = webix.ui({
      id:'ShellWin'+id,
	    view:"window",
	    height:350,
	    width:600,
	    left:options.x||250, top:options.y||250,
	    move:true,
	    resize: true,
        toFront:true,
        css:'red_toolbar',
        head: {
            view:"toolbar",
            cols:toolbar
        },
	    body:{
            id : 'ShellWinLog'+id,
            view : 'scrollview',
            scroll : 'y',
            body : {
               id:'ShellWinLogText'+id,
               rows : [
                  {template:('<div id="ShellWinOutput'+id+'" '+
                             'spellcheck="false" style="width:100%; background: white; font-family:mono;">'), height:"auto", borderless:true},
                ]
            }
	    }
    });
    shell.window=window;
    shell.collapse=collapse;
    window.show();
    setTimeout(function () {
      $('#ShellWinOutput'+id).append(shell.cell);
    },1)
    shell.close = function () {
      window.close();
      Shell.exit(id);    
    }
    shell.handlers=[];
    shell.on = function (ev,handler) {
      var prev = shell.handlers[ev];
      if (prev) shell.handlers[ev]=function (arg) { prev(arg); handler(arg) };
      else shell.handlers[ev]=handler;
    }
    shell.setLabel = function (label) {
      UI('ShellWinLabel'+id).setValue(label)
    }
    return shell;
  },
  version:'1.1.2',
}
UI.Shell=Shell
