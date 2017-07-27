var bcrypt = require('bcrypt');
var crypto = require('crypto');
var settings = require('../../config/settings');
var etherpad = require('../lib/etherpad-api');
var ses = require('node-ses');
var emailClient = ses.createClient({ key: settings.ses.key, secret: settings.ses.secret, amazon: 'https://email.us-east-1.amazonaws.com' });

module.exports = function(sequelize, DataTypes) {
	var User = sequelize.define("User", {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		fullName: {
			type: DataTypes.STRING,
		},
		password: {
			type: DataTypes.STRING,
		},
		salt: {
			type: DataTypes.STRING
		},
		resetToken: {
			type: DataTypes.STRING,
		},
		resetTokenExpires: {
			type: DataTypes.DATE,
		},
		etherpadAuthorId: {
			type: DataTypes.STRING
		},
		isVerified: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0
		}
	}, {
		tableName: 'users',
		indexes: [{
			unique: true,
			fields: ['email']
		}],
		instanceMethods: {
			resetPassword: function() {
				this.resetToken = crypto.randomBytes(20).toString('hex');
				this.resetTokenExpires = new Date(Date.now() + 3600000*24);
				this.save();
				emailClient.sendEmail({
					to: this.email,
					from: 'accounts@wallace.roamandwander.com',
					subject: 'Wallace Password Reset',
					message: `Hi ${this.fullName},<br><br>
					Forgot your password? We've been there.<br><br>
					Reset your password from the following link.<br><br>
					<a href="${settings.allowOrigin}/#/users/set-password/${this.resetToken}">${settings.allowOrigin}/#/users/set-password/${this.resetToken}</a><br><br>`
				}, function (err, data, res) { });
			},
			setPassword: function(password, callback) {
				this.password = bcrypt.hashSync(password, this.salt);
				this.save().then(function() {
					callback && callback();
				});
			},
			returnSafeValue: function() {
				return {
					id: this.id,
					fullName: this.fullName,
					email: this.email,
					etherpadAuthorId: this.etherpadAuthorId,
					isVerified: this.isVerified
				};
			},
			setVerified: function( callback ) {
				this.isVerified = 1;
				this.save().then( function() {
					callback && callback();
				} );
			}
		},
		classMethods: {
			associate: function(models) {
				User.hasMany(models.Share, {foreignKey: 'fromUserId', as: 'ShareFrom'});
				User.hasMany(models.Share, {foreignKey: 'toUserId', as: 'ShareTo'});
				User.hasMany(models.Paper, {foreignKey: 'creatorId', as: 'CreatedPapers'});
				User.belongsToMany(models.Paper, { through: models.UserPaper, foreignKey: 'userId' });
			}
		}
	});

	User.beforeCreate(function(user) {
		user.salt = bcrypt.genSaltSync(10);
		user.password = bcrypt.hashSync(user.password, user.salt);
		user.resetToken = crypto.randomBytes(20).toString('hex');
		user.resetTokenExpires = new Date(Date.now() + 3600000*24);
	});

	User.afterCreate(function(user) {
		etherpad.getAuthorID(user.fullName, user.id, function(data) {
			if (data.authorID) {
				user.etherpadAuthorId = data.authorID;
				user.save();
			}
		});
		if (!user.isVerified) {
			emailClient.sendEmail({
				to: user.email,
				from: 'accounts@wallace.roamandwander.com',
				subject: 'Wallace Account Activation',
				message: `Hello ${user.fullName},<br><br>
				You or someone with your email id signed up at this site. Your new account is almost ready, but before you can login you need to confirm your email id by visiting the link below: <br><br>
				<a href="${settings.allowOrigin}/#/users/verify/${user.resetToken}">${settings.allowOrigin}/#/users/verify/${user.resetToken}</a><br><br>
				Once you have visited the verification URL, your account will be activated.<br><br>
				If you have any problems or questions, please reply this email.<br><br>
				Thanks!`,
			}, function (err, data, res) { });
		}
	});

	return User;
};