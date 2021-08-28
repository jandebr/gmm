package org.maia.gmm.web.model.collection;

public class GameMapCollection {

	private String id;

	public GameMapCollection(String id) {
		this.id = id;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("GameMapCollection [id=");
		builder.append(id);
		builder.append("]");
		return builder.toString();
	}

	public String getId() {
		return id;
	}

}