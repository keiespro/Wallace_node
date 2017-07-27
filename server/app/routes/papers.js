var models = require('../models');
var Paper = models.Paper;
var Share = models.Share;
var User = models.User;
var express = require('express');
var router = express.Router();

var multer  = require('multer');
var upload = multer().single('document');

router.get('/papers', function(req, res, next) {
	var createdPapers = req.user.getCreatedPapers({order: 'updatedAt DESC'});
	var sharedPapers = req.user.getPapers({ where: { creatorId: { $ne: req.user.id } }, order: 'updatedAt DESC'});
	models.sequelize.Promise.all([createdPapers, sharedPapers]).then(function(results) {
		res.json({message: 'success', yourPapers: results[0], sharedPapers: results[1]});
	});
});

router.post('/papers/create', function(req, res, next) {
	var newPaper = {
		title: req.body.title,
		type: req.body.type,
		creatorId: req.user.id
	};
	Paper.create(newPaper).then(function(paper) {
		paper.setUsers([req.user.id]);
		res.json({message: 'success', paperId: paper.id});
	}).catch(function(error) {
		next(error);
	});
});

router.post('/papers/delete/:id', function(req, res, next) {
	Paper.delete(req.params.id, req.user).then(function(result) {
		if (!result) {
			return next(result);
		}
		res.json({message: 'success'});
	});
});

router.post('/papers/title/:id', function(req, res, next) {
	Paper.setTitle(req.params.id, req.body.title, req.user).then(function(result) {
		if (!result) {
			return next(result);
		}
		res.json({message: 'success'});
	});
});

router.post('/papers/import/:id', function(req, res, next) {
	upload(req, res, function(err) {
		if (err) {
			return next(err);
		}
		Paper.import(req.params.id, req.user, req.file.buffer).then(function(result) {
			res.json(result);
		});
	});
});


router.get('/papers/:id', function(req, res, next) {
	var paperId = req.params.id;
	var currentSessionIDs = req.cookies.sessionID ? req.cookies.sessionID.split(',') : [];
	Paper.getEmbedUrl(paperId, req.user).then(function(result) {
		if (currentSessionIDs.indexOf(result.sessionID) === -1) {
			currentSessionIDs.push(result.sessionID);
		}
		res.cookie('sessionID', currentSessionIDs.join(','), { expires: new Date(Date.now() + 365*24*60*60*1000) }); // 1 year
		res.json({ message: "success", url: result.url, title: result.paper.title });
	}).catch(function(e) {
		console.log(e);
	});
});

router.get('/papers/getInfo/:etherpadPadId', function(req, res, next) {
	var etherpadPadId = req.params.etherpadPadId;
	Paper.getInfo(etherpadPadId, req.user).then(function(results) {
		res.json({ message: "success", users: results.users, paperId: results.id });
	}).catch(function(e) {
		console.log(e);
	});
});

router.post('/papers/share/:id', function(req, res, next) {
	var email = req.body.email;
	Paper.share(req.params.id, email, req.user).then(function() {
		res.json({ message: "success" });
	}).catch(function(error) {
		next(error);
	});
});

router.post('/papers/accept/:token', function(req, res, next) {
	Share.find({ where: { 'token': req.params.token }, include: [{model: Paper, as: 'Paper'}] }).then(function(share) {
		if (!share) {
			next("Invalid link");
		} else if (req.user) {
			if (req.user.email == share.toEmail) {
				share.acceptAs(req.user).then(function() {
					res.json({ message: "access", paperId: share.Paper.id });
				});
			} else {
				next("Not logged in with same email address that link was sent to");
			}
		} else {
			User.find({ where: { email: share.toEmail }}).then(function(user) {
				if (!user) {
					res.json({ message: "redirect", redirect: 'user-sign-up', email: share.toEmail });
				} else {
					res.json({ message: "redirect", redirect: 'user-sign-in', email: share.toEmail });
				}
			});
		}
	});
});

module.exports = router;