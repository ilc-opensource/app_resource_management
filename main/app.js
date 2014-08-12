var fs = require('fs');
var child_process = require('child_process');

var IOLIB = require('../../device');
var io = new IOLIB.IO({
  log: true,
  quickInit: false
});
var handle = io.mug_init();

var logPrefix = '[main app] ';

var imageWidth = 16;
var imageHeight = 12;
var imageWidthCompressed = imageWidth/2;
var imageHeightCompressed = imageHeight
var singleImageSize = imageWidth*imageHeight;
var singleImageSizeCompressed = imageWidthCompressed*imageHeightCompressed;
var scopeApp = [[10, 4], [14, 8]];
var scopeShutDown = [[2, 4], [5, 7]];
var appStack = [];

function newApp(app) {
  // Check if a exist process for this app
  for (var i=0; i<appStack.length; i++) {
    if (appStack[i].app == app) {
      break;
    }
  }
  if (i==appStack.length) {
    var childProcess = child_process.fork(app);
    childProcess.on('message', handler);
    pushAppIntoStack({'process':childProcess, 'app':app});
  } else {
    
  }
}
function pushAppIntoStack(appInfo) {
  appStack.push(appinfo);
  child_process.exec('./setFrontEndApp '+appInfo['process'].pid, function(error, stdout, stderr){
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
  startSmartMug();
  child_process.exec('./setFrontEndApp '+process.pid, function(error, stdout, stderr){
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
}

var startSmartMug = function() {
  var startImg = fs.readFileSync('./image/startup.json', 'utf8');
  appStack.push(process);
  io.mug_disp_raw_N(handle, JSON.parse(startImg).img0, 1, 100);
}

//io.mug_touch_on(function(x, y, id) {
function mug_touch_on(x, y, id) {
  // In main app
  if (appStack[appStack.length-1] == process) {
    if (x>=scopeApp[0][0] && x<=scopeApp[1][0] && y>=scopeApp[0][1] && y<=scopeApp[1][1]) {
      newApp('displayApp.js');
      //var childProcess = child_process.fork('displayApp.js');
      //childProcess.on('message', handler);
      //pushAppIntoStack(childProcess);
    }
    if (x>=scopeShutDown[0][0] && x<=scopeShutDown[1][0] && y>=scopeShutDown[0][1] && y<=scopeShutDown[1][1]) {
      child_process.exec('shutdown')
    }
  } else {
    appStack[appStack.length-1].send({'mug_touch_on':[x, y, id]});
  }
}
//);

//io.mug_gesture_on(function(g) {
function mug_gesture_on(g) {
  // In main app
  if (appStack[appStack.length-1] == process) {
    // No handler for gesture in main app;
  } else {
    appStack[appStack.length-1].send({'mug_gesture_on':g});
  }
}
//);

//process.on('message', function(o){
var handler = function(o){
  console.log(logPrefix+'receive a message:'+o);
  if (o['escape']) {
    popAppFromStack();
  } else if (o['newApp']) {
    console.log(logPrefix+'create a new app'+o['newApp']);
    var childProcess = child_process.fork(o['newApp']);
    childProcess.on('message', handler);
    pushAppIntoStack(childProcess);
  }
};

startSmartMug();

// Emulate a touchPanel
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    //process.stdout.write('gesture: ' + chunk);
    var e = JSON.parse(chunk);
    if (e.touch) {
      mug_touch_on(e.touch[0], e.touch[1], e.touch[2]);
    } else if (e.gesture){
      mug_gesture_on(e.gesture);
    } else {
      console.log("touchPanel error");
    }
    //childProcess.send({"mug_gesture_on":chunk.slice(0, -1)});
  }
});
process.stdin.on('end', function() {
  process.stdout.write('end');
});
