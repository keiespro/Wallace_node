var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var models = require('./models');

module.exports = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy({
    	usernameField: 'email',
    	passwordField: 'password',
    	passReqToCallback: true
  	},
  	function(req, email, password, done) {
  		models.User.find({
  			where: {
  				'email': email
  			}
  		}).then(function(user) {
  			if (!user) {
  				return done(null, false, {
  					message: 'Incorrect credentials.'
  				});
  			}

  			var hashedPassword = bcrypt.hashSync(password, user.salt);

  			if (user.password === hashedPassword) {
  				req.session.cookie.maxAge = 3600000*24*365; //1 year
  				return done(null, user);
  			}

  			return done(null, false, {
  				message: 'Incorrect credentials.'
  			});
  		});
  	}
  ));

  passport.serializeUser(function(user, done) {
  	if (!user || !user.id) {
  		done(true);
  	} else {
  		done(null, user.id);
  	}
  });

  passport.deserializeUser(function(id, done) {
  	models.User.find({
  		where: {
  			'id': id
  		}
  	}).then(function(user) {
  		if (!user) {
  			return done(null, false);
  		}
  		return done(null, user);
  	});
  });
};