var fs = require('fs');
var path = require('path');

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var isPreviousImageDisComplete = false;
var imageIter = -1;
var imgs = null;
function notification(icon) {
  // 
  try {
    imgs = JSON.parse(fs.readFileSync(icon, 'utf8'));
  } catch (ex) {
    
  }
  // Create an animation based on the single image
  imgs.numberOfImg = 7;
  imgs.img2 = imgs.img0;
  imgs.img4 = imgs.img0;
  imgs.img6 = imgs.img0;
  imgs.img1 = imgs.img3 = imgs.img5 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  
  isPreviousImageDisComplete = true;
}

function dispAnimation() {
  if (!isPreviousImageDisComplete) {
    return;
  }
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter>=imgs.numberOfImg) {
    sys.exit();
    return;
  }
  dispSingle(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;
}
function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}
setInterval(dispAnimation, 500);

//io.touchPanel.appHandleEscape = true;

notification(process.argv[3]);

// Can't access this, sys must deal with this issue
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_CLICK') {
    sys.newApp(process.argv[4]);
    process.exit();
    //sys.exit();
  }
});
