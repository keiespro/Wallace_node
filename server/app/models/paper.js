var settings = require('../../config/settings');
var etherpad = require('../lib/etherpad-api');

module.exports = function(sequelize, DataTypes) {
	var Paper = sequelize.define("Paper", {
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true
		},
		etherpadPadId: {
			type: DataTypes.STRING,
		},
		title: {
			type: DataTypes.STRING,
		},
		type: {
			type: DataTypes.STRING,
		},
		creatorId: {
			type: DataTypes.UUID,
		},
		wizardMode: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		}
	}, {
		tableName: 'papers',
		instanceMethods: {
		},
		classMethods: {
			associate: function(models) {
				Paper.hasMany(models.Share, {foreignKey: 'paperId', as: 'Share'});
				Paper.belongsTo(models.User, { foreignKey: 'creatorId', as: 'Creator'});
				Paper.belongsToMany(models.User, { through: models.UserPaper, foreignKey: 'paperId' });
			},
			getEmbedUrl: function(paperId, user) {
				return new sequelize.Promise(function(resolve, reject) {
					user.getPapers({ where: { id: paperId }}).then(function(papers) {
						var paper = papers[0];
						if (!paper) {
							return reject("Paper not found");
						}
						var groupID = paper.etherpadPadId.split("$")[0];
						etherpad.getSessionID(groupID, user.etherpadAuthorId, function(result) {
							if (!result || !result.sessionID) {
								return reject('Unable to access paper');
							}
							result.paper = paper;
							var wizardMode = paper.wizardMode ? 1 : 0;
							result.url = settings.etherpadUrl+"/p/"+paper.etherpadPadId+'?wizardMode='+wizardMode;
							resolve(result);
						});
					});
				});
			},
			getInfo: function(etherpadPadId, user) {
				return new sequelize.Promise(function(resolve, reject) {
					user.getPapers({ where: { etherpadPadId: etherpadPadId }}).then(function(papers) {
						var paper = papers[0];
						if (!paper) {
							return reject("Paper not found");
						}
						paper.getUsers().then(function(users) {
							users.forEach(function(user, i) {
								users[i] = user.returnSafeValue();
							});
							resolve({
								id: paper.id,
								users: users
							});
						});
					});
				});
			},
			import: function(paperId, user, file) {
				return new sequelize.Promise(function(resolve, reject) {
					user.getPapers({ where: { id: paperId }}).then(function(papers) {
						var paper = papers[0];
						if (!paper) {
							return reject("Paper not found");
						}
						paper.wizardMode = false;
						paper.save().then(function() {
							etherpad.import(paper.etherpadPadId, file, function(result) {
								if (!result || !result.padID) {
									return reject('Unable to access paper');
								}
								result.paper = paper;
								result.url = "http://localhost:9001/p/"+paper.etherpadPadId;
								resolve(result);
							});
						});
					});
				});	
			},
			delete: function(paperId, user) {
				return new sequelize.Promise(function(resolve, reject) {
					user.getPapers({ where: { id: paperId }}).then(function(papers) {
						var paper = papers[0];
						if (!paper) {
							return reject("Paper not found");
						}
						var groupID = paper.etherpadPadId.split("$")[0];
						etherpad.deletePaper(groupID, function(result) {
							if (!result) {
								return reject('Unable to access paper');
							}
							paper.destroy().then(function() {
								resolve(result);
							});
						});
					});
				});	
			},
			setTitle: function(paperId, title, user) {
				return new sequelize.Promise(function(resolve, reject) {
					user.getPapers({ where: { id: paperId }}).then(function(papers) {
						var paper = papers[0];
						if (!paper) {
							return reject("Paper not found");
						}
						paper.updateAttributes({
						      title: title
						}).then(resolve);
					});
				});
			},
			share: function(paperId, email, user) {
				return user.getPapers({ where: { id: paperId }}).then(function(papers) {
					var paper = papers[0];
					if (!paper) {
						return sequelize.Promise.reject("Paper not found");
					}
					var newShare = {
						paperId: paper.id,
						fromUserId: user.id,
						toEmail: email.toLowerCase()
					};
					return Paper.sequelize.models.Share.create(newShare);
				});
			}
		}
	});

	Paper.afterCreate(function(paper) {
		return new sequelize.Promise(function(resolve, reject) {
			etherpad.createPaper(paper.id, paper.title, function(data) {
				paper.etherpadPadId = data.padID;
				paper.save().then(resolve).catch(reject);
			});
		});
	});

	Paper.afterFind(function(papers) {
		if (!( papers instanceof Array)) {
			papers = [papers];
		}
		papers.forEach(function(paper) {
			paper.dataValues.thumbnail = settings.etherpadUrl+'/static/images/thumbnails/'+paper.etherpadPadId+'.png';
		});
	});

	return Paper;
};