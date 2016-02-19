//TODO: add concept of "users" by saving differently named credential files.
//TODO: multiple accounts for same domain via form autocomplete off and append <datalist>
//TODO: add layer between writing to db and adding a new credential.

function promptUser(prompt, onResponse) {
	var askingTabs = [];
	var asking = true;
	chrome.tabs.query({}, function(tabs) {
		tabs.forEach(function(tab) {
			if(asking) {
				chrome.tabs.sendMessage(tab.id,{
					reason:"prompt-user",
					prompt: {
						kind:"open",
						content:prompt
					}
				},function(response) {
					if(response != null && asking) {
						asking = false;
						for(var id in askingTabs) {
							chrome.tabs.sendMessage(askingTabs[id],{
								reason:"prompt-user",
								prompt: {
									kind:"close"
								}
							});
						}
						onResponse(response);
					}
				});
				askingTabs.push(tab.id);
			}
		});
	});
}

var jPassState = new SharedState();
jPassState.register("MasterPassword");
jPassState.register("EncryptedData");

//TODO:remove
jPassState.setMasterPassword('abc123');

//Add hooks for changes to data.
var decryptedData = [];
jPassState.listen(new function() {
    function updateData() {
        if(jPassState.getMasterPassword() != null && jPassState.getEncryptedData() != null) {
			var rawData = sjcl.decrypt(jPassState.getMasterPassword(), jPassState.getEncryptedData());
			console.log(rawData);
            decryptedData = JSON.parse(rawData);
            console.log(decryptedData);
        }
    }
    this.updatedEncryptedData = function(newv, oldv) {
		console.log('edata');
        updateData();
    }
    this.updatedMasterPassword = function(newv, oldv) {
		console.log('mdata');
        updateData();
    }
});

//Load credentials from dropbox.
var client = new Dropbox.Client({key:"q29ccmrl21l9e71"});
client.authDriver(new Dropbox.AuthDriver.ChromeExtension({receiverPath: "resources/chrome_oauth_receiver.html"}));
client.authenticate(function(error, client) {
    client.readFile("credentials.json",function(error, fileData) {
        if(!error) {
            jPassState.setEncryptedData(fileData);
        }
    });
});

var tabStateMap = new Map();

var prompts = [];
var promptLoop = function() {
	if(prompts.length > 0) {
		var prompting = prompts[prompts.length-1];
		promptUser('Keep credentials for ' + prompting.url + '?', function(response){
			if(response.prompt.kind == "accepted") {
				decryptedData.push(prompting.credentials);
				client.writeFile("credentials.json",sjcl.encrypt(jPassState.getMasterPassword(),decryptedData),function(error,stat) {
					if(error) {
						console.log(error);
					}
				});
			}
			prompts.pop();
			console.log(prompts.length);
			promptLoop();
		});
	}
};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	var tabState = tabStateMap.get(tabId);
	if(tabState == null) {
		tabState = {
			latestCredentials:null,
			url:tab.url
		};
		tabStateMap.set(tabId,tabState);
	}

	var latestCredentials = tabState.latestCredentials;	
	if(latestCredentials != null) {
		tabState.latestCredentials = null;
		prompts.push({
			tabState:tabState,
			url:extractDomain(tab.url),
			credentials:latestCredentials
		});
	}
	
	if(tabState.url != tab.url) {
		tabState.url = tab.url;
		tabState.latestCredentials = null;
	}
	
	promptLoop();
});

// Flushes any dom change information, saving any credentials within.
chrome.tabs.onRemoved.addListener(function(tabId,changeInfo) {
	promptUser('Do action for ' + extractDomain(tab.url) + '?', function(response){
		console.log(response);
	});
	//checkStoreCredentials(tabId);
	//tabStateMap.delete(tabId);
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(message);

    if(message.reason == "request-credentials") {
        var tabState = tabStateMap.get(sender.tab.id);
		console.log(decryptedData);
        var credentials = findCredentialsFor(decryptedData,sender.tab.url);
		console.log(credentials);
		if(credentials != null) {
			console.log('sending');
			sendResponse({
				reason:"fill-credentials",
				credentials:credentials
			})
		}
    } else if(message.reason == "submit-credentials") {
		var tabState = tabStateMap.get(sender.tab.id);
		message.credentials.url = sender.tab.url;
		tabState.latestCredentials = message.credentials;
    }
});

/*
        data.push(credentials);
        //TODO: synchronize with file state if it has been updated from other devices.
        //TODO: detect if master password not yet set, queue up a write.
        client.writeFile("credentials.json",sjcl.encrypt(jPassState.getMasterPassword(),data),function(error,stat) {
            if(error) {
                return alert(error);
            }
        })

function writeAll(message) {
    chrome.tabs.query({}, function(tabs) {
        for (var i=0; i<tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[i].id, message);
        }
    });
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log('background.js injecting ' + tabId);
    chrome.tabs.executeScript(tabId,{file:"inject.js"});
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(sender.tab.id + " says " + message);
    sendResponse("background.js got it!");
});
*/