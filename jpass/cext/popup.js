chrome.runtime.getBackgroundPage(function(background) {
    if(background.state.getMasterPassword() == null) {
        $("#masterPasswordInput").modal('show');   
    }
});

function unlock() {
    var masterPassword = document.getElementById("masterPassword").value
    chrome.runtime.getBackgroundPage(function(background) {
        background.state.setMasterPassword(masterPassword);
    });
    window.close();
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
