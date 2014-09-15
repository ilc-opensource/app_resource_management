var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var fs = require('fs');
var path = require('path');
var notify = require('./pop3.js').notify;
var config = require('./config.js');
var disp = require('./disp.js');

// Animation display begin
var isAnimationDispComplete = true;
var isPreviousImageDisComplete = true;
var imageIter = -1;
var imgs = null;
function dispEmail() {
  if (!isAnimationDispComplete) {return;}
  isAnimationDispComplete = false;
  isPreviousImageDisComplete = true;
  imageIter = -1;
  var w = fs.readFileSync(path.join(__dirname, './newEmail.json'), 'utf8');
//  console.log(logPrefix+'w='+w);
  if (w == '' || w == '\n') {
    var w = fs.readFileSync(path.join(__dirname, './media.json'), 'utf8');
    imgs = JSON.parse(w);
  } else {
    //console.log(logPrefix+'weChat file exist');
    try {
    imgs = JSON.parse(w);
    } catch(ex) {
      imgs = null;
      isAnimationDispComplete = true;
      isPreviousImageDisComplete = false;
    }
  }
}
function dispAnimation() {
  if (imgs == null || !isPreviousImageDisComplete) {return;}
  isPreviousImageDisComplete = false;
  imageIter++;
  if (imageIter>=imgs.numberOfImg) {
    isAnimationDispComplete = true; 
	disp.disp_num(parseInt(countSave));
    return;
  }
  dispSingle(imgs['img'+imageIter], 1, 50);
  isPreviousImageDisComplete = true;
}
function dispSingle(data, number, interval) {
  io.disp_raw_N(data, number, interval);
}
// Animation display End

var countSave = undefined;
var statCallback = function(err, data) {
  if(err) 
    console.log('ERROR');

  console.log(data);
 
  if(countSave == undefined) {
    countSave = data.count
	disp.disp_num(parseInt(countSave));
  }
  
  if(countSave != data.count) {
    console.log("***** New Mail Arrivaled *****");
    countSave = data.count;
    // display new email 
    dispEmail();
  }
  runNotify();
};

var runNotify = function(){
  setTimeout(function(){
    notify({
      'stat' : statCallback
    });
  }, config.delay);   
};

disp.disp_num(0);

runNotify();

// No new email
dispSingle([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,17,17,17,17,1,0,0,17,0,0,0,0,17,0,0,1,0,0,0,0,16,0,0,1,0,0,0,0,16,0,0,1,0,0,0,0,16,0,0,1,0,0,0,0,16,0,0,17,0,0,0,0,17,0,0,16,17,17,17,17,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 1, 50);
setInterval(function(){dispAnimation();}, 100);
