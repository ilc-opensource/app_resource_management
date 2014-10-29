var util = require("util");
var EventEmitter = require("events").EventEmitter;

var context = require('./context.js');

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

io.touchPanel = require('./touchPanel.js');

io.disp_raw_N = function(imgs, number, interval) {
  io.mug_disp_raw_N(handle, imgs, number, interval);
  context.lastImg = [];
  for (var i=0; i<singleImageSizeCompressed; i++) {
    context.lastImg[i] = imgs[singleImageSizeCompressed*(number-1)+i];
  }
};

io.disp_N = function(files, number, interval) {
  var imgs = [];
  for (var i=0; i<files.length; i++) {
    imgs.concat(fs.readFileSync(files[i]));
  }
  this.disp_raw_N(imgs, number, interval);
};

module.exports = io;
