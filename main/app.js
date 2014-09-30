var fs = require('fs');
var path = require('path');

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[sys app] ';
var appReady = false;
var index = -1;
var appKey = [];
var appJSON = null;

function disp_app(force) {
  var data = fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8');
  if (data == '') {
    if (!force) {
      setTimeout(disp_app, 100);
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
    setTimeout(disp_app, 100);
  }
}

function disp() {
  if (index == -1) {
    var img = path.join(__dirname, './image/none_app.json');
  } else {
    var img = path.join(__dirname, '../app/', appJSON[appKey[index]].name, appJSON[appKey[index]].iconJSON);
  }
  //console.log(logPrefix+'show app:'+appJSON[appKey[index]].name);
  try {
    var data = fs.readFileSync(img, 'utf8');
  } catch (ex) {
    return;
  }
  var msg=JSON.parse(data);
  io.disp_raw_N(msg.img0, 1, 0);
  appReady = true;
}

disp_app();

io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (!appReady) return;
  console.log('====='+logPrefix+io.touchPanel.listeners('touchEvent').length);
  for (var i=1; i<io.touchPanel.listeners('touchEvent').length; i++) {
    io.touchPanel.listeners('touchEvent').splice(i, 1);
  }
  if (e == 'TOUCH_CLICK') {
    var nextApp = path.join(__dirname, '../app/', appJSON[appKey[index]].name, appJSON[appKey[index]].start);
    //console.log(logPrefix+"Launch a new app"+nextApp+', '+process.pid);
    sys.newApp(nextApp);
  }
});

io.touchPanel.on('gesture', function(gesture) {
  if (!appReady) return;
  console.log('====='+logPrefix+io.touchPanel.listeners('gesture').length);
  for (var i=1; i<io.touchPanel.listeners('gesture').length; i++) {
    io.touchPanel.listeners('gesture').splice(i, 1);
  }
  if (gesture == 'MUG_SWIPE_LEFT') {
    index = (index+1)==appKey.length?0:(index+1);
    //console.log('after gesture:'+appJSON[appKey[index]].name);
    disp_app(true);
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    index = (index==0)?(appKey.length-1):(index-1);
    //console.log('after gesture:'+appJSON[appKey[index]].name);
    disp_app(true);
  }
});

