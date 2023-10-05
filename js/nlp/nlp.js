var nlp = Require('nlp/compromise');
nlp.extend(Require('nlp/compromise-adjectives'));
nlp.extend(Require('nlp/compromise-dates'));
nlp.extend(Require('nlp/compromise-numbers'));
nlp.extend(Require('nlp/compromise-sentences'));
var efrt = Require('nlp/efrt');
nlp.lexer = efrt.lexer;
nlp.pack = efrt.pack;
nlp.unpack = efrt.unpack;
nlp.version = '1.2.2';
module.exports=nlp;
