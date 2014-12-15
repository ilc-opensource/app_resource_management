/* Display animation, when the whole animation is displayed, an event will be emitted to notify the caller
 * The animation will be displayed until new animation comes
 */
var fs = require('fs');
var path = require('path');
var io = require('../../main/highLevelAPI/io.js');

/*
 * 
 */
var disp = function(data, interval, isAtomic, dispWhole, e, start) {
  //content = {'data':data, 'interval':interval, 'isAtomic':isAtomic, 'dispWhole':dispWhole, 'e':e};
  contentBuffer.unshift({'data':data, 'interval':interval, 'isAtomic':isAtomic, 'dispWhole':dispWhole, 'e':e, 'start':start});
};

var timeOut = null;
var dispAnimation_timeout_1 = null;
var dispAnimation_timeout_2 = null;
var dispAnimation_timeout_3 = null;
var dispAnimation_timeout_4 = null;

var contentBuffer = [];
var count = -1;
var content = null;
var currentDispContent = null;

var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
var isFirstEnter = false;

var intervalFindNextAnimation = 100;
var intervalFindNextImage = 50;

// Deal with isAtomic==false && dispWhole==false
var timeout = null;
var emitFinishEvent = function() {
  if (typeof currentDispContent.e != undefined) {
    currentDispContent.e.emit('finish', count);
  }
  timeout = setTimeout(emitFinishEvent, 100);
};

var display = function() {
  if (!isAnimationDispComplete || (contentBuffer.length == 0 && currentDispContent == null)) {
    setTimeout(display, intervalFindNextAnimation);
    return;
  }
  isAnimationDispComplete = false;
  // One optimization. Animation is displayed once, and
  // there is no new content and
  // the animation is only one image, don't need to refresh it
  if (currentDispContent != null &&
    contentBuffer.length == 0 &&
    JSON.parse(currentDispContent.data).numberOfImg == 1) {
    isAnimationDispComplete = true;
    if (typeof currentDispContent.e != undefined) {
      currentDispContent.e.emit('finish', count);
    }
    setTimeout(display, intervalFindNextAnimation);
    return;
  }
  //Set interval when new animation comes, to main the previous animation
  /*if (currentDispContent != content && isFirstEnter) {
    setTimeout(display, 10000);
    isAnimationDispComplete = true;
    isFirstEnter = false;
    return;
    //currentDispContent = content;
  }
  isFirstEnter = true;
  */
  // No content or no new content, display nothing
  try {
    if (contentBuffer.length != 0) {
      currentDispContent = contentBuffer.pop();
      count++;
    }
    if (currentDispContent != null &&
      currentDispContent.isAtomic == false &&
      currentDispContent.dispWhole == false) {
      emitFinishEvent();
    } else if (timeout != null) {
      //console.log('');
      clearTimeout(timeout);
      timeout = null;
    }
//    content = null;
    // Add atomic support at this point
    if (currentDispContent.isAtomic) {
      var imageData = JSON.parse(currentDispContent.data);
      var animation = [];
      for (var i=0; i<imageData.numberOfImg; i++) {
        animation.concat(imageData['img'+i]);
      }
      io.disp_raw_N(animation, imageData.numberOfImg, currentDispContent.interval);
      isAnimationDispComplete = true;
      if (typeof currentDispContent.e != undefined) {
        currentDispContent.e.emit('finish', count);
      }
      setTimeout(display, intervalFindNextAnimation);
    } else {
      imgs = JSON.parse(currentDispContent.data);
      imageIter = (typeof currentDispContent.start == 'undefined')?-1:(currentDispContent.start-1);
      delete currentDispContent.start;
      isPreviousImageDisComplete = true;
      setTimeout(display, intervalFindNextAnimation);
    }
    return;
  } catch(ex) {
    console.log('exception:'+ex);
    isAnimationDispComplete = true;
    if (typeof currentDispContent.e != undefined) {
      currentDispContent.e.emit('finish', count);
    }
    setTimeout(display, intervalFindNextAnimation);
    return;
  }
}

var dispAnimation = function() {
  if (!isPreviousImageDisComplete || currentDispContent == null) {
    dispAnimation_timeout_1 = setTimeout(dispAnimation, intervalFindNextImage);
    return;
  }
  isPreviousImageDisComplete = false;
  imageIter++;
  //if (content != null && currentDispContent != content && !currentDispContent.dispWhole) { // Terminate loading animation immediately
  if (contentBuffer.length != 0 && currentDispContent != null && !currentDispContent.dispWhole) { // Terminate loading animation immediately
    isAnimationDispComplete = true;
    if (typeof currentDispContent.e != undefined) {
      currentDispContent.e.emit('finish', count);
    }
    dispAnimation_timeout_2 = setTimeout(dispAnimation, intervalFindNextImage);
    return;
  }
  if (currentDispContent != null && imageIter>=imgs.numberOfImg) {
    isAnimationDispComplete = true;
    if (typeof currentDispContent.e != undefined) {
      currentDispContent.e.emit('finish', count);
    }
    dispAnimation_timeout_3 = setTimeout(dispAnimation, intervalFindNextImage);
    return;
  }
  if (currentDispContent != null &&
    //currentDispContent != content &&
    contentBuffer.length != 0 &&
    imgs.textEnd != undefined) {
    for (var i=0; i<imgs.textEnd.length; i++) {
      if ((imageIter-1) == imgs.textEnd[i]) {
        isAnimationDispComplete = true;
        if (typeof currentDispContent.e != undefined) {
          currentDispContent.e.emit('finish', count);
        }
        dispAnimation_timeout_4 = setTimeout(dispAnimation, intervalFindNextImage);
        return;
      }
    }
  }

  var timer = (new Date()).getTime();

  //console.log('imageIter='imageIterimageIter);

  io.disp_raw_N(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;

  if (((new Date()).getTime()-timer)>500) {
    if (timeOut != null) {
      clearTimeout(timeOut);
      timeOut = null;
      clearTimeout(dispAnimation_timeout_1);
      dispAnimation_timeout_1 = null;
      clearTimeout(dispAnimation_timeout_2);
      dispAnimation_timeout_2 = null;
      clearTimeout(dispAnimation_timeout_3);
      dispAnimation_timeout_3 = null;
      clearTimeout(dispAnimation_timeout_4);
      dispAnimation_timeout_4 = null;
    }
    dispAnimation();
  } else {
    timeOut = setTimeout(dispAnimation, currentDispContent.interval);
  }

  //setTimeout(dispAnimation, currentDispContent.interval);
}

display();
dispAnimation();

var LedDisp = {};
LedDisp.disp = disp;
LedDisp.forceTerminate = function (){
  if (currentDispContent == null || (currentDispContent != null &&
    currentDispContent.isAtomic == false)) {
    var ret = {'data':currentDispContent.data, 'interval':currentDispContent.interval, 'isAtomic':currentDispContent.isAtomic, 'dispWhole':currentDispContent.dispWhole, 'e':currentDispContent.e, 'start':imageIter};
    currentDispContent.dispWhole = false;
    return ret;
  }
  return null;
};

module.exports = LedDisp;
