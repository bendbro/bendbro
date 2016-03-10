//TODO context menu highlight (save note)
//TODO context menu right click (generate random)
//TODO export credentials + scjl + node.app for archiving, decryption in desktop, or on website
//TODO webpage access
//TODO multiple credential dropdown bar on username (for setting related fields)

var credentials = [];
var lastRemoteLoad = 0;

var state = new SharedState();
state.register("MasterPassword");
state.register("UserName");

//Authenticate with dropbox.
var client = new Dropbox.Client({key:"q29ccmrl21l9e71"});
client.authDriver(new Dropbox.AuthDriver.ChromeExtension({receiverPath:"resources/chrome_oauth_receiver.html"}));
client.authenticate(function(error, client) {});

function loadRemoteCredentials(onLoad) {
    var masterPassword = state.getMasterPassword();
    if(client.isAuthenticated() && masterPassword) {
        client.readFile(state.getUserName()+'/credentials.json', function(error, data) {
            if(!error) {
                var remoteCredentials = JSON.parse(sjcl.decrypt(masterPassword,data));
                console.log("Remote credentials");
                console.log(remoteCredentials);
                lastRemoteLoad = new Date().getTime();
                onLoad(remoteCredentials);
            }
            onLoad(null);
        });    
    }
}

function mergeRemoteCredentials(remoteCredentials) {
    if(remoteCredentials != null) {
        var merges = [];
        for(var ir = 0; ir < remoteCredentials.length; ir++) {
            var remoteCredential = remoteCredentials[ir];
            var matchFound = false;
            for(var i = 0; i < credentials.length; i++) {
                var credential = credentials[i];
                var matches = true;
                for(var key in remoteCredential) if(remoteCredential.hasOwnProperty(key)) {
                    if(credential[key] != remoteCredential[key]) {
                        matches = false;
                        break;
                    }
                }
                if(matches) {
                    matchFound = true;
                    break;
                }    
            }
            if(!matchFound) {
                merges.push(remoteCredential);
            }   
        }
        for(var i = 0; i < merges.length; i++) {
            credentials.push(merges[i]);
        }
    }
}

function saveRemoteCredentials() {
    var masterPassword = state.getMasterPassword();
    if(masterPassword) {
        loadRemoteCredentials(function(remote) {
            mergeRemoteCredentials(remote);
            var encryptedCredentials = sjcl.encrypt(masterPassword, JSON.stringify(credentials));
            client.writeFile(state.getUserName()+'/credentials.json',encryptedCredentials);
        });
    }  
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

function findCredentialForUrl(url, onFound) {
    function credentialSearch() {
        var credentialsFound = [];
        credentials.forEach(function(credential) {
            if(extractRootDomain(extractDomain(credential.url)) == extractRootDomain(extractDomain(url))) {
                credentialsFound.push(credential)
            }
        });
        onFound(credentialsFound);
    }
    
    if(new Date().getTime() - lastRemoteLoad > 1*60*60*1000) {
        loadRemoteCredentials(function(remote) {
            mergeRemoteCredentials(remote);
            credentialSearch();
        });
    } else {
        credentialSearch();
    }
}

function storeCredential(credential) {
    credentials.push(credential);
    saveRemoteCredentials();
}

var tabStateMap = new Map();
//Listen for updating tabs.
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
            if(response.prompt.kind == "accepted") {
                storeCredential(latestCredentials);
            }
        });
    }
    
    if(tabState.url != tab.url) {
        tabState.url = tab.url;
        tabState.latestCredentials = null;
    }
});

//Listen for closing tabs.
chrome.tabs.onRemoved.addListener(function(tabId,changeInfo) {
    var tabState = tabStateMap.get(tabId);
    
    var latestCredentials = tagState.latestCredentials;
    if(latestCredentials != null) {
        tabState.latestCredentials = null;
        promptUser('Save credentials for ' + extractDomain(tab.url) + '?', function(response){
            if(response.prompt.kind == "accepted") {
                storeCredential(latestCredentials);
            }
        });
    }
    
    tabStateMap.delete(tabId);
});

//Listen for requests from content scripts
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if(message.reason == "request-credentials") {
        findCredentialForUrl(sender.tab.url,function(credential) {
            if(credential != null) {
                console.log(credential);
                sendResponse({
                    reason:"fill-credentials",
                    credentials:credential
                });
            }
        });
        return true;
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
