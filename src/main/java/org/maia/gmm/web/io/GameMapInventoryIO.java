package org.maia.gmm.web.io;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import org.maia.gmm.web.model.inventory.GameMapInventory;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class GameMapInventoryIO {

	private static final String INVENTORY_RESOURCE_NAME = "map-inventory.json";

	private static GameMapInventoryIO instance;

	private Gson jsonConverter;

	private GameMapInventoryIO() {
	}

	public GameMapInventory readInventory() throws IOException {
		InputStream is = this.getClass().getClassLoader().getResourceAsStream(INVENTORY_RESOURCE_NAME);
		Reader reader = new BufferedReader(new InputStreamReader(is));
		return getJsonConverter().fromJson(reader, GameMapInventory.class);
	}

	public static GameMapInventoryIO getInstance() {
		if (instance == null) {
			instance = new GameMapInventoryIO();
		}
		return instance;
	}

	private Gson getJsonConverter() {
		if (jsonConverter == null) {
			jsonConverter = new GsonBuilder().create();
		}
		return jsonConverter;
	}

}