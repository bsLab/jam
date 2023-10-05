function explorer (options) {
  // 1. Körpervariablen (Inhalte sind mobil)
  this.rootNode=null;
  this.visited=[];
  // Sensors of current node
  this.sensors={};
  // Hier werden alle Sensor- und Umfrageergebnisse gesammelt
  this.collect=[];
  this.verbose = 1;
  this.currentNode = null;
  this.path = [];
  this.nextNode = null;
  this.hops = 0;
  this.maxHops = 200;
  this.timeout = options.timeout||30000;

  // Optional survey script
  this.survey = options.survey;
  // Dialog Map mit zusätzlichen Labelreferenzen
  this.dialog = null;
  this.index = 0;
  this.token = null;
  this.tokenTrials = 0;
  // Antworten werden zu this.sensors.answers hinzugefügt

  // Dialog Label Mapper
  this.dialogMap = function (dialog) {
    var map={};
    iter(dialog,function (entry,index) {
      map[index]=entry;
      if (entry.label) map[entry.label]=entry;
    });
    return map;
  }

  // 2. Aktivitäten
  this.act = {
    init : function () {
      this.rootNode = myNode();
      log('Starting on '+this.rootNode);
      this.path.push(this.rootNode);
      this.sensors={};
      if (this.survey) 
        this.dialog = this.dialogMap(this.survey.dialog);
    },

    percept : function () {
      var loc,self=this;
      this.currentNode = myNode();
      log('PERCEPT on '+this.currentNode);
      this.tokenTrials=0;
      if (!contains(this.visited,this.currentNode)) {
        // Neuer Knoten
        this.visited.push(this.currentNode);
        this.sensors = {};
        this.sensors.clock=clock(true);
        this.sensors.path=copy(this.path);
        this.sensors.node=this.currentNode;
        this.sensors.chat=test(['CHAT',_]);
        // Infos von der aktuellen Plattform?
          loc=info('node').location;
          if (loc && loc.gps) 
            this.sensors.gps=[loc.gps.lat,loc.gps.lon,'@IP'];
          loc=info('node').location;
          if (loc && loc.gps5) 
            this.sensors.gps5=[loc.gps5.lat,loc.gps5.lon];
          loc=info('node').location;
          if (loc && loc.geo)
            this.sensors.location=[loc.geo.city,
                              loc.geo.zip,
                              _,_,
                              loc.geo.country];
          loc=info('node').location;
          if (loc && loc.geo5)
            this.sensors.location5=[loc.geo5.city,
                               loc.geo5.zip,
                               loc.geo5.street,
                               loc.geo5.number,
                               loc.geo5.country];
        this.collect.push(this.sensors);
      } else this.sensors={};
      var next = filter(link(DIR.IP('%')),this.visited);
      if (next.length) {
      	// explore next node
        this.nextNode=random(next);
      } else {
      	// go one step back
        this.nextNode=null;
      }
    },

    explore : function () {
      if (link(DIR.NODE(this.nextNode))) {
        log('GO to '+this.nextNode);
        this.hops++;
        this.path.push(this.nextNode);
      	moveto(DIR.NODE(this.nextNode));
      } else this.nextNode==null;
    },

    ////////////
    // Survey //
    ////////////
    sessionOpen : function () {      
      // get a session token
      log('Requesting session token..');
      mark(['CHAT-SESSION',me(),this.timeout*2],this.timeout);
      this.token = null;
      this.index = 0;
      this.sensors.answers={};
      inp.try(1000,['CHAT-TOKEN',me(),_],function (reply) {
        log('Got sesssion token?: '+reply);
        if (reply) this.token=reply[2];
        else {
          rm(['CHAT-SESSION',me(),_]);
          // try again..
          this.tokenTrials++;
        }
      });
    },
    sessionClose : function () {
      mark(['CHAT-SESSION',me(),0],this.timeout);
      this.sensors={};
    },
    ask: function () {
      var self=this;
      // ask next entry of the dialog script
      var next = copy(this.survey.dialog[this.index]);
      // create dialog map
      this.index++;
      log(next.message||next.question);
      if (next.cond && !next.cond(this.dialog)) return;
      if (next.message && !next.question) {
        var msg=next.eval?
                this.replaceText(next.message,next.eval(this.dialog))
                :next.message;
      	mark(['CHAT-MESSAGE',me(),this.token,msg],this.timeout);
      } else if (next.question) {
         var msg=next.eval?
                this.replaceText(next.question,next.eval(this.dialog))
                :next.question;
        next.question=msg;
        if (next.choices)
          mark(['CHAT-QUESTION',me(),this.token,
                msg,{choices:next.choices}],this.timeout);
        else
          mark(['CHAT-QUESTION',me(),this.token,
                 next.question,{
                   type:next.range?'number':'text',
                   range:next.range,
                   value:next.value,
                 }],this.timeout)
        inp.try(this.timeout,['CHAT-ANSWER',me(),this.token,next.question,_],function (reply) {
           log('Got answer: '+reply);
           if (reply) self.sensors.answers[next.label||self.index]=reply[4];
           if (reply[4]==undefined) { /*stop*/ 
             if (!self.survey.dialog[self.survey.dialog.length-1].question)
             self.index=self.survey.dialog.length-1;
             else self.index=1E9; 
           }
        })
      }
    },


    plan : function () {

    },

    goback : function () {
      var next = this.path.pop();
      if (next==this.currentNode) next = this.path.pop();
      if (next && link(DIR.NODE(next))) {
        log('GOBACK to '+next);
        this.hops++;
        this.path.push(next);
      	moveto(DIR.NODE(next));
      }
    },

    deliver : function () {
      log('DELIVER '+this.collect.length);
      out(['COLLECT',me(),this.collect]);
    },

    end : function () {
      log('END');
      kill();
    }
  }

  // 3. Übergänge
  this.trans = {
    init : 'percept',
    percept : function () {
      return this.sensors.chat && this.survey?sessionOpen:plan;
    },
    plan : function () {
      if (!this.nextNode && this.path.length==0 && this.currentNode==this.rootNode)
        return 'deliver';
      if (this.hops==this.maxHops ||
          (!this.nextNode && this.path.length==0)) 
        return 'end';
      return this.nextNode?'explore':'goback';    
    },
    sessionOpen : function () {
      if (!this.token && this.tokenTrials < this.timeout) return sessionOpen;
      return this.token?ask:plan; 
    },
    sessionClose : plan,
    ask : function () {
      return this.index < this.survey.dialog.length?ask:sessionClose;
    },

    explore : 'percept',
    goback : 'percept',
    deliver:'end',
  }

  this.on = {

  }

  // Erforderlich: Angabe der Startaktivität
  this.next = 'init';
}
