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
 **    $CREATED:     30-9-17 by sbosse.
 **    $VERSION:     1.2.1
 **
 **    $INFO:
 **
 **  IO Module with DB/CSV support
 **
 **  TODO: Unify Db.sqld/Db.sqlc/DbS.sqlc APIs!!!!
 **
 **    $ENDOFINFO
 */
var Io    = Require('com/io');
var Comp  = Require('com/compat');
var Db    = Require('db/dbS');
var Json  = Require('jam/jsonfn');
var Papa  = Require('parser/papaparse.js');
var util  = Require('util');

function io(options) {
  var self=this;
  if (! (this instanceof io)) return new io(options);

  this.Db=undefined;
  // Logging function?
  this.log = options.log||console.log;
  // Current environment (AIOS)?
  this.current=options.current;
  
  // Callback handler
  function callit(proc,callback,args) {
    if (!callback) return;
    if (!proc) callback.apply({},args);
    else proc.callback(callback,args);
  }
  function process() {
    if (self.current && self.current.process) return self.current.process;
  }
  // SQLD DB connection
  this.db = {
    init: function (path,channel,callback) {
      var proc=process();
      if (!self.Db) self.Db={};
      if (!self.Db[path]) {
        self.Db[path]=Db.Sqlc(path,channel);
        self.Db[path].setLog(function (msg) {self.log(msg)});        
      }
      self.Db[path].init(function (stat,err) {
        self.log('[DB] '+path+' Initialized: '+stat);            
        callit(proc,callback,[stat,err]);
      });
    },
    createMatrix: function (path,matname,firstrow,callback) {
      var proc=process();
      self.Db[path].createMatrix(matname,firstrow,function (stat,err) {
        callit(proc,callback,[stat,err]);       
      });
    },
    createTable: function (path,tblname,header,callback) {
      var proc=process();
      self.Db[path].createTable(tblname,header,function (stat,err) {
        callit(proc,callback,[stat,err]);       
      });
    },
    drop: function (path,tbl,callback) {
      var proc=process();
      self.Db[path].drop(tbl,function (stat,err) {
        callit(proc,callback,[stat,err]);
      });
    },
    get: function (path,callback) {
      var proc=process();
      self.Db[path].get(undefined,function (row,err) {
        callit(proc,callback,[row,err]);
      });
    },
    insert: function (path,tbl,row,callback) {
      var proc=process();
      self.Db[path].insert(tbl,row,function (stat,err) {
        callit(proc,callback,[stat,err]);
      });
    },
    insertMatrix: function (path,matname,row,callback) {
      var proc=process();
      self.Db[path].insertMatrix(matname,row,function (stat,err) {
        callit(proc,callback,[stat,err]);
      });
    },
    readMatrix: function (path,matname,callback) {
      var proc=process();
      self.Db[path].readMatrix(matname,function (mat,err) {
        callit(proc,callback,[mat,err]);
      });
    },
    readTable: function (path,tblname,callback) {
      var proc=process();
      self.Db[path].readTable(tblname,function (tbl,err) {
        callit(proc,callback,[tbl,err]);
      });
    },
    select: function (path,tbl,vars,cond,callback) {
      var proc=process();
      if (!callback && Comp.obj.isFunction(cond)) callback=cond,cond=undefined;
      self.Db[path].select(tbl,vars,cond,function (stat,err) {
        callit(proc,callback,[stat,err]);
      });
    },
    writeMatrix: function (path,matname,matrix,callback) {
      var proc=process();
       self.Db[path].writeMatrix(matname,matrix,function (stat,err) {
        callit(proc,callback,[stat,err]);
       });
    },
    writeTable: function (path,tblname,tbl,callback) {
      var proc=process();
       self.Db[path].writeTable(tblname,tbl,function (stat,err) {
        callit(proc,callback,[stat,err]);
       });
    }
  }
  // CSV file import/export
  this.csv = {
    // callback:function(data|error)
    read: function (file,callback,verbose) {
      var proc=process();
      if (verbose) self.log('CSV: Reading from '+file);
      try {
        data=Io.read_file(file);
        if (!data) throw 'CSV File read error: '+file;          
        if (verbose) self.log('CSV: Parsing '+file);
        Papa.parse(data,{
          complete: function(results) {
            if (verbose) self.log('CSV parsed with DEL="'+results.meta.delimiter+'" TRUNC='+results.meta.truncated+
                                  ' ABORT='+results.meta.aborted);
            callit(proc,callback,[results.data]);
          }
        });
      } catch (e) {
        callit(proc,callback,[e]);
      }
    },
    // typeof data = *[][]
    write: function (file,header,data,callback,verbose) {
      var proc=process(),
          fd,i;
      try {
        if (verbose) self.log('CSV: Wrting to file '+file);
        fd=Io.open(file,'w+');
        Io.write_line(fd,Comp.printf.list(header));
        for(i in data) {
          Io.write_line(fd,Comp.printf.list(data[i]));
        }
        Io.close(fd);
        callit(proc,callback,[0]);
      } catch (e) {
        callit(proc,callback,[e]);
      }      
    },
    // typeof data = {}[]
    // header is derived from first  object element
    writeObj: function (file,data,callback,verbose) {
      var proc=process(),
          fd,i,p,header=[],line,sep;
      try {
        if (verbose) self.log('CSV: Wrting to '+file);
        fd=Io.open(file,'w+');
        for(p in data[0]) header.push(p);
        Io.write_line(fd,Comp.printf.list(header));
        for(i in data) {
          line='',sep='';
          for(p in data[i]) line = line + sep + String(data[i][p]),sep=',';
          Io.write_line(fd,line);
        }
        Io.close(fd);
        callit(proc,callback,[0]);
      } catch (e) {
        callit(proc,callback,[e]);
      }      
    }
    
  };
  
  this.array = Comp.array;
  this.inspect = util.inspect;
  
}

module.exports = {
  Io:io
}
