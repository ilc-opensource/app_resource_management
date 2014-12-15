var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var utf8 = require('utf8');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[sys show app] ';

console.log('args='+process.argv[2]);
io.disp_text_marquee_async(process.argv[2], 'red', 100, -1);
