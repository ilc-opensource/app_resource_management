// seperate weChat display and getWeChat into different process, 
// as 
var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var ledDisp = require('./display.js');
//ledDisp(w, 50, false, false, callback);

var logPrefix = '[userApp weChat] ';

var getContentProcess = null;
var content = '';
var handler = function(o) {
  if (o['content']) {
    content = o['content'];
  }
};

var dispContent = null;
var weChat = function() {
  getContentProcess = child_process.fork(path.join(__dirname, 'getWeChat.js'));
  getContentProcess.on('message', handler);

  dispContent = content;
  ledDisp(dispContent, 50, false, true, function() {
    dispContent = content;
  });
};

weChat();

// Touch event handler begin
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    try {
      getContentProcess.send({'ToBackEnd':true});
    } catch (ex) {
      console.log(logPrefix+'send to child process error');
    }
  }
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'receive a gesture '+gesture);
  if (gesture == 'MUG_SWIPE_DOWN') {
    try {
      getContentProcess.send({'InstantUpdate':true});
    } catch (ex) {
      console.log(logPrefix+'send to child process error');
    }
  } else if (gesture == 'MUG_SWIPE_LEFT' || gesture == 'MUG_SWIPE_RIGHT') {
    sys.newApp(path.join(__dirname, 'audio.js'));
  }
});
// Touch event handler end
