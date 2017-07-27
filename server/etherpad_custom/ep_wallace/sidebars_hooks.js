var eejs = require('../../etherpad/src/node/eejs');
var apiUrl = require(__dirname+"/../../config/settings").apiUrl;

exports.eejsBlock_scripts = function (hook_name, args, cb) {
	args.content += "<script>window.apiUrl = '"+apiUrl+"'</script>";
	args.content += "<script src='../static/plugins/ep_wallace/static/js/modal.js'></script>";
	args.content += eejs.require("ep_wallace/templates/sidebar.html");
  	return cb();
};

exports.eejsBlock_styles = function( hook_name, args, cb ) {
	args.content += "<link href='../static/plugins/ep_wallace/static/css/modal.css' rel='stylesheet'/>";
	return cb();
};

exports.eejsBlock_body = function (hook_name, args, cb) {
	args.content += eejs.require("ep_wallace/templates/modal.ejs");
  	return cb();
};