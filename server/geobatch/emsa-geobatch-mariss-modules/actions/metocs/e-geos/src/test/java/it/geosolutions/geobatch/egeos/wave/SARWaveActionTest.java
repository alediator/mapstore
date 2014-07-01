/*
 *  GeoBatch - Open Source geospatial batch processing system
 *  http://geobatch.geo-solutions.it/
 *  Copyright (C) 2014 GeoSolutions S.A.S.
 *  http://www.geo-solutions.it
 *
 *  GPLv3 + Classpath exception
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package it.geosolutions.geobatch.egeos.wave;

import static org.junit.Assert.fail;
import it.geosolutions.filesystemmonitor.monitor.FileSystemEvent;
import it.geosolutions.filesystemmonitor.monitor.FileSystemEventType;

import java.io.File;
import java.util.EventObject;
import java.util.LinkedList;
import java.util.Queue;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

/**
 * JUnit test for {@link SARWaveAction} process
 * 
 * @author adiaz
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations={"classpath:test-context.xml"})
public class SARWaveActionTest {
	
	protected final static Logger LOGGER = LoggerFactory
			.getLogger(SARWaveActionTest.class);

	private String filePathTest = "src/test/resources/SAR_wave.nc";
	
	/**
	 * Configuration for the SARWindAction
	 * 
	 * @return
	 */
	private SARWaveActionConfiguration getConfiguration() {

		/**
		 * <SARWaveActionConfiguration>
		 * <workingDirectory>EGEOSworkingdir/SARWind</workingDirectory>
		 * <crs>EPSG:4326</crs> <envelope/>
		 * <metocDictionaryPath>registry_work/config
		 * /NURC-2010/Super-Ensemble/metoc-dictionary.xml</metocDictionaryPath>
		 * <metocHarvesterXMLTemplatePath>registry_work/config/NURC-2010/Super-
		 * Ensemble/Nurc-Cim_Schema/
		 * 2010_07_13/example/iso-models-template.xml</metocHarvesterXMLTemplatePath
		 * > <id>a1</id> <description>description1</description>
		 * <name>test</name> </SARWindActionConfiguration>
		 */
		SARWaveActionConfiguration config = new SARWaveActionConfiguration(
				null, null, null);
		config.setWorkingDirectory("working");
		config.setCrs("EPSG:4326");		config.setMetocDictionaryPath("registry_work/config/NURC-2010/Super-Ensemble/metoc-dictionary.xml");
		config.setMetocHarvesterXMLTemplatePath("registry_work/config/NURC-2010/Super-Ensemble/Nurc-Cim_Schema/2010_07_13/example/iso-models-template.xml");

		return config;
	}

	/**
	 * Test the SARWaveAction process
	 * 
	 * @throws Exception
	 */
	@Test
	public void sarWaveTest() throws Exception {
		try{
			// configure
			SARWaveActionConfiguration configuration = getConfiguration();
			SARWaveAction action = new SARWaveAction(configuration);
			// launch
			Queue<EventObject> events = new LinkedList<EventObject>();
			File file = new File(filePathTest);
			LOGGER.info("Loading " + file);
			FileSystemEvent event = new FileSystemEvent(file,
					FileSystemEventType.FILE_ADDED);
			events.add(event);
			@SuppressWarnings({ "unused", "rawtypes" })
			Queue result = action.execute(events);
		}catch (Exception e){
			LOGGER.error("Error on the file process", e);
			fail();
		}
	}
}
