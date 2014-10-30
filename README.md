# Resource management
Resource management for multi-apps running at the same time, mainly focus on Led screen, touch panel, and app switch.
- Led Screen: Only the main process of the front end app can access led screen and display image, only PNG and JPG file is supported.
- Touch Panel: Only the front end app can receive touch event.
- App Switch: Determine which app is the front end app.

## Assumptions
- Different apps execute on different process not thread

## Example
### display image
var io = require('../../main/highLevelAPI/io.js');<br>
io.disp_N([a.png, b.png], 2, 100);
### create an app
var sys = require('../../main/highLevelAPI/sys.js');<br>
sys.newApp('a.js');
### touch event handler
io.touchPanel.on('touchEvent', function(e, x, y, id) {<br>
});<br>
io.touchPanel.on('gesture', function(gesture) {<br>
});


main: APP manager, the mini OS
app: all installed app
config.json: mug configuration
img2json.js: a tool to convert images to media.json

When smart mug startup, run 'node main/main.js' automatically
