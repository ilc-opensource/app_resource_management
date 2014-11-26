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
var ip = getIP();
if(ip == undefined) {
  io.mug_disp_text_marquee_async(disp, "No IP, abort!", "red", 100, -1);

  ui.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
      process.exit();
    }
  });

} else {
  //io.mug_disp_text_marquee_async(disp, "http://" + ip, "cyan", 100, -1);
  io.mug_disp_img(disp, "http_on.bmp");

  var appProcess = child_process.execFile(path.join(__dirname, 'bin/www'), [], {'cwd':__dirname});

  // Touch event handler begin
  // For none js app only
  ui.touchPanel.on('touchEvent', function(e, x, y, id) {
    if (e == 'TOUCH_HOLD') {
      //console.log(logPrefix+'kill the main app pid='+appProcess.pid);
      try {
        process.kill(appProcess.pid);
      } catch (ex) {
      }
      process.exit();
    }
  });
}


