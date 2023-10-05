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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2016, Christopher Jeffrey and contributors
 **    $CREATED:     sbosse on 28-3-15.
 **    $VERSION:     1.9.1
 **
 **    $INFO:
 *
 * helpers.js - helpers for blessed
 *
 **    $ENDOFINFO
 */

/**
 * Modules
 */

var fs = Require('fs');
var Comp = Require('com/compat');

var unicode = Require('term/unicode');

/**
 * Helpers
 */

var helpers = exports;


helpers.asort = function(obj) {
  return obj.sort(function(a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();

    if (a[0] === '.' && b[0] === '.') {
      a = a[1];
      b = b[1];
    } else {
      a = a[0];
      b = b[0];
    }

    return a > b ? 1 : (a < b ? -1 : 0);
  });
};

helpers.attrToBinary = function(style, element) {
  return helpers.Element.prototype.sattr.call(element || {}, style);
};

// Compute absolute position, width, height of a box 
// Requires parent object with absolute bbox valies. 
// Commonly parent is screen object.
// Supported formats: number,'half','center','%'
helpers.bbox = function (parent,options) {
  function eval(a,b) {
    if (a.indexOf('%')) return int(Number(a.substring(0,a.length-1))*b/100);
  }
  var bbox={width:options.width,height:options.height,top:options.top,left:options.left,right:options.right};
  if (bbox.width=='half') bbox.width=int(parent.width/2);
  if (typeof bbox.width == 'string' && bbox.width.indexOf('%')!=-1) bbox.width=eval(bbox.width,parent.width);
  if (bbox.height=='half') bbox.height=int(parent.height/2);
  if (typeof bbox.height == 'string' && bbox.height.indexOf('%')!=-1) bbox.height=eval(bbox.height,parent.height);
  if (bbox.left=='center') bbox.left=int((parent.width/2)-(bbox.width/2));
  if (bbox.top=='center') bbox.top=int((parent.height/2)-(bbox.height/2));
  return bbox;  
}

helpers.cleanTags = function(text) {
  return helpers.stripTags(text).trim();
};

helpers.dropUnicode = function(text) {
  if (!text) return '';
  return text
    .replace(unicode.chars.all, '??')
    .replace(unicode.chars.combining, '')
    .replace(unicode.chars.surrogate, '?');
};

helpers.findFile = function(start, target) {
  return (function read(dir) {
    var files, file, stat, out;

    if (dir === '/dev' || dir === '/sys'
        || dir === '/proc' || dir === '/net') {
      return null;
    }

    try {
      files = fs.readdirSync(dir);
    } catch (e) {
      files = [];
    }

    for (var i = 0; i < files.length; i++) {
      file = files[i];

      if (file === target) {
        return (dir === '/' ? '' : dir) + '/' + file;
      }

      try {
        stat = fs.lstatSync((dir === '/' ? '' : dir) + '/' + file);
      } catch (e) {
        stat = null;
      }

      if (stat && stat.isDirectory() && !stat.isSymbolicLink()) {
        out = read((dir === '/' ? '' : dir) + '/' + file);
        if (out) return out;
      }
    }

    return null;
  })(start);
};

// Escape text for tag-enabled elements.
helpers.escape = function(text) {
  return text.replace(/[{}]/g, function(ch) {
    return ch === '{' ? '{open}' : '{close}';
  });
};

helpers.generateTags = function(style, text) {
  var open = ''
    , close = '';

  Object.keys(style || {}).forEach(function(key) {
    var val = style[key];
    if (typeof val === 'string') {
      val = val.replace(/^light(?!-)/, 'light-');
      val = val.replace(/^bright(?!-)/, 'bright-');
      open = '{' + val + '-' + key + '}' + open;
      close += '{/' + val + '-' + key + '}';
    } else {
      if (val === true) {
        open = '{' + key + '}' + open;
        close += '{/' + key + '}';
      }
    }
  });

  if (text != null) {
    return open + text + close;
  }

  return {
    open: open,
    close: close
  };
};

helpers.hsort = function(obj) {
  return obj.sort(function(a, b) {
    return b.index - a.index;
  });
};

helpers.merge = function(a, b) {
  Object.keys(b).forEach(function(key) {
    a[key] = b[key];
  });
  return a;
};

helpers.parseTags = function(text, screen) {
  return helpers.Element.prototype._parseTags.call(
    { parseTags: true, screen: screen || helpers.Screen.global }, text);
};


helpers.stripTags = function(text) {
  if (!text) return '';
  return text
    .replace(/\{(\/?)([\w\-,;!#]*)\}/g, '')
    .replace(/\x1b\[[\d;]*m/g, '');
};

/* Depricated
helpers.__defineGetter__('Screen', function() {
  if (!helpers._screen) {
    helpers._screen = Require('term/widgets/screen');
  }
  return helpers._screen;
});

helpers.__defineGetter__('Element', function() {
  if (!helpers._element) {
    helpers._element = Require('term/widgets/element');
  }
  return helpers._element;
});
*/
Object.defineProperty(helpers,'Screen',{
  get: function () {
    if (!helpers._screen) {
      helpers._screen = Require('term/widgets/screen');
    }
    return helpers._screen;
  }
});
Object.defineProperty(helpers,'Element',{
  get: function () {
    if (!helpers._element) {
      helpers._element = Require('term/widgets/element');
    }
    return helpers._element;
  }
});
