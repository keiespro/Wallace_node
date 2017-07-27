var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var router = require('./routes');
var setupPassport = require('./setup_passport');
var settings = require('../config/settings.json');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var app = express();


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Credentials", true);
  var allowedOrigins = [settings.allowOrigin, settings.etherpadUrl];
  var origin = req.headers.origin;
  if (allowedOrigins.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(session({ 
	secret: 'fkh3498g39re7y',
	name: 'wallace',
    store: new RedisStore(settings.redis),
    resave: false,
    saveUninitialized: false
}));

setupPassport(app);
router(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use(function(err, req, res, next) {
	res.status(err.status || 400);
	res.json({
		error: err.message || err,
		errors: err.errors,
		details: (app.get('env') === 'development') ? err : {}
	});
});

module.exports = app;