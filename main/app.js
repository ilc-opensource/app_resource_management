var fs = require('fs');
var child_process = require('child_process');
var io = require('./highLevelAPI/io.js');

var logPrefix = '[main app] ';

var appStack = []; //{'app':, 'process':, 'context'}

function launchApp(app) {
  console.log(logPrefix+'launch a app '+app);
  // Check if a exist process for this app
  for (var i=0; i<appStack.length; i++) {
    if (appStack[i].app == app) {
      break;
    }
  }
  if (i==appStack.length) {
    // when launch a app, pass the app name as the first parameter, correspond to io.js
    var childProcess = child_process.fork(app, [app]);
    // handle user app message (new a app, escape, exit)
    childProcess.on('message', handler);
    // maintain all living app, and redirect touch event, put the app to the stack head
    var appInfo = {'app':app, 'process':childProcess, 'context':null};
    appStack.push(appInfo);
    // Authorize app to access display
    child_process.exec('./highLevelAPI/setFrontEndApp '+childProcess.pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });
  } else {
    // restore context
    io.disp_raw_N(appStack[i].context, 1, 100);
    // give display to the procee
    child_process.exec('./highLevelAPI/setFrontEndApp '+appStack[i].process.pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });
    // redirect touch event, put the app to the stack head
    var c = appStack[i];
    appStack[i] = appStack[appStack.length-1];
    appStack[appStack.length-1] = c;
  }
}

function moveToBackground(savedContext) {
  // Now when an app escape, we will back to main app, not a real app stack;
  // Find the exist process for this app
  for (var i=0; i<appStack.length; i++) {
    if (appStack[i].app == savedContext.app) {
      break;
    }
  }
  if (i==appStack.length) {
    console.log(logPrefix+'no process for this app'+savedContext.app);
    return -1;
  }
  
  appStack[i].context = savedContext.lastImg;
  // Disable touch for this app
  // TODO:

  // Disable display for this app
  child_process.exec('./highLevelAPI/setFrontEndApp '+0, function(error, stdout, stderr){
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
  
}

var fsTimeout = null;
fs.watch('notification.json', function(e, filename) {
  if (!fsTimeout) {
    console.log(logPrefix+'File event='+e);
    // C program Read the file, clean file, return content througth stdout, then add notification
    //child_process.exec('./highLevelAPI/readNotification', function(error, stdout, stderr){
    child_process.exec('cat notification.json; rm notification.json; touch notification.json', function(error, stdout, stderr){
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
      addNotification(stdout);
    });
    fsTimeout = setTimeout(function(){fsTimeout=null;}, 100);
  }
});

function addNotification(notification) {
  // Block current app, display and touch
  /*child_process.exec('./setFrontEndApp '+childProcess.pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });*/
  // put xxx to stack head

  // add app to appStack, and pending
  
  // send a signal to escape current app
  
}

function launchNextApp() {
  // If has notification, and time is meet

  // otherwise
  launchApp('./smart_mug_start.js');
}

//process.on('message', function(o){
var handler = function(o){
  console.log(logPrefix+'receive a message:'+o);
  if (o['escape']) {
    console.log(logPrefix+'put '+appStack[appStack.length-1].app+' into background');
    moveToBackground(o['escape']);
    // launch
    launchNextApp();
  } else if (o['newApp']) {
    console.log(logPrefix+'create a new app'+o['newApp']);
    launchApp(o['newApp']);
  } else if (o['exit']) {
    console.log(logPrefix+appStack[appStack.length-1].app+'exit');
    appStack.pop();
    // launch 
    launchNextApp();
    //launchApp('./smart_mug_start.js');
  }
};

//io.mug_touch_on(function(x, y, id) {
function mug_touch_on(x, y, id) {
  // In main app
  if (appStack[appStack.length-1].process == process) {
    if (x>=scopeApp[0][0] && x<=scopeApp[1][0] && y>=scopeApp[0][1] && y<=scopeApp[1][1]) {
      newApp('displayApp.js');
      //var childProcess = child_process.fork('displayApp.js');
      //childProcess.on('message', handler);
      //pushAppIntoStack(childProcess);
    }
    if (x>=scopeShutDown[0][0] && x<=scopeShutDown[1][0] && y>=scopeShutDown[0][1] && y<=scopeShutDown[1][1]) {
      child_process.exec('shutdown')
    }
  } else {
    appStack[appStack.length-1].process.send({'mug_touch_on':[x, y, id]});
  }
}
//);

//io.mug_gesture_on(function(g) {
function mug_gesture_on(g) {
  // In main app
  if (appStack[appStack.length-1].process == process) {
    // No handler for gesture in main app;
  } else {
    appStack[appStack.length-1].process.send({'mug_gesture_on':g});
  }
}
//);

// Launch smart_mug_start
launchApp('./smart_mug_start.js');

// Emulate a touchPanel input
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    //process.stdout.write('gesture: ' + chunk);
    var e = JSON.parse(chunk);
    if (e.touch) {
      mug_touch_on(e.touch[0], e.touch[1], e.touch[2]);
    } else if (e.gesture){
      mug_gesture_on(e.gesture);
    } else {
      console.log("touchPanel error");
    }
  }
});
process.stdin.on('end', function() {
  process.stdout.write('end');
});
