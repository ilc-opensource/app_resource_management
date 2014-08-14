var io = require('./io.js');
var path = require('path');
var child_process = require('child_process');

var logPrefix = '[sys escape] ';

var escapeApp = function() {
  child_process.exec(path.join(__dirname, './setFrontEndApp')+' 0', function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });
  process.send({'escape':io.context});
};

module.exports = escapeApp;