chrome.runtime.getBackgroundPage(function(background) {
    function setSelectedUser() {
        document.getElementById("selectedUser").innerHTML = background.state.getUserName() || "Nobody's here";
    };

    if(document.readyState != 'complete') {
        document.body.onload = setSelectedUser();
    } else {
        setSelectedUser();
    }

    if(background.state.getMasterPassword() == null || background.state.getUserName() == null) {
        $("#masterPasswordInput").modal('show');   
    }
});

function unlock() {
    var masterPassword = document.getElementById("masterPassword").value
    var userName = document.getElementById("userName").value;
    chrome.runtime.getBackgroundPage(function(background) {
        background.state.setMasterPassword(masterPassword);
        background.state.setUserName(userName);
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

$("#masterPasswordInput").on('shown.bs.modal', function() {
    document.getElementById("userName").focus();
});
