var child_process = require('child_process');
var path = require('path');
var context = require('./context.js');

var io = require('./io.js');
var sys = require('./sys.js');

var logPrefix = '[sys escape] ';

var escapeApp = function() {
  /*child_process.exec(path.join(__dirname, './C/setFrontEndApp')+' -1', function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });*/
  console.log(logPrefix+'app '+context.app+' escape');
  process.send({'escape':context});
};

module.exports = escapeApp;
