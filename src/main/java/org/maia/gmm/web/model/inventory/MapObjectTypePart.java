package org.maia.gmm.web.model.inventory;

public class MapObjectTypePart {

	private String idRef;

	private int dx;

	private int dy;

	public MapObjectTypePart() {
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("MapObjectTypePart [idRef=");
		builder.append(idRef);
		builder.append(", dx=");
		builder.append(dx);
		builder.append(", dy=");
		builder.append(dy);
		builder.append("]");
		return builder.toString();
	}

	public String getIdRef() {
		return idRef;
	}

	public void setIdRef(String idRef) {
		this.idRef = idRef;
	}

	public int getDx() {
		return dx;
	}

	public void setDx(int dx) {
		this.dx = dx;
	}

	public int getDy() {
		return dy;
	}

	public void setDy(int dy) {
		this.dy = dy;
	}

}