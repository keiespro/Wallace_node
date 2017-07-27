var request = require('request');
var mammoth = require('mammoth');
var settings = require('../../config/settings.json');
var fs = require('fs');
var minify = require('html-minifier').minify;

var loadAPIKEY = function() {
	fs.exists('./etherpad/APIKEY.txt', function(exists) {
		if (exists) {
			settings.etherpad.key = fs.readFileSync('./etherpad/APIKEY.txt').toString();
		} else {
			setTimeout(loadAPIKEY, 500);
		}
	});
};
loadAPIKEY();

var Etherpad = {};

Etherpad._makeRequest = function(url, params, callback) {
	params.apikey = settings.etherpad.key;
	var options = {
	    uri: 'http://'+settings.etherpad.host+':'+settings.etherpad.port+'/api/1/'+url,
	    method: 'GET',
	    json: true,
	    qs: params
	};
	request(options, function(error, response, body){
		callback(body);
	});
};

Etherpad._makePostRequest = function(url, params, callback) {
	params.apikey = settings.etherpad.key;
	var options = {
	    uri: 'http://'+settings.etherpad.host+':'+settings.etherpad.port+'/api/1/'+url,
	    method: 'POST',
	    json: params,
	    qs: {
	    	apikey: params.apikey
	    },
	};
	request(options, function(error, response, body){
		callback(body);
	});
};

Etherpad._createAuthor = function(name, id, callback) {
	this._makeRequest('createAuthorIfNotExistsFor', {
		name: name,
		authorMapper: id
	}, callback);
};

Etherpad._createGroup = function(id, callback) {
	this._makeRequest('createGroupIfNotExistsFor', {
		groupMapper: id
	}, callback);
};

Etherpad._deleteGroup = function(id, callback) {
	this._makeRequest('deleteGroup', {
		groupID: id
	}, callback);
};

Etherpad._createPad = function(groupID, padName, callback) {
	this._makeRequest('createGroupPad', {
		groupID: groupID,
		padName: padName,
	}, callback);
};

Etherpad._listSessions = function(groupID, callback) {
	this._makeRequest('listSessionsOfGroup', {
		groupID: groupID
	}, callback);
};

Etherpad._createSession = function(groupID, authorID, callback) {
	this._makeRequest('createSession', {
		groupID: groupID,
		authorID: authorID,
		validUntil: (Math.ceil(Date.now()/1000)+(24*60*60*365*100)) // 100 years
	}, callback);
};

Etherpad._setHTML = function(padID, html, callback) {
	this._makePostRequest('setHTML', {
		padID: padID,
		html: html,
	}, callback);
};

Etherpad._setTemplate = function(padID, type, callback) {
	var html = minify(fs.readFileSync('./paper_templates/'+type+'/cover.html').toString(), {collapseWhitespace: true});
	this._setHTML(padID, html, callback);
};

Etherpad.getAuthorID = function(name, userID, callback) {
	this._createAuthor(name, userID, function(response) {
		if (!response || response.code !== 0) { return callback(false); }
		var authorID = response.data.authorID;
		callback({authorID: authorID});
	});
};

Etherpad.createPaper = function(paperID, paperName, callback) {
	var self = this;
	self._createGroup(paperID, function(response){
		if (!response || response.code !== 0) { return callback(false); }
		var groupID = response.data.groupID;
		self._createPad(groupID, paperName, function(response) {
			if (!response || response.code !== 0) { return callback(false); }
			var padID = response.data.padID;
			callback({padID: padID});
		});
	});
};

Etherpad.deletePaper = function(groupID, callback) {
	this._deleteGroup(groupID, function(response){
		if (!response || response.code !== 0) { return callback(false); }
		callback(true);
	});
};


Etherpad.import = function(padID, file, callback) {
	var self = this;
	var options = {
		buffer: file, 
		ignoreEmptyParagraphs: false,
		styleMap: [
			"p[style-name='center'] => center",
			"p[style-name='Heading 1'] => p:fresh > h1:fresh",
			"p[style-name='Heading 2'] => p:fresh > h2:fresh",
			"p[style-name='Heading 3'] => p:fresh > h3:fresh",
			"p[style-name='Heading 4'] => p:fresh > h4:fresh",
			"p[style-name='Heading 5'] => p:fresh > h5:fresh",
			"p[style-name='Heading 6'] => p:fresh > h6:fresh"
		],
		transformDocument: transformElement,
	};
	mammoth.convertToHtml({ buffer: file }, options).then(function(result){
        var html = result.value;
        html = "<!doctype html>\n<html lang=\'en\'>\n<body>\n"+html+"\n</body>\n</html>\n";
        self._setHTML(padID, html, function(response) {
        	if (!response || response.code !== 0) { return callback(false); }
        	callback({padID: padID});
        });
    }).done();
};

Etherpad.getSessionID = function(groupID, authorID, callback) {
	var self = this;
	this._listSessions(groupID, function(response) {
		if (!response || response.code !== 0) { return callback(false); }
		for (var sessionID in response.data) {
			if (response.data[sessionID].authorID === authorID) {
				return callback({sessionID: sessionID});
			}
		}
		self._createSession(groupID, authorID, function(response) {
			if (!response || response.code !== 0) { return callback(false); }
			var sessionID = response.data.sessionID;
			callback({sessionID: sessionID});
		});
	});
};

function transformElement(element) {
	if (element.children) {
		element.children.forEach(transformElement);
	}
	if (element.type === "paragraph") {
		if (element.alignment === "center" && !element.styleId) {
			element.styleName = "center";
		}
	}
	return element;
}

module.exports = Etherpad;
