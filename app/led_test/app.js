var fs = require('fs');
var path = require('path');

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[Led test] ';
var index = 0;

var images = [__dirname+'red.json',
  __dirname+'green.json',
  __dirname+'blue.json',
  __dirname+'white.json',
  __dirname+'greeBlack.json'];

function disp() {
  try {
    var data = fs.readFileSync(images[index], 'utf8');
  } catch (ex) {
    return;
  }
  index++;
  if (index==images.length) {
    index=0;
  }
  var msg=JSON.parse(data);
  io.disp_raw_N(msg.img0, 1, 0);

  setTimeout(disp, 5);
}

disp();
