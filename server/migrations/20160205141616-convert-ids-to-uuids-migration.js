'use strict';
var models = require('../app/models');

module.exports = {
  up: function (queryInterface, Sequelize, done) {
  	models.sequelize.query('SET FOREIGN_KEY_CHECKS=0').then(function() {
  		return models.sequelize.query("ALTER TABLE papers DROP FOREIGN KEY papers_ibfk_1;").catch(function() {
  			
  		});
  	}).then(function() {
  	 	return queryInterface.changeColumn('users_papers','paperId', {
			type: Sequelize.UUID,
			allowNull: false,
		});
  	 }).then(function() {
  	 	return queryInterface.changeColumn('papers','creatorId', {
			type: Sequelize.UUID,
			allowNull: false,
		});
  	 }).then(function(){
		return models.Paper.findAll({ attributes: ['uuid', 'id'] }).then(function(results) {
			var promises = [];
			results.forEach(function(row) {
				models.sequelize.query("SET FOREIGN_KEY_CHECKS=0;");
				promises.push(models.sequelize.query("UPDATE `users_papers` SET `paperId` = '"+row.uuid+"' WHERE `paperId` = "+row.id+";"));
			});
			return models.Sequelize.Promise.all(promises);
		});
	}).then(function() {
	  	return queryInterface.changeColumn('users_papers','userId', {
	  		type: Sequelize.UUID,
			allowNull: false,
		});
	}).then(function() {
		return models.User.findAll({ attributes: ['uuid', 'id'] }).then(function(results) {
			var promises = [];
			results.forEach(function(row) {
				models.sequelize.query("SET FOREIGN_KEY_CHECKS=0;");
				promises.push(models.sequelize.query("UPDATE `users_papers` SET `userId` = '"+row.uuid+"' WHERE `userId` = "+row.id+";"));
				promises.push(models.sequelize.query("UPDATE `papers` SET `creatorId` = '"+row.uuid+"' WHERE `creatorId` = "+row.id+";"));
			});
			return models.Sequelize.Promise.all(promises);
		});
	}).then(function() {
		models.sequelize.query("SET FOREIGN_KEY_CHECKS=0;");
		return models.sequelize.query("ALTER TABLE users MODIFY id int, DROP PRIMARY KEY;").then(function() {
			return queryInterface.removeColumn('users', 'id');
		});
	}).then(function() {
		return queryInterface.renameColumn('users', 'uuid', 'id').then(function() {
			return models.sequelize.query("ALTER TABLE users ADD PRIMARY KEY (id);");
		});
	}).then(function() {
		models.sequelize.query("SET FOREIGN_KEY_CHECKS=0;");
		return models.sequelize.query("ALTER TABLE papers MODIFY id int, DROP PRIMARY KEY;").then(function() {
			return queryInterface.removeColumn('papers', 'id');
		});
	}).then(function() {
		return queryInterface.renameColumn('papers', 'uuid', 'id').then(function() {
			return models.sequelize.query("ALTER TABLE papers ADD PRIMARY KEY (id);");
		});
	}).then(function() {
		return models.sequelize.query('SET FOREIGN_KEY_CHECKS=1');
	}).then(function() {
		done();
	});
  },

  down: function (queryInterface, Sequelize) {
  	console.log('cannot be undone');
  }
};
