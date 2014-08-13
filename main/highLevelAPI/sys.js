var childProcess = require('child_process');

var logPrefix = '[sys APP] ';

var system = function(){}

var sys = new system();
sys.exit = require('./exitApp.js');
sys.escape = require('./escape.js');
sys.newApp = require('./newApp.js');

module.exports = sys;
