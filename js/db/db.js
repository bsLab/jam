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
 **    $INITIAL:     (C) 2006-2018 bLAB
 **    $CREATED:     09/02/16 by sbosse.
 **    $VERSION:     1.6.3
 **
 **    $INFO:
 **
 **  JavaScript AIOS: SQL Service API 
 **     
 **   Sqlc: SQLD Database Client Module using named FIFO pipes OR built-in SQL server (see below)
 **
 **     path_in: the write to SQLD channel (SQLD input)
 **     path_out: the read from SQLD channel (SQLD output)
 **
 **
 **   Sqld: SQL Database Server Module (and client interface) 
 **   -------------------------------------------------------
 **
 **     Using built-in sqlite3 module accessing a database file (jx: embedded, node.js: native module)
 **
 **   Example:
 **
 **   db = sql('/var/db/sensors.sql',{mode:'r+'}); // or in memory
 **   db = sql(':memory:',{mode:'r+'})
 **
 **   db.init();
 **   db.createTable('sensors',{name:'',value:0, unit:''});
 **   db.insertTable('sensors',{name:'current',value:1.0, unit:'A'});
 **   db.insertTable('sensors',{name:'voltage',value:12.1, unit:'V'});
 **   db.readTable('sensors',function (res) {
 **     print('callback',res);
 **   });
 **   print(db.readTable('sensors'));
 **   print(db.select('sensors','*'));
 **   print('finished')
 **
 **   Synchronous Version (using blocking IO, readFileSync)
 **
 ** TODO: Merge with dbS!!!!!
 ** Options: Sync/Async/Server ...
 **
 **    $ENDOFINFO
 */
var Io = Require('com/io');
var Comp = Require('com/compat');
var Fs = Require('fs');
var current={};
var Aios=none;
var NL='\n';

var options = {
  version:'1.6.3'
}

function await() {
  if (jxcore) jxcore.utils.jump();
}

function wakeup() {
  if (jxcore) jxcore.utils.continue();
}

function exists(path) {
  try {
    var fd=Fs.openSync(path,'r');
    Fs.close(fd);
    return true;
  } catch (e) { return false }
}

/* Some hacks for wine/win32 node.js/nw.js */
var Buffer = require('buffer').Buffer;

function tryReadSync(fd, buffer, pos, len) {
  var threw = true;
  var bytesRead;
  try {
    bytesRead = Fs.readSync(fd, buffer, pos, len);
    threw = false;
  } finally {
    if (threw) fs.closeSync(fd);
  }
  return bytesRead;
}

function readFileSync(path,encoding) {
  var fd = Fs.openSync(path, 'r', 666),
      bytesRead,buffer,pos=0,
      buffers=[];
  
  do {
    buffer = Buffer(8192);
    bytesRead = tryReadSync(fd, buffer, 0, 8192);
    if (bytesRead !== 0) {
      buffers.push(buffer.slice(0, bytesRead));
    }
    pos += bytesRead;
  } while (bytesRead !== 0);
  
  Fs.closeSync(fd);
  buffer = Buffer.concat(buffers, pos);
  
  if (encoding) buffer = buffer.toString(encoding);
  return buffer;
}

function sleep(time) {
  var stop = new Date().getTime();
  while(new Date().getTime() < stop + time) {
      ;
  }
}

function writeSync(path,str) {
  var n=0;
  var fd = Fs.openSync(path,'r+');
  n=Fs.writeSync(fd, str);
  Fs.closeSync(fd);
  return n;
}

/******************* SQLC ************************/

var sqlc = function (path,chan) {
  this.path=path;
  // Client -> Server
  this.input=none;
  // Server -> Client
  this.output=none;
  this.chan=chan;
  this.id='SQLC';
  this.log=function (msg) {
    ((Aios && Aios.print)||Io.log)('[SQLC] '+msg);
  }
  this.todo=[];
}

/** Return string list of comma seperated value list
 * + Strip string delimeters ''
 *
 */
sqlc.prototype.args = function (msg) {
  var args=Comp.string.split(',',msg);
  return Comp.array.filtermap(args, function (arg) {
    if (arg=='') return none;
    else if (Comp.string.get(arg,0)=="'") return Comp.string.trim(arg,1,1);
    else return arg;
  });
};

/** Create a numeric matrix
 * 
 *  typeof @header = * [] is type interface provider for all rows;
 *
 */

sqlc.prototype.createMatrix = function (matname,header,callback) {
  var repl,
      intf='', line='', sep='', self=this;
  if (!this.connected) return callback?callback(false):false;
  if (header.length==0) return false;
  Comp.array.iter(header,function (col,i) {
    intf += (sep+'c'+(i+1)+(Comp.obj.isNumber(col)?' integer':' varchar(32)')); sep=',';
  });
  sep='';
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {current.error=repl;return 0;} 
    else return 1;
  } 
  return this.seq([
    ['exec','drop table if exists '+matname, done],
    ['exec','create table  '+matname+' ('+intf+')', done]
  ],callback);

}

/** Create a generic table
 * 
 *  typeof @header = {} is type and name interface provider for all rows;
 *
 */
sqlc.prototype.createTable = function (tabname,header,callback) {
  var repl,
      intf='', sep='', self=this;
  if (!this.connected) return callback?callback(false):false;
  // if (header.length==0) return false;
  Comp.obj.iter(header,function (attr,key) {
    intf += (sep+key+(Comp.obj.isNumber(attr)?' integer':' varchar(32)')); sep=',';
  });
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {current.error=repl;return 0;} 
    else return 1;
  } 
  return this.seq([
    ['exec','drop table if exists '+tabname, done],
    ['exec','create table  '+tabname+' ('+intf+')', done],
  ],callback);  
}


/** Check end message
 *
 */
sqlc.prototype.end = function (msg) { return msg.indexOf('END') == 0 }
/** Check error message
 *
 */
sqlc.prototype.err = function (msg) {
  if (!msg) return false; 
  if (Comp.obj.isObject(msg)) return msg.errno != undefined;
  if (Comp.obj.isString(msg)) return msg.indexOf('ERR') == 0 || msg.indexOf('Error') == 0;
  return false;
}


/** Execute: send a request and wait for reply.
 */
sqlc.prototype.exec = function (cmd,callback) {
  var n,str='',fd;
  if (!this.connected) return callback?callback(none):none;
  n = Fs.writeSync(this.input,cmd+NL);
  if (n<=0) {
    if (callback) { callback(none); return;}
    else return none;
  }
  str = readFileSync(this.output,'utf8');
  if (callback) callback(str?Comp.array.filter(Comp.string.split('\n',str),function(line) {return line!=''}):none);
  else return str?Comp.array.filter(Comp.string.split('\n',str),function(line) {return line!=''}):none;
};

/** GET ROW operation
 * @fmt: {}|none 
 * @callback: function () -> string [] | * [] | none
 *
 */
sqlc.prototype.get = function (fmt,callback) {
  var row,self=this,repl;
  if (!this.connected) return callback?callback(none):none;
  function done(_repl) {
    repl=_repl?_repl[0]:none;
    if (!repl || self.err(repl)) {current.error=repl; row=none; return 0;} 
    else return 1;
  } 
  this.seq([
    ['exec','get row',function (_repl) {
      var cols,i,p;
      if (!row) row=[];
      if (done(_repl) && !self.end(repl)) {
          repl=Comp.string.replace_all('\n','',repl);
          cols=Comp.string.split(',',repl);
          if (fmt) {
            i=0;row=[];
            for(p in fmt) {
              switch (fmt[p]) {
                case 'string':
                  row.push(cols[i]);
                  break;
                case 'number':
                  row.push(Number(cols[i]));
                  break;
                default:
                  row.push(cols[i]);                                    
              }
              i++;
            }
          } else row=cols;
      } 
      return 1;
    }]
  ], callback?function (res) { if (res) callback(row); else callback(none);}:wakeup);
  if (callback) return; else if (row) return row; else { await(); return row }
 
}

sqlc.prototype.getError = function () { var err=current.error; current.error=undefined; return current.error || 'OK'}


/** Setup client-server connection.
 *  Only the input stream is opened (used for sending data to the SQLD server).
 *
 */
sqlc.prototype.init = function (callback) {
  var path_in  = Comp.printf.sprintf("%sI%s%d",this.path,this.chan<10?'0':'',this.chan),
      path_out = Comp.printf.sprintf("%sO%s%d",this.path,this.chan<10?'0':'',this.chan),
      stat,repl,self=this;
  this.id = Comp.printf.sprintf("[SQLC%s%d]",this.chan<10?'0':'',this.chan); 
  this.log (Comp.printf.sprintf("%s Connecting to server channel %s...",
                                this.id,path_in));
  if (!exists(path_in) || !exists(path_out)) {
    this.log (Comp.printf.sprintf("%s Connecting to server channel %s failed: %s",
                                    this.id,path_in,'No such file(s)'));
    if (callback) {callback(false); return;}
    else return false;
  }
  
  try {
    this.input  = Fs.openSync(path_in,'r+');
  } catch (e) {
    this.log (Comp.printf.sprintf("%s Connecting to server channel %s failed: %s",
                                  this.id,path_in,e));
    if (callback) {callback(false); return;} else return false;
  }
  
  // this.input  = path_in;
  this.output = path_out; 
  this.connected = true;
  return this.seq([
      ['set','nl',function (repl) {return (repl && !self.err(repl[0]))}],
      ['set','csv',function (repl) {return (repl && !self.err(repl[0]))}]      
    ], callback);
}

/** Insert operation
 *
 */
sqlc.prototype.insert = function (tbl,row,callback) {
  var repl,
      line='', 
      sep='',
      self=this;
  if (!this.connected) return callback?callback(false):false;
  if (Comp.obj.isArray(row))
    Comp.array.iter(row,function (col,i) {line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';});
  else if (Comp.obj.isObject(row))
    Comp.obj.iter(row,function (attr,key) {line += sep+(Comp.obj.isNumber(attr)?int(attr):"'"+attr+"'"); sep=',';});
  else 
    throw 'sql.insert: row neither array nor object!';

  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {current.error=repl;return 0;} 
    else return 1;
  } 
  return this.seq([
    ['exec','insert into  '+tbl+' values ('+line+')', done]
  ], callback);
}

/** Insert a matrix row 
 *
 */
sqlc.prototype.insertMatrix = function (matname,row,callback) {
  var repl,
      line='', 
      sep='',
      self=this;
  if (this.connected) return callback?callback(false):false;
  Comp.array.iter(row,function (col,i) {line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';});
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {current.error=repl;return 0;} 
    else return 1;
  } 
  return this.seq([
    ['exec','insert into  '+matname+' values ('+line+')', done]
  ], callback);
}

sqlc.prototype.insertTable = sqlc.prototype.insert;

/** Read a matrix; return [][]
 *
 */
sqlc.prototype.readMatrix = function (matname,callback) {
  var mat,repl,cols, self=this;
  if (!this.connected) return callback?callback(none):none;
  
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {current.error=repl; mat=none; return 0;} 
    else return 1;
  } 
  function doneSelect(_repl,_rows) {
    repl=_repl[0];
    if (_rows) { mat=_rows; return 2 };   // Maybe we got already all rows?
    if (!repl || self.err(repl)) {current.error=repl; tbl=none; return 0;} 
    else return 1;
  } 
  
  this.seq([
    ['exec','select * from '+matname,doneSelect],
    ['exec','get row',function (_repl) {
      if (done(_repl)) {
        if (!mat) mat=[];
        if (rows) { print('done'); mat=rows; return true /* all done */ };
        if (!self.end(repl)) {
          cols=_;
          if (typeof repl == 'string') {
            repl=Comp.string.replace_all('\n','',repl);
            var cols=Comp.array.map(Comp.string.split(',',repl),function (col) {
              return Number(col);
            });
          } else if (Comp.obj.isArray(repl)) {
            // Array
            cols=repl; // !!! 
          }
          mat.push(cols);
          return -1;
        } else return 1;
      } else return 0;
    }]
  ], callback?function (res) { if (res) callback(mat); else callback(none);}:wakeup);
  if (callback) return; else if (mat) return mat; else { await(); return mat };
}


/** Read a generic table; return {}[]
 *
 */
sqlc.prototype.readTable = function (tblname,callback) {
  var tbl,intf=[],repl,cols, self=this;
  if (!this.connected) return callback?callback(none):none;
  
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {current.error=repl; tbl=none; return false;} 
    else return true;
  } 
  function doneSelect(_repl,_rows) {
    repl=_repl[0];
    // Maybe we got already all rows?
    if (_rows) { tbl=_rows; return 2}; 
    if (!repl || self.err(repl)) {current.error=repl; tbl=none; return 0;} 
    else return 1;
  } 
  
  this.seq([
    // TODO: Check SQLC API; this is only valid for SQLD!
    ['get',"select * from sqlite_master where type='table' and name='"+tblname+"'",function (_repl) {
      var tokens;
      if (done(_repl)) {
        if (repl.sql) {
          tokens=repl.sql.match(/\((.+)\)/)[1].split(',');
          tokens.forEach(function (token) { 
            var cols=token.split(' ');
            if (cols.length==2) {
              intf.push({tag:cols[0],type:self.sqlType2native(cols[1])});
            } else intf.push(null);
          });
          return !Comp.obj.isEmpty(intf)?1:0;
        }
      } else return 0;
    }],
    ['exec','select * from '+tblname,doneSelect],
    ['exec','get row',function (_repl) {
      var o={};
      if (!tbl) tbl=[];
      if (done(_repl)) {
        if (!self.end(repl)) {
          cols=_;
          if (typeof repl == 'string') {
            repl=Comp.string.replace_all('\n','',repl);
            repl.split(',').forEach(function (e,i) {
              var io=intf[i];
              if (io) o[io.tag]=io.type=='number'?Number(e):e;
            });
          } else if (Comp.obj.isArray(repl)) {
            // Array
            repl.forEach(function (e,i) {
              var io=intf[i];
              if (io) o(io.tag)=io.type=='number'?Number(e):e;
            });
          }
          
          tbl.push(o);
          return -1;
        } else return 1;
      } else return 0;
    }]
  ], callback?function (res) { if (res) callback(tbl); else callback(none);}:wakeup);
  if (callback) return; else if (tbl) return tbl; else { await(); return tbl }
}


/** SELECT operation
 * tbl: string
 * vars?: string | string []
 * cond: string
 * callback: function () -> status string
 *
 */
sqlc.prototype.select = function (tbl,vars,cond,callback) {
  var self=this,repl,stat;
  function done(_repl) {
    repl=_repl?_repl[0]:none;
    if (!repl || self.err(repl)) {current.error=repl; return 0;} 
    else return 1;
  } 
  if (vars==undefined) vars='*';
  stat = this.seq([
    ['exec',Comp.printf.sprintf('select %s from %s%s',
                                Comp.obj.isArray(vars)?Comp.printf.list(vars):vars,
                                tbl,
                                cond?(' '+cond):''),done]
    ],callback?callback:wakeup);
  if (!callback) await();
  return stat;
}

/** Execute a SQL operation sequence 
 ** todo format: [op: string,
 **               args?: string,
 **               result: function returning boolean (false: break (error), true: next, _:loop)]
 ** callback: function () -> status 
 */
sqlc.prototype.seq = function (todo,callback) {
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
      if (l.length==0 && !loop) { callback(status); if (finalize) finalize() }
      else {
        var hd;
        if (!loop) { 
          hd= Comp.array.head(l);
          l = Comp.array.tail(l);
        } else hd=loop;
        switch (hd[0]) {
          case 'set':
            self.set(hd[1],function (repl) {
              status=hd[2](repl); 
              if (status==1) next(_,finalize); else callback(status);
            });
            break;
          case 'exec':
            self.exec(hd[1],function (repl) {
              status=hd[2](repl); 
              if (status==1) next(_,finalize); 
              else if (status==-1) next(hd,finalize); 
              else callback(status);
            });
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
          case 'set':
            status=self.set(hd[1]);
            if (status==1) next(); else return status;  
            break;
          case 'exec':
            res=self.exec(hd[1]);
            status=hd[2](res);
            if (status==1) next(); else if (status==-1) next(hd); else return status;
            break;
        }
      }
    }
    return next();  
  }
};

/** Set a SQLD flag (nl,csv,..). 
 *
 */
sqlc.prototype.set = function (flag,callback) {
  var n,fd,str='';
  if (!this.connected) return callback?callback(false):false;
  n=Fs.writeSync(this.input, 'set '+flag);
  if (n<=0) {
    if (callback) { callback(none); return;}
    else return none;
  }
  str = readFileSync(this.output,'utf8');
  if (callback) callback(str?Comp.array.filter(Comp.string.split('\n',str),function(line) {return line!=''}):none);
  else return str?Comp.array.filter(Comp.string.split('\n',str),function(line) {return line!=''}):none;
};

sqlc.prototype.sqlType2native = function (str) {
  if (str=='integer') return 'number';
  if (str.indexOf('varchar')==0) return 'string';
} 

/** Write a matrix [][] (create + insert values)
 *
 */
sqlc.prototype.writeMatrix = function (matname,matrix,callback) {
  var repl, line='', self=this,
      intf='', sep='', i=0, row;
  if (!this.connected) return callback?callback(false):false;
  if (matrix.length==0) return false;
  Comp.array.iter(matrix[0],function (col,i) {
    intf += sep+'c'+(i+1)+(Comp.obj.isNumber(col)?' integer':' varchar(32)'); sep=',';
  });
  row=matrix[0];
  Comp.array.iter(row,function (col,i) {
    line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';
  });
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {current.error=repl;return 0;} 
    else return 1;
  } 
  seq=[
      ['exec','drop table if exists '+matname,done],
      ['exec','create table  '+matname+' ('+intf+')',done]
  ];
  for(i=0;i<matrix.length;i++) {
    row=matrix[i];
    line='',sep='';
    Comp.array.iter(row,function (col,i) {
      line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';
    });
    seq.push(['exec','insert into  '+matname+' values ('+line+')',done]);
  }
  return this.seq(seq,callback);
}

/** Write a table {}[] (create + insert values)
 *
 */
sqlc.prototype.writeTable = function (tblname,tbl,callback) {
  var repl, line='', self=this,
      intf='', sep='', i=0, row;
  if (!this.connected) return callback?callback(false):false;
  if (matrix.length==0) return false;
  Comp.obj.iter(tbl[0],function (attr,key) {
    intf += sep+key+(Comp.obj.isNumber(attr)?' integer':' varchar(32)'); sep=',';
  });
  row=matrix[0];
  Comp.obj.iter(row,function (attr,key) {
    line += sep+(Comp.obj.isNumber(attr)?int(attr):"'"+attr+"'"); sep=',';
  });
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {current.error=repl;return 0;} 
    else return 1;
  } 
  seq=[
      ['exec','drop table if exists '+tblname,done],
      ['exec','create table  '+tblname+' ('+intf+')',done]
  ];
  for(i=0;i<matrix.length;i++) {
    row=tbl[i];
    line='',sep='';
    Comp.array.iter(row,function (col,i) {
      line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';
    });
    seq.push(['exec','insert into  '+tblname+' values ('+line+')',done]);
  }
  return this.seq(seq,callback);
}


sqlc.prototype.setLog = function (f) {
  this.log=f;
}

var Sqlc = function (path,chan) {
  var obj = new sqlc(path,chan);  
  return obj;
};


/******************* SQLD ************************/
var sqld = function (file,options) {
  this.file=file||':memory:';
  this.options=options||{};
  this.id='SQLD';
  this.todo=[];
  
  this.log=function (msg) {
    ((Aios && Aios.print)||Io.log)('[SQLD] '+msg);
  }
  try {
    // Bulit-in SQL3 server module?
    this.sqlite3=require('sqlite3');
  } catch (e) {
    throw e;
  }
  if (this.options.mode == 'r+')
    this.mode = this.sqlite3.OPEN_READWRITE;
  else if (this.options.mode == 'w+')
    this.mode = this.sqlite3.OPEN_READWRITE | this.sqlite3.OPEN_CREATE;
  else 
    this.mode = this.sqlite3.OPEN_READONLY
}

/** Create a generic table
 * 
 *  typeof @header = {} is type and name interface for all rows;
 *
 */
sqld.prototype.createTable = sqlc.prototype.createTable;

/** Check end message
 *
 */
sqld.prototype.end = sqlc.prototype.end;

/** Check error message
 *
 */
sqld.prototype.err = sqlc.prototype.err;

sqld.prototype.getError = sqlc.prototype.getError;

/** Initialize and create DB instance
 *
 */
sqld.prototype.init = function () {
  this.db = new this.sqlite3.Database(this.file,this.mode);
  this.db.serialize();
  this.log('Opened DB '+this.file+' in mode '+(this.mode & this.sqlite3.OPEN_READWRITE?'RW':'R')+
                                              (this.mode & this.sqlite3.OPEN_CREATE?'C':''));
  this.connected = true;
}

sqld.prototype.insertMatrix = sqlc.prototype.insertMatrix;
sqld.prototype.insertTable = sqlc.prototype.insert;

/** Read a matrix; return number [][]
 *
 * method (matname:string,callback:function)
 *
 */
sqld.prototype.readMatrix = sqlc.prototype.readMatrix;
/** Read a generic table; return {}[]
 *
 */

sqld.prototype.readTable = sqlc.prototype.readTable;

/** Execute a SQL operation sequence 
 ** todo format: [op: string,
 **               args?: string,
 **               result: function returning boolean (false: break (error), true: next, _:loop)]
 ** callback: function () -> status 
 */
sqld.prototype.seq = function (todo,callback) {
  var l=todo,self=this,status,res,row,rows,cols,
      next;
  if (callback) { // Async non.block.
    function Todo() {
      if (self.todo.length>0) {
        var f = Comp.array.head(self.todo);
        f(_,function () {
          self.todo = Comp.array.tail(self.todo);
          Todo();    
        });
      }    
    }
    next=function (loop,finalize) {
      var p;
      if (l.length==0 && !loop) { callback(status); if (finalize) finalize()}
      else {
        var hd;
        if (!loop) { 
          hd= l.shift();
        } else hd=loop;
        switch (hd[0]) {
          case 'exec':
            if (hd[1]=='get row') {
              if (rows && rows.length) {
                row=rows.shift();
                cols=[];
                for(p in row) cols.push(row[p]);
                status=hd[2]([cols.join(',')]);
              } else status=hd[2](['END']);
              if (status==1) next(_,finalize); 
              else if (status==-1) next(hd,finalize);
              else callback(status);
            } else if (hd[1].indexOf('select') == 0) {
              self.db.all(hd[1],[],function (repl,_rows) {
                rows=_rows;
                if (repl!=null && !Comp.obj.isArray(repl)) repl=[repl];
                if (repl==null) repl=['OK'];
                status=hd[2](repl,_rows);
                if (status==1) next(_,finalize); 
                else if (status==-1) next(hd,finalize);
                else if (status==2) { l=[]; next(_,finalize) }
                else callback(status);
              });
            
            } else {
              self.db.run(hd[1],[],function (repl) {
                rows=_rows;
                if (repl!=null && !Comp.obj.isArray(repl)) repl=[repl];
                if (repl==null) repl=['OK'];
                status=hd[2](repl); 
                if (status==1) next(_,finalize); 
                else if (status==-1) next(hd,finalize); 
                else if (status==2) { l=[]; next(_,finalize) }
                else callback(status);
              });
            }
            break;
          case 'get':
            self.db.get(hd[1], function (err, table) {
                var repl;
                if (err) repl=[err];
                else repl=[table];
                status=hd[2](repl); 
                if (status==1) next(_,finalize); 
                else if (status==-1) next(hd,finalize); 
                else callback(status);
              
            });
            break;
        }
      }
    }
    self.todo.push(next);
    if (self.todo.length==1) Todo();
    return;
  } else { // Sync block., limited usability
    next=function (loop) {
      if (l.length==0 && !loop) return status;
      else {
        if (!loop) { 
          hd=l.shift();
        } else hd=loop;
        switch (hd[0]) {
          case 'exec':
            // w/o callback we get no status immediately! 
            res='OK';
            self.db.run(hd[1], function (err) {
              if (err) self.log(err)
            });
            status=hd[2](res);
            if (status==1) return next(); 
            else if (status==-1) return next(hd); 
            else if (status==2) { l=[]; next() }
            else return status;
            break;
        }
      }
    }
    return next();  
  }
};

/** SELECT operation returning rows (implicit GET ROW)!!!!
 * tbl: string
 * vars?: string | string []
 * cond: string
 * callback: function () -> status string
 *
 */
sqld.prototype.select = function (tbl,vars,cond,callback) {
  var self=this,repl,stat,rows;
  function done(_repl,_rows) {
    repl=_repl?_repl[0]:none;
    rows=_rows;
    if (!repl || self.err(repl)) {current.error=repl; return 0;} 
    else return 1;
  } 
  if (vars==undefined) vars='*';
  stat = this.seq([
    ['exec',Comp.printf.sprintf('select %s from %s%s',
                                Comp.obj.isArray(vars)?Comp.printf.list(vars):vars,
                                tbl,
                                cond?(' '+cond):''),done]
    ],callback?callback:wakeup);
  if (!callback) await();
  return rows||stat;
}


sqld.prototype.sqlType2native = sqlc.prototype.sqlType2native;

/** Write a matrix [][] (create + insert values)
 *
 */
sqld.prototype.writeMatrix = sqlc.prototype.writeMatrix;

var Sqld = function (file,options) {
  var obj = new sqld(file,options);  
  return obj;
};


module.exports = {
  current:function (module) { current=module.current; Aios=module; },
  Sqlc:Sqlc,
  Sqld:Sqld
};
