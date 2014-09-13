
var POP3Client = require('poplib');

var config = require('./config.js');

var notify = function(option) {
  var client = new POP3Client(config.port, config.host, config);

  client.on("error", function(err) {
    if (err.errno === 111) 
      console.log("Unable to connect to server");
    else 
      console.log("Server error occurred: " + JSON.stringify(err));
  });

  client.on("connect", function(rawdata) {
    client.login(config.username, config.password);
  });

  client.on("invalid-state", function(cmd) {
    console.log("Invalid state: " + cmd);
  });

  client.on("locked", function(cmd) {
    console.log("Current command has not finished yet. You tried calling " + cmd);
  });

  client.on("login", function(status, rawdata) {

    if (status) {
      client.stat();
    } else {
      console.log("LOGIN/PASS failed");
       client.quit();
    }

  });

  client.on("stat", function(status, data, rawdata) {

    var callback = undefined;
    if(option && option.stat)
      callback = option.stat;

    var err = undefined;
    if (status === true) {
      if (config.debug) console.log("Parsed data: " + JSON.stringify(data));    
    } else {
      console.log("STAT failed");
      err = "stat err";
    }

    client.quit();
     
    if(callback)
      callback(err, data);

  });

  client.on("quit", function(status, rawdata) {
    if (!status) 
      console.log("QUIT failed");
  });  
}    

exports.notify = notify;
