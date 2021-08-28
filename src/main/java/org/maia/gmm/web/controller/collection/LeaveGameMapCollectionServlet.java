package org.maia.gmm.web.controller.collection;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@SuppressWarnings("serial")
public class LeaveGameMapCollectionServlet extends GameMapCollectionServlet {

	public LeaveGameMapCollectionServlet() {
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		clearGameMapCollectionId(response);
		writeTextBody("OK", response);
	}

}