/**
 * blessed - a high-level terminal interface library for node.js
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Blessed
 */

function blessed() {
  return blessed.program.apply(null, arguments);
}

blessed.program = blessed.Program = Require('term/program');
blessed.tput = blessed.Tput = Require('term/tput');
blessed.widget = Require('term/widget');
blessed.colors = Require('term/colors');
blessed.unicode = Require('term/unicode');
blessed.helpers = Require('term/helpers');

blessed.helpers.sprintf = blessed.tput.sprintf;
blessed.helpers.tryRead = blessed.tput.tryRead;
blessed.helpers.merge(blessed, blessed.helpers);

blessed.helpers.merge(blessed, blessed.widget);

/**
 * Expose
 */

module.exports = blessed;
