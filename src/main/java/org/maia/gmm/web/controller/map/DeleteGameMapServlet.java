package org.maia.gmm.web.controller.map;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.maia.gmm.web.controller.GameMapServlet;
import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.service.GameMapException;

@SuppressWarnings("serial")
public class DeleteGameMapServlet extends GameMapServlet {

	public DeleteGameMapServlet() {
	}

	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String gameMapName = getGameMapName(request);
		if (gameMapName != null) {
			try {
				GameMapCollection collection = getGameMapCollection(request);
				getGameMapService().delete(gameMapName, collection);
			} catch (GameMapException e) {
				respondToInternalError(e, response);
			}
		}
	}

}