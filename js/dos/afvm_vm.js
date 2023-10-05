/**
 * Created by sbosse on 3/16/15.
 */
var Types = require('./afvm_types');
var Code = require('./afvm_code');
var Stack = require('./afvm_stack');
var Proc = require('./afvm_processor');
var Man = require('./afvm_manager');
var Dict = require('./afvm_dictionary');
var Que = require('./afvm_queue');
var Sch = require('./scheduler');
var Io = require('./io');
var Net = require('./network');
var sizeof = require('./sizeof')
var util = require('util')

/*-----------------------------------------
-- MEMORY:
--  CS: Code Segment
--
-- REGISTER SET:
--
-- 1. PROGRAM PROCESSING
--
--  >>>  CF OR CS OFFSETS ?????
--
--  CP: Code Segment Pointer      (0=this CS,1= CCS)
--  CF: Current Code Frame        (CS offset)
--  LP: LUT Code Offset Register  (CS offset)
--  IP: Instruction Code Pointer  (CF offset)
--  IR: Instruction Register
--
-- 2. STACK PROCESSING
--
--  T : Top element of Data Stack
--  S : Second element of Data Stack
--  R: Top element of Return Stack
--
-----------------------------------------*/

var assert = function(condition, message) {
    if (!condition)
        throw Error("[afvm_vm]" + (typeof message !== "undefined" ? ": " + message : ""));
};

function Noop () {};

var VM = function (id,stack_size,code_size,word_size,lut_row_size,cs,manager) {
    var con;
    con=Sch.Context(id,this);
    this.stack = new Stack.Stack(stack_size);
    this.coding = new Code.Coding(word_size,false);
    this.processor = new Proc.Processor(code_size,word_size,lut_row_size,manager,this.coding,cs);
    this.manager=manager;
    this.state = undefined;
    this.id=id;
    this.tq= new Que.TokenQueue('VM'+id);
    this.context=con;

    this.token=undefined;
    this.break=false;
    this.admin=false;
    this.notify=false;
    this.exception=false;
};

/*
** State Machine
 */

VM.prototype.init = function (self) {
    console.log('[VM '+self.id+'] Init.');
};

VM.prototype.await = function (self) {
    self.token=self.tq.Inq();
    console.log('[VM '+self.id+'] Await. [blocked '+self.context.blocked+' token='+util.inspect(self.token)+']');
};

VM.prototype.setup = function (self) {
    console.log('[VM '+self.id+'] Setup. [token '+util.inspect(self.token)+']');
    self.break=false;self.admin=false;self.notify=false;self.exception=false;
    self.processor.Enter(self.token);
    if (self.token.tk_colour != Types.Token_colour.TK_SIGH) self.stack.Clear();
};

VM.prototype.execute = function (self) {
    var icode, i,ipmon;
    self.processor.CurrInstruction();
    console.log('[VM '+self.id+'] Execu. [CF='+self.processor.CF+' IP='+self.processor.IP+' IR='+self.coding.Print(self.processor.IR)+']');
    ip_mon = self.processor.IP;

    if (self.processor.IR.ic == Types.Command.RD) {
        icode = Types.Command.IN;
    } else {
        icode = self.processor.IR.ic;
    }
    switch (icode) {
        case Types.Command.NOP: Noop(); self.processor.NextInstruction(1); break;
        /*
        ** STACK
         */
        case Types.Command.VAL:     self.stack.Push(self.processor.IR.ia); self.processor.NextInstruction(1); break;
        case Types.Command.ZERO:    self.stack.Push(0); self.processor.NextInstruction(1); break;
        case Types.Command.ONE:     self.stack.Push(1); self.processor.NextInstruction(1); break;
        case Types.Command.DUP:     self.stack.Dup(); self.processor.NextInstruction(1); break;
        case Types.Command.DROP:    self.stack.Drop(); self.processor.NextInstruction(1); break;
        case Types.Command.SWAP:    self.stack.Swap(); self.processor.NextInstruction(1); break;
        case Types.Command.ROT:     self.stack.Rot(); self.processor.NextInstruction(1); break;
        case Types.Command.PICK:    self.stack.Pick(self.processor.IR.ia); self.processor.NextInstruction(1); break;
        case Types.Command.SET:     self.stack.Set(self.processor.IR.ia); self.processor.NextInstruction(1); break;
        case Types.Command.RPICK:   self.stack.Rpick(); self.processor.NextInstruction(1); break;
        case Types.Command.RSET:    self.stack.Rset(); self.processor.NextInstruction(1); break;
        case Types.Command.TOR:     self.stack.Tor(); self.processor.NextInstruction(1); break;
        case Types.Command.CLEAR:   self.stack.Clear(); self.processor.NextInstruction(1); break;
        case Types.Command.FROMR:   self.stack.Fromr(); self.processor.NextInstruction(1); break;
        case Types.Command.RANDOM:
            self.processor.B = self.Pop(); /* max */ self.processor.A = self.pop(); /* min */
            self.Push(Math.floor((Math.random() * self.processor.B) + self.processor.A));
            self.processor.NextInstruction(1); break;
        case Types.Command.STORE:
            self.processor.Store(self.stack.S0,self.stack.S1,self.stack.S2);
            self.stack.Dropn(3);
            self.processor.NextInstruction(1); break;
        case Types.Command.FETCH:
            if (self.stack.S0 <0 && self.stack.S1 < 0) {
                // System variables
                if (self.stack.S0 == -1) self.stack.S1 = self.PRO.pro_gid;
                else if (self.stack.S0 == -2) self.stack.S1 = self.PRO.pro_par;
                else self.stack.S1 = 0;
            }
            else
                self.processor.Fetch(self.stack.S0,self.stack.S1);
            self.stack.Drop();
            self.processor.NextInstruction(1); break;
        case Types.Command.REF:
            if (self.processor.IR.ia >= 0) {
                self.stack.Push(self.processor.LutOff(self.processor.IR.ia));
                self.stack.Push(self.processor.LutFrame(self.processor.IR.ia))
            }
            else {
                // System variables --
                self.stack.Push(self.processor.IR.ia);
                self.stack.Push(self.processor.IR.ia)
            };
            self.processor.NextInstruction(1); break;
        case Types.Command.VAR:
            self.A = (self.processor.GetInstruction(1)).ia;    // REF
            self.B = (self.processor.GetInstruction(2)).ia;    // SIZE
            // SetLutFlag(A,R_VAR);
            self.processor.SetLutOff(self.A,self.IP+3);
            self.processor.SetLutFrame(self.A,self.CF);
            self.processor.SetLutSec(self.A,self.B);
            self.processor.NextInstruction(self.B+3); break;
        case Types.Command.LUT:
            self.B = (self.processor.GetInstruction(1)).ia;    // SIZE
            self.LP = self.CF+self.IP+2;
            // Clear LUT
            self.A = 0;
            for (i=self.LP; i <=self.LP+self.B; i++) {
                if ((self.A % 4) != 0) {
                    // Reset LUT columns 2 .. 4 to default values (0)
                    self.CS[i]=self.coding.ToCodeM(Command.DATA,0);
                }
                self.A = self.A + 1;
            };
            self.processor.NextInstruction(self.B+2); break;
        case Types.Command.DEF:
            self.A = (self.processor.GetInstruction(1)).ia;    // REF
            self.B = (self.processor.GetInstruction(2)).ia;    // SIZE
            // SetLutFlag(A,R_FUN);
            self.processor.SetLutFrame(self.A,self.CF);
            self.processor.SetLutOff(self.A,self.IP+3);
            self.processor.NextInstruction(self.B+3); break;
        /*
        ** -- ARITH --
         */
        case Types.Command.ADD:     self.stack.Add(); self.processor.NextInstruction(1); break;
        case Types.Command.SUB:     self.stack.Sub(); self.processor.NextInstruction(1); break;
        case Types.Command.MUL:     self.stack.Mul(); self.processor.NextInstruction(1); break;
        case Types.Command.DIV:     self.stack.Div(); self.processor.NextInstruction(1); break;
        case Types.Command.MOD:     self.stack.Mod(); self.processor.NextInstruction(1); break;
        case Types.Command.NEG:     self.stack.Neg(); self.processor.NextInstruction(1); break;
        /*
        ** -- RELAT --
         */
        case Types.Command.LT:      self.stack.Lt(); self.processor.NextInstruction(1); break;
        case Types.Command.GT:      self.stack.Gt(); self.processor.NextInstruction(1); break;
        case Types.Command.GE:      self.stack.Ge(); self.processor.NextInstruction(1); break;
        case Types.Command.LE:      self.stack.Le(); self.processor.NextInstruction(1); break;
        case Types.Command.EQ:      self.stack.Eq(); self.processor.NextInstruction(1); break;

        /*
        ** -- BOOL --
         */
        case Types.Command.AND:     self.stack.And(); self.processor.NextInstruction(1); break;
        case Types.Command.OR:      self.stack.Or(); self.processor.NextInstruction(1); break;
        case Types.Command.NOT:     self.stack.Not(); self.processor.NextInstruction(1); break;
        case Types.Command.INV:     self.stack.Inv(); self.processor.NextInstruction(1); break;

        case Types.Command.END:
            // END of code frame or end of transition table row reached?
            if (self.coding.CheckCode(self.processor.CS[self.processor.IP+1],Types.Command.END)) {
                self.admin=true;
                self.break=true;
                self.processor.PRO.pro_flag=Types.Process_state.PROC_STOP;
            } else {
                /*
                ** end of transition row found
                ** currently no transition condition can be satisfied,
                ** suspend the process, which is resumed on signal events
                ** !!! UFF: we must go back to start of transition row !!!
                */
                // TBD
            }
            break;

        default:
            throw Error('[VM: invalid code '+self.processor.code+']: '+self.processor.Info(self.processor.PRO.pro_id));
    };
    if (!self.break && (ip_mon == self.processor.IP))
    {
        // mon_event(PRO,"EXCEPTION IP="+ToString(IP)+" CF="+ToString(CF));
        self.break = true;
        self.admin = true;
        self.exception = true;
        self.processor.PRO.pro_flag = Types.Process_state.PROC_EXCEPTION;
    }

};

VM.prototype.signal = function (self) {
    console.log('[VM '+self.id+'] Signal.');
};

VM.prototype.schedule = function (self) {
    console.log('[VM '+self.id+'] Sched. [break='+self.break+' admin='+self.admin+' exception='+self.exception+']');
    if (!self.notify) self.processor.Leave(self.token);
    if (self.admin)
        self.manager.tq.Outq(self.token);
    else
        self.tq.Outq(self.token);

};

VM.prototype.sleep = function (self) {
    console.log('[VM '+self.id+'] Sleep.');
};

VM.prototype.transitions = function () {
    var trans;
    trans =
    [
        [undefined,this.init,function (self) {return true}],
        [this.init,this.await,function (self) {return true}],
        [this.await,this.setup,function (self) {return !self.context.blocked && self.token.tk_colour==Types.Token_colour.TK_PRO}],
        [this.await,this.signal,function (self) {return !self.context.blocked && self.token.tk_colour==Types.Token_colour.TK_SIGH}],
        [this.await,this.await,function (self) {return true}],
        [this.setup,this.execute,function (self) {return true}],
        [this.signal,this.setup,function (self) {return self.found}],
        [this.signal,this.await,function (self) {return !self.found}],
        [this.execute,this.schedule,function (self) {return self.break}],
        [this.execute,this.execute,function (self) {return true}],
        [this.schedule,this.await,function (self) {return true}]
    ];
    return trans;
};

module.exports = {
    VM: VM
};
