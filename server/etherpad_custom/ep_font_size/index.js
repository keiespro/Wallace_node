var eejs = require('../../etherpad/src/node/eejs/');
var sizes = [ "fs12", "fs16", "fs28", "fs40" ];

/******************** 
* UI 
*/ 
exports.eejsBlock_editbarMenuLeft = function (hook_name, args, cb) {
  // args.content = args.content + eejs.require("ep_font_size/templates/editbarButtons.ejs");
  // content will be added from ep_wallace plugin
  return cb();
}

exports.eejsBlock_dd_format = function (hook_name, args, cb) {
  args.content = args.content + eejs.require("ep_font_size/templates/fileMenu.ejs");
  return cb();
}


/******************** 
* Editor
*/

// Allow <whatever> to be an attribute 
exports.aceAttribClasses = function(hook_name, attr, cb){
  attr.fs12 = 'tag:fs12';
  attr.fs16 = 'tag:fs16';
  attr.fs28 = 'tag:fs28';
  attr.fs40 = 'tag:fs40';
  cb(attr);
}

/******************** 
* Export
*/
// Include CSS for HTML export
exports.stylesForExport = function(hook, padId, cb){
  var css = "fs12{font-size:12px};"+
            "fs16{font-size:16px;}"+
            "fs28{font-size:28px;}"+
            "fs40{font-size:40px;}"
  cb(css);
};

// Add the props to be supported in export
exports.exportHtmlAdditionalTags = function(hook, pad, cb){
  cb(sizes);
};


exports.asyncLineHTMLForExport = function (hook, context, cb) {
  cb(rewriteLine);
}

function rewriteLine(context){
  var lineContent = context.lineContent;
  sizes.forEach(function(size){
    size = size.replace("fs","");
    if(lineContent){
      lineContent = lineContent.replaceAll("<fs"+size, "<span style='font-size:"+size+"px'");
      lineContent = lineContent.replaceAll("</fs"+size, "</span");
    }
  });
  return lineContent;
}

String.prototype.replaceAll = function(str1, str2, ignore) 
{
  return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
} 
