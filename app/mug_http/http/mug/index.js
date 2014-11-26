var multer = require('multer');
var config = require('./config.js');
var path = require('path');
var fs = require('fs');

var checkType = function(t, types) {
  for(idx in types) {
    if(types[idx] == t)
      return true;
  }
  
  return false;
};


module.exports = function(req, res, next) {

  console.log(req.path + " => " + JSON.stringify(config[req.path]));
   
  var info = "Failed!";

  if(!config[req.path]) {
    next();
    return undefined;
  }
  
  var dest = config[req.path].path;
  var types = config[req.path].types;

  multer({

    "dest": dest,

    "onError": function(error, next) {
      res.send(info + " " + error);
    },

    "onParseStart" : function() {
      console.log("parsing...");
    },

    "rename": function(fieldName, fileName) {
      return fileName;
    },

    "onParseEnd": function(req, res, next) {
      console.log('End');
      res.send(info);
    },

    "onFileUploadComplete": function(file) {

      var ext = path.extname(file.path);

      if(!checkType(ext, types)) {
        info = ext + " is not supported, only " + JSON.stringify(types) + " is allowed";
        console.log('delete ' + file.path);
        fs.unlinkSync(file.path);
      } else {
        info = "OK! " + file.path;
      }
    }

  })(req, res, next);
};
