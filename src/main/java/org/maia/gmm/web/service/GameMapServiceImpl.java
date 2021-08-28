package org.maia.gmm.web.service;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Vector;

import org.maia.gmm.web.io.GameMapIO;
import org.maia.gmm.web.io.GameMapInventoryIO;
import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.model.inventory.GameMapInventory;
import org.maia.gmm.web.model.map.GameMap;
import org.maia.gmm.web.model.map.GameMapDescriptor;
import org.maia.gmm.web.model.map.GameMapDownload;

public class GameMapServiceImpl implements GameMapService {

	private GameMapInventory inventory;

	public GameMapServiceImpl() {
	}

	@Override
	public List<GameMapDescriptor> list(GameMapCollection collection) throws GameMapException {
		List<GameMapDescriptor> descriptors = new Vector<GameMapDescriptor>();
		try {
			for (File gameMapFile : GameMapIO.getInstance().getGameMapFiles(collection)) {
				descriptors.add(GameMapIO.getInstance().createGameMapDescriptorFromFile(gameMapFile));
			}
		} catch (IOException e) {
			throw new GameMapException(e);
		}
		Collections.sort(descriptors, new GameMapDescriptorListSorter());
		return descriptors;
	}

	@Override
	public GameMap load(String gameMapName, GameMapCollection collection) throws GameMapException {
		try {
			File gameMapFile = GameMapIO.getInstance().getGameMapFile(gameMapName, collection);
			return GameMapIO.getInstance().readGameMapFromFile(gameMapFile);
		} catch (IOException e) {
			throw new GameMapException(e);
		}
	}

	@Override
	public void save(GameMap gameMap, GameMapCollection collection) throws GameMapException {
		if (gameMap.getDescriptor().isReadOnly()) {
			throw new GameMapException("Cannot save a read-only map");
		} else {
			try {
				GameMapIO.getInstance().writeGameMapToFile(gameMap, collection);
			} catch (IOException e) {
				throw new GameMapException(e);
			}
		}
	}

	@Override
	public void delete(String gameMapName, GameMapCollection collection) {
		GameMapIO.getInstance().deleteGameMap(gameMapName, collection);
	}

	@Override
	public GameMapDownload forDownload(String gameMapName, GameMapCollection collection) throws GameMapException {
		GameMap gameMap = load(gameMapName, collection);
		GameMapInventory inventory = getInventory();
		BufferedImage image = new GameMapBitmapGenerator().generateBitmap(gameMap, inventory);
		return new GameMapDownload(image);
	}

	private GameMapInventory getInventory() {
		if (inventory == null) {
			try {
				inventory = GameMapInventoryIO.getInstance().readInventory();
			} catch (IOException e) {
				System.err.println("Could not read the inventory: " + e.getMessage());
			}
		}
		return inventory;
	}

	private static class GameMapDescriptorListSorter implements Comparator<GameMapDescriptor> {

		@Override
		public int compare(GameMapDescriptor oneDescriptor, GameMapDescriptor otherDescriptor) {
			// last modified comes first
			return -oneDescriptor.getLastModifiedAt().compareTo(otherDescriptor.getLastModifiedAt());
		}

	}

}