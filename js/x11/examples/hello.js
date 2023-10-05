var x11 = require('../core/x11');

var Exposure = x11.eventMask.Exposure;
var PointerMotion = x11.eventMask.PointerMotion;
var KeyPress = x11.eventMask.KeyPress;
var ButtonPress = x11.eventMask.ButtonPress;
var ButtonRelease= x11.eventMask.ButtonRelease;

x11.createClient(function(err, display) {
  if (!err) {
    var X = display.client;
    var root = display.screen[0].root;
    var wid = X.AllocID();
    X.CreateWindow(
      wid,
      root, // new window id, parent
      0,
      0,
      400,
      500, // x, y, w, h
      0,
      0,
      0,
      0, // border, depth, class, visual
      { eventMask: Exposure | PointerMotion | KeyPress | ButtonPress | ButtonRelease} // other parameters
    );
    X.MapWindow(wid);
    var gc = X.AllocID();
    X.CreateGC(gc, wid);
    var white = display.screen[0].white_pixel;
    var black = display.screen[0].black_pixel;
    cidBlack = X.AllocID();
    cidWhite = X.AllocID();
    X.CreateGC(cidBlack, wid, { foreground: black, background: white });
    X.CreateGC(cidWhite, wid, { foreground: white, background: black });
    X.on('event', function(ev) {
      // print(ev)
      switch (ev.type) {
        case x11.eventType.Expose:
          X.PolyFillRectangle(wid, cidWhite, [0, 0, 500, 500]);
          X.PolyText8(wid, cidBlack, 50, 50, ['Hello World, Node.JS!']);
          X.PolyText8(wid, cidBlack, 50, 70, ['New line']);
          break;
        case x11.eventType.KeyPress:
          if (ev.keycode == 24 /*q*/) process.exit()
          break;  
      }
    });
    X.on('error', function(e) {
      console.log(e);
    });
  } else {
    console.log(err);
  }
});
