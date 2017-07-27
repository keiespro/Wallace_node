var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');

var escape = require( 'ep_wallace/static/js/lib' ).escape;

var patterns = require('ep_wallace/static/paper_templates/aba/patterns').patterns;
var paper_template = require('ep_wallace/static/paper_templates/aba/settings').settings;

var WizardMode = {
	// overlay
	// activePage

	initialize: function() {
		this.headerValue = false;
		var jObj = $( '<div class="editor-overlay"></div>' );
		this.overlay = jObj;
		this.ace_outer = $("iframe[name=ace_outer]").contents();
		this.ace_outer_body = this.ace_outer.find("body");
		var inner_frame = this.ace_outer.find( "iframe[name=ace_inner]");
		inner_frame.hide();
		$('#editbar').addClass('disabled');
		this.ace_outer.find('.wallace_toc').show();
		this.overlay.insertBefore( inner_frame );
		this.ace_outer_body.append($('#tmpl-wizard-add-button').html());
		this.ace_outer_body.append($('#tmpl-custom-popover').html());
		this.popover = this.ace_outer_body.find('.custom-popover');
		var result = editorAPI.getPages();
		var pages = result.results;
		for (var i = 0; i < pages.length; i++) {
			this.addOrMoveToSection(pages[i], pages[i].replace('-', ' '), true);
		}
		this.updateAllElements();
		this.initializeEvents();
	},

	initializeEvents: function() {
		var self = this;
		this.ace_outer.find('.add-section-selection a').on('click', function(e) {
			e.preventDefault();
			$(this).parents('[data-btn-toggle]').prev().click();
			self.addOrMoveToSection($(this).data('target'), $(this).text());
		});

		this.ace_outer.find('[data-btn-toggle]').each(function(idx, val) {
			var obj = $(val);
			obj.hide();
			var target = self.ace_outer.find(obj.data('target'));
			target.on('click', function() {
				if (target.hasClass('toggle-clicked')) {
					obj.hide();
				} else {
					obj.show();
					self.ace_outer_body.animate({
						scrollTop: self.ace_outer_body[0].scrollHeight
					}, 300);
				}
				target.toggleClass('toggle-clicked');
			});
		});

		this.ace_outer.find(".toc_item").on('click', function() {
			self.ace_outer.find(".toc_item").removeClass('active');
			$(this).addClass('active');
			self.addOrMoveToSection($(this).data('target'), $(this).text());
		});

		this.ace_outer.find('body').on('input', '.aba-header textarea', function() {
			self.updateHeader($(this));
		});

		this.ace_outer.find('body').on('keydown', '.aba-header textarea', function(e) {
			if (e.keyCode == 13) {
				e.preventDefault();
			}
		});

		this.ace_outer.find('body').on('input', '.auto-size', function() {
			var size = self.getTextSize($(this).val(), $(this));
			$(this).css({
				width: size.width,
				height: size.height
			});
		});
	},

	addOrMoveToSection: function(target, title, dontScroll) {
		this.activePage && this.activePage.removeClass("active");

		var targetPage = this.overlay.find(".overlay-page-" + target);
		if (!targetPage.length) {
			var section = this.getSection(target);
			var elements = section && section.elements;
			var self = this;
			if (target == 'cover') {
				editorAPI.insertPage(target, false, elements, section.position);
				targetPage = this.getPageTemplate(target);
				targetPage.find('textarea').on('input', function() {
					var element = $(this);
					self.preventScroll(function() {
						editorAPI.setElementValue(target, element.data('refId'), element.val());	
					});
				});
			} else {
				editorAPI.insertPage(target, title, elements, section.position);
				targetPage = this.getPageTemplate(target);
				targetPage.find("textarea").on('input', function() {
					$(this).height('auto');
					var expanded = Math.max($(this).get(0).scrollHeight, $(this).height());
					$(this).height(expanded);
					var isNote = false;
					if ($(this).attr('class').indexOf('-notes') != -1) {
						isNote = true;
						Suggestions.container.find(".notes-source").height(expanded + 5);
					} else {
						Suggestions.onSuggestion.height(expanded +  45);
						Suggestions.container.find(".suggestions-source").height(expanded + 105);
					}
					var element = $(this);
					self.preventScroll(function() {
						editorAPI.setElementValue(target, element.data('refId'), element.val(), isNote);
					});
				});

				targetPage.find("[data-suggestion-trigger]").on('click focus', function(e) {
					var req = $(this).closest("[data-suggestion]");
					if (req.hasClass('on-suggestion')) {
						return;
					}

					Suggestions.hide();
					if (!Suggestions.updateSuggestions(req, $(this))) {
						return;
					}

					var src = Suggestions.container.find(".suggestions-source");

					src.height(req.height() + 60);

					Suggestions.outerContainer.css('position', 'absolute')
						.css('top', req.offset().top - 13)
						.css('z-index', '100');
					Suggestions.show();

					e.stopPropagation();
				});

				targetPage.find('.notes-indicator').hover(function() {
					self.showNotesPopover($(this));
				}, function() {
					self.hidePopover();
				}).click(function() {
					self.hidePopover();
					$(this).siblings('.element-content-input').find('textarea').trigger('click');
					Suggestions.showNotes();
				});
			}
			
			var allPages = this.overlay.find('.overlay-page');
			var inserted = false;
			for (var i = 0; i < allPages.length; i++) {
				var page = $(allPages[i]);
				var position = page.attr('class').match(/position-(\d+)/)[1];
				if ((position+1) == section.position) {
					targetPage.insertAfter(page);
					inserted = true;
					break;
				} else if ((position-1) == section.position || position > section.position) {
					targetPage.insertBefore(page);
					inserted = true;
					break;
				}
			}
			if (!inserted) {
				this.overlay.append(targetPage);
			}
			this.updateHeader(targetPage.find('.aba-header textarea'), true);
			targetPage.find('.auto-size').each(function() {
				var size = self.getTextSize($(this).val(), $(this));
				$(this).css({
					width: size.width,
					height: size.height
				});
			});
		}

		this.ace_outer_body.find('.toc_item.item-'+target+', .section-item.item-'+target).addClass('exists');

		if (this.ace_outer_body.find('.section-item:not(.exists)').length === 0) {
			this.ace_outer_body.find('.add_section').hide();
		}

		if (!dontScroll) {
			this.activePage = targetPage;
			this.activePage.addClass("active");
			this.overlay.closest("body").animate({
				scrollTop: this.activePage.offset().top
			}, 300);
		}
	},

	updateHeader: function(currentInput, useCurrentValue) {
		var val = currentInput.val();
		if (useCurrentValue) {
			val = this.headerValue;
		} else {
			this.headerValue = val;
		}
		val = val || '';
		var size = this.getTextSize(val, currentInput);

		this.ace_outer.find('.aba-header textarea').not(currentInput).val(val);
		this.ace_outer.find('.aba-header textarea').css({
			width: size.width,
			height: size.height
		});
	},

	getTextSize: function(val, appendElement) {
		var temp = document.createElement('span');
		val = val || '';
		$(temp).text(val).css({ 
			display: 'none',
			'font-size': (appendElement ? appendElement.css('font-size') : 'auto'),
			'font-family': (appendElement ? appendElement.css('font-family') : 'auto')
		});
		appendElement = appendElement ? appendElement : $('body div');
		appendElement.after($(temp));
		var extra = appendElement ? parseInt(appendElement.css('padding-left')) : 0;
		extra += appendElement ? parseInt(appendElement.css('padding-right')) : 0;
		var width = Math.ceil($(temp).width());
		if (width > 0) {
			width += extra;
			width += 'px';
		} else {
			width = '';
		}
		$(temp).remove();
		var height = '';
		if (appendElement && val) {
			appendElement.height('auto');
			height = appendElement.get(0).scrollHeight + 'px';
		}
		return { width: width, height: height };
	},

	showNotesPopover: function($notesIcon) {
		var value = $notesIcon.siblings('.element-notes-input').find('textarea').val();
		var position = $notesIcon.offset();
		var top = position.top + $notesIcon.outerHeight();
		var left = position.left + ($notesIcon.outerHeight()/2);
		this.showPopover(value, top, left);
	},

	showPopover: function(content, top, left) {
		this.popover.text(content)
			.css({
				top: (top+15)+'px',
				left: (left-25)+'px',
			})
			.show();
	},

	hidePopover: function(content, top, left) {
		this.popover.hide();
	},

	getPageTemplate: function( target ) {
		var section = this.getSection(target);
		var elements = section.elements;
		var values = editorAPI.getPageValues(target, elements).results;
		var template = target == 'cover' ? 'cover.ejs' : 'page.ejs';
		if (values.header && values.header.content) {
			this.headerValue = values.header.content;
		} else {
			values.header = { content: this.headerValue };
		}
		var pageHtml = ejs.render(paper_template.templates[template], { 
			section: target,
			elements: elements,
			values: values,
		});

		return $('<div class="overlay-page overlay-page-'+target+' position-'+section.position+'">'+pageHtml+'</div>');
	},

	getSection: function(section) {
		return _.find( patterns, function ( obj ) { 
			if ( obj.section == section ) {
				return true;
			}
		});
	},

	getElement: function(sectionName, elementName) {
		var sectionObj = this.getSection(sectionName);
		if (!sectionObj) {
			return false;
		}
		var elementObj = _.find(sectionObj.elements, function(obj) {
			if (obj.id == elementName) {
				return true;
			}
		});
		return elementObj;
	},

	updateAllElements: function() {
		var self = this;
		var result = editorAPI.getPages();
		var pages = result.results;
		for (var i = 0; i < pages.length; i++) {
			this.addOrMoveToSection(pages[i], pages[i].replace('-', ' '), true);
			var section = this.getSection(pages[i]);
			var values = editorAPI.getPageValues(section.section, section.elements).results;
			if (values.header && values.header.content) {
				this.headerValue = values.header.content;
			} else {
				values.header = { content: this.headerValue };
			}
			for (var elementId in values) {
				var input = self.overlay.find('.overlay-page-'+section.section+' .'+elementId);
				if (input && input[0] && input.val() != values[elementId].content) {
					input.val(values[elementId].content);
				}
				var notesInput = self.overlay.find('.overlay-page-'+section.section+' .'+elementId+'-notes');
				if (notesInput && notesInput[0] && notesInput.val() != values[elementId].notes) {
					notesInput.val(values[elementId].notes);
					if (values[elementId].notes) {
						notesInput.parent().siblings('.notes-indicator').show();
					} else {
						notesInput.parent().siblings('.notes-indicator').hide();
					}
				}
				Suggestions.autoSetElementHeight(input);
				Suggestions.autoSetElementHeight(notesInput);
			}
		}
	},

	preventScroll: function(fn) {
		var scrollY = this.ace_outer.scrollTop();
		if (navigator.platform.indexOf('Win') == -1) {
			// briefly hide overflow to prevent scrollbar flashing on OSX
			this.ace_outer_body.css('overflow', 'hidden');
		}
		fn();
		this.ace_outer.scrollTop(scrollY);
		var self = this;
		setTimeout(function() {
			self.ace_outer_body.css('overflow', 'auto');
		});
	}
};

var Suggestions = {
	// outerContainer: undefined,
	// container: undefined,
	// onSuggestion: undefined,
	// triggerSrc

	initialize: function() {
		var html = $('#tmpl-wizard-suggestions-container').html();
		var ace_outer = $("iframe[name=ace_outer]").contents();
		var ace_outer_body = ace_outer.find("body");
		ace_outer_body.append(html);
		this.outerContainer = ace_outer.find('.suggestions-outer-container');
		this.container = this.outerContainer.find( ".suggestions-container" );
		this.initializeEvents();
	},

	initializeEvents: function() {
		var self = this;
		this.outerContainer.closest("body").on('click', function(e) {
			var target = $(e.target);
			if (
				target.hasClass('suggestions-suggest') ||
				target.hasClass('suggestions-container') ||
				target.parents('.suggestions-container').length > 0 ||
				target.closest('[data-suggestion]').hasClass('on-suggestion')
			) {
				return true;
			}
			if (self.outerContainer.is(":visible")) {
				self.hide();
			}
		});
		this.container.find('.writebox-tabs.notes-button').click(function(e) {
			e.preventDefault();
			self.showNotes();
		});
		this.container.find('.writebox-tabs.edit-button').click(function(e) {
			e.preventDefault();
			self.showContentEdit();
		});
		this.container.find('.suggestion-close').click(function(e) {
			self.hide();
		});
	},

	autoSetElementHeight: function(element) {
		if (!element || !element[0]) {
			return;
		}
		element.height('auto');
		var expanded = Math.max(element.get(0).scrollHeight, element.height());
		element.height(expanded);
		return expanded;
	},

	showNotes: function() {
		this.onSuggestion.find('.element-notes-input').show();
		this.container.find('.suggestions-guide, .suggestions-patterns').hide();
		this.container.find('.notes-source').show();
		
		var expandedHeight = this.autoSetElementHeight(this.onSuggestion.find('.element-notes-input textarea'));
		this.container.find(".notes-source").height(expandedHeight + 5);

		this.container.find('.writebox-tabs.edit-button').removeClass('active');
		this.container.find('.writebox-tabs.notes-button').addClass('active');
		this.onSuggestion.find('.element-notes-input textarea').focus();
	},

	showContentEdit: function() {
		this.onSuggestion.find('.element-notes-input').hide();
		this.container.find('.suggestions-guide, .suggestions-patterns').show();
		this.container.find('.notes-source').hide();

		var expandedHeight = this.autoSetElementHeight(this.onSuggestion.find('.element-content-input textarea'));
		this.onSuggestion.height(expandedHeight +  45);
		this.container.find(".suggestions-source").height(expandedHeight + 105);

		this.container.find('.writebox-tabs.notes-button').removeClass('active'); 
		this.container.find('.writebox-tabs.edit-button').addClass('active');
	},

	hide: function() {
		if (this.outerContainer) {
			if (this.triggerSrc && this.triggerSrc.parent().siblings('.element-notes-input').find('textarea').val()) {
				this.triggerSrc.parent().siblings('.notes-indicator').show();
			}
			this.outerContainer.hide();
			this.removeOnSuggestion();
		}
	},

	show: function() {
		this.outerContainer.show();
		this.triggerSrc.parent().siblings('.notes-indicator').hide();
	},

	setOnSuggestion: function( suggestObj, triggerSrc ) {
		this.onSuggestion = suggestObj;
		this.triggerSrc = triggerSrc;
		suggestObj.addClass('on-suggestion');
	},

	removeOnSuggestion: function() {
		if (this.onSuggestion) {
			this.showContentEdit();
			this.onSuggestion.removeClass('on-suggestion');
		}
		delete this.onSuggestion;
		delete this.triggerSrc;
	},

	updateSuggestions: function( suggestObj, triggerSrc ) {
		var elementObj = WizardMode.getElement(suggestObj.data('section'), suggestObj.data('element'));
		if (!elementObj) {
			return false;
		}

		this.setOnSuggestion(suggestObj, triggerSrc);

		this.container.find(".suggestions-guide .guide-desc").html( elementObj.setting.guide );
		var sp = this.container.find( ".suggestions-patterns" );

		sp.empty();

		var suggestionHtml = ejs.render($('#tmpl-wizard-suggestions-patterns').html(), {
			patterns: elementObj.setting.patterns,
			escapeHtml: escape.escapeHtml
		});
		sp.append(suggestionHtml);

		this.container.find('.writebox-tabs.edit-button').addClass('active');

		var self = this;
		/* suggest event handler */
		sp.find("a.suggestions-suggest").on('click', function(e) {
			e.preventDefault();
			var element = $(this);
			WizardMode.preventScroll(function() {
				var val = element.data('value');
				if (val && val.length > 0) {
					val = escape.escapeBack(decodeURI(val));
				} else {
					val = escape.escapeBack(element.text());
				}

				self.setTriggerValue(val);
				self.focusInput();
			});
		});

		return true;

	},

	setTriggerValue: function( val ) {
		val = val.replace('...', ' ');
		this.triggerSrc && this.triggerSrc.val( val ) && this.triggerSrc.trigger('input');
	},

	focusInput: function() {
		this.triggerSrc.focus();
	}
};

exports.WizardMode = WizardMode;
exports.Suggestions = Suggestions;