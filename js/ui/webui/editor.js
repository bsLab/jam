Editors=[]
Editor = {
  index:0,
  create: function (options) {
    // Direct WEBUI API
    options=options||{}
    options.collapsed=options.collapsed||false;
    options.extension=options.extension||'lua';
    Object.assign(options,{
      file:'untitled',
    })
    function Label() {
      return options.label?options.label:options.file+'.'+options.extension+' #'+id
    }
    function updateMenu() {
      
    }
    var id = Editor.index++,
        label  = Label();
    var editor = {
      id:'editor'+id,
      index:id,
    }
    function collapse(mini) {
      var container = $('[view_id=SourceTextWin'+id+']'),
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
      { view:"button", type:"icon", icon:"folder-open", tooltip:'Open File', width:30, click:function () {
        loadFile(function (text,file) {
          if (text) {
            UI('SourceText'+id).setValue(text)
            if (file) {
              options.file=file
              if (editor.handlers['file']) editor.handlers['file'](file);
              else UI('SourceTextWinLabel'+id).setValue(Label());
            }
          }
        });            
      }},
      { view:"button", type:"icon", icon:"save", tooltip:'Save File', width:30, click:function () {
        var code = UI('SourceText'+id).getValue();
        saveFile(code,options.file,'text/plain',function (file) {
          if (file) {
            options.file=file
            // UI('SourceTextWinLabel'+id).setValue(Label())
            // updateMenu()
            if (editor.handlers['file']) editor.handlers['file'](file);
            else UI('SourceTextWinLabel'+id).setValue(Label());
          }
        });
      }},
      { view:"button", type:"icon", icon:"file", tooltip:'New File', width:30, click:function () {
      }},
      { view:"button", type:"icon", icon:"user", tooltip:'Share Code', width:30, click:function () {
        Clip.share(id);
      }}].concat(options.buttons?createButtons(options.buttons):[]).concat([
      { view:"label", label:label, id:'SourceTextWinLabel'+id,  align:'right'},
      { view:"button", type:"icon", icon:"caret-down", tooltip:'Collapse Editor', width:30, click:function () {
        collapse()
      }},
      { view:"button", type:"icon", icon:"windows", tooltip:'Hide Editor', width:30, click:function () {
        if (options.hide!==false) window.hide();
      }}
      ]);
    if (options.close!==false) toolbar.push({ view:"button", type:"icon", icon:"close", tooltip:'Close Editor', width:30, click:function () {
        Editor.exit(id);
        window.close();
        if (editor.handlers.close) editor.handlers.close();
      }});
    var window = webix.ui({
      id:'SourceTextWin'+id,
	    view:"window",
	    height:350,
	    width:600,
	    left:options.x||250, top:options.y||50,
	    move:true,
	    resize: true,
      toFront:true,
      css:'green_toolbar',
	    head:{
            view:"toolbar",
            cols:toolbar
        },
	    body:{
            id : 'SourceText'+id,
            view: "codemirror-editor",
            style : "color:black",
            mode:options.mode||'plain',   
            attributes : { spellcheck:false, smartIndent:false, indentUnit:2 },
        }
    });
    editor.window=window;
    editor.collapse=collapse;
    window.show();
    editor.editor={
      get : function () { return UI('SourceText'+id).getValue(); },
      set : function (text) { return UI('SourceText'+id).setValue(text); },
    }
    if (options.buttons) {
      // find run button, publish event handler
      for(var p in options.buttons) {
        if (p.indexOf('run')!=-1) {
          editor.editor.run=options.buttons[p];
          break;
        }
      }
    }
    if (options.text) editor.editor.set(options.text);
    if (options.collapsed) { collapse(false) };
    editor.close = function () {
      Editor.exit(id);
      window.close();    
    }
    editor.handlers=[];
    editor.on = function (ev,handler) {
      editor.handlers[ev]=handler;
    }
    editor.options=options;
    editor.setLabel = function (label) {
      UI('SourceTextWinLabel'+id).setValue(label)
    }
    return editor
  },
  default : function (options) {
    options=options||{}
    var editor = Editor.editor({
      label : options.label||'Text Editor',
      mode  : options.mode||'javascript',
      buttons : options.buttons,
      x     : options.x,
      y     : options.y,
      text  : options.text,
      collapsed : options.collapsed,
      hide  : options.hide,
      close : options.close,
      _height: options._height,
    });
    if (options.actions) {
      options.actions.widget(editor);
      editor.on('close',options.actions.close); 
    } 
    return editor;
  },
  editor : function (options) {
    return Editor.create(options);
  },
  exit : function (id) {
    id=String(id).replace('editor','');
    if (!Editors[id]) return;
    delete Editors[id];
  }, 
}
UI.Editor=Editor;
