var multer = require('multer');
var config = require('./config.js');
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');

var statTable = {};

var checkType = function(t, types) {
  for(idx in types) {
    if(types[idx] == t)
      return true;
  }
  
  return false;
};

module.exports["delete"] = function(req, res, next) {

  var item = req.param('target');
  if(item == undefined) {
    res.send("please specify delete target, likes delete?target=abc");
    return;
  }

  var sep = item.split("/");
  if(sep[0] == "") {
    sep.splice(0, 1);
  }

  var thisConfig = config["/" + sep[0]];

  if(thisConfig == undefined) {
    res.send('unkown category ' + sep[0]);
    return;
  }

  sep.splice(0, 1, thisConfig.path);
  var target = sep.join('/');
 
  if(!fs.existsSync(target)) {
    res.status(400).send('no such file ' + item);
    return;
  }

  fs.unlink(target, function(err) {
    if(err) {
      res.status(400).send("Error: " + err);
      return;
    }

    res.send("Succcesfully delete " + item);
  })
}

module.exports["query"] = function(req, res, next) {
  var query = req.param('stat');
  if( query == undefined) {
    res.send("Please pass query item, likes ?stat=patch");
    return;
  }

  var stat = statTable[query];

  if(stat == undefined) {
    res.status(400).send("no status of " + query);  
    return;
  }

  res.send(JSON.stringify(stat));
};

module.exports["drink"] = function(req, res, next) {
  var ret = {};

  var query = req.param("query");
  var drinkPath = __dirname + "/../../drink/";

  var configPath = drinkPath + "drink_config.json";

  console.log(configPath);

  var drinkConfFile = fs.readFileSync(configPath);

  if(drinkConfFile == undefined) {
    res.status(400).send("can not find drink config file " + configPath);
    return;
  }

  var drinkConfig = JSON.parse(drinkConfFile);
  var traceFile = drinkConfig["trace"];
  
  if(!traceFile) {
    res.status(400).send("no trace file");
    return;
  }

  var traceFile = drinkPath + traceFile;

  var data;

  try {
    data = fs.readFileSync(traceFile).toString().split('\n');
  } catch(e) {
    res.status(404).send("trace file is not accessible, try again later");
    return;
  }

  var trace = [];

  for (idx in data ) {

    if(data[idx] == "") 
      continue;

    var val = parseInt(data[idx]);
    trace.push(val)
  }

  if(query == "config") {
    res.send(JSON.stringify(drinkConfig));

  } else if(query == "all") {

    ret["query"] = "all";
    ret.data = trace;
    res.send(JSON.stringify(ret));

  } else if(query == "last") {

    ret["query"] = "last";

    if(trace.length == 0) {
      res.status(400).send("no data");
    } else {
      ret["data"] = trace.pop();
      res.send(JSON.stringify(ret));
    }
  } else {
    res.status(400).send("unkown query");
  }

};

module.exports["upload"] = function(req, res, next) {

  console.log(req.path + " => " + JSON.stringify(config[req.path]));
   
  var info = "Failed!";

  var thisConfig = config[req.path];
  if(!thisConfig) {
    next();
    return undefined;
  }
  
  var dest = thisConfig.path;
  var types = thisConfig.types;
  var bin = thisConfig.run;
  var action = thisConfig.action;

  var uploadInfo = {
    "config" : thisConfig
  };

  multer({

    "dest": dest,

    "onError": function(error, next) {

      uploadInfo["error"] = error;
      console.log("http error: " + error);

      statTable[action] = {
        "status" : "Done",
        "info"   : "upload error: " + error
      };
    },

    "onParseStart" : function() {
      console.log("receving...");
    },

    "rename": function(fieldName, fileName) {
      return fileName;
    },

    "onParseEnd": function() {
      console.log('Done');
      console.log(JSON.stringify(uploadInfo));
      uploadInfo["return"] = statTable[action];
      res.render('upload.ejs', { "upload_info" : uploadInfo } );
    },

    "onFileUploadComplete": function(file) {

      var ext = path.extname(file.path);

      if(!checkType(ext, types)) {
        info = ext + " is not supported, only " + JSON.stringify(types) + " is allowed";
        console.log('delete ' + file.path);
        fs.unlinkSync(file.path);

        statTable[action] = {
          "status" : "Done",
          "info"   : "upload cancelled"
        };

      } else {
        uploadInfo["file"] = file;
        console.log('upload ' + file.path);

        statTable[action] = {
          "status" : "Done",
          "info"   : "upload finished"
        };

        if(bin != undefined) {
          var cmd = bin + " " +  file.path;
       
          statTable[action] = {
            "status" : "running cmd",
            "info"   :  cmd
          };

          child_process.execFile(__dirname + "/" + bin, 
                                 [__dirname + "/../" +  file.path], 
                                 {"cwd": __dirname},
                                 function(error, stdout, stderr) {
            var ret = {
              "status" : "Done",
              "info" : "Finished"
            };

            if(error)
              ret["error"] = error;
            else
              ret["error"] = "no error";

            ret["stdout"] = stdout;
            ret["stderr"] = stderr;

            statTable[action] = ret;
 
            console.log("[exec] " + error);
            console.log("[exec] " + stdout);
            console.log("[exec] " + stderr);        

          });
        } 
      }
      
    }

  })(req, res, next);
};
