var SharedState = function() {
    this.listeners = new Set();
    this.data = {};

    this.register = function(name) {
        this["get"+name] = function() {
            return this.data[name];
        }

        this["set"+name] = function(newValue) {
            var oldValue = this.data[name];
            this.data[name] = newValue;
            this.listeners.forEach(function(listener) {
                var listenerCallback = listener["updated"+name];
                if(listenerCallback != null && listenerCallback != undefined) {
                    listenerCallback.call(name,newValue,oldValue);
                }
            });
        };
    };

    this.listen = function(listener) {
        this.listeners.add(listener);
    }
	
	this.mute = function(listener) {
		this.listeners.delete(listener);
	}
};

function waitForUpdates(sharedState, names, onReady) {
	var nameMap = new Map();
	
	sharedState.listen(function(name,newValue,oldValue) {
		if(names.indexOf(name) != -1) {
			nameMap.set(name, newValue);
			if(nameMap.values.length == names.length) {
				onReady(nameMap);
			}
		}
	});
}