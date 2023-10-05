/**
 **      ==================================
 **      OOOO   OOOO OOOO  O      O   OOOO
 **      O   O  O    O     O     O O  O   O
 **      O   O  O    O     O     O O  O   O
 **      OOOO   OOOO OOOO  O     OOO  OOOO
 **      O   O     O    O  O    O   O O   O
 **      O   O     O    O  O    O   O O   O
 **      OOOO   OOOO OOOO  OOOO O   O OOOO
 **      ==================================
 **      BSSLAB, Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR.
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     4/16/15 by sbosse.
 **    $VERSION:     1.1.3
 **
 **    $INFO:
 **
 **  DOS: Capability Sets
 **
 **    $ENDOFINFO
 */
"use strict";

var util = Require('util');
var Io = Require('com/io');
var Net = Require('dos/network');
var Std = Require('dos/std');
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Comp = Require('com/compat');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Rand = Comp.random;
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;

var CAPSET_MAX = 8;
var SHORT_SIZE = 2;
var CAPSET_SIZE = 2 * SHORT_SIZE + CAPSET_MAX * (Net.CAP_SIZE + SHORT_SIZE);


/*
** Cap set structure
*/
/** Capability Set Suite
 *
 * @typedef {{s_object:capability,s_current:bool}} suite~obj
 * @param {capability} s_object
 * @param {boolean} s_current
 * @constructor
 * @see suite~obj
 */
var suite = function (s_object,s_current) {
    this.s_object = s_object; // capability
    this.s_current= s_current; // bool
};

/** Capability Set {@link capset~obj}
 *
 * @param {number} cs_initial
 * @param {number} cs_final
 * @param {suite []} cs_suite
 * @constructor
 * @typedef {{cs_initial:number,cs_final:number,cs_suite:suite []}} capset~obj
 *
 */
var capset = function (cs_initial,cs_final,cs_suite) {
    this.cs_initial = cs_initial;
    this.cs_final   = cs_final;
    this.cs_suite   = cs_suite;
};


/** Suite Constructor
 *
 * @param {capability} s_object
 * @param {boolean} s_current
 * @returns {suite}
 */

function Suite (s_object,s_current) {
    var obj = new suite(s_object,s_current);
    Object.preventExtensions(obj);
    return obj;
}

/** Capability Set Constructor
 *
 * @param {number} cs_initial
 * @param {number} cs_final
 * @param {suite []} cs_suite
 * @returns {capset}
 */

function Capset (cs_initial,cs_final,cs_suite) {
    if (cs_suite!=undefined && !Comp.isArray(cs_suite)) Io.err('Capset: cs_suite argument is not a capset array, '+util.inspect(cs_suite));
    var obj = new capset(cs_initial,cs_final,cs_suite);
    Object.preventExtensions(obj);
    return obj;
}

/**
 *
 * @param {suite} sa1
 * @param {suite} sa2
 * @returns {boolean}
 */
function suite_equal(sa1,sa2) {
    if (sa1.length!=sa2.length) return false;
    for (var i in sa1) {
        var s1=sa1[i];
        var s2=sa2[i];
        if (s1.s_current!=s2.s_current ||
            !Net.Equal.capability(s1.s_object,s2.s_object)) return false;
    }
    return true;
}

/**
 *
 * @param {capset} cs1
 * @param {capset} cs2
 * @returns {boolean}
 */
function cs_equal (cs1,cs2) {
    return (cs1==undefined && cs2==undefined) ||
           (cs1.cs_initial==cs2.cs_initial &&
            cs1.cs_final==cs2.cs_final &&
            suite_equal(cs1.cs_suite,cs2.cs_suite))
}

var emptycapset = Capset(0,0,[]);


/** {@link csint~obj}
 *  Capset operations
 *
 * @param {rpcint} rpc
 * @constructor
 * @typedef {{rpc:rpcint,std:stdint,
 *            cs_goodcap:csint.cs_goodcap,cs_singleton:csint.cs_singleton,cs_copy:csint.cs_copy}} csint~obj
 */
var csint = function(rpc) {
    this.rpc=rpc;
    this.std=Std.StdInt(rpc);
};

/**
 *
 * @param {rpcint} rpc
 * @returns {csint}
 */
function CsInt(rpc) {
    var obj = new csint(rpc);
    Object.preventExtensions(obj);
    return obj;
}

/**
 ** Get a usable capability from a capability set, and return this cap.
 ** Provides the first capability in the set for which std_info returns STD_OK.
 ** If there are no caps in the set for which std_info returns STD_OK,
 ** then the last cap in the set is returned and the error status STD_INFO.
 *
 *
 * @param {capset} capset
 * @param {function((Status.STD_OK|*),capset|undefined)} callback
 */
csint.prototype.cs_goodcap = function(capset,callback) {
    var cs=capset;
    var self=this;
    var err_stat = Net.Status.STD_UNKNOWN;
    var lastcap  = undefined;
    var i;

    var s = cs.cs_suite[0];
    lastcap = s.s_object;
    i=0;

    Sch.ScheduleBlock([
        [function() {
            if (s.s_current == true) Sch.ScheduleBlock([
                [Sch.Bind(self.std,self.std.std_info),s.s_object,function(stat,data) {
                    err_stat=stat;}],
                []
            ]);
        }],
        [function() {
            if (err_stat == Net.Status.STD_OK || err_stat == Net.Status.STD_OVERFLOW) {
                err_stat=Net.Status.STD_OK;
            } else if (cs.cs_final>1) {
                s = cs.cs_suite[1];
                lastcap = s.s_object;
                if (s.s_current == true) Sch.ScheduleBlock([
                    [Sch.Bind(self.std, self.std.std_info), s.s_object, function (stat, data) {
                        err_stat = stat;
                    }]
                ]);
            }
        }],
        [function() {
            if (err_stat == Net.Status.STD_OK || err_stat == Net.Status.STD_OVERFLOW)
                err_stat=Net.Status.STD_OK;
            callback(err_stat,lastcap);
        }]
    ]);
    Sch.ScheduleLoop(
        function () {return (i < cs.cs_final && err_stat!=Net.Status.STD_OK)},
        [
            [function() {
                if (s.s_current == true) Sch.ScheduleBlock([
                    [Sch.Bind(self.std,self.std.std_info),s.s_object,function(stat,data) {
                        err_stat=stat;}],
                ]);
                i++;
            }],
            [function() {
                if (err_stat == Net.Status.STD_OK || err_stat == Net.Status.STD_OVERFLOW) {
                    err_stat=Net.Status.STD_OK;
                } else if (cs.cs_final>1) {
                    s = cs.cs_suite[1];
                    lastcap = s.s_object;
                }
            }]
        ],
        [
            [function() {callback(err_stat,lastcap);}]
        ])
};


/**
 ** Convert a capability to a capability set
 *
 *
 * @param {capability} cap
 * @returns {capset}
 */
csint.prototype.cs_singleton = function(cap){
    return Capset(1,1,[Suite(cap,true)]);
};

/**
 ** Return a (current) capability from a capability set
 **
 ** Get a capability from a capability set giving preference to a working capability.
 ** If there is only one cap in the set, this cap is returned.  If and only
 ** if there is more than one, try std_info on each of them to obtain one
 ** that is usable, and return this one.  If none of the multiple
 ** caps work, the last one is returned.  Callers who need to know whether the
 ** cap is usable should use cs_goodcap(), above.  Returns STD_OK, unless
 ** the capability set has no caps, in which case, returns STD_SYSERR (==undefined).
 *
 *
 * @param {capset} cs
 * @returns {capability|undefined}
 */
csint.prototype.cs_to_cap = function(cs){
    var cs_size = 0;
    var cs_save = cs.cs_suite[0];

    for (var i = 0; i < cs.cs_final;i++) {
        if (cs.cs_suite[i].s_current == true) {
            cs_save = cs.cs_suite[i];
            cs_size++;
        }
    }

    switch (cs_size) {
        case 0: return undefined;
        case 1: return (cs_save).s_object;
        default: return undefined; // requires cs_goodcap
    }
};



/** Return a fresh capability set and copy the original contents
 *
 *
 * @param {capset} cs
 * @returns {capset}
 */
csint.prototype.cs_copy = function(cs) {
    var suites=[];
    for(var i in cs.cs_suite) {
        var suite=cs.cs_suite[i];
        suites.push(Suite(Net.Copy.capability(suite.s_object),suite.s_current))
    }
    return Capset(cs.cs_initial,cs.cs_final,suites)
};

/**
 *
 * @param {rpcio} rpcio
 * @param {capset} cs
 */
function buf_put_capset(rpcio,cs) {
    if (cs.cs_final < 0 ||
        cs.cs_initial < 0 ||
        cs.cs_initial < cs.cs_final ||
        cs.cs_final > CAPSET_MAX) {
        return;
    }
    Buf.buf_put_int16(rpcio,cs.cs_initial);
    Buf.buf_put_int16(rpcio,cs.cs_final);
    for(var i = 0; i<cs.cs_final;i++) {
        var suite=cs.cs_suite[i];
        Buf.buf_put_cap(rpcio,suite.s_object);
        if (suite.s_current) Buf.buf_put_int16(rpcio,1);
        else Buf.buf_put_int16(rpcio,0);
    }
}

/**
 *
 * @param {rpcio} rpcio
 * @param {capset} [cs]
 */
function buf_get_capset(rpcio,cs) {
    if (cs==undefined) cs=Capset();
    cs.cs_initial=Buf.buf_get_int16(rpcio);
    cs.cs_final=Buf.buf_get_int16(rpcio);
    var cssuites=[];
    for(var i = 0; i<cs.cs_final;i++) {
        var cap  = Buf.buf_get_cap(rpcio);
        var ival = Buf.buf_get_int16(rpcio);
        var current = ival>0;
        cssuites.push(this.Suite(cap,current));
    }
    cs.cs_suite=cssuites;
    return cs;
}


/**
 * 
 * @type {{CAPSET_SIZE: number, Suite: Suite, Capset: Capset, nilcapset: undefined, emptycapset: capset, CsInt: Function, Copy: {capset: Function}, Equal: {capset: cs_equal, suite: suite_equal}, Print: {capset: Function}, buf_put_capset: buf_put_capset, buf_get_capset: buf_get_capset}}
 */
module.exports = {
    CAPSET_SIZE: 2*Buf.SIZEOF_INT16+2*Buf.CAP_SIZE,
    /** Suite object
     *
     */
    Suite: Suite,
    /** Capability set object
     *
     */
    Capset: Capset,
    nilcapset: undefined,
    emptycapset: emptycapset,

    /** Capability set interface object
     *
     * @param {rpc} rpc
     * @returns {csint}
     */
    CsInt: function(rpc) {
        var obj = new csint(rpc);
        Object.preventExtensions(obj);
        return obj;
    },
    Copy: {
        /**
         *
         * @param {capset} cs1 source
         * @param {capset} [cs2] destination
         * @returns {capset}
         */
        capset: function(cs1,cs2) {
            var suites, i,suite;
            if (cs2==undefined) {
                suites=[];
                for(i in cs1.cs_suite) {
                    suite=cs1.cs_suite[i];
                    suites.push(Suite(Net.Copy.capability(suite.s_object),suite.s_current))
                }
                cs2=Capset(cs1.cs_initial,cs1.cs_final,suites)
            } else {
                cs2.cs_initial=cs1.cs_initial;
                cs2.cs_final=cs1.cs_final;
                suites=[];
                for(i in cs1.cs_suite) {
                    suite=cs1.cs_suite[i];
                    suites.push(Suite(Net.Copy.capability(suite.s_object),suite.s_current))
                }
                cs2.cs_suite=suites;
            }
            return cs2;
        }
    },
    Equal: {
        capset: cs_equal,
        suite: suite_equal
    },
    Print: {
        capset: function(cs) {
            var i,suite;
            if (cs==undefined) return 'undefined';
            var str='{\n';
            str=str+'  Initial:'+cs.cs_initial+' Final:'+cs.cs_final+'\n';
            for(i in cs.cs_suite) {
                suite=cs.cs_suite[i];
                str=str+'  #'+i+' '+Net.Print.capability(suite.s_object)+(suite.s_current?' (current)':'')+'\n';
            }
            str=str+'}';
            return str;
        }
    },
    // Buffer data functions
    buf_put_capset: buf_put_capset,
    buf_get_capset: buf_get_capset
};
