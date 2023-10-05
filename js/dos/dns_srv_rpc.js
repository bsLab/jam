/**
 **      ==============================
 **       OOOO        O      O   OOOO
 **       O   O       O     O O  O   O
 **       O   O       O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2016 BSSLAB
 **    $CREATED:     7/7/15 by sbosse.
 **    $VERSION:     1.2.4
 **
 **    $INFO:
 **
 **  DOS: DNS RPC Interface
 **
 **    $ENDOFINFO
 */

/*
 *********************
 ** PUBLIC INTERFACE
 *********************
 */

"use strict";

var log = 0;

var util = Require('util');
var Io = Require('com/io');
var Net = Require('dos/network');
var Status = Net.Status;
var Command = Net.Command;
var Rights = Net.Rights;
var Std = Require('dos/std');
var Sch = Require('dos/scheduler');
var Buf = Require('dos/buf');
var Rpc = Require('dos/rpc');
var Fs = Require('fs');
var Comp = Require('com/compat');
var String = Comp.string;
var Array = Comp.array;
var Perv = Comp.pervasives;
var Hashtbl = Comp.hashtbl;
var Filename = Comp.filename;
var assert = Comp.assert;
var div = Comp.div;
var Afs = Require('dos/afs_srv_common');
var Afs_file_state = Afs.Afs_file_state;
var Afs_commit_flag= Afs.Afs_commit_flag;
var DnsInt = Require('dos/dns');
var Dns = Require('dos/dns_srv_common');
var Cs = Require('dos/capset');

/**
 * @augments dns_server
 * @augments dns_server_emb
 * @see dns_server
 * @see dns_server_emb
 * @see dns_server_rpc~meth
 * @constructor
 */
var dns_server_rpc = function() {
};
/**
 * @typedef {{
 * dns_lookup:dns_server.dns_lookup,
 * dns_create:dns_server.dns_create,
 * dns_append:dns_server.dns_append,
 * dns_info:dns_server.dns_info,
 * dns_stat:dns_server.dns_stat,
 * dns_list:dns_server.dns_list,
 * dns_setlookup:dns_server.dns_setlookup}} dns_server_emb~meth
 *
/**
 ** DNS_LOOKUP:
 ** Traverse a path as far as possible, and return the resulting (restricted) capability
 ** set and the rest of the path.
 *
 * @param {private} priv
 * @param {string} path
 * @param {function((Status.STD_OK|*),capset|undefined,string)} callback
 */
dns_server_rpc.prototype.dns_lookup = function(priv,path,callback) {
    var self=this;
    //var log=1;
    var path = Filename.path_normalize(path);
    var path_rel = Filename.is_relative(path);
    var pathl = String.split ('/', path);
    var finished = false;

    /*
     ** Avoid recursion. Visit each directory only once!
     */
    var visited=[];

    Io.log((log<1)||('Dns_server.dns_lookup '+Net.Print.private(priv)));
    /*
     ** During we iterate over the path components, this
     ** rights value will be adjusted with the rights from the
     ** path components and used finally to restrict the
     ** capability set of the last path component
     ** resolved by this server.
     */
    var have_rights = Rights.PRV_ALL_RIGHTS;
    var rights = Net.prv_rights(priv);
    /**
     *
     * @type {dns_dir|undefined}
     */
    var dir = undefined;
    /**
     *
     * @type {dns_dir|undefined}
     */
    var dir_last = undefined;
    /**
     *
     * @type {dns_row|undefined}
     */
    var row_last = undefined;
    var stat= Status.STD_OK;
    var mask = rights & Rights.PRV_ALL_RIGHTS;
    var colmask=0;
    var cs;

    Sch.ScheduleBlock([
        /*
         ** The root directory for the iteration...
         */
        function () {self.request_dir(priv,Rights.DNS_RGT_READ,function (_stat,_dir) {
            Io.log((log<1)||('Dns_server.dns_lookup request_dir: '+Status.print(_stat)));
            stat=_stat;
            dir=_dir;
        })},
        function () {
            var i;
            if (stat!=Status.STD_OK) throw stat;
            dir_last=dir;
            visited.push(dir.dd_objnum);
            Sch.ScheduleLoop(function(index){
                return !finished && stat==Status.STD_OK;
            },[
                function () {
                    Array.match(pathl,function (hd,tl) {
                        pathl = tl;
                        dir_last = dir;
                        /*
                         ** When checking the presence of column rights, only take
                         ** the *actual* columns present into account,
                         ** so do not use DNS_COLMASK here.
                         */
                        var ncols = dir.dd_ncols;
                        var colrights=Dns.dns_col_bits[ncols]-1;
                        /*
                         ** The columns mask for the calculation for the
                         ** next lookup, if any,
                         ** and the permission for the row lookup in the current
                         ** directory.
                         ** The current have_rights are logical
                         ** and-ed with the current mask (limited to ncol bits).
                         */
                        colmask= mask & have_rights & colrights;
                        Io.log((log<1)||('Dns_server.dns_lookup: rowname='+hd+' colrights='+colrights+' have_rights='+have_rights+' mask='+mask+' colmask='+colmask));
                        if (colmask==0) {
                            self.release_unmodified_dir(dir);
                            throw Status.STD_DENIED;
                        }

                        var row = self.search_row(dir,hd);
                        if (row==undefined) {
                            self.release_unmodified_dir(dir);
                            dir_last=undefined;
                            throw Status.STD_NOTFOUND;
                        }
                        row_last=row;
                        /*
                         ** Calculate the new have_rights value.
                         ** All the columns rights from the current row
                         ** are logical or-ed,if, and only if the i-th
                         ** bit in the current column mask is set.
                         ** The i-th bit corresponds to the i-th rights column
                         ** in the current row.
                         */
                        var colmasknew=0;
                        var cols = row.dr_columns;
                        for(i=0;i<ncols;i++) {
                            var coli=cols[i];
                            var colbits = Dns.dns_col_bits[i];
                            /*
                             ** If the i-th bit in column mask is set,
                             ** add the i-th column of the row to
                             ** the new column mask.
                             */
                            if ((colmask & colbits) == colbits) {
                                colmasknew=colmasknew | coli;
                            }
                        }
                        have_rights = colmasknew;

                        Io.log((log<1)||('Dns_server.dns_lookup: new have_rights='+have_rights));
                        /*
                         ** Get and acquire the next directory. If the next
                         ** object belongs not to this server, exit.
                         */
                        priv=self.check_dir(row.dr_capset);
                        Io.log((log<1)||('Dns_server.dns_lookup: stat='+Status.print(stat)+' newdir priv='+Net.Print.private(priv)));
                        if (priv !=undefined && !Array.member(visited,Net.prv_number(priv)))
                            self.request_dir(priv,0,function (_stat,_dir) {
                                stat=_stat;
                                dir=_dir;
                            });
                        else {
                            stat=Status.STD_OK;
                            finished=true;
                        }
                    }, function () {
                        dir_last = dir;
                        finished = true;
                    })
                },
                function () {
                    if (stat!=Status.STD_OK) finished=true;
                    if (!finished) {
                        /*
                         ** The current column mask must be finally
                         ** logical and-ed with the rights field
                         ** of the next directory.
                         */
                        colmask = colmask & Net.prv_rights(priv);
                        self.release_unmodified_dir(dir_last);
                        dir_last=undefined;
                        mask=colmask;
                    }
                }
            ],[
                function () {
                    Io.log((log<1)||('Dns_server.dns_lookup: finalize dir_last='+util.inspect(dir_last)));
                    Io.log((log<1)||('Dns_server.dns_lookup: finalize row_last='+util.inspect(row_last)));
                    self.release_unmodified_dir(dir_last);
                    dir_last=undefined;
                    /*
                     ** Build the restricted object capability set
                     */
                    if (row_last.dr_capset!=undefined)
                        self.restrict(row_last.dr_capset,have_rights,function (_stat,_cs) {
                            stat=_stat;
                            cs=_cs;
                        });
                    else {
                        stat=Status.STD_OBJBAD;
                        cs=Cs.emptycapset;
                    }
                },
                function () {
                    var path_rest=Filename.join(pathl);
                    callback(stat,cs,path_rest);
                }
            ])
        }
    ],function (e) {
        if (dir_last!=undefined) self.release_unmodified_dir(dir_last);
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_looukp'); }
        if (typeof e == 'number') callback(e,undefined,''); else callback(Status.STD_SYSERR,undefined,'');
    });

};

/** Create a new empty directory table entry.
 *
 * @param {private} priv
 * @param {string []} colnames
 * @param {function((Status.STD_OK|*),capset|undefined)} callback
 */
dns_server_rpc.prototype.dns_create = function(priv,colnames,callback) {
    var self=this;
    var ncols=colnames.length;
    if (ncols > Dns.DNS_MAXCOLUMNS) {
        callback(Status.STD_ARGBAD,undefined);
        return;
    }
    var dir=undefined;
    var new_dir=undefined;
    var stat=Status.STD_UNKNOWN;
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_CREATE,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) throw stat;
            self.release_unmodified_dir(dir);
            self.alloc_dir(colnames,function (_stat,_dir) {
                stat=_stat;
                new_dir=_dir;
            });
        },
        function () {
            if (stat!=Status.STD_OK) throw Status.STD_NOSPACE;
            var cs=self.capset_of_dir(new_dir,Rights.PRV_ALL_RIGHTS);
            self.release_dir(new_dir,function (_stat) {
                if(_stat==Status.STD_OK) callback(Status.STD_OK,cs);
                else callback(_stat,undefined);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_create');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    })

};
/** Append a row to a directory. The name, right masks (cols), and initial
 ** capability set must be specified.
 *
 * @param priv
 * @param name
 * @param {number []} cols
 * @param {capset} cs
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server_rpc.prototype.dns_append = function(priv,name,cols,cs,callback) {
    var self=this;
    var ncols=cols.length;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    if (ncols > Dns.DNS_MAXCOLUMNS || String.equal(name,'')) {
        callback(Status.STD_ARGBAD);
        return;
    }
    Sch.ScheduleBlock([
        function () {
            Io.log((log<2)||('Dns_server.dns_append: request_dir '+Net.Print.private(priv)));
            self.request_dir(priv,Rights.DNS_RGT_MODIFY,function (_stat,_dir) {
                Io.log((log<2)||('Dns_server.dns_append: request_dir returns '+Status.print(_stat)));
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) throw stat;
            var row = self.search_row(dir,name);
            if (row!=undefined) throw Status.STD_EXISTS;
            var new_row = Dns.Dns_row(name,self.time(),cols,cs);
            self.append_row(dir,new_row);
            self.release_dir(dir,function (_stat) {
                callback(_stat);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_append');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    })

};

/** Rename a row of a directory.
 *
 * @param priv
 * @param oldname
 * @param newname
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server_rpc.prototype.dns_rename = function(priv,oldname,newname,callback) {
    var self=this;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    if (String.equal(oldname,'') || String.equal(newname,'')) {
        callback(Status.STD_ARGBAD);
        return;
    }
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_MODIFY,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            stat=self.rename_row(dir,oldname,newname);
            self.release_dir(dir,function (_stat) {
                if (stat==Status.STD_OK) callback(_stat); else callback(stat);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_rename');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    })

};

/** Change columns rights of a row in a directory.
 *
 * @param priv
 * @param rowname
 * @param {number []} cols
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server_rpc.prototype.dns_chmod = function(priv,rowname,cols,callback) {
    var self=this;
    var dir=undefined;
    var row=undefined;
    var ncols=cols.length;
    var stat=Status.STD_UNKNOWN;
    if (String.equal(rowname,'') || Array.empty(cols)) {
        callback(Status.STD_ARGBAD);
        return;
    }
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_MODIFY,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            row=self.search_row(dir,rowname);
            if (row==undefined) stat=Status.STD_NOTFOUND; else {
                stat=Status.STD_OK;
                var maxcols=Perv.min(Array.length(row.dr_columns),ncols);
                for(var i=0;i<maxcols;i++) {
                    row.dr_columns[i]=cols[i];
                }
            }
            self.release_dir(dir,function (_stat) {
                if (stat==Status.STD_OK) callback(_stat); else callback(stat);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_chmod');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    })

};
/** Rename a row of a directory.
 *
 * @param priv
 * @param name
 * @param newcs
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server_rpc.prototype.dns_replace = function(priv,name,newcs,callback) {
    var self=this;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    if (String.equal(name,'')) {
        callback(Status.STD_ARGBAD);
        return;
    }
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_MODIFY,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            stat=self.replace_row(dir,name,cs);
            self.release_dir(dir,function (_stat) {
                if (stat==Status.STD_OK) callback(_stat); else callback(stat);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_replace');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    })

};
/** Delete a row of a directory.
 *
 * @param priv
 * @param name
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server_rpc.prototype.dns_delete = function(priv,name,callback) {
    var self=this;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    if (String.equal(name,'')) {
        callback(Status.STD_ARGBAD);
        return;
    }
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_MODIFY,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            stat=self.delete_row(dir,name);
            self.release_dir(dir,function (_stat) {
                if (stat==Status.STD_OK) callback(_stat); else callback(stat);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_delete');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    })

};

/** Delete a directory and destroy AFS objects (directory table).
 *
 * @param priv
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server_rpc.prototype.dns_delete_dir = function(priv,callback) {
    var self=this;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_DELETE,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            self.delete_dir(dir, function (_stat) {
                stat=_stat;
            });
        },
        function () {
            callback(stat);
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_delete_dir');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    })
};

/** Touch a directory.
 *
 * @param priv
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server_rpc.prototype.dns_touch = function(priv,callback) {
    var self=this,
        dir=undefined,
        stat=Status.STD_UNKNOWN;
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_MODIFY,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            self.touch(dir,function (_stat) {stat=_stat});
            self.release_dir(dir,function (_stat){
                if (stat==Status.STD_OK) callback(_stat); else callback(stat);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_touch');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    })

};

/** Age all objects from this server. Destroy objects with live time = 0.
 ** Only allowed with the super capability (obj = 0).
 *
 * @param priv
 * @param {function((Status.STD_OK|*))} callback
 */
dns_server_rpc.prototype.dns_age = function(priv,callback) {
    var self=this;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);

    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_MODIFY,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            self.age(function (_stat) {
              stat=_stat;
            });
        },
        function () {
            self.release_dir(dir,function (_stat) {
                if (stat==Status.STD_OK) callback(_stat); else callback(stat);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_age');}
        if (typeof e == 'number') callback(e); else callback(Status.STD_SYSERR);
    })

};

/**
 ** Restrict dir capability
 *
 * @param {private} priv
 * @param {number} mask
 * @param {function((Status.STD_OK|*),(privat|undefined))} callback return status
 */
dns_server_rpc.prototype.dns_restrict =function (priv,mask,callback) {
    var self = this;
    var privres=undefined;
    var stat = Status.STD_UNKNOWN;
    var dir = undefined;
    var obj = Net.prv_number(priv);
    var rights = Net.prv_rights(priv);
    Sch.ScheduleBlock([
        function () {
            self.acquire_dir(obj,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            });
        },
        function () {
            if (stat != Status.STD_OK) {
                throw stat;
            }
            if (Net.prv_decode(priv, dir.dd_random) == false) {
                throw Status.STD_DENIED;
            }
            stat=Status.STD_OK;
            privres=Net.prv_encode(obj,mask,dir.dd_random);
            self.release_unmodified_dir(dir);
            dir=undefined;
            callback(stat,privres);
        }
    ],function (e) {
        if (dir!=undefined) self.release_unmodified_dir(dir);
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.afs_restrict');}
        if (typeof e == 'number') callback(e,undefined); else callback(Status.STD_SYSERR,undefined);
    });

};

/** Get information of a directory
 *
 * @param priv
 * @param callback
 */
dns_server_rpc.prototype.dns_info = function(priv,callback) {
    var self=this;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    var rights = Net.prv_rights(priv);
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,0,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat==Status.STD_OK)
              self.release_dir(dir,function (_stat) {
                stat=_stat;
              });
            else throw stat;
        },
        function () {
            if (stat != Status.STD_OK) throw stat;
            var str='/';
            if ((rights & Rights.DNS_RGT_DELETE) == Rights.DNS_RGT_DELETE) str=str+'D'; else str=str+'-';
            if ((rights & Rights.DNS_RGT_DELETE) == Rights.DNS_RGT_DELETE) str=str+'M'; else str=str+'-';
            if ((rights & Rights.DNS_RGT_CREATE) == Rights.DNS_RGT_CREATE) str=str+'C'; else str=str+'-';
            if ((rights & Rights.DNS_RGT_READ) == Rights.DNS_RGT_READ) str=str+'R'; else str=str+'-';
            if ((rights & Rights.DNS_RGT_COL1) == Rights.DNS_RGT_COL1) str=str+'1'; else str=str+'-';
            if ((rights & Rights.DNS_RGT_COL2) == Rights.DNS_RGT_COL2) str=str+'2'; else str=str+'-';
            if ((rights & Rights.DNS_RGT_COL3) == Rights.DNS_RGT_COL3) str=str+'3'; else str=str+'-';
            if ((rights & Rights.DNS_RGT_COL4) == Rights.DNS_RGT_COL4) str=str+'4'; else str=str+'-';
            callback(stat,str);
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_info');}
        if (typeof e == 'number') callback(e,''); else callback(Status.STD_SYSERR,'');
    })

};

/** Get information of server
 *
 * @param priv
 * @param callback
 */
dns_server_rpc.prototype.dns_stat = function(priv,callback) {
    var self=this;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    var rights = Net.prv_rights(priv);

    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,0,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat==Status.STD_OK) 
              self.release_dir(dir,function (_stat) {
                stat=_stat;
              });
            else
              throw stat;
        },
        function () {
            if (stat != Status.STD_OK) throw stat;
            var str=self.stat();
            callback(stat,str);
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_stat');}
        if (typeof e == 'number') callback(e,''); else callback(Status.STD_SYSERR,'');
    })

};

/** List a directory.  Returns a flattened representation of the number of
 ** columns, the number of rows, the names of the columns, the names of the
 ** rows and the right masks.
 ** Return status,
 **        the number of total rows and columns,
 **        the col names list,
 **        the (dr_name,dr_time,dr_columns) list starting with firstrow.
 * @param priv
 * @param firstrow
 * @param maxrows
 * @param {function((Status.STD_OK|*),number,number,string [], *[])} callback   (stat,nrows,ncols,colnames,rowlist)
 */
dns_server_rpc.prototype.dns_list = function(priv,firstrow,maxrows,callback) {
    var self=this;
    var dir=undefined;
    var stat=Status.STD_UNKNOWN;
    Io.log((log<1)||('Dns_server.dns_list '+Net.Print.private(priv)));
    if (firstrow < 0) {
        callback(Status.STD_ARGBAD,0,0,[],[]);
        return;
    }
    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_READ,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            var i,j;
            if (stat != Status.STD_OK) throw stat;
            var rows = dir.dd_rows;
            var ncols = dir.dd_ncols;
            var nrows = Perv.min(maxrows,dir.dd_nrows-firstrow);
            var list = [];
            for(i=firstrow;i<(firstrow+nrows);i++) {
                var row = dir.dd_rows[i];
                var cols = row.dr_columns;
                if (cols.length == ncols)
                    list.push([row.dr_name,row.dr_time,cols]);
            }
            self.release_dir(dir,function (_stat) {
                callback(_stat,nrows,ncols,dir.dd_colnames,list);
            });
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_list');}
        if (typeof e == 'number') callback(e,0,0,[],[]); else callback(Status.STD_SYSERR,0,0,[],[]);
    })

};

/**
 ** Lookup row names in a set of directories. The 'dirs' argument
 ** is a list of (dir_cs,row name) tuples. Return the resolved rows list with
 ** (status,capability set). Always, in the case of failed partial look-ups, too,
 ** all directory entries must be looked up.
 *
 *
 * @param {private} priv required for authorization only
 * @param {* []} dirs (capset,string) []
 * @param {function((Status.STD_OK|*),* [])} callback
 */
dns_server_rpc.prototype.dns_setlookup = function(priv,dirs,callback) {
    var self=this;
    var stat=Status.STD_UNKNOWN;
    var dir;
    var lookup;
    var skip=false;
    var priv=priv;

    Sch.ScheduleBlock([
        function () {
            self.request_dir(priv,Rights.DNS_RGT_READ,function (_stat,_dir) {
                stat=_stat;
                dir=_dir;
            })
        },
        function () {
            if (stat != Status.STD_OK) throw stat;
            self.release_dir(dir, function (_stat) {
                stat = _stat;
            });
        },
        function () {
            var nrows=dirs.length;
            var list=[];
            var index=0;
            Sch.ScheduleLoop(function() {
                return index<nrows;
            },[
                function () {
                    lookup=dirs[index];
                    var cs=lookup[0];
                    priv = self.check_dir(cs);
                    if (priv != undefined) {
                        self.request_dir(priv,0,function (_stat,_dir) {
                            dir=_dir;
                            stat=_stat;
                        })
                    } else {
                        stat=Status.STD_NOTFOUND;
                        dir=undefined;
                    }
                },
                function () {
                    var i;
                    if(stat==Status.STD_OK) {
                        var name=lookup[1];
                        var row = self.search_row(dir,name);
                        if (row != undefined) {
                            /*
                             ** calculate the rights mask
                             */
                            var colmask = Net.prv_rights(priv);
                            var have_rights = 0;
                            var ncols = dir.dd_ncols;
                            var cols = row.dr_columns;
                            for(i=0;i<ncols;i++) {
                                if ((colmask & Dns.dns_col_bits[i]) == Dns.dns_col_bits[i])
                                    have_rights = have_rights | cols[i];
                            }
                            self.restrict(dir,have_rights,function (_cs) {
                                // Assuming non-blocking---
                                list.push(Status.STD_OK,_cs);
                            });
                        } else
                            list.push(Status.STD_NOTFOUND,undefined);
                        self.release_dir(dir,function (_stat) {
                            stat=_stat;
                        });
                    } else {
                        list.push(stat,undefined);
                    }
                }
            ],[
                function () {
                    callback(Status.STD_OK,list);
                }
            ]);
        }
    ],function (e) {
        if (typeof e != 'number') {Io.printstack(e,'Dns_server_rpc.dns_setlooukp');}
        if (typeof e == 'number') callback(e,[]); else callback(Status.STD_SYSERR,[]);
    })

};

/** DNS Exit Request
 * @param {privat} [priv]
 *
 * @returns {(Status.STD_OK|*)}
 */
dns_server_rpc.prototype.dns_exit =function (priv) {
    var self=this;
    var stat=Status.STD_OK;
    if (priv!=undefined) {
        var obj = Net.prv_number(priv);
        var rights = Net.prv_rights(priv);
        if (obj!=0 || !Net.prv_decode(priv,self.dns_super.dns_checkfield)) return Status.STD_DENIED;
    }
    stat=self.exit();
    return stat;
};

/** DNS Start the RPC server
 *
 * @param {number} index
 * @param {taskscheduler} scheduler
 */
dns_server_rpc.prototype.dns_start_server = function (index,scheduler) {
    var dns = this;
    var server = function () {
        // Server
        var self = this;
        var rpc = dns.rpc;
        var port = dns.dns_super.dns_getport;
        var router = rpc.router;
        var rpcio = router.pkt_get();
        var dying=false;

        this.init = function () {
            Io.out('[DNS'+index+'] Starting RPC Server with public port '+Net.Print.port(dns.dns_super.dns_putport));
            router.add_port(port);
        };

        this.request = function () {
            Io.log((log<10)||('[DNS'+index+'] request'));
            rpcio.init();
            rpcio.operation = Rpc.Operation.GETREQ;
            rpcio.header.h_port = port;
            rpcio.header.h_status=undefined;
            rpcio.header.h_command=undefined;
            rpcio.header.h_priv=undefined;
            rpc.getreq(rpcio);
        };

        this.service = function () {
            var used, i, name, path, cs, rights, ncols, cols, colnames, found, mask, priv;
            var ss,sc,stat,info,size,flag,off,buf;
            buf=Buf.Buffer();
            Io.log((log<1)||('[DNS'+index+'] service: '+Net.Print.header(rpcio.header)));
            assert((rpcio.index!=-1) ||'RPCIO invalid');
            switch (rpcio.header.h_command) {
            /*********************
             ** DNS Calls
             **********************/
                case Command.DNS_APPEND:
                    /*
                     *  ------------
                     *  name:string
                     *  obj:capset
                     *  ncols:number
                     *  cols: rights []
                     *  ------------
                     *  ------------
                     */
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_APPEND ' + Net.Print.private(rpcio.header.h_priv)));
                    name = Buf.buf_get_string(rpcio);
                    cs = Cs.buf_get_capset(rpcio);
                    ncols = Buf.buf_get_int16(rpcio);
                    cols = [];
                    for (i = 0; i < ncols; i++) {
                        cols.push(DnsInt.buf_get_rights(rpcio));
                    }
                    if (log > 0) {
                        Io.inspect(name);
                        Io.inspect(cs);
                        Io.inspect(cols);
                    }
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_append(rpcio.header.h_priv, name, cols, cs, function (_stat) {
                                rpcio.header.h_status = _stat;
                                Buf.buf_init(rpcio);
                                Io.log((log < 1) || ('Dns_srv_rpc.DNS_APPEND returns: ' + Net.Status.print(_stat)));
                            });
                        }]);
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_APPEND passes through'));
                    break;


                case Command.DNS_LOOKUP:
                    Io.log((log < 1) || ('dns_srv_rpc.DNS_LOOKUP ' + Net.Print.private(rpcio.header.h_priv)));
                    path = Buf.buf_get_string(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_lookup(rpcio.header.h_priv, path, function (_stat, _cs, _path) {
                                Io.log((log < 1) || ('Dns_srv_rpc.DNS_LOOKUP returns: ' + Net.Status.print(_stat)));
                                Buf.buf_init(rpcio);
                                if (_stat == Status.STD_OK) {
                                    /*
                                     ** Put the path_rest string and the capability set.
                                     */
                                    Buf.buf_put_string(rpcio, _path);
                                    Cs.buf_put_capset(rpcio, _cs);

                                };
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_LOOKUP passes through'));
                    break;

                case Command.DNS_RENAME:
                    /*
                     *  ------------
                     *  oldname:string
                     *  newname:string
                     *  ------------
                     *  ------------
                     */
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_RENAME ' + Net.Print.private(rpcio.header.h_priv)));
                    name = Buf.buf_get_string(rpcio);
                    var newname = Buf.buf_get_string(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_rename(rpcio.header.h_priv, name, newname, function (_stat) {
                                Buf.buf_init(rpcio);
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.DNS_REPLACE:
                    /*
                     *  ------------
                     *  name:string
                     *  newcs:capset
                     *  ------------
                     *  ------------
                     */
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_REPLACE ' + Net.Print.private(rpcio.header.h_priv)));
                    name = Buf.buf_get_string(rpcio);
                    var newcs = Cs.buf_get_capset(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_replace(rpcio.header.h_priv, name, newcs, function (_stat) {
                                Buf.buf_init(rpcio);
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.DNS_DELETE:
                    /*
                     *  ------------
                     *  rowname:string
                     *  ------------
                     *  ------------
                     */
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_DELETE ' + Net.Print.private(rpcio.header.h_priv)));
                    name = Buf.buf_get_string(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_delete(rpcio.header.h_priv, name, function (_stat) {
                                Buf.buf_init(rpcio);
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.DNS_CREATE:
                    /*
                     *  -----
                     *  ncols(int16)
                     *  [colname(string)] #ncols
                     *  -----
                     *  cs(capset)
                     *  -----
                     */
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_CREATE ' + Net.Print.private(rpcio.header.h_priv)));
                    ncols = Buf.buf_get_int16(rpcio);
                    colnames = [];
                    for (i = 0; i < ncols; i++) {
                        colnames.push(Buf.buf_get_string(rpcio));
                    }
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_create(rpcio.header.h_priv, colnames, function (_stat, _cs) {
                                Buf.buf_init(rpcio);
                                rpcio.header.h_status = _stat;
                                if (_stat == Status.STD_OK) {
                                    Cs.buf_put_capset(rpcio, _cs);
                                }
                            });
                        }]);
                    break;

                case Command.DNS_CHMOD:
                    /*
                     *  -----
                     *  rowname(string)
                     *  ncols(int16)
                     *  cols: rights []
                     *  -----
                     *  -----
                     */
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_CHMOD ' + Net.Print.private(rpcio.header.h_priv)));
                    ncols = Buf.buf_get_int16(rpcio);
                    cols = [];
                    for (i = 0; i < ncols; i++) {
                        cols.push(DnsInt.buf_get_rights(rpcio));
                    }
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_chmod(rpcio.header.h_priv, cols, function (_stat) {
                                Buf.buf_init(rpcio);
                                rpcio.header.h_status = _stat;
                             });
                        }]);
                    break;

                case Command.DNS_LIST:
                    /*
                     *  --------------
                     *  rowoff(int16)
                     * ---------------
                     *  next_row(int16)
                     *  ncols(int16)
                     *  nrows(int16)
                     *  colnames: [name(string)]   #ncols
                     *  rows: [
                     *    name(string)
                     *    time(int32)
                     *    [rights(int16)] #ncols
                     *  ] #nrows
                     *  --------------
                     */
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_LIST ' + Net.Print.private(rpcio.header.h_priv)));
                    off = Buf.buf_get_int16(rpcio);
                    rpcio.pos = 0;
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_list(rpcio.header.h_priv, off, 1000,
                                function (_stat, nrows, ncols, colnames, rows) {
                                    rpcio.header.h_status = _stat;
                                    Buf.buf_init(rpcio);
                                    if (_stat == Status.STD_OK) {
                                        Buf.buf_put_int16(rpcio, DnsInt.DNS_NOMOREROWS);
                                        Buf.buf_put_int16(rpcio, ncols);
                                        Buf.buf_put_int16(rpcio, nrows);
                                        /*
                                         ** Push the column names
                                         */
                                        Array.iter(colnames, function (col) {
                                            Buf.buf_put_string(rpcio, col);
                                        });
                                        /*
                                         ** Assumption: all rows fit in one transaction
                                         */
                                        Io.log((log < 1) || 'dnssrv.DNS_LIST #rows=' +rows.length);
                                        Array.iter(rows, function (row, index) {
                                            Buf.buf_put_string(rpcio, row[0]);
                                            Buf.buf_put_int32(rpcio, row[1]);
                                            Array.iter(row[2], function (col, index) {
                                                DnsInt.buf_put_rights(rpcio, col);
                                            });
                                        });
                                    }
                                });
                        }]);
                    break;

                case Command.DNS_SETLOOKUP:
                    /*
                     *  ------------
                     *  nrows(int16)
                     *  [
                     *    dir(capset)
                     *    name(string)
                     *  ] #nrows
                     *  ------------
                     *  [
                     *    status(int16)
                     *    cs(capset)
                     *  ] #nrows
                     *  ------------
                     */
                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_SETLOOKUP ' + Net.Print.private(rpcio.header.h_priv)));
                    var nrows = Buf.buf_get_int16(rpcio);
                    var dirs=[];
                    for(i=0;i<nrows;i++) {
                        cs=Cs.buf_get_capset(rpcio);
                        name=Buf.buf_get_string(rpcio);
                        dirs.push([cs,name]);
                    }
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_setlookup(rpcio.header.h_priv, dirs, function (_stat, _rows) {
                                rpcio.header.h_status = _stat;
                                Buf.buf_init(rpcio);
                                Array.iter(_rows, function (statcs) {
                                    Buf.buf_put_int16(statcs[0]);
                                    Cs.buf_put_capset(statcs[1]);
                                });
                            })
                        }
                    ]);
                    break;

                case Command.DNS_GETDEFAFS:
                    /*
                     *  -------------
                     *  -------------
                     *  cap(capability)
                     *  -------------
                     */

                    Io.log((log < 1) || ('Dns_srv_rpc.DNS_GETDEFAFS: ' + Net.Print.private(rpcio.header.h_priv)));
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            /*
                             ** Return the default file server capability.
                             */
                            dns.std.std_restrict(dns.dns_super.dns_fs.fs_cap[dns.dns_super.dns_fs.fs_default], Rights.PRV_ALL_RIGHTS,
                                function (_stat, _cap) {
                                    if (_stat == Status.STD_OK) {
                                        Buf.buf_put_cap(rpcio, _cap);
                                    }
                                    rpcio.header.h_status = _stat;
                                });
                        }
                    ]);
                    break;

                 case Command.STD_DESTROY:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_delete_dir(rpcio.header.h_priv, function (_stat) {
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.STD_INFO:
                    /*
                     ** +---
                     *  |===
                     *  | info(string)
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_info(rpcio.header.h_priv, function (_stat, _info) {
                                rpcio.header.h_status = _stat;
                                if (_stat == Status.STD_OK) Buf.buf_put_string(rpcio, _info);
                            });
                        }]);
                    break;

                case Command.STD_STATUS:
                    /*
                     ** +---
                     *  |===
                     *  | info(string)
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_stat(rpcio.header.h_priv, function (_stat, _info) {
                                rpcio.header.h_status = _stat;
                                if (_stat == Status.STD_OK) Buf.buf_put_string(rpcio, _info);
                            });
                        }]);
                    break;

                case Command.STD_TOUCH:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_touch(rpcio.header.h_priv, function (_stat) {
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.STD_AGE:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_age(rpcio.header.h_priv, function (_stat) {
                                rpcio.header.h_status = _stat;
                            });
                        }]);
                    break;

                case Command.STD_RESTRICT:
                    /*
                     *  ----------
                     *  mask (int16)
                     *  ----------
                     *  priv (privat)
                     *  ----------
                     */
                    mask = Buf.buf_get_int16(rpcio);
                    Buf.buf_init(rpcio);
                    Sch.ScheduleBlock([
                        function () {
                            dns.dns_restrict(rpcio.header.h_priv, mask, function (_stat, _priv) {
                                rpcio.header.h_status = _stat;
                                if (_stat == Status.STD_OK) Buf.buf_put_priv(rpcio, _priv);
                            });
                        }]);
                    break;

                case Command.STD_EXIT:
                    /*
                     ** +---
                     *  |===
                     *  +---
                     */
                    Buf.buf_init(rpcio);
                    stat=dns.dns_exit(rpcio.header.h_priv);
                    rpcio.header.h_status=stat;
                    if (stat==Status.STD_OK) dying=true;
                    break;

                default:
                    rpcio.header.h_status=Status.STD_COMBAD;
                    Buf.buf_init(rpcio);
            }

        };

        this.reply = function () {
            Io.log((log<1)||('[DNS'+index+'] reply: '+Net.Print.header(rpcio.header)));
            rpc.putrep(rpcio);
            assert((rpcio.index!=-1) ||'RPCIO invalid');
        };

        this.onexit = function () {
            // TODO exit context?
        };

        this.transitions = function () {
            var trans;
            trans =
                [
                    [undefined, this.init, function (self) {return true}],
                    [this.init, this.request, function (self) {return true}],
                    [this.request, this.service, function (self) {return !self.context.blocked}],
                    [this.service, this.reply, function (self) {return true}],
                    [this.reply, this.request, function (self) {return !dying}],
                    [this.reply, this.onexit, function (self) {return dying}]
                ];
            return trans;
        };
        this.context = Sch.TaskContext('DNS'+index+' '+Net.Print.port(port), self);
    };
    var proc1 = new server();
    scheduler.Add(proc1.context);
};

module.exports = {
    dns_server_rpc:dns_server_rpc
};
