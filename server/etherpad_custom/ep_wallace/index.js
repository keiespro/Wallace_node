var eejs = require( '../../etherpad/src/node/eejs' ),
express = require( '../../etherpad/src/node_modules/express' ),
settings = require('../../etherpad/src/node/utils/Settings' );

var Changeset = require("../../etherpad/src/static/js/Changeset");

exports.eejsBlock_styles = function( hook_name, args, cb ) {
	args.content = args.content + "<link href='../static/plugins/ep_wallace/static/css/style.css' rel='stylesheet'/>";
	return cb();
}

exports.eejsBlock_body = function( hook_name, args, cb ) {
	args.content = args.content + eejs.require("ep_wallace/templates/font-icon-dropdown.ejs");
	return cb();
}

exports.eejsBlock_scripts =function ( hook_name, args, cb ) {
	return cb();
}

exports.eejsBlock_editbarMenuLeft = function ( hook_name, args, cb ) {
	args.content = args.content + eejs.require("ep_wallace/templates/buttons.ejs");
	return cb();
}
exports.eejsBlock_editbarMenuRight = function ( hook_name, args, cb ) {
	args.content = args.content + eejs.require("ep_wallace/templates/buttons-ext.ejs");
	return cb();
}

exports.getLineHTMLForExport = function (hook, context) {
  var header = __analyzeLine(context.attribLine, context.apool);
  if (header) {
    var inlineStyle = __getInlineStyle(header);
    return "<" + header + " style=\"" + inlineStyle + "\">" + context.text.substring(1) + "</" + header + ">";
  }
}


function __getInlineStyle( header ) {
	switch (header) {
	case "h1":
		return "font-size: 2.0em;line-height: 120%;";
		break;
	case "h2":
		return "font-size: 1.5em;line-height: 120%;";
		break;
	case "h3":
		return "font-size: 1.17em;line-height: 120%;";
		break;
	case "h4":
		return "line-height: 120%;";
		break;
	case "h5":
		return "font-size: 0.83em;line-height: 120%;";
		break;
	case "h6":
		return "font-size: 0.75em;line-height: 120%;";
		break;
	case "code":
		return "font-family: monospace";
	}

	return "";
}

function __analyzeLine(alineAttrs, apool) {
  var header = null;
  if (alineAttrs) {
    var opIter = Changeset.opIterator(alineAttrs);
    if (opIter.hasNext()) {
      var op = opIter.next();
      header = Changeset.opAttributeValue(op, 'heading', apool);
    }
  }
  return header;
}