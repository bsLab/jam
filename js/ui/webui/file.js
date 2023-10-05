FileDialog = {
  locked : false,
  lock : function () {
    if (FileDialog.locked) return false;
    FileDialog.locked=true;
    return true;
  },
  unlock : function () { FileDialog.locked=false },
  refreshFileDialog : function (handle) {
    var lastselect;
    console.log('refreshFileDialog',handle.dir);
    handle.list(handle.dir, function (res) {
      if (Utils.isError(res)) {
        return handle.onerror(res);
      }
      var input=$('#fileDialogListFileName');
      if (res && res.status==0) {
        var list = $('#fileDialogList');
        list.empty();
        var entries=res.dirs;
        if (handle.mode=='Open' || handle.mode=='Load') entries=entries.concat(res.files);
        $('#fileDialogListLabel').html(handle.dir);
        entries.forEach(function (entry) {
          if (entry.name[0]=='.' && entry.name!='..') return;
          var listentry = $('<p/>',{
            class:'nav-entry '+(entry.dir?'nav-entry-directory':'nav-entry-file'),
            style:'cursor: pointer'
          }).append('<span>'+entry.name+'</span>').appendTo(list);
          if (entry.dir)
            listentry.bind('click',function () {
              if (entry.name=='..')
                handle.dir = handle.dir.replace(/(\/[^\/]+)$/,'');
              else
                handle.dir += ((handle.dir=='/'?'':'/')+entry.name);
              handle.dir=handle.dir||'/'; 
              handle.selected=entry.name;
              FileDialog.refreshFileDialog(handle);
            });
          else {
            listentry.bind('click',function () {
              if (lastselect) $(lastselect).removeClass('nav-selected');
              $(listentry).addClass('nav-selected');
              lastselect=listentry;
              handle.selected=entry.name;
              input.val(entry.name);
            });
          }
          return entry;
        })
      }
    })  
  },
  dialog : function (title, mode, dir, filename, fs, callback) {
    if (!FileDialog.lock()) return;
    var handle={selected:filename, dir:dir, mode:mode, list:fs.list};
    var html='<div><b>'+title+
             '</b><br><hr><div style="word-wrap: break-word;"id="fileDialogListLabel"></div>';
    html += '<input id="fileDialogListFileName" style="width:97%; height-max:400px; margin-top:5px;" value="'+filename+'">';
    html += '<div id="fileDialogList">';
    html += '</div></div>';
    var input,options
    handle.onerror=function (err) {
      // Fallback: Browser file dialog
      console.log('dialog',err);
      options.close();
      FileDialog.unlock();
      if (callback) callback(null,null,err);
    };
    setTimeout(function () { FileDialog.refreshFileDialog(handle); input=$('#fileDialogListFileName'); },1);
    popup.custom(options={content:html,default_btns:{ok:mode}},function (reply) {
      FileDialog.unlock();
      if (reply.proceed) {
        filename=input.val();
        if (callback) callback(handle.dir,filename);
      }
    });
  },
}


if (!Config.wex) Config.wex={http:'http://localhost:11111' };
if (!Config.workdir) Config.workdir='/';

// FS APi using the WEX server
FS = {
  list : async function (dir,cb) {
    var result;
    function handler (response) {
      if (Utils.isError(response)) {
        if (cb) cb(response);
        return;        
      }
      if (!Utils.isObject(response) || response.status!=0) {
        result=response;
        if (cb) cb(result);
        return;
      }
      var dirs=response.reply.filter(function (entry) { return entry.dir })
                             .sort(function (a,b) { return a.name<b.name?-1:1 }),
          files=response.reply.filter(function (entry) { return !entry.dir })
                              .sort(function (a,b) { return a.name<b.name?-1:1 });
      result = {dirs:dirs,files:files,status:response.status};
      if (cb) cb(result);
    }
    {
      if (cb) {
        Utils.POST(FS.url,{
          command:  'list',
          dir:  dir,
        },handler,false);
      } else {
        return new Promise (function (resolve,reject) {
          cb=resolve;
          Utils.POST(FS.url,{
            command:  'list',
            dir:  dir,
          },handler,false);      
        })
      }
    }
    return result;
  },
  load : async function(dir,file,mimetype,cb) { 
    var result;
    if (typeof mimetype == 'function') { cb=mimetype; mimetype='text' };
    if (mimetype != 'binary') mimetype='text';
    function handler(response) {
      if (Utils.isError(response)) {
        if (cb) cb(response);
        return;        
      }
      if (!Utils.isObject(response) || response.status!=0) {
        result=response;
        if (cb) cb(result);
        return;
      }
      result=response;
      if (mimetype=='binary' && typeof result.reply=='string') result.reply=Buffer.from(result.reply,'binary');
      if (cb) cb(result);          
    } 
    {
      if (cb) Utils.POST(FS.url,{
        command:  'load',
        dir:  dir,
        file: file,
        mimetype : mimetype,
      },handler,false);
      else return new Promise (function (resolve,reject) {
        cb=resolve;
        Utils.POST(FS.url,{
          command:  'load',
          dir:  dir,
          file: file,
          mimetype : mimetype,
        },handler,false);      
      })
    }
    return result;
  },
  save : async function(dir,file,data,mimetype,cb) { 
    var result;
    if (typeof mimetype == 'function') { cb=mimetype; mimetype='text' };
    if (mimetype != 'binary') mimetype='text';
    function handler(response) {
      if (Utils.isError(response)) {
        if (cb) cb(response);
        return;        
      }
      result=response;
      if (cb) cb(result);          
    }
    // console.log(data.length);
    {
      if (cb) Utils.POST(FS.url,{
        command:  'save',
        dir   : dir,
        file  : file,
        data  : data,
        mimetype : mimetype||'text',
      },handler,false);
      else return new Promise (function (resolve,reject) {
        cb=resolve;
        Utils.POST(FS.url,{
          command:  'save',
          dir   : dir,
          file  : file,
          data  : data,
          mimetype : mimetype,
        },handler,false)
      })
    }
    return result;
  },
  shell : async function (exec,dir,cb) {
    var result;
    function handler(response) {
      result=response;
      if (cb) cb(result);
    }    
    {
      if (cb) Utils.POST(FS.url,{
          command:  'shell',
          exec:  exec,
          dir:   FS.workdir,
      },handler,false);
      else return new Promise (function (resolve,reject) {
        cb=resolve;
        Utils.POST(FS.url,{
          command:  'shell',
          exec:  exec,
          dir:   FS.workdir,
        },handler,false);
      })
    }
    return result;
  },
  
  url : Config.wex.url||Config.wex.http,
  workdir : Config.workdir||'/',
  workdirs : [],

  // GUI API
  API : {     
    loadFile: function loadFile(mimetype,callback,workdirCustom) {
      if (typeof callback == 'string') { workdirCustom=callback; callback=undefined; }
      var api = FS, workdir=(workdirCustom?FS.workdirs[workdirCustom]||FS.workdir1:FS.workdir1)||FS.workdir;
      FileDialog.dialog('Open','Open',
        workdir,'',api,function (dir,filename,err) {
        if (err) {
          console.log('FS.loadFile',err);
          if (callback) callback(err);
          return;
        }
        if (workdirCustom) FS.workdirs[workdirCustom]=dir;
        else FS.workdir1=dir;
        api.load(dir,filename,mimetype, function (result) {
          if (Utils.isError(result) || result.status!=0) return;
          if (callback) callback(result.reply,filename,dir);        
        });
      });
    },

    saveFile: function saveFile(data, filename, mimetype, callback, workdirCustom) {
      if (typeof callback == 'string') { workdirCustom=callback; callback=undefined; }
      var api = FS, workdir=(workdirCustom?FS.workdirs[workdirCustom]||FS.workdir1:FS.workdir1)||FS.workdir;
      FileDialog.dialog('Save','Save',
        workdir,filename,api,function (dir,filename,err) {
        if (err) {
          console.log('FS.saveFile',err);
          if (callback) callback(err);
          return;
        }
        if (workdirCustom) FS.workdirs[workdirCustom]=dir;
        else FS.workdir1=dir;
        api.save(dir,filename,data,mimetype, function (stat) {
          if (callback) callback(stat,filename,dir);        
        })
      });
    },

    importFile: function importFile(mimetype,callback) {
      var api = FS;
      FileDialog.dialog('Load Data','Load',
        FS.workdir2||FS.workdir,'',api,function (dir,filename) {
        FS.workdir2=dir;
        api.load(dir,filename,mimetype, function (result) {
          if (Utils.isError(result) || result.status!=0) return;
          if (callback) callback(result.reply,filename,dir);        
        });
      });
    },

    exportFile:function exportFile(data, filename, mimetype, callback) {
      var api = FS;
      FileDialog.dialog('Save Data','Save',
        FS.workdir2||FS.workdir,filename,api,function (dir,filename) {
        FS.workdir2=dir;
        api.save(dir,filename,data,mimetype, function (stat) {
          if (callback) callback(stat,filename,dir);        
        });
      });
    },

    selectDirectory: function selectFile(title,callback, workdirCustom) {
      if (typeof callback == 'string') { workdirCustom=callback; callback=undefined; }
      var api = FS, workdir=(workdirCustom?FS.workdirs[workdirCustom]||FS.workdir2||FS.workdir1:FS.workdir2)||FS.workdir;;
      FileDialog.dialog(title||'Select Directory','Open',
        workdir,'',api,function (dir,filename) {
        if (workdirCustom) FS.workdirs[workdirCustom]=dir;
        else FS.workdir2=dir;
        if (callback) callback(filename,dir);
      });
    },
    selectFile: function selectFile(title,callback, workdirCustom) {
      if (typeof callback == 'string') { workdirCustom=callback; callback=undefined; }
      var api = FS, workdir=(workdirCustom?FS.workdirs[workdirCustom]||FS.workdir2||FS.workdir1:FS.workdir2)||FS.workdir;;
      FileDialog.dialog(title||'Select File','Open',
        workdir,'',api,function (dir,filename) {
        if (workdirCustom) FS.workdirs[workdirCustom]=dir;
        else FS.workdir2=dir;
        if (callback) callback(filename,dir);
      });
    },
  },
  version : '1.2.5L',
}

PATH = {
  basename : function (path,extension) {
    if (path[path.length-1]=='/') return '/';
    return extension?
            path.split('/').reverse()[0].replace(RegExp(extension.replace(/\./,'\\.')+'$'),'')
            :
            path.split('/').reverse()[0];
  },
  dirname : function (path) {
    var el=path.split('/');
    el.pop();
    return el.join('/');
  },
  
  extension : function (file) {
    return file.replace(/^[^\.]+\./,'');
  }
}

function loadFile (cb,binary) {
  if (Config.workdir) {
    // Try WEX service?
    return FS.API.loadFile(binary?'binary':'text',function (result,file) {
      if (Utils.isError(result)) {
        Config.workdir='';
        return nativeDialog();
      }
      if (cb) cb(result,file);
    })
  }
  function nativeDialog() {
    var input = document.createElement('input');
    input.type = 'file';
    input.onchange = function (e) { 
      // getting a hold of the file reference
      var file = e.target.files[0]; 

      // setting up the reader
      var reader = new FileReader();
      if (binary)
        reader.readAsArrayBuffer(file);
      else  
        reader.readAsText(file,'UTF-8');

       // here we tell the reader what to do when it's done reading...
       reader.onload = function (readerEvent) {
          var content = readerEvent.target.result; // this is the content!
          // console.log( content );
          if (binary)
            cb(new Uint8Array(content),input.files[0].name);
          else
            cb(content,input.files[0].name)
       }
    }
    input.click();
  }
  nativeDialog();
}

function saveFile(data, filename, mimetype, callback) {
    if (Config.workdir) {
      // Try WEX service?
      return FS.API.saveFile(data, filename, mimetype||'text',function (stat,filename) {
        if (Utils.isError(stat)) {
          return nativeDialog();
        }
        callback(filename)
      })
    }
    function nativeDialog() {
      var file = new Blob([data], {type: mimetype});
      if (window.navigator.msSaveOrOpenBlob) // IE10+
          window.navigator.msSaveOrOpenBlob(file, filename);
      else { // Others
          var a = document.createElement("a"),
              url = URL.createObjectURL(file);
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(function() {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);  
          }, 0); 
      }
    }
}

