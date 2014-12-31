var path = require('path');
var child_process = require('child_process');
var ui = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');
var logPrefix = '[app http] '
var os = require('os');
var IOLIB = require('../../../device');
var io = new IOLIB.IO();

var getIP = function() {
  var ifaces=os.networkInterfaces();
  for (var dev in ifaces) {

    if(dev != "wlan0") 
      continue;

    var alias=0;

    for(var idx in ifaces[dev]) {
      details = ifaces[dev][idx];
      console.log(JSON.stringify(details));
      if (details.family=='IPv4') {
        console.log("return " + details.address);
        return details.address;
      }
    }
  }  

  return undefined;
};

var disp = io.mug_disp_init();
var touch = io.mug_touch_init();

var ip = getIP();

io.mug_set_text_marquee_style(io.MQ_PROLOG);

if(ip == undefined) {
  console.log("no ip, abort!");
  io.mug_disp_text_marquee(disp, "No IP!", "red", 100, 1);
  process.exit();
} else {
  io.mug_disp_text_marquee(disp, "search", "yellow", 100, 1);
}

ui.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    //console.log(logPrefix+'kill the main app pid='+appProcess.pid);
    process.exit();
  }
});

var isOn = false;

var checkHttp = function(cb) {
  child_process.execFile(__dirname + "/check_http.sh", {"cwd": __dirname}, function(err, stdout, stderr){
    if(err) {
      console.log("check_http.sh error: " + err);
    } else {
      isOn = stdout.match("OK");
 
      if(isOn) {
        io.mug_disp_img(disp, "http_on.bmp");
        console.log("http is ON");
      } else {
        io.mug_disp_img(disp, "http_off.bmp");
        console.log("http is OFF");
      }
    }

    if(cb)
      cb(isOn);
  });
};

var startHttp = function() {
  console.log("try to start http");
  io.mug_disp_img(disp, "http_on.bmp");

  child_process.execFile(__dirname + "/start_http.sh", {"cwd": __dirname}, function(error) {
    var info = "start http";

    if(error)
      console.log(info + " FAILED!");
    else
      console.log(info + " DONE!");
  
    checkHttp();
  });

};

var stopHttp = function() {
  console.log("try to stop http");
  io.mug_disp_img(disp, "http_off.bmp");
  child_process.execFile(__dirname + "/stop_http.sh", {"cwd": __dirname}, function(error) {
    var info = "stop http";
    
    if(error)
      console.log(info + " FAILED!");
    else
      console.log(info + " DONE!");
    
    checkHttp();
  });

};


checkHttp();

io.mug_gesture_on(touch, io.MUG_GESTURE, function(g, info) {
  if(g == io.MUG_SWIPE_UP || g == io.MUG_SWIPE_DOWN) {
    console.log('toggle http');
    checkHttp(function(on) {
      if(on)
        stopHttp();
      else
        startHttp();
    });
  }
});


