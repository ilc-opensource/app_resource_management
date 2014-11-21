/*
 * app and resource runtime management for smart mug, a mini OS written in JS
 */
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var EventEmitter = require("events").EventEmitter

var io = require('./highLevelAPI/io.js');
var sys = require('./highLevelAPI/sys.js');

var timeIntervalEager = 1000;
var timeIntervalLazy = 10000;
var logPrefix = '[OS] ';

// For default app
var defaultApp = null;
//var defaultApp = path.join(__dirname, '../app/weather/app.js');
var timeToLaunchDefaultApp = 6000000; // 10 minutes
var timerLastTouchEvent = (new Date()).getTime();

// For app management
var appPool = [];
var appStack = []; //{'app':, 'process':, 'context'}
var frontEndApp = null;
var sysDisableTouch = true;

// For notification
//var isNotificationOn = false;
var isNotificationOn = true;
var pendingNotification = []; //{'icon':, 'app':, 'time':, 'dispCount':}
var intervalToShowNotification = 30000; //30 secondes 
var maxCountToShowNotification = 3;
var mainAppOfNotification = null;
var notificationApp = path.join(__dirname, 'notification.js');

function printAppStack() {
  console.log(logPrefix+'Begin=================================');
  for (var i=0; i<appStack.length; i++) {
    console.log(logPrefix+'appStack['+i+']='+appStack[i].app+', '+
                appStack[i].process.pid+', '+appStack[i].context);
  }
  console.log(logPrefix+'End  =================================');
}

function enableAppDisp(pid) {
  child_process.exec(
    path.join(__dirname, './highLevelAPI/C/setFrontEndApp')+' '+pid,
    function(error, stdout, stderr) {
      if (error !== null) {
        console.log(logPrefix+'setFrontEndApp exec error: ' + error);
      }
    }
  );
}

function launchApp(app) {
  if (app == notificationApp) {
    for (var i=0; i<pendingNotification.length; i++) {
      if (mainAppOfNotification == pendingNotification[i].app) {
        var childProcess = child_process.fork(app,
          [app, pendingNotification[i].icon, pendingNotification[i].app],
          {'cwd':path.dirname(app)});
        childProcess.on('message', handler);
        enableAppDisp(childProcess.pid);
        var appInfo = {'app':app, 'process':childProcess};
        frontEndApp = appInfo;
        sysDisableTouch = false;
        // Update notification info
        pendingNotification[i].time = (new Date()).getTime();
        pendingNotification[i].dispCount--;
        // if the notification is show maxCountToShowNotification, del it
        // Can delete at this point, use mainAppOfNotification when click on the notification
        if (pendingNotification[i].dispCount == 0) {
          pendingNotification.splice(i, 1);
        }
        break;
      }
    }
    return;
  }

  // Delete the pending notification of app
  for (var i=0; i<pendingNotification.length; i++) {
    if (pendingNotification[i].app == app) {
      pendingNotification.splice(i, 1);
      break;
    }
  }

  // Check if there is an exist live process for this app
  // First appStack, then appPool
  var isProcessLive = false;
  var isInAppStack = true;
  var index = null;
  for (var i=0; i<appStack.length; i++) {
    if (appStack[i].app == app) {
      break;
    }
  }
  if (i != appStack.length) {
    try {
      process.kill(appStack[i].process.pid, 0);
      isInAppStack = true;
      index = i;
      isProcessLive = true;
    } catch (ex) {
      isProcessLive = false;
      appStack.splice(i, 1);
    }
  } else {
    for (var j=0; j<appPool.length; j++) {
      if (appPool[j].app == app) {
        break;
      }
    }
    if (j != appPool.length) {
      try {
        process.kill(appPool[j].process.pid, 0);
        isInAppStack = false;
        index = j;
        isProcessLive = true;
      } catch (ex) {
        isProcessLive = false;
        appPool.splice(j, 1);
      }
    }
  }

  //console.log(logPrefix+'isProcessLive='+isProcessLive);
  if (!isProcessLive) {
    console.log(logPrefix+'create a new process for '+app);
    // when launch a app, pass the app name as the first parameter 
    // (part of context), part of correspond to context.js
    var childProcess = child_process.fork(app, [app], {'cwd':path.dirname(app)});
    // handle user app message (new a app, escape, exit, register notification)
    childProcess.on('message', handler);
    // enable app to access display
    enableAppDisp(childProcess.pid);
    // push app to the stack head, and redirect touch event to it
    var appInfo = {'app':app, 'process':childProcess};
    appStack.push(appInfo);
    frontEndApp = appInfo;
  } else {
    console.log(logPrefix+'restore a existing process for '+app);
    // restore context, give display to the os process
    enableAppDisp(process.pid);
    if (isInAppStack) {
      if (appStack[index].context != null) {
        io.disp_raw_N(appStack[index].context, 1, 0);
      }
      //console.log(logPrefix+'context restore success');
      // give display to the re-entered app procee
      enableAppDisp(appStack[index].process.pid);
      // push app to the stack head, and redirect touch event to it
      var curApp = appStack.splice(index, 1);
      appStack.push(curApp[0]);
      frontEndApp = appStack[appStack.length-1];
    } else {
      if (appPool[index].context != null) {
        io.disp_raw_N(appPool[index].context, 1, 0);
      }
      //console.log(logPrefix+'context restore success');
      // give display to the re-entered app procee
      enableAppDisp(appPool[index].process.pid);
      // push app to the stack head, and redirect touch event to it
      appStack.push(appPool[index]);
      appPool.splice(index, 1);
      frontEndApp = appStack[appStack.length-1];
    }
  }
  sysDisableTouch = false;
}

function moveToBackground(savedContext, isNewAApp) {
  // Now when an app escape, we will back to the previous app, is a real app stack;
  if (!isNewAApp) {
    if (frontEndApp.app != appStack[appStack.length-1].app) {
      console.log(logPrefix+'!! error frontEndApp.app must be equal to appStack[appStack.length-1].app');
    }
    if (savedContext.lastImg) {
      //console.log(logPrefix+'save context success');
      appStack[appStack.length-1].context = savedContext.lastImg;
    }
    appPool.push(frontEndApp);
    appStack.splice(appStack.length-1, 1);
  } else {
    // new a app, push the new app to the appStack header
    // call launchApp directly, don't call findNextApp
    if (frontEndApp.app != appStack[appStack.length-1].app) {
      console.log(logPrefix+'!! error frontEndApp.app must be equal to appStack[appStack.length-1].app');
    }
    if (savedContext.lastImg) {
      //console.log(logPrefix+'save context success');
      appStack[appStack.length-1].context = savedContext.lastImg;
    }
  }
}

// condition
// 1: click on a notification app, new app directly
// 2: a notification app exit without click on, back to the previous app
// 3: normal
// 4: escape from default app
function findNextApp(condition) {
  // Notification without touch; notification with touch will call launchApp directly
  if (frontEndApp.app == notificationApp) {
    launchApp(appStack[appStack.length-1].app);
    return;
  }

  if (frontEndApp.app == defaultApp) {
    launchApp(appStack[appStack.length-1].app);
    return;
  }

  // If has notification, and time is up.
  //console.log(logPrefix+"search for a timeout notification "+pendingNotification.length);
  for (var i=0; i<pendingNotification.length; i++) {
    var timer = (new Date()).getTime();
    if (pendingNotification[i].dispCount == maxCountToShowNotification || 
      ((timer - pendingNotification[i].time) > intervalToShowNotification && 
        pendingNotification[i].dispCount > 0)) {
      console.log(logPrefix+"launch a notification for "+pendingNotification[i].app);
      mainAppOfNotification = pendingNotification[i].app; 
      launchApp(path.join(__dirname, 'notification.js'));
      return;
    }
  }

  if (defaultApp != null && ((new Date()).getTime() - timerLastTouchEvent) > timeToLaunchDefaultApp) {
    timerLastTouchEvent = (new Date()).getTime();
    launchApp(defaultApp);
    return;
  }

  launchApp(appStack[appStack.length-1].app);
}

var handler = function(o) {
  if (o['escape']) {
    console.log(logPrefix+'receive a sys message(escape):'+o.escape.app+' escape');
    if (sysDisableTouch != true) {
      console.log(logPrefix+'!! error: sysDisableTouch must be true');
    }
    //console.log(logPrefix+'receive a sys message(escape):'+JSON.stringify(o));
    // one app may send multi escape to os
    if (frontEndApp.app != o['escape'].app) {
      console.log(logPrefix+'!! error: frontEndApp.app must be equal with o["escape"].app');
    }
    //console.log(logPrefix+'put '+frontEndApp.app+' into background');
    moveToBackground(o['escape'], false);
    findNextApp();
  } else if (o['newApp']) { // Simple new app, new notification, and new default app
    sysDisableTouch = true;
    // Don't allow none front end app new a app
    if (frontEndApp.app != o['newApp'].context.app) {
      console.log(logPrefix+'!! error: frontEndApp.app must be equal to o["newApp"].context.app');
    }
    //console.log(logPrefix+'receive a sys message(newApp):'+JSON.stringify(o));
    console.log(logPrefix+'receive a sys message(newApp):'+o.newApp.context.app+'-->'+o.newApp.app);
    if (o['newApp'].context.app != path.join(__dirname, 'notification.js')) {
      moveToBackground(o['newApp'].context, true);
    }
    launchApp(o['newApp'].app);
  } else if (o['exit']) { // Explicit exit, used for notification without click no C language APP
    console.log(logPrefix+'receive a sys message(exit):'+JSON.stringify(o));
    findNextApp();
  } else {
    console.log(logPrefix+'message type error');
  }
};

function addNotification(notification, isPeriodical) {
  // frontEndApp is not allowed to register notification
  if (frontEndApp.app == notification.app) {
    for (var i=0; i<pendingNotification.length; i++) {
      if (pendingNotification[i].app == frontEndApp.app) {
        pendingNotification.splice(i, 1);
        break;
      }
    }
    return;
  }
  //console.log(logPrefix+'addNotification='+notification+','+isPeriodical);
  // Update an existing notification or add a new notification
  for (var j=0; j<pendingNotification.length; j++) {
    if (notification.app == pendingNotification[j].app) {
      break;
    }
  }
  if (j==pendingNotification.length) {
    pendingNotification.push({'icon': notification.icon,
      'app':notification.app,
      'time':(new Date()).getTime(),
      'dispCount':maxCountToShowNotification});
  }
  // send a hold to current front end app
  mainAppOfNotification = notification.app;
  console.log(logPrefix+'notification app implicitly sends a touchEvent '+'TOUCH_HOLD'+' to '+frontEndApp.app);
  touchEmitter.emit("touchEvent", -100, path.join(__dirname, './notification.js'), 0, 0);
}

// check if there is some pending notifications
function checkNotificationPeriodically() {
  //console.log(logPrefix+"search for a timeout notification periodically"+pendingNotification.length);
  for (var i=0; i<pendingNotification.length; i++) {
    var timer = (new Date()).getTime();
    if (pendingNotification[i].dispCount == maxCountToShowNotification ||
      (timer - pendingNotification[i].time)>intervalToShowNotification) {
      console.log(logPrefix+"reAdd a notification"+pendingNotification[i].app+','+timer+','+pendingNotification[i].time);
      addNotification({'icon': pendingNotification[i].icon, 'app': pendingNotification[i].app}, true);
      setTimeout(checkNotificationPeriodically, timeIntervalEager);
      return;
    }
  }
  setTimeout(checkNotificationPeriodically, timeIntervalEager);
}

// file name must be aligned with NOTIFICATION_C and NOTIFICATION_JS definition in sdk_c/include/res_manager.h
// Event emitter can't be used in this situation as user app and OS are in different process
var notificationFileC = '/tmp/smart_mug_notification_c.json';
var fd = fs.openSync(notificationFileC, 'w');
fs.closeSync(fd);

var notificationFileJS = '/tmp/smart_mug_notification_js.json';
var fd = fs.openSync(notificationFileJS, 'w');
fs.closeSync(fd);

var isNotificationFileReady = true;
function getNotificationFromFileJS() {
  var notifications = fs.readFileSync(notificationFileJS, 'utf8').split('\n');;
  for (var i=0; i<notifications.length; i++) {
    if (notifications[i] != '') {
      try {
        var n = JSON.parse(notifications[i]);
        // {'icon':, 'app': }
        addNotification(n, false);
      } catch (ex) {
        console.log('Exception, notification is not a valid JSON string');
      }
    }
  }
}

function getNotificationFromFileC() {
  if (!isNotificationFileReady) {
    setTimeout(getNotificationFromFileC, 100);
    return;
  }
  isNotificationFileReady = false;
  child_process.exec(path.join(__dirname, './highLevelAPI/C/getNotification'), function(error, stdout, stderr){
    if (error !== null) {
      console.log('getNotification exec error: ' + error);
    }
    isNotificationFileReady = true;
    getNotificationFromFileJS();
  });
}

function launchDefaultApp() {
  if (defaultApp == null) {
    return;
  }

  // no touch action for 5 minutes, launch the default app
  if (((new Date()).getTime() - timerLastTouchEvent) > timeToLaunchDefaultApp) {
    if (frontEndApp.app != defaultApp) {
      //console.log(logPrefix+'default app implicitly sends a touchEvent '+'TOUCH_HOLD'+' to '+frontEndApp.app);
      console.log(logPrefix+frontEndApp.app+','+defaultApp+','+(new Date()).getTime()+','+timerLastTouchEvent);
      touchEmitter.emit("touchEvent", -100, defaultApp, 0, 0);
    }
  }
  setTimeout(launchDefaultApp, timeIntervalLazy);
}

// Redirect touch and gesture event to front end app
var touchEmitter = new EventEmitter();
touchEmitter.on('touchEvent', function(e, x, y, id) {
  timerLastTouchEvent = (new Date()).getTime();

  if (sysDisableTouch) {
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
    case -100:
      touchEvent = 'IMPLICIT_NEW';
      break;
    default:
      return;
  }

  console.log(logPrefix+'touchEvent='+touchEvent);
  // Check if click on a notification app, new app directly
  // Ignore other touch event
  if (frontEndApp.app == path.join(__dirname, './notification.js')) {
    if (touchEvent == 'TOUCH_CLICK') {
      for (var i=0; i<pendingNotification.length; i++) {
        if (mainAppOfNotification == pendingNotification[i].app) {
          pendingNotification.splice(i, 1);
          //console.log(logPrefix+'Touch on a notification'+frontEndApp.app);
          sysDisableTouch = true;
          break;
        }
      }
    } else {
      return;
    }
  }

  // The first app don't handle escape
  if ((frontEndApp.app == path.join(__dirname, './startup.js')) && touchEvent == 'TOUCH_HOLD') {
    return;
  }
  
  //console.log(logPrefix+'send a touchEvent '+touchEvent+' to '+frontEndApp.app);
  try {
    frontEndApp.process.send({'mug_touchevent_on':[touchEvent, x, y, id]});
  } catch (ex) {
    console.log(logPrefix+'send touchEvent to chile process exception: '+ex);
  }
  // Notification will ignore HOLD because default app will send it,
  // but notification want to handle CLICK
  if (touchEvent == 'TOUCH_HOLD' || touchEvent == 'IMPLICIT_NEW') {
    sysDisableTouch = true;
  }
});

touchEmitter.on('gesture', function(g) {
  timerLastTouchEvent = (new Date()).getTime();

  if (sysDisableTouch) {
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

  //console.log(logPrefix+'send a gesture '+gesture+' to '+frontEndApp.app);
  try {
    frontEndApp.process.send({'mug_gesture_on':gesture});
  } catch (ex) {
    console.log(logPrefix+'send gesture to child process exception: ' + ex);
  }
});

//Set deviceID
require('getmac').getMac(function(err, macAddress) {
  if (err) throw err;
  require('fs').writeFileSync('/etc/device_id', macAddress);
  console.log('generated device id:' + macAddress);    
});

// Begin at this point
launchApp(path.join(__dirname, './startup.js'));

var firstFail = false;
var activeRecover = function() {
  try {
    process.kill(frontEndApp.process.pid, 0);
    setTimeout(activeRecover, 5000);
  } catch (ex) {
    if (firstFail == true) {
      // Recover
      firstFail = false;
      appStack.pop();
      findNextApp();
      setTimeout(activeRecover, 5000);
    } else {
      firstFail = true;
      setTimeout(activeRecover, 2000);
    }
  }
};
activeRecover();

if (isNotificationOn) {
  fs.watch(notificationFileC, function(e, filename) {
    if (fs.statSync(notificationFileC).size == 0) {
      return;
    }
    getNotificationFromFileC();
  });
  checkNotificationPeriodically();
}

launchDefaultApp();

//Begin. get touch event
var touchProcess = child_process.fork(path.join(__dirname, './highLevelAPI/getTouch.js'));
touchProcess.on("message", function(o){
  if (o["touchEvent"]) {
    touchEmitter.emit("touchEvent", o['touchEvent'].e,  o['touchEvent'].x, o['touchEvent'].y, o['touchEvent'].id);
  }
  if (o["gesture"]) {
    touchEmitter.emit("gesture", o["gesture"]);
  }
});
//End. Get touch event

// handle ctrl+c
var signalHandler = function() {
  child_process.exec('./highLevelAPI/C/setFrontEndApp '+'0', function(error, stdout, stderr){});
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

/* get gesture event through file
 * TODO find another solution
 */
// Clean file
/*var fd = fs.openSync(path.join(__dirname, './touchEvent.json'), 'w');
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
*/
