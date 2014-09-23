var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

var fs = require('fs');
var path = require('path');
var config = require('./config.js');
var disp = require('./disp.js');
var pop3 = require('./pop3.js');

var emitter = pop3.emitter;

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

emitter.on('error', function(data) {
  console.log(data);
});


emitter.on('stat', function(data) {
  
  console.log('recv: ' + data.count);

  if(data.count < 0) {
    console.log('no valid count');
    return;
  }

  if(countSave == undefined) 
    countSave = data.count;


  if(countSave != data.count) {
    console.log('****** New Mail ******');
    dispEmail();
  } 

  countSave = data.count;

  if(isAnimationDispComplete){
    disp.disp_num(parseInt(countSave));
  }

});

pop3.init();

setInterval(function(){
  pop3.stat();
}, 1000);

// No new email
dispSingle([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,17,17,17,17,1,0,0,17,0,0,0,0,17,0,0,1,0,0,0,0,16,0,0,1,0,0,0,0,16,0,0,1,0,0,0,0,16,0,0,1,0,0,0,0,16,0,0,17,0,0,0,0,17,0,0,16,17,17,17,17,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 1, 50);

setInterval(function(){dispAnimation();}, 100);
