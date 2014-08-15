var fs = require('fs');
var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[sys startup] ';

var startup = ['./image/app.json', './image/setting.json', './image/shutdown.json'];
var indexCurrentImg = 0;
var startSmartMug = function() {
  //var appImg = fs.readFileSync(startup[indexCurrentImg], 'utf8');
  //io.disp_raw_N(JSON.parse(appImg).img0, 1, 100);
  disp(indexCurrentImg);
};

function disp(index) {
  var appImg = fs.readFileSync(startup[index], 'utf8');
  io.disp_raw_N(JSON.parse(appImg).img0, 1, 100);
}

io.touchPanel.on('touch', function(x, y, id) {
  if (indexCurrentImg == 0) {
  //if (x>=scopeApp[0][0] && x<=scopeApp[1][0] && y>=scopeApp[0][1] && y<=scopeApp[1][1]) {
    sys.newApp('appDisp.js');
  //}
  }
  if (indexCurrentImg == 1) {
  }
  if (indexCurrentImg == 2) {
  //if (x>=scopeShutDown[0][0] && x<=scopeShutDown[1][0] && y>=scopeShutDown[0][1] && y<=scopeShutDown[1][1]) {
    child_process.exec('shutdown')
  //}
  }
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'getsture='+gesture);
  if (gesture == 'MUG_SWIPE_LEFT') {
    indexCurrentImg = (indexCurrentImg+1)==startup.length?0:(indexCurrentImg+1);
    disp(indexCurrentImg);
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    indexCurrentImg = (indexCurrentImg==0)?(startup.length-1):(indexCurrentImg-1);
    disp(indexCurrentImg);
  } else if (gesture == 'MUG_HODE') {
  }
});

startSmartMug();
