var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weChat] ';

var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;

var imgs = null;
function displayweChat() {
  if (!isAnimationDispComplete) {return;}
  isAnimationDispComplete = false;
  isPreviousImageDisComplete = true;
  imageIter = -1;
  var w = fs.readFileSync(path.join(__dirname, './weChat.json'), 'utf8');
  if (w == '') {
    // Display an img, no weChat information
    var w = fs.readFileSync(path.join(__dirname, './media.json'), 'utf8');
    imgs = JSON.parse(w);
  } else {
    //if (fs.existsSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'))) {
      console.log(logPrefix+'weChat file exist');
      //var weather = fs.readFileSync(path.join(__dirname, JSON.parse(w).weather, 'media.json'), 'utf8');
      imgs = JSON.parse(w);
    //}
  }
}

function dispAnimation() {
  if (!isPreviousImageDisComplete) {return;}
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter==imgs.numberOfImg) {isAnimationDispComplete = true; return;}
  dispSingle(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;
}

setInterval(displayweChat, 100);
setInterval(function(){dispAnimation();}, 100);

function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}

io.touchPanel.on('touch', function(x, y, id) {
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'getsture='+gesture);
  if (gesture == 'MUG_SWIPE_LEFT') {
  } else if (gesture == 'MUG_SWIPE_RIGHT') {
  } else if (gesture == 'MUG_HODE') {
    sys.escape();
  }
});

var lastMsg = null;
function action(msg) {
  if (msg=='') return;
  if (lastMsg != msg) {
    lastMsg = msg;
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

  var req = http.request(optionsProxy, function(res) {
  //var req = http.request(options, function(res) {
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

var weChat = function() {
  setInterval(queryweChat, 1000);
  displayweChat();
};

weChat();
