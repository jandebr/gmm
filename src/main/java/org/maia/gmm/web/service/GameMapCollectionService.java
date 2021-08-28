package org.maia.gmm.web.service;

import org.maia.gmm.web.model.collection.GameMapCollection;

public interface GameMapCollectionService {

	boolean exists(String collectionId) throws GameMapException;

	GameMapCollection create() throws GameMapException;

}