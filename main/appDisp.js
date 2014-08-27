var fs = require('fs');
var path = require('path');

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');
 
var logPrefix = '[sys appDisp] ';
var appReady = false;
var index = -1;
var appKey = [];
var appJSON = null;

function disp_app() {
  fs.readFile(path.join(__dirname, 'app.json'), 'utf8', function (err, data){
    if (err) throw err;
    if (data == '') return;
    appJSON = JSON.parse(data);

    // Send app install and uninstall to miniOS
    process.send({'installedApps':appJSON});

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
  });
}

function disp() {
  if (index == -1) {
    var img = path.join(__dirname, './image/none_app.json');
  } else {
    var img = path.join(__dirname, '../app/', appJSON[appKey[index]].name, appJSON[appKey[index]].iconJSON);
  }
  //console.log(logPrefix+'show app:'+img);
  fs.readFile(img,
    'utf8',
    function(err, data) {
      if (err) throw err;
      var msg=JSON.parse(data);
      io.disp_raw_N(msg.img0, 1, 0);
      appReady = true;
    }
  );
}

var fsTimeout = null;
// Update installed app list
fs.watch('app.json', function(e, filename) {
  if (!fsTimeout) {
    //console.log(logPrefix+'File event='+e);
    disp_app();
    fsTimeout = setTimeout(function(){fsTimeout=null;}, 100);
  }
});

disp_app();

/*io.touchPanel.on('touch', function(x, y, id) {
  var nextApp = path.join(__dirname, '../app/', appJSON[appKey[index]].name, appJSON[appKey[index]].start);
  console.log(logPrefix+"Launch a new app"+nextApp);
  sys.newApp(nextApp);
});*/
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  if (!appReady) return;
  if (e == 'TOUCH_CLICK') {
    var nextApp = path.join(__dirname, '../app/', appJSON[appKey[index]].name, appJSON[appKey[index]].start);
    //console.log(logPrefix+"Launch a new app"+nextApp+', '+process.pid);
    sys.newApp(nextApp);
  }
});

io.touchPanel.on('gesture', function(gesture) {
  if (!appReady) return;
  if (gesture == 'MUG_SWIPE_LEFT') {
    index = (index+1)==appKey.length?0:(index+1);
    disp();
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    index = (index==0)?(appKey.length-1):(index-1);
    disp();
  }
});

