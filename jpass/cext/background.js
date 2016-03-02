//TODO: add concept of "users" by saving differently named credential files.
//TODO: multiple accounts for same domain via form autocomplete off and append <datalist>
//TODO: add layer between writing to db and adding a new credential.

function cTest() {

    var b;
    function a() {
        b = Math.random();
        var a = Math.random();
        
        return function() {
            console.log(a + ' ' + b);
        };
    }

    var inner1 = a();
    var inner2 = a();

    inner1();
    inner2();
}

cTest();

chrome.storage.sync.set({'value':'abc123','value2':'value2item'}, function() {
	chrome.storage.sync.get(['value','value2'], function(item) {
		console.log(item);
	});
});

var state = new SharedState();
state.register("MasterPassword");
state.register("RemoteData");
state.register("RemoteDataStats");

//Authenticate with dropbox.
//var client = new Dropbox.Client({key:"q29ccmrl21l9e71"});
//client.authDriver(new Dropbox.AuthDriver.ChromeExtension({receiverPath: "resources/chrome_oauth_receiver.html"}));

/*
client.authenticate(function(error, client) {
    if(error) {
		console.log('Dropbox client not authenticated!');
	} else {
		//prefetch remote dropbox data.
		client.stat("credentials.json",function(error,stats) {
			if(error) {
				console.log("Error reading file statistics.");
			} else {
				state.setRemoteDataStats(stats);
				client.readFile("credentials.json",function(error, fileData) {
					if(!error) {
						jPassState.setEncryptedData(fileData);
					}
				});
			}
		});
	}
});
*/

var credentials = [];
function findCredentialForUrl(url) {
    //TODO: dropbox, caching
    var credentialFound = null;
    credentials.forEach(function(credential) {
        if(extractRootDomain(credentials.url) == extractRootDomain(url)) {
            credentialFound = credential;
        }
    });
    return credentialFound;
}

function storeCredential(credentials) {
    //TODO: dropbox, caching
    credentials.push(credentials);
}


var prompts = [];
var promptingTabIds = new Set();
function promptUser(message, onResponse) {
    //Queue up a prompt
    if(message && onResponse) {
        console.log('Adding prompt');
        prompts.push({message:message,onResponse:onResponse});
    }
    
    if(promptingTabIds.size == 0 && prompts.length > 0) {
        var userPrompt = prompts.pop();
        var expired = false;

        console.log('Firing prompt ' + JSON.stringify(userPrompt));
        var onUpdateHandler = null;

        //When a reponse is made, closes the active prompt
        function onResponseWrapper(response) {
            if(!expired && response) {
                expired = true;
                console.log('Killing tabs');
                console.log(response);
                promptingTabIds.forEach(function(tabId) {
                    chrome.tabs.sendMessage(tabId, {
                        reason:'prompt-user',
                        prompt: {
                            kind:'close'
                        }
                    });
                });
                chrome.tabs.onUpdated.removeListener(onUpdateHandler);
                promptingTabIds = new Set();
                userPrompt.onResponse(response);
                promptUser(); //Issue the next prompt when last is finished
            }
        }

        //When a tab is updated, pulls up the active prompt
        onUpdateHandler = function(tabId,changeInfo,tab) {
            if(!expired) {
                console.log('Updating tab');
                promptingTabIds.add(tabId);
                chrome.tabs.sendMessage(tabId, {
                    reason:'prompt-user',
                    prompt:{
                        kind:'open',
                        content:userPrompt.message
                    }
                },onResponseWrapper);
            }
        }

        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
                onUpdateHandler(tab.id);
            });            
        });

        chrome.tabs.onUpdated.addListener(onUpdateHandler);
    }
}


//var rawData = sjcl.decrypt(jPassState.getMasterPassword(), jPassState.getEncryptedData());
var tabStateMap = new Map();
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
                promptUser('Save credentials for ' + extractDomain(tab.url) + '?', function(response) {
                    console.log(response);
                });
	}
	
	if(tabState.url != tab.url) {
		tabState.url = tab.url;
		tabState.latestCredentials = null;
	}
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
        var credentials = findCredentialForUrl(sender.tab.url);
        console.log(credentials);
        if(credentials != null) {
	    console.log('sending');
	    sendResponse({
		reason:"fill-credentials",
		credentials:credentials
	    });
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
