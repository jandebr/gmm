var mapService = null;
var mapInventory = null;
var mapShop = null;
var mapRenderer = null;
var mapAtmosphereRenderer = null;
var mapBadge = null;
var mapCollectionBadge = null;

var currentMapCollectionId = null;
var currentMap = null;
var unsavedMapChanges = false;

const NEW_MAP_NAME = "(new)";

const MAXIMUM_MAP_SCREENS = 100;
const MAXIMUM_MAP_OBJECTS = 2000;
const MAXIMUM_MAP_OBJECTTYPES = 256;


function init() {
	console.log("Welcome to Game Map Maker");
	mapService = new MapService();
	mapBadge = new MapBadge(d3.select("div.topbar"));
	mapCollectionBadge = new MapCollectionBadge(d3.select("div.topbar"), mapCollectionLogoutHandler);
	mapInventory = new MapInventory(function() {
		mapShop = new MapShop(d3.select("div.mapshop"), mapInventory, function() {
			mapRenderer = createMapRenderer(mapInventory);
			mapAtmosphereRenderer = createMapAtmosphereRenderer(mapInventory);
			initControls();
			initMenu();
			initMapResize();
			joinMapCollection();
		});
	});
}

function createMapRenderer(mapInventory) {
	var options = JSON.parse(JSON.stringify(defaultMapRenderOptions));
	options.dimension["screens-max"] = MAXIMUM_MAP_SCREENS;
	return new MapRenderer(d3.select("div.mapview"), mapInventory, options);
}

function createMapAtmosphereRenderer(mapInventory) {
	var options = JSON.parse(JSON.stringify(defaultMapRenderOptions));
	options.dimension["screen-tiles-y"] = 1;
	options.dimension["offset-tiles-y"] = 11;
	options.dimension["screens-max"] = MAXIMUM_MAP_SCREENS;
	options.style["background-color"] = "rgb(240, 242, 223)";
	options.style["background-image-opacity"] = 0;
	options.style["background-emblems-opacity"] = 0.3;
	options.style["background-emblems-every-tiles-x"] = 5;
	options.style["background-emblems-every-tiles-y"] = 1;
	options.style["background-emblems-image-path"] = "/gmm/media/web/atmos-icon.png";
	options.style["background-emblems-image-width"] = 9;
	options.style["background-emblems-image-height"] = 9;
	options.style["grid-color"] = "rgb(166, 171, 120)";
	return new MapRenderer(d3.select("div.mapview"), mapInventory, options);
}



function initControls() {
	var boxMap = mapRenderer.createTileRegion();
	var boxAtmos = mapAtmosphereRenderer.createTileRegion();
	var observer = { "deletesAtLayer" : null };
	observer.notifyMapCursorUpdate = function(cursor) {
		if (!cursor.pressed) this.deletesAtLayer = null;
		var basket = mapShop.getBasket();
		var objectType = basket.getObjectType();
		var isAtmosphericMap = cursor.mapRenderer == mapAtmosphereRenderer;
		var isAtmosphericBasket = !basket.isEmpty() && objectType.isAtmospheric();
		var box = isAtmosphericMap ? boxAtmos : boxMap;
		if (basket.isEmpty() || (isAtmosphericMap != isAtmosphericBasket && !objectType.isDelete())) {
			box.setVisible(false);
		} else {
			if (objectType.isDelete()) {
				if (cursor.object && canEditMap() && (this.deletesAtLayer == null || this.deletesAtLayer == cursor.objectType.getDepthLayer())) {
					box
						.setRegion(cursor.object.x, cursor.object.y - cursor.mapRenderer.getOffsetTilesY(), cursor.objectType.widthInTiles, cursor.objectType.heightInTiles)
						.setStyle("fill:red; fill-opacity:0.2; stroke:red; stroke-width:2; stroke-opacity:0.4")
						.setVisible(true);
					if (cursor.pressed) {
						this.deletesAtLayer = cursor.objectType.getDepthLayer();
						removeObjectFromMap(cursor.object);
					}
				} else {
					box.setVisible(false);
				}
			} else if (objectType.isCharacter()) {
				mapRenderer.removeCharacterSimulation();
				box
					.setRegion(cursor.x, cursor.y, objectType.widthInTiles, objectType.heightInTiles)
					.setStyle("fill:none; stroke:oldlace; stroke-width:4; stroke-opacity:0.8")
					.setVisible(true);
				if (cursor.pressed) {
					var y = cursor.mapRenderer.getOffsetTilesY() + box.getY();
					var characterObject = { "x": box.getX(), "y": y, "type": objectType.id };
					mapRenderer.addCharacterSimulation(characterObject);
				}
			} else {
				box.setRegion(cursor.x, cursor.y, objectType.widthInTiles, objectType.heightInTiles);
				if (box.isEmptyAtLayer(objectType.getDepthLayer()) && canEditMap() && countObjectsInMap() < MAXIMUM_MAP_OBJECTS) {
					box.setStyle("fill:green; fill-opacity:0.2; stroke:green; stroke-width:2; stroke-opacity:0.4");
					if (cursor.pressed) {
						var y = cursor.mapRenderer.getOffsetTilesY() + box.getY();
						var object = { "x": box.getX(), "y": y, "type": objectType.id };
						addObjectToMap(object);
					}
				} else {
					box.setStyle("fill:gray; fill-opacity:0.2; stroke:gray; stroke-width:2; stroke-opacity:0.4");
				}
				box.setVisible(true);
			}
		}
	};
	observer.notifyBasketEmptied = function(basket) {
		boxMap.setVisible(false);
		boxAtmos.setVisible(false);
		mapRenderer.removeCharacterSimulation();
	};
	mapRenderer.addCursorObserver(observer);
	mapAtmosphereRenderer.addCursorObserver(observer);
	mapShop.getBasket().addActionListener(observer);
}

function addObjectToMap(object) {
	var shouldUpdateShop = !hasSameTypedObjects(object) && countDistinctObjectTypesInMap() == MAXIMUM_MAP_OBJECTTYPES - 1;
	mapRenderer.addObject(object);
	mapAtmosphereRenderer.addObject(object);
	currentMap.definition.objects.push(object);
	notifyMapEdited();
	if (countObjectsInMap() == MAXIMUM_MAP_OBJECTS) shouldUpdateShop = true;
	if (shouldUpdateShop) updateShop();
}

function removeObjectFromMap(object) {
	var index = currentMap.definition.objects.findIndex((o) => o.x == object.x && o.y == object.y && o.type == object.type);
	if (index >= 0) {
		mapRenderer.removeObject(object);
		mapAtmosphereRenderer.removeObject(object);
		currentMap.definition.objects.splice(index, 1);
		notifyMapEdited();
		var shouldUpdateShop = !hasSameTypedObjects(object) && countDistinctObjectTypesInMap() == MAXIMUM_MAP_OBJECTTYPES - 1;
		if (countObjectsInMap() == MAXIMUM_MAP_OBJECTS - 1) shouldUpdateShop = true;
		if (shouldUpdateShop) updateShop();
	}
}

function hasSameTypedObjects(object) {
	return currentMap.definition.objects.findIndex((o) => o.type == object.type) >= 0;
}

function countObjectsInMap() {
	return currentMap.definition.objects.length;
}

function countDistinctObjectTypesInMap() {
	return currentMap.definition.objects.filter(function(object, index, array) {
		return array.findIndex((o) => o.type == object.type) == index;
	}).length;
}

function updateShop() {
	mapShop.draw(createShopEnablementFunction());
}

function createShopEnablementFunction() {
	var objectLimitReached = countObjectsInMap() == MAXIMUM_MAP_OBJECTS;
	var objectTypeLimitReached = countDistinctObjectTypesInMap() == MAXIMUM_MAP_OBJECTTYPES;
	return function(objectType) {
		if (objectType.isMeta()) {
			return true;
		} else if (objectLimitReached) {
			return false;
		} else if (objectTypeLimitReached) {
			return hasSameTypedObjects({"type": objectType.id});
		} else {
			return true;
		}
	};
}



function initMenu() {
	registerActionHandler("menu-new", newMap);
	registerActionHandler("menu-load", loadMap);
	registerActionHandler("menu-save", saveMap);
	registerActionHandler("menu-rename", renameMap);
	registerActionHandler("menu-fork", forkMap);
	registerActionHandler("menu-delete", deleteMap);
	registerActionHandler("menu-download", downloadMap);
	registerActionHandler("menu-background", chooseBackground);
	registerActionHandler("menu-character", chooseCharacter);
}

function registerActionHandler(actionId, actionHandler) {
	d3.select("#" + actionId).on("click", function(event) {
		var button = d3.select(this);
		button.classed("run", true);
		mapShop.getBasket().empty();
		actionHandler();
		d3.timeout(function(elapsed) {
			button.classed("run", false);
		}, 200);
	});
}



function joinMapCollection(collectionId) {
	mapService.joinMapCollection(collectionId, function(error, joinedCollectionId) {
		if (!error) {
			currentMapCollectionId = joinedCollectionId;
			console.log("Joined collection " + currentMapCollectionId);
			updateMapCollectionBadge();
			newMap();
		} else {
			askToJoinOrCreateMapCollection();
		}
	});
}

function askToJoinOrCreateMapCollection() { 
	new JoinOrCreateMapCollectionDialog("Join an existing collection of maps<br>Or create your own new collection", function(error, collectionId) {
		if (collectionId) {
			joinMapCollection(collectionId);
		} else {
			mapService.createMapCollection(function(error, createdCollectionId) {
				var choices = [	{ "key": "OK", "label": "Okay, noted" } ];
				var message = "Welcome to a new map collection named <span class='collection-name'>" + createdCollectionId + "</span>";
				message += "<br>Note down this name in case your browser should forget";
				new ChoiceDialog(message, choices, function(e,c) {
					joinMapCollection(createdCollectionId);
				});
			});
		}
	});
}

function mapCollectionLogoutHandler(event) {
	var choices = [
		{ "key": "YES", "label": "Yes, leave" },
		{ "key": "NO", "label": "No, stay" }
	];
	var message = "Do you really want to leave the map collection?";
	message += "<br>Remember the collection name <span class='collection-name'>" + currentMapCollectionId + "</span> to join it again later";
	new ChoiceDialog(message, choices, function(error, choice) {
		if (choice == "YES") {
			mapService.leaveMapCollection(function(e, r) {
				currentMapCollectionId = null;
				console.log("Left collection");
				updateMapCollectionBadge();
				joinMapCollection();
			});
		}
	});
}



function newMap() {
	loadMap(NEW_MAP_NAME);
}

function loadMap(mapName) {
	if (unsavedMapChanges) {
		askToSaveMap(function(error, choice) {
			if (choice == "CANCEL") {
				return;
			} else if (choice == "YES") {
				saveMap(function(error, saved) {
					if (!saved) return;
					askAndLoadMap(mapName);
				});
			} else if (choice == "NO") {
				askAndLoadMap(mapName);
			}
		});
	} else {
		askAndLoadMap(mapName);
	}
}

function askAndLoadMap(mapName, callback) {
	if (!mapName) {
		chooseMapToLoad(function(error, mapName) {
			if (mapName) {
				doLoadMap(mapName, callback);
			} else {
				if (callback) callback(null, false);
			}
		});
	} else {
		doLoadMap(mapName, callback);
	}
}

function chooseMapToLoad(callback) {
	mapService.listMapDescriptors(function(error, mapDescriptors) {
		mapDescriptors = mapDescriptors.filter(d => !d.isTemplate());
		new LoadMapDialog("Choose a map to load", mapDescriptors, callback); // responds with a map name
	});
}

function doLoadMap(mapName, callback) {
	if (mapName == NEW_MAP_NAME) {
		mapService.newMap(function(error, map) {
			establishLoadedMap(map);
			if (callback) callback(null, true);
		});
	} else {
		mapService.loadMap(mapName, function(error, map) {
			establishLoadedMap(map);
			if (callback) callback(null, true);
		});
	}
}

function establishLoadedMap(map) {
	purifyMap(map);
	console.log("Loaded map");
	console.log(map);
	currentMap = map;
	clearUnsavedMapChanges();
	fitMapRendererScreens();
	mapAtmosphereRenderer.draw(currentMap);
	mapRenderer.draw(currentMap);
	notifyCanEditMap();
	updateCharacter();
	updateShop();
}

function purifyMap(map) {
	map.definition.objects = map.definition.objects.filter(function(o, i) {
		return mapInventory.getObjectType(o.type);
	});
}

function askToSaveMap(callback) {
	var choices = [
		{ "key": "YES", "label": "Yes, save" },
		{ "key": "NO", "label": "No" },
		{ "key": "CANCEL", "label": "Cancel" }
	];
	new ChoiceDialog("There are unsaved changes. Do you want to save them?", choices, callback); // responds with the choice key
}

function saveMap(callback) {
	if (currentMap.isTemplate()) {
		askNameToSaveMap(function(error, mapName) {
			if (mapName) {
				currentMap.descriptor.name = mapName;
				currentMap.descriptor.readOnly = false;
				doSaveMap(callback);
				notifyCanEditMap();
			} else {
				if (callback) callback(null, false);
			}
		});
	} else {
		doSaveMap(callback);
	}
}

function askNameToSaveMap(callback) { 
	mapService.listMapDescriptors(function(error, mapDescriptors) {
		new SaveMapDialog("Save this map under the given name", mapDescriptors, callback); // responds with a map name
	});
}

function doSaveMap(callback) {
	mapService.saveMap(currentMap, function(error, data) {
		clearUnsavedMapChanges();
		console.log("Saved map");
		if (callback) callback(null, true);
	});
}

function renameMap() {
	askNameToSaveMap(function(error, mapName) {
		if (mapName) {
			var deleteOriginalMap = canDeleteMap();
			var originalMapName = currentMap.descriptor.name;
			currentMap.descriptor.name = mapName;
			currentMap.descriptor.readOnly = false;
			doSaveMap();
			if (deleteOriginalMap) doDeleteMap(originalMapName);
			notifyCanEditMap();
		}
	});
}

function forkMap() {
	askNameToSaveMap(function(error, mapName) {
		if (mapName) {
			currentMap.descriptor.name = mapName;
			currentMap.descriptor.readOnly = false;
			doSaveMap();
			notifyCanEditMap();
		}
	});
}

function deleteMap() {
	askToDeleteMap(function(error, choice) {
		if (choice == "YES") {
			doDeleteMap();
			clearUnsavedMapChanges();
			newMap();
		}
	});
}

function askToDeleteMap(callback) {
	var choices = [
		{ "key": "YES", "label": "Yes, delete" },
		{ "key": "NO", "label": "No" }
	];
	new ChoiceDialog("Do you really want to delete this map? This action cannot be undone!", choices, callback); // responds with the choice key
}

function doDeleteMap(mapName) {
	if (!mapName) mapName = currentMap.descriptor.name;
	mapService.deleteMap(mapName, function(error, response) {
		console.log("Deleted map");
	});
}

function downloadMap() {
	if (unsavedMapChanges) {
		askToSaveMap(function(error, choice) {
			if (choice == "YES") {
				saveMap(function(error, saved) {
					if (!saved) return;
					doDownloadMap();
				});
			}
		});
	} else {
		doDownloadMap();
	}
}

function doDownloadMap(callback) {
	mapService.downloadMap(currentMap.descriptor.name, function(error, data) {
		console.log("Downloaded map");
		if (callback) callback(null, true);
	});
}

function chooseBackground() {
	new ChooseMapBackgroundDialog("Choose a background", mapInventory.getBackgroundsList(), mapInventory.getBackgroundsPath(), function(error, backgroundId) {
		if (backgroundId) {
			console.log("Chose background '" + backgroundId + "'");
			currentMap.definition.background = backgroundId;
			mapAtmosphereRenderer.draw(currentMap);
			mapRenderer.draw(currentMap);
			notifyMapEdited();
		}
	});
}

function chooseCharacter() {
	new ChooseMapCharacterDialog("Choose a character", mapInventory.getCharactersList(), mapInventory.getCharactersPath(), function(error, characterId) {
		if (characterId) {
			console.log("Chose character '" + characterId + "'");
			currentMap.definition.character = characterId;
			updateCharacter();
			notifyMapEdited();
		}
	});
}

function updateCharacter() {
	var character = mapInventory.getCharacter(currentMap.definition.character);
	if (!character) {
		character = mapInventory.getCharactersList()[0];
	}
	mapShop.setReferenceCharacter(character);
	mapRenderer.setReferenceCharacter(character);
}



function initMapResize() {
	var pane = d3.select(".map-resize");
	var rect = d3.select(".mapview").node().getBoundingClientRect();
	var x = rect.right;
	var y = (rect.top + rect.bottom - pane.node().getBoundingClientRect().height) / 2;
	pane.style("left", x + "px").style("top", y + "px");
	d3.select("#map-expand").on("click", function(event) { expandMap(); });
	d3.select("#map-shrink").on("click", function(event) { shrinkMap(); });
}

function updateMapResizeOptions() {
	d3.select("#map-expand-disablement").classed("enabled", !canExpandMap());
	d3.select("#map-shrink-disablement").classed("enabled", !canShrinkMap());
}

function canExpandMap() {
	if (!canEditMap()) return false;
	return mapRenderer.getScreens() < mapRenderer.getDimension("screens-max");
}

function expandMap() {
	mapRenderer.setScreens(mapRenderer.getScreens() + 1);
	mapAtmosphereRenderer.setScreens(mapAtmosphereRenderer.getScreens() + 1);
	mapAtmosphereRenderer.draw(currentMap);
	mapRenderer.draw(currentMap);
	console.log("Expanded map");
	updateMapResizeOptions();
}

function canShrinkMap() {
	if (!canEditMap()) return false;
	if (mapRenderer.getScreens() <= mapRenderer.getDimension("screens-min")) return false;
	var stx = mapRenderer.getDimension("screen-tiles-x");
	var sty = mapRenderer.getDimension("screen-tiles-y");
	return mapRenderer.createTileRegion()
		.setPosition(stx * (mapRenderer.getScreens() - 1), 0)
		.setSize(stx, sty)
		.isEmpty();
}

function shrinkMap() {
	mapRenderer.setScreens(mapRenderer.getScreens() - 1);
	mapAtmosphereRenderer.setScreens(mapAtmosphereRenderer.getScreens() - 1);
	mapAtmosphereRenderer.draw(currentMap);
	mapRenderer.draw(currentMap);
	console.log("Shrunk map");
	updateMapResizeOptions();
}

function fitMapRendererScreens() {
	var minScreens = mapRenderer.getDimension("screens-min");
	var stx = mapRenderer.getDimension("screen-tiles-x");
	var objects = currentMap.definition.objects;
	var maxx = 0;
	for (var i = 0; i < objects.length; i++) {
		var x = objects[i].x + mapInventory.getObjectType(objects[i].type).widthInTiles - 1;
		maxx = Math.max(maxx, x);
	}
	var screens = Math.max(1 + Math.floor(maxx / stx), minScreens);
	mapRenderer.setScreens(screens);
	mapAtmosphereRenderer.setScreens(screens);
}



function clearUnsavedMapChanges() {
	setUnsavedMapChanges(false);
}

function markUnsavedMapChanges() {
	setUnsavedMapChanges(true);
}

function setUnsavedMapChanges(value) {
	unsavedMapChanges = value;
	d3.select("#menu-save-disablement").classed("enabled", !unsavedMapChanges);
	updateMapBadge();
}

function updateMapBadge() {
	mapBadge.draw(currentMap, unsavedMapChanges);
}

function notifyCanEditMap() {
	// insert code here to enable or disable certain edit capabilities
	d3.select("#menu-delete-disablement").classed("enabled", !canDeleteMap());
	d3.select("#menu-background-disablement").classed("enabled", !canEditMap());
	d3.select("#menu-character-disablement").classed("enabled", !canEditMap());
	updateMapResizeOptions();
}

function notifyMapEdited() {
	// notification that the map has been changed
	markUnsavedMapChanges();
	updateMapResizeOptions();
}

function canEditMap() {
	return !currentMap.descriptor.readOnly || currentMap.isTemplate();
}

function canDeleteMap() {
	return !currentMap.descriptor.readOnly && !currentMap.isTemplate();
}

function updateMapCollectionBadge() {
	mapCollectionBadge.draw(currentMapCollectionId);
}