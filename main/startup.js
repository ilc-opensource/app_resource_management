var fs = require('fs');
var path = require('path');

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[sys startup] ';

var startup = [
  path.join(__dirname, './image/app.jpg'),
  path.join(__dirname, '../app/get_ip/icon.bmp'),
  path.join(__dirname, '../app/mug_shut_down/icon.bmp')];

var startSmartMug = function() {
  disp(index);
};

function disp(i) {
  io.disp_N([startup[i]], 1, 0);
}

var index = 0;
startSmartMug();

io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (index == 0 && e == 'TOUCH_CLICK') {
    sys.newApp(path.join(__dirname, 'app.js'));
  }
  if (index == 1 && e == 'TOUCH_CLICK') {
    sys.newApp(path.join(__dirname, '../app/get_ip/app.js'));
  }
  if (index == 2 && e == 'TOUCH_CLICK') {
    sys.newApp(path.join(__dirname, '../app/mug_shut_down/app.js'));
  }
});

io.touchPanel.on('gesture', function(gesture) {
  if (gesture == 'MUG_SWIPE_LEFT') {
    index = (index+1)==startup.length?0:(index+1);
    disp(index);
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    index = (index==0)?(startup.length-1):(index-1);
    disp(index);
  }
});
