var fs = require('fs');
var child_process = require('child_process');

var touchPanel = require('../../main/touchPanel.js');
var escapeApp = require('../../main/escapeApp.js');

var IOLIB = require('../../../device');
var io = new IOLIB.IO({
  log: true,
  quickInit: false
});
var handle = io.mug_init();

var logPrefix = '[weather APP] ';

function readWeather() {
  fs.readFile('.\/weather_from_baidu',
    'utf8',
    function(err, data) {
      if (err) throw err;
      displayWeather(data);
    }
  );

}

function displayWeather(w) {
  var w = fs.readFileSync('.\/weather_from_baidu', 'utf8');
  if (w == '') {
    // TODO: Display an img, no weather information
  } else {
    var weather = fs.readFileSync('.\/'+w+'\/media.json', 'utf8');
    disp(JSON.parse(weather));
  }
}

var singleImageSize = 16*12/2;
function disp(imgs) {
  var data = [];
  for (var imageIter=0; imageIter<imgs.number; imageIter++) {
    for (var i=0; i<singleImageSize; i++) {
      data[i] = imgs.image[singleImageSize*imageIter+i];
    }
    io.mug_disp_raw_N(handle, data, 1, 100);
  }
}

touchPanel.on('touch', function(x, y, id) {
  //var app = app[indexCurrentApp]
  //var nextApp = '..\/app\/'+installedAppJSON[app[indexCurrentApp]].name+'\/'+installedAppJSON[app[indexCurrentApp]].start;
  // Notify main app to create a new app
  //process.send({'newApp': nextApp});
});

touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'getsture='+gesture);
  if (gesture == 'MUG_SWIPE_LEFT') {
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
  } else if (gesture == 'MUG_HODE') {
    escapeApp();
  }
});

var weather = function() {
//  var childProcess = child_process.fork('getWeather.js');

  while(true) {
    readWeather();
  }
};

weather();
//displayWeather('Cloudy');
