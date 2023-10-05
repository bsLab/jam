// Test TTY raw mode with xterm-vt100 escape sequences
var util=require('util');
function exec(cmds) {
  var top=cmds.shift();
  if (top==undefined) return;
  if (top.write) {
    process.stdout.write(top.write);
    return exec(cmds);
  }
  if (top.sleep) setTimeout(function () {exec(cmds)},top.sleep);
  if (top.exit) {
    process.stdout.write('\x1b[?1000l');  // disable mouse tracking
    console.log('DONE');
    process.stdin.setRawMode(false);
    process.exit();
  }
}
process.stdout.write('hello world\n');
console.log(process.stdout.columns+' * '+process.stdout.rows);
console.log('Setting raw mode ..')
process.stdin.setRawMode(true);
console.log('Installing event listener .. ')
process.stdin.on('keypress',function (ch,key) {
  console.log('X: '+ch+' <'+key+'>');
});
if (process.argv.indexOf('event')!=-1)
  process.stdin.on('data',function (ch) {
    var key={};
    console.log('DATA: <'+ch.length+'>');
    for(var i=0;i<ch.length;i++) console.log(ch[i]);
    //process.stdin.emit('keypress', ch, key);
  });
//process.stdin.emit('keypress', {}, 'c');
if (process.argv.indexOf('event')!=-1) console.log('Listening for events ..')
else console.log('Starting ..')

var cmds = [
  {write:'\x1b[?1000h' },// enable mouse tracking
  {write:'\x1b];Test Window\x07'}, // set window title
  {write:'\x1b[2J'}, // erase display
  {sleep:1000},
  {write:'\x1b[2A'}, // move cursor up
  {sleep:1000},
  {write:'\x1b[10;10H'}, // move cursor to 10,10
  {sleep:500},
  {write:'\x1b[44m'},  // set blue background
  {write:'\x1b[37m'},  // set white foreground
  {write:'\x1b[1m'},  // set bold
  {write:' TEXT at (10,10) '},  // 
  {sleep:500},
  {write:'\x1b[11;10H'}, // move cursor to 10,11
  {write:'\x1b[41m'},  // set red background
  {write:' TEXT at (10,11)'},  // 
  {sleep:500},
  {write:'\x1b[9;10H'}, // move cursor to 10,9
  {write:'\x1b[43m'},  // set blue background
  {write:' TEXT at (10,9)'},  // 
  
  {write:'\x1b[0m'},  // restore
  {sleep:5000},
  {exit:true}
]

if (process.argv.indexOf('event')!=-1)
  exec([
    {write:'\x1b[?1000h' },
    {sleep:5000},
    {exit:true}
  ]);
else
  exec(cmds);
