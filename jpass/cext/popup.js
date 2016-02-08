function unlock() {
    var masterPassword = document.getElementById("masterPassword").value
    chrome.runtime.getBackgroundPage(function(background) {
        background.jPassState.setMasterPassword(masterPassword);
    });
}

document.getElementById("unlockTrigger").addEventListener("click",unlock);
document.getElementById("masterPassword").addEventListener("keydown", function(e) {
    if (!e) {
        var e = window.event;
    }
    // Enter is pressed
    if (e.keyCode == 13) {
        e.preventDefault(); // sometimes useful
        $('#masterPasswordInput').modal('hide');
        unlock();
    }
}, false);

document.getElementById("inputMasterPassword").addEventListener("click",function() {
    $('#masterPasswordInput').modal('show');
});