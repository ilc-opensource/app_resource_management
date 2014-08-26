var fs = require('fs');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var isPreviousImageDisComplete = false;
var imageIter = -1;
var imgs = null;
function notification() {
  imgs = JSON.parse(fs.readFileSync(path.join(__dirname, 'notification.json'), 'utf8'));
  isPreviousImageDisComplete = true;
}

function dispAnimation() {
  if (!isPreviousImageDisComplete) {return;}
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter>=imgs.numberOfImg) { sys.exit(); return;}
  dispSingle(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;
}
function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}
setInterval(dispAnimation, 500);

/*function notification() {
  var w = JSON.parse(fs.readFileSync(path.join(__dirname, 'notification.json'), 'utf8'));
  io.disp_raw_N(w.image, w.numberOfImg, 1000);
  sys.exit(); // Must be add
}*/

notification();

// Can't access this, sys must deal with this issue
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_CLICK') {
    sys.exit();
  }
  /*var nextApp = path.join(__dirname, 'app.js');
  // Notify main app to create a new app
  console.log(logPrefix+"Notification launch a new app"+nextApp);
  //process.send({'newApp': nextApp});
  sys.newApp(nextApp);*/
});
