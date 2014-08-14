var path = require('path');
var child_process = require('child_process');

var logPrefix = '[sys exit] ';

var exitApp = function() {
  child_process.exec(path.join(__dirname, './setFrontEndApp')+' 0', function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });
  process.send({'exit':true});
  process.exit(0);
};

module.exports = exitApp;
