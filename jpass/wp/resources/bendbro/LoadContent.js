function loadContent(theUrl, injects, onLoad) {
	injects = injects || {};
    var xmlhttp=new XMLHttpRequest();
    xmlhttp.onreadystatechange = function onchange() {
	    if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			var text = xmlhttp.responseText;
			for(var injectKey in injects) {
				if(injects.hasOwnProperty(injectKey)) {
					var injectValue = injects[injectKey];
					var regex = new RegExp('{{'+injectKey+'}}', 'g');
					text = text.replace(regex, injectValue);
				}
			}
			onLoad(text);
        }
    }
    xmlhttp.open("GET", theUrl, true);
    xmlhttp.send();
}