var path = require('path');
var context = require('./context.js');
var touchPanel = require('./touchPanel.js');
var io = require('./io.js');

var logPrefix = '[sys new] ';

var newApp = function(app) {
  //if (touchPanel.disableTouch) return;

  // Disable touch and gesture event after this point
  //touchPanel.disableTouch = true;
  //clean all emitted event 
  touchPanel.touchEventListener = touchPanel.listeners('touchEvent');
  touchPanel.gestureListener = touchPanel.listeners('gesture');
  //console.log(logPrefix+'===============touchEventListener'+(touchPanel.touchEventListener.length)+', '+context.app);
  //console.log(logPrefix+'===============gestureListener'+(touchPanel.gestureListener.length)+', '+process.pid);
  while(true) {
    var length = touchPanel.touchEventListener.length;
    for (var i=0; i<length; i++) {
      for (var j=(i+1); j<length; j++) {
        if (touchPanel.touchEventListener[i] == touchPanel.touchEventListener[j]) {
          touchPanel.touchEventListener.splice(i, 1);
          //console.log('delete one repeat listener');
          break;
        }
      }
      if (j<length) {
        break;
      }
    }
    if (i==length) {
      break;
    }
  }
  while(true) {
    var length = touchPanel.gestureListener.length;
    for (var i=0; i<length; i++) {
      for (var j=(i+1); j<length; j++) {
        if (touchPanel.gestureListener[i] == touchPanel.gestureListener[j]) {
          //console.log('delete one repeat listener');
          touchPanel.gestureListener.splice(i, 1);
          break;
        }
      }
      if (j<length) {
        break;
      }
    }
    if (i==length) {
      break;
    }
  }
  touchPanel.removeAllListeners('touchEvent');
  touchPanel.removeAllListeners('gesture');

  process.send({'newApp': {'app':app, 'context':context}});
};

module.exports = newApp;
