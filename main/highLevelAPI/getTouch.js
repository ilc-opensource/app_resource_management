var fs = require('fs');
var io = require('./io.js');
var path = require('path');

/*io.mug_touch_on(function(x, y, id) {
  console.log('touch event='+x+','+y+''+id);
  fs.appendFileSync(path.join(__dirname, '../touchEvent.json'), JSON.stringify({'touch':[x, y, id]})+'\n');
});
*/

io.mug_touch_event_on(io.TOUCH_HOLD, function(e, x, y, id) {
/*  var touchEvent = null;
  switch(e) {
    case 1:
      touchEvent = 'TOUCH_CLICK';
      break;
    case 2:
      touchEvent = 'TOUCH_DOWN';
      break;
    case 3:
      touchEvent = 'TOUCH_UP';
      break;
    case 4:
      touchEvent = 'TOUCH_HOLD';
      break;
    default:
      break;
  }*/
  //if (touchEvent != null) {
    //console.log('touch event='+touchEvent+','+x+','+y+','+id);
    fs.appendFileSync(path.join(__dirname, '../touchEvent.json'), JSON.stringify({'touchEvent':[e, x, y, id]})+'\n');
  //}
});

io.mug_touch_event_on(io.TOUCH_CLICK, function(e, x, y, id) {
/*  var touchEvent = null;
  switch(e) {
    case 1:
      touchEvent = 'TOUCH_CLICK';
      break;
    case 2:
      touchEvent = 'TOUCH_DOWN';
      break;
    case 3:
      touchEvent = 'TOUCH_UP';
      break;
    case 4:
      touchEvent = 'TOUCH_HOLD';
      break;
    default:
      break;
  }*/
  //if (touchEvent != null) {
    //console.log('touch event='+touchEvent+','+x+','+y+','+id);
    fs.appendFileSync(path.join(__dirname, '../touchEvent.json'), JSON.stringify({'touchEvent':[e, x, y, id]})+'\n');
  //}
});

io.mug_gesture_on(io.MUG_GESTURE, function(g, info) {
/*
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
      break;
  }
*/
  //if (gesture != null) {
    //console.log('gesture event='+gesture);
    fs.appendFileSync(path.join(__dirname, '../touchEvent.json'), JSON.stringify({'gesture':g})+'\n');
  //}
});

io.mug_run_touch_thread();

