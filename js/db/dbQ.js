/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
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
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     08/05/19 by sbosse.
 **    $VERSION:     1.1.2
 **
 **    $INFO:
 **
 **  Embedded SQL API for AIOS - requires sqlite3.js (Database wrapper) and 
 **  sqlite3C.js (emscripten compiled sqlite3.c) in CURRENT directory 
 **
 **   Synchronous IO 
 **
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var Fs = Require('fs');
var current={};
var Aios=none;
var NL='\n';

var sql = function (path) {
  try { this.sqlite3 = require('./sqlite3') } catch (e) {};
  console.log('[SQL] Database: '+this.sqlite3);
  if (this.sqlite3) this.db = this.sqlite3(path);
  this.id='SQL';
  this.log=function (msg) {
    ((Aios && Aios.print)||Io.log)('[SQL] '+path+': '+msg);
  }
  this.todo=[];
}

sql.prototype.close = function () {
  if (this.db) return this.db.close();
  else return -1;
}

/** Create a generic table
 * 
 *  typeof @header = {} is type and name interface provider for all rows;
 *
 */
sql.prototype.createTable = function (tblname,header,callback) {
  var repl,
      intf='', sep='', self=this;
  if (!this.db || !header) return -1;
  Comp.obj.iter(header,function (attr,key) {
    intf += (sep+key+' '+attr); sep=',';
  });
  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;} 
    else return 1;
  } 
  return this.seq([
    ['exec','drop table if exists '+tblname, done],
    ['exec','create table  '+tblname+' ('+intf+')', done],
  ],callback);  
}

/** Drop table operation
 *
 */
sql.prototype.drop = function (tblname,callback) {
  var repl,self=this,
      line, 
      sep='';
  if (!this.db) return false;
  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;} 
    else return 1;
  } 
  return this.seq([
    ['exec','drop table if exists '+tblname, done]
  ], callback);
}

/** Insert operation
 *
 */
sql.prototype.insert = function (tblname,row,callback) {
  var repl,self=this,
      line='', 
      sep='';
  if (!this.db) return false;
  Comp.array.iter(row,function (col,i) {
    line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';
  });
  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;} 
    else return 1;
  } 
  return this.seq([
    ['exec','insert into  '+tblname+' values ('+line+')', done]
  ], callback);
}

/** Insert a row in a matrix table
 *
 */
sql.prototype.insertMatrix = function (matname,row,callback) {
  var repl,self=this,
      line='', 
      sep='';
  if (!this.db) return false;
  Comp.array.iter(row,function (col,i) {
    line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';
  });
  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;} 
    else return 1;
  } 
  return this.seq([
    ['exec','insert into  '+matname+' values ('+line+')', done]
  ], callback);
}

sql.prototype.insertTable = sql.prototype.insert;

sql.prototype.open = function () {
  if (this.db) return this.db.open();
  else return -1;
}

/** Read a matrix
 *
 */
sql.prototype.readMatrix = function (matname,callback) {
  var mat=[],self=this;
  
  if (!this.db) return false;
  
  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;}
    if (repl.result) {
      mat=repl.result.map(function (row) {
        var cols=[];
        for(var p in row) cols.push(Number(row[p]));
        return cols;
      })
    }
    return 1;
  } 
  
  this.seq([
    ['exec','select * from '+matname,done],
  ], callback?function (res) { if (res) callback(mat); else callback(none);}:undefined);
  if (callback) return; else return mat;
}

sql.prototype.readTable = function (tblname,callback) {
  var tbl=[],self=this;
  
  if (!this.db) return false;
  
  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;}
    if (repl.result) {
      tbl=repl.result.map(function (row) {
        var cols=[];
        for(var p in row) cols.push(Number(row[p]));
        return cols;
      })
    }
    return 1;
  } 
  
  this.seq([
    ['exec','select * from '+tblname, done],
  ], callback?function (res) { if (res) callback(tbl); else callback(none);}:undefined);
  if (callback) return; else return tbl;
}

/** SELECT operation
 * tbl: string
 * vars?: string | string []
 * cond: string | undefined
 * callback: function (result)
 *
 */
sql.prototype.select = function (tblname,vars,cond,callback) {
  var self=this,result;
  if (!this.db) return false;

  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;}
    if (repl.result) result=repl.result;
    return 1;
  } 
  if (vars==undefined) vars='*';
  return this.seq([
    ['exec',Comp.printf.sprintf('select %s from %s%s',
                                Comp.obj.isArray(vars)?Comp.printf.list(vars):vars,
                                tblname,
                                cond?(' WHERE '+cond):''),done]
  ], callback?function (res) { if (res) callback(result); else callback(none);}:undefined);
  if (callback) return; else return result;
}


/** Execute an SQL operation sequence 
 ** todo format: [op: string,
 **               args?: string,
 **               result: function returning number (0: break (error), 1: next, -1:loop)]
 ** callback: function () -> status 
 */
sql.prototype.seq = function (todo,callback) {
  var l=todo,self=this,status,res,
      next;
  if (callback) { // Async non.block.
    function Todo() {
      if (self.todo.length>0) {
        var f = Comp.array.head(self.todo);
        self.error=undefined;
        f(_,function () {
          self.todo = Comp.array.tail(self.todo);
          Todo();    
        });
      }    
    }
    next=function (loop,finalize) {
      var hd,repl;
      if (l.length==0 && !loop) { callback(status); if (finalize) finalize() }
      else {
        if (!loop) { 
          hd= Comp.array.head(l);
          l = Comp.array.tail(l);
        } else hd=loop;
        switch (hd[0]) {
          case 'exec':
            repl=self.db.exec(hd[1])
            status=hd[2](repl); 
            if (status==1) next(_,finalize); 
            else if (status==-1) next(hd,finalize); 
            else callback(status);
            break;
        }
      }
    }
    self.todo.push(next);
    if (self.todo.length==1) Todo();
    return;
  } else { // Sync block.
    next=function (loop) {
      if (l.length==0 && !loop) return status;
      else {
        if (!loop) { 
          hd= Comp.array.head(l);
          l = Comp.array.tail(l);
        } else hd=loop;
        switch (hd[0]) {
          case 'exec':
            res=self.db.exec(hd[1]);
            status=hd[2](res);
            if (status==1) return next(); 
            else if (status==-1) return next(hd); 
            else return status;
            break;
        }
      }
    }
    return next();  
  }
};

/** Write matrix values
 *
 */
sql.prototype.writeMatrix = function (matname,matrix,callback) {
  var repl, line='', seq=[], self=this,
      intf='', sep='', i=0, row;
      
  if (!this.db) return false;
  if (matrix.length==0) return false;
  
  row=matrix[0];
  Comp.array.iter(row,function (col,i) {
    intf += sep+'c'+(i+1)+(Comp.obj.isNumber(col)?' integer':' varchar(32)'); sep=',';
  });
  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;} 
    else return 1;
  } 
  seq=[
      ['exec','drop table if exists '+matname, done],
      ['exec','create table  '+matname+' ('+intf+')', done]
  ];
  for(i=0;i<matrix.length;i++) {
    row=matrix[i];
    line='',sep='';
    Comp.array.iter(row,function (col,i) {
      line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';
    });
    seq.push(['exec','insert into  '+matname+' values ('+line+')',done])
  }
  return this.seq(seq,callback);
}

/** Write table values
 *
 */
sql.prototype.writeTable = function (tblname,header,table,callback) {
  var repl, line='', seq=[], self=this,
      intf='', sep='', i=0, row;
      
  if (!this.db) return false;
  
  row=table[0];
  Comp.obj.iter(row,function (val,key) {
    intf += sep+'c'+(i+1)+(Comp.obj.isNumber(val)?' integer':' varchar(32)'); sep=',';
  });
  function done(repl) {
    if (!repl || !repl.ok) {self.error=repl.code;return 0;} 
    else return 1;
  } 
  seq=[
      ['exec','drop table if exists '+tblname, done],
      ['exec','create table  '+tblname+' ('+intf+')', done]
  ];
  for(i=0;i<table.length;i++) {
    row=table[i];
    line='',sep='';
    Comp.obj.iter(row,function (val,key) {
      line += sep+(Comp.obj.isNumber(val)?int(val):"'"+val+"'"); sep=',';
    });
    seq.push(['exec','insert into  '+tblname+' values ('+line+')',done])
  }
  return this.seq(seq,callback);
}

var Sql = function (path) {
  var obj = new sql(path);  
  return obj;
};

module.exports = {
  current:function (module) { current=module.current; Aios=module; },
  Sql:Sql
};
