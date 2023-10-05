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
 **    $INITIAL:     (C) 2011-2015 Bermi Ferrer <bermi@bermilabs.com>, 2017-2018 Stefan Bosse
 **    $REVESIO:     1.3.1
 **
 **    $INFO:
 *
 * password-generator using crypto random number generation (slow,HQ)
 * !using built-in crypto random generators using either native crypto module or polyfill!
 * 
 * options = {length,memorable,lowercase,uppercase,pattern,number?:boolean,range?:[]}
 *
 * Using always twister random byte generator (not random byte array) 
 *
 *     $ENDINFO
 */

var Crypto = Require('os/crypto.rand'); // Require('crypto');

module.exports.generate = function (options) {
  
  function numgen (options) {
    // assuming byte number range 0-255
    var arr = new Uint8Array(options.length||8);
    getRandomValues(arr);
    return arr;
  }
  
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
        n = Crypto.randomByte(33,126); // rand(33, 126);
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
    var key, value, arr = new Uint8Array(max);
    getRandomValues(arr);
    for (key in arr) {
      if (arr.hasOwnProperty(key)) {
        value = arr[key];
        if (value > min && value < max) {
          return value;
        }
      }
    }
    return rand(min, max);
  }


  function getRandomValues(buf) {
    var bytes = Crypto.randomBytes(buf.length);
    buf.set(bytes);
  }
  if (options.number) 
    return numgen(options)
  else
    return pwgen(options);
};
