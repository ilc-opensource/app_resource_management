var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user freeDraw] ';

var getWeChatProcess = null;
var weChatContent = '';
var handler = function(o) {
  if (o['weChat']) {
    weChatContent = o['weChat'];
    //displayweChat(o['weChat']);
  }
};

// Animation display begin
var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
function displayweChat() {
  if (!isAnimationDispComplete) {return;}
  isAnimationDispComplete = false;
  isPreviousImageDisComplete = true;
  imageIter = -1;
  var w = weChatContent; //fs.readFileSync(path.join(__dirname, './weChat.json'), 'utf8');
//  console.log(logPrefix+'w='+w);
  if (w == '' || w == '\n') {
    var w = fs.readFileSync(path.join(__dirname, './media.json'), 'utf8');
    imgs = JSON.parse(w);
  } else {
    //console.log(logPrefix+'weChat file exist');
    try {
    imgs = JSON.parse(w);
    } catch(ex) {
      imgs = null;
      isAnimationDispComplete = true;
      isPreviousImageDisComplete = false;
    }
  }
}
function dispAnimation() {
  if (!isPreviousImageDisComplete) {return;}
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter>=imgs.numberOfImg) {isAnimationDispComplete = true; return;}
  dispSingle(imgs['img'+imageIter], 1, 50);
  isPreviousImageDisComplete = true;
}
function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}
// Animation display End

var weChat = function() {
  getWeChatProcess = child_process.fork(path.join(__dirname, 'getWeChat.js'));
  getWeChatProcess.on('message', handler);
  //setInterval(function(){queryweChat(action)}, 1000);
  displayweChat();
};

weChat();

setInterval(displayweChat, 100);
setInterval(function(){dispAnimation();}, 100);

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
