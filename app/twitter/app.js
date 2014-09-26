var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[userApp twitter] ';

var getTwitterProcess = null;
var content = '';
var handler = function(o) {
  if (o['twitter']) {
    content = o['twitter'];
  }
};
var hasContent = false;
var currentDispContent = null;

// Animation display begin
var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
function display() {
  if (!isAnimationDispComplete) {
    setTimeout(display, 500);
    return;
  }
  isAnimationDispComplete = false;
  // The animation is only one image, don't need to refresh it
  if (currentDispContent == content &&
    JSON.parse(currentDispContent).numberOfImg == 1) {
    isAnimationDispComplete = true;
    setTimeout(display, 500);
    return;
  }
  if (content == '' || content == '\n') {
    var w = fs.readFileSync(path.join(__dirname, './loading.json'), 'utf8');
    imgs = JSON.parse(w);
    hasContent = false;
  } else {
    try {
      imgs = JSON.parse(content);
      hasContent = true;
      currentDispContent = content
    } catch(ex) {
      imgs = null;
      isAnimationDispComplete = true;
      isPreviousImageDisComplete = false;
      hasContent = false;
      setTimeout(display, 500);
      return;
    }
  }
  isPreviousImageDisComplete = true;
  imageIter = -1;
  setTimeout(display, 500);
}
function dispAnimation() {
  if (!isPreviousImageDisComplete) {
    setTimeout(dispAnimation, 50);
    return;
  }
  isPreviousImageDisComplete = false;
  imageIter++;
  if (content != '' && !hasContent) { // Terminate loading animation immediately
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
    currentDispContent != content &&
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

var twitter = function() {
  getTwitterProcess = child_process.fork(path.join(__dirname, 'getTwitter.js'));
  getTwitterProcess.on('message', handler);
  display();
  dispAnimation();
};

twitter();

//setInterval(display, 100);
//setInterval(function(){dispAnimation();}, 100);

// Touch event handler begin
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  //if (e == 'TOUCH_HOLD') {
  //  sys.escape();
  //}
});

io.touchPanel.on('gesture', function(gesture) {
  //console.log(logPrefix+'getsture='+gesture);
});
// Touch event handler end
