

window.setTimeout(function() {
	console.log('ayyy');
	var forms = document.getElementsByTagName("form");
	for(var i = 0; i < forms.length; i++) {
		var form = forms[i];
		var domChanges = new DOMFormChanges(form);
	}
}, 1000);
/*
chrome.runtime.sendMessage(
{
	messageKind:'password-request'
}, function(response) {
	
});

chrome.runtime.sendMessage(
{
	messageKind:'password-save'
	
}, function(response) {
	
});
*/