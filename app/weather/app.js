var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weather] ';

var getWeatherProcess = null;
var weatherContent = '';
var handler = function(o) {
  if (o['weather']) {
    weatherContent = o['weather'];
  }
};

// Animation display begin
var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
function displayWeather() {
  if (!isAnimationDispComplete) {return;}
  isAnimationDispComplete = false;
  isPreviousImageDisComplete = true;
  imageIter = -1;
  var w = weatherContent; //fs.readFileSync(path.join(__dirname, '.\/weather_from_baidu.json'), 'utf8');
  if (w == '') {
    var weather = fs.readFileSync(path.join(__dirname, '.\/no_weather_info_media.json'), 'utf8');
    imgs = JSON.parse(weather);
  } else {
    if (fs.existsSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'))) {
      //console.log(logPrefix+'weather file exist');
      var weather = fs.readFileSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'), 'utf8');
      imgs = JSON.parse(weather);
    }
  }
}
function dispAnimation() {
  if (!isPreviousImageDisComplete) {return;}
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter>=imgs.numberOfImg) {isAnimationDispComplete = true; return;}
  dispSingle(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;
}
function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}
// Animation display End

var weather = function() {
  getWeatherProcess = child_process.fork(path.join(__dirname, 'getWeather.js'));
  getWeatherProcess.on('message', handler);
  displayWeather();
};
weather();

setInterval(displayWeather, 100);
setInterval(function(){dispAnimation();}, 100);

io.touchPanel.on('touchEvent', function(e, x, y, id) {
});

io.touchPanel.on('gesture', function(gesture) {
});
