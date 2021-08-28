package org.maia.gmm.web.service;

import org.maia.gmm.web.io.GameMapIO;
import org.maia.gmm.web.model.collection.GameMapCollection;

public class GameMapCollectionServiceImpl implements GameMapCollectionService {

	public GameMapCollectionServiceImpl() {
	}

	@Override
	public boolean exists(String collectionId) {
		return GameMapIO.getInstance().existsGameMapCollectionDirectory(collectionId);
	}

	@Override
	public GameMapCollection create() {
		String collectionId = generateUniqueCollectionId();
		GameMapIO.getInstance().createGameMapCollectionDirectory(collectionId);
		return new GameMapCollection(collectionId);
	}

	private String generateUniqueCollectionId() {
		String collectionId = generateRandomCollectionId();
		while (exists(collectionId)) {
			collectionId = generateRandomCollectionId();
		}
		return collectionId;
	}

	private String generateRandomCollectionId() {
		StringBuilder sb = new StringBuilder(8);
		for (int i = 0; i < sb.capacity(); i++) {
			char c = (char) ((int) 'a' + (int) Math.floor(Math.random() * 26));
			sb.append(c);
		}
		return sb.toString();
	}

}