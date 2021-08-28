package org.maia.gmm.web.model.map;

public class GameMapObject {

	private int x;

	private int y;

	private String type;

	public GameMapObject() {
	}

	public GameMapObject(int x, int y, String type) {
		this.x = x;
		this.y = y;
		this.type = type;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("GameMapObject [x=");
		builder.append(x);
		builder.append(", y=");
		builder.append(y);
		builder.append(", type=");
		builder.append(type);
		builder.append("]");
		return builder.toString();
	}

	public int getX() {
		return x;
	}

	public int getY() {
		return y;
	}

	public String getType() {
		return type;
	}

}