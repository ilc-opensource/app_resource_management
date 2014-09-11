var child_process = require('child_process');
var path = require('path');

var system = function(){};
var sys = new system();
sys.exit = require('./exitApp.js');
sys.escape = require('./escapeApp.js');
sys.newApp = require('./newApp.js');

sys.registerNotification = function(icon, app) {
  //child_process.exec(path.join(__dirname, './C/setNotification')+' '+JSON.stringify({"icon":String(icon), "app":String(app)}), function(error, stdout, stderr){
  var notification = JSON.stringify({"icon":String(icon), "app":String(app)});
  child_process.execFile(path.join(__dirname, './C/setNotification'), [notification], function(error, stdout, stderr){
    //console.log('stdout: ' + stdout);
    //console.log('stderr: ' + stderr);
    if (error !== null) {
      //console.log('exec error: ' + error);
    }
  });
}

module.exports = sys;
