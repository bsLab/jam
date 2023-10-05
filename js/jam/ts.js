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
 **    $INITIAL:     (C) 2006-2022 bLAB
 **    $CREATED:     15-1-16 by sbosse.
 **    $RCS:         $Id: ts.js,v 1.4 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.11.2
 **
 **    $INFO:
 **
 **  JavaScript Agent Tuple-Space Sub-System
 **
 **  New: out/amrk now create copies of mutable object and array elements!
 **  New: Global lifetime limit of all tuples
 **  New: xx.try function synonyms (inp.try, rd.try,..) and try functions now fire callback on timeout
 **  New: testandset
 **  New: eval/listen
 **  New: Patterns can contain regular expression! (p_i instanceof RegExp)
 **  New: A rd/inp operation can return all matching tuples
 **  New: alt operation supporting listening on multiple patterns
 **  New: Distributed TS with collect, copyto, store
 **
 **  Exeception: 'TS' | 'EOL'
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var current=none;
var Aios = none;
var verbose=false;

var options = {
  debug:{},
  version:'1.11.2',
  // global lifetime limit of tuples
  timeout : 0,
}

function aid(process) { return process.agent.id+':'+process.pid }
function log(tsi,process,msg) {
  if (verbose && process) Aios.aios.log('[TS'+(tsi.i)+':'+current.node.ts.id+'] Ag '
                                          + aid(process)+ ' '+msg);
  else if (verbose) Io.log('[TS'+(tsi.i)+':'+current.node.ts.id+'] SYS'+msg);
}
function min0(a,b) { return a==0?b:(b==0?a:Comp.pervasives.min(a,b)) };

/*******************************************
** Waiter management
*******************************************/

/** Add a waiter to a tuple space data base
 *
 */
var addwaiter = function (tsi,waiter) {
  var index,key;
  if (tsi.waiters.free.length==0) {
    index=tsi.waiters.length;
    tsi.waiters.push(waiter);
  } else {
    index=tsi.waiters.free[0];
    tsi.waiters[index]=waiter;
    tsi.waiters.free.shift();
  }
  if (typeof (key=waiter.pat[0]) == 'string') switch (waiter.op) {
    case 'listen': 
      tsi.waiters.hash[key]=index; break;
  }
}

/** Check for waiting agent processes and try to match the provided tuple.
 *  Readers can read multiple copies of the tuple, whereby consumers can only read the tuple one time.
 *  Consumers (in-op) can be in a waiting list (next/prev). If one waiter in a list consumes
 *  a tuple, all waiters must be removed. The other waiters (the same process, but different patterns; alt-op)
 *  can be in different tuple data bases!
 *
 */
var checkwaiter = function (tsi,tuple,callback) {
  var res,consumed=false,
      i,waiter;
   // Create agent callback   
  function cb(waiter,res) {
    Aios.CB(waiter.pro,function () {waiter.cb.call(waiter.pro.agent,res)});
  }
  for(i=0;i<tsi.waiters.length;i++) {
    if (!tsi.waiters[i]) continue;
    waiter=tsi.waiters[i];
    if (!consumed) switch (waiter.op) {
      case 'rd':
      case 'rd-all':
        res=match(tuple,waiter.pat);
        log(tsi,current.process,' rd waiter? '+res);
        if (res!=none) {
          cb(waiter,(waiter.op=='rd'?res:[res])),
          waiter.pro.wakeup();
          removewaiter(tsi,i);
        }
        break;
      case 'in':
      case 'in-all':
        res=match(tuple,waiter.pat);
        log(tsi,current.process,' in waiter? '+res);
        if (res!=none) {
          cb(waiter,(waiter.op=='in'?res:[res])),
          waiter.pro.wakeup();
          consumed=true;
          removewaiter(tsi,i);
        }
        break;
      case 'listen':
        res=match(tuple,waiter.pat);
        log(tsi,current.process,' listen waiter? '+res);
        if (res!=none) {
          res=waiter.pro.callback(waiter.cb,[res]);
          if (callback) callback.apply(current.process.agent,[res]);
          consumed=true;
        }
        break;    
    } else break;
  }
  
  if (!consumed && current.node.ts.consumers.length>0) {
    consumed = Comp.array.findmap(current.node.ts.consumers,function (consumer) {
      return consumer(tuple);
    });
  }
  return consumed;
}

var findwaiter = function (tsi,waiter) {
  var i;
  for(i=0;i<tsi.waiters.length;i++) {
    if (!tsi.waiters[i]) continue;
    if (tsi.waiters[i].pro.pid!=waiter.pro.pid) continue;
    if (equal(tsi.waiters[i].pat,waiter.pat)) return i;
  }
  return;
}

var removewaiter = function (tsi,index) {
  var waiter=tsi.waiters[index],_tsi,_index;
  tsi.waiters[index]=undefined;
  tsi.waiters.free.push(index);
  // Waiter in a chained waiter list?
  if (waiter.prev) {
    waiter.prev.next=undefined;    
    _tsi=current.node.ts.db[waiter.prev.pat.length];
    _index=findwaiter(_tsi,waiter.prev);
    if (_index != undefined) removewaiter(_tsi,_index);
  };
  if (waiter.next) {
    waiter.next.prev=undefined;    
    _tsi=current.node.ts.db[waiter.next.pat.length];
    _index=findwaiter(_tsi,waiter.next);
    if (_index != undefined) removewaiter(_tsi,_index);
  };
}

var count = function (tsi) {
  var data=tsi.data,i,n=0;  
  for (i in data) {if (data[i] != undefined) n++};
  return n;
}

/** Find one/all matching tuple(s) in the database based on pattern matching
 *
 */
var lookup = function (pat,all) {
  var tsi,nary=pat.length,res=none;
  if (nary>current.node.ts.n || nary==0) return;
  tsi=current.node.ts.db[nary];
  if (!all && Comp.isString(pat[0]) && tsi.hash[pat[0]]!=undefined) {
    // Speedup trial with hash key
    res=match(tsi.data[tsi.hash[pat[0]]],pat);
  }
  if (res==none) {
    res = (all?Comp.array.filtermap:Comp.array.findmap)(tsi.data,function (tuple) {
      if (tuple==_) return none;
      else return match(tuple,pat);
    });
    if (res && res.length==0) res=none;
    if (res == none && current.node.ts.providers.length>0) {
      res = Comp.array.findmap(current.node.ts.providers,function (provider) {
        return provider(pat);
      });
    }
  }
  return res;
}
// return only the table index of matching data table entry
var lookupIndex = function (pat,all) {
  var tsi,nary=pat.length,res=none;
  if (nary>current.node.ts.n || nary==0) return;
  tsi=current.node.ts.db[nary];
  if (!all && Comp.isString(pat[0]) && tsi.hash[pat[0]]!=undefined) {
    // Speedup trial with hash key
    res=match(tsi.data[tsi.hash[pat[0]]],pat);
    if (res!=none) return tsi.hash[pat[0]];
  }
  if (res==none) {
    res = (all?Comp.array.filtermap:Comp.array.findmap)(tsi.data,function (tuple,index) {
      if (tuple==_) return none;
      else return match(tuple,pat)?index:none;
    });
    if (res && res.length==0) res=none;
  }
  return res;
}

/*******************************************
** Tuple management
*******************************************/

/**
 * Compare two values, check equiality
 */
var equal = function(x,y) {
  var i;
  if(x==y) return true;
  if (Comp.obj.isArray(x) && Comp.obj.isArray(y)) {
    if (x.length!=y.length) return false;
    for(i in x) {
      if (x[i] != y[i]) return false;
    }
    return true;
  }
  return false;  
}

/** Match a tuple element with a template pattern element y.
 *
 */
var match1 = function (x,y) {
  if (y==any) return true;
  if (x==y)   return true;
  if ((x instanceof Array) && (y instanceof Array)) return match(x,y)!=none;
  if (y instanceof RegExp && typeof x == 'string' && y.test(x)) return true; 
  return false;
}

/** Match a tuple with a template and return none or the original tuple (equivalence result?)
 *
 */
var match = function (tuple,templ) {
  var i;
  if (tuple.length != templ.length) return none;
  for(i in tuple) {
    if (!match1(tuple[i],templ[i])) return none;
  };
  return tuple;
}


/** Find and remove one/all matching tuple(s) from the database based on pattern matching
 *
 */
var remove = function (pat,all) {
  var tsi,nary=pat.length,res=none,removed=false,hashed=_;
  if (nary>current.node.ts.n || nary==0) return;
  tsi=current.node.ts.db[nary];
  if (!all && Comp.isString(pat[0])) hashed=tsi.hash[pat[0]];
  if (hashed != _) {
    // Speedup trial with hash key
    res=match(tsi.data[hashed],pat);
    if (res) {
      // invalidate matching tuple in data list
      removed=true;
      tsi.data[hashed]=_;
      tsi.tmo[hashed]=0;
      // remember the free slot in the data list
      if (tsi.free==none) tsi.free=hashed;
      // invalidate hash entry - tuple is consumed
      delete tsi.hash[pat[0]];
    }
  }
  if (res==none || removed==false) {    
    res = (all?Comp.array.filtermap:Comp.array.findmap)(tsi.data,function (tuple,i) {
        if (tuple==_) return none;
        var res_=match(tuple,pat);
        if (res_!=none) {
          if (Comp.isString(pat[0]) && tsi.hash[pat[0]]==i) {
            // Invalidate hash - tuple is consumed
            delete tsi.hash[pat[0]];            
          } 
          tsi.data[i]=_;
          tsi.tmo[i]=0;
          if (tsi.free==none) tsi.free=i;
          return res_;
        } else return none;
    });
    if (res && res.length==0) res=none;
  }
  return res;
}


/*******************************************
** Tuple Space Agent/Client API
*******************************************/

var ts = {
  // consuming - tmo <> 0 => try_alt
  alt: function (pats,callback,all,tmo) {
    var tsi,nary,res,
        i,p,pat,waiters=none,last=none;
    for(i in pats) {
      pat=pats[i];
      nary=pat.length;
      if (nary>current.node.ts.n || nary==0) return none;
      res = remove(pat,all);
      if (res && res.length) current.node.stats.tsin += (all?res.length:1);
      if (res && callback) {
        callback.call(current.process.agent,res);
        return;
      } 
      else if (res) return res;  
    }
    if (callback && tmo==0) return callback();
    if (tmo==0) return;
     
    // No matching tuple found - go to sleep
    
    for(i in pats) {
      pat=pats[i];
      nary=pat.length;
      if (callback  && (tmo==undefined||tmo>0))  {
        if (waiters==none) 
          waiters={pat:pat,
                   pro:current.process,
                   cb:callback,
                   op:'in'+(all?'-all':''),
                   tmo:tmo>0?Aios.time()-current.world.lag+tmo:0
                  },last=waiters;
        else {
          last.next={pat:pat,
                   pro:current.process,
                   cb:callback,
                   op:'in'+(all?'-all':''),
                   tmo:tmo>0?Aios.time()-current.world.lag+tmo:0,
                   prev:last
                  },last=last.next;
        }
      }
    }
    if (waiters!=none) {
      p=waiters;
      while(p) {
        tsi=current.node.ts.db[p.pat.length];
        addwaiter(tsi,p);
        p=p.next;
      }
      log(tsi,current.process,' +waiter');
      current.process.suspend(tmo>0?Aios.time()-current.world.lag+tmo:0,_,'ts');
    }
  },
  
  // The collect primitive moves tuples from this source TS that match template 
  // pattern into destination TS specified by path 'to' (a node destination).
  collect: function (to,pat) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0) return none;
    tsi=current.node.ts.db[nary];
    res = remove(pat,true);    
    if (res.length>0) {
      current.node.stats.tsin += res.length;
      Aios.Sig.agent.sendto(to,'TS.SIG',res);
    }
    return res.length;
  },
  // Copy all matching tuples form this source TS to a remote destination TS
  // specified by path 'to' (a node destination).
  copyto: function (to,pat) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0) return 0;
    tsi=current.node.ts.db[nary];
    res = lookup(pat,true);    
    if (res.length>0) {
      Aios.Sig.agent.sendto(to,'TS.SIG',res);
    }
    return res.length;
  },

  // Access a tuple evaluator - non-blocking: no listener -> callback(null)
  // TODO blocking/tmo
  evaluate: function (pat,callback,tmo) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0) return none;
    tsi=current.node.ts.db[nary];
    consumed=checkwaiter(tsi,pat,callback);
    if (!consumed && callback) callback.call(current.process.agent,null); 
  },  
  
  // Test tuple existence
  exists: function (pat) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0) return none;
    tsi=current.node.ts.db[nary];
    res = lookup(pat);
    return res!=none;  
  },
  
  // consuming - tmo <> 0 => try_in
  inp: function (pat,callback,all,tmo) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0 || typeof pat != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    res = remove(pat,all);
    log(tsi,current.process,' in? '+res+' []='+count(tsi));
    if (res && res.length) current.node.stats.tsin += (all?res.length:1);
    if (res==none && callback && (tmo==undefined||tmo>0)) {
      addwaiter(tsi,{pat:pat,
                     pro:current.process,
                     cb:callback,
                     op:'in'+(all?'-all':''),
                     tmo:tmo>0?Aios.time()-current.world.lag+tmo:0
                     });
      log(tsi,current.process,' +waiter');
      current.process.suspend(tmo>0?Aios.time()-current.world.lag+tmo:0,_,'ts');
      return none;
    } else if (callback) callback.call(current.process.agent,res); else return res;
  },

  // Provide a tuple evaluator
  listen: function (pat,callback) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0 || typeof pat != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    addwaiter(tsi,{pat:pat,
                     pro:current.process,
                     cb:callback,
                     op:'listen',
                     tmo:0
                     });    
  },  
  
  // Store time-limited tuples
  mark: function (tuple,tmo) {
    var p,tsi,nary=tuple.length,consumed=false;
    if (nary>current.node.ts.n || nary==0 || typeof tuple != 'object') throw 'TS';
    if (current.process && (current.process.resources.tuples+1) > (current.process.resources.TS||Aios.options.TSPOOL)) throw 'EOL';
    tuple=Comp.copy(tuple); // decouple producer context
    tsi=current.node.ts.db[nary];
    current.node.stats.tsout++;
    // Check waiters
    consumed=checkwaiter(tsi,tuple);
    if (!consumed) {
      if (tsi.free==none) {
        loop: for (var i in tsi.data) {
          if (tsi.data[i]==_) {tsi.free=i; break loop}
        }
      }
      if (options.timeout) tmo=min0(options.timeout,tmo);
      tmo=Aios.time()-current.world.lag+tmo;
      if (tsi.free!=none) {
        tsi.data[tsi.free]=tuple;
        tsi.tmo[tsi.free]=tmo;
        current.node.ts.timeout=min0(current.node.ts.timeout,tsi.tmo[tsi.free]);
        if (Comp.obj.isString(tuple[0]))
          tsi.hash[tuple[0]]=tsi.free;
        tsi.free=none;
      } else {
        tsi.data.push(tuple);
        tsi.tmo.push(tmo);
        // hash is only a first guess to find a tuple
        if (Comp.obj.isString(tuple[0]))
          tsi.hash[tuple[0]]=tsi.data.length-1;
      }
    } else current.node.stats.tsin++;
  },
  // Store a tuple in this TS
  out: function (tuple) {
    var tsi,tmo=0,nary=tuple.length,consumed=false,res;
    if (nary>current.node.ts.n || nary==0 || typeof tuple != 'object') throw 'TS';
    if (current.process && (current.process.resources.tuples+1) > (current.process.resources.TS||Aios.options.TSPOOL)) throw 'EOL'; 
    tsi=current.node.ts.db[nary];
    tuple=Comp.copy(tuple); // decouple producer context
    current.node.stats.tsout++;
    // Check waiters
    consumed=checkwaiter(tsi,tuple);
    if (!consumed) {
      if (tsi.free==none) {
        loop: for (var i in tsi.data) {
          if (tsi.data[i]==_) {tsi.free=i; break loop}
        }
      }
      if (options.timeout) tmo=Aios.time()-current.world.lag+options.timeout;
      if (tmo) current.node.ts.timeout=min0(current.node.ts.timeout,tmo);

      if (tsi.free!=none) {
        tsi.data[tsi.free]=tuple;
        tsi.tmo[tsi.free]=tmo;
        if (Comp.obj.isString(tuple[0]))
          tsi.hash[tuple[0]]=tsi.free;
        tsi.free=none;
      }
      else {
        tsi.data.push(tuple);
        tsi.tmo.push(tmo);
        // hash is only a first guess to find a tuple
        if (Comp.obj.isString(tuple[0]))
          tsi.hash[tuple[0]]=tsi.data.length-1;
      }
    } else current.node.stats.tsin++;
    log(tsi,current.process,' out '+tuple+'  ['+nary+'] consumed='+consumed+' []='+count(tsi));
  },
  
  // not consuming - tmo <> undefined => try_rd [0: immed.]
  rd: function (pat,callback,all,tmo) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0 || typeof pat != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    res = lookup(pat,all);

    if (res==none && callback && (tmo==_||tmo>0)) {
      addwaiter(tsi,{pat:pat,
                     pro:current.process,
                     cb:callback,
                     op:'rd'+(all?'-all':''),
                     tmo:tmo>0?Aios.time()-current.world.lag+tmo:0
                    });
      current.process.suspend(tmo>0?Aios.time()-current.world.lag+tmo:0,_,'ts');
      return none;
    } else if (callback) callback.call(current.process.agent,res); else return res;
  },
  
  // consuming 
  rm: function (pat,all) {
    var tsi,nary=pat.length,res;
    if (nary>current.node.ts.n || nary==0 || typeof pat != 'object') throw 'TS';
    tsi=current.node.ts.db[nary];
    res = remove(pat,all);
    if (res && res.length) current.node.stats.tsin += (all?res.length:1);
    return (res!=none);
  },

  // Remote tuple storage
  store: function (to,tuple) {
    Aios.Sig.agent.sendto(to,'TS.SIG',[tuple]);
    return 1;
  },
  
  // Test and Set: Atomic modification of a tuple - non blocking
  // Updates timeout of markings and time limited tuples, too.
  // typeof @callbackOrTimeout: function (tuple) -> tuple | timeout number
  ts: function (pat,callbackOrTimeout) {
    var tsi,nary=pat.length,index,res,ret,tmo;
    if (nary>current.node.ts.n || nary==0 || !Comp.obj.isArray(pat)) throw 'TS';
    tsi=current.node.ts.db[nary];
    index = lookupIndex(pat,false);
    if (index!=none) res=tsi.data[index]; else return;
    log(tsi,current.process,' test? '+res+' []='+count(tsi));
   
    if (typeof callbackOrTimeout == 'function') {
      if (current.process)
        ret=callbackOrTimeout.call(current.process.agent,res);
      else
        ret=callbackOrTimeout(res);
      // update the modified tuple
      if (ret && ret.length==res.length) Comp.array.copy(ret,res);
      res=ret;
    } else if (typeof callbackOrTimeout == 'number') {
      // update timestamp
      tmo=min0(options.timeout,callbackOrTimeout);
      tmo=Aios.time()-current.world.lag+tmo;
      tsi.tmo[index]=Math.max(tmo,tsi.tmo[index]);
    }
    return res;
  },
  try : {
    alt : function (tmo,pats,callback,all) {
      if (typeof callback == 'boolean') {
        all=callback;
        callback=null;
      }
      return ts.alt(pats,callback,all,tmo);
    },
    evaluate : function (tmo,pat,callback) {
      return ts.evaluate(pat,callback,tmo);
    },
    inp : function (tmo,pat,callback,all) {
      if (typeof callback == 'boolean') {
        all=callback;
        callback=null;
      }
      return ts.inp(pat,callback,all,tmo);
    },
    rd : function (tmo,pat,callback,all) {
      if (typeof callback == 'boolean') {
        all=callback;
        callback=null;
      }
      return ts.rd(pat,callback,all,tmo);
    }
  }
}

// Synonyms
ts.alt.try = ts.try.alt
ts.evaluate.try = ts.try.evaluate
ts.inp.try = ts.try.inp
ts.rd.try = ts.try.rd

/*******************************************
** Tuple Space Data Base
*******************************************/

var tsd = function (options) {
  var self=this;
  if (!options) options={};
  this.n=options.maxn||8;
  this.id=options.id||'TS';
  this.timeout=0;
  this.db=Comp.array.init(this.n+1,function (i) {
    var tsi;
    if (i==0) return none;
    tsi = {
        i:i,
        hash:[],
        // number|none
        free:none,
        // [*] [] 
        data:[],
        // number []
        tmo:[],
        // [pattern,agent,callback,kind]
        waiters:[]
    };
    tsi.waiters.free=[];
    tsi.waiters.hash={}; // Hash tuple key for consuming waiter
    return tsi;
  });
  /*
  ** Additional external tuple providers implementing a match function.
  */
  this.providers=[];
  /*
  ** Additional external tuple consumers implementing a match function.
  */
  this.consumers=[];
  this.node=options.node;

  // External API w/o blocking and callbacks (i.e., try_ versions with tmo=0)
  // Can be called from any context
  this.extern = {
    exists: function (pat,callback) { 
      var res,_node=current.node;
      current.node=self.node||_node;
      res=ts.exists(pat,callback);
      current.node=_node;
      return res;
    },    
    inp: function (pat,all) {
      var res,tsi,nary=pat.length,_node=current.node;
      current.node=self.node||_node;
      if (nary>current.node.ts.n || nary==0) return none;
      tsi=current.node.ts.db[nary];
      res = remove(pat,all);
      if (res && res.length) current.node.stats.tsin += (all?res.length:1);
      current.node=_node;
      return res;
    },
    mark: function (pat,tmo) { 
      var res,_node=current.node,_proc=current.process;
      current.node=self.node||_node; current.process=null;
      res = ts.mark(pat,tmo);
      current.node=_node;
      current.process=_proc;
      return res;
    },
    out: function (pat) { 
      var res,_node=current.node,_proc=current.process;
      current.node=self.node||_node; current.process=null;
      res = ts.out(pat)
      current.node=_node;
      current.process=_proc;
      return res;
    },
    rd: function (pat,all) {
      var res,tsi,nary=pat.length,_node=current.node;
      current.node=self.node||_node;
      if (nary>current.node.ts.n || nary==0) return none;
      tsi=current.node.ts.db[nary];
      res = lookup(pat,all);
      if (res && res.length) current.node.stats.tsin += (all?res.length:1);
      current.node=_node;
      return res;
    },
    rm: function (pat,all) { 
      var res,_node=current.node;
      current.node=self.node||_node;
      res=ts.rm(pat,all);
      current.node=_node;
      return res;
    },
    ts: function (pat,callback) { 
      var res,_node=current.node;
      current.node=self.node||_node;
      res=ts.ts(pat,callback);
      current.node=_node;
      return res;
    },
  }

}

var create = function (options) {
  return new tsd(options);
}

tsd.prototype.checkwaiter = function (tuple) {
  var tsi,nary=tuple.length;
  if (nary>this.n || nary==0) return none;
  tsi=current.node.ts.db[nary];
  return checkwaiter(tsi,tuple);
}

/** Remove an agent process from waiter queues.
 * If doCallback is set, a pending operation callback handler is executed here (e.g., on timeout or interruption).
 *
 */
tsd.prototype.cleanup = function (process,doCallback) {
  var i,j,tsi,p,waiter,node=process.node;
  function cb(waiter) {
    Aios.CB(waiter.pro,function () {waiter.cb.call(waiter.pro.agent,null)});
  }
  for (i in node.ts.db) {
    if (i==0) continue;
    tsi=node.ts.db[i];
    for(j=0;j<tsi.waiters.length;j++) {
      if (!tsi.waiters[j]) continue;
      waiter=tsi.waiters[j];
      if (waiter.pro.pid==process.pid) {
        if (doCallback && waiter.cb) cb(waiter);
        removewaiter(tsi,j);
      }
    }
  }
} 


/**
 * Register an external tuple provider (function).
 * The provider can immediately return a matching tuple,
 * or can deliver it later on calling the checkwaiter loop 
 * which delivers the tuple to the agent.
 *
 * type of func  : provider|consumer
 * type provider : function ('pat) -> 'tuple
 * type consumer : function ('pat) -> boolean
 */
tsd.prototype.register = function (func,consumer) {
  if (consumer) this.consumers.push(func)
  else this.providers.push(func);
};


tsd.prototype.print = function (summary) {
  var i,tsi,num,str='',sep='';
  if (summary) {
    str += '[';
    for (i in current.node.ts.db) {
      if (i==0) continue;
      tsi=current.node.ts.db[i];
      num = count(tsi);
      if (num>0) {
        str += sep+'TS'+(int(i)+1)+'='+num;
        sep=' ';
      }
    }
    str += ']'+NL;
  }    
  else for (i in current.node.ts.db) {
    if (i==0) continue;
    tsi=current.node.ts.db[i];
    str += '['+Comp.printf.sprintf('%2d',tsi.i)+
           ' free='+(tsi.free?Comp.printf.sprintf('%4d',tsi.free):'none')+
           ' data='+Comp.printf.sprintf('%4d(%4d)',count(tsi),tsi.data.length)+
           ' waiters='+Comp.printf.sprintf('%4d',tsi.waiters.length)+']'+NL;
  }  
  return str;  
}


/** Tuple Space Garbage Collection and Timeout Service
 *
 */
tsd.prototype.service = function (curtime) {
  var i,hashed,tsi,nexttime=0;
  
  // TODO: if (curtime<this.timeout) return;
  for (i in this.db) {
    tsi=this.db[i];
    hashed;
    if (tsi==_) continue;
    Comp.array.iter(tsi.tmo,function (tmo,i) {
      var tuple=tsi.data[i];
      if (tuple && tmo) {
        if (tmo < curtime) {
          if (Comp.isString(tuple[0])) hashed=tsi.hash[tuple[0]];
          if (hashed != _ && hashed==i) delete tsi.hash[tuple[0]];
          tsi.data[i]=_;
          tsi.tmo[i]=0;
          if (tsi.free==none) tsi.free=i;        
        } else nexttime=min0(nexttime,tmo);
      }
    });
  }
  this.timeout=nexttime;
}

module.exports = {
  agent:ts,
  count:count,
  create: create,
  current:function (module) { current=module.current; Aios=module; },
  match:match,
  options:options
}
