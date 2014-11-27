var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var utf8 = require('utf8');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[sys show app] ';
var appReady = false;
var index = 0;
var musicFile = [];
var audioDir = '/home/root/audio/'

function audioFS () {
  var rawMusicFile = fs.readdirSync(audioDir);
  for (var i=0; i<rawMusicFile.length; i++) {
    musicFile.push(utf8.encode(rawMusicFile[i]));
  }
  for (var i=0; i<musicFile.length; i++) {
    if (!musicFile[i].match(/.mp3$/)) {
      musicFile.splice(i, 1);
    }
  }
  if (musicFile.length==0) {
    io.disp_text_marquee_async('No music file', 100);
  } else {
    io.disp_text_marquee_async(musicFile[index], 100);
  }
}

audioFS();

io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    process.exit();
  }
});

io.touchPanel.on('gesture', function(gesture) {
  if (gesture == 'MUG_SWIPE_UP') {
    if(musicFile.length != 0) {
      child_process.exec('rm '+path.join(audioDir, musicFile[index]));
      musicFile.splice(index, 1);

      index = 0;
      if (musicFile.length==0) {
        io.disp_text_marquee_async('No music file', 100);
      } else {
        io.disp_text_marquee_async(musicFile[index], 100);
      }
    }
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    index = (index==0)?(musicFile.length-1):(index-1);
    io.disp_text_marquee_async(musicFile[index], 100);
  } else if (gesture == 'MUG_SWIPE_LEFT') {
    index = (index+1)==musicFile.length?0:(index+1);
    io.disp_text_marquee_async(musicFile[index], 100);
  }
});
