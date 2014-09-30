var fs = require('fs');
var child_process = require('child_process');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[app get_ip] '

io.disp_raw_N([0,0,34,2,0,0,0,0,32,34,34,34,34,0,1,0,0,0,0,0,0,16,0,0,0,0,0,0,1,1,0,0,0,0,0,0,17,0,0,0,0,0,0,0,17,1,0,0,0,0,34,34,34,2,0,0,0,0,2,2,2,2,0,0,0,0,2,2,2,2,0,0,0,0,2,2,2,2,0,0,0,0,2,2,2,2,0,0,0,0,34,34,34,2,0,0], 1, 50);

var appProcess = child_process.fork(path.join(__dirname, 'app.js'), {'cwd':__dirname});

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
