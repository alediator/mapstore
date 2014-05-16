/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/**
 * @requires plugins/Tool.js
 * @requires widgets/PlanEditorPanel.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = PlanEditor
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins");

/** api: constructor
 *  .. class:: PlanEditor(config)
 *
 *    Provides an action bind playback, downlad list and wfs grid plugins.
 */
gxp.plugins.PlanEditor = Ext.extend(gxp.plugins.Tool, {
    
    /** api: ptype = gxp_planeditor */
    ptype: "gxp_planeditor",

    /** i18n **/
    titleText: "Plan",
    columnsHeadersText:{
        service_name: "ServiceName",
        start: "Start",
        end: "End",
        sensor: "Sensor",
        sensor_mode: "SensorMode"
    },
    /** EoF i18n **/
    
    /** api: config[addLayerID]
    *  ``String`` add layer plugin id
    */
    addLayerID: "addlayer",
    
    /** api: config[source]
    *  ``String`` source of the layer
    */
    source: "local",
    
    /** api: config[layerName]
    *  ``String`` layer name for the edit
    */
    layerName: "aois",

    layerOptions: {
        customParams:{
            displayInLayerSwitcher: false
        }
    },

    waitText: "Please wait, loading...",

    // TODO: custom parameters. document it
    auxiliaryLayerName: "Polygon Layer",
    displayAuxiliaryLayerInLayerSwitcher: false,
    addWMSLayer: false,
    layerURL: null,
    addFeatureTable: true,
    wfsVersion: "1.1.0",
    defaultGeometryName: "the_geom",
    defaultFeatureNS: "http://mariss",
    defaultProjection: "EPSG:4326",

    // private parameters
    currentServiceName: null,
    features: [],
    
    /** api: method[addOutput]
     */
    addOutput: function() {

        // add the layer
        this.addLayer();

        var outputConfig = {
            xtype: "gxp_planeditorpanel",
            title: this.titleText,
            listeners:{
                edit: this.onEdit,
                save: this.onSave,
                drawbutton: this.onDraw,
                selectservice: this.onSelectService,
                render: this.onPanelRender,
                scope:this
            }
        };
        Ext.apply(outputConfig, this.outputConfig || {} );
        return gxp.plugins.PlanEditor.superclass.addOutput.call(this, outputConfig);    
    },

    onPanelRender: function(panel){
        this.viewPanel = panel;
        if(this.addFeatureTable){
            // Feature grid
            this.grid = {
                xtype: "grid",
                title: "Feature Table",
                height: 150,
                sm: new GeoExt.grid.FeatureSelectionModel(),
                store: new GeoExt.data.FeatureStore({
                    layer: this.polygonLayer,
                    fields: [
                        {name: "service_name", type: "string"},
                        {name: "start", type: "string"},
                        {name: "end", type: "string"},
                        {name: "sensor", type: "string"},
                        {name: "sensor_mode", type: "string"}
                    ],
                    proxy: new GeoExt.data.ProtocolProxy({
                        protocol: new OpenLayers.Protocol.WFS({
                            version: this.wfsVersion,
                            url: this.layerURL,
                            featureType: this.layerName,
                            geometryName: this.defaultGeometryName,
                            featureNS: this.defaultFeatureNS,
                            srsName: this.defaultProjection,
                            filter: this.getCurrentFilter()
                        })
                    }),
                    autoLoad: true
                }),
                columns: [
                    {header: this.columnsHeadersText["service_name"], dataIndex: "service_name"},
                    {header: this.columnsHeadersText["start"], dataIndex: "start"},
                    {header: this.columnsHeadersText["end"], dataIndex: "end"},
                    {header: this.columnsHeadersText["sensor"], dataIndex: "sensor"},
                    {header: this.columnsHeadersText["sensor_mode"], dataIndex: "sensor_mode"}
                ],
                bbar: []
            };
            panel.add(this.grid);    
        }
    },

    addLayer: function(){

        // addMSLayer(this.layerName, this.layerName, this.target.sources[this.source].url);
        var addLayer = this.target.tools[this.addLayerID];
        var source = this.target.sources[this.source];

        if(source){
            this.layerURL = source.url;

            // add layer if present
            if(addLayer && this.addWMSLayer){
                var options = {};
                Ext.apply(options, this.layerOptions);
                Ext.apply(options ,{
                    msLayerTitle: unescape(this.layerName),
                    msLayerName: unescape(this.layerName),
                    wmsURL: source.url
                });   
                addLayer.addLayer(options);
            }
        }

        // TODO: hide and show only current
        this.saveStrategy = new OpenLayers.Strategy.Save();
        // polygonLayer
        this.polygonLayer = new OpenLayers.Layer.Vector(this.auxiliaryLayerName, {
            displayInLayerSwitcher: this.displayAuxiliaryLayerInLayerSwitcher,
            strategies: [
                new OpenLayers.Strategy.BBOX(),
                this.saveStrategy
            ],
            protocol: new OpenLayers.Protocol.WFS({
                version: this.wfsVersion,
                url: this.layerURL,
                featureType: this.layerName,
                geometryName: this.defaultGeometryName,
                featureNS: this.defaultFeatureNS,
                srsName: this.defaultProjection,
                filter: this.getCurrentFilter()
            }),
            projection: this.defaultProjection
        });
        this.target.mapPanel.map.addLayer(this.polygonLayer);
    },

    // generate a filter for the layer
    getCurrentFilter: function(){
        return new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.OR,
            filters: [
                new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: "service_name",
                    value: this.currentServiceName
                })
            ]
        });
    },

    onSelectService: function(serviceName, panel){
        this.currentServiceName = serviceName;
        Ext.getCmp(panel.id + "_save_button").enable();
        panel.getForm().setValues({
            name: serviceName + " AOI"
        });
        // refresh filter on WFS
        var currentFilter = this.getCurrentFilter();
        this.polygonLayer.protocol.filter = currentFilter;
        this.polygonLayer.refresh();
        if(this.addFeatureTable){
            this.viewPanel.items.items[2].store.proxy.protocol.filter = currentFilter;
            this.viewPanel.items.items[2].store.reload();
        }
    },

    onEdit: function(){
        console.log("Edit")
    },

    onSave: function(form){
        var values = form.getValues();
        // TODO: merge features in a multipolygon and save only one
        for(var i = 0; i < this.features.length; i++){
            Ext.apply(this.features[i].attributes,{
                service_name: values.name,
                // TODO: get date time from form
                // start: start,
                // end: end,
                sensor: values.sensor,
                sensor_mode: values.sensorMode
            });
        }
        this.saveStrategy.save();
    },

    onImport: function(){

    },

    onDraw: function(drawButtonId){
        this.drawButtonId = drawButtonId;
        if(!this.drawControl){
            this.drawControl = new OpenLayers.Control.DrawFeature(this.polygonLayer, OpenLayers.Handler.Polygon,{
                eventListeners:{
                    "featureadded": this.onFeatureAdded,
                    scope: this
                }
            });
            //this.drawControl.events.on("featureadded ", this.onFeatureAdded, this);
            this.target.mapPanel.map.addControl(this.drawControl);
        }
        this.drawControl.activate();
    },

    onFeatureAdded: function(controlReturns){
        this.drawControl.deactivate();
        Ext.getCmp(this.drawButtonId).enable();
        // write attributes
        this.features.push(controlReturns.feature);
    },

    onConfirm: function(form){

    }
});

Ext.preg(gxp.plugins.PlanEditor.prototype.ptype, gxp.plugins.PlanEditor);
