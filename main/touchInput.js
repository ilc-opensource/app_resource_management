var fs = require('fs');
var child_process = require('child_process');

/*
var childProcess = child_process.fork('displayApp.js');

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    process.stdout.write('gesture: ' + chunk);
    childProcess.send({"mug_gesture_on":chunk.slice(0, -1)});
  }
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});
*/

var childProcess = child_process.exec('./setFrontEndApp 66666', function(error, stdout, stderr){
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
});
console.log('Parent pid='+process.pid);
console.log('Child Pid='+childProcess.pid);

var childProcess = child_process.exec('./readFrontEndApp', function(error, stdout, stderr){
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
});
console.log('Child Pid='+childProcess.pid);

