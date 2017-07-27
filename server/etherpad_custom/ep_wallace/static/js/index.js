var _, $, jQuery;
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');

var tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'];

exports.aceEditorCSS = function(hook, context) {
	return [ 'ep_wallace/static/css/editor.css' ]
}

exports.aceRegisterBlockElements = function() {
  return tags;
}

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context) {
	var h1 = $(".toolbar .buttonicon-h1");
	var h2 = $(".toolbar .buttonicon-h2");
	var h3 = $(".toolbar .buttonicon-h3");

	h1.on('click', onHeadingChange );
	h2.on('click', onHeadingChange );
	h3.on('click', onHeadingChange );

	function onHeadingChange( e ) {
		var self = $(this);
		var value = -1;

		if ( self.hasClass( 'buttonicon-h1' ) ) {
			value = 0;
		}
		else if ( self.hasClass( 'buttonicon-h2' ) ) {
			value = 1;

		}
		else if ( self.hasClass( 'buttonicon-h3' ) ) {
			value = 2;
		}

		context.ace.callWithAce( function(ace) {
			ace.ace_doInsertHeading(value);
		}, 'insertheading', true);
	}

	$(".toolbar .buttonicon-format-clear").on( "click", function() {
		context.ace.callWithAce(function(ace){
				var rep = ace.ace_getRep(); // get the current user selection
				var isSelection = (rep.selStart[0] !== rep.selEnd[0] || rep.selStart[1] !== rep.selEnd[1]);
				if(!isSelection) return false; // No point proceeding if no selection..

				var attrs = rep.apool.attribToNum; // get the attributes on this document
				$.each(attrs, function(k, v) { // for each attribute
					var attr = k.split(",")[0]; // get the name of the attribute
					if(attr !== "author"){ // if its not an author attribute
						ace.ace_setAttributeOnSelection(attr, false); // set the attribute to false
					}
				});
			}, 'clearFormatting', true);

		context.ace.callWithAce( function(ace) {
			ace.ace_doInsertHeading( -1 );
		}, 'insertheading', true);
	} );
};

// Once ace is initialized, we set ace_doInsertHeading and bind it to the context
exports.aceInitialized = function(hook, context) {
  var editorInfo = context.editorInfo;
  editorInfo.ace_doInsertHeading = _(doInsertHeading).bind(context);
}

// Our heading attribute will result in a heaading:h1... :h6 class
exports.aceAttribsToClasses = function(hook, context) {
  if(context.key == 'heading'){
    return ['heading:' + context.value ];
  }
}

// Here we convert the class heading:h1 into a tag
exports.aceDomLineProcessLineAttributes = function(name, context) {
  var cls = context.cls;
  var domline = context.domline;
  var headingType = /(?:^| )heading:([A-Za-z0-9]*)/.exec(cls);
  var tagIndex;
  
  if (headingType) tagIndex = _.indexOf(tags, headingType[1]);
  
  if (tagIndex !== undefined && tagIndex >= 0){
    
    var tag = tags[tagIndex];
    var modifier = {
      preHtml: '<' + tag + '>',
      postHtml: '</' + tag + '>',
      processedMarker: true
    };
    return [modifier];
  }
  return [];
};

// Find out which lines are selected and assign them the heading attribute.
// Passing a level >= 0 will set a heading on the selected lines, level < 0 
// will remove it
function doInsertHeading(level) {
  var 	rep = this.rep,
		documentAttributeManager = this.documentAttributeManager;

  if (!(rep.selStart && rep.selEnd) || (level >= 0 && tags[level] === undefined))
  {
    return;
  }
  
  var firstLine, lastLine;
  
  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each(function(i){
    if(level >= 0){
      documentAttributeManager.setAttributeOnLine(i, 'heading', tags[level]);
    }else{
      documentAttributeManager.removeAttributeOnLine(i, 'heading');
    }
  });
}