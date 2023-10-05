// Chat bot moderator agent 
function chat(params) {
  this.delay=params.delay||2000;
  this.action=null;
  this.count=0;
  this.busy=false;
  this.state=0;
  this.retry=0;
  this.demo=params.demo||false;
  this.verbose=params.verbose||0;
  this.temperature=30;
  this.timeout=params.timeout||40000;
  this.questions=[];
  this.version="1.1.5";
  
  this.act = {
    init : function () {
      log('Chat moderator agent V. '+this.version+' is starting..');
      log('My node is a '+info('node').type);
      this.retry=0;
      this.state=0;
      this.busy=false;
      negotiate('CPU',10000000);
      out(['CHAT']);
      try_rd(0,['SENSOR','CLOCK',_],function (t) {
        if (t) log('Got SENSOR CLOCK='+t[2])
      })
    },
    
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
    
    wait : function () {
      this.busy=false;
      if (this.state<4) {
        notify('Now I will mediate questions from agents!');
        message('Moderator','Now I will mediate questions from agents!');
        message('Moderator','Hope you will answer their questions!');
      }
      this.state=4;
      if (this.count==0) log('Chat moderator agent is waiting for '+this.action) 
      if (this.demo) sleep(this.delay);
      else this.count++;
    },
    
    process: function () {
      try_alt(1000,[
        ['MESSAGE',_,_],
        ['QUESTION',_,_,_]
      ], function (t) {
        if (t) switch (t[0]) {
           case 'MESSAGE': message(t[1],t[2]); break;
           case 'QUESTION': this.questions.push(t); break;
        }
      });
    },
    
    doquestion: function () {
      var tmo=10000;
      if (this.busy) return;
      this.busy=true;
      timer.add(tmo,'RESET');
      var q=this.questions.shift();
      // q= ['QUESTION',id,question, {}]
      // q= ['QUESTION',id,question, {type:'text'|'number',default?, value?:number|string}]
      // q= ['QUESTION',id,question, {choices:(string|number|{text,value}) []}]
      var action;
      
      if (q[3].choices) 
        action = q[3].choices;
      else
        action = {
          // TODO
          size: 14,
          value: q[3].value||'', 
          sub_type: q[3].type || 'text',
          placeholder: q[3].default||'' 
        };
      
      question(q[1],q[2],action,function (res) {
        log('Got answer '+res+' for '+q[1]+' and '+q[2]) 
        out(['ANSWER',q[1],q[2],res]);
        timer.delete('RESET');
        this.busy=false;
      },10000);
    },

    demo: function () {
      question('Guest','Can you make a guess of the room temperature?',{
          size: 14,
          icon: 'thermometer-empty',
          value: this.temperature, // show the current temperature as default
          sub_type: 'number',
          placeholder: '20'
      },function (res) {
        this.temperature=res;
        if (this.verbose) log('Got answer '+res) 
      },this.timeout);      
    },
    
    remember: function () {
      if (this.verbose) log('Chat moderator agent is remembering ..') 
      this.busy=false; 
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
    talk:function () { return this.action=='questions'?(this.demo?wait:process):remember },
    process: function () { return this.questions.length?doquestion:wait },
    remember: talk,
    doquestion: process,
    demo:wait,
    wait:function () { 
      if (!this.demo) return process;
      this.count++; 
      if (this.count==20) { this.count=0; return talk; } 
      else return this.count==1?demo:wait },
  }
  
  this.next=init
}
