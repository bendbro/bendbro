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
}

function RowView(row, model) {
	this.row = row;
	this.model = model;
	this.views = {};
	
	this.update = function(model) {
		var innerData = model.innerData();
		for(rowViewProperty in innerData) {
			if(this.views[rowViewProperty] == null) {
				var rowElement = document.createElement("td");
				var nameDiv = document.createElement("div");
				nameDiv.innerHTML = rowViewProperty;
				var valueDiv = document.createElement("div");
				rowElement.appendChild(nameDiv);
				rowElement.appendChild(valueDiv);
				this.row.appendChild(rowElement);
				this.views[rowViewProperty] = new ItemView(valueDiv, innerData[rowViewProperty]);
			}
		}
	};
	
	this.update(this.model);
}

function TableView(table, model) {
	this.table = table;
	this.model = model;
	this.views = {};
	
	this.update = function(model) {
		var innerData = model.innerData();
		for(tableViewProperty in innerData) {
			if(this.views[tableViewProperty] == null) {
				var row = document.createElement("tr");
				table.appendChild(row);
				this.views[tableViewProperty] = new RowView(row, innerData[tableViewProperty]);
			}
			this.views[tableViewProperty].update(innerData[tableViewProperty]);
		}
	};
	
	this.update(this.model);
}

function PasswordRowView(row, labels, model) {
	this.row = row;
	this.model = model;
	this.views = {};
	this.labels = labels;
	
	this.update = function(model) {
		for(var label in labels) {
			alert(label + " wassup");
			if(this.views[label] == null) {
				var div = document.createElement("div");
				var td = document.createElement("td");
				this.row.appendChild(td);
				td.appendChild(div);
				alert(JSON.stringify(model));
				this.views[label] = new ItemView(div, model.innerData()[label]);
			}
			this.views[label].update(model.innerData[label]);
		}
	};
	
	this.update(this.model);
}

function LabelledTableView(table, labels, model) {
	this.table = table;
	this.labels = labels;
	this.model = model;
	this.views = {};
	
	this.update = function(model) {
		for(var property in model) {
			if(this.views[property] == null) {
				
			}
		}
	};
}

alert("STILL LOADS!");