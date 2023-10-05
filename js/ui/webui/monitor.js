/****************** MONITOR *******************/
/* Monitor logger with single command line */

Monitors = []
Monitor = {
  index : 0,
  create : function (options) {
    var id = Monitor.index++;
    var monitor = {
      cell  : 'MonitorWinOutput'+id,
      input : 'MonitorWinInput'+id,
      id    : 'monitor'+id,
      index : id,
    }
    if (options.run) monitor.run=options.run;
    monitor.add = function (line,cls) {
      if (line[0]!='<') line=line.replace(/&/g,'&amp;')
                                 .replace(/</g,'&lt;')
                                 .replace(/>/g,'&gt;')
                                 .replace(/\n/g,'<br>');
      var cell = $('#MonitorWinOutput'+id);
      var hline = $('<span/>',{
        class:'',
        style:'width:100%;display:inline-block;'+(cls=='error'?'color:red;':cls=='warning'?'color:green;':'color:black;word-break: break-all;font-family: droidsansmonow01 , monospace !important;'),
      });
      hline.html(line);
      hline.appendTo(cell);
      if (UI('MonitorWinLog'+id).scrollAuto) $('div[view_id="MonitorWinLog'+id+'"]').scrollTop(1000000)
    }
    monitor.clear = function () {
      var cell = $('#MonitorWinOutput'+id);
      cell.empty();
    }
    function print() {
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
      monitor.add(msg!=undefined?msg:'undefined')
    }
    function printError() {
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

      monitor.add(msg,'error')
    }
    monitor.env = {
      clear:clear,
      print:print,
      error:printError,
    }
    monitor.print=print;
    monitor.error=printError;
    
    Monitors[id]=monitor;
    // Simple command line with history
    setTimeout(function () {
      var history = [],
          historyIndex = 0,
          command = $('#'+monitor.input),
          prefix = $('<span/>',{style:'font-weight:bold;'}),
          input = $('<input/>',{id:monitor.input+'-input',style:'padding-left:5px; width:80%;border:0px;'});
      prefix.text(' >');
      prefix.appendTo(command)
      input.appendTo(command);
      input.on('keydown',function (ev) {
        switch (ev.keyCode) {
          // Enter
          case 13:
            var line = input.val();
            history.push(line); 
            historyIndex=history.length;
            input.val(''); 
            if (monitor.run) monitor.run(line,print,printError);
            break;
          // ArrowUp
          case 38:
            if (historyIndex>1) {
              input.val(history[historyIndex-1]);
              historyIndex--;
            } else if (historyIndex) input.val(history[historyIndex-1]);
            break;
          // ArrowDown
          case 40:
            if (historyIndex<history.length) {
              historyIndex++;
              input.val(history[historyIndex-1]);
            }
            break;
        }
      }) 
    },50)
    return monitor;
  },
  default : function (options) {
    options=options||{}
    var monitor = Monitor.monitor({
      label : options.label||'Monitor',
      run   : options.run,
      hide  : options.hide,
      close : options.close,
    });
    if (options.actions) {
      options.actions.widget(monitor);
      monitor.on('close',options.actions.close); 
    }
    return monitor;
  },
  exit : function (id) {
    id=String(id).replace('monitor','');
    if (!Monitors[id]) return;
    delete Monitors[id];
  }, 
  monitor : function (options) {
    // WEBUI API
    var monitor = Monitor.create(options),
        id    = monitor.index,
        label  = options.label||('#'+id);


    function collapse(mini) {
      var container = $('[view_id=MonitorWin'+id+']'),
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
    var toolbar = [
              { view:"button", type:"icon", icon:"eraser", tooltip:'Clear', width:30, click:function () {
                monitor.clear()
              }},
              { view:"button", type:"icon", icon:"arrow-circle-down", tooltip:'Scroll Auto', id:'MonitorWinLogFilmBut'+id, width:30, click:function () {
                UI('MonitorWinLog'+id).scrollAuto=!UI('MonitorWinLog'+id).scrollAuto;
                if (UI('MonitorWinLog'+id).scrollAuto) this.define('icon','arrow-circle-down')
                else this.define('icon','dot-circle-o');
                this.refresh();
              }},
              { view:"label", label:label, id:'MonitorWinLabel'+id, align:'right'},
              { view:"button", type:"icon", icon:"caret-down", tooltip:'Collapse Editor', width:30, click:function () {
                collapse()
              }},
              { view:"button", type:"icon", icon:"windows", tooltip:'Hide Edutor', width:30, click:function () {
                if (options.hide!==false) window.hide();
              }},
            ];
    if (options.close!==false) toolbar.push({ view:"button", type:"icon", icon:"close", tooltip:'Kill', width:30, click:function () {
                Monitor.exit(id);
                window.close();
                if (monitor.handlers.close) monitor.handlers.close();
              }});
    var window = webix.ui({
      id:'MonitorWin'+id,
	    view:"window",
	    height:350,
	    width:600,
	    left:350, top:250,
	    move:true,
	    resize: true,
        toFront:true,
        css:'black_toolbar',
        head: {
            view:"toolbar",
            cols: toolbar
        },
	    body: {
              id : 'MonitorWinLog'+id,
              view : 'scrollview',
              scroll : 'y',
              body : {
                 id:'MonitorWinLogText'+id,
                 rows : [
                    {template:('<div id="MonitorWinOutput'+id+'" '+
                               'spellcheck="false" style="width:100%;font-family:mono; padding-bottom: 1em;">'), height:"auto", borderless:true},
                    {template:('<div id="MonitorWinInput'+id+'" '+
                     'spellcheck="false" style="font-family:mono;background-color:#fff; padding:5px; position:absolute; left:0; bottom:0; width:90%;">'), height:"auto", borderless:true},
                  ]
              }
	    }
    });
    UI('MonitorWinLog'+id).scrollAuto=true;
    window.show();
    monitor.window=window;
    monitor.collapse=collapse;
    monitor.close = function () {
      window.close();
      Monitor.exit(id);    
    }
    monitor.setLabel = function (label) {
      UI('MonitorWinLabel'+id).setValue(label);
    }
    monitor.handlers=[];
    monitor.on = function (ev,handler) {
      monitor.handlers[ev]=handler;
    }
    return monitor;
  }
}
UI.Monitor=Monitor;

