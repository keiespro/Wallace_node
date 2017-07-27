var $ = require('ep_etherpad-lite/static/js/rjquery').$;

var usersToProcess = {};
var usersLoaded = false;

exports.postAceInit = function() {
	var ace_outer = $("iframe[name=ace_outer]").contents();
	var inner_frame = ace_outer.find( "iframe[name=ace_inner]");

	inner_frame.before($('#tmpl-sidebar-left').html());

	var paperId = '';
	$.ajax({
		url: apiUrl + '/papers/getInfo/' + clientVars.padId,
		xhrFields: { withCredentials: true }
	}).then(function(result) {
		paperId = result.paperId;
		result.users.forEach(function(user) {
			updateUserIndicator(user.etherpadAuthorId, user.fullName);
		});
		usersLoaded = true;
		for (var userId in usersToProcess) {
			updateUserIndicator(userId, usersToProcess[userId].name, usersToProcess[userId].online);
		}
	});

	ace_outer.find('.wallace_user_new').click(function() {
		modal.open(ace_outer.find('.invite-form').html(), function() {
			$('.input', '.custom-modal-dialog').focus();
			var processing = false;
			$('.custom-modal-dialog form').submit(function(e) {
				e.preventDefault();
				var email = $('.custom-modal-dialog-content .input').val();
				if (!email || processing) {
					return;
				}
				processing = true;
				$.ajax({
					url: apiUrl + '/papers/share/' + paperId,
					type: 'POST',
					xhrFields: { withCredentials: true },
					data: {
						email: email
					}
				}).then(function(result) {
					if (result.message == 'success') {
						modal.setHtml('<h2>Success!</h2><p>Invite sent to '+email+'<div class="button" onclick="modal.close()">close</div>');
					} else {
						alert(result.message || result.error);
					}
				});
			});
		});
	});
};

exports.handleClientMessage_USER_NEWINFO = function(hook, context) {
	if (!usersLoaded) {
		usersToProcess[context.payload.userId] = {name: context.payload.name, online: true};
	} else {
		updateUserIndicator(context.payload.userId, context.payload.name, true);
	}
};

exports.handleClientMessage_USER_LEAVE = function(hook, context) {
	if (!usersLoaded) {
		usersToProcess[context.payload.userId] = {name: context.payload.name, online: false};
	} else {
		updateUserIndicator(context.payload.userId, context.payload.name, false);
	}
};


function updateUserIndicator(authorId, name, online) {
	if (authorId == clientVars.userId) {
		online = true;
	}
	authorId = authorId.replace('a.','');
	var $userIndicator = $("iframe[name=ace_outer]").contents().find('.wallace_users .'+authorId);
	if (!$userIndicator.length) {
		var html = '<span class="wallace_user '+authorId+'">';
		html += '<span class="initials">'+
			name.split(' ').map(function (s) { return s.charAt(0); }).join('')+
		'</span>';
		html += '<span class="user-online-status" style="display:none"></span>';
		html += '</span>';
		$("iframe[name=ace_outer]").contents().find('.wallace_users').prepend(html).show();
		$userIndicator = $("iframe[name=ace_outer]").contents().find('.wallace_users .'+authorId);
	}
	if (online === true) {
		$userIndicator.find('.user-online-status').show();
	} else if (online === false) {
		$userIndicator.find('.user-online-status').hide();
	}
}