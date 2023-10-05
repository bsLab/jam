// Chat bot moderator agent 
function chat(options) {
  this.delay        = options.delay||2000;
  this.rememberCount= options.rememberCount||1000;
  this.action       = null;
  this.count        = 0;
  this.busy         = false;
  this.state        = 0;
  this.retry        = 0;
  this.verbose      = options.verbose||1;
  this.timeout      = options.timeout||40000;
  this.dialogs      = [];
  this.version      = "1.1.7C";
  
  this.act = {
    // Initialize the moderator agent
    init : function () {
      var t;
      log('Chat moderator agent V. '+this.version+' is starting..');
      this.retry  = 0;
      this.state  = 0;
      this.busy   = false;
      negotiate('CPU',10000000);
      out(['CHAT']);
      // Some sensor API tests
      t=rd.try(0,['SENSOR','CLOCK',_]);
      if (t) log('Got SENSOR CLOCK='+t[2]); else log('NO SENSOR CLOCK');
      t=rd.try(0,['SENSOR','GPS',_]);
      if (t) log('Got SENSOR GPS='+t[2]); else log('NO SENSOR GPS');
    },
    
    // Get feedback from user: qilling to chat?
    talk: function () {
      var quest;
      if (this.verbose) log('Chat moderator agent is talking..') 
      if (this.state==0) message('Moderator','Hello, I am '+me()+', your moderator :-)');
      // Blocking operation (with timeout)
      this.action=null;
      this.busy=true;
      switch (this.state) {
        case 0: 
        case 1: quest='What would you like to do?'; break;
        case 2: quest='May I ask again?'; break;
        case 3: 
        case 4: quest='Do you want to change your decision?';  break;
      }
      question('Moderator',quest,[
        {text:'Chilling',value:'nothing'},
        {text:'Answer questions', value:'questions'} 
      ],function (res) {
        this.action=res;
        if (this.verbose) log('Got answer '+res) 
      },this.timeout);
    },
    
    process: function () {
      alt.try(500,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_]
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE':  this.dialogs.push({
             message: t[2],
             from:    t[1]  
           }); break;
           case 'QUESTION': this.dialogs.push({
            question: t[2],
            from:     t[1],
            options:  t[3]
           }); break;
        }
        if (this.verbose>1) log('process: have '+this.dialogs.length+' dialogs');
      });
    },
    
    dodialog: function () {
      var action;
      if (this.busy) return;
      var d=this.dialogs.shift();
      // q= ['QUESTION',id,question, {}]
      // q= ['QUESTION',id,question, {type:'text'|'number',default?, value?:number|string}]
      // q= ['QUESTION',id,question, {choices:(string|number|{text,value}) []}]
 
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
          log('Got answer '+res+' for '+d.from+' and Q '+d.question) 
          if (res) out(['ANSWER',d.from,d.question,res]);
          this.busy=false;
        },this.timeout);
      }
    },

    wait : function () {
      this.busy=false;
      if (this.state<4) {
        notify('Now I will mediate questions from agents!');
        message('Moderator','Now I will mediate questions from agents!');
        message('Moderator','Hope you will answer their questions!');
      }
      this.state=4;
      if (this.count==0) log('Chat moderator agent is waiting for '+this.action) 
      this.count++;
      // maybe pause some time?
      // maybe remembering?
    },
    
    
    remember: function () {
      if (this.verbose) log('Chat moderator agent is remembering ..') 
      this.busy=false; 
      this.count=0;
      if (this.action) this.state=3; else this.state=1;
      sleep(this.delay*5)    
    },
    
    end: function () {
      log('Chat moderator agent is terminating.') 
      kill()
    }
  }
  
  this.trans = {
    init:talk,
    talk:function () { 
      return this.action=='questions'?process:remember 
    },
    process: function () { 
      if (this.dialogs.length) return dodialog;
      else return wait 
    },
    remember: talk,
    dodialog: process,
    wait:function () { 
      return this.count==this.rememberCount?remember:process;
    }
  }
  
  this.next=init
}
