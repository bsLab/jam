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
 **    $VERSION:     1.3.3
 **
 **    $INFO:
 **
 **  Numerical Matrix Module associated with typed arrays, but with genery array compatibility. 
 **  A matrix provides a wrapper and multi-dimensional array view for one-dimensional byte arrays (typed arrays using buffers).
 **
 **    $ENDOFINFO
 */
 
Require('numerics/polyfill')
var sprintf = Require('com/sprintf');
var Vector = Require('numerics/vector');

var ALL = [], 
    FORALL = '*',
    FOREACH = 'x';
    
isRange   = function (v)  { return isArray(v) && v.length==2 }
isAll     = function (v)  { return v=='*' || (isArray(v) && v.length==0) }
isForEach = function (v)  { return v == FOREACH }
isArrayArray = function (v) { return isArray(v) && isArray(v[0]) }
isArrayArrayArray = function (v) { return isArray(v) && isArray(v[0]) && isArray(v[0][0]) }

integer = function (v)  { return Math.floor(v) }
divide = function (a,b) { return Math.floor(a/b) }


function todo (what) { throw ("Not implemented: Matrix."+what) }
function checkNumber(name, value) {
  if (typeof value !== 'number') {
    throw new TypeError(name+' must be a number');
  }
}
function transpose (layout) {
  switch (layout) {
    case 12: return 21;
    case 21: return 12;
  }
}
/********** TYPEDARRY/ARRAY Extension for Matrix/Vector compatibility *************/

// Most generic versions - always overwrite (polyfill/vector definitions)
  Object.defineProperty(Array.prototype, 'get', {value: function (i,j,k) {
    if (k!=undefined)
     return this[i][j][k];
    else if (j!=undefined)
     return this[i][j];
    else
     return this[i];
  }, configurable: true})

  Object.defineProperty(Array.prototype, 'getRow', {value: function (i) {
   return this[i];
  }, configurable: true})

  Object.defineProperty(Array.prototype, 'mapRow', {value:  function (f) {
   return this[i].map(f);
  }, configurable: true})

  Object.defineProperty(Array.prototype, 'set', {value: function (a,b,c,d) {
    if (d!=undefined)
     return this[a][b][c]=d;
    else if (c!=undefined)
     return this[a][b]=c;
    else
     return this[a]=b;
  }, configurable: true})

  Object.defineProperty(Array.prototype, 'setRow', {value: function (i,row) {
   return this[i]=row;
  }, configurable: true})

  Object.defineProperty(Array.prototype, 'print', {value: function (format) {
    var i,j,k,s='',sep='', info=this.info();
    if (!format) format = '%4.2f';
    switch (info.dims) {
      case 1:
        for(j=0;j<info.columns;j++) {
          if (j!=0) s = s + '\n';
          s = s + sprintf.sprintf(format,this[j]) ;
        }
        break;
      case 2:
        for(j=0;j<info.rows;j++) {
          sep = '';
          if (j!=0) s = s + '\n';
          for (i=0;i<info.columns;i++) {
            s = s + sep + sprintf.sprintf(format,this[j][i]) ;
            sep = ' ';
          }
        }
        break;
      case 3:
        for(k=0;k<info.levels;k++) {
          if (k!=0) s = s + '\n\n';
          for(j=0;j<info.rows;j++) {
            sep = '';
            if (j!=0) s = s + '\n';
            for (i=0;i<info.columns;i++) {
              s = s + sep + sprintf.sprintf(format,this[k][j][i]) ;
              sep = ' ';
            }
          }
        }
    }  
    return s;
  }, configurable: true})
  
  Object.defineProperty(Array.prototype, 'info', {value: function () {
    var rows,columns,levels;
    if (isArrayArrayArray(this)) levels=this.length,rows=this[0].length,columns=this[0][0].length;
    else if (isArrayArray(this)) rows=this.length,columns=this[0].length;
    else columns=this.length;
    if (levels) return {
      dtn:'Array',
      size:levels*rows*columns,
      levels:levels,
      rows:rows,
      columns:columns,
      dims:3,
      offset:0,
    }; else if (rows) return {
      dtn:'Array',
      size:rows*columns,
      rows:rows,
      columns:columns,
      dims:2,
      offset:0,
    }; else return {
      dtn:'Array',
      size:columns,
      columns:columns,
      dims:1,
      offset:0,
    }
  }, configurable: true})



/****************** MATRIX ***************************/
// Matrix object based on typed arrays!
// Supports mixed mode typed arrays and generic arrays!
// {type:function,dtn:string} specifies data type
//
// Usage:
// Matrix(columns:number)
// Matrix(rows:number,columns:number)
// Matrix(levels:number,rows:number,columns:number)
// Matrix(rows:number,columns:number,options:{dtn:string})
// Matrix([])
// Matrix([][])
// Matrix([][][])
// Matrix({data:buffer|typedarray,rows:numner,columns:number,dtn:..})
//
// typeof return = Matrix

function Matrix (a,b,c,d) {
  var self = this;
  var rows,columns,levels,dims=2,dtn,dt=Matrix.options.dt,data,
      layout=12,size,transpose;
  var options = isObject(d)?d:(isObject(c)?c:(isObject(b)?b:{}));
  if (!(this instanceof Matrix)) return new Matrix(a,b,c,d);
  if (isNumber(a) && isNumber(b)) {
    // Create new empty matrix (2/3 dims)
    rows=a;
    columns=b;
    if (isNumber(c)) levels=c;
    dims=levels?3:2;
    if (options.type) dt=options.type;
    if (options.dtn)  dt=options.dtn=='Array'?Array:TypedArrayOfName[options.dtn];
    if (options.layout) layout=options.layout;
    else layout=dims==2?12:123;
    size=rows*columns;
    if (levels) size *= levels;
    if (options.dtn && !dt) throw ("Matrix: Unknown array type dtn="+options.dtn)
    if (dt.name=='Array')
      data=new Array(rows).fill(null).map(function (row) { return new Array(columns).fill(0) });
    else
      data=new dt(size);
  } 
  else if (isNumber(a)) {
    // Create a new empty matrix vector (rows=1)
    rows=1;
    columns=a;
    dims=2;
    if (options.type) dt=options.type;
    if (options.dtn)  dt=TypedArrayOfName[options.dtn];
    if (options.layout) layout=options.layout;
    else layout=12;
    if (options.dtn && !dt) throw ("Matrix: Unknown array type dtn="+options.dtn)
    size=columns;
    data=new dt(size);
  } 
  else if (isArrayArray(a)) {
    rows=a.length;
    columns=a[0].length;
    if (isArrayArrayArray(a)) levels=rows,rows=a[0].length,columns=a[0][0].length;
    size=rows*columns;
    if (levels) size *= levels;
    dims=levels?3:2;
    if (options.type) dt=options.type;
    if (options.dtn)  {
      dt=TypedArrayOfName[options.dtn];
    }
    if (options.layout) layout=options.layout;
    else layout=dims==2?12:123;
    if (options.dtn && !dt) throw ("Matrix: Unknown array type dtn="+options.dtn)
    if (options.dtn && options.dtn != 'Array') {
      // Create typedarray from generic array
      data=new dt(size);
      switch (layout) {
        case 12:
          a.forEach(function (row,rowi) {
            row.forEach(function (col,coli) {
              data[coli+rowi*columns]=col;
            })
          });
          break;
        case 21:
          a.forEach(function (row,rowi) {
            row.forEach(function (col,coli) {
              data[rowi+coli*rows]=col;   // TBCHECK!
            })
          });
          break;
      }
    } else {
      // Matrix wrapper for generic arrays and array arrays
      // modify .get .set .getRow  prototype ...
      // no _Matrix.call
      dt=Array;
      data=a;
    }
  } else if (isArray(a)) {
    // Vector 
    rows=1;
    columns=a.length;
    size=columns;
    dims=2;
    if (options.type) dt=options.type;
    if (options.dtn)  dt=TypedArrayOfName[options.dtn];
    if (options.layout) layout=options.layout;
    else layout=12;
    if (options.dtn && !dt) throw ("Matrix: Unknown array type dtn="+options.dtn)
    if (options.dtn && options.dtn != 'Array') {
      // Create typedarray from generic array
      data=new dt(a);
    } else {
      // Matrix wrapper for generic arrays and array arrays
      // modify .get .set .getRow  prototype ...
      // no _Matrix.call
      dt=Array;
      data=[a];
    }
  } else if (a instanceof Matrix) {
    if (options.transpose) {
      // transposeView !
      rows=a.columns;
      columns=a.rows;
      levels=a.levels;
      size=a.size;
      dims=a.dims;
      transpose=true;
      data=a.data;
      dtn=a.dtn;
      switch (a.layout) {
        case 12: layout=21; break;
        case 21: layout=12; break;
        case 123: layout=321; break;
        case 321: layout=123; break;
      }
    } else {
      // Copy
      rows=options.rows||a.rows;
      columns=options.columns||a.columns;
      levels=options.levels||a.levels;
      dims=a.dims;
      size=rows*columns;
      if(levels) size*=levels;
      transpose=false;
      scale=options.scale;
      if ((options.dtn && options.dtn != a.dtn) || size != a.size) {
        // convert or resize dtn
        dtn = options.dtn;
        data=new dt(size);
        if (scale)  for(i=0;i<size;i++) data[i]=a.data[i]/scale;
        else        for(i=0;i<size;i++) data[i]=a.data[i];
      } else {
        dtn=a.dtn;
        if (dtn != 'Array')
          data=a.data.slice();
        else {
          // TODO dims=3
          data=a.data.map(function (row) { return row.slice() });
        }
      }
      if (a.scale) this.scale=a.scale;
      if (a.complex) this.complex=a.complex;
      layout=a.layout;
    }
  } else if (isObject(a) && a.data) {
    // Partial matrix object
      rows=a.rows||(a.y && a.x);
      columns=a.columns||a.y||a.x;
      levels=a.levels||a.z;
      size=a.size||((rows?rows:1)*(columns?columns:1)*(levels?levels:1));
      dims=a.dims||(levels?3:(rows?2:1));
      layout=a.layout||(levels?123:(rows?12:1));
      dtn=a.dtn;
      data=a.data;
  }
  if (levels) this.levels=levels;   // z
  this.rows=rows;                   // x
  this.columns=columns;             // x/y
  this.size=size;
  this.layout=layout;
  this.data=data;
  this.dims=dims;
  this.length=levels?levels:(rows?rows:columns);
  
  this.dtn=dtn||dt.name;
  if (options.complex) this.complex=true;
  if (options.scale)   this.scaler=options.scale;
  
  // get/set index order: 
  // 1. column(x)
  // 2. row(x),column(y)
  // 3. row(x),column(y),level(z)
  
  if (this.dtn=='Array') {
    switch (this.layout) {
      case 12:
        this.get=function (row,column)   { return this.data[row][column] };
        this.set=function (row,column,v) { this.data[row][column]=v };
        break;
      case 21:
        // transposed view
        this.get=function (column,row)   { return this.data[row][column] };
        this.set=function (column,row,v) { this.data[row][column]=v };
        break;
      case 123:
        this.get=function (row,column,level)   { return this.data[row][column][level] };
        this.set=function (row,column,level,v) { this.data[row][column][level]=v };
        break;
     }
  } else switch (this.layout) {
    case 1:
      // x=column
      this.index = function (x)     { return x }
      this.get = function (x)       { return this.data[x] }
      this.set = function (x,v)     { return this.data[x]=v }
      break;
    case 12:
      // x=row,y=column
      this.index = function (x,y)   { return x*self.columns+y}
      this.get = function (x,y)     { return this.data[x*this.columns+y] }
      this.set = function (x,y,v)   { return this.data[x*this.columns+y]=v }
      break;
    case 21:
      // x=row,y=column      
      this.index = function (x,y)   { return y*this.rows+x }
      this.get = function (x,y)     { return this.data[y*this.rows+x] }
      this.set = function (x,y,v)   { return this.data[y*this.rows+x]=v }
      break;
    case 123:
      // x=row,y=column,z=level
      this.index = function (x,y,z) { return z+y*self.columns+x*this.columns*this.rows }
      this.get = function (x,y,z)   { return this.data[z+y*this.levels*this.rows+x*this.levels] }
      this.set = function (x,y,z,v) { return this.data[z+y*this.levels*this.rows+x*this.levels]=v }
      break;
    case 321:
      // x=row,y=column,z=level
      // TBC
      this.index = function (x,y,z) { return x+y*self.rows+z*this.columns*this.rows }
      this.get = function (x,y,z)   { return this.data[x+y*this.rows+z*this.columns*this.rows] }
      this.set = function (x,y,z,v) { return this.data[x+y*self.rows+z*this.columns*this.rows]=v }
      break;
  }
}



Matrix.options = {
  dt : Float32Array,
  dtn : 'Float32Array'
}


/******** STATIC MEMBERS ********/
Matrix.abs = function (m) {
  return Matrix.clone(m).abs();
}

Matrix.add = function (m,v) {
  return Matrix.clone(m).add(v);
}

Matrix.clone = function (src) {
  return Matrix(src);
}

Matrix.columnVector = function (array) {
  return Matrix(array)
}

// Return an (typed)array
Matrix.checkArray = function (arrayOrMatrix) {
  if (arrayOrMatrix instanceof _MatrixConstructor) return arrayOrMatrix.data;
  else return arrayOrMatrix;
}

// Return a Matrix
Matrix.checkMatrix = function (arrayOrMatrix) {
  if (arrayOrMatrix instanceof Matrix) return arrayOrMatrix;
  else return Matrix(arrayOrMatrix);
}

Matrix.checkMatrixSize = function (matrix1,matrix2) {
  if (matrix1.dims != matrix2.dims) return false;
  if (matrix1.rows != matrix2.rows ||
      matrix1.columns != matrix2.columns ||
      matrix1.levels != matrix2.levels ) return false;
}

Matrix.cos = function (m) {
  return Matrix.clone(m).cos();
}

Matrix.diag = function (array,rows,columns) {
  if (!rows) rows=array.length;
  if (!columns) columns=rows;
  if (rows!=columns) Matrix.error("Not a square matrix",'diag');
  return Matrix(rows,columns).fill(function (i,j) {
    return i==j?array[i]:0;
  })
}

Matrix.div = function (m,v) {
  return Matrix.clone(m).div(v);
}

Matrix.empty = function (rows,columns) {
  return Matrix(rows,columns);
}

Matrix.error = function (what,where,ref) {
  throw new Error((where?('Matrix.'+where+': '):'')+what);
}

Matrix.errorRange = function (what,where,ref) {
  throw new RangeError((where?('Matrix.'+where+': '):'')+what);
}

Matrix.eye = function (rows,columns,val,options) {
  if (!val) val=1;
  if (!columns) columns=rows;
  return Matrix(rows,columns,options).fill(function (i,j) {
    return i==j?val:0;
  });
}

Matrix.exp = function (m) {
  return Matrix.clone(m).exp();
}

isMatrix = Matrix.isMatrix = function (o) {
  return (o instanceof Matrix)
}

Matrix.max =  function(matrix1, matrix2) {
  var result;
  matrix1 = this.checkMatrix(matrix1);
  matrix2 = this.checkMatrix(matrix2);
  if (!this.checkMatrixSize(matrix1,matrix2)) Matrix.error('matrix1 not compatble with matrix2','max');
  var rows = matrix1.rows;
  var columns = matrix1.columns;
  var levels = matrix1.levels;
  switch (matrix1.dims) {
    case 1:
      break;
    case 2:
      result = Matrix(rows, columns, {dtn:matrix1.dtn});
      for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {
          result.set(i, j, Math.max(matrix1.get(i, j), matrix2.get(i, j)));
        }
      }
      break;
    case 3:
      break;
  }
  return result;
}

Matrix.min =  function(matrix1, matrix2) {
  var result;
  matrix1 = this.checkMatrix(matrix1);
  matrix2 = this.checkMatrix(matrix2);
  if (!this.checkMatrixSize(matrix1,matrix2)) Matrix.error('matrix1 not compatble with matrix2','min');
  var rows = matrix1.rows;
  var columns = matrix1.columns;
  var levels = matrix1.levels;
  switch (matrix1.dims) {
    case 1:
      break;
    case 2:
      result = Matrix(rows, columns, levels, {dtn:matrix1.dtn});
      for (var i = 0; i < rows; i++) {
        for (var j = 0; j < columns; j++) {
          result.set(i, j, Math.min(matrix1.get(i, j), matrix2.get(i, j)));
        }
      }
      break;
  }
  return result;
}


Matrix.mod = function (m,v) {
  return Matrix.clone(m).mod(v);
}

Matrix.mul = function (m,v) {
  return Matrix.clone(m).mul(v);
}

Matrix.neg = function (m) {
  return Matrix.clone(m).neg();
}

Matrix.ones = function (rows,columns) {
  return Matrix(rows,columns).fill(1);
}

Matrix.rand = function (rows, columns, rng) {
  if (rng==undefined) rng=Math.random;
  return Matrix(rows,columns).fill(function () {
    return rng();
  });
}

Matrix.randInt = function (rows, columns, maxValue, rng) {
  if (rng==undefined) rng=Math.random;
  return Matrix(rows,columns).fill(function () {
    return (rng()*maxValue)|0;
  });
}

Matrix.sin = function (m) {
  return Matrix.clone(m).sin();
}

Matrix.sub = function (m,v) {
  return Matrix.clone(m).sub(v);
}

Matrix.zero = function (rows,columns) {
  return Matrix(columns,rows).fill(0);
}


/********* INSTANCE MEMBERS *********/


Matrix.prototype.abs = function (v) {
  this.eval(Math.abs);
  return this; 
}

Matrix.prototype.add = function (v) {
  this.eval(function (x) {return x+v});
  return this; 
}

Matrix.prototype.apply = function (f) {
  var i,j,k;
  switch (this.dims) {
    case 1:
      for(j=0; j < this.columns; j++) 
        f.call(this,j)
      return this;
    case 2:
      for(i=0; i<this.rows;i++) 
        for(j=0; j < this.columns; j++) 
          f.call(this,i,j)
      return this;
    case 3:
      for(i=0; i<this.rows;i++) 
        for(j=0; j < this.columns; j++) 
          for(k=0; k<this.levels;k++) 
            f.call(this,i,j,k)
      return this;
  }
}

Matrix.prototype.checkMatrixDims = function(dims) {
  if (this.dims != dims) this.errorRange('Matrix has not expected dimension '+dims);
}

/**
 * @private
 * Check that a column index is not out of bounds
 * @param {Matrix} matrix
 * @param {number} index
 * @param {boolean} [outer]
 */
Matrix.prototype.checkColumnIndex = function(index, outer) {
  var max = outer ? this.columns : this.columns - 1;
  if (index < 0 || index > max) this.errorRange('Column index out of range');
}


/**
 * @private
 * Check that a row index is not out of bounds
 * @param {Matrix} matrix
 * @param {number} index
 * @param {boolean} [outer]
 */
Matrix.prototype.checkRowIndex = function(index, outer) {
  var max = outer ? this.rows : this.rows - 1;
  if (index < 0 || index > max)
    this.errorRange('Row index out of range');
}

/**
 * @private
 * Check that the provided vector is an array with the right length
 * @param {Matrix} matrix
 * @param {Array|Matrix} vector
 * @return {Array}
 * @throws {RangeError}
 */
Matrix.prototype.checkRowVector = function(vector) {
  if (vector.to1DArray) {
    vector = vector.to1DArray();
  }
  if (vector.length !== this.columns) 
    this.errorRange(
      'vector size must be the same as the number of columns'
    );
  
  return vector;
}

/**
 * @private
 * Check that the provided vector is an array with the right length
 * @param {Matrix} matrix
 * @param {Array|Matrix} vector
 * @return {Array}
 * @throws {RangeError}
 */
Matrix.prototype.checkColumnVector = function(vector) {
  if (vector.to1DArray) {
    vector = vector.to1DArray();
  }
  if (vector.length !== this.rows) 
    this.errorRange('vector size must be the same as the number of rows');
  
  return vector;
}

Matrix.prototype.checkIndices = function(rowIndices, columnIndices) {
  return {
    row: this.checkRowIndices(rowIndices),
    column: this.checkColumnIndices(columnIndices)
  };
}

Matrix.prototype.checkRowIndices = function(rowIndices) {
  var self=this;
  if (typeof rowIndices !== 'object') {
    throw new TypeError('unexpected type for row indices');
  }

  var rowOut = rowIndices.some(function (r) {
    return r < 0 || r >= self.rows;
  });

  if (rowOut) {
    throw new RangeError('row indices are out of range');
  }

  if (!Array.isArray(rowIndices)) rowIndices = Array.from(rowIndices);

  return rowIndices;
}

Matrix.prototype.checkColumnIndices = function(columnIndices) {
  var self=this;
  if (typeof columnIndices !== 'object') {
    throw new TypeError('unexpected type for column indices');
  }

  var columnOut = columnIndices.some(function (c) {
    return c < 0 || c >= self.columns;
  });

  if (columnOut) {
    throw new RangeError('column indices are out of range');
  }
  if (!Array.isArray(columnIndices)) columnIndices = Array.from(columnIndices);

  return columnIndices;
}

Matrix.prototype.checkRange = function(startRow, endRow, startColumn, endColumn) {
  if (arguments.length !== 4) {
    throw new RangeError('expected 4 arguments');
  }
  checkNumber('startRow', startRow);
  checkNumber('endRow', endRow);
  checkNumber('startColumn', startColumn);
  checkNumber('endColumn', endColumn);
  if (
    startRow > endRow ||
    startColumn > endColumn ||
    startRow < 0 ||
    startRow >= this.rows ||
    endRow < 0 ||
    endRow >= this.rows ||
    startColumn < 0 ||
    startColumn >= this.columns ||
    endColumn < 0 ||
    endColumn >= this.columns
  ) {
    throw new RangeError('Submatrix indices are out of range');
  }
}

Matrix.prototype.clone = function () {
  return Matrix(this);
}

/** Copy (1) a sorurce array (vector) into this matrix (row/column w or w/o subrange), or (2) create a copy of this matrix (empty argument list)
 *
 * copy()
 * copy([a,b]|[],[v1,v2,...])
 * copy(number,[a,b]|[],[v1,v2,...])
 * copy([a,b]|[],number,[v1,v2,...])
 * copy(number,number,[a,b]|[],[v1,v2,...])
 * ..
 */
 
Matrix.prototype.copy = function (a,b,c,d) {
  var x,y,z,rx,ry,rz,i,j,k,src;

  if (isNumber(a)) i=a;
  if (isNumber(b)) j=b;
  if (isNumber(c)) k=c;
  if (isArray(a)) rx=a;
  if (isArray(b)) ry=b;
  if (isArray(c)) rz=c;

  if (isArray(d)) src=d;
  if (isVector(d)) src=d;
  
  if (!src && !d && (isArray(c) || isVector(c))) src=c,rz=undefined;
  if (!src && !c && (isArray(b) || isVector(b))) src=b,ry=undefined;
  if (!src && !a && (isArray(a) || isVector(a))) src=a,rx=[0,this.columns-1];  // 1-dim only
    
  if (isVector(src)) src=src.data;
  if (!src) return Matrix({
    rows:this.rows,
    columns:this.columns,
    levels:this.levels,
    dtn:this.dtn,
    layout:this.layout,
    data:this.data.slice()
  })
  
  if (!src) throw "Matrix.copy: no source array provided";
  if (rx && rx.length==0) rx=[0,this.rows-1];
  if (ry && ry.length==0) ry=[0,this.columns-1];
  if (rz && rz.length==0) rz=[0,this.levels-1];
  if (rx && (rx[1]-rx[0]+1)!=src.length) throw "Matrix.copy: range mismatch (src)"
  if (ry && (ry[1]-ry[0]+1)!=src.length) throw "Matrix.copy: range mismatch (src)"
  if (rz && (rz[1]-rz[0]+1)!=src.length) throw "Matrix.copy: range mismatch (src)"
   
  switch (this.dims) {
    case 1:
      for(x=rx[0];x<rx[1];x++) this.data[x]=src[x-rx[0]];
      break;
    case 2:
      if (rx && j != undefined)
        for(x=rx[0];x<=rx[1];x++) 
          this.data[this.index(x,j)]=src[x-rx[0]];
      else if (i != undefined && ry)
        for(y=ry[0];y<=ry[1];y++) 
          this.data[this.index(i,y)]=src[y-ry[0]];
      else todo('copy 2'); 
      break;   
    case 3:
      if (rx && j != undefined && k != undefined)
        for(x=rx[0];x<=rx[1];x++) 
          this.data[this.index(x,j,k)]=src[x-rx[0]];
      else if (ry && i != undefined && k != undefined)
        for(y=ry[0];y<=ry[1];y++) 
          this.data[this.index(i,y,k)]=src[y-ry[0]];
      else if (rz && i != undefined && j != undefined)
        for(z=rz[0];z<=rz[1];z++) 
          this.data[this.index(i,j,z)]=src[z-rz[0]];
      else todo('copy 3');    
      break;
  }
  return this;
}

/** Convert size using a data filter.
 ** The target size must be provided.
 *  typeof @filter = 'mean' | 'peak' | 'min' | 'max' | 'win' | 'exp' | 'exp-peak' | function (a:number,b:number,i:number) -> number 
 */

Matrix.prototype.convert = function (a,b,c,d) {
  var i,j,k,d,v,m,ni,nj,nk,filter;
  
  if (isNumber(a)) i=a;
  if (isNumber(b)) j=b;
  if (isNumber(c)) k=c;
  if (isString(b)) filter=b;
  if (isString(c)) filter=c;
  if (isString(d)) filter=d;
  if (!filter) filter='mean';

  if (!i) throw "Matrix.convert: no target size (number)";
    
  m = Matrix(i,j,k);
      
  switch (filter) {
    case 'mean':      filter=function (a,b,i,n) { if (i==n-1) return (a+b)/n; else return a+b }; break;
    case 'exp':       filter=function (a,b,i,n) { return (a+b)/2 }; break;
    case 'exp-peak':  filter=function (a,b,i,n) { return (Math.abs(a)+Math.abs(b))/2 }; break;
    case 'peak':      filter=function (a,b,i,n) { if (Math.abs(a)>Math.abs(b)) return Math.abs(a); else return Math.abs(a); }; break;
    case 'min':       filter=function (a,b,i,n) { return a<b?a:b }; break;
    case 'max':       filter=function (a,b,i,n) { return a>b?a:b }; break;
    default:          filter = function () { return 0 }
  }
  switch (this.dims) {
    case 1:
      ni=Math.floor(this.i/m.i);
      for(i=0;i<m.i;i++) {
        v=this.data[i*ni]; 
        for(d=1;d<ni;d++) {
          v=filter(v,this.data[i*ni+d],d,ni);
        }
        m.data[i]=v;
      }
      break;
  }
  return m;
}


Matrix.prototype.cos = function (v) {
  this.eval(Math.cos);
  return this; 
}

Matrix.prototype.diag = function (v) {
  // TODO Vector
  var a = [];
  if (this.rows!=this.columns) return;
  for(var i=0;i<this.rows;i++) a.push(this.data[i+i*this.i]);
  return a; 
}

Matrix.prototype.dim = function () {
  switch (this.dims) {
    case 1: return [this.columns];
    case 2: return [this.rows,this.columns];
    case 3: return [this.rows,this.columns,this.levels];
  }
}

Matrix.prototype.div = function (v) {
  this.eval(function (x) {return x/v});
  return this; 
}

Matrix.prototype.divide = function (a,b,c,d) {
  switch (this.dims) {
    case 1: return this.set(a,this.get(a)/b);
    case 2: return this.set(a,b,this.get(a,b)/c);
    case 3: return this.set(a,b,c,this.get(a,b,c)/d);
  }
}

Matrix.prototype.error = function (what,where) {
  throw new Error((where?('Matrix.'+where+': '):'')+what);
}

Matrix.prototype.errorRange = function (what,where) {
  throw new RangeError((where?('Matrix.'+where+': '):'')+what);
}

// Evaluate all elements x of matrix by applying function f(x)
Matrix.prototype.eval = function (f) {
  var i,j,k;
  switch (this.dtn) {
    case 'Array':
      switch (this.dims) {
        case 1:
          for(i=0; i < this.columns; i++) 
            this.set(i,f(this.get(i)))
          break;
        case 2:
          for(i=0; i < this.rows;i++) 
            for(j=0; j < this.columns; j++) 
              this.set(i,j,f(this.get(i,j)))
          break
        case 3:
          for(i=0; i < this.rows;i++) 
            for(j=0; j < this.columns; j++) 
              for(k=0; k < this.levels; k++) 
                this.set(i,j,k,f(this.get(i,j,k)))
          break;
      }
      break;
    default:
      for(i=0;i<this.size;i++) this.data[i]=f(this.data[i]);
  }
  return this;
}

Matrix.prototype.exp = function (v) {
  this.eval(Math.exp);
  return this; 
}

Matrix.prototype.fill = function (valueOrFunction) {
  if (typeof valueOrFunction == 'function') {
    switch (this.dims) {
      case 1:
        for(i=0; i < this.columns; i++) 
          this.set(i,valueOrFunction(i.j))
        return this;
      case 2:
        for(i=0; i < this.rows;i++) 
          for(j=0; j < this.columns; j++) 
            this.set(i,j,valueOrFunction(i,j))
        return this;
      case 3:
        for(i=0; i < this.rows;i++) 
          for(j=0; j < this.columns; j++) 
            for(k=0; k < this.levels; k++) 
              this.set(i,j,k,valueOrFunction(i,j,k))
        return this;
    }
  } else this.data.fill(valueOrFunction);
  return this;
}


Matrix.prototype.getCol = function (index,asVector) {
  // TODO
}

// Return array or vector
Matrix.prototype.getRow = function (index,asVector) {
  this.checkMatrixDims(2);
  this.checkRowIndex(index);
  var row,data,i,j;
  switch (this.dtn) {
    case 'Array':
      if (this.layout==12) {
        if (!asVector)
          return this.data[index];
        else
          return Vector(this.data[index]);
      } else {
        // transposed view
        if (!asVector) {
          row = new Array(this.columns);
          if (this.rows==1) return this.data;
          for (i = 0; i < this.columns; i++) {
            row[i] = this.get(index, i);
          }
        } else {
          if (this.rows==1) return this.data;
          row= Vector(this.columns,{dtn:this.dtn});
          for (i = 0; i < this.columns; i++) {
            row.set(i, this.get(index, i));
          };
        }  
      }
      break;
    default:
      // With advanced slicing
      if (!asVector) {
        row = new Array(this.columns);
        if (this.rows==1) return this.data;
        for (i = 0; i < this.columns; i++) {
          row[i] = this.get(index, i);
        }
      } else if (this.layout == 12) {
        // data = this.data.slice(index*this.columns,(index+1)*this.columns);
        row= Vector({dtn:this.dtn,data:this.data,offset:index*this.columns,columns:this.columns});
      } else {
        if (this.rows==1) return this.data;
        row= Vector(this.columns,{dtn:this.dtn});
        for (i = 0; i < this.columns; i++) {
          row.set(i, this.get(index, i));
        };
      }   
  }
  
  return row;
}

// x += delta
Matrix.prototype.incr = function (a,b,c,d) {
  switch (this.dims) {
    case 1: return this.set(a,this.get(a)+b);
    case 2: return this.set(a,b,this.get(a,b)+c);
    case 3: return this.set(a,b,c,this.get(a,b,c)+d);
  }
}

Matrix.prototype.info = function () {
  var o = {
    dtn:this.dtn,
    size:this.size,
    columns:this.columns,
    layout:this.layout,
    dims:this.dims
  }
  if (this.rows) o.rows=this.rows;
  if (this.levels) o.levels=this.levels;
  if (this.scaler) o.scaler=this.scaler;
  if (this.complex) o.complex=true;
  return o;
}


Matrix.prototype.isColumnVector = function () {
   return this.columns === 1;
}

Matrix.prototype.isEchelonForm = function () {
  this.checkMatrixDims(2);
  var i = 0;
  var j = 0;
  var previousColumn = -1;
  var isEchelonForm = true;
  var checked = false;
  while ((i < this.rows) && (isEchelonForm)) {
    j = 0;
    checked = false;
    while ((j < this.columns) && (checked === false)) {
      if (this.get(i, j) === 0) {
        j++;
      } else if ((this.get(i, j) === 1) && (j > previousColumn)) {
        checked = true;
        previousColumn = j;
      } else {
        isEchelonForm = false;
        checked = true;
      }
    }
    i++;
  }
  return isEchelonForm;
}

Matrix.prototype.isReducedEchelonForm = function () {
  this.checkMatrixDims(2);
  var i = 0;
  var j = 0;
  var previousColumn = -1;
  var isReducedEchelonForm = true;
  var checked = false;
  while ((i < this.rows) && (isReducedEchelonForm)) {
    j = 0;
    checked = false;
    while ((j < this.columns) && (checked === false)) {
      if (this.get(i, j) === 0) {
        j++;
      } else if ((this.get(i, j) === 1) && (j > previousColumn)) {
        checked = true;
        previousColumn = j;
      } else {
        isReducedEchelonForm = false;
        checked = true;
      }
    }
    for (var k = j + 1; k < this.rows; k++) {
      if (this.get(i, k) !== 0) {
        isReducedEchelonForm = false;
      }
    }
    i++;
  }
  return isReducedEchelonForm;
}
Matrix.prototype.isRowVector = function () {
   return this.rows === 1;
}

Matrix.prototype.isSquare = function () {
  return this.rows==this.columns
}

Matrix.prototype.isSymmetric = function () {
  if (this.isSquare()) {
        for (var i = 0; i < this.rows; i++) {
          for (var j = 0; j <= i; j++) {
            if (this.get(i, j) !== this.get(j, i)) {
              return false;
            }
          }
        }
        return true;
      }
  return false;
}

/** Iterate over matrix elements
 * Parameter arrays specify iteration ranges, FORALL='*' specifies a target vector range
 * iter(function (@elem,@index,@array))
 * iter(number [],function)
 * iter(number [],number [],function)
 * iter(number [],number [],number [],function)
 * Examples: 
 *  m.iter(FORALL,[],[],f)   <=> for all x-vectors with y in [0,j-1], z in [0,k-1] do .. 
 *  m.iter([], FORALL,[],f)  <=> for all y-vectors with x in [0,j-1], z in [0,k-1] do .. 
 *  m.iter([],[],[],f)       <=> for all values with x in [0,i-1], y in [0,j-1], z in [0,k-1] do .. 
 *  m.iter(f)                <=> for all values with x in [0,i-1], y in [0,j-1], z in [0,k-1] do .. 
 *
 *
 */
  
Matrix.prototype.iter = function (a,b,c,d) {
  var func,rx,ry,rz,x,y,z,
      self=this;
  if (isFunction(a)) func=a;
  else if (isFunction(b)) func=b;
  else if (isFunction(c)) func=c;
  else if (isFunction(d)) func=d;
  if (isArray(a)) rx=a;
  if (isArray(b)) ry=b;
  if (isArray(c)) rz=c;
  if (isString(a)) rx=a;
  if (isString(b)) ry=b;
  if (isString(c)) rz=c;
  if (!func) throw "Matrx.iter: no function supplied";
  if (!rx && !ry && !rz) // linear iteration over all elements
    return this.data.forEach(func);
  switch (this.dims) {
    case 1: break;
  // TODO
      todo('iter 1')
    case 2: break;
  // TODO
      todo('iter 2')
    case 3:
      if (isArray(rx) && rx.length==0) rx=[0,this.rows];
      if (isArray(ry) && ry.length==0) ry=[0,this.columns];
      if (isArray(rz) && rz.length==0) rz=[0,this.levels];
      if (rz == FORALL) {
        for(x=rx[0];x<rx[1];x++) {
          for(y=ry[0];y<ry[1];y++) {
            func(x,y,this.subMatrixRange(x,y,ALL))
          }
        }
      } else if (rx==FORALL) {
  // TODO
        todo('iter 3.ryx=FORALL')
      
      } else if (ry==FORALL) {
  // TODO
        todo('iter 3.ry=FORALL')
      
      } else {
        // single data cell iteration
  // TODO
        todo('iter 3')
      }
  }
  // TODO
  return this;
}

Matrix.prototype.map = function (f,asArray) {
  var res,i,j,k;
  switch (this.dims) {
    case 1:
      res = Matrix(this.columns,{dtn:asArray?'Array':this.dtn});
      for(j=0;j<this.columns;j++)
        res.set(j,f(this.get(j),j));
      break;
    case 2:
      res = Matrix(this.rows,this.columns,{dtn:asArray?'Array':this.dtn});
      for(i=0;i<this.rows;i++)
        for(j=0;j<this.columns;j++)
          res.set(i,j,f(this.get(i,j),i,j));
      break;
    case 3:
      res = Matrix(this.rows,this.columns,this.levels,{dtn:asArray?'Array':this.dtn});
      for(i=0;i<this.rows;i++)
        for(j=0;j<this.columns;j++)
          for(k=0;k<this.levels;k++)
            res.set(i,j,k,f(this.get(i,j,k),i,j,k));
      break;
  }
  return res;
}


// Row mapping function
Matrix.prototype.mapRow = function (f) {
  var res=[];
  for(var row=0;row<this.rows;row++) {
    res.push(f(this.getRow(row)));
  }
  return res;
}

/** Return minimum and maximum value of the matrix
 *
 */
Matrix.prototype.minmax = function () {
  var d0=Number.MAX_VALUE,d1=Number.MIN_VALUE;
  for (i = 0;i < this.size; i++) {
    d0=Math.min(d0,this.data[i]);
    d1=Math.max(d1,this.data[i]);    
  }
  return { min:d0, max:d1 };
}

Matrix.prototype.mapToArray = function (f) {
  var res = new Array(this.size);
  for(var i=0;i<this.rows;i++)
    for(var j=0;j<this.columns;j++)
      res[i*this.columns+j]=f(this.get(i,j),i,j);
  return res;
}

// x *= k
Matrix.prototype.multiply = function (a,b,c,d) {
  switch (this.dims) {
    case 1: return this.set(a,this.get(a)*b);
    case 2: return this.set(a,b,this.get(a,b)*c);
    case 3: return this.set(a,b,c,this.get(a,b,c)*d);
  }
}

Matrix.prototype.mean = function (v) {
  return this.sum()/this.size;
}

Matrix.prototype.mod = function (v) {
  this.eval(function (x) {return x%v});
  return this; 
}

/**
     * Returns the matrix product between this and other
     * @param {Matrix} other
     * @return {Matrix}
     */
Matrix.prototype.mmul = function (other) {
  this.checkMatrixDims(2);
  other = Matrix.checkMatrix(other);
  if (this.columns !== other.rows) {
    // eslint-disable-next-line no-console
    console.warn('Number of columns of left matrix are not equal to number of rows of right matrix.');
  }

  var m = this.rows;
  var n = this.columns;
  var p = other.columns;

  var result = Matrix(m, p, {dtn:this.dtn});

  var Bcolj = new Array(n);
  for (var j = 0; j < p; j++) {
    for (var k = 0; k < n; k++) {
      Bcolj[k] = other.get(k, j);
    }
    for (var i = 0; i < m; i++) {
      var s = 0;
      for (k = 0; k < n; k++) {
        s += this.get(i, k) * Bcolj[k];
      }
      result.set(i, j, s);
    }
  }
  return result;
}

Matrix.prototype.mul = function (v) {
  this.eval(function (x) {return x*v});
  return this; 
}

Matrix.prototype.neg = function (v) {
  this.eval(function (x) {return -x});
  return this; 
}

Matrix.prototype.prod = function (v) {
  var i,j,k,v = 1;
  // Comp. mode
  switch (this.dtn+this.dims) {
    case 'Array1':
      for (i = 0; i < this.columns; i++) {
          v *= this.data[i];
      }
      break;
    case 'Array2':
      for (i = 0; i < this.rows; i++) {
        for (j = 0; j < this.columns; j++) {
          v *= this.data[i][j];
        }
      }
      break;
    case 'Array3':
      for (i = 0; i < this.rows; i++) {
        for (j = 0; j < this.columns; j++) {
          for (k = 0; k < this.levels; k++) {
            v *= this.data[i][j][k];
          }
        }
      }
      break;
    default:
      for (i = 0; i < this.size; i++) v *= this.data[i];
  }
  return v;
}

Matrix.prototype.print = function (format) {
  var i,j,k,s='',sep='';
  if (!format) format = '%4.2f';
  switch (this.dims) {
    case 1:
      for(i=0;i<this.columns;i++) {
        if (i!=0) s = s + '\n';
        s = s + sprintf.sprintf(format,this.get(i)) ;
      }
      break;
    case 2:
      for(i=0;i<this.rows;i++) {
        sep = '';
        if (i!=0) s = s + '\n';
        for (j=0;j<this.columns;j++) {
          s = s + sep + sprintf.sprintf(format,this.get(i,j)) ;
          sep = ' ';
        }
      }
      break;
    case 3:
      for(k=0;k<this.levels;k++) {
        if (k!=0) s = s + '\n\n';
        for(i=0;i<this.rows;i++) {
          sep = '';
          if (i!=0) s = s + '\n';
          for (j=0;j<this.columns;j++) {
            s = s + sep + sprintf.sprintf(format,this.get(i,j,k)) ;
            sep = ' ';
          }
        }
      }
  }  
  return s;
}

/** Reduce dimension: Linear matrix data reduction applying a function (a,b) -> c to all elements.
 *  Returns a scalar value or any other object accumulated by the supplied function
 */
Matrix.prototype.reduce = function (f) {
  return this.data.reduce(f);
}

/** resize matrix (only modifying meta data - not buffer data)
 *
 */
Matrix.prototype.resize = function (options) {
  for(var p in options) {
    switch (p) {
      case 'rows':
      case 'columns':
      case 'levels':
        this[p]=options[p];
        break;
    }
  }
  this.size=this.columns*(this.rows?this.rows:1)*(this.levels?this.levels:1);
  this.length=this.rows?this.rows:this.columns;
  return this
}


Matrix.prototype.reverseRow = function (row) {
  var t,len=this.columns;
  for(var i=0;i<(len/2)|0;i++) {
    t=this.get(row,i);
    this.set(row,i,this.get(row,len-i-1));
    this.set(row,len-i-1,t);
  }
  return this; 
}

/** Scale (and/or adjust offset optionally of) all matrix elements -= offset *= k
 * scale(k)
 * scale(k,inplace:boolean)
 * scale(k,offset)
 * scale(k,offset,inplace:boolean)
 */
 
Matrix.prototype.scale = function (a,b,c) {
  var m,k=1,offset,inplace=false;
  if (isNumber(a)) k=a;
  if (isBoolean(b)) inplace=b;
  else if (isBoolean(c)) inplace=c;
  if (isNumber(b)) offset=b;
  else if (isNumber(c)) offset=c;
  
  m = inplace?this:this.copy();
  if (k!=1) {
    if (offset)
      for(var i=0;i<m.data.length;i++) m.data[i]=(m.data[i]-offset)*k;
    else
      for(var i=0;i<m.data.length;i++) m.data[i]=m.data[i]*k;
  } else if (offset) {
      for(var i=0;i<m.data.length;i++) m.data[i]=m.data[i]-offset;  
  }
  return m;
}

/*
Return a new matrix based on a selection of rows and columns
selection(rowIndices: Array<number>, columnIndices: Array<number>): Matrix
Parameters
rowIndices (Array<number>) The row indices to select. Order matters and an index can be more than once.
columnIndices (Array<number>) The column indices to select. Order matters and an index can be use more than once.
Returns 
Matrix: The new matrix 
*/
Matrix.prototype.selection = function (rowIndices,columnIndices) {
  this.checkMatrixDims(2);
  var newMatrix = Matrix(rowIndices.length,columnIndices.length,{dtn:this.dtn});
  for (var i = 0; i < rowIndices.length; i++) {
    var rowIndex = rowIndices[i];
    for (var j = 0; j < columnIndices.length; j++) {
      var columnIndex = columnIndices[j];
      newMatrix.set(i,j, this.get(rowIndex, columnIndex));
    }
  }
  return newMatrix;
}


// Set a row of the matrix
Matrix.prototype.setRow = function (row,data) {
  data=Matrix.checkArray(data);
  for(var i=0;i<this.columns;i++) {
     this.set(row,i,data[i]); 
  }
}

// Slice of data in major dimension
Matrix.prototype.slice = function (i,offset) {
  var rows,columns,levels;
  switch (this.dims) {
    case 1:
      return Matrix(this,{columns:i,offset:offset,slice:true});
      break;
    case 2:
    case 3:
      return Matrix(this,{rows:i,offset:offset,slice:true});
      break;
  }
}

Matrix.prototype.sin = function () {
  this.eval(Math.sin);
  return this;
}

/*
size
Properties
size (number) : The number of elements in the matrix.
*/
Matrix.prototype.size = function () {
  return  this.size;
}


Matrix.prototype.sub = function (v) {
  this.eval(function (x) {return x-v});
  return this; 
}


Matrix.prototype.subMatrix = function (startRow, endRow, startColumn, endColumn) {
  this.checkMatrixDims(2);
  this.checkRange(startRow, endRow, startColumn, endColumn);
  var newMatrix = Matrix(endRow - startRow + 1, endColumn - startColumn + 1, {dtn:this.dtn});
  for (var i = startRow; i <= endRow; i++) {
    for (var j = startColumn; j <= endColumn; j++) {
      newMatrix.set(i - startRow,j - startColumn, this.get(i, j));
    }
  }
  return newMatrix;
}

/** Return a sub-matrix (1-3 dims)
 *
 */
Matrix.prototype.subMatrixRange = function (rx,ry,rz) {
  var i,j,i0,i1,x0,x1,y0,y1,z0,z1,res;
  switch (this.dims) {
    case 1:
      // simple case, return sliced array
      x0=0,x1=this.i-1;
      if (isRange(rx)) x0=rx[0],x1=rx[1];
      else throw "Matrix.subMatrixRange: no range";
      var i0=x0,i1=i0+1+x1;
      return Vector({data:this.data.slice(i0,i1),columns:i1-i0,dtn:this.dtn});
    case 2:
      todo('subMatrixRange 2')
    case 3:
      if ((isAll(rz) || (isRange(rz)) && isNumber(rx) && isNumber(ry) && this.layout==123)) {
        // simple case, return sliced array (1-dim matrix)
        z0=0,z1=this.levels-1;
        if (isRange(rz)) z0=rz[0],z1=rz[1];
        var i0=this.index(rx,ry,z0),i1=i0+1+z1;
        return Vector({data:this.data.slice(i0,i1),columns:i1-i0,dtn:this.dtn});
      } if ((isAll(rx) || isRange(rx)) && (isAll(ry) || isRange(ry)) && isNumber(rz)) {
        res = Matrix(this.rows,this.columns,{dtn:this.dtn});
        x0=0,x1=this.rows-1;
        if (isRange(rx)) x0=rx[0],x1=rx[1];
        y0=0,y1=this.columns-1;
        if (isRange(ry)) y0=ry[0],y1=ry[1];
        z0=rz;
        for(i=x0;i<x1;i++)
          for(j=y0;j<y1;j++)
            res.set(i,j, this.get(i,j,z0));
        return res;
      } 
      else todo('subMatrixRange 3.rx/ry')
  }
}

Matrix.prototype.subMatrixRow = function (indices, startColumn, endColumn) {
  this.checkMatrixDims(2);
  if (startColumn === undefined) startColumn = 0;
  if (endColumn === undefined) endColumn = this.columns - 1;
  if ((startColumn > endColumn) || (startColumn < 0) || (startColumn >= this.columns) || (endColumn < 0) || (endColumn >= this.columns)) {
    throw new RangeError('Argument out of range');
  }

  var newMatrix = Matrix(indices.length, endColumn - startColumn + 1, {dtn:this.dtn});
  for (var i = 0; i < indices.length; i++) {
    for (var j = startColumn; j <= endColumn; j++) {
      if (indices[i] < 0 || indices[i] >= this.rows) {
        throw new RangeError('Row index out of range: '+indices[i]);
      }
      newMatrix.set(i, j - startColumn, this.get(indices[i], j));
    }
  }
  return newMatrix;
}

Matrix.prototype.subMatrixColumn = function (indices, startRow, endRow) {
  this.checkMatrixDims(2);
  if (startRow === undefined) startRow = 0;
  if (endRow === undefined) endRow = this.rows - 1;
  if ((startRow > endRow) || (startRow < 0) || (startRow >= this.rows) || (endRow < 0) || (endRow >= this.rows)) {
    throw new RangeError('Argument out of range');
  }

  var newMatrix = Matrix(endRow - startRow + 1, indices.length, {dtn:this.dtn});
  for (var i = 0; i < indices.length; i++) {
    for (var j = startRow; j <= endRow; j++) {
      if (indices[i] < 0 || indices[i] >= this.columns) {
        throw new RangeError('Column index out of range: '+indices[i]);
      }
      newMatrix.set(j - startRow, i, this.get(j, indices[i]));
    }
  }
  return newMatrix;
}


Matrix.prototype.subRowVector = function (vector) {
  this.checkMatrixDims(2);
  vector = this.checkRowVector(vector);
  for (var i = 0; i < this.rows; i++) {
    for (var j = 0; j < this.columns; j++) {
      this.set(i, j, this.get(i, j) - vector[j]);
    }
  }
  return this;
}

Matrix.prototype.setSubMatrix = function (matrix, startRow, startColumn) {
  matrix = this.checkMatrix(matrix);
  this.checkMatrixDims(2);
  matrix.checkMatrixDims(2);
  var endRow = startRow + matrix.rows - 1;
  var endColumn = startColumn + matrix.columns - 1;
  this.checkRange(startRow, endRow, startColumn, endColumn);
  for (var i = 0; i < matrix.rows; i++) {
    for (var j = 0; j < matrix.columns; j++) {
      this.set(startRow + i,startColumn + j) = matrix.get(i, j);
    }
  }
  return this;
}

Matrix.prototype.sum = function (by) {
  var i,j,k,v=0;
  switch (by) {
    case 'row':
      return this.sumByRow();
    case 'column':
      return this.sumByColumn();
    default:
      switch (this.dtn+this.dims) {
        case 'Array1':
          for (i = 0; i < this.columns; i++) {
              v += this.data[i];
          }
          break;
        case 'Array2':
          for (i = 0; i < this.rows; i++) {
            for (j = 0; j < this.columns; j++) {
              v += this.data[i][j];
            }
          }
          break;
        case 'Array3':
          for (i = 0; i < this.rows; i++) {
            for (j = 0; j < this.columns; j++) {
              for (k = 0; k < this.levels; k++) {
                v += this.data[i][j][k];
              }
            }
          }
          break;
        default:
          for (i = 0; i < this.size; i++) v += this.data[i];
      }
      return v;
  }
}

Matrix.prototype.sumByRow = function () {
  var sum = Matrix.zeros(this.rows, 1);
  for (var i = 0; i < this.rows; ++i) {
    for (var j = 0; j < this.columns; ++j) {
      sum.set(i, 0, sum.get(i, 0) + this.get(i, j));
    }
  }
  return sum;
}

Matrix.prototype.sumByColumn = function() {
  var sum = Matrix.zeros(1, this.columns);
  for (var i = 0; i < this.rows; ++i) {
    for (var j = 0; j < this.columns; ++j) {
      sum.set(0, j, sum.get(0, j) + this.get(i, j));
    }
  }
  return sum;
}

Matrix.prototype.toArray = function (rx,ry,rz) {
  switch (this.dims) {
    case 1: return Array.from(this.data);
    case 2: todo('toArray 2')
    case 3: todo('toArray 3')
  }
}


Matrix.ALL=ALL;
Matrix.FOREACH=FOREACH;
Matrix.FORALL=FORALL;

module.exports = Matrix 
