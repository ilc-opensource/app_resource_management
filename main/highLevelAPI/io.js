// For end user app to receive touch screen event

var util = require("util");
var EventEmitter = require("events").EventEmitter;
var touchPanel = require('./touchPanel.js');

var IOLIB = require('../../../device');
var io = new IOLIB.IO({
  log: true,
  quickInit: false
});
var handle = io.mug_disp_init();

var imageWidth = 16;
var imageHeight = 12;
var imageWidthCompressed = imageWidth/2;
var imageHeightCompressed = imageHeight
var singleImageSize = imageWidth*imageHeight;
var singleImageSizeCompressed = imageWidthCompressed*imageHeightCompressed;

io.context = {}; //{app:, lastImg: }
// when launch a app, pass the app name as the first parameter, correspond to app.js
io.context.app = process.argv[2];

io.touchPanel = touchPanel;

io.disp_raw_N = function(imgs, number, interval) {
  io.mug_disp_raw_N(handle, imgs, number, interval);
  io.context.lastImg = [];
  //console.log('disp_raw_N img='+imgs);
  for (var i=0; i<singleImageSizeCompressed; i++) {
    io.context.lastImg[i] = imgs[singleImageSizeCompressed*(number-1)+i];
  }
};

io.mug_touch_on(function(x, y, id) {
  console.log('touch event='+x+', '+y+', '+id);
  //mug_touch_on(x, y, id);
});
io.mug_gesture_on(io.MUG_GESTURE, function(g) {
  console.log('gesture event='+g);
  //mug_gesture_on(g);
});

console.log('Before io.mug_run_touch_thread();');
//io.mug_run_touch_thread();
console.log('After io.mug_run_touch_thread();');

module.exports = io;
