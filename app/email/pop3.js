
var POP3Client = require('poplib');

var config = require('./config.js');
var client = undefined;
var ready = false;

var Emitter = require('events').EventEmitter;
var emitter = new Emitter();

var statSave = {
  count: -1 
}

var init = function(option) {  
  ready = false;
  emitter.emit('init', 'initializing');
  client = new POP3Client(config.port, config.host, config);

  client.on("error", function(err) {

    if (err.errno === 111) 
      console.log("Unable to connect to server");
    else 
      console.log("Server error occurred: " + JSON.stringify(err));

    emitter.emit('error', 'pop3 error');
    init();
  });

  client.on("connect", function(rawdata) {
    client.login(config.username, config.password);
  });

  client.on("invalid-state", function(cmd) {
    console.log("Invalid state: " + cmd);
    emitter.emit('error', 'invalid stats');
    init();
  });

  client.on("locked", function(cmd) {
    console.log("Current command has not finished yet. You tried calling " + cmd);
    emitter.emit('error', 'locked');
  });

  client.on("login", function(status, rawdata) {

    if (status) {
      client.stat();
      ready = false;
    } else {
      console.log("LOGIN/PASS failed");
      emitter.emit('error', 'LOGIN/PASS failed');
      client.quit();
    }

  });


  client.on("stat", function(status, data, rawdata) {

    if (status === true) {
      if (config.debug) console.log("Parsed data: " + JSON.stringify(data)); 
      statSave.count = data.count;
      emitter.emit('stat', data);   
      ready = true;
    } else {
      console.log("STAT failed");
      emitter.emit('error', 'STAT failed');
      err = "stat err";
    }

    client.quit();
  });

  client.on("quit", function(status, rawdata) {
    if (!status) 
      console.log("QUIT failed");

    emitter.emit('error', 'quit');
    init(); 
  });  
}    

exports.stat = function(cb)
{

  if(ready)
    client.stat();
  else {
    console.log('client is not ready');
    emitter.emit('stat', statSave);
  }

}

exports.init = init;
exports.emitter = emitter;
