const META_OBJECTTYPE_ID_PREFIX = "META_";
const DELETE_OBJECTTYPE_ID = "META_delete";
const CHARACTER_OBJECTTYPE_ID = "META_character";

const INTERACTION_TANGIBLE = "tangible";
const INTERACTION_INTANGIBLE_BACK = "intangible-back";
const INTERACTION_INTANGIBLE_FRONT = "intangible-front";
const INTERACTION_ATMOSPHERE = "atmosphere";

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
				result.isMeta = function() { return id.startsWith(META_OBJECTTYPE_ID_PREFIX); };
				result.isDelete = function() { return id == DELETE_OBJECTTYPE_ID; };
				result.isCharacter = function() { return id == CHARACTER_OBJECTTYPE_ID; };
				result.isTangible = function() { return this.interaction == INTERACTION_TANGIBLE; };
				result.isAtmospheric = function() { return this.interaction == INTERACTION_ATMOSPHERE; };
				result.getDepthLayer = function() {
					if (this.interaction == INTERACTION_INTANGIBLE_BACK) {
						return DEPTH_LAYER_BACK;
					} else if (this.interaction == INTERACTION_INTANGIBLE_FRONT) {
						return DEPTH_LAYER_FRONT;
					} else if (this.interaction == INTERACTION_ATMOSPHERE) {
						return DEPTH_LAYER_ATMOS;
					} else {
						return DEPTH_LAYER_DEFAULT;
					}
				};
				this.storeInObjectTypesCache(result);
			}
		}
		return result;
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