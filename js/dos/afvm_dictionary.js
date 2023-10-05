/**
 * Created by sbosse on 3/8/15.
 */
var Types = require('./afvm_types');

var assert = function(condition, message) {
    if (!condition)
        throw Error("[afvm_dictionary]" + (typeof message !== "undefined" ? ": " + message : ""));
};

var Dictionary = function () {
    this.DICT = [];
};

Dictionary.prototype.Lookup = function (name) {
    var _dict_off,_dict,_dict_entry,_dict_size;
    _dict_off = -1;
    _dict = this.DICT;
    _dict_size = _dict.length;
    for (i=0;i<_dict_size && _dict_off==-1;i++) {
        _dict_entry = _dict[i];
        if (_dict_entry.dict_name == name)
            _dict_off = _dict_entry.dict_coff
    }
    return _dict_off;
};


module.exports = {
    Dictionary: Dictionary
};
