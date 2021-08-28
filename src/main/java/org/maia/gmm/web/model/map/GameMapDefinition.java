package org.maia.gmm.web.model.map;

import java.util.List;
import java.util.Vector;

public class GameMapDefinition {

	private String background;

	private String character;

	private List<GameMapObject> objects;

	public GameMapDefinition() {
		this.objects = new Vector<GameMapObject>();
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("GameMapDefinition [background='");
		builder.append(getBackground());
		builder.append("', character='");
		builder.append(getCharacter());
		builder.append("', objects=");
		builder.append(getObjects());
		builder.append("]");
		return builder.toString();
	}

	public void addObject(GameMapObject object) {
		getObjects().add(object);
	}

	public String getBackground() {
		return background;
	}

	public String getCharacter() {
		return character;
	}

	public List<GameMapObject> getObjects() {
		return objects;
	}

}