var fs = require('fs');
var child_process = require('child_process');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[app mole] '
var appProcess = child_process.execFile(path.join(__dirname, 'mole'), [], {'cwd':path.join(__dirname, '../app/whac-a-mole')});

appProcess.on('close', function (code, signal) {
  console.log('child process terminated due to receipt of signal '+signal);
});

// Touch event handler begin
// For none js app only
io.touchPanel.appHandleEscape = true;
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    console.log(logPrefix+'kill the main app pid='+appProcess.pid);
    try {
      process.kill(appProcess.pid);
    } catch (ex) {
    }
    sys.escape();
  }
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'getsture='+gesture);
});
// Touch event handler end
