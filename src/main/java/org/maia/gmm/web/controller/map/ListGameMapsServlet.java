package org.maia.gmm.web.controller.map;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.maia.gmm.web.controller.GameMapServlet;
import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.service.GameMapException;

@SuppressWarnings("serial")
public class ListGameMapsServlet extends GameMapServlet {

	public ListGameMapsServlet() {
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			GameMapCollection collection = getGameMapCollection(request);
			writeGameMapDescriptors(getGameMapService().list(collection), response);
		} catch (GameMapException e) {
			respondToInternalError(e, response);
		}
	}

}