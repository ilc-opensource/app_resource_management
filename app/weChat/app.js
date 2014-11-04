// seperate weChat display and getWeChat into different process, 
// as when display is blocked, internet query can't be blocked;
var fs = require('fs');
var path = require('path');
var http = require('http');
var child_process = require('child_process');
var emitter = require('events').EventEmitter

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[userApp weChat] ';

var ledDisp = require('./display.js');

// 1: disp loading
// 2: disp animation
// 3: ready for play audio
// 4: playing audio
// 5: ready for record audio
// 6: recording audio
var Status = {invalid:'invalid',
              dispLoading:'dispLoading',
              dispAnimation:'dispAnimation',
              readyForPlayAudio:'readyForPlayAudio',
              playAudio:'playAudio',
              readyForRecordAudio:'readyForRecordAudio',
              recordAudio:'recordAudio'};

var dispStatus = Status.invalid;

var ledDispEmitter = new emitter();
ledDispEmitter.on('finish', function(){
  
});

var getContentProcess = null;
var content = '';
var audioFile = '';
var handler = function(o) {
  if (o['content']) {
    content = o['content'];

    if (dispStatus == Status.dispLoading) {
      if (!JSON.parse(content).isAudio) {
        ledDisp(content, 50, false, true, ledDispEmitter);
      } else if (JSON.parse(content).isAudio) {
        var readyForPlay = fs.readFileSync(path.join(__dirname, 'readyForPlay.json'), 'utf8');
        ledDisp(readyForPlay, 50, false, true, ledDispEmitter);
        audioFile = path.join(__dirname, path.basename(JSON.parse(content).file));
        dispStatus = 3;
      }
    }
  }
};

var weChat = function() {
  getContentProcess = child_process.fork(path.join(__dirname, 'getWeChat.js'));
  getContentProcess.on('message', handler);

  var loading = fs.readFileSync(path.join(__dirname, './loading.json'), 'utf8');
  ledDisp(loading, 50, false, true, ledDispEmitter);
  dispStatus = Status.dispLoading;
};

weChat();

io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    try {
      getContentProcess.send({'ToBackEnd':true});
    } catch (ex) {
      console.log(logPrefix+'send to child process error');
    }
  }
  if (e == 'TOUCH_CLICK') {
    if (dispStatus == 3) {
      var play = fs.readFileSync(path.join(__dirname, 'play.json'), 'utf8');
      ledDisp(play, 50, false, false, ledDispEmitter);
      dispStatus = 4
      child_process.exec('amixer -c 1 cset numid=6 99%; '+'gst-launch-0.10 filesrc location='+audioFile+' ! flump3dec ! alsasink device=plughw:1,0', function(err, stdout, stderr) {
        console.log('gstreamer stdout='+stdout);
        var readyForPlay = fs.readFileSync(path.join(__dirname, 'readyForPlay.json'), 'utf8');
        ledDisp(readyForPlay, 50, false, true, ledDispEmitter);
        dispStatus = 3;
      });
    }
  }
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'receive a gesture '+gesture);
  if (gesture == 'MUG_SWIPE_DOWN') {
    try {
      getContentProcess.send({'InstantUpdate':true});
    } catch (ex) {
      console.log(logPrefix+'send to child process error');
    }
  } else if (gesture == 'MUG_SWIPE_LEFT' || gesture == 'MUG_SWIPE_RIGHT') {
    sys.newApp(path.join(__dirname, 'audio.js'));
  }
});
