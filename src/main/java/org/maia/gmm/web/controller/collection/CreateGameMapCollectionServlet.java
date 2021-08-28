package org.maia.gmm.web.controller.collection;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.service.GameMapException;

@SuppressWarnings("serial")
public class CreateGameMapCollectionServlet extends GameMapCollectionServlet {

	public CreateGameMapCollectionServlet() {
	}

	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			GameMapCollection collection = getGameMapCollectionService().create();
			String collectionId = collection.getId();
			putGameMapCollectionId(collectionId, response);
			writeTextBody(collectionId, response);
		} catch (GameMapException e) {
			respondToInternalError(e, response);
		}
	}

}