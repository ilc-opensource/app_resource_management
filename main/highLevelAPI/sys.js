var path = require('path');
var child_process = require('child_process');

var system = function(){};
var sys = new system();

//sys.exit = require('./exitApp.js');
//sys.escape = require('./escapeApp.js');
sys.newApp = require('./newApp.js');

sys.registerNotification = function(icon, app) {
  var notification = JSON.stringify({"icon":String(icon), "app":String(app)});
  child_process.execFile(path.join(__dirname, './C/setNotification'), [notification], function(error, stdout, stderr){
    if (error !== null) {
      console.log('setNotification exec error: ' + error);
    }
  });
}

module.exports = sys;
