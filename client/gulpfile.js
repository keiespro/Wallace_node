var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var cssnano = require('gulp-cssnano');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var notify = require('gulp-notify');
var changed = require('gulp-changed');
var livereload = require('gulp-livereload');
var connect = require('gulp-connect');
var watch = require('gulp-watch');
var replace = require('gulp-replace');
var rev = require('gulp-rev-append');
var del = require('del');

// for deploying
var Async = require('async');
var AWS = require('aws-sdk');
var Crypto = require('crypto');
var Fs = require('fs');
var Glob = require('glob');
var Mime = require('mime');
var Path = require('path');

var no_dsstore = '!**/.DS_Store';
var config = {
	environments: {
	    staging: {
	    	clientUrl: 'http://wallace-staging.roamandwander.com',
	    	apiUrl: 'http://wallace-staging-api.roamandwander.com',
	    	etherpadUrl: 'http://wallace-staging-api.roamandwander.com:9001',
	        profile: 'rw',
	        bucket: 'wallace-staging.roamandwander.com'
	    },
	    dev: {
	    	clientUrl: 'http://localhost:8080',
	    	apiUrl: 'http://localhost:3000',
	    	etherpadUrl: 'http://localhost:9001',
	    	profile: null
	    }
	},
	publicRoot: Path.join(__dirname, 'dist'),
	concurrentRequests: 10,
	html: {
		src: ['src/*.html', no_dsstore],
		dest: 'dist'
	},
	html2: {
		src: ['src/**/*.html', no_dsstore],
		dest: 'dist'
	},
	styles: {
		src: ['src/css/**/*.css', no_dsstore],
		dest: 'dist/css'
	},
	vendors: {
		src: ['src/vendors/**/*.css', 'src/vendors/**/*.min.js', no_dsstore],
		dest: 'dist/vendors'
	},
	scripts: {
		src: ['src/js/**/*.js', no_dsstore],
		dest: 'dist/js'
	},
	images: {
		src: ['src/img/**/*', no_dsstore],
		dest: 'dist/img'
	},
};

var deploymentConfig = config.environments.dev;

gulp.task('html', function() {
	gulp.src(config.html.src)
	.pipe(rev())
	.pipe((gulp.dest(config.html.dest)));
	return gulp.src(config.html2.src)
	.pipe(rev())
	.pipe((gulp.dest(config.html2.dest)));
});

gulp.task('styles', function() {
	return gulp.src(config.styles.src)
	.pipe(changed(config.styles.dest))
	.pipe(autoprefixer({
		browsers: ['last 2 versions'],
		cascade: false
	}))
	.pipe(gulp.dest(config.styles.dest))
	.pipe(rename({suffix: '.min'}))
	.pipe(cssnano())
	.pipe(gulp.dest(config.styles.dest));
});

gulp.task('vendors', function() {
	return gulp.src(config.vendors.src)
	.pipe(gulp.dest(config.vendors.dest));
});

gulp.task('scripts', ['setEnv'], function() {
	return gulp.src(config.scripts.src)
	.pipe(changed(config.scripts.dest))
	.pipe(replace(/\$\$API_URL/g, deploymentConfig.apiUrl))
	.pipe(replace(/\$\$ETHERPAD_URL/g, deploymentConfig.etherpadUrl))
	.pipe(jshint('.jshintrc'))
	.pipe(jshint.reporter('default'))
	// .pipe(concat('main.js'))
	.pipe(gulp.dest(config.scripts.dest));
	// .pipe(rename({suffix: '.min'}))
	// .pipe(uglify())
	// .pipe(gulp.dest(config.scripts.src));
});

gulp.task('images', function() {
	return gulp.src(config.images.src)
	.pipe(changed(config.images.dest))
	.pipe((imagemin({ optimizationLevel: 5, progressive: true, interlaced: true })))
	.pipe(gulp.dest(config.images.dest));
});

gulp.task('clean', function(done) {
	del(['dist/**/*']).then(function() {
		done();
	});
});

gulp.task('setEnv', function(done) {
	if (process.argv.indexOf('deploy') != -1) {
		deploymentConfig = config.environments.staging;
	} else {
		deploymentConfig = config.environments.dev;
	}
	done();
});

gulp.task('watch', ['build'], function() {
	gulp.watch(config.html.src, ['html']);
	gulp.watch(config.html2.src, ['html']);
	gulp.watch(config.vendors.src, ['vendors']);
	gulp.watch(config.styles.src, ['styles']);
	gulp.watch(config.scripts.src, ['scripts']);
	gulp.watch(config.images.src, ['images']);
	gulp.src(['dist/**/*', no_dsstore]).pipe(watch(['dist/**/*', no_dsstore])).pipe(connect.reload());
});


gulp.task('webserver', ['build'], function() {
	connect.server({
		livereload: true,
		root: ['dist']
	});
});

gulp.task('build', ['html', 'vendors', 'styles', 'scripts', 'images'], function(done) {
	return done();
});

gulp.task('default', ['webserver', 'watch']);


var credentials, s3;

const status = {
    total: 0,
    uploaded: 0,
    skipped: 0
};

gulp.task('deploy', ['build'], function() {
	credentials = new AWS.SharedIniFileCredentials({ profile: deploymentConfig.profile });
	AWS.config.credentials = credentials;
	s3 = new AWS.S3();
	getFiles()
	    .then(uploadFiles)
	    .then(() => {
	        console.log('\n\nCOMPLETE!');
	    })
	    .catch(err => {
	        console.log('ERROR!');
	        console.log(err.stack);
	    });
});




function printProgress (action, file) {
    process.stdout.clearLine();
    process.stdout.write('\r' +
        status.uploaded + ' uploaded / ' +
        status.skipped + ' skipped / ' +
        status.total + ' total --- ' +
        (((status.uploaded + status.skipped) / status.total) * 100).toFixed(2) +'% complete' +
        ' --- ' + action + ' ' + file);
}

// Prepares a list of files to deploy
function getFiles () {
    return new Promise((resolve, reject) => {
        new Glob('**/*.*', { cwd: config.publicRoot }, (err, files) => {
            if (err) {
                return reject(err);
            }
            files = files.filter(f => !Fs.lstatSync(Path.join(config.publicRoot, f)).isDirectory());
            resolve(files.map(f => {
                const body = Fs.readFileSync(Path.join(config.publicRoot, f));
                return  {
                    body: body,
                    type: Mime.lookup(f),
                    md5: Crypto.createHash('md5').update(body).digest('hex'),
                    path: Path.parse(f)
                };
            }));
        });
    });
}

function checkIfUploadRequired (file, callback) {
    const key = Path.join(file.path.dir, file.path.base).replace(/\\/g,'/');

    s3.headObject({
        Bucket: deploymentConfig.bucket,
        Key: key
    }, (err, data) => {

        if (err) {
            if (err.code === 'NotFound') {
                return callback(null, true);
            }
            return callback(err);
        }

        // Skip file if not changed
        if (data.Metadata['content-md5'] === file.md5) {
            return callback(null, false);
        }
        callback(null, true);
    });
}

function uploadFile (file, callback) {
    const key = Path.join(file.path.dir, file.path.base).replace(/\\/g,'/');

    const params = {
        Bucket: deploymentConfig.bucket,
        Key: key,
        ACL: 'public-read',
        Body: file.body,
        ContentType: file.type,
        Metadata: {
            'Content-MD5': file.md5
        }
    };

    s3.putObject(params, (err, data) => {
        if (err) {
            return callback(err);
        }

        status.uploaded++;
        printProgress('Uploaded', file.path.dir + '/' + file.path.base);
        callback(null);
    });
}

// Uploads files if they need to be
function uploadFiles (files) {
    status.total = files.length;

    const processFile =  (file, callback) => {
        checkIfUploadRequired(file, (err, required) => {
            if (err) {
                return callback(err);
            }

            if (required) {
                return uploadFile(file, callback);
            }

            status.skipped++;
            printProgress('Skipped', file.path.dir + '/' + file.path.base);
            return callback();
        });
    };

    return new Promise((resolve, reject) => {
        Async.eachLimit(files, config.concurrentRequests, processFile, err => {
            if (err) {
                return reject(err);
            }
            console.log('\n');
            resolve();
        });
    });
}