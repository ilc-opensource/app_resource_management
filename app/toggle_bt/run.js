var path = require('path');
var child_process = require('child_process');
var ui = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');
var IOLIB = require('../../../device');

var io = new IOLIB.IO();

var disp = io.mug_disp_init();
io.mug_disp_img(disp, __dirname + "/bt_on.bmp");

child_process.execFile("./start_bt.sh", [], {'cwd':__dirname});

ui.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    child_process.execFile("./stop_bt.sh", [], {'cwd':__dirname}, function(err, stdout, stderr) {
      process.exit();
    });
  }
});

