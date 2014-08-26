var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var http = require('http');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weChat] ';

var getWeChatProcess = null;
var weChatContent = '';
var handler = function(o) {
  if (o['weChat']) {
    weChatContent = o['weChat'];
    //displayweChat(o['weChat']);
  }
};

// Animation display begin
var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
function displayweChat() {
  if (!isAnimationDispComplete) {return;}
  isAnimationDispComplete = false;
  isPreviousImageDisComplete = true;
  imageIter = -1;
  var w = weChatContent; //fs.readFileSync(path.join(__dirname, './weChat.json'), 'utf8');
//  console.log(logPrefix+'w='+w);
  if (w == '' || w == '\n') {
    var w = fs.readFileSync(path.join(__dirname, './media.json'), 'utf8');
    imgs = JSON.parse(w);
  } else {
    //console.log(logPrefix+'weChat file exist');
    try {
    imgs = JSON.parse(w);
    } catch(ex) {
      imgs = null;
      isAnimationDispComplete = true;
      isPreviousImageDisComplete = false;
    }
  }
}
function dispAnimation() {
  if (!isPreviousImageDisComplete) {return;}
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter>=imgs.numberOfImg) {isAnimationDispComplete = true; return;}
  dispSingle(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;
}
function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}
// Animation display End

var weChat = function() {
  getWeChatProcess = child_process.fork(path.join(__dirname, 'getWeChat.js'));
  getWeChatProcess.on('message', handler);
  //setInterval(function(){queryweChat(action)}, 1000);
  displayweChat();
};

weChat();

setInterval(displayweChat, 100);
setInterval(function(){dispAnimation();}, 100);

// Touch event handler begin
io.touchPanel.on('touchEvent', function(e, x, y, id) {
  //if (e == 'TOUCH_HOLD') {
  //  sys.escape();
  //}
});

io.touchPanel.on('gesture', function(gesture) {
  console.log(logPrefix+'getsture='+gesture);
});
// Touch event handler end

/*
// Query info from web begin
var lastMsg = null;
function action(msg) {
  if (msg=='') return;
  if (lastMsg != msg) {
    lastMsg = msg;
    //console.log(msg);

    fs.writeFile(path.join(__dirname, 'weChat.json'),
      msg,
      function(err) {
        if(err)
          throw err;
        //console.log('It\'s saved!');
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

// Register notification begin
fs.watch(path.join(__dirname, 'weChat.json'), function(e, filename) {
    // write command to notification.json
    sys.registerNotification(path.join(__dirname, 'notification.js'));
});
// Register notification end
*/
