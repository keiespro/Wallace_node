var escape = {};

escape.escapeHtml = function( string ) {

	var newstring = string.replace( "&", "&amp;" ).replace( '"', '&quot;' ).replace( "'", "&#39;" ).replace( "<", "&lt;" ).replace( ">", "&gt;" );
	return newstring;
};

escape.escapeBack = function( string ) {
	var newstring = string.replace( '&quot;', '"' ).replace( "&#39;", "'" ).replace( "&lt;", "<" ).replace( "&gt;", ">" ).replace( "&amp;", "&" );
	return newstring;
}

exports.escape = escape;