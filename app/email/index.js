var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var fs = require('fs');
var path = require('path');
var config = require('./config.js');
var disp = require('./disp.js');
var pop3 = require('./pop3.js');

disp.init();

var emitter = pop3.emitter;

var countSave = undefined;

emitter.on('error', function(data) {
  console.log(data);
});

emitter.on('stat', function(data) {
  
  console.log('recv: ' + data.count);

  if(data.count < 0) {
    console.log('no valid count');
    return;
  }

  if(countSave == undefined || countSave != data.count) {
    console.log('****** New Mail ******');
    disp.disp_num(data.count);
  } 

  countSave = data.count;

});

pop3.init();

setInterval(function(){
  pop3.stat();
}, 1000);

// Touch event handler begin
// For none js app only
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    //console.log(logPrefix+'kill the main app pid='+appProcess.pid);
    try {
      process.kill(appProcess.pid);
    } catch (ex) {
    }
    //sys.escape();
    process.exit();
  }
});

