var fs = require('fs');
var path = require('path');

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[sys startup] ';

var startup = [path.join(__dirname, './image/app.json'),
  path.join(__dirname, './image/setting.json'),
  path.join(__dirname, './image/shutdown.json')];

var indexCurrentImg = 0;
var startSmartMug = function() {
  disp(indexCurrentImg);
};

function disp(index) {
  var appImg = fs.readFileSync(startup[index], 'utf8');
  io.disp_raw_N(JSON.parse(appImg).img0, 1, 100);
}

io.touchPanel.on('touch', function(x, y, id) {
  if (indexCurrentImg == 0) {
    sys.newApp('appDisp.js');
  }
  if (indexCurrentImg == 1) {
  }
  if (indexCurrentImg == 2) {
    child_process.exec('shutdown')
  }
});

io.touchPanel.on('gesture', function(gesture) {
  if (gesture == 'MUG_SWIPE_LEFT') {
    indexCurrentImg = (indexCurrentImg+1)==startup.length?0:(indexCurrentImg+1);
    disp(indexCurrentImg);
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    indexCurrentImg = (indexCurrentImg==0)?(startup.length-1):(indexCurrentImg-1);
    disp(indexCurrentImg);
  } else if (gesture == 'MUG_HODE') {
    sys.escape();
  }
});

startSmartMug();
