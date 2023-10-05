/**
 **      ==================================
 **      O           O      O   OOOO
 **      O           O     O O  O   O
 **      O           O     O O  O   O
 **      OOOO   OOOO O     OOO  OOOO
 **      O   O       O    O   O O   O
 **      O   O       O    O   O O   O
 **      OOOO        OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 bLAB
 **    $CREATED:     29-3-16 by sbosse.
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 **  JAM Main World utils // WEB edition
 **
 **    $ENDOFINFO
 */
 
function out(txt) {console.log(txt)};

function changecss(theClass,element,value) {
  //Last Updated on July 4, 2011
  //documentation for this script at
  //http://www.shawnolson.net/a/503/altering-css-class-attributes-with-javascript.html
   var cssRules;


   for (var S = 0; S < document.styleSheets.length; S++) {
	 try {
	   document.styleSheets[S].insertRule(theClass+' { '+element+': '+value+'; }',
                                          document.styleSheets[S][cssRules].length);
	 } catch(err) {
	   try{
         document.styleSheets[S].addRule(theClass,element+': '+value+';');
	   } catch(err){
		   try{
			 if (document.styleSheets[S]['rules']) {
			   cssRules = 'rules';
			  } else if (document.styleSheets[S]['cssRules']) {
			   cssRules = 'cssRules';
			  } else {
			   //no rules found... browser unknown
			  }

			   for (var R = 0; R < document.styleSheets[S][cssRules].length; R++) {
			    if (document.styleSheets[S][cssRules][R].selectorText == theClass) {
				 if(document.styleSheets[S][cssRules][R].style[element]){
				 document.styleSheets[S][cssRules][R].style[element] = value;
				 break;
				 }
			    }
			   }
		   } catch (err){}
	   }
	 }
  }
}

function load (text,maskext) {
  var m = {},
      p,
      mask = {
        console:{
          log:out,
          warn:out
        },
        global:{},
        inspect:function (o) {console.log(o)},
        module:{exports:{}},
        process:{
          argv:[],
          cwd:(typeof process != 'undefined')?process.cwd:'/',
          env:(typeof process != 'undefined')?process.env:{},
          exit:function () {},
          on:(typeof process != 'undefined')?process.on:function () {}
        }
      },
      text, reg;
  if (maskext) for (p in maskext) {
    mask[p]=maskext[p];
  }

  reg = /#!/
  text=text.replace(reg,'//');
  with (mask) {
    m=eval('var x={main:function(args) {process.argv=args; '+text+'}}; x')
  }
  m.module=mask.module;
  return m;
}

function loadfile(file,maskext) {
  var xmlhttp, text;
  xmlhttp = new XMLHttpRequest();
  xmlhttp.overrideMimeType('text/plain');
  xmlhttp.open('GET', file, false);
  xmlhttp.send();
  text = xmlhttp.responseText;
  console.log('Loaded '+file+' ['+text.length+']')
  return load(text,maskext);
}


var O = {
    isArray:function (o) {
      if (o==undefined || o ==null) return false;
      else return typeof o == "array" || (typeof o == "object" && o.constructor === Array);
    },
    isObject:function (o) {
        return typeof o == "object";
    }
}
var S = {
    startsWith : function (str,head) {
        return !str.indexOf(head);
    },
    sub: function (str,off,len) {
        if (len)
            return str.substr(off,off+len);
        else
            return str.substr(off);
    },
    /** Remove leading and trailing characters from string
     *
     * @param str
     * @param {number} pref number of head characters to remove
     * @param {number} post number of tail characters to remove
     * @returns {*}
     */
    trim: function (str,pref,post) {
        if (str.length==0 ||
            pref>str.length ||
            post>str.length ||
            pref < 0 || post < 0 ||
            (pref==0 && post==0)
        ) return str;
        return str.substr(pref,str.length-pref-post);
    }
}

function BlobIt (blobParts,options) {
  var view = window;
  
  view.URL = view.URL || view.webkitURL;

  try{
    return new view.Blob( blobParts, options);
  }
  catch(e){
    var BlobBuilder = view.BlobBuilder || 
                      view.WebKitBlobBuilder || 
                      view.MozBlobBuilder || 
                      view.MSBlobBuilder,
        type = options ? options.type : undefined;
    var builder = new BlobBuilder();
	if (blobParts) {
      for (var i = 0, len = blobParts.length; i < len; i++) {
        if (Uint8Array && blobParts[i] instanceof Uint8Array) {
          builder.append(blobParts[i].buffer);
        } else {
          builder.append(blobParts[i]);
	    }
	  }
	}
	var blob = builder.getBlob(type);
    if (!blob.slice && blob.webkitSlice) {
      blob.slice = blob.webkitSlice;
    }
    return blob;
  }
}
 
function fireClick(node){
	if ( document.createEvent ) {
		var evt = document.createEvent('MouseEvents');
		evt.initEvent('click', true, false);
		node.dispatchEvent(evt);	
	} else if( document.createEventObject ) {
		node.fireEvent('onclick') ;	
	} else if (typeof node.onclick == 'function' ) {
		node.onclick();	
	}
} 

function saveTextAsFile(text,filename)
{
	var textToWrite = text; // document.getElementById("inputTextToSave").value;
	var textFileAsBlob = BlobIt([textToWrite], {type:'text/plain'});
	var fileNameToSaveAs = filename; // document.getElementById("inputFileNameToSaveAs").value;

	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
    downloadLink.target="_blank";
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked
		// without actually adding it to the DOM.
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
	}
	else
	{
		// Firefox requires the link to be added to the DOM
		// before it can be clicked.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);
	}
    fireClick(downloadLink)
}
 
function destroyClickedElement(event)
{
    document.body.removeChild(event.target);
}
 
function loadFileAsText(input,callback)
{
    var fileToLoad = document.getElementById(input).files[0];
 
    var fileReader = new FileReader();
    fileReader.onload = function(fileLoadedEvent)
    {
        var textFromFileLoaded = fileLoadedEvent.target.result;
        callback(textFromFileLoaded,fileToLoad);
    };
    fileReader.readAsText(fileToLoad, "UTF-8");
}
