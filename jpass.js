var jPassState = new SharedState();
jPassState.register("MasterPassword");
jPassState.register("EncryptedData");

//Add hooks for changes to data.
var decryptedData = [];
jPassState.listen(new function() {
    function updateData() {
        if(jPassState.getMasterPassword() != null && jPassState.getEncryptedData() != null) {
            decryptedData = JSON.parse(sjcl.decrypt(jPassState.getMasterPassword(), jPassState.getEncryptedData()));
            console.log(decryptedData);
        }
    }
    this.updatedEncryptedData = function(newv, oldv) {
        console.log('e update');
        updateData();
    }
    this.updatedMasterPassword = function(newv, oldv) {
        console.log('m update');
        updateData();
    }
});

var client = new Dropbox.Client({ key: "q29ccmrl21l9e71" });
client.authenticate(function(error, client) {
    client.readFile("credentials.json",function(error, fileData) {
        if(!error) {
            jPassState.setEncryptedData(fileData);
        }
    });
});