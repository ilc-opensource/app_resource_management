var fs = require('fs');
var child_process = require('child_process');

var appProcess = child_process.fork(path.join(__dirname, 'mole'));

// Touch event handler begin
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    process.kill(appProcess.pid);
    sys.escape();
  }
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'getsture='+gesture);
});
// Touch event handler end
