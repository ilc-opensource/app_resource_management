var http = require('http');
var fs = require('fs');
var exec = require('child_process').exec;
var path = require('path');

var lastMsg = {};

function pullData(user, app, cb) {
  var optionsProxy = {
    hostname: 'proxy-prc.intel.com',
    //hostname: 'www.pia-edison.com',
    port: 911,
    path: 'http://www.pia-edison.com/mug?user='+user+'&app='+app,
    method: 'GET'
  };

  var options = {
    hostname: 'www.pia-edison.com',
    port: 80,
    path: '/mug?user='+user+'&app='+app,
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
        cb(user, app, body);
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

function action(user, app, msg) {
  if (msg=='') return;
  if (lastMsg[user+'@'+app] != msg) {
    lastMsg[user+'@'+app] = msg;
    console.log(msg);

    var imageData = JSON.parse(msg);
    var data = {};
    data.number = imageData.numberOfImg;
    data.image = [];
    for (var i=0; i<imageData.numberOfImg; i++) {
      for (var j=0; j<imageData['img'+i].length; j++) {
        data.image.push(imageData['img'+i][j]);
      }
    }
    console.log('Send image to edison:'+JSON.stringify(data));
    fs.writeFile('ledAnimation.JSON',
      JSON.stringify(data),
      function(err) {
        if(err)
          throw err;
        console.log('It\'s saved!');
        exec('sh push.sh', function(err, stdout, stderr){console.log(stdout);});
      }
    );
  }
}

function main() {
  console.log("querying");
  for (var user in account) {
    for (var app in account[user]) {
      if (app!='smart_mug'&&app!='password'&&account[user][app]) {
        pullData(user, app, function(user, app, msg){action(user, app, msg);});
      }
    }
  }
}

var account = JSON.parse(fs.readFileSync(path.join(__dirname, 'account.json'), 'utf8'));
setInterval(main, 1000);
