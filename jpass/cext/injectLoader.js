console.log('injecting script');

var s = document.createElement ("script");
s.src = chrome.extension.getURL ("inject.js");
document.documentElement.appendChild (s);

var s = document.createElement ('script');
s.textContent = 'console.log ("Text runs correctly!", new Date().getTime() );';
document.documentElement.appendChild (s);