//TODO: add concept of "users" by saving differently named credential files.

var jPassState = new SharedState();
jPassState.register("MasterPassword");
jPassState.register("EncryptedData");

//Add hooks for changes to data.
var decryptedData = [];
jPassState.listen(new function() {
    function updateData() {
        if(jPassState.getMasterPassword() != null && jPassState.getEncryptedData() != null) {
            decryptedData = JSON.parse(sjcl.decrypt(jPassState.getMasterPassword(), jPassState.getEncryptedData()));
            console.log(decryptedData);
        }
    }
    this.updatedEncryptedData = function(newv, oldv) {
        console.log('e update');
        updateData();
    }
    this.updatedMasterPassword = function(newv, oldv) {
        console.log('m update');
        updateData();
    }
});

//Load credentials from dropbox.
/*
var client = new Dropbox.Client({key:"q29ccmrl21l9e71"});
client.authDriver(new Dropbox.AuthDriver.ChromeExtension({receiverPath: "resources/chrome_oauth_receiver.html"}));
client.authenticate(function(error, client) {
    client.readFile("credentials.json",function(error, fileData) {
        if(!error) {
            jPassState.setEncryptedData(fileData);
        }
    });
});
*/

var tabStateMap = new Map();
function checkStoreCredentials(tabId) {
	console.log('storing tab credentials');
	
	var tabState = tabStateMap.get(tabId);
	var credentials = tabState.latestCredentials;
	if(credentials != null) {
		decryptedData.push(credentials);
	}
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(!tabStateMap.has(tabId)) {
        tabStateMap.set(tabId,{state:"attempt-login", url:tab.url});
    }
	checkStoreCredentials(tabId);
});

// Flushes any dom change information, saving any credentials within.
chrome.tabs.onRemoved.addListener(function(tabId,changeInfo) {
    //console.log(tabId + " " + JSON.stringify(changeInfo));
	checkStoreCredentials(tabId);
	tabStateMap.delete(tabId);
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(message);

    if(message.reason == "request-credentials") {
        var tabState = tabStateMap.get(sender.tab.id);
        if(tabState != null) {
            if(tabState.state == "attempt-login" && tabState.url == sender.tab.url) {
                var credentials = findCredentialsFor(decryptedData,sender.tab.url);
                console.log(credentials);
            }
        }
    } else if(message.reason == "submit-credentials") {
		console.log('credentials submitted');
		var tabState = tabStateMap.get(sender.tab.id);
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
        });

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