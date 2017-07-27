var etherpad = require('../lib/etherpad-api');

module.exports = function(sequelize, DataTypes) {
	var UserPaper = sequelize.define("UserPaper", {
		userId: {
			type: DataTypes.UUID,
		},
		paperId: {
			type: DataTypes.UUID,
		}
	}, {
		tableName: 'users_papers',
		instanceMethods: {
		},
		classMethods: {
			associate: function(models) {
				
			}
		}
	});

	return UserPaper;
};