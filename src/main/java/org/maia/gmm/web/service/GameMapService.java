package org.maia.gmm.web.service;

import java.util.List;

import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.model.map.GameMap;
import org.maia.gmm.web.model.map.GameMapDescriptor;
import org.maia.gmm.web.model.map.GameMapDownload;

public interface GameMapService {

	List<GameMapDescriptor> list(GameMapCollection collection) throws GameMapException;

	GameMap load(String gameMapName, GameMapCollection collection) throws GameMapException;

	void save(GameMap gameMap, GameMapCollection collection) throws GameMapException;

	void delete(String gameMapName, GameMapCollection collection) throws GameMapException;

	GameMapDownload forDownload(String gameMapName, GameMapCollection collection) throws GameMapException;

}