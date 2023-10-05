/** JavaScript Sqlite3 Implementation with raw file system access
 *  (sqlite3C compiled with emscripten from C source)
 * Usage: 
 *
 * db = Database(fileName:string)
 * db.open()
 * ret=db.exec('CREATE TABLE ?? (id INTEGER PRIMARY KEY, name TEXT NOT NULL);', tableName)
 * ret=db.exec('INSERT INTO ?? VALUES (null, ?);', tableName, 'John'))
 * ret=db.exec('SELECT * FROM ??;', tableName)
 * -> 
 *  { code: 0,
 *     ok: true,
 *     statement: 'SELECT * FROM "newtable";',
 *     result: 
 *      [ { id: '1', name: 'John' }]}
 *
 * 
 *
 */
 
var sql = require('./sqlite3C.js')

var PTR_SIZE = 4;
var SQLITE_OK = 0;

var SQLite = {
  open: sql.cwrap('sqlite3_open', 'number', ['string', 'number']),
  exec: sql.cwrap('sqlite3_exec', 'number', ['number', 'string', 'number']),
  close: sql.cwrap('sqlite3_close', 'number', ['number'])
};

/* output buffer and sqlite3_exec callback function mapping to js */
var execOutput = [];
var execCallback = sql.addFunction(function (_, colNumber, valArray, keyArray) {
  var row = {};
  for (var offset = 0; offset < colNumber * PTR_SIZE; offset += PTR_SIZE) {
    var key = sql.UTF8ToString(sql.getValue(keyArray + offset, '*'));
    var val = sql.UTF8ToString(sql.getValue(valArray + offset, '*'));
    row[key] = val;
  }
  execOutput.push(row);
});

function escapeText(t) {
  return String(t).replace(/'/g, "''");
}

function escapeIdentifier(i) {
  return String(i).replace(/"/g, '""');
}

function prepareStatement(statement, parameters) {
  return String(statement).replace(/\?+/g, function (match) {
    var param = parameters.shift() || '';
    switch (match.length) {
      case 1: return `'${escapeText(param)}'`;
      case 2: return `"${escapeIdentifier(param)}"`;
      default: return match;
    }
  });
}

function createResult(code, statement, result) {
  var o = { code: code, ok: !code };
  if (statement) o.statement=statement;
  if (result) o.result=result;
  return o;
}

function Database (fileName) {
  if (!(this instanceof Database)) return new Database (fileName);
  this.fileName = String(fileName);
  this.dbPointer = null;
}

Database.prototype.open = function () {
  var dbPointer = sql._malloc(PTR_SIZE);
  var returnValue = SQLite.open(this.fileName, dbPointer);
  if (returnValue === SQLITE_OK) {
    this.dbPointer = sql.getValue(dbPointer, '*');
  }
  return createResult(returnValue);
}

Database.prototype.exec = function () {
  var statement,parameters=[];
  for(var i in arguments) {
    if (i=='0') statement=arguments[0];
    else parameters.push(arguments[i]);
  }
  var preparedStatement = prepareStatement(statement, parameters);
  var returnValue = SQLite.exec(this.dbPointer, preparedStatement, execCallback);
  var result = returnValue === SQLITE_OK ? execOutput.splice(0) : null;
  return createResult(returnValue, preparedStatement, result);
}

Database.prototype.close = function () {
  var returnValue = SQLite.close(this.dbPointer);
  return createResult(returnValue);
}

module.exports = Database

