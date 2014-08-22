var child_process = require('child_process');
var path = require('path');
var context = require('./context.js');

var io = require('./io.js');
var sys = require('./sys.js');

var logPrefix = '[sys new] ';

var newApp = function(app) {
  console.log(logPrefix+'context='+(context)+(sys));
  process.send({'newApp': {'app':app, 'context':context}});
};

module.exports = newApp;
