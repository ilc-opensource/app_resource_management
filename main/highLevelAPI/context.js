context = {}; //{app:, lastImg: }
// when launch a app, pass the app name as the first parameter, correspond to app.js
context.app = process.argv[2];

module.exports = context;
