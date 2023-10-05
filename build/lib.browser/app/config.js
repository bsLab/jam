/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
/**  Simple chat moderator agent 
     (more advanced version in js/agents/chat.js)

 Interaction via tuple space:
 Chatbot       -         Chat moderator 
 -------------------------------------------------------------------
 out(['MESSAGE',id,msg])            - alt([..])

 out(['QUESTION',id,quest,options]) - alt([..])
 inp(['ANSWER',id,quest,answer?])   - out(['ANSWER',id,quest,answer])

 out(['SESSION',id,'start'|'end'])
 
  typeof @options = {
    choices?:(number|string) [].
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    timeout?: number
  }
*/
 
function chat(options) {
  // remember delay time
  this.remember     = options.remember||2000;
  // on or off
  this.state        = 'off';
  this.busy         = false;
  // Current survey session? -> {from:string,stamp:number}
  this.session      = null;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.2.2";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: chilling to chatting?
    talk: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is talking..') 
      message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.state=null;
      this.busy=true;
      question('Moderator','What would you like to do?',[
        {text:'Chilling',value:'off'},
        {text:'Answer questions', value:'on'} 
      ],function (res) {
        this.state=res;
        if (this.verbose) log('[CHAT] Got answer '+res+'.')
        if (res=='on') {
          notify('Now I will mediate questions from agents!');
          message('Moderator','Now I will mediate questions from agents!');
          message('Moderator','Hope you will answer their questions!');  
        }
        this.busy=false;
      });
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_],
        ['SESSION',_,_],
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  
            this.dialogs.push({
              message: t[2],
              from:    t[1]  
            }); 
            break;
           case 'QUESTION': 
            this.dialogs.push({
              question: t[2],
              from:     t[1],
              options:  t[3]
            }); 
            break;
           case 'SESSION': 
            if (!this.session && t[2]=='start') 
              this.session = {
                from:t[1],
                stamp:time(),
                start:time(),
                stop:time()+this.sessionTime
              }; 
            else (this.session && t[2]=='end' && this.session.id==t[1])
              this.session=null;  
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      if (d.message) {
        this.busy=true;
        message(d.from,d.message);
        this.busy=false;
      } else if (d.question) {
        this.busy=true;
        if (d.options.choices) 
          action = d.options.choices;
        else
          action = {
            // TODO
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };

        question(d.from,d.question,action,function (res) {
          log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['ANSWER',d.from,d.question,res],60000);
          this.busy=false;
        },min(this.timeout,d.options.timeout||this.timeout));
      }
    },

    
    remember: function () {
      if (this.verbose) log('[CHAT] Chat moderator agent is remembering ..') 
      this.busy=false; 
      sleep(this.remember)    
    },
    
    end: function () {
      log('[CHAT] Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.state=='on'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return process 
    },
    remember: talk,
    dodialog: process,
  }
  
  this.next=init
}
