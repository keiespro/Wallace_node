var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');


var wizardOn = !!parseInt(location.search.match(/wizardMode=(\d)/)[1]);

var WizardMode = require('ep_wallace/static/js/wizard').WizardMode;
var Suggestions = require('ep_wallace/static/js/wizard').Suggestions;

exports.aceEditorCSS = function(hook, context) {
	return [ 'ep_wallace/static/paper_templates/aba/style.css'  ];
};

// Once ace is initialized, we set ace_doInsertPageBreak and bind it to the context
exports.aceInitialized = function(hook, context) {
	var editorInfo = context.editorInfo;
	editorInfo.ace_doInsertPageBreak = _(doInsertPageBreak).bind(context);
	editorInfo.ace_doRemovePageBreak = _(doRemovePageBreak).bind(context);
	var originalFocus = editorInfo.ace_focus;
	var focusEnabled = false;
	editorInfo.ace_focus = function() { 
		if (focusEnabled) {
			return originalFocus();
		}
	};
	editorAPI.init(context);
};

exports.postAceInit = function(hook, context) {
	var ace_outer = $("iframe[name=ace_outer]").contents();
	var inner_frame = ace_outer.find( "iframe[name=ace_inner]");

	if (wizardOn) {
		WizardMode.initialize();
		Suggestions.initialize();
		ace_outer.find('.wallace_modes').text('Wizard Mode');
	}

	resize();
	$( window ).on( "resize", resize );
	function resize() {
		var windowWidth = $(window).width();
		var docWidth = inner_frame.width();

		ace_outer.find(".wallace_inner_left_container").css( 'width', ( windowWidth - docWidth ) / 2 );
		ace_outer.find(".wallace_inner_right_container").css( 'width', ( windowWidth - docWidth ) / 2 );
	}

	ace_outer.find('.wallace_inner_left_container .expand-button').click(function() {
		var container = $(this).parent();
		if (container.hasClass('visible')) {
			container.removeClass('visible');
			$(this).html('&rang;');
		} else {
			container.addClass('visible');
			$(this).html('&lang;');
		}
	});
};

exports.aceAttribsToClasses = function(hook, context) {
	if (context.key == 'template') {
		return ['template:'+context.value];
	}
	if (context.key == 'pageBreak') {
		return ['pageBreak:' + 1];
	}
};

// Here we convert the class heading:h1 into a tag
exports.aceDomLineProcessLineAttributes = function(name, context) {
	var cls = context.cls;
	if (cls.indexOf('template') != -1) {
		cls = /(?:^| )template:([A-Za-z0-9\s-]*)/.exec(cls)[1];
		if (cls.indexOf('page-start') != -1 || cls.indexOf('page-end') != -1) {
			return [{
				preHtml: '<div class="'+cls+'" contentEditable=false>',
				postHtml: '</div>',
				processedMarker: true
			}];	
		}
		return [{preHtml: '<div class="'+cls+'">', postHtml: '</div>', processedMarker: true}];
	}
	if (cls.indexOf("pageBreak") != -1) {
		return [{
			preHtml: '<div class="pageBreak" contentEditable=false>',
			postHtml: '</div>',
			processedMarker: true
		}];
	}
	return [];
};

function doRemovePageBreak() {
	// Backspace events means you might want to remove a line break, this stops the text ending up
	// on the same line as the page break..
	var rep = this.rep;
	var documentAttributeManager = this.documentAttributeManager;
	if (!(rep.selStart && rep.selEnd)) {
		return;
	} // only continue if we have some caret position
	var firstLine = rep.selStart[0]; // Get the first line
	var line = rep.lines.atIndex(firstLine);

	// If it's actually a page break..
	if (line.lineNode && (line.lineNode.firstChild && line.lineNode.firstChild.className === "pageBreak")) {
		documentAttributeManager.removeAttributeOnLine(firstLine, 'pageBreak'); // remove the page break from the line
		// TODO: Control Z can make this kinda break

		// Get the document
		var document = this.editorInfo.ace_getDocument();

		// Update the selection from the rep
		this.editorInfo.ace_updateBrowserSelectionFromRep();

		// Get the current selection
		var myselection = document.getSelection();

		// Get the selections top offset
		var caretOffsetTop = myselection.focusNode.offsetTop;

		// Move to the new Y co-ord to bring the new page into focus
		$('iframe[name="ace_outer"]').contents().find('#outerdocbody').scrollTop(caretOffsetTop - 120); // Works in Chrome
		$('iframe[name="ace_outer"]').contents().find('#outerdocbody').parent().scrollTop(caretOffsetTop - 120); // Works in Firefox
		// Sighs
	}
}

function doInsertPageBreak() {
	this.editorInfo.ace_doReturnKey();
	var rep = this.rep;
	var documentAttributeManager = this.documentAttributeManager;
	if (!(rep.selStart && rep.selEnd)) {
		return;
	} // only continue if we have some caret position
	var firstLine = rep.selStart[0]; // Get the first line
	var lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0)); // Get the last line
	_(_.range(firstLine, lastLine + 1)).each(function(i) { // For each line, either turn on or off page break
		var isPageBreak = documentAttributeManager.getAttributeOnLine(i, 'pageBreak');
		if (!isPageBreak) { // if its already a PageBreak item
			documentAttributeManager.setAttributeOnLine(i, 'pageBreak', 'pageBreak'); // make the line a page break
		} else {
			documentAttributeManager.removeAttributeOnLine(i, 'pageBreak'); // remove the page break from the line
		}
	});

	// Get caret focus
	this.editorInfo.ace_focus();

	// Insert a line
	this.editorInfo.ace_doReturnKey();

	// Get the document
	var document = this.editorInfo.ace_getDocument();

	// Update the selection from the rep
	this.editorInfo.ace_updateBrowserSelectionFromRep();

	// Get the current selection
	var myselection = document.getSelection();

	// Get the selections top offset
	var caretOffsetTop = myselection.focusNode.offsetTop;

	// Move to the new Y co-ord to bring the new page into focus
	$('iframe[name="ace_outer"]').contents().find('#outerdocbody').scrollTop(caretOffsetTop - 120); // Works in Chrome
	$('iframe[name="ace_outer"]').contents().find('#outerdocbody').parent().scrollTop(caretOffsetTop - 120); // Works in Firefox
	// Sighs
}

// Listen for Control Enter and if it is control enter then insert page break
// Also listen for Up key to see if we need to replace focus at position 0.
exports.aceKeyEvent = function(hook, callstack, editorInfo, rep, documentAttributeManager, evt) {
	var evt = callstack.evt;
	var k = evt.keyCode;

	if (evt.ctrlKey && k == 13 && evt.type == "keydown") {
		callstack.editorInfo.ace_doInsertPageBreak();
		evt.preventDefault();
		return true;
	}

	if (k == 8 && evt.type == "keyup") {
		callstack.editorInfo.ace_doRemovePageBreak();
	}
	return;
};

exports.handleClientMessage_NEW_CHANGES = function(hook, context) {
	// Etherpad hook currently does not send any info regarding changes.
	// update all changed elements
	WizardMode.updateAllElements();
};