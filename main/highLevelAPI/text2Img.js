var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');
var path = require('path');
var http = require('http');
var child_process = require('child_process');
var cloudServer = require('../../app/appconfig/cloudserver.js').server;
var cloudPort = require('../../app/appconfig/cloudserver.js').port;

defaultStep = 2;
defaultColor = 1; //RED
ledWidth=16;
ledHeight=12;

var decodeBase64Image = function(dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');

  return response;
};

var getChineseImgFromCloud = function(text) {
  var options = {
    hostname: cloudServer,
    port: cloudPort,
    path: '/getChineseImg/?text='+text,
    method: 'GET'
  };

  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });
    res.on('end', function () {
      if (!body.match(/^</)) {
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

var preProcessChinese = function(text) {
  var stringText = String(text);
  var isChineseImgExist = true;
  for (var i=0; i<stringText.length; i++) {
    var c = stringText[i];
    if (c.match(/[\u4E00-\u9FA5]/)) {
      if (!fs.existsSync(path.join(__dirname, 'Chinese', c+'.jpg'))) {
        //var cmd = path.join(__dirname, './linux-convert/convert')+' -page 16x12 -size 16x12 xc:black -font "'+path.join(__dirname, 'fontBitmap_9pt.bdf')+'" -fill white -draw "text 0,10 \''+c+'\'" '+path.join(__dirname, 'Chinese', c+'.jpg');
        //console.log('trying to create jpg file cmd='+cmd);
        //child_process.exec(cmd, function(error, stdout, stderr) {console.log(error+stdout+stderr); });
        getChineseImgFromCloud(text);
        child_process.exec('curl -G "http://'+cloudServer+':'+cloudPort+'/downloadFile/?fileName=/Chinese/'+c+'.jpg" -o '+path.join(__dirname, './Chinese/'+c+'.jpg'), function(err, stdout, stderr) {
          console.log('stdout='+stdout);
        });
        isChineseImgExist = false;
      }
    }
  }
  return isChineseImgExist;
};

var text2Img = function(text, color, callback) {
  text = text.replace(/\n/, ' ');
  var ret = preProcessChinese(text);
  if (!ret) {
    setTimeout(function(){text2Img(text, color, callback);}, 200);
    return;
  }

  enCharacter = JSON.parse(fs.readFileSync(path.join(__dirname, 'enCharacter.json'), 'utf8'));

  step = defaultStep;
  color = color || defaultColor;
  var stringText = String(text);
  var width = 0;
  for (var i=0; i<stringText.length; i++) {
    var c = stringText[i];
    if (stringText[i] == ' ') {
      width = width + 1 + 1;
    } else {
      if (enCharacter[c]) {
        width = width + enCharacter[c].len + 1;
      } else if (c.match(/[\u4E00-\u9FA5]/)) {
        width = width + 11 + 1; // Chinese word is 11 width
      } else {
        return null;
      }
    }
  }
  var pureTextWidth = width - 5;
  // Two blanks are 4 column and 1 column at the end of one useful character
  if ((width-5) <= ledWidth) {
    var canvas = new Canvas(ledWidth, ledHeight);
  } else {
    var canvas = new Canvas(width, ledHeight);
  }
  var ctx = canvas.getContext('2d');
  var position = 0;
  for (var i=0; i<stringText.length; i++) {
    var c = stringText[i];
    if (c == ' ') {
      position = position + 1 + 1;
    } else if (enCharacter[c]) {
      var cImg = new Image;
      cImg.src = fs.readFileSync(path.join(__dirname, 'enCharacter', enCharacter[c].img));
      ctx.drawImage(cImg, position, 0, ledWidth, ledHeight);
      position = position + enCharacter[c].len + 1;
    } else if (c.match(/[\u4E00-\u9FA5]/)) {
      var cImg = new Image;
      cImg.src = fs.readFileSync(path.join(__dirname, 'Chinese', c+'.jpg'));
      ctx.drawImage(cImg, position, 0, ledWidth, ledHeight);
      position = position + 11 + 1;
    }
  }

  var imageJSON = {};
  if ((width-5) <= ledWidth) {
    var img = [];
    var p = ctx.getImageData(0, 0, ledWidth, ledHeight);
    for (var x=0; x<p.data.length; x+=8) {
      var pixels = 0;
      if (p.data[x]>128) {
        pixels += color;
      } else {
      }
      if (p.data[x+4]>128) {
        pixels += color*16;
      } else {
      }
      img.push(pixels);
    }
    imageJSON['img0'] = img;
    imageJSON.numberOfImg = 1;
    imageJSON.textEnd = [0];

    callback(imageJSON);
    return 0;
  }

  var timer = (new Date()).getTime();
  fs.writeFileSync(path.join(__dirname, 'image'+timer+'.jpg'), decodeBase64Image(canvas.toDataURL()).data);

  // Create perfect imgs
  for (var n=1; n<=step; n++) {
    if ((width*n)%step == 0) {
      break;
    }
  }
  var canvas = new Canvas(width*(n+1), ledHeight);
  var ctx = canvas.getContext('2d');
  var position = 0;
  for (var i=0; i<n+1; i++) {
    var cImg = new Image;
    cImg.src = fs.readFileSync(path.join(__dirname, 'image'+timer+'.jpg'));
    ctx.drawImage(cImg, position, 0, width, ledHeight);
    position = position + width;
  }
  fs.writeFileSync(path.join(__dirname, 'image'+timer+'.jpg'), decodeBase64Image(canvas.toDataURL()).data);

  imageJSON.numberOfImg = (width*n)/step;
  imageJSON.textEnd = [];
  var textEnd = pureTextWidth;
  var cImg = new Image;
  cImg.src = fs.readFileSync(path.join(__dirname, 'image'+timer+'.jpg'));
  for (var i=0; i<width*n; i+=step) {
    canvas = new Canvas(ledWidth, ledHeight);
    ctx = canvas.getContext('2d');
    ctx.translate(-(i),0);

    ctx.drawImage(cImg, 0, 0, width*(n+1), ledHeight);

    var img = [];
    var p = ctx.getImageData(0, 0, ledWidth, ledHeight);
    for (var x=0; x<p.data.length; x+=8) {
      var pixels = 0;

      if (p.data[x]>128) {
        pixels += color;
      } else {
      }
      if (p.data[x+4]>128) {
        pixels += color*16;
      } else {
      }
      img.push(pixels);
    }
    imageJSON['img'+(i/step)] = img;
    if ((i+ledWidth)>=textEnd) {
      textEnd += width;
      imageJSON.textEnd.push(i/step);
    }
  }
  callback(imageJSON);

  return;
};

module.exports = text2Img;

/*text2Img("asdfg实时", 1, function(img) {
  console.log(img);
  for (var i=0; i<img.numberOfImg; i++) {
    io.disp_raw_N(img['img'+i], 1, 100);
  }
});*/
