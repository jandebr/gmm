package org.maia.gmm.web.controller.map;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.maia.gmm.web.controller.GameMapServlet;
import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.model.map.GameMapDownload;
import org.maia.gmm.web.service.GameMapException;

@SuppressWarnings("serial")
public class DownloadGameMapServlet extends GameMapServlet {

	public DownloadGameMapServlet() {
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String gameMapName = getGameMapName(request);
		if (gameMapName != null) {
			try {
				GameMapCollection collection = getGameMapCollection(request);
				GameMapDownload gameMapDownload = getGameMapService().forDownload(gameMapName, collection);
				writeGameMapDownload(gameMapDownload, response);
			} catch (GameMapException e) {
				respondToInternalError(e, response);
			}
		}
	}

	private void writeGameMapDownload(GameMapDownload gameMapDownload, HttpServletResponse response) throws IOException {
		response.setHeader("Content-Type", "image/png");
		response.setHeader("Content-Disposition", "attachment; filename=map.png");
		OutputStream out = response.getOutputStream();
		copyData(gameMapDownload.getDataStream(), out);
		out.close();
	}

	private void copyData(InputStream in, OutputStream out) throws IOException {
		byte[] bytes = new byte[2048];
		int n = 0;
		while ((n = in.read(bytes)) > 0) {
			out.write(bytes, 0, n);
		}
		out.flush();
		in.close();
	}

}