var mouse = process.binding('winmouse');

mouse.init(function (x,y,button,action) {
  console.log('JS EVENT '+x+','+y+' '+action+' '+button);
});
setTimeout(function () {},20000);
