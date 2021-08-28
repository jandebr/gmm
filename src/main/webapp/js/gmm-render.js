var defaultMapRenderOptions = {
	"dimension": {
		"tile-width": 30,
		"tile-height": 30,
		"screen-tiles-x": 15,
		"screen-tiles-y": 11,
		"offset-tiles-y": 0,
		"screens": 20,
		"screens-min": 4,
		"screens-max": 100,
		"simulation-jump-force-init": 10,
		"simulation-jump-force-factor": 0.2,
		"simulation-jump-force-offset": -0.93333,
		"simulation-jump-step-forward": 0.33333
	},
	"style": {
		"background-color": "white",
		"background-image-opacity": 0.3,
		"background-emblems-opacity": 0,
		"background-emblems-every-tiles-x": 0,
		"background-emblems-every-tiles-y": 0,
		"background-emblems-image-path": "/",
		"background-emblems-image-width": 0,
		"background-emblems-image-height": 0,
		"grid-color": "white",
		"grid-width": 0.2,
		"simulation-class": "character-simulation"
	}
};



class MapRenderer {

	constructor(container, inventory, options) {
		this.rootPane = container;
		this.inventory = inventory;
		this.options = options ? options : JSON.parse(JSON.stringify(defaultMapRenderOptions));
		this.objectField = this.createObjectField();
		this.cursor = {};
		this.cursorObservers = [];
		this.actionListeners = [];
	}
	
	addCursorObserver(observer) {
		this.getCursorObservers().push(observer);
	}

	addActionListener(listener) {
		this.getActionListeners().push(listener);
	}
	
	erase() {
		if (this.getSvg()) {
			this.getSvg().remove();
		}
	}

	draw(map) {
		this.erase();
		this.clearObjectField();
		this.svg = this.getRootPane().append("svg")
			.attr("width", this.getMapWidth())
			.attr("height", this.getMapHeight());
		this.initActions();
		this.initCursor();
		this.drawBackground(this.svg, map);
		this.drawGrid(this.svg);
		this.installObjectPanes(this.svg);
		this.drawObjects(map);
		this.regionsPane = this.svg.append("g");
		this.simulationPane = this.svg.append("g");
	}
		
	drawBackground(container, map) {
		var g = container.append("g");
		g.append("rect")
			.attr("width", this.getMapWidth())
			.attr("height", this.getMapHeight())
			.style("fill", this.getStyle("background-color"));
		if (this.getStyle("background-image-opacity") > 0) {
			this.drawBackgroundImages(g, map);
		}
		if (this.getStyle("background-emblems-opacity") > 0) {
			this.drawEmblems(g);
		}
	}
	
	drawBackgroundImages(container, map) {
		var path = this.getInventory().getBackgroundsPath();
		var background = this.getInventory().getBackground(map.definition.background);
		var width = this.getScreenWidth();
		var height = this.getScreenHeight();
		for (var i = 0; i < this.getScreens(); i++) {
			var imagePath = path + background.images[i % background.images.length];
			container.append("image")
				.attr("x", i * width)
				.attr("y", 0)
				.attr("width", width)
				.attr("height", height)
				.attr("href", imagePath)
				.style("opacity", this.getStyle("background-image-opacity"));
		}
	}
	
	drawEmblems(container) {
		var nx = this.getDimension("screen-tiles-x") * this.getScreens();
		var ny = this.getDimension("screen-tiles-y");
		var dx = this.getStyle("background-emblems-every-tiles-x");
		var dy = this.getStyle("background-emblems-every-tiles-y");
		var width = this.getStyle("background-emblems-image-width");
		var height = this.getStyle("background-emblems-image-height");
		for (var y = 0; y < ny; y++) {
			if (y % dy == Math.floor(dy / 2)) {
				var y0 = (y + 0.5) * this.getDimension("tile-height") - height / 2;
				for (var x = 0; x < nx; x++) {
					if (x % dx == Math.floor(dx / 2)) {
						var x0 = (x + 0.5) * this.getDimension("tile-width") - width / 2;
						container.append("image")
							.attr("x", x0)
							.attr("y", y0)
							.attr("href", this.getStyle("background-emblems-image-path"))
							.style("opacity", this.getStyle("background-emblems-opacity"));
					}
				}
			}
		}
	}
	
	drawGrid(container) {
		var g = container.append("g");
		var strokeColor = this.getStyle("grid-color");
		var strokeWidth = this.getStyle("grid-width");
		g.append("path")
			.attr("d", this.createHorizontalGrid())
			.attr("stroke", strokeColor)
			.attr("stroke-width", strokeWidth);
		g.append("path")
			.attr("d", this.createVerticalGrid())
			.attr("stroke", strokeColor)
			.attr("stroke-width", strokeWidth);
	}
	
	createHorizontalGrid() {
		var dx = this.getMapWidth();
		var dy = this.getDimension("tile-height");
		var n = 1 + this.getDimension("screen-tiles-y");
		var path = "M 0 0";
		for (var i = 0; i < n; i++) {
			path += " h " + ((i % 2) ? -dx : dx) + " m 0 " + dy;
		}
		return path;
	}

	createVerticalGrid() {
		var dx = this.getDimension("tile-width");
		var dy = this.getMapHeight();
		var n = 1 + this.getScreens() * this.getDimension("screen-tiles-x");
		var path = "M 0 0";
		for (var i = 0; i < n; i++) {
			path += " v " + ((i % 2) ? -dy : dy) + " m " + dx + " 0";
		}
		return path;
	}

	installObjectPanes(container) {
		this.rootObjectsPane = container.append("g");
		var layers = this.getInventory().getDepthLayersInDrawingOrder();
		var panes = this.rootObjectsPane.selectAll("g").data(layers).enter().append("g");
	}

	drawObjects(map) {
		var objects = map.definition.objects;
		for (var i = 0; i < objects.length; i++) {
			this.addObject(objects[i]);
		}
	}
		
	addObject(object) {
		var y0 = this.getOffsetTilesY();
		var y1 = y0 + this.getDimension("screen-tiles-y") - 1;
		if (object.y >= y0 && object.y <= y1) {
			var layer = this.getInventory().getObjectType(object.type).getDepthLayer();
			var uiElement = this.drawObject(this.getObjectPaneForLayer(layer), object);
			this.addObjectToField(object, uiElement);
			if (this.updateCursorObject()) {
				this.fireCursorUpdate();
			}
		}
	}
	
	drawObject(container, object) {
		var y0 = this.getOffsetTilesY();
		var objectType = this.getInventory().getObjectType(object.type);
		var imagePath = this.getObjectTypeImagePath(objectType);
		var tileWidth = this.getDimension("tile-width");
		var tileHeight = this.getDimension("tile-height");
		var uiElement = container.append("image")
			.attr("x", object.x * tileWidth)
			.attr("y", this.getMapHeight() - (object.y - y0 + objectType.heightInTiles) * tileHeight)
			.attr("width", objectType.widthInTiles * tileWidth)
			.attr("height", objectType.heightInTiles * tileHeight)
			.attr("href", imagePath);
		if (objectType.transparency) {
			uiElement.attr("opacity", 1 - objectType.transparency);
		}
		return uiElement;
	}

	removeObject(object) {
		var y0 = this.getOffsetTilesY();
		var y1 = y0 + this.getDimension("screen-tiles-y") - 1;
		if (object.y >= y0 && object.y <= y1) {
			var element = this.removeObjectFromField(object);
			if (element != null) {
				element.uiElement.remove();
			}
			if (this.updateCursorObject()) {
				this.fireCursorUpdate();
			}
		}
	}

	updateCursorObject() {
		var updated = false;
		var cursor = this.getCursor();
		var element = this.peekObjectField(cursor.x, cursor.y);
		if (element == null) {
			if (cursor.object != null) {
				cursor.object = null;
				cursor.objectType = null;
				updated = true;
			}
		} else {
			if (!this.isSameObject(element.object, cursor.object)) {
				cursor.object = element.object;
				cursor.objectType = element.objectType;
				updated = true;
			}
		}
		return updated;
	}

	addCharacterSimulation(characterObject) {
		var snapshots = [];
		this.drawCharacterSimulationSnapshots(characterObject, 0, "oldlace", snapshots);
		var iPause = snapshots.length;
		var stepForward = this.getDimension("simulation-jump-step-forward");
		this.drawCharacterSimulationSnapshots(characterObject, stepForward, "rosybrown", snapshots);
		if (snapshots.length) {
			var objectType = this.getInventory().getObjectType(characterObject.type);
			var tileWidth = this.getDimension("tile-width");
			var tileHeight = this.getDimension("tile-height");
			var i = 0;
			var tick = 0;
			var self = this;
			var character = this.drawObject(self.getSimulationPane(), characterObject);
			character.classed(this.getStyle("simulation-class"), true);
			this.simulationTimer = d3.interval(function(elapsed) {
				if (i == 0 || i == iPause || i == snapshots.length - 1) {
					if (++tick == 10) {
						i = (i + 1) % snapshots.length;
						tick = 0;
					}
				} else {
					i = (i + 1) % snapshots.length;
				}
				character.attr("x", snapshots[i].x * tileWidth)
				character.attr("y", self.getMapHeight() - (snapshots[i].y + objectType.heightInTiles) * tileHeight)
			}, 50);
		}
	}
	
	drawCharacterSimulationSnapshots(characterObject, stepForward, color, snapshots) {
		var objectType = this.getInventory().getObjectType(characterObject.type);
		var x = characterObject.x;
		var y = characterObject.y - this.getOffsetTilesY();
		var jumpForce = this.getDimension("simulation-jump-force-init");
		var proceed = true;
		do {
			var snapshot = this.createTileRegion()
				.setPosition(x, y)
				.setSize(objectType.widthInTiles, objectType.heightInTiles)
				.setStyle("fill:" + color + "; fill-opacity:0.1; stroke:" + color + "; stroke-width:2; stroke-opacity:0.3")
				.setStyleClass(this.getStyle("simulation-class"))
				.setVisible(true);
			snapshots.push(snapshot);
			proceed = y >= 0 && !snapshot.isObstructed();
			y += jumpForce * this.getDimension("simulation-jump-force-factor") + this.getDimension("simulation-jump-force-offset");
			x += stepForward;
			jumpForce = Math.max(jumpForce - 1, 0);
		} while (proceed);
	}
	
	removeCharacterSimulation() {
		if (this.simulationTimer) this.simulationTimer.stop();
		this.getSvg().selectAll("." + this.getStyle("simulation-class")).remove();
	}

	initActions() {
		var self = this;
		this.getSvg().on("click", function(event) {
			self.getActionListeners().forEach(function(listener) {
				if (listener.notifyMapClicked) listener.notifyMapClicked(self);
			});
		});
	}
	
	initCursor() {
		this.clearCursor();
		var self = this;
		var svg = this.getSvg();
		svg.on("mouseover mousemove", function(event) {
			var cursor = self.getCursor();
			var coords = d3.pointer(event, svg.node());
			var currentX = Math.floor(coords[0] / self.getDimension("tile-width"));
			var currentY = self.getDimension("screen-tiles-y") - 1 - Math.floor(coords[1] / self.getDimension("tile-height"));
			if (currentX != cursor.x || currentY != cursor.y) {
				cursor.x = currentX;
				cursor.y = currentY;
				self.updateCursorObject();
				self.fireCursorUpdate();
			}
		});
		svg.on("mousedown", function(event) {
			if (event.button == 0) {
				self.getCursor().pressed = true;
				self.fireCursorUpdate();
			}
		});
		svg.on("mouseup", function(event) {
			if (event.button == 0) {
				self.getCursor().pressed = false;
				self.fireCursorUpdate();
			}
		});
		svg.on("mouseleave", function(event) {
			self.clearCursor();
			self.fireCursorUpdate();
		});
	}

	clearCursor() {
		var cursor = this.getCursor();
		cursor.x = -1;
		cursor.y = -1;
		cursor.object = null;
		cursor.objectType = null;
		cursor.pressed = false;
		cursor.mapRenderer = this;
	}

	fireCursorUpdate() {
		var cursor = this.getCursor();
		this.getCursorObservers().forEach(function(observer) {
			if (observer.notifyMapCursorUpdate) observer.notifyMapCursorUpdate(cursor);
		});
	}

	createObjectField() {
		var field = {};
		var layers = this.getInventory().getDepthLayersInDrawingOrder();
		var rows = this.getDimension("screen-tiles-y");
		var cols = this.getDimension("screen-tiles-x") * this.getDimension("screens-max");
		for (var k = 0; k < layers.length; k++) {
			var matrix = new Array(rows);
			for (var i = 0; i < rows; i++) {
				matrix[i] = new Array(cols);
				matrix[i].fill(null);
			}
			field[layers[k]] = matrix;
		}
		return field;
	}

	clearObjectField() {
		var layers = this.getInventory().getDepthLayersInDrawingOrder();
		for (var k = 0; k < layers.length; k++) {
			var matrix = this.getObjectField()[layers[k]];
			for (var i = 0; i < matrix.length; i++) {
				matrix[i].fill(null);
			}
		}
	}

	addObjectToField(object, uiElement) {
		var objectType = this.getInventory().getObjectType(object.type);
		var layer = objectType.getDepthLayer();
		var matrix = this.getObjectField()[layer];
		var element = { "object": object, "objectType": objectType, "uiElement": uiElement };
		for (var i = 0; i < objectType.heightInTiles; i++) {
			var y = object.y + i - this.getOffsetTilesY();
			for (var j = 0; j < objectType.widthInTiles; j++) {
				var x = object.x + j;
				if (this.isInsideObjectField(x, y)) {
					matrix[y][x] = element;
				}
			}
		}
	}

	removeObjectFromField(object) {
		var objectType = this.getInventory().getObjectType(object.type);
		var layer = objectType.getDepthLayer();
		var matrix = this.getObjectField()[layer];
		var element = null;
		for (var i = 0; i < objectType.heightInTiles; i++) {
			var y = object.y + i - this.getOffsetTilesY();
			for (var j = 0; j < objectType.widthInTiles; j++) {
				var x = object.x + j;
				if (this.isInsideObjectField(x, y)) {
					element = matrix[y][x];
					matrix[y][x] = null;
				}
			}
		}
		return element;
	}

	peekObjectField(x, y) {
		// Returns field element most at the front, if any 
		if (this.isInsideObjectField(x, y)) {
			var layers = this.getInventory().getDepthLayersInDrawingOrder();
			for (var k = layers.length - 1; k >= 0; k--) {
				var matrix = this.getObjectField()[layers[k]];
				var element = matrix[y][x];
				if (element != null) return element;
			}
		}
		return null;
	}

	isObjectUnderTile(x, y, layer) {
		var answer = false;
		if (this.isInsideObjectField(x, y)) {
			var matrix = this.getObjectField()[layer];
			answer = matrix[y][x] != null;
		}
		return answer;
	}

	isTangibleObjectUnderTile(x, y) {
		var answer = false;
		if (this.isInsideObjectField(x, y)) {
			var matrix = this.getObjectField()[DEPTH_LAYER_DEFAULT]; // tangible objects only on default layer
			var element = matrix[y][x];
			if (element != null) {
				answer = element.objectType.isTangible();
			}
		}
		return answer;
	}
	
	isInsideObjectField(x, y) {
		if (x < 0 || y < 0)
			return false;
		var matrix = this.getObjectField()[DEPTH_LAYER_DEFAULT];
		if (y >= matrix.length)
			return false;
		if (x >= matrix[y].length)
			return false;
		return true;
	}

	isSameObject(object1, object2) {
		if (object1 == null || object2 == null) {
			return false;
		} else {
			return object1.x == object2.x && object1.y == object2.y && object1.type == object2.type;
		}
	}

	createTileRegion() {
		return new MapTileRegion(this);
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
	
	getSvg() {
		return this.svg;
	}
	
	getRootObjectsPane() {
		return this.rootObjectsPane;
	}

	getObjectPaneForLayer(layer) {
		return this.getRootObjectsPane().selectAll("g").filter(d => d == layer);
	}

	getRegionsPane() {
		return this.regionsPane;
	}

	getSimulationPane() {
		return this.simulationPane;
	}
	
	getInventory() {
		return this.inventory;
	}

	getOptions() {
		return this.options;
	}
	
	getObjectField() {
		return this.objectField;
	}
	
	getCursor() {
		return this.cursor;
	}
	
	getCursorObservers() {
		return this.cursorObservers;
	}
	
	getActionListeners() {
		return this.actionListeners;
	}

	getDimension(key) {
		return this.getOptions()["dimension"][key];
	}
	
	getOffsetTilesY() {
		return this.getDimension("offset-tiles-y");
	}
	
	getScreens() {
		return this.getDimension("screens");
	}
	
	setScreens(n) {
		this.getOptions()["dimension"]["screens"] = n;
	}

	getScreenWidth() {
		return this.getDimension("screen-tiles-x") * this.getDimension("tile-width");
	}

	getScreenHeight() {
		return this.getDimension("screen-tiles-y") * this.getDimension("tile-height");
	}

	getMapWidth() {
		return this.getScreens() * this.getScreenWidth();
	}

	getMapHeight() {
		return this.getScreenHeight();
	}

	getStyle(key) {
		return this.getOptions()["style"][key];
	}

}



class MapTileRegion {

	constructor(mapRenderer) {
		this.mapRenderer = mapRenderer;
		this.uiElement = null;
		this.visible = false;
	}

	isVisible() {
		return this.visible;
	}
	
	setVisible(visible) {
		this.visible = visible;
		this.update();
		return this;
	}
	
	setPosition(x, y) {
		this.x = x;
		this.y = y;
		this.update();
		return this;
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
		this.update();
		return this;
	}

	setRegion(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.update();
		return this;
	}
	
	setStyle(style) {
		this.style = style;
		this.update();
		return this;
	}

	setStyleClass(styleClass) {
		this.styleClass = styleClass;
		this.update();
		return this;
	}

	update() {
		if (this.uiElement != null) this.erase();
		if (this.isVisible() && this.getWidth() > 0 && this.getHeight() > 0 && !(this.getX() == -1 && this.getY() == -1)) {
			this.draw();
		}
	}
	
	erase() {
		this.uiElement.remove();
		this.uiElement = null;
	}
	
	draw() {
		var mr = this.getMapRenderer();
		var tw = mr.getDimension("tile-width");
		var th = mr.getDimension("tile-height");
		this.uiElement = mr.getRegionsPane().append("rect")
			.attr("x", this.getX() * tw)
			.attr("y", mr.getMapHeight() - (this.getY() + this.getHeight()) * th)
			.attr("width", this.getWidth() * tw)
			.attr("height", this.getHeight() * th)
			.attr("style", this.getStyle());
		if (this.getStyleClass()) {
			this.uiElement.classed(this.getStyleClass(), true);
		}
	}

	isEmpty() {
		var layers = this.getMapRenderer().getInventory().getDepthLayersInDrawingOrder();
		for (var k = 0; k < layers.length; k++) {
			if (!this.isEmptyAtLayer(layers[k])) return false;
		}
		return true;
	}

	isEmptyAtLayer(layer) {
		var y0 = Math.floor(this.getY());
		var y1 = Math.ceil(this.getY() + this.getHeight() - 1);
		var x0 = Math.floor(this.getX());
		var x1 = Math.ceil(this.getX() + this.getWidth() - 1);
		for (var y = y0; y <= y1; y++) {
			for (var x = x0; x <= x1; x++) {
				if (this.getMapRenderer().isObjectUnderTile(x, y, layer)) return false;
			}
		}
		return true;
	}

	isObstructed() {
		var y0 = Math.floor(this.getY());
		var y1 = Math.ceil(this.getY() + this.getHeight() - 1);
		var x0 = Math.floor(this.getX());
		var x1 = Math.ceil(this.getX() + this.getWidth() - 1);
		for (var y = y0; y <= y1; y++) {
			for (var x = x0; x <= x1; x++) {
				if (this.getMapRenderer().isTangibleObjectUnderTile(x, y)) return true;
			}
		}
		return false;
	}

	getX() {
		return this.x;
	}

	getY() {
		return this.y;
	}

	getWidth() {
		return this.width;
	}

	getHeight() {
		return this.height;
	}
	
	getStyle() {
		return this.style;
	}
	
	getStyleClass() {
		return this.styleClass;
	}
	
	getMapRenderer() {
		return this.mapRenderer;
	}

}