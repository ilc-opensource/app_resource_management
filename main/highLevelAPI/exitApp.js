var logPrefix = '[exit APP] ';

var exitApp = function() {
  child_process.exec('./setFrontEndApp '+'0', function(error, stdout, stderr){
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
