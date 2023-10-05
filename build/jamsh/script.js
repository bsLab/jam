port(DIR.East(10011));
port(DIR.West(10012));
connect(DIR.East(10012));
start();
open('hello.js');
create('hello',{});
