// Embedded JAM Shell for SEJAM Version 1.2.1
var Io = Require('com/io');
var Comp = Require('com/compat');
var Aios = Require('jam/aios')

var help = [
'# Usage',
' jamsh [-v] [script.js] [-- <script args>]',
'# Shell Commands',
'The following shell commands are avaiable:',
'',
'add({x,y})\n: Add a new logical (virtual) node',
'args\n: Script arguments',
'agent(id)\n: Returns the agent object',
'agents\n: Get all agents (id list) of current node',
'ask(question:string,choices: string [])\n: Ask a question and read answer. Available only in script mode.',
'assign(src,dst)\n: Copy elements of objects',
'broker(ip)\n: Start a UDP rendezvous broker server',
'Capability\n: Create a security capability object',
'clock(ms)\n: Returns system time (ms or hh:mm:ss format)',
'cluster(desc)\n:Create a worker process cluster',
'config(options)\n: Configure JAM.  Options: _print_, _printAgent_,_TSTMO_',
'connect({x,y},{x,y})\n: Connect two logical nodes (DIR.NORTH...)',
'connect({to:dir)\n: Connect to physical node',
'connected(to:dir)\n: Check connection between two nodes',
'compile(function)\n: Compile an agent class constructor function',
'concat(a,b)->c\n: Concatenate two values',
'contains(a,v)->boolean\n: Check if array or object contains a value or oen in an array of values',
'copy(o)\n: Returns copy of record or array',
'create(ac:string|function,args:*[]|{},level?:number,node?)\n: Create an agent from class @ac with given arguments @args and @level',
'csp?\n: Constraint Solving Programming',
'csv?\n: CSV file reader and writer (read,write)',
'disconnect({x,y},{x,y})\n: Disconnect two logical nodes',
'disconnect({to:dir)\n: Diconnect remote endpoint',
'env\n: Shell environment including command line arguments a:v',
'empty(a)->boolean\n: Test empty string, array, or object',
'exec(cnd:string)\n: Execute a jam shell command',
'exit\n: Exit shell',
'extend(level:number|number[],name:string,function,argn?:number|number[])\n: Extend AIOS',
'filter(a,f)->b\n: Filter array or object',
'http.get(ip:string,path:string,callback?:function)\n: Serve HTTP get request',
'http.put(ip:string,path:string,data,callback?:function)\n: Serve HTTP put request',
'http.server(ip:string,dir:string,index?:string)\n: Create and start a HTTP file server',
'info(kind:"node"|"version"|"host",id?:string)->info {}\n: Return information (node)', 
'inp(pattern:[],all?:boolean)\n: Read and remove (a) tuple(s) from the tuple space', 
'kill(id:string|number)\n: Kill an agent (id="*": kill all) or a task (started by later)',
'last(object|array)\n: Return last element of array, string, or object',
'later(ms:number,callback:function,loop?:boolean)\n: Execute a function later.',
'load(path:string)\n: Load a JSON or CSV file (autodetect)',
'lookup(pattern:string,callback:function (string [])\n: Ask broker for registered nodes',
'locate(callback?:function)\n: Try to estimate node location (geo,IP,..)',
'log(msg)\n: Agent logger function',
'mark(tuple:[],millisec)\n: Store a tuple with timeout in the tuple space', 
'merge\n: Add a column (array) to a matrix (array array)',
'ml?\n: Generic machine Learning framework module',
'name("node"|"world")\n: Return name of current node or wolrd',
'node\n: Get or set current vJAM node (default: root) either by index or id name',
'numerics?\n: Numerics module (fft, vector, matrix, ..)',
'nn?\n: Neural Network framework module',
'neg(v)->v\n: Negate number, array or object of numebrs',
'object(s)\n: Convert string to object',
'ofJSON(s)\n: Convert JSON to object including functions',
'on(event:string,handler:function)\n: Install an event handler. Events: "agent+","agent-","signal+","signal","link+","link-"',
'open(file:string,verbose?:number)\n: Open an agent class file',
'out(tuple:[])\n: Store a tuple in the tuple space', 
'pluck(table,column)\n:Extracts a column of a table (array array or object array)',
'port(dir,options:{proto,secure},node)\n: Create a new physical communication port',
'Port\n: Create a security port',
'Private\n: Create a security private object',
'provider(function)\n: Register a tuple provider function',
'random(a,b)\n: Returns random number or element of array/object', 
'rd(pattern:[],all?:boolean)\n: Read (a) tuple(s) from the tuple space', 
'reverse(a)->b\n: Reverse array or string',
'rm(pattern:[],all?:boolean)\n: Remove (a) tuple(s) from the tuple space', 
'sat?\n: Logic (SAT) Solver module',
'save(path:string,data:string,csv?:boolean)\n: Save a JSON or CSV file',
'script(file:string)\n: Load and execute a jam shell script',
'select(arr,a,b)\n: Split matrix (array array) by columns [a,b] or [a]',
'setlog(<flag>,<on>)\n: Enable/disable logging attributes',
'signal(to:aid,sig:string|number,arg?:*)\n: Send a signal to specifid agent',
'sleep(millisec)?\n:Suspend entire shell for seconds',
'start()\n: start JAM',
'stats(kind:"process"|"node"|"vm"|"conn")\n: Return statistics',
'stop()\n: stop JAM',
'sql(filename:string)\n: Open or create an SQL database. A memory DB can be created with _filename_=":memory:". Requires native sqlite3 plug-in.',
'test(pattern:[])\n: Test existence of tuple', 
'ts(pattern:[],callback:function(tuple)->tuple)\n: Update a tuple in the space (atomic action) - non-blocking', 
'time()\n: print AIOS time',
'toJSON(o)\n: Convert object including functions to JSON',
'verbose(level:number)\n: Set verbosity level',
'versions()\n: Returns JAM shell and library version',
'utime()\n: Returns system time in nanoseconds',
'world\n: Returns world object',
].join('\n');

var shell =  {
  env : {
    Aios:     Aios,
    DIR:      Aios.DIR,
    agent: function (id) {
      if (!shell.options.gui.simu) return;
      if (shell.node) {
        var node = shell.options.gui.simu.world.getNode(shell.node);
        if (node) {
          return node.getAgent(id);
        }
      }
      
    },
    get agents () {
      if (!shell.options.gui.simu) return;
      if (shell.node) {
        var node = shell.options.gui.simu.world.getNode(shell.node);
        if (node) {
          return node.processes.table.map( function (pro) { return pro.agent.id });
        }
      }
    }, 
    angle:    Aios.aios0.angle,
    assign:   Aios.aios0.assign,
    Capability:     Aios.Sec.Capability,
    concat:         Aios.aios0.concat,
    contains:       Aios.aios0.contains,
    copy:           Aios.aios0.copy,
    get current () { return Aios.current },
    delta:          Aios.aios0.delta,
    get help () {  return help },
    distance :      Aios.aios0.distance,
    empty:          Aios.aios0.empty,
    exec :    function (line) { shell.process(line) },
    filter:function (a,f) {
      var res=[],len,len2,i,j,found;
      if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
          res=[];
          len=a.length;
          for(i=0;i<len;i++) {
              var element=a[i];
              if (f(element,i)) res.push(element);
          }
          return res;
      } else if (Comp.obj.isArray(a) && Comp.obj.isArray(f)) {
          res=[];
          len=a.length;
          len2=f.length;
          for(i=0;i<len;i++) {
              var element=a[i];
              found=false;
              for (j=0;j<len2;j++) if(element==f[j]){found=true; break;}
              if (!found) res.push(element);
          }
          return res;      
      } else return undefined;   
    },
    flatten:          Aios.aios0.flatten,
    ignore: function () { }, 
    inspect: Io.inspect,
    kill:   function (id) { 
      if (typeof id == 'string') Aios.kill(id);
      else if (typeof id == 'number' && id >= 0) {
        if (shell.tasks[id]) clearInterval(shell.tasks[id]);
        shell.tasks[id]=null;
      } 
    },
    last :  Aios.aios0.last,
    later:  function (ms,cb,loop) {
      if (loop) {
        var id = shell.tasks.length;
        shell.tasks.push(setInterval(function () {cb(id)},ms));
        return shell.tasks.length-1
      } else setTimeout(cb,ms);
    },
    load:   function (file) {
      var obj,text = Io.read_file(file);
      if (!text) return;
      if (text.match(/^\s*{/)||text.match(/^\s*\[\s*{/)) {
        obj=self.env.ofJSON(text);
      } else if (shell.env.csv && shell.env.csv.detect(text)) obj=shell.env.csv.read(text,false,true);
      return obj;
    },
    map : function (a,f) {
      var res,i,p;
      if (Comp.obj.isArray(a) && Comp.obj.isFunction(f)) {
        res=[];
        for (i in a) {
          v=f(a[i],i);
          if (v!=undefined) res.push(v);
        }
        return res;
      } else if (Comp.obj.isObject(a) && Comp.obj.isFunction(f)) {
        // Objects can be filtered (on first level), too!
        res={};
        for(p in a) {
          v=f(a[p],p);
          if (v != undefined) res[p]=v;
        }
        return res;
      } else return undefined;   
    },
    merge : function (a,b) {
      if (Comp.obj.isMatrix(a) && Comp.obj.isArray(b)) {
        a=a.map(function (row,i) { var _row=row.slice(); _row.push(b[i]); return _row })
      }
      return a
    },
    neg:      Aios.aios0.neg,
    get node ()   { return shell.node },
    get nodes ()  { if (!shell.options.gui.simu) return; return shell.options.gui.simu.world.nodes.map(function (node) { return node.id }) },
    set node (n)  { return shell.node = n },
    object:   Aios.aios0.object,
    ofJSON:  function (s) {
      return Aios.Code.Jsonf.parse(s,{})
    },
    pluck: function (table,column) {
      var res=[];
      for(var i in table) {
        res.push(table[i][column]);
      }
      return res;
    },
    Port:     Aios.Sec.Port,
    Private:  Aios.Sec.Private,
    random:   Aios.aios.random,
    reduce:   Aios.aios0.reduce,
    reverse:  Aios.aios0.reverse,
    Rights:   Aios.Sec.Rights,
    save : function (file,o,csv) {
      if (csv && env.csv) {
        env.csv.write(file,o[0],o.slice(1));
      } else Io.write_file(file,env.toJSON(o))
    },
    script: function (file) {
      var text=Io.read_file(file);
      if (typeof text != 'string') text=text.toString();
      shell.process(text);
    },
    select : function (data,a,b) {
      if (b==undefined) {
        return data.map(function(object) {
          return object[a];
        });
      } else {
        return data.map(function(object) {
          return object.slice(a,b+1);
        });      
      }
    },
    Time:   Io.Time,
    toJSON:  function (o) {
      // return self.jam.Aios.Code.minimize(
      return Aios.Json.stringify(o)
    },
    url: {
      toAddr:   Aios.Amp.url2addr,
      fromAddr: Aios.Amp.addr2url,      
    },
    utime : function () {  hr=process.hrtime(); return hr[0]*1E9+hr[1] },
    get world ()  { return shell.options.gui.simu.world },
  },
  node : null,
  options : {
    jam:null,
    output: console.log.bind(console),
  },
  output : function (line) {
    var msg;
    switch (typeof line) {
      case 'boolean':   msg=line.toString(); break;
      case 'string':    msg=line; break;
      case 'number':    msg=line.toString(); break;
      case 'function':  msg=line.toString(); break;
      case 'object':    msg=Io.inspect(line); break;
      default: msg='';
    }

    shell.options.output(msg);
  },
  
  process : function (line) {
    var self=shell;
    with(this.env) {
        try { self.output(eval(line)); } catch (e) {
          if (e.stack) {
            var line = e.stack.toString().match(/<anonymous>:([0-9]+):([0-9]+)\)/)
            self.output(e.toString()+(line?', at line '+line[1]:''));
          } else  self.output(e.toString())
          if (self.options.verbose>1) self.output(Io.sprintstack(e)); }
    }  
  },
  tasks:[],
}

function winShell(opts) {
    opts = opts || {};
    var options = {
      cmd : null,
      name : "jam",
      nameopts : {length:8, memorable:true, lowercase:true},
      Nameopts : {length:8, memorable:true, uppercase:true},
      log : { Time: false, Network: false },
      output : printAnswer,
      server : true,
      gui:gui,
      Io:opts.Io,
    }

    // http://www.squarefree.com/shell/shell.html
    var
        histList = [""],
        histPos = 0,
        _scope = {},
        _win, // a top-level context
        question,
        _in,
        _out,
        _scroll,
        _inited=false,
        tooManyMatches = null,
        lastError = null;

    function refocus() {
        if (!_in) return;
        _in.blur(); // Needed for Mozilla to scroll correctly.
        _in.focus();
    }
    
    function scrollToBottom(id){
      var div = document.getElementById(id);
      div.scrollTop = div.scrollHeight - div.clientHeight;
    }


    function setup () {
    }
    
    function init(input, output, scroll) {
        if (_inited) return;
        _inited=true;
        if (input) _in = document.getElementById(input);
        _out = document.getElementById(output);
        _scroll = scroll;
        _win = window;

        if (opener && !opener.closed) {
            // println("Using bookmarklet version of shell: commands will run in opener's context.", "message");
            _win = opener;
        }

        initTarget();

        recalculateInputHeight();
        refocus();
        
        options.shell= shell;
        shell.options = {
          gui : options.gui,
          output:printAnswer,
        }
        options.cmd   = {
          exec : function (line) {
            shell.process(line)
          }
        }        
    }

    function initTarget() {
        _win.Shell = window;
        _win.print = shellCommands.print;
    }


    // Unless the user is selected something, refocus the textbox.
    // (requested by caillon, brendan, asa)
    function keepFocusInTextbox(e) {
        var g = e.srcElement ? e.srcElement : e.target; // IE vs. standard

        while (!g.tagName)
            g = g.parentNode;
        var t = g.tagName.toUpperCase();
        if (t == "A" || t == "INPUT")
            return;

        if (window.getSelection) {
            // Mozilla
            if (String(window.getSelection()))
                return;
        } else if (document.getSelection) {
            // Opera? Netscape 4?
            if (document.getSelection())
                return;
        } else {
            // IE
            if (document.selection.createRange().text)
                return;
        }

        refocus();
    }

    function inputKeydown(e) {
        // Use onkeydown because IE doesn't support onkeypress for arrow keys

        //alert(e.keyCode + " ^ " + e.keycode);

        if (e.shiftKey && e.keyCode == 13) { // shift-enter
            // don't do anything; allow the shift-enter to insert a line break as normal
        } else if (e.keyCode == 13) { // enter
            // execute the input on enter
            try {
                go();
            } catch (er) {
                alert(er);
            };
            setTimeout(function() {
                _in.value = "";
            }, 0); // can't preventDefault on input, so clear it later
        } else if (e.keyCode == 38) { // up
            // go up in history if at top or ctrl-up
            if (e.ctrlKey || caretInFirstLine(_in))
                hist(true);
        } else if (e.keyCode == 40) { // down
            // go down in history if at end or ctrl-down
            if (e.ctrlKey || caretInLastLine(_in))
                hist(false);
        } else if (e.keyCode == 9) { // tab
            tabcomplete();
            setTimeout(function() {
                refocus();
            }, 0); // refocus because tab was hit
        } else {}

        setTimeout(recalculateInputHeight, 0);

        //return true;
    };

    function caretInFirstLine(textbox) {
        // IE doesn't support selectionStart/selectionEnd
        if (textbox.selectionStart == undefined)
            return true;

        var firstLineBreak = textbox.value.indexOf("\n");

        return ((firstLineBreak == -1) || (textbox.selectionStart <= firstLineBreak));
    }

    function caretInLastLine(textbox) {
        // IE doesn't support selectionStart/selectionEnd
        if (textbox.selectionEnd == undefined)
            return true;

        var lastLineBreak = textbox.value.lastIndexOf("\n");

        return (textbox.selectionEnd > lastLineBreak);
    }

    function recalculateInputHeight() {
        if (!_in) return;
        var rows = _in.value.split(/\n/).length +
            1 // prevent scrollbar flickering in Mozilla
            +
            (window.opera ? 1 : 0); // leave room for scrollbar in Opera

        if (_in.rows != rows) // without this check, it is impossible to select text in Opera 7.60 or Opera 8.0.
            _in.rows = rows;
    }

    function loadScript(url, callback) {

        var script = document.createElement("script")
        script.type = "text/javascript";

        if (script.readyState) { //IE
            script.onreadystatechange = function() {
                if (script.readyState == "loaded" ||
                    script.readyState == "complete") {
                    script.onreadystatechange = null;
                    callback();
                }
            };
        } else { //Others
            script.onload = function() {
                callback();
            };
        }

        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    }

    function get(url, callback) {
        // read text from URL location
        var request = new XMLHttpRequest();

        request.open('GET', url, true);
        request.send(null);
        request.onreadystatechange = function() {
            if (request.status==0) {
              println('No connection to LUAOS.');
              if (_listener) clearInterval(_listener);
            } else if (request.readyState === 4) {
                var type = request.getResponseHeader('Content-Type');
                if (type && type.indexOf("text") !== 1) {
                    callback(request.responseText);
                }
            }
        }
    }

    function put(url, data, callback) {
        // write text to URL location
        var request = new XMLHttpRequest();
        request.open('POST', url, true);
        request.send(data);
        request.onreadystatechange = function(err) {
            if (request.status==0) {
              println('No connection to LUAOS.');
              if (_listener) clearInterval(_listener);
            } else if (request.readyState === 4 && request.status === 200) {
                callback(request.responseText);
            }
        }
    }

    function println(s, type, time) {
        if ((s = String(s))) {
            var newdiv = document.createElement("div");
            newdiv.innerHTML=
              (time?'<span style="color:green">'+options.Io.Time()+'</span> ':'')+
              s.replace(/&/g,'&amp;')
               .replace(/\t/g,'    ')
               .replace(/</g,'&lt;')
               .replace(/>/g,'&gt;')
               .replace(/\n/g,'<br>\n')
               .replace(/\s/g,'&nbsp;')
            newdiv.className = type;
            _out.appendChild(newdiv);
            if (_scroll && _scroll.scrollAuto) {
              var scPos = _scroll.getScrollState();
              _scroll.scrollTo(0,scPos.y+500);
            }
            return newdiv;
        }
    }

    function printWithRunin(h, s, type) {
        var div = println(s, type);
        var head = document.createElement("strong");
        head.appendChild(document.createTextNode(h + ": "));
        div.insertBefore(head, div.firstChild);
    }

    function iter(a, func) {
        for (var p in a) func(a[p])
    }


    var shellCommands = {
        load: function load(url) {
            var s = _win.document.createElement("script");
            s.type = "text/javascript";
            s.src = url;
            _win.document.getElementsByTagName("head")[0].appendChild(s);
            println("Loading " + url + "...", "message");
        },

        clear: function clear() {
            var CHILDREN_TO_PRESERVE = 0;
            while (_out.childNodes[CHILDREN_TO_PRESERVE])
                _out.removeChild(_out.childNodes[CHILDREN_TO_PRESERVE]);
        },

        code: function code(index) {
            if (location.href.split('?').length == 1) return;
            var params = location.href.split('?')[1].split('&');
            var data = {},
                i = 1,
                file;

            for (var x in params) {
                data[params[x].split('=')[0]] = params[x].split('=')[1];
                if (i == index) file = data[params[x].split('=')[0]];
                i++;
            }
            if (file) {
                get('code/' + file, function(text) {
                    go(text)
                });
            }
        },

        codes: function codes() {
            if (location.href.split('?').length == 1) return;
            var params = location.href.split('?')[1].split('&');
            var data = {};

            for (var x in params) {
                data[params[x].split('=')[0]] = params[x].split('=')[1];
            }
            return data;
        },

        getResult: function getResult() {
            get(URL, function(reply) {
                printAnswer(reply);
            });
        },

        help: function help(topic) {


            printWithRunin("Features", "autocompletion of property names with Tab,");
            printWithRunin("Features", "multiline input with Shift+Enter, input history with (Ctrl+) Up/Down");

        },

        print: function print(s) {
            println(s, "print");
        },

        reset: function reset() {
            put(URL, ':reset');
        },

        // the normal function, "print", shouldn't return a value
        // (suggested by brendan; later noticed it was a problem when showing others)
        pr: function pr(s) {
            shellCommands.print(s); // need to specify shellCommands so it doesn't try window.print()!
            return s;
        },

        props: function props(e, onePerLine) {
            if (e === null) {
                println("props called with null argument", "error");
                return;
            }

            if (e === undefined) {
                println("props called with undefined argument", "error");
                return;
            }

            var ns = ["Methods", "Fields", "Unreachables"];
            var as = [
                [],
                [],
                []
            ]; // array of (empty) arrays of arrays!
            var p, j, i; // loop variables, several used multiple times

            var protoLevels = 0;

            for (p = e; p; p = p.__proto__) {
                for (i = 0; i < ns.length; ++i)
                    as[i][protoLevels] = [];
                ++protoLevels;
            }

            for (var a in e) {
                // Shortcoming: doesn't check that VALUES are the same in object and prototype.

                var protoLevel = -1;
                try {
                    for (p = e; p && (a in p); p = p.__proto__)
                        ++protoLevel;
                } catch (er) {
                    protoLevel = 0;
                } // "in" operator throws when param to props() is a string

                var type = 1;
                try {
                    if ((typeof e[a]) == "function")
                        type = 0;
                } catch (er) {
                    type = 2;
                }

                as[type][protoLevel].push(a);
            }

            function times(s, n) {
                return n ? s + times(s, n - 1) : "";
            }

            for (j = 0; j < protoLevels; ++j)
                for (i = 0; i < ns.length; ++i)
                    if (as[i][j].length)
                        printWithRunin(
                            ns[i] + times(" of prototype", j),
                            (onePerLine ? "\n\n" : "") + as[i][j].sort().join(onePerLine ? "\n" : ", ") + (onePerLine ? "\n\n" : ""),
                            "propList"
                        );
        },

        blink: function blink(node) {
            if (!node) throw ("blink: argument is null or undefined.");
            if (node.nodeType == null) throw ("blink: argument must be a node.");
            if (node.nodeType == 3) throw ("blink: argument must not be a text node");
            if (node.documentElement) throw ("blink: argument must not be the document object");

            function setOutline(o) {
                return function() {
                    if (node.style.outline != node.style.bogusProperty) {
                        // browser supports outline (Firefox 1.1 and newer, CSS3, Opera 8).
                        node.style.outline = o;
                    } else if (node.style.MozOutline != node.style.bogusProperty) {
                        // browser supports MozOutline (Firefox 1.0.x and older)
                        node.style.MozOutline = o;
                    } else {
                        // browser only supports border (IE). border is a fallback because it moves things around.
                        node.style.border = o;
                    }
                }
            }

            function focusIt(a) {
                return function() {
                    a.focus();
                }
            }

            if (node.ownerDocument) {
                var windowToFocusNow = (node.ownerDocument.defaultView || node.ownerDocument.parentWindow); // Moz vs. IE
                if (windowToFocusNow)
                    setTimeout(focusIt(windowToFocusNow.top), 0);
            }

            for (var i = 1; i < 7; ++i)
                setTimeout(setOutline((i % 2) ? '3px solid red' : 'none'), i * 100);

            setTimeout(focusIt(window), 800);
            if (_in) setTimeout(focusIt(_in), 810);
        },


        ans: undefined
    };


    function hist(up) {
        // histList[0] = first command entered, [1] = second, etc.
        // type something, press up --> thing typed is now in "limbo"
        // (last item in histList) and should be reachable by pressing
        // down again.

        var L = histList.length;

        if (L == 1)
            return;

        if (up) {
            if (histPos == L - 1) {
                // Save this entry in case the user hits the down key.
                histList[histPos] = _in.value;
            }

            if (histPos > 0) {
                histPos--;
                // Use a timeout to prevent up from moving cursor within new text
                // Set to nothing first for the same reason
                setTimeout(
                    function() {
                        _in.value = '';
                        _in.value = histList[histPos];
                        var caretPos = _in.value.length;
                        if (_in.setSelectionRange)
                            _in.setSelectionRange(caretPos, caretPos);
                    },
                    0
                );
            }
        } else // down
        {
            if (histPos < L - 1) {
                histPos++;
                _in.value = histList[histPos];
            } else if (histPos == L - 1) {
                // Already on the current entry: clear but save
                if (_in.value) {
                    histList[histPos] = _in.value;
                    ++histPos;
                    _in.value = "";
                }
            }
        }
    }

    function tabcomplete() {
        /*
         * Working backwards from s[from], find the spot
         * where this expression starts.  It will scan
         * until it hits a mismatched ( or a space,
         * but it skips over quoted strings.
         * If stopAtDot is true, stop at a '.'
         */
        function findbeginning(s, from, stopAtDot) {
            /*
             *  Complicated function.
             *
             *  Return true if s[i] == q BUT ONLY IF
             *  s[i-1] is not a backslash.
             */
            function equalButNotEscaped(s, i, q) {
                if (s.charAt(i) != q) // not equal go no further
                    return false;

                if (i == 0) // beginning of string
                    return true;

                if (s.charAt(i - 1) == '\\') // escaped?
                    return false;

                return true;
            }

            var nparens = 0;
            var i;
            for (i = from; i >= 0; i--) {
                if (s.charAt(i) == ' ')
                    break;

                if (stopAtDot && s.charAt(i) == '.')
                    break;

                if (s.charAt(i) == ')')
                    nparens++;
                else if (s.charAt(i) == '(')
                    nparens--;

                if (nparens < 0)
                    break;

                // skip quoted strings
                if (s.charAt(i) == '\'' || s.charAt(i) == '\"') {
                    //dump("skipping quoted chars: ");
                    var quot = s.charAt(i);
                    i--;
                    while (i >= 0 && !equalButNotEscaped(s, i, quot)) {
                        //dump(s.charAt(i));
                        i--;
                    }
                    //dump("\n");
                }
            }
            return i;
        }

        // XXX should be used more consistently (instead of using selectionStart/selectionEnd throughout code)
        // XXX doesn't work in IE, even though it contains IE-specific code
        function getcaretpos(inp) {
            if (inp.selectionEnd != null)
                return inp.selectionEnd;

            if (inp.createTextRange) {
                var docrange = _win.Shell.document.selection.createRange();
                var inprange = inp.createTextRange();
                if (inprange.setEndPoint) {
                    inprange.setEndPoint('EndToStart', docrange);
                    return inprange.text.length;
                }
            }

            return inp.value.length; // sucks, punt
        }

        function setselectionto(inp, pos) {
            if (inp.selectionStart) {
                inp.selectionStart = inp.selectionEnd = pos;
            } else if (inp.createTextRange) {
                var docrange = _win.Shell.document.selection.createRange();
                var inprange = inp.createTextRange();
                inprange.move('character', pos);
                inprange.select();
            } else { // err...
                /*
                  inp.select();
                  if(_win.Shell.document.getSelection())
                    _win.Shell.document.getSelection() = "";
                    */
            }
        }
        // get position of cursor within the input box
        var caret = getcaretpos(_in);

        if (caret) {
            //dump("----\n");
            var dotpos, spacepos, complete, obj;
            //dump("caret pos: " + caret + "\n");
            // see if there's a dot before here
            dotpos = findbeginning(_in.value, caret - 1, true);
            //dump("dot pos: " + dotpos + "\n");
            if (dotpos == -1 || _in.value.charAt(dotpos) != '.') {
                dotpos = caret;
                //dump("changed dot pos: " + dotpos + "\n");
            }

            // look backwards for a non-variable-name character
            spacepos = findbeginning(_in.value, dotpos - 1, false);
            //dump("space pos: " + spacepos + "\n");
            // get the object we're trying to complete on
            if (spacepos == dotpos || spacepos + 1 == dotpos || dotpos == caret) {
                // try completing function args
                if (_in.value.charAt(dotpos) == '(' ||
                    (_in.value.charAt(spacepos) == '(' && (spacepos + 1) == dotpos)) {
                    var fn, fname;
                    var from = (_in.value.charAt(dotpos) == '(') ? dotpos : spacepos;
                    spacepos = findbeginning(_in.value, from - 1, false);

                    fname = _in.value.substr(spacepos + 1, from - (spacepos + 1));
                    //dump("fname: " + fname + "\n");
                    try {
                        with(_win.Shell._scope)
                        with(_win)
                        with(shellCommands)
                        fn = eval(fname);
                    } catch (er) {
                        //dump('fn is not a valid object\n');
                        return;
                    }
                    if (fn == undefined) {
                        //dump('fn is undefined');
                        return;
                    }
                    if (fn instanceof Function) {
                        // Print function definition, including argument names, but not function body
                        if (!fn.toString().match(/function .+?\(\) +\{\n +\[native code\]\n\}/))
                            println(fn.toString().match(/function .+?\(.*?\)/), "tabcomplete");
                    }

                    return;
                } else
                    obj = _win;
            } else {
                var objname = _in.value.substr(spacepos + 1, dotpos - (spacepos + 1));
                //dump("objname: |" + objname + "|\n");
                try {
                    with(_win.Shell._scope)
                    with(_win)
                    obj = eval(objname);
                } catch (er) {
                    printError(er);
                    return;
                }
                if (obj == undefined) {
                    // sometimes this is tabcomplete's fault, so don't print it :(
                    // e.g. completing from "print(document.getElements"
                    // println("Can't complete from null or undefined expression " + objname, "error");
                    return;
                }
            }
            //dump("obj: " + obj + "\n");
            // get the thing we're trying to complete
            if (dotpos == caret) {
                if (spacepos + 1 == dotpos || spacepos == dotpos) {
                    // nothing to complete
                    //dump("nothing to complete\n");
                    return;
                }

                complete = _in.value.substr(spacepos + 1, dotpos - (spacepos + 1));
            } else {
                complete = _in.value.substr(dotpos + 1, caret - (dotpos + 1));
            }
            //dump("complete: " + complete + "\n");
            // ok, now look at all the props/methods of this obj
            // and find ones starting with 'complete'
            var matches = [];
            var bestmatch = null;
            for (var a in obj) {
                //a = a.toString();
                //XXX: making it lowercase could help some cases,
                // but screws up my general logic.
                if (a.substr(0, complete.length) == complete) {
                    matches.push(a);
                    ////dump("match: " + a + "\n");
                    // if no best match, this is the best match
                    if (bestmatch == null) {
                        bestmatch = a;
                    } else {
                        // the best match is the longest common string
                        function min(a, b) {
                            return ((a < b) ? a : b);
                        }
                        var i;
                        for (i = 0; i < min(bestmatch.length, a.length); i++) {
                            if (bestmatch.charAt(i) != a.charAt(i))
                                break;
                        }
                        bestmatch = bestmatch.substr(0, i);
                        ////dump("bestmatch len: " + i + "\n");
                    }
                    ////dump("bestmatch: " + bestmatch + "\n");
                }
            }
            bestmatch = (bestmatch || "");
            ////dump("matches: " + matches + "\n");
            var objAndComplete = (objname || obj) + "." + bestmatch;
            //dump("matches.length: " + matches.length + ", tooManyMatches: " + tooManyMatches + ", objAndComplete: " + objAndComplete + "\n");
            if (matches.length > 1 && (tooManyMatches == objAndComplete || matches.length <= 10)) {

                printWithRunin("Matches: ", matches.join(', '), "tabcomplete");
                tooManyMatches = null;
            } else if (matches.length > 10) {
                println(matches.length + " matches.  Press tab again to see them all", "tabcomplete");
                tooManyMatches = objAndComplete;
            } else {
                tooManyMatches = null;
            }
            if (bestmatch != "") {
                var sstart;
                if (dotpos == caret) {
                    sstart = spacepos + 1;
                } else {
                    sstart = dotpos + 1;
                }
                _in.value = _in.value.substr(0, sstart) +
                    bestmatch +
                    _in.value.substr(caret);
                setselectionto(_in, caret + (bestmatch.length - complete.length));
            }
        }
    }

    function printQuestion(q) {
        println(q, "input");
    }

    function printAnswer(a) {
        if (a !== undefined) {
            if (options.linemode) a.split('\n').forEach(function (line,index) { 
              if (opts.cmd && line[0]=='@') {
                opts.cmd(line);
              } else {
                println(line, "normalOutput", options.log.Time && index==0) 
              }
            }); else println(a, "normalOutput", options.log.Time && index==0);
            shellCommands.ans = a;
        }
    }

    function printError(er) {
        var lineNumberString;

        lastError = er; // for debugging the shell
        if (er.name) {
            // lineNumberString should not be "", to avoid a very wacky bug in IE 6.
            lineNumberString = (er.lineNumber != undefined) ? (" on line " + er.lineNumber + ": ") : ": ";
            println(er.name + lineNumberString + er.message, "error"); // Because IE doesn't have error.toString.
        } else
            println(er, "error"); // Because security errors in Moz /only/ have toString.
    }

    function go(s) {
        _in.value = question = s ? s : _in.value;

        if (question == "")
            return;

        histList[histList.length - 1] = question;
        histList[histList.length] = "";
        histPos = histList.length - 1;

        // Unfortunately, this has to happen *before* the JavaScript is run, so that
        // print() output will go in the right place.
        _in.value = '';
        recalculateInputHeight();
        printQuestion(question);

        if (_win.closed) {
            printError("Target window has been closed.");
            return;
        }

        try {
            ("Shell" in _win)
        } catch (er) {
            printError("The JavaScript Shell cannot access variables in the target window.  The most likely reason is that the target window now has a different page loaded and that page has a different hostname than the original page.");
            return;
        }

        if (!("Shell" in _win))
            initTarget(); // silent

        // Evaluate question using _win's eval (this is why eval isn't in the |with|, IIRC).
        // _win.location.href = "javascript:try{ Shell.printAnswer(eval('with(Shell._scope) with(Shell.shellCommands) {' + Shell.question + String.fromCharCode(10) + '}')); } catch(er) { Shell.printError(er); }; setTimeout(Shell.refocus, 0); void 0";
        options.cmd.exec(question)
    }

    function ask(cmd,data,callback) {
      options.cmd.exec(cmd)
    }  
    
    function cmd () {
      return options.cmd
    }
    
    // API
    return {
        ask:ask,
        cmd:cmd,
        commands: shellCommands,
        init: init,
        inputKeydown: inputKeydown,
        options:options,
        print:printAnswer,
        setup:setup
    }
};

module.exports = winShell;
