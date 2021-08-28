package org.maia.gmm.web.controller.collection;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.maia.gmm.web.controller.GameMapServlet;

@SuppressWarnings("serial")
public abstract class GameMapCollectionServlet extends GameMapServlet {

	protected GameMapCollectionServlet() {
	}

	protected void putGameMapCollectionId(String collectionId, HttpServletResponse response) {
		Cookie cookie = new Cookie(COOKIE_NAME_COLLECTION, collectionId);
		cookie.setPath(getServletContext().getContextPath());
		cookie.setMaxAge(3600 * 24 * 365);
		response.addCookie(cookie);
	}

	protected void clearGameMapCollectionId(HttpServletResponse response) {
		putGameMapCollectionId("", response);
	}

}