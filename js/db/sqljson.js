

var Utils = {
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

  GET: function (url,params,cb) {
    var result,
        sync=!cb;
    // if (sync && !cb) cb=function (_result) { result=_result }; 
    if (url.indexOf('http')!=0) url = 'http://'+url;
    try {
      if (params) {
        var o=params,sep='';
        params='/?';
        for(var p in o) {
          params = params + sep + p + '='+o[p];
          sep='&';
        } 
      } else params='';
      // print(url+params)
      var request = new XMLHttpRequest();
      request.open("GET",url+params, !sync);
      request.onreadystatechange = function () {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                var allText = request.responseText;
                if (allText!='') result=JSON.parse(allText);
                else result = new Error('GET data error (empty data)');
                if (cb) cb(result);
            } else {
              result=new Error('GET from '+url+params+' failed (status '+request.status+')');
              if (cb) cb(result)
            }
        }
      }
      request.onerror = function (error) {
        result='Error: GET from '+url+params+' failed: '+error;
        if (cb) cb(result);
      }
      request.send(null);
    } catch (error) {
      result=new Error('GET from '+url+params+' failed: '+error.toString());
      if (cb) cb(result);      
    }
    return result;
  },
  
  POST: function (url,data,cb){
    var result,
        sync=!cb;
    // if (sync && !cb) cb=function (_result) { result=_result }; 
    if (url.indexOf('http')!=0) url = 'http://'+url;
    try {
      var request = new XMLHttpRequest();
      request.open("POST", url, !sync);
      request.onreadystatechange = function () {
        if(request.readyState === 4)
        {
            if(request.status === 200 || request.status == 0)
            {
                var allText = request.responseText;
                try {           
                  if (allText!='') result=JSON.parse(allText)
                  else result=new Error('POST data error (empty data)');
                } catch (e) {
                  result = new Error(e.toString());
                }
                if (cb) cb(result);
            } else {
                result = new Error('POST to '+url+' failed (status)');
                if (cb) cb(result);
            }
        }
      }
      request.onerror = function (error) {
        result = new Error('POST to '+url+' failed: '+error);
        if (cb) cb(result)
      }
      request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      request.send(JSON.stringify(data));
    } catch (error) {
      result=new Error('POST to '+url+' failed: '+error.toString());
      if (cb) cb(result)
    }
    return result;
  },
}

sql = function (url) {
  var self= {
  create: function (name,columns,cb) {
    return self.ok(self.sqljson(self.url,{
        create: { table: name },
        columns:columns
    }, cb?self.fok(cb):null))
  },
  delete: function (name,where,cb) {
    return self.ok(self.sqljson(self.url,{
        delete: name,
        where:where
    }, cb?self.fok(cb):null))
  },
  drop: function (name,cb) {
    return self.ok(self.sqljson(self.url,{
        drop: name
      }, cb?self.fok(cb):null))
  },
  fok : function (cb) {
    return function (result) { cb(self.ok(result)) };
  },
  insert: function (name,values,cb) {
    return self.ok(self.sqljson(self.url,{
        insert: name,
        values:values
    }, cb?self.fok(cb):null))
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
  select : function (name,columns,where,cb) {
    return self.ok(self.sqljson(self.url,{
        select: name,
        columns:columns,
        where:where
    }, cb?self.fok(cb):null))
  },
  sqljson : function (url,request,callback) {
    var result;
    if (!callback) {
      result=Utils.POST(url,request);
      return result; 
    } else {
      return Utils.POST(url,request, function (res) {
        // console.log(res);
        callback(res);
      });
    };
  },
  tables: function (cb) {
    return self.ok(self.sqljson(self.url,{
      tables: {
      }
    }, cb?self.fok(cb):null))
  },
  url:url
  }
  return self
}

module.exports = {
  GET: Utils.GET,
  POST: Utils.POST,
  sql : sql,
  version : '1.2.2',
}
