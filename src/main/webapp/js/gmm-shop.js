var defaultMapShopOptions = {
	"dataUrl": "/gmm/data/map-shop.json",
	"dimension": {
		"departmentsBar-height": 24,
		"departmentsBar-margin": 38,
		"tile-width": 38,
		"tile-height": 38,
		"tile-margin": 4,
		"racks-margin": 38,
		"maxRackHeightInTiles": 4,
		"maxItemWidthInTiles": 4,
		"maxItemHeightInTiles": 4
	},
	"style": {
		"item-background-gradientColor1": "rgb(231, 206, 237)",
		"item-background-gradientColor2": "white",
		"item-corner-color": "rgb(207, 202, 192)",
		"item-sizeBadge-background-color": "white",
		"item-sizeBadge-background-opacity": 0.5,
		"item-sizeBadge-text-color": "gray",
		"item-sizeBadge-text-size": "10px",
		"item-scoreBadge-opacity": 0.9,
		"item-fatalBadge-opacity": 0.9,
		"item-sizeShrinkBadge-opacity": 0.9,
		"item-sizeRestoreBadge-opacity": 0.9,
		"item-shieldBadge-opacity": 1.0,
		"item-finishBadge-opacity": 0.7,
		"item-atmosBadge-opacity": 0.9,
		"item-teleportBadge-opacity": 0.9,
		"item-depthBadge-opacity": 0.9,
		"item-aliveBadge-opacity": 0.9
	}
};

const DEPARTMENT_TYPE_ALL = "ALL";
const DEPARTMENT_TYPE_SHARED = "SHARED";
const DEPARTMENT_TYPE_COMMON = "COMMON";



class MapShop {

	constructor(container, inventory, basket, options, callback) {
		this.rootPane = container;
		this.inventory = inventory;
		this.basket = basket;
		this.options = options ? options : JSON.parse(JSON.stringify(defaultMapShopOptions));
		this.departmentScrolling = false;
		this.departmentScrollOffset = 0;
		this.departmentScrollPaneWidth = 0;
		this.init(callback);
	}

	init(callback) {
		var self = this;
		d3.request(this.getOptions().dataUrl).get(function(error, response) {
			self.data = JSON.parse(response.responseText);
			console.log("Loaded shop");
			console.log(self.data);
			if (callback) callback(null, null);
		});
	}

	erase() {
		this.getRootPane().selectAll("div").remove();
	}

	draw(enablementFunction) {
		this.erase();
		this.drawDepartmentsBar(this.getRootPane(), enablementFunction);
		this.changeDepartment(this.getCommonDepartment(), enablementFunction);
	}
	
	drawDepartmentsBar(container, enablementFunction) {
		var barHeight = this.getDimension("departmentsBar-height");
		if (barHeight > 0) {
			var pane = container.append("div").classed("departments", true);
			var self = this;
			pane.append("img")
				.attr("src", "/gmm/media/web/arrow-left.png")
				.attr("height", barHeight)
				.on("mousedown", function() {
					self.departmentScrolling = true;
					self.scrollDepartments(svg, -1);
				});
			var svg = pane.append("svg")
				.attr("width", this.getDepartmentsBarWidth() - 2 * barHeight)
				.attr("height", barHeight);
			var panel = svg.append("g");
			pane.append("img")
				.attr("src", "/gmm/media/web/arrow-right.png")
				.attr("height", barHeight)
				.on("mousedown", function() {
					self.departmentScrolling = true;
					self.scrollDepartments(svg, +1);
				});
			this.drawDepartments(panel, barHeight, enablementFunction);
			this.departmentScrollPaneWidth = panel.node().getBoundingClientRect().width;
			container.on("mouseup", function() {
				self.departmentScrolling = false;
			});
		}
	}
	
	drawDepartments(container, barHeight, enablementFunction) {
		var self = this;
		var offsetX = 0;
		var departments = this.getDepartments();
		for (var i = 0; i < departments.length; i++) {
			var dept = departments[i];
			if (dept.type != DEPARTMENT_TYPE_SHARED) {
				var barItem = container.append("text")
					.classed("department", true)
					.attr("x", offsetX)
					.attr("y", barHeight / 2)
					.attr("alignment-baseline", "middle")
					.datum(departments[i])
					.text(dept.label)
					.on("click", function(e,d) { self.changeDepartment(d, enablementFunction); });
				if (dept.type == DEPARTMENT_TYPE_ALL || dept.type == DEPARTMENT_TYPE_COMMON) {
					barItem.style("font-style", "italic");
				}
				offsetX += barItem.node().getBoundingClientRect().width;
				offsetX += this.getDimension("departmentsBar-margin");
			}
		}
	}
	
	scrollDepartments(svg, direction) {
		var self = this;
		var timer = d3.interval(function() {
			if (self.departmentScrolling) {
				var w = svg.attr("width");
				var h = svg.attr("height");
				self.departmentScrollOffset = Math.max(Math.min(self.departmentScrollOffset + 50 * direction, self.departmentScrollPaneWidth - w), 0);
				svg.attr("viewBox", self.departmentScrollOffset + " 0 " + w + " " + h);
			} else {
				timer.stop();
			}
		}, 40);
	}
	
	changeDepartment(department, enablementFunction) {
		var departmentData = this.getDepartmentData(department.label);
		this.getRootPane().selectAll(".department").classed("selected", function(d) { return d.label == department.label; });
		this.getRootPane().select("div.racks").remove();
		this.drawRacks(this.getRootPane(), departmentData.racks, enablementFunction);
	}
	
	drawRacks(container, racks, enablementFunction) {
		var pane = container.append("div").classed("racks", true);
		var svg = pane.append("svg")
			.attr("height", this.getDimension("maxRackHeightInTiles") * this.getDimension("tile-height"));
		var defs = svg.append("defs");
		var gradientDef = defs.append("linearGradient")
			.attr("id", "itemGradientBackground")
			.attr("x1", "0%")
			.attr("y1", "0%")
			.attr("x2", "100%")
			.attr("y2", "100%");
		gradientDef.append("stop")
			.attr("offset", "0%")
			.attr("style", "stop-color:" + this.getStyle("item-background-gradientColor1") + "; stop-opacity:0.9");
		gradientDef.append("stop")
			.attr("offset", "20%")
			.attr("style", "stop-color:" + this.getStyle("item-background-gradientColor2") + "; stop-opacity:0.9");
		gradientDef.append("stop")
			.attr("offset", "80%")
			.attr("style", "stop-color:" + this.getStyle("item-background-gradientColor2") + "; stop-opacity:0.9");
		gradientDef.append("stop")
			.attr("offset", "100%")
			.attr("style", "stop-color:" + this.getStyle("item-background-gradientColor1") + "; stop-opacity:0.9");
		var offsetX = 0;
		for (var i = 0; i < racks.length; i++) {
			var panel = svg.append("g").attr("transform", "translate(" + offsetX + " 0)");
			this.drawRack(panel, racks[i], enablementFunction);
			offsetX += panel.node().getBoundingClientRect().width;
			if (i < racks.length - 1) {
				offsetX += this.getDimension("racks-margin");
			}
		}
		svg.attr("width", offsetX + 1);
	}
	
	drawRack(container, rack, enablementFunction) {
		var layout = this.createRackLayout(rack);
		for (var i = 0; i < rack.items.length; i++) {
			var objectType = this.getInventory().getObjectType(rack.items[i]);
			var dims = this.getItemDimensions(objectType);
			var position = this.findSpaceInRackLayout(layout, dims.scaledWidthInTiles, dims.scaledHeightInTiles);
			if (position != null) {
				var offsetX = position[0] * this.getDimension("tile-width");
				var offsetY = position[1] * this.getDimension("tile-height");
				var panel = container.append("g").attr("transform", "translate(" + offsetX + " " + offsetY + ")");
				this.drawItem(panel, objectType, enablementFunction);
				this.insertInRackLayout(layout, objectType, position[0], position[1], dims.scaledWidthInTiles, dims.scaledHeightInTiles);
			} else {
				console.warn("The item '" + objectType.id + "' does not fit in the rack space");
			}
		}
	}
	
	drawItem(container, objectType, enablementFunction) {
		var dims = this.getItemDimensions(objectType);
		var tw = this.getDimension("tile-width");
		var th = this.getDimension("tile-height");
		var tm = this.getDimension("tile-margin");
		var edgesDesc = "M " + (0.5 * tm) + " " + (1.5 * tm) + " v " + -tm + " h " + tm;
		edgesDesc += " M " + (0.5 * tm) + " " + (dims.scaledHeightInTiles * th - 1.5 * tm) + " v " + tm + " h " + tm; 
		edgesDesc += " M " + (dims.scaledWidthInTiles * tw - 0.5 * tm) + " " + (1.5 * tm) + " v " + -tm + " h " + -tm; 
		edgesDesc += " M " + (dims.scaledWidthInTiles * tw - 0.5 * tm) + " " + (dims.scaledHeightInTiles * th - 1.5 * tm) + " v " + tm + " h " + -tm; 
		container.append("rect")
			.attr("x", 1)
			.attr("y", 1)
			.attr("width", dims.scaledWidthInTiles * tw - 2)
			.attr("height", dims.scaledHeightInTiles * th - 2)
			.style("fill", "url(#itemGradientBackground)");
		container.append("path")
			.attr("d", edgesDesc)
			.style("fill", "none")
			.style("stroke", this.getStyle("item-corner-color"))
			.style("stroke-width", 2)
			.style("opacity", 0.9);
		var offsetX = dims.scaledWidthInTiles * tm;
		var offsetY = dims.scaledHeightInTiles * tm;
		var panel = container.append("g").attr("transform", "translate(" + offsetX + " " + offsetY + ")");
		this.drawObjectType(panel, objectType);
		this.drawItemBadges(container, objectType, dims);
		container.append("title").text(this.getObjectTypeTitle(objectType));
		if (!enablementFunction || enablementFunction(objectType)) {
			var self = this;
			container.on("click", function(event) {
				if (event.ctrlKey) {
					var message = "Definition of item <em>" + objectType.label + "</em>";
					var info = self.getObjectTypeInfoInHtml(objectType);
					var dialog = new InfoDialog(message, info, function() {});
				} else {
					self.getBasket().fill(objectType);
				}
			});
			container.style("cursor", "pointer");
		} else {
			container.style("opacity", 0.1);
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
		if (objectType.isCharacter()) {
			this.referenceCharacterImage = image;
		}
	}

	drawItemBadges(container, objectType, dims) {
		// Upper left corner
		var label = this.getObjectTypeBadgeLabel(objectType);
		if (label != null) {
			this.drawItemLabelBadge(container, label);
		}
		// Lower left corner
		if (objectType.isScore()) {
			this.drawItemScoreBadge(container, dims);
		} else if (objectType.isFatal()) {
			this.drawItemFatalBadge(container, dims);
		} else if (objectType.isSizeShrink()) {
			this.drawItemSizeShrinkBadge(container, dims);
		} else if (objectType.isSizeRestore()) {
			this.drawItemSizeRestoreBadge(container, dims);
		} else if (objectType.isShield()) {
			this.drawItemShieldBadge(container, dims);
		}
		// Upper right corner
		if (objectType.getDepthLayer() != DEPTH_LAYER_DEFAULT && objectType.getDepthLayer() != DEPTH_LAYER_ATMOS) {
			this.drawItemDepthBadge(container, dims, objectType.getDepthLayer());
		}
		// Lower right corner
		if (objectType.isAtmospheric()) {
			if (!objectType.isMeta()) {
				this.drawItemAtmosBadge(container, dims);
			}
		} else if (objectType.isTeleport()) {
			this.drawItemTeleportBadge(container, dims);
		} else if (objectType.isFinish()) {
			this.drawItemFinishBadge(container, dims);
		} else if (objectType.isSelfOrPartsMoving() || objectType.isSelfOrPartsMultipleAppearances()) {
			this.drawItemAliveBadge(objectType, container, dims);
		}
	}
	
	drawItemLabelBadge(container, label) {
		var badge = container.append("rect")
			.attr("x", 1)
			.attr("y", 1)
			.attr("height", 14)
			.style("fill", this.getStyle("item-sizeBadge-background-color"))
			.style("opacity", this.getStyle("item-sizeBadge-background-opacity"));
		var badgeText = container.append("text")
			.attr("x", 3)
			.attr("y", 11)
			.style("fill", this.getStyle("item-sizeBadge-text-color"))
			.style("font-size", this.getStyle("item-sizeBadge-text-size"))
			.text(label);
		badge.attr("width", badgeText.node().getBoundingClientRect().width + 4);
	}

	drawItemScoreBadge(container, dims) {
		var x0 = 3;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 13;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/score-icon.png")
			.style("opacity", this.getStyle("item-scoreBadge-opacity"));
	}

	drawItemFatalBadge(container, dims) {
		var x0 = 4;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 15;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("width", 10)
			.attr("height", 12)
			.attr("href", "/gmm/media/web/fatal-icon.png")
			.style("opacity", this.getStyle("item-fatalBadge-opacity"));
	}

	drawItemSizeShrinkBadge(container, dims) {
		var x0 = 3;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 13;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/size-shrink-icon.png")
			.style("opacity", this.getStyle("item-sizeShrinkBadge-opacity"));
	}

	drawItemSizeRestoreBadge(container, dims) {
		var x0 = 3;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 13;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/size-restore-icon.png")
			.style("opacity", this.getStyle("item-sizeRestoreBadge-opacity"));
	}

	drawItemShieldBadge(container, dims) {
		var x0 = 3;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 14;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/shield-icon.png")
			.style("opacity", this.getStyle("item-shieldBadge-opacity"));
	}

	drawItemAtmosBadge(container, dims) {
		var x0 = dims.scaledWidthInTiles * this.getDimension("tile-width") - 14;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 13;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/atmos-icon.png")
			.style("opacity", this.getStyle("item-atmosBadge-opacity"));
	}

	drawItemTeleportBadge(container, dims) {
		var x0 = dims.scaledWidthInTiles * this.getDimension("tile-width") - 12;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 12;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/teleport-icon.png")
			.style("opacity", this.getStyle("item-teleportBadge-opacity"));
	}

	drawItemFinishBadge(container, dims) {
		var x0 = dims.scaledWidthInTiles * this.getDimension("tile-width") - 13;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 13;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/finish-icon.png")
			.style("opacity", this.getStyle("item-finishBadge-opacity"));
	}

	drawItemAliveBadge(objectType, container, dims) {
		var x0 = dims.scaledWidthInTiles * this.getDimension("tile-width") - 12;
		var y0 = dims.scaledHeightInTiles * this.getDimension("tile-height") - 12;
		var icon = "alive";
		if (objectType.isSelfOrPartsMoving()) icon += "-movement";
		if (objectType.isSelfOrPartsMultipleAppearances()) icon += "-appearances";
		icon += "-icon.png";
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/" + icon)
			.style("opacity", this.getStyle("item-aliveBadge-opacity"));
	}

	drawItemDepthBadge(container, dims, depthLayer) {
		var x0 = dims.scaledWidthInTiles * this.getDimension("tile-width") - 18;
		var y0 = 4;
		container.append("image")
			.attr("x", x0)
			.attr("y", y0)
			.attr("href", "/gmm/media/web/depth-" + depthLayer + ".png")
			.style("opacity", this.getStyle("item-depthBadge-opacity"));
	}

	getObjectTypeTitle(objectType) {
		var title = objectType.label;
		var label = this.getObjectTypeBadgeLabel(objectType);
		if (label != null) {
			if (label.charAt(0) == '-' || label.charAt(0) == '|') {
				title += " " + label;
			} else {
				title += " (" + label + ")";
			}
		}
		return title;
	}
	
	getObjectTypeBadgeLabel(objectType) {
		var label = null;
		if (!objectType.isMeta() || objectType.isAtmospheric()) {
			if (objectType.isAtmospheric()) {
				label = "|-" + objectType.widthInTiles + "-|";
			} else if (objectType.isTeleport()) {
				label = "-> " + objectType.value;
			} else {
				label = objectType.widthInTiles + "x" + objectType.heightInTiles;
			}
		}
		return label;
	}
	
	getObjectTypeInfoInHtml(objectType) {
		var info = this.formatAsHtml(objectType);
		if (objectType.parts) {
			for (var i = 0; i < objectType.parts.length; i++) {
				var part = this.getInventory().getObjectType(objectType.parts[i].idRef);
				info += "<br><hr>";
				info += "<b>Part " + (i+1) + ":</b><br>";
				info += this.formatAsHtml(part);
			}
		}
		return info;
	}
	
	formatAsHtml(object) {
		return JSON.stringify(object, null, 2).replaceAll("\n", "<br>").replaceAll(" ", "&nbsp;");
	}

	createRackLayout(rack) {
		var rows = this.getDimension("maxRackHeightInTiles");
		var cols = rack.maxWidthInTiles;
		var layout = new Array(rows);
		for (var i = 0; i < rows; i++) {
			layout[i] = new Array(cols);
			layout[i].fill(null);
		}
		return layout;
	}

	findSpaceInRackLayout(layout, widthInTiles, heightInTiles) {
		for (var y = 0; y <= layout.length - heightInTiles; y++) {
			for (var x = 0; x <= layout[y].length - widthInTiles; x++) {
				if (this.isRackLayoutAvailable(layout, x, y, x + widthInTiles - 1, y + heightInTiles - 1)) {
					return [x, y];
				}
			}
		}
		return null;
	}
	
	isRackLayoutAvailable(layout, x1, y1, x2, y2) {
		for (var y = y1; y <= y2; y++) {
			if (y < 0 || y >= layout.length) return false;
			for (var x = x1; x <= x2; x++) {
				if (x < 0 || x >= layout[y].length) return false;
				if (layout[y][x] != null) return false;
			}
		}
		return true;
	}

	insertInRackLayout(layout, item, tileX, tileY, widthInTiles, heightInTiles) {
		for (var y = tileY; y < tileY + heightInTiles; y++) {
			for (var x = tileX; x < tileX + widthInTiles; x++) {
				layout[y][x] = item;
			}
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

	getDepartmentsBarWidth() {
		var width = this.getRootPane().node().getBoundingClientRect().width;
		width -= 2 * parseInt(this.getRootPane().style("padding"));
		width -= 2 * parseInt(this.getRootPane().style("border-width")); 
		return width;
	}

	setReferenceCharacter(character) {
		this.referenceCharacter = character;
		if (this.referenceCharacterImage) {
			var imagePath = this.getObjectTypeImagePath(this.getInventory().getObjectType(CHARACTER_OBJECTTYPE_ID));
			this.referenceCharacterImage.attr("href", imagePath);
		}
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
	
	getAvailableBackgrounds() {
		var backgrounds = this.getInventory().getBackgroundsList();
		var backgroundIds = this.getData().backgrounds;
		if (backgroundIds) {
			backgrounds = backgrounds.filter(background => backgroundIds.includes(background.id));
		}
		return backgrounds;
	}

	getAvailableCharacters() {
		var characters = this.getInventory().getCharactersList();
		var characterIds = this.getData().characters;
		if (characterIds) {
			characters = characters.filter(character => characterIds.includes(character.id));
		}
		return characters;
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

	getStyle(key) {
		return this.getOptions()["style"][key];
	}

	getBasket() {
		return this.basket;
	}

	getData() {
		return this.data;
	}
	
	getDepartments() {
		return this.getData().departments;
	}
	
	getSharedDepartment() {
		return this.getDepartments().find(d => d.type == DEPARTMENT_TYPE_SHARED);
	}

	getCommonDepartment() {
		return this.getDepartments().find(d => d.type == DEPARTMENT_TYPE_COMMON);
	}

	getDepartmentData(departmentLabel) {
		var dept = this.getDepartments().find(d => d.label == departmentLabel);
		if (dept.type == DEPARTMENT_TYPE_SHARED) {
			return dept;
		} else {
			var unfoldDept = Object.assign({}, dept);
			var sharedDept = this.getSharedDepartment();
			if (sharedDept) {
				unfoldDept.racks = sharedDept.racks.concat(dept.racks);
			}
			if (dept.type == DEPARTMENT_TYPE_ALL) {
				unfoldDept.racks.push({
					"maxWidthInTiles": 10000,
					"items": this.getAllNonSharedItems()
				});
			}
			return unfoldDept;
		}
	}
	
	getAllNonSharedItems() {
		var items = [];
		this.getDepartments().forEach(function(dept) {
			if (dept.type != DEPARTMENT_TYPE_SHARED) {
				dept.racks.forEach(function(rack) {
					rack.items.forEach(function(item) {
						if (!items.includes(item)) items.push(item);
					});
				});
			}
		});
		return items.sort();
	}

}