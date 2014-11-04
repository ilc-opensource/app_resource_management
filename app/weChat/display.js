var fs = require('fs');
var path = require('path');
var io = require('../../main/highLevelAPI/io.js');

var logPrefix = '[display] ';

// Display content less or equal to once
var disp = function(data, interval, isAtomic, dispWhole, e) {
  content = {'data':data, 'interval':interval, 'isAtomic':isAtomic, 'dispWhole':dispWhole, 'e':e};
};

content = null;
currentDispContent = null;

isAnimationDispComplete = true;
isPreviousImageDisComplete = true;
imageIter = -1;
imgs = null;

var display = function() {
  //console.log('in display');
  if (!isAnimationDispComplete || content == null) {
    setTimeout(display, 500);
    return;
  }
  isAnimationDispComplete = false;
  // Animation is displayed, and
  // there is no new content and
  // the animation is only one image, don't need to refresh it
  if (currentDispContent != null &&
    currentDispContent == content &&
    JSON.parse(currentDispContent.data).numberOfImg == 1) {
    isAnimationDispComplete = true;
    setTimeout(display, 500);
    return;
  }
  // No content or no new content, display nothing
  try {
    currentDispContent = content;
//    content = null;
    //console.log('animation is ready!')
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
        currentDispContent.e.emit('finish');
      }
      setTimeout(display, 500);
    } else {
      imgs = JSON.parse(currentDispContent.data);
      imageIter = (typeof currentDispContent.start == 'undefined')?-1:(currentDispContent.start-1);
      isPreviousImageDisComplete = true;
      setTimeout(display, 500);
    }
    return;
  } catch(ex) {
    isAnimationDispComplete = true;
    setTimeout(display, 500);
    return;
  }
}

var dispAnimation = function() {
//  console.log('in dispAnimation');
  if (!isPreviousImageDisComplete || currentDispContent == null) {
    setTimeout(dispAnimation, 50);
    return;
  }
  isPreviousImageDisComplete = false;
  imageIter++;
  if (content != null && currentDispContent != content && !currentDispContent.dispWhole) { // Terminate loading animation immediately
    isAnimationDispComplete = true;
    if (typeof currentDispContent.e != undefined) {
      currentDispContent.e.emit('finish');
    }
    setTimeout(dispAnimation, 50);
    return;
  }
  if (currentDispContent != null && imageIter>=imgs.numberOfImg) {
    isAnimationDispComplete = true;
    if (typeof currentDispContent.e != undefined) {
      currentDispContent.e.emit('finish');
    }
    setTimeout(dispAnimation, 50);
    return;
  }
  if (currentDispContent != null &&
    currentDispContent != content &&
    imgs.textEnd != undefined) {
    for (var i=0; i<imgs.textEnd.length; i++) {
      if ((imageIter-1) == imgs.textEnd[i]) {
        isAnimationDispComplete = true;
        if (typeof currentDispContent.e != undefined) {
          currentDispContent.e.emit('finish');
        }
        setTimeout(dispAnimation, 50);
        return;
      }
    }
  }
  io.disp_raw_N(imgs['img'+imageIter], 1, 0);
  isPreviousImageDisComplete = true;
  setTimeout(dispAnimation, currentDispContent.interval);
}

display();
dispAnimation();

module.exports = disp;
