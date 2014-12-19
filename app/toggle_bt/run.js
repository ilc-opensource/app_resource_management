var fs = require('fs');
var child_process = require('child_process');
var ui = require('../../main/highLevelAPI/io.js');
var IOLIB = require('../../../device');

var io = new IOLIB.IO();

var disp = io.mug_disp_init();
//io.mug_disp_img(disp, __dirname + "/bt_on.bmp");
var content;
try {
  content = fs.readFileSync('/etc/device_id', { 'encoding' : 'utf8'});
} catch (e) {
  io.mug_disp_text_marquee(disp, "error, no id", "red", 100, 1);
  process.exit();
}

io.mug_disp_text_marquee_async(disp, 'mug_' + content, "cyan", 100, -1);

child_process.execFile("./start_bt.sh", [], {'cwd':__dirname});

ui.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    child_process.execFile("./stop_bt.sh", [], {'cwd':__dirname}, function(err, stdout, stderr) {
      process.exit();
    });
  }
});

