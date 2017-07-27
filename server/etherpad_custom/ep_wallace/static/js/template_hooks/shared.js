exports.collectContentPre = function(hook, context){
	var lineAttributes = context.state.lineAttributes;
	if (context.cls) {
		lineAttributes['template'] = context.cls; 
	}
};

// never seems to be run
exports.collectContentPost = function(hook, context){
	var lineAttributes = context.state.lineAttributes;
	delete lineAttributes['template'];
};
