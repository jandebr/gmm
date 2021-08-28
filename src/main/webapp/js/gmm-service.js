const SYSTEM_MAP_COLLECTION_ID = "__SYSTEM";
const TEMPLATE_MAP_NAME = "unnamed";

class MapService {

	constructor() {}

	joinMapCollection(collectionId, callback) {
		var url = "/gmm/collection/join";
		if (collectionId) url += "?collection=" + collectionId;
		d3.request(url).get(function(error, response) {
			if (!error) {
				var joinedCollectionId = response.responseText;
				if (callback) callback(null, joinedCollectionId);
			} else {
				if (callback) callback(error);
			}
		});
	}
	
	createMapCollection(callback) {
		d3.request("/gmm/collection/create").post("", function(error, response) {
			if (!error) {
				var createdCollectionId = response.responseText;
				if (callback) callback(null, createdCollectionId);
			} else {
				console.error(error);
				if (callback) callback(error);
			}
		});
	}

	leaveMapCollection(callback) {
		d3.request("/gmm/collection/leave").get(function(error, response) {
			if (callback) callback(null, null);
		});
	}

	listMapDescriptors(callback) {
		d3.request("/gmm/map/list").get(function(error, response) {
			if (!error) {
				var descriptors = JSON.parse(response.responseText);
				descriptors.forEach(item => { item.isTemplate = () => item.name == TEMPLATE_MAP_NAME; });
				if (callback) callback(null, descriptors);
			} else {
				console.error(error);
				if (callback) callback(error);
			}
		});
	}

	loadMap(mapName, callback) {
		d3.request("/gmm/map/load?map=" + mapName).get(function(error, response) {
			if (!error) {
				var map = JSON.parse(response.responseText);
				map.isTemplate = () => map.descriptor.name == TEMPLATE_MAP_NAME;
				if (callback) callback(null, map);
			} else {
				console.error(error);
				if (callback) callback(error);
			}
		});
	}

	newMap(callback) {
		d3.request("/gmm/map/load?map=" + TEMPLATE_MAP_NAME + "&collection=" + SYSTEM_MAP_COLLECTION_ID).get(function(error, response) {
			if (!error) {
				var map = JSON.parse(response.responseText);
				map.isTemplate = () => map.descriptor.name == TEMPLATE_MAP_NAME;
				if (callback) callback(null, map);
			} else {
				console.error(error);
				if (callback) callback(error);
			}
		});
	}

	saveMap(map, callback) {
		d3.request("/gmm/map/save")
			.header("Content-Type", "application/json")
			.post(JSON.stringify(map), function(error, response) {
				if (!error) {
					if (callback) callback(null, null);
				} else {
					console.error(error);
					if (callback) callback(error);
				}
			});
	}

	deleteMap(mapName, callback) {
		d3.request("/gmm/map/delete?map=" + mapName).post("", function(error, response) {
			if (!error) {
				if (callback) callback(null, null);
			} else {
				console.error(error);
				if (callback) callback(error);
			}
		});
	}

	downloadMap(mapName, callback) {
		var anchor = d3.select("body").append("a")
			.attr("href", "/gmm/map/download?map=" + mapName)
			.attr("download", "map.png")
			.style("display", "none");
		anchor.node().click();
		anchor.remove();
		callback(null, null);
	}
	
}