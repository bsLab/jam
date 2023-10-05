var parse = require('./jsep');

print(parse('(a | b) & c'));
print(parse('a ^ b ^ c'));
print(parse('(a ^1 b ^1 c)')); // exaxtly once 
print(parse('(a ^0 b ^0 c)')); // at  most once
print(parse('(a ==~ b)'));     // bit equivalence
