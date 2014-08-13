var io = require('./io.js');
var logPrefix = '[escape APP] ';

var escapeApp = function() {
  child_process.exec('./setFrontEndApp '+'0', function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });
  process.send({'escape':io.context});
};

module.exports = escapeApp;
