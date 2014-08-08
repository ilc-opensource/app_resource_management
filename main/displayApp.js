var fs = require('fs');
var process = require('process');


function disp_app() {
  fs.readFile('installedApp.json', 'utf8', function (err, data){
    if (err) throw err;
    var msg=JSON.parse(data);
    var imageName = {};
    for (var i in msg) {
      if (msg[i].name && msg[i].icon) {
        imageName.push('..\/app\/'+msg[i].name+'\/'+msg[i].icon);
      }
    }
    while(true) {
      for (var i=0; i<imageName.length; i++) {
        io.mug_disp_img(handle, imageName[i]);
        usleep(100 * 1000);
      }
    }
  });
}

// Update installed app list
fs.watch('installedApp.json', function(e, filename) {
  disp_app();
});


disp_app();
