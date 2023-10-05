var doc = Require('doc/doc');
var com = Require('com/compat');

function Table (data,options) {
  var totalWidth=(process.stdout.columns)-2;
  if (com.obj.isArray(options)) options={head:options};
  options=options||{};
  var head=options.head,table;
  if (com.obj.isMatrix(data)) {
  } else if (com.obj.isArray(data) && com.obj.isObject(data[0])) {
    options.head=true;
    head=Object.keys(data[0]);
    data=data.map(function (row) {
      return head.map(function (key) { return row[key] })
    });
  } else return new Error('Table: Inavlid data');
  if (!options.colWidths) {
    totalWidth-= ((head||data[0]).length-1);
    options.colWidths=(head||data[0]).map(function (x,i) {
      return Math.max(4,Math.floor(totalWidth/(head||data[0]).length));
    });
  }
  if (head) 
    table = new doc.Table({
      head : head,
      colWidths :options.colWidths,
    });
  else 
    table = new doc.Table({
      colWidths : options.colWidths,
    });
  data.forEach(function (row,rowi) {
    table.push(row);
  });
  print(table.toString());
}

module.exports = Table;
