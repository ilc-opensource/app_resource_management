var util = require("util");
var EventEmitter = require("events").EventEmitter;

var touchPanel = function() {
};

util.inherits(touchPanel,EventEmitter);

process.on('message', function(o) {
  if (o['mug_touch_on']) {
    touchPanel.emit('touch', o['mug_touch_on'][0], o['mug_touch_on'][1], o['mug_touch_on'][2]);
  }
  if (o['mug_gesture_on']) {
    touchPanel.emit('geture', o[mug_gesture_on]);
  }
});


module.exports = touchPanel;;
