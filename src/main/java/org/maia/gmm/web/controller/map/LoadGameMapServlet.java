package org.maia.gmm.web.controller.map;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.maia.gmm.web.controller.GameMapServlet;
import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.model.map.GameMap;
import org.maia.gmm.web.service.GameMapException;

@SuppressWarnings("serial")
public class LoadGameMapServlet extends GameMapServlet {

	public LoadGameMapServlet() {
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			GameMap gameMap = fetchGameMap(request);
			if (gameMap != null) {
				writeGameMap(gameMap, response);
			} else {
				response.setStatus(HttpServletResponse.SC_NOT_FOUND);
			}
		} catch (GameMapException e) {
			respondToInternalError(e, response);
		}
	}

	private GameMap fetchGameMap(HttpServletRequest request) throws GameMapException {
		GameMap gameMap = null;
		String gameMapName = getGameMapName(request);
		if (gameMapName != null) {
			GameMapCollection collection = getGameMapCollection(request);
			gameMap = getGameMapService().load(gameMapName, collection);
		}
		return gameMap;
	}

}