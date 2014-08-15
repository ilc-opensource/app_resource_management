var fs = require('fs');
var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');
 
var logPrefix = '[sys appDisp] ';
var indexCurrentApp = -1;
var appKey = [];
var appJSON = null;

function disp_app() {
  fs.readFile('app.json', 'utf8', function (err, data){
    if (err) throw err;
    if (data == '') return;
    appJSON = JSON.parse(data);

    var currentApp = indexCurrentApp==-1?null:appKey[indexCurrentApp];
    console.log(logPrefix+'currentApp='+currentApp);
    indexCurrentApp = -1;
    appKey = [];
    for (var i in appJSON) {
      if (appJSON[i].name && appJSON[i].icon) {
        appKey.push(i);
        if (i == currentApp) {
          indexCurrentApp = appKey.length-1;
        }
      }
    }
    if (appKey.length == 0) {
      indexCurrentApp = -1;
    } else {
      if (indexCurrentApp == -1) {
        indexCurrentApp = 0;
      }
      console.log(logPrefix+'new current app='+appKey[indexCurrentApp]);
    }
    console.log(logPrefix+'app length='+appKey.length);
    disp();
  });
}

function disp() {
  if (indexCurrentApp == -1) {
    var img = './image/none_app.json';
  } else {
    var img = '..\/app\/'+appJSON[appKey[indexCurrentApp]].name+'\/'+appJSON[appKey[indexCurrentApp]].iconJSON;
  }

  console.log(logPrefix+'show app:'+img);

  fs.readFile(img,
    'utf8',
    function(err, data) {
      if (err) throw err;
      var msg=JSON.parse(data);
      io.disp_raw_N(msg.img0, 1, 0);
    }
  );
}

var fsTimeout = null;
// Update installed app list
fs.watch('app.json', function(e, filename) {
  if (!fsTimeout) {
    console.log(logPrefix+'File event='+e);
    disp_app();
    fsTimeout = setTimeout(function(){fsTimeout=null;}, 100);
  }
});

io.touchPanel.on('touch', function(x, y, id) {
  var nextApp = '..\/app\/'+appJSON[appKey[indexCurrentApp]].name+'\/'+appJSON[appKey[indexCurrentApp]].start;
  // Notify main app to create a new app
  console.log(logPrefix+"Launch a new app"+nextApp);
  //process.send({'newApp': nextApp});
  sys.newApp(nextApp);
});

io.touchPanel.on('gesture', function(gesture) {
  if (appKey.length == 0) return;
  console.log(logPrefix+'getsture='+gesture);
  if (gesture == 'MUG_SWIPE_LEFT') {
    indexCurrentApp = (indexCurrentApp+1)==appKey.length?0:(indexCurrentApp+1);
    disp();
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    indexCurrentApp = (indexCurrentApp==0)?(appKey.length-1):(indexCurrentApp-1);
    disp();
  } else if (gesture == 'MUG_HODE') {
    // Notify main app current app escape
    //process.send({'escape': 'escape'});
    sys.escape();
  }
});

disp_app();
