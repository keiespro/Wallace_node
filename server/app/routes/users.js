var models = require('../models');
var User = models.User;
var express = require('express');
var passport = require('passport');
var router = express.Router();

router.post('/sign_up', function(req, res, next) {
	req.body.email = req.body.email.toLowerCase();
	var newUser = {
		fullName: req.body.fullName,
		email: req.body.email,
		password: req.body.password,
		isVerified: 0
	};
	var completeSignUp = function() {
		User.create(newUser).then(function(user) {
			if (user.isVerified) {
				req.logIn(user, function(err) {
					if (err) {
						return next(err);
					}
					req.session.cookie.maxAge = 3600000*24*365; //1 year
					res.json({message: 'success', user: user.returnSafeValue()});
				});
			} else {
				res.json({message: 'success', user: user.returnSafeValue() });
			}
		}).catch(function(error) {
			next(error);
		});
	};
	if (req.body.acceptShareToken) {
		models.Share.find({ where: { token: req.body.acceptShareToken }}).then(function(result) {
			if (result && result.toEmail == newUser.email)  {
				newUser.isVerified = 1;
			}
			completeSignUp();
		});
	} else {
		completeSignUp();
	}
});

router.post('/sign_in', function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err) {
			return next(err);
		}
		if (!user) {
			return next({message: 'Invalid credentials'});
		}
		if ( user.isVerified !== 1 ) {
			return next({message: 'User Not Verified'});
		}
		req.logIn(user, function(err) {
			if (err) {
				return next(err);
			}
			req.session.cookie.maxAge = 3600000*24*365; //1 year
			res.json({message: 'success', user: user.returnSafeValue()});
		});

	})(req, res, next);
});

router.get('/sign_out', function(req, res, next) {
	req.logout();
	res.json({message: 'success'});
});

router.get('/auth_check', function(req, res, next) {
	if (req.isAuthenticated()) {
		res.json({message: 'success', user: req.user.returnSafeValue()});
	} else {
		res.json({error: 'not authenticated'}); 
	}
});

router.post('/verify_account', function(req, res, next) {
	var token = req.body.token;
	User.find({
		where: {
			resetToken: token,
			resetTokenExpires: { $gt: new Date() },
			isVerified: {$ne: 1}
		}
	}).then(function(user) {
		if (user) {
			user.setVerified();
			req.login(user, function(err) {
			  if (err) { return next(err); }
			  req.session.cookie.maxAge = 3600000*24*365; //1 year
			  res.json({message: 'success', user: user.returnSafeValue()});
			});
		} else {
			next('User not found');
		}
	});
});

router.post('/reset_password', function(req, res, next) {
	var email = req.body.email;
	User.find({
		where: {
			email: email
		}
	}).then(function(user) {
		if (user) {
			user.resetPassword();
			res.json({message: 'success'});
		} else {
			next({message: 'Email address not found'});
		}
	});
});

router.post('/set_password', function(req, res, next) {
	var token = req.body.token;
	var password = req.body.password;
	User.find({
		where: {
			resetToken: token,
			resetTokenExpires: { $gt: new Date() }
		}
	}).then(function(user) {
		if (user) {
			user.setPassword(password, function() {
				req.login(user, function(err) {
					if (err) { return next(err); }
					req.session.cookie.maxAge = 3600000*24*365; //1 year
					res.json({message: 'success', user: user.returnSafeValue()});
				});
			});
		} else {
			next({message: 'Email address not found'});
		}
	});
});

router.get('/', function(req, res) {
	res.json("Hello!");
});

module.exports = router;