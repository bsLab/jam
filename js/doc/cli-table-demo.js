var Table = require('./cli-table');

// instantiate
var table = new Table({
    head: ['TH 1 label', 'TH 2 label']
  , colWidths: [20, 20]
});

// table is an Array, so you can `push`, `unshift`, `splice` and friends
table.push(
    ['First value', 'Second value with overlength']
  , ['First value', 'Second value']
);
console.log(table.toString());
