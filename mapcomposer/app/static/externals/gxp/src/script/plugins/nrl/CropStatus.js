/**
 *  Copyright (C) 2007 - 2012 GeoSolutions S.A.S.
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
 * @author Lorenzo Natali
 */

/**
 * @requires plugins/Tool.js
 */

/** api: (define)
 *  module = gxp.plugins
 *  class = CropStatus
 */

/** api: (extends)
 *  plugins/Tool.js
 */
Ext.namespace("gxp.plugins.nrl");

/** api: constructor
 *  .. class:: NRL_Modules(config)
 *
 *    Plugin for adding NRL CropStatus Module to a :class:`gxp.Viewer`.
 */   
gxp.plugins.nrl.CropStatus = Ext.extend(gxp.plugins.Tool, {
 /** api: ptype = nrl_crop_status */
    ptype: "nrl_crop_status",

	areaFilter: "province NOT IN ('GILGIT BALTISTAN','AJK','DISPUTED TERRITORY','DISPUTED AREA')",
    
    /** private: method[addOutput]
     *  :arg config: ``Object``
     */
    addOutput: function(config) {
		var cropStatus  = {
					xtype:'form',
					title: 'Crop Status',
					layout: "form",
					minWidth:180,
					autoScroll:true,
					frame:true,
					buttons:[{
						text:'Compute',
						handler:function(){
								Ext.Msg.alert("Add Area","Not Yet Implemented");
						}
					}],
					items:[
						{ 
							fieldLabel: 'Output Type',
							xtype: 'radiogroup',
							anchor:'100%',
							autoHeight:true,
                            name:'outputType',
                            ref:'outputType',                            
							checkboxToggle:true,
							//title: this.outputTypeText,
							autoHeight: true,

							defaultType: 'radio', // each item will be a radio button
							items:[
								{boxLabel: 'Data' , name: 'outputtype', inputValue: 'data', disabled: true},
								{boxLabel: 'Chart', name: 'outputtype', inputValue: 'chart', checked: true}
							]
						},{ 
							fieldLabel: 'Season',
							xtype: 'nrl_seasonradiogroup',
							anchor:'100%'
						},{
							xtype:'nrl_single_aoi_selector',
							target:this.target,
							ref:'singleFeatureSelector',
							hilightLayerName: 'hilight_layer_selectAction',
							vendorParams: {cql_filter:this.areaFilter}
						},{
							xtype: 'singleyearcombobox',
							anchor:'100%'
							
						},new Ext.ux.grid.CheckboxSelectionGrid({
                            title:'Factors',
                            enableHdMenu:false,
                            hideHeaders:true,
                            autoHeight:true,
                            
							viewConfig: {forceFit: true},
                            columns: [{id:'name',mapping:'label',header:'Factor'}],
                            autoScroll:true,
                            store: new Ext.data.ArrayStore({
								fields:Ext.data.Record.create([{name:'name',mapping:'name'},{name:'label',mapping:'boxLabel'}]),
								data: [//TODO get it from remote services
                                    {boxLabel: 'NDVI' , name: 'NDVI', inputValue: 'NDVI'},
                                    {boxLabel: 'Max Temperature' , name: 'MaxTemperature', inputValue: 'MaxTemperature'},
                                    {boxLabel: 'Min Temperature' , name: 'MinTemperature', inputValue: 'MinTemperature'},
                                    {boxLabel: 'Precipitation' , name: 'Precipitation', inputValue: 'Precipitation'},
                                    {boxLabel: 'Canals Discharge' , name: 'canaldischarge', inputValue: 'canaldischarge'},
                                    {boxLabel: 'Hot Wave' , name: 'hotwave', inputValue: 'hotwave'},
                                    {boxLabel: 'Cold Wave' , name: 'coldwave', inputValue: 'coldwave'},
                                    {boxLabel: 'Wind Storm' , name: 'windstorm', inputValue: 'windstorm'},
                                    {boxLabel: 'Hail Storm' , name: 'hailstorm', inputValue: 'hailstorm'},
                                    {boxLabel: 'Flood' , name: 'Flood', inputValue: 'Flood'}
                                ]
							})
                        
                        })
					
					]
		};
		config = Ext.apply(cropStatus,config || {});
		
		this.output = gxp.plugins.nrl.CropStatus.superclass.addOutput.call(this, config);
		
		//hide selection layer on tab change
		this.output.on('beforehide',function(){
			var button = this.output.singleFeatureSelector.singleSelector.selectButton;
			button.toggle(false);
			var lyr = button.hilightLayer;
			if(!lyr) return;
			lyr.setVisibility(false);
			
		},this);
		this.output.on('show',function(){
			var button = this.output.singleFeatureSelector.singleSelector.selectButton;
			
			var lyr = button.hilightLayer;
			if(!lyr) return;
			lyr.setVisibility(true);
			
		},this);
		return this.output;
		
	}
 });
 Ext.preg(gxp.plugins.nrl.CropStatus.prototype.ptype, gxp.plugins.nrl.CropStatus);