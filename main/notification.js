var fs = require('fs');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

function notification() {
  var w = JSON.parse(fs.readFileSync(path.join(__dirname, 'notification.json'), 'utf8'));
  io.disp_raw_N(w.image, w.numberOfImg, 1000);
  sys.exit(); // Must be add
}

notification();
