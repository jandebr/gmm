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
public class SaveGameMapServlet extends GameMapServlet {

	public SaveGameMapServlet() {
	}

	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		GameMap gameMap = readGameMap(request);
		if (gameMap != null) {
			if (gameMap.getDescriptor().isReadOnly()) {
				response.setStatus(HttpServletResponse.SC_FORBIDDEN);
			} else {
				try {
					GameMapCollection collection = getGameMapCollection(request);
					getGameMapService().save(gameMap, collection);
				} catch (GameMapException e) {
					respondToInternalError(e, response);
				}
			}
		}
	}

}