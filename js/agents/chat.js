/**  Simple chat moderator agent 

 Interaction via tuple space:
 Chatbot       -                    Chat moderator 
 -------------------------------------------------------------------
 out(['CHAT-SESSION',id,time])                  - alt([..])
                                                  out(['CHAT-TOKEN',id,token});

 out(['CHAT-MESSAGE',id,token,msg])             - alt([..])

 out(['CHAT-QUESTION',id,token,quest,options])  - alt([..])
 inp(['CHAT-ANSWER',id,token,quest,answer?])    - out(['CHAT-ANSWER',id,token,quest,answer])

out(['CHAT-NOTIFY',id,token,msg])             - alt([..])

 
  typeof @options = {
    choices?:(number|string) [],
    range?:[number,number],
    value?: number|string,
    type? : string='text'|'number',
    default?: number|string,
    mutual?:boolean,
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
  this.token        = 1001;
  this.sessionTime  = options.sessionTime||60000;
  // last chat dialog action
  this.last         = 0;
  this.verbose      = options.verbose||1;
  // Default question-response timeout
  this.timeout      = options.timeout||40000;
  // pending dialog requests
  this.dialogs      = [];
  this.version      = "1.4.1";
  this.idn          = 0;
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('[CHAT] Chat moderator agent V. '+this.version+' is starting..');
      beep();
      this.busy   = false;
      negotiate('CPU',10000000);
      this.idn=random(1000000);
      out(['CHAT',this.idn]);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
      t=rd.try(0,['SENSOR','LOCATION',_]);
      if (t) log('Got SENSOR LOCATION='+t[2]); else log('NO SENSOR LOCATION');
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
        ['CHAT-MESSAGE',_,_,_],
        ['CHAT-NOTIFY',_,_,_],
        ['CHAT-QUESTION',_,_,_,_],
        ['CHAT-SESSION',_,_],
      ], function (t) {
        if (this.session && this.session.stop<time()) this.session=null;
        if (t) switch (t[0]) {
           case 'CHAT-MESSAGE':
            if (!this.session || 
                this.session.from!=t[1] ||
                this.session.token!=t[2]) return log(t);
                 
            this.dialogs.push({
              message: t[3],
              from:    t[1]  
            }); 
            break;

           case 'CHAT-NOTIFY':
            if (!this.session || 
                this.session.from!=t[1] ||
                this.session.token!=t[2]) return log(t);
                 
            notify(t[3]);
            beep();
            break;
            
           case 'CHAT-QUESTION': 
            if (!this.session || 
                this.session.from!=t[1] ||
                this.session.token!=t[2]) return log(t);

            this.dialogs.push({
              question: t[3],
              from:     t[1],
              options:  t[4]
            }); 
            break;
            
           case 'CHAT-SESSION': 
            if (!this.session && t[2]>0) {
              this.session = {
                token :  this.token++,
                from  : t[1],
                stamp : time(),
                start : time(),
                stop  : time()+Math.min(this.sessionTime,t[2])
              };
              mark(['CHAT-TOKEN',this.session.from,this.session.token],1000);
              if (this.verbose) log('[CHAT] Granted session to '+
                                    t[1]+' ('+Math.min(this.sessionTime,t[2])+')')
            } else if (this.session && t[2]==0 && this.session.from==t[1]) {
              if (this.verbose) log('[CHAT] Closed session for '+t[1]);
              this.session=null; 
            }
           break;
        }
        if (this.verbose>1) log('[CHAT] process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    refresh : function () {
      // refresh our chat tuple
      if (!ts(['CHAT',this.idn],600000)) {
        if (this.verbose) log('Warning: Lost my CHAT tuple!?');
        out(['CHAT',this.idn]);
      } 
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
        if (this.verbose>1) log(d.options);
        if (d.options.choices && d.options.mutual) 
          action = d.options.choices;
        else if (d.options.choices && !d.options.mutual) {
          action = {
            placeholder : 'Select',
            multipleselect : true,
            value : '',
            button : {
              icon: 'check',
              label: 'OK'
            },
            options:d.options.choices
          };
        } else {
          action = {
            size:         14,
            value:        d.options.value||'', 
            sub_type:     d.options.type || 'text',
            placeholder:  d.options.default||'' 
          };
        }
        if (this.verbose>1) log(action)
        question(d.from,d.question,action,function (res) {
          if (this.verbose>1) log('[CHAT] Got answer '+res+' for '+d.from+' and Q '+d.question) 
          mark(['CHAT-ANSWER',d.from,this.session.token,d.question,res],10000);
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
      return this.state=='on'?refresh:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return refresh 
    },
    refresh : process,
    remember: talk,
    dodialog: refresh,
  }
  
  this.next=init
}
