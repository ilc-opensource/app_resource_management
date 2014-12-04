var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[app mug_shut_down] '

//var appProcess = child_process.execFile(path.join(__dirname, 'mug_shut_down'));
var shutdown = child_process.spawn(path.join(__dirname, 'mug_shut_down'), []);

shutdown.on('exit', function() {
  console.log('exit');
  io.disp_N(["icon.bmp"], 1, 100);
  process.exit();
});

// Touch event handler begin
// For none js app only
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    //console.log(logPrefix+'kill the main app pid='+appProcess.pid);
    try {
      process.kill(appProcess.pid);
    } catch (ex) {
    }
    process.exit();
  }
});
