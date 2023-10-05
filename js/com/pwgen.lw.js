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
 **    $AUTHORS:     Bermi Ferrer, Stefan Bosse 
 **    $INITIAL:     (C) 2011-2015 Bermi Ferrer <bermi@bermilabs.com>, 2016-2017 bLAB
 **    $REVESIO:     1.1.4
 **
 **    $INFO:
 *
 * password-generator using seedable random generator (fast,LQ)
 * Random generator seed is current system time in microseconds or options.seed value.
 * 
 * options = {length,meorable,lowercase,uppercase,pattern,seed}
 *
 *     $ENDINFO
 */

var random = undefined;
/* Antti Sykäri's algorithm adapted from Wikipedia
** Returns a random generator function [0.0,1.0| with seed initialization
*/
var seed = function(s) {
    var m_w  = s;
    var m_z  = 987654321;
    var mask = 0xffffffff;

    return function() {
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;

      var result = ((m_z << 16) + m_w) & mask;
      result /= 4294967296;

      return result + 0.5;
    }
}

module.exports.generate = function (options) {

  
  function pwgen (options) {
    var localName, consonant, letter, vowel, pattern = options.pattern,
        char = "", n, i, validChars = [], prefix=options.prefix;
    letter = /[a-zA-Z]$/;
    vowel = /[aeiouAEIOU]$/;
    consonant = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]$/;
    if (options.length == null) {
      options.length = 10;
    }
    if (pattern == null) {
      pattern = /\w/;
    }
    if (prefix == null) {
      prefix = '';
    }

    // Non memorable passwords will pick characters from a pre-generated
    // list of characters
    if (!options.memorable) {
      for (i = 33; 126 > i; i += 1) {
        char = String.fromCharCode(i);
        if (char.match(pattern)) {
          validChars.push(char);
        }
      }

      if (!validChars.length) {
        throw new Error("Could not find characters that match the " +
          "password pattern " + pattern + ". Patterns must match individual " +
          "characters, not the password as a whole.");
      }
    }


    while (prefix.length < options.length) {
      if (options.memorable) {
        if (prefix.match(consonant)) {
          pattern = vowel;
        } else {
          pattern = consonant;
        }
        n = rand(33, 126);
        char = String.fromCharCode(n);
      } else {
        char = validChars[rand(0, validChars.length)];
      }

      if (options.lowercase) char = char.toLowerCase();
      else if (options.uppercase) char = char.toUpperCase();
      
      if (char.match(pattern)) {
        prefix = "" + prefix + char;
      }
    }
    return prefix;
  };

  function rand(min, max) {
    if (!random) {
      random = seed(options.seed|((new Date().getTime())|0));
    }
    return Math.floor((random() * (max-min)) + min); 
  }
  
  return pwgen(options);
};
