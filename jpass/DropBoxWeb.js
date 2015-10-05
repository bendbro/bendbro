client.authenticate(function(error, client) {
		  if (error) {
			alert("Failed to authenticate with dropbox");
		  } else {
			alert("Authenticated, encrypting data.");
			client.readdir("/", function(error, entries) {
			  if (error) {
				return alert(error);  // Something went wrong.
			  }
			  for(file in entries) {
				client.readFile(file,function(error, fileData) {
					if (error) {
						return alert(error);  // Something went wrong.
					}
					data.push(JSON.parse(sjcl.decrypt("testpass",fileData)));
					model.applyData(data);
					view.update(model);
				});
			  }
			});
		  }
		});
		
function Data() {
	this.update = new function(name, value) {
	
	}
	
	this.available = new function() {
		return [];
	}
	
	this.delete = new function(name) {
	
	}
}