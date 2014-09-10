var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weather getWeather] ';

// Query info from web begin
var lastWeather = {};
var lastMsg = null;
function action(msg) {
  if (msg=='') return;
  if (lastMsg != msg) {
    lastMsg = msg;
    //console.log(msg);

    process.send({'weather':JSON.stringify({'weather':msg})});

    fs.writeFile(path.join(__dirname, 'weather_from_baidu.json'),
      JSON.stringify({"weather":msg}),
      function(err) {
        if(err)
          throw err;
        //console.log('It\'s saved!');
      }
    );
  }
}
var queryWeather = function(city, cb) {
  var self = this;
  var options = {
    hostname: 'api.map.baidu.com',
    port: 80,
    path: '/telematics/v3/weather?location='+city+'&output=json&ak=xBGKd1kR8nS5FTtojNjsS2Uu',
    method: 'GET'
  };
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      //console.log('weather='+body);
      if (body=='') return;
      var msg = JSON.parse(body);
      if (typeof msg.results == 'undefined') return;
      if (typeof msg.results[0] == 'undefined') return;
      if (typeof msg.results[0].weather_data == 'undefined') return;
      if (typeof msg.results[0].weather_data[0] == 'undefined') return;
      var weather = msg.results[0].weather_data[0].weather;
      //console.log('weather='+weather);
      if (lastWeather[city] != weather) {
        lastWeather[city] = weather;
        var weatherKey = null;
        if (weather.indexOf('云') != -1) {
          weatherKey = 'Cloudy';
        } else if(weather.indexOf('雨') != -1) {
          weatherKey = 'Rainy';
        } else if(weather.indexOf('风') != -1) {
          weatherKey = 'Windy';
        } else if(weather.indexOf('雷') != -1 || weather.indexOf('电') != -1) {
          weatherKey = 'Thundery';
        } else if(weather.indexOf('晴') != -1) {
          weatherKey = 'Sunny';
        } else if(weather.indexOf('雪') != -1) {
          weatherKey = 'Snowy';
        }
        //console.log('weatherKey='+weatherKey);
        if (weatherKey != null) {
          cb(weatherKey);
        }
      }
    });
  });
  req.on('error', function(e) {
    //console.log('problem with request: ' + e.message);
  });
  req.end();
}
// Query info from web end

// Register notification begin
fs.watch(path.join(__dirname, 'weather_from_baidu.json'), function(e, filename) {
  // write command to notification.json
  sys.registerNotification(path.join(__dirname, 'media.json'), path.join(__dirname, 'app.js'));
  //fs.appendFileSync(path.join(__dirname, 'notification'), 'register notification');
});
// Register notification end

var weatherContent = fs.readFileSync(path.join(__dirname, './weather_from_baidu.json'), 'utf8');
process.send({'weather':weatherContent});

setInterval(function(){queryWeather('116.305145,39.982368', action)}, 1000);
