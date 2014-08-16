var fs = require('fs');
var path = require('path');

var io = require('../../main/highLevelAPI/io.js');
var sys = require('../../main/highLevelAPI/sys.js');

function notification() {
  var w = JSON.parse(fs.readFileSync(path.join(__dirname, 'notification.json'), 'utf8'));
  io.disp_raw_N(w.image, w.numberOfImg, 200);
  sys.exit();
}

notification();

io.touchPanel.on('touch', function(x, y, id) {
  var nextApp = path.join(__dirname, 'app.js');
  // Notify main app to create a new app
  console.log(logPrefix+"Launch a new app"+nextApp);
  //process.send({'newApp': nextApp});
  sys.newApp(nextApp);
});
