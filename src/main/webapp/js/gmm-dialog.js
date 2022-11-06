class Dialog {

	constructor(message, dialogClass, dialogCallback) {
		var window = d3.select(".modal-window").style("display", "block");
		this.rootPane = window.append("div").classed("modal-dialog " + dialogClass, true);
		this.messagePane = this.addMessagePane(message);
		this.contentPane = this.addContentPane();
		this.actionPane = this.addActionPane();
		this.dialogActionSequenceNr = 0;
		this.dialogCallback = dialogCallback;
	}
	
	close(result) {
		this.destroy();
		this.getDialogCallback()(null, result);
	}
	
	destroy() {
		this.getRootPane().remove();
		d3.select(".modal-window").style("display", "none");
	}

	addMessagePane(message) {
		var pane = this.getRootPane().append("div")
			.classed("dialog-message-pane", true)
			.html(message);
		return pane;
	}
	
	addContentPane() {
		var pane = this.getRootPane().append("div")
			.classed("dialog-content-pane", true);
		return pane;
	}
	
	addActionPane() {
		var pane = this.getRootPane().append("div")
			.classed("dialog-action-pane", true);
		return pane;
	}

	addActionButton(label, actionHandler, enabled) {
		var actionId = "dialog-action-" + this.dialogActionSequenceNr++;
		var button = this.getActionPane().append("div").classed("action-button", true);
		button.append("span").attr("id", actionId).classed("action", true).text(label);
		button.append("div").classed("disablement", true);
		this.setActionButtonEnabled(button, enabled);
		registerActionHandler(actionId, actionHandler.bind(this));
		return button;
	}
	
	setActionButtonEnabled(button, enabled) {
		button.select("div.disablement").classed("enabled", !enabled);
	}

	getRootPane() {
		return this.rootPane;
	}
	
	getMessagePane() {
		return this.messagePane;
	}

	getContentPane() {
		return this.contentPane;
	}

	getActionPane() {
		return this.actionPane;
	}
	
	getDialogCallback() {
		return this.dialogCallback;
	}

}



class JoinOrCreateMapCollectionDialog extends Dialog {

	constructor(message, dialogCallback) {
		super(message, "dialog-mapcollection", dialogCallback);
		this.errorMessageInvalidCharacter = this.addErrorMessageInvalidCharacter();
		this.addInputForm();
		this.joinButton = this.addActionButton("Join", this.join, false);
		this.createButton = this.addActionButton("Create", this.create, true);
	}

	addErrorMessageInvalidCharacter() {
		var message = this.getContentPane().append("div")
			.classed("error-message", true)
			.style("display", "none")
			.text("Invalid character");
		return message;
	}

	addInputForm() {
		var form = this.getContentPane().append("form")
			.on("submit", function(event) { event.preventDefault(); });
		var input = form.append("input")
			.attr("type", "text")
			.attr("size", 16)
			.attr("maxlength", 16)
			.attr("placeholder", "collection name")
			.on("input", this.inputChangeHandler());
		input.node().focus();
	}

	inputChangeHandler() {
		var dialog = this;
		return function(event) {
			var value = d3.select(this).property("value").trim();
			var valid = /^[a-z]*$/.test(value);
			dialog.getErrorMessageInvalidCharacter().style("display", valid ? "none" : "block");
			dialog.setActionButtonEnabled(dialog.getJoinButton(), value.length && valid);
			dialog.setActionButtonEnabled(dialog.getCreateButton(), !value.length);
		};
	}
	
	join() {
		var collectionId = this.getContentPane().select("input").property("value").trim();
		this.close(collectionId);
	}
	
	create() {
		this.close(null);
	}
	
	getErrorMessageInvalidCharacter() {
		return this.errorMessageInvalidCharacter;
	}
	
	getJoinButton() {
		return this.joinButton;
	}

	getCreateButton() {
		return this.createButton;
	}

}



class LoadMapDialog extends Dialog {

	constructor(message, mapDescriptors, dialogCallback) {
		super(message, "dialog-load", dialogCallback);
		this.addMapDescriptorsList(mapDescriptors);
		this.loadButton = this.addActionButton("Load", this.load, false);
		this.addActionButton("Cancel", this.cancel, true);
	}

	addMapDescriptorsList(mapDescriptors) {
		var fmtDate = this.formatDate;
		var table = this.getContentPane().append("table");
		var rows = table.selectAll("tr").data(mapDescriptors).enter().append("tr");
		rows.on("click", this.clickListItemHandler());
		rows.append("td").html(function(d) {
			return d.readOnly ? '<img src="/gmm/media/web/lock.png" width=16 />' : "";
		});
		rows.append("td").append("img").attr("src", "/gmm/media/web/map-icon.png");
		var divs = rows.append("td").append("div");
		divs.append("span").text(function(d) { return d.name; }).classed("map-name", true);
		divs.append("br");
		divs.append("span").text("Last modified: ").classed("map-property-key", true);
		divs.append("span").text(function(d) { return fmtDate(d.lastModifiedAt); }).classed("map-property-value", true);
		divs.append("br");
		divs.append("span").text("Created: ").classed("map-property-key", true);
		divs.append("span").text(function(d) { return fmtDate(d.createdAt); }).classed("map-property-value", true);
	}
	
	formatDate(dateString) {
		var date = new Date(dateString);
		return date.toLocaleDateString() + " " + date.toLocaleTimeString();
	}
	
	clickListItemHandler() {
		var dialog = this;
		return function(event) {
			var item = d3.select(this);
			dialog.clickListItem(item);
		};
	}

	clickListItem(item) {
		if (this.getSelectedListItem()) {
			this.getSelectedListItem().classed("selected", false);
		}
		item.classed("selected", true);
		this.setSelectedListItem(item);
		this.setActionButtonEnabled(this.getLoadButton(), true);
	}

	load() {
		var mapName = this.getSelectedListItem().datum().name;
		this.close(mapName);
	}
	
	cancel() {
		this.close(null);
	}
	
	getLoadButton() {
		return this.loadButton;
	}
	
	getSelectedListItem() {
		return this.selectedListItem;
	}

	setSelectedListItem(item) {
		this.selectedListItem = item;
	}
	
}



class SaveMapDialog extends Dialog {

	constructor(message, mapDescriptors, dialogCallback) {
		super(message, "dialog-save", dialogCallback);
		this.errorMessageNameExists = this.addErrorMessageNameExists();
		this.errorMessageInvalidCharacter = this.addErrorMessageInvalidCharacter();
		this.addInputForm(mapDescriptors);
		this.saveButton = this.addActionButton("Save", this.save, false);
		this.addActionButton("Cancel", this.cancel, true);
	}

	addErrorMessageNameExists() {
		var message = this.getContentPane().append("div")
			.classed("error-message", true)
			.style("display", "none")
			.text("Name already exists");
		return message;
	}

	addErrorMessageInvalidCharacter() {
		var message = this.getContentPane().append("div")
			.classed("error-message", true)
			.style("display", "none")
			.text("Invalid character");
		return message;
	}

	addInputForm(mapDescriptors) {
		var form = this.getContentPane().append("form")
			.on("submit", function(event) { event.preventDefault(); });
		var input = form.append("input")
			.attr("type", "text")
			.attr("size", 20)
			.attr("maxlength", 30)
			.attr("placeholder", "map name")
			.on("input", this.inputChangeHandler(mapDescriptors));
		input.node().focus();
	}

	inputChangeHandler(mapDescriptors) {
		var dialog = this;
		return function(event) {
			var value = d3.select(this).property("value").trim();
			var exists = mapDescriptors.find(d => d.name.toLowerCase() == value.toLowerCase());
			var valid = /^[\w-]*$/.test(value);
			dialog.getErrorMessageNameExists().style("display", exists ? "block" : "none");
			dialog.getErrorMessageInvalidCharacter().style("display", valid ? "none" : "block");
			dialog.setActionButtonEnabled(dialog.getSaveButton(), value.length && !exists && valid);
		};
	}
	
	save() {
		var mapName = this.getContentPane().select("input").property("value").trim();
		this.close(mapName);
	}
	
	cancel() {
		this.close(null);
	}
	
	getErrorMessageNameExists() {
		return this.errorMessageNameExists;
	}

	getErrorMessageInvalidCharacter() {
		return this.errorMessageInvalidCharacter;
	}
	
	getSaveButton() {
		return this.saveButton;
	}

}



class ChoiceDialog extends Dialog {

	constructor(message, choices, dialogCallback) {
		super(message, "dialog-choice", dialogCallback);
		this.addChoiceButtons(choices);
	}
	
	addChoiceButtons(choices) {
		var dialog = this;
		choices.forEach(function(choice) {
			dialog.addActionButton(choice.label, dialog.createActionHandler(choice), true);
		});
	}
	
	createActionHandler(choice) {
		return function() {
			this.close(choice.key);
		};
	}
	
}



class InfoDialog extends Dialog {

	constructor(message, info, dialogCallback) {
		super(message, "dialog-info", dialogCallback);
		this.getContentPane().html(info);
		this.addActionButton("Close", this.done, true);
	}

	done() {
		this.close(null);
	}

}



class ChooseMapBackgroundDialog extends Dialog {

	constructor(message, backgrounds, backgroundsPath, dialogCallback) {
		super(message, "dialog-background", dialogCallback);
		this.addBackgroundsList(backgrounds, backgroundsPath);
		this.chooseButton = this.addActionButton("Choose", this.choose, false);
		this.addActionButton("Cancel", this.cancel, true);
	}

	addBackgroundsList(backgrounds, backgroundsPath) {
		var table = this.getContentPane().append("table");
		var rows = table.selectAll("tr").data(backgrounds).enter().append("tr");
		rows.on("click", this.clickListItemHandler());
		rows.append("td").append("img").attr("src", "/gmm/media/web/background-icon.png");
		var divs = rows.append("td").append("div");
		divs.append("span").text(function(d) { return d.label; }).classed("background-label", true);
		divs.append("br");
		divs.each(function(d, i) {
			var n = d.images.length;
			var svg = d3.select(this).append("svg").attr("width", n * 150).attr("height", 110);
			for (var j = 0; j < n; j++) {
				svg.append("image")
					.attr("x", j * 150)
					.attr("y", 0)
					.attr("width", 151)
					.attr("height", 110)
					.attr("href", backgroundsPath + d.images[j]);
			}
		});
	}
	
	clickListItemHandler() {
		var dialog = this;
		return function(event) {
			var item = d3.select(this);
			dialog.clickListItem(item);
		};
	}

	clickListItem(item) {
		if (this.getSelectedListItem()) {
			this.getSelectedListItem().classed("selected", false);
		}
		item.classed("selected", true);
		this.setSelectedListItem(item);
		this.setActionButtonEnabled(this.getChooseButton(), true);
	}

	choose() {
		var backgroundId = this.getSelectedListItem().datum().id;
		this.close(backgroundId);
	}
	
	cancel() {
		this.close(null);
	}
	
	getChooseButton() {
		return this.chooseButton;
	}
	
	getSelectedListItem() {
		return this.selectedListItem;
	}

	setSelectedListItem(item) {
		this.selectedListItem = item;
	}
	
}



class ChooseMapCharacterDialog extends Dialog {

	constructor(message, characters, charactersPath, dialogCallback) {
		super(message, "dialog-character", dialogCallback);
		this.addCharactersList(characters, charactersPath);
		this.chooseButton = this.addActionButton("Choose", this.choose, false);
		this.addActionButton("Cancel", this.cancel, true);
	}

	addCharactersList(characters, charactersPath) {
		var table = this.getContentPane().append("table");
		var rows = table.selectAll("tr").data(characters).enter().append("tr");
		rows.on("click", this.clickListItemHandler());
		rows.append("td").append("img")
			.attr("src", function(d) { return charactersPath + d.image; });
		rows.append("td").append("div").append("span")
			.text(function(d) { return d.label; })
			.classed("character-label", true);
	}
	
	clickListItemHandler() {
		var dialog = this;
		return function(event) {
			var item = d3.select(this);
			dialog.clickListItem(item);
		};
	}

	clickListItem(item) {
		if (this.getSelectedListItem()) {
			this.getSelectedListItem().classed("selected", false);
		}
		item.classed("selected", true);
		this.setSelectedListItem(item);
		this.setActionButtonEnabled(this.getChooseButton(), true);
	}

	choose() {
		var characterId = this.getSelectedListItem().datum().id;
		this.close(characterId);
	}
	
	cancel() {
		this.close(null);
	}
	
	getChooseButton() {
		return this.chooseButton;
	}
	
	getSelectedListItem() {
		return this.selectedListItem;
	}

	setSelectedListItem(item) {
		this.selectedListItem = item;
	}
	
}
