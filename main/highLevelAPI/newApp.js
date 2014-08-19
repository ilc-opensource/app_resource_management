var child_process = require('child_process');
var path = require('path');
var context = require('./context.js');

var io = require('./io.js');
var sys = require('./sys.js');

var logPrefix = '[sys new] ';

var newApp = function(app) {
  /*child_process.exec(path.join(__dirname, './C/setFrontEndApp')+' -1', function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });*/
  console.log(logPrefix+'context='+(context)+(sys));
  process.send({'newApp': {'app':app, 'context':context}});
};

module.exports = newApp;
