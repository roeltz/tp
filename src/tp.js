(function(root, factory){
	
	if (typeof define === 'function' && define.amd)
        define("tp", ["fill"], factory);
	else if (typeof module === 'object' && typeof define !== 'function')
        module.exports = factory(require("./fill"));
	else
		root.tp = factory(root.fill);
	
})(this, function(fill){

var ELEMENT = 1;
var TEXT = 3;

var defaults = fill.defaults;
var defaultOptions = {};
var directives = {};
var isolated = {};
var preserved = {};

function addDirective(name, options, fn) {
	if (typeof options == "function") {
		fn = options;
		options = undefined;
	}
	
	options = options || {};
	
	directives[name] = {
		fn: fn,
		evaluate: !options.literal,
		defer: options.defer
	};
	
	if (options.isolate || options.preserve) {
		isolated[name] = true;
	}
	
	if (options.preserve) {
		preserved[name] = true;
	}
}

function evaluateExpression(___e, ___d, ___c) {
	return (function(){
		with(___c || {}) {
			with(this) {
				try {
					return eval(___e);
				} catch(___x) {}
			}
		}
	}).call(___d || {});
}

function isPermeable(e) {
	for (var i = 0, a = e.attributes, l = a.length; i < l; i++) {
		if (a[i].name in isolated) {
			return false;
		}
	}
	return true;
}

function isWalkable(e) {
	for (var i = 0, a = e.attributes, l = a.length; i < l; i++) {
		if (a[i].name in preserved) {
			return false;
		}
	}
	return true;
}

function fillElement(e, data, options) {
	for (var i = 0, a = e.attributes || [], l = a.length; i < l; i++) {
		a[i].value = fill(a[i].value, data, options);
	}

	for (var i = 0, c = e.childNodes, l = c.length; i < l; i++) {
		var ch = c[i];
		if (ch.nodeType == TEXT) {
			ch.nodeValue = fill(ch.nodeValue, data, options);
		} else if (ch.nodeType == ELEMENT && isPermeable(ch)) {
			fillElement(ch, data, options);
		}
	}
}

function applyDirective(name, e, expression, data, options) {
	var dir = directives[name];
	options = options || {};

	if (dir.evaluate && typeof expression == "string") {
		expression = expression ? evaluateExpression(expression, data, options.context) : data;
	}
		
	e.removeAttribute(name);
	
	if (dir.defer) {
		setTimeout(dir.fn, 0, e, expression, data, options);
	} else {
		return dir.fn(e, expression, data, options);
	}
}

function processDirectives(e, data, options) {
	var a = Array.prototype.slice.call(e.attributes);
	for (var i = 0, l = a.length; i < l; i++) {
		if (a[i].name in directives) {
			var r = applyDirective(a[i].name, e, a[i].value, data, options);console.log("AFTER", a[i].name, options);
			if (typeof r != "undefined" && r !== e) {
				if (e.parentNode) {
					if (r)
						e.parentNode.insertBefore(r, e);
					e.parentNode.removeChild(e);
				}
				return r;
			} else if (a[i].name in preserved) {
				return e;
			}
		}
	}
	return e;
}

function processChildElements(e, data, options) {
	for (var i = 0, c = e.childNodes; i < c.length; i++) {
		if (c[i].nodeType == ELEMENT) {
			processElement(c[i], data, options);
		}
	}	
}

function processElement(e, data, options) {
	var permeable = isPermeable(e);
	var walkable = isWalkable(e);

	options = options || {};

	if (permeable)
		fillElement(e, data, options);
	
	e = processDirectives(e, data, options);
	
	if (e && walkable)
		processChildElements(e, data, options);
	
	return e;
}

function element(t) {
	if (typeof t == "string")
		t = document.querySelector(t);
	return t.cloneNode(true);
}

function template(t, data, options) {
	return processElement(element(t), data, defaults(defaultOptions, options));
}

template.apply = applyDirective;
template.directive = addDirective;
template.evaluate = evaluateExpression;
template.process = processElement;

template.children = function(e) {
	return Array.prototype.slice.call(e.childNodes).filter(function(n){
		return n.nodeType == ELEMENT;
	});
};

template.context = function(options, context) {
	options = options || {};
	return defaults(options, {
		context: defaults(options.context, context)
	});
};

template.empty = function() {
	return document.createDocumentFragment();
};

template.nodes = function(nodes) {
	return Array.prototype.slice.call(nodes);
};

template.query = function(selector, context) {
	return template.nodes((context || document).querySelectorAll(selector));
};

template.replace = function(t, data, options) {
	options = options || {};
	var e = template(t, data, options);
	t.parentNode.insertBefore(e, t);
	t.parentNode.removeChild(t);
	return e;
};

template.directive("skip", {preserve: true}, function(){});
		
template.directive("context", {preserve: true}, function(e, context, data, options){
	return template(e, context, options);
});

template.directive("if", function(e, condition, data, options){
	if (!condition)
		return template.empty();
});

template.directive("repeat", {preserve: true}, function(e, items, data, options){
	var fragment = document.createDocumentFragment();
	if (items && items.length) {
		for (var i = 0; i < items.length; i++) {
			var ch = template(e, items[i], template.context(options, {
				"$0": i,
				"$1": i + 1
			}));
			fragment.appendChild(ch);
		}
	}
	return fragment;
});

return template;

});