function type(object) {
	return Object.prototype.toString.call(object);
}

function PrimitiveObjectModel(targetProperty, containingObject) {
	this.targetProperty = targetProperty;
	this.containingObject = containingObject;
	this.saved = true;
	
	this.getData = function() {
		return this.containingObject[targetProperty]
	};
	
	this.setData = function(data) {
		if(data != this.containingObject[this.targetProperty]) {
			this.saved = false;
		}
		this.containingObject[targetProperty] = data;
	};
	
	this.innerData = function() {
		return {};
	};
}

function JsObjectModel(bind) {
	this.bind = bind;
	this.models = {};

	this.applyData = function(update) {
		this.models = {};
		for(property in update) {
			var pprop = property;
			var object = update[pprop];
			if(this.models[pprop] != null) {
				this.models[pprop].setData(object);
			} else {
				var model = null;
				switch(type(object)) {
					case "[object Object]":
						model = new JsObjectModel(object);
						break;
					case "[object Array]":
						model = new JsObjectModel(object);
						break;
					case "[object String]":
						model = new PrimitiveObjectModel(pprop,update);
						break;
					case "[object Number]":
						model = new PrimitiveObjectModel(pprop,update);
						break;
					default:
						model = new PrimitiveObjectModel(pprop,update);
				}
				this.bind[pprop] = object;
				this.models[pprop] = model;
			}
		}
	};
	
	this.applyData(bind);
	
	this.getData = function() {
		return this.bind;
	};
	
	this.setData = function(update) {
		this.applyData(update);
	};
	
	this.innerData = function() {
		return this.models;
	};
}

function ItemView(html, model) {
	this.html = html;
	this.model = model;
	
	this.html.innerHTML = model.getData();
	this.html.setAttribute("contenteditable", true);
	var model = this.model;
	this.observer = new MutationObserver(function(mutations) {
		mutations.forEach(function(mutation) {
			model.setData(mutation.target.textContent);
		});
	});
	this.observer.observe(this.html, {
		attributes: false,
		childList: false, // child element modification
		characterData: true, // current value of data
		characterDataOldValue: false, // previous value of data
		subtree: true // inner elements
	});
	
	this.update = function(model) {
		return;
	};
}

function PasswordRowView(row, labels, model) {
	this.row = row;
	this.model = model;
	this.views = {};
	this.labels = labels;
	
	this.update = function(model) {
		for(var label in this.labels) {
			var labell = this.labels[label];
			if(this.views[labell] == null) {
				var div = document.createElement("div");
				var td = document.createElement("td");
				this.row.appendChild(td);
				td.appendChild(div);
				this.views[labell] = new ItemView(div, model.innerData()[labell]);
			}
			this.views[labell].update(model.innerData()[labell]);
		}
	};
	
	this.update(this.model);
}

function LabelledTableView(table, labels, model) {
	this.table = table;
	this.labels = labels;
	this.model = model;
	this.views = {};
	
	var header = this.table.createTHead();
	var hrow = header.insertRow(0);
	for(label in labels) {
		var labell = labels[label];
		var cell = hrow.insertCell(hrow.cells.length);
		var h = document.createElement("h3");
		cell.appendChild(h);
		h.innerHTML = labell;
	}
	this.body = this.table.createTBody();
	
	this.update = function(model) {
		this.body.innerHTML = "";
		this.views = {};
		console.log(model);
		for(property in model.innerData()) {
			var lproperty = property;
			if(this.views[lproperty] == null) {
				var row = this.body.insertRow(this.body.rows.length)
				this.views[lproperty] = new PasswordRowView(row,this.labels,model.innerData()[lproperty]);
			}
			this.views[lproperty].update(model.innerData()[lproperty]);
		}
	};
	
	this.update(this.model);
}