console.log('content page script');

function textifyAttributes(element) {
	var textified = "?";
	if(element.nodeName != null) {
		var textified = element.nodeName + " ";
	}
	if(element.attributes != null) {
		for(var i = 0; i < element.attributes.length; i++) {
			if(element.attributes[i].name != null) {
				textified += element.attributes[i].name
				if(element.attributes[i].value != null) {
					textified += "=" + element.attributes[i].value + " ";
				} else {
					textified += " "
				}
			}
		}
	}
	return textified;
}

function collectNearby(element,maxDepth,excludedTypes,comingFrom,depth) {
	depth = depth || 0;
	comingFrom = comingFrom || null;
	excludedTypes = excludedTypes || new Set();
	
	var collected = [];
	if(depth < maxDepth) {
		collected.push({node:element,depth:depth});
		if(element.childNodes != null) {
			for(var i = 0; i < element.childNodes.length; i++) {
				var child = element.childNodes[i];
				if(child != comingFrom && !excludedTypes.has(child.nodeName)) {
					collectNearby(child,maxDepth,excludedTypes,element,depth+1).forEach(function(item) {
						collected.push(item);
					});
				}
			}
		}
		
		var parent = element.parentNode;
		if(parent != null) {
			if(parent != comingFrom && !excludedTypes.has(parent.nodeName)) {
				collectNearby(parent,maxDepth,excludedTypes,element,depth+1).forEach(function(item) {
					collected.push(item);
				});
			}
		}
	}
	return collected;
}

function filterHighestRanked(collection, ranker, count) {
	var highest = -99999999;
	var result = null;
	collection.forEach(function(element) {
		var rank = ranker.rank(element);
		if(rank > highest) {
			highest = rank;
			result = element;
		}
	});
	return result;
}

var usernameKernel = {name:{
						id:2.0,
						name:1.0,
						type:2.0,
					},value:{
						username:1.0,
						user:1.0,
						email:1.0
					}};

var passwordKernel = {name:{
						id:2.0,
						name:1.0,
						type:2.0
					},value:{
						password:1.0,
						pass:1.0,
					}};
var DOMFormFieldRanker = function(kernel) {
	this.rank = function(collected) {
		var rank = -99999999;
		rank -= collected.depth * .05; //TODO: fix hack
		if(collected.node.nodeName == "input") {
			rank += 1;
		}
		if(collected.node.attributes != null) {
			for(var i = 0; i < collected.node.attributes.length; i++) {
				var attribute = collected.node.attributes[i];
				rank += (kernel.name[attribute.name] || 0) * (kernel.value[attribute.value] || 0);
			}
		}
		return rank;
	}
}

var DOMFormChanges = function(element) {
	var nearby = collectNearby(element,10,new Set(),element.parent);
	var password = filterHighestRanked(nearby, new DOMFormFieldRanker(passwordKernel));
	if(password != null) {
		password.node.style.backgroundColor = "red";
	}
	var username = filterHighestRanked(nearby, new DOMFormFieldRanker(usernameKernel));
	if(username != null) {
		username.node.style.backgroundColor = "blue";
	}
	
	element.onsubmit = function(ev) {
		ev.preventDefault();
		console.log(element);
		console.log(password.node);
		console.log(username.node);
	};
};


window.setTimeout(function() {
	console.log('ayyy');
	var forms = document.getElementsByTagName("form");
	for(var i = 0; i < forms.length; i++) {
		var form = forms[i];
		var domChanges = new DOMFormChanges(form);
	}
}, 1000);
/*
chrome.runtime.sendMessage(
{
	messageKind:'password-request'
}, function(response) {
	
});

chrome.runtime.sendMessage(
{
	messageKind:'password-save'
	
}, function(response) {
	
});
*/