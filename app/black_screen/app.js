var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[app black_screen] '

var blank = fs.readFileSync(path.join(__dirname, 'blank.json'), 'utf8');
io.disp_raw_N(JSON.parse(blank).img0, 1, 100);

// Touch event handler begin
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    process.exit();
  }
});
