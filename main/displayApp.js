var fs = require('fs');
var touchPanel = require('./touchPanel.js');
var IOLIB = require('../../device');
var io = new IOLIB.IO({
  log: true,
  quickInit: false
});

var handle = io.mug_init();

var logPrefix = '[display APP] ';
var indexCurrentApp = -1;
var app = [];
var installedAppJSON = null;

function disp_app() {
  fs.readFile('installedApp.json', 'utf8', function (err, data){
    if (err) throw err;
    if (data == '') return;
    var msg=JSON.parse(data);
    installedAppJSON = msg;

    var currentApp = indexCurrentApp==-1?null:app[indexCurrentApp];
    console.log(logPrefix+'currentApp='+currentApp);
    indexCurrentApp = -1;
    app = [];
    for (var i in msg) {
      if (msg[i].name && msg[i].icon) {
        //app.push('..\/app\/'+msg[i].name+'\/'+msg[i].iconJSON);
        app.push(i);
        if (i == currentApp) {
          indexCurrentApp = app.length-1;
        }
      }
    }
    if (app.length == 0) {
      indexCurrentApp = -1;
    } else {
      if (indexCurrentApp == -1) {
        indexCurrentApp = 0;
      }
      console.log(logPrefix+'new current app='+app[indexCurrentApp]);
    }
    console.log(logPrefix+'app length='+app.length);
    disp();
    //usleep(100 * 1000);
  });
}

function disp() {
  if (indexCurrentApp == -1) {
    var img = './image/none_app.json';
  } else {
    var img = '..\/app\/'+installedAppJSON[app[indexCurrentApp]].name+'\/'+installedAppJSON[app[indexCurrentApp]].iconJSON;
  }

  console.log(logPrefix+'show app:'+img);

  fs.readFile(img,
    'utf8',
    function(err, data) {
      if (err) throw err;
      var msg=JSON.parse(data);
      io.mug_disp_raw_N(handle, msg.img0, 1, 100);
    }
  );
}

var fsTimeout = null;
// Update installed app list
fs.watch('installedApp.json', function(e, filename) {
  if (!fsTimeout) {
    console.log(logPrefix+'File event='+e);
    disp_app();
    fsTimeout = setTimeout(function(){fsTimeout=null;}, 100);
  }
});

touchPanel.on('touch', function(x, y, id) {
  //var app = app[indexCurrentApp]
  var nextApp = '..\/app\/'+installedAppJSON[app[indexCurrentApp]].name+'\/'+installedAppJSON[app[indexCurrentApp]].start;
  // Notify main app to create a new app
  console.log(logPrefix+"Launch a new app"+nextApp);
  process.send({'newApp': nextApp});
});

touchPanel.on('gesture', function(gesture) {
  if (app.length == 0) return;
  console.log(logPrefix+'getsture='+gesture);
  if (gesture == 'MUG_SWIPE_LEFT') {
    indexCurrentApp = (indexCurrentApp+1)==app.length?0:(indexCurrentApp+1);
    disp();
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    indexCurrentApp = (indexCurrentApp==0)?(app.length-1):(indexCurrentApp-1);
    disp();
  } else if (gesture == 'MUG_HODE') {
    // Notify main app current app escape
    process.send({'escape': 'escape'});
  }
});

disp_app();
