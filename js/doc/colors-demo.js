var colors = require('./colors');

console.log(colors.bold('bold')); // outputs green text
console.log(colors.italic('italic')); // outputs green text
console.log(colors.green('green')); // outputs green text
console.log(colors.green.bold('green bold')); // outputs green text
console.log(colors.red.underline('red underline')) // outputs red underlined text
console.log(colors.inverse('inverse the color')); // inverses the color
console.log(colors.dim('dim')); // inverses the color
