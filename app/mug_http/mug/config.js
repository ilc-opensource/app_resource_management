module.exports = {

  "/audio" : {
    "types": [".mp3", ".wav"],
    "action": "audio",
    "path": "../../../audio",
    "desc": "Audio Files"
  },

  "/patch" : {
    "types": [".tgz"],
    "action": "patch",
    "path" : "../../../patch",
    "desc" : "Mug Application Patches",
    "run"  : "./install_patch.sh"
  },

  "/mcu" : {
    "types": [".bin"],
    "action": "mcu",
    "path" : "../../../mcu",
    "desc" : "Mug MCU firmware",
    "run"  : "./install_mcu.sh"
  },

};
