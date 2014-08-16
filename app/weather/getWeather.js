var fs = require('fs');
var path = require('path');
var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

function getWeather() {
  // get weather information from web
  // write to weather_from_baidu.json
}

getWeather();

//var fsTimeout = null;
fs.watch(path.join(__dirname, 'weather_from_baidu.json'), function(e, filename) {
  //if (!fsTimeout) {
    //console.log(logPrefix+'File event='+e);
    // Don't need to check is frontEndApp, register notification directly
    // System will determine if execute the notification
    /*sys.isFrontEndApp(process.pid, function(frontEnd) {
      if (!frontEnd) {
        var w = fs.readFileSync(path.join(__dirname, 'weather_from_baidu.json'), 'utf8');
        // write command to notification.json
        sys.registerNotification('notification.js ');
      }
    });*/
    var w = fs.readFileSync(path.join(__dirname, 'weather_from_baidu.json'), 'utf8');
    // write command to notification.json
    sys.registerNotification(path.join(__dirname, 'notification.js'));
    //fsTimeout = setTimeout(function(){fsTimeout=null;}, 100);
  //}
});

