package org.maia.gmm.web.controller;

import java.io.IOException;
import java.util.List;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.maia.gmm.web.io.GameMapIO;
import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.model.map.GameMap;
import org.maia.gmm.web.model.map.GameMapDescriptor;
import org.maia.gmm.web.service.GameMapCollectionService;
import org.maia.gmm.web.service.GameMapCollectionServiceImpl;
import org.maia.gmm.web.service.GameMapException;
import org.maia.gmm.web.service.GameMapService;
import org.maia.gmm.web.service.GameMapServiceImpl;

@SuppressWarnings("serial")
public abstract class GameMapServlet extends BaseServlet {

	private GameMapService gameMapService;

	private GameMapCollectionService gameMapCollectionService;

	public static final String COOKIE_NAME_COLLECTION = "gmm-collection";

	protected GameMapServlet() {
	}

	protected String getGameMapName(HttpServletRequest request) {
		return request.getParameter("map");
	}

	protected String getGameMapCollectionId(HttpServletRequest request) {
		String collectionId = request.getParameter("collection");
		if (collectionId == null && request.getCookies() != null) {
			for (Cookie cookie : request.getCookies()) {
				if (cookie.getName().equals(COOKIE_NAME_COLLECTION) && !cookie.getValue().isEmpty()) {
					collectionId = cookie.getValue();
					break;
				}
			}
		}
		return collectionId;
	}

	protected GameMapCollection getGameMapCollection(HttpServletRequest request) {
		GameMapCollection collection = null;
		String collectionId = getGameMapCollectionId(request);
		if (collectionId != null) {
			try {
				if (getGameMapCollectionService().exists(collectionId)) {
					collection = new GameMapCollection(collectionId);
				}
			} catch (GameMapException e) {
				System.err.println(e);
			}
		}
		return collection;
	}

	protected GameMap readGameMap(HttpServletRequest request) throws IOException {
		GameMap gameMap = null;
		String jsonBody = readBody(request);
		if (jsonBody != null && !jsonBody.isEmpty()) {
			gameMap = GameMapIO.getInstance().parseGameMapFromJson(jsonBody);
		}
		return gameMap;
	}

	protected void writeGameMap(GameMap gameMap, HttpServletResponse response) throws IOException {
		if (gameMap != null) {
			String jsonBody = GameMapIO.getInstance().formatGameMapToJson(gameMap);
			writeJsonBody(jsonBody, response);
		}
	}

	protected void writeGameMapDescriptors(List<GameMapDescriptor> descriptors, HttpServletResponse response)
			throws IOException {
		if (descriptors != null) {
			String jsonBody = GameMapIO.getInstance().formatGameMapDescriptorsToJson(descriptors);
			writeJsonBody(jsonBody, response);
		}
	}

	protected GameMapService getGameMapService() {
		if (gameMapService == null) {
			gameMapService = new GameMapServiceImpl();
		}
		return gameMapService;
	}

	protected GameMapCollectionService getGameMapCollectionService() {
		if (gameMapCollectionService == null) {
			gameMapCollectionService = new GameMapCollectionServiceImpl();
		}
		return gameMapCollectionService;
	}

}