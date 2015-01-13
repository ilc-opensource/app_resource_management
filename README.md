# App and resource management for smart mug writing in JavaScript
![readme](https://cloud.githubusercontent.com/assets/7992647/5715473/4d5b19a8-9b14-11e4-8983-6a2d555b3750.png)

On the smart mug, there are many Apps running concurrently. This package supports process management, app context switch, device (Display and Touchpanel) management, Job management, notification, and default setting (similar as screen saver).

- Led Screen: Only the main process of the front end app can access led screen and display image, only JPG and BMP files are supported now.
- Touch Panel: Deliver the touch event only to the front end app.
- App Switch: Create a process for each App, different Apps execute on different process not thread, determine which app is the front end app, save and restore context for App switch.
- Notification: 1) Some Apps can register notification, when a new message comes, a notification will be displayed if the App is not the front end app at that time; 2) Signals from linux OS, voice recogonition engine, motion sensor engine and other can trigger notification in order to launch an App immediately.

## Quick Start
1. export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$HOME/app_manager_mug_client/node_modules/node-canvas-lib:$HOME/app_manager_mug_client/main/highLevelAPI/linux-convert
2. node $HOME/app_manager_mug_client/main/main.js

## High leve API Example
### display image
var io = require('../../main/highLevelAPI/io.js');<br>
io.disp_N(['a.png', 'b.png'], 2, 100);

### create an app
var sys = require('../../main/highLevelAPI/sys.js');<br>
sys.newApp('a.js');

### touch event handler
io.touchPanel.on('touchEvent', function(e, x, y, id) {<br>
  console.log(e);<br>
});<br>
io.touchPanel.on('gesture', function(gesture) {<br>
  console.log(gesture);<br>
});

### convert English and Chinese text to images fit to smart mug
io.text2Img(text, color, function(image) {<br>
  var animation = [];<br>
  for (var i=0; i<image.numberOfImg; i++) {<br>
    animation.concat(image['img'+i]);<br>
  }<br>
  io.disp_raw_N(animation, image.numberOfImg, 100);<br>
});

### register notification
sys.registerNotification(icon, app)

For more details, please reference main/highLevelAPI/io.js and main/highLevelAPI/sys.js.
## File
- main: app and resource manager, the mini OS
- app: all Apps running on the smart mug
- config.json: mug configuration
- img2json.js: a tool to convert images to media.json

## Contact
- Chao Zhang (chao.a.zhang@intel.com)

## Copyright and license

[The Apache 2.0 license](LICENSE).
