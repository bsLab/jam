// Test TTY raw mode
process.stdout.write('hello world\n');
console.log(process.stdout.columns+' * '+process.stdout.rows);
console.log('Setting raw mode ..')
process.stdin.setRawMode(true);
console.log('Installing event listener .. ')
process.stdin.on('keypress',function (ch,key) {
  console.log('X: '+ch+' <'+key+'>');
});
process.stdin.on('data',function (ch) {
  var key={};
  console.log('D: '+key+' <'+ch.length+'>');
  for(var i=0;i<ch.length;i++) console.log(ch[i]);
  process.stdin.emit('keypress', ch, key);
});
process.stdin.emit('keypress', {}, 'c');
console.log('Waiting ..')
setTimeout(function () {
  console.log('DONE');
  process.stdin.setRawMode(false);
  process.exit();
},2000);
