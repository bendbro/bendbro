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

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}

function extractRootDomain(domain) {
	var domainSplit = domain.split('.');
	return domainSplit[domainSplit.length-2] + "." + domainSplit[domainSplit.length-1];
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
		return {node:nodel, depth:depth, matching:hits};
	} else {
		var min = {depth:999999,matching:0};
		for(childNodeIndex in nodel.childNodes) {
			var cNode = nodel.childNodes[childNodeIndex];
			if(cNode != last) {
				var cFound = findTextField(cNode, nodel, depth+1);
				if(cFound.depth < min.depth || (cFound.depth == min.depth && cFound.matching > min.matching)) {
					min = cFound;
				}
			}
		}
		
		var pNode = nodel.parentNode;
		if(pNode != last) {
			var pFound = findTextField(pNode, nodel, depth+1);
			if(pFound.depth < min.depth || (pFound.depth == min.depth && pFound.matching > min.matching)) {
				min = pFound;
			}
		}
		
		return min;
	}
}

function injectMain(credentials) {
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
	var pFound = findTextField(maxCandidate.password.k.parentNode, maxCandidate.password.k, 0);
	
	maxCandidate.password.k.style.backgroundColor = "#3F51B5";
	pFound.node.style.backgroundColor = "#2196F3";
	
	pFound.node.value = credentials.username;
	maxCandidate.password.k.value = credentials.password;
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
	
	//using chrome.tabs api
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	  console.log("a tab was updated");
		
	  var tabRootDomain = extractRootDomain(extractDomain(tab.url));
	  var matchingCredentials = null;
	  for(entryIndex in data) {
		  var entry = data[entryIndex];
		  if(entry.domain.indexOf(tabRootDomain) > -1) {
			  matchingCredentials = entry;
		  }
	  }
	  
	  if(matchingCredentials != null) {
		  console.log({action:"injecting script.",tab:tab,credentials:matchingCredentials});
		  chrome.tabs.executeScript(tab.id,{
			code: 
				'console.log("executing injected script")' + '\n' +
				findTextField.toString() + '\n' + 
				findPasswordFields.toString() + '\n' + 
				injectMain.toString() + '\n' + 
				'injectMain(' + JSON.stringify(matchingCredentials) + ');' + '\n'
		  });
	  }
	});
})});