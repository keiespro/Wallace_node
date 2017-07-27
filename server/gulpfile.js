var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var fs = require('fs');
var del = require('del');

gulp.task('start-wallace', ['start-etherpad'], function() {
	nodemon({
		script: 'server.js',
		watch: 'app',
		ext: 'js html',
		env: {
			'NODE_ENV': 'development'
		}
	});
});

var options = {
	etherpadPlugins: ['ep_align', 'ep_disable_change_author_name', 'ep_thumbnails@1.0.0'],
	symlinks: [
		{ rm: 'etherpad/src/static/custom', from: 'etherpad_custom/src/static/custom', to: 'etherpad/src/static/custom' },
		{ rm: 'etherpad/node_modules/ep_wallace', from: 'etherpad_custom/ep_wallace', to: 'etherpad/node_modules/ep_wallace' },
		{ rm: 'etherpad/node_modules/ep_font_size', from: 'etherpad_custom/ep_font_size', to: 'etherpad/node_modules/ep_font_size' },
	]
};

gulp.task('start-etherpad', function(done) {
	var debugEP = require('debug')('etherpad');
	var spawn = require('child_process').spawn;

	// start with sym links
	customSymlinks();
	
	function checkPlugins() {
		debugEP('Checking for required Etherpad plugins');
		var pluginCheck = spawn('npm', [ 'list', '--json=true', '--loglevel=error' ].concat(options.etherpadPlugins), { cwd: 'etherpad'});
		pluginCheck.stdout.on('data', function(data) {
			var result = JSON.parse(data.toString());
			if (!result || !result.dependencies) {
				debugEP('No installed plugins found');
				return installPlugins();
			}
			for (var i = 0; i < options.etherpadPlugins.length; i++) {
				var plugin = options.etherpadPlugins[i];
				var sections = plugin.split("@");
				var name = sections[0];
				var version = sections[1] || false;
				var installed = false;
				for (var installedPlugin in result.dependencies) {
					if (installedPlugin === name &&
						(version === false || version === result.dependencies[installedPlugin].version)
					) {
						debugEP('Found: '+name+'@'+result.dependencies[installedPlugin].version);
						installed = true;
						break;
					}
				}
				if (!installed) {
					debugEP('Not found: '+name);
					return installPlugins();
				}
			}
			debugEP('All Etherpad plugins successfully found');
			startEtherpad();
		});
	}

	function installPlugins() {
		debugEP('Installing etherpad plugins');
		var pluginInstall = spawn('npm', [ 'install', '--loglevel=error' ].concat(options.etherpadPlugins), { cwd: 'etherpad'});
		pluginInstall.stdout.on('data', logData);
		pluginInstall.stderr.on('data', logData);
		pluginInstall.on('exit', function (code) {
			if (code === 0) {
				debugEP('Etherpad plugins successfully installed');
				startEtherpad();
			} else {
				debugEP('Required etherpad plugins failed to install');
			}
		});
	}

	function customSymlinks() {
		debugEP('Creating symbolic links for custom integrations');
		options.symlinks.forEach(function(symlink) {
			del.sync(__dirname+'/'+symlink.rm);
			fs.symlinkSync(__dirname+'/'+symlink.from, __dirname+'/'+symlink.to);
		});
		checkPlugins();
	}

	function startEtherpad() {
		debugEP('Starting Etherpad server');
		var run = spawn('./etherpad/bin/run.sh', ['-s', '../config/etherpad-settings.json']);
		run.stdout.on('data', logData);
		run.stderr.on('data', logData);
		run.on('exit', function (code) {
			debugEP('Etherpad process exited with code ' + code);
		});
	}

	function logData(data) {
		var lines = data.toString().split(/(\r?\n)/g);
		for (var i=0; i<lines.length; i++) {
			lines[i] = lines[i].replace(/(\r?\n)/g, '');
			if (lines[i]) { debugEP(lines[i]); }
			if (lines[i].indexOf('You can access your Etherpad instance at') !== -1) {
				debugEP('Etherpad server is started and ready for use');
				done();
			}
		}
	}
});

gulp.task('start', ['start-etherpad', 'start-wallace']);
gulp.task('default', ['start']);
