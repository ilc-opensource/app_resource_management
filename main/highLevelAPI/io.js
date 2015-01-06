var util = require("util");
var fs = require("fs");
var PNG = require('png-js');
var JPEG = require('jpeg-js');
var BMP = require('bmp-js');
var EventEmitter = require("events").EventEmitter;
var path=require('path');
var child_process = require('child_process');

var context = require('./context.js');

var IOLIB = require('../../../device');
var io = new IOLIB.IO({
  log: true,
  quickInit: false
});

var imageWidth = 16;
var imageHeight = 12;
var imageWidthCompressed = imageWidth/2;
var imageHeightCompressed = imageHeight
var singleImageSize = imageWidth*imageHeight;
var singleImageSizeCompressed = imageWidthCompressed*imageHeightCompressed;

// Touch panel
io.touchPanel = require('./touchPanel.js');

// Display
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

var dispHandle = io.mug_disp_init();

io.disp_raw_N = function(imgs, number, interval) {
  io.mug_disp_raw_N(dispHandle, imgs, number, interval);
  context.lastImg = [];
  for (var i=0; i<singleImageSizeCompressed; i++) {
    context.lastImg[i] = imgs[singleImageSizeCompressed*(number-1)+i];
  }
};

io.disp_N = function(files, number, interval) {
  var imgs = [];
  for (var i=0; i<files.length; i++) {
    if (files[i].match(/.jpg$/)) {
      var compressedData = compressImage(JPEG.decode(fs.readFileSync(files[i])));
      for (var j=0; j<compressedData.length; j++) {
        imgs.push(compressedData[j]);
      }
      //imgs.concat(compressedData);
    } else if (files[i].match(/.bmp$/)) {
      var compressedData = compressImage(BMP.decode(fs.readFileSync(files[i])));
      for (var j=0; j<compressedData.length; j++) {
        imgs.push(compressedData[j]);
      }
    } else {
      return;
      //imgs.concat(compressImage(PNG.load(files[i])));
    }
  }
  this.disp_raw_N(imgs, files.length, interval);
};

io.disp_text_marquee_async = function(text, color, interval, repeat) {
  io.mug_disp_text_marquee_async(dispHandle, text, color, interval, repeat);
};

io.text2Img = require('./text2Img.js'); // text, color (1), callback

// All bellow APIs are readonly APIs and can be accessed by multi-apps at the same time, call low-level API directly

// Motion sensor
//var motionHandle = io.mug_motion_init();

// Adc
//var adcHandle = io.mug_adc_init();

// Temperature
//var temperatureHandle = io.mug_temp_init();

// Battery
//var batteryHandle = io.mug_battery_init();

io.setFrontEndApp =function(pid) {
  child_process.exec(
    path.join(__dirname, './C/setFrontEndApp')+' '+pid,
    function(error, stdout, stderr) {
      if (error !== null) {
        console.log(logPrefix+'setFrontEndApp exec error: ' + error);
      }
    }
  );
};

module.exports = io;
