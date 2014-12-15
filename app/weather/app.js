var fs = require('fs');
var path = require('path');
var http = require('http');
var child_process = require('child_process');
var emitter = require('events').EventEmitter;

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[userApp weather] ';

var ledDisp = require('../weChat/display.js').disp;
var forceTerminate = require('../weChat/display.js').forceTerminate;

var Status = {invalid:'invalid',
              dispLoading:'dispLoading',
              dispAnimation:'dispAnimation',
              dispDetails:'dispDetails'};
var dispStatus = Status.invalid;

var ledDispEmitter = new emitter();
var contentBuffer = [];
var content = '';

var weatherCondition = null;
var handler = function(o) {
  if (o['content']) {
    try {
      weatherCondition = JSON.parse(o['content']).weather;
      contentBuffer.unshift(fs.readFileSync(path.join(__dirname, weatherCondition.weatherKey, 'media.json'), 'utf8'));
    } catch(ex) {
      console.log(ex);
    }
  }
}

var animationID = -1;
ledDispEmitter.on('finish', function(id) {
  // Filter finish event emitted by led display except the first one
  if (id != animationID) {
    //console.log('Ignore the event'+id+', '+animationID);
    return;
  }
  if (contentBuffer.length != 0) {
    content = contentBuffer.pop();
    console.log('Pop an animation'+content);
    switch (dispStatus) {
      case Status.dispLoading:
        if (!JSON.parse(content).isAudio && !JSON.parse(content).isVideo) {
          ledDisp(content, 150, false, true, ledDispEmitter);
          animationID++;
          dispStatus = Status.dispAnimation;
        }
        break;
      case Status.dispAnimation:
        if (!JSON.parse(content).isAudio && !JSON.parse(content).isVideo) {
          ledDisp(content, 150, false, true, ledDispEmitter);
          animationID++;
          dispStatus = Status.dispAnimation;
        }
        break;
    }
  }
});

var getContentProcess = null;

var weather = function() {
  getContentProcess = child_process.fork(path.join(__dirname, 'getWeather.js'));
  getContentProcess.on('message', handler);

  var loading = fs.readFileSync(path.join(__dirname, './loading.json'), 'utf8');
  ledDisp(loading, 150, false, false, ledDispEmitter);
  animationID++;
  dispStatus = Status.dispLoading;
};

weather();

// Touch event handler begin
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    try {
      getContentProcess.send({'ToBackEnd':true});
    } catch (ex) {
      console.log(logPrefix+'send to child process error');
    }
  }
});

io.touchPanel.on('gesture', function(gesture) {
  //console.log(logPrefix+'getsture='+gesture);
  if (gesture == 'MUG_SWIPE_DOWN') {
    try {
      getContentProcess.send({'InstantUpdate':true});
    } catch (ex) {
      console.log(logPrefix+'send to child process error');
    }
  } else if (gesture == 'MUG_SWIPE_LEFT' || gesture == 'MUG_SWIPE_RIGHT') {
    switch (dispStatus) {
      case Status.dispLoading:
        break;
      case Status.dispAnimation:
        forceTerminate();
        io.disp_text_marquee_async('PM25:'+weatherCondition.pm25+'  Current Temperature:'+weatherCondition.temperature, 'red', 100, -1);
        break;
      case Status.dispDetails:
        //forceTerminate();
        ledDisp(content, 150, false, true, ledDispEmitter);
        animationID++;
        dispStatus = Status.dispAnimation;
        break;
    }
  }
});
// Touch event handler end
