var fs = require('fs');
var child_process = require('child_process');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[app email] '

var appProcess = child_process.fork(path.join(__dirname, 'index.js'), {'cwd':__dirname});

// Touch event handler begin
// For none js app only
io.touchPanel.appHandleEscape = true;
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    //console.log(logPrefix+'kill the main app pid='+appProcess.pid);
    try {
      process.kill(appProcess.pid);
    } catch (ex) {
    }
    //sys.escape();
    process.exit();
  }
});

