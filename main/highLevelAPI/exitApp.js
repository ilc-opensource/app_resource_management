var path = require('path');
var child_process = require('child_process');

var logPrefix = '[sys exit] ';

var exitApp = function() {
  process.send({'exit':true});
  //process.exit(0);
};

module.exports = exitApp;
