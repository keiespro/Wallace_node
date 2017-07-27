// setup and start wallace api
var debug = require('debug')('server');
var app = require('./app/app');
var models = require('./app/models');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
	debug('Express server listening on port ' + server.address().port);
});