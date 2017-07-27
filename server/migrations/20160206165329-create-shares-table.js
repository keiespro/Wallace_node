'use strict';

module.exports = {
	up: function(queryInterface, Sequelize) {
		queryInterface.createTable('shares', {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true
			},
			paperId: {
				type: Sequelize.UUID,
			},
			fromUserId: {
				type: Sequelize.UUID,
			},
			toUserId: {
				type: Sequelize.UUID,
			},
			toEmail: {
				type: Sequelize.STRING
			},
			token: {
				type: Sequelize.STRING
			},
			createdAt: {
				type: Sequelize.DATE
			},
			updatedAt: {
				type: Sequelize.DATE
			}
		}, {
			charset: 'utf8'
		});
	},

	down: function(queryInterface, Sequelize) {
		queryInterface.dropTable('users');
	}
};
