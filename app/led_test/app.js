var fs = require('fs');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[Led test] ';
var index = 0;

var images = [path.join(__dirname, 'red.json'),
  path.join(__dirname, 'green.json'),
  path.join(__dirname, 'blue.json'),
  path.join(__dirname, 'white.json'),
  path.join(__dirname, 'greenBlack.json')];

function disp() {
  try {
    var data = fs.readFileSync(images[index], 'utf8');
  } catch (ex) {
    console.log(ex);
    return;
  }
  index++;
  if (index==images.length) {
    index=0;
  }
  var msg=JSON.parse(data);
  io.disp_raw_N(msg.img0, 1, 0);

  setTimeout(disp, 5000);
}

disp();
