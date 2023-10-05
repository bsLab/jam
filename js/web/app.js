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
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2021 bLAB
 **    $CREATED:     14-08-17 by sbosse.
 **    $VERSION:     1.8.2
 **
 **    $INFO:
 **
 **     WEB GUI toolkit supporting pages using blessed/curses emulation library.
 **     App layout is similar to mobile application programs.
 **     A set of styles can defined used as default styles for various elements.
 **
 **     type styles = {
 **       button?:{fg?,bg?,border?},
 **       checkbox?:{},
 **       dialog?:{fg?,bg?},
 **       filemanager?:{fg?,bg?,arrows?:{fg?,bg?},border?,box:{bg?,border?},
 **                     label?:{fg?,bg?},input?:{fg?,bg?}},
 **       input:{fg?,bg?,border?,label?},
 **       keyboard?:{bg?,border?,label?:{fg,bg}},
 **       label:{bold?,fg?,bg?},
 **       
 **   New: App Builder from compact template
 **
 **  Template (builder) Type Interface
 **  =================================
 **
 **  (@: smybolic identifier, parameter name, or wildcard place holder, $: type macro, ?:optional, ..:more,
 **   st {a,b,..}: sub type of object type st)
 **  
 **   typeof @border = { type? : string = 'line'|'none'|.., fg:string is color, .. }
 **    
 **   typeof @styles = {
 **     button?: { fg?, bg?, border? },
 **     input?:  { border? },
 **     tree?:   { border? },
 **     ..,
 **     @customstyle : { .. },
 **     ..
 **   }
 **
 ** Widget event handler:
 **
 ** type handler = function (wname:string,wval:boolean|number|string)
 ** type handlerT = function (wname:string,label:string,path:string,data:{name:string,parent:node,..})
 ** type handlerL = function (wname:string,label:string,data:{content:string,..})
 ** type handler1 = function (wname:string) is check handler
 ** type handlerp = function (pname:string) is page handler
 ** type handlerd = function (wname:string,data:*)
 **
 ** Widget styles and attributes:
 **
 ** $pos = top:number | left:number | right:number | center:boolean
 ** $geom = width:number | hight:number
 ** $cstyle = fg:string | bg:string 
 **
 ** Widget descriptor types:
 **
 ** type button =     { type='button', $pos?, $geom?, content:string, $cstyle, .. , onclick?:handler }
 ** type label =      { type='label', $pos?, $geom?,content:string, .. }
 ** type info =       { type='info', $pos?, $geom?, label:string, value?:string, .. }
 ** type checkbox =   { type='checkbox', $pos?, $geom?, text:string, value:string, .. , onclick?:handler, on?: on {check,uncheck} }
 ** type input =      { type='input', $pos, $geom?, wrap?:boolean, label:string, value?:string, onchange?:handler, .. }
 ** type radiobutton = { type='radiobutton', $pos, $geom?, .. }
 ** type group =      { type='group', name?:string, @but1:radiobutton, @but2:radiobutton, .., onclick?:handler }
 ** type tree =       { type='tree', $pos, $geom, .. ,  onclick?:handlerT }
 ** type list =       { type='list', depth?:number, $pos, $geom, .. , onclick?:handlerL }
 **
 ** type widget = button | label | checkbox | input | group | tree | ..
 **
 ** The builder creates widget objects from descriptors that can be accessed by App.pages.@name.
 **
 ** method (object of info).update (string) 
 ** method (object of tree).update ({}) 
 ** method (object of info).update (string) 
 ** method (object of info).setValue (string) 
 ** method (object of input).getValue () 
 ** method (object of widget).setStyle ({})
 **
 ** type on = { click?:handler|string, onclick?:handler|string, 
 **             check?:handler1, uncheck?:handler1, 
 **             keypress:{key: string | string [], handler: fucntion (@char,@key)] [],
 **             selected?:handlerd, change?:handler,
 **             show?:handlerp, hide?: handlerp }
 ** 
 ** $pageparam = next:string | prev:string | on: on {show,hide} | show:function | hide:function
 ** $widget = @name : widget
 **
 ** typeof content = {
 **   pages : { main: { $widget, $widget, .. , $pageparam, $pageparam, .. }, @p2: { @widget, .. }, .. }
 **   info?: {}
 ** }
 **
 ** App creation (w/o builder, programmatically):
 ** ============================================
 **
 **   var ui = App.App({
 **     pages   : number,
 **     styles  : {},
 **     terminal: '',
 **     title   : string
 **   });
 **   ui.pages[index]={
 **     id$    : ui.<constructor>(options),
 **   }
 **   ui.pages[index]["$id"].on(event,handler)
 **
 **   ui.start(main?)
 **
 ** Supported Widget Constructors 
 ** =============================
 **
 **    Button:   button({left,right,top,width,height:number,content:string, action:function|navigation string, styles,....}) -> button
 **    Chat Dialog:  chat({left,right,top,width,height:number,prompt:string,label:string,bot:style,user:style, styles,.. }}
 **    Checkbox: checkbox(left,right,top,width,height:number,content:string, value:boolean, action:function, styles,....})
 **    Info:     info({left,right,top,bottom,width,height:number,multiline:boolean,wrap:boolean,label:string, styles,.. }}
 **    Input:    input({left,right,top,width,height:number,multiline:boolean,wrap:boolean,label:string, styles,..}}
 **    Label:    label({left,right,top,center:boolean, width,height:number,content:string, styles,..}}
 **    Radiobut: radiobutton(left,right,top,width,height:number,content:string, group:number|string, value:boolean, action:function, styles,....})
 **    Status:   status({left,right,top,bottom,width,height:number,multiline:boolean,wrap:boolean,label:string, styles,..}}
 **    Text:     text({left,right,top,width,height:number,multiline:boolean,wrap:boolean,scrollable:boolean,label:string, styles,..}}
 **    Terminal: terminal({left,right,top,width,height:number,prompt:string,label:string, styles,..}}
 ** 
 **    type styles = {fg:string,bg:string, bold:boolean, ..}
 **    type navigation string = 'prev'|'next'|pageid
 **
 **    type checkbox'event = select:boolean 
 **    type radiobutton'event = select:boolean , check:object 
 **    type chat'event = eval:string 
 **    
 **    methods chat = { message:function (string), ask:function(string,options,callback), }
 **    methods input = { setValue:function (string), getValue:function(), }
 **    
 **
 ** ---
 **
 **  Examples (with template builder, see also ui/app/demo2.js)
 **
 **  AppApp = Require('ui/app/app');
 **  App = AppApp.App({});
 **  App.init();
 **  styles = {}
 **  content = { pages : {
 **    main: { 
 **     lab1: {type:'label',  center:true, top:1, content:'Menu'},
 **     but1: {type:'button', left:1,  content:'QAppT',  bg:'red', onclick: process.exit },
 **     but2: {type:'button', right:1, content:'SETUP', onclick:'setup' },
 **    },
 **    setup: {  
 **     lab1: {type:'label',  center:true, top:1, content:'Menu'},
 **     but1: {type:'button', left:1,  content:'<< MENU',  onclick:'main' },
 **    }
 **  }}
 **  App.builder(styles,content)
 **  App.start()
 **
 ** ----------------------
 **
 **  Examples (without builder, programmatically):
 **
 **   ui=AppApp.App({
 **     pages:7,
 **     terminal:this.options.terminal||'xterm-color',
 **     title:'JAMAPP (C) Stefan Bosse'
 **   });
 **   ui.init(); 
 **   page=ui.pages[1];
 **   page.b1= ui.button({left:1,content:'QAppT'});
 **   page.b1.on('press', function(data) {
 **    return process.exit(0);  
 **   });   
 **   page.l1 = ui.label({center:true,top:1,content:'Menu'});
 **   page.b2 = ui.button({right:1,content:'SETUP'});
 **   page.b2.on('press', function(data) {
 **     ui.pages.hide(1);    
 **     ui.pages.show(2);
 **   });
 **   // or
 **   page.b2.on('press', function(data) {
 **     ui.pages.hide();  
 **     ui.pages.show('next');
 **   });
 **
 **   page.l2 = ui.label({center:true,top:1,content:'Setup'});
 **   page.i1 = ui.input({top:4,left:4,label:'Broker IP Address',value:'localhost'});
 **   page.i1.setValue('127.0.0.1');
 **   url=page.i1.getValue();
 **
 **   page.i4 = ui.info({top:16,left:4,width:ui.screen.width-8,label:'JAM Status'});
 **
 **   page.l2 = ui.label({left:4,top:16,content:'Protocol'});
 **   page.ch21 = ui.radiobutton({left:4,top:18,text:'HTTP',value:false,group:2});
 **   page.ch22 = ui.radiobutton({left:4,top:20,text:'TCPIP',value:true,group:2});
 **
 **   page.l3 = ui.label({left:4,top:22,content:'Messages'});
 **   page.ch31 = ui.checkbox({left:4,top:24,text:'Agent ID',value:false});
 **   page.ch32 = ui.checkbox({left:4,top:26,text:'Parent ID',value:false});
 **
 **    $ENDOFINFO
 */
/** Main User Interface providing a multiple page view
 *  Events: pages -> 'load'
 *  typeof options = {pages,terminal,forceCursor,styles}
*/ 

/* GUI => ui.js => blessed emulation */

var options = {
  version: '1.8.2'
}

/** pre-defined layouts based on screen rows and columns
 *
 */
var LAYOUT = {
  SMALL:'small',
  NORMAL:'normal',
  LARGE:'large',
  XLARGE:'xlarge',
  PORTRAIT:'portrait',
  LANDSCAPE:'landscape',
  from: function (screen) {
    if (screen.width>screen.height) {
      if(screen.width<70) return {small:true,landscape:true};
      else return {normal:true,landscape:true};
    } else {
      if(screen.height<70) return {small:true,portrait:true};
      else return {normal:true,portrait:true};
    } 
  }
}

function App(options) {
  var self=this,i;
  if (!(this instanceof App)) {
    return new App(options);
  }
  this.options=options||{};
  if (!this.options.pages) this.options.pages=1;
  if (!this.options.terminal) {
    this.options.terminal=
      (process.platform === 'win32' ? 'windows-ansi' : 'xterm-color');
  }
  if (this.options.forceCursor==undefined) this.options.forceCursor=true;
  
  this.page = 1;
  this.pages = [];           // Pages
  this.static = {};          // Top-level widegts visible on all pages
  this.styles=options.styles||{};
  
  for(i=0;i<=this.options.pages;i++) {
    this.pages.push({});
  }
  this.pages.show = function (page) {
    var thepage,p,current=self.page;
    switch (page) {
      case 'prev': 
        if (self.pages[self.page] && self.pages[self.page].prev) page=self.pages[self.page].prev;
        else if (self.pages[self.page-1]) page=self.page-1;
        break;
      case 'next': 
        if (self.pages[self.page] && self.pages[self.page].next) page=self.pages[self.page].next; 
        else if (self.pages[self.page+1]) page=self.page+1;
        break;
      case 'this': 
      case undefined:
        page=self.page; break;
    }
    thepage=self.pages[page];
    if (self.events[page] && self.events[page]['load'])
      self.events[page]['load']();
    for (p in thepage) {
      if (thepage[p] && thepage[p].show && !thepage[p].noshow) thepage[p].show();
    }
    self.screen.render();
    self.page=page;
  };
  this.pages.hide = function (page) {
    var thepage,p;
    if (page=='this' || page==undefined) page=self.page;
    thepage=self.pages[page];
    for (p in thepage) 
      if (thepage[p] && thepage[p].hide) thepage[p].hide();
    // hide cursor
    if (self.options.terminal.indexOf('xterm') != -1 && self.options.forceCursor)
       self.screen.program.hideCursor(true);
  };
  this.events=[];
  this.pages.on = function(page,event,callback) {
    if (!self.events[page]) self.events[page]=[];
    self.events[page][event]=callback;
  }
}

/** Button widget
 *  Methods: on
 *  Events: 'press'
 *  typeof @options ={
 *    width,content,center,left,right,top,
 *    fg is textcolor,bg is button color,border,
 *    click:function, 
 *    action:function|string
 *   }
 */
App.prototype.button = function(options) {
  var self=this,width=options.width;
  if (Comp.obj.isString(options.width)) {
    // relative value in %!
    width=Comp.pervasives.int_of_string(options.width);
    width=this.screen.width*width/100;
  }
  var obj = GUI.button({
    width: options.width||(options.content.length+4),
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top||0,
    height: 3,
    align: 'center',
    content: options.content||'?',
    mouse:true,
    focus:false,
    border: options.border||this.getStyle('button.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('button.fg','white'),
      bg: options.bg||this.getStyle('button.bg','blue'),
      bold:true,
      border: {
        fg: this.getStyle('button.border.fg','black'),
        bg: this.getStyle('button.border.bg',undefined),
      },
      hover: {
        border: {
          fg: 'red'
        }
      }
    }  
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  // generic handler
  if (options.click) obj.on('press',options.click);
  // dedicated action handlers with page navigation support
  if (options.action) {
    switch (typeof options.action) {
      case 'function': obj.on('press',options.action); break;
      case 'string': 
        if (options.action=='next' || options.action=='prev') {
          obj.on('press',function () {
            if (self.pages[self.page][options.action]) {
              self.pages.hide('this');
              self.pages.show(self.pages[self.page][options.action]);
            }
          });
        } else {
         obj.on('press',function () {
            if (self.pages[options.action]) {
              self.pages.hide('this');
              self.pages.show(options.action);
            }
          });
        
        }
        break;
    }
  }
  return obj;
}

/** Chat terminal shell widget
 * typeof options = {top,left,right,width,height,label:string,bot:style,user:style,fg:style,bg:style}
 */
App.prototype.chat = function(options) {
  var self=this, width=options.width||(this.screen.width-(options.left*2||2));
  options.scrollable=true;
  options.scrollbar = {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          fg: 'cyan',
          inverse: true
        }
      };
      options.mouse=true;
  var obj = GUI.chat({
    label: options.label||'My Text',
    value: options.value||'',
    //fg: 'blue',
    bg: 'default',
    barBg: 'default',
    barFg: 'blue',
    width: width,
    height: options.height||8,
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top||0,
    keys: true,
    vi: false,
    mouse: true,
    inputOnFocus: true,
    tags:true,
    focus:true,
    wrap        : options.wrap,
    multiline   : true,
    scrollbar   : options.scrollbar,
    scrollable  : options.scrollable,
    //draggable:true,
    prompt:options.prompt,
    border: this.getStyle('input.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('input.fg','blue'),
      bg: options.bg||this.getStyle('input.bg',undefined),
      user : options.user,
      bot  : options.bot,
      border: {
        fg: this.getStyle('input.border.fg','black'),
        bg: this.getStyle('input.border.bg',undefined),
      },
      label:this.getStyle('input.label',undefined),
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  obj.on('focus',function () {
    if (!self.options.keyboard) // show cursor
      return self.options.terminal.indexOf('xterm')!=-1 && self.options.forceCursor?
             self.screen.program._write('\x1b[?12;25h'):0; 
    if (!self._keyboard) 
      self._keyboard=self.keyboard({
        width:self.screen.width<60?'100%':'80%',
        height:self.layout.small?'100%':'90%',
        compact:self.layout.small
      });
    self._keyboard.setCallback(function (v) {if (v) obj.setValue(v),obj.update();});
    self._keyboard.setValue(obj.getValue());
    self._keyboard.setLabel(obj.getLabel());
    self._keyboard.show();
  });
  return obj;
}

/** Checkbox widget
 *  Methods: on
 *  Events: 'check','uncheck'
 *  typeof @options ={value?,left?,right?,top?,text,hidden?}
 */
App.prototype.checkbox = function(options) {
  var obj = GUI.checkbox({
    checked: options.value||false,  
    left: options.left,
    right : options.right,
    top: options.top||0,
    mouse: true,
    inputOnFocus: true,
    height: 1,
    text:options.text||'empty'
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Dialog pop-up window widget
 *
 *  typeof @options = {width,height,center?,left?,right?,top?,okButton?,cancelButton}
 */
App.prototype.dialog = function(options) {
  var width=options.width,height=options.height;
  if (Comp.obj.isString(options.width)) {
    // relative value in %!
    width=Comp.pervasives.int_of_string(options.width);
    width=int(this.screen.width*width/100);
  }
  if (Comp.obj.isString(options.height)) {
    // relative value in %!
    height=Comp.pervasives.int_of_string(options.height);
    height=int(this.screen.height*height/100);
  }
  var obj = GUI.Question({
    width: width,
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top||(options.center?int(this.screen.height/2-height/2):0),
    height: height,
    noshow:true,
    okButton     : options.okButton||'Okay',
    cancelButton : options.cancelButton,
    style: {
      bg:this.getStyle('dialog.bg','red'),
      fg:this.getStyle('dialog.fg','white'),
      bold:true
    }  
  });
  this.screen.append(obj);
  return obj;
}

/** File manager widget with buttons
 *
 *  typeof @options={fg?,bg?,parent?,border?,label?,height?,width?,top?,left?,autohide?,
 *                   okayBotton?,cancelButton?,input?,box?,arrows?}
 */
App.prototype.fileManager = function(options) {
  if (options.box) {
    options.box.border=this.getStyle('filemanager.box.border',options.box.border);
    options.box.bg=this.getStyle('filemanager.box.bg',options.box.bg);
    options.input=this.getStyle('filemanager.input',options.input);
  }
  if (options.arrows) {
    options.arrows.fg=this.getStyle('filemanager.arrows.fg',options.arrows.fg);
    options.arrows.bg=this.getStyle('filemanager.arrows.bg',options.arrows.bg);
  }
  var obj = GUI.FileManager({
    parent:options.parent,
    border:options.border||this.getStyle('filemanager.border',{}),
    style: {
      fg: options.fg||this.getStyle('filemanager.fg',undefined),
      bg: options.bg||this.getStyle('filemanager.bg',undefined),
      label:options.label||this.getStyle('filemanager.label',undefined),
      selected: {
        bg: 'blue',
        fg:'white'
      },
      focus: {
        border: {
          fg: 'red'
        }
      }
    },
    height: options.height||'half',
    width: options.width||'half',
    top: options.top||'center',
    left: options.left||'center',
    label: '%path',
    cwd: options.cwd||process.env.PWD||process.env.CWD||process.env.HOME,
    autohide:options.autohide,
    hidden:options.hidden,
    noshow:options.hidden, // no show on page load
    keys: true,
    vi: true,
    scrollbar: {
      bg: 'white',
      ch: ' '
    },
    okayButton:options.okayButton||'OK',
    cancelButton:options.cancelButton||'Cancel',
    input:options.input,
    arrows:options.arrows,
    box:options.box,
    border:this.getStyle('filemanager.border',undefined)
  });
  
  this.screen.append(obj);
  return obj;
}

/** Filter supported widget options, transform special options (click,..). Used by page builder.
 *
 */
App.prototype.filterOptions = function(options,wname) {
  var self=this,attr,wopts = {};
  for (attr in options) {
    switch (attr) {
      case 'type':
      case 'index':
        break;
      case 'on':
        switch (options.type) {
          case 'button' :
            if (options.on.click && typeof options.on.click == 'function') 
              wopts.click=function () { options[attr](wname) };
            if (options.on.onclick && typeof options.on.onclick == 'function') 
              wopts.click=function () { options[attr](wname) };
            break;
        }
        break;
      case 'click':
      case 'onclick':
        switch (options.type) {
          case 'button' :
            if (typeof options[attr] == 'string') // Its a page destination; show new page
              wopts.click=function () {
                if (!self.pages[options[attr]]) return;
                self.pages.hide('this');    
                self.pages.show(options[attr]);
              };
            else
              wopts.click=options[attr];
            break;
        }
        break;
      default:
        wopts[attr]=options[attr];
    }
  }
  return wopts;
}

/** getStyle
 *
 */
App.prototype.getStyle = function(attr,def) {
  var path=attr.split('.'),elem,style=this.styles;
  while(path.length && style) {
    elem=path.shift();
    style=style[elem];
  }
  return style!=undefined?style:def;
}

/** Information message widget
 * Methods: setValue
 * typeof options = {width,top,left,right, height,label,wrap,multiline,scrollable,color}
 */
App.prototype.info = function(options) {
  var width=options.width;
  if (Comp.obj.isString(options.width)) {
    // relative value in %!
    width=Comp.pervasives.int_of_string(options.width);
    width=this.screen.width*width/100;
  }
  if (options.scrollable && !options.scrollbar) {
      options.scrollbar = {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          fg: 'cyan',
          inverse: true
        }
      };
      options.mouse=true;
  }
  var obj = GUI.textbox({
    top   : options.top||1,
    left  : (options.center?int(this.screen.width/2-width/2):options.left||(options.right?undefined:1)),
    right : options.right,
    width : options.width||(this.screen.width-(options.left*2||2)),
    height: options.height||3,
    label : options.label,
    value : options.value||'',
    focus : true,
    wrap  : options.wrap,
    multiline   : options.multiline,
    scrollbar  : options.scrollbar,
    scrollable  : options.scrollable,
    mouse       : options.mouse,
    //draggable:true,
    border: this.getStyle('info.border',{
      type: 'line'
    }),
    style: {
      fg:options.fg||this.getStyle('info.fg','blue'),
      bg: options.bg||this.getStyle('info.bg',undefined),
      label:this.getStyle('info.label',undefined),
      border: {
        fg: this.getStyle('info.border.fg','black'),
        bg: this.getStyle('info.border.bg',undefined),
      },
    }
  });
  
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Initialite APP and create screen
 *
 */
App.prototype.init = function () {
  var self=this;
  // Information bar visible on all pages
  this.screen = GUI.screen({
    smartCSR: false,
    terminal: this.options.terminal,
    forceCursor:this.options.forceCursor,
    });
  this.screen.title = this.options.title||'APP (C) Stefan Bosse';
  this.screen.cursor.color='red';  
  this.layout=LAYOUT.from(this.screen);
}

/** Input field widget
 * typeof options = {top,left,right,width,height,label,value}
 * method getValue, setValue
 * events: {'set content'}
 */
App.prototype.input = function(options) {
  var self=this, width=options.width||(this.screen.width-(options.left*2||2));
  var obj = GUI.textbox({
    label: options.label||'My Input',
    value: options.value||'',
    //fg: 'blue',
    bg: 'default',
    barBg: 'default',
    barFg: 'blue',
    width: width,
    height: options.height||3,
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top,
    bottom: options.bottom,
    keys: true,
    mouse: true,
    inputOnFocus: true,
    focus:true,
    wrap:options.wrap,
    multiline:options.multiline,
    //draggable:true,
    border: this.getStyle('input.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('input.fg','blue'),
      bg: options.bg||this.getStyle('input.bg',undefined),
      border: {
        fg: this.getStyle('input.border.fg','black'),
        bg: this.getStyle('input.border.bg',undefined),
      },
      label:this.getStyle('input.label',undefined),
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  obj.on('focus',function () {
    if (!self.options.keyboard) // show cursor
      return self.options.terminal.indexOf('xterm')!=-1 && self.options.forceCursor?
             self.screen.program._write('\x1b[?12;25h'):0; 
    if (!self._keyboard) 
      self._keyboard=self.keyboard({
        width:self.screen.width<60?'100%':'80%',
        height:self.layout.small?'100%':'90%',
        compact:self.layout.small
      });
    self._keyboard.setCallback(function (v) {if (v) obj.setValue(v),obj.update();});
    self._keyboard.setValue(obj.getValue());
    self._keyboard.setLabel(obj.getLabel());
    self._keyboard.show();
  });
  return obj;
}

/** Software keyboard widget
 *
 *  typeof options = { left,top, width, height, compact, okayButton, cancelButton, border, }
 */
App.prototype.keyboard = function(options) {
  var obj = GUI.keyboard({
    parent:options.parent||this.screen,
    border: 'line',
    height: options.height||'half',
    width: options.width||'half',
    top: options.top||'center',
    left: options.left||'center',
    label: 'Keyboard',
    hidden:options.hidden,
    compact:options.compact,
    okayButton:options.okayButton||'OK',
    cancelButton:options.cancelButton||(this.layout.small?'CAN':'Cancel'),
    delButton:'DEL',
    shiftButton:'>>',
    border:options.border||this.getStyle('keyboard.border',{}),
    style:{
      bg: options.bg||this.getStyle('keyboard.bg',undefined),
      label:options.label||this.getStyle('keyboard.label',undefined),
    }
  });
  this.screen.append(obj);
  return obj;  
}

/** Generic label widget
 * method setValue(string)|mutable=true
 * typeof options = {width?,left?,right?,top?,center?,mutable?,content}
 */
App.prototype.label = function(options) {
  var obj = GUI.text({
    width: options.width||(options.content.length),
    left: (options.center?int(this.screen.width/2-options.content.length/2):options.left),
    right : options.right,
    top: options.top||0,
    height: options.height||1,
    focus:false,
    align: 'center',
    content: options.content||'?',
    style: {
      bg:options.style?options.style.bg:this.getStyle('label.bg',undefined),
      fg:options.style?options.style.fg:this.getStyle('label.fg',undefined),
      bold:this.getStyle('label.bold',false)
    }  
  });
  if (options.mutable) 
    obj.setValue = function (content) {
      obj.setContent('');
      obj.position.left=(options.center?int(this.screen.width/2-content.length/2):options.left);
      obj.setContent(content);
    };
    
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Generic list navigator widget with scrollbar
 * typeof options = {top,left,width,height,label}
 * method set(data:object|array)
 */
App.prototype.list = function(options) {
  var obj =  GUI.list({
    top: options.top,
    left: options.left,
    width: options.width||(this.screen.width-options.left*2),
    height: options.height||(this.screen.height-options.top-4),
    label: options.label||'Log',
    focus:true,
    mouse:true,
    keys:true,
    arrows:options.arrows,
    border: this.getStyle('list.border',{
      type: 'line'
    }),
    style: {
      bg: options.bg||this.getStyle('list.bg',undefined),
      selected:options.selected||{fg:'white',bg:'red',bold:true},
      item:options.item||{bold:true},
      border: {
        fg: this.getStyle('list.border.fg','black')
      },
      label:this.getStyle('list.label',undefined),
      hover: {
        border: {
          fg: 'red'
        }
      },
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  obj.noshow=options.hidden;
  obj.set = obj.update = function (data) {
    var p,items=[];
    obj.clearItems();
    if (Comp.obj.isArray(data)) items=data;
    else for (p in data) {
      items.push(p);
    }
    obj.setItems(items);
    obj.screen.render();
  }
  this.screen.append(obj);
  return obj;
}

/** Log message widget with scrollbar
 * typeof options = {left,top,width,height,label,scrollback,..}
 */
App.prototype.log = function(options) {
  if (options.top == undefined) options.top=2;
  if (options.left == undefined && options.right==undefined) options.left=1;
  var obj = GUI.log({
    top: options.top,
    left: options.left,
    right: options.right,
    width: options.width||(this.screen.width-options.left*2),
    height: options.height||(this.screen.height-options.top-4),
    label: options.label||'Log',
    mouse:true,
    keys:true,
    scrollback:options.scrollback||100,
    border: this.getStyle('log.border',{
      type: 'line'
    }),
    scrollbar: {
      ch: ' ',
      track: {
        bg: 'yellow'
      },
      style: {
        fg: 'cyan',
        inverse: true
      }
    },
    alwaysScroll:true,
    scrollOnInput:true,
    style: {
      fg: options.fg||this.getStyle('log.fg','white'),
      bg: options.bg||this.getStyle('log.bg','black'),
      label:this.getStyle('log.label',undefined),
      border: {
        fg: this.getStyle('log.border.fg','green'),
        bg: this.getStyle('log.border.bg',undefined),
      },
      focus: {
        border: {
          fg: 'red'
        }
      }
    },
    arrows:options.arrows,
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Apply post option actions (event handling)
 *
 */
App.prototype.postOptions = function(options,widget,wname) {
  var self=this,attr;
  for (attr in options) {
    switch (attr) {
      case 'on':
        switch (options.type) {
          case 'checkbox' :
            if (options.on.click && typeof options.on.click == 'function') 
              widget.on('check',function () { options.on.click(wname,true) }),
              widget.on('uncheck',function () { options.on.click(wname,false) });
            if (options.on.onclick && typeof options.on.onclick == 'function') 
              widget.on('check',function () {  options.on.onclick(wname,true) }),
              widget.on('uncheck',function () {  options.on.onclick(wname,false) });
            if (options.on.check && typeof options.on.check == 'function') 
              widget.on('check',function () { options.on.check(wname,true) });
            if (options.on.uncheck && typeof options.on.uncheck == 'function') 
              widget.on('uncheck',function () { options.on.uncheck(wname,false) });
            if (options.on.selected && typeof options.on.selected == 'function') 
              widget.on('selected',function (data) { options.on.uncheck(wname,data) });
            if (options.on.change && typeof options.on.change == 'function') 
              widget.on('change',function (data) { options.on.change(wname,data) });
            break;
        }
        break;
      case 'click':
      case 'onclick':
        switch (options.type) {
          case 'checkbox' :
            if (typeof options[attr] == 'function') 
              widget.on('check',function () { options[attr](wname,true) }),
              widget.on('uncheck',function () { options[attr](wname,false) })
            break;
          case 'list':
            if (typeof options[attr] == 'function') 
              widget.on('selected',function (data) { options[attr](wname,data.content,data) })
            break;       
          case 'tree':
            if (typeof options[attr] == 'function') 
              widget.on('selected',function (data) { 
                  var _data=data,path=data.name;
                  data=data.parent;
                  while(data) 
                    path=data.name+(data.name!='/'?'/':'')+path,
                    data=data.parent;                
                  options[attr](wname,_data.name,path,_data) 
              })
            break;       
        }
        break;
      case 'onchange':
        switch (options.type) {
          case 'input' :
            if (typeof options[attr] == 'function') 
              widget.on('change',function (data) {
                var content = widget.getContent();
                options[attr](wname,content) 
              })
            break;
        }      
        break;
    }
  }
}

/** Radio button widget; can be grouped
 *
 */
App.prototype.radiobutton = function(options) {
  var obj = GUI.radiobutton({
    checked: options.value||false,  
    left: options.left,
    right : options.right,
    top: options.top||0,
    group:options.group,
    mouse: true,
    inputOnFocus: true,
    height: 1,
    text:options.text||'empty'
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}


App.prototype.start = function (main) {
  var self=this;
  if (main==undefined) main=this.pages.main?'main':null;
  Object.keys(this.pages).forEach(function (page) {
    if (typeof self.pages[page] != 'object') return;
    if (Object.keys(self.pages[page]).length==0) return;
    self.pages.hide(page);
    if (!main) main=page;
  });
  if (main) this.pages.show(main);
  this.screen.render();
  this.screen.program.hideCursor(this.options.terminal.indexOf('xterm') != -1 && this.options.forceCursor);
}

/** Status field widget
 * typeof options = {top,bottom,left,right,width,height,label,value}
 * method  getvalue, setValue
 * events: {'set content'}
 */
App.prototype.status = function(options) {
  var self=this, width=options.width||(this.screen.width-(options.left*2||2));
  var obj = GUI.textbox({
    label: options.label||'My Input',
    value: options.value||'',
    //fg: 'blue',
    bg: 'default',
    barBg: 'default',
    barFg: 'blue',
    width: width,
    height: options.height||3,
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top,
    bottom: options.bottom,
    wrap:options.wrap,
    multiline:options.multiline,
    //draggable:true,
    border: this.getStyle('input.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('input.fg','blue'),
      bg: options.bg||this.getStyle('input.bg',undefined),
      border: {
        fg: this.getStyle('input.border.fg','black'),
        bg: this.getStyle('input.border.bg',undefined),
      },
      label:this.getStyle('input.label',undefined),
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Table widget
 * typeof options = {left,right,top,width,height,label,header,cell,data,..}
 */
App.prototype.table = function(options) {
  if (options.top == undefined) options.top=2;
  if (options.left == undefined && options.right==undefined) options.left=1;
  var obj = GUI.table({
    top: options.top,
    left: options.left,
    right: options.right,
    width: options.width||(this.screen.width-options.left*2),
    height: options.height||(this.screen.height-options.top-4),
    label: options.label||'Table',
    data: options.data,
    border: this.getStyle('table.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('log.fg','white'),
      bg: options.bg||this.getStyle('log.bg','black'),
      label:this.getStyle('log.label',undefined),
      border: {
        fg: this.getStyle('log.border.fg','green'),
        bg: this.getStyle('log.border.bg',undefined),
      },
      header : options.header,
      cell   : options.cell,
      focus: {
        border: {
          fg: 'red'
        }
      }
    },
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  return obj;
}

/** Terminal shell widget
 * typeof options = {top,left,right,width,height,label,header:style,cell:style}
 */
App.prototype.terminal = function(options) {
  var self=this, width=options.width||(this.screen.width-(options.left*2||2));
  options.scrollable=true;
  if (options.scrollable && !options.scrollbar) {
      options.scrollbar = {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          fg: 'cyan',
          inverse: true
        }
      };
      options.mouse=true;
  }
  var obj = GUI.terminal({
    label: options.label||'My Text',
    value: options.value||'',
    //fg: 'blue',
    bg: 'default',
    barBg: 'default',
    barFg: 'blue',
    width: width,
    height: options.height||8,
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top||0,
    keys: true,
    vi: false,
    mouse: true,
    inputOnFocus: true,
    focus:true,
    wrap        : options.wrap,
    multiline   : true,
    scrollbar   : options.scrollbar,
    scrollable  : options.scrollable,
    //draggable:true,
    prompt:options.prompt,
    border: this.getStyle('input.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('input.fg','blue'),
      bg: options.bg||this.getStyle('input.bg',undefined),
      border: {
        fg: this.getStyle('input.border.fg','black'),
        bg: this.getStyle('input.border.bg',undefined),
      },
      label:this.getStyle('input.label',undefined),
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  obj.on('focus',function () {
    if (!self.options.keyboard) // show cursor
      return self.options.terminal.indexOf('xterm')!=-1 && self.options.forceCursor?
             self.screen.program._write('\x1b[?12;25h'):0; 
    if (!self._keyboard) 
      self._keyboard=self.keyboard({
        width:self.screen.width<60?'100%':'80%',
        height:self.layout.small?'100%':'90%',
        compact:self.layout.small
      });
    self._keyboard.setCallback(function (v) {if (v) obj.setValue(v),obj.update();});
    self._keyboard.setValue(obj.getValue());
    self._keyboard.setLabel(obj.getLabel());
    self._keyboard.show();
  });
  return obj;
}

/** Text field widget
 * typeof options = {top,left,right,width,height,label,value}
 * method getValue, setValue
 * events: {'set content'}
 */
App.prototype.text = function(options) {
  var self=this, width=options.width||(this.screen.width-(options.left*2||2));
  if (options.scrollable && !options.scrollbar) {
      options.scrollbar = {
        ch: ' ',
        track: {
          bg: 'yellow'
        },
        style: {
          fg: 'cyan',
          inverse: true
        }
      };
      options.mouse=true;
  }
  var obj = GUI.textarea({
    label: options.label||'My Text',
    value: options.value||'',
    //fg: 'blue',
    bg: 'default',
    barBg: 'default',
    barFg: 'blue',
    width: width,
    height: options.height||8,
    left: (options.center?int(this.screen.width/2-width/2):options.left),
    right : options.right,
    top: options.top||0,
    keys: true,
    vi: false,
    mouse: true,
    inputOnFocus: true,
    focus:true,
    wrap        : options.wrap,
    multiline   : true,
    scrollbar   : options.scrollbar,
    scrollable  : options.scrollable,
    //draggable:true,
    border: this.getStyle('input.border',{
      type: 'line'
    }),
    style: {
      fg: options.fg||this.getStyle('input.fg','blue'),
      bg: options.bg||this.getStyle('input.bg',undefined),
      border: {
        fg: this.getStyle('input.border.fg','black'),
        bg: this.getStyle('input.border.bg',undefined),
      },
      label:this.getStyle('input.label',undefined),
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  obj.noshow=options.hidden;
  this.screen.append(obj);
  obj.on('focus',function () {
    if (!self.options.keyboard) // show cursor
      return self.options.terminal.indexOf('xterm')!=-1 && self.options.forceCursor?
             self.screen.program._write('\x1b[?12;25h'):0; 
    if (!self._keyboard) 
      self._keyboard=self.keyboard({
        width:self.screen.width<60?'100%':'80%',
        height:self.layout.small?'100%':'90%',
        compact:self.layout.small
      });
    self._keyboard.setCallback(function (v) {if (v) obj.setValue(v),obj.update();});
    self._keyboard.setValue(obj.getValue());
    self._keyboard.setLabel(obj.getLabel());
    self._keyboard.show();
  });
  return obj;
}

/** Generic data object tree navigator widget with scrollbar
  * typeof options = {top,left,width,height,label,depth}
  * method set(dats)/update(data)
  *
  * Data object can contain _update attributes (function) modifying the data content of elements
  * before opening a tree branch. Root data _update must call self.update(new data)!
  * Deeper _update functions have only to modify the object data passed as an argument.
  * Scalar tree leafes can be updated before opening branch by a virtual object:
  * {_virtual:string|number|boolean,_update:function (data) {data._value=<newval>}}
*/

App.prototype.tree = function(options) {
  var obj =  GUI.tree({
    top: options.top,
    left: options.left,
    width: options.width||(this.screen.width-options.left*2),
    height: options.height||(this.screen.height-options.top-4),
    label: options.label||'Log',
    focus:true,
    arrows:options.arrows,
    border: this.getStyle('tree.border',{
      type: 'line'
    }),
    style: {
      bold:true,
      border: {
        fg: this.getStyle('tree.border.fg','black')
      },
      label:this.getStyle('tree.label',undefined),
      hover: {
        border: {
          fg: 'red'
        }
      },
      focus : {
        border: {
          fg: 'red'
        }      
      }
    }
  });
  function makeleaf (element,reference,data) {
    var content,children,name,funpat,isfun,p;
    children={};
    name = element.toString();
    funpat = /function[\s0-9a-zA-Z_$]*\(/i;
    isfun=Comp.obj.isFunction(element)||funpat.test(name);
    if (isfun) {
      element=Comp.string.sub(name,0,name.indexOf('{'));
    }
    if (!isfun || (isfun && options.showfun)) {
      children[element]={};
      content={children : children,reference:reference,data:data};
    }
    return content;
  }
  function maketree (element,reference) {
    var content,children,p;
    children={};
    if (element && (Comp.obj.isObject(element) || Comp.obj.isArray(element))) {
    // console.log(element)    
      if (element._update != undefined) element._update(element);
      if (element._value != undefined) return makeleaf(element._value,_,element);
      for (p in element) {
        if (p != '_update')
           children[p]={};
      }
      content={
         children : children,
         data : element
      }
    } else if (element != undefined) {
      return makeleaf(element,reference);
    } else {
      children[element]={};
      content={children : children};    
    }
    return content;
  };
  obj.noshow=options.hidden;
  // Create sub-trees
  obj.on('preselect',function(node){
    var content,children,element,data,name;  
    if (node.name != '/' && !node.extended)  {
      // Io.out(node.extended);
      data = node.data;
      if (data != none && (Comp.obj.isObject(data) || Comp.obj.isArray(data))) {
        node.children = {};
        if (Comp.obj.isArray(data) && Comp.array.empty(data) && Comp.hashtbl.empty(data)) {
          node.children={'[]' : {}};
        } else {
          if (data._update != undefined) data._update(data);
          if (data._value != undefined) return node.children=makeleaf(data._value,_,data).children;
          for (var p in data) {
            if (p != '_update') {
              element = data[p];
              content=maketree(element,data);
              if (content) node.children[p]=content;
            }
          }
        } 
      } else if (data == none && node.reference) {
          node.children = {};
          element=node.reference[node.name];
          name=element.toString();
          var funpat = /function[\s0-9a-zA-Z_$]*\(/i;
          var isfun=Comp.obj.isFunction(element)||funpat.test(name);
          if (isfun) {
            element=Comp.string.sub(name,0,name.indexOf('{'));
          }          
          node.children[element]={};
      } 
    } else if (node.name == '/' && node.extended) {
      if (node.data && node.data._update) {
        node.data._update()
      }
    }
  });
  obj.set = obj.update = function (data) {
    obj.DATA = {
      name:'/',
      extended:true,
      children: {},
      data:data,
    };
    for (var p in data) {
      var element=data[p];
      var content=options.depth && options.depth==1?{}:maketree(element,data);
      if (content) obj.DATA.children[p]=content;
    }
    obj.setData(obj.DATA);
  };
  obj.DATA = {
    name:'/',
    extended:true,
    children: {},
  };
  obj.setData(obj.DATA);
  this.screen.append(obj);
  return obj;
}


// App App using GUI (blessed emu)

UI = {
  options:options,
  LAYOUT:LAYOUT,
  UI:App
}
