var escapeApp = function(){
  process.send({'escape':true});
};


module.exports = escapeApp;
