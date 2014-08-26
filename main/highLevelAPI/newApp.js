var child_process = require('child_process');
var path = require('path');
var context = require('./context.js');
var touchPanel = require('./touchPanel.js');
var io = require('./io.js');

var logPrefix = '[sys new] ';

var newApp = function(app) {
  // Disable touch and gesture event after this point
  touchPanel.disableTouch = true;
  //clean all emitted event 
  touchPanel.touchEventListener = touchPanel.listeners('touchEvent');
  touchPanel.gestureListener = touchPanel.listeners('gesture');
  console.log(logPrefix+'===============touchEventListener'+(touchPanel.touchEventListener.length));
  console.log(logPrefix+'===============gestureListener'+(touchPanel.gestureListener.length));
  touchPanel.removeAllListeners('touchEvent');
  touchPanel.removeAllListeners('gesture');

  process.send({'newApp': {'app':app, 'context':context}});
};

module.exports = newApp;
