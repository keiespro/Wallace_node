module.exports = function(shipit) {
	require('shipit-deploy')(shipit);

	shipit.initConfig({
		default: {
			workspace: './tmp/',
			deployTo: '/srv/wallace',
			repositoryUrl: 'git@github.com:roamandwander/wallace-server.git',
			ignores: ['.git', 'node_modules'],
			keepReleases: 2,
			deleteOnRollback: false,
			branch: 'master'
		},
		staging: {
			servers: 'ec2-user@wallace-staging'
		}
	});

	var currentDir = 'cd /srv/wallace/current';
	var copies = [
		{ rm: 'node_modules', from: '/srv/wallace/shared/node_modules', to: './' },
		{ rm: 'etherpad/node_modules', from: '/srv/wallace/shared/etherpad/node_modules', to: 'etherpad' },
		{ rm: 'etherpad/src/node_modules', from: '/srv/wallace/shared/etherpad/src/node_modules', to: 'etherpad/src' }
	];
	var symlinks = [
		{ rm: 'etherpad/APIKEY.txt',  from: '/srv/wallace/shared/etherpad/APIKEY.txt', to: 'etherpad/APIKEY.txt' },
		{ rm: 'config', from: '/srv/wallace/shared/config', to: 'config' },
		{ rm: 'etherpad/src/static/custom', from: '/srv/wallace/current/etherpad_custom/src/static/custom', to: 'etherpad/src/static/custom' },
		{ rm: 'etherpad/src/static/images', from: '/srv/wallace/shared/etherpad/src/static/images', to: 'etherpad/src/static/images' },
		{ rm: 'etherpad/node_modules/ep_wallace', from: '/srv/wallace/current/etherpad_custom/ep_wallace', to: 'etherpad/node_modules/ep_wallace' },
		{ rm: 'etherpad/node_modules/ep_font_size', from: '/srv/wallace/current/etherpad_custom/ep_font_size', to: 'etherpad/node_modules/ep_font_size' },
	];

	shipit.on('deployed', function() {
		copies.forEach(function(copy) {
			shipit.remote(currentDir+' && rm -rf '+copy.rm+' && cp -Rf '+copy.from+' '+copy.to);			
		});
		
		symlinks.forEach(function(symlink) {
			shipit.remote(currentDir+' && rm -rf '+symlink.rm+' && ln -sfn '+symlink.from+' '+symlink.to);			
		});		
		

		shipit.remote(currentDir+' && pm2 delete all');
		shipit.remote(currentDir+' && sequelize db:migrate --config ./config/database.json');
		shipit.remote(currentDir+' && DEBUG=server,etherpad BLUEBIRD_WARNINGS=0 pm2 start etherpad/bin/run.sh --name "etherpad" -- -s ../config/etherpad-settings.json ');
		shipit.remote(currentDir+' && DEBUG=server,etherpad BLUEBIRD_WARNINGS=0 pm2 start  --name "api" server.js');
	});
};
