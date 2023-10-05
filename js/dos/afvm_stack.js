/**
 * Created by sbosse on 3/6/15.
 */
var assert = function(condition, message) {
    if (!condition)
        throw Error("[afvm_stack]" + (typeof message !== "undefined" ? ": " + message : ""));
};

var Stack = function (stack_size) {
        this.stack_size=stack_size;
        this.ss=[];
        this.rs=[];
        for(i=0;i<stack_size;i++) this.ss.push(0);
        for(i=0;i<stack_size;i++) this.rs.push(0);
        this.sn_p=0;
        this.sn_next=0;
        this.S0=0;
        this.S1=0;
        this.S2=0;
        this.R = 0;
        this.rn_p = 0;
        this.rn_next = 0;
};

Stack.prototype.size = function () {
    return this.stack_size
};

Stack.prototype.Print = function () {
    var res='';
    var n;
    n=this.sn_next;
    res='DS [';
    if (n>=1) res=res+this.S0;
    if (n>=2) res=res+','+this.S1;
    if (n>=3) res=res+','+this.S2;
    if (n>=4) {
        for(var i = 4;i<=n;i++) {
            res=res+','+this.ss[this.sn_p-i+4];
        }
    }
    res=res+']\nRS [';
    n=this.rn_next;
    if (n>=1) res=res+this.R;
    if (n>=2) {
        for(var i = 2;i<=n;i++) {
            res=res+','+this.rs[this.rn_p-i+2];
        }
    }
    res=res+']\n';
    return res;
};

Stack.prototype.Clear = function () {
    this.sn_next = 0;
    this.sn_p = 0;
    this.rn_next = 0;
    this.rn_p = 0;
};

/*
** DS
*/
Stack.prototype.Push = function (v) {
    assert(this.sn_next<this.stack_size,'push: DS full');
    this.ss[this.sn_next]=this.S2;
    this.S2 = this.S1;
    this.S1 = this.S0;
    this.S0 = v;
    if (this.sn_next==0) this.sn_next=1;
    else {
        this.sn_p=this.sn_p+1; this.sn_next=this.sn_next+1;
    }
};

Stack.prototype.Pop = function () {
    var _I;
    assert(this.sn_next>0,'pop: DS empty');
    _I = this.S0;
    this.S0 = this.S1;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0; this.sn_next = 0
    } else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    };
    return _I;
};


Stack.prototype.Dup = function () {
    var v;
    assert(this.sn_next<this.stack_size,'dup: DS full');
    v = this.S0;
    this.ss[this.sn_next]=this.S2;
    this.S2 = this.S1;
    this.S1 = this.S0;
    this.S0 = v;
    if (this.sn_next==0) this.sn_next=1;
    else {
        this.sn_p=this.sn_p+1; this.sn_next=this.sn_next+1;
    }
};

Stack.prototype.Drop = function () {
    assert(this.sn_next>0,'drop: DS empty');
    this.S0 = this.S1;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0; this.sn_next = 0
    } else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    };
};

Stack.prototype.Dropn = function (n) {
    var i;
    assert(this.sn_next>n,'dropn: DS underflow');
    for(i=0;i<n;i++) this.Drop();
};

Stack.prototype.Swap = function () {
    var v;
    assert(this.sn_next>1,'swap: DS underflow');
    v = this.S0;
    this.S0 = this.S2;
    this.S2 = this.S1;
    this.S1 = v;
};

Stack.prototype.Rot = function () {
    var v;
    assert(this.sn_next>2,'rot: DS underflow');
    v = this.S0;
    this.S1 = this.S0;
    this.S0 = v;
};

Stack.prototype.Pick = function (n) {
    assert(this.sn_next>0,'pick: DS empty');
    assert(n<=this.sn_next,'pick: DS overflow');
    if (n==1) return this.S0;
    else if (n==2) return this.S1;
    else if (n==3) return this.S2;
    else return this.ss[this.sn_p-n+4];
};

Stack.prototype.Set = function (n) {
    var v;
    assert(n<=this.sn_next,'set: DS overflow');
    v=this.pop();
    if (n== 1) this.S0=v;
    else if (n== 2) this.S1=v;
    else if (n== 3) this.S2=v;
    else this.ss[this.sn_p-n+4] = v;
};

Stack.prototype.Add = function () {
    var v;
    assert(this.sn_next>1,'add: DS underflow');
    this.S0 = this.S1+this.S0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Sub = function () {
    var v;
    assert(this.sn_next>1,'sub: DS underflow');
    this.S0 = this.S1-this.S0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Mul = function () {
    var v;
    assert(this.sn_next>1,'mul: DS underflow');
    this.S0 = this.S1*this.S0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Div = function () {
    var v;
    assert(this.sn_next>1,'div: DS underflow');
    this.S0 = this.S1/this.S0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Mod = function () {
    var v;
    assert(this.sn_next>1,'mod: DS underflow');
    this.S0 = this.S1%this.S0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Neg = function () {
    var v;
    assert(this.sn_next>0,'neg: DS underflow');
    this.S0 = -this.S0;
};

Stack.prototype.Lt = function () {
    var v;
    assert(this.sn_next>1,'lt: DS underflow');
    if (this.S1<this.S0) this.S0=1; else this.S0=0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Gt = function () {
    var v;
    assert(this.sn_next>1,'gt: DS underflow');
    if (this.S1>this.S0) this.S0=1; else this.S0=0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Ge = function () {
    var v;
    assert(this.sn_next>1,'ge: DS underflow');
    if (this.S1>=this.S0) this.S0=1; else this.S0=0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Le = function () {
    var v;
    assert(this.sn_next>1,'le: DS underflow');
    if (this.S1<=this.S0) this.S0=1; else this.S0=0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Eq = function () {
    var v;
    assert(this.sn_next>1,'lt: DS underflow');
    if (this.S1==this.S0) this.S0=1; else this.S0=0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};


Stack.prototype.And = function () {
    var v;
    assert(this.sn_next>1,'and: DS underflow');
    this.S0=this.S1 & this.S0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Or = function () {
    var v;
    assert(this.sn_next>1,'or: DS underflow');
    this.S0=this.S1 | this.S0;
    this.S1 = this.S2;
    this.S2 = this.ss[this.sn_p];
    if (this.sn_next == 1) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 1;
        this.sn_next = this.sn_next - 1;
    }
};

Stack.prototype.Not = function () {
    var v;
    assert(this.sn_next>0,'not: DS underflow');
    if (this.S0) this.S0=0; else this.S0=1;
};

Stack.prototype.Inv = function () {
    var v;
    assert(this.sn_next>0,'inv: DS underflow');
    this.S0=~this.S0;
};

/*
** RS
*/
Stack.prototype.Pushr = function (v) {
    assert(this.rn_next<this.stack_size,'pushr: RS full');
    this.rs[this.rn_next]=this.R;
    this.R = v;
    if (this.rn_next==0) this.rn_next=1;
    else {
        this.rn_p=this.rn_p+1; this.rn_next=this.rn_next+1;
    }
};

Stack.prototype.Popr = function () {
    var _I;
    assert(this.rn_next>0,'popr: RS empty');
    _I = this.R;
    this.R = this.rs[this.rn_p];
    if (this.rn_next == 1) {
        this.rn_p = 0; this.rn_next = 0
    } else {
        this.rn_p = this.rn_p - 1;
        this.rn_next = this.rn_next - 1;
    };
    return _I;
};

Stack.prototype.Rpick = function () {
    var v;
    assert(this.sn_next>0,'rpick: DS empty');
    v = this.S0;
    assert(v<=this.rn_next,'rpick: RS overflow');
    if (v==1) this.S0 = this.R;
    else this.S0 = this.rs[this.rn_p-v+2];
};

Stack.prototype.Rset = function () {
    var v;
    assert(this.sn_next>1,'rset: DS empty');
    v = this.S0;
    assert(v<=this.rn_next,'rset: RS overflow');
    if (v== 1) this.R=this.S1;
    else this.rs[this.rn_p-v+2] = this.S1;
    this.S0 = this.S2;
    this.S1 = this.ss[this.sn_p];
    this.S2 = this.ss[this.sn_p-1];
    if (this.sn_next == 2) {
        this.sn_p = 0;
        this.sn_next = 0;
    }
    else {
        this.sn_p = this.sn_p - 2; this.sn_next = this.sn_next - 2;
    };
};

Stack.prototype.Tor = function () {
    var v;
    assert(this.sn_next>0,'tor: DS empty');
    assert(this.rn_next<this.stack_size,'tor: RS full');
    v = this.pop();
    this.pushr(v);
};

Stack.prototype.Fromr = function () {
    var v;
    assert(this.rn_next>0,'fromr: RS empty');
    assert(this.sn_next<this.stack_size,'fromr: DS full');
    v = this.popr();
    this.push(v);
};

module.exports = {
    Stack: Stack
};