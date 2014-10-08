// seperate display and get content into different process, 
// as 
var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[userApp freeDraw] ';

var getFreeDrawProcess = null;
var freeDrawContent = '';
var handler = function(o) {
  if (o['freeDraw']) {
    freeDrawContent = o['freeDraw'];
  }
};
var hasContent = false;
var currentDispContent = null;

// Animation display begin
var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
function displayFreeDraw() {
  if (!isAnimationDispComplete) {
    setTimeout(displayFreeDraw, 500);
    return;
  }
  isAnimationDispComplete = false;
  // The animation is only one image, don't need to refresh it
  if (currentDispContent == freeDrawContent &&
    JSON.parse(currentDispContent).numberOfImg == 1) {
    isAnimationDispComplete = true;
    setTimeout(displayFreeDraw, 500);
    return;
  }
  if (freeDrawContent == '' || freeDrawContent == '\n') {
    var w = fs.readFileSync(path.join(__dirname, './loading.json'), 'utf8');
    imgs = JSON.parse(w);
    hasContent = false;
  } else {
    try {
      imgs = JSON.parse(freeDrawContent);
      hasContent = true;
      currentDispContent = freeDrawContent
    } catch(ex) {
      imgs = null;
      isAnimationDispComplete = true;
      isPreviousImageDisComplete = false;
      hasContent = false;
      setTimeout(displayFreeDraw, 500);
      return;
    }
  }
  isPreviousImageDisComplete = true;
  imageIter = -1;
  setTimeout(displayFreeDraw, 500);
}
function dispAnimation() {
  if (!isPreviousImageDisComplete) {
    setTimeout(dispAnimation, 50);
    return;
  }
  isPreviousImageDisComplete = false;
  imageIter++;
  if (freeDrawContent != '' && !hasContent) { // Terminate loading animation immediately
    isAnimationDispComplete = true;
    setTimeout(dispAnimation, 50);
    return;
  }
  if (imageIter>=imgs.numberOfImg) {
    isAnimationDispComplete = true;
    setTimeout(dispAnimation, 50);
    return;
  }
  if (currentDispContent != null &&
    currentDispContent != freeDrawContent &&
    imgs.textEnd != undefined) {
    for (var i=0; i<imgs.textEnd.length; i++) {
      if ((imageIter-1) == imgs.textEnd[i]) {
        isAnimationDispComplete = true;
        setTimeout(dispAnimation, 50);
        return;
      }
    }
  }
  dispSingle(imgs['img'+imageIter], 1, 50);
  isPreviousImageDisComplete = true;
  setTimeout(dispAnimation, 50);
}
function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}
// Animation display End

var freeDraw = function() {
  getFreeDrawProcess = child_process.fork(path.join(__dirname, 'getFreeDraw.js'));
  getFreeDrawProcess.on('message', handler);
  displayFreeDraw();
  dispAnimation();
};

freeDraw();

// Touch event handler begin
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    try {
      process.kill(getFreeDrawProcess.pid);
    } catch (ex) {
    }
    process.exit();
  }
});

io.touchPanel.on('gesture', function(gesture) {
});
// Touch event handler end
