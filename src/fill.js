(function(root, factory){
	
	if (typeof define === 'function' && define.amd)
        define("fill", factory);
	else if (typeof module === 'object' && typeof define !== 'function')
        module.exports = factory();
	else
		root.fill = factory();
	
})(this, function(){
	
var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
var escapes = {
	"'":      "'",
	'\\':     '\\',
	'\r':     'r',
	'\n':     'n',
	'\t':     't',
	'\u2028': 'u2028',
	'\u2029': 'u2029'
};

var defaultOptions = {
	expression: /\{\{([\s\S]+?)\}\}/gm,
	escape: function(x){ return x; }
};
var globalContext = {};

function defaults() {
	var result = {};
	Array.prototype.forEach.call(arguments, function(arg){
		if (arg)
			for(var k in arg)
				result[k] = arg[k];
	});
	return result;
}

function literal(string, index, offset) {
	return string.slice(index, offset).replace(escaper, function(m){
		return "\\" + escapes[m];
	});
}

function compile(string, options) {
	var index = 0;
	var source = ["var ___b='';\n", "with(this){\n", "___b='"];
	
	string.replace(options.expression, function(match, expression, offset){
		source.push(literal(string, index, offset));
		source.push("'+(function(){try{return ___e(" + expression + ")}catch(___x){return ''}}).call(this)+'");
		index = offset + match.length;
		return match;
	});
	
	source.push(literal(string, index, string.length));
	source.push("';\n}\nreturn ___b;\n");
	source = source.join("");

	return source;
}

function link(source, context) {
	var args = [];
	var values = [];

	for (var k in context) {
		args.push(k);
		values.push(context[k]);
	}
	args.push(source);
	
	return function(data){
		var fn = Function.apply(null, args);
		return fn.apply(data, values);
	};
}

function fill(string, data, options) {
	options = defaults(defaultOptions, options);
	
	if (!options.expression.test(string))
		return string;
	
	var source = compile(string, options);
	var context = defaults(globalContext, defaultOptions.context, options.context, {
		___e: options.escape
	});
	var fn = link(source, context);
	return fn(data);
}

fill.compile = compile;
fill.defaults = defaults;
fill.link = link;

fill.configure = function(options) {
	defaultOptions = defaults(defaultOptions, options);
};

fill.context = function(object) {
	for (var key in object)
		globalContext[key] = object[key];
};

return fill;

});
