package org.maia.gmm.web;

import java.io.File;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.maia.gmm.web.io.GameMapIO;

public class WebApplication implements ServletContextListener {

	public WebApplication() {
	}

	@Override
	public void contextDestroyed(ServletContextEvent event) {
	}

	@Override
	public void contextInitialized(ServletContextEvent event) {
		ServletContext context = event.getServletContext();
		GameMapIO.getInstance().setGameMapsBaseDirectory(discoverGameMapsBaseDirectory(context));
		System.out.println("Base directory for game maps: "
				+ GameMapIO.getInstance().getGameMapsBaseDirectory().getAbsolutePath());
	}

	private File discoverGameMapsBaseDirectory(ServletContext context) {
		return new File(System.getProperty("mapsBaseDirectory", context.getInitParameter("mapsBaseDirectory")));
	}

}