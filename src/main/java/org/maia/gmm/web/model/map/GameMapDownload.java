package org.maia.gmm.web.model.map;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.imageio.ImageIO;

public class GameMapDownload {

	private BufferedImage image;

	public GameMapDownload(BufferedImage image) {
		this.image = image;
	}

	public InputStream getDataStream() throws IOException {
		ByteArrayOutputStream os = new ByteArrayOutputStream();
		ImageIO.write(getImage(), "png", os);
		return new ByteArrayInputStream(os.toByteArray());
	}

	private BufferedImage getImage() {
		return image;
	}

}