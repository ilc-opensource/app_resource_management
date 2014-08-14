var fs = require('fs');
var child_process = require('child_process');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weather] ';

function displayWeather() {
  var w = fs.readFileSync(path.join(__dirname, '.\/weather_from_baidu'), 'utf8');
  console.log(logPrefix+'weather='+w);
  if (w == '') {
    // TODO: Display an img, no weather information
    var weather = fs.readFileSync(path.join(__dirname, '.\/media.json'), 'utf8');
    disp(JSON.parse(weather));
    displayWeather();
  } else {
    if (fs.existsSync(path.join(__dirname, '.\/'+w+'\/media.json'))) {
      console.log(logPrefix+'weather file exist');
      var weather = fs.readFileSync(path.join(__dirname, '.\/'+w+'\/media.json'), 'utf8');
      disp(JSON.parse(weather));
      displayWeather();
    }
  }
}

var singleImageSize = 16*12/2;
function disp(imgs) {
  var data = [];
  for (var imageIter=0; imageIter<imgs.number; imageIter++) {
    for (var i=0; i<singleImageSize; i++) {
      data[i] = imgs.image[singleImageSize*imageIter+i];
    }
    io.disp_raw_N(data, 1, 100);
  }
}

io.touchPanel.on('touch', function(x, y, id) {
  //var app = app[indexCurrentApp]
  //var nextApp = '..\/app\/'+installedAppJSON[app[indexCurrentApp]].name+'\/'+installedAppJSON[app[indexCurrentApp]].start;
  // Notify main app to create a new app
  //process.send({'newApp': nextApp});
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'getsture='+gesture);
  if (gesture == 'MUG_SWIPE_LEFT') {
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
  } else if (gesture == 'MUG_HODE') {
    io.escape();
  }
});

var weather = function() {
  var childProcess = child_process.fork(path.join(__dirname, './getWeather.js'));

  displayWeather();
};

weather();
//displayWeather('Cloudy');
