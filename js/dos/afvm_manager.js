/**
 * Created by sbosse on 3/6/15.
 */
var Types = require('./afvm_types');
var Net = require('./network');
var Que = require('./afvm_queue');
var Sch = require('./scheduler');
var Io = require('./io');
var util = require('util');
var div = require('./compat').div;

// delayed binding due to cross referencing
var Vm=undefined;

var assert = function(condition, message) {
    if (!condition)
        throw Error("[afvm_manager]" + (typeof message !== "undefined" ? ": " + message : ""));
};

var Manager = function(max_proc,max_vm,cf_max) {
    var con,i,j;
    con=Sch.Context(0,this);

    this.MAX_PROC=max_proc;
    // Process table
    this.PT=[];
    // Code Frame list table (one for each VM)
    this.CQ=[];
    // Token list??
    this.PQ=[];

    // All attached VMs
    this.vms=[];
    // Processing queue
    this.tq=new Que.TokenQueue('AM.T');
    // Suspend queue
    this.sq=new Que.TokenQueue('AM.S');
    // Wakeup queue
    this.wq=new Que.TokenQueue('AM.S');
    this.netout=undefined;
    this.context=con;
    this.token=undefined;
    for(i=0;i<max_proc;i++) this.PT.push(
        new Types.Process(Types.Process_state.PROC_NOTUSED,
            i,0,0,0,0,Net.Direction.ORIGIN,0,0,new Net.Position(0,0),
            Types.Process_await.AWAIT_NONE,0)
    );
    for (i=0;i<max_vm;i++) {
        var _prcc_cfq = [];
        for (j = 0; j < cf_max; j++) {
            // _prcc_cfq ::+ (j-1)
            _prcc_cfq.push(j);
        }
        this.CQ.push(_prcc_cfq);
    }
    // delayed binding due to cross referencing
    Vm = require('./afvm_vm');
};

Manager.prototype.NewProc = function (pro_vm,pro_gid,pro_cfroot,pro_cfcur,pro_ip) {
    var i=0;
    while (i<this.MAX_PROC && this.PT[i].pro_flag != Types.Process_state.PROC_NOTUSED) i++;
    var pe = this.PT[i];
    if (pe.pro_flag != Types.Process_state.PROC_NOTUSED) return undefined;
    else {
        pe.pro_flag     = Types.Process_state.PROC_START;
        pe.pro_vm       = pro_vm;
        pe.pro_cfroot   = pro_cfroot;
        pe.pro_cfcur    = pro_cfcur;
        pe.pro_ip       = pro_ip;
        pe.pro_gid      = pro_gid;
        return i;
    }

};

Manager.prototype.GetProc = function (pi)
{
    if (pi<0 || pi>=this.MAX_PROC) return undefined;
    return this.PT[pi];
};

Manager.prototype.Add = function (obj)
{
    if (obj instanceof Vm.VM) this.vms.push(obj);
    else assert (false,'Unknown object '+util.inspect(obj))
};

Manager.prototype.Kill = function (pro) {
    console.log('[MANA] Killing agent process '+util.inspect(pro))
};

/*
** State Machine
 */


Manager.prototype.init = function (self) {
    console.log('[MANA] Init.');
};

Manager.prototype.await = function (self) {
    self.token=self.tq.Inq();
    console.log('[MANA] Await. [blocked '+self.context.blocked+' token='+util.inspect(self.token)+']');
};

Manager.prototype.execute = function (self) {
    var pro,vm,processor,breakit,id,tw;
    console.log('[MANA] Execu.');
    switch (self.token.tk_colour) {
        case Types.Token_colour.TK_PRO:
            pro = self.PT[self.token.tk_pi];
            processor = self.vms[pro.pro_vm].processor;
            if (pro.pro_flag == Types.Process_state.PROC_START) {
                pro.pro_flag = Types.Process_state.PROC_RUN;
                vm = self.vms[pro.pro_vm];
                vm.tq.Outq(self.token);
            } else if (pro.pro_flag == Types.Process_state.PROC_STOP) {
                self.Kill(pro);
                processor.proc_free(self,pro)
            } else if (pro.pro_flag == Types.Process_state.PROC_EXCEPTION) {
                self.Kill(pro)
                processor.proc_free(self,pro);
            } else if (pro.pro_flag == Types.Process_state.PROC_MOVE) {
                // pass to network_out manager --
                self.netout.Outq(self.token);
            } else if (pro.pro_flag == Types.Process_state.PROC_SUSP) {
                self.sq.Outq(self.token);
            } else if (pro.pro_flag == Types.Process_state.PROC_AWAIT) {
                self.sq.Outq(self.token);
            }
            break;

        case Types.Token_colour.TK_TS_EVENT:
            /*
            ** filter out all suspended processes
            ** waiting for the event (t.tk_pi)
            */
            id = -1;
            breakit = self.sq.Emptyq();
            while (!breakit) {
                tw = self.sq.Inq();
                if (id == -1) id = tw.tk_pi;
                else if (id == tw.tk_pi) {
                    self.sq.Outq(tw);
                    breakit = true;
                }
                if (!breakit) {
                    pro = self.PT[tw.tk_pi];
                    if (pro.pro_await == Types.Process_await.AWAIT_TS &&
                        pro.pro_await_arg == self.token.tk_pi) {
                        // resume process, restart from scratch --
                        if (id == tw.tk_pi) id = -1;
                        pro.pro_flag = Types.Process_state.PROC_RUN;
                        pro.pro_await = Types.Process_await.AWAIT_NONE;
                        pro.pro_await_arg = 0;
                        pro.pro_ip = 0;
                        pro.pro_cfcur = pro.pro_cfroot;
                        vm = self.vms[pro.pro_vm];
                        // mon_event(pro,"WAKEUP EVENT PRO="+ToString(pro.pro_id)+" IP="+ToString(pro.pro_ip)+" CF="+ToString(pro.pro_cfcur));
                        vm.tq.outq(tw);
                    }
                    else self.sq.Outq(tw);
                }
                breakit = breakit || self.sq.Emptyq();
            }
            break;
        case Types.Token_colour.TK_WAKEUP:
            /*
            ** Wakeup request for a process which CAN be suspended and waiting for signal events --
            */
            id = -1;
            breakit = self.sq.Emptyq();
            while (!breakit) {
                tw = inq(sq);
                if (id == -1) id = tw.tk_pi;
                else if (id == tw.tk_pi) {
                    self.sq.Outq(tw);
                    breakit = true;
                }
                if (!breakit) {
                    pro = self.PT[tw.tk_pi];
                    if (pro.pro_await == Types.Process_await.AWAIT_SIG) {
                        // resume process --
                        if (id == tw.tk_pi) id = -1;
                        pro.pro_flag = Types.Process_state.PROC_RUN;
                        pro.pro_await = Types.Process_await.AWAIT_NONE;
                        pro.pro_await_arg = 0;
                        vm = vms[pro.pro_vm];
                        // mon_event(pro,"WAKEUP SIG PRO="+ToString(pro.pro_id)+" IP="+ToString(pro.pro_ip)+" CF="+ToString(pro.pro_cfcur));
                        vm.tq.Outq(tw);
                    } else self.sq.Outq(tw);
                }
                breakit = breakit || self.sq.Emptyq();
            }
            break;
    }
};

Manager.prototype.sleep = function (self) {
    console.log('[MANA] Sleep.');
};

Manager.prototype.transitions = function () {
    var trans;
    trans =
        [
            [undefined,this.init,function (self) {return true}],
            [this.init,this.await,function (self) {return true}],
            [this.await,this.execute,function (self) {return self.context.blocked==false}],
            [this.await,this.await,function (self) {return true}],
            [this.execute,this.await,function (self) {return true}]
        ];
    return trans;
};

module.exports = {
    Random: function(a,b) {
      return div(Math.random()*b+a)
    },
    Manager: Manager
};