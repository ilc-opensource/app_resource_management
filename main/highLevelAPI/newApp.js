var io = require('./io.js');
var logPrefix = '[newApp APP] ';

var newApp = function(app) {
  child_process.exec('./setFrontEndApp '+'0', function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });
  process.send({'newApp': app});
};

module.exports = newApp;
