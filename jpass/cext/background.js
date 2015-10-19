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

var passwordIdentifiers = [{k:"password",v:1.0},{k:"pw",v:.5},{k:"pword",v:.25},{k:"pass",v:.1}];
var usernameIdentifiers = [{k:"email",v:1.0},{k:"text",v:1.0}];

function targetLiklihood(node, identifiers) {
	var attrs = node.attributes;
	var hits = 0;
	if(attrs != null) {
		for(var i = attrs.length - 1; i >= 0; i--) {
			for(piIndex in identifiers) {
				if(attrs[i].value.toLowerCase().indexOf(identifiers[piIndex].k) > -1) {
					hits += identifiers[piIndex].v;
				}
			}
		}
	}
	return hits;
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

function autofillPasswords(credentials) {
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

function relayMessage(message) {
	alert(JSON.stringify(message));
	chrome.runtime.sendMessage({kind:"credential submit",value:message},function(response) {
		alert("ayy lmao");
	});
}

function submitListener(form, userNode, passNode) {
	form.injectuserNode = userNode;
	form.injectpassNode = passNode;
	
	this.listen = function() {
		console.log(this);
		relayMessage({
			username:this.injectuserNode.value, 
			password:this.injectpassNode.value,
			location:extractRootDomain(extractDomain(window.location.href))
		});
	}
}

function attachFormListeners(form, node) {
	var forms = document.getElementsByTagName("form");
	for(var formIndex in forms) {
		var form = forms[formIndex];
		
		var candidates = [];
		findPasswordFields(candidates,form);
			
		var maxLiklihood = 0;
		var maxCandidate = null;
		for(candidatesIndex in candidates) {
			var candidate = candidates[candidatesIndex];
			if(candidate.password.v > maxLiklihood) {
				maxLiklihood = candidate.password.v;
				maxCandidate = candidate;
			}
		}
		
		if(maxCandidate != null) {
			var pFound = findTextField(maxCandidate.password.k.parentNode, maxCandidate.password.k, 0);
			if(pFound.node != null) {
				form.onsubmit = new submitListener(form,pFound.node,maxCandidate.password.k).listen;
			}
		}
	}
}

function injectedCodeMain(credentials) {
	autofillPasswords(credentials);
	attachFormListeners();
}

//TODO: random password generate right click menubar
//TODO: onsubmit user/password/domain scraping
//TODO: subdomain vs domain selection
//TODO: make extension sync with webpage (refresh button?).
//TODO: modal password injection
//TODO: consider non-programatic injection via contentscripts

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
			//todo: group into classes to reduce injection length
			code: 
				'console.log("executing injected script");\n' +
				'passwordIdentifiers='+JSON.stringify(passwordIdentifiers) + ';\n' +
				'usernameIdentifiers='+JSON.stringify(usernameIdentifiers) + ';\n' +
				extractDomain.toString() + '\n' +
				extractRootDomain.toString() + '\n' +
				relayMessage.toString() + '\n' + 
				submitListener.toString() + '\n' +
				targetLiklihood.toString() + '\n' +
				attachFormListeners.toString() + '\n' +
				findTextField.toString() + '\n' + 
				findPasswordFields.toString() + '\n' + 
				autofillPasswords.toString() + '\n' +
				injectedCodeMain.toString() + '\n' +
				'injectedCodeMain(' + JSON.stringify(matchingCredentials) + ');\n'
		  });
	  }
	});
})});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
    if (request.greeting == "hello")
      sendResponse({farewell: "goodbye"});
  });

chrome.contextMenus.create({
 title: "Create random password.",
 contexts:["selection"],  // ContextType
 onclick: console.log // A callback function
}, function(error) {
	console.log(error);
});