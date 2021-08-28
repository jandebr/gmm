package org.maia.gmm.web.io;

import java.io.File;
import java.io.FileFilter;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.Reader;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.attribute.BasicFileAttributes;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Vector;

import org.maia.gmm.web.model.collection.GameMapCollection;
import org.maia.gmm.web.model.map.GameMap;
import org.maia.gmm.web.model.map.GameMapDescriptor;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;

public class GameMapIO {

	private static GameMapIO instance;

	private File mapsBaseDirectory;

	private Gson jsonConverter;

	private GameMapIO() {
	}

	public boolean existsGameMapCollectionDirectory(String collectionId) {
		return new File(getGameMapsBaseDirectory(), collectionId).exists();
	}

	public void createGameMapCollectionDirectory(String collectionId) {
		new File(getGameMapsBaseDirectory(), collectionId).mkdirs();
	}

	public File getGameMapCollectionDirectory(GameMapCollection collection) {
		File dir = getGameMapsBaseDirectory();
		if (collection != null) {
			File subdir = new File(dir, collection.getId());
			if (subdir.exists() && subdir.isDirectory()) {
				dir = subdir;
			}
		}
		return dir;
	}

	public File getGameMapDirectory(String gameMapName, GameMapCollection collection) {
		return new File(getGameMapCollectionDirectory(collection), gameMapName);
	}

	public File getGameMapFile(String gameMapName, GameMapCollection collection) {
		return new File(getGameMapDirectory(gameMapName, collection), "map.json");
	}

	public Collection<File> getGameMapFiles(final GameMapCollection collection) {
		Collection<File> gameMapFiles = new Vector<File>();
		File[] gameMapDirs = getGameMapCollectionDirectory(collection).listFiles(new FileFilter() {

			@Override
			public boolean accept(File file) {
				if (!file.isDirectory())
					return false;
				if (!getGameMapFile(file.getName(), collection).exists())
					return false;
				return true;
			}
		});
		for (int i = 0; i < gameMapDirs.length; i++) {
			String gameMapName = gameMapDirs[i].getName();
			gameMapFiles.add(getGameMapFile(gameMapName, collection));
		}
		return gameMapFiles;
	}

	public GameMapDescriptor createGameMapDescriptorFromFile(File gameMapFile) throws IOException {
		String gameMapName = gameMapFile.getParentFile().getName();
		BasicFileAttributes attrs = Files.readAttributes(gameMapFile.toPath(), BasicFileAttributes.class);
		Date createdAt = new Date(attrs.creationTime().toMillis());
		Date lastModifiedAt = new Date(attrs.lastModifiedTime().toMillis());
		boolean readOnly = !gameMapFile.canWrite();
		GameMapDescriptor descriptor = new GameMapDescriptor(gameMapName);
		descriptor.setCreatedAt(createdAt);
		descriptor.setLastModifiedAt(lastModifiedAt);
		descriptor.setReadOnly(readOnly);
		return descriptor;
	}

	public GameMap readGameMapFromFile(File gameMapFile) throws IOException {
		Reader reader = new FileReader(gameMapFile);
		GameMap gameMap = parseGameMapFromJson(reader);
		reader.close();
		gameMap.setDescriptor(createGameMapDescriptorFromFile(gameMapFile));
		return gameMap;
	}

	public void writeGameMapToFile(GameMap gameMap, GameMapCollection collection) throws IOException {
		boolean readOnly = gameMap.getDescriptor().isReadOnly();
		GameMapDescriptor storedDescriptor = new GameMapDescriptor(gameMap.getName());
		storedDescriptor.setReadOnly(readOnly);
		GameMap storedGameMap = new GameMap(storedDescriptor, gameMap.getDefinition());
		File gameMapFile = getGameMapFile(gameMap.getName(), collection);
		gameMapFile.getParentFile().mkdirs();
		PrintWriter pw = new PrintWriter(gameMapFile);
		pw.print(formatGameMapToJson(storedGameMap));
		pw.close();
		if (readOnly)
			gameMapFile.setReadOnly();
	}

	public void deleteGameMap(String gameMapName, GameMapCollection collection) {
		deleteFolder(getGameMapDirectory(gameMapName, collection));
	}

	private void deleteFolder(File folder) {
		for (File file : folder.listFiles()) {
			if (file.isDirectory()) {
				deleteFolder(file);
			} else {
				file.delete();
			}
		}
		folder.delete();
	}

	public GameMap parseGameMapFromJson(Reader reader) {
		return getJsonConverter().fromJson(reader, GameMap.class);
	}

	public GameMap parseGameMapFromJson(String json) {
		return getJsonConverter().fromJson(json, GameMap.class);
	}

	public String formatGameMapToJson(GameMap gameMap) {
		return getJsonConverter().toJson(gameMap);
	}

	public String formatGameMapDescriptorsToJson(List<GameMapDescriptor> descriptors) {
		return getJsonConverter().toJson(descriptors);
	}

	public static GameMapIO getInstance() {
		if (instance == null) {
			instance = new GameMapIO();
		}
		return instance;
	}

	public File getGameMapsBaseDirectory() {
		return mapsBaseDirectory;
	}

	public void setGameMapsBaseDirectory(File directory) {
		this.mapsBaseDirectory = directory;
	}

	private Gson getJsonConverter() {
		if (jsonConverter == null) {
			GsonBuilder builder = new GsonBuilder();
			builder.registerTypeAdapter(Date.class, new JsonDateAdapter());
			jsonConverter = builder.create();
		}
		return jsonConverter;
	}

	private static class JsonDateAdapter implements JsonSerializer<Date>, JsonDeserializer<Date> {

		private DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX");

		public JsonDateAdapter() {
		}

		@Override
		public JsonElement serialize(Date src, Type type, JsonSerializationContext context) {
			return new JsonPrimitive(getDateFormat().format(src));
		}

		@Override
		public Date deserialize(JsonElement json, Type type, JsonDeserializationContext context)
				throws JsonParseException {
			try {
				return getDateFormat().parse(json.getAsJsonPrimitive().getAsString());
			} catch (ParseException e) {
				return null;
			}
		}

		public DateFormat getDateFormat() {
			return dateFormat;
		}

	}

}