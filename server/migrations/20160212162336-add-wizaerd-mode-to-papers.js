'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
  	queryInterface.addColumn(
  	  'papers',
  	  'wizardMode',
  	  {
  	    type: Sequelize.BOOLEAN,
  	  }
  	);
  },

  down: function (queryInterface, Sequelize) {
  	queryInterface.removeColumn('papers', 'wizardMode');
  }
};
