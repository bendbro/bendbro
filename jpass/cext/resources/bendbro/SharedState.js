var SharedState = function() {
    this.listeners = [];
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
                    listenerCallback.call(newValue,oldValue);
                }
            });
        };
    };

    this.listen = function(listen) {
        this.listeners.push(listen);
    }
};