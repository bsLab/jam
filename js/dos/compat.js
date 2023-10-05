/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
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
 **    $INITIAL:     (C) 2015 BSSLAB
 **    $CREATED:     3/30/15.
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 **  JavaScript-OCaML Compatibility Module
 **
 **    $ENDOFINFO
 */
"use strict";
var Io = require('./io');
var Path = require('./ext/path');

/**
 *
 * @param {boolean|string} condmsg conditional message (cond)||(msg)
 */
var assert = function(condmsg) {
    if (condmsg != true) {
        Io.out('** Assertion failed: '+condmsg+' **');
        Io.stacktrace();
        throw Error(condmsg);
    }
};

/** OBJ
 *
 * @type {{isArray: Function, isFunction: Function, isString: Function, isNumber: Function}}
 */
var obj = {
    isArray:function (o) {
        return typeof o == "array" || (typeof o == "object" && o.constructor === Array);
    },
    isFunction: function (o) {
        return typeof o == "function";
    },
    isString: function (o) {
        return typeof o == "string" || (typeof o == "object" && o.constructor === String);
    },
    isNumber: function (o) {
        return typeof o == "number" || (typeof o == "object" && o.constructor === Number);
    }
};

/** ARRAY
 *
 * @type {{append: Function, check: Function, concat: Function, copy: Function, create: Function, create_matrix: Function, empty: Function, find: Function, filter: Function, flatten: Function, head: Function, init: Function, iter: Function, iter_rev: Function, length: Function, map: Function, match: Function, member: Function, merge: Function, pop: Function, push: Function, range: Function, tail: Function, print: Function, sort: Function}}
 */
var array = {
    /** Append one element at the end of the array.
     *
     * @param {* []} array
     * @param {*} element
     */
    append : function(array,element) {
      array.push(element);
    },
    /** Check for an elenment in the array by using a check function.
     *
     * @param array
     * @param fun
     * @returns {boolean}
     */
    check: function(array,fun) {
        var i,exist;
        exist=false;
        loop: for(i in array) {
            var element=array[i];
            if (fun(element,i)) {
                exist=true;
                break loop;
            }
        }
        return exist;
    },
    /** Append array2 at the end of array.
     *
     * @param array
     * @param array2
     */
    concat : function(array,array2) {
        for(var i in array2) {
            array.push(array2[i]);
        }
    },
    copy: function(array) {
        return array.slice();
    },
    create : function(length,init) {
        var arr = [], i = length;
        while (i--) {
          arr[i] = init;
        }
        return arr;
    },
    create_matrix : function(rows,cols,init) {
        var m = [];
        var r = [];
        var i,j;
        for (i = 0; i < rows; i++) {
            r=[];
            for(j=0;j<cols;j++) r.push(init);
            m.push(r);
        }
        return m;
    },
    empty : function (array) {
      return (array==undefined ||
              array.length==0)
    },
    find: function(array,fun) {
        var i,found;
        var len=array.length;
        found=undefined;
        loop: for(i=0;i<len;i++) {
            var element=array[i];
            if (fun(element,i)) {
                found=element;
                break loop;
            }
        }
        return found;
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number):boolean} fun
     * @returns {* []}
     */
    filter: function(array,fun) {
        var res=[];
        var len=array.length;
        var i;
        for(i=0;i<len;i++) {
            var element=array[i];
            if (fun(element,i)) res.push(element);
        }
        return res;
    },
    flatten: function (array) {
        var res=[];
        var len=array.length;
        var i;
        for(i=0;i<len;i++) {
            var element=array[i];
            if (!obj.isArray(element)) res.push(element);
            else {
                var j;
                var len2=element.length;
                for(j=0;j<len2;j++) {
                    var element2=element[j];
                    res.push(element2);
                }
            }
        }
        return res;

    },
    head : function(array) {
        return array[0];
    },
    init : function(length,fun) {
        var arr = [], i = length;
        while (i--) {
          arr[i] = fun(i);
        }
        return arr;
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     */
    iter: function(array,fun) {
        var i=0;
        var len=array.length;
        for(i=0;i<len;i++) {
            var element=array[i];
            fun(element,i)
        }
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     */
    iter_rev: function(array,fun) {
        var i;
        var len=array.length;
        for(i=len-1;i>=0;i--) {
            var element=array[i];
            fun(element,i)
        }
    },
    length : function(array) {
        return array.length;
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,number)} fun
     * @returns {* []}
     */
    map: function(array,fun) {
        var i=0;
        var len=array.length;
        var res=[];
        for(i=0;i<len;i++) {
            var element=array[i];
            res.push(fun(element,i));
        }
        return res;
    },
    /**
     *
     * @param {* []} array
     * @param {Function} fun_hdtl  - function(hd,tl)
     * @param {Function} fun_empty - function()
     */
    match: function(array,fun_hdtl,fun_empty) {
        if (array.length == 0)
            fun_empty();
        else if (array.length>1) {
            var hd = this.head(array);
            var tl = this.tail(array);
            fun_hdtl(hd,tl);
        } else fun_hdtl(this.head(array),[]);
    },
    /** Check for an element in the array.
     *
     * @param {(number|string|boolean) []} array
     * @param {number|string|boolean} element
     * @returns {boolean}
     */
    member: function(array,element) {
        var i,exist;
        var len=array.length;
        exist=false;
        loop: for(i=0;i<len;i++) {
            var _element=array[i];
            if (_element==element) {
                exist=true;
                break loop;
            }
        }
        return exist;
    },
    /**
     *
     * @param {Array} array1
     * @param {Array} array2
     * @param {Array} [array3]
     * @param {Array} [array4]
     * @returns {Array}
     */
    merge: function(array1,array2,array3,array4) {
        var arraynew=array1.slice();
        arraynew=arraynew.concat(array2);
        if (array3!=undefined) arraynew=arraynew.concat(array3);
        if (array4!=undefined) arraynew=arraynew.concat(array4);
        return arraynew;
    },
    /*
     ** Push/pop head elements (Stack behaviour)
     */
    /** Remove and return top element of array.
     *
     * @param array
     * @returns {*}
     */
    pop : function(array) {
        var element=array[0];
        array.shift();
        return element;
    },
    /** Add new element at top of array.
     *
     * @param array
     * @param element
     */
    push : function(array,element) {
        array.unshift(element);
    },
    /** Create an ordered array of numbers {a,a+1,..b}
     *
     * @param a
     * @param b
     * @returns {Array}
     */
    range : function(a,b) {
        var i;
        var array=[];
        for(i=a;i<=b;i++) array.push(i);
        return array;
    },
    tail : function(array) {
        var array2=array.slice();
        array2.shift();
        return array2;
    },
    print: function(array) {
        var i;
        var len=array.length;
        var str='[';
        for(i=0;i<len;i++) {
            var cell=array[i];
            str=str+cell;
        }
        return str+']';
    },
    /**
     *
     * @param {* []} array
     * @param {function(*,*):number} fun   (1:a gt. b by the ordering criterion,-1: a lt. b, 0: a eq. b)
     * @returns {* []}
     */
    sort: function(array,fun) {
        var array2=array.slice();
        array2.sort(fun);
        return array2;
    }
};

/** STRING
 *
 * @type {{copy: Function, create: Function, empty: Function, equal: Function, format_hex: Function, get: Function, iter: Function, length: Function, make: Function, match: Function, parse_hex: Function, set: Function, split: Function, sub: Function, trim: Function}}
 */
var string = {
    copy: function(src) {
        var i;
        var dst='';
        for(i=0;i<src.length;i++) dst=dst+src.charAt(i);
        return dst;
    },
    /**
     *
     * @param {number} size
     * @returns {string} filled with spaces
     */
    create: function(size)
    {
        var i;
        var s='';
        var init=' ';
        for(i=0;i<size;i++) s=s+init;
        return s;
    },
    empty: function (str) {
      return this.equal(str,'');
    },
    equal:  function(str1,str2) {
        var i;
        var eq=true;
        if (str1.length != str2.length) return false;
        for(i=0;i<str1.length;i++) { if (string.get(str1,i)!=string.get(str2,i)) eq=false;}
        return eq;
    },
    format_hex: function (n,len) {
        // format a hexadecimal number with 'len' figures.
        switch (len) {
            case 2: return (((n>>4) & 0xf).toString(16))+
                            ((n&0xf).toString(16));
            case 4: return (((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            case 6: return (((n>>20) & 0xf).toString(16)+
                            ((n>>16) & 0xf).toString(16)+
                            ((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            case 8: return (((n>>28) & 0xf).toString(16)+
                            ((n>>24) & 0xf).toString(16)+
                            ((n>>20) & 0xf).toString(16)+
                            ((n>>16) & 0xf).toString(16)+
                            ((n>>12) & 0xf).toString(16)+
                            ((n>>8) & 0xf).toString(16)+
                            ((n>>4) & 0xf).toString(16)+
                            (n&0xf).toString(16));
            default: return 'format_hex??';
        }
    },
    /**
     *
     * @param {string} str
     * @param {number} index
     * @returns {string}
     */
    get: function (str,index) {
        assert((str != undefined && index < str.length && index >= 0)||('string.get ('+str.length+')'));
        return str.charAt(index);
    },
    /**
     *
     * @param {string} str
     * @param {function(string,number)} fun
     */
    iter: function(str,fun) {
        var i;
        var len=str.length;
        for (i = 0; i < len; i++)  {
            var c = str.charAt(i);
            fun(c,i);
        }
    },
    /**
     *
     * @param str
     * @returns {*}
     */
    length: function(str) {
        if (str!=undefined) return str.length;
        else return 0;
    },
    /**
     *
     * @param {number} size
     * @param {string} init
     * @returns {string}
     */
    make: function(size,init)
    {
        var i;
        var s='';
        for(i=0;i<size;i++) s=s+init;
        return s;
    },
    /** Match a string with different patterns and apply a matching function.
     *
     * @param {string} str
     * @param {* [] []} cases - ([string,fun] | [string [],fun] | fun) []
     */
    match: function(str,cases) {
        var i,j;
        var cas,cex,cv;
        for(i in cases) {
            cas=cases[i];
            if (obj.isArray(cas) && cas.length>1) {
                cex=cas[0];
                if (!obj.isArray(cex)) {
                    if (this.equal(str,cex)) {
                        cas[1]();
                        return;
                    }
                } else {
                    for(j in cex) {
                        cv=cex[j];
                        if (this.equal(str,cv)) {
                            cas[1]();
                            return;
                        }
                    }
                }
            } else if (obj.isArray(cas) && cas.length==1) {
                cas[0]();
                return;
            } else if (obj.isFunction(cas)) {
                cas(str);
                return;
            }
        }
    },
    /**
     *
     * @param str
     * @param pos
     * @param len
     * @returns {Number}
     */
    parse_hex: function (str,pos,len) {
        // parse a hexadecimal number in string 'str' starting at position 'pos' with 'len' figures.
        return parseInt(this.sub(str,pos,len),16);
    },
    /**
     *
     * @param str
     * @param index
     * @param char
     * @returns {string}
     */
    set: function (str,index,char) {
        assert((str != undefined && index < str.length && index >= 0)||'string.get');
        return str.substr(0, index) + char + str.substr(index+1)
    },
    /**
     *
     * @param delim
     * @param str
     * @returns {*|Array}
     */
    split: function (delim,str) {
        return str.split(delim);
    },
    /**
     * 
     * @param str
     * @param off
     * @param len
     * @returns {string}
     */
    sub: function (str,off,len) {
        return str.substr(off,len);
    },
    /** Remove leading and trailing characters from string
     *
     * @param str
     * @param start
     * @param end
     * @returns {*}
     */
    trim: function (str,start,end) {
        if (str.length==0 ||
            start>str.length ||
            end>str.length ||
            (start==0 && end==0)
        ) return str;
        return str.substr(start,str.length-start-end);
    }
};

/** RANDOM
 *
 * @type {{int: Function}}
 */
var random = {
    int: function(max) {
        return Math.floor(Math.random()*max+0)
    }
};

/** PRINTF
 *
 * @type {{sprintf: Function}}
 */
var printf = {
    /** Formatted printer
     *
     * @param {* []} args (['%format',arg]|string) []  format=%s,%d,%f,%c,%x,%#d,%#s,..
     * @returns {string}
     */
    sprintf: function(args) {
        var str='';
        array.iter(args,function(fmtarg) {
            var len, n,fs;
            if (obj.isArray(fmtarg)) {
                if (fmtarg.length==2) {
                    var fmt=fmtarg[0];
                    var arg=fmtarg[1];
                    var fc='';
                    var fn=0;
                    string.iter(fmt,function(c) {
                        if (c=='s' || c=='d' || c=='f' || c=='x') {
                            fc=c;
                        } else if (c!='%') {
                            fn=fn*10;
                            n=parseInt(c);
                            if (!isNaN(n)) fn=fn+n;
                        }
                    });
                    if (fc=='s' && obj.isString(arg)) {
                        str=str+arg;
                        if (fn!=0) {
                            len=arg.length;
                            if (len<fn) str=str+string.create(fn-len);
                        }
                    } else if (fc=='d' && obj.isNumber(arg)) {
                        fs = pervasives.string_of_int(arg);
                        if (fn!=0) {
                            len = fs.length;
                            if (len < fn) {
                                str=str+string.create(fn-len);
                            }
                        }
                        str=str+fs;
                    } else if (fc=='x' && obj.isNumber(arg)) {
                        fs = string.format_hex(arg,fn||8);
                        str=str+fs;
                    }
                }
            } else if (obj.isString(fmtarg)) {
                str = str + fmtarg;
            }
        });
        return str;
    }
};

/** FILENAME
 *
 * @type {{basename: Function, dirname: Function, is_relative: Function, join: Function, path_absolute: Function, path_normalize: Function}}
 */
var filename = {
    basename : function (path) {
        return Path.basename(path);
    },
    dirname : function (path) {
        return Path.dirname(path);
    },
    is_relative: function(path) {
        return !(path.length > 0 && path[0] == '/');
    },
    join: function (pathl,absolute) {
        var path=(absolute?'/':'');
        array.iter(pathl,function (name,index) {
            if (index>1) {
                path=path+'/'+name;
            }
            else {
                path=path+name;
            }
        });
        return path;
    },
    path_absolute: function (path) {
        if (this.is_relative(path)) {
            var workdir = Io.workdir();
            return this.path_normalize(workdir + '/' + path);
        } else this.path_normalize(path);
    },
    path_normalize: function (path) {
        var i;
        if (string.equal(path, '')) path = '/';
        var relpath = !(string.get(path, 0) == '/');
        var pathlist = path.split('/');
        var pathlist2 = pathlist.filter(function (s) {
            return (!string.equal(s, '') && !string.equal(s, '.'))
        });
        var pathlist3 = [];
        array.iter(pathlist2, function (pe) {
            if (!string.equal(pe, '..')) {
                array.push(pathlist3, pe)
            } else {
                if (pathlist3.length == 0) return '';
                else
                    pathlist3 = array.tail(pathlist3);
            }
        });
        var path2 = '';
        i = 0;
        array.iter(pathlist3, function (pe) {
            var sep;
            if (i == 0) sep = ''; else sep = '/';
            path2 = pe + sep + path2;
            i++;
        });
        if (relpath) return path2; else return '/' + path2;
    }
};

/** PERVASIVES
 *
 * @type {{char_of_int: Function, div: Function, failwith: Function, int_of_char: Function, int_of_float: Function, int_of_string: Function, mtime: Function, min: Function, max: Function, string_of_int: Function, time: Function}}
 */
var pervasives = {
    char_of_int: function (i) {return String.fromCharCode(i)},
    div: function(a,b) {return a/b|0;},
    failwith: function(msg) {Io.err(msg);},
    int_of_char: function(c) {return c.charCodeAt()},
    int_of_float: function(f) {return f|0;},
    int_of_string: function(s) {return parseInt(s)},
    mtime: function () {var time = new Date(); return time.getTime();},
    min: function(a,b) { return (a<b)?a:b},
    max: function(a,b) { return (a>b)?a:b},
    string_of_int: function(i) {return i.toString()},
    time: function () {var time = new Date(); return (time.getTime()/1000)|0;}
};

/** BIT
 *
 * @type {{get: Function, isSet: Function, set: Function}}
 */
var bit = {
    get: function (v,b) {return (v >> b) && 1;},
    isSet: function (v,b) {return ((v >> b) && 1)==1;},
    set: function (v,b) {return v & (1 << b);}
};

/** ARGS
 *
 * @type {{parse: Function}}
 */
var args = {
    /** Parse process or command line arguments (array agv)
     *
     * @param {string []} argv
     * @param {*[]} map  [<argname>,<numargs:0..3>,<handler(up to 3 arguments)>]|[<defhandler(val)>] []
     */
    parse: function(argv,map) {
        var shift=undefined;
        var in_shift=0;
        var shift_args=[];
        var names;
        var mapfun;
        var numarg;

        argv.forEach(function (val, index) {
            if(index>1) {
                if (in_shift==0) {
                    array.check(map,function (onemap) {
                        if (onemap.length==3) {
                            names  = onemap[0];
                            numarg = onemap[1];
                            mapfun = onemap[2];
                            if (!obj.isArray(names)) names=[names];
                            var found = array.check(names,function (name) {
                                return string.equal(val, name);
                            });
                            if (found) {
                                if (numarg==0) mapfun();
                                else {
                                    in_shift=numarg;
                                    shift_args=[];
                                    shift=mapfun;
                                }
                                return true;
                            }
                        } else if (onemap.length==1) {
                            mapfun = onemap[0];
                            mapfun(val);
                            return true;
                        }
                        return false;
                    });
                } else {
                    shift_args.push(val);
                    in_shift--;
                    if (in_shift==0 && shift!=undefined) {
                        numarg=shift_args.length;
                        switch (numarg) {
                            case 0: shift(val);break;
                            case 1: shift(shift_args[0],val); break;
                            case 2: shift(shift_args[0],shift_args[1],val); break;
                            default: break;
                        }
                        shift=undefined;
                    }
                }
            }
        });
    }

};

/** HASHTBL
 *
 * @type {{add: Function, create: Function, find: Function, invalidate: Function, iter: Function, remove: Function}}
 */
var hashtbl = {
    add: function(hash,key,data) {
        hash[key]=data;
    },
    create: function(initial) {
        return [];
    },
    find: function(hash,key) {
        return hash[key];
    },
    invalidate: function(hash,key) {
        hash[key]=undefined;
    },
    iter: function(hash,fun) {
        for (var key in hash) {
            if (hash[key]!=undefined) fun(key,hash[key]);
        }
    },
    remove: function(hash,key) {
        // TODO: check, its wrong!
        if (!hash.hasOwnProperty(key))
            return;
        if (isNaN(parseInt(key)) || !(hash instanceof Array))
            delete hash[key];
        else
            hash.splice(key, 1)
    }
};

module.exports = {
    args:args,
    assert: assert,
    array:array,
    bit:bit,
    div:pervasives.div,
    filename:filename,
    hashtbl:hashtbl,
    isNodeJS: function () {
        return (typeof global !== "undefined" &&
                {}.toString.call(global) == '[object global]');
    },
    obj:obj,
    pervasives:pervasives,
    printf:printf,
    random:random,
    string:string,
    isArray: obj.isArray,
    isString: obj.isString,
    isNumber: obj.isNumber
};
