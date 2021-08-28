package org.maia.gmm.web.model.inventory;

import java.util.List;

public class GameMapInventory {

	private List<MapBackgroundInfo> backgrounds;

	private List<MapCharacterInfo> characters;

	private List<MapObjectTypeInfo> objectTypes;

	public GameMapInventory(List<MapBackgroundInfo> backgrounds, List<MapCharacterInfo> characters,
			List<MapObjectTypeInfo> objectTypes) {
		this.backgrounds = backgrounds;
		this.characters = characters;
		this.objectTypes = objectTypes;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("GameMapInventory [backgrounds=");
		builder.append(backgrounds);
		builder.append(", characters=");
		builder.append(characters);
		builder.append(", objectTypes=");
		builder.append(objectTypes);
		builder.append("]");
		return builder.toString();
	}

	public MapBackgroundInfo getBackground(String id) {
		for (MapBackgroundInfo info : getBackgrounds()) {
			if (info.getId().equals(id))
				return info;
		}
		return null;
	}

	public MapCharacterInfo getCharacter(String id) {
		for (MapCharacterInfo character : getCharacters()) {
			if (character.getId().equals(id))
				return character;
		}
		return null;
	}

	public MapObjectTypeInfo getObjectType(String id) {
		for (MapObjectTypeInfo info : getObjectTypes()) {
			if (info.getId().equals(id))
				return info;
		}
		return null;
	}

	public List<MapBackgroundInfo> getBackgrounds() {
		return backgrounds;
	}

	public List<MapCharacterInfo> getCharacters() {
		return characters;
	}

	public List<MapObjectTypeInfo> getObjectTypes() {
		return objectTypes;
	}

}