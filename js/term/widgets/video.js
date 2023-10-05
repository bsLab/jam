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
 **    $AUTHORS:     Christopher Jeffrey and contributors, Stefan Bosse
 **    $INITIAL:     (C) 2013-2015, Christopher Jeffrey and contributors
 **    $MODIFIED:    sbosse (2017).
 **    $VERSION:     1.2.2
 **
 **    $INFO:
 *
 * video.js - video element for blessed
 *
 **    $ENDOFINFO
 */

/**
 * Modules
 */
var Comp = Require('com/compat');

var cp = Require('child_process');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Terminal = Require('term/widgets/terminal');

/**
 * Video
 */

function Video(options) {
  var self = this
    , shell
    , args;

  if (!instanceOf(this,Node)) {
    return new Video(options);
  }

  options = options || {};

  Box.call(this, options);

  if (this.exists('mplayer')) {
    shell = 'mplayer';
    args = ['-vo', 'caca', '-quiet', options.file];
  } else if (this.exists('mpv')) {
    shell = 'mpv';
    args = ['--vo', 'caca', '--really-quiet', options.file];
  } else {
    this.parseTags = true;
    this.setContent('{red-fg}{bold}Error:{/bold}'
      + ' mplayer or mpv not installed.{/red-fg}');
    return this;
  }

  var opts = {
    parent: this,
    left: 0,
    top: 0,
    width: this.width - this.iwidth,
    height: this.height - this.iheight,
    shell: shell,
    args: args.slice()
  };

  this.now = Date.now() / 1000 | 0;
  this.start = opts.start || 0;
  if (this.start) {
    if (shell === 'mplayer') {
      opts.args.unshift('-ss', this.start + '');
    } else if (shell === 'mpv') {
      opts.args.unshift('--start', this.start + '');
    }
  }

  var DISPLAY = process.env.DISPLAY;
  delete process.env.DISPLAY;
  this.tty = new Terminal(opts);
  process.env.DISPLAY = DISPLAY;

  this.on('click', function() {
    self.tty.pty.write('p');
  });

  // mplayer/mpv cannot resize itself in the terminal, so we have
  // to restart it at the correct start time.
  this.on('resize', function() {
    self.tty.destroy();

    var opts = {
      parent: self,
      left: 0,
      top: 0,
      width: self.width - self.iwidth,
      height: self.height - self.iheight,
      shell: shell,
      args: args.slice()
    };

    var watched = (Date.now() / 1000 | 0) - self.now;
    self.now = Date.now() / 1000 | 0;
    self.start += watched;
    if (shell === 'mplayer') {
      opts.args.unshift('-ss', self.start + '');
    } else if (shell === 'mpv') {
      opts.args.unshift('--start', self.start + '');
    }

    var DISPLAY = process.env.DISPLAY;
    delete process.env.DISPLAY;
    self.tty = new Terminal(opts);
    process.env.DISPLAY = DISPLAY;
    self.screen.render();
  });
}

//Video.prototype.__proto__ = Box.prototype;
inheritPrototype(Video,Box);

Video.prototype.type = 'video';

Video.prototype.exists = function(program) {
  try {
    return !!+cp.execSync('type '
      + program + ' > /dev/null 2> /dev/null'
      + ' && echo 1', { encoding: 'utf8' }).trim();
  } catch (e) {
    return false;
  }
};

/**
 * Expose
 */

module.exports = Video;
