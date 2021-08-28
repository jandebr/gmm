package org.maia.gmm.web.controller;

import java.io.BufferedReader;
import java.io.IOException;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@SuppressWarnings("serial")
public abstract class BaseServlet extends HttpServlet {

	private static final String MIMETYPE_TEXT = "text/plain";

	private static final String MIMETYPE_JSON = "application/json";

	protected BaseServlet() {
	}

	protected String readBody(HttpServletRequest request) throws IOException {
		StringBuilder body = new StringBuilder(Math.max(request.getContentLength(), 64));
		BufferedReader reader = request.getReader();
		String line = null;
		while ((line = reader.readLine()) != null) {
			body.append(line);
			body.append(System.lineSeparator());
		}
		reader.close();
		return body.toString();
	}

	protected void writeTextBody(String textBody, HttpServletResponse response) throws IOException {
		writeBody(textBody, MIMETYPE_TEXT, response);
	}

	protected void writeJsonBody(String jsonBody, HttpServletResponse response) throws IOException {
		writeBody(jsonBody, MIMETYPE_JSON, response);
	}

	protected void writeBody(String body, String contentType, HttpServletResponse response) throws IOException {
		response.setContentType(contentType);
		response.getWriter().print(body);
		response.getWriter().close();
	}

	protected void respondToInternalError(Exception internalError, HttpServletResponse response) throws IOException {
		response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		writeTextBody(internalError.toString(), response);
	}

}