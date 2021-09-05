package org.maia.gmm.web.model.inventory;

import java.util.List;

public class MapObjectTypeInfo {

	private String id;

	private int code;

	private String label;

	private String image;

	private int appearances;

	private int appearancesSpeedWhileMoving;

	private String movement;

	private int movementParameter1;

	private int movementParameter2;

	private String movementStartAt;

	private int activityCycles;

	private int activitySpeed;

	private int inactivityTimeMinimum;

	private int inactivityTimeMaximum;

	private int inactivityAppearance;

	private double transparency;

	private int widthInTiles;

	private int heightInTiles;

	private int offsetHorizontal;

	private int offsetVertical;

	private String interaction;

	private int value;

	private List<MapObjectTypePart> parts;

	public MapObjectTypeInfo() {
		this.appearances = 1;
		this.inactivityAppearance = 1;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("MapObjectTypeInfo [id=");
		builder.append(id);
		builder.append(", code=");
		builder.append(code);
		builder.append(", label=");
		builder.append(label);
		builder.append(", appearances=");
		builder.append(appearances);
		builder.append(", movement=");
		builder.append(movement);
		builder.append(", widthInTiles=");
		builder.append(widthInTiles);
		builder.append(", heightInTiles=");
		builder.append(heightInTiles);
		builder.append(", interaction=");
		builder.append(interaction);
		builder.append(", value=");
		builder.append(value);
		builder.append(", parts=");
		builder.append(parts);
		builder.append("]");
		return builder.toString();
	}

	public boolean isCompositeType() {
		return getParts() != null && !getParts().isEmpty();
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

	public int getAppearances() {
		return appearances;
	}

	public int getAppearancesSpeedWhileMoving() {
		return appearancesSpeedWhileMoving;
	}

	public String getMovement() {
		return movement;
	}

	public int getMovementParameter1() {
		return movementParameter1;
	}

	public int getMovementParameter2() {
		return movementParameter2;
	}

	public String getMovementStartAt() {
		return movementStartAt;
	}

	public int getActivityCycles() {
		return activityCycles;
	}

	public int getActivitySpeed() {
		return activitySpeed;
	}

	public int getInactivityTimeMinimum() {
		return inactivityTimeMinimum;
	}

	public int getInactivityTimeMaximum() {
		return inactivityTimeMaximum;
	}

	public int getInactivityAppearance() {
		return inactivityAppearance;
	}

	public double getTransparency() {
		return transparency;
	}

	public int getWidthInTiles() {
		return widthInTiles;
	}

	public int getHeightInTiles() {
		return heightInTiles;
	}

	public int getOffsetHorizontal() {
		return offsetHorizontal;
	}

	public int getOffsetVertical() {
		return offsetVertical;
	}

	public String getInteraction() {
		return interaction;
	}

	public int getValue() {
		return value;
	}

	public List<MapObjectTypePart> getParts() {
		return parts;
	}

}