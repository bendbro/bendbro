function main(clientReference, dataReference, modelReference, masterPasswordReference) {
	var client = clientReference.get();
	var dataFile = null; 
	var view = new LabelledTableView(document.getElementById("credentials"),["domain","username","password"], modelReference.get());
	
	var dataFileUpdateNotify = function() {
		dataReference.set(JSON.parse(sjcl.decrypt(masterPasswordReference.get(), dataFile)));
		modelReference.get().applyData(dataReference.get());
		view.update(modelReference.get());
	};
	
	client.authenticate(function(error, client) {
		client.readFile("credentials.json",function(error, fileData) {
			if(!error) {
				dataFile = fileData;
				if(dataFile != null && masterPasswordReference.get() != null) {
					dataFileUpdateNotify.call();
				}
			}
		});
	});
	
	function unlock() {
		masterPasswordReference.set(document.getElementById("masterPassword").value);
		if(dataFile != null && masterPasswordReference.get() != null) {
			dataFileUpdateNotify.call();
		}
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

	if(masterPasswordReference.get() == null) {
		$('#masterPasswordInput').modal('show');
	}
	
	var submit = document.getElementById("submitchanges");
	submit.onclick = function() {
		var saved = true;
		for(entryIndex in modelReference.get().innerData()){
			var entry = modelReference.get().innerData()[entryIndex];
			for(property in entry.innerData()) {
				if(entry.innerData()[property].saved == false) {
					saved = false;
					entry.innerData()[property].saved = true;
				}
			}
		}
		if(saved == false) {
			client.writeFile("credentials.json",sjcl.encrypt(masterPasswordReference.get(),JSON.stringify(dataReference.get())),function(error,stat) {});
		}
	}
	
	var newdata = document.getElementById("addcredential");
	newdata.onclick = function() {
		dataReference.get().push({domain:"domain",username:"username", password:"password"});
		modelReference.get().applyData(dataReference.get());
		view.update(modelReference.get());
	};
}

chrome.runtime.getBackgroundPage(function(backgroundWindow) {
	main(
		{
			get : function() {
				return backgroundWindow.client;
			},
			set : function(value) {
				return backgroundWindow.client = value;
			}
		},
		{
			get : function() {
				return backgroundWindow.data;
			},
			set : function(value) {
				return backgroundWindow.data = value;
			}
		},
		{
			get : function() {
				return backgroundWindow.model;
			},
			set : function(value) {
				return backgroundWindow.model = value;
			}
		},
		{
			get : function() {
				return backgroundWindow.masterPassword;
			},
			set : function(value) {
				return backgroundWindow.masterPassword = value;
			}
		}
	);
});