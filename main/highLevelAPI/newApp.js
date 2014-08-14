var io = require('./io.js');
var child_process = require('child_process');
var path = require('path');

var logPrefix = '[sys new] ';
var newApp = function(app) {
  child_process.exec(path.join(__dirname, './setFrontEndApp')+' 0', function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });
  process.send({'newApp': {'app':app, 'context':io.context}});
};

module.exports = newApp;
