/**
 *  Copyright (C) 2007 - 2014 GeoSolutions S.A.S.
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

/**
 * @include plugins/spatialselector/BBOXSpatialSelectorMethod.js
 * @include plugins/spatialselector/BufferSpatialSelectorMethod.js
 * @include plugins/spatialselector/CircleSpatialSelectorMethod.js
 * @include plugins/spatialselector/GeocoderSpatialSelectorMethod.js
 * @include plugins/spatialselector/PolygonSpatialSelectorMethod.js
 */
 
/**
 * @author Alejandro Diaz
 */

/** api: (define)
 *  module = gxp.plugins.spatialselector
 *  class = SpatialSelectorMethod
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace('gxp.plugins.spatialselector');

/** api: constructor
 *  .. class:: SpatialSelectorMethod(config)
 *
 *    Common code for plugins for spatial selection.
 *    Known plugins: <ul>
 *       <li>BBOXSpatialSelectorMethod: `gxp_spatial_bbox_selector` ptype</li>
 *       <li>BufferSpatialSelectorMethod: `gxp_spatial_buffer_selector` ptype</li>
 *       <li>CircleSpatialSelectorMethod: `gxp_spatial_circle_selector` ptype</li>
 *       <li>GeocoderSpatialSelectorMethod: `gxp_spatial_geocoding_selector` ptype</li>
 *       <li>PolygonSpatialSelectorMethod: `gxp_spatial_polygon_selector` ptype</li>
 * 	  </ul>
 */
gxp.plugins.spatialselector.SpatialSelectorMethod = Ext.extend(gxp.plugins.Tool, {

	/** api: config[name]
	 *  ``String``
	 *  Name to show on the combo box of the spatial selected.
	 */

	/** api: config[label]
	 *  ``String``
	 *  Label to show on the combo box of the spatial selected.
	 */

	/** api: config[output]
	 *  ``Object``
	 *  Output for this plugin
	 */

	/** api: config[currentGeometry]
	 *  ``Object``
	 *  Selected geometry
	 */

	/** api: config[filterGeometryName]
	 *  ``Object``
	 *  Parameter to perform the filter
	 */

	/** api: config[hideWhenDeactivate]
	 *  ``Boolean``
	 *  Flag to hide output when the selection method is deactivated. Default is true
	 */
	hideWhenDeactivate: true,

	/** api: config[zoomToCurrentExtent]
	 *  ``Boolean``
	 *  Flag to zoom the current map to the selected geometry when you select one. Default is false
	 */
	zoomToCurrentExtent: false,

	/** api: config[defaultStyle]
	 *  ``Object``
	 */
	defaultStyle : {
		"strokeColor" : "#ee9900",
		"fillColor" : "#ee9900",
		"fillOpacity" : 0.4,
		"strokeWidth" : 1
	},

	/** api: config[selectStyle]
	 *  ``Object``
	 */
	selectStyle : {
		"strokeColor" : "#ee9900",
		"fillColor" : "#ee9900",
		"fillOpacity" : 0.4,
		"strokeWidth" : 1
	},

	/** api: config[temporaryStyle]
	 *  ``Object``
	 */
	temporaryStyle : {
		"pointRadius" : 6,
		"fillColor" : "#FF00FF",
		"strokeColor" : "#FF00FF",
		"label" : "Select",
		"graphicZIndex" : 2
	},

	// init spatialSelectors 
	constructor : function(config) {
		Ext.apply(this, config);
		
		return gxp.plugins.spatialselector.SpatialSelectorMethod.superclass.constructor.call(this, arguments);
	},

	/** api: method[getSelectionMethodItem]
     *  :returns: ``Object`` For the selection type combo
	 * Generate a item for the selection type combo
	 */
	getSelectionMethodItem: function(){
        return {
        	label: this.label, 
        	name: this.name
        };
	},

	/** api: method[getQueryFilter]
     *  :returns: ``Object`` filter to perform a WFS query
	 * Generate a filter for the selected method
	 */
	getQueryFilter: function(){
		if(this.currentGeometry){
			this.currentFilter = new OpenLayers.Filter.Spatial({
				type: OpenLayers.Filter.Spatial.INTERSECTS,
				property:  this.filterGeometryName,
				value: this.currentGeometry,
				bounds: this.currentGeometry.getBounds()
			});
		}else{
	        this.currentFilter = null;
		}

		return this.currentFilter;
	},

	/** api: method[activate]
     *  Trigger action when activate the plugin
	 */
	activate: function(){
		this.reset();
		if(this.output){
			if(this.output.setDisabled){
				this.output.setDisabled(false);	
			}
			if(this.output.doLayout){
				this.output.doLayout();
			}
			if(this.hideWhenDeactivate && this.output.show){
				this.output.show();
			}
		}else{
			this.output = this.addOutput();
		}
	},

	/** api: method[deactivate]
     *  Trigger action when deactivate the plugin
	 */
	deactivate: function(){
		this.reset();
		if(this.output){
			if(this.output.setDisabled){
				this.output.setDisabled(true);	
			}
			if(this.hideWhenDeactivate && this.output.hide){
				this.output.hide();
			}
		}
	},

    /** api: method[addOutput]
     */
    addOutput: function() {
    	// TODO: Override it on plugins
    },

	/** api: method[reset]
     *  Trigger action when reset the plugin
	 */
    reset: function(){
    	// TODO: Override it on plugins	
    	this.currentGeometry = null;
    	this.currentFilter = null;
    },

	/** api: method[reset]
     *  :arg geometry: ``Object`` The geometry to be setted as current geometry.
     *  Set current geometry
	 */
    setCurrentGeometry: function(geometry){
		this.currentGeometry = geometry;
    	if (geometry) {

			if (this.zoomToCurrentExtent && geometry && geometry.getBounds) {
				var dataExtent = geometry.getBounds();
				this.target.mapPanel.map.zoomToExtent(dataExtent, closest=false);
			}
			
			this.output.fireEvent("geometrySelect", geometry);
		} 
    }
});