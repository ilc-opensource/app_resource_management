var util = require("util");
var fs = require("fs");
var PNG = require('png-js');
var JPEG = require('jpeg-js');
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
/*
function compressJPG(data) {
  var image = [];
  var img = new Image; // Create a new Image
  img.src = data;

  var canvas = new Canvas(16, 12);
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  var p = ctx.getImageData(0, 0, 16, 12);
  for (var x=0; x<p.data.length; x+=8) {
    var pixels = 0;
    var R = p.data[x]>128?1:0;
    var G = p.data[x+1]>128?1:0;
    var B = p.data[x+2]>128?1:0;
    pixels += R+G*2+B*4;

    R = p.data[x+4]>128?1:0;
    G = p.data[x+5]>128?1:0;
    B = p.data[x+6]>128?1:0;
    pixels += (R+G*2+B*4)*16;

    image.push(pixels);
  }
  return image;
}
*/
function compressImage(p) {
  var image = [];

  for (var x=0; x<p.data.length; x+=8) {
    var pixels = 0;
    var R = p.data[x]>128?1:0;
    var G = p.data[x+1]>128?1:0;
    var B = p.data[x+2]>128?1:0;
    pixels += R+G*2+B*4;

    R = p.data[x+4]>128?1:0;
    G = p.data[x+5]>128?1:0;
    B = p.data[x+6]>128?1:0;
    pixels += (R+G*2+B*4)*16;

    image.push(pixels);
  }
  return image;
}

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
    if (files[i].match(/.jpg$/)) {
      imgs.concat(compressImage(JPEG.decode(fs.readFileSync(files[i])).data));
    } else {
      return

      //imgs.concat(compressImage(PNG.load(files[i])));
    }
  }
  this.disp_raw_N(imgs, number, interval);
};

module.exports = io;
