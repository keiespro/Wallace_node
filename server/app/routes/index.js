var fs = require("fs");
var path = require("path");

module.exports = function(app) {
	// load all routes in '/routes/*.js'
	fs.readdirSync(__dirname).filter(function(file) {
		return (file.indexOf(".") !== 0) && (file !== "index.js");
	}).forEach(function(file) {
		app.use('/', require('./'+file));
	});
};
