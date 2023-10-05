/*
 * New unified SQL implementation.
 * SQLJSON client and server API
 * Provides server and client API
 * Supports native sqlite3 or JS sqlite3 DB implementation
 */
var Database;
// native sqlite3 and JS sqlite3 should have an identical API; needs bridge?
Database = Require('sql/sqlite3');
try {  Database = require('sqlite3') } catch (e) {}
var fs = require('fs');
var path = require('path');

var time = function () { return Math.floor(Date.now()/1000) }

/*************************
  SERVER API
*************************/

// Support for multi-db mode
function sqlServer (options) {
  if (!(this instanceof sqlServer)) return new sqlServer(options);
  if (!options) options={};
  if (!options.path) options.path='/tmp/db.sql';
  this.db={}; this.current='default';
  this.sessions={};
  if (options.path.split(',').length>1) {
    // multi-db mode
    var dbL = options.path.split(',');
    for(var i in dbL) {
      this.attach(Object.assign(options,{path:dbL[i]}));
    }
  } else {
    this.attach(options);
  }
  this.options=options;
  this.open=true;
  if (options.url) { urls[options.url]=this; this.url=options.url };
  this.options.bidirectional=true;
  this.log('SQLJSON-RPC Ver. '+version);
  this.log('Current data base: '+this.current);
}

sqlServer.prototype.array2buffer = function (array,typ) {
    var b=Buffer(array.length*4);
    typ=typ||'uint32';
    for(var i=0;i<array.length;i++) {
      switch (typ) {
        case 'uint16':  b.writeUInt16LE(array[i],i*2); break;
        case 'uint32':  b.writeUInt32LE(array[i],i*4); break;
        case 'float32': b.writeFloat32(array[i],i*4); break;
        case 'float64': b.writeFloat64(array[i],i*8); break;
      }
    }
    return b;
  }

sqlServer.prototype.attach = function (options) {
  var dbname = options.path.match(/([a-zA-Z0-9_]+)\.[^$]+$/),
      exists = fs.existsSync(options.path);
  if (dbname) dbname=dbname[1];
  else dbname = path.basename(options.path);
  if (this.db[dbname]) {
    this.current=dbname;
    if (this.session) this.session.current=this.current; 
    return false;
  }
  this.db[dbname] = new Database(options.path);
  this.db[dbname].pragma('synchronous = '+(options.synchronous||0));
  this.db[dbname]._path=options.path;
  this.current=dbname; 
  if (this.session) this.session.current=this.current; 
  handles[options.path]=this;
  // synchronous mode = off! -> lazy disk sync.
  this.log((exists?'Opened':'Created')+' data base <'+dbname+'> ('+options.path+')');
  this.log('Set synchronous mode to '+(options.synchronous||0));
  return true;
}


sqlServer.prototype.buffer2array = function (buffer,typ) {
    var dw=4,a=[];
    typ=typ||'uint32';
    if (buffer instanceof Array) return buffer;
    buffer=(buffer instanceof Uint8Array)?Buffer(buffer):buffer;
    if (typ.indexOf('64')>0) dw=8;
    else if (typ.indexOf('16')>0) dw=2;
    else if (typ.indexOf('8')>0) dw=1;
    
    for(var i=0;i<buffer.length/dw;i++) {
      switch (typ) {
        case 'uint16':  a.push(buffer.readUInt16LE(i*2)); break;
        case 'uint32':  a.push(buffer.readUInt32LE(i*4)); break;
        case 'float32': a.push(buffer.readFloat32(i*4)); break; 
        case 'float64': a.push(buffer.readFloat64(i*8)); break; 
      }
    }
    return a;
  }

// Decode and encode buffers/arrays

sqlServer.prototype.decode = function (row,what) {
  var self=this,keys = Object.keys(what);
  if (what['$']) row=row[what['$']];
  keys.forEach(function (key) {
    if (key=='$') return;
    row[key]=self.buffer2array(row[key],what[key]);
  })
  return row;
}

// Conditional exclusion of row values { $attribute:'cond' }
sqlServer.prototype.exclude = function (row,what) {
  for(var key in what) {
    with(row) {
      if (eval(what[key])) delete row[key];
    }
  }
  return row;
}
// SQL database operations
sqlServer.prototype.operation = function (op,ctx) {
  var result={},columns,cmd,self=this,
      template,cmd,prep,keys;
  // TODO: Each remote endpoint must have its own current database!!!
  // Otherwise mixed mess
  if (!this.current  && !this.open) return { error : 'ENOTOPEN' };
  // CLOSE
  if (op.close) {
    if (op.close.database && op.close.database.path) {
      if (handles[op.close.database.path]==this) {
        this.open=false;
        // TODO   
      }
    } else if (this.db[op.close]) {
      delete handles[this.db[op.close]._path]
      delete this.db[op.close];
    }
    return {};
  }
  if (op.open) {
    if (this.db[op.open]) {
      this.current=op.open;
      if (this.session) this.session.current=op.open;
      return { status : 'OK'};
    } else return { error:"ENOTEXIST" };
  }
  // CREATE
  if (op.create) {
    if (op.create.table) {
      if (Array.isArray(op.columns))
        columns = op.columns.map(function (column) {
          if (typeof column == 'string') return column;
          else return column.join(' ');
        }).join(',');
      else
        columns = Object.keys(op.columns).map (function (column) {
          return column+' '+op.columns[column];
        }).join(',');
      cmd='CREATE TABLE "'+op.create.table+'" ('+columns+')';
      if (this.options.verbose) this.log(cmd)
    } else if (op.create.database) {
      if (op.create.database.path && op.create.database.url) {
        if (handles[op.create.database.path] || urls[op.create.database.url]) 
          result.error='EEXIST';
        else {
          // create new service
          handles[op.create.database.path]=sqlServer({
            name    : op.create.database.name,
            path    : op.create.database.path,
            url     : op.create.database.url,
            verbose : this.options.verbose,
          }).start();
          result.result = {
            db  : handles[op.create.database.path].db,
            url : op.database.url
          };
        } 
      } else if (op.create.database.path) {
        if (handles[op.create.database.path]) {
          result.error='EEXIST';
        } else {
          // add a new database to this service
          if (path.dirname(op.create.database.path)=='.') {
            // use path from current database
            op.create.database.path=path.dirname(this.db[this.current]._path)+'/'+op.create.database.path;
          }
          if (this.attach(Object.assign(this.options,{path:op.create.database.path}))) {
            this.log('DB '+op.create.database.path+' attached.');
          };
          result.result = 'OK';
        }
      } else result.error = 'EINVALID';
      return result;
    }  
    try {
      this.db[this.current].exec(cmd);
      result.result = 'OK';
    } catch (e) {
      result.error = e.toString();
    }
    return result;
  }
  // DATABASES
  if (op.databases) {
    if (!op.callback) result.result=[];
    Object.keys(this.db).forEach(function (dbname) {
      if (op.callback) op.callback(dbname);
      else result.result.push(dbname);  
    });
    return result;
  }
  
  // DELETE
  if (op.delete ) {
    try {
      cmd='DELETE FROM "'+op.delete+'"';
      if (op.where) cmd += (' WHERE ')+op.where;
      this.db[this.current].exec(cmd);
      result.result = 'OK';
    } catch (e) {
      result.error = e.toString();        
    }
    return result;
  }
  
  // DROP
  if (op.drop) {
    cmd='DROP TABLE'+(op.forced?' IF EXISTS ':'')+' "'+op.drop+'"';
    try {
      this.db[this.current].exec(cmd);
      result.result = 'OK';
    } catch (e) {
      result.error = e.toString();
    }
    return result;
  }
  
  // INSERT
  if (op.insert) {
    try {
      if (Array.isArray(op.values) && typeof op.values[0] == 'object') {
        template  = Object.keys(op.values[0]).map(function () { return '?' }).join(',');
        keys      = Object.keys(op.values[0]).join(',');
        cmd='INSERT INTO "'+op.insert+'" VALUES ('+template+')';
        prep = this.db[this.current].prepare(cmd);
        result.result =
          op.values.map(function (values,index) {
            return prep.run(
              Object.keys(values).map(function (attr) {
                if (values[attr] != null && 
                    typeof values[attr]=='object') {
                  if (!(values[attr] instanceof Buffer) && values[attr].buffer)
                    return values[attr].buffer;
                  else
                    return values[attr];
                } else
                  return values[attr];
            }))
          });
      } else {
        if (Array.isArray(op.values)) {
          template=values.map(function () { return '?' }).join(',');
          cmd='INSERT INTO "'+op.insert+'" VALUES ('+template+')';
        } else if (typeof op.values == 'object') {
          template=Object.keys(op.values).map(function () { return '?' }).join(',');       
          keys      = Object.keys(op.values).join(',');
          cmd='INSERT INTO "'+op.insert+'" ('+keys+') VALUES ('+template+')';
        }
        if (Array.isArray(op.values))
          result.result=this.db[this.current].prepare(cmd).run(op.values);
        else if (typeof op.values == 'object') {
          result.result=this.db[this.current].prepare(cmd).run(
            Object.keys(op.values).map(function (attr) { 
              if (op.values[attr]!=null &&
                  typeof op.values[attr]=='object'){ 
                  if (!(op.values[attr] instanceof Buffer) && op.values[attr].buffer)
                    return op.values[attr].buffer
                  else
                    return op.values[attr];
              } else
                return op.values[attr] 
            }));
        }
      }
    } catch (e) {
      result.error = e.toString();
      // print(e)  
    }
    if (result.result) result.result.time=Date.now();
    return result;
  } 
  
  // SELECT
  if (op.select) {
    var where;
    try {
      if (op.columns instanceof Array)
        cmd='SELECT '+op.columns.join(',')+' FROM "'+op.select+'"';
      else if (typeof op.columns == 'string')
        cmd='SELECT '+op.columns+' FROM "'+op.select+'"';
      else if (typeof op.count == 'string')
        cmd='SELECT COUNT('+op.count+') FROM "'+op.select+'"';
      result.result=[];
      if (op.where) {
        if (op.where.indexOf('idlist(')==0) {
          function idlist (list) { return 'id in ('+list.join(',')+')' };
          with (ctx||{}) { where=eval(op.where) }
        } else where=op.where;
        cmd += (' WHERE ')+where;
      }
      this.db[this.current].prepare(cmd).each(function (row) {
        if (op.exclude) row=self.exclude(row,op.exclude);
        if (op.decode) row=self.decode(row,op.decode);
        if (op.callback) op.callback(row);
        else if (op.count) result.result.push(typeof row=='number'?row:row['COUNT('+op.count+')']);
        else result.result.push(row);  
      });
    } catch (e) {
      result.error = e.toString();        
    }
    if (result.result && op.target && ctx) 
      ctx[op.target]=(op.index!=undefined?result.result[op.index]:result.result);
    return result;  
  }
  
  // SCHEMA
  if (op.schema) {
    if (!Array.isArray(op.schema)) {
      cmd="SELECT sql FROM sqlite_master WHERE name='"+op.schema+"'";
      if (!op.callback) result.result=null;
      this.db[this.current].prepare(cmd).each(function (row) {
        if (op.callback) op.callback(row.sql);
        else result.result=row.sql;
      });
    } else {
      if (!op.callback) result.result=[];
      op.schema.forEach(function (table) {
        cmd="SELECT sql FROM sqlite_master WHERE name='"+table+"'";
        self.db[this.current].prepare(cmd).each(function (row) {
          if (op.callback) op.callback(row.sql);
          else result.result.push(row.sql);
        });
      });
    }
    return result;  
  }
  
  // TABLES
  if (op.tables) {
    cmd="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
    if (!op.callback) result.result=[];
    this.db[this.current].prepare(cmd).each(function (row) {
      if (op.callback) op.callback(row.name);
      else result.result.push(row.name);  
    });
    return result;
  }
  
  // UPDATE
  if (op.update) {
    try {
      if (typeof op.values == 'object') {
        template=Object.keys(op.values).map(function (key) { return key+' = ?' }).join(',');       
        cmd='UPDATE "'+op.update+'" SET '+template;
        if (op.where) cmd += (' WHERE ')+op.where;
        result.result=this.db[this.current].prepare(cmd).run(
          Object.keys(op.values).map(function (attr) { return op.values[attr] }));
      }
    } catch (e) {
      result.error = e.toString();        
    }
    if (result.result) result.result.time=Date.now();
    return result;
  }
  return { error : 'ENOTSUPPORTED' }
}

// Command Interpreter
sqlServer.prototype.command = function (op,ctx) {
  var self=this,result,safe=10;
  if (!ctx) ctx={};
  if (op.vars) ctx=Object.assign(ctx,op.vars);
  function boolean(cond) { with (ctx) { return eval(cond) }}
  if (op.find && op.source && op.target) {
    var found,o=ctx[op.source];
    if (Array.isArray(o)) {
      o.forEach(function (__row,index) {
        var match;
        if (found) return;
        with (ctx) { match = eval(op.find.replace(/\$/g,'__row')) };
        if (match) found=__row;
      });
      ctx[op.target]=found;
    }
    return {};
  }
  if (op.ifthen) {
    var branch=boolean(op.ifthen);
    if (branch && op.raise) throw op.raise;
    if (branch && op.make) this.do(op.make,ctx)
    else if (op.otherwise) this.do(op.otherwise,ctx);
    if (op.result) result=ctx[op.result];
    if (result==undefined && ctx.result) result=ctx.result;
    return result;
  }
  if (op.loop) {
    op=op.loop;
    if (op.vars) ctx=Object.assign(ctx,op.vars);
    if (op.init) this.do(op.init,ctx);
    if (op.make) while (safe>0 && (!op.cond || boolean(op.cond))) {
      try {
        this.do(op.make,ctx);
      } catch (e) {
        // print(e)
        if (op.error) {
          try { return this.do(op.error,ctx) }
          catch (e) { return e && e.error?e:{ error:e } };
        }
        else return { error:e }
      }
      safe--;
    }
    if (op.finalize) this.do(op.finalize,ctx);
    if (op.result) result=ctx[op.result];
    if (result==undefined && ctx.result) result=ctx.result;
    return result;
  }
  if (op.result) {
    if (typeof op.result == 'string') 
      ctx.result=ctx[op.result];
    else
      ctx.result=op.result;
    return ctx.result;
  }
  if (op.assign) {
    with (ctx) { eval(op.assign) };
    return {};
  }
  if (op.incr) {
    try { ctx[op.incr]++; } catch (e) { return { error:e }};
    return {};
  }
  if (op.decr) {
    try { ctx[op.incr]--; } catch (e) { return { error:e }};
    return {};
  }
  if (op.decode) {
    this.decode(ctx,op.decode);
  }
}

// Main RPC interpreter entry point
sqlServer.prototype.do = function (ops,ctx) {
  var self=this,result={},tid=ops.tid;
  if (ops.sessionID) this.session=this.openSession(ops.sessionID); else this.session=null;
  if (Array.isArray(ops)) {
    result = ops.map(function (op) {
      result=self.do(op,ctx);
      if (result && result.error) throw result;
      return result;
    })
    return result;
  }
  if (ops.close || ops.create || ops.drop   || ops.databases || ops.delete || ops.insert || 
      ops.open  || ops.select || ops.schema || ops.tables    || ops.update)
    return this.operation(ops,ctx);
  else 
    return this.command(ops,ctx);  
} 

sqlServer.prototype.log = function (msg) {
  print('[SQLJSON'+(this.port?' '+this.port:'')+'] '+msg); 
}

/*********************
  CLIENT API
*********************/
DB = {
  // pack generic number arrays into byte buffer (with support for array arrays)  
  array2buffer : function (array,typ,space) {
    var size=array.length,dsize=4;
    typ=typ||'uint32';
    if (!space && Utils.isArray(array[0])) {
      space=[size,array[0].length];
      if (Utils.isArray(array[0][0])) space.push(array[0][0].length);
    }
    if (space) size=space.reduce(function (a,b) { return a*b });
    if (!space) space=[size];
    switch (typ) {
        case 'number': dsize=8; break;
        case 'uint16': dsize=2; break;
        case 'uint32': dsize=4; break;
        case 'int16':  dsize=2; break;
        case 'int32':  dsize=4; break;
        case 'float32': dsize=4; break;
        case 'float64': dsize=8; break;
    }
    var b=Buffer(size*dsize);
    function set(v,off) {
      switch (typ) {
        case 'uint16':  b.writeUInt16LE(v,off); break;
        case 'uint32':  b.writeUInt32LE(v,off); break;
        case 'int16':   b.writeInt16LE(v,off); break;
        case 'int32':   b.writeInt32LE(v,off); break;
        case 'float32': b.writeFloatLE(v,off); break;
        case 'float64': 
        case 'number':
        default:
          b.writeDoubleLE(v,off); break;
      }    
    }
    var v,off=0;
    for(var i=0;i<array.length;i++) {
      switch (space.length) {
        case 1:
          v=array[i];
          set(v,off);
          off += dsize;
          break;
        case 2:
          for (var j=0;j<space[1];j++) {
            v=array[i][j];
            set(v,off);
            off += dsize;    
          }
          break;
        case 3:
          for (var j=0;j<space[1];j++) {
            for (var k=0;k<space[2];k++) {
              v=array[i][j][k];
              set(v,off);
              off += dsize;    
            }
          }
          break;
      }
    }
    return b;
  },
  
  // unpack generic number arrays from buffer (with support for array arrays)
  buffer2array : function (buffer,typ,space) {
    var dsize=4,bsize=(buffer.size||buffer.length),size,length,array=[];
    typ=typ||'uint32';
    if (buffer instanceof Array) return buffer;
    buffer=(buffer instanceof Uint8Array)?Buffer(buffer):buffer;
    if (typ=='number') dsize=8;
    else if (typ.indexOf('64')>0) dsize=8;
    else if (typ.indexOf('32')>0) dsize=4;
    else if (typ.indexOf('16')>0) dsize=2;
    else if (typ.indexOf('8')>0) dsize=1;
    typ=typ.toLowerCase();
    if (space)  size=space.reduce(function (a,b) { return a*b });
    if (!space) space=[bsize/dsize];
    if (size && (size*dsize)!=buffer.length) return new Error('EINVALID');

    function get(off) {
      switch (typ) {
        case 'uint8':   return buffer.readUInt8(off); break;
        case 'uint16':  return buffer.readUInt16LE(off); break;
        case 'uint32':  return buffer.readUInt32LE(off); break;
        case 'int8':    return buffer.readInt8(off); break;
        case 'int16':   return buffer.readInt16LE(off); break;
        case 'int32':   return buffer.readInt32LE(off); break;
        case 'float32': return buffer.readFloatLE(off); break;
        case 'float64': 
        case 'number':
        default:
          return buffer.readDoubleLE(off); break;
      }    
    }
    var v,off=0;
    for(var i=0;i<space[0];i++) {
      switch (space.length) {
        case 1:
          v=get(off);
          array[i]=v;
          off += dsize;
          break;
        case 2:
          array[i]=[];
          for (var j=0;j<space[1];j++) {
            v=get(off);
            array[i][j]=v;
            off += dsize; 
          }
          break;
        case 3:
          array[i]=[];
          for (var j=0;j<space[1];j++) {  
            array[i][j]=[];
            for (var k=0;k<space[2];k++) {
              v=get(off);
              array[i][j][k]=v;
              off += dsize;    
            }
          }
          break;
      }
    }

    return array;
  },

  basename : function (path,extension) {
    if (path[path.length-1]=='/') return '/';
    return extension?
            path.split('/').reverse()[0].replace(RegExp(extension.replace(/\./,'\\.')+'$'),'')
            :
            path.split('/').reverse()[0];
  },

  dirname : function (path) {
    var el=path.split('/');
    el.pop();
    return el.join('/');
  },
  
  error : function (result) {
    try {
      if (typeof result == 'number') return result>=0?false:new Error(result);
      if (!result) return new Error('EIO');
      if (result instanceof Error) return result;
      if (typeof XMLHttpRequestException != 'undefined' &&
          result instanceof XMLHttpRequestException) return new Error(result.message);
      if (typeof result == 'string' && result.indexOf('Error')!=-1) return new Error(result);
      if (result.error) return new Error(result.error);
      if (result.fs) result=result.fs;
      result=result[Object.keys(result)[0]];
      if (!result) return false;
      if (result.error) return new Error(result.error);
      else return false;
    } catch (e) {
      console.log(e,result);
      return e;
    }
  },
  
   
  fok : function (cb) {
    return function (result) { cb(DB.ok(result)) };
  },
  
  // Convert matrix to sql row [rows,columns,datatype,data]
  fromMatrix : function (mat,options) {
    if (Math.MatrixTA && mat instanceof Math.MatrixTA) {
      return {
        rows:mat.rows,
        columns:mat.columns,
        dataspace:mat.dataspace,
        datatype:mat.datatype,
        data:DB.toBuffer(mat)
      }
    }
  },

  mimeType: function (data) {
    if (typeof data == 'string')
      return data.replace(/[^\x20-\x7E\n\r\t\s]+/g, '').length==data.length?
              'text/plain':'application/octet-stream';
    else {
      for(var i=0;i<data.length;i++) {
        if ((data[i]<0x20 || data[i]>0x7e) && 
            data[i] != 0x0a && 
            data[i] != 0x0d && 
            data[i] != 0x09) return 'application/octet-stream'; 
      }
      return 'text/plain';
    }
  },

  ok : function (result) {
    if (!result) return new Error('ENOTFOUND');
    if (result instanceof Error) return result;
    if (typeof result=='string') return new Error(result);
    if (result.error) return new Error(result.error);
    if (result.fs) result=result.fs;
    result=result[Object.keys(result)[0]];
    if (!result) return new Error('EIO');
    if (result.error) return new Error(result.error);
    else if (result.result) return result.result;
    else return result;
  },
  

  // SQL operations API (generic)
  sql  : function (url) { return {
    attach : function (name,dir,cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        create: { database: {
          name  : name,
          path  : dir?dir+'/'+name:name,
        } },
      }, cb?DB.fok(cb):null,cb!=undefined))    
    },
    // copy an entire table from this DB to another (dst: sqljson API)
    // Hierarchical tables (e.g., sqlds) must be copied by the respective API (e.g, sqlds.copy)
    copy : function (name,dst,options,cb) {
      options=options||{};
      if (!Utils.isObject(dst)) return new Error('EINVALID');
      if (!cb) {
        var result,stat;
        var schema = this.schema(name);
        if (stat=DB.error(schema)) return stat;
        if (options.overwrite) {
          result = dst.drop(name);
          stat=DB.error(result);
          if (stat) return stat;
        }
        result = dst.create(name,schema);
        stat=DB.error(result);
        if (stat) return stat;
        var rows = this.count(name);
        if (DB.error(rows)) return DB.error(rows);
        rows=DB.ok(rows);
        for (var i=1;i<(rows+1);i++) {
          var data = this.select(name,'*','rowid="'+i+'"');
          if (DB.error(data)) return DB.error(data);
          result=dst.insert(name,DB.ok(data));
          stat=DB.error(result);
          if (options.progress) options.progress(i,rows,DB.ok(result));
          if (stat) return stat;
        }
      }
    },
    count : function (name,count,cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        select: name,
        count:count||'*'
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    // create a new table
    create: function (name,columns,cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        create: { table: name },
        columns:columns
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    // create a new database or open if existing
    createDB: function (name,dir,url,cb) {
      if (typeof url == 'function') { cb=url; url=undefined };
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        create: { database: {
          name  : name,
          path  : dir?dir+'/'+name+'.sql':name+'.sql',
          url   : url,
        } },
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    databases: function (cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        databases: {}
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    delete: function (name,where,cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        delete: name,
        where:where
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    do: function (cmd,cb) {
      // TODO
    },
    drop: function (name,ifnotexists,cb) {
      if (typeof ifnotexists=='function') { cb=ifnotexists; ifnotexists=undefined };
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        drop: name,
        forced : ifnotexists
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    // parse an sql query, return reply
    eval : function (query,cb) {
      var tokens = query.split(' '); // TODO:!!!
      switch (tokens[0].toLowerCase()) {
        case 'databases': return this.databases(cb);
        case 'tables': return this.tables(cb);
      }
    },
    // returns { changes: number, lastInsertROWID: number, time: number }
    insert: function (name,values,cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        insert: name,
        values:values
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    // open/select a database
    open: function (name,cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        open: name
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    select: function (name,columns,where,cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        select: name,
        columns:columns,
        where:where
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    schema: function (name, cb) {
      var matched;
      var result = DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        schema:  name
      }, cb?DB.fok(function (result) { 
        if (Utils.isError(result)) return cb(result);
        if (typeof result == 'string')
          cb((matched=result.match(/\((.+)\)$/)) && matched[1].split(','))
        else if (Array.isArray(result))
          result.forEach(function (part) { cb((matched=part.match(/\((.+)\)$/)) && matched[1].split(',')) });
        else
          cb(result)}):null,cb!=undefined));
      if (Utils.isError(result)) return result;
      if (typeof result == 'string')
        return (matched=result.match(/\((.+)\)$/)) && matched[1].split(',')
      else if (Array.isArray(result))
        return result.map(function (part) { return (matched=part.match(/\((.+)\)$/)) && matched[1].split(',') });
    },
    tables: function (cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        tables: {}
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    update: function (name,values,where,cb) {
      return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        update: name,
        values:values,
        where:where,
      }, cb?DB.fok(cb):null,cb!=undefined))
    },
    sessionID: DB.unique(),
    url : url,
  }},
  
  // complete async/promise version
  sqlA  : function (url) { var self = {
    attach : async function (name,dir,cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          create: { database: {
            name  : name,
            path  : dir?dir+'/'+name:name,
          } },
        }, DB.fok(resolve),true))          
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        create: { database: {
          name  : name,
          path  : dir?dir+'/'+name:name,
        } },
      }, DB.fok(cb),true))    
    },
    // copy an entire table from this DB to another (dst: sqljson API)
    // Hierarchical tables (e.g., sqlds) must be copied by the respective API (e.g, sqlds.copy)
    copy : async function (name,dst,options,cb) {
      options=options||{};
      if (!Utils.isObject(dst)) return new Error('EINVALID');
      if (!cb) {
        var result,stat;
        var schema = await this.schema(name);
        if (stat=DB.error(schema)) return stat;
        if (options.overwrite) {
          result = await dst.drop(name);
          stat=DB.error(result);
          if (stat) return stat;
        }
        result = await dst.create(name,schema);
        stat=DB.error(result);
        if (stat) return stat;
        var rows = this.count(name);
        if (DB.error(rows)) return DB.error(rows);
        rows=DB.ok(rows);
        for (var i=1;i<(rows+1);i++) {
          var data  =  await this.select(name,'*','rowid="'+i+'"');
          if (DB.error(data)) return DB.error(data);
          result    = await dst.insert(name,DB.ok(data));
          stat=DB.error(result);
          if (options.progress) options.progress(i,rows,DB.ok(result));
          if (stat) return stat;
        }
      }
    },
    count : async function (name,count,cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          select  : name,
          count   : count||'*'
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        select: name,
        count:count||'*'
      }, DB.fok(cb),true))
    },
    // create a new table
    create: async function (name,columns,cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          create: { table: name },
          columns:columns
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        create: { table: name },
        columns:columns
      }, DB.fok(cb),true))
    },
    // create a new database or open if existing
    createDB: async function (name,dir,url,cb) {
      if (typeof url == 'function') { cb=url; url=undefined };
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          create: { database: {
            name  : name,
            path  : dir?dir+'/'+name+'.sql':name+'.sql',
            url   : url,
          } },
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        create: { database: {
          name  : name,
          path  : dir?dir+'/'+name+'.sql':name+'.sql',
          url   : url,
        } },
      }, DB.fok(cb),true))
    },
    databases: async function (cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          databases: {}
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        databases: {}
      }, DB.fok(cb),true))
    },
    delete: async function (name,where,cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          delete: name,
          where:where
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        delete: name,
        where:where
      }, DB.fok(cb),true))
    },
    do: function (cmd,cb) {
      // TODO
    },
    drop: async function (name,ifnotexists,cb) {
      if (typeof ifnotexists=='function') { cb=ifnotexists; ifnotexists=undefined };
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          drop: name,
          forced : ifnotexists
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        drop: name,
        forced : ifnotexists
      }, DB.fok(cb),true))
    },
    // parse an sql query, return reply
    eval : function (query,cb) {
      var tokens = query.split(' '); // TODO:!!!
      switch (tokens[0].toLowerCase()) {
        case 'databases': return this.databases(cb);
        case 'tables': return this.tables(cb);
      }
    },
    // returns { changes: number, lastInsertROWID: number, time: number }
    insert: async function (name,values,cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          insert: name,
          values:values
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        insert: name,
        values:values
      }, DB.fok(cb),true))
    },
    // open/select a database
    open: async function (name,cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          open: name
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        open: name
      }, DB.fok(cb),true))
    },
    select: async function (name,columns,where,cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          select: name,
          columns:columns,
          where:where
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        select: name,
        columns:columns,
        where:where
      }, DB.fok(cb),true))
    },
    schema: async function (name, cb) {
      var matched;
      function exec(cb) {
        var result = DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          schema:  name
        }, DB.fok(function (result) { 
          if (Utils.isError(result)) return cb(result);
          if (typeof result == 'string')
            cb((matched=result.match(/\((.+)\)$/)) && matched[1].split(','))
          else if (Array.isArray(result))
            result.forEach(function (part) { cb((matched=part.match(/\((.+)\)$/)) && matched[1].split(',')) });
          else
            cb(result)}),true));      
      }
      if (!cb) return new Promise(function (resolve,reject) {
        exec(resolve);
      });
      else return exec(cb);
    },
    tables: async function (cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          tables: {}
        }, DB.fok(resolve),true))
      }); 
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        tables: {}
      }, DB.fok(cb),true))
    },
    update: async function (name,values,where,cb) {
      if (!cb) return new Promise(function (resolve,reject) {
        DB.ok(DB.sqljson(self.url+'#'+self.sessionID,{
          update: name,
          values:values,
          where:where,
        }, DB.fok(resolve),true))
      });
      else return DB.ok(DB.sqljson(this.url+'#'+this.sessionID,{
        update: name,
        values:values,
        where:where,
      }, DB.fok(cb),true))
    },
    sessionID: DB.unique(),
    url : url,
  }; return self},
   

  
  // SQLjson RPC client request (with optional access key)
  // format url = ["proto://"] ("host:port" | "host:port:K1:K2:K3:..")  
  sqljson : function (url,request,callback,async) {
    if (!url) {
      // local SQL db access
    }
    var proto  = url.match(/^([a-zA-Z]+):\/\//),
        tokens = url.split(':'),
        sessionID = url.match(/#([^$]+)$/);
    if (proto) proto=proto[1];
    if (sessionID) {
      sessionID=sessionID[1];
      tokens[tokens.length-1]=tokens[tokens.length-1].replace(/#[^$]+$/,'');
      request.sessionID=sessionID;
      url=url.replace(/#[^$]+$/,'');
    }
    if (tokens.length>(2+(proto?1:0))) { 
      url = tokens.slice(0,2+(proto?1:0)).join(':'); 
      request.key= tokens.slice(2+(proto?1:0)).join(':'); 
    }
    // console.log('sqljson',url,request)
    if (!async && !callback) {
      return Utils.POST(url,request,null,true);
    } else if (callback) {
      return Utils.POST(url,request, function (res) {
        // console.log(res);
        callback(res);
      },!async);
    };
  },
  
  strict:false,
  
  time : function (format) {
    switch (format) {
      case 'milli':
      case 'ms':
        return Date.now();
      case 'YYYYMMDD':
        var today = new Date();
        return (today.getYear()+1900)+
               (today.getMonth()<9?'0'+(today.getMonth()+1):today.getMonth()+1)+
               (today.getDate()<10?'0'+today.getDate():today.getDate())
      case 'YYYYMMDD@HHMM':
        var today = new Date();
        return (today.getYear()+1900)+
               (today.getMonth()<9?'0'+(today.getMonth()+1):today.getMonth()+1)+
               (today.getDate()<10?'0'+(today.getDate()):today.getDate())+
               '@'+
               (today.getHours()<9?'0'+(today.getHours()+1):today.getHours()+1)+
               (today.getMinutes()<10?'0'+(today.getMinutes()):today.getMinutes())              
      default:
        return Date().toString();
    }
  },
  
  timeCompare : function (t1,t2) {
    if (isNaN(Number(t1))) t1=Date.parse(t1);
    if (isNaN(Number(t2))) t2=Date.parse(t2);
    t1=Number(t1); t2=Number(t2);
    return t1<t2?-1:(t1>t2?1:0);
  },
  
  toArray: function (buff,ftyp,dims,layout) {
    var ta = DB.toTypedArray(buff,ftyp);
    if (!layout) layout=123;
    if (!ta) return;
    if (!dims) dims=[ta.length];
    switch (dims.length) {
      case 1: return Array.prototype.slice.call(ta);
      case 2:
        var a=[];
        for(var i=0;i<dims[0];i++) {
          var row=[];
          for(var j=0;j<dims[1];j++) row[j]=ta[i*dims[1]+j];
          a.push(row);
        }
        return a;
    }
  },

  toBuffer : function (a) {
    if (Utils.isBuffer(a)) return a;
    if (Utils.isArray(a)) {
      return DB.array2buffer(a)
    }
    if (Utils.isMatrix(a,true)) {
      if (Utils.isTypedArray(a.data))
        return Buffer(a.data.buffer) // Matrix??
    }
    if (Utils.isVector(a,true)) {
      if (Utils.isTypedArray(a.data))
        return Buffer(a.data.buffer) // Matrix??
    }
  },
  
  // function toMatrix(buff:buffer,ftyp:function|datatype:string,dims:number[],layout)
  // function toMatrix(row:{rows:number,columns:number,datatype:string,data:buffer,layout?:number})
  toMatrix: function (buff,ftyp,dims,layout) {
    if (!Math.MatrixTA) return new Error('Math.MatrixTA not defined');
    if (typeof buff == 'object' && buff.rows && buff.columns && buff.datatype && buff.data) {
      // compact direct version
      var row=buff;   // returned from sqljson
      dims=[row.rows,row.columns];
      ftyp = Utils.TypedArrayOfName[row.datatype]||Utils.TypedArrayOfName[row.datatype+'Array'];
      var ta = DB.toTypedArray(row.data,ftyp);
      return Math.MatrixTA({data:ta,dataspace:dims,dtn:Utils.TypedArrayToName(ftyp),layout:row.layout});
    }
    if (!Utils.isArray(dims)) throw 'DB.toMatrix: invalid dimension array';
    if (typeof ftyp == 'string') {
      ftyp = Utils.TypedArrayOfName[ftyp]||Utils.TypedArrayOfName[ftyp+'Array'];
    }
    if (!Utils.isFunction(ftyp)) throw 'DB.toMatrix: invalid datatype or typedarray constructor';
    var ta = DB.toTypedArray(buff,ftyp);
    return Math.MatrixTA({data:ta,dataspace:dims,dtn:Utils.TypedArrayToName(ftyp),layout:layout});
  },
  
  toTypedArray: function (buff,ftyp) {
    var i,ta;
    if (buff.buffer instanceof ArrayBuffer) {
      switch (ftyp) {
        case Float32Array: return new Float32Array((new Uint8Array(buff)).buffer);
        case Float64Array: return new Float64Array((new Uint8Array(buff)).buffer);
        case Int8Array:    return new Int8Array((new Uint8Array(buff)).buffer);
        case Int16Array:   return new Int16Array((new Uint8Array(buff)).buffer);
        case Int32Array:   return new Int32Array((new Uint8Array(buff)).buffer);
        case Uint8Array:    return new Uint8Array((new Uint8Array(buff)).buffer);
        case Uint16Array:   return new Uint16Array((new Uint8Array(buff)).buffer);
        case Uint32Array:   return new Unt32Array((new Uint8Array(buff)).buffer);
      }
    } else if (typeof Uint8Array.from != 'undefined') {
      switch (ftyp) {
        case Float32Array: return new Float32Array(Uint8Array.from(buff).buffer);
        case Float64Array: return new Float64Array(Uint8Array.from(buff).buffer);
        case Int8Array:    return new Int8Array(Uint8Array.from(buff).buffer);
        case Int16Array:   return new Int16Array(Uint8Array.from(buff).buffer);
        case Int32Array:   return new Int32Array(Uint8Array.from(buff).buffer);
        case Uint8Array:   return new Uint8Array(Uint8Array.from(buff).buffer);
        case Uint16Array:   return new Uint16Array(Uint8Array.from(buff).buffer);
        case Uint32Array:   return new Uint32Array(Uint8Array.from(buff).buffer);
      }
    } else {
      // Fall-back conversion
      switch (ftyp) {
        case Float32Array: 
          ta=new Float32Array(buff.length/4);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readFloatLE(i*4);
          return ta;
        case Float64Array: 
          ta=new Float64Array(buff.length/8);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readDoubleLE(i*8);
          return ta;
        case Int8Array: 
          ta=new Int9Array(buff.length/2);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readInt8(i*2);
          return ta;
        case Int16Array: 
          ta=new Int16Array(buff.length/2);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readInt16LE(i*2);
          return ta;
        case Int32Array: 
          ta=new Int32Array(buff.length/4);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readInt32LE(i*4);
          return ta;
        case Uint8Array: 
          ta=new Uint9Array(buff.length/2);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readUInt8(i*2);
          return ta;
        case Uint16Array: 
          ta=new Uint16Array(buff.length/2);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readUInt16LE(i*2);
          return ta;
        case Uint32Array: 
          ta=new Uint32Array(buff.length/4);
          for(i=0;i<ta.length;i++) 
            ta[i]=buff.readUInt32LE(i*4);
          return ta;
      }
    }
  },

  // return unique identifier
  unique : function (length) {
    length=length||8;
    return Math.random().toString(36).substr(2, 2+length);
  },
  
  wex : function (url,async) {
    return {
      lookup : function (path,cb) {
        Utils.POST('localhost:11111',{
          cmd:  'lookup',
          path:  path,
        },function (res) {
          if (!res || !res.reply) {
            if (cb) cb(res);
            else result=res;
            return;
          }
          if (cb) cb(res.reply);
          else result=res.reply;
        },!async)
        return result;
      },
      list : function (dir,cb) {
        var result;
        Utils.POST('localhost:11111',{
          cmd:  'list',
          dir:  dir,
        },function (res) {
          if (!res || !res.reply) {
            if (cb) cb(res);
            else result=res;
            return;
          }
          var dirs=res.reply.filter(function (entry) { return entry.dir })
                            .sort(function (a,b) { return a.name<b.name?-1:1 }),
              files=res.reply.filter(function (entry) { return !entry.dir })
                             .sort(function (a,b) { return a.name<b.name?-1:1 });
          if (cb) cb({files:files,dirs:dirs});
          else result={files:files,dirs:dirs};
        },!async);
        return result;
      },
      read:  function (dir,entry,mimetype,cb) {
        Utils.POST('localhost:11111',{
          cmd:  'load',
          dir:  dir,
          file: entry,
          mimetype:mimetype||'text',
        },function (res) {
          if (!res || !res.reply) {
            if (cb) cb(res);
            else result=res;
            return;
          }
          if (cb) cb(res.reply);
          else result=res.reply;
        },!async)
        return result;      
      },
      url:url,
    }
  },
  
  write : function (path,data,cb) {
    var pel = path.split('/'),
        root=DB.store,base='',
        entry;
    if (pel.length==1) entry=pel[0];
    else {
      entry=pel.pop();
      if (pel[0]=='') pel=pel.slice(1);
      while (pel.length) {
        base += ('/'+pel[0]);
        if (root.nodes)
          root=root.nodes[pel[0]];
        else
          break;
        pel=pel.slice(1);
      }
    }
    if (root && root.nodes && root.nodes[entry]) {
      root.nodes[entry].data=data;
      return data.length
    } else if (root && root.kind && pel.length) {
      var more = { remains:pel, base:base, root:root };
      switch (root.kind) {
        case 'db':
          if (root.flags.contains('sqldoc'))
            return root.exec.write('/'+more.remains.concat([entry]).join('/'),data,cb);
          break;
      }
    }
    return -1;
  },
  
  version : '1.7.1L',
}
