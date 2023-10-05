/**** WEB CLipBoard *****/
var NL='\n';

Clip = {
  share: function share(id) {
    var content = '<p>TODO</p>';
    var idlabel='??';
    content = '<textarea id="ClipText-'+id+'" class="code" style="width:98%;">'+UI('SourceText'+id).getValue()+'</textarea>';
    idlabel=(editorWin[id]._options && editorWin[id]._options.file)||'*';
    var buttons = [
      '<button type="button" onclick="Clip.copyShare(\''+id+'\',\''+idlabel+'\')">Copy</button>',
      '<button type="button" onclick="Clip.pasteShare(\''+id+'\')">Paste</button>',
      '<button type="button" onclick="Clip.reloadShare(\''+id+'\')">Refresh</button>',
    ].join(NL);

    Clip.createSnippets(id,function (snippets) { 
      content += ('<div style="overflow:auto;height:70%;margin-top:10px;" id="Clipboard-'+id+'">'+snippets.join(NL)+'</div>');
      content = '<div style="height:98%;">'+buttons+content+'</div>';
      var panel = openWin(1,content,{title:'WEB Clipboard '+idlabel, width:400, height:300});
    });
  },
  // helpers
  copyShare: function copyShare(id,tag) {
    var data = UI('SourceText'+id).getValue();
    Clip.clipboardStore(jamConfig.user||'user',tag||'no tag',id,data,function (stat)  {
      console.log(stat)
      if(stat=='OK') Clip.reloadShare(id)
    })
  },
  createSnippets: function createSnippets(id,cb) {
    Clip.clipboardGet(id,function (data,err) {
      var snippets=[];
      if (err) {
        snippets=[err];
      } else if (data.length) {
        // test
        data.forEach(function (snip) {
          var user=snip.user;
          var code=snip.data;
          var ids=(snip.tag?'#'+snip.tag+' ':'')+snip.user+'@'+snip.date;
          var slabel=ids;
          snippets.push(
            '<input type="checkbox" id="spoiler'+ids+'" onclick="Clip.updateShareText(\'text'+
            ids+'\',\'ClipText-'+id+'\')"/><label for="spoiler'+
            ids+'">'+slabel+'</label>'+
            '<textarea id="text'+ids+'" class="spoiler">'+code+'</textarea>'+NL+'</input>'+NL   
          );
        })
      }
      cb(snippets);
    })
  },
  pasteShare: function pasteShare(id) {
    var text = document.getElementById('ClipText-'+id).value;
    UI('SourceText'+id).setValue(text);
  },
  reloadShare: function reloadShare(id) {
    Clip.createSnippets(id, function (snippets) {
      document.getElementById('Clipboard-'+id).innerHTML=snippets.join(NL);
    })
    document.getElementById('ClipText-'+id).value=UI('SourceText'+id).getValue();
  },
  updateShareText: function updateShareText(from,to) {
    var text = document.getElementById(from).value;
    document.getElementById(to).value=text;
  },

  /******* WEBCLIP ***********/
  clipboardStore: function (from,tag,id,data,cb) {
    if (!cb) cb=console.log.bind(console);
    var url=jamConfig.webclipUrl;
    if (url.indexOf('http')!=0) url = 'http://'+url;

    try {
      var request = new XMLHttpRequest();
      request.open("POST", url, true);
      request.onreadystatechange = function () {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                var allText = request.responseText;
                if (cb) cb(allText)
            } else if (cb) cb('copy to '+jamConfig.webclipUrl+' failed (status)');
        }
      }
      request.onerror = function (err) {
        if (cb) cb('copy to '+jamConfig.webclipUrl+' failed (error)')
      }
      request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      console.log(JSON.stringify({user:from,group:jamConfig.group+'-'+id,data:data}))
      request.send(JSON.stringify({user:from,tag:tag,group:jamConfig.group+'-'+id,data:data}));
    } catch (e) {
      if (cb) cb(e)
    }
  },

  clipboardGet: function (id,cb) {
    var url=jamConfig.webclipUrl;
    if (url.indexOf('http')!=0) url = 'http://'+url;
    try {
      var request = new XMLHttpRequest();
      request.open("GET", url+'/?time='+jamConfig.webclipTime+'&group='+jamConfig.group+'-'+id, true);
      request.onreadystatechange = function () {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                var allText = request.responseText;
                var clips = JSON.parse(allText);
                cb(clips)
            } else cb(null,'paste from '+jamConfig.webclipUrl+' failed (status)');
        }
      }
      request.onerror = function (err) {
        cb(null,'paste from '+jamConfig.webclipUrl+' failed (error)')
      }
      request.send(null);
    } catch (e) {
      cb(null,e)
    }
  },

}
