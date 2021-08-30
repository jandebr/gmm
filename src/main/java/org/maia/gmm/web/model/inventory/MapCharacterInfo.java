package org.maia.gmm.web.model.inventory;

public class MapCharacterInfo {

	private String id;

	private int code;

	private String label;

	private String image;

	private int appearancesRunning;

	private int height;

	public MapCharacterInfo(String id) {
		this.id = id;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("MapCharacterInfo [id=");
		builder.append(id);
		builder.append(", code=");
		builder.append(code);
		builder.append(", label=");
		builder.append(label);
		builder.append(", image=");
		builder.append(image);
		builder.append(", appearancesRunning=");
		builder.append(appearancesRunning);
		builder.append(", height=");
		builder.append(height);
		builder.append("]");
		return builder.toString();
	}

	public String getId() {
		return id;
	}

	public int getCode() {
		return code;
	}

	public String getLabel() {
		return label;
	}

	public String getImage() {
		return image;
	}

	public int getAppearancesRunning() {
		return appearancesRunning;
	}

	public int getHeight() {
		return height;
	}

}