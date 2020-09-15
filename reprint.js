const PRINT_CHILDREN_SEPARATELY = false;

const convertEntry = (obj) => {
	const result = {};
	result.title = obj.title;
	result.text = obj.text;
	result.tags = obj.tags;
	result.children = [];
	return result;
};

const convert = (obj) => {
	const index = {};
	const result = {};

	for (let key in obj)
		result[key] = convertEntry(obj[key]);

	for (let key in obj)
		for(let childName of obj[key].children)
			result[key].children.push(result[childName]);

	for (let entry of Object.values(result)){
		for (let tag of entry.tags){
			if(!index.hasOwnProperty(tag))
				index[tag] = [];
			index[tag].push(entry);
		}
	}

	return {
		index,
		result
	};
};

const PrintChildren = Object.freeze({"Nothing" : 0, "NamesOnly" : 1, "Recursive": 2});
const PrintRepeats = Object.freeze({"Yes" : 0, "No" : 1});

const renderEntry = (obj, childrenPolicy) => {
	let childrenText = "";
	if(obj.children.length > 0){
		if(childrenPolicy == PrintChildren.NamesOnly){
			childrenText = `
				<section>
					<h1>Children</h1>
					<ul>
						${obj.children.map(child => `<li>${child.title}</li>`).join("\n")}
					</ul>
				</section>`;
		} else if(childrenPolicy == PrintChildren.Recursive) {
			// this is dangerous, it doesn't check for cycles
			childrenText = `
				<section>
					<h1>Children</h1>
					<ul>
						${obj.children.map(child => `<li>${renderEntry(child, childrenPolicy)}</li>`).join("\n")}
					</ul>
				</section>`;
		}
	}
	return (
	`<article>
		<h1>${obj.title}</h1>
		<p><small>tags: ${obj.tags.join(', ')}</small></p>
		<pre>${obj.text}</pre>
		${childrenText}
	</article>`);
};

const accumulateVisited = (entry, out) => {
	out.add(entry);
	for(let child of entry.children)
		if(!out.has(child))
			accumulateVisited(child, out);
};

const accumulateChildren = (entry, out) => {
	for(let child of entry.children)
		if(!out.has(child))
			accumulateVisited(child, out);
};

const renderEntryArray = (arr, childrenPolicy, repeatsPolicy) => {
	let doNotRender = new Set;

	if(repeatsPolicy == PrintRepeats.No)
		for(let entry of arr)
			accumulateChildren(entry, doNotRender);

	let contentStrings = [];
	for(let entry of arr)
		if(!doNotRender.has(entry)) 
			contentStrings.push(renderEntry(entry, childrenPolicy));

	return contentStrings.join("\n");
};


const renderTagCategory = (name, content) => {
	return `
		<h1 id="${name}">${name}</h1>
		${renderEntryArray(content, PrintChildren.NamesOnly, PrintRepeats.Yes)}`;
};

const renderTagView = (index) => {
	return `
	<article>
		<a href="item-view.html"> Go to item view </a>
	</article>
	<article>
		<h1>Tags</h1>
		<ul>
			${ Object.keys(index)
				.map(tag => `<li><a href="#${tag}">${tag}</a></li>`)
				.join("\n") }
		</ul>
	</article>
	<hr>
	${ Object.entries(index)
		.map((category) => renderTagCategory(...category))
		.join("\n") }`;
};

const renderNormalView = (entries) => {
	return `
	<article>
		<a href="tag-view.html"> Go to tag view </a>
	</article>
	${ renderEntryArray(
		Object.values(entries),
		PrintChildren.Recursive,
		PrintRepeats.No) }`;
};

const HTMLBoilerplate = content => `
<html>
	<head>
		<link rel="stylesheet" href="styles.css">
	</head>
	<body>
		${content}
	</body>
</html>`;

const input = require("./project.json");


const data = convert(input);

const fs = require('fs');

const passError = err => { if(err) throw err; };
fs.writeFile("./tag-view.html", HTMLBoilerplate(renderTagView(data.index)), passError);
fs.writeFile("./item-view.html", HTMLBoilerplate(renderNormalView(data.result)), passError);
