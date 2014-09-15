var EventEmitter = require("events").EventEmitter;

var emiters = {
  'touchEventEmitter': new EventEmitter(),
  'notificationEmitter': new EventEmitter()
};

module.exports = emiters;
