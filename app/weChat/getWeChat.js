var fs = require('fs');
var path = require('path');
var http = require('http');
var child_process = require('child_process');
var cloudServer = require('../appconfig/cloudserver.js').server;
var cloudPort = require('../appconfig/cloudserver.js').port;

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weChat getWeChat] ';

var unsyncMsg = [];
var lastMsg = null;
function action(msg) {
  if (msg=='') {
    return;
  }
  if (lastMsg != msg) {
    //console.log('weChat client receive a msg='+msg);
    lastMsg = msg;
    try {
      var data = JSON.parse(lastMsg);
      if (data.isAudio) {
        unsyncMsg.unshift(msg);
        child_process.exec('curl -G "http://'+cloudServer+':'+cloudPort+'/downloadFile/?fileName='+data.file+'" -o '+path.basename(data.file)+'; echo '+data.file, function(err, stdout, stderr) {
          console.log('stdout='+stdout);
          try {
            //TODO: find the name and pop the corresponding msg
            process.send({'content':unsyncMsg.pop()});
          } catch (ex) {
            console.log(logPrefix+'send wechat message to main process error');
            return;
          }
          sys.registerNotification(path.join(__dirname, 'media.json'), path.join(__dirname, 'app.js'));
        });
      } else {
        try {
          process.send({'content':msg});
        } catch (ex) {
          console.log(logPrefix+'send wechat message to main process error');
          return;
        }
        sys.registerNotification(path.join(__dirname, 'media.json'), path.join(__dirname, 'app.js'));
      }
    } catch (ex) {
    }
  }
}

function query(cb) {
  var app = 'weChat';

  var options = {
    hostname: cloudServer,
    port: cloudPort,
    path: '/mug/?mugID='+mugID+'&app='+app,
    method: 'GET'
  };

  //var req = http.request(optionsProxy, function(res) {
  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      if (!body.match(/^</)) {
        cb(body);
      }
    });
  });
  req.on('socket', function (socket) {
    socket.setTimeout(2000);
    socket.on('timeout', function() {
        req.abort();
    });
  });
  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
  req.end();
}
// Query info from web end

try {
  var mugID = fs.readFileSync('/etc/device_id', 'utf8');
} catch (ex) {
  console.log(logPrefix+'Cant get mug ID');
  return;
}

var timeIntervalEager = 1000; // one second
var timeIntervalLazy = 600000; // 10 minutes

var timerInterval = setInterval(function(){query(action)}, timeIntervalEager);

process.on('message', function(o) {
  if (o['InstantUpdate']) {
    query(action);
    clearInterval(timerInterval);
    timerInterval = setInterval(function(){query(action)}, timeIntervalEager);
  }
  if (o['ToBackEnd']) {
    clearInterval(timerInterval);
    timerInterval = setInterval(function(){query(action)}, timeIntervalLazy);
  }
});

