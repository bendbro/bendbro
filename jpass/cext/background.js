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

function findLoginFields(candidates, node) {
	var passwordIdentifiers = ["password","pw","pword","pass"];
	
	var attrs = node.attributes;
	if(attrs != null) {
		for(var i = attrs.length - 1; i >= 0; i--) {
			var contents = attrs[i].name;
			for(piIndex in passwordIdentifiers) {
				if(contents.indexOf(passwordIdentifiers[piIndex]) > -1) {
					candidates.passwords.push(contents);
				}
			}
		}
	}

	for(childNode in node.childNodes) {
		findLoginFields(candidates, childNode);
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
		code: findLoginFields.toString() + '\nalert(JSON.stringify(findLoginFields({passwords:[]},document.body)));' + 'document.body.style.backgroundColor="red";'
	  });
	});

	chrome.tabs.onCreated.addListener(function(tabId, changeInfo, tab) {
	  chrome.tabs.executeScript(tab.id,{
		code: findLoginFields.toString() + '\nalert(JSON.stringify(findLoginFields({passwords:[]},document.body)));' + 'document.body.style.backgroundColor="red";'
	  });
	});
})});