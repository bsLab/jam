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
 **    $INITIAL:     (C) 2006-2016 bLAB
 **    $CREATED:     24-3-15 by sbosse.
 **    $VERSION:     1.3.1
 **
 **    $INFO:
 **
 **  DOS: Task Scheduler
 **
 **    $ENDOFINFO
 */
"use strict";
var log = 0;
var timestamp=1;

var Io = Require('com/io');
var util = Require('util');
var Comp = Require('com/compat');
var Json = Require('jam/jsonfn');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var trace = Io.tracing;

/**
 *
 * @type {undefined|taskcontext}
 */
var current = undefined;
/**
 *
 * @type {undefined|taskscheduler}
 */
var current_scheduler = undefined;

var scheduling = false;
var TICK=10;
/*
** Program time with TICK resolution
 */
var time=0;

/**
 *
 * @type {undefined|object}
 */
var timer=undefined;

/** The process context class
 *
 * @param {string} id
 * @param {* []} [trans]
 * @param {object} [obj]
 * @constructor
 * @typedef {{id,blocked,trans,block,obj,timeout,timer,state}} taskcontext~obj
 * @see taskcontext~obj
 */
var taskcontext = function (id,trans,obj) {
    this.id=id;
    this.blocked=false;
    this.event=0;
    this.trans=trans;
    this.block=[];
    this.obj=obj;
    this.timeout=0;
    this.timer=0;
    this.state=undefined;
};
/** The scheduler class
 *
 *  @constructor
 *  @typedef {{context,callbacks,handler,current:taskcontext,nextid,lock,nested:number,reschedule:number}} taskscheduler~obj
 *  @see taskscheduler~obj
 */
var taskscheduler = function () {
    var self=this;
    this.context=[new taskcontext('root',[],self)];
    this.callbacks=[];
    this.handler=[];
    this.current=undefined;
    this.nextid=0;
    this.lock=0;
    this.nested=0;
    this.reschedule=0;
    current_scheduler=self;
};

/**
** Add a callback function executed once in the next scheduler run
** before any process (context) activity execution.
 *
 *
 * @param {function|[]} callback that is fun or [fun] or [fun,arg1,arg2,..,arg9]
 */
taskscheduler.prototype.add_callback = function(callback) {
    this.callbacks.push(callback);
};

/**
 ** Add a timer handler function executed once or cont. by the scheduler.
 *
 *
 * @param {number} timeout
 * @param {string} name
 * @param {function} callback
 * @param {boolean} once
 */
taskscheduler.prototype.add_timer = function(timeout,name,callback,once) {
    var self=this;
    var cont = new taskcontext(name);
    Object.preventExtensions(cont);
    var trans=[
        [
            undefined,
            function () {
                if (once==true) {
                    cont.timeout = 0;
                    cont.timer=0;
                    cont.blocked = true;
                } else {
                    cont.timer = time + cont.timeout;
                    cont.blocked = true;
                }
                callback(cont)
            },
            function () {return !cont.blocked; }
        ]
    ];
    cont.trans=trans;
    cont.timeout=timeout;
    cont.timer=time+timeout;
    cont.blocked=true;
    this.handler.push(cont);
};

/**
 *  Register a child scheduler function called on events (e.g., schedule next).
 */
taskscheduler.prototype.link = function(callback) {
    this.schedulers.push(callback);
};

taskscheduler.prototype.log = function (v) {log=v};

/**
** Remove a timer handler identified by its name.
 *
 *
 * @param {string} name
 */
taskscheduler.prototype.remove_timer = function(name) {
    var i;
    loop: for(i in this.handler) {
        var handler=this.handler[i];
        if (String.equal(handler.id,name))
        {
            this.handler.splice(i,1);
            break loop;
        }
    }
};


/*
** next:
**   fun
**   [fun]
**   [fun,arg1,arg2,..,arg9]
*/
function exec_block_fun(next) {
    var fun = next[0]||next,
        argn = next.length-1;
    switch (argn) {
        case 0:
        case -1:
            fun(); break;
        case 1: fun(next[1]); break;
        case 2: fun(next[1],next[2]); break;
        case 3: fun(next[1],next[2],next[3]); break;
        case 4: fun(next[1],next[2],next[3],next[4]); break;
        case 5: fun(next[1],next[2],next[3],next[4],next[5]); break;
        case 6: fun(next[1],next[2],next[3],next[4],next[5],next[6]); break;
        case 7: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7]); break;
        case 8: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7],next[8]); break;
        case 9: fun(next[1],next[2],next[3],next[4],next[5],next[6],next[7],next[8],next[9]); break;
        default:
            Io.err('Schedule.exec_block_fun: more than 9 function arguments');
    }
}

function schedule_block(con,manage) {
    var next;
    /*
     ** Process current function block sequence first!
     ** Format: [[fun,arg1,arg2,...],[block2], [block3], ..]
     ** Simplified: [fun,fun,...]
     */
    if (!con.blocked) {
        next = con.block[0];
        con.block.splice(0,1);
        /*
         ** Do no execute handler blocks maybe at the end of a subsection
         ** of the block list.
         */
        while (!Array.empty(con.block) && next.handler!=undefined) {
            next = con.block[0];
            con.block.splice(0,1);
        }
        if (next.handler==undefined) {
            current = con;
            manage.scheduled++;
            manage.scheduledcon++;
            Io.log((log<2)||('Schedule [B], starting context '+current.id+' block['+con.block.length+']'));
            Io.trace(trace||('Schedule [B], starting context '+current.id));
            try {exec_block_fun(next)} catch(e) {
                /*
                 ** Iterate through the block list and try to find a handler entry.
                 */
                while (next.handler==undefined && !Array.empty(con.block)) {
                    next = con.block[0];
                    con.block.splice(0,1);
                }
                if (next.handler!=undefined) {
                    /*
                     ** Call handler ...
                     */
                    Io.log((log<2)||('[SCHE] executing exception handler for error '+e));
                    // console.log(next.handler.toString())
                    try {exec_block_fun([next.handler,e])} 
                    catch (e) {
                      Io.out('Schedule [B], in context '+con.id+', got exception in exception handler: '+e);
                      // Io.printstack(e);
                      Io.out(Json.stringify(next).replace(/\\n/g,'\n'));
                    };
                } else {
                  Io.out('Schedule [B], in context '+con.id+', got uncaught exception in schedule block: '+e);
                  // Io.printstack(e);
                  Io.out(Json.stringify(next).replace(/\\n/g,'\n'));
                }
            }
            Io.log((log<2)||('Schedule [B], end context '+current.id+' blocked='+con.blocked+' block['+con.block.length+']'));
            Io.trace(trace||('Schedule [B], end context '+current.id+' blocked='+con.blocked+' block['+con.block.length+']'));
            if (con.blocked) manage.blocked++;
        }
    }
}

/** Add a new process context
**
 *
 * @param {taskcontext} c
 */
taskscheduler.prototype.Add = function(c) {
    this.context.push(c);
};

taskscheduler.prototype.Delay = function(millisec) {
  current.timer=time+millisec;
  current.timeout=0;
  current.blocked=true;
};

taskscheduler.prototype.GetCurrent = function() {
  return current;
};

taskscheduler.prototype.SetCurrent = function(context) {
  var _current=current; current=context; 
  return _current;
};

taskscheduler.prototype.TaskContext = function(id,proc) {
  var obj = new taskcontext(id,proc.transitions(),proc);
  Object.preventExtensions(obj);
  return obj;
};



/** Init scheduler
**
 *
 */
taskscheduler.prototype.Init = function() {
    var self=this;
    var i,con;
    time=0;
    current_scheduler=self;
    /*
    ** Set the root context
     */
    current=self.context[0];
    setInterval(function () {
        // TBD lock
        time=time+TICK;
        for (i in self.context) {
            con = self.context[i];
            if (con.timer > 0 && con.timer <= time) {
                // Timeout event occurred
                con.timer=0;
                con.blocked=false;
            }
        }
        for (i in self.handler) {
            con = self.handler[i];
            if (con.timer > 0 && con.timer <= time && Array.empty(con.block)) {
                // Timeout event occurred
                // Schedule only handler with empty scheduling block!
                Io.log((log<20)||('TIMEOUT '+con.timeout+' '+time));
                con.timer=0;
                con.blocked=false;
            }
        }
        // TBD unlock
    },TICK)
};


/** Scheduler run loop using timeout calls
 *
 */
taskscheduler.prototype.Run = function() {
    var i,con,
        self=this,
        reschedule=self.reschedule,
        nexttime=0;
    scheduling=true;
    Io.trace(trace||('Run('+this.nested+')..'));
    this.nested++;
    if (timer != undefined) clearTimeout(timer);
    while (self.Schedule()>0 || reschedule>0) {
      reschedule=self.reschedule; 
      self.reschedule=Perv.max(0,self.reschedule-1);
    }
    // if there are only blocked processes start a timer calling the scheduler later...

    for (i in self.context) {
      con = self.context[i];
      if (con.timeout>0) nexttime=(nexttime==0?con.timer:Perv.min(nexttime,con.timer));
    }
    for (i in self.handler) {
      con = self.handler[i];
      if (con.timeout>0) nexttime=(nexttime==0?con.timer:Perv.min(nexttime,con.timer));
    }
    /**
     *     If there are no timeout processes, we need no scheduling.
     *     But a timeout is required for proper JS processing. Each event
     *     will restart the timer!
     */

    if (nexttime==0) nexttime=time+TICK*10;
    timer=setTimeout(function () {self.Run ()},nexttime-time);
    this.nested--;
    Io.trace(trace||('Run('+this.nested+')+ '+(nexttime-time)));

    scheduling=false;
};

/** One schedule iteration
 *
 * @returns {number}
 */
taskscheduler.prototype.Schedule = function() {
    var i, j,con,cond,trans,state,state0,state1,remove,
        manage={
          scheduled:0,
          blocked:0,
          scheduledcon:0};
    //var log=2;

    // TBD lock
    Io.trace(trace||('Schedule Start'));
    Io.log((log<2)||('[SCHE '+Perv.mtime()+'] ('+time+') Schedule'));
    /*
     ** First the urgent callbacks, if any, A callback may not suspend the execution!
     ** (Pure computational statements)
     */
    for (i in this.callbacks) {
        var callback=this.callbacks[i];
        Io.log((log<2)||('[SCHE] executing callback ['+Array.length(callback)+']'));
        exec_block_fun(callback);
    }


    this.callbacks=[];
    /*
    ** Then the handlers, if any..
     */
    var handler=[];
    for (i in this.handler) {
        con=this.handler[i];
        remove=false;
        Io.log((log<10)||('handler '+util.inspect(con)));
        if (con.block && !Array.empty(con.block)) {
            // what to do? timer handler is always blocked!
            Io.log((log<2)||('Schedule [H], checking context '+con.id));
            schedule_block(con,manage);
            if (Array.empty(con.block)) {
                /*
                ** Restore timer handler
                 */
                if (con.timeout<=0) {
                    // must be removed
                    remove=true;
                } else {
                    con.blocked=true;
                    manage.blocked++;
                    con.state = state0;
                    if (con.timeout>0) con.timer = time + con.timeout;
                }
            }
        }
        else {
            trans:for(j in con.trans) {
                trans=con.trans[j];
                state=con.state;
                /*
                ** Transition row: [current activity function, next acitivity function, optional condition function]
                 */
                state0=trans[0];
                state1=trans[1];
                cond=trans[2];
                if (!con.blocked && state==state0 && (cond==undefined || cond(cond.obj))) {
                    con.state=state1;
                    current=con;
                    manage.scheduled++;
                    Io.log((log<2)||('Schedule [H], starting context '+current.id));
                    Io.trace(trace||('Schedule [H], starting context '+current.id));
                    state1();
                    if (con.block && !Array.empty(con.block)) {
                        // a new block was added in the timer handler, unblock this handler!
                        con.blocked=false;
                        remove=false;
                        // must be restored after the block list was executed!
                    }
                    else {
                        if (con.timeout<=0) {
                            // must be removed
                            remove=true;
                        } else {
                            if (con.blocked) manage.blocked++;
                            con.state = state0;
                        }
                    }
                 }
            }
        }
        if (!remove) handler.push(con);
    }
    this.handler=handler;
    /*
    ** Finally the context processes ..
     */
    for (i in this.context) {
        manage.scheduledcon=0;
        con=this.context[i];
        /*
         ** First the sequential statement blocks of the context process..
         */
        if (con.block && !Array.empty(con.block)) {
            schedule_block(con,manage);
        }
        if (!con.blocked && manage.scheduledcon==0) {
            /*
            ** Second the transitional section of the context process, if any (maybe empty)
             */
            trans:for (j in con.trans) {
                trans = con.trans[j];
                state = con.state;
                state0 = trans[0];
                state1 = trans[1];
                cond = trans[2];
                if (!con.blocked && state == state0 && (cond==undefined || cond(con.obj))) {
                    con.state = state1;
                    current = con;
                    Io.log((log<2)||('Schedule [T], starting context '+current.id));
                    Io.trace(trace||('Schedule [T], starting context '+current.id));
                    manage.scheduled++;
                    state1.call(con.obj);
                    if (con.blocked) manage.blocked++;
                    break trans;
                }
            }
        };
    }
    if (current.blocked) {
        /*
         ** Try to find a non-blocked context (root?)
         */
        loop: for (i in this.context) {
            con = this.context[i];
            if (!con.blocked) {
                current = con;
                break loop;
            }
        }
    }
    // TBD unlock
    Io.log((log<2)||('[SCHE '+Perv.mtime()+'] ('+time+') End '+(manage.scheduled+manage.scheduledcon)));
    Io.trace(trace||('Schedule End('+(manage.scheduled+manage.scheduledcon)+')'));
    return (manage.scheduled+manage.scheduledcon);
};




/**
 *
 *  Mutex Lock Object
 *  May only be used in scheduling blocks (last statement of a block element)!!
 *
 * @constructor
 * @typedef {{locked:bool,waiter:[],owner:taskcontext}} lock~obj
 * @see lock~obj
 */
var lock = function() {
    this.locked = false;
    this.waiter = [];
    this.owner = undefined;
};

lock.prototype.acquire = function () {
    if (!this.locked) {
        this.locked = true;
        this.owner = current;
    } else {
        this.waiter.push(current);
        current.blocked=true;
    }
};

lock.prototype.try_acquire = function () {
    if (!this.locked) {
        this.locked = true;
        return true;
    } else {
        return false;
    }
};

lock.prototype.release = function () {
    if (!Array.empty(this.waiter)) {
        var next = Array.head(this.waiter);
        this.waiter = Array.tail(this.waiter);
        next.blocked = false;
    } else {
        this.locked = false;
        this.owner=undefined;
    }
};

lock.prototype.init = function () {
    this.locked = false;
    this.owner = undefined;
    this.waiter = [];
};

lock.prototype.is_locked = function () {
    return this.locked;
};

var modu = {
    TICK:TICK,
    time:time,
    /**
     *
     * @param timeout
     * @param name
     * @param {function([context])} callback
     * @param [once]
     */
    AddTimer: function(timeout,name,callback,once) {
        if (current_scheduler) current_scheduler.add_timer(timeout,name,callback,once);
        this.ScheduleNext();
    },
    /**
     *
     * @param name
     */
    RemoveTimer: function(name) {
        if (current_scheduler) current_scheduler.remove_timer(name);
    },
    /**
     *
     * @returns {taskscheduler}
     */
    TaskScheduler: function() {
        var obj = new taskscheduler();
        Object.preventExtensions(obj);
        return obj;
    },
    /** Create a new transitional task context (virtual process)
     *  The process object consists of activity functions and a transition function.
     *  The object transition function variable must have the name 'transitions'.
     *  The transition function must return an array in the format:
     *  [
     *    [undefined,act_start]  // initial start activity
     *    [act1,act2,function(self){return <cond>}], // conditional transitions
     *    [act2,act3] // unconditional transition
     *    ..
     *  ]
     *  A transition from an outgoing activity function (of the process) act_i
     *  to another acitivty function a_j occurs only: 1. If the context is not blocked;
     *  2. If the condition is satisfied.
     *
     * @param {string} id
     * @param {object} proc
     * @returns {taskcontext}
     */
    TaskContext: function(id,proc) {
        var obj = new taskcontext(id,proc.transitions(),proc);
        Object.preventExtensions(obj);
        return obj;
    },
    /** Create and initialize a new transitional task context from a process constructor.
    * Simplified version of TaskContext. Returns the created process object.
    *
    * Proc = function (arg) {
    *  this.a1 = function () {}; ..
    *  this.a2 = function () {}; ..
    *  this.transitions = [ [ai,aj,cond], .. ];
    *  this.on = { err: function () {}, ..}; *optional*
    * }
    *
    * 
    */
    NewTask: function (id,Proc,arg) {
      var proc, context;
      proc = new Proc(arg);
      context = new taskcontext(id,proc.transitions,proc);
      proc.context=context;
      current_scheduler.Add(proc.context);
      return proc;
    },
    /** Create and add a new functional task context. Inside the function
     *  scheduling blocks and loops can be used.
     *
     * @param {taskscheduler|undefined} sched
     * @param id
     * @param fun
     * @param [arg]
     * @returns {taskcontext}
     */
    FunContext: function(sched,id,fun,arg) {
        var Sch=this, proccon, proc;
        if (sched==undefined) sched=current_scheduler;
        proccon = function () {
            var self=this;
            this.act =function(){fun(arg)};
            this.transitions = function(){
                var trans;
                trans = [
                    [undefined,this.act]
                ];
                return trans;
            };
            this.context = Sch.TaskContext(id, self);
        };
        proc = new proccon();
        sched.Add(proc.context);
        return proc.context;
    },
    Bind: function (object, method) {
        return method.bind(object);
    },
    Delay: function(millisec) {
        current.timer=time+millisec;
        current.timeout=0;
        current.blocked=true;
    },
    GetId: function() {return current.id;},
    /** Return current context
     *
     * @returns {undefined|taskcontext}
     */
    GetCurrent: function() {return current;},
    /** Return current context
     *
     * @param [taskcontext]
     * @returns {undefined|taskcontext}
     */
    SetCurrent: function(context) {var _current=current; current=context; return _current},
    /** Get current scheduler
     *
     * @returns {undefined|taskscheduler}
     */
    GetScheduler: function() {return current_scheduler;},
    /** Get current system time
     *
     * @returns {number}
     */
    GetTime: function() {return time;},

    /** Call the scheduler ASAP.
     *  Usefull after a Wakeup call. 
     */
    Schedule: function() {
        Io.trace(trace||('Schedule'));
        if (!scheduling && current_scheduler != undefined) {
            if (timer != undefined) clearTimeout(timer);
            timer=undefined;
            //timer=setTimeout(function () {current_scheduler.Run ()},0);
            current_scheduler.Run ()
        } else {
            current_scheduler.reschedule++;
        }
    },
    /** Call the scheduler ASAP, eventually with a callback function executed first.
    *  Must be preemption save!
    *
     *
     * @param [callback]
     * @param [args]
     */
    ScheduleNext: function(callback,args) {
        Io.trace(trace||('ScheduleNext'));
        if (!scheduling && current_scheduler != undefined) {
            if (callback) current_scheduler.add_callback(callback,args);
            if (timer != undefined) clearTimeout(timer);
            timer=undefined;
            //timer=setTimeout(function () {current_scheduler.Run ()},0);
            current_scheduler.Run ()
        } else {
            if (callback) current_scheduler.add_callback(callback,args);
            current_scheduler.reschedule++;
        }
    },
    /**
     ** Schedule an asynchronous callback function execution.
     *  Must be preemption-save! If we are currently scheduling, queue the
     *  callback, otherwise execute it immediately,
     *
     *
     * @param {function|[]} callback that is fun or [fun] or [fun,arg1,arg2,..,arg9]
     *
     */
    ScheduleCallback: function(callback) {
        Io.trace(trace||('ScheduleNext'));
        if (!scheduling) {
            scheduling=true;
            exec_block_fun(callback);
            scheduling=false;
            /*
            ** Pending scheduler run?
             */
            if (current_scheduler.reschedule>0) {
                if (timer != undefined) clearTimeout(timer);
                timer=undefined;
                //timer=setTimeout(function () {current_scheduler.Run ()},0);
                current_scheduler.Run ()
            }
        } else {
            current_scheduler.add_callback(callback);
            current_scheduler.reschedule++;
        }
    },
    /**
    ** Add a scheduler function execution block to the current context.
    ** Each entry in the block array (a partition) is executed in the given order sequentially.
    ** Each entry of [[fun,arg1,arg2,...],[block2], [block3], ..] may block (suspend execution).
    ** Notes:
    **  - Bind methods to respective objects: [Sch.Bind(ob,obj.method),..]
    **  - The scheduler block must be the last (and(or only) statement in an activity or a function.
     *  - A blocking statement must be the last statement in a block partition.
    **  - The current context activity may NOT be blocked with a Sch.Suspend operation!!
    *
     *
     * @param {* []} block [[fun,arg1,arg2,...],[block2], [block3], ..] or simplified [fun,fun,..]
     * @param {function} [handler] optional exception handler function fun(exception)
     */
    ScheduleBlock: function(block,handler) {
        /*
        ** Schedule sequence of functions that may block (suepend execution of current context process).
        ** If there are already block elements, add the new
        ** block elements to the top (!!) of the current block.
        */
        if (handler!=undefined ) block.push({handler:handler});
        if (current.block.length == 0) current.block=block;
        else current.block=Array.merge(block,current.block);
    },
    /**
     *
     * @param {function(index:number):boolean} cond  function() { return cond; }
     * @param {* []} body [[fun,arg1,arg2,...],[block2], [block3], ..] or simplified [fun,fun,..]
     * @param {* []} [finalize] optional loop finalize block
     * @param {function} [handler] optional exception handler function fun(exception)
     *
     * Note: NEVER raise an exception in a callback called in a block function if there is a handler here!
     *       Another still active handler can be executed instead!
     */
    ScheduleLoop: function(cond,body,finalize,handler) {
        var self=this;
        var index=0;
        /*
        ** Iterate and schedule a block
         * cond: function(index) { return cond; }
        */
        var block = [
            function() {
                    if (cond(index)) {
                        self.ScheduleBlock(body.slice());
                    } else if (finalize!=undefined) {
                        self.ScheduleBlock(finalize);
                    }
            },
            function() {
              index++;
            },
            function () {
                if (cond(index)) {
                    self.ScheduleBlock(block.slice());
                }
                else if (finalize!=undefined) {
                    self.ScheduleBlock(finalize);
                }
            }
        ];
        if (handler!=undefined ) block.push({handler:handler});
        self.ScheduleBlock(block.slice());
    },
    /**
     *
     * @param blocked
     * @param [context]
     */
    SetBlocked: function(blocked,context) {
        if (context==undefined) {
          current.blocked=blocked;
        } else {
          context.blocked=blocked;
          if (context.blocked==false && context.parent) {
            if (context.parent.blocked) {
              context.parent.blocked=false;
            }
            // console.log(context.parent.id);
            context.parent.event++; 
          }
        }
    },
    /**
     *
     * @param context
     * @returns {*|boolean}
     */
    IsBlocked: function(context) {
        if (context==undefined) 
          return current.blocked;
        else 
          return context.blocked;
    },
    /**
     *
     * @param context
     */
    Suspend: function(context) {
        Io.log((log<3)||('[SCH] Suspend: '+(context?context.id:current.id) ));
        if (context==undefined)
            current.blocked=true;
        else
            context.blocked=true;
        return current;
    },
    /** Wake up a context. Modifies only the context.
     *  Use Schedule() to force ASAP scheduling.
     *
     * @param context
     */
    Wakeup: function(context) {
        context.blocked = false;
        if (context.parent) {
          if (context.parent.blocked) {
            context.parent.blocked=false;
          }
          // console.log(context.parent);
          context.parent.event++; 
        }
        Io.log((log<3)||('[SCH] Wakekup: '+context.id));
    },
    /**
     ** Mutex Lock Object
     ** May only be used in scheduling blocks (last statement of a block element)!!
     *
     * @returns {lock}
     */
    Lock: function() {
        var obj = new lock();
        Object.preventExtensions(obj);
        return obj;
    }
    
};
module.exports=modu;
modu.B = module.exports.ScheduleBlock.bind(module.exports);
modu.L = module.exports.ScheduleLoop.bind(module.exports);
global.B = module.exports.ScheduleBlock.bind(module.exports);
global.L = module.exports.ScheduleLoop.bind(module.exports);
global.Delay = module.exports.Delay.bind(module.exports);
