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
//var defaultApp = path.join(__dirname, '../app/weather/app.js');
var defaultApp = null;
var timeToLaunchDefaultApp = 3000000;
var intervalToShowNotification = 10000;
var maxCountToShowNotification = 3;
var checkInterval = 1000; // Find no touch event or some pending notifications
var escapeFromDefaultApp = false;

var isAppReady = false;
var logPrefix = '[OS] ';
var appStack = []; //{'app':, 'process':, 'context', 'disableTouch', 'isClicked'} //isClicked only for notification app
var mainAppOfNotification = null;
var pendingNotification = []; //{'icon':, 'app':, 'time':, 'dispCount':}
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
    //if (stdout != '') console.log(logPrefix+'stdout: ' + stdout);
    //if (stderr != '') console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      //console.log(logPrefix+'exec error: ' + error);
    }
  });
}

function launchApp(app) {
  if (app == path.join(__dirname, 'notification.js')) {
    console.log(logPrefix+'launch a notification');
    for (var i=0; i<pendingNotification.length; i++) {
      if (mainAppOfNotification == pendingNotification[i].app) {
        var childProcess = child_process.fork(app, [app, pendingNotification[i].icon, pendingNotification[i].app]);
        childProcess.on('message', handler);
        enableAppDisp(childProcess.pid);
        var appInfo = {'app':app, 'process':childProcess, 'disableTouch':false};
        frontEndApp = appInfo;
        // if the notification is show maxCountToShowNotification, del it
        pendingNotification[i].time = (new Date()).getTime();
        pendingNotification[i].dispCount--;
        if (pendingNotification[i].dispCount == 0) {
          //pendingNotification.splice(i, 1);
        }
        break;
      }
    }
    return;
  }

  // Delete its pending notification
  for (var i=0; i<pendingNotification.length; i++) {
    if (pendingNotification[i].app == app) {
      pendingNotification.splice(i, 1);
      break;
    }
  }

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

  //console.log(logPrefix+'processExit='+processExit);
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
    /*for (var j=0; j<pendingNotification.length; j++) {
      console.log(logPrefix+'count'+app+','+JSON.stringify(pendingNotification[j]));
      if (app == pendingNotification[j].app) {
        pendingNotification[j].time = (new Date()).getTime();
        pendingNotification[j].dispCount--;
        if (pendingNotification[j].dispCount == 0) {
          pendingNotification.splice(j, 1);
        }
        break;
      }
    }*/
  } else {
    console.log(logPrefix+'restore a existing process for '+app);
    // czhan25 reuse i(j), cause a bug
    // When re-enter one app, clean its notification
    for (var j=0; j<pendingNotification.length; j++) {
      //if (path.join(path.dirname(app), 'notification.js') == pendingNotification[j]) {
      if (app == pendingNotification[j].app) {
        pendingNotification.splice(j, 1);
        break;
      }
    }
    // restore context, give display to the os process
    enableAppDisp(process.pid);
    if (appStack[i].context != null) {
      io.disp_raw_N(appStack[i].context, 1, 0);
    }
    //console.log(logPrefix+'context restore success');
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
  isAppReady = true;
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
    //console.log(logPrefix+'no process for this app'+savedContext.app);
    return -1;
  }
 
  if (savedContext.lastImg) {
    //console.log(logPrefix+'save context success');
    appStack[i].context = savedContext.lastImg;
  }
}

// condition
// 1: click on a notification app, new app directly
// 2: a notification app exit without click on, back to the previous app
// 3: normal
// 4: escape from default app
function findNextApp(condition) {
  if (condition == 1) {
    //launchApp(path.join(path.dirname(frontEndApp.app), 'app.js'));
    launchApp(mainAppOfNotification);
    return;
  }
  if (condition == 2) {
    launchApp(appStack[appStack.length-1].app);
    return;
  }
  // If has notification, and time is meet
  console.log(logPrefix+"search for a timeout notification "+pendingNotification.length);
  for (var i=0; i<pendingNotification.length; i++) {
    var timer = (new Date()).getTime();
    if (/*pendingNotification[i].time == 0 ||*/
      pendingNotification[i].dispCount == maxCountToShowNotification || 
      ((timer - pendingNotification[i].time) > intervalToShowNotification && 
        pendingNotification[i].dispCount > 0)) {
      console.log(logPrefix+"launch a notification for "+pendingNotification[i].app);
      mainAppOfNotification = pendingNotification[i].app; 
      launchApp(path.join(__dirname, 'notification.js'));
      return;
    }
  }
  if (condition == 4) {
    // default app has not been poped
    launchApp(appStack[appStack.length-2].app);
    return;
  }
  // otherwise
  if (defaultApp != null && ((new Date()).getTime() - timerLastTouchEvent) > timeToLaunchDefaultApp) {
    timerLastTouchEvent = (new Date()).getTime();
    escapeFromDefaultApp = true;
    launchApp(defaultApp);
  } else {
    launchApp(path.join(__dirname, './startup.js'));
  }
}

function addNotification(notification, isPeriodical) {
  if (!isAppReady) return;

  //if (notification == '') return;
  // frontEndApp is not allowed to register notification
  //if (path.dirname(frontEndApp.app) == path.dirname(notification)) {
  if (frontEndApp.app == notification.app) {
    // Del it from pending
    for (var i=0; i<pendingNotification.length; i++) {
      if (pendingNotification[i].app == notification.app) {
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
    pendingNotification.push({'icon': notification.icon, 'app':notification.app, 'time':(new Date()).getTime(), 'dispCount':maxCountToShowNotification});
  }
  // send a hold to current front end app
  console.log(logPrefix+'notification app implicitly sends a touchEvent '+'TOUCH_HOLD'+' to '+frontEndApp.app);
  frontEndApp.process.send({'mug_touchevent_on':['TOUCH_HOLD', 0, 0, 0]});
}

// check if there is some pending notifications
function checkNotificationPeriodically() {
  if (!isAppReady) {
    setTimeout(checkNotificationPeriodically, checkInterval);
    return;
  }

  //console.log(logPrefix+"search for a timeout notification periodically"+pendingNotification.length);
  for (var i=0; i<pendingNotification.length; i++) {
    var timer = (new Date()).getTime();
    if (/*pendingNotification[i].time == 0 ||*/
      pendingNotification[i].dispCount == maxCountToShowNotification ||
      (timer - pendingNotification[i].time)>intervalToShowNotification) {
      //pendingNotification[i].time = timer;
      console.log(logPrefix+"reAdd a notification"+pendingNotification[i].app+','+timer+','+pendingNotification[i].time);
      addNotification({'icon': pendingNotification[i].icon, 'app': pendingNotification[i].app}, true);
      setTimeout(checkNotificationPeriodically, checkInterval);
      return;
    }
  }
  setTimeout(checkNotificationPeriodically, checkInterval);
}
checkNotificationPeriodically();

/*var appNotificationFile = [];
function appNotification(file) {
  appNotificationFile.push(file);
  var fsTimeout = null;
  console.log(logPrefix+'notification file='+file);
  fs.watch(file, function(e, filename) {
    // write command to notification.json
    //sys.registerNotification(path.join(__dirname, 'notification.js'));
    if (!fsTimeout) {
      addNotification(file+'.js', false);
      fsTimeout = setTimeout(function(){fsTimeout=null;}, 100);
    }
  });
}
*/

// file name must be aligned with NOTIFICATION_C and NOTIFICATION_JS definition in sdk_c/include/res_manager.h
var notificationFileC = '/tmp/smart_mug_notification_c.json';
var fd = fs.openSync(notificationFileC, 'w');
fs.closeSync(fd);

var notificationFileJS = '/tmp/smart_mug_notification_js.json';
var fd = fs.openSync(notificationFileJS, 'w');
fs.closeSync(fd);

//var isNotificationFileReady = true;
var isNotificationFileReady = false;
function getNotificationFromFileJS() {
  if (!isNotificationFileReady) {
    setTimeout(getNotification, 100);
    return;
  }
  isNotificationFileReady = false;
  var notifications = fs.readFileSync(notificationFileJS, 'utf8').split('\n');;
  for (var i=0; i<notifications.length; i++) {
    if (notifications[i] != '') {
      try {
        var n = JSON.parse(notifications[i]);
        addNotification(n, false);
      } catch (ex) {

      }
    }
  }
  isNotificationFileReady = true;
}

function getNotificationFromFileC() {
  if (!isNotificationFileReady) {
    setTimeout(getNotificationFromFileC, 100);
    return;
  }
  isNotificationFileReady = false;
  child_process.exec(path.join(__dirname, './highLevelAPI/C/getNotification'), function(error, stdout, stderr){
    //console.log('getNotification stdout: ' + stdout);
    //console.log('getNotification stderr: ' + stderr);
    //if (error !== null) {
    //  console.log('getNotification exec error: ' + error);
    //}
    isNotificationFileReady = true;
    getNotificationFromFileJS();
  });
}

fs.watch(notificationFileC, function(e, filename) {
  if (fs.statSync(notificationFileC).size == 0) {
    return;
  }
  getNotificationFromFileC();
});

var handler = function(o) {
  if (o['escape']) {
    console.log(logPrefix+'receive a sys message(escape):'+JSON.stringify(o));
    //console.log(logPrefix+'receive a sys message(escape):');
    // one app may send multi escape to os
    //if (appStack[appStack.length-1].app != o['escape'].app) {
    if (frontEndApp.app != o['escape'].app) {
      return;
    }
    //console.log(logPrefix+'put '+frontEndApp.app+' into background');
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
    //console.log(logPrefix+'receive a sys message(newApp):');
    if (o['newApp'].context.app != path.join(__dirname, 'notification.js')) {
      moveToBackground(o['newApp'].context);
    }
    launchApp(o['newApp'].app);
  } else if (o['exit']) { // Explicit exit, used for notification without click and C language APP
    console.log(logPrefix+'receive a sys message(exit):'+JSON.stringify(o));
    //console.log(logPrefix+'receive a sys message(exit):');
    //console.log(logPrefix+frontEndApp.app+'exit');
    if (frontEndApp.app == path.join(__dirname, 'notification.js')) {
      findNextApp(2); // no touch on the app, app is a notification app
    } else {
      appStack.pop();
      findNextApp(3);
    }
    //appStack.pop();
    
    //if (frontEndApp.isClicked == true) {
    //  findNextApp(1);
    //} else {
    //  findNextApp(2); // no touch on the app, app is a notification app
    //}
  } /*else if (o['notification']) {
    //addNotification(o['notification'], false);
  } else if (o['installedApps']) {
    // Clean all watch
    for (var i=0; i<appNotificationFile.length; i++) {
      fs.unwatchFile(appNotificationFile[i]);
    }
    appNotificationFile = [];
    var appJSON = o['installedApps'];
    for (var key in appJSON) {
      if (appJSON[key].name && appJSON[key].icon && appJSON[key].notification) {
        appNotification(path.join(__dirname, '../app/', appJSON[key].name, appJSON[key].notification));
      }
    }
  }*/ else {
    //console.log(logPrefix+' message error');
  }
};

var timerLastTouchEvent = (new Date()).getTime();
function launchDefaultApp() {
  if (!isAppReady) {
    setTimeout(launchDefaultApp, checkInterval);
    return;
  }

  if (defaultApp == null) {
    return;
  }

  // no touch action for one minute, launch the default app
  if (((new Date()).getTime() - timerLastTouchEvent) > timeToLaunchDefaultApp) {
    //if (frontEndApp.app != defaultApp && path.basename(frontEndApp.app) != 'notification.js') {
    if (frontEndApp.app != defaultApp) {
      //console.log(logPrefix+'default app implicitly sends a touchEvent '+'TOUCH_HOLD'+' to '+frontEndApp.app);
      console.log(logPrefix+frontEndApp.app+','+defaultApp+','+(new Date()).getTime()+','+timerLastTouchEvent);
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
  //console.log(logPrefix+'touchEvent='+e);
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
      //console.log(logPrefix+'Touch on a notification'+frontEndApp.app);
      frontEndApp.disableTouch = true;
      frontEndApp.isClicked = true;
      //return;
      break;
    }
  }

  // The first app can't escape
  if (frontEndApp.app == path.join(__dirname, './startup.js') && touchEvent == 'TOUCH_HOLD') {
    return;
  }
  //console.log(logPrefix+'send a touchEvent '+touchEvent+' to '+frontEndApp.app);
  frontEndApp.process.send({'mug_touchevent_on':[touchEvent, x, y, id]});
  // Notification will ignore HOLD because default app will send it,
  // but notification want to handle CLICK
  if (touchEvent == 'TOUCH_HOLD' && path.basename(frontEndApp.app) != 'notification') {
    frontEndApp.disableTouch = true;
  }
});

touchEmitter.on('gesture', function(g) {
  timerLastTouchEvent = (new Date()).getTime();
  //console.log(logPrefix+'gesture='+g);
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
  //console.log(logPrefix+'send a gesture '+gesture+' to '+frontEndApp.app);
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

// Begin at this point
launchApp(path.join(__dirname, './startup.js'));

// Begin to get touch event
var touchProcess = child_process.fork(path.join(__dirname, './highLevelAPI/getTouch.js'));

// handle ctrl+c
var signalHandler = function() {
  child_process.exec('./highLevelAPI/C/setFrontEndApp '+'0', function(error, stdout, stderr){
    //console.log(logPrefix+'stdout: ' + stdout);
    //console.log(logPrefix+'stderr: ' + stderr);
    if (error !== null) {
      //console.log(logPrefix+'exec error: ' + error);
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
