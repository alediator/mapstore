/**
 * Copyright (c) 2008-2011 The Open Planning Project
 * 
 * Published under the GPL license.
 * See https://github.com/opengeo/gxp/raw/master/license.txt for the full text
 * of the license.
 */

/** api: (define)
 *  module = gxp
 *  class = PlanEditorPanel
 *  base_link = `Ext.Panel <http://dev.sencha.com/deploy/dev/docs/?class=Ext.Panel>`_
 */
Ext.namespace("gxp");

/** api: constructor
 *  .. class::PlanEditorPanel(config)
 *   
 *      create a panel to edit the plan
 */
gxp.PlanEditorPanel = Ext.extend(Ext.FormPanel, {

    /** api: xtype = gxp_planeditorpanel */
    xtype: "gxp_planeditorpanel",

    // default config
    layout: "form",

    /** i18n **/
    editButtonText: "Edit",
    saveButtonText: "Save",
    drawButtonText: "Draw",
    resetText: "Reset",
    serviceText: "Service",
    aoiText: "AOI",
    nameText: "Name",
    intervalText: "Interval",
    startText: "Start",
    endText: "End",
    sensorText: "Sensor",
    sensorModeText: "Mode",
    /** EoF i18n **/

    defaults: {
        anchor: "95%",
        style: {
            paddingLeft: "5px"
        }
    },

    // services available URL. TODO: implement custom backend
    servicesUrl: "http://84.33.2.24/opensdi2-manager/mvc/serviceManager/extJSbrowser?action=get_folderlist&folder=CLS",

    /** private: method[initComponent]
     *  Initialize the form panel.
     */
    initComponent: function() {

        var sensorStore = new Ext.data.ArrayStore({
            fields: [
                'id',
                'text'
            ],
            data: [['ESR1', 'ESR1'], ['ESR1', 'ESR2'], ['RS1', 'RS1'], ['RS2', 'RS2']]
        });

        var sensorModeStore = new Ext.data.ArrayStore({
            fields: [
                'id',
                'text'
            ],
            data: [['PRI', 'PRI'], ['FI', 'FI']]
        });

        this.items = [{
            xtype: "combo",
            fieldLabel: this.serviceText,
            name: "service",
            valueField: 'text',
            displayField: 'text',
            autoLoad : true,
            triggerAction : 'all',
            store: new Ext.data.JsonStore({
                url: this.servicesUrl,
                fields : ["id", "text", "leaf", "size", "iconCls", "loaded", "expanded", "mtime", "permission"]
            }),
            listeners : {
                select : function(c, record, index) {
                    var service = c.getValue();
                    this.fireEvent("selectservice", service, this);
                },
                scope : this
            }
        },{
            xtype: "fieldset",
            title: this.aoiText,
            items:[{
                xtype: "textfield",
                fieldLabel: this.nameText,
                name: "name"
            },{
                xtype: "fieldset",
                title: this.intervalText,
                items: [{
                    xtype: "compositefield",
                    fieldLabel: this.startText,
                    items:[{
                        xtype: "datefield",
                        name: "dateStart",
                        width: 100
                    },{
                        xtype: "timefield",
                        name: "timeStart",
                        flex: 1
                    }]
                },{
                    xtype: "compositefield",
                    fieldLabel: this.endText,
                    items:[{
                        xtype: "datefield",
                        name: "dateEnd",
                        width: 100
                    },{
                        xtype: "timefield",
                        name: "timeEnd",
                        flex: 1
                    }]
                }]
            },{
                xtype: "fieldset",
                title: this.sensorText,
                items: [{
                    xtype: "compositefield",
                    items:[{
                        xtype: "combo",
                        fieldLabel: this.sensorText,
                        triggerAction: 'all',
                        lazyRender:true,
                        mode: 'local',
                        valueField: 'id',
                        displayField: 'text',
                        store: sensorStore,
                        name: "sensor",
                        width: 60
                    },{
                        xtype: "combo",
                        fieldLabel: this.sensorModeText,
                        triggerAction: 'all',
                        lazyRender:true,
                        mode: 'local',
                        valueField: 'id',
                        displayField: 'text',
                        store: sensorModeStore,
                        name: "sensorMode",
                        flex: 1
                    }]
                }]
            }]
        }];
        
        this.buttons = [{
            text: this.editButtonText,
            handler: function() {
                this.fireEvent("edit");
            },
            scope: this
        },{
            text: this.saveButtonText,
            id: this.id + "_save_button",
            disabled: true,
            handler: function() {
                this.fireEvent("save", this.getForm());
            },
            scope: this
        },{
            text: this.drawButtonText,
            id: this.id + "_draw_button",
            handler: function() {
                var buttonId = this.id + "_draw_button";
                this.fireEvent("drawbutton", buttonId);
                Ext.getCmp(buttonId).disable(true);
            },
            scope: this
        },{
            text: this.resetText,
            scope: this,
            handler: function(){
                this.getForm().reset();
            }
        }];
        
        this.addEvents(

            /*
             * Event: edit
             * Fires upon on edit button clicked.
             */
            "edit",

            /*
             * Event: selectservice
             * Fires upon on service selection.
             * 
             * Listener arguments:
             * service - {String} Service id selected.
             * panel - {Object} This instance.
             */
            "selectservice",

            /*
             * Event: save
             * Fires upon on save.
             * 
             * Listener arguments:
             * form - {Object} this.getForm().
             */
            "save",

            /*
             * Event: save
             * Fires upon on save.
             * 
             * Listener arguments:
             * buttonId - {String} id button to be enabled if needed.
             */
            "drawbutton"
        ); 

        gxp.PlanEditorPanel.superclass.initComponent.call(this);  
    },

    reset: function(){
        this.getForm().reset();
    }

});

/** api: xtype = gxp_planeditorpanel */
Ext.reg(gxp.PlanEditorPanel.prototype.xtype, gxp.PlanEditorPanel);
