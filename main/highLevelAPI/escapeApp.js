var child_process = require('child_process');
var path = require('path');
var context = require('./context.js');

var io = require('./io.js');
var sys = require('./sys.js');

var logPrefix = '[sys escape] ';

var escapeApp = function() {
  console.log(logPrefix+'app '+context.app+' escape');
  process.send({'escape':context});
};

module.exports = escapeApp;
