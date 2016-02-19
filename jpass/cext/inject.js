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
    maxDepth = maxDepth || 99999999; // TODO: maxint
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

function getElementInfo(element) {
    var info = {};

    var attributes = {};
    if(element.attributes != null) {
        for(var i = 0; i < element.attributes.length; i++) {
			attributes[element.attributes[i].name] = attributes[element.attributes[i].value];
        }
    }
    info.attributes = attributes;

    if(element.tagName != null) {
        info.tagName = element.tagName;
    }

    return info;
}

function getElementInfoChain(element) {
    var chain = [];
    var pelement = element.parentNode;
    while(pelement != null) {
        chain.push(getElementInfo(pelement));
        pelement = pelement.parentNode;
    }
    return chain;
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

var FormUserPassHandler = function(element) {
	var nearby = collectNearby(element,10,new Set('iframe'),element.parent);
	var password = filterHighestRanked(nearby, new DOMFormFieldRanker(passwordKernel));
	var username = filterHighestRanked(nearby, new DOMFormFieldRanker(usernameKernel));

	if(username != null && password != null) {
		var filledUsername = null;
		var filledPassword = null;
		username.node.style.backgroundColor = "#EE82EE";
		password.node.style.backgroundColor = "#EE82EE";
		
		chrome.runtime.sendMessage({
			reason:"request-credentials"
		}, function(response) {
			console.log(response);
			if(response.credentials) {
				filledUsername = response.credentials.usernameValue;
				filledPassword = response.credentials.passwordValue;
				username.node.value = filledUsername;
				password.node.value = filledPassword;
			}
		});
		
		element.addEventListener("change", function(ev) {
			if(username.node.value != "" && password.node.value != "") {
				chrome.runtime.sendMessage({
					reason:"submit-credentials",
					credentials: {
						kind:"user-pass",
						usernameValue:username.node.value,
						passwordValue:password.node.value
					}
				});
			}
		}, true);
	}
};

function nodeScriptReplace(node) {
        if ( nodeScriptIs(node) === true ) {
                node.parentNode.replaceChild( nodeScriptClone(node) , node );
        }
        else {
                var i        = 0;
                var children = node.childNodes;
                while ( i < children.length ) {
                        nodeScriptReplace( children[i++] );
                }
        }

        return node;
}
function nodeScriptIs(node) {
        return node.tagName === 'SCRIPT';
}
function nodeScriptClone(node){
        var script  = document.createElement("script");
        script.text = node.innerHTML;
        for( var i = node.attributes.length-1; i >= 0; i-- ) {
                script.setAttribute( node.attributes[i].name, node.attributes[i].value );
        }
        return script;
}

var JPassModal = function(onResult) {
	var jpassui = document.createElement('div'); 
	jpassui.style.width = '100%';
	jpassui.style.height = '5%';
	jpassui.style.minHeight = '75px';
	jpassui.style.position='fixed';
	jpassui.style.top='0px';
	jpassui.style.left='0px';
	jpassui.style.zIndex = Number.MAX_SAFE_INTEGER - 1000; //ample space for additional extensions
	jpassui.setAttribute('hidden',null);
	var jpiframe = document.createElement('iframe');
	jpiframe.style.width = '100%';
	jpiframe.style.height = '100%';
	jpiframe.setAttribute('frameBorder','0');
	jpiframe.setAttribute('scrolling','no');
	jpiframe.setAttribute('allowtransparency',"true");
	jpiframe.src = chrome.extension.getURL('prompt.html');
	jpassui.appendChild(jpiframe);
	document.body.appendChild(jpassui);
	
	this.closeModal = function() {
		console.log('close');
		jpassui.setAttribute('hidden',null);
	}
	
	var closeModal = this.closeModal;
	this.openModal = function(content, messageHandle) {
		console.log('open');
		jpassui.messageHandle = messageHandle;
		jpiframe.contentWindow.postMessage(content,"*");
		jpassui.removeAttribute('hidden');
		addEventListener("message", function(event) {
			closeModal();
			if(event.data != "dismissed") {
				console.log('event!');
				console.log(event);
				messageHandle({
					reason:"prompt-user",
					prompt: {
						kind:event.data,
					}
				});
			}
		});
	}
};

function attachListeners() {
	var jpassmodal = new JPassModal();
	chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
		console.log(message);
		if(message.reason == 'prompt-user') {
			if(message.prompt.kind == 'open') {
				jpassmodal.openModal(message.prompt.content, sendResponse);
			} else if(message.prompt.kind == 'close') {
				jpassmodal.closeModal();
			}
		}
		return true;
	});
	
    var forms = document.getElementsByTagName("form");
	var injectors = new Map();
    var handlers = new Map();
    for(i = 0; i < forms.length; i++) {
        handlers.set(forms[i],new FormUserPassHandler(forms[i]));
    }
}

if(document.readyState != "complete") {
    window.addEventListener("load",attachListeners,false);
} else {
    attachListeners();
}