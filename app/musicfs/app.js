var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[sys show app] ';
var appReady = false;
var index = 0;
var musicFile = [];

function delFile () {
  //musicFile = fs.readdirSync(path.join(__dirname, '../player/music/'));
  musicFile = fs.readdirSync('/home/root/audio/');
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

delFile();

/*function disp_app(force) {
  var data = fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8');
  if (data == '') {
    if (!force) {
      setTimeout(disp_app, 300);
    }
    return;
  }
  appJSON = JSON.parse(data);

  var currentApp = index==-1?null:appKey[index];
  //console.log(logPrefix+'currentApp='+currentApp);
  index = -1;
  appKey = [];
  for (var key in appJSON) {
    if (appJSON[key].name && appJSON[key].icon) {
      appKey.push(key);
      if (key == currentApp) {
        index = appKey.length-1;
      }
    }
  }
  // No app installed
  if (appKey.length == 0) {
    index = -1;
  } else {
    // The previous shown app is uninstalled, chose the first app as the new shown app
    if (index == -1) {
      index = 0;
    }
    //console.log(logPrefix+'new current app='+appKey[index]);
  }
  //console.log(logPrefix+'app length='+appKey.length);
  disp();
  if (!force) {
    setTimeout(disp_app, 300);
  }
}

function disp() {
  if (index == -1) {
    var img = path.join(__dirname, './image/none_app.jpg');
  } else {
    var img = path.join(__dirname,
      '../app/',
      appJSON[appKey[index]].name,
      appJSON[appKey[index]].icon);
  }
  
  io.disp_N([img], 1, 0);
  appReady = true;
}

disp_app();
*/

io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (e == 'TOUCH_HOLD') {
    process.exit();
  }
});

io.touchPanel.on('gesture', function(gesture) {
  if (gesture == 'MUG_SWIPE_UP') {

    if(musicFile.length != 0)
      child_process.exec('rm '+path.join(__dirname, '../player/music/', musicFile[index]));

    musicFile.splice(index, 1);
    index = 0;
    if (musicFile.length==0) {
      io.disp_text_marquee_async('No music file', 100);
    } else {
      io.disp_text_marquee_async(musicFile[index], 100);
    }
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    index = (index==0)?(musicFile.length-1):(index-1);
    io.disp_text_marquee_async(musicFile[index], 100);
  } else if (gesture == 'MUG_SWIPE_LEFT') {
    index = (index+1)==musicFile.length?0:(index+1);
    io.disp_text_marquee_async(musicFile[index], 100);
  }
});
