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
				if(attrs[i].value.indexOf(passwordIdentifiers[piIndex].k) > -1) {
					hits += passwordIdentifiers[piIndex].v;
				}
			}
		}
	}
	
	if(hits > 0) {
		candidates.passwords.push({k:nodel,v:hits});
		node.style.backgroundColor = "red";
	}

	for(childNodeIndex in nodel.childNodes) {
		var childNodeIndexL = childNodeIndex;
		findPasswordFields(candidates, nodel.childNodes[childNodeIndexL]);
	}
	
	return candidates;
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
		code: findPasswordFields.toString() + '\nconsole.log("here we go");console.log(findPasswordFields({passwords:[]},document.body));'
	  });
	});

	chrome.tabs.onCreated.addListener(function(tabId, changeInfo, tab) {
	  chrome.tabs.executeScript(tab.id,{
		code: findPasswordFields.toString() + '\nconsole.log("here we go");console.log(findPasswordFields({passwords:[]},document.body));'
	  });
	});
})});