var Modal = function() {
	this.$overlay = $('.custom-modal-overlay');
	this.$dialog = $('.custom-modal-dialog');
	this.$content = $('.custom-modal-dialog-content');

	var self = this;
	this.$overlay.click(function() {
		self.close();
	});
	$(document).keyup(function(e) {
		if (e.keyCode == 27) {
			e.preventDefault();
			e.stopPropagation();
			self.close();
		}
	});
	$('.custom-modal-dialog .close').click(function() {
		self.close();
	});
};

Modal.prototype.open = function(html, callback) {
	this.setHtml(html);
	this.$overlay.show();
	this.$dialog.show();
	callback && callback();
};

Modal.prototype.setHtml = function(html) {
	this.$content.html(html);
};

Modal.prototype.close = function() {
	this.$overlay.hide();
	this.$dialog.hide();
};

window.modal = new Modal();
