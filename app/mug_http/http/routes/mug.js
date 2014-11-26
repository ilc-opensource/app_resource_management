var multer = require('multer');

module.exports = function(req, res, next) {

  console.log(req.path);
 
  var recv = undefined;

  multer({

    dest: './uploads/',

    onError: function(error, next) {
      res.send(error);
    },

    rename: function(fieldName, fileName) {
      return fileName;
    },

    onParseEnd: function() {
      res.send(JSON.stringify(recv));
    },

    onFileUploadComplete: function(file) {
      recv = file;
    }

  })(req, res, next);

};

