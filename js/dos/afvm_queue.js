/**
 * Created by sbosse on 3/9/15.
 */
var Types = require('./afvm_types');
var Sch = require('./scheduler');

var assert = function(condition, message) {
    if (!condition)
        throw Error("[afvm_queue]" + (typeof message !== "undefined" ? ": " + message : ""));
};

var TokenQueue = function (tq_desc) {
    this.tq_data = [];      // Token list
    this.tq_lock = 0;       // integer
    this.tq_desc = tq_desc; // string
};

TokenQueue.prototype.Lock = function () {
    var _tk_myid;
    _tk_myid = Sch.GetId();
    this.tq_lock = _tk_myid;
};

TokenQueue.prototype.UnLock = function () {
    this.tq_lock = 0
};

TokenQueue.prototype.Inq = function () {
    var _tk_tq_elem;
    _tk_tq_elem = undefined;
    this.Lock();
    if (this.tq_data.length == 0)
        Sch.SetBlocked(true);
    else {
        Sch.SetBlocked(false);
        _tk_tq_elem = this.tq_data[0];
        this.tq_data.shift();
    };
    this.UnLock();
    return _tk_tq_elem;
};

TokenQueue.prototype.Outq = function (t) {
    // if LOGIT then LOG("outq("+tq.tq_desc+","+ToString(t.tk_id)+")");
    this.Lock();
    t.tk_place = this.tq_desc;
    this.tq_data.push(t);
    this.UnLock();
};

TokenQueue.prototype.Emptyq = function () {
    var _tk_cond;
    this.Lock();
    _tk_cond = (this.tq_data.length == 0);
    this.UnLock();
    return _tk_cond;
};

var ContainerQueue =  function (cq_desc) {
    this.cq_data = [];      // Container list,
    this.cq_lock = 0;       // integer,
    this.cq_desc = cq_desc; // string
};

ContainerQueue.prototype.Lock = function () {
    var _tk_myid;
    _tk_myid = Sch.GetId();
    this.cq_lock = _tk_myid;
};

ContainerQueue.prototype.UnLock = function () {
    this.cq_lock = 0
};

ContainerQueue.prototype.Inq = function () {
    var _tk_cq_elem;
    _tk_cq_elem = undefined;
    this.Lock();
    if (this.cq_data.length == 0)
        Sch.SetBlocked(true);
    else {
        Sch.SetBlocked(false);
        _tk_cq_elem = this.cq_data[0];
        this.cq_data.shift();
    };
    this.UnLock();
    return _tk_cq_elem;
};

ContainerQueue.prototype.Outq = function (c) {
    // if LOGIT then LOG("outq("+tq.tq_desc+","+ToString(t.tk_id)+")");
    this.Lock();
    this.cq_data.push(c);
    this.UnLock();
};

ContainerQueue.prototype.Emptyq = function () {
    var _tk_cond;
    this.Lock();
    _tk_cond = (this.cq_data.length == 0);
    this.UnLock();
    return _tk_cond;
};

var SignalQueue = function (sq_desc) {
    this.sq_data = [];      // Signal list,
    this.sq_lock = 0;       // integer,
    this.sq_desc = sq_desc; // string
};

SignalQueue.prototype.Lock = function () {
    var _tk_myid;
    _tk_myid = Sch.GetId();
    this.sq_lock = _tk_myid;
};

SignalQueue.prototype.UnLock = function () {
    this.sq_lock = 0
};

SignalQueue.prototype.Inq = function () {
    var _tk_sq_elem;
    _tk_sq_elem = undefined;
    this.Lock();
    if (this.sq_data.length == 0)
        Sch.SetBlocked(true);
    else {
        Sch.SetBlocked(false);
        _tk_sq_elem = this.sq_data[0];
        this.sq_data.shift();
    };
    this.UnLock();
    return _tk_sq_elem;
};

SignalQueue.prototype.Outq = function (s) {
    // if LOGIT then LOG("outq("+tq.tq_desc+","+ToString(t.tk_id)+")");
    this.Lock();
    this.sq_data.push(s);
    this.UnLock();
};

SignalQueue.prototype.Emptyq = function () {
    var _tk_cond;
    this.Lock();
    _tk_cond = (this.sq_data.length == 0);
    this.UnLock();
    return _tk_cond;
};

module.exports = {
    TokenQueue: TokenQueue,
    ContainerQueue: ContainerQueue,
    SignalQueue: SignalQueue
};
