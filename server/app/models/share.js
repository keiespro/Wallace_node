var crypto = require('crypto');
var settings = require('../../config/settings');
var ses = require('node-ses');
var emailClient = ses.createClient({ key: settings.ses.key, secret: settings.ses.secret, amazon: 'https://email.us-east-1.amazonaws.com' });

module.exports = function(sequelize, DataTypes) {
	var Share = sequelize.define("Share", {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		paperId: {
			type: DataTypes.UUID,
		},
		fromUserId: {
			type: DataTypes.UUID,
		},
		toUserId: {
			type: DataTypes.UUID,
		},
		toEmail: {
			type: DataTypes.STRING
		},
		token: {
			type: DataTypes.STRING
		}
	}, {
		tableName: 'shares',
		instanceMethods: {
			acceptAs: function(user) {
				this.toUserId = user.id;
				this.token = null;
				var self = this;
				return this.getPaper().then(function(paper) {
					paper.addUser(user);
					return self.save();
				});
			}
		},
		classMethods: {
			associate: function(models) {
				Share.belongsTo(models.Paper, { foreignKey: 'paperId', as: 'Paper' });
				Share.belongsTo(models.User, { foreignKey: 'fromUserId', as: 'FromUser' });
				Share.belongsTo(models.User, { foreignKey: 'toUserId', as: 'ToUser' });
			}
		}
	});

	Share.beforeCreate(function(share) {
		share.token = crypto.randomBytes(20).toString('hex');
	});

	Share.afterCreate(function(share) {
		var fromUser, paper;
		share.getFromUser().then(function(result) {
			fromUser = result;
			return share.getPaper();
		}).then(function(result) {
			paper = result;
		}).then(function() {
			emailClient.sendEmail({
				to: share.toEmail,
				from: 'accounts@wallace.roamandwander.com',
				subject: 'Wallace Paper Shared With You',
				message: `Hello,<br><br>
				${fromUser.fullName} shared the paper "${paper.title}" with you. Click the link below to access it: <br><br>
				<a href="${settings.allowOrigin}/#/papers/accept/${share.token}">${settings.allowOrigin}/#/papers/accept/${share.token}</a><br><br>
				If you have any problems or questions, please reply this email.<br><br>
				Thanks!`,
			}, function (err, data, res) { });
		});
	});


	return Share;
};