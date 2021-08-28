package org.maia.gmm.web.service;

@SuppressWarnings("serial")
public class GameMapException extends Exception {

	public GameMapException() {
	}

	public GameMapException(String message) {
		super(message);
	}

	public GameMapException(Throwable cause) {
		super(cause);
	}

	public GameMapException(String message, Throwable cause) {
		super(message, cause);
	}

}