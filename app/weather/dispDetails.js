var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var utf8 = require('utf8');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var ledDisp = require('../weChat/display.js').disp;

var logPrefix = '[sys show app] ';

var ledDispEmitter = new emitter();

console.log('args='+utf8.encode(process.argv[2]));
//io.disp_text_marquee_async(utf8.encode(process.argv[2]), 'red', 100, -1);
io.text2Img(utf8.encode(process.argv[2]), 1, function(image) {
  ledDisp(image, 150, false, false, ledDispEmitter);
});
