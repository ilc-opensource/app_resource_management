var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[app player] '

var appProcess = child_process.execFile(path.join(__dirname, 'player'), ['music'], {'cwd':__dirname});

// Touch event handler begin
// For none js app only
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    //console.log(logPrefix+'kill the main app pid='+appProcess.pid);
    try {
      process.kill(appProcess.pid);
      process.exec("killall -SIGINT gst-launch-0.10");
    } catch (ex) {
    }
    process.exit();
  }
});

