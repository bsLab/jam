// Hack: Enable multiple simulator instances nw.js > 0.13
function openApp() {
  nw.Window.open('sejam2.html',
    { 
      new_instance: true,
      width:1200,
      height:800
    });
}

nw.App.on('open', openApp);
openApp();
