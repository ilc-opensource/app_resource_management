var fs = require('fs');
var child_process = require('child_process');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weather] ';

function displayWeather() {
  var w = fs.readFileSync(path.join(__dirname, '.\/weather_from_baidu.json'), 'utf8');
  if (w == '') {
    // Display an img, no weather information
    var weather = fs.readFileSync(path.join(__dirname, '.\/no_weather_info_media.json'), 'utf8');
    disp(JSON.parse(weather));
    setTimeout(displayWeather, 1);
  } else {
    if (fs.existsSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'))) {
      console.log(logPrefix+'weather file exist');
      var weather = fs.readFileSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'), 'utf8');
      disp(JSON.parse(weather));
      setTimeout(displayWeather, 1);
    }
  }
}

var singleImageSize = 16*12/2;
function disp(imgs) {
  var data = [];
  for (var imageIter=0; imageIter<imgs.numberOfImg; imageIter++) {
    //io.disp_raw_N(imgs['img'+imageIter], 1, 100);
    dispSingle(imgs['img'+imageIter], 1, 100);
  }
}

function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}

io.touchPanel.on('touch', function(x, y, id) {
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'getsture='+gesture);
  if (gesture == 'MUG_SWIPE_LEFT') {
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
  } else if (gesture == 'MUG_HODE') {
    sys.escape();
  }
});

var weather = function() {
  var childProcess = child_process.fork(path.join(__dirname, './getWeather.js'));

  displayWeather();
};

weather();
//displayWeather('Cloudy');
