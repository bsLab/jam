/** JavaScript Sqlite3 Implementation with raw file system access
 *
 */
var Database = require('sqlite3.js');

var tableName = "newtable";
var db = Database('/tmp/test.db');
print(db.open())
print(db.exec('CREATE TABLE ?? (id INTEGER PRIMARY KEY, name TEXT NOT NULL);', tableName));
print(db.exec('INSERT INTO ?? VALUES (null, ?);', tableName, 'John'));
print(db.exec('INSERT INTO ?? VALUES (null, ?);', tableName, 'Jane'));
print(db.exec('SELECT * FROM ??;', tableName));
print(db.exec('SELECT SQLITE_VERSION();'));
