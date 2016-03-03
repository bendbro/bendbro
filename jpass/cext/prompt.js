addEventListener("message", function(event) {
    var message = event.data;
    document.getElementById("prompt").innerHTML = message;
});
document.getElementById('keep').onclick = function() {
	parent.postMessage('{"sender":"jpass","content":"accepted"}',"*");
};
document.getElementById('reject').onclick = function() {
	parent.postMessage('{"sender":"jpass","content":"rejected"}',"*");
};
document.getElementById('dismiss').onclick = function() {
	parent.postMessage('{"sender":"jpass","content":"dismissed"}',"*");
};
