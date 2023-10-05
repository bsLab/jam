var List = require('./list');

// instantiate
var list = new List({
  type:'-',
});

// list is an Array, so you can `push`, `unshift`, `splice` and friends
list.push('First line','Second line');
list.push('A long line with more text that says list is an Array, so you can "push", "unshift", "splice" and friends');
console.log(list.toString());
