
var EditorAPI = function() {

};

EditorAPI.prototype.init = function(context) {
	this.inner = frames["ace_outer"].frames["ace_inner"];
	this.$ = this.inner.$;
	this.context = context;
};

EditorAPI.prototype.insertPage = function(id, title, elements, pagePosition) {
	var preClass = 'page-'+id+'-';
	if (this.$('.'+preClass+'start').length) {
		return this.jsonResult(true, 'page already exists');
	}
	var lines = [];
	lines.push({
		className: preClass+'start page-start position-start-'+pagePosition,
		content: ''
	});
	lines.push({
		className: preClass+'header page-header',
		content: ''
	});
	if (title) {
		lines.push({
			className: preClass+'title page-title',
			content: title
		});
	}
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		var classes = preClass+element.id+' page-element';
		if (element.additionalClasses) {
			classes += ' ' + element.additionalClasses;
		}
		lines.push({
			className: classes,
			content: ''
		});
	}
	lines.push({
		className: preClass+'end page-end position-end-'+pagePosition,
		content: ''
	});

	var pageEnds = this.$('.page-end');
	var lineIndex = false;
	var previousLineIndex = false;
	for (i = 0; i < pageEnds.length; i++) {
		var page = this.$(pageEnds[i]);
		var position = page.attr('class').match(/position-end-(\d+)/);
		position = position && position[1];
		if (!position) {
			continue;
		} else if ((position+1) == pagePosition) {
			lineIndex = page.parent().index();
			break;
		} else if ((position-1) == pagePosition || position > pagePosition) {
			lineIndex = previousLineIndex === false ? 0 : previousLineIndex;
			break;
		}
		previousLineIndex = page.parent().index();
	}
	if (lineIndex === false) {
		lineIndex = this.getLastLine().index();
	}

	var self = this;
	lines.forEach(function(lineInfo) {
		self.context.editorInfo.ace_inCallStackIfNecessary('lineInsert', function() {
			var line = self.context.rep.lines.atIndex(lineIndex);
			self.context.editorInfo.ace_performSelectionChange([lineIndex, line.width-1], [lineIndex, line.width-1], true);
			self.context.editorInfo.ace_doReturnKey();
			self.setLineValue(lineIndex+1, lineInfo.content, lineInfo.className);
			lineIndex++;
		});
	});
	return this.jsonResult();
};

EditorAPI.prototype.removePage = function(id) {
	var preClass = 'page-'+id+'-';
	var $start =  this.$('.'+preClass+'start');
	if (!$start.length) {
		return this.jsonResult(true, 'page does not exist');
	}
	var startLine = $start.parent().index();
	var endLine = this.$('.'+preClass+'end');
	if (endLine) {
		endLine = endLine.parent().index()+1;
	} else {
		endLine = this.getLastLine().index()+1;
	}
	this.context.editorInfo.ace_replaceRange([startLine, 0], [endLine, 0], '');
	return this.jsonResult();
};

EditorAPI.prototype.getPages = function() {
	var pages = this.$('.page-start');
	var pageIds = [];
	var self = this;
	pages.each(function() {
		var classes = self.$(this).attr('class');
		var pageId = classes.match(/page-(.+?)-start/);
		pageId = pageId && pageId[1];
		pageIds.push(pageId);
	});
	return this.jsonResult(false, "found", pageIds);
};

EditorAPI.prototype.getPageValues = function(pageId, elements) {
	elements = elements || [];
	var values = {};
	for (var i = 0; i < elements.length; i++) {
		var content = this.getValue('page-'+pageId+'-'+elements[i].id);
		var notes = this.getValue('page-'+pageId+'-'+elements[i].id+'-notes');

		values[elements[i].id] = {
			content: content.results,
			notes: notes.results
		};
	}
	values.header = {
		content: this.getValue('page-'+pageId+'-header').results
	};
	return this.jsonResult(false, "found", values);
};

EditorAPI.prototype.getElementValue = function(pageId, elementId) {
	return this.getValue('page-'+pageId+'-'+elementId);
};

EditorAPI.prototype.setElementValue = function(pageId, elementId, text, isNote) {
	var elementClass = 'page-'+pageId+'-'+elementId;
	if (isNote) {
		var noteElement = this.$('.'+elementClass+'-notes');
		if (!noteElement.length) {
			return this.insertElement(pageId, elementId+'-notes', text, elementId, 'page-element-notes');
		} else {
			return this.setValue(elementClass+'-notes', text);		
		}
	}
	return this.setValue(elementClass, text);
};

EditorAPI.prototype.insertElement = function(pageId, elementId, text, insertAfterElementId, additionalClasses) {
	additionalClasses = additionalClasses ? ' '+additionalClasses : '';
	var className = 'page-'+pageId+'-'+elementId;
	var $beforeElement = this.$('.page-'+pageId+'-'+insertAfterElementId).last();
	if (!$beforeElement.length) {
		return this.jsonResult(true, 'insert after element does not exist');	
	}
	text = text || '';
	var lineIndex = $beforeElement.parent().index();
	var self = this;
	this.context.editorInfo.ace_inCallStackIfNecessary('lineInsert', function() {
		var line = self.context.rep.lines.atIndex(lineIndex);
		self.context.editorInfo.ace_performSelectionChange([lineIndex, line.width-1], [lineIndex, line.width-1], true);
		self.context.editorInfo.ace_doReturnKey();
		self.setLineValue(lineIndex+1, text, className+additionalClasses);
	});
	return this.jsonResult();
};

EditorAPI.prototype.removeElement = function(pageId, elementId) {
	var $element = this.$('.page-'+pageId+'-'+elementId);
	if (!$element.length) {
		return this.jsonResult(true, 'element does not exist');
	}
	var lineIndex = $element.parent().index();
	this.context.editorInfo.ace_replaceRange([lineIndex, 0], [lineIndex+1, 0], '');
	return this.jsonResult();
};

EditorAPI.prototype.getValue = function(className) {
	var $elements = this.$('.'+className);
	var values = [];
	var self = this;
	$elements.each(function() {
		values.push(self.$(this).text());
	});
	values = values.join("\n");
	return this.jsonResult(false, values, values);
};

EditorAPI.prototype.setValue = function(className, text) {
	var $element = this.$('.'+className).first();
	if (!$element.length) {
		return this.jsonResult(true, 'element does not exist');
	}
	var $parent = $element.parent();
	var lineIndex = $parent.index();
	this.setLineValue(lineIndex, text);
	return this.jsonResult();
};

EditorAPI.prototype.setLineValue = function(index, text, className) {
	className = className ? ' '+className : '' ;
	var line = this.context.rep.lines.atIndex(index);
	var existingClasses = this.context.documentAttributeManager.getAttributeOnLine(index, 'template');
	var lines = text.split("\n");
	var firstLine = lines.shift();
	var processedLines = 1;
	this.context.editorInfo.ace_replaceRange([index, 0], [index, line.width-1], firstLine);
	var self = this;
	this.context.editorInfo.ace_inCallStackIfNecessary('lineInsert', function() {
		self.context.documentAttributeManager.setAttributeOnLine(index, 'template', existingClasses+className);
	});
	var pageId = existingClasses.match(/page-(.+?)-element/);
	pageId = pageId && pageId[1];
	var elementId = existingClasses.match(/page-.+?-(element-\d+_?\d*[^\d\s]*)/);
	elementId = elementId && elementId[1].replace(/-$/, '');
	for (var i = 0; i < lines.length; i++) {
		processedLines++;
		var subId = 'page-'+pageId+'-'+elementId+'-'+i;
		var result = this.setValue(subId, lines[i]);
		if (result && result.status == 'error') {
			this.insertElement(pageId, elementId+'-'+i, lines[i], elementId, existingClasses);
		}
	}
	var isSubItem = existingClasses.match(/page-.+?-(element-\d(?:-notes)?-\d)/);
	isSubItem = isSubItem && isSubItem[1];
	if (!isSubItem && elementId && this.$('.page-'+pageId+'-'+elementId).length > processedLines) {
		var allLines = this.$('.page-'+pageId+'-'+elementId);
		for (i = processedLines; i < allLines.length; i++) {
			this.removeElement(pageId, elementId+'-'+(i-1));
		}
	}
};

EditorAPI.prototype.createLine = function(className, content) {
	return '<div class="ace-line '+className+'">'+content+'</div>';
};

EditorAPI.prototype.getLastLine = function() {
	return this.$('body > div:last');
};

EditorAPI.prototype.getFirstLine = function() {
	return this.$('body > div:last');
};

EditorAPI.prototype.jsonResult = function(error, message, results) {
	return {
		status: error ? 'error' : 'success',
		message: message,
		results: results
	};
};

window.editorAPI = new EditorAPI();