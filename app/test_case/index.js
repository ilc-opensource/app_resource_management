var fs = require('fs');
var path = require('path');

var animation = require('./display.js');

// data, interval, isAtomic, dispWhole, cb, start
var callback = function(){
  //console.log('animation end');
};

var w = fs.readFileSync(path.join(__dirname, './loading.json'), 'utf8');
animation(w, 50, false, false, callback);

//setInterval(function(){console.log('one second')}, 1000);

process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null && chunk != '\n') {
    //process.stdout.write('gesture: ' + chunk);
    var e = JSON.parse(chunk);
    var data = fs.readFileSync(path.join(__dirname, e.file), 'utf8');
    animation(data, 50, e.isAtomic, e.dispWhole, callback);
  }
});
process.stdin.on('end', function() {
  process.stdout.write('end');
});
