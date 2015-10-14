function loadScript(path, callback) {
	// Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';

	var chromeId = chrome.runtime.id;
    //script.src = "chrome-extension://" + chrome.runtime.id + "/" + path;
	script.src = path;

    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}


function findPasswordFields(candidates, node) {
	var nodel = node;
	var passwordIdentifiers = [{k:"password",v:1.0},{k:"pw",v:.5},{k:"pword",v:.25},{k:"pass",v:.1}];
	
	var attrs = nodel.attributes;
	var hits = 0;
	if(attrs != null) {
		for(var i = attrs.length - 1; i >= 0; i--) {
			for(piIndex in passwordIdentifiers) {
				if(attrs[i].value.toLowerCase().indexOf(passwordIdentifiers[piIndex].k) > -1) {
					hits += passwordIdentifiers[piIndex].v;
				}
			}
		}
	}
	
	if(hits > 0) {
		candidates.push({password:{k:nodel,v:hits}});
	}

	for(childNodeIndex in nodel.childNodes) {
		var childNodeIndexL = childNodeIndex;
		findPasswordFields(candidates, nodel.childNodes[childNodeIndexL]);
	}
}

function findTextField(node, last, depth) {
	if(node == null) {
		return 999999;
	}
	
	var nodel = node;
	var textIdentifiers = [{k:"email",v:1.0},{k:"text",v:1.0}];
	
	var attrs = nodel.attributes
	var hits = 0;
	if(attrs != null) {
		for(var i = attrs.length - 1; i >= 0; i--) {
			for(tiIndex in textIdentifiers) {
				if(attrs[i].value.indexOf(textIdentifiers[tiIndex].k) > -1) {
					hits += textIdentifiers[tiIndex].v;
				}
			}
		}
	}
	
	if(hits > 0) {
		return {node:nodel, depth:depth};
	} else {
		var minDistance = 999999;
		var minNode = null;
		for(childNodeIndex in nodel.childNodes) {
			var cNode = nodel.childNodes[childNodeIndex];
			if(cNode != last) {
				var cFound = findTextField(cNode, nodel, depth+1);
				if(cFound.depth < minDistance) {
					minDistance = cFound.depth;
					minNode = cNode;
				}
			}
		}
		
		var pNode = nodel.parentNode;
		if(pNode != last) {
			var pFound = findTextField(pNode, nodel, depth+1);
			if(pFound.depth < minDistance) {
				minDistance = pFound.depth;
				minNode = pNode;
			}
		}
		
		return {node:minNode, depth:minDistance};
	}
}

function findCredentials() {
	var candidates = [];
	findPasswordFields(candidates,document.body);
	
	var maxLiklihood = 0;
	var maxCandidate = null;
	for(candidatesIndex in candidates) {
		var candidate = candidates[candidatesIndex];
		if(candidate.password.v > maxLiklihood) {
			maxLiklihood = candidate.password.v;
			maxCandidate = candidate;
		}
	}

	maxCandidate.password.k.style.backgroundColor = "red";

	var pFound = findTextField(maxCandidate.password.k, maxCandidate.password.k, 0);
	
	return {text:pFound.node,password:maxCandidate.password.k};
}

var client = 1337;
var data = [];
var model = null;
var masterPassword = null;
loadScript("resources/dropbox.min.js",function() {
loadScript("resources/ModelView.js", function() {
	client = new Dropbox.Client({key:"q29ccmrl21l9e71"});
	client.authDriver(new Dropbox.AuthDriver.ChromeExtension({receiverPath: "/resources/chrome_oauth_receiver.html"}));
	model = new JsObjectModel(data);
	
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	  chrome.tabs.executeScript(tab.id,{
		code: findTextField.toString() + '\n' + findPasswordFields.toString() + '\n' + findCredentials.toString() + '\n' + 'console.log("here we go");console.log(findCredentials());'
	  });
	});

	chrome.tabs.onCreated.addListener(function(tabId, changeInfo, tab) {
	  chrome.tabs.executeScript(tab.id,{
		code: findTextField.toString() + '\n' + findPasswordFields.toString() + '\n' + findCredentials.toString() + '\n' + 'console.log("here we go");console.log(findCredentials());'
	  });
	});
})});