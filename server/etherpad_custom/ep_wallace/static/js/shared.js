var tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'];

exports.collectContentPre = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = tags.indexOf( tname );

  if(tagIndex >= 0){
    lineAttributes['heading'] = tags[tagIndex];
  }
};

// never seems to be run
exports.collectContentPost = function(hook, context){
  var tname = context.tname;
  var state = context.state;
  var lineAttributes = state.lineAttributes
  var tagIndex = tags.indexOf( tname );

  if(tagIndex >= 0){
    delete lineAttributes['heading'];
  }
};
