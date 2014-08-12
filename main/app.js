var fs = require('fs');
var process = require('process');
var child_process = require('child_process');

var IOLIB = require('./device');
var io = new IOLIB.IO({
  log: true,
  quickInit: false
});
var handle = io.mug_init();

var imageWidth = 16;
var imageHeight = 12;
var imageWidthCompressed = imageWidth/2;
var imageHeightCompressed = imageHeight
var singleImageSize = imageWidth*imageHeight;
var singleImageSizeCompressed = imageWidthCompressed*imageHeightCompressed;
var scopeApp = [[10, 4], [14, 8]];
var scopeShutDown = [[2, 4], [5, 7]];
var appStack = [];

function pushAppIntoStack(app) {
  appStack.push(app);
  child_process.exec('./setFrontEndApp '+app.pid, function(error, stdout, stderr){
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
}

function popAppFromStack() {
  // Now when an app escape, we will back to main app, not a real app stack;
  appStack = [];
  appStack.push(process);
  child_process.exec('./setFrontEndApp '+process.pid, function(error, stdout, stderr){
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
}

var startSmartMug() {
  var startImg = fs.readFileSync('./image/startup.json', 'utf8');
  appStack.push(process);
  io.mug_disp_raw_N(handle, JSON.parse(startImg).img0, 1, 100);
}

io.mug_touch_on(function(x, y, id) {
  // In main app
  if (appStack[appStack.length-1] == process) {
    if (x>=scopeApp[0][0] && x<=scopeApp[1][0] && y>=scopeApp[0][1] && y<=scopeApp[1][1]) {
      var childProcess = child_process.fork('displayApp.js');
      pushAppIntoStack(childProcess);
    }
    if (x>=scopeShutDown[0][0] && x<=scopeShutDown[1][0] && y>=scopeShutDown[0][1] && y<=scopeShutDown[1][1]) {
      child_process.exec('shutdown')
    }
  } else {
    appStack[appStack.length-1].send({'mug_touch_on':[x, y, id]});
  }
});

io.mug_gesture_on(function(g) {
  // In main app
  if (frontEndApp[0] == process) {
    // No handler for gesture in main app;
  } else {
    appStack[appStack.length-1].send({'mug_gesture_on':g});
  }
});

process.on('message', function(o){
  if (o['escape']) {
    popAppFromStack();
  }
});

startSmartMug();
