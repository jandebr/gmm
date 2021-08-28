package org.maia.gmm.web.model.map;

public class GameMap {

	private GameMapDescriptor descriptor;

	private GameMapDefinition definition;

	public GameMap(GameMapDescriptor descriptor, GameMapDefinition definition) {
		this.descriptor = descriptor;
		this.definition = definition;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("GameMap [descriptor=");
		builder.append(descriptor);
		builder.append(", definition=");
		builder.append(definition);
		builder.append("]");
		return builder.toString();
	}

	public String getName() {
		return getDescriptor().getName();
	}

	public GameMapDescriptor getDescriptor() {
		return descriptor;
	}

	public void setDescriptor(GameMapDescriptor descriptor) {
		this.descriptor = descriptor;
	}

	public GameMapDefinition getDefinition() {
		return definition;
	}

}