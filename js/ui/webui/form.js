
Forms=[];
Form = {
  index : 0,
  // typeof @config={}
  create : function (config,options,callback) {
    var id = Form.index++,
        form = {};
    form.index=id;
    if (typeof options=='function') { callback=options;options={}};
    options=options||{};
    var rows = [];
    function toValue(v) {
      if (v == undefined) return;
      if (typeof v == 'string' ||
          typeof v == 'number' ||
          typeof v == 'boolean') return v.toString();
      if (Utils.isArray(v)) return v.join(',');
      return v.toString();
    }
    function fromValue(key,v,root) {
      if (v == undefined) return;
      var text = UI('formWin'+id+'-'+root+key).getValue();
      if (typeof v == 'string') return text;
      if (typeof v == 'number') return isNaN(Number(text))?text:Number(text);
      if (typeof v == 'boolean') return Number(text)?true:false;
      if (Utils.isArray(v)) return text.split(',');
      return text;
    }
    function createRows(config,root) {
      root=root||'';
      for(var key in config) {
        var entry = config[key];
        if (toValue(entry)==undefined) continue;
        if (!Utils.isArray(entry) && Utils.isObject(entry)) {
          rows.push({ view:"label", label:key, align:'left', css:'webix_primary blue'});
          createRows(entry,key);
        } else {
          if (typeof entry == 'boolean') rows.push({
            view:"checkbox", 
            id:"formWin"+id+"-"+root+key,
            customCheckbox:false, 
            label:key,
            height:'2',
            labelWidth:options.labelWidth||150,
            value:entry?1:0,
            click: function (o) {
              config[key]=Number(UI(o).getValue())?true:false;
            }
          }); else rows.push({ 
            view:"text", 
            id:"formWin"+id+"-"+root+key, 
            label:key, 
            labelWidth:options.labelWidth||150,
            value:toValue(entry),
            css:"webix_primary"
          });  
        }
      }
    }
    createRows(config);
    rows.push({ 
      view:'label'
    })
    function createValues(config,root) {
      root=root||'';
      for(var key in config) {
        var entry = config[key];
        if (toValue(entry)==undefined) continue;
        if (!Utils.isArray(entry) && Utils.isObject(entry)) {
          createValues(entry,key);
        } else {
          config[key]=fromValue(key,entry,root);
        }
      }
    }
    var window = webix.ui({
      id:'formWin'+id,
	    view:"window",
	    width:options.width||300,
	    height:options.height||450,
	    left:options.x||90, top:options.y||90,
	    move:true,
	    resize: true,
        toFront:true,
        head: {
            view:"toolbar",
            cols:[
             { view:"label", label:options.title||options.label||"Form", align:'right'},
             { view:"button", type:"icon", icon:"check-square",  align:'center',  width:30, click: function () {
                createValues(config);
                if (callback) callback(config);
                delete Forms[id];
                window.close();
             }}
            ]
        },
	    body: {
          rows:[
            { view:"form", scroll:true, width:options.width||300, height:options.height||400, elements: rows}
          ]
        }
    });
    window.show();
    form.window=window;
    return form;
  }
}
UI.Form=Form;
