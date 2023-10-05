/**
 **      ==============================
 **       O           O      O   OOOO
 **       O           O     O O  O   O
 **       O           O     O O  O   O
 **       OOOO   OOOO O     OOO  OOOO
 **       O   O       O    O   O O   O
 **       O   O       O    O   O O   O
 **       OOOO        OOOO O   O OOOO
 **      ==============================
 **      Dr. Stefan Bosse http://www.bsslab.de
 **
 **      COPYRIGHT: THIS SOFTWARE, EXECUTABLE AND SOURCE CODE IS OWNED
 **                 BY THE AUTHOR(S).
 **                 THIS SOURCE CODE MAY NOT BE COPIED, EXTRACTED,
 **                 MODIFIED, OR OTHERWISE USED IN A CONTEXT
 **                 OUTSIDE OF THE SOFTWARE SYSTEM.
 **
 **    $AUTHORS:     Stefan Bosse, Douglas Crockford (jsmin, C, 2002)
 **    $INITIAL:     (C) 2006-2020 bLAB
 **    $CREATED:     09-06-20 by sbosse.
 **    $RCS:         $Id: minify.js,v 1.4 2020/02/03 09:45:01 sbosse Exp sbosse $
 **    $VERSION:     1.1.1
 **
 **    $INFO:
 **
 **  Fast JavaScript Code Minifier (C-to-JS port)
 **
 **    $ENDOFINFO
 */

var EOF = null;
var   theA;
var   theB;
var   theLookahead = EOF;
var   theX = EOF;
var   theY = EOF;
var   theInbuf = null;
var   theOutbuf = null;
var   theInbufIndex = 0;
var   theOutbufIndex = 0;

/* isAlphanum -- return true if the character is a letter, digit, underscore,
        dollar sign, or non-ASCII character.
*/
function isAlphanum(c)
{
    return ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ||
            (c >= 'A' && c <= 'Z') || c == '_' || c == '$' || c == '\\' ||
             c > String.fromCharCode(126));
}

function get() {
  var c = theLookahead;
  theLookahead = EOF;
  if (c == EOF) {
    c = theInbuf[theInbufIndex++];
  }
  if (c >= ' ' || c == '\n' || c == EOF) {
    return c;
  }
  if (c == '\r') {
    return '\n';
  }
  return ' ';
}

function put(c) {
  theOutbuf += c;
}

function peek()
{
  theLookahead = get();
  return theLookahead;
}

function error(msg) { throw msg }

function next()
{
    var c = get();
    if  (c == '/') {
     switch (peek()) {
        case '/':
            for (;;) {
                c = get();
                if (c <= '\n') {
                    break;
                }
            }
            break;
        case '*':
            get();
            while (c != ' ') {
                switch (get()) {
                case '*':
                    if (peek() == '/') {
                        get();
                        c = ' ';
                    }
                    break;
                case EOF:
                  error("Unterminated comment.");
                }
            }
            break;
      }
    }
    theY = theX;
    theX = c;
    return c;
}

/* action -- do something! What you do is determined by the argument:
        1   Output A. Copy B to A. Get the next B.
        2   Copy B to A. Get the next B. (Delete A).
        3   Get the next B. (Delete B).
   action treats a string as a single character. Wow!
   action recognizes a regular expression if it is preceded by ( or , or =.
*/

function action(d)
{
  switch (d) {
    case 1:
        put(theA);
        if (
            (theY == '\n' || theY == ' ') &&
            (theA == '+' || theA == '-' || theA == '*' || theA == '/') &&
            (theB == '+' || theB == '-' || theB == '*' || theB == '/')
        ) {
            put(theY);
        }
    case 2:
        theA = theB;
        if (theA == '\'' || theA == '"' || theA == '`') {
            for (;;) {
                put(theA);
                theA = get();
                if (theA == theB) {
                    break;
                }
                if (theA == '\\') {
                    put(theA);
                    theA = get();
                }
                if (theA == EOF) {
                    error("Unterminated string literal.");
                }
            }
        }
    case 3:
        theB = next();
        if (theB == '/' && (
            theA == '(' || theA == ',' || theA == '=' || theA == ':' ||
            theA == '[' || theA == '!' || theA == '&' || theA == '|' ||
            theA == '?' || theA == '+' || theA == '-' || theA == '~' ||
            theA == '*' || theA == '/' || theA == '{' || theA == '\n'
        )) {
            put(theA);
            if (theA == '/' || theA == '*') {
                put(' ');
            }
            put(theB);
            for (;;) {
                theA = get();
                if (theA == '[') {
                    for (;;) {
                        put(theA);
                        theA = get();
                        if (theA == ']') {
                            break;
                        }
                        if (theA == '\\') {
                            put(theA);
                            theA = get();
                        }
                        if (theA == EOF) {
                            error("Unterminated set in Regular Expression literal.");
                        }
                    }
                } else if (theA == '/') {
                    switch (peek()) {
                    case '/':
                    case '*':
                        error("Unterminated set in Regular Expression literal.");
                        break;
                    case '\n': 
                        put(theA); 
                        theA='\n'; /* Newline required after end of regex */
                    }                    
                    break;
                } else if (theA =='\\') {
                    put(theA);
                    theA = get();
                }
                if (theA == EOF) {
                    error("Unterminated Regular Expression literal.");
                }
                put(theA);
            }
            theB = next();
        }
    }
}


function minify(text) {
  theA=0;
  theB=0;
  theLookahead = EOF;
  theX = EOF;
  theY = EOF;
  theInbuf=text;
  theInbufIndex=0;
  theOutbuf='';
  if (peek() == 0xEF) {
      get();
      get();
      get();
  }
  theA = get();
  action(3);
  while (theA != EOF) {
    switch (theA) {
      case ' ':
          action(isAlphanum(theB) ? 1 : 2);
          break;
      case '\n':
        switch (theB) {
          case '{':
          case '[':
          case '(':
          case '+':
          case '-':
          case '!':
          case '~':
              action(1);
              break;
          case ' ':
              action(3);
              break;
          default:
              action(isAlphanum(theB) ? 1 : 2);
          }
          break;
      default:
        switch (theB) {
          case ' ':
              action(isAlphanum(theA) ? 1 : 3);
              break;
          case '\n':
              switch (theA) {
              case '}':
              case ']':
              case ')':
              case '+':
              case '-':
              case '"':
              case '\'':
              case '`':
                  action(1);
                  break;
              default:
                  action(isAlphanum(theA) ? 1 : 3);
              }
              break;
          default:
              action(1);
              break;
          }
      }
  }
  return theOutbuf;    
}

// old faulty regex minimizer from Code module!!
function minimize0 (code) {
  // Inline and multi-line comments
  var regex4= /\/\*([\S\s]*?)\*\//g;
  var regex5= /([^\\}])\\n/g;                     
  var regex6= /\/\/[^\n]+/g;
   // Newline after {},;
  var regex7= /[ ]*([{},; ]|else)[ ]*\n[\n]*/g;
  // Filter for string quotes
  var regex8= /([^\'"]+)|([\'"](?:[^\'"\\]|\\.)+[\'"])/g;
  // Multi-spaces reduction
  var regex9= / [ ]+/g;
  // relax } <identifier> syntax errors after newline removal; exclude keywords!
  var regex10= /}\s+(?!else|finally|catch)([a-zA-Z_]+)/g;      
  // relax ) <identifier> syntax errors after newline removal
  var regex11= /\)\s+([a-zA-Z_]+)/g; 

  code=code.replace(regex4,"")
           .replace(regex5,'$1\n')
           .replace(regex5,'$1\n')
           .replace(regex6,"")
           .replace(regex7,"$1")
           .replace(regex8, function($0, $1, $2) {
              if ($1) {
                return $1.replace(regex9,' ').replace(regex10,'};$1').replace(regex11,')\n$1');
              } else {
                return $2; 
              } 
            });
  return code;
}

// compare regex minimizer versa character state machine
function test() {
  var n=1E4;
  var text=minify.toString(); 
  var t0=Date.now()
  for(var i=0;i<n;i++) {
    minify(text);
  }
  var t1=Date.now();
  console.log('minify: '+((t1-t0)/n/text.length*1000)+' us/char');
  var t0=Date.now()
  for(var i=0;i<n;i++) {
    minimize0(text);
  }
  var t1=Date.now();
  console.log('minimize0: '+((t1-t0)/n/text.length*1000)+' us/char');
  try {
    var M = process.binding('minify');
    var t0=Date.now()
    for(var i=0;i<n;i++) {
      M.minify(text);
    }
    var t1=Date.now();
    console.log('minifyC: '+((t1-t0)/n/text.length*1000)+' us/char');
    
  } catch (e) {
  
  }
}
minify.test=test;

module.exports = minify;

