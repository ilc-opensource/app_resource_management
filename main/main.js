var fs = require('fs');
var child_process = require('child_process');
var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[sys] ';
var appStack = []; //{'app':, 'process':, 'context'}
//var childFinished = false;

function launchApp(app) {
  //console.log(logPrefix+'launch a app '+app);
  // Check if a exist process for this app
  for (var i=0; i<appStack.length; i++) {
    if (appStack[i].app == app) {
      break;
    }
  }
  if (i==appStack.length) {
    console.log(logPrefix+'create a new process for '+app);
    // when launch a app, pass the app name as the first parameter, correspond to io.js
    var childProcess = child_process.fork(app, [app]);
    // handle user app message (new a app, escape, exit)
    childProcess.on('message', handler);
    // maintain all living app, and redirect touch event, put the app to the stack head
    var appInfo = {'app':app, 'process':childProcess, 'context':null};
    appStack.push(appInfo);
    // Authorize app to access display
    child_process.exec('./highLevelAPI/C/setFrontEndApp '+childProcess.pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });
  } else {
    console.log(logPrefix+'restore a existing process for '+app);
    // restore context
    console.log(logPrefix+'context='+appStack[i].context);
    // give display to the main process
    //childFinished = false;
    child_process.exec('./highLevelAPI/C/setFrontEndApp '+process.pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });
    // Make sure the setFrontEndApp finish
    //setTimeout(function(){restoreContext(appStack[i].process.pid);}, 10);
    //setFrontEndAppC.on('exit', function(e){childFinished=true;});

    io.disp_raw_N(appStack[i].context, 1, 1000);
    console.log(logPrefix+'context restore success');
    // give display to the procee
    child_process.exec('./highLevelAPI/C/setFrontEndApp '+appStack[i].process.pid, function(error, stdout, stderr){
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
    console.log(logPrefix+'redirect touch event success');
  }
}

/*function restoreContext(pid) {
  if (childFinished==true) {
    child_process.exec('./highLevelAPI/C/setFrontEndApp '+pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });
    console.log('child finished');
  } else {
    setTimeout(function(){restoreContext(pid);}, 10);
  }
}*/

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
 
  console.log(logPrefix+'save context('+savedContext.app+'):'+savedContext.lastImg); 
  appStack[i].context = savedContext.lastImg;
  // Disable touch for this app
  // TODO:

  // Disable display for this app
  /*child_process.exec('./highLevelAPI/C/setFrontEndApp '+'-1', function(error, stdout, stderr){
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });*/
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
  // Through file system
  
}

function launchNextApp() {
  // If has notification, and time is meet

  // otherwise
  launchApp('./startup.js');
}

//process.on('message', function(o){
var handler = function(o){
  if (o['escape']) {
    console.log(logPrefix+'receive a sys message(escape):'+JSON.stringify(o));
    console.log(logPrefix+'put '+appStack[appStack.length-1].app+' into background');
    moveToBackground(o['escape']);
    // launch
    launchNextApp();
  } else if (o['newApp']) {
    console.log(logPrefix+'receive a sys message(newApp):'+JSON.stringify(o));
    console.log(logPrefix+'create a new app'+o['newApp']);
    moveToBackground(o['newApp'].context);
    launchApp(o['newApp'].app);
  } else if (o['exit']) {
    console.log(logPrefix+'receive a sys message(exit):'+JSON.stringify(o));
    console.log(logPrefix+appStack[appStack.length-1].app+'exit');
    appStack.pop();
    // launch 
    launchNextApp();
  } else {
    console.log(logPrefix+' message error');
  }
};

//io.mug_touch_on(function(x, y, id) {
function mug_touch_on(x, y, id) {
  console.log(logPrefix+'send a touch ('+x+','+y+','+id+') to '+appStack[appStack.length-1].app);
  appStack[appStack.length-1].process.send({'mug_touch_on':[x, y, id]});
}
//);

//io.mug_gesture_on(function(g) {
function mug_gesture_on(g) {
  console.log(logPrefix+'send a gesture '+g+' to '+appStack[appStack.length-1].app);
  appStack[appStack.length-1].process.send({'mug_gesture_on':g});
}
//);

// Begin at this point
launchApp('./startup.js');

// handle ctrl+c
var signalHandler = function() {
  child_process.exec('./highLevelAPI/C/setFrontEndApp '+'0', function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });
  process.exit();
};
process.on('SIGINT', signalHandler);
process.on('SIGTERM', signalHandler);

// Emulate a touchPanel input
process.stdin.setEncoding('utf8');
process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null && chunk != '\n') {
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
