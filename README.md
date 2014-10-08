tp
==

**tp** is a DOM-based templating engine. It works by visiting DOM elements, their attributes and text nodes, interpolating strings and applying attribute-based directives on scoped data. It has no dependencies other than some ES5 methods and its own fill.js, which provides string interpolation. 

tp does not offer data binding or any other advanced functionality out of the box. New stuff can be added registering directives that implement it, and tp exposes some of its internal methods to allow reuse and composition of templating routines.

## Usage

This library is written with a module definition wrapper that will do fine in AMD and Node environments, and when in lack of either, it will expose itself as the `tp` global variable. So, `require()` it or just place a `<script>` tag referencing it.

The function looks like this:

	tp(templateElement, data, options) // returns Element

- `templateElement`: a DOM element or a CSS selector.
- `data`: any type of data you want to use as scope for all the expressions and directives you will use throughout the template element.
- `options`: an object containing options for the templating engine itself or your own directives. Recognized options are:
	- `context`: an object containing properties to be used as variables inside the evaluation context of directive expressions and interpolated expressions. You can put template-wide data or utility functions without the need to craft a data object every time.

### 

	<body>
		<div id="templates">
			<section class="post-list" repeat="posts">
				<article class="post">
					<h1>{{title}}</h1>
					<p>{{extract}}</p>
					<p>By {{author.name}}</p>
				</article>
			</section>
		</div>
	</body>
	
	var data = {
		posts: [
			{title: "Hello World!", extract: "Lorem ipsum, as usual.", author: {name: "roeltz"}},
			{title: "Welcome to tp()", extract: "Check it out at GitHub", author: {name: "roeltz"}},
		]
	}; 
	var template = document.querySelector("#templates .post-list");
	var list = tp(template, data);
	document.body.appendChild(list);

As you can see, we have a built-in *repeat* directive in that `section.post-list` that takes the `posts` array in the scoped data, and then just repeats whatever is inside it for every item in the array. Inside the repeated markup, the scope changes to that of the item properties.

## Directives

Directives are functions that are called on the element they are placed in, so they can perform any tranformations on it, such as changing style attributes, adding event listeners, mutating its internal tree or even discarding it altogether. They are processed in the order they appear in the source

tp ships with some built-in directives:

- `skip`: it just skips the current element during evaluation. It's useful when a template elements contains subtemplates, which can't be processed under the same data scope.
- `context="expression"`: Overrides the data scope inside the element. Mainly  to eliminate levels of indirection 
- `if="expression"`: It retains the element if the expression is true, and removes it otherwise.
- `repeat="expression"`: It repeats the same element for every item of the array that the expression evaluates to.

### Writing one yourself

You can define your own directives calling `tp.directive(name, [options], callback)`

- `name` is the name of the attribute you will be using in the markup.
- `options` is an object containing any of these properties:
	- `literal`: indicates whether the value of the attribute representing the directive must be used as is, and not evaluated as a JavaScript expression in the current data scope.
	- `defer`: indicates that the directive callback must be called in the next event loop, hopefully, when the element has been already appended to the document. This should be `true` when the directive depends on layout properties, ancestor elements being present or others directives being applied before it.
	- `isolate`: tells the engine to stop string interpolation at the element where the directive is placed. This allows to treat the element like a template for later use. This should be `true` when your directive makes something drastic, like removing the element, replacing it with another element(s) or changing the scoped data.
	- `preserve`: it extends `isolate`, telling the engine not to do anything after the *preserving* directive is applied. Setting this option to `true` also sets `isolate` on. 
- `callback`: a function implementing the directive. It must have these four parameters:
	- `element`: the element to act upon.
	- `expression`: the value of the directive attribute used in the markup. You should expect any type of value for this parameter, unless `{literal: true}`, where you just get a string.
	- `data`: this is the currently scoped data where expressions and general logic of the directive should work on. Please, try not to mutate this, unless the directive really *is* meant to.
	- `options`: this parameter will get you the options passed to tp(), and default values for those omitted. Don't hesitate to make your directives respond to these options.

#### Minimal example

This is how you would define a directive that changes the text color of an element:

	<div color="red">
		This text will be red
	</div>

	tp.directive("color", function(element, value, data, options){
		element.style.color = value;
	});

## Additional methods

tp exposes some functionality that can be used inside directives or to kick off the templating engine in other ways.

- `tp.apply(directiveName, element, expression, data, options)`: applies a directive that is not necessarily placed on the element. Be careful to provide the expression value as expected by the directive (e.g. `repeat` always expects an array).
- `tp.evaluate(expression, data, context)`: it evaluates a JavaScript expression string scoped to some data and an optional context object. With this method you get the same behavior of the engine when evaluating directive attribute values.
- `tp.replace(templateElement, data, options)`: it's the same as invoking `tp()` itself, but the resulting element will replace the template element on the document. It's handy when your template would be used only once.
- `tp.process(element, data, options)`: instead of making a clone of the template element to act upon, this just uses the passed element as the raw material. It's like `tp.replace()` without the overhead of creating a new element. If anyone asks the diference between the two, I wouldn't know what to answer.
- `tp.context(originalOptions, additionalContext)`: this lets you merge new values in the context option, without you doing it yourself, but also, not affecting the original options object, which can be an unwanted behavior when a directive deals with subrendering of other templates.

## fill.js

`fill.js` is a string interpolation microlibrary, which takes strings with expression placeholders, compiles them to JavaScript code, and then runs them scoped to passed data. It's ok to use standalone. Someday I'll make it optional, so you can interpolate strings with your favorite library. Right now, let's stick to it.
