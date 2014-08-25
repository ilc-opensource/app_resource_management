var fs = require('fs');
var path = require('path');

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[sys startup] ';

var startup = [path.join(__dirname, './image/app.json'),
  path.join(__dirname, './image/setting.json'),
  path.join(__dirname, './image/shutdown.json')];

var startSmartMug = function() {
  disp(index);
};

function disp(i) {
  var appImg = fs.readFileSync(startup[i], 'utf8');
  io.disp_raw_N(JSON.parse(appImg).img0, 1, 100);
}

/*io.touchPanel.on('touch', function(x, y, id) {
  if (index == 0) {
    sys.newApp('appDisp.js');
  }
  if (index == 1) {
  }
  if (index == 2) {
    child_process.exec('shutdown')
  }
});*/

io.touchPanel.on('touchEvent', function(e, x, y, id) {
  console.log(logPrefix+'touchEvent='+e);
  if (index == 0 && e == 'TOUCH_CLICK') {
    sys.newApp('appDisp.js');
  }
  if (index == 1 && e == 'TOUCH_CLICK') {
  }
  if (index == 2 && e == 'TOUCH_CLICK') {
    child_process.exec('shutdown')
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

var index = 0;
startSmartMug();
