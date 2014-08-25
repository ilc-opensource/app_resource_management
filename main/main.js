/*
 * mini OS for app runtime management
 */
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var EventEmitter = require("events").EventEmitter

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

// TODO: read these info from config file
var defaultApp = path.join(__dirname, '../app/weather/app.js');
var timeToLaunchDefaultApp = 10000;
var intervalToShowNotification = 5000;
var maxCountToShowNotification = 3;
var checkInterval = 1000; // Find no touch event or some pending notifications
var escapeFromDefaultApp = false;

var logPrefix = '[OS] ';
var appStack = []; //{'app':, 'process':, 'context', 'disableTouch', 'isClicked'} //isClicked only for notification app
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

function enableAppDisp(pid) {
  child_process.exec(path.join(__dirname, './highLevelAPI/C/setFrontEndApp')+' '+pid, function(error, stdout, stderr){
    console.log(logPrefix+'stdout: ' + stdout);
    console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      console.log(logPrefix+'exec error: ' + error);
    }
  });
}

function launchApp(app) {
  // Check if there is an exist process for this app
  for (var i=0; i<appStack.length; i++) {
    if (appStack[i].app == app) {
      break;
    }
  }
  // Check for exit of one app
  var processExit = false;
  if (i!=appStack.length) {
    try {
      process.kill(appStack[i].process.pid, 0);
    } catch (ex) {
      processExit = true;
      appStack.splice(i, 1);
    }
  }
  if (i==appStack.length || processExit) {
    console.log(logPrefix+'create a new process for '+app);
    // when launch a app, pass the app name as the first parameter (part of context), part of correspond to context.js
    var childProcess = child_process.fork(app, [app]);
    // handle user app message (new a app, escape, exit, register notification)
    childProcess.on('message', handler);
    // enable app to access display
    enableAppDisp(childProcess.pid);
    // push app to the stack head, and redirect touch event to it
    var appInfo = {'app':app, 'process':childProcess, 'disableTouch':false};
    appStack.push(appInfo);
    frontEndApp = appStack[appStack.length-1];
    // if the notification is show maxCountToShowNotification, del it
    for (var j=0; j<pendingNotification.length; j++) {
      console.log(logPrefix+'count'+app+','+JSON.stringify(pendingNotification[j]));
      if (app == pendingNotification[j].app) {
        pendingNotification[j].dispCount--;
        if (pendingNotification[j].dispCount == 0) {
          pendingNotification.splice(j, 1);
        }
        break;
      }
    }
  } else {
    console.log(logPrefix+'restore a existing process for '+app);
    // czhan25 reuse i(j), cause a bug
    // When re-enter one app, clean its notification
    for (var j=0; j<pendingNotification.length; j++) {
      if (path.join(path.dirname(app), 'notification.js') == pendingNotification[j]) {
        pendingNotification.splice(j, 1);
        break;
      }
    }
    // restore context, give display to the os process
    enableAppDisp(process.pid);
    io.disp_raw_N(appStack[i].context, 1, 0);
    console.log(logPrefix+'context restore success');
    // give display to the re-entered app procee
    enableAppDisp(appStack[i].process.pid);
    // push app to the stack head, and redirect touch event to it
    appStack[i].process.send({'enableTouch': true});
    var curApp = appStack.splice(i, 1);
    appStack.push(curApp[0]);
    frontEndApp = appStack[appStack.length-1];
    frontEndApp['disableTouch'] = false;
    //printAppStack();
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
}

// condition
// 1: click on a notification app, new app directly
// 2: a notification app exit without click on, back to the previous app
// 3: normal
// 4: escape from default app
function findNextApp(condition) {
  // Notification app can't be disturbed
  /*for (var i=0; i<pendingNotification.length; i++) {
    if (appStack[appStack.length-1].app == pendingNotification[i].app) {
      // wait for notification app exit
      return;
    }
  }*/
  if (condition == 1) {
    launchApp(path.join(path.dirname(frontEndApp.app), 'app.js'));
    return;
  }
  if (condition == 2) {
    launchApp(appStack[appStack.length-1].app);
    return;
  }
  // If has notification, and time is meet
  for (var i=0; i<pendingNotification.length; i++) {
    console.log(logPrefix+"search for a timeout notification");
    var timer = (new Date()).getTime();
    if (pendingNotification[i].time == 0 || (timer - pendingNotification[i].time)>intervalToShowNotification) {
      pendingNotification[i].time = timer;
      launchApp(pendingNotification[i].app);
      console.log(logPrefix+"launch a notification");
      return;
    }
  }
  if (condition == 4) {
    // default app has not been poped
    launchApp(appStack[appStack.length-2].app);
    return;
  }
  // otherwise
  if (((new Date()).getTime() - timerLastTouchEvent) > timeToLaunchDefaultApp) {
    timerLastTouchEvent = (new Date()).getTime();
    escapeFromDefaultApp = true;
    launchApp(defaultApp);
  } else {
    launchApp('./startup.js');
  }
}

function addNotification(notification, isPeriodical) {
  
  if (notification == '') return;
  // frontEndApp is not allowed to register notification
  if (path.dirname(frontEndApp.app) == path.dirname(notification)) {
    return;
  }
  // Update an existing notification or add a new notification
  for (var j=0; j<pendingNotification.length; j++) {
    if (notification == pendingNotification[j].app) {
      pendingNotification[j].time = 0;
      if (!isPeriodical) {
        pendingNotification[j].dispCount = maxCountToShowNotification;
      }
      break;
    }
  }
  if (j==pendingNotification.length) {
    pendingNotification.push({'app':notification, 'time':0, 'dispCount':maxCountToShowNotification});
  }
  // send a hold to current front end app
  console.log(logPrefix+'notification app implicitly sends a touchEvent '+'TOUCH_HOLD'+' to '+frontEndApp.app);
  frontEndApp.process.send({'mug_touchevent_on':['TOUCH_HOLD', 0, 0, 0]});
}

// check if there is some pending notifications
function checkNotificationPeriodically() {
  for (var i=0; i<pendingNotification.length; i++) {
    console.log(logPrefix+"search for a timeout notification periodically");
    var timer = (new Date()).getTime();
    if (pendingNotification[i].time == 0 || (timer - pendingNotification[i].time)>intervalToShowNotification) {
      pendingNotification[i].time = timer;
      console.log(logPrefix+"reAdd a notification");
      addNotification(pendingNotification[i].app, true);
      setTimeout(checkNotificationPeriodically, checkInterval);
      return;
    }
  }
  setTimeout(checkNotificationPeriodically, checkInterval);
}
checkNotificationPeriodically();

var fsTimeout_1 = null;
fs.watch(path.join(__dirname, '../app/weather/weatherNotification'), function(e, filename) {
  // write command to notification.json
  //sys.registerNotification(path.join(__dirname, 'notification.js'));
  if (!fsTimeout_1) {
    addNotification(path.join(__dirname, '../app/weather/notification.js'), false);
    fsTimeout_1 = setTimeout(function(){fsTimeout_1=null;}, 100);
  }
});
var fsTimeout_2 = null;
fs.watch(path.join(__dirname, '../app/weChat/weChatNotification'), function(e, filename) {
    // write command to notification.json
    //sys.registerNotification(path.join(__dirname, 'notification.js'));
    if (!fsTimeout_2) {
      addNotification(path.join(__dirname, '../app/weChat/notification.js'), false);
      fsTimeout_2 = setTimeout(function(){fsTimeout_2=null;}, 100);
    }
});

var isTouchOnNotification = false;
var handler = function(o) {
  if (o['escape']) {
    console.log(logPrefix+'receive a sys message(escape):'+JSON.stringify(o));
    // one app may send multi escape to os
    //if (appStack[appStack.length-1].app != o['escape'].app) {
    if (frontEndApp.app != o['escape'].app) {
      return;
    }
    console.log(logPrefix+'put '+frontEndApp.app+' into background');
    moveToBackground(o['escape']);
    if (escapeFromDefaultApp) {
      escapeFromDefaultApp = false;
      findNextApp(4);
    } else {
      // launch
      findNextApp(3);
    }
  } else if (o['newApp']) {
    // Don't allow none front end app new a app
    if (frontEndApp.app != o['newApp'].context.app) {
      return;
    }
    console.log(logPrefix+'receive a sys message(newApp):'+JSON.stringify(o));
    moveToBackground(o['newApp'].context);
    launchApp(o['newApp'].app);
  } else if (o['exit']) { // Explicit exit, only used for notification
    console.log(logPrefix+'receive a sys message(exit):'+JSON.stringify(o));
    console.log(logPrefix+frontEndApp.app+'exit');
    appStack.pop();
    
    if (frontEndApp.isClicked == true) {
      findNextApp(1);
    } else {
      findNextApp(2); // no touch on the app, app is a notification app
    }
  } else if (o['notification']) {
    addNotification(o['notification'], false);
  } else {
    console.log(logPrefix+' message error');
  }
};

var timerLastTouchEvent = (new Date()).getTime();
function launchDefaultApp() {
  // no touch action for one minute, launch the default app
  if (((new Date()).getTime() - timerLastTouchEvent) > timeToLaunchDefaultApp) {
    //if (frontEndApp.app != defaultApp && path.basename(frontEndApp.app) != 'notification.js') {
    if (frontEndApp.app != defaultApp) {
      console.log(logPrefix+'default app implicitly sends a touchEvent '+'TOUCH_HOLD'+' to '+frontEndApp.app);
      //console.log(logPrefix+frontEndApp.app+','+defaultApp);
      frontEndApp.process.send({'mug_touchevent_on':['TOUCH_HOLD', 0, 0, 0]});
    }
  }
  setTimeout(launchDefaultApp, checkInterval);
}
setTimeout(launchDefaultApp, checkInterval);

// Redirect touch and gesture event to front end app
var touchEmitter = new EventEmitter();
touchEmitter.on('touchEvent', function(e, x, y, id) {
  timerLastTouchEvent = (new Date()).getTime();
  console.log(logPrefix+'touchEvent='+e);
  if (frontEndApp == null) {
    return;
  }
  var touchEvent = null;
  switch(e) {
    case 1:
      touchEvent = 'TOUCH_CLICK';
      break;
    case 4:
      touchEvent = 'TOUCH_HOLD';
      break;
    default:
      return;;
  }

  if (frontEndApp.disableTouch) {
    return;
  }

  // Check if click on a notification app, new app directly
  for (var i=0; i<pendingNotification.length; i++) {
    if (frontEndApp.app == pendingNotification[i].app) {
      pendingNotification.splice(i, 1);
      console.log(logPrefix+'Touch on a notification'+frontEndApp.app);
      frontEndApp.disableTouch = true;
      frontEndApp.isClicked = true;
      return;
    }
  }

  console.log(logPrefix+'send a touchEvent '+touchEvent+' to '+frontEndApp.app);
  frontEndApp.process.send({'mug_touchevent_on':[touchEvent, x, y, id]});
  if (touchEvent == 'TOUCH_HOLD') {
    frontEndApp.disableTouch = true;
  }
});

touchEmitter.on('gesture', function(g) {
  timerLastTouchEvent = (new Date()).getTime();
  console.log(logPrefix+'gesture='+g);
  if (frontEndApp == null) {
    return;
  }
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
    default:
      return;
  }

  if (frontEndApp.disableTouch) {
    return;
  }
  console.log(logPrefix+'send a gesture '+gesture+' to '+frontEndApp.app);
  frontEndApp.process.send({'mug_gesture_on':gesture});
});

/* get gesture event through file
 * TODO find another solution
 */
// Clean file
var fd = fs.openSync(path.join(__dirname, './touchEvent.json'), 'w');
fs.closeSync(fd);
// Read file to get touch event
var position=0;
var isReady = true;
var fd = fs.openSync(path.join(__dirname, './touchEvent.json'), 'r');
var buffer=new Buffer(100);
function readTouch() {
  if (!isReady) return;
  isReady = false;
  fs.read(fd, buffer, 0, buffer.length, position, function(err, bytes, buffer) {
    if (bytes == 0) {
      isReady = true;
      return;
    }
    var msg = buffer.toString();
    var idx = msg.indexOf('\n');
    if (idx==-1) {
      isReady = true;
      return;
    }

    var line = msg.slice(0, idx);
    var e = JSON.parse(line);
    if (e['touch']) {
      touchEmitter.emit("touch", e['touch'][0], e['touch'][1], e['touch'][2]);}
    if (e['touchEvent']) {
      touchEmitter.emit("touchEvent", e['touchEvent'][0],  e['touchEvent'][1], e['touchEvent'][2], e['touchEvent'][3]);
    }
    if (e['gesture']) {
      touchEmitter.emit("gesture", e['gesture']);
    }
    position=position+String(line).length+1; // 1 is the length of '\n'
    isReady = true;
  });
}
setInterval(readTouch, 100);
var touchProcess = child_process.fork(path.join(__dirname, './highLevelAPI/getTouch.js'));

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
