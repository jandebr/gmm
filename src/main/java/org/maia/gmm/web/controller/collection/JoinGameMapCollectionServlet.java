package org.maia.gmm.web.controller.collection;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.maia.gmm.web.service.GameMapException;

@SuppressWarnings("serial")
public class JoinGameMapCollectionServlet extends GameMapCollectionServlet {

	public JoinGameMapCollectionServlet() {
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String collectionId = getGameMapCollectionId(request);
		if (collectionId != null) {
			try {
				if (getGameMapCollectionService().exists(collectionId)) {
					putGameMapCollectionId(collectionId, response);
					writeTextBody(collectionId, response);
				} else {
					clearGameMapCollectionId(response);
					response.setStatus(HttpServletResponse.SC_NOT_FOUND);
					writeTextBody("Collection " + collectionId + " does not exist", response);
				}
			} catch (GameMapException e) {
				respondToInternalError(e, response);
			}
		} else {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			writeTextBody("No collection specified", response);
		}
	}

}