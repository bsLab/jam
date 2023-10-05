var Comp = Require('com/compat');

var Node = Require('term/widgets/node');
var Box = Require('term/widgets/box');
var Helpers = Require('term/helpers');
var Button = Require('term/widgets/button');


// Add up and down arrow buttons on the right outside of a widget
// options.arrows: {up:'[-]',down:'[+]',width:3,height:1,fg:'red',bg:'default'}}
module.exports = function (parent,options,up,down,nocontrol) {  
  var bbox;
  // Bbox computing for button positions; relatives can only be resolved to screen
  // coordinates?
  bbox=Helpers.bbox(parent.screen,options);
  parent._.up = new Button({
    screen: parent.screen,
    top: bbox.top+1,
    height: options.arrows.height||1,
    left: bbox.left+bbox.width,
    width: options.arrows.width||3,
    content: options.arrows.up||'[-]',
    align: 'center',
    style: {
      fg:options.arrows.fg||'red',
      bg: options.arrows.bg||'white',
      bold:true,
    },
    autoFocus: false,
    hidden:options.hidden,
    mouse: true
  });
  parent._.up.on('press',up);
  parent.screen.append(parent._.up);
  parent._.down = new Button({
    screen: this.screen,
    top: bbox.top+bbox.height-1-(options.arrows.height||1),
    height: options.arrows.height||1,
    left: bbox.left+bbox.width,
    width: options.arrows.width||3,
    content: options.arrows.down||'[+]',
    align: 'center',
    style: {
      fg:options.arrows.fg||'red',
      bg: options.arrows.bg||'white',
      bold:true,
    },
    autoFocus: false,
    hidden:options.hidden,
    mouse: true
  });
  parent._.down.on('press',down);
  parent.screen.append(parent._.down);
  if (!nocontrol) {
    parent._hide=parent.hide;
    parent.hide = function() {
      parent._hide();
      if (parent._.up) parent._.up.hide();
      if (parent._.down) parent._.down.hide();
      parent.screen.render();
    } 
    parent._show = parent.show;
    parent.show = function() {
      parent._show();
      if (parent._.up) parent._.up.show();
      if (parent._.down) parent._.down.show();
      parent.screen.render();
    } 
  }
}
