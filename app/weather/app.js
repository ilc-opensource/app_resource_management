var fs = require('fs');
var child_process = require('child_process');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weather] ';

var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;

var imgs = null;
function displayWeather() {
  if (!isAnimationDispComplete) {return;}
  isAnimationDispComplete = false;
  isPreviousImageDisComplete = true;
  imageIter = -1;
  var w = fs.readFileSync(path.join(__dirname, '.\/weather_from_baidu.json'), 'utf8');
  if (w == '') {
    // Display an img, no weather information
    var weather = fs.readFileSync(path.join(__dirname, '.\/no_weather_info_media.json'), 'utf8');
    imgs = JSON.parse(weather);
  } else {
    if (fs.existsSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'))) {
      console.log(logPrefix+'weather file exist');
      var weather = fs.readFileSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'), 'utf8');
      imgs = JSON.parse(weather);
    }
  }
}

function dispAnimation() {
  if (!isPreviousImageDisComplete) {return;}
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter==imgs.numberOfImg) {isAnimationDispComplete = true; return;}
  dispSingle(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;
}

setInterval(displayWeather, 100);
setInterval(function(){dispAnimation();}, 100);

/*function displayWeather() {
  if (!isAnimationDispComplete) {setTimeout(displayWeather, 100); return;}
  isAnimationDispComplete = false;
  isPreviousImageDisComplete = true;
  imageIter = -1;
  var w = fs.readFileSync(path.join(__dirname, '.\/weather_from_baidu.json'), 'utf8');
  if (w == '') {
    // Display an img, no weather information
    var weather = fs.readFileSync(path.join(__dirname, '.\/no_weather_info_media.json'), 'utf8');
    dispAnimation(JSON.parse(weather));
  } else {
    if (fs.existsSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'))) {
      console.log(logPrefix+'weather file exist');
      var weather = fs.readFileSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'), 'utf8');
      dispAnimation(JSON.parse(weather));
    }
  }
  setTimeout(displayWeather, 100);
}

function dispAnimation(imgs) {
  if (!isPreviousImageDisComplete) {setTimeout(function(){dispAnimation(imgs);}, 100); return;}
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter==imgs.numberOfImg) {isAnimationDispComplete = true; return;}
  dispSingle(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;
  setTimeout(function(){dispAnimation(imgs);}, 100);
}
*/

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
  var childProcess = child_process.fork(path.join(__dirname, 'getWeather.js'));
  displayWeather();
};

weather();
