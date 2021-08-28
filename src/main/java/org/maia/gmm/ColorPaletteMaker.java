package org.maia.gmm;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

public class ColorPaletteMaker {

	public ColorPaletteMaker() {
	}

	public static void main(String[] args) throws IOException {
		BufferedImage palette = new ColorPaletteMaker().createPalette();
		ImageIO.write(palette, "png", new File("src/main/resources/color-palette.png"));
	}

	private BufferedImage createPalette() {
		BufferedImage image = new BufferedImage(480, 360, BufferedImage.TYPE_INT_RGB);
		Graphics2D g2 = (Graphics2D) image.getGraphics();
		for (int i = 0; i < 16; i++) {
			int x0 = i * 28;
			g2.setColor(Color.YELLOW);
			g2.drawString(String.valueOf(i), x0 + 4, 20);
			g2.setColor(createColor(i));
			g2.fillRect(x0, 28, 24, 332);
		}
		return image;
	}

	private Color createColor(int index) {
		int c = 255 - 15 * index;
		return new Color(c, c, c);
	}

}