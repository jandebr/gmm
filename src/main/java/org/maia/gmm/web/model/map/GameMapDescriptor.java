package org.maia.gmm.web.model.map;

import java.util.Date;

public class GameMapDescriptor {

	private String name;

	private Date createdAt;

	private Date lastModifiedAt;

	private boolean readOnly;

	public GameMapDescriptor() {
	}

	public GameMapDescriptor(String name) {
		this.name = name;
	}

	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("GameMapDescriptor [name=");
		builder.append(name);
		builder.append(", createdAt=");
		builder.append(createdAt);
		builder.append(", lastModifiedAt=");
		builder.append(lastModifiedAt);
		builder.append(", readOnly=");
		builder.append(readOnly);
		builder.append("]");
		return builder.toString();
	}

	public String getName() {
		return name;
	}

	public Date getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Date createdAt) {
		this.createdAt = createdAt;
	}

	public Date getLastModifiedAt() {
		return lastModifiedAt;
	}

	public void setLastModifiedAt(Date lastModifiedAt) {
		this.lastModifiedAt = lastModifiedAt;
	}

	public boolean isReadOnly() {
		return readOnly;
	}

	public void setReadOnly(boolean readOnly) {
		this.readOnly = readOnly;
	}

}