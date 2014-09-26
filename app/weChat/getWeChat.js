var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weChat getWeChat] ';

var lastMsg = null;
function action(msg) {
  if (msg=='') return;
  if (lastMsg != msg) {
    lastMsg = msg;
    //console.log(msg);
    try {
      process.send({'weChat':msg});
    } catch (ex) {
    }

    sys.registerNotification(path.join(__dirname, 'media.json'), path.join(__dirname, 'app.js'));

/*    fs.writeFile(path.join(__dirname, 'weChat.json'),
      msg,
      function(err) {
        if(err)
          throw err;
        //console.log('It\'s saved!');
      }
    );
*/
  }
}

function queryweChat(cb) {
  var mugID = 'MUG123456ILC';
  var app = 'weChat';

  var optionsProxy = {
    hostname: 'proxy-prc.intel.com',
    port: 911,
    path: 'www.pia-edison.com/mug?mugID='+mugID+'&app='+app,
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
    //console.log('problem with request: ' + e.message);
  });
  req.end();
}
// Query info from web end

//var weChatContent = fs.readFileSync(path.join(__dirname, './weChat.json'), 'utf8');
//process.send({'weChat':weChatContent});

setInterval(function(){queryweChat(action)}, 1000);
