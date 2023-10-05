/**
 * Created by sbosse on 3/24/15.
 */
var Types = require('./afvm_types');
var Queue = require('./afvm_queue');

var ts_db = function() {
    this.ts1_lock=0;
    this.ts2_lock=0;
    this.ts3_lock=0;
    this.ts4_lock=0;
    this.ts5_lock=0;
    this.ts6_lock=0;
    this.ts7_lock=0;
    this.ts8_lock=0;
    this.ts9_lock=0;
    this.ts10_lock=0;
    this.ts1=[];
    this.ts2=[];
    this.ts3=[];
    this.ts4=[];
    this.ts5=[];
    this.ts6=[];
    this.ts7=[];
    this.ts8=[];
    this.ts9=[];
    this.ts10=[];
};

module.exports = {
    Ts_db: function () {return new ts_db()}
};
