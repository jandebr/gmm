package org.maia.gmm.web.service;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.maia.gmm.web.model.inventory.GameMapInventory;
import org.maia.gmm.web.model.inventory.MapBackgroundInfo;
import org.maia.gmm.web.model.inventory.MapCharacterInfo;
import org.maia.gmm.web.model.inventory.MapObjectTypeInfo;
import org.maia.gmm.web.model.inventory.MapObjectTypePart;
import org.maia.gmm.web.model.map.GameMap;
import org.maia.gmm.web.model.map.GameMapObject;

public class GameMapBitmapGenerator {

	private static final int VERSION_NUMBER = 3;

	private static final int MAP_HEIGHT_IN_TILES = 11;

	public GameMapBitmapGenerator() {
	}

	public BufferedImage generateBitmap(GameMap gameMap, GameMapInventory inventory) {
		List<GameMapObjectOnLayer> objects = getSortedComponentObjects(gameMap, inventory);
		ObjectTypeRegistry objectTypeRegistry = createObjectTypeRegistry(objects, inventory);
		checkCompositeConstraints(objectTypeRegistry, inventory);
		BitmapWriter writer = new BitmapWriter(120, 90, new ColorMap());
		writeVersionNumber(writer);
		writeBackground(writer, gameMap, inventory);
		writeCharacter(writer, gameMap, inventory);
		writeObjectTypes(writer, objectTypeRegistry, inventory);
		writeObjects(writer, objectTypeRegistry, objects, inventory);
		if (writer.exceedsBoundaries())
			writer.writeMessageBoundariesExceeded();
		return writer.getImage();
	}

	private void checkCompositeConstraints(ObjectTypeRegistry objectTypeRegistry, GameMapInventory inventory) {
		for (String typeId : objectTypeRegistry.getRegisteredObjectTypes()) {
			MapObjectTypeInfo info = inventory.getObjectType(typeId);
			if (info.isCompositeType()) {
				for (MapObjectTypePart part : info.getParts()) {
					String detailMsg = "Violating part '" + part.getIdRef() + "' referenced by '" + typeId + "'";
					MapObjectTypeInfo partInfo = inventory.getObjectType(part.getIdRef());
					if (partInfo.isCompositeType()) {
						throw new IllegalStateException("All composite parts must be singular. " + detailMsg);
					}
					DepthLayer layer = DepthLayer.getDepthLayer(partInfo);
					if (!DepthLayer.DEFAULT.equals(layer)) {
						throw new IllegalStateException("All composite parts must be on the default layer. "
								+ detailMsg);
					}
				}
			}
		}
	}

	private List<GameMapObjectOnLayer> getSortedComponentObjects(GameMap gameMap, GameMapInventory inventory) {
		List<GameMapObject> mapObjects = gameMap.getDefinition().getObjects();
		List<GameMapObjectOnLayer> compObjects = new Vector<GameMapObjectOnLayer>(mapObjects.size());
		for (GameMapObject mapObject : mapObjects) {
			MapObjectTypeInfo info = inventory.getObjectType(mapObject.getType());
			if (info != null) {
				if (info.isCompositeType()) {
					CompositeGameMapObject composite = new CompositeGameMapObject();
					for (MapObjectTypePart part : info.getParts()) {
						int x = mapObject.getX() + part.getDx();
						int y = mapObject.getY() + part.getDy();
						ComponentGameMapObjectOnLayer component = new ComponentGameMapObjectOnLayer(x, y,
								part.getIdRef(), composite);
						composite.addComponent(component);
						compObjects.add(component);
					}
				} else {
					compObjects.add(new GameMapObjectOnLayer(mapObject));
				}
			}
		}
		Collections.sort(compObjects, new GameMapObjectSorter(inventory));
		return compObjects;
	}

	private ObjectTypeRegistry createObjectTypeRegistry(List<GameMapObjectOnLayer> objects, GameMapInventory inventory) {
		ObjectTypeRegistry registry = new ObjectTypeRegistry();
		for (GameMapObjectOnLayer object : objects) {
			registry.register(object.getType());
		}
		return registry;
	}

	private void writeVersionNumber(BitmapWriter writer) {
		writer.writeSingleDigitHexadecimalValue(VERSION_NUMBER);
	}

	private void writeBackground(BitmapWriter writer, GameMap gameMap, GameMapInventory inventory) {
		MapBackgroundInfo info = inventory.getBackground(gameMap.getDefinition().getBackground());
		if (info == null) {
			info = inventory.getBackgrounds().get(0);
		}
		writer.writeDoubleDigitHexadecimalValue(info.getCode());
		writer.writeDoubleDigitHexadecimalValue(info.getImages().size());
	}

	private void writeCharacter(BitmapWriter writer, GameMap gameMap, GameMapInventory inventory) {
		MapCharacterInfo info = inventory.getCharacter(gameMap.getDefinition().getCharacter());
		if (info == null) {
			info = inventory.getCharacters().get(0);
		}
		writer.writeDoubleDigitHexadecimalValue(info.getCode());
		writer.writeSingleDigitHexadecimalValue(info.getAppearancesRunning());
	}

	private void writeObjectTypes(BitmapWriter writer, ObjectTypeRegistry objectTypeRegistry, GameMapInventory inventory) {
		writer.writeDoubleDigitHexadecimalValue(objectTypeRegistry.size());
		for (String typeId : objectTypeRegistry.getRegisteredObjectTypes()) {
			MapObjectTypeInfo info = inventory.getObjectType(typeId);
			Interaction interaction = Interaction.forSymbolicName(info.getInteraction());
			Movement movement = Movement.forSymbolicName(info.getMovement());
			writer.writeTripleDigitHexadecimalValue(info.getCode());
			writeObjectTypeHorizontalDimension(writer, info);
			writeObjectTypeVerticalDimension(writer, info);
			writer.writeSingleDigitHexadecimalValue(interaction.getNumericValue());
			writer.writeSingleDigitHexadecimalValue(info.getAppearances());
			writer.writeSingleDigitHexadecimalValue(movement.getNumericValue());
			if (!Movement.NONE.equals(movement) || info.getAppearances() > 1) {
				writer.writeSingleDigitHexadecimalValue(info.getActivityCycles());
				writer.writeDoubleDigitHexadecimalValue(info.getActivitySpeed());
				writer.writeSingleDigitHexadecimalValue(info.getInactivityTimeMinimum());
				writer.writeSingleDigitHexadecimalValue(info.getInactivityTimeMaximum());
				writer.writeSingleDigitHexadecimalValue(info.getInactivityAppearance());
			}
			if (!Movement.NONE.equals(movement) && info.getAppearances() > 1) {
				writer.writeDoubleDigitHexadecimalValue(info.getAppearancesSpeedWhileMoving());
			}
			if (!Movement.NONE.equals(movement)) {
				writer.writeDoubleDigitHexadecimalValue(convertMovementParameterValue(info.getMovementParameter1()));
				writer.writeDoubleDigitHexadecimalValue(convertMovementParameterValue(info.getMovementParameter2()));
				if (info.getMovementStartAt() != null) {
					writer.writeSingleDigitHexadecimalValue(MovementStart.forSymbolicName(info.getMovementStartAt())
							.getNumericValue());
				} else {
					writer.writeSingleDigitHexadecimalValue(MovementStart.RANDOM.getNumericValue());
				}
			}
			writer.writeSingleDigitHexadecimalValue((int) Math.round(info.getTransparency() * 10));
			if (Interaction.SCORE_VALUE.equals(interaction)) {
				writer.writeDoubleDigitHexadecimalValue(info.getValue());
			}
		}
	}

	private void writeObjectTypeHorizontalDimension(BitmapWriter writer, MapObjectTypeInfo info) {
		int tileSize = info.getWidthInTiles();
		int offset = info.getOffsetHorizontal();
		if (offset == 0) {
			writer.writeSingleDigitHexadecimalValue(tileSize); // between 1 and 15
		} else if (offset < 0) {
			writer.writeSingleDigitHexadecimalValue(0);
			writer.writeSingleDigitHexadecimalValue(tileSize);
			writer.writeDoubleDigitHexadecimalValue(-offset);
		} else {
			throw new IllegalStateException("Horizontal offset must be <= 0: " + offset);
		}
	}

	private void writeObjectTypeVerticalDimension(BitmapWriter writer, MapObjectTypeInfo info) {
		int tileSize = getObjectTypeHeightInTiles(info);
		int offset = info.getOffsetVertical();
		if (offset == 0) {
			writer.writeSingleDigitHexadecimalValue(tileSize); // between 1 and 11
		} else if (offset < 0) {
			writer.writeSingleDigitHexadecimalValue(14);
			writer.writeSingleDigitHexadecimalValue(tileSize);
			writer.writeDoubleDigitHexadecimalValue(-offset);
		} else {
			writer.writeSingleDigitHexadecimalValue(15);
			writer.writeSingleDigitHexadecimalValue(tileSize);
			writer.writeDoubleDigitHexadecimalValue(offset);
		}
	}

	/**
	 * Converts a movement parameter value to a bitmap value
	 * 
	 * @param value
	 *            Movement parameter value, in the range [-508, 512]
	 * @return Bitmap value, in the range [0x00, 0xff]
	 */
	private int convertMovementParameterValue(int value) {
		return Math.max(Math.min(value / 4 + 127, 255), 0);
	}

	private void writeObjects(BitmapWriter writer, ObjectTypeRegistry objectTypeRegistry,
			List<GameMapObjectOnLayer> objects, GameMapInventory inventory) {
		int previousX = 0;
		int index = 0;
		int nextLayerIndex = 0;
		while (index < objects.size()) {
			GameMapObjectOnLayer object = objects.get(index);
			MapObjectTypeInfo info = inventory.getObjectType(object.getType());
			if (!object.isComponent()) {
				int pileSize = getObjectPileSize(objects, index, inventory);
				if (pileSize > 1) {
					writer.writeSingleDigitHexadecimalValue(14);
					writer.writeSingleDigitHexadecimalValue(pileSize);
				}
				if (DepthLayer.DEFAULT.equals(DepthLayer.getDepthLayer(info))) {
					for (int i = index; i < index + pileSize; i++) {
						objects.get(i).setLayerIndex(nextLayerIndex++);
					}
				}
				index += pileSize;
			} else {
				ComponentGameMapObjectOnLayer compObject = object.asComponent();
				int layerIndex = compObject.getComposite().defineLayerIndex(compObject);
				if (layerIndex == GameMapObjectOnLayer.TOP_LAYER) {
					compObject.setLayerIndex(nextLayerIndex);
				} else {
					shiftLayersFrom(layerIndex, objects);
					compObject.setLayerIndex(layerIndex);
					writer.writeSingleDigitHexadecimalValue(13);
					writer.writeDoubleDigitHexadecimalValue(nextLayerIndex - layerIndex);
				}
				nextLayerIndex++;
				index++;
			}
			writer.writeSingleDigitHexadecimalValue(getObjectBaselineY(object, inventory));
			writer.writeSingleDigitHexadecimalValue(Math.min(object.getX() - previousX, 15));
			writer.writeDoubleDigitHexadecimalValue(objectTypeRegistry.getIndex(object.getType()));
			previousX = object.getX();
		}
		writer.writeSingleDigitHexadecimalValue(15);
		// print(objects);
	}

	private void shiftLayersFrom(int layerIndex, List<GameMapObjectOnLayer> objects) {
		for (GameMapObjectOnLayer object : objects) {
			if (object.getLayerIndex() != GameMapObjectOnLayer.INITIAL_LAYER) {
				if (object.getLayerIndex() >= layerIndex) {
					object.shiftLayer();
				}
			}
		}
	}

	private int getObjectPileSize(List<GameMapObjectOnLayer> objects, int startIndex, GameMapInventory inventory) {
		GameMapObject reference = objects.get(startIndex);
		int dy = getObjectHeightInTiles(reference, inventory);
		for (int index = startIndex + 1; index < objects.size(); index++) {
			GameMapObject object = objects.get(index);
			boolean partOfPile = object.getX() == reference.getX()
					&& getObjectBaselineY(object, inventory) == getObjectBaselineY(reference, inventory) + dy
					&& object.getType().equals(reference.getType());
			if (!partOfPile)
				return index - startIndex;
			reference = object;
		}
		return objects.size() - startIndex;
	}

	private void print(List<GameMapObjectOnLayer> objects) {
		for (GameMapObjectOnLayer object : objects) {
			System.out.println(object);
		}
	}

	private static int getObjectBaselineY(GameMapObject object, GameMapInventory inventory) {
		if (isAtmosphericObject(object, inventory)) {
			return 0;
		} else {
			return object.getY();
		}
	}

	private static int getObjectHeightInTiles(GameMapObject object, GameMapInventory inventory) {
		return getObjectTypeHeightInTiles(inventory.getObjectType(object.getType()));
	}

	private static int getObjectTypeHeightInTiles(MapObjectTypeInfo info) {
		if (isAtmosphericObjectType(info)) {
			return MAP_HEIGHT_IN_TILES;
		} else {
			return info.getHeightInTiles();
		}
	}

	private static boolean isAtmosphericObject(GameMapObject object, GameMapInventory inventory) {
		return isAtmosphericObjectType(inventory.getObjectType(object.getType()));
	}

	private static boolean isAtmosphericObjectType(MapObjectTypeInfo info) {
		return Interaction.ATMOSPHERE.equals(Interaction.forSymbolicName(info.getInteraction()));
	}

	private static enum Movement {

		NONE("none", 0),

		HORIZONTAL_STROKE("horizontalStroke", 1),

		HORIZONTAL_SWEEP("horizontalSweep", 2),

		SMOOTH_HORIZONTAL_SWEEP("smoothHorizontalSweep", 3),

		VERTICAL_STROKE("verticalStroke", 4),

		VERTICAL_SWEEP("verticalSweep", 5),

		SMOOTH_VERTICAL_SWEEP("smoothVerticalSweep", 6),

		RADIAL_STROKE("radialStroke", 7),

		RADIAL_SWEEP("radialSweep", 8),

		SMOOTH_RADIAL_SWEEP("smoothRadialSweep", 9),

		VECTOR("vector", 10),

		VECTOR_WITH_GRAVITY("vectorWithGravity", 11);

		private String symbolicName;

		private int numericValue;

		private Movement(String symbolicName, int numericValue) {
			this.symbolicName = symbolicName;
			this.numericValue = numericValue;
		}

		public static Movement forSymbolicName(String name) {
			for (Movement m : Movement.values()) {
				if (m.getSymbolicName().equals(name))
					return m;
			}
			return null;
		}

		public String getSymbolicName() {
			return symbolicName;
		}

		public int getNumericValue() {
			return numericValue;
		}

	}

	private static enum MovementStart {

		BEGIN("0%", 0),

		FIRST_QUARTILE("25%", 1),

		MIDWAY("50%", 2),

		THIRD_QUARTILE("75%", 3),

		RANDOM("random", 15);

		private String symbolicName;

		private int numericValue;

		private MovementStart(String symbolicName, int numericValue) {
			this.symbolicName = symbolicName;
			this.numericValue = numericValue;
		}

		public static MovementStart forSymbolicName(String name) {
			for (MovementStart m : MovementStart.values()) {
				if (m.getSymbolicName().equals(name))
					return m;
			}
			return null;
		}

		public String getSymbolicName() {
			return symbolicName;
		}

		public int getNumericValue() {
			return numericValue;
		}

	}

	private static enum Interaction {

		TANGIBLE("tangible", 0),

		INTANGIBLE("intangible", 1),

		SCORE("score", 2),

		FATAL("fatal", 3),

		FINISH("finish", 4),

		ATMOSPHERE("atmosphere", 5),

		SCORE_VALUE("scoreValue", 6),

		INTANGIBLE_BACK("intangible-back", 7),

		INTANGIBLE_FRONT("intangible-front", 8);

		private String symbolicName;

		private int numericValue;

		private Interaction(String symbolicName, int numericValue) {
			this.symbolicName = symbolicName;
			this.numericValue = numericValue;
		}

		public static Interaction forSymbolicName(String name) {
			for (Interaction i : Interaction.values()) {
				if (i.getSymbolicName().equals(name))
					return i;
			}
			return null;
		}

		public String getSymbolicName() {
			return symbolicName;
		}

		public int getNumericValue() {
			return numericValue;
		}

	}

	private static enum DepthLayer {

		BACK(Interaction.INTANGIBLE_BACK),

		DEFAULT(null),

		FRONT(Interaction.INTANGIBLE_FRONT),

		ATMOS(Interaction.ATMOSPHERE);

		private Interaction interaction;

		private DepthLayer(Interaction interaction) {
			this.interaction = interaction;
		}

		public static DepthLayer getDepthLayer(MapObjectTypeInfo objectType) {
			Interaction interaction = Interaction.forSymbolicName(objectType.getInteraction());
			for (DepthLayer layer : DepthLayer.values()) {
				if (interaction.equals(layer.getInteraction()))
					return layer;
			}
			return DepthLayer.DEFAULT;
		}

		public Interaction getInteraction() {
			return interaction;
		}

	}

	private static class BitmapWriter {

		private BufferedImage image;

		private ColorMap colorMap;

		private Graphics2D canvas;

		private int y;

		private int x;

		public BitmapWriter(int width, int height, ColorMap colorMap) {
			this.image = new BufferedImage(width * 4, height * 4, BufferedImage.TYPE_INT_RGB);
			this.colorMap = colorMap;
			getCanvas().scale(4.0, 4.0);
			clear();
		}

		public void writeTripleDigitHexadecimalValue(int value) {
			if (value < 0 || value >= 4096)
				throw new IllegalArgumentException("0x### value out of bounds: " + value);
			writeSingleDigitHexadecimalValue(value / 256);
			writeSingleDigitHexadecimalValue((value % 256) / 16);
			writeSingleDigitHexadecimalValue(value % 16);
		}

		public void writeDoubleDigitHexadecimalValue(int value) {
			if (value < 0 || value >= 256)
				throw new IllegalArgumentException("0x## value out of bounds: " + value);
			writeSingleDigitHexadecimalValue(value / 16);
			writeSingleDigitHexadecimalValue(value % 16);
		}

		public void writeSingleDigitHexadecimalValue(int value) {
			if (value < 0 || value >= 16)
				throw new IllegalArgumentException("0x# value out of bounds: " + value);
			Color color = getColorMap().getColor(value);
			paintWriteHead(color);
			advanceWriteHead();
		}

		public void writeMessageBoundariesExceeded() {
			getCanvas().setColor(Color.WHITE);
			getCanvas().fillRect(0, 0, getImage().getWidth(), getImage().getHeight());
			getCanvas().setColor(Color.BLACK);
			getCanvas().setFont(new Font(Font.MONOSPACED, Font.PLAIN, 8));
			getCanvas().drawString("Map is too large", 10, 20);
			getCanvas().drawString("Remove some objects", 10, 40);
		}

		public boolean exceedsBoundaries() {
			return getY() >= getHeight();
		}

		private void paintWriteHead(Color color) {
			getCanvas().setColor(color);
			getCanvas().fillRect(getX(), getY(), 1, 1);
		}

		private void advanceWriteHead() {
			setX(getX() + 1);
			if (getX() == getWidth()) {
				setX(0);
				setY(getY() + 1);
			}
		}

		private void clear() {
			getCanvas().setColor(getColorMap().getColor(0));
			getCanvas().fillRect(0, 0, getWidth(), getHeight());
		}

		public BufferedImage getImage() {
			return image;
		}

		public ColorMap getColorMap() {
			return colorMap;
		}

		private Graphics2D getCanvas() {
			if (canvas == null) {
				canvas = (Graphics2D) getImage().getGraphics();
			}
			return canvas;
		}

		private int getWidth() {
			return getImage().getWidth() / 4;
		}

		private int getHeight() {
			return getImage().getHeight() / 4;
		}

		private int getY() {
			return y;
		}

		private void setY(int y) {
			this.y = y;
		}

		private int getX() {
			return x;
		}

		private void setX(int x) {
			this.x = x;
		}

	}

	private static class ColorMap {

		private Map<Integer, Color> cache;

		public ColorMap() {
			this.cache = new HashMap<Integer, Color>();
		}

		public Color getColor(int value) {
			Color color = getCache().get(value);
			if (color == null) {
				color = makeColor(value);
				getCache().put(value, color);
			}
			return color;
		}

		private Color makeColor(int value) {
			if (value < 0 || value >= 16)
				throw new IllegalArgumentException("0x# value out of bounds: " + value);
			int c = 255 - 15 * value;
			return new Color(c, c, c);
		}

		private Map<Integer, Color> getCache() {
			return cache;
		}

	}

	private static class ObjectTypeRegistry {

		private List<String> objectTypesOrderedList;

		private Map<String, Integer> objectTypesIndex;

		public ObjectTypeRegistry() {
			this.objectTypesOrderedList = new Vector<String>(256);
			this.objectTypesIndex = new HashMap<String, Integer>(256);
		}

		public void register(String objectType) {
			if (!contains(objectType)) {
				this.objectTypesIndex.put(objectType, size());
				this.objectTypesOrderedList.add(objectType);
			}
		}

		public boolean contains(String objectType) {
			return this.objectTypesIndex.containsKey(objectType);
		}

		public int getIndex(String objectType) {
			Integer index = this.objectTypesIndex.get(objectType);
			return index != null ? index.intValue() : -1;
		}

		public int size() {
			return this.objectTypesOrderedList.size();
		}

		public List<String> getRegisteredObjectTypes() {
			return this.objectTypesOrderedList;
		}

	}

	private static class GameMapObjectOnLayer extends GameMapObject {

		public static final int INITIAL_LAYER = -1;

		public static final int TOP_LAYER = Integer.MAX_VALUE;

		private int layerIndex;

		public GameMapObjectOnLayer(GameMapObject object) {
			this(object.getX(), object.getY(), object.getType());
		}

		public GameMapObjectOnLayer(int x, int y, String type) {
			super(x, y, type);
			this.layerIndex = INITIAL_LAYER;
		}

		@Override
		public String toString() {
			StringBuilder builder = new StringBuilder();
			builder.append("GameMapObjectOnLayer [x=");
			builder.append(getX());
			builder.append(", y=");
			builder.append(getY());
			builder.append(", type=");
			builder.append(getType());
			builder.append(", layer=");
			builder.append(getLayerIndex());
			builder.append(", component=");
			builder.append(isComponent());
			builder.append("]");
			return builder.toString();
		}

		public boolean isComponent() {
			return false;
		}

		public ComponentGameMapObjectOnLayer asComponent() {
			if (isComponent()) {
				return (ComponentGameMapObjectOnLayer) this;
			} else {
				throw new ClassCastException("not a component object");
			}
		}

		public void shiftLayer() {
			setLayerIndex(getLayerIndex() + 1);
		}

		public int getLayerIndex() {
			return layerIndex;
		}

		public void setLayerIndex(int layerIndex) {
			this.layerIndex = layerIndex;
		}

	}

	private static class ComponentGameMapObjectOnLayer extends GameMapObjectOnLayer {

		private CompositeGameMapObject composite;

		public ComponentGameMapObjectOnLayer(int x, int y, String type, CompositeGameMapObject composite) {
			super(x, y, type);
			this.composite = composite;
		}

		@Override
		public boolean isComponent() {
			return true;
		}

		public CompositeGameMapObject getComposite() {
			return composite;
		}

	}

	private static class CompositeGameMapObject {

		private List<ComponentGameMapObjectOnLayer> components;

		public CompositeGameMapObject() {
			this.components = new Vector<ComponentGameMapObjectOnLayer>();
		}

		public void addComponent(ComponentGameMapObjectOnLayer component) {
			getComponents().add(component);
		}

		public int defineLayerIndex(ComponentGameMapObjectOnLayer component) {
			int layerIndex = GameMapObjectOnLayer.TOP_LAYER;
			int i = getComponents().indexOf(component);
			if (i >= 0) {
				for (int j = i + 1; j < getComponents().size(); j++) {
					int layer = getComponents().get(j).getLayerIndex();
					if (layer != GameMapObjectOnLayer.INITIAL_LAYER) {
						layerIndex = Math.min(layerIndex, layer);
					}
				}
			}
			return layerIndex;
		}

		public List<ComponentGameMapObjectOnLayer> getComponents() {
			return components;
		}

	}

	private static class GameMapObjectSorter implements Comparator<GameMapObject> {

		private GameMapInventory inventory;

		public GameMapObjectSorter(GameMapInventory inventory) {
			this.inventory = inventory;
		}

		/*
		 * By increasing-X then by increasing-Y
		 */
		@Override
		public int compare(GameMapObject one, GameMapObject other) {
			if (one.getX() < other.getX()) {
				return -1;
			} else if (one.getX() > other.getX()) {
				return 1;
			} else {
				return getObjectBaselineY(one, getInventory()) - getObjectBaselineY(other, getInventory());
			}
		}

		private GameMapInventory getInventory() {
			return inventory;
		}

	}

}