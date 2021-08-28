class MapBadge {

	constructor(container) {
		this.rootPane = container;
	}

	erase() {
		this.getRootPane().select(".map-badge").remove();
	}

	draw(map, unsavedMapChanges) {
		this.erase();
		var badge = this.getRootPane().append("div").classed("map-badge", true);
		if (map.descriptor.readOnly && !map.isTemplate()) {
			badge.append("img")
				.attr("src", "/gmm/media/web/lock.png")
				.attr("width", 16)
				.classed("icon", true);
		}
		var label = map.isTemplate() ? "(new)" : map.descriptor.name;
		if (unsavedMapChanges) {
			label = "*" + label;
		}
		badge.append("span")
			.style("font-style", unsavedMapChanges ? "italic" : "normal")
			.text(label);
	}
	
	getRootPane() {
		return this.rootPane;
	}

}



class MapCollectionBadge {

	constructor(container, logoutHandler) {
		this.rootPane = container;
		this.logoutHandler = logoutHandler;
	}

	erase() {
		this.getRootPane().select(".mapcollection-badge").remove();
	}

	draw(collectionId) {
		this.erase();
		var badge = this.getRootPane().append("div").classed("mapcollection-badge", true);
		if (collectionId) {
			badge.append("img")
				.attr("src", "/gmm/media/web/logout.png")
				.attr("width", 16)
				.attr("title", "Leave this collection")
				.classed("icon", true)
				.on("click", this.getLogoutHandler());
			badge.append("span").text(collectionId);
		}
	}
	
	getRootPane() {
		return this.rootPane;
	}
	
	getLogoutHandler() {
		return this.logoutHandler;
	}

}