/**
 * Created by sbosse on 3/6/15.
 */
var Types = require('./afvm_types');

var Coding = function (word_size,code_packed) {
    this.WORD_SIZE=word_size;
    this.code_packed=code_packed;
    // Temporary instruction
    this.instr=new Types.Instruction(0,Types.Command.NOP,0);
};

Coding.prototype.CodeAlign = function(v) {
    if (!this.code_packed) {
        if (this.WORD_SIZE == 16)
            return (v << 8);
        else if (this.WORD_SIZE == 20)
            return (v << 12);
        else if (this.WORD_SIZE == 24)
            return (v << 16);
        else if (this.WORD_SIZE == 28)
            return (v << 20);
        else
            return -1;
    }
    else
    {
        // TBD --
        return -1;
    }
};

function CodeMask(v,m) {
    return v & m;
};

function CodeCheckMask(v,m) {
    return (v & m) != 0;
};

function ValueOfCode(v,m,s) {
    var _coding_valb;
    _coding_valb=v & ~m;
    if (CodeCheckMask(_coding_valb,s)) {
        _coding_valb=(_coding_valb & (s-1))-s;
    }
    return _coding_valb;
};

Coding.prototype.ToCode = function(instr) {
        switch(instr.ic){
            /*
            ** Long commands
             */
            case Types.Command.VAL:
                if (instr.ia > 0) {
                    if (this.WORD_SIZE == 16) return (0x8000 + instr.ia)
                    else if (this.WORD_SIZE == 20) return (0x80000 + instr.ia)
                    else if (this.WORD_SIZE == 24) return (0x800000 + instr.ia)
                    else if (this.WORD_SIZE == 28) return (0x8000000 + instr.ia)
                    else return -1;
                } else {
                    if (this.WORD_SIZE == 16) return (0x10000+instr.ia)
                    else if (this.WORD_SIZE == 20) return (0x100000+instr.ia)
                    else if (this.WORD_SIZE == 24) return (0x1000000+instr.ia)
                    else if (this.WORD_SIZE == 28) return (0x10000000+instr.ia)
                    else return -1;
                };

            case Types.Command.BRANCH:
                if (this.WORD_SIZE == 16) return (0x1000+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x10000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x100000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x1000000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.BRANCHZ:
                if (this.WORD_SIZE == 16) return (0x2000+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x20000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x200000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x2000000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.BBRANCH:
                if (this.WORD_SIZE == 16) return (0x0000+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x00000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x000000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0000000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.CALL:
                if (this.WORD_SIZE == 16) return (0x0E00+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x0E000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x0E0000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0E00000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.REF:
                if (this.WORD_SIZE == 16) return (0x0800+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x08000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x080000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0800000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.SET:
                if (this.WORD_SIZE == 16) return (0x0400+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x04000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x040000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0400000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.EXT:
                if (this.WORD_SIZE == 16) return (0x0600+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x06000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x060000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0600000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.PICK:
                if (this.WORD_SIZE == 16) return (0x0200+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x02000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x020000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0200000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.SETLUT:
                if (this.WORD_SIZE == 16) return (0x0300+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x03000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x030000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0300000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.TCALL:
                if (this.WORD_SIZE == 16) return (0x0A00+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x0A000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x0A0000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0A00000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.TBRANCH:
                if (this.WORD_SIZE == 16) return (0x0C00+CodeMask(instr.ia,0xFFF));
                else if (this.WORD_SIZE == 20) return (0x0C000+CodeMask(instr.ia,0xFFFF));
                else if (this.WORD_SIZE == 24) return (0x0C0000+CodeMask(instr.ia,0xFFFFF));
                else if (this.WORD_SIZE == 28) return (0x0C00000+CodeMask(instr.ia,0xFFFFFF));
                else return -1;
            case Types.Command.DATA:
                return 0;
            default:
                /*
                **  Short (1 byte) commands
                 */
                if (instr.ic>=0x40 && instr.ic <= 0x7F)
                    return this.CodeAlign(instr.ic);
                else
                    return -1;
        }
};


Coding.prototype.ToCodeM = function(cmd,val) {
    this.instr.ic=cmd;
    this.instr.ia=val;
    return this.ToCode(this.instr);
};

Coding.prototype.OfCode = function(code,instr) {
        instr.ic=Command.NOP;
        instr.ia=0;
        if (code==0) {instr.ic=Types.Command.DATA}
        else if (this.WORD_SIZE == 16){
            var _coding_opc,_coding_long,_coding_short,_coding_opl,_coding_ops;
            _coding_opc = (code & 0xFF00) >> 8;
            _coding_long  = CodeCheckMask(code,0x3000);
            _coding_short = CodeCheckMask(code,0x4000);
            _coding_opl = (code & 0x3000)>>8;
            _coding_ops = (code & 0x0E00)>>8;
            if (code==0) instr.ic=Types.Command.DATA;
            else if (CodeCheckMask(code,0x8000)) {
                instr.ic=Types.Command.VAL;
                instr.ia=ValueOfCode(code,0x8000,0x4000)
            } else if (_coding_short) {
                // Short command without value
                instr.ic = _coding_opc;
            } else if (_coding_long) {
                // Long command A with value
                instr.ic = _coding_opl;
                instr.ia = ValueOfCode(code,0x3000,0x0800)
            } else if (_coding_long) {
                // Long command B with value
                instr.ic = _coding_ops;
                instr.ia = ValueOfCode(code,0x0E00,0x0100)
            }
        }
        else if (this.WORD_SIZE == 20){
            var _coding_opc,_coding_long,_coding_short,_coding_opl,_coding_ops;
            _coding_opc = (code & 0xFF000) >> 12;
            _coding_long  = CodeCheckMask(code,0x30000);
            _coding_short = CodeCheckMask(code,0x40000);
            _coding_opl = (code & 0x30000)>>12;
            _coding_ops = (code & 0x0E000)>>12;
            if (code==0) instr.ic=Command.DATA;
            else if (CodeCheckMask(code,0x80000)) {
                instr.ic=Types.Command.VAL;
                instr.ia=ValueOfCode(code,0x80000,0x40000)
            } else if (_coding_short) {
                // Short command without value
                instr.ic = _coding_opc;
            } else if (_coding_long) {
                // Long command A with value
                instr.ic = _coding_opl;
                instr.ia = ValueOfCode(code,0x30000,0x08000)
            } else if (_coding_long) {
                // Long command B with value
                instr.ic = _coding_ops;
                instr.ia = ValueOfCode(code,0x0E000,0x01000)
            }
        }
        else if (this.WORD_SIZE == 24){
            var _coding_opc,_coding_long,_coding_short,_coding_opl,_coding_ops;
            _coding_opc = (code & 0xFF0000) >> 16;
            _coding_long  = CodeCheckMask(code,0x300000);
            _coding_short = CodeCheckMask(code,0x400000);
            _coding_opl = (code & 0x300000)>>16;
            _coding_ops = (code & 0x0E0000)>>16;
            if (code==0) instr.ic=Command.DATA;
            else if (CodeCheckMask(code,0x800000)) {
                instr.ic=Types.Command.VAL;
                instr.ia=ValueOfCode(code,0x800000,0x400000)
            } else if (_coding_short) {
                // Short command without value
                instr.ic = _coding_opc;
            } else if (_coding_long) {
                // Long command A with value
                instr.ic = _coding_opl;
                instr.ia = ValueOfCode(code,0x300000,0x080000)
            } else if (_coding_long) {
                // Long command B with value
                instr.ic = _coding_ops;
                instr.ia = ValueOfCode(code,0x0E0000,0x010000)
            }
        }
        else if (this.WORD_SIZE == 28){
            var _coding_opc,_coding_long,_coding_short,_coding_opl,_coding_ops;
            _coding_opc = (code & 0xFF00000) >> 20;
            _coding_long  = CodeCheckMask(code,0x3000000);
            _coding_short = CodeCheckMask(code,0x4000000);
            _coding_opl = (code & 0x3000000)>>20;
            _coding_ops = (code & 0x0E00000)>>20;
            if (code==0) instr.ic=Command.DATA;
            else if (CodeCheckMask(code,0x8000000)) {
                instr.ic=Types.Command.VAL;
                instr.ia=ValueOfCode(code,0x8000000,0x4000000)
            } else if (_coding_short) {
                // Short command without value
                instr.ic = _coding_opc;
            } else if (_coding_long) {
                // Long command A with value
                instr.ic = _coding_opl;
                instr.ia = ValueOfCode(code,0x3000000,0x0800000)
            } else if (_coding_long) {
                // Long command B with value
                instr.ic = _coding_ops;
                instr.ia = ValueOfCode(code,0x0E00000,0x0100000)
            }
        }
};

Coding.prototype.CheckCode = function(code,command) {
    this.OfCode(code,this.instr);
    return (this.instr.ic==command)
};

Coding.prototype.Print = function(instr) {
    if (instr.ic==Command.DATA && instr.ia==0) return 'DATA';
    else return Types.Command.tostring(instr.ic)+'('+instr.ia+')';
};

Coding.prototype.CodePrint = function(code) {
    if (code==0) return 'DATA';
    this.OfCode(code,this.instr);
    return Types.Command.tostring(this.instr.ic)+'('+this.instr.ia+')';
};

Coding.prototype.CodeToHex = function(code) {
    function decimalToHex(d, padding) {
        var hex = Number(d).toString(16);
        while (hex.length < padding) {
            hex = "0" + hex;
        }

        return hex;
    }
    return (decimalToHex(code,this.WORD_SIZE/4));
};

Coding.prototype.CodeOfHex = function(hexValue) {
    return parseInt('0x'+hexValue , 16);
}

module.exports = {
    Coding: Coding
};