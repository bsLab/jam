var x11 = require('./libx11.debug').X11;
var EventEmitter = require('events').EventEmitter;

var X, root, white;
var events = x11.eventMask.Button1Motion|x11.eventMask.ButtonPress|x11.eventMask.ButtonRelease|x11.eventMask.SubstructureNotify|x11.eventMask.SubstructureRedirect|x11.eventMask.Exposure;
var frames = {};
var dragStart = null;

function ManageWindow(wid)
{
    console.log("MANAGE WINDOW: " + wid);
    
    if (wid!=0x1600003) return;
    
    X.GetWindowAttributes(wid, function(err, attrs) {

        if (attrs[8]) // override-redirect flag
        {
            // don't manage
            console.log("don't manage");
            X.MapWindow(wid);
            return;
        }

    var fid = X.AllocID();
    frames[fid] = 1;
    var winX, winY;
    winX = 20;
    winY = 20;

    X.GetGeometry(wid, function(err, clientGeom) {

        console.log("window geometry: ", clientGeom);
        var width = clientGeom.width + 4;
        var height = clientGeom.height + 24;
        if (width < 50 || height < 50) return;
        console.log("CreateWindow", fid, root, winX, winY, width, height);
        X.CreateWindow(fid, root, winX, winY, width, height, 0, 0, 0, 0,
        {
            backgroundPixel: white,
            eventMask: events
        });

        var ee = new EventEmitter();
        X.event_consumers[fid] = ee;
        ee.on('event', function(ev)
        {
            console.log(['event', ev]);
            if (ev.type === 17) // DestroyNotify
            {
               X.DestroyWindow(fid);
            } else if (ev.type == 4) {
                dragStart = { rootx: ev.rootx, rooty: ev.rooty, x: ev.x, y: ev.y, winX: winX, winY: winY };
            } else if (ev.type == 5) {
                dragStart = null;
            } else if (ev.type == 6) {
                winX = dragStart.winX + ev.rootx - dragStart.rootx;
                winY = dragStart.winY + ev.rooty - dragStart.rooty;
                X.MoveWindow(fid, winX, winY);
            } else if (ev.type == 12) {
              // show
            }
        });
        X.ChangeSaveSet(1, wid);
        X.ReparentWindow(wid, fid, 1, 21);
        console.log("MapWindow", fid);
        X.MapWindow(fid);
        X.MapWindow(wid);
        X.MoveResizeWindow(fid,20,20,800+4,600+24);
        X.ReparentWindow(wid, fid, 1, 21);
    });

    });
}

x11.createClient(function(err, display) {
    X = display.client;
    X.require('render', function(err, Render) {
    X.Render = Render;

    root = display.screen[0].root;
    white = display.screen[0].white_pixel;
    console.log('root = ' + root);
    X.ChangeWindowAttributes(root, { eventMask: x11.eventMask.Exposure|x11.eventMask.SubstructureRedirect }, function(err) {
        if (err.error == 10)
        {
            console.error('Error: another window manager already running.');
            process.exit(1);
        }
    });
    X.QueryTree(root, function(err, tree) {
        tree.children.forEach(ManageWindow);
    });

})

}).on('error', function(err) {
    console.error(err);
}).on('event', function(ev) {
    console.log(ev);
    if (ev.type === 20)        // MapRequest
    {
        if (!frames[ev.wid])
            ManageWindow(ev.wid);
        return;
    } else if (ev.type === 23) // ConfigureRequest
    {
        X.ResizeWindow(ev.wid, ev.width, ev.height);
    } else if (ev.type === 12) {
        console.log('EXPOSE', ev);
    }
    console.log(ev);

});
