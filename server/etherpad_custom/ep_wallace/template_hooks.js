var eejs = require('../../etherpad/src/node/eejs');
var glob = require('glob');
var fs = require( 'fs' );
var minify = require('html-minifier').minify;

var templatesDir = __dirname + "/../../paper_templates/";

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content = args.content + "<script src='../static/plugins/ep_wallace/static/js/editor_api.js'></script>";
  args.content = args.content + "<script src='../static/plugins/ep_wallace/static/js/lib/ejs.min.js'></script>";
  args.content = args.content + fs.readFileSync(__dirname+"/templates/wizard.html").toString();
  return cb();
};

exports.expressCreateServer = function() {
	// save html files into settings.templates
	glob('*', { cwd: templatesDir }, function(error, folders) {
		folders.forEach(function(folder) {
			var folderPath = templatesDir+folder+'/';
			var settings = require(folderPath+'settings.js').settings;
			settings.templates = {};
			var files = glob.sync('*.@(html|ejs)', { cwd: folderPath });
			files.forEach(function(file) {
				settings.templates[file] = minify(fs.readFileSync(folderPath+file).toString(), {collapseWhitespace: true});
			});
			fs.writeFileSync(folderPath+'settings.js', 'exports.settings = '+JSON.stringify(settings, null, 4));
		});
	});
};