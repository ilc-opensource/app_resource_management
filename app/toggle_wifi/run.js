var path = require('path');
var child_process = require('child_process');
var logPrefix = '[app http] '
var os = require('os');
var IOLIB = require('../../../device');
var io = new IOLIB.IO();

var disp = io.mug_disp_init();
var touch = io.mug_touch_init();

var wait = function() {
  io.mug_disp_text_marquee_async(disp, "...", "cyan", 100, 1);
};

wait();

var isOn = false;

var check = function() {
  child_process.execFile("ifconfig", function(err, stdout, stderr) {
    if(err) {
      io.mug_disp_text_marquee_async(disp, "error", "red", 200, -1);
      return;
    }
    
    isOn = stdout.match("wlan0");

    if(isOn) {
      io.mug_disp_img(disp, "wifi_on.bmp");
      console.log("==> on");
    } else {
      io.mug_disp_img(disp, "wifi_off.bmp");
      console.log("==> off");
    }

    setTimeout(check, 1000);
  });

}

check();

var startService = function() {
  
  var info = "start service";
  console.log(info);

  wait();

  child_process.execFile(__dirname + "/start_wifi.sh", function(error) {
    var info = "start service";
    if(error)
      console.log(info + " error" + error);
    
    console.log(info + " done!");
  });
};

var stopService = function() {
  
  var info = "stop service";
  console.log(info);

  wait();

  child_process.execFile(__dirname + "/stop_wifi.sh", function(error) {
    var info = "stop service";
    if(error)
      console.log(info + " error" + error);
    
    console.log(info + " done!");
  });
};


io.mug_gesture_on(touch, io.MUG_GESTURE, function(g, info) {
  if(g == io.MUG_SWIPE_UP || g == io.MUG_SWIPE_DOWN) {
    console.log('toggle wifi');
    if(isOn)
      stopService();
    else
      startService();
  }
});


