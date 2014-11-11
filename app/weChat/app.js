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

var ledDisp = require('./display.js').disp;
var forceTerminate = require('./display.js').forceTerminate;

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
              endPlay:'endPlay',
              readyForRecordAudio:'readyForRecordAudio',
              recordAudio:'recordAudio'};

var dispStatus = Status.invalid;

var ledDispEmitter = new emitter();

var getContentProcess = null;
var audioPlayProcess = null;
var audioRecordProcess = null;
var needUpload = true;
var content = '';
var audioFile = '';
var contentBuffer = [];

var handler = function(o) {
  if (o['content']) {
    contentBuffer.unshift(o['content']);
  }
}

var animationCount = -1;
ledDispEmitter.on('finish', function(count) {
  if (count != animationCount) {
    //console.log('Ignore the event'+count+', '+animationCount);
    return;
  }
  if (contentBuffer.length != 0) {
    content = contentBuffer.pop();
    console.log('Pop an animation'+content);
    switch (dispStatus) {
      case Status.dispLoading:
        if (!JSON.parse(content).isAudio && !JSON.parse(content).isVideo) {
          ledDisp(content, 150, false, true, ledDispEmitter);
          animationCount++;
          dispStatus = Status.dispAnimation;
        } else if (JSON.parse(content).isAudio) {
          var readyForPlay = fs.readFileSync(path.join(__dirname, 'readyForPlay.json'), 'utf8');
          ledDisp(readyForPlay, 150, false, true, ledDispEmitter);
          animationCount++;
          audioFile = path.join(__dirname, path.basename(JSON.parse(content).file));
          dispStatus = Status.readyForPlayAudio;
        } else if (JSON.parse(content).isVideo) {
        }
        break;
      case Status.dispAnimation:
        if (!JSON.parse(content).isAudio && !JSON.parse(content).isVideo) {
          ledDisp(content, 150, false, true, ledDispEmitter);
          animationCount++;
          dispStatus = Status.dispAnimation;
        } else if (JSON.parse(content).isAudio) {
          var readyForPlay = fs.readFileSync(path.join(__dirname, 'readyForPlay.json'), 'utf8');
          ledDisp(readyForPlay, 150, false, true, ledDispEmitter);
          animationCount++;
          audioFile = path.join(__dirname, path.basename(JSON.parse(content).file));
          dispStatus = Status.readyForPlayAudio;
        } else if (JSON.parse(content).isVideo) {
        }
        break;
      case Status.readyForPlayAudio:
        // In this case, next animation is not allowed to display
        contentBuffer.push(content);
        break;
      case Status.playAudio:
        // In this case, next animation is not allowed to display
        contentBuffer.push(content);
        break;
      case Status.endPlay:
        if (!JSON.parse(content).isAudio && !JSON.parse(content).isVideo) {
          ledDisp(content, 150, false, true, ledDispEmitter);
          animationCount++;
          dispStatus = Status.dispAnimation;
        } else if (JSON.parse(content).isAudio) {
          var readyForPlay = fs.readFileSync(path.join(__dirname, 'readyForPlay.json'), 'utf8');
          ledDisp(readyForPlay, 150, false, true, ledDispEmitter);
          animationCount++;
          audioFile = path.join(__dirname, path.basename(JSON.parse(content).file));
          dispStatus = Status.readyForPlayAudio;
        } else if (JSON.parse(content).isVideo) {
        }
        break;
      case Status.readyForRecordAudio:
        // In this case, next animation is not allowed to display
        contentBuffer.push(content);
        break;
      case Status.recordAudio:
        // In this case, next animation is not allowed to display
        contentBuffer.push(content);
        break;
      default:
        // In this case, next animation is not allowed to display
        contentBuffer.push(content);
        break;
    }
  }
});

var weChat = function() {
  getContentProcess = child_process.fork(path.join(__dirname, 'getWeChat.js'));
  getContentProcess.on('message', handler);

  var loading = fs.readFileSync(path.join(__dirname, './loading.json'), 'utf8');
  ledDisp(loading, 150, false, false, ledDispEmitter);
  animationCount++;
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
    if (dispStatus == Status.readyForPlayAudio || dispStatus == Status.endPlay) {
      var play = fs.readFileSync(path.join(__dirname, 'play.json'), 'utf8');
      ledDisp(play, 150, false, false, ledDispEmitter);
      animationCount++;
      dispStatus = Status.playAudio;
      console.log('Playing audio file '+audioFile);
      child_process.exec('amixer -c 1 cset numid=6 99%', function(err, stdout, stderr){});
      audioPlayProcess = child_process.execFile('gst-launch-0.10', ['filesrc', 'location='+audioFile, '!', 'flump3dec', '!', 'alsasink', 'device=plughw:1,0'], function(err, stdout, stderr) {
      //child_process.exec('time '+path.join(__dirname, 'a.out'), function(err, stdout, stderr) {
        console.log('gstreamer stdout='+stdout);
        var readyForPlay = fs.readFileSync(path.join(__dirname, 'readyForPlay.json'), 'utf8');
        ledDisp(readyForPlay, 150, false, true, ledDispEmitter);
        animationCount++;
        console.log('EndPlay:'+animationCount);
        dispStatus = Status.endPlay;
      });
    } else if (dispStatus == Status.readyForRecordAudio) {
      // playing and recording is the same animation
      var record = fs.readFileSync(path.join(__dirname, 'play.json'), 'utf8');
      ledDisp(record, 150, false, false, ledDispEmitter);
      animationCount++;
      dispStatus = Status.recordAudio;
      console.log('Recording an audio file output.mp3');
      audioRecordProcess = child_process.execFile('arecord', ['-f', 'dat', '-r', '48000', '-D', 'hw:1,0', '-t', 'wav', 'output.wav'], function(err, stdout, stderr) {
      //child_process.exec('time '+path.join(__dirname, 'a.out'), function(err, stdout, stderr) {
        console.log('audio record stdout='+stdout);
        if (!needUpload) {
          console.log('audio record do not need to upload');
          return;
        }
        child_process.exec('lame -V9 output.wav output.mp3; curl -F mugID='+mugID+' -F app=talk -F isAudio=true -F media=@'+path.join(__dirname, 'output.mp3')+' "http://www.pia-edison.com/uploadImage"', function(err, stdout, stderr) {
          console.log('upload audio file, stdout='+stdout);
        });
      });
      //arecord -f dat -r 48000 -D hw:1,0 -t wav | lame - test.mp3
    } else if (dispStatus == Status.recordAudio) {
      try {
        needUpload = true;
        process.kill(audioRecordProcess.pid);
        var readyForRecord = fs.readFileSync(path.join(__dirname, 'readyForRecord.json'), 'utf8');
        ledDisp(readyForRecord, 150, false, true, ledDispEmitter);
        animationCount++;
        dispStatus = Status.readyForRecordAudio;
      } catch (ex) {
      }
    }
  }
});

var savedContext = {};

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'receive a gesture '+gesture);
  if (gesture == 'MUG_SWIPE_DOWN') {
    try {
      getContentProcess.send({'InstantUpdate':true});
    } catch (ex) {
      console.log(logPrefix+'send to child process error');
    }
  } else if (gesture == 'MUG_SWIPE_LEFT' || gesture == 'MUG_SWIPE_RIGHT') {
    //sys.newApp(path.join(__dirname, 'audio.js'));
    // Terminate other display action immediately
    switch (dispStatus) {
      case Status.dispLoading:
      case Status.dispAnimation:
      case Status.readyForPlayAudio:
      case Status.endPlay:
        savedContext = forceTerminate();
        if (savedContext != null) {
          var readyForRecord = fs.readFileSync(path.join(__dirname, 'readyForRecord.json'), 'utf8');
          ledDisp(readyForRecord, 150, false, true, ledDispEmitter);
          animationCount++;
          dispStatus = Status.readyForRecordAudio;
        }
        savedContext.status = dispStatus;
        break;
      case Status.playAudio:
        // TODO: Kill audio play process
        process.kill(audioPlayProcess.pid);
        savedContext = forceTerminate();
        if (savedContext != null) {
          var readyForRecord = fs.readFileSync(path.join(__dirname, 'readyForRecord.json'), 'utf8');
          ledDisp(readyForRecord, 150, false, true, ledDispEmitter);
          animationCount++;
          dispStatus = Status.readyForRecordAudio;
        }
        savedContext.status = dispStatus;
        break;
      case Status.readyForRecordAudio:
        if (typeof savedContext.status == Status.playAudio) {
          var readyForPlay = fs.readFileSync(path.join(__dirname, 'readyForPlay.json'), 'utf8');
          ledDisp(readyForPlay, 150, false, true, ledDispEmitter);
          animationCount++;
          //audioFile = path.join(__dirname, path.basename(JSON.parse(content).file));
          dispStatus = Status.readyForPlayAudio;
        } else {
          //ledDisp(readyForPlay, 150, false, true, ledDispEmitter);
          ledDisp(savedContext.data, savedContext.interval, savedContext.isAtomic, savedContext.dispWhole, savedContext.e);
          animationCount++;
          //audioFile = path.join(__dirname, path.basename(JSON.parse(content).file));
          dispStatus = savedContext.status;
        }
        break;
      case Status.recordAudio:
        needUpload = false;
        process.kill(audioRecordProcess.pid);
        // TODO: stop record audio and upload
        if (typeof savedContext.status == Status.playAudio) {
          var readyForPlay = fs.readFileSync(path.join(__dirname, 'readyForPlay.json'), 'utf8');
          ledDisp(readyForPlay, 150, false, true, ledDispEmitter);
          animationCount++;
          //audioFile = path.join(__dirname, path.basename(JSON.parse(content).file));
          dispStatus = Status.readyForPlayAudio;
        } else {
          //ledDisp(readyForPlay, 150, false, true, ledDispEmitter);
          ledDisp(savedContext.data, savedContext.interval, savedContext.isAtomic, savedContext.dispWhole, savedContext.e);
          animationCount++;
          //audioFile = path.join(__dirname, path.basename(JSON.parse(content).file));
          dispStatus = savedContext.status;
          console.log('dispStatus='+dispStatus);
        }
        break;
      default:
        // In this case, next animation is not allowed to display
        contentBuffer.push(content);
        break;
    }

    var readyForRecord = fs.readFileSync(path.join(__dirname, 'readyForRecord.json'), 'utf8');
    ledDisp(readyForRecord, 150, false, true, ledDispEmitter);
    animationCount++;
    dispStatus = Status.readyForRecordAudio;
  }
});

try {
  var mugID = fs.readFileSync('/etc/device_id', 'utf8');
} catch (ex) {
  console.log(logPrefix+'Cant get mug ID');
  return;
}

