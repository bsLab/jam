/** Survey Agent
 *
 *  Three modes:
 *  1. Master (seek RELAY and then stay resident, performing multiple surveys for a time period)
 *     jamsh start.js
 *  2. Worker = Chatbot (mobile, one survey, one user, seek CHAT)
 *  3. Requester (=> Master)
 *     job=load('job.json'); create('survey',{mode:'Requester',survey:job},2)
 *  4. Twin (child of Requester, eaach single survey => back)
 *
 */
 
function survey(options) {
  this.options=options;
  this.mode=options.mode||'Master';
  this.find=options.find;
  this.surveys = [];
  this.survey = options.survey||{};
  this.index = 0;
  this.idn = 0;
  this.token = null;
  this.twins = options.twins;
  this.arrived=false;
  this.trap=false;
  this.visited=[];
  this.hops=0;
  this.maxhops=options.maxhops||5;
  this.verbose=1;
  this.goto=options.goto||'';
  this.workers=[];
  this.root = '';
  this.path = [];
  this.requester = '';
  this.version='1.1.3';
  this.time = 0;
  this.lifetime = options.lifetime||300000;
  this.timeout  = options.timeout||60000;
  
  this.replaceText = function (text,vars) {
    var reg=[
      /\$1/g,
      /\$2/g,
      /\$3/g,
      /\$4/g,
      /\$5/g,
      /\$6/g,
      /\$7/g,      
      /\$8/g,
    ]
    iter(vars,function (v,i) {
      text=text.replace(reg[i],v)
    });
    return text;
  }
  this.dialogMap = function (script) {
    var map={};
    iter(script,function (entry,index) {
      map[index]=entry;
      if (entry.label) map[entry.label]=entry;
    });
    return map;
  }
  
  this.act = {
    init: function () {
      log('[SURVEY] '+this.mode+': starting..');
      if (this.goto) log(this.goto); else log('no goto provided');
      this.idn=random(1000000);
      this.surveys=[];
      this.arrived=false;
      this.trap=false;
      this.visited=[];
   	  this.hops=0;
      this.workers=[];
      if (!this.root) this.root = myNode();
            
      if (!this.find) switch (this.mode) {
        case 'Master':    this.find='RELAY';  break;
        case 'Worker':    this.find='CHAT';   break;
        case 'Requester': this.find='SURVEY'; break;
        case 'Twin':      this.find='ROOT';   break;
      }
    },
    
    move: function () {
      var nodes,next;
      this.visited.push(myNode());
      if (this.find == 'ROOT' && myNode()!=this.root) {
        // goback to root node
        next = this.path.shift();
      } else if (!test([this.find,_])) {
        nodes=link(DIR.IP('%'))
        if (nodes) nodes=filter(nodes,this.visited);
        if (nodes) {
          if (this.goto && contains(nodes,this.goto)) {
            next=this.goto;
            this.goto=null;
          } else
            next=random(nodes)
        }
        if (!next) this.trap=true;
      }
      if (next) {
        this.hops++;
        if (this.verbose) log('[SURVEY] '+this.mode+': Going to '+next);
        moveto(DIR.NODE(next))
      } else if (test([this.find,_]) ||
                 (this.find == 'ROOT' && myNode()==this.root)) {
        // log('[SURVEY] '+this.mode+': Arrived on '+myNode());
        this.arrived=true;
        switch (this.mode) {
          case 'Master':
            // any master already here?
            if (test(['SURVEY',_])) {
              log('Survey master already on node?');
              this.time=0;
              this.trap=true;
              this.arrived=false;
            } else {
              mark(['SURVEY',this.idn],this.lifetime);
              log('Survey master stays ('+this.lifetime+' ms)'); 
            }
            this.time=time()+this.lifetime;  // lifetime?
            break;
          case 'Worker':
            this.survey.node=myNode();
            break;
        }
        this.path=tail(reverse(this.visited));
      }
    },
    
    ////////////
    // Master //
    ////////////
    getreq : function () {
      alt.try(500,[
        ['SURVEY',_,_,_]
      ],function (t) {
        if (t) switch (t[0]) {
          case 'SURVEY': 
            log('[SURVEY] '+this.mode+': Got new survey from '+t[1]+' ('+t[3]+')');
            this.surveys.push({
              id:t[1],
              script:t[2],
              time:t[3],
              time0:time()+t[3],
              serviced:[myNode()]
            }); 
            break;
        }
      })
    },
    
    process : function () {
      var nodes,next,survey;
      if (this.surveys.length) {
        survey=this.surveys[0];
        nodes=link(DIR.IP('%'));
        if (!nodes) nodes=[];
        nodes.push(myNode());
        if (nodes) nodes=filter(nodes,survey.serviced);
        next=random(nodes);
        if (next) {
          // new connected node found; sent out worker
          log('[SURVEY] '+this.mode+': sending worker to '+next);
          survey.serviced.push(next);
          this.workers.push(fork({
            next: init,
            find:'CHAT',
            goto: next,
            mode:'Worker',
            path:[],
            index:0,
            time:survey.time,
            requester:survey.id,
            survey:survey.script,
          }))
        }
      }
      this.surveys=map(this.surveys,function (s) {
        if (s.time0 < time()) {
            log('[SURVEY] '+this.mode+': Removing survey from '+s.id);
            return null;
        } else return s;
      })
    },
    
    ////////////
    // Worker //
    ////////////
    sessionOpen : function () {      
      // get a session token
      log('Requesting session token..');
      mark(['CHAT-SESSION',me(),60000],this.timeout);
      this.token=null;
      inp.try(this.timeout,['CHAT-TOKEN',me(),_],function (reply) {
        log('Got sesssion token?: '+reply);
        if (reply) this.token=reply[2];
      });
    },
    sessionClose : function () {
      mark(['CHAT-SESSION',me(),0],this.timeout);      
    },
    ask: function () {
      // ask next entry of the dialog script
      var next = this.survey.script[this.index];
      // create dialog map
      var dialogMap = this.dialogMap(this.survey.script);
      this.index++;
      log(next.message||next.question);
      if (next.cond && !next.cond(dialogMap)) return;
      if (next.message && !next.question) {
        var msg=next.eval?
                this.replaceText(next.message,next.eval(dialogMap))
                :next.message;
      	mark(['CHAT-MESSAGE',me(),this.token,msg],this.timeout);
      } else if (next.question) {
         var msg=next.eval?
                this.replaceText(next.question,next.eval(dialogMap))
                :next.question;
        next.question=msg;
        if (next.choices)
          mark(['CHAT-QUESTION',me(),this.token,
                msg,{choices:next.choices}],this.timeout);
        else
          mark(['CHAT-QUESTION',me(),this.token,
                 next.question,{}],this.timeout)
        inp.try(this.timeout,['CHAT-ANSWER',me(),this.token,next.question,_],function (reply) {
           log('Got answer: '+reply);
           if (reply) next.answer=reply[4];
        })
      }
    },
    goback : function () {
      var next = this.path.shift();
      moveto(DIR.NODE(next))  
    },
    
    deliver : function () {
      out(['REPLY',this.requester,this.survey]);
      log('[SURVEY] '+this.mode+': delivered survey from '+this.survey.node); 
    },
     
    ///////////////
    // Requester //
    ///////////////
    request : function () {
      // meeting the Master ..
      out(['SURVEY',me(),this.survey,this.survey.time]);
      this.path=tail(reverse(this.visited));
      this.time=time()+this.survey.time*1000; // seconds 
      log('[SURVEY] '+this.mode+': survey time is '+this.survey.time+' s');       
    },
    reply : function () {
      // back on source node or create twins
      inp.try(500,['REPLY',me(),_],function (reply) {
        var survey;
        if (reply) {
          survey=reply[2];
          log('[SURVEY] '+this.mode+': got single reply from '+survey.node); 
          log(this.path)
          log(this.root)
          this.workers.push(fork({
            next: init,
            find:'ROOT',
            goto: '',
            mode:'Twin',
            index:0,
            root:this.root,
            requester:survey.id,
            survey:survey,
          }))
        }
      })
    },

    //////////
    // Twin //
    //////////
    twin: function () {
      log('[SURVEY] '+this.mode+': creating twin from survey from '+this.survey.node);
      mark(['CREATE','TWIN',this.survey.script],1000);
    },    
    
    ///////////////////////
    
    end : function () {
      log('[SURVEY] '+this.mode+': terminating.');
      kill(me())
    }
  };
  
  this.trans = {
    init: move,
    move : function () { 
      if (this.hops==this.maxhops) return end;
      if (this.arrived) log('[SURVEY] '+this.mode+': Arrived on '+myNode()+'('+this.find+')');
      else if (this.trap) return end;
      else return move;
      switch (this.mode) {
        case 'Master':    return getreq;
        case 'Worker':    return sessionOpen;
        case 'Requester': return request;
        case 'Twin':      return twin;     
      }
      return end;
    },
    // Master
    getreq : function () {
      return time()<this.time?process:end
    },
    process : getreq,
    // Worker
    sessionOpen : function () {
      return this.token?ask:goback;
    },
    sessionClose : goback,
    ask : function () {
      return this.index < this.survey.script.length?ask:sessionClose;
    },
    goback : function () {
      return this.path.length?goback:deliver
    },
    deliver : end,
    // Requester
    request : reply,
    reply : function () {
      if (this.time > time()) return reply; else return end;
    },
    // Twin
    twin: end,
  };
  
  this.next = init;
}

 
