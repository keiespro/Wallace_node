'use strict';
var uuid = require('node-uuid');
var models = require('../app/models');

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn('users', 'uuid', {
    	primary: true,
      	type: Sequelize.UUID,
      	defaultValue: Sequelize.UUIDV4,
      	after: 'id'
    }).then(function() {
    	return models.User.findAll({ attributes: ['id']}).then(function(results) {
    		var promises = [];
    		results.forEach(function(row) {
    			row.uuid = uuid.v4();
    			promises.push(row.save());
    		});
    		return models.Sequelize.Promise.all(promises);
    	});
    }).then(function() {
    	return queryInterface.addColumn('papers', 'uuid', {
    		primary: true,
    	  	type: Sequelize.UUID,
    	  	defaultValue: Sequelize.UUIDV4,
    	  	after: 'id'
    	}).then(function() {
    		return models.Paper.findAll({ attributes: ['id'] }).then(function(results) {
    			var promises = [];
    			results.forEach(function(row) {
    				row.uuid = uuid.v4();
    				promises.push(row.save());
    			});
    			return models.Sequelize.Promise.all(promises);
    		});
    	});
    }).then(function() {
    	done();
    });
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('users', 'uuid');
    queryInterface.removeColumn('papers', 'uuid');
  }
};
