var fs = require('fs');
var touchPanel = require('./touchPanel.js');
var IOLIB = require('../../device');
var io = new IOLIB.IO({
  log: true,
  quickInit: false
});

var handle = io.mug_init();


var indexCurrentApp = -1;
var app = [];

function disp_app() {
  fs.readFile('installedApp.json', 'utf8', function (err, data){
    if (err) throw err;
    if (data == '') return;
    var msg=JSON.parse(data);

    var currentApp = indexCurrentApp==-1?null:app[indexCurrentApp];
    indexCurrentApp = -1;
    app = [];
    for (var i in msg) {
      if (msg[i].name && msg[i].icon) {
        app.push('..\/app\/'+msg[i].name+'\/'+msg[i].iconJSON);
        if ('..\/app\/'+msg[i].name+'\/'+msg[i].icon == currentApp) {
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
    }
    console.log('app length='+app.length);
    disp();
    //usleep(100 * 1000);
  });
}

function disp() {
  if (indexCurrentApp == -1) {
    var img = './image/none_app.json';
  } else {
    var img = app[indexCurrentApp];
  }

  console.log('show app:'+img);

  fs.readFile(img,
    'utf8',
    function(err, data) {
      if (err) throw err;
      var msg=JSON.parse(data);
      io.mug_disp_raw_N(handle, msg.img0, 1, 100);
    }
  );
}

// Update installed app list
fs.watch('installedApp.json', function(e, filename) {
  disp_app();
});

touchPanel.on('gesture', function(gesture) {
  console.log('getsture='+gesture+";"+(typeof gesture));
  if (app.length == 0) return;

  console.log('getsture='+gesture);
  if (gesture == 'MUG_SWIPE_LEFT') {
    indexCurrentApp = (indexCurrentApp+1)==app.length?0:(indexCurrentApp+1);
    disp();
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
    indexCurrentApp = (indexCurrentApp==0)?(app.length-1):(indexCurrentApp-1);
    disp();
  } else if (gesture == '');
});

disp_app();
