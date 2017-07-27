'use strict';

module.exports = {
	up: function(queryInterface, Sequelize) {
		queryInterface.createTable('papers', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			etherpadPadId: {
				type: Sequelize.STRING,
			},
			title: {
				type: Sequelize.STRING,
			},
			type: {
				type: Sequelize.STRING,
			},
			creatorId: {
				type: Sequelize.INTEGER
			},
			createdAt: {
				type: Sequelize.DATE
			},
			updatedAt: {
				type: Sequelize.DATE
			},
		}, {
			charset: 'utf8'
		});
		queryInterface.createTable('users', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
				validate: {
					isEmail: true
				}
			},
			fullName: {
				type: Sequelize.STRING,
			},
			password: {
				type: Sequelize.STRING,
			},
			salt: {
				type: Sequelize.STRING
			},
			resetToken: {
				type: Sequelize.STRING,
			},
			resetTokenExpires: {
				type: Sequelize.DATE,
			},
			createdAt: {
				type: Sequelize.DATE
			},
			updatedAt: {
				type: Sequelize.DATE
			},
		}, {
			tableName: 'users',
			charset: 'utf8'
		});
		queryInterface.createTable('users_papers', {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			userId: {
				type: Sequelize.INTEGER,
			},
			paperId: {
				type: Sequelize.INTEGER,
			},
			createdAt: {
				type: Sequelize.DATE
			},
			updatedAt: {
				type: Sequelize.DATE
			},
		}, {
			charset: 'utf8'
		});
	},

	down: function(queryInterface, Sequelize) {
		queryInterface.dropTable('users');
		queryInterface.dropTable('papers');
		queryInterface.dropTable('users_papers');
	}
};
