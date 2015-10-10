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

chrome.runtime.getBackgroundPage(function(backgroundWindow) {
	var client = backgroundWindow.client;
	
	loadScript("resources/dropbox.min.js", function() {
		client.authenticate(function(error,client){
			if(error) {
				alert("auth error!");
			} else {
				client.readFile("credentials.json", function(error,data) {
					if(error) {
						alert("read error!");
					} else {
						alert(data);
					}
				});
			}
		});	
	});
});