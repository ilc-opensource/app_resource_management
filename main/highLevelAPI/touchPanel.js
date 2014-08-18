// For end user app to receive touch screen event, only the front end app can receive
var util = require("util");
var EventEmitter = require("events").EventEmitter;

var logPrefix = '[sys touchPanel] ';

var touchPanel = function() {
};
util.inherits(touchPanel,EventEmitter);
var tp = new touchPanel();

process.on('message', function(o) {
  if (o['mug_touch_on']) {
    tp.emit('touch', o['mug_touch_on'][0], o['mug_touch_on'][1], o['mug_touch_on'][2]);
  }
  if (o['mug_gesture_on']) {
    console.log('child receive a gesture:'+o['mug_gesture_on']);
    tp.emit('gesture', o['mug_gesture_on']);
  }
});

module.exports = tp;
