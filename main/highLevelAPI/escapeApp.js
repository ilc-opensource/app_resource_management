var child_process = require('child_process');
var path = require('path');
var context = require('./context.js');

var io = require('./io.js');
var sys = require('./sys.js');

var logPrefix = '[sys escape] ';

var escapeApp = function() {
  console.log(logPrefix+'send a escape to OS');
  process.send({'escape':context});
};

module.exports = escapeApp;
