var defaultMapShopBasketOptions = {
	"dimension": {
		"tile-width": 38,
		"tile-height": 38,
		"tile-margin": 4,
		"maxItemWidthInTiles": 4,
		"maxItemHeightInTiles": 4
	}
};



class MapShopBasket {

	constructor(container, inventory, options) {
		this.rootPane = container;
		this.inventory = inventory;
		this.options = options ? options : JSON.parse(JSON.stringify(defaultMapShopBasketOptions));
		this.coordinates = null;
		this.actionListeners = [];
		this.initControls();
	}

	initControls() {
		var self = this;
		var pane = this.getRootPane();
		pane.on("mouseover mousemove", function(event) {
			self.coordinates = d3.pointer(event, pane.node());
			if (self.getUiElement() != null) self.updatePosition();
		});
		pane.on("contextmenu", function(event) {
			event.preventDefault();
			self.empty();
			return false;
		});
	}

	addActionListener(listener) {
		this.getActionListeners().push(listener);
	}

	isEmpty() {
		return this.getObjectType() == null;
	}
	
	empty() {
		this.objectType = null;
		this.erase();
		var self = this;
		self.getActionListeners().forEach(function(listener) {
			if (listener.notifyBasketEmptied) listener.notifyBasketEmptied(self);
		});
	}
	
	fill(objectType) {
		this.objectType = objectType;
		this.draw();
		var self = this;
		self.getActionListeners().forEach(function(listener) {
			if (listener.notifyBasketFilled) listener.notifyBasketFilled(self);
		});
	}

	erase() {
		if (this.uiElement != null) {
			this.uiElement.remove();
			this.uiElement = null;
		}
	}

	draw() {
		this.erase();
		if (!this.isEmpty()) {
			var svg = this.getRootPane().append("svg").style("position", "absolute");
			this.drawObjectType(svg, this.getObjectType());
			this.uiElement = svg;
			this.updatePosition();
		}
	}

	drawObjectType(container, objectType) {
		var dims = this.getItemDimensions(objectType);
		var margin = this.getDimension("tile-margin");
		var imageWidth = dims.scaledWidthInTiles * (this.getDimension("tile-width") - 2 * margin);
		var imageHeight = dims.scaledHeightInTiles * (this.getDimension("tile-height") - 2 * margin);
		var imagePath = this.getObjectTypeImagePath(objectType);
		var image = container.append("image")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", imageWidth)
			.attr("height", imageHeight)
			.attr("href", imagePath);
		container.attr("width", imageWidth).attr("height", imageHeight);
	}

	updatePosition() {
		if (this.coordinates != null) {
			this.getUiElement()
				.style("left", this.coordinates[0] + 10)
				.style("top", this.coordinates[1] + 20)
				.style("opacity", this.getObjectType().isDelete() ? 1 : 0.4);
		} else {
			this.getUiElement().style("opacity", 0);
		}
	}

	getItemDimensions(objectType) {
		var dims = {};
		var w = objectType.widthInTiles;
		var h = objectType.heightInTiles;
		var maxw = this.getDimension("maxItemWidthInTiles");
		var maxh = this.getDimension("maxItemHeightInTiles");
		var sw = w / maxw;
		var sh = h / maxh;
		if (sw <= 1 && sh <= 1) {
			dims.scaledWidthInTiles = w;
			dims.scaledHeightInTiles = h;
			dims.scaled = false;
		} else {
			var s = Math.max(sw, sh);
			dims.scaledWidthInTiles = Math.ceil(w / s);
			dims.scaledHeightInTiles = Math.ceil(h / s);
			dims.scaled = true;
		}
		dims.originalWidthInTiles = w;
		dims.originalHeightInTiles = h;
		return dims;
	}

	setReferenceCharacter(character) {
		this.referenceCharacter = character;
	}
	
	getReferenceCharacter() {
		return this.referenceCharacter;
	}

	getObjectTypeImagePath(objectType) {
		if (objectType.isCharacter() && this.getReferenceCharacter()) {
			return this.getInventory().getCharactersPath() + this.getReferenceCharacter().image;
		} else {
			return this.getInventory().getObjectTypesPath() + objectType.image;
		}
	}

	getRootPane() {
		return this.rootPane;
	}

	getInventory() {
		return this.inventory;
	}

	getOptions() {
		return this.options;
	}

	getDimension(key) {
		return this.getOptions()["dimension"][key];
	}

	getUiElement() {
		return this.uiElement;
	}

	getObjectType() {
		return this.objectType;
	}

	getActionListeners() {
		return this.actionListeners;
	}

}