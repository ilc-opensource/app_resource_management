// seperate weChat display and getWeChat into different process, 
// as 
var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[userApp weChat] ';

var getWeChatProcess = null;
var weChatContent = '';
var handler = function(o) {
  if (o['weChat']) {
    weChatContent = o['weChat'];
  }
};
var hasContent = false;
var currentDispContent = null;

// Animation display begin
var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
function displayweChat() {
  if (!isAnimationDispComplete) {
    setTimeout(displayweChat, 500);
    return;
  }
  isAnimationDispComplete = false;
  // The animation is only one image, don't need to refresh it
  if (currentDispContent == weChatContent &&
    JSON.parse(currentDispContent).numberOfImg == 1) {
    isAnimationDispComplete = true;
    setTimeout(displayweChat, 500);
    return;
  }
  if (weChatContent == '' || weChatContent == '\n') {
    var w = fs.readFileSync(path.join(__dirname, './loading.json'), 'utf8');
    imgs = JSON.parse(w);
    hasContent = false;
  } else {
    try {
      imgs = JSON.parse(weChatContent);
      hasContent = true;
      currentDispContent = weChatContent
    } catch(ex) {
      imgs = null;
      isAnimationDispComplete = true;
      isPreviousImageDisComplete = false;
      hasContent = false;
      setTimeout(displayweChat, 500);
      return;
    }
  }
  isPreviousImageDisComplete = true;
  imageIter = -1;
  setTimeout(displayweChat, 500);
}
function dispAnimation() {
  if (!isPreviousImageDisComplete) {
    setTimeout(dispAnimation, 50);
    return;
  }
  isPreviousImageDisComplete = false;
  imageIter++;
  if (weChatContent != '' && !hasContent) { // Terminate loading animation immediately
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
    currentDispContent != weChatContent &&
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

var weChat = function() {
  getWeChatProcess = child_process.fork(path.join(__dirname, 'getWeChat.js'));
  getWeChatProcess.on('message', handler);
  displayweChat();
  dispAnimation();
};

weChat();

//setInterval(displayweChat, 100);
//setInterval(function(){dispAnimation();}, 100);

// Touch event handler begin
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  //if (e == 'TOUCH_HOLD') {
  //  sys.escape();
  //}
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'receive a gesture '+gesture);
  if (gesture == 'MUG_SWIPE_DOWN') {
    try {
      getWeChatProcess.send({'InstantUpdate':true});
    } catch (ex) {
      console.log(logPrefix+'send to child process error');
    }
  }
});
// Touch event handler end
