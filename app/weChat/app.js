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
var hasNewContent = false;

// Animation display begin
var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
function displayweChat() {
  if (!isAnimationDispComplete) {
    setTimeout(displayweChat, 1000);
    return;
  }
  isAnimationDispComplete = false;
  isPreviousImageDisComplete = true;
  imageIter = -1;
  var w = weChatContent;
  if (w == '' || w == '\n') {
    var w = fs.readFileSync(path.join(__dirname, './loading.json'), 'utf8');
    imgs = JSON.parse(w);
    hasNewContent = false;
  } else {
    try {
      imgs = JSON.parse(w);
      hasNewContent = true;
    } catch(ex) {
      imgs = null;
      isAnimationDispComplete = true;
      isPreviousImageDisComplete = false;
    }
  }
  setTimeout(displayweChat, 1000);
}
function dispAnimation() {
  if (!isPreviousImageDisComplete) {
    setTimeout(dispAnimation, 50);
    return;
  }
  isPreviousImageDisComplete = false;
  imageIter++;
  if (weChatContent != '' && !hasNewContent) {
    isAnimationDispComplete = true;
    setTimeout(dispAnimation, 50);
    return;
  }
  if (imageIter>=imgs.numberOfImg) {
    isAnimationDispComplete = true;
    setTimeout(dispAnimation, 50);
    return;
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
  //console.log(logPrefix+'getsture='+gesture);
});
// Touch event handler end
