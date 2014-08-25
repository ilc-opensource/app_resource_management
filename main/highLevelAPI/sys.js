var child_process = require('child_process');
var path = require('path');

var system = function(){};
var sys = new system();
sys.exit = require('./exitApp.js');
sys.escape = require('./escapeApp.js');
sys.newApp = require('./newApp.js');

// Don't need any more
/*sys.isFrontEndApp = function(pid, cb) {
  child_process.exec('./C/getFrontEndApp', function(error, stdout, stderr){
    //console.log(logPrefix+'stdout: ' + stdout);
    // stdout == C program, frontEndApp=0\n
    if (stdout.slice(String('C program, frontEndApp=').length, -1) == pid) {
      cb(true);
    } else {
      cb(false);
    }
    //console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      //console.log(logPrefix+'exec error: ' + error);
    }
  });
}*/

// We use another version, app developer can only call this in main process of the app
/*sys.registerNotification = function(app) {
  console.log('Register a notification:'+app);
  child_process.exec(path.join(__dirname, './C/setNotification')+' '+app, function(error, stdout, stderr){
    //console.log('stdout: ' + stdout);
    //console.log('stderr: ' + stderr);
    if (error !== null) {
      //console.log('exec error: ' + error);
    }
  });
}*/
sys.registerNotification = function(app) {
  console.log('Register a notification:'+app);
  process.send({'notification':app});
};

module.exports = sys;
