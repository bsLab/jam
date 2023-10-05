/**
 * Created by sbosse on 3/4/15.
 */
Command = {
    VAL:0x80,           //  Value litertal (constant)  D[ -- v ]
    EXT:0x06,           // Sign extension (+-1), long operation prefix, ...
    ZERO:0x40,
    ONE:0x41,

    ADD:0x42,           //    (a b -- a+b)
    SUB:0x43,           //    (a b -- a-b)
    MUL:0x44,           //    (a b -- a*b)
    DIV:0x45,           //    (a b -- a/b)
    MOD:0x46,           //    (a b -- a%b)
    NEG:0x47,           //    (a -- -a)

    LT:0x4a,            //     (a b -- a<b )
    GT:0x4b,            //     (a b -- a>b )
    EQ:0x4c,            //     (a b -- a=b )
    LE:0x4d,            //     (a b -- a<=b )
    GE:0x4e,            //     (a b -- a>=b )

    AND:0x50,           //    (a b -- a&b)
    OR:0x51,            //    (a b -- a|b)
    NOT:0x52,           //    (a -- ~a)   boolean negate {0,[<>0]}->{1,0}
    INV:0x53,           //    (a -- ~a)   invert all bits
    LSL:0x56,           //    (a n -- a<<n)
    LSR:0x57,           //    (a n -- a>>n)

    // Control operations
    EXIT:0x60,          //  R( r -- ) | R( -- ) => KILL!
    NOP:0x61,           //  No operation
    BRANCH:0x10,        //  BRANCH(delta)
    BRANCHZ:0x20,       //  BRANCHZ(delta)
    BRANCHL:0x5c,       //  BRANCHL   ( ip cf -- )
    CALL:0x0e,          //  CALL(LUT#)

    // Stack operations
    DUP:0x68,           //    (x1 x2 -- x1 x2 x2)
    DROP:0x6a,          //    (x1 x2 -- x1)
    SWAP:0x6b,          //    (x1 x2 -- x2 x2)
    OVER:0x6c,          //    (x1 x2 -- x1 x2 x1)
    ROT:0x6d,           //    (x1 x2 x3 -- x2 x3 x1)

    PICK:0x02,          //    (.. xn .. x1 n -- .. x1 xn)
    SET:0x04,           //    ( .. xn .. x1 v n -- xn' .. x1)
    RPICK:0x62,         //    R(.. xn .. x1  -- .. x1 ) ( n -- xn )
    RSET:0x63,          //    R( .. xn .. x1 -- xn' .. x1) ( v n -- )
    TOR:0x64,           //    ( x -- ) R( -- x)
    FROMR:0x65,         //    R( x -- ) ( -- x)
    CLEAR:0x5b,         //    ( .. -- ) R( .. -- )

    // Data memory operations
    STORE:0x66,
    FETCH:0x67,
    VAR:0x70,
    LUT:0x7a,

    // Code definition and morphing operations
    FROMC:0x72,         // FROMC CMD .. ( n -- CMD .. )
    VTOC:0x5d,          // VTOC     ( v .. n off -- off' )
    TOC:0x73,           // ( c1 c2 .. n off  -- )
    STOC:0x54,          // ( .. off -- off' ) R( .. -- )
    RTOC:0x55,          // ( off ref -- off' )
    SETCF:0x79,         // ( cf# -- )
    GETCF:0x5e,         // ( -- cf# )

    DEF:0x74,           // DEF LUT# SIZE
    DEFN:0x75,          // DEF "NAME:8" SIZE
    TRANS:0x76,         // TRANS
    IMPORT:0x77,        // IMPORT LUT# "NAME:8"
    NEWCF:0x78,         //  ( init -- #cf off )
    LOAD:0x71,          //  ( ac #cf -- )
    SETLUT:0x30,        //  ( cf -- )
    REF:0x08,           // REF(LUT#)

    TCALL:0x0a,         // TCALL(#)
    TBRANCH:0x0c,       // TBRANCH(#)
    BBRANCH:0x00,       // BBRANCH(#)
    QBLOCK:0x7b,        //  ( flag -- )
    SUSPEND:0x4f,       //  ( flag -- )
    BLMOD:0x59,         //  ( ref# b# switch sel -- )
    TRSET:0x5a,         //  ( off cf -- )
    RUN:0x5f,           //  ( arg1 .. argn n cf -- id )
    RAISE:0x49,         //  ( s pid --  )

    MOVE:0x7f,          //  ( dx dy -- )
    LINK:0x48,          //  ( dx dy -- flag )
    OUT:0x7c,           //
    IN:0x7d,            //
    RD:0x7e,            //

    RANDOM:0x69,        //  ( min max -- rnd )
    TIMER:0x58,         //  ( sig# tmo -- )

    DATA:0x00,          // Symbolic placeholder for a data word (initially code=0)
    NEXT:0x6f,          // NEXT  #CF points to the next code frame in the current CS
    END:0x6e,           // END marks the end of a code frame
    LABEL:0xf0,          // Label <integer>
    tostring:function (i) {
        switch(i) {
            case 0x00: return 'BBRANCH'; 
            case 0x02: return 'PICK'; 
            case 0x04: return 'SET'; 
            case 0x06: return 'EXT'; 
            case 0x08: return 'REF'; 
            case 0x0A: return 'TCALL'; 
            case 0x0E: return 'CALL'; 
            case 0x10: return 'BRANCH'; 
            case 0x20: return 'BRANCHZ'; 
            case 0x30: return 'SETLUT'; 
            case 0x40: return 'ZERO'; 
            case 0x41: return 'ONE'; 
            case 0x42: return 'ADD'; 
            case 0x43: return 'SUB'; 
            case 0x44: return 'MUL'; 
            case 0x45: return 'DIV'; 
            case 0x46: return 'MOD'; 
            case 0x47: return 'NEG'; 
            case 0x48: return 'LINK'; 
            case 0x49: return 'RAISE'; 
            case 0x4A: return 'RAISE'; 
            case 0x4B: return 'GT'; 
            case 0x4C: return 'EQ'; 
            case 0x4D: return 'LE'; 
            case 0x4E: return 'GE'; 
            case 0x4F: return 'SUSPEND'; 
            case 0x50: return 'AND'; 
            case 0x51: return 'OR'; 
            case 0x52: return 'NOT'; 
            case 0x53: return 'INV'; 
            case 0x54: return 'STOC'; 
            case 0x55: return 'RTOC'; 
            case 0x56: return 'LSL'; 
            case 0x57: return 'LSR'; 
            case 0x58: return 'TIMER'; 
            case 0x59: return 'BLMOD'; 
            case 0x5A: return 'TRSET'; 
            case 0x5B: return 'CLEAR'; 
            case 0x5C: return 'BRANCHL'; 
            case 0x5D: return 'VTOC'; 
            case 0x5E: return 'GETCF'; 
            case 0x5F: return 'RUN'; 
            case 0x60: return 'EXIT'; 
            case 0x61: return 'NOP'; 
            case 0x62: return 'RPICK'; 
            case 0x63: return 'RSET'; 
            case 0x64: return 'TOR'; 
            case 0x65: return 'FROMR'; 
            case 0x66: return 'STORE'; 
            case 0x67: return 'FETCH'; 
            case 0x68: return 'DUP'; 
            case 0x69: return 'RANDOM'; 
            case 0x6A: return 'DROP'; 
            case 0x6B: return 'SWAP'; 
            case 0x6C: return 'OVER'; 
            case 0x6D: return 'ROT'; 
            case 0x6E: return 'END'; 
            case 0x70: return 'VAR'; 
            case 0x71: return 'LOAD'; 
            case 0x72: return 'FROMC'; 
            case 0x73: return 'TOC'; 
            case 0x74: return 'DEF'; 
            case 0x75: return 'DEFN'; 
            case 0x76: return 'TRANS'; 
            case 0x77: return 'IMPORT'; 
            case 0x78: return 'NEWCF'; 
            case 0x79: return 'SETCF'; 
            case 0x7A: return 'LUT'; 
            case 0x7B: return 'QBLOCK'; 
            case 0x7C: return 'OUT'; 
            case 0x7D: return 'IN'; 
            case 0x7E: return 'RD'; 
            case 0x7F: return 'MOVE'; 
            case 0x80: return 'VAL'; 
            default: return 'Command?';
        }
    }
};

Token_colour = {
    TK_PRO:1,
    TK_HANDLER:2,
    TK_SIGNAL:3,
    TK_SIGH:4,
    TK_DATA:5,
    TK_TS_EVENT:6,
    TK_WAKEUP:7,
    tostring:function (i) {
        switch (i) {
            case 1: return 'TK_PRO';
            case 2: return 'TK_HANDLER';
            case 3: return 'TK_SIGNAL';
            case 4: return 'TK_SIGH';
            case 5: return 'TK_DATA';
            case 6: return 'TK_TS_EVENT';
            case 7: return 'TK_WAKEUP';
            default: return 'Token_colour?'
        }
    }
};

Process_state = {
    PROC_NOTUSED:1,
    PROC_INIT:2,
    PROC_READY:3,
    PROC_START:4,
    PROC_RUN:5,
    PROC_STOP:6,
    PROC_EXCEPTION:7,
    PROC_SUSP:8,
    PROC_MOVE:9,
    PROC_AWAIT:10,
    tostring:function (i) {
        switch (i) {
            case 1: return 'PROC_NOTUSED';
            case 2: return 'PROC_INIT';
            case 3: return 'PROC_READY';
            case 4: return 'PROC_START';
            case 5: return 'PROC_RUN';
            case 6: return 'PROC_STOP';
            case 7: return 'PROC_EXCEPTION';
            case 8: return 'PROC_SUSP';
            case 9: return 'PROC_MOVE';
            case 10: return 'PROC_AWAIT';
            default: return 'Process_state?'
        }
    }
};

Process_await = {
    AWAIT_NONE:1,
    AWAIT_TMO:2,
    AWAIT_TS:3,
    AWAIT_SIG:4,
    tostring:function (i) {
        switch (i) {
            case 1: return 'AWAIT_NONE';
            case 2: return 'AWAIT_TMO';
            case 3: return 'AWAIT_TS';
            case 4: return 'AWAIT_SIG';
            default: return 'Process_await?'
        }
    }
};

Scheduling_policy = {
    SCHED_ROUNDROBIN:1,
    SCHED_INCREMENTAL:2,
    SCHED_RANDOM:3,
    SCHED_LOADBAL:4,
    tostring:function (i) {
        switch (i) {
            case 1: return 'SCHED_ROUNDROBIN';
            case 2: return 'SCHED_INCREMENTAL';
            case 3: return 'SCHED_RANDOM';
            case 4: return 'SCHED_LOADBAL';
            default: return 'Scheduling_policy?'
        }
    }
};

// LUT row
RefKind = {
    R_FREE:0,
    R_PAR:1,
    R_VAR:2,
    R_ACT:3,
    R_FUN:4,
    R_FUNG:5,
    R_SIGH:6,
    R_TRANS:7,
    tostring:function (i) {
        switch (i) {
            case 0: return 'R_FREE';
            case 1: return 'R_PAR';
            case 2: return 'R_VAR';
            case 3: return 'R_ACT';
            case 4: return 'R_FUN';
            case 5: return 'R_FUNG';
            case 6: return 'R_SIGH';
            case 7: return 'R_TRANS';
            default: return 'RefKind?'
        }
    }
};

Dictionary_kind = {
    DICT_UNUSED:0,      // 0: not used dictionary slot
    DICT_FREE:1,        // 1: dicitionary slot pointing to free CCS segment
    DICT_WORD:2,        // 2: A global word without data side effects
    DICT_TEMPL:3,       // 3: A code template
    tostring:function (i) {
        switch (i) {
            case 0: return 'DICT_UNUSED';
            case 1: return 'DICT_FREE';
            case 2: return 'DICT_WORD';
            case 3: return 'DICT_TEMPL';
            default: return 'Dictionary_kind?'
        }
    }
};

module.exports = {
    Command:Command,
    Process_state:Process_state,
    Process_await:Process_await,
    Scheduling_policy:Scheduling_policy,
    Token_colour:Token_colour,
    RefKind:RefKind,
    Dictionary_kind:Dictionary_kind,

    Instruction: function (io, ic, ia) {
        this.io = io;
        this.ic = ic;                       // Command
        this.ia = ia;
    },
    InstructionToString: function(o) {
        return o.io + ':'+ Command.tostring(o.ic)+'('+o.ia+')'
    },
    Memory: function (mi, mc, ma) {
        this.mi = mi;
        this.mc = mc;                       // Command
        this.ma = ma;
    },
    Token: function(tk_pi,tk_colour,tk_desc,tk_place) {
        this.tk_pi      = tk_pi;            // Integer
        this.tk_colour  = tk_colour;        // Token_colour
        this.tk_desc    = tk_desc;          // String
        this.tk_place   = tk_place;         // String
    },
    Process:function (pro_flag,pro_id,pro_vm,pro_cfroot,pro_cfcur,
                      pro_ip,pro_dir,pro_gid,pro_par,pro_pos,pro_await,pro_await_arg) {
        this.pro_id = pro_id;               // internal index number = PT row number
        this.pro_flag = pro_flag;           // Process_state
        this.pro_vm = pro_vm;               // Bound to VM #
        this.pro_cfroot = pro_cfroot;       // Root code frame # in CS(VM)
        this.pro_cfcur = pro_cfcur;         // Current code frame # in CS(VM)
        this.pro_ip = pro_ip;               // Code pointer relative to CF start address
        this.pro_dir = pro_dir;             // Direction: Migration direction
        this.pro_gid = pro_gid;             // Global ID (random)
        this.pro_par = pro_par;             // Parent ID (GID)
        this.pro_pos = pro_pos;             // Position
        this.pro_await = pro_await;         // Process_await: If pro_flag=PROC_SUSP then await reason
        this.pro_await_arg = pro_await_arg; // If pro_flag=PROC_SUSP then await argument (TMO/TSKEY/0)
    },
    Container: function (con_proc,con_log,con_code) {
        this.con_proc = con_proc;   // Process
        this.con_log = con_log;     // string list
        this.con_code = con_code;   // Instruction list
    },
    Signal: function(sig_num,sig_arg,sig_time,sig_src,sig_dst) {
        this.sig_num = sig_num;          // integer
        this.sig_arg = sig_arg;          // integer,
        this.sig_time = sig_time;        // integer,
        // source and destination GID
        this.sig_src = sig_src;          // integer,
        this.sig_dst = sig_dst;          // integer
    },
    Dictionary: function (dict_name,dict_coff) {
        this.dict_name = dict_name // string
        // Start of segment header in CCS
        // KIND LEN
        this.dict_coff = dict_coff // integer
    }
};

