var fs = require('fs');
var path = require('path');

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[sys startup] ';

var startup = [
  path.join(__dirname, './image/app.json'),
  path.join(__dirname, './image/setting.json')];

var startSmartMug = function() {
  disp(index);
};

function disp(i) {
  var appImg = fs.readFileSync(startup[i], 'utf8');
  io.disp_raw_N(JSON.parse(appImg).img0, 1, 0);
}

var index = 0;
startSmartMug();

io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (index == 0 && e == 'TOUCH_CLICK') {
    sys.newApp(path.join(__dirname, 'app.js'));
  }
  if (index == 1 && e == 'TOUCH_CLICK') {
    sys.newApp(path.join(__dirname, 'setting.js'));
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
