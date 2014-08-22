var fs = require('fs');
var child_process = require('child_process');
var path = require('path');
var EventEmitter = require("events").EventEmitter

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var logPrefix = '[sys] ';
var appStack = []; //{'app':, 'process':, 'context'}
var pendingNotification = []; //{'app':, 'time':, 'dispCount':}
var frontEndApp = null;

function printAppStack() {
  return;
  console.log(logPrefix+'Begin=================================');
  for (var i=0; i<appStack.length-1; i++) {
    console.log(logPrefix+'appStack['+i+']='+appStack[i].app+', '+appStack[i].process.pid+', '+appStack[i].context);
  }
  console.log(logPrefix+'End  =================================');
}

function launchApp(app) {
  // Check if there is an exist process for this app
  for (var i=0; i<appStack.length; i++) {
    if (appStack[i].app == app) {
      break;
    }
  }
  if (i==appStack.length) {
    console.log(logPrefix+'create a new process for '+app);
    // when launch a app, pass the app name as the first parameter (part of context), part of correspond to context.js
    var childProcess = child_process.fork(app, [app]);
    // handle user app message (new a app, escape, exit)
    childProcess.on('message', handler);
    // maintain all living app, and redirect touch event, put the app to the stack head
    //var appInfo = {'app':app, 'process':childProcess, 'context':null};
    var appInfo = {'app':app, 'process':childProcess};
    appStack.push(appInfo);
    printAppStack();
    //console.log(logPrefix+'appStack='+appStack[appStack.length-1].app);
    // Authorize app to access display
    child_process.exec(path.join(__dirname, './highLevelAPI/C/setFrontEndApp')+' '+childProcess.pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });
  } else {
    console.log(logPrefix+'restore a existing process for '+app);
    // restore context
    printAppStack();
    //console.log(logPrefix+'context='+appStack[i].context);
    // czhan25 reuse i(j), cause a bug
    for (var j=0; j<pendingNotification.length; j++) {
      if (path.join(path.dirname(app), 'notification.js') == pendingNotification[j]) {
        pendingNotification.splice(j, 1);
        break;
      }
    }
    // give display to the main process
    //childFinished = false;
    child_process.exec(path.join(__dirname, './highLevelAPI/C/setFrontEndApp')+' '+process.pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });
    // Make sure the setFrontEndApp finish
    //setTimeout(function(){restoreContext(appStack[i].process.pid);}, 10);
    //setFrontEndAppC.on('exit', function(e){childFinished=true;});
    printAppStack();
    io.disp_raw_N(appStack[i].context, 1, 1000);
    console.log(logPrefix+'context restore success');
    // give display to the procee
    child_process.exec(path.join(__dirname, './highLevelAPI/C/setFrontEndApp')+' '+appStack[i].process.pid, function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
    });
    // redirect touch event, put the app to the stack head
    // Not a stack
      /*var c = appStack[i];
      appStack[i] = appStack[appStack.length-1];
      appStack[appStack.length-1] = c;
      console.log(logPrefix+'appStack='+appStack[appStack.length-1].app);
      console.log(logPrefix+'redirect touch event success');*/
    // Is a stack
    var curApp = appStack.splice(i, 1);
    appStack.push(curApp[0]);
    printAppStack();
    //console.log(logPrefix+'appStack='+appStack[appStack.length-1].app);
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

// file name must be aligned with NOTIFICATION definition in sdk_c/include/res_manager.h
var notificationFile = '/tmp/smart_mug_notification.json';
//TODO: touch a file /tmp/smart_mug_notification.json, create a new
var fd = fs.openSync(notificationFile, 'w');
fs.closeSync(fd);
//var fsTimeout = null;
fs.watch(notificationFile, function(e, filename) {
  //if (!fsTimeout) {
    //console.log(logPrefix+'File event='+e);
    // C program Read the file, clean file, return content througth stdout, then add notification
    console.log(logPrefix+'smart_mug_notification.json change');
    if (fs.statSync(notificationFile).size == 0) {
      return;
    }
    child_process.exec(path.join(__dirname, './highLevelAPI/C/getNotification'), function(error, stdout, stderr){
    //child_process.exec('cat notification.json; rm notification.json; touch notification.json', function(error, stdout, stderr){
      console.log('getNotification stdout: ' + stdout);
      console.log('getNotification stderr: ' + stderr);
      if (error !== null) {
        console.log('getNotification exec error: ' + error);
      }
      addNotification(stdout);
    });
    //fsTimeout = setTimeout(function(){fsTimeout=null;}, 100);
  //}
});

function addNotification(msg) {
  if (msg == '' || msg == '\n') return;
  var notification = msg.split('\n');
  var isNewNotificationAdd = false;
  for (var i=0; i<notification.length; i++) {
    if (notification[i] == '') continue;
    // frontEndApp is not allowed to register notification
    if (path.dirname(appStack[appStack.length-1].app) == path.dirname(notification[i])) {
      continue;
    }
    for (var j=0; j<pendingNotification.length; j++) {
      if (notification[i] == pendingNotification[j].app) {
        pendingNotification[j].time = 0;
        isNewNotificationAdd = true;
        break;
      }
    }
    if (j==pendingNotification.length) {
      isNewNotificationAdd = true;
      pendingNotification.push({'app':notification[i], 'time':0});
      for (var k=0; k<pendingNotification.length; k++) {
        console.log(logPrefix+'At push pendingNotification['+k+']='+pendingNotification[k]);
      }
    }
  }
  // send a hold to current front end app
  if (isNewNotificationAdd) {
    console.log(logPrefix+'implicitly send a gesture '+'MUG_HODE'+' to '+appStack[appStack.length-1].app);
    appStack[appStack.length-1].process.send({'mug_gesture_on':'MUG_HODE'});
  }
}

function findNextApp(isNotification) {
  // Notification app can't be disturbed
  for (var i=0; i<pendingNotification.length; i++) {
    if (appStack[appStack.length-1].app == pendingNotification[i].app) {
      // wait for notification app exit
      return;
    }
  }
  // If has notification, and time is meet
  for (var i=0; i<pendingNotification.length; i++) {
    console.log(logPrefix+"search for a timeout notification");
    var timer = (new Date()).getTime();
    if (pendingNotification[i].time == 0 || (timer - pendingNotification[i].time)>60000) {
      pendingNotification[i].time = timer;
      launchApp(pendingNotification[i].app);
      console.log(logPrefix+"launch a notification");
      return;
    }
  }
  // otherwise
  if (!isNotification) {
    launchApp('./startup.js');
  } else {
    launchApp(appStack[appStack.length-1].app);
  }
}

// check if there is some pending notifications
function checkNotification() {
  for (var i=0; i<pendingNotification.length; i++) {
    console.log(logPrefix+"search for a timeout notification periodically");
    var timer = (new Date()).getTime();
    if (pendingNotification[i].time == 0 || (timer - pendingNotification[i].time)>10000) {
      pendingNotification[i].time = timer;
      //launchApp(pendingNotification[i].app);
      console.log(logPrefix+"reAdd a notification");
      addNotification(pendingNotification[i].app);
      setTimeout(checkNotification, 10000);
      return;
    }
  }
  setTimeout(checkNotification, 10000);
}
checkNotification();

var isTouchOnNotification = false;
//process.on('message', function(o){
var handler = function(o){
  if (o['escape']) {
    console.log(logPrefix+'receive a sys message(escape):'+JSON.stringify(o));
    // one app may send multi escape to sys
    if (appStack[appStack.length-1].app != o['escape'].app) {
      return;
    }
    console.log(logPrefix+'put '+appStack[appStack.length-1].app+' into background');
    moveToBackground(o['escape']);
    // launch
    findNextApp();
  } else if (o['newApp']) {
    console.log(logPrefix+'receive a sys message(newApp):'+JSON.stringify(o));
    moveToBackground(o['newApp'].context);
    launchApp(o['newApp'].app);
  } else if (o['exit']) {
    console.log(logPrefix+'receive a sys message(exit):'+JSON.stringify(o));
    console.log(logPrefix+appStack[appStack.length-1].app+'exit');
    // Notification will back to stack-1 app not startup app, if no touch
    // otherwise, it will launch the notification's main app
    for (var i=0; i<pendingNotification.length; i++) {
      if (appStack[appStack.length-1].app == pendingNotification[i].app) {
        break;
      }
    }
    var lastApp = appStack[appStack.length-1].app;
    appStack.pop();
    printAppStack();
    
    //console.log(logPrefix+'appStack='+appStack[appStack.length-1].app);
    // Touch on the notification, launch the 
    if (isTouchOnNotification) {
      // Can't meet this check
      /*if (i == pendingNotification.length) {
        console.log(logPrefix+'fatal error:'+i+', '+pendingNotification.length);
        throw 0;
      }*/
      isTouchOnNotification = false;
      console.log(logPrefix+'Notification launch its main app:'+path.join(path.dirname(lastApp), 'app.js'));
      launchApp(path.join(path.dirname(lastApp), 'app.js'));
    // launch 
    } else {
      if (i == pendingNotification.length) {
        findNextApp(false); // no touch on the app, app is not a notification app
      } else {
        findNextApp(true); // no touch on the app, app is a notification app
      }
    }
  } else {
    console.log(logPrefix+' message error');
  }
};

var touchEmitter = new EventEmitter();
//io.mug_touch_on(function(x, y, id) {
//function mug_touch_on(x, y, id) {
touchEmitter.on('touch', function(x, y, id) {
  // When notification is the front end app, we touch on the app, del it from pendingNotification
  //printAppStack();
  //for (var i=0; i<pendingNotification.length; i++) {
  //  console.log(logPrefix+'pendingNotification['+i+']='+pendingNotification[i].app);
  //}
  isTouchOnNotification = false;
  for (var i=0; i<pendingNotification.length; i++) {
    //console.log(logPrefix+'mug_touch_on='+appStack[appStack.length-1].app+', '+pendingNotification[i].app+', '+pendingNotification.length)
    if (appStack[appStack.length-1].app == pendingNotification[i].app) {
      pendingNotification.splice(i, 1);
      console.log(logPrefix+'Touch on a notification'+appStack[appStack.length-1].app);
      isTouchOnNotification = true;
      break;
    }
  }
  if (isTouchOnNotification) {
    // Don't need to rediret touch event to notification app as it can't handle before exit
    //launchApp();
  } else {
    console.log(logPrefix+'send a touch ('+x+','+y+','+id+') to '+appStack[appStack.length-1].app);
    appStack[appStack.length-1].process.send({'mug_touch_on':[x, y, id]});
  }
}
);
//);

//io.mug_gesture_on(function(g) {
//function mug_gesture_on(g) {
touchEmitter.on('gesture', function(g) {
  // when hold, pause the frontEndApp display in order to let the frontEndApp responds to hold immediately; This is impossible.
  // Sys defined gesture, escape a app
  if (g == 'MUG_HODE' && false) {
    //TODO: stop 
    // Disable display access
    child_process.exec(path.join(__dirname, './highLevelAPI/C/setFrontEndApp')+' -1', function(error, stdout, stderr){
      console.log(logPrefix+'stdout: ' + stdout);
      console.log(logPrefix+'stderr: ' + stderr);
      if (error !== null) {
        console.log(logPrefix+'exec error: ' + error);
      }
      // Set context of the front end app to null
      //appStack[appStack.length-1].context = null;
      // Send a message to trigger context save if process is not hanged
      console.log(logPrefix+'send a gesture '+'app_escape_sys'+' to '+appStack[appStack.length-1].app);
      appStack[appStack.length-1].process.send({'mug_gesture_on':'app_escape_sys'});
    });
  } else {
    console.log(logPrefix+'send a gesture '+g+' to '+appStack[appStack.length-1].app);
    appStack[appStack.length-1].process.send({'mug_gesture_on':g});
  }
}
);
//);

/*
io.mug_touch_on(function(x, y, id) {
  console.log('touch event='+x+', '+y+', '+id);
  //mug_touch_on(x, y, id);
  touchEmitter.emit("touch", x, y, id);
});
io.mug_gesture_on(io.MUG_GESTURE, function(g) {
  console.log('gesture event='+g);
  var gesture = null;
  switch(g) {
    case 1:
      gesture = 'MUG_GESTURE';
      break;
    case 2:
      gesture = 'MUG_SWIPE';
      break;
    case 3:
      gesture = 'MUG_SWIPE_LEFT';
      break;
    case 4:
      gesture = 'MUG_SWIPE_RIGHT';
      break;
    case 5:
      gesture = 'MUG_SWIPE_UP';
      break;
    case 6:
      gesture = 'MUG_SWIPE_DOWN';
      break;
    case 7:
      gesture = 'MUG_SWIPE_2';
      break;
    case 8:
      gesture = 'MUG_SWIPE_LEFT_2';
      break;
    case 9:
      gesture = 'MUG_SWIPE_RIGHT_2';
      break;
    case 10:
      gesture = 'MUG_SWIPE_UP_2';
      break;
    case 11:
      gesture = 'MUG_SWIPE_DOWN_2';
      break;
    case 12:
      gesture = 'MUG_HOLD';
      break;
    case 13:
      gesture = 'MUG_HOLD_2';
      break;
  }
  //mug_gesture_on(g);
  touchEmitter.emit("gesture", gesture);
});

io.mug_run_touch_thread();
*/


// Clean file
var fd = fs.openSync(path.join(__dirname, './touchEvent.json'), 'w');
fs.closeSync(fd);

// Read file to get touch event
var touchEventTimer = (new Date()).getTime();
var position=0;
var isReady = true;
function readTouch() {
  if (!isReady) return;
  isReady = false;
  var fd = fs.openSync(path.join(__dirname, './touchEvent.json'), 'r');
  var buffer=new Buffer(100);
  fs.read(fd, buffer, 0, buffer.length, position, function(err, bytes, buffer) {
    var msg = String(buffer);
    if (msg == '') {fs.close(fd); isReady = true;return;}
    var idx = msg.indexOf('\n');
    if (idx==-1) {fs.close(fd); isReady = true;return;}
    var idx1 = msg.indexOf('touch');
    var idx2 = msg.indexOf('gesture');
    if (idx1==-1 && idx2==-1) {fs.close(fd); isReady = true;return;}

    var line = msg.slice(0, idx);
    console.log('touchEvent='+line);
    var e = JSON.parse(line);
    var cTimer = (new Date()).getTime();
    if (e['touch'] && (cTimer-touchEventTimer)>1000) {touchEventTimer = cTimer; touchEmitter.emit("touch", e['touch'][0], e['touch'][1], e['touch'][2]);}
    if (e['gesture']) touchEmitter.emit("gesture", e['gesture']);
    position=position+String(line).length+1;
    fs.close(fd);
    isReady = true;
  });
}
setInterval(readTouch, 100);

var touchProcess = child_process.fork(path.join(__dirname, './highLevelAPI/getTouch.js'));
// Begin at this point
//TODO: touch a file /tmp/smart_mug_notification.json, create a new
//var fd = fs.openSync(notificationFile, 'w');
//fs.closeSync(fd);
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
/*process.stdin.setEncoding('utf8');
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
});*/
