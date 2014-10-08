var fs = require('fs');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weChat getWeChat] ';

var lastMsg = null;
function action(msg) {
  if (msg=='') {
    return;
  }
  if (lastMsg != msg) {
    lastMsg = msg;
    try {
      process.send({'weChat':msg});
    } catch (ex) {
      console.log(logPrefix+'send wechat message to main process error');
      return;
    }

    sys.registerNotification(path.join(__dirname, 'media.json'), path.join(__dirname, 'app.js'));
  }
}

function queryweChat(cb) {
  var app = 'weChat';

  var optionsProxy = {
    hostname: 'proxy-prc.intel.com',
    port: 911,
    path: 'www.pia-edison.com/mug/?mugID='+mugID+'&app='+app,
    method: 'GET'
  };

  var options = {
    hostname: 'www.pia-edison.com',
    port: 80,
    path: '/mug?mugID='+mugID+'&app='+app,
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

//var weChatContent = fs.readFileSync(path.join(__dirname, './weChat.json'), 'utf8');
//process.send({'weChat':weChatContent});

try {
  var mugID = fs.readFileSync('/etc/device_id', 'utf8');
} catch (ex) {
  console.log(logPrefix+'Cant get mug ID');
  return;
}

queryweChat(action);
// 10 minutes
setInterval(function(){queryweChat(action)}, 600000);

process.on('message', function(o) {
  if (o['InstantUpdate']) {
    //console.log(logPrefix+' instant update');
    queryweChat(action);
  }
});
