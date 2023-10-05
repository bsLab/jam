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
 **      Dr. Stefan Bosse http://www.sblab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse
 **    $INITIAL:     (C) 2006-2019 bLAB
 **    $CREATED:     1-1-19 by sbosse.
 **    $VERSION:     1.4.4
 **
 **    $INFO:
 ** 
 **   Vector module supporting typed and generic arrays.
 **   
 ** 
 **    $ENDOFINFO
 */

Require('numerics/polyfill')
var sprintf = Require('com/sprintf');

/********** TYPEDARRY/ARRAY Extension for Matrix/Vector compatibility *************/

if (typeof Array.prototype.get == 'undefined') {
  Object.defineProperty(Array.prototype, 'get', {value:function (i) {
    return this[i];
  }, configurable: true})

  Object.defineProperty(Array.prototype, 'set', {value: function (a,b) {
    this[a]=b;
  }, configurable: true})
}

  
if (typeof Array.prototype.print == 'undefined') {
  Object.defineProperty(Array.prototype, 'print', {value: function (format) {
    var i,s='',sep='', columns=this.length,complex=isArray(this[0]);
    if (!format) format = '%4.2f';
    for(i=0;i<columns;i++) {
      if (i!=0) s = s + '\n';
      if (complex) 
        s = s + sprintf.sprintf(format,this[i][0]) + ',' +
                sprintf.sprintf(format,this[i][1]);
      else
        s = s + sprintf.sprintf(format,this[i]) ;
    }    
    return s;
  }, configurable: true})
}


if (typeof Array.prototype.info == 'undefined') {
  Object.defineProperty(Array.prototype, 'info', {value: function () {
    return {
      dtn:'Array',
      size:this.length,
      columns:this.length,
      offset:0,
    }
  }, configurable: true})
}

/********************* STRING Conversion ******************************/
function toUTF8Array(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6), 
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            charcode = ((charcode&0x3ff)<<10)|(str.charCodeAt(i)&0x3ff)
            utf8.push(0xf0 | (charcode >>18), 
                      0x80 | ((charcode>>12) & 0x3f), 
                      0x80 | ((charcode>>6) & 0x3f), 
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

function fromUTF8Array(data) { // array of bytes
    var str = '', i;
    for (i = 0; i < data.length; i++) {
        var value = data[i];
        if (value < 0x80) {
            str += String.fromCharCode(value);
        } else if (value > 0xBF && value < 0xE0) {
            str += String.fromCharCode((value & 0x1F) << 6 | data[i + 1] & 0x3F);
            i += 1;
        } else if (value > 0xDF && value < 0xF0) {
            str += String.fromCharCode((value & 0x0F) << 12 | (data[i + 1] & 0x3F) << 6 | data[i + 2] & 0x3F);
            i += 2;
        } else {
            // surrogate pair
            var charCode = ((value & 0x07) << 18 | (data[i + 1] & 0x3F) << 12 | (data[i + 2] & 0x3F) << 6 | data[i + 3] & 0x3F) - 0x010000;

            str += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00); 
            i += 3;
        }
    }
    return str;
}

var complex = {
  //-------------------------------------------------
  // Add two complex numbers
  //-------------------------------------------------
  add : function (a, b)
  {
      return [a[0] + b[0], a[1] + b[1]];
  },

  //-------------------------------------------------
  // Subtract two complex numbers
  //-------------------------------------------------
  subtract : function (a, b)
  {
      return [a[0] - b[0], a[1] - b[1]];
  },

  //-------------------------------------------------
  // Multiply two complex numbers
  //
  // (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
  //-------------------------------------------------
  multiply : function (a, b) 
  {
      return [(a[0] * b[0] - a[1] * b[1]), 
              (a[0] * b[1] + a[1] * b[0])];
  },

  //-------------------------------------------------
  // Calculate |a + bi|
  //
  // sqrt(a*a + b*b)
  //-------------------------------------------------
  magnitude : function (offset,c) 
  {
      return Math.sqrt(c[offset]*c[offset] + c[offset+1]*c[offset+1]); 
  },
  
  phase : function (offset,c) 
  {
      return c[offset]!=0?Math.atan(c[offset+1]/c[offset])*180/Math.PI:(c[offset+1]>0?90:-90); 
  }

}

/*********** VECTOR ************/
function Vector(a,b) {
  var self = this;
  var i,columns,size,offset=0,dim=1,dtn,dt=Vector.options.dt,data;
  
  if (!(this instanceof Vector)) return new Vector(a,b);
  var options=isObject(b)?b:{};
  
  if (isNumber(a)) {
    // Create a new empty vector (rows=1)
    columns=a;
    if (options.type) dt=options.type;
    if (options.dtn)  dt=options.dtn=='Array'?Array:TypedArrayOfName[options.dtn];
    size=columns;
    if (options.complex) size *=2;
    if (options.dtn && !dt) throw ("Vector: Unknown array type dtn="+options.dtn)
    data=new dt(size);
  } else if (isArray(a)) {
    size=columns=a.length;
    if (options.type) dt=options.type;
    if (options.dtn)  dt=options.dtn=='Array'?Array:TypedArrayOfName[options.dtn];
    if (options.dtn && !dt) throw ("Vector: Unknown array type dtn="+options.dtn)
    if (options.dtn && options.dtn != 'Array') {
      // Create typedarray from generic array
      data=new dt(a);
    } else {
      // Matrix wrapper for generic arrays and array arrays
      // modify .get .set .getRow  prototype ...
      // no _Matrix.call
      dt=Array;
      data=a;
    }
  } else if (isObject(a)) {
    // partial object
    columns=a.columns;
    size=a.size||columns;
    scale=options.scale;
    if (options.dtn)  dt=options.dtn=='Array'?Array:TypedArrayOfName[options.dtn];
    if (options.dtn && !dt) throw ("Vector: Unknown array type dtn="+options.dtn)
    if (options.dtn && a.dtn != options.dtn) {
      // convert dtn
      if (isArray(a.data) && !scale)
        data=new dt(a.data);
      else {
        data=new dt(size);
        if (scale)  for(i=0;i<size;i++) data[i]=a.data[i]/scale;
        else        for(i=0;i<size;i++) data[i]=a.data[i];
      }
      dtn=options.dtn;
    } else {
      dtn=a.dtn;
      data=a.data;
      offset=a.offset;
    }
    if (a.scale) this.scale=a.scale;
    if (a.complex) this.complex=a.complex;
  } else if (isString(a)) {
    columns=a.length;
    if (options.type) dt=options.type;
    if (options.dtn)  dt=options.dtn=='Array'?Array:TypedArrayOfName[options.dtn];
    if (options.dtn && !dt) throw ("Vector: Unknown array type dtn="+options.dtn)
    data=new dt(toUTF8Array(a));
  }
  
  this.columns=columns;
  this.size=this.length=size;
  this.layout=1;
  this.data=data;
  this.dims=dim;
  this.offset=offset;
  if (options.complex) this.complex=true;
  if (options.scale)   this.scaler=options.scale;
  
  this.dtn=dtn||dt.name;
  
  if (this.dtn=='Array') this._arrayFix();
}
Vector.options = {
  dt : Float32Array,
  dtn : 'Float32Array'
}

/********* STATIC MEMBERS *********/
Vector.abs = function (m) {
  return Vector.clone(m).abs();
}

Vector.add = function (m,v) {
  return Vector.clone(m).add(v);
}

Vector.clone = function (src) {
  return Vector(src);
}

Vector.checkVector = function (o) {
  if (o instanceof Vector) return o;
  else return Vector(o);
}

Vector.cos = function (m) {
  return Vector.clone(m).cos();
}

Vector.div = function (m,v) {
  return Vector.clone(m).div(v);
}

Vector.empty = function (columns) {
  return Vector(columns);
}

Vector.exp = function (m) {
  return Vector.clone(m).exp();
}

isVector = Vector.isVector = function (o) {
  return (o instanceof Vector)
}

Vector.max =  function(vector1, vector2) {
  vector1 = Vector.checkVector(vector1);
  vector2 = Vector.checkVector(vector2);
  var columns =vector1.columns;
  var result = Vector(columns,{dtn:vector1.dtn});
  for (var i = 0; i< columns; i++) {
    result.data[i]= Math.max(vector1.data[i], vector2.data[i]);
  }
  return result;
}

Vector.min =  function(vector1, vector2) {
  vector1 = Vector.checkVector(vector1);
  vector2 = Vector.checkVector(vector2);
  var columns =vector1.columns;
  var result = Vector(columns,{dtn:vector1.dtn});
  for (var i = 0; i< columns; i++) {
    result.data[i]=Math.min(vector1.data[i], vector2.data[i]);
  }
  return result;
}

Vector.mod = function (m,v) {
  return Vector.clone(m).mod(v);
}

Vector.mul = function (m,v) {
  return Vector.clone(m).mul(v);
}

Vector.neg = function (m) {
  return Vector.clone(m).neg();
}

Vector.ones = function (columns) {
  return Vector(columns).fill(1);
}

Vector.rand = function (columns, rng) {
  if (rng==undefined) rng=Math.random;
  return Vector(columns).fill(function () {
    return rng();
  });
}

Vector.randInt = function (columns, maxValue, rng) {
  if (rng==undefined) rng=Math.random;
  return Vector(columns).fill(function () {
    return (rng()*maxValue)|0;
  });
}

Vector.sin = function (m) {
  return Vector.clone(m).sin();
}

Vector.sub = function (m,v) {
  return Vector.clone(m).sub(v);
}

Vector.zero = function (columns) {
  return Vector(columns).fill(0);
}



/********* INSTANCE MEMBERS *********/
// Fix some prototype methods for generic array data content
Vector.prototype._arrayFix = function () {
  var self=this;
  this.get=function (column)   { return self.data[self.offset+column] };
  this.set=function (column,v) { self.data[self.offset+column]=v };
}

Vector.prototype.abs = function (v) {
  var i,j;
  for(i=0;i<this.size;i++) this.data[i]=Math.abs(this.data[i]);
  return this; 
}

Vector.prototype.add = function (v) {
  var i,j;
  for(i=0;i<this.size;i++) this.data[i]+=v;
  return this; 
}

Vector.prototype.apply = function (f) {
  for(var i=0; i < this.columns; i++) 
    f.call(this,i)
}

Vector.prototype.clone = function () {
  return Vector(this);
}

Vector.prototype.cos = function (v) {
  var i,j;
  for(i=0;i<this.size;i++) this.data[i]=Math.cos(this.data[i]);
  return this; 
}

Vector.prototype.div = function (v) {
  var i,j;
  for(i=0;i<this.size;i++) this.data[i]/=v;
  return this; 
}

Vector.prototype.divide = function (column,k) {
  return this.data[column] /= k;
}

// Evaluate all elements x of matrix by applying function f(x)
Vector.prototype.eval = function (f) {
  var i;
  switch (this.dtn) {
    case 'Array':
      for(i=0; i < this.columns; i++) 
        this.set(i,f(this.get(i)))
      break;
    default:
      for(i=0;i<this.size;i++) this.data[i]=f(this.data[i],i);
  }
  return this;
}

Vector.prototype.exp = function (v) {
  var i,j;
  for(i=0;i<this.size;i++) this.data[i]=Math.exp(this.data[i]);
  return this; 
}

Vector.prototype.fill = function (valueOrFunction) {
  if (typeof valueOrFunction == 'function') {
      for(var i=0;i<this.columns;i++) {
        this.data[i]=valueOrFunction(i);
      } 
  } else this.data.fill(valueOrFunction);
  return this;
}

Vector.prototype.filter = function (f,asArray) {
  var i,j=0,res = Vector(this.columns,{dtn:asArray?'Array':this.dtn});
  for(i=0;i<this.columns;i++) {
    v=f(this.data[i],i);
    if (v) res.data[j]=this.data[i],j++;
  }
  return j<this.columns?res.slice(j):res;
}

Vector.prototype.get = function (column) {
  return this.data[this.offset+column];
}

Vector.prototype.imag = function (i) {
  if (this.complex) return this.get(i*2+1);
}

Vector.prototype.incr = function (column,delta) {
  return this.data[column] += delta;
}

Vector.prototype.info = function () {
  var i = {
    dtn:this.dtn,
    size:this.size,
    columns:this.columns,
    offset:this.offset,
  }
  if (this.scaler) i.scaler=this.scaler;
  if (this.complex) i.complex=true;
  return i;
}

isVector = Vector.isVector = function (o) {
  return (o instanceof Vector)
}

Vector.prototype.magnitude = function () {
  var res;
  if (this.complex) {
    res=Vector(this.columns,{dtn:this.dtn});
    for(var i=0; i < res.columns; i++) 
      res.data[i]=complex.magnitude(this.offset+i*2,this.data);
  }
  return res;
}

Vector.prototype.map = function (f,asArray) {
  var res = Vector(this.columns,{dtn:asArray?'Array':this.dtn});
  for(var i=0;j<this.columns;i++)
    res.data[i]=f(this.data[i],i);
  return res;
}

Vector.prototype.multiply = function (column,k) {
  return this.data[column] *= k;
}

Vector.prototype.mean = function (v) {
  return this.sum()/this.size;
}

Vector.prototype.mod = function (v) {
  var i,j;
  for(i=0;i<this.size;i++) this.data[i]=this.data[i]%v;
  return this; 
}

Vector.prototype.mul = function (v) {
  var i,j;
  for(var i=0;i<this.size;i++) this.data[i]*=v;
  return this; 
}

Vector.prototype.neg = function (v) {
  var i,j;
  for(var i=0;i<this.size;i++) this.data[i]=-this.data[i];
  return this; 
}

Vector.prototype.phase = function () {
  var res;
  if (this.complex) {
    res=Vector(this.columns,{dtn:this.dtn});
    for(var i=0; i < res.columns; i++) 
      res.data[i]=complex.phase(this.offset+i*2,this.data);
  }
  return res;
}

Vector.prototype.prod = function (v) {
  var i,j,v = 1;
  for (i = 0; i < this.size; i++) v *= this.data[i];
  return v;
}

Vector.prototype.print = function (format,transpose) {
  var j, s='';
  if (!format) format = '%4.2f';
  if (!this.complex)
    for(j=0;j<this.columns;j++) {
      if (j!=0) s = s + (transpose?' ':'\n');
      s = s + sprintf.sprintf(format,this.data[j]) ;
    }
  else
    for(j=0;j<this.columns;j=j+2) {
      if (j!=0) s = s + (transpose?' ':'\n');
      s = s + '('+sprintf.sprintf(format,this.data[j])+','+sprintf.sprintf(format,this.data[j+1])+')' ;
    }
  
  return s;
}

Vector.prototype.reduce = function (f) {
  return this.data.reduce(f);
}

Vector.prototype.real = function (i) {
  if (this.complex) return this.get(i*2);
}

Vector.prototype.resize = function (options) {
  if ((options.offset && (options.columns+options.offset) > this.columns) ||
      !options.columns) throw new Error('Vecotr.resize: invalid argument(s)');
  this.columns=options.columns;
  if (options.offset) this.offset=options.offset;
  this.size=this.length=this.columns;
  if (options.slice) 
    this.data=options.offset?this.data.slice(options.offset,options.columns+offset):
                             this.data.slice(0,options.columns);
  return this;
}

Vector.prototype.set = function (column,val) {
  this.data[this.offset+column]=val;
  return this;
}

Vector.prototype.sin = function (v) {
  var i,j;
  for(i=0;i<this.size;i++) this.data[i]=Math.sin(this.data[i]);
}

/*
size
Properties
size (number) : The number of elements in the matrix.
*/
Vector.prototype.size = function () {
  return  this.size;
}

/** Return new vecotr with sliced data
 *
 */
Vector.prototype.slice = function (columns,offset) {
  return Vector(this,{columns:columns,offset:offset,slice:true});
}

Vector.prototype.sub = function (v) {
  var i,j;
  for(i=0;i<this.size;i++) this.data[i]-=v;
  return this; 
}

Vector.prototype.subRange = function (columns,offset) {
  offset=checkOption(offset,0);
  var res=Vector({columns:columns,data:this.data.slice(offset,columns+offset),dtn:this.dtn});
  return res;
}

Vector.prototype.sum = function () {
  var sum=0;
  for(var i=0;i<this.size;i++) sum += this.data[i];
  return sum
}
module.exports = Vector;
