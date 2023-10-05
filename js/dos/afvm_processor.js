/**
 * Created by sbosse on 3/6/15.
 */
var Types = require('./afvm_types');
var Manager = require('./afvm_manager');
var Code = require('./afvm_code');
var Net = require('./network');


var assert = function(condition, message) {
    if (!condition)
        throw Error("[afvm_processor]" + (typeof message !== "undefined" ? ": " + message : ""));
};

var Processor = function (cf_size,cf_nmax,lut_row_size,manager,coding,CCS) {
    this.CF_SIZE = cf_size;
    this.CF_NMAX = cf_nmax;
    this.LUT_ROW_SIZE = lut_row_size;
    this.manager = manager;
    this.coding = coding;
    // Local Code Segment of this VM
    this.CS=[];
    this.CS_SIZE=cf_size*cf_nmax;
    for(i=0;i<this.CS_SIZE;i++) this.CS.push(0);
    // Code Segment Pointer (0 for local CS)
    this.CP=0;
    // Current Code Frame (CS offset)
    this.CF=0;
    // Shadow Code Frame (CS offset) used for code morphing!
    this.CFS=0;
    // LUT Pointer Register (CS offset, points to first row)
    this.LP=0;
    // Transition Table Pointer Register (CS offset)
    this.TP=0;
    // Instruction Pointer and Register (CF offset)
    this.IR=new Types.Instruction(0,Command.NOP,0);
    this.code=0;
    this.IP=0;
    // General Purpose Registers
    this.A=0;
    this.B=0;
    this.C=0;
    this.D=0;
    this.E=0;
    this.F=0;

    // Temporary instruction
    this.instr=new Types.Instruction(0,Command.NOP,0);

    this.CCS=CCS;
    this.PT=manager.PT;
    this.PRO=new Types.Process(
        Types.Process_state.PROC_NOTUSED,
        0,0,0,0,0,Net.Direction.ORIGIN,0,0,
        new Net.Position(0,0),
        Types.Process_await.AWAIT_NONE,0);
};


Processor.prototype.LutFrame = function (entry) {
    var _proc_mem,_proc_instr,_proc_data;
    _proc_mem = this.CS;
    _proc_instr = _proc_mem[this.LP+this.LUT_ROW_SIZE*entry+2];
    _proc_data = _proc_instr.ia;
    return _proc_data;
};

Processor.prototype.LutOff = function(entry) {
    var _proc_mem,_proc_instr,_proc_data;
    _proc_mem = this.CS;
    _proc_instr = _proc_mem[this.LP + this.LUT_ROW_SIZE * entry + 1];
    _proc_data = _proc_instr.ia;
    return _proc_data;
};

Processor.prototype.Enter = function (t) {
    var _proc_mem,_proc_instr;
    // this.PT = _proc_manager->manager->PT;
    this.PRO = this.PT[t.tk_pi];
    _proc_mem = this.CS;
    this.CF = this.PRO.pro_cfroot * this.CF_SIZE;
    // Load first instruction of root frame => SETLUT
    _proc_instr = _proc_mem[this.CF];
    this.LP = this.CF + _proc_instr.ia;
    // TP must be loaded from LUT[0] row, which is a copy of a LUT row
    // containing the actual transition table entry.
    this.TP = this.LutFrame(0) + this.LutOff(0);
    this.IP = this.PRO.pro_ip;
    this.CF = this.PRO.pro_cfcur * this.CF_SIZE;
    this.CP = 0
};

Processor.prototype.Leave = function (t) {
    this.PRO.pro_ip = this.IP;
    this.PRO.pro_cfcur = this.CF/this.CF_SIZE
};

Processor.prototype.Info = function (pi) {
    var res;
    res = '[PID='+pi+' CF0='+this.PT[pi].pro_cfroot+' CF='+
    this.PT[pi].pro_cfcur+' IP='+this.IP+'('+this.PT[pi].pro_ip+')';
    res = res + ' GID='+this.PT[pi].pro_gid;
    res = res + ' PAR='+this.PT[pi].pro_par;
    res = res + ' DIR='+Net.Direction.tostring(this.PT[pi].pro_dir);
    res = res + ' AWT='+Types.Process_await.tostring(this.PT[pi].pro_await);
    res = res + ' ARG='+this.PT[pi].pro_await_arg;
    res = res+']';
    return res;
};
/*
** Instruction / Code Control
*/

Processor.prototype.CurrInstruction = function () {
    var _proc_mem;
    // Local & global CS access
    if (this.CP == 0)
        _proc_mem = this.CS;
    else
        _proc_mem = this.CCS;
    this.code=_proc_mem[this.CF+this.IP];
    this.coding.OfCode(this.code,this.IR);
};

Processor.prototype.SetInstruction = function (cf,ip) {
    this.CF = cf;
    this.IP = ip
};

Processor.prototype.SetCP = function(csi) {
    this.CP = csi;
};


Processor.prototype.NextInstruction = function(delta) {
    var _proc_mem;
    // Local & global CS access
    if (this.CP == 0)
        _proc_mem = this.CS;
    else
        _proc_mem = this.CCS;
    this.IP = this.IP + delta;
    this.coding.OfCode(_proc_mem[this.CF+this.IP],this.IR);
};

Processor.prototype.GetInstruction = function(delta) {
    var _proc_mem;
    // Local & global CS access
    if (this.CP == 0)
        _proc_mem = this.CS;
    else
        _proc_mem = this.CCS;
    this.coding.OfCode(_proc_mem[this.CF+this.IP+delta],this.instr);
    return this.instr;
};

Processor.prototype.MatchInstruction = function(i1,i2) {
    var _proc_data;
    _proc_data = 0;
    if (i1.ic == i2.ic) {
        _proc_data = _proc_data + 1;
        if (i1.io == i2.io) _proc_data = _proc_data + 1;
        if (i1.ia == i2.ia) _proc_data = _proc_data + 1;
    }
    return _proc_data;
};

Processor.prototype.cf_addr = function (cfnum) {
    return cfnum * this.CF_SIZE;
};

Processor.prototype.cf_num = function (cf) {
    return cf / this.CF_SIZE;
};

/*
** LUT ROW MANAGEMENT
*/

Processor.prototype.LutSize = function () {
    var _proc_mem,_proc_data;

    _proc_mem = this.CS;
    this.coding.OfCode(_proc_mem[this.LP-1],this.instr);
    _proc_data = this.instr.ia / this.LUT_ROW_SIZE;
    return _proc_data;
};

Processor.prototype.LutFlag = function (entry) {
    var _proc_mem,_proc_data,_proc_ref_flag;
    _proc_mem = this.CS;
    this.coding.OfCode(_proc_mem[this.LP+this.LUT_ROW_SIZE*entry],this.instr);
    _proc_data = this.instr.ia;
    _proc_ref_flag = RefKind.R_FREE;
    if (_proc_data == 1) _proc_ref_flag = Types.RefKind.R_PAR;
    if (_proc_data == 2) _proc_ref_flag = Types.RefKind.R_VAR;
    if (_proc_data == 3) _proc_ref_flag = Types.RefKind.R_ACT;
    if (_proc_data == 4) _proc_ref_flag = Types.RefKind.R_FUN;
    if (_proc_data == 5) _proc_ref_flag = Types.RefKind.R_FUNG;
    if (_proc_data < 0)  _proc_ref_flag = Types.RefKind.R_SIGH;
    if (_proc_data == 7) _proc_ref_flag = Types.RefKind.R_TRANS
    return _proc_ref_flag
};

Processor.prototype.SetLutFlag = function (entry,flag) {
    var _proc_mem,_proc_data;
    _proc_mem = this.CS;
    switch(flag) {
        case Types.RefKind.R_FREE:
            _proc_data = 0;
            break;
        case Types.RefKind.R_PAR:
            _proc_data = 1;
            break;
        case Types.RefKind.R_VAR:
            _proc_data = 2;
            break;
        case Types.RefKind.R_ACT:
            _proc_data = 3;
            break;
        case Types.RefKind.R_FUN:
            _proc_data = 4;
            break;
        case Types.RefKind.R_FUNG:
            _proc_data = 5;
            break;
        case Types.RefKind.R_SIGH:
            _proc_data = -1;
            break;
            //not very meaningful !
        case Types.RefKind.R_TRANS:
            _proc_data = 7;
            break;
    };
    _proc_mem[this.LP+this.LUT_ROW_SIZE*entry] = this.coding.ToCodeM(Types.Command.DATA,_proc_data);
};

Processor.prototype.LutFlagSig = function (entry) {
    var _proc_mem,_proc_data;
    _proc_mem = this.CS;
    this.coding.OfCode(_proc_mem[this.LP+this.LUT_ROW_SIZE*entry],this.instr);
    _proc_data = Math.abs(this.instr.ia);
    return _proc_data;
};

Processor.prototype.SetLutFlagSig = function(entry,sig)
{
    var _proc_mem,_proc_data;

    _proc_mem = this.CS;
    _proc_data = -sig;
    _proc_mem[this.LP + this.LUT_ROW_SIZE * entry] = this.coding.ToCodeM(Types.Command.DATA, _proc_data);
};
/*
** LUT offset ROW[1] is relative to CF start (LUT Sec.)
*/

Processor.prototype.LutOff = function (entry) {
    var _proc_mem,_proc_data;

    _proc_mem = this.CS;
    this.coding.OfCode(_proc_mem[this.LP + this.LUT_ROW_SIZE * entry + 1],this.instr);
    _proc_data = this.instr.ia;
    return _proc_data;
};

Processor.prototype.SetLutOff = function (entry,off) {
    var _proc_mem,_proc_data;

    _proc_mem = this.CS;
    _proc_mem[this.LP + this.LUT_ROW_SIZE * entry + 1] = this.coding.ToCodeM(Types.Command.DATA, off);
};

Processor.prototype.LutFrame = function (entry) {
    var _proc_mem,_proc_data;

    _proc_mem = this.CS;
    this.coding.OfCode(_proc_mem[this.LP + this.LUT_ROW_SIZE * entry + 2],this.instr);
    _proc_data = this.instr.ia;
    return _proc_data
};

Processor.prototype.SetLutFrame = function (entry,off) {
    var _proc_mem,_proc_data;

    _proc_mem = this.CS;
    _proc_mem[this.LP + this.LUT_ROW_SIZE * entry + 2] = this.coding.ToCodeM(Types.Command.DATA, off);
};

Processor.prototype.LutSec = function (entry) {
    var _proc_mem,_proc_data;

    _proc_mem = this.CS;
    this.coding.OfCode(_proc_mem[this.LP + this.LUT_ROW_SIZE * entry + 3],this.instr);
    _proc_data = this.instr.ia;
    return _proc_data
};

Processor.prototype.SetLutSec = function (entry,off) {
    var _proc_mem;

    _proc_mem = this.CS;
    _proc_mem[this.LP + this.LUT_ROW_SIZE * entry + 3] = this.coding.ToCodeM(Types.Command.DATA, off);
};



/*
** DATA
*/

Processor.prototype.Store = function (cf,off,data) {
    var _proc_mem;

    _proc_mem = this.CS;
    _proc_mem[cf+off]  = this.coding.ToCodeM(Types.Command.DATA,data);
};

Processor.prototype.Fetch = function (cf,off) {
    var _proc_mem;

    _proc_mem = this.CS;
    this.coding.OfCode(_proc_mem[cf+off],this.instr);
    return this.instr.ia;
};

/*
** FRAME
*/

Processor.prototype.RelFrame = function (cf) {
    var _proc_cf,_proc_data;

    _proc_cf = cf / this.CF_SIZE;
    if (_proc_cf == this.PRO.pro_cfroot) _proc_data = -1;
    else assert(false, "RelFrame: linked frames not supported yet"); // TBD !!!
    return _proc_data
};

Processor.prototype.AbsFrame = function (cf) {
    var _proc_data;

    if (cf == -1) _proc_data = this.PRO.pro_cfroot * this.CF_SIZE;
    else assert(false, "AbsFrame: linked frames not supported yet"); // TBD !!!
    return _proc_data;
};

Processor.prototype.FrameOfAddr = function (addr) {
    var _proc_cf;

    _proc_cf = addr / this.CF_SIZE;
    return _proc_cf
};

Processor.prototype.OffsetOfAddr = function (addr) {
    var _proc_cf,_proc_off;

    _proc_cf = addr / this.CF_SIZE;
    _proc_off = addr - (_proc_cf * this.CF_SIZE);
    return _proc_off;
};

/*
** Init code range
*/

Processor.prototype.Code_init = function(cs,cfnum,offstart,offend,cmd,val)
{
    var i,_proc_cf,_proc_mem;

    _proc_mem = cs;
    _proc_cf = this.cf_addr(cfnum);
    for (i = offstart; i <= offend; i++) {
        _proc_mem[_proc_cf + i] = this.coding.ToCodeM(cmd,val);
    }
};

Processor.prototype.Code_set = function(cs,cfnum,off,cmd,val) {
    var _proc_cf,_proc_mem;

    _proc_mem = cs;
    _proc_cf = this.cf_addr(cfnum);
    _proc_mem[_proc_cf + off] = this.coding.ToCodeM(cmd,val);
};

String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

/*
** Read code from string buffer
 */
Processor.prototype.Code_read = function(cfnum,off,buf) {
    var csoff;
/*
** Buffer format: HHHH HHHH ...
** All command codes in hexadecimal format
*/
    csoff = cfnum * this.CF_SIZE;
    var buf_flat = buf.replaceAll('\n',' ');
    var tokens = buf_flat.split(' ');
    for (var i in tokens) {
        var token = tokens[i];
        if (token != '') {
            this.CS[csoff+off] = parseInt(token,16);
            off++;
        };
    };
    // Add TWO END commands to mark the end of teh code frame
    this.CS[csoff+off] = this.coding.ToCodeM(Types.Command.END,0);
    this.CS[csoff+off+1] = this.coding.ToCodeM(Types.Command.END,0);
    return (off+2);
};

/*
** Formatted printer for code segments.
** Returns a string text.
 */
Processor.prototype.Code_print = function(cfroot) {
    var end=0;
    var str='';
    var off=cfroot*this.CF_SIZE;
    while (off < this.CS_SIZE && end < 2) {
        this.coding.OfCode(this.CS[off],this.instr);
        if (this.instr.ic==Types.Command.END) end++;
        if (end<2) str=str+'['+off+'] '+this.coding.CodePrint(this.CS[off])+'\n';
        off++;
    };
    return str;
};

/*
** Copy code range
*/


Processor.prototype.Code_copy = function (
    cs,
    cfnum_src,
    cfnum_dst,
    offstart,
    offend) {
    var i,_proc_mem,_proc_cf,_proc_code;

    _proc_mem = cs;
    for (i = offstart; i <= offend; i++) {
        _proc_cf = this.cf_addr(cfnum_src);
        _proc_code = _proc_mem[_proc_cf + i];
        _proc_cf = this.cf_addr(cfnum_dst);
        _proc_mem[_proc_cf + i] = _proc_code;
    }
};

/*
** Transfer a value to code with sign extension if necessary.
** Returns code frame offset of next instruction.
*/
Processor.prototype.Code_make_val = function (
    cs,
    cfnum,
    off,
    v) {
    var _proc_mem, _proc_cf, _proc_off;

    _proc_mem = cs;
    _proc_off = off;
    _proc_cf = this.cf_addr(cfnum);
    // TBD EXT(SIGN) --

    _proc_mem[_proc_cf + _proc_off] = this.coding.ToCodeM(Types.Command.VAL,v);
    _proc_off = _proc_off + 1;
    return _proc_off;
};


/*
**- Save state (#CF,IP) in the current TRANS-BOOT section of the current process
*/
Processor.prototype.proc_savestate = function(init,ipoff) {

    // The LUT must be reinitialized after migration and forking!!!!
    // Be aware of parameter initialization!!! It is done again. The
    // parameter values must be coded and dumped to the frame boot section.
    // Must be done by the compiler before the migration or forking (move/fork) takes place.

    // Here the current transition table boot section is modified by inserting
    // a long branch to the current (CF,IP+ipoff) location.
    //
    // TP points to the start of the BOOT section ogf the current transition table word

    _proc_mem = this.CS;
    _proc_mem[this.TP] = this.coding.ToCodeM(Types.Command.VAL, this.IP + ipoff);
    //
    //
    //  TBD: CF <> cfroot! => -LINK# !!!
    _proc_mem[this.TP + 1] = this.coding.ToCodeM(Types.Command.VAL, -1);
    _proc_mem[this.TP + 2] = this.coding.ToCodeM(Types.Command.BRANCHL, 0);

    //
    // init=false: Suspend with direct branch from frame boot section to current transition boot section
    // init=true: Suspend with full frame (re)initialization
    //

    if (init) _proc_mem[this.LP - 4] = this.coding.ToCodeM(Types.Command.BRANCH, 2);
    else _proc_mem[this.LP - 4] =  this.coding.ToCodeM(Types.Command.NOP, 0);
};

/*
** Release a process (decriptor & ressources)
** TBD: linked code frames
*/
Processor.prototype.proc_free = function(manager,pro) {
    var cfq;

    cfq = manager.CQ[pro.pro_vm];
    cfq.push(pro.pro_cfroot);
    pro.pro_flag = Types.Process_state.PROC_NOTUSED;
    pro.pro_cfroot = -1;
    pro.pro_cfcur = -1;
    pro.pro_vm = -1;
    pro.pro_ip = -1;
    pro.pro_dir = Net.Direction.ORIGIN;
    pro.pro_pos = Net.Position(0, 0);
    pro.pro_gid = -1;
    pro.pro_par = -1;
    manager.PQ.push(Types.Token(pro.pro_id, Types.Token_colour.TK_DATA, '', ''));
    // TBD: tracking and releasing CF chain
};

module.exports = {
    Processor: Processor
};