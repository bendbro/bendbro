addEventListener("message", function(event) {
	var message = event.data;
	document.getElementById("prompt").innerHTML = message;
});
document.getElementById('keep').onclick = function() {
	parent.postMessage("accepted","*");
};
document.getElementById('reject').onclick = function() {
	parent.postMessage("rejected","*");
};
document.getElementById('dismiss').onclick = function() {
	parent.postMessage("dismissed","*");
};