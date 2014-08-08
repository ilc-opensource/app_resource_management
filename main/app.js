var IOLIB = require('./device');
var fs = require('fs');
var process = require('process');
var child_process = require('child_process');

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
var scopeApp = [[], []];
var scopeShutDown = [[], []];
var frontEndApp = [];

var startSmartMug() {
  var startImg = fs.readFileSync('image/start.jpg', 'utf8');
  frontEndApp.push(process);
  io.mug_disp_raw_N(handle, JSON.parse(startImg).img0, 1, 100);
}

io.mug_touch_on(function(x, y, id) {
  // In main app
  if (frontEndApp[0] == process) {
    if (x>=scopeApp[0][0] && x<=scopeApp[1][0] && y>=scopeApp[0][1] && y<=scopeApp[1][1]) {
      frontEndApp.push((child_process.fork('displayApp.js')));
    }
    if (x>=scopeShutDown[0][0] && x<=scopeShutDown[1][0] && y>=scopeShutDown[0][1] && y<=scopeShutDown[1][1]) {
      child_process.exec('shutdown')
    }
  } else {
    frontEndApp[frontEndApp.length-1].send({'mug_touch_on':[x, y, id]}); // send touch event
  }
});

io.mug_gesture_on(function(g) {
    // In main app
  if (frontEndApp[0] == process) {
  } else {
    frontEndApp[frontEndApp.length-1].send({'mug_gesture_on':g}); // send touch event
  }
});

function disp_app() {
  fs.readFile('installedApp.json', 'utf8', function (err, data){
    if (err) throw err;
    var msg=JSON.parse(data);
    var imageName = {};
    for (var i in msg) {
      if (msg[i].name && msg[i].icon) {
        imageName.push('..\/app\/'+msg[i].name+'\/'+msg[i].icon);
      }
    }
    while(true) {
      for (var i=0; i<imageName.length; i++) {
        io.mug_disp_img(handle, imageName[i]);
        usleep(100 * 1000);
      }
    }
  });
}

// Update installed app list
fs.watch('installedApp.json', function(e, filename) {
  disp_app();
});

process.on('message', function(o){
  if (o['escape']) {
    frontEndApp.pop();
    setFrontEndApp();
  }
});
/*fs.readFile('ledAnimation.JSON',
  'utf8',
  function(err, data) {
    if (err) throw err;
    console.log(data);
    var msg=JSON.parse(data);
    var imageIter = 0;
    var data = [];
    var i = 0;
    while(true) {
      //io.mug_disp_raw_N(handle, msg.image, parseInt(msg.number), 100);
      for (i=0; i<singleImageSize; i++) {
        data[i] = msg.image[singleImageSize*imageIter+i];
      }
      io.mug_disp_raw_N(handle, data, 1, 100);
      imageIter++;
      if (imageIter==msg.number) {
        imageIter = 0;
      }
    }
  }
);
*/

startSmartMug();
