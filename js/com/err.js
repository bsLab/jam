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
 **    $CREATED:     sbosse on 9/22/15.
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 **    Error management
 **
 **    $ENDOFINFO
 *
 */

var Io = Require('com/io');
var Comp = Require('com/compat');
var Array = Comp.array;
var Printf = Comp.printf;
var String = Comp.string;

var suppress_warnings = [];
var error_next = 0;
var errors = Array.create (100,['','']);
var silent = false;
var verbose = false;
var verbosity_level = 0;
var errno = 0;
var warn_is_err = false;
var err_notify = function() {};
var warn_next = 0;
var warnings = Array.create (100,['','']);

/** Register a new error from class 'err_class' (string)
 ** with message 'err_format' containing argument %s place holders.
 ** Returns unique error #id.
  *
 * @param err_class
 * @param err_format
 * @returns {number}
 */
function register_err(err_class,err_format) {
    var next = error_next;
    error_next = error_next + 1;
    if (error_next == Array.length(errors))
        errors = Array.append(errors, Array.create(100, ['','']));
    errors[next] = [err_class,err_format];
    return next;
}
/**
 ** Register a new warning from class 'warn_class' (string)
 ** with message 'warn_format' containing argument %s place holders.
 ** Returns unique warnor #id.
 *
 * @param warn_class
 * @param warn_format
 * @returns {number}
 */
function register_warn(warn_class,warn_format) {
    var next = warn_next;
    warn_next = warn_next + 1;
    if (warn_next == Array.length(warnings))
        warnings = Array.append(warnings, Array.create(100, ['','']));
    warnings[next] = [warn_class,warn_format];
    return next;
}

var err_overflow = register_err("ERR","Invalid error number %s");
var warn_overflow = register_err("warn","Invalid warning number %s");

function replace (str,args){
    var _str=str;
    Array.match(args,function(hd,tl) {
        _str = String.replace_first('%s',hd,str);
        _str=replace(_str,tl);
    },function () {
        _str=str;
    });
    return _str;
}

function err_unsafe(err_num,args) {
    var err_cf = errors[err_num];
    Io.out(Printf.sprintf('[ERROR %s]: %s.', err_cf[0], replace(err_cf[1], args)));
    throw [err_num,args];
}

function err(err_num,args) {
    silent = false;
    var err_cf;
    if (err_num >= error_next || err_num < 0)
        err_unsafe(err_overflow,[Printf.sprintf("%d",err_num)]);
    else
        err_cf=errors[err_num];

    var msg = Printf.sprintf('[ERROR %s] %s.',err_cf[0],replace(err_cf[1], args));
    if (!silent) Io.out(msg);
    err_notify(msg);
    errno = err_num;
    throw [err_num,args]
}

function err_sprint(err_num,args) {
    var err_cf;
    if (err_num >= error_next || err_num < 0)
        err_cf=err_unsafe(err_overflow,[Printf.sprintf("%d",err_num)]);
    else
        err_cf=errors[err_num];

    var msg = Printf.sprintf('[%s] %s.',err_cf[0],replace(err_cf[1], args));
    return msg;
}

function err_raise(err_num,args) {
    throw new Error((err_sprint(err_num,args)));
}

function err_warn(err_num,args) {
    Io.out(err_sprint(err_num,args));
}

var last_warning = '';
var warning_repeated = 0;

function warn(warn_num,args) {
    var warn_cf;
    if (warn_num >= warn_next || warn_num < 0)
        err_unsafe(warn_overflow,[Printf.sprintf("%d",warn_num)]);
    else
        warn_cf=warnings[warn_num];
    if (!Array.member(suppress_warnings,warn_cf[0])) {
        var msg = Printf.sprintf("[WARNING %s] %s.",warn_cf[0], replace(warn_cf[1],args));
        if (String.equal(msg,last_warning)) warning_repeated++;
        else warning_repeated=0;
        if ((warning_repeated % 100)==1)
            Io.out ('[More warnings follow]');
        else if (warning_repeated==0)
            Io.out(msg);
    }
    if (warn_is_err) throw "Exit"; // Todo ??
}

module.exports = {
    err:err,
    err_raise:err_raise,
    err_warn:err_warn,
    raise:err_raise,
    err_sprint:err_sprint,
    register_warn:register_warn,
    register_err:register_err,
    warn:warn
};
