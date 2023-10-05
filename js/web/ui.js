/*
** (rough) Graphical User Interface emulation of blessed terminal API using jquery
**
*/


// Create a screen
function screen(options) {
  var width=80,
      height=25;
  return {
    cursor:{},
    width:width,
    height:height
  }
}


GUI = {
  screen:screen
}
