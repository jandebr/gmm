const META_OBJECTTYPE_ID_PREFIX = "META_";
const DELETE_OBJECTTYPE_ID = "META_delete";
const STROKE_ERASE_OBJECTTYPE_ID_PREFIX = "META_stroke_erase_";
const STROKE_DELETE_OBJECTTYPE_ID_PREFIX = "META_stroke_delete_";
const STROKE_INSERT_OBJECTTYPE_ID_PREFIX = "META_stroke_insert_";
const CHARACTER_OBJECTTYPE_ID = "META_character";
const TELEPORT_DESTINATION_OBJECTTYPE_ID = "teleport-destination";

const INTERACTION_TANGIBLE = "tangible";
const INTERACTION_SCORE = "score";
const INTERACTION_FATAL = "fatal";
const INTERACTION_FATAL_ACTIVE = "fatal-active";
const INTERACTION_FINISH = "finish";
const INTERACTION_ATMOSPHERE = "atmosphere";
const INTERACTION_TELEPORT = "teleport";

const DEPTH_LAYER_DEFAULT = "default";
const DEPTH_LAYER_BACK = "back";
const DEPTH_LAYER_FRONT = "front";
const DEPTH_LAYER_ATMOS = "atmos";


class MapInventory {

	constructor(callback) {
		this.backgroundsCache = {};
		this.charactersCache = {};
		this.objectTypesCache = {};
		var self = this;
		d3.request("/gmm/data/map-inventory.json").get(function(error, response) {
			self.data = JSON.parse(response.responseText);
			console.log("Loaded inventory");
			console.log(self.data);
			if (callback) callback(null, null);
		});
	}
	
	getBackgroundsPath() {
		return this.getData().meta.backgrounds.path;
	}
	
	getBackground(id) {
		var result = this.fetchFromBackgroundsCache(id);
		if (!result) {
			result = this.getData().backgrounds.find((e) => e.id == id);
			if (result) {
				result.getGmmStyle = function() { return this["gmm-style"]; };
				this.storeInBackgroundsCache(result);
			}
		}
		return result;
	}
	
	getBackgroundsList() {
		return this.getData().backgrounds;
	}

	fetchFromBackgroundsCache(id) {
		return this.backgroundsCache[id];
	}
	
	storeInBackgroundsCache(background) {
		this.backgroundsCache[background.id] = background;
	}

	getCharactersPath() {
		return this.getData().meta.characters.path;
	}

	getCharacter(id) {
		var result = this.fetchFromCharactersCache(id);
		if (!result) {
			result = this.getData().characters.find((e) => e.id == id);
			if (result) {
				this.storeInCharactersCache(result);
			}
		}
		return result;
	}
	
	getCharactersList() {
		return this.getData().characters;
	}

	fetchFromCharactersCache(id) {
		return this.charactersCache[id];
	}
	
	storeInCharactersCache(character) {
		this.charactersCache[character.id] = character;
	}

	getObjectTypesPath() {
		return this.getData().meta.objectTypes.path;
	}
	
	getObjectType(id) {
		var result = this.fetchFromObjectTypesCache(id);
		if (!result) {
			result = this.getData().objectTypes.find((e) => e.id == id);
			if (result) {
				var inventory = this;
				result.isMeta = function() { return id.startsWith(META_OBJECTTYPE_ID_PREFIX); };
				result.isDelete = function() { return id == DELETE_OBJECTTYPE_ID; };
				result.isStrokeOperation = function() { return this.isStrokeErase() || this.isStrokeDelete() || this.isStrokeInsert(); };
				result.isStrokeErase = function() { return id.startsWith(STROKE_ERASE_OBJECTTYPE_ID_PREFIX); };
				result.isStrokeDelete = function() { return id.startsWith(STROKE_DELETE_OBJECTTYPE_ID_PREFIX); };
				result.isStrokeInsert = function() { return id.startsWith(STROKE_INSERT_OBJECTTYPE_ID_PREFIX); };
				result.isCharacter = function() { return id == CHARACTER_OBJECTTYPE_ID; };
				result.isTangible = function() { return this.interaction == INTERACTION_TANGIBLE; };
				result.isAtmospheric = function() { return this.interaction == INTERACTION_ATMOSPHERE; };
				result.isTeleport = function() { return this.interaction == INTERACTION_TELEPORT; };
				result.isFinish = function() { return this.interaction == INTERACTION_FINISH; };
				result.isScore = function() { return this.isSelfOrPartsOfInteraction(INTERACTION_SCORE); };
				result.isFatal = function() { return this.isSelfOrPartsOfInteraction(INTERACTION_FATAL) || this.isSelfOrPartsOfInteraction(INTERACTION_FATAL_ACTIVE); };
				result.isSelfOrPartsOfInteraction = function(interaction) {
					if (this.interaction == interaction) return true;
					if (this.parts) {
						for (var i = 0; i < this.parts.length; i++) {
							var part = inventory.getObjectType(this.parts[i].idRef);
							if (part.interaction == interaction) return true;
						}
					}
					return false;
				};
				result.getDepthLayer = function() {
					if (this.depthLayer) {
						return this.depthLayer;
					} else {
						return DEPTH_LAYER_DEFAULT;
					}
				};
				this.storeInObjectTypesCache(result);
			}
		}
		return result;
	}

	getTeleportDestinationObjectType() {
		return this.getObjectType(TELEPORT_DESTINATION_OBJECTTYPE_ID);
	}

	getDepthLayersInDrawingOrder() {
		return [
			DEPTH_LAYER_BACK,
			DEPTH_LAYER_DEFAULT,
			DEPTH_LAYER_FRONT,
			DEPTH_LAYER_ATMOS
		];
	}

	fetchFromObjectTypesCache(id) {
		return this.objectTypesCache[id];
	}
	
	storeInObjectTypesCache(objectType) {
		this.objectTypesCache[objectType.id] = objectType;
	}

	getData() {
		return this.data;
	}
	
}