var fs = require('fs');
var path = require('path');
var http = require('http');
var child_process = require('child_process');
var cloudServer = require('../appconfig/cloudserver.js').server;
var cloudPort = require('../appconfig/cloudserver.js').port;

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var logPrefix = '[user weChat getWeChat] ';

var qq_iot = require('./addon/build/Release/qq_iot');

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

var tx_device_info = {
  device_name        : "smart_mug",
  device_name_len    : this.device_name.length,
  device_type        : "liquid_container",
  device_type_len    : this.device_type.length),
  product_id         : 1000000293,
  product_secret     : "41223d0ba9701c0085144066a3482c3a",
  product_secret_len : this.product_secret.length,
  device_license     : "304502201F696E9EF786BE2CBEC9533EA7D3CE91E9A7C41711D19313D17D9D2070079DC702210081455440F024402085ED97DDD88A24ECDC998D03DA36CECEEB28CA60F5F0249F",
  device_license_len : this.device_license.length,
  device_serial_number  :"amoudo-123456789",
  device_serial_number_len = this.device_serial_number.length
};

var qq_iot_on_login_complete = function(error_code) {
};
var qq_iot_on_online_status = function(old_status, new_status) {
};
var qq_iot_on_binder_list_change = function(error_code, binderList, binderCount) {
};

var tx_device_notify = {
  on_login_complete: qq_iot_on_login_complete,
  on_online_status: qq_iot_on_online_status,
  on_binder_list_change: qq_iot_on_binder_list_change
};

var tx_init_path = {
  system_path : __dirname,
  system_path_capicity  : 10240,
  app_path :__dirname,
  app_path_capicity  : 1024000,
  temp_path : __dirname,
  temp_path_capicity  : 102400
};

qq_iot.tx_init_device(tx_device_info, tx_device_notify, tx_init_path);
