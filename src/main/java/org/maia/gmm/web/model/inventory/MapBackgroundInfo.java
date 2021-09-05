package org.maia.gmm.web.model.inventory;

import java.util.List;

public class MapBackgroundInfo {

	private String id;

	private int code;

	private String label;

	private List<String> images;

	public MapBackgroundInfo() {
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("MapBackgroundInfo [id=");
		builder.append(id);
		builder.append(", code=");
		builder.append(code);
		builder.append(", label=");
		builder.append(label);
		builder.append(", images=");
		builder.append(images);
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

	public List<String> getImages() {
		return images;
	}

}