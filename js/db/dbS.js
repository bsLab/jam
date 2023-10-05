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
 **    $INITIAL:     (C) 2006-2017 bLAB
 **    $CREATED:     09/02/16 by sbosse.
 **    $VERSION:     1.4.2
 **
 **    $INFO:
 **
 **  JavaScript AIOS: SQLD Database Client Module using named FIFO pipes
 **
 **    path_in: the write to SQLD channel (SQLD input)
 **    path_out: the read from SQLD channel (SQLD output)
 **
 **
 **   Asynchronous (using non-blocking Stream IO)
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

function exists(path) {
  try {
    var fd=Fs.openSync(path,'r');
    Fs.close(fd);
    return true;
  } catch (e) { return false }
}


var sqlc = function (path,chan) {
  this.path=path;
  // Client -> Server
  this.input=none;
  // Server -> Client
  this.output=none;
  this.chan=chan;
  this.id='SQLC';
  this.log=function (msg) {Io.log('[DB] '+msg)};
  this.todo=[];
  this.error=undefined;
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
/** Close all streams
 *
 */
sqlc.prototype.close = function () {
  if (this.input) this.input.end('set close');
  this.input=none;
  this.output=none;
}

/** Create a matrix
 *
 * 
 *
 */

sqlc.prototype.createMatrix = function (matname,header,callback) {
  var repl,self=this,
      intf='', sep='';
  if (this.input==undefined || this.output==undefined) return false;
  if (header.length==0) return false;
  Comp.array.iter(header,function (col,i) {
    var tokens = Comp.obj.isNumber(col)?[col]:col.split(':'),
        name=tokens[0],typ=tokens[1];
    if (Comp.obj.isNumber(name)) intf = intf + sep + 'c'+col+(typ?typ:'integer');
    else  intf += sep+name+' '+(typ?typ:' varchar(32)');
    sep=',';
  });
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {self.error=repl;return false;} 
    else return true;
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
sqlc.prototype.createTable = function (matname,header,callback) {
  var repl,
      intf='', sep='', self=this;
  if (this.input==undefined || this.output==undefined) return false;
  if (header.length==0) return false;
  Comp.obj.iter(header,function (attr,key) {
    intf += (sep+key+(Comp.obj.isNumber(attr)?' integer':' varchar(32)')); sep=',';
  });
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {self.error=repl;return false;} 
    else return true;
  } 
  return this.seq([
    ['exec','drop table if exists '+matname, done],
    ['exec','create table  '+matname+' ('+intf+')', done],
  ],callback);  
}

/** Drop table operation
 *
 */
sqlc.prototype.drop = function (tbl,callback) {
  var repl,self=this,
      line, 
      sep='';
  if (this.input==undefined || this.output==undefined) return false;
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {self.error=repl;return false;} 
    else return true;
  } 
  return this.seq([
    ['exec','drop table if exists '+tbl, done]
  ], callback);
}

/** Check end message
 *
 */
sqlc.prototype.end = function (msg) { return msg.indexOf('END') == 0 }
/** Check error message
 *
 */
sqlc.prototype.err = function (msg) { return msg.indexOf('ERR') == 0 || msg.indexOf('Error') == 0}

/** Execute: send a request and wait for reply.
 */
sqlc.prototype.exec = function (cmd,callback) {
  var n,str='',fd;
  if (this.input==undefined || this.output==undefined) return none;
  this.callback=callback;
  this.input.write(cmd+NL,'utf8',function (){
  });
};

/** GET ROW operation
 * fmt: object 
 * callback: function () -> string [] | * [] | none
 *
 */
sqlc.prototype.get = function (fmt,callback) {
  var row,self=this,repl;
  function done(_repl) {
    repl=_repl?_repl[0]:none;
    if (!repl || self.err(repl)) {self.error=repl; row=none; return false;} 
    else return true;
  } 
  this.seq([
    ['exec','get row',function (_repl) {
      var cols,i,p;
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
      return true;
    }]
  ], callback?function (res) { if (res) callback(row); else callback(none);}:undefined);
  if (callback) return; else return row;
 
}

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
    this.input  = Fs.createWriteStream(path_in);
  } catch (e) {
    this.log (Comp.printf.sprintf("%s Connecting to server channel %s failed: %s",
                                  this.id,path_in,e));
    if (callback) callback(false); return;
  }
  this.output = path_out;
  this.callback=none;
  
  return this.seq([
      ['open',function (repl) {return (repl && !self.err(repl[0]))}],
      ['set','nl',function (repl) {return (repl && !self.err(repl[0]))}],
      ['set','csv',function (repl) {return (repl && !self.err(repl[0]))}]      
    ], callback);
}
/** Insert operation
 *
 */
sqlc.prototype.insert = function (tbl,row,callback) {
  var repl,self=this,
      line='', 
      sep='';
  if (this.input==undefined || this.output==undefined) return false;
  Comp.array.iter(row,function (col,i) {line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';});
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {self.error=repl;return false;} 
    else return true;
  } 
  return this.seq([
    ['exec','insert into  '+tbl+' values ('+line+')', done]
  ], callback);
}

/** Insert a row in a matrix table
 *
 */
sqlc.prototype.insertMatrix = function (matname,row,callback) {
  var repl,self=this,
      line='', 
      sep='';
  if (this.input==undefined || this.output==undefined) return false;
  Comp.array.iter(row,function (col,i) {line += sep+(Comp.obj.isNumber(col)?int(col):"'"+col+"'"); sep=',';});
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {self.error=repl;return false;} 
    else return true;
  } 
  return this.seq([
    ['exec','insert into  '+matname+' values ('+line+')', done]
  ], callback);
}

sqlc.prototype.insertTable = sqlc.prototype.insert;

/** Read a matrix
 *
 */
sqlc.prototype.readMatrix = function (matname,callback) {
  var mat=[],self=this,
      repl,
      cols;
  if (this.input==undefined || this.output==undefined) return none;
  
  function done(_repl) {
    repl=_repl[0];
    if (!repl || self.err(repl)) {self.error=repl; mat=none; return false;} 
    else return true;
  } 
  
  this.seq([
    ['exec','select * from '+matname,done],
    ['exec','get row',function (_repl) {
      if (done(_repl)) {
        if (!self.end(repl)) {
          repl=Comp.string.replace_all('\n','',repl);
          var cols=Comp.array.map(Comp.string.split(',',repl),function (col) {
            return Comp.pervasives.int_of_string(col);
          });
          mat.push(cols);
          return none;
        } else return true;
      } else return false;
    }]
  ], callback?function (res) { if (res) callback(mat); else callback(none);}:undefined);
  if (callback) return; else return mat;
}

// TODO
sqlc.prototype.readTable = sqlc.prototype.readMatrix;

/** SELECT operation
 * tbl: string
 * vars?: string | string []
 * cond: string | undefined
 * callback: function () -> status string
 *
 */
sqlc.prototype.select = function (tbl,vars,cond,callback) {
  var self=this,repl;
  function done(_repl) {    
    repl=_repl?_repl[0]:none;
    if (!repl || self.err(repl)) {self.error=repl; return false;} 
    else return true;
  } 
  if (vars==undefined) vars='*';
  return this.seq([
    ['exec',Comp.printf.sprintf('select %s from %s%s',
                                Comp.obj.isArray(vars)?Comp.printf.list(vars):vars,
                                tbl,
                                cond?(' WHERE '+cond):''),done]
    ],callback);
 
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
  function Todo() {
    if (self.todo.length>0) {
      var f = Comp.array.head(self.todo);
      self.error=undefined;
      f();
      self.todo = Comp.array.tail(self.todo);
      Todo();
    }    
  }
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
        case 'open':
          if (!Comp.obj.isString(self.output)) return;
          try {
            self.callback=function (repl) {
              status=hd[1](repl); 
              if (status) next(_,finalize); else callback(status);
            };
            self.input.write('set stream');
            var path_out = self.output;
            self.output = Fs.createReadStream(path_out);
            self.output.on('close',function () {
              // console.log('CLOSE');
              // TODO ??
              self.log('Close on output stream '+path_out);
            });
            self.output.on('data',function (chunk) {
              // Assumption: one chunk == one reply !?
              if (self.callback) {
                var cb=self.callback;
                self.callback=none;
                cb(Comp.array.filter(Comp.string.split('\n',chunk.toString()),function(line) {return line!=''}));
              }
            });
          } catch (e) {
            self.log (Comp.printf.sprintf("%s Connecting to server channel %s failed: %s",
                                  this.id,path_out,e));
            callback(false);
          }        
          break;
        case 'set':
          self.set(hd[1],function (repl) {
            status=hd[2](repl); 
            if (status) next(_,finalize); else callback(status,self.error);
          });
          break;
        case 'exec':
          self.exec(hd[1],function (repl) {
            status=hd[2](repl); 
            if (status) next(_,finalize); 
            else if (status==undefined) next(hd,finalize); 
            else callback(status,self.error);
          });
          break;
      }
    }
  }
  self.todo.push(next);
  if (self.todo.length==1) Todo();
  return;
};

/** Set a SQLD flag (nl,csv,..). 
 *
 */
sqlc.prototype.set = function (flag,callback) {
  var n,fd,str='';
  if (this.input==undefined) return false;
  this.callback=callback;
  this.input.write('set '+flag,'utf8',function (){
  });
};

sqlc.prototype.setLog = function (f) {
  this.log=function (msg) {f('[DB] '+msg)};
}

/** Write matrix values
 *
 */
sqlc.prototype.writeMatrix = function (matname,matrix,callback) {
  var repl, line='', seq=[], self=this,
      intf='', sep='', i=0, row;
  if (this.input==undefined || this.output==undefined) return false;
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
    if (!repl || self.err(repl)) {self.error=repl;return false;} 
    else return true;
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
    seq.push(['exec','insert into  '+matname+' values ('+line+')',done])
  }
  return this.seq(seq,callback);
}



var Sqlc = function (path,chan) {
  var obj = new sqlc(path,chan);  
  return obj;
};

module.exports = {
  current:function (module) { current=module.current; Aios=module; },
  Sqlc:Sqlc
};
